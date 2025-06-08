"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function AddMoneyPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const { token, updateBalance } = useAuth();
  const { toast } = useToast();

  // Fetch balance on mount and after adding money
  const fetchBalance = async () => {
    try {
      const response = await apiService.get("/account/balance", token!);
      setBalance(Number(response.balance));
    } catch (error: any) {
      toast({
        title: "Failed to fetch balance",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = Number.parseFloat(amount);

    if (isNaN(amountValue) || amountValue < 1) {
      toast({
        title: "Invalid amount",
        description: "Minimum amount is ₹1",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.post(
        "/account/add-money",
        {
          amount: amountValue, // ✅ Send in rupees, not paise
        },
        token!
      );

      setBalance(Number(response.balance));
      updateBalance(Number(response.balance));

      toast({
        title: "Money added successfully",
        description: `₹${amountValue.toFixed(2)} has been added to your wallet`,
      });

      setAmount("");
    } catch (error: any) {
      toast({
        title: "Failed to add money",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add Money</h1>
            <p className="text-gray-600">Add money to your PayWallet</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Add Money to Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                    required
                  />

                  <p className="text-sm text-gray-500">Minimum amount: ₹1</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Current Balance
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{balance.toFixed(2)}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !amount}
                >
                  {loading ? "Adding Money..." : `Add ₹${amount || "0"}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
