# 🦀 Rust Typing Speed Game

A modern, fast typing speed game built with Rust compiled to WebAssembly and a beautiful HTML/CSS interface. Test your typing skills with randomly generated sentences and track your WPM (Words Per Minute) and accuracy in real-time.

## ✨ Features

- 🚀 **High Performance**: Core game logic written in Rust and compiled to WebAssembly
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📊 **Real-time Stats**: Live WPM, accuracy, and timer tracking
- 🎯 **Visual Feedback**: Character-by-character highlighting with correct/incorrect indicators
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- 🌙 **Dark Theme**: Eye-friendly dark mode design
- ⌨️ **Keyboard Shortcuts**: ESC to reset, Ctrl+Enter for new sentence

## 🛠️ Prerequisites

- [Rust](https://rustup.rs/) (latest stable version)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) for building WebAssembly modules
- A local HTTP server (Python's http.server, Node's serve, etc.)

## 🚀 Quick Start

1. **Install wasm-pack** (if not already installed):
   ```bash
   cargo install wasm-pack
   ```

2. **Build the project**:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

3. **Serve the game**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # OR using Node.js serve
   npx serve .
   
   # OR using npm script
   npm run serve
   ```

4. **Open your browser** and navigate to `http://localhost:8000`

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