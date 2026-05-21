import React, { useEffect, useState } from 'react';
import { Activity, Banknote, CalendarCheck2, Loader2, Trophy, Users } from 'lucide-react';
import { formatCurrency, getAdminStats } from '../../api/endpoints';

const AdminDashboard = () => {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		const loadStats = async () => {
			setLoading(true);
			try {
				const data = await getAdminStats();
				if (mounted) setStats(data);
			} finally {
				if (mounted) setLoading(false);
			}
		};
		void loadStats();
		return () => {
			mounted = false;
		};
	}, []);

	const glassStyle = {
		background: 'rgba(255, 255, 255, 0.05)',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		borderRadius: '22px',
	};

	const cards = [
		{ label: 'Người dùng', value: stats?.users?.total ?? 0, sub: `${stats?.users?.OWNER ?? 0} owner`, icon: Users, color: '#3b82f6' },
		{ label: 'Sân hoạt động', value: stats?.fields?.active ?? 0, sub: `${stats?.fields?.total ?? 0} tổng sân`, icon: Trophy, color: '#F59E0B' },
		{ label: 'Booking hôm nay', value: stats?.bookings?.today ?? 0, sub: `${stats?.bookings?.total ?? 0} tổng booking`, icon: CalendarCheck2, color: '#10b981' },
		{ label: 'Doanh thu', value: formatCurrency(stats?.payments?.completedRevenue ?? 0), sub: `${stats?.payments?.pendingCash ?? 0} cash chờ thu`, icon: Banknote, color: '#a855f7' },
	];

	return (
		<div className="admin-dashboard-page" style={{ color: '#fff' }}>
			<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '34px' }}>
				<div>
					<div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(16,185,129,0.12)', borderRadius: '999px', color: '#10b981', fontSize: '11px', fontWeight: '900', marginBottom: '18px' }}>
						<Activity size={14} />
						SYSTEM TRAFFIC
					</div>
					<h1 style={{ margin: 0, fontSize: '42px', fontWeight: '950' }}>DASHBOARD LƯU LƯỢNG</h1>
					<p style={{ color: '#94a3b8', marginTop: '8px' }}>Theo dõi nhanh người dùng, sân, booking và thanh toán toàn hệ thống.</p>
				</div>
			</header>

			{loading ? (
				<div style={{ ...glassStyle, padding: '80px', textAlign: 'center' }}>
					<Loader2 className="animate-spin" size={34} color="#F59E0B" />
				</div>
			) : (
				<>
					<section className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
						{cards.map((card) => {
							const Icon = card.icon;
							return (
								<article key={card.label} className="admin-stat-card" style={{ ...glassStyle, padding: '20px' }}>
									<div style={{ width: '42px', height: '42px', borderRadius: '14px', background: `${card.color}20`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
										<Icon size={20} />
									</div>
									<p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{card.label}</p>
									<div style={{ fontSize: '30px', fontWeight: '950', lineHeight: 1 }}>{card.value}</div>
									<p style={{ margin: '8px 0 0 0', color: card.color, fontSize: '13px', fontWeight: '800' }}>{card.sub}</p>
								</article>
							);
						})}
					</section>

					<section className="admin-dashboard-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '18px' }}>
						<article style={{ ...glassStyle, padding: '22px' }}>
							<h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: '950' }}>Trạng thái booking</h2>
							{[
								['Chờ xử lý', stats?.bookings?.PENDING ?? 0, '#F59E0B'],
								['Đã xác nhận', stats?.bookings?.CONFIRMED ?? 0, '#10b981'],
								['Đã hủy', stats?.bookings?.CANCELLED ?? 0, '#f43f5e'],
							].map(([label, value, color]) => (
								<div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
									<span style={{ color: '#cbd5e1', fontWeight: '800' }}>{label}</span>
									<span style={{ color, fontWeight: '950' }}>{value}</span>
								</div>
							))}
						</article>

						<article style={{ ...glassStyle, padding: '22px' }}>
							<h2 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: '950' }}>Booking gần đây</h2>
							<div style={{ display: 'grid', gap: '10px' }}>
								{(stats?.recentBookings ?? []).length > 0 ? stats.recentBookings.map((booking) => (
									<div key={booking.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
										<div>
											<div style={{ fontWeight: '900' }}>{booking.field?.name || 'Sân'}</div>
											<div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{booking.user?.email || 'Khách'} - {booking.date?.slice(0, 10)}</div>
										</div>
										<div style={{ textAlign: 'right' }}>
											<div style={{ color: booking.status === 'CONFIRMED' ? '#10b981' : booking.status === 'CANCELLED' ? '#f43f5e' : '#F59E0B', fontSize: '12px', fontWeight: '950' }}>{booking.status}</div>
											<div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{formatCurrency(booking.total_price ?? 0)}</div>
										</div>
									</div>
								)) : (
									<div style={{ color: '#94a3b8', padding: '40px 0', textAlign: 'center', fontWeight: '800' }}>Chưa có booking gần đây.</div>
								)}
							</div>
						</article>
					</section>
				</>
			)}
		</div>
	);
};

export default AdminDashboard;
