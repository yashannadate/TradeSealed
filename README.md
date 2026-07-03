# 🛡️ TradeSealed
`Network` `Compact` `Midnight SDK` `Lace Wallet` `Zero-Knowledge`

A confidential, production-grade B2B procurement and sealed-bid auction portal built on the Midnight Network.

**TradeSealed** streamlines enterprise Requests for Proposals (RFPs) and vendor supply tenders by utilizing Zero-Knowledge cryptography. Vendors submit competitive pricing quotes in complete privacy without risking data leaks, collusion, or front-running. Built for the **New Moon (Level 1)** challenge as part of the **RiseIn & Midnight Foundation "New Moon to Full: Monthly Moonshots on Midnight" Program 2026**.

---

## 🌑 Level 1 Requirements & Submission Checklist

| Level 1 Requirement / Checklist Item | Status | Verification Details |
| :--- | :---: | :--- |
| **Toolchain Installed & Compiling** | ✅ **Passed** | Compiled using official Midnight Compact CLI v0.30.0 inside WSL. |
| **Generated `managed/` Directory Present** | ✅ **Passed** | Auto-generated ZKIR circuits (`submit_bid.zkir`) and TypeScript wrappers generated. |
| **Passing Test Suite** | ✅ **Passed** | Automated unit tests passing via Vitest test runner (`npm test`). |
| **Contract Deployed to Preview/Preprod** | ✅ **Passed** | Deployed at `6823a11cd72d4eff83bca90fcf63fb1f737576f3cc9e782e21b745a8229961ef` via browser connector. |
| **Public State vs. Private Witness Docs** | ✅ **Passed** | Explicitly documented below in Security & Architecture section. |
| **Initial Product Idea Pitch (1 Paragraph)** | ✅ **Passed** | Explicitly drafted below targeting the *Sealed-Bid Auction* category. |
| **Minimum 5 Meaningful Commits** | ✅ **Passed** | Clean conventional commit history adhering to standard software engineering practices. |

---

## 💡 Initial Product Idea Pitch

In traditional corporate and municipal RFPs, bidding vendors submit price quotes and proprietary qualification metrics that are vulnerable to leaking prematurely—either to competing vendors or corrupt procurement officials—leading to bid-rigging and unfair market bias. On standard public blockchains, sealed-bid mechanisms require clunky off-chain commit-reveal schemes that expose historic pricing strategies once revealed. **TradeSealed** leverages Midnight’s native Zero-Knowledge (ZK) cryptography via the Compact language to allow vendors to submit bids where their exact pricing quotes and qualification scores remain entirely confidential inside local private witnesses. The blockchain mathematically verifies that each bidder meets minimum technical requirements and records an immutable submission receipt on the public ledger state without ever exposing the dollar amounts. When the tender concludes, selective disclosure (`disclose()`) reveals only the winning outcome, guaranteeing 100% fair procurement while preserving commercial trade secrets forever.

---

## ✨ Features

* 🔐 **Confidential Bid Submission** — Vendors submit price quotes inside local zero-knowledge private witnesses without revealing amounts on-chain.
* 🛡️ **Automated Qualification Gating** — The ZK circuit mathematically proves that a vendor meets the minimum ESG/technical qualification threshold before accepting their bid.
* ⚡ **Selective Disclosure (`disclose()`)** — Public state counters update dynamically while keeping commercial bids and vendor identities completely hidden.
* 🔍 **Preprod Ledger Verification** — Every submission generates a verifiable on-chain state transition on the Midnight Preprod network.
* 🧪 **Production-Grade Testing** — Fully automated TypeScript unit testing suite powered by `@midnight-ntwrk/compact-runtime`.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Smart Contract** | Compact Language (`v0.22.0+`) | Native ZK domain-specific language for public/private state transitions |
| **Compiler** | Midnight Compact CLI (`v0.30.0`) | Compiles `.compact` code into ZKIR circuits and TypeScript wrappers |
| **Runtime SDK** | `@midnight-ntwrk/compact-runtime` | TypeScript execution environment for contract simulation and proofs |
| **Testing** | Vitest / TypeScript | Fast unit testing engine running automated circuit verification |
| **Target Network** | Midnight Preprod / Preview | Live staging network for privacy-preserving dApps |

---

## 🚀 Quick Start

### Prerequisites
* **Node.js** v18+ or v24 LTS (`node -v`)
* **WSL 2 (Ubuntu) or Linux/macOS** (Required for native Midnight compiler tools)
* **Docker Desktop** (Running locally for ZK proof server computation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashannadate/TradeSealed.git
   cd TradeSealed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile the Compact Smart Contract**
   Generates Zero-Knowledge circuits (`managed/zkir/`) and TypeScript interfaces (`managed/contract/`):
   ```bash
   npm run compile
   ```

4. **Run the Automated Test Suite**
   Verify the public ledger state initialization and ZK circuit rules:
   ```bash
   npm test
   ```

---

## 🔒 Security & Architecture: Public State vs. Private Witness

In strict adherence to Midnight’s privacy-by-default architecture, `contract/src/sealed_bidding.compact` divides data into public consensus state and local private execution state:

```text
[ Bidder's Local Proving Engine ]                  [ Midnight Preprod Blockchain Ledger ]
┌──────────────────────────────────────┐           ┌──────────────────────────────────────────────┐
│ Private Witness Inputs (Off-Chain):  │           │ Public Ledger State (Visible to All):        │
│ • Vendor Secret Identity Key         │  ──(ZK)─► │ • Tender Authority Address                   │
│ • Bid Price Quote (e.g. $45,000)     │  Proof    │ • Minimum Required Qualification Score       │
│ • Vendor Technical Rating Score      │           │ • Total Bids Received Counter (bids_count)   │
└──────────────────────────────────────┘           └──────────────────────────────────────────────┘
```

* **Public Ledger State (`export ledger`)**: Stores universal RFP metadata (`tender_authority`, `minimum_qualification_score`, `bids_count`, `is_active`). Everyone can inspect these fields to verify tender fairness.
* **Private Witness Callbacks (`witness`)**: Declares local functions (`bid_price()`, `vendor_qualification_score()`) that run *exclusively on the user's client machine*.
* **Deliberate Selective Disclosure (`disclose()`)**: The `submit_bid()` circuit asserts that `bid_price > 0` and `vendor_qualification_score >= minimum_qualification_score`. Upon success, it updates `bids_count.increment(1)`. **No price or score is ever passed to `disclose()` during bidding**, proving a valid bid was submitted while preserving 100% commercial secrecy.

---

## 📸 Screenshots & Evidence

### 1. Successful Compile Output (Circuits Listed)
*(Refer to `compile.png` uploaded separately in submission)*

### 2. Automated Test Suite Passing
*(Refer to `test.png` uploaded separately in submission)*

### 3. Contract Deployed on Midnight Preprod (Visible Contract Address)
*(Refer to `deploy.png` uploaded separately in submission)*

* **Network**: Midnight Preprod
* **Contract Address**: `mn_addr_preprod1dq36z885ev8hssxg885e3kky2t53xut6mqcn4dqm` (Explorer Derived) / `6823a11cd72d4eff83bca90fcf63fb1f737576f3cc9e782e21b745a8229961ef` (Ledger Raw)
* **Deployment Transaction Hash**: `205c601428afde4905a93d84700781251e29b73957304cf41ef7e1e2dfb65940`
* **Fees Paid**: 1 speck (negligible DUST fee sponsored by 1AM ProofStation)

---

## 🖥️ Browser Deployment Harness

We utilize the official Midnight Browser DApp Connector API (`window.midnight["1am"]`) for fee balancing and transaction broadcasting to avoid syncing the entire blockchain in Node.js.

### Running the Harness
1. **Start the Proof Server**:
   Ensure Docker is running and launch the proof server container:
   ```bash
   docker start proof-server
   ```
2. **Launch Vite Development Server**:
   Navigate to the harness directory and start the local dev server:
   ```bash
   cd deploy-harness
   npm run dev
   ```
3. **Deploy**:
   * Open `http://localhost:5173` in your browser.
   * Click **Connect 1AM Wallet Extension** (ensure it's set to the Preprod network).
   * Click **Deploy Contract to Midnight Preprod** and confirm the popup in your 1AM wallet.

---

## 🙏 Acknowledgments
* **Midnight Foundation & IOG** for building the ground-breaking privacy-first blockchain architecture.
* **RiseIn** for hosting the *Stellar Journey to Mastery* and *New Moon to Full* builder programs.
* **1AM Wallet & ProofStation** for sponsoring gas and enabling seamless browser testing.
