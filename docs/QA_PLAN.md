# Piano di Verifica e Collaudo Indipendente QA (HCS-08)
**Progetto:** Honcho Cognition Studio v1.1  
**Root di Progetto:** `/opt/data/projects/honcho-dashboard`  
**Autore:** `@qa-reviewer` (QA Engineer & Code Reviewer)  
**Destinatario:** `@tech-lead` (Tech Lead & Software Architect), `@developer` (Full-Stack Developer)  
**Riferimenti di Specifica:**  
- `docs/IMPLEMENTATION.md` (Scope approvato e vincoli di sicurezza)  
- `docs/openapi-3.2.2.json` (Snapshot autoritativo OpenAPI 3.1.0, istanza target `http://192.168.4.91:8000`)  
- `docs/api-schema-notes.md` (Note di allineamento runtime e contratti v1.1)  
- `docs/DESIGN_SYSTEM.md` e `mockup/index.html` (Mockup navigabile v1.1 approvato da Alex)  
- `docs/KANBAN.md` (Tabellone avanzamento HCS-01..09)  
**Stato Ticket HCS-08:** **BLOCCATO (IN ATTESA DI HANDOFF CODICE & TEST DEVELOPER)**  
**Signoff Gate:** **BLOCCATO (Nessuna approvazione su mockup, prototipi o self-report)**  
**Separazione Artefatti:** Il presente documento costituisce la specifica del piano di collaudo. I log, le evidenze strumentali e i risultati delle esecuzioni reali saranno verbalizzati separatamente in `docs/QA_AUDIT_EXECUTION.md` al momento dell'audit live.

---

## 1. Mandato QA, Obiettivi e Regole d'Ingaggio

### 1.1 Obiettivo del Piano QA
Il presente piano definisce la strategia di collaudo indipendente per il rilascio di **Honcho Cognition Studio v1.1** (ticket Kanban **HCS-08**). L'obiettivo è verificare in modo rigoroso, oggettivo e riproducibile l'integrità architetturale, la correttezza dei contratti API, la resilienza del gateway locale, la sicurezza dell'interfaccia (XSS, isolamento segreti, directory traversal) e la robustezza dei flussi asincroni e streaming (SSE, race conditions di navigazione, gestione errori backend).

### 1.2 Regole d'Ingaggio e Vincoli Operativi Inderogabili
1. **Nessuna alterazione del codice dello sviluppatore:**  
   Il ruolo di QA è di audit, verifica ed esecuzione test. Nessun file sorgente (`src/`, `server/`, `package.json`, configurazioni applicative) verrà modificato da `@qa-reviewer`. Eventuali difetti verranno tracciati con riproduzione esatta, gravità e raccomandazione di fix per `@developer`.
2. **Signoff BLOCCATO fino a esecuzione su codice e build reale:**  
   Nessun signoff o approvazione formale sarà emessa su mockup HTML statici, prototipi o semplici self-report. Lo sblocco del gate HCS-08 richiede codice funzionante, build di produzione (`npm run build`), verifica typecheck (`npm run typecheck`), esecuzione suite automatizzate (`vitest`, `node --test`) e collaudo HTTP live sul gateway locale.
3. **Workspace Dedicato per Scritture Live (Zero Dreaming / Zero Cleanup Distruttivo):**  
   - Qualsiasi test di scrittura live (creazione workspace, sessioni, invio messaggi batch) deve avvenire **esclusivamente** all'interno di un workspace dedicato creato ad hoc per il collaudo (es. `honcho-qa-sandbox`).
   - È **tassativamente vietato** modificare, cancellare o sporcare il workspace esistente `test-hermes-workspace` e lo storico/sessioni del peer `alex`. Negli esempi di test di scrittura deve essere utilizzato un peer sintetico dedicato (es. `qa-peer`).
   - I test di lettura contro dati reali devono rimanere strettamente passivi e non devono divulgare informazioni personali o confidenziali.
   - È **vietato** avviare job autonomi di dreaming (`POST /schedule_dream`) o operazioni distruttive di cleanup/cancellazione non preventivamente concordate.
4. **Fixture SSE del Designer come Ipotesi da Verificare:**  
   Le annotazioni e gli esempi di frame SSE prodotti dal designer (`data: {"delta": ...}`) rimangono ipotesi di lavoro finché non saranno validati indipendentemente sul campo tramite test HTTP/SSE diretti sul gateway e sul backend reale. Nessun signoff sarà basato su self-report.
5. **Dichiarazione Esplicita su Accessibilità (Non certificare WCAG senza audit):**  
   I calcoli matematici di contrasto (contrast ratio $\ge 7:1$ / $\ge 4.5:1$) e l'uso di tag semantici non costituiscono certificazione formale di conformità WCAG 2.1/2.2. La conformità WCAG formale non può essere attestata senza un audit dedicato condotto con screen reader reali (NVDA, VoiceOver) e tecnologie assistive.

---

## 2. Confronto Mockup v1.1 vs Specifica OpenAPI 3.2.2 (Gap Analysis & Guardrails)

Dall'analisi comparativa tra il mockup navigabile `mockup/index.html` (revisione v1.1) e lo snapshot autoritativo `docs/openapi-3.2.2.json`, si evincono i seguenti punti critici di allineamento che il codice implementato deve rispettare:

| Area Funzionale | Comportamento Mockup v1.1 | Contratto OpenAPI 3.2.2 / Backend | Rischio / Guardrail QA |
|---|---|---|---|
| **Paginazione Liste (`/list`)** | Query params simulati (`?page=1&size=50&reverse=false`) | Parametri in **Query String** (`in: query`), body JSON opzionale per filtri (`WorkspaceGet`, ecc.) | Verificare che il client TanStack Query **non** invii `page`, `size`, `reverse` nel corpo JSON della POST. |
| **Creazione Messaggi** | Modale composer simula singolo messaggio per `alex` | Richiede schema `MessageBatchCreate`: `{"messages": [{"content": ..., "peer_id": ...}]}` | Rifiuto HTTP 422 se inviato oggetto singolo slegato. Frontend deve incapsulare sempre in array `messages` (1..100). Nei test live usare peer sintetico `qa-peer`. |
| **Idempotenza Mutazioni** | Non affrontata nel mockup | `POST /messages` non è idempotente (il server genera nuovi ID per ogni invocazione) | In caso di timeout o errore di rete, il retry manuale può generare messaggi duplicati. L'UI deve comunicare l'esito incerto e suggerire di verificare la timeline prima di reinviare. |
| **Peer Card Schema** | Mostra badge percentuali di confidenza simulati | `GET /peers/{id}/card` restituisce `PeerCardResponse { peer_card: string[] \| null }` | Nessun badge o punteggio di confidenza è fornito dall'API (solo array di stringhe). Renderizzare solo il testo delle asserzioni. Se `null`, renderizzare stato informativo vuoto. |
| **Origine Premesse (`source_ids`)** | Mostra tab derivazioni generica | `Conclusion.source_ids`: array di stringhe riferite a ID di altre **conclusioni**, vuoto per livello `explicit` | Le premesse puntano a conclusioni antecedenti (`GET .../conclusions/{id}`), **non** a singoli messaggi (`/messages/{id}`). |
| **Validazione Query Semantica** | Input di ricerca testo libero | `ConclusionQuery`: `query` è stringa obbligatoria senza `minLength` formale nello schema | La restrizione a stringa non-vuota è una scelta difensiva di UX/frontend per evitare query prive di senso semantico. |
| **Representation Semantics** | Bottone "Recupera Representation" con feedback query | `POST /peers/{id}/representation` è una query mirata di subset, **non** re-embedding vettoriale | Il client non deve attendere job asincroni o simulare re-indicizzazioni; è un'operazione di lettura/filtraggio sincrona. |
| **Scope vs Session Mutual Exclusivity** | Radio toggle mutuo esclusivo (disabilita l'altro campo) | `DialecticOptions`: `scope` è incompatibile con `session_id` e con `filters` | Se entrambi presenti, backend risponde `422 Unprocessable Entity`. Payload deve omettere rigidamente i campi inattivi. |
| **Soglia Distanza Conclusioni** | Slider da 0.1 a 1.0 (default 0.75) | `ConclusionQuery`: `distance` è float tra `0.0` e `1.0` (o `null`) | Verificare validazione client e visualizzazione ordinata per similarità decrescente (distanza coseno crescente). |
| **Gateway Allowlist & Rete** | Standalone HTML locale con `tailwind.js` | SPA React dietro gateway Node con rotte allowlistate puntuali e proxy verso `http://192.168.4.91:8000` | Vietate wildcard permissive (es. `/v3/workspaces*`). Il gateway deve autorizzare solo specifiche coppie metodo/path annidate. Bind predefinito su loopback. |

---

## 3. Matrice dei Test & Suite di Verifica Dettagliate

Il piano si articola in **13 Suite di Verifica** indipendenti:

```
[HCS-08 Test Plan Architecture]
 ├── Suite 01: API Contract & Paginazione Query
 ├── Suite 02: Creazione Messaggi Batch, Esito Incerto & Nessun Blind Retry
 ├── Suite 03: Peer Management, Null Peer Card (String Only) & Representation
 ├── Suite 04: Conclusioni, Tassonomia Cognitiva, source_ids & Ricerca Vettoriale
 ├── Suite 05: Isolamento Cache Workspace (Chiavi Query) & Prevenzione Race Conditions
 ├── Suite 06: Dialectic Reasoning Playground & Esclusività Scope/Session
 ├── Suite 07: SSE Streaming, Chunk UTF-8, CRLF, Abort & Divieto Blind Reconnect
 ├── Suite 08: Provenienza Evidenze & Lazy Loading Citazioni
 ├── Suite 09: Sanificazione Input & Prevenzione XSS
 ├── Suite 10: Gateway Node, Route Puntuali Allowlist, Traversal & Segreti
 ├── Suite 11: Resilienza Backend, Errori HTTP & Degradazione
 ├── Suite 12: Layout Responsive, Navigazione Tastiera & Focus
 └── Suite 13: Verifica Accessibilità & Delimitazione Audit WCAG
```

---

### Suite 01: Schema & Paginazione Query (Tutti gli Endpoint `/list`)
**Obiettivo:** Verificare che tutte le chiamate di elenco utilizzino i parametri di paginazione nella query string e validare la gestione delle risposte `Page[T]`.

- **TC-01.1 — Query String Parameter Compliance:**
  - *Endpoint testati:*
    - `POST /v3/workspaces/list?page=1&size=20&reverse=false`
    - `POST /v3/workspaces/{workspace_id}/sessions/list?page=1&size=20&reverse=false`
    - `POST /v3/workspaces/{workspace_id}/peers/list?page=1&size=20&reverse=false`
    - `POST /v3/workspaces/{workspace_id}/sessions/{session_id}/messages/list?page=1&size=20&reverse=false`
    - `POST /v3/workspaces/{workspace_id}/conclusions/list?page=1&size=20&reverse=false`
  - *Metodo di test:* Ispezione delle richieste di rete (DevTools / proxy log).
  - *Criterio di successo:* I parametri `page`, `size`, `reverse` devono risiedere esclusivamente nell'URL query string. Il body JSON della richiesta deve essere vuoto (`{}`) oppure contenere solo il filtro opzionale ammesso dallo schema OpenAPI.
- **TC-01.2 — Risposta Strutturata `Page[T]`:**
  - *Criterio di successo:* Validazione che la risposta contenga `items` (array), `total` ($\ge 0$), `page` ($\ge 1$), `size` ($\ge 1$), `pages` ($\ge 0$).
- **TC-01.3 — Limiti e Boundary di Paginazione:**
  - *Test cases:*
    - Pagina successiva (`page=2`), ultima pagina (`page=pages`).
    - Richiesta fuori limite (`page=999999`): l'interfaccia deve gestire `items: []` senza errori visualizzando "Nessun elemento".
    - Dimensione minima e massima (`size=1`, `size=100`).
    - Ordinamento inverso (`reverse=true` vs `reverse=false`): verifica ordine temporale corretto.

---

### Suite 02: Creazione Messaggi Batch, Esito Incerto & Nessun Blind Retry
**Obiettivo:** Verificare la conformità allo schema `MessageBatchCreate`, la generazione lato server degli ID, la gestione delle condizioni di timeout/esito incerto e l'assenza di falsi presupposti di idempotenza.

- **TC-02.1 — Schema Batch Obbligatorio (Peer Sintetico QA):**
  - *Endpoint:* `POST /v3/workspaces/{workspace_id}/sessions/{session_id}/messages`
  - *Workspace:* Rigorosamente `honcho-qa-sandbox` (vietato usare `test-hermes-workspace`).
  - *Payload valido:* `{"messages": [{"content": "Test di verifica QA", "peer_id": "qa-peer"}]}` (array da 1 a 100).
  - *Criterio di successo:* Risposta HTTP `201 Created` con array di messaggi creati contenente `id` univoco generato dal server.
- **TC-02.2 — Rifiuto Oggetto Piatto (Negativo):**
  - *Payload non valido:* `{"content": "Messaggio non nidificato", "peer_id": "qa-peer"}`.
  - *Criterio di successo:* Risposta HTTP `422 Unprocessable Entity` intercettata dall'UI con notifica d'errore leggibile.
- **TC-02.3 — Validazione Limiti Batch & Contenuto:**
  - Array vuoto (`messages: []`): rifiuto con 422 (minItems: 1).
  - Array sovradimensionato (> 100 messaggi): rifiuto con 422 (maxItems: 100).
  - Testo > 25.000 caratteri (maxLength): blocco lato client con contatore caratteri e rifiuto backend 422.
- **TC-02.4 — Gestione Timeout, Esito Incerto & Avviso Duplicati (Nessuna Falsa Idempotenza):**
  - *Analisi del rischio:* Poiché l'endpoint `POST /messages` genera nuovi record con nuovi ID ad ogni invocazione, l'operazione **non è idempotente**. Se si verifica un timeout di rete o un errore 504 Gateway Timeout, il server potrebbe aver già salvato il messaggio anche se la risposta non è giunta al client.
  - *Comportamento UI atteso:*
    1. Durante l'invio del messaggio, il pulsante entra in stato `disabled` ("Invio in corso...") per impedire il double-click.
    2. TanStack Query **non deve** rieseguire automaticamente la mutazione POST.
    3. In caso di timeout o errore di connessione non deterministico, l'interfaccia **non deve promettere una reinviazione sicura/idempotente**. Deve mostrare un messaggio di "Esito incerto: il messaggio potrebbe essere stato memorizzato. Si consiglia di aggiornare la timeline prima di tentare un nuovo invio manuale per evitare duplicati".

---

### Suite 03: Peer Management, Null Peer Card (String Only) & Representation
**Obiettivo:** Verificare la gestione dinamica dei peer, la robustezza in caso di `peer_card === null`, la fedeltà allo schema (array di sole stringhe senza confidenza inventata) e la semantica di query per la representation.

- **TC-03.1 — Dinamismo Peer (Nessun Hardcoding):**
  - *Verifica:* L'applicazione carica l'elenco dei peer dinamicamente tramite `POST .../peers/list`. Non deve essere cablato `"alex"` a livello di codice se nel workspace sono presenti altri peer.
- **TC-03.2 — Null Peer Card Resilience:**
  - *Endpoint:* `GET /v3/workspaces/{workspace_id}/peers/{peer_id}/card`
  - *Risposta:* `{"peer_card": null}` (condizione normale in cui Honcho non ha ancora distillato tratti cognitivi tramite cicli di dreaming).
  - *Criterio di successo:* L'interfaccia **non genera errori JavaScript** in console. Renderizza la card informativa di apprendimento: *"Honcho sta osservando le conversazioni con {peer_id}. Le schede cognitive vengono sintetizzate durante i cicli autonomi di dreaming."*
- **TC-03.3 — Populated Peer Card (Assenza di Badge di Confidenza Inventati):**
  - *Contratto OpenAPI:* `PeerCardResponse { peer_card: string[] | null }`. Lo schema restituisce esclusivamente un elenco di stringhe testuali.
  - *Criterio di successo:* L'interfaccia deve renderizzare le asserzioni come punti elenco testuali o card descrittive. È **tassativamente vietato inventare badge, percentuali o barre di confidenza** (es. "98% confidence") non presenti nel modello dati di Honcho.
- **TC-03.4 — Representation Query Semantics:**
  - *Endpoint:* `POST /v3/workspaces/{workspace_id}/peers/{peer_id}/representation`
  - *Verifica:* L'azione nella UI deve chiaramente indicare che si tratta di una "Interrogazione della rappresentazione" (recupero sincrono filtrato per sessione o target) e non di una re-indicizzazione o calcolo pesante di embedding.

---

### Suite 04: Conclusioni, Tassonomia Cognitiva, `source_ids` & Ricerca Vettoriale
**Obiettivo:** Distinguere la consultazione tabellare da quella semantica, validare le soglie di distanza, chiarire che `source_ids` punta a conclusioni e validare le scelte UX sulla query.

- **TC-04.1 — Distinzione Elenco vs Ricerca Semantica:**
  - La visualizzazione predefinita deve interrogare `POST .../conclusions/list` con query params di paginazione.
  - L'avvio di una ricerca semantica deve invocare `POST .../conclusions/query` con payload `ConclusionQuery`.
- **TC-04.2 — Validazione Payload `ConclusionQuery` (Scelta UX vs Schema):**
  - Campi schema: `query` (stringa), `top_k` (intero 1..100, default 10), `distance` (float 0.0..1.0 o null).
  - *Nota architetturale:* Lo schema OpenAPI non definisce un `minLength` per il campo `query`. Il blocco dell'invio su stringa vuota o composta da soli spazi deve essere trattato esplicitamente come **decisione e protezione UX lato client**, per prevenire query vettoriali prive di significato semantico.
  - *Test boundary distanza:* Testare valori 0.0, 0.25, 0.5, 0.75, 1.0. Rifiuto o sanitizzazione per valori negativi (< 0.0) o superiori a 1.0.
  - *Comprensione semantica:* Spiegazione nell'interfaccia che una distanza coseno inferiore corrisponde a una maggiore affinità semantica (0.0 = identico, 1.0 = ortogonale).
- **TC-04.3 — Tassonomia e Badge Cognitivi:**
  - Visualizzazione e filtraggio accurato per i 4 livelli:
    1. `explicit` (estrazione diretta da messaggi, `source_ids` vuoto) — colore Smeraldo.
    2. `deductive` (derivato da premesse logiche) — colore Indaco.
    3. `inductive` (generalizzazione da pattern) — colore Ambra.
    4. `contradiction` (conflitto cognitivo rilevato) — colore Rosa.
- **TC-04.4 — Drawer Premesse: `source_ids` Riferiscono CONCLUSIONI (Non Messaggi):**
  - *Contratto OpenAPI:* `Conclusion.source_ids` è un array di identificativi di altre **conclusioni** (le premesse per le deduzioni, le fonti a supporto per le induzioni, le conclusioni discordanti per le contraddizioni). Per il livello `explicit` l'array è vuoto poiché deriva direttamente da messaggi.
  - *Criterio di successo:* Al click su una conclusione, il drawer premesse deve risolvere gli ID presenti in `source_ids` richiamando il dettaglio delle conclusioni correlate (`GET .../conclusions/{source_id}`). Non deve tentare di risolvere tali ID tramite gli endpoint dei messaggi. Se una conclusione sorgente è mancante, mostrare "Premessa non disponibile" senza crash dell'interfaccia.

---

### Suite 05: Isolamento Cache Workspace (Chiavi Query) & Prevenzione Race Conditions
**Obiettivo:** Garantire che la presenza del `workspace_id` nella chiave di stato isoli rigorosamente i dati e che il cambio di workspace abortisca le richieste in corso azzerando la UI.

- **TC-05.1 — Struttura Chiavi TanStack Query (Presenza `workspace_id`):**
  - Ogni query key deve includere tassativamente il `workspace_id` all'interno della gerarchia della chiave (es. `['workspaces', workspaceId, 'sessions', ...]`, `['workspaces', workspaceId, 'peers', ...]`, `['workspaces', workspaceId, 'conclusions', ...]`). La presenza esplicita dell'identificativo garantisce che l'invalidazione o il refetch non tocchino mai cache di altri workspace.
- **TC-05.2 — Cancellazione Richieste Pendenti su Switch:**
  - Quando l'utente seleziona un nuovo workspace dal dropdown:
    1. Invocazione di `queryClient.cancelQueries()`.
    2. Reset immediato degli stati selezionati (sessione attiva, peer attivo, chat corrente).
    3. Sostituzione delle viste con gli indicatori di caricamento del nuovo workspace.
  - *Criterio di successo:* Dati o elenchi del Workspace A non devono **mai** comparire nel Workspace B, nemmeno per un singolo fotogramma durante la latenza di rete.
- **TC-05.3 — Test di Race Condition (Cambio Rapido A -> B -> A):**
  - *Metodologia:* Con throttling di rete o latenza introdotta, selezionare rapidamente Workspace A, poi Workspace B, poi nuovamente Workspace A.
  - *Criterio di successo:* Eventuali risposte asincrone arrivate in ritardo per Workspace B non devono sovrascrivere o sporcare la vista corrente di Workspace A.

---

### Suite 06: Dialectic Reasoning Playground & Esclusività Scope/Session
**Obiettivo:** Validare il configuratore di prompt dialettico, l'esclusività reciproca dei parametri e il ciclo di vita dell'inferenza.

- **TC-06.1 — Esclusività Reciproca tra `scope`, `session_id` e `filters`:**
  - Contratto OpenAPI: `scope` è mutuamente esclusivo con `session_id` e `filters`. L'invio congiunto restituisce `422 Unprocessable Entity`.
  - *Verifica UI:*
    - Selezionando l'opzione "Sessione", l'input/selettore dello Scope deve essere disabilitato e sbiancato.
    - Selezionando l'opzione "Scope", il selettore della Sessione deve essere disabilitato e sbiancato.
  - *Verifica Payload:* Il JSON inviato al backend deve includere esclusivamente il parametro attivo; l'altro deve essere omesso o valorizzato esplicitamente a `null`.
- **TC-06.2 — Enum Livello di Ragionamento (`reasoning_level`):**
  - Opzioni permesse: `minimal`, `low`, `medium`, `high`, `max` (default: `low`).
  - L'UI deve offrire una selezione controllata (select/segmented control). L'invio di valori estranei all'enum deve essere impedito.
- **TC-06.3 — Distinzione Anchor Peer vs Target:**
  - `peer_id` nell'URL (`POST .../peers/{peer_id}/chat`) definisce l'ancora prospettica del modello.
  - Il campo opzionale `target` nel body definisce il peer di cui ricostruire la rappresentazione dalla prospettiva dell'ancora.
  - L'interfaccia deve guidare l'utente su questa distinzione concettuale.
- **TC-06.4 — Validazione Lunghezza Query:**
  - Query vuota: pulsante di invio disabilitato (vincolo schema `minLength: 1`).
  - Query tra 1 e 10.000 caratteri: accettata.
  - Query > 10.000 caratteri: bloccata con indicatore di sforamento (vincolo schema `maxLength: 10000`).

---

### Suite 07: SSE Streaming, Chunk UTF-8, CRLF, Abort & Divieto Blind Reconnect
**Obiettivo:** Collaudo intensivo del parser Server-Sent Events con corretta implementazione delle API standard Web Streams, gestione delimitatori e divieto di riesecuzioni incontrollate.

- **TC-07.1 — Frammentazione Caratteri UTF-8 Multi-Byte:**
  - *Corretta implementazione JavaScript:*
    ```typescript
    // Costruzione del decoder con opzione fatal: false
    const decoder = new TextDecoder('utf-8', { fatal: false });
    // Decodifica del chunk con opzione stream: true sul metodo decode()
    const textChunk = decoder.decode(chunk, { stream: true });
    ```
    *(Nota tecnica: `stream` è una proprietà dell'oggetto passato a `decode()`, non un parametro del costruttore `TextDecoder`).*
  - *Scenario di test:* Caratteri accentati italiani (es. `à`, `è`, `é`, `ì`, `ò`, `ù` - 2 byte) o emoji (es. `🧠` - 4 byte `0xF0 0x9F 0xA7 0xA0`) spezzati a cavallo di due frame TCP consecutivi.
  - *Criterio di successo:* Il buffer intermedio preserva i byte parziali. Nessun carattere di rimpiazzo corrotto (``) nel testo decodificato.
- **TC-07.2 — Frammentazione Linee ed Eventi SSE (Validazione Indipendente):**
  - *Avvertenza di collaudo:* La fixture del designer (`data: {"delta": ...}`) è considerata un'ipotesi empirica fino a verifica strumentale sul backend live. Il parser deve essere collaudato sia su frammenti simulati che su frame live reali emessi dal target.
  - *Scenario:* Un chunk termina a metà di una linea (`data: {"delta": {"conte`), il chunk successivo contiene il completamento (`nt": "sto"}}` seguito da `\n\n`).
  - *Criterio di successo:* Il parser accumula i caratteri in un buffer di linea ed esegue il parsing JSON solo in corrispondenza del delimitatore completo di evento.
- **TC-07.3 — Gestione Fine Linea CRLF (`\r\n`) vs LF (`\n`):**
  - Il parser deve accettare indifferentemente delimitatori di frame standard UNIX (`\n\n`) e delimitatori Windows/HTTP standard (`\r\n\r\n`).
- **TC-07.4 — Frame Multi-Linea, Commenti e Keep-Alive:**
  - Ignorare righe di commento (es. `: keep-alive\n\n`).
  - Gestire correttamente frame multipli `data:` consecutivi prima del doppio newline.
- **TC-07.5 — Interruzione Lato Client (`AbortController`):**
  - L'utente clicca sul pulsante "Interrompi generazione" durante lo streaming.
  - *Comportamento atteso:*
    1. Chiamata immediata di `abortController.abort()`.
    2. Chiusura del socket HTTP da parte del browser.
    3. Il gateway inoltra la cancellazione verso il backend Honcho upstream.
    4. L'interfaccia interrompe l'animazione di digitazione, preserva il testo parzialmente generato e visualizza lo stato "Generazione interrotta dall'utente".
- **TC-07.6 — Divieto Assoluto di Blind Reconnect / Replay su POST di Inferenza:**
  - *Regola architetturale:* La chiamata dialettica è una `POST` ad alta intensità computazionale che consuma risorse di inferenza LLM.
  - *Comportamento atteso:* Se la connessione SSE si interrompe bruscamente (caduta di rete, reset socket, timeout), il client **non deve assolutamente tentare una riconnessione automatica in loop o rieseguire la POST**.
  - *Criterio di successo:* L'interfaccia deve passare a uno stato di errore controllato ("Connessione interrotta") offrendo all'utente la scelta esplicita di consultare il testo parziale o richiedere manualmente un nuovo invio.
- **TC-07.7 — Fallback a Modalità Non-Streaming (Buffered):**
  - Toggle UI per disattivare lo streaming (`stream: false`).
  - L'invio restituisce la risposta JSON completa in un'unica soluzione, gestita con loader standard.

---

### Suite 08: Provenienza Evidenze & Lazy Loading Citazioni
**Obiettivo:** Verificare il corretto trattamento dell'oggetto `evidence` restituito al termine del flusso dialettico.

- **TC-08.1 — Struttura Oggetto Evidence:**
  - Al termine dello streaming (`data: {"done": true, "evidence": {...}}`):
    - `evidence.conclusions`: lista di conclusioni lette.
    - `evidence.messages`: lista di messaggi letti (`id`, `session_id`, `peer_id`, `created_at`).
    - `evidence.tool_calls`: chiamate a strumenti eseguite (es. `search_memory`, `grep_messages`).
    - `evidence.reasoning_trace_id`: identificativo traccia o null.
- **TC-08.2 — Semantica di Audit (Accessed vs Used):**
  - *Verifica concettuale:* L'UI deve chiarire nel cassetto delle evidenze che tali elementi rappresentano il materiale *consultato/esplorato* dall'agente durante il ragionamento, non garanzie di citazione pedissequa nel testo.
- **TC-08.3 — Recupero On-Demand dei Contenuti dei Messaggi:**
  - Per limitare il sovraccarico di rete, l'elenco delle evidenze deve mostrare inizialmente metadati compatti (`id`, autore, timestamp).
  - Al click dell'utente su un messaggio citato, il contenuto completo deve essere caricato on-demand tramite `GET .../messages/{message_id}` con spinner locale, senza pre-caricare tutti i corpi dei messaggi.

---

### Suite 09: Sanificazione Input & Prevenzione XSS (Cross-Site Scripting)
**Obiettivo:** Verificare l'assoluta immunità dell'interfaccia a vettori XSS iniettati tramite contenuti memorizzati o generati.

- **TC-09.1 — Trattamento dei Dati come Non Fidati:**
  - Tutti i contenuti provenienti dal backend (messaggi utente, conclusioni cognitive, output del peer dialettico, metadati) devono essere considerati non fidati.
- **TC-09.2 — Vettori di Iniezione Testati:**
  - Vettore Script classico: `<script>window.__qa_xss_injected=true;</script>`
  - Vettore Immagine con gestore d'errore: `<img src="invalid_img" onerror="window.__qa_xss_injected=true;" />`
  - Vettore SVG: `<svg onload="window.__qa_xss_injected=true;"></svg>`
  - Vettore Link Markdown malevolo: `[Clicca qui](javascript:window.__qa_xss_injected=true;)`
  - Vettore Iframe / Data URL: `<iframe src="data:text/html;base64,PHNjcmlwdD4..."></iframe>`
- **TC-09.3 — Criterio di Successo:**
  - Nel DOM, i tag pericolosi devono essere neutralizzati tramite render testuale nativo di React (escaping di default) oppure tramite sanificatore con configurazione restrittiva.
  - La variabile sentinella `window.__qa_xss_injected` deve rimanere `undefined` in qualsiasi visualizzazione.

---

### Suite 10: Gateway Node, Route Puntuali Allowlist, Traversal & Isolamento Segreti
**Obiettivo:** Audit di sicurezza sul server Node same-origin che serve la SPA e fa da proxy verso Honcho, verificando il rifiuto di wildcard generiche e la protezione dei percorsi annidati.

- **TC-10.1 — Route Allowlist Puntuale (Nessuna Wildcard Generica):**
  - *Principio di sicurezza:* È vietato l'uso di wildcard aperte (es. `/v3/workspaces*` o `*`). Il gateway deve implementare una mappa esatta di coppie `(Metodo HTTP, Pattern Percorso)`.
  - *Coppie Metodo / Route permesse nel proxy:*
    - `GET  /health`
    - `POST /v3/workspaces/list`
    - `POST /v3/workspaces`
    - `GET  /v3/workspaces/:workspace_id/queue/status`
    - `POST /v3/workspaces/:workspace_id/sessions/list`
    - `POST /v3/workspaces/:workspace_id/sessions`
    - `GET  /v3/workspaces/:workspace_id/sessions/:session_id/context`
    - `GET  /v3/workspaces/:workspace_id/sessions/:session_id/summaries`
    - `POST /v3/workspaces/:workspace_id/sessions/:session_id/messages/list`
    - `POST /v3/workspaces/:workspace_id/sessions/:session_id/messages`
    - `GET  /v3/workspaces/:workspace_id/sessions/:session_id/messages/:message_id`
    - `POST /v3/workspaces/:workspace_id/peers/list`
    - `POST /v3/workspaces/:workspace_id/peers`
    - `GET  /v3/workspaces/:workspace_id/peers/:peer_id/card`
    - `GET  /v3/workspaces/:workspace_id/peers/:peer_id/context`
    - `POST /v3/workspaces/:workspace_id/peers/:peer_id/representation`
    - `POST /v3/workspaces/:workspace_id/conclusions/list`
    - `POST /v3/workspaces/:workspace_id/conclusions/query`
    - `GET  /v3/workspaces/:workspace_id/conclusions/:conclusion_id`
    - `POST /v3/workspaces/:workspace_id/peers/:peer_id/chat`
    - `POST /v3/workspaces/:workspace_id/chat`
  - *Rotte e Metodi non ammessi (Blocco Rigido 403/404):*
    - Amministrazione chiavi: `POST /v3/keys` -> `403 Forbidden` / `404 Not Found`.
    - Eliminazione workspace/sessioni: `DELETE /v3/workspaces/:id` o `DELETE /v3/workspaces/:wid/sessions/:sid` -> `405 Method Not Allowed` o `404 Not Found`.
    - Operazioni non autorizzate: `POST .../schedule_dream`, `.../webhooks*`, `.../clone` -> bloccate.
    - Chiamate arbitrarie o proxy aperti: `/proxy?url=http://...` -> bloccate immediatamente.
- **TC-10.2 — Protezione da Directory Traversal:**
  - Tentativi di manipolazione del path:
    - `GET /api/../../../etc/passwd`
    - `GET /api/%2e%2e/%2e%2e/`
    - Richieste con null-byte (`%00`) o percorsi non normalizzati.
  - *Criterio di successo:* Rifiuto con HTTP 400/403/404 da parte del gateway; nessun inoltro al filesystem host o al backend.
- **TC-10.3 — Isolamento Totale del Segreto (`HONCHO_API_KEY`):**
  - La chiave API risiede solo nelle variabili d'ambiente del processo Node gateway (`process.env.HONCHO_API_KEY`).
  - *Verifiche:*
    1. Nessuna occorrenza di stringhe segrete nel bundle compilato in `dist/` o nei file serviti al browser (nessuna variabile `VITE_HONCHO_API_KEY`).
    2. Nessuna emissione del token nei log del gateway.
    3. Il browser non invia header `Authorization` contenenti il token; è il gateway a iniettarlo nella chiamata upstream verso `192.168.4.91:8000`.
- **TC-10.4 — Politiche di Rete & CORS:**
  - Il gateway deve essere configurato di default per il bind su interfaccia di loopback (`127.0.0.1:3000`).
  - Nessuna intestazione `Access-Control-Allow-Origin: *` abbinata a `Access-Control-Allow-Credentials: true`.
- **TC-10.5 — Gateway SSE Proxying:**
  - Il gateway inoltra lo stream SSE senza buffering intermedio:
    - Header di risposta: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
    - Flush immediato dei chunk di dati verso il browser.
    - Se il browser chiude la connessione, il gateway intercetta l'evento `close` e abortisce la richiesta upstream.

---

### Suite 11: Resilienza Backend, Errori HTTP & Degradazione
**Obiettivo:** Verificare come l'interfaccia reagisce a guasti del backend Honcho o della rete locale.

- **TC-11.1 — Backend Irraggiungibile (Honcho Offline / 502 Bad Gateway):**
  - Simulazione: arresto del target o puntamento gateway a porta chiusa.
  - *Comportamento atteso:* L'interfaccia mostra un banner chiaro di indisponibilità del servizio Honcho con pulsante "Riprova connessione", senza schermate bianche (White Screen of Death) né loop infiniti di caricamento.
- **TC-11.2 — Gestione Errori 422 di Validazione FastAPI:**
  - Quando il backend risponde con `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`, l'UI deve mostrare all'utente messaggi di errore pertinenti e contestualizzati al campo errato.
- **TC-11.3 — Gestione Risorse Inesistenti (404 Not Found):**
  - Apertura di sessione, conclusione o peer inesistente: visualizzazione dello stato di "Elemento non trovato" con opzione di ritorno all'elenco.
- **TC-11.4 — Loading Shimmer Skeletons:**
  - Durante il fetch dei dati (workspaces, card, messaggi, conclusioni), renderizzare placeholder animati a scheletro (classe `shimmer`), preservando la stabilità del layout senza scatti visivi (Cumulative Layout Shift).

---

### Suite 12: Layout Responsive, Navigazione Tastiera & Focus
**Obiettivo:** Validare la fruibilità su display desktop e mobile e il supporto per la navigazione via tastiera.

- **TC-12.1 — Matrice Risoluzioni e Layout:**
  - *Mobile (375x667, 390x844):* Sidebar desktop nascosta; navigazione affidata al drawer superiore con pulsante hamburger e/o barra di navigazione fissa a fondo schermo (bottom tabs). I modali devono rientrare nella viewport senza scrolling orizzontale.
  - *Desktop (1280x800, 1920x1080):* Sidebar fissa ad alta densità con navigazione fluida.
- **TC-12.2 — Navigazione via Tastiera & Ordine del Tab:**
  - L'utente deve poter navigare attraverso tutti gli elementi interattivi (tab, bottoni, campi form, righe espandibili) premendo il tasto `Tab` e `Shift+Tab` in sequenza logica.
  - Modali e Cassetti: quando aperti, il focus deve essere intrappolato all'interno del dialogo (focus trap); la pressione del tasto `Esc` deve chiudere immediatamente il modale ripristinando il focus sull'elemento attivatore.
  - Composer messaggi: `Enter` o `Ctrl+Enter` per l'invio rapido; `Shift+Enter` per l'inserimento di una nuova riga.
- **TC-12.3 — Visibilità degli Indicatori di Focus (`focus-visible`):**
  - Tutti i pulsanti, link e controlli di input devono presentare un anello visibile di focus (`focus-visible:ring-2 focus-visible:ring-indigo-500`) con contrasto adeguato rispetto allo sfondo dark.

---

### Suite 13: Verifica Accessibilità & Delimitazione Audit WCAG
**Obiettivo:** Misurare i parametri quantitativi di accessibilità e stabilire la demarcazione rispetto a una certificazione formale.

- **TC-13.1 — Rilevazione Contrasti Colore:**
  - Misurazione strumentale dei rapporti di contrasto in spazio colore sRGB:
    - Testo primario `#f8fafc` su Canvas `#090d16` (atteso $\ge 14:1$, supera soglia AAA 7.0:1).
    - Testo secondario `#94a3b8` su Surface `#0f172a` (atteso $\ge 6.5:1$, supera soglia AA 4.5:1).
    - Badge semantici (Smeraldo, Indaco, Ambra, Rosa) su superfici dark (atteso $\ge 6.5:1$, conformi AA/AAA).
- **TC-13.2 — Delimitazione Normativa WCAG:**
  - **Dichiarazione Vincolante:** *L'applicazione implementa best practice di accessibilità e contratti cromatici ad alto contrasto. Tuttavia, ai sensi dei requisiti di progetto, NON è rilasciata alcuna certificazione di conformità WCAG (AA/AAA) in assenza di un audit completo, formale e indipendente condotto con ausili di lettura dello schermo e utenti con disabilità.*

---

## 4. Classificazione dei Difetti e Matrice di Severità

Eventuali anomalie riscontrate durante l'esecuzione dei test saranno classificate secondo la seguente scala:

| Livello Severità | Descrizione & Impatto | SLA Risoluzione / Azione |
|---|---|---|
| **Blocker (P0)** | Blocco totale del flusso operativo: crash applicativo, perdita o corruzione dati, mancato isolamento tra workspace, leak di credenziali/segreti, esecuzione remota XSS, crash gateway. | Fix immediato richiesto da `@developer`. Rilascio HCS-08 categoricamente bloccato. |
| **Critical (P1)** | Difetto funzionale primario: mancata ricezione stream SSE, rottura schema batch messaggi (422), invio congiunto errato di scope/session, blocco invio messaggi. | Risoluzione prioritaria obbligatoria prima dell'approvazione del signoff. |
| **Major (P2)** | Disallineamento contrattuale secondario: gestione incompleta di `peer_card === null`, parametri paginazione non sincronizzati, mancata chiusura modali con tasto Esc, imperfezioni di reset cache. | Richiede correzione o workaround documentato e approvato dal Tech Lead. |
| **Minor / Cosmetic (P3)** | Difetti visivi, rifiniture di stile, micro-scostamenti rispetto al design system, testi di aiuto migliorabili. | Correzione pianificabile in ciclo successivo non bloccante. |

---

## 5. Procedura di Collaudo Operativo per HCS-08

Una volta completate le attività da parte di `@developer` e ricevuto l'handoff formale, `@qa-reviewer` eseguirà le seguenti fasi di test. Tutti i log e le evidenze di esecuzione saranno archiviati nel file separato `docs/QA_AUDIT_EXECUTION.md`:

### Fase 1: Verifica Toolchain & Integrità Build
```bash
cd /opt/data/projects/honcho-dashboard

# 1. Verifica dipendenze e assenza vulnerabilità note
npm audit --audit-level=high

# 2. Verifica rigidità Typecheck (nessun errore TypeScript ammesso)
npm run typecheck

# 3. Compilazione di produzione
npm run build

# 4. Verifica asset generati (assenza di riferimenti a HONCHO_API_KEY o CDN esterni)
grep -rn "HONCHO_API_KEY" dist/ || true
grep -rn "cdn.tailwindcss.com" dist/ || true
```

### Fase 2: Esecuzione Suite Automatizzate
```bash
# 1. Test unitari e di integrazione frontend
npm test

# 2. Test del gateway e dell'allowlist puntuale delle route
npm run test:gateway
```

### Fase 3: Smoke Test Live su Gateway Locale & Workspace Dedicato (Synthetic Peer)
```bash
# 1. Avvio gateway in ambiente di collaudo (bind su loopback)
PORT=3000 NODE_ENV=production node server/index.mjs &
GATEWAY_PID=$!

# 2. Verifica endpoint salute
curl -s -f http://127.0.0.1:3000/health | grep '"status":"ok"'

# 3. Creazione sicura del workspace dedicato per i test QA (NO alex, NO test-hermes-workspace)
curl -s -X POST http://127.0.0.1:3000/api/v3/workspaces \
  -H "Content-Type: application/json" \
  -d '{"id": "honcho-qa-sandbox", "metadata": {"purpose": "independent-qa-verification"}}'

# 4. Creazione del peer sintetico di test all'interno della sandbox
curl -s -X POST http://127.0.0.1:3000/api/v3/workspaces/honcho-qa-sandbox/peers \
  -H "Content-Type: application/json" \
  -d '{"id": "qa-peer", "metadata": {"role": "qa-synthetic-subject"}}'

# 5. Verifica paginazione query params su workspace dedicato
curl -s -X POST "http://127.0.0.1:3000/api/v3/workspaces/list?page=1&size=10&reverse=false" \
  -H "Content-Type: application/json" \
  -d '{}'

# 6. Arresto gateway a fine test
kill $GATEWAY_PID
```

---

## 6. Registro dei Rischi Tecnici & Mitigazioni Identificate

| ID Rischio | Descrizione Rischio | Probabilità | Impatto | Strategia di Mitigazione QA |
|---|---|---|---|---|
| **RSK-01** | **Riconnessione automatica cieca su stream dialettico fallito**  <br>Se il client tenta il reconnect automatico in caso di errore SSE, riesegue la POST di inferenza consumando token e duplicando le tracce. | Alta | Alto | Test rigoroso di caduta connessione: verificare che il client blocchi il retry automatico e mostri solo un'opzione di retry manuale/esplicito o modalità bufferizzata. |
| **RSK-02** | **Frammentazione UTF-8 e corruzione testo streaming**  <br>Caratteri speciali italiani spezzati tra pacchetti TCP possono generare glifi corrotti (``). | Media | Medio | Collaudo con payload contenenti caratteri accentati ed emoji; verifica obbligatoria di `TextDecoder('utf-8', {fatal: false})` con decode streaming `decoder.decode(chunk, {stream: true})`. |
| **RSK-03** | **Duplicazione messaggi su timeout mutazioni non idempotenti**  <br>In caso di timeout o caduta di rete su `POST /messages`, il client ri-invia il batch causando doppioni poiché il server genera nuovi ID ad ogni chiamata. | Alta | Alto | L'UI non deve assumere idempotenza: mostrare messaggio di esito incerto e suggerire di ricaricare/verificare prima del reinvio. |
| **RSK-04** | **Leak visivo o race condition tra workspace**  <br>Dati di una sessione del Workspace A visualizzati nel Workspace B a causa di cache non invalidata o richieste asincrone ritardate. | Media | Alto | Test di cambio rapido con throttling di rete; verifica che tutte le chiavi TanStack Query includano `workspace_id` e siano cancellate su switch. |
| **RSK-05** | **Inquinamento accidentale o scrittura nei dati di Alex**  <br>Esecuzione di scritture o dreaming nel workspace reale `test-hermes-workspace` o sul peer `alex`. | Bassa | Critico | Regola di collaudo bloccante: test di mutazione consentiti esclusivamente nel workspace isolato `honcho-qa-sandbox` con peer sintetico `qa-peer`. Nessun dreaming job avviato. |
| **RSK-06** | **Crash lato client su `peer_card === null` o visualizzazione di confidenza inesistente**  <br>Accadimento frequente su peer privi di dreaming, o tentativo di mostrare percentuali di confidenza non fornite da `PeerCardResponse`. | Alta | Medio | Test mirato con mocking/intercettazione per confermare il rendering elegante dello stato vuoto cognitivo e l'uso di pure stringhe testuali. |
| **RSK-07** | **Risoluzione errata di `source_ids` come messaggi invece che conclusioni**  <br>Tentativo di fetch verso `/messages/{id}` per risolvere le premesse di una conclusione derivata. | Media | Medio | Verifica che il drawer delle premesse interroghi esclusivamente `/conclusions/{id}` e gestisca l'array vuoto per il livello `explicit`. |
| **RSK-08** | **Violazione mutua esclusività Scope vs Session**  <br>Invio contemporaneo di `scope` e `session_id`/`filters` con conseguente errore 422 non gestito. | Media | Medio | Test automatizzato dell'interfaccia: disabilitazione e azzeramento automatico del campo alternativo nel form e nel payload. |
| **RSK-09** | **Permissività eccessiva del Gateway con wildcard non controllate**  <br>Esposizione di metodi distruttivi o route amministrative per l'uso di path generici (`/v3/workspaces*`). | Bassa | Alto | Verifica che il gateway implementi un'allowlist puntuale di coppie metodo/percorso senza wildcard aperte. |
| **RSK-10** | **Auto-certificazione impropria di conformità WCAG**  <br>Confusione tra conformità dei contrasti e certificazione WCAG formale. | Alta | Basso | Delimitazione esplicita nella documentazione e nel report QA. |

---

## 7. Criteri di Accettazione e Gate di Signoff (HCS-08)

Lo sblocco e l'approvazione formale del ticket **HCS-08** richiedono il soddisfacimento congiunto di tutti i seguenti criteri:

1. **Handoff Completo:** Notifica formale di completamento da parte di `@developer` con commit/branch, elenco test eseguiti e stato ticket HCS-01..07 in `docs/KANBAN.md`.
2. **Build & Typecheck Passati:** `npm run typecheck` e `npm run build` completati con codice di uscita 0 e zero avvisi critici.
3. **Nessun Difetto P0 o P1 Aperto:** Tutte le anomalie Blocker o Critical identificate durante il collaudo devono essere risolte e ri-verificate.
4. **Verifica Contratti API 100%:** Rispetto rigoroso di tutti i contratti dello snapshot `docs/openapi-3.2.2.json` (paginazione in query string, batch creation, gestione null card, mutual exclusivity scope/session, risoluzione premesse tra conclusioni).
5. **Verifica Sicurezza Superata:** Zero leak di segreti nei bundle statici, percorso allowlist puntuale del gateway impenetrabile, zero vulnerabilità XSS.
6. **Verbalizzazione Separata dell'Audit Esecutivo:** Redazione del documento separato `docs/QA_AUDIT_EXECUTION.md` con evidenze di esecuzione, log reali e percorsi degli artefatti verificati.

**Decisione Attuale Gate HCS-08:**  
🔴 **SIGNOFF BLOCCATO (PENDING DEVELOPER HANDOFF)**  
*Nessun rilascio o approvazione autorizzata fino al collaudo su codice reale.*
