class Web3Integration {
    constructor() {
        // Initialize state
        this.currentAccount = null;
        this.web3 = null;
        this.connected = false;
        this.contracts = window.CONTRACT_DATA;
        
        // Supported wallet providers
        this.supportedWallets = {
            metamask: window.ethereum,
            okx: window.okxwallet
        };

        // Bind methods
        this.handleAccountChange = this.handleAccountChange.bind(this);
        this.handleChainChange = this.handleChainChange.bind(this);

        // Wait for DOM and initialize
        document.addEventListener('DOMContentLoaded', () => {
            this.appElement = document.getElementById('app');
            if (!this.appElement?.classList.contains('hidden')) {
                this.setupEventListeners();
            }
        });
    }

    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                if (this.connected) {
                    this.disconnectWallet();
                } else {
                    document.getElementById('wallet-modal')?.classList.remove('hidden');
                }
            });
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        }

        // Mint button
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) {
            mintBtn.addEventListener('click', () => this.mintNFT());
        }

        // Wallet options in modal
        const walletOptions = document.querySelectorAll('.wallet-option');
        walletOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const walletType = e.currentTarget.dataset.wallet;
                this.connectWallet(walletType);
            });
        });
    }

    async connectWallet(walletType) {
        try {
            const provider = this.supportedWallets[walletType];
            
            if (!provider) {
                Helpers.showMessage(`Please install ${walletType === 'metamask' ? 'MetaMask' : 'OKX Wallet'} first!`, 'error');
                return;
            }

            if (!(await this.switchToCyberNetwork(provider))) return;

            this.web3 = new Web3(provider);
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            this.currentAccount = accounts[0];
            this.connected = true;

            // Initialize contracts first
            await this.initializeContracts();

            // Update UI and fetch data
            this.updateUI('connect');
            await Promise.all([
                this.updateBalances(),
                this.checkAndDisplayCyberIDs()
            ]);

            // Setup wallet event listeners
            provider.on('accountsChanged', this.handleAccountChange);
            provider.on('chainChanged', this.handleChainChange);

            // Close modal and show success message
            document.getElementById('wallet-modal')?.classList.add('hidden');
            Helpers.showMessage('Wallet connected successfully!', 'success');

        } catch (error) {
            console.error('Connection error:', error);
            Helpers.showMessage('Failed to connect wallet. Please try again.', 'error');
        }
    }

    async initializeContracts() {
        if (!this.web3) return;
        
        try {
            // Initialize NFT contract
            this.nftContract = new this.web3.eth.Contract(
                this.contracts.NFT_ABI,
                this.contracts.ADDRESSES.NFT
            );

            // Initialize CyberID contract
            this.cyberIdContract = new this.web3.eth.Contract(
                this.contracts.CYBERID_ABI,
                this.contracts.ADDRESSES.CYBER_ID
            );

            // Initialize token contracts
            this.cyberToken = new this.web3.eth.Contract(
                this.contracts.TOKEN_ABI,
                this.contracts.ADDRESSES.CYBER_TOKEN
            );

            this.ccyberToken = new this.web3.eth.Contract(
                this.contracts.TOKEN_ABI,
                this.contracts.ADDRESSES.CCYBER_TOKEN
            );
        } catch (error) {
            console.error('Error initializing contracts:', error);
            throw new Error('Failed to initialize contracts');
        }
    }

    async updateBalances() {
        if (!this.web3 || !this.currentAccount) return;

        try {
            const [ethBalance, txCount, cyberBalance, ccyberBalance] = await Promise.all([
                this.web3.eth.getBalance(this.currentAccount),
                this.web3.eth.getTransactionCount(this.currentAccount),
                this.cyberToken.methods.balanceOf(this.currentAccount).call(),
                this.ccyberToken.methods.balanceOf(this.currentAccount).call()
            ]);

            this.updateBalanceUI('eth-balance', ContractHelpers.formatTokenBalance(ethBalance));
            this.updateBalanceUI('cyber-balance', ContractHelpers.formatTokenBalance(cyberBalance));
            this.updateBalanceUI('ccyber-balance', ContractHelpers.formatTokenBalance(ccyberBalance));
            this.updateBalanceUI('tx-count', txCount);

        } catch (error) {
            console.error('Error updating balances:', error);
            Helpers.showMessage('Failed to update balances', 'error');
        }
    }

    async checkAndDisplayCyberIDs() {
        if (!this.currentAccount || !this.cyberIdContract) return;

        try {
            const response = await fetch(
                `${this.contracts.API.CYBER_SCAN_URL}?module=account&action=tokennfttx&contractaddress=${this.contracts.ADDRESSES.CYBER_ID}&address=${this.currentAccount}&page=1&offset=100&sort=desc`,
                {
                    headers: { 'x-api-key': this.contracts.API.API_KEY }
                }
            );

            const data = await response.json();
            const container = document.getElementById('cyber-ids');
            const noCyberIdMessage = document.getElementById('no-cyber-id');
            
            if (!container || !noCyberIdMessage) return;
            
            container.innerHTML = '';

            if (data.status === '1' && data.result) {
                const ownedTokens = data.result.filter(tx => 
                    tx.to.toLowerCase() === this.currentAccount.toLowerCase()
                );

                if (ownedTokens.length > 0) {
                    noCyberIdMessage.classList.add('hidden');
                    container.classList.remove('hidden');

                    for (const token of ownedTokens) {
                        try {
                            const name = await this.cyberIdContract.methods.labels(token.tokenID).call();
                            
                            if (name) {
                                const element = document.createElement('div');
                                element.className = 'cyber-id-card fade-in';
                                element.innerHTML = `
                                    <img src="https://picasso.cyber.co/cyberid/${name}" 
                                         alt="${name}.cyber"
                                         onerror="this.style.display='none'"/>
                                    <div class="cyber-id-name">${name}.cyber</div>
                                `;
                                container.appendChild(element);
                            }
                        } catch (err) {
                            console.error('Error getting CyberID name:', err);
                        }
                    }
                } else {
                    this.showNoCyberIdMessage();
                }
            } else {
                this.showNoCyberIdMessage();
            }
        } catch (error) {
            console.error('Error checking CyberIDs:', error);
            this.showNoCyberIdMessage();
            Helpers.showMessage('Failed to load CyberIDs', 'error');
        }
    }

async mintNFT() {
    if (!this.connected || !this.nftContract) {
        Helpers.showMessage('Please connect your wallet first!', 'warning');
        return;
    }

    const loading = document.getElementById('loading');
    if (!loading) return;

    try {
        loading.classList.remove('hidden');
        
        const txCount = await this.web3.eth.getTransactionCount(this.currentAccount);
        let tokenType;
        
        // Get token type based on transaction count
        if (txCount <= 30) {
            tokenType = 1; // Pioneer
        } else if (txCount <= 60) {
            tokenType = 2; // Explorer
        } else if (txCount <= 90) {
            tokenType = 3; // Trailblazer
        } else {
            tokenType = 4; // Legendary
        }

        const nftMetadata = {
            image: this.contracts.NFT_METADATA.IMAGES[tokenType],
            name: this.contracts.NFT_METADATA.NAMES[tokenType],
            description: this.contracts.NFT_METADATA.DESCRIPTIONS[tokenType],
            gif: this.contracts.NFT_METADATA.GIFS[tokenType]
        };

        // Show achievement animation
        if (window.nftAnimation) {
            await window.nftAnimation.showAchievement({
                gif: nftMetadata.gif,
                name: nftMetadata.name,
                description: nftMetadata.description
            });
        }

        // Mint NFT
        const tx = await this.nftContract.methods.mintNFT(txCount).send({
            from: this.currentAccount,
            value: this.web3.utils.toWei('0.00002', 'ether')
        });

        if (tx.status) {
            loading.classList.add('hidden');
            
            // Show and explode NFT
            if (window.nftAnimation) {
                await window.nftAnimation.showNFT(nftMetadata.image);
            }
            
            // Update balances
            await this.updateBalances();
            
            Helpers.showMessage('NFT minted successfully!', 'success');
        }
    } catch (error) {
        console.error('Minting error:', error);
        Helpers.showMessage(ContractHelpers.parseContractError(error), 'error');
    } finally {
        loading.classList.add('hidden');
    }
}

    updateBalanceUI(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = value;
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 1000);
    }

    showNoCyberIdMessage() {
        const cyberIds = document.getElementById('cyber-ids');
        const noCyberIdMessage = document.getElementById('no-cyber-id');
        
        if (cyberIds) cyberIds.classList.add('hidden');
        if (noCyberIdMessage) {
            noCyberIdMessage.classList.remove('hidden');
            noCyberIdMessage.classList.add('fade-in');
        }
    }

    async switchToCyberNetwork(provider) {
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.contracts.NETWORK.CHAIN_ID }]
            });
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: this.contracts.NETWORK.CHAIN_ID,
                            chainName: this.contracts.NETWORK.CHAIN_NAME,
                            nativeCurrency: this.contracts.NETWORK.CURRENCY,
                            rpcUrls: [this.contracts.NETWORK.RPC_URL],
                            blockExplorerUrls: [this.contracts.NETWORK.EXPLORER_URL]
                        }]
                    });
                    return true;
                } catch (addError) {
                    console.error('Error adding Cyber network:', addError);
                    Helpers.showMessage('Failed to add Cyber network', 'error');
                    return false;
                }
            }
            Helpers.showMessage('Please switch to Cyber Network', 'warning');
            return false;
        }
    }

    handleChainChange() {
        window.location.reload();
    }

    async handleAccountChange(accounts) {
        if (accounts.length === 0) {
            await this.disconnectWallet();
        } else if (accounts[0] !== this.currentAccount) {
            this.currentAccount = accounts[0];
            this.updateUI('accountChange');
            await Promise.all([
                this.updateBalances(),
                this.checkAndDisplayCyberIDs()
            ]);
        }
    }

    updateUI(action) {
        const elements = {
            walletModal: document.getElementById('wallet-modal'),
            connectBtn: document.getElementById('connect-wallet'),
            walletAddress: document.getElementById('wallet-address'),
            disconnectBtn: document.getElementById('disconnect'),
            mintBtn: document.getElementById('mint-nft')
        };

        if (action === 'connect' || action === 'accountChange') {
            elements.walletModal?.classList.add('hidden');
            if (elements.connectBtn) elements.connectBtn.textContent = 'Connected';
            if (elements.walletAddress) {
                elements.walletAddress.textContent = ContractHelpers.formatAddress(this.currentAccount);
            }
            elements.disconnectBtn?.classList.remove('hidden');
            if (elements.mintBtn) elements.mintBtn.disabled = false;
        } else if (action === 'disconnect') {
            if (elements.connectBtn) elements.connectBtn.textContent = 'Connect Wallet';
            if (elements.walletAddress) elements.walletAddress.textContent = '';
            elements.disconnectBtn?.classList.add('hidden');
            if (elements.mintBtn) elements.mintBtn.disabled = true;
            this.resetDisplays();
        }
    }

    async disconnectWallet() {
        this.currentAccount = null;
        this.connected = false;
        this.web3 = null;
        this.nftContract = null;
        this.cyberIdContract = null;
        this.cyberToken = null;
        this.ccyberToken = null;

        this.updateUI('disconnect');
        
        for (const provider of Object.values(this.supportedWallets)) {
            if (provider) {
                provider.removeListener('accountsChanged', this.handleAccountChange);
                provider.removeListener('chainChanged', this.handleChainChange);
            }
        }

        Helpers.showMessage('Wallet disconnected', 'info');
    }
}

// Make Web3Integration available globally
window.Web3Integration = Web3Integration;
