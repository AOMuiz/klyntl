import React from "react";
import TransactionForm from "@/components/forms/transaction/TransactionForm";

interface AddTransactionScreenProps {
  customerId?: string;
}

export default function AddTransactionScreen({
  customerId,
}: AddTransactionScreenProps) {
  return <TransactionForm customerId={customerId} />;
}
