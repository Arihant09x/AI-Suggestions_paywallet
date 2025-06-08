"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { BalanceCard } from "@/components/BalanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Send, Plus, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { sendEmailNotification } from "@/services/notifications";

export default function DashboardPage() {
  const { user, loading, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTx(true);
      try {
        const response = await apiService.get(
          "/account/transaction-history",
          token!
        );
        // Use .data if your apiService returns { data: ... }
        const txs = response.data?.transactions || response.transactions || [];
        setTransactions(txs);
      } catch (e) {
        setTransactions([]);
      } finally {
        setLoadingTx(false);
      }
    };
    if (user && token) fetchTransactions();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>User not found. Please log in again.</span>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Send Money",
      description: "Transfer money to friends",
      icon: Send,
      href: "/transfer",
      color: "bg-blue-500",
    },
    {
      title: "Add Money",
      description: "Add money to wallet",
      icon: Plus,
      href: "/add-money",
      color: "bg-green-500",
    },
    {
      title: "QR Code",
      description: "Generate QR for payments",
      icon: QrCode,
      href: "/generate-qr",
      color: "bg-purple-500",
    },
    {
      title: "Transactions",
      description: "View transaction history",
      icon: History,
      href: "/transactions",
      color: "bg-orange-500",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstname || user.username}!
            </h1>
            <p className="text-gray-600">Manage your wallet and transactions</p>
          </div>

          {/* Balance Card */}
          <div className="mb-8">
            <BalanceCard
              balance={user.balance ? Number(user.balance).toFixed(2) : "0.00"}
              username={user.username || ""}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Activity
                <Button asChild variant="outline" size="sm">
                  <Link href="/transactions">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading recent transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent transactions</p>
                  <p className="text-sm">
                    Start by adding money to your wallet
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.slice(0, 3).map((tx) => {
                    const isSelf =
                      (tx.from?.username === user.username &&
                        tx.to?.username === user.username) ||
                      tx.status === "Add Money";
                    const isSent =
                      tx.from?.username === user.username &&
                      tx.to?.username !== user.username;
                    const isReceived =
                      tx.to?.username === user.username &&
                      tx.from?.username !== user.username;

                    return (
                      <div
                        key={tx._id}
                        className="py-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {isSelf
                              ? "Added Money"
                              : isSent
                              ? `Sent to ${tx.to?.username}`
                              : isReceived
                              ? `Received from ${tx.from?.username}`
                              : "Transaction"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div
                          className={
                            isSent
                              ? "text-red-600 font-bold"
                              : "text-green-600 font-bold"
                          }
                        >
                          {isSent ? "-" : "+"}₹{(tx.amount / 100).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
