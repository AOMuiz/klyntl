import { ProcessedContact } from "@/components/ContactPicker";

// Re-export types and components from ContactPicker
export { useContactPicker } from "@/components/ContactPicker";
export type { ProcessedContact } from "@/components/ContactPicker";

// Legacy interface for backward compatibility
export interface OpenContactPickerOptions {
  existingPhones?: string[];
  maxSelection?: number;
  onContactsSelected: (contacts: ProcessedContact[]) => void;
}

/**
 * @deprecated Use the useContactPicker hook instead for better React integration
 * Opens the contact picker screen with the specified options
 * @param options Configuration options for the contact picker
 */
export const openContactPicker = (options: OpenContactPickerOptions) => {
  console.warn(
    "openContactPicker is deprecated. Use the useContactPicker hook instead."
  );
  // This function is kept for backward compatibility but should not be used
  // Users should migrate to the useContactPicker hook
};
