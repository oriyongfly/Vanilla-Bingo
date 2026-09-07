import React from 'react';

const NavItem = ({
  icon,
  label,
  tab,
  activeTab,
  onSelect,
}) => {
  const isActive = activeTab === tab;

  const renderIcon = () => {
    if (icon === 'wallet') {
      return (
        <span className="nav-icon w-[22px] h-[16px] border-2 border-current rounded-[4px] relative inline-block">
          <span className="absolute w-[7px] h-[5px] border-2 border-current border-r-0 -right-[2px] top-[4px] rounded-l-[3px]" />
        </span>
      );
    }

    if (icon === 'profile') {
      return (
        <span className="nav-icon w-[19px] h-[19px] border-2 border-current rounded-full relative inline-block">
          <span className="absolute w-[6px] h-[6px] rounded-full bg-current top-[3px] left-[4.5px]" />
          <span className="absolute w-[11px] h-[6px] rounded-[7px_7px_3px_3px] bg-current bottom-[2px] left-[2px]" />
        </span>
      );
    }

    if (icon === 'leaderboard') {
      return (
        <span className="nav-icon w-[22px] h-[20px] flex items-end justify-center gap-[2px]">
          <span className="block w-[5px] bg-current rounded-t-[2px] h-[10px]" />
          <span className="block w-[5px] bg-current rounded-t-[2px] h-[17px]" />
          <span className="block w-[5px] bg-current rounded-t-[2px] h-[13px]" />
        </span>
      );
    }

    return <span className="nav-icon text-[23px] leading-none">{icon}</span>;
  };

  return (
    <button
      className={`nav-item border-none outline-none bg-transparent text-[#737b8e] flex flex-col items-center justify-center gap-[4px] text-[10px] font-bold cursor-pointer transition-colors duration-200 active:scale-[0.92] ${
        isActive ? 'text-[#ffad00]' : ''
      }`}
      onClick={() => onSelect(tab)}
      aria-label={label}
    >
      {renderIcon()}
      <span>{label}</span>
    </button>
  );
};

export default NavItem;
