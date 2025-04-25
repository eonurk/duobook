import React, { useState } from 'react';
import { 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider 
} from "firebase/auth";
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function UserProfilePage() {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen">Redirecting...</div>; 
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    setIsLoading(true);

    try {
      if (!currentUser.email) {
        throw new Error("User email is not available.");
      }
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setSuccessMessage("Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Password Change Error:", err);
      if (err.code === 'auth/wrong-password') {
          setError("Incorrect current password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
          setError("Too many attempts. Please try again later.");
      } else {
          setError("Failed to change password. An error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          </div>
          <hr />
           <form onSubmit={handlePasswordChange} className="space-y-4">
             <h3 className="text-lg font-medium">Change Password</h3>
            <div className="space-y-2">
               <Label htmlFor="currentPassword">Current Password</Label>
               <Input
                 id="currentPassword"
                 type="password"
                 value={currentPassword}
                 onChange={(e) => setCurrentPassword(e.target.value)}
                 required
                 disabled={isLoading}
               />
            </div>
             <div className="space-y-2">
               <Label htmlFor="newPassword">New Password</Label>
               <Input
                 id="newPassword"
                 type="password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 required
                 disabled={isLoading}
               />
             </div>
            <div className="space-y-2">
               <Label htmlFor="confirmPassword">Confirm New Password</Label>
               <Input
                 id="confirmPassword"
                 type="password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 required
                 disabled={isLoading}
               />
            </div>
             {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
             {successMessage && <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? "Changing Password..." : "Change Password"}
             </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfilePage; 