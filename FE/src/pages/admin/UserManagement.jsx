import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Search, 
  Filter, 
  MoreVertical,
  Check,
  X,
  Loader2,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { getAdminUsers, updateUserRole } from '../../api/endpoints';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(null);
  const [userSummary, setUserSummary] = useState({ total: 0, USER: 0, OWNER: 0, ADMIN: 0 });
  const filteredUsers = users;

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getAdminUsers({ page, limit: 10, search: searchTerm });
      setUsers(data.users);
      setPagination(data.pagination);
      setUserSummary(data.summary || { total: data.users.length, USER: 0, OWNER: 0, ADMIN: 0 });
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Lỗi tải dữ liệu' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const stats = useMemo(() => {
    return {
      USER: userSummary.USER || 0,
      OWNER: userSummary.OWNER || 0,
      ADMIN: userSummary.ADMIN || 0,
      total: userSummary.total || 0,
    };
  }, [userSummary]);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setToast({ type: 'success', text: `Đã cập nhật vai trò người dùng thành ${role}` });
      await loadUsers(pagination?.page || 1);
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Không thể cập nhật' });
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  return (
    <div style={{ color: '#fff', padding: '40px' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            HỆ THỐNG QUẢN TRỊ NGƯỜI DÙNG
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '16px' }}>Quản lý phân quyền và giám sát hoạt động tài khoản.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          {[
            { label: 'Tổng người dùng', value: stats.total, icon: Users, color: '#3b82f6' },
            { label: 'Cầu thủ (USER)', value: stats.USER, icon: Activity, color: '#F59E0B' },
            { label: 'Chủ sân (OWNER)', value: stats.OWNER, icon: Award, color: '#10b981' },
            { label: 'Quản trị (ADMIN)', value: stats.ADMIN, icon: ShieldCheck, color: '#f43f5e' }
          ].map((stat, idx) => (
            <motion.div key={idx} whileHover={{ y: -5 }} style={{ ...glassStyle, padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={28} color={stat.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & Actions */}
        <div style={{ ...glassStyle, padding: '24px', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 14px 14px 52px', color: '#fff', fontSize: '15px', outline: 'none' }}
            />
          </div>
          <button style={{ padding: '14px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700' }}>
            <Filter size={18} /> Lọc
          </button>
        </div>

        {/* User Table (Modern Card List) */}
        <div style={{ ...glassStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.2fr 1.2fr 0.5fr', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.02)' }}>
            <span>Người dùng</span>
            <span>Thông tin liên hệ</span>
            <span>Vai trò</span>
            <span>Ngày gia nhập</span>
            <span style={{ textAlign: 'right' }}>#</span>
          </div>

          <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '100px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} color="#F59E0B" /></div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user, idx) => (
                <motion.div 
                  key={user.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.2fr 1.2fr 0.5fr', alignItems: 'center', transition: 'all 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '18px', color: '#fff', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                      {(user.full_name || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '900', fontSize: '15px', color: '#fff' }}>{user.full_name || user.fullName || user.email}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{user.id}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a7f3d0', fontSize: '13px', fontWeight: '600' }}>
                      <Mail size={14} color="#10b981" /> {user.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                      <Phone size={14} /> {user.phone_number || user.phoneNumber || '---'}
                    </div>
                  </div>

                  <div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{ 
                          appearance: 'none',
                          background: user.role === 'ADMIN' ? 'rgba(244, 63, 94, 0.1)' : user.role === 'OWNER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                          border: `1px solid ${user.role === 'ADMIN' ? '#f43f5e30' : user.role === 'OWNER' ? '#10b98130' : '#F59E0B30'}`, 
                          borderRadius: '10px', 
                          padding: '8px 32px 8px 16px', 
                          color: user.role === 'ADMIN' ? '#f43f5e' : user.role === 'OWNER' ? '#10b981' : '#F59E0B', 
                          fontSize: '11px', 
                          fontWeight: '900', 
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="USER">USER</option>
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <ChevronRight size={12} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', opacity: 0.5 }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    {new Date(user.created_at || user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '10px', borderRadius: '12px' }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ padding: '80px', textAlign: 'center' }}>
                <Users size={48} color="#64748b" style={{ opacity: 0.2, marginBottom: '20px' }} />
                <p style={{ color: '#64748b', fontWeight: '800' }}>KHÔNG TÌM THẤY NGƯỜI DÙNG NÀO</p>
              </div>
            )}
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '24px' }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadUsers(page)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: page === (pagination.currentPage || pagination.page) ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                  color: page === (pagination.currentPage || pagination.page) ? '#000' : '#fff',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserManagement;
