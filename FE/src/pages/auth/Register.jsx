import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerRequest } from '../../api/endpoints';
import '../public/UserFacing.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerRequest({ email, password, fullName, role });
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-card auth-card-split">
        <div className="auth-brand-panel auth-brand-panel-alt">
          <p className="eyebrow">FieldNow</p>
          <h1>Tạo tài khoản để bắt đầu đặt sân hoặc quản lý sân.</h1>
          <p>
            Chọn vai trò phù hợp. Chủ sân dùng trang quản lý lịch, người chơi dùng luồng đặt sân.
          </p>
          <div className="auth-highlights">
            <span>Người chơi</span>
            <span>Chủ sân</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Đăng ký</h2>
          <p className="muted">Chọn vai trò phù hợp để bắt đầu.</p>

          {error && <div className="notice notice-error">{error}</div>}

          <label className="form-field">
            <span>Họ và tên</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </label>

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
              placeholder="Tối thiểu 8 ký tự"
              required
            />
          </label>

          <label className="form-field">
            <span>Vai trò</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="USER">Người chơi</option>
              <option value="OWNER">Chủ sân</option>
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>

          <p className="auth-footnote">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </section>
    </div>
  );
};

export default Register;