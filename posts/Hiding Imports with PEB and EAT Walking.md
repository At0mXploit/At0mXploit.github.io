---
title: Hiding Imports with PEB and EAT Walking
tags:
  - PEB-Walking
  - IAT-Walking
---
# Windows Resolving Imports

Before we hide anything, We need to understand what we're hiding from. Every time implant or whatever you made calls `VirtualAlloc` or `CreateThread`, windows already wired that call up before you first line of code ran through the Windows Loader and Import Address Table (IAT).

When we write `ResumeThread` and blah blah in C, the compiler doesn't embed the real address, it can't because ASLR randomizes `kernel32.dll`'s base on every boot. Instead it will try to be naughty and do indirect call through pointer table:

```c
call qword ptr[<IAT entry for ResumeThread>]
```

That pointer lives in `.idata` section, the IAT. The loader finds imports through IAT which is jus an array of `IMAGE_IMPORT_DESCRIPTOR` structs, one per DLL.

```c
typedef struct _IMAGE_IMPORT_DESCRIPTOR {
    DWORD OriginalFirstThunk;  // RVA  to Import Lookup Table (ILT), read-only)
    DWORD TimeDateStamp;
    DWORD ForwarderChain;
    DWORD Name;                // RVA to DLL name string e.g. "KERNEL32.dll"
    DWORD FirstThunk;          // RVA to IAT (patched by loader with real addresses)
} IMAGE_IMPORT_DESCRIPTOR;
```

Each entry in tables is either an ordinal (bit 63 set) or an RVA to an `IMAGE_IMPORT_BY_NAME`:

```c
typedef struct _IMAGE_IMPORT_BY_NAME {
    WORD Hint;      // Index hint into EAT for fast lookup
    CHAR Name[1];   // "CreateThread\0"
} IMAGE_IMPORT_BY_NAME;
```

![](/img/ResumeThread.png)

In above image `pFile` is offset in file on disk (not in memory), `Data` is raw value stored in that offset. `0004BCE4` is an RVA pointing to the `IMAGE_IMPORT_BY_NAME` struct for ResumeThread. `Description` is what raw value represents. Each row here says `Hint/Name RVA` meaning this is the name import. The pair is stored as `Name + Hint` as discussed above. `Value` is what PEview has already followed that RVA and decoded the structure and `0038` there is Hint (the `WORD`) field in `IMAGE_EXPORT_BY_NAME` and `ResumeThread` is function name string.

As convenient it may seem this is root of the detection problem. Every function statically imported is listed in plaintext inside PE's import Directory. AV engine enumerate this list in milliseconds. 

Many people might think Export Address Table (EAT) and Import Address Table (IAT) are same but they are quite different. **IAT** is used by application to call functions provided by external libraries and **EAT** is used by a library (DLL) to publish functions so other applications and libraries can use them. 

Basically IAT is function this program wants to use and EAT is function this DLL provides to others :)

Here is IAT:

![](/img/iat.png)

Here is EAT:

![](/img/x64dbg-iat.png)
# Hiding Imports with `LoadLibrary` and `GetProcAddress` (Not a Good Way)

The loader handles static imports automatically at startup. These two APIs will do same at runtime. 

`LoadLibrary` internally calls `LdrLoadDll` which will first check `PEB->Ldr->InMemoryOrderModuleList` and if the DLL is already loaded it just returns to existing base. If DLL is not loaded it goes to the disk, map the file process its imports  and run `DllMain`. 

`GetProcAddress` manually walks the target DLL's Export Address Table:

1. Parses `IMAGE_EXPORT_DIRECTORY`
2. Binary search `AddressOfNames[]` for function name
3. Get index I and look up `AddressOfNameOrdinals[I]` and get ordinal 0
4. Return `AddressOfFunctions[0]` (If it's a forwarder RVA, recurse into the forwarded DLL)

If you didn't understood above steps don't worry we will implement this exact algorithm in the EAT walking section where everything will be explained.

```c
#include <windows.h>
#include <stdio.h>

int main() {

    FARPROC stuff = GetProcAddress(
        GetModuleHandleA("kernel32.dll"),
        "VirtualProtect"
    );

    printf("0x%p\n", stuff);

    return 0;
}
```

Now if we open the `main.exe` we won't be able to find `VirtualProtect` in IAT:

![](/img/IATvirt.png)

But we will see `GetProcAddress` and `GetModuleHandleA` and the strings of `VirtualAlloc` can also be seen in `.rdata`:

![](/img/rdata.png)

This can be resolved by API hashing which we will do later but the main problem is that mature EDRs hooks on `LdrLoadDll` which means that every load is logged including `LoadLibrary` and also `GetProcAddress` hooks on `GetProcAddressForCaller` which means every resolution is logged. The only exit is to replicate the loader behavior i.e  walk the PEB to find loaded module bases without `LoadLibrary`, walk the EAT directly without `GetProcAddress`, and keep zero suspicious entries in your Import Directory.
# Little bit of yapping on PE

The IAT lives inside PE. It's table of function pointers, one slot per imported function, that the loader fills in at the load time with the real virtual addresses. When code calls `VirtualAlloc` it's going through one of these slots, an indirect call through a pointer the loader wrote.

The EAT lives inside the DLL. As said before it's how DLL says "here are the function I want to share". `kernel32.dll` has one. `ntdll.dll` has one. When the loader needs to fill your IAT slot for `VirtualAlloc`, it goes and reads `kernel32.dll` EAT to find actual address.

<svg width="100%" viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- Box 1: IAT -->
  <rect x="240" y="20" width="200" height="56" rx="8"
        fill="#EEEDFE" stroke="#534AB7" stroke-width="0.5"/>
  <text x="340" y="43" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="500" fill="#3C3489">Your PE's IAT</text>
  <text x="340" y="61" text-anchor="middle" dominant-baseline="central"
        font-size="12" fill="#534AB7">import table</text>

  <!-- Arrow 1 -->
  <line x1="340" y1="76" x2="340" y2="118"
        stroke="#7F77DD" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="370" y="101" text-anchor="start" font-size="12" fill="#888780">loader reads</text>

  <!-- Box 2: EAT -->
  <rect x="240" y="120" width="200" height="56" rx="8"
        fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
  <text x="340" y="143" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="500" fill="#085041">kernel32.dll EAT</text>
  <text x="340" y="161" text-anchor="middle" dominant-baseline="central"
        font-size="12" fill="#0F6E56">export directory</text>

  <!-- Arrow 2 -->
  <line x1="340" y1="176" x2="340" y2="218"
        stroke="#1D9E75" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="370" y="201" text-anchor="start" font-size="12" fill="#888780">resolves to</text>

  <!-- Box 3: Real VA -->
  <rect x="240" y="220" width="200" height="56" rx="8"
        fill="#FAEEDA" stroke="#854F0B" stroke-width="0.5"/>
  <text x="340" y="243" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="500" fill="#633806">VirtualAlloc VA</text>
  <text x="340" y="261" text-anchor="middle" dominant-baseline="central"
        font-size="12" fill="#854F0B">real address</text>
</svg>

As pain in ass it is, the loader does this for every imported function, for every imported DLL, before entry point runs. By the time `main()` executes all IAT slots are already filled.
## Export Directory Structure

The EAT is backed by `IMAGE_EXPORT_DIRECTORY`, which you can find via `OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT]`:

```c
typedef struct _IMAGE_EXPORT_DIRECTORY {
    DWORD Characteristics;
    DWORD TimeDateStamp;
    WORD  MajorVersion;
    WORD  MinorVersion;
    DWORD Name;                  // RVA to DLL name string
    DWORD Base;                  // Ordinal base (usually 1)
    DWORD NumberOfFunctions;     // Total entries in AddressOfFunctions
    DWORD NumberOfNames;         // Number of named exports
    DWORD AddressOfFunctions;    // RVA to array of function RVAs (indexed by ordinal - Base)
    DWORD AddressOfNames;        // RVA to array of RVAs to function name strings
    DWORD AddressOfNameOrdinals; // RVA to array of WORDs mapping name index -> ordinal
} IMAGE_EXPORT_DIRECTORY;
```

Above all these can be explained one by one but the main we need for now that does most of work array are:

- `AddressOfNames[]` = array of RVAs, each pointing to a null-terminated function name strings. So `AddressOfNames[3]` might point to `"VirtualAlloc"`.
- `AddressOfNameOrdinals[]` = parallel to `AddressOfNames`, each entry is a WORD that maps to name's index to its ordinal. So `AddressOfNameOrdinals[3]` might give `15`.
- `AddressOfFunctions[]` = array of function RVAs indexed by ordinal. So `AddressOfFunctions[15]` gives you actual RVA of `VirtualAlloc`.
# EAT Walking

Now that the fundamentals are done let's see steps of resolving a function by name:

1. Walk `AddressOfNames[]` until you find a match.
2. Use that index `i` to read `AddressOfNameOrdinals[i]` which gives you the ordinal.
3. Use the ordinal (minus `Base`) to index to `AddressOfFunctions[]` which is our function RVA.
4. Add the DLL's base address thats the VA we can call.

<svg width="100%" viewBox="0 0 680 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- Step 1 -->
  <rect x="140" y="20" width="400" height="64" rx="8"
        fill="#EEEDFE" stroke="#534AB7" stroke-width="0.5"/>
  <text x="160" y="46" dominant-baseline="central"
        font-size="12" font-weight="500" fill="#3C3489">1. Walk AddressOfNames[]</text>
  <text x="160" y="66" dominant-baseline="central"
        font-size="12" fill="#534AB7">until name matches, note the index i</text>

  <line x1="340" y1="84" x2="340" y2="124"
        stroke="#7F77DD" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 2 -->
  <rect x="140" y="126" width="400" height="64" rx="8"
        fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
  <text x="160" y="152" dominant-baseline="central"
        font-size="12" font-weight="500" fill="#085041">2. Read AddressOfNameOrdinals[i]</text>
  <text x="160" y="172" dominant-baseline="central"
        font-size="12" fill="#0F6E56">gives you the ordinal for that name</text>

  <line x1="340" y1="190" x2="340" y2="230"
        stroke="#1D9E75" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 3 -->
  <rect x="140" y="232" width="400" height="64" rx="8"
        fill="#FAEEDA" stroke="#854F0B" stroke-width="0.5"/>
  <text x="160" y="258" dominant-baseline="central"
        font-size="12" font-weight="500" fill="#633806">3. Index AddressOfFunctions[ordinal - Base]</text>
  <text x="160" y="278" dominant-baseline="central"
        font-size="12" fill="#854F0B">gives you the function RVA</text>

  <line x1="340" y1="296" x2="340" y2="336"
        stroke="#BA7517" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Step 4 -->
  <rect x="140" y="338" width="400" height="64" rx="8"
        fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
  <text x="160" y="364" dominant-baseline="central"
        font-size="12" font-weight="500" fill="#0C447C">4. DLL base + RVA</text>
  <text x="160" y="384" dominant-baseline="central"
        font-size="12" fill="#185FA5">final VA that's ready to call</text>

</svg>

This is what `GetProcAddress` does internally and what we are going to replicate without calling `GetProcAddress`. We will create a function `LoadFunction(PBYTE Module, LPSTR FunctionName)` that:

- Takes DLL's base address and function name string.
- Manually parses the export directory.
- Walks the name table, matches the name, resolves via ordinal.
- Returns the function's virtual address.

Starting from the DLL base, the path to the export directory is:

```c
DLL base
  => IMAGE_DOS_HEADER.e_lfanew         (offset to NT headers)
  => IMAGE_NT_HEADERS
  => OptionalHeader.DataDirectory[0]   (IMAGE_DIRECTORY_ENTRY_EXPORT)
  => VirtualAddress                    (RVA of IMAGE_EXPORT_DIRECTORY)
```

Full code:

```cpp
#include <windows.h>
#include <stdio.h>
#include <string.h>

PVOID LoadFunction( PBYTE Module, LPSTR FunctionName )
{
    PIMAGE_NT_HEADERS       NtHeader         = NULL;
    PIMAGE_EXPORT_DIRECTORY ExpDirectory     = NULL;
    PDWORD                  AddrOfFunctions  = NULL;
    PDWORD                  AddrOfNames      = NULL;
    PWORD                   AddrOfOrdinals   = NULL;
    PVOID                   FunctionAddr     = NULL;
    LPSTR                   FoundName        = NULL;
    CHAR  LowerFoundName   [ MAX_PATH ]      = { 0 };
    CHAR  LowerFunctionName[ MAX_PATH ]      = { 0 };

    // Lowercase the target function name for case-insensitive comparison
    RtlSecureZeroMemory( LowerFunctionName, MAX_PATH );
    memcpy( LowerFunctionName, FunctionName, strlen( FunctionName ) );
    CharLowerBuffA( LowerFunctionName, strlen( FunctionName ) );

    // Walk to NT headers, then to the export directory
    NtHeader     = (PIMAGE_NT_HEADERS)( Module + ( ( PIMAGE_DOS_HEADER ) Module )->e_lfanew );
    ExpDirectory = (PIMAGE_EXPORT_DIRECTORY)( Module + NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].VirtualAddress );

    // Resolve the three EAT arrays from their RVAs
    AddrOfNames     = (PDWORD)( Module + ExpDirectory->AddressOfNames );
    AddrOfFunctions = (PDWORD)( Module + ExpDirectory->AddressOfFunctions );
    AddrOfOrdinals  = (PWORD) ( Module + ExpDirectory->AddressOfNameOrdinals );

    // Walk every named export
    for ( DWORD I = 0; I < ExpDirectory->NumberOfNames; I++ )
    {
        RtlSecureZeroMemory( LowerFoundName, MAX_PATH );

        // AddrOfNames[I] is an RVA to the name string — add module base
        FoundName = ( PCHAR ) Module + AddrOfNames[ I ];

        memcpy( LowerFoundName, FoundName, strlen( FoundName ) );
        CharLowerBuffA( LowerFoundName, strlen( FoundName ) );

        if ( !strcmp( LowerFoundName, LowerFunctionName ) )
        {
            // AddrOfOrdinals[I] gives the ordinal index into AddrOfFunctions
            FunctionAddr = (PVOID)( Module + AddrOfFunctions[ AddrOfOrdinals[ I ] ] );
            return FunctionAddr;
        }
    }

    return NULL;
}
```

Add main function below of it and test:

```c
int main(void)
{
    HMODULE k32 = GetModuleHandleA("kernel32.dll");
    if (!k32) {
        printf("[-] Failed to get kernel32 base\n");
        return 1;
    }

    printf("[+] kernel32.dll base: %p\n\n", k32);

    // Test a few functions
    const char* targets[] = { "VirtualAlloc", "WriteProcessMemory", "CreateThread" };

    for (int i = 0; i < 3; i++) {
        PVOID realVA   = (PVOID)GetProcAddress(k32, targets[i]);
        PVOID customVA = LoadFunction((PBYTE)k32, (LPSTR)targets[i]);

        printf("Function: %s\n", targets[i]);
        printf("  GetProcAddress: %p\n", realVA);
        printf("  LoadFunction:   %p\n", customVA);
        printf("  Match: %s\n\n", (realVA == customVA) ? "YES" : "NO");
    }

    return 0;
}
```

```bash
PS C:\Users\At0m\Desktop> .\eat.exe
[+] kernel32.dll base: 00007ffb86250000

Function: VirtualAlloc
  GetProcAddress: 00007ffb86268c90
  LoadFunction:   00007ffb86268c90
  Match: YES

Function: WriteProcessMemory
  GetProcAddress: 00007ffb8628d2f0
  LoadFunction:   00007ffb8628d2f0
  Match: YES

Function: CreateThread
  GetProcAddress: 00007ffb8626bd30
  LoadFunction:   00007ffb8626bd30
  Match: YES
```

Everything seems good till now but if we add some API like `HeapAlloc` and test:

```bash
PS C:\Users\At0m\Desktop> .\eat.exe
[+] kernel32.dll base: 00007ffb86250000

Function: HeapAlloc
  GetProcAddress: 00007ffb8817a9a0
  LoadFunction:   00007ffb862f3617
  Match: NO
```

Uh oh! This doesn't match. `GetProcAddress` returned something at `0x7ffb881...` while our `LoadFunction` returned `0x7ffb862...` which is suspiciously close to `kernel32`'s base of `0x7ffb86250000`. If we tried to actually call that pointer, we'd jump straight into garbage and crash. So what happened?

`HeapAlloc` doesn't actually live in `kernel32.dll`. The real implementation is in `ntdll.dll` as `RtlAllocateHeap`. But for backwards compability `kernel32` still has no export for same `HeapAlloc` so old programs keep linking. `kernel32` exports `HeapAlloc` but instead of pointing to the code, it points to a string that says "go look in `ntdll` RtlAllocateHeap" (Ya can think of it as symbolic link inside of PE format). That string is called a **forwarder**. Microsoft uses this everywhere so they can shuffle implementation between `kernel32`, `kernelbase` and `ntdll` across Windows version without breaking apps. We can look it from the x64dbg too:

![](/img/forwarders.png)

We ask "does this RVA point inside the export section, or somewhere else in the image?" A real function's RVA points into `.text` (code section) which is way outside the export directory region. A forwarder string lives inside `.edata` because the linker stuffs it there alongside the other export metadata. 

Format is always `"DLLNAME.FunctionName"`, dot-separated and null-terminated. So our resolution algorithm needs one more step:

- Walk `AddressOfNames[]` until name matches, note index `i`.
- Read `AddressOfNameOrdinals[i]` to get the ordinal.
- Read `AddressOfFunctions[ordinal - Base]` to get the RVA.
- **Check if the RVA falls inside the export directory region**. If it does, it's a forwarder, read it as a string, split on the dot, get the base of the forwarded DLL, recurse.
- Otherwise add the DLL base and return.

The check itself is two comparisons. We need the export directory's RVA and size from the data directory:

```cpp
DWORD ExpDirRVA  = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
DWORD ExpDirSize = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size;

DWORD FuncRva = AddrOfFunctions[AddrOfOrdinals[I]];

if (FuncRva >= ExpDirRVA && FuncRva < ExpDirRVA + ExpDirSize)
{
    // Forwarder. Read as string like "NTDLL.RtlAllocateHeap"
    LPSTR Forwarder = (LPSTR)(Module + FuncRva);

    // Split on '.'
    CHAR DllName[MAX_PATH]  = { 0 };
    CHAR FuncName[MAX_PATH] = { 0 };

    LPSTR Dot = strchr(Forwarder, '.');
    if (!Dot) return NULL;

    size_t DllLen = Dot - Forwarder;
    memcpy(DllName, Forwarder, DllLen);
    strcpy(DllName + DllLen, ".dll");        // "NTDLL" -> "NTDLL.dll"
    strcpy(FuncName, Dot + 1);                // "RtlAllocateHeap"

    // Get the forwarded DLL's base. For now we use GetModuleHandleA,
    // but in the final implant this will be another PEB walk.
    HMODULE NextModule = GetModuleHandleA(DllName);
    if (!NextModule) return NULL;

    // Recurse, the forwarded DLL might forward again
    return LoadFunction((PBYTE)NextModule, FuncName);
}

// Normal export
FunctionAddr = (PVOID)(Module + FuncRva);
return FunctionAddr;
```

Forwarders can chain The DLL you forward to might itself forward somewhere else. `kernel32.HeapAlloc` -> `ntdll.RtlAllocateHeap` is one hop but other APIs can chain through `kernelbase` and the `api-ms-win-*` API set DLLs. Always recurse, never assume one hop is enough.

Full code:

```cpp
#include <windows.h>
#include <stdio.h>
#include <string.h>

PVOID LoadFunction( PBYTE Module, LPSTR FunctionName )
{
    PIMAGE_NT_HEADERS       NtHeader         = NULL;
    PIMAGE_EXPORT_DIRECTORY ExpDirectory     = NULL;
    PDWORD                  AddrOfFunctions  = NULL;
    PDWORD                  AddrOfNames      = NULL;
    PWORD                   AddrOfOrdinals   = NULL;
    PVOID                   FunctionAddr     = NULL;
    LPSTR                   FoundName        = NULL;
    CHAR  LowerFoundName   [ MAX_PATH ]      = { 0 };
    CHAR  LowerFunctionName[ MAX_PATH ]      = { 0 };

    // Lowercase the target function name for case-insensitive comparison
    RtlSecureZeroMemory( LowerFunctionName, MAX_PATH );
    memcpy( LowerFunctionName, FunctionName, strlen( FunctionName ) );
    CharLowerBuffA( LowerFunctionName, strlen( FunctionName ) );

    // Walk to NT headers, then to the export directory
    NtHeader     = (PIMAGE_NT_HEADERS)( Module + ( ( PIMAGE_DOS_HEADER ) Module )->e_lfanew );
    ExpDirectory = (PIMAGE_EXPORT_DIRECTORY)( Module + NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].VirtualAddress );

    // Grab export directory bounds for forwarder detection
    DWORD ExpDirRVA  = NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].VirtualAddress;
    DWORD ExpDirSize = NtHeader->OptionalHeader.DataDirectory[ IMAGE_DIRECTORY_ENTRY_EXPORT ].Size;

    // Resolve the three EAT arrays from their RVAs
    AddrOfNames     = (PDWORD)( Module + ExpDirectory->AddressOfNames );
    AddrOfFunctions = (PDWORD)( Module + ExpDirectory->AddressOfFunctions );
    AddrOfOrdinals  = (PWORD) ( Module + ExpDirectory->AddressOfNameOrdinals );

    // Walk every named export
    for ( DWORD I = 0; I < ExpDirectory->NumberOfNames; I++ )
    {
        RtlSecureZeroMemory( LowerFoundName, MAX_PATH );

        // AddrOfNames[I] is an RVA to the name string, add module base
        FoundName = ( PCHAR ) Module + AddrOfNames[ I ];

        memcpy( LowerFoundName, FoundName, strlen( FoundName ) );
        CharLowerBuffA( LowerFoundName, strlen( FoundName ) );

        if ( !strcmp( LowerFoundName, LowerFunctionName ) )
        {
            // AddrOfOrdinals[I] gives the ordinal index into AddrOfFunctions
            DWORD FuncRva = AddrOfFunctions[ AddrOfOrdinals[ I ] ];

            // Forwarder check: if the RVA points inside the export dir, it's a string
            if ( FuncRva >= ExpDirRVA && FuncRva < ExpDirRVA + ExpDirSize )
            {
                // Forwarder. Read as string like "NTDLL.RtlAllocateHeap"
                LPSTR Forwarder = (LPSTR)( Module + FuncRva );

                // Split on '.'
                CHAR DllName [ MAX_PATH ] = { 0 };
                CHAR FuncName[ MAX_PATH ] = { 0 };

                LPSTR Dot = strchr( Forwarder, '.' );
                if ( !Dot ) return NULL;

                size_t DllLen = Dot - Forwarder;
                memcpy ( DllName, Forwarder, DllLen );
                strcpy ( DllName + DllLen, ".dll" );    // "NTDLL" -> "NTDLL.dll"
                strcpy ( FuncName, Dot + 1 );           // "RtlAllocateHeap"

                // Get the forwarded DLL's base. For now we use GetModuleHandleA,
                // but in the final implant this will be another PEB walk.
                HMODULE NextModule = GetModuleHandleA( DllName );
                if ( !NextModule ) return NULL;

                // Recurse, the forwarded DLL might forward again
                return LoadFunction( (PBYTE)NextModule, FuncName );
            }

            // Normal export
            FunctionAddr = (PVOID)( Module + FuncRva );
            return FunctionAddr;
        }
    }

    return NULL;
}

int main(void)
{
    HMODULE k32 = GetModuleHandleA("kernel32.dll");
    if (!k32) {
        printf("[-] Failed to get kernel32 base\n");
        return 1;
    }

    printf("[+] kernel32.dll base: %p\n\n", k32);

    const char* targets[] = {
        "VirtualAlloc",
        "WriteProcessMemory",
        "CreateThread",
        "HeapAlloc"        // forwarder
    };

    for (int i = 0; i < 4; i++) {
        PVOID realVA   = (PVOID)GetProcAddress(k32, targets[i]);
        PVOID customVA = LoadFunction((PBYTE)k32, (LPSTR)targets[i]);

        printf("Function: %s\n", targets[i]);
        printf("  GetProcAddress: %p\n", realVA);
        printf("  LoadFunction:   %p\n", customVA);
        printf("  Match: %s\n\n", (realVA == customVA) ? "YES" : "NO");
    }

    return 0;
}
```

```powershell
PS C:\Users\At0m\Desktop> .\eat.exe
[+] kernel32.dll base: 00007ffb86250000

Function: VirtualAlloc
  GetProcAddress: 00007ffb86268c90
  LoadFunction:   00007ffb86268c90
  Match: YES

Function: WriteProcessMemory
  GetProcAddress: 00007ffb8628d2f0
  LoadFunction:   00007ffb8628d2f0
  Match: YES

Function: CreateThread
  GetProcAddress: 00007ffb8626bd30
  LoadFunction:   00007ffb8626bd30
  Match: YES

Function: HeapAlloc
  GetProcAddress: 00007ffb8817a9a0
  LoadFunction:   00007ffb8817a9a0
  Match: YES
```

So we have `LoadFunction` that resolves any export from a DLL base. But there is one ugly cheat sitting in our code, `GetModuleHandleA("kernel32.dll")`. That's still an import. It still shows up in the IAT. It defeats the entire point of what we are doing. If we can replace that one call we have a fully self-resolving implant that touches zero suspicious imports.

The replacement lives in a structure called the **PEB** (Process Environment Block). Every running process has one and Windows itself puts the base addresses of every loaded DLL inside it, including `kernel32.dll` and `ntdll.dll`. We just need to know where to look.
# PEB Walking
### TEB and PEB

When Windows creates a thread it also creates a **TEB** (Thread Environment Block) for it. The TEB holds per thread data like the thread ID, last error value, stack base etc. It also holds a pointer to the **PEB** which is process-wide.

The CPU keeps a pointer to the TEB and PEB in a `gs` segment register.

**x64:**

- TEB: `gs:[0x30]` (the `NtTib.Self` self-pointer)
- PEB: `gs:[0x60]`

**x86:**

- TEB: `fs:[0x18]` (the `NtTib.Self` self-pointer)
- PEB: `fs:[0x30]`


These offsets are documented, stable across every Windows version since XP and most importantly they don't require calling any API to read. The segment register is just sitting there. From the TEB we walk to the PEB at offset `0x60` (x64) or `0x30` (x86) and from PEB we walk to the loader data.

```c
ctypedef struct _PEB {
    BYTE Reserved1[2];
    BYTE BeingDebugged;
    BYTE Reserved2[1];
    PVOID Reserved3[2];
    PPEB_LDR_DATA Ldr;              // this is what we want
    // ... rest doesn't matter for now
} PEB, *PPEB;
```

`Ldr` points to a `PEB_LDR_DATA` structure which holds three doubly linked lists of every module loaded in the process:

```c
ctypedef struct _PEB_LDR_DATA {
    ULONG Length;
    BOOLEAN Initialized;
    PVOID SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;       // we'll use this one
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA, *PPEB_LDR_DATA;
```

Three lists, same modules, different sort orders. We will use `InMemoryOrderModuleList`. Each entry in that list is a `LDR_DATA_TABLE_ENTRY`:

```c
ctypedef struct _LDR_DATA_TABLE_ENTRY {
    LIST_ENTRY InLoadOrderLinks;
    LIST_ENTRY InMemoryOrderLinks;        // we link from here
    LIST_ENTRY InInitializationOrderLinks;
    PVOID DllBase;                        // the base address we want
    PVOID EntryPoint;
    ULONG SizeOfImage;
    UNICODE_STRING FullDllName;
    UNICODE_STRING BaseDllName;           // "kernel32.dll" etc.
    // ... more fields
} LDR_DATA_TABLE_ENTRY, *PLDR_DATA_TABLE_ENTRY;
```

---


