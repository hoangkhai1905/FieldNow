import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Mail, 
  Phone, 
  MapPin,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Inline SVG Icons for Social to avoid Lucide Export errors
  const SocialIcons = {
    Facebook: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
    Instagram: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
    Twitter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
  };

  const footerStyle = {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'linear-gradient(180deg, rgba(5, 18, 14, 0.9), rgba(4, 12, 10, 0.98))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#9cb3a8',
    position: 'relative',
    overflow: 'hidden'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '64px 24px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '48px'
  };

  const sectionHeadingStyle = {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '14px',
    marginBottom: '24px'
  };

  return (
    <footer style={footerStyle}>
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(37, 211, 102, 0.7), transparent)' }} />
      <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={containerStyle}>
        <div style={gridStyle}>
          {/* Brand Info */}
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F59E0B', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#000" />
              </div>
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', margin: 0 }}>
                Field<span style={{ color: '#F59E0B' }}>Now</span>
              </h2>
            </Link>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Nền tảng thuê sân thể thao hàng đầu Việt Nam. Mang công nghệ vào từng trận đấu, giúp bạn giữ chỗ nhanh chóng.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none', transition: 'transform 0.2s ease, color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#25D366'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateY(0)'; }}><SocialIcons.Facebook /></a>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none', transition: 'transform 0.2s ease, color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#25D366'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateY(0)'; }}><SocialIcons.Instagram /></a>
              <a href="#" style={{ color: '#64748b', textDecoration: 'none', transition: 'transform 0.2s ease, color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#25D366'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateY(0)'; }}><SocialIcons.Twitter /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={sectionHeadingStyle}>Khám phá</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Tìm sân gần đây', path: '/tim-san' },
                { label: 'Giải đấu sắp tới', path: '#' },
                { label: 'Cộng đồng thể thao', path: '#' },
                { label: 'Trở thành chủ sân', path: '/register' }
              ].map((link, idx) => (
                <Link key={idx} to={link.path} style={{ color: '#9cb3a8', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s ease, color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9cb3a8'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <ArrowRight size={14} color="#F59E0B" /> {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 style={sectionHeadingStyle}>Hỗ trợ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Trung tâm trợ giúp', 'Quy định sử dụng', 'Chính sách bảo mật', 'Câu hỏi thường gặp'].map((item, idx) => (
                <a key={idx} href="#" style={{ color: '#9cb3a8', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s ease, transform 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9cb3a8'; e.currentTarget.style.transform = 'translateX(0)'; }}>{item}</a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 style={sectionHeadingStyle}>Liên hệ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                <MapPin size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
                <span>123 Đường Thể Thao, Quận 1, TP. HCM</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                <Phone size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
                <span>1900 6868</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                <Mail size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
                <span>support@fieldnow.com</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <p>© {currentYear} FieldNow Platform. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>Tiếng Việt</span>
            <span>USD ($)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;