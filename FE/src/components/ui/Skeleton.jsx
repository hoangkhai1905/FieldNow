import React from 'react';
import '../../pages/public/UserFacing.css';

const Skeleton = ({ width = '100%', height = '12rem', className = '' }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

export default Skeleton;
