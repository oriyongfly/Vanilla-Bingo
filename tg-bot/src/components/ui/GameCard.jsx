import React from "react";

function BingoIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <polygon
        points="27,8 53,8 69,24 69,50 53,66 27,66 11,50 11,24"
        fill="#e8ebf2"
        stroke="#b9c0ce"
        strokeWidth="2.5"
      />

      <circle cx="25" cy="25" r="4" fill="#ffb52a" />
      <circle cx="48" cy="19" r="3" fill="#ffb52a" />
      <circle cx="58" cy="32" r="4" fill="#ffb52a" />
      <circle cx="34" cy="39" r="3" fill="#ffb52a" />
      <circle cx="19" cy="47" r="3" fill="#ffb52a" />
      <circle cx="48" cy="48" r="4" fill="#ffb52a" />
      <circle cx="38" cy="55" r="3" fill="#ffb52a" />

      <path
        d="M26 60 L40 29 L54 60"
        fill="none"
        stroke="#969eaf"
        strokeWidth="3"
      />

      <line
        x1="32"
        y1="47"
        x2="48"
        y2="47"
        stroke="#969eaf"
        strokeWidth="2"
      />
    </svg>
  );
}

function KenoIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <circle cx="31" cy="26" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5" />
      <circle cx="52" cy="25" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5" />
      <circle cx="29" cy="51" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5" />
      <circle cx="51" cy="51" r="17" fill="none" stroke="#ed0061" strokeWidth="2.5" />

      <text x="25" y="31" fill="#ed0061" fontSize="18">3</text>
      <text x="48" y="30" fill="#ed0061" fontSize="18">5</text>
      <text x="23" y="57" fill="#ed0061" fontSize="18">1</text>
      <text x="47" y="57" fill="#ed0061" fontSize="18">7</text>
    </svg>
  );
}

function AviatorIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <path
        d="M10 52 C24 48 30 39 42 34 C49 31 55 30 67 29 L57 38 L65 42 L49 44 L40 51 L28 53 L19 61 L15 57 Z"
        fill="#ed004b"
      />

      <path
        d="M26 44 L19 35 L29 39"
        fill="none"
        stroke="#ed004b"
        strokeWidth="3"
      />

      <path
        d="M37 47 L32 60 L43 50"
        fill="none"
        stroke="#ed004b"
        strokeWidth="3"
      />

      <text
        x="18"
        y="68"
        fill="#ed004b"
        fontSize="12"
        fontStyle="italic"
        fontWeight="bold"
      >
        Aviator
      </text>
    </svg>
  );
}

function PlinkoIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <path
        d="M40 8 L15 63 L65 63 Z"
        fill="none"
        stroke="#00e6df"
        strokeWidth="2.5"
      />

      <circle
        cx="40"
        cy="13"
        r="5"
        fill="#191b25"
        stroke="#00e6df"
        strokeWidth="2.5"
      />

      <circle cx="29" cy="28" r="2.5" fill="#00e6df" />
      <circle cx="48" cy="29" r="2.5" fill="#00e6df" />
      <circle cx="22" cy="43" r="2.5" fill="#00e6df" />
      <circle cx="38" cy="42" r="2.5" fill="#00e6df" />
      <circle cx="56" cy="43" r="2.5" fill="#00e6df" />
      <circle cx="30" cy="55" r="2.5" fill="#00e6df" />
      <circle cx="47" cy="55" r="2.5" fill="#00e6df" />
    </svg>
  );
}

function BalloonIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <path
        d="M40 9 C22 9 13 21 13 36 C13 51 25 57 34 61 L34 69 L46 69 L46 61 C55 57 67 51 67 36 C67 21 58 9 40 9 Z"
        fill="none"
        stroke="#ad0055"
        strokeWidth="2.5"
      />

      <path
        d="M40 10 C32 22 31 43 40 60 C49 43 48 22 40 10"
        fill="none"
        stroke="#ad0055"
        strokeWidth="2"
      />

      <path
        d="M14 34 C25 34 32 38 40 60"
        fill="none"
        stroke="#ad0055"
        strokeWidth="2"
      />

      <path
        d="M66 34 C55 34 48 38 40 60"
        fill="none"
        stroke="#ad0055"
        strokeWidth="2"
      />
    </svg>
  );
}

function HiLoIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <rect
        x="14"
        y="32"
        width="29"
        height="30"
        rx="3"
        fill="none"
        stroke="#ff9800"
        strokeWidth="2.5"
      />

      <rect
        x="37"
        y="16"
        width="29"
        height="30"
        rx="3"
        fill="none"
        stroke="#ff9800"
        strokeWidth="2.5"
      />

      <text x="24" y="53" fill="#ff9800" fontSize="19" fontWeight="bold">
        A
      </text>

      <path
        d="M48 29 C45 25 40 29 48 36 C56 29 51 25 48 29"
        fill="none"
        stroke="#ff9800"
        strokeWidth="2"
      />

      <path d="M25 27 V10" stroke="#ff9800" strokeWidth="2" />

      <path
        d="M20 15 L25 10 L30 15"
        fill="none"
        stroke="#ff9800"
        strokeWidth="2"
      />

      <path d="M57 51 V69" stroke="#ff9800" strokeWidth="2" />

      <path
        d="M52 64 L57 69 L62 64"
        fill="none"
        stroke="#ff9800"
        strokeWidth="2"
      />
    </svg>
  );
}

function Bingo75Icon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <rect
        x="14"
        y="15"
        width="52"
        height="52"
        rx="10"
        fill="none"
        stroke="#00ad36"
        strokeWidth="3"
      />

      <rect
        x="21"
        y="22"
        width="38"
        height="38"
        rx="6"
        fill="none"
        stroke="#00ad36"
        strokeWidth="2"
      />

      <line x1="30" y1="22" x2="30" y2="60" stroke="#00ad36" strokeWidth="2" />
      <line x1="40" y1="22" x2="40" y2="60" stroke="#00ad36" strokeWidth="2" />
      <line x1="50" y1="22" x2="50" y2="60" stroke="#00ad36" strokeWidth="2" />

      <line x1="21" y1="32" x2="59" y2="32" stroke="#00ad36" strokeWidth="2" />
      <line x1="21" y1="42" x2="59" y2="42" stroke="#00ad36" strokeWidth="2" />
      <line x1="21" y1="52" x2="59" y2="52" stroke="#00ad36" strokeWidth="2" />

      <circle
        cx="57"
        cy="63"
        r="8"
        fill="#191b25"
        stroke="#00ad36"
        strokeWidth="2"
      />
    </svg>
  );
}

function RouletteIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-[76px] h-[76px] overflow-visible">
      <circle
        cx="40"
        cy="40"
        r="27"
        fill="none"
        stroke="#00a82d"
        strokeWidth="3"
      />

      <circle
        cx="40"
        cy="40"
        r="20"
        fill="none"
        stroke="#00a82d"
        strokeWidth="2"
      />

      <circle
        cx="40"
        cy="40"
        r="4"
        fill="none"
        stroke="#00a82d"
        strokeWidth="2"
      />

      <circle cx="40" cy="21" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
      <circle cx="55" cy="31" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
      <circle cx="54" cy="49" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
      <circle cx="40" cy="59" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
      <circle cx="25" cy="49" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
      <circle cx="25" cy="31" r="3" fill="#191b25" stroke="#00a82d" strokeWidth="2" />
    </svg>
  );
}

function GameIcon({ name }) {
  switch (name) {
    case "BINGO":
      return <BingoIcon />;
    case "KENO":
      return <KenoIcon />;
    case "AVIATOR":
      return <AviatorIcon />;
    case "PLINKO":
      return <PlinkoIcon />;
    case "BALLOON":
      return <BalloonIcon />;
    case "HI-LO":
      return <HiLoIcon />;
    case "BINGO 75":
      return <Bingo75Icon />;
    case "ROULETTE":
      return <RouletteIcon />;
    default:
      return null;
  }
}

export default function GameCard({ name, game }) {
  const openGame = () => {
    console.log("Opening:", game);
    alert("Opening " + game);
  };

  return (
    <button
      type="button"
      onClick={openGame}
      className="h-[126px] bg-[#191b25] border border-[#292d38] rounded-[12px] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-[transform,background] duration-[150ms] ease active:scale-[0.97] active:bg-[#20232f]"
    >
      <div className="h-[76px] w-full flex justify-center items-center">
        <GameIcon name={name} />
      </div>

      <div className="text-[16px] font-black tracking-[-0.5px] mt-[1px] text-[#f4f4f6] [text-shadow:1px_1px_1px_#000]">
        {name}
      </div>
    </button>
  );
}

