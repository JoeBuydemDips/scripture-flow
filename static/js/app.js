class BibleQuoteDisplay {
    constructor() {
        // Get quotes from the global BIBLE_QUOTES variable loaded from quotes.js
        this.quotes = window.BIBLE_QUOTES || BIBLE_QUOTES;
        this.shuffledQuotes = [...this.quotes];
        this.currentIndex = 0;
        this.interval = null;
        this.intervalTime = 30000; // Default 30 seconds
        this.isPlaying = true;
        this.isShuffled = false;
        this.favorites = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isDragging = false;
        this.swipeThreshold = 50;
        this.swipeMinVelocity = 0.3;
        this.hasUsedSwipe = localStorage.getItem('hasUsedSwipe') === 'true';

        // DOM Elements
        this.quoteText = document.querySelector('.quote-text');
        this.quoteReference = document.querySelector('.quote-reference');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.intervalRange = document.getElementById('intervalRange');
        this.intervalValue = document.getElementById('intervalValue');
        this.themeToggle = document.getElementById('themeToggle');
        this.shuffleToggle = document.getElementById('shuffleToggle');
        this.backgroundSelect = document.getElementById('backgroundSelect');
        this.favoriteBtn = document.querySelector('.favorite-btn');
        this.favoritesList = document.getElementById('favoritesList');
        this.favoritesCount = document.getElementById('favoritesCount');

        // Initialize the application
        this.initializeState();
        this.lastTap = 0; // For double-tap detection

        // Initialize Feather icons first
        feather.replace({
            'stroke-width': 2,
            'width': 24,
            'height': 24
        });

        this.setupEventListeners();
        this.startSlideshow();
        this.displayQuote();
        this.updatePlayPauseButton();
        this.showSwipeHintsIfNeeded();
    }

    initializeState() {
        // Load settings from localStorage
        const savedInterval = localStorage.getItem('interval');
        const savedTheme = localStorage.getItem('theme');
        const savedShuffle = localStorage.getItem('shuffle');
        const savedBackground = localStorage.getItem('background');
        const savedFavorites = localStorage.getItem('favorites');

        if (savedInterval) {
            this.intervalTime = parseInt(savedInterval);
            this.intervalRange.value = this.intervalTime / 1000;
            this.intervalValue.textContent = this.intervalTime / 1000;
        }

        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeToggle.checked = true;
        }

        if (savedShuffle === 'true') {
            this.isShuffled = true;
            this.shuffleToggle.checked = true;
            this.shuffleQuotes();
        }

        if (savedBackground) {
            document.body.setAttribute('data-background', savedBackground);
            this.backgroundSelect.value = savedBackground;
        }

        if (savedFavorites) {
            this.favorites = JSON.parse(savedFavorites);
            this.updateFavoritesList();
        }
    }

    setupEventListeners() {
        document.getElementById('clearFavoritesBtn').addEventListener('click', () => this.clearFavorites());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettings();
        });

        // Enhanced swipe detection for mobile devices
        const quoteCard = document.querySelector('.quote-card');
        
        // Variables for better touch handling
        let touchStartTime = 0;
        
        quoteCard.addEventListener('touchstart', (e) => {
            // Store initial touch position and time
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            this.isDragging = false;
            
            // Add visual feedback
            quoteCard.style.transition = 'none';
        }, { passive: true });

        quoteCard.addEventListener('touchmove', (e) => {
            if (!this.touchStartX) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - this.touchStartX;
            const deltaY = currentY - this.touchStartY;
            
            // Only handle horizontal swipes, allow vertical scrolling
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                e.preventDefault(); // Prevent scrolling for horizontal swipes
                this.isDragging = true;
                
                // Add visual feedback during swipe
                const rotation = deltaX * 0.1;
                const scale = 1 - Math.abs(deltaX) * 0.0005;
                quoteCard.style.transform = `translateX(${deltaX * 0.3}px) rotate(${rotation}deg) scale(${scale})`;
                quoteCard.style.opacity = 1 - Math.abs(deltaX) * 0.002;
            }
        }, { passive: false });

        quoteCard.addEventListener('touchend', (e) => {
            if (!this.touchStartX) return;
            
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            // Reset visual feedback
            quoteCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            quoteCard.style.transform = '';
            quoteCard.style.opacity = '';
            
            // Handle swipe if dragging occurred
            if (this.isDragging) {
                this.handleSwipe(touchDuration);
            }
            
            // Reset touch values
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.isDragging = false;
        }, { passive: true });

        // Handle touch cancel (when user drags outside the element)
        quoteCard.addEventListener('touchcancel', (e) => {
            // Reset visual feedback
            quoteCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            quoteCard.style.transform = '';
            quoteCard.style.opacity = '';
            
            // Reset touch values
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchEndX = 0;
            this.touchEndY = 0;
            this.isDragging = false;
        }, { passive: true });

        // Enhanced double tap detection for mobile
        let tapCount = 0;
        let tapTimer = null;
        
        quoteCard.addEventListener('touchstart', (e) => {
            // Only handle double-tap if not currently dragging/swiping
            if (e.touches.length === 1 && !this.isDragging) {
                tapCount++;
                
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0; // Reset if single tap
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    
                    // Prevent conflict with swipe gesture
                    e.preventDefault();
                    
                    // Only trigger favorite if it's definitely not a swipe gesture
                    setTimeout(() => {
                        if (!this.isDragging) {
                            this.toggleFavorite();
                            // Add visual feedback for double-tap
                            quoteCard.style.transform = 'scale(1.05)';
                            setTimeout(() => {
                                quoteCard.style.transform = '';
                            }, 150);
                        }
                    }, 10);
                }
            }
        }, { passive: true });

        // Fallback click handler for desktop
        quoteCard.addEventListener('click', (e) => {
            // Only handle click on desktop (when no touch support)
            if (!('ontouchstart' in window)) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - this.lastTap;

                if (tapLength < 500 && tapLength > 0) {
                    this.toggleFavorite();
                    e.preventDefault();
                }
                this.lastTap = currentTime;
            }
        });

        document.querySelector('.close-settings-btn').addEventListener('click', () => {
            this.settingsPanel.classList.remove('active');
        });

        document.addEventListener('click', (e) => {
            if (this.settingsPanel.classList.contains('active') &&
                !this.settingsPanel.contains(e.target) &&
                e.target !== this.settingsBtn) {
                this.settingsPanel.classList.remove('active');
            }
        });


        this.intervalRange.addEventListener('input', (e) => {
            const seconds = parseInt(e.target.value);
            this.intervalValue.textContent = seconds;
            this.intervalTime = seconds * 1000;
            localStorage.setItem('interval', this.intervalTime);

            if (this.isPlaying) {
                this.restartSlideshow();
            }
        });

        this.themeToggle.addEventListener('change', () => {
            const theme = this.themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });

        this.shuffleToggle.addEventListener('change', () => {
            this.isShuffled = this.shuffleToggle.checked;
            localStorage.setItem('shuffle', this.isShuffled);

            if (this.isShuffled) {
                this.shuffleQuotes();
            } else {
                this.shuffledQuotes = [...this.quotes];
            }

            this.currentIndex = 0;
            this.displayQuote();
        });

        this.backgroundSelect.addEventListener('change', () => {
            const background = this.backgroundSelect.value;
            document.body.setAttribute('data-background', background);
            localStorage.setItem('background', background);
        });

        this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
    }

    handleSwipe(touchDuration = 0) {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        // Calculate swipe distance and velocity
        const distance = Math.abs(deltaX);
        const velocity = distance / touchDuration; // pixels per millisecond
        
        // Check if this is a valid horizontal swipe
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        const exceedsThreshold = distance > this.swipeThreshold;
        const hasMinVelocity = velocity > this.swipeMinVelocity;
        
        if (isHorizontalSwipe && (exceedsThreshold || hasMinVelocity)) {
            // Mark that user has used swipe functionality
            if (!this.hasUsedSwipe) {
                this.hasUsedSwipe = true;
                localStorage.setItem('hasUsedSwipe', 'true');
                quoteCard.classList.add('swipe-used');
            }
            
            // Add swipe animation class
            const quoteCard = document.querySelector('.quote-card');
            
            if (deltaX > 0) {
                // Swipe right - previous quote
                quoteCard.classList.add('swipe-right');
                setTimeout(() => {
                    this.previousQuote();
                    quoteCard.classList.remove('swipe-right');
                }, 150);
            } else {
                // Swipe left - next quote
                quoteCard.classList.add('swipe-left');
                setTimeout(() => {
                    this.nextQuote();
                    quoteCard.classList.remove('swipe-left');
                }, 150);
            }
        }
    }

    previousQuote() {
        this.currentIndex = (this.currentIndex - 1 + this.shuffledQuotes.length) % this.shuffledQuotes.length;
        this.displayQuote();
        this.restartSlideshow();
    }

    updateFavoritesList() {
        this.favoritesList.innerHTML = '';
        if (this.favoritesCount) {
            this.favoritesCount.textContent = this.favorites.length;
        }

        if (this.favorites.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'favorites-empty-state';
            emptyState.innerHTML = `
                <i data-feather="heart"></i>
                <p>No favorites yet</p>
                <span>Your favorite quotes will appear here</span>
            `;
            this.favoritesList.appendChild(emptyState);
            feather.replace();
            return;
        }

        this.favorites.forEach((quote, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = quote.reference;
            item.addEventListener('click', () => this.displayFavorite(index));
            this.favoritesList.appendChild(item);
        });
    }

    toggleFavorite() {
        const currentQuote = this.shuffledQuotes[this.currentIndex];
        const quoteKey = `${currentQuote.text}-${currentQuote.reference}`;

        if (this.isQuoteFavorited(currentQuote)) {
            this.favorites = this.favorites.filter(fav =>
                `${fav.text}-${fav.reference}` !== quoteKey
            );
            this.favoriteBtn.classList.remove('active');
        } else {
            this.favorites.push(currentQuote);
            this.favoriteBtn.classList.add('active');
        }

        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesList();
    }

    isQuoteFavorited(quote) {
        return this.favorites.some(fav =>
            fav.text === quote.text && fav.reference === quote.reference
        );
    }

    displayFavorite(index) {
        const quote = this.favorites[index];
        const quoteIndex = this.shuffledQuotes.findIndex(q =>
            q.text === quote.text && q.reference === quote.reference
        );

        if (quoteIndex !== -1) {
            this.currentIndex = quoteIndex;
            this.displayQuote();
        }
    }

    shuffleQuotes() {
        this.shuffledQuotes = [...this.quotes];
        for (let i = this.shuffledQuotes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledQuotes[i], this.shuffledQuotes[j]] =
                [this.shuffledQuotes[j], this.shuffledQuotes[i]];
        }
    }

    displayQuote() {
        const quote = this.shuffledQuotes[this.currentIndex];

        // Fade out current quote
        this.quoteText.style.opacity = '0';
        this.quoteReference.style.opacity = '0';

        // Wait for fade out to complete before updating content
        setTimeout(() => {
            this.quoteText.textContent = quote.text;
            this.quoteReference.textContent = quote.reference;
            this.favoriteBtn.classList.toggle('active', this.isQuoteFavorited(quote));

            // Fade in new quote
            this.quoteText.style.opacity = '1';
            this.quoteReference.style.opacity = '1';
        }, 500); // Match the CSS transition duration
    }

    nextQuote() {
        if (this.isShuffled && this.currentIndex === this.shuffledQuotes.length - 1) {
            this.shuffleQuotes();
            this.currentIndex = 0;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.shuffledQuotes.length;
        }
        this.displayQuote();
        if (this.isPlaying) {
            this.restartSlideshow();
        }
    }

    updateCountdown(timeLeft) {
        const countdownText = document.querySelector('.countdown-text');
        const circle = document.querySelector('.progress-ring__circle');
        if (!countdownText || !circle) return;

        const circumference = 163.36; // 2 * π * radius (26)
        const offset = circumference - (timeLeft / (this.intervalTime / 1000)) * circumference;

        countdownText.textContent = Math.ceil(timeLeft);
        circle.style.strokeDashoffset = offset;

        // Ensure visibility on mobile
        const ring = document.querySelector('.progress-ring');
        if (ring) {
            ring.style.display = this.isPlaying ? 'flex' : 'none';
        }
    }

    startSlideshow() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        let timeLeft = this.intervalTime / 1000;
        this.updateCountdown(timeLeft);

        this.interval = setInterval(() => {
            timeLeft -= 0.1;
            if (timeLeft <= 0) {
                timeLeft = this.intervalTime / 1000;
                this.nextQuote();
            }
            this.updateCountdown(timeLeft);
        }, 100);
    }

    restartSlideshow() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.startSlideshow();
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            this.startSlideshow();
        } else {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Update the button icon
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        if (!this.playPauseBtn) return;

        // Clear existing content
        this.playPauseBtn.innerHTML = '';

        // Create new icon with correct attributes
        const icon = document.createElement('i');
        icon.setAttribute('data-feather', this.isPlaying ? 'pause' : 'play');
        this.playPauseBtn.appendChild(icon);

        // Replace with Feather icon
        feather.replace({
            'stroke-width': 2,
            'width': 24,
            'height': 24
        });
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('active');
    }

    clearFavorites() {
        this.favorites = [];
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.updateFavoritesList();
        this.favoriteBtn.classList.remove('active');
    }

    showSwipeHintsIfNeeded() {
        // Show swipe hints and instructions on mobile devices if user hasn't used swipe yet
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        
        if (isMobile && !this.hasUsedSwipe) {
            const quoteCard = document.querySelector('.quote-card');
            
            // Show instructions first
            quoteCard.classList.add('show-instructions');
            
            setTimeout(() => {
                quoteCard.classList.remove('show-instructions');
                // Then show swipe hints
                quoteCard.classList.add('show-hints');
                
                // Auto-hide hints after 3 more seconds
                setTimeout(() => {
                    quoteCard.classList.remove('show-hints');
                }, 3000);
            }, 3000);
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather icons with specific settings
    feather.replace({
        'stroke-width': 2,
        'width': 24,
        'height': 24,
        'color': 'currentColor'
    });
    // Then create the Bible quote display instance
    const app = new BibleQuoteDisplay();
});