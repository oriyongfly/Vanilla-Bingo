import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Pick() {
  const location = useLocation();
  const navigate = useNavigate();
  const stakeAmount = location.state?.stakeAmount || 0;
  
  const [selectedNum, setSelectedNum] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50);
  const [isGameActive, setIsGameActive] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const numbers = Array.from({ length: 60 }, (_, i) => i + 1);

  // Redirect if no stake amount
  useEffect(() => {
    if (!location.state?.stakeAmount) {
      navigate('/bingo/stake');
    }
  }, [location.state, navigate]);

  // Timer
  useEffect(() => {
    if (!isTimerRunning || !isGameActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setIsGameActive(false);
          setSelectedNum(null);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isGameActive]);

  const handleNumberClick = (number) => {
    if (!isGameActive) return;

    // If already selected, unselect it
    if (selectedNum === number) {
      setSelectedNum(null);
      return;
    }

    // Select number
    setSelectedNum(number);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const timerDanger = timeLeft <= 10;
  const timerWarning = timeLeft <= 20 && timeLeft > 10;

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
          className="
            bg-[rgba(255,255,255,0.03)]
            backdrop-blur-[12px]
            rounded-[24px]
            p-6
            border
            border-[rgba(255,255,255,0.06)]
            shadow-[0_20px_60px_rgba(0,0,0,0.5)]
            max-[420px]:p-4
          "
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
              Pick Your Cartela
            </h1>
          </div>

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
              const isSelected = selectedNum === number;

              return (
                <button
                  key={number}
                  type="button"
                  disabled={!isGameActive}
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
                      !isGameActive
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

                  {!isGameActive && (
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
            "
          >
            <span
              className="
                text-[rgba(255,255,255,0.4)]
                text-[0.8rem]
                font-medium
              "
            >
              Selected
            </span>

            <span
              className={`
                text-[1.3rem]
                font-bold
                transition-colors
                duration-300
                ${
                  selectedNum !== null
                    ? "text-white"
                    : "text-[rgba(255,255,255,0.2)]"
                }
                max-[420px]:text-[1.1rem]
              `}
            >
              {selectedNum ?? "—"}
            </span>
          </div>
        </div>
      </div>

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
      `}</style>
    </main>
  );
}