import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { sendOTPRequest } from '../../api/endpoints';
import Logo from '../../components/common/Logo';

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
      
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 p-4 relative overflow-hidden">
      {/* Background Decorative Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-emerald-500/5 blur-[80px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center no-underline mb-6">
            <Logo size={44} showText={true} textVariant="auth" />
          </Link>
          <h2 className="text-3xl font-black text-white m-0 tracking-tight">CHÀO MỪNG TRỞ LẠI</h2>
          <p className="text-slate-500 text-sm mt-3">Vào sân ngay để tiếp tục hành trình của bạn.</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-[32px] p-6 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl color-rose-500 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-rose-500">{error}</span>
              </div>
              
              {showResend && (
                <div className="pl-7 mt-1">
                  <button 
                    type="button"
                    onClick={handleRequestVerify}
                    disabled={loading}
                    className="background-none border-none text-amber-500 underline text-xs font-bold p-0 cursor-pointer"
                  >
                    Xác thực tài khoản ngay
                  </button>
                </div>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative mb-5">
              <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Email hoặc số điện thoại"
                className="w-full bg-black/20 border border-white/10 rounded-2xl text-white text-base outline-none focus:border-amber-500 transition-colors"
                style={{ minHeight: '58px', padding: '16px 18px 16px 54px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative mb-5">
              <Lock size={18} className="absolute left-5 top-[29px] -translate-y-1/2 text-slate-500 pointer-events-none z-10" />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full bg-black/20 border border-white/10 rounded-2xl text-white text-base outline-none focus:border-amber-500 transition-colors"
                style={{ minHeight: '58px', padding: '16px 18px 16px 54px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="text-right mt-3">
                <Link to="/forgot-password" className="text-amber-500 no-underline text-xs font-bold hover:text-amber-600 transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black py-4.5 rounded-2xl text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all mt-8"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>ĐĂNG NHẬP NGAY <ArrowRight size={20} /></>
              )}
            </motion.button>
          </form>

          <div className="text-center mt-8 text-slate-500 text-sm">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-white font-extrabold no-underline hover:text-amber-500 transition-colors">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
