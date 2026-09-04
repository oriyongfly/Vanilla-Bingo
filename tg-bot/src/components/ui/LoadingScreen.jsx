import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading process - replace with actual loading logic
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 2000); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      id="loadingScreen"
      role="status"
      aria-live="polite"
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-[#0b0d15] z-[9999] transition-opacity duration-400 ease-in-out"
    >
      {/* Spinner + Logo Hybrid */}
      <div className="w-[72px] h-[72px] mb-8 relative flex items-center justify-center">
        {/* Spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[rgba(255,255,255,0.06)] border-t-[#7c8cff] border-r-[#b47cff] animate-spin [animation-duration:1s] [animation-timing-function:cubic-bezier(0.65,0.0,0.35,1.0)] shadow-[0_0_0_1px_rgba(124,140,255,0.1)]" />
        
        {/* Center icon */}
        <span className="text-[2.1rem] text-[rgba(255,255,255,0.15)] animate-pulse [animation-duration:1.8s] [animation-timing-function:ease-in-out] shadow-[0_0_12px_rgba(124,140,255,0.2)]">
          ◈
        </span>
      </div>

      {/* Loading Text */}
      <div className="text-[1.4rem] font-[450] tracking-[0.06em] text-transparent bg-gradient-to-r from-[#b0baff] to-[#d4c8ff] bg-clip-text flex items-center gap-1 relative [text-shadow:0_0_30px_rgba(124,140,255,0.15)]">
        Loading
        <span className="inline-block w-5 text-left text-[#a0aeff] font-semibold animate-[dots_1.4s_steps(4,end)_infinite]">
          …
        </span>
      </div>

      {/* Subtle extra line */}
      <div className="mt-2 text-[0.8rem] tracking-[0.2em] uppercase text-[rgba(255,255,255,0.2)] font-light">
        please wait
      </div>
    </div>
  );
};

export default LoadingScreen;