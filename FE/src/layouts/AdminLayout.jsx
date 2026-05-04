import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const AdminLayout = () => {
	return (
		<div className="dashboard-shell">
			<Sidebar
				title="Khu vực quản trị"
				description="Duyệt sân, chỉnh vai trò người dùng và theo dõi dữ liệu vận hành."
				links={[
					{ to: '/admin', label: 'Phê duyệt', meta: 'Moderation' },
					{ to: '/admin/users', label: 'Người dùng', meta: 'Roles & access' },
				]}
			/>

			<section className="dashboard-main">
				<Outlet />
			</section>
		</div>
	);
};

export default AdminLayout;