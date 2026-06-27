---
tags:
  - NES
---
We've parsed the cartridge. Now we need to wire it up. On a real NES, components don't talk to each other directly, everything goes through the bus.
# How the NES Communicates

Look at this architecture diagram:

![](/posts/img/Pasted image 20260625190042.png)


Every component: CPU, PPU, APU, controllers, and the cartridge (via its mapper) is connected through a central **memory bus**. The CPU doesn't know or care what's at a given address. It just says "read address `$4016`" or "write `$FF` to address `$2000`", and the bus routes that request to the correct device.

This is called memory-mapped I/O. Instead of having special instructions for talking to hardware, the NES maps every device to range of memory addresses:

- Reading `$4016` reads the controller's pressed buttons
- Writing to `$2000`–`$2007` configures the PPU (graphics)
- Writing to `$4000`–`$4013` configures the APU (sound)
- Reading `$8000`+ reads program code from the cartridge

The CPU just sees one flat 64 KB address space. The bus figures out who should respond.
# CPU Memory Map

The NES CPU has a 16-bit address bus, so it can address 65,536 bytes (`$0000` - `$FFFF`). But the console only has **2 KB of actual RAM**. The rest of that 64 KB space is carved up between hardware devices.

```c
$0000–$07FF   RAM (2 KB)
$0800–$1FFF   Mirrors of RAM (repeats every 2 KB)
$2000–$2007   PPU registers
$2008–$3FFF   Mirrors of PPU registers (repeats every 8 bytes)
$4000–$4017   APU and I/O registers
$4018–$401F   Normally disabled APU/IO functionality
$4020–$FFFF   Cartridge space (PRG-ROM, PRG-RAM, mapper registers)
```

The "mirrors" are a hardware quirk worth understanding. The NES only decodes the lower 11 bits of the address for RAM access. That means `$0000`, `$0800`, `$1000`, and `$1800` all point to the same physical byte. Reading `$0802` returns the exact same value as reading `$0002`.

Same thing with PPU registers, only 8 addresses (`$2000`–`$2007`), but they're mirrored across the entire `$2008`–`$3FFF` range because only the lower 3 bits are decoded. 3 bits can represent 8 values (000 through 111), which maps to exactly 8 registers (`$2000`–`$2007`). 

![](/posts/img/Pasted image 20260625191918.png)

So:

```c
Address   Binary              Lower 3 bits   Register
$2000     0010 0000 0000 0000    000          PPU register 0
$2001     0010 0000 0000 0001    001          PPU register 1
...
$2007     0010 0000 0000 0111    111          PPU register 7
$2008     0010 0000 0000 1000    000          PPU register 0 again!
$2009     0010 0000 0000 1001    001          PPU register 1 again!
$200A     0010 0000 0000 1010    010          PPU register 2 again!
...
$3FFE     0011 1111 1111 1110    110          PPU register 6 again!
$3FFF     0011 1111 1111 1111    111          PPU register 7 again!
```

In our later code, `address & 0x0007` does the same thing. It strips everything except the last 3 bits. That's why `$2008` acts the same as `$2000`: their lower 3 bits are both `000`.

Question can arise on why did they do this mirroring part. Answer is simple "Cost". In the early 1980s, every chip and every pin on the circuit board added manufacturing cost. Full address decoding where the hardware checks all 16 address bits to determine exactly which device should respond requires more logic gates, more wires, more silicon.

Incomplete decoding was deliberate shortcut. The NES designers knew the PPU only needed 8 registers, so they wired up just 3 address lines to PPU chip and called it a day. The result is that the huge chunk of address space (`$2008`–`$3FFF`) is "wasted" on mirrors, but it didn't matter since there was nothing else they needed to put there. Same with RAM: 11 address lines for 2 KB was enough, and the mirror region (`$0800`–`$1FFF`) was free real estate they didn't need.

The CPU sends out 16 address lines (16 wires). To fully decode all 16 bits, the PPU chip would need to receive all 16 wires and have internal logic to check every single one. That means more pins on the chip, more traces on the circuit board, and more transistors inside the chip to do the comparison.

But the PPU only has 8 registers. It only _needs_ 3 wires to tell them apart. So Nintendo literally connected just 3 address lines to the PPU chip and left the other 13 unconnected. Fewer pins, fewer traces, fewer transistors, cheaper to manufacture.

The side effect is that the PPU can't tell the difference between `$2000` and `$2008`  both look like `000` on the 3 wires it can see. That's the mirror. Same with RAM, they wired 11 lines instead of 16, saving 5 lines worth of decoding hardware. 

**A note on "mirroring":** The word comes up again later in a completely different context. The cartridge header has a mirroring flag (horizontal/vertical) that controls how the PPU's background nametables are laid out, which affects how the screen scrolls. It's a PPU concept, not a bus concept. We'll visualize it with a PPU viewer when we build the graphics system. Don't confuse the two.
# Building Bus 

We'll call our bus struct `Bus`. It holds the RAM, a pointer to the cartridge, and (eventually) pointers to every other device. For now we'll start with RAM and the cartridge's mapper.

```c
// bus.h
#ifndef BUS_H
#define BUS_H

#include <stdint.h>
#include "cartridge.h"

typedef struct {
    uint8_t ram[2048];       // 2 KB of internal RAM
    Cartridge *cart;          // loaded cartridge
    // PPU *ppu;              // we'll add these later
    // APU *apu;
    // Controller *ctrl[2];
} Bus;

void     bus_init(Bus *bus);
void     bus_load_cartridge(Bus *bus, Cartridge *cart);
uint8_t  bus_read(Bus *bus, uint16_t address);
void     bus_write(Bus *bus, uint16_t address, uint8_t value);

#endif
```

This is where the memory map lives. Every read and write goes through these two functions, and we route based on the address:

```c
// bus.c
#include "bus.h"
#include <string.h>
#include <stdio.h>

void bus_init(Bus *bus) {
    memset(bus->ram, 0, sizeof(bus->ram));
    bus->cart = NULL;
}

void bus_load_cartridge(Bus *bus, Cartridge *cart) {
    bus->cart = cart;
}

uint8_t bus_read(Bus *bus, uint16_t address) {
    if (address <= 0x1FFF) {
        // RAM + mirrors: mask to 11 bits
        return bus->ram[address & 0x07FF];

    } else if (address <= 0x3FFF) {
        // PPU registers + mirrors: mask to 3 bits
        // uint16_t reg = address & 0x0007;
        // return ppu_read(bus->ppu, reg);
        return 0; // stub for now

    } else if (address == 0x4016) {
        // Controller 1
        return 0; // stub

    } else if (address == 0x4017) {
        // Controller 2
        return 0; // stub

    } else if (address >= 0x4020) {
        // Cartridge space — let the mapper handle it
        if (bus->cart && address < bus->cart->prg_rom_size + 0x8000
            && address >= 0x8000) {
            return bus->cart->prg_rom[address - 0x8000];
        }
        return 0;

    }

    return 0;
}

void bus_write(Bus *bus, uint16_t address, uint8_t value) {
    if (address <= 0x1FFF) {
        // RAM + mirrors
        bus->ram[address & 0x07FF] = value;

    } else if (address <= 0x3FFF) {
        // PPU registers + mirrors
        // uint16_t reg = address & 0x0007;
        // ppu_write(bus->ppu, reg, value);

    } else if (address == 0x4016) {
        // Controller strobe
        // controller_write(bus->ctrl[0], value);

    } else if (address >= 0x4020) {
        // Cartridge space — mapper handles writes
        // mapper_write(bus->cart, address, value);
    }
}
```

The line `address & 0x07FF`. That's the mirroring in action,  it masks the address to 11 bits, so `$0800`, `$1000`, and `$1800` all collapse back to `$0000`–`$07FF`. Same idea with `address & 0x0007` for PPU register mirrors.

Test it:

```c
// main.c
#include <stdio.h>
#include "bus.h"
#include "cartridge.h"

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <rom.nes>\n", argv[0]);
        return 1;
    }

    // Load cartridge
    Cartridge *cart = cartridge_load(argv[1]);
    if (!cart) return 1;

    // Initialize bus and connect cartridge
    Bus bus;
    bus_init(&bus);
    bus_load_cartridge(&bus, cart);

    // Test RAM mirroring
    bus_write(&bus, 0x0000, 0x42);
    printf("Write $42 to $0000\n");
    printf("Read $0000: $%02X\n", bus_read(&bus, 0x0000));  // $42
    printf("Read $0800: $%02X\n", bus_read(&bus, 0x0800));  // $42 (mirror)
    printf("Read $1000: $%02X\n", bus_read(&bus, 0x1000));  // $42 (mirror)
    printf("Read $1800: $%02X\n", bus_read(&bus, 0x1800));  // $42 (mirror)

    // Test cartridge read (first byte of PRG-ROM)
    printf("\nFirst PRG-ROM byte at $8000: $%02X\n",
           bus_read(&bus, 0x8000));

    cartridge_free(cart);
    return 0;
}
```

```c
gcc -o nes_emu main.c bus.c cartridge.c -Wall
./nes_emu super_mario.nes
```

```bash
Write $42 to $0000
Read $0000: $42
Read $0800: $42
Read $1000: $42
Read $1800: $42

First PRG-ROM byte at $8000: $78
```

The `$78` is the opcode for `SEI` (Set Interrupt Disable). That's the first instruction in Super Mario Bros. Our bus is correctly routing the CPU's read request to the cartridge's PRG-ROM.
# Controller 

To see how memory-mapped I/O works in practice. Let's wire up a basic controller. On the NES, games read the controller by polling addresses `$4016` (player 1) and `$4017` (player 2). The NES had 8 buttons: A, B, Select, Start, Up, Down, Left, Right. But the CPU can only read one bit at a time from `$4016`. So to read all 8 buttons we use a shift register and strobing is concept we will use to control it. Basically think of controller like a deck of 8 cards, each card showing whether a button is pressed (1) or not (0). Strobing is like shuffling the deck back to top (well that's vague for sure T_T).

The protocol is:

- **Write `1` to `$4016`**  this sets the strobe bit ON. While strobe is on, the controller is "frozen." Every time you read `$4016`, you get the same answer: the state of button A. Over and over. The controller can't advance to the next button.
- **Write `0` to `$4016`**  this turns strobe OFF and resets the internal cursor to the beginning. Now the controller is ready to be read sequentially.
- **Read `$4016` eight times** each read returns the next button in order: A, B, Select, Start, Up, Down, Left, Right. The internal cursor advances by one each time.

Here's what a game's input-reading code looks like in assembly:

```c
LDA #$01
  STA $4016     ; strobe ON latch all button states
  LDA #$00
  STA $4016     ; strobe OFF ready to read

  LDA $4016     ; read A
  LDA $4016     ; read B
  LDA $4016     ; read Select
  LDA $4016     ; read Start
  LDA $4016     ; read Up
  LDA $4016     ; read Down
  LDA $4016     ; read Left
  LDA $4016     ; read Right
```

Every `LDA $4016` hits the bus, the bus calls `controller_read()`, and the controller returns the next button's state.

Without strobing there'd be no way to reset the read sequence. If a game read 5 buttons and then gets interrupted, it would lose track of where it is in sequence. Strobing lets game start over at any time. It's simple, reliable protocol that costs almost no hardware.

Writing `1` then `0` is the full reset cycle. Some games strobe every frame (60 times per second) to get fresh input. The write to `$4016` also resets _both_ controllers (player 1 and player 2 share the strobe line on the real hardware).

```c
// controller.h
#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    bool buttons[8];    // A, B, Select, Start, Up, Down, Left, Right
    uint8_t cursor;     // which button we're reading next
    bool strobe;        // when true, reads always return button A
} Controller;

void    controller_init(Controller *ctrl);
uint8_t controller_read(Controller *ctrl);
void    controller_write(Controller *ctrl, uint8_t value);

#endif
```

```c
// controller.c
#include "controller.h"

void controller_init(Controller *ctrl) {
    for (int i = 0; i < 8; i++) ctrl->buttons[i] = false;
    ctrl->cursor = 0;
    ctrl->strobe = false;
}

uint8_t controller_read(Controller *ctrl) {
    // Past the 8 buttons? Always return 1
    if (ctrl->cursor >= 8) return 1;

    // Strobe on? Always return button A, don't advance
    if (ctrl->strobe) {
        return ctrl->buttons[0] ? 1 : 0;
    }

    // Normal read: return current button, advance cursor
    uint8_t value = ctrl->buttons[ctrl->cursor] ? 1 : 0;
    ctrl->cursor++;
    return value;
}

void controller_write(Controller *ctrl, uint8_t value) {
    ctrl->strobe = (value & 0x01) != 0; // extract bit 0 from value and conver to boolean
    if (ctrl->strobe) {
        ctrl->cursor = 0;  // reset both controllers
    }
}
```

Then plug it into the bus:

```c
#include "controller.h"
// In bus.h, add to Bus struct:
<SNIP>
Controller ctrl[2];
```

```c
// bus.c
#include "bus.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

void bus_init(Bus *bus) {
    memset(bus->ram, 0, sizeof(bus->ram));
    bus->cart = NULL;
    bus->ctrl[0] = malloc(sizeof(Controller));
    bus->ctrl[1] = malloc(sizeof(Controller));
    controller_init(bus->ctrl[0]);
    controller_init(bus->ctrl[1]);
}

void bus_load_cartridge(Bus *bus, Cartridge *cart) {
    bus->cart = cart;
}

uint8_t bus_read(Bus *bus, uint16_t address) {
    if (address <= 0x1FFF) {
        return bus->ram[address & 0x07FF];

    } else if (address <= 0x3FFF) {
        // uint16_t reg = address & 0x0007;
        // return ppu_read(bus->ppu, reg);
        return 0;

    } else if (address == 0x4016) {
        return controller_read(bus->ctrl[0]);

    } else if (address == 0x4017) {
        return controller_read(bus->ctrl[1]);

    } else if (address >= 0x8000) {
        if (bus->cart) {
            return bus->cart->prg_rom[(address - 0x8000) % bus->cart->prg_rom_size];
        }
        return 0;

    } else if (address >= 0x4020) {
        return 0;
    }

    return 0;
}

void bus_write(Bus *bus, uint16_t address, uint8_t value) {
    if (address <= 0x1FFF) {
        bus->ram[address & 0x07FF] = value;

    } else if (address <= 0x3FFF) {
        // uint16_t reg = address & 0x0007;
        // ppu_write(bus->ppu, reg, value);

    } else if (address == 0x4016) {
        controller_write(bus->ctrl[0], value);
        controller_write(bus->ctrl[1], value);

    } else if (address >= 0x4020) {
        // mapper_write(bus->cart, address, value);
    }
}
```

Now for test:

```c
// main.c
#include <stdio.h>
#include "bus.h"
#include "cartridge.h"

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

    cartridge_free(cart);
    return 0;
}
```

```bash
$ ./nes_emu super_mario.nes
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
```

In **Part 4**, we'll build the **CPU**, the heart of the emulator. It'll sit on this bus, fetch opcodes from PRG-ROM, decode them into the 6502 instructions we learned in Part 1, and execute them one by one.

---
