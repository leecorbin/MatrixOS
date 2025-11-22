/**
 * PiZXel Entry Point
 *
 * Initialize device drivers and display test pattern.
 */

import { DeviceManager } from "./core/device-manager";
import { TerminalDisplayDriver } from "./drivers/display/terminal-display";
import { KeyboardInputDriver } from "./drivers/input/keyboard-input";

async function main() {
  console.log("PiZXel v0.1.0 - Initializing...\n");

  // Create device manager
  const deviceManager = new DeviceManager();

  // Register available drivers
  deviceManager.registerDisplayDriver(TerminalDisplayDriver);
  deviceManager.registerInputDriver(KeyboardInputDriver);

  // Initialize devices
  try {
    await deviceManager.initialize();
  } catch (error) {
    console.error("Failed to initialize devices:", error);
    process.exit(1);
  }

  const display = deviceManager.getDisplay();

  // Draw test pattern
  console.log("\nDrawing test pattern...\n");

  // Gradient pattern
  for (let y = 0; y < 192; y++) {
    for (let x = 0; x < 256; x++) {
      const r = Math.floor((x / 256) * 255);
      const g = Math.floor((y / 192) * 255);
      const b = 128;
      display.setPixel(x, y, [r, g, b]);
    }
  }

  display.show();

  console.log("\nTest pattern displayed!");
  console.log("Press Ctrl+C to exit\n");

  // Set up input handler
  deviceManager.onInput((event) => {
    console.log(`\nKey pressed: ${event.key}`);

    if (event.key === "Escape") {
      console.log("Exiting...");
      deviceManager.shutdown().then(() => process.exit(0));
    }
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch(console.error);
