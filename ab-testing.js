/**
 * A/B Testing Framework for Story Typer
 * Child-safe experimentation for UI improvements
 */

class ABTestingFramework {
    constructor() {
        this.experiments = new Map();
        this.userVariant = this.getUserVariant();
        this.isEnabled = this.checkABTestingEnabled();
        
        if (this.isEnabled) {
            this.initializeExperiments();
        }
    }

    checkABTestingEnabled() {
        // A/B testing can be disabled for privacy concerns
        return localStorage.getItem('ab_testing_enabled') !== 'false';
    }

    getUserVariant() {
        // Create consistent user variant based on session
        let variant = localStorage.getItem('user_variant');
        if (!variant) {
            // Use simple hash of timestamp and random for consistent grouping
            const hash = Date.now() % 100;
            variant = hash < 50 ? 'A' : 'B';
            localStorage.setItem('user_variant', variant);
        }
        return variant;
    }

    // Define available experiments
    initializeExperiments() {
        this.defineExperiment('mascot_animation', {
            name: 'Mascot Animation Speed',
            description: 'Test different animation speeds for the unicorn mascot',
            variants: {
                A: { speed: '3s', name: 'Normal Speed' },
                B: { speed: '2s', name: 'Faster Speed' }
            },
            weight: 50 // 50/50 split
        });

        this.defineExperiment('encouragement_frequency', {
            name: 'Encouragement Message Frequency',
            description: 'Test how often to show encouraging messages',
            variants: {
                A: { frequency: 10, name: 'Every 10 characters' },
                B: { frequency: 5, name: 'Every 5 characters' }
            },
            weight: 50
        });

        this.defineExperiment('color_scheme', {
            name: 'Primary Color Scheme',
            description: 'Test different primary colors for UI elements',
            variants: {
                A: { primary: '#ff6b6b', name: 'Red-Pink' },
                B: { primary: '#4ecdc4', name: 'Teal-Green' }
            },
            weight: 50
        });

        this.defineExperiment('font_size', {
            name: 'Text Size for Children',
            description: 'Test optimal text size for readability',
            variants: {
                A: { size: '1.4rem', name: 'Standard Size' },
                B: { size: '1.6rem', name: 'Larger Size' }
            },
            weight: 50
        });

        this.defineExperiment('button_style', {
            name: 'Button Visual Style',
            description: 'Test different button styles for better engagement',
            variants: {
                A: { style: 'rounded', name: 'Rounded Buttons' },
                B: { style: 'pill', name: 'Pill-shaped Buttons' }
            },
            weight: 50
        });

        console.log(`🧪 A/B Testing initialized with ${this.experiments.size} experiments`);
        this.applyExperiments();
    }

    defineExperiment(id, config) {
        this.experiments.set(id, {
            ...config,
            id,
            active: true,
            userVariant: this.getUserVariantForExperiment(id, config.weight)
        });
    }

    getUserVariantForExperiment(experimentId, weight) {
        // Use experiment-specific variant assignment
        const stored = localStorage.getItem(`experiment_${experimentId}`);
        if (stored) return stored;

        // Assign based on user variant and experiment weight
        const hash = (experimentId.charCodeAt(0) + Date.now()) % 100;
        const variant = hash < weight ? 'A' : 'B';
        
        localStorage.setItem(`experiment_${experimentId}`, variant);
        return variant;
    }

    applyExperiments() {
        if (!this.isEnabled) return;

        this.experiments.forEach((experiment, id) => {
            if (experiment.active) {
                this.applyExperiment(id, experiment);
            }
        });
    }

    applyExperiment(id, experiment) {
        const variant = experiment.userVariant;
        const config = experiment.variants[variant];

        console.log(`🧪 Applying experiment "${experiment.name}" - Variant ${variant}: ${config.name}`);

        switch (id) {
            case 'mascot_animation':
                this.applyMascotAnimation(config);
                break;
            case 'encouragement_frequency':
                this.applyEncouragementFrequency(config);
                break;
            case 'color_scheme':
                this.applyColorScheme(config);
                break;
            case 'font_size':
                this.applyFontSize(config);
                break;
            case 'button_style':
                this.applyButtonStyle(config);
                break;
        }

        // Track experiment assignment
        this.trackExperimentAssignment(id, variant);
    }

    applyMascotAnimation(config) {
        const style = document.createElement('style');
        style.id = 'ab-mascot-animation';
        style.textContent = `
            .mascot, .story-mascot, .mascot-celebration {
                animation-duration: ${config.speed} !important;
            }
        `;
        document.head.appendChild(style);
    }

    applyEncouragementFrequency(config) {
        // Store frequency for use in main app
        window.abTestConfig = window.abTestConfig || {};
        window.abTestConfig.encouragementFrequency = config.frequency;
    }

    applyColorScheme(config) {
        const style = document.createElement('style');
        style.id = 'ab-color-scheme';
        style.textContent = `
            :root {
                --rainbow-1: ${config.primary} !important;
                --primary: ${config.primary} !important;
            }
        `;
        document.head.appendChild(style);
    }

    applyFontSize(config) {
        const style = document.createElement('style');
        style.id = 'ab-font-size';
        style.textContent = `
            #sentence {
                font-size: ${config.size} !important;
            }
        `;
        document.head.appendChild(style);
    }

    applyButtonStyle(config) {
        const style = document.createElement('style');
        style.id = 'ab-button-style';
        
        if (config.style === 'pill') {
            style.textContent = `
                .btn {
                    border-radius: 50px !important;
                }
                .option {
                    border-radius: 50px !important;
                }
            `;
        }
        
        document.head.appendChild(style);
    }

    trackExperimentAssignment(experimentId, variant) {
        if (window.typingGameMonitor) {
            window.typingGameMonitor.trackEvent('ab_experiment_assigned', {
                experimentId,
                variant,
                timestamp: Date.now()
            });
        }
    }

    // Track experiment outcomes
    trackExperimentOutcome(experimentId, metric, value) {
        if (!this.isEnabled) return;

        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        if (window.typingGameMonitor) {
            window.typingGameMonitor.trackEvent('ab_experiment_outcome', {
                experimentId,
                variant: experiment.userVariant,
                metric,
                value,
                timestamp: Date.now()
            });
        }
    }

    // Public API for tracking outcomes
    trackButtonClick(buttonId) {
        this.trackExperimentOutcome('button_style', 'click', buttonId);
    }

    trackEngagement(metric, value) {
        this.trackExperimentOutcome('encouragement_frequency', metric, value);
        this.trackExperimentOutcome('mascot_animation', metric, value);
    }

    trackReadability(wpm, accuracy) {
        this.trackExperimentOutcome('font_size', 'wpm', wpm);
        this.trackExperimentOutcome('font_size', 'accuracy', accuracy);
        this.trackExperimentOutcome('color_scheme', 'wpm', wpm);
        this.trackExperimentOutcome('color_scheme', 'accuracy', accuracy);
    }

    // Get current experiment assignments for debugging
    getCurrentAssignments() {
        const assignments = {};
        this.experiments.forEach((experiment, id) => {
            assignments[id] = {
                variant: experiment.userVariant,
                config: experiment.variants[experiment.userVariant]
            };
        });
        return assignments;
    }

    // Disable A/B testing (for privacy)
    disable() {
        this.isEnabled = false;
        localStorage.setItem('ab_testing_enabled', 'false');
        
        // Remove applied styles
        ['ab-mascot-animation', 'ab-color-scheme', 'ab-font-size', 'ab-button-style'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        console.log('🧪 A/B Testing disabled');
    }

    // Enable A/B testing
    enable() {
        this.isEnabled = true;
        localStorage.setItem('ab_testing_enabled', 'true');
        this.initializeExperiments();
        console.log('🧪 A/B Testing enabled');
    }

    // Get experiment statistics
    getExperimentStats() {
        const stats = {};
        
        this.experiments.forEach((experiment, id) => {
            const variantA = localStorage.getItem(`experiment_${id}_stats_A`) || '{}';
            const variantB = localStorage.getItem(`experiment_${id}_stats_B`) || '{}';
            
            stats[id] = {
                name: experiment.name,
                userVariant: experiment.userVariant,
                statsA: JSON.parse(variantA),
                statsB: JSON.parse(variantB)
            };
        });
        
        return stats;
    }
}

// Child-safe A/B testing utilities
class ChildSafeABTesting {
    static validateExperiment(experiment) {
        // Ensure experiments are appropriate for children
        const safetyCriteria = [
            'No collection of personal data',
            'No dark patterns or manipulation',
            'Focus on educational value',
            'Maintain positive user experience',
            'Easy to opt-out'
        ];
        
        return safetyCriteria.every(criteria => {
            // In a real implementation, this would check specific criteria
            return true;
        });
    }
    
    static createParentNotification() {
        // Create a notification for parents about A/B testing
        const notification = document.createElement('div');
        notification.id = 'ab-testing-notice';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #4ecdc4;
            border-radius: 15px;
            padding: 1rem;
            max-width: 300px;
            font-size: 0.9rem;
            color: #2d3748;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            font-family: 'Comic Neue', sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 700; margin-bottom: 0.5rem;">
                🧪 Informasi untuk Orang Tua
            </div>
            <div style="margin-bottom: 0.5rem;">
                Kami melakukan testing UI untuk meningkatkan pengalaman belajar anak. 
                Tidak ada data pribadi yang dikumpulkan.
            </div>
            <button onclick="this.parentNode.remove()" style="
                background: #4ecdc4; 
                border: none; 
                color: white; 
                padding: 0.5rem 1rem; 
                border-radius: 10px; 
                cursor: pointer;
                font-weight: 600;
            ">
                Mengerti
            </button>
        `;
        
        return notification;
    }
}

// Initialize A/B testing framework
const abTesting = new ABTestingFramework();

// Export for global access
window.abTesting = abTesting;
window.ChildSafeABTesting = ChildSafeABTesting;

// Show parent notification if first time
if (!localStorage.getItem('ab_testing_notice_shown')) {
    setTimeout(() => {
        document.body.appendChild(ChildSafeABTesting.createParentNotification());
        localStorage.setItem('ab_testing_notice_shown', 'true');
    }, 5000);
}

export { ABTestingFramework, ChildSafeABTesting };