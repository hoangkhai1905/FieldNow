import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const OwnerLayout = () => {
	return (
		<div className="owner-shell" style={{ 
			background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
			minHeight: '100vh',
			display: 'flex',
			color: '#fff'
		}}>
			<Sidebar
				title="Owner Studio"
				description="Bảng điều khiển tích hợp: Quản lý kinh doanh và quản trị hệ thống."
				links={[
					{ to: '/owner', label: 'Bảng điều khiển', meta: 'Overview', icon: 'Layout' },
					{ to: '/owner/fields', label: 'Sân của tôi', meta: 'My Fields', icon: 'Trophy' },
					{ to: '/owner/bookings', label: 'Lịch đặt sân', meta: 'Bookings', icon: 'Calendar' },
				]}
			/>

			<section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
				<Outlet />
			</section>
		</div>
	);
};

export default OwnerLayout;
