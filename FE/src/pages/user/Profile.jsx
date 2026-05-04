import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { getCurrentUser } from '../../api/endpoints';
import '../public/UserFacing.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const roleLabel = (role) => {
    switch (role) {
      case 'OWNER':
        return 'Chủ sân';
      case 'ADMIN':
        return 'Đội vận hành';
      default:
        return 'Người chơi';
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const result = await getCurrentUser();
        if (mounted) setProfile(result);
      } catch {
        if (mounted) setProfile(user);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="user-page shell-xl">
      <section className="search-hero">
        <p className="hero-kicker">Thông tin cá nhân</p>
        <h1>Hồ sơ của bạn</h1>
        <p>Cập nhật thông tin liên hệ và sở thích khi tìm sân.</p>
      </section>

      <section className="profile-wrap">
        <article className="info-card profile-card">
          <h3>Tài khoản</h3>
          <p className="profile-line">Họ tên: {profile?.fullName || profile?.full_name || 'Người dùng FieldNow'}</p>
          <p className="profile-line">Email: {profile?.email || 'user@example.com'}</p>
          <p className="profile-line">Vai trò: {roleLabel(profile?.role)}</p>
          <p className="profile-line">Số điện thoại: {profile?.phoneNumber || profile?.phone_number || 'Chưa cập nhật'}</p>
          <p className="profile-line">Mã tài khoản: {profile?.id || user?.id || '---'}</p>
        </article>

        <article className="info-card profile-card">
          <h3>Gợi ý nhanh</h3>
          <p className="profile-line">Xem lịch đặt sân và trạng thái thanh toán.</p>
          <p className="profile-line">Lưu lại sân yêu thích để đặt nhanh lần sau.</p>
          <p className="profile-line">Cập nhật số điện thoại để nhận thông báo.</p>
        </article>
      </section>
    </div>
  );
};

export default Profile;