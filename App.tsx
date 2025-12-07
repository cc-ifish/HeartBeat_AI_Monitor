import React, { useState, useCallback } from 'react';
import { bluetoothService } from './services/bluetoothService';
import FloatingMonitor from './components/FloatingMonitor';
import { HeartRateSample, DeviceInfo } from './types';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [history, setHistory] = useState<HeartRateSample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle new incoming data
  const handleHeartRateUpdate = useCallback((bpm: number) => {
    setHistory(prev => {
      // Keep last 60 points (~1 minute if 1Hz)
      const newHistory = [...prev, { timestamp: Date.now(), bpm }];
      if (newHistory.length > 60) {
        return newHistory.slice(newHistory.length - 60);
      }
      return newHistory;
    });
  }, []);

  // Scan and Connect
  const handleScan = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const device = await bluetoothService.requestDevice();
      
      setDeviceInfo({
        id: device.id,
        name: device.name || 'Unknown Device'
      });

      await bluetoothService.connect(
        handleHeartRateUpdate, 
        () => {
          setIsConnected(false);
          setDeviceInfo(null);
          console.log("Device disconnected");
        }
      );

      setIsConnected(true);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // User cancelled the chooser
        setError("Connection cancelled.");
      } else {
        setError(err.message || "Failed to connect to device.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    bluetoothService.disconnect();
    setIsConnected(false);
    setDeviceInfo(null);
    setHistory([]);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white selection:bg-rose-500 selection:text-white">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl mix-blend-screen animate-blob filter opacity-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-2000 filter opacity-50"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-4000 filter opacity-50"></div>
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-purple-500">
            HeartBeat Monitor
          </h1>
          <p className="text-xl text-gray-400 mb-8 font-light">
            Real-time BLE Heart Rate Monitor. 
            Connect your fitness band to visualize your pulse in real-time.
          </p>

          {!isConnected ? (
            <div className="space-y-4">
              <button
                onClick={handleScan}
                disabled={isConnecting}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-rose-600 font-lg rounded-full hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                )}
                {isConnecting ? 'Searching...' : 'Scan for Devices'}
              </button>
              
              {error && (
                <div className="mt-4 p-4 bg-red-900/40 border border-red-700/50 rounded-lg text-red-200 text-sm animate-fade-in text-left whitespace-pre-wrap font-mono">
                  {error}
                </div>
              )}
              
              <div className="mt-8 text-sm text-gray-500">
                <p>Ensure your Bluetooth is ON and your device is in pairing mode.</p>
                <p className="text-xs mt-2">Compatible with Polar, Garmin, and standard BLE HR monitors.</p>
              </div>
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="inline-block p-4 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-4">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Monitoring Active
                </span>
              </div>
              <p className="text-gray-400">Check the floating window for live data.</p>
              <button 
                onClick={handleDisconnect}
                className="mt-6 text-sm text-gray-500 hover:text-white underline decoration-gray-600 underline-offset-4"
              >
                Cancel Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Monitor Component - Only shown when connected */}
      {isConnected && deviceInfo && (
        <FloatingMonitor 
          data={history} 
          deviceName={deviceInfo.name} 
          isConnected={isConnected}
          onDisconnect={handleDisconnect}
        />
      )}

    </div>
  );
};

export default App;