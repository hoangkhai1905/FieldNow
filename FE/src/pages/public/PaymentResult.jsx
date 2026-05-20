import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  CreditCard,
  Zap,
  MessageCircle
} from 'lucide-react';
import { getBookingDetail, getPaymentStatus, formatCurrency, initiatePayment, buildZaloUrlFromPhoneNumber } from '../../api/endpoints';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const Confetti = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 70 }).map((_, i) => {
        const style = {
          position: 'absolute',
          width: `${Math.random() * 12 + 6}px`,
          height: `${Math.random() * 12 + 6}px`,
          backgroundColor: ['#f43f5e', '#F59E0B', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
          left: `${Math.random() * 100}%`,
          top: '-20px',
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
          animationDelay: `${Math.random() * 0.5}s`
        };
        return <div key={i} style={style} />;
      })}
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error, pending
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const bookingField = booking?.field || booking?.slot?.field || null;
  const ownerPhoneNumber = bookingField?.ownerPhoneNumber || bookingField?.owner?.phone_number || bookingField?.owner?.phoneNumber || '';
  const ownerZaloUrl = buildZaloUrlFromPhoneNumber(ownerPhoneNumber);

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    const pathStatus = location.pathname.includes('/success') ? 'success' : 
                       location.pathname.includes('/cancel') ? 'cancel' : 
                       location.pathname.includes('/error') ? 'error' : null;
    const queryStatus = pathStatus || params?.status || 'unknown';
    const bookingId = params?.bookingId || params?.order_invoice_number;

    let pollInterval = null;

    const fetchStatus = async () => {
      if (!bookingId) return;
      try {
        const b = await getBookingDetail(bookingId);
        setBooking(b);
        
        try {
          const p = await getPaymentStatus(bookingId);
          setPayment(p);
        } catch {}

        if (b.status === 'CONFIRMED') {
          setStatus('success');
          if (pollInterval) clearInterval(pollInterval);
        } else if (b.status === 'CANCELLED') {
          setStatus('error');
          if (pollInterval) clearInterval(pollInterval);
        } else {
          setPollCount(prev => prev + 1);
        }
      } catch (e) {
        console.error('Fetch status error:', e);
      }
    };

    if (bookingId) {
      fetchStatus();
      // Start polling if status is success from redirect but not yet confirmed in DB
      if (queryStatus === 'success' || queryStatus === 'unknown') {
        pollInterval = setInterval(() => {
          fetchStatus();
        }, 3000);
      } else if (queryStatus === 'cancel' || queryStatus === 'error') {
        setStatus('error');
      }
    } else {
      setStatus('error');
    }

    // Stop polling after 10 attempts (30 seconds)
    if (pollCount >= 10) {
      if (pollInterval) clearInterval(pollInterval);
      if (status === 'loading') setStatus('pending');
    }

    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [location.search, pollCount, status]);

  const glassStyle = {
    background: 'rgba(2, 44, 34, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px',
    padding: '48px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    textAlign: 'center'
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={80} color="#10b981" strokeWidth={1.5} />;
      case 'error':
        return <XCircle size={80} color="#f43f5e" strokeWidth={1.5} />;
      case 'pending':
      case 'loading':
        return <Clock size={80} color="#F59E0B" className="animate-spin-slow" strokeWidth={1.5} />;
      default:
        return <Clock size={80} color="#F59E0B" strokeWidth={1.5} />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success': return 'Thanh toán thành công';
      case 'error': return 'Thanh toán thất bại';
      case 'pending': return 'Đang xử lý thanh toán';
      default: return 'Đang xác nhận...';
    }
  };

  const getStatusDesc = () => {
    switch (status) {
      case 'success': return 'Tuyệt vời! Sân của bạn đã được đặt thành công. Hãy sẵn sàng cho trận đấu nhé!';
      case 'error': return 'Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch bị hủy.';
      case 'pending': return 'Hệ thống đang đợi xác nhận từ ngân hàng. Quá trình này có thể mất vài phút.';
      default: return 'Vui lòng không đóng trình duyệt lúc này.';
    }
  };

  const handleContactOwner = () => {
    if (!ownerZaloUrl) return;
    window.open(ownerZaloUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Glows */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', opacity: 0.1, filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', opacity: 0.1, filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={glassStyle}
      >
        {status === 'success' && <Confetti />}
        
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
          >
            {getStatusIcon()}
          </motion.div>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '950', color: '#fff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '-1px' }}>
          {getStatusTitle()}
        </h1>
        <p style={{ color: '#a7f3d0', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px', opacity: 0.8 }}>
          {getStatusDesc()}
        </p>

        {booking && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '16px' }}>
              <Zap size={14} fill="#F59E0B" /> THÔNG TIN ĐẶT SÂN
            </div>
            
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>{booking.slot?.field?.name || 'Chi tiết đặt sân'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a7f3d0', fontSize: '14px' }}>
                <Calendar size={18} color="#10b981" />
                <span>
                  {formatDate(booking.slot?.date)} • {booking.slot?.startTime?.includes('T') ? booking.slot.startTime.split('T')[1].slice(0, 5) : booking.slot?.startTime?.slice(0, 5)} - {booking.slot?.endTime?.includes('T') ? booking.slot.endTime.split('T')[1].slice(0, 5) : booking.slot?.endTime?.slice(0, 5)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a7f3d0', fontSize: '14px' }}>
                <MapPin size={18} color="#10b981" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.slot?.field?.location}</span>
              </div>
              {payment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a7f3d0', fontSize: '14px' }}>
                  <CreditCard size={18} color="#10b981" />
                  <span>{formatCurrency(payment.amount)} • {payment.provider?.toUpperCase()}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}
            style={{ width: '100%', background: '#F59E0B', color: '#000', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(245, 158, 11, 0.2)', transition: 'all 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            XEM LỊCH ĐẶT CỦA TÔI <ChevronRight size={20} />
          </button>

          {booking && (
            <button
              onClick={handleContactOwner}
              disabled={!ownerZaloUrl}
              style={{ width: '100%', background: ownerZaloUrl ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255,255,255,0.04)', color: ownerZaloUrl ? '#25D366' : '#64748b', border: `1px solid ${ownerZaloUrl ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255,255,255,0.05)'}`, padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '900', cursor: ownerZaloUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: ownerZaloUrl ? '0 15px 30px rgba(37, 211, 102, 0.08)' : 'none', transition: 'all 0.3s' }}
            >
              <MessageCircle size={18} /> TRAO ĐỔI VỚI CHỦ SÂN QUA ZALO
            </button>
          )}
          
          {(status === 'error' || status === 'cancel') && (
            <button
              onClick={() => {
                if (booking) {
                  initiatePayment(booking.id).then(res => {
                    if (res.formFields) {
                      const form = document.createElement('form');
                      form.method = 'POST';
                      form.action = res.checkoutUrl;
                      Object.entries(res.formFields).forEach(([key, value]) => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = value;
                        form.appendChild(input);
                      });
                      document.body.appendChild(form);
                      form.submit();
                    } else if (res.paymentUrl || res.checkoutUrl) {
                      window.location.href = res.paymentUrl || res.checkoutUrl;
                    }
                  }).catch(() => navigate(-1));
                } else {
                  navigate(-1);
                }
              }}
              style={{ width: '100%', background: '#f43f5e', color: '#fff', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '950', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(244, 63, 94, 0.2)', transition: 'all 0.3s' }}
            >
              THỬ LẠI <ArrowLeft size={20} />
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            style={{ width: '100%', background: 'transparent', color: '#a7f3d0', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '18px', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={18} /> QUAY LẠI TRANG CHỦ
          </button>
        </div>
        
        {status === 'pending' && (
          <p style={{ marginTop: '24px', color: '#64748b', fontSize: '13px' }}>
            Nếu bạn đã thanh toán thành công nhưng trạng thái chưa cập nhật, vui lòng đợi vài phút hoặc liên hệ hỗ trợ.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentResult;
