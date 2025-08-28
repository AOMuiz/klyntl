import { useDatabase } from "@/services/database";
import { createDatabaseService } from "@/services/database/service";
import { Customer } from "@/types/customer";
import { validateNigerianPhone } from "@/utils/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";
import { useState } from "react";
import { useCustomers } from "./useCustomers";

// const databaseService = createDatabaseService(db);

interface ContactImportResult {
  imported: number;
  skipped: number;
}

interface ContactAccessStatus {
  hasAccess: boolean;
  isLimited: boolean;
  contactCount: number;
}

export function useContactImport() {
  const { db } = useDatabase();
  const databaseService = createDatabaseService(db);

  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { refetch } = useCustomers();

  // Get contact access history
  const getContactAccessHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem("contactAccessHistory");
      if (historyData) {
        const { contactCount, timestamp } = JSON.parse(historyData);
        return {
          previousContactCount: contactCount,
          hasAccessHistory: true,
        };
      }
      return { previousContactCount: 0, hasAccessHistory: false };
    } catch (error) {
      console.error("Failed to get contact access history:", error);
      return { previousContactCount: 0, hasAccessHistory: false };
    }
  };

  // Save contact access history
  const saveContactAccessHistory = async (contactCount: number) => {
    try {
      const historyData = {
        contactCount,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        "contactAccessHistory",
        JSON.stringify(historyData)
      );
    } catch (error) {
      console.error("Failed to save contact access history:", error);
    }
  };

  // Present contact access picker (iOS 18+ only)
  const presentContactAccessPicker = async () => {
    try {
      if (Contacts.presentAccessPickerAsync) {
        return await Contacts.presentAccessPickerAsync();
      }
      return null;
    } catch (error) {
      console.error("Failed to present contact access picker:", error);
      return null;
    }
  };

  // Helper function to check for limited access
  const checkLimitedAccess = async (
    data: Contacts.Contact[]
  ): Promise<boolean> => {
    try {
      // Use built-in accessPrivileges if available (iOS 18+)
      const { accessPrivileges } = await Contacts.getPermissionsAsync();
      if (accessPrivileges) {
        return accessPrivileges === "limited";
      }

      // Fallback to heuristic detection
      const { previousContactCount, hasAccessHistory } =
        await getContactAccessHistory();

      if (data.length === 0) return false;

      if (hasAccessHistory && data.length < previousContactCount) {
        return true;
      }

      if (data.length < 10) {
        return true;
      }

      if (data.length < 50) {
        const lastNames = data
          .filter((contact) => contact.lastName)
          .map((contact) => contact.lastName);
        const uniqueLastNames = new Set(lastNames);

        if (uniqueLastNames.size <= 2 && uniqueLastNames.size > 0) {
          return true;
        }
      }

      return false;
    } catch {
      // If detection fails, assume not limited
      return false;
    }
  };

  const checkContactAccess = async (): Promise<ContactAccessStatus> => {
    try {
      // Check permission status with built-in limited access detection
      const permissionResponse = await Contacts.getPermissionsAsync();
      const { status, accessPrivileges } = permissionResponse;

      if (status !== "granted") {
        return {
          hasAccess: false,
          isLimited: false,
          contactCount: 0,
        };
      }

      // Get contact count for context
      const contactOptions = {
        fields: [Contacts.Fields.FirstName, Contacts.Fields.LastName],
        pageSize: 0,
        sort: Contacts.SortTypes?.FirstName || "firstName",
      };

      const { data } = await Contacts.getContactsAsync(contactOptions);
      const contactCount = data.length;

      // Determine if access is limited
      const isLimited = await checkLimitedAccess(data);

      // Save contact count for future comparisons
      await saveContactAccessHistory(contactCount);

      return {
        hasAccess: true,
        isLimited,
        contactCount,
      };
    } catch (error) {
      console.error("Failed to check contact access:", error);
      return {
        hasAccess: false,
        isLimited: false,
        contactCount: 0,
      };
    }
  };

  const clearImportCache = async () => {
    try {
      await AsyncStorage.removeItem("@contact_import_history");
    } catch (error) {
      console.warn("Failed to clear import cache:", error);
    }
  };

  const importFromContacts = async (
    forceRefresh: boolean = true
  ): Promise<ContactImportResult> => {
    setError(null);
    setIsImporting(true);

    try {
      // Check current permission status with access privileges
      const permissionResponse = await Contacts.getPermissionsAsync();
      const { status: currentStatus, accessPrivileges } = permissionResponse;

      // If no permission or denied, request permissions
      if (currentStatus !== "granted") {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Contact permission denied");
        }
      }

      // Get contacts with proper field specifications
      const contactOptions = {
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        pageSize: 0, // Get all contacts
        sort: Contacts.SortTypes?.FirstName || "firstName",
      };

      let contactsResult = await Contacts.getContactsAsync(contactOptions);
      let data = contactsResult.data;

      // Check for limited access
      const isLimited = await checkLimitedAccess(data);

      // If user wants fresh access and we detect limited access, try to expand permissions
      if (isLimited && forceRefresh) {
        console.log(
          `Detected limited access (${data.length} contacts), attempting to expand...`
        );

        // For iOS 18+, use the built-in access picker
        if (accessPrivileges === "limited") {
          const newlyGrantedContacts = await presentContactAccessPicker();
          if (newlyGrantedContacts) {
            // Refresh contacts after using access picker
            const refreshedResult = await Contacts.getContactsAsync(
              contactOptions
            );
            if (refreshedResult.data.length > data.length) {
              data = refreshedResult.data;
              console.log(
                `Expanded contact access - now have ${data.length} contacts`
              );
            }
          }
        } else {
          // Fallback: traditional permission request
          const { status: refreshStatus } =
            await Contacts.requestPermissionsAsync();
          if (refreshStatus === "granted") {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const refreshedResult = await Contacts.getContactsAsync(
              contactOptions
            );
            if (refreshedResult.data.length > data.length) {
              data = refreshedResult.data;
              console.log(
                `Expanded contact access - now have ${data.length} contacts`
              );
            }
          }
        }
      }

      // Get fresh customer list from database to check for existing phone numbers
      const latestCustomers = await databaseService.getCustomersWithFilters();
      const existingPhones = new Set(
        latestCustomers.map((c: Customer) => c.phone.replace(/\D/g, ""))
      );

      let imported = 0;
      let skipped = 0;

      console.log(
        `Starting contact import. Found ${data.length} contacts to process.`
      );

      // Process contacts
      for (const contact of data) {
        // Skip contacts without phone numbers
        if (!contact.phoneNumbers?.length) {
          skipped++;
          continue;
        }

        // Process each phone number for the contact
        for (const phoneNumber of contact.phoneNumbers) {
          if (!phoneNumber.number) continue;

          // Clean phone number and check if it's Nigerian
          const cleanPhone = phoneNumber.number.replace(/\D/g, "");
          if (!validateNigerianPhone(cleanPhone)) {
            skipped++;
            continue;
          }

          // Skip if phone already exists
          if (existingPhones.has(cleanPhone)) {
            skipped++;
            continue;
          }

          try {
            // Create customer from contact
            await databaseService.createCustomer({
              name:
                [contact.firstName, contact.lastName]
                  .filter(Boolean)
                  .join(" ") || "Unknown",
              phone: cleanPhone,
              email: contact.emails?.[0]?.email,
              contactSource: "imported",
            });

            imported++;
            existingPhones.add(cleanPhone); // Prevent duplicates within same import
          } catch (error) {
            console.warn(`Failed to import contact ${contact.id}:`, error);
            skipped++;
          }
        }
      }

      // Refresh customer list to reflect imports
      refetch();

      console.log(
        `Contact import completed. Imported: ${imported}, Skipped: ${skipped}`
      );
      return { imported, skipped };
    } catch (error) {
      console.error("Failed to import contacts:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to import contacts")
      );
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importFromContacts,
    checkContactAccess,
    clearImportCache,
    isImporting,
    error,
  };
}
