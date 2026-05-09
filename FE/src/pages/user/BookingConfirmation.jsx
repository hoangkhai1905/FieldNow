import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ArrowRight,
  Home,
  List,
  Zap,
  Info
} from 'lucide-react';
import { formatCurrency, initiatePayment } from '../../api/endpoints';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking || null;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED': return { label: 'Đã xác nhận', color: '#10b981' };
      case 'PENDING': return { label: 'Chờ thanh toán', color: '#F59E0B' };
      case 'CANCELLED': return { label: 'Đã hủy', color: '#f43f5e' };
      default: return { label: status, color: '#64748b' };
    }
  };

  const handlePayNow = async () => {
    if (!booking) return;
    try {
      const { paymentUrl } = await initiatePayment(booking.id);
      window.location.href = paymentUrl;
    } catch (error) {
      alert(error.message || 'Không thể khởi tạo thanh toán');
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px'
  };

  return (
    <div style={{ color: '#fff', minHeight: '100vh', padding: '40px 24px', background: '#022c22', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #10b981' }}>
            <CheckCircle2 size={56} color="#10b981" />
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>ĐẶT SÂN THÀNH CÔNG!</h1>
          <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '12px', opacity: 0.8 }}>Yêu cầu của bạn đã được hệ thống ghi nhận.</p>
        </motion.div>

        {booking ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ ...glassStyle, padding: '40px', marginBottom: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '32px', marginBottom: '32px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#F59E0B' }}>MÃ ĐƠN: #{booking.id?.slice(0, 8)}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '100px', background: `${getStatusLabel(booking.status).color}15`, color: getStatusLabel(booking.status).color, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                    {getStatusLabel(booking.status).label}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Tổng thanh toán</p>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', color: '#fff' }}>
                  {formatCurrency(booking.slot?.priceOverride ?? booking.slot?.field?.pricePerHour ?? 0)}
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Tên sân</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{booking.slot?.field?.name || 'Sân bóng'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Ngày thi đấu</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{formatDate(booking.slot?.date)}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Khung giờ</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                      {booking.slot?.startTime?.includes('T') ? booking.slot.startTime.split('T')[1].slice(0, 5) : booking.slot?.startTime?.slice(0, 5)} - {booking.slot?.endTime?.includes('T') ? booking.slot.endTime.split('T')[1].slice(0, 5) : booking.slot?.endTime?.slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Địa chỉ</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', opacity: 0.8 }}>{booking.slot?.field?.address || 'Tại câu lạc bộ'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayNow}
                style={{ flex: 1, padding: '20px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)' }}
              >
                <CreditCard size={20} /> THANH TOÁN NGAY <ArrowRight size={20} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}
                style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                <List size={20} /> LỊCH ĐẶT
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ ...glassStyle, padding: '48px', textAlign: 'center' }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Info size={32} color="#f43f5e" />
            </div>
            <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '32px' }}>Không tìm thấy thông tin đặt sân. Có thể phiên làm việc đã hết hạn.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/tim-san')}
              style={{ padding: '16px 32px', borderRadius: '14px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer' }}
            >
              TÌM SÂN LẠI
            </motion.button>
          </motion.div>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Home size={16} /> Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
