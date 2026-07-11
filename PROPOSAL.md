# Product Proposal

## What is the product, and who uses it?
**TradeSealed** is a confidential, production-grade B2B procurement and sealed-bid tender application built on the Midnight Network using Zero-Knowledge cryptography.
* **Procurement Managers & Authorities:** Use the portal to publish Requests for Proposals (RFPs) and tenders with target qualification rules (e.g., minimum score thresholds).
* **Vendors & Suppliers:** Use the portal to connect their browser wallet (Lace or 1AM) and submit competitive bid pricing quotes and qualification scores in total confidentiality.

## Why Midnight specifically?
Midnight is uniquely suited for TradeSealed because it provides a hybrid ledger model that balances public verification with private states:
1. **Confidentiality:** Vendor bid pricing and qualification scores remain entirely off-chain (inside private witnesses). This prevents competitors from seeing bids, eliminating collusion, bid rigging, and front-running.
2. **ZK Proofs:** Bidders generate local proofs verifying that their bid price is positive and they satisfy the minimum RFP qualification score, without publishing the raw numbers.
3. **Auditability:** Midnight's selective disclosure lets the contract disclose outcomes under designated cryptographic conditions, preserving privacy while enabling verification.

## Data Model
| Data Point | Type | Disclosed To |
| :--- | :--- | :--- |
| **Tender Authority Address** | Public ledger | Everyone (On-Chain) |
| **Minimum Qualification Score** | Public ledger | Everyone (On-Chain) |
| **Total Bid Count** | Public ledger | Everyone (On-Chain) |
| **RFP Status (Active/Closed)** | Public ledger | Everyone (On-Chain) |
| **Vendor Secret Identity Key** | Private witness | No one (Local Wallet) |
| **Bid Price** | Private witness | No one (Local Client Memory) |
| **Vendor Qualification Score** | Private witness | No one (Local Client Memory) |

## Mainnet Feasibility
Yes, this product is highly feasible for a Mainnet launch by Level 6. The logic uses simple numerical inequality constraints (evaluating if score >= min and price > 0) that compile to compact ZKIR and run efficiently in the Midnight DApp connector and browser memory.
