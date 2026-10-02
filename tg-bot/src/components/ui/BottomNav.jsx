import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavItem from './NavItem';

function WalletIcon() {
  return (
    <span className="w-[22px] h-[16px] border-2 border-current rounded-[4px] relative after:content-[''] after:absolute after:w-[7px] after:h-[5px] after:border-2 after:border-current after:border-r-0 after:right-[-2px] after:top-[4px] after:rounded-[3px_0_0_3px]" />
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
    if (tab === 'profile') { navigate('/profile'); return; }
    // wallet and leaderboard are placeholders
    alert(tab === 'wallet' ? 'Wallet coming soon' : 'Leaderboard coming soon');
  };

  // Determine active tab from current path
  const path = location.pathname;
  const activeTab =
    path === '/' ? 'home' :
    path === '/profile' ? 'profile' :
    path === '/wallet' ? 'wallet' :
    path === '/leaderboard' ? 'leaderboard' :
    '';

  return (
    <nav className="fixed left-0 right-0 bottom-0 h-[64px] bg-[#111722] border-t border-[#242b39] grid grid-cols-4 z-20 pb-[env(safe-area-inset-bottom)]">
      <NavItem tab="home" label="Home" active={activeTab === 'home'} onClick={handleClick}>
        ⌂
      </NavItem>
      <NavItem tab="wallet" label="Wallet" active={activeTab === 'wallet'} onClick={handleClick}>
        <WalletIcon />
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
