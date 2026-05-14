(function () {
  const STORAGE_KEY = 'simulador-cms-configs';
  const TERM_OPTIONS = [12, 24, 36, 48, 60];

  const baseConfigs = window.SIMULADOR_CONFIGS || {};
  const persisted = readPersisted();
  const state = {
    configs: persisted || structuredClone(baseConfigs),
    currentChannel: null,
  };

  const refs = {
    channelList: document.getElementById('channel-list'),
    channelSelect: document.getElementById('channel-select'),
    newChannelId: document.getElementById('new-channel-id'),
    btnCreateChannel: document.getElementById('btn-create-channel'),
    channelVersion: document.getElementById('channel-version'),
    channelStatus: document.getElementById('channel-status'),
    uiTitle: document.getElementById('ui-title'),
    uiCta: document.getElementById('ui-cta'),
    amountMin: document.getElementById('amount-min'),
    amountMax: document.getElementById('amount-max'),
    amountStep: document.getElementById('amount-step'),
    amountDefault: document.getElementById('amount-default'),
    termsInline: document.getElementById('terms-inline'),
    financeTae: document.getElementById('finance-tae'),
    sectorEnabled: document.getElementById('sector-enabled'),
    sectorDefault: document.getElementById('sector-default'),
    productsEnabled: document.getElementById('products-enabled'),
    productsLabel: document.getElementById('products-label'),
    productsOptions: document.getElementById('products-options'),
    productsDefault: document.getElementById('products-default'),
    insuranceEnabled: document.getElementById('insurance-enabled'),
    insuranceIncluded: document.getElementById('insurance-included'),
    insuranceAmount: document.getElementById('insurance-amount'),
    offersEnabled: document.getElementById('offers-enabled'),
    offersRules: document.getElementById('offers-rules'),
    jsonPreview: document.getElementById('json-preview'),
    message: document.getElementById('cms-message'),
    btnSaveBrowser: document.getElementById('btn-save-browser'),
    btnCopyJson: document.getElementById('btn-copy-json'),
    btnDownloadJson: document.getElementById('btn-download-json'),
    btnExportChannels: document.getElementById('btn-export-channels'),
    btnReset: document.getElementById('btn-reset'),
  };

  init();

  function init() {
    const channels = Object.keys(state.configs);

    channels.forEach((channelId) => {
      const opt = document.createElement('option');
      opt.value = channelId;
      opt.textContent = channelId;
      refs.channelSelect.appendChild(opt);
    });

    state.currentChannel = channels[0] || null;
    refs.channelSelect.value = state.currentChannel || '';

    buildTermCheckboxes();
    renderChannelList();

    bindEvents();
    renderForm();
  }

  function bindEvents() {
    refs.channelSelect.addEventListener('change', () => {
      applyFormToState();
      state.currentChannel = refs.channelSelect.value;
      renderChannelList();
      renderForm();
      setMessage('Canal cargado.');
    });

    refs.btnCreateChannel.addEventListener('click', () => {
      applyFormToState();

      const rawId = refs.newChannelId.value.trim();
      const channelId = sanitizeChannelId(rawId);

      if (!channelId) {
        setMessage('Indica un id valido para el nuevo canal.');
        return;
      }

      if (state.configs[channelId]) {
        setMessage('Ese canal ya existe.');
        return;
      }

      const base = structuredClone(state.configs.default || getCurrentConfig() || {
        schemaVersion: '1.0',
        finance: { tae: 0.0699 },
        amount: { min: 0, max: 150000, step: 1000, default: 75000, milestones: [0, 50000, 100000, 150000] },
        terms: { options: TERM_OPTIONS.slice(), default: 36 },
        sector: { enabled: true, label: 'Sector', default: 'Farmacia', options: ['Farmacia', 'Dental', 'Fisioterapia', 'Veterinaria'] },
        products: { enabled: false, label: 'Producto', default: '', options: [] },
        offers: { enabled: false, maxStackedDiscount: 0.02, rules: [] },
        insurance: { enabled: false, mode: 'one_time_fixed', included: false, amount: 0, label: 'Seguro a todo riesgo' },
        ui: { title: 'Simulador de Cuotas de Renting', ctaLabel: 'Me interesa ->' },
      });

      base.channelId = channelId;
      base.version = '1.0.0';
      base.status = 'draft';
      base.ui = base.ui || {};
      base.ui.title = `Simulador ${channelId}`;

      state.configs[channelId] = base;
      state.currentChannel = channelId;

      refillChannelOptions();
      renderChannelList();
      renderForm();
      const saved = persistState();

      refs.newChannelId.value = '';
      if (saved) {
        setMessage(`Canal creado y guardado: ${channelId}.`);
      } else {
        setMessage(`Canal creado: ${channelId}. No se pudo guardar en navegador.`);
      }
    });

    const liveFields = [
      refs.channelVersion,
      refs.channelStatus,
      refs.uiTitle,
      refs.uiCta,
      refs.amountMin,
      refs.amountMax,
      refs.amountStep,
      refs.amountDefault,
      refs.financeTae,
      refs.sectorEnabled,
      refs.sectorDefault,
      refs.productsEnabled,
      refs.productsLabel,
      refs.productsOptions,
      refs.productsDefault,
      refs.insuranceEnabled,
      refs.insuranceIncluded,
      refs.insuranceAmount,
      refs.offersEnabled,
      refs.offersRules,
    ];

    liveFields.forEach((field) => {
      const eventName = field.tagName === 'TEXTAREA' || field.type === 'text' || field.type === 'number'
        ? 'input'
        : 'change';

      field.addEventListener(eventName, () => {
        applyFormToState();
        refreshJsonPreview();
      });

      if (eventName !== 'change') {
        field.addEventListener('change', () => {
          applyFormToState();
          refreshJsonPreview();
        });
      }
    });

    refs.termsInline.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        applyFormToState();
        refreshJsonPreview();
      });
    });

    refs.btnSaveBrowser.addEventListener('click', () => {
      applyFormToState();
      const saved = persistState();
      refreshJsonPreview();
      if (saved) {
        setMessage(`Canal guardado: ${state.currentChannel}.`);
      } else {
        setMessage('No se pudo guardar en este navegador (almacenamiento bloqueado).');
      }
    });

    refs.btnCopyJson.addEventListener('click', async () => {
      applyFormToState();
      const json = JSON.stringify(getCurrentConfig(), null, 2);

      try {
        await navigator.clipboard.writeText(json);
        setMessage('JSON copiado al portapapeles.');
      } catch (err) {
        setMessage('No se pudo copiar automaticamente. Usa el preview para copiar manualmente.');
      }
    });

    refs.btnDownloadJson.addEventListener('click', () => {
      applyFormToState();
      const channelId = state.currentChannel;
      const json = JSON.stringify(getCurrentConfig(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${channelId}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      setMessage('JSON descargado. Reemplaza configs/channels/' + channelId + '.json y ejecuta build.');
    });

    refs.btnExportChannels.addEventListener('click', async () => {
      applyFormToState();

      const assets = await loadPageAssets();
      if (!assets) {
        setMessage('No se pudieron cargar assets para exportar paginas.');
        return;
      }

      const channelId = state.currentChannel;
      const channelConfig = getCurrentConfig();

      if (!channelId || !channelConfig) {
        setMessage('No hay canal seleccionado para exportar.');
        return;
      }

      const html = buildStandaloneChannelPage(channelId, channelConfig, assets);
      downloadFile(`${channelId}.html`, html, 'text/html');

      setMessage(`Pagina exportada: ${channelId}.html`);
    });

    refs.btnReset.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      state.configs = structuredClone(baseConfigs);
      state.currentChannel = Object.keys(state.configs)[0] || null;
      refillChannelOptions();
      renderChannelList();
      renderForm();
      setMessage('Cambios del navegador descartados.');
    });
  }

  function refillChannelOptions() {
    refs.channelSelect.innerHTML = '';
    Object.keys(state.configs).forEach((channelId) => {
      const opt = document.createElement('option');
      opt.value = channelId;
      opt.textContent = channelId;
      refs.channelSelect.appendChild(opt);
    });
    refs.channelSelect.value = state.currentChannel || '';
  }

  function renderChannelList() {
    refs.channelList.innerHTML = '';

    Object.keys(state.configs).forEach((channelId) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cms-channel-chip' + (channelId === state.currentChannel ? ' is-active' : '');
      button.textContent = channelId;
      button.addEventListener('click', () => {
        applyFormToState();
        state.currentChannel = channelId;
        refs.channelSelect.value = channelId;
        renderChannelList();
        renderForm();
        setMessage(`Canal cargado: ${channelId}.`);
      });

      refs.channelList.appendChild(button);
    });
  }

  function renderForm() {
    const cfg = getCurrentConfig();
    if (!cfg) return;

    refs.channelVersion.value = cfg.version || '';
    refs.channelStatus.value = cfg.status || 'draft';
    refs.uiTitle.value = cfg.ui?.title || '';
    refs.uiCta.value = cfg.ui?.ctaLabel || '';

    refs.amountMin.value = cfg.amount?.min ?? 0;
    refs.amountMax.value = cfg.amount?.max ?? 0;
    refs.amountStep.value = cfg.amount?.step ?? 1000;
    refs.amountDefault.value = cfg.amount?.default ?? 0;

    const selectedTerms = Array.isArray(cfg.terms?.options) && cfg.terms.options.length
      ? cfg.terms.options.map(Number)
      : TERM_OPTIONS;
    refs.termsInline.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      const term = Number(checkbox.value);
      checkbox.checked = selectedTerms.includes(term);
    });

    refs.financeTae.value = cfg.finance?.tae ?? 0;

    refs.sectorEnabled.checked = Boolean(cfg.sector?.enabled);
    refs.sectorDefault.value = cfg.sector?.default || 'Farmacia';

    refs.productsEnabled.checked = Boolean(cfg.products?.enabled);
    refs.productsLabel.value = cfg.products?.label || 'Producto';
    refs.productsOptions.value = (cfg.products?.options || []).join(',');
    refs.productsDefault.value = cfg.products?.default || '';

    refs.insuranceEnabled.checked = Boolean(cfg.insurance?.enabled);
    refs.insuranceIncluded.checked = Boolean(cfg.insurance?.included);
    refs.insuranceAmount.value = cfg.insurance?.amount ?? 0;

    refs.offersEnabled.checked = Boolean(cfg.offers?.enabled);
    refs.offersRules.value = JSON.stringify(cfg.offers?.rules || [], null, 2);

    refreshJsonPreview();
  }

  function applyFormToState() {
    const cfg = getCurrentConfig();
    if (!cfg) return;

    cfg.version = refs.channelVersion.value.trim() || cfg.version;
    cfg.status = refs.channelStatus.value;

    cfg.ui = cfg.ui || {};
    cfg.ui.title = refs.uiTitle.value.trim();
    cfg.ui.ctaLabel = refs.uiCta.value.trim();

    cfg.amount = cfg.amount || {};
    cfg.amount.min = toNumber(refs.amountMin.value, 0);
    cfg.amount.max = toNumber(refs.amountMax.value, 0);
    cfg.amount.step = toNumber(refs.amountStep.value, 1000);
    cfg.amount.default = toNumber(refs.amountDefault.value, cfg.amount.min);

    cfg.terms = cfg.terms || {};
    cfg.terms.options = getSelectedTerms();
    cfg.terms.default = cfg.terms.options.includes(Number(cfg.terms.default))
      ? Number(cfg.terms.default)
      : cfg.terms.options[0] || 12;

    cfg.finance = cfg.finance || {};
    cfg.finance.tae = toNumber(refs.financeTae.value, 0.0699);

    cfg.sector = cfg.sector || {};
    cfg.sector.enabled = refs.sectorEnabled.checked;
    cfg.sector.default = refs.sectorDefault.value;
    cfg.sector.options = ['Farmacia', 'Dental', 'Fisioterapia', 'Veterinaria'];
    cfg.sector.label = cfg.sector.label || 'Sector';

    cfg.products = cfg.products || {};
    cfg.products.enabled = refs.productsEnabled.checked;
    cfg.products.label = refs.productsLabel.value.trim() || 'Producto';
    cfg.products.options = parseStringCsv(refs.productsOptions.value);
    cfg.products.default = refs.productsDefault.value.trim();

    cfg.insurance = cfg.insurance || {};
    cfg.insurance.enabled = refs.insuranceEnabled.checked;
    cfg.insurance.included = refs.insuranceIncluded.checked;
    cfg.insurance.mode = 'one_time_fixed';
    cfg.insurance.label = 'Seguro a todo riesgo';
    cfg.insurance.amount = cfg.insurance.included ? 0 : toNumber(refs.insuranceAmount.value, 0);

    cfg.offers = cfg.offers || {};
    cfg.offers.enabled = refs.offersEnabled.checked;
    cfg.offers.maxStackedDiscount = Number(cfg.offers.maxStackedDiscount ?? 0.02);

    try {
      const parsed = JSON.parse(refs.offersRules.value || '[]');
      cfg.offers.rules = Array.isArray(parsed) ? parsed : [];
      refs.offersRules.style.borderColor = '';
    } catch (err) {
      refs.offersRules.style.borderColor = '#b52727';
    }

    persistState();
  }

  function refreshJsonPreview() {
    refs.jsonPreview.value = JSON.stringify(getCurrentConfig(), null, 2);
  }

  function getCurrentConfig() {
    if (!state.currentChannel) return null;
    return state.configs[state.currentChannel];
  }

  function readPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function buildTermCheckboxes() {
    refs.termsInline.innerHTML = '';

    TERM_OPTIONS.forEach((term) => {
      const label = document.createElement('label');
      label.className = 'cms-term-item';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = String(term);
      input.checked = true;

      const text = document.createElement('span');
      text.textContent = String(term);

      label.appendChild(input);
      label.appendChild(text);
      refs.termsInline.appendChild(label);
    });
  }

  function getSelectedTerms() {
    const selected = Array.from(refs.termsInline.querySelectorAll('input[type="checkbox"]'))
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => Number(checkbox.value))
      .filter((value) => Number.isFinite(value) && value > 0);

    return selected.length ? selected : TERM_OPTIONS.slice();
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function parseStringCsv(raw) {
    return String(raw)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function sanitizeChannelId(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }

  function setMessage(text) {
    refs.message.textContent = text;
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.configs));
      return true;
    } catch (err) {
      return false;
    }
  }

  async function loadPageAssets() {
    try {
      const [css, js] = await Promise.all([
        fetch('../css/simulador.css').then((response) => response.text()),
        fetch('../js/simulador.js').then((response) => response.text()),
      ]);
      return { css, js };
    } catch (err) {
      return null;
    }
  }

  function buildStandaloneChannelPage(channelId, channelConfig, assets) {
    const runtimeConfig = JSON.stringify({ [channelId]: channelConfig }, null, 2);
    const safeJs = assets.js.replace(/<\/script>/gi, '<\\/script>');

    return `<!DOCTYPE html>
<html lang="es" data-canal="${channelId}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Simulador ${channelId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${assets.css}</style>
  <style>
    body { margin: 0; padding: 24px; background: #f4f8fa; font-family: 'Nunito Sans', sans-serif; }
    .shell { max-width: 920px; margin: 0 auto; }
    .title { margin: 0 0 12px; font-size: 28px; color: #1e263b; }
    .meta { margin: 0 0 20px; color: #5e6b7f; }
  </style>
</head>
<body>
  <main class="shell">
    <h1 class="title">Canal: ${channelId}</h1>
    <p class="meta">Pagina exportada desde CMS.</p>
    <div data-simulador data-canal="${channelId}"></div>
  </main>
  <script>window.SIMULADOR_CONFIGS = ${runtimeConfig};</script>
  <script>${safeJs}</script>
</body>
</html>`;
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
})();
