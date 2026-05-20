import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, RefreshCcw, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { verifyOTPRequest, resendOTPRequest } from '../../api/endpoints';
import Logo from '../../components/common/Logo';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
    
    // Countdown timer for resend
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [email, navigate, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await verifyOTPRequest({ email, otp_code: otp });
      setSuccessMsg('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setSuccessMsg('');
    setResending(true);
    try {
      await resendOTPRequest({ email });
      setSuccessMsg('Mã OTP mới đã được gửi!');
      setCountdown(60); // Reset cooldown
    } catch (error) {
      setError(error.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 p-4 relative overflow-hidden">
      {/* Background Decorative Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-emerald-500/5 blur-[80px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center no-underline mb-6">
            <Logo size={44} showText={true} textVariant="auth" />
          </Link>
          <h2 className="text-3xl font-black text-white m-0 tracking-tight uppercase">Xác thực Email</h2>
          <p className="text-slate-500 text-sm mt-3">
            Chúng tôi đã gửi mã xác thực gồm 6 số đến email
          </p>
          <p className="text-white text-sm font-bold mt-1">{email}</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-[32px] p-6 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 flex items-center gap-2.5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span className="font-bold">{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 flex items-center gap-2.5 text-sm font-bold justify-center"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <input 
                type="text" 
                placeholder="------" 
                className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 text-white text-2xl font-black tracking-[8px] text-center outline-none focus:border-amber-500 transition-colors"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                required
                maxLength={6}
                autoFocus
              />
            </div>

            <motion.button 
              type="submit" 
              disabled={loading || otp.length < 6}
              whileHover={!(loading || otp.length < 6) ? { y: -2 } : {}}
              whileTap={!(loading || otp.length < 6) ? { y: 0 } : {}}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-4.5 rounded-2xl text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>XÁC NHẬN <ArrowRight size={20} /></>
              )}
            </motion.button>
          </form>

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2 m-0">
              Chưa nhận được mã?{' '}
              <button 
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="bg-none border-none text-emerald-400 disabled:text-slate-600 font-extrabold cursor-pointer hover:underline disabled:no-underline flex items-center gap-1.5 transition-colors"
              >
                <RefreshCcw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? 'Đang gửi...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại ngay'}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/login" className="text-slate-500 hover:text-white no-underline text-sm font-bold inline-flex items-center gap-2 transition-colors">
            <ArrowLeft size={16} /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
