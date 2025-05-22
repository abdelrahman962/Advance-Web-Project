import React from 'react';

function Header({ userHeader, onLogout }) {
  return (
    <header className="col-span-5 flex justify-end items-center bg-gray-900 border-b-2 border-gray-700 p-2">
      <h4 id="userHeader" className="font-bold mr-4">{userHeader}</h4> {/* Display userHeader prop */}
      <button
        id="logout"
        onClick={onLogout} // Use the onLogout prop function
        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm"
      >
        Logout
      </button>
    </header>
  );
}

export default Header;