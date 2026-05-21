import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  ChevronRight, 
  Trophy, 
  Zap, 
  MapPin, 
  Star,
  ArrowUpRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { formatCurrency, searchFields } from '../../api/endpoints';
import useAuth from '../../hooks/useAuth';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced search query for React Query
  const [debouncedQuery, setDebouncedQuery] = useState('');

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
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedQuery]);

  // Featured Fields Query using TanStack Query
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featuredFields'],
    queryFn: () => searchFields({ page: 1, limit: 3 }),
    staleTime: 60000,
  });
  const featuredFields = featuredData?.fields || [];

  // Autocomplete Search Query using TanStack Query
  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ['searchFieldsAutocomplete', debouncedQuery],
    queryFn: () => searchFields({ limit: 5, location: debouncedQuery }),
    enabled: !!debouncedQuery.trim(),
    staleTime: 30000,
  });
  const searchResults = searchData?.fields || [];

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '32px'
  };

  const heroGlowStyle = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
    zIndex: 0,
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
    <div className="home-performance-page" style={{
      color: '#fff', 
      flex: 1, 
      overflowX: 'hidden', 
      position: 'relative',
      contain: 'paint'
    }}>
      {/* Sports Court Pattern Overlay */}
      <div style={heroGlowStyle}></div>
      
      {/* Decorative Lights */}
      <div className="home-static-glow home-static-glow--green"></div>
      <div className="home-static-glow home-static-glow--amber"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 40px', position: 'relative', zIndex: 1 }}
      >
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center min-h-[380px] mb-8 lg:mb-12">
          <motion.div variants={itemVariants} className="pt-2 lg:pt-0 flex flex-col items-start">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.4)', marginBottom: '24px' }}>
              <Zap size={18} color="#F59E0B" fill="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: '13px', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Sẵn sàng cho trận đấu</span>
            </div>
            
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '950', lineHeight: 1.18, letterSpacing: '3px', marginBottom: '22px', textTransform: 'uppercase', textShadow: '0 10px 30px rgba(0,0,0,0.4)', maxWidth: '540px' }}>
              Nâng tầm <br /><span style={{ color: '#F59E0B' }}>trải nghiệm</span> <br />thuê sân <br></br><span style={{ color: '#F59E0B' }}>thể thao.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#d1fae5', lineHeight: 1.6, maxWidth: '540px', marginBottom: '18px', fontWeight: '500', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Hệ thống quản lý thuê sân thể thao hiện đại. <br />Tìm sân nhanh, chốt lịch dễ dàng, thanh toán an toàn.
            </p>

            {/* Live Search Bar */}
            <div ref={dropdownRef} className="relative w-full max-w-[540px] mb-5 z-[50]">
              <div style={{ position: 'relative' }}>
                <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#34d399' }} />
                <input
                  type="text"
                  placeholder="Tìm sân bóng, khu vực hoặc tên sân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(180deg, rgba(3, 28, 20, 0.96), rgba(2, 18, 13, 0.96))',
                    border: '1px solid rgba(52, 211, 153, 0.18)',
                    borderRadius: '22px',
                    padding: '20px 22px 20px 58px',
                    color: '#fff',
                    fontSize: '17px',
                    minHeight: '68px',
                    outline: 'none',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <button
                  onClick={() => navigate(`/tim-san?location=${searchQuery}`)}
                  className="absolute right-2 top-2 bottom-2 bg-[#F59E0B] border-none rounded-[16px] px-5 md:px-7 text-black font-extrabold cursor-pointer hover:bg-[#d97706] active:scale-95 transition-all"
                  style={{
                    fontWeight: '900',
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
                        background: 'rgba(4, 18, 14, 0.96)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(52, 211, 153, 0.12)',
                        borderRadius: '22px',
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
                          <img
                            src={field.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=160&q=60'}
                            alt={field.name}
                            width="60"
                            height="60"
                            loading="lazy"
                            decoding="async"
                            style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }}
                          />
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

            <div className="lg:hidden flex flex-col gap-4 mt-2 w-full max-w-[540px] items-start">
              {!isAuthenticated ? (
                <Link to="/register" className="inline-flex w-fit text-center bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white py-4 px-8 md:py-[22px] md:px-12 rounded-[20px] font-extrabold border border-[rgba(255,255,255,0.2)] text-[15px] backdrop-blur-[10px] transition-all">
                  TẠO TÀI KHOẢN
                </Link>
              ) : (
                <Link to="/nguoi-dung/dat-san-cua-toi" className="inline-flex w-fit text-center bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white py-4 px-8 md:py-[22px] md:px-12 rounded-[20px] font-extrabold border border-[rgba(255,255,255,0.2)] text-[15px] backdrop-blur-[10px] transition-all">
                  LỊCH ĐẶT CỦA TÔI
                </Link>
              )}
            </div>
          </motion.div>

          {/* Quick Stats Panel */}
          <motion.div variants={itemVariants} className="w-full flex flex-col items-center lg:items-stretch" style={{ gap: '28px' }}>
            <div className="w-full p-5 md:p-8 lg:mt-0" style={{ ...glassStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(14px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Thanh toán an toàn</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a7f3d0' }}>Tích hợp VNPay & SePay</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Trophy size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Chất lượng hàng đầu</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a7f3d0' }}>Sân tiêu chuẩn, đa dạng bộ môn</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <CreditCard size={32} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Hoàn tiền nhanh</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a7f3d0' }}>Nếu sân gặp sự cố</p>
                </div>
              </div>
              </div>
            </div>

            <div className="hidden lg:flex w-full justify-center pt-4">
              {isAuthenticated ? (
                <Link to="/nguoi-dung/dat-san-cua-toi" className="inline-flex min-w-[236px] justify-center text-center bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white py-4 px-8 md:py-[22px] md:px-12 rounded-[20px] font-extrabold border border-[rgba(255,255,255,0.2)] text-[15px] backdrop-blur-[10px] transition-all">
                  LỊCH ĐẶT CỦA TÔI
                </Link>
              ) : (
                <Link to="/register" className="inline-flex min-w-[236px] justify-center text-center bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white py-4 px-8 md:py-[22px] md:px-12 rounded-[20px] font-extrabold border border-[rgba(255,255,255,0.2)] text-[15px] backdrop-blur-[10px] transition-all">
                  TẠO TÀI KHOẢN
                </Link>
              )}
            </div>
          </motion.div>
        </section>

        {/* FEATURED FIELDS SECTION */}
        <section style={{ marginBottom: '100px' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <motion.div variants={itemVariants}>
              <h2 style={{ fontSize: '32px', fontWeight: '950', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>Sân nổi bật hôm nay</h2>
              <p style={{ color: '#a7f3d0', margin: '8px 0 0 0', fontSize: '15px' }}>Những sân bóng đẳng cấp nhất trong khu vực của bạn.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="self-end md:self-auto">
              <Link to="/tim-san" style={{ color: '#F59E0B', fontWeight: '900', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', letterSpacing: '0.5px' }}>
                XEM TẤT CẢ <ArrowUpRight size={20} strokeWidth={2.5} />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredLoading ? (
              [1, 2, 3].map(i => <div key={i} style={{ ...glassStyle, height: '440px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s infinite' }}></div>)
            ) : (
              featuredFields.map((field) => (
                <motion.div 
                  key={field.id}
                  variants={itemVariants}
                  whileHover={{ y: -12 }}
                  className="w-full"
                  style={{ ...glassStyle, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <Link to={`/san/${field.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                      <img
                        src={field.image}
                        alt={field.name}
                        width="384"
                        height="260"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
        <section className="px-6 py-16 md:px-12 md:py-24 text-center relative overflow-hidden" style={{ ...glassStyle, background: 'rgba(255,255,255,0.05)' }}>
           <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), transparent)', pointerEvents: 'none' }}></div>
           <motion.div variants={itemVariants} className="max-w-[800px] mx-auto relative z-10">
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: '950', marginBottom: '20px', textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: '-1px', textShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>Sẵn sàng tỏa sáng <br />trên mọi sân thể thao?</h2>
              <p style={{ color: '#d1fae5', fontSize: '16px', md: '20px', marginBottom: '40px', lineHeight: 1.6 }}>
                Đừng để việc tìm sân làm gián đoạn niềm đam mê. <br />Gia nhập cộng đồng yêu thể thao đã tin dùng FieldNow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '36px', fontWeight: '950' }}>10K+</div>
                  <div style={{ color: '#a7f3d0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Người dùng</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '36px', fontWeight: '950' }}>500+</div>
                  <div style={{ color: '#a7f3d0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Sân thể thao</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '36px', fontWeight: '950' }}>24/7</div>
                  <div style={{ color: '#a7f3d0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Hỗ trợ</div>
                </div>
              </div>
              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-white hover:bg-gray-100 py-4 px-10 md:py-5 md:px-16 rounded-[22px] font-black shadow-2xl text-[15px] md:text-[16px] transition-all"
                  style={{ color: '#064e3b', minWidth: '266px', textDecoration: 'none' }}
                >
                  ĐĂNG KÝ NGAY
                </Link>
              ) : (
                <Link
                  to="/nguoi-dung/ho-so"
                  className="inline-flex items-center justify-center bg-white hover:bg-gray-100 py-4 px-10 md:py-5 md:px-16 rounded-[22px] font-black shadow-2xl text-[15px] md:text-[16px] transition-all"
                  style={{ color: '#064e3b', minWidth: '266px', textDecoration: 'none' }}
                >
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
