import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/firebaseConfig'; // Use alias
import { Button } from "@/components/ui/button"; // Use alias
import { Input } from "@/components/ui/input"; // Use alias
import { Label } from "@/components/ui/label"; // Use alias

function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

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
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          setError("Invalid email or password.");
      } else if (err.code === 'auth/too-many-requests') {
          setError("Too many login attempts. Please try again later.")
      } else {
          setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false); // Unset loading
    }
  };

  return (
    // Use grid layout and Tailwind classes like the example
    <div className="grid gap-6">
      <form onSubmit={handleLogin}>
        <div className="grid gap-4"> {/* Increased gap */} 
          <div className="grid gap-2"> {/* Increased gap */} 
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2"> {/* Increased gap */} 
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>} 
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Login; 