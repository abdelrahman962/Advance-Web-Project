import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isStudent: false,
    uniID: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username, password, isStudent, uniID } = formData;
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    if (isStudent && !uniID) {
      setError('University ID is required for students');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(user => user.username === username)) {
      setError('Username already exists');
      return;
    }

    const newUser = { 
      username, 
      password, 
      isStudent, 
      uniID: isStudent ? uniID : null 
    };
    
    localStorage.setItem('users', JSON.stringify([...users, newUser]));
    setError('');
    setTimeout(() => navigate('/signin'), 1500);
  };

  return (
    <div className="bg-[#333333] rounded-2xl px-4 py-6 w-[380px] text-left">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-semibold">Sign Up</h1>
      </header>

      {error && <p className="text-red-500 text-lg text-center mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <label htmlFor="username" className="mb-1">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
        />

        <label htmlFor="password" className="mb-1">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
        />

        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="student"
            name="isStudent"
            checked={formData.isStudent}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="student">I am a student</label>
        </div>

        {formData.isStudent && (
          <div className="bg-gray-500 rounded px-2 py-2 mb-3">
            <label htmlFor="uniID" className="block mb-1">University ID</label>
            <input
              type="text"
              id="uniID"
              name="uniID"
              value={formData.uniID}
              onChange={handleChange}
              className="bg-gray-400 text-white rounded px-2 h-8 w-full"
            />
          </div>
        )}

        <button
          type="submit"
          className="bg-green-500 hover:bg-green-900 text-white rounded h-9 mb-4 cursor-pointer"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;