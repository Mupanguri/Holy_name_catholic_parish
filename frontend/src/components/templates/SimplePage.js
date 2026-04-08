import React from 'react';

/**
 * SimplePage Template
 * Use for: Basic pages without parchment styling (Events, Contact, Gallery, etc.)
 * Features: Clean layout, centered content, page title
 */
export const SimplePage = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`min-h-screen py-10 px-5 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B3A6B] mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
};

export default SimplePage;
