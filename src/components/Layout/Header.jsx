import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";

function Header() {
	const { currentUser } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			await signOut(auth);
			navigate("/"); // Navigate to home/login page after logout
		} catch (err) {
			console.error("Logout Error:", err);
			// Optionally show an error message to the user
		}
	};

	// Basic inline styles for demonstration
	const headerStyle = {
		backgroundColor: "#f8f9fa",
		padding: "10px 20px",
		borderBottom: "1px solid #dee2e6",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	};
	const navStyle = {
		display: "flex",
		gap: "15px",
	};
	const linkStyle = {
		textDecoration: "none",
		color: "#007bff",
	};
	const buttonStyle = {
		cursor: "pointer",
		padding: "5px 10px",
		border: "1px solid #007bff",
		borderRadius: "4px",
		backgroundColor: "white",
		color: "#007bff",
	};

	return (
		<header style={headerStyle}>
			<Link to="/" style={{ ...linkStyle, fontWeight: "bold", color: "#333" }}>
				Language Book Creator
			</Link>
			<nav style={navStyle}>
				{currentUser ? (
					<>
						<span style={{ marginRight: "10px" }}>{currentUser.email}</span>
						<Link to="/profile" style={linkStyle}>
							Profile
						</Link>
						<button onClick={handleLogout} style={buttonStyle}>
							Logout
						</button>
					</>
				) : (
					<>
						{/* Login/Signup links can be added if needed, but forms are on root page */}
						<span style={{ color: "#6c757d" }}>Please log in or sign up</span>
					</>
				)}
			</nav>
		</header>
	);
}

export default Header;
