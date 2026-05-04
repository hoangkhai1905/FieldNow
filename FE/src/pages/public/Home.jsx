import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, searchFields } from '../../api/endpoints';
import './UserFacing.css';
import './Home.css';

const featureCards = [
  {
    title: 'Tìm sân theo vị trí và giá',
    body: 'Lọc theo khu vực, mức giá và tình trạng sân để chọn lịch phù hợp.',
    icon: '🎯',
  },
  {
    title: 'Đặt sân nhanh, thanh toán dễ',
    body: 'Giữ chỗ trong vài bước, thanh toán an toàn để chốt lịch chơi.',
    icon: '⚡',
  },
  {
    title: 'Mỗi vai trò, một trải nghiệm',
    body: 'Người chơi, chủ sân và đội vận hành đều có luồng thao tác riêng gọn gàng.',
    icon: '👥',
  },
];

const Home = () => {
  const [featuredFields, setFeaturedFields] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await searchFields({ page: 1, limit: 4 });
        if (!mounted) return;

        setFeaturedFields(result.fields);
        setStats({ total: result.pagination?.total || result.fields.length });
      } catch {
        if (mounted) {
          setFeaturedFields([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`user-page home-page ${isVisible ? 'fade-in' : ''}`}>
      {/* Hero Section */}
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="hero-kicker stagger-fade" style={{ animationDelay: '0.1s' }}>
            FieldNow Platform
          </p>
          <h1 className="stagger-fade" style={{ animationDelay: '0.2s' }}>
            Chọn sân cỏ đẹp, đặt lịch nhanh, lên sân đúng giờ.
          </h1>
          <p className="stagger-fade" style={{ animationDelay: '0.3s' }}>
            Mọi thao tác đều tập trung vào trải nghiệm bóng đá: tìm sân, giữ chỗ, thanh toán và xác nhận lịch chơi.
          </p>

          <div className="hero-actions stagger-fade" style={{ animationDelay: '0.4s' }}>
            <Link to="/tim-san" className="primary-button btn-pulse">
              Bắt đầu tìm sân
            </Link>
            <Link to="/register" className="secondary-button">
              Tạo tài khoản
            </Link>
          </div>

          <div className="metric-grid">
            {[
              { value: stats.total, label: 'Sân đang mở đặt lịch', delay: '0.5s' },
              { value: 'VNPay', label: 'Thanh toán an toàn', delay: '0.6s' },
              { value: 'Chủ sân', label: 'Quản lý lịch sân linh hoạt', delay: '0.7s' },
            ].map((metric, idx) => (
              <article key={idx} className="metric-card stagger-fade" style={{ animationDelay: metric.delay }}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-panel">
          <div className="grass-ornament" aria-hidden="true" />
          <div className="panel-heading">
            <span>Gợi ý</span>
            <small>{loading ? 'Đang tải dữ liệu...' : 'Sân nổi bật hôm nay'}</small>
          </div>

          <div className="featured-stack">
            {featuredFields.length ? (
              featuredFields.map((field, idx) => (
                <article
                  key={field.id}
                  className="featured-card card-hover"
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                >
                  <img src={field.image} alt={field.name} />
                  <div>
                    <h3>{field.name}</h3>
                    <p>{field.location}</p>
                    <strong>{formatCurrency(field.pricePerHour)} / giờ</strong>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state compact fade-in-delayed">
                <h3>Chưa có dữ liệu nổi bật</h3>
                <p>Sân nổi bật sẽ sớm xuất hiện khi dữ liệu được cập nhật.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-shell feature-section shell-xl">
        <div className="section-heading">
          <h2 className="fade-in-up">Trải nghiệm dành cho người yêu bóng đá</h2>
          <p className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            Tập trung vào hành trình: tìm sân, chọn lịch, giữ chỗ và xác nhận thanh toán.
          </p>
        </div>

        <div className="card-grid three-up">
          {featureCards.map((card, idx) => (
            <article
              key={card.title}
              className="panel-card card-lift"
              style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
            >
              <div className="card-icon">{card.icon}</div>
              <p className="card-eyebrow">Trải nghiệm</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;