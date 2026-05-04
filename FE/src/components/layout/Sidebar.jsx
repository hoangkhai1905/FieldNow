import { Link } from 'react-router-dom';

const Sidebar = ({ title, description, links = [] }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand-block">
        <p className="eyebrow">FieldNow</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <nav className="sidebar-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="sidebar-link">
            <span>{link.label}</span>
            <small>{link.meta}</small>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;