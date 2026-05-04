import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './../../pages/public/UserFacing.css';
import { formatCurrency } from '../../api/endpoints';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking || null;

  return (
    <div className="user-page shell-md">
      <section className="search-hero">
        <p className="hero-kicker">Xác nhận đặt sân</p>
        <h1>Đặt sân thành công</h1>
        <p>Chi tiết lịch đặt sân và hướng dẫn thanh toán nếu cần.</p>

        {booking ? (
          <div className="panel-card mt-4" style={{ position: 'relative' }}>
            <h3>Đặt sân #{booking.id}</h3>
            <p>{booking.slot?.field?.name}</p>
            <p>
              Ngày: {booking.slot?.date} {booking.slot?.startTime} - {booking.slot?.endTime}
            </p>
            <p>Trạng thái: {booking.status}</p>
            {booking.slot && (
              <p>Giá: {formatCurrency(booking.slot.priceOverride ?? booking.slot.field?.pricePerHour ?? 0)}</p>
            )}

            <div className="mt-3">
              <button className="primary-button" onClick={() => navigate('/nguoi-dung/dat-san-cua-toi')}>
                Xem đặt sân của tôi
              </button>
              <button className="secondary-button" onClick={() => navigate('/')}>
                Về trang chủ
              </button>
            </div>
          </div>
        ) : (
          <div className="panel-card mt-4">
            <p>Không có thông tin đặt sân khả dụng.</p>
            <button className="primary-button" onClick={() => navigate('/tim-san')}>Tìm sân ngay</button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingConfirmation;
