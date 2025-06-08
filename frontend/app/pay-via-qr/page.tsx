"use client";

import type React from "react";
import { useState, useRef } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { ArrowLeft, QrCode, Scan } from "lucide-react";
import Link from "next/link";
import { BrowserQRCodeReader } from "@zxing/browser";

export default function PayViaQRPage() {
  const [qrData, setQrData] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "image" | null>(null);
  const { user, token, updateBalance } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQRScan = async (data: string | null) => {
    if (!data) return;
    try {
      const parsed = JSON.parse(data);

      if (
        parsed.type === "payment_request" &&
        (parsed.recipient || parsed.recipientName)
      ) {
        const recipientUsername = parsed.recipient || parsed.recipientName;

        const response = await apiService.get(
          `/user/users?filter=${encodeURIComponent(recipientUsername)}`,
          token!
        );

        const recipientUser = response.user?.[0];

        if (!recipientUser) {
          toast({
            title: "User not found",
            description: "Recipient does not exist",
            variant: "destructive",
          });
          setScanning(false);
          return;
        }

        setPaymentData({
          ...parsed,
          recipientName: `${recipientUser.FirstName} ${recipientUser.LastName}`,
          recipient: recipientUser.username,
          recipientId: recipientUser.id,
        });

        setQrData(data);
        setScanning(false);

        if (!parsed.amount) {
          toast({
            title: "QR Code scanned",
            description: "Please enter the amount to send",
          });
        }
      } else {
        throw new Error("Invalid QR code format");
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "This QR code is not a valid payment request",
        variant: "destructive",
      });
      setScanning(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const image = new Image();
      image.src = e.target?.result as string;

      image.onload = async () => {
        const codeReader = new BrowserQRCodeReader();
        try {
          const result = await codeReader.decodeFromImageElement(image);
          const qrText = result.getText();
          await handleQRScan(qrText);
        } catch (err) {
          toast({
            title: "Scan failed",
            description: "Could not detect a QR code",
            variant: "destructive",
          });
        } finally {
          setScanning(false);
          setScanMode(null);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handlePayment = async () => {
    if (!paymentData) return;
    let amount = 0;

    if (paymentData.amount) {
      // Convert from paise to rupees with 2 decimals
      amount = (Number(paymentData.amount) / 100).toFixed(2); // returns string like "200.00"
    } else {
      // Convert manual input rupees to 2 decimal places
      amount = Number.parseFloat(customAmount).toFixed(2); // returns string like "200.00"
    }

    if (amount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum transfer amount is ₹1",
        variant: "destructive",
      });
      return;
    }

    if (user?.username === paymentData.recipient) {
      toast({
        title: "Invalid recipient",
        description: "You cannot send money to yourself",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.post(
        "/account/transfer",
        {
          to: paymentData.recipientId,
          amount,
          note: "Paid via QR",
        },
        token!
      );

      updateBalance(response.senderNewBalance);

      toast({
        title: "Payment successful",
        description: `₹${Number(amount).toFixed(2)} sent to ${
          paymentData.recipientName
        }`,
      });

      setPaymentData(null);
      setCustomAmount("");
      setQrData("");
    } catch (error: any) {
      toast({
        title: "Payment failed",
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
          <Link
            href="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Pay via QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!paymentData && (
                <div className="text-center space-y-4">
                  <Button
                    onClick={() => {
                      setScanMode("image");
                      setScanning(true);
                      fileInputRef.current?.click();
                    }}
                    variant="outline"
                    className="mb-2"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Upload QR Image
                  </Button>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <p className="text-gray-500 text-sm">
                    Upload a QR image to pay instantly.
                  </p>
                </div>
              )}

              {paymentData && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePayment();
                  }}
                  className="space-y-6"
                >
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <Input disabled value={paymentData.recipientName} />
                  </div>
                  {!paymentData.amount && (
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        required
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </div>
                  )}
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Processing..."
                      : `Send ₹${
                          paymentData.amount
                            ? (Number(paymentData.amount) / 100).toFixed(2)
                            : customAmount
                        }`}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
