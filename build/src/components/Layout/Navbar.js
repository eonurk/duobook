import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '@/firebaseConfig'; // Use alias
import { useAuth } from '@/context/AuthContext'; // Use alias
import { Button } from '@/components/ui/button'; // Import shadcn Button
import Login from '@/components/Auth/Login';
import Signup from '@/components/Auth/Signup';
import { Flame, Star, Sparkles, Menu, X } from 'lucide-react'; // Use consistent icons
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"; // Import Card components
function Navbar() {
    const { currentUser, userProgress } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Get location object
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu
    // Helper function to calculate level progress
    const calculateLevelProgress = (level, points) => {
        if (!level || level < 1)
            level = 1;
        if (!points || points < 0)
            points = 0;
        const pointsForLevel = (lvl) => {
            if (lvl <= 1)
                return 0;
            // Sum formula: n*(n+1)/2 -> (lvl-1)*lvl/2 * 100
            return (lvl - 1) * lvl / 2 * 100;
        };
        const currentLevelBasePoints = pointsForLevel(level);
        const nextLevelBasePoints = pointsForLevel(level + 1);
        const pointsNeededForNextLevel = nextLevelBasePoints - currentLevelBasePoints; // This is level * 100
        const pointsInCurrentLevel = points - currentLevelBasePoints;
        if (pointsNeededForNextLevel <= 0)
            return 100; // Avoid division by zero if logic is flawed or level maxed out
        const progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
        return {
            percentage: progressPercentage,
            pointsInCurrentLevel: Math.max(0, pointsInCurrentLevel), // Ensure no negative points displayed
            pointsNeededForNextLevel: pointsNeededForNextLevel
        };
    };
    const progressInfo = userProgress ? calculateLevelProgress(userProgress.level, userProgress.points) : { percentage: 0, pointsInCurrentLevel: 0, pointsNeededForNextLevel: 100 }; // Default if no progress
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsMobileMenuOpen(false); // Close mobile menu on logout
            navigate('/'); // Navigate to home/login page after logout
        }
        catch (err) {
            console.error("Logout Error:", err);
            // Optionally show an error message to the user using toast
        }
    };
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };
    const handleAuthClick = () => {
        closeMobileMenu();
        setShowAuthDialog(true);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("header", { className: "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm", children: [_jsxs("div", { className: "flex h-16 items-center justify-between px-4", children: [_jsx("div", { className: "flex items-center", children: _jsx(Link, { to: "/", className: "font-bold text-lg tracking-tight text-primary", children: "DuoBook" }) }), _jsx("nav", { className: "hidden md:flex items-center gap-4 ml-auto", children: currentUser ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden md:flex items-center space-x-4 border-r pr-4 mr-2", children: [_jsxs("div", { className: "flex items-center text-muted-foreground hover:text-foreground transition-colors", title: `${userProgress?.streak || 0} Day Streak`, children: [_jsx(Flame, { className: "h-4 w-4 mr-1 text-orange-400" }), _jsx("span", { className: "text-sm font-medium", children: userProgress?.streak || 0 })] }), _jsxs("div", { className: "flex items-center text-muted-foreground hover:text-foreground transition-colors", title: `Level ${userProgress?.level || 1} (${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} points)`, children: [_jsx(Star, { className: "h-4 w-4 mr-1 text-yellow-400" }), _jsx("span", { className: "text-sm font-medium", children: userProgress?.level || 1 })] }), _jsxs("div", { className: "flex items-center text-muted-foreground hover:text-foreground transition-colors", title: `${userProgress?.points || 0} Total Experience Points`, children: [_jsx(Sparkles, { className: "h-4 w-4 mr-1 text-teal-400" }), _jsx("span", { className: "text-sm font-medium", children: userProgress?.points || 0 })] })] }), _jsx(Button, { variant: "link", size: "sm", asChild: true, className: `px-0 ${location.pathname === '/progress' ? 'text-primary font-semibold' : 'text-foreground/70 hover:text-foreground'}`, children: _jsx(Link, { to: "/progress", children: "Progress" }) }), _jsx(Button, { variant: "link", size: "sm", asChild: true, className: `px-0 ${location.pathname === '/my-stories' ? 'text-primary font-semibold' : 'text-foreground/70 hover:text-foreground'}`, children: _jsx(Link, { to: "/my-stories", children: "My Stories" }) }), _jsx(Button, { variant: "link", size: "sm", asChild: true, className: `px-0 ${location.pathname === '/practice' ? 'text-primary font-semibold' : 'text-foreground/70 hover:text-foreground'}`, children: _jsx(Link, { to: "/practice", children: "Practice" }) }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: `${location.pathname === '/profile' ? 'ring-2 ring-ring ring-offset-2' : ''}`, children: _jsx(Link, { to: "/profile", children: "Profile" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleLogout, children: "Logout" })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowAuthDialog(true), children: "Login" }), _jsx(Button, { variant: "default", size: "sm", onClick: () => setShowAuthDialog(true), children: "Sign Up" })] })) }), _jsx("div", { className: "md:hidden ml-auto", children: _jsx(Button, { variant: "ghost", size: "icon", onClick: toggleMobileMenu, "aria-label": isMobileMenuOpen ? "Close menu" : "Open menu", "aria-expanded": isMobileMenuOpen, children: isMobileMenuOpen ? _jsx(X, { className: "h-6 w-6" }) : _jsx(Menu, { className: "h-6 w-6" }) }) })] }), isMobileMenuOpen && (_jsx("div", { className: "absolute top-16 left-0 right-0 z-40 bg-white shadow-md md:hidden border-t border-border/40", children: _jsx("nav", { className: "flex flex-col items-start gap-2 p-4", children: currentUser ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col space-y-3 mb-3 border-b pb-3 w-full", children: [_jsxs("div", { className: "flex items-center justify-between text-muted-foreground", title: `${userProgress?.streak || 0} Day Streak`, children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Flame, { className: "h-5 w-5 mr-2 text-orange-400" }), _jsx("span", { className: "text-sm font-medium", children: "Daily Streak" })] }), _jsxs("span", { className: "text-sm font-medium", children: [userProgress?.streak || 0, " Days"] })] }), _jsx("div", { title: `Level ${userProgress?.level || 1} (${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} points)`, children: _jsxs("div", { className: "flex items-center justify-between text-muted-foreground", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Star, { className: "h-5 w-5 mr-2 text-yellow-400" }), _jsxs("span", { className: "text-sm font-medium", children: ["Level ", userProgress?.level || 1] })] }), _jsx("span", { className: "text-sm font-medium", children: `${progressInfo.pointsInCurrentLevel} / ${progressInfo.pointsNeededForNextLevel} XP` })] }) }), _jsxs("div", { className: "flex items-center justify-between text-muted-foreground", title: `${userProgress?.points || 0} Total Experience Points`, children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Sparkles, { className: "h-5 w-5 mr-2 text-teal-400" }), _jsx("span", { className: "text-sm font-medium", children: "Total XP" })] }), _jsx("span", { className: "text-sm font-medium", children: userProgress?.points || 0 })] })] }), _jsx(Button, { variant: "ghost", asChild: true, className: `w-full justify-start ${location.pathname === '/' ? 'text-primary font-semibold bg-accent' : ''}`, onClick: closeMobileMenu, children: _jsx(Link, { to: "/", children: "Home" }) }), _jsx(Button, { variant: "ghost", asChild: true, className: `w-full justify-start ${location.pathname === '/progress' ? 'text-primary font-semibold bg-accent' : ''}`, onClick: closeMobileMenu, children: _jsx(Link, { to: "/progress", children: "Progress" }) }), _jsx(Button, { variant: "ghost", asChild: true, className: `w-full justify-start ${location.pathname === '/my-stories' ? 'text-primary font-semibold bg-accent' : ''}`, onClick: closeMobileMenu, children: _jsx(Link, { to: "/my-stories", children: "My Stories" }) }), _jsx(Button, { variant: "ghost", asChild: true, className: `w-full justify-start ${location.pathname === '/practice' ? 'text-primary font-semibold bg-accent' : ''}`, onClick: closeMobileMenu, children: _jsx(Link, { to: "/practice", children: "Practice" }) }), _jsx(Button, { variant: "ghost", asChild: true, className: `w-full justify-start ${location.pathname === '/profile' ? 'text-primary font-semibold bg-accent' : ''}`, onClick: closeMobileMenu, children: _jsx(Link, { to: "/profile", children: "Profile" }) }), _jsx(Button, { variant: "ghost", onClick: handleLogout, className: "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50", children: "Logout" })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: handleAuthClick, className: "w-full justify-start", children: "Login" }), _jsx(Button, { variant: "default", onClick: handleAuthClick, className: "w-full justify-start", children: "Sign Up" })] })) }) }))] }), _jsx(Dialog, { open: showAuthDialog, onOpenChange: setShowAuthDialog, children: _jsx(DialogContent, { className: "sm:max-w-[425px] p-0", children: _jsxs(Card, { className: "border-none shadow-none bg-amber-50", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "Authentication Required" }), _jsx(CardDescription, { children: "Please sign in or create an account to continue." })] }), _jsxs(CardContent, { className: "grid gap-4", children: [_jsx(Login, { onSuccess: () => setShowAuthDialog(false) }), _jsx("div", { className: "text-center text-muted-foreground text-sm", children: "or" }), _jsx(Signup, { onSuccess: () => setShowAuthDialog(false) })] })] }) }) })] }));
}
export default Navbar;
