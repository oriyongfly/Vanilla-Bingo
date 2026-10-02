import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavItem from './NavItem';

function PromoIcon() {
  return (
    <span className="w-[20px] h-[20px] relative">
      <span className="absolute inset-0 border-2 border-current rounded-[3px]" />
      <span className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-current" />
      <span className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-current" />
    </span>
  );
}

function ProfileNavIcon() {
  return (
    <span className="w-[19px] h-[19px] border-2 border-current rounded-full relative">
      <span className="absolute w-[6px] h-[6px] rounded-full bg-current top-[3px] left-[4.5px]" />
      <span className="absolute w-[11px] h-[6px] rounded-[7px_7px_3px_3px] bg-current bottom-[2px] left-[2px]" />
    </span>
  );
}

function LeaderboardIcon() {
  return (
    <span className="w-[22px] h-[20px] flex items-end justify-center gap-[2px]">
      <span className="block w-[5px] h-[10px] bg-current rounded-[2px_2px_0_0]" />
      <span className="block w-[5px] h-[17px] bg-current rounded-[2px_2px_0_0]" />
      <span className="block w-[5px] h-[13px] bg-current rounded-[2px_2px_0_0]" />
    </span>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (tab) => {
    if (tab === 'home') { navigate('/'); return; }
    if (tab === 'promo') { navigate('/invite'); return; }
    if (tab === 'profile') { navigate('/profile'); return; }
    if (tab === 'leaderboard') { navigate('/leaderboard'); return; }
  };

  // Determine active tab from current path
  const path = location.pathname;
  const activeTab =
    path === '/' ? 'home' :
    path === '/invite' ? 'promo' :
    path === '/profile' ? 'profile' :
    path === '/leaderboard' ? 'leaderboard' :
    '';

  return (
    <nav className="fixed left-0 right-0 bottom-0 h-[64px] bg-[#111722] border-t border-[#242b39] grid grid-cols-4 z-20 pb-[env(safe-area-inset-bottom)]">
      <NavItem tab="home" label="Home" active={activeTab === 'home'} onClick={handleClick}>
        ⌂
      </NavItem>
      <NavItem tab="promo" label="Promo" active={activeTab === 'promo'} onClick={handleClick}>
        <PromoIcon />
      </NavItem>
      <NavItem tab="profile" label="Profile" active={activeTab === 'profile'} onClick={handleClick}>
        <ProfileNavIcon />
      </NavItem>
      <NavItem tab="leaderboard" label="Leaderboard" active={activeTab === 'leaderboard'} onClick={handleClick}>
        <LeaderboardIcon />
      </NavItem>
    </nav>
  );
}