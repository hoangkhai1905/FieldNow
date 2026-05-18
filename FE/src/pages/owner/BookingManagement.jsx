import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock4,
  LayoutList,
  Ban,
  Eye,
  MoreVertical,
  X
} from 'lucide-react';
import { getOwnerBookings, rejectOwnerBooking } from '../../api/endpoints';
import Toast from '../../components/ui/Toast';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState('');
  const [openMenuId, setOpenMenuId] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      };
      const data = await getOwnerBookings(params);
      setBookings(Array.isArray(data) ? data : data.bookings ?? []);
      setPagination(data.pagination ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [page, statusFilter, dateFilter]);

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Từ chối booking này? Booking sẽ chuyển sang trạng thái đã hủy.')) return;
    setOpenMenuId('');
    setProcessingId(bookingId);
    setToast(null);
    try {
      await rejectOwnerBooking(bookingId);
      setToast({ type: 'success', text: 'Đã từ chối booking' });
      await loadBookings();
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Không thể từ chối booking' });
    } finally {
      setProcessingId('');
    }
  };

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

  const getPaymentProviderLabel = (provider) => {
    if (!provider) return 'Chưa chọn';
    if (provider.toLowerCase() === 'cash') return 'Tiền mặt tại sân';
    if (provider.toLowerCase() === 'sepay') return 'Chuyển khoản SePay';
    return provider.toUpperCase();
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'COMPLETED': return 'Đã thanh toán';
      case 'FAILED': return 'Thanh toán thất bại';
      case 'EXPIRED': return 'Đã hết hạn';
      default: return 'Chưa có thanh toán';
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

        <div style={{ display: 'flex', gap: '16px', width: '620px' }}>
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">TẤT CẢ</option>
              <option value="PENDING">CHỜ DUYỆT</option>
              <option value="CONFIRMED">ĐÃ XÁC NHẬN</option>
              <option value="CANCELLED">ĐÃ HỦY</option>
            </select>
          </div>
          <input
            type="date"
            style={{ ...inputStyle, paddingLeft: '16px', width: '170px' }}
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </header>

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

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
                  style={{ ...glassStyle, position: 'relative', zIndex: openMenuId === booking.id ? 50 : 1, padding: '20px 24px', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr 0.3fr', alignItems: 'center', gap: '20px', transition: 'all 0.3s' }}
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
                  <div style={{ textAlign: 'right', position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === booking.id ? '' : booking.id)}
                      title="Thao tác booking"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer', padding: '10px', borderRadius: '12px' }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === booking.id && (
                      <div style={{ position: 'absolute', right: 0, top: '46px', zIndex: 20, width: '190px', padding: '8px', borderRadius: '14px', background: '#052e24', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'grid', gap: '6px', textAlign: 'left' }}>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setOpenMenuId('');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: '800', textAlign: 'left' }}
                        >
                          <Eye size={16} />
                          Xem chi tiết
                        </button>
                        {booking.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            disabled={processingId === booking.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', cursor: processingId === booking.id ? 'not-allowed' : 'pointer', fontWeight: '900', textAlign: 'left', opacity: processingId === booking.id ? 0.65 : 1 }}
                          >
                            <Ban size={16} />
                            Từ chối booking
                          </button>
                        )}
                      </div>
                    )}
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
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: page <= 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: '800' }}
              >
                TRƯỚC
              </button>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '800' }}>
                {pagination.currentPage || page}/{pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: page >= pagination.totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)', color: '#fff', cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', fontWeight: '800' }}
              >
                SAU
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <div
          onClick={() => setSelectedBooking(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <section
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(620px, 100%)', borderRadius: '22px', background: '#052e24', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 70px rgba(0,0,0,0.45)', color: '#fff', padding: '26px' }}
          >
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: '#F59E0B', fontSize: '12px', fontWeight: '950', textTransform: 'uppercase' }}>Chi tiết booking</p>
                <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '950' }}>{selectedBooking.field?.name || 'Sân'}</h2>
                <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>#{selectedBooking.id}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                ['Khách hàng', selectedBooking.user?.fullName || selectedBooking.user?.email || 'N/A'],
                ['Email', selectedBooking.user?.email || 'N/A'],
                ['Số điện thoại', selectedBooking.user?.phoneNumber || 'N/A'],
                ['Ngày chơi', selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('vi-VN') : 'N/A'],
                ['Khung giờ', `${selectedBooking.startTime?.slice(0, 5) || '--:--'} - ${selectedBooking.endTime?.slice(0, 5) || '--:--'}`],
                ['Trạng thái', selectedBooking.status],
                ['Phương thức thanh toán', getPaymentProviderLabel(selectedBooking.payment?.provider)],
                ['Trạng thái thanh toán', getPaymentStatusLabel(selectedBooking.payment?.status)],
                ['Tổng tiền', `${new Intl.NumberFormat('vi-VN').format(selectedBooking.totalPrice || 0)}đ`],
                ['Thời điểm đặt', selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('vi-VN') : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '7px' }}>{label}</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: '850', overflowWrap: 'anywhere' }}>{value}</div>
                </div>
              ))}
            </div>

            {selectedBooking.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  const bookingId = selectedBooking.id;
                  setSelectedBooking(null);
                  void handleRejectBooking(bookingId);
                }}
                disabled={processingId === selectedBooking.id}
                style={{ marginTop: '20px', width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.12)', color: '#f43f5e', fontWeight: '950', cursor: processingId === selectedBooking.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Ban size={17} />
                TỪ CHỐI BOOKING
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
