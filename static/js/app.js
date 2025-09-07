class BibleQuoteDisplay {
    constructor() {
        // Get quotes from the global BIBLE_QUOTES variable loaded from quotes.js
        this.quotes = (window.BIBLE_QUOTES && window.BIBLE_QUOTES.length > 0) 
            ? window.BIBLE_QUOTES 
            : [{ text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", reference: "John 3:16" }];
        
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

        this.setupEventListeners();
        this.startSlideshow();
        this.displayInitialQuote(); // Use immediate display for first quote
        this.updatePlayPauseButton();
        this.showSwipeHintsIfNeeded();
    }

    // Utility function to safely create DOM elements with text content
    createSecureElement(tagName, textContent = '', className = '') {
        const element = document.createElement(tagName);
        if (textContent) {
            element.textContent = textContent; // Safe - prevents XSS
        }
        if (className) {
            element.className = className;
        }
        return element;
    }

    // Utility function to safely parse and validate localStorage data
    safeGetFromStorage(key, defaultValue = null, validator = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;
            
            if (validator && !validator(value)) {
                console.warn(`Invalid value for ${key}, using default`);
                return defaultValue;
            }
            
            return value;
        } catch (error) {
            console.warn(`Error reading from localStorage for key ${key}:`, error);
            return defaultValue;
        }
    }

    safeSetToStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`Error writing to localStorage for key ${key}:`, error);
        }
    }

    safeParseJSON(jsonString, defaultValue = null) {
        try {
            const parsed = JSON.parse(jsonString);
            // Validate that favorites is an array with proper structure
            if (Array.isArray(parsed)) {
                return parsed.filter(item => 
                    item && 
                    typeof item.text === 'string' && 
                    typeof item.reference === 'string' &&
                    item.text.length < 1000 && // Reasonable length limits
                    item.reference.length < 100
                );
            }
            return defaultValue;
        } catch (error) {
            console.warn('Error parsing JSON:', error);
            return defaultValue;
        }
    }

    // Utility function to safely set icon content
    setSecureIcon(element, iconName) {
        const icons = {
            play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
            pause: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
            heart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
            settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            'trash-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
            'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
            'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
        };
        element.innerHTML = icons[iconName] || '';
    }

    initializeState() {
        // Load settings from localStorage with validation
        const intervalValidator = (value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 5000 && num <= 60000;
        };
        
        const booleanValidator = (value) => value === 'true' || value === 'false';
        
        const backgroundValidator = (value) => {
            const validBackgrounds = [
                'gradient', 'sunset', 'ocean', 'forest', 'mountain-dawn', 
                'desert-dusk', 'northern-lights', 'spring-bloom', 'midnight-jazz', 
                'golden-hour', 'midnight-frost', 'urban-shadow', 'pearl-dawn', 'cotton-cloud'
            ];
            return validBackgrounds.includes(value);
        };

        const savedInterval = this.safeGetFromStorage('interval', null, intervalValidator);
        const savedTheme = this.safeGetFromStorage('theme', 'light', (value) => value === 'dark' || value === 'light');
        const savedShuffle = this.safeGetFromStorage('shuffle', 'false', booleanValidator);
        const savedBackground = this.safeGetFromStorage('background', 'gradient', backgroundValidator);
        const savedFavoritesString = this.safeGetFromStorage('favorites', '[]');
        const savedHasUsedSwipe = this.safeGetFromStorage('hasUsedSwipe', 'false', booleanValidator);

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

        document.body.setAttribute('data-background', savedBackground);
        this.backgroundSelect.value = savedBackground;

        this.favorites = this.safeParseJSON(savedFavoritesString, []);
        this.updateFavoritesList();
        
        this.hasUsedSwipe = savedHasUsedSwipe === 'true';
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
            this.safeSetToStorage('interval', this.intervalTime);

            if (this.isPlaying) {
                this.restartSlideshow();
            }
        });

        this.themeToggle.addEventListener('change', () => {
            const theme = this.themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            this.safeSetToStorage('theme', theme);
        });

        this.shuffleToggle.addEventListener('change', () => {
            this.isShuffled = this.shuffleToggle.checked;
            this.safeSetToStorage('shuffle', this.isShuffled);

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
            this.safeSetToStorage('background', background);
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
            const quoteCard = document.querySelector('.quote-card');
            // Mark that user has used swipe functionality
            if (!this.hasUsedSwipe) {
                this.hasUsedSwipe = true;
                this.safeSetToStorage('hasUsedSwipe', 'true');
                quoteCard.classList.add('swipe-used');
            }
            
            // Add swipe animation class
            
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
        // Clear existing content safely
        while (this.favoritesList.firstChild) {
            this.favoritesList.removeChild(this.favoritesList.firstChild);
        }
        
        if (this.favoritesCount) {
            this.favoritesCount.textContent = this.favorites.length;
        }

        if (this.favorites.length === 0) {
            const emptyState = this.createSecureElement('div', '', 'favorites-empty-state');
            
            // Create icon element
            const icon = document.createElement('div');
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
            emptyState.appendChild(icon);
            
            // Create text elements
            const title = this.createSecureElement('p', 'No favorites yet');
            const subtitle = this.createSecureElement('span', 'Your favorite quotes will appear here');
            
            emptyState.appendChild(title);
            emptyState.appendChild(subtitle);
            this.favoritesList.appendChild(emptyState);
            
            return;
        }

        this.favorites.forEach((quote, index) => {
            const item = this.createSecureElement('div', quote.reference, 'favorite-item');
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

        this.safeSetToStorage('favorites', JSON.stringify(this.favorites));
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

    displayInitialQuote() {
        if (!this.shuffledQuotes || this.shuffledQuotes.length === 0) {
            if (this.quoteText) this.quoteText.textContent = "No quotes available. Please check the quotes data source.";
            if (this.quoteReference) this.quoteReference.textContent = "";
            return;
        }
        
        if (!this.quoteText || !this.quoteReference) {
            console.error('Quote display elements not found');
            return;
        }
        
        const quote = this.shuffledQuotes[this.currentIndex];
        
        // Set content immediately without fade effect for initial load
        this.quoteText.textContent = quote.text;
        this.quoteReference.textContent = quote.reference;
        this.quoteText.style.opacity = '1';
        this.quoteReference.style.opacity = '1';
        
        if (this.favoriteBtn) {
            this.favoriteBtn.classList.toggle('active', this.isQuoteFavorited(quote));
        }
    }

    displayQuote() {
        if (!this.shuffledQuotes || this.shuffledQuotes.length === 0) {
            if (this.quoteText) this.quoteText.textContent = "No quotes available. Please check the quotes data source.";
            if (this.quoteReference) this.quoteReference.textContent = "";
            return;
        }
        
        if (!this.quoteText || !this.quoteReference) {
            console.error('Quote display elements not found');
            return;
        }
        
        const quote = this.shuffledQuotes[this.currentIndex];

        // Fade out current quote
        this.quoteText.style.opacity = '0';
        this.quoteReference.style.opacity = '0';

        // Wait for fade out to complete before updating content
        setTimeout(() => {
            this.quoteText.textContent = quote.text;
            this.quoteReference.textContent = quote.reference;
            if (this.favoriteBtn) {
                this.favoriteBtn.classList.toggle('active', this.isQuoteFavorited(quote));
            }

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

        // Use secure icon setting
        this.setSecureIcon(this.playPauseBtn, this.isPlaying ? 'pause' : 'play');
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('active');
    }

    clearFavorites() {
        this.favorites = [];
        this.safeSetToStorage('favorites', JSON.stringify(this.favorites));
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
    const app = new BibleQuoteDisplay();
});