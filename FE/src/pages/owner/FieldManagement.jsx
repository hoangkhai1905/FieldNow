import { useEffect, useState } from 'react';
import { createBatchSlots, createOwnerField, formatCurrency, getOwnerFields, updateOwnerField } from '../../api/endpoints';

const emptyFieldForm = {
  name: '',
  location: '',
  description: '',
  images: '',
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

  const loadFields = async () => {
    const data = await getOwnerFields();
    setFields(data);
    if (!slotForm.fieldId && data[0]) {
      setSlotForm((current) => ({ ...current, fieldId: data[0].id }));
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

    void initialLoad();

    return () => {
      mounted = false;
    };
  }, []);

  const resetFieldForm = () => {
    setEditingFieldId('');
    setFieldForm(emptyFieldForm);
  };

  const handleFieldSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      name: fieldForm.name,
      location: fieldForm.location,
      description: fieldForm.description,
      images: fieldForm.images
        .split(/\n|,/) 
        .map((item) => item.trim())
        .filter(Boolean),
      pricePerHour: Number(fieldForm.pricePerHour),
    };

    try {
      if (editingFieldId) {
        await updateOwnerField(editingFieldId, payload);
        setMessage('Đã cập nhật sân.');
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
      images: (field.images || []).join(', '),
      pricePerHour: field.pricePerHour,
    });
    setMessage('Đang chỉnh sửa sân được chọn ở phía trên.');
  };

  const handleSlotSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createBatchSlots(slotForm.fieldId, [
        {
          date: slotForm.date,
          startTime: slotForm.startTime,
          endTime: slotForm.endTime,
          priceOverride: slotForm.priceOverride ? Number(slotForm.priceOverride) : null,
        },
      ]);

      setMessage('Đã tạo khung giờ hàng loạt cho sân đã chọn.');
    } catch (requestError) {
      setError(requestError.message || 'Không tạo được slot');
    }
  };

  return (
    <div className="dashboard-content">
      <section className="dashboard-hero">
        <p className="hero-kicker">Quản lý sân</p>
        <h1>Tạo sân, chỉnh sửa thông tin và dựng slot từ API thật.</h1>
        <p>Trang này dùng owner endpoints để CRUD sân và batch create slots theo schema backend.</p>
      </section>

      {message && <div className="notice notice-success">{message}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <section className="section-shell">
        <div className="section-heading">
          <h2>{editingFieldId ? 'Chỉnh sửa sân' : 'Tạo sân mới'}</h2>
          <p>{editingFieldId ? 'Đang sửa field đã chọn.' : 'Tạo field mới ở trạng thái pending.'}</p>
        </div>

        <form className="form-grid card-panel" onSubmit={handleFieldSubmit}>
          <label className="form-field">
            <span>Tên sân</span>
            <input
              value={fieldForm.name}
              onChange={(event) => setFieldForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>Vị trí</span>
            <input
              value={fieldForm.location}
              onChange={(event) => setFieldForm((current) => ({ ...current, location: event.target.value }))}
              required
            />
          </label>

          <label className="form-field span-2">
            <span>Mô tả</span>
            <textarea
              rows="4"
              value={fieldForm.description}
              onChange={(event) => setFieldForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label className="form-field span-2">
            <span>Ảnh (ngăn cách bằng dấu phẩy hoặc xuống dòng)</span>
            <textarea
              rows="3"
              value={fieldForm.images}
              onChange={(event) => setFieldForm((current) => ({ ...current, images: event.target.value }))}
            />
          </label>

          <label className="form-field">
            <span>Giá mỗi giờ</span>
            <input
              type="number"
              min="0"
              value={fieldForm.pricePerHour}
              onChange={(event) => setFieldForm((current) => ({ ...current, pricePerHour: event.target.value }))}
              required
            />
          </label>

          <div className="form-actions align-end">
            <button type="submit" className="primary-button">
              {editingFieldId ? 'Cập nhật sân' : 'Tạo sân'}
            </button>
            {editingFieldId && (
              <button type="button" className="secondary-button" onClick={resetFieldForm}>
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <h2>Tạo slot hàng loạt</h2>
          <p>Batch payload đi qua /owner/fields/:fieldId/slots/batch với đúng schema của backend.</p>
        </div>

        <form className="form-grid card-panel" onSubmit={handleSlotSubmit}>
          <label className="form-field">
            <span>Chọn sân</span>
            <select
              value={slotForm.fieldId}
              onChange={(event) => setSlotForm((current) => ({ ...current, fieldId: event.target.value }))}
              required
            >
              <option value="">Chọn sân</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Ngày</span>
            <input
              type="date"
              value={slotForm.date}
              onChange={(event) => setSlotForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>Bắt đầu</span>
            <input
              type="time"
              value={slotForm.startTime}
              onChange={(event) => setSlotForm((current) => ({ ...current, startTime: event.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>Kết thúc</span>
            <input
              type="time"
              value={slotForm.endTime}
              onChange={(event) => setSlotForm((current) => ({ ...current, endTime: event.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>Price override</span>
            <input
              type="number"
              min="0"
              value={slotForm.priceOverride}
              onChange={(event) => setSlotForm((current) => ({ ...current, priceOverride: event.target.value }))}
              placeholder="Bỏ trống nếu dùng giá sân"
            />
          </label>

          <div className="form-actions align-end">
            <button type="submit" className="primary-button">Tạo slots</button>
          </div>
        </form>
      </section>

      <section className="section-shell">
        <div className="section-heading">
          <h2>Sân hiện có</h2>
          <p>{loading ? 'Đang tải...' : `${fields.length} sân từ owner/fields`}</p>
        </div>

        <div className="card-grid two-up">
          {fields.map((field) => (
            <article className="panel-card" key={field.id}>
              <div className="row-between">
                <span className={field.isActive ? 'status-pill status-pill-success' : 'status-pill status-pill-warning'}>
                  {field.isActive ? 'Active' : 'Pending'}
                </span>
                <strong>{formatCurrency(field.pricePerHour)} / giờ</strong>
              </div>
              <h3>{field.name}</h3>
              <p>{field.location}</p>
              <p className="muted">ID: {field.id}</p>
              <button type="button" className="secondary-button" onClick={() => handleEdit(field)}>
                Chỉnh sửa
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FieldManagement;