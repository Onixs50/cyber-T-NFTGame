// Contract ABIs and Constants
const CONTRACT_DATA = {
    // Token Contract ABI
    TOKEN_ABI: [
        {
            "constant": true,
            "inputs": [{"name": "account", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [{"name": "", "type": "uint8"}],
            "type": "function"
        }
    ],

    // NFT Contract ABI
    NFT_ABI: [
        {
            "inputs": [{"name": "tokenId", "type": "uint256"}],
            "name": "getTokenId",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"name": "transactionCount", "type": "uint256"}],
            "name": "mintNFT",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ],

    // CyberID Contract ABI
    CYBERID_ABI: [
        {
            "constant": true,
            "inputs": [{"name": "tokenId", "type": "uint256"}],
            "name": "labels",
            "outputs": [{"name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        }
    ],

    // Contract Addresses
    ADDRESSES: {
        NFT: "0x94a5e5c8985718431c7f77f6cf6ebb93234b83c4",
        CYBER_TOKEN: "0x14778860e937f509e651192a90589de711fb88a9",
        CCYBER_TOKEN: "0x522d3a9c2bc14ce1c4d210ed41ab239fded02f2b",
        CYBER_ID: "0xc137be6b59e824672aada673e55cf4d150669af8"
    },

    // Network Configuration
    NETWORK: {
        CHAIN_ID: "0x1d88",
        CHAIN_NAME: "Cyber Network",
        RPC_URL: "https://rpc.cyber.co",
        EXPLORER_URL: "https://scan.cyber.co",
        CURRENCY: {
            NAME: "CYBER",
            SYMBOL: "CYBER",
            DECIMALS: 18
        }
    },

    // NFT Metadata
NFT_METADATA: {
    IMAGES: {
        1: "/assets/nft/1.png",
        2: "/assets/nft/2.png",
        3: "/assets/nft/3.png",
        4: "/assets/nft/4.png"
    },
    NAMES: {
        1: "Pioneer Pass",
        2: "Explorer Badge", 
        3: "Trailblazer Token",
        4: "Legendary Crest"
    },
    DESCRIPTIONS: {
        1: "Level 1 achievement for early adopters",
        2: "Level 2 achievement for active participants",
        3: "Level 3 achievement for dedicated users",
        4: "Level 4 achievement for legendary contributors"
    },
    GIFS: {
        1: "/assets/nft/pioneer.gif",
        2: "/assets/nft/explorer.gif",
        3: "/assets/nft/trailblazer.gif",
        4: "/assets/nft/legendary.gif"
    }
},
    API: {
        CYBER_SCAN_URL: "https://api.socialscan.io/cyber/v1/developer/api",
        API_KEY: "3ccb00e2-963e-492a-bf0e-b4f5546e6c3c"
    }
};

// Helper Functions
const ContractHelpers = {
    formatBalance(balance, decimals = 18) {
        try {
            return parseFloat(Web3.utils.fromWei(balance.toString(), 'ether')).toFixed(decimals);
        } catch {
            return '0.' + '0'.repeat(decimals);
        }
    },

    formatTokenBalance(balance, decimals = 18) {
        if (!balance) return '0.0000';
        try {
            const divisor = new Web3.utils.BN(10).pow(new Web3.utils.BN(decimals));
            const bn = new Web3.utils.BN(balance);
            const whole = bn.div(divisor).toString();
            const remainder = bn.mod(divisor).toString().padStart(decimals, '0');
            return `${whole}.${remainder.slice(0, 4)}`;
        } catch {
            return '0.0000';
        }
    },

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    parseContractError(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        const errorTypes = {
            'insufficient funds': 'Insufficient funds to complete transaction',
            'user rejected': 'Transaction was rejected by user',
            'gas required exceeds allowance': 'Transaction would exceed gas limit',
            'nonce too low': 'Please reset your wallet or wait for pending transactions',
            'already pending': 'Transaction already pending, please wait',
            'execution reverted': 'Transaction failed. Please check your balance and try again'
        };

        for (const [key, message] of Object.entries(errorTypes)) {
            if (errorMessage.includes(key)) return message;
        }

        return 'Transaction failed. Please try again later';
    },

    getNFTTypeByTxCount(txCount) {
        if (txCount >= 91) return 4; // Legendary
        if (txCount >= 61) return 3; // Trailblazer
        if (txCount >= 31) return 2; // Explorer
        return 1; // Pioneer
    }
};

// Make contracts data and helpers available globally
window.CONTRACT_DATA = CONTRACT_DATA;
window.ContractHelpers = ContractHelpers;