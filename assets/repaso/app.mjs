import { createQuiz, matchingQuestions, answerQuestion, renderQuestion, renderExplanation, difficultyLabels, element } from './core.mjs';

const $ = id => document.getElementById(id);
let bank, quiz = [], answers = new Map(), current = 0, stopLive;
let modeRevision = 0;
const status = (message, error = false) => {
  $('app-status').textContent = message;
  $('app-status').hidden = !message;
  $('app-status').classList.toggle('error', error);
};
const selected = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);

async function loadBank() {
  if (bank) return bank;
  const response = await fetch('../data/repaso.json');
  if (!response.ok) throw new Error('No pudimos cargar las preguntas. Volvé a intentarlo.');
  bank = await response.json();
  if (bank.schemaVersion !== 1 || !Array.isArray(bank.questions)) throw new Error('El banco de preguntas no está disponible.');
  $('unit-options').replaceChildren(...bank.units.map(unit => {
    const label = element('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'unit'; input.value = unit.id; input.checked = true;
    label.append(input, element('span', unit.label));
    return label;
  }));
  return bank;
}

function updateCount() {
  if (!bank) return;
  const available = matchingQuestions(bank, selected('unit'), selected('difficulty')).length;
  const count = Number($('question-count').value);
  $('question-count').max = String(available);
  const valid = Number.isInteger(count) && count > 0 && count <= available;
  $('available-count').textContent = available ? `${available} preguntas disponibles.${valid ? '' : ' Ajustá la cantidad para empezar.'}` : 'Elegí al menos una unidad y una dificultad con preguntas disponibles.';
  $('start-self').disabled = !valid;
}

function showSelfQuestion() {
  const question = quiz[current];
  $('self-progress').textContent = `Pregunta ${current + 1} de ${quiz.length}`;
  $('self-progress-bar').max = quiz.length;
  $('self-progress-bar').value = current;
  $('self-difficulty').textContent = difficultyLabels[question.difficulty];
  $('self-topic').textContent = question.topic;
  $('self-feedback').hidden = true;
  $('next-self').hidden = true;
  const onAnswer = optionId => {
    const answer = answerQuestion(answers, question, optionId);
    renderQuestion($('self-question'), question, { selected: answer.optionId, correctOptionId: question.correctOptionId, disabled: true });
    renderExplanation($('self-feedback'), question, answer.correct);
    $('self-progress-bar').value = current + 1;
    $('next-self').textContent = current === quiz.length - 1 ? 'Ver mi resultado →' : 'Siguiente pregunta →';
    $('next-self').hidden = false;
    $('next-self').focus({ preventScroll: true });
  };
  renderQuestion($('self-question'), question, { onAnswer }).focus();
}

function finishSelf() {
  $('self-play').hidden = true;
  $('self-results').hidden = false;
  const correct = [...answers.values()].filter(a => a.correct).length;
  $('self-result-title').textContent = `${correct} de ${quiz.length} aciertos.`;
  $('self-result-detail').textContent = `${Math.round(correct / quiz.length * 100)} % · ${answers.size} respondidas. Abrí una pregunta para revisar su explicación.`;
  $('self-review').replaceChildren(...quiz.map((question, index) => {
    const answer = answers.get(question.id);
    const details = element('details');
    details.append(element('summary', `${index + 1}. ${answer ? answer.correct ? '✓ Correcta' : '↺ Para revisar' : 'Sin responder'} · ${question.prompt}`));
    const yourAnswer = question.options.find(o => o.id === answer?.optionId);
    if (yourAnswer) details.append(element('p', `Tu respuesta: ${yourAnswer.text}`));
    details.append(element('p', `Respuesta correcta: ${question.options.find(o => o.id === question.correctOptionId).text}`));
    const feedback = element('div', null, 'feedback-panel');
    renderExplanation(feedback, question, answer?.correct);
    details.append(feedback);
    return details;
  }));
  $('self-result-title').focus();
}

async function setMode(mode) {
  const revision = ++modeRevision;
  stopLive?.(); stopLive = null;
  status('');
  $('mode-picker').hidden = Boolean(mode);
  $('self-mode').hidden = mode !== 'self';
  $('live-mode').hidden = !mode || mode === 'self';
  document.body.classList.toggle('projection', mode === 'proyeccion');
  if (mode === 'self') {
    $('self-setup').hidden = false; $('self-play').hidden = true; $('self-results').hidden = true;
    quiz = []; answers = new Map();
    status('Preparando las preguntas…');
    try { await loadBank(); updateCount(); status(''); $('self-title').focus(); }
    catch (error) { status(error.message, true); }
  } else if (mode) {
    try {
      const { startLive } = await import('./live.mjs');
      if (revision !== modeRevision) return;
      const stop = await startLive(mode);
      if (revision !== modeRevision) stop(); else stopLive = stop;
    }
    catch (error) { status(error.message, true); }
  }
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => { setMode(null); history.replaceState(null, '', location.pathname); }));
$('self-setup').addEventListener('input', updateCount);
for (const [id, checked] of [['select-all', true], ['select-none', false]]) {
  $(id).addEventListener('click', () => { document.querySelectorAll('input[name=unit]').forEach(input => { input.checked = checked; }); updateCount(); });
}
$('self-setup').addEventListener('submit', event => {
  event.preventDefault();
  try {
    quiz = createQuiz(bank, selected('unit'), selected('difficulty'), Number($('question-count').value));
    answers = new Map(); current = 0;
    $('self-setup').hidden = true; $('self-play').hidden = false; status(''); showSelfQuestion();
  } catch (error) { status(error.message, true); }
});
$('next-self').addEventListener('click', () => { current += 1; current === quiz.length ? finishSelf() : showSelfQuestion(); });
$('leave-self').addEventListener('click', finishSelf);
$('restart-self').addEventListener('click', () => setMode('self'));
const params = new URLSearchParams(location.search);
const initial = params.get('modo');
if (['docente', 'proyeccion'].includes(initial)) setMode(initial);
else if (params.has('sala')) setMode('live');
