---
tags:
  - NES
---
# Building the 6502 CPU

The bus routes bytes. The cartridge holds them. Now we build the thing that actually thinks: the 6502 CPU.

This is where the assembly knowledge from Part 1 starts paying off. We are building an interpreter for the instructions the NES CPU understands.

The CPU does one thing in a loop, forever:

![](/posts/img/Pasted image 20260625211601.png)

```text
Fetch -> Decode -> Execute -> Repeat
```

- **Fetch**: read the next opcode from memory, wherever `PC` points.
- **Decode**: figure out which instruction it is and how to get its argument.
- **Execute**: do the thing: math, load, store, branch, jump, stack operation, and so on.
- **Repeat**: move to the next instruction and keep going.

Every NES game runs inside this loop.
## Registers

We covered these in Part 1, but now we need to represent them in C. Each register is just a value. An 8-bit register wraps at 256, and a 16-bit register wraps at 65536.

```c
// cpu.h
#ifndef CPU_H
#define CPU_H

#include <stdint.h>
#include <stdbool.h>
#include "bus.h"

typedef struct {
    // Registers
    uint8_t  a;      // Accumulator
    uint8_t  x;      // Index X
    uint8_t  y;      // Index Y
    uint8_t  sp;     // Stack Pointer
    uint16_t pc;     // Program Counter

    // Flags (Processor Status)
    bool flag_c;     // Carry
    bool flag_z;     // Zero
    bool flag_i;     // Interrupt Disable
    bool flag_d;     // Decimal (unused on NES, but tracked)
    bool flag_v;     // Overflow
    bool flag_n;     // Negative

    // Timing
    uint32_t cycles;
    uint8_t  extra_cycles;

    // Bus connection
    Bus *bus;
} CPU;

void    cpu_init(CPU *cpu, Bus *bus);
void    cpu_reset(CPU *cpu);
uint8_t cpu_step(CPU *cpu);
void    cpu_interrupt_nmi(CPU *cpu);
void    cpu_interrupt_irq(CPU *cpu);

#endif
```

Why not use a struct for each register? Because C already gives us the wrapping behavior we want:

```c
uint8_t x = 255;
x++;
// x is now 0
```

That is exactly what an 8-bit CPU register does.
## The Flags Register

The processor status register is one byte, but each bit inside it means something different:

```text
Bit:   7   6   5   4   3   2   1   0
Flag:  N   V   1   B   D   I   Z   C
```

- `C`: Carry
- `Z`: Zero
- `I`: Interrupt disable
- `D`: Decimal mode
- `B`: Break flag
- `V`: Overflow
- `N`: Negative

In the emulator, storing flags as individual bools is easier while executing instructions. But stack operations and interrupts need the flags packed into one byte, so we need helper functions.

```c
uint8_t cpu_get_flags(CPU *cpu) {
    return (cpu->flag_c ? 0x01 : 0) |
           (cpu->flag_z ? 0x02 : 0) |
           (cpu->flag_i ? 0x04 : 0) |
           (cpu->flag_d ? 0x08 : 0) |
           0x20 |                      // Bit 5 is always 1
           (cpu->flag_v ? 0x40 : 0) |
           (cpu->flag_n ? 0x80 : 0);
}

void cpu_set_flags(CPU *cpu, uint8_t value) {
    cpu->flag_c = (value & 0x01) != 0;
    cpu->flag_z = (value & 0x02) != 0;
    cpu->flag_i = (value & 0x04) != 0;
    cpu->flag_d = (value & 0x08) != 0;
    cpu->flag_v = (value & 0x40) != 0;
    cpu->flag_n = (value & 0x80) != 0;
}
```

Bit 5 is always set. Bit 4, the break flag, is weird because it is not really stored as a normal CPU flag. It mainly matters when the status register is pushed to the stack. `BRK` pushes it as `1`; hardware interrupts push it as `0`.

The packing works by OR-ing each flag into its bit position:

```c
flag_c = true  -> 0x01 = 0000 0001
flag_z = true  -> 0x02 = 0000 0010
flag_i = true  -> 0x04 = 0000 0100
flag_d = false -> 0x00 = 0000 0000
bit 5          -> 0x20 = 0010 0000
flag_v = true  -> 0x40 = 0100 0000
flag_n = false -> 0x00 = 0000 0000
```

Together:

```text
0000 0001
| 0000 0010
| 0000 0100
| 0000 0000
| 0010 0000
| 0100 0000
| 0000 0000
= 0110 0111 -> $67
```

Unpacking is the opposite. We use `&` to isolate one bit:

```c
value & 0x01   // carry bit
value & 0x02   // zero bit
value & 0x04   // interrupt-disable bit
value & 0x08   // decimal bit
value & 0x40   // overflow bit
value & 0x80   // negative bit
```

Most instructions update the zero and negative flags, so this helper gets used constantly:

```c
void cpu_update_zero_and_negative(CPU *cpu, uint8_t value) {
    cpu->flag_z = (value == 0);
    cpu->flag_n = (value & 0x80) != 0;
}
```

The zero flag is set when the result is exactly `0`. The negative flag is set when bit 7 is set, because bit 7 is the sign bit for signed 8-bit values.
## The Stack

The 6502 stack lives at `$0100` to `$01FF`. The stack pointer is only 8 bits, so the actual stack address is:

<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
  <!-- Title -->
  <text x="300" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#e0e0e0">6502 Stack — $0100 to $01FF</text>

  <!-- Memory cells -->
  <!-- $01FF -->
  <rect x="180" y="60" width="240" height="50" rx="4" fill="#2a4a7f" stroke="#4a8af4" stroke-width="1.5"/>
  <text x="200" y="90" font-size="14" fill="#f0c050">$01FF</text>
  <text x="340" y="90" font-size="16" fill="#ffffff" text-anchor="middle">$42</text>
  <text x="440" y="90" font-size="12" fill="#8888aa">← pushed 1st</text>

  <!-- $01FE -->
  <rect x="180" y="120" width="240" height="50" rx="4" fill="#2a4a7f" stroke="#4a8af4" stroke-width="1.5"/>
  <text x="200" y="150" font-size="14" fill="#f0c050">$01FE</text>
  <text x="340" y="150" font-size="16" fill="#ffffff" text-anchor="middle">$7C</text>
  <text x="440" y="150" font-size="12" fill="#8888aa">← pushed 2nd</text>

  <!-- $01FD (empty, SP points here) -->
  <rect x="180" y="180" width="240" height="50" rx="4" fill="#1a2a4f" stroke="#4a8af4" stroke-width="1.5" stroke-dasharray="6,3"/>
  <text x="200" y="210" font-size="14" fill="#f0c050">$01FD</text>
  <text x="340" y="210" font-size="14" fill="#555555" text-anchor="middle">(empty)</text>

  <!-- $01FC -->
  <rect x="180" y="240" width="240" height="50" rx="4" fill="#1a2a4f" stroke="#333355" stroke-width="1"/>
  <text x="200" y="270" font-size="14" fill="#666688">$01FC</text>
  <text x="340" y="270" font-size="14" fill="#555555" text-anchor="middle">(empty)</text>

  <!-- $01FB -->
  <rect x="180" y="300" width="240" height="50" rx="4" fill="#1a2a4f" stroke="#333355" stroke-width="1"/>
  <text x="200" y="330" font-size="14" fill="#666688">$01FB</text>
  <text x="340" y="330" font-size="14" fill="#555555" text-anchor="middle">(empty)</text>

  <!-- Dots for continuation -->
  <text x="300" y="380" text-anchor="middle" font-size="20" fill="#666688">···</text>

  <!-- $0100 -->
  <rect x="180" y="400" width="240" height="50" rx="4" fill="#1a2a4f" stroke="#333355" stroke-width="1"/>
  <text x="200" y="430" font-size="14" fill="#666688">$0100</text>
  <text x="340" y="430" font-size="14" fill="#555555" text-anchor="middle">(empty)</text>

  <!-- SP Arrow pointing to $01FD -->
  <line x1="130" y1="205" x2="175" y2="205" stroke="#ff6b6b" stroke-width="2.5" marker-end="url(#arrowRed)"/>
  <text x="60" y="200" font-size="14" font-weight="bold" fill="#ff6b6b">SP</text>
  <text x="42" y="218" font-size="12" fill="#ff9999">= $FD</text>

  <!-- Downward arrow showing growth direction -->
  <line x1="80" y1="280" x2="80" y2="380" stroke="#66cc66" stroke-width="2" marker-end="url(#arrowGreen)"/>
  <text x="80" y="270" text-anchor="middle" font-size="11" fill="#66cc66">grows</text>
  <text x="80" y="400" text-anchor="middle" font-size="11" fill="#66cc66">down</text>

  <!-- Arrow markers -->
  <defs>
    <marker id="arrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#ff6b6b"/>
    </marker>
    <marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#66cc66"/>
    </marker>
  </defs>

  <!-- Legend -->
  <rect x="180" y="465" width="12" height="12" rx="2" fill="#2a4a7f" stroke="#4a8af4" stroke-width="1"/>
  <text x="198" y="476" font-size="11" fill="#8888aa">= has data</text>
  <rect x="300" y="465" width="12" height="12" rx="2" fill="#1a2a4f" stroke="#333355" stroke-width="1" stroke-dasharray="4,2"/>
  <text x="318" y="476" font-size="11" fill="#8888aa">= empty</text>
</svg>

```c
0x0100 + cpu->sp
```

The stack grows downward. Pushing writes the value first, then decrements `SP`. Popping increments `SP` first, then reads the value.

```c
void cpu_push(CPU *cpu, uint8_t value) {
    bus_write(cpu->bus, 0x0100 + cpu->sp, value);
    cpu->sp--;
}

uint8_t cpu_pop(CPU *cpu) {
    cpu->sp++;
    return bus_read(cpu->bus, 0x0100 + cpu->sp);
}
```

For return addresses and interrupts, we also need 16-bit stack operations:

```c
void cpu_push16(CPU *cpu, uint16_t value) {
    cpu_push(cpu, (value >> 8) & 0xFF);   // high byte first
    cpu_push(cpu, value & 0xFF);          // low byte second
}

uint16_t cpu_pop16(CPU *cpu) {
    uint8_t lo = cpu_pop(cpu);
    uint8_t hi = cpu_pop(cpu);
    return (hi << 8) | lo;
}
```

The high byte is pushed first and the low byte second. When popping, the low byte comes back first.
## Addressing Modes

An instruction does not always use its argument the same way. `LDA #$42` loads the literal value `$42`, while `LDA $42` loads from memory address `$0042`.

That difference is the addressing mode.

```c
typedef enum {
    ADDR_IMPLICIT,
    ADDR_ACCUMULATOR,
    ADDR_IMMEDIATE,
    ADDR_ZERO_PAGE,
    ADDR_ZERO_PAGE_X,
    ADDR_ZERO_PAGE_Y,
    ADDR_ABSOLUTE,
    ADDR_ABSOLUTE_X,
    ADDR_ABSOLUTE_Y,
    ADDR_INDIRECT,
    ADDR_INDEXED_INDIRECT,   // ($ZP,X)
    ADDR_INDIRECT_INDEXED,   // ($ZP),Y
    ADDR_RELATIVE,
} AddressingMode;
```

The resolver takes an addressing mode, reads the operand bytes after the opcode, advances `PC`, and returns the effective address.

```c
uint16_t cpu_read16(CPU *cpu, uint16_t address) {
    uint8_t lo = bus_read(cpu->bus, address);
    uint8_t hi = bus_read(cpu->bus, address + 1);
    return (hi << 8) | lo;
}
```
### Implicit

```c
case ADDR_IMPLICIT:
    return 0;
```

Instructions like `INX`, `PHA`, `RTS`, and `NOP` already know what they operate on. They do not need an operand.
### Accumulator

```c
case ADDR_ACCUMULATOR:
    return 0;
```

Instructions like `ASL A`, `LSR A`, `ROL A`, and `ROR A` operate directly on the accumulator instead of memory.
### Immediate

```c
case ADDR_IMMEDIATE: {
    uint16_t addr = cpu->pc;
    cpu->pc++;
    return addr;
}
```

In `LDA #$42`, the value `$42` is stored right after the opcode. We return the address of that byte, then the instruction reads it.
### Zero Page

```c
case ADDR_ZERO_PAGE: {
    uint8_t addr = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    return addr;
}
```

Zero page means the first 256 bytes of memory: `$0000` to `$00FF`. The operand is only one byte, so it directly becomes the low byte of the address.
### Zero Page,X

```c
case ADDR_ZERO_PAGE_X: {
    uint8_t base = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    return (base + cpu->x) & 0xFF;
}
```

The `& 0xFF` matters. Zero page indexing wraps inside zero page. If the base is `$80` and `X` is `$FF`, the result is `$7F`, not `$017F`
### Zero Page,Y

```c
case ADDR_ZERO_PAGE_Y: {
    uint8_t base = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    return (base + cpu->y) & 0xFF;
}
```

Same idea as zero page,X, but using the `Y` register.
### Absolute

```c
case ADDR_ABSOLUTE: {
    uint16_t addr = cpu_read16(cpu, cpu->pc);
    cpu->pc += 2;
    return addr;
}
```

Absolute mode reads a full 16-bit address from the next two bytes. The 6502 is little-endian, so the low byte comes first.
### Absolute,X

```c
case ADDR_ABSOLUTE_X: {
    uint16_t base = cpu_read16(cpu, cpu->pc);
    cpu->pc += 2;
    uint16_t addr = base + cpu->x;
    *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
    return addr;
}
```

This reads a 16-bit base address, adds `X`, and checks whether the high byte changed. If `$40FF + 1` becomes `$4100`, a page boundary was crossed.

Some instructions cost one extra cycle when this happens.
### Absolute,Y

```c
case ADDR_ABSOLUTE_Y: {
    uint16_t base = cpu_read16(cpu, cpu->pc);
    cpu->pc += 2;
    uint16_t addr = base + cpu->y;
    *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
    return addr;
}
```

Same as absolute,X, but using `Y`.
### Indirect

```c
case ADDR_INDIRECT: {
    uint16_t ptr = cpu_read16(cpu, cpu->pc);
    cpu->pc += 2;

    if ((ptr & 0x00FF) == 0x00FF) {
        uint8_t lo = bus_read(cpu->bus, ptr);
        uint8_t hi = bus_read(cpu->bus, ptr & 0xFF00);
        return (hi << 8) | lo;
    }

    return cpu_read16(cpu, ptr);
}
```

`JMP ($4080)` reads the address stored at `$4080/$4081`, then jumps there.

The `if` block emulates the 6502 indirect jump hardware bug. If the pointer is at the end of a page, like `$30FF`, the CPU reads the low byte from `$30FF` and the high byte from `$3000`, not `$3100`.

Real games can depend on this behavior, so we emulate the bug too.
### Indexed Indirect: `($ZP,X)`

```c
case ADDR_INDEXED_INDIRECT: {
    uint8_t base = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    uint8_t ptr = (base + cpu->x) & 0xFF;
    uint8_t lo = bus_read(cpu->bus, ptr);
    uint8_t hi = bus_read(cpu->bus, (ptr + 1) & 0xFF);
    return (hi << 8) | lo;
}
```

This adds `X` first, then uses the result as a zero page pointer.

For `STA ($01,X)` with `X = 2`:

1. Read base `$01`.
2. Add `X`, giving `$03`.
3. Read the target address from `$0003/$0004`.

The high byte lookup also wraps in zero page.
### Indirect Indexed: `($ZP),Y`

```c
case ADDR_INDIRECT_INDEXED: {
    uint8_t ptr = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    uint8_t lo = bus_read(cpu->bus, ptr);
    uint8_t hi = bus_read(cpu->bus, (ptr + 1) & 0xFF);
    uint16_t base = (hi << 8) | lo;
    uint16_t addr = base + cpu->y;
    *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
    return addr;
}
```

This does the indirect lookup first, then adds `Y`.

For `LDA ($03),Y`:

1. Read pointer `$03`.
2. Read the base address from `$0003/$0004`.
3. Add `Y`.

This mode can also cross a page boundary.
### Relative

```c
case ADDR_RELATIVE: {
    uint8_t offset = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;
    return cpu->pc + (int8_t)offset;
}
```

Branches use signed offsets. Values `0` to `127` jump forward. Values `128` to `255` represent `-128` to `-1`, so they jump backward.

The cast to `int8_t` is the trick that turns `$FE` into `-2`.
## Full Address Resolver

```c
uint16_t cpu_resolve_address(CPU *cpu, AddressingMode mode, bool *page_crossed) {
    *page_crossed = false;

    switch (mode) {
    case ADDR_IMPLICIT:
    case ADDR_ACCUMULATOR:
        return 0;

    case ADDR_IMMEDIATE: {
        uint16_t addr = cpu->pc;
        cpu->pc++;
        return addr;
    }

    case ADDR_ZERO_PAGE: {
        uint8_t addr = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        return addr;
    }

    case ADDR_ZERO_PAGE_X: {
        uint8_t base = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        return (base + cpu->x) & 0xFF;
    }

    case ADDR_ZERO_PAGE_Y: {
        uint8_t base = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        return (base + cpu->y) & 0xFF;
    }

    case ADDR_ABSOLUTE: {
        uint16_t addr = cpu_read16(cpu, cpu->pc);
        cpu->pc += 2;
        return addr;
    }

    case ADDR_ABSOLUTE_X: {
        uint16_t base = cpu_read16(cpu, cpu->pc);
        cpu->pc += 2;
        uint16_t addr = base + cpu->x;
        *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
        return addr;
    }

    case ADDR_ABSOLUTE_Y: {
        uint16_t base = cpu_read16(cpu, cpu->pc);
        cpu->pc += 2;
        uint16_t addr = base + cpu->y;
        *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
        return addr;
    }

    case ADDR_INDIRECT: {
        uint16_t ptr = cpu_read16(cpu, cpu->pc);
        cpu->pc += 2;

        if ((ptr & 0x00FF) == 0x00FF) {
            uint8_t lo = bus_read(cpu->bus, ptr);
            uint8_t hi = bus_read(cpu->bus, ptr & 0xFF00);
            return (hi << 8) | lo;
        }

        return cpu_read16(cpu, ptr);
    }

    case ADDR_INDEXED_INDIRECT: {
        uint8_t base = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        uint8_t ptr = (base + cpu->x) & 0xFF;
        uint8_t lo = bus_read(cpu->bus, ptr);
        uint8_t hi = bus_read(cpu->bus, (ptr + 1) & 0xFF);
        return (hi << 8) | lo;
    }

    case ADDR_INDIRECT_INDEXED: {
        uint8_t ptr = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        uint8_t lo = bus_read(cpu->bus, ptr);
        uint8_t hi = bus_read(cpu->bus, (ptr + 1) & 0xFF);
        uint16_t base = (hi << 8) | lo;
        uint16_t addr = base + cpu->y;
        *page_crossed = ((base & 0xFF00) != (addr & 0xFF00));
        return addr;
    }

    case ADDR_RELATIVE: {
        uint8_t offset = bus_read(cpu->bus, cpu->pc);
        cpu->pc++;
        return cpu->pc + (int8_t)offset;
    }
    }

    return 0;
}
```
## The Opcode Table

An opcode is an instruction plus an addressing mode.

`LDA #$44` is `LDA immediate`, opcode `$A9`.

`LDA $4400` is `LDA absolute`, opcode `$AD`.

Same instruction, different addressing mode, different opcode byte.

```c
typedef void (*InstructionFunc)(CPU *cpu, uint16_t address, AddressingMode mode);

typedef struct {
    const char *name;
    InstructionFunc execute;
    AddressingMode mode;
    uint8_t cycles;
    bool page_cross_penalty;
} Opcode;

static Opcode opcodes[256];
```

Then we fill the table:

```c
void cpu_init_opcodes(void) {
    memset(opcodes, 0, sizeof(opcodes));

    // Arithmetic
    opcodes[0x69] = (Opcode){"ADC", op_adc, ADDR_IMMEDIATE,        2, false};
    opcodes[0x65] = (Opcode){"ADC", op_adc, ADDR_ZERO_PAGE,        3, false};
    opcodes[0x75] = (Opcode){"ADC", op_adc, ADDR_ZERO_PAGE_X,      4, false};
    opcodes[0x6D] = (Opcode){"ADC", op_adc, ADDR_ABSOLUTE,         4, false};
    opcodes[0x7D] = (Opcode){"ADC", op_adc, ADDR_ABSOLUTE_X,       4, true};
    opcodes[0x79] = (Opcode){"ADC", op_adc, ADDR_ABSOLUTE_Y,       4, true};
    opcodes[0x61] = (Opcode){"ADC", op_adc, ADDR_INDEXED_INDIRECT, 6, false};
    opcodes[0x71] = (Opcode){"ADC", op_adc, ADDR_INDIRECT_INDEXED, 5, true};

    // Load
    opcodes[0xA9] = (Opcode){"LDA", op_lda, ADDR_IMMEDIATE,        2, false};
    opcodes[0xA5] = (Opcode){"LDA", op_lda, ADDR_ZERO_PAGE,        3, false};
    opcodes[0xB5] = (Opcode){"LDA", op_lda, ADDR_ZERO_PAGE_X,      4, false};
    opcodes[0xAD] = (Opcode){"LDA", op_lda, ADDR_ABSOLUTE,         4, false};
    opcodes[0xBD] = (Opcode){"LDA", op_lda, ADDR_ABSOLUTE_X,       4, true};
    opcodes[0xB9] = (Opcode){"LDA", op_lda, ADDR_ABSOLUTE_Y,       4, true};
    opcodes[0xA1] = (Opcode){"LDA", op_lda, ADDR_INDEXED_INDIRECT, 6, false};
    opcodes[0xB1] = (Opcode){"LDA", op_lda, ADDR_INDIRECT_INDEXED, 5, true};

    // Store
    opcodes[0x85] = (Opcode){"STA", op_sta, ADDR_ZERO_PAGE,        3, false};
    opcodes[0x95] = (Opcode){"STA", op_sta, ADDR_ZERO_PAGE_X,      4, false};
    opcodes[0x8D] = (Opcode){"STA", op_sta, ADDR_ABSOLUTE,         4, false};
    opcodes[0x9D] = (Opcode){"STA", op_sta, ADDR_ABSOLUTE_X,       5, false};
    opcodes[0x99] = (Opcode){"STA", op_sta, ADDR_ABSOLUTE_Y,       5, false};
    opcodes[0x81] = (Opcode){"STA", op_sta, ADDR_INDEXED_INDIRECT, 6, false};
    opcodes[0x91] = (Opcode){"STA", op_sta, ADDR_INDIRECT_INDEXED, 6, false};

    // Branches
    opcodes[0x90] = (Opcode){"BCC", op_bcc, ADDR_RELATIVE, 2, false};
    opcodes[0xB0] = (Opcode){"BCS", op_bcs, ADDR_RELATIVE, 2, false};
    opcodes[0xF0] = (Opcode){"BEQ", op_beq, ADDR_RELATIVE, 2, false};
    opcodes[0xD0] = (Opcode){"BNE", op_bne, ADDR_RELATIVE, 2, false};
    opcodes[0x30] = (Opcode){"BMI", op_bmi, ADDR_RELATIVE, 2, false};
    opcodes[0x10] = (Opcode){"BPL", op_bpl, ADDR_RELATIVE, 2, false};
    opcodes[0x50] = (Opcode){"BVC", op_bvc, ADDR_RELATIVE, 2, false};
    opcodes[0x70] = (Opcode){"BVS", op_bvs, ADDR_RELATIVE, 2, false};

    // Jumps and system
    opcodes[0x4C] = (Opcode){"JMP", op_jmp, ADDR_ABSOLUTE, 3, false};
    opcodes[0x6C] = (Opcode){"JMP", op_jmp, ADDR_INDIRECT, 5, false};
    opcodes[0x20] = (Opcode){"JSR", op_jsr, ADDR_ABSOLUTE, 6, false};
    opcodes[0x60] = (Opcode){"RTS", op_rts, ADDR_IMPLICIT, 6, false};
    opcodes[0x40] = (Opcode){"RTI", op_rti, ADDR_IMPLICIT, 6, false};
    opcodes[0x00] = (Opcode){"BRK", op_brk, ADDR_IMPLICIT, 7, false};
    opcodes[0xEA] = (Opcode){"NOP", op_nop, ADDR_IMPLICIT, 2, false};
}
```

This table shows the pattern. The real implementation needs every official 6502 opcode filled in before `nestest` will pass. Unofficial opcodes can come later.
## Implementing Instructions

Each instruction is just a C function.
### Load and Store

```c
static void op_lda(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    cpu->a = bus_read(cpu->bus, addr);
    cpu_update_zero_and_negative(cpu, cpu->a);
}

static void op_ldx(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    cpu->x = bus_read(cpu->bus, addr);
    cpu_update_zero_and_negative(cpu, cpu->x);
}

static void op_ldy(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    cpu->y = bus_read(cpu->bus, addr);
    cpu_update_zero_and_negative(cpu, cpu->y);
}

static void op_sta(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    bus_write(cpu->bus, addr, cpu->a);
}

static void op_stx(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    bus_write(cpu->bus, addr, cpu->x);
}

static void op_sty(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    bus_write(cpu->bus, addr, cpu->y);
}
```

Immediate mode still uses `bus_read()`. The resolver returns the address of the immediate byte, so the instruction reads from that address like every other load.
### Arithmetic

`ADC` adds a value to `A`, plus the carry flag.

```c
static void op_adc(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr);
    uint8_t old_a = cpu->a;
    uint16_t result = old_a + val + (cpu->flag_c ? 1 : 0);

    cpu->a = result & 0xFF;
    cpu_update_zero_and_negative(cpu, cpu->a);

    cpu->flag_c = (result > 0xFF);
    cpu->flag_v = ((~(old_a ^ val) & (old_a ^ cpu->a)) & 0x80) != 0;
}
```

Carry means unsigned overflow. Overflow means signed overflow.

`SBC` works as `A + ~value + carry`:

```c
static void op_sbc(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr);
    uint8_t old_a = cpu->a;
    uint16_t result = old_a + (val ^ 0xFF) + (cpu->flag_c ? 1 : 0);

    cpu->a = result & 0xFF;
    cpu_update_zero_and_negative(cpu, cpu->a);
    cpu->flag_c = (result > 0xFF);
    cpu->flag_v = ((~(old_a ^ (val ^ 0xFF)) & (old_a ^ cpu->a)) & 0x80) != 0;
}
```
### Increment and Decrement

```c
static void op_inx(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->x++;
    cpu_update_zero_and_negative(cpu, cpu->x);
}

static void op_iny(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->y++;
    cpu_update_zero_and_negative(cpu, cpu->y);
}

static void op_dex(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->x--;
    cpu_update_zero_and_negative(cpu, cpu->x);
}

static void op_dey(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->y--;
    cpu_update_zero_and_negative(cpu, cpu->y);
}

static void op_inc(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr) + 1;
    bus_write(cpu->bus, addr, val);
    cpu_update_zero_and_negative(cpu, val);
}

static void op_dec(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr) - 1;
    bus_write(cpu->bus, addr, val);
    cpu_update_zero_and_negative(cpu, val);
}
```
### Shifts and Rotates

```c
static void op_asl(CPU *cpu, uint16_t addr, AddressingMode mode) {
    uint8_t val = (mode == ADDR_ACCUMULATOR) ? cpu->a : bus_read(cpu->bus, addr);
    cpu->flag_c = (val & 0x80) != 0;
    val <<= 1;

    if (mode == ADDR_ACCUMULATOR) cpu->a = val;
    else bus_write(cpu->bus, addr, val);

    cpu_update_zero_and_negative(cpu, val);
}

static void op_lsr(CPU *cpu, uint16_t addr, AddressingMode mode) {
    uint8_t val = (mode == ADDR_ACCUMULATOR) ? cpu->a : bus_read(cpu->bus, addr);
    cpu->flag_c = (val & 0x01) != 0;
    val >>= 1;

    if (mode == ADDR_ACCUMULATOR) cpu->a = val;
    else bus_write(cpu->bus, addr, val);

    cpu_update_zero_and_negative(cpu, val);
}
```

`ASL` shifts left and moves old bit 7 into carry. `LSR` shifts right and moves old bit 0 into carry.

```c
static void op_rol(CPU *cpu, uint16_t addr, AddressingMode mode) {
    uint8_t val = (mode == ADDR_ACCUMULATOR) ? cpu->a : bus_read(cpu->bus, addr);
    bool old_carry = cpu->flag_c;
    cpu->flag_c = (val & 0x80) != 0;
    val = (val << 1) | (old_carry ? 1 : 0);

    if (mode == ADDR_ACCUMULATOR) cpu->a = val;
    else bus_write(cpu->bus, addr, val);

    cpu_update_zero_and_negative(cpu, val);
}

static void op_ror(CPU *cpu, uint16_t addr, AddressingMode mode) {
    uint8_t val = (mode == ADDR_ACCUMULATOR) ? cpu->a : bus_read(cpu->bus, addr);
    bool old_carry = cpu->flag_c;
    cpu->flag_c = (val & 0x01) != 0;
    val = (val >> 1) | (old_carry ? 0x80 : 0);

    if (mode == ADDR_ACCUMULATOR) cpu->a = val;
    else bus_write(cpu->bus, addr, val);

    cpu_update_zero_and_negative(cpu, val);
}
```

Rotates are shifts that pull the old carry bit back into the value.
### Comparison

Compare instructions subtract internally, but they do not store the result.

```c
static void op_cmp(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr);
    uint8_t result = cpu->a - val;
    cpu->flag_c = (cpu->a >= val);
    cpu_update_zero_and_negative(cpu, result);
}

static void op_cpx(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr);
    uint8_t result = cpu->x - val;
    cpu->flag_c = (cpu->x >= val);
    cpu_update_zero_and_negative(cpu, result);
}

static void op_cpy(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    uint8_t val = bus_read(cpu->bus, addr);
    uint8_t result = cpu->y - val;
    cpu->flag_c = (cpu->y >= val);
    cpu_update_zero_and_negative(cpu, result);
}
```
### Branching

Branches are special for timing:

- Base cost is 2 cycles.
- If the branch is taken, add 1 cycle.
- If the taken branch crosses a page, add 1 more cycle.

```c
static void branch_if(CPU *cpu, uint16_t addr, bool condition) {
    if (condition) {
        cpu->extra_cycles++;

        if ((cpu->pc & 0xFF00) != (addr & 0xFF00)) {
            cpu->extra_cycles++;
        }

        cpu->pc = addr;
    }
}
```

Then each branch just checks one condition:

```c
static void op_bcc(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, !cpu->flag_c);
}

static void op_bcs(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, cpu->flag_c);
}

static void op_beq(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, cpu->flag_z);
}

static void op_bne(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, !cpu->flag_z);
}

static void op_bmi(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, cpu->flag_n);
}

static void op_bpl(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, !cpu->flag_n);
}

static void op_bvc(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, !cpu->flag_v);
}

static void op_bvs(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    branch_if(cpu, addr, cpu->flag_v);
}
```
### Jumps, Subroutines, and Stack

```c
static void op_jmp(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    cpu->pc = addr;
}

static void op_jsr(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)mode;
    cpu_push16(cpu, cpu->pc - 1);
    cpu->pc = addr;
}

static void op_rts(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->pc = cpu_pop16(cpu) + 1;
}

static void op_rti(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu_set_flags(cpu, cpu_pop(cpu));
    cpu->pc = cpu_pop16(cpu);
}
```

`JSR` pushes `PC - 1`, and `RTS` pops that value and adds `1`. This is one of those 6502 details that looks strange until you test against real behavior.

`RTI` is different. It restores the exact program counter from the stack.

```c
static void op_pha(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu_push(cpu, cpu->a);
}

static void op_pla(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->a = cpu_pop(cpu);
    cpu_update_zero_and_negative(cpu, cpu->a);
}

static void op_php(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu_push(cpu, cpu_get_flags(cpu) | 0x10);
}

static void op_plp(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu_set_flags(cpu, cpu_pop(cpu));
}
```
### System

```c
static void op_nop(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)cpu;
    (void)addr;
    (void)mode;
}

static void op_brk(CPU *cpu, uint16_t addr, AddressingMode mode) {
    (void)addr;
    (void)mode;
    cpu->pc++;
    cpu_push16(cpu, cpu->pc);
    cpu_push(cpu, cpu_get_flags(cpu) | 0x10);
    cpu->flag_i = true;
    cpu->pc = cpu_read16(cpu, 0xFFFE);
}
```

`BRK` acts like a software interrupt. It pushes the return address, pushes flags with the break bit set, enables interrupt-disable, then jumps to the IRQ/BRK vector at `$FFFE`.
## Interrupts

The NES has three important CPU vectors:

| Interrupt | Vector  | Trigger                       | Maskable |
| --------- | ------- | ----------------------------- | -------- |
| NMI       | `$FFFA` | PPU enters VBlank             | No       |
| RESET     | `$FFFC` | Power on or reset             | No       |
| IRQ/BRK   | `$FFFE` | APU, mapper hardware, or BRK  | Yes      |

<svg viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg" font-family="monospace">

  <!-- Background -->
  <rect x="0" y="0" width="900" height="260" fill="#0d1117"/>

  <!-- Title -->
  <text x="450" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#e6edf3">Interrupt Flow</text>

  <!-- Step 1: Running code -->
  <rect x="20" y="70" width="140" height="60" rx="6" fill="#1f3a5f" stroke="#4a8af4" stroke-width="1.5"/>
  <text x="90" y="95" text-anchor="middle" font-size="13" fill="#ffffff">Running</text>
  <text x="90" y="113" text-anchor="middle" font-size="13" fill="#ffffff">code</text>

  <!-- Arrow 1 -->
  <line x1="160" y1="100" x2="200" y2="100" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 2: Interrupt fires -->
  <rect x="200" y="70" width="140" height="60" rx="6" fill="#5f3a1f" stroke="#f4a84a" stroke-width="1.5"/>
  <text x="270" y="95" text-anchor="middle" font-size="13" fill="#ffffff">Interrupt</text>
  <text x="270" y="113" text-anchor="middle" font-size="13" fill="#ffffff">fires (NMI/IRQ)</text>

  <!-- Arrow 2 -->
  <line x1="340" y1="100" x2="380" y2="100" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 3: Push PC & flags -->
  <rect x="380" y="70" width="160" height="60" rx="6" fill="#2a4a3f" stroke="#4af48a" stroke-width="1.5"/>
  <text x="460" y="90" text-anchor="middle" font-size="12" fill="#ffffff">Push PC &amp; flags</text>
  <text x="460" y="108" text-anchor="middle" font-size="12" fill="#ffffff">to stack</text>

  <!-- Arrow 3 -->
  <line x1="540" y1="100" x2="580" y2="100" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 4: Jump to vector -->
  <rect x="580" y="70" width="160" height="60" rx="6" fill="#3a2a5f" stroke="#a84af4" stroke-width="1.5"/>
  <text x="660" y="90" text-anchor="middle" font-size="12" fill="#ffffff">Jump to vector</text>
  <text x="660" y="108" text-anchor="middle" font-size="11" fill="#cccccc">($FFFA/C/E)</text>

  <!-- Arrow down from vector to handler -->
  <line x1="660" y1="130" x2="660" y2="170" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 5: Handler runs -->
  <rect x="580" y="170" width="160" height="60" rx="6" fill="#5f1f3a" stroke="#f44a8a" stroke-width="1.5"/>
  <text x="660" y="195" text-anchor="middle" font-size="13" fill="#ffffff">Handler</text>
  <text x="660" y="213" text-anchor="middle" font-size="13" fill="#ffffff">runs</text>

  <!-- Arrow left from handler to RTI -->
  <line x1="580" y1="200" x2="460" y2="200" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 6: RTI -->
  <rect x="320" y="170" width="140" height="60" rx="6" fill="#2a3a5f" stroke="#4a6af4" stroke-width="1.5"/>
  <text x="390" y="195" text-anchor="middle" font-size="13" fill="#ffffff">RTI</text>
  <text x="390" y="213" text-anchor="middle" font-size="11" fill="#cccccc">(pop flags &amp; PC)</text>

  <!-- Arrow left from RTI to Resume -->
  <line x1="320" y1="200" x2="200" y2="200" stroke="#888899" stroke-width="2" marker-end="url(#arrow)"/>

  <!-- Step 7: Resume original code -->
  <rect x="20" y="170" width="160" height="60" rx="6" fill="#1f3a5f" stroke="#4a8af4" stroke-width="1.5"/>
  <text x="100" y="190" text-anchor="middle" font-size="12" fill="#ffffff">Resume</text>
  <text x="100" y="208" text-anchor="middle" font-size="12" fill="#ffffff">original code</text>

  <!-- Loop arrow back up to "Running code" -->
  <path d="M 100 170 L 100 145 L 90 145 L 90 130" stroke="#666677" stroke-width="1.5" fill="none" stroke-dasharray="4,3" marker-end="url(#arrowDim)"/>

  <!-- Arrow marker definitions -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
      <polygon points="0 0, 10 4, 0 8" fill="#888899"/>
    </marker>
    <marker id="arrowDim" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
      <polygon points="0 0, 10 4, 0 8" fill="#666677"/>
    </marker>
  </defs>

</svg>

The vector is a memory location that stores the address of the interrupt handler.

```c
void cpu_interrupt_nmi(CPU *cpu) {
    cpu_push16(cpu, cpu->pc);
    cpu_push(cpu, cpu_get_flags(cpu) & ~0x10);
    cpu->flag_i = true;
    cpu->pc = cpu_read16(cpu, 0xFFFA);
    cpu->cycles += 7;
}

void cpu_interrupt_irq(CPU *cpu) {
    if (cpu->flag_i) return;

    cpu_push16(cpu, cpu->pc);
    cpu_push(cpu, cpu_get_flags(cpu) & ~0x10);
    cpu->flag_i = true;
    cpu->pc = cpu_read16(cpu, 0xFFFE);
    cpu->cycles += 7;
}

void cpu_reset(CPU *cpu) {
    cpu->a = 0;
    cpu->x = 0;
    cpu->y = 0;
    cpu->sp = 0xFD;
    cpu_set_flags(cpu, 0x24);
    cpu->pc = cpu_read16(cpu, 0xFFFC);
    cpu->cycles = 7;
}
```

The reset vector is why Super Mario Bros starts executing at `$8000`: `$FFFC/$FFFD` in the cartridge ROM contain `$00 $80`.

For now this assumes a simple NROM cartridge. Later mappers will control how CPU addresses map into PRG-ROM and PRG-RAM.
## The Fetch Decode Execute Loop

Everything comes together in `cpu_step()`.

```c
uint8_t cpu_step(CPU *cpu) {
    // Fetch
    uint8_t opcode_byte = bus_read(cpu->bus, cpu->pc);
    cpu->pc++;

    Opcode *op = &opcodes[opcode_byte];
    if (op->execute == NULL) {
        fprintf(stderr, "Invalid opcode: $%02X at $%04X\n",
                opcode_byte, cpu->pc - 1);
        return 0;
    }

    // Decode
    bool page_crossed = false;
    uint16_t address = cpu_resolve_address(cpu, op->mode, &page_crossed);

    // Execute
    cpu->extra_cycles = 0;
    op->execute(cpu, address, op->mode);

    // Timing
    uint8_t total_cycles = op->cycles + cpu->extra_cycles;
    if (page_crossed && op->page_cross_penalty) {
        total_cycles++;
    }

    cpu->cycles += total_cycles;
    return total_cycles;
}
```

That is the core CPU loop:

1. Read an opcode.
2. Look it up in the opcode table.
3. Resolve the addressing mode.
4. Run the instruction.
5. Count cycles.

Call `cpu_step()` repeatedly and the emulator starts executing 6502 code.
## Compiling and Running the Current Test

Before testing with `nestest`, the emulator should still compile cleanly with the files we have so far.

Now update `main.c` so it tests the CPU too:

```c
// main.c
#include <stdio.h>
#include "bus.h"
#include "cartridge.h"
#include "cpu.h"

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <rom.nes>\n", argv[0]);
        return 1;
    }

    Cartridge *cart = cartridge_load(argv[1]);
    if (!cart) return 1;

    printf("ROM loaded successfully!\n");
    printf("  PRG-ROM: %d KB (%d pages)\n", cart->prg_rom_size / 1024, cart->prg_rom_pages);
    printf("  CHR-%s: %d KB (%d pages)\n",
           cart->uses_chr_ram ? "RAM" : "ROM",
           cart->chr_rom_size / 1024,
           cart->chr_rom_pages);
    printf("  Mapper:     %d\n", cart->mapper_id);
    printf("  Mirroring:  %s\n", cart->mirroring ? "vertical" : "horizontal");
    printf("  Battery:    %s\n\n", cart->has_battery ? "yes" : "no");

    Bus bus;
    bus_init(&bus);
    bus_load_cartridge(&bus, cart);

    // --- Test RAM mirroring ---
    printf("RAM Mirroring Test\n");
    bus_write(&bus, 0x0000, 0x42);
    printf("Write $42 to $0000\n");
    printf("Read $0000: $%02X\n", bus_read(&bus, 0x0000));
    printf("Read $0800: $%02X\n", bus_read(&bus, 0x0800));
    printf("Read $1000: $%02X\n", bus_read(&bus, 0x1000));
    printf("Read $1800: $%02X\n", bus_read(&bus, 0x1800));

    // --- Test cartridge read ---
    printf("\nCartridge Test\n");
    printf("First PRG-ROM byte at $8000: $%02X\n", bus_read(&bus, 0x8000));

    // --- Test controller ---
    printf("\nController Test\n");

    bus.ctrl[0]->buttons[0] = true;  // A
    bus.ctrl[0]->buttons[3] = true;  // Start

    bus_write(&bus, 0x4016, 1);
    bus_write(&bus, 0x4016, 0);

    const char *btn_names[] = {"A", "B", "Select", "Start", "Up", "Down", "Left", "Right"};
    for (int i = 0; i < 8; i++) {
        uint8_t state = bus_read(&bus, 0x4016);
        printf("Button %s: %d\n", btn_names[i], state);
    }

    // --- Test CPU ---
    printf("\nCPU Test\n");

    CPU cpu;
    cpu_init(&cpu, &bus);
    cpu.pc = 0x0000;
    cpu.sp = 0xFD;
    cpu_set_flags(&cpu, 0x24);

    // LDA #$10
    // STA $20
    // INX
    // ADC #$05
    // BNE +2
    // LDA #$00   (skipped)
    bus_write(&bus, 0x0000, 0xA9);
    bus_write(&bus, 0x0001, 0x10);
    bus_write(&bus, 0x0002, 0x85);
    bus_write(&bus, 0x0003, 0x20);
    bus_write(&bus, 0x0004, 0xE8);
    bus_write(&bus, 0x0005, 0x69);
    bus_write(&bus, 0x0006, 0x05);
    bus_write(&bus, 0x0007, 0xD0);
    bus_write(&bus, 0x0008, 0x02);
    bus_write(&bus, 0x0009, 0xA9);
    bus_write(&bus, 0x000A, 0x00);

    for (int i = 0; i < 5; i++) {
        uint8_t used_cycles = cpu_step(&cpu);
        printf("Step %d: PC=$%04X A=$%02X X=$%02X Y=$%02X P=$%02X SP=$%02X cycles=%u\n",
               i + 1,
               cpu.pc,
               cpu.a,
               cpu.x,
               cpu.y,
               cpu_get_flags(&cpu),
               cpu.sp,
               used_cycles);
    }
    printf("RAM[$20]: $%02X\n", bus_read(&bus, 0x0020));

    cartridge_free(cart);
    return 0;
}
```

The small CPU program we write into RAM is:

```asm
LDA #$10
STA $20
INX
ADC #$05
BNE +2
LDA #$00   ; skipped
```

It is just a tiny controlled program so we can prove fetch, decode, execute, flags, branching, cycles, and bus reads/writes are working together.

From the project folder:

```bash
gcc -Wall -Wextra -std=c11 -o nes_emu main.c bus.c cartridge.c controller.c cpu.c
```

If the compile succeeds, `gcc` prints nothing. No output is good output here.

Then run the current ROM loading and bus smoke test:

```bash
./nes_emu super_mario.nes
```

Current output:

```text
ROM loaded successfully!
  PRG-ROM: 32 KB (2 pages)
  CHR-ROM: 8 KB (1 pages)
  Mapper:     0
  Mirroring:  vertical
  Battery:    no

RAM Mirroring Test
Write $42 to $0000
Read $0000: $42
Read $0800: $42
Read $1000: $42
Read $1800: $42

Cartridge Test
First PRG-ROM byte at $8000: $78

Controller Test
Button A: 1
Button B: 0
Button Select: 0
Button Start: 1
Button Up: 0
Button Down: 0
Button Left: 0
Button Right: 0

CPU Test
Step 1: PC=$0002 A=$10 X=$00 Y=$00 P=$24 SP=$FD cycles=2
Step 2: PC=$0004 A=$10 X=$00 Y=$00 P=$24 SP=$FD cycles=3
Step 3: PC=$0005 A=$10 X=$01 Y=$00 P=$24 SP=$FD cycles=2
Step 4: PC=$0007 A=$15 X=$01 Y=$00 P=$24 SP=$FD cycles=2
Step 5: PC=$000B A=$15 X=$01 Y=$00 P=$24 SP=$FD cycles=3
RAM[$20]: $10
```

After the test:

- `A` is `$15`, because `$10 + $05 = $15`
- `X` is `$01`, because `INX` ran once
- `RAM[$20]` is `$10`, because `STA $20` stored the accumulator
- `PC` ends at `$000B`, because `BNE` skipped over `LDA #$00`
## Testing Against the Golden Log

At this point the CPU looks reasonable, but "looks reasonable" is not enough for an emulator. One wrong flag or one missing cycle can break a game in a way that is painful to debug later.

The standard test ROM for this stage is `nestest.nes`. It runs a long sequence of 6502 instructions and records the CPU state after each one. The NES community also has a known-good output file, usually called `nestest.log`. 

The idea is simple:

1. Run the emulator with `nestest.nes`.
2. Start execution at `$C000`.
3. After every instruction, print the CPU state.
4. Compare the output line by line with the golden log.

For now I made a small smoke runner called `nestest_smoke.c`. It does not try to pass the full log yet. It only starts the CPU in the same state as the golden log and prints trace lines until the current CPU hits an unsupported opcode.

```c
// nestest_smoke.c
#include <stdio.h>
#include "bus.h"
#include "cartridge.h"
#include "cpu.h"

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s nestest.nes\n", argv[0]);
        return 1;
    }

    Cartridge *cart = cartridge_load(argv[1]);
    if (!cart) return 1;

    Bus bus;
    bus_init(&bus);
    bus_load_cartridge(&bus, cart);

    CPU cpu;
    cpu_init(&cpu, &bus);

    // nestest.log starts from this exact CPU state.
    cpu.pc = 0xC000;
    cpu.sp = 0xFD;
    cpu_set_flags(&cpu, 0x24);
    cpu.cycles = 7;

    for (int i = 0; i < 12; i++) {
        uint16_t pc_before = cpu.pc;
        uint8_t op0 = bus_read(&bus, pc_before);
        uint8_t op1 = bus_read(&bus, pc_before + 1);
        uint8_t op2 = bus_read(&bus, pc_before + 2);

        printf("%04X  %02X %02X %02X  A:%02X X:%02X Y:%02X P:%02X SP:%02X CYC:%u\n",
               pc_before,
               op0,
               op1,
               op2,
               cpu.a,
               cpu.x,
               cpu.y,
               cpu_get_flags(&cpu),
               cpu.sp,
               cpu.cycles);

        uint8_t used_cycles = cpu_step(&cpu);
        if (used_cycles == 0) {
            printf("Stopped at unsupported opcode $%02X at $%04X\n", op0, pc_before);
            break;
        }
    }

    cartridge_free(cart);
    return 0;
}
```

Download the ROM and golden log:

```bash
curl -sS -o /tmp/nestest.nes https://www.qmtpro.com/~nes/misc/nestest.nes
curl -sS -o /tmp/nestest.log https://www.qmtpro.com/~nes/misc/nestest.log
```

Compile the smoke runner:

```bash
gcc -Wall -Wextra -std=c11 -o /tmp/nestest_smoke nestest_smoke.c bus.c cartridge.c controller.c cpu.c
```

Run it:

```bash
/tmp/nestest_smoke /tmp/nestest.nes
```

Current output:

```text
C000  4C F5 C5  A:00 X:00 Y:00 P:24 SP:FD CYC:7
C5F5  A2 00 86  A:00 X:00 Y:00 P:24 SP:FD CYC:10
C5F7  86 00 86  A:00 X:00 Y:00 P:26 SP:FD CYC:12
C5F9  86 10 86  A:00 X:00 Y:00 P:26 SP:FD CYC:15
C5FB  86 11 20  A:00 X:00 Y:00 P:26 SP:FD CYC:18
C5FD  20 2D C7  A:00 X:00 Y:00 P:26 SP:FD CYC:21
C72D  EA 38 B0  A:00 X:00 Y:00 P:26 SP:FB CYC:27
C72E  38 B0 04  A:00 X:00 Y:00 P:26 SP:FB CYC:29
Stopped at unsupported opcode $38 at $C72E
Invalid opcode: $38 at $C72E
```

Compare that with the first lines of `nestest.log`:

```text
C000  4C F5 C5  JMP $C5F5                       A:00 X:00 Y:00 P:24 SP:FD PPU:  0, 21 CYC:7
C5F5  A2 00     LDX #$00                        A:00 X:00 Y:00 P:24 SP:FD PPU:  0, 30 CYC:10
C5F7  86 00     STX $00 = 00                    A:00 X:00 Y:00 P:26 SP:FD PPU:  0, 36 CYC:12
C5F9  86 10     STX $10 = 00                    A:00 X:00 Y:00 P:26 SP:FD PPU:  0, 45 CYC:15
C5FB  86 11     STX $11 = 00                    A:00 X:00 Y:00 P:26 SP:FD PPU:  0, 54 CYC:18
C5FD  20 2D C7  JSR $C72D                       A:00 X:00 Y:00 P:26 SP:FD PPU:  0, 63 CYC:21
C72D  EA        NOP                             A:00 X:00 Y:00 P:26 SP:FB PPU:  0, 81 CYC:27
C72E  38        SEC                             A:00 X:00 Y:00 P:26 SP:FB PPU:  0, 87 CYC:29
```

The important part is that our `PC`, registers, flags, stack pointer, and CPU cycle count match up to `$C72E`. The first blocker is opcode `$38`, which is `SEC` (Set Carry Flag). That means the next CPU work is to add the flag-only instructions like `SEC`, `CLC`, `SEI`, `CLI`, `SED`, `CLD`, and `CLV`, then rerun the same test and fix the next mismatch.

Writing full opcode functions here would be very long here so you can checkout it in my [repo](https://github.com/At0mXploit/Imu).

In **Part 5**, we'll build the **PPU** (Picture Processing Unit), the chip that draws graphics to the screen. It reads tile data from CHR-ROM, arranges backgrounds, renders sprites, and generates the NMI interrupt that tells our CPU "I finished drawing a frame." That's when pixels will start appearing. 

---



