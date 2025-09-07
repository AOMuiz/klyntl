import { useCallback } from "react";
import { Alert, Linking } from "react-native";

export function useContactActions(phone?: string | null) {
  const openUrl = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Action not supported",
          "This device cannot perform the requested action."
        );
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      Alert.alert("Error", "Unable to perform the requested action.");
    }
  }, []);

  const handleCall = useCallback(() => {
    if (!phone) return;
    openUrl(`tel:${phone}`);
  }, [phone, openUrl]);

  const handleSMS = useCallback(() => {
    if (!phone) return;
    openUrl(`sms:${phone}`);
  }, [phone, openUrl]);

  const handleWhatsApp = useCallback(() => {
    if (!phone) return;

    // Normalize phone number for WhatsApp: remove + and spaces
    const phoneNumber = phone.replace(/[^0-9]/g, "");
    const waUrl = `whatsapp://send?phone=${phoneNumber}`;
    const waWeb = `https://wa.me/${phoneNumber}`;

    const openWhatsApp = async () => {
      try {
        const supported = await Linking.canOpenURL(waUrl);
        if (supported) {
          await Linking.openURL(waUrl);
          return;
        }

        // Fallback to web URL
        const webSupported = await Linking.canOpenURL(waWeb);
        if (webSupported) {
          await Linking.openURL(waWeb);
          return;
        }

        Alert.alert(
          "WhatsApp not available",
          "WhatsApp is not installed and the web fallback is not available on this device."
        );
      } catch (error) {
        console.error("Failed to open WhatsApp:", error);
        Alert.alert("Error", "Unable to open WhatsApp.");
      }
    };

    void openWhatsApp();
  }, [phone]);

  return { handleCall, handleSMS, handleWhatsApp };
}
