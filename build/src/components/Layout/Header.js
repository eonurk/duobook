import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
function Header() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/'); // Navigate to home/login page after logout
        }
        catch (err) {
            console.error("Logout Error:", err);
            // Optionally show an error message to the user
        }
    };
    // Basic inline styles for demonstration
    const headerStyle = {
        backgroundColor: '#f8f9fa',
        padding: '10px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };
    const navStyle = {
        display: 'flex',
        gap: '15px'
    };
    const linkStyle = {
        textDecoration: 'none',
        color: '#007bff'
    };
    const buttonStyle = {
        cursor: 'pointer',
        padding: '5px 10px',
        border: '1px solid #007bff',
        borderRadius: '4px',
        backgroundColor: 'white',
        color: '#007bff'
    };
    return (_jsxs("header", { style: headerStyle, children: [_jsx(Link, { to: "/", style: { ...linkStyle, fontWeight: 'bold', color: '#333' }, children: "Language Book Creator" }), _jsx("nav", { style: navStyle, children: currentUser ? (_jsxs(_Fragment, { children: [_jsx("span", { style: { marginRight: '10px' }, children: currentUser.email }), _jsx(Link, { to: "/profile", style: linkStyle, children: "Profile" }), _jsx("button", { onClick: handleLogout, style: buttonStyle, children: "Logout" })] })) : (_jsx(_Fragment, { children: _jsx("span", { style: { color: '#6c757d' }, children: "Please log in or sign up" }) })) })] }));
}
export default Header;
