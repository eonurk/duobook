import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
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
        return _jsx("div", { className: "flex justify-center items-center h-screen", children: "Redirecting..." });
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
        }
        catch (err) {
            console.error("Password Change Error:", err);
            if (err.code === 'auth/wrong-password') {
                setError("Incorrect current password. Please try again.");
            }
            else if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Please try again later.");
            }
            else {
                setError("Failed to change password. An error occurred.");
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "container mx-auto py-10 px-4 flex justify-center", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "User Profile" }), _jsx(CardDescription, { children: "Manage your account settings." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx("p", { className: "text-sm text-muted-foreground", children: currentUser.email })] }), _jsx("hr", {}), _jsxs("form", { onSubmit: handlePasswordChange, className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Change Password" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "currentPassword", children: "Current Password" }), _jsx(Input, { id: "currentPassword", type: "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), required: true, disabled: isLoading })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "newPassword", children: "New Password" }), _jsx(Input, { id: "newPassword", type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), required: true, disabled: isLoading })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirm New Password" }), _jsx(Input, { id: "confirmPassword", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, disabled: isLoading })] }), error && _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }), successMessage && _jsx("p", { className: "text-sm text-green-600 dark:text-green-400", children: successMessage }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "Changing Password..." : "Change Password" })] })] })] }) }));
}
export default UserProfilePage;
