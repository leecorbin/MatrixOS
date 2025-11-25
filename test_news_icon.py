#!/usr/bin/env python3
"""Test to investigate News icon rendering issue"""

import sys
import time
from matrixos.testing import TestRunner

def test_news_icon():
    """Check if News icon is actually rendered in launcher"""
    
    # Start the PiZXel launcher
    print("Starting launcher...")
    runner = TestRunner("pizxel.start", max_duration=15.0)
    
    # Wait for initial render
    runner.wait(2.0)
    
    print(f"\n=== Render Statistics ===")
    print(f"Render count: {runner.display.render_count}")
    print(f"Display size: {runner.display.width}x{runner.display.height}")
    
    # Check top-left corner where News should be (16, 18) according to logs
    print(f"\n=== Checking News Icon Position (16, 18) ===")
    
    # Sample pixels in the News icon area (should be 48x48 icon starting at 16,18)
    news_area_pixels = []
    for y in range(18, 66):  # 48 pixel icon height
        for x in range(16, 64):  # 48 pixel icon width
            pixel = runner.pixel_at(x, y)
            if pixel != (0, 0, 0):  # Non-black
                news_area_pixels.append((x, y, pixel))
    
    print(f"Non-black pixels in News icon area: {len(news_area_pixels)}")
    
    if news_area_pixels:
        print(f"\nSample of non-black pixels (first 10):")
        for x, y, color in news_area_pixels[:10]:
            print(f"  ({x}, {y}): {color}")
    else:
        print("NO non-black pixels found in News icon area!")
    
    # Check the entire top row for any emojis
    print(f"\n=== Checking All Icon Positions ===")
    
    # Icon positions based on logs: col 0-3, row 0
    icon_positions = [
        (16, 18, "News"),      # col 0
        (68, 18, "Games"),     # col 1
        (120, 18, "UI Demo"),  # col 2
        (172, 18, "Test"),     # col 3
    ]
    
    for x, y, name in icon_positions:
        pixels_count = 0
        sample_colors = set()
        for py in range(y, y + 48):
            for px in range(x, x + 48):
                pixel = runner.pixel_at(px, py)
                if pixel != (0, 0, 0):
                    pixels_count += 1
                    sample_colors.add(pixel)
        
        print(f"\n{name} at ({x}, {y}):")
        print(f"  Non-black pixels: {pixels_count}")
        print(f"  Unique colors: {len(sample_colors)}")
        if sample_colors:
            print(f"  Sample colors: {list(sample_colors)[:5]}")
    
    # Check for any emoji-like colors (typical emoji have varied colors)
    print(f"\n=== Color Analysis Across Top Row ===")
    all_colors = set()
    for y in range(18, 66):  # Icon height
        for x in range(16, 224):  # All 4 icons across
            pixel = runner.pixel_at(x, y)
            if pixel != (0, 0, 0):
                all_colors.add(pixel)
    
    print(f"Total unique colors in top row: {len(all_colors)}")
    print(f"Sample colors: {list(all_colors)[:10]}")
    
    # Try to find any sprite-like object that might be the News emoji
    print(f"\n=== Looking for News Emoji Color ===")
    # News emoji (newspaper) typically has black/gray text and white/beige paper
    # Let's look for clusters of varied colors
    
    news_sprite = runner.find_sprite((200, 200, 200), tolerance=30)  # Light colors
    if news_sprite:
        print(f"Found light-colored sprite at: {news_sprite}")
    else:
        print("No light-colored sprite found")
    
    # Check logs for errors
    print(f"\n=== Checking Logs ===")
    logs = runner.read_logs()
    if "News" in logs:
        news_lines = [line for line in logs.split('\n') if 'News' in line]
        print(f"Found {len(news_lines)} log lines mentioning News:")
        for line in news_lines[:20]:
            print(f"  {line}")
    
    # Save a snapshot for visual inspection
    print(f"\n=== Saving Snapshot ===")
    runner.snapshot("news_icon_test")
    print(f"Snapshot saved")
    
    print("\n=== Test Complete ===")
    runner.assert_no_errors_logged()

if __name__ == "__main__":
    try:
        test_news_icon()
        print("\n✓ Test completed successfully")
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
