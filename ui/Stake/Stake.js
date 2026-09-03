// === Staking Controller ===
(function() {
  "use strict";

  // DOM Elements
  const stakeBtns = document.querySelectorAll('.btn-stake');
  const stakedDisplay = document.getElementById('stakedDisplay');
  const rewardsDisplay = document.getElementById('rewardsDisplay');
  const balanceDisplay = document.getElementById('balanceDisplay');

  // State
  let stakedAmount = 0;
  let totalRewards = 0;
  const APY = 12.5; // percent
  let balance = 12450; // ETB

  // Update displays
  function updateDisplays() {
    stakedDisplay.textContent = stakedAmount.toFixed(2) + ' ETB';
    rewardsDisplay.textContent = totalRewards.toFixed(2) + ' ETB';
    balanceDisplay.textContent = balance.toFixed(2) + ' ETB';
  }

  // Calculate rewards based on staked amount
  function calculateRewards(amount) {
    return (amount * APY) / 100;
  }

  // Handle stake
  function handleStake(amount) {
    if (amount <= 0) {
      alert('Please enter a valid stake amount.');
      return;
    }

    if (amount > balance) {
      alert('Insufficient balance. You have ' + balance.toFixed(2) + ' ETB available.');
      return;
    }

    // Update state
    stakedAmount += amount;
    totalRewards = calculateRewards(stakedAmount);
    balance -= amount;

    // Update UI
    updateDisplays();

    // Visual feedback
    const btn = document.querySelector(`[data-amount="${amount}"]`);
    if (btn) {
      btn.style.transform = 'scale(0.92)';
      btn.textContent = '✓ Staked';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
        btn.textContent = 'Play';
      }, 800);
    }

    console.log(`✅ Staked ${amount} ETB. Total staked: ${stakedAmount} ETB`);
  }

  // Add event listeners to stake buttons
  stakeBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const amount = parseInt(this.dataset.amount);
      handleStake(amount);
    });
  });

  // Initial display
  updateDisplays();

  console.log('💎 Staking page ready!');
})();