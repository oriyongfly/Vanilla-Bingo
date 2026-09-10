import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { getCard } from "./Cards";

const BALL_COLORS = {
  B: "#008ed6",
  I: "#83d100",
  N: "#e17000",
  G: "#a71906",
  O: "#642e88",
};

function Ball({ ball }) {
  return (
    <div
      className="relative h-[34px] w-[34px] shrink-0 rounded-full border border-black/30
        before:absolute before:inset-[2px] before:z-[2] before:rounded-full
        before:bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.4),rgba(255,255,255,0)_65%)]
        before:content-['']"
      style={{
        background:
          ball.letter === "B"
            ? "radial-gradient(circle at 35% 25%, #76deef, #008ed6 45%, #062745 100%)"
            : ball.letter === "I"
              ? "radial-gradient(circle at 35% 25%, #c3ec81, #83d100 45%, #3a5c00 100%)"
              : ball.letter === "N"
                ? "radial-gradient(circle at 35% 25%, #f6c079, #e17000 45%, #7a3800 100%)"
                : ball.letter === "G"
                  ? "radial-gradient(circle at 35% 25%, #e35a45, #a71906 45%, #4a0000 100%)"
                  : "radial-gradient(circle at 35% 25%, #8f4ad2, #642e88 45%, #2a0045 100%)",
      }}
    >
      <div className="relative z-[1] mx-auto mt-[22%] flex h-[55%] w-[55%] items-center justify-center rounded-full bg-white/85">
        <span className="text-[0.55rem] font-bold text-black">
          {ball.number}
        </span>
      </div>
    </div>
  );
}

function BingoCard({
  card,
  drawnNumbers,
  winningNumbers = [],
  winning = false,
}) {
  const columns = [
    "bg-[#008ed6]",
    "bg-[#83d100]",
    "bg-[#e17000]",
    "bg-[#a71906]",
    "bg-[#642e88]",
  ];

  return (
    <div
      className={`w-full bg-white p-[6px] ${
        winning
          ? "max-w-[300px] rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,.3)]"
          : "rounded-[6px] shadow-[inset_0_0_8px_rgba(0,0,0,.7)]"
      }`}
    >
      <table className="w-full table-fixed border-collapse overflow-hidden rounded-[4px] bg-[#F5DEB2] text-black">
        <thead>
          <tr>
            {["B", "I", "N", "G", "O"].map((letter, index) => (
              <th
                key={letter}
                className={`aspect-square w-1/5 border-2 border-white text-white
                  text-[clamp(.8rem,2vw,1.2rem)] font-bold
                  ${columns[index]}`}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {card.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, colIndex) => {
                const isFree = value === "★";
                const isDrawn =
                  !isFree && drawnNumbers.includes(Number(value));
                const isWinning =
                  winning &&
                  (isFree || winningNumbers.includes(String(value)));

                return (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square w-1/5 border-2 border-white p-0 text-center
                      align-middle text-[clamp(1rem,3vw,1.4rem)] font-bold
                      ${
                        isFree
                          ? "bg-[#fff8dc]"
                          : isDrawn
                            ? "rounded-full border-[#e17000] bg-[radial-gradient(circle_at_50%_120%,#dce1af,#f6c079_10%,#e11b3c_80%,#93abe1_100%)]"
                            : ""
                      }
                      ${
                        isWinning
                          ? "animate-[winPulse_.8s_ease-in-out_infinite] rounded-full !bg-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,.8)]"
                          : ""
                      }
                    `}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const { user } = useAuth();
  const stakeAmount = location.state?.stakeAmount || 0;
  const cardNumber = location.state?.cardNumber || 1;
  
  const [card] = useState(() => getCard(cardNumber));
  const [drawnBalls, setDrawnBalls] = useState([]);
  const [currentBall, setCurrentBall] = useState(null);
  const [ballVisible, setBallVisible] = useState(false);
  const [balloonColor, setBalloonColor] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [estimatedWin, setEstimatedWin] = useState(0);

  const [winningDialog, setWinningDialog] = useState(false);
  const [winningPattern, setWinningPattern] = useState("");
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [prizeAmount, setPrizeAmount] = useState(0);

  const ballAnimationTimeout = useRef(null);
  const balloonTimeout = useRef(null);

  const drawCount = drawnBalls.length;

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      navigate('/bingo/pick');
      return;
    }

    const handleRoomInfo = (data) => {
      setRoomId(data.roomId);
      setEstimatedWin(data.estimatedWin);
    };

    const handlePlayerJoined = (data) => {
      setEstimatedWin(data.estimatedWin);
    };

    const handleBallDrawn = (data) => {
      setDrawnBalls(prev => [...prev, data.ball]);
      setCurrentBall(data.ball);
      setBallVisible(false);
      
      if (ballAnimationTimeout.current) {
        clearTimeout(ballAnimationTimeout.current);
      }
      
      ballAnimationTimeout.current = setTimeout(() => {
        setBallVisible(true);
      }, 50);
      
      const color = BALL_COLORS[data.ball.letter];
      setBalloonColor(
        `radial-gradient(ellipse at 40% 35%, ${color}44, rgba(80,40,120,.5) 100%)`
      );
      
      if (balloonTimeout.current) {
        clearTimeout(balloonTimeout.current);
      }
      
      balloonTimeout.current = setTimeout(() => {
        setBalloonColor("");
      }, 400);
    };

    const handleWinner = (data) => {
      setIsGameOver(true);
      setPrizeAmount(data.prize);
      
      if (user?.telegramId === data.userId) {
        setWinningPattern(data.pattern || 'BINGO!');
        setWinningNumbers([]);
        setWinningDialog(true);
      }
      // Whether winner or not, round_end will trigger navigation back
    };

    const handleGameOver = (data) => {
      setIsGameOver(true);
    };

    const handleRoundEnd = (data) => {
      // Navigate back to pick screen
      setTimeout(() => {
        navigate('/bingo/pick', { state: { stakeAmount } });
      }, 1000);
    };

    const handleError = (error) => {
      console.error('Socket error:', error.message);
    };

    socket.on('bingo:room_info', handleRoomInfo);
    socket.on('bingo:player_joined', handlePlayerJoined);
    socket.on('bingo:ball_drawn', handleBallDrawn);
    socket.on('bingo:winner', handleWinner);
    socket.on('bingo:game_over', handleGameOver);
    socket.on('bingo:round_end', handleRoundEnd);
    socket.on('bingo:error', handleError);

    return () => {
      socket.off('bingo:room_info', handleRoomInfo);
      socket.off('bingo:player_joined', handlePlayerJoined);
      socket.off('bingo:ball_drawn', handleBallDrawn);
      socket.off('bingo:winner', handleWinner);
      socket.off('bingo:game_over', handleGameOver);
      socket.off('bingo:round_end', handleRoundEnd);
      socket.off('bingo:error', handleError);
      
      if (ballAnimationTimeout.current) {
        clearTimeout(ballAnimationTimeout.current);
      }
      if (balloonTimeout.current) {
        clearTimeout(balloonTimeout.current);
      }
    };
  }, [navigate, stakeAmount, getSocket, user?.telegramId]);

  const handleClaimBingo = () => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit('bingo:claim', { roomId });
  };

  return (
    <>
      <div
        className="flex min-h-screen w-full items-center justify-center bg-[linear-gradient(160deg,#1a0850_0%,#2a0c60_45%,#1a0850_100%)]"
        style={{
          fontFamily: "'Roboto Slab', serif",
        }}
      >
        <div
          className="
            my-3 w-[400px] max-w-[100vw] overflow-hidden
            rounded-[36px] border-[10px] border-[#111]
            bg-[#0b0d15]
            shadow-[0_20px_60px_rgba(0,0,0,.5)]
            max-[420px]:rounded-[24px]
            max-[420px]:border-[6px]
          "
        >
          <div
            className="min-h-screen p-3 text-[#ffffdd]"
          >
            <div className="flex min-h-screen flex-col gap-[10px]">
              {/* Top Bar */}
              <div
                className="
                  flex items-center justify-between gap-2
                  rounded-xl border border-white/[.06]
                  bg-white/[.04] px-3 py-2
                "
              >
                <div className="flex items-center gap-3">
                  <span
                    className="
                      min-w-[70px] shrink-0 text-center
                      text-[.85rem] font-bold text-[#7c8cff]
                    "
                  >
                    💰 {stakeAmount} ETB
                  </span>

                  <span
                    className={`
                      min-w-[80px] shrink-0 text-center
                      text-[.8rem] font-semibold text-white/70
                      ${drawCount === 75 ? "text-[#83d100]" : ""}
                    `}
                  >
                    🎱 {drawCount}/75
                    {drawCount === 75 ? " ✓" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="
                      min-w-[70px] shrink-0 rounded-md
                      border border-[#ffd700]/20
                      bg-[#ffd700]/10 px-[10px] py-1
                      text-center text-[.85rem] font-bold text-[#ffd700]
                    "
                  >
                    🏆 {estimatedWin}
                  </span>
                </div>
              </div>

              {/* Blower */}
              <div className="mx-auto w-full max-w-[320px]">
                <div
                  className="
                    flex aspect-square w-full items-center justify-center
                    rounded-t-[50%] border-[3px] border-b-0
                    border-white/20
                    bg-[radial-gradient(ellipse_at_40%_35%,rgba(255,255,255,.15)_0%,rgba(180,160,220,.1)_40%,rgba(80,40,120,.5)_100%)]
                    transition-[background] duration-[400ms] ease-in-out
                  "
                  style={{
                    background: balloonColor || undefined,
                  }}
                >
                  <div
                    className={`
                      text-center leading-none
                      text-[5rem] font-bold text-white
                      text-shadow-[0_0_40px_rgba(124,140,255,.5)]
                      transition-all duration-[400ms]
                      ${
                        ballVisible
                          ? "scale-100 opacity-100"
                          : "scale-50 opacity-0"
                      }
                      max-[420px]:text-[3.5rem]
                      ${drawCount === 75 ? "text-[3.5rem]" : ""}
                    `}
                  >
                    <span
                      className="block"
                      style={{
                        color: currentBall
                          ? BALL_COLORS[currentBall.letter]
                          : "#fff",
                      }}
                    >
                      {currentBall?.number ?? "—"}
                    </span>

                    <span className="block text-[1.2rem] opacity-60">
                      {currentBall?.letter ?? "B"}
                    </span>
                  </div>
                </div>

                {/* Tube */}
                <div
                  className={`
                    w-full overflow-hidden rounded-b-lg
                    border-2 border-t-0 border-white/15
                    bg-[linear-gradient(to_bottom,rgba(60,30,90,.9)_0%,rgba(30,10,60,1)_100%)]
                    px-[6px]
                    ${
                      drawCount > 8
                        ? "max-h-[120px] min-h-[50px]"
                        : "h-[50px]"
                    }
                    max-[420px]:h-10
                  `}
                >
                  <div
                    className={`
                      flex h-full w-full items-center gap-[3px]
                      overflow-x-auto overflow-y-hidden py-[3px]
                      ${
                        drawCount > 8
                          ? "flex-wrap content-start gap-[2px] overflow-x-hidden overflow-y-auto p-1"
                          : "flex-nowrap"
                      }
                    `}
                  >
                    {drawnBalls.map((ball, index) => (
                      <Ball
                        key={`${ball.number}-${index}`}
                        ball={ball}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Number & Claim Button */}
              <div className="flex items-center justify-between px-2">
                <div className="text-center text-[2rem] font-bold text-[#ffffdd]">
                  🎫 #{cardNumber}
                </div>
                {!isGameOver && drawCount > 0 && (
                  <button
                    onClick={handleClaimBingo}
                    className="
                      bg-gradient-to-br
                      from-[#ffd700]
                      to-[#ff6b00]
                      text-white
                      font-bold
                      py-2
                      px-4
                      rounded-[12px]
                      text-[0.9rem]
                      transition-all
                      hover:scale-[1.05]
                      hover:shadow-[0_8px_30px_rgba(255,215,0,0.3)]
                      active:scale-[0.95]
                    "
                  >
                    BINGO!
                  </button>
                )}
              </div>

              {/* Bingo Card */}
              <div className="flex min-h-0 w-full flex-1 items-stretch">
                {card.length > 0 && (
                  <BingoCard 
                    card={card}
                    drawnNumbers={drawnBalls.map((b) => b.number)} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Winning Dialog */}
          {winningDialog && (
            <div
              className="
                fixed inset-0 z-[1000]
                flex items-center justify-center
                bg-black/70 p-5
                backdrop-blur-[8px]
              "
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setWinningDialog(false);
                }
              }}
            >
              <div
                className="
                  relative w-full max-w-[380px]
                  overflow-hidden rounded-2xl
                  bg-white
                  shadow-[0_8px_32px_rgba(0,0,0,.5)]
                "
              >
                {/* Close */}
                <button
                  onClick={() => setWinningDialog(false)}
                  className="
                    absolute right-2 top-2 z-[2]
                    h-[30px] w-[30px]
                    rounded-full border-none
                    bg-black/10 text-center
                    text-[18px] leading-[30px] text-[#333]
                    cursor-pointer
                  "
                >
                  ×
                </button>

                {/* Header */}
                <header
                  className="
                    flex h-[60px] items-center justify-center
                    border-b-2 border-[#e17010]
                    bg-[linear-gradient(135deg,#f6c079,#e17010)]
                    text-[1.1rem] font-bold text-white
                  "
                >
                  🎉 {winningPattern}
                </header>

                {/* Content */}
                <div className="px-5 py-4 text-[.95rem] text-[#e17010]">
                  <div className="mb-2">Winning Card</div>

                  <div className="flex w-full justify-center">
                    {card.length > 0 && (
                      <BingoCard
                        card={card}
                        drawnNumbers={drawnBalls.map((b) => b.number)}
                        winningNumbers={winningNumbers}
                        winning
                      />
                    )}
                  </div>

                  <div className="mt-4">
                    🏆 Prize: {prizeAmount} ETB
                  </div>
                </div>

                {/* Footer */}
                <footer className="p-3 text-center">
                  <button
                    onClick={() => setWinningDialog(false)}
                    className="
                      rounded-lg border-none
                      bg-[linear-gradient(135deg,#7c8cff,#b47cff)]
                      px-8 py-2
                      text-base font-semibold text-white
                      transition-transform active:scale-95
                    "
                  >
                    OK
                  </button>
                </footer>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes winPulse {
          0%, 100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </>
  );
}