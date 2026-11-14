/**
 * sevenWonders.js - Lógica de puntuación oficial, cálculo de ciencia y formulario para 7 Wonders
 */
import { SEVEN_WONDERS_CONFIG } from './data.js';

export class SevenWondersGame {
  /**
   * Calcula los puntos científicos oficiales de 7 Wonders:
   * Puntos = (engranajes^2 + compases^2 + tablillas^2) + (7 * min(engranajes, compases, tablillas)) + comodines/bonos
   */
  static calculateSciencePoints(gears = 0, compasses = 0, tablets = 0, bonusWildcards = 0) {
    const g = Math.max(0, parseInt(gears, 10) || 0);
    const c = Math.max(0, parseInt(compasses, 10) || 0);
    const t = Math.max(0, parseInt(tablets, 10) || 0);
    const wildcards = Math.max(0, parseInt(bonusWildcards, 10) || 0);

    // Si no hay comodines, cálculo estándar
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

    // Si hay comodines científicos (por ejemplo de Babilonia o gremios),
    // probamos todas las combinaciones óptimas para maximizar puntos
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

  /**
   * Calcula el puntaje total completo de un jugador en 7 Wonders
   * @param {Object} player
   * @returns {Object} Puntaje total y desglose
   */
  static calculatePlayerScore(player) {
    const military = parseInt(player.military, 10) || 0; // Puede ser negativo (derrotas)
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

  /**
   * Determina posiciones y desempates oficiales de 7 Wonders:
   * Empate en puntos se resuelve por quien tenga más monedas en el tesoro.
   */
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

    // Ordenar por puntaje total descendente; desempate por monedas totales
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

  /**
   * Renderiza el formulario de jugador para 7 Wonders
   */
  static renderPlayerFormCard(player, index, knownPlayers = []) {
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
        <!-- Header del jugador -->
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
            <!-- Selector de Maravilla -->
            <select class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 player-wonder-select" data-field="wonder">
              ${wonderOptions}
            </select>

            <!-- Lado de la Maravilla (A / B) -->
            <div class="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button type="button" class="btn-side-toggle px-2.5 py-1 rounded-md font-bold transition ${(player.wonderSide || 'A') === 'A' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}" data-side="A">Lado A</button>
              <button type="button" class="btn-side-toggle px-2.5 py-1 rounded-md font-bold transition ${(player.wonderSide || 'A') === 'B' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}" data-side="B">Lado B</button>
            </div>

            <!-- Botón Eliminar Jugador -->
            <button type="button" class="btn-remove-player p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Eliminar jugador">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 7 Categorías Oficiales de Puntuación -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4 text-xs">
          <!-- 1. Militar (Rojo) -->
          <div class="bg-red-950/30 p-2.5 rounded-xl border border-red-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-red-300 font-semibold">⚔️ Militar</span>
              <span class="text-[10px] text-red-400">-6 a +18</span>
            </div>
            <input type="number" min="-6" max="30" 
                   class="w-full bg-slate-900 border border-red-700/50 rounded-lg py-1 px-2 text-center text-red-200 font-bold text-sm focus:ring-1 focus:ring-red-400 sw-input"
                   data-field="military" value="${player.military !== undefined ? player.military : 0}">
          </div>

          <!-- 2. Monedas / Tesoro (Oro) -->
          <div class="bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-amber-300 font-semibold">🪙 Tesoro</span>
              <span class="text-[10px] text-amber-400 font-medium coin-converted-pts">${coinPoints} pts</span>
            </div>
            <div class="relative">
              <input type="number" min="0" max="99" 
                     class="w-full bg-slate-900 border border-amber-700/50 rounded-lg py-1 px-2 text-center text-amber-200 font-bold text-sm focus:ring-1 focus:ring-amber-400 sw-input sw-coins-input"
                     data-field="coins" value="${player.coins || 0}" placeholder="Monedas">
              <span class="text-[9px] text-slate-400 block text-center mt-0.5">1 pt por cada 3</span>
            </div>
          </div>

          <!-- 3. Maravilla (Gris/Plata) -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <div class="flex items-center justify-between mb-1">
              <span class="text-slate-200 font-semibold">🏛️ Maravilla</span>
              <span class="text-[10px] text-slate-400">Etapas</span>
            </div>
            <input type="number" min="0" max="30" 
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-slate-400 sw-input"
                   data-field="wonderPoints" value="${player.wonderPoints || 0}">
          </div>

          <!-- 4. Civil (Azul) -->
          <div class="bg-blue-950/30 p-2.5 rounded-xl border border-blue-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-blue-300 font-semibold">📜 Civil (Azul)</span>
              <span class="text-[10px] text-blue-400">Edificios</span>
            </div>
            <input type="number" min="0" max="60" 
                   class="w-full bg-slate-900 border border-blue-700/50 rounded-lg py-1 px-2 text-center text-blue-200 font-bold text-sm focus:ring-1 focus:ring-blue-400 sw-input"
                   data-field="civilian" value="${player.civilian || 0}">
          </div>

          <!-- 5. Comercial (Amarillo) -->
          <div class="bg-yellow-950/30 p-2.5 rounded-xl border border-yellow-800/40">
            <div class="flex items-center justify-between mb-1">
              <span class="text-yellow-300 font-semibold">⚖️ Comercial</span>
              <span class="text-[10px] text-yellow-400">Amarillas</span>
            </div>
            <input type="number" min="0" max="50" 
                   class="w-full bg-slate-900 border border-yellow-700/50 rounded-lg py-1 px-2 text-center text-yellow-200 font-bold text-sm focus:ring-1 focus:ring-yellow-400 sw-input"
                   data-field="commercial" value="${player.commercial || 0}">
          </div>

          <!-- 6. Gremios (Morado) -->
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

        <!-- 7. Calculadora Científica Inteligente (Verde) -->
        <div class="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 mb-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-emerald-900/50">
            <div class="flex items-center gap-2">
              <span class="text-sm">🧪</span>
              <span class="text-xs font-bold text-emerald-300">Ciencia (Cartas Verdes)</span>
              <span class="text-[11px] text-slate-400 hidden sm:inline">(Fórmula: x² + y² + z² + 7×Tríos)</span>
            </div>
            <div class="flex items-center gap-1.5 bg-emerald-900/40 px-2.5 py-0.5 rounded-lg border border-emerald-700/30">
              <span class="text-[10px] text-emerald-300 font-medium">Puntos Ciencia:</span>
              <span class="science-total-badge text-xs font-black text-emerald-200">${scienceCalc.total} pts</span>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2 text-xs">
            <!-- Engranaje (Rueda) -->
            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">⚙️</span>
              <label class="text-[10px] text-slate-300 mb-1">Engranaje</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="gears" value="${science.gears || 0}">
            </div>

            <!-- Compás / Compases -->
            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">📐</span>
              <label class="text-[10px] text-slate-300 mb-1">Compás</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="compasses" value="${science.compasses || 0}">
            </div>

            <!-- Tablilla -->
            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-emerald-400 text-sm mb-1 font-bold">📜</span>
              <label class="text-[10px] text-slate-300 mb-1">Tablilla</label>
              <input type="number" min="0" max="10" 
                     class="w-12 text-center bg-slate-800 border border-emerald-700/40 rounded py-0.5 text-emerald-100 font-bold sw-science-input"
                     data-science="tablets" value="${science.tablets || 0}">
            </div>

            <!-- Comodines de Ciencia (Babilonia B, Gremios, etc.) -->
            <div class="flex flex-col items-center bg-slate-900/70 p-2 rounded-lg border border-emerald-900/30">
              <span class="text-amber-400 text-sm mb-1 font-bold">⭐</span>
              <label class="text-[10px] text-amber-300 mb-1">Comodín</label>
              <input type="number" min="0" max="5" 
                     class="w-12 text-center bg-slate-800 border border-amber-700/40 rounded py-0.5 text-amber-100 font-bold sw-science-input"
                     data-science="bonusWildcards" value="${science.bonusWildcards || 0}">
            </div>
          </div>

          <div class="mt-2 text-[11px] text-slate-400 science-breakdown-formula">
            Desglose: ${scienceCalc.symbolPoints} pts (símbolos al cuadrado) + ${scienceCalc.setPoints} pts (${scienceCalc.sets} grupos de 3)
          </div>
        </div>

        <!-- Subtotal / Puntaje en Vivo -->
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

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
