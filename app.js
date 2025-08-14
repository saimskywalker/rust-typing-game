import init, { TypingGame } from './pkg/rust_typing_game.js';

class TypingGameUI {
    constructor() {
        this.game = null;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameStarted = false;
        this.autoContinueTimeout = null;
        this.autoContinueInterval = null;
        
        // DOM elements
        this.sentenceEl = document.getElementById('sentence');
        this.inputEl = document.getElementById('typing-input');
        this.wpmEl = document.getElementById('wpm');
        this.accuracyEl = document.getElementById('accuracy');
        this.timerEl = document.getElementById('timer');
        this.newSentenceBtn = document.getElementById('new-sentence-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.newSessionBtn = document.getElementById('new-session-btn');
        this.resultsEl = document.getElementById('results');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.loadingEl = document.getElementById('loading');
        
        // Result elements
        this.finalWpmEl = document.getElementById('final-wpm');
        this.finalAccuracyEl = document.getElementById('final-accuracy');
        this.finalTimeEl = document.getElementById('final-time');
        this.recommendationEl = document.getElementById('recommendation');
        this.continueBtn = document.getElementById('continue-btn');
        this.resultsTitleEl = document.getElementById('results-title');
        this.timerSelect = document.getElementById('timer-select');
        this.autoContinueInfo = document.getElementById('auto-continue-info');
        this.autoContinueCountdown = document.getElementById('auto-continue-countdown');
        this.progressFill = document.getElementById('progress-fill');
        
        this.initializeEventListeners();
    }

    async initialize() {
        try {
            // Initialize WebAssembly
            await init();
            this.game = new TypingGame();
            
            // Set default timer duration (60 seconds)
            this.game.set_timer_duration(60.0);
            
            // Hide loading screen
            this.loadingEl.classList.add('hidden');
            
            // Load first sentence
            this.newSentence();
            
            console.log('Typing game initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    setTimerDuration(seconds) {
        if (this.game) {
            this.game.set_timer_duration(seconds);
            // Update display if game is not active
            if (!this.isGameStarted) {
                const minutes = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                if (minutes > 0) {
                    this.timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
                } else {
                    this.timerEl.textContent = `${secs}s`;
                }
            }
        }
    }

    initializeEventListeners() {
        // Input handling
        this.inputEl.addEventListener('input', (e) => this.handleInput(e));
        this.inputEl.addEventListener('focus', () => this.startGame());
        
        // Button handlers
        this.newSentenceBtn.addEventListener('click', () => this.newSentence());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.newSessionBtn.addEventListener('click', () => this.newSession());
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.continueBtn.addEventListener('click', () => this.continueTyping());
        
        // Timer select handler
        this.timerSelect.addEventListener('change', (e) => {
            const seconds = parseInt(e.target.value);
            this.setTimerDuration(seconds);
        });
        
        // Prevent context menu on input
        this.inputEl.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Focus input when clicking anywhere on text display
        document.querySelector('.text-display').addEventListener('click', () => {
            this.inputEl.focus();
        });
    }

    newSentence() {
        if (!this.game) return;
        
        const sentence = this.game.get_random_sentence();
        this.displaySentence(sentence);
        this.resetGame();
        this.inputEl.focus();
    }

    displaySentence(sentence) {
        this.sentenceEl.innerHTML = '';
        
        for (let i = 0; i < sentence.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.textContent = sentence[i];
            charSpan.classList.add('char');
            charSpan.dataset.index = i;
            this.sentenceEl.appendChild(charSpan);
        }
    }

    startGame() {
        if (!this.game || this.isGameStarted) return;
        
        this.game.start_game();
        this.isGameStarted = true;
        this.startTime = Date.now();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.game && this.game.is_game_active()) {
                const remainingTime = this.game.get_remaining_time();
                const minutes = Math.floor(remainingTime / 60);
                const seconds = Math.floor(remainingTime % 60);
                
                // Format as MM:SS or just SS if less than 60 seconds
                if (minutes > 0) {
                    this.timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    this.timerEl.textContent = `${seconds}s`;
                }

                // Add visual warning when time is running low
                if (remainingTime <= 10) {
                    this.timerEl.classList.add('timer-warning');
                } else if (remainingTime <= 30) {
                    this.timerEl.classList.add('timer-caution');
                    this.timerEl.classList.remove('timer-warning');
                } else {
                    this.timerEl.classList.remove('timer-warning', 'timer-caution');
                }

                // Check if time expired and auto-stop game
                if (this.game.is_time_expired() && this.isGameStarted) {
                    this.handleTimeExpired();
                }
            }
        }, 100);
    }

    handleTimeExpired() {
        this.isGameStarted = false;
        this.clearTimer();
        
        // Ensure Rust game state is also ended
        if (this.game.is_game_active()) {
            this.game.end_game();
        }
        
        // Get final session stats with NaN protection
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        const completionTime = this.game.get_timer_duration();
        
        // Show final session results with NaN protection
        const finalWpm = isNaN(sessionWpm) ? 0 : Math.round(sessionWpm);
        const finalAccuracy = isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy);
        
        this.finalWpmEl.textContent = finalWpm;
        this.finalAccuracyEl.textContent = `${finalAccuracy}%`;
        this.finalTimeEl.textContent = `${completionTime.toFixed(1)}s`;
        
        // Get and show recommendation
        const recommendation = this.game.get_recommendation();
        this.recommendationEl.textContent = recommendation;
        
        // Update results title for time expiry
        this.resultsTitleEl.textContent = "⏰ Time's Up!";
        
        // Show results modal
        setTimeout(() => {
            this.resultsEl.classList.remove('hidden');
            this.resultsEl.classList.add('visible');
        }, 500);

        // Start auto-continue countdown for time expiry (3 seconds)
        this.startAutoContinueCountdown(3000, 'timeout');

        // Disable input
        this.inputEl.disabled = true;
    }

    handleInput(event) {
        if (!this.game) return;
        
        const typedText = event.target.value;
        
        // Start game on first character
        if (!this.isGameStarted && typedText.length > 0) {
            this.startGame();
        }
        
        // Update game state
        const result = this.game.update_progress(typedText);
        
        if (result) {
            this.updateDisplay(typedText, result);
            
            // Check if time expired first (higher priority than completion)
            if (result.time_expired === 1) {
                this.handleTimeExpired();
            }
            // Check if game is complete
            else if (result.is_complete === 1) {
                this.endGame(result);
            }
        }
    }

    updateDisplay(typedText, result) {
        // Update character highlighting
        const chars = this.sentenceEl.querySelectorAll('.char');
        
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
        
        // Update stats with session-wide values and NaN protection
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        
        const safeSessionWpm = isNaN(sessionWpm) ? 0 : Math.round(sessionWpm);
        const safeSessionAccuracy = isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy);
        
        this.wpmEl.textContent = safeSessionWpm;
        this.accuracyEl.textContent = `${safeSessionAccuracy}%`;
        
        // Position cursor
        this.updateCursor(typedText.length);
    }

    updateCursor(position) {
        const cursor = document.getElementById('cursor');
        const chars = this.sentenceEl.querySelectorAll('.char');
        
        if (position < chars.length) {
            const currentChar = chars[position];
            const rect = currentChar.getBoundingClientRect();
            const sentenceRect = this.sentenceEl.getBoundingClientRect();
            
            cursor.style.left = `${rect.left - sentenceRect.left}px`;
            cursor.style.top = `${rect.top - sentenceRect.top}px`;
        } else {
            // Position cursor at the end
            if (chars.length > 0) {
                const lastChar = chars[chars.length - 1];
                const rect = lastChar.getBoundingClientRect();
                const sentenceRect = this.sentenceEl.getBoundingClientRect();
                
                cursor.style.left = `${rect.right - sentenceRect.left}px`;
                cursor.style.top = `${rect.top - sentenceRect.top}px`;
            }
        }
    }

    endGame(result) {
        this.isGameStarted = false;
        this.clearTimer();
        
        // Get completion time from Rust
        const completionTime = this.game.get_completion_time();
        
        // Show session results with NaN protection
        const sessionWpm = this.game.get_session_wpm();
        const sessionAccuracy = this.game.get_session_accuracy();
        
        const finalWpm = isNaN(sessionWpm) ? 0 : Math.round(sessionWpm);
        const finalAccuracy = isNaN(sessionAccuracy) ? 100 : Math.round(sessionAccuracy);
        
        this.finalWpmEl.textContent = finalWpm;
        this.finalAccuracyEl.textContent = `${finalAccuracy}%`;
        this.finalTimeEl.textContent = `${completionTime.toFixed(1)}s`;
        
        // Get and show recommendation
        const recommendation = this.game.get_recommendation();
        this.recommendationEl.textContent = recommendation;
        
        // Update results title based on session performance (with NaN protection)
        const safeWpm = isNaN(sessionWpm) ? 0 : sessionWpm;
        const safeAccuracy = isNaN(sessionAccuracy) ? 0 : sessionAccuracy;
        
        if (safeWpm >= 50 && safeAccuracy >= 95) {
            this.resultsTitleEl.textContent = "🏆 Amazing!";
        } else if (safeWpm >= 40 && safeAccuracy >= 90) {
            this.resultsTitleEl.textContent = "🌟 Great Job!";
        } else if (safeWpm >= 30 && safeAccuracy >= 85) {
            this.resultsTitleEl.textContent = "👍 Well Done!";
        } else if (safeAccuracy >= 90) {
            this.resultsTitleEl.textContent = "🎯 Good Accuracy!";
        } else {
            this.resultsTitleEl.textContent = "📈 Keep Practicing!";
        }
        
        // Show results modal with delay for better UX
        setTimeout(() => {
            this.resultsEl.classList.remove('hidden');
            this.resultsEl.classList.add('visible');
        }, 800);
        
        // Start auto-continue countdown (2.5 seconds)
        this.startAutoContinueCountdown(2500, 'completed');
    }

    resetGame() {
        if (!this.game) return;
        
        this.game.reset_game();
        this.isGameStarted = false;
        this.startTime = null;
        this.clearTimer();
        
        // Reset UI
        this.inputEl.value = '';
        this.inputEl.disabled = false;
        this.wpmEl.textContent = '0';
        this.accuracyEl.textContent = '100%';
        
        // Show initial countdown time and clear warning classes
        const duration = this.game.get_timer_duration();
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        if (minutes > 0) {
            this.timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.timerEl.textContent = `${seconds}s`;
        }
        this.timerEl.classList.remove('timer-warning', 'timer-caution');
        
        // Reset character highlighting
        const chars = this.sentenceEl.querySelectorAll('.char');
        chars.forEach(char => {
            char.classList.remove('correct', 'incorrect', 'current');
        });
        
        // Reset cursor position
        this.updateCursor(0);
        
        // Hide results
        this.resultsEl.classList.remove('visible');
        this.resultsEl.classList.add('hidden');
    }

    playAgain() {
        this.newSentence();
    }

    newSession() {
        if (!this.game) return;
        
        // Show confirmation dialog
        const confirmed = confirm('Start a new session? This will reset all accumulated statistics.');
        if (!confirmed) return;
        
        // Reset session stats in Rust
        this.game.reset_session();
        
        // Reset current game state
        this.resetGame();
        
        // Load new sentence
        this.newSentence();
        
        // Show feedback
        this.showSessionResetFeedback();
    }

    showSessionResetFeedback() {
        // Create feedback message
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'session-reset-feedback';
        feedbackDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--success-color), #059669);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            z-index: 9999;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            animation: slideDown 0.3s ease-out;
        `;
        feedbackDiv.textContent = '🔄 New session started! All stats have been reset.';
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0px);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(feedbackDiv);
        
        // Remove feedback after 3 seconds
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.style.animation = 'slideUp 0.3s ease-out forwards';
                setTimeout(() => {
                    if (feedbackDiv.parentNode) {
                        feedbackDiv.parentNode.removeChild(feedbackDiv);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 300);
            }
        }, 3000);
        
        // Add slideUp animation
        style.textContent += `
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0px);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
    }

    continueTyping() {
        // Clear any active auto-continue countdown
        if (this.autoContinueTimeout) {
            clearTimeout(this.autoContinueTimeout);
            this.autoContinueTimeout = null;
        }
        if (this.autoContinueInterval) {
            clearInterval(this.autoContinueInterval);
            this.autoContinueInterval = null;
        }
        
        // Hide results modal and auto-continue info
        this.resultsEl.classList.remove('visible');
        this.resultsEl.classList.add('hidden');
        this.autoContinueInfo.classList.add('hidden');
        
        // Reset progress bar
        this.progressFill.style.transition = 'none';
        this.progressFill.style.transform = 'translateX(-100%)';
        
        // Generate new sentence and continue
        const newSentence = this.game.get_random_sentence();
        this.displaySentence(newSentence);
        this.resetGameState();
        this.inputEl.focus();
    }

    startAutoContinueCountdown(duration, reason) {
        // Clear any existing countdown
        if (this.autoContinueTimeout) {
            clearTimeout(this.autoContinueTimeout);
        }
        if (this.autoContinueInterval) {
            clearInterval(this.autoContinueInterval);
        }
        
        // Show auto-continue info
        this.autoContinueInfo.classList.remove('hidden');
        
        const totalSeconds = Math.ceil(duration / 1000);
        let remainingSeconds = totalSeconds;
        
        // Update initial countdown display
        this.autoContinueCountdown.textContent = remainingSeconds;
        
        // Set up progress bar animation
        this.progressFill.style.transition = `transform ${duration}ms linear`;
        this.progressFill.style.transform = 'translateX(0%)';
        
        // Update countdown text every second
        this.autoContinueInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds > 0) {
                this.autoContinueCountdown.textContent = remainingSeconds;
            }
        }, 1000);
        
        // Auto-continue after duration
        this.autoContinueTimeout = setTimeout(() => {
            clearInterval(this.autoContinueInterval);
            if (this.resultsEl.classList.contains('visible')) {
                this.continueTyping();
            }
        }, duration);
    }

    resetGameState() {
        // Reset game state without hiding results (for continue functionality)
        if (!this.game) return;
        
        this.game.reset_game();
        this.isGameStarted = false;
        this.startTime = null;
        this.clearTimer();
        
        // Reset UI
        this.inputEl.value = '';
        this.inputEl.disabled = false;
        this.wpmEl.textContent = '0';
        this.accuracyEl.textContent = '100%';
        
        // Show initial countdown time and clear warning classes
        const duration = this.game.get_timer_duration();
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        if (minutes > 0) {
            this.timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this.timerEl.textContent = `${seconds}s`;
        }
        this.timerEl.classList.remove('timer-warning', 'timer-caution');
        
        // Reset character highlighting
        const chars = this.sentenceEl.querySelectorAll('.char');
        chars.forEach(char => {
            char.classList.remove('correct', 'incorrect', 'current');
        });
        
        // Reset cursor position
        this.updateCursor(0);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const gameUI = new TypingGameUI();
    await gameUI.initialize();
    
    // Make gameUI globally accessible for debugging
    window.gameUI = gameUI;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any running timers when tab becomes inactive
        console.log('Tab became inactive');
    } else {
        // Resume when tab becomes active
        console.log('Tab became active');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to reset
    if (e.key === 'Escape') {
        const gameUI = window.gameUI;
        if (gameUI) {
            gameUI.resetGame();
        }
    }
    
    // Ctrl/Cmd + Enter for new sentence
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const gameUI = window.gameUI;
        if (gameUI) {
            gameUI.newSentence();
        }
    }
});

// Export for global access (for debugging)
window.TypingGameUI = TypingGameUI;

// Debug functions for testing (only available in console)
window.testAutoStop = function(seconds = 3) {
    const gameUI = window.gameUI;
    if (gameUI && gameUI.game) {
        console.log(`Testing auto-stop with ${seconds} second timer...`);
        gameUI.setTimerDuration(seconds);
        gameUI.resetGame();
        console.log('Start typing to test the auto-stop functionality!');
    } else {
        console.log('Game not initialized yet');
    }
};

window.debugWPM = function() {
    const gameUI = window.gameUI;
    if (gameUI && gameUI.game) {
        const wpm = gameUI.game.get_wpm();
        const accuracy = gameUI.game.get_accuracy();
        const typedChars = gameUI.inputEl.value.length;
        const isActive = gameUI.game.is_game_active();
        
        console.log('WPM Debug Info:');
        console.log(`- Typed characters: ${typedChars}`);
        console.log(`- Game active: ${isActive}`);
        console.log(`- Current WPM: ${wpm} ${isNaN(wpm) ? '(NaN detected!)' : ''}`);
        console.log(`- Current Accuracy: ${accuracy}% ${isNaN(accuracy) ? '(NaN detected!)' : ''}`);
    } else {
        console.log('Game not initialized yet');
    }
};

window.debugAccuracy = function() {
    const gameUI = window.gameUI;
    if (gameUI && gameUI.game) {
        const accuracy = gameUI.game.get_accuracy();
        const typedChars = gameUI.inputEl.value.length;
        const isActive = gameUI.game.is_game_active();
        
        console.log('Accuracy Debug Info:');
        console.log(`- Typed characters: ${typedChars}`);
        console.log(`- Game active: ${isActive}`);
        console.log(`- Current Accuracy: ${accuracy}% ${isNaN(accuracy) ? '(NaN detected!)' : ''}`);
        console.log(`- JavaScript NaN check: ${isNaN(accuracy)}`);
        
        // Test different scenarios
        console.log('--- Edge Case Tests ---');
        if (typedChars === 0) {
            console.log('✅ Zero characters: Should show 100% accuracy');
        } else {
            console.log(`📝 ${typedChars} characters typed - testing calculation`);
        }
    } else {
        console.log('Game not initialized yet');
    }
};

window.debugSession = function() {
    const gameUI = window.gameUI;
    if (gameUI && gameUI.game) {
        const sessionWpm = gameUI.game.get_session_wpm();
        const sessionAccuracy = gameUI.game.get_session_accuracy();
        const sessionSentences = gameUI.game.get_session_sentences_completed();
        const sessionTypedChars = gameUI.game.get_session_total_typed_chars();
        const sessionTimeSpent = gameUI.game.get_session_total_time_spent();
        
        console.log('Session Stats Debug Info:');
        console.log(`- Session WPM: ${sessionWpm} ${isNaN(sessionWpm) ? '(NaN detected!)' : ''}`);
        console.log(`- Session Accuracy: ${sessionAccuracy}% ${isNaN(sessionAccuracy) ? '(NaN detected!)' : ''}`);
        console.log(`- Sentences Completed: ${sessionSentences}`);
        console.log(`- Total Typed Characters: ${sessionTypedChars}`);
        console.log(`- Total Time Spent: ${sessionTimeSpent.toFixed(2)} seconds`);
        
        // Current sentence stats for comparison
        const currentTypedChars = gameUI.inputEl.value.length;
        console.log('--- Current vs Session Comparison ---');
        console.log(`- Current sentence typed: ${currentTypedChars} chars`);
        console.log(`- Session total typed: ${sessionTypedChars} chars`);
    } else {
        console.log('Game not initialized yet');
    }
};

window.debugSessionReset = function() {
    const gameUI = window.gameUI;
    if (gameUI && gameUI.game) {
        console.log('Session Reset Debug Info:');
        
        // Get session stats before reset
        const beforeWpm = gameUI.game.get_session_wpm();
        const beforeAccuracy = gameUI.game.get_session_accuracy();
        const beforeSentences = gameUI.game.get_session_sentences_completed();
        const beforeTypedChars = gameUI.game.get_session_total_typed_chars();
        
        console.log('--- Before Reset ---');
        console.log(`Session WPM: ${beforeWpm}`);
        console.log(`Session Accuracy: ${beforeAccuracy}%`);
        console.log(`Sentences Completed: ${beforeSentences}`);
        console.log(`Total Typed Characters: ${beforeTypedChars}`);
        
        // Reset session
        gameUI.game.reset_session();
        
        // Get stats after reset
        const afterWpm = gameUI.game.get_session_wpm();
        const afterAccuracy = gameUI.game.get_session_accuracy();
        const afterSentences = gameUI.game.get_session_sentences_completed();
        const afterTypedChars = gameUI.game.get_session_total_typed_chars();
        
        console.log('--- After Reset ---');
        console.log(`Session WPM: ${afterWpm}`);
        console.log(`Session Accuracy: ${afterAccuracy}%`);
        console.log(`Sentences Completed: ${afterSentences}`);
        console.log(`Total Typed Characters: ${afterTypedChars}`);
        
        console.log('✅ Session reset test completed!');
    } else {
        console.log('Game not initialized yet');
    }
};