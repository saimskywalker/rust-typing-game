import init, { TypingApp } from './pkg/rust_typing_game.js';

let app = null;
let monitor = null;
let gameStartTime = null;

async function initializeApp() {
    try {
        await init();
        app = new TypingApp();
        app.initialize();
        
        // Initialize monitoring
        if (window.typingGameMonitor) {
            monitor = window.typingGameMonitor;
            monitor.trackEvent('app_initialized', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent.substring(0, 50)
            });
        }
        
        console.log('Rust TypingApp loaded successfully');
        setupEventListeners();
        setupMonitoringIntegration();
    } catch (error) {
        console.error('Failed to initialize Rust app:', error);
        if (monitor) {
            monitor.trackError('app_initialization_failed', {
                error: error.message
            });
        }
        showError('Failed to load the typing game. Please refresh the page.');
    }
}

function setupEventListeners() {
    // Welcome screen
    const nameInput = document.getElementById('player-name');
    const continueBtn = document.getElementById('continue-to-language');
    
    if (nameInput && continueBtn) {
        nameInput.addEventListener('input', (e) => {
            const isValid = app.set_user_name(e.target.value.trim());
            continueBtn.disabled = !isValid;
            
            if (monitor && isValid) {
                monitor.trackUserInteraction('name_entered', 'welcome_screen');
            }
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !continueBtn.disabled) {
                app.proceed_to_language();
            }
        });
        
        continueBtn.addEventListener('click', () => app.proceed_to_language());
    }

    // Language selection
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const langCode = e.currentTarget.dataset.lang;
            const langName = e.currentTarget.dataset.name;
            
            document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            
            if (monitor) {
                monitor.trackLanguageChange(app.current_language, langCode);
                monitor.trackUserInteraction('language_selected', langCode);
            }
            
            app.set_language(langCode, langName);
            setTimeout(() => app.proceed_to_timer(), 500);
        });
    });

    // Timer selection
    document.querySelectorAll('.timer-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const duration = parseInt(e.currentTarget.dataset.duration);
            
            document.querySelectorAll('.timer-option').forEach(opt => opt.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            
            if (monitor) {
                monitor.trackUserInteraction('duration_selected', duration);
                gameStartTime = Date.now();
                monitor.trackGameStart(app.current_language, duration);
            }
            
            app.set_duration(duration);
            setTimeout(() => {
                app.start_countdown();
                startCountdownTimer();
            }, 500);
        });
    });

    // Game screen
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
        typingInput.addEventListener('input', (e) => handleTypingInput(e));
        typingInput.addEventListener('focus', () => app.start_typing());
    }

    // Results screen buttons
    const playAgainBtn = document.getElementById('play-again-btn');
    const changeSettingsBtn = document.getElementById('change-settings-btn');
    const newSessionBtn = document.getElementById('new-session-btn');

    if (playAgainBtn) playAgainBtn.addEventListener('click', () => {
        // Clear countdown timer to prevent stuck countdown
        clearCountdownTimer();
        clearGameTimer();
        // Clear name input and reset form
        resetWelcomeForm();
        // Start new session from welcome screen
        app.new_session();
    });
    if (changeSettingsBtn) changeSettingsBtn.addEventListener('click', () => app.change_settings());
    if (newSessionBtn) newSessionBtn.addEventListener('click', () => app.new_session());

    // Back buttons
    const backToWelcome = document.getElementById('back-to-welcome');
    const backToLanguage = document.getElementById('back-to-language');
    
    if (backToWelcome) backToWelcome.addEventListener('click', () => app.new_session());
    if (backToLanguage) backToLanguage.addEventListener('click', () => app.change_settings());
}

function handleTypingInput(event) {
    if (!app) {
        console.log('App not initialized');
        return;
    }
    
    const typedText = event.target.value;
    console.log('Handling typing input:', typedText);
    
    // Get current sentence length to prevent over-typing
    const currentSentence = app.current_sentence;
    if (typedText.length > currentSentence.length) {
        // Limit input to sentence length and process the trimmed text
        const trimmedText = typedText.substring(0, currentSentence.length);
        event.target.value = trimmedText;
        const result = app.update_typing_progress(trimmedText);
        if (result) {
            updateGameDisplay(trimmedText, result);
        }
        return;
    }
    
    const result = app.update_typing_progress(typedText);
    console.log('Rust result:', result);
    
    if (result) {
        updateGameDisplay(typedText, result);
    } else {
        console.log('No result from Rust function');
    }
}

function updateGameDisplay(typedText, result) {
    // Update character highlighting
    const chars = document.querySelectorAll('#sentence .char');
    let correctCount = 0;
    let incorrectCount = 0;
    
    chars.forEach((char, index) => {
        char.classList.remove('correct', 'incorrect', 'current');
        
        if (index < typedText.length) {
            if (typedText[index] === char.textContent) {
                char.classList.add('correct');
                correctCount++;
            } else {
                char.classList.add('incorrect');
                incorrectCount++;
            }
        } else if (index === typedText.length) {
            char.classList.add('current');
        }
    });
    
    // Show encouraging feedback for good typing (A/B test frequency)
    const frequency = window.abTestConfig?.encouragementFrequency || 10;
    if (correctCount > 0 && correctCount % frequency === 0 && incorrectCount === 0) {
        showMiniEncouragement();
        
        // Track engagement for A/B testing
        if (window.abTesting) {
            window.abTesting.trackEngagement('encouragement_shown', correctCount);
        }
    }
    
    // Update stats display
    updateStatsDisplay(result);
    
    // Handle time expiry (completion is now handled by Rust)
    if (result.time_expired) {
        handleTimeExpired();
    } else if (result.is_complete) {
        // Show completion celebration
        handleSentenceCompletion();
    }
}

function updateStatsDisplay(result) {
    const wpmEl = document.getElementById('wpm');
    const accuracyEl = document.getElementById('accuracy');
    
    if (wpmEl) wpmEl.textContent = Math.round(result.wpm || 0);
    if (accuracyEl) accuracyEl.textContent = `${Math.round(result.accuracy || 100)}%`;
    
    // Don't update timer here - let the game timer handle it
    // The timer is managed by startGameTimer() function
}

function handleSentenceCompletion() {
    console.log('Sentence completed, showing celebration...');
    
    // Track sentence completion
    if (monitor && app) {
        const currentSentence = app.current_sentence;
        const timeTaken = gameStartTime ? Date.now() - gameStartTime : 0;
        monitor.trackSentenceComplete(currentSentence.length, timeTaken, 100); // Assume 100% for completion
    }
    
    // Add celebration animation
    const sentenceEl = document.getElementById('sentence');
    if (sentenceEl) {
        sentenceEl.classList.add('sentence-complete');
        setTimeout(() => {
            sentenceEl.classList.remove('sentence-complete');
        }, 600);
    }
    
    // Show encouraging message
    showEncouragingMessage();
    
    // Add celebration particles
    createCelebrationParticles();
    
    // Clear input immediately for next sentence
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
        console.log('Clearing input and refocusing...');
        typingInput.value = '';
        setTimeout(() => {
            typingInput.focus();
        }, 100);
    }
}

function handleTimeExpired() {
    console.log('Time expired, clearing game timer...');
    // Clear the game timer
    clearGameTimer();
    // Results will be shown directly by Rust code
}

function showError(message) {
    const error = document.createElement('div');
    error.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 20px;
        z-index: 9999;
        font-family: 'Comic Neue', sans-serif;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    `;
    error.textContent = message;
    
    document.body.appendChild(error);
    
    setTimeout(() => error.remove(), 5000);
}

function showEncouragingMessage() {
    const messages = [
        "🌟 Awesome job!",
        "🎉 You're doing great!",
        "✨ Fantastic typing!",
        "🦄 Magical work!",
        "🏆 Super star!",
        "🌈 Amazing progress!",
        "🚀 Keep it up!",
        "💫 Wonderful!"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    const encouragement = document.createElement('div');
    encouragement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #4ecdc4, #96ceb4);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 25px;
        z-index: 10000;
        font-family: 'Fredoka One', cursive;
        font-size: 1.5rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: encouragementPop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: none;
    `;
    encouragement.textContent = message;
    
    // Add animation keyframes
    if (!document.querySelector('#encouragement-styles')) {
        const style = document.createElement('style');
        style.id = 'encouragement-styles';
        style.textContent = `
            @keyframes encouragementPop {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(encouragement);
    
    setTimeout(() => encouragement.remove(), 2000);
}

function createCelebrationParticles() {
    const emojis = ['🌟', '✨', '🎉', '🦄', '🌈', '💫', '⭐'];
    
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            particle.style.cssText = `
                position: fixed;
                top: 20%;
                left: ${20 + Math.random() * 60}%;
                font-size: 2rem;
                z-index: 9999;
                pointer-events: none;
                animation: particleFall ${2 + Math.random() * 2}s ease-out forwards;
            `;
            particle.textContent = emoji;
            
            // Add particle animation
            if (!document.querySelector('#particle-styles')) {
                const style = document.createElement('style');
                style.id = 'particle-styles';
                style.textContent = `
                    @keyframes particleFall {
                        0% { 
                            transform: translateY(0) rotate(0deg) scale(0);
                            opacity: 1;
                        }
                        50% {
                            transform: translateY(200px) rotate(180deg) scale(1);
                            opacity: 1;
                        }
                        100% { 
                            transform: translateY(400px) rotate(360deg) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 4000);
        }, i * 100);
    }
}

function showMiniEncouragement() {
    const miniMessages = ['✨', '🌟', '👍', '💫', '⭐'];
    const message = miniMessages[Math.floor(Math.random() * miniMessages.length)];
    
    const mini = document.createElement('div');
    mini.style.cssText = `
        position: fixed;
        top: 30%;
        right: 10%;
        font-size: 1.5rem;
        z-index: 9999;
        pointer-events: none;
        animation: miniPop 1s ease-out forwards;
    `;
    mini.textContent = message;
    
    // Add mini animation
    if (!document.querySelector('#mini-styles')) {
        const style = document.createElement('style');
        style.id = 'mini-styles';
        style.textContent = `
            @keyframes miniPop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(0); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(mini);
    
    setTimeout(() => mini.remove(), 1000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Countdown management
let countdownInterval = null;
let gameTimerInterval = null;

function startCountdownTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        if (app) {
            app.countdown_tick();
        }
    }, 1000);
}

// Clear countdown when needed
function clearCountdownTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Game timer management
function startGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
    }
    
    gameTimerInterval = setInterval(() => {
        if (app) {
            // Get remaining time from Rust
            const remaining = app.remaining_time;
            updateTimerDisplay(remaining);
            
            // Check if time expired
            if (remaining <= 0) {
                clearGameTimer();
            }
        }
    }, 100); // Update every 100ms for smooth countdown
}

function clearGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
}

// Clear typing input function that Rust can call
function clearTypingInput() {
    console.log('clearTypingInput called from Rust');
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
        typingInput.value = '';
        setTimeout(() => {
            typingInput.focus();
        }, 100);
        console.log('Input cleared and refocused');
    }
}

function updateTimerDisplay(remaining) {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        
        if (minutes > 0) {
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerEl.textContent = `${seconds}s`;
        }
        
        // Visual warnings
        const timerCard = timerEl.closest('.timer-card');
        if (timerCard) {
            timerCard.classList.toggle('timer-warning', remaining <= 10);
            timerCard.classList.toggle('timer-caution', remaining <= 30 && remaining > 10);
        }
    }
}

function setupMonitoringIntegration() {
    if (!monitor) return;
    
    // Track button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn') || e.target.classList.contains('option')) {
            monitor.trackUserInteraction('button_click', e.target.id || e.target.className);
            
            // Track for A/B testing
            if (window.abTesting) {
                window.abTesting.trackButtonClick(e.target.id || e.target.className);
            }
        }
    });
    
    // Track typing activity
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
        let typingStartTime = null;
        
        typingInput.addEventListener('input', () => {
            if (!typingStartTime) {
                typingStartTime = Date.now();
                monitor.trackUserInteraction('typing_started', 'game_screen');
            }
        });
    }
    
    // Track results screen
    const originalShowResults = window.app?.show_results;
    if (originalShowResults) {
        window.app.show_results = function() {
            if (monitor) {
                const results = {
                    wpm: this.session_wpm,
                    accuracy: this.session_accuracy,
                    sentences_completed: 0, // Will be updated from Rust
                    typed_chars: 0 // Will be updated from Rust
                };
                
                monitor.trackGameEnd(results);
                
                // Update dashboard
                if (window.analyticsDashboard) {
                    window.analyticsDashboard.updateSessionData({
                        ...results,
                        duration: gameStartTime ? Date.now() - gameStartTime : 0,
                        timestamp: Date.now()
                    });
                }
            }
            
            return originalShowResults.call(this);
        };
    }
}

// Export for debugging and Rust integration
window.typingApp = app;
window.clearCountdownTimer = clearCountdownTimer;
window.startGameTimer = startGameTimer;
window.clearGameTimer = clearGameTimer;
window.clearTypingInput = clearTypingInput;

// Debug functions
window.testRustConnection = () => {
    if (app) {
        console.log('Testing Rust connection...');
        const result = app.test_connection();
        console.log('Rust response:', result);
        return result;
    } else {
        console.log('App not initialized');
        return 'App not initialized';
    }
};

window.debugTyping = (text) => {
    if (app) {
        console.log('Debug typing with text:', text);
        const result = app.update_typing_progress(text);
        console.log('Debug result:', result);
        return result;
    }
};

// Reset welcome form for new session
function resetWelcomeForm() {
    const nameInput = document.getElementById('player-name');
    const continueBtn = document.getElementById('continue-to-language');
    
    if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
    }
    
    if (continueBtn) {
        continueBtn.disabled = true;
    }
    
    // Clear any selected options
    document.querySelectorAll('.language-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelectorAll('.timer-option').forEach(opt => opt.classList.remove('selected'));
}