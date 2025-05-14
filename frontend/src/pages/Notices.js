import React from 'react';
import Header from '../components/common/Header';

const Notices = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 mt-20">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold mb-4">Bildirimler</h1>
          <p className="text-gray-600">
            Henüz okunmamış bildiriminiz bulunmamaktadır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notices; 