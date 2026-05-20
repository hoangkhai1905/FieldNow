import React from 'react';
import { motion } from 'framer-motion';

const logoImg = '/logo.png';

const Logo = ({ 
  size = 40, 
  showText = false, 
  textVariant = 'navbar', // 'navbar' | 'auth' | 'sidebar' | 'footer'
  animate = true,
  style = {}
}) => {
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: textVariant === 'navbar' ? '16px' : '12px',
    textDecoration: 'none',
    ...style
  };

  const imageContainerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: size > 40 ? '14px' : '10px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    background: '#022c22',
    flexShrink: 0
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const renderText = () => {
    if (!showText) return null;

    if (textVariant === 'navbar') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <h1 style={{ 
            margin: 0, 
            color: '#fff', 
            fontSize: '24px', 
            fontWeight: '950', 
            letterSpacing: '-1px', 
            textTransform: 'uppercase', 
            lineHeight: 1 
          }}>
            Field<span style={{ color: '#F59E0B' }}>Now</span>
          </h1>
          <span style={{ 
            fontSize: '11px', 
            color: '#F59E0B', 
            fontWeight: '900', 
            textTransform: 'uppercase', 
            letterSpacing: '3px', 
            opacity: 0.8,
            marginTop: '2px'
          }}>
            PLATFORM
          </span>
        </div>
      );
    }

    if (textVariant === 'auth') {
      return (
        <span style={{ 
          color: '#fff', 
          fontSize: '24px', 
          fontWeight: '950', 
          letterSpacing: '-1px',
          textTransform: 'uppercase'
        }}>
          Field<span style={{ color: '#F59E0B' }}>Now</span>
        </span>
      );
    }

    if (textVariant === 'sidebar') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: '950', 
            color: '#fff', 
            margin: 0, 
            letterSpacing: '-0.5px',
            textTransform: 'uppercase',
            lineHeight: 1
          }}>
            Field<span style={{ color: '#F59E0B' }}>Now</span>
          </h2>
          <span style={{ 
            fontSize: '10px', 
            color: '#a7f3d0', 
            fontWeight: '800', 
            opacity: 0.7,
            letterSpacing: '1px',
            marginTop: '2px'
          }}>
            OWNER PORTAL
          </span>
        </div>
      );
    }

    // Default text styling
    return (
      <span style={{ color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>
        Field<span style={{ color: '#F59E0B' }}>Now</span>
      </span>
    );
  };

  if (animate) {
    return (
      <div style={containerStyle}>
        <motion.div 
          style={imageContainerStyle}
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <img src={logoImg} alt="FieldNow Logo" style={imageStyle} />
        </motion.div>
        {renderText()}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={imageContainerStyle}>
        <img src={logoImg} alt="FieldNow Logo" style={imageStyle} />
      </div>
      {renderText()}
    </div>
  );
};

export default Logo;
