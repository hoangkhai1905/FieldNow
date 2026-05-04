import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import '../../pages/public/UserFacing.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <div className="brand-lockup">
          <Link to="/" className="nav-brand">
            FieldNow
          </Link>
          <span className="brand-tag">Đặt sân, xác nhận, thanh toán</span>
        </div>
        <div className="nav-links">
          <Link to="/tim-san">Tìm sân</Link>
          <Link to="/nguoi-dung/dat-san-cua-toi">Đặt sân của tôi</Link>
          <Link to="/nguoi-dung/ho-so">Hồ sơ</Link>
          {isOwner && <Link to="/owner">Chủ sân</Link>}
          {isAdmin && <Link to="/admin">Quản trị</Link>}
          {!isAuthenticated ? (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          ) : (
            <button type="button" className="nav-ghost-button" onClick={logout}>
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;