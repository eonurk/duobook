import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Home,
	BookOpen,
	User,
	Search,
	Menu,
	X,
	Trophy,
	BarChart3,
	Settings,
	Sparkles,
} from "lucide-react";
import { isIOS } from "@/lib/capacitor";

export default function MobileNavbar() {
	const { currentUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Debug user state

	const handleLogout = async () => {
		try {
			await signOut(auth);
			navigate("/");
			setIsMenuOpen(false);
		} catch (error) {
			console.error("Failed to log out:", error);
			console.error("Error details:", {
				message: error.message,
				code: error.code,
				stack: error.stack,
			});
			// Show an alert as fallback for debugging
			alert("Logout failed: " + error.message);
		}
	};

	const closeMenu = () => setIsMenuOpen(false);

	const navItems = [
		{ path: "/", icon: Home, label: "Home" },
		{ path: "/explore-stories", icon: Search, label: "Explore" },
		{ path: "/my-stories", icon: BookOpen, label: "My Stories", auth: true },
		{ path: "/practice", icon: Sparkles, label: "Practice", auth: true },
		{ path: "/progress", icon: BarChart3, label: "Progress", auth: true },
		{ path: "/achievements", icon: Trophy, label: "Achievements", auth: true },
		{ path: "/profile", icon: User, label: "Profile", auth: true },
	];

	const isCurrentPath = (path) => location.pathname === path;

	return (
		<>
			{/* Mobile Header */}
			<header
				className={`${
					isIOS() ? "relative" : "sticky top-0"
				} z-50 w-full border-b bg-gray-50 shadow-sm ${
					isIOS() ? "pt-safe-area-inset-top" : ""
				}`}
			>
				<div className="container flex h-14 items-center justify-between px-4">
					<Link
						to="/"
						className="flex items-center space-x-2"
						onClick={closeMenu}
					>
						<span className="font-bold text-lg text-orange-600">DuoBook</span>
					</Link>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="p-0 h-9 w-9"
					>
						{isMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</Button>
				</div>
			</header>

			{/* Mobile Side Menu Overlay */}
			{isMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/50" onClick={closeMenu} />
					<nav className="fixed right-0 top-0 h-full w-64 bg-white border-l shadow-lg">
						<div
							className={`p-4 border-b ${
								isIOS() ? "pt-safe-area-inset-top" : ""
							}`}
						>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Menu</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={closeMenu}
									className="p-0 h-8 w-8"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="p-4 space-y-2">
							{navItems.map((item) => {
								if (item.auth && !currentUser) return null;

								const IconComponent = item.icon;
								const isCurrent = isCurrentPath(item.path);

								return (
									<Link
										key={item.path}
										to={item.path}
										onClick={closeMenu}
										className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
											isCurrent
												? "bg-orange-100 text-orange-700"
												: "hover:bg-gray-100"
										}`}
									>
										<IconComponent className="h-5 w-5" />
										<span>{item.label}</span>
									</Link>
								);
							})}

							{currentUser ? (
								<>
									<button
										onClick={() => handleLogout()}
										className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 w-full text-left text-red-600"
									>
										<Settings className="h-5 w-5" />
										<span>Logout</span>
									</button>
								</>
							) : (
								<div className="border-t pt-4 mt-4 space-y-2">
									<button
										onClick={() => {
											closeMenu();
											// Trigger auth dialog - we need to pass this up or use a different approach
											window.dispatchEvent(
												new CustomEvent("openAuth", { detail: "login" })
											);
										}}
										className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-50 w-full text-left text-blue-600 font-medium"
									>
										<User className="h-5 w-5" />
										<span>Login</span>
									</button>
									<button
										onClick={() => {
											closeMenu();
											window.dispatchEvent(
												new CustomEvent("openAuth", { detail: "signup" })
											);
										}}
										className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 w-full text-left text-white font-medium"
									>
										<User className="h-5 w-5" />
										<span>Sign Up</span>
									</button>
								</div>
							)}
						</div>
					</nav>
				</div>
			)}
		</>
	);
}
