# Klyntl Theme Colors Usage Guide

## 🚨 Dark Mode Fix Applied

**Problem**: Header text in the homepage was using hardcoded gray colors that didn't adapt to dark mode:

```typescript
// ❌ OLD - Hardcoded, doesn't adapt to dark mode
color: colors.neutral.gray600; // Invisible in dark mode
color: colors.neutral.gray900; // Invisible in dark mode
```

**Solution**: Use adaptive theme colors that automatically adjust for light/dark mode:

```typescript
// ✅ NEW - Adaptive theme colors
color: theme.colors.onSurfaceVariant; // Medium contrast text
color: theme.colors.onBackground; // High contrast text
```

## When to Use Each Color Type

### 1. **Adaptive Theme Colors** (Recommended for text)

Use these for text and UI elements that need to adapt to light/dark mode:

```typescript
// High contrast text (primary content)
theme.colors.onBackground; // Main text on background
theme.colors.onSurface; // Text on cards/surfaces

// Medium contrast text (secondary content)
theme.colors.onSurfaceVariant; // Secondary text, labels
theme.colors.onPrimaryContainer; // Text on colored backgrounds

// Low contrast text (tertiary content)
theme.colors.outline; // Borders, dividers
theme.colors.outlineVariant; // Subtle borders
```

### 2. **Direct Brand Shades** (For specific design needs)

Use these when you need specific shades regardless of theme:

```typescript
// Always light (for dark backgrounds)
colors.primary[100]; // Very light emerald
colors.neutral.gray100; // Very light gray

// Always medium (consistent across themes)
colors.primary[500]; // Medium emerald
colors.neutral.gray500; // Medium gray

// Always dark (for light backgrounds)
colors.primary[900]; // Very dark emerald
colors.neutral.gray900; // Very dark gray
```

### 3. **Semantic Colors** (For status and meaning)

Use these for consistent meaning across themes:

```typescript
// Status colors (automatically adapt)
theme.colors.primary; // Brand actions
theme.colors.secondary; // Secondary actions
theme.colors.error; // Errors, destructive actions
colors.custom.success; // Success states
colors.custom.warning; // Warning states
```

## Color Contrast Examples

### ✅ Good Contrast (Adaptive)

```typescript
// Light mode: dark text on light background
// Dark mode: light text on dark background
<Text style={{ color: theme.colors.onBackground }}>
  Main content text
</Text>

// Light mode: medium gray text
// Dark mode: light gray text
<Text style={{ color: theme.colors.onSurfaceVariant }}>
  Secondary text
</Text>
```

### ❌ Poor Contrast (Fixed colors)

```typescript
// BAD: Always gray600, invisible in dark mode
<Text style={{ color: colors.neutral.gray600 }}>
  Invisible in dark mode
</Text>

// BAD: Always gray900, invisible in dark mode
<Text style={{ color: colors.neutral.gray900 }}>
  Also invisible in dark mode
</Text>
```

## Quick Reference

| Use Case         | Light Mode  | Dark Mode   | Use This                        |
| ---------------- | ----------- | ----------- | ------------------------------- |
| Main text        | Dark gray   | Light gray  | `theme.colors.onBackground`     |
| Secondary text   | Medium gray | Light gray  | `theme.colors.onSurfaceVariant` |
| Card backgrounds | White       | Dark gray   | `theme.colors.surface`          |
| Page backgrounds | Light gray  | Very dark   | `theme.colors.background`       |
| Brand elements   | Emerald     | Emerald     | `theme.colors.primary`          |
| Success states   | Green       | Light green | `colors.custom.success`         |
| Error states     | Red         | Light red   | `theme.colors.error`            |

## Testing Your Colors

To ensure your colors work in both modes:

1. **Switch between light/dark mode** in your device settings
2. **Check all text is readable** against its background
3. **Verify brand colors maintain consistency**
4. **Test interactive states** (pressed, focused, disabled)

The fix applied to the homepage ensures the header text is now properly visible in both light and dark modes! 🎉
