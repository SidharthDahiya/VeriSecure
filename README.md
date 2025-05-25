# VeriSecure 🛡️

> AI-Powered Smart Contract Security Auditing Platform Built on Starknet

[![Starknet](https://img.shields.io/badge/Built%20on-Starknet-purple)](https://starknet.io/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-blue)](https://ai.google.dev/)
[![Live Contract](https://img.shields.io/badge/Contract-Live%20on%20Sepolia-green)](https://sepolia.starkscan.co/contract/0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c)


## 🌟 Overview

VeriSecure revolutionizes smart contract security by combining cutting-edge AI analysis with blockchain-verified audit certificates. Built natively for Starknet, it provides developers with comprehensive vulnerability detection and creates permanent, publicly verifiable audit records on-chain.

**🎯 Problem Solved**: Traditional smart contract auditing is expensive, time-consuming, and lacks transparency. VeriSecure democratizes security analysis while ensuring audit authenticity through blockchain verification.

## ✨ Key Features

### 🤖 AI-Powered Security Analysis
- **Google Gemini Integration**: Advanced AI model specifically trained for smart contract vulnerabilities
- **Multi-Language Support**: Comprehensive analysis for Solidity and Cairo contracts
- **Intelligent Severity Classification**: Automated categorization of High, Medium, Low, and Informational issues
- **Contextual Explanations**: AI-generated insights with detailed remediation suggestions

### 🔗 Blockchain Certificate System
- **Starknet Native**: Permanent audit certificates stored on Starknet blockchain
- **Public Verification**: Anyone can verify audit authenticity via Starkscan
- **Immutable Proof**: Cryptographic evidence of audit completion and results
- **Wallet Integration**: Seamless connection with ArgentX and Braavos wallets

### 📊 Professional Reporting Suite
- **Interactive Dashboard**: Real-time vulnerability analysis with visual charts
- **PDF Certificates**: Professional audit reports with branding
- **Detailed Analytics**: Comprehensive breakdown by detector and severity

### 🎨 Modern User Experience
- **Glassmorphism Design**: Beautiful, modern interface with smooth animations
- **Dark/Light Modes**: User preference customization
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🚀 Live Demo & Verification

**📄 Deployed Contract:** `0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c`

**🔍 Verify on Starkscan:** [View Live Contract](https://sepolia.starkscan.co/contract/0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c)

**🧪 Test the Platform:** [Try VeriSecure Now](https://verisecure-audit.vercel.app/) 

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | HTML5, CSS3 (Glassmorphism), JavaScript, Chart.js, Socket.io |
| **Backend** | Node.js, Express.js, Multer (file handling), PDF-Kit |
| **Blockchain** | Starknet (Sepolia), Cairo, Scarb, Starkli |
| **AI/ML** | Google Gemini API, Custom security prompts |
| **Infrastructure** | Git, npm, Real-time WebSocket communication |


## 📁 Project Structure

```
VeriSecure/
├── 🎯 src/                     # Core Auditing Engine
│   ├── ai/                    # Google Gemini integration
│   ├── detectors/             # Vulnerability detection modules
│   ├── parser/                # Multi-language contract parsing
│   └── reporter/              # PDF generation & analytics
├── 🌐 web/                     # Frontend Application
│   ├── public/
│   │   ├── css/style.css      # Glassmorphism UI components
│   │   ├── js/
│   │   │   ├── main.js        # Core frontend logic
│   │   │   └── starknet-integration.js # Blockchain connectivity
│   │   ├── images/            # Branding & assets
│   │   └── index.html         # Main application interface
│   ├── server.js              # Express.js server
│   └── package.json           # Dependencies & scripts
├── ⛓️ starknet-contracts/       # Smart Contract Suite
│   ├── src/audit_registry.cairo # Main audit registry contract
│   ├── Scarb.toml             # Cairo project configuration
│   └── target/                # Compiled contract artifacts
├── 🧪 test/                    # Comprehensive test suite
├── 📋 .gitignore               # Repository security rules
└── 📖 README.md                # Project documentation
```



## 🏃‍♂️ Quick Start Guide

### Prerequisites

Ensure you have the following tools installed:

- Node.js (v16 or higher)  
- [Scarb](https://docs.swmansion.com/scarb/) (Cairo package manager)  
- [Starkli](https://book.starknet.io/docs/hello_starknet/cli.html) (Starknet CLI tools)  
- Git



### 🔧 Installation & Setup

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/yourusername/VeriSecure.git
   cd VeriSecure
   ```

2. **Install Dependencies**
   ```bash
   cd web && npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   echo "GEMINI_API_KEY=your_google_gemini_api_key" >> .env
   echo "PORT=3000" >> .env
   ```

4. **Build Smart Contracts**
   ```bash
   cd ../starknet-contracts && scarb build
   ```

5. **Launch Application**
   ```bash
   cd ../web && npm start
   ```

Open [http://localhost:3000](http://localhost:3000)


## 🎯 Complete Usage Workflow

### Step 1: Contract Upload
- Drag & drop or select your `.sol` or `.cairo` contract file  
- Real-time validation ensures compatibility  
- Upload progress indicators

### Step 2: Analysis Configuration
- Enable **AI Analysis**  
- Opt for **PDF Generation**  
- Configure parameters

### Step 3: Security Review
- 📊 Dashboard Overview  
- 🔍 Detailed Vulnerabilities with severity ratings  
- 🤖 AI Insights & remediation suggestions  
- 📄 Downloadable PDF Reports

### Step 4: Blockchain Verification
- 🔗 Connect ArgentX or Braavos wallet  
- ⛓️ Submit certificate to Starknet  
- ✅ Public, immutable audit verification


## 🏗️ Smart Contract System

### Audit Registry Architecture

- 📝 Immutable on-chain storage  
- 🔍 Public audit lookup  
- 📊 Track audit stats  
- 🔒 Secure submission flow

### Core Contract Functions (Cairo)

```rust
// Submit a new audit result
fn submit_audit_result(
    contract_hash: felt252,
    score: u8,
    high_issues: u32,
    medium_issues: u32,
    low_issues: u32,
    ipfs_report_hash: felt252
) -> u256

// Query latest audit
fn get_latest_audit_for_contract(contract_hash: felt252) -> AuditResult

// Check audit status
fn is_contract_audited(contract_hash: felt252) -> bool

// Get total audits
fn get_audit_count() -> u256
```



### Key Achievements

- ✅ Full Starknet Integration  
- ✅ AI-Powered Vulnerability Detection  
- ✅ Polished UI/UX  
- ✅ Transparent, Trustless Verification

### Technical Highlights

- **Gas Efficient** design  
- **Modular Architecture**  
- **Security First** validation  
- **Premium User Experience**


## 📄 License

Licensed under the [MIT License](LICENSE)


