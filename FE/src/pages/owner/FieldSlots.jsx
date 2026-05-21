import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Trash2,
  ArrowLeft,
  Zap,
  Loader2,
  Settings,
  PlusCircle,
  Calendar,
  Edit3,
  Lock,
  Unlock,
  Save,
  X,
} from 'lucide-react';
import {
  getOwnerSlotsByField,
  getOwnerField,
  createBatchSlots,
  formatCurrency,
  deleteOwnerSlot,
  updateOwnerSlot,
} from '../../api/endpoints';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/common/Modal';

const today = () => new Date().toISOString().split('T')[0];

const weekdayOptions = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const buildSlotsForDate = ({ date, startTime, endTime, duration, price }) => {
  const slots = [];
  let cursor = toMinutes(startTime);
  const end = toMinutes(endTime);

  while (cursor + duration <= end) {
    const next = cursor + duration;
    slots.push({
      date,
      startTime: formatMinutes(cursor),
      endTime: formatMinutes(next),
      priceOverride: Number(price),
    });
    cursor = next;
  }

  return slots;
};

const chunkSlots = (slots, size = 50) => {
  const chunks = [];
  for (let index = 0; index < slots.length; index += size) {
    chunks.push(slots.slice(index, index + size));
  }
  return chunks;
};

const getDateRange = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const isValidPrice = (value) => Number(value) > 0;

const FieldSlots = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(today());
  const [field, setField] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState(null);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingSlotForm, setEditingSlotForm] = useState({
    startTime: '',
    endTime: '',
    priceOverride: '',
  });

  const [manualSlot, setManualSlot] = useState({
    date: today(),
    startTime: '18:00',
    endTime: '19:00',
    priceOverride: '',
  });

  const [quickSetup, setQuickSetup] = useState({
    startDate: today(),
    startTime: '08:00',
    endTime: '22:00',
    duration: 60,
    price: '',
  });

  const [recurringSetup, setRecurringSetup] = useState({
    startDate: today(),
    endDate: today(),
    weekdays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '22:00',
    duration: 60,
    price: '',
  });

  const showToast = (type, text) => setToast({ type, text });

  const loadField = async () => {
    try {
      const data = await getOwnerField(fieldId);
      const price = data.pricePerHour.toString();
      setField(data);
      setQuickSetup((prev) => ({ ...prev, price }));
      setManualSlot((prev) => ({ ...prev, priceOverride: price }));
      setRecurringSetup((prev) => ({ ...prev, price }));
    } catch {
      showToast('error', 'Không tải được thông tin sân');
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await getOwnerSlotsByField(fieldId, selectedDate);
      setSlots(data);
    } catch {
      showToast('error', 'Không tải được danh sách khung giờ');
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

  useEffect(() => {
    if (field) {
      const price = ((field.pricePerHour * quickSetup.duration) / 60).toString();
      setQuickSetup((prev) => ({ ...prev, price }));
    }
  }, [quickSetup.duration, field]);

  const validateRange = (startTime, endTime) => {
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      showToast('error', 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return false;
    }
    return true;
  };

  const createSlots = async (generatedSlots, successMessage, focusDate) => {
    if (generatedSlots.length === 0) {
      showToast('error', 'Không thể tạo khung giờ với thiết lập này');
      return;
    }

    setIsSaving(true);
    try {
      for (const chunk of chunkSlots(generatedSlots)) {
        await createBatchSlots(fieldId, chunk);
      }
      showToast('success', successMessage);
      if (selectedDate === focusDate) {
        loadSlots();
      } else {
        setSelectedDate(focusDate);
      }
    } catch (error) {
      showToast('error', error.message || 'Lỗi khi tạo khung giờ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateManualSlot = async () => {
    if (!manualSlot.date || !manualSlot.startTime || !manualSlot.endTime || !isValidPrice(manualSlot.priceOverride)) {
      showToast('error', 'Vui lòng nhập đủ ngày, giờ và giá hợp lệ');
      return;
    }
    if (!validateRange(manualSlot.startTime, manualSlot.endTime)) return;

    await createSlots([
      {
        date: manualSlot.date,
        startTime: manualSlot.startTime,
        endTime: manualSlot.endTime,
        priceOverride: Number(manualSlot.priceOverride),
      },
    ], 'Đã tạo khung giờ thủ công', manualSlot.date);
  };

  const handleQuickCreate = async () => {
    if (!quickSetup.startDate || !isValidPrice(quickSetup.price)) {
      showToast('error', 'Vui lòng nhập ngày và giá tiền hợp lệ');
      return;
    }
    if (!validateRange(quickSetup.startTime, quickSetup.endTime)) return;

    const generatedSlots = buildSlotsForDate({
      date: quickSetup.startDate,
      startTime: quickSetup.startTime,
      endTime: quickSetup.endTime,
      duration: quickSetup.duration,
      price: quickSetup.price,
    });

    await createSlots(generatedSlots, `Đã tạo nhanh ${generatedSlots.length} khung giờ`, quickSetup.startDate);
  };

  const handleRecurringCreate = async () => {
    if (!recurringSetup.startDate || !recurringSetup.endDate || !isValidPrice(recurringSetup.price)) {
      showToast('error', 'Vui lòng nhập đủ khoảng ngày và giá hợp lệ');
      return;
    }
    if (recurringSetup.startDate > recurringSetup.endDate) {
      showToast('error', 'Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    if (recurringSetup.weekdays.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }
    if (!validateRange(recurringSetup.startTime, recurringSetup.endTime)) return;

    const generatedSlots = getDateRange(recurringSetup.startDate, recurringSetup.endDate)
      .filter((date) => recurringSetup.weekdays.includes(new Date(`${date}T00:00:00`).getDay()))
      .flatMap((date) => buildSlotsForDate({
        date,
        startTime: recurringSetup.startTime,
        endTime: recurringSetup.endTime,
        duration: recurringSetup.duration,
        price: recurringSetup.price,
      }));

    await createSlots(
      generatedSlots,
      `Đã tạo lịch lặp ${generatedSlots.length} khung giờ`,
      recurringSetup.startDate
    );
  };

  const handleDelete = async (slotId) => {
    setPendingDeleteSlotId(slotId);
  };

  const confirmDeleteSlot = async () => {
    const slotId = pendingDeleteSlotId;
    if (!slotId) return;
    setPendingDeleteSlotId(null);
    try {
      await deleteOwnerSlot(slotId);
      showToast('success', 'Đã xóa khung giờ');
      loadSlots();
    } catch (error) {
      showToast('error', error.message || 'Không thể xóa khung giờ');
    }
  };

  const startEditing = (slot) => {
    setEditingSlotId(slot.id);
    setEditingSlotForm({
      startTime: slot.startTime,
      endTime: slot.endTime,
      priceOverride: slot.priceOverride ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingSlotId(null);
    setEditingSlotForm({ startTime: '', endTime: '', priceOverride: '' });
  };

  const handleUpdateSlot = async (slotId) => {
    if (!validateRange(editingSlotForm.startTime, editingSlotForm.endTime)) return;
    if (!isValidPrice(editingSlotForm.priceOverride)) {
      showToast('error', 'Giá tiền phải lớn hơn 0');
      return;
    }

    try {
      await updateOwnerSlot(slotId, {
        startTime: editingSlotForm.startTime,
        endTime: editingSlotForm.endTime,
        priceOverride: Number(editingSlotForm.priceOverride),
      });
      showToast('success', 'Đã cập nhật khung giờ');
      cancelEditing();
      loadSlots();
    } catch (error) {
      showToast('error', error.message || 'Không thể cập nhật khung giờ');
    }
  };

  const handleToggleLock = async (slot) => {
    try {
      await updateOwnerSlot(slot.id, { isLocked: !slot.isLocked });
      showToast('success', slot.isLocked ? 'Đã mở khóa khung giờ' : 'Đã khóa khung giờ');
      loadSlots();
    } catch (error) {
      showToast('error', error.message || 'Không thể đổi trạng thái khung giờ');
    }
  };

  const toggleWeekday = (weekday) => {
    setRecurringSetup((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter((item) => item !== weekday)
        : [...prev.weekdays, weekday],
    }));
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  };

  const sectionTitle = (icon, title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{title}</h3>
    </div>
  );

  return (
    <div className="owner-field-slots" style={{ color: '#fff', paddingBottom: '100px' }}>
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      <Modal
        isOpen={Boolean(pendingDeleteSlotId)}
        title="Xóa khung giờ?"
        description="Khung giờ này sẽ bị xóa khỏi lịch sân. Người dùng sẽ không thể chọn khung giờ này nữa."
        icon={Trash2}
        variant="error"
        confirmText="Xóa khung giờ"
        cancelText="Giữ lại"
        onConfirm={confirmDeleteSlot}
        onClose={() => setPendingDeleteSlotId(null)}
      />

      <header style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          onClick={() => navigate('/owner/fields')}
          style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '950', margin: 0 }}>QUẢN LÝ LỊCH SÂN</h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '4px' }}>
            Thiết lập slot thủ công, tạo nhanh trong ngày và tạo lịch lặp nhiều ngày.
          </p>
        </div>
      </header>

      <div className="field-slots-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ ...glassStyle, padding: '28px' }}>
            {sectionTitle(<PlusCircle size={22} color="#F59E0B" />, 'TẠO SLOT THỦ CÔNG')}
            <div className="slot-form-grid slot-form-grid-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <input type="date" value={manualSlot.date} onChange={(e) => setManualSlot({ ...manualSlot, date: e.target.value })} style={inputStyle} />
              <input type="time" value={manualSlot.startTime} onChange={(e) => setManualSlot({ ...manualSlot, startTime: e.target.value })} style={inputStyle} />
              <input type="time" value={manualSlot.endTime} onChange={(e) => setManualSlot({ ...manualSlot, endTime: e.target.value })} style={inputStyle} />
              <input type="number" value={manualSlot.priceOverride} onChange={(e) => setManualSlot({ ...manualSlot, priceOverride: e.target.value })} placeholder="Giá VNĐ" style={inputStyle} />
            </div>
            <button onClick={handleCreateManualSlot} disabled={isSaving} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#10b981', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
              TẠO 1 SLOT
            </button>
          </section>

          <section style={{ ...glassStyle, padding: '28px' }}>
            {sectionTitle(<Zap size={22} color="#F59E0B" fill="#F59E0B" />, 'TẠO NHANH TRONG NGÀY')}
            <div className="slot-form-grid slot-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input type="date" value={quickSetup.startDate} onChange={(e) => setQuickSetup({ ...quickSetup, startDate: e.target.value })} style={inputStyle} />
              <input type="number" value={quickSetup.price} onChange={(e) => setQuickSetup({ ...quickSetup, price: e.target.value })} placeholder="Giá VNĐ" style={inputStyle} />
            </div>
            <div className="slot-form-grid slot-form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <input type="time" value={quickSetup.startTime} onChange={(e) => setQuickSetup({ ...quickSetup, startTime: e.target.value })} style={inputStyle} />
              <input type="time" value={quickSetup.endTime} onChange={(e) => setQuickSetup({ ...quickSetup, endTime: e.target.value })} style={inputStyle} />
              <select value={quickSetup.duration} onChange={(e) => setQuickSetup({ ...quickSetup, duration: Number(e.target.value) })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="60">60 phút</option>
                <option value="90">90 phút</option>
                <option value="120">120 phút</option>
              </select>
            </div>
            <button onClick={handleQuickCreate} disabled={isSaving} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer' }}>
              {isSaving ? 'ĐANG TẠO...' : 'TẠO NHANH SLOT TRONG NGÀY'}
            </button>
          </section>

          <section style={{ ...glassStyle, padding: '28px' }}>
            {sectionTitle(<Settings size={22} color="#F59E0B" />, 'TẠO LỊCH LẶP NHIỀU NGÀY')}
            <div className="slot-form-grid slot-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input type="date" value={recurringSetup.startDate} onChange={(e) => setRecurringSetup({ ...recurringSetup, startDate: e.target.value })} style={inputStyle} />
              <input type="date" value={recurringSetup.endDate} onChange={(e) => setRecurringSetup({ ...recurringSetup, endDate: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {weekdayOptions.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleWeekday(day.value)}
                  type="button"
                  style={{ minWidth: '44px', padding: '10px 12px', borderRadius: '12px', border: `1px solid ${recurringSetup.weekdays.includes(day.value) ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`, background: recurringSetup.weekdays.includes(day.value) ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.04)', color: recurringSetup.weekdays.includes(day.value) ? '#F59E0B' : '#94a3b8', fontWeight: '900', cursor: 'pointer' }}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="slot-form-grid slot-form-grid-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <input type="time" value={recurringSetup.startTime} onChange={(e) => setRecurringSetup({ ...recurringSetup, startTime: e.target.value })} style={inputStyle} />
              <input type="time" value={recurringSetup.endTime} onChange={(e) => setRecurringSetup({ ...recurringSetup, endTime: e.target.value })} style={inputStyle} />
              <select value={recurringSetup.duration} onChange={(e) => setRecurringSetup({ ...recurringSetup, duration: Number(e.target.value) })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="60">60 phút</option>
                <option value="90">90 phút</option>
                <option value="120">120 phút</option>
              </select>
              <input type="number" value={recurringSetup.price} onChange={(e) => setRecurringSetup({ ...recurringSetup, price: e.target.value })} placeholder="Giá VNĐ" style={inputStyle} />
            </div>
            <button onClick={handleRecurringCreate} disabled={isSaving} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#3b82f6', color: '#fff', fontWeight: '950', border: 'none', cursor: 'pointer' }}>
              TẠO LỊCH LẶP
            </button>
          </section>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ ...glassStyle, padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>KHUNG GIỜ TRONG NGÀY</h3>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...inputStyle, width: '160px', padding: '10px 12px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '760px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} color="#F59E0B" /></div>
              ) : slots.length > 0 ? (
                slots.map((slot) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ padding: '18px', background: slot.isLocked ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '18px', border: `1px solid ${slot.isLocked ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    {editingSlotId === slot.id ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                        <input type="time" value={editingSlotForm.startTime} onChange={(e) => setEditingSlotForm({ ...editingSlotForm, startTime: e.target.value })} style={{ ...inputStyle, padding: '10px' }} />
                        <input type="time" value={editingSlotForm.endTime} onChange={(e) => setEditingSlotForm({ ...editingSlotForm, endTime: e.target.value })} style={{ ...inputStyle, padding: '10px' }} />
                        <input type="number" value={editingSlotForm.priceOverride} onChange={(e) => setEditingSlotForm({ ...editingSlotForm, priceOverride: e.target.value })} style={{ ...inputStyle, padding: '10px' }} />
                        <button onClick={() => handleUpdateSlot(slot.id)} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: 'none', color: '#10b981', cursor: 'pointer' }}><Save size={16} /></button>
                        <button onClick={cancelEditing} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: slot.isLocked ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {slot.isLocked ? <Lock size={18} color="#f43f5e" /> : <Clock size={18} color="#10b981" />}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '900' }}>{slot.startTime} - {slot.endTime}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{formatCurrency(slot.priceOverride || 0)} · {slot.isLocked ? 'Đang khóa' : 'Đang mở'}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => startEditing(slot)} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(59,130,246,0.12)', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit3 size={16} /></button>
                          <button onClick={() => handleToggleLock(slot)} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(245,158,11,0.12)', border: 'none', color: '#F59E0B', cursor: 'pointer' }}>{slot.isLocked ? <Unlock size={16} /> : <Lock size={16} />}</button>
                          <button onClick={() => handleDelete(slot.id)} style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(244,63,94,0.12)', border: 'none', color: '#f43f5e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 32px', opacity: 0.55 }}>
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
