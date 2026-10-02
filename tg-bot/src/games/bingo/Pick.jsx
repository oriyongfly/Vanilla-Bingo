import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { getCard } from "./Cards";

const MAX_SELECTIONS = 4;
const NAVIGATE_DELAY_MS = 5000;

export default function Pick() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const stakeAmount = location.state?.stakeAmount || 0;

  // Read timeLeft and gameId from router state (set by Stake page)
  const initialTimeLeft = location.state?.timeLeft;
  const gameId = location.state?.gameId;

  const [selectedNums, setSelectedNums] = useState([]);
  const [reservedCards, setReservedCards] = useState({});
  // Seeded from router state so the first render shows something before the
  // first server tick arrives. The server is authoritative from then on.
  const [timeLeft, setTimeLeft] = useState(
    typeof initialTimeLeft === "number" ? initialTimeLeft : 50
  );
  const [isGameActive, setIsGameActive] = useState(true);
  const [playerCount, setPlayerCount] = useState(0);
  const [estimatedWin, setEstimatedWin] = useState(0);
  const [takenCards, setTakenCards] = useState([]);

  // True once we've emitted joins and are waiting out the 5-second window
  // before navigating to the game page. Renders the overlay.
  const [isStarting, setIsStarting] = useState(false);
  const [startCountdown, setStartCountdown] = useState(
    Math.ceil(NAVIGATE_DELAY_MS / 1000)
  );

  const selectedNumsRef = useRef([]);
  const navigateTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    selectedNumsRef.current = selectedNums;
  }, [selectedNums]);

  const numbers = Array.from({ length: 60 }, (_, i) => i + 1);

  // Redirect if no stake amount
  useEffect(() => {
    if (!location.state?.stakeAmount) {
      navigate('/bingo/stake');
    }
  }, [location.state, navigate]);

  // Edge case: picking phase already ended (timeLeft <= 0) → go to spectator view
  useEffect(() => {
    if (
      typeof initialTimeLeft === "number" &&
      initialTimeLeft <= 0 &&
      location.state?.stakeAmount
    ) {
      navigate('/bingo/game', {
        state: {
          stakeAmount,
          gameId,
          spectator: true,
          drawnBalls: [],
        },
        replace: true,
      });
    }
  }, [initialTimeLeft, stakeAmount, gameId, location.state, navigate]);

  // Subscribe to tier channel on mount to receive ticks
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !stakeAmount) return;
    socket.emit('bingo:subscribe', { stakeAmount });
  }, [getSocket, stakeAmount]);

  // Cleanup the navigate timer + countdown interval on unmount so a manual
  // navigation during the 5s wait doesn't trigger a second navigate.
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
        navigateTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePlayerJoined = (data) => {
      setPlayerCount(data.playerCount);
      setEstimatedWin(data.estimatedWin);
      if (Array.isArray(data.takenCards)) {
        setTakenCards(data.takenCards);
      }
    };

    const handleRoomInfo = (data) => {
      setPlayerCount(data.playerCount);
      setEstimatedWin(data.estimatedWin);
      if (Array.isArray(data.takenCards)) {
        setTakenCards(data.takenCards);
      }
    };

    const handleStatus = (data) => {
      if (!data) return;
      if (typeof data.timeLeft === "number") {
        setTimeLeft(data.timeLeft);
        if (data.timeLeft <= 0) setIsGameActive(false);
      }
      if (typeof data.playerCount === "number") setPlayerCount(data.playerCount);
      if (typeof data.estimatedWin === "number") setEstimatedWin(data.estimatedWin);
      if (Array.isArray(data.takenCards)) setTakenCards(data.takenCards);
      if (data.selections && typeof data.selections === 'object') {
        setReservedCards(data.selections);
      }
    };

    const handleTick = (data) => {
      if (typeof data.timeLeft === "number") {
        setTimeLeft(data.timeLeft);
        if (data.timeLeft <= 0) setIsGameActive(false);
      }
      if (typeof data.playerCount === "number") setPlayerCount(data.playerCount);
      if (typeof data.estimatedWin === "number") setEstimatedWin(data.estimatedWin);
    };

    const handlePhaseChanged = (data) => {
      if (data?.phase === 'drawing' || data?.phase === 'ending') {
        setIsGameActive(false);
        if (typeof data.timeLeft === "number") setTimeLeft(data.timeLeft);
      }
      if (typeof data.playerCount === "number") setPlayerCount(data.playerCount);
      if (typeof data.estimatedWin === "number") setEstimatedWin(data.estimatedWin);
    };

    const handleSelectionsUpdated = (data) => {
      if (data && typeof data.selections === 'object' && data.selections !== null) {
        setReservedCards(data.selections);
        if (typeof data.estimatedWin === 'number') setEstimatedWin(data.estimatedWin);
      }
    };

    // Fires at timeLeft === 0 on the server, the same tick the drawing phase
    // begins. Emit one join per selected card so the server registers all of
    // them, then hold the user on an overlay for the 5s join-grace window
    // before navigating to the game page.
    //
    // If nothing is selected, do nothing and stay on Pick — the user will be
    // carried into the next round.
    const handleGameStarting = () => {
      // Guard against double-firing (e.g. duplicate events)
      if (isStarting) return;

      const currentNums = selectedNumsRef.current;

      if (currentNums.length === 0) {
        // No selection — stay on Pick and wait for the next round's
        // bingo:game_starting event.
        return;
      }

      // Emit all joins immediately so the server has the full 5s window to
      // process them before the drawing phase checks player count.
      for (const num of currentNums) {
        socket.emit('bingo:join', {
          stakeAmount,
          cardNumber: num,
          card: getCard(num),
        });
      }

      setIsStarting(true);
      setStartCountdown(Math.ceil(NAVIGATE_DELAY_MS / 1000));

      // Countdown display, purely cosmetic — the actual navigate happens on
      // the timeout below so the two stay in lockstep.
      countdownIntervalRef.current = setInterval(() => {
        setStartCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      navigateTimeoutRef.current = setTimeout(() => {
        navigateTimeoutRef.current = null;
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        navigate('/bingo/game', {
          state: { stakeAmount, cardNumbers: currentNums },
        });
      }, NAVIGATE_DELAY_MS);
    };

    const handleError = (error) => {
      console.error('Socket error:', error.message);
      // Optionally show error to user
    };

    socket.off('bingo:player_joined', handlePlayerJoined);
    socket.off('bingo:room_info', handleRoomInfo);
    socket.off('bingo:status', handleStatus);
    socket.off('bingo:tick', handleTick);
    socket.off('bingo:phase_changed', handlePhaseChanged);
    socket.off('bingo:selections_updated', handleSelectionsUpdated);
    socket.off('bingo:game_starting', handleGameStarting);
    socket.off('bingo:error', handleError);

    socket.on('bingo:player_joined', handlePlayerJoined);
    socket.on('bingo:room_info', handleRoomInfo);
    socket.on('bingo:status', handleStatus);
    socket.on('bingo:tick', handleTick);
    socket.on('bingo:phase_changed', handlePhaseChanged);
    socket.on('bingo:selections_updated', handleSelectionsUpdated);
    socket.on('bingo:game_starting', handleGameStarting);
    socket.on('bingo:error', handleError);

    return () => {
      socket.off('bingo:player_joined', handlePlayerJoined);
      socket.off('bingo:room_info', handleRoomInfo);
      socket.off('bingo:status', handleStatus);
      socket.off('bingo:tick', handleTick);
      socket.off('bingo:phase_changed', handlePhaseChanged);
      socket.off('bingo:selections_updated', handleSelectionsUpdated);
      socket.off('bingo:game_starting', handleGameStarting);
      socket.off('bingo:error', handleError);
    };
  }, [getSocket, navigate, stakeAmount, isStarting]);

  const handleNumberClick = (number) => {
    if (!isGameActive || isStarting) return;
    if (takenCards.includes(number)) return;

    const socket = getSocket();
    if (!socket) return;

    setSelectedNums((prev) => {
      let next;

      if (prev.includes(number)) {
        // Deselect
        next = prev.filter((n) => n !== number);
      } else if (prev.length < MAX_SELECTIONS) {
        // Add
        next = [...prev, number];
      } else {
        // At cap — ignore silently
        return prev;
      }

      socket.emit('bingo:select', {
        stakeAmount,
        cardNumbers: next,
      });

      return next;
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const timerDanger = timeLeft <= 10;
  const timerWarning = timeLeft <= 20 && timeLeft > 10;

  // Show the "waiting" banner when the picking window has closed and the user
  // still hasn't selected anything — they'll be carried into the next round.
  const showWaitingBanner =
    !isGameActive && selectedNums.length === 0 && !isStarting;

  return (
    <main
      className="
        w-full
        min-h-screen
        bg-[#0b0d15]
        flex
        items-center
        justify-center
        text-white
        font-[system-ui,-apple-system,'Segoe_UI',Roboto,'Helvetica_Neue',sans-serif]
        relative
      "
    >
      <div
        className="
          w-full
          max-w-[520px]
          p-6
          max-[420px]:p-4
        "
      >
        <div
          className={`
            bg-[rgba(255,255,255,0.03)]
            backdrop-blur-[12px]
            rounded-[24px]
            p-6
            border
            border-[rgba(255,255,255,0.06)]
            shadow-[0_20px_60px_rgba(0,0,0,0.5)]
            max-[420px]:p-4
            transition-opacity
            duration-300
            ${isStarting ? "pointer-events-none select-none opacity-40" : ""}
          `}
        >
          {/* Top Bar */}
          <div
            className="
              grid
              grid-cols-2
              gap-2
              mb-5
              pb-4
              border-b
              border-[rgba(255,255,255,0.04)]
              max-[420px]:gap-[0.4rem]
            "
          >
            {/* Stake */}
            <div
              className="
                bg-[rgba(124,140,255,0.06)]
                border
                border-[rgba(124,140,255,0.1)]
                rounded-[10px]
                py-2
                px-3
                flex
                flex-col
                min-w-0
                max-[420px]:py-[0.4rem]
                max-[420px]:px-[0.6rem]
              "
            >
              <span
                className="
                  text-[rgba(255,255,255,0.3)]
                  text-[0.6rem]
                  uppercase
                  tracking-[0.05em]
                  font-semibold
                "
              >
                Stake
              </span>

              <span
                className="
                  text-[#7c8cff]
                  text-[0.85rem]
                  font-bold
                  mt-[0.1rem]
                  whitespace-nowrap
                  overflow-hidden
                  text-ellipsis
                  max-[420px]:text-[0.75rem]
                  max-[360px]:text-[0.65rem]
                "
              >
                {stakeAmount} ETB
              </span>
            </div>

            {/* Timer */}
            <div
              className="
                bg-[rgba(255,255,255,0.02)]
                border
                border-[rgba(255,255,255,0.04)]
                rounded-[10px]
                py-2
                px-3
                flex
                flex-col
                items-center
                justify-center
                max-[420px]:py-[0.4rem]
                max-[420px]:px-[0.6rem]
              "
            >
              <span
                className="
                  text-[rgba(255,255,255,0.3)]
                  text-[0.6rem]
                  uppercase
                  tracking-[0.05em]
                  font-semibold
                "
              >
                Time Left
              </span>

              <span
                className={`
                  text-[1.2rem]
                  font-bold
                  tabular-nums
                  mt-[0.1rem]
                  transition-colors
                  ${
                    timerDanger
                      ? "text-[#ff6b6b] animate-[pulse_0.4s_ease-in-out_infinite]"
                      : timerWarning
                      ? "text-[#ffd93d] animate-[pulse_0.8s_ease-in-out_infinite]"
                      : "text-[#ff6b6b]"
                  }
                  max-[420px]:text-[1rem]
                `}
              >
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Header */}
          <div
            className="
              text-center
              mb-5
            "
          >
            <h1
              className="
                text-[1.6rem]
                font-bold
                bg-gradient-to-br
                from-[#7c8cff]
                to-[#b47cff]
                bg-clip-text
                text-transparent
                mb-[0.15rem]
                max-[420px]:text-[1.3rem]
              "
            >
              Pick Your Cartelas
            </h1>
            {playerCount > 0 && (
              <p className="text-[0.8rem] text-[rgba(255,255,255,0.4)]">
                👥 {playerCount} players • 🏆 {estimatedWin} ETB prize
              </p>
            )}
          </div>

          {/* Waiting banner */}
          {showWaitingBanner && (
            <div
              className="
                mb-4
                flex items-center justify-center gap-2
                rounded-[12px]
                border border-[rgba(124,140,255,0.25)]
                bg-[rgba(124,140,255,0.08)]
                px-3 py-2
                text-[0.85rem] font-semibold text-[#a8b4ff]
              "
            >
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#7c8cff]" />
              Waiting for next round…
            </div>
          )}

          {/* Number Grid */}
          <div
            className="
              grid
              grid-cols-5
              gap-[0.6rem]
              mb-5
              max-[420px]:gap-[0.4rem]
              max-[360px]:gap-[0.3rem]
            "
          >
            {numbers.map((number) => {
              const isSelected = selectedNums.includes(number);
              const isTaken = takenCards.includes(number);
              // Reserved by someone else — only matters if not our own selection
              const isReserved =
                !isSelected && !isTaken && (reservedCards[number] || 0) > 0;
              const isDisabled = !isGameActive || isTaken || isStarting;

              return (
                <button
                  key={number}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleNumberClick(number)}
                  className={`
                    aspect-square
                    relative
                    flex
                    items-center
                    justify-center
                    rounded-[12px]
                    border-2
                    font-[inherit]
                    text-[1.1rem]
                    font-semibold
                    transition-all
                    duration-[250ms]
                    ease-in-out

                    ${
                      isTaken
                        ? `
                          bg-[rgba(255,255,255,0.02)]
                          border-[rgba(255,255,255,0.03)]
                          text-[rgba(255,255,255,0.15)]
                          cursor-not-allowed
                          line-through
                        `
                        : !isGameActive || isStarting
                        ? `
                          bg-[rgba(255,255,255,0.02)]
                          border-[rgba(255,255,255,0.03)]
                          text-[rgba(255,255,255,0.15)]
                          cursor-not-allowed
                        `
                        : isSelected
                        ? `
                          bg-gradient-to-br
                          from-[#7c8cff]
                          to-[#b47cff]
                          border-[#7c8cff]
                          text-white
                          scale-[1.05]
                          shadow-[0_8px_30px_rgba(124,140,255,0.3)]
                        `
                        : isReserved
                        ? `
                          bg-[rgba(255,180,60,0.06)]
                          border-[rgba(255,180,60,0.4)]
                          text-[rgba(255,200,110,0.9)]
                          cursor-pointer
                          hover:bg-[rgba(255,180,60,0.12)]
                          hover:border-[rgba(255,180,60,0.55)]
                          active:scale-[0.95]
                        `
                        : `
                          bg-[rgba(255,255,255,0.04)]
                          border-[rgba(255,255,255,0.06)]
                          text-[rgba(255,255,255,0.7)]
                          cursor-pointer
                          hover:bg-[rgba(124,140,255,0.1)]
                          hover:border-[rgba(124,140,255,0.3)]
                          hover:-translate-y-0.5
                          hover:shadow-[0_8px_25px_rgba(124,140,255,0.1)]
                          active:scale-[0.95]
                        `
                    }

                    max-[420px]:text-[0.9rem]
                    max-[420px]:rounded-[10px]

                    max-[360px]:text-[0.75rem]
                    max-[360px]:rounded-[8px]
                  `}
                >
                  {number}

                  {isTaken && (
                    <span
                      className="
                        absolute
                        text-[0.6rem]
                        text-[rgba(255,255,255,0.2)]
                      "
                    >
                      🔒
                    </span>
                  )}

                  {!isGameActive && !isTaken && !isStarting && (
                    <span
                      className="
                        absolute
                        text-[0.6rem]
                        text-[rgba(255,255,255,0.1)]
                      "
                    >
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Display */}
          <div
            className="
              bg-[rgba(255,255,255,0.02)]
              border
              border-[rgba(255,255,255,0.04)]
              rounded-[12px]
              py-3
              px-5
              flex
              justify-between
              items-center
              gap-3
            "
          >
            <span
              className="
                text-[rgba(255,255,255,0.4)]
                text-[0.8rem]
                font-medium
                whitespace-nowrap
              "
            >
              Selected ({selectedNums.length}/{MAX_SELECTIONS})
            </span>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {selectedNums.length === 0 ? (
                <span
                  className="
                    text-[1.1rem]
                    font-bold
                    text-[rgba(255,255,255,0.2)]
                  "
                >
                  —
                </span>
              ) : (
                selectedNums.map((num) => (
                  <span
                    key={num}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      min-w-[34px]
                      h-[34px]
                      px-2
                      rounded-[8px]
                      bg-gradient-to-br
                      from-[#7c8cff]
                      to-[#b47cff]
                      text-white
                      text-[0.95rem]
                      font-bold
                      shadow-[0_4px_14px_rgba(124,140,255,0.35)]
                      max-[420px]:min-w-[30px]
                      max-[420px]:h-[30px]
                      max-[420px]:text-[0.85rem]
                    "
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Starting overlay */}
      {isStarting && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-[rgba(11,13,21,0.85)]
            backdrop-blur-[6px]
            animate-[fadeIn_0.25s_ease-out]
          "
        >
          <div
            className="
              flex flex-col items-center gap-5
              px-8 py-9
              rounded-[24px]
              border border-[rgba(124,140,255,0.18)]
              bg-[rgba(255,255,255,0.04)]
              shadow-[0_20px_60px_rgba(0,0,0,0.6)]
              max-[420px]:px-6 max-[420px]:py-7
            "
          >
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-[rgba(124,140,255,0.15)]" />
              <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7c8cff] border-r-[#b47cff] animate-spin" />
              <span className="text-[1.6rem] font-bold text-[#b47cff] tabular-nums">
                {startCountdown}
              </span>
            </div>

            <div className="text-center">
              <p
                className="
                  text-[1.1rem] font-bold
                  bg-gradient-to-br from-[#7c8cff] to-[#b47cff]
                  bg-clip-text text-transparent
                "
              >
                Game Starting…
              </p>
              <p className="mt-1 text-[0.8rem] text-[rgba(255,255,255,0.45)]">
                Locking in your cartelas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }

          50% {
            opacity: 0.4;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}