import { ContactPicker, ProcessedContact } from "@/components/ContactPicker";
import { useCallback, useState } from "react";

// Hook for using the contact picker
export const useContactPicker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [existingPhones, setExistingPhones] = useState<string[]>([]);
  const [maxSelection, setMaxSelection] = useState<number>(100);
  const [onContactsSelected, setOnContactsSelected] = useState<
    ((contacts: ProcessedContact[]) => void) | null
  >(null);

  const showContactPicker = useCallback(
    (options: {
      existingPhones?: string[];
      maxSelection?: number;
      onContactsSelected: (contacts: ProcessedContact[]) => void;
    }) => {
      setExistingPhones(options.existingPhones || []);
      setMaxSelection(options.maxSelection || 100);
      setOnContactsSelected(() => options.onContactsSelected);
      setIsVisible(true);
    },
    []
  );

  const hideContactPicker = useCallback(() => {
    setIsVisible(false);
    setExistingPhones([]);
    setMaxSelection(100);
    setOnContactsSelected(null);
  }, []);

  const ContactPickerComponent = useCallback(() => {
    if (!isVisible) return null;

    return (
      <ContactPicker
        visible={isVisible}
        onDismiss={hideContactPicker}
        onContactsSelected={(contacts) => {
          onContactsSelected?.(contacts);
          hideContactPicker();
        }}
        existingPhones={existingPhones}
        maxSelection={maxSelection}
      />
    );
  }, [
    isVisible,
    existingPhones,
    maxSelection,
    onContactsSelected,
    hideContactPicker,
  ]);

  return {
    showContactPicker,
    hideContactPicker,
    ContactPickerComponent,
  };
};
