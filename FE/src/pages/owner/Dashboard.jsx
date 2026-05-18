import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  ShieldCheck,
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { getOwnerFields, formatCurrency, getOwnerStats, getOwnerBookings } from '../../api/endpoints';

const Dashboard = () => {
  const [fields, setFields] = useState([]);
  const [stats, setStats] = useState({ totalFields: 0, activeFields: 0, totalConfirmedBookings: 0, totalRevenue: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [fieldsData, statsData, bookingsData] = await Promise.all([
          getOwnerFields(),
          getOwnerStats(),
          getOwnerBookings()
        ]);
        if (mounted) {
          setFields(fieldsData);
          setStats(statsData);
          const ownerBookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings ?? [];
          setRecentBookings(ownerBookings.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  return (
    <div style={{ color: '#fff' }}>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '48px' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
          <BarChart3 size={14} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>BUSINESS OVERVIEW</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>
          Quản lý <span style={{ color: '#F59E0B' }}>kinh doanh</span>
        </h1>
        <p style={{ color: '#a7f3d0', fontSize: '18px', marginTop: '16px', opacity: 0.8, maxWidth: '600px', lineHeight: 1.6 }}>
          Theo dõi hiệu suất sân bóng, quản lý lịch đặt và tối ưu hóa doanh thu từ dữ liệu thực tế.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <Link to="/owner/fields" style={{ textDecoration: 'none', background: '#F59E0B', color: '#000', padding: '16px 28px', borderRadius: '14px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)' }}>
            QUẢN LÝ SÂN <ArrowRight size={18} strokeWidth={3} />
          </Link>
        </div>
      </motion.section>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {[
          { label: 'Tổng số sân', value: stats.totalFields, icon: Trophy, color: '#F59E0B', sub: 'Tài nguyên sở hữu' },
          { label: 'Doanh thu', value: formatCurrency(stats.totalRevenue), icon: ShieldCheck, color: '#10b981', sub: 'Tổng thu nhập' },
          { label: 'Lịch đặt', value: stats.totalConfirmedBookings, icon: Clock, color: '#3b82f6', sub: 'Đã xác nhận' }
        ].map((metric, idx) => (
          <motion.article
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ ...glassStyle, padding: '32px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
              <metric.icon size={120} color={metric.color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${metric.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <metric.icon size={20} color={metric.color} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{metric.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <strong style={{ fontSize: '42px', fontWeight: '950' }}>{loading ? '...' : metric.value}</strong>
              <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: '600', opacity: 0.6 }}>{metric.sub}</span>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Recent Bookings Section */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Lịch đặt gần đây</h2>
          <Link to="/owner/bookings" style={{ color: '#F59E0B', textDecoration: 'none', fontSize: '14px', fontWeight: '800' }}>XEM TẤT CẢ</Link>
        </div>

        <div style={{ ...glassStyle, padding: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '16px' }}>SÂN BÓNG</th>
                <th style={{ padding: '16px' }}>KHÁCH HÀNG</th>
                <th style={{ padding: '16px' }}>NGÀY ĐẶT</th>
                <th style={{ padding: '16px' }}>LỊCH ĐẶT</th>
                <th style={{ padding: '16px' }}>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '800' }}>{booking.field?.name}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px' }}>{booking.user?.email}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{booking.user?.fullName}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px' }}>{new Date(booking.createdAt).toLocaleDateString('vi-VN')}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{booking.startTime?.slice(0, 5) || '--:--'} - {booking.endTime?.slice(0, 5) || '--:--'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {booking.date && !isNaN(new Date(booking.date)) ? new Date(booking.date).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      padding: '4px 8px',
                      borderRadius: '100px',
                      background: booking.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : (booking.status === 'CANCELLED' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                      color: booking.status === 'CONFIRMED' ? '#10b981' : (booking.status === 'CANCELLED' ? '#f43f5e' : '#F59E0B')
                    }}>
                      {booking.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : booking.status === 'PENDING' ? 'CHỜ THANH TOÁN' : 'ĐÃ HỦY'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chưa có lịch đặt nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* My Fields Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Sân bóng của tôi</h2>
          <Link to="/owner/fields" style={{ color: '#F59E0B', textDecoration: 'none', fontSize: '14px', fontWeight: '800' }}>XEM TẤT CẢ</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {loading ? (
            [1, 2].map(i => <div key={i} style={{ ...glassStyle, height: '160px', animation: 'pulse 2s infinite' }}></div>)
          ) : fields.length > 0 ? (
            fields.slice(0, 2).map((field, idx) => (
              <motion.article
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                style={{ ...glassStyle, padding: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}
              >
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={48} color={field.isActive ? '#10b981' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', background: field.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: field.isActive ? '#10b981' : '#3b82f6', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {field.isActive ? 'ĐANG HOẠT ĐỘNG' : 'CHỜ DUYỆT'}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900' }}>{field.name}</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 12px 0' }}>{field.location}</p>
                  <strong style={{ color: '#F59E0B', fontSize: '18px', fontWeight: '900' }}>{formatCurrency(field.pricePerHour)}<span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}> / giờ</span></strong>
                </div>
              </motion.article>
            ))
          ) : (
            <div style={{ ...glassStyle, padding: '60px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Bạn chưa có sân bóng nào.</p>
              <Link to="/owner/fields" style={{ textDecoration: 'none', background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: '800' }}>TẠO SÂN NGAY</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
