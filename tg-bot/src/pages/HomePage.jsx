import React from 'react';

const HomePage = ({ user }) => {
  const openGame = (game) => {
    console.log("Opening:", game);
    alert("Opening " + game);
  };

  // Format user data from AuthContext
  const firstName = user?.first_name || 'Guest';
  const lastName = user?.last_name || '';
  const username = user?.username || '';
  const displayName = firstName + (lastName ? ` ${lastName}` : '');
  
  // Balance and coins - default values for now (will come from DB later)
  const displayBalance = user?.balance || 'ETB 0.00';
  const displayCoins = user?.coins || '10.00';

  // Get avatar initial
  const avatarInitial = firstName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="w-full h-screen bg-[#0d1019] flex flex-col relative overflow-hidden font-sans text-white">
      
      {/* Header */}
      <header className="h-[102px] min-h-[102px] bg-[#090d17] border-b border-[#161a24] flex items-center justify-between px-[10px] py-3 z-10">
        
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
          <div className="w-[41px] h-[41px] rounded-[11px] bg-[#202940] flex items-center justify-center overflow-hidden border border-[#29334d]">
            <div className="relative w-[27px] h-[27px] flex items-center justify-center">
              <span className="text-[#ffad00] font-bold text-[14px]">{avatarInitial}</span>
            </div>
          </div>
        </div>

      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-[17px] pb-[90px] pt-[5px] scrollbar-thin scrollbar-thumb-[#4b5360] scrollbar-track-transparent">
        
        <div className="grid grid-cols-2 gap-[10px]">
          
          {/* BINGO */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('BINGO')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <polygon points="27,8 53,8 69,24 69,50 53,66 27,66 11,50 11,24" fill="#e8ebf2" stroke="#b9c0ce" strokeWidth="2.5"/>
                <circle cx="25" cy="25" r="4" fill="#ffb52a"/>
                <circle cx="48" cy="19" r="3" fill="#ffb52a"/>
                <circle cx="58" cy="32" r="4" fill="#ffb52a"/>
                <circle cx="34" cy="39" r="3" fill="#ffb52a"/>
                <circle cx="19" cy="47" r="3" fill="#ffb52a"/>
                <circle cx="48" cy="48" r="4" fill="#ffb52a"/>
                <circle cx="38" cy="55" r="3" fill="#ffb52a"/>
                <path d="M26 60 L40 29 L54 60" fill="none" stroke="#969eaf" strokeWidth="3"/>
                <line x1="32" y1="47" x2="48" y2="47" stroke="#969eaf" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">BINGO</div>
          </div>

          {/* KENO */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('KENO')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <circle cx="31" cy="26" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5"/>
                <circle cx="52" cy="25" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5"/>
                <circle cx="29" cy="51" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5"/>
                <circle cx="51" cy="51" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5"/>
                <text x="25" y="31" fill="#ed0061" fontSize="18">3</text>
                <text x="48" y="30" fill="#ed0061" fontSize="18">5</text>
                <text x="23" y="57" fill="#ed0061" fontSize="18">1</text>
                <text x="47" y="57" fill="#ed0061" fontSize="18">7</text>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">KENO</div>
          </div>

          {/* AVIATOR */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('AVIATOR')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <path d="M10 52 C24 48 30 39 42 34 C49 31 55 30 67 29 L57 38 L65 42 L49 44 L40 51 L28 53 L19 61 L15 57 Z" fill="#ed004b"/>
                <path d="M26 44 L19 35 L29 39" fill="none" stroke="#ed004b" strokeWidth="3"/>
                <path d="M37 47 L32 60 L43 50" fill="none" stroke="#ed004b" strokeWidth="3"/>
                <text x="18" y="68" fill="#ed004b" fontSize="12" fontStyle="italic" fontWeight="bold">Aviator</text>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">AVIATOR</div>
          </div>

          {/* PLINKO */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('PLINKO')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <path d="M40 8 L15 63 L65 63 Z" fill="none" stroke="#00e6df" strokeWidth="2.5"/>
                <circle cx="40" cy="13" r="5" fill="#191b25" stroke="#00e6df" strokeWidth="2.5"/>
                <circle cx="29" cy="28" r="2.5" fill="#00e6df"/>
                <circle cx="48" cy="29" r="2.5" fill="#00e6df"/>
                <circle cx="22" cy="43" r="2.5" fill="#00e6df"/>
                <circle cx="38" cy="42" r="2.5" fill="#00e6df"/>
                <circle cx="56" cy="43" r="2.5" fill="#00e6df"/>
                <circle cx="30" cy="55" r="2.5" fill="#00e6df"/>
                <circle cx="47" cy="55" r="2.5" fill="#00e6df"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">PLINKO</div>
          </div>

          {/* BALLOON */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('BALLOON')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <path d="M40 9 C22 9 13 21 13 36 C13 51 25 57 34 61 L34 69 L46 69 L46 61 C55 57 67 51 67 36 C67 21 58 9 40 9 Z" fill="none" stroke="#ad0055" strokeWidth="2.5"/>
                <path d="M40 10 C32 22 31 43 40 60 C49 43 48 22 40 10" fill="none" stroke="#ad0055" strokeWidth="2"/>
                <path d="M14 34 C25 34 32 38 40 60" fill="none" stroke="#ad0055" strokeWidth="2"/>
                <path d="M66 34 C55 34 48 38 40 60" fill="none" stroke="#ad0055" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">BALLOON</div>
          </div>

          {/* HI-LO */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('HI-LO')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <rect x="14" y="32" width="29" height="30" rx="3" fill="none" stroke="#ff9800" strokeWidth="2.5"/>
                <rect x="37" y="16" width="29" height="30" rx="3" fill="none" stroke="#ff9800" strokeWidth="2.5"/>
                <text x="24" y="53" fill="#ff9800" fontSize="19" fontWeight="bold">A</text>
                <path d="M48 29 C45 25 40 29 48 36 C56 29 51 25 48 29" fill="none" stroke="#ff9800" strokeWidth="2"/>
                <path d="M25 27 V10" stroke="#ff9800" strokeWidth="2"/>
                <path d="M20 15 L25 10 L30 15" fill="none" stroke="#ff9800" strokeWidth="2"/>
                <path d="M57 51 V69" stroke="#ff9800" strokeWidth="2"/>
                <path d="M52 64 L57 69 L62 64" fill="none" stroke="#ff9800" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">HI-LO</div>
          </div>

          {/* BINGO 75 */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('GAME 7')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <rect x="14" y="15" width="52" height="52" rx="10" fill="none" stroke="#00ad36" strokeWidth="3"/>
                <rect x="21" y="22" width="38" height="38" rx="6" fill="none" stroke="#00ad36" strokeWidth="2"/>
                <line x1="30" y1="22" x2="30" y2="60" stroke="#00ad36" strokeWidth="2"/>
                <line x1="40" y1="22" x2="40" y2="60" stroke="#00ad36" strokeWidth="2"/>
                <line x1="50" y1="22" x2="50" y2="60" stroke="#00ad36" strokeWidth="2"/>
                <line x1="21" y1="32" x2="59" y2="32" stroke="#00ad36" strokeWidth="2"/>
                <line x1="21" y1="42" x2="59" y2="42" stroke="#00ad36" strokeWidth="2"/>
                <line x1="21" y1="52" x2="59" y2="52" stroke="#00ad36" strokeWidth="2"/>
                <circle cx="57" cy="63" r="8" fill="#191b25" stroke="#00ad36" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">BINGO 75</div>
          </div>

          {/* ROULETTE */}
          <div 
            className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-xl flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.97] active:bg-[#20232f]"
            onClick={() => openGame('ROULETTE')}
          >
            <div className="h-[76px] w-full flex justify-center items-center">
              <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
                <circle cx="40" cy="40" r="27" fill="none" stroke="#00a82d" strokeWidth="3"/>
                <circle cx="40" cy="40" r="20" fill="none" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="40" cy="40" r="4" fill="none" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="40" cy="21" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="55" cy="31" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="54" cy="49" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="40" cy="59" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="25" cy="49" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
                <circle cx="25" cy="31" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] drop-shadow-[1px_1px_1px_#000]">ROULETTE</div>
          </div>

        </div>

      </main>

      {/* Bottom Bar */}
      <div className="absolute left-0 right-0 bottom-0 h-[34px] bg-[#1b2733] flex items-center justify-center text-[#c7d0db] text-[12px] z-20 border-t border-[#263544]">
        {/* Bottom bar content */}
      </div>

    </div>
  );
};

export default HomePage;