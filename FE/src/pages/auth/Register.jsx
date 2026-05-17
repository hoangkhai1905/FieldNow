import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Users, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Trophy,
  Activity,
  Phone
} from 'lucide-react';
import { registerRequest, sendOTPRequest } from '../../api/endpoints';

const Register = () => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
      await registerRequest({ email, password, fullName, role, phoneNumber });
      try {
        await sendOTPRequest({ email });
      } catch (err) {
        console.error('Không thể tự động gửi OTP:', err);
      }
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setError(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
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
    padding: '16px 16px 16px 52px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Background Elements */}
      <div style={{ position: 'absolute', top: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ ...glassStyle, width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.5)' }}
      >
        {/* Brand Side - Motivation */}
        <div style={{ padding: '80px 60px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '40px', width: 'fit-content' }}>
              <Zap size={16} color="#10b981" fill="#10b981" />
              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '900', letterSpacing: '1.5px' }}>START YOUR LEGACY</span>
           </div>
           
           <h1 style={{ fontSize: '64px', fontWeight: '950', lineHeight: 0.95, textTransform: 'uppercase', margin: '0 0 32px 0', letterSpacing: '-3px', color: '#fff' }}>
              Join the <br /><span style={{ color: '#F59E0B' }}>Arena.</span>
           </h1>
           
           <p style={{ color: '#a7f3d0', fontSize: '20px', lineHeight: 1.6, marginBottom: '48px', opacity: 0.8, fontWeight: '500' }}>
             Gia nhập cộng đồng thể thao lớn nhất. Đặt sân nhanh, kết nối đội hình và bùng nổ đam mê.
           </p>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {[
                { icon: Trophy, text: 'Hệ thống giải đấu chuyên nghiệp', color: '#F59E0B' },
                { icon: Activity, text: 'Theo dõi chỉ số thi đấu real-time', color: '#10b981' },
                { icon: UserCheck, text: 'Xác thực tài khoản chính chủ', color: '#3b82f6' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#fff', fontSize: '15px', fontWeight: '700' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${item.color}30` }}>
                      <item.icon size={20} color={item.color} />
                   </div>
                   {item.text}
                </div>
              ))}
           </div>
        </div>

        {/* Form Side */}
        <div style={{ padding: '80px 60px', background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)' }}>
           <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '950', margin: '0 0 8px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '-1px' }}>Tạo tài khoản</h2>
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Chỉ mất 30 giây để bắt đầu</p>
           </div>

           {error && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: '#fb7185', marginBottom: '24px', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>{error}</motion.div>}

           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ position: 'relative' }}>
                 <User size={20} style={{ position: 'absolute', left: '18px', top: '16px', color: '#64748b' }} />
                 <input 
                    type="text" 
                    placeholder="Họ và tên cầu thủ" 
                    style={inputStyle}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                 />
              </div>

              <div style={{ position: 'relative' }}>
                 <Mail size={20} style={{ position: 'absolute', left: '18px', top: '16px', color: '#64748b' }} />
                 <input 
                    type="email" 
                    placeholder="Email liên lạc" 
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                 />
              </div>

              <div style={{ position: 'relative' }}>
                 <Phone size={20} style={{ position: 'absolute', left: '18px', top: '16px', color: '#64748b' }} />
                 <input 
                    type="text" 
                    placeholder="Số điện thoại liên lạc" 
                    style={inputStyle}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                 />
              </div>

              <div style={{ position: 'relative' }}>
                 <Lock size={20} style={{ position: 'absolute', left: '18px', top: '16px', color: '#64748b' }} />
                 <input 
                    type="password" 
                    placeholder="Mật khẩu bảo mật" 
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                 />
              </div>

              <div style={{ marginTop: '10px' }}>
                 <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#10b981', marginBottom: '16px', letterSpacing: '1px' }}>Bạn tham gia với tư cách</label>
                 <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { id: 'USER', label: 'NGƯỜI CHƠI', icon: Users },
                      { id: 'OWNER', label: 'CHỦ SÂN', icon: ShieldCheck }
                    ].map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        style={{ flex: 1, padding: '16px', borderRadius: '20px', background: role === r.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${role === r.id ? '#10b981' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
                      >
                         <r.icon size={22} color={role === r.id ? '#10b981' : '#64748b'} style={{ marginBottom: '8px' }} />
                         <div style={{ fontSize: '11px', fontWeight: '900', color: role === r.id ? '#fff' : '#64748b' }}>{r.label}</div>
                      </div>
                    ))}
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', background: '#F59E0B', color: '#000', border: 'none', padding: '20px', borderRadius: '18px', fontSize: '16px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(245, 158, 11, 0.2)', transition: 'all 0.3s', marginTop: '12px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(245, 158, 11, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.2)';
                }}
              >
                {loading ? 'ĐANG KHỞI TẠO...' : 'TẠO TÀI KHOẢN NGAY'} <ArrowRight size={22} strokeWidth={3} />
              </button>
           </form>

           <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
                 Đã có tài khoản? {' '}
                 <Link to="/login" style={{ color: '#10b981', fontWeight: '900', textDecoration: 'none', paddingLeft: '4px' }}>Đăng nhập</Link>
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;