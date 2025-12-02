#!/bin/bash
# Clear framebuffer and reset console

# Clear framebuffer to black
dd if=/dev/zero of=/dev/fb0 bs=768000 count=1 2>/dev/null

# Reset terminal
clear
reset
setterm -cursor on

echo "Display cleared and console reset."
