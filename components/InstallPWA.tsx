import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      // Automatically show the prompt UI when detected
      setIsVisible(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setPromptInstall(null);
      setIsVisible(false);
    });
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!supportsPWA || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border-2 border-primary p-4 z-50 animate-bounce-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Download className="text-primary h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">앱으로 설치해보세요!</h3>
            <p className="text-sm text-gray-600">더 빠르고 편하게 어린이 신문을 볼 수 있어요.</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <button
        onClick={handleInstallClick}
        className="mt-4 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        <Download size={18} />
        지금 설치하기
      </button>
    </div>
  );
};

export default InstallPWA;