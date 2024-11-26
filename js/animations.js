class LandingAnimations {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            await this.initializeElements();
            if (!this.isInitialized) return;

            await this.playInitialFlash();
            await this.showSpaceAnimation();
            await this.showTitle();
        } catch (error) {
            console.error('Error initializing landing animations:', error);
        }
    }

    async initializeElements() {
        this.landingPage = document.getElementById('landing-page');
        this.flashContainer = document.getElementById('flash-container');
        this.spaceContainer = document.getElementById('space-container');
        this.titleContainer = document.getElementById('title-container');
        this.title = document.querySelector('.cyber-title');
        this.clickCircles = document.getElementById('click-circles');

        if (this.landingPage && this.flashContainer && this.spaceContainer && 
            this.titleContainer && this.title && this.clickCircles) {
            this.isInitialized = true;
        }
    }

    async playInitialFlash() {
        if (!this.flashContainer) return;
        for (let i = 0; i < 3; i++) {
            await this.createSingleFlash();
            await this.delay(100);
        }
        this.flashContainer.style.display = 'none';
    }

    createSingleFlash() {
        return new Promise(resolve => {
            const flash = document.createElement('div');
            flash.className = 'flash';
            this.flashContainer.appendChild(flash);
            flash.addEventListener('animationend', () => {
                flash.remove();
                resolve();
            }, { once: true });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async showSpaceAnimation() {
        if (!this.spaceContainer || !document.getElementById('stars')) return;
        this.spaceContainer.classList.remove('hidden');
        await this.createStars();
        await this.delay(1000);
    }

    async createStars() {
        const stars = document.getElementById('stars');
        if (!stars) return;

        const fragment = document.createDocumentFragment();
        const numStars = 200;

        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = `${Math.random() * 4 + 2}px`;
            star.style.height = star.style.width;
            star.style.left = `${Math.random() * 100}vw`;
            star.style.top = `${Math.random() * 100}vh`;
            star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
            star.style.animationDelay = `${Math.random() * 3}s`;
            fragment.appendChild(star);
        }

        stars.appendChild(fragment);
    }

    async showTitle() {
        if (!this.titleContainer || !this.title) return;
        this.titleContainer.classList.remove('hidden');
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                this.title.classList.add('visible');
                setTimeout(resolve, 1000);
            });
        });
    }
}

class MatrixRain {
    constructor() {
        this.initialize();
        window.addEventListener('resize', () => this.resize());
    }

    initialize() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('matrix-rain');

        if (!this.container) return;

        this.container.appendChild(this.canvas);
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
        this.fontSize = 14;
        this.resize();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns).fill(1);
    }

    start() {
        if (!this.ctx) return;

        this.frameCount = (this.frameCount || 0) + 1;
        if (this.frameCount % 2 !== 0) {
            requestAnimationFrame(() => this.start());
            return;
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#0f6';
        this.ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters[Math.floor(Math.random() * this.characters.length)];
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }

        requestAnimationFrame(() => this.start());
    }
}

class NFTAnimation {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.canvas = document.getElementById('nft-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleSize = 4; // تغییر سایز ذرات به 4
        this.gravity = 0.8;    // تغییر گرانش
        this.explosionForce = 15; // افزایش نیروی انفجار

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    async showAchievement(achievementData) {
        const achievementContainer = document.getElementById('nft-success');
        if (!achievementContainer) return;

        return new Promise((resolve) => {
            const gifImg = document.getElementById('achievement-gif');
            const title = document.getElementById('achievement-title');
            const message = document.getElementById('achievement-message');

            if (gifImg) gifImg.src = achievementData.gif;
            if (title) title.textContent = achievementData.name;
            if (message) message.textContent = achievementData.description;

            achievementContainer.classList.remove('hidden');
            
            setTimeout(() => {
                achievementContainer.classList.add('hidden');
                resolve();
            }, 3000);
        });
    }

    async showNFT(imageUrl) {
        if (!this.canvas || !this.ctx) return;

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            
            img.onload = async () => {
                this.canvas.classList.remove('hidden');
                
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const imgWidth = screenWidth * 0.3;
                const imgHeight = (imgWidth / img.width) * img.height;
                
                const xOffset = (screenWidth - imgWidth) / 2;
                const yOffset = (screenHeight - imgHeight) / 2;

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, xOffset, yOffset, imgWidth, imgHeight);

                await new Promise(r => setTimeout(r, 1000));
                
                try {
                    this.createParticles(imgWidth, imgHeight, xOffset, yOffset);
                    await this.animateExplosion();
                } catch (error) {
                    console.error('Animation error:', error);
                }
                
                resolve();
            };

            img.onerror = () => {
                console.error('Failed to load NFT image');
                resolve();
            };
        });
    }

    createParticles(imgWidth, imgHeight, xOffset, yOffset) {
        try {
            const imageData = this.ctx.getImageData(xOffset, yOffset, imgWidth, imgHeight);
            this.particles = [];

            for (let y = 0; y < imgHeight; y += this.particleSize) {
                for (let x = 0; x < imgWidth; x += this.particleSize) {
                    const index = (y * imgWidth + x) * 4;
                    const alpha = imageData.data[index + 3];

                    if (alpha > 0) {
                        for (let i = 0; i < 2; i++) {
                            this.particles.push({
                                x: x + xOffset,
                                y: y + yOffset,
                                color: `rgba(${imageData.data[index]},${imageData.data[index + 1]},${imageData.data[index + 2]},${alpha / 255})`,
                                dx: (Math.random() - 0.5) * this.explosionForce,
                                dy: (Math.random() - 0.5) * this.explosionForce,
                                gravity: this.gravity,
                                life: Math.random() * 100 + 100
                            });
                        }
                    }
                }
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('Error creating particles:', error);
            throw error;
        }
    }

    async animateExplosion() {
        return new Promise(resolve => {
            const animate = () => {
                if (!this.ctx) {
                    resolve();
                    return;
                }

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.dy += p.gravity;
                    p.x += p.dx;
                    p.y += p.dy;
                    p.life--;

                    if (p.life <= 0 || p.y > this.canvas.height) {
                        this.particles.splice(i, 1);
                        continue;
                    }

                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(p.x, p.y, this.particleSize, this.particleSize);
                }

                if (this.particles.length > 0) {
                    requestAnimationFrame(animate);
                } else {
                    this.canvas.classList.add('hidden');
                    resolve();
                }
            };

            animate();
        });
    }
}
class CyberAnimation {
    constructor() {
        this.container = document.querySelector('.cyber-animation-container');
        if (!this.container) this.createContainer();
        
        this.letters = ['C', 'Y', 'B', 'E', 'R'];
        this.currentIndex = 0;
        this.initialize();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'cyber-animation-container';
        document.body.appendChild(this.container);
    }

    initialize() {
        if (!this.container) return;
        
        const circlesContainer = document.createElement('div');
        circlesContainer.className = 'cyber-circles';
        
        this.letters.forEach(letter => {
            const circle = document.createElement('div');
            circle.className = 'cyber-circle';
            circle.dataset.letter = letter;
            circle.textContent = letter;
            circlesContainer.appendChild(circle);
        });
        
        this.container.appendChild(circlesContainer);
        this.circles = Array.from(this.container.querySelectorAll('.cyber-circle'));
        this.startAnimation();
    }

    startAnimation() {
        setInterval(() => {
            this.circles.forEach((circle, index) => {
                circle.classList.remove('active');
                if (index === this.currentIndex) {
                    circle.classList.add('active');
                }
            });
            this.currentIndex = (this.currentIndex + 1) % this.circles.length;
        }, 800);
    }
}

// Make animations available globally
window.LandingAnimations = LandingAnimations;
window.MatrixRain = MatrixRain;
window.NFTAnimation = NFTAnimation;
window.CyberAnimation = CyberAnimation;
