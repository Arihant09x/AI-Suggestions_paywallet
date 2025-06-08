"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { TransactionItem } from "@/components/TransactionItem";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";
import { ArrowLeft, History, Filter } from "lucide-react";
import Link from "next/link";

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
  status: string;
  timestamp: string;
  type: "sent" | "received";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    filterTransactions();
    // eslint-disable-next-line
  }, [transactions, filter, user]);

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiService.get(
        "/account/transaction-history",
        token
      );
      const mapped = response.transactions.map((tx: any) => ({
        _id: tx._id,
        sender: {
          username: tx.from?.username || "",
          email: tx.from?.email || "",
        },
        receiver: {
          username: tx.to?.username || "",
          email: tx.to?.email || "",
        },
        amount: tx.amount,
        status: tx.status || "completed",
        timestamp: tx.timestamp,
      }));
      setTransactions(mapped);
    } catch (error) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (filter === "all") {
      setFilteredTransactions(transactions);
    } else if (filter === "sent") {
      setFilteredTransactions(
        transactions.filter(
          (transaction) =>
            transaction.sender.username === user?.username &&
            transaction.receiver.username !== user?.username
        )
      );
    } else if (filter === "received") {
      setFilteredTransactions(
        transactions.filter(
          (transaction) =>
            transaction.receiver.username === user?.username &&
            transaction.sender.username !== user?.username
        )
      );
    } else if (filter === "self") {
      setFilteredTransactions(
        transactions.filter(
          (transaction) =>
            transaction.sender.username === user?.username &&
            transaction.receiver.username === user?.username
        )
      );
    }
  };

  const getFilterCount = (filterType: "all" | "sent" | "received" | "self") => {
    if (filterType === "all") return transactions.length;
    if (filterType === "sent")
      return transactions.filter(
        (transaction) =>
          transaction.sender.username === user?.username &&
          transaction.receiver.username !== user?.username
      ).length;
    if (filterType === "received")
      return transactions.filter(
        (transaction) =>
          transaction.receiver.username === user?.username &&
          transaction.sender.username !== user?.username
      ).length;
    if (filterType === "self")
      return transactions.filter(
        (transaction) =>
          transaction.sender.username === user?.username &&
          transaction.receiver.username === user?.username
      ).length;
    return 0;
  };
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction History
            </h1>
            <p className="text-gray-600">
              View and filter your past transactions
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="flex items-center space-x-1"
            >
              <span>All</span>
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {getFilterCount("all")}
              </span>
            </Button>
            <Button
              variant={filter === "sent" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("sent")}
              className="flex items-center space-x-1"
            >
              <span>Sent</span>
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {getFilterCount("sent")}
              </span>
            </Button>
            <Button
              variant={filter === "received" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("received")}
              className="flex items-center space-x-1"
            >
              <span>Received</span>
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {getFilterCount("received")}
              </span>
            </Button>
            <Button
              variant={filter === "self" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("self")}
              className="flex items-center space-x-1"
            >
              <span>Self</span>
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {getFilterCount("self")}
              </span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                {filter === "all"
                  ? "All Transactions"
                  : filter === "sent"
                  ? "Sent Transactions"
                  : "Received Transactions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {filter !== "all" ? filter : ""} transactions found</p>
                  <p className="text-sm">
                    {filter === "all"
                      ? "Start by adding money to your wallet or sending money to friends"
                      : `You haven't ${filter} any money yet`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction._id}
                      transaction={transaction}
                      currentUserEmail={user?.username || ""}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
