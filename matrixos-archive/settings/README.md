# MatrixOS Settings

This directory contains user-configurable settings for MatrixOS.

## Configuration Files

### `config/system_config.json` - Main Configuration

This is your personal configuration file. Edit this to customize MatrixOS behavior.
**Note:** This file is auto-created on first run from `matrixos/system_config.json` template.

#### Display Driver Configuration

The most important setting for getting started is the **display driver**:

```json
"display": {
  "driver": "auto",
  "driver_override": null,
  ...
}
```

**Auto-detection (Recommended)**

Set `"driver": "auto"` to automatically select the best display driver for your platform:

- **macOS** → `macos_window` (Pygame window, requires: `pip install pygame`)
- **Linux/Raspberry Pi** → `terminal` or `hdmi` (when available)
- **Fallback** → `terminal` (ANSI color terminal, works everywhere)

**Manual Driver Selection**

To force a specific driver, set `driver_override`:

```json
"display": {
  "driver": "auto",
  "driver_override": "terminal"
}
```

Available drivers:

| Driver         | Platform     | Description                    | Dependencies |
| -------------- | ------------ | ------------------------------ | ------------ |
| `terminal`     | All          | ANSI color terminal display    | None         |
| `macos_window` | macOS        | Native Pygame window (512×384) | pygame       |
| `hdmi`         | Raspberry Pi | HDMI output                    | TBD          |
| `led_matrix`   | Raspberry Pi | LED Matrix HAT                 | TBD          |

**Display Scale**

For window-based drivers (macos_window), adjust the pixel scale:

```json
"display": {
  ...
  "scale": 2
}
```

- `scale: 2` → 256×192 LED matrix appears as 512×384 window
- `scale: 3` → 256×192 LED matrix appears as 768×576 window
- `scale: 4` → 256×192 LED matrix appears as 1024×768 window

#### Example Configurations

**Development on Mac**

```json
{
  "display": {
    "driver": "auto",
    "driver_override": null,
    "scale": 2
  }
}
```

Result: Automatic Pygame window at 512×384

**Terminal-only Mode**

```json
{
  "display": {
    "driver": "auto",
    "driver_override": "terminal"
  }
}
```

Result: Forces ANSI terminal display (useful for SSH/remote development)

**Raspberry Pi with LED Matrix**

```json
{
  "display": {
    "driver": "auto",
    "driver_override": "led_matrix"
  }
}
```

Result: Direct LED matrix output (when driver is implemented)

#### Bluetooth Device Configuration

For Recreated Spectrum keyboard and other Bluetooth input devices:

```json
"bluetooth": {
  "auto_discover_on_boot": true,
  "pairing_timeout": 30,
  "scan_interval": 5
}
```

Set `auto_discover_on_boot: false` to skip automatic device scanning on startup.

#### Boot Logo

Disable the boot animation:

```json
"boot": {
  "show_logo": false
}
```

## Directory Structure

```
settings/
├── config/
│   └── system_config.json   # Your main configuration (auto-created)
├── cache/
│   └── emoji/               # Downloaded emoji sprites
└── logs/
    └── *.log                # Application logs
```

## Quick Start

1. **First time setup**

   ```bash
   # Install pygame for macOS window support
   pip install pygame

   # Run MatrixOS
   python3 start.py
   ```

2. **Edit configuration**

   ```bash
   # File is auto-created on first run
   # Open in your editor
   nano settings/config/system_config.json

   # Or use VS Code
   code settings/config/system_config.json
   ```

3. **Apply changes**
   Changes take effect the next time you run MatrixOS:
   ```bash
   python3 start.py
   ```

## Troubleshooting

**"No pygame window appears"**

- Install pygame: `pip install pygame`
- Check `driver_override` isn't forcing terminal mode
- Verify auto-detection with: `python3 -c "import platform; print(platform.system())"`

**"Terminal display looks wrong"**

- Ensure your terminal supports ANSI color (most modern terminals do)
- Try a different terminal emulator (iTerm2, Alacritty, etc.)
- Increase terminal window size to at least 128 columns

**"Want to switch between window and terminal"**

- Edit `settings/config/system_config.json`
- Set `"driver_override": "terminal"` or `"driver_override": "macos_window"`
- Restart MatrixOS

**Note:** Pygame is optional! If not installed, MatrixOS automatically falls back to terminal display which works everywhere with zero dependencies.

## See Also

- `docs/DEVICE_DRIVER_ARCHITECTURE.md` - Complete driver system documentation
- `docs/API_REFERENCE.md` - Full API reference
- `matrixos/system_config.json` - Template/default configuration
