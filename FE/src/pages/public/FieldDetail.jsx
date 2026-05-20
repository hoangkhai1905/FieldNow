import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
  Star,
  Zap,
  CreditCard,
  Info,
  AlertCircle,
  ChevronLeft,
  MessageCircle
} from 'lucide-react';
import { getFieldDetail, createBooking, formatCurrency, buildZaloUrlFromPhoneNumber } from '../../api/endpoints';
import Toast from '../../components/ui/Toast';

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
  const [isResolvingOwnerContact, setIsResolvingOwnerContact] = useState(false);
  const [toast, setToast] = useState(null);
  const ownerPhoneNumber = field?.ownerPhoneNumber || field?.owner?.phone_number || field?.owner?.phoneNumber || '';
  const ownerZaloUrl = buildZaloUrlFromPhoneNumber(ownerPhoneNumber);

  // New: Price calculation
  const estimatedPrice = useMemo(() => {
    if (!field || !startTime || !endTime) return 0;
    const selectedOwnerSlot = field.slots?.find((slot) => (
      slot.startTime === startTime
      && slot.endTime === endTime
      && slot.priceOverride != null
    ));
    if (selectedOwnerSlot) {
      return Number(selectedOwnerSlot.priceOverride);
    }

    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const durationHours = (eH + eM / 60) - (sH + sM / 60);
    if (durationHours <= 0) return 0;
    return Math.round(durationHours * (field.pricePerHour || 0));
  }, [field, startTime, endTime]);

  const openTimeStr = useMemo(() => {
    if (!field?.openTime && !field?.open_time) return '06:00';
    const t = field.openTime || field.open_time;
    // If it's an ISO string from Backend (e.g. 1970-01-01T06:00:00.000Z)
    return t.includes('T') ? t.split('T')[1].slice(0, 5) : t.slice(0, 5);
  }, [field]);

  const closeTimeStr = useMemo(() => {
    if (!field?.closeTime && !field?.close_time) return '22:00';
    const t = field.closeTime || field.close_time;
    return t.includes('T') ? t.split('T')[1].slice(0, 5) : t.slice(0, 5);
  }, [field]);

  const isTimeOverlap = useMemo(() => {
    return (start, end, bookedList) => {
      if (!bookedList || bookedList.length === 0) return false;

      const toMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const actualStr = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
        const [h, m] = actualStr.split(':').map(Number);
        return h * 60 + m;
      };

      const startM = toMinutes(start);
      const endM = toMinutes(end);

      return bookedList.some((b) => {
        const bStart = toMinutes(b.start_time || b.startTime);
        const bEnd = toMinutes(b.end_time || b.endTime);
        return startM < bEnd && endM > bStart;
      });
    };
  }, []);

  const suggestedSlots = useMemo(() => {
    if (!openTimeStr || !closeTimeStr) return [];

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const fromMinutes = (totalMin) => {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const openMin = toMinutes(openTimeStr);
    const closeMin = toMinutes(closeTimeStr);
    const duration = 60; // 60 minutes duration

    const list = [];
    let current = openMin;
    while (current + duration <= closeMin) {
      const start = fromMinutes(current);
      const end = fromMinutes(current + duration);
      list.push({
        id: `suggested-${start}-${end}`,
        startTime: start,
        endTime: end,
        isSuggested: true,
      });
      current += duration;
    }
    return list;
  }, [openTimeStr, closeTimeStr]);

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
    if (startTime < openTimeStr || endTime > closeTimeStr) {
      setToast({ type: 'error', text: `Giờ đặt sân phải từ ${openTimeStr} đến ${closeTimeStr}` });
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
      const payload = {
        fieldId: id.trim(),
        date: selectedDate,
        startTime: startTime,
        endTime: endTime
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

      if (requestError.response?.status === 409) {
        setToast({ type: 'error', text: 'Khung giờ này vừa có người đặt mất rồi, bạn chọn giờ khác nhé!' });
      } else {
        setToast({ type: 'error', text: errorMsg });
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleContactOwner = () => {
    if (ownerZaloUrl) {
      window.open(ownerZaloUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!id || isResolvingOwnerContact) return;

    setIsResolvingOwnerContact(true);
    setToast({ type: 'success', text: 'Đang tải lại thông tin chủ sân...' });

    getFieldDetail(id, selectedDate)
      .then((latestField) => {
        setField(latestField);
        const latestPhoneNumber = latestField?.ownerPhoneNumber || latestField?.owner?.phone_number || latestField?.owner?.phoneNumber || '';
        const latestZaloUrl = buildZaloUrlFromPhoneNumber(latestPhoneNumber);

        if (latestZaloUrl) {
          window.open(latestZaloUrl, '_blank', 'noopener,noreferrer');
          return;
        }

        setToast({ type: 'error', text: 'Chủ sân chưa để lại số Zalo hợp lệ' });
      })
      .catch(() => {
        setToast({ type: 'error', text: 'Không tải được thông tin chủ sân' });
      })
      .finally(() => {
        setIsResolvingOwnerContact(false);
      });
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
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

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

            {/* Booked Intervals */}
            {field?.bookedIntervals && field.bookedIntervals.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#f43f5e', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <AlertCircle size={14} /> CÁC KHUNG GIỜ ĐÃ ĐẶT (HẾT CHỖ)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {field.bookedIntervals.map((b, idx) => {
                    const formatTime = (t) => t ? (t.includes('T') ? t.split('T')[1].slice(0, 5) : t.slice(0, 5)) : '';
                    return (
                      <div key={idx} style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fda4af', fontSize: '13px', fontWeight: '700' }}>
                        {formatTime(b.start_time || b.startTime)} - {formatTime(b.end_time || b.endTime)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Time Slots */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', marginBottom: '16px' }}>
                <Clock size={16} color="#F59E0B" /> KHUNG GIỜ ĐẶT SÂN
              </label>

              {/* Owner Slots if available */}
              {field?.slots && field.slots.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    LỊCH DO CHỦ SÂN THIẾT LẬP
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {field.slots.map((slot) => {
                      const isBooked = isTimeOverlap(slot.startTime, slot.endTime, field.bookedIntervals);
                      const isUnavailable = isBooked || slot.isLocked;
                      const isSelected = startTime === slot.startTime && endTime === slot.endTime;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isUnavailable}
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('[Owner Slot] Selected slot:', slot.startTime, '-', slot.endTime);
                            setStartTime(slot.startTime);
                            setEndTime(slot.endTime);
                          }}
                          style={{
                            padding: '12px',
                            background: isSelected
                              ? '#F59E0B'
                              : isUnavailable
                              ? 'rgba(244, 63, 94, 0.05)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected
                              ? '2px solid #F59E0B'
                              : isUnavailable
                              ? '1px solid rgba(244, 63, 94, 0.15)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            color: isSelected ? '#000' : isUnavailable ? '#f43f5e' : '#fff',
                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            opacity: isUnavailable ? 0.6 : 1,
                            transform: isSelected ? 'scale(1.02)' : 'none',
                            boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: '800' }}>
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginTop: '2px' }}>
                            {isBooked ? 'Đã đặt' : slot.isLocked ? 'Đang khóa' : slot.priceOverride ? formatCurrency(slot.priceOverride) : formatCurrency(field.pricePerHour)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested Slots */}
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {field?.slots && field.slots.length > 0 ? 'MỐC GIỜ GỢI Ý KHÁC' : 'MỐC GIỜ GỢI Ý'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {suggestedSlots.map((slot) => {
                    const isDuplicate = field?.slots?.some(os => os.startTime === slot.startTime && os.endTime === slot.endTime);
                    if (isDuplicate) return null;

                    const isBooked = isTimeOverlap(slot.startTime, slot.endTime, field.bookedIntervals);
                    const isSelected = startTime === slot.startTime && endTime === slot.endTime;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked}
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('[Suggested Slot] Selected slot:', slot.startTime, '-', slot.endTime);
                          setStartTime(slot.startTime);
                          setEndTime(slot.endTime);
                        }}
                        style={{
                          padding: '12px',
                          background: isSelected
                            ? '#F59E0B'
                            : isBooked
                            ? 'rgba(244, 63, 94, 0.05)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected
                            ? '2px solid #F59E0B'
                            : isBooked
                            ? '1px solid rgba(244, 63, 94, 0.15)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: isSelected ? '#000' : isBooked ? '#f43f5e' : '#fff',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          opacity: isBooked ? 0.6 : 1,
                          transform: isSelected ? 'scale(1.02)' : 'none',
                          boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '800' }}>
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginTop: '2px' }}>
                          {isBooked ? 'Đã đặt' : 'Gợi ý'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Clock size={14} /> GIỜ BẮT ĐẦU
                </label>
                <input
                  type="time"
                  value={startTime}
                  min={openTimeStr}
                  max={closeTimeStr}
                  step="1800"
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
                  min={openTimeStr}
                  max={closeTimeStr}
                  step="1800"
                  onChange={(e) => setEndTime(e.target.value)}
                  onClick={(e) => e.target.showPicker?.()}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.1)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#a7f3d0', fontWeight: '700' }}>GIÁ DỰ KIẾN:</span>
                <span style={{ fontSize: '20px', color: '#F59E0B', fontWeight: '950' }}>{formatCurrency(estimatedPrice)}</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} /> Giờ hoạt động: {openTimeStr} - {closeTimeStr}
              </p>
            </div>

            <button
              type="button"
              onClick={handleContactOwner}
              style={{
                width: '100%',
                background: 'rgba(37, 211, 102, 0.12)',
                color: '#25D366',
                border: '1px solid rgba(37, 211, 102, 0.25)',
                padding: '18px',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: '900',
                cursor: isResolvingOwnerContact ? 'progress' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
                opacity: isResolvingOwnerContact ? 0.75 : 1
              }}
            >
              <MessageCircle size={18} /> {isResolvingOwnerContact ? 'ĐANG TẢI THÔNG TIN CHỦ SÂN...' : 'TRAO ĐỔI VỚI CHỦ SÂN QUA ZALO'}
            </button>

            <button
              type="button"
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
