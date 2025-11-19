"""
macOS Window Display Driver

Uses Pygame to create a native window displaying the LED matrix.
Pixels are scaled 2x for better visibility (256x192 -> 512x384 window).
"""

import pygame
from typing import Tuple
from ..base import DisplayDriver


class MacOSWindowDriver(DisplayDriver):
    """Pygame-based window display for macOS development"""
    
    def __init__(self, width: int = 256, height: int = 192, scale: int = 2):
        super().__init__(width, height)
        self.name = "macOS Window (Pygame)"
        self.platform = "macos"
        self.scale = scale  # Scale pixels for visibility
        self.window_width = width * scale
        self.window_height = height * scale
        self.screen = None
        self.buffer = None
        
    def initialize(self) -> bool:
        """Initialize Pygame window"""
        try:
            pygame.init()
            self.screen = pygame.display.set_mode((self.window_width, self.window_height))
            pygame.display.set_caption("MatrixOS - ZX Spectrum Edition")
            
            # Create pixel buffer
            self.buffer = [[(0, 0, 0) for _ in range(self.width)] for _ in range(self.height)]
            
            # Clear to black
            self.clear()
            self.show()
            
            return True
        except Exception as e:
            print(f"[MacOSWindowDriver] Failed to initialize: {e}")
            return False
    
    def set_pixel(self, x: int, y: int, color: Tuple[int, int, int]):
        """Set pixel in buffer"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.buffer[y][x] = color
    
    def clear(self):
        """Clear buffer to black"""
        for y in range(self.height):
            for x in range(self.width):
                self.buffer[y][x] = (0, 0, 0)
    
    def show(self):
        """
        Render buffer to Pygame window.
        Each LED pixel is drawn as a scaled rectangle.
        """
        if self.screen is None:
            return
        
        # Process Pygame events to keep window responsive
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                # Don't handle quit here - let the input system handle it
                pass
        
        # Draw each pixel as a scaled rectangle
        for y in range(self.height):
            for x in range(self.width):
                color = self.buffer[y][x]
                rect = pygame.Rect(
                    x * self.scale,
                    y * self.scale,
                    self.scale,
                    self.scale
                )
                pygame.draw.rect(self.screen, color, rect)
        
        pygame.display.flip()
    
    def cleanup(self):
        """Cleanup Pygame"""
        if pygame.get_init():
            pygame.quit()
    
    @classmethod
    def is_available(cls) -> bool:
        """Check if Pygame is available"""
        try:
            import pygame
            return True
        except ImportError:
            return False
    
    @classmethod
    def get_priority(cls) -> int:
        """
        Priority: 50 (higher than terminal fallback)
        This is preferred on macOS for development.
        """
        return 50
    
    @classmethod
    def get_platform_preference(cls) -> str:
        """This driver is preferred on macOS"""
        return "macos"
