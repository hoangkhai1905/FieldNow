import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, RefreshCcw } from 'lucide-react';
import { verifyOTPRequest, resendOTPRequest } from '../../api/endpoints';

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

  const glassStyle = {
    background: 'rgba(2, 44, 34, 0.8)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '40px'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '18px',
    padding: '16px',
    color: '#fff',
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '8px',
    textAlign: 'center',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Background Elements */}
      <div style={{ position: 'absolute', top: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ ...glassStyle, width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.5)' }}
      >
        <div style={{ padding: '60px 40px', background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)' }}>
           <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Mail size={32} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: '950', margin: '0 0 12px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '-1px' }}>Xác thực Email</h2>
              <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: '500', lineHeight: 1.6 }}>
                 Chúng tôi đã gửi mã xác thực gồm 6 số đến email <br/>
                 <strong style={{ color: '#fff' }}>{email}</strong>
              </p>
           </div>

           {error && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: '#fb7185', marginBottom: '24px', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{error}</motion.div>}
           {successMsg && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: '#34d399', marginBottom: '24px', fontSize: '14px', fontWeight: '800', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CheckCircle size={18} /> {successMsg}</motion.div>}

           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                 <input 
                    type="text" 
                    placeholder="------" 
                    style={inputStyle}
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

              <button 
                type="submit" 
                disabled={loading || otp.length < 6}
                style={{ width: '100%', background: '#10b981', color: '#000', border: 'none', padding: '20px', borderRadius: '18px', fontSize: '16px', fontWeight: '950', cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)', transition: 'all 0.3s', opacity: (loading || otp.length < 6) ? 0.7 : 1 }}
              >
                {loading ? 'ĐANG KIỂM TRA...' : 'XÁC NHẬN'} <ArrowRight size={22} strokeWidth={3} />
              </button>
           </form>

           <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 Chưa nhận được mã? 
                 <button 
                   onClick={handleResend}
                   disabled={countdown > 0 || resending}
                   style={{ background: 'none', border: 'none', color: countdown > 0 ? '#475569' : '#10b981', fontWeight: '900', padding: 0, cursor: countdown > 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', transition: 'color 0.3s' }}
                 >
                   <RefreshCcw size={16} />
                   {resending ? 'Đang gửi...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại ngay'}
                 </button>
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
