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
    } catch (err) {
      console.error("Logout Error:", err);
      setError(err.message);
    }
  };

  // Only render if a user is logged in
  if (!currentUser) return null;

  return (
    <div>
      <h2>User Panel</h2>
      <p>Welcome, {currentUser.email}!</p>
      <button onClick={handleLogout}>Logout</button>
      {error && <p style={{ color: 'red' }}>Logout Error: {error}</p>}
      {/* Add other user-specific content or links here */}
    </div>
  );
}

export default UserPanel; 