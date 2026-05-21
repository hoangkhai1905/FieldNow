import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Trophy,
  Zap,
  Filter,
  ArrowRight,
  Star,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, searchFields } from '../../api/endpoints';

const SearchFields = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States linked to query parameters or local
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [sortValue, setSortValue] = useState('created_at-desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Dropdown open states
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Debounced states for performance (avoid spamming query fetches)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Sync URL search params
      const params = {};
      if (searchQuery) params.location = searchQuery;
      if (typeFilter) params.type = typeFilter;
      setSearchParams(params);
      setPage(1); // Reset to page 1 on filter change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [minPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaxPrice(maxPrice);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [maxPrice]);

  const fieldTypes = [
    { value: '', label: 'Tất cả loại sân' },
    { value: 'FUTSAL', label: 'Sân bóng đá' },
    { value: 'BADMINTON', label: 'Cầu lông' },
    { value: 'BASKETBALL', label: 'Bóng rổ' },
    { value: 'VOLLEYBALL', label: 'Bóng chuyền' },
    { value: 'TENNIS', label: 'Tennis' },
  ];

  const sortOptions = [
    { value: 'created_at-desc', label: 'Sân mới nhất', sortBy: 'created_at', sortOrder: 'desc' },
    { value: 'price-asc', label: 'Giá: Thấp đến Cao', sortBy: 'price', sortOrder: 'asc' },
    { value: 'price-desc', label: 'Giá: Cao đến Thấp', sortBy: 'price', sortOrder: 'desc' },
    { value: 'name-asc', label: 'Tên: A đến Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name-desc', label: 'Tên: Z đến A', sortBy: 'name', sortOrder: 'desc' },
  ];

  const getFieldTypeLabel = (type) => {
    return fieldTypes.find(t => t.value === type)?.label || type || 'Sân thể thao';
  };

  const getSelectedSort = () => {
    return sortOptions.find(o => o.value === sortValue) || sortOptions[0];
  };

  // TanStack useQuery configuration
  const selectedSort = getSelectedSort();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'fields',
      {
        page,
        location: debouncedSearch,
        type: typeFilter,
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder,
        minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
        maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
      }
    ],
    queryFn: () => searchFields({
      page,
      limit: 12,
      location: debouncedSearch,
      type: typeFilter,
      sortBy: selectedSort.sortBy,
      sortOrder: selectedSort.sortOrder,
      minPrice: debouncedMinPrice || undefined,
      maxPrice: debouncedMaxPrice || undefined,
    }),
    placeholderData: (previousData) => previousData, // smooth transitions during pagination
  });

  const fields = data?.fields || [];
  const pagination = data?.pagination || null;

  const getImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${img}`;
  };

  const glassStyle = {
    background: 'linear-gradient(180deg, rgba(3, 28, 20, 0.96), rgba(2, 18, 13, 0.96))',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(52, 211, 153, 0.12)',
    borderRadius: '28px'
  };

  const inputStyle = {
    background: 'rgba(2, 18, 13, 0.95)',
    border: '1px solid rgba(52, 211, 153, 0.14)',
    borderRadius: '20px',
    padding: '18px 18px 18px 52px',
    color: '#fff',
    fontSize: '15px',
    minHeight: '62px',
    outline: 'none',
    width: '100%',
    transition: 'all 0.3s'
  };

  const sortInputStyle = {
    ...inputStyle,
    padding: '18px 18px 18px 52px',
    fontSize: '15px',
    minHeight: '62px',
  };

  return (
    <div className="px-4 md:px-8 py-8" style={{ color: '#fff', paddingBottom: '100px', contain: 'paint' }}>
      {/* Hero Search Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 md:mb-16"
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(245, 158, 11, 0.14)', borderRadius: '100px', border: '1px solid rgba(245, 158, 11, 0.28)', marginBottom: '24px' }}>
          <Zap size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>TÌM KIẾM SÂN THỂ THAO</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none mb-4 md:mb-6">
          Sẵn sàng <span style={{ color: '#F59E0B' }}>Ra sân?</span>
        </h1>
        <p style={{ color: '#a7f3d0', fontSize: '18px', opacity: 0.8 }} className="px-4">Khám phá hàng trăm sân bóng chất lượng cao quanh bạn.</p>

        {/* Dynamic, Fluid search and filter panel */}
        <div
          className="field-filter-panel max-w-7xl mx-auto mt-8 md:mt-12 p-4 md:p-6"
          style={{
            ...glassStyle,
            marginBottom: isTypeOpen || isSortOpen ? '220px' : '0px',
            transition: 'margin-bottom 0.2s ease',
          }}
        >
          <div className="field-filter-grid grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            
            {/* Keyword Search */}
            <div className="xl:col-span-3 relative min-w-0">
              <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#34d399' }} />
              <input
                style={inputStyle}
                placeholder="Nhập tên vị trí sân cần tìm.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sport Type Dropdown */}
            <div className="xl:col-span-3 relative min-w-0">
              <div
                onClick={() => {
                  setIsTypeOpen(!isTypeOpen);
                  setIsSortOpen(false);
                }}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minWidth: 0,
                  border: isTypeOpen ? '1px solid #F59E0B' : '1px solid rgba(52, 211, 153, 0.14)',
                  boxShadow: isTypeOpen ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <Filter size={18} style={{ color: typeFilter ? '#F59E0B' : '#34d399' }} />
                  <span className="truncate" style={{ color: typeFilter ? '#fff' : '#94a3b8', fontWeight: typeFilter ? '600' : '400', fontSize: '14px' }}>
                    {fieldTypes.find(t => t.value === typeFilter)?.label || 'Tất cả loại sân'}
                  </span>
                </div>
                <motion.div animate={{ rotate: isTypeOpen ? 180 : 0 }}>
                  <ChevronDown size={18} style={{ color: '#64748b' }} />
                </motion.div>
              </div>

              <AnimatePresence>
                {isTypeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTypeOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 p-2 z-50 rounded-2xl border border-[rgba(52,211,153,0.12)] bg-[rgba(4,18,14,0.96)] backdrop-blur-md shadow-2xl max-h-60 overflow-y-auto"
                    >
                      {fieldTypes.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => {
                            setTypeFilter(type.value);
                            setIsTypeOpen(false);
                          }}
                          className="p-3 rounded-xl cursor-pointer text-sm transition-all flex items-center justify-between"
                          style={{
                            color: typeFilter === type.value ? '#F59E0B' : '#cbd5e1',
                            background: typeFilter === type.value ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            fontWeight: typeFilter === type.value ? '700' : '500',
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

            {/* Sort Options Dropdown */}
            <div className="xl:col-span-3 relative min-w-0">
              <div
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsTypeOpen(false);
                }}
                style={{
                  ...sortInputStyle,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minWidth: 0,
                  border: isSortOpen ? '1px solid #F59E0B' : '1px solid rgba(52, 211, 153, 0.14)',
                  boxShadow: isSortOpen ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <SlidersHorizontal size={19} style={{ color: sortValue ? '#F59E0B' : '#34d399' }} />
                  <span className="truncate" style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
                    {sortOptions.find(o => o.value === sortValue)?.label || 'Sắp xếp'}
                  </span>
                </div>
                <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }}>
                  <ChevronDown size={19} style={{ color: '#64748b' }} />
                </motion.div>
              </div>

              <AnimatePresence>
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 p-2 z-50 rounded-2xl border border-[rgba(52,211,153,0.12)] bg-[rgba(4,18,14,0.96)] backdrop-blur-md shadow-2xl"
                    >
                      {sortOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            setSortValue(option.value);
                            setIsSortOpen(false);
                          }}
                          className="p-3 rounded-xl cursor-pointer text-sm transition-all flex items-center justify-between"
                          style={{
                            color: sortValue === option.value ? '#F59E0B' : '#cbd5e1',
                            background: sortValue === option.value ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            fontWeight: sortValue === option.value ? '700' : '500',
                          }}
                          onMouseEnter={(e) => {
                            if (sortValue !== option.value) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sortValue !== option.value) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#cbd5e1';
                            }
                          }}
                        >
                          {option.label}
                          {sortValue === option.value && <Zap size={14} fill="#F59E0B" />}
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Price Filter Inputs */}
            <div className="price-filter-grid xl:col-span-3 grid grid-cols-2 gap-2 min-w-0">
              <input
                style={{
                  ...inputStyle,
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: '12px',
                  minHeight: '62px'
                }}
                type="number"
                placeholder="Min VND"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                style={{
                  ...inputStyle,
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: '12px',
                  minHeight: '62px'
                }}
                type="number"
                placeholder="Max VND"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

          </div>
        </div>
      </motion.section>

      {/* Loading, Error, and Content Displays */}
      {isError && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#fb7185', fontWeight: 'bold' }}>
          {error?.message || 'Không tìm thấy sân bóng nào'}
        </div>
      )}

      {isLoading ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-center">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ ...glassStyle, height: '450px' }} className="animate-pulse"></div>
          ))}
        </div>
      ) : fields.length > 0 ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-center">
            <AnimatePresence>
              {fields.map((field, idx) => (
                <motion.article
                  key={field.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  whileHover={{ y: -8 }}
                  style={{ ...glassStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ position: 'relative', height: '240px' }} className="overflow-hidden">
                    <img
                      src={getImageUrl(field.images?.[0] || field.image)}
                      alt={field.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
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
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '900', color: '#fff', lineHeight: 1.2 }}>{field.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                      <MapPin size={16} className="text-emerald-500 flex-shrink-0" /> 
                      <span className="truncate">{field.location}</span>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Chỉ từ</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: '#F59E0B' }}>{formatCurrency(field.pricePerHour)}<span style={{ fontSize: '12px', color: '#64748b' }}>/h</span></p>
                      </div>
                      <Link
                        to={`/san/${field.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F59E0B', color: '#000', padding: '12px 20px', borderRadius: '14px', textDecoration: 'none', fontWeight: '900', fontSize: '13px', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#ffb020'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.transform = 'scale(1)'; }}
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
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: p === page ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                    color: p === page ? '#000' : '#fff',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#64748b' }}>
            <Trophy size={40} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '900' }}>Không tìm thấy sân bóng nào</h3>
          <p style={{ color: '#64748b' }} className="px-4 mt-2">Hãy thử thay đổi từ khóa, khoảng giá hoặc bộ lọc tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default SearchFields;
