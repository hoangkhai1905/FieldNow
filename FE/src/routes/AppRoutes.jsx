import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

const Home = () => <div className="p-8"><h2>Home Page</h2></div>;
const Dashboard = () => <div className="p-8"><h2>Main Dashboard</h2></div>;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;