import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext)
  return user ? children : <Navigate to="/signin" />
}

export default PrivateRoute