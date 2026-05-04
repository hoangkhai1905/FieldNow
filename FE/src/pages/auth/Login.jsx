import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { loginRequest } from '../../api/endpoints';
import '../public/UserFacing.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginRequest({ email, password });
      login(data.token, data.user);

      if (data.user?.role === 'OWNER') {
        navigate('/owner');
      } else if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-card auth-card-split">
        <div className="auth-brand-panel">
          <p className="eyebrow">FieldNow</p>
          <h1>Đăng nhập để sẵn sàng ra sân cùng đội bạn.</h1>
          <p>
            Một tài khoản, nhiều tiện ích: tìm sân, đặt lịch, giữ chỗ và thanh toán nhanh.
          </p>
          <div className="auth-highlights">
            <span>Tìm sân</span>
            <span>Đặt lịch</span>
            <span>Giữ chỗ</span>
            <span>Thanh toán</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Đăng nhập</h2>
          <p className="muted">Dùng tài khoản bạn đã đăng ký để bắt đầu đặt sân.</p>

          {error && <div className="notice notice-error">{error}</div>}

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="form-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p className="auth-footnote">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default Login;