# Global Trading Rules & Business Logic Reference

This document centralizes all the core financial and operational rules that govern the trading engine and the partnership revenue model.

---

## 1. Trading Execution Rules
The Trading Engine enforces these rules on every order attempt:

- **Banned Scrip Enforcement:** If a scrip is added to the "Ban List" (Market Watch), the system allows `EXIT` orders but blocks `NEW ENTRY` orders.
- **Anti-Scalping Rule:** Trades held for less than the minimum profit time (e.g., 2-5 minutes) cannot be closed for a profit. Loss trades are allowed to close anytime.
- **Bid Gap Regulation:** Limit orders cannot be placed too far or too close to the current LTP, preventing price feeding manipulation.
- **Segment-Wise Lot Limits:** Lot sizes are restricted per category (MCX Mega, NSE Cash, etc.) to control total exposure.

---

## 2. Risk Management & Margin Logic
- **Leverage/Exposure:** Multipliers (e.g., 500x) are set at the Superadmin level but can be adjusted for specific brokers or clients.
- **Maintenance Margin:** If a user's net loss hits 70% of their ledger, a "Margin Call" notification is sent.
- **Auto Square-Off:** At 85% loss of capital, the system automatically triggers market-exit for all active positions to prevent negative balance debt.
- **Negative Balance Management:** Instances where slippage causes a balance below zero are flagged for manual review in the `NegativeBalanceTxnsPage`.

---

## 3. Revenue Sharing & Settlement Model (Partnership Logic)
The platform operates on a split-revenue model between the platform owner (Superadmin) and the partners (Brokers).

- **Brokerage Split:**
    - **Example:** Trader pays ₹100. Superadmin takes ₹20 (Platform Fee), and Broker takes ₹80 (Partner Commission).
- **Profit & Loss (P&L) Split:**
    - Based on the `Share %` (e.g., 10-90 or 20-80).
    - If a client makes a loss of ₹1,000, it is distributed as Profit to the Broker (₹800) and Superadmin (₹200).
- **Swap (Overnight) Charges:**
    - Applied at market close for positions held overnight.
    - These charges are also split according to the partner agreement.

---

## 4. Administrative Rule Overrides
- **Global Updation Wizard:** Allows mass-updating of parameters (like Margin or Lot Size) for thousands of users simultaneously.
- **Rollback Safety:** Every global update saves a "Pre-Update Snapshot". If an error occurs, the admin can use the **Global Revert** button to instantly restore previous values.
- **Transaction Guard:** A mandatory secondary 8-character password is required for any action that affects the financial state of a client ledger.

---

## 5. Hierarchy Inheritance Rules
- **Rule of Limit:** A Broker cannot assign a leverage or lot-limit to a Client that exceeds what the Superadmin has granted to the Broker.
- **Permission Waterfall:** If a Broker's access to "MCX Segment" is revoked by the Superadmin, that segment is automatically disabled for all clients under that Broker's hierarchy.
