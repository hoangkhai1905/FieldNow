import { useEffect, useMemo, useState } from 'react';
import { getAdminUsers, updateUserRole } from '../../api/endpoints';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (requestError) {
      setError(requestError.message || 'Không tải được danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const roleStats = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        accumulator[user.role] = (accumulator[user.role] || 0) + 1;
        return accumulator;
      },
      { USER: 0, OWNER: 0, ADMIN: 0 }
    );
  }, [users]);

  const handleRoleChange = async (userId, role) => {
    setMessage('');
    setError('');

    try {
      await updateUserRole(userId, role);
      setMessage(`Đã đổi role của ${userId} thành ${role}.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message || 'Không cập nhật được role');
    }
  };

  return (
    <div className="dashboard-content">
      <section className="dashboard-hero">
        <p className="hero-kicker">User management</p>
        <h1>Quản lý người dùng và phân quyền theo endpoint admin.</h1>
        <p>Danh sách này gọi /admin/users và cho phép đổi role bằng /admin/users/:id/role.</p>
      </section>

      {message && <div className="notice notice-success">{message}</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="metric-grid dashboard-metrics">
        <article><strong>{roleStats.USER}</strong><span>USER</span></article>
        <article><strong>{roleStats.OWNER}</strong><span>OWNER</span></article>
        <article><strong>{roleStats.ADMIN}</strong><span>ADMIN</span></article>
      </div>

      <section className="section-shell">
        <div className="section-heading">
          <h2>Người dùng</h2>
          <p>{loading ? 'Đang tải...' : `${users.length} tài khoản`}</p>
        </div>

        <div className="table-wrap">
          <table className="booking-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Role</th>
                <th>Số điện thoại</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName || user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.phoneNumber || 'Chưa cập nhật'}</td>
                  <td>
                    <div className="table-actions">
                      <select
                        defaultValue={user.role}
                        onChange={(event) => handleRoleChange(user.id, event.target.value)}
                      >
                        <option value="USER">USER</option>
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UserManagement;