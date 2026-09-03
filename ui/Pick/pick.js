// === Card Pick Controller ===
(function() {
  "use strict";

  // DOM Elements
  const numberBtns = document.querySelectorAll('.number-btn');
  const selectedNumber = document.getElementById('selectedNumber');
  const revealBtn = document.getElementById('revealBtn');
  const mainWalletDisplay = document.getElementById('mainWallet');
  const playWalletDisplay = document.getElementById('playWallet');
  const stakeDisplay = document.getElementById('stakeDisplay');
  const timerDisplay = document.getElementById('timerDisplay');

  // State
  let selectedNum = null;
  let mainWallet = 50000;
  let playWallet = 12450;
  let stakeAmount = 100;
  let timeLeft = 300; // 5 minutes in seconds
  let timerInterval = null;
  let isTimerRunning = false;
  const usedNumbers = new Set();

  // Prize mapping (random prizes for each number)
  const prizes = {
    1: { amount: 50, label: '50 ETB' },
    2: { amount: 100, label: '100 ETB' },
    3: { amount: 25, label: '25 ETB' },
    4: { amount: 200, label: '200 ETB' },
    5: { amount: 75, label: '75 ETB' },
    6: { amount: 500, label: '500 ETB' },
    7: { amount: 150, label: '150 ETB' },
    8: { amount: 30, label: '30 ETB' },
    9: { amount: 1000, label: '1,000 ETB' },
    10: { amount: 80, label: '80 ETB' },
    11: { amount: 250, label: '250 ETB' },
    12: { amount: 40, label: '40 ETB' },
    13: { amount: 120, label: '120 ETB' },
    14: { amount: 60, label: '60 ETB' },
    15: { amount: 300, label: '300 ETB' },
    16: { amount: 90, label: '90 ETB' },
    17: { amount: 450, label: '450 ETB' },
    18: { amount: 35, label: '35 ETB' },
    19: { amount: 150, label: '150 ETB' },
    20: { amount: 750, label: '750 ETB' }
  };

  // Update displays
  function updateDisplays() {
    mainWalletDisplay.textContent = mainWallet.toFixed(2) + ' ETB';
    playWalletDisplay.textContent = playWallet.toFixed(2) + ' ETB';
    stakeDisplay.textContent = stakeAmount + ' ETB';
  }

  // Update timer display
  function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Change color based on time left
    timerDisplay.classList.remove('warning', 'danger');
    if (timeLeft <= 30) {
      timerDisplay.classList.add('danger');
    } else if (timeLeft <= 60) {
      timerDisplay.classList.add('warning');
    }
  }

  // Start timer
  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerDisplay.textContent = '00:00';
        timerDisplay.classList.add('danger');
        // Auto-reset or handle timeout
        handleTimeout();
      }
    }, 1000);
  }

  // Handle timer timeout
  function handleTimeout() {
    // Disable all number buttons
    numberBtns.forEach(btn => {
      btn.disabled = true;
      btn.style.cursor = 'not-allowed';
    });
    revealBtn.disabled = true;
    revealBtn.classList.remove('active');
    alert('⏰ Time is up! Please start a new round.');
  }

  // Reset timer
  function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 300;
    updateTimerDisplay();
    // Re-enable buttons
    numberBtns.forEach(btn => {
      btn.disabled = false;
      btn.style.cursor = 'pointer';
    });
  }

  // Handle number selection
  numberBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const number = parseInt(this.dataset.number);

      // If number is already used or timer is done, ignore
      if (usedNumbers.has(number) || timeLeft <= 0) {
        return;
      }

      // Start timer on first selection
      if (!isTimerRunning && !usedNumbers.size) {
        startTimer();
      }

      // Deselect previous selection
      numberBtns.forEach(b => b.classList.remove('selected'));

      // Select new number
      this.classList.add('selected');
      selectedNum = number;
      selectedNumber.textContent = number;
      selectedNumber.classList.add('active');

      // Enable reveal button
      revealBtn.classList.add('active');
      revealBtn.disabled = false;

      // Visual feedback
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1.05)';
      }, 150);
    });
  });

  // Handle reveal
  revealBtn.addEventListener('click', function() {
    if (selectedNum === null || usedNumbers.has(selectedNum) || timeLeft <= 0) {
      return;
    }

    // Get prize
    const prize = prizes[selectedNum] || { amount: 0, label: '0 ETB' };

    // Add to used numbers
    usedNumbers.add(selectedNum);

    // Mark button as used
    const selectedBtn = document.querySelector(`.number-btn[data-number="${selectedNum}"]`);
    if (selectedBtn) {
      selectedBtn.classList.remove('selected');
      selectedBtn.classList.add('used');
    }

    // Update play wallet with prize
    playWallet += prize.amount;
    updateDisplays();

    // Navigate to result page with prize info
    const resultData = {
      number: selectedNum,
      prize: prize.amount,
      prizeLabel: prize.label,
      newBalance: playWallet,
      mainWallet: mainWallet,
      stakeAmount: stakeAmount,
      timeLeft: timeLeft
    };

    // Store data for result page
    localStorage.setItem('pickResult', JSON.stringify(resultData));

    // Navigate to result page
    window.location.href = 'Result.html';

    // Visual feedback
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);
  });

  // Initial display
  updateDisplays();
  updateTimerDisplay();

  // Auto-start timer (optional)
  // startTimer();

  console.log('🎯 Card pick page ready!');
  console.log(`💰 Main Wallet: ${mainWallet} ETB, Play Wallet: ${playWallet} ETB`);
  console.log(`⏱️ Timer: 5:00 minutes`);
})();