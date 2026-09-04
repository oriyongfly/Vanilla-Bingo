import React, { createContext, useContext } from "react";

const TelegramContext = createContext(null);

export const TelegramProvider = ({ children }) => {
  const tg = window.Telegram?.WebApp || null;

  return (
    <TelegramContext.Provider value={tg}>
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  return useContext(TelegramContext);
};