import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const MainLayout = () => {
	return (
		<div className="app-frame fn-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
			<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 20%, rgba(37, 211, 102, 0.08), transparent 30%), radial-gradient(circle at 80% 10%, rgba(245, 178, 31, 0.08), transparent 24%)', pointerEvents: 'none' }} />
			<Navbar />
			<main className="fn-page" style={{ paddingTop: '108px', flex: 1, display: 'flex', flexDirection: 'column' }}>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};

export default MainLayout;