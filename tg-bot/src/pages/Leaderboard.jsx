import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../utils/ApiClient";
import { useAuth } from "../context/AuthContext";

/*
 * Leaderboard.jsx
 *
 * Full project-native port:
 * - React + Tailwind only
 * - No shadcn/ui
 * - No React Query
 * - No lucide-react
 * - No DailyStreak dependency
 *
 * HomePage palette:
 *   background: #0d1019
 *   surface:    #111722
 *   border:     #242b39
 *   muted:      #8f98a8
 *   accent:     #8b7cff
 *
 * If the backend route differs, change only LEADERBOARD_ENDPOINT below.
 */

const LEADERBOARD_ENDPOINT = "/api/stat/daily-leaderboard";

const PERIODS = [
  { value: "today", label: "Today", offset: 0 },
  { value: "yesterday", label: "Yesterday", offset: 1 },
  { value: "2days", label: "2 Days Ago", offset: 2 },
  { value: "3days", label: "3 Days Ago", offset: 3 },
];

const Icon = ({ name, size = 20, className = "" }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const paths = {
    trophy: (
      <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v2a4 4 0 0 0 4 4" />
        <path d="M17 6h3v2a4 4 0 0 1-4 4" />
      </>
    ),
    medal: (
      <>
        <path d="M8 3h8l-2 5H10L8 3Z" />
        <circle cx="12" cy="15" r="5" />
        <path d="m9.8 15 1.4 1.4 2.9-3" />
      </>
    ),
    coins: (
      <>
        <circle cx="9" cy="9" r="5" />
        <path d="M14 7.5A5 5 0 1 1 7.5 14" />
        <path d="M14 7.5a5 5 0 0 1 5 5" />
        <path d="M14 12.5a5 5 0 0 1-5 5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.9-4L3 10" />
        <path d="M3 4v6h6" />
        <path d="M4 13a8 8 0 0 0 14.9 4L21 14" />
        <path d="M21 20v-6h-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
};

const getDateForPeriod = (period) => {
  const selected = PERIODS.find((item) => item.value === period);
  const date = new Date();

  date.setDate(date.getDate() - (selected?.offset ?? 0));

  // Use local calendar date rather than UTC so the leaderboard follows
  // the user's/backend's normal daily boundary.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatNumber = (value) => String(value).padStart(2, "0");

const formatPoints = (points) =>
  Number(points || 0).toLocaleString();

const getInitials = (name) => {
  const safeName = String(name || "User").trim() || "User";
  const parts = safeName.split(/\s+/);

  if (parts.length === 1) {
    return safeName.slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getApiData = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Failed to load leaderboard"
  );
};

const fetchLeaderboard = async (selectedDate) => {
  const separator = LEADERBOARD_ENDPOINT.includes("?") ? "&" : "?";
  const url = `${LEADERBOARD_ENDPOINT}${separator}date=${encodeURIComponent(selectedDate)}`;
  const response = await apiClient.get(url);
  return getApiData(response);
};

const normalizePlayers = (data, currentUserId) => {
  const apiPlayers =
    data?.leaderboard ||
    data?.data?.leaderboard ||
    [];

  return apiPlayers.map((player) => {
    const name =
      player.fname?.trim() ||
      player.username?.trim() ||
      player.phone ||
      "User";

    const playerId = String(player.user_id ?? player.id ?? "");

    return {
      id: playerId,
      name,
      phone: player.phone ?? undefined,
      points: Number(player.total_points) || 0,
      prize: Number(player.reward) || 0,
      rank: Number(player.rank) || 0,
      isCurrentUser:
        currentUserId != null && currentUserId === playerId,
    };
  });
};

const getRankBadgeClass = (rank) => {
  if (rank === 1) {
    return "bg-[#f5c451] text-[#332500] border-[#f7d675]";
  }

  if (rank === 2) {
    return "bg-[#b9c0cc] text-[#252a33] border-[#d7dce3]";
  }

  if (rank === 3) {
    return "bg-[#a7652e] text-[#fff1e5] border-[#c57c42]";
  }

  return "bg-[#242b39] text-[#8f98a8] border-[#30394a]";
};

const getRankRowClass = (rank) => {
  if (rank === 1) return "border-[#f5c451]/40 bg-[#f5c451]/[0.07]";
  if (rank === 2) return "border-[#b9c0cc]/30 bg-white/[0.025]";
  if (rank === 3) return "border-[#a7652e]/30 bg-[#a7652e]/[0.06]";
  return "";
};

const rankEmoji = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const rankGradient = {
  1: "from-[#f5c451] to-[#e4a72c]",
  2: "from-[#cbd1da] to-[#9099a7]",
  3: "from-[#a7652e] to-[#8c4e24]",
};

const CountdownBox = ({ value, label }) => (
  <div className="min-w-[46px] rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-center">
    <div className="text-[17px] font-extrabold leading-none">{value}</div>
    <div className="mt-1 text-[8px] font-semibold tracking-wider text-white/50">
      {label}
    </div>
  </div>
);

const CountdownSeparator = () => (
  <span className="text-sm font-bold text-white/40">:</span>
);

const Avatar = ({ name, large = false }) => (
  <div
    className={[
      "flex shrink-0 items-center justify-center rounded-full border border-[#8b7cff]/25 bg-[#242b39] font-bold text-[#c9c4ff]",
      large ? "h-14 w-14 text-sm" : "h-6 w-6 text-[8px]",
    ].join(" ")}
  >
    {getInitials(name)}
  </div>
);

const TopPlayerCard = ({ player }) => {
  const isFirst = player.rank === 1;

  return (
    <div
      className={[
        "relative flex min-w-0 max-w-full flex-col items-center overflow-hidden rounded-xl p-3 text-center transition-all",
        isFirst
          ? "scale-[1.03] border-2 border-[#f5c451]/70 bg-[#f5c451]/[0.06] shadow-lg shadow-black/20"
          : `border ${getRankRowClass(player.rank)} bg-[#111722]`,
      ].join(" ")}
    >
      <div
        className={[
          "absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b px-2 py-0.5 text-[10px] font-bold text-white shadow-sm",
          rankGradient[player.rank] || "from-[#242b39] to-[#1a202c]",
        ].join(" ")}
      >
        {rankEmoji[player.rank] || `#${player.rank}`} #{player.rank}
      </div>

      <div className="mt-1">
        <Avatar name={player.name} large />
      </div>

      <p className="mt-1.5 w-full truncate text-xs font-bold text-white">
        {player.name}
      </p>

      {player.phone && (
        <p className="w-full truncate text-[9px] text-[#8f98a8]">
          {player.phone}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[10px]">
        <span className="font-bold text-[#9d93ff]">
          {formatPoints(player.points)} pts
        </span>
        <span className="font-bold text-[#f5c451]">
          {formatPoints(player.prize)} ETB
        </span>
      </div>

      {player.isCurrentUser && (
        <span className="mt-1 rounded-full border border-[#8b7cff]/30 bg-[#8b7cff]/10 px-1.5 py-0.5 text-[7px] font-bold text-[#bcb6ff]">
          YOU
        </span>
      )}
    </div>
  );
};

const PlayerRow = ({ player }) => (
  <div
    className={[
      "grid grid-cols-[minmax(0,1fr)_minmax(auto,70px)_minmax(auto,60px)] items-center gap-1.5 border-b border-[#242b39] px-1 py-1.5",
      player.isCurrentUser ? "rounded-lg bg-[#8b7cff]/[0.07]" : "",
    ].join(" ")}
  >
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      <div
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold",
          getRankBadgeClass(player.rank),
        ].join(" ")}
      >
        {player.rank}
      </div>

      <Avatar name={player.name} />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-center gap-1">
          <p className="truncate text-xs font-semibold leading-tight text-white">
            {player.name}
          </p>

          {player.isCurrentUser && (
            <span className="shrink-0 rounded-full bg-[#8b7cff]/10 px-1 py-0.5 text-[7px] font-bold text-[#bcb6ff]">
              YOU
            </span>
          )}
        </div>

        {player.phone && (
          <p className="truncate text-[8px] text-[#8f98a8]">
            {player.phone}
          </p>
        )}
      </div>
    </div>

    <div className="min-w-0 text-right">
      <p className="truncate text-xs font-bold text-[#9d93ff]">
        {formatPoints(player.points)}
      </p>
    </div>

    <div className="flex items-center justify-end gap-0.5">
      <p className="truncate text-xs font-bold text-white">
        {formatPoints(player.prize)} ETB
      </p>
      <Icon
        name="chevron"
        size={11}
        className="hidden text-[#8f98a8]/50 sm:block"
      />
    </div>
  </div>
);

export default function Leaderboard() {
  const { user } = useAuth();
  const currentUserId =
    user?.telegramId != null ? String(user.telegramId) : null;

  const [period, setPeriod] = useState("today");
  const [players, setPlayers] = useState([]);
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedDate = useMemo(() => getDateForPeriod(period), [period]);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchLeaderboard(selectedDate);

        if (!cancelled) {
          setPlayers(normalizePlayers(data, currentUserId));
        }
      } catch (requestError) {
        if (!cancelled) {
          setPlayers([]);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, currentUserId]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);

      tomorrow.setHours(24, 0, 0, 0);

      const diff = Math.max(
        Math.floor((tomorrow.getTime() - now.getTime()) / 1000),
        0
      );

      setCountdown({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const topThree = useMemo(
    () =>
      players
        .filter((player) => player.rank <= 3)
        .sort((a, b) => a.rank - b.rank),
    [players]
  );

  const podiumPlayers = useMemo(() => {
    const rank1 = topThree.find((player) => player.rank === 1);
    const rank2 = topThree.find((player) => player.rank === 2);
    const rank3 = topThree.find((player) => player.rank === 3);

    // [2nd, 1st, 3rd] gives the center position to the winner.
    return [rank2, rank1, rank3].filter(Boolean);
  }, [topThree]);

  const remainingPlayers = useMemo(
    () =>
      players
        .filter((player) => player.rank > 3)
        .sort((a, b) => a.rank - b.rank),
    [players]
  );

  return (
    <div className="w-full min-w-0 bg-[#0d1019] px-[17px] pb-4 pt-[5px] text-white">
      {/* Daily cashback header */}
      <div className="relative mt-2.5 min-h-[155px] overflow-hidden rounded-2xl border border-[#242b39] bg-gradient-to-br from-[#171d2a] via-[#111722] to-[#0d1019] px-4 py-4">
        <div className="pointer-events-none absolute -right-12 -top-8 h-44 w-44 rounded-full border-[6px] border-[#8b7cff]/10" />
        <div className="pointer-events-none absolute -right-4 top-6 h-32 w-32 rounded-full border-2 border-[#8b7cff]/10" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8b7cff]/10 text-[#9d93ff]">
              <Icon name="coins" size={19} />
            </div>

            <div>
              <h2 className="text-[20px] font-bold leading-tight">
                Daily Cashback
              </h2>
              <p className="text-[10px] text-[#8f98a8]">
                Next reward resets in
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            <CountdownBox
              value={formatNumber(countdown.hours)}
              label="HRS"
            />
            <CountdownSeparator />
            <CountdownBox
              value={formatNumber(countdown.minutes)}
              label="MIN"
            />
            <CountdownSeparator />
            <CountdownBox
              value={formatNumber(countdown.seconds)}
              label="SEC"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -right-3 top-[47px] z-20 -rotate-6">
          <div className="relative flex h-[78px] w-[120px] items-center justify-center rounded-[20px] border-[5px] border-[#8b7cff]/40 bg-[#8b7cff]/15 shadow-lg shadow-black/20">
            <div className="absolute inset-[5px] rounded-[13px] border border-[#8b7cff]/30" />
            <div className="relative text-center text-[22px] font-black leading-[0.85] tracking-tight text-[#c9c4ff]">
              CASH
              <br />
              BACK
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="w-full min-w-0 pb-4">
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#242b39] bg-[#111722] shadow-lg shadow-black/10">
          <div className="border-b border-[#242b39] px-3 pb-2 pt-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8b7cff]/10 text-[#9d93ff]">
                <Icon name="trophy" size={16} />
              </div>

              <div>
                <h1 className="text-base font-bold leading-tight">
                  Leaderboard
                </h1>
                <p className="text-[10px] text-[#8f98a8]">
                  Compete and win daily prizes
                </p>
              </div>
            </div>

            <div className="flex h-8 w-full gap-0.5 overflow-x-auto rounded-lg bg-[#0d1019] p-0.5 [scrollbar-width:none]">
              {PERIODS.map((item) => {
                const active = period === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPeriod(item.value)}
                    className={[
                      "h-7 shrink-0 rounded-md px-2.5 text-[10px] font-semibold transition-colors",
                      active
                        ? "bg-[#8b7cff] text-white shadow-sm"
                        : "text-[#8f98a8] hover:bg-[#242b39] hover:text-white",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3">
            {loading && (
              <div className="flex flex-col items-center justify-center py-10">
                <Icon
                  name="refresh"
                  size={20}
                  className="animate-spin text-[#8b7cff]"
                />
                <p className="mt-2 text-sm text-[#8f98a8]">
                  Loading leaderboard...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-[#ef6b73]/10 p-3 text-[#ef7b82]">
                  <Icon name="refresh" size={20} />
                </div>
                <p className="mt-2 text-sm font-medium text-white">
                  Failed to load leaderboard
                </p>
                <p className="mt-1 max-w-[280px] text-[10px] text-[#8f98a8]">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && (
              <>
                {podiumPlayers.length > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {podiumPlayers.map((player) => (
                      <TopPlayerCard key={player.id} player={player} />
                    ))}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(auto,70px)_minmax(auto,60px)] items-center gap-1.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9d93ff]">
                    Player
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9d93ff]">
                    Points
                  </span>
                  <span className="text-right text-[10px] font-bold uppercase tracking-wider text-[#9d93ff]">
                    Prize
                  </span>
                </div>

                <div className="my-1.5 h-px bg-[#242b39]" />

                <div className="space-y-0.5 overflow-hidden">
                  {remainingPlayers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Icon
                        name="medal"
                        size={24}
                        className="text-[#8f98a8]/40"
                      />
                      <p className="mt-1.5 text-xs font-medium text-white">
                        {players.length === 0
                          ? "No players yet"
                          : "No more players"}
                      </p>
                    </div>
                  ) : (
                    remainingPlayers.map((player) => (
                      <PlayerRow key={player.id} player={player} />
                    ))
                  )}
                </div>

                {remainingPlayers.length > 0 && (
                  <div className="mt-2 text-center text-[10px] text-[#8f98a8]">
                    Showing {players.length} participants
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}