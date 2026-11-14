# 🎲 LudoRank - Salón de Honor de Catán & 7 Wonders

Una aplicación web interactiva, moderna y con estética de **videojuego arcade casual** (*Royal Match, Nintendo, T3 Arena*) diseñada para registrar, clasificar y analizar partidas de mesa de **Los Colonos de Catán** y **7 Wonders**.

Desplegable de forma directa en **GitHub Pages**: `https://adrianberuiz.github.io/bellusgames.github.io/`

---

## 🎮 Identidad Visual & Experiencia de Juego (UX/UI)

### 1. Podio de Videojuego (Top 3)
- **1er Lugar (Oro & Lima)**: Tarjeta destacada central con halo dorado, avatar coronado, ilustración 3D del **Cofre del Tesoro Dorado** con animación de levitación y pin circular metálico inferior con el número **"1"**.
- **2do Lugar (Azul Cielo)**: Tarjeta izquierda con la Medalla de Plata y pin circular **"2"**.
- **3er Lugar (Bronce / Naranja)**: Tarjeta derecha con la Medalla de Bronce y pin circular **"3"**.

### 2. Roster de Jugadores
- Tarjetas apiladas en tono marfil con grandes números de rango en relieve (4, 5, 6...).
- Avatares gamer personalizados con marcos de color y **escudos heráldicos** dinámicos (*Señor de Catán*, *Arquitecto de Maravillas*, *Gran Campeón*).
- Cajas de puntuación con diseño táctil arcade.

### 3. Crónica de Partidas (Battle Logs)
- Registro detallado de partidas de Catán y 7 Wonders.
- Destacado del **Campeón** de cada encuentro con su puntuación.
- Fichas de jugadores con colores de facción, maravillas y tokens especiales (*Gran Ruta Comercial*, *Mayor Ejército*).
- Modal emergente con el desglose completo de categorías (puntos por poblados, ciudades, ciencia, conflictos, gremios, etc.).

### 4. Calculadora Oficial de 7 Wonders & Catán
- **7 Wonders**: Cálculo automático de ciencia según las reglas oficiales (suma de cuadrados de símbolos repetidos + 7 puntos por cada set de trío completo, con optimización de comodines).
- **Catán**: Cálculo de puntos por poblados, ciudades, gran ruta, mayor ejército y cartas de desarrollo.

---

## 🪙 Assets Visuales 3D (`assets/`)

El proyecto incluye 10 piezas visuales en 3D de alta definición:

| Asset | Archivo | Descripción |
|---|---|---|
| **Cofre Dorado** | `assets/golden_chest.jpg` | Cofre del tesoro 3D con gemas y terciopelo para el 1er puesto del podio. |
| **Emblema de Catán** | `assets/catan_emblem.jpg` | Hexágono isométrico 3D con recursos de madera, trigo, arcilla y oveja. |
| **Emblema de 7 Wonders** | `assets/wonders_emblem.jpg` | Maravilla clásica con columnas griegas y monedas de oro. |
| **Medalla de Oro (1º)** | `assets/medal_gold.jpg` | Moneda de oro pulido en alto relieve con el numeral romano **I**. |
| **Medalla de Plata (2º)** | `assets/medal_silver.jpg` | Moneda de plata maciza con el numeral romano **II**. |
| **Medalla de Bronce (3º)** | `assets/medal_bronze.jpg` | Moneda de bronce antiguo pulido con el numeral romano **III**. |
| **Gran Ruta Comercial** | `assets/catan_longest_road.jpg` | Token de Catán: camino adoquinado en colinas verdes (+2 PV). |
| **Mayor Ejército** | `assets/catan_largest_army.jpg` | Token de Catán: yelmo de caballero con penacho carmesí (+2 PV). |
| **Conflicto Militar** | `assets/wonders_military.jpg` | Escudo redondo hoplita espartano de bronce con espadas cruzadas. |
| **Descubrimiento Científico** | `assets/wonders_science.jpg` | Mecanismo de Anticitera con engranajes de latón y compás astronómico. |

---

## 💾 Fuente de Datos: `partidas.json`

Todos los datos se sincronizan y almacenan en:
📁 **`partidas.json`**

- Contiene las **16 partidas iniciales** importadas desde el registro oficial de Excel.
- Funciona de forma 100% autónoma en cualquier navegador sin necesidad de servidores externos.
- Permite exportar e importar copias de seguridad en formato `.json` en cualquier momento.
