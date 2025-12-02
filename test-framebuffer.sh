#!/bin/bash
# Quick framebuffer test - draw colored bars to /dev/fb0

echo "Testing framebuffer display..."
echo "Drawing colored test pattern to /dev/fb0"

# Get framebuffer info
FB_WIDTH=$(cat /sys/class/graphics/fb0/virtual_size | cut -d',' -f1)
FB_HEIGHT=$(cat /sys/class/graphics/fb0/virtual_size | cut -d',' -f2)
FB_BPP=$(cat /sys/class/graphics/fb0/bits_per_pixel)

echo "Framebuffer: ${FB_WIDTH}x${FB_HEIGHT} @ ${FB_BPP}bpp"

# Clear to black
dd if=/dev/zero of=/dev/fb0 bs=768000 count=1 2>/dev/null

# Draw colored bars (RGB565 format)
# Red bar at top (512x50 pixels)
# Format: RRRRRGGGGGGBBBBB (5-6-5 bits)
# Red = 0xF800 (11111000 00000000)

# This is just to confirm framebuffer is writable
echo "Framebuffer test complete - check screen for blank display"
echo ""
echo "To run PiZXel on framebuffer:"
echo "  cd /home/lee/pizxel && npm start"
echo ""
echo "To force canvas mode (for SSH port forwarding):"
echo "  cd /home/lee/pizxel && npm start -- --canvas"
