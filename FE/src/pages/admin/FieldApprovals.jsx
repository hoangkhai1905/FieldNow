import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { approveField, formatCurrency, getAdminFields, rejectField } from '../../api/endpoints';

const FieldApprovals = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [toast, setToast] = useState('');

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await getAdminFields({ page: 1, limit: 20, status });
      setFields(data.fields ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [status]);

  const handleApprove = async (fieldId) => {
    await approveField(fieldId);
    setToast('Đã duyệt sân');
    loadFields();
  };

  const handleReject = async (fieldId) => {
    await rejectField(fieldId);
    setToast('Đã tắt sân');
    loadFields();
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
  };

  return (
    <div style={{ color: '#fff', padding: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(59,130,246,0.12)', borderRadius: '999px', color: '#3b82f6', fontSize: '11px', fontWeight: '900', marginBottom: '18px' }}>
            <ShieldCheck size={14} />
            ADMIN MODERATION
          </div>
          <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '950' }}>PHÊ DUYỆT SÂN</h1>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>Kiểm tra và bật/tắt các sân hiển thị công khai.</p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 16px', outline: 'none' }}
        >
          <option value="pending">CHỜ DUYỆT</option>
          <option value="active">ĐANG HOẠT ĐỘNG</option>
          <option value="all">TẤT CẢ</option>
        </select>
      </header>

      {toast && (
        <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', color: '#10b981', fontWeight: '800' }}>
          {toast}
        </div>
      )}

      {loading ? (
        <div style={{ ...glassStyle, padding: '80px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={34} color="#F59E0B" />
        </div>
      ) : fields.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {fields.map((field) => (
            <article key={field.id} style={{ ...glassStyle, padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900' }}>{field.name}</h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>{field.location}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '13px', fontWeight: '800' }}>
                <span>{field.type}</span>
                <span>{formatCurrency(field.pricePerHour)}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button onClick={() => handleApprove(field.id)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  DUYỆT
                </button>
                <button onClick={() => handleReject(field.id)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <XCircle size={16} />
                  TẮT
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ ...glassStyle, padding: '80px', textAlign: 'center', color: '#94a3b8', fontWeight: '800' }}>
          Không có sân nào trong trạng thái này.
        </div>
      )}
    </div>
  );
};

export default FieldApprovals;
