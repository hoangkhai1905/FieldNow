import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  ArrowRight,
  Zap,
  ChevronRight,
  ShieldCheck,
  User
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { loginRequest } from '../../api/endpoints';

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
      if (data.user?.role === 'OWNER') navigate('/owner');
      else if (data.user?.role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const glassStyle = {
    background: 'rgba(2, 44, 34, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px'
  };

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '24px'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '16px 16px 16px 48px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Glows */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', opacity: 0.15, filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ ...glassStyle, width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}
      >
        {/* Brand Side */}
        <div style={{ padding: '60px', background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.4)', marginBottom: '32px', width: 'fit-content' }}>
            <Zap size={16} color="#F59E0B" fill="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>FIELDNOW PLATFORM</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '950', lineHeight: 1, textTransform: 'uppercase', margin: '0 0 24px 0', letterSpacing: '-1px', color: '#fff' }}>
            Chào mừng <br /><span style={{ color: '#F59E0B' }}>trở lại</span> sân đấu.
          </h1>
          <p style={{ color: '#a7f3d0', fontSize: '18px', lineHeight: 1.6, marginBottom: '40px', fontWeight: '500' }}>Đăng nhập để tiếp tục quản lý lịch đặt và sẵn sàng cho những trận cầu bùng nổ.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '16px', fontWeight: '700' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="#F59E0B" />
              </div>
              Bảo mật & Minh bạch
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', fontSize: '16px', fontWeight: '700' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#F59E0B" />
              </div>
              Thanh toán trong 30s
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div style={{ padding: '60px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <User size={32} color="#F59E0B" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 8px 0', color: '#fff' }}>Đăng nhập</h2>
            <p style={{ color: '#a7f3d0', fontSize: '14px', margin: 0, opacity: 0.8 }}>Nhập thông tin tài khoản của bạn</p>
          </div>

          {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: '#fb7185', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>{error}</motion.div>}

          <form onSubmit={handleSubmit}>
            <div style={inputGroupStyle}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
              <input
                type="email"
                placeholder="Email của bạn"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = '#F59E0B';
                  e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={inputGroupStyle}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
              <input
                type="password"
                placeholder="Mật khẩu"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                onFocus={(e) => {
                  e.target.style.borderColor = '#F59E0B';
                  e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#F59E0B', color: '#000', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(245, 158, 11, 0.2)', transition: 'transform 0.2s', marginTop: '32px' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'VÀO SÂN NGAY'} <ArrowRight size={20} strokeWidth={3} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Bạn chưa có tài khoản? {' '}
              <Link to="/register" style={{ color: '#F59E0B', fontWeight: '800', textDecoration: 'none' }}>Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;