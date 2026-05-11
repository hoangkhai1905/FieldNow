import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Loader2, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { loginRequest, sendOTPRequest, normalizeUser } from '../../api/endpoints';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

  useEffect(() => {
    if (message) {
      setError(message);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResend(false);

    try {
      const data = await loginRequest({ email, password });
      login(data.token, normalizeUser(data.user));
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
      
      // If email not verified, backend usually returns 401 with a specific message
      if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('xác thực')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOTPRequest({ email });
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã xác thực. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '32px',
    padding: '48px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '18px 18px 18px 52px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s'
  };

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '20px'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#022c22', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decorative Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}
      >
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '24px' }}>
            <div style={{ background: '#F59E0B', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color="#000" fill="#000" />
            </div>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: '950', letterSpacing: '-1px' }}>FIELDNOW</span>
          </Link>
          <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', margin: 0, letterSpacing: '-1px' }}>CHÀO MỪNG TRỞ LẠI</h2>
          <p style={{ color: '#64748b', marginTop: '12px' }}>Vào sân ngay để tiếp tục hành trình của bạn.</p>
        </div>

        {/* Login Form Card */}
        <div style={glassStyle}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginBottom: '32px', padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '16px', color: '#f43f5e', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '14px', fontWeight: '700' }}>{error}</span>
              </div>
              
              {showResend && (
                <div style={{ paddingLeft: '28px', marginTop: '4px' }}>
                  <button 
                    type="button"
                    onClick={handleRequestVerify}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#F59E0B', textDecoration: 'underline', fontSize: '13px', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                  >
                    Xác thực tài khoản ngay
                  </button>
                </div>
              )}
            </motion.div>
          )}

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
              />
              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <Link to="/forgot-password" style={{ color: '#F59E0B', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                background: '#F59E0B', 
                color: '#000', 
                border: 'none', 
                padding: '18px', 
                borderRadius: '16px', 
                fontSize: '16px', 
                fontWeight: '950', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                boxShadow: '0 15px 30px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.3s',
                marginTop: '32px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>ĐĂNG NHẬP NGAY <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', color: '#64748b', fontSize: '14px' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#fff', fontWeight: '800', textDecoration: 'none' }}>
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;