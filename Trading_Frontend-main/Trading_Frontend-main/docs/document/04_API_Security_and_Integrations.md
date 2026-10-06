# API Integrations, Security & Forensic Audit

This document details the external connectivity and multi-layered security protocols that protect the platform's integrity.

---

## 1. External API Integrations

### 1.1 Market Data & Execution
- **Feeds:** Integrated with enterprise data providers (e.g., TrueData, GlobalData) via WebSocket and REST.
- **Symbol Mapping:** Resolves raw symbols (e.g., `GOLD25MAR`) into internal engine units for M2M calculation.

### 1.2 Communication & Messaging
- **WhatsApp/SMS:** Integration with Twilio or Msg91 for sensitive alerts (Login, OTP, Margin Calls).
- **Email (SMTP):** For sending daily ledger statements and password reset links.

### 1.3 Media & AI Verification
- **Speech-to-Text:** The `Voice Modulation` module uses AI engines (Google STT/Whisper) to convert audio commands into actionable dashboard tasks.
- **Storage:** Screenshot proofs are stored in encrypted buckets with hashed retrieval keys.

---

## 2. Multi-Layer Security Protocols

### 2.1 Authentication & Sessions
- **RBAC Enforcement:** The system uses a strict menu-access array (`ROLE_MENU_ACCESS`) in the React Context (`AuthContext.jsx`).
- **Device Fingerprinting:** Captures Browser User-Agent, Screen Resolution, and OS details to prevent session hijacking.

### 2.2 Transactional Security (Double Auth)
Most administrative actions require a secondary layer of authentication:
1. **Login Password:** Initial entry.
2. **Transaction Password:** A dedicated 8-character password required for:
    - Approving Withdrawals.
    - Manually adding/editing trades.
    - Adjusting client funding.
3. **Session OTP:** A 4-digit code required when "Raising a Ticket" for technical support or profile changes.

---

## 3. Forensic Surveillance Hub

### 3.1 IP Analytics & Proxy Detection
- **Real-Time Tracking:** Every login is checked against IP-to-ISP databases.
- **VPN/Datacenter Flags:** Logins from known data-center IPs (DigitalOcean, AWS) are flagged with red "VPN" badges in the `IpLoginsPage`.
- **ISP Integrity:** Monitors for suspicious shifts in mobile ISPs (e.g., moving from Jio to a proxy proxy server during high-volume trading).

### 3.2 Trade IP Tracking (Pulse Detection)
- **Multi-Account Clusters:** The system highlights instances where 2 or more different `UserIDs` are trading from the same IP address.
- **Forensic Table:** Displays `IP`, `Login Time`, `ISP`, and a count of active sessions associated with that network node.

---

## 4. Audit & Integrity (Action Ledger)
- **Immutability:** Every CREATE, UPDATE, or DELETE action by an Admin or Superadmin is logged in the `ActionLedger`. This cannot be modified or deleted.
- **Audit Detail:** Logs include the `Previous Value`, `New Value`, `Admin ID`, and `Timestamp`.
- **Zero-Guessing Wallet:** Funds are never globally "edited"; they are only changed via signed `ledger_transactions` (Credit/Debit), ensuring every Rupee is accounted for in the audit trail.
