import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../common/Header.js';
import { Footer } from '../common/Footer.js';
import { ScrollProgressBar } from '../common/ScrollProgressBar.js';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative overflow-x-hidden w-full">
      <ScrollProgressBar />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
