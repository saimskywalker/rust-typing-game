import init, { TypingGame } from './pkg/rust_typing_game.js';

class TypingGameApp {
    constructor() {
        // Game state
        this.game = null;
        this.currentScreen = 'welcome-screen';
        this.gameState = 'setup'; // setup, countdown, playing, finished
        
        // User data
        this.userData = {
            name: '',
            language: 'en',
            languageName: 'English',
            duration: 120, // Default 2 minutes
            stats: []
        };
        
        // Game timing
        this.startTime = null;
        this.timerInterval = null;
        this.isGameStarted = false;
        this.countdownInterval = null;
        
        // Initialize after DOM load
        this.initializeEventListeners();
        this.loadUserData();
    }

    async initialize() {
        try {
            this.showScreen('loading-screen');
            
            // Initialize WebAssembly
            await init();
            this.game = new TypingGame();
            
            // Set default timer duration
            this.game.set_timer_duration(this.userData.duration);
            
            // Initialize welcome screen
            setTimeout(() => {
                this.showScreen('welcome-screen');
                this.focusNameInput();
            }, 1000);
            
            console.log('Type Master initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    initializeEventListeners() {
        // Welcome screen
        document.addEventListener('DOMContentLoaded', () => {
            const nameInput = document.getElementById('player-name');
            const continueBtn = document.getElementById('continue-to-language');
            
            if (nameInput && continueBtn) {
                nameInput.addEventListener('input', (e) => this.handleNameInput(e));
                nameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !continueBtn.disabled) {
                        this.proceedToLanguageSelection();
                    }
                });
                continueBtn.addEventListener('click', () => this.proceedToLanguageSelection());
            }

            // Language selection
            const languageOptions = document.querySelectorAll('.language-option');
            languageOptions.forEach(option => {
                option.addEventListener('click', (e) => this.selectLanguage(e));
            });

            const backToWelcome = document.getElementById('back-to-welcome');
            if (backToWelcome) {
                backToWelcome.addEventListener('click', () => this.showScreen('welcome-screen'));
            }

            // Timer selection
            const timerOptions = document.querySelectorAll('.timer-option');
            timerOptions.forEach(option => {
                option.addEventListener('click', (e) => this.selectTimer(e));
            });

            const backToLanguage = document.getElementById('back-to-language');
            if (backToLanguage) {
                backToLanguage.addEventListener('click', () => this.showScreen('language-screen'));
            }

            // Game screen
            const typingInput = document.getElementById('typing-input');
            if (typingInput) {
                typingInput.addEventListener('input', (e) => this.handleInput(e));
                typingInput.addEventListener('focus', () => this.startGame());
                typingInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
            }

            // Results screen
            const playAgainBtn = document.getElementById('play-again-btn');
            const changeSettingsBtn = document.getElementById('change-settings-btn');
            const shareResultsBtn = document.getElementById('share-results-btn');

            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => this.restartGame());
            }
            if (changeSettingsBtn) {
                changeSettingsBtn.addEventListener('click', () => this.showScreen('welcome-screen'));
            }
            if (shareResultsBtn) {
                shareResultsBtn.addEventListener('click', () => this.shareResults());
            }
        });
    }

    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            this.updatePersonalization();
        }
    }

    updatePersonalization() {
        // Update all name displays
        document.querySelectorAll('[id*="player-name"]').forEach(el => {
            if (this.userData.name) {
                el.textContent = this.userData.name;
            }
        });

        // Update language displays
        document.querySelectorAll('[id*="language"]').forEach(el => {
            if (this.userData.languageName && el.id.includes('display')) {
                el.textContent = this.userData.languageName;
            }
        });

        // Update duration displays
        document.querySelectorAll('[id*="duration"]').forEach(el => {
            if (el.id.includes('display')) {
                el.textContent = this.formatDuration(this.userData.duration);
            }
        });
    }

    // Welcome Screen Handlers
    handleNameInput(event) {
        const name = event.target.value.trim();
        const continueBtn = document.getElementById('continue-to-language');
        
        if (continueBtn) {
            continueBtn.disabled = name.length < 2;
        }
        
        this.userData.name = name;
    }

    focusNameInput() {
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            if (this.userData.name) {
                nameInput.value = this.userData.name;
                const continueBtn = document.getElementById('continue-to-language');
                if (continueBtn) {
                    continueBtn.disabled = false;
                }
            }
            nameInput.focus();
        }
    }

    proceedToLanguageSelection() {
        if (this.userData.name.length >= 2) {
            this.saveUserData();
            this.showScreen('language-screen');
        }
    }

    // Language Selection Handlers
    selectLanguage(event) {
        const option = event.currentTarget;
        const langCode = option.dataset.lang;
        const langName = option.dataset.name;
        
        // Update selection visual state
        document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update user data
        this.userData.language = langCode;
        this.userData.languageName = langName;
        
        // Update language in Rust game object
        if (this.game) {
            this.game.set_language(langCode);
        }
        
        // Auto-proceed to timer selection after brief delay
        setTimeout(() => {
            this.showScreen('timer-screen');
        }, 500);
    }

    // Timer Selection Handlers
    selectTimer(event) {
        const option = event.currentTarget;
        const duration = parseInt(option.dataset.duration);
        
        // Update selection visual state
        document.querySelectorAll('.timer-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update user data
        this.userData.duration = duration;
        
        // Auto-proceed to countdown after brief delay
        setTimeout(() => {
            this.startCountdown();
        }, 500);
    }

    // Countdown Screen
    startCountdown() {
        this.showScreen('countdown-screen');
        this.updatePersonalization();
        
        const messages = [
            `Get ready, ${this.userData.name}! Position your fingers on the home row...`,
            "Take a deep breath and relax your shoulders...", 
            "Focus on accuracy over speed for better results...",
            "Remember: steady rhythm beats rushed typing!",
            "GO! Start typing and show your skills!"
        ];
        
        let count = 5;
        const countdownNumber = document.getElementById('countdown-number');
        const countdownText = document.getElementById('countdown-text');
        const countdownCircle = document.querySelector('.countdown-circle');
        const countdownContainer = document.querySelector('.countdown-container');
        
        // Reset any existing animations
        if (countdownCircle) {
            countdownCircle.classList.remove('pulse', 'final');
        }
        if (countdownNumber) {
            countdownNumber.classList.remove('pop', 'shake');
        }
        if (countdownContainer) {
            countdownContainer.classList.remove('go-animation');
        }
        
        this.countdownInterval = setInterval(() => {
            if (countdownNumber) {
                countdownNumber.textContent = count;
                
                // Remove previous animation classes
                countdownNumber.classList.remove('pop', 'shake');
                countdownCircle?.classList.remove('pulse');
                
                // Add appropriate animations based on count
                if (count > 0) {
                    // Number pop animation
                    setTimeout(() => {
                        countdownNumber.classList.add('pop');
                    }, 50);
                    
                    // Circle pulse animation
                    setTimeout(() => {
                        countdownCircle?.classList.add('pulse');
                    }, 100);
                    
                    // Shake effect for final numbers
                    if (count <= 2) {
                        setTimeout(() => {
                            countdownNumber.classList.add('shake');
                        }, 300);
                    }
                }
            }
            
            if (countdownText) {
                // Clear existing message
                countdownText.style.opacity = '0';
                countdownText.style.transform = 'translateY(20px)';
                
                // Update message with fade in
                setTimeout(() => {
                    countdownText.textContent = messages[5 - count];
                    countdownText.style.opacity = '1';
                    countdownText.style.transform = 'translateY(0)';
                    countdownText.style.transition = 'all 0.3s ease-out';
                }, 200);
            }
            
            if (count === 0) {
                clearInterval(this.countdownInterval);
                
                // Special "GO!" animation
                if (countdownContainer) {
                    countdownContainer.classList.add('go-animation');
                }
                
                // Start the game after the final animation
                setTimeout(() => {
                    this.startTypingGame();
                }, 1000);
            }
            count--;
        }, 1000);
    }

    // Game Screen
    startTypingGame() {
        this.showScreen('game-screen');
        this.initializeGame();
        
        // Focus typing input
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.focus();
            typingInput.value = '';
        }
    }

    initializeGame() {
        if (!this.game) return;
        
        // Set language and timer duration
        this.game.set_language(this.userData.language);
        this.game.set_timer_duration(this.userData.duration);
        
        // Load first sentence
        const sentence = this.game.get_random_sentence();
        this.displaySentence(sentence);
        
        // Update game meta info
        this.updateGameHeader();
        
        // Reset stats display
        this.updateStatsDisplay(0, 100, this.userData.duration);
        
        this.gameState = 'ready';
    }

    updateGameHeader() {
        const gameLanguage = document.getElementById('game-language');
        const gameDuration = document.getElementById('game-duration');
        const playerNameGame = document.getElementById('player-name-game');
        
        if (gameLanguage) gameLanguage.textContent = this.userData.languageName;
        if (gameDuration) gameDuration.textContent = this.formatDuration(this.userData.duration);
        if (playerNameGame) playerNameGame.textContent = this.userData.name;
    }

    displaySentence(sentence) {
        const sentenceEl = document.getElementById('sentence');
        if (!sentenceEl) return;
        
        sentenceEl.innerHTML = '';
        
        for (let i = 0; i < sentence.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.textContent = sentence[i];
            charSpan.classList.add('char');
            charSpan.dataset.index = i;
            sentenceEl.appendChild(charSpan);
        }
    }

    startGame() {
        if (!this.game || this.isGameStarted || this.gameState !== 'ready') return;
        
        this.game.start_game();
        this.isGameStarted = true;
        this.startTime = Date.now();
        this.gameState = 'playing';
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.game && this.game.is_game_active()) {
                const remainingTime = this.game.get_remaining_time();
                this.updateTimerDisplay(remainingTime);

                // Check if time expired
                if (this.game.is_time_expired() && this.isGameStarted) {
                    this.handleTimeExpired();
                }
            }
        }, 100);
    }

    updateTimerDisplay(remainingTime) {
        const timerEl = document.getElementById('timer');
        if (!timerEl) return;
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        
        if (minutes > 0) {
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerEl.textContent = `${seconds}s`;
        }

        // Add visual warnings
        const timerCard = timerEl.closest('.timer-card');
        if (timerCard) {
            timerCard.classList.toggle('timer-warning', remainingTime <= 10);
            timerCard.classList.toggle('timer-caution', remainingTime <= 30 && remainingTime > 10);
        }
    }

    handleKeyDown(event) {
        // Allow typing during gameplay, block editing keys
        if (this.gameState === 'playing') {
            const blockedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
            
            if (blockedKeys.includes(event.key)) {
                event.preventDefault();
                // Could add a visual warning here
                return false;
            }
        }
    }

    handleInput(event) {
        if (!this.game || this.gameState !== 'playing') return;
        
        const typedText = event.target.value;
        const currentSentence = this.game.get_current_sentence();
        
        // Prevent typing beyond sentence length
        if (typedText.length > currentSentence.length) {
            const truncatedText = typedText.substring(0, currentSentence.length);
            event.target.value = truncatedText;
            this.handleSentenceCompletion();
            return;
        }
        
        // Start game on first character
        if (!this.isGameStarted && typedText.length > 0) {
            this.startGame();
        }
        
        // Update game state
        const result = this.game.update_progress(typedText);
        
        if (result) {
            this.updateDisplay(typedText, result);
            
            // Check for completion or time expiry
            if (result.time_expired === 1) {
                this.handleTimeExpired();
            } else if (result.sentence_complete === 1 || typedText.length === currentSentence.length) {
                this.handleSentenceCompletion();
            }
        }
    }

    updateDisplay(typedText, result) {
        // Update character highlighting
        const chars = document.querySelectorAll('#sentence .char');
        
        chars.forEach((char, index) => {
            char.classList.remove('correct', 'incorrect', 'current');
            
            if (index < typedText.length) {
                if (typedText[index] === char.textContent) {
                    char.classList.add('correct');
                } else {
                    char.classList.add('incorrect');
                }
            } else if (index === typedText.length) {
                char.classList.add('current');
            }
        });
        
        // Update stats
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        const remainingTime = this.game.get_remaining_time();
        
        this.updateStatsDisplay(
            isNaN(sessionWpm) ? 0 : Math.round(sessionWpm),
            isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy),
            remainingTime
        );
    }

    updateStatsDisplay(wpm, accuracy, time) {
        const wpmEl = document.getElementById('wpm');
        const accuracyEl = document.getElementById('accuracy');
        
        if (wpmEl) wpmEl.textContent = wpm;
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    }

    handleSentenceCompletion() {
        if (this.game && this.game.is_game_active()) {
            this.game.end_game();
        }
        
        // Brief visual feedback
        const sentenceEl = document.getElementById('sentence');
        if (sentenceEl) {
            sentenceEl.classList.add('sentence-complete');
            setTimeout(() => {
                sentenceEl.classList.remove('sentence-complete');
            }, 300);
        }
        
        // Auto-progress to new sentence
        setTimeout(() => {
            if (this.game && !this.game.is_time_expired()) {
                const typingInput = document.getElementById('typing-input');
                if (typingInput) {
                    typingInput.value = '';
                }
                
                const newSentence = this.game.get_random_sentence();
                this.displaySentence(newSentence);
                this.resetGameStateForContinue();
            }
        }, 200);
    }

    resetGameStateForContinue() {
        if (!this.game) return;
        
        this.game.reset_game();
        this.isGameStarted = false;
        this.gameState = 'ready';
        this.startTime = null;
    }

    handleTimeExpired() {
        this.isGameStarted = false;
        this.gameState = 'finished';
        this.clearTimer();
        
        // Show time's up screen first
        this.showTimesUpScreen();
    }

    showTimesUpScreen() {
        this.showScreen('times-up-screen');
        this.updatePersonalization();
        
        // Transition to results after 3 seconds
        setTimeout(() => {
            this.showResults();
        }, 3000);
    }

    showResults() {
        this.showScreen('results-screen');
        this.displayResults();
    }

    displayResults() {
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        const totalTyped = this.game.get_session_total_typed_chars();
        
        // Update result displays
        const finalWpm = document.getElementById('final-wpm');
        const finalAccuracy = document.getElementById('final-accuracy');
        const totalCharacters = document.getElementById('total-characters');
        const resultsDate = document.getElementById('results-date');
        
        if (finalWpm) finalWpm.textContent = isNaN(sessionWpm) ? 0 : Math.round(sessionWpm);
        if (finalAccuracy) finalAccuracy.textContent = `${isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy)}%`;
        if (totalCharacters) totalCharacters.textContent = totalTyped;
        if (resultsDate) resultsDate.textContent = new Date().toLocaleDateString();
        
        // Generate recommendations
        this.generateRecommendations(sessionWpm, sessionAccuracy);
        
        // Save stats
        this.saveSessionStats(sessionWpm, sessionAccuracy, totalTyped);
        
        this.updatePersonalization();
    }

    generateRecommendations(wpm, accuracy) {
        const safeWpm = isNaN(wpm) ? 0 : wpm;
        const safeAccuracy = isNaN(accuracy) ? 100 : accuracy;
        
        // Determine performance level
        let level = 'Beginner';
        let levelDescription = 'Keep practicing to improve!';
        
        if (safeWpm >= 60) {
            level = 'Expert';
            levelDescription = 'Outstanding typing speed!';
        } else if (safeWpm >= 40) {
            level = 'Advanced';
            levelDescription = 'Excellent typing skills!';
        } else if (safeWpm >= 25) {
            level = 'Intermediate';
            levelDescription = 'Good progress on your typing journey!';
        }
        
        const levelBadge = document.getElementById('level-badge');
        const levelDesc = document.getElementById('level-description');
        
        if (levelBadge) levelBadge.textContent = level;
        if (levelDesc) levelDesc.textContent = levelDescription;
        
        // Generate specific recommendations
        this.displayPersonalizedRecommendations(safeWpm, safeAccuracy);
    }

    displayPersonalizedRecommendations(wpm, accuracy) {
        const recommendationsEl = document.getElementById('personalized-recommendations');
        if (!recommendationsEl) return;
        
        const recommendations = [];
        
        if (accuracy < 90) {
            recommendations.push({
                icon: '🎯',
                text: 'Focus on accuracy first. Slow down and aim for 95%+ accuracy before increasing speed.'
            });
        }
        
        if (wpm < 30) {
            recommendations.push({
                icon: '⌨️',
                text: 'Practice touch typing. Try to type without looking at the keyboard.'
            });
        } else if (wpm < 50) {
            recommendations.push({
                icon: '🚀',
                text: 'Great progress! Practice common word patterns to build muscle memory.'
            });
        }
        
        if (wpm >= 50 && accuracy >= 95) {
            recommendations.push({
                icon: '🏆',
                text: 'Excellent work! You have professional-level typing skills.'
            });
        }
        
        // Display recommendations
        recommendationsEl.innerHTML = '';
        recommendations.forEach(rec => {
            const recEl = document.createElement('div');
            recEl.className = 'recommendation-item';
            recEl.innerHTML = `
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-text">${rec.text}</div>
            `;
            recommendationsEl.appendChild(recEl);
        });
    }

    // Utility Methods
    formatDuration(seconds) {
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        return `${seconds} seconds`;
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    // Data Persistence
    saveUserData() {
        try {
            localStorage.setItem('typeMasterUser', JSON.stringify(this.userData));
        } catch (error) {
            console.warn('Failed to save user data:', error);
        }
    }

    loadUserData() {
        try {
            const saved = localStorage.getItem('typeMasterUser');
            if (saved) {
                const parsedData = JSON.parse(saved);
                this.userData = { ...this.userData, ...parsedData };
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    }

    saveSessionStats(wpm, accuracy, totalTyped) {
        const sessionData = {
            date: new Date().toISOString(),
            wpm: Math.round(wpm || 0),
            accuracy: Math.round(accuracy || 100),
            totalTyped,
            language: this.userData.language,
            duration: this.userData.duration
        };
        
        this.userData.stats.push(sessionData);
        
        // Keep only last 10 sessions
        if (this.userData.stats.length > 10) {
            this.userData.stats = this.userData.stats.slice(-10);
        }
        
        this.saveUserData();
    }

    // Action Handlers
    restartGame() {
        this.gameState = 'setup';
        this.clearTimer();
        this.startCountdown();
    }

    shareResults() {
        const wpm = document.getElementById('final-wpm')?.textContent || '0';
        const accuracy = document.getElementById('final-accuracy')?.textContent || '100%';
        
        const shareText = `I just typed ${wpm} WPM with ${accuracy} accuracy on Type Master! 🚀⚡\n\nTest your typing speed: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Type Master Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Results copied to clipboard!');
            });
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 9999;
            animation: fadeInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-notification';
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 9999;
            animation: fadeInRight 0.3s ease-out;
        `;
        error.textContent = message;
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.remove();
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    const app = new TypingGameApp();
    await app.initialize();
    
    // Make app globally accessible for debugging
    window.typeMasterApp = app;
});

// Export for debugging
window.TypingGameApp = TypingGameApp;