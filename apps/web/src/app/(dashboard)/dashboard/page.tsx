"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@komas/ui";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Shield } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user && typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || "User"}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <User className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your registered identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Name:</span>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Email:</span>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Role & Access Level</CardTitle>
              <CardDescription>Assigned RBAC permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"}>
                ROLE: {user?.role || "USER"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {user?.role === "ADMIN"
                  ? "You have full administrator privileges to manage users and access system telemetry."
                  : "You have standard access privileges."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
