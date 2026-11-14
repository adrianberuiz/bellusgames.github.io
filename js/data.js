/**
 * data.js - Configuraciones de juegos y gestor de almacenamiento basado en partidas.json
 */

export const STORAGE_KEY = 'ludorank_boardgames_data_v2';

export const CATAN_CONFIG = {
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

export const SEVEN_WONDERS_CONFIG = {
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

export class StorageManager {
  static loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.matches)) {
          return parsed;
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
        if (data && Array.isArray(data.matches)) {
          this.saveData(data);
          return data;
        }
      }
    } catch (err) {
      console.log('No se pudo acceder a partidas.json mediante fetch (habitual con protocolo file://). Se utiliza la memoria local.');
    }
    return this.loadData();
  }

  static saveData(data) {
    try {
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
    data.lastUpdated = new Date().toISOString().split('T')[0];
    this.saveData(data);
    return match;
  }

  static deleteMatch(matchId) {
    const data = this.loadData();
    data.matches = data.matches.filter(m => m.id !== matchId);
    data.lastUpdated = new Date().toISOString().split('T')[0];
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
    a.download = `partidas.json`;
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
