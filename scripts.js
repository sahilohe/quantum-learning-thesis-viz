/* ============================================
   QUANTUM LEARNING THESIS — Interactive Vizzes
   ============================================ */

(function () {
  'use strict';

  // ==========================================
  // HERO — animated cellular automata grid
  // ==========================================
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas.getContext('2d');
  let heroGrid, heroCells;

  function initHero() {
    const rect = heroCanvas.parentElement.getBoundingClientRect();
    heroCanvas.width = window.innerWidth;
    heroCanvas.height = window.innerHeight;
    const cols = Math.floor(heroCanvas.width / 16);
    const rows = Math.floor(heroCanvas.height / 16);
    heroGrid = { cols, rows };
    heroCells = [];
    for (let i = 0; i < rows; i++) {
      heroCells[i] = [];
      for (let j = 0; j < cols; j++) {
        heroCells[i][j] = Math.random() < 0.5 ? 1 : 0;
      }
    }
  }

  function updateHero() {
    const { rows, cols } = heroGrid;
    const next = [];
    for (let i = 0; i < rows; i++) {
      next[i] = [];
      for (let j = 0; j < cols; j++) {
        const sum = heroCells[(i - 1 + rows) % rows][j]
                  + heroCells[(i + 1) % rows][j]
                  + heroCells[i][(j - 1 + cols) % cols]
                  + heroCells[i][(j + 1) % cols];
        next[i][j] = (sum === 2) ? heroCells[i][j] : (sum === 3) ? 1 : 0;
      }
    }
    heroCells = next;
  }

  function drawHero() {
    const { rows, cols } = heroGrid;
    const w = heroCanvas.width / cols;
    const h = heroCanvas.height / rows;
    heroCtx.fillStyle = '#f5f0e6';
    heroCtx.fillRect(0, 0, heroCanvas.width, heroCanvas.height);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (heroCells[i][j]) {
          heroCtx.fillStyle = '#d4cdc0';
          heroCtx.fillRect(j * w, i * h, w, h);
        }
      }
    }
  }

  let heroFrame = 0;
  function heroLoop() {
    heroFrame++;
    if (heroFrame % 4 === 0) updateHero();
    drawHero();
    requestAnimationFrame(heroLoop);
  }

  initHero();
  heroLoop();
  window.addEventListener('resize', initHero);

  /* ==========================================
     1. LOCAL HAMILTONIAN
     ========================================== */
  const hamCanvas = document.getElementById('hamiltonian-canvas');
  const hamCtx = hamCanvas.getContext('2d');
  const betaSlider = document.getElementById('beta-slider');
  const betaDisplay = document.getElementById('beta-display');
  const gsSlider = document.getElementById('gridsize-slider');
  const gsDisplay = document.getElementById('gridsize-display');
  const hamMagDisplay = document.getElementById('ham-magnetization');
  const hamPurDisplay = document.getElementById('ham-purity');

  let hamGrid = { n: 6, beta: 1.0, spins: [] };
  let hamAnimId = null;

  function initHamiltonian() {
    const n = hamGrid.n;
    hamGrid.spins = [];
    for (let i = 0; i < n * n; i++) {
      hamGrid.spins[i] = Math.random() * 2 - 1;
    }
  }

  function updateHamiltonian() {
    const { n, beta, spins } = hamGrid;
    const J = 0.5; // coupling
    const h = 0.3; // external field

    // Metropolis-like update (simplified Glauber dynamics)
    for (let iter = 0; iter < n * n; iter++) {
      const idx = Math.floor(Math.random() * n * n);
      const i = Math.floor(idx / n);
      const j = idx % n;
      let local = 0;
      // neighbor coupling
      if (i > 0) local += spins[(i - 1) * n + j];
      if (i < n - 1) local += spins[(i + 1) * n + j];
      if (j > 0) local += spins[i * n + (j - 1)];
      if (j < n - 1) local += spins[i * n + (j + 1)];
      local *= J;
      local += h;
      const prob = 1 / (1 + Math.exp(-2 * beta * local));
      const newSpin = Math.random() < prob ? 1 : -1;
      spins[idx] = spins[idx] * 0.9 + newSpin * 0.1;
      // clamp
      if (spins[idx] > 1) spins[idx] = 1;
      if (spins[idx] < -1) spins[idx] = -1;
    }

    // compute magnetization
    let mag = 0;
    for (let k = 0; k < spins.length; k++) mag += spins[k];
    mag /= spins.length;
    hamMagDisplay.textContent = mag.toFixed(3);

    // purity: tr(ρ²) approximated by (1 + mag²) / 2 for single qubit
    const purity = (1 + mag * mag) / 2;
    hamPurDisplay.textContent = purity.toFixed(3);
  }

  function drawHamiltonian() {
    const { n, spins } = hamGrid;
    const canvasW = hamCanvas.width;
    const canvasH = hamCanvas.height;
    const cellW = canvasW / n;
    const cellH = canvasH / n;
    const pad = 2;

    hamCtx.fillStyle = '#f5f0e6';
    hamCtx.fillRect(0, 0, canvasW, canvasH);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const s = spins[i * n + j];
        const t = (s + 1) / 2; // 0..1
        const r = Math.round(220 - 70 * t);
        const g = Math.round(215 - 70 * t);
        const b = Math.round(206 - 50 * (1 - t));
        hamCtx.fillStyle = `rgb(${r},${g},${b})`;
        hamCtx.fillRect(j * cellW + pad, i * cellH + pad, cellW - 2 * pad, cellH - 2 * pad);
        hamCtx.strokeStyle = '#ccc';
        hamCtx.lineWidth = 0.5;
        hamCtx.strokeRect(j * cellW + pad, i * cellH + pad, cellW - 2 * pad, cellH - 2 * pad);

        // spin arrow
        const cx = j * cellW + cellW / 2;
        const cy = i * cellH + cellH / 2;
        const len = Math.abs(s) * cellW * 0.28;
        hamCtx.strokeStyle = '#555';
        hamCtx.lineWidth = 1.5;
        hamCtx.beginPath();
        hamCtx.moveTo(cx - len, cy);
        hamCtx.lineTo(cx + len, cy);
        hamCtx.stroke();
        // arrow head
        if (s > 0.2) {
          hamCtx.beginPath();
          hamCtx.moveTo(cx + len, cy);
          hamCtx.lineTo(cx + len - 4, cy - 2.5);
          hamCtx.lineTo(cx + len - 4, cy + 2.5);
          hamCtx.fillStyle = '#555';
          hamCtx.fill();
        } else if (s < -0.2) {
          hamCtx.beginPath();
          hamCtx.moveTo(cx - len, cy);
          hamCtx.lineTo(cx - len + 4, cy - 2.5);
          hamCtx.lineTo(cx - len + 4, cy + 2.5);
          hamCtx.fillStyle = '#555';
          hamCtx.fill();
        }
      }
    }

    // draw interaction edges
    hamCtx.strokeStyle = 'rgba(0,0,0,0.07)';
    hamCtx.lineWidth = 0.5;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cx1 = j * cellW + cellW / 2;
        const cy1 = i * cellH + cellH / 2;
        if (j < n - 1) {
          const cx2 = (j + 1) * cellW + cellW / 2;
          const cy2 = i * cellH + cellH / 2;
          hamCtx.beginPath();
          hamCtx.moveTo(cx1, cy1);
          hamCtx.lineTo(cx2, cy2);
          hamCtx.stroke();
        }
        if (i < n - 1) {
          const cx2 = j * cellW + cellW / 2;
          const cy2 = (i + 1) * cellH + cellH / 2;
          hamCtx.beginPath();
          hamCtx.moveTo(cx1, cy1);
          hamCtx.lineTo(cx2, cy2);
          hamCtx.stroke();
        }
      }
    }
  }

  function hamLoop() {
    updateHamiltonian();
    drawHamiltonian();
    hamAnimId = requestAnimationFrame(hamLoop);
  }

  betaSlider.addEventListener('input', function () {
    hamGrid.beta = parseFloat(this.value);
    betaDisplay.textContent = hamGrid.beta.toFixed(1);
  });

  const gsDisplay2 = document.getElementById('gridsize-display2');
  gsSlider.addEventListener('input', function () {
    hamGrid.n = parseInt(this.value);
    gsDisplay.textContent = hamGrid.n;
    if (gsDisplay2) gsDisplay2.textContent = hamGrid.n;
    initHamiltonian();
  });

  initHamiltonian();
  hamLoop();

  /* ==========================================
     2. SUDDEN DEATH OF ENTANGLEMENT
     ========================================== */
  const entCanvas = document.getElementById('entanglement-canvas');
  const entCtx = entCanvas.getContext('2d');
  const entBetaSlider = document.getElementById('ent-beta-slider');
  const entBetaDisplay = document.getElementById('ent-beta-display');
  const entNSlider = document.getElementById('ent-n-slider');
  const entNDisplay = document.getElementById('ent-n-display');
  const entPhase = document.getElementById('ent-phase');
  const entBetaCDisplay = document.getElementById('ent-betac-display');

  const BETA_C = 1.8; // critical temperature (theorem: constant, geometry-dependent)

  function drawEntanglement() {
    const beta = parseFloat(entBetaSlider.value);
    const n = parseInt(entNSlider.value);
    const W = entCanvas.width;
    const H = entCanvas.height;
    const margin = { top: 40, bottom: 40, left: 60, right: 30 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    entCtx.fillStyle = '#f5f0e6';
    entCtx.fillRect(0, 0, W, H);

    // === Phase diagram ===
    // X axis: β (0 to 4)
    // Y axis: system size n (4 to 64), log scale
    const betaMin = 0, betaMax = 4;
    const nMin = 4, nMax = 64;

    function xPos(b) { return margin.left + (b - betaMin) / (betaMax - betaMin) * plotW; }
    function yPos(nv) { return margin.top + plotH - Math.log(nv / nMin) / Math.log(nMax / nMin) * plotH; }

    const betaCX = xPos(BETA_C);

    // Separable region (right of β_c)
    entCtx.fillStyle = '#d6dce8';
    entCtx.fillRect(betaCX, margin.top, margin.left + plotW - betaCX, plotH);

    // Entangled region (left of β_c) - soft red
    entCtx.save();
    entCtx.beginPath();
    entCtx.rect(margin.left, margin.top, betaCX - margin.left, plotH);
    entCtx.clip();
    entCtx.fillStyle = '#e8d6d4';
    entCtx.fillRect(margin.left, margin.top, betaCX - margin.left, plotH);
    entCtx.strokeStyle = 'rgba(180,70,50,0.2)';
    entCtx.lineWidth = 0.5;
    for (let x = margin.left; x < betaCX; x += 10) {
      entCtx.beginPath();
      entCtx.moveTo(x, margin.top);
      entCtx.lineTo(x + 24, margin.top + plotH);
      entCtx.stroke();
    }
    entCtx.restore();

    // Critical line
    entCtx.strokeStyle = '#888';
    entCtx.lineWidth = 2;
    entCtx.setLineDash([5, 4]);
    entCtx.beginPath();
    entCtx.moveTo(betaCX, margin.top);
    entCtx.lineTo(betaCX, margin.top + plotH);
    entCtx.stroke();
    entCtx.setLineDash([]);

    // Label critical line
    entCtx.fillStyle = '#666';
    entCtx.font = '12px Inter, sans-serif';
    entCtx.textAlign = 'center';
    entCtx.fillText('β_c (critical)', betaCX, margin.top - 8);

    // Current position marker
    const cx = xPos(beta);
    const cy = yPos(n);
    entCtx.fillStyle = '#1a1a1a';
    entCtx.beginPath();
    entCtx.arc(cx, cy, 5, 0, 2 * Math.PI);
    entCtx.fill();
    entCtx.strokeStyle = '#f5f0e6';
    entCtx.lineWidth = 2;
    entCtx.stroke();

    // Phase label
    entCtx.font = '13px Inter, sans-serif';
    entCtx.textAlign = 'center';
    if (beta < BETA_C) {
      entCtx.fillStyle = '#c8503c';
      entCtx.fillText('ENTANGLED', margin.left + (betaCX - margin.left) / 2, margin.top + plotH + 22);
    } else {
      entCtx.fillStyle = '#3c7fc8';
      entCtx.fillText('SEPARABLE', betaCX + (margin.left + plotW - betaCX) / 2, margin.top + plotH + 22);
    }

    // Labels
    entCtx.fillStyle = '#666';
    entCtx.font = '12px Inter, sans-serif';
    entCtx.textAlign = 'center';
    entCtx.fillText('β (inverse temperature)', margin.left + plotW / 2, H - 6);
    entCtx.textAlign = 'left';
    entCtx.fillText('n (system size)', margin.left, margin.top - 10);

    // Axis labels
    entCtx.textAlign = 'center';
    entCtx.font = '11px Inter, sans-serif';
    entCtx.fillStyle = '#888';
    entCtx.fillText('0', margin.left, margin.top + plotH + 18);
    entCtx.fillText('4', margin.left + plotW, margin.top + plotH + 18);
    entCtx.textAlign = 'right';
    entCtx.fillText('4', margin.left - 6, margin.top + plotH);
    entCtx.fillText('64', margin.left - 6, margin.top + 4);

    // Title
    entCtx.fillStyle = '#1a1a1a';
    entCtx.textAlign = 'center';
    entCtx.font = '600 13px Inter, sans-serif';
    entCtx.fillText('Entanglement Phase Diagram', W / 2, 16);

    // Update display
    entBetaDisplay.textContent = beta.toFixed(2);
    entNDisplay.textContent = n;
    entBetaCDisplay.textContent = 'β_c = ' + BETA_C.toFixed(1);
    entPhase.textContent = beta < BETA_C ? 'ENTANGLED' : 'SEPARABLE';
    entPhase.style.color = beta < BETA_C ? '#cc3333' : '#3366cc';
  }

  entBetaSlider.addEventListener('input', drawEntanglement);
  entNSlider.addEventListener('input', drawEntanglement);
  drawEntanglement();

  /* ==========================================
     3. HAMILTONIAN LEARNING
     ========================================== */
  const learnCanvas = document.getElementById('learning-canvas');
  const learnCtx = learnCanvas.getContext('2d');
  const learnNewHam = document.getElementById('learn-new-ham');
  const learnMeasure = document.getElementById('learn-measure');
  const learnAutorun = document.getElementById('learn-autorun');
  const learnStepDisplay = document.getElementById('learn-step-display');
  const learnBetaSlider = document.getElementById('learn-beta-slider');
  const learnBetaDisplay = document.getElementById('learn-beta-display');
  const learnError = document.getElementById('learn-error');
  const learnParams = document.getElementById('learn-params');

  const N_LEARN_PARAMS = 8;
  let trueParams = [];
  let estParams = [];
  let step = 0;
  let learnRunning = false;
  let learnAnimId = null;

  function randomParams() {
    const p = [];
    for (let i = 0; i < N_LEARN_PARAMS; i++) {
      p.push(Math.random() * 2 - 1);
    }
    return p;
  }

  function initLearning() {
    trueParams = randomParams();
    estParams = new Array(N_LEARN_PARAMS).fill(0);
    step = 0;
    learnStepDisplay.textContent = 'Step 0';
    learnError.textContent = '∞';
    learnParams.textContent = '0/' + N_LEARN_PARAMS;
  }

  function doMeasure() {
    if (step >= 100) return;
    step++;

    // Simulate measuring a local observable tr(Xa ρ_β)
    // Recovery: gradient descent on (measurement - expectation)²
    const beta = parseFloat(learnBetaSlider.value);
    const lr = 0.05;

    for (let i = 0; i < N_LEARN_PARAMS; i++) {
      // simulated measurement: true value with noise (temperature dependent)
      const noise = (Math.random() - 0.5) * 0.3 * Math.exp(beta * 0.3);
      const measurement = trueParams[i] + noise;

      // gradient step
      const pred = estParams[i];
      const grad = pred - measurement;
      estParams[i] -= lr * grad;
      if (estParams[i] > 1.5) estParams[i] = 1.5;
      if (estParams[i] < -1.5) estParams[i] = -1.5;
    }

    // compute error
    let err = 0;
    let recovered = 0;
    for (let i = 0; i < N_LEARN_PARAMS; i++) {
      err += (trueParams[i] - estParams[i]) ** 2;
      if (Math.abs(trueParams[i] - estParams[i]) < 0.15) recovered++;
    }
    err = Math.sqrt(err);
    learnError.textContent = err.toFixed(4);
    learnParams.textContent = recovered + '/' + N_LEARN_PARAMS;
    learnStepDisplay.textContent = 'Step ' + step;

    drawLearning();
  }

  function drawLearning() {
    const W = learnCanvas.width;
    const H = learnCanvas.height;
    const margin = { top: 30, bottom: 40, left: 40, right: 20 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    learnCtx.fillStyle = '#f5f0e6';
    learnCtx.fillRect(0, 0, W, H);

    // Title
    learnCtx.fillStyle = '#1a1a1a';
    learnCtx.font = '600 13px Inter, sans-serif';
    learnCtx.textAlign = 'center';
    learnCtx.fillText('Hamiltonian Parameter Recovery', W / 2, 14);

    // Draw parameters as grouped bar chart
    const barW = plotW / (N_LEARN_PARAMS * 2 + 1);

    for (let i = 0; i < N_LEARN_PARAMS; i++) {
      const xTrue = margin.left + barW + i * (barW * 2);
      const xEst = xTrue + barW;

      // true param (dark)
      const hTrue = (trueParams[i] + 1) / 2 * plotH;
      learnCtx.fillStyle = '#1a1a1a';
      learnCtx.fillRect(xTrue, margin.top + plotH - hTrue, barW * 0.8, Math.max(hTrue, 1));

      // estimated param
      const diff = Math.abs(trueParams[i] - estParams[i]);
      const hEst = (estParams[i] + 1) / 2 * plotH;
      if (diff < 0.15) {
        learnCtx.fillStyle = '#5588cc';
      } else if (diff < 0.3) {
        learnCtx.fillStyle = '#cc8844';
      } else {
        learnCtx.fillStyle = '#cc6655';
      }
      learnCtx.fillRect(xEst, margin.top + plotH - hEst, barW * 0.8, Math.max(hEst, 1));

      // label
      learnCtx.fillStyle = '#888';
      learnCtx.font = '10px Inter, sans-serif';
      learnCtx.textAlign = 'center';
      learnCtx.fillText(i + 1, xTrue + barW / 2, margin.top + plotH + 16);
    }

    // Legend (top-right)
    const legX = margin.left + plotW - 120;
    const legY = margin.top + 10;
    learnCtx.font = '11px Inter, sans-serif';
    learnCtx.textAlign = 'left';
    learnCtx.fillStyle = '#1a1a1a';
    learnCtx.fillRect(legX, legY, 10, 10);
    learnCtx.fillStyle = '#1a1a1a';
    learnCtx.fillText('True', legX + 14, legY + 9);
    learnCtx.fillStyle = '#5588cc';
    learnCtx.fillRect(legX + 56, legY, 10, 10);
    learnCtx.fillStyle = '#1a1a1a';
    learnCtx.fillText('Est.', legX + 70, legY + 9);

    // Axis
    learnCtx.strokeStyle = '#ccc';
    learnCtx.lineWidth = 1;
    learnCtx.beginPath();
    learnCtx.moveTo(margin.left, margin.top);
    learnCtx.lineTo(margin.left, margin.top + plotH);
    learnCtx.lineTo(margin.left + plotW, margin.top + plotH);
    learnCtx.stroke();

    learnCtx.textAlign = 'right';
    learnCtx.font = '10px Inter, sans-serif';
    learnCtx.fillStyle = '#888';
    learnCtx.fillText('+1', margin.left - 6, margin.top + 4);
    learnCtx.fillText('0', margin.left - 6, margin.top + plotH / 2 + 3);
    learnCtx.fillText('-1', margin.left - 6, margin.top + plotH + 4);
  }

  learnNewHam.addEventListener('click', function () {
    initLearning();
    drawLearning();
  });

  learnMeasure.addEventListener('click', doMeasure);

  learnAutorun.addEventListener('click', function () {
    if (learnRunning) {
      learnRunning = false;
      learnAutorun.textContent = 'AUTO-RUN';
      if (learnAnimId) cancelAnimationFrame(learnAnimId);
      return;
    }
    learnRunning = true;
    learnAutorun.textContent = 'STOP';
    function runLoop() {
      if (!learnRunning || step >= 100) {
        learnRunning = false;
        learnAutorun.textContent = 'AUTO-RUN';
        return;
      }
      doMeasure();
      setTimeout(function () {
        if (learnRunning) learnAnimId = requestAnimationFrame(runLoop);
      }, 200);
    }
    runLoop();
  });

  learnBetaSlider.addEventListener('input', function () {
    learnBetaDisplay.textContent = parseFloat(this.value).toFixed(1);
  });

  initLearning();
  drawLearning();

  /* ==========================================
     4. TOMOGRAPHY — copy complexity chart
     ========================================== */
  const tomoCanvas = document.getElementById('tomography-canvas');
  const tomoCtx = tomoCanvas.getContext('2d');
  const tomoDSlider = document.getElementById('tomo-d-slider');
  const tomoDDisplay = document.getElementById('tomo-d-display');
  const tomoEpsSlider = document.getElementById('tomo-eps-slider');
  const tomoEpsDisplay = document.getElementById('tomo-eps-display');
  const tomoCopies = document.getElementById('tomo-copies');
  const btnSingle = document.getElementById('tomo-mode-single');
  const btnTCopy = document.getElementById('tomo-mode-tcopy');
  const btnEnt = document.getElementById('tomo-mode-ent');

  let tomoMode = 'single'; // 'single' | 'tcopy' | 'ent'

  function drawTomography() {
    const d = parseInt(tomoDSlider.value);
    const eps = parseFloat(tomoEpsSlider.value);
    const W = tomoCanvas.width;
    const H = tomoCanvas.height;
    const margin = { top: 30, bottom: 50, left: 60, right: 30 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    tomoCtx.fillStyle = '#f5f0e6';
    tomoCtx.fillRect(0, 0, W, H);

    // Draw axes
    tomoCtx.strokeStyle = '#ccc';
    tomoCtx.lineWidth = 1;
    tomoCtx.beginPath();
    tomoCtx.moveTo(margin.left, margin.top);
    tomoCtx.lineTo(margin.left, margin.top + plotH);
    tomoCtx.lineTo(margin.left + plotW, margin.top + plotH);
    tomoCtx.stroke();

    // Labels
    tomoCtx.fillStyle = '#1a1a1a';
    tomoCtx.font = '600 13px Inter, sans-serif';
    tomoCtx.textAlign = 'center';
    tomoCtx.fillText('Copy Complexity n vs Dimension d', W / 2, 14);
    tomoCtx.font = '12px Inter, sans-serif';
    tomoCtx.fillStyle = '#666';
    tomoCtx.fillText('dimension d', margin.left + plotW / 2, H - 6);
    tomoCtx.textAlign = 'right';
    tomoCtx.fillText('copies n', margin.left - 6, margin.top + plotH / 2);

    // Compute complexity
    function copiesFn(mode, d, eps) {
      switch (mode) {
        case 'single': return d * d * d / (eps * eps);    // Θ(d³/ε²)
        case 'tcopy':  return d * d * d / (Math.sqrt(2) * eps * eps);  // Θ(d³/(√t ε²)) with t=2
        case 'ent':    return d * d / (eps * eps);         // Θ(d²/ε²)
      }
    }

    // Draw complexity curves across d values
    const dMin = 4, dMax = 256;
    const nMaxVis = 1e8;

    const modes = [
      { id: 'single', color: '#cc6655', label: 'Single-copy Θ(d³/ε²)' },
      { id: 'tcopy', color: '#ccaa44', label: 't-Copy Θ(d³/(√t ε²))' },
      { id: 'ent', color: '#5588cc', label: 'Fully entangled Θ(d²/ε²)' },
    ];

    // Log-log axes
    function xPos(dv) { return margin.left + Math.log(dv / dMin) / Math.log(dMax / dMin) * plotW; }
    function yPos(nv) { return margin.top + plotH - Math.log(nv) / Math.log(nMaxVis) * plotH; }

    // Grid lines
    tomoCtx.strokeStyle = '#ddd';
    tomoCtx.lineWidth = 1;
    for (let exp = 1; exp <= 8; exp++) {
      const nv = Math.pow(10, exp);
      if (nv < 10) continue;
      const yy = yPos(nv);
      tomoCtx.beginPath();
      tomoCtx.moveTo(margin.left, yy);
      tomoCtx.lineTo(margin.left + plotW, yy);
      tomoCtx.stroke();
      tomoCtx.fillStyle = '#999';
      tomoCtx.font = '8px Courier New, monospace';
      tomoCtx.textAlign = 'left';
      tomoCtx.fillText('10^' + exp, margin.left + 2, yy - 2);
    }

    // Draw each mode
    for (let mi = 0; mi < modes.length; mi++) {
      const mode = modes[mi];
      tomoCtx.strokeStyle = mode.color;
      tomoCtx.lineWidth = (mode.id === tomoMode) ? 3 : 1.5;
      if (mode.id !== tomoMode) {
        tomoCtx.globalAlpha = 0.3;
      }
      tomoCtx.beginPath();
      let first = true;
      for (let dv = dMin; dv <= dMax; dv += 2) {
        const nv = copiesFn(mode.id, dv, eps);
        const px = xPos(dv);
        const py = yPos(Math.min(nv, nMaxVis));
        if (first) { tomoCtx.moveTo(px, py); first = false; }
        else tomoCtx.lineTo(px, py);
      }
      tomoCtx.stroke();
      tomoCtx.globalAlpha = 1;
    }

    // Legend
    let legendY = margin.top + 6;
    tomoCtx.font = '9px Courier New, monospace';
    tomoCtx.textAlign = 'left';
    for (let mi = 0; mi < modes.length; mi++) {
      const mode = modes[mi];
      tomoCtx.fillStyle = mode.color;
      tomoCtx.fillRect(margin.left + 8, legendY, 10, 10);
      tomoCtx.fillStyle = (mode.id === tomoMode) ? '#000' : '#999';
      tomoCtx.fillText(mode.label, margin.left + 22, legendY + 9);
      legendY += 16;
    }

    // Current value marker
    const curN = copiesFn(tomoMode, d, eps);
    const curX = xPos(d);
    const curY = yPos(Math.min(curN, nMaxVis));
    tomoCtx.strokeStyle = '#000';
    tomoCtx.lineWidth = 1;
    tomoCtx.setLineDash([3, 3]);
    tomoCtx.beginPath();
    tomoCtx.moveTo(curX, margin.top);
    tomoCtx.lineTo(curX, margin.top + plotH);
    tomoCtx.stroke();
    tomoCtx.beginPath();
    tomoCtx.moveTo(margin.left, curY);
    tomoCtx.lineTo(margin.left + plotW, curY);
    tomoCtx.stroke();
    tomoCtx.setLineDash([]);
    tomoCtx.fillStyle = '#000';
    tomoCtx.beginPath();
    tomoCtx.arc(curX, curY, 5, 0, 2 * Math.PI);
    tomoCtx.fill();

    tomoDDisplay.textContent = d;
    tomoEpsDisplay.textContent = eps.toFixed(2);
    tomoCopies.textContent = Math.round(curN).toLocaleString();
  }

  tomoDSlider.addEventListener('input', drawTomography);
  tomoEpsSlider.addEventListener('input', drawTomography);

  function setTomoMode(mode) {
    tomoMode = mode;
    [btnSingle, btnTCopy, btnEnt].forEach(function (btn) {
      btn.classList.remove('active');
    });
    if (mode === 'single') btnSingle.classList.add('active');
    if (mode === 'tcopy') btnTCopy.classList.add('active');
    if (mode === 'ent') btnEnt.classList.add('active');
    drawTomography();
  }

  btnSingle.addEventListener('click', function () { setTomoMode('single'); });
  btnTCopy.addEventListener('click', function () { setTomoMode('tcopy'); });
  btnEnt.addEventListener('click', function () { setTomoMode('ent'); });

  drawTomography();

  // ==========================================
  // RESIZE HANDLER for hero canvas only
  // ==========================================
  function handleResize() {
    initHero();
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 200);
  });

})();
