export function initInquiryForm() {
  const form = document.querySelector('#brief-form');
  if (!form) return null;
  const taskInput = document.querySelector('#brief-task');
  const serviceInput = document.querySelector('#brief-service');
  const result = document.querySelector('#brief-result');
  const error = document.querySelector('#task-error');
  const preview = document.querySelector('#brief-preview');
  const copyStatus = document.querySelector('#copy-status');
  let draftRevision = 0;
  function invalidateDraft() {
    draftRevision++;
    result.hidden = true;
    copyStatus.textContent = '';
  }
  function clearTaskError() {
    taskInput.removeAttribute('aria-invalid');
    error.hidden = true;
  }
  function chooseService(service, task) {
    serviceInput.value = service;
    if (task && !taskInput.value.trim()) {
      taskInput.value = task;
      clearTaskError();
    }
    invalidateDraft();
    document.querySelector('#contact').scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
    serviceInput.focus({ preventScroll: true });
  }
  taskInput.addEventListener('input', clearTaskError);
  form.addEventListener('input', invalidateDraft);
  form.addEventListener('change', invalidateDraft);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    invalidateDraft();
    if (taskInput.value.trim().length < 12) {
      error.textContent =
        'Опишите задачу чуть подробнее: минимум 12 символов, без пробелов по краям.';
      error.hidden = false;
      taskInput.setAttribute('aria-invalid', 'true');
      taskInput.focus();
      return;
    }
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const company = String(data.get('company') || '').trim();
    const lines = ['Здравствуйте, Елена!', '', 'Хочу обсудить работу с командой.'];
    if (name) lines.push('Имя: ' + name);
    if (company) lines.push('Компания: ' + company);
    lines.push(
      'Интересующий формат: ' + data.get('service'),
      'Размер команды: ' + data.get('size'),
      'Формат встречи: ' + data.get('mode'),
      '',
      'Задача: ' + taskInput.value.trim(),
    );
    preview.value = lines.join('\n');
    document.querySelector('#email-draft').href =
      'mailto:cev.biztutor@gmail.com?subject=' +
      encodeURIComponent('Запрос на работу с командой') +
      '&body=' +
      encodeURIComponent(preview.value);
    copyStatus.textContent = '';
    result.hidden = false;
    preview.focus({ preventScroll: true });
    result.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'nearest',
    });
  });
  document.querySelector('#copy-brief').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const revision = draftRevision;
    const text = preview.value;
    // A clipboard reply belongs to the draft that started it, even if the form changes.
    const isCurrentDraft = () => revision === draftRevision && !result.hidden;
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (!isCurrentDraft()) return;
      copyStatus.textContent = 'Текст скопирован. Вставьте его в сообщение Елене и отправьте.';
    } catch {
      if (!isCurrentDraft()) return;
      preview.focus();
      preview.select();
      copyStatus.textContent =
        'Автоматическое копирование недоступно. Текст выделен: скопируйте его вручную.';
    } finally {
      button.disabled = false;
    }
  });

  // Optional page-scoped agent entry point: prepare the visible form, never send it.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const serviceNames = [...serviceInput.options].map((option) => option.value);
    try {
      Promise.resolve(
        document.modelContext.registerTool(
          {
            name: 'stage_service_inquiry',
            title: 'Выбрать формат для запроса',
            description:
              'Select a service in the visible inquiry composer and navigate to it. Does not send a message, open an external service, or store contact data.',
            inputSchema: {
              type: 'object',
              properties: { service: { type: 'string', enum: serviceNames } },
              required: ['service'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).some((key) => key !== 'service') ||
                !serviceNames.includes(input.service)
              ) {
                throw new Error('Choose a service listed in the form.');
              }
              chooseService(input.service);
              return { status: 'prepared', service: serviceInput.value, submitted: false };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
      window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    } catch {
      /* The normal interface remains available. */
    }
  }

  return { chooseService };
}
