import React from "react";
import GameGrid from "../components/ui/GameGrid";

export default function HomePage({ user }) {
  return (
    <div className="w-full h-screen bg-[#0d1019] flex flex-col relative text-white overflow-hidden font-[Arial,Helvetica,sans-serif]">
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-[17px] pt-[5px] pb-[90px] [scrollbar-width:thin] [scrollbar-color:#4b5360_transparent]">
        <GameGrid />
      </main>
    </div>
  );
}