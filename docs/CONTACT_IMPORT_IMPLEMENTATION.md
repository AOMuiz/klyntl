# Customer Contact Import Functionality

## Overview

The Klyntl app now includes a comprehensive contact import feature that allows users to quickly import customers from their phone's contact list. This feature is designed specifically for Nigerian businesses and includes intelligent phone number validation and formatting.

## Features Implemented

### 1. ContactImportButton Component

A reusable component located at `/src/components/ContactImportButton.tsx` that provides multiple variants:

- **FAB (Floating Action Button)**: Small circular button for overlays
- **Button**: Standard button with icon and text
- **Text**: Simple text link

#### Usage Examples:

```tsx
// As a floating action button
<ContactImportButton
  variant="fab"
  size="small"
  onImportComplete={handleImportComplete}
/>

// As a standard button
<ContactImportButton
  variant="button"
  size="medium"
  onImportComplete={handleImportComplete}
/>

// As a text link
<ContactImportButton
  variant="text"
  onImportComplete={handleImportComplete}
/>
```

### 2. Store Integration

The `useCustomerStore` in `/src/stores/customerStore.ts` includes:

- `importFromContacts()` method that returns `{imported: number, skipped: number}`
- Permission handling for contact access
- Phone number validation and formatting
- Duplicate detection
- Import limiting (50 contacts maximum per batch)

### 3. UI Integration

#### Customer List Screen (`/src/app/(tabs)/index.tsx`)

- Import FAB positioned above the main "Add Customer" FAB
- Import button in empty state alongside "Add Customer" button
- Automatic refresh of customer list after import

#### Add Customer Screen (`/src/app/customer/add.tsx`)

- Text link in the help section for importing multiple customers
- Redirects to customer list after successful import

## Technical Implementation

### Phone Number Validation

The system validates and formats Nigerian phone numbers:

```typescript
// Supported formats:
"+2348031234567"; // International format with +
"2348031234567"; // International format without +
"08031234567"; // Local format starting with 0
"8031234567"; // Local format without leading 0 (10 digits)

// Invalid formats (skipped):
"08123456789"; // Invalid prefix (812, 813, etc.)
"12345"; // Too short
"+15551234567"; // Non-Nigerian number
```

### Validation Rules

- Must be a valid Nigerian mobile number (prefixes: 701, 703, 704, 705, 706, 707, 708, 709, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 814, 815, 816, 817, 818, 819, 909, 908, 901, 902, 903, 904, 905, 906, 907)
- Duplicates are automatically skipped (based on cleaned phone number)
- Contacts without names or phone numbers are skipped
- Import is limited to 50 contacts per batch for performance

### Permissions

- Requests `expo-contacts` permission before accessing contacts
- Graceful error handling for denied permissions
- Clear user messaging about permission requirements

## User Experience Flow

1. **Trigger Import**: User taps any import button/FAB
2. **Permission Dialog**: Shows explanation of what will be imported
3. **System Permission**: Native iOS/Android contact permission dialog
4. **Processing**: App validates and imports valid contacts
5. **Results**: Shows summary of imported/skipped contacts
6. **Refresh**: Customer list automatically updates

## Error Handling

The system handles various error scenarios:

- **Permission Denied**: Clear message explaining permission requirement
- **No Contacts**: Graceful handling when no contacts are found
- **Invalid Data**: Skips malformed contact entries
- **Network Issues**: Handles database errors gracefully
- **Duplicate Entries**: Automatically skips existing customers

## Performance Considerations

- **Batch Limiting**: Maximum 50 contacts per import session
- **Background Processing**: Non-blocking UI during import
- **Memory Management**: Efficient contact processing
- **Database Optimization**: Batch inserts where possible

## Testing

### Manual Testing Checklist

- [ ] Import button appears in customer list
- [ ] Import FAB functions correctly
- [ ] Permission dialog appears and functions
- [ ] Valid Nigerian numbers are imported correctly
- [ ] Invalid numbers are skipped
- [ ] Duplicates are detected and skipped
- [ ] Import success/failure messages display
- [ ] Customer list refreshes after import
- [ ] Import from add customer screen works

### Edge Cases Tested

- [ ] Empty contact list
- [ ] Contacts with no phone numbers
- [ ] Contacts with invalid phone numbers
- [ ] Mixed valid/invalid contacts
- [ ] Large contact lists (>50 contacts)
- [ ] Permission denied scenarios

## Future Enhancements

### Phase 2 Features

- **Selective Import**: Choose specific contacts to import
- **Contact Matching**: Better duplicate detection using name similarity
- **Import History**: Track import sessions and conflicts
- **Bulk Operations**: Edit multiple imported contacts
- **Contact Sync**: Keep contacts updated with phone changes

### Advanced Features (Phase 3+)

- **Smart Categorization**: Auto-detect business vs personal contacts
- **Contact Enrichment**: Add business information from external sources
- **Two-way Sync**: Update phone contacts from Klyntl changes
- **Contact Groups**: Import contact groups/categories
- **WhatsApp Integration**: Detect WhatsApp-enabled contacts

## API Reference

### useCustomerStore.importFromContacts()

```typescript
interface ImportResult {
  imported: number; // Successfully imported contacts
  skipped: number; // Skipped contacts (duplicates/invalid)
}

const importFromContacts: () => Promise<ImportResult>;
```

### ContactImportButton Props

```typescript
interface ContactImportButtonProps {
  onImportComplete?: (result: ImportResult) => void;
  style?: any;
  disabled?: boolean;
  variant?: "fab" | "button" | "text";
  size?: "small" | "medium" | "large";
}
```

## Dependencies

- `expo-contacts`: Contact access and management
- `zustand`: State management for import results
- `react-native-paper`: UI components for buttons/dialogs

## Security & Privacy

- **Minimal Access**: Only requests name, phone, and email fields
- **Local Storage**: All contact data stays on device
- **No Tracking**: No contact data sent to external services
- **User Control**: Users can see exactly what will be imported
- **Reversible**: Imported contacts can be deleted individually

This implementation provides a robust, user-friendly contact import system that respects user privacy while efficiently handling the complexities of Nigerian phone number formats and contact data validation.
