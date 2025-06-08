"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, QrCode, Download, Share, Copy } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { useRef } from "react";

export default function GenerateQRPage() {
  const [amount, setAmount] = useState("");
  const [qrData, setQrData] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (user) {
      generateQRData();
    }
  }, [user, amount]);

  const generateQRData = () => {
    const paymentData = {
      type: "payment_request",
      recipient: user?.email,
      recipientName: user?.username,
      amount: amount ? Math.round(Number.parseFloat(amount) * 100) : 0,
      timestamp: Date.now(),
    };
    setQrData(JSON.stringify(paymentData));
  };

  const downloadQR = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-qr-${user?.username}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "QR Code downloaded",
      description: "QR code saved to your device",
    });
  };

  // Share QR as PNG (if supported)
  const shareQR = async () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (canvas && navigator.share) {
      try {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `payment-qr-${user?.username}.png`, {
              type: "image/png",
            });
            await navigator.share({
              title: "PayWallet Payment QR",
              text: `Send money to ${user?.username} using this QR code`,
              files: [file],
            });
          }
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Share failed",
          description: "Unable to share QR code",
          variant: "destructive",
        });
      }
    } else {
      // Fallback: copy to clipboard
      copyQRLink();
    }
  };

  const copyQRLink = () => {
    const qrLink = `${
      window.location.origin
    }/pay-via-qr?data=${encodeURIComponent(qrData)}`;
    navigator.clipboard.writeText(qrLink).then(() => {
      toast({
        title: "Link copied",
        description: "Payment link copied to clipboard",
      });
    });
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
            <h1 className="text-2xl font-bold text-gray-900">
              Generate QR Code
            </h1>
            <p className="text-gray-600">
              Create a QR code to receive payments
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Amount (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount (leave empty for any amount)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Leave empty to allow sender to enter any amount
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Your Payment QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-6 rounded-lg inline-block mb-4 shadow-sm border">
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={qrData}
                    size={200}
                    level="M"
                    includeMargin={true}
                    imageSettings={{
                      src: "/placeholder.svg?height=40&width=40",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {user?.username}
                  </h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  {amount && (
                    <p className="text-lg font-semibold text-blue-600 mt-2">
                      Amount: ₹{amount}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={downloadQR} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button onClick={shareQR} variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button onClick={copyQRLink} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Share this QR code with anyone who wants to send you money
                  </li>
                  <li>
                    • They can scan it using their PayWallet app or camera
                  </li>
                  <li>• Money will be transferred instantly to your wallet</li>
                  <li>• You'll receive email and SMS notifications</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
