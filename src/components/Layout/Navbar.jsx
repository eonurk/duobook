import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '@/firebaseConfig'; // Use alias
import { useAuth } from '@/context/AuthContext'; // Use alias
import { Button } from '@/components/ui/button'; // Import shadcn Button
import Login from '@/components/Auth/Login';
import Signup from '@/components/Auth/Signup';
import { Flame, Star, Sparkles } from 'lucide-react'; // Use consistent icons
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components

function Navbar() {
  const { currentUser, userProgress } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Navigate to home/login page after logout
    } catch (err) {
      console.error("Logout Error:", err);
      // Optionally show an error message to the user using toast
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-lg tracking-tight text-primary">
              DuoBook
            </Link>
          </div>
          <nav className="flex items-center gap-4 ml-auto">
            {currentUser ? (
              <>
                <div className="hidden md:flex items-center space-x-4 border-r pr-4 mr-2">
                  <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors" title={`${userProgress?.streak || 0} Day Streak`}>
                    <Flame className="h-4 w-4 mr-1 text-orange-400" />
                    <span className="text-sm font-medium">{userProgress?.streak || 0}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors" title={`Level ${userProgress?.level || 1}`}>
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    <span className="text-sm font-medium">{userProgress?.level || 1}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground hover:text-foreground transition-colors" title={`${userProgress?.xpPoints || 0} Experience Points`}>
                    <Sparkles className="h-4 w-4 mr-1 text-teal-400" />
                    <span className="text-sm font-medium">{userProgress?.xpPoints || 0}</span>
                  </div>
                </div>
                <Button variant="link" size="sm" asChild className="px-0 text-foreground/70 hover:text-foreground">
                  <Link to="/progress" >Progress</Link>
                </Button>
                <Button variant="link" size="sm" asChild className="px-0 text-foreground/70 hover:text-foreground">
                  <Link to="/my-stories">My Stories</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/profile">Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowAuthDialog(true)}>Login</Button>
                <Button variant="default" size="sm" onClick={() => setShowAuthDialog(true)}>Sign Up</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <Card className="border-none shadow-none bg-amber-50">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in or create an account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Login onSuccess={() => setShowAuthDialog(false)} />
              <div className="text-center text-muted-foreground text-sm">or</div>
              <Signup onSuccess={() => setShowAuthDialog(false)} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Navbar; 