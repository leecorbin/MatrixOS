/**
 * TabView Component
 *
 * Multi-tab interface with keyboard navigation.
 * Switch tabs with Left/Right arrows or number keys.
 */

import { Widget, WidgetOptions } from "../core/widget";
import { Container } from "../core/container";
import { DisplayBuffer } from "../../core/display-buffer";
import { InputEvent, InputKeys, RGB } from "../../types/index";

export interface Tab {
  id: string;
  label: string;
  content: Container;
}

export interface TabViewOptions extends WidgetOptions {
  tabs: Tab[];
  activeTabId?: string;
  tabHeight?: number;
  backgroundColor?: RGB;
  activeColor?: RGB;
  inactiveColor?: RGB;
  textColor?: RGB;
  activeTextColor?: RGB;
}

export class TabView extends Widget {
  private tabs: Tab[];
  private activeTabIndex = 0;
  private tabHeight: number;
  private backgroundColor: RGB;
  private activeColor: RGB;
  private inactiveColor: RGB;
  private textColor: RGB;
  private activeTextColor: RGB;

  constructor(options: TabViewOptions) {
    super(options);
    this.tabs = options.tabs;
    this.tabHeight = options.tabHeight ?? 20;
    this.backgroundColor = options.backgroundColor ?? [20, 20, 20];
    this.activeColor = options.activeColor ?? [60, 120, 200];
    this.inactiveColor = options.inactiveColor ?? [40, 40, 40];
    this.textColor = options.textColor ?? [150, 150, 150];
    this.activeTextColor = options.activeTextColor ?? [255, 255, 255];

    // Set initial active tab
    if (options.activeTabId) {
      const index = this.tabs.findIndex((t) => t.id === options.activeTabId);
      if (index >= 0) this.activeTabIndex = index;
    }

    this.updateContentPositions();
  }

  /**
   * Update content container positions to be below tabs
   */
  private updateContentPositions(): void {
    const contentY = this.y + this.tabHeight;
    const contentHeight = this.height - this.tabHeight;

    this.tabs.forEach((tab) => {
      tab.content.x = this.x;
      tab.content.y = contentY;
      tab.content.width = this.width;
      tab.content.height = contentHeight;
    });
  }

  /**
   * Handle input events for tab switching
   */
  handleEvent(event: InputEvent): boolean {
    // Left arrow - previous tab
    if (event.key === InputKeys.LEFT) {
      if (this.activeTabIndex > 0) {
        this.activeTabIndex--;
        return true;
      }
    }

    // Right arrow - next tab
    if (event.key === InputKeys.RIGHT) {
      if (this.activeTabIndex < this.tabs.length - 1) {
        this.activeTabIndex++;
        return true;
      }
    }

    // Number keys 1-9 for direct tab access
    if (event.key >= "1" && event.key <= "9") {
      const index = parseInt(event.key) - 1;
      if (index >= 0 && index < this.tabs.length) {
        this.activeTabIndex = index;
        return true;
      }
    }

    // Forward event to active tab's content
    const activeTab = this.tabs[this.activeTabIndex];
    if (activeTab.content.handleEvent) {
      return activeTab.content.handleEvent(event);
    }

    return false;
  }

  /**
   * Update active tab content (if it has an update method)
   */
  update(deltaTime: number): void {
    const activeTab = this.tabs[this.activeTabIndex];
    if (
      activeTab.content &&
      typeof (activeTab.content as any).update === "function"
    ) {
      (activeTab.content as any).update(deltaTime);
    }
  }

  /**
   * Render tab bar and active content (implements Widget abstract method)
   */
  protected renderSelf(matrix: DisplayBuffer): void {
    // Clear background
    matrix.rect(
      this.x,
      this.y,
      this.width,
      this.height,
      this.backgroundColor,
      true
    );

    // Render active tab content first (Container base class handles clipping)
    const activeTab = this.tabs[this.activeTabIndex];
    activeTab.content.render(matrix);

    // Render tab bar AFTER content (so it's always on top)
    this.renderTabBar(matrix);
  }

  /**
   * Render the tab bar at the top
   */
  private renderTabBar(matrix: DisplayBuffer): void {
    const tabWidth = Math.floor(this.width / this.tabs.length);

    this.tabs.forEach((tab, index) => {
      const isActive = index === this.activeTabIndex;
      const tabX = this.x + index * tabWidth;
      const tabY = this.y;

      // Tab background
      const bgColor = isActive ? this.activeColor : this.inactiveColor;
      matrix.rect(tabX, tabY, tabWidth, this.tabHeight, bgColor, true);

      // Tab border (right edge except last tab)
      if (index < this.tabs.length - 1) {
        matrix.line(
          tabX + tabWidth,
          tabY,
          tabX + tabWidth,
          tabY + this.tabHeight,
          [80, 80, 80]
        );
      }

      // Tab label (centered with proper 8px char width, clipped if needed)
      const textColor = isActive ? this.activeTextColor : this.textColor;
      const textWidth = tab.label.length * 8;
      const textX = tabX + Math.floor((tabWidth - textWidth) / 2);
      const textY = tabY + Math.floor((this.tabHeight - 8) / 2);

      // Only draw text if it fits within tab bounds
      if (textX >= tabX && textX + textWidth <= tabX + tabWidth) {
        matrix.text(tab.label, textX, textY, textColor);
      } else {
        // Truncate label if too long
        const maxChars = Math.floor((tabWidth - 4) / 8);
        if (maxChars > 0) {
          const truncated = tab.label.substring(0, maxChars);
          matrix.text(truncated, tabX + 2, textY, textColor);
        }
      }

      // Active indicator (bottom line)
      if (isActive) {
        matrix.line(
          tabX + 2,
          tabY + this.tabHeight - 1,
          tabX + tabWidth - 2,
          tabY + this.tabHeight - 1,
          [100, 180, 255]
        );
      }
    });
  }

  /**
   * Switch to a tab by ID
   */
  switchToTab(tabId: string): boolean {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index >= 0) {
      this.activeTabIndex = index;
      return true;
    }
    return false;
  }

  /**
   * Get current active tab
   */
  getActiveTab(): Tab {
    return this.tabs[this.activeTabIndex];
  }

  /**
   * Add a new tab
   */
  addTab(tab: Tab): void {
    this.tabs.push(tab);
    this.updateContentPositions();
  }

  /**
   * Remove a tab by ID
   */
  removeTab(tabId: string): boolean {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index >= 0 && this.tabs.length > 1) {
      this.tabs.splice(index, 1);
      if (this.activeTabIndex >= this.tabs.length) {
        this.activeTabIndex = this.tabs.length - 1;
      }
      this.updateContentPositions();
      return true;
    }
    return false;
  }
}
