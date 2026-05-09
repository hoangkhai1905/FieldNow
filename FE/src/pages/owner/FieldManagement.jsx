import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  MapPin, 
  Tag, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Calendar, 
  Clock, 
  Zap, 
  Save,
  ArrowRight,
  ChevronRight,
  Info,
  Trash2
} from 'lucide-react';
import { createBatchSlots, createOwnerField, formatCurrency, getOwnerFields, updateOwnerField } from '../../api/endpoints';

const emptyFieldForm = {
  name: '',
  location: '',
  description: '',
  images: [],
  pricePerHour: '',
};

const emptySlotForm = {
  fieldId: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '18:00',
  endTime: '19:30',
  priceOverride: '',
};

const FieldManagement = () => {
  const [fields, setFields] = useState([]);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);
  const [slotForm, setSlotForm] = useState(emptySlotForm);
  const [editingFieldId, setEditingFieldId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const loadFields = async () => {
    try {
      const data = await getOwnerFields();
      setFields(data);
      if (!slotForm.fieldId && data[0]) {
        setSlotForm((current) => ({ ...current, fieldId: data[0].id }));
      }
    } catch (e) {
      setError(e.message || 'Lỗi tải danh sách sân');
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialLoad = async () => {
      setLoading(true);
      try {
        const data = await getOwnerFields();
        if (!mounted) return;
        setFields(data);
        if (data[0]) {
          setSlotForm((current) => ({ ...current, fieldId: data[0].id }));
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message || 'Không tải được sân của owner');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initialLoad();
    return () => { mounted = false; };
  }, []);

  const resetFieldForm = () => {
    setEditingFieldId('');
    setFieldForm(emptyFieldForm);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFieldForm(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFieldForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFieldSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      ...fieldForm,
      pricePerHour: Number(fieldForm.pricePerHour),
    };

    try {
      if (editingFieldId) {
        await updateOwnerField(editingFieldId, payload);
        setMessage('Đã cập nhật sân thành công.');
      } else {
        await createOwnerField(payload);
        setMessage('Đã tạo sân mới, sân đang chờ duyệt.');
      }
      await loadFields();
      resetFieldForm();
    } catch (requestError) {
      setError(requestError.message || 'Không lưu được sân');
    }
  };

  const handleEdit = (field) => {
    setEditingFieldId(field.id);
    setFieldForm({
      name: field.name,
      location: field.location,
      description: field.description || '',
      images: field.images || [],
      pricePerHour: field.pricePerHour,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlotSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    // Pre-flight time validation
    if (slotForm.startTime >= slotForm.endTime) {
      setError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    try {
      await createBatchSlots(slotForm.fieldId, [
        {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          priceOverride: slotForm.priceOverride ? Number(slotForm.priceOverride) : null,
        },
      ]);
      setMessage('Đã tạo khung giờ cho sân thành công.');
    } catch (requestError) {
      // Localize conflict error
      if (requestError.status === 409) {
        setError('Khung giờ này bị trùng với lịch đã có. Vui lòng chọn giờ khác.');
      } else {
        setError(requestError.message || 'Không tạo được khung giờ');
      }
    }
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '16px 16px 16px 48px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box'
  };

  // Helper to get displayable image URL
  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    // Assuming backend serves uploads from /uploads or similar
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${img}`;
  };

  return (
    <div style={{ color: '#fff', paddingBottom: '100px' }}>
      {/* Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '48px' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '20px' }}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>STUDIO QUẢN LÝ</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
          Field <span style={{ color: '#F59E0B' }}>Studio</span>
        </h1>
        <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '16px', opacity: 0.8 }}>Dựng sân bóng chuyên nghiệp và thiết lập lịch thi đấu hàng loạt.</p>
      </motion.section>

      {message && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', color: '#10b981', marginBottom: '32px', fontWeight: 'bold' }}>{message}</motion.div>}
      {error && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '16px', color: '#fb7185', marginBottom: '32px', fontWeight: 'bold' }}>{error}</motion.div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        {/* Creation/Edit Form */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ ...glassStyle, padding: '40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#F59E0B" />
             </div>
             <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>{editingFieldId ? 'Cập nhật sân' : 'Dựng sân mới'}</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Cung cấp thông tin chi tiết về sân đấu của bạn.</p>
             </div>
          </div>

          <form onSubmit={handleFieldSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                   <Trophy size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                   <input 
                      style={inputStyle}
                      placeholder="Tên sân bóng (VD: Sân vận động Mỹ Đình)" 
                      value={fieldForm.name}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                   />
                </div>
                <div style={{ position: 'relative' }}>
                   <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                   <input 
                      style={inputStyle}
                      placeholder="Địa chỉ chi tiết" 
                      value={fieldForm.location}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, location: e.target.value }))}
                      required
                   />
                </div>
             </div>

             <div style={{ position: 'relative' }}>
                <Info size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                <textarea 
                  style={{ ...inputStyle, height: '120px', resize: 'none', paddingLeft: '48px' }}
                  placeholder="Mô tả sân bóng, tiện ích đi kèm..." 
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, description: e.target.value }))}
                />
             </div>

             <div style={{ ...glassStyle, padding: '24px', background: 'rgba(0,0,0,0.2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '900', color: '#F59E0B', textTransform: 'uppercase', marginBottom: '16px' }}>
                   <ImageIcon size={16} /> Thư viện hình ảnh
                </label>
                
                <div style={{ marginBottom: '20px' }}>
                   <input 
                      type="file"
                      id="field-images"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                   />
                   <label 
                      htmlFor="field-images"
                      style={{ 
                         display: 'flex', 
                         flexDirection: 'column',
                         alignItems: 'center', 
                         justifyContent: 'center',
                         gap: '12px',
                         padding: '32px', 
                         borderRadius: '16px', 
                         background: 'rgba(255, 255, 255, 0.03)', 
                         border: '2px dashed rgba(255, 255, 255, 0.1)',
                         cursor: 'pointer',
                         transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                   >
                      <Plus size={32} color="#F59E0B" />
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>CHỌN ẢNH TỪ HỆ THỐNG</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Hỗ trợ JPG, PNG, WEBP</span>
                   </label>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                   <AnimatePresence>
                      {fieldForm.images.map((img, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}
                        >
                           <img src={getImageUrl(img)} alt="Field" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           <button 
                              type="button" 
                              onClick={() => removeImage(i)}
                              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,0,0,0.8)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                           >
                              <X size={12} />
                           </button>
                        </motion.div>
                      ))}
                   </AnimatePresence>
                   {fieldForm.images.length === 0 && (
                     <div style={{ width: '100%', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                        Chưa có ảnh nào. Hãy thêm ảnh để hiển thị.
                     </div>
                   )}
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'end' }}>
                <div style={{ position: 'relative' }}>
                   <Tag size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                   <input 
                      style={inputStyle}
                      type="number"
                      placeholder="Giá mỗi giờ (VNĐ)" 
                      value={fieldForm.pricePerHour}
                      onChange={(e) => setFieldForm(prev => ({ ...prev, pricePerHour: e.target.value }))}
                      required
                   />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Save size={20} /> {editingFieldId ? 'CẬP NHẬT' : 'TẠO SÂN'}
                   </button>
                   {editingFieldId && (
                     <button type="button" onClick={resetFieldForm} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                        HỦY
                     </button>
                   )}
                </div>
             </div>
          </form>
        </motion.section>

        {/* Slot Management Side */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          {/* Smart Slot Architect */}
          <div style={{ ...glassStyle, padding: '32px' }}>
             <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} color="#F59E0B" /> DỰNG KHUNG GIỜ
             </h3>
             <form onSubmit={handleSlotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Chọn sân bóng</label>
                   <select 
                      style={{ ...inputStyle, paddingLeft: '16px' }}
                      value={slotForm.fieldId}
                      onChange={(e) => setSlotForm(prev => ({ ...prev, fieldId: e.target.value }))}
                      required
                   >
                      <option value="">-- Chọn sân --</option>
                      {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Ngày thi đấu</label>
                      <input 
                         type="date"
                         style={{ ...inputStyle, paddingLeft: '16px' }}
                         value={slotForm.date}
                         onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                         required
                      />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Giá đặc biệt (Tùy chọn)</label>
                      <input 
                         type="number"
                         placeholder="VD: 500000"
                         style={{ ...inputStyle, paddingLeft: '16px' }}
                         value={slotForm.priceOverride}
                         onChange={(e) => setSlotForm(prev => ({ ...prev, priceOverride: e.target.value }))}
                      />
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Giờ bắt đầu</label>
                      <input 
                         type="time"
                         style={{ ...inputStyle, paddingLeft: '16px' }}
                         value={slotForm.startTime}
                         onChange={(e) => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                         required
                      />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Giờ kết thúc</label>
                      <input 
                         type="time"
                         style={{ ...inputStyle, paddingLeft: '16px' }}
                         value={slotForm.endTime}
                         onChange={(e) => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                         required
                      />
                   </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: '900', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
                   XÁC NHẬN TẠO <ChevronRight size={18} />
                </button>
             </form>
          </div>

          {/* Quick Stats/Guide */}
          <div style={{ ...glassStyle, padding: '32px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)' }}>
             <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#F59E0B" /> LƯU Ý QUẢN LÝ
             </h4>
             <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ fontSize: '13px', color: '#a7f3d0', display: 'flex', gap: '10px' }}>
                   <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', marginTop: '6px' }}></div>
                   Sân mới sẽ ở trạng thái <b>CHỜ DUYỆT</b> trước khi được hiển thị công khai.
                </li>
                <li style={{ fontSize: '13px', color: '#a7f3d0', display: 'flex', gap: '10px' }}>
                   <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', marginTop: '6px' }}></div>
                   Khung giờ (Slot) được tạo sẽ có hiệu lực ngay lập tức cho sân đã <b>ACTIVE</b>.
                </li>
             </ul>
          </div>
        </motion.section>
      </div>

      {/* Existing Fields List */}
      <section style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
           <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Sân hiện có <span style={{ color: '#64748b', fontSize: '18px', fontWeight: '500' }}>({fields.length})</span></h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          {fields.map((field) => (
            <motion.article 
              key={field.id}
              whileHover={{ scale: 1.01 }}
              style={{ ...glassStyle, padding: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}
            >
              <div style={{ width: '120px', height: '120px', borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                 {field.images && field.images[0] ? (
                   <img src={getImageUrl(field.images[0])} alt={field.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={48} color="#64748b" opacity={0.2} />
                   </div>
                 )}
              </div>

              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', background: field.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: field.isActive ? '#10b981' : '#F59E0B', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                       {field.isActive ? 'ĐANG HOẠT ĐỘNG' : 'CHỜ DUYỆT'}
                    </span>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{formatCurrency(field.pricePerHour)}<span style={{ fontSize: '12px', color: '#64748b' }}>/giờ</span></strong>
                 </div>
                 <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '900' }}>{field.name}</h3>
                 <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {field.location}</p>
                 
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleEdit(field)}
                      style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    >
                       SỬA THÔNG TIN
                    </button>
                    <button 
                      style={{ padding: '10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.1)', cursor: 'pointer' }}
                    >
                       <Trash2 size={18} />
                    </button>
                 </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FieldManagement;