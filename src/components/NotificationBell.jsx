import React, { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playBeep } from '../utils/sound';

const NotificationBell = ({ pendingCount, navigateTo }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(navigateTo || '/owner/orders');
  };
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (pendingCount > 0) {
      setAnimate(true);
      const interval = setInterval(() => {
        setAnimate(prev => !prev);
        playBeep(880, 0.15, 0.2);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setAnimate(false);
    }
  }, [pendingCount]);

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      title={pendingCount > 0 ? `${pendingCount} pending orders` : 'No new orders'}
    >
      {pendingCount > 0 ? (
        <BellRing size={20} className={animate ? 'animate-bounce' : ''} />
      ) : (
        <Bell size={20} />
      )}
      {pendingCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold animate-pulse">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
