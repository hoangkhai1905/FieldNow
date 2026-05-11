import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock4,
  LayoutList,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { getOwnerBookings, formatCurrency } from '../../api/endpoints';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getOwnerBookings();
        if (mounted) setBookings(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.field?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#10b981';
      case 'PENDING': return '#F59E0B';
      case 'CANCELLED': return '#f43f5e';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle2 size={16} />;
      case 'PENDING': return <Clock4 size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      default: return <LayoutList size={16} />;
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  const inputStyle = {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '12px 16px 12px 44px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%'
  };

  return (
    <div style={{ color: '#fff', padding: '40px' }}>
      {/* Header */}
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '100px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '24px' }}>
            <Calendar size={14} color="#3b82f6" />
            <span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Booking Central</span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '950', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            QUẢN LÝ <span style={{ color: '#F59E0B' }}>ĐẶT LỊCH</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '16px', width: '400px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '12px', color: '#64748b' }} />
            <input 
              style={inputStyle} 
              placeholder="Tìm tên sân hoặc khách hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: '16px', top: '12px', color: '#64748b' }} />
            <select 
              style={{ ...inputStyle, paddingRight: '40px', cursor: 'pointer', appearance: 'none' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">TẤT CẢ</option>
              <option value="PENDING">CHỜ DUYỆT</option>
              <option value="CONFIRMED">ĐÃ XÁC NHẬN</option>
              <option value="CANCELLED">ĐÃ HỦY</option>
            </select>
          </div>
        </div>
      </header>

      {/* Booking List */}
      <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
        <div style={{ minWidth: '1100px' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr 0.3fr', gap: '20px', padding: '16px 24px', color: '#64748b', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div>Sân bóng</div>
            <div>Khách hàng</div>
            <div>Thời điểm đặt</div>
            <div>Lịch đá bóng</div>
            <div>Trạng thái</div>
            <div style={{ textAlign: 'right' }}>#</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              [1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '100px', animation: 'pulse 2s infinite' }} />)
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 10, background: 'rgba(255,255,255,0.08)' }}
                  style={{ ...glassStyle, padding: '20px 24px', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr 0.3fr', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}
                >
                  {/* Field Info */}
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '900', color: '#fff' }}>{booking.field?.name}</h3>
                    <div style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>#{booking.id.slice(0, 8)}</div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={18} color="#3b82f6" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={booking.user?.email}>
                        {booking.user?.email}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{booking.user?.fullName}</div>
                    </div>
                  </div>

                  {/* Booking Time (createdAt) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={18} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800' }}>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                  </div>

                  {/* Play Time (slot) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={18} color="#F59E0B" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900' }}>{booking.startTime?.slice(0, 5) || '--:--'} - {booking.endTime?.slice(0, 5) || '--:--'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {booking.date && !isNaN(new Date(booking.date)) ? new Date(booking.date).toLocaleDateString('vi-VN') : 'Chưa chọn ngày'}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '6px 12px', 
                      borderRadius: '100px', 
                      background: `${getStatusColor(booking.status)}15`, 
                      color: getStatusColor(booking.status),
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase'
                    }}>
                      {getStatusIcon(booking.status)}
                      {booking.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : booking.status === 'PENDING' ? 'CHỜ THANH TOÁN' : 'ĐÃ HỦY'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px' }}>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ ...glassStyle, padding: '80px', textAlign: 'center' }}>
                <LayoutList size={48} color="#64748b" style={{ opacity: 0.2, marginBottom: '20px' }} />
                <h3 style={{ color: '#64748b', fontWeight: '800' }}>KHÔNG TÌM THẤY LỊCH ĐẶT NÀO</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;
