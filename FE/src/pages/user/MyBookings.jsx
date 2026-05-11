import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cancelBooking, formatCurrency, getMyBookings, getPaymentStatus, initiatePayment } from '../../api/endpoints';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const redirectToSePay = (checkoutUrl, formFields) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  Object.entries(formFields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookings();
      setBookings(data);

      const paymentResults = await Promise.all(
        data.map(async (booking) => {
          try {
            const payment = await getPaymentStatus(booking.id);
            return [booking.id, payment];
          } catch {
            return [booking.id, null];
          }
        })
      );
      setPaymentMap(Object.fromEntries(paymentResults.filter(([, payment]) => Boolean(payment))));
    } catch (requestError) {
      setError(requestError.message || 'Không tải được lịch đặt sân');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handlePay = async (bookingId) => {
    try {
      const result = await initiatePayment(bookingId);
      redirectToSePay(result.checkoutUrl, result.formFields);
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Lỗi thanh toán' });
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch đặt sân này?')) return;
    try {
      await cancelBooking(bookingId);
      setToast({ type: 'success', text: 'Đã hủy lịch đặt sân' });
      await loadBookings();
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Lỗi khi hủy lịch' });
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'CONFIRMED': return { label: 'Đã xác nhận', color: '#10b981', icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.1)' };
      case 'PENDING': return { label: 'Chờ thanh toán', color: '#F59E0B', icon: AlertCircle, bg: 'rgba(245, 158, 11, 0.1)' };
      case 'CANCELLED': return { label: 'Đã hủy', color: '#f43f5e', icon: XCircle, bg: 'rgba(244, 63, 94, 0.1)' };
      default: return { label: status, color: '#64748b', icon: AlertCircle, bg: 'rgba(100, 116, 139, 0.1)' };
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
    <div style={{ color: '#fff', paddingBottom: '100px' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, padding: '16px 32px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <section style={{ marginBottom: '48px', textAlign: 'center', marginTop: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '24px' }}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>LỊCH SỬ ĐẤU TRƯỜNG</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px' }}>Đơn đặt sân <span style={{ color: '#F59E0B' }}>của tôi</span></h1>
        <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '12px', opacity: 0.8 }}>Theo dõi trạng thái và quản lý các lượt đặt sân của bạn.</p>
      </section>

      {error && <div style={{ textAlign: 'center', color: '#f43f5e', padding: '20px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '16px', maxWidth: '600px', margin: '0 auto 40px' }}>{error}</div>}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '300px', animation: 'pulse 2s infinite' }}></div>)}
          </div>
        ) : bookings.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            <AnimatePresence>
              {bookings.map((booking, idx) => {
                const status = getStatusConfig(booking.status);
                const payment = paymentMap[booking.id];

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    style={{ ...glassStyle, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}
                  >
                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 14px', background: status.bg, borderRadius: '100px', border: `1px solid ${status.color}30`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <status.icon size={14} color={status.color} />
                      <span style={{ fontSize: '11px', fontWeight: '900', color: status.color, textTransform: 'uppercase' }}>{status.label}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MapPin size={32} color="#F59E0B" />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900' }}>{booking.slot?.field?.name || 'Sân bóng'}</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} /> {booking.slot?.field?.location || 'Vị trí chưa cập nhật'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Ngày</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                          <Calendar size={16} color="#10b981" /> {booking.date ? new Date(booking.date).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Khung giờ</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                          <Clock size={16} color="#10b981" /> 
                          {booking.startTime?.slice(0, 5) || '--:--'} - {booking.endTime?.slice(0, 5) || '--:--'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Tổng chi phí</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: '950', color: '#F59E0B' }}>{formatCurrency(booking.slot?.priceOverride || booking.slot?.field?.pricePerHour || 0)}</p>
                      </div>

                      {payment && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Giao dịch</p>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: payment.status === 'COMPLETED' ? '#10b981' : '#64748b' }}>{payment.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chưa hoàn tất'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handlePay(booking.id)}
                          style={{ flex: 1, padding: '16px', borderRadius: '14px', background: '#F59E0B', color: '#000', border: 'none', fontWeight: '950', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          THANH TOÁN NGAY <ArrowRight size={18} />
                        </button>
                      )}
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          style={{ padding: '16px', borderRadius: '14px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <Trash2 size={18} /> HỦY
                        </button>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => navigate(`/san/${booking.slot?.field_id}`)}
                          style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          ĐẶT LẠI SÂN NÀY <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Calendar size={48} color="#64748b" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px' }}>Bạn chưa có lịch đặt sân nào</h2>
            <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '40px' }}>Hãy khám phá các sân bóng và bắt đầu trận đấu đầu tiên của bạn!</p>
            <button
              onClick={() => navigate('/tim-san')}
              style={{ padding: '18px 40px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', fontSize: '16px' }}
            >
              KHÁM PHÁ SÂN NGAY
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;