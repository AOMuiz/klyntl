# ModalCloseButton Usage Examples

This file shows all the different ways to use the configurable ModalCloseButton component.

## Basic Usage

### Icon Button (Default)

```tsx
<ModalCloseButton />
```

### Custom Icon

```tsx
<ModalCloseButton
  variant="icon"
  iconName="chevron.left"
  iconSize={24}
  iconColor="#007AFF"
/>
```

### Text Button

```tsx
<ModalCloseButton variant="text" text="Close" textColor="#007AFF" />
```

### Cancel Button

```tsx
<ModalCloseButton variant="cancel" text="Cancel" textColor="#FF3B30" />
```

## Advanced Usage

### Custom Close Logic

```tsx
<ModalCloseButton
  onPress={() => {
    // Show confirmation dialog before closing
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", onPress: () => router.back() },
      ]
    );
  }}
/>
```

### With Custom Styling

```tsx
<ModalCloseButton
  variant="text"
  text="Done"
  style={{ marginLeft: 20, padding: 12 }}
/>
```

### Different Icon for Different Contexts

```tsx
<ModalCloseButton
  variant="icon"
  iconName="arrow.down.circle.fill"
  iconColor="#34C759"
/>
```

## Available Props

- `variant`: `"icon"` | `"text"` | `"cancel"` (default: `"icon"`)
- `iconName`: Icon name for icon variant (default: `"xmark"`)
- `iconSize`: Icon size in pixels (default: `20`)
- `iconColor`: Icon color (default: `"#007AFF"`)
- `text`: Text for text/cancel variants (default: `"Cancel"`)
- `textColor`: Text color (default: `"#007AFF"`)
- `style`: Additional styles to apply
- `onPress`: Custom press handler (default: `router.back()`)
