#!/usr/bin/env python3
"""
MatrixOS Launcher Entry Point
Starts the MatrixOS launcher application
"""

import sys
import os
from pathlib import Path

# Add matrixos to path
sys.path.insert(0, os.path.dirname(__file__))

from matrixos.led_api import create_matrix
from matrixos.input import KeyboardInput
from matrixos.config import parse_matrix_args
from matrixos.app_framework import OSContext
from matrixos.builtin_apps.launcher import Launcher


def main():
    """MatrixOS launcher entry point."""
    args = parse_matrix_args("MatrixOS Launcher")

    print("\n" + "="*64)
    print("MATRIXOS LAUNCHER")
    print("="*64)
    print(f"\nResolution: {args.width}x{args.height} ({args.color_mode.upper()})")
    print("\nControls:")
    print("  Arrow Keys - Navigate")
    print("  Enter      - Launch app")
    print("  ESC/Q      - Exit")
    print("\n" + "="*64 + "\n")

    # Create matrix
    matrix = create_matrix(args.width, args.height, args.color_mode)

    # Get project root directory
    project_root = Path(__file__).parent

    # Run launcher
    with KeyboardInput() as input_handler:
        # Create OS context for framework apps
        os_context = OSContext(matrix, input_handler)

        launcher = Launcher(matrix, input_handler, os_context, apps_base_dir=project_root)

        if len(launcher.apps) == 0:
            print("No apps found! Create an app folder with main.py and config.json.")
            return

        print(f"Found {len(launcher.apps)} apps:")
        for app in launcher.apps:
            print(f"  - {app.name} (v{app.version}) by {app.author}")
        print()

        launcher.run()

    # Clean exit
    print("\n" + "="*64)
    print("MatrixOS Launcher exited.")
    print("="*64 + "\n")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting MatrixOS Launcher.")
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
