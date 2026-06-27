---
tags:
  - Assembly
  - NES
---
Welcome to the first part of my NES emulator series. Before we write a single line of emulator code, we need to understand what we're emulating: the 6502 CPU and its assembly language.
# Background

An emulator is at its core an interpreter. It reads raw bytes machine code and simulates what the original hardware would do with them. To build that interpreter, we need to understand the language those bytes represent i.e 6502 assembly.

The NES uses a RIcoh 2A03 processor, which is based on MOS technology 6502. Every NES game ever made ultimately boils down to sequence of 6502 instructions. The job of Emulator will be to faithfully replay them.
# Assembly 

Assembly language is the lowest level abstraction in computing. Each instruction translates directly into bytes that the CPU executes. An assembler converts human readable assembly into those bytes, the machine code.

For example the instruction `LDA #$01` becomes two bytes in memory: one for the operation code (opcode) and one for value `$01`. Instruction can be 1,2 or 3 bytes long depending on how they reference their arguments.

A quick notation guide before we will dive in:

- `$20` - the dollar sign means hexadecimal. `$20` = 32 in decimal.
- `#$20` - the hash means the literal value. "Load the number 32".
- `$20` (without `#`) - refers to a memory address. "Load whatever is stored at address 0x00200"
- `#20` - literal value in decimal. "Load the number 20".

The distinction between `#$XX` (immediate value) and `$XX` (memory address) is one first things that might trip up and its important to get it right.
## CPU's Registers

The 6502 has a small set of registers (tiny fast storage locations built into processor):

|Register|Name|Size|Purpose|
|---|---|---|---|
|**A**|Accumulator|1 byte|General-purpose math and data manipulation|
|**X**|Index X|1 byte|Counter, index for addressing modes|
|**Y**|Index Y|1 byte|Counter, index for addressing modes|
|**SP**|Stack Pointer|1 byte|Tracks the top of the stack|
|**PC**|Program Counter|2 bytes|Points to the next instruction to execute|

The Program Counter is the little odd one out because it's 2 bytes wide and allows address up to 65,536 memory locations (`$0000` to `$FFFF`). Every other register holds a single byte (0-255).
## Memory Layout

The NES only has 2KiB of actually RAM, but the CPU can see up to 64KiB of address space. The first two kilobytes are real working RAM, the rest of address space is mapped to interact with PPU (graphics), APU (audio), cartridge ROM and other hardware. For learning purposes we can simulate a flat 64 KiB RAM and worry about the memory map later.
## Instruction

The two most fundamental instructions are:

- `LDA` - "LoaD Accumulator". Puts a value into A register.
- `STA`  - "STore Accumulator." Writes the value of A to a memory address.

This is fundamental step like first load a value, then store it somewhere. For running use [this](https://itema-as.github.io/6502js/) simulator online.

```c
LDA #$7C      ; Load the literal value $7C into A
STA $4055     ; Store A's value into memory address $4055
STA $4072     ; Store it again at $4072

LDA #$18      ; Load $18 into A
STA $40B8     ; Store it at $40B8
```

These are equivalent instructions for X and Y registers: `LDX`/`STX` and `LDY`/`STY`. All of them will work the same way.

Reading from memory is simple, just remove the `#` prefix:

```c
LDX $4080     ; Load into X whatever value is at memory address $4080
```

You can run all of this in the browser using the [MOS 6502 Simulator](https://itema-as.github.io/6502js/). Paste code, hit **Assemble**, then **Run**.  The simulator's **Monitor** panel defaults to showing memory starting at `$0000` with a length of `$FF`. If our code writes to higher addresses like `$4055`, we won't see anything change. Just update the Monitor settings, set **Start** to `$4055` and **Length** to `$70` and we'll see our values sitting in memory.

![](/posts/img/Pasted image 20260624214025.png)

There is also arithmetic operators:

- `ADC` - "ADd with Carry." Adds a value to the Accumulator.
- `SBC` - "SuBtract with Carry." Subtracts a value from the Accumulator.

There are also increment/decrement instructions like `INX` (Increment X) and `INY` (Increment Y), but they only change the value by 1. For anything else, use `ADC`:

```c
LDA $4085     ; Load value from memory
ADC #$08      ; Add 8 to it
STA $4086     ; Store the result
```

Note that `ADC` and `SBC` only work with the **A register**. If we loaded value into X, we'll need to transfer it to A first.

The 6502 has no multiply or divide instructions. Instead we do bit shifting:

- Shifting left = multiply by 2
- Shifting right = divide by 2

**`ASL`** (Arithmetic Shift Left) shifts all bits one position to the left. A `0` enters bit 0, and the old bit 7 goes into the Carry flag. This effectively multiplies by 2.

```c
LDA #$05      ; A = 5
ASL A         ; A = 10  (5 × 2)
ASL A         ; A = 20  (10 × 2, so 5 × 4)
ASL A         ; A = 40  (5 × 8)
```

To multiply by non-powers of 2, combine shifts and adds. For example, multiply by 5 (= 4 + 1):

```c
LDA #$07      ; A = 7
ASL A         ; A = 14  (× 2)
ASL A         ; A = 28  (× 4)
ADC #$07      ; A = 35  (× 4 + original = × 5)
```

**`LSR`** (Logical Shift Right) does the opposite, shifts all bits right, divides by 2. A `0` enters bit 7, and the old bit 0 goes into the Carry flag (which tells us if the number was odd).

```c
LDA #$20      ; A = 32
LSR A         ; A = 16  (32 ÷ 2)
LSR A         ; A = 8   (32 ÷ 4)
```

Rotates are like shifts, but the **Carry flag participates** in the rotation. It acts as a 9th bit.

**`ROL`** (ROtate Left) shifts everything left, the Carry enters bit 0, and bit 7 goes into the Carry.

**`ROR`** (ROtate Right) shifts everything right, the Carry enters bit 7, and bit 0 goes into the Carry.

```c
ROL:  C <- [7 6 5 4 3 2 1 0] <- C
ROR:  C -> [7 6 5 4 3 2 1 0] -> C
```

Rotates let us shift **multi-byte numbers**. If we have lets say 16 bit value stored across two bytes, we can't just `ASL` each one independently, we'd lose the bit that carries between them. With `ROL`, the carry from low byte feeds into high byte:

```c
; Multiply a 16-bit number at $00/$01 by 2
ASL $00       ; Shift low byte left, bit 7 goes to Carry
ROL $01       ; Shift high byte left, Carry enters bit 0
```

This is how NES games handle math on numbers larger than 255. All four instructions (`ASL`, `LSR`, `ROL`, `ROR`) can operate on the Accumulator or directly on a memory address:

```c
ASL A         ; Shift accumulator
ASL $4050     ; Shift the byte at memory address $4050
ASL $44,X     ; Shift the byte at zero page address $44 + X
```

We have been talking about carry flags for while so now let's understand them. If we calculate 200 + 60 in single byte the answer will not be 260 or be 255 (clamped) but it will be 4 because a byte can hold values 0-255. When result hits 256, it wraps back to 0. So 200 + 60 = 260 and 260 - 256 = 4. The value wraps around and CPU sets the Carry Flag to 1 to signal that the overflow occurred. 

The 6502 has **6 status flags**, all packed into a single byte called the **flags register** (also known as the Processor Status register, or P):

|Flag|Name|Set When...|
|---|---|---|
|**C**|Carry|Arithmetic overflows or underflows|
|**Z**|Zero|The result of an operation is zero|
|**I**|Interrupt Disable|Interrupts are masked|
|**D**|Decimal|BCD mode is enabled (not used on NES)|
|**V**|Overflow|Signed arithmetic overflow|
|**N**|Negative|Bit 7 of the result is set|

The Zero and Carry flags are especially important because they drive **branching**.

Without branching, the programs would be linear and boring. The 6502 uses conditional branch instruction that check flags:

- **`BNE`** - Branch if Not Equal (Z = 0)
- **`BEQ`** - Branch if Equal (Z = 1)
- **`BCS`** - Branch if Carry Set (C = 1)
- **`BCC`** - Branch if Carry Clear (C = 0)

The typical pattern will be to compare then branch:

```c
LDX $4080       ; Load a value
  CPX #$07        ; Compare X with 7, sets Z=1 if equal
  BEQ @is_seven   ; Jump if they're equal
  
  LDA #$AA        ; Not seven: store $AA
  STA $40BF
  BRK             ; Halt

@is_seven:
  LDA #$EE        ; It's seven: store $EE
  STA $40BF
  BRK
```

`CPX` (ComPare X) sets the Zero Flag if X equals the given value. Then `BEQ` or `BNE` acts on that flag. The Branch Instructions use relative addressing, the argument is a signed offset from next instruction's address not an absolute target. The assembler will calculate this for us when we use labels, but under it's just single byte offset.
## Addressing Modes

The CPU supports several ways to specify where data lives:
### Implicit

No argument needed. The instruction implies what it operates on.

```c
INX             ; Increment X (1 byte instruction)
```
### Immediate

The argument is a literal value, prefixed with `#`.

```c
LDA #$08        ; Load the number 8 into A (2 bytes)
```
### Zero Page

A 1-byte address pointing to the first 256 bytes of memory (`$0000` - `$00FF`). Faster and smaller than absolute addressing.

```c
LDA $15         ; Load from address $0015 (2 bytes)
```
### Absolute

A full 2-byte memory address.

```c
LDA $C002 ; Load from address $C002 (3 bytes)
```
### Relative

Used by branch instructions. A singed 1-byte offset from the next instruction.

```c
BNE @label ; Jump forward or backward by offset (2 bytes)
```
### Zero Page, X and Absolute, X

Add the value of X to the base address:

```c
STA $60,X       ; Store A at address ($60 + X), wraps within zero page
STA $4050,X     ; Store A at address ($4050 + X)
```

The zero page variant wraps around within `$00` - `$FF`. There are equivalent `,Y` variants as well.
### Indirect

Used primarily with `JMP`. Reads a 2-byte address from the given address:

```c
JMP ($4080)     ; Read the target address from $4080 (low byte) and $4081 (high byte)
```

If `$4080` contains `$21` and `$4081` contains `$40`, then `JMP ($4080)` jumps to `$4021`.
### Indexed Indirect `($ZP, X)`

Add X to a zero page address, then do indirect lookup:

```c
STA ($01,X)     ; If X=2, reads address from $0003/$0004, stores A there
```
### Indirect Indexed `($ZP, Y)`

Do the indirect lookup first, then add Y to result:

```c
LDA ($03),Y     ; Read address from $0003/$0004, then add Y to get final address
```

The difference is subtle: Indexed Indirect adds before the lookup, Indirect Indexed adds after. For emulator development, we'll implement both as part of our CPU's address resolver.
## The Stack

The 6502's stack lives at memory address `$0100`-`$01FF` and grows **downward**. The Stack Pointer starts at `$FF` (pointing to `$01FF`) and decrements as values are pushed. Two instructions to manage it:

- **`PHA`** - Push Accumulator onto the stack.
- **`PLA`** - Pull (pop) the top value from the stack into A.

The stack is essential for subroutines and for temporarily saving register values.

```c
LDA #$42
PHA             ; Push $42 onto stack, SP decrements
LDA #$00        ; A is now 0
PLA             ; Pull $42 back into A, SP increments
```

Note that the `PLA` doesn't erase the value from memory, it just moves the stack pointer back up. The old value stays in RAM until something overwrites it.
## Subroutines

Subroutines are 6502's version of function calls:

- **`JSR $addr`** - "Jump to Subroutine." Pushes the return address (minus 1) onto the stack, then jumps to the target.
- **`RTS`** - "Return from Subroutine." Pops the address from the stack, adds 1, and jumps there.

```c
JSR @init       ; Call the init subroutine
  JSR @render     ; Then call render
  BRK             ; Done

@init:
  LDA #$01
  STA $00
  RTS             ; Return to caller

@render:
  LDA $00
  STA $0200
  RTS
```

This is how NES games organize their code into reusable routines. When we will build emulator `JSR` and `RTS` will manipulate both stack and program counter.

These concept might be enough to get started, we will learn more along the way if needed T~T

---



