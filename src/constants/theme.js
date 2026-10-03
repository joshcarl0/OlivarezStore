/**
 * Olivarez College Mobile App Theme
 * Standardized color palette
 */

export const COLORS = {
  // Brand Greens
  primary: "#0F5D33",        // Deep Forest Green (Primary Brand)
  primaryDark: "#0B4626",    // Darker green for pressed states/status bar
  secondary: "#377445",      // Medium Forest Green (Badges, Secondary actions)
  
  // School Creams & Accents
  accent: "#FBEBB8",         // Soft Warm Pastel Cream / School Gold
  accentSand: "#EBE0BE",     // Warm Sand / Pale Khaki (Cards, containers)
  goldText: "#96751A",       // Readable dark gold for text on light backgrounds
  
  // Alerts & Badges
  danger: "#F10930",         // Crimson Red (Sale, Out of Stock, Delete, Badges)
  dangerLight: "#FFEEF1",    // Soft Pink Tint (Alert/discount background)
  
  // Neutrals & Text
  textMuted: "#8B8B8A",      // Neutral Slate Gray (secondary text, labels, borders)
  textDark: "#1F2937",       // Primary dark text
  textLight: "#FFFFFF",      // White text on dark green/red
  
  // Surfaces
  background: "#F8F9FA",     // Light app background
  cardBg: "#FFFFFF",         // Clean white card surface
  border: "#E5E7EB",         // Subtle card/input border
  borderLight: "#F0F0F0",
};

// Backwards-compatible aliases
export const OC_GREEN = COLORS.primary;
export const OC_DARK_GREEN = COLORS.primaryDark;
export const OC_MEDIUM_GREEN = COLORS.secondary;
export const OC_GOLD = COLORS.accent;
export const OC_LIGHT_BG = COLORS.background;
export const OC_RED = COLORS.danger;
export const OC_RED_LIGHT = COLORS.dangerLight;
export const OC_TEXT_MUTED = COLORS.textMuted;
