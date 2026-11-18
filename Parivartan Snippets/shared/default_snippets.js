// Default folders and snippets for Parivartan Snippet
const DEFAULT_FOLDERS = [
  { id: "folder_support", name: "Support", icon: "headphones", isDefault: true },
  { id: "folder_network", name: "Network", icon: "activity" },
  { id: "folder_abuse", name: "Abuse", icon: "shield" },
  { id: "folder_general", name: "General", icon: "server" },
  { id: "folder_common", name: "Common", icon: "star" }
];

const DEFAULT_SNIPPETS = [
  // ==========================================
  // 1. Support
  // ==========================================
  {
    id: "snip_ack",
    folderId: "folder_support",
    title: "General Ticket Acknowledgement",
    shortcut: "/ack",
    content: "Dear Client,\nThank you for reaching out to our support team.\nWe acknowledge receipt of your ticket #{ticket_id}. Our team is reviewing your request and working on a resolution.\n\nWe will keep you updated on our progress. If you have any further questions in the meantime, please feel free to reach out.",
    tags: ["support", "ack", "welcome"],
    usageCount: 65,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: "snip_standby",
    folderId: "folder_support",
    title: "Work In Progress / Standby",
    shortcut: "/standby",
    content: "Hello,\nWe are currently checking your request. Please stand by for further updates.",
    tags: ["support", "standby"],
    usageCount: 52,
    createdAt: Date.now() - 86400000 * 9
  },
  {
    id: "snip_pwdpolicy",
    folderId: "folder_support",
    title: "Root Password Policy (Zero-Trust)",
    shortcut: "/pwdpolicy",
    content: "Hello,\nFor security and compliance reasons, our support team is unable to access your server or modify its operating system passwords. These credentials remain exclusively under your control.\n\nResetting credentials on a client's behalf would violate zero-trust security principles and compromise compliance standards such as SOC 2 and ISO 27001. This policy ensures unauthorized parties cannot obtain access through Support.\n\nThank you for your understanding and cooperation.",
    tags: ["support", "password", "security"],
    usageCount: 23,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_pwdreset",
    folderId: "folder_support",
    title: "Portal Password Reset & Whitelist",
    shortcut: "/pwdreset",
    content: "Hello,\nThank you for reaching out to us. To reset your account password, please visit:\nhttps://www.psychz.net/dashboard/client/web/site/request-password-reset\n\nYou will receive a reset code via email. If your IP has been blocked due to multiple failed login attempts, please provide your current IP (from https://whatismyipaddress.com).\n\nTo prevent being locked out in the future, we recommend whitelisting your IP under:\nDashboard > My Account > Security > IP Access Controls\nQuick link: https://www.psychz.net/dashboard/client/web/security/ipaccesscontrol",
    tags: ["support", "password", "whitelist"],
    usageCount: 34,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_singlesession",
    folderId: "folder_support",
    title: "Single Login Session Security Rule",
    shortcut: "/singlesession",
    content: "Hello,\nTo protect your account, our system permits only one active login session per user. If you are encountering issues, please ensure all other browser windows, tabs, and devices are logged out.\n\nYou may request to disable this single-session rule for your account, though please note this reduces security by permitting simultaneous logins.\n\nPlease let us know if you have further questions.",
    tags: ["support", "session", "security"],
    usageCount: 16,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_emailchange",
    folderId: "folder_support",
    title: "Account Email Address Change Procedure",
    shortcut: "/emailchange",
    content: "Hello,\nThank you for contacting us. To change the primary email address on your account, please follow these steps:\n1. Log in to your dashboard using your current email address.\n2. Go to Support and click \"Open New Ticket\" (or visit: https://www.psychz.net/dashboard/client/web/ticket/create).\n3. Once the ticket is generated, send an email from your new email address to sales@psychz.net, including the ticket number in the subject line.\n4. Please acknowledge that this action is irreversible.\n\nPlease let us know if you have any questions.",
    tags: ["support", "email", "account"],
    usageCount: 21,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_newip",
    folderId: "folder_support",
    title: "Additional IP Allocation Pricing & Policy",
    shortcut: "/newip",
    content: "Hi there,\nThank you for contacting us. You can request additional IP allocation once your server is active and running:\n\nIPv4 Allocation:\n• /30 (2 usable IPs) — $8/Month\n• /29 (5 usable IPs) — $16/Month\n• /28 (13 usable IPs) — $32/Month\n• /27 (29 usable IPs) — $64/Month\n• /26 (61 usable IPs) — $128/Month\n• /25 (125 usable IPs) — $256/Month\n• /24 (253 usable IPs) — $512/Month\n\nIPv6 Allocation:\n• /64 — $25 One-Time Setup Fee\n• /48 — $50 One-Time Setup Fee\n\nNotes:\n- IP addresses are assigned on a first-come, first-served basis.\n- Total quantity depends on your service plan.\n- Outbound SMTP (port 25) is blocked by default.",
    tags: ["support", "ip", "pricing"],
    usageCount: 39,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_cancelretain",
    folderId: "folder_support",
    title: "Service Cancellation - Retention & Solutions",
    shortcut: "/cancelretain",
    content: "Hello,\nThank you for reaching out to Psychz Networks regarding your dedicated server cancellation request. We are sorry to hear that you wish to discontinue your service.\n\nCould you kindly share the primary reason for your cancellation? If there are technical, pricing, performance, or support challenges you are facing, we would welcome the opportunity to help with tailored options such as:\n• Hardware upgrades\n• Contract discounts\n• Technical optimizations\n• Enhanced support\n\nYour feedback is very important to us. If there is anything we can do to resolve your concerns and retain your business, please let us know.",
    tags: ["support", "retention", "cancel"],
    usageCount: 27,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_reviewreq",
    folderId: "folder_support",
    title: "Happy Customer - Google Review Request",
    shortcut: "/reviewreq",
    content: "Dear {name},\nAt Psychz Networks, our goal is to consistently deliver the highest level of service to our esteemed clients.\n\nIf you are satisfied with the support you received today, we would be truly grateful if you could take a moment to share your experience by leaving a review:\nhttps://g.page/r/CZZ8yhN2MwVREBM/review\n\nThank you for your time and partnership—it means the world to our team!",
    tags: ["support", "review", "feedback"],
    usageCount: 44,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_inactivity",
    folderId: "folder_support",
    title: "Ticket Inactivity Closure Notification",
    shortcut: "/inactivity",
    content: "Hello,\nWe are writing to inform you that support ticket #{ticket_id} will be closed due to a period of inactivity.\n\nIf you still require assistance, simply reply directly to this email to automatically reopen the ticket. Our team will be more than happy to assist you.\nThank you for your understanding.",
    tags: ["support", "inactivity", "close"],
    usageCount: 36,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_wrongdept",
    folderId: "folder_support",
    title: "Ticket Assigned in Different Department",
    shortcut: "/wrongdept",
    content: "Hello,\nUnfortunately, ticket #{ticket_id} is assigned to a different department without shared access.\nCould you please let us know your concern so we can assist directly or route your request to the appropriate team?",
    tags: ["support", "department", "routing"],
    usageCount: 14,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_ordersales",
    folderId: "folder_support",
    title: "Order Status - Processing with Sales",
    shortcut: "/ordersales",
    content: "Hello,\nYour order is currently with our Sales and Provisioning department.\nOnce the order is processed, you will receive a welcome email with your server login credentials, which can also be viewed directly in your Dashboard.\n\nPlease standby for further updates.",
    tags: ["support", "sales", "order"],
    usageCount: 18,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_cdnguide",
    folderId: "folder_support",
    title: "CDN Service Activation & Setup Guide",
    shortcut: "/cdnguide",
    content: "Hello,\nThank you for your purchase of the CDN service.\nTo get started with configuring your CDN domain, please refer to the step-by-step guide below:\nhttps://www.psychz.net/client/kb/en/create-cdn-domain.html\n\nIf you need any further assistance during setup, feel free to reach out.",
    tags: ["support", "cdn", "guide"],
    usageCount: 15,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_r1soft",
    folderId: "folder_support",
    title: "R1Soft Backup Scope & Credentials Request",
    shortcut: "/r1soft",
    content: "Hello,\nCould you please confirm whether you wish to back up the entire bare-metal server or specific virtual machines hosted on this device?\nIf backing up VPS instances, please let us know how many VPS backups will be configured and how much disk space is required.\n\nAdditionally, please share temporary server login credentials so our team can configure the R1Soft agent.",
    tags: ["support", "r1soft", "backup"],
    usageCount: 11,
    createdAt: Date.now() - 86400000 * 1
  },

  // ==========================================
  // 2. Network
  // ==========================================
  {
    id: "snip_netna",
    folderId: "folder_network",
    title: "Network Team Unavailable - On-Call Escalation",
    shortcut: "/netna",
    content: "Hello,\nThank you for reaching out to us.\nAt the moment, our primary network team is unavailable; however, please be assured that our network department has an on-call engineer available for any urgent or service-impacting issues.\n\nKindly share the details of the problem you are facing, including:\n• A brief description of the issue\n• Affected IPs or services\n• Approximate start time and time zone\n• Any logs, screenshots, or traceroute/MTR outputs, if available\n\nOnce we receive this information, we will immediately escalate the case to our on-call network engineer for further investigation and timely resolution.\nWe appreciate your patience and understanding.",
    tags: ["network", "escalation", "oncall"],
    usageCount: 19,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: "snip_bgploa",
    folderId: "folder_network",
    title: "BGP Announcement & LOA Request",
    shortcut: "/bgploa",
    content: "Dear Customer,\nThank you for contacting Psychz Support.\nTo proceed with the BGP setup and announcement, we kindly request a Letter of Authorization (LOA) including the following details:\n1. Prefixes to be announced\n2. ASN\n3. ROA/RPKI records point to the ASN\n4. Table type (Full table, Default route, etc.)\n\nPlease provide these details at your earliest convenience so we can move forward without delay.",
    tags: ["network", "bgp", "loa"],
    usageCount: 28,
    createdAt: Date.now() - 86400000 * 9
  },
  {
    id: "snip_bgppeer",
    folderId: "folder_network",
    title: "BGP Peering IP Request (Own ASN)",
    shortcut: "/bgppeer",
    content: "Hello,\nDear Customer,\nYou have selected to announce the IP under your ASN, so we would need the peering IP to which we will establish the BGP session.\n\n(Client's own ASN does not require a static route).",
    tags: ["network", "bgp", "peering"],
    usageCount: 14,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_bgproa",
    folderId: "folder_network",
    title: "BGP ROA / RPKI Mismatch with ASN",
    shortcut: "/bgproa",
    content: "Dear Customer,\nAs per our validation process, we found that the ROA/RPKI for the prefixes doesn't match with your ASN. Kindly ask your IP leaser to update the same and get back to us, we will verify and proceed with the setup.",
    tags: ["network", "bgp", "rpki"],
    usageCount: 22,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_bgpconfig",
    folderId: "folder_network",
    title: "BGP Full Setup Configuration Details",
    shortcut: "/bgpconfig",
    content: "Dear Customer,\nFor the BGP setup, we will need the following details to complete:\n• Your loopback address:\n• Your ASN:\n• Prefixes:\n• Table type: Default route or full routing table\n\nAlso, let us know if you want us to manage your prefixes through our RADB account to advertise the routes to our upstream provider.\nAdditionally, we need an LOA to complete the BGP setup for you.",
    tags: ["network", "bgp", "radb"],
    usageCount: 16,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_loaverif",
    folderId: "folder_network",
    title: "BGP LOA Verification Policy Notice",
    shortcut: "/loaverif",
    content: "Dear Customer,\nWe have had cases where fraudulent LOAs were submitted by third parties leading to IP hijacking. To prevent such incidents, we strictly verify all LOAs directly with their respective registered leaser prior to advertisement.",
    tags: ["network", "bgp", "loa"],
    usageCount: 11,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_bgpannounce",
    folderId: "folder_network",
    title: "BGP Upstream Announcement Readiness",
    shortcut: "/bgpannounce",
    content: "Hello,\nThank you for waiting. We believe that upstream providers should be able to announce the prefixes without issues once proper RPKI ROA and RADB route objects are in place.\nFor any commercial or billing questions, please contact our Sales department.\nPlease let us know in case of further questions.",
    tags: ["network", "bgp", "announcement"],
    usageCount: 13,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_trafficok",
    folderId: "folder_network",
    title: "Traffic Flow Normal - Timestamp Request",
    shortcut: "/trafficok",
    content: "Hello,\nWe have checked the past traffic flow on the device.\nWe did not find any unusual traffic flow on the device; the traffic seems to be legitimate.\n\nKindly let us know the exact timestamp to check further.",
    tags: ["network", "traffic"],
    usageCount: 17,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_tracerq",
    folderId: "folder_network",
    title: "Packet Loss First Hop - False Positive",
    shortcut: "/tracerq",
    content: "Hello,\nPer the trace provided, we can see that the packet losses are showing at the first hop; however, these do not get carried to the subsequent hops, indicating an ICMP rate-limit false positive.\n\nWe would require a reverse trace (Source to Server) and the source IP as well to confirm where exactly the issue might lie. Could you please provide us with the above so that we may troubleshoot this incident further?",
    tags: ["network", "packetloss", "traceroute"],
    usageCount: 35,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_mtrloss",
    folderId: "folder_network",
    title: "Packet Loss Outside Network (Hop 7)",
    shortcut: "/mtrloss",
    content: "Hello,\nThank you for sharing the MTR/trace reports; your cooperation is greatly appreciated.\n\nUpon careful examination, it appears that the packet loss is originating outside our network (around hop 7), and we have not observed any issues within our internal network infrastructure.\nFurthermore, analysis indicates that the packet losses are occurring globally on upstream routes.\n\nWe kindly request you to check and confirm if there are any issues at your source end or upstream ISP.",
    tags: ["network", "mtr", "packetloss"],
    usageCount: 26,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_routerissue",
    folderId: "folder_network",
    title: "Upstream Cabinet Router Incident",
    shortcut: "/routerissue",
    content: "Dear Customer,\nSorry for the inconvenience caused to you.\nThe upstream router where your server resides is currently experiencing issues; this is the root cause of the packet losses and performance degradation.\n\nOur network engineers are actively working to resolve the issue at the earliest.",
    tags: ["network", "incident", "router"],
    usageCount: 30,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_iperftest",
    folderId: "folder_network",
    title: "iPerf3 Throughput Speed Test Request",
    shortcut: "/iperftest",
    content: "Hello,\nTo ensure accurate and reliable throughput measurements, we kindly request that you perform speed tests exclusively using the iperf3 utility.\nYou can download the executable here: https://iperf.fr/iperf-download.php\n\nPlease share the raw terminal test results with us so we can investigate your bandwidth further. Thank you for your cooperation.",
    tags: ["network", "speed", "iperf3"],
    usageCount: 21,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_twowaymtr",
    folderId: "folder_network",
    title: "Two-Way MTR & Source IP Request",
    shortcut: "/twowaymtr",
    content: "Hello,\nCould you please share a two-way MTR (both Server-to-Client and Client-to-Server) along with your public source IP so we can investigate the reported routing issue further?",
    tags: ["network", "mtr", "routing"],
    usageCount: 24,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_icmpalert",
    folderId: "folder_network",
    title: "ICMP Monitoring Tool Whitelist Request",
    shortcut: "/icmpalert",
    content: "Attention: Getting Alert for Device {ticket_id}\n\nHello,\nOur monitoring system has detected that device {ticket_id} is not responding to ICMP ping alerts. We have verified billing and server console status to ensure the server is not crashed or suspended.\n\nPlease allow/whitelist our ICMP monitoring tool IP addresses on your server firewall:\n• 108.171.252.122\n• 104.149.85.34\n\nNote: If we do not receive a response within 24–48 hours, the ICMP downtime alert will be removed from this device, leaving only bandwidth spike alerts active.",
    tags: ["network", "icmp", "monitoring"],
    usageCount: 15,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_bwalert",
    folderId: "folder_network",
    title: "High Outbound Bandwidth Traffic Alert",
    shortcut: "/bwalert",
    content: "Attention: High Outbound Traffic Alert on Device {ticket_id}\n\nHello,\nI noticed your server is utilizing quite a bit of outbound bandwidth. If this is unexpected, please investigate promptly.\nIf this is legitimate scheduled traffic, please let us know within the next 12 hours so we can adjust or disable the alert threshold for you.\n\n====================\n(Paste traffic logs here)\n====================",
    tags: ["network", "bandwidth", "alert"],
    usageCount: 18,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_prefixassign",
    folderId: "folder_network",
    title: "New IP Prefix Assigned Network Details",
    shortcut: "/prefixassign",
    content: "Hi,\nWe have assigned the IP prefix to your service. Below are the network details:\n\nPrefix: {prefix}\nNetmask: {netmask}\nGateway: {gateway}\nUsable IPs: {ip_start} - {ip_end}\n\nPlease configure these on your server and let us know if you need any assistance.",
    tags: ["network", "ip", "prefix"],
    usageCount: 27,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_replaceip",
    folderId: "folder_network",
    title: "Replace IP Allocation Details",
    shortcut: "/replaceip",
    content: "Hi,\nI have assigned new IPs to your server. Below are the details. Please configure the new IPs and let us know once done so we can reclaim the old ones:\n\nOld IP: {old_ip}\nNew Prefix: {new_prefix}\nUsable IP: {usable_ip}\nGateway: {gateway}\nNetmask: 255.255.255.252\n\nWe are waiting for your confirmation.",
    tags: ["network", "ip", "reclaim"],
    usageCount: 12,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_ipgeo",
    folderId: "folder_network",
    title: "IP Geolocation Correction Submitted",
    shortcut: "/ipgeo",
    content: "Hello,\nThank you for your patience.\nWe have submitted the Geolocation correction request to the major IP databases. Please allow 8–10 business days for the changes to take effect globally.\n\nPlease let us know if any additional assistance is required.",
    tags: ["network", "geolocation", "ip"],
    usageCount: 10,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_rdnsptr",
    folderId: "folder_network",
    title: "rDNS PTR Record Approval Request",
    shortcut: "/rdnsptr",
    content: "Hello,\nWe need approval on updating the PTR (rDNS) record:\nHostname: {hostname}\nIP Address: {ip}\n\nTicket Reference: #{ticket_id}\nPlease confirm so we can update the PTR configuration.",
    tags: ["network", "rdns", "ptr"],
    usageCount: 16,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_notournet",
    folderId: "folder_network",
    title: "IP Does Not Belong to Psychz",
    shortcut: "/notournet",
    content: "Hello,\nThe specified IP address does not belong to Psychz Networks. Kindly check your client portal to verify the correct IP assigned to your server.",
    tags: ["network", "ip", "validation"],
    usageCount: 8,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_ddosprotect",
    folderId: "folder_network",
    title: "DDoS Protection - Hardening Recommendations",
    shortcut: "/ddosprotect",
    content: "Hello,\nTo fortify your DDoS protection, we recommend taking the following steps:\n1. Strengthen DDoS Protection: Enhance protection by creating ACL rules through your Client Dashboard. Alternatively, consider purchasing additional mitigation capacity from us for added security.\n2. Implement Firewall Rules: Set up firewall rules directly on your server to mitigate unnecessary traffic and bolster security.\n\nShould you have any questions or require assistance, feel free to reach out.",
    tags: ["network", "ddos", "security"],
    usageCount: 31,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: "snip_ddosdivert",
    folderId: "folder_network",
    title: "DDoS Protection Active & Permanent IP Diversion",
    shortcut: "/ddosdivert",
    content: "Hello,\nI am writing to inform you that the DDoS protection feature is active for your server IP prefix. Additionally, I recommend implementing a permanent diversion to redirect IP traffic from the client area as an added measure to mitigate potential attacks:\nhttps://www.psychz.net/client/kb/en/how-to-temporarilypermanently-enable-ddos-ip-diversion-for-a-single-ip-address-.html\n\nShould you require further assistance or clarification, please do not hesitate to reach out.",
    tags: ["network", "ddos", "diversion"],
    usageCount: 27,
    createdAt: Date.now() - 86400000 * 9
  },
  {
    id: "snip_nullattack",
    folderId: "folder_network",
    title: "Wanguard Null Route Alert (DDoS Attack)",
    shortcut: "/nullattack",
    content: "Hello,\nThe IP address was temporarily placed on a null-route due to an active, high-volume DDoS attack exceeding mitigation limits.",
    tags: ["network", "ddos", "nullroute"],
    usageCount: 38,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_ddosack",
    folderId: "folder_network",
    title: "DDoS Attack Report Acknowledged",
    shortcut: "/ddosack",
    content: "Hello,\nThanks for reaching out! We wanted to let you know that your DDoS report has been received and is being actively reviewed by our security staff. We will update you shortly.",
    tags: ["network", "ddos", "ack"],
    usageCount: 25,
    createdAt: Date.now() - 86400000 * 6
  },

  // ==========================================
  // 3. Abuse
  // ==========================================
  {
    id: "snip_abuse24",
    folderId: "folder_abuse",
    title: "Abuse Complaint Notification (24-Hour Notice)",
    shortcut: "/abuse24",
    content: "Dear Customer,\nAs outlined below, we have received an abuse complaint associated with an IP address allocated to you.\nPlease investigate this issue within the next 24 hours and take appropriate action with your user/client:\n\n###########################################################\n(Paste abuse complaint details here)\n###########################################################\n\nPlease reply directly to this ticket once resolved to ensure uninterrupted service.",
    tags: ["abuse", "complaint", "24h"],
    usageCount: 34,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_abuse10",
    folderId: "folder_abuse",
    title: "Abuse Complaint Final Warning (10-Hour Notice)",
    shortcut: "/abuse10",
    content: "Final Warning:\nYou have not taken action on abuse ticket #{ticket_id}. If we do not receive an update or see corrective action taken within the next 10 hours, we will have no option but to null-route the IP address or suspend the server.\n\n###########################################################\n(Paste complaint details here)\n###########################################################\n\nPlease reply to this ticket promptly once resolved.",
    tags: ["abuse", "warning", "final"],
    usageCount: 29,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_abuseresolved",
    folderId: "folder_abuse",
    title: "Abuse Issue Resolved - Confirmation",
    shortcut: "/abuseresolved",
    content: "Hello,\nThank you for taking prompt action to resolve the abuse complaint.\nPlease continue monitoring the server to prevent recurring issues.",
    tags: ["abuse", "resolved", "confirmation"],
    usageCount: 31,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_spamhauscss",
    folderId: "folder_abuse",
    title: "Spamhaus CSS Blocklist & SMTP Block Notice",
    shortcut: "/spamhauscss",
    content: "URGENT: IP Address Listed on Spamhaus CSS Blocklist\n\nDear Customer,\nWe have detected that your IP address is listed on the Spamhaus CSS Blocklist. This indicates suspicious behavior, misconfiguration, or poor sending reputation. As a result, outbound SMTP traffic has been blocked for this device.\n\nTo address this issue and request delisting:\n1. Immediate Investigation: Investigate the root cause of the unauthorized outbound mail.\n2. Resolution: Implement corrective security measures.\n3. Report: Provide a brief summary of preventative actions taken.\n\nWe enforce strict anti-abuse policies to protect network integrity. Please reply once remediated so we can review and restore SMTP access.",
    tags: ["abuse", "spamhaus", "smtp"],
    usageCount: 26,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_spamcop",
    folderId: "folder_abuse",
    title: "SpamCop Blacklist Spam Report",
    shortcut: "/spamcop",
    content: "Dear Client,\nWe have received a spam report from SpamCop regarding your IP address {ip}.\nTo resolve this issue, please review your email server practices, secure vulnerabilities, and stop unauthorized outbound relay.\n\nOnce remediated, reply to this ticket and we will request SpamCop to review and delist your IP.\nWe appreciate your prompt attention.",
    tags: ["abuse", "spamcop", "blacklist"],
    usageCount: 19,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_spamreputation",
    folderId: "folder_abuse",
    title: "Outbound Spam Affecting Network Reputation",
    shortcut: "/spamreputation",
    content: "Hello,\nWe have detected that your server IP is sending outbound spam, which severely impacts our network reputation:\nIP: {ip}\n\nPlease take immediate measures to stop outbound spam originating from the server within the next 4 hours; otherwise, we will have to place an outbound SMTP block on the device.\nPlease reply with details on the corrective measures taken.",
    tags: ["abuse", "spam", "reputation"],
    usageCount: 17,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_smtp25",
    folderId: "folder_abuse",
    title: "Port 25 (SMTP) Enable Questionnaire",
    shortcut: "/smtp25",
    content: "Hello,\nAs part of our network security verification regarding suspicious activity, please provide more details for your request to enable outbound port 25 on your server:\n1. What type of email activity will you be performing (e.g. transactional, newsletters, internal communications)?\n2. Does your email body include an opt-out / unsubscribe link?\n3. What domains will be used for mail delivery?\n\nPlease note that spamming is strictly prohibited and accounts found spamming are subject to immediate suspension.",
    tags: ["abuse", "smtp", "port25"],
    usageCount: 22,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_cfabuse",
    folderId: "folder_abuse",
    title: "Cloudflare Real Origin IP Inquiry",
    shortcut: "/cfabuse",
    content: "Hello,\nThe reported domain is currently behind Cloudflare, which masks the origin IP. We have sent an inquiry to Cloudflare (abusereply@cloudflare.com) to provide the actual origin server IP.\n\nKindly contact Cloudflare abuse as well to expedite this process. Once you obtain the origin IP, please let us know.",
    tags: ["abuse", "cloudflare", "proxy"],
    usageCount: 14,
    createdAt: Date.now() - 86400000 * 1
  },

  // ==========================================
  // 4. General
  // ==========================================
  {
    id: "snip_hwtest",
    folderId: "folder_general",
    title: "Hardware Diagnostic Test & Downtime Request",
    shortcut: "/hwtest",
    content: "Hello,\nWe have verified the logs but have not found conclusive issues.\nWe can perform comprehensive hardware diagnostic testing from our end. Please accept the required downtime and allow us to reboot the server to initiate testing.",
    tags: ["general", "hardware", "diagnostic"],
    usageCount: 18,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_rebootdone",
    folderId: "folder_general",
    title: "Server Reboot Completed & Responding",
    shortcut: "/rebootdone",
    content: "Hello,\nWe have rebooted the server as requested, and the IP address is now responding to ping (ICMP).\n\nPlease let us know if you need any further assistance.",
    tags: ["general", "reboot", "ping"],
    usageCount: 48,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_uefireboot",
    folderId: "folder_general",
    title: "Reboot Permission to Disable UEFI Boot",
    shortcut: "/uefireboot",
    content: "Hello,\nIn order to troubleshoot further, we need to reboot the server to disable the UEFI boot option in the BIOS.\n\nPlease confirm if we may proceed: (YES / NO)\nWe are awaiting your response.",
    tags: ["general", "uefi", "reboot"],
    usageCount: 14,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_roerror",
    folderId: "folder_general",
    title: "Read-Only File System & Emergency Mode",
    shortcut: "/roerror",
    content: "Hello,\nWe have rebooted the server, but it continues entering Emergency Mode with a read-only filesystem. Booting into an alternate kernel did not resolve the issue.\n\nIf you have important data on the server, we can boot via Live CD so you can back up your files, or we can proceed directly with a fresh OS reinstallation.",
    tags: ["general", "emergency", "filesystem"],
    usageCount: 12,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_fsckcheck",
    folderId: "folder_general",
    title: "File System FSCK Checksum Errors",
    shortcut: "/fsckcheck",
    content: "Hello,\nWe checked the server console and found checksum errors requiring an FSCK disk check.\nCould you please confirm if we can reboot the server to test HDD health and run the file system check?\n(Screenshot attached)",
    tags: ["general", "fsck", "hdd"],
    usageCount: 16,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_oomalert",
    folderId: "folder_general",
    title: "Out of Memory (OOM Killer) Alert",
    shortcut: "/oomalert",
    content: "Hello,\nSystem logs show that the Linux OOM (Out Of Memory) killer has been invoked on your server:\n\ndmesg -T | grep -i oom\n\nWe recommend reviewing which applications are consuming high memory or upgrading your server's RAM capacity.",
    tags: ["general", "memory", "oom"],
    usageCount: 20,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_firewallchk",
    folderId: "folder_general",
    title: "Firewall Rules & Server Credentials Request",
    shortcut: "/firewallchk",
    content: "Hello,\nTo assist you further, could you please confirm if any firewall or iptables rules have been configured on your server that might be blocking external connectivity?\nAdditionally, to proceed with detailed investigation from our end, please share temporary server credentials.\n\nThank you for your cooperation.",
    tags: ["general", "firewall", "iptables"],
    usageCount: 22,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_sshputty",
    folderId: "folder_general",
    title: "SSH Access Guide for Windows (PuTTY)",
    shortcut: "/sshputty",
    content: "Hi,\nThank you for waiting. If you are using Windows, please follow the instructions below to connect to your server via SSH:\n\n1. Download and install PuTTY from Google or https://www.putty.org/\n2. Open PuTTY, enter your Server IP in \"Host Name\", and confirm Port is 22.\n3. Click \"Open\", accept the security fingerprint warning, and enter user 'root' and your password.\n\nIf you still face issues, please share a screenshot of the error message so we can assist further.",
    tags: ["general", "ssh", "putty"],
    usageCount: 25,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_ipmiview",
    folderId: "folder_general",
    title: "Supermicro IPMIView Tool Download & Guide",
    shortcut: "/ipmiview",
    content: "Hello,\nPlease ensure you are using Java 7/8. You can also use Supermicro's standalone IPMIView utility:\n• Download: ftp://ftp.supermicro.com/utility/IPMIView/\n• Guide: https://www.supermicro.com/manuals/other/IPMIView20.pdf\n\nPlease let us know if you require further assistance.",
    tags: ["general", "ipmi", "supermicro"],
    usageCount: 13,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_unsuspend",
    folderId: "folder_general",
    title: "Server Unsuspended & Operational",
    shortcut: "/unsuspend",
    content: "Hello,\nWe are pleased to inform you that your server has been successfully enabled and is now operational. It is currently responding to ICMP ping requests:\n\nPING {ip} 56(84) bytes of data.\n64 bytes from {ip}: icmp_seq=1 ttl=59 time=0.36 ms\n\nFor billing verification, this update has also been forwarded to Billing.\nPlease feel free to reach out if you have any questions.",
    tags: ["general", "unsuspend", "billing"],
    usageCount: 22,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_colopolicy",
    folderId: "folder_general",
    title: "Colocation Unmanaged Policy Notice",
    shortcut: "/colopolicy",
    content: "Hi,\nI see this is a colocation server. As colocation services are customer-managed, we do not troubleshoot internal software or OS configurations.\nIf you are interested in managed services, please reach out to our Sales team.",
    tags: ["general", "colocation", "policy"],
    usageCount: 14,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_cabconfirm",
    folderId: "folder_general",
    title: "Server Label & Cabinet Details Clarification",
    shortcut: "/cabconfirm",
    content: "Dear Customer,\nTo prevent any confusion before proceeding with the OS installation, please confirm the following:\n1. Server label on which you would like the OS installed\n2. Server location and cabinet details\n3. Assigned IP address belonging to the specified cabinet\n\nAwaiting your confirmation.",
    tags: ["general", "cabinet", "location"],
    usageCount: 11,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_colodown",
    folderId: "folder_general",
    title: "Colocation Port-Down Monitoring Alert",
    shortcut: "/colodown",
    content: "Dear Client,\nOur monitoring system has detected a port-down alert on your colocation server.\nCould you kindly confirm if you are currently working on the server so we may temporarily silence the alert during maintenance?\n\nThank you for your prompt attention.",
    tags: ["general", "colocation", "monitoring"],
    usageCount: 15,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_vmunsupported",
    folderId: "folder_general",
    title: "Virtualization Hypervisor Support Scope",
    shortcut: "/vmunsupported",
    content: "Hello,\nThank you for waiting. We provide hardware, network connectivity, and initial root access for virtualization platforms (such as VMware ESXi / Proxmox); however, internal virtual machine network bridge setups are managed directly by the client.\n\nSince your server is online and accessible via SSH/Web, please review your internal VM bridge configurations within the hypervisor.",
    tags: ["general", "virtualization", "vm"],
    usageCount: 17,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "snip_esxipass",
    folderId: "folder_general",
    title: "ESXi Root Password Reset Limitation",
    shortcut: "/esxipass",
    content: "Hello,\nReinstalling the ESXi host is the only supported procedure for resetting a forgotten root password on ESXi 7+. The host profile feature does not permit manual root password override.\n\nPlease let us know if you would like us to proceed with re-imaging the host.",
    tags: ["general", "esxi", "password"],
    usageCount: 9,
    createdAt: Date.now() - 86400000 * 1
  },

  // ==========================================
  // 5. Common
  // ==========================================
  {
    id: "snip_osready",
    folderId: "folder_common",
    title: "OS Installation Completed - Credentials",
    shortcut: "/osready",
    content: "Hello,\nThe Server is ready for use. Here are the login details:\n\n====================================\nServer IP: {ip}\nServer Login: root\nServer Password: {password}\n====================================\n\nLet us know if you need any further assistance.",
    tags: ["common", "os", "credentials"],
    usageCount: 42,
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: "snip_osdone",
    folderId: "folder_common",
    title: "OS Install Completed - Portal Retrieval Link",
    shortcut: "/osdone",
    content: "Hello,\nThe OS installation has been completed successfully.\nPlease follow the article below for instructions on retrieving your server login credentials from the client portal:\nhttps://www.psychz.net/client/kb/en/how-to-obtain-login-information-of-your-dedicated-server-in-client-area.html\n\nLet us know if you need any further assistance.",
    tags: ["common", "os", "portal"],
    usageCount: 38,
    createdAt: Date.now() - 86400000 * 9
  },
  {
    id: "snip_oswait",
    folderId: "folder_common",
    title: "OS Install Error - Standby Notice",
    shortcut: "/oswait",
    content: "Hello,\nWe are actively looking into the OS installation error. Please do not initiate another OS install request on this device until the current issue is resolved.",
    tags: ["common", "os", "warning"],
    usageCount: 31,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_dataloss",
    folderId: "folder_common",
    title: "Data Loss Warning & Confirmation (OS Reload)",
    shortcut: "/dataloss",
    content: "Hello,\nBefore we proceed with the OS re-installation, kindly review the note below and provide your explicit confirmation so we can proceed:\n\nNote: Please keep in mind that an OS reload will completely wipe all data currently on this machine's hard drive(s). Psychz Networks is not responsible for data recovery and cannot recover data deleted during an OS reload.\n\nPlease confirm: (YES / NO)\nAwaiting your response.",
    tags: ["common", "os", "dataloss"],
    usageCount: 45,
    createdAt: Date.now() - 86400000 * 8
  },
  {
    id: "snip_oldos",
    folderId: "folder_common",
    title: "Outdated OS Retirement & IPMI ISO Alternative",
    shortcut: "/oldos",
    content: "Hello,\nWe've updated our OS install menu to focus on currently recommended releases with active vendor support for optimal security, hardware compatibility, and reliable automated deployment.\n\nThe following releases were retired from the automated installer based on lifecycle status:\n• Ubuntu 20.04 LTS — Standard support ended May 31, 2025\n• Debian 10 (Buster) — LTS ended June 30, 2024\n• Debian 11 (Bullseye) — Extended LTS through August 31, 2026\n• AlmaLinux 8 / Rocky Linux 8 — Active support ended May 31, 2024\n\nIf you still need one of these versions, you can install it at any time using IPMI virtual media by mounting your preferred ISO:\nhttps://www.psychz.net/client/kb/en/how-to-mount-iso-via-ipmi-management-web-interface.html\n\nThank you,",
    tags: ["common", "os", "lifecycle"],
    usageCount: 29,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_ipmireinstall",
    folderId: "folder_common",
    title: "IPMI Access & ISO Mounting Guide",
    shortcut: "/ipmireinstall",
    content: "Dear Customer,\nYou can use the IPMI console to manage and reinstall your server:\n• Accessing IPMI:\nhttps://www.psychz.net/client/kb/en/how-to-access-your-dedicated-server-ipmi.html\n\n• Mounting an ISO via IPMI:\nhttps://www.psychz.net/client/kb/en/how-to-mount-iso-via-ipmi-management-web-interface.html\n\nLet us know if you have any questions or need assistance.",
    tags: ["common", "ipmi", "iso"],
    usageCount: 33,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: "snip_osfail",
    folderId: "folder_common",
    title: "OSfail Notice",
    shortcut: "/osfail",
    content: "Hello,\n\nWe are looking into the error. Please don't initiate another OS install request on this device until the error is resolved.",
    tags: ["common", "os", "system"],
    usageCount: 24,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "snip_sla",
    folderId: "folder_common",
    title: "SLA Response",
    shortcut: "/sla",
    content: "Hi {name},\n\nOur guaranteed response time under your SLA tier is 1 hour. A senior technician has been assigned and is actively investigating your request.",
    tags: ["common", "sla", "priority"],
    usageCount: 15,
    createdAt: Date.now() - 86400000 * 6
  },
  {
    id: "snip_rdns",
    folderId: "folder_common",
    title: "rDNS Configured",
    shortcut: "/rdns",
    content: "Hello,\n\nThe rDNS (PTR record) for your IP address has been configured successfully. Please allow 1-2 hours for global DNS propagation.",
    tags: ["common", "network", "dns"],
    usageCount: 31,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_unpaid",
    folderId: "folder_common",
    title: "Unpaid Invoice Notice",
    shortcut: "/unpaid",
    content: "Dear Customer,\n\nWe noticed invoice #{ticket_id} remains unpaid. Please settle the pending balance to prevent any service interruption.\n\nPayment link: https://billing.example.com/pay",
    tags: ["common", "billing"],
    usageCount: 45,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "snip_cancel",
    folderId: "folder_common",
    title: "Cancellation Received",
    shortcut: "/cancel",
    content: "Hello {name},\n\nYour cancellation request has been received. Your services will remain active until the end of the current billing cycle.",
    tags: ["common", "cancellation"],
    usageCount: 12,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_roc",
    folderId: "folder_common",
    title: "Reason for Cancellation",
    shortcut: "/roc",
    content: "Hi {name},\n\nWe're sorry to see you go! Could you please share a few details about what prompted your cancellation? Your feedback helps us improve our service.",
    tags: ["common", "feedback"],
    usageCount: 18,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "snip_cf",
    folderId: "folder_common",
    title: "Cloudflare Strict Setting",
    shortcut: "/cf",
    content: "Hello,\n\nPlease verify that your domain's Cloudflare SSL/TLS encryption mode is set to 'Full (strict)' and that your origin server certificate is valid.",
    tags: ["common", "cloudflare"],
    usageCount: 29,
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "snip_recf",
    folderId: "folder_common",
    title: "Cloudflare Reply",
    shortcut: "/recf",
    content: "Hi {name},\n\nWe reviewed your Cloudflare configuration. The origin SSL certificate is now active and routing traffic properly through Cloudflare edge proxy.",
    tags: ["common", "cloudflare", "reply"],
    usageCount: 16,
    createdAt: Date.now() - 86400000 * 2
  }
];

// Default Settings
const DEFAULT_SETTINGS = {
  theme: "day",
  defaultAuthor: "Support Team",
  defaultTemplate: "Hello {name},\n\nThank you for reaching out.\n\nBest regards,\n{my_name}",
  triggerPrefix: "/",
  floatingWidget: true,
  selectionWidget: true,
  quickExpand: true,
  aiEnabled: true,
  dictation: {
    enabled: true,
    language: "en-US",
    autoPunctuation: true
  },
  ai: {
    enabled: true,
    provider: "gemini",
    model: "gemini-2.0-flash",
    apiKey: "",
    customEndpoint: "http://localhost:11434",
    persona: "support"
  }
};

// System-defined AI Variables (Built-in, automatic extraction / generation)
const SYSTEM_AI_VARIABLES = [
  {
    key: "Page_context",
    name: "Page Context",
    description: "Automatically extracts the visible text / ticket context from the active webpage.",
    isSystem: true
  },
  {
    key: "Ticket_ID",
    name: "Ticket ID",
    description: "Extracts the ticket identifier (e.g. #4970144) from the ticket header, URL, or page title.",
    isSystem: true
  },
  {
    key: "Customer_Message",
    name: "Customer Message",
    description: "Extracts the customer's inquiry or most recent ticket message.",
    isSystem: true
  },
  {
    key: "Resolution_Steps",
    name: "Resolution Steps",
    description: "AI-formulated technical resolution steps based on ticket context.",
    isSystem: true
  }
];

// Default Custom Variables (User-configurable with default values)
const DEFAULT_AI_VARIABLES = [
  {
    id: "var_engineer_name",
    name: "Engineer Name",
    key: "Engineer_Name",
    defaultValue: "Support Engineer",
    description: "Name or team identifier for outgoing replies",
    isSystem: false
  },
  {
    id: "var_support_tier",
    name: "Support Tier",
    key: "Support_Tier",
    defaultValue: "Tier 2 Technical Support",
    description: "Support tier level (e.g. Tier 1, Tier 2, Tier 3 Network NOC)",
    isSystem: false
  }
];

// Default AI Prompts for Custom AI Prompt Management
const DEFAULT_AI_PROMPTS = [
  {
    id: "prompt_summarize",
    name: "Summarize Page",
    description: "Summarizes the key findings, issues, and pending actions in concise, structured language.",
    category: "Support",
    template: `Summarize the following page in simple, easy-to-understand language.

Highlight:
1. Main topic or issue.
2. Important information and key findings.
3. Current status or conclusion.
4. Pending actions, if any.

Keep the summary concise, structured, and easy to read.

Page Content:
+++++++++++++++++++
{Page_context}
+++++++++++++++++++`,
    variables: ["Page_context"],
    isDefault: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: "prompt_diagnose",
    name: "Find Solution & Diagnose",
    description: "Analyzes technical issue, diagnoses root cause, and provides step-by-step technical fix commands.",
    category: "Diagnostic",
    template: `You are an expert technical support engineer for Psychz Networks. Analyze this customer ticket and diagnose the problem.

Ticket ID: {Ticket_ID}
Customer Message:
{Customer_Message}

Full Ticket Context:
+++++++++++++++++++
{Page_context}
+++++++++++++++++++

Support Tier: {Support_Tier}
Assigned Engineer: {Engineer_Name}

Please formulate a structured technical analysis:
1. Root Cause Analysis (RCA)
2. Step-by-Step Technical Fix & Diagnostic Commands (Linux/Network/BGP)
3. Verification & Health Check Commands
4. Polite & Reassuring Customer Resolution Reply`,
    variables: ["Ticket_ID", "Customer_Message", "Page_context", "Support_Tier", "Engineer_Name"],
    isDefault: true,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4
  },
  {
    id: "prompt_draft_reply",
    name: "Draft Resolution Reply",
    description: "Drafts a complete, polite, and technically accurate customer support reply with next steps.",
    category: "Support",
    template: `Draft a polite, empathetic, and technically accurate customer support reply.

Customer Message:
{Customer_Message}

Ticket Context:
+++++++++++++++++++
{Page_context}
+++++++++++++++++++

Support Tier: {Support_Tier}
Assigned Engineer: {Engineer_Name}

Instructions:
- Acknowledge the issue with genuine empathy.
- Provide clear answers to all customer questions.
- Outline the resolution steps or diagnostic findings.
- If more details are needed (MTR, reverse traceroute, logs), ask with clear instructions.
- Sign off warmly on behalf of Psychz Support.`,
    variables: ["Customer_Message", "Page_context", "Support_Tier", "Engineer_Name"],
    isDefault: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: "prompt_extract_details",
    name: "Extract Ticket Details",
    description: "Extracts server IP, subnets, OS, symptoms, urgency, and action items into a clean list.",
    category: "Technical",
    template: `Extract all critical technical details from this ticket into a clean, structured list:

Ticket Context:
+++++++++++++++++++
{Page_context}
+++++++++++++++++++

Extract:
- Ticket ID: {Ticket_ID}
- Server IP / Subnet:
- Operating System / Service:
- Error Messages / Symptoms:
- Urgency Level:
- Recommended Action:`,
    variables: ["Page_context", "Ticket_ID"],
    isDefault: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  }
];

// Default AI Personas & Character Profiles
const DEFAULT_AI_PERSONAS = [
  {
    id: "analyst",
    name: "Direct Analyst",
    icon: "⚡",
    role: "Objective Bullet-Point Synthesis",
    description: "Zero fluff, structured bullet points, completely objective, no polite preamble or customer greetings.",
    systemPrompt: `You are an Objective Direct Analyst.
Your core principles are high information density, factual precision, and clear bullet-point structure.
CRITICAL FORMATTING RULES:
1. SUMMARY / ANALYSIS / DATA TASKS:
   - When asked to summarize or analyze: Provide direct, crisp, numbered or bulleted pointers covering Main Issue, Key Findings, Status, and Recommended Next Steps.
   - NEVER format responses as a customer email or message. Never say 'Hello', 'Dear Client', 'Thank you for reaching out', or 'Best regards'.
2. DRAFT REPLY TASKS:
   - Only when explicitly instructed to 'Draft a reply to the customer' should you write an outgoing client message.
3. Eliminate all conversational filler, apologies, and small talk.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "support",
    name: "Support Engineer",
    icon: "🛠️",
    role: "Technical Support & Diagnostics",
    description: "Empathetic, clear, and technically accurate specialist for hosting, network, and server issues.",
    systemPrompt: `You are an expert Technical Support Engineer for cloud hosting and network infrastructure (Psychz Networks).
CRITICAL FORMATTING RULES:
1. SUMMARY / ANALYSIS / EXTRACTION TASKS:
   - When asked to summarize, diagnose, or extract info: Provide direct, structured technical bullet points.
   - Do NOT write as a letter or email to a client unless explicitly instructed to 'Draft a customer reply'.
2. DRAFT REPLY TASKS:
   - When drafting a reply for a client: Be empathetic, polite, reassuring, technically clear, and action-oriented.
3. For network troubleshooting: Recommend MTR (bidirectional), reverse traceroute, ASN, or LOA when applicable.`,
    isCustom: false,
    isDefault: true
  },
  {
    id: "ai_engineer",
    name: "AI Engineer",
    icon: "🤖",
    role: "Machine Learning & Neural Architecture",
    description: "Algorithmic thinking, data pipelines, model architecture, token optimization, and clean code.",
    systemPrompt: `You are a Principal AI Engineer and Machine Learning Architect.
CRITICAL FORMATTING RULES:
1. Analyze problems through computational complexity, token efficiency, algorithmic design, and model architecture.
2. Provide clean, robust code examples, mathematical explanations, and implementation trade-offs when relevant.
3. When summarizing or explaining: Break down technical requirements, data dependencies, and algorithmic bottlenecks into structured pointers. Do not format as a customer email unless requested.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "sysadmin",
    name: "System Administrator",
    icon: "🖥️",
    role: "Linux, Networks & Cloud Infrastructure",
    description: "BGP, ASN, Linux kernel, bash commands, systemd, firewall, and server telemetry.",
    systemPrompt: `You are a Senior Linux System Administrator and Network NOC Engineer.
CRITICAL FORMATTING RULES:
1. Focus on precise infrastructure telemetry: BGP routing, ASN, RPKI/ROA, MTR packet loss, IPMI, systemd, firewall rules, and kernel parameters.
2. Provide exact bash commands and diagnostic checks.
3. When summarizing: List affected IPs/subnets, hop latency, service status, and exact terminal commands needed. Do NOT format as a customer email unless requested.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "doctor",
    name: "Doctor / Medical Specialist",
    icon: "🩺",
    role: "Clinical & Diagnostic Precision",
    description: "Evidence-based medical reasoning, clinical terminology, differential diagnosis, and patient care.",
    systemPrompt: `You are an experienced Clinical Physician and Medical Researcher.
CRITICAL FORMATTING RULES:
1. Analyze health data, medical literature, and symptoms with scientific rigor, clinical reasoning, and evidence-based medicine.
2. Structure explanations with Differential Diagnosis, Clinical Findings, Mechanism of Action, and Recommended Follow-up.
3. When summarizing: Present clinical observations and key findings in concise, objective medical bullet points.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "marketing",
    name: "Marketing Specialist",
    icon: "📈",
    role: "Growth, Branding & Conversion",
    description: "Compelling value propositions, user psychology, conversion hooks, and brand positioning.",
    systemPrompt: `You are a Chief Marketing Strategist and Growth Copywriter.
CRITICAL FORMATTING RULES:
1. Focus on user psychology, brand positioning, compelling value propositions, and conversion hooks.
2. Write crisp, engaging content that highlights benefits over features.
3. When summarizing: Extract audience pain points, unique selling points (USPs), brand voice opportunities, and key performance indicators (KPIs) into bullet points.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "sales",
    name: "Sales Manager",
    icon: "💼",
    role: "B2B Pitching & Revenue Acceleration",
    description: "Persuasive pitching, objection handling, commercial value, ROI justification, and deal closing.",
    systemPrompt: `You are an Enterprise B2B Sales Director.
CRITICAL FORMATTING RULES:
1. Focus on commercial impact, ROI justification, client pain-point resolution, and sales velocity.
2. Provide effective objection-handling frameworks and persuasive communication strategies.
3. When summarizing: Highlight client budget, urgency, commercial leverage, decision-makers, and closing next steps in structured pointers.`,
    isCustom: false,
    isDefault: false
  },
  {
    id: "ceo",
    name: "CEO / Executive",
    icon: "👔",
    role: "Strategic Leadership & High-Level Decisions",
    description: "Macro-perspective, decisive leadership, risk management, and ROI focus.",
    systemPrompt: `You are a visionary Chief Executive Officer (CEO).
CRITICAL FORMATTING RULES:
1. Cut through operational weeds and analyze problems from a high-level strategic, financial, and risk-adjusted perspective.
2. Prioritize ROI, competitive advantage, resource allocation, and organizational velocity.
3. Deliver decisive executive directives and concise strategic summaries in prioritized bullet points. Do not format as a customer service reply unless explicitly asked.`,
    isCustom: false,
    isDefault: false
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_FOLDERS,
    DEFAULT_SNIPPETS,
    DEFAULT_SETTINGS,
    DEFAULT_AI_PROMPTS,
    DEFAULT_AI_VARIABLES,
    SYSTEM_AI_VARIABLES,
    DEFAULT_AI_PERSONAS
  };
}
