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

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-10 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[5%] right-[5%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/10 to-transparent blur-[100px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-[5%] left-[5%] w-[400px] h-[400px] bg-gradient-to-br from-amber-500/10 to-transparent blur-[100px] pointer-events-none rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-emerald-950/80 backdrop-blur-[32px] border border-white/10 rounded-[40px] w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
      >
        {/* Brand Side - Motivation */}
        <div className="p-8 md:p-16 lg:p-20 bg-gradient-to-br from-emerald-500/5 to-transparent flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/5">
           <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 rounded-full border border-emerald-500/30 mb-10 w-fit">
              <Zap size={16} className="text-emerald-500 fill-emerald-500" />
              <span className="text-emerald-500 text-[10px] md:text-xs font-black tracking-widest">START YOUR LEGACY</span>
           </div>
           
            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] uppercase m-0 mb-8 tracking-tighter text-white">
              NÂNG TẦM <br />
              <span className="text-amber-500">TRẢI NGHIỆM</span> <br />
              THUÊ SÂN <span className="text-amber-500">THỂ THAO.</span>
            </h1>
           
           <p className="text-emerald-200 text-lg md:text-xl leading-relaxed mb-12 opacity-80 font-medium">
             Gia nhập cộng đồng thể thao lớn nhất. Thuê sân nhanh, kết nối đồng đội và bùng nổ đam mê.
           </p>

           <div className="flex flex-col gap-6">
              {[
                { icon: Trophy, text: 'Hệ thống giải đấu chuyên nghiệp', color: '#F59E0B' },
                { icon: Activity, text: 'Theo dõi chỉ số thi đấu real-time', color: '#10b981' },
                { icon: UserCheck, text: 'Xác thực tài khoản chính chủ', color: '#3b82f6' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 text-white text-sm md:text-base font-bold">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${item.color}20`, borderColor: `${item.color}30` }}>
                      <item.icon size={20} color={item.color} />
                   </div>
                   {item.text}
                </div>
              ))}
           </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-16 lg:p-20 bg-black/15 backdrop-blur-[10px]">
           <div className="text-center mb-10">
              <h2 className="text-3xl font-black m-0 mb-2 text-white uppercase tracking-tight">Tạo tài khoản</h2>
              <p className="text-slate-500 text-sm font-semibold">Chỉ mất 30 giây để bắt đầu</p>
           </div>

           {error && <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 mb-6 text-sm font-extrabold text-center">{error}</motion.div>}

           <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              <div className="relative">
                 <User size={20} className="absolute left-4.5 top-4 text-slate-500" />
                 <input 
                    type="text" 
                    placeholder="Họ và tên" 
                    className="w-full bg-black/30 border border-white/10 rounded-[18px] py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                 />
              </div>

              <div className="relative">
                 <Mail size={20} className="absolute left-4.5 top-4 text-slate-500" />
                 <input 
                    type="email" 
                    placeholder="Email liên lạc" 
                    className="w-full bg-black/30 border border-white/10 rounded-[18px] py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                 />
              </div>

              <div className="relative">
                 <Phone size={20} className="absolute left-4.5 top-4 text-slate-500" />
                 <input 
                    type="text" 
                    placeholder="Số điện thoại liên lạc" 
                    className="w-full bg-black/30 border border-white/10 rounded-[18px] py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                 />
              </div>

              <div className="relative">
                 <Lock size={20} className="absolute left-4.5 top-4 text-slate-500" />
                 <input 
                    type="password" 
                    placeholder="Mật khẩu bảo mật" 
                    className="w-full bg-black/30 border border-white/10 rounded-[18px] py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-amber-500 transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                 />
              </div>

              <div className="mt-2.5">
                 <label className="block text-xs font-black uppercase text-emerald-500 mb-4 tracking-wider">Bạn tham gia với tư cách</label>
                 <div className="flex gap-4">
                    {[
                      { id: 'USER', label: 'NGƯỜI CHƠI', icon: Users },
                      { id: 'OWNER', label: 'CHỦ SÂN', icon: ShieldCheck }
                    ].map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className="flex-1 p-4 rounded-2xl cursor-pointer text-center transition-all duration-300 flex flex-col items-center gap-2"
                        style={{ 
                          background: role === r.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${role === r.id ? '#10b981' : 'rgba(255,255,255,0.1)'}` 
                        }}
                      >
                         <r.icon size={22} className={role === r.id ? 'text-emerald-500' : 'text-slate-500'} />
                         <div className="text-[10px] font-black" style={{ color: role === r.id ? '#fff' : '#64748b' }}>{r.label}</div>
                      </div>
                    ))}
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black py-4.5 rounded-2xl text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_20px_40px_rgba(245,158,11,0.2)] transition-all mt-4"
              >
                {loading ? 'ĐANG KHỞI TẠO...' : 'TẠO TÀI KHOẢN NGAY'} <ArrowRight size={22} className="stroke-[3]" />
              </button>
           </form>

           <div className="text-center mt-8">
              <p className="text-slate-500 text-sm font-medium">
                 Đã có tài khoản?{' '}
                 <Link to="/login" className="text-emerald-500 hover:text-emerald-600 font-extrabold no-underline pl-1 transition-colors">Đăng nhập</Link>
              </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;