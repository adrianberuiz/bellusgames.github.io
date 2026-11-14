/**
 * catan.js - Lógica de puntuación, cálculo y formulario para Los Colonos de Catán
 */
import { CATAN_CONFIG } from './data.js';

export class CatanGame {
  /**
   * Calcula el puntaje de un jugador en Catán
   * @param {Object} player
   * @returns {number} Puntaje total
   */
  static calculatePlayerScore(player) {
    const settlements = parseInt(player.settlements, 10) || 0;
    const cities = parseInt(player.cities, 10) || 0;
    const longestRoad = Boolean(player.longestRoad);
    const largestArmy = Boolean(player.largestArmy);
    const vpCards = parseInt(player.vpCards, 10) || 0;
    const bonusPoints = parseInt(player.bonusPoints, 10) || 0;

    const total = (settlements * 1) +
                  (cities * 2) +
                  (longestRoad ? 2 : 0) +
                  (largestArmy ? 2 : 0) +
                  (vpCards * 1) +
                  bonusPoints;

    return Math.max(0, total);
  }

  /**
   * Determina las posiciones y ganador de una lista de jugadores de Catán
   * @param {Array} players
   * @param {number} targetPoints (por defecto 10)
   * @returns {Array} jugadores ordenados por puntaje descendente con flag isWinner y rank
   */
  static evaluateMatch(players, targetPoints = 10) {
    const evaluated = players.map(p => ({
      ...p,
      totalScore: this.calculatePlayerScore(p)
    }));

    // Ordenar de mayor a menor puntuación
    evaluated.sort((a, b) => b.totalScore - a.totalScore);

    const highestScore = evaluated[0]?.totalScore || 0;

    return evaluated.map((player, index) => {
      // Es ganador si tiene el puntaje más alto y hay al menos una puntuación válida
      const isWinner = index === 0 && highestScore > 0;
      return {
        ...player,
        rank: index + 1,
        isWinner
      };
    });
  }

  /**
   * Genera el HTML de la tarjeta de un jugador en el formulario de nueva partida de Catán
   */
  static renderPlayerFormCard(player, index, knownPlayers = []) {
    const colorOptions = CATAN_CONFIG.colors.map(c => `
      <option value="${c.id}" ${player.color === c.id ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');

    const currentColor = CATAN_CONFIG.colors.find(c => c.id === player.color) || CATAN_CONFIG.colors[0];

    return `
      <div class="player-card bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative transition-all duration-200 hover:border-amber-500/50" data-player-index="${index}">
        <!-- Header del jugador -->
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
            <!-- Selector de Color de Fichas -->
            <select class="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-amber-500 player-color-select" data-field="color">
              ${colorOptions}
            </select>

            <!-- Botón Eliminar Jugador -->
            <button type="button" class="btn-remove-player p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Eliminar jugador">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Inputs de Puntuación de Catán -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <!-- Poblados -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">🏠 Poblados</span>
              <span class="text-amber-400 font-bold text-[10px]">1 pt c/u</span>
            </div>
            <div class="flex items-center gap-1">
              <input type="number" min="0" max="10" 
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                     data-field="settlements" value="${player.settlements || 2}">
            </div>
          </div>

          <!-- Ciudades -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">🏰 Ciudades</span>
              <span class="text-amber-400 font-bold text-[10px]">2 pts c/u</span>
            </div>
            <div class="flex items-center gap-1">
              <input type="number" min="0" max="8" 
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                     data-field="cities" value="${player.cities || 0}">
            </div>
          </div>

          <!-- Cartas de Victoria -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">📜 Cartas PV</span>
              <span class="text-amber-400 font-bold text-[10px]">1 pt c/u</span>
            </div>
            <div class="flex items-center gap-1">
              <input type="number" min="0" max="10" 
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                     data-field="vpCards" value="${player.vpCards || 0}">
            </div>
          </div>

          <!-- Bonos Extra -->
          <div class="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div class="flex justify-between items-center mb-1">
              <span class="text-slate-300 font-medium">✨ Bonos/Otros</span>
              <span class="text-slate-400 font-bold text-[10px]">Expansion</span>
            </div>
            <div class="flex items-center gap-1">
              <input type="number" min="0" max="20" 
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-white font-bold text-sm focus:ring-1 focus:ring-amber-500 catan-input"
                     data-field="bonusPoints" value="${player.bonusPoints || 0}">
            </div>
          </div>
        </div>

        <!-- Toggles Especiales de 2 Puntos (Exclusivos) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <!-- Gran Ruta Comercial -->
          <button type="button" 
                  class="toggle-longest-road flex items-center justify-between p-2.5 rounded-xl border transition ${player.longestRoad ? 'bg-amber-600/30 border-amber-500 text-amber-200' : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'}"
                  data-active="${player.longestRoad ? 'true' : 'false'}">
            <div class="flex items-center gap-2">
              <span class="text-base">🛤️</span>
              <span class="text-xs font-semibold">Gran Ruta Comercial</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-md ${player.longestRoad ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}">+2 pts</span>
          </button>

          <!-- Mayor Ejército -->
          <button type="button" 
                  class="toggle-largest-army flex items-center justify-between p-2.5 rounded-xl border transition ${player.largestArmy ? 'bg-red-600/30 border-red-500 text-red-200' : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'}"
                  data-active="${player.largestArmy ? 'true' : 'false'}">
            <div class="flex items-center gap-2">
              <span class="text-base">⚔️</span>
              <span class="text-xs font-semibold">Mayor Ejército</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-md ${player.largestArmy ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}">+2 pts</span>
          </button>
        </div>

        <!-- Subtotal / Puntaje en Vivo -->
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

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
