---
tags:
  - NES
---
In Part 1 we learned about 6502 assembly that NES games are written in. Now it's time to start building the emulator itself. The first step will be to parse or read the game file.
# Cartridge

When we slide a game into an NES, we are not just sliding in storage device but we are also connecting a circuit board directly into the console's CPU and PPU buses. The cartridge isn't like a USB drive that you can mount or unmount instead it becomes part of hardware.

![](/posts/img/Pasted image 20260624231015.png)

Crack open any NES cartridge and we can find PCB with golden edge connector pins at bottom (72 pins at NES cart and 60 on original Famicom). These pins wire the cartridge's chips directly into the console. On the board itself, we will typically see atleast two ROM chips:

- **PRG-ROM** - the program ROM. This holds the actual 6502 machine code that the CPU executes. It gets mapped into the CPU's address space starting at `$8000`, giving games up to 32 KB of directly addressable program space.
- **CHR-ROM** - the character ROM. This holds the graphical tile data (sprites, backgrounds) that the PPU reads to draw the screen. It gets wired to the PPU's separate address bus.

Some cartridges are more complex. The NES CPU can only address 32 KB of PRG-ROM and 8KB of CHR at a time, but many games are much larger than that. So cartridge manufacturers added extra chips called **mappers** (Memory Management Controllers) that swap banks of ROM in and out of the address space on the fly. This is why later NES games like Kirby's Adventure or Castlevania III look and play so much better than early titles. The cartridge hardware literally got more capable over time.

Some carts also include:

- **Battery-backed RAM** for saving game progress (like in The Legend of Zelda)
- **CHR-RAM** instead of CHR-ROM, letting games generate or modify graphics at runtime
- A **lockout chip** (CIC) for region protection

![](/posts/img/Pasted image 20260624233606.png)

In above image just look at right side diagram for now. For emulation, we need to read all of this cartridge data from a digital file format. That format is called **iNES**.
## NES

An iNES file is dead simple in structure:

```c
┌──────────────────────┐
│  Header (16 bytes)   │
├──────────────────────┤
│  Trainer (512 bytes) │  ← optional, rarely used
├──────────────────────┤
│  PRG-ROM             │  ← program code (N × 16 KB)
├──────────────────────┤
│  CHR-ROM             │  ← graphics data (N × 8 KB)
└──────────────────────┘
```

The header tells us everything we need to know about what's inside. Let's look at it byte by byte.
### The 16 byte Header

```c
Offset  Content
------  -------
0-3     Magic constant: 0x4E 0x45 0x53 0x1A  ("NES" + end-of-file char)
4       PRG-ROM size in 16 KB units
5       CHR-ROM size in 8 KB units (0 means the game uses CHR-RAM)
6       Flags 6 - mirroring, battery, trainer, mapper low nibble
7       Flags 7 - mapper high nibble, format indicator
8-15    Mostly unused (safe to ignore for iNES 1.0)
```

The magic constant `4E 45 53 1A` is how we verify a file is actually an NES ROM. If those four bytes don't match, the file is invalid.

![](/posts/img/Pasted image 20260624234148.png)
#### Flags 6 (byte 6)

```
Bit 0   — Mirroring: 0 = horizontal, 1 = vertical
Bit 1   — Battery-backed PRG-RAM present
Bit 2   — 512-byte trainer present
Bit 3   — Four-screen VRAM layout
Bit 4-7 — Lower nibble of mapper number
```

Most of these won't make full sense until later parts, but here is the short version:

**Mirroring** controls how background graphics wrap up when the screen scrolls. The NES PPU (Picture Processing Unit) has enough RAM for two screens of background data, but the logical layout has four. Mirroring determines which two are real and which two are mirrors. Horizontal mirroring makes vertical scrolling easier and vice versa. We'll implement this properly when we build PPU.

**Battery** just means the cartridge has battery-backed RAM for saving game progress, think The Legend of Zelda. We store the flag now and use it later.

**Trainer** is a rare 512-byte block of data that sits before the PRG-ROM. It was used by old game copier devices. Almost no ROMs use it, but if it's present we need to skip past it when reading the PRG-ROM data.

**Mapper number** (lower nibble) identifies the cartridge's memory mapping hardware. Different mappers have wildly different bank-switching behavior. We'll dedicate an entire part to mappers later, for now we just need to read the ID.
#### Flags 7 (byte 7)

```
Bit 0-3 — (mostly unused in iNES 1.0)
Bit 4-7 — Upper nibble of mapper number
```

The mapper number is split across bytes 6 and 7 for historical reasons. The original iNES format only used byte 6, and byte 7 was added later when 16 mappers weren't enough. To reconstruct the full mapper ID: `(flags7 & 0xF0) | (flags6 >> 4)`.

Let's break that down. Say `flags6 = 0b0001_0011` and `flags7 = 0b0100_0000`:

```c
Step 1: Get the upper nibble of flags6 (the lower 4 bits of mapper ID)

  flags6 >> 4
  0001_0011 >> 4 = 0000_0001  →  mapper low = 1

Step 2: Get the upper nibble of flags7 (the upper 4 bits of mapper ID)

  flags7 & 0xF0
  0100_0000 & 1111_0000 = 0100_0000  →  mapper high = 0x40

Step 3: Combine them with OR

  0100_0000 | 0000_0001 = 0100_0001  →  mapper ID = 65
```

The `& 0xF0` mask keeps only the top 4 bits of flags7 (clearing any junk in the lower bits). The `>> 4` shift moves the top 4 bits of flags6 down into the lower position. Then `|` merges them into one byte. This gives us a mapper ID range of 0–255.
# Programming

We'll define a struct for the cartridge and write a loader that reads `.nes` file, validates the header and gives us access to PRG-ROM and CHR-ROM data.

```c
// cartridge.h
#ifndef CARTRIDGE_H
#define CARTRIDGE_H

#include <stdint.h>
#include <stdbool.h>

typedef struct {
    uint8_t *prg_rom;       // program code
    uint8_t *chr_rom;       // graphics data (or CHR-RAM)
    uint32_t prg_rom_size;  // in bytes
    uint32_t chr_rom_size;  // in bytes

    // Header info
    uint8_t  prg_rom_pages; // in 16 KB units
    uint8_t  chr_rom_pages; // in 8 KB units
    uint8_t  mapper_id;
    bool     uses_chr_ram;
    bool     has_battery;
    bool     has_trainer;
    uint8_t  mirroring;     // 0 = horizontal, 1 = vertical
} Cartridge;

Cartridge *cartridge_load(const char *filepath);
void       cartridge_free(Cartridge *cart);

#endif
```

For reading and validating the ROM:

```c
// cartridge.c
#include "cartridge.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const uint8_t INES_MAGIC[] = { 0x4E, 0x45, 0x53, 0x1A };

Cartridge *cartridge_load(const char *filepath) {
    FILE *fp = fopen(filepath, "rb");
    if (!fp) {
        fprintf(stderr, "Error: could not open %s\n", filepath);
        return NULL;
    }

    // Read the 16-byte header
    uint8_t header[16];
    if (fread(header, 1, 16, fp) != 16) {
        fprintf(stderr, "Error: file too small for iNES header\n");
        fclose(fp);
        return NULL;
    }

    // Validate magic constant
    if (memcmp(header, INES_MAGIC, 4) != 0) {
        fprintf(stderr, "Error: invalid ROM (magic constant mismatch)\n");
        fclose(fp);
        return NULL;
    }

    Cartridge *cart = calloc(1, sizeof(Cartridge));

    // Parse header fields
    cart->prg_rom_pages = header[4];
    cart->chr_rom_pages = header[5];
    cart->uses_chr_ram  = (header[5] == 0);
    cart->mirroring     = header[6] & 0x01;
    cart->has_battery   = (header[6] >> 1) & 0x01;
    cart->has_trainer   = (header[6] >> 2) & 0x01;
    cart->mapper_id     = (header[7] & 0xF0) | (header[6] >> 4);

    // Skip trainer if present
    if (cart->has_trainer) {
        fseek(fp, 512, SEEK_CUR);
    }

    // Read PRG-ROM
    cart->prg_rom_size = cart->prg_rom_pages * 16384;
    cart->prg_rom = malloc(cart->prg_rom_size);
    if (fread(cart->prg_rom, 1, cart->prg_rom_size, fp) != cart->prg_rom_size) {
        fprintf(stderr, "Error: unexpected end of PRG-ROM data\n");
        cartridge_free(cart);
        fclose(fp);
        return NULL;
    }

    // Read CHR-ROM (or allocate CHR-RAM)
    if (cart->uses_chr_ram) {
        cart->chr_rom_size = 8192;  // 8 KB of CHR-RAM
        cart->chr_rom = calloc(1, cart->chr_rom_size);
    } else {
        cart->chr_rom_size = cart->chr_rom_pages * 8192;
        cart->chr_rom = malloc(cart->chr_rom_size);
        if (fread(cart->chr_rom, 1, cart->chr_rom_size, fp) != cart->chr_rom_size) {
            fprintf(stderr, "Error: unexpected end of CHR-ROM data\n");
            cartridge_free(cart);
            fclose(fp);
            return NULL;
        }
    }

    fclose(fp);
    return cart;
}

void cartridge_free(Cartridge *cart) {
    if (cart) {
        free(cart->prg_rom);
        free(cart->chr_rom);
        free(cart);
    }
}
```

Now for testing:

```c
// main.c
#include <stdio.h>
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
    printf("  Battery:    %s\n", cart->has_battery ? "yes" : "no");

    cartridge_free(cart);
    return 0;
}
```

![](/posts/img/Pasted image 20260625000300.png)

We now have a working cartridge loader that:

1. Opens a `.nes` file and reads the 16-byte header
2. Validates the magic constant (`NES\x1A`)
3. Parses flags for mirroring, battery, trainer, and mapper ID
4. Loads PRG-ROM (the program the CPU will execute)
5. Loads CHR-ROM (the graphics the PPU will render) or allocates CHR-RAM if the game generates graphics at runtime
6. Properly handles the optional 512-byte trainer

This is the first real piece of our emulator. Every other component the CPU, PPU, APU will read data from this cartridge.

In next part we will build the **Bus**, the communication backbone that connects the CPU, PPU, and cartridge together. On a real NES, the cartridge's pins wire directly into the CPU and PPU address/data buses. Our emulator needs the same thing: a central bus that routes reads and writes to the right component based on the memory address. Once the bus is in place, we can start plugging components into it.

---