import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  ChevronRight,
  Trophy,
  Zap,
  Filter,
  ArrowRight,
  Star
} from 'lucide-react';
import { formatCurrency, searchFields } from '../../api/endpoints';

const SearchFields = () => {
  const [fields, setFields] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const fieldTypes = [
    { value: '', label: 'Tất cả loại sân' },
    { value: 'FUTSAL', label: 'Sân Bóng đá' },
    { value: 'BADMINTON', label: 'Cầu lông' },
    { value: 'BASKETBALL', label: 'Bóng rổ' },
    { value: 'VOLLEYBALL', label: 'Bóng chuyền' },
    { value: 'TENNIS', label: 'Tennis' },
  ];

  const getFieldTypeLabel = (type) => {
    return fieldTypes.find(t => t.value === type)?.label || type || 'Sân bóng đá';
  };

  const loadFields = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await searchFields({
        page,
        limit: 12,
        location: searchQuery,
        type: typeFilter
      });
      setFields(result.fields);
      setPagination(result.pagination);
    } catch (requestError) {
      setError(requestError.message || 'Không tìm thấy sân bóng nào');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFields();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter]);

  const getImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${img}`;
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  const inputStyle = {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '16px 16px 16px 48px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    transition: 'all 0.3s'
  };

  return (
    <div style={{ color: '#fff', paddingBottom: '100px' }}>
      {/* Hero Search Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '48px', textAlign: 'center' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '24px' }}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>TÌM KIẾM ĐẤU TRƯỜNG</span>
        </div>
        <h1 style={{ fontSize: '64px', fontWeight: '950', textTransform: 'uppercase', margin: 0, letterSpacing: '-3px', lineHeight: 1 }}>
          Sẵn sàng <span style={{ color: '#F59E0B' }}>Ra sân?</span>
        </h1>
        <p style={{ color: '#a7f3d0', fontSize: '20px', marginTop: '16px', opacity: 0.8 }}>Khám phá hàng trăm sân bóng chất lượng cao quanh bạn.</p>

        <div style={{ maxWidth: '800px', margin: '48px auto 0', display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }} />
            <input
              style={inputStyle}
              placeholder="Nhập tên sân bóng cần tìm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', width: '280px' }}>
            <div
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: isTypeOpen ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isTypeOpen ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Filter size={18} style={{ color: typeFilter ? '#F59E0B' : '#64748b' }} />
                <span style={{ color: typeFilter ? '#fff' : '#64748b', fontWeight: typeFilter ? '600' : '400' }}>
                  {fieldTypes.find(t => t.value === typeFilter)?.label || 'Tất cả loại sân'}
                </span>
              </div>
              <motion.div animate={{ rotate: isTypeOpen ? 180 : 0 }}>
                <ChevronRight size={18} style={{ transform: 'rotate(90deg)', color: '#64748b' }} />
              </motion.div>
            </div>

            <AnimatePresence>
              {isTypeOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setIsTypeOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '8px',
                      zIndex: 50,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      overflow: 'hidden'
                    }}
                  >
                    {fieldTypes.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => {
                          setTypeFilter(type.value);
                          setIsTypeOpen(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          color: typeFilter === type.value ? '#F59E0B' : '#cbd5e1',
                          background: typeFilter === type.value ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                          fontSize: '14px',
                          fontWeight: typeFilter === type.value ? '700' : '500',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          if (typeFilter !== type.value) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (typeFilter !== type.value) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#cbd5e1';
                          }
                        }}
                      >
                        {type.label}
                        {typeFilter === type.value && <Zap size={14} fill="#F59E0B" />}
                      </div>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {error && <div style={{ textAlign: 'center', padding: '40px', color: '#fb7185', fontWeight: 'bold' }}>{error}</div>}

      {loading ? (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ ...glassStyle, height: '450px', animation: 'pulse 2s infinite' }}></div>)}
        </div>
      ) : fields.length > 0 ? (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '32px', justifyContent: 'center' }}>
            <AnimatePresence>
              {fields.map((field, idx) => (
                <motion.article
                  key={field.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -10 }}
                  style={{ ...glassStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ position: 'relative', height: '240px' }}>
                    <img
                      src={getImageUrl(field.images?.[0] || field.image)}
                      alt={field.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900' }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" /> 4.8
                    </div>
                    <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '24px', background: 'linear-gradient(to top, rgba(2, 44, 34, 1), transparent)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Zap size={12} fill="#F59E0B" /> {getFieldTypeLabel(field.type)}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '900', color: '#fff' }}>{field.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                      <MapPin size={16} /> {field.location}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Chỉ từ</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: '#F59E0B' }}>{formatCurrency(field.pricePerHour)}<span style={{ fontSize: '12px', color: '#64748b' }}>/h</span></p>
                      </div>
                      <Link
                        to={`/san/${field.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F59E0B', color: '#000', padding: '12px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '900', fontSize: '13px', transition: 'all 0.3s' }}
                      >
                        ĐẶT NGAY <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '48px' }}>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => loadFields(p)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: p === (pagination.currentPage || pagination.page) ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                    color: p === (pagination.currentPage || pagination.page) ? '#000' : '#fff',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#64748b' }}>
            <Trophy size={40} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '900' }}>Không tìm thấy sân bóng nào</h3>
          <p style={{ color: '#64748b' }}>Hãy thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default SearchFields;
