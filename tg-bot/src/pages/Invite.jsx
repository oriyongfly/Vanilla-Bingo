import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ApiClient from "../utils/ApiClient";

const INVITE_ENDPOINT = "/api/invite";
const GOAL = 40;

const Icon = ({ name, size = 20, className = "" }) => {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round",
    strokeLinejoin: "round", className, "aria-hidden": true,
  };

  const icons = {
    copy: <><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></>,
    share: <><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.9 7.6-4.7"/><path d="m8.2 13.1 7.6 4.7"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"/><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15"/></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M12 8H8.5a2.5 2.5 0 1 1 2.1-3.87L12 8Z"/><path d="M12 8h3.5a2.5 2.5 0 1 0-2.1-3.87L12 8Z"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    loader: <path d="M12 3a9 9 0 1 0 9 9"/>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5h.01"/></>,
  };

  return <svg {...common}>{icons[name]}</svg>;
};

const getApiData = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Failed to load invite data.";

const getUser = (auth) => auth?.user || auth?.currentUser || null;

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed left-1/2 top-4 z-[100] w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-xl backdrop-blur ${
        type === "error"
          ? "border-red-500/20 bg-[#111722]/95 text-red-300"
          : "border-[#8b7cff]/25 bg-[#111722]/95 text-white"
      }`}>
        <Icon name={type === "error" ? "alert" : "check"} size={16}
          className={type === "error" ? "text-red-400" : "text-[#9d93ff]"} />
        <p className="flex-1 text-xs font-medium">{message}</p>
        <button type="button" onClick={onClose} className="text-xs text-[#8f98a8]">×</button>
      </div>
    </div>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-[#242b39]/80 bg-[#111722] shadow-sm ${className}`}>
    {children}
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#242b39]">
    <div className="h-full rounded-full bg-[#8b7cff] transition-all duration-500"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
  </div>
);

const Avatar = ({ name }) => (
  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#8b7cff]/20 bg-[#242b39] text-[10px] font-bold text-[#c9c4ff]">
    {String(name || "U").trim().charAt(0).toUpperCase() || "U"}
  </div>
);

export default function Invite() {
  const auth = useAuth();
  const user = getUser(auth);

  const [invitedUsers, setInvitedUsers] = useState([]);
  const [totalInvites, setTotalInvites] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const progress = Math.min((totalInvites / GOAL) * 100, 100);
  const remaining = Math.max(GOAL - totalInvites, 0);

  const inviteLink = useMemo(() => {
    if (!user?.referral_id) return "";
    const botUrl = process.env.REACT_APP_BOT_URL || "";
    return botUrl ? `${botUrl}?start=ref_${user.referral_id}` : "";
  }, [user?.referral_id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((current) =>
        current.message === message ? { message: "", type: "success" } : current
      );
    }, 2500);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInviteData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (typeof ApiClient?.get !== "function") {
          throw new Error("ApiClient.get is not available in this project.");
        }

        const response = await ApiClient.get(INVITE_ENDPOINT);
        const data = getApiData(response) || {};

        if (!cancelled) {
          setInvitedUsers(data.invited_users || []);
          setTotalInvites(Number(data.invite_count) || 0);
        }
      } catch (error) {
        if (!cancelled) showToast(getErrorMessage(error), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInviteData();
    return () => { cancelled = true; };
  }, [user?.id, user?.referral_id]);

  const handleCopyLink = async () => {
    if (!inviteLink) {
      showToast("Invite link not ready", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast("Invite link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me!",
          text: "Use my referral link",
          url: inviteLink,
        });
      } catch {
        // User cancelled the native share sheet.
      }
    } else {
      await handleCopyLink();
    }
  };

  const handleInviteViaTelegram = () => {
    if (!inviteLink) {
      showToast("Invite link not ready", "error");
      return;
    }

    const text = `Play a game with me in here ! ${inviteLink}`;
    const telegramUrl =
      `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}` +
      `&text=${encodeURIComponent(text)}`;

    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  if (!user || loading) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center bg-[#0d1019]">
          <Icon name="loader" size={25} className="animate-spin text-[#8b7cff]" />
        </div>
        <Toast message={toast.message} type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1019] px-2.5 pb-24 pt-2 text-white">
      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })} />

      <div className="mx-auto max-w-sm space-y-3">
        {/* Coupon was a separate dependency in the original component.
            Keep the page independent; add the project's native Coupon here if needed. */}

        <div className="flex items-center justify-between px-0.5">
          <div>
            <h1 className="text-base font-bold">Invite Friends</h1>
            <p className="text-[10px] text-[#8f98a8]">
              Earn 50 ETB by inviting 40 friends
            </p>
          </div>

          <div className="flex items-center rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/10 px-2 py-1 text-[10px] font-semibold text-[#bcb6ff]">
            <Icon name="gift" size={12} className="mr-1" />
            50 ETB
          </div>
        </div>

        <Card>
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="users" size={16} className="text-[#8f98a8]" />
                <span className="text-xs font-medium">Total Invites</span>
              </div>
              <p className="text-xl font-bold">{totalInvites}</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#8f98a8]">
                <span>Progress to reward</span>
                <span>{totalInvites} / {GOAL}</span>
              </div>

              <ProgressBar value={progress} />

              {remaining > 0 ? (
                <p className="text-[9px] text-[#8f98a8]">
                  {remaining} more invite{remaining > 1 ? "s" : ""} needed
                </p>
              ) : (
                <p className="text-[9px] font-medium text-green-400">
                  🎉 Reward unlocked! Claim 50 ETB.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-3 pb-1 pt-2.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="link" size={16} />
              Your Invite Link
            </h2>
          </div>

          <div className="space-y-2.5 p-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#242b39] bg-[#0d1019]/60 p-1.5">
              <input
                value={inviteLink}
                readOnly
                aria-label="Invite link"
                className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-[10px] text-[#c8ced9] outline-none"
              />

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-7 shrink-0 items-center rounded-lg bg-[#8b7cff] px-2.5 text-[10px] font-semibold text-white transition hover:bg-[#796ef0] active:scale-[0.98]"
              >
                {copied ? (
                  <><Icon name="check" size={12} className="mr-1" />Copied</>
                ) : (
                  <><Icon name="copy" size={12} className="mr-1" />Copy</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                className="flex h-8 items-center justify-center rounded-xl border border-[#242b39] bg-transparent text-[10px] font-semibold text-white transition hover:bg-[#242b39]"
              >
                <Icon name="share" size={12} className="mr-1" />
                Share
              </button>

              <button
                type="button"
                onClick={handleInviteViaTelegram}
                className="h-8 rounded-xl bg-[#8b7cff] text-[10px] font-semibold text-white transition hover:bg-[#796ef0]"
              >
                Telegram
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-3 pb-1 pt-2.5">
            <h2 className="text-sm font-semibold">People You Invited</h2>
          </div>

          <div className="space-y-1.5 px-3 pb-3">
            {invitedUsers.length === 0 ? (
              <p className="py-1 text-[11px] text-[#8f98a8]">
                No invites yet – share your link!
              </p>
            ) : (
              invitedUsers.map((invitedUser, index) => {
                const id = invitedUser?.id ?? invitedUser?._id ?? index;
                const name = invitedUser?.Fname || "Unknown";

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-[#242b39]/60 bg-[#0d1019]/20 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={name} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-white">
                          {name}
                        </p>
                        <p className="text-[9px] text-[#8f98a8]">Joined</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}