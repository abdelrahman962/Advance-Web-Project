import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGIN_USER } from '../graphql/mutations.js';
import { useMutation, gql } from '@apollo/client';



function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const navigate = useNavigate();
  const [loginUser] = useMutation(LOGIN_USER, {
    onCompleted: (data) => {
    if(data?.login?.token && data?.login?.user){
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('currentUser', JSON.stringify(data.login.user));  
      localStorage.setItem('userHeader', `${data.login.user.role} ${data.login.user.name}`);
      navigate('/home');
      
    }else{
      setError('Invalid username or password!');
    }
    },
    onError: (error) => {
      console.error('GraphQL Error:', error.message);
      setError('Invalid username or password!');
    },
  });
  const handleSubmit = async(e) => {
    e.preventDefault();
    setError('');
    

   await loginUser({variables:{
      name: username.trim(),
      password: password.trim(),  
   }})

    // Simulate a successful login
    // In a real application, you would handle authentication here
    // For example, you might call an API to verify the username and password

    // If staySignedIn is checked, save the username and password in local storage
    if (staySignedIn) {
      localStorage.setItem('username', username);
      localStorage.setItem('password', password);
    } else {
      localStorage.removeItem('username');
      localStorage.removeItem('password');
    }
  };

  return (
    <div className="bg-[#1a1a1a] text-white flex items-center justify-center h-screen font-sans">
      <div className="bg-[#333333] rounded-2xl px-4 py-6 w-[380px] text-left">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-semibold">Sign In</h1>
        </header>

        {error && <p className="text-red-500 text-lg text-center mb-2">{error}</p>}

        <form id="form" onSubmit={handleSubmit} className="flex flex-col">
          <label htmlFor="username" className="mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password" className="mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="staySignedIn"
              name="staySignedIn"
              className="mr-2"
              checked={staySignedIn}
              onChange={(e) => setStaySignedIn(e.target.checked)}
            />
            <label htmlFor="staySignedIn">Stay Signed In</label>
          </div>

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-900 text-white rounded h-9 mb-4 cursor-pointer"
          >
            Sign In
          </button>
         
          <Link
            to="/signup"
            id="new-Account"
            className="text-blue-600 hover:text-blue-900 text-sm text-center block"
          >
            Do not have account?
          </Link>
        </form>
      </div>
    </div>
  );
}

export default SignIn;