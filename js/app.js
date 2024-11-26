class CyberApp {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        try {
            // Initialize landing animations
            this.landingAnimations = new LandingAnimations();
            await this.landingAnimations.init();

            // Setup landing page events
            this.setupLandingPageEvents();

            // Initialize Web3 integration
            this.web3Integration = new Web3Integration();

            // Initialize CYBER animation
            this.initializeCyberAnimation();
        } catch (error) {
            console.error('Error initializing app:', error);
            Helpers.showMessage('Failed to initialize application', 'error');
        }
    }

    initializeCyberAnimation() {
        const container = document.createElement('div');
        container.className = 'cyber-animation-container';
        const circlesContainer = document.createElement('div');
        circlesContainer.className = 'cyber-circles';
        
        ['C', 'Y', 'B', 'E', 'R'].forEach(letter => {
            const circle = document.createElement('div');
            circle.className = 'cyber-circle';
            circle.textContent = letter;
            circlesContainer.appendChild(circle);
        });
        
        container.appendChild(circlesContainer);
        document.body.appendChild(container);

        let currentIndex = 0;
        setInterval(() => {
            const circles = document.querySelectorAll('.cyber-circle');
            circles.forEach((circle, index) => {
                circle.classList.remove('active');
                if (index === currentIndex) {
                    circle.classList.add('active');
                }
            });
            currentIndex = (currentIndex + 1) % circles.length;
        }, 800);
    }

    setupLandingPageEvents() {
        this.landingPage = document.getElementById('landing-page');
        this.app = document.getElementById('app');
        const title = document.querySelector('.cyber-title');

        if (title) {
            title.addEventListener('click', () => this.handleTitleClick());
        }
    }

    async handleTitleClick() {
        try {
            await this.createCircles();
            await this.transitionToMainApp();
            this.initializeMainApp();
        } catch (error) {
            console.error('Error handling title click:', error);
        }
    }

    createCircles() {
        return new Promise(resolve => {
            const clickCircles = document.getElementById('click-circles');
            if (!clickCircles) return resolve();

            for (let i = 0; i < 5; i++) {
                const circle = document.createElement('div');
                circle.className = 'circle';
                circle.style.left = '50%';
                circle.style.top = '50%';
                circle.style.animationDelay = `${i * 0.1}s`;
                clickCircles.appendChild(circle);
            }

            setTimeout(resolve, 800);
        });
    }

    transitionToMainApp() {
        return new Promise(resolve => {
            if (!this.landingPage || !this.app) return resolve();

            this.landingPage.classList.add('fade-out');

            setTimeout(() => {
                this.landingPage.style.display = 'none';
                this.app.classList.remove('hidden');
                this.app.classList.add('fade-in');
                resolve();
            }, 500);
        });
    }

    initializeMainApp() {
        // Initialize matrix rain effect
        const matrixRain = new MatrixRain();
        matrixRain.start();

        // Initialize Web3 integration
        this.web3Integration.setupEventListeners();

        // Setup info panel
        this.setupInfoPanel();

        // Setup neon line effect
        this.setupNeonLine();

        // Create NFT animation instance
        window.nftAnimation = new NFTAnimation();
    }

setupInfoPanel() {
    const infoButton = document.getElementById('info-button');
    const infoPanel = document.getElementById('info-panel');
    
    if (!infoButton || !infoPanel) return;

    infoButton.addEventListener('click', (e) => {
        e.stopPropagation();
        infoPanel.classList.toggle('visible');
        infoButton.classList.toggle('active');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!infoPanel.contains(e.target) && !infoButton.contains(e.target)) {
            infoPanel.classList.remove('visible');
            infoButton.classList.remove('active');
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            infoPanel.classList.remove('visible');
            infoButton.classList.remove('active');
        }
    });

    // Prevent closing when clicking inside panel
    infoPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
    setupNeonLine() {
        const separator = document.querySelector('.neon-line');
        if (!separator) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        separator.classList.add('animate');
                    } else {
                        separator.classList.remove('animate');
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(separator);
    }
}

// Initialize app
window.app = new CyberApp();