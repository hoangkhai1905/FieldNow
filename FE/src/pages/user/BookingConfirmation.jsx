import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Info,
  Banknote,
  XCircle,
  MessageCircle
} from 'lucide-react';
import { cancelBooking, formatCurrency, getBookingDetail, getPaymentStatus, initiatePayment, buildZaloUrlFromPhoneNumber } from '../../api/endpoints';
import Modal from '../../components/common/Modal';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [booking, setBooking] = React.useState(state?.booking || null);
  const [payment, setPayment] = React.useState(null);
  const bookingField = booking?.field || booking?.slot?.field || null;
  const ownerPhoneNumber = bookingField?.ownerPhoneNumber || bookingField?.owner?.phone_number || bookingField?.owner?.phoneNumber || '';
  const ownerZaloUrl = buildZaloUrlFromPhoneNumber(ownerPhoneNumber);
  const [paymentMethod, setPaymentMethod] = React.useState('sepay'); // 'sepay' or 'cash'
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const isExpired = booking?.status === 'CANCELLED' || payment?.status === 'EXPIRED';

  React.useEffect(() => {
    if (!booking?.id || booking.status !== 'PENDING') return undefined;

    let isMounted = true;
    let fallbackTimeoutId;

    const refreshBookingState = async () => {
      try {
        const [freshBooking, freshPayment] = await Promise.all([
          getBookingDetail(booking.id),
          getPaymentStatus(booking.id).catch(() => null),
        ]);

        if (!isMounted) return;
        setBooking(freshBooking);
        if (freshPayment) setPayment(freshPayment);
      } catch {
        // Keep the existing confirmation data if a transient refresh fails.
      }
    };

    const expiresAt = booking.expiresAt || booking.expires_at;
    const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
    const delayMs = expiresAtMs ? Math.max(0, expiresAtMs - Date.now() + 1000) : 0;

    if (delayMs === 0) {
      void refreshBookingState();
    } else {
      fallbackTimeoutId = window.setTimeout(refreshBookingState, delayMs);
    }

    return () => {
      isMounted = false;
      if (fallbackTimeoutId) window.clearTimeout(fallbackTimeoutId);
    };
  }, [booking?.expiresAt, booking?.expires_at, booking?.id, booking?.status]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED': return { label: 'Đã xác nhận', color: '#10b981' };
      case 'PENDING': return { label: 'Chờ thanh toán', color: '#F59E0B' };
      case 'CANCELLED': return { label: 'Hết hạn thanh toán', color: '#f43f5e' };
      default: return { label: status, color: '#64748b' };
    }
  };

  const handlePayNow = async () => {
    if (!booking || isExpired) return;
    setIsProcessing(true);
    try {
      const response = await initiatePayment(booking.id, paymentMethod);
      
      if (paymentMethod === 'cash') {
        setSuccessMessage(response.message || 'Yêu cầu đặt sân đã được gửi thành công!');
        setShowSuccessModal(true);
        return;
      }

      if (response.formFields) {
        // SePay integration
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.checkoutUrl;
        
        Object.entries(response.formFields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else if (response.paymentUrl || response.checkoutUrl) {
        // VNPay integration
        window.location.href = response.paymentUrl || response.checkoutUrl;
      }
    } catch (error) {
      alert(error.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || isCancelling || isExpired) return;
    setShowCancelConfirm(true);
  };

  const confirmCancelBooking = async () => {
    if (!booking || isCancelling || isExpired) return;
    setShowCancelConfirm(false);
    setIsCancelling(true);
    try {
      await cancelBooking(booking.id);
      navigate('/nguoi-dung/dat-san-cua-toi', {
        state: { message: 'Đã hủy đặt sân thành công.' },
      });
    } catch (error) {
      alert(error.message || 'Không thể hủy đặt sân');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleContactOwner = () => {
    if (!ownerZaloUrl) {
      window.alert('Chủ sân chưa để lại số Zalo hợp lệ');
      return;
    }

    window.open(ownerZaloUrl, '_blank', 'noopener,noreferrer');
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
      <Modal
        isOpen={showCancelConfirm}
        title="Hủy đặt sân?"
        description="Đơn đặt sân sẽ bị hủy và bạn cần tạo đơn mới nếu muốn đặt lại khung giờ này."
        icon={XCircle}
        variant="error"
        confirmText="Hủy đặt sân"
        cancelText="Giữ lại"
        onConfirm={confirmCancelBooking}
        onClose={() => setShowCancelConfirm(false)}
      />
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: isExpired ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `2px solid ${isExpired ? '#f43f5e' : '#10b981'}` }}>
            {isExpired ? <XCircle size={56} color="#f43f5e" /> : <CheckCircle2 size={56} color="#10b981" />}
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>{isExpired ? 'THANH TOÁN HẾT HẠN' : 'ĐẶT SÂN THÀNH CÔNG!'}</h1>
          <p style={{ color: isExpired ? '#fecdd3' : '#a7f3d0', fontSize: '18px', marginTop: '12px', opacity: 0.8 }}>
            {isExpired ? 'Đơn đặt sân đã quá thời gian thanh toán và được hệ thống hủy.' : 'Yêu cầu của bạn đã được hệ thống ghi nhận.'}
          </p>
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
                  {formatCurrency(booking.totalPrice || 0)}
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
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{formatDate(booking.date || booking.slot?.date)}</p>
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
                      {(booking.startTime || booking.slot?.startTime)?.includes('T') ? (booking.startTime || booking.slot.startTime).split('T')[1].slice(0, 5) : (booking.startTime || booking.slot?.startTime)?.slice(0, 5)} - {(booking.endTime || booking.slot?.endTime)?.includes('T') ? (booking.endTime || booking.slot.endTime).split('T')[1].slice(0, 5) : (booking.endTime || booking.slot?.endTime)?.slice(0, 5)}
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

            {isExpired && (
              <div style={{ marginTop: '32px', padding: '18px 20px', borderRadius: '18px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.28)', color: '#fecdd3', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800' }}>
                <XCircle size={22} color="#f43f5e" />
                Đơn này đã hết hạn thanh toán. Vui lòng tạo lịch đặt sân mới nếu bạn vẫn muốn giữ khung giờ này.
              </div>
            )}

            {/* Payment Method Selection */}
            {!isExpired && <div style={{ marginTop: '40px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Chọn phương thức thanh toán</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setPaymentMethod('sepay')}
                  style={{ 
                    padding: '24px', 
                    borderRadius: '24px', 
                    border: `2px solid ${paymentMethod === 'sepay' ? '#F59E0B' : 'rgba(255,255,255,0.05)'}`, 
                    background: paymentMethod === 'sepay' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0,0,0,0.2)', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s',
                    boxShadow: paymentMethod === 'sepay' ? '0 10px 30px rgba(245, 158, 11, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: paymentMethod === 'sepay' ? '#F59E0B' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={24} color={paymentMethod === 'sepay' ? '#000' : '#64748b'} />
                    </div>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: paymentMethod === 'sepay' ? '#fff' : '#64748b' }}>Chuyển khoản SePay</span>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setPaymentMethod('cash')}
                  style={{ 
                    padding: '24px', 
                    borderRadius: '24px', 
                    border: `2px solid ${paymentMethod === 'cash' ? '#10b981' : 'rgba(255,255,255,0.05)'}`, 
                    background: paymentMethod === 'cash' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.2)', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s',
                    boxShadow: paymentMethod === 'cash' ? '0 10px 30px rgba(16, 185, 129, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: paymentMethod === 'cash' ? '#10b981' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Banknote size={24} color={paymentMethod === 'cash' ? '#000' : '#64748b'} />
                    </div>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: paymentMethod === 'cash' ? '#fff' : '#64748b' }}>Tiền mặt tại sân</span>
                  </div>
                </motion.div>
              </div>
            </div>}

            <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
              {!isExpired && <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayNow}
                disabled={isProcessing}
                style={{ 
                  flex: 1, 
                  padding: '20px', 
                  borderRadius: '20px', 
                  background: paymentMethod === 'cash' ? '#10b981' : '#F59E0B', 
                  color: '#000', 
                  fontWeight: '950', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px', 
                  boxShadow: paymentMethod === 'cash' ? '0 15px 30px rgba(16, 185, 129, 0.2)' : '0 15px 30px rgba(245, 158, 11, 0.2)', 
                  opacity: isProcessing ? 0.7 : 1,
                  transition: 'all 0.3s'
                }}
              >
                {paymentMethod === 'cash' ? <Banknote size={20} /> : <CreditCard size={20} />}
                {isProcessing ? 'ĐANG XỬ LÝ...' : (paymentMethod === 'cash' ? 'XÁC NHẬN ĐẶT SÂN' : 'THANH TOÁN NGAY')} 
                <ArrowRight size={20} />
              </motion.button>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}
                style={{ padding: '20px', borderRadius: '18px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                <List size={20} /> LỊCH ĐẶT
              </motion.button>
            </div>

            {booking.status === 'PENDING' && !isExpired && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelBooking}
                disabled={isCancelling || isProcessing}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  color: '#f43f5e',
                  fontWeight: '900',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  cursor: isCancelling || isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: isCancelling || isProcessing ? 0.65 : 1,
                }}
              >
                <XCircle size={20} />
                {isCancelling ? 'ĐANG HỦY...' : 'HỦY ĐẶT SÂN'}
              </motion.button>
            )}
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

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
              onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '480px', 
                background: '#111', 
                borderRadius: '40px', 
                padding: '48px', 
                textAlign: 'center', 
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <CheckCircle2 size={48} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: '950', marginBottom: '16px', color: '#fff' }}>TUYỆT VỜI!</h2>
              <p style={{ color: '#64748b', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px' }}>
                {successMessage}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}
                  style={{ padding: '20px', borderRadius: '100px', background: '#10b981', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                  XEM LỊCH ĐẶT SÂN
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                  style={{ padding: '20px', borderRadius: '100px', background: 'transparent', color: '#64748b', fontWeight: '800', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '16px' }}
                >
                  QUAY LẠI TRANG CHỦ
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContactOwner}
                  disabled={!ownerZaloUrl}
                  style={{
                    padding: '20px',
                    borderRadius: '100px',
                    background: ownerZaloUrl ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255,255,255,0.04)',
                    color: ownerZaloUrl ? '#25D366' : '#64748b',
                    fontWeight: '900',
                    border: `1px solid ${ownerZaloUrl ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: ownerZaloUrl ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <MessageCircle size={18} /> TRAO ĐỔI VỚI CHỦ SÂN QUA ZALO
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingConfirmation;
