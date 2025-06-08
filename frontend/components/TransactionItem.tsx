import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  _id: string;
  sender: {
    username: string;
    email: string;
  };
  receiver: {
    username: string;
    email: string;
  };
  amount: number;
  status: "completed" | "pending" | "failed" | "Add Money" | "Transfer";
  timestamp: string;
  type?: "sent" | "received";
}

interface TransactionItemProps {
  transaction: Transaction;
  currentUserEmail: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  currentUserEmail,
}) => {
  const isSelf =
    transaction.sender.username === currentUserEmail &&
    transaction.receiver.username === currentUserEmail;
  const isSent =
    transaction.sender.username === currentUserEmail &&
    transaction.receiver.username !== currentUserEmail;
  const isReceived =
    transaction.receiver.username === currentUserEmail &&
    transaction.sender.username !== currentUserEmail;

  const formatAmount = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "Add Money":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${
                isSent ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {isSent ? (
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {isSelf
                  ? "Added Money"
                  : isSent
                  ? `Sent to ${transaction.receiver.username}`
                  : isReceived
                  ? `Received from ${transaction.sender.username}`
                  : "Transaction"}
                {transaction._id.startsWith("demo-") && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Demo
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(transaction.timestamp)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`font-semibold ${
                isSent ? "text-red-600" : "text-green-600"
              }`}
            >
              {isSent ? "-" : "+"}
              {formatAmount(transaction.amount)}
            </p>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
