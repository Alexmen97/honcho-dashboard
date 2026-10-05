# Piano di Verifica e Collaudo Indipendente QA — Theme Extension (TH-04)
**Progetto:** Honcho Cognition Studio v1.1  
**Root di Progetto:** `/opt/data/projects/honcho-dashboard`  
**Autore:** `@qa-reviewer` (QA Engineer & Code Reviewer)  
**Destinatari:** `@tech-lead` (Tech Lead & Software Architect), `@developer` (Full-Stack Developer)  
**Riferimenti di Specifica:**  
- `docs/THEME_SCOPE.md` (Scope approvato da Alex, guardrail di gate e autorizzazioni)  
- `docs/THEME_DESIGN.md` (Matrice token semantici, specifiche switcher Dark/Light/System e analisi contrasti)  
- `docs/DESIGN_SYSTEM.md` & `mockup/theme-comparison.html` (Specifiche design system e console side-by-side)  
- `docs/QA_PLAN.md` & `docs/QA_REPORT.md` (Baseline di collaudo e regressioni accettate v1.1)  
- `docs/KANBAN.md` & `docs/RELEASE_DECISION.md` (Stato avanzamento ticket e vincoli di deploy)  
**Stato Ticket TH-04:** 🟡 **PIANIFICATO (COLLAUDO BLOCCATO IN ATTESA DI IMPLEMENTAZIONE & CODE FREEZE DEVELOPER)**  
**Signoff Gate TH-04:** 🔴 **BLOCCATO (Nessuna approvazione su mockup, prototipi o self-report)**  
**Destinazione Verbale di Collaudo:** `docs/THEME_QA_REPORT.md` (redatto esclusivamente a valle dell'handoff reale)  

---

## 1. Mandato QA, Obiettivi e Guardrail Inderogabili

### 1.1 Obiettivo del Piano QA
Il presente piano definisce la strategia di collaudo indipendente per l'estensione del sistema di temi (**Dark, Light e System Mode**) in **Honcho Cognition Studio v1.1** (ticket **TH-04**).  
L'obiettivo è verificare empiricamente:
1. La robustezza della persistenza e il fallback difensivo di `localStorage` (chiave `honcho-theme`).
2. La reattività dinamica ai cambi di tema dell'OS (`prefers-color-scheme`) e la pulizia rigorosa dei listener per prevenire memory leak.
3. L'assenza di sfarfallio del tema errato al primo rendering (*Flash of Unstyled Theme* / FOUC) e l'allineamento dei controlli nativi (`color-scheme`).
4. L'usabilità, semantica e navigabilità da tastiera del selettore tema su viewport desktop e mobile.
5. La leggibilità, contrasto effettivo (calcolato su compositing reale) e assenza di testo nascosto in tutte le schede, modali e stati applicativi per entrambe le palette.
6. La totale invarianza visiva e zero-regressione del tema Dark preesistente e delle suite di test consolidate (27 unit Vitest + 8 gateway + 9 E2E live).

### 1.2 Guardrail Operativi e Regole d'Ingaggio
1. **Source Code Intoccabile da QA:**  
   Il codice sorgente (`src/`, `server/`, `scripts/`, `package.json`) non verrà modificato da `@qa-reviewer`. Qualsiasi difetto rilevato sarà documentato nel report con passi di riproduzione esatti, log reali e raccomandazione per `@developer`.
2. **Nessun Collaudo né Signoff su Mockup o Self-Report:**  
   Il collaudo operativo e la redazione del verbale `docs/THEME_QA_REPORT.md` avverranno **esclusivamente** dopo che `@developer` avrà completato TH-02 e TH-03, eseguito le proprie verifiche e notificato il formale Handoff con Code Freeze.
3. **Nessuna Certificazione WCAG Fittizia:**  
   I rapporti di contrasto saranno misurati strumentalmente sul compositing effettivo (formula di luminanza relativa sRGB di WCAG 2.1). Non verrà rilasciata alcuna certificazione formale WCAG in assenza di un audit condotto con utenti e tecnologie assistive reali.
4. **Isolamento dei Dati e dei Peer Storici:**  
   Eventuali verifiche che comportino mutazioni live sul backend Honcho saranno confinate nel workspace sandbox `honcho-qa-sandbox` con peer sintetico `qa-peer`. Il workspace di produzione `test-hermes-workspace` e lo storico del peer `alex` rimarranno categoricamente intatti. Nessun job autonomo di dreaming (`schedule_dream`) o cleanup distruttivo sarà eseguito.
5. **Invarianza Rete e Confinamento Gateway:**  
   Il gateway Node.js rimarrà rigidamente confinato sul bind loopback `127.0.0.1:3000`. Nessun cambio di porta, proxy o esposizione LAN/pubblica è autorizzato.

---

## 2. Architettura delle Suite di Collaudo TH-04

```
[TH-04 Test Architecture]
 ├── Suite 01: Persistenza, Reload & Resilienza Storage (honcho-theme)
 ├── Suite 02: Reattività OS (matchMedia prefers-color-scheme) & Lifecycle Listener
 ├── Suite 03: Pre-paint Resolution, Native color-scheme & Prevenzione FOUC
 ├── Suite 04: Componente Selettore Tema, Accessibilità & Mobile Responsive
 ├── Suite 05: Visual Inspection, Palette Semantica & Calcolo Contrasti Reali
 ├── Suite 06: Zero-Regression Baseline (27 Vitest + 8 Gateway + 9 E2E Live)
 └── Suite 07: Toolchain, Packaging Locale & Confinamento Operativo
```

---

## 3. Matrice Dettagliata dei Test Case

### Suite 01: Persistenza, Reload & Resilienza Storage (`honcho-theme`)
**Obiettivo:** Verificare che la preferenza utente sia correttamente gestita tramite un enum rigoroso, che sopravviva al ricaricamento della pagina e che l'applicazione non crashi in presenza di storage disabilitato, chiavi corrotte o eccezioni di quota.

- **TC-01.1 — Persistenza Enum Validi (`localStorage`):**
  - *Procedura:* Tramite script browser/DevTools, selezionare consecutivamente `dark`, `light` e `system`.
  - *Verifica:* `localStorage.getItem('honcho-theme')` deve contenere esattamente il valore selezionato come stringa minuscola (`"dark"`, `"light"`, `"system"`). La classe `.dark` sull'elemento `<html>` (o l'attributo tema equivalente) deve riflettere immediatamente lo stato atteso.
- **TC-01.2 — Ripristino Fedele al Reload di Pagina:**
  - *Procedura:* Impostare `localStorage.setItem('honcho-theme', 'light')` e ricaricare la pagina (`window.location.reload()`). Ripetere con `'dark'`.
  - *Verifica:* Al completamento del caricamento, la dashboard deve avviarsi direttamente nella modalità memorizzata, senza richiedere interazioni da parte dell'utente.
- **TC-01.3 — Comportamento Utente Nuovo (Chiave Assente):**
  - *Procedura:* Eseguire `localStorage.removeItem('honcho-theme')` e ricaricare.
  - *Verifica:* Il sistema deve effettuare il fallback pulito a `system` per default, derivando il tema visivo iniziale dalle preferenze del sistema operativo host senza sollevare warning in console.
- **TC-01.4 — Resilienza a Valori Corrotti o Invalidi (Sanitizzazione Enum):**
  - *Procedura:* Iniettare valori arbitrari e non consentiti in storage:
    - Valori testuali non consentiti: `"blue"`, `"high-contrast"`, `"DARK"`, `""`, `"   "`.
    - Tipi anomali serializzati: `"null"`, `"undefined"`, `"123"`, `"{\"mode\":\"dark\"}"`.
    - Ricaricare l'applicazione.
  - *Verifica:* Il parser del tema deve intercettare il valore non valido, ignorarlo in sicurezza ed effettuare il fallback automatico su `system` (o `dark` come safe baseline), senza bloccare il rendering né corrompere lo stato React.
- **TC-01.5 — Tolleranza a Errori di Storage (`getItem` / `setItem` Throws):**
  - *Procedura:* Simulare tramite DevTools o mock lo scenario in cui l'accesso a `localStorage` lancia un'eccezione (`DOMException: SecurityError` tipico di iframe cross-origin, modalità incognito restrittiva, policy di privacy avanzate o `QuotaExceededError`).
  - *Verifica:* L'applicazione **non deve crashare**. Il cambio di tema tramite lo switcher UI deve continuare a funzionare in memoria per la sessione corrente, registrando un avviso difensivo degradato senza interrompere l'interattività della dashboard.

---

### Suite 02: Reattività OS (`prefers-color-scheme`) & Lifecycle Listener
**Obiettivo:** Verificare l'adattamento dinamico in tempo reale alle preferenze di sistema operativo e la corretta gestione del ciclo di vita dei listener per prevenire memory leak.

- **TC-02.1 — Adattamento Real-Time in Modalità `system`:**
  - *Procedura:* Selezionare lo switcher su `system`. Simulare il cambio di preferenza OS tramite media query listener:
    ```javascript
    // Trigger cambio OS da dark a light
    window.dispatchEvent(new Event('themechange')); // o simulazione matchMedia change
    ```
  - *Verifica:* L'interfaccia deve commutare istantaneamente la palette da scura a chiara (e viceversa) in tempo reale, **senza richiedere il ricaricamento** della pagina.
- **TC-02.2 — Immunità dei Temi Fissi (`dark` e `light` Espliciti):**
  - *Procedura:* 
    1. Selezionare esplicitamente `dark`. Simulare il passaggio dell'OS a modalità chiara (`prefers-color-scheme: light`).
    2. Selezionare esplicitamente `light`. Simulare il passaggio dell'OS a modalità scura (`prefers-color-scheme: dark`).
  - *Verifica:* L'interfaccia **non deve mutare**. La scelta esplicita dell'utente ha priorità assoluta e deve rimanere bloccata sul tema selezionato, ignorando qualsiasi evento dell'OS.
- **TC-02.3 — Cleanup Rigoroso dei Listener `matchMedia`:**
  - *Procedura:* Ispezionare il codice e condurre test di mount/unmount o commutazione tra `system` e temi fissi.
  - *Verifica:* Quando l'utente passa da `system` a `dark` o `light`, o quando il componente viene smontato, la funzione di sottoscrizione (`removeEventListener('change', ...)`) deve essere invocata. Nessun listener orfano deve rimanere in ascolto nel runtime.

---

### Suite 03: Pre-paint Resolution, Native `color-scheme` & Prevenzione FOUC
**Obiettivo:** Verificare l'assenza di bagliori o inversioni cromatiche repentine durante il caricamento e l'allineamento dei componenti nativi del browser.

- **TC-03.1 — Prevenzione del Flash of Unstyled Theme (FOUC):**
  - *Procedura:* Impostare `localStorage` su `dark`. Ricaricare la pagina con throttling della CPU e della rete, ispezionando il primo frame renderizzato prima dell'idratazione React. Ripetere con `light`.
  - *Verifica:* Nessun flash visivo: lo script di pre-paint collocato in `<head>` (o l'esecuzione iniziale sincrona) deve applicare la classe `.dark` (o light) al tag `<html>` **prima** che avvenga il primo paint del canvas.
- **TC-03.2 — Sincronizzazione Proprietà CSS / Meta `color-scheme`:**
  - *Procedura:* Ispezionare lo stile computato su `document.documentElement` e l'eventuale meta tag `<meta name="color-scheme">`.
  - *Verifica:* In modalità Dark deve valere `color-scheme: dark`. In modalità Light deve valere `color-scheme: light`. I controlli del browser nativi (scrollbar di sistema, menu a discesa select, datepicker, controlli input) devono ereditare la palette corrispondente.
- **TC-03.3 — Isolamento Runtime Headless / Ambienti di Test:**
  - *Procedura:* Eseguire le suite di test Vitest e Node.js (`npm test`).
  - *Verifica:* Il codice di inizializzazione tema deve verificare la presenza dei globali del browser (`typeof window !== 'undefined'`, `window.localStorage`, `window.matchMedia`) prima dell'invocazione, garantendo esecuzione pulita e zero errori in ambienti SSR o test runner headless.

---

### Suite 04: Componente Selettore Tema, Accessibilità & Mobile Responsive
**Obiettivo:** Verificare la conformità semantica, la navigabilità esclusiva da tastiera e l'usabilità dello switcher sia su desktop che su schermi compatti.

- **TC-04.1 — Semantica HTML & Attributi ARIA:**
  - *Verifica:*
    - Il contenitore deve esporre un ruolo semantico chiaro (es. `role="radiogroup"` o un gruppo di bottoni coerente con `aria-label="Selettore Tema"` o equivalente).
    - I singoli controlli (Dark, Light, System) devono esporre testo visibile o `aria-label` esplicito e indicatore di stato attivo (es. `aria-checked="true|false"` o `aria-pressed="true|false"`).
- **TC-04.2 — Navigazione da Tastiera & Focus Indicator:**
  - *Procedura:* Navigare verso lo switcher unicamente tramite il tasto `Tab`. Selezionare le opzioni con `ArrowLeft`, `ArrowRight`, `Enter` o `Space`.
  - *Verifica:* 
    - L'anello di focus deve essere chiaramente visibile ad alto contrasto (`focus-visible:ring-2`, es. Indigo `#4f46e5` o `#6366f1`) sia in Dark che in Light.
    - Nessun blocco da tastiera (*no keyboard trap*).
    - L'opzione attiva deve essere visivamente distinta tramite pill/sfondo differenziato.
- **TC-04.3 — Usabilità Desktop vs Mobile Drawer:**
  - *Procedura:* 
    - Testare lo switcher nella navbar superiore su viewport desktop (1280px, 1440px).
    - Ridurre il viewport a dimensioni mobile (375px, 390px, 414px), aprire il menu mobile (drawer) e azionare lo switcher.
  - *Verifica:* Lo switcher deve essere perfettamente renderizzato, privo di sovrapposizioni o tagli di testo (*text clipping*), e reattivo al tocco/click su entrambi i layout.

---

### Suite 05: Visual Inspection, Palette Semantica & Calcolo Contrasti Reali
**Obiettivo:** Verificare empiricamente l'aspetto visivo e calcolare i contrasti matematici effettivi (sRGB relative luminance) su tutti i componenti e per entrambe le palette.

- **TC-05.1 — Copertura Completa di Tutte le Schede Funzionali:**
  - *Verifica in Dark e Light per:*
    1. **Panoramica (Overview):** Metriche chiave, stato code, lista attività recenti, badge operativi.
    2. **Sessioni & Timeline:** Lista sessioni, riquadro metadati, timeline messaggi (bolle utente vs assistente), composer di testo batch.
    3. **Peer Cognitivi:** Lista peer, stato della scheda cognitiva (inclusa la gestione difensiva del null state `"in fase di distillazione..."`), contesti e representational query.
    4. **Conclusioni & Ricerca:** Tabella conclusioni, filtri per livello cognitivo, input query semantica con slider distanza, cassetto premesse (*premises drawer*) con bottoni di drilldown.
    5. **Dialectic Playground:** Interfaccia chat a due colonne, selettore mutuo esclusivo (Session ID vs Named Scope), bolle di risposta con evidenze/citazioni e pulsante Interrompi (Abort).
- **TC-05.2 — Copertura dei Dialoghi Modali & Cassetti:**
  - *Verifica in Dark e Light per:*
    - `CreateWorkspaceModal` (+ Nuovo Workspace).
    - `CreateSessionModal` (Nuova Sessione).
    - `CreatePeerModal` (Nuovo Peer).
    - Drawer laterale di dettaglio premesse.
  - *Criteri visivi:* Sfondo del modale su superficie elevata, bordi definiti rispetto al backdrop oscurato, input con etichette nitide e bottoni di conferma/annullamento contrastati.
- **TC-05.3 — Stati dei Componenti & Casi Limite:**
  - **Badge Livelli Cognitivi:**
    - `explicit`: Dark (Emerald pastello su dark) vs Light (`bg-emerald-50`, `text-emerald-700`, bordo `emerald-200`).
    - `deductive`: Dark (Indigo su dark) vs Light (`bg-indigo-50`, `text-indigo-700`, bordo `indigo-200`).
    - `inductive`: Dark (Amber su dark) vs Light (`bg-amber-50`, `text-amber-800`, bordo `amber-200`).
    - `contradiction`: Dark (Rose su dark) vs Light (`bg-rose-50`, `text-rose-700`, bordo `rose-200`).
  - **Banner Errore API (HTTP 500 / Network Error):**
    - Light: Sfondo tenue `bg-rose-50`, bordo `border-rose-200`, testo `text-rose-900` e bottone riprova definito.
  - **Skeleton / Shimmer Loader:**
    - Light: Gradiente di caricamento chiaro e morbido, senza flash o bagliori scuri su card bianche.
  - **Riquadri Evidenze & Code Blocks:**
    - Sfondo distinto, testo mono spaziale leggibile, bordi di delimitazione netti.
  - **Controlli Disabilitati:**
    - Input disabilitati (es. Scope disabilitato da Session ID) chiaramente percettibili come inattivi ma non sbiaditi fino all'invisibilità.
- **TC-05.4 — Analisi Fotometrica e Calcolo Contrasti Reali (No Blind Certification):**
  - *Formula:* $CR = \frac{L_1 + 0.05}{L_2 + 0.05}$ con luminanza $L = 0.2126 R + 0.7152 G + 0.0722 B$ lineare.
  - *Soglie minime di accettazione empirica:*
    - Testo normale (primario e secondario): $\ge 4.5:1$ (soglia minima AA).
    - Testo grande e intestazioni primarie: $\ge 3.0:1$.
    - Badge semantici (testo su sfondo badge e badge su sfondo pagina): $\ge 4.5:1$.
    - Componenti grafici essenziali e anelli di focus: $\ge 3.0:1$.
  - *Zero Testo Invisibile:* Controllo automatico ed empirico che nessun elemento testuale presenti contrasto $< 2.0:1$ o colori identici allo sfondo di compositing (es. testo bianco su card bianca o testo nero su sfondo scuro).

---

### Suite 06: Zero-Regression Baseline su Funzionalità Esistenti
**Obiettivo:** Garantire che l'introduzione delle classi o variabili per il tema chiaro non abbia minimamente intaccato il funzionamento del tema dark esistente, dei contratti API, della sicurezza e delle correzioni consolidate.

- **TC-06.1 — Invarianza Visiva Assoluta del Tema Dark:**
  - *Verifica:* Confronto pixel e token del tema scuro rispetto alla v1.1 congelata. Canvas `#090d16`, superfici `#0f172a` e `#1e293b`, testi `#f8fafc` e `#94a3b8` devono rimanere inalterati.
- **TC-06.2 — Suite Vitest Frontend (27 Test Esistenti):**
  - *Comando:* `npm test`
  - *Criterio di successo:* 27/27 test superati in 7 file, con zero errori e zero warning React `act()`.
- **TC-06.3 — Suite di Sicurezza Gateway (8 Test Esistenti):**
  - *Comando:* `npm run test:gateway`
  - *Criterio di successo:* 8/8 test superati (generazione dinamica contratti `DEV-01`, stub body limits e chunked overflow `PERF-01`, route allowlist puntuale, normalizzazione traversal e backslash, validazione Host anti-rebinding, validazione Origin rigida `SEC-01b`).
- **TC-06.4 — Suite di Integrazione Live E2E (9 Test Esistenti):**
  - *Comando:* `npm run test:e2e`
  - *Criterio di successo:* 9/9 test superati (static assets, security headers, allowlist 403, host/origin rejection, body limits 413, health check, pagination query, test workspace lifecycle).
- **TC-06.5 — Regressioni Funzionali Chiave:**
  - *Isolamento Dialectic al cambio workspace:* La prop `key={activeWorkspaceId}` e il reset dei messaggi devono persistere in entrambi i temi.
  - *Focus trap & Focus restoration nei modali:* L'autofocus, il confinamento Tab e il ripristino del focus alla chiusura Escape devono funzionare identicamente in Dark e Light.
  - *Drilldown premesse conclusioni:* I bottoni semantici delle premesse `source_ids` devono mantenere azionabilità da tastiera con focus ring visibile in entrambe le modalità.

---

### Suite 07: Toolchain, Packaging Locale & Confinamento Operativo
**Obiettivo:** Convalidare la compilazione pulita degli asset di produzione e il rispetto dei confini di rete e di isolamento dei profili.

- **TC-07.1 — Rigenerazione Tipi OpenAPI:**
  - *Comando:* `npm run types:generate`
  - *Criterio:* Generazione deterministica di `src/types/api.ts` dallo snapshot autoritativo `docs/openapi-3.2.2.json` (exit code 0).
- **TC-07.2 — Typecheck e Compilazione di Produzione:**
  - *Comandi:* `npm run typecheck && npm run build`
  - *Criteri:* Zero errori di compilazione TypeScript (`tsc --noEmit`), build Vite completata in `dist/` con asset CSS e JS locali. Nessun CDN esterno, nessun font remoto caricato a runtime.
- **TC-07.3 — Confinamento Rete e Assenza Modifiche Deploy:**
  - *Verifica:* Il gateway Node (`server/index.mjs`) rimane vincolato esclusivamente su `127.0.0.1:3000`. Nessun parametro di reverse proxy Umbrel o porta pubblica modificata.

---

## 4. Flusso Operativo per l'Esecuzione del Collaudo

```
[1. Stato Attuale]
  ├── Piano TH-04 redatto ed approvato (questo documento).
  └── Collaudo BLOCCATO in attesa di implementazione developer.

[2. Evento Sblocco: Handoff Developer]
  ├── Developer completa TH-02 (Token semantici CSS / Tailwind) e TH-03 (Switcher accessibile).
  ├── Developer notifica Handoff formale e Code Freeze con suite verdi.
  └── Developer fornisce lista precisa dei file modificati.

[3. Esecuzione Indipendente QA]
  ├── Avvio gateway di test su porta loopback dedicata (es. 127.0.0.1:4050).
  ├── Esecuzione comandi di toolchain: npm run types:generate, npm test, npm run test:gateway, npm run test:e2e.
  ├── Esecuzione script di probe browser E2E (persistenze, storage throws, reload, switch OS).
  ├── Misurazione fotometrica dei contrasti effettivi in tema Dark e Light.
  ├── Verifica accessibilità da tastiera e focus trap/restoration in entrambe le modalità.
  └── Convalida isolamento su workspace sandbox 'honcho-qa-sandbox'.

[4. Verbalizzazione Risultati]
  ├── Redazione di docs/THEME_QA_REPORT.md con comandi esatti, output integrali, tabelle e log.
  └── Aggiornamento del tabellone docs/KANBAN.md.

[5. Decisione del Gate]
  ├── Se presenti difetti P1/P2: Gate TH-04 RESPINTO/BLOCCATO con task di rework a developer.
  └── Se conforme a tutti i requisiti: Gate TH-04 APPROVATO e sblocco TH-05 per Tech Lead.
```

---

## 5. Criteri di Accettazione per il Signoff TH-04

Il signoff formale su **TH-04** sarà concesso **esclusivamente** se tutte le seguenti condizioni risulteranno verificate con prove strumentali:
1. `localStorage` gestisce l'enum `'dark' | 'light' | 'system'` con persistenza garantita al reload, default difensivo su `'system'` e resilienza completa a valori corrotti o storage bloccato.
2. In modalità `'system'`, il tema reagisce dinamicamente a `prefers-color-scheme`, mentre nelle modalità fisse `'dark'` e `'light'` rimane totalmente insensibile ai cambi OS. Listener puliti al dismount.
3. Pre-paint theme resolution previene qualsiasi sfarfallio (FOUC), e `color-scheme` nativo è sincronizzato.
4. Selettore tema completamente navigabile da tastiera con nome accessibile e indicatore di focus nitido su desktop e mobile drawer.
5. Tutte le 5 aree operative, i 3 modali, il drawer premesse, i 4 badge cognitivi, i banner d'errore e gli skeleton loader presentano contrasto misurato $\ge 4.5:1$ per il testo normale e $\ge 3.0:1$ per componenti grafici/focus, con zero testo nascosto.
6. Il tema Dark esistente non subisce alcuna alterazione visiva e tutte le 27 prove Vitest, 8 prove gateway e 9 prove live E2E rimangono verdi.
7. Nessuna modifica non autorizzata a file non tematici, nessuna dipendenza da CDN remoti e nessun disallineamento sul bind loopback `127.0.0.1:3000`.
