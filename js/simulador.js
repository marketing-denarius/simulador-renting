/* =========================================================
   SIMULADOR DE CUOTAS DE RENTING
   ========================================================= */

const CONFIG = {
  TAE:    0.0699,
  MIN:    0,
  MAX:    150000,
  HITOS:  [0, 50000, 100000, 150000],
  PLAZOS: [12, 24, 36, 48, 60],
  DEFAULT_IMPORTE: 75000,
  DEFAULT_PLAZO:   36,
};

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
function formatEur(value) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' €';
}

function formatEurInt(value) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 0,
  }).format(value) + ' €';
}

function formatK(value) {
  return Math.round(value / 1000) + 'K';
}

function formatMilestone(value) {
  if (value === 0) return '0';
  return formatK(value);
}

/* ---------------------------------------------------------
   Fórmula PMT (amortización estándar)
   r  = TAE / 12
   PM = P × r × (1+r)^n / ((1+r)^n - 1)
   --------------------------------------------------------- */
function calcularCuota(importe, meses) {
  if (importe === 0) return 0;
  const r  = CONFIG.TAE / 12;
  const rn = Math.pow(1 + r, meses);
  return (importe * r * rn) / (rn - 1);
}

/* ---------------------------------------------------------
   Plantilla HTML del simulador
   --------------------------------------------------------- */
function renderTemplate(id) {
  const plazosHTML = CONFIG.PLAZOS.map(p =>
    `<button class="sim-plazo-btn${p === CONFIG.DEFAULT_PLAZO ? ' is-active' : ''}"
             data-plazo="${p}">${p}</button>`
  ).join('');

  const milestonesHTML = CONFIG.HITOS
    .filter(h => h >= CONFIG.MIN && h <= CONFIG.MAX)
    .map(h => {
      const pct = ((h - CONFIG.MIN) / (CONFIG.MAX - CONFIG.MIN)) * 100;
      return `
        <span class="sim-slider-milestone" style="left:${pct}%">
          <span class="sim-slider-milestone__label">${formatMilestone(h)}</span>
        </span>
      `;
    }).join('');

  const cuotaInicial = calcularCuota(CONFIG.DEFAULT_IMPORTE, CONFIG.DEFAULT_PLAZO);

  return `
    <div class="sim-module" id="${id}">
      <div class="sim-module__header">
        <span class="sim-module__title">Simulador de Cuotas de Renting</span>
      </div>
      <div class="sim-module__body">

        <!-- Left: importe -->
        <div class="sim-col-left">
          <div>
            <label class="sim-field-label" for="sim-sector-select-${id}">Sector</label>
            <div class="sim-select-wrap">
              <select class="sim-select" id="sim-sector-select-${id}" name="sector" data-sector>
                <option value="Farmacia">Farmacia</option>
                <option value="Dental">Dental</option>
                <option value="Fisioterapia">Fisioterapia</option>
                <option value="Veterinaria">Veterinaria</option>
              </select>
            </div>

            <label class="sim-field-label">¿Cuánto necesitas?</label>
            <div class="sim-importe-value" data-importe-display>
              ${formatEurInt(CONFIG.DEFAULT_IMPORTE)}
            </div>
            <div class="sim-slider-wrap">
              <input
                type="range"
                class="sim-slider"
                data-slider
                min="${CONFIG.MIN}"
                max="${CONFIG.MAX}"
                step="1000"
                value="${CONFIG.DEFAULT_IMPORTE}"
              />
              <div class="sim-slider-milestones" aria-hidden="true">
                ${milestonesHTML}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: plazo + resultado + CTA -->
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
              <div class="sim-result__cuota" data-cuota-display>
                ${formatEur(cuotaInicial)} / mes
              </div>
              <div class="sim-result__meta" data-meta-display>
                TAE ${(CONFIG.TAE * 100).toFixed(2)}% · ${CONFIG.DEFAULT_PLAZO} meses
              </div>
            </div>
          </div>

          <button class="sim-cta-btn" data-cta-btn>
            Me interesa &rarr;
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
    this.root    = rootEl;
    this.options = options;            // { mode: 'module' | 'modal' }
    this.importe = CONFIG.DEFAULT_IMPORTE;
    this.meses   = CONFIG.DEFAULT_PLAZO;
    this.uid     = 'sim-' + Math.random().toString(36).slice(2, 7);
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.actualizarUI();
  }

  render() {
    this.root.innerHTML = renderTemplate(this.uid);
    // Cache elements
    this.elImporte = this.root.querySelector('[data-importe-display]');
    this.elSlider  = this.root.querySelector('[data-slider]');
    this.elSliderWrap = this.root.querySelector('.sim-slider-wrap');
    this.elCuota   = this.root.querySelector('[data-cuota-display]');
    this.elMeta    = this.root.querySelector('[data-meta-display]');
    this.elPlazoGrp= this.root.querySelector('[data-plazo-group]');
    this.elCTA     = this.root.querySelector('[data-cta-btn]');
  }

  bindEvents() {
    // Slider → importe
    this.elSlider.addEventListener('input', (e) => {
      this.importe = parseInt(e.target.value, 10);
      this.actualizarUI();
    });

    // Plazo buttons
    this.elPlazoGrp.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plazo]');
      if (!btn) return;
      this.meses = parseInt(btn.dataset.plazo, 10);
      this.elPlazoGrp.querySelectorAll('[data-plazo]').forEach(b =>
        b.classList.toggle('is-active', b === btn)
      );
      this.actualizarUI();
    });

    // CTA → abrir formulario
    this.elCTA.addEventListener('click', () => this.abrirFormulario());
  }

  actualizarUI() {
    const cuota = calcularCuota(this.importe, this.meses);
    this.elImporte.textContent = formatEurInt(this.importe);
    this.elCuota.textContent   = formatEur(cuota) + ' / mes';
    this.elMeta.textContent    = `TAE ${(CONFIG.TAE * 100).toFixed(2)}% · ${this.meses} meses`;
    // Sync slider fill rail using CSS scale variable
    const pct = ((this.importe - CONFIG.MIN) / (CONFIG.MAX - CONFIG.MIN)) * 100;
    this.elSliderWrap.style.setProperty('--sim-slider-scale', String(pct / 100));
  }

  abrirFormulario() {
    const cuota = calcularCuota(this.importe, this.meses);
    const data  = { importe: this.importe, meses: this.meses, cuota };
    if (typeof this.options.onCTA === 'function') {
      this.options.onCTA(data);
    } else {
      formManager.open(data);
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

        <!-- Confirmación (oculta por defecto) -->
        <div class="sim-form-confirm">
          <span class="sim-form-confirm__icon">&#10003;</span>
          <div class="sim-form-confirm__title">¡Solicitud enviada!</div>
          <p class="sim-form-confirm__text">
            Nos pondremos en contacto contigo en breve para continuar con tu solicitud de renting.
          </p>
        </div>

        <!-- Formulario -->
        <div class="sim-form-body">
          <div class="sim-form-title">Me interesa este renting</div>
          <p class="sim-form-subtitle">Completa tus datos y te contactaremos sin compromiso.</p>

          <div class="sim-form-summary">
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-importe>—</span>
              <span class="sim-form-summary__label">Importe</span>
            </div>
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-meses>—</span>
              <span class="sim-form-summary__label">Plazo</span>
            </div>
            <div class="sim-form-summary__item">
              <span class="sim-form-summary__value" data-form-cuota>—</span>
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
              <label for="sim-telefono">Teléfono *</label>
              <input type="tel" id="sim-telefono" name="telefono" placeholder="600 000 000" required />
            </div>
            <div class="sim-form-group">
              <label for="sim-comentario">Comentario (opcional)</label>
              <textarea id="sim-comentario" name="comentario" placeholder="¿Alguna duda o detalle adicional?"></textarea>
            </div>
            <button type="submit" class="sim-form-submit">Enviar solicitud</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.sim-form-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // Form submit
    overlay.querySelector('[data-sim-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      console.log('[Simulador] Lead capturado:', data);
      showConfirmation();
    });
  }

  function open({ importe, meses, cuota }) {
    if (!overlay) buildOverlay();

    // Reset state
    overlay.querySelector('.sim-form-confirm').classList.remove('is-visible');
    overlay.querySelector('.sim-form-body').style.display = '';
    overlay.querySelector('[data-sim-form]').reset();

    // Fill summary
    overlay.querySelector('[data-form-importe]').textContent = formatEur(importe);
    overlay.querySelector('[data-form-meses]').textContent   = meses + ' meses';
    overlay.querySelector('[data-form-cuota]').textContent   = formatEur(cuota);

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
   Gestor del modal del simulador (dos vistas internas)
   --------------------------------------------------------- */
const modalManager = (() => {
  let overlay  = null;
  let viewSim  = null;
  let viewForm = null;

  const formHTML = `
    <div class="sim-modal-form">
      <button class="sim-back-btn" data-back-btn>&#8592; Volver al simulador</button>

      <!-- Confirmación (oculta por defecto) -->
      <div class="sim-form-confirm">
        <span class="sim-form-confirm__icon">&#10003;</span>
        <div class="sim-form-confirm__title">¡Solicitud enviada!</div>
        <p class="sim-form-confirm__text">
          Nos pondremos en contacto contigo en breve para continuar con tu solicitud de renting.
        </p>
      </div>

      <!-- Formulario -->
      <div class="sim-form-body">
        <div class="sim-form-title">Me interesa este renting</div>
        <p class="sim-form-subtitle">Completa tus datos y te contactaremos sin compromiso.</p>

        <div class="sim-form-summary">
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-importe>—</span>
            <span class="sim-form-summary__label">Importe</span>
          </div>
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-meses>—</span>
            <span class="sim-form-summary__label">Plazo</span>
          </div>
          <div class="sim-form-summary__item">
            <span class="sim-form-summary__value" data-form-cuota>—</span>
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
            <label for="sim-modal-telefono">Teléfono *</label>
            <input type="tel" id="sim-modal-telefono" name="telefono" placeholder="600 000 000" required />
          </div>
          <div class="sim-form-group">
            <label for="sim-modal-comentario">Comentario (opcional)</label>
            <textarea id="sim-modal-comentario" name="comentario" placeholder="¿Alguna duda o detalle adicional?"></textarea>
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

    viewSim  = overlay.querySelector('.sim-modal-view--sim');
    viewForm = overlay.querySelector('.sim-modal-view--form');

    // Inyectar formulario en la vista de form
    viewForm.innerHTML = formHTML;

    // Botón volver
    viewForm.querySelector('[data-back-btn]').addEventListener('click', showSim);

    // Form submit
    viewForm.querySelector('[data-sim-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      console.log('[Simulador] Lead capturado:', data);
      showConfirmation();
    });

    // Close handlers
    overlay.querySelector('.sim-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // Init simulador en la vista sim, pasando onCTA para cambiar de vista
    new RentingSimulador(viewSim, {
      mode: 'modal',
      onCTA: ({ importe, meses, cuota }) => showForm({ importe, meses, cuota }),
    });
  }

  function showSim() {
    viewForm.style.display = 'none';
    viewSim.style.display  = '';
  }

  function showForm({ importe, meses, cuota }) {
    // Reset form state
    viewForm.querySelector('.sim-form-confirm').classList.remove('is-visible');
    viewForm.querySelector('.sim-form-body').style.display = '';
    viewForm.querySelector('[data-sim-form]').reset();

    // Fill summary
    viewForm.querySelector('[data-form-importe]').textContent = formatEur(importe);
    viewForm.querySelector('[data-form-meses]').textContent   = meses + ' meses';
    viewForm.querySelector('[data-form-cuota]').textContent   = formatEur(cuota);

    viewSim.style.display  = 'none';
    viewForm.style.display = '';
  }

  function showConfirmation() {
    viewForm.querySelector('.sim-form-body').style.display = 'none';
    viewForm.querySelector('.sim-form-confirm').classList.add('is-visible');
    setTimeout(close, 3000);
  }

  function open() {
    if (!overlay) buildOverlay();
    // Siempre empezar en la vista del simulador
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
  // Módulos inline: <div data-simulador>
  document.querySelectorAll('[data-simulador]').forEach(el => {
    new RentingSimulador(el, { mode: 'module' });
  });

  // Triggers de modal: <button data-simulador-trigger>
  document.querySelectorAll('[data-simulador-trigger]').forEach(btn => {
    btn.addEventListener('click', () => modalManager.open());
  });
});
