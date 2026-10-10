# System Overview & Backend Infrastructure Design

This document provides a conceptual summary of the platform's purpose and the architectural structure that supports high-frequency operations.

---

## 1. Executive System Summary
The platform is an enterprise-grade **Multi-Tenant Trading Ecosystem**. It provides a bridge between live market exchanges and institutional trading partners (Brokers).

- **Objective:** To provide low-latency execution, real-time risk surveillance, and seamless partnership revenue management.
- **Client Base:** Currently supports thousands of traders managed through a hierarchical tree of Sub-Brokers and Operational Admins.

---

## 2. Platform Stakeholders

### 2.1 The Master (Superadmin)
Concentrates on enterprise-wide health. Manages the platform's global "Golden Parameters" like brokerage slabs, segment availability, and master bank details.

### 2.2 The Staff (Admin)
The operational workhorse. Handles the daily verification of deposit proofs, withdrawal approvals, and incident ticket resolution. They use forensic tools to ensure platform hygiene.

### 2.3 The Business Partner (Broker)
The growth driver. Manages a "Siloed" network of traders. They have deep visibility into their group's Profit/Loss and are responsible for onboarding and micro-risk management.

---

## 3. Backend Architectural Strategy

### 3.1 Data Model (Relational + Cache)
- **Primary Persistence:** Relational Database (PostgreSQL/MySQL) storing users, trades, and ledger records.
- **Cache Layer:** Redis is used for high-speed retrieval of:
    - Current LTP ticks.
    - Active Session tokens.
    - Transient M2M states.

### 3.2 Security-First Design
- **Auth Middleware:** Every API request to `/api/*` passes through a multi-factor authorization check.
- **Database Silo Logic:** Tenant isolation is baked into the database queries using `WHERE` clauses derived from the encrypted JWT payload.
- **Wallet-Ledger Integrity:** The system uses "Double-Entry Bookkeeping" for the user wallet. A balance is never a single number; it is a calculated sum of all historical transactions, preventing manual "faking" of balances.

---

## 4. Scalability & Resilience
- **Cluster Deployment:** The backend is designed for horizontal scaling across multiple application nodes using a load balancer.
- **Disaster Recovery:** Databases are backed up hourly with a "Point-In-Time" recovery (PITR) strategy.
- **Global Revert Safety:** A critical failure in a batch update can be reversed instantly using the "State Snapshot" system in the Admin panel.

---

## 5. Media & Surveillance Strategy
- **Audio Storage:** Voice recordings are encrypted end-to-end and stored in a secure session buffer.
- **Proof Storage:** Forensic screenshots of bank transfers are stored with unique hashes to ensure non-guessable URLs and privacy.
