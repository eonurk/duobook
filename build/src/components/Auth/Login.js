import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from '@/firebaseConfig'; // Use alias
import { Button } from "@/components/ui/button"; // Use alias
import { Input } from "@/components/ui/input"; // Use alias
import { Label } from "@/components/ui/label"; // Use alias
function Login({ onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const [isResetting, setIsResetting] = useState(false); // State for password reset loading
    const [resetMessage, setResetMessage] = useState(''); // State for success/error messages for reset
    const [resetError, setResetError] = useState(''); // State for reset error message specifically
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true); // Set loading
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Login successful, AuthProvider handles state change & App.jsx handles redirect
            if (onSuccess) {
                onSuccess(); // Call the success callback if provided
            }
        }
        catch (err) {
            console.error("Login Error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setError("Invalid email or password.");
            }
            else if (err.code === 'auth/too-many-requests') {
                setError("Too many login attempts. Please try again later.");
            }
            else {
                setError("An unexpected error occurred. Please try again.");
            }
        }
        finally {
            setIsLoading(false); // Unset loading
        }
    };
    const handlePasswordReset = async () => {
        if (!email) {
            setResetError("Please enter your email address first.");
            setResetMessage(''); // Clear any previous success message
            return;
        }
        setError(null); // Clear login errors
        setResetError('');
        setResetMessage('');
        setIsResetting(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setResetMessage("Password reset email sent! Check your inbox.");
            setResetError('');
        }
        catch (err) {
            console.error("Password Reset Error:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setResetError("Could not find an account with that email address.");
            }
            else {
                setResetError("Failed to send password reset email. Please try again.");
            }
            setResetMessage('');
        }
        finally {
            setIsResetting(false);
        }
    };
    return (
    // Use grid layout and Tailwind classes like the example
    _jsx("div", { className: "grid gap-6", children: _jsx("form", { onSubmit: handleLogin, children: _jsxs("div", { className: "grid gap-4", children: [" ", _jsxs("div", { className: "grid gap-2", children: [" ", _jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "m@example.com", autoCapitalize: "none", autoComplete: "email", autoCorrect: "off", disabled: isLoading || isResetting, value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { className: "grid gap-2", children: [" ", _jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", disabled: isLoading || isResetting, value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsxs("div", { className: "text-right text-sm mt-1", children: [" ", _jsx("button", { type: "button", onClick: handlePasswordReset, disabled: isResetting || isLoading, className: "text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline", children: isResetting ? "Sending..." : "Forgot Password?" })] })] }), resetMessage && _jsx("p", { className: "text-sm text-green-600 dark:text-green-400", children: resetMessage }), resetError && _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: resetError }), error && _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }), _jsx(Button, { type: "submit", className: "w-full bg-amber-300 py-4", disabled: isLoading || isResetting, children: isLoading ? "Logging in..." : "Login" })] }) }) }));
}
export default Login;
