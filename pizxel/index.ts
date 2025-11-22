/**
 * PiZXel Entry Point
 *
 * Initialize device drivers, app framework, and launcher.
 */

import { DeviceManager } from "./core/device-manager";
import { AppFramework } from "./core/app-framework";
import { TerminalDisplayDriver } from "./drivers/display/terminal-display";
import { KeyboardInputDriver } from "./drivers/input/keyboard-input";
import { LauncherApp } from "./apps/launcher";
import { TestApp } from "./apps/test-app";
import { ClockApp } from "./apps/clock";

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

  // Create app framework with app registry
  const appFramework = new AppFramework(deviceManager);

  // Create apps
  const clockApp = new ClockApp();
  const testApp = new TestApp();

  // Create launcher and register apps
  const launcher = new LauncherApp(appFramework);
  launcher.registerApp("Clock", "⏰", [255, 255, 0], clockApp);
  launcher.registerApp("Test", "🎮", [0, 255, 0], testApp);

  // Set launcher for ESC key handling
  appFramework.setLauncher(launcher);

  // Launch launcher
  appFramework.switchToApp(launcher);
  console.log("\n=== PiZXel OS Launched ===");
  console.log("Controls:");
  console.log("  Arrow keys: Navigate launcher");
  console.log("  Enter/Space: Launch app");
  console.log("  ESC: Return to launcher / Exit\n");

  // Start event loop
  await appFramework.run();
}

main().catch(console.error);
