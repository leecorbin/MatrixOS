#!/usr/bin/env python3
"""Test input handling"""

import sys
sys.path.insert(0, '.')

from matrixos.input import KeyboardInput, InputEvent

print("Press keys to test (Ctrl+C to exit):")
print("Try: c, C, ESC, Backspace, Arrow keys")
print("-" * 40)

with KeyboardInput() as input_handler:
    while True:
        try:
            event = input_handler.get_key(timeout=0.1)
            if event:
                print(f"Got: key='{event.key}' raw='{repr(event.raw)}'")
                
                if event.key == 'c' or event.key == 'C':
                    print("  -> This is the 'C' key")
                elif event.key == InputEvent.HOME:
                    print("  -> This is HOME (ESC)")
                elif event.key == InputEvent.BACK:
                    print("  -> This is BACK (Backspace)")
                elif event.key == InputEvent.QUIT:
                    print("  -> This is QUIT")
                    break
                    
        except KeyboardInterrupt:
            print("\nExiting...")
            break
