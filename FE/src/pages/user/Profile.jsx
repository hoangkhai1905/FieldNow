import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Hash, 
  Settings, 
  CreditCard, 
  Heart,
  UserCheck,
  Bell,
  ChevronRight,
  LogOut,
  Trophy,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getCurrentUser, formatCurrency } from '../../api/endpoints';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);

  const roleConfig = (role) => {
    switch (role) {
      case 'OWNER': return { label: 'Chủ sân', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'ADMIN': return { label: 'Đội vận hành', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      default: return { label: 'Người chơi', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const result = await getCurrentUser();
        if (mounted) setProfile(result);
      } catch {
        if (mounted) setProfile(user);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px'
  };

  const currentRole = roleConfig(profile?.role);

  const stats = [
    { label: 'Trận đã đấu', value: '12', icon: Trophy, color: '#F59E0B' },
    { label: 'Số giờ chơi', value: '24h', icon: Activity, color: '#10b981' },
    { label: 'Sân yêu thích', value: '03', icon: Heart, color: '#fb7185' },
    { label: 'Tỉ lệ thắng', value: '75%', icon: Target, color: '#3b82f6' },
  ];

  return (
    <div style={{ color: '#fff', flex: 1, paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Profile Hero */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...glassStyle, padding: '48px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '40px', position: 'relative', overflow: 'hidden' }}
        >
          {/* Background Glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(245, 158, 11, 0.1)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
          
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-6px', background: 'linear-gradient(45deg, #F59E0B, #10b981)', borderRadius: '50%', opacity: 0.8, filter: 'blur(10px)' }}></div>
            <div style={{ position: 'relative', width: '140px', height: '140px', background: '#022c22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
              <User size={80} color="#fff" />
            </div>
            <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '36px', height: '36px', background: '#F59E0B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #022c22' }}>
               <Zap size={18} color="#000" fill="#000" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
               <span style={{ padding: '6px 16px', borderRadius: '100px', background: currentRole.bg, color: currentRole.color, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', border: `1px solid ${currentRole.color}30` }}>
                 <UserCheck size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {currentRole.label}
               </span>
               <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>#{profile?.id?.slice(0, 8)}</span>
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>{profile?.fullName || profile?.full_name || 'Cầu thủ Pro'}</h1>
            <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '12px', opacity: 0.8 }}>Thành viên từ tháng {new Date(profile?.createdAt || Date.now()).getMonth() + 1}, {new Date(profile?.createdAt || Date.now()).getFullYear()}</p>
          </div>
        </motion.section>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
           {stats.map((stat, idx) => {
             const Icon = stat.icon;
             return (
               <motion.div
                 key={idx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 whileHover={{ y: -5, background: 'rgba(255,255,255,0.08)' }}
                 style={{ ...glassStyle, padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
               >
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Icon size={24} color={stat.color} />
                  </div>
                  <div>
                     <p style={{ margin: 0, fontSize: '24px', fontWeight: '950', color: '#fff' }}>{stat.value}</p>
                     <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>{stat.label}</p>
                  </div>
               </motion.div>
             );
           })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
          {/* Detailed Info */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ ...glassStyle, padding: '40px' }}
          >
            <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={22} color="#F59E0B" /> THÔNG TIN TÀI KHOẢN
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
               {[
                 { icon: Mail, label: 'Địa chỉ Email', value: profile?.email },
                 { icon: Phone, label: 'Số điện thoại', value: profile?.phoneNumber || profile?.phone_number || 'Chưa cập nhật' },
                 { icon: Hash, label: 'Mã định danh hệ thống', value: profile?.id }
               ].map((item, idx) => (
                 <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <item.icon size={20} color="#F59E0B" />
                    </div>
                    <div>
                       <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</span>
                       <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{item.value || '---'}</span>
                    </div>
                 </div>
               ))}
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <div style={{ ...glassStyle, padding: '32px' }}>
               <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={20} color="#F59E0B" /> CÀI ĐẶT
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { icon: CreditCard, label: 'Ví & Thanh toán' },
                    { icon: Bell, label: 'Thông báo' },
                    { icon: Shield, label: 'Bảo mật tài khoản' }
                  ].map((action, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <action.icon size={18} color="#a7f3d0" />
                          <span style={{ fontSize: '15px', fontWeight: '700' }}>{action.label}</span>
                       </div>
                       <ChevronRight size={16} color="#64748b" />
                    </div>
                  ))}
               </div>
            </div>

            <button 
              onClick={logout}
              style={{ padding: '24px', borderRadius: '24px', background: 'rgba(251, 113, 133, 0.05)', color: '#fb7185', fontWeight: '950', fontSize: '15px', border: '1px solid rgba(251, 113, 133, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.3s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251, 113, 133, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(251, 113, 133, 0.05)'}
            >
              <LogOut size={22} /> ĐĂNG XUẤT NGAY
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Profile;