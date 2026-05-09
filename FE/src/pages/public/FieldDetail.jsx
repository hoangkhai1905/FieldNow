import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
  Star,
  ShieldCheck,
  Zap,
  CreditCard,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { getFieldDetail, createBooking, formatCurrency } from '../../api/endpoints';

const FieldDetail = () => {
  const fieldTypes = [
    { value: 'FUTSAL', label: 'Sân bóng đá' },
    { value: 'BADMINTON', label: 'Cầu lông' },
    { value: 'BASKETBALL', label: 'Bóng rổ' },
    { value: 'VOLLEYBALL', label: 'Bóng chuyền' },
    { value: 'TENNIS', label: 'Tennis' },
  ];

  const getFieldTypeLabel = (type) => {
    return fieldTypes.find(t => t.value === type)?.label || type || 'Sân bóng';
  };
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('13:00');
  const [isBooking, setIsBooking] = useState(false);
  const [toast, setToast] = useState(null);

  const primaryImage = useMemo(() => field?.images?.[0] || field?.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80', [field]);

  useEffect(() => {
    let mounted = true;
    const loadField = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getFieldDetail(id, selectedDate);
        if (mounted) setField(result);
      } catch (requestError) {
        if (mounted) setError(requestError.message || 'Không tải được chi tiết sân');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadField();
    return () => { mounted = false; };
  }, [id, selectedDate]);

  const handleBooking = async () => {
    // Basic validation
    const startH = parseInt(startTime.split(':')[0], 10);
    const endH = parseInt(endTime.split(':')[0], 10);
    const endM = parseInt(endTime.split(':')[1], 10);

    if (startH < 6 || endH > 22 || (endH === 22 && endM > 0)) {
      setToast({ type: 'error', text: 'Giờ đặt sân phải từ 06:00 đến 22:00' });
      return;
    }

    if (startTime >= endTime) {
      setToast({ type: 'error', text: 'Giờ kết thúc phải sau giờ bắt đầu' });
      return;
    }

    if (!id) {
      setToast({ type: 'error', text: 'Không tìm thấy ID sân bóng' });
      return;
    }

    setIsBooking(true);
    try {
      const pad = (n) => n.toString().padStart(2, '0');
      const sH = startTime.includes(':') ? startTime.split(':')[0] : startTime;
      const eH = endTime.includes(':') ? endTime.split(':')[0] : endTime;

      const payload = {
        fieldId: id.trim(),
        date: selectedDate,
        startTime: `${pad(sH)}:00`,
        endTime: `${pad(eH)}:00`
      };

      const result = await createBooking(payload);
      setToast({ type: 'success', text: 'Đã tạo đơn đặt sân thành công!' });
      setTimeout(() => navigate('/nguoi-dung/dat-san-cua-toi/confirm', { state: { booking: result } }), 1500);
    } catch (requestError) {
      console.error('Booking Error:', requestError);
      const errorMsg = requestError.response?.data?.error?.details?.[0]?.message ||
        requestError.response?.data?.error?.message ||
        requestError.message ||
        'Không thể đặt sân';
      setToast({ type: 'error', text: errorMsg });
    } finally {
      setIsBooking(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#022c22' }}>
        <Loader size={48} className="animate-spin" color="#F59E0B" />
      </div>
    );
  }

  if (error || !field) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#022c22', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={64} color="#f43f5e" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '900' }}>{error || 'Không tìm thấy sân bóng'}</h2>
          <button onClick={() => navigate('/tim-san')} style={{ marginTop: '24px', background: '#F59E0B', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>QUAY LẠI TÌM KIẾM</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#fff', paddingBottom: '100px' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 4000, padding: '16px 32px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700' }}>
          <ChevronLeft size={20} /> QUAY LẠI
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '48px' }}>

        {/* Left: Content */}
        <div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...glassStyle, height: '500px', overflow: 'hidden', marginBottom: '32px' }}>
            <img src={primaryImage} alt={field.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  <Zap size={16} fill="#F59E0B" /> {getFieldTypeLabel(field.type)}
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: '950', margin: 0, letterSpacing: '-2px', textTransform: 'uppercase' }}>{field.name}</h1>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '18px', fontWeight: '900', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Star size={20} fill="#F59E0B" /> 4.9
                </div>
                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '700' }}>(120 Đánh giá)</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#a7f3d0', fontSize: '18px', marginBottom: '32px' }}>
              <MapPin size={24} color="#F59E0B" />
              <span>{field.location}</span>
            </div>

            <div style={{ ...glassStyle, padding: '32px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '16px', color: '#F59E0B' }}>MÔ TẢ SÂN</h3>
              <p style={{ color: '#d1fae5', lineHeight: 1.8, fontSize: '16px', opacity: 0.8 }}>{field.description || 'Thông tin đang được cập nhật...'}</p>
            </div>
          </motion.section>

          {/* Gallery */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              THƯ VIỆN HÌNH ẢNH <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {field.images?.map((img, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} style={{ borderRadius: '16px', overflow: 'hidden', height: '160px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={img} alt="Field" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right: Booking Panel */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <motion.section initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} style={{ ...glassStyle, padding: '32px', background: 'rgba(2, 44, 34, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Giá trung bình</p>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', color: '#F59E0B' }}>
                  {formatCurrency(field?.pricePerHour || 0)}<span style={{ fontSize: '16px', color: '#64748b' }}>/h</span>
                </h2>
              </div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={28} color="#F59E0B" />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', marginBottom: '12px' }}>
                <Calendar size={16} color="#F59E0B" /> CHỌN NGÀY RA SÂN
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '16px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Clock size={14} /> GIỜ BẮT ĐẦU
                </label>
                <input
                  type="time"
                  value={startTime}
                  min="06:00"
                  max="21:00"
                  step="3600"
                  onChange={(e) => setStartTime(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Clock size={14} /> GIỜ KẾT THÚC
                </label>
                <input
                  type="time"
                  value={endTime}
                  min="07:00"
                  max="22:00"
                  step="3600"
                  onChange={(e) => setEndTime(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.1)', marginBottom: '32px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} /> Giờ hoạt động: 06:00 - 22:00
              </p>
            </div>

            <button
              onClick={handleBooking}
              disabled={isBooking}
              style={{
                width: '100%',
                background: '#F59E0B',
                color: '#000',
                border: 'none',
                padding: '20px',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: '950',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 15px 30px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.3s'
              }}
            >
              {isBooking ? 'ĐANG XỬ LÝ...' : 'ĐẶT SÂN NGAY'} <ChevronRight size={24} />
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

const Loader = ({ size, color, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
  </svg>
);

export default FieldDetail;