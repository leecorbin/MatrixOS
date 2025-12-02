/**
 * PiZXel Entry Point
 *
 * Initialize device drivers, app framework, and launcher.
 *
 * Usage:
 *   npm start              - Auto-detect best display (framebuffer → canvas → terminal)
 *   npm start -- --canvas  - Force canvas HTTP display
 *   npm start -- --fb      - Force framebuffer display
 *   npm start -- --term    - Force terminal display
 */

import { DeviceManager } from "./core/device-manager";
import { AppFramework } from "./core/app-framework";
import { AppScanner } from "./core/app-scanner";
import { TerminalDisplayDriver } from "./drivers/display/terminal-display";
import { CanvasDisplayDriver } from "./drivers/display/canvas-display-driver";
import { FramebufferDisplayDriver } from "./drivers/display/framebuffer-display";
import { KeyboardInputDriver } from "./drivers/input/keyboard-input";
import { LauncherApp } from "./apps/launcher";
import { WebAudioDriver } from "./audio/web-audio-driver";
import { CanvasAudioDriver } from "./audio/canvas-audio-driver";
import { Audio } from "./audio/audio";

// Global audio instance (accessible to all apps)
let globalAudio: Audio | null = null;
let globalAppFramework: AppFramework | null = null;

export function getAudio(): Audio | null {
  return globalAudio;
}

export function getAppFramework(): AppFramework | null {
  return globalAppFramework;
}

async function main() {
  console.log(`PiZXel v0.1.0\n`);

  // Parse display mode flags
  const forceCanvas = process.argv.includes("--canvas");
  const forceFramebuffer = process.argv.includes("--fb");
  const forceTerminal = process.argv.includes("--term");

  // Create device manager
  const deviceManager = new DeviceManager();

  // Register display drivers based on mode
  if (forceTerminal) {
    // Force terminal mode
    console.log("Display mode: Terminal (forced)\n");
    deviceManager.registerDisplayDriver(TerminalDisplayDriver);
  } else if (forceCanvas) {
    // Force canvas mode
    console.log("Display mode: Canvas (forced)\n");
    deviceManager.registerDisplayDriver(CanvasDisplayDriver);
  } else if (forceFramebuffer) {
    // Force framebuffer mode
    console.log("Display mode: Framebuffer (forced)\n");
    deviceManager.registerDisplayDriver(FramebufferDisplayDriver);
  } else {
    // Auto-detect: Register all drivers, DeviceManager selects by priority
    console.log("Display mode: Auto-detect (priority: framebuffer → canvas → terminal)\n");
    deviceManager.registerDisplayDriver(FramebufferDisplayDriver); // Priority 90
    deviceManager.registerDisplayDriver(CanvasDisplayDriver);      // Priority 80
    deviceManager.registerDisplayDriver(TerminalDisplayDriver);    // Priority 50
  }

  deviceManager.registerInputDriver(KeyboardInputDriver);

  // Initialize devices (auto-selects best available driver)
  try {
    await deviceManager.initialize();
  } catch (error) {
    console.error("Failed to initialize devices:", error);
    process.exit(1);
  }

  // Detect which display driver was selected
  const display = deviceManager.getDisplay();
  const useCanvas = display instanceof CanvasDisplayDriver;
  console.log(`Selected display driver: ${display.name}\n`);

  // Initialize audio driver (after display, so we can get canvas server)
  console.log("Initializing audio...");
  if (useCanvas) {
    const server = display.getServer();
    console.log(`Canvas server obtained: ${server ? "YES" : "NO"}`);
    const audioDriver = new CanvasAudioDriver(server);
    await audioDriver.initialize();
    globalAudio = new Audio(audioDriver);
    console.log(
      `Audio: Canvas mode (browser-based) - ${
        globalAudio.isAvailable() ? "AVAILABLE" : "NOT AVAILABLE"
      }`
    );
  } else {
    // Terminal/Framebuffer mode: No audio for now (would need speaker package)
    console.log(
      `Audio: Not available in terminal/framebuffer mode (TODO: add speaker package support)`
    );
    globalAudio = null;
  }

  // If canvas mode, setup keyboard forwarding from browser
  if (useCanvas) {
    const inputDriver = deviceManager.getInput();
    display.getServer().onKey((key: string) => {
      // Forward keyboard events from browser to input driver
      (inputDriver as any).injectKey(key);
    });
  }

  // Create app framework with app registry
  const appFramework = new AppFramework(deviceManager);
  globalAppFramework = appFramework;

  // Load and apply saved brightness setting
  const { AppStorage } = await import("./storage");
  const settingsStorage = new AppStorage("settings");
  const brightnessStr = settingsStorage.get("brightness");
  if (brightnessStr) {
    const brightness = parseInt(brightnessStr);
    const display = deviceManager.getDisplay();
    if (display && typeof (display as any).setBrightness === 'function') {
      (display as any).setBrightness(brightness);
      console.log(`Display brightness set to ${brightness}%`);
    }
  }

  // Create launcher
  const launcher = new LauncherApp(appFramework);

  // Scan and load apps
  console.log("Scanning for apps...");
  const scanner = new AppScanner();
  const scannedApps = await scanner.scanAll();

  // Register scanned apps with launcher
  for (const app of scannedApps) {
    const color = app.config.color || [255, 255, 255];
    const category = app.config.category; // Get category from config
    await launcher.registerApp(
      app.config.name,
      app.config.icon,
      color as [number, number, number],
      app.instance,
      category
    );
  }

  console.log(`Loaded ${scannedApps.length} app(s)`);

  // Set launcher for ESC key handling
  appFramework.setLauncher(launcher);

  // Launch launcher (await to ensure emojis load before first render)
  await appFramework.switchToApp(launcher);
  console.log("=== PiZXel OS Launched ===");
  console.log("Controls:");
  console.log("  Arrow keys: Navigate launcher");
  console.log("  Enter/Space: Launch app");
  console.log("  ESC: Return to launcher / Exit");
  if (useCanvas) {
    console.log(`  Browser: http://localhost:3001`);
  }
  console.log();

  // Cleanup on exit
  const cleanup = async () => {
    console.log("\nShutting down...");
    await deviceManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Start event loop
  await appFramework.run();
}

main().catch(console.error);
