import React from "react";

export default function Header({ user, profileOpen, onProfileToggle }) {
  const firstName = user?.first_name || "Guest";
  const phone = user?.phone || "No phone number";
  const balance = user?.balance || "ETB 0.00";
  const coins = user?.coins || "10.00";
  const avatarInitial = firstName.charAt(0).toUpperCase();

  return (
    <header
      className={[
        "relative z-10 h-[102px] min-h-[102px] overflow-hidden",
        "border-b border-[#161a24] bg-[#090d17]",
        "px-[14px] pt-[12px] pb-[8px]",
      ].join(" ")}
    >
      <div className="relative z-[4] flex h-full w-full items-center justify-between">
        {/* LOGO */}
        <div className="relative z-[8] flex h-[76px] min-w-[76px] w-[76px] items-center justify-center bg-[#090d17]">
          <div className="relative text-center font-black leading-[0.9] -rotate-2">
            <div className="absolute left-[25px] top-[-18px] h-[25px] w-[25px] rounded-full border-[3px] border-[#ffc000]">
              <span className="absolute left-[6px] top-[6px] h-[7px] w-[7px] rounded-full bg-[#4c2a94]" />
            </div>

            <div className="text-[18px] tracking-[-1px] text-[#f4a900]">
              FETAN
            </div>

            <div className="text-[18px] tracking-[-1px] text-[#ffad00]">
              BINGO
            </div>
          </div>
        </div>

        {/* BALANCE + PROFILE BUTTON */}
        <div
          className={[
            "relative z-[6] ml-auto mr-[10px] flex items-center gap-[7px]",
            profileOpen ? "invisible pointer-events-none" : "",
          ].join(" ")}
        >
          <div className="flex h-[27px] items-center whitespace-nowrap rounded-[20px] bg-gradient-to-r from-[#ffad00] to-[#ffbd18] px-3 text-[11px] font-extrabold text-[#090b10] shadow-[0_2px_8px_rgba(255,174,0,0.15)]">
            {balance}
            <span className="mx-[3px]">|</span>
            Coins {coins}
          </div>

          <button
            type="button"
            aria-label="Profile"
            aria-expanded={profileOpen}
            onClick={onProfileToggle}
            className="relative z-[9] flex h-[41px] min-w-[41px] w-[41px] cursor-pointer items-center justify-center overflow-hidden rounded-[11px] border border-[#29334d] bg-[#202940] transition-[width,border-radius,background] duration-[280ms] ease-in-out hover:bg-[#2a3452]"
          >
            <div className="relative h-[27px] w-[27px] shrink-0">
              <span className="absolute left-[9px] top-[1px] h-[10px] w-[10px] rounded-full bg-[#5d3195]" />
              <span className="absolute bottom-[2px] left-[2px] h-[13px] w-[23px] rounded-[50%_50%_8px_8px] bg-[#583087]" />
            </div>
          </button>
        </div>
      </div>

      {/* EXPANDED PROFILE */}
      <div
        className={[
          "absolute right-[14px] top-0 z-[5]",
          "flex h-full w-[calc(100%-100px)] items-center gap-3",
          "bg-[#090d17] px-3 py-[10px]",
          "transition-[transform,opacity,visibility] duration-[280ms] ease-in-out",
          profileOpen
            ? "visible translate-x-0 opacity-100 pointer-events-auto"
            : "invisible translate-x-5 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Avatar */}
        <div className="flex h-[52px] min-w-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-[#5d3195] to-[#7b44b8] text-[20px] font-extrabold text-white">
          {avatarInitial}
        </div>

        {/* User info */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-extrabold text-white">
            {firstName}
          </div>

          <div className="mt-[3px] whitespace-nowrap text-[12px] text-[#8b92a8]">
            {phone}
          </div>
        </div>

        {/* Account */}
        <div className="min-w-[92px] text-right">
          <div className="text-[9px] font-bold uppercase text-[#777f93]">
            Balance
          </div>

          <div className="mt-[2px] text-[12px] font-extrabold text-[#ffad00]">
            {balance}
          </div>

          <div className="mt-[5px] text-[9px] font-bold uppercase text-[#777f93]">
            Coins
          </div>

          <div className="mt-[2px] text-[12px] font-extrabold text-[#ffad00]">
            {coins}
          </div>
        </div>
      </div>
    </header>
  );
}
