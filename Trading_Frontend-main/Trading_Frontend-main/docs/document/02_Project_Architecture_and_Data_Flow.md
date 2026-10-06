# Comprehensive Project Architecture & Data Flow (Full Ecosystem)

This document provides a holistic view of the system's technical design, data movement, and operational lifecycles across all user roles (Superadmin, Admin, Broker, and Trader).

---

## 1. High-Level Technology Stack
The platform is built on a modern, event-driven web stack optimized for low-latency financial operations.

- **Frontend:** React.js (Single Page Application)
- **State Management:** React Context API (`AuthContext`) + Local Component State (`useState`, `useReducer`).
- **Styling:** CSS3 with Vanilla CSS and Tailwind CSS components.
- **Routing:** Switch-case view management in `App.jsx` with `localStorage` persistence.
- **Communication:** REST APIs (Axios) + WebSockets (Socket.io) for real-time market data.
- **Micro-Services:** Real-time M2M engine and Order Matching engine.

---

## 2. Multi-Tenant Role Hierarchy & Access Control
The system enforces a strict hierarchical data isolation model using **RBAC (Role-Based Access Control)**.

- **Superadmin:** The master controller with global telemetry and enterprise-wide financial settlement.
- **Admin:** Operational oversight. Verified fund requests, forensic IP auditing, and support center management.
- **Broker:** Business-centric panel. Isolated view of personal client networks, earning shares, and localized risk monitoring.
- **Trader:** Execution terminal. Real-time market watch and order management.

---

## 3. Detailed Data Flow: The Digital Lifecycle of a Trade

### 3.1 Market Data Ingest (Input)
1. **Exchange Feed:** Backend maintains persistent TCP connections to external market data vendors.
2. **Socket Broadcast:** New LTP (Last Traded Price) ticks are emitted via **Socket.io** namespaces.
3. **Frontend Sync:** Pages like `MarketWatchPage` and `LiveM2M` update dynamically without refreshing.

### 3.2 Order Submission & Validation (Action)
1. **Initiation:** Trader triggers a "BUY/SELL" action.
2. **Validation:**
    - **Margin:** Checks `ledgerBalance` vs `RequiredMargin`.
    - **Ban List:** Checks if the scrip is banned in `Market Watch`.
    - **Limits:** Validates against `Max Lot Size` set by the Broker.
3. **Execution:** If passes, a record is created in the `trades` table.

### 3.3 Real-Time M2M Calculation (Processing)
1. **Formula:** `Profit/Loss = (Current LTP - Entry Price) * Quantity * Lot Multiplier`.
2. **Aggregation Ripple:**
    - **Trader App:** Shows individual P&L.
    - **Broker Panel:** Aggregates P&L for all clients under that broker.
    - **Admin/Superadmin Dashboards:** Aggregate P&L for the entire platform or specific branches.

---

## 4. Operational Workflows (End-to-End)

### 4.1 Onboarding Workflow
1. **Step 1:** Superadmin creates an Admin or Broker.
2. **Step 2:** Broker logs in and creates a Trading Client using the high-fidelity `ClientDetailsForm`.
3. **Step 3:** System assigns `parent_broker_id` and initial segment limits.

### 4.2 Financial Deposit Workflow
1. **Step 1:** Trader makes an offline payment and uploads a screenshot proof.
2. **Step 2:** Admin reviews the proof in the `DepositRequestsPage` using forensic inspection tools.
3. **Step 3:** Admin uses `CreateFundForm` to credit the user's `ledger_balance`.
4. **Step 4:** Transaction is logged in `ActionLedger` and updated in the user's wallet.

---

## 5. Security Architecture (The Sentinel Layer)
- **Forensic Logs:** `IpLoginsPage` tracks Network Origin, ISP, and Device Fingerprints.
- **Anomaly Detection:** `TradeIpTrackingPage` alerts on "Multi-Account Clusters" (multiple UIDs on one IP).
- **Session Persistence:** `AuthContext.jsx` manages `traders_session_valid` to maintain state across refreshes.
- **Database Silos:** Every query is automatically filtered by the tenant's ID (`broker_id` or `user_id`) to prevent data leakage.
