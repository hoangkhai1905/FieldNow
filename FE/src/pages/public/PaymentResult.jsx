import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyVnPayReturn, getBookingDetail, getPaymentStatus } from '../../api/endpoints';
import { formatCurrency } from '../../api/endpoints';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang xác nhận giao dịch...');
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    const run = async () => {
      try {
        const result = await verifyVnPayReturn(params);
        // Backend should return something like { bookingId, paymentId, status }
        const bookingId = result?.bookingId || result?.data?.bookingId || params?.bookingId;
        const paymentId = result?.paymentId || result?.data?.paymentId || params?.paymentId;
        const st = result?.status || result?.data?.status || 'unknown';
        if (bookingId) {
          const b = await getBookingDetail(bookingId);
          setBooking(b);
        }
        if (bookingId) {
          try {
            const p = await getPaymentStatus(bookingId);
            setPayment(p);
          } catch (e) {
            // ignore
          }
        }
        setStatus('done');
        setMessage(`Trạng thái: ${st}`);
      } catch (err) {
        setStatus('error');
        setMessage('Xác nhận giao dịch thất bại.');
      }
    };

    run();
  }, [location.search]);

  return (
    <div className="user-page shell-md">
      <section className="search-hero">
        <p className="hero-kicker">Giao dịch</p>
        <h1>Kết quả giao dịch</h1>
        <p>{message}</p>
        {status === 'loading' && <p>Vui lòng chờ...</p>}
        {status === 'error' && (
          <div>
            <p>Không thể xác nhận giao dịch. Vui lòng kiểm tra lại lịch sử đặt sân của bạn.</p>
            <button onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}>Xem đặt sân của tôi</button>
          </div>
        )}
        {status === 'done' && booking && (
          <div className="card mt-4">
            <h3>Đặt sân #{booking.id}</h3>
            <p>Trạng thái đặt: {booking.status}</p>
            {booking.slot && booking.slot.field && (
              <div>
                <p> Sân: {booking.slot.field.name}</p>
                <p> Ngày: {booking.slot.date} {booking.slot.startTime} - {booking.slot.endTime}</p>
              </div>
            )}
            {payment && (
              <div>
                <p>Giao dịch: {payment.status} - {formatCurrency(payment.amount)}</p>
              </div>
            )}
            <div className="mt-3">
              <button onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}>Xem đặt sân của tôi</button>
              <button onClick={() => navigate('/')}>Về trang chủ</button>
            </div>
          </div>
        )}
        {status === 'done' && !booking && (
          <div>
            <p>Không có thông tin đặt sân liên quan. Hãy kiểm tra lại lịch sử đặt sân.</p>
            <button onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}>Xem đặt sân của tôi</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PaymentResult;
