
//path: src/pages/SignUp.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { CREATE_USER } from '../graphql/mutations.js';
import { set } from 'lodash';
function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [uniID, setUniID] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
const [createUser] = useMutation(CREATE_USER, {
  onError: (error) => {
    console.error('GraphQL Error:', error.message);
    setError('Failed to sign up. Try again.');
  },
});
  const handleSubmit = async(e) => {
    e.preventDefault();
    setError('');

try{
      const role = isStudent ? 'Student' : 'Admin';
      

  const {data}=   await createUser({
        variables: {
          name: username.trim(),
          role,
         password: password.trim(),
          
UniId: isStudent ? parseInt(uniID.trim(), 10) : null,
        },
      });


        setError('Sign up successful! Redirecting to Sign In...'); // Set success message
   setTimeout(() => { 
      navigate('/signin'); // Redirect to Sign In page after 2 seconds
    }, 1000);

}catch (error) {
      console.error('Error creating user:', error);   
}
      };

  return (
    <div className="bg-[#1a1a1a] text-white flex items-center justify-center h-screen font-sans">
      <div className="bg-[#333333] rounded-2xl px-4 py-6 w-[380px] text-left">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-semibold">Sign Up</h1>
        </header>

        {error && <p className={`text-center mb-2 ${error.includes('successful') ? 'text-green-400' : 'text-red-500'} text-lg`}>{error}</p>}

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

          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="student"
              
              className="mr-2"
              checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
            />
            <label htmlFor="student">I am a student</label>
          </div>

          {isStudent && (
            <div id="university" className="bg-gray-500 rounded px-2 py-2 mb-3">
              <label htmlFor="uniID" className="block mb-1">University ID</label>
              <input
                type="text"
                id="uniID"
                className="bg-gray-400 text-white rounded px-2 h-8 w-full"
                value={uniID}
                onChange={(e) => setUniID(e.target.value)}
                required={isStudent}
              />
            </div>
          )}

          <button
            type="submit"
            id="Signup"
            className="bg-green-500 hover:bg-green-900 text-white rounded h-9 mb-4 cursor-pointer"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUp;