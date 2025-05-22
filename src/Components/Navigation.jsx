import React from 'react';

function Navigation({ activeSection, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'chat', label: 'Chat' },
  ];

  return (
    <nav className="col-span-1 bg-[#4d4d4d] h-full">
      <ul className="list-none m-0 p-0">
        {navItems.map(item => (
          <li key={item.id} className="my-[10px] flex justify-center">
            <button
              onClick={() => onNavigate(item.id)} // Use the onNavigate prop function
              className={`common-nav-btn w-4/5 text-left p-[10px] rounded-[5px] text-white
                         ${activeSection === item.id ? 'bg-[#0000ff]' : 'bg-[#9a9a9a]'}
                         hover:bg-[#8080ff]`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;