import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const OwnerLayout = () => {
	return (
		<div className="owner-shell fn-shell" style={{ minHeight: '100vh', display: 'flex', color: '#fff' }}>
			<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(37, 211, 102, 0.1), transparent 26%), radial-gradient(circle at 85% 15%, rgba(245, 178, 31, 0.09), transparent 24%)', pointerEvents: 'none' }} />
			<Sidebar
				title="Owner Studio"
				description="Bảng điều khiển tích hợp: Quản lý kinh doanh và quản trị hệ thống."
				links={[
					{ to: '/owner', label: 'Bảng điều khiển', meta: 'Overview', icon: 'Layout' },
					{ to: '/owner/fields', label: 'Sân của tôi', meta: 'My Fields', icon: 'Trophy' },
					{ to: '/owner/bookings', label: 'Lịch đặt sân', meta: 'Bookings', icon: 'Calendar' },
					{ to: '/owner/users', label: 'Người dùng', meta: 'Users', icon: 'Users' },
				]}
			/>

			<section className="fn-page" style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
				<Outlet />
			</section>
		</div>
	);
};

export default OwnerLayout;