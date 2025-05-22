import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignInForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      const role = user.isStudent ? "Student" : "Admin";
      login({ user, role }, rememberMe);
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="bg-[#333333] rounded-2xl px-4 py-6 w-[380px] text-left">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-semibold">Sign In</h1>
      </header>

      {error && <p className="text-red-500 text-lg text-center mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <label htmlFor="username" className="mb-1">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
        />

        <label htmlFor="password" className="mb-1">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-500 text-white rounded px-2 h-8 mb-3 w-full"
        />

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="staySignedIn"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="staySignedIn">Stay Signed In</label>
        </div>

        <button
          type="submit"
          className="bg-green-500 hover:bg-green-900 text-white rounded h-9 mb-4 cursor-pointer"
        >
          Sign In
        </button>

        <a
          href="/signup"
          className="text-blue-600 hover:text-blue-900 text-sm text-center block"
        >
          Do not have account?
        </a>
      </form>
    </div>
  );
};

export default SignInForm;