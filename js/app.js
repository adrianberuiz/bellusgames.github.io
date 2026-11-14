/**
 * LudoRank - Sistema de Registro y Clasificaciones de Catán & 7 Wonders
 * Carga y sincronización de datos mediante el archivo partidas.json
 */

// =============================================================================
// SECCIÓN 1: CONFIGURACIONES DE LOS JUEGOS
// =============================================================================

const STORAGE_KEY = 'ludorank_boardgames_data_v2';

const CATAN_CONFIG = {
  colors: [
    { id: 'red', name: 'Rojo', hex: '#ef4444', border: '#b91c1c' },
    { id: 'blue', name: 'Azul', hex: '#3b82f6', border: '#1d4ed8' },
    { id: 'orange', name: 'Naranja', hex: '#f97316', border: '#c2410c' },
    { id: 'white', name: 'Blanco', hex: '#f8fafc', border: '#94a3b8', textDark: true },
    { id: 'green', name: 'Verde', hex: '#22c55e', border: '#15803d' },
    { id: 'brown', name: 'Marrón', hex: '#a16207', border: '#713f12' },
  ],
  expansions: [
    'Juego Base',
    'Ampliación 5-6 Jugadores',
    'Navegantes',
    'Ciudades y Caballeros',
    'Mercaderes y Bárbaros',
    'Piratas y Exploradores'
  ]
};

const SEVEN_WONDERS_CONFIG = {
  wonders: [
    { id: 'rhodes', name: 'El Coloso de Rodas', icon: '⚔️' },
    { id: 'alexandria', name: 'El Faro de Alejandría', icon: '🏮' },
    { id: 'ephesos', name: 'El Templo de Artemisa en Éfeso', icon: '🏛️' },
    { id: 'babylon', name: 'Los Jardines Colgantes de Babilonia', icon: '🌿' },
    { id: 'olympia', name: 'La Estatua de Zeus en Olimpia', icon: '⚡' },
    { id: 'halikarnassos', name: 'El Mausoleo de Halicarnaso', icon: '🏺' },
    { id: 'giza', name: 'Las Pirámides de Guiza', icon: '🔺' },
    { id: 'manneken', name: 'Manneken Pis (Promo)', icon: '⛲' }
  ],
  editions: [
    'Segunda Edición',
    'Primera Edición',
    'Expansión Leaders',
    'Expansión Cities',
    'Expansión Armada'
  ]
};

// =============================================================================
// SECCIÓN 2: GESTOR DE ALMACENAMIENTO (LECTURA Y EXPORTACIÓN DE partidas.json)
// =============================================================================

class StorageManager {
  static loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
          return parsed;
        }
      }
      // Semilla inicial desde el script JSON oficial
      const jsonEl = document.getElementById('default-partidas-json');
      if (jsonEl && jsonEl.textContent) {
        const seed = JSON.parse(jsonEl.textContent.trim());
        if (seed && Array.isArray(seed.matches) && seed.matches.length > 0) {
          this.saveData(seed);
          return seed;
        }
      }
      return { matches: [] };
    } catch (e) {
      console.warn('Error al leer de localStorage:', e);
      return { matches: [] };
    }
  }

  static async fetchFromJSONFile() {
    try {
      const response = await fetch('partidas.json');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.matches) && data.matches.length > 0) {
          // Solo sobrescribir si no había datos en localStorage o para sincronizar
          const current = this.loadData();
          if (!current.matches || current.matches.length === 0) {
            this.saveData(data);
          }
          return data;
        }
      }
    } catch (err) {
      console.info('Acceso directo a partidas.json mediante fetch no disponible en file://. Usando almacenamiento sincronizado.');
    }
    return this.loadData();
  }

  static saveData(data) {
    try {
      data.lastUpdated = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
      return false;
    }
  }

  static addMatch(match) {
    const data = this.loadData();
    if (!match.id) {
      match.id = `match-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }
    if (!match.date) {
      match.date = new Date().toISOString().split('T')[0];
    }
    data.matches.unshift(match);
    this.saveData(data);
    return match;
  }

  static deleteMatch(matchId) {
    const data = this.loadData();
    data.matches = data.matches.filter(m => m.id !== matchId);
    this.saveData(data);
    return true;
  }

  static getMatchById(matchId) {
    const data = this.loadData();
    return data.matches.find(m => m.id === matchId) || null;
  }

  static clearAll() {
    const empty = { matches: [], lastUpdated: new Date().toISOString().split('T')[0] };
    this.saveData(empty);
    return empty;
  }

  static exportJSON() {
    const data = this.loadData();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partidas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && Array.isArray(parsed.matches)) {
            this.saveData(parsed);
            resolve(parsed);
          } else {
            reject(new Error('El archivo no contiene un arreglo "matches" válido.'));
          }
        } catch (err) {
          reject(new Error('El archivo no tiene formato JSON válido.'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsText(file);
    });
  }

  static getKnownPlayerNames() {
    const data = this.loadData();
    const names = new Set();
    data.matches.forEach(m => {
      if (Array.isArray(m.players)) {
        m.players.forEach(p => {
          if (p.name && p.name.trim()) {
            names.add(p.name.trim());
          }
        });
      }
    });
    return Array.from(names).sort();
  }
}

// =============================================================================
// SECCIÓN 3: LÓGICA Y REGLAS DE CATÁN
// =============================================================================

class CatanGame {
  static calculatePlayerScore(player) {
    const settlements = parseInt(player.settlements, 10) || 0;
    const cities = parseInt(player.cities, 10) || 0;
    const longestRoad = Boolean(player.longestRoad);
    const largestArmy = Boolean(player.largestArmy);
    const vpCards = parseInt(player.vpCards, 10) || 0;
    const bonusPoints = parseInt(player.bonusPoints, 10) || 0;

    const calculated = (settlements * 1) +
                       (cities * 2) +
                       (longestRoad ? 2 : 0) +
                       (largestArmy ? 2 : 0) +
                       (vpCards * 1) +
                       bonusPoints;

    return Math.max(0, calculated);
  }

  static evaluateMatch(players, targetPoints = 10) {
    const evaluated = players.map(p => ({
      ...p,
      totalScore: this.calculatePlayerScore(p)
    }));

    evaluated.sort((a, b) => b.totalScore - a.totalScore);
    const highestScore = evaluated[0]?.totalScore || 0;

    return evaluated.map((player, index) => {
      const isWinner = index === 0 && highestScore > 0;
      return {
        ...player,
        rank: index + 1,
        isWinner
      };
    });
  }

  static renderPlayerFormCard(player, index) {
    const colorOptions = CATAN_CONFIG.colors.map(c => `
      <option value="${c.id}" ${player.color === c.id ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');

    const currentColor = CATAN_CONFIG.colors.find(c => c.id === player.color) || CATAN_CONFIG.colors[0];

    return `
      <div class="player-card bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative transition-all duration-200 hover:border-amber-500/50" data-player-index="${index}">
        <div class="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3 flex-1">
            <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md" style="background-color: ${currentColor.hex}; border: 2px solid ${currentColor.border};">
              #${index + 1}
            </span>
            <div class="relative flex-1 max-w-xs">
              <input type="text" 
                     list="known-players-list"
                     class="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 player-name-input" 
                     placeholder="Nombre del jugador..." 
                     value="${escapeHTML(player.name || '')}"
                     data-field="name">
            </div>
          </div>

          <div class="flex items-center gap-2">
            <select class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-amber-500 player-color-select" data-field="color">
              ${colorOptions}
            </select>

            <button type="button" class="btn-remove-player p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Eliminar jugador">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">🏠 Poblados</span>
              <span class="text-amber-400 font-bold text-[10px]">1 pt c/u</span>
            </div>
            <input type="number" min="0" max="10" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                   data-field="settlements" value="${player.settlements !== undefined ? player.settlements : 2}">
          </div>

          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">🏰 Ciudades</span>
              <span class="text-amber-400 font-bold text-[10px]">2 pts c/u</span>
            </div>
            <input type="number" min="0" max="8" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                   data-field="cities" value="${player.cities || 0}">
          </div>

          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">📜 Cartas PV</span>
              <span class="text-amber-400 font-bold text-[10px]">1 pt c/u</span>
            </div>
            <input type="number" min="0" max="10" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                   data-field="vpCards" value="${player.vpCards || 0}">
          </div>

          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">✨ Bonos/Otros</span>
              <span class="text-slate-400 font-bold text-[10px]">Expansión</span>
            </div>
            <input type="number" min="0" max="20" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                   data-field="bonusPoints" value="${player.bonusPoints || 0}">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <button type="button" 
                  class="toggle-longest-road flex items-center justify-between p-2.5 rounded-xl border transition ${player.longestRoad ? 'bg-amber-600/30 border-amber-500 text-amber-200' : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'}"
                  data-active="${player.longestRoad ? 'true' : 'false'}">
            <div class="flex items-center gap-2">
              <img src="assets/catan_longest_road.jpg" alt="Ruta" class="w-5 h-5 rounded-full object-cover shadow-sm" onerror="this.style.display='none'">
              <span class="text-xs font-semibold">Gran Ruta Comercial</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-md ${player.longestRoad ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'}">+2 pts</span>
          </button>

          <button type="button" 
                  class="toggle-largest-army flex items-center justify-between p-2.5 rounded-xl border transition ${player.largestArmy ? 'bg-red-600/30 border-red-500 text-red-200' : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'}"
                  data-active="${player.largestArmy ? 'true' : 'false'}">
            <div class="flex items-center gap-2">
              <img src="assets/catan_largest_army.jpg" alt="Ejército" class="w-5 h-5 rounded-full object-cover shadow-sm" onerror="this.style.display='none'">
              <span class="text-xs font-semibold">Mayor Ejército</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-md ${player.largestArmy ? 'bg-red-500 text-white font-black' : 'bg-slate-700 text-slate-300'}">+2 pts</span>
          </button>
        </div>

        <div class="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Puntos de Victoria:</span>
            <span class="catan-breakdown-text text-[11px] text-slate-400">
              (${player.settlements || 2}p + ${(player.cities || 0) * 2}c + ${player.longestRoad ? 2 : 0}r + ${player.largestArmy ? 2 : 0}e + ${player.vpCards || 0}cv)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="player-score-badge text-xl font-black text-amber-400">${player.totalScore || 0}</span>
            <span class="text-xs font-bold text-slate-400">pts</span>
          </div>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// SECCIÓN 4: LÓGICA Y REGLAS DE 7 WONDERS (CALCULADORA DE CIENCIA OFICIAL)
// =============================================================================

class SevenWondersGame {
  static calculateSciencePoints(gears = 0, compasses = 0, tablets = 0, bonusWildcards = 0) {
    const g = Math.max(0, parseInt(gears, 10) || 0);
    const c = Math.max(0, parseInt(compasses, 10) || 0);
    const t = Math.max(0, parseInt(tablets, 10) || 0);
    const wildcards = Math.max(0, parseInt(bonusWildcards, 10) || 0);

    if (wildcards === 0) {
      const sets = Math.min(g, c, t);
      const symbolPoints = (g * g) + (c * c) + (t * t);
      const setPoints = sets * 7;
      return {
        total: symbolPoints + setPoints,
        gears: g,
        compasses: c,
        tablets: t,
        sets,
        symbolPoints,
        setPoints
      };
    }

    let bestTotal = 0;
    let bestConfig = { gears: g, compasses: c, tablets: t, sets: 0, symbolPoints: 0, setPoints: 0 };

    for (let wg = 0; wg <= wildcards; wg++) {
      for (let wc = 0; wc <= wildcards - wg; wc++) {
        const wt = wildcards - wg - wc;
        const curG = g + wg;
        const curC = c + wc;
        const curT = t + wt;

        const sets = Math.min(curG, curC, curT);
        const symbolPoints = (curG * curG) + (curC * curC) + (curT * curT);
        const setPoints = sets * 7;
        const total = symbolPoints + setPoints;

        if (total > bestTotal) {
          bestTotal = total;
          bestConfig = {
            total,
            gears: curG,
            compasses: curC,
            tablets: curT,
            sets,
            symbolPoints,
            setPoints
          };
        }
      }
    }

    return bestConfig;
  }

  static calculatePlayerScore(player) {
    const military = parseInt(player.military, 10) || 0;
    const coins = Math.max(0, parseInt(player.coins, 10) || 0);
    const coinPoints = Math.floor(coins / 3);
    const wonderPoints = Math.max(0, parseInt(player.wonderPoints, 10) || 0);
    const civilian = Math.max(0, parseInt(player.civilian, 10) || 0);
    const commercial = Math.max(0, parseInt(player.commercial, 10) || 0);
    const guilds = Math.max(0, parseInt(player.guilds, 10) || 0);

    const scienceObj = player.science || {};
    const scienceResult = this.calculateSciencePoints(
      scienceObj.gears,
      scienceObj.compasses,
      scienceObj.tablets,
      scienceObj.bonusWildcards
    );

    const sciencePoints = scienceResult.total;

    const total = military +
                  coinPoints +
                  wonderPoints +
                  civilian +
                  commercial +
                  guilds +
                  sciencePoints;

    return {
      totalScore: total,
      military,
      coins,
      coinPoints,
      wonderPoints,
      civilian,
      commercial,
      guilds,
      sciencePoints,
      scienceDetail: scienceResult
    };
  }

  static evaluateMatch(players) {
    const evaluated = players.map(p => {
      const calc = this.calculatePlayerScore(p);
      return {
        ...p,
        totalScore: calc.totalScore,
        coinPoints: calc.coinPoints,
        sciencePoints: calc.sciencePoints,
        scienceDetail: calc.scienceDetail
      };
    });

    evaluated.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      const coinsA = parseInt(a.coins, 10) || 0;
      const coinsB = parseInt(b.coins, 10) || 0;
      return coinsB - coinsA;
    });

    const highestScore = evaluated[0]?.totalScore || 0;

    return evaluated.map((player, index) => {
      const isWinner = index === 0 && highestScore > 0;
      return {
        ...player,
        rank: index + 1,
        isWinner
      };
    });
  }

  static renderPlayerFormCard(player, index) {
    const wonderOptions = SEVEN_WONDERS_CONFIG.wonders.map(w => `
      <option value="${w.id}" ${player.wonder === w.id ? 'selected' : ''}>
        ${w.icon} ${w.name}
      </option>
    `).join('');

    const science = player.science || { gears: 0, compasses: 0, tablets: 0, bonusWildcards: 0 };
    const scienceCalc = this.calculateSciencePoints(science.gears, science.compasses, science.tablets, science.bonusWildcards);
    const coins = parseInt(player.coins, 10) || 0;
    const coinPoints = Math.floor(coins / 3);

    return `
      <div class="player-card bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative transition-all duration-200 hover:border-emerald-500/50" data-player-index="${index}">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3 flex-1 min-w-[200px]">
            <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md bg-emerald-600 border-2 border-emerald-400">
              #${index + 1}
            </span>
            <div class="relative flex-1 max-w-xs">
              <input type="text" 
                     list="known-players-list"
                     class="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 player-name-input" 
                     placeholder="Nombre del jugador..." 
                     value="${escapeHTML(player.name || '')}"
                     data-field="name">
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <select class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 player-wonder-select" data-field="wonder">
              ${wonderOptions}
            </select>

            <div class="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button type="button" class="btn-side-toggle px-2.5 py-1 rounded-md font-bold transition ${(player.wonderSide || 'A') === 'A' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}" data-side="A">Lado A</button>
              <button type="button" class="btn-side-toggle px-2.5 py-1 rounded-md font-bold transition ${(player.wonderSide || 'A') === 'B' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}" data-side="B">Lado B</button>
            </div>

            <button type="button" class="btn-remove-player p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Eliminar jugador">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 text-xs">
          <!-- 1. Militar -->
          <div class="bg-red-950/30 p-2.5 rounded-xl border border-red-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-red-300 font-semibold flex items-center gap-1">
                <img src="assets/wonders_military.jpg" alt="Militar" class="w-4 h-4 rounded-full object-cover shadow-sm" onerror="this.style.display='none'">
                <span>Militar</span>
              </span>
              <span class="text-[10px] text-red-400 font-medium">-6 a +18</span>
            </div>
            <input type="number" min="-6" max="30" 
                   class="w-full bg-slate-900 border border-red-700/50 rounded-lg py-1 px-2 text-center text-red-200 font-bold text-sm focus:ring-1 focus:ring-red-400 sw-input"
                   data-field="military" value="${player.military !== undefined ? player.military : 0}">
          </div>

          <!-- 2. Monedas / Tesoro -->
          <div class="bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-amber-300 font-semibold">🪙 Tesoro</span>
              <span class="text-[10px] text-amber-400 font-medium coin-converted-pts">${coinPoints} pts</span>
            </div>
            <div class="relative">
              <input type="number" min="0" max="99" 
                     class="w-full bg-slate-900 border border-amber-700/50 rounded-lg py-1 px-2 text-center text-amber-200 font-bold text-sm focus:ring-1 focus:ring-amber-400 sw-input sw-coins-input"
                     data-field="coins" value="${player.coins !== undefined ? player.coins : 3}">
              <span class="text-[9px] text-slate-400 block text-center mt-0.5">1 pt por cada 3</span>
            </div>
          </div>

          <!-- 3. Maravilla -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <div class="flex items-center justify-between mb-1">
              <span class="text-slate-200 font-semibold">🏛️ Maravilla</span>
              <span class="text-[10px] text-slate-400">Etapas</span>
            </div>
            <input type="number" min="0" max="30" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-slate-400 sw-input"
                   data-field="wonderPoints" value="${player.wonderPoints || 0}">
          </div>

          <!-- 4. Civil -->
          <div class="bg-blue-950/30 p-2.5 rounded-xl border border-blue-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-blue-300 font-semibold">📜 Civil (Azul)</span>
              <span class="text-[10px] text-blue-400">Cartas</span>
            </div>
            <input type="number" min="0" max="60" 
                   class="w-full bg-slate-900 border border-blue-700/50 rounded-lg py-1 px-2 text-center text-blue-200 font-bold text-sm focus:ring-1 focus:ring-blue-400 sw-input"
                   data-field="civilian" value="${player.civilian || 0}">
          </div>

          <!-- 5. Comercial -->
          <div class="bg-yellow-950/30 p-2.5 rounded-xl border border-yellow-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-yellow-300 font-semibold">⚖️ Comercial</span>
              <span class="text-[10px] text-yellow-400">Amarillas</span>
            </div>
            <input type="number" min="0" max="50" 
                   class="w-full bg-slate-900 border border-yellow-700/50 rounded-lg py-1 px-2 text-center text-yellow-200 font-bold text-sm focus:ring-1 focus:ring-yellow-400 sw-input"
                   data-field="commercial" value="${player.commercial || 0}">
          </div>

          <!-- 6. Gremios -->
          <div class="bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-purple-300 font-semibold">🎭 Gremios</span>
              <span class="text-[10px] text-purple-400">Moradas</span>
            </div>
            <input type="number" min="0" max="50" 
                   class="w-full bg-slate-900 border border-purple-700/50 rounded-lg py-1 px-2 text-center text-purple-200 font-bold text-sm focus:ring-1 focus:ring-purple-400 sw-input"
                   data-field="guilds" value="${player.guilds || 0}">
          </div>
        </div>

        <!-- 7. Calculadora Científica Inteligente -->
        <div class="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 mb-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-emerald-900/50">
            <div class="flex items-center gap-2">
              <img src="assets/wonders_science.jpg" alt="Ciencia" class="w-5 h-5 rounded-full object-cover shadow-sm" onerror="this.style.display='none'">
              <span class="text-xs font-bold text-emerald-300">Ciencia (Cartas Verdes)</span>
              <span class="text-[11px] text-slate-400 hidden sm:inline">(Fórmula: x² + y² + z² + 7×Tríos)</span>
            </div>
            <div class="flex items-center gap-1.5 bg-emerald-900/40 px-2.5 py-0.5 rounded-lg border border-emerald-700/30">
              <span class="text-[10px] text-emerald-300 font-medium">Puntos Ciencia:</span>
              <span class="science-total-badge text-xs font-black text-emerald-200">${scienceCalc.total} pts</span>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2 text-xs">
            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">⚙️</span>
              <label class="text-[10px] text-slate-300 mb-1">Engranaje</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="gears" value="${science.gears || 0}">
            </div>

            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">📐</span>
              <label class="text-[10px] text-slate-300 mb-1">Compás</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="compasses" value="${science.compasses || 0}">
            </div>

            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">📜</span>
              <label class="text-[10px] text-slate-300 mb-1">Tablilla</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="tablets" value="${science.tablets || 0}">
            </div>

            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-amber-400 text-sm mb-1 font-bold">⭐</span>
              <label class="text-[10px] text-amber-300 mb-1">Comodín</label>
              <input type="number" min="0" max="5" 
                     class="w-12 text-center bg-slate-800 border border-amber-700/40 rounded py-0.5 text-amber-100 font-bold sw-science-input"
                     data-science="bonusWildcards" value="${science.bonusWildcards || 0}">
            </div>
          </div>

          <div class="mt-2 text-[11px] text-slate-400 science-breakdown-formula">
            Desglose: ${scienceCalc.symbolPoints} pts (símbolos²) + ${scienceCalc.setPoints} pts (${scienceCalc.sets} tríos de símbolos)
          </div>
        </div>

        <div class="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400">
            Total 7 Wonders (incluye ${coinPoints} pts de monedas)
          </div>
          <div class="flex items-center gap-2">
            <span class="player-score-badge text-xl font-black text-emerald-400">${player.totalScore || 0}</span>
            <span class="text-xs font-bold text-slate-400">pts</span>
          </div>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// SECCIÓN 5: CONTROLADOR PRINCIPAL DE LA APLICACIÓN (APP)
// =============================================================================

class App {
  constructor() {
    this.currentTab = 'leaderboard';
    this.gameFilter = 'all';
    this.historySearchQuery = '';

    this.newMatch = this.createInitialMatchState('catan');
    this.init();
  }

  createInitialMatchState(gameType = 'catan') {
    const today = new Date().toISOString().split('T')[0];
    const known = StorageManager.getKnownPlayerNames();

    if (gameType === 'catan') {
      const catanCount = StorageManager.loadData().matches.filter(m => m.gameType === 'catan').length;
      return {
        gameType: 'catan',
        title: `Catán - Partida #${catanCount + 1}`,
        date: today,
        expansion: 'Juego Base',
        targetPoints: 10,
        notes: '',
        players: [
          { name: known[0] || 'Adrian', color: 'red', settlements: 2, cities: 0, longestRoad: false, largestArmy: false, vpCards: 0, bonusPoints: 0, totalScore: 2 },
          { name: known[1] || 'Leo', color: 'blue', settlements: 2, cities: 0, longestRoad: false, largestArmy: false, vpCards: 0, bonusPoints: 0, totalScore: 2 },
          { name: known[2] || 'Dani', color: 'orange', settlements: 2, cities: 0, longestRoad: false, largestArmy: false, vpCards: 0, bonusPoints: 0, totalScore: 2 }
        ]
      };
    } else {
      const wondersCount = StorageManager.loadData().matches.filter(m => m.gameType === '7wonders').length;
      return {
        gameType: '7wonders',
        title: `7 Wonders - Partida #${wondersCount + 1}`,
        date: today,
        edition: 'Segunda Edición',
        notes: '',
        players: [
          { name: known[0] || 'Leo', wonder: 'rhodes', wonderSide: 'A', military: 0, coins: 3, wonderPoints: 0, civilian: 0, commercial: 0, guilds: 0, science: { gears: 0, compasses: 0, tablets: 0, bonusWildcards: 0 }, totalScore: 1 },
          { name: known[1] || 'Adrian', wonder: 'babylon', wonderSide: 'A', military: 0, coins: 3, wonderPoints: 0, civilian: 0, commercial: 0, guilds: 0, science: { gears: 0, compasses: 0, tablets: 0, bonusWildcards: 0 }, totalScore: 1 },
          { name: known[2] || 'Dani', wonder: 'alexandria', wonderSide: 'A', military: 0, coins: 3, wonderPoints: 0, civilian: 0, commercial: 0, guilds: 0, science: { gears: 0, compasses: 0, tablets: 0, bonusWildcards: 0 }, totalScore: 1 }
        ]
      };
    }
  }

  async init() {
    // Intentar sincronizar desde partidas.json si se ejecuta en servidor local o web
    await StorageManager.fetchFromJSONFile();

    this.bindGlobalEvents();
    this.updateDatalist();
    this.render();
  }

  bindGlobalEvents() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    document.querySelectorAll('.game-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.setGameFilter(filter);
      });
    });

    const modalBackdrop = document.getElementById('detail-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop || e.target.closest('.modal-close-btn')) {
          this.closeDetailModal();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDetailModal();
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tabName;
      if (active) {
        btn.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-amber-600', 'text-white', 'shadow-md', 'shadow-amber-500/20');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('bg-gradient-to-r', 'from-amber-500', 'to-amber-600', 'text-white', 'shadow-md', 'shadow-amber-500/20');
        btn.classList.add('text-slate-400');
      }
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    this.renderCurrentView();
  }

  setGameFilter(filter) {
    this.gameFilter = filter;
    document.querySelectorAll('.game-filter-btn').forEach(btn => {
      const active = btn.dataset.filter === filter;
      if (active) {
        btn.classList.add('active');
        if (filter === 'all') {
          btn.classList.add('capsule-tab-gold');
        } else {
          btn.classList.remove('capsule-tab-gold');
        }
      } else {
        btn.classList.remove('active', 'capsule-tab-gold');
      }
    });
    this.renderCurrentView();
  }

  updateDatalist() {
    const datalist = document.getElementById('known-players-list');
    if (!datalist) return;
    const names = StorageManager.getKnownPlayerNames();
    datalist.innerHTML = names.map(n => `<option value="${escapeHTML(n)}"></option>`).join('');
  }

  render() {
    this.switchTab(this.currentTab);
  }

  renderCurrentView() {
    this.updateDatalist();
    if (this.currentTab === 'leaderboard') {
      this.renderLeaderboard();
    } else if (this.currentTab === 'matches') {
      this.renderMatches();
    } else if (this.currentTab === 'new-match') {
      this.renderNewMatchForm();
    } else if (this.currentTab === 'players') {
      this.renderPlayersStats();
    } else if (this.currentTab === 'settings') {
      this.renderSettings();
    }
  }

  // =========================================================================
  // VISTA 1: CLASIFICACIONES Y ESTADÍSTICAS
  // =========================================================================
  renderLeaderboard() {
    const data = StorageManager.loadData();
    let matches = data.matches || [];

    if (this.gameFilter !== 'all') {
      matches = matches.filter(m => m.gameType === this.gameFilter);
    }

    const playerStatsMap = {};

    matches.forEach(m => {
      if (!Array.isArray(m.players)) return;
      m.players.forEach(p => {
        const name = (p.name || 'Sin Nombre').trim();
        if (!playerStatsMap[name]) {
          playerStatsMap[name] = {
            name,
            gamesPlayed: 0,
            catanPlayed: 0,
            sevenWondersPlayed: 0,
            wins: 0,
            catanWins: 0,
            sevenWondersWins: 0,
            totalPoints: 0,
            catanPoints: 0,
            sevenWondersPoints: 0,
            highScore: 0,
            highScoreGame: '',
            podiums: 0
          };
        }

        const stat = playerStatsMap[name];
        stat.gamesPlayed += 1;
        const pts = p.totalScore || 0;
        stat.totalPoints += pts;

        if (m.gameType === 'catan') {
          stat.catanPlayed += 1;
          stat.catanPoints += pts;
          if (p.isWinner) {
            stat.wins += 1;
            stat.catanWins += 1;
          }
        } else {
          stat.sevenWondersPlayed += 1;
          stat.sevenWondersPoints += pts;
          if (p.isWinner) {
            stat.wins += 1;
            stat.sevenWondersWins += 1;
          }
        }

        if (pts > stat.highScore) {
          stat.highScore = pts;
          stat.highScoreGame = m.gameType;
        }

        if (p.rank && p.rank <= 3) {
          stat.podiums += 1;
        }
      });
    });

    const playerList = Object.values(playerStatsMap);

    playerList.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const wrB = b.gamesPlayed ? (b.wins / b.gamesPlayed) : 0;
      const wrA = a.gamesPlayed ? (a.wins / a.gamesPlayed) : 0;
      if (wrB !== wrA) return wrB - wrA;
      const avgB = b.gamesPlayed ? (b.totalPoints / b.gamesPlayed) : 0;
      const avgA = a.gamesPlayed ? (a.totalPoints / a.gamesPlayed) : 0;
      return avgB - avgA;
    });

    this.renderKPIs(matches, playerList);
    this.renderPodium(playerList.slice(0, 3));

    const tableBody = document.getElementById('leaderboard-table-body');
    if (tableBody) {
      if (playerList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-500 font-medium">Aún no hay partidas registradas en esta categoría.</td></tr>`;
      } else {
        const avatarGradients = [
          'from-amber-500 to-rose-500',
          'from-sky-500 to-indigo-500',
          'from-emerald-500 to-teal-500',
          'from-purple-500 to-pink-500',
          'from-orange-500 to-amber-500'
        ];

        tableBody.innerHTML = playerList.map((p, idx) => {
          const rank = idx + 1;
          const winrate = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
          const grad = avatarGradients[idx % avatarGradients.length];

          let placeBadge = '';
          if (rank === 1) {
            placeBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs border border-amber-500/30">🥇 1</span>`;
          } else if (rank === 2) {
            placeBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-500/10 text-slate-300 font-black text-xs border border-slate-500/30">🥈 2</span>`;
          } else if (rank === 3) {
            placeBadge = `<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 font-black text-xs border border-orange-500/30">🥉 3</span>`;
          } else {
            placeBadge = `<span class="text-xs font-bold text-slate-500">#${rank}</span>`;
          }

          let titleTag = '';
          if (p.catanWins > p.sevenWondersWins && p.catanWins > 0) {
            titleTag = `<span class="text-[10px] text-amber-400 font-semibold">🏝️ Señor de Catán</span>`;
          } else if (p.sevenWondersWins > p.catanWins && p.sevenWondersWins > 0) {
            titleTag = `<span class="text-[10px] text-emerald-400 font-semibold">🏛️ Arquitecto</span>`;
          } else if (p.wins >= 3) {
            titleTag = `<span class="text-[10px] text-purple-400 font-semibold">👑 Gran Campeón</span>`;
          }

          return `
            <tr class="hover:bg-white/[0.02] transition cursor-pointer" onclick="window.app.switchTab('players')">
              <td class="text-center">${placeBadge}</td>
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-tr ${grad} flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    ${escapeHTML(p.name.substring(0, 2).toUpperCase())}
                  </div>
                  <div>
                    <div class="font-heading font-bold text-white text-sm">@${escapeHTML(p.name.toLowerCase().replace(/\s+/g, ''))}</div>
                    ${titleTag}
                  </div>
                </div>
              </td>
              <td class="text-center font-medium text-slate-400">${p.gamesPlayed}</td>
              <td class="text-center">
                <div class="inline-flex items-center gap-1.5 font-heading font-extrabold text-white text-sm">
                  <span class="text-amber-400">🪙</span>
                  <span>${p.wins}</span>
                </div>
              </td>
              <td class="text-center">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full ${winrate >= 50 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}">
                  ${winrate}%
                </span>
              </td>
              <td class="text-center font-medium text-slate-300">
                ${p.gamesPlayed > 0 ? (p.totalPoints / p.gamesPlayed).toFixed(1) : 0}
              </td>
              <td class="text-right">
                <span class="badge-reward">
                  +${p.highScore} pts
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  renderKPIs(matches, players) {
    const totalMatchesEl = document.getElementById('kpi-total-matches');
    const totalPlayersEl = document.getElementById('kpi-total-players');
    const topWinnerEl = document.getElementById('kpi-top-winner');
    const maxScoreEl = document.getElementById('kpi-max-score');

    if (totalMatchesEl) totalMatchesEl.textContent = matches.length;
    if (totalPlayersEl) totalPlayersEl.textContent = players.length;

    if (topWinnerEl) {
      if (players.length > 0 && players[0].wins > 0) {
        topWinnerEl.textContent = `${players[0].name} (${players[0].wins}W)`;
      } else {
        topWinnerEl.textContent = '—';
      }
    }

    if (maxScoreEl) {
      let max = 0;
      let maxHolder = '—';
      players.forEach(p => {
        if (p.highScore > max) {
          max = p.highScore;
          maxHolder = `${p.name} (${max} pts)`;
        }
      });
      maxScoreEl.textContent = maxHolder;
    }
  }

  renderPodium(top3) {
    const podiumContainer = document.getElementById('podium-container');
    if (!podiumContainer) return;

    if (!top3 || top3.length === 0) {
      podiumContainer.innerHTML = '';
      podiumContainer.classList.add('hidden');
      return;
    }

    podiumContainer.classList.remove('hidden');

    const first = top3[0];
    const second = top3[1];
    const third = top3[2];

    const getCrownSVG = (rank) => {
      if (rank === 1) {
        return `
          <svg class="crown-icon crown-gold" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 32h40v4H4z" fill="#D97706"/>
            <path d="M6 30h36v2H6z" fill="#F59E0B"/>
            <path d="M4 30L8 12l8 10 8-16 8 16 8-10 4 18H4z" fill="url(#crown-gold-grad)"/>
            <circle cx="24" cy="6" r="3" fill="#FDE047"/>
            <circle cx="8" cy="12" r="2.5" fill="#FDE047"/>
            <circle cx="40" cy="12" r="2.5" fill="#FDE047"/>
            <circle cx="24" cy="22" r="4.5" fill="#EC4899"/>
            <circle cx="24" cy="22" r="2.5" fill="#F43F5E"/>
            <defs>
              <linearGradient id="crown-gold-grad" x1="4" y1="6" x2="44" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FDE047"/>
                <stop offset="0.5" stop-color="#F59E0B"/>
                <stop offset="1" stop-color="#B45309"/>
              </linearGradient>
            </defs>
          </svg>
        `;
      } else if (rank === 2) {
        return `
          <svg class="crown-icon" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 32h40v4H4z" fill="#475569"/>
            <path d="M6 30h36v2H6z" fill="#94A3B8"/>
            <path d="M4 30L8 12l8 10 8-16 8 16 8-10 4 18H4z" fill="url(#crown-silver-grad)"/>
            <circle cx="24" cy="6" r="3" fill="#F1F5F9"/>
            <circle cx="8" cy="12" r="2.5" fill="#CBD5E1"/>
            <circle cx="40" cy="12" r="2.5" fill="#CBD5E1"/>
            <circle cx="24" cy="22" r="4.5" fill="#10B981"/>
            <circle cx="24" cy="22" r="2.5" fill="#34D399"/>
            <defs>
              <linearGradient id="crown-silver-grad" x1="4" y1="6" x2="44" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FFFFFF"/>
                <stop offset="0.5" stop-color="#CBD5E1"/>
                <stop offset="1" stop-color="#64748B"/>
              </linearGradient>
            </defs>
          </svg>
        `;
      } else {
        return `
          <svg class="crown-icon" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 32h40v4H4z" fill="#78350F"/>
            <path d="M6 30h36v2H6z" fill="#D97706"/>
            <path d="M4 30L8 12l8 10 8-16 8 16 8-10 4 18H4z" fill="url(#crown-bronze-grad)"/>
            <circle cx="24" cy="6" r="3" fill="#FDBA74"/>
            <circle cx="8" cy="12" r="2.5" fill="#FB923C"/>
            <circle cx="40" cy="12" r="2.5" fill="#FB923C"/>
            <circle cx="24" cy="22" r="4.5" fill="#F59E0B"/>
            <circle cx="24" cy="22" r="2.5" fill="#FBBF24"/>
            <defs>
              <linearGradient id="crown-bronze-grad" x1="4" y1="6" x2="44" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FED7AA"/>
                <stop offset="0.5" stop-color="#EA580C"/>
                <stop offset="1" stop-color="#9A3412"/>
              </linearGradient>
            </defs>
          </svg>
        `;
      }
    };

    const renderColumn = (p, rank) => {
      if (!p) {
        return `
          <div class="podium-column podium-column-${rank} opacity-40">
            <div class="podium-user-anchor">
              <div class="avatar-ring">
                <div class="avatar-inner">?</div>
              </div>
              <div class="user-handle text-slate-500">Vacante</div>
            </div>
            <div class="podium-block podium-block-${rank}">
              <span class="podium-label-embossed">${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</span>
            </div>
          </div>
        `;
      }

      const crown = getCrownSVG(rank);
      const score = p.wins;
      const handle = `@${escapeHTML(p.name.toLowerCase().replace(/\s+/g, ''))}`;

      return `
        <div class="podium-column podium-column-${rank} cursor-pointer" onclick="window.app.switchTab('players')">
          <div class="podium-user-anchor">
            ${crown}
            <div class="avatar-ring avatar-ring-${rank}">
              <div class="avatar-inner">
                ${escapeHTML(p.name.substring(0, 2).toUpperCase())}
              </div>
              <span class="avatar-level-badge">#${rank}</span>
            </div>
            <div class="user-handle">${handle}</div>
            <div class="score-pill ${rank === 1 ? 'score-pill-gold' : ''}">
              <span class="text-amber-400">🪙</span>
              <span>${score} W</span>
            </div>
          </div>
          <div class="podium-block podium-block-${rank}">
            <span class="podium-label-embossed">${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</span>
          </div>
        </div>
      `;
    };

    podiumContainer.innerHTML = `
      <div class="podium-section">
        <div class="podium-spotlight"></div>
        <div class="podium-stage">
          ${renderColumn(second, 2)}
          ${renderColumn(first, 1)}
          ${renderColumn(third, 3)}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VISTA 2: HISTORIAL DE PARTIDAS
  // =========================================================================
  renderMatches() {
    const data = StorageManager.loadData();
    let matches = data.matches || [];

    if (this.gameFilter !== 'all') {
      matches = matches.filter(m => m.gameType === this.gameFilter);
    }

    const query = this.historySearchQuery.toLowerCase().trim();
    if (query) {
      matches = matches.filter(m => {
        const titleMatch = (m.title || '').toLowerCase().includes(query);
        const playerMatch = (m.players || []).some(p => (p.name || '').toLowerCase().includes(query));
        const expansionMatch = (m.expansion || m.edition || '').toLowerCase().includes(query);
        return titleMatch || playerMatch || expansionMatch;
      });
    }

    const container = document.getElementById('matches-list-container');
    if (!container) return;

    const searchInput = document.getElementById('matches-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', (e) => {
        this.historySearchQuery = e.target.value;
        this.renderMatches();
      });
    }

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <span class="text-4xl block mb-2">📜</span>
          <p class="font-bold text-base text-slate-300">No se encontraron partidas</p>
          <p class="text-xs text-slate-500 mt-1">Verifica tu filtro de juego o carga partidas mediante el botón de partidas.json.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(match => {
      const isCatan = match.gameType === 'catan';
      const winner = (match.players || []).find(p => p.isWinner) || match.players?.[0];
      const sortedPlayers = [...(match.players || [])].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      const gameEmblemSrc = isCatan ? 'assets/catan_emblem.jpg' : 'assets/wonders_emblem.jpg';

      return `
        <div class="clean-card p-5 relative overflow-hidden group">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div class="flex items-start gap-3">
              <img src="${gameEmblemSrc}" alt="${isCatan ? 'Catán' : '7 Wonders'}" class="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md mt-0.5" onerror="this.style.display='none'">
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isCatan ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}">
                    ${isCatan ? 'Catán' : '7 Wonders'}
                  </span>
                  <span class="text-xs text-slate-400 font-medium">📅 ${match.date || 'Sin fecha'}</span>
                  <span class="text-xs text-slate-600">•</span>
                  <span class="text-xs text-slate-400 font-medium">${escapeHTML(match.expansion || match.edition || 'Estándar')}</span>
                </div>
                <h3 class="text-base sm:text-lg font-heading font-extrabold text-white group-hover:text-amber-300 transition">
                  ${escapeHTML(match.title || 'Partida sin título')}
                </h3>
                ${match.notes ? `<p class="text-xs text-slate-400 italic mt-0.5">${escapeHTML(match.notes)}</p>` : ''}
              </div>
            </div>

            ${winner ? `
              <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-md">
                <span class="text-2xl">👑</span>
                <div>
                  <div class="text-[9px] text-amber-400 uppercase font-bold tracking-wider">Campeón</div>
                  <div class="font-heading font-extrabold text-white text-sm">@${escapeHTML(winner.name.toLowerCase().replace(/\s+/g, ''))}</div>
                </div>
                <div class="text-right border-l border-amber-500/20 pl-3">
                  <div class="text-lg font-heading font-black text-amber-400 tabular-nums">${winner.totalScore}</div>
                  <div class="text-[9px] text-slate-400 font-bold uppercase">puntos</div>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
            ${sortedPlayers.map((p, idx) => {
              const isWin = idx === 0;
              let wonderBadge = '';
              if (!isCatan && p.wonder) {
                const w = SEVEN_WONDERS_CONFIG.wonders.find(item => item.id === p.wonder);
                wonderBadge = `<span class="text-[10px] text-slate-400 truncate block">${w ? w.name : p.wonder} (${p.wonderSide || 'A'})</span>`;
              }

              let colorIndicator = '';
              if (isCatan && p.color) {
                const c = CATAN_CONFIG.colors.find(col => col.id === p.color);
                const hex = c ? c.hex : '#94a3b8';
                colorIndicator = `<span class="w-2.5 h-2.5 rounded-full mr-1.5 inline-block" style="background-color: ${hex}"></span>`;
              }

              let specialBadges = '';
              if (isCatan) {
                if (p.longestRoad) {
                  specialBadges += `<span class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">Ruta</span>`;
                }
                if (p.largestArmy) {
                  specialBadges += `<span class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">Ejército</span>`;
                }
              }

              return `
                <div class="flex items-center justify-between p-2.5 rounded-xl border transition ${isWin ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' : 'bg-slate-900/40 border-white/[0.05]'}">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-xs font-bold ${isWin ? 'text-amber-400' : 'text-slate-500'}">#${idx + 1}</span>
                    <div class="truncate">
                      <div class="text-xs font-heading font-bold text-slate-200 truncate flex items-center">
                        ${colorIndicator}${escapeHTML(p.name)}
                        ${specialBadges}
                      </div>
                      ${wonderBadge}
                    </div>
                  </div>
                  <span class="text-sm font-heading font-extrabold ${isWin ? 'text-amber-400' : 'text-slate-300'} ml-2 tabular-nums">
                    ${p.totalScore}<span class="text-[10px] font-normal text-slate-500 ml-0.5">pts</span>
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
            <span class="text-slate-400 font-medium">${sortedPlayers.length} Jugadores en mesa</span>
            <div class="flex items-center gap-2">
              <button type="button" class="clean-btn clean-btn-secondary btn-view-match-detail px-3 py-1.5 text-xs font-semibold" data-match-id="${match.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Hoja Detallada
              </button>

              <button type="button" class="btn-delete-match p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Eliminar partida" data-match-id="${match.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-view-match-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.matchId;
        this.openDetailModal(id);
      });
    });

    container.querySelectorAll('.btn-delete-match').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.matchId;
        if (confirm('¿Estás seguro de que deseas eliminar esta partida?')) {
          StorageManager.deleteMatch(id);
          this.renderMatches();
          this.showToast('Partida eliminada', 'info');
        }
      });
    });
  }

  // =========================================================================
  // VISTA 3: REGISTRO DE NUEVA PARTIDA
  // =========================================================================
  renderNewMatchForm() {
    const container = document.getElementById('new-match-form-container');
    if (!container) return;

    const m = this.newMatch;
    const isCatan = m.gameType === 'catan';
    const known = StorageManager.getKnownPlayerNames();

    const versionOptions = isCatan 
      ? CATAN_CONFIG.expansions.map(exp => `<option value="${escapeHTML(exp)}" ${m.expansion === exp ? 'selected' : ''}>${escapeHTML(exp)}</option>`).join('')
      : SEVEN_WONDERS_CONFIG.editions.map(ed => `<option value="${escapeHTML(ed)}" ${m.edition === ed ? 'selected' : ''}>${escapeHTML(ed)}</option>`).join('');

    container.innerHTML = `
      <div class="mb-8">
        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Elige el Juego</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="clean-card game-select-card cursor-pointer p-4 flex items-center gap-4 transition-all duration-200 border ${isCatan ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-white/[0.08] hover:border-white/20'}" data-game="catan">
            <img src="assets/catan_emblem.jpg" alt="Catán" class="w-14 h-14 rounded-2xl object-cover shadow-md border border-white/10 flex-shrink-0" onerror="this.onerror=null; this.src='assets/catan_emblem.jpg'">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-heading font-extrabold text-white text-base">Los Colonos de Catán</h4>
                ${isCatan ? '<span class="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>' : ''}
              </div>
              <p class="text-xs text-slate-400 mt-1">Poblados, ciudades, gran ruta, mayor ejército y cartas de desarrollo.</p>
            </div>
          </div>

          <div class="clean-card game-select-card cursor-pointer p-4 flex items-center gap-4 transition-all duration-200 border ${!isCatan ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-white/[0.08] hover:border-white/20'}" data-game="7wonders">
            <img src="assets/wonders_emblem.jpg" alt="7 Wonders" class="w-14 h-14 rounded-2xl object-cover shadow-md border border-white/10 flex-shrink-0" onerror="this.onerror=null; this.src='assets/wonders_emblem.jpg'">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-heading font-extrabold text-white text-base">7 Wonders</h4>
                ${!isCatan ? '<span class="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>' : ''}
              </div>
              <p class="text-xs text-slate-400 mt-1">7 categorías oficiales: Guerra, Oro, Maravilla, Civil, Comercial, Gremios y Ciencia.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="clean-card p-5 mb-8 border border-white/[0.08]">
        <h4 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>📋</span> Información General de la Partida
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label class="block text-slate-400 font-medium mb-1">Título / Nombre de la Partida</label>
            <input type="text" id="match-title-input" class="w-full bg-[#0B0E17] border border-white/[0.1] rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none" value="${escapeHTML(m.title)}">
          </div>
          <div>
            <label class="block text-slate-400 font-medium mb-1">Fecha</label>
            <input type="date" id="match-date-input" class="w-full bg-[#0B0E17] border border-white/[0.1] rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none" value="${m.date}">
          </div>
          <div>
            <label class="block text-slate-400 font-medium mb-1">${isCatan ? 'Expansión / Módulo' : 'Edición / Expansión'}</label>
            <select id="match-version-select" class="w-full bg-[#0B0E17] border border-white/[0.1] rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none">
              ${versionOptions}
            </select>
          </div>
        </div>

        <div class="mt-3">
          <label class="block text-slate-400 font-medium mb-1 text-xs">Notas de la Partida (Opcional)</label>
          <input type="text" id="match-notes-input" placeholder="Ej: Estrategia agresiva de puertos, empates resueltos..." class="w-full bg-[#0B0E17] border border-white/[0.1] rounded-xl px-3 py-2 text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" value="${escapeHTML(m.notes || '')}">
        </div>
      </div>

      <div class="mb-8">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 class="text-base font-extrabold text-white flex items-center gap-2">
              <span>👥</span> Jugadores y Resultados
            </h4>
            <p class="text-xs text-slate-400">Introduce los nombres y resultados de cada participante.</p>
          </div>

          <button type="button" id="btn-add-player" class="clean-btn ${isCatan ? 'clean-btn-gold' : 'clean-btn-primary'} text-xs font-bold shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Agregar Jugador
          </button>
        </div>

        <div id="players-forms-list" class="space-y-4">
          ${m.players.map((p, idx) => {
            return isCatan 
              ? CatanGame.renderPlayerFormCard(p, idx)
              : SevenWondersGame.renderPlayerFormCard(p, idx);
          }).join('')}
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/[0.08]">
        <button type="button" id="btn-cancel-match" class="clean-btn clean-btn-secondary px-5 py-2.5 text-xs font-semibold">
          Cancelar
        </button>

        <button type="button" id="btn-save-match" class="clean-btn ${isCatan ? 'clean-btn-gold' : 'clean-btn-primary'} px-6 py-2.5 font-bold text-sm shadow-lg flex items-center gap-2">
          <span>💾</span>
          Guardar y Registrar Partida
        </button>
      </div>
    `;

    this.bindNewMatchFormEvents();
    this.recalculateCurrentMatchScores();
  }

  bindNewMatchFormEvents() {
    const container = document.getElementById('new-match-form-container');
    if (!container) return;

    container.querySelectorAll('.game-select-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const game = e.currentTarget.dataset.game;
        if (game !== this.newMatch.gameType) {
          this.newMatch = this.createInitialMatchState(game);
          this.renderNewMatchForm();
        }
      });
    });

    const titleInput = document.getElementById('match-title-input');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.newMatch.title = e.target.value;
      });
    }

    const dateInput = document.getElementById('match-date-input');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.newMatch.date = e.target.value;
      });
    }

    const versionSelect = document.getElementById('match-version-select');
    if (versionSelect) {
      versionSelect.addEventListener('change', (e) => {
        if (this.newMatch.gameType === 'catan') {
          this.newMatch.expansion = e.target.value;
        } else {
          this.newMatch.edition = e.target.value;
        }
      });
    }

    const notesInput = document.getElementById('match-notes-input');
    if (notesInput) {
      notesInput.addEventListener('input', (e) => {
        this.newMatch.notes = e.target.value;
      });
    }

    const btnAddPlayer = document.getElementById('btn-add-player');
    if (btnAddPlayer) {
      btnAddPlayer.addEventListener('click', () => {
        this.addNewPlayerToForm();
      });
    }

    const btnSaveMatch = document.getElementById('btn-save-match');
    if (btnSaveMatch) {
      btnSaveMatch.addEventListener('click', () => {
        this.saveCurrentMatch();
      });
    }

    const btnCancel = document.getElementById('btn-cancel-match');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        if (confirm('¿Descartar los cambios de esta partida?')) {
          this.switchTab('leaderboard');
        }
      });
    }

    this.bindPlayerListDynamicEvents();
  }

  bindPlayerListDynamicEvents() {
    const list = document.getElementById('players-forms-list');
    if (!list) return;

    list.querySelectorAll('.btn-remove-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.currentTarget.closest('.player-card');
        const index = parseInt(card.dataset.playerIndex, 10);
        if (this.newMatch.players.length <= 2) {
          alert('Una partida requiere al menos 2 jugadores.');
          return;
        }
        this.newMatch.players.splice(index, 1);
        this.renderNewMatchForm();
      });
    });

    list.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', (e) => {
        this.syncPlayerCardData(e.target);
      });
      input.addEventListener('change', (e) => {
        this.syncPlayerCardData(e.target);
      });
    });

    if (this.newMatch.gameType === 'catan') {
      list.querySelectorAll('.toggle-longest-road').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.currentTarget.closest('.player-card');
          const index = parseInt(card.dataset.playerIndex, 10);
          const currentVal = Boolean(this.newMatch.players[index].longestRoad);
          
          this.newMatch.players.forEach((p, idx) => {
            p.longestRoad = (idx === index) ? !currentVal : false;
          });
          this.renderNewMatchForm();
        });
      });

      list.querySelectorAll('.toggle-largest-army').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.currentTarget.closest('.player-card');
          const index = parseInt(card.dataset.playerIndex, 10);
          const currentVal = Boolean(this.newMatch.players[index].largestArmy);
          
          this.newMatch.players.forEach((p, idx) => {
            p.largestArmy = (idx === index) ? !currentVal : false;
          });
          this.renderNewMatchForm();
        });
      });
    }

    if (this.newMatch.gameType === '7wonders') {
      list.querySelectorAll('.btn-side-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.currentTarget.closest('.player-card');
          const index = parseInt(card.dataset.playerIndex, 10);
          const side = e.currentTarget.dataset.side;
          this.newMatch.players[index].wonderSide = side;
          this.renderNewMatchForm();
        });
      });
    }
  }

  syncPlayerCardData(target) {
    const card = target.closest('.player-card');
    if (!card) return;
    const index = parseInt(card.dataset.playerIndex, 10);
    const player = this.newMatch.players[index];
    if (!player) return;

    const field = target.dataset.field;
    const scienceField = target.dataset.science;

    if (scienceField) {
      if (!player.science) player.science = {};
      player.science[scienceField] = parseInt(target.value, 10) || 0;
    } else if (field) {
      if (target.type === 'number') {
        player[field] = parseInt(target.value, 10) || 0;
      } else {
        player[field] = target.value;
      }
    }

    this.recalculateCurrentMatchScores();
  }

  recalculateCurrentMatchScores() {
    const isCatan = this.newMatch.gameType === 'catan';
    const list = document.getElementById('players-forms-list');
    if (!list) return;

    if (isCatan) {
      const evaluated = CatanGame.evaluateMatch(this.newMatch.players, this.newMatch.targetPoints);
      list.querySelectorAll('.player-card').forEach((card, idx) => {
        const p = evaluated[idx];
        if (!p) return;
        const scoreBadge = card.querySelector('.player-score-badge');
        if (scoreBadge) scoreBadge.textContent = p.totalScore;
        const breakdown = card.querySelector('.catan-breakdown-text');
        if (breakdown) {
          breakdown.textContent = `(${p.settlements || 0}p + ${(p.cities || 0) * 2}c + ${p.longestRoad ? 2 : 0}r + ${p.largestArmy ? 2 : 0}e + ${p.vpCards || 0}cv)`;
        }
      });
    } else {
      const evaluated = SevenWondersGame.evaluateMatch(this.newMatch.players);
      list.querySelectorAll('.player-card').forEach((card, idx) => {
        const p = evaluated[idx];
        if (!p) return;
        const scoreBadge = card.querySelector('.player-score-badge');
        if (scoreBadge) scoreBadge.textContent = p.totalScore;

        const coinBadge = card.querySelector('.coin-converted-pts');
        if (coinBadge) {
          const coinPts = Math.floor((p.coins || 0) / 3);
          coinBadge.textContent = `${coinPts} pts`;
        }

        const scienceBadge = card.querySelector('.science-total-badge');
        if (scienceBadge && p.scienceDetail) {
          scienceBadge.textContent = `${p.scienceDetail.total} pts`;
        }

        const scienceFormula = card.querySelector('.science-breakdown-formula');
        if (scienceFormula && p.scienceDetail) {
          scienceFormula.textContent = `Desglose: ${p.scienceDetail.symbolPoints} pts (símbolos²) + ${p.scienceDetail.setPoints} pts (${p.scienceDetail.sets} tríos de símbolos)`;
        }
      });
    }
  }

  addNewPlayerToForm() {
    const known = StorageManager.getKnownPlayerNames();
    const nextIdx = this.newMatch.players.length + 1;
    const isCatan = this.newMatch.gameType === 'catan';

    if (isCatan) {
      const usedColors = this.newMatch.players.map(p => p.color);
      const freeColor = CATAN_CONFIG.colors.find(c => !usedColors.includes(c.id)) || CATAN_CONFIG.colors[0];

      this.newMatch.players.push({
        name: known[nextIdx - 1] || `Jugador ${nextIdx}`,
        color: freeColor.id,
        settlements: 2,
        cities: 0,
        longestRoad: false,
        largestArmy: false,
        vpCards: 0,
        bonusPoints: 0,
        totalScore: 2
      });
    } else {
      const usedWonders = this.newMatch.players.map(p => p.wonder);
      const freeWonder = SEVEN_WONDERS_CONFIG.wonders.find(w => !usedWonders.includes(w.id)) || SEVEN_WONDERS_CONFIG.wonders[0];

      this.newMatch.players.push({
        name: known[nextIdx - 1] || `Jugador ${nextIdx}`,
        wonder: freeWonder.id,
        wonderSide: 'A',
        military: 0,
        coins: 3,
        wonderPoints: 0,
        civilian: 0,
        commercial: 0,
        guilds: 0,
        science: { gears: 0, compasses: 0, tablets: 0, bonusWildcards: 0 },
        totalScore: 1
      });
    }

    this.renderNewMatchForm();
  }

  saveCurrentMatch() {
    if (this.newMatch.players.length < 2) {
      alert('Debes ingresar al menos 2 jugadores para registrar la partida.');
      return;
    }

    const hasEmptyNames = this.newMatch.players.some(p => !p.name || !p.name.trim());
    if (hasEmptyNames) {
      alert('Por favor asegúrate de que todos los jugadores tengan un nombre.');
      return;
    }

    let finalPlayers = [];
    if (this.newMatch.gameType === 'catan') {
      finalPlayers = CatanGame.evaluateMatch(this.newMatch.players, this.newMatch.targetPoints);
    } else {
      finalPlayers = SevenWondersGame.evaluateMatch(this.newMatch.players);
    }

    const matchToSave = {
      ...this.newMatch,
      players: finalPlayers
    };

    StorageManager.addMatch(matchToSave);
    this.launchConfetti();
    this.showToast('¡Partida registrada! Puedes descargar el archivo partidas.json actualizado desde Configuración.', 'success');

    this.newMatch = this.createInitialMatchState(this.newMatch.gameType);
    this.switchTab('leaderboard');
  }

  // =========================================================================
  // VISTA 4: PERFILES DE JUGADORES
  // =========================================================================
  renderPlayersStats() {
    const container = document.getElementById('players-grid-container');
    if (!container) return;

    const data = StorageManager.loadData();
    const matches = data.matches || [];
    const stats = {};

    matches.forEach(m => {
      (m.players || []).forEach(p => {
        const name = (p.name || 'Sin Nombre').trim();
        if (!stats[name]) {
          stats[name] = {
            name,
            totalGames: 0,
            totalWins: 0,
            catanMatches: 0,
            catanWins: 0,
            catanHighest: 0,
            sevenWondersMatches: 0,
            sevenWondersWins: 0,
            sevenWondersHighest: 0,
            totalPoints: 0,
            wondersPlayed: {}
          };
        }

        const s = stats[name];
        s.totalGames += 1;
        s.totalPoints += (p.totalScore || 0);

        if (m.gameType === 'catan') {
          s.catanMatches += 1;
          if (p.isWinner) s.catanWins += 1;
          if ((p.totalScore || 0) > s.catanHighest) s.catanHighest = p.totalScore;
        } else {
          s.sevenWondersMatches += 1;
          if (p.isWinner) s.sevenWondersWins += 1;
          if ((p.totalScore || 0) > s.sevenWondersHighest) s.sevenWondersHighest = p.totalScore;
          if (p.wonder) {
            s.wondersPlayed[p.wonder] = (s.wondersPlayed[p.wonder] || 0) + 1;
          }
        }

        if (p.isWinner) s.totalWins += 1;
      });
    });

    const playerList = Object.values(stats);
    playerList.sort((a, b) => b.totalWins - a.totalWins || b.totalGames - a.totalGames);

    if (playerList.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <p class="font-bold text-sm">Aún no hay perfiles de jugadores generados.</p>
        </div>
      `;
      return;
    }

    const avatarColors = [
      '#f59e0b', '#38bdf8', '#ea580c', '#a855f7', '#06b6d4', 
      '#f97316', '#eab308', '#10b981', '#ec4899', '#6366f1'
    ];

    container.innerHTML = playerList.map((p, idx) => {
      const winrate = p.totalGames > 0 ? Math.round((p.totalWins / p.totalGames) * 100) : 0;
      const catanWR = p.catanMatches > 0 ? Math.round((p.catanWins / p.catanMatches) * 100) : 0;
      const swWR = p.sevenWondersMatches > 0 ? Math.round((p.sevenWondersWins / p.sevenWondersMatches) * 100) : 0;
      const avatarColor = avatarColors[idx % avatarColors.length];

      return `
        <div class="clean-card p-5 relative transition">
          <div class="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]">
            <div class="relative flex-shrink-0">
              <div class="w-11 h-11 rounded-full flex items-center justify-center font-heading font-extrabold text-white text-sm shadow-md" style="background: linear-gradient(135deg, ${avatarColor}, #0F172A); border: 2px solid ${avatarColor};">
                ${escapeHTML(p.name.substring(0, 2).toUpperCase())}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-heading font-extrabold text-white text-sm truncate">@${escapeHTML(p.name.toLowerCase().replace(/\s+/g, ''))}</h4>
              <span class="text-xs text-slate-400 tabular-nums">${p.totalGames} partidas registradas</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 tabular-nums">
                ${winrate}% WR
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 mb-4 text-xs">
            <div class="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3">
              <div class="text-amber-400 font-bold mb-1.5 flex items-center gap-1.5">
                <img src="assets/catan_emblem.jpg" alt="Catán" class="w-4 h-4 rounded-md object-cover shadow-sm" onerror="this.style.display='none'">
                <span>Catán</span>
              </div>
              <div class="text-slate-300 font-semibold tabular-nums">${p.catanWins} / ${p.catanMatches} victorias (${catanWR}%)</div>
              <div class="text-[10px] text-slate-400 mt-0.5 tabular-nums">Récord: ${p.catanHighest} pts</div>
            </div>

            <div class="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3">
              <div class="text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                <img src="assets/wonders_emblem.jpg" alt="7 Wonders" class="w-4 h-4 rounded-md object-cover shadow-sm" onerror="this.style.display='none'">
                <span>7 Wonders</span>
              </div>
              <div class="text-slate-300 font-semibold tabular-nums">${p.sevenWondersWins} / ${p.sevenWondersMatches} victorias (${swWR}%)</div>
              <div class="text-[10px] text-slate-400 mt-0.5 tabular-nums">Récord: ${p.sevenWondersHighest} pts</div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Puntos Totales: <strong class="text-white font-bold tabular-nums">${p.totalPoints}</strong></span>
            <span class="flex items-center gap-1">
              <img src="assets/medal_gold.jpg" alt="Victorias" class="w-4 h-4 rounded-full object-cover">
              <span>Victorias: <strong class="text-amber-400 font-bold tabular-nums">${p.totalWins}</strong></span>
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // VISTA 5: CONFIGURACIÓN Y GESTIÓN DE ARCHIVO JSON
  // =========================================================================
  renderSettings() {
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport && !btnExport.dataset.bound) {
      btnExport.dataset.bound = 'true';
      btnExport.addEventListener('click', () => {
        StorageManager.exportJSON();
        this.showToast('Descargando archivo partidas.json...', 'info');
      });
    }

    const importInput = document.getElementById('input-import-json');
    if (importInput && !importInput.dataset.bound) {
      importInput.dataset.bound = 'true';
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await StorageManager.importJSON(file);
          this.showToast('¡Archivo JSON importado con éxito!', 'success');
          this.render();
        } catch (err) {
          alert('Error al importar archivo: ' + err.message);
        }
        e.target.value = '';
      });
    }

    const btnResetDemo = document.getElementById('btn-reset-demo');
    if (btnResetDemo && !btnResetDemo.dataset.bound) {
      btnResetDemo.dataset.bound = 'true';
      btnResetDemo.addEventListener('click', async () => {
        if (confirm('¿Recargar las 16 partidas oficiales desde el archivo partidas.json?')) {
          try {
            const res = await fetch('partidas.json');
            if (res.ok) {
              const data = await res.json();
              StorageManager.saveData(data);
              this.render();
              this.showToast('partidas.json recargado exitosamente', 'info');
              return;
            }
          } catch (e) {}

          const jsonEl = document.getElementById('default-partidas-json');
          if (jsonEl && jsonEl.textContent) {
            const data = JSON.parse(jsonEl.textContent.trim());
            StorageManager.saveData(data);
            this.render();
            this.showToast('partidas.json recargado exitosamente', 'info');
            return;
          }

          this.showToast('Selecciona el archivo partidas.json con el botón "Seleccionar Archivo"', 'info');
        }
      });
    }

    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll && !btnClearAll.dataset.bound) {
      btnClearAll.dataset.bound = 'true';
      btnClearAll.addEventListener('click', () => {
        if (confirm('¡PELIGRO! ¿Deseas borrar absolutamente todas las partidas? Esta acción no se puede deshacer.')) {
          StorageManager.clearAll();
          this.render();
          this.showToast('Registro vaciado', 'info');
        }
      });
    }
  }

  // =========================================================================
  // MODAL DE DETALLE COMPLETO
  // =========================================================================
  openDetailModal(matchId) {
    const match = StorageManager.getMatchById(matchId);
    if (!match) return;

    const modal = document.getElementById('detail-modal-backdrop');
    const content = document.getElementById('detail-modal-content');
    if (!modal || !content) return;

    const isCatan = match.gameType === 'catan';
    const sorted = [...(match.players || [])].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    let tableHTML = '';
    if (isCatan) {
      const hasCategories = sorted.some(p => (p.settlements || 0) > 0 || (p.cities || 0) > 0 || p.longestRoad || p.largestArmy);

      if (hasCategories) {
        tableHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="py-2.5 px-3">#</th>
                  <th class="py-2.5 px-3">Jugador</th>
                  <th class="py-2.5 px-3 text-center">Poblados (1pt)</th>
                  <th class="py-2.5 px-3 text-center">Ciudades (2pts)</th>
                  <th class="py-2.5 px-3 text-center">Ruta (+2)</th>
                  <th class="py-2.5 px-3 text-center">Ejército (+2)</th>
                  <th class="py-2.5 px-3 text-center">Cartas PV</th>
                  <th class="py-2.5 px-3 text-right font-bold text-amber-400">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((p, idx) => {
                  const colorObj = CATAN_CONFIG.colors.find(c => c.id === p.color);
                  const colorHex = colorObj ? colorObj.hex : '#94a3b8';
                  return `
                    <tr class="border-b border-slate-800/60 ${idx === 0 ? 'bg-amber-500/10 font-bold' : ''}">
                      <td class="py-2.5 px-3">${idx === 0 ? '🥇' : idx + 1}</td>
                      <td class="py-2.5 px-3">
                        <div class="flex items-center gap-1.5">
                          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${colorHex}"></span>
                          <span class="text-white">${escapeHTML(p.name)}</span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 text-center">${p.settlements || 0}</td>
                      <td class="py-2.5 px-3 text-center">${p.cities || 0} (${(p.cities || 0) * 2}pts)</td>
                      <td class="py-2.5 px-3 text-center">${p.longestRoad ? '✅ +2' : '—'}</td>
                      <td class="py-2.5 px-3 text-center">${p.largestArmy ? '✅ +2' : '—'}</td>
                      <td class="py-2.5 px-3 text-center">${p.vpCards || 0}</td>
                      <td class="py-2.5 px-3 text-right font-black text-amber-400 text-sm">${p.totalScore} pts</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        tableHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="py-2.5 px-3">Posición</th>
                  <th class="py-2.5 px-3">Jugador</th>
                  <th class="py-2.5 px-3 text-right font-bold text-amber-400">Puntuación Final</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((p, idx) => `
                  <tr class="border-b border-slate-800/60 ${idx === 0 ? 'bg-amber-500/10 font-bold' : ''}">
                    <td class="py-2.5 px-3">${idx === 0 ? '🥇 Ganador' : `#${idx + 1}`}</td>
                    <td class="py-2.5 px-3 font-semibold text-white">${escapeHTML(p.name)}</td>
                    <td class="py-2.5 px-3 text-right font-black text-amber-400 text-sm">${p.totalScore} pts</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else {
      const hasCategories = sorted.some(p => p.military || p.wonderPoints || p.civilian || p.commercial || p.guilds || p.sciencePoints);

      if (hasCategories) {
        tableHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="py-2.5 px-2">#</th>
                  <th class="py-2.5 px-2">Jugador / Maravilla</th>
                  <th class="py-2.5 px-2 text-center text-red-400">Guerra</th>
                  <th class="py-2.5 px-2 text-center text-amber-400">Oro (Pts)</th>
                  <th class="py-2.5 px-2 text-center text-slate-300">Maravilla</th>
                  <th class="py-2.5 px-2 text-center text-blue-400">Civil</th>
                  <th class="py-2.5 px-2 text-center text-yellow-400">Comercio</th>
                  <th class="py-2.5 px-2 text-center text-purple-400">Gremios</th>
                  <th class="py-2.5 px-2 text-center text-emerald-400">Ciencia</th>
                  <th class="py-2.5 px-2 text-right font-bold text-emerald-300">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((p, idx) => {
                  const w = SEVEN_WONDERS_CONFIG.wonders.find(item => item.id === p.wonder);
                  const coinPts = p.coinPoints !== undefined ? p.coinPoints : Math.floor((p.coins || 0) / 3);
                  const sciencePts = p.sciencePoints !== undefined ? p.sciencePoints : (p.scienceDetail ? p.scienceDetail.total : 0);

                  return `
                    <tr class="border-b border-slate-800/60 ${idx === 0 ? 'bg-emerald-500/10 font-bold' : ''}">
                      <td class="py-2.5 px-2">${idx === 0 ? '🥇' : idx + 1}</td>
                      <td class="py-2.5 px-2">
                        <div class="text-white font-semibold">${escapeHTML(p.name)}</div>
                        <div class="text-[10px] text-slate-400">${w ? w.name : (p.wonder || 'Maravilla')} (Lado ${p.wonderSide || 'A'})</div>
                      </td>
                      <td class="py-2.5 px-2 text-center text-red-300 font-bold">${p.military || 0}</td>
                      <td class="py-2.5 px-2 text-center text-amber-300">${coinPts}</td>
                      <td class="py-2.5 px-2 text-center text-slate-300">${p.wonderPoints || 0}</td>
                      <td class="py-2.5 px-2 text-center text-blue-300">${p.civilian || 0}</td>
                      <td class="py-2.5 px-2 text-center text-yellow-300">${p.commercial || 0}</td>
                      <td class="py-2.5 px-2 text-center text-purple-300">${p.guilds || 0}</td>
                      <td class="py-2.5 px-2 text-center text-emerald-300">${sciencePts}</td>
                      <td class="py-2.5 px-2 text-right font-black text-emerald-400 text-sm">${p.totalScore} pts</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        tableHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th class="py-2.5 px-3">Posición</th>
                  <th class="py-2.5 px-3">Jugador</th>
                  <th class="py-2.5 px-3">Maravilla Asignada</th>
                  <th class="py-2.5 px-3 text-right font-bold text-emerald-400">Puntuación Final</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((p, idx) => {
                  const w = SEVEN_WONDERS_CONFIG.wonders.find(item => item.id === p.wonder);
                  return `
                    <tr class="border-b border-slate-800/60 ${idx === 0 ? 'bg-emerald-500/10 font-bold' : ''}">
                      <td class="py-2.5 px-3">${idx === 0 ? '🥇 Ganador' : `#${idx + 1}`}</td>
                      <td class="py-2.5 px-3 font-semibold text-white">${escapeHTML(p.name)}</td>
                      <td class="py-2.5 px-3 text-slate-300">${w ? `${w.icon} ${w.name}` : (p.wonder || 'Maravilla')}</td>
                      <td class="py-2.5 px-3 text-right font-black text-emerald-400 text-sm">${p.totalScore} pts</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }

    const gameEmblemSrc = isCatan ? 'assets/catan_emblem.jpg' : 'assets/wonders_emblem.jpg';

    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div class="flex items-start gap-3.5">
            <img src="${gameEmblemSrc}" alt="${isCatan ? 'Catán' : '7 Wonders'}" class="w-14 h-14 rounded-2xl object-cover border ${isCatan ? 'border-amber-500/40 shadow-amber-500/10' : 'border-emerald-500/40 shadow-emerald-500/10'} shadow-lg mt-0.5" onerror="this.style.display='none'">
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1.5">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${isCatan ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}">
                  ${isCatan ? 'Catán' : '7 Wonders'}
                </span>
                <span class="text-xs text-slate-400 font-medium">📅 ${match.date}</span>
                <span class="text-xs text-slate-400 font-medium">• ${escapeHTML(match.expansion || match.edition || 'Estándar')}</span>
              </div>
              <h3 class="text-xl font-heading font-black text-white">${escapeHTML(match.title)}</h3>
              ${match.notes ? `<p class="text-xs text-slate-400 italic mt-1">${escapeHTML(match.notes)}</p>` : ''}
            </div>
          </div>
          <button type="button" class="modal-close-btn p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
            ✕
          </button>
        </div>

        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hoja de Puntuación Oficial</h4>
        ${tableHTML}

        <div class="mt-6 flex justify-end">
          <button type="button" class="clean-btn clean-btn-secondary modal-close-btn px-5 py-2.5 text-xs font-bold">
            Cerrar Hoja
          </button>
        </div>
      </div>
    `;

    content.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeDetailModal());
    });

    modal.classList.remove('hidden');
  }

  closeDetailModal() {
    const modal = document.getElementById('detail-modal-backdrop');
    if (modal) modal.classList.add('hidden');
  }

  launchConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 translate-y-10 opacity-0 ${
      type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white border border-slate-700'
    }`;
    toast.innerHTML = `<span>${type === 'success' ? '🎉' : 'ℹ️'}</span> ${escapeHTML(message)}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
