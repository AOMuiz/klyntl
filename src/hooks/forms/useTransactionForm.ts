import { QUERY_KEYS } from "@/constants/queryKeys";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { Customer } from "@/types/customer";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import {
  calculateRemainingAmount,
  getDefaultValuesForTransactionType,
} from "@/utils/business/transactionCalculations";
import { useQueryClient } from "@tanstack/react-query";
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
  initialData?: Partial<TransactionFormData>;
}

export const useTransactionForm = ({
  customerId,
  customers,
  searchQuery,
  setSearchQuery,
  initialData,
}: UseTransactionFormProps) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [showMorePaymentMethods, setShowMorePaymentMethods] = useState(false);
  const queryClient = useQueryClient();
  const { db } = useDatabase();
  const databaseService = db ? createDatabaseService(db) : undefined;

  const defaultValues = {
    customerId: customerId || "",
    amount: "",
    description: "",
    date: new Date(),
    type: "sale" as TransactionType,
    paymentMethod: "cash" as PaymentMethod,
    paidAmount: "",
    remainingAmount: "",
    dueDate: null,
    appliedToDebt: true,
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TransactionFormData>({
    defaultValues: { ...defaultValues, ...initialData },
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

  // PaymentService validation function
  const validateTransactionWithPaymentService = (data: TransactionFormData) => {
    if (!databaseService?.payment) {
      // Fallback validation if PaymentService is not available
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const parsedAmount = parseFloat(data.amount);
    const parsedPaidAmount = parseFloat(data.paidAmount || "0");
    const parsedRemainingAmount = parseFloat(data.remainingAmount || "0");

    // Validate amount
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push("Amount must be a positive number");
    }

    // Use PaymentService to calculate expected status
    const calculatedStatus = databaseService.payment.calculateTransactionStatus(
      data.type,
      data.paymentMethod,
      parsedAmount,
      parsedPaidAmount,
      parsedRemainingAmount
    );

    // Validate payment amounts based on payment method
    if (data.paymentMethod === "mixed") {
      if (parsedPaidAmount < 0) {
        errors.push("Paid amount cannot be negative");
      }
      if (parsedRemainingAmount < 0) {
        errors.push("Remaining amount cannot be negative");
      }
      if (parsedPaidAmount + parsedRemainingAmount !== parsedAmount) {
        errors.push("Paid amount + remaining amount must equal total amount");
      }
    } else if (data.paymentMethod === "cash") {
      // For cash payments, no manual validation needed
      // The system will automatically set paidAmount = amount
      // This prevents the "paid amount should equal total amount" error
    } else if (data.paymentMethod === "credit" && data.type !== "credit") {
      if (parsedPaidAmount > 0) {
        errors.push("Credit payments should not have paid amount");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      calculatedStatus,
    };
  };

  // Enhanced form submission with PaymentService validation
  const handleValidatedSubmit = (onSubmit: (data: any) => void) => {
    return handleSubmit((data) => {
      // Validate with PaymentService
      const validation = validateTransactionWithPaymentService(data);

      if (!validation.isValid) {
        // Set form errors
        validation.errors.forEach((error) => {
          // You could set specific field errors here if needed
          console.error("Validation error:", error);
        });
        return;
      }

      // Add calculated status to the data
      const enhancedData = {
        ...data,
        status: validation.calculatedStatus,
      };

      onSubmit(enhancedData);
    });
  };

  const resetForm = (customerId?: string) => {
    reset({
      ...defaultValues,
      customerId: customerId || "",
      ...initialData,
    });
  };

  // Function to refresh customer data if needed
  const refreshCustomers = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.customers.all(),
    });
  };

  return {
    control,
    handleSubmit: handleValidatedSubmit, // Use enhanced submit handler
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
    refreshCustomers,
    validateTransaction: validateTransactionWithPaymentService, // Expose validation function
  };
};
