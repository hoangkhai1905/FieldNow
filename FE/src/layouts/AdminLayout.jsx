import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

const AdminLayout = () => {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #031b16 0%, #073b2f 52%, #102a43 100%)',
				minHeight: '100vh',
				display: 'flex',
				color: '#fff',
				overflow: 'hidden',
			}}
		>
			<Sidebar
				title="Khu vực quản trị"
				description="Theo dõi lưu lượng hệ thống và quản lý quyền người dùng."
				badgeLabel="ADMIN PORTAL"
				badgeIcon={<ShieldCheck size={14} color="#F59E0B" />}
				links={[
					{ to: '/admin', label: 'Lưu lượng', meta: 'Dashboard', icon: 'Layout' },
					{ to: '/admin/users', label: 'Người dùng', meta: 'Roles & access', icon: 'Users' },
				]}
			/>

			<section style={{ flex: 1, padding: '40px', overflowY: 'auto', minWidth: 0 }}>
				<Outlet />
			</section>
		</div>
	);
};

export default AdminLayout;
