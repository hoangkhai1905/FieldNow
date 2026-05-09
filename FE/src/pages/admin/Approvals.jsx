import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Search, 
  ExternalLink, 
  MapPin, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Loader2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { approveField, formatCurrency, rejectField, searchFields } from '../../api/endpoints';

const Approvals = () => {
  const [fieldId, setFieldId] = useState('');
  const [referenceFields, setReferenceFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await searchFields({ page: 1, limit: 10 });
        if (mounted) setReferenceFields(result.fields);
      } catch {
        if (mounted) setReferenceFields([]);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const handleAction = async (id, actionFn, actionName) => {
    if (!id.trim()) return;
    setLoading(true);
    try {
      await actionFn(id.trim());
      setToast({ type: 'success', text: `Đã ${actionName} sân thành công!` });
      // Reload list if needed
    } catch (error) {
      setToast({ type: 'error', text: error.message || 'Lỗi xử lý yêu cầu' });
    } finally {
      setLoading(false);
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
    <div style={{ color: '#fff', padding: '40px' }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '16px 32px', background: toast.type === 'success' ? '#10b981' : '#f43f5e', color: '#fff', borderRadius: '100px', fontWeight: '800', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '950', margin: 0, letterSpacing: '-1px' }}>PHÊ DUYỆT HỆ THỐNG</h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '16px' }}>Kiểm duyệt tính hợp lệ của các sân bóng mới đăng ký.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
          
          {/* Main Action Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <section style={{ ...glassStyle, padding: '40px', background: 'rgba(2, 44, 34, 0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={24} color="#F59E0B" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>XỬ LÝ NHANH</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Nhập mã định danh sân để thực hiện phê duyệt.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Field ID (UUID)</label>
                  <input 
                    placeholder="Ví dụ: 550e8400-e29b-41d4-a716-446655440000"
                    value={fieldId}
                    onChange={e => setFieldId(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px', color: '#fff', fontSize: '16px', fontWeight: '700', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(fieldId, approveField, 'duyệt')}
                    disabled={loading || !fieldId.trim()}
                    style={{ padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', fontWeight: '950', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: fieldId.trim() ? 1 : 0.5 }}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} CHẤP THUẬN
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(fieldId, rejectField, 'từ chối')}
                    disabled={loading || !fieldId.trim()}
                    style={{ padding: '20px', borderRadius: '18px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontWeight: '950', border: '1px solid #f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: fieldId.trim() ? 1 : 0.5 }}
                  >
                    <ShieldAlert size={20} /> TỪ CHỐI
                  </motion.button>
                </div>
             </section>

             <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>DANH SÁCH THAM CHIẾU</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Hiển thị các sân đang hoạt động</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                   {referenceFields.map((field) => (
                     <motion.div 
                        key={field.id}
                        whileHover={{ y: -5 }}
                        style={{ ...glassStyle, padding: '24px', position: 'relative', overflow: 'hidden' }}
                        onClick={() => setFieldId(field.id)}
                     >
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: '20px', cursor: 'pointer' }}>
                          <ArrowUpRight size={16} color="#F59E0B" />
                        </div>

                        <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '900' }}>{field.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                              <MapPin size={14} /> {field.location}
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '14px', fontWeight: '800' }}>
                              <CreditCard size={14} /> {formatCurrency(field.pricePerHour)} / giờ
                           </div>
                        </div>
                        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>ID Sân</p>
                           <p style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: '#a7f3d0' }}>{field.id}</p>
                        </div>
                     </motion.div>
                   ))}
                </div>
             </section>
          </div>

          {/* Guidelines Sidebar */}
          <div>
            <section style={{ ...glassStyle, padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="#F59E0B" /> QUY TRÌNH DUYỆT
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {[
                   { step: '01', title: 'Kiểm tra thông tin', desc: 'Xác minh tên sân, địa chỉ và hình ảnh cung cấp.' },
                   { step: '02', title: 'Xác thực chủ sân', desc: 'Đảm bảo tài khoản đăng ký có quyền sở hữu hợp pháp.' },
                   { step: '03', title: 'Bảng giá & Khung giờ', desc: 'Kiểm tra tính hợp lý của giá thuê và các khung giờ hoạt động.' },
                   { step: '04', title: 'Ra quyết định', desc: 'Chấp thuận để sân hiển thị công khai hoặc từ chối nếu vi phạm.' }
                 ].map((item, idx) => (
                   <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '24px', fontWeight: '950', color: 'rgba(255,255,255,0.1)', lineHeight: 1 }}>{item.step}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>{item.title}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                 <p style={{ margin: 0, fontSize: '14px', color: '#F59E0B', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} /> Lưu ý:
                 </p>
                 <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>Hành động phê duyệt không thể hoàn tác trực tiếp trên giao diện này. Vui lòng kiểm tra kỹ.</p>
              </div>
            </section>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Approvals;