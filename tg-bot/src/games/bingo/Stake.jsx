import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useSocket } from "../../context/SocketContext";

const stakeOptions = [
  { label: "5 Birr", amount: 5 },
  { label: "10 Birr", amount: 10 },
  { label: "20 Birr", amount: 20 },
  { label: "50 Birr", amount: 50 },
];

export default function Stake() {
  const balance = 12450;
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const statusListenerRef = useRef(null);

  const handleStake = (amount) => {
    if (amount <= 0) {
      alert("Please enter a valid stake amount.");
      return;
    }

    if (amount > balance) {
      alert(
        "Insufficient balance. You have " +
          balance.toFixed(2) +
          " ETB available."
      );
      return;
    }

    const socket = getSocket();
    if (!socket) {
      alert("Connection not ready. Please try again.");
      return;
    }

    // Clean up any previous listener
    if (statusListenerRef.current) {
      socket.off("bingo:status", statusListenerRef.current);
      statusListenerRef.current = null;
    }

    // Listener for the status response
    const onStatus = (response) => {
      socket.off("bingo:status", onStatus);
      statusListenerRef.current = null;

      if (!response) {
        alert("Failed to get game status.");
        return;
      }

      const { phase, gameId, timeLeft, drawnBalls } = response;

      if (phase === "picking") {
        navigate("/bingo/pick", {
          state: { stakeAmount: amount, timeLeft, gameId },
        });
      } else if (phase === "drawing") {
        navigate("/bingo/game", {
          state: {
            stakeAmount: amount,
            gameId,
            spectator: true,
            drawnBalls,
          },
        });
      } else {
        alert("No active game for this stake. Please try again shortly.");
      }
    };

    statusListenerRef.current = onStatus;
    socket.on("bingo:status", onStatus);
    socket.emit("bingo:get_status", { stakeAmount: amount });
  };

  return (
    <div
      className="
        w-full min-h-screen
        bg-[#0b0d15]
        text-white
        flex items-center justify-center
        font-[system-ui,-apple-system,'Segoe_UI',Roboto,'Helvetica_Neue',sans-serif]
      "
    >
      <div
        className="
          w-full max-w-[900px]
          p-6
          flex flex-col
          items-center
          justify-center
          gap-6
          max-[760px]:max-w-[520px]
        "
      >
        {/* Main Stake Section */}
        <main className="w-full max-w-[480px]">
          <div
            className="
              w-full
              bg-[rgba(255,255,255,0.03)]
              backdrop-blur-[12px]
              rounded-[24px]
              py-8 px-6
              border border-[rgba(255,255,255,0.06)]
              shadow-[0_20px_60px_rgba(0,0,0,0.5)]
              max-[420px]:py-6
              max-[420px]:px-4
            "
          >
            <div className="flex flex-col gap-4">
              {/* Stake Label */}
              <label
                className="
                  text-[rgba(255,255,255,0.7)]
                  text-[0.85rem]
                  font-medium
                  tracking-[0.03em]
                "
              >
                Select Stake Amount
              </label>

              {/* Stake Options */}
              {stakeOptions.map((option) => (
                <div
                  key={option.amount}
                  className="
                    bg-[rgba(124,140,255,0.06)]
                    border border-[rgba(124,140,255,0.12)]
                    rounded-[14px]
                    py-3 px-5
                    flex
                    justify-between
                    items-center
                    transition-all
                    duration-200
                    ease-in-out
                    hover:border-[rgba(124,140,255,0.3)]
                    hover:bg-[rgba(124,140,255,0.08)]
                  "
                >
                  <span
                    className="
                      text-[rgba(255,255,255,0.8)]
                      text-[1.1rem]
                      font-medium
                      max-[420px]:text-[0.95rem]
                    "
                  >
                    {option.label}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStake(option.amount)}
                    className="
                      px-6 py-[0.6rem]
                      border-none
                      rounded-[10px]
                      text-[0.85rem]
                      font-semibold
                      cursor-pointer
                      transition-all
                      duration-200
                      ease-in-out
                      font-inherit
                      tracking-[0.02em]
                      min-w-[80px]
                      text-white
                      bg-gradient-to-br
                      from-[#7c8cff]
                      to-[#b47cff]
                      shadow-[0_4px_15px_rgba(124,140,255,0.2)]
                      hover:shadow-[0_6px_25px_rgba(124,140,255,0.35)]
                      hover:-translate-y-px
                      active:scale-[0.95]
                      max-[420px]:px-4
                      max-[420px]:py-2
                      max-[420px]:text-[0.8rem]
                      max-[420px]:min-w-[70px]
                    "
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Platform Statistics */}
        <section
          aria-label="Platform statistics"
          className="
            w-full max-w-[480px]
            min-h-[298px]
            py-8 px-6
            flex flex-col
            items-center
            justify-between
            gap-6
            bg-gradient-to-br
            from-[rgba(255,255,255,0.08)]
            to-[rgba(93,91,170,0.18)]
            border border-[rgba(255,255,255,0.2)]
            rounded-[14px]
            shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          "
        >
          {/* Active Players */}
          <div className="text-center">
            <div
              className="
                text-[1.55rem]
                leading-[1.2]
                font-bold
                text-white
                mb-[0.35rem]
              "
            >
              45,000+
            </div>

            <div
              className="
                text-[0.9rem]
                leading-[1.2]
                font-semibold
                text-[#d9c9e8]
              "
            >
              Active Players
            </div>
          </div>

          {/* Games Played */}
          <div className="text-center">
            <div
              className="
                text-[1.55rem]
                leading-[1.2]
                font-bold
                text-white
                mb-[0.35rem]
              "
            >
              60,000+
            </div>

            <div
              className="
                text-[0.9rem]
                leading-[1.2]
                font-semibold
                text-[#d9c9e8]
              "
            >
              Games Played
            </div>
          </div>

          {/* Winners Daily */}
          <div className="text-center">
            <div
              className="
                text-[1.55rem]
                leading-[1.2]
                font-bold
                text-white
                mb-[0.35rem]
              "
            >
              500+
            </div>

            <div
              className="
                text-[0.9rem]
                leading-[1.2]
                font-semibold
                text-[#d9c9e8]
              "
            >
              Winners Daily
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}