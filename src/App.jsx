import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import HomePage from './pages/HomePage';
import AddProjectForm from './pages/AddProjectForm'; // Import the new component
import AddTaskForm from './pages/AddTaskForm'; // Import the new component

function App() {
  // You might add basic auth check here to redirect users if not signed in
  // For now, we'll keep it simple based on the routes

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/signin" element={<SignIn />} />
       
        <Route path="/signup" element={<SignUp />} />

        <Route path="/home" element={<HomePage />} />
        <Route path="/add-project" element={<AddProjectForm />} /> {/* Added route */}
        <Route path="/add-task" element={<AddTaskForm />} /> {/* Added route */}
        <Route path="/add-task" element={<AddTaskForm />} /> {/* Added route */}

        <Route path="/" element={<Navigate to="/signin" replace />} />

        { <Route path="*" element={<Navigate to="/signin" replace />} /> }
      </Routes>
    </BrowserRouter>
  );
}

export default App;



/*



import { useQuery, gql } from '@apollo/client';

const GET_USERS = gql`
  query {
    users {
      id
      name
    }
  }
`;

function App() {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Users:</h1>
      <ul>
        {data.users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;



*/