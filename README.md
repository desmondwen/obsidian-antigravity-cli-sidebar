# Antigravity CLI Sidebar

An [Obsidian](https://obsidian.md/) plugin that embeds **Antigravity CLI** directly into a sidebar pane, so you can chat with Antigravity without leaving your notes.

> [!NOTE]
> **Version 2.0 Update:**
> This version (V2.0) has transitioned to support the new **Antigravity CLI** (`agy`).
> The older V1.0 version was designed for the original **Gemini CLI** (`gemini`). Since Google is deprecating/shutting down Gemini CLI, V2.0 has been fully migrated to support Antigravity CLI and handles automatic migration of your settings.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-blue)
![Obsidian](https://img.shields.io/badge/obsidian-%5E0.15.0-purple)

## Features

- 🚀 Run Antigravity CLI inside Obsidian's sidebar
- ⌨️ Full terminal interaction (typing, scrolling, resizing)
- 🎨 Clean xterm.js-based terminal UI
- ⚙️ Customizable command and arguments
- 💻 Desktop-only (uses Node.js child_process)

## Requirements

Before installing, make sure you have:

1. **Obsidian Desktop** (Windows / macOS / Linux)
2. **Antigravity CLI** installed and available in your system `PATH` as `agy`
   - Install from: https://antigravity.google
3. **Python 3** installed (used for the PTY wrapper)
   - Linux/macOS: `python3`
   - Windows: `python`

## Installation

### Manual Install

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`).
2. Create a folder inside your Vault:
   ```
   <vault>/.obsidian/plugins/antigravity-cli-sidebar/
   ```
3. Copy the three files into that folder.
4. Restart Obsidian.
5. Go to **Settings → Community Plugins**, find **Antigravity CLI Sidebar**, and enable it.

### From Source

```bash
git clone https://github.com/desmondwen/obsidian-antigravity-cli-sidebar.git
cd obsidian-antigravity-cli-sidebar
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your Vault's plugins folder as described above.

## Usage

### Open the Terminal

Once enabled, you can open the Antigravity CLI sidebar in two ways:

1. **Ribbon Icon**: Click the 🤖 **bot icon** in Obsidian's left sidebar.
2. **Command Palette**: Press `Ctrl+P` (or `Cmd+P`) and type **"Open Antigravity CLI"**.

The terminal will appear in the right sidebar, automatically launching:
```bash
agy --dangerously-skip-permissions --continue
```

### Customize Settings

Go to **Settings → Antigravity CLI Settings** to change:

| Setting | Description | Default |
|---------|-------------|---------|
| **Antigravity Command** | Path to the Antigravity CLI executable | `agy` |
| **Default Arguments** | Arguments passed on every launch | `--dangerously-skip-permissions --continue` |

## How It Works

The plugin uses:
- **xterm.js** for the terminal UI inside Obsidian
- A **Python PTY wrapper** (`terminal_pty.py` / `terminal_win.py`) to spawn an interactive TTY
- Node.js `child_process` to bridge the Python wrapper with xterm.js

The terminal uses your **Vault root** as the working directory (`cwd`).

## Uninstall

1. Disable the plugin in **Settings → Community Plugins**.
2. (Optional) Delete the plugin folder:
   ```
   <vault>/.obsidian/plugins/antigravity-cli-sidebar/
   ```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Terminal is blank | Make sure `agy` is installed and in your `PATH`. Test by running `agy` in a normal terminal. |
| "python3" not found | On some systems, only `python` exists. Create a symlink: `ln -s $(which python) /usr/local/bin/python3` |
| Plugin won't enable | Ensure you are on **Obsidian Desktop**; this plugin does not support mobile. |

## Author

**desmond wen**

## License

ISC
