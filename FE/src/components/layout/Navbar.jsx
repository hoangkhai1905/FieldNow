import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  CalendarDays, 
  User, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Logo from '../common/Logo';
import { prefetchRoute } from '../../routes/routeLoaders';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderRadius: '24px',
    background: 'rgba(5, 18, 14, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.05)',
    pointerEvents: 'auto',
    position: 'relative',
    overflow: 'visible'
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
        <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo size={42} showText={true} textVariant="navbar" />
        </Link>

        {/* Desktop Links & Auth */}
        <div className="hidden md:flex items-center gap-2">
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
                  prefetchRoute(link.path);
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onFocus={() => prefetchRoute(link.path)}
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

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link to="/login" onMouseEnter={() => prefetchRoute('/login')} onFocus={() => prefetchRoute('/login')} style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', textDecoration: 'none' }}>ĐĂNG NHẬP</Link>
              <Link to="/register" style={{ 
                background: 'linear-gradient(135deg, #f5b21f, #ffcf61)', 
                color: '#08140f', 
                padding: '10px 20px', 
                borderRadius: '12px', 
                fontWeight: '900', 
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' 
              }} onMouseEnter={() => prefetchRoute('/register')} onFocus={() => prefetchRoute('/register')}>GIA NHẬP</Link>
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

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white"
          style={{ transition: 'all 0.2s', width: '44px', height: '44px', flexShrink: 0 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                left: 0,
                right: 0,
                background: 'rgba(5, 18, 14, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 99
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      onMouseEnter={() => prefetchRoute(link.path)}
                      onFocus={() => prefetchRoute(link.path)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: isActive ? 'rgba(37, 211, 102, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(37, 211, 102, 0.22)' : '1px solid transparent',
                        textDecoration: 'none'
                      }}
                    >
                      <Icon size={18} color={isActive ? '#F59E0B' : '#94a3b8'} />
                      <span style={{ color: isActive ? '#fff' : '#94a3b8', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

              {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => prefetchRoute('/login')}
                    onFocus={() => prefetchRoute('/login')}
                    style={{
                      textAlign: 'center',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#94a3b8',
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    ĐĂNG NHẬP
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => prefetchRoute('/register')}
                    onFocus={() => prefetchRoute('/register')}
                    style={{
                      textAlign: 'center',
                      padding: '14px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '900',
                      color: '#08140f',
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #f5b21f, #ffcf61)',
                      boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    GIA NHẬP
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  <LogOut size={18} /> ĐĂNG XUẤT
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Navbar;
