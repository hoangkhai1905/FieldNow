import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  ArrowLeft,
  Zap,
  Loader2,
  Settings,
  PlusCircle,
  Calendar
} from 'lucide-react';
import { 
  getOwnerSlotsByField, 
  getOwnerField,
  createBatchSlots, 
  formatCurrency, 
  deleteOwnerSlot 
} from '../../api/endpoints';

const FieldSlots = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [field, setField] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Quick setup state
  const [quickSetup, setQuickSetup] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '22:00',
    duration: 60, // minutes
    price: ''
  });

  const loadField = async () => {
    try {
      const data = await getOwnerField(fieldId);
      setField(data);
      // Auto set price based on field pricePerHour
      setQuickSetup(prev => ({ ...prev, price: data.pricePerHour.toString() }));
    } catch (error) {
      setToast({ type: 'error', text: 'Không tải được thông tin sân' });
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await getOwnerSlotsByField(fieldId, selectedDate);
      setSlots(data);
    } catch (error) {
      setToast({ type: 'error', text: 'Không tải được danh sách khung giờ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadField();
  }, [fieldId]);

  useEffect(() => {
    loadSlots();
  }, [fieldId, selectedDate]);

  // Auto calculate price when duration changes
  useEffect(() => {
    if (field) {
      const calculatedPrice = (field.pricePerHour * quickSetup.duration) / 60;
      setQuickSetup(prev => ({ ...prev, price: calculatedPrice.toString() }));
    }
  }, [quickSetup.duration, field]);

  const handleDelete = async (slotId) => {
    if (!window.confirm('Bạn có chắc muốn xóa khung giờ này?')) return;
    try {
      await deleteOwnerSlot(slotId);
      setToast({ type: 'success', text: 'Đã xóa khung giờ' });
      loadSlots();
    } catch (error) {
      setToast({ type: 'error', text: 'Lỗi khi xóa khung giờ' });
    }
  };

  const handleBatchCreate = async () => {
    const generatedSlots = [];
    const startParts = quickSetup.startTime.split(':').map(Number);
    const endParts = quickSetup.endTime.split(':').map(Number);
    
    let currentTotalMinutes = startParts[0] * 60 + startParts[1];
    const endTotalMinutes = endParts[0] * 60 + endParts[1];
    
    if (currentTotalMinutes >= endTotalMinutes) {
      setToast({ type: 'error', text: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
      return;
    }

    if (!quickSetup.price) {
      setToast({ type: 'error', text: 'Vui lòng nhập giá tiền' });
      return;
    }

    while (currentTotalMinutes + quickSetup.duration <= endTotalMinutes) {
      const startH = Math.floor(currentTotalMinutes / 60);
      const startM = currentTotalMinutes % 60;
      
      const nextTotalMinutes = currentTotalMinutes + quickSetup.duration;
      const endH = Math.floor(nextTotalMinutes / 60);
      const endM = nextTotalMinutes % 60;
      
      generatedSlots.push({
        date: quickSetup.startDate,
        startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}:00`,
        endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`,
        priceOverride: parseFloat(quickSetup.price)
      });
      
      currentTotalMinutes = nextTotalMinutes;
    }

    if (generatedSlots.length === 0) {
      setToast({ type: 'error', text: 'Không thể tạo khung giờ với thiết lập này' });
      return;
    }

    setIsSaving(true);
    try {
      await createBatchSlots(fieldId, generatedSlots);
      setToast({ type: 'success', text: `Đã tạo thành công ${generatedSlots.length} khung giờ!` });
      if (selectedDate === quickSetup.startDate) {
        loadSlots();
      } else {
        setSelectedDate(quickSetup.startDate);
      }
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Lỗi khi tạo khung giờ' });
    } finally {
      setIsSaving(false);
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s'
  };

  return (
    <div style={{ color: '#fff', paddingBottom: '100px' }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, padding: '16px 32px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button 
          onClick={() => navigate('/owner/fields')}
          style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '950', margin: 0, letterSpacing: '-1px' }}>QUẢN LÝ LỊCH SÂN</h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>Thiết lập khung giờ và giá tiền cho các ngày trong tuần.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
        
        {/* Quick Setup Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <section style={{ ...glassStyle, padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} color="#F59E0B" fill="#F59E0B" />
              </div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>TẠO KHUNG GIỜ NHANH</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Ngày áp dụng</label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b' }} />
                  <input 
                    type="date" 
                    value={quickSetup.startDate}
                    onChange={e => setQuickSetup({...quickSetup, startDate: e.target.value})}
                    style={{ ...inputStyle, paddingLeft: '48px' }} 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Giá tiền (VNĐ)</label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 200000"
                  value={quickSetup.price}
                  onChange={e => setQuickSetup({...quickSetup, price: e.target.value})}
                  style={inputStyle} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Giờ bắt đầu</label>
                <input 
                  type="time" 
                  value={quickSetup.startTime}
                  onChange={e => setQuickSetup({...quickSetup, startTime: e.target.value})}
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Giờ kết thúc</label>
                <input 
                  type="time" 
                  value={quickSetup.endTime}
                  onChange={e => setQuickSetup({...quickSetup, endTime: e.target.value})}
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Thời lượng (Phút)</label>
                <select 
                  value={quickSetup.duration}
                  onChange={e => setQuickSetup({...quickSetup, duration: parseInt(e.target.value)})}
                  style={{ ...inputStyle, appearance: 'none' }}
                >
                  <option value="60">60 phút</option>
                  <option value="90">90 phút</option>
                  <option value="120">120 phút</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleBatchCreate}
              disabled={isSaving}
              style={{ width: '100%', padding: '20px', borderRadius: '18px', background: '#F59E0B', color: '#000', fontWeight: '950', fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />} KHỞI TẠO LỊCH NGAY
            </button>
          </section>

          {/* Guidelines */}
          <section style={{ ...glassStyle, padding: '32px', borderStyle: 'dashed', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#F59E0B' }}>
              <Settings size={20} /> LƯU Ý KHI THIẾT LẬP
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#64748b' }}>
              <li style={{ display: 'flex', gap: '12px' }}>
                <Check size={16} color="#10b981" style={{ flexShrink: 0 }} /> 
                Hệ thống sẽ tự động chia nhỏ khoảng thời gian bạn chọn thành các khung giờ liên tiếp.
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <Check size={16} color="#10b981" style={{ flexShrink: 0 }} /> 
                Để cho thuê từ 8h sáng đến 10h tối, hãy để Giờ bắt đầu là 08:00 và Giờ kết thúc là 22:00.
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <Check size={16} color="#10b981" style={{ flexShrink: 0 }} /> 
                Nếu có khung giờ bị trùng lặp, hệ thống sẽ báo lỗi và không tạo mới.
              </li>
            </ul>
          </section>
        </div>

        {/* Existing Slots Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ ...glassStyle, padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>KHUNG GIỜ TRONG NGÀY</h3>
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 16px', color: '#fff', outline: 'none', fontSize: '13px' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} color="#F59E0B" /></div>
              ) : slots.length > 0 ? (
                slots.map((slot) => (
                  <motion.div 
                    key={slot.id} 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={20} color="#10b981" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{slot.startTime} - {slot.endTime}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{formatCurrency(slot.priceOverride || 0)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(slot.id)}
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 40px', opacity: 0.5 }}>
                  <Calendar size={48} style={{ marginBottom: '20px' }} />
                  <p style={{ fontWeight: '700' }}>Chưa có khung giờ nào được thiết lập cho ngày này.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FieldSlots;
