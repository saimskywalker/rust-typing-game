use wasm_bindgen::prelude::*;
use js_sys::Date;
use rand::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct TypingGame {
    sentences: Vec<&'static str>,
    current_sentence: String,
    start_time: Option<f64>,
    end_time: Option<f64>,
    timer_duration: f64,  // Timer duration in seconds
    typed_chars: usize,
    correct_chars: usize,
    is_active: bool,
    
    // Session-wide accumulation fields
    session_start_time: Option<f64>,
    session_total_typed_chars: usize,
    session_total_correct_chars: usize,
    session_total_time_spent: f64,  // Total active typing time across sentences
    session_sentences_completed: usize,
}

#[wasm_bindgen]
impl TypingGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TypingGame {
        let sentences = vec![
            "The quick brown fox jumps over the lazy dog.",
            "Pack my box with five dozen liquor jugs.",
            "How vexingly quick daft zebras jump!",
            "Bright vixens jump; dozy fowl quack.",
            "Sphinx of black quartz, judge my vow.",
            "Two driven jocks help fax my big quiz.",
            "Five quacking zephyrs jolt my wax bed.",
            "The five boxing wizards jump quickly.",
            "Jackdaws love my big sphinx of quartz.",
            "Mr. Jock, TV quiz PhD., bags few lynx.",
            "Waltz, bad nymph, for quick jigs vex.",
            "Glib jocks quiz nymphs to vex dwarf.",
            "When zombies arrive, quickly fax judge Pat.",
            "Grumpy wizards make toxic brew for evil queen.",
            "Few black taxis drive up major roads on quiet hazy nights.",
        ];

        TypingGame {
            sentences,
            current_sentence: String::new(),
            start_time: None,
            end_time: None,
            timer_duration: 60.0,  // Default 60 seconds
            typed_chars: 0,
            correct_chars: 0,
            is_active: false,
            
            // Initialize session tracking
            session_start_time: None,
            session_total_typed_chars: 0,
            session_total_correct_chars: 0,
            session_total_time_spent: 0.0,
            session_sentences_completed: 0,
        }
    }

    #[wasm_bindgen]
    pub fn get_random_sentence(&mut self) -> String {
        let mut rng = SmallRng::from_entropy();
        let sentence = self.sentences.choose(&mut rng).unwrap().to_string();
        self.current_sentence = sentence.clone();
        self.reset_game();
        sentence
    }

    #[wasm_bindgen]
    pub fn start_game(&mut self) {
        self.start_time = Some(Date::now());
        self.is_active = true;
        self.typed_chars = 0;
        self.correct_chars = 0;
        self.end_time = None;
        
        // Initialize session start time if this is the first sentence
        if self.session_start_time.is_none() {
            self.session_start_time = self.start_time;
        }
    }

    #[wasm_bindgen]
    pub fn end_game(&mut self) {
        self.end_time = Some(Date::now());
        self.is_active = false;
        
        // Accumulate session stats when game ends
        if let (Some(start), Some(end)) = (self.start_time, self.end_time) {
            let sentence_time = (end - start) / 1000.0; // Convert to seconds
            self.session_total_time_spent += sentence_time;
        }
        
        // Add current sentence stats to session totals
        self.session_total_typed_chars += self.typed_chars;
        self.session_total_correct_chars += self.correct_chars;
        
        // Check if sentence was completed (not just time expired)
        if self.typed_chars > 0 && self.current_sentence.len() > 0 {
            let typed_chars: Vec<char> = if self.typed_chars <= self.current_sentence.len() {
                self.current_sentence.chars().take(self.typed_chars).collect()
            } else {
                self.current_sentence.chars().collect()
            };
            
            // Consider sentence completed if we typed the full sentence
            if typed_chars.len() == self.current_sentence.len() {
                self.session_sentences_completed += 1;
            }
        }
    }

    #[wasm_bindgen]
    pub fn reset_game(&mut self) {
        self.start_time = None;
        self.end_time = None;
        self.typed_chars = 0;
        self.correct_chars = 0;
        self.is_active = false;
    }

    #[wasm_bindgen]
    pub fn update_progress(&mut self, typed_text: &str) -> JsValue {
        if !self.is_active {
            return JsValue::NULL;
        }

        self.typed_chars = typed_text.len();
        self.correct_chars = 0;

        let sentence_chars: Vec<char> = self.current_sentence.chars().collect();
        let typed_chars: Vec<char> = typed_text.chars().collect();

        for (i, &typed_char) in typed_chars.iter().enumerate() {
            if i < sentence_chars.len() && typed_char == sentence_chars[i] {
                self.correct_chars += 1;
            }
        }

        // Check if time expired
        let time_expired = self.is_time_expired();
        if time_expired && self.is_active {
            self.end_game();
        }

        // Check if the sentence is completed
        let is_complete = typed_text == self.current_sentence;
        if is_complete && self.is_active {
            self.end_game();
        }

        // Create result object
        let mut result = HashMap::new();
        result.insert("correct_chars".to_string(), self.correct_chars as f64);
        result.insert("typed_chars".to_string(), self.typed_chars as f64);
        result.insert("accuracy".to_string(), self.get_accuracy());
        result.insert("wpm".to_string(), self.get_wpm());
        result.insert("is_complete".to_string(), if is_complete { 1.0 } else { 0.0 });
        result.insert("is_active".to_string(), if self.is_active { 1.0 } else { 0.0 });
        result.insert("time_expired".to_string(), if time_expired { 1.0 } else { 0.0 });

        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_wpm(&self) -> f64 {
        // Return 0 if no characters typed or game not started
        if self.typed_chars == 0 || self.start_time.is_none() {
            return 0.0;
        }

        if let Some(start) = self.start_time {
            let current_time = if let Some(end) = self.end_time {
                end
            } else {
                Date::now()
            };

            let elapsed_ms = current_time - start;
            
            // Ensure minimum elapsed time to prevent extremely high WPM values
            // Minimum 1 second (1000ms) for reasonable WPM calculation
            if elapsed_ms < 1000.0 {
                return 0.0;
            }

            let elapsed_minutes = elapsed_ms / 60000.0; // Convert to minutes
            let words = (self.typed_chars as f64) / 5.0; // Use total typed chars, not just correct ones
            
            // Additional safety check to prevent division issues
            if elapsed_minutes > 0.0 && words >= 0.0 {
                let wpm = words / elapsed_minutes;
                // Cap WPM at reasonable maximum (e.g., 300 WPM) to prevent display issues
                return wpm.min(300.0).max(0.0);
            }
        }
        0.0
    }

    #[wasm_bindgen]
    pub fn get_accuracy(&self) -> f64 {
        // Return 100% if no characters typed yet (perfect start)
        if self.typed_chars == 0 {
            return 100.0;
        }
        
        // Additional safety checks to prevent division issues
        if self.correct_chars > self.typed_chars {
            // This should never happen, but defensive programming
            return 0.0;
        }
        
        // Calculate accuracy with explicit bounds checking
        let correct = self.correct_chars as f64;
        let total = self.typed_chars as f64;
        
        if total > 0.0 && correct >= 0.0 {
            let accuracy = (correct / total) * 100.0;
            // Ensure accuracy is within valid bounds (0-100%)
            return accuracy.min(100.0).max(0.0);
        }
        
        // Fallback to 0% if something unexpected happens
        0.0
    }

    #[wasm_bindgen]
    pub fn get_current_sentence(&self) -> String {
        self.current_sentence.clone()
    }

    #[wasm_bindgen]
    pub fn is_game_active(&self) -> bool {
        self.is_active
    }

    #[wasm_bindgen]
    pub fn set_timer_duration(&mut self, duration_seconds: f64) {
        self.timer_duration = duration_seconds.max(1.0); // Minimum 1 second
    }

    #[wasm_bindgen]
    pub fn get_timer_duration(&self) -> f64 {
        self.timer_duration
    }

    #[wasm_bindgen]
    pub fn get_remaining_time(&self) -> f64 {
        if let Some(start) = self.start_time {
            let elapsed_seconds = (Date::now() - start) / 1000.0;
            let remaining = self.timer_duration - elapsed_seconds;
            remaining.max(0.0)
        } else {
            self.timer_duration
        }
    }

    #[wasm_bindgen]
    pub fn is_time_expired(&self) -> bool {
        self.get_remaining_time() <= 0.0 && self.start_time.is_some()
    }

    #[wasm_bindgen]
    pub fn get_completion_time(&self) -> f64 {
        if let (Some(start), Some(end)) = (self.start_time, self.end_time) {
            (end - start) / 1000.0 // Return seconds
        } else {
            0.0
        }
    }

    #[wasm_bindgen]
    pub fn get_recommendation(&self) -> String {
        let wpm = self.get_wpm();
        let accuracy = self.get_accuracy();

        // WPM recommendations
        let speed_level = if wpm >= 70.0 {
            "🚀 Excellent"
        } else if wpm >= 50.0 {
            "⚡ Great"
        } else if wpm >= 35.0 {
            "👍 Good"
        } else if wpm >= 20.0 {
            "📈 Keep practicing"
        } else {
            "🎯 Focus on accuracy first"
        };

        // Accuracy recommendations
        let accuracy_level = if accuracy >= 98.0 {
            "🎯 Perfect accuracy!"
        } else if accuracy >= 95.0 {
            "✨ Excellent accuracy"
        } else if accuracy >= 90.0 {
            "👌 Good accuracy"
        } else if accuracy >= 80.0 {
            "⚠️ Focus on accuracy"
        } else {
            "🐌 Slow down for better accuracy"
        };

        // Combined recommendations
        let recommendation = if wpm >= 50.0 && accuracy >= 95.0 {
            "🏆 Outstanding! You're a typing master! Try challenging texts to push your limits further."
        } else if wpm >= 40.0 && accuracy >= 90.0 {
            "🌟 Great performance! Practice regularly to reach expert level (50+ WPM with 95%+ accuracy)."
        } else if wpm < 30.0 && accuracy < 85.0 {
            "💡 Focus on accuracy first, then gradually increase speed. Try typing without looking at the keyboard."
        } else if accuracy < 90.0 {
            "🎯 Slow down slightly to improve accuracy. Accuracy is more important than speed when learning."
        } else if wpm < 40.0 {
            "⚡ Great accuracy! Now try to gradually increase your typing speed while maintaining precision."
        } else {
            "📚 Keep practicing daily to improve both speed and accuracy. Consider typing lessons or games."
        };

        format!("Speed: {} ({:.0} WPM)\nAccuracy: {} ({:.1}%)\n\n💬 {}", 
                speed_level, wpm, accuracy_level, accuracy, recommendation)
    }

    // Session-wide statistics methods
    #[wasm_bindgen]
    pub fn get_session_wpm(&self) -> f64 {
        // Return 0 if no session started or no typing done
        if self.session_start_time.is_none() || self.session_total_typed_chars == 0 {
            return 0.0;
        }

        if let Some(session_start) = self.session_start_time {
            let current_time = Date::now();
            let session_elapsed_ms = current_time - session_start;
            
            // Use accumulated typing time instead of total elapsed session time
            // This gives more accurate WPM as it excludes breaks between sentences
            let typing_time_minutes = if self.session_total_time_spent > 0.0 {
                self.session_total_time_spent / 60.0 // Convert seconds to minutes
            } else {
                // Fallback to session elapsed time if no accumulated time yet
                session_elapsed_ms / 60000.0 // Convert ms to minutes
            };
            
            // Ensure minimum time to prevent extreme values
            if typing_time_minutes < (1.0 / 60.0) { // Less than 1 second
                return 0.0;
            }

            let total_words = (self.session_total_typed_chars as f64) / 5.0;
            
            if typing_time_minutes > 0.0 && total_words >= 0.0 {
                let session_wpm = total_words / typing_time_minutes;
                // Cap at reasonable maximum
                return session_wpm.min(300.0).max(0.0);
            }
        }
        0.0
    }

    #[wasm_bindgen]
    pub fn get_session_accuracy(&self) -> f64 {
        // Return 100% if no typing done yet
        if self.session_total_typed_chars == 0 {
            return 100.0;
        }
        
        // Defensive programming check
        if self.session_total_correct_chars > self.session_total_typed_chars {
            return 0.0;
        }
        
        let correct = self.session_total_correct_chars as f64;
        let total = self.session_total_typed_chars as f64;
        
        if total > 0.0 && correct >= 0.0 {
            let accuracy = (correct / total) * 100.0;
            return accuracy.min(100.0).max(0.0);
        }
        
        0.0
    }

    #[wasm_bindgen]
    pub fn get_session_sentences_completed(&self) -> usize {
        self.session_sentences_completed
    }

    #[wasm_bindgen]
    pub fn get_session_total_typed_chars(&self) -> usize {
        self.session_total_typed_chars
    }

    #[wasm_bindgen]
    pub fn get_session_total_time_spent(&self) -> f64 {
        self.session_total_time_spent
    }

    #[wasm_bindgen]
    pub fn reset_session(&mut self) {
        self.session_start_time = None;
        self.session_total_typed_chars = 0;
        self.session_total_correct_chars = 0;
        self.session_total_time_spent = 0.0;
        self.session_sentences_completed = 0;
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust Typing Game initialized!");
}