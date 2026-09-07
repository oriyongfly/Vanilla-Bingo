import React, { useState, useEffect } from 'react';
import GameCard from '../components/ui/GameCard';
import NavItem from '../components/ui/NavItem';

const HomePage = ({ user }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const openGame = (game) => {
    console.log("Opening:", game);
    alert("Opening " + game);
  };

  const toggleProfile = () => {
    setProfileOpen((prev) => !prev);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  const selectTab = (tab) => {
    setActiveTab(tab);

    if (tab === 'profile') {
      setProfileOpen(true);
    } else {
      setProfileOpen(false);
    }

    if (tab === 'wallet') {
      alert('Wallet');
    } else if (tab === 'leaderboard') {
      alert('Leaderboard');
    }
  };

  // close profile on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeProfile();
        setActiveTab('home');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // sync profile tab when profile is closed from header button
  useEffect(() => {
    if (!profileOpen && activeTab === 'profile') {
      setActiveTab('home');
    }
  }, [profileOpen, activeTab]);

  // Format user data from AuthContext
  const firstName = user?.first_name || 'Guest';
  
  // Balance and coins - default values for now (will come from DB later)
  const displayBalance = user?.balance || 'ETB 0.00';
  const displayCoins = user?.coins || '10.00';

  // Get avatar initial
  const avatarInitial = firstName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="w-full h-screen bg-[#0d1019] flex flex-col relative overflow-hidden font-sans text-white">
      
      {/* Header */}
      <header
        className={`h-[102px] min-h-[102px] bg-[#090d17] border-b border-[#161a24] relative z-10 overflow-hidden px-[10px] py-3 ${
          profileOpen ? 'profile-open' : ''
        }`}
      >
        
        {/* Logo */}
        <div className="w-[76px] h-[76px] flex items-center justify-center">
          <div className="relative text-center font-black leading-[0.9] -rotate-[2deg]">
            <div className="absolute w-[25px] h-[25px] border-[3px] border-[#ffc000] rounded-full -top-[18px] left-[25px]">
              <div className="absolute w-[7px] h-[7px] bg-[#4c2a94] rounded-full left-[6px] top-[6px]"></div>
            </div>
            <div className="text-[#f4a900] text-[18px] tracking-[-1px]">FETAN</div>
            <div className="text-[#ffad00] text-[18px] tracking-[-1px]">BINGO</div>
          </div>
        </div>

        {/* Balance & Profile */}
        <div className="flex items-center gap-[7px] ml-auto mr-[10px]">
          <div className="h-[27px] px-3 rounded-[20px] bg-gradient-to-r from-[#ffad00] to-[#ffbd18] text-[#090b10] text-[11px] font-extrabold flex items-center whitespace-nowrap shadow-[0_2px_8px_rgba(255,174,0,0.15)]">
            {displayBalance}
            <span className="mx-[3px]">|</span>
            Coins {displayCoins}
          </div>
          <button
            className="profile-btn w-[41px] min-w-[41px] h-[41px] rounded-[11px] bg-[#202940] flex items-center justify-center overflow-hidden border border-[#29334d] hover:bg-[#2a3452] transition-all duration-200 cursor-pointer relative z-30"
            onClick={toggleProfile}
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            <div className="profile-icon relative w-[27px] h-[27px] flex-shrink-0">
              <div className="absolute w-[10px] h-[10px] rounded-full bg-[#5d3195] top-[1px] left-[9px]" />
              <div className="absolute w-[23px] h-[13px] rounded-[50%_50%_8px_8px] bg-[#583087] bottom-[2px] left-[2px]" />
            </div>
          </button>
        </div>

        {/* Expanded Profile */}
        <div
          className={`profile-info absolute top-0 right-[14px] w-[calc(100%-100px)] h-full bg-[#090d17] flex items-center gap-3 px-3 py-2.5 z-10 transition-all duration-300 ease-out ${
            profileOpen
              ? 'opacity-100 visible pointer-events-auto translate-x-0'
              : 'opacity-0 invisible pointer-events-none translate-x-5'
          }`}
        >
          <div className="header-avatar w-[52px] min-w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#5d3195] to-[#7b44b8] flex items-center justify-center text-[20px] font-extrabold text-white">
            {avatarInitial}
          </div>
          <div className="header-user min-w-0 flex-1">
            <div className="header-name text-white text-[16px] font-extrabold truncate">
              {firstName}
            </div>
            <div className="header-phone text-[#8b92a8] text-[12px] mt-[3px] truncate">
              {user?.phone || 'No phone number'}
            </div>
          </div>
          <div className="header-account min-w-[92px] text-right">
            <div className="header-account-label text-[#777f93] text-[9px] font-bold uppercase">
              Balance
            </div>
            <div className="header-account-value text-[#ffad00] text-[12px] font-extrabold mt-[2px]">
              {displayBalance}
            </div>
            <div className="header-account-label text-[#777f93] text-[9px] font-bold uppercase mt-[5px]">
              Coins
            </div>
            <div className="header-account-value text-[#ffad00] text-[12px] font-extrabold mt-[2px]">
              {displayCoins}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-[17px] pb-[90px] pt-[5px] scrollbar-thin scrollbar-thumb-[#4b5360] scrollbar-track-transparent">
        
        <div className="grid grid-cols-2 gap-[10px]">
          <GameCard name="BINGO" onClick={() => openGame('BINGO')} />
          <GameCard name="KENO" onClick={() => openGame('KENO')} />
          <GameCard name="AVIATOR" onClick={() => openGame('AVIATOR')} />
          <GameCard name="PLINKO" onClick={() => openGame('PLINKO')} />
          <GameCard name="BALLOON" onClick={() => openGame('BALLOON')} />
          <GameCard name="HI-LO" onClick={() => openGame('HI-LO')} />
          <GameCard name="BINGO 75" onClick={() => openGame('GAME 7')} />
          <GameCard name="ROULETTE" onClick={() => openGame('ROULETTE')} />
        </div>

      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav absolute left-0 right-0 bottom-0 h-[64px] bg-[#111722] border-t border-[#242b39] grid grid-cols-4 z-30 pb-[env(safe-area-inset-bottom)]">
        <NavItem icon="⌂" label="Home" tab="home" activeTab={activeTab} onSelect={selectTab} />
        <NavItem icon="wallet" label="Wallet" tab="wallet" activeTab={activeTab} onSelect={selectTab} />
        <NavItem icon="profile" label="Profile" tab="profile" activeTab={activeTab} onSelect={selectTab} />
        <NavItem icon="leaderboard" label="Leaderboard" tab="leaderboard" activeTab={activeTab} onSelect={selectTab} />
      </nav>

    </div>
  );
};


export default HomePage;