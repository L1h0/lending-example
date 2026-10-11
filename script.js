import {initHeaderScroll} from './header-scroll.js';

const menuButton = document.querySelector('.menuToggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.siteHeader')) closeMenu();
});
window.matchMedia('(min-width: 1001px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
initHeaderScroll(closeMenu);

const recommendations = {
  strategy: {title:'Стратегическая сессия', service:'Стратегические сессии', id:'service-strategy', copy:'Согласовать цель, выбрать приоритеты и перевести обсуждение в план действий с ответственными.', task:'Хотим согласовать общую цель, приоритеты и план действий для команды.'},
  team: {title:'Бизнес-игра и командный разбор', service:'Бизнес-игры', id:'service-games', copy:'Увидеть, как команда договаривается и принимает решения. Разобрать взаимодействие и найти точки, где нужны новые договорённости.', task:'Хотим улучшить взаимодействие между отделами и договориться о распределении ответственности.'},
  skills: {title:'Игровой бизнес-тренинг', service:'Игровые бизнес-тренинги', id:'service-training', copy:'Отработать управленческие инструменты на практике: делегирование, обратную связь или работу с изменениями.', task:'Хотим развить управленческие навыки руководителей и применять инструменты в ежедневной работе.'},
  diagnostics: {title:'Диагностика команды', service:'Диагностика команды', id:'service-diagnostics', copy:'Понять текущую ситуацию, определить сильные стороны и управленческие риски, затем выбрать приоритеты развития.', task:'Хотим понять причины проблем в команде и определить приоритеты развития.'}
};
let currentRecommendation = recommendations.strategy;
const form = document.querySelector('#brief-form');
const taskInput = document.querySelector('#brief-task');
const serviceInput = document.querySelector('#brief-service');
const result = document.querySelector('#brief-result');
function chooseService(service, task) {
  serviceInput.value = service;
  if (task && !taskInput.value.trim()) {
    taskInput.value = task;
    taskInput.removeAttribute('aria-invalid');
    document.querySelector('#task-error').hidden = true;
  }
  result.hidden = true;
  document.querySelector('#contact').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  serviceInput.focus({preventScroll:true});
}
document.querySelectorAll('input[name="task-choice"]').forEach(input => input.addEventListener('change', () => {
  currentRecommendation = recommendations[input.value];
  document.querySelector('#recommend-title').textContent = currentRecommendation.title;
  document.querySelector('#recommend-copy').textContent = currentRecommendation.copy;
  document.querySelector('#recommend-link').href = '#' + currentRecommendation.id;
}));
document.querySelector('#choose-format').addEventListener('click', () => chooseService(currentRecommendation.service, currentRecommendation.task));
document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => chooseService(button.dataset.format)));
document.querySelector('#recommend-link').addEventListener('click', () => {
  document.querySelector('#' + currentRecommendation.id).open = true;
});

const error = document.querySelector('#task-error');
const preview = document.querySelector('#brief-preview');
const copyStatus = document.querySelector('#copy-status');
taskInput.addEventListener('input', () => {
  taskInput.removeAttribute('aria-invalid'); error.hidden = true;
});
form.addEventListener('input', () => {
  result.hidden = true; copyStatus.textContent = '';
});
form.addEventListener('change', () => { result.hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (taskInput.value.trim().length < 12) {
    error.textContent = 'Опишите задачу чуть подробнее: минимум 12 символов, без пробелов по краям.';
    error.hidden = false;
    taskInput.setAttribute('aria-invalid','true');
    taskInput.focus(); return;
  }
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const company = String(data.get('company') || '').trim();
  const lines = ['Здравствуйте, Елена!', '', 'Хочу обсудить работу с командой.'];
  if (name) lines.push('Имя: ' + name);
  if (company) lines.push('Компания: ' + company);
  lines.push('Интересующий формат: ' + data.get('service'), 'Размер команды: ' + data.get('size'), 'Формат встречи: ' + data.get('mode'), '', 'Задача: ' + taskInput.value.trim());
  preview.value = lines.join('\n');
  document.querySelector('#email-draft').href = 'mailto:cev.biztutor@gmail.com?subject=' + encodeURIComponent('Запрос на работу с командой') + '&body=' + encodeURIComponent(preview.value);
  copyStatus.textContent = ''; result.hidden = false;
  preview.focus({preventScroll:true});
  result.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'nearest'});
});
document.querySelector('#copy-brief').addEventListener('click', async event => {
  const button = event.currentTarget; button.disabled = true;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(preview.value);
    copyStatus.textContent = 'Текст скопирован. Вставьте его в сообщение Елене и отправьте.';
  } catch {
    preview.focus(); preview.select();
    copyStatus.textContent = 'Автоматическое копирование недоступно. Текст выделен: скопируйте его вручную.';
  } finally { button.disabled = false; }
});

// Optional page-scoped agent entry point: prepare the visible form, never send it.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const serviceNames = [...serviceInput.options].map(option => option.value);
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'stage_service_inquiry',
      title: 'Выбрать формат для запроса',
      description: 'Select a service in the visible inquiry composer and navigate to it. Does not send a message, open an external service, or store contact data.',
      inputSchema: {type:'object',properties:{service:{type:'string',enum:serviceNames}},required:['service'],additionalProperties:false},
      annotations: {readOnlyHint:false,untrustedContentHint:false},
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'service') || !serviceNames.includes(input.service)) {
          throw new Error('Choose a service listed in the form.');
        }
        chooseService(input.service);
        return {status:'prepared',service:serviceInput.value,submitted:false};
      }
    },{signal:lifecycle.signal})).catch(() => {});
    window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
  } catch { /* The normal interface remains available. */ }
}
