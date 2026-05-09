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
  Zap,
  ShieldCheck,
  Key
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/endpoints';

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

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '32px',
    padding: '48px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#022c22', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '24px' }}>
            <div style={{ background: '#F59E0B', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color="#000" fill="#000" />
            </div>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: '950', letterSpacing: '-1px' }}>FIELDNOW</span>
          </Link>
          <h2 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', margin: 0, letterSpacing: '-1px' }}>QUÊN MẬT KHẨU?</h2>
          <p style={{ color: '#64748b', marginTop: '12px' }}>Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập.</p>
        </div>

        <div style={glassStyle}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOTP}
              >
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Địa chỉ Email của bạn</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                    <input 
                      type="email" required placeholder="name@company.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 16px 16px 52px', color: '#fff', fontSize: '16px', outline: 'none' }}
                    />
                  </div>
                </div>

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '24px', padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '14px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}><AlertCircle size={18} /> {error}</motion.div>}

                <button 
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.3s' }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>NHẬN MÃ XÁC THỰC <ArrowRight size={20} /></>}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Mã OTP (6 chữ số)</label>
                    <input 
                      required placeholder="000000" maxLength={6}
                      value={formData.otp} onChange={e => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '24px', fontWeight: '900', letterSpacing: '8px', textAlign: 'center', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                      <input 
                        type="password" required placeholder="••••••••"
                        value={formData.newPassword} onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 16px 16px 52px', color: '#fff', fontSize: '16px', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Xác nhận mật khẩu</label>
                    <div style={{ position: 'relative' }}>
                      <ShieldCheck style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                      <input 
                        type="password" required placeholder="••••••••"
                        value={formData.confirmPassword} onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px 16px 16px 52px', color: '#fff', fontSize: '16px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '24px', padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '14px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}><AlertCircle size={18} /> {error}</motion.div>}

                <button 
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#10b981', color: '#fff', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.3s' }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>ĐẶT LẠI MẬT KHẨU <CheckCircle2 size={20} /></>}
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={48} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', marginBottom: '12px' }}>THÀNH CÔNG!</h3>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.</p>
                <button 
                  onClick={() => navigate('/login')}
                  style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer' }}
                >
                  ĐĂNG NHẬP NGAY
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/login" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
