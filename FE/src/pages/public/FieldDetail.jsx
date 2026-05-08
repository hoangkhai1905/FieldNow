import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { createBooking, formatCurrency, getFieldDetail, initiatePayment } from '../../api/endpoints';
import './UserFacing.css';

const redirectToSePay = (checkoutUrl, formFields) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.style.display = 'none';

  Object.entries(formFields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

const FieldDetail = () => {
  const { id } = useParams();
  const [field, setField] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [booking, setBooking] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [toast, setToast] = useState(null);

  const primaryImage = useMemo(() => field?.images?.[0] || field?.image || '', [field]);

  useEffect(() => {
    let mounted = true;

    const loadField = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getFieldDetail(id, selectedDate);
        if (!mounted) return;

        setField(result);
        setSelectedSlotId((currentSlotId) => {
          if (currentSlotId && result.slots.some((slot) => slot.id === currentSlotId && !slot.isLocked)) {
            return currentSlotId;
          }

          const firstAvailableSlot = result.slots.find((slot) => !slot.isLocked);
          return firstAvailableSlot?.id || '';
        });
      } catch (requestError) {
        if (mounted) setError(requestError.message || 'Không tải được chi tiết sân');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadField();

    return () => {
      mounted = false;
    };
  }, [id, selectedDate]);

  const selectedSlot = field?.slots?.find((slot) => slot.id === selectedSlotId);

  const handleBooking = async () => {
    if (!selectedSlotId) return;

    setIsBooking(true);
    setActionError('');
    setActionMessage('');

    try {
      const result = await createBooking(selectedSlotId);
      setBooking(result);
      setActionMessage('Đã giữ chỗ thành công. Bạn có thể thanh toán ngay.');
      // start countdown if expiresAt provided
      if (result?.expiresAt) {
        const expiresAt = new Date(result.expiresAt).getTime();
        const updateCountdown = () => {
          const now = Date.now();
          const ms = expiresAt - now;
          if (ms <= 0) {
            setCountdown(0);
            setActionMessage('Lượt giữ chỗ đã hết hạn. Hãy chọn khung giờ khác.');
            // refresh field slots
            void getFieldDetail(id, selectedDate).then((r) => setField(r)).catch(() => {});
            return;
          }
          setCountdown(Math.floor(ms / 1000));
        };

        updateCountdown();
        const iv = setInterval(updateCountdown, 1000);
        // clear after expiry
        setTimeout(() => clearInterval(iv), Math.max(0, expiresAt - Date.now() + 2000));
      }

      // briefly show confirmation then navigate to bookings confirm page
      setToast({ type: 'success', text: 'Đã giữ chỗ thành công' });
      setTimeout(() => setToast(null), 4200);
      setTimeout(() => {
        try {
          navigate('/nguoi-dung/dat-san-cua-toi/confirm', { state: { booking: result } });
        } catch (e) {
          // ignore
        }
      }, 1200);
    } catch (requestError) {
      setActionError(requestError.message || 'Không tạo được booking');
    } finally {
      setIsBooking(false);
    }
  };

  const handlePayment = async () => {
    if (!booking?.id) return;

    setIsPaying(true);
    setActionError('');

    try {
      const result = await initiatePayment(booking.id);
      redirectToSePay(result.checkoutUrl, result.formFields);
    } catch (requestError) {
      setActionError(requestError.message || 'Không khởi tạo được thanh toán');
      setToast({ type: 'error', text: 'Không thể khởi tạo thanh toán' });
      setTimeout(() => setToast(null), 4200);
    } finally {
      setIsPaying(false);
    }
  };

  const displayPrice = selectedSlot?.priceOverride ?? field?.pricePerHour ?? 0;

  return (
    <div className="user-page shell-xl">
      <section className="search-hero">
        <p className="hero-kicker">Chi tiết sân</p>
        <h1>{field?.name || 'Đang tải thông tin sân'}</h1>
        <p>
          {field?.location || 'Sân yêu thích của bạn'}
        </p>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <h3>Đang tải chi tiết sân</h3>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      ) : field ? (
        <section className="detail-grid">
          <article className="detail-main">
            <img src={primaryImage} alt={field.name} />
            <div className="info-card detail-copy">
              <h3>Mô tả sân</h3>
              <p className="muted">{field.description || 'Chưa có mô tả chi tiết.'}</p>

              <h3>Ảnh sân</h3>
              <div className="slot-list">
                {field.images.length ? (
                  field.images.map((image) => (
                    <img key={image} src={image} alt={field.name} className="thumb-image" />
                  ))
                ) : (
                  <span className="slot-pill">Chưa có ảnh phụ</span>
                )}
              </div>
            </div>
          </article>

          <aside className="info-card booking-panel">
            <div className="row-between">
              <div>
                <p className="muted">Giá</p>
                <p className="price" style={{ marginTop: 0 }}>
                  {formatCurrency(displayPrice)} / giờ
                </p>
              </div>
              <span className={field.isActive ? 'status-pill status-pill-success' : 'status-pill'}>
                {field.isActive ? 'Đang mở' : 'Chờ duyệt'}
              </span>
            </div>

            <label className="form-field">
              <span>Ngày cần xem lịch</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>

            <p className="muted">Chọn một khung giờ trống để đặt</p>
            <div className="slot-grid">
              {field.slots.length ? (
                field.slots.map((slot) => {
                  const isSelected = slot.id === selectedSlotId;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      className={`slot-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSlotId(slot.id)}
                      disabled={slot.isLocked}
                    >
                      <strong>{slot.startTime} - {slot.endTime}</strong>
                      <span>{slot.date}</span>
                      <small>{slot.isLocked ? 'Đã có người giữ' : 'Còn trống'}</small>
                    </button>
                  );
                })
              ) : (
                <div className="empty-state compact">
                  <h3>Chưa có khung giờ trong ngày này</h3>
                  <p>Hãy chọn ngày khác hoặc quay lại sau khi chủ sân cập nhật lịch.</p>
                </div>
              )}
            </div>

            {actionError && <div className="notice notice-error" role="alert">{actionError}</div>}
            {actionMessage && <div className="notice notice-success" role="status">{actionMessage}</div>}

            {toast && (
              <div aria-live="polite">
                <div className={`fn-toast fn-toast-${toast.type}`}>
                  <div className="fn-toast-body">
                    <div className="fn-toast-content">{toast.text}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="action-stack">
              <button type="button" className="primary-button" onClick={handleBooking} disabled={!selectedSlotId || isBooking}>
                {isBooking ? 'Đang giữ chỗ...' : 'Đặt sân ngay'}
              </button>

              {booking && booking.status === 'PENDING' && (
                <button type="button" className="secondary-button" onClick={handlePayment} disabled={isPaying}>
                  {isPaying ? 'Đang mở thanh toán...' : 'Thanh toán ngay'}
                </button>
              )}

              <Link className="ghost-link" to="/nguoi-dung/dat-san-cua-toi">
                Xem lịch đặt sân
              </Link>
            </div>

            {booking && (
              <div className="booking-summary">
                <h3>Lượt đặt vừa tạo</h3>
                <p>Mã đặt sân: {booking.id}</p>
                <p>Trạng thái: {booking.status}</p>
                {booking.expiresAt && (
                  <p>
                    Hết hạn trong: {countdown === null ? '—' : `${Math.floor(countdown / 60)}m ${countdown % 60}s`}
                  </p>
                )}
              </div>
            )}
          </aside>
        </section>
      ) : null}
    </div>
  );
};

export default FieldDetail;