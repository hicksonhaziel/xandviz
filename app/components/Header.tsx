import React from 'react';
import { Dispatch, SetStateAction, useEffect} from "react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { Server, Sun, Moon, Box, ExternalLink } from 'lucide-react';

type VisualStatus = "pNodes_Explore" | "Network_3D" | "pNodes_Analysis";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  show3DView: boolean;
  visualStatus: "pNodes_Explore" | "Network_3D" | "pNodes_Analysis";
  setShow3DView: (value: boolean) => void;
  setVisualStatus: Dispatch<SetStateAction<VisualStatus>>;
}

const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode, 
  show3DView, 
  setShow3DView,
  setVisualStatus
}) => {

  useEffect(() => {
    if (show3DView === true ) {
      setVisualStatus("Network_3D");
    }
  }, [show3DView]);

  const cardClass = darkMode 
    ? 'bg-gray-800 bg-opacity-50 backdrop-blur-lg' 
    : 'bg-white bg-opacity-70 backdrop-blur-lg';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <motion.header 
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className={`${cardClass} border-b ${borderClass} sticky top-0 z-50`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/xandviz.png"
              alt="XANDVIZ logo"
              width={45}
              height={45}
              className='rounded-lg'
              priority
            />
            <div>
              <h1 className="text-2xl font-bold ">
                XandViz
              </h1>
              <p className={`text-xs ${mutedClass}`}>Xandeum pNode Analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShow3DView(!show3DView)}
              className={`p-2 rounded-lg ${show3DView ? 'bg-purple-600' : cardClass} hover:bg-opacity-80 transition-all`}
              title="Toggle 3D View"
            >
              <Box className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${cardClass} hover:bg-opacity-80 transition-all`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="https://docs.xandeum.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">Docs</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;