# 🦀 Type Master - Rust Typing Speed Test

A high-performance typing speed test built with **Rust** and **WebAssembly**. This project demonstrates a **Rust-dominant** web application architecture where the majority of application logic is implemented in Rust.

## ✨ Features

- **🦀 Rust-powered**: Core logic written in Rust for maximum performance
- **⚡ WebAssembly**: Compiled to WASM for near-native speed in the browser
- **🌍 Multi-language**: Support for English, Spanish, and French
- **📊 Real-time metrics**: Live WPM and accuracy tracking  
- **💾 Persistent data**: Your progress is saved locally
- **📱 Responsive design**: Works on desktop and mobile devices
- **🎯 Clean architecture**: Rust handles state, JavaScript handles DOM

## 🏗️ Architecture Breakdown

This project showcases a **Rust-dominant** web application:

- **625 lines of Rust** (38% of codebase) - Core application logic
- **239 lines of JavaScript** (15% of codebase) - Minimal DOM glue  
- **580 lines of CSS** (35% of codebase) - Styling
- **203 lines of HTML** (12% of codebase) - Structure

The majority of application logic including game state, user persistence, calculations, and screen navigation is implemented in **Rust**.

## 🛠️ Prerequisites

- [Rust](https://rustup.rs/) (latest stable version)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) for building WebAssembly modules
- A local HTTP server (Python's http.server, Node's serve, etc.)

## 🚀 Quick Start

**The easiest way to get started:**

```bash
npm install
npm run dev
```

This will:
- ✅ Build the Rust code to WebAssembly 
- ✅ Start a development server on `http://localhost:5173`
- ✅ Automatically open your browser

**Alternative methods:**

```bash
# Manual build + serve
chmod +x build.sh
./build.sh
npm run serve

# Using Python (traditional)
./build.sh && python -m http.server 5173
```

## 📁 Project Structure

```
rust-typing-game/
├── src/
│   └── lib.rs          # Rust game logic
├── pkg/                # Generated WebAssembly files (after build)
├── index.html          # Main HTML file
├── style.css           # Modern CSS styling
├── app.js              # JavaScript glue code
├── build.sh            # Build script
├── package.json        # npm configuration
├── Cargo.toml          # Rust dependencies
└── README.md           # This file
```

## 🎮 How to Play

1. **Start**: Click on the text area or start typing to begin
2. **Type**: Type the displayed sentence as accurately as possible
3. **Monitor**: Watch your real-time WPM and accuracy stats
4. **Complete**: Finish the sentence to see your final results
5. **Repeat**: Click "New Sentence" to try again with a different sentence

## 🏗️ Architecture

### Rust Core (`src/lib.rs`)
- **Sentence Generation**: Random selection from curated sentence list
- **Timer Management**: Precise timing using JavaScript Date API
- **Statistics Calculation**: Real-time WPM and accuracy computation
- **Game State**: Complete game state management

### WebAssembly Interface
- **wasm-bindgen**: Seamless Rust-JavaScript interop
- **Efficient**: Minimal overhead between Rust and JavaScript
- **Type-safe**: Strongly typed interface between languages

### Frontend (HTML/CSS/JS)
- **Modern CSS**: CSS Grid, Flexbox, custom properties, animations
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: Proper focus management and keyboard navigation
- **Performance**: Efficient DOM manipulation and event handling

## 🎨 Features in Detail

### Real-time Visual Feedback
- Green highlighting for correct characters
- Red highlighting for incorrect characters
- Animated cursor following typing progress
- Smooth transitions and hover effects

### Statistics Tracking
- **WPM Calculation**: Based on standard 5-character word length
- **Accuracy**: Percentage of correctly typed characters
- **Timer**: Real-time elapsed time display
- **Final Results**: Complete statistics modal upon completion

### User Experience
- **Auto-focus**: Input field focuses automatically
- **Keyboard Shortcuts**: Quick access to common actions
- **Responsive**: Adapts to different screen sizes
- **Loading States**: Smooth loading experience

## 🔧 Development

### Building
```bash
# Development build
wasm-pack build --target web --out-dir pkg

# Development with auto-serve
npm run dev

# Clean build artifacts
npm run clean
```

### Customization
- **Add Sentences**: Modify the `sentences` vector in `src/lib.rs`
- **Styling**: Customize colors and layout in `style.css`
- **Features**: Extend game logic in Rust or UI in JavaScript

## 📈 Performance

- **WebAssembly**: Near-native performance for game calculations
- **Efficient Rendering**: Minimal DOM manipulation
- **Small Bundle**: Optimized WebAssembly binary
- **Fast Loading**: Efficient asset loading and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for learning and development!

## 🙏 Acknowledgments

- Built with [Rust](https://www.rust-lang.org/) and [WebAssembly](https://webassembly.org/)
- Uses [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) for Rust-JS interop
- Styled with modern CSS and [Inter font](https://rsms.me/inter/)

---

**Happy Typing!** 🎯