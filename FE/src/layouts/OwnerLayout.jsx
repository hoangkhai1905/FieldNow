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
				title="Quản trị chủ sân"
				description="Điều hành kinh doanh và quản lý tài nguyên sân bóng."
				links={[
					{ to: '/owner', label: 'Bảng điều khiển', meta: 'Overview', icon: 'Layout' },
					{ to: '/owner/fields', label: 'Sân của tôi', meta: 'My Fields', icon: 'Trophy' },
				]}
			/>

			<section style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
				<Outlet />
			</section>
		</div>
	);
};

export default OwnerLayout;