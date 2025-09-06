import { Customer } from "@/types/customer";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import {
  calculateRemainingAmount,
  getDefaultValuesForTransactionType,
} from "@/utils/business/transactionCalculations";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface TransactionFormData {
  customerId: string;
  amount: string;
  description: string;
  date: Date;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  paidAmount: string;
  remainingAmount: string;
  dueDate: Date | null;
  appliedToDebt?: boolean;
}

interface UseTransactionFormProps {
  customerId?: string;
  customers: Customer[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTransactionForm = ({
  customerId,
  customers,
  searchQuery,
  setSearchQuery,
}: UseTransactionFormProps) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [showMorePaymentMethods, setShowMorePaymentMethods] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TransactionFormData>({
    defaultValues: {
      customerId: customerId || "",
      amount: "",
      description: "",
      date: new Date(),
      type: "sale",
      paymentMethod: "cash",
      paidAmount: "",
      remainingAmount: "",
      dueDate: null,
      appliedToDebt: true,
    },
  });

  const watchedType = watch("type");
  const watchedAmount = watch("amount");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedCustomerId = watch("customerId");
  const watchedPaidAmount = watch("paidAmount");

  // Filter customers based on search query
  const filteredCustomers = useMemo(
    () =>
      (customers ?? []).filter((customer) =>
        (customer.name ?? "")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ),
    [customers, searchQuery]
  );

  // Ensure appliedToDebt has a default value when transaction type is payment
  useEffect(() => {
    if (watchedType === "payment") {
      const currentValue = watch("appliedToDebt");
      if (currentValue === undefined) {
        setValue("appliedToDebt", true);
      }
    }
  }, [watchedType, setValue, watch]);

  // Reset certain fields when transaction type changes
  useEffect(() => {
    const defaults = getDefaultValuesForTransactionType(
      watchedType,
      watchedAmount
    );
    Object.entries(defaults).forEach(([key, value]) => {
      setValue(key as keyof TransactionFormData, value);
    });
  }, [watchedType, watchedAmount, setValue]);

  // Auto-compute remainingAmount for mixed payments
  useEffect(() => {
    if (
      watchedPaymentMethod === "mixed" &&
      watchedAmount &&
      watchedPaidAmount
    ) {
      const remaining = calculateRemainingAmount(
        watchedAmount,
        watchedPaidAmount
      );
      setValue("remainingAmount", remaining);
    }
  }, [watchedPaymentMethod, watchedAmount, watchedPaidAmount, setValue]);

  const resetForm = (customerId?: string) => {
    reset({
      customerId: customerId || "",
      amount: "",
      description: "",
      date: new Date(),
      type: "sale",
      paymentMethod: "cash",
      paidAmount: "",
      remainingAmount: "",
      dueDate: null,
      appliedToDebt: true,
    });
  };

  return {
    control,
    handleSubmit,
    errors,
    reset: resetForm,
    watch,
    setValue,
    watchedValues: {
      type: watchedType,
      amount: watchedAmount,
      paymentMethod: watchedPaymentMethod,
      customerId: watchedCustomerId,
      paidAmount: watchedPaidAmount,
    },
    filteredCustomers,
    isDatePickerVisible,
    setDatePickerVisible,
    showMorePaymentMethods,
    setShowMorePaymentMethods,
  };
};
