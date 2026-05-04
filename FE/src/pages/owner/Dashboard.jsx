import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerFields, formatCurrency } from '../../api/endpoints';

const Dashboard = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getOwnerFields();
        if (mounted) setFields(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const activeFields = fields.filter((field) => field.isActive).length;
  const pendingFields = fields.length - activeFields;

  return (
    <div className="dashboard-content">
      <section className="dashboard-hero">
        <p className="hero-kicker">Owner dashboard</p>
        <h1>Điều khiển sân của bạn từ dữ liệu thật</h1>
        <p>
          Trang này đọc /owner/fields để theo dõi số sân, trạng thái duyệt và giá niêm yết. Từ đây bạn đi vào màn tạo hoặc chỉnh sửa sân.
        </p>
        <div className="hero-actions">
          <Link to="/owner/fields" className="primary-button">Quản lý sân</Link>
          <Link to="/tim-san" className="secondary-button">Xem public search</Link>
        </div>
      </section>

      <div className="metric-grid dashboard-metrics">
        <article>
          <strong>{loading ? '...' : fields.length}</strong>
          <span>Tổng sân</span>
        </article>
        <article>
          <strong>{loading ? '...' : activeFields}</strong>
          <span>Đã active</span>
        </article>
        <article>
          <strong>{loading ? '...' : pendingFields}</strong>
          <span>Chờ duyệt</span>
        </article>
      </div>

      <section className="section-shell">
        <div className="section-heading">
          <h2>Sân gần đây</h2>
          <p>{loading ? 'Đang tải...' : 'Danh sách từ backend owner endpoints.'}</p>
        </div>

        <div className="card-grid two-up">
          {fields.slice(0, 2).map((field) => (
            <article className="panel-card" key={field.id}>
              <p className="card-eyebrow">{field.isActive ? 'Active' : 'Pending'}</p>
              <h3>{field.name}</h3>
              <p>{field.location}</p>
              <strong>{formatCurrency(field.pricePerHour)} / giờ</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;