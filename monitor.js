/**
 * Story Typer - Monitoring & Analytics System
 * Privacy-focused monitoring for Indonesian children's typing practice
 */

class TypingGameMonitor {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.isEnabled = this.checkPrivacyConsent();
        this.batchSize = 10;
        this.sendInterval = 30000; // 30 seconds
        
        if (this.isEnabled) {
            this.initializeMonitoring();
        }
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    checkPrivacyConsent() {
        // For children's apps, we use minimal, privacy-safe monitoring
        // Only track aggregated, anonymous usage patterns
        return localStorage.getItem('typing_game_analytics_consent') !== 'false';
    }

    initializeMonitoring() {
        this.trackPageLoad();
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.startBatchSending();
        
        console.log('🔍 Story Typer monitoring initialized (Privacy-safe mode)');
    }

    // === PRIVACY-SAFE EVENT TRACKING ===
    
    trackEvent(eventType, data = {}) {
        if (!this.isEnabled) return;

        const event = {
            id: this.generateEventId(),
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            data: this.sanitizeData(data)
        };

        this.events.push(event);
        console.log('📊 Event tracked:', eventType, data);

        // Send immediately for critical events
        if (this.isCriticalEvent(eventType)) {
            this.sendEvents();
        }
    }

    sanitizeData(data) {
        // Remove any potentially identifying information
        const sanitized = { ...data };
        
        // Remove or hash personal data
        if (sanitized.userName) {
            delete sanitized.userName; // Never store actual names
        }
        
        if (sanitized.userInput) {
            delete sanitized.userInput; // Never store what children type
        }

        return sanitized;
    }

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    isCriticalEvent(eventType) {
        return ['error', 'crash', 'performance_issue'].includes(eventType);
    }

    // === GAME-SPECIFIC TRACKING ===

    trackGameStart(language, duration) {
        this.trackEvent('game_start', {
            language,
            duration,
            userAgent: navigator.userAgent.substring(0, 50), // Truncated for privacy
            screenSize: `${screen.width}x${screen.height}`,
            timestamp: Date.now()
        });
    }

    trackGameEnd(results) {
        const sessionDuration = Date.now() - this.startTime;
        
        this.trackEvent('game_end', {
            sessionDuration,
            wpm: Math.round(results.wpm || 0),
            accuracy: Math.round(results.accuracy || 0),
            sentencesCompleted: results.sentences_completed || 0,
            charactersTyped: results.typed_chars || 0
        });
    }

    trackSentenceComplete(sentenceLength, timeTaken, accuracy) {
        this.trackEvent('sentence_complete', {
            length: sentenceLength,
            timeTaken: Math.round(timeTaken),
            accuracy: Math.round(accuracy),
            wpm: Math.round((sentenceLength / 5) / (timeTaken / 60000))
        });
    }

    trackLanguageChange(fromLang, toLang) {
        this.trackEvent('language_change', {
            from: fromLang,
            to: toLang
        });
    }

    trackUserInteraction(interactionType, element) {
        this.trackEvent('user_interaction', {
            type: interactionType,
            element: element,
            timestamp: Date.now()
        });
    }

    // === PERFORMANCE MONITORING ===

    setupPerformanceMonitoring() {
        // Monitor WASM loading performance
        const wasmLoadStart = performance.now();
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                this.trackMemoryUsage();
            }, 60000); // Every minute
        }

        // Track page load performance
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.trackEvent('page_load_performance', {
                loadTime: Math.round(loadTime),
                wasmLoadTime: Math.round(loadTime - wasmLoadStart)
            });
        });
    }

    monitorFrameRate() {
        let frames = 0;
        let lastTime = performance.now();

        const countFrames = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frames * 1000 / (currentTime - lastTime));
                
                if (fps < 30) {
                    this.trackEvent('performance_issue', {
                        type: 'low_fps',
                        fps: fps
                    });
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(countFrames);
        };
        
        requestAnimationFrame(countFrames);
    }

    trackMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            
            this.trackEvent('memory_usage', {
                used: usedMB,
                total: totalMB,
                percentage: Math.round((usedMB / totalMB) * 100)
            });
        }
    }

    // === ERROR TRACKING ===

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('promise_rejection', {
                reason: event.reason?.toString() || 'Unknown promise rejection'
            });
        });

        // Monitor WASM errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            if (args.some(arg => String(arg).includes('wasm') || String(arg).includes('rust'))) {
                this.trackError('wasm_error', {
                    message: args.join(' ')
                });
            }
            originalConsoleError.apply(console, args);
        };
    }

    trackError(errorType, errorData) {
        this.trackEvent('error', {
            errorType,
            ...errorData,
            userAgent: navigator.userAgent.substring(0, 50),
            url: window.location.href
        });
    }

    // === USAGE ANALYTICS ===

    trackPageLoad() {
        this.trackEvent('page_load', {
            referrer: document.referrer,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        });
    }

    trackUserEngagement() {
        let lastActivity = Date.now();
        let totalActiveTime = 0;

        const updateActivity = () => {
            const now = Date.now();
            if (now - lastActivity < 60000) { // If active within last minute
                totalActiveTime += now - lastActivity;
            }
            lastActivity = now;
        };

        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Track engagement every 5 minutes
        setInterval(() => {
            if (totalActiveTime > 0) {
                this.trackEvent('user_engagement', {
                    activeTimeSeconds: Math.round(totalActiveTime / 1000),
                    sessionDuration: Math.round((Date.now() - this.startTime) / 1000)
                });
                totalActiveTime = 0;
            }
        }, 300000);
    }

    // === DATA TRANSMISSION ===

    startBatchSending() {
        setInterval(() => {
            if (this.events.length > 0) {
                this.sendEvents();
            }
        }, this.sendInterval);

        // Send on page unload
        window.addEventListener('beforeunload', () => {
            this.sendEvents(true);
        });
    }

    sendEvents(isSync = false) {
        if (!this.isEnabled || this.events.length === 0) return;

        const eventsToSend = this.events.splice(0, this.batchSize);
        const payload = {
            sessionId: this.sessionId,
            events: eventsToSend,
            timestamp: Date.now(),
            version: '1.0.0'
        };

        if (isSync) {
            // Synchronous sending for page unload
            navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
        } else {
            // Asynchronous sending
            this.sendAsync(payload);
        }
    }

    async sendAsync(payload) {
        try {
            // In development, log to console
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('📈 Analytics data (dev mode):', payload);
                return;
            }

            // In production, send to analytics endpoint
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn('Analytics send failed:', response.status);
            }
        } catch (error) {
            console.warn('Analytics error:', error);
            // Put events back in queue to retry
            this.events.unshift(...payload.events);
        }
    }

    // === PUBLIC API ===

    // Method to get current statistics for display
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            eventsTracked: this.events.length,
            isEnabled: this.isEnabled
        };
    }

    // Method to disable monitoring (for privacy)
    disable() {
        this.isEnabled = false;
        this.events = [];
        localStorage.setItem('typing_game_analytics_consent', 'false');
        console.log('📊 Analytics disabled by user');
    }

    // Method to enable monitoring
    enable() {
        this.isEnabled = true;
        localStorage.setItem('typing_game_analytics_consent', 'true');
        this.initializeMonitoring();
        console.log('📊 Analytics enabled by user');
    }
}

// === DASHBOARD DATA AGGREGATION ===

class AnalyticsDashboard {
    constructor() {
        this.data = this.loadStoredData();
    }

    loadStoredData() {
        try {
            return JSON.parse(localStorage.getItem('typing_game_dashboard_data')) || {
                totalSessions: 0,
                totalPlayTime: 0,
                averageWPM: 0,
                averageAccuracy: 0,
                favoriteLanguage: 'id',
                sessionsToday: 0,
                lastPlayed: null
            };
        } catch {
            return {
                totalSessions: 0,
                totalPlayTime: 0,
                averageWPM: 0,
                averageAccuracy: 0,
                favoriteLanguage: 'id',
                sessionsToday: 0,
                lastPlayed: null
            };
        }
    }

    updateSessionData(sessionData) {
        this.data.totalSessions++;
        this.data.totalPlayTime += sessionData.duration || 0;
        this.data.lastPlayed = Date.now();

        if (sessionData.wpm) {
            this.data.averageWPM = Math.round(
                (this.data.averageWPM * (this.data.totalSessions - 1) + sessionData.wpm) / this.data.totalSessions
            );
        }

        if (sessionData.accuracy) {
            this.data.averageAccuracy = Math.round(
                (this.data.averageAccuracy * (this.data.totalSessions - 1) + sessionData.accuracy) / this.data.totalSessions
            );
        }

        // Check if session is today
        const today = new Date().toDateString();
        const sessionDate = new Date(sessionData.timestamp || Date.now()).toDateString();
        if (today === sessionDate) {
            this.data.sessionsToday++;
        }

        this.saveData();
    }

    saveData() {
        localStorage.setItem('typing_game_dashboard_data', JSON.stringify(this.data));
    }

    getDashboardHTML() {
        return `
            <div class="analytics-dashboard">
                <h3>📊 Statistik Permainan</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${this.data.totalSessions}</div>
                        <div class="stat-label">Total Sesi</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Math.round(this.data.totalPlayTime / 60000)}</div>
                        <div class="stat-label">Menit Bermain</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.data.averageWPM}</div>
                        <div class="stat-label">Rata-rata WPM</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${this.data.averageAccuracy}%</div>
                        <div class="stat-label">Akurasi</div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global instances
window.typingGameMonitor = new TypingGameMonitor();
window.analyticsDashboard = new AnalyticsDashboard();

// Export for integration
export { TypingGameMonitor, AnalyticsDashboard };