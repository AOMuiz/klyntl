# Contact Picker Migration Guide

## Overview

The contact picker has been simplified from a routing-based approach with emitters to a simple modal-based hook. This makes it much easier to use and maintain.

## Old Approach (Deprecated)

Previously, you had to use routing and event emitters:

```tsx
import { openContactPicker } from "@/utils/contactPicker";

// This would navigate to a new screen and use emitters
openContactPicker({
  existingPhones: ["08123456789"],
  maxSelection: 10,
  onContactsSelected: (contacts) => {
    console.log("Selected contacts:", contacts);
  },
});
```

## New Approach (Recommended)

Now you simply use a hook and render the modal component:

```tsx
import { useContactPicker, ProcessedContact } from "@/components/ContactPicker";

function MyComponent() {
  const { showContactPicker, ContactPickerComponent } = useContactPicker();

  const handleSelectContacts = () => {
    showContactPicker({
      existingPhones: ["08123456789"],
      maxSelection: 10,
      onContactsSelected: (contacts: ProcessedContact[]) => {
        console.log("Selected contacts:", contacts);
        // Handle the selected contacts here
      },
    });
  };

  return (
    <View>
      <Button onPress={handleSelectContacts}>Select Contacts</Button>

      {/* This renders the modal when needed */}
      <ContactPickerComponent />
    </View>
  );
}
```

## Benefits

1. **No routing complexity** - The contact picker is now a modal overlay instead of a full screen navigation
2. **No event emitter** - Direct callback handling through the hook
3. **Better React integration** - Uses standard React patterns (hooks, components)
4. **Easier to manage state** - No need to worry about navigation state or cleanup
5. **Better TypeScript support** - Full type safety with proper interfaces

## Migration Steps

1. Replace `import { openContactPicker } from "@/utils/contactPicker"` with `import { useContactPicker } from "@/components/ContactPicker"`
2. Use the `useContactPicker()` hook in your component
3. Replace `openContactPicker(options)` calls with `showContactPicker(options)`
4. Add `<ContactPickerComponent />` to your JSX
5. Remove any navigation-related imports if they were only used for the contact picker

## Hook API

```tsx
const { showContactPicker, hideContactPicker, ContactPickerComponent } =
  useContactPicker();
```

- `showContactPicker(options)` - Opens the contact picker modal
- `hideContactPicker()` - Manually close the modal (usually not needed)
- `ContactPickerComponent` - React component to render in your JSX

## Options

```tsx
interface ContactPickerOptions {
  existingPhones?: string[]; // Phone numbers to exclude from selection
  maxSelection?: number; // Maximum number of contacts to select (default: 100)
  onContactsSelected: (contacts: ProcessedContact[]) => void; // Callback when contacts are selected
}
```

## ProcessedContact Interface

```tsx
interface ProcessedContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  initials: string;
  isValid: boolean;
  isDuplicate: boolean;
}
```
