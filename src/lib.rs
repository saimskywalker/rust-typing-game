use wasm_bindgen::prelude::*;
use js_sys::Date;
use web_sys::{window, HtmlInputElement};
use rand::prelude::*;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    fn setTimeout(closure: &Closure<dyn FnMut()>, delay: u32) -> u32;
    fn clearTimeout(id: u32);
    
    #[wasm_bindgen(js_name = clearCountdownTimer)]
    fn clear_countdown_timer();
    
    #[wasm_bindgen(js_name = startGameTimer)]
    fn start_game_timer();
    
    #[wasm_bindgen(js_name = clearTypingInput)]
    fn clear_typing_input();
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UserData {
    pub name: String,
    pub language: String,
    pub language_name: String,
    pub duration: u32,
    pub best_wpm: u32,
    pub best_accuracy: u32,
    pub total_sessions: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SessionResult {
    pub wpm: u32,
    pub accuracy: u32,
    pub typed_chars: u32,
    pub correct_chars: u32,
    pub time_spent: f64,
    pub sentences_completed: u32,
}

#[wasm_bindgen]
pub enum AppState {
    Loading,
    Welcome,
    Language,
    Timer,
    Countdown,
    Playing,
    TimesUp,
    Results,
}

#[wasm_bindgen]
pub struct TypingApp {
    sentences: HashMap<String, Vec<&'static str>>,
    user_data: UserData,
    session_result: Option<SessionResult>,
    app_state: AppState,
    
    // Game state
    current_sentence: String,
    start_time: Option<f64>,
    end_time: Option<f64>,
    typed_chars: usize,
    correct_chars: usize,
    is_active: bool,
    
    // Session tracking
    session_start_time: Option<f64>,
    session_total_typed_chars: usize,
    session_total_correct_chars: usize,
    session_total_time_spent: f64,
    session_sentences_completed: usize,
    
    // UI state
    countdown_value: u32,
}

#[wasm_bindgen]
impl TypingApp {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TypingApp {
        let mut sentences = HashMap::new();
        
        sentences.insert("en".to_string(), vec![
            "Once upon a time, there was a brave little mouse who loved cheese.",
            "The magical unicorn danced in the rainbow garden with butterfly friends.",
            "A kind dragon shared cookies with all the forest animals today.",
            "The happy cat played with a red ball in the sunny backyard.",
            "Three little pigs built houses and became best friends forever.",
            "A wise owl taught young animals how to read and write stories.",
            "The friendly bear found honey and shared it with busy bees.",
            "A beautiful princess rescued a lost puppy and they went home together.",
            "The singing bird helped flowers grow by playing sweet music every morning.",
            "A funny monkey swung through trees and made all animals laugh loudly.",
            "The gentle elephant carried small animals across the big river safely.",
            "A brave knight helped a lost kitten find its way back home.",
            "The magic fairy sprinkled stardust and made all wishes come true.",
            "A sleepy bunny counted carrots and dreamed of adventure in the meadow.",
            "The colorful parrot taught children how to say hello in many languages.",
        ]);
        
        sentences.insert("es".to_string(), vec![
            "El gatito mágico jugaba con una pelota de colores en el jardín.",
            "La princesa valiente salvó al pequeño conejito perdido en el bosque.",
            "Un dragón amigable compartió dulces con todos los niños del pueblo.",
            "El oso feliz encontró miel y la compartió con las abejas trabajadoras.",
            "Tres cerditos construyeron casas y se hicieron mejores amigos para siempre.",
            "La mariposa colorida voló entre las flores cantando una canción bonita.",
            "El elefante gentil ayudó a los animales pequeños a cruzar el río.",
            "Una hada mágica concedió deseos a todos los niños buenos.",
            "El ratoncito valiente encontró queso y compartió con su familia.",
            "El búho sabio enseñó a leer y escribir a todos los animales.",
        ]);
        
        sentences.insert("fr".to_string(), vec![
            "Le petit chat magique jouait avec une balle colorée dans le jardin.",
            "Une princesse courageuse a sauvé un petit lapin perdu dans la forêt.",
            "Le dragon gentil a partagé des bonbons avec tous les enfants du village.",
            "L'ours heureux a trouvé du miel et l'a partagé avec les abeilles.",
            "Trois petits cochons ont construit des maisons et sont devenus amis.",
            "Le papillon coloré a volé parmi les fleurs en chantant une belle chanson.",
            "L'éléphant gentil a aidé les petits animaux à traverser la rivière.",
            "Une fée magique a exaucé les vœux de tous les bons enfants.",
            "La petite souris courageuse a trouvé du fromage pour sa famille.",
            "Le hibou sage a appris à lire et écrire à tous les animaux.",
        ]);

        sentences.insert("id".to_string(), vec![
            "Dahulu kala hiduplah seekor kucing kecil yang suka bermain bola warna-warni.",
            "Putri pemberani menyelamatkan kelinci kecil yang tersesat di hutan ajaib.",
            "Naga baik hati membagi permen kepada semua anak-anak di desa.",
            "Beruang gembira menemukan madu dan membaginya dengan lebah-lebah pekerja.",
            "Tiga babi kecil membangun rumah dan menjadi sahabat selamanya.",
            "Kupu-kupu cantik terbang di antara bunga sambil bernyanyi lagu indah.",
            "Gajah ramah membantu hewan kecil menyeberangi sungai yang deras.",
            "Peri ajaib mengabulkan permintaan semua anak-anak yang baik.",
            "Tikus kecil yang berani menemukan keju untuk keluarganya.",
            "Burung hantu bijak mengajar semua hewan cara membaca dan menulis.",
            "Kelinci cerdas melompat-lompat gembira di padang rumput hijau.",
            "Singa raja hutan berbagi makanan dengan semua temannya.",
            "Kura-kura lambat tapi pasti memenangkan lomba lari yang seru.",
            "Lumba-lumba pintar bermain air bersama ikan-ikan kecil di laut.",
            "Rusa anggun berlari cepat melewati hutan yang rimbun dan sejuk.",
            "Monyet lucu berayun dari pohon ke pohon sambil tertawa riang.",
            "Tupai rajin mengumpulkan kacang untuk persiapan musim dingin nanti.",
            "Merpati putih membawa pesan cinta dari satu tempat ke tempat lain.",
            "Katak hijau bernyanyi merdu di kolam yang jernih dan tenang.",
            "Lebah pekerja keras membuat madu manis di sarang yang aman.",
            "Ayam jago berkokok keras membangunkan semua penghuni desa pagi hari.",
            "Bebek kuning berenang santai di danau yang biru dan tenang.",
            "Kambing putih melompat-lompat senang di atas bukit yang tinggi.",
            "Sapi coklat memberikan susu segar untuk anak-anak setiap pagi.",
            "Kuda putih berlari kencang membawa putri ke istana yang megah.",
            "Anjing setia menjaga rumah dan melindungi keluarga dengan baik.",
            "Kucing persia tidur nyenyak di atas bantal yang empuk dan hangat.",
            "Hamster kecil berlari di roda mainan sambil makan biji bunga matahari.",
            "Burung beo pintar meniru suara manusia dengan sangat jelas.",
            "Ikan mas berenang indah di akuarium yang bersih dan jernih.",
            "Penyu tua bercerita tentang petualangan di dasar laut yang dalam.",
            "Burung hantu malam terbang diam-diam mencari makanan di kegelapan.",
            "Serigala abu-abu melolong panjang di bawah sinar bulan purnama.",
            "Rubah merah berlari gesit menghindari pemburu di hutan lebat.",
            "Berang-berang rajin membangun bendungan di sungai yang mengalir deras.",
            "Landak berduri melindungi diri dari bahaya dengan cara menggulung badan.",
            "Rusa kutub putih berjalan anggun di atas salju yang tebal.",
            "Pinguin lucu berjalan bergoyang di atas es yang licin dan dingin.",
            "Burung flamingo merah muda berdiri dengan satu kaki di danau.",
            "Jerapah tinggi makan daun segar dari puncak pohon yang tinggi.",
            "Zebra belang hitam putih berlari bersama kawanannya di padang savana.",
            "Badak abu-abu berkubang lumpur untuk melindungi kulitnya dari matahari.",
            "Cheetah tercepat mengejar mangsanya dengan kecepatan yang luar biasa.",
            "Orangutan cerdas berayun dari dahan ke dahan di hutan Kalimantan.",
            "Komodo besar berjemur di bawah sinar matahari pagi yang hangat.",
            "Burung cendrawasih cantik menari indah untuk menarik perhatian pasangannya.",
            "Gajah Sumatera mandi lumpur di sungai untuk mendinginkan tubuhnya.",
            "Harimau Sumatera berburu mangsa di hutan hujan yang lebat.",
            "Burung garuda terbang tinggi melintasi langit biru Indonesia yang indah.",
            "Anak-anak bermain layang-layang warna-warni di lapangan yang luas dan hijau."
        ]);

        let user_data = UserData {
            name: String::new(),
            language: "id".to_string(),
            language_name: "Bahasa Indonesia".to_string(),
            duration: 120,
            best_wpm: 0,
            best_accuracy: 0,
            total_sessions: 0,
        };

        TypingApp {
            sentences,
            user_data,
            session_result: None,
            app_state: AppState::Loading,
            current_sentence: String::new(),
            start_time: None,
            end_time: None,
            typed_chars: 0,
            correct_chars: 0,
            is_active: false,
            session_start_time: None,
            session_total_typed_chars: 0,
            session_total_correct_chars: 0,
            session_total_time_spent: 0.0,
            session_sentences_completed: 0,
            countdown_value: 5,
        }
    }

    #[wasm_bindgen]
    pub fn initialize(&mut self) {
        self.load_user_data();
        self.show_screen("welcome-screen");
        self.app_state = AppState::Welcome;
        console_log!("TypingApp initialized");
    }

    #[wasm_bindgen]
    pub fn set_user_name(&mut self, name: &str) -> bool {
        if name.len() >= 2 {
            self.user_data.name = name.to_string();
            self.save_user_data();
            return true;
        }
        false
    }

    #[wasm_bindgen]
    pub fn set_language(&mut self, lang_code: &str, lang_name: &str) {
        if self.sentences.contains_key(lang_code) {
            self.user_data.language = lang_code.to_string();
            self.user_data.language_name = lang_name.to_string();
            self.save_user_data();
        }
    }

    #[wasm_bindgen]
    pub fn set_duration(&mut self, duration: u32) {
        self.user_data.duration = duration;
        self.save_user_data();
    }

    #[wasm_bindgen]
    pub fn proceed_to_language(&mut self) {
        if !self.user_data.name.is_empty() {
            self.show_screen("language-screen");
            self.app_state = AppState::Language;
        }
    }

    #[wasm_bindgen]
    pub fn proceed_to_timer(&mut self) {
        self.show_screen("timer-screen");
        self.app_state = AppState::Timer;
    }

    #[wasm_bindgen]
    pub fn start_countdown(&mut self) {
        self.show_screen("countdown-screen");
        self.app_state = AppState::Countdown;
        self.countdown_value = 5;
        self.update_countdown_display();
        self.update_countdown_message();
    }

    #[wasm_bindgen]
    pub fn countdown_tick(&mut self) {
        if self.countdown_value > 0 {
            self.countdown_value -= 1;
            self.update_countdown_display();
            self.update_countdown_message();
            
            if self.countdown_value == 0 {
                // Start game after showing "GO!" for a moment
                console_log!("Countdown complete, starting game...");
                self.start_game_session();
            }
        }
    }

    #[wasm_bindgen]
    pub fn start_game_session(&mut self) {
        console_log!("Starting game session...");
        clear_countdown_timer();
        self.show_screen("game-screen");
        self.app_state = AppState::Playing;
        self.initialize_game();
        self.generate_new_sentence();
        self.focus_typing_input();
        start_game_timer();
        console_log!("Game session started, sentence: {}", self.current_sentence);
    }
    
    fn focus_typing_input(&self) {
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                if let Some(input) = document.get_element_by_id("typing-input") {
                    if let Ok(html_input) = input.dyn_into::<HtmlInputElement>() {
                        html_input.focus().ok();
                        console_log!("Focused typing input");
                    }
                }
            }
        }
    }

    fn initialize_game(&mut self) {
        self.session_start_time = Some(Date::now());
        self.session_total_typed_chars = 0;
        self.session_total_correct_chars = 0;
        self.session_total_time_spent = 0.0;
        self.session_sentences_completed = 0;
        self.reset_current_sentence();
    }

    fn reset_current_sentence(&mut self) {
        self.start_time = None;
        self.end_time = None;
        self.typed_chars = 0;
        self.correct_chars = 0;
        self.is_active = false;
    }

    #[wasm_bindgen]
    pub fn generate_new_sentence(&mut self) -> String {
        let mut rng = SmallRng::from_entropy();
        let language_sentences = self.sentences.get(&self.user_data.language)
            .unwrap_or(self.sentences.get("id").unwrap());
        
        self.current_sentence = language_sentences.choose(&mut rng).unwrap().to_string();
        self.reset_current_sentence();
        self.display_sentence(&self.current_sentence.clone());
        self.current_sentence.clone()
    }

    #[wasm_bindgen]
    pub fn start_typing(&mut self) {
        if !self.is_active {
            self.start_time = Some(Date::now());
            self.is_active = true;
        }
    }

    #[wasm_bindgen]
    pub fn update_typing_progress(&mut self, typed_text: &str) -> JsValue {
        // Start typing if not already active
        if !self.is_active {
            console_log!("Starting typing session...");
            self.start_typing();
        }

        self.typed_chars = typed_text.len();
        self.correct_chars = 0;
        
        console_log!("Typed: '{}' ({} chars)", typed_text, self.typed_chars);

        let sentence_chars: Vec<char> = self.current_sentence.chars().collect();
        let typed_chars: Vec<char> = typed_text.chars().collect();

        for (i, &typed_char) in typed_chars.iter().enumerate() {
            if i < sentence_chars.len() && typed_char == sentence_chars[i] {
                self.correct_chars += 1;
            }
        }

        // Check if sentence is complete (user has typed enough characters)
        let is_complete = typed_text.len() >= self.current_sentence.len();
        
        // Check if time expired
        let time_expired = self.is_time_expired();
        
        if is_complete && self.is_active {
            console_log!("Sentence completed: {}", typed_text);
            self.complete_sentence();
        } else if time_expired {
            console_log!("Time expired, ending session");
            self.end_session();
        }

        self.create_progress_result(is_complete, time_expired)
    }

    fn complete_sentence(&mut self) {
        console_log!("Completing sentence, updating stats...");
        self.end_time = Some(Date::now());
        self.is_active = false;
        
        // Update session totals
        if let (Some(start), Some(end)) = (self.start_time, self.end_time) {
            let sentence_time = (end - start) / 1000.0;
            self.session_total_time_spent += sentence_time;
        }
        
        self.session_total_typed_chars += self.typed_chars;
        self.session_total_correct_chars += self.correct_chars;
        self.session_sentences_completed += 1;
        
        // Generate new sentence if time hasn't expired
        if !self.is_time_expired() {
            console_log!("Time remaining, generating new sentence...");
            self.generate_new_sentence();
            clear_typing_input();
        } else {
            console_log!("Time expired during sentence completion");
            self.end_session();
        }
    }

    fn end_session(&mut self) {
        self.is_active = false;
        
        // Calculate final results
        let wpm = self.calculate_session_wpm();
        let accuracy = self.calculate_session_accuracy();
        
        self.session_result = Some(SessionResult {
            wpm: wpm as u32,
            accuracy: accuracy as u32,
            typed_chars: self.session_total_typed_chars as u32,
            correct_chars: self.session_total_correct_chars as u32,
            time_spent: self.session_total_time_spent,
            sentences_completed: self.session_sentences_completed as u32,
        });
        
        // Update user data
        self.user_data.total_sessions += 1;
        if wpm as u32 > self.user_data.best_wpm {
            self.user_data.best_wpm = wpm as u32;
        }
        if accuracy as u32 > self.user_data.best_accuracy {
            self.user_data.best_accuracy = accuracy as u32;
        }
        
        self.save_user_data();
        
        console_log!("Session ended, showing results directly. WPM: {}, Accuracy: {}%", wpm as u32, accuracy as u32);
        
        // Show results directly without time's up screen
        self.show_results();
    }

    #[wasm_bindgen]
    pub fn show_results(&mut self) {
        console_log!("show_results called, transitioning to results screen");
        self.app_state = AppState::Results;
        self.show_screen("results-screen");
        self.display_results();
        console_log!("Results screen displayed successfully");
    }

    #[wasm_bindgen]
    pub fn restart_game(&mut self) {
        self.start_countdown();
    }

    #[wasm_bindgen]
    pub fn change_settings(&mut self) {
        self.show_screen("language-screen");
        self.app_state = AppState::Language;
    }

    #[wasm_bindgen]
    pub fn new_session(&mut self) {
        self.show_screen("welcome-screen");
        self.app_state = AppState::Welcome;
    }

    // Calculation methods
    fn calculate_session_wpm(&self) -> f64 {
        if self.session_total_typed_chars == 0 || self.session_total_time_spent == 0.0 {
            return 0.0;
        }
        
        let words = (self.session_total_typed_chars as f64) / 5.0;
        let minutes = self.session_total_time_spent / 60.0;
        (words / minutes).min(300.0).max(0.0)
    }

    fn calculate_session_accuracy(&self) -> f64 {
        if self.session_total_typed_chars == 0 {
            return 100.0;
        }
        
        ((self.session_total_correct_chars as f64) / (self.session_total_typed_chars as f64) * 100.0)
            .min(100.0).max(0.0)
    }

    fn is_time_expired(&self) -> bool {
        if let Some(session_start) = self.session_start_time {
            let elapsed = (Date::now() - session_start) / 1000.0;
            elapsed >= (self.user_data.duration as f64)
        } else {
            false
        }
    }

    fn get_remaining_time(&self) -> f64 {
        if let Some(session_start) = self.session_start_time {
            let elapsed = (Date::now() - session_start) / 1000.0;
            ((self.user_data.duration as f64) - elapsed).max(0.0)
        } else {
            self.user_data.duration as f64
        }
    }

    fn create_progress_result(&self, is_complete: bool, time_expired: bool) -> JsValue {
        let mut result = HashMap::new();
        result.insert("correct_chars".to_string(), self.correct_chars as f64);
        result.insert("typed_chars".to_string(), self.typed_chars as f64);
        result.insert("wpm".to_string(), self.calculate_current_wpm());
        result.insert("accuracy".to_string(), self.calculate_current_accuracy());
        result.insert("is_complete".to_string(), if is_complete { 1.0 } else { 0.0 });
        result.insert("time_expired".to_string(), if time_expired { 1.0 } else { 0.0 });
        result.insert("remaining_time".to_string(), self.get_remaining_time());
        
        serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
    }

    fn calculate_current_wpm(&self) -> f64 {
        if self.typed_chars == 0 || self.start_time.is_none() {
            return 0.0;
        }
        
        if let Some(start) = self.start_time {
            let elapsed_ms = Date::now() - start;
            if elapsed_ms < 1000.0 {
                return 0.0;
            }
            
            let elapsed_minutes = elapsed_ms / 60000.0;
            let words = (self.typed_chars as f64) / 5.0;
            (words / elapsed_minutes).min(300.0).max(0.0)
        } else {
            0.0
        }
    }

    fn calculate_current_accuracy(&self) -> f64 {
        if self.typed_chars == 0 {
            return 100.0;
        }
        
        ((self.correct_chars as f64) / (self.typed_chars as f64) * 100.0).min(100.0).max(0.0)
    }

    // UI helper methods
    fn show_screen(&self, screen_id: &str) {
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                // Hide all screens
                let screens = ["welcome-screen", "language-screen", "timer-screen", 
                             "countdown-screen", "game-screen", "times-up-screen", "results-screen"];
                
                for screen in &screens {
                    if let Some(element) = document.get_element_by_id(screen) {
                        element.set_class_name("screen hidden");
                    }
                }
                
                // Show target screen
                if let Some(element) = document.get_element_by_id(screen_id) {
                    element.set_class_name("screen active");
                }
                
                self.update_personalization();
            }
        }
    }

    fn update_personalization(&self) {
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                // Update name displays
                let name_elements = ["player-name-display", "player-name-timer", 
                                   "player-name-countdown", "player-name-game", 
                                   "player-name-times-up", "results-player-name"];
                
                for element_id in &name_elements {
                    if let Some(element) = document.get_element_by_id(element_id) {
                        element.set_text_content(Some(&self.user_data.name));
                    }
                }
                
                // Update language displays
                if let Some(element) = document.get_element_by_id("selected-language-display") {
                    element.set_text_content(Some(&self.user_data.language_name));
                }
                
                // Update duration displays
                if let Some(element) = document.get_element_by_id("selected-duration-display") {
                    let duration_text = self.format_duration(self.user_data.duration);
                    element.set_text_content(Some(&duration_text));
                }
            }
        }
    }

    fn format_duration(&self, seconds: u32) -> String {
        if seconds >= 60 {
            let minutes = seconds / 60;
            format!("{} minute{}", minutes, if minutes != 1 { "s" } else { "" })
        } else {
            format!("{} seconds", seconds)
        }
    }

    fn display_sentence(&self, sentence: &str) {
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                if let Some(sentence_el) = document.get_element_by_id("sentence") {
                    sentence_el.set_inner_html("");
                    
                    for (i, ch) in sentence.chars().enumerate() {
                        if let Some(span) = document.create_element("span").ok() {
                            span.set_text_content(Some(&ch.to_string()));
                            span.set_class_name("char");
                            span.set_attribute("data-index", &i.to_string()).ok();
                            sentence_el.append_child(&span).ok();
                        }
                    }
                }
            }
        }
    }

    fn update_countdown_display(&self) {
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                if let Some(element) = document.get_element_by_id("countdown-number") {
                    element.set_text_content(Some(&self.countdown_value.to_string()));
                }
            }
        }
    }

    fn update_countdown_message(&self) {
        let messages = [
            "GO! Help our magical friend! 🌟",                    // 0
            "Remember: slow and steady wins the race! 🐢",        // 1  
            "Take your time and be careful! 🎯",                  // 2
            "Put your hands on the keyboard like a pianist! 🎹", // 3
            "Get ready for a magical adventure! ✨"               // 4
        ];
        
        if let Some(window) = window() {
            if let Some(document) = window.document() {
                if let Some(element) = document.get_element_by_id("countdown-text") {
                    let message_index = self.countdown_value as usize;
                    if message_index < messages.len() {
                        element.set_text_content(Some(messages[message_index]));
                    }
                }
            }
        }
    }

    fn display_results(&self) {
        console_log!("display_results called");
        if let Some(result) = &self.session_result {
            console_log!("Session result found: WPM={}, Accuracy={}%, Chars={}, Sentences={}", 
                        result.wpm, result.accuracy, result.typed_chars, result.sentences_completed);
            
            if let Some(window) = window() {
                if let Some(document) = window.document() {
                    // Update final stats
                    if let Some(element) = document.get_element_by_id("final-wpm") {
                        element.set_text_content(Some(&result.wpm.to_string()));
                        console_log!("Updated final-wpm: {}", result.wpm);
                    }
                    if let Some(element) = document.get_element_by_id("final-accuracy") {
                        element.set_text_content(Some(&format!("{}%", result.accuracy)));
                        console_log!("Updated final-accuracy: {}%", result.accuracy);
                    }
                    if let Some(element) = document.get_element_by_id("total-characters") {
                        element.set_text_content(Some(&result.typed_chars.to_string()));
                        console_log!("Updated total-characters: {}", result.typed_chars);
                    }
                    if let Some(element) = document.get_element_by_id("sentences-completed") {
                        element.set_text_content(Some(&result.sentences_completed.to_string()));
                        console_log!("Updated sentences-completed: {}", result.sentences_completed);
                    }
                } else {
                    console_log!("Document not found");
                }
            } else {
                console_log!("Window not found");
            }
        } else {
            console_log!("No session result found to display");
        }
    }

    // Data persistence
    fn save_user_data(&self) {
        if let Some(window) = window() {
            if let Some(storage) = window.local_storage().ok().flatten() {
                if let Ok(serialized) = serde_json::to_string(&self.user_data) {
                    storage.set_item("typingAppUserData", &serialized).ok();
                }
            }
        }
    }

    fn load_user_data(&mut self) {
        if let Some(window) = window() {
            if let Some(storage) = window.local_storage().ok().flatten() {
                if let Ok(Some(data)) = storage.get_item("typingAppUserData") {
                    if let Ok(user_data) = serde_json::from_str::<UserData>(&data) {
                        self.user_data = user_data;
                    }
                }
            }
        }
    }

    // Getters for UI
    #[wasm_bindgen(getter)]
    pub fn user_name(&self) -> String {
        self.user_data.name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn current_language(&self) -> String {
        self.user_data.language.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn current_sentence(&self) -> String {
        self.current_sentence.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn session_wpm(&self) -> u32 {
        self.calculate_session_wpm() as u32
    }

    #[wasm_bindgen(getter)]
    pub fn session_accuracy(&self) -> u32 {
        self.calculate_session_accuracy() as u32
    }

    #[wasm_bindgen(getter)]
    pub fn remaining_time(&self) -> f64 {
        self.get_remaining_time()
    }
    
    // Debug function to test Rust-JS connection
    #[wasm_bindgen]
    pub fn test_connection(&self) -> String {
        console_log!("Rust function called successfully!");
        format!("Rust is working! Current sentence: {}", self.current_sentence)
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust TypingApp initialized!");
}