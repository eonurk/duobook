import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from '../../firebaseConfig'; // Adjust path if needed
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
function UserPanel() {
    const { currentUser } = useAuth();
    const [error, setError] = React.useState(null);
    const handleLogout = async () => {
        setError(null);
        try {
            await signOut(auth);
            // Logout successful, AuthProvider will handle the state change
        }
        catch (err) {
            console.error("Logout Error:", err);
            setError(err.message);
        }
    };
    // Only render if a user is logged in
    if (!currentUser)
        return null;
    return (_jsxs("div", { children: [_jsx("h2", { children: "User Panel" }), _jsxs("p", { children: ["Welcome, ", currentUser.email, "!"] }), _jsx("button", { onClick: handleLogout, children: "Logout" }), error && _jsxs("p", { style: { color: 'red' }, children: ["Logout Error: ", error] })] }));
}
export default UserPanel;
