# ZX Spectrum Font Discrepancy Report

This report compares the current `matrixos/font.py` implementation in the **MatrixOS** repository against the authentic ZX Spectrum ROM 8×8 font. It notes where the current glyph definitions diverge from the original and provides recommendations for correction.

## Background

The ZX Spectrum character set includes printable ASCII characters (0x20–0x7F) with a few substitutions: the caret (`^`) is replaced by an up‑arrow (↑), the grave accent (`` ` ``) is replaced by the pound sign (£), and the DEL character (0x7F) displays the copyright sign (©). The character patterns are stored in the ROM at address 0x3D00 as eight bytes per character (one byte per row, MSB on the left). Documentation on the character set notes these substitutions:contentReference[oaicite:0]{index=0}.

The `Font` class in `matrixos/font.py` defines a `charset` dictionary mapping characters to lists of eight bytes. Any differences between these byte lists and the ROM patterns will alter how characters are rendered.

## Summary of Findings

| Area | Current Implementation | Authentic ZX Spectrum | Recommended Fix |
|---|---|---|---|
| **Non‑ASCII substitutions** | The `'^'` entry contains the up‑arrow glyph, but `'£'` and `'©'` are separate entries. There is no definition for the grave accent (`` ` ``) or DEL (`\x7f`). | In the Spectrum ROM, ASCII 0x5E (caret) displays an **up‑arrow** (↑), 0x60 displays the **pound sign** (£) and 0x7F displays the **copyright sign** (©):contentReference[oaicite:1]{index=1}. The grave accent and DEL codes are not used. | Map `'£'` to the **back‑tick** (`` ` ``) character and `'©'` to the **DEL** code (`'\x7f'`). Keep the up‑arrow glyph under the `'^'` key. Remove or repurpose separate `'£'`/`'©'` entries. |
| **Digits** | The patterns for `'0'`, `'2'` and `'3'` differ slightly. For example, `'0'` uses `[0x3C, 0x46, 0x4A, 0x52, 0x62, 0x3C]` instead of `[0x3C, 0x42, 0x4A, 0x52, 0x62, 0x3C]`. | In the ROM, **0** is defined as `0x3C, 0x42, 0x4A, 0x52, 0x62, 0x3C`. **2** and **3** also have specific bit patterns (e.g., `3` has a row of `0x0C` for its mid‑section). | Update the digit definitions to exactly match the ROM:  
  • `'0'`: `[0x3C, 0x42, 0x4A, 0x52, 0x62, 0x3C]`  
  • `'2'`: `[0x3C, 0x42, 0x04, 0x18, 0x20, 0x7E]`  
  • `'3'`: `[0x3C, 0x42, 0x0C, 0x02, 0x42, 0x3C]` |
| **Upper‑case letters** | Most letters are close but a few rows differ. For example, `'K'` ends with `0x42` rather than leaving the bottom row blank. | The ROM glyphs include blank top and bottom rows, with symmetric diagonal strokes for **K**, **M**, **N**, **W**, **X**, **Y** and **Z**. | Compare each glyph against a ROM dump and adjust rows accordingly. Remove extra bottom‑row pixels on **K**; ensure diagonal strokes are symmetric on **M/W/X**; adjust **Y** so its lower half is centred. |
| **Lower‑case letters with descenders** | Characters `'g'`, `'j'`, `'p'`, `'q'` and `'y'` are drawn entirely in the upper seven rows; their descenders do not occupy the bottom row. | In the original font, these letters descend one pixel into the 8th row so that the descender appears below the baseline. | Shift each descender glyph down by one row so that the lowest pixel occupies the 8th byte. This will align the descenders with the authentic font. |
| **Punctuation** | Some punctuation (`,` `;` `'` `"`) use simplified patterns with only one or two pixels. For instance, the semicolon is drawn as `[0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x10, 0x20]`. | The Spectrum ROM uses specific 8‑bit patterns, such as `[0x00, 0x10, 0x00, 0x00, 0x10, 0x10, 0x20]` for `';'`. | Review and replace the punctuation bitmaps to match the ROM definitions. This mostly involves repositioning the dots so they align with the authentic font. |
| **Block graphics** | A handful of block‑graphic characters (`▘▝▖▗▚▞█▀▄`) are included, but the Spectrum defines 16 combinations for the 2×2 quarter blocks. | In the ZX system, code points 0x80–0x8F represent **16** possible quarter‑block combinations. | If full compatibility is desired, add definitions for the remaining quarter‑block characters so that all 16 patterns are available. |

## Recommendations

1. **Align special characters to ZX ROM codes:** Remap the pound sign and copyright sign to the back‑tick (`` ` ``) and DEL slots, respectively, and ensure the up‑arrow is under the caret key. This matches the official character set:contentReference[oaicite:2]{index=2}.
2. **Copy the ROM glyphs verbatim:** Use a ROM dump or reliable reference (e.g. the ZX Spectrum character set page on Wikipedia:contentReference[oaicite:3]{index=3}) to obtain the exact byte patterns. Replace each mismatched glyph in `charset` with the correct byte list.
3. **Verify with the provided sprite sheet:** After updating the byte patterns, render the font onto an 8×8 grid and compare it visually against the authentic sheet supplied (`ZX_Spectrum_character_set.png`) to ensure pixel‑perfect fidelity.
4. **Extend block‑graphic support:** If your application will emulate the full Spectrum character range, consider defining all 16 quarter‑block characters (0x80–0x8F) so that block graphics render correctly.
5. **Document changes:** Include this report (or a summary) in your repository to track which glyphs were updated, and comment each corrected glyph in `font.py` with its ROM address for future reference.

---

*This report was generated on 02 Nov 2025. For more details on the ZX Spectrum character set, see the official documentation and the “ZX Spectrum character set” article on Wikipedia:contentReference[oaicite:4]{index=4}.*
