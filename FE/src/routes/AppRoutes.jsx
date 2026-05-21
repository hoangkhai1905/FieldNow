import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';
import { routeLoaders } from './routeLoaders';

import ScrollToTop from '../components/layout/ScrollToTop';

const Home = lazy(routeLoaders.home);
const SearchFields = lazy(routeLoaders.searchFields);
const FieldDetail = lazy(routeLoaders.fieldDetail);
const PaymentResult = lazy(routeLoaders.paymentResult);
const Login = lazy(routeLoaders.login);
const Register = lazy(routeLoaders.register);
const ForgotPassword = lazy(routeLoaders.forgotPassword);
const VerifyOTP = lazy(routeLoaders.verifyOTP);
const MyBookings = lazy(routeLoaders.myBookings);
const Profile = lazy(routeLoaders.profile);
const BookingConfirmation = lazy(routeLoaders.bookingConfirmation);
const OwnerDashboard = lazy(routeLoaders.ownerDashboard);
const FieldManagement = lazy(routeLoaders.fieldManagement);
const BookingManagement = lazy(routeLoaders.bookingManagement);
const FieldSlots = lazy(routeLoaders.fieldSlots);
const CashPayments = lazy(routeLoaders.cashPayments);
const UserManagement = lazy(routeLoaders.userManagement);
const AdminDashboard = lazy(routeLoaders.adminDashboard);

const RouteFallback = () => (
  <div className="route-fallback" aria-label="Đang tải trang" />
);

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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tim-san" element={<SearchFields />} />
        <Route path="/san/:id" element={<FieldDetail />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/payment/success" element={<PaymentResult />} />
        <Route path="/payment/cancel" element={<PaymentResult />} />
        <Route path="/payment/error" element={<PaymentResult />} />
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
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="fields" element={<FieldManagement />} />
          <Route path="fields/:fieldId/slots" element={<FieldSlots />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="cash-payments" element={<CashPayments />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
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
      </Suspense>
    </>
  );
};

export default AppRoutes;
