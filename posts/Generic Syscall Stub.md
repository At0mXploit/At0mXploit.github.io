---
tags:
  - MalwareDevelopment
---
# Prerequisites

![](/img/generic-syscall-stub-cover.png)

The post is small continuation of my previous blog [Syscalls Demystified](https://at0mxploit.xyz/post/syscalls-demystified). If you haven't read it yet, read that first. We covered:

- What syscalls are and how ntdll stubs work
- Direct syscalls and why they get caught by call stack inspection
- Indirect syscalls and borrowing ntdll's syscall gadget
- Hell's Gate, Halo's Gate and Tartarus Gate for dynamic SSN resolution

While stub we wrote there was okeish for working but it had too much repeated stubs for each syscall. Instead of writing a separate stub per function, we write one generic stub that handles every single `Nt*` function.
# Looking Back

If you went through the previous post you already noticed something. Every stub we wrote looked identical:

```c
SysNtAllocateVirtualMemory:
    mov r10, rcx
    mov eax, 0x18      ; only this changes
    jmp [gadget]

SysNtWriteVirtualMemory:
    mov r10, rcx
    mov eax, 0x3A      ; only this changes
    jmp [gadget]

SysNtProtectVirtualMemory:
    mov r10, rcx
    mov eax, 0x50      ; only this changes
    jmp [gadget]
```

Three different stubs. Only the SSN number differs. So why do we even write three stubs? Why not write one and pass the SSN in as a parameter?

Every clean ntdll stub has same normalized signature:

```c
4C 8B D1        =>  mov r10, rcx
B8 XX XX XX XX  =>  mov eax, <SSN>   ← only XX changes
0F 05           =>  syscall
C3              =>  ret
```

This pattern is locked by the CPU and Windows ABI, It cannot be different. The format is hardware contract `mov r10, rcx` is required because `syscall` destroys RCX and kernel reads `arg1` from `r10`. `mov eax, SSN` is required because the kernel reads which function to call from EAX. `syscall` is only instruction that crosses ring 3 to ring 0. None of them is negotiable.
## x64 Fastcall 

Windows uses x64 fastcall calling convention. In it, first 4 args to in registers and rest go on the stack:

```c
arg1  =>  RCX
arg2  =>  RDX
arg3  =>  R8
arg4  =>  R9
arg5+ =>  Stack
```

When our generic stub is called, SSN takes the first slot, pushing everything else one position forward.

<svg viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">

  <!-- Title -->
  <text x="350" y="35" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">Argument Layout — Normal vs Generic Syscall</text>

  <!-- NORMAL ROW LABEL -->
  <text x="20" y="90" fill="#aaaaaa" font-family="monospace" font-size="12">Normal:</text>

  <!-- NORMAL BOXES -->
  <!-- arg1 -->
  <rect x="120" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="155" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg1</text>

  <!-- arg2 -->
  <rect x="198" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="233" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg2</text>

  <!-- arg3 -->
  <rect x="276" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="311" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg3</text>

  <!-- arg4 -->
  <rect x="354" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="389" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg4</text>

  <!-- arg5 -->
  <rect x="432" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="467" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg5</text>

  <!-- arg6 -->
  <rect x="510" y="70" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="545" y="91" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg6</text>

  <!-- register labels normal -->
  <text x="155" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">RCX</text>
  <text x="233" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">RDX</text>
  <text x="311" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">R8</text>
  <text x="389" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">R9</text>
  <text x="467" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">stack</text>
  <text x="545" y="118" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">stack</text>

  <!-- GENERIC ROW LABEL -->
  <text x="20" y="185" fill="#aaaaaa" font-family="monospace" font-size="12">Generic:</text>

  <!-- SSN box (highlighted red — takes slot 0) -->
  <rect x="120" y="160" width="70" height="32" rx="4" fill="#3a1f1f" stroke="#ff4a4a" stroke-width="1.5"/>
  <text x="155" y="181" text-anchor="middle" fill="#ff4a4a" font-family="monospace" font-size="11">SSN</text>

  <!-- arg1 shifted -->
  <rect x="198" y="160" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="233" y="181" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg1</text>

  <!-- arg2 shifted -->
  <rect x="276" y="160" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="311" y="181" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg2</text>

  <!-- arg3 shifted -->
  <rect x="354" y="160" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="389" y="181" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg3</text>

  <!-- arg4 shifted -->
  <rect x="432" y="160" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="467" y="181" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg4</text>

  <!-- arg5 shifted -->
  <rect x="510" y="160" width="70" height="32" rx="4" fill="#1f3a5f" stroke="#4a9eff" stroke-width="1"/>
  <text x="545" y="181" text-anchor="middle" fill="#4a9eff" font-family="monospace" font-size="11">arg5</text>

  <!-- register labels generic -->
  <text x="155" y="208" text-anchor="middle" fill="#ff4a4a" font-family="monospace" font-size="10">RCX</text>
  <text x="233" y="208" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">RDX</text>
  <text x="311" y="208" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">R8</text>
  <text x="389" y="208" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">R9</text>
  <text x="467" y="208" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">stack</text>
  <text x="545" y="208" text-anchor="middle" fill="#666666" font-family="monospace" font-size="10">stack</text>

  <!-- Arrow pointing to SSN with label -->
  <line x1="155" y1="220" x2="155" y2="245" stroke="#ff4a4a" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="155" y="262" text-anchor="middle" fill="#ff4a4a" font-family="monospace" font-size="11">SSN takes slot 0</text>
  <text x="155" y="276" text-anchor="middle" fill="#ff4a4a" font-family="monospace" font-size="11">everything shifts right</text>

  <!-- Arrow marker -->
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#ff4a4a"/>
    </marker>
  </defs>

</svg>

The `Nt*` function with the most parameters in all of Windows is `NtCreateThreadEx` and `NtCreateFile` both take 11 args. Our generic stub always accepts 11 args to handle the worst case. Unused slots get padded with 0. So to say it again basically when C calls `GenericSyscall(SSN, arg1, arg2, arg3, arg4, arg5...)`, fastcall has already loaded: 

```c
RCX = SSN       ; our extra parameter
RDX = arg1      ;  real first arg to the Nt* function
R8  = arg2      ;  real second arg
R9  = arg3      ;  real third arg
stack = arg4, arg5, arg6 ... arg11
```

The problem is this is **wrong for the kernel**. The kernel expects:

```c
EAX = SSN
R10 = arg1
RCX = arg2
RDX = arg3
R8  = arg4
R9  = arg5
stack = arg6 ... arg11
```

The stub's job is to shuffle everything back into the right place before firing the syscall. This is the core idea behind SysWhispers3 and similar tooling.
## The Generic ASM Stub

```c
# syscall_stub.S
.intel_syntax noprefix
.global GenericSyscall

.text
GenericSyscall:
    mov eax, ecx        ; SSN was in rcx (1st C arg) → kernel wants it in rax
    mov r10, rdx        ; arg1 was in rdx (2nd C arg) → kernel wants it in r10
    mov rcx, r8         ; arg2 was in r8  (3rd C arg) → kernel wants it in rcx
    mov rdx, r9         ; arg3 was in r9  (4th C arg) → kernel wants it in rdx
    mov r8,  [rsp+0x28] ; arg4 was on stack (5th C arg) → kernel wants it in r8
    mov r9,  [rsp+0x30] ; arg5 was on stack (6th C arg) → kernel wants it in r9
    ; arg6–arg11 are already sitting further up the stack, kernel reads them there
    syscall
    ret
```

Call it like this:

```c
extern NTSTATUS GenericSyscall(
    DWORD     SSN,
    ULONG_PTR arg1,  ULONG_PTR arg2,  ULONG_PTR arg3,
    ULONG_PTR arg4,  ULONG_PTR arg5,  ULONG_PTR arg6,
    ULONG_PTR arg7,  ULONG_PTR arg8,  ULONG_PTR arg9,
    ULONG_PTR arg10, ULONG_PTR arg11
);

GenericSyscall(
    ssn_alloc,              // param 1:  SSN
    (ULONG_PTR)-1,          // param 2:  arg1
    &base,                  // param 3:  arg2
    0,                      // param 4:  arg3
    &size,                  // param 5:  arg4
    MEM_COMMIT|MEM_RESERVE, // param 6:  arg5
    PAGE_READWRITE,         // param 7:  arg6
    0, 0, 0, 0, 0           // params 8-12: arg7-arg11 (padding)
);
```

This works for functions up to 5 args. **Problem:** arg6 through arg11 are left sitting at wrong stack positions, the kernel reads garbage. It also fires `syscall` from inside the stub itself, so our module shows up in the call stack and EDR flags it.

Two improvements needed:

1. Properly slide all 11 stack args down one slot
2. Jump to ntdll's gadget instead of firing `syscall` directly

The above stub used `[rsp+0x28]` style addressing but `rsp` can shift if anything pushes to the stack inside the function. This version solves that by **anchoring to `rbp`** instead, which never moves after being set. It also handles the full **11-argument case**, sliding all stack args down into their correct positions.
## Stub with Relative addressing and for 11 Args 

```c
.intel_syntax noprefix
.global GenericSyscall

.text
GenericSyscall:
	push    rbp        ; save caller's rbp, rsp drops by 8
	mov     rbp, rsp   ; rbp is now a stable snapshot of rsp

    mov     eax, ecx        ; SSN -> eax
    mov     rcx, rdx        ; shift register args
    mov     rdx, r8
    mov     r8,  r9

    mov     r9,           [rbp + 0x30]  ; a4 -> r9
    mov     r10,          [rbp + 0x38]  ; slide a5-a11 down
    mov     [rsp + 0x20], r10
    mov     r10,          [rbp + 0x40]
    mov     [rsp + 0x28], r10
    mov     r10,          [rbp + 0x48]
    mov     [rsp + 0x30], r10
    mov     r10,          [rbp + 0x50]
    mov     [rsp + 0x38], r10
    mov     r10,          [rbp + 0x58]
    mov     [rsp + 0x40], r10
    mov     r10,          [rbp + 0x60]
    mov     [rsp + 0x48], r10
    mov     r10,          [rbp + 0x68]
    mov     [rsp + 0x50], r10

    mov     r10, rcx        ; syscall ABI, must be last

    syscall

    pop     rbp
    ret
```

The offset shifts by 8 (`0x28` becomes `0x30`) because `push rbp` added 8 bytes to the stack, so the caller's args are 8 bytes further away from RSP but at a predictable fixed offset from RBP.

`r10` must be set last, it's used as scratch during the slide and gets overwritten. Setting it before the loop would corrupt it.
## Struct Stub

The above stub above still passes SSN as a raw arg in `rcx`, which burns one register slot. A cleaner approach bundles SSN and the gadget pointer together in a struct:

```c
typedef struct {
    WORD  ssn;      // offset +0x00
    BYTE  pad[6];   // alignment to 8 bytes
    PVOID gad;      // offset +0x08
} CC;
```

In stubs 1 and 2, the very first argument slot (`rcx`) is wasted on the SSN a number the kernel needs but your real function arguments don't. That burns one of only 4 fast-call registers before we even start passing real data.

<svg viewBox="0 0 820 480" xmlns="http://www.w3.org/2000/svg" font-family="'Courier New', monospace">
  <rect width="820" height="480" fill="#0d0d0d"/>

  <!-- ═══ LEFT: Old Stub ═══ -->
  <text x="190" y="30" fill="#888888" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="1">OLD — STUB 1 &amp; 2</text>

  <!-- rcx wasted -->
  <rect x="40" y="42" width="300" height="36" rx="5" fill="#2a1212" stroke="#E24B4A" stroke-width="1.5"/>
  <text x="57" y="64" fill="#ff6b6b" font-size="13">rcx = SSN</text>
  <text x="230" y="64" fill="#ff4444" font-size="11">← wasted slot</text>

  <rect x="40" y="86"  width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="57" y="107" fill="#7eb8f7" font-size="13">rdx = arg1</text>

  <rect x="40" y="126" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="57" y="147" fill="#7eb8f7" font-size="13">r8  = arg2</text>

  <rect x="40" y="166" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="57" y="187" fill="#7eb8f7" font-size="13">r9  = arg3</text>

  <rect x="40" y="206" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="57" y="227" fill="#7eb8f7" font-size="13">[rsp+0x28] = arg4</text>

  <rect x="40" y="246" width="300" height="32" rx="5" fill="#0f1520" stroke="#185FA5" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="57" y="267" fill="#4a7aaa" font-size="13">… arg5 – arg11</text>

  <!-- ═══ ARROW ═══ -->
  <text x="410" y="168" fill="#444444" font-size="28" text-anchor="middle">→</text>

  <!-- ═══ RIGHT: New CC Stub ═══ -->
  <text x="630" y="30" fill="#888888" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="1">NEW — CC STRUCT STUB</text>

  <!-- rcx = pointer -->
  <rect x="480" y="42" width="300" height="36" rx="5" fill="#1a1a0a" stroke="#d4a017" stroke-width="1.5"/>
  <text x="497" y="64" fill="#f0c040" font-size="13">rcx = &amp;cc</text>
  <text x="640" y="64" fill="#c8a020" font-size="11">← pointer to struct</text>

  <rect x="480" y="86"  width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="497" y="107" fill="#7eb8f7" font-size="13">rdx = arg1</text>

  <rect x="480" y="126" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="497" y="147" fill="#7eb8f7" font-size="13">r8  = arg2</text>

  <rect x="480" y="166" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="497" y="187" fill="#7eb8f7" font-size="13">r9  = arg3</text>

  <rect x="480" y="206" width="300" height="32" rx="5" fill="#111827" stroke="#185FA5" stroke-width="1"/>
  <text x="497" y="227" fill="#7eb8f7" font-size="13">[rsp+0x28] = arg4</text>

  <rect x="480" y="246" width="300" height="32" rx="5" fill="#0f1520" stroke="#185FA5" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="497" y="267" fill="#4a7aaa" font-size="13">… arg5 – arg11</text>

  <!-- note below -->
  <rect x="480" y="290" width="300" height="52" rx="5" fill="#0d1a0d" stroke="#0F6E56" stroke-width="1"/>
  <text x="630" y="310" fill="#6fcf97" font-size="11" text-anchor="middle">One pointer in → two values out.</text>
  <text x="630" y="327" fill="#6fcf97" font-size="11" text-anchor="middle">SSN + gadget. Nothing wasted.</text>

  <!-- ═══ DIVIDER ═══ -->
  <line x1="40" y1="365" x2="780" y2="365" stroke="#222222" stroke-width="1"/>
  <text x="410" y="358" fill="#444444" font-size="10" text-anchor="middle">CC STRUCT MEMORY LAYOUT</text>

  <!-- ═══ CC Struct layout ═══ -->
  <!-- offset labels -->
  <text x="60"  y="400" fill="#555555" font-size="11">+0x00</text>
  <text x="60"  y="432" fill="#555555" font-size="11">+0x02</text>
  <text x="60"  y="464" fill="#555555" font-size="11">+0x08</text>

  <!-- ssn cell -->
  <rect x="110" y="382" width="660" height="28" rx="4" fill="#1a1a2e" stroke="#534AB7" stroke-width="1.5"/>
  <text x="440" y="400" fill="#a89cf7" font-size="13" text-anchor="middle">ssn  (WORD — 2 bytes)   e.g. 0x0018</text>

  <!-- pad cell -->
  <rect x="110" y="416" width="660" height="28" rx="4" fill="#111111" stroke="#333333" stroke-width="1" stroke-dasharray="5,4"/>
  <text x="440" y="434" fill="#444444" font-size="13" text-anchor="middle">pad[6]  —  6 bytes of zeros  (alignment only)</text>

  <!-- gad cell -->
  <rect x="110" y="450" width="660" height="28" rx="4" fill="#0d2818" stroke="#0F6E56" stroke-width="1.5"/>
  <text x="440" y="468" fill="#6fcf97" font-size="13" text-anchor="middle">gad  (PVOID — 8 bytes)   pointer into ntdll  syscall;ret</text>
</svg>

Why pad 6 bytes? A pointer on x64 must sit at an 8-byte-aligned address. `ssn` is 2 bytes, so 6 bytes of padding brings the offset to 8 making `gad` naturally aligned and fetchable in one load instruction.  The slot count looks the same but now `rcx` carries a pointer to a struct that contains both the SSN and a gadget pointer. One pointer in, two values out. Nothing is wasted.

Now `rcx` on entry holds one pointer. Two dereferences get both values. All 11 real arg slots are preserved.

```c
.intel_syntax noprefix
.global CCStub

.text
CCStub:
    // entry rsp+0x00 = return address (gadget's ret uses this — do NOT push anything)
    // rcx = CC*, rdx = arg1, r8 = arg2, r9 = arg3
    // [rsp+0x28] = arg4, [rsp+0x30] = arg5, [rsp+0x38] = arg6 ...

    movzx   eax, word ptr [rcx]          // SSN -> eax
    mov     r11, qword ptr [rcx + 0x08]  // gadget -> r11

    // shift register args down one slot (drop CC* from rcx)
    mov     rcx, rdx
    mov     rdx, r8
    mov     r8,  r9

    // load arg4 into r9 before we clobber its slot
    mov     r9, qword ptr [rsp + 0x28]

    // slide stack args down one slot so kernel reads them from [rsp+0x28]+
    mov     r10, qword ptr [rsp + 0x30]
    mov     qword ptr [rsp + 0x28], r10   // arg5
    mov     r10, qword ptr [rsp + 0x38]
    mov     qword ptr [rsp + 0x30], r10   // arg6
    mov     r10, qword ptr [rsp + 0x40]
    mov     qword ptr [rsp + 0x38], r10   // arg7
    mov     r10, qword ptr [rsp + 0x48]
    mov     qword ptr [rsp + 0x40], r10   // arg8
    mov     r10, qword ptr [rsp + 0x50]
    mov     qword ptr [rsp + 0x48], r10   // arg9
    mov     r10, qword ptr [rsp + 0x58]
    mov     qword ptr [rsp + 0x50], r10   // arg10
    mov     r10, qword ptr [rsp + 0x60]
    mov     qword ptr [rsp + 0x58], r10   // arg11

    mov     r10, rcx   // syscall ABI: r10 = rcx
    jmp     r11        // syscall; ret -> ret pops [rsp+0x00] = our real return addr
```
## SSN Resolution 

We will reuse the Hell's Gate approach from previous blog. Read SSN directly from ntdll stub bytes at runtime. No hardcoding and this work on every Windows version:

`syscall_gate.h`:

```c
#pragma once
#include <windows.h>

// CC struct: SSN at offset 0x00, gadget pointer at offset 0x08
// pad[6] aligns gad to 8 bytes
typedef struct {
    WORD  ssn;
    BYTE  pad[6];
    PVOID gad;
} CC;

BOOL ResolveCC(const char* funcName, CC* out);

extern NTSTATUS CCStub(
    CC*       cc,
    ULONG_PTR arg1,  ULONG_PTR arg2,  ULONG_PTR arg3,
    ULONG_PTR arg4,  ULONG_PTR arg5,  ULONG_PTR arg6,
    ULONG_PTR arg7,  ULONG_PTR arg8,  ULONG_PTR arg9,
    ULONG_PTR arg10, ULONG_PTR arg11
);
```

`syscall_gate.c`:

```c
#include "syscall_gate.h"
#include <stdio.h>

#define UP   -1
#define DOWN  1

// Hell's Gate: stub is clean, read SSN directly from bytes 4-5
static BOOL HellsGate(PBYTE stub, WORD* ssn) {
    if (stub[0] == 0x4C &&
        stub[1] == 0x8B &&
        stub[2] == 0xD1 &&
        stub[3] == 0xB8 &&
        stub[6] == 0x00 &&
        stub[7] == 0x00)
    {
        *ssn = *(WORD*)(stub + 4);
        return TRUE;
    }
    return FALSE;
}

// Halo's Gate: stub is hooked, scan neighboring stubs (each 32 bytes apart)
// direction: UP (-1) or DOWN (+1)
// adjust SSN by number of steps taken
static BOOL HalosGate(PBYTE stub, int direction, WORD* ssn) {
    for (int i = 1; i <= 32; i++) {
        PBYTE neighbor = stub + (direction * i * 0x20);

        if (neighbor[0] == 0x4C &&
            neighbor[1] == 0x8B &&
            neighbor[2] == 0xD1 &&
            neighbor[3] == 0xB8 &&
            neighbor[6] == 0x00 &&
            neighbor[7] == 0x00)
        {
            WORD neighborSSN = *(WORD*)(neighbor + 4);
            *ssn = (WORD)(neighborSSN - (direction * i));
            return TRUE;
        }
    }
    return FALSE;
}

// Walk ntdll bytes looking for "syscall; ret" gadget (0F 05 C3)
static PVOID FindSyscallGadget(void) {
    PBYTE base = (PBYTE)GetModuleHandleA("ntdll.dll");
    if (!base) return NULL;

    for (DWORD i = 0; i < 0x200000 - 2; i++) {
        if (base[i]   == 0x0F &&
            base[i+1] == 0x05 &&
            base[i+2] == 0xC3)
        {
            return (PVOID)(base + i);
        }
    }
    return NULL;
}

// Resolve CC struct for a named Nt* function
// tries Hell's Gate first, falls back to Halo's Gate if stub is hooked
BOOL ResolveCC(const char* funcName, CC* out) {
    HMODULE ntdll = GetModuleHandleA("ntdll.dll");
    if (!ntdll) return FALSE;

    PBYTE stub = (PBYTE)GetProcAddress(ntdll, funcName);
    if (!stub) return FALSE;

    WORD ssn    = 0;
    BOOL resolved = FALSE;

    // try Hell's Gate: clean stub
    if (HellsGate(stub, &ssn)) {
        resolved = TRUE;
    }
    // try Halo's Gate scanning upward
    else if (HalosGate(stub, UP, &ssn)) {
        resolved = TRUE;
    }
    // try Halo's Gate scanning downward
    else if (HalosGate(stub, DOWN, &ssn)) {
        resolved = TRUE;
    }

    if (!resolved) return FALSE;

    PVOID gadget = FindSyscallGadget();
    if (!gadget) return FALSE;

    out->ssn    = ssn;
    out->pad[0] = out->pad[1] = out->pad[2] = 0;
    out->pad[3] = out->pad[4] = out->pad[5] = 0;
    out->gad    = gadget;
    return TRUE;
}
```

`syscall_stub.S`:

```c
.intel_syntax noprefix
.global CCStub

.text

CCStub:
    // entry rsp+0x00 = return address (gadget's ret uses this)
    // rcx = CC*, rdx = arg1, r8 = arg2, r9 = arg3
    // [rsp+0x28] = arg4, [rsp+0x30] = arg5, [rsp+0x38] = arg6 ...

    movzx   eax, word ptr [rcx]          // SSN -> eax
    mov     r11, qword ptr [rcx + 0x08]  // gadget -> r11

    // shift register args down one slot (drop CC* from rcx)
    mov     rcx, rdx
    mov     rdx, r8
    mov     r8,  r9

    // load arg4 into r9 before we clobber its slot
    mov     r9, qword ptr [rsp + 0x28]

    // slide stack args down one slot so kernel reads them from [rsp+0x28]+
    mov     r10, qword ptr [rsp + 0x30]
    mov     qword ptr [rsp + 0x28], r10   // arg5
    mov     r10, qword ptr [rsp + 0x38]
    mov     qword ptr [rsp + 0x30], r10   // arg6
    mov     r10, qword ptr [rsp + 0x40]
    mov     qword ptr [rsp + 0x38], r10   // arg7
    mov     r10, qword ptr [rsp + 0x48]
    mov     qword ptr [rsp + 0x40], r10   // arg8
    mov     r10, qword ptr [rsp + 0x50]
    mov     qword ptr [rsp + 0x48], r10   // arg9
    mov     r10, qword ptr [rsp + 0x58]
    mov     qword ptr [rsp + 0x50], r10   // arg10
    mov     r10, qword ptr [rsp + 0x60]
    mov     qword ptr [rsp + 0x58], r10   // arg11

    mov     r10, rcx   // syscall ABI: r10 = rcx
    jmp     r11        // syscall; ret -> ret pops [rsp+0x00] = our real return addr
```

`main.c`:

```c
#include <stdio.h>
#include "syscall_gate.h"

int main(void) {
    CC cc_alloc = {0};

    // resolve SSN + gadget for NtAllocateVirtualMemory
    if (!ResolveCC("NtAllocateVirtualMemory", &cc_alloc)) {
        printf("[-] failed to resolve NtAllocateVirtualMemory\n");
        return 1;
    }
    printf("[+] SSN    = 0x%04X\n", cc_alloc.ssn);
    printf("[+] gadget = %p\n",     cc_alloc.gad);

    // NtAllocateVirtualMemory(ProcessHandle, BaseAddress, ZeroBits,
    //                         RegionSize, AllocationType, Protect)
    PVOID  base = NULL;
    SIZE_T size = 0x1000;

    NTSTATUS status = CCStub(
        &cc_alloc,
        (ULONG_PTR)-1,                        // arg1:  ProcessHandle (-1 = current)
        (ULONG_PTR)&base,                     // arg2:  BaseAddress
        (ULONG_PTR)0,                         // arg3:  ZeroBits
        (ULONG_PTR)&size,                     // arg4:  RegionSize
        (ULONG_PTR)(MEM_COMMIT|MEM_RESERVE),  // arg5:  AllocationType
        (ULONG_PTR)PAGE_READWRITE,            // arg6:  Protect
        0, 0, 0, 0, 0                         // arg7-11: unused padding 
    );

    if (status == 0) {
        printf("[+] allocated at %p\n", base);
    } else {
        printf("[-] NtAllocateVirtualMemory failed: 0x%08X\n", (DWORD)status);
    }

    return 0;
}
```

```bash
x86_64-w64-mingw32-gcc syscall_stub.S syscall_gate.c main.c -o main.exe -masm=intel
```

```bash
PS C:\Users\At0m\Desktop> .\main.exe
[+] SSN    = 0x0018
[+] gadget = 00007fffd018d012
[+] allocated at 0000027bacd90000
```

Every stub we had before was just copy-paste with one number swapped out, so collapsing it into a single generic stub was the obvious move. The CC struct just takes that one step further by getting the SSN out of the register slots entirely and bundling it with the gadget pointer so nothing is wasted. 

This is all for this blog, welp it was short but it was something new I learnt that I thought to share.

---

