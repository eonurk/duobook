import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/firebaseConfig'; // Use alias
import { Button } from "@/components/ui/button"; // Use alias
import { Input } from "@/components/ui/input"; // Use alias
import { Label } from "@/components/ui/label"; // Use alias

function Signup({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Signup successful, AuthProvider handles state change & App.jsx handles redirect
      if (onSuccess) {
        onSuccess(); // Call the success callback if provided
      }
    } catch (err) {
      console.error("Signup Error:", err);
       if (err.code === 'auth/email-already-in-use') {
          setError("This email address is already in use.");
      } else if (err.code === 'auth/weak-password') {
          setError("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
          setError("Please enter a valid email address.");
      } else {
          setError("An unexpected error occurred during sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use grid layout and Tailwind classes
    <div className="grid gap-6">
       <form onSubmit={handleSignup}>
         <div className="grid gap-4">
           <div className="grid gap-2">
             <Label htmlFor="signup-email">Email</Label>
             <Input
               id="signup-email" // Unique ID
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
           <div className="grid gap-2">
             <Label htmlFor="signup-password">Password</Label>
             <Input
               id="signup-password" // Unique ID
               type="password"
               placeholder="******"
               disabled={isLoading}
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
             />
           </div>
           {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
           <Button type="submit" className="w-full" disabled={isLoading}>
             {isLoading ? "Creating Account..." : "Create Account"}
           </Button>
         </div>
       </form>
     </div>
  );
}

export default Signup; 