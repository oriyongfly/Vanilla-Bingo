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

// B/I/N/G/O column ranges for the call-history board
const BOARD_COLUMNS = [
  { letter: "B", start: 1, end: 15 },
  { letter: "I", start: 16, end: 30 },
  { letter: "N", start: 31, end: 45 },
  { letter: "G", start: 46, end: 60 },
  { letter: "O", start: 61, end: 75 },
];

const REDIRECT_DELAY_MS = 8000;

// Given a bingo card (5×5 row-major array) and a pattern string from the
// server ("Row 1", "Column 2", "Diagonal ↘", "Diagonal ↙"), return the
// string values of every cell in that winning line so BingoCard can
// highlight them gold.
function resolveWinningCells(card, pattern) {
  if (!card || !pattern) return [];
  const cells = [];

  const rowMatch = pattern.match(/^Row (\d+)$/);
  if (rowMatch) {
    const r = parseInt(rowMatch[1], 10) - 1;
    card[r].forEach((v) => cells.push(String(v)));
    return cells;
  }

  const colMatch = pattern.match(/^Column (\d+)$/);
  if (colMatch) {
    const c = parseInt(colMatch[1], 10) - 1;
    card.forEach((row) => cells.push(String(row[c])));
    return cells;
  }

  if (pattern === "Diagonal ↘") {
    card.forEach((row, i) => cells.push(String(row[i])));
    return cells;
  }

  if (pattern === "Diagonal ↙") {
    card.forEach((row, i) => cells.push(String(row[4 - i])));
    return cells;
  }

  return cells;
}

/* ------------------------------------------------------------------ */
/*  BingoBoard — left column call-history board (all 75 numbers)       */
/* ------------------------------------------------------------------ */

function BingoBoard({ drawnNumbers, currentBall }) {
  const drawnSet = new Set(drawnNumbers);
  const currentNumber = currentBall?.number ?? null;

  return (
    <div className="grid grid-cols-5 gap-1">
      {BOARD_COLUMNS.map(({ letter, start, end }) => (
        <div key={letter} className="flex flex-col gap-1">
          {/* Column header */}
          <div
            className="
              mb-[1px] flex h-7 items-center justify-center
              rounded-md text-[13px] font-black text-white
            "
            style={{ background: BALL_COLORS[letter] }}
          >
            {letter}
          </div>

          {/* 15 number cells */}
          {Array.from({ length: end - start + 1 }, (_, i) => {
            const n = start + i;
            const isCalled = drawnSet.has(n);
            const isCurrent = currentNumber === n;

            let cls =
              "flex h-[27px] items-center justify-center rounded-[5px] " +
              "text-[12px] font-bold transition-all duration-200 ";

            if (isCurrent) {
              cls +=
                "border border-[rgba(255,180,60,.4)] " +
                "bg-[rgba(255,180,60,.06)] " +
                "text-[rgba(255,200,110,.95)]";
            } else if (isCalled) {
              cls +=
                "border border-[#7c8cff] scale-105 " +
                "bg-[linear-gradient(135deg,#7c8cff,#b47cff)] " +
                "text-white shadow-[0_8px_30px_rgba(124,140,255,.30)]";
            } else {
              cls +=
                "border border-white/10 bg-white/[.08] " +
                "text-white/85 hover:bg-white/[.14]";
            }

            return (
              <div key={n} className={cls}>
                {n}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WatchCard — compact 5×5 grid used in the right panel               */
/* ------------------------------------------------------------------ */

function WatchCard({ card, cardNumber, drawnNumbers, winningNumbers = [] }) {
  const drawnSet = new Set(drawnNumbers);
  const winningSet = new Set(winningNumbers);

  // Header row letters
  const letters = ["B", "I", "N", "G", "O"];

  return (
    <div
      className="
        mt-[5px] w-full overflow-hidden rounded-lg
        border border-white/20 bg-white
        shadow-[0_3px_12px_rgba(0,0,0,.28)]
      "
    >
      {/* Card number header */}
      <div
        className="
          flex min-h-[42px] items-center justify-center gap-2
          border-b border-white/[.12] bg-[#0b0d15]
          px-2 py-[5px] text-[clamp(18px,2vw,27px)]
          font-black leading-none text-[#ffffdd]
        "
      >
        <span className="text-[.95em] text-[#ffd84d] drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]">
          🎟
        </span>
        <span>#{cardNumber}</span>
      </div>

      {/* 5×5 grid */}
      <div
        className="grid grid-cols-5 gap-[2px] bg-white p-[3px]"
        role="table"
        aria-label={`Bingo card ${cardNumber}`}
      >
        {/* Header row */}
        {letters.map((letter) => (
          <div
            key={letter}
            role="columnheader"
            className="
              flex aspect-[1.45/1] min-w-0 items-center justify-center
              border border-white/95 text-[clamp(11px,1.2vw,15px)]
              font-extrabold leading-none text-white
            "
            style={{ background: BALL_COLORS[letter] }}
          >
            {letter}
          </div>
        ))}

        {/* Body cells */}
        {card.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const isFree = value === "★";
            const isDrawn = !isFree && drawnSet.has(Number(value));
            const isWinning =
              winningSet.size > 0 &&
              (isFree || winningSet.has(String(value)));

            let cls =
              "flex aspect-[1.28/1] min-w-0 items-center justify-center " +
              "border border-white/95 text-[clamp(11px,1.3vw,16px)] " +
              "font-extrabold leading-none text-[#111]";

            if (isFree) {
              cls += " bg-[#fff8dc] text-[15px]";
            } else if (isWinning) {
              cls +=
                " animate-[winPulse_.8s_ease-in-out_infinite] " +
                "rounded-full bg-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,.8)]";
            } else if (isDrawn) {
              cls +=
                " rounded-[50%/48%] border-[#e17000] " +
                "bg-[radial-gradient(ellipse_at_50%_115%,#f6c079_0%,#f6a15f_24%,#ed3450_72%,#c9163c_100%)] " +
                "shadow-[inset_0_1px_2px_rgba(255,255,255,.25)]";
            } else {
              cls += " bg-[#f5deb2]";
            }

            return (
              <div key={`${rowIndex}-${colIndex}`} className={cls}>
                {value}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BingoCard — kept for the winner dialog only (full table view)      */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main Game component                                                */
/* ------------------------------------------------------------------ */

export default function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const { user } = useAuth();
  const stakeAmount = location.state?.stakeAmount || 0;

  // Multi-card: prefer cardNumbers (array), fall back to single cardNumber
  const cardNumbers = (() => {
    if (Array.isArray(location.state?.cardNumbers) && location.state.cardNumbers.length > 0) {
      return location.state.cardNumbers;
    }
    if (location.state?.cardNumber != null) {
      return [location.state.cardNumber];
    }
    return [];
  })();

  // Spectator flag + pre-drawn balls from router state
  const spectator = location.state?.spectator === true;
  const incomingDrawnBalls = location.state?.drawnBalls;

  const [cards] = useState(() =>
    spectator ? [] : cardNumbers.map((n) => getCard(n))
  );
  const [drawnBalls, setDrawnBalls] = useState(() =>
    Array.isArray(incomingDrawnBalls) ? incomingDrawnBalls : []
  );
  const [currentBall, setCurrentBall] = useState(
    Array.isArray(incomingDrawnBalls) && incomingDrawnBalls.length > 0
      ? incomingDrawnBalls[incomingDrawnBalls.length - 1]
      : null
  );
  const [ballVisible, setBallVisible] = useState(
    Array.isArray(incomingDrawnBalls) && incomingDrawnBalls.length > 0
  );
  const [balloonColor, setBalloonColor] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [estimatedWin, setEstimatedWin] = useState(0);
  const [gameId, setGameId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);

  // End-of-round dialog state
  const [winningDialog, setWinningDialog] = useState(false);
  const [winningPattern, setWinningPattern] = useState("");
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [prizeAmount, setPrizeAmount] = useState(0);
  const [winnerUserId, setWinnerUserId] = useState(null);
  const [winnerCardNumber, setWinnerCardNumber] = useState(null);
  const [noWinner, setNoWinner] = useState(false);

  const ballAnimationTimeout = useRef(null);
  const balloonTimeout = useRef(null);
  const redirectTimeout = useRef(null);

  const drawCount = drawnBalls.length;
  const drawnNumbers = drawnBalls.map((b) => b.number);
  const lastThree = drawnBalls.slice(-3).reverse();

  // Subscribe to tier channel on mount and re-subscribe on every reconnect
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !stakeAmount) return;

    socket.emit('bingo:subscribe', { stakeAmount });

    const handleConnect = () => {
      socket.emit('bingo:subscribe', { stakeAmount });
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [getSocket, stakeAmount]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      navigate('/bingo/pick');
      return;
    }

    const scheduleRedirect = () => {
      if (redirectTimeout.current) return;
      redirectTimeout.current = setTimeout(() => {
        navigate('/bingo/pick', { state: { stakeAmount } });
      }, REDIRECT_DELAY_MS);
    };

    const handleRoomInfo = (data) => {
      setEstimatedWin(data.estimatedWin);
      setGameId(data.gameId);
      setPlayerCount(data.playerCount);
    };

    const handleStatus = (data) => {
      if (data?.estimatedWin != null) {
        setEstimatedWin(data.estimatedWin);
      }
      setGameId(data.gameId);
      setPlayerCount(data.playerCount);
    };

    const handlePlayerJoined = (data) => {
      setEstimatedWin(data.estimatedWin);
      setPlayerCount(data.playerCount);
    };

    const handleBallDrawn = (data) => {
      setDrawnBalls(prev => [...prev, data.ball]);
      setCurrentBall(data.ball);
      if (data.estimatedWin != null) setEstimatedWin(data.estimatedWin);
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
      setWinnerUserId(data.userId ?? null);
      setWinnerCardNumber(data.cardNumber ?? null);
      setWinningPattern(data.pattern || 'BINGO!');

      if (data.cardNumber != null) {
        try {
          const winCard = getCard(data.cardNumber);
          setWinningNumbers(resolveWinningCells(winCard, data.pattern));
        } catch {
          setWinningNumbers([]);
        }
      } else {
        setWinningNumbers([]);
      }

      setNoWinner(false);
      setWinningDialog(true);
      scheduleRedirect();
    };

    const handleGameOver = () => {
      setIsGameOver(true);
      setNoWinner(true);
      setWinningPattern("");
      setWinningNumbers([]);
      setPrizeAmount(0);
      setWinnerUserId(null);
      setWinnerCardNumber(null);

      setWinningDialog(true);
      scheduleRedirect();
    };

    const handleRoundEnd = () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
        redirectTimeout.current = null;
      }
      navigate('/bingo/pick', { state: { stakeAmount } });
    };

    const handleError = (error) => {
      console.error('Socket error:', error.message);
    };

    socket.off('bingo:room_info', handleRoomInfo);
    socket.off('bingo:status', handleStatus);
    socket.off('bingo:player_joined', handlePlayerJoined);
    socket.off('bingo:ball_drawn', handleBallDrawn);
    socket.off('bingo:winner', handleWinner);
    socket.off('bingo:game_over', handleGameOver);
    socket.off('bingo:round_end', handleRoundEnd);
    socket.off('bingo:error', handleError);

    socket.on('bingo:room_info', handleRoomInfo);
    socket.on('bingo:status', handleStatus);
    socket.on('bingo:player_joined', handlePlayerJoined);
    socket.on('bingo:ball_drawn', handleBallDrawn);
    socket.on('bingo:winner', handleWinner);
    socket.on('bingo:game_over', handleGameOver);
    socket.on('bingo:round_end', handleRoundEnd);
    socket.on('bingo:error', handleError);

    return () => {
      socket.off('bingo:room_info', handleRoomInfo);
      socket.off('bingo:status', handleStatus);
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
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
        redirectTimeout.current = null;
      }
    };
  }, [navigate, stakeAmount, getSocket, user?.telegramId]);

  const handleClaimBingo = () => {
    if (spectator) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('bingo:claim', { stakeAmount });
  };

  const handleLeave = () => {
    navigate('/bingo/pick', { state: { stakeAmount } });
  };

  const isWinner = user?.telegramId && winnerUserId === user.telegramId;

  // Last-3 pill colour palette (matches renewed.html: blue/purple/light)
  const pillColors = ["#008ed6", "#642e88", "#7c8cff"];

  return (
    <>
      <div
        className="flex min-h-screen w-full items-center justify-center bg-[linear-gradient(160deg,#1a0850_0%,#2a0c60_45%,#1a0850_100%)]"
        style={{ fontFamily: "'Roboto Slab', serif" }}
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
          <div className="min-h-screen p-3 text-[#ffffdd]">
            <div className="flex min-h-screen flex-col gap-[7px]">

              {/* ---------- HEADER — 5-cell grid ---------- */}
              <div className="grid grid-cols-[1.45fr_1fr_0.9fr_1.15fr_1fr] gap-[5px] h-[44px] max-[420px]:gap-[3px]">
                <div className="info-box">
                  <span className="info-title">Game ID</span>
                  <span className="info-value">{gameId || "—"}</span>
                </div>
                <div className="info-box">
                  <span className="info-title">Players</span>
                  <span className="info-value">{playerCount}</span>
                </div>
                <div className="info-box">
                  <span className="info-title">Bet</span>
                  <span className="info-value">{stakeAmount}</span>
                </div>
                <div className="info-box">
                  <span className="info-title">Derash</span>
                  <span className="info-value">{estimatedWin}</span>
                </div>
                <div className="info-box">
                  <span className="info-title">Called</span>
                  <span className="info-value">{drawCount}</span>
                </div>
              </div>

              {/* ---------- MAIN CONTENT — board + right panel ---------- */}
              <div className="grid grid-cols-[174px_1fr] gap-[6px] mt-[7px] max-[360px]:grid-cols-[160px_1fr]">

                {/* Left — Bingo board (call history) */}
                <BingoBoard
                  drawnNumbers={drawnNumbers}
                  currentBall={currentBall}
                />

                {/* Right — stacked panel */}
                <div className="min-w-0">

                  {/* Controls row: last 3 pills */}
                  <div className="flex items-center gap-[5px] h-[31px]">
                    {lastThree.length > 0 ? (
                      lastThree.map((ball, i) => (
                        <div
                          key={`${ball.number}-${i}`}
                          className="
                            rounded-[20px] px-[11px] py-[6px]
                            text-[12px] font-bold whitespace-nowrap text-white
                          "
                          style={{ background: pillColors[i] }}
                        >
                          {ball.letter}-{ball.number}
                        </div>
                      ))
                    ) : (
                      <div
                        className="
                          rounded-[20px] px-[11px] py-[6px]
                          text-[12px] font-bold whitespace-nowrap text-white
                        "
                        style={{ background: pillColors[0] }}
                      >
                        —
                      </div>
                    )}
                  </div>

                  {/* Spectator banner (moved here) */}
                  {spectator && (
                    <div
                      className="
                        mt-[5px] flex items-center justify-center gap-2
                        rounded-lg border border-[#7c8cff]/30
                        bg-[#7c8cff]/10 px-3 py-2
                        text-[.8rem] font-semibold text-[#a8b4ff]
                      "
                    >
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#ff6b6b]" />
                      👀 Watching live game
                    </div>
                  )}

                  {/* Current ball box */}
                  <div
                    className="
                      mt-[4px] flex h-[96px] items-center justify-center
                      overflow-hidden rounded-lg
                      border border-white/[.08]
                      bg-[radial-gradient(ellipse_at_40%_35%,rgba(255,255,255,.15)_0%,rgba(180,160,220,.10)_40%,rgba(80,40,120,.50)_100%)]
                      transition-[background] duration-[400ms] ease-in-out
                      max-[360px]:h-[88px]
                    "
                    style={{ background: balloonColor || undefined }}
                  >
                    <div
                      className={`
                        flex h-[62px] w-[62px] items-center justify-center
                        rounded-full border-[3px] border-[#ffd700]
                        text-[19px] font-black text-[#642e88]
                        shadow-[0_0_25px_rgba(255,215,0,.35),inset_0_0_12px_rgba(0,0,0,.12)]
                        transition-all duration-[400ms]
                        max-[360px]:h-[56px] max-[360px]:w-[56px]
                        ${ballVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}
                      `}
                      style={{
                        background: currentBall
                          ? `radial-gradient(circle at 35% 25%, ${
                              BALL_COLORS[currentBall.letter]
                            }cc, ${BALL_COLORS[currentBall.letter]} 60%, #111 130%)`
                          : "radial-gradient(circle at 35% 25%, #ffffff, #f3f3f3 45%, #d5d5d5 100%)",
                        color: currentBall ? "#fff" : "#642e88",
                      }}
                    >
                      {currentBall
                        ? `${currentBall.letter}-${currentBall.number}`
                        : "— / B"}
                    </div>
                  </div>

                  {/* Auto toggle row (cosmetic) */}
                  <div
                    className="
                      mt-[5px] flex h-[25px] items-center justify-end
                      rounded-[18px] border border-white/10 bg-white/[.06]
                      pr-[7px]
                    "
                  >
                    <div
                      className="
                        relative h-5 w-10 rounded-[20px] bg-[#13975e]
                        shadow-[0_0_10px_rgba(19,151,94,.25)]
                        before:absolute before:right-[1px] before:top-[1px]
                        before:h-[17px] before:w-[17px] before:rounded-full
                        before:bg-[#777c88] before:content-['']
                      "
                    />
                  </div>

                  {/* Watching card(s) — players only */}
                  {!spectator && cards.length > 0 && (
                    <div className="mt-[5px] flex flex-col">
                      {cards.map((c, idx) => (
                        <WatchCard
                          key={cardNumbers[idx]}
                          card={c}
                          cardNumber={cardNumbers[idx]}
                          drawnNumbers={drawnNumbers}
                        />
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* ---------- FOOTER — 3 buttons ---------- */}
              <div className="grid grid-cols-[84px_94px_1fr] gap-2 mt-[7px]">
                <button
                  onClick={handleLeave}
                  className="
                    h-10 rounded-[10px] border-none text-[16px] font-extrabold
                    text-white transition-transform duration-150
                    bg-[linear-gradient(90deg,#ff525e,#ff6b00)]
                    hover:shadow-[0_8px_24px_rgba(0,0,0,.25)]
                    active:scale-[.97]
                  "
                >
                  Leave
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="
                    h-10 rounded-[10px] border-none text-[16px] font-extrabold
                    text-white transition-transform duration-150
                    bg-[linear-gradient(135deg,#7c8cff,#642e88)]
                    hover:shadow-[0_8px_24px_rgba(0,0,0,.25)]
                    active:scale-[.97]
                  "
                >
                  ↻ Refresh
                </button>

                {/* Automatic / BINGO! — same visibility conditions as before */}
                {!isGameOver && drawCount > 0 && !spectator ? (
                  <button
                    onClick={handleClaimBingo}
                    className="
                      h-10 rounded-[10px] border-none text-[16px] font-extrabold
                      text-white transition-transform duration-150
                      bg-[linear-gradient(90deg,#ffd700,#ff6b00)]
                      hover:shadow-[0_8px_24px_rgba(0,0,0,.25)]
                      active:scale-[.97]
                    "
                  >
                    BINGO!
                  </button>
                ) : (
                  <button
                    disabled
                    className="
                      h-10 rounded-[10px] border-none text-[16px] font-extrabold
                      text-white/50 cursor-not-allowed
                      bg-[linear-gradient(90deg,#ffd700,#ff6b00)]
                      opacity-40
                    "
                  >
                    Automatic
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* ---------- End-of-Round Dialog (unchanged structure) ---------- */}
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
                  max-h-[90vh]
                  overflow-y-auto
                  rounded-2xl
                  bg-white
                  shadow-[0_8px_32px_rgba(0,0,0,.5)]
                "
              >
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

                <header
                  className={`
                    flex h-[60px] items-center justify-center
                    border-b-2
                    text-[1.1rem] font-bold text-white
                    ${
                      noWinner
                        ? "border-[#7c8cff] bg-[linear-gradient(135deg,#5a6be0,#7c8cff)]"
                        : "border-[#e17010] bg-[linear-gradient(135deg,#f6c079,#e17010)]"
                    }
                  `}
                >
                  {noWinner
                    ? "😔 No Winner This Round"
                    : isWinner
                    ? `🎉 You Won! — ${winningPattern}`
                    : `🏆 Winner! — ${winningPattern}`}
                </header>

                <div className="px-5 py-4 text-[.95rem] text-[#e17010]">
                  {noWinner ? (
                    <p className="text-center text-[#7c8cff]">
                      All 75 balls were drawn with no Bingo pattern completed.
                      Better luck next round!
                    </p>
                  ) : isWinner ? (
                    <>
                      <div className="mb-2 text-[0.8rem] text-[rgba(0,0,0,0.4)] uppercase tracking-wider">
                        Cartela #{winnerCardNumber} — {winningPattern}
                      </div>

                      <div className="flex w-full flex-col items-center gap-3">
                        {cards.map((c, idx) => (
                          <BingoCard
                            key={cardNumbers[idx]}
                            card={c}
                            drawnNumbers={drawnNumbers}
                            winningNumbers={winningNumbers}
                            winning
                          />
                        ))}
                      </div>

                      <div className="mt-4 font-bold">
                        🏆 Prize: {prizeAmount} ETB
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 text-[0.8rem] text-[rgba(0,0,0,0.4)] uppercase tracking-wider">
                        Cartela #{winnerCardNumber ?? "—"} — {winningPattern}
                      </div>

                      {winnerCardNumber != null && (() => {
                        try {
                          const winCard = getCard(winnerCardNumber);
                          return (
                            <div className="flex w-full flex-col items-center gap-3">
                              <BingoCard
                                card={winCard}
                                drawnNumbers={drawnNumbers}
                                winningNumbers={winningNumbers}
                                winning
                              />
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}

                      <div className="mt-4 font-bold">
                        🏆 Prize: {prizeAmount} ETB
                      </div>
                    </>
                  )}
                </div>

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
        .info-box {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 8px;
          padding: 3px 7px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .info-title {
          font-size: 11px;
          font-weight: bold;
          color: rgba(255,255,255,.65);
        }

        .info-value {
          font-size: 14px;
          font-weight: 800;
          color: #ffffdd;
          margin-top: 2px;
        }

        @media (max-width: 360px) {
          .info-box { padding: 3px 4px; }
          .info-title { font-size: 9px; }
          .info-value { font-size: 12px; }
        }

        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}