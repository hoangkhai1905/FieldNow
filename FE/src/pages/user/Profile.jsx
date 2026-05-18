import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Shield,
  Settings,
  Heart,
  UserCheck,
  ChevronRight,
  LogOut,
  Trophy,
  Activity,
  Zap,
  Edit3,
  Check,
  X,
  Loader2,
  Lock,
  Key,
  Save
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import {
  getCurrentUser,
  updateProfile,
  requestChangePassword,
  changePassword
} from '../../api/endpoints';
import Toast from '../../components/ui/Toast';

const ChangePasswordModal = ({ isOpen, onClose, setToast }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleRequestOTP = async () => {
    setLoading(true);
    try {
      await requestChangePassword();
      setStep(2);
      setToast({ type: 'success', text: 'Mã OTP đã được gửi tới email của bạn!' });
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Lỗi gửi yêu cầu' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setToast({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setLoading(true);
    try {
      await changePassword({ otp: formData.otp, newPassword: formData.newPassword });
      setToast({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      onClose();
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Lỗi đổi mật khẩu' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(2, 44, 34, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{ background: '#022c22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px', maxWidth: '450px', width: '100%', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={32} color="#F59E0B" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: 0 }}>ĐỔI MẬT KHẨU</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
            {step === 1 ? 'Chúng tôi sẽ gửi mã xác thực tới email của bạn để tiếp tục.' : 'Nhập mã OTP và mật khẩu mới bên dưới.'}
          </p>
        </div>

        {step === 1 ? (
          <button
            onClick={handleRequestOTP}
            disabled={loading}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F59E0B', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Key size={20} />} NHẬN MÃ OTP
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              placeholder="Mã OTP"
              value={formData.otp}
              onChange={e => setFormData({ ...formData, otp: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }}
            />
            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#10b981', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Check size={20} />} CẬP NHẬT MẬT KHẨU
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const EditProfileModal = ({ isOpen, onClose, initialData, setToast, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateProfile({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber
      });
      const updatedUser = updated.user || updated;
      onUpdate(updatedUser);
      setToast({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
      onClose();
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Lỗi khi cập nhật' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(2, 44, 34, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{ background: '#022c22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px', maxWidth: '450px', width: '100%', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <User size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: 0 }}>CHỈNH SỬA HỒ SƠ</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Cập nhật thông tin cá nhân của bạn.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Họ và tên</label>
            <input
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Số điện thoại</label>
            <input
              value={formData.phoneNumber}
              onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F59E0B', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} LƯU THÔNG TIN
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: ''
  });
  const [toast, setToast] = useState(null);

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
        if (mounted) {
          setProfile(result);
          setFormData({
            fullName: result.fullName || result.full_name || '',
            phoneNumber: result.phoneNumber || result.phone_number || ''
          });
        }
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
  ];

  return (
    <div style={{ color: '#fff', flex: 1, paddingBottom: '100px' }}>
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} setToast={setToast} />
        )}
        {showEditModal && (
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            initialData={formData}
            setToast={setToast}
            onUpdate={(updated) => {
              const updatedUser = updated.user || updated;
              setProfile(updatedUser);
              updateUser(updatedUser);
              setFormData({
                fullName: updatedUser.fullName || updatedUser.full_name || '',
                phoneNumber: updatedUser.phoneNumber || updatedUser.phone_number || ''
              });
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...glassStyle, padding: '48px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '40px', position: 'relative', overflow: 'hidden' }}
        >
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
            <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
              {profile?.fullName || profile?.full_name || profile?.email || 'Người dùng'}
            </h1>
            <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '12px', opacity: 0.8 }}>Thành viên từ tháng {new Date(profile?.createdAt || profile?.created_at || Date.now()).getMonth() + 1}, {new Date(profile?.createdAt || profile?.created_at || Date.now()).getFullYear()}</p>
          </div>

          <div style={{ position: 'relative', zIndex: 10 }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowEditModal(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '16px 24px', color: '#fff', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
            >
              <Edit3 size={18} color="#F59E0B" /> CHỈNH SỬA
            </motion.button>
          </div>
        </motion.section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {stats.map((stat, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} style={{ ...glassStyle, padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '950', color: '#fff' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ ...glassStyle, padding: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={24} color="#F59E0B" /> THÔNG TIN CHI TIẾT
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={22} color="#64748b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Địa chỉ Email</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{profile?.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={22} color="#64748b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Số điện thoại</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{profile?.phoneNumber || profile?.phone_number || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} color="#64748b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Trạng thái xác thực</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {profile?.isEmailVerified ? <><Check size={16} /> ĐÃ XÁC THỰC EMAIL</> : 'CHƯA XÁC THỰC'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ ...glassStyle, padding: '40px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={24} color="#F59E0B" /> BẢO MẬT & TÀI KHOẢN
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <motion.button
                  whileHover={{ x: 10, background: 'rgba(255,255,255,0.08)' }}
                  onClick={() => setShowPasswordModal(true)}
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={20} color="#F59E0B" />
                    </div>
                    ĐỔI MẬT KHẨU
                  </div>
                  <ChevronRight size={20} color="#64748b" />
                </motion.button>

                <motion.button
                  whileHover={{ x: 10, background: 'rgba(244, 63, 94, 0.08)' }}
                  onClick={logout}
                  style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'rgba(244, 63, 94, 0.03)', border: '1px solid rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LogOut size={20} color="#f43f5e" />
                    </div>
                    ĐĂNG XUẤT
                  </div>
                  <ChevronRight size={20} color="#64748b" />
                </motion.button>
              </div>
            </div>

            <div style={{ ...glassStyle, padding: '32px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={32} color="#F59E0B" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>HẠNG THÀNH VIÊN: VÀNG</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bạn còn 150 điểm để lên hạng Kim Cương.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
