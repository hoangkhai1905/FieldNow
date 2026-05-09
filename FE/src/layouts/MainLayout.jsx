import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const MainLayout = () => {
	return (
		<div className="app-frame" style={{ 
			background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
			minHeight: '100vh',
			display: 'flex',
			flexDirection: 'column'
		}}>
			<Navbar />
			<main style={{ 
				paddingTop: '100px',
				flex: 1,
				display: 'flex',
				flexDirection: 'column'
			}}>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};

export default MainLayout;