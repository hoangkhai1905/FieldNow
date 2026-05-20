import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/endpoints';
import Logo from '../../components/common/Logo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword({ email });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword({ 
          email, 
          otp: formData.otp, 
          newPassword: formData.newPassword 
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
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
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center no-underline mb-6">
            <Logo size={44} showText={true} textVariant="auth" />
          </Link>
          <h2 className="text-3xl font-black text-white m-0 tracking-tight">QUÊN MẬT KHẨU?</h2>
          <p className="text-slate-500 text-sm mt-3">Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-[32px] p-6 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOTP}
              >
                <div className="mb-6">
                  <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider mb-3">Địa chỉ Email của bạn</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4.5 text-slate-500" size={18} />
                    <input 
                      type="email" required placeholder="name@company.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-base outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 flex items-center gap-2.5 text-sm"
                  >
                    <AlertCircle size={18} className="shrink-0 text-rose-500" />
                    <span className="font-bold">{error}</span>
                  </motion.div>
                )}

                <motion.button 
                  type="submit" 
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black py-4.5 rounded-2xl text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>NHẬN MÃ XÁC THỰC <ArrowRight size={20} /></>}
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
              >
                <div className="flex flex-col gap-5 mb-8">
                  <div>
                    <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider mb-3">Mã OTP (6 chữ số)</label>
                    <input 
                      required placeholder="000000" maxLength={6}
                      value={formData.otp} onChange={e => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 text-white text-2xl font-black tracking-[8px] text-center outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider mb-3">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4.5 text-slate-500" size={18} />
                      <input 
                        type="password" required placeholder="••••••••"
                        value={formData.newPassword} onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-base outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-emerald-200 uppercase tracking-wider mb-3">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-4.5 text-slate-500" size={18} />
                      <input 
                        type="password" required placeholder="••••••••"
                        value={formData.confirmPassword} onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-base outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 flex items-center gap-2.5 text-sm"
                  >
                    <AlertCircle size={18} className="shrink-0 text-rose-500" />
                    <span className="font-bold">{error}</span>
                  </motion.div>
                )}

                <motion.button 
                  type="submit" 
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-4.5 rounded-2xl text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>ĐẶT LẠI MẬT KHẨU <CheckCircle2 size={20} /></>}
                </motion.button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">THÀNH CÔNG!</h3>
                <p className="text-slate-500 mb-8 text-sm">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.</p>
                <motion.button 
                  onClick={() => navigate('/login')}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4.5 rounded-2xl text-base font-black cursor-pointer shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all"
                >
                  ĐĂNG NHẬP NGAY
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
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

export default ForgotPassword;
