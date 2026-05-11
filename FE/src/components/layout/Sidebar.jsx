import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Trophy, 
  Settings, 
  ChevronRight,
  Zap,
  Calendar,
  ShieldCheck,
  Users
} from 'lucide-react';

const Sidebar = ({ title, description, links = [] }) => {
  const location = useLocation();

  const iconMap = {
    Layout: <Layout size={18} />,
    Trophy: <Trophy size={18} />,
    Settings: <Settings size={18} />,
    Calendar: <Calendar size={18} />,
    ShieldCheck: <ShieldCheck size={18} />,
    Users: <Users size={18} />
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 24px'
  };

  return (
    <aside style={glassStyle}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '20px' }}>
           <Zap size={14} color="#F59E0B" fill="#F59E0B" />
           <span style={{ color: '#F59E0B', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>OWNER PORTAL</span>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '950', textTransform: 'uppercase', margin: '0 0 12px 0', lineHeight: 1.1 }}>{title}</h2>
        <p style={{ color: '#a7f3d0', fontSize: '14px', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link 
              key={link.to} 
              to={link.to} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '16px',
                textDecoration: 'none',
                background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                color: isActive ? '#F59E0B' : '#fff',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {iconMap[link.icon] || <Layout size={18} />}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '15px', fontWeight: '800' }}>{link.label}</span>
                   <small style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{link.meta}</small>
                </div>
              </div>
              {isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
         <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#10b981' }}>Trạng thái hệ thống</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
               <span style={{ fontSize: '11px', fontWeight: '500' }}>Sẵn sàng hoạt động</span>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;