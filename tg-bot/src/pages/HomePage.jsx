import React, { useState, useEffect } from "react";
import Header from "../components/ui/Header";
import GameGrid from "../components/ui/GameGrid";
import NavItem from "../components/ui/NavItem";

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

export default function HomePage({ user }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const selectTab = (tab) => {
    setActiveTab(tab);

    if (tab === "home") {
      setProfileOpen(false);
      return;
    }

    if (tab === "profile") {
      setProfileOpen(true);
      return;
    }

    setProfileOpen(false);
    alert(tab === "wallet" ? "Wallet" : "Leaderboard");
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setActiveTab("home");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (profileOpen) {
      setActiveTab("profile");
    }
  }, [profileOpen]);

  return (
    <div className="w-full h-screen bg-[#0d1019] flex flex-col relative text-white overflow-hidden font-[Arial,Helvetica,sans-serif]">
      <Header
        user={user}
        profileOpen={profileOpen}
        onProfileToggle={() => setProfileOpen((open) => !open)}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-[17px] pt-[5px] pb-[90px] [scrollbar-width:thin] [scrollbar-color:#4b5360_transparent]">
        <GameGrid />
      </main>

      <nav className="absolute left-0 right-0 bottom-0 h-[64px] bg-[#111722] border-t border-[#242b39] grid grid-cols-4 z-20 pb-[env(safe-area-inset-bottom)]">
        <NavItem tab="home" label="Home" active={activeTab === "home"} onClick={selectTab}>
          ⌂
        </NavItem>

        <NavItem tab="wallet" label="Wallet" active={activeTab === "wallet"} onClick={selectTab}>
          <WalletIcon />
        </NavItem>

        <NavItem tab="profile" label="Profile" active={activeTab === "profile"} onClick={selectTab}>
          <ProfileNavIcon />
        </NavItem>

        <NavItem tab="leaderboard" label="Leaderboard" active={activeTab === "leaderboard"} onClick={selectTab}>
          <LeaderboardIcon />
        </NavItem>
      </nav>
    </div>
  );
}
