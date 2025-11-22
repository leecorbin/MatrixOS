/**
 * Keyboard Input Driver
 *
 * Standard keyboard input via stdin (always available).
 */

import { InputDriver } from "../base/device-driver";
import { InputEvent } from "../../types";
import * as readline from "readline";

export class KeyboardInputDriver extends InputDriver {
  readonly priority = 50; // Medium priority - fallback option
  readonly name = "Keyboard Input";

  private rl: readline.Interface | null = null;

  async initialize(): Promise<void> {
    // Set up raw mode for key capture
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    // Listen for key presses
    process.stdin.on("data", this.handleKeyPress.bind(this));

    console.log("Keyboard input initialized");
  }

  async shutdown(): Promise<void> {
    process.stdin.removeAllListeners("data");

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  async isAvailable(): Promise<boolean> {
    // Keyboard is always available if stdin exists
    return process.stdin !== undefined;
  }

  private handleKeyPress(key: string): void {
    // Map key codes to event keys
    let eventKey: string;

    switch (key) {
      case "\u001b[A":
        eventKey = "ArrowUp";
        break;
      case "\u001b[B":
        eventKey = "ArrowDown";
        break;
      case "\u001b[C":
        eventKey = "ArrowRight";
        break;
      case "\u001b[D":
        eventKey = "ArrowLeft";
        break;
      case "\r":
      case "\n":
        eventKey = "Enter";
        break;
      case " ":
        eventKey = " ";
        break;
      case "\u007f":
      case "\b":
        eventKey = "Backspace";
        break;
      case "\u001b":
        eventKey = "Escape";
        break;
      case "\t":
        eventKey = "Tab";
        break;
      case "\u0003": // Ctrl+C
        console.log("\nExiting...");
        process.exit(0);
        return;
      default:
        // Single character key
        if (key.length === 1) {
          eventKey = key;
        } else {
          // Unknown escape sequence
          return;
        }
    }

    const event: InputEvent = {
      key: eventKey,
      type: "keydown",
      timestamp: Date.now(),
      source: "keyboard",
    };

    this.emitEvent(event);
  }
}
