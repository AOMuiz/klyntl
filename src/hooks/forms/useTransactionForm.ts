import { QUERY_KEYS } from "@/constants/queryKeys";
import { SimpleTransactionCalculator } from "@/services/calculations/SimpleTransactionCalculator";
import { createDatabaseService } from "@/services/database";
import { useDatabase } from "@/services/database/hooks";
import { Customer } from "@/types/customer";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import { getDefaultValuesForTransactionType } from "@/utils/business/transactionCalculations";
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

  // Auto-compute remainingAmount for mixed payments using SimpleTransactionCalculator
  useEffect(() => {
    if (
      watchedPaymentMethod === "mixed" &&
      watchedAmount &&
      watchedPaidAmount
    ) {
      const totalAmount = parseFloat(watchedAmount);
      const paidAmount = parseFloat(watchedPaidAmount);

      if (!isNaN(totalAmount) && !isNaN(paidAmount)) {
        const remaining = Math.max(0, totalAmount - paidAmount);
        setValue("remainingAmount", remaining.toString());
      }
    } else if (watchedPaymentMethod !== "mixed") {
      // Use SimpleTransactionCalculator for non-mixed payments
      const totalAmount = parseFloat(watchedAmount || "0");
      if (!isNaN(totalAmount) && totalAmount > 0) {
        const calculated = SimpleTransactionCalculator.calculateInitialAmounts(
          watchedType,
          watchedPaymentMethod,
          totalAmount
        );
        setValue("paidAmount", calculated.paidAmount.toString());
        setValue("remainingAmount", calculated.remainingAmount.toString());
      }
    }
  }, [
    watchedPaymentMethod,
    watchedAmount,
    watchedPaidAmount,
    watchedType,
    setValue,
  ]);

  // Enhanced validation function using SimpleTransactionCalculator
  const validateTransactionWithSimpleCalculator = (
    data: TransactionFormData
  ) => {
    const errors: string[] = [];
    const parsedAmount = parseFloat(data.amount);
    const parsedPaidAmount = parseFloat(data.paidAmount || "0");
    const parsedRemainingAmount = parseFloat(data.remainingAmount || "0");

    // Validate amount
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.push("Amount must be a positive number");
    }

    // Use SimpleTransactionCalculator to calculate expected status
    const calculatedStatus = SimpleTransactionCalculator.calculateStatus(
      data.type,
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
      if (
        Math.abs(parsedPaidAmount + parsedRemainingAmount - parsedAmount) > 0.01
      ) {
        errors.push("Paid amount + remaining amount must equal total amount");
      }
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

  // Enhanced form submission with SimpleTransactionCalculator validation
  const handleValidatedSubmit = (onSubmit: (data: any) => void) => {
    return handleSubmit((data) => {
      // Validate with SimpleTransactionCalculator
      const validation = validateTransactionWithSimpleCalculator(data);

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
        status: validation.calculatedStatus.status,
        percentagePaid: validation.calculatedStatus.percentagePaid,
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

  // Function to calculate real-time debt impact
  const calculateRealTimeDebtImpact = (data: Partial<TransactionFormData>) => {
    const amount = parseFloat(data.amount || "0");
    const paidAmount = parseFloat(data.paidAmount || "0");
    const remainingAmount = parseFloat(data.remainingAmount || "0");

    // For mixed payments, calculate debt impact based on remaining amount
    if (data.paymentMethod === "mixed") {
      // Validate mixed payment amounts
      const validation = SimpleTransactionCalculator.validateMixedPayment(
        amount,
        paidAmount,
        remainingAmount
      );

      if (!validation.isValid) {
        return { change: 0, isIncrease: false, isDecrease: false };
      }

      return SimpleTransactionCalculator.calculateDebtImpact(
        data.type || "sale",
        data.paymentMethod || "cash",
        remainingAmount, // Use remaining amount for debt impact
        data.appliedToDebt
      );
    }

    return SimpleTransactionCalculator.calculateDebtImpact(
      data.type || "sale",
      data.paymentMethod || "cash",
      amount,
      data.appliedToDebt
    );
  };

  // Function to get credit balance preview
  const getCreditBalancePreview = async (customerId: string) => {
    if (!databaseService?.simplePayment) return 0;

    try {
      return await databaseService.simplePayment.getCreditBalance(customerId);
    } catch (error) {
      console.error("Failed to get credit balance:", error);
      return 0;
    }
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
    validateTransaction: validateTransactionWithSimpleCalculator, // Expose updated validation function
    calculateDebtImpact: calculateRealTimeDebtImpact, // Expose debt impact calculator
    getCreditBalance: getCreditBalancePreview, // Expose credit balance getter
  };
};
