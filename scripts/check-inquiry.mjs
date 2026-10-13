import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

let instance = 0;
const base = process.env.LANDING_TEST_ROOT
  ? pathToFileURL(process.env.LANDING_TEST_ROOT.replace(/\/$/, '') + '/')
  : new URL('../docs/', import.meta.url);
const html = await readFile(new URL('index.html', base), 'utf8');

async function page(t, { clipboard, reducedMotion = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  const { window } = dom;
  window.matchMedia = () => ({ matches: reducedMotion, addEventListener() {} });
  window.requestAnimationFrame = () => 1;
  window.HTMLElement.prototype.scrollIntoView = function (options) {
    this.scrollOptions = options;
  };
  if (clipboard) Object.defineProperty(window.navigator, 'clipboard', { value: clipboard });
  const globals = {
    window,
    document: window.document,
    navigator: window.navigator,
    FormData: window.FormData,
  };
  const previous = new Map();
  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
  t.after(() => {
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  await import(new URL(`script.js?test=${++instance}`, base));
  const query = (selector) => window.document.querySelector(selector);
  const event = (element, type) => element.dispatchEvent(new window.Event(type, { bubbles: true }));
  return {
    window,
    document: window.document,
    query,
    event,
    submit: () => query('#brief-form').requestSubmit(),
  };
}

test('empty and short inquiries remain invalid and never expose a prepared result', async (t) => {
  const p = await page(t);
  for (const task of ['', 'Коротко']) {
    p.query('#brief-task').value = task;
    if (!task) assert.equal(p.query('#brief-form').checkValidity(), false);
    p.submit();
    assert.equal(p.query('#brief-result').hidden, true);
    if (task) assert.equal(p.query('#brief-task').getAttribute('aria-invalid'), 'true');
  }
});

test('whitespace cannot satisfy the minimum inquiry length; editing clears the error', async (t) => {
  const p = await page(t);
  const task = p.query('#brief-task');
  task.value = '            коротко            ';
  p.submit();
  assert.equal(task.getAttribute('aria-invalid'), 'true');
  assert.equal(p.query('#task-error').hidden, false);
  assert.equal(p.query('#brief-result').hidden, true);
  assert.equal(p.document.activeElement, task);
  task.value = 'Хотим улучшить взаимодействие команды.';
  p.event(task, 'input');
  assert.equal(task.hasAttribute('aria-invalid'), false);
  assert.equal(p.query('#task-error').hidden, true);
});

test('an inquiry includes selected fields and safely encodes Cyrillic, ampersands and newlines in email', async (t) => {
  const p = await page(t);
  p.query('#brief-name').value = '  Матвей & Елена  ';
  p.query('#brief-company').value = '  Компания «А+Б»  ';
  p.query('#brief-service').value = 'Стратегические сессии';
  p.query('#brief-size').value = '8–15 человек';
  p.query('input[name="mode"][value="Онлайн"]').checked = true;
  p.query('#brief-task').value = '  Согласовать цели & ответственность.\nПодготовить план.  ';
  p.submit();
  const text = p.query('#brief-preview').value;
  assert.match(text, /Имя: Матвей & Елена/);
  assert.match(text, /Компания: Компания «А\+Б»/);
  assert.match(text, /Интересующий формат: Стратегические сессии/);
  assert.match(text, /Размер команды: 8–15 человек/);
  assert.match(text, /Формат встречи: Онлайн/);
  assert.ok(text.endsWith('Задача: Согласовать цели & ответственность.\nПодготовить план.'));
  const email = new URL(p.query('#email-draft').href);
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'cev.biztutor@gmail.com');
  assert.equal(email.searchParams.get('body'), text);
  assert.equal(email.searchParams.get('subject'), 'Запрос на работу с командой');
  assert.equal(p.query('#brief-result').hidden, false);
  assert.equal(p.document.activeElement, p.query('#brief-preview'));
});

test('optional fields are omitted and user text is displayed as text', async (t) => {
  const p = await page(t);
  p.query('#brief-task').value = '<img src=x onerror=alert(1)> Нужно обсудить задачу.';
  p.submit();
  const text = p.query('#brief-preview').value;
  assert.ok(!text.includes('Имя:'));
  assert.ok(!text.includes('Компания:'));
  assert.ok(text.includes('<img src=x onerror=alert(1)>'));
  assert.equal(p.query('.contactCard img'), null);
  assert.equal(p.window.localStorage.length, 0);
  assert.equal(p.window.sessionStorage.length, 0);
});

test('editing a prepared inquiry hides the stale result', async (t) => {
  const p = await page(t);
  p.query('#brief-task').value = 'Подготовить план развития команды.';
  p.submit();
  assert.equal(p.query('#brief-result').hidden, false);
  p.event(p.query('#brief-name'), 'input');
  assert.equal(p.query('#brief-result').hidden, true);
  p.submit();
  p.event(p.query('#brief-service'), 'change');
  assert.equal(p.query('#brief-result').hidden, true);
});

test('each task choice updates the recommendation and opens its matching service', async (t) => {
  const p = await page(t);
  const choices = [
    ['strategy', 'Стратегическая сессия', 'service-strategy'],
    ['team', 'Бизнес-игра и командный разбор', 'service-games'],
    ['skills', 'Игровой бизнес-тренинг', 'service-training'],
    ['diagnostics', 'Диагностика команды', 'service-diagnostics'],
  ];
  for (const [value, title, id] of choices) {
    const radio = p.query(`input[name="task-choice"][value="${value}"]`);
    radio.checked = true;
    p.event(radio, 'change');
    assert.equal(p.query('#recommend-title').textContent, title);
    assert.equal(p.query('#recommend-link').getAttribute('href'), '#' + id);
    p.query('#recommend-link').click();
    assert.equal(p.query('#' + id).open, true);
  }
});

test('choosing a recommendation fills an empty task and preserves a task already entered', async (t) => {
  const p = await page(t);
  const radio = p.query('input[name="task-choice"][value="team"]');
  radio.checked = true;
  p.event(radio, 'change');
  p.query('#choose-format').click();
  assert.equal(p.query('#brief-service').value, 'Бизнес-игры');
  assert.match(p.query('#brief-task').value, /взаимодействие между отделами/);
  assert.equal(p.document.activeElement, p.query('#brief-service'));
  p.query('#brief-task').value = 'Мой собственный запрос для команды.';
  p.query('#choose-format').click();
  assert.equal(p.query('#brief-task').value, 'Мой собственный запрос для команды.');
});

test('all format buttons select a valid form option without overwriting the task', async (t) => {
  const p = await page(t);
  p.query('#brief-task').value = 'Сохранить описание моей ситуации.';
  for (const button of p.document.querySelectorAll('[data-format]')) {
    button.click();
    assert.equal(p.query('#brief-service').value, button.dataset.format);
    assert.equal(p.query('#brief-task').value, 'Сохранить описание моей ситуации.');
  }
});

test('clipboard success copies exactly the visible inquiry and re-enables the button', async (t) => {
  let copied;
  const p = await page(t, {
    clipboard: {
      writeText: async (value) => {
        copied = value;
      },
    },
  });
  p.query('#brief-task').value = 'Согласовать следующий шаг команды.';
  p.submit();
  p.query('#copy-brief').click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(copied, p.query('#brief-preview').value);
  assert.match(p.query('#copy-status').textContent, /Текст скопирован/);
  assert.equal(p.query('#copy-brief').disabled, false);
});

test('clipboard failure selects the inquiry for manual copying', async (t) => {
  const p = await page(t, {
    clipboard: {
      writeText: async () => {
        throw new Error('Denied');
      },
    },
  });
  p.query('#brief-task').value = 'Согласовать следующий шаг команды.';
  p.submit();
  p.query('#copy-brief').click();
  await new Promise((resolve) => setImmediate(resolve));
  const preview = p.query('#brief-preview');
  assert.equal(p.document.activeElement, preview);
  assert.equal(preview.selectionStart, 0);
  assert.equal(preview.selectionEnd, preview.value.length);
  assert.match(p.query('#copy-status').textContent, /скопируйте его вручную/);
  assert.equal(p.query('#copy-brief').disabled, false);
});

test('reduced motion preserves navigation without smooth scrolling', async (t) => {
  const p = await page(t, { reducedMotion: true });
  p.query('#choose-format').click();
  assert.equal(p.query('#contact').scrollOptions.behavior, 'instant');
  p.submit();
  assert.equal(p.query('#brief-result').scrollOptions.behavior, 'instant');
});

test('mobile menu closes with Escape, outside click and navigation', async (t) => {
  const p = await page(t);
  const button = p.query('.menuToggle');
  button.click();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  p.document.dispatchEvent(new p.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(p.document.activeElement, button);
  button.click();
  p.query('#hero-title').click();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  button.click();
  p.query('#navigation a').click();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});
