import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Users, 
  MapPin, 
  Star,
  ArrowUpRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { formatCurrency, searchFields } from '../../api/endpoints';
import useAuth from '../../hooks/useAuth';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [featuredFields, setFeaturedFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setIsSearching(true);
    setShowDropdown(true);
    const timer = setTimeout(async () => {
      try {
        const result = await searchFields({ limit: 5, location: searchQuery });
        setSearchResults(result.fields);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await searchFields({ page: 1, limit: 3 });
        setFeaturedFields(result.fields);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '32px'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div style={{ 
      color: '#fff', 
      flex: 1, 
      overflowX: 'hidden', 
      position: 'relative' 
    }}>
      {/* Soccer Pitch Pattern Overlay */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', 
        backgroundSize: '40px 40px', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}></div>
      
      {/* Decorative Lights */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }}></div>
      <div style={{ position: 'fixed', bottom: '10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', opacity: 0.1, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }}></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}
      >
        {/* HERO SECTION */}
        <section style={{ marginBottom: '100px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center', minHeight: '600px' }}>
          <motion.div variants={itemVariants}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.4)', marginBottom: '32px' }}>
              <Zap size={18} color="#F59E0B" fill="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: '13px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sẵn sàng cho trận đấu</span>
            </div>
            <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: '950', lineHeight: 0.9, letterSpacing: '-3px', marginBottom: '32px', textTransform: 'uppercase', textShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              Nâng tầm <br /><span style={{ color: '#F59E0B' }}>trải nghiệm</span> <br />đặt sân cỏ.
            </h1>
            <p style={{ fontSize: '20px', color: '#d1fae5', lineHeight: 1.6, maxWidth: '540px', marginBottom: '32px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Hệ thống quản lý và đặt sân bóng đá hiện đại nhất. <br />Tìm sân nhanh, chốt lịch dễ dàng, thanh toán an toàn.
            </p>

            {/* Live Search Bar */}
            <div ref={dropdownRef} style={{ position: 'relative', maxWidth: '540px', marginBottom: '32px', zIndex: 50 }}>
              <div style={{ position: 'relative' }}>
                <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Tìm sân bóng, khu vực..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '22px 22px 22px 56px',
                    color: '#fff',
                    fontSize: '16px',
                    outline: 'none',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <button
                  onClick={() => navigate(`/tim-san?location=${searchQuery}`)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    bottom: '10px',
                    background: '#F59E0B',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '0 24px',
                    color: '#000',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  TÌM
                </button>
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '12px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}
                  >
                    {isSearching ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tìm kiếm...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(field => (
                        <Link
                          key={field.id}
                          to={`/san/${field.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <img src={field.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80'} alt={field.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px', fontWeight: '800' }}>{field.name}</h4>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} color="#F59E0B" /> {field.location}
                            </p>
                          </div>
                          <div style={{ marginLeft: 'auto', color: '#F59E0B', fontWeight: '900' }}>
                            {formatCurrency(field.pricePerHour)}<span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>/h</span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy sân nào phù hợp.</div>
                    )}
                    {searchResults.length > 0 && (
                      <Link to={`/tim-san?location=${searchQuery}`} style={{ display: 'block', padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: '#F59E0B', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                        Xem tất cả kết quả <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              {!isAuthenticated ? (
                <Link to="/register" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '22px 48px', borderRadius: '20px', fontWeight: '900', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', fontSize: '15px', backdropFilter: 'blur(10px)' }}>
                  TẠO TÀI KHOẢN
                </Link>
              ) : (
                <Link to="/nguoi-dung/dat-san-cua-toi" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '22px 48px', borderRadius: '20px', fontWeight: '900', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', fontSize: '15px', backdropFilter: 'blur(10px)' }}>
                  LỊCH ĐẶT CỦA TÔI
                </Link>
              )}
            </div>
          </motion.div>

          {/* Quick Stats Panel */}
          <motion.div variants={itemVariants} style={{ ...glassStyle, padding: '48px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Thanh toán an toàn</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a7f3d0' }}>Tích hợp VNPay & SePay</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Trophy size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Chất lượng hàng đầu</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a7f3d0' }}>Sân cỏ tiêu chuẩn FIFA</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <CreditCard size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Hoàn tiền nhanh</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#a7f3d0' }}>Nếu sân gặp sự cố</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FEATURED FIELDS SECTION */}
        <section style={{ marginBottom: '100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <motion.div variants={itemVariants}>
              <h2 style={{ fontSize: '36px', fontWeight: '950', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>Sân nổi bật hôm nay</h2>
              <p style={{ color: '#a7f3d0', margin: '12px 0 0 0', fontSize: '17px' }}>Những sân bóng đẳng cấp nhất trong khu vực của bạn.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link to="/tim-san" style={{ color: '#F59E0B', fontWeight: '900', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', letterSpacing: '0.5px' }}>
                XEM TẤT CẢ <ArrowUpRight size={20} strokeWidth={2.5} />
              </Link>
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '40px' }}>
            {loading ? (
              [1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '440px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s infinite' }}></div>)
            ) : (
              featuredFields.map((field) => (
                <motion.div 
                  key={field.id}
                  variants={itemVariants}
                  whileHover={{ y: -12 }}
                  style={{ ...glassStyle, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <Link to={`/san/${field.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                      <img src={field.image} alt={field.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(2, 44, 34, 0.8)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <Star size={16} fill="#F59E0B" color="#F59E0B" />
                        <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>4.9</span>
                      </div>
                    </div>
                    <div style={{ padding: '32px' }}>
                      <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', marginBottom: '10px', color: '#fff' }}>{field.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a7f3d0', fontSize: '15px', marginBottom: '24px' }}>
                        <MapPin size={16} color="#F59E0B" />
                        <span>{field.location}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                          <span style={{ fontSize: '13px', color: '#a7f3d0', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>Giá thuê</span>
                          <span style={{ fontSize: '24px', fontWeight: '950', color: '#F59E0B' }}>{formatCurrency(field.pricePerHour)}<span style={{ fontSize: '15px', color: '#a7f3d0', fontWeight: 'normal' }}>/h</span></span>
                        </div>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <ChevronRight size={28} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* EXPERIENCE SECTION */}
        <section style={{ ...glassStyle, padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
           <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), transparent)', pointerEvents: 'none' }}></div>
           <motion.div variants={itemVariants} style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '56px', fontWeight: '950', marginBottom: '28px', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-1px', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>Sẵn sàng tỏa sáng <br />trên sân cỏ?</h2>
              <p style={{ color: '#d1fae5', fontSize: '20px', marginBottom: '56px', lineHeight: 1.6 }}>
                Đừng để việc tìm sân làm gián đoạn niềm đam mê. <br />Gia nhập cộng đồng cầu thủ đã tin dùng FieldNow.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '64px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '40px', fontWeight: '950' }}>10K+</div>
                  <div style={{ color: '#a7f3d0', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Cầu thủ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '40px', fontWeight: '950' }}>500+</div>
                  <div style={{ color: '#a7f3d0', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Sân bóng</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '40px', fontWeight: '950' }}>24/7</div>
                  <div style={{ color: '#a7f3d0', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Hỗ trợ</div>
                </div>
              </div>
              {!isAuthenticated ? (
                <Link to="/register" style={{ background: '#fff', color: '#064e3b', padding: '24px 64px', borderRadius: '22px', fontWeight: '950', textDecoration: 'none', display: 'inline-block', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontSize: '16px' }}>
                  ĐĂNG KÝ NGAY
                </Link>
              ) : (
                <Link to="/nguoi-dung/ho-so" style={{ background: '#fff', color: '#064e3b', padding: '24px 64px', borderRadius: '22px', fontWeight: '950', textDecoration: 'none', display: 'inline-block', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontSize: '16px' }}>
                  TRANG CÁ NHÂN
                </Link>
              )}
           </motion.div>
        </section>
      </motion.div>
    </div>
  );
};

export default Home;