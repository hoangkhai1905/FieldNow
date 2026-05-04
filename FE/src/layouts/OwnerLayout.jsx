import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const OwnerLayout = () => {
	return (
		<div className="dashboard-shell">
			<Sidebar
				title="Khu vực chủ sân"
				description="Quản lý sân, tạo khung giờ và theo dõi các tài nguyên đang chờ duyệt."
				links={[
					{ to: '/owner', label: 'Tổng quan', meta: 'Dashboard' },
					{ to: '/owner/fields', label: 'Sân của tôi', meta: 'Owner fields' },
				]}
			/>

			<section className="dashboard-main">
				<Outlet />
			</section>
		</div>
	);
};

export default OwnerLayout;