// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header className="bg-gray-100 p-4 mb-6 shadow-sm">
    <div className="max-w-5xl mx-auto">
      <Link to="/" className="text-2xl font-bold text-blue-600 hover:underline">
        Галерея Мемов
      </Link>
    </div>
  </header>
);

export default Header;
