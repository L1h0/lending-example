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
  let currentRecommendation = recommendations.strategy;
  document.querySelectorAll('input[name="task-choice"]').forEach((input) =>
    input.addEventListener('change', () => {
      currentRecommendation = recommendations[input.value];
      document.querySelector('#recommend-title').textContent = currentRecommendation.title;
      document.querySelector('#recommend-copy').textContent = currentRecommendation.copy;
      document.querySelector('#recommend-link').href = '#' + currentRecommendation.id;
    }),
  );
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
  document.querySelector('#recommend-link').addEventListener('click', () => {
    document.querySelector('#' + currentRecommendation.id).open = true;
  });
}
