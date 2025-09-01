import React from 'react';
import Header from '../pages/Header';
import Footer from '../pages/Footer';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={onLogout} />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
