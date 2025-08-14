#!/bin/bash

# Build script for Rust Typing Game WebAssembly

echo "🦀 Building Rust WebAssembly module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    cargo install wasm-pack
fi

# Build the WebAssembly module
wasm-pack build --target web --out-dir pkg

if [ $? -eq 0 ]; then
    echo "✅ WebAssembly module built successfully!"
    echo "🌐 You can now serve the project with a local server:"
    echo "   python -m http.server 8000"
    echo "   # OR"
    echo "   npx serve ."
    echo ""
    echo "   Then open http://localhost:8000 in your browser"
else
    echo "❌ Build failed!"
    exit 1
fi