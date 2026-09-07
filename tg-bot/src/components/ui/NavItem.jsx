import React from "react";

export default function NavItem({
  tab,
  label,
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      data-tab={tab}
      onClick={() => onClick(tab)}
      className={`border-none outline-none bg-transparent ${
        active ? "text-[#ffad00]" : "text-[#737b8e]"
      } flex flex-col items-center justify-center gap-[4px] text-[10px] font-bold cursor-pointer transition-[color,transform] duration-200 ease active:scale-[0.92]`}
    >
      <span className="w-[24px] h-[24px] flex items-center justify-center text-[23px] leading-none">
        {children}
      </span>

      <span>{label}</span>
    </button>
  );
}