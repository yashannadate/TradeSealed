#!/usr/bin/env bash
export PATH="$HOME/.local/bin:$PATH"
grep -q "\.local/bin" "$HOME/.bashrc" || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
cd "$HOME/TradeSealed"
export PATH="$HOME/.local/bin:$PATH"
npm install
node -v
