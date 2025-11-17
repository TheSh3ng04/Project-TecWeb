document.addEventListener('DOMContentLoaded', () => {
  // painéis
  const startPanel = document.getElementById('start');
  const new_startPanel = document.getElementById('new_start');
  const mediumPanel = document.getElementById('medium');
  const finalPanel = document.getElementById('final');
  const Rules_panel = document.getElementById('Rules_panel');
  const classificationsPanel = document.getElementById('classifications');

  // botões
  const to_sign_in = document.getElementById('to_sign_in');
  const to_log_in = document.getElementById('to_log_in');
  const mediumNextBtn = document.getElementById('button_medium');
  const finishBtn = document.getElementById('finish_game_buttom');
  const new_game_button = document.getElementById('new_game_button');
  const ruleButton = document.getElementById('rule_button');
  const classification_button = document.getElementById('classification_button');

  // formulários
  const formLogin = document.getElementById('subscription');
  const formRegister = document.getElementById('inscription');
  const formMedium = document.querySelector('#medium form');

  // radios/fieldset
  const secondPlayerRadios = document.querySelectorAll('input[name="sp"]');
  const iaRadio = document.getElementById('IA');
  const difficultyFieldset = document.getElementById('setup_secundario');


  // armazenamento
  const users = {};
  const gameSettings = { size: null, secondPlayer: null, botDifficulty: null, firstToStart: null };

  // utilitários visuais e de formulário
  function showPanel(panel) {
    [startPanel, new_startPanel, mediumPanel, finalPanel, classificationsPanel].forEach(p => {
      if (!p) return;
      p.style.display = p === panel ? 'block' : 'none';
    });
  }

  function clearForm(form) { if (form) form.reset(); }

  function setInputError(input) {
    if (!input) return;
    input.style.border = '2px solid rgba(200, 0, 200, 0.7)'; // rosa erro
    input.value = '';
  }

  function resetVisualsForForm(form) {
    if (!form) return;
    [...form.elements].forEach(el => {
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password')) {
        el.style.border = ''; // remove estilo inline para voltar ao CSS por defeito
      }
    });
  }

  function updateDifficultyVisibility() {
    if (!difficultyFieldset || !iaRadio) return;
    difficultyFieldset.style.display = iaRadio.checked ? 'block' : 'none';
  }

  // listeners de navegação
  to_sign_in?.addEventListener('click', () => showPanel(new_startPanel));
  to_log_in?.addEventListener('click', () => showPanel(startPanel));

  new_game_button?.addEventListener('click', () =>{
    clearForm(formMedium);
    resetVisualsForForm(formMedium);
    showPanel(mediumPanel);
  })


// lista de overlays (só estes são mutuamente exclusivos entre si)
const OVERLAY_PANELS = [Rules_panel, classificationsPanel];

// estados e handlers para o overlay atualmente aberto
let currentOverlay = null;
let overlayDocClickHandler = null;
let overlayKeyHandler = null;

// abre um overlay sem tocar nos painéis principais
function openOverlay(panel, openerButton = null) {
  if (!panel) return;

  // se outro overlay estiver aberto, fecha-o (mas não toca nos main panels)
  if (currentOverlay && currentOverlay !== panel) {
    closeOverlay(currentOverlay);
  }

  // mostra só este overlay (não altera o resto do DOM)
  panel.style.display = 'block';
  panel.setAttribute('aria-hidden', 'false');
  currentOverlay = panel;

  // adicionar clique fora -> fecha só este overlay
  overlayDocClickHandler = function (e) {
    if (!panel) return;
    if (panel.contains(e.target) || (openerButton && openerButton.contains(e.target))) return;
    closeOverlay(panel, openerButton);
  };
  setTimeout(() => document.addEventListener('click', overlayDocClickHandler), 0);

  // Esc -> fecha overlay
  overlayKeyHandler = function (ev) {
    if (ev.key === 'Escape' || ev.key === 'Esc') {
      closeOverlay(panel, openerButton);
    }
  };
  document.addEventListener('keydown', overlayKeyHandler);
}

// fecha um overlay sem afetar os main panels
function closeOverlay(panel, openerButton = null) {
  if (!panel) return;
  panel.style.display = 'none';
  panel.setAttribute('aria-hidden', 'true');

  if (overlayDocClickHandler) {
    document.removeEventListener('click', overlayDocClickHandler);
    overlayDocClickHandler = null;
  }
  if (overlayKeyHandler) {
    document.removeEventListener('keydown', overlayKeyHandler);
    overlayKeyHandler = null;
  }
  if (currentOverlay === panel) currentOverlay = null;

  openerButton?.focus();
}

// listeners dos botões (exemplos mínimos)
ruleButton?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (Rules_panel.style.display === 'block') {
    closeOverlay(Rules_panel, ruleButton);
  } else {
    openOverlay(Rules_panel, ruleButton);
  }
});

classification_button?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (classificationsPanel.style.display === 'block') {
    closeOverlay(classificationsPanel, classification_button);
  } else {
    openOverlay(classificationsPanel, classification_button);
  }
});


  finishBtn?.addEventListener('click', () => {
    // restaura valores visuais e formulários ao estado inicial
    clearForm(formLogin);
    clearForm(formRegister);
    clearForm(formMedium);
    resetVisualsForForm(formLogin);
    resetVisualsForForm(formRegister);
    resetVisualsForForm(formMedium);
    updateDifficultyVisibility();
    showPanel(startPanel);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });

  secondPlayerRadios.forEach(r => r.addEventListener('change', updateDifficultyVisibility));

  // --- register ---
  formRegister?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const username = (form.elements['uname']?.value || '').trim();
    const password = (form.elements['pw']?.value || '').trim();

    // limpar visuais antigos e só aplicar "normal" se quiseres indicar foco/estado
    resetVisualsForForm(form);

    if (!username || !password) {
      alert('Preencha todos os campos para registar.');
      if (form.elements['uname']) setInputError(form.elements['uname']);
      if (form.elements['pw']) setInputError(form.elements['pw']);
      return;
    }

    if (users[username]) {
      alert('Esse username já existe. Escolhe outro.');
      if (form.elements['uname']) setInputError(form.elements['uname']);
      return;
    }

    users[username] = password;
    clearForm(form);
    updateDifficultyVisibility();
    showPanel(mediumPanel);

    const saida = document.getElementById('saida_username');
    if (saida) saida.innerText = username;
  });

  // --- login ---
  formLogin?.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const username = (form.elements['uname']?.value || '').trim();
    const password = (form.elements['pw']?.value || '').trim();

    resetVisualsForForm(form);

    if (!username || !password) {
      alert('Preencha todos os campos para iniciar sessão.');
      if (form.elements['uname']) setInputError(form.elements['uname']);
      if (form.elements['pw']) setInputError(form.elements['pw']);
      return;
    }

    if (!users[username] || users[username] !== password) {
      alert('Credenciais inválidas. Verifica o username e a password ou regista-te primeiro.');

      if (form.elements['uname']) setInputError(form.elements['uname']);
      if (form.elements['pw']) setInputError(form.elements['pw']);
      return;
    }

    clearForm(form);
    updateDifficultyVisibility();
    showPanel(mediumPanel);

    const saida = document.getElementById('saida_username');
    if (saida) saida.innerText = username;
  });

  // --- medium ---
  mediumNextBtn?.addEventListener('click', () => {
    const sizeEl = document.querySelector('input[name="size"]:checked');
    const spEl = document.querySelector('input[name="sp"]:checked');
    const bdEl = document.querySelector('input[name="bd"]:checked');
    const fsEl = document.querySelector('input[name="fs"]:checked');

    if (!sizeEl || !spEl || !fsEl) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    if (spEl.value === '1' && !bdEl) {
      alert('Escolhe a dificuldade do bot.');
      return;
    }

    gameSettings.size = Number(sizeEl.value);
    gameSettings.secondPlayer = spEl.value;
    gameSettings.botDifficulty = bdEl ? Number(bdEl.value) : null;
    gameSettings.firstToStart = fsEl ? fsEl.value : null;

    showPanel(finalPanel);
  });

  // estado inicial
  resetVisualsForForm(formLogin);
  resetVisualsForForm(formRegister);
  resetVisualsForForm(formMedium);
  clearForm(formLogin);
  clearForm(formRegister);
  clearForm(formMedium);
  updateDifficultyVisibility();
  showPanel(startPanel);


  // === INICIAR JOGO COM IFRAME ===
  mediumNextBtn?.addEventListener('click', () => {
    const sizeEl = document.querySelector('input[name="size"]:checked');
    const spEl = document.querySelector('input[name="sp"]:checked');
    const bdEl = document.querySelector('input[name="bd"]:checked');
    const fsEl = document.querySelector('input[name="fs"]:checked');

    if (!sizeEl || !spEl || !fsEl) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    if (spEl.value === '1' && !bdEl) {
      alert('Escolhe a dificuldade do bot.');
      return;
    }

    gameSettings.size = Number(sizeEl.value);
    gameSettings.secondPlayer = spEl.value;
    gameSettings.botDifficulty = bdEl ? Number(bdEl.value) : null;
    gameSettings.firstToStart = fsEl.value;

    // === AQUI: Envia config para o iframe ===
    const iframe = document.getElementById('game-iframe');
    const config = {
      size: gameSettings.size,
      bot: gameSettings.secondPlayer === '1',
      difficulty: gameSettings.botDifficulty,
      firstPlayer: gameSettings.firstToStart === '0' ? 'X' : 'O',
      username: document.getElementById('saida_username')?.textContent || 'jogador'
    };

    const sendConfig = () => {
      iframe.contentWindow.postMessage({ type: 'START_GAME', config }, '*');
    };

    // Garante que iframe está carregado
    if (iframe.contentDocument?.readyState === 'complete') {
      sendConfig();
    } else {
      iframe.onload = sendConfig;
    }

    showPanel(finalPanel);
  });



  //-----------------------//

  const menuBtn = document.getElementById('menu_button');
  const sideBar = document.querySelector('.side_bar');

  menuBtn.addEventListener('click', () => {
    sideBar.classList.toggle('active');
  });

  (function () {
    const table = document.getElementById('conquestsTable');
    const addConquestBtn = document.getElementById('add-conquest');
    const addPlayerBtn = document.getElementById('add-player');
    const conquestInput = document.getElementById('new-conquest-name');
    const playerInput = document.getElementById('new-player-name');

    // toggle cell content between empty (—) and check (✓)
    function toggleCell(e) {
      const td = e.currentTarget;
      td.textContent = td.textContent.trim() === '✓' ? '—' : '✓';
    }

    // attach toggle listeners to all data cells
    function attachCellListeners() {
      const cells = table.querySelectorAll('tbody td.cell');
      cells.forEach(td => {
        td.removeEventListener('click', toggleCell);
        td.addEventListener('click', toggleCell);
      });
    }

    // add a conquest (column)
    function addConquest(title) {
      if (!title) return;
      // add header
      const theadRow = table.tHead.rows[0];
      const th = document.createElement('th');
      th.textContent = title;
      theadRow.appendChild(th);
      // add one cell to each existing row
      const rows = table.tBodies[0].rows;
      for (let i = 0; i < rows.length; i++) {
        const td = document.createElement('td');
        td.className = 'cell';
        td.textContent = '—';
        rows[i].appendChild(td);
      }
      attachCellListeners();
      conquestInput.value = '';
    }

    // add a player (row)
    function addPlayer(name) {
      if (!name) return;
      const tbody = table.tBodies[0];
      const headerCount = table.tHead.rows[0].cells.length;
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.className = 'rowname';
      tdName.textContent = name;
      tr.appendChild(tdName);
      // append empty cells matching the number of conquest headers
      for (let i = 1; i < headerCount; i++) { // start at 1 because first header is corner
        const td = document.createElement('td');
        td.className = 'cell';
        td.textContent = '—';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
      attachCellListeners();
      playerInput.value = '';
    }

    // initial attach
    attachCellListeners();

    // UI handlers
    addConquestBtn.addEventListener('click', () => addConquest(conquestInput.value.trim()));
    addPlayerBtn.addEventListener('click', () => addPlayer(playerInput.value.trim()));

    // allow Enter key in inputs
    conquestInput.addEventListener('keydown', e => { if (e.key === 'Enter') addConquest(conquestInput.value.trim()); });
    playerInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(playerInput.value.trim()); });
  })();

});


//--------------------------------------------------------//
// FUNDO
const canvasf = document.getElementById("fundo");
const ctxf = canvasf.getContext("2d");

// Ajustar canvas ao tamanho da janela
canvasf.width = window.innerWidth;
canvasf.height = window.innerHeight;

// Parâmetros das ondas
const waves = [
    { amplitude: 370, comprimento: 1200, velocidade: 0.005, deslocamento: 1, color: "rgba(151, 39, 65, 0.46)" },
    { amplitude: 400, comprimento: 1500, velocidade: 0.007, deslocamento: 5, color: "rgba(0, 200, 255, 0.42)" },
    { amplitude: 350, comprimento: 1000, velocidade: 0.003, deslocamento: 3, color: "rgba(200, 0, 200, 0.3)" }
];

// Parâmetros de bolhas
const bolhas = [];
const bolhasCount = 30;
const bubbleColors = [
    "rgba(228, 29, 75, 1)", // Vermelho neon
    "rgba(0, 200, 255, 1)", // Ciano
    "rgba(200, 0, 200, 1)", // Magenta
];

function criarBolhas() {
    for (let i = 0; i < bolhasCount; i++) {
        bolhas.push({
            x: Math.random() * canvasf.width,
            y: Math.random() * canvasf.height,
            raio: Math.random() * 3 + 1,
            velocidadeBolhas: Math.random() * 0.5 + 0.2,
            opacidade: Math.random() * 0.30 + 0.08,
            color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)]
        });
    }
}

function drawBolhas() {
    bolhas.forEach(p => {
        ctxf.fillStyle = p.color.replace("1)", p.opacidade + ")");
        ctxf.beginPath();
        ctxf.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctxf.fill();
        p.y -= p.velocidadeBolhas;
        if (p.y < 0) p.y = canvasf.height; // Reposicionar bolha
    });
    ctxf.globalAlpha = 1; // Resetar opacidade
}

function desenhar() {
    ctxf.clearRect(0, 0, canvasf.width, canvasf.height);
    
    // Fundo gradiente
    const gradient = ctxf.createLinearGradient(0, 0, 0, canvasf.height);
    gradient.addColorStop(0, "rgb(0, 0, 34)");
    gradient.addColorStop(1, "rgb(20, 10, 50)");
    ctxf.fillStyle = gradient;
    ctxf.fillRect(0, 0, canvasf.width, canvasf.height);

    // Desenhar ondas
    waves.forEach(wave => {
        ctxf.filter = "blur(6px)"; // Desfoque suave
        ctxf.lineWidth = 370;
        ctxf.shadowBlur = 25;
        ctxf.shadowColor = wave.color.replace("0.3", "0.5").replace("0.25", "0.4").replace("0.2", "0.3");
        
        // Gradiente para a onda
        const waveGradient = ctxf.createLinearGradient(0, canvasf.height / 2 - wave.amplitude, 0, canvasf.height / 2 + wave.amplitude);
        waveGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        waveGradient.addColorStop(0.5, wave.color);
        waveGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctxf.strokeStyle = waveGradient;

        ctxf.beginPath();
        for (let x = -wave.comprimento; x <= canvasf.width + wave.comprimento; x++) {
            // Fator de assimetria: maior à esquerda, menor à direita
            let fator = 1.5 - (x / canvasf.width);
            let y = canvasf.height / 2 + (wave.amplitude * fator) * Math.sin((x / wave.comprimento) + wave.deslocamento);
            if (x === -wave.comprimento) ctxf.moveTo(x, y);
            else ctxf.lineTo(x, y);
        }
        ctxf.stroke();
        wave.deslocamento += wave.velocidade;
    });

    ctxf.filter = "none"; // Resetar filtro

    // Desenhar partículas
    drawBolhas();
    requestAnimationFrame(desenhar);
}

// Inicializar partículas e animação
criarBolhas();
desenhar();

window.addEventListener("resize", () => {
  canvasf.width = window.innerWidth;
  canvasf.height = window.innerHeight;
});


// Desenha o tabuleiro mas pra já n esta definido
//drawBoard(); 

// === RECEBE VITÓRIA DO TABULEIRO ===
window.addEventListener('message', (e) => {
  if (e.data.type === 'GAME_OVER') {
    const winner = e.data.winner;
    const isPlayerWin = (winner === 'X' && gameSettings.firstToStart === '0') || 
                        (winner === 'O' && gameSettings.firstToStart === '1');

    // Atualiza primeira célula de conquistas (vitória)
    const firstCell = document.querySelector('#conquestsTable tbody tr:first-child td.cell');
    if (firstCell) {
      firstCell.textContent = (parseInt(firstCell.textContent || '0') + 1).toString();
    }

    // Mostra mensagem
    alert(isPlayerWin ? "Você venceu!" : "Você perdeu!");
  }
});
