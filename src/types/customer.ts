export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  birthday?: string;
  notes?: string;
  nickname?: string;
  photoUri?: string;
  // Contact metadata
  contactSource?: "manual" | "imported" | "updated";
  lastContactDate?: string;
  preferredContactMethod?: "phone" | "email" | "sms";
  // Business fields
  totalSpent: number;
  lastPurchase?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields for filtering
  customerType?: "individual" | "business";
  isActive?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  birthday?: string;
  notes?: string;
  nickname?: string;
  photoUri?: string;
  contactSource?: "manual" | "imported" | "updated";
  preferredContactMethod?: "phone" | "email" | "sms";
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  birthday?: string;
  notes?: string;
  nickname?: string;
  photoUri?: string;
  contactSource?: "manual" | "imported" | "updated";
  lastContactDate?: string;
  preferredContactMethod?: "phone" | "email" | "sms";
}
