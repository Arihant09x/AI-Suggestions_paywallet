"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { ArrowLeft, User, Mail, Phone, Edit } from "lucide-react";
import Link from "next/link";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const { toast } = useToast();

  // Form state for editing
  const [formData, setFormData] = useState({
    firstname: user?.FirstName || "",
    lastname: user?.LastName || "",
    phone: user?.Phone_No || "",
    password: "",
  });

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const response = await apiService.get("/account/balance", token);
        setBalance(Number(response.data?.balance || response.balance || 0));
      } catch (error) {
        setBalance(0);
        toast({
          title: "Failed to fetch balance",
          description: "Could not load your account balance.",
          variant: "destructive",
        });
      } finally {
        setLoadingBalance(false);
      }
    };
    if (token) fetchBalance();
  }, [token, toast]);

  // Keep formData in sync with user when not editing
  useEffect(() => {
    if (!editing && user) {
      setFormData({
        firstname: user.FirstName || "",
        lastname: user.LastName || "",
        phone: user.Phone_No || "",
        password: "",
      });
    }
  }, [editing, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: any = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        Phone_No: formData.phone,
      };
      if (formData.password) submitData.password = formData.password;

      await apiService.put("/user/update", submitData, token!);

      updateUser({
        ...user,
        FirstName: formData.firstname,
        LastName: formData.lastname,
        Phone_No: formData.phone,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      setEditing(false);
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (error: any) {
      toast({
        title: "Update failed",
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
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback
                      className="text-lg"
                      style={{
                        backgroundColor: user?.username
                          ? stringToColor(user.username)
                          : "#8884",
                        color: "#fff",
                      }}
                    >
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {user?.username}
                  </h3>
                  <p className="text-sm text-gray-600">
                    This is your profile avatar
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Account Information
                  </div>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname">First Name</Label>
                      <Input
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Last Name</Label>
                      <Input
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password (leave blank to keep unchanged)
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            firstname: user?.FirstName || "",
                            lastname: user?.LastName || "",
                            phone: user?.Phone_No || "",
                            password: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Username</p>
                        <p className="font-medium">{user?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">First Name</p>
                        <p className="font-medium">{user?.FirstName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Last Name</p>
                        <p className="font-medium">{user?.LastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium">{user?.Phone_No}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {loadingBalance ? "Loading..." : `₹${balance.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-gray-600">Current Balance</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {balance >= 100000
                        ? "Premium"
                        : balance >= 50000
                        ? "Gold"
                        : balance >= 10000
                        ? "Silver"
                        : "Basic"}
                    </p>
                    <p className="text-sm text-gray-600">Account Tier</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
