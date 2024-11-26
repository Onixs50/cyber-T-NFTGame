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

   const disconnectBtn = document.getElementById('disconnect');
   if (disconnectBtn) {
       disconnectBtn.addEventListener('click', () => this.disconnectWallet());
   }

   const mintBtn = document.getElementById('mint-nft');
   if (mintBtn) {
       mintBtn.addEventListener('click', () => this.mintNFT());
   }

   const walletOptions = document.querySelectorAll('.wallet-option');
   walletOptions.forEach(option => {
       option.addEventListener('click', (e) => {
           const walletType = e.currentTarget.dataset.wallet;
           this.connectWallet(walletType);
       });
   });

   const showNftsBtn = document.getElementById('show-nfts');
   if (showNftsBtn) {
       showNftsBtn.addEventListener('click', async () => {
           await this.showUserNFTs();
       });
   }

   const nftModal = document.getElementById('nft-modal');
   if (nftModal) {
       nftModal.addEventListener('click', (e) => {
           if (e.target === nftModal) {
               nftModal.classList.remove('visible');
               setTimeout(() => {
                   nftModal.classList.add('hidden');
               }, 300);
           }
       });
   }
}

async showUserNFTs() {
   // Check if wallet is connected and contract is initialized
   if (!this.connected || !this.nftContract) {
       Helpers.showMessage('Please connect your wallet first!', 'warning');
       return;
   }
   const modal = document.getElementById('nft-modal');
   const container = document.getElementById('user-nfts');
   
   if (!modal || !container) return;
   
   try {
       // Check if user has any NFTs
       const nftBalance = await this.nftContract.methods.balanceOf(this.currentAccount).call();
       
       if (nftBalance == 0) {
           Helpers.showMessage('You don\'t have any NFTs yet!', 'info');
           return;
       }
       
       // Get transaction count to determine NFT level
       const txCount = await this.web3.eth.getTransactionCount(this.currentAccount);
       container.innerHTML = '';
       
       // Determine token ID based on transaction count
       let tokenId;
       if (txCount <= 30) tokenId = 1; // Pioneer
       else if (txCount <= 60) tokenId = 2; // Explorer
       else if (txCount <= 90) tokenId = 3; // Trailblazer
       else tokenId = 4; // Legendary
       
       // Verify if user owns this specific NFT
       const hasToken = await this.nftContract.methods.getTokenId(txCount).call();
       
       if (hasToken == tokenId) {
           // Create and display NFT card
           const nftCard = document.createElement('div');
           nftCard.className = 'nft-card';
           nftCard.innerHTML = `
               <img src="${this.contracts.NFT_METADATA.IMAGES[tokenId]}" 
                    alt="${this.contracts.NFT_METADATA.NAMES[tokenId]}">
               <div class="nft-name">${this.contracts.NFT_METADATA.NAMES[tokenId]}</div>
           `;
           container.appendChild(nftCard);
           modal.classList.remove('hidden');
           modal.classList.add('visible');
       } else {
           Helpers.showMessage('You don\'t have this NFT yet!', 'info');
       }

   } catch (error) {
       console.error('Error showing NFTs:', error);
       Helpers.showMessage('Failed to load NFTs', 'error');
   }
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

        console.log('NFT Metadata:', nftMetadata); // Debug log

        // Show achievement animation before minting
        if (window.nftAnimation) {
            console.log('Showing achievement animation...'); // Debug log
            try {
                await window.nftAnimation.showAchievement({
                    gif: nftMetadata.gif,
                    name: nftMetadata.name,
                    description: nftMetadata.description
                });
            } catch (err) {
                console.error('Achievement animation error:', err); // Debug log
            }
        }

        // Mint NFT
        console.log('Starting NFT mint...'); // Debug log
        const tx = await this.nftContract.methods.mintNFT(txCount).send({
            from: this.currentAccount,
            value: this.web3.utils.toWei('0.00002', 'ether')
        });

        if (tx.status) {
            loading.classList.add('hidden');
            
            // Show and explode NFT after successful mint
            if (window.nftAnimation) {
                console.log('Showing NFT animation...'); // Debug log
                await window.nftAnimation.showNFT(nftMetadata.image);
            }
            
            // Update balances
            await this.updateBalances();
            
            Helpers.showMessage('NFT minted successfully!', 'success');
        }
    } catch (error) {
        console.error('Minting error:', error);
        loading.classList.add('hidden');
        Helpers.showMessage(ContractHelpers.parseContractError(error), 'error');
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
        mintBtn: document.getElementById('mint-nft')
    };

    if (action === 'connect' || action === 'accountChange') {
        elements.walletModal?.classList.add('hidden');
        if (elements.connectBtn) {
            elements.connectBtn.textContent = 'Connected';
            elements.connectBtn.classList.add('connected');
        }
        if (elements.walletAddress) {
            elements.walletAddress.textContent = ContractHelpers.formatAddress(this.currentAccount);
        }
        document.getElementById('show-nfts')?.classList.remove('hidden');
        if (elements.mintBtn) elements.mintBtn.disabled = false;
    } else if (action === 'disconnect') {
        if (elements.connectBtn) {
            elements.connectBtn.textContent = 'Connect Wallet';
            elements.connectBtn.classList.remove('connected');
        }
        if (elements.walletAddress) elements.walletAddress.textContent = '';
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

    // Add these lines
    document.getElementById('show-nfts')?.classList.add('hidden');
    document.getElementById('nft-modal')?.classList.add('hidden');
    
    this.updateUI('disconnect');
    
    for (const provider of Object.values(this.supportedWallets)) {
        if (provider) {
        }
    }

    Helpers.showMessage('Wallet disconnected', 'info');
}
}

// Make Web3Integration available globally
window.Web3Integration = Web3Integration;
