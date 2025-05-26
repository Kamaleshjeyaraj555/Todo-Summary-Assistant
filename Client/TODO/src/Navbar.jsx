import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const username = localStorage.getItem('username');

const handleLogout = () => {
  localStorage.removeItem('username');
  window.location.href = '/login';
};

const Navbar = () => {
  const location = useLocation();
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 22, color: '#2563eb', textDecoration: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
         
          </span>
          Todo Summary Assistant
        </Link>
      </div>
      <div className="navbar-right">
        {username && location.pathname === '/mytask' ? (
          <div className="user-menu" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

           
           
            <Link to="/" className="navbar-home" style={{
  marginRight: '1rem',
  color: location.pathname === '/' ? '#2563eb' : '#222',
  textDecoration: location.pathname === '/' ? 'underline' : 'none',
  fontWeight: 500,
  transition: 'color 0.2s, background 0.2s',
  borderRadius: 6,
  padding: '0.2rem 0.7rem',
  background: 'none',
  ...(location.pathname !== '/' && { ':hover': { background: '#f3f4f6', color: '#111' } })
}}>
              Home
            </Link>
            <Link to="/mytask" className="navbar-mytask" style={{
  marginRight: '1rem',
  color: location.pathname === '/mytask' ? '#2563eb' : '#222',
  textDecoration: location.pathname === '/mytask' ? 'underline' : 'none',
  fontWeight: 500,
  transition: 'color 0.2s, background 0.2s',
  borderRadius: 6,
  padding: '0.2rem 0.7rem',
  background: 'none',
  ...(location.pathname !== '/mytask' && { ':hover': { background: '#f3f4f6', color: '#111' } })
}}>
              My Task
            </Link>
            <img src={'Photos/avatar.png'} style={{width:32, height:32, borderRadius:'50%', marginLeft: 0, marginRight: 0, background: '#f3f4f6', padding: '2px'}} alt="profile" />
            <button className="user-btn" style={{marginLeft: 0, background: '#f3f4f6', color: '#222', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: 500}}>
              Hello, {username}
            </button>
            <div className="logout-dropdown">
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        ) : (
          <Link to="/" className="navbar-home" style={{
  marginRight: '1rem',
  color: location.pathname === '/' ? '#2563eb' : '#222',
  textDecoration: location.pathname === '/' ? 'underline' : 'none',
  fontWeight: 500,
  transition: 'color 0.2s, background 0.2s',
  borderRadius: 6,
  padding: '0.2rem 0.7rem',
  background: 'none',
  ...(location.pathname !== '/' && { ':hover': { background: '#f3f4f6', color: '#111' } })
}}>
            Home
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
