"use client";
import { useRef, useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiService, fetchSmartSuggestion } from "@/services/api";
import { ArrowLeft, Send, QrCode, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { sendEmailNotification } from "@/services/notifications";

export default function TransferPage() {
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [smartSuggestions, setSmartSuggestions] = useState<
    { recipient: string; amount: number }[]
  >([]);
  const [smartSuggestionLoading, setSmartSuggestionLoading] = useState(true);
  const [smartSuggestionShown, setSmartSuggestionShown] = useState(false);
  const { user, token, updateBalance } = useAuth();
  const { toast } = useToast();

  const quickAmounts = [50, 100, 200, 500, 1000];
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch latest balance on mount and after transfer
  const fetchBalance = async () => {
    try {
      const response = await apiService.get("/account/balance", token!);
      setBalance(response.balance);
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

  // Fetch smart suggestions from backend (Gemini)
  useEffect(() => {
    let cancelled = false;
    async function getSuggestion() {
      setSmartSuggestionLoading(true);
      setSmartSuggestionShown(false);
      if (token) {
        const suggestions = await fetchSmartSuggestion(token);
        if (!cancelled) {
          setTimeout(() => {
            // Accept both array and single object from backend
            let arr: { recipient: string; amount: number }[] = [];
            if (Array.isArray(suggestions)) {
              arr = suggestions.filter((s) => s && s.recipient && s.amount);
            } else if (
              suggestions &&
              suggestions.recipient &&
              suggestions.amount
            ) {
              arr = [suggestions];
            }
            setSmartSuggestions(arr);
            setSmartSuggestionLoading(false);
            setSmartSuggestionShown(true);
          }, 1200); // Animation delay
        }
      } else {
        setSmartSuggestions([]);
        setSmartSuggestionLoading(false);
        setSmartSuggestionShown(true);
      }
    }
    getSuggestion();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (activeSuggestion >= 0 && suggestionRefs.current[activeSuggestion]) {
      suggestionRefs.current[activeSuggestion]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeSuggestion, recipientList]);

  // Search for users as recipient
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!recipientQuery) {
        setRecipientList([]);
        return;
      }
      try {
        const response = await apiService.get(
          `/user/users?filter=${encodeURIComponent(recipientQuery)}`,
          token!
        );
        setRecipientList(
          response.user.filter((u: any) => u.username !== user?.username)
        );
      } catch (error) {
        setRecipientList([]);
      }
    };
    const timeout = setTimeout(fetchRecipients, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientQuery, token]);

  // Convert balance and amount to paise for calculations
  const currentBalancePaise = Math.round(Number.parseFloat(balance) * 100);
  const transferAmountPaise = amount
    ? Math.round(Number.parseFloat(amount) * 100)
    : 0;
  const remainingBalancePaise = currentBalancePaise - transferAmountPaise;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientId || !recipient) {
      toast({
        title: "Recipient required",
        description: "Please select a recipient from the list.",
        variant: "destructive",
      });
      return;
    }

    if (transferAmountPaise < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum transfer amount is ₹1",
        variant: "destructive",
      });
      return;
    }

    if (transferAmountPaise > currentBalancePaise) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this transfer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.post(
        "/account/transfer",
        {
          to: recipientId,
          amount: Number(amount),
          note: note || undefined,
        },
        token!
      );

      // Send notifications (await both)
      await sendEmailNotification(
        user?.username,
        user.FirstName || user.username,
        {
          amount: transferAmountPaise,
          type: "sent",
          fromUser: user?.username,
          toUser: recipient.username,
        }
      );

      await sendEmailNotification(
        recipient.username,
        recipient.FirstName || recipient.username,
        {
          amount: transferAmountPaise,
          type: "received",
          fromUser: user?.username,
          toUser: recipient.username,
        }
      );

      toast({
        title: "Transfer successful",
        description: `₹${amount} sent successfully`,
      });

      // Reset fields only after toast and notifications
      setRecipientQuery("");
      setRecipientId("");
      setRecipient(null);
      setAmount("");
      setNote("");

      // Now fetch and update balance
      await fetchBalance();
      updateBalance(response.senderNewBalance);
    } catch (error: any) {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format amount for display (e.g., 10000 -> 10000.00)
  const formatAmount = (amt: number) =>
    Number(amt).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Smart Suggestion UI */}
          <div className="mb-4 min-h-[64px]">
            {smartSuggestionLoading && !smartSuggestionShown ? (
              <div className="p-4 bg-blue-50 rounded flex items-center gap-3 animate-pulse">
                <Loader2 className="animate-spin text-blue-700" size={28} />
                <span className="text-blue-700 font-medium flex items-center gap-2">
                  <Sparkles className="text-blue-400 animate-pulse" size={20} />
                  AI is thinking... Finding your best suggestions
                </span>
              </div>
            ) : smartSuggestions.length > 0 ? (
              <div className="space-y-2">
                {smartSuggestions.map((s, idx) => (
                  <div
                    key={s.recipient + s.amount}
                    className="p-4 bg-blue-50 rounded flex items-center justify-between shadow transition-all duration-700 animate-fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="text-blue-500 animate-bounce"
                        size={22}
                      />
                      <span className="font-semibold text-blue-700">
                        Smart Suggestion:
                      </span>
                      <span>
                        Send{" "}
                        <span className="font-bold text-blue-900">
                          ₹{formatAmount(s.amount)}
                        </span>{" "}
                        to{" "}
                        <span className="font-bold text-blue-900">
                          {s.recipient}
                        </span>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="ml-4"
                      onClick={() => {
                        setRecipientQuery(s.recipient);
                        setAmount(String(s.amount)); // <-- FIXED
                      }}
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mb-6">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
            <p className="text-gray-600">
              Transfer money to friends and family
            </p>
          </div>

          <Tabs defaultValue="manual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Transfer</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>

            {/* Manual Transfer */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    Send Money
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTransfer} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">
                        Recipient (Name or Email)
                      </Label>
                      <Input
                        id="recipient"
                        type="text"
                        placeholder="Type name or email"
                        value={recipientQuery}
                        onChange={(e) => {
                          setRecipientQuery(e.target.value);
                          setRecipientId("");
                          setRecipient(null);
                          setActiveSuggestion(-1);
                        }}
                        onKeyDown={(e) => {
                          if (recipientList.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActiveSuggestion((prev) =>
                              prev < recipientList.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActiveSuggestion((prev) =>
                              prev > 0 ? prev - 1 : recipientList.length - 1
                            );
                          } else if (
                            e.key === "Enter" &&
                            activeSuggestion >= 0
                          ) {
                            e.preventDefault();
                            const u = recipientList[activeSuggestion];
                            setRecipientQuery(
                              `${u.FirstName} ${u.LastName} (${u.username})`
                            );
                            setRecipientId(u.id);
                            setRecipient(u);
                            setActiveSuggestion(-1);
                          }
                        }}
                        autoComplete="off"
                        required
                      />

                      {/* Recipient Suggestions */}
                      {recipientQuery && recipientList.length > 0 && (
                        <div className="border rounded bg-white shadow mt-1 max-h-40 overflow-y-auto z-10">
                          {recipientList.map((u, idx) => (
                            <div
                              key={u.id}
                              ref={(el) => (suggestionRefs.current[idx] = el)}
                              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                recipientId === u.id || activeSuggestion === idx
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                              onClick={() => {
                                setRecipientQuery(
                                  `${u.FirstName} ${u.LastName} (${u.username})`
                                );
                                setRecipientId(u.id);
                                setRecipient(u);
                                setActiveSuggestion(-1);
                              }}
                            >
                              <div className="font-medium">
                                {u.FirstName} {u.LastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {u.username}
                              </div>
                              <div className="text-xs text-gray-400">
                                {u.Phone_No}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />

                      {/* Quick Amount Selection */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Quick select:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {quickAmounts.map((quickAmount) => (
                            <Button
                              key={quickAmount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAmount(quickAmount.toString())}
                              disabled={quickAmount > Number(balance)}
                            >
                              ₹{quickAmount}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">Note (Optional)</Label>
                      <Textarea
                        id="note"
                        placeholder="Add a note for this transfer"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Balance Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Available Balance
                        </span>
                        <span className="font-medium">₹{balance}</span>
                      </div>

                      {transferAmountPaise > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Transfer Amount
                            </span>
                            <span className="font-medium text-red-600">
                              -₹{amount}
                            </span>
                          </div>

                          <div className="border-t pt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              Remaining Balance
                            </span>
                            <span
                              className={`font-bold ${
                                remainingBalancePaise >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              ₹{(remainingBalancePaise / 100).toFixed(2)}
                            </span>
                          </div>

                          {remainingBalancePaise < 0 && (
                            <p className="text-xs text-red-600">
                              Insufficient balance for this transfer
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        loading ||
                        !recipientId ||
                        !amount ||
                        remainingBalancePaise < 0
                      }
                    >
                      {loading ? "Sending..." : `Send ₹${amount || "0"}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Code Transfer */}
            <TabsContent value="qr">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    QR Code Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">QR Code Scanner</h3>
                  <p className="text-gray-600 mb-4">
                    Scan a QR code to send money instantly
                  </p>
                  <Button asChild>
                    <Link href="/pay-via-qr">Open QR Scanner</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.7s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
