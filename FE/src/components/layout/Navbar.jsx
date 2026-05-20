import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  CalendarDays, 
  User, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Logo from '../common/Logo';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isOwner = user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';

  const navLinks = [
    { path: '/tim-san', label: 'Tìm sân', icon: Search },
    { path: '/nguoi-dung/dat-san-cua-toi', label: 'Lịch của tôi', icon: CalendarDays },
    { path: '/nguoi-dung/ho-so', label: 'Hồ sơ', icon: User },
  ];

  if (isOwner) navLinks.push({ path: '/owner', label: 'Quản lý sân', icon: LayoutDashboard });
  if (isAdmin) navLinks.push({ path: '/admin', label: 'Quản trị', icon: ShieldCheck });

  const navContainerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '16px',
    pointerEvents: 'none'
  };

  const navInnerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderRadius: '24px',
    background: 'rgba(5, 18, 14, 0.82)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.05)',
    pointerEvents: 'auto',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={navContainerStyle}
    >
      <nav style={navInnerStyle}>
        {/* Bottom Glow Line */}
        <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)', opacity: 0.3 }}></div>

        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo size={46} showText={true} textVariant="navbar" />
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                style={{ 
                  position: 'relative', 
                  padding: '10px 16px', 
                  borderRadius: '999px', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isActive ? 'rgba(37, 211, 102, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(37, 211, 102, 0.22)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  transform: 'translateZ(0)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} color={isActive ? '#F59E0B' : '#94a3b8'} />
                <span style={{ color: isActive ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {link.label}
                </span>
              </Link>
            );
          })}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 12px' }} />

          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link to="/login" style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', textDecoration: 'none' }}>ĐĂNG NHẬP</Link>
              <Link to="/register" style={{ 
                background: 'linear-gradient(135deg, #f5b21f, #ffcf61)', 
                color: '#08140f', 
                padding: '10px 20px', 
                borderRadius: '12px', 
                fontWeight: '900', 
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' 
              }}>GIA NHẬP</Link>
            </div>
          ) : (
            <button 
              onClick={logout}
              style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'transform 0.2s ease, background 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;