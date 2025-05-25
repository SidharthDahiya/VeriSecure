// web/public/js/starknet-integration.js
class StarknetIntegration {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.account = null;
        this.contractAddress = "0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c";

        console.log("✅ StarknetIntegration initialized with Live contract");
        console.log("📄 Contract Address:", this.contractAddress);

        this.checkWalletAvailability();
    }

    checkWalletAvailability() {
        setTimeout(() => {
            const hasStarknet = typeof window.starknet !== 'undefined';
            console.log("🔍 Wallet availability check:");
            console.log("- window.starknet:", hasStarknet ? "✅ Available" : "❌ Not found");

            if (hasStarknet) {
                console.log("- Wallet ID:", window.starknet.id || "Unknown");
                console.log("- Wallet Name:", window.starknet.name || "Unknown");
                console.log("- Is Connected:", window.starknet.isConnected || false);
                console.log("- Chain ID:", window.starknet.chainId || "Unknown");
            }
        }, 1000);
    }

    async connectWallet() {
        try {
            console.log("🔄 Attempting wallet connection...");

            if (typeof window.starknet === 'undefined') {
                throw new Error('NO_WALLET_DETECTED');
            }

            // Simple enable method (most reliable)
            const accounts = await window.starknet.enable();

            if (!accounts || accounts.length === 0) {
                throw new Error('NO_ACCOUNTS_RETURNED');
            }

            this.wallet = window.starknet;
            this.account = this.wallet.account;
            this.connection = {
                address: accounts[0],
                chainId: this.wallet.chainId,
                isConnected: true,
                walletName: this.wallet.name || 'Unknown'
            };

            console.log("✅ Wallet connected successfully:");
            console.log("- Address:", this.connection.address);
            console.log("- Chain ID:", this.connection.chainId);
            console.log("- Wallet Name:", this.connection.walletName);

            return this.connection;

        } catch (error) {
            console.error("❌ Wallet connection failed:", error);
            this.handleConnectionError(error);
            throw error;
        }
    }

    handleConnectionError(error) {
        if (error.message === 'NO_WALLET_DETECTED') {
            alert("🦊 No Starknet wallet detected!\n\nPlease install ArgentX wallet.");
            window.open('https://chrome.google.com/webstore/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb', '_blank');
        } else if (error.message.includes('rejected') || error.message.includes('denied')) {
            alert("❌ Wallet connection was cancelled.");
        } else {
            alert("❌ Connection failed: " + error.message);
        }
    }

    async submitAuditToBlockchain(auditData) {
        if (!this.connection || !this.wallet || !this.account) {
            throw new Error("Please connect your wallet first");
        }

        try {
            // Force check network before submission
            console.log("🔍 Pre-submission network check...");
            console.log("- Wallet Chain ID:", this.wallet.chainId);
            console.log("- Contract Address:", this.contractAddress);
            console.log("- Account Address:", this.connection.address);

            // Verify we're on Sepolia testnet
            const chainId = this.wallet.chainId;
            if (chainId && !chainId.toString().includes("SEPOLIA") &&
                !chainId.toString().includes("sepolia") &&
                chainId !== "0x534e5f5345504f4c4941") {

                throw new Error("Please switch your wallet to Starknet Sepolia testnet");
            }

            console.log("🔄 Preparing blockchain submission...");

            // Calculate audit parameters
            const contractHash = this.stringToFelt252(auditData.contractPath);
            const totalWeightedIssues =
                auditData.summary.severityCounts.high * 10 +
                auditData.summary.severityCounts.medium * 5 +
                auditData.summary.severityCounts.low * 1;
            const score = Math.max(0, Math.min(100, 100 - totalWeightedIssues));

            console.log("📤 Submission parameters:");
            console.log("- Contract File:", auditData.contractPath.split('/').pop());
            console.log("- Contract Hash:", contractHash);
            console.log("- Security Score:", score + "/100");
            console.log("- High Issues:", auditData.summary.severityCounts.high);
            console.log("- Medium Issues:", auditData.summary.severityCounts.medium);
            console.log("- Low Issues:", auditData.summary.severityCounts.low);
            console.log("- Target Contract:", this.contractAddress);

            // Prepare transaction with explicit types
            const calls = [{
                contractAddress: this.contractAddress,
                entrypoint: "submit_audit_result",
                calldata: [
                    contractHash,
                    score.toString(),
                    auditData.summary.severityCounts.high.toString(),
                    auditData.summary.severityCounts.medium.toString(),
                    auditData.summary.severityCounts.low.toString(),
                    "0x0" // IPFS hash placeholder
                ]
            }];

            console.log("📋 Execute call structure:", JSON.stringify(calls, null, 2));

            // Execute transaction with detailed error handling
            try {
                console.log("🚀 Executing transaction...");
                const result = await this.account.execute(calls);

                if (!result || !result.transaction_hash) {
                    throw new Error("Transaction submission failed - no transaction hash returned");
                }

                console.log("✅ Transaction submitted successfully!");
                console.log("- Transaction Hash:", result.transaction_hash);
                console.log("- Starkscan URL: https://sepolia.starkscan.co/tx/" + result.transaction_hash);

                this.showSubmissionSuccess(result, auditData);

                return {
                    transactionHash: result.transaction_hash,
                    auditId: score,
                    isReal: true,
                    contractAddress: this.contractAddress
                };

            } catch (executeError) {
                console.error("❌ Execute error details:", executeError);

                // Enhanced error analysis
                if (executeError.message.includes("not deployed")) {
                    throw new Error(`Network sync issue: Contract shows as Live on Starkscan but wallet can't find it. This is usually a network/RPC mismatch. Contract: ${this.contractAddress}`);
                } else if (executeError.message.includes("User abort") || executeError.message.includes("rejected")) {
                    throw new Error("Transaction was cancelled by user");
                } else if (executeError.message.includes("insufficient")) {
                    throw new Error("Insufficient balance for transaction fees");
                } else {
                    throw new Error(`Execution failed: ${executeError.message}`);
                }
            }

        } catch (error) {
            console.error("❌ Blockchain submission failed:", error);
            this.handleSubmissionError(error);
            throw error;
        }
    }

    showSubmissionSuccess(result, auditData) {
        const message =
            `🎉 Audit Certificate Submitted!\n\n` +
            `📄 Contract: ${auditData.contractPath.split('/').pop()}\n` +
            `🔗 Transaction: ${result.transaction_hash.substring(0, 20)}...\n\n` +
            `Your audit has been permanently recorded on Starknet!\n\n` +
            `View on Starkscan?`;

        if (confirm(message)) {
            window.open(`https://sepolia.starkscan.co/tx/${result.transaction_hash}`, '_blank');
        }
    }

    handleSubmissionError(error) {
        if (error.message.includes("Network sync issue")) {
            alert(
                "🔄 Network Sync Issue\n\n" +
                "Your contract exists on Starkscan but there's a network mismatch.\n\n" +
                "Solutions:\n" +
                "• Make sure wallet is on Sepolia testnet\n" +
                "• Try refreshing the page\n" +
                "• Switch wallet network and back\n\n" +
                "Contract is deployed correctly!"
            );
        } else if (error.message.includes("not deployed")) {
            alert("❌ Contract deployment issue. Please check Starkscan to verify deployment.");
        } else if (error.message.includes("cancelled") || error.message.includes("abort")) {
            alert("❌ Transaction was cancelled by user.");
        } else if (error.message.includes("insufficient")) {
            alert(
                "❌ Insufficient Balance\n\n" +
                "You don't have enough STRK tokens for transaction fees.\n" +
                "Get test tokens from: https://starknet-faucet.vercel.app/"
            );
        } else {
            alert("❌ Submission failed: " + error.message);
        }
    }

    stringToFelt252(str) {
        const bytes = new TextEncoder().encode(str.substring(0, 31));
        let felt = BigInt(0);
        for (let i = 0; i < bytes.length; i++) {
            felt = felt * BigInt(256) + BigInt(bytes[i]);
        }
        return '0x' + felt.toString(16);
    }

    disconnect() {
        this.wallet = null;
        this.account = null;
        this.connection = null;
        console.log("✅ Wallet disconnected");
    }

    isConnected() {
        return this.connection !== null && this.connection.isConnected;
    }

    getContractUrl() {
        return `https://sepolia.starkscan.co/contract/${this.contractAddress}`;
    }

    getTransactionUrl(txHash) {
        return `https://sepolia.starkscan.co/tx/${txHash}`;
    }
}

// Make available globally
window.StarknetIntegration = StarknetIntegration;
console.log("✅ StarknetIntegration ready with network testing");

// =====================================================
// COMPREHENSIVE DEBUG AND TESTING FUNCTIONS
// =====================================================

// Network alignment testing
window.testNetworkAlignment = async function() {
    console.log("🔍 Testing Network Alignment:");
    console.log("=====================================");

    const contractAddress = "0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c";

    // Check wallet network
    console.log("1. Wallet Network Analysis:");
    if (window.starknet) {
        console.log("   - Chain ID:", window.starknet.chainId);
        console.log("   - Is Connected:", window.starknet.isConnected);
        console.log("   - Selected Address:", window.starknet.selectedAddress);
        console.log("   - Provider Available:", typeof window.starknet.provider !== 'undefined');

        // Check if it's Sepolia
        const chainId = window.starknet.chainId;
        const isSepolia = chainId && (
            chainId.toString().includes("SEPOLIA") ||
            chainId.toString().includes("sepolia") ||
            chainId === "0x534e5f5345504f4c4941"
        );
        console.log("   - Is Sepolia:", isSepolia ? "✅ Yes" : "❌ No - SWITCH TO SEPOLIA!");
    } else {
        console.log("   - ❌ No wallet detected");
    }

    // Test contract existence via wallet provider
    console.log("\n2. Contract Test via Wallet Provider:");
    try {
        if (window.starknet && window.starknet.provider) {
            const result = await window.starknet.provider.getClassAt(contractAddress);
            console.log("   ✅ Contract found via wallet provider");
            console.log("   - Class hash:", result.class_hash);
        } else {
            console.log("   ❌ Wallet provider not available");
        }
    } catch (error) {
        console.log("   ❌ Contract not found via wallet provider:", error.message);
    }

    // Test direct RPC calls to different endpoints
    console.log("\n3. Contract Test via Multiple RPC Endpoints:");

    const rpcEndpoints = [
        "https://starknet-sepolia.public.blastapi.io",
        "https://starknet-sepolia-rpc.publicnode.com",
        "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7"
    ];

    for (const endpoint of rpcEndpoints) {
        try {
            console.log(`   Testing: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'starknet_getClassAt',
                    params: [contractAddress, 'latest'],
                    id: 1
                })
            });

            const data = await response.json();
            if (data.result && data.result.class_hash) {
                console.log(`   ✅ Contract found via ${endpoint}`);
            } else {
                console.log(`   ❌ Contract not found via ${endpoint}:`, data.error);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint} failed:`, error.message);
        }
    }

    console.log("\n4. Starkscan Verification:");
    console.log("   - Opening Starkscan to verify contract status...");
    window.open(`https://sepolia.starkscan.co/contract/${contractAddress}`, '_blank');

    console.log("\n5. Integration Status:");
    if (window.starknetIntegration) {
        console.log("   - Integration Instance:", "✅ Available");
        console.log("   - Is Connected:", window.starknetIntegration.isConnected());
        console.log("   - Contract Address:", window.starknetIntegration.contractAddress);
    } else {
        console.log("   - Integration Instance:", "❌ Not found");
    }

    console.log("\n=====================================");
    console.log("🎯 Diagnosis:");
    console.log("If contract shows 'Live' on Starkscan but tests fail:");
    console.log("• Check wallet is on Sepolia testnet");
    console.log("• Try switching networks and back");
    console.log("• Clear wallet cache/restart wallet");
    console.log("• Use different RPC endpoint");
};

// Quick contract verification
window.quickContractCheck = async function() {
    const contractAddress = "0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c";

    console.log("🔍 Quick Contract Check:");
    console.log("- Contract Address:", contractAddress);
    console.log("- Opening Starkscan for verification...");
    window.open(`https://sepolia.starkscan.co/contract/${contractAddress}`, '_blank');

    // Simple existence check
    try {
        const response = await fetch('https://starknet-sepolia.public.blastapi.io', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'starknet_getClassAt',
                params: [contractAddress, 'latest'],
                id: 1
            })
        });

        const data = await response.json();
        if (data.result && data.result.class_hash) {
            console.log("✅ Contract found! Class hash:", data.result.class_hash);
        } else {
            console.log("❌ Contract not found via RPC:", data.error);
        }
    } catch (error) {
        console.log("❌ RPC check failed:", error.message);
    }
};

// Test simple blockchain submission
window.testSimpleSubmission = async function() {
    if (!window.starknetIntegration || !window.starknetIntegration.isConnected()) {
        alert("Please connect your wallet first using the 'Connect Wallet' button!");
        return;
    }

    console.log("🧪 Testing blockchain submission with mock data...");

    const mockAuditData = {
        contractPath: '/test/NetworkTest.sol',
        summary: {
            severityCounts: {
                high: 0,
                medium: 1,
                low: 1
            }
        }
    };

    try {
        console.log("📤 Submitting test audit data...");
        const result = await window.starknetIntegration.submitAuditToBlockchain(mockAuditData);
        console.log("✅ Test submission successful:", result);
        alert("🎉 Test successful! Transaction hash: " + result.transactionHash);
    } catch (error) {
        console.error("❌ Test submission failed:", error.message);
        alert("❌ Test failed: " + error.message);
    }
};

// Comprehensive system status
window.systemCheck = function() {
    console.log("🔍 VeriSecure System Status:");
    console.log("================================");

    // Check components
    console.log("1. Core Components:");
    console.log("   - StarknetIntegration class:", typeof window.StarknetIntegration !== 'undefined' ? "✅" : "❌");
    console.log("   - Integration instance:", typeof window.starknetIntegration !== 'undefined' ? "✅" : "❌");

    // Check wallet
    console.log("2. Wallet Status:");
    console.log("   - window.starknet:", typeof window.starknet !== 'undefined' ? "✅" : "❌");
    if (window.starknetIntegration) {
        console.log("   - Connected:", window.starknetIntegration.isConnected() ? "✅" : "❌");
        if (window.starknetIntegration.isConnected()) {
            console.log("   - Address:", window.starknetIntegration.connection.address);
            console.log("   - Chain ID:", window.starknetIntegration.connection.chainId);
        }
    }

    // Check contract
    console.log("3. Contract Status:");
    console.log("   - Address: 0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c");
    console.log("   - Starkscan: https://sepolia.starkscan.co/contract/0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c");

    // Check UI
    console.log("4. UI Elements:");
    console.log("   - Connect button:", document.getElementById('wallet-connect') ? "✅" : "❌");
    console.log("   - Submit button:", document.getElementById('submit-to-blockchain') ? "✅" : "❌");
    console.log("   - Test submit button:", document.getElementById('test-submit-blockchain') ? "✅" : "❌");

    console.log("================================");
    console.log("🎯 Available Test Functions:");
    console.log("   - testNetworkAlignment() ← RUN THIS FIRST");
    console.log("   - quickContractCheck()");
    console.log("   - testSimpleSubmission()");
    console.log("   - systemCheck()");
};

// Force wallet reconnection
window.forceWalletSync = function() {
    if (typeof window.starknet === 'undefined') {
        console.log("❌ No wallet detected");
        return false;
    }

    if (!window.starknet.isConnected) {
        console.log("❌ Wallet not connected");
        return false;
    }

    if (!window.starknetIntegration) {
        console.log("❌ Creating new StarknetIntegration instance...");
        window.starknetIntegration = new window.StarknetIntegration();
    }

    // Force sync the connection
    window.starknetIntegration.wallet = window.starknet;
    window.starknetIntegration.account = window.starknet.account;
    window.starknetIntegration.connection = {
        address: window.starknet.selectedAddress,
        chainId: window.starknet.chainId,
        isConnected: true,
        walletName: window.starknet.name || 'ArgentX'
    };

    console.log("✅ Forced wallet sync completed");
    console.log("- Address:", window.starknetIntegration.connection.address);
    console.log("- Chain ID:", window.starknetIntegration.connection.chainId);
    console.log("- Is Connected:", window.starknetIntegration.isConnected());

    return true;
};

// Auto-initialization
setTimeout(() => {
    if (typeof window.systemCheck === 'function') {
        console.log("🔍 Auto-running system check...");
        window.systemCheck();
        console.log("\n🎯 Next step: Run testNetworkAlignment() to diagnose network issues");
    }
}, 2000);


// =====================================================
// ENVIRONMENT DETECTION AND DEBUG CONTROL
// =====================================================

(function() {
    // Detect environment
    const isDevelopment = window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('localhost') ||
                         window.location.search.includes('debug=true');

    if (isDevelopment) {
        // DEVELOPMENT MODE
        console.log("🔧 VeriSecure Development Mode");
        console.log("🎯 Debug functions available:");
        console.log("   - testNetworkAlignment()");
        console.log("   - testSimpleSubmission()");
        console.log("   - systemCheck()");
        console.log("   - forceWalletSync()");
        console.log("   - quickContractCheck()");


    } else {
        // PRODUCTION MODE
        console.log("🎯 VeriSecure Production Mode Ready");

        // Clean up console for production
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        // Only show important messages
        console.log = function(...args) {
            if (args[0] && typeof args[0] === 'string') {
                if (args[0].includes('✅') || args[0].includes('❌') ||
                    args[0].includes('🎉') || args[0].includes('Error') ||
                    args[0].includes('VeriSecure') || args[0].includes('Transaction')) {
                    originalLog.apply(console, args);
                }
            }
        };

        console.warn = function(...args) {
            if (args[0] && (args[0].includes('Error') || args[0].includes('Warning'))) {
                originalWarn.apply(console, args);
            }
        };

        console.info = function(...args) {
            if (args[0] && args[0].includes('VeriSecure')) {
                originalInfo.apply(console, args);
            }
        };

        window.debugMode = false;
    }
})();
