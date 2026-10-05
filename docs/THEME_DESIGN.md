# Honcho Cognition Studio — Light & Dark Theme System
**Progetto:** Dashboard Web per Alex / Honcho v3.2.2  
**Percorso Progetto:** `/opt/data/projects/honcho-dashboard`  
**Ruolo:** UI/UX Designer  
**Stato:** Proposta di Design in attesa di approvazione da Alex (Nessuna modifica alla produzione developer)  
**Revisione:** v1.0 (Specifiche Token Semantici, Switcher Dark/Light/System e Analisi Contrasti)

---

## 1. Executive Summary & Visione di Design

Su richiesta di Alex, estendiamo il design system di **Honcho Cognition Studio** introducendo il supporto nativo per il **Tema Light (Chiaro)**, affiancandolo al tema Dark (Scuro) già approvato.

### Principi Guida del Tema Light:
1. **Invarianza del Layout (Zero Redesign):** La struttura, la griglia, la densità informativa, la spaziatura e le interazioni approvate rimangono rigorosamente identiche. Si tratta di un'estensione tematica basata su token semantici, non di un redesign dell'interfaccia.
2. **Ispirazione Linear / Vercel / Stripe Light:** Superfici pulite ad alta chiarezza visiva, sfondo canvas neutro e riposante (`#f8fafc` Slate 50), schede bianche pure (`#ffffff`) con bordi a linea sottile (`#e2e8f0` Slate 200) e ombreggiature ambientali minime.
3. **Leggibilità e Rigore Cognitivo:** I badge dei livelli di ragionamento Honcho (`explicit`, `deductive`, `inductive`, `contradiction`) adottano nel tema chiaro sfondi pastello a bassa saturazione abbinati a testi scuri e profondi, garantendo distinzione visiva immediata e contrasti matematici elevati.
4. **Accessibilità Trasparente (Nessun Claim Non Verificato):** I valori di contrasto sono calcolati matematicamente secondo la formula di luminanza relativa sRGB dello standard WCAG 2.1. Non si rilasciano certificazioni formali terze parti, ma verifiche empiriche misurate.
5. **Selettore Tri-Stato Intelligente (Dark / Light / System):**
   - Scelta persistita in `localStorage` (`honcho-theme`).
   - Modalità `System` dinamica: ascolta in tempo reale l'evento `change` di `prefers-color-scheme` per adattarsi istantaneamente ai cambi di tema del sistema operativo senza ricaricare la pagina.

---

## 2. Sistema di Token Semantici (Dark vs Light)

I token sono progettati per essere implementati tramite **CSS Custom Properties** (variabili CSS) collegate a Tailwind CSS, permettendo al developer una migrazione senza duplicazione di classi o regressioni.

| Token Semantico | Ruolo nell'Interfaccia | Valore DARK | Valore LIGHT | Note di Applicazione |
|---|---|---|---|---|
| `--color-canvas` | Sfondo viewport principale | `#090d16` (Deep Obsidian) | `#f8fafc` (Slate 50) | Base neutra riposante |
| `--color-surface` | Navbar, sidebar, contenitori base | `#0f172a` (Slate 900) | `#ffffff` (Pure White) | Superficie primaria |
| `--color-surface-subtle` | Pannelli secondari, table header, drawer | `#131d31` (Slate 850) | `#f1f5f9` (Slate 100) | Contrasto morbido per raggruppamenti |
| `--color-surface-elevated` | Schede sessioni, card peer, popover | `#1e293b` (Slate 800) | `#ffffff` (Pure White + Shadow) | Elevazione visiva con bordo sottile |
| `--color-surface-hover` | Hover su righe, item di menu, bottoni | `#27354f` (Slate 750) | `#e2e8f0` (Slate 200) | Feedback interattivo |
| `--color-border-subtle` | Divisori orizzontali, bordi card | `rgba(255,255,255,0.08)` | `#e2e8f0` (Slate 200) | Separatori a bassa intensità |
| `--color-border-active` | Focus, outline elementi selezionati | `rgba(99,102,241,0.4)` | `#6366f1` / `#4f46e5` | Evidenziazione stato attivo |
| `--color-text-primary` | Titoli, testo principale messaggi | `#f8fafc` (Slate 50) | `#0f172a` (Slate 900) | Massima leggibilità del contenuto |
| `--color-text-secondary` | Etichette, sottotitoli, metadati | `#94a3b8` (Slate 400) | `#475569` (Slate 600) | Informazioni secondarie |
| `--color-text-tertiary` | Timestamp, token count, placeholder | `#7e8d9f` (Slate 450) | `#64748b` (Slate 500) | Metadati a bassa gerarchia |
| `--color-text-disabled` | Controlli e testo disabilitato | `#475569` (Slate 600) | `#94a3b8` (Slate 400) | Inattivo (esente da WCAG SC 1.4.3) |
| `--color-brand` | Accento principale (indigo) | `#6366f1` (Brand 500) | `#4f46e5` (Brand 600) | Più scuro in Light per contrasto |
| `--color-brand-bg` | Sfondo messaggi assistente | `rgba(67,56,202,0.15)` | `#eef2ff` (Indigo 50) | Bolla messaggio dialectic |
| `--color-card-shadow` | Ombra schede | `none` | `0 1px 3px rgba(0,0,0,0.05)` | Micro-elevazione pulita |

---

## 3. Tassonomia Cognitiva Honcho & Badge Semantici

I 4 livelli cognitivi di Honcho mantengono la propria identità cromatica distintiva (Smeraldo, Indaco, Ambra, Rosa), ma nel tema chiaro i testi vengono portati alle tonalità 700/800 per garantire un contrasto elevato su sfondi pastello 50:

| Livello Cognitivo | Definizione Honcho | Token TEMA DARK | Token TEMA LIGHT | Contrasto Calcolato LIGHT |
|---|---|---|---|---|
| `explicit` | Fatti estratti dai messaggi | Bg: `rgba(16,185,129,0.10)`<br>Text: `#34d399` (Emerald 400)<br>Border: `rgba(16,185,129,0.20)` | Bg: `#ecfdf5` (Emerald 50)<br>Text: `#047857` (Emerald 700)<br>Border: `#a7f3d0` (Emerald 200) | **5.21:1** (su badge bg)<br>**5.48:1** (su white) &rarr; **Pass AA** |
| `deductive` | Deduzioni da premesse (dreaming) | Bg: `rgba(99,102,241,0.10)`<br>Text: `#818cf8` (Indigo 400)<br>Border: `rgba(99,102,241,0.20)` | Bg: `#eef2ff` (Indigo 50)<br>Text: `#4338ca` (Indigo 700)<br>Border: `#c7d2fe` (Indigo 200) | **7.07:1** (su badge bg)<br>**7.90:1** (su white) &rarr; **Pass AAA** |
| `inductive` | Generalizzazioni probabilistiche | Bg: `rgba(245,158,11,0.10)`<br>Text: `#fbbf24` (Amber 400)<br>Border: `rgba(245,158,11,0.20)` | Bg: `#fffbeb` (Amber 50)<br>Text: `#92400e` (Amber 800)<br>Border: `#fde68a` (Amber 200) | **6.84:1** (su badge bg)<br>**7.09:1** (su white) &rarr; **Pass AAA** |
| `contradiction` | Conflitti o discrepanze | Bg: `rgba(244,63,94,0.10)`<br>Text: `#fb7185` (Rose 400)<br>Border: `rgba(244,63,94,0.20)` | Bg: `#fff1f2` (Rose 50)<br>Text: `#be123c` (Rose 700)<br>Border: `#fecdd3` (Rose 200) | **5.72:1** (su badge bg)<br>**6.29:1** (su white) &rarr; **Pass AA** |

---

## 4. Evidenze e Calcoli Matematici di Contrasto

Tutti i contrasti sono stati calcolati matematicamente applicando la formula standard di luminanza relativa sRGB definita dal consorzio W3C / WCAG 2.1:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 > L_2)$$

*Dichiarazione di trasparenza:* Questi dati rappresentano calcoli geometrici e fotometrici simulati nello spazio colore sRGB standard, non perizie rilasciate da enti certificatori esterni.

### 4.1 Tema Light (Chiaro) — Calcoli Analitici
| Elemento Testuale | Colore Hex | Sfondo Applicato | Hex Sfondo | Ratio Misurato | Valutazione WCAG 2.1 |
|---|---|---|---|---|---|
| Testo Primario (Body/Titoli) | `#0f172a` | Sfondo Canvas | `#f8fafc` | **17.06:1** | Supera ampiamente soglia AAA (7.0:1) |
| Testo Primario (Card/Modal) | `#0f172a` | Superficie Scheda | `#ffffff` | **17.85:1** | Supera ampiamente soglia AAA (7.0:1) |
| Testo Primario (Subtle Panel) | `#0f172a` | Sfondo Subtle | `#f1f5f9` | **16.30:1** | Supera ampiamente soglia AAA (7.0:1) |
| Testo Secondario (Label/Meta) | `#475569` | Sfondo Canvas | `#f8fafc` | **7.24:1** | Supera soglia AAA (7.0:1) |
| Testo Secondario (Card/Modal) | `#475569` | Superficie Scheda | `#ffffff` | **7.58:1** | Supera soglia AAA (7.0:1) |
| Testo Terziario (Timestamp) | `#64748b` | Superficie Scheda | `#ffffff` | **4.76:1** | Supera soglia AA (4.5:1) |
| Accento Brand Primario | `#4f46e5` | Superficie Scheda | `#ffffff` | **6.29:1** | Supera soglia AA (4.5:1) |
| Badge Explicit | `#047857` | Badge Bg Pastello | `#ecfdf5` | **5.21:1** | Supera soglia AA (4.5:1) |
| Badge Deductive | `#4338ca` | Badge Bg Pastello | `#eef2ff` | **7.07:1** | Supera soglia AAA (7.0:1) |
| Badge Inductive | `#92400e` | Badge Bg Pastello | `#fffbeb` | **6.84:1** | Supera soglia AA (4.5:1) |
| Badge Contradiction | `#be123c` | Badge Bg Pastello | `#fff1f2` | **5.72:1** | Supera soglia AA (4.5:1) |
| Banner Errore Testo | `#9f1239` | Sfondo Banner Errore | `#fff1f2` | **7.30:1** | Supera soglia AAA (7.0:1) |
| Focus Ring Accento | `#4f46e5` | Offset Bianco Puro | `#ffffff` | **6.29:1** | Contrasto visivo netto |
| Testo Disabilitato | `#94a3b8` | Superficie Scheda | `#ffffff` | **2.56:1** | Esente da SC 1.4.3; percettibile come disabilitato |

### 4.2 Confronto Diretto con Tema Dark (Scuro)
| Elemento | Ratio DARK (su Canvas `#090d16`) | Ratio LIGHT (su Canvas `#f8fafc`) |
|---|---|---|
| Testo Primario | **18.57:1** (AAA) | **17.06:1** (AAA) |
| Testo Secondario | **7.58:1** (AAA) | **7.24:1** (AAA) |
| Testo Terziario | **5.73:1** (AA) | **4.55:1** (AA) |
| Accento Brand | **6.51:1** (AA) | **6.29:1** (AA) |
| Badge Explicit | **10.11:1** (AAA) | **5.21:1** (AA) |
| Badge Deductive | **6.51:1** (AA) | **7.07:1** (AAA) |
| Badge Inductive | **11.64:1** (AAA) | **6.84:1** (AA) |
| Badge Contradiction | **7.22:1** (AAA) | **5.72:1** (AA) |
| Banner Errore | **11.08:1** (AAA) | **7.30:1** (AAA) |

Entrambi i temi offrono leggibilità bilanciata, con testo primario e secondario sempre al di sopra dei requisiti di conformità WCAG AA/AAA.

---

## 5. Specifiche degli Stati & Casi Limite in Tema Light

1. **Stato Disabilitato (Disabled):**
   - Nei campi di input o controlli disabilitati (es. input `scope` quando `session_id` è selezionato), il tema chiaro usa sfondo `#f1f5f9`, bordo `#e2e8f0` e testo `#94a3b8` con cursore `not-allowed` e opacità controllata. L'elemento risulta chiaramente non cliccabile senza risultare invisibile.
2. **Stato di Focus (Focus Ring):**
   - Bordo di focus visibile ed uniforme:
     `focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white`.
   - Contrasto anello di focus (`#4f46e5`) rispetto all'offset bianco: **6.29:1**.
3. **Banner Errore API (Stato 500):**
   - Tema Light: Sfondo rosa tenue `#fff1f2` (`bg-rose-50`), linea di demarcazione sottile `#fecdd3` (`border-rose-200`), testo principale `#9f1239` (`text-rose-900`) e bottone d'azione "Riprova Connessione" con bordo e sfondo definiti.
4. **Stato di Caricamento (Skeleton Loader / Shimmer):**
   - Animazione lineare su gradiente chiaro:
     `linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(241, 245, 249, 0.9) 50%, rgba(226, 232, 240, 0.6) 100%)`.
   - Elimina l'effetto di bagliore scuro, fondendosi naturalmente con le schede bianche.
5. **Scrollbar Personalizzata Linear-Style:**
   - Tema Dark: binario `#090d16`, cursore `#1e293b`, hover `#334155`.
   - Tema Light: binario `#f8fafc`, cursore `#cbd5e1`, hover `#94a3b8`.

---

## 6. Architettura del Selettore Tema (Dark / Light / System)

### 6.1 Posizionamento & Anatomia Visiva
Il selettore è integrato nell'header globale (Navbar desktop e cassetto mobile), posizionato accanto allo State Simulator e al selettore workspace:
- Forma: Segmented control compatto a pillola con 3 pulsanti ad accesso rapido:
  1. 🌙 **Dark:** Forza la modalità scura.
  2. ☀️ **Light:** Forza la modalità chiara.
  3. 💻 **Auto (System):** Si aggancia dinamicamente alle preferenze di sistema operativo (`prefers-color-scheme`).

### 6.2 Accessibilità & Semantica HTML
- Contenitore: `<div role="radiogroup" aria-label="Selettore Tema">`
- Singole opzioni: `<button role="radio" aria-checked="true|false" aria-label="...">`
- Navigazione da tastiera: Supporto per `Tab`, `ArrowLeft`, `ArrowRight` e `Enter`.

### 6.3 Logica Reattiva & Persistenza
```javascript
// Recupero preferenza persistita o fallback a 'system'
let currentThemeMode = localStorage.getItem('honcho-theme') || 'system';

function applyTheme(mode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = (mode === 'dark') || (mode === 'system' && systemPrefersDark);
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  updateThemeSwitcherUI(mode);
}

function setTheme(mode) {
  currentThemeMode = mode;
  localStorage.setItem('honcho-theme', mode);
  applyTheme(mode);
}

// Ascolto dinamico delle preferenze OS quando impostato su 'system'
const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');
systemMedia.addEventListener('change', (e) => {
  if (currentThemeMode === 'system') {
    applyTheme('system');
  }
});
```

---

## 7. Linee Guida per l'Handoff a Developer (Nessuna Modifica Produzione Ora)

Quando Alex avrà approvato la proposta visiva e il Tech Lead darà il via libera all'implementazione:
1. **Configurazione CSS Variables in `src/index.css`:**
   Dichiarare i token in `:root` (light per default) e le corrispettive varianti in `.dark`.
2. **Estensione di `tailwind.config.js`:**
   Mappare le chiavi `canvas`, `surface`, `border` sui valori `var(--color-...)`.
3. **Componente Header (`src/components/layout/Navbar.tsx`):**
   Aggiungere il segmento `<ThemeSwitcher />` con hook React `useTheme()` che gestisce `localStorage` e il listener `matchMedia`.
4. **Zero Regressioni Dark:** Tutti i colori preesistenti in modalità dark rimangono identici al pixel.

---

## 8. Artefatti di Preview Verificabili in `/opt/data`

Tutti gli artefatti sono salvati all'interno della cartella di progetto e sono autonomi ed eseguibili offline:

1. **Documento di Specifica di Design (questo file):**  
   `/opt/data/projects/honcho-dashboard/docs/THEME_DESIGN.md`
2. **Mockup Navigabile Completo con Switcher Dark/Light/System:**  
   `/opt/data/projects/honcho-dashboard/mockup/index.html`  
   *Consente di navigare tutte le 5 aree operative e di testare il cambio tema in tempo reale sia su desktop che su mobile.*
3. **Console di Confronto Visivo Diretto (Side-by-Side Showcase):**  
   `/opt/data/projects/honcho-dashboard/mockup/theme-comparison.html`  
   *Consente ad Alex e al Tech Lead di visualizzare fianco a fianco i medesimi componenti in tema Dark e Light con tabella interattiva dei contrasti.*
