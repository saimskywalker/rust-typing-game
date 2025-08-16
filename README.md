# 🐯 Story Typer - Fun Typing Game for Kids

A modern, colorful typing game designed specifically for Indonesian children to develop motor skills and typing abilities through engaging stories and adventures. This educational tool helps children improve hand-eye coordination, finger dexterity, and keyboard familiarity in a fun, interactive way.

**Author:** saimskywalker

## ✨ Features

- **🌍 Multi-language Support**: Indonesian (primary), English, Spanish, French
- **🎨 Modern Glass UI**: Beautiful glass morphism design with smooth animations
- **📱 Mobile-First**: Fully responsive design that works on all devices
- **🐯 Indonesian Theme**: Cultural elements with tiger mascot and tropical colors
- **📊 Privacy-Safe Analytics**: Child-friendly monitoring with COPPA/GDPR compliance
- **🎯 A/B Testing**: Safe experimentation framework for UI improvements
- **⏰ Flexible Timing**: Choose from 1-5 minute typing sessions
- **🎉 Interactive Feedback**: Real-time encouragement and celebrations

## 🚀 Quick Start

### Prerequisites
- Rust (latest stable)
- Node.js (for development tools)
- `wasm-pack` for WebAssembly compilation

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/saimskywalker/rust-typing-game.git
cd rust-typing-game
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the WebAssembly module**
```bash
wasm-pack build --target web --out-dir pkg
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
rust-typing-game/
├── src/                    # Rust source code
│   └── lib.rs             # Main game logic and WASM bindings
├── pkg/                   # Generated WebAssembly files
├── monitoring/            # Analytics and monitoring system
│   ├── monitor.js         # Client-side analytics
│   ├── ab-testing.js      # A/B testing framework
│   ├── analytics-server.js # Analytics server
│   └── dashboard.html     # Analytics dashboard
├── index.html            # Main HTML file
├── app.js               # JavaScript application logic
├── style.css            # Modern glass morphism styles
├── package.json         # Node.js dependencies
├── Cargo.toml          # Rust dependencies
└── README.md           # This file
```

## 🎮 How to Play

1. **Enter Your Name**: Start by typing your name on the welcome screen
2. **Choose Language**: Select from Indonesian (recommended), English, Spanish, or French
3. **Pick Duration**: Choose how long you want to play (1-5 minutes)
4. **Get Ready**: Watch the countdown and prepare to type
5. **Type Stories**: Help the tiger by typing the displayed stories
6. **See Results**: Check your words per minute, accuracy, and progress

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `wasm-pack build` - Compile Rust to WebAssembly

### Key Technologies

- **Frontend**: HTML5, CSS3 (Glass Morphism), Vanilla JavaScript
- **Backend**: Rust + WebAssembly (WASM)
- **Styling**: Modern CSS with backdrop-filter and gradients
- **Fonts**: Poppins, Inter (Google Fonts)
- **Analytics**: Privacy-focused, local storage based

## 🔒 Privacy & Safety

This application is designed with children's privacy as the top priority:

- ❌ No personal data collection
- ❌ No typed text storage
- ❌ No tracking cookies
- ✅ Local analytics only
- ✅ COPPA/GDPR-K compliant
- ✅ Easy parental controls

## 🎨 Customization

### Changing Colors
Modify CSS variables in `style.css`:
```css
:root {
  --sunset-orange: #FF6B35;
  --tropical-blue: #004E89;
  --bright-yellow: #FFD23F;
  /* Add your colors here */
}
```

### Adding Languages
1. Edit `src/lib.rs` to add new language sentences
2. Update language options in `index.html`
3. Rebuild with `wasm-pack build`

### Mascot Changes
Replace tiger emoji (🐯) in `index.html` with your preferred character.

## 📊 Analytics Dashboard

Access the analytics dashboard at `/dashboard.html` to view:
- Session statistics
- Learning progress
- Performance metrics
- System health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Indonesian children and educators who inspired this project
- The Rust and WebAssembly communities
- Modern web design principles and glass morphism trends

---

**Made by saimskywalker**