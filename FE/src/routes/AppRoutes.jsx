import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Home from '../pages/public/Home';
import SearchFields from '../pages/public/SearchFields';
import FieldDetail from '../pages/public/FieldDetail';
import PaymentResult from '../pages/public/PaymentResult';
import MyBookings from '../pages/user/MyBookings';
import Profile from '../pages/user/Profile';
import BookingConfirmation from '../pages/user/BookingConfirmation';
import MainLayout from '../layouts/MainLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';
import OwnerDashboard from '../pages/owner/Dashboard';
import FieldManagement from '../pages/owner/FieldManagement';
import Approvals from '../pages/admin/Approvals';
import UserManagement from '../pages/admin/UserManagement';

import VerifyOTP from '../pages/auth/VerifyOTP';
import ScrollToTop from '../components/layout/ScrollToTop';

const Unauthorized = () => (
  <div className="user-page shell-xl">
    <section className="search-hero">
      <p className="hero-kicker">Không có quyền truy cập</p>
      <h1>Trang này chỉ dành cho vai trò phù hợp.</h1>
      <p>Hãy đăng nhập bằng tài khoản đúng vai trò hoặc quay về trang chủ để tiếp tục.</p>
    </section>
  </div>
);

const NotFound = () => (
  <div className="user-page shell-xl">
    <section className="search-hero">
      <p className="hero-kicker">Không tìm thấy</p>
      <h1>Trang bạn tìm kiếm không tồn tại.</h1>
      <p>Đi về trang chủ hoặc dùng thanh điều hướng để tiếp tục.</p>
    </section>
  </div>
);

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tim-san" element={<SearchFields />} />
        <Route path="/san/:id" element={<FieldDetail />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/nguoi-dung/dat-san-cua-toi"
          element={
            <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nguoi-dung/dat-san-cua-toi/confirm"
          element={
            <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nguoi-dung/ho-so"
          element={
            <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['OWNER']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="fields" element={<FieldManagement />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Approvals />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
              <div className="user-page shell-xl">
                <section className="search-hero">
                  <p className="hero-kicker">Dashboard</p>
                  <h1>Bảng điều khiển trung tâm</h1>
                  <p>Chuyển hướng theo đúng vai trò chủ sân, quản trị hoặc người dùng.</p>
                </section>
              </div>
          </ProtectedRoute>
        } 
      />

        <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

export default AppRoutes;