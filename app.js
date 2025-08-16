import init, { TypingGame } from './pkg/rust_typing_game.js';

class TypingGameApp {
    constructor() {
        // Game state
        this.game = null;
        this.currentScreen = 'loading-screen';
        this.gameState = 'setup'; // setup, countdown, playing, finished
        this.isTransitioning = false;
        
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
                this.showScreen('welcome-screen', 'fade');
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
                backToWelcome.addEventListener('click', () => this.showScreen('welcome-screen', 'slide', 'backward'));
            }

            // Timer selection
            const timerOptions = document.querySelectorAll('.timer-option');
            timerOptions.forEach(option => {
                option.addEventListener('click', (e) => this.selectTimer(e));
            });

            const backToLanguage = document.getElementById('back-to-language');
            if (backToLanguage) {
                backToLanguage.addEventListener('click', () => this.showScreen('language-screen', 'slide', 'backward'));
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
            const newSessionBtn = document.getElementById('new-session-btn');
            const shareResultsBtn = document.getElementById('share-results-btn');

            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => this.restartGame());
            }
            if (changeSettingsBtn) {
                changeSettingsBtn.addEventListener('click', () => this.changeSettings());
            }
            if (newSessionBtn) {
                newSessionBtn.addEventListener('click', () => this.restartFromBeginning());
            }
            if (shareResultsBtn) {
                shareResultsBtn.addEventListener('click', () => this.shareResults());
            }
        });
    }

    // Enhanced Screen Management with Animations
    showScreen(screenId, transitionType = 'fade', direction = 'forward') {
        // Prevent multiple simultaneous transitions
        if (this.isTransitioning) {
            console.log('Transition already in progress, queuing...');
            setTimeout(() => this.showScreen(screenId, transitionType, direction), 100);
            return;
        }

        const currentScreenElement = document.getElementById(this.currentScreen);
        const targetScreen = document.getElementById(screenId);
        
        if (!targetScreen) {
            console.warn(`Screen "${screenId}" not found`);
            return;
        }

        // If same screen, do nothing
        if (this.currentScreen === screenId) return;

        // Set transition state
        this.isTransitioning = true;

        // Update screen tracking
        const previousScreen = this.currentScreen;
        this.currentScreen = screenId;

        // Perform animated transition
        this.performScreenTransition(currentScreenElement, targetScreen, transitionType, direction);
        
        // Update personalization after transition
        setTimeout(() => {
            this.updatePersonalization();
            this.onScreenTransitionComplete(screenId, previousScreen);
            this.isTransitioning = false;
        }, 100);
    }

    performScreenTransition(currentScreen, targetScreen, transitionType, direction) {
        // Prepare target screen for entry
        targetScreen.classList.remove('hidden', 'exiting');
        targetScreen.classList.add('entering');
        
        // Handle current screen exit
        if (currentScreen && currentScreen !== targetScreen) {
            currentScreen.classList.remove('active');
            currentScreen.classList.add('exiting');
        }

        // Apply transition type specific classes
        this.applyTransitionType(targetScreen, transitionType, direction);

        // Use requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
            // Start entry animation
            targetScreen.classList.remove('entering');
            targetScreen.classList.add('active');
            
            // Complete exit animation for current screen
            if (currentScreen && currentScreen !== targetScreen) {
                setTimeout(() => {
                    currentScreen.classList.remove('exiting', 'active');
                    currentScreen.classList.add('hidden');
                    this.clearTransitionClasses(currentScreen);
                }, 300);
            }
            
            // Clean up transition classes after animation
            setTimeout(() => {
                this.clearTransitionClasses(targetScreen);
            }, 400);
        });
    }

    applyTransitionType(screen, transitionType, direction) {
        // Clear any existing transition classes
        this.clearTransitionClasses(screen);
        
        switch (transitionType) {
            case 'slide':
                if (direction === 'forward') {
                    screen.classList.add('slide-right');
                } else {
                    screen.classList.add('slide-left');
                }
                break;
            case 'scale':
                screen.classList.add('fade-scale');
                break;
            case 'slide-up':
                screen.classList.add('slide-up');
                break;
            case 'slide-down':
                screen.classList.add('slide-down');
                break;
            default:
                // Default fade transition - no additional classes needed
                break;
        }
    }

    clearTransitionClasses(screen) {
        if (!screen) return;
        
        const transitionClasses = [
            'entering', 'exiting', 'slide-left', 'slide-right', 
            'slide-up', 'slide-down', 'fade-scale'
        ];
        
        transitionClasses.forEach(className => {
            screen.classList.remove(className);
        });
    }

    onScreenTransitionComplete(newScreenId, previousScreenId) {
        // Screen-specific initialization logic
        switch (newScreenId) {
            case 'welcome-screen':
                this.focusNameInput();
                break;
            case 'language-screen':
                this.highlightRecommendedLanguage();
                break;
            case 'countdown-screen':
                // Countdown will auto-start via existing logic
                break;
            case 'game-screen':
                this.initializeGameScreen();
                break;
            case 'results-screen':
                this.triggerResultsAnimations();
                break;
        }

        // Track screen flow for analytics/debugging
        this.logScreenTransition(previousScreenId, newScreenId);
    }

    highlightRecommendedLanguage() {
        // Highlight the user's current language or default to English
        const currentLang = this.userData.language || 'en';
        const langOption = document.querySelector(`[data-lang="${currentLang}"]`);
        if (langOption) {
            langOption.classList.add('recommended');
            setTimeout(() => {
                langOption.classList.remove('recommended');
            }, 2000);
        }
    }

    initializeGameScreen() {
        // Ensure typing input is focused and ready
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            setTimeout(() => {
                typingInput.focus();
            }, 100);
        }
    }

    triggerResultsAnimations() {
        // This will work with the existing animateResults method
        setTimeout(() => {
            if (typeof this.animateResults === 'function') {
                this.animateResults();
            }
        }, 200);
    }

    logScreenTransition(from, to) {
        console.log(`Screen transition: ${from} → ${to}`);
        
        // Could be extended to track user flow analytics
        this.screenTransitionHistory = this.screenTransitionHistory || [];
        this.screenTransitionHistory.push({
            from,
            to,
            timestamp: Date.now()
        });
        
        // Keep only last 10 transitions
        if (this.screenTransitionHistory.length > 10) {
            this.screenTransitionHistory = this.screenTransitionHistory.slice(-10);
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
            this.showScreen('language-screen', 'slide', 'forward');
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
            this.showScreen('timer-screen', 'slide', 'forward');
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
        this.showScreen('countdown-screen', 'fade');
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
        this.showScreen('game-screen', 'slide-up');
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
        this.showScreen('times-up-screen', 'scale');
        this.updatePersonalization();
        
        // Transition to results after 3 seconds
        setTimeout(() => {
            this.showResults();
        }, 3000);
    }

    showResults() {
        this.showScreen('results-screen', 'fade');
        this.displayResults();
    }

    displayResults() {
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        const totalTyped = this.game.get_session_total_typed_chars();
        const timeSpent = this.game.get_session_total_time_spent();
        const sentencesCompleted = this.game.get_session_sentences_completed();
        const correctChars = this.game.get_session_total_typed_chars() * (sessionAccuracy / 100);
        
        // Safe values
        const safeWpm = isNaN(sessionWpm) ? 0 : Math.round(sessionWpm);
        const safeAccuracy = isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy);
        
        // Update achievement badge
        this.updateAchievementBadge(safeWpm, safeAccuracy);
        
        // Update main stats with progress bars
        this.updateMainStats(safeWpm, safeAccuracy, totalTyped);
        
        // Update session details
        this.updateSessionDetails(timeSpent, sentencesCompleted, correctChars, safeWpm);
        
        // Update comparison chart
        this.updateComparisonChart(safeWpm);
        
        // Update date
        const resultsDate = document.getElementById('results-date');
        if (resultsDate) resultsDate.textContent = new Date().toLocaleDateString();
        
        // Generate enhanced recommendations
        this.generateRecommendations(sessionWpm, sessionAccuracy);
        
        // Save stats
        this.saveSessionStats(sessionWpm, sessionAccuracy, totalTyped);
        
        // Update personalization
        this.updatePersonalization();
        
        // Trigger animations
        setTimeout(() => this.animateResults(), 300);
    }

    updateAchievementBadge(wpm, accuracy) {
        const badgeIcon = document.getElementById('achievement-icon');
        const badgeText = document.getElementById('achievement-text');
        
        if (!badgeIcon || !badgeText) return;
        
        let icon = '🎯';
        let text = 'Well Done!';
        
        if (wpm >= 70 && accuracy >= 95) {
            icon = '🏆';
            text = 'Typing Master!';
        } else if (wpm >= 50 && accuracy >= 90) {
            icon = '⭐';
            text = 'Excellent!';
        } else if (wpm >= 30 && accuracy >= 85) {
            icon = '🚀';
            text = 'Great Job!';
        } else if (accuracy >= 95) {
            icon = '🎯';
            text = 'Perfect Accuracy!';
        } else if (wpm >= 40) {
            icon = '⚡';
            text = 'Speed Demon!';
        } else {
            icon = '💪';
            text = 'Keep Improving!';
        }
        
        badgeIcon.textContent = icon;
        badgeText.textContent = text;
    }

    updateMainStats(wpm, accuracy, totalTyped) {
        // Update values
        const finalWpm = document.getElementById('final-wpm');
        const finalAccuracy = document.getElementById('final-accuracy');
        const totalCharacters = document.getElementById('total-characters');
        
        if (finalWpm) finalWpm.textContent = wpm;
        if (finalAccuracy) finalAccuracy.textContent = `${accuracy}%`;
        if (totalCharacters) totalCharacters.textContent = totalTyped;
        
        // Update progress bars
        this.updateProgressBar('wpm-progress', wpm, 100);
        this.updateProgressBar('accuracy-progress', accuracy, 100);
        this.updateProgressBar('characters-progress', Math.min(totalTyped / 200 * 100, 100), 100);
        
        // Update benchmarks with dynamic comparisons
        this.updateBenchmarks(wpm, accuracy, totalTyped);
    }

    updateProgressBar(elementId, value, max) {
        const progressBar = document.getElementById(elementId);
        if (!progressBar) return;
        
        const percentage = Math.min((value / max) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        
        // Color coding based on performance
        if (elementId === 'wpm-progress') {
            if (value >= 60) {
                progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            } else if (value >= 40) {
                progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }
        } else if (elementId === 'accuracy-progress') {
            if (value >= 95) {
                progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            } else if (value >= 85) {
                progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }
        }
    }

    updateBenchmarks(wpm, accuracy, totalTyped) {
        const wpmBenchmark = document.getElementById('wpm-benchmark');
        const accuracyBenchmark = document.getElementById('accuracy-benchmark');
        const charactersBenchmark = document.getElementById('characters-benchmark');
        
        if (wpmBenchmark) {
            if (wpm >= 50) {
                wpmBenchmark.textContent = '🏆 Above professional level!';
            } else if (wpm >= 40) {
                wpmBenchmark.textContent = '⭐ Above average (40 WPM)';
            } else if (wpm >= 25) {
                wpmBenchmark.textContent = '📈 Average typing speed (25-40 WPM)';
            } else {
                wpmBenchmark.textContent = '🎯 Target: 25+ WPM';
            }
        }
        
        if (accuracyBenchmark) {
            if (accuracy >= 95) {
                accuracyBenchmark.textContent = '🎯 Excellent precision!';
            } else if (accuracy >= 85) {
                accuracyBenchmark.textContent = '👍 Good accuracy, aim for 95%';
            } else {
                accuracyBenchmark.textContent = '📊 Target: 85%+ accuracy';
            }
        }
        
        if (charactersBenchmark) {
            if (totalTyped >= 300) {
                charactersBenchmark.textContent = '🚀 Outstanding effort!';
            } else if (totalTyped >= 150) {
                charactersBenchmark.textContent = '💪 Great practice session!';
            } else {
                charactersBenchmark.textContent = '📝 Every character counts!';
            }
        }
    }

    updateSessionDetails(timeSpent, sentencesCompleted, correctChars, peakWpm) {
        const timeSpentEl = document.getElementById('session-time-spent');
        const sentencesCompletedEl = document.getElementById('sentences-completed');
        const correctCharactersEl = document.getElementById('correct-characters');
        const peakWpmEl = document.getElementById('peak-wpm');
        
        if (timeSpentEl) {
            const minutes = Math.floor(timeSpent / 60);
            const seconds = Math.floor(timeSpent % 60);
            timeSpentEl.textContent = `${minutes}m ${seconds}s`;
        }
        
        if (sentencesCompletedEl) {
            sentencesCompletedEl.textContent = sentencesCompleted;
        }
        
        if (correctCharactersEl) {
            correctCharactersEl.textContent = Math.round(correctChars);
        }
        
        if (peakWpmEl) {
            // For now, use session WPM as peak. In future, could track real-time peak
            peakWpmEl.textContent = peakWpm;
        }
    }

    updateComparisonChart(wpm) {
        const userPosition = document.getElementById('user-position');
        if (!userPosition) return;
        
        // Calculate position on the chart (0-100%)
        let position = 0;
        
        if (wpm <= 25) {
            // Position within beginner range (0-25%)
            position = (wpm / 25) * 25;
        } else if (wpm <= 40) {
            // Position within average range (25-65%)
            position = 25 + ((wpm - 25) / 15) * 40;
        } else if (wpm <= 60) {
            // Position within good range (65-85%)
            position = 65 + ((wpm - 40) / 20) * 20;
        } else {
            // Position within expert range (85-100%)
            position = 85 + Math.min(((wpm - 60) / 40) * 15, 15);
        }
        
        userPosition.style.left = `${Math.min(position, 95)}%`;
    }

    animateResults() {
        // Trigger progressive animations for a more engaging experience
        const elements = [
            '.achievement-badge',
            '.stat-card',
            '.session-stat',
            '.comparison-item',
            '.recommendation-section'
        ];
        
        elements.forEach((selector, index) => {
            const els = document.querySelectorAll(selector);
            els.forEach((el, elIndex) => {
                setTimeout(() => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    el.style.transition = 'all 0.6s ease-out';
                    
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, 50);
                }, (index * 200) + (elIndex * 100));
            });
        });
    }

    // Enhanced Performance Analysis Engine
    analyzePerformance(wpm, accuracy) {
        const analysis = {
            wpm: wpm,
            accuracy: accuracy,
            level: 'Beginner',
            description: '',
            strengths: [],
            improvements: [],
            nextGoals: [],
            practiceAreas: [],
            motivationalMessage: ''
        };

        // Determine performance level
        if (wpm >= 80) {
            analysis.level = 'Master';
            analysis.description = 'You have mastered typing! Your speed is exceptional.';
        } else if (wpm >= 60) {
            analysis.level = 'Expert';
            analysis.description = 'Outstanding typing speed! You type faster than most professionals.';
        } else if (wpm >= 45) {
            analysis.level = 'Advanced';
            analysis.description = 'Excellent typing skills! You\'re in the top tier of typists.';
        } else if (wpm >= 30) {
            analysis.level = 'Intermediate';
            analysis.description = 'Good progress! You\'re developing solid typing skills.';
        } else if (wpm >= 15) {
            analysis.level = 'Developing';
            analysis.description = 'You\'re building typing skills! Keep practicing consistently.';
        } else {
            analysis.level = 'Beginner';
            analysis.description = 'Everyone starts somewhere! Focus on accuracy and proper technique.';
        }

        // Analyze strengths
        if (accuracy >= 98) {
            analysis.strengths.push('🎯 Exceptional accuracy - you make very few mistakes');
        } else if (accuracy >= 95) {
            analysis.strengths.push('✨ Excellent accuracy - very few typing errors');
        } else if (accuracy >= 90) {
            analysis.strengths.push('👌 Good accuracy - making steady progress');
        }

        if (wpm >= 50) {
            analysis.strengths.push('⚡ Fast typing speed - you can type quickly');
        } else if (wpm >= 30) {
            analysis.strengths.push('📈 Decent typing speed - good foundation');
        }

        // Analyze improvement areas
        if (accuracy < 85) {
            analysis.improvements.push('🎯 Accuracy needs improvement - slow down to reduce mistakes');
        } else if (accuracy < 95) {
            analysis.improvements.push('🔍 Focus on precision - aim for 95%+ accuracy');
        }

        if (wpm < 25) {
            analysis.improvements.push('⌨️ Speed development - practice touch typing without looking');
        } else if (wpm < 40) {
            analysis.improvements.push('🚀 Speed building - work on common letter combinations');
        }

        // Set next goals
        if (wpm < 25) {
            analysis.nextGoals.push(`Reach ${Math.ceil(wpm / 5) * 5 + 5} WPM`);
        } else if (wpm < 50) {
            analysis.nextGoals.push(`Achieve ${Math.ceil(wpm / 10) * 10 + 5} WPM`);
        } else {
            analysis.nextGoals.push('Maintain consistent 50+ WPM performance');
        }

        if (accuracy < 95) {
            analysis.nextGoals.push(`Improve accuracy to ${Math.min(95, Math.ceil(accuracy / 5) * 5 + 5)}%`);
        } else {
            analysis.nextGoals.push('Maintain 95%+ accuracy consistently');
        }

        // Practice area recommendations
        if (wpm < 30) {
            analysis.practiceAreas.push('Touch typing fundamentals');
            analysis.practiceAreas.push('Home row key placement');
        } else if (wpm < 50) {
            analysis.practiceAreas.push('Common word patterns');
            analysis.practiceAreas.push('Letter combination drills');
        } else {
            analysis.practiceAreas.push('Advanced text passages');
            analysis.practiceAreas.push('Specialized vocabulary');
        }

        if (accuracy < 90) {
            analysis.practiceAreas.push('Accuracy-focused exercises');
            analysis.practiceAreas.push('Slow, deliberate typing');
        }

        // Language-specific recommendations
        const currentLanguage = this.userData.languageName || 'English';
        if (currentLanguage === 'Español') {
            analysis.practiceAreas.push('Spanish accent characters (ñ, é, í)');
        } else if (currentLanguage === 'Français') {
            analysis.practiceAreas.push('French accent marks (ç, é, à, û)');
        }

        // Motivational message based on performance
        if (wpm >= 60 && accuracy >= 95) {
            analysis.motivationalMessage = '🏆 Outstanding! You have professional-level typing skills. Consider challenging yourself with complex texts or teaching others!';
        } else if (wpm >= 40 && accuracy >= 90) {
            analysis.motivationalMessage = '🌟 Excellent work! You\'re well above average. Keep practicing to reach expert level!';
        } else if (wpm >= 25 && accuracy >= 85) {
            analysis.motivationalMessage = '👍 Good progress! You\'re developing solid skills. Regular practice will take you to the next level.';
        } else if (accuracy >= 90) {
            analysis.motivationalMessage = '🎯 Great accuracy! Now focus on building speed while maintaining your precision.';
        } else if (wpm >= 30) {
            analysis.motivationalMessage = '⚡ Nice speed! Slow down slightly to improve accuracy - precision beats speed when learning.';
        } else {
            analysis.motivationalMessage = '🌱 Keep practicing! Every expert was once a beginner. Focus on proper technique and consistency.';
        }

        return analysis;
    }

    generateRecommendations(wpm, accuracy) {
        const safeWpm = isNaN(wpm) ? 0 : wpm;
        const safeAccuracy = isNaN(accuracy) ? 100 : accuracy;
        
        // Use enhanced recommendation engine
        const analysis = this.analyzePerformance(safeWpm, safeAccuracy);
        
        const levelBadge = document.getElementById('level-badge');
        const levelDesc = document.getElementById('level-description');
        
        if (levelBadge) levelBadge.textContent = analysis.level;
        if (levelDesc) levelDesc.textContent = analysis.description;
        
        // Generate specific recommendations
        this.displayPersonalizedRecommendations(analysis);
    }

    displayPersonalizedRecommendations(analysis) {
        const recommendationsEl = document.getElementById('personalized-recommendations');
        if (!recommendationsEl) return;
        
        // Clear existing content
        recommendationsEl.innerHTML = '';
        
        // Create comprehensive recommendation display
        const sectionsToShow = [
            { title: '💪 Your Strengths', items: analysis.strengths, className: 'strengths-section' },
            { title: '🎯 Areas to Improve', items: analysis.improvements, className: 'improvements-section' },
            { title: '🚀 Next Goals', items: analysis.nextGoals, className: 'goals-section' },
            { title: '📚 Practice Areas', items: analysis.practiceAreas, className: 'practice-section' }
        ];
        
        sectionsToShow.forEach(section => {
            if (section.items.length > 0) {
                const sectionEl = document.createElement('div');
                sectionEl.className = `recommendation-section ${section.className}`;
                
                const titleEl = document.createElement('div');
                titleEl.className = 'rec-section-title';
                titleEl.textContent = section.title;
                sectionEl.appendChild(titleEl);
                
                section.items.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'recommendation-item';
                    
                    // Extract icon and text if it's formatted with icon
                    const iconMatch = item.match(/^([📈⚡🎯✨👌🔍⌨️🚀📚🏆]+)\s*(.+)$/);
                    if (iconMatch) {
                        itemEl.innerHTML = `
                            <div class="rec-icon">${iconMatch[1]}</div>
                            <div class="rec-text">${iconMatch[2]}</div>
                        `;
                    } else {
                        itemEl.innerHTML = `
                            <div class="rec-icon">•</div>
                            <div class="rec-text">${item}</div>
                        `;
                    }
                    sectionEl.appendChild(itemEl);
                });
                
                recommendationsEl.appendChild(sectionEl);
            }
        });
        
        // Add motivational message at the end
        if (analysis.motivationalMessage) {
            const motivationEl = document.createElement('div');
            motivationEl.className = 'motivation-message';
            motivationEl.innerHTML = `
                <div class="motivation-content">
                    ${analysis.motivationalMessage}
                </div>
            `;
            recommendationsEl.appendChild(motivationEl);
        }
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

    // Enhanced Data Persistence System
    saveUserData() {
        try {
            const dataToSave = {
                ...this.userData,
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem('typeMasterUser', JSON.stringify(dataToSave));
            console.log('User data saved successfully');
        } catch (error) {
            console.warn('Failed to save user data:', error);
            this.showNotification('Failed to save data locally');
        }
    }

    loadUserData() {
        try {
            const saved = localStorage.getItem('typeMasterUser');
            if (saved) {
                const parsedData = JSON.parse(saved);
                
                // Validate and migrate data if needed
                const validatedData = this.validateUserData(parsedData);
                this.userData = { ...this.userData, ...validatedData };
                
                console.log('User data loaded successfully:', this.userData);
                return true;
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
            this.clearCorruptedData();
        }
        return false;
    }

    validateUserData(data) {
        // Ensure all required fields exist with defaults
        const defaultUserData = {
            name: '',
            language: 'en',
            languageName: 'English',
            duration: 120,
            stats: [],
            preferences: {
                soundEnabled: true,
                showTimer: true,
                autoAdvance: true,
                keyboardLayout: 'qwerty'
            },
            achievements: [],
            totalSessions: 0,
            bestWpm: 0,
            bestAccuracy: 0,
            firstVisit: new Date().toISOString(),
            version: '1.0'
        };

        // Merge with defaults to ensure all fields exist
        const validatedData = { ...defaultUserData, ...data };
        
        // Validate stats array
        if (!Array.isArray(validatedData.stats)) {
            validatedData.stats = [];
        }
        
        // Validate preferences object
        if (typeof validatedData.preferences !== 'object') {
            validatedData.preferences = defaultUserData.preferences;
        }
        
        // Ensure language is supported
        const supportedLanguages = ['en', 'es', 'fr'];
        if (!supportedLanguages.includes(validatedData.language)) {
            validatedData.language = 'en';
            validatedData.languageName = 'English';
        }
        
        // Validate numeric values
        if (typeof validatedData.duration !== 'number' || validatedData.duration <= 0) {
            validatedData.duration = 120;
        }
        
        return validatedData;
    }

    clearCorruptedData() {
        try {
            localStorage.removeItem('typeMasterUser');
            console.log('Corrupted user data cleared');
        } catch (error) {
            console.warn('Failed to clear corrupted data:', error);
        }
    }

    saveSessionStats(wpm, accuracy, totalTyped) {
        const sessionData = {
            id: Date.now(),
            date: new Date().toISOString(),
            wpm: Math.round(wpm || 0),
            accuracy: Math.round(accuracy || 100),
            totalTyped: totalTyped || 0,
            language: this.userData.language,
            languageName: this.userData.languageName,
            duration: this.userData.duration,
            sentencesCompleted: this.game ? this.game.get_session_sentences_completed() : 0,
            timeSpent: this.game ? this.game.get_session_total_time_spent() : 0
        };
        
        // Add to stats array
        this.userData.stats.push(sessionData);
        
        // Update session counter
        this.userData.totalSessions = (this.userData.totalSessions || 0) + 1;
        
        // Update personal bests
        this.updatePersonalBests(wpm, accuracy);
        
        // Check for achievements
        this.checkAchievements(sessionData);
        
        // Keep only last 50 sessions (increased from 10)
        if (this.userData.stats.length > 50) {
            this.userData.stats = this.userData.stats.slice(-50);
        }
        
        this.saveUserData();
    }

    updatePersonalBests(wpm, accuracy) {
        const safeWpm = Math.round(wpm || 0);
        const safeAccuracy = Math.round(accuracy || 100);
        
        if (safeWpm > (this.userData.bestWpm || 0)) {
            this.userData.bestWpm = safeWpm;
        }
        
        if (safeAccuracy > (this.userData.bestAccuracy || 0)) {
            this.userData.bestAccuracy = safeAccuracy;
        }
    }

    checkAchievements(sessionData) {
        const achievements = this.userData.achievements || [];
        const achievementIds = achievements.map(a => a.id);
        
        // Define available achievements
        const availableAchievements = [
            {
                id: 'first_session',
                name: 'First Steps',
                description: 'Complete your first typing session',
                icon: '🎯',
                condition: () => this.userData.totalSessions === 1
            },
            {
                id: 'wpm_25',
                name: 'Speed Learner',
                description: 'Reach 25 WPM',
                icon: '🚀',
                condition: () => sessionData.wpm >= 25
            },
            {
                id: 'wpm_50',
                name: 'Fast Typer',
                description: 'Reach 50 WPM',
                icon: '⚡',
                condition: () => sessionData.wpm >= 50
            },
            {
                id: 'wpm_70',
                name: 'Typing Expert',
                description: 'Reach 70 WPM',
                icon: '🏆',
                condition: () => sessionData.wpm >= 70
            },
            {
                id: 'accuracy_95',
                name: 'Precision Master',
                description: 'Achieve 95% accuracy',
                icon: '🎯',
                condition: () => sessionData.accuracy >= 95
            },
            {
                id: 'accuracy_98',
                name: 'Perfect Precision',
                description: 'Achieve 98% accuracy',
                icon: '💎',
                condition: () => sessionData.accuracy >= 98
            },
            {
                id: 'session_10',
                name: 'Dedicated Learner',
                description: 'Complete 10 typing sessions',
                icon: '📚',
                condition: () => this.userData.totalSessions >= 10
            },
            {
                id: 'session_25',
                name: 'Typing Enthusiast',
                description: 'Complete 25 typing sessions',
                icon: '🌟',
                condition: () => this.userData.totalSessions >= 25
            },
            {
                id: 'multilingual',
                name: 'Multilingual Typer',
                description: 'Type in different languages',
                icon: '🌍',
                condition: () => {
                    const languages = new Set(this.userData.stats.map(s => s.language));
                    return languages.size >= 2;
                }
            }
        ];
        
        // Check each achievement
        availableAchievements.forEach(achievement => {
            if (!achievementIds.includes(achievement.id) && achievement.condition()) {
                const newAchievement = {
                    ...achievement,
                    unlockedDate: new Date().toISOString()
                };
                delete newAchievement.condition; // Remove function from stored data
                
                this.userData.achievements.push(newAchievement);
                this.showAchievementNotification(newAchievement);
            }
        });
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            z-index: 9999;
            animation: achievementSlideIn 0.5s ease-out;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="font-size: 1.5rem;">${achievement.icon}</div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">Achievement Unlocked!</div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">${achievement.name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">${achievement.description}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'achievementSlideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // User preferences management
    updatePreference(key, value) {
        if (!this.userData.preferences) {
            this.userData.preferences = {};
        }
        
        this.userData.preferences[key] = value;
        this.saveUserData();
        
        console.log(`Preference updated: ${key} = ${value}`);
    }

    getPreference(key, defaultValue = null) {
        return this.userData.preferences?.[key] ?? defaultValue;
    }

    // Stats and analytics
    getTypingStats() {
        const stats = this.userData.stats || [];
        if (stats.length === 0) {
            return {
                totalSessions: 0,
                averageWpm: 0,
                averageAccuracy: 0,
                totalCharactersTyped: 0,
                totalTimeSpent: 0,
                improvementTrend: 'N/A'
            };
        }
        
        const totalSessions = stats.length;
        const averageWpm = stats.reduce((sum, s) => sum + (s.wpm || 0), 0) / totalSessions;
        const averageAccuracy = stats.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalSessions;
        const totalCharactersTyped = stats.reduce((sum, s) => sum + (s.totalTyped || 0), 0);
        const totalTimeSpent = stats.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
        
        // Calculate improvement trend (last 5 vs first 5 sessions)
        let improvementTrend = 'stable';
        if (totalSessions >= 10) {
            const firstFive = stats.slice(0, 5);
            const lastFive = stats.slice(-5);
            
            const firstAvgWpm = firstFive.reduce((sum, s) => sum + (s.wpm || 0), 0) / 5;
            const lastAvgWpm = lastFive.reduce((sum, s) => sum + (s.wpm || 0), 0) / 5;
            
            if (lastAvgWpm > firstAvgWpm + 5) {
                improvementTrend = 'improving';
            } else if (lastAvgWpm < firstAvgWpm - 5) {
                improvementTrend = 'declining';
            }
        }
        
        return {
            totalSessions,
            averageWpm: Math.round(averageWpm),
            averageAccuracy: Math.round(averageAccuracy),
            totalCharactersTyped,
            totalTimeSpent: Math.round(totalTimeSpent),
            improvementTrend,
            bestWpm: this.userData.bestWpm || 0,
            bestAccuracy: this.userData.bestAccuracy || 0
        };
    }

    // Data export functionality
    exportUserData() {
        try {
            const exportData = {
                userData: this.userData,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `type-master-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Data exported successfully!');
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showNotification('Failed to export data');
        }
    }

    // Data import functionality
    importUserData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.userData) {
                    const validatedData = this.validateUserData(importData.userData);
                    this.userData = validatedData;
                    this.saveUserData();
                    this.showNotification('Data imported successfully!');
                    
                    // Refresh display
                    this.updatePersonalization();
                } else {
                    this.showNotification('Invalid data format');
                }
            } catch (error) {
                console.error('Failed to import data:', error);
                this.showNotification('Failed to import data');
            }
        };
        reader.readAsText(file);
    }

    // Clear all user data
    clearAllUserData() {
        if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
            try {
                localStorage.removeItem('typeMasterUser');
                
                // Reset to defaults
                this.userData = {
                    name: '',
                    language: 'en',
                    languageName: 'English',
                    duration: 120,
                    stats: []
                };
                
                this.showNotification('All data cleared successfully');
                console.log('All user data cleared');
            } catch (error) {
                console.error('Failed to clear user data:', error);
                this.showNotification('Failed to clear data');
            }
        }
    }

    // Action Handlers
    restartGame() {
        // Play again with same settings - go directly to countdown
        this.gameState = 'setup';
        this.clearTimer();
        this.startCountdown();
    }

    changeSettings() {
        // Change settings - go back to language selection to allow modifications
        this.gameState = 'setup';
        this.clearTimer();
        this.showScreen('language-screen', 'slide', 'backward');
    }

    restartFromBeginning() {
        // Complete restart - go back to welcome screen
        this.gameState = 'setup';
        this.clearTimer();
        this.showScreen('welcome-screen', 'fade');
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