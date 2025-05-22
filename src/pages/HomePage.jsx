import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming you want redirection on logout
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import HomeDashboard from '../sections/HomeDashboard';
import ProjectsSection from '../sections/ProjectsSection';
import TasksSection from '../sections/TasksSection';
import ChatSection from '../sections/ChatSection';

function HomePage() {
  const [activeSection, setActiveSection] = useState('home'); // State to track visible section
  const [userHeader, setUserHeader] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // State to hold parsed currentUser

  const navigate = useNavigate();

  // Effect to check login status and set user header on component mount
  useEffect(() => {
    const header = localStorage.getItem('userHeader');
    const user = localStorage.getItem('currentUser');
    
    if (header && user) {
      setUserHeader(header);
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Failed to parse currentUser from localStorage", e);
        // Handle corrupted data, potentially log out user
        handleLogout();
        return;
      }
    } else {
      // If no user data, redirect to sign-in
      navigate('/signin');
    }
  }, [navigate]); // Dependency array includes navigate

  // Function to handle navigation button clicks
  const handleNavigate = (section) => {
    setActiveSection(section);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('staySignedIn');
    localStorage.removeItem('userHeader');
    // Redirect to sign-in page
    navigate('/signin');
  };

  // Helper function to check admin access (moved from inline script)
  const checkAdminAccess = () => { // Simplified - just checks if current user is Admin
     return currentUser && currentUser.role === "Admin";
 };


  // Conditional rendering of sections based on activeSection state
  const renderSection = () => {
    // Pass checkAdminAccess down to sections if they need it
    switch (activeSection) {
      case 'home':
        // Pass necessary data/props to HomeDashboard if needed (e.g., counts)
        return <HomeDashboard />;
      case 'projects':
        // Pass checkAdminAccess and other necessary props to ProjectsSection
        return <ProjectsSection checkAdminAccess={checkAdminAccess} />;
      case 'tasks':
        // Pass checkAdminAccess and other necessary props to TasksSection
        return <TasksSection checkAdminAccess={checkAdminAccess} />;
      case 'chat':
         // Pass current user and other necessary props to ChatSection
        return <ChatSection currentUser={currentUser} />;
      default:
        return <HomeDashboard />; // Default to home
    }
  };

  if (!userHeader) {
      // Render nothing or a loading spinner while checking auth
      return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">Checking authentication...</div>;
  }

  return (
    <div className="grid grid-cols-5 grid-rows-[auto_1fr] h-screen bg-[#1a1a1a] text-white text-sm">

      {/* Header */}
      <Header userHeader={userHeader} onLogout={handleLogout} />

      {/* Navigation */}
      <Navigation activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content Area - Renders the active section */}
      <main className="col-span-4 overflow-y-auto"> {/* Added overflow for scrolling if content exceeds height */}
        {renderSection()}
      </main>

    </div>
  );
}

export default HomePage;