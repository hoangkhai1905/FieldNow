import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  MapPin,
  Tag,
  Image as ImageIcon,
  Plus,
  X,
  Zap,
  Save,
  Info,
  Loader2,
  LayoutGrid,
  Clock,
  List,
  PlusCircle,
  Calendar
} from 'lucide-react';
import {
  createOwnerField,
  formatCurrency,
  getOwnerFields,
  updateOwnerField,
  toggleOwnerFieldStatus,
  uploadImages
} from '../../api/endpoints';
import Toast from '../../components/ui/Toast';

const emptyFieldForm = {
  name: '',
  location: '',
  description: '',
  images: [],
  pricePerHour: '',
  type: 'FUTSAL',
};

const FieldManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'form'
  const [fields, setFields] = useState([]);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);
  // unified images state: { url: string, file?: File, isNew: boolean }
  const [images, setImages] = useState([]);
  const [editingFieldId, setEditingFieldId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, fieldId: null, isActive: false });

  const loadFields = async (page = 1) => {
    try {
      const data = await getOwnerFields({ page, limit: 8 });
      setFields(data.fields);
      setPagination(data.pagination);
    } catch (e) {
      setToast({ type: 'error', text: e.message || 'Lỗi tải danh sách sân' });
    }
  };

  useEffect(() => {
    let mounted = true;
    const initialLoad = async () => {
      setLoading(true);
      try {
        const data = await getOwnerFields({ page: 1, limit: 8 });
        if (!mounted) return;
        setFields(data.fields);
        setPagination(data.pagination);
      } catch {
        if (mounted) setToast({ type: 'error', text: 'Không tải được danh sách sân' });
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
    setImages([]);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { url: reader.result, file, isNew: true }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      // 1. Separate existing URLs from new files
      const existingUrls = images.filter(img => !img.isNew).map(img => img.url);
      const newFiles = images.filter(img => img.isNew).map(img => img.file);

      // 2. Upload new files if any
      let uploadedUrls = [];
      if (newFiles.length > 0) {
        uploadedUrls = await uploadImages(newFiles);
      }

      // 3. Final payload with only URLs
      const payload = {
        ...fieldForm,
        pricePerHour: Number(fieldForm.pricePerHour),
        images: [...existingUrls, ...uploadedUrls]
      };

      if (editingFieldId) {
        await updateOwnerField(editingFieldId, payload);
        setToast({ type: 'success', text: 'Đã cập nhật sân thành công!' });
      } else {
        await createOwnerField(payload);
        setToast({ type: 'success', text: 'Đã tạo sân mới thành công và hoạt động ngay!' });
      }
      await loadFields(editingFieldId ? pagination?.page || 1 : 1);
      resetFieldForm();
      setActiveTab('list');
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Lỗi lưu thông tin' });
    } finally {
      setIsSaving(false);
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
      type: field.type || 'FUTSAL',
    });
    setImages((field.images || []).map(url => ({ url, isNew: false })));
    setActiveTab('form');
  };

  const handleToggleStatus = async () => {
    const { fieldId, isActive } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      await toggleOwnerFieldStatus(fieldId);
      setToast({ 
        type: 'success', 
        text: isActive ? 'Đã ngừng hoạt động sân thành công' : 'Đã kích hoạt sân hoạt động trở lại' 
      });
      await loadFields(pagination?.page || 1);
    } catch (requestError) {
      setToast({ type: 'error', text: requestError.message || 'Lỗi cập nhật trạng thái sân' });
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
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '16px 16px 16px 48px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s'
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${img}`;
  };

  return (
    <div style={{ color: '#fff', padding: '40px' }}>
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '24px' }}>
            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Owner Studio</span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '950', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
            {activeTab === 'list' ? 'DANH SÁCH' : editingFieldId ? 'CẬP NHẬT' : 'THÊM MỚI'} <span style={{ color: '#F59E0B' }}>SÂN ĐẤU</span>
          </h1>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '12px 24px',
              borderRadius: '16px',
              border: 'none',
              background: activeTab === 'list' ? '#F59E0B' : 'transparent',
              color: activeTab === 'list' ? '#000' : '#64748b',
              fontWeight: '900',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <List size={18} /> TẤT CẢ SÂN
          </button>
          <button
            onClick={() => {
              resetFieldForm();
              setActiveTab('form');
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '16px',
              border: 'none',
              background: activeTab === 'form' ? '#F59E0B' : 'transparent',
              color: activeTab === 'form' ? '#000' : '#64748b',
              fontWeight: '900',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <PlusCircle size={18} /> {editingFieldId ? 'ĐANG SỬA' : 'TẠO SÂN MỚI'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '180px', animation: 'pulse 2s infinite' }}></div>)}
              </div>
            ) : fields.length > 0 ? (
              <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {fields.map(field => (
                  <motion.div
                    key={field.id}
                    whileHover={{ y: -5 }}
                    style={{ ...glassStyle, padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', background: 'rgba(2, 44, 34, 0.4)' }}
                  >
                    <div style={{ width: '120px', height: '120px', borderRadius: '20px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={getImageUrl(field.images?.[0])} alt="field" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: field.isActive ? '#10b981' : '#f43f5e', background: field.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                          {field.isActive ? 'HOẠT ĐỘNG' : 'TẠM NGỪNG'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#F59E0B' }}>{formatCurrency(field.pricePerHour)}</span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900' }}>{field.name}</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {field.location}</p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEdit(field)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>SỬA</button>
                        <button 
                          onClick={() => navigate(`/owner/fields/${field.id}/slots`)} 
                          style={{ flex: 1.5, padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#F59E0B', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Calendar size={14} /> QUẢN LÝ LỊCH
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, fieldId: field.id, isActive: field.isActive })}
                          style={{ 
                            padding: '10px', 
                            borderRadius: '10px', 
                            background: field.isActive ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
                            border: `1px solid ${field.isActive ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`, 
                            color: field.isActive ? '#f43f5e' : '#10b981', 
                            cursor: 'pointer' 
                          }}
                          title={field.isActive ? "Ngừng hoạt động" : "Kích hoạt lại"}
                        >
                          <Zap size={16} fill={field.isActive ? 'transparent' : '#10b981'} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '32px' }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => loadFields(page)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: page === (pagination.currentPage || pagination.page) ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                        color: page === (pagination.currentPage || pagination.page) ? '#000' : '#fff',
                        fontWeight: '900',
                        cursor: 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', ...glassStyle }}>
                <Trophy size={64} color="#64748b" style={{ marginBottom: '24px', opacity: 0.2 }} />
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#64748b' }}>BẠN CHƯA CÓ SÂN BÓNG NÀO</h3>
                <button
                  onClick={() => setActiveTab('form')}
                  style={{ marginTop: '24px', background: '#F59E0B', color: '#000', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}
                >
                  TẠO SÂN ĐẦU TIÊN
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}
          >
            <section style={{ ...glassStyle, padding: '48px', background: 'rgba(2, 44, 34, 0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={28} color="#F59E0B" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>{editingFieldId ? 'CẬP NHẬT THÔNG TIN' : 'ĐĂNG KÝ SÂN MỚI'}</h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Cung cấp hình ảnh và thông tin cơ bản về sân.</p>
                </div>
              </div>

              <form onSubmit={handleFieldSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <Trophy size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                    <input style={inputStyle} placeholder="Tên sân bóng" value={fieldForm.name} onChange={e => setFieldForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                    <input style={inputStyle} placeholder="Địa chỉ chi tiết" value={fieldForm.location} onChange={e => setFieldForm(p => ({ ...p, location: e.target.value }))} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ position: 'relative' }}>
                    <Info size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                    <textarea
                      style={{ ...inputStyle, height: '120px', resize: 'none', paddingLeft: '48px' }}
                      placeholder="Mô tả sân, tiện ích, quy định..."
                      value={fieldForm.description} onChange={e => setFieldForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '900', color: '#F59E0B' }}>LOẠI SÂN</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {['FUTSAL', 'BADMINTON', 'BASKETBALL', 'VOLLEYBALL', 'TENNIS'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFieldForm(p => ({ ...p, type: t }))}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: fieldForm.type === t ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                            background: fieldForm.type === t ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.2)',
                            color: fieldForm.type === t ? '#F59E0B' : '#64748b',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '900', color: '#F59E0B', textTransform: 'uppercase', marginBottom: '20px' }}>
                    <ImageIcon size={16} /> Thư viện ảnh sân
                  </label>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <AnimatePresence>
                      {images.map((img, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '14px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                          <img src={getImageUrl(img.url)} alt="field" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#f43f5e', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <label style={{ width: '80px', height: '80px', borderRadius: '14px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Plus size={24} color="#64748b" />
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                    <Tag size={18} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
                    <input type="number" style={inputStyle} placeholder="Giá thuê/giờ (VNĐ)" value={fieldForm.pricePerHour} onChange={e => setFieldForm(p => ({ ...p, pricePerHour: e.target.value }))} required />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={isSaving} style={{ flex: 1, padding: '18px', borderRadius: '16px', background: '#F59E0B', color: '#000', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} {editingFieldId ? 'LƯU THAY ĐỔI' : 'ĐĂNG KÝ NGAY'}
                    </button>
                    {editingFieldId && (
                      <button type="button" onClick={resetFieldForm} style={{ padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>HỦY</button>
                    )}
                  </div>
                </div>
              </form>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ ...glassStyle, padding: '32px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#F59E0B" /> QUY TRÌNH MỚI
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F59E0B', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '950', flexShrink: 0 }}>1</div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#a7f3d0' }}>Chủ sân đăng ký thông tin sân bóng và giá thuê theo giờ.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F59E0B', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '950', flexShrink: 0 }}>2</div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#a7f3d0' }}>Sân bóng được kích hoạt ngay lập tức và hiển thị trên ứng dụng.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F59E0B', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '950', flexShrink: 0 }}>3</div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#a7f3d0' }}>Khách hàng tự chọn ngày và khung giờ thi đấu (06:00 - 22:00).</p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ ...glassStyle, maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center', background: '#022c22' }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: confirmModal.isActive ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Zap size={40} color={confirmModal.isActive ? '#f43f5e' : '#10b981'} fill={confirmModal.isActive ? 'transparent' : '#10b981'} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '16px' }}>
                {confirmModal.isActive ? 'NGỪNG HOẠT ĐỘNG?' : 'KÍCH HOẠT LẠI?'}
              </h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
                {confirmModal.isActive 
                  ? 'Bạn có chắc chắn muốn ngừng hoạt động sân bóng này? Sân sẽ không xuất hiện trên ứng dụng nữa cho đến khi được kích hoạt lại.' 
                  : 'Sân bóng sẽ được hiển thị công khai trở lại trên ứng dụng để khách hàng có thể tìm thấy và đặt sân.'}
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={handleToggleStatus}
                  style={{ flex: 1, padding: '16px', borderRadius: '14px', background: confirmModal.isActive ? '#f43f5e' : '#10b981', color: '#fff', fontWeight: '950', border: 'none', cursor: 'pointer' }}
                >
                  {confirmModal.isActive ? 'NGỪNG HOẠT ĐỘNG' : 'KÍCH HOẠT NGAY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldManagement;
