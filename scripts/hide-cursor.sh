#!/bin/bash
# Hide console cursor permanently (run before PiZXel)

# Disable cursor blinking
echo 0 | sudo tee /sys/class/graphics/fbcon/cursor_blink > /dev/null

# Hide cursor via setterm
setterm -cursor off -blank 0

echo "Console cursor disabled. Run 'setterm -cursor on' to restore."
