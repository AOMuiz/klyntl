export type ContactSource = "manual" | "imported" | "updated";
export type PreferredContactMethod = "phone" | "email" | "sms";
export type CustomerType = "individual" | "business";

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
  contactSource?: ContactSource;
  lastContactDate?: string;
  preferredContactMethod?: PreferredContactMethod;
  // Business fields
  totalSpent: number;
  outstandingBalance: number; // Amount customer owes (in kobo, >= 0)
  creditBalance: number; // Amount customer has as credit/prepaid (in kobo, >= 0)
  lastPurchase?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields for filtering
  customerType?: CustomerType;
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
  contactSource?: ContactSource;
  preferredContactMethod?: PreferredContactMethod;
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
  contactSource?: ContactSource;
  lastContactDate?: string;
  preferredContactMethod?: PreferredContactMethod;
}
