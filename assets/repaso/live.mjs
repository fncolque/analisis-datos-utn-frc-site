import { element, renderQuestion, renderExplanation } from './core.mjs';
import { renderCharacter, characterName } from './characters.mjs';

const $ = id => document.getElementById(id);
const storageKey = code => `repaso-live:${code}`;

export async function startLive(mode) {
  const abort = new AbortController();
  const listen = (node, event, fn) => node.addEventListener(event, fn, { signal: abort.signal });
  const role = mode === 'docente' ? 'host' : mode === 'proyeccion' ? 'projection' : 'player';
  const query = new URLSearchParams(location.search);
  let code = (query.get('sala') || '').toUpperCase(), credential = '', secret = '';
  let state, socket, heartbeat, reconnect, timer, answerRetry, stopped = false, connected = false;
  let busy = false, pendingAnswer = null, pendingCommand = null, createId = crypto.randomUUID();
  let questionView = '', rosterView = '', participantsView = '', rankingView = '', summaryView = '', offset = 0, retry = 0;
  const status = text => { $('live-status').textContent = text; $('live-status').hidden = !text; };
  $('join-form').hidden = role !== 'player';
  $('host-form').hidden = true;
  $('live-room').hidden = true;
  $('room-code').value = code;
  $('host-room-code').value = code;
  $('host-secret').value = '';
  $('live-role-label').textContent = role === 'host' ? 'CONDUCCIÓN DOCENTE' : role === 'projection' ? 'PROYECCIÓN' : 'REPASO EN VIVO';
  status('Conectando con el servicio…');

  const stop = () => {
    stopped = true; abort.abort(); clearTimeout(reconnect); clearTimeout(answerRetry); clearInterval(heartbeat); clearInterval(timer);
    socket?.close(); secret = ''; credential = ''; $('host-secret').value = ''; document.body.classList.remove('in-room');
  };
  let api;
  try {
    const response = await fetch('../data/repaso-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo consultar la configuración. Recargá para intentar nuevamente.');
    api = (await response.json()).liveApiUrl;
    if (!api) throw new Error('El juego en vivo todavía no está habilitado. Podés utilizar la autoevaluación.');
    api = api.replace(/\/$/, '');
    if (role === 'host') {
      const catalog = await fetch('../data/repaso.json', { cache: 'no-store', signal: abort.signal });
      if (!catalog.ok) throw new Error('No se pudo cargar el catálogo de cuestionarios. Recargá para intentar nuevamente.');
      const presets = (await catalog.json()).presets;
      $('host-preset').replaceChildren(...presets.map(p => {
        const option = element('option', `${p.title} · Versión ${p.version} · ${p.questionCount} preguntas`);
        option.value = p.id; return option;
      }));
      $('host-form').hidden = false;
    }
  } catch (error) {
    status(error.message); $('join-form').hidden = true; $('host-form').hidden = true; return stop;
  }
  status(role === 'host' ? 'La clave docente se conserva solo mientras esta página permanece abierta.' : '');

  async function request(path, body, token = role === 'host' ? secret : credential) {
    const response = await fetch(api + path, { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.any([abort.signal, AbortSignal.timeout(12000)]) });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || 'No se pudo completar la operación. Volvé a intentar.');
      error.status = response.status; throw error;
    }
    return response;
  }

  function remember() {
    if (role !== 'player' || !credential || !state) return;
    try { localStorage.setItem(storageKey(code), JSON.stringify({ credential, expiresAt: state.expiresAt })); }
    catch { status('El navegador no permite guardar el acceso. Mantené esta página abierta; si la cerrás, el docente podrá habilitar tu recuperación.'); }
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(code)) || 'null');
      if (saved?.expiresAt > Date.now()) credential = saved.credential;
      else localStorage.removeItem(storageKey(code));
    } catch { /* Storage can be disabled; joining still works in memory. */ }
  }
  function forget() { try { localStorage.removeItem(storageKey(code)); } catch {} credential = ''; }
  function link(projection = false) {
    const url = new URL(location.href); url.search = ''; url.hash = '';
    url.searchParams.set('sala', code);
    if (projection) url.searchParams.set('modo', 'proyeccion');
    return url.href;
  }

  function render() {
    if (!state || stopped) return;
    document.body.classList.add('in-room');
    $('live-room').hidden = false; $('join-form').hidden = true; $('host-form').hidden = true;
    $('live-code').textContent = code;
    $('live-participants').textContent = `${state.participantCount} / ${state.capacity} participantes`;
    $('connection-state').textContent = connected ? 'Conectado' : 'Reconectando…';
    $('live-title').textContent = state.title;
    const questionnaire = state.questionnaire;
    $('live-questionnaire').textContent = questionnaire.version == null
      ? `Revisión del banco ${questionnaire.bankVersion} · ${state.total} preguntas`
      : `${questionnaire.id} · Versión ${questionnaire.version} · ${state.total} preguntas`;
    $('host-controls').hidden = role !== 'host';
    $('host-participants').hidden = role !== 'host';
    $('host-finish').hidden = state.phase === 'finished';
    $('host-finish').disabled = busy || !connected;
    $('project-room').href = link(true);
    if (state.me && !$('my-character').hasChildNodes()) $('my-character').append(renderCharacter(state.me.character));
    $('live-lobby').hidden = state.phase !== 'lobby';
    $('live-play').hidden = !state.question || state.phase === 'finished';
    const newRoster = JSON.stringify(state.roster || []);
    if (newRoster !== rosterView) {
      rosterView = newRoster;
      $('character-roster').replaceChildren(...(state.roster || []).map(p => renderCharacter(p.character)));
    }
    const advance = $('host-advance');
    advance.hidden = state.phase === 'finished';
    advance.textContent = state.phase === 'reading' ? 'Mostrar opciones · 15 s →' : state.phase === 'lobby' ? 'Presentar pregunta →' : state.index === state.total - 1 ? 'Mostrar podio →' : 'Siguiente enunciado →';
    advance.disabled = busy || !connected || state.phase === 'answering' || !state.participantCount;
    if (state.question) {
      const q = state.question, answer = state.me?.answer;
      const selected = answer?.optionId || (pendingAnswer?.questionId === q.id ? pendingAnswer.optionId : null);
      const disabled = role !== 'player' || state.phase !== 'answering' || !!selected || !connected;
      const nextView = JSON.stringify([q.id, state.phase, selected, disabled]);
      if (nextView !== questionView) {
        const changedQuestion = !questionView || JSON.parse(questionView)[0] !== q.id;
        questionView = nextView;
        const title = renderQuestion($('live-question'), q, { selected, disabled, correctOptionId: q.correctOptionId, onAnswer: submitAnswer });
        if (changedQuestion) title.focus();
      }
      $('live-progress').textContent = `Pregunta ${state.index + 1} de ${state.total}`;
      $('live-phase').textContent = state.phase === 'reading' ? 'Leé el enunciado · sin reloj' : state.phase === 'answering' ? `${state.answeredCount} de ${state.participantCount} respuestas recibidas` : state.closeReason === 'all_answered' ? 'Todos respondieron' : 'Tiempo agotado';
      $('answer-status').textContent = role !== 'player' ? '' : answer ? (state.phase === 'feedback' ? `${answer.correct ? 'Acierto' : 'Respuesta incorrecta'} · ${answer.points} puntos` : 'Respuesta recibida y guardada.') : pendingAnswer?.questionId === q.id ? 'Verificando la recepción de tu respuesta…' : state.phase === 'feedback' ? 'No quedó registrada una respuesta para esta pregunta.' : '';
      $('live-feedback').hidden = !q.explanation;
      if (q.explanation) renderExplanation($('live-feedback'), q, answer?.correct);
      $('answer-distribution').replaceChildren(...(state.distribution ? q.options.map(o => {
        const row = element('p', null, 'distribution-row');
        row.append(element('span', o.text), element('b', `${state.distribution[o.id]} respuestas`)); return row;
      }) : []));
    }
    $('live-ranking').hidden = !state.ranking;
    $('ranking-title').textContent = state.phase === 'finished' ? 'El podio del grupo.' : 'Así va el grupo.';
    $('export-controls').hidden = role !== 'host' || state.phase !== 'finished';
    const nextRanking = JSON.stringify(state.ranking || []);
    if (nextRanking !== rankingView) {
      rankingView = nextRanking;
      $('ranking-list').replaceChildren(...(state.ranking || []).filter(row => row.position <= 3).map(row => {
        const item = element('li'); item.value = row.position;
        item.append(element('b', `${row.position}.`), renderCharacter(row.character), element('span', `${row.score.toLocaleString('es-AR')} puntos · ${row.correct} aciertos`)); return item;
      }));
    }
    $('session-summary').hidden = state.phase !== 'finished';
    const nextSummary = JSON.stringify(state.summary || []);
    if (nextSummary !== summaryView) {
      summaryView = nextSummary;
      renderSummary(state.summary || []);
    }
    const nextParticipants = JSON.stringify([state.participants, state.phase === 'finished', busy, connected]);
    if (role === 'host' && nextParticipants !== participantsView) {
      participantsView = nextParticipants;
      $('host-participant-list').replaceChildren(...state.participants.map(p => {
        const row = element('div', null, 'host-participant');
        row.append(element('span', `${p.legajo} · ${characterName(p.character)}`));
        const button = element('button', p.recoverable ? 'Reingreso habilitado' : 'Habilitar recuperación', 'text-button');
        button.type = 'button'; button.disabled = p.recoverable || busy || !connected || state.phase === 'finished';
        button.addEventListener('click', () => {
          if (confirm(`¿Identificaste al estudiante con legajo ${p.legajo}? Se invalidará su acceso anterior.`)) command('recover', p.id);
        }); row.append(button); return row;
      }));
    }
    tick();
  }

  function renderSummary(questions) {
    const percent = value => `${(value * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
    const distributionRow = (label, count, proportion, correct = false) => {
      const row = element('div', null, `summary-option${correct ? ' correct-option' : ''}`);
      row.append(element('span', label), element('b', `${count} · ${percent(proportion)}`));
      const bar = element('meter'); bar.min = 0; bar.max = 1; bar.value = proportion;
      bar.setAttribute('aria-label', `${label}: ${count} respuestas, ${percent(proportion)} del grupo`);
      row.append(bar); return row;
    };
    $('session-question-list').replaceChildren(...questions.map(q => {
      const details = element('details', null, 'summary-question');
      const heading = element('summary');
      heading.append(element('span', `Pregunta ${q.order}`, 'overline'), element('span', q.prompt, 'summary-prompt'),
        element('span', `${q.incorrect} incorrectas · ${q.correct} aciertos · ${q.unanswered} sin respuesta`, 'summary-counts'));
      const body = element('div', null, 'summary-body');
      body.append(element('p', `Tasa de acierto: ${q.successRate == null ? 'Sin respuestas' : percent(q.successRate)} · Participación: ${percent(q.participationRate)}`, 'summary-rates'),
        element('p', `Porcentajes de opciones sobre ${q.total} participantes. La tasa de acierto considera las ${q.answered} respuestas recibidas.`, 'summary-caption'));
      for (const [index, option] of q.distribution.entries()) {
        const correct = option.id === q.correctOptionId;
        body.append(distributionRow(`${'ABCD'[index]}. ${option.text}${correct ? ' · Correcta' : ''}`, option.count, option.proportion, correct));
      }
      body.append(distributionRow('Sin respuesta', q.unanswered, q.total ? q.unanswered / q.total : 0));
      const explanation = element('div', null, 'feedback-panel');
      renderExplanation(explanation, q); body.append(explanation);
      details.append(heading, body); return details;
    }));
    $('summary-empty').hidden = questions.length > 0;
  }
  function tick() {
    const seconds = state?.phase === 'answering' ? Math.max(0, Math.ceil((state.closesAt - Date.now() - offset) / 1000)) : null;
    $('live-timer').textContent = seconds == null ? '' : `${seconds} s`;
    if (seconds === 0) for (const button of $('live-question').querySelectorAll('button')) button.disabled = true;
  }
  function receive(next) {
    if (stopped || (state && next.revision < state.revision)) return;
    state = next; offset = next.serverNow - Date.now();
    if (state.me?.answer || (pendingAnswer && state.question?.id !== pendingAnswer.questionId)) pendingAnswer = null;
    remember(); render();
  }
  async function sync() { receive(await (await request(`/rooms/${code}/state`)).json()); }
  function connect() {
    if (stopped) return;
    clearInterval(heartbeat);
    const url = new URL(api + `/rooms/${code}/socket`); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(url);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', role, ...(role === 'host' ? { secret } : role === 'player' ? { credential } : {}) }));
      heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send('ping'); }, 20000);
    };
    socket.onmessage = event => {
      if (event.data === 'pong') return;
      try { const next = JSON.parse(event.data); connected = true; retry = 0; receive(next); }
      catch { return; }
      if (pendingAnswer && !busy) sendPendingAnswer();
    };
    socket.onclose = event => {
      connected = false; clearInterval(heartbeat); render();
      if (stopped) return;
      if (event.code === 4001) {
        forget(); status('El acceso fue renovado. Ingresá tu legajo nuevamente o consultá al docente.');
        $('join-form').hidden = role !== 'player'; $('host-form').hidden = role !== 'host'; return;
      }
      reconnect = setTimeout(async () => {
        try { await sync(); connect(); }
        catch (error) {
          if ([401, 404, 410].includes(error.status)) { status(error.message); return; }
          connect();
        }
      }, Math.min(5000, 500 * 2 ** retry++));
    };
  }
  async function enter() {
    state = null; questionView = ''; $('my-character').replaceChildren();
    await sync(); status(''); connect();
  }
  function submitAnswer(optionId) {
    if (!connected || busy || pendingAnswer || state.me?.answer || state.phase !== 'answering') return;
    pendingAnswer = { questionId: state.question.id, optionId }; render(); sendPendingAnswer();
  }
  async function sendPendingAnswer() {
    if (!pendingAnswer || busy) return;
    busy = true; const submitted = pendingAnswer;
    try { receive(await (await request(`/rooms/${code}/answers`, submitted)).json()); status(''); }
    catch (error) {
      try { await sync(); } catch {}
      if (pendingAnswer && error.status >= 400 && error.status < 500) { pendingAnswer = null; status(error.message); }
      else if (pendingAnswer) status('La confirmación se interrumpió. Estamos comprobando si tu respuesta quedó guardada.');
    } finally {
      busy = false; render();
      if (pendingAnswer && !stopped) answerRetry = setTimeout(sendPendingAnswer, 1500);
    }
  }
  async function command(action, playerId) {
    if (busy) return;
    busy = true;
    if (!pendingCommand || pendingCommand.action !== action || pendingCommand.playerId !== playerId) pendingCommand = { action, playerId, requestId: crypto.randomUUID(), expectedStep: state.step };
    render();
    try { receive(await (await request(`/rooms/${code}/commands`, pendingCommand)).json()); pendingCommand = null; status(''); }
    catch (error) { status(error.message); if (error.status) pendingCommand = null; try { await sync(); } catch {} }
    finally { busy = false; render(); }
  }
  listen($('host-advance'), 'click', () => command(state.phase === 'reading' ? 'open' : state.index === state.total - 1 ? 'finish' : 'present'));
  listen($('host-finish'), 'click', () => { if (confirm('¿Finalizar la partida y conservar los resultados obtenidos?')) command('finish'); });
  listen($('copy-room'), 'click', async () => {
    try { await navigator.clipboard.writeText(link()); status('Enlace de ingreso copiado.'); }
    catch { status(`Enlace de ingreso: ${link()}`); }
  });
  for (const button of document.querySelectorAll('[data-export]')) listen(button, 'click', async () => {
    button.disabled = true;
    try {
      const endpoint = button.dataset.export === 'answers' ? 'answers.csv' : `results.csv?scope=${button.dataset.export}`;
      const response = await request(`/rooms/${code}/${endpoint}`);
      const url = URL.createObjectURL(await response.blob()); const a = element('a');
      a.href = url; a.download = `repaso-${code}-${button.dataset.export}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { status(error.message); } finally { button.disabled = false; }
  });
  listen($('join-form'), 'submit', async event => {
    event.preventDefault(); if (busy) return; busy = true;
    code = $('room-code').value.trim().toUpperCase(); credential = ''; restore();
    try {
      if (!/^[A-F0-9]{8}$/.test(code)) throw new Error('Revisá el código: debe tener ocho caracteres.');
      if (!credential) {
        const registration = await (await request(`/rooms/${code}/join`, { legajo: $('student-id').value.trim() }, '')).json();
        credential = registration.credential;
      }
      await enter();
    } catch (error) { if (error.status === 401) forget(); status(error.message); }
    finally { busy = false; }
  });
  listen($('host-form'), 'submit', async event => {
    event.preventDefault(); if (busy) return; busy = true;
    secret = $('host-secret').value; code = $('host-room-code').value.trim().toUpperCase();
    try {
      if (!code) {
        const room = await (await request('/rooms', { requestId: createId, presetId: $('host-preset').value })).json();
        code = room.code; $('host-room-code').value = code;
      }
      await enter(); $('host-secret').value = '';
    } catch (error) { status(error.message); }
    finally { busy = false; render(); }
  });
  listen($('host-preset'), 'change', () => { createId = crypto.randomUUID(); });
  listen($('host-room-code'), 'input', () => { $('host-preset').disabled = !!$('host-room-code').value.trim(); });
  $('host-preset').disabled = !!code;
  timer = setInterval(tick, 200);
  if (code && role !== 'host') {
    if (role === 'player') restore();
    if (role === 'projection' || credential) {
      try { await enter(); } catch (error) { if (error.status === 401) forget(); status(error.message); }
    }
  }
  return stop;
}
