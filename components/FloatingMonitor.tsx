import React, { useState, useEffect, useRef } from 'react';
import { HeartRateSample } from '../types';
import { LineChart, Line, YAxis, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface FloatingMonitorProps {
  data: HeartRateSample[];
  deviceName: string;
  isConnected: boolean;
  onDisconnect: () => void;
}

const FloatingMonitor: React.FC<FloatingMonitorProps> = ({ 
  data, 
  deviceName, 
  isConnected,
  onDisconnect 
}) => {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const currentBPM = data.length > 0 ? data[data.length - 1].bpm : '--';
  const windowRef = useRef<HTMLDivElement>(null);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={windowRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 50
      }}
      className={`
        w-80 backdrop-blur-md bg-gray-900/80 border border-gray-700 
        rounded-2xl shadow-2xl overflow-hidden transition-shadow duration-200
        ${isDragging ? 'shadow-purple-500/20 cursor-grabbing' : 'cursor-default'}
      `}
    >
      {/* Header / Drag Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-10 bg-gray-800/50 flex items-center justify-between px-4 cursor-grab border-b border-gray-700 select-none"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{deviceName || 'Unknown Device'}</span>
        </div>
        <button 
          onClick={onDisconnect}
          className="text-gray-400 hover:text-white transition-colors"
          title="Disconnect"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm font-medium">Heart Rate</p>
            <div className="flex items-baseline space-x-1">
              <span className={`text-5xl font-bold text-white tracking-tighter ${data.length > 0 ? 'animate-pulse' : ''}`}>
                {currentBPM}
              </span>
              <span className="text-gray-500 font-medium">BPM</span>
            </div>
          </div>
          
          {/* Visual Heart Icon */}
          <div className="relative">
             <svg 
              className={`w-12 h-12 text-rose-500 transition-transform duration-100 ${data.length > 0 ? 'animate-pulse-fast' : 'opacity-50'}`} 
              fill="currentColor" viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>

        {/* Chart */}
        <div className="h-32 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <defs>
                <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <XAxis dataKey="timestamp" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#f43f5e' }}
                labelStyle={{ display: 'none' }}
                formatter={(value) => [`${value} BPM`]}
              />
              <Line 
                type="monotone" 
                dataKey="bpm" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FloatingMonitor;