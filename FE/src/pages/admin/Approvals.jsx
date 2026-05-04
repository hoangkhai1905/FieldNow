import { useEffect, useState } from 'react';
import { approveField, formatCurrency, rejectField, searchFields } from '../../api/endpoints';

const Approvals = () => {
  const [fieldId, setFieldId] = useState('');
  const [referenceFields, setReferenceFields] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await searchFields({ page: 1, limit: 4 });
        if (mounted) setReferenceFields(result.fields);
      } catch {
        if (mounted) setReferenceFields([]);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const runAction = async (action) => {
    setMessage('');
    setError('');

    try {
      await action(fieldId.trim());
      setMessage(`Đã xử lý field ${fieldId.trim()}.`);
    } catch (requestError) {
      setError(requestError.message || 'Không thực hiện được thao tác');
    }
  };

  return (
    <div className="dashboard-content">
      <section className="dashboard-hero">
        <p className="hero-kicker">Admin moderation</p>
        <h1>Duyệt hoặc từ chối field bằng endpoint thật.</h1>
        <p>
          Backend hiện expose approve/reject theo fieldId, nên màn này tập trung vào hành động nhanh và kiểm tra ID thay vì queue list giả lập.
        </p>
      </section>

      {message && <div className="notice notice-success">{message}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <section className="section-shell">
        <div className="section-heading">
          <h2>Hành động nhanh</h2>
          <p>Nhập fieldId rồi chọn approve hoặc reject.</p>
        </div>

        <div className="card-panel moderation-panel">
          <label className="form-field span-2">
            <span>Field ID</span>
            <input value={fieldId} onChange={(event) => setFieldId(event.target.value)} placeholder="UUID field" />
          </label>

          <div className="form-actions align-end span-2">
            <button type="button" className="primary-button" onClick={() => runAction(approveField)} disabled={!fieldId.trim()}>
              Approve
            </button>
            <button type="button" className="secondary-button" onClick={() => runAction(rejectField)} disabled={!fieldId.trim()}>
              Reject
            </button>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <h2>Field tham chiếu</h2>
          <p>Danh sách active fields từ /fields để copy ID khi kiểm thử. Queue chờ duyệt chưa có endpoint list riêng.</p>
        </div>

        <div className="card-grid two-up">
          {referenceFields.map((field) => (
            <article className="panel-card" key={field.id}>
              <p className="card-eyebrow">Public field</p>
              <h3>{field.name}</h3>
              <p>{field.location}</p>
              <strong>{formatCurrency(field.pricePerHour)} / giờ</strong>
              <p className="muted">{field.id}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Approvals;