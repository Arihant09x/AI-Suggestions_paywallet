"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Plus, Send, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface BalanceCardProps {
  username: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ username }) => {
  const [showBalance, setShowBalance] = useState(false);
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Adjust endpoint as per your backend
        const response = await apiService.get("/account/balance", token);
        // If your backend returns { balance: 12345 }
        setBalance(response.balance);
      } catch (error: any) {
        toast({
          title: "Failed to fetch balance",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    fetchBalance();
  }, [token, toast]);

  const formatBalance = (amount: number) => {
    return `₹${amount}`;
  };

  const handlePasswordSubmit = () => {
    // For demo: accept any non-empty password
    if (password.length > 0) {
      setShowBalance(true);
      setIsDialogOpen(false);
      setPassword("");
      toast({
        title: "Balance revealed",
        description: "Your wallet balance is now visible",
      });
    } else {
      toast({
        title: "Invalid password",
        description: "Please enter your password",
        variant: "destructive",
      });
    }
  };

  const getBalanceColor = (amount: number) => {
    if (amount >= 100000) return "from-green-500 to-emerald-600"; // ₹1000+
    if (amount >= 50000) return "from-blue-500 to-cyan-600"; // ₹500+
    if (amount >= 10000) return "from-yellow-500 to-orange-600"; // ₹100+
    return "from-red-500 to-pink-600"; // Less than ₹100
  };

  return (
    <Card
      className={`bg-gradient-to-r ${getBalanceColor(
        balance
      )} text-white shadow-lg`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Wallet Balance
          <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {balance >= 100000
              ? "Premium"
              : balance >= 50000
              ? "Gold"
              : balance >= 10000
              ? "Silver"
              : "Basic"}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-bold">
              {showBalance ? formatBalance(balance) : "••••••"}
            </span>
            {showBalance ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(false)}
                className="text-white hover:bg-white/20"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2" />
                      Enter Password to View Balance
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePasswordSubmit()
                      }
                    />
                    <Button onClick={handlePasswordSubmit} className="w-full">
                      Reveal Balance
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            asChild
            className="flex-1 bg-white text-gray-800 hover:bg-gray-100"
          >
            <Link
              href="/add-money"
              className="flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Money
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 bg-white text-gray-800 hover:bg-gray-100"
          >
            <Link href="/transfer" className="flex items-center justify-center">
              <Send className="h-4 w-4 mr-2" />
              Send Money
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
