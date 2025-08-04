---
title: Memory Forensics - MemLabs
slug: Memory-Forensics-MemLabs
tags: [Digital Forensics, Memory Forensics, Volatility, MemLabs, CTFs, Writeups, Notes]
---

![MemLabs-Writeup](https://64.media.tumblr.com/e6eccba832a651a66400144fb11e7fec/c7783fdaba58c689-50/s1280x1920/4dead901f037f2994013df533e029f59ca0b4aa0.gif)

# Memory Forensics

**Digital forensics** is the broad field that involves identifying, preserving, analyzing, and presenting digital evidence from electronic devices (e.g., computers, phones, networks) while **Memory forensics** is the process of analyzing a computer's **volatile memory (RAM)** / Primary Memory (**Volatile memory** is a type of computer memory that loses all stored data when the power is turned off. ) to uncover evidence of malicious activity, such as malware, data breaches, or system intrusions.

An application is like during a cybercrime raid, investigators capture the suspect’s laptop without powering it down. A memory dump is taken and analyzed using **Volatility**. In RAM, they uncover a fileless trojan running in a legitimate process, hidden from the disk. They recover unencrypted chat logs, session tokens, and private keys for a crypto wallet. None of this data existed on the hard drive it all lived in memory. This crucial evidence links the suspect to a **real-time data theft operation**.

I am doing **MemLabs** Labs, [MemLabs](https://github.com/stuxnet999/MemLabs) is an educational, introductory set of CTF-styled challenges which is aimed to encourage students, security researchers and also CTF players to get started with the field of **Memory Forensics**. We will find 3 flags in a particular lab, Concatenate all the flags like this: `flag{stage1_is_n0w_d0n3} flag{stage2_is_n0w_d0n3} flag{stage3_is_n0w_d0n3}` More more information and labs checkout their [Github](https://github.com/stuxnet999/MemLabs). There are total of 7 Labs from easy to hard, I am trying to learn myself.
# Volatility Installation

**Volatility** is a powerful **open-source memory forensics tool** used to analyze RAM dumps and extract digital evidence from volatile memory. Since MemLabs challenges are old, it is best to use `Volatility2.6` with it. Since volatility 2 have more plugins that are not yet to import to volatility 3 so we will have no choice but to use volatility 2.

To install it in Linux:

```bash
~/MemLabs ❯ wget https://github.com/volatilityfoundation/volatility/releases/download/2.6.1/volatility_2.6_lin64_standalone.zip
```

```bash
❯ unzip volatility_2.6_lin64_standalone.zip  
```

```bash
~/MemLabs/volatility ❯ ls
AUTHORS.txt  LEGAL.txt    README.txt
CREDITS.txt  LICENSE.txt  volatility_2.6_lin64_standalone

~/MemLabs/volatility ❯ sudo mv volatility_2.6_lin64_standalone  /usr/bin/volatility

~/MemLabs/volatility ❯ volatility -h 
<SNIP>
```

We will also need plugin, clone this [repo](https://github.com/superponible/volatility-plugins)

```bash
~/MemLabs ❯ git clone https://github.com/superponible/volatility-plugins
```

Now if we run:

```bash
~/MemLabs ❯ volatility --plugins=volatility-plugins --help
Volatility Foundation Volatility Framework 2.6
*** Failed to import volatility.plugins.chromehistory (ImportError: No module named csv)
*** Failed to import volatility.plugins.firefoxhistory (ImportError: No module named csv)
```

We will see this error, to fix it you need to modify `chromehistory.py` and `firefoxhistory.py`. In `chromehistory.py`:

```python
# <SNIP>
import volatility.plugins.common as common
import volatility.scan as scan
import volatility.utils as utils
import volatility.addrspace as addrspace
import volatility.debug as debug
import volatility.obj as obj
import binascii
import sqlite_help
#import csv - Comment this out
from Crypto.Cipher import AES
#from Crypto.Protocol.KDF import PBKDF2 - Comment this out
# <SNIP>
```

In `firefoxhistory.py`:

```python
# <SNIP>
import volatility.plugins.common as common
import volatility.scan as scan
import volatility.utils as utils
import volatility.addrspace as addrspace
import volatility.debug as debug
import volatility.obj as obj
import binascii
import sqlite_help
#import csv - Comment this out
from datetime import datetime
# <SNIP>
```

Now everything will work normally.
# MemLabs Lab 0 - Never Too Late Mister
## **Challenge Description**

My friend John is an "environmental" activist and a humanitarian. He hated the ideology of Thanos from the Avengers: Infinity War. He sucks at programming. He used too many variables while writing any program. One day, John gave me a memory dump and asked me to find out what he was doing while he took the dump. Can you figure it out for me?

Challenge file: [Google drive](https://drive.google.com/file/d/1MjMGRiPzweCOdikO3DTaVfbdBK5kyynT/view)

This is a sample challenge, it will only have 1 flag for this.
## Solution

We will need to always look at description because Forensics is vast field and we will most of times going to another direction or rabbit hole. We can see the word `environmental` is quoted which could mean something about environment variables.

```bash
❯ tar -xJvf Challenge.tar.xz

Challenge.raw
```

First thing we do with dump is that we can find out which operating system was dump taken on, for that we can use `imageinfo` plugin.

> Output of Volatility may take some time.

```bash
❯ volatility -f Challenge.raw imageinfo 

Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...


          Suggested Profile(s) : Win7SP1x86_23418, Win7SP0x86, Win7SP1x86
                     AS Layer1 : IA32PagedMemoryPae (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_0/Challenge.raw)
                      PAE type : PAE
                           DTB : 0x185000L
                          KDBG : 0x8273cb78L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0x80b96000L
             KUSER_SHARED_DATA : 0xffdf0000L
           Image date and time : 2018-10-23 08:30:51 UTC+0000
     Image local date and time : 2018-10-23 14:00:51 +0530
```

We got different profiles which means OS but it has detected multiple services of `Windows 7`, we can use any but if we get error with it later we can switch another profiles.

Now we can use `--profile` flag to analyze with the profile we got and `pslist` plugin to see all process lists.

```bash
❯ volatility -f Challenge.raw --profile=Win7SP1x86_23418 pslist
```

![lab_0_1.png](/img/lab_0_1.png)

We got many processes lists, `DumpIt.exe` is service that might seems out of place but it is just service ran when dumping all this from RAM to Memory file. `conhost.exe` is used to run console application in Windows, We can see `cmd.exe` is being run which is suspicious. If John has `cmd.exe` he also must have ran some commands.

We can look at CMD history using plugin `cmdscan`.

```bash
❯ volatility -f Challenge.raw --profile=Win7SP1x86_23418 cmdscan
Volatility Foundation Volatility Framework 2.6
**************************************************
CommandProcess: conhost.exe Pid: 2104
CommandHistory: 0x300498 Application: cmd.exe Flags: Allocated, Reset
CommandCount: 1 LastAdded: 0 LastDisplayed: 0
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x5c
Cmd #0 @ 0x2f43c0: C:\Python27\python.exe C:\Users\hello\Desktop\demon.py.txt
Cmd #12 @ 0x2d0039: ???
Cmd #19 @ 0x300030: ???
Cmd #22 @ 0xff818488: ?
Cmd #25 @ 0xff818488: ?
Cmd #36 @ 0x2d00c4: /?0?-???-
Cmd #37 @ 0x2fd058: 0?-????
**************************************************
CommandProcess: conhost.exe Pid: 2424
CommandHistory: 0x2b04c8 Application: DumpIt.exe Flags: Allocated
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x5c
Cmd #22 @ 0xff818488: ?
Cmd #25 @ 0xff818488: ?
Cmd #36 @ 0x2800c4: *?+?(???(
Cmd #37 @ 0x2ad070: +?(????
```

This may seem overwhelming at first but its simple. We see two process that was ran `cmd.exe` and `DumpIt.exe`. We see one commands in CMD which is 

```cmd
Cmd #0 @ 0x2f43c0: C:\Python27\python.exe C:\Users\hello\Desktop\demon.py.txt
```

Its running Python script. We can use plugin `consoles` to check its Output and Input.

```bash
❯ volatility -f Challenge.raw --profile=Win7SP1x86_23418 consoles
Volatility Foundation Volatility Framework 2.6
**************************************************
ConsoleProcess: conhost.exe Pid: 2104
Console: 0xe981c0 CommandHistorySize: 50
HistoryBufferCount: 2 HistoryBufferMax: 4
OriginalTitle: %SystemRoot%\system32\cmd.exe
Title: C:\Windows\system32\cmd.exe
AttachedProcess: cmd.exe Pid: 2096 Handle: 0x5c
----
CommandHistory: 0x300690 Application: python.exe Flags: 
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x0
----
CommandHistory: 0x300498 Application: cmd.exe Flags: Allocated, Reset
CommandCount: 1 LastAdded: 0 LastDisplayed: 0
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x5c
Cmd #0 at 0x2f43c0: C:\Python27\python.exe C:\Users\hello\Desktop\demon.py.txt
----
Screen 0x2e6368 X:80 Y:300
Dump:
Microsoft Windows [Version 6.1.7601]                                            
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.                 

C:\Users\hello>C:\Python27\python.exe C:\Users\hello\Desktop\demon.py.txt       
335d366f5d6031767631707f                                 <SNIP>
```

We get interesting text `335d366f5d6031767631707f`, this also might be hash or hex value using [CyberChef](https://gchq.github.io/CyberChef/) or from terminal. Upon using CyberChef it didn't identify it has any hash.

```bash
❯ echo 335d366f5d6031767631707f | xxd -r -p

3]6o]`1vv1p
```

It's ASCII format also doesn't make sense, So we will leave it behind for later or it just might be. In description we saw quote of word `environment` which could mean something about environment variables. **Environment variables** are key-value pairs used by the operating system and programs to store configuration settings and system information.We can see it using `envars` plugin. Every process when starts, it starts with some environment variables. Output is very long.

```bash
❯ volatility -f Challenge.raw --profile=Win7SP1x86_23418 envars
<SNIP>
    2424 conhost.exe          0x002934b0 Thanos                         xor and password
<SNIP>
```

It shows Thanos environment variable as `xor and password` which could possibly be hint for the value we had above `335d366f5d6031767631707f`, We can again to go CyberChef and XOR it to get some value. Since we dont have key we can do XOR Brute-Force with that Hex decoded value `3]6o]'1vv1p`.

![lab_0_2.png](/img/lab_0_2.png)

As we can see we got few or half part of flag `1_4m_b3tt3r}`, We need to find another part of flag. In hint we also had `password`, Maybe we have to dump passwords using plugin `hashdump`.

We know that password hashes (not the plaintext passwords) are stored in the **SAM (Security Account Manager)** file on disk:

```cmd
C:\Windows\System32\config\SAM
```

But it is stored in SSD/HDD, `So how does it dump?` It dumps from the `cache` which is stored in RAM.

```bash
❯ volatility -f Challenge.raw --profile=Win7SP1x86_23418 hashdump
Volatility Foundation Volatility Framework 2.6
Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
hello:1000:aad3b435b51404eeaad3b435b51404ee:101da33f44e92c27835e64322d72e8b7:::
```

We have to Hashes, Now we can crack it using John The Ripper but I prefer [crackstation](https://crackstation.net/) because its wordlist is of 15GB while `rockyou.txt` is of some MBs. 

![lab_0_3.png](/img/lab_0_3.png)

Crackstation cannot crack it so its unlikely to be cracked using other tools.

But, This is actually a issue in Challenge which we can look at this [closed issues](https://github.com/stuxnet999/MemLabs/issues/2), where author has said this:

```
Yes, I am also not sure why this issue is coming up. Actually, this challenge that I made is 2 years old and I used [https://md5decrypt.net/en/Ntlm/](https://md5decrypt.net/en/Ntlm/)for cracking the hash but it seems they have **refreshed** their database and this hash is no longer present.

That is the reason that I used Lab-0 as a sample challenge by providing the walkthrough.
```

So its uncrackable and we an take this hash `101da33f44e92c27835e64322d72e8b7` as our win.

We can find which plugin does what in Volatility, Read this [Command Reference](https://github.com/volatilityfoundation/volatility/wiki/command-reference)
# MemLabs Lab 1 - Beginner's Luck
## **Challenge description**

My sister's computer crashed. We were very fortunate to recover this memory dump. Your job is get all her important files from the system. From what we remember, we suddenly saw a black window pop up with some thing being executed. When the crash happened, she was trying to draw something. Thats all we remember from the time of crash.

**Note**: This challenge is composed of 3 flags.

**Challenge file**: [MemLabs_Lab1](https://mega.nz/#!6l4BhKIb!l8ATZoliB_ULlvlkESwkPiXAETJEF7p91Gf9CWuQI70)

The commpressed archive

- MD5 hash: `919a0ded944c427b7f4e5c26a6790e8d`

The memory dump

- MD5 hash: `b9fec1a443907d870cb32b048bda9380`
## Solution

```bash
❯ 7z x lab_1.7z
```

We should always check Integrity of file.

```bash
❯ md5sum MemoryDump_Lab1.raw
b9fec1a443907d870cb32b048bda9380  MemoryDump_Lab1.raw
```

It matches the description hash so it's correct file.

```
My sister's computer crashed. We were very fortunate to recover this memory dump. Your job is get all her important files from the system. From what we remember, we suddenly saw a black window pop up with some thing being executed. When the crash happened, she was trying to draw something. Thats all we remember from the time of crash.
```

This is big hint for us, we know that black window popup is mostly CMD and draw something means she was using MS-Paint or Photoshop or other software.

```bash
❯ volatility -f MemoryDump_Lab1.raw imageinfo 
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...


          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_1/MemoryDump_Lab1.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800028100a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff80002811d00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2019-12-11 14:38:00 UTC+0000
     Image local date and time : 2019-12-11 20:08:00 +0530
```

We can now check its processes.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 pslist

Volatility Foundation Volatility Framework 2.6
Offset(V)          Name                    PID   PPID   Thds     Hnds   Sess  Wow64 Start                          Exit                          
------------------ -------------------- ------ ------ ------ -------- ------ ------ ------------------------------ ------------------------------
<SNIP>                               
0xfffffa8002222780 cmd.exe                1984    604      1       21      1      0 2019-12-11 14:34:54 UTC+0000  <SNIP>   
0xfffffa80022bab30 mspaint.exe            2424    604      6      128      1      0 2019-12-11 14:35:14 UTC+0000  
<SNIP>   
0xfffffa8001010b30 WinRAR.exe             1512   2504      6      207      2      0 2019-12-11 14:37:23 UTC+0000  <SNIP>    
```

Only these are interesting processes. We can now use `cmdscan` to see history.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 cmdscan

Volatility Foundation Volatility Framework 2.6
**************************************************
CommandProcess: conhost.exe Pid: 2692
CommandHistory: 0x1fe9c0 Application: cmd.exe Flags: Allocated, Reset
CommandCount: 1 LastAdded: 0 LastDisplayed: 0
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x60
Cmd #0 @ 0x1de3c0: St4G3$1
Cmd #15 @ 0x1c0158: 
Cmd #16 @ 0x1fdb30: 
**************************************************
CommandProcess: conhost.exe Pid: 2260
CommandHistory: 0x38ea90 Application: DumpIt.exe Flags: Allocated
CommandCount: 0 LastAdded: -1 LastDisplayed: -1
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x60
Cmd #15 @ 0x350158: 8
Cmd #16 @ 0x38dc00: 8
```

As we can see its running `St4G3$1` command we can now see its Input or Output using `consoles`.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 consoles

Volatility Foundation Volatility Framework 2.6
**************************************************
ConsoleProcess: conhost.exe Pid: 2692
Console: 0xff756200 CommandHistorySize: 50
HistoryBufferCount: 1 HistoryBufferMax: 4
OriginalTitle: %SystemRoot%\system32\cmd.exe
Title: C:\Windows\system32\cmd.exe - St4G3$1
AttachedProcess: cmd.exe Pid: 1984 Handle: 0x60
----
CommandHistory: 0x1fe9c0 Application: cmd.exe Flags: Allocated, Reset
CommandCount: 1 LastAdded: 0 LastDisplayed: 0
FirstCommand: 0 CommandCountMax: 50
ProcessHandle: 0x60
Cmd #0 at 0x1de3c0: St4G3$1
----
Screen 0x1e0f70 X:80 Y:300
Dump:
Microsoft Windows [Version 6.1.7601]                                            
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.                 
                                                                                
C:\Users\SmartNet>St4G3$1                                                       
ZmxhZ3t0aDFzXzFzX3RoM18xc3Rfc3Q0ZzMhIX0=                                        
Press any key to continue . . .      
<SNIP>
```

`ZmxhZ3t0aDFzXzFzX3RoM18xc3Rfc3Q0ZzMhIX0=` seems like `base64` so decode it.

```bash
❯ echo ZmxhZ3t0aDFzXzFzX3RoM18xc3Rfc3Q0ZzMhIX0= | base64 -d
flag{th1s_1s_th3_1st_st4g3!!}
```

We got first Flag.

Now we can look at process `mspaint.exe` which PID is `2424`, We can dump its process memory using volatility. We can dump what was running in MS-Paint and then see that image in other software. We can dump memory using `memdump` plugin.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 memdump -p 2424 -D .

Volatility Foundation Volatility Framework 2.6
************************************************************************
Writing mspaint.exe [  2424] to 2424.dmp
```

`-p` flag for its Process ID and `-D` for destination.

```bash
❯ ls             
2424.dmp  MemoryDump_Lab1.raw
```

We got `2424.dmp` we need to view it using GIMP or other Photo Editing Software. We have dumped whole memory of MS-Paint, it will have everything other than images also like position of cursor, navabar, etc... which are junk data. We will need to find our image content in all that junk. If we try viewing `.dmp` in GIMP it wont be able to open because it can't process `.dmp` file, If we want to give raw data and is in unorganized manner we have to rename it to `.data` extension.

```bash
❯ mv 2424.dmp 2424.data  
❯ gimp 2424.data 
```

After running gimp we see our junk data, We need to make put specific offset, width, height such that the content is readable. It will take hours to do fr. Its basically a hit and trial method.

![lab_1_1.png](/img/lab_1_1.png)

After trying and scrolling down we got text that's upside down at:

- `Offset`: `0`
- `Width`: `3280`
- `Height`: `1000`

If we open it and flip it vertically we will get our second flag as `flag{Good_Boy_good_girl}`.

Now for last flag, we see `Winrar.exe` which is something interesting process. We know there are two types of interface: **Command-Line Interface (CLI)** and **Graphical User Interface (GUI)**. Every GUI is essentially running CLI in backend. We can use `cmdline` plugin to see what arguments were supplied to that process.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 cmdline
<SNIP>
************************************************************************
WinRAR.exe pid:   1512
Command line : "C:\Program Files\WinRAR\WinRAR.exe" "C:\Users\Alissa Simpson\Documents\Important.rar"
************************************************************************
<SNIP>
```

Now we want `Important.rar`, We can use `filescan` plugin to see all files stored in RAM or Cache. We can specify it using `grep` because whole scan will be very long.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 filescan | grep -i important.rar

Volatility Foundation Volatility Framework 2.6
0x000000003fa3ebc0      1      0 R--r-- \Device\HarddiskVolume2\Users\Alissa Simpson\Documents\Important.rar
0x000000003fac3bc0      1      0 R--r-- \Device\HarddiskVolume2\Users\Alissa Simpson\Documents\Important.rar
0x000000003fb48bc0      1      0 R--r-- \Device\HarddiskVolume2\Users\Alissa Simpson\Documents\Important.rar
```

The file appears three times because multiple file objects referencing the same path exist in memory, possibly due to multiple opens or remnants of past accesses. Each entry represents a different memory structure pointing to the same file like shortcuts or other things.

We now have address `0x000000003fa3ebc0` of file. If we want to dump address memory we can use `dumpfiles` plugin with flag `-Q` for address and `-D` for destination.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003fa3ebc0 -D .

Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3fa3ebc0   None   \Device\HarddiskVolume2\Users\Alissa Simpson\Documents\Important.rar
❯ mv file.None.0xfffffa8001034450.dat file.rar  
```

```bash
❯ unrar e file.rar

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal

Archive comment:
Password is NTLM hash(in uppercase) of Alissa account passwd.

Extracting from file.rar

Enter password (will not be echoed) for flag3.png: 
```

`Password is NTLM hash(in uppercase) of Alissa account passwd.` We can get using `hashdump` plugin like in Lab 0.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab1.raw --profile=Win7SP1x64 hashdump                            

Volatility Foundation Volatility Framework 2.6
Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SmartNet:1001:aad3b435b51404eeaad3b435b51404ee:4943abb39473a6f32c11301f4987e7e0:::
HomeGroupUser$:1002:aad3b435b51404eeaad3b435b51404ee:f0fc3d257814e08fea06e63c5762ebd5:::
Alissa Simpson:1003:aad3b435b51404eeaad3b435b51404ee:f4ff64c8baac57d22f22edc681055ba6:::
```

Put this Alissa hash `f4ff64c8baac57d22f22edc681055ba6` in Uppercase which is `F4FF64C8BAAC57D22F22EDC681055BA6`.

```bash
 unrar e file.rar

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal

Archive comment:
Password is NTLM hash(in uppercase) of Alissa account passwd.

Extracting from file.rar

Enter password (will not be echoed) for flag3.png: F4FF64C8BAAC57D22F22EDC681055BA6

Extracting  flag3.png                                                 OK 
All OK
```

View `flag3.png` and we get flag `flag{w3ll_3rd_stage_was_easy}`.
# MemLabs Lab 2 - Beginner's Luck
## **Challenge description**

One of the clients of our company, lost the access to his system due to an unknown error. He is supposedly a very popular "environmental" activist. As a part of the investigation, he told us that his go to applications are browsers, his password managers etc. We hope that you can dig into this memory dump and find his important stuff and give it back to us.

**Note**: This challenge is composed of 3 flags.

**Challenge file**: [MemLabs_Lab2](https://mega.nz/#!ChoDHaja!1XvuQd49c7-7kgJvPXIEAst-NXi8L3ggwienE1uoZTk)

The commpressed archive

- MD5 hash: `75d2ee1fcf2bc8a25329723e6ce2be93`

The memory dump

- MD5 hash: `ddb337936a75153822baed718851716b`
## Solution

There are some important hints in description itself like `Environmental` refers to environment variables and browsers and password managers.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...

          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_2/MemoryDump_Lab2.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800027f20a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff800027f3d00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2019-12-14 10:38:46 UTC+0000
     Image local date and time : 2019-12-14 16:08:46 +0530
```

We can now look for processes.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 pslist
Volatility Foundation Volatility Framework 2.6
Offset(V)          Name                    PID   PPID   Thds     Hnds   Sess  Wow64 Start                          Exit                          
------------------ -------------------- ------ ------ ------ -------- ------ ------ ------------------------------ ------------------------------
<SNIP>  
0xfffffa80022e5950 cmd.exe                2096   2664      1       19      2      0 2019-12-14 10:36:35 UTC+0000  <SNIP>
0xfffffa8002109b30 chrome.exe             2296   2664     27      658      2      0 2019-12-14 10:36:45 UTC+0000                                 
0xfffffa8001cc7a90 chrome.exe             2304   2296      8       71      2      0 2019-12-14 10:36:45 UTC+0000                                 
0xfffffa8000eea7a0 chrome.exe             2476   2296      2       55      2      0 2019-12-14 10:36:46 UTC+0000                                 
0xfffffa8000ea2b30 chrome.exe             2964   2296     13      295      2      0 2019-12-14 10:36:47 UTC+0000                                 
0xfffffa8000fae6a0 chrome.exe             2572   2296      8      177      2      0 2019-12-14 10:36:56 UTC+0000  <SNIP>                                                   
0xfffffa800230eb30 chrome.exe             1632   2296     14      219      2      0 2019-12-14 10:37:12 UTC+0000  
<SNIP>
0xfffffa800224a8c0 KeePass.exe            3008   1064     12      316      1      0 2019-12-14 10:37:56 UTC+0000  <SNIP>                                 
0xfffffa80011956a0 notepad.exe            3260   3180      1       61      1      0 2019-12-14 10:38:20 UTC+0000  
<SNIP>
```

These above are only interesting processes. We can first look at arguments passed in applications such as KeePass through `cmdline`.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 cmdline
<SNIP>
************************************************************************
KeePass.exe pid:   3008
Command line : "C:\Program Files (x86)\KeePass Password Safe 2\KeePass.exe" "C:\Users\SmartNet\Secrets\Hidden.kdbx"
************************************************************************
<SNIP>
```

We can dump the file using `filescan` first to find its location in memory.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 filescan | grep -i Hidden.kdbx
Volatility Foundation Volatility Framework 2.6
0x000000003fb112a0     16      0 R--r-- \Device\HarddiskVolume2\Users\SmartNet\Secrets\Hidden.kdbx
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003fb112a0 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3fb112a0   None   \Device\HarddiskVolume2\Users\SmartNet\Secrets\Hidden.kdbx

❯ ls
file.None.0xfffffa8001593ba0.dat  MemoryDump_Lab2.raw
```

```bash
❯ mv file.None.0xfffffa8001593ba0.dat hidden.kdbx
```

Next we can use `keepass2` to open it but it will ask us for password or master key and we don't have it.

```bash
❯ keepass2 hidden.kdbx
```

We can use environment variables hint to find something interesting now. It will be really long but we can find this interesting `base64` encoded text.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 envars      
<SNIP>
    2012 dwm.exe              0x00000000003c1320 NEW_TMP                        C:\Windows\ZmxhZ3t3M2xjMG0zX1QwXyRUNGczXyFfT2ZfTDRCXzJ9
<SNIP>
```

```bash
❯ echo ZmxhZ3t3M2xjMG0zX1QwXyRUNGczXyFfT2ZfTDRCXzJ9 | base64 -d
flag{w3lc0m3_T0_$T4g3_!_Of_L4B_2}
```

We got our first flag as `flag{w3lc0m3_T0_$T4g3_!_Of_L4B_2}`. But it doesn't have any connection with our password. We can now leave this environment variables now let's focus on password. We can check `clipboard` where usually copied text are stored in RAM.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 clipboard
Volatility Foundation Volatility Framework 2.6
Session    WindowStation Format                         Handle Object             Data                                              
---------- ------------- ------------------ ------------------ ------------------ --------------------------------------------------



         2 WinSta0       CF_UNICODETEXT                    0x0 ------------------                                                   
         2 WinSta0       0x0L                           0xc0cc ------------------                                                   
         2 WinSta0       0x0L                   0x200000000000 ------------------                                                   
         2 WinSta0       CF_LOCALE                     0x10103 0xfffff900c2163140                                                   
         2 WinSta0       0x0L                              0x1 ------------------                                                   
         1 WinSta0       CF_UNICODETEXT                    0x0 ------------------                                                   
         1 WinSta0       0x0L                           0xc086 ------------------                                                   
         1 WinSta0       0x0L                   0x200000000000 ------------------                                                   
         1 WinSta0       CF_LOCALE                     0x10107 0xfffff900c1b9d100                                                   
         1 WinSta0       0x0L               0x6a72080000000001 
```

We got nothing useful, Next we can `filescan` for files starting with password word.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 filescan | grep -i password   
Volatility Foundation Volatility Framework 2.6
0x000000003e868370     16      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.exe.config
0x000000003e873070      8      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.exe
0x000000003e8ef2d0     13      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.exe
0x000000003e8f0360      4      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.XmlSerializers.dll
0x000000003eaf7880     15      1 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.XmlSerializers.dll
0x000000003fb0abc0     10      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePassLibC64.dll
0x000000003fce1c70      1      0 R--r-d \Device\HarddiskVolume2\Users\Alissa Simpson\Pictures\Password.png
0x000000003fd62f20      2      0 R--r-- \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\KeePass.config.xml
0x000000003fecf820     15      0 R--r-d \Device\HarddiskVolume2\Program Files (x86)\KeePass Password Safe 2\unins000.exe
```

Everything seems non useful or from KeePass internal program except for `\Device\HarddiskVolume2\Users\Alissa Simpson\Pictures\Password.png`. Let's dump it and see it's contents.

```bash
 ❯ /usr/bin/volatility -f MemoryDump_Lab2.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003fce1c70 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3fce1c70   None   \Device\HarddiskVolume2\Users\Alissa Simpson\Pictures\Password.png

❯ ls
file.None.0xfffffa8000d06e10.dat  hidden.kdbx  MemoryDump_Lab2.raw

❯ mv file.None.0xfffffa8000d06e10.dat lab_2_1.png 
```

![lab_2_1.png](/img/lab_2_1.png)

There is password written in small which is `P4SSw0rd_123`. Now lets open keepass and enter this password.

```bash
❯ keepass2 hidden.kdbx   
```

![lab_2_2.png](/img/lab_2_2.png)

If we copy this `Flag` password from Recycle Bin, we will get our flag `flag{w0w_th1s_1s_Th3_SeC0nD_ST4g3_!!}`.

Lastly we need to check for that browser hint. We need to find something at `chrome.exe`. We can dump Chrome history using downloaded plugin. We will get bunch of links but we only want that can give us flag.

```bash
 ❯ /usr/bin/volatility --plugins=../volatility-plugins -f MemoryDump_Lab2.raw --profile=Win7SP1x64 chromehistory                      
Volatility Foundation Volatility Framework 2.6
Index  URL                                                                              Title                                                                            Visits Typed Last Visit Time            Hidden Favicon ID
------ -------------------------------------------------------------------------------- -------------------------------------------------------------------------------- ------ ----- -------------------------- ------ ----------
<SNIP>
 
    32 https://mega.nz/#F!TrgSQQTS!H0ZrUzF0B-ZKNM3y9E76lg                               MEGA                                                                                  2     0 2019-12-14 10:21:39.602970        N/A     
<SNIP>
```

We got one interesting link `https://mega.nz/#F!TrgSQQTS!H0ZrUzF0B-ZKNM3y9E76lg`, If we go there and download `Important.zip`.

```bash
❯ unzip Important.zip                    
Archive:  Important.zip
Password is SHA1(stage-3-FLAG) from Lab-1. Password is in lowercase.
   skipping: Important.png           unsupported compression method 99

❯ file Important.zip      
Important.zip: Zip archive data, at least v2.0 to extract, compression method=AES Encrypted
```

Its password protected and we got hint `Password is SHA1(stage-3-FLAG) from Lab-1. Password is in lowercase`. Third flag in Lab-1 was `flag{w3ll_3rd_stage_was_easy}`. Convert it to SHA-1.

```bash
❯ echo -n flag{w3ll_3rd_stage_was_easy} | sha1sum 
6045dd90029719a039fd2d2ebcca718439dd100a  -
```

Our password is `6045dd90029719a039fd2d2ebcca718439dd100a`

Since `unzip` doesn't support AES encryption we can use `7z`.

```bash
❯ 7z x Important.zip  

Enter password (will not be echoed): 6045dd90029719a039fd2d2ebcca718439dd100a
Everything is Ok

Size:       59291
Compressed: 57457

❯ ls
hidden.kdbx    Important.zip  MemoryDump_Lab2.raw
Important.png  
```

We can see we got `Important.png` which has flag.

![lab_2_3.png](/img/lab_2_3.png)


`flag{oK_So_Now_St4g4_3_is_DoNE!!}`
# MemLabs Lab 3 - The Evil's Den

## **Challenge Description**

A malicious script encrypted a very secret piece of information I had on my system. Can you recover the information for me please?

**Note-1**: This challenge is composed of only 1 flag. The flag split into 2 parts.

**Note-2**: You'll need the first half of the flag to get the second.

You will need this additional tool to solve the challenge,

```shell
$ sudo apt install steghide
```

The flag format for this lab is: `inctf{s0me_l33t_Str1ng}`

**Challenge file**: [MemLabs_Lab3](https://mega.nz/#!2ohlTAzL!1T5iGzhUWdn88zS1yrDJA06yUouZxC-VstzXFSRuzVg)
## Solution

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...

          Suggested Profile(s) : Win7SP1x86_23418, Win7SP0x86, Win7SP1x86
                     AS Layer1 : IA32PagedMemoryPae (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_3/MemoryDump_Lab3.raw)
                      PAE type : PAE
                           DTB : 0x185000L
                          KDBG : 0x82742c68L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0x82743d00L
             KUSER_SHARED_DATA : 0xffdf0000L
           Image date and time : 2018-09-30 09:47:54 UTC+0000
     Image local date and time : 2018-09-30 15:17:54 +0530
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 pslist
<SNIP>
 2018-09-30 09:47:36 UTC+0000                                 
0x9c6b0970 notepad.exe            3736   5300      1       60      1      0 2018-09-30 09:47:49 UTC+0000                                 
0x8443d3c0 notepad.exe            3432   5300      1       60      1      0 2018-09-30 09:47:50 UTC+0000        
<SNIP>
```

Only interesting process running is notepad. Maybe notepad was used to write script. We can use `notepad` plugin to view what was written but it only supports really old systems.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 notepad
Volatility Foundation Volatility Framework 2.6
ERROR   : volatility.debug    : This command does not support the profile Win7SP1x86_23418
```

We can use `cmdline` plugins.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 cmdline
<SNIP>
************************************************************************
notepad.exe pid:   3736
Command line : "C:\Windows\system32\NOTEPAD.EXE" C:\Users\hello\Desktop\evilscript.py
************************************************************************
notepad.exe pid:   3432
Command line : "C:\Windows\system32\NOTEPAD.EXE" C:\Users\hello\Desktop\vip.txt
```

The malicious script was `evilscript.py`. Let's download both files and see its code and contents but first we need their locations.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 filescan | grep -i "evilscript.py\|vip.txt"
Volatility Foundation Volatility Framework 2.6

0x000000003de1b5f0      8      0 R--rw- \Device\HarddiskVolume2\Users\hello\Desktop\evilscript.py.py
0x000000003e727490      2      0 RW-rw- \Device\HarddiskVolume2\Users\hello\AppData\Roaming\Microsoft\Windows\Recent\evilscript.py.lnk
0x000000003e727e50      8      0 -W-rw- \Device\HarddiskVolume2\Users\hello\Desktop\vip.txt
```

> `/|` is used match either two or more patterns in grep.

We can use `dumpfiles` plugin to dump multiple files at once.

```bash

❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 dumpfiles -Q 0x000000003de1b5f0,0x000000003e727e50 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3de1b5f0   None   \Device\HarddiskVolume2\Users\hello\Desktop\evilscript.py.py
DataSectionObject 0x3e727e50   None   \Device\HarddiskVolume2\Users\hello\Desktop\vip.txt

❯ ls
file.None.0x83e52420.dat  file.None.0xbc2b6af0.dat  MemoryDump_Lab3.raw
```

We can use `file` command to know which is which and change its name.

```bash
❯ file file.None.0x83e52420.dat 
file.None.0x83e52420.dat: ASCII text, with CRLF line terminators

❯ file file.None.0xbc2b6af0.dat 
file.None.0xbc2b6af0.dat: Python script, ASCII text executable, with CRLF line terminators

❯ mv file.None.0x83e52420.dat vip.txt            

❯ mv file.None.0xbc2b6af0.dat evilscript.py
```

```bash
❯ cat vip.txt                 
am1gd2V4M20wXGs3b2U=

❯ echo am1gd2V4M20wXGs3b2U= | base64 -d
jm`wex3m0\k7oe%
```

Its still gibberish maybe its encrypted, lets look at `evilscript.py`

```python
import sys
import string

def xor(s):

	a = ''.join(chr(ord(i)^3) for i in s)
	return a


def encoder(x):
	
	return x.encode("base64")


if __name__ == "__main__":

	f = open("C:\\Users\\hello\\Desktop\\vip.txt", "w")

	arr = sys.argv[1]

	arr = encoder(xor(arr))

	f.write(arr)

	f.close()
```

Its simple program that open `vip.txt` and XOR's it and then converts that XORed to Base64. We can write code to decrypt it.

```python
import sys
import string
import base64

def xor(s):

	a = ''.join(chr(ord(i)^3) for i in s)
	return a


def decoder(x):
	
	return (base64.b64decode(x)).decode()


if __name__ == "__main__":

	f = open("vip.txt", "r")

	arr = f.read()

	arr = xor(decoder(arr))

	print(arr)

	f.close()
```

```bash
❯ python3 decode.py
inctf{0n3_h4lf
```

We got first half of flag `inctf{0n3_h4lf` and from description that first flag is needed to get second flag. Also it said to use `steghide` which is only supports `.jpg`, `.jpeg`, `.bmp`  So we can search for this type of file from `filescan` plugin and try to find hidden things inside it.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 filescan | grep -i "jpg\|jpeg\|bmp"
```

We will get very long list of files but we need to find one with name that stands out.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 filescan | grep -i "jpg\|jpeg\|bmp"

<SNIP>
0x0000000004f34148      2      0 RW---- \Device\HarddiskVolume2\Users\hello\Desktop\suspision1.jpeg
<SNIP>
```

We find obviously suspicious file with name `suspision1.jpeg`, first dump it like previously.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab3.raw --profile=Win7SP1x86_23418 dumpfiles -Q 0x0000000004f34148 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x04f34148   None   \Device\HarddiskVolume2\Users\hello\Desktop\suspision1.jpeg

❯ ls
decode.py      file.None.0x843fcf38.dat  vip.txt
evilscript.py  MemoryDump_Lab3.raw

❯ mv file.None.0x843fcf38.dat suspision1.jpeg
```

**Steganography** is the practice of hiding secret information within an ordinary file (like an image, audio, or video) so that the presence of the information is concealed. Unlike encryption, it hides the _existence_ of the message rather than just scrambling its contents. We can use `steghide` now to see hidden contents under that image.

```bash
❯ steghide extract -sf suspision1.jpeg 
Enter passphrase: inctf{0n3_h4lf
wrote extracted data to "secret text".
```

We used previous half flag as password and got `secret text` file.

```bash
❯ cat 'secret text' 
_1s_n0t_3n0ugh}
```

We now have full flag as `inctf{0n3_h4lf_1s_n0t_3n0ugh}`
# MemLabs Lab 4 - Obsession
## **Challenge Description**

My system was recently compromised. The Hacker stole a lot of information but he also deleted a very important file of mine. I have no idea on how to recover it. The only evidence we have, at this point of time is this memory dump. Please help me.

**Note**: This challenge is composed of only 1 flag.

The flag format for this lab is: `inctf{s0me_l33t_Str1ng}`

**Challenge file**: [MemLabs_Lab4](https://mega.nz/#!Tx41jC5K!ifdu9DUair0sHncj5QWImJovfxixcAY-gt72mCXmYrE)
## Solution

It seems like in this challenge we need to recover a file. Till now we were finding files from RAM, cache but this time we will recover a file. This challenge is made to teach us how can we recover deleted file using volatility and our flag is also mostly in that recovered file.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...
          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_4/MemoryDump_Lab4.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800027f60a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff800027f7d00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2019-06-29 07:30:00 UTC+0000
     Image local date and time : 2019-06-29 13:00:00 +0530
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw --profile=Win7SP1x64 pslist
<SNIP>
0xfffffa8000f18b30 StikyNot.exe           2432   3012     10      137      2      0 2019-06-29 07:29:37 UTC+0000  
<SNIP>
```

Only interesting find is `StikyNot.exe`. Tried using `cmdline` to find arguments but got nothing. Since StikyNot also helps in copy we can use `clipboard` plugins also but there was also nothing. We can use `screenshot` plugin to see screenshot but it won't be clear it will mostly be blank or show outlines of desktop.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw --profile=Win7SP1x64 screenshot -D .
Volatility Foundation Volatility Framework 2.6
Wrote ./session_0.msswindowstation.mssrestricteddesk.png
Wrote ./session_2.WinSta0.Default.png
Wrote ./session_2.WinSta0.Disconnect.png
Wrote ./session_2.WinSta0.Winlogon.png
Wrote ./session_0.WinSta0.Default.png
Wrote ./session_0.WinSta0.Disconnect.png
Wrote ./session_0.WinSta0.Winlogon.png
Wrote ./session_0.Service-0x0-3e7$.Default.png
Wrote ./session_0.Service-0x0-3e4$.Default.png
Wrote ./session_0.Service-0x0-3e5$.Default.png
Wrote ./session_1.WinSta0.Default.png
Wrote ./session_1.WinSta0.Disconnect.png
Wrote ./session_1.WinSta0.Winlogon.png
```

It dumps but most of it will be blank only some will work. Among here only two files `session_1.WinSta0.Default.png` and `session_2.WinSta0.Default.png` showed anything.

![lab_4_1.png](/img/lab_4_1.png)

![lab_4_2.png](/img/lab_4_2.png)

This doesn't seem to give anything useful except for `eminem` username in `C:/Users` . We can try hit and trial method to enumerate something useful from Users Folder.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw --profile=Win7SP1x64 filescan | grep -i '\\Users\\' | grep -i "jpg\|jpeg\|txt\|png\|py\|exe"
Volatility Foundation Volatility Framework 2.6
0x000000003e88a8c0      1      1 -W-rw- \Device\HarddiskVolume2\Users\eminem\AppData\Local\Temp\FXSAPIDebugLogFile.txt
0x000000003e8ad250     14      0 R--r-- \Device\HarddiskVolume2\Users\eminem\Desktop\galf.jpeg
0x000000003e8d19e0     16      0 R--r-- \Device\HarddiskVolume2\Users\eminem\Desktop\Screenshot1.png
0x000000003e912190      6      0 R--r-d \Device\HarddiskVolume2\Users\eminem\Desktop\DumpIt\DumpIt.exe
0x000000003e9189d0     10      0 R--r-d \Device\HarddiskVolume2\Users\eminem\Desktop\DumpIt\DumpIt.exe
0x000000003ebc0690      8      0 R--r-- \Device\HarddiskVolume2\Users\eminem\AppData\Roaming\Microsoft\Windows\Themes\TranscodedWallpaper.jpg
0x000000003fc398d0     16      0 R--rw- \Device\HarddiskVolume2\Users\SlimShady\Desktop\Important.txt
0x000000003fcb0070      1      1 -W-rw- \Device\HarddiskVolume2\Users\SLIMSH~1\AppData\Local\Temp\FXSAPIDebugLogFile.txt
0x000000003fd1bd50     11      0 R--r-- \Device\HarddiskVolume2\Users\SlimShady\AppData\Roaming\Microsoft\Windows\Themes\TranscodedWallpaper.jpg
```

Some interesting files are `galf.jpeg`, `screenshot1.png`, `important.txt`, Lets dump it.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003e8ad250,0x000000003e8d19e0,0x000000003fc398d0 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3e8ad250   None   \Device\HarddiskVolume2\Users\eminem\Desktop\galf.jpeg
DataSectionObject 0x3e8d19e0   None   \Device\HarddiskVolume2\Users\eminem\Desktop\Screenshot1.png
DataSectionObject 0x3fc398d0   None   \Device\HarddiskVolume2\Users\SlimShady\Desktop\Important.txt
```

```bash
❯ ls
 file.None.0xfffffa80022ad0f0.dat
 file.None.0xfffffa80022d1670.dat
 MemoryDump_Lab4.raw
 session_0.msswindowstation.mssrestricteddesk.png
'session_0.Service-0x0-3e4$.Default.png'
'session_0.Service-0x0-3e5$.Default.png'
'session_0.Service-0x0-3e7$.Default.png'
 session_0.WinSta0.Default.png
 session_0.WinSta0.Disconnect.png
 session_0.WinSta0.Winlogon.png
 session_1.WinSta0.Default.png
 session_1.WinSta0.Disconnect.png
 session_1.WinSta0.Winlogon.png
 session_2.WinSta0.Default.png
 session_2.WinSta0.Disconnect.png
 session_2.WinSta0.Winlogon.png
```

Hm, Weird thing is that when we try to dump only two files got dumped in `.dat` other one file didn't got dumped - this happens when file is deleted and that is the file which we are after and want to recover. First we gotta find out which file is missing:

```bash
❯ file file.None.0xfffffa80022ad0f0.dat
file.None.0xfffffa80022ad0f0.dat: JPEG image data, JFIF standard 1.01, aspect ratio, density 1x1, segment length 16, baseline, precision 8, 1500x844, components 3

❯ file file.None.0xfffffa80022d1670.dat
file.None.0xfffffa80022d1670.dat: PNG image data, 1366 x 334, 8-bit/color RGBA, non-interlaced
```

So both `.jpeg` and `.png` file are here and missing one is `important.txt` which is deleted and we want to recover.

**Cache** is a small, high-speed memory located close to the CPU that stores frequently accessed data and instructions. Its main purpose is to reduce the time it takes for the processor to access data from the main memory (RAM), which is comparatively slower. By keeping copies of the most-used information close to the processor, cache minimizes latency and allows the CPU to perform tasks more efficiently without waiting for slower memory access. 

L1, L2, and L3 cache are levels of memory that speed up processing by storing frequently accessed data closer to the CPU. L1 is the fastest and smallest, directly on the processor core. L2 is larger and slightly slower, also on the core or a separate chip. L3 is the largest and slowest of the three, often shared between cores, and sits on the CPU.

1) **L1 Cache:**
    
     The smallest and fastest cache, often divided into instruction (L1i) and data (L1d) caches for each processor core. It's typically measured in kilobytes (KB). 
    
2) **L2 Cache:**
    
     Larger than L1, it can be on-chip or on a separate chip with a high-speed bus to the CPU. It's also measured in kilobytes (KB) or megabytes (MB). 
    
3) **L3 Cache:**
    
    The largest and slowest of the three, but still faster than RAM. It's often shared between multiple CPU cores and can be measured in megabytes (MB).

How they work together:

When the CPU needs data, it first looks in the L1 cache. If not found, it searches L2, then L3. If still not found, it accesses the main memory (RAM), which is slower. Data found in higher levels of cache is copied to lower levels to speed up future access.

**MFT (Master File Table)** is a critical component of the NTFS (New Technology File System) used by Windows. It acts like a database that stores information about every file and directory on an NTFS volume. 

When a file is deleted in a computer system, it isn't immediately erased from the storage drive. Instead, the operating system simply removes the pointer or reference to that file in the file system's index (like removing a name from a table of contents), and marks the space the file occupied as available for reuse. For example, if `Secret.docx` is deleted from the desktop, it disappears from view, but the actual contents of `Secret.docx` may still exist in the hard drive's data blocks until new data is written over it. This is why forensic analysts can often recover deleted files using specialized tools  they can scan the raw sectors of a drive for file remnants, even if the system considers them "deleted."

In addition, if the file was recently accessed, parts of it may remain in cache memory (RAM or disk cache), where the system temporarily stored it for faster access. These cached fragments, along with potential thumbnail images (like `thumbs.db` in Windows), can provide valuable evidence even if the main file is gone. **Overwriting** is the process of replacing the data of a deleted file with new information stored in the same physical location on the storage device. When you delete a file, the operating system marks its storage space as "free," but doesn’t actually erase the underlying data. As a result, that space remains recoverable until something new is saved to that exact location.

We can now find our `important.txt` from MFT table using plugin `mftparser`. Its output wil be very long so we need to write in file `mftdata` and it will take long time.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab4.raw --profile=Win7SP1x64 mftparser > mftdata 
Volatility Foundation Volatility Framework 2.6
```

```bash
❯ cat mftdata | grep -i important.txt
2019-06-27 13:14:13 UTC+0000 2019-06-27 13:14:13 UTC+0000   2019-06-27 13:14:13 UTC+0000   2019-06-27 13:14:13 UTC+0000   Users\SlimShady\Desktop\Important.txt
```

As we can see it indeed has `Important.txt`.

```bash
❯ cat mftdata | grep -i important.txt -A 30
```

> It will grep `Important.txt` and the matching line along with the next 30 lines after it.

```bash
❯ cat mftdata | grep -i important.txt -A 30
2019-06-27 13:14:13 UTC+0000 2019-06-27 13:14:13 UTC+0000   2019-06-27 13:14:13 UTC+0000   2019-06-27 13:14:13 UTC+0000   Users\SlimShady\Desktop\Important.txt

$OBJECT_ID
Object ID: 7726a550-d498-e911-9cc1-0800275e72bc
Birth Volume ID: 80000000-b800-0000-0000-180000000100
Birth Object ID: 99000000-1800-0000-690d-0a0d0a0d0a6e
Birth Domain ID: 0d0a0d0a-0d0a-6374-0d0a-0d0a0d0a0d0a

$DATA
0000000000: 69 0d 0a 0d 0a 0d 0a 6e 0d 0a 0d 0a 0d 0a 63 74   i......n......ct
0000000010: 0d 0a 0d 0a 0d 0a 0d 0a 66 7b 31 0d 0a 0d 0a 0d   ........f{1.....
0000000020: 0a 5f 69 73 0d 0a 0d 0a 0d 0a 5f 6e 30 74 0d 0a   ._is......_n0t..
0000000030: 0d 0a 0d 0a 0d 0a 5f 45 51 75 34 6c 0d 0a 0d 0a   ......_EQu4l....
0000000040: 0d 0a 0d 0a 5f 37 6f 5f 32 5f 62 55 74 0d 0a 0d   ...._7o_2_bUt...
0000000050: 0a 0d 0a 0d 0a 0d 0a 0d 0a 0d 0a 5f 74 68 31 73   ..........._th1s
0000000060: 5f 64 30 73 33 6e 74 0d 0a 0d 0a 0d 0a 0d 0a 5f   _d0s3nt........_
0000000070: 6d 34 6b 65 0d 0a 0d 0a 0d 0a 5f 73 33 6e 0d 0a   m4ke......_s3n..
0000000080: 0d 0a 0d 0a 0d 0a 73 33 7d 0d 0a 0d 0a 47 6f 6f   ......s3}....Goo
0000000090: 64 20 77 6f 72 6b 20 3a 50                        d.work.:P
```

And we got flag if you combine it `inctf{1_is_n0t_EQu4l_7o_2_bUt_th1s_m4ke_s3ns3}`. This weird format is made by author of challenge so that we cant directly grep from flag format our flag.
# MemLabs Lab 5 - Black Tuesday
## **Challenge Description**

We received this memory dump from our client recently. Someone accessed his system when he was not there and he found some rather strange files being accessed. Find those files and they might be useful. I quote his exact statement,

> The names were not readable. They were composed of alphabets and numbers but I wasn't able to make out what exactly it was.

Also, he noticed his most loved application that he always used crashed every time he ran it. Was it a virus?

**Note-1**: This challenge is composed of 3 flags. If you think 2nd flag is the end, it isn't!! :P

**Note-2**: There was a small mistake when making this challenge. If you find any string which has the string "**_L4B_3_D0n3_!!**" in it, please change it to "**_L4B_5_D0n3_!!**" and then proceed.

**Note-3**: You'll get the stage 2 flag only when you have the stage 1 flag.

**Challenge file**: [MemLabs_Lab5](https://mega.nz/#!Ps5ViIqZ!UQtKmUuKUcqqtt6elP_9OJtnAbpwwMD7lVKN1iWGoec)
## Solution

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...

          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_5/MemoryDump_Lab5.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800028460a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff80002847d00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2019-12-20 03:47:57 UTC+0000
     Image local date and time : 2019-12-20 09:17:57 +0530
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 pslist
Volatility Foundation Volatility Framework 2.6
Offset(V)          Name                    PID   PPID   Thds     Hnds   Sess  Wow64 Start                          Exit                          
------------------ -------------------- ------ ------ ------ -------- ------ ------ ------------------------------ ------------------------------
<SNIP>
0xfffffa8000f97a20 WinRAR.exe             2924   1580      6      210      2      0 2019-12-20 03:47:13 UTC+0000                                 
0xfffffa80010b8060 notepad.exe            2744   1580      1       57      2      0 2019-12-20 03:47:21 UTC+0000                                 
0xfffffa8000eeb060 DumpIt.exe             2208   1580      2       45      2      1 2019-12-20 03:47:39 UTC+0000                                 
0xfffffa8000eab790 conhost.exe            2612   1988      2       51      2      0 2019-12-20 03:47:40 UTC+0000                                 
0xfffffa800108cb30 NOTEPAD.EXE            2724   1580      1       39      2      1 2019-12-20 03:47:53 UTC+0000                                 
0xfffffa800109f060 svchost.exe            2632    484      7       82      0      0 2019-12-20 03:47:54 UTC+0000                                 
0xfffffa8000ee8060 WerFault.exe           2716   2632      8      161      2      1 2019-12-20 03:47:54 UTC+0000                                 
0xfffffa800221ab30 NOTEPAD.EXE            1388   1580      1       39      2      1 2019-12-20 03:48:00 UTC+0000                                 
0xfffffa8000efbb30 WerFault.exe            780   2632      7      160      2      1 2019-12-20 03:48:01 UTC+0000                                 
0xfffffa8000f02b30 NOTEPAD.EXE            2056   1580      1      226 ------      1 2019-12-20 03:48:15 UTC+0000                                 
0xfffffa8000f05b30 WerFault.exe           2168   2632      7  1572864 ------      1 2019-12-20 03:48:15 UTC+0000       
```

We see two notepad running one uppercase and one lowercase. Lets look at arguments for now using `cmdline`.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 cmdline
<SNIP>
WinRAR.exe pid:   2924
Command line : "C:\Program Files\WinRAR\WinRAR.exe" "C:\Users\SmartNet\Documents\SW1wb3J0YW50.rar"
************************************************************************
notepad.exe pid:   2744
Command line : "C:\Windows\system32\notepad.exe" 
************************************************************************
DumpIt.exe pid:   2208
Command line : "C:\Users\SmartNet\Downloads\DumpIt\DumpIt.exe" 
************************************************************************
conhost.exe pid:   2612
Command line : \??\C:\Windows\system32\conhost.exe
************************************************************************
NOTEPAD.EXE pid:   2724
Command line : "C:\Users\SmartNet\Videos\NOTEPAD.EXE" 
************************************************************************
svchost.exe pid:   2632
Command line : C:\Windows\System32\svchost.exe -k WerSvcGroup
************************************************************************
WerFault.exe pid:   2716
Command line : C:\Windows\SysWOW64\WerFault.exe -u -p 2724 -s 156
************************************************************************
NOTEPAD.EXE pid:   1388
************************************************************************
WerFault.exe pid:    780
Command line : C:\Windows\SysWOW64\WerFault.exe -u -p 1388 -s 156
************************************************************************
NOTEPAD.EXE pid:   2056
************************************************************************
WerFault.exe pid:   2168
```

We see one `notepad.exe` at `C:\Windows\system32\notepad.exe` which is original and another `NOTEPAD.exe` at `C:\Users\SmartNet\Videos\NOTEPAD.EXE` which is weird place for Notepad to be so it is prolly a Malware.

```bash
WinRAR.exe pid:   2924
Command line : "C:\Program Files\WinRAR\WinRAR.exe" "C:\Users\SmartNet\Documents\SW1wb3J0YW50.rar"
```

We also got this `SW1wb3J0YW50.rar` file which we will look into later. First let's look at screenshots and clipboard in dump. Clipboard didn't have anything but we got something good at screenshot.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 screenshot -D .
Volatility Foundation Volatility Framework 2.6
Wrote ./session_0.WinSta0.Default.png
Wrote ./session_0.WinSta0.Disconnect.png
Wrote ./session_0.WinSta0.Winlogon.png
Wrote ./session_0.Service-0x0-3e7$.Default.png
Wrote ./session_0.Service-0x0-3e4$.Default.png
Wrote ./session_0.Service-0x0-3e5$.Default.png
Wrote ./session_0.msswindowstation.mssrestricteddesk.png
Wrote ./session_1.WinSta0.Default.png
Wrote ./session_1.WinSta0.Disconnect.png
Wrote ./session_1.WinSta0.Winlogon.png
Wrote ./session_2.WinSta0.Default.png
Wrote ./session_2.WinSta0.Disconnect.png
Wrote ./session_2.WinSta0.Winlogon.png
```

If we look at Image `session_1.WinSta0.Default.png`.

![lab_5_1.png](/img/lab_5_1.png)

We can see `base64` encoded text at uppermost left corner. We can write it manually however i will just copy few strings from it and search with strings.

```bash
❯ strings MemoryDump_Lab5.raw | grep ZmxhZ3sh
ZmxhZ3shIV93M0xMX2QwbjNfU3Q0ZzMtMV8wZl9MNEJfNV9EMG4zXyEhfQ.lnk
ZmxhZ3shIV93M0xMX2QwbjNfU3Q0ZzMtMV8wZl9MNEJfNV9EMG4zXyEhfQ.lnk
ZmxhZ3shIV93M0xMX2QwbjNfU3Q0ZzMtMV8wZl9MNEJfNV9EMG4zXyEhfQ.lnk
ZmxhZ3shIV93M0xMX2QwbjNfU3Q0ZzMtMV8wZl9MNEJfNV9EMG4zXyEhfQ.lnk
^C
```

```bash
❯ echo ZmxhZ3shIV93M0xMX2QwbjNfU3Q0ZzMtMV8wZl9MNEJfNV9EMG4zXyEhfQ | base64 -d                    
flag{!!_w3LL_d0n3_St4g3-1_0f_L4B_5_D0n3_!!}
```

 We got first flag `flag{!!_w3LL_d0n3_St4g3-1_0f_L4B_5_D0n3_!!}`. Now we can dump that `SW1wb3J0YW50.rar` file we found.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 filescan | grep SW1wb3J0YW50.rar
Volatility Foundation Volatility Framework 2.6
0x000000003eed56f0      1      0 R--r-- \Device\HarddiskVolume2\Users\SmartNet\Documents\SW1wb3J0YW50.rar
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003eed56f0 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x3eed56f0   None   \Device\HarddiskVolume2\Users\SmartNet\Documents\SW1wb3J0YW50.rar
```

```bash
❯ mv file.None.0xfffffa80010b44f0.dat file.rar
```

```bash
❯ unrar e file.rar                            

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal


Extracting from file.rar

Enter password (will not be echoed) for Stage2.png: flag{!!_w3LL_d0n3_St4g3-1_0f_L4B_5_D0n3_!!}

Extracting  Stage2.png                                                OK 
All OK
```

We used first flag as password as said in description and got `Stage2.png`.

![lab_5_2.png](/img/lab_5_2.png)

Second flag is `flag{W1th_th1s_$taGe_2_1s_c0mPL3T3_!!}`. It says congratulation you completed but its fake as said in description there is also 3rd flag.

Last suspicious thing we have left is that `NOTEPAD.exe` which we can dump and do easy reverse engineering. We have to choose one `Notepad` on Videos directory.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 filescan | grep -i notepad.exe
Volatility Foundation Volatility Framework 2.6
0x000000003ee9d070     10      0 R--r-- \Device\HarddiskVolume2\Users\SmartNet\Videos\NOTEPAD.EXE
0x000000003faaf440     17      1 R--r-d \Device\HarddiskVolume2\Windows\System32\en-US\notepad.exe.mui
0x000000003fb8b440     17      1 R--r-d \Device\HarddiskVolume2\Windows\System32\en-US\notepad.exe.mui
0x000000003fca5250      9      0 R--r-d \Device\HarddiskVolume2\Users\SmartNet\Videos\NOTEPAD.EXE
0x000000003fda1d00      3      0 R--r-d \Device\HarddiskVolume2\Windows\System32\notepad.exe

❯ /usr/bin/volatility -f MemoryDump_Lab5.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000003ee9d070 -D .
Volatility Foundation Volatility Framework 2.6
ImageSectionObject 0x3ee9d070   None   \Device\HarddiskVolume2\Users\SmartNet\Videos\NOTEPAD.EXE
DataSectionObject 0x3ee9d070   None   \Device\HarddiskVolume2\Users\SmartNet\Videos\NOTEPAD.EXE
SharedCacheMap 0x3ee9d070   None   \Device\HarddiskVolume2\Users\SmartNet\Videos\NOTEPAD.EXE
```

```bash
❯ ls
 file.None.0xfffffa8000f886e0.dat
 file.None.0xfffffa8001086b20.vacb
 file.None.0xfffffa80021a1600.img

❯ file file.None.0xfffffa8000f886e0.dat 
file.None.0xfffffa8000f886e0.dat: PE32 executable (GUI) Intel 80386, for MS Windows, 3 sections
```

We got 3 `.dat`, `.vacb`, `.img` files but we should choose `.dat` like before, rename to `notepad.exe` and analyze it in Cutter, you can choose any other program for it.

![lab_5_3.png](/img/lab_5_3.png)

We can see we have flag character by character that's why it can't be seen with simple strings.

`bi0s{M3m_l4b5_OVeR_!}`
# MemLabs Lab 6 - The Reckoning
## **Challenge Description**

We received this memory dump from the Intelligence Bureau Department. They say this evidence might hold some secrets of the underworld gangster David Benjamin. This memory dump was taken from one of his workers whom the FBI busted earlier this week. Your job is to go through the memory dump and see if you can figure something out. FBI also says that David communicated with his workers via the internet so that might be a good place to start.

**Note**: This challenge is composed of 1 flag split into 2 parts.

The flag format for this lab is: `inctf{s0me_l33t_Str1ng}`s0me_l33t_Str1ng

**Challenge file**: [MemLabs_Lab6](https://mega.nz/#!C0pjUKxI!LnedePAfsJvFgD-Uaa4-f1Tu0kl5bFDzW6Mn2Ng6pnM)
## Solution

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw imageinfo
Volatility Foundation Volatility Framework 2.6
INFO    : volatility.debug    : Determining profile based on KDBG search...
          Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418
                     AS Layer1 : WindowsAMD64PagedMemory (Kernel AS)
                     AS Layer2 : FileAddressSpace (/home/at0m/MemLabs/Lab_6/MemoryDump_Lab6.raw)
                      PAE type : No PAE
                           DTB : 0x187000L
                          KDBG : 0xf800027fa0a0L
          Number of Processors : 1
     Image Type (Service Pack) : 1
                KPCR for CPU 0 : 0xfffff800027fbd00L
             KUSER_SHARED_DATA : 0xfffff78000000000L
           Image date and time : 2019-08-19 14:41:58 UTC+0000
     Image local date and time : 2019-08-19 20:11:58 +0530
```

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 pslist 
Volatility Foundation Volatility Framework 2.6
Offset(V)          Name                    PID   PPID   Thds     Hnds   Sess  Wow64 Start                          Exit                          
------------------ -------------------- ------ ------ ------ -------- ------ ------ ------------------------------ ------------------------------
<SNIP>
0xfffffa8002324b30 cmd.exe                 880   1944      1       21      1      0 2019-08-19 14:40:26 UTC+0000                                 
<SNIP>
0xfffffa800234eb30 chrome.exe             2124   1944     27      662      1      0 2019-08-19 14:40:46 UTC+0000                                 
0xfffffa800234f780 chrome.exe             2132   2124      9       75      1      0 2019-08-19 14:40:46 UTC+0000                                 
0xfffffa800314fab0 chrome.exe             2168   2124      3       55      1      0 2019-08-19 14:40:49 UTC+0000                                 
0xfffffa80032f9a70 chrome.exe             2340   2124     12      282      1      0 2019-08-19 14:40:52 UTC+0000                                 
0xfffffa8003741b30 chrome.exe             2440   2124     13      263      1      0 2019-08-19 14:40:54 UTC+0000                                 
0xfffffa800374bb30 chrome.exe             2452   2124     14      167      1     <SNIP>
0xfffffa80032d4380 chrome.exe             2940   2124      9      172      1      0 2019-08-19 14:41:06 UTC+0000                                 
0xfffffa8003905b30 firefox.exe            2080   3060     59      970      1      1 2019-08-19 14:41:08 UTC+0000                                 
0xfffffa80021fa630 firefox.exe            2860   2080     11      210      1      1 2019-08-19 14:41:09 UTC+0000                                 
0xfffffa80013a4580 firefox.exe            3016   2080     31      413      1      1 2019-08-19 14:41:10 UTC+0000                                 
0xfffffa8001415b30 firefox.exe            2968   2080     22      323      1      1 2019-08-19 14:41:11 UTC+0000                                 
0xfffffa8001454b30 firefox.exe            3316   2080     21      307      1      1 2019-08-19 14:41:13 UTC+0000                                 
0xfffffa80035e71e0 WinRAR.exe             3716   1944      7      201      1   
<SNIP>
```

In above description it said he is communicating via internet so those `chrome.exe`, `firefox.exe` might be interesting. Lets find arguments first using `cmdline`.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 cmdline
<SNIP>
************************************************************************
WinRAR.exe pid:   3716
Command line : "C:\Program Files\WinRAR\WinRAR.exe" "C:\Users\Jaffa\Desktop\pr0t3ct3d\flag.rar"
************************************************************************
<SNIP>
```

This `flag.rar` is most interesting file among here so we can find address and dump it.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 filescan | grep -i flag.rar
Volatility Foundation Volatility Framework 2.6
0x000000005fcfc4b0     16      0 R--rwd \Device\HarddiskVolume2\Users\Jaffa\Desktop\pr0t3ct3d\flag.rar

❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 dumpfiles -Q 0x000000005fcfc4b0 -D .
Volatility Foundation Volatility Framework 2.6
DataSectionObject 0x5fcfc4b0   None   \Device\HarddiskVolume2\Users\Jaffa\Desktop\pr0t3ct3d\flag.rar
```

```bash
❯ mv file.None.0xfffffa800138d750.dat flag.rar   

❯ unrar e flag.rar

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal


Extracting from flag.rar

Enter password (will not be echoed) for flag2.png: 
```

We are in correct path but this is file for `flag2` first we need to find password which will probably we `flag1`.

Since he uses Chrome and Firefox lets view their history.

```bash
❯ volatility --plugins=../volatility-plugins -f MemoryDump_Lab6.raw chromehistory
```

It will be long output so we need to find some links that standout.

```bash
  169 https://pastebin.com/RSGSi1hk                                                    Private Paste ID: RSGSi1hk                                                            1     0 2019-08-18 10:32:18.061245        N/A    
```

We can see this pastebin link which is interesting. If we go to given link we see this:

```
1. https://www.google.com/url?q=https://docs.google.com/document/d/1lptcksPt1l_w7Y29V4o6vkEnHToAPqiCkgNNZfS9rCk/edit?usp%3Dsharing&sa=D&source=hangouts&ust=1566208765722000&usg=AFQjCNHXd6Ck6F22MNQEsxdZo21JayPKug
    

2. But David sent the key in mail.
    

3. The key is... :(
```

Lets go to this Google Docs Link:

```
https://docs.google.com/document/d/1lptcksPt1l_w7Y29V4o6vkEnHToAPqiCkgNNZfS9rCk/edit?usp%3Dsharing&sa=D&source=hangouts&ust=1566208765722000&usg=AFQjCNHXd6Ck6F22MNQEsxdZo21JayPKug
```

If we look first time it will look like lorem ipsum only but if we observe carefully we will find Mega Link:

```
Nam faucibus urna felis, vel dictum libero condimentum nec. Nulla vel elit vitae mauris lobortis lacinia et et diam. Aliquam dui ligula, vulputate eget ultrices et, posuere nec ipsum. Fusce elementum imperdiet enim, nec https://mega.nz/#!SrxQxYTQ molestie ante. In mi metus, sodales eu urna ac, malesuada maximus justo. Fusce auctor malesuada pretium. Proin eget erat lacus. Morbi at orci sed purus consectetur interdum. Nullam lacinia dignissim magna, vitae gravida lorem feugiat et. Etiam tincidunt dui ante, eu semper magna dapibus placerat. Fusce quis porttitor lacus. Nam posuere odio at consectetur congue. Vivamus lobortis ante eget sollicitudin malesuada.
```

If we go to `https://mega.nz/#!SrxQxYTQ`, it asks for decryption key which we don't have. Now we need to find both Mega Decryption key and RAR file password also. 

I checked clipboard it was empty and we can check screenshots.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 screenshot -D . 
Volatility Foundation Volatility Framework 2.6
Wrote ./session_1.Service-0x0-189b1$.sbox_alternate_desktop_0x820.png
Wrote ./session_1.Service-0x0-189b1$.sbox_alternate_desktop_0x84C.png
Wrote ./session_0.Service-0x0-3e7$.Default.png
Wrote ./session_0.Service-0x0-3e4$.Default.png
Wrote ./session_0.Service-0x0-3e5$.Default.png
Wrote ./session_0.msswindowstation.mssrestricteddesk.png
Wrote ./session_0.WinSta0.Default.png
Wrote ./session_0.WinSta0.Disconnect.png
Wrote ./session_0.WinSta0.Winlogon.png
Wrote ./session_1.WinSta0.sbox_alternate_desktop_local_winstation_0x820.png
Wrote ./session_1.WinSta0.Default.png
Wrote ./session_1.WinSta0.Disconnect.png
Wrote ./session_1.WinSta0.Winlogon.png
```

We will find information at `session_1.WinSta0.Default.png`.

![lab_6_1.png](/img/lab_6_1.png)

We can see Mega Drive Key but there is no key, We can use strings to search for it now.

```bash
❯ strings MemoryDump_Lab6.raw| grep -i "Mega Drive Key"
```

When we scroll down using that above command we will see this section which give us key `zyWxCjCYYSEMA-hZe552qWVXiPwa5TecODbjnsscMIU`.

![lab_6_2.png](/img/lab_6_2.png)

Now put this key in Mega site link `https://mega.nz/file/SrxQxYTQ`. We see `flag.png`. If we try to open it:

```bash
❯ eog flag_.png
```

We will see an error `missing IHDR`

![lab_6_3.png](/img/lab_6_3.png)

IHDR Part was corrupted if we view in `hexedit` so all we need to do is to change `i (69)` to `I (49)`. We call these things magic bytes or file signatures also.

```bash
❯ hexedit flag_.png  
```

![lab_6_4.png](/img/lab_6_4.png)

As we can see I changed `69` to `49` and saved it. Now if we view we should be able to see flag.

![lab_6_5.png](/img/lab_6_5.png)

First half of flag is `inctf{thi5_cH4LL3Ng3_!s_g0nn4_b3_?_`. Now we need to find second part.

```bash
❯ unrar e flag.rar      

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal


Extracting from flag.rar

Enter password (will not be echoed) for flag2.png: 
```

I tried first part of flag but it seem to be incorrect, So we need to manually find password. We can check environment variables using `envars` because this is the thing we haven't done till now.

```bash
❯ /usr/bin/volatility -f MemoryDump_Lab6.raw --profile=Win7SP1x64 envars
<SNIP>
2940 chrome.exe           0x0000000000371320 RAR password  easypeasyvirus
<SNIP>
```

We got password `easypeasyvirus`.

```bash
❯ unrar e flag.rar

UNRAR 7.00 freeware      Copyright (c) 1993-2024 Alexander Roshal


Extracting from flag.rar

Enter password (will not be echoed) for flag2.png: easypeasyvirus

Extracting  flag2.png                                               
All OK
```

Now we can view `flag2.png` and get our flag.

![lab_6_6.png](/img/lab_6_6.png)

The second part of flag is `aN_Am4zINg_!_i_gU3Ss???_}`. So whole flag will be `inctf{thi5_cH4LL3Ng3_!s_g0nn4_b3_?_aN_Am4zINg_!_i_gU3Ss???_`

# Pwn3d!!!

![what](/img/what.png)

# _References_

- Thanks to [MemLabs](https://github.com/stuxnet999/MemLabs/tree/master) for these awesome Challenges.
- [**Basics of Memory Forensics**](https://stuxnet999.github.io/volatility/2020/08/18/Basics-of-Memory-Forensics.html)
- [**Volatility Windows Command Reference**](https://github.com/volatilityfoundation/volatility/wiki/Command-Reference)
- [**Sans DFIR Memory Forensics cheat sheet**](https://digital-forensics.sans.org/media/volatility-memory-forensics-cheat-sheet.pdf)
- [**AboutDFIR - Challenges & CTFs**](https://aboutdfir.com/education/challenges-ctfs/)
- [**CTFtime.org**](https://ctftime.org/)
- [ChatGPT](https://chatgpt.com/)

---

