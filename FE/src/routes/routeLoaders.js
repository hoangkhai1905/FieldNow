export const routeLoaders = {
  home: () => import('../pages/public/Home'),
  searchFields: () => import('../pages/public/SearchFields'),
  fieldDetail: () => import('../pages/public/FieldDetail'),
  paymentResult: () => import('../pages/public/PaymentResult'),
  login: () => import('../pages/auth/Login'),
  register: () => import('../pages/auth/Register'),
  forgotPassword: () => import('../pages/auth/ForgotPassword'),
  verifyOTP: () => import('../pages/auth/VerifyOTP'),
  myBookings: () => import('../pages/user/MyBookings'),
  profile: () => import('../pages/user/Profile'),
  bookingConfirmation: () => import('../pages/user/BookingConfirmation'),
  ownerDashboard: () => import('../pages/owner/Dashboard'),
  fieldManagement: () => import('../pages/owner/FieldManagement'),
  bookingManagement: () => import('../pages/owner/BookingManagement'),
  fieldSlots: () => import('../pages/owner/FieldSlots'),
  cashPayments: () => import('../pages/owner/CashPayments'),
  userManagement: () => import('../pages/admin/UserManagement'),
  adminDashboard: () => import('../pages/admin/AdminDashboard'),
};

const pathLoaderMap = [
  ['/', routeLoaders.home],
  ['/tim-san', routeLoaders.searchFields],
  ['/nguoi-dung/dat-san-cua-toi/confirm', routeLoaders.bookingConfirmation],
  ['/nguoi-dung/dat-san-cua-toi', routeLoaders.myBookings],
  ['/nguoi-dung/ho-so', routeLoaders.profile],
  ['/owner/fields/', routeLoaders.fieldSlots],
  ['/owner/fields', routeLoaders.fieldManagement],
  ['/owner/bookings', routeLoaders.bookingManagement],
  ['/owner/cash-payments', routeLoaders.cashPayments],
  ['/owner', routeLoaders.ownerDashboard],
  ['/admin/users', routeLoaders.userManagement],
  ['/admin', routeLoaders.adminDashboard],
  ['/login', routeLoaders.login],
  ['/register', routeLoaders.register],
];

const prefetchedRoutes = new Set();

export const prefetchRoute = (path) => {
  if (prefetchedRoutes.has(path)) return;

  const entry = pathLoaderMap.find(([prefix]) => (
    prefix === '/' ? path === '/' : path === prefix || path.startsWith(prefix)
  ));

  const loader = entry?.[1];
  if (!loader) return;

  prefetchedRoutes.add(path);
  void loader().catch(() => {
    prefetchedRoutes.delete(path);
  });
};
