'use client';

import { useAppContext } from '@/app/context/AppContext';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function NewPage() {
  const {
    darkMode,
    setDarkMode,
    show3DView,
    setShow3DView,
    visualStatus,
    setVisualStatus,
  } = useAppContext();

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <Header 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        show3DView={show3DView}
        visualStatus={visualStatus}
        setShow3DView={setShow3DView}
        setVisualStatus={setVisualStatus}
      />
      
      <div className="container mx-auto px-4 py-8">
        <h1>New Page - Dark mode is {darkMode ? 'ON' : 'OFF'}</h1>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}