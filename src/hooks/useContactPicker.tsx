import {
  ContactPicker,
  ContactPickerProps,
  ProcessedContact,
} from "@/components/ContactPicker";
import { useState } from "react";

interface ContactPickerOptions {
  existingPhones?: string[];
  maxSelection?: number;
  onContactsSelected: (contacts: ProcessedContact[]) => void;
}

export const useContactPicker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pickerProps, setPickerProps] = useState<ContactPickerProps | null>(
    null
  );

  const showContactPicker = (options: ContactPickerOptions) => {
    setPickerProps({
      visible: true,
      onDismiss: () => {
        setIsVisible(false);
        setPickerProps(null);
      },
      onContactsSelected: (contacts) => {
        options.onContactsSelected(contacts);
        setIsVisible(false);
        setPickerProps(null);
      },
      existingPhones: options.existingPhones,
      maxSelection: options.maxSelection,
    });
    setIsVisible(true);
  };

  const ContactPickerComponent = () => {
    if (!pickerProps) return null;

    return (
      <ContactPicker
        visible={isVisible}
        onDismiss={pickerProps.onDismiss}
        onContactsSelected={pickerProps.onContactsSelected}
        existingPhones={pickerProps.existingPhones}
        maxSelection={pickerProps.maxSelection}
      />
    );
  };

  return {
    showContactPicker,
    ContactPickerComponent,
  };
};
