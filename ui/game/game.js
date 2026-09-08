(function() {
  "use strict";

  // ── DOM Refs ──
  const resetBtn = document.getElementById('resetBtn');
  const timerDisplay = document.getElementById('timerDisplay');
  const drawCount = document.getElementById('drawCount');
  const currentBall = document.getElementById('currentBall');
  const ballNumber = document.getElementById('ballNumber');
  const ballLetter = document.getElementById('ballLetter');
  const ballsContainer = document.getElementById('elVisibleBallsContainer');
  const winningDialog = document.getElementById('winningDialogContainer');
  const modalClose = document.getElementById('modalClose');
  const modalOkBtn = document.getElementById('modalOkBtn');
  const balloon = document.getElementById('blower-balloon');

  // ── State ──
  let allBalls = [];
  let drawnBalls = [];
  let drawInterval = null;
  let timerInterval = null;
  let timeLeft = 300;
  let isRunning = false;
  let isGameOver = false;
  let isComplete = false;

  // ── Generate Balls ──
  function generateBalls() {
    allBalls = [];
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75]
    ];
    for (let i = 0; i < 5; i++) {
      for (let num = ranges[i][0]; num <= ranges[i][1]; num++) {
        allBalls.push({ number: num, letter: letters[i], color: 'ball-' + letters[i] });
      }
    }
  }

  // ── Shuffle ──
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

// ── Update Tube Display ──
function updateTubeDisplay() {
  // Clear container
  ballsContainer.innerHTML = '';
  
  // Show ALL drawn balls
  const ballsToShow = drawnBalls.slice();
  
  ballsToShow.forEach(function(ball) {
    const ballEl = document.createElement('div');
    ballEl.className = 'ball ' + ball.color;
    ballEl.innerHTML = '<div class="inner-circle"><span>' + ball.number + '</span></div>';
    ballsContainer.appendChild(ballEl);
  });
  
  // If more than 8 balls, switch to vertical flow
  const tube = document.getElementById('tube');
  if (drawnBalls.length > 8) {
    ballsContainer.classList.add('flow-up');
    tube.classList.add('many-balls');
  } else {
    ballsContainer.classList.remove('flow-up');
    tube.classList.remove('many-balls');
  }
  
  // Scroll to show latest balls
  setTimeout(function() {
    ballsContainer.scrollTop = ballsContainer.scrollHeight;
    ballsContainer.scrollLeft = ballsContainer.scrollWidth;
  }, 50);
}

  // ── Draw Ball ──
  function drawBall() {
    if (isGameOver || isComplete) return;
    if (drawnBalls.length >= 75) { finishGame(); return; }

    const ball = allBalls.pop();
    if (!ball) { finishGame(); return; }

    drawnBalls.push(ball);
    drawCount.textContent = '🎱 ' + drawnBalls.length + '/75';

    // Show ball in blower
    ballNumber.textContent = ball.number;
    ballLetter.textContent = ball.letter;
    const colorMap = { 'B': '#008ed6', 'I': '#83d100', 'N': '#e17000', 'G': '#a71906', 'O': '#642e88' };
    ballNumber.style.color = colorMap[ball.letter] || '#fff';

    currentBall.classList.remove('show');
    setTimeout(function() { currentBall.classList.add('show'); }, 50);

    balloon.style.background = 'radial-gradient(ellipse at 40% 35%, ' + colorMap[ball.letter] + '44, rgba(80,40,120,0.5) 100%)';
    setTimeout(function() { balloon.style.background = ''; }, 400);

    // Mark the card
    document.querySelectorAll('.card-wrapper.wide-card td').forEach(function(cell) {
      if (cell.textContent.trim() === String(ball.number)) {
        cell.classList.add('drawn');
      }
    });

    // Check for BINGO
    const winResult = checkBingo();
    if (winResult) {
      showWinningCard(winResult);
      return;
    }

    // Update tube with ALL drawn balls
    updateTubeDisplay();
  }

  // ── Check BINGO - Returns the winning pattern or false ──
  function checkBingo() {
    const card = document.querySelector('.card-wrapper.wide-card table');
    if (!card) return false;
    
    const rows = card.querySelectorAll('tr');
    const winningCells = [];
    
    // ── Check Rows ──
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].querySelectorAll('td');
      let allMarked = true;
      let lineCells = [];
      for (let c = 0; c < 5; c++) {
        if (!cells[c].classList.contains('drawn') && !cells[c].classList.contains('free-space')) {
          allMarked = false;
          break;
        }
        lineCells.push(cells[c]);
      }
      if (allMarked) {
        return { type: 'row', index: r, cells: lineCells };
      }
    }
    
    // ── Check Columns ──
    for (let c = 0; c < 5; c++) {
      let allMarked = true;
      let lineCells = [];
      for (let r = 1; r < rows.length; r++) {
        const cell = rows[r].querySelectorAll('td')[c];
        if (!cell.classList.contains('drawn') && !cell.classList.contains('free-space')) {
          allMarked = false;
          break;
        }
        lineCells.push(cell);
      }
      if (allMarked) {
        return { type: 'column', index: c, cells: lineCells };
      }
    }
    
    // ── Check Diagonal 1 (top-left to bottom-right) ──
    let d1AllMarked = true;
    let d1Cells = [];
    for (let i = 0; i < 5; i++) {
      const cell = rows[i + 1].querySelectorAll('td')[i];
      if (!cell.classList.contains('drawn') && !cell.classList.contains('free-space')) {
        d1AllMarked = false;
        break;
      }
      d1Cells.push(cell);
    }
    if (d1AllMarked) {
      return { type: 'diagonal1', cells: d1Cells };
    }
    
    // ── Check Diagonal 2 (top-right to bottom-left) ──
    let d2AllMarked = true;
    let d2Cells = [];
    for (let i = 0; i < 5; i++) {
      const cell = rows[i + 1].querySelectorAll('td')[4 - i];
      if (!cell.classList.contains('drawn') && !cell.classList.contains('free-space')) {
        d2AllMarked = false;
        break;
      }
      d2Cells.push(cell);
    }
    if (d2AllMarked) {
      return { type: 'diagonal2', cells: d2Cells };
    }
    
    return false; // No BINGO
  }

  // ── Show Winning Card with the matched pattern ──
  function showWinningCard(winResult) {
    isGameOver = true;
    isComplete = true;
    stopDrawing();
    stopTimer();
    
    if (window._ballTimeout) {
      clearTimeout(window._ballTimeout);
      window._ballTimeout = null;
    }
    
    const card = document.querySelector('.card-wrapper.wide-card table');
    const clone = card.cloneNode(true);
    
    clone.querySelectorAll('td').forEach(function(cell) {
      cell.classList.remove('drawn');
    });
    
    const winningNumbers = new Set();
    winResult.cells.forEach(function(cell) {
      const text = cell.textContent.trim();
      if (text !== '★') {
        winningNumbers.add(text);
      }
    });
    
    clone.querySelectorAll('td').forEach(function(cell) {
      const text = cell.textContent.trim();
      if (winningNumbers.has(text) || cell.classList.contains('free-space')) {
        cell.classList.add('win-highlight');
      }
    });
    
    let patternName = '';
    switch(winResult.type) {
      case 'row': patternName = 'Row ' + winResult.index + ' BINGO!';
        break;
      case 'column': patternName = 'Column ' + (winResult.index + 1) + ' BINGO!';
        break;
      case 'diagonal1': patternName = 'Diagonal BINGO!';
        break;
      case 'diagonal2': patternName = 'Diagonal BINGO!';
        break;
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.appendChild(clone);
    
    const centerCard = document.getElementById('center-card');
    centerCard.innerHTML = '';
    centerCard.appendChild(wrapper);
    
    const prize = 50;
    document.getElementById('prize').textContent = '🏆 Prize: ' + prize + ' ETB';
    document.querySelector('#winningDialog header').textContent = '🎉 ' + patternName;
    
    winningDialog.classList.add('show');
  }

  // ── Finish Game ──
  function finishGame() {
    if (isComplete) return;
    isComplete = true;
    isGameOver = true;
    stopDrawing();
    stopTimer();
    timerDisplay.textContent = '✓ DONE';
    timerDisplay.classList.add('complete');
    drawCount.textContent = '🎱 75/75 ✓';
    drawCount.classList.add('complete');
    currentBall.classList.remove('show');
    setTimeout(function() {
      ballNumber.textContent = '🎯';
      ballLetter.textContent = 'DONE';
      currentBall.classList.add('show');
      currentBall.classList.add('complete');
    }, 300);
  }

  // ── Timer ──
  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(function() {
      timeLeft--;
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      timerDisplay.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      timerDisplay.classList.remove('warning', 'danger', 'complete');
      if (timeLeft <= 30) timerDisplay.classList.add('danger');
      else if (timeLeft <= 60) timerDisplay.classList.add('warning');
      if (timeLeft <= 0) {
        stopTimer();
        stopDrawing();
        isGameOver = true;
        timerDisplay.textContent = '00:00';
        timerDisplay.classList.add('danger');
        alert('⏰ Time is up! Click "New" to restart.');
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval);
      timerInterval = null; }
    isRunning = false;
  }

  // ── Drawing Controls ──
  function startDrawing() {
    if (isGameOver || isComplete || drawInterval) return;
    if (!isRunning && drawnBalls.length === 0) startTimer();
    drawInterval = setInterval(drawBall, 2000);
  }

  function stopDrawing() {
    if (drawInterval) { clearInterval(drawInterval);
      drawInterval = null; }
  }

  // ── Reset ──
  function resetGame() {
    stopDrawing();
    stopTimer();
    isRunning = false;
    isGameOver = false;
    isComplete = false;
    drawnBalls = [];
    timeLeft = 300;

    timerDisplay.classList.remove('warning', 'danger', 'complete');
    timerDisplay.textContent = '05:00';
    drawCount.textContent = '🎱 0/75';
    drawCount.classList.remove('complete');

    currentBall.classList.remove('show', 'complete');
    ballNumber.textContent = '—';
    ballLetter.textContent = 'B';
    ballNumber.style.color = '#fff';
    balloon.style.background = '';

    ballsContainer.innerHTML = '';
    document.querySelectorAll('.card-wrapper td').forEach(function(cell) {
      cell.classList.remove('drawn');
    });

    winningDialog.classList.remove('show');
    generateBalls();
    shuffle(allBalls);

    setTimeout(startDrawing, 500);
  }

  // ── Events ──
  resetBtn.addEventListener('click', resetGame);
  modalClose.addEventListener('click', function() { winningDialog.classList.remove('show'); });
  modalOkBtn.addEventListener('click', function() { winningDialog.classList.remove('show'); });
  winningDialog.addEventListener('click', function(e) {
    if (e.target === winningDialog) winningDialog.classList.remove('show');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'r' || e.key === 'R') resetBtn.click();
    if (e.key === 'Escape') winningDialog.classList.remove('show');
    if (e.key === ' ') { e.preventDefault();
      stopDrawing(); }
  });

  // ── Init ──
  generateBalls();
  shuffle(allBalls);
  setTimeout(startDrawing, 800);

})();