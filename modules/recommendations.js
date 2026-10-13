const recommendations = {
  strategy: {
    title: 'Стратегическая сессия',
    service: 'Стратегические сессии',
    id: 'service-strategy',
    copy: 'Согласовать цель, выбрать приоритеты и перевести обсуждение в план действий с ответственными.',
    task: 'Хотим согласовать общую цель, приоритеты и план действий для команды.',
  },
  team: {
    title: 'Бизнес-игра и командный разбор',
    service: 'Бизнес-игры',
    id: 'service-games',
    copy: 'Увидеть, как команда договаривается и принимает решения. Разобрать взаимодействие и найти точки, где нужны новые договорённости.',
    task: 'Хотим улучшить взаимодействие между отделами и договориться о распределении ответственности.',
  },
  skills: {
    title: 'Игровой бизнес-тренинг',
    service: 'Игровые бизнес-тренинги',
    id: 'service-training',
    copy: 'Отработать управленческие инструменты на практике: делегирование, обратную связь или работу с изменениями.',
    task: 'Хотим развить управленческие навыки руководителей и применять инструменты в ежедневной работе.',
  },
  diagnostics: {
    title: 'Диагностика команды',
    service: 'Диагностика команды',
    id: 'service-diagnostics',
    copy: 'Понять текущую ситуацию, определить сильные стороны и управленческие риски, затем выбрать приоритеты развития.',
    task: 'Хотим понять причины проблем в команде и определить приоритеты развития.',
  },
};

export function initRecommendations(chooseService) {
  const title = document.querySelector('#recommend-title');
  const copy = document.querySelector('#recommend-copy');
  const link = document.querySelector('#recommend-link');
  let currentRecommendation;
  function syncRecommendation() {
    const selected = document.querySelector('input[name="task-choice"]:checked');
    currentRecommendation = recommendations[selected?.value] || recommendations.strategy;
    title.textContent = currentRecommendation.title;
    copy.textContent = currentRecommendation.copy;
    link.href = '#' + currentRecommendation.id;
  }
  document
    .querySelectorAll('input[name="task-choice"]')
    .forEach((input) => input.addEventListener('change', syncRecommendation));
  // Browsers may restore form choices before initialization or when returning from history.
  syncRecommendation();
  window.addEventListener('pageshow', syncRecommendation);
  document
    .querySelector('#choose-format')
    .addEventListener('click', () =>
      chooseService(currentRecommendation.service, currentRecommendation.task),
    );
  document
    .querySelectorAll('[data-format]')
    .forEach((button) =>
      button.addEventListener('click', () => chooseService(button.dataset.format)),
    );
  link.addEventListener('click', () => {
    document.querySelector('#' + currentRecommendation.id).open = true;
  });
}
