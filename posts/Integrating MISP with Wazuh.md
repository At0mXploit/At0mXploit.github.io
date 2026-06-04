---
tags:
  - SIEM
  - Wazuh
  - MISP
---
# Introduction

![](/img/cover_ti.png)

In previous blogs we spent time in Malware Development, while more and interesting stuffs for those are coming soon. Now I'm setting up SIEM to catch that stuffs. SOC analyst needs to see thousand of alerts daily, most are noise. A file gets created but is it a malware? Without threat intelligence, we won't know which can lead to log fatigue. This is how I planned on integrating MISP (threat data) with Wazuh (security monitoring) to automatically detect known malware and enrich alerts with context. Takes a little time to set up, but worth it.
# MISP

MISP (Malware Information Sharing Platform) is a threat intelligence database. It contains 100,000+ known malicious indicators, filenames, hashes, domains, IPs shared by security researchers and organizations worldwide. When Wazuh detects a file, it asks MISP: "Do you know about this?" If yes, you get context: what malware it is, when it was discovered, which APT group uses it, threat level, everything. [misp-docker](https://github.com/misp/misp-docker) It's open-source, free, and runs in Docker. Perfect for this. Instead of edge MISP our is internal MISP.

<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
  <!-- Transparent background -->
  <rect width="1000" height="600" fill="transparent"/>
  
  <!-- Title -->
  <text x="500" y="30" font-size="24" font-weight="bold" text-anchor="middle" fill="#333">
    Wazuh + MISP Integration
  </text>
  
  <!-- Windows Endpoints Section -->
  <g id="windows-section">
    <rect x="50" y="80" width="160" height="100" fill="#0078d4" stroke="#333" stroke-width="2" rx="5"/>
    <text x="130" y="110" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Windows</text>
    <text x="130" y="130" font-size="12" text-anchor="middle" fill="white">File Events</text>
    <text x="130" y="150" font-size="11" text-anchor="middle" fill="white">Sysmon</text>
  </g>
  
  <!-- Arrow 1 -->
  <path d="M 210 130 L 280 130" stroke="#333" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
  
  <!-- Wazuh Manager Section -->
  <g id="wazuh-section">
    <rect x="280" y="80" width="160" height="100" fill="#005a9c" stroke="#333" stroke-width="2" rx="5"/>
    <text x="360" y="110" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Wazuh Manager</text>
    <text x="360" y="130" font-size="12" text-anchor="middle" fill="white">Collects</text>
    <text x="360" y="150" font-size="11" text-anchor="middle" fill="white">Analyzes</text>
  </g>
  
  <!-- Arrow 2 -->
  <path d="M 440 130 L 510 130" stroke="#333" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
  
  <!-- Python Script Section -->
  <g id="script-section">
    <rect x="510" y="80" width="160" height="100" fill="#f57c00" stroke="#333" stroke-width="2" rx="5"/>
    <text x="590" y="110" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Python Script</text>
    <text x="590" y="130" font-size="11" text-anchor="middle" fill="white">Queries MISP</text>
    <text x="590" y="150" font-size="11" text-anchor="middle" fill="white">Enriches Alert</text>
  </g>
  
  <!-- Arrow 3 -->
  <path d="M 670 130 L 740 130" stroke="#333" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
  
  <!-- MISP Section -->
  <g id="misp-section">
    <rect x="740" y="80" width="160" height="100" fill="#d32f2f" stroke="#333" stroke-width="2" rx="5"/>
    <text x="820" y="110" font-size="13" font-weight="bold" text-anchor="middle" fill="white">MISP</text>
    <text x="820" y="130" font-size="12" text-anchor="middle" fill="white">Threat Intel</text>
    <text x="820" y="150" font-size="11" text-anchor="middle" fill="white">Database</text>
  </g>
  
  <!-- Arrow back from MISP -->
  <path d="M 740 160 L 670 160" stroke="#666" stroke-width="2" fill="none" marker-end="url(#arrowhead2)" stroke-dasharray="5,5"/>
  
  <!-- Arrow down to enriched alert -->
  <path d="M 360 180 L 360 250" stroke="#333" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
  
  <!-- Enriched Alert Section -->
  <g id="alert-section">
    <rect x="240" y="250" width="240" height="100" fill="#388e3c" stroke="#333" stroke-width="2" rx="5"/>
    <text x="360" y="280" font-size="13" font-weight="bold" text-anchor="middle" fill="white">Enriched Alert</text>
    <text x="360" y="305" font-size="11" text-anchor="middle" fill="white">File + Threat Context</text>
    <text x="360" y="325" font-size="11" text-anchor="middle" fill="white">Dashboard Ready</text>
  </g>
  
  <!-- Details Box -->
  <g id="details">
    <rect x="550" y="250" width="350" height="200" fill="#fff" stroke="#999" stroke-width="1" rx="3"/>
    
    <text x="730" y="275" font-size="12" font-weight="bold" text-anchor="middle" fill="#333">How It Works</text>
    
    <text x="570" y="305" font-size="11" fill="#555" font-weight="bold">MISP Database:</text>
    <text x="570" y="325" font-size="11" fill="#555">100,000+ malware indicators</text>
    <text x="570" y="345" font-size="11" fill="#555">Filenames, hashes, domains, IPs</text>
    <text x="570" y="365" font-size="11" fill="#555">Auto-updated threat feeds</text>
    
    <text x="570" y="395" font-size="11" fill="#555" font-weight="bold">Python Script:</text>
    <text x="570" y="415" font-size="11" fill="#555">1. Extract file from alert</text>
    <text x="570" y="435" font-size="11" fill="#555">2. Query MISP API</text>
  </g>
  
  <g id="details2">
    <rect x="550" y="445" width="350" height="105" fill="#fff" stroke="#999" stroke-width="1" rx="3"/>
    
    <text x="570" y="465" font-size="11" fill="#555" font-weight="bold">Python Script (continued):</text>
    <text x="570" y="485" font-size="11" fill="#555">3. If match found, extract threat info</text>
    <text x="570" y="505" font-size="11" fill="#555">4. Add context to alert</text>
    <text x="570" y="525" font-size="11" fill="#555">5. Send enriched alert back to Wazuh</text>
  </g>
  
  <!-- Arrow marker definitions -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#333"/>
    </marker>
    <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666"/>
    </marker>
  </defs>
</svg>
# Setup and Configuration

Note that for this setup make sure you have already configured Wazuh with one windows agent that takes logs via Sysmon.

Clone the official MISP Docker repo:

```bash
cd /opt
sudo git clone https://github.com/MISP/misp-docker.git
cd misp-docker
```

Copy the environment template:

```bash
cp template.env .env
```

You can edit `.env` if you want, but defaults work fine. Key values (already set in template). Since my Wazuh instance was running so I changed my `docker-compose.yml` file config to:

```
misp-core:
  ports:
    - "${CORE_HTTP_PORT:-9001}:80"      # External:Internal
    - "${CORE_HTTPS_PORT:-9444}:443"    # External:Internal
```

- `9001:80` = Port 9001 on host = Port 80 inside container
- `9444:443` = Port 9444 on host = Port 443 inside container

Build and start containers:

```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

Wait few minutes depending on internet connection to initialize and check if everything is running:

```bash
sudo docker compose ps
```

You should see:

```
CONTAINER ID   IMAGE                    STATUS
abc123...      misp-core:latest         Up 2 minutes
def456...      misp-modules:latest      Up 2 minutes
ghi789...      valkey:7.2               Up 2 minutes
jkl012...      mariadb:10.11            Up 2 minutes
```

Access MISP at: `https://localhost:9444`

Login with:

```
Email: admin@admin.test
Password: admin
```
## Enable Threat Feeds

MISP is useless without data. Threat feeds populate the database with 100,000+ known malicious indicators. Go to **Sync Actions > Feeds** and Enable these feeds by clicking the checkbox next to each:

![](/img/misp_feed.png)

![](/img/misp_feed_shit.png)

After enabling, click **"Fetch and store all feed data"** button. Wait 5-10 minutes for import to complete. 
## Generate API Key

MISP needs to authenticate requests from Wazuh. We do this with an API key. Click on **"Authentication"** section Click **"Add Authentication Key"** Copy the key immediately (shown only once):

![](/img/misp_auth_keys.png)

Save that API Key. We'll need it in the Python script. But first test it:

![](/img/2026-06-04_17-28.png)

We can see the above that it is indeed working and fetching our queries. Now we can setup Integration Script.
## Wazuh Integration Script

The Python script is the bridge between Wazuh and MISP. When Wazuh detects a file, the script queries MISP and enriches the alert.

Access Wazuh container: (see your Wazuh docker container name, it can be different)

```bash
docker exec -it single-node_wazuh.manager_1 bash
```

Create the script at  `/var/ossec/integrations/custom-misp.py`:

```python
#!/var/ossec/framework/python/bin/python3
"""
MISP API Integration for Wazuh
Automatic threat intelligence enrichment
"""

import sys, os, json, re, urllib3
from socket import socket, AF_UNIX, SOCK_DGRAM
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

pwd = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
socket_addr = '{0}/queue/sockets/queue'.format(pwd)

def send_event(msg, agent=None):
    # Send enriched event back to Wazuh queue
    try:
        if not agent or agent["id"] == "000":
            string = '1:misp:{0}'.format(json.dumps(msg))
        else:
            # Format: [agent_id] (agent_name) ip->misp:json_data
            string = '1:[{0}] ({1}) {2}->misp:{3}'.format(
                agent["id"], agent["name"], 
                agent["ip"] if "ip" in agent else "any", 
                json.dumps(msg))
        sock = socket(AF_UNIX, SOCK_DGRAM)
        sock.connect(socket_addr)
        sock.send(string.encode())
        sock.close()
        print(f"DEBUG: Sent event", file=sys.stderr)
    except Exception as e:
        print(f"DEBUG: Send error: {e}", file=sys.stderr)

# Load alert from file passed by Wazuh
try:
    alert = json.loads(open(sys.argv[1]).read())
    print(f"DEBUG: Alert loaded", file=sys.stderr)
except Exception as e:
    print(f"DEBUG: Load error: {e}", file=sys.stderr)
    sys.exit(1)

alert_output = {}
misp_base_url = "https://localhost:9444/attributes/restSearch/"
misp_api_auth_key = "LYZ8gUerwqzkPquRBMVEK43JfXxsSf4ooZxIKDxr"
misp_apicall_headers = {
    "Content-Type": "application/json", 
    "Authorization": misp_api_auth_key, 
    "Accept": "application/json"
}

# Extract event source and type from alert
try:
    event_source = alert["rule"]["groups"][0]
    event_type = alert["rule"]["groups"][1] if len(alert["rule"]["groups"]) > 1 else ""
    print(f"DEBUG: Source={event_source}, Type={event_type}", file=sys.stderr)
except Exception as e:
    print(f"DEBUG: Groups error: {e}", file=sys.stderr)
    sys.exit(1)

# Regex to find 64 character hashes (SHA256)
regex_file_hash = re.compile(r'\w{64}')
wazuh_event_param = None

# Only process Sysmon file creation events (Event ID 11)
if event_source == 'sysmon' and event_type == 'sysmon_eid11_detections':
    try:
        win_data = alert["data"]["win"]["eventdata"]
        # Try to extract hash first, fallback to filename
        if "hashes" in win_data:
            wazuh_event_param = regex_file_hash.search(win_data["hashes"]).group(0)
        elif "targetFilename" in win_data:
            full_path = win_data["targetFilename"]
            # Extract just the filename from full path
            wazuh_event_param = full_path.split('\\')[-1]
        print(f"DEBUG: Extracted param={wazuh_event_param}", file=sys.stderr)
    except Exception as e:
        print(f"DEBUG: Extract error: {e}", file=sys.stderr)
        sys.exit(1)

# Query MISP API with extracted parameter
if wazuh_event_param:
    misp_search_url = '{0}value:{1}'.format(misp_base_url, wazuh_event_param)
    try:
        misp_api_response = requests.get(
            misp_search_url, headers=misp_apicall_headers, 
            verify=False, allow_redirects=True, timeout=10)
        print(f"DEBUG: MISP response={misp_api_response.status_code}", file=sys.stderr)

        # Handle successful response
        if misp_api_response.status_code == 200:
            data = misp_api_response.json()
            if "response" in data and "Attribute" in data["response"]:
                attributes = data["response"]["Attribute"]
                # If match found in MISP, extract threat info
                if attributes:
                    print(f"DEBUG: Found MISP match!", file=sys.stderr)
                    alert_output["misp"] = {}
                    alert_output["integration"] = "misp"
                    
                    # Handle both list and single attribute responses
                    if isinstance(attributes, list) and len(attributes) > 0:
                        attr = attributes[0]
                    else:
                        attr = attributes
                    
                    # Extract attribute level info
                    alert_output["misp"]["event_id"] = attr.get("event_id")
                    alert_output["misp"]["category"] = attr.get("category")
                    alert_output["misp"]["value"] = attr.get("value")
                    alert_output["misp"]["type"] = attr.get("type")
                    alert_output["misp"]["timestamp"] = attr.get("timestamp")
                    alert_output["misp"]["uuid"] = attr.get("uuid")
                    
                    # Extract event level info (threat level, date, org)
                    if "Event" in attr:
                        event = attr["Event"]
                        alert_output["misp"]["event_info"] = event.get("info")
                        alert_output["misp"]["threat_level"] = event.get("threat_level_id")
                        alert_output["misp"]["event_date"] = event.get("date")
                        alert_output["misp"]["org"] = event.get("Org", {}).get("name")
                    
                    alert_output["misp"]["source"] = {"description": alert["rule"].get("description")}
                    send_event(alert_output, alert["agent"])
                else:
                    print(f"DEBUG: No MISP match found", file=sys.stderr)
            else:
                print(f"DEBUG: No Attribute in response", file=sys.stderr)
        # Handle authentication errors
        elif misp_api_response.status_code == 403:
            print(f"DEBUG: MISP auth error 403", file=sys.stderr)
            alert_output["misp"] = {}
            alert_output["integration"] = "misp"
            alert_output["misp"]["error"] = 'MISP API Authentication Error'
            send_event(alert_output, alert["agent"])
        else:
            print(f"DEBUG: MISP error {misp_api_response.status_code}", file=sys.stderr)
    except Exception as e:
        print(f"DEBUG: Query error: {e}", file=sys.stderr)
```

The script extracts filename or hash from Wazuh Sysmon events, queries MISP API for matches, and sends enriched alerts back to Wazuh with threat context (malware category, threat level, organization, event info). In line:

```python
if event_source == 'sysmon' and event_type == 'sysmon_eid11_detections':
```

This only processes Sysmon Event ID 11 (file creation) events.

The script only checks file creation by default. You can add more event types:

- **Network Connections** Check if a process connects to a known C2 (command and control) server. Query MISP for the destination IP or domain. Alert if it matches malicious infrastructure. 

- **Registry Changes** Check if processes modify persistence locations (Run keys, startup folders). Query MISP for known malware registry patterns. Alert on suspicious modifications.

- **Process Execution** Check if a process name or hash matches known malware. Query MISP for the executable hash or name. Alert on known malicious tools like mimikatz, psexec, etc. To add these, modify the if statement in the script:

```python
if event_source == 'sysmon' and event_type in ['sysmon_eid11_detections', 'sysmon_eid3_detections', 'sysmon_eid12_detections']: 
# sysmon_eid11 = File creation 
# sysmon_eid3 = Network connection 
# sysmon_eid12 = Registry changes
```

For this blog, we focus on file creation only. Simpler, works well. Add the others later if you need them. Make the script executable and verify that permissions are same as with others scripts in that path.

```bash
chmod +x /var/ossec/integrations/custom-misp.py
```

```bash
-rwxr-xr-x 1 root root 4523 Jun  4 12:34 custom-misp.py
```
## Add Integration to Wazuh Config

Go to the main config at `/var/ossec/etc/ossec.conf` and find the end of the file (before `</ossec_config>`) and add:

```python
<integration>
    <name>custom-misp.py</name>
    <hook_url>https://localhost:9444</hook_url>
    <group>sysmon_eid11_detections</group>
    <alert_format>json</alert_format>
</integration>
```

![](/img/2026-06-04_17-29.png)

Save and exit.
## Add Detection Rules

Add this rule custom from wazuh dashboard:

```xml
<group name="misp">
  <!-- Base rule for all MISP integration events -->
  <rule id="100620" level="0">
    <field name="integration">misp</field>
    <description>MISP Events - base rule</description>
    <options>no_full_log</options>
  </rule>
  
  <!-- Alert when MISP API connection fails -->
  <rule id="100621" level="5">
    <if_sid>100620</if_sid>
    <field name="misp.error">\.+</field>
    <description>MISP - Error connecting to API</description>
    <options>no_full_log</options>
  </rule>
  
  <!-- HIGH PRIORITY: Hash match detected in MISP -->
  <rule id="100623" level="13">
    <if_sid>100620</if_sid>
    <field name="misp.type">hash</field>
    <description>MISP CRITICAL HASH DETECTED! Hash: $(misp.value) | Category: $(misp.category) | Event: $(misp.event_info)</description>
    <options>no_full_log</options>
  </rule>
  
  <!-- Malware indicator found - Filename match -->
  <rule id="100622" level="12">
    <if_sid>100620</if_sid>
    <field name="misp.category">\.+</field>
    <field name="misp.type">filename</field>
    <description>MISP - IoC FOUND! Filename: $(misp.value) | Category: $(misp.category) | Event: $(misp.event_info)</description>
    <options>no_full_log</options>
  </rule>
  
  <!-- Generic malware indicator - Any type -->
  <rule id="100624" level="11">
    <if_sid>100620</if_sid>
    <field name="misp.category">\.+</field>
    <description>MISP - Threat Indicator Found | Type: $(misp.type) | Value: $(misp.value) | Category: $(misp.category)</description>
    <options>no_full_log</options>
  </rule>
</group>
```

![](/img/2026-06-04_17-34.png)

Then restart the Wazuh services:

```bash
/var/ossec/bin/wazuh-control restart
```
## Verifying

Now create Test files on Windows Agent or like pull from online:

```powershell
iwr -Uri "https://raw.githubusercontent.com/ParrotSec/mimikatz/master/x64/mimikatz.exe" -OutFile "C:\Windows\Temp\mimikatz.exe"
```

![](/img/misp-wazuh-1.png)

Wait for few seconds for logs to get to Wazuh manager.

Verify that Integration loaded and MISP query matched.

```bash
tail -100 /var/ossec/logs/ossec.log | grep -i "misp\|integration"
```

![](/img/2026-06-04_17-30.png)

Now check the Wazuh dashboard in **Thread Hunting** > **Events**.

![](/img/misp-wazuh-2.png)

![](/img/2026-06-04_17-32.png)

Now with this we have a working simple threat intelligence system. Next steps can be to tune it, scale it, extend it, automate it and create alerts or monitors.

That's it for the blog. Tried to keep it sweet and short.

Good hunting.

---