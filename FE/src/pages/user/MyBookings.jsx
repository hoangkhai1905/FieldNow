import { useEffect, useState } from 'react';
import { cancelBooking, formatCurrency, getMyBookings, getPaymentStatus, initiatePayment } from '../../api/endpoints';
import '../public/UserFacing.css';

const statusClass = {
  CONFIRMED: 'status-pill status-pill-success',
  PENDING: 'status-pill status-pill-warning',
  CANCELLED: 'status-pill status-pill-danger',
};

const statusText = {
  CONFIRMED: 'Đã xác nhận',
  PENDING: 'Chờ thanh toán',
  CANCELLED: 'Đã hủy',
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [paymentMap, setPaymentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyBookings();
      setBookings(data);

      const paymentResults = await Promise.all(
        data.map(async (booking) => {
          try {
            const payment = await getPaymentStatus(booking.id);
            return [booking.id, payment];
          } catch {
            return [booking.id, null];
          }
        })
      );

      setPaymentMap(Object.fromEntries(paymentResults.filter(([, payment]) => Boolean(payment))));
    } catch (requestError) {
      setError(requestError.message || 'Không tải được lịch đặt sân');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handlePay = async (bookingId) => {
    setActionError('');

    try {
      const result = await initiatePayment(bookingId);
      window.location.assign(result.paymentUrl);
    } catch (requestError) {
      setActionError(requestError.message || 'Không khởi tạo được thanh toán');
    }
  };

  const handleCancel = async (bookingId) => {
    setActionError('');

    try {
      await cancelBooking(bookingId);
      await loadBookings();
    } catch (requestError) {
      setActionError(requestError.message || 'Không hủy được lịch đặt sân');
    }
  };

  return (
    <div className="user-page shell-xl">
      <section className="search-hero">
        <p className="hero-kicker">Lịch đặt sân</p>
        <h1>Lịch sử đặt sân của tôi</h1>
        <p>Tổng hợp các lịch đặt sân và trạng thái thanh toán của bạn.</p>
      </section>

      {error && <div className="notice notice-error">{error}</div>}
      {actionError && <div className="notice notice-error">{actionError}</div>}

      {loading ? (
        <div className="empty-state">
          <h3>Đang tải lịch sử đặt sân</h3>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      ) : bookings.length ? (
        <div className="table-wrap">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Mã đặt sân</th>
                <th>Sân</th>
                <th>Ngày</th>
                <th>Khung giờ</th>
                <th>Chi phí</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>
                    {booking.slot?.field?.name || 'Sân đã chọn'}
                    <br />
                    <span className="muted">{booking.slot?.field?.location || 'Không rõ vị trí'}</span>
                  </td>
                  <td>{booking.slot?.date || '---'}</td>
                  <td>
                    {booking.slot?.startTime || '---'} - {booking.slot?.endTime || '---'}
                  </td>
                  <td>{formatCurrency(booking.slot?.priceOverride || booking.slot?.field?.pricePerHour || 0)}</td>
                  <td>
                    <span className={statusClass[paymentMap[booking.id]?.status] || 'status-pill'}>
                      {paymentMap[booking.id]?.status || 'Chưa có'}
                    </span>
                  </td>
                  <td>
                    <span className={statusClass[booking.status]}>{statusText[booking.status]}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {booking.status === 'PENDING' && (
                        <button type="button" className="secondary-button" onClick={() => handlePay(booking.id)}>
                          Thanh toán ngay
                        </button>
                      )}
                      {booking.status === 'PENDING' && (
                        <button
                          type="button"
                          className="ghost-link button-link"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn hủy lịch đặt sân này?')) {
                              void handleCancel(booking.id);
                            }
                          }}
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Chưa có booking nào</h3>
          <p>Đi tới màn tìm sân để tạo booking đầu tiên.</p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;