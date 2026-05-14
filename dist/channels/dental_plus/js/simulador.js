/* =========================================================
   SIMULADOR DE CUOTAS DE RENTING
   Configurable por canal (MVP fase 1-3)
   ========================================================= */

const DEFAULT_CHANNEL_CONFIG = {
  schemaVersion: '1.0',
  channelId: 'default',
  version: '1.0.0',
  status: 'published',
  finance: {
    tae: 0.0699,
  },
  amount: {
    min: 0,
    max: 150000,
    step: 1000,
    default: 75000,
    milestones: [0, 50000, 100000, 150000],
  },
  terms: {
    options: [12, 24, 36, 48, 60],
    default: 36,
  },
  sector: {
    enabled: true,
    label: 'Sector',
    default: 'Farmacia',
    options: ['Farmacia', 'Dental', 'Fisioterapia', 'Veterinaria'],
  },
  products: {
    enabled: true,
    label: 'Producto',
    default: 'Equipamiento esencial',
    options: ['Equipamiento esencial', 'Equipamiento premium', 'Mobiliario'],
  },
  offers: {
    enabled: false,
    maxStackedDiscount: 0.02,
    rules: [],
  },
  insurance: {
    enabled: false,
    mode: 'one_time_fixed',
    amount: 0,
    included: false,
    label: 'Seguro a todo riesgo',
  },
  ui: {
    title: 'Simulador de Cuotas de Renting',
    ctaLabel: 'Me interesa ->',
  },
};

const CHANNEL_CONFIGS = {
  default: DEFAULT_CHANNEL_CONFIG,
  dental_plus: {
    schemaVersion: '1.0',
    channelId: 'dental_plus',
    version: '1.0.0',
    status: 'published',
    finance: {
      tae: 0.065,
    },
    amount: {
      min: 5000,
      max: 120000,
      step: 1000,
      default: 50000,
      milestones: [5000, 30000, 60000, 90000, 120000],
    },
    terms: {
      options: [24, 36, 48, 60],
      default: 48,
    },
    sector: {
      enabled: false,
      label: 'Sector',
      default: 'Dental',
      options: ['Farmacia', 'Dental', 'Fisioterapia', 'Veterinaria'],
    },
    products: {
      enabled: true,
      label: 'Producto',
      default: 'Equipamiento premium',
      options: ['Equipamiento esencial', 'Equipamiento premium'],
    },
    offers: {
      enabled: true,
      maxStackedDiscount: 0.02,
      rules: [
        {
          id: 'dental-volume',
          label: 'Descuento por volumen',
          priority: 100,
          stackable: true,
          conditions: {
            minAmount: 70000,
            minTerm: 36,
          },
          discount: {
            type: 'tae_delta',
            value: 0.006,
          },
        },
      ],
    },
    insurance: {
      enabled: true,
      mode: 'one_time_fixed',
      amount: 290,
      included: false,
      label: 'Seguro a todo riesgo',
    },
    ui: {
      title: 'Simulador Renting Dental+',
      ctaLabel: 'Solicitar propuesta ->',
    },
  },
};

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
function deepMerge(base, override) {
  const output = { ...base };

  Object.keys(override || {}).forEach((key) => {
    const baseValue = base ? base[key] : undefined;
    const overrideValue = override[key];

    if (Array.isArray(overrideValue)) {
      output[key] = overrideValue.slice();
      return;
    }

    if (
      overrideValue &&
      typeof overrideValue === 'object' &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      output[key] = deepMerge(baseValue, overrideValue);
      return;
    }

    output[key] = overrideValue;
  });

  return output;
}

function normalizeChannelConfig(rawConfig) {
  const merged = deepMerge(DEFAULT_CHANNEL_CONFIG, rawConfig || {});

  const min = Number(merged.amount.min);
  const max = Number(merged.amount.max);
  const safeMin = Number.isFinite(min) ? min : DEFAULT_CHANNEL_CONFIG.amount.min;
  const safeMax = Number.isFinite(max) ? max : DEFAULT_CHANNEL_CONFIG.amount.max;
  const safeStep = Number.isFinite(Number(merged.amount.step))
    ? Number(merged.amount.step)
    : DEFAULT_CHANNEL_CONFIG.amount.step;

  const normalizedTerms = (merged.terms.options || [])
    .map((term) => Number(term))
    .filter((term) => Number.isFinite(term) && term > 0);

  merged.amount.min = Math.min(safeMin, safeMax);
  merged.amount.max = Math.max(safeMin, safeMax);
  merged.amount.step = Math.max(1, safeStep);
  merged.amount.default = clamp(
    Number(merged.amount.default),
    merged.amount.min,
    merged.amount.max,
  );

  merged.amount.milestones = (merged.amount.milestones || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  merged.terms.options = normalizedTerms.length
    ? normalizedTerms
    : DEFAULT_CHANNEL_CONFIG.terms.options.slice();

  merged.terms.default = merged.terms.options.includes(Number(merged.terms.default))
    ? Number(merged.terms.default)
    : merged.terms.options[0];

  merged.finance.tae = Math.max(0, Number(merged.finance.tae) || DEFAULT_CHANNEL_CONFIG.finance.tae);

  merged.offers.maxStackedDiscount = Math.max(
    0,
    Number(merged.offers.maxStackedDiscount) || DEFAULT_CHANNEL_CONFIG.offers.maxStackedDiscount,
  );

  merged.offers.rules = Array.isArray(merged.offers.rules) ? merged.offers.rules : [];
  merged.offers.rules = merged.offers.rules.filter((rule) => {
    const conditions = rule && rule.conditions ? rule.conditions : {};
    // El producto es informativo y no puede condicionar precio.
    return !(Array.isArray(conditions.products) && conditions.products.length > 0);
  });
  merged.products.options = Array.isArray(merged.products.options) ? merged.products.options : [];
  merged.sector.options = Array.isArray(merged.sector.options) ? merged.sector.options : [];

  if (merged.sector.enabled && !merged.sector.options.length) {
    merged.sector.options = DEFAULT_CHANNEL_CONFIG.sector.options.slice();
  }

  if (merged.sector.enabled && !merged.sector.default) {
    merged.sector.default = merged.sector.options[0] || '';
  }

  if (merged.products.enabled && !merged.products.default) {
    merged.products.default = merged.products.options[0] || '';
  }

  merged.insurance.amount = Math.max(0, Number(merged.insurance.amount) || 0);
  merged.insurance.included = Boolean(merged.insurance.included);

  return merged;
}

function getChannelFromContext() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('canal') ||
    document.documentElement.dataset.canal ||
    'default'
  );
}

function getRuntimeConfigByChannel(channelId) {
  if (window.SIMULADOR_CONFIGS && window.SIMULADOR_CONFIGS[channelId]) {
    return window.SIMULADOR_CONFIGS[channelId];
  }

  if (window.SIMULADOR_CONFIG) {
    return window.SIMULADOR_CONFIG;
  }

  return CHANNEL_CONFIGS[channelId] || CHANNEL_CONFIGS.default;
}

function resolveSimulatorConfig(customConfig, fallbackChannel) {
  if (customConfig && typeof customConfig === 'object') {
    return normalizeChannelConfig(customConfig);
  }

  const channelId = fallbackChannel || getChannelFromContext();
  return normalizeChannelConfig(getRuntimeConfigByChannel(channelId));
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function formatEur(value) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' EUR';
}

function formatEurInt(value) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(value) + ' EUR';
}

function formatK(value) {
  return Math.round(value / 1000) + 'K';
}

function formatMilestone(value) {
  if (value === 0) return '0';
  return formatK(value);
}

/* ---------------------------------------------------------
   Motor de pricing
   --------------------------------------------------------- */
function calcularPMT(importe, meses, tae) {
  if (importe === 0) return 0;
  const r = tae / 12;
  if (r === 0) return importe / meses;
  const rn = Math.pow(1 + r, meses);
  return (importe * r * rn) / (rn - 1);
}

function ruleMatches(rule, context) {
  const conditions = rule.conditions || {};

  if (Number.isFinite(Number(conditions.minAmount)) && context.amount < Number(conditions.minAmount)) {
    return false;
  }

  if (Number.isFinite(Number(conditions.maxAmount)) && context.amount > Number(conditions.maxAmount)) {
    return false;
  }

  if (Number.isFinite(Number(conditions.minTerm)) && context.term < Number(conditions.minTerm)) {
    return false;
  }

  if (Number.isFinite(Number(conditions.maxTerm)) && context.term > Number(conditions.maxTerm)) {
    return false;
  }

  if (Array.isArray(conditions.sectors) && conditions.sectors.length > 0) {
    if (!conditions.sectors.includes(context.sector)) return false;
  }

  if (Array.isArray(conditions.products) && conditions.products.length > 0) {
    // Reglas por producto se invalidan para evitar impacto en precio.
    return false;
  }

  if (Array.isArray(conditions.channels) && conditions.channels.length > 0) {
    if (!conditions.channels.includes(context.channelId)) return false;
  }

  return true;
}

function resolveOfferRules(config, context) {
  if (!config.offers.enabled || !config.offers.rules.length) {
    return {
      appliedRules: [],
      totalDiscount: 0,
      effectiveTae: config.finance.tae,
    };
  }

  const matched = config.offers.rules
    .filter((rule) => ruleMatches(rule, context))
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

  const appliedRules = [];
  let lockNonStackable = false;

  for (const rule of matched) {
    const isExclusive = Boolean(rule.exclusive);
    const isStackable = rule.stackable !== false;

    if (isExclusive) {
      appliedRules.length = 0;
      appliedRules.push(rule);
      break;
    }

    if (!isStackable) {
      if (appliedRules.length === 0 && !lockNonStackable) {
        appliedRules.push(rule);
        lockNonStackable = true;
      }
      continue;
    }

    if (!lockNonStackable) {
      appliedRules.push(rule);
    }
  }

  const rawDiscount = appliedRules.reduce((sum, rule) => {
    const discount = rule.discount || {};
    if (discount.type !== 'tae_delta') return sum;
    return sum + Math.max(0, Number(discount.value) || 0);
  }, 0);

  const totalDiscount = Math.min(rawDiscount, config.offers.maxStackedDiscount);
  const effectiveTae = Math.max(0, config.finance.tae - totalDiscount);

  return {
    appliedRules,
    totalDiscount,
    effectiveTae,
  };
}

function calculatePricing(config, context) {
  const offerResolution = resolveOfferRules(config, context);

  const cuotaBase = calcularPMT(context.amount, context.term, config.finance.tae);
  const cuotaFinal = calcularPMT(context.amount, context.term, offerResolution.effectiveTae);

  const insuranceActive = config.insurance.enabled;
  const insuranceIncluded = insuranceActive && config.insurance.included === true;
  const insurancePaidOneTime =
    insuranceActive &&
    !insuranceIncluded &&
    config.insurance.mode === 'one_time_fixed' &&
    config.insurance.amount > 0;

  const insuranceOneTimeAmount = insurancePaidOneTime ? config.insurance.amount : 0;

  return {
    cuotaBase,
    cuotaFinal,
    taeBase: config.finance.tae,
    taeFinal: offerResolution.effectiveTae,
    totalDiscount: offerResolution.totalDiscount,
    appliedRules: offerResolution.appliedRules,
    insuranceIncluded,
    insuranceOneTimeAmount,
  };
}

/* ---------------------------------------------------------
   Plantilla HTML del simulador
   --------------------------------------------------------- */
function renderTemplate(config, id, uiState = {}) {
  const selectedProduct = uiState.selectedProduct || config.products.default || config.products.options[0] || '';

  const plazosHTML = config.terms.options
    .map(
      (term) =>
        `<button class="sim-plazo-btn${term === config.terms.default ? ' is-active' : ''}" data-plazo="${term}">${term}</button>`,
    )
    .join('');

  const milestonesHTML = config.amount.milestones
    .filter((milestone) => milestone >= config.amount.min && milestone <= config.amount.max)
    .map((milestone) => {
      const pct = ((milestone - config.amount.min) / (config.amount.max - config.amount.min || 1)) * 100;
      return `
        <span class="sim-slider-milestone" style="left:${pct}%">
          <span class="sim-slider-milestone__label">${formatMilestone(milestone)}</span>
        </span>
      `;
    })
    .join('');

  const sectorSelectHTML = config.sector.enabled
    ? `
      <label class="sim-field-label" for="sim-sector-select-${id}">${config.sector.label}</label>
      <div class="sim-select-wrap">
        <select class="sim-select" id="sim-sector-select-${id}" name="sector" data-sector>
          ${config.sector.options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join('')}
        </select>
      </div>
    `
    : '';

  const productsCardsHTML = config.products.enabled
    ? `
      <label class="sim-field-label">${config.products.label}</label>
      <div class="sim-products-grid" data-products-grid>
        ${config.products.options
          .map((option) => {
            const isActive = option === selectedProduct;
            return `
              <button
                type="button"
                class="sim-product-card${isActive ? ' is-active' : ''}"
                data-product-option="${option}"
                aria-pressed="${isActive ? 'true' : 'false'}"
              >
                <span class="sim-product-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M9 6V4.8C9 4.35 9.35 4 9.8 4H14.2C14.65 4 15 4.35 15 4.8V6" stroke="currentColor" stroke-width="1.6"/>
                  </svg>
                </span>
                <span class="sim-product-card__text">${option}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    `
    : '';

  return `
    <div class="sim-module" id="${id}">
      <div class="sim-module__header">
        <span class="sim-module__title">${config.ui.title}</span>
      </div>
      <div class="sim-module__body">
        <div class="sim-col-left">
          <div>
            ${sectorSelectHTML}
            ${productsCardsHTML}

            <label class="sim-field-label">Cuanto necesitas</label>
            <div class="sim-importe-value" data-importe-display>
              ${formatEurInt(config.amount.default)}
            </div>
            <div class="sim-slider-wrap">
              <input
                type="range"
                class="sim-slider"
                data-slider
                min="${config.amount.min}"
                max="${config.amount.max}"
                step="${config.amount.step}"
                value="${config.amount.default}"
              />
              <div class="sim-slider-milestones" aria-hidden="true">
                ${milestonesHTML}
              </div>
            </div>
          </div>
        </div>

        <div class="sim-col-right">
          <div>
            <label class="sim-field-label">Elige el plazo</label>
            <div class="sim-plazo-group" data-plazo-group>
              ${plazosHTML}
            </div>
          </div>

          <div>
            <label class="sim-field-label">Tu cuota estimada</label>
            <div class="sim-result">
              <div class="sim-result__cuota" data-cuota-display></div>
              <div class="sim-result__meta" data-meta-display></div>
              <div class="sim-result__meta" data-breakdown-display></div>
              <div class="sim-result__meta" data-insurance-display></div>
            </div>
          </div>

          <button class="sim-cta-btn" data-cta-btn>
            ${config.ui.ctaLabel}
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------
   Clase principal RentingSimulador
   --------------------------------------------------------- */
class RentingSimulador {
  constructor(rootEl, options = {}) {
    this.root = rootEl;
    this.options = options;
    this.channelHint = options.channel || rootEl.dataset.canal;
    this.config = resolveSimulatorConfig(options.config, this.channelHint);

    this.importe = this.config.amount.default;
    this.meses = this.config.terms.default;
    this.selectedSector = this.config.sector.default || this.config.sector.options[0] || '';
    this.selectedProduct = this.config.products.default || this.config.products.options[0] || '';
    if (this.config.products.enabled && this.config.products.options.length > 0) {
      if (!this.config.products.options.includes(this.selectedProduct)) {
        this.selectedProduct = this.config.products.options[0];
      }
    }

    this.uid = 'sim-' + Math.random().toString(36).slice(2, 7);
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.actualizarUI();
  }

  render() {
    this.root.innerHTML = renderTemplate(this.config, this.uid, {
      selectedProduct: this.selectedProduct,
    });

    this.elImporte = this.root.querySelector('[data-importe-display]');
    this.elSlider = this.root.querySelector('[data-slider]');
    this.elSliderWrap = this.root.querySelector('.sim-slider-wrap');
    this.elCuota = this.root.querySelector('[data-cuota-display]');
    this.elMeta = this.root.querySelector('[data-meta-display]');
    this.elBreakdown = this.root.querySelector('[data-breakdown-display]');
    this.elInsurance = this.root.querySelector('[data-insurance-display]');
    this.elPlazoGrp = this.root.querySelector('[data-plazo-group]');
    this.elCTA = this.root.querySelector('[data-cta-btn]');
    this.elSector = this.root.querySelector('[data-sector]');
    this.elProductsGrid = this.root.querySelector('[data-products-grid]');

    if (this.elSector && this.selectedSector) {
      this.elSector.value = this.selectedSector;
    }

  }

  bindEvents() {
    this.elSlider.addEventListener('input', (event) => {
      this.importe = parseInt(event.target.value, 10);
      this.actualizarUI();
    });

    this.elPlazoGrp.addEventListener('click', (event) => {
      const button = event.target.closest('[data-plazo]');
      if (!button) return;

      this.meses = parseInt(button.dataset.plazo, 10);
      this.elPlazoGrp.querySelectorAll('[data-plazo]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });

      this.actualizarUI();
    });

    if (this.elSector) {
      this.elSector.addEventListener('change', (event) => {
        this.selectedSector = event.target.value;
        this.actualizarUI();
      });
    }

    if (this.elProductsGrid) {
      this.elProductsGrid.addEventListener('click', (event) => {
        const card = event.target.closest('[data-product-option]');
        if (!card) return;

        this.selectedProduct = card.dataset.productOption;
        this.elProductsGrid.querySelectorAll('[data-product-option]').forEach((item) => {
          const isActive = item === card;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        this.actualizarUI();
      });
    }

    this.elCTA.addEventListener('click', () => this.abrirFormulario());
  }

  getPricingDetails() {
    return calculatePricing(this.config, {
      amount: this.importe,
      term: this.meses,
      sector: this.selectedSector,
      product: this.selectedProduct,
      channelId: this.config.channelId,
    });
  }

  actualizarUI() {
    const details = this.getPricingDetails();

    this.elImporte.textContent = formatEurInt(this.importe);
    this.elCuota.textContent = formatEur(details.cuotaFinal) + ' / mes';

    const taeBaseText = (details.taeBase * 100).toFixed(2);
    const taeFinalText = (details.taeFinal * 100).toFixed(2);

    this.elMeta.textContent = `TAE ${taeFinalText}% · ${this.meses} meses`;

    if (details.appliedRules.length > 0 && details.totalDiscount > 0) {
      const labels = details.appliedRules
        .map((rule) => rule.label || rule.id || 'Oferta')
        .join(' + ');
      this.elBreakdown.textContent = `Ofertas: ${labels} (TAE base ${taeBaseText}% -> ${taeFinalText}%)`;
    } else {
      this.elBreakdown.textContent = '';
    }

    if (details.insuranceIncluded) {
      const insuranceLabel = this.config.insurance.label || 'Seguro a todo riesgo';
      this.elInsurance.textContent = `${insuranceLabel}: incluido`;
    } else if (details.insuranceOneTimeAmount > 0) {
      const insuranceLabel = this.config.insurance.label || 'Seguro a todo riesgo';
      this.elInsurance.textContent = `${insuranceLabel}: ${formatEur(details.insuranceOneTimeAmount)} (pago unico)`;
    } else {
      this.elInsurance.textContent = '';
    }

    const pct =
      ((this.importe - this.config.amount.min) /
        (this.config.amount.max - this.config.amount.min || 1)) *
      100;

    this.elSliderWrap.style.setProperty('--sim-slider-scale', String(pct / 100));
  }

  abrirFormulario() {
    const details = this.getPricingDetails();

    const payload = {
      channelId: this.config.channelId,
      channelVersion: this.config.version,
      importe: this.importe,
      meses: this.meses,
      cuota: details.cuotaFinal,
      cuotaBase: details.cuotaBase,
      taeBase: details.taeBase,
      taeFinal: details.taeFinal,
      rules: details.appliedRules.map((rule) => rule.id || rule.label || 'rule'),
      insuranceIncluded: details.insuranceIncluded,
      insuranceLabel: this.config.insurance.label || 'Seguro a todo riesgo',
      insuranceOneTimeAmount: details.insuranceOneTimeAmount,
      sector: this.selectedSector,
      product: this.selectedProduct,
    };

    if (typeof this.options.onCTA === 'function') {
      this.options.onCTA(payload);
    } else {
      formManager.open(payload);
    }
  }
}

/* ---------------------------------------------------------
   Gestor del formulario de lead (singleton)
   --------------------------------------------------------- */
const formManager = (() => {
  let overlay = null;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'sim-form-overlay';
    overlay.innerHTML = `
      <div class="sim-form-panel">
        <button class="sim-form-close" aria-label="Cerrar">&times;</button>

        <div class="sim-form-confirm">
          <span class="sim-form-confirm__icon">&#10003;</span>
          <div class="sim-form-confirm__title">Solicitud enviada</div>
          <p class="sim-form-confirm__text">
            Nos pondremos en contacto contigo en breve para continuar con tu solicitud de renting.
          </p>
        </div>

        <div class="sim-form-body">
          <div class="sim-form-title">Me interesa este renting</div>
          <p class="sim-form-subtitle">Completa tus datos y te contactaremos sin compromiso.</p>

          <div class="sim-form-summary">
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-importe>-</span>
              <span class="sim-form-summary__label">Importe</span>
            </div>
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-meses>-</span>
              <span class="sim-form-summary__label">Plazo</span>
            </div>
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-cuota>-</span>
              <span class="sim-form-summary__label">Cuota / mes</span>
            </div>
          </div>

          <form class="sim-form-fields" novalidate data-sim-form>
            <div class="sim-form-group">
              <label for="sim-nombre">Nombre completo *</label>
              <input type="text" id="sim-nombre" name="nombre" placeholder="Tu nombre" required />
            </div>
            <div class="sim-form-group">
              <label for="sim-email">Email *</label>
              <input type="email" id="sim-email" name="email" placeholder="tu@email.com" required />
            </div>
            <div class="sim-form-group">
              <label for="sim-telefono">Telefono *</label>
              <input type="tel" id="sim-telefono" name="telefono" placeholder="600 000 000" required />
            </div>
            <div class="sim-form-group">
              <label for="sim-comentario">Comentario (opcional)</label>
              <textarea id="sim-comentario" name="comentario" placeholder="Alguna duda o detalle adicional?"></textarea>
            </div>
            <button type="submit" class="sim-form-submit">Enviar solicitud</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.sim-form-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });

    overlay.querySelector('[data-sim-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = Object.fromEntries(new FormData(event.target));
      console.log('[Simulador] Lead capturado:', {
        ...formData,
        ...overlay._simulationData,
      });
      showConfirmation();
    });
  }

  function open(simulationData) {
    if (!overlay) buildOverlay();

    overlay._simulationData = simulationData;

    overlay.querySelector('.sim-form-confirm').classList.remove('is-visible');
    overlay.querySelector('.sim-form-body').style.display = '';
    overlay.querySelector('[data-sim-form]').reset();

    overlay.querySelector('[data-form-importe]').textContent = formatEur(simulationData.importe);
    overlay.querySelector('[data-form-meses]').textContent = simulationData.meses + ' meses';
    overlay.querySelector('[data-form-cuota]').textContent = formatEur(simulationData.cuota);

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showConfirmation() {
    overlay.querySelector('.sim-form-body').style.display = 'none';
    overlay.querySelector('.sim-form-confirm').classList.add('is-visible');
    setTimeout(close, 3000);
  }

  return { open, close };
})();

/* ---------------------------------------------------------
   Gestor del modal del simulador
   --------------------------------------------------------- */
const modalManager = (() => {
  let overlay = null;
  let viewSim = null;
  let viewForm = null;
  let simulatorInstance = null;

  const formHTML = `
    <div class="sim-modal-form">
      <button class="sim-back-btn" data-back-btn>&#8592; Volver al simulador</button>

      <div class="sim-form-confirm">
        <span class="sim-form-confirm__icon">&#10003;</span>
        <div class="sim-form-confirm__title">Solicitud enviada</div>
        <p class="sim-form-confirm__text">
          Nos pondremos en contacto contigo en breve para continuar con tu solicitud de renting.
        </p>
      </div>

      <div class="sim-form-body">
        <div class="sim-form-title">Me interesa este renting</div>
        <p class="sim-form-subtitle">Completa tus datos y te contactaremos sin compromiso.</p>

        <div class="sim-form-summary">
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-importe>-</span>
            <span class="sim-form-summary__label">Importe</span>
          </div>
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-meses>-</span>
            <span class="sim-form-summary__label">Plazo</span>
          </div>
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-cuota>-</span>
            <span class="sim-form-summary__label">Cuota / mes</span>
          </div>
        </div>

        <form class="sim-form-fields" novalidate data-sim-form>
          <div class="sim-form-group">
            <label for="sim-modal-nombre">Nombre completo *</label>
            <input type="text" id="sim-modal-nombre" name="nombre" placeholder="Tu nombre" required />
          </div>
          <div class="sim-form-group">
            <label for="sim-modal-email">Email *</label>
            <input type="email" id="sim-modal-email" name="email" placeholder="tu@email.com" required />
          </div>
          <div class="sim-form-group">
            <label for="sim-modal-telefono">Telefono *</label>
            <input type="tel" id="sim-modal-telefono" name="telefono" placeholder="600 000 000" required />
          </div>
          <div class="sim-form-group">
            <label for="sim-modal-comentario">Comentario (opcional)</label>
            <textarea id="sim-modal-comentario" name="comentario" placeholder="Alguna duda o detalle adicional?"></textarea>
          </div>
          <button type="submit" class="sim-form-submit">Enviar solicitud</button>
        </form>
      </div>
    </div>
  `;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'sim-overlay';
    overlay.innerHTML = `
      <div class="sim-modal-panel">
        <button class="sim-modal-close" aria-label="Cerrar">&times;</button>
        <div class="sim-modal-view sim-modal-view--sim"></div>
        <div class="sim-modal-view sim-modal-view--form" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    viewSim = overlay.querySelector('.sim-modal-view--sim');
    viewForm = overlay.querySelector('.sim-modal-view--form');
    viewForm.innerHTML = formHTML;

    viewForm.querySelector('[data-back-btn]').addEventListener('click', showSim);

    viewForm.querySelector('[data-sim-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      console.log('[Simulador] Lead capturado:', {
        ...data,
        ...viewForm._simulationData,
      });
      showConfirmation();
    });

    overlay.querySelector('.sim-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  }

  function mountSimulator(channelId) {
    viewSim.innerHTML = '';
    simulatorInstance = new RentingSimulador(viewSim, {
      mode: 'modal',
      channel: channelId,
      onCTA: (payload) => showForm(payload),
    });
    return simulatorInstance;
  }

  function showSim() {
    viewForm.style.display = 'none';
    viewSim.style.display = '';
  }

  function showForm(payload) {
    viewForm._simulationData = payload;

    viewForm.querySelector('.sim-form-confirm').classList.remove('is-visible');
    viewForm.querySelector('.sim-form-body').style.display = '';
    viewForm.querySelector('[data-sim-form]').reset();

    viewForm.querySelector('[data-form-importe]').textContent = formatEur(payload.importe);
    viewForm.querySelector('[data-form-meses]').textContent = payload.meses + ' meses';
    viewForm.querySelector('[data-form-cuota]').textContent = formatEur(payload.cuota);

    viewSim.style.display = 'none';
    viewForm.style.display = '';
  }

  function showConfirmation() {
    viewForm.querySelector('.sim-form-body').style.display = 'none';
    viewForm.querySelector('.sim-form-confirm').classList.add('is-visible');
    setTimeout(close, 3000);
  }

  function open(options = {}) {
    if (!overlay) buildOverlay();

    const channelId = options.channel || getChannelFromContext();
    mountSimulator(channelId);

    showSim();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  return { open, close };
})();

/* ---------------------------------------------------------
   Auto-init
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-simulador]').forEach((element) => {
    const channelId = element.dataset.canal || getChannelFromContext();
    new RentingSimulador(element, {
      mode: 'module',
      channel: channelId,
    });
  });

  document.querySelectorAll('[data-simulador-trigger]').forEach((button) => {
    button.addEventListener('click', () => {
      modalManager.open({ channel: button.dataset.canal || getChannelFromContext() });
    });
  });
});
