import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, searchFields } from '../../api/endpoints';
import './UserFacing.css';
import Skeleton from '../../components/ui/Skeleton';

const SearchFields = () => {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
  });
  const [fields, setFields] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFields = async (nextPage = 1, nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const result = await searchFields({
        location: nextFilters.location || undefined,
        minPrice: nextFilters.minPrice || undefined,
        maxPrice: nextFilters.maxPrice || undefined,
        page: nextPage,
        limit: 8,
      });

      setFields(result.fields);
      setPagination(result.pagination);
      setPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Không tải được danh sách sân');
      setFields([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFields(1);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadFields(1, filters);
  };

  const handleReset = async () => {
    const resetFilters = { location: '', minPrice: '', maxPrice: '' };
    setFilters(resetFilters);
    await loadFields(1, resetFilters);
  };

  return (
    <div className="user-page shell-xl">
      <section className="search-hero elevated">
        <p className="hero-kicker">Chọn sân theo gu</p>
        <h1>Đặt sân bóng nhanh, lọc theo vị trí và khoảng giá.</h1>
        <p>Tìm sân phù hợp khu vực, giờ chơi và mức giá bạn mong muốn.</p>
      </section>

      <form className="filter-panel" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Vị trí</span>
          <input
            type="text"
            value={filters.location}
            onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
            placeholder="Ví dụ: Hà Nội, Thủ Đức..."
          />
        </label>

        <label className="form-field">
          <span>Giá tối thiểu</span>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
            placeholder="0"
          />
        </label>

        <label className="form-field">
          <span>Giá tối đa</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
            placeholder="1500000"
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit">Tìm sân</button>
          <button className="secondary-button" type="button" onClick={handleReset}>Làm mới</button>
        </div>
      </form>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="row-between results-header">
        <div>
          <h2>Kết quả tìm kiếm</h2>
          <p className="muted">{pagination ? `${pagination.total} sân phù hợp` : 'Đang chờ kết quả'}</p>
        </div>

        <p className="muted">Trang {page}</p>
      </div>

      <section className="field-grid" aria-live="polite">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <article key={`skeleton-${i}`} className="field-card">
              <Skeleton height="160px" />
              <div className="field-card-body">
                <Skeleton height="18px" className="skeleton-line" />
                <div style={{ height: 8 }} />
                <Skeleton height="14px" className="skeleton-line" />
                <div style={{ height: 8 }} />
                <Skeleton height="14px" className="skeleton-line" />
              </div>
            </article>
          ))
        ) : fields.length ? (
          fields.map((field) => (
            <article key={field.id} className="field-card elevated-card">
              <img src={field.image} alt={field.name} />
              <div className="field-card-body">
                <h3>{field.name}</h3>
                <p className="muted">{field.location}</p>
                <p className="muted">{field.isActive ? 'Đang mở đặt sân' : 'Chưa hoạt động'}</p>
                <p className="price">{formatCurrency(field.pricePerHour)} / giờ</p>
                <Link className="btn-main" to={`/san/${field.id}`}>
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>Không có sân phù hợp</h3>
            <p>Thử thay đổi vị trí hoặc khoảng giá để mở rộng kết quả.</p>
          </div>
        )}
      </section>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            disabled={page <= 1}
            onClick={() => loadFields(page - 1)}
          >
            Trang trước
          </button>
          <span>
            {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={page >= pagination.totalPages}
            onClick={() => loadFields(page + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchFields;
