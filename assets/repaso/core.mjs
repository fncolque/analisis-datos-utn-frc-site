export const difficultyLabels = { basica: 'Básica', intermedia: 'Intermedia', avanzada: 'Avanzada' };

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function matchingQuestions(bank, units, difficulties) {
  return bank.questions.filter(q => units.includes(q.unit) && difficulties.includes(q.difficulty));
}

export function createQuiz(bank, units, difficulties, count, random = Math.random) {
  const available = matchingQuestions(bank, units, difficulties);
  if (!Number.isInteger(count) || count < 1 || count > available.length) {
    throw new Error(`Elegí una cantidad entre 1 y ${available.length}.`);
  }
  return shuffle(available, random).slice(0, count).map(q => ({ ...q, options: shuffle(q.options, random) }));
}

export function answerQuestion(answers, question, optionId) {
  if (answers.has(question.id)) return answers.get(question.id);
  if (!question.options.some(o => o.id === optionId)) throw new Error('Opción inválida.');
  const answer = { optionId, correct: optionId === question.correctOptionId };
  answers.set(question.id, answer);
  return answer;
}

export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function renderQuestion(container, question, { onAnswer, selected, correctOptionId, disabled = false } = {}) {
  container.replaceChildren();
  const title = element('h2', question.prompt, 'question-title');
  title.tabIndex = -1;
  container.append(title);
  const options = element('div', null, 'answer-options');
  for (const [index, option] of (question.options || []).entries()) {
    const button = element('button', null, 'answer-option');
    button.type = 'button';
    button.append(element('span', 'ABCD'[index], 'option-letter'), element('span', option.text));
    button.disabled = disabled;
    button.dataset.optionId = option.id;
    button.setAttribute('aria-pressed', String(selected === option.id));
    if (correctOptionId === option.id) {
      button.classList.add('is-correct');
      button.append(element('span', 'Correcta', 'answer-label'));
    } else if (correctOptionId && selected === option.id) {
      button.classList.add('is-wrong');
      button.append(element('span', 'Tu respuesta', 'answer-label'));
    }
    button.addEventListener('click', () => onAnswer?.(option.id));
    options.append(button);
  }
  container.append(options);
  return title;
}

export function renderExplanation(container, question, correct) {
  container.replaceChildren();
  const heading = element('h3', correct == null ? 'La explicación' : correct ? 'Respuesta correcta' : 'Revisá la explicación');
  container.append(heading, element('p', question.explanation));
  const link = element('a', `Volver a la teoría: ${question.reference.label}`, 'theory-link');
  link.href = '../' + question.reference.path;
  link.target = '_blank';
  link.rel = 'noopener';
  container.append(link);
  container.hidden = false;
}
