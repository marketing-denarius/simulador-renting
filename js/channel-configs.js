window.SIMULADOR_CONFIGS = {
  "default": {
    "schemaVersion": "1.0",
    "channelId": "default",
    "version": "1.0.0",
    "status": "published",
    "finance": {
      "tae": 0.0699
    },
    "amount": {
      "min": 0,
      "max": 150000,
      "step": 1000,
      "default": 75000,
      "milestones": [
        0,
        50000,
        100000,
        150000
      ]
    },
    "terms": {
      "options": [
        12,
        24,
        36,
        48,
        60
      ],
      "default": 36
    },
    "sector": {
      "enabled": true,
      "label": "Sector",
      "default": "Farmacia",
      "options": [
        "Farmacia",
        "Dental",
        "Fisioterapia",
        "Veterinaria"
      ]
    },
    "products": {
      "enabled": true,
      "label": "Producto",
      "default": "Equipamiento esencial",
      "options": [
        "Equipamiento esencial",
        "Equipamiento premium",
        "Mobiliario"
      ]
    },
    "offers": {
      "enabled": false,
      "maxStackedDiscount": 0.02,
      "rules": []
    },
    "insurance": {
      "enabled": false,
      "mode": "one_time_fixed",
      "amount": 0,
      "included": false,
      "label": "Seguro a todo riesgo"
    },
    "ui": {
      "title": "Simulador de Cuotas de Renting",
      "ctaLabel": "Me interesa ->"
    }
  },
  "dental_plus": {
    "schemaVersion": "1.0",
    "channelId": "dental_plus",
    "version": "1.0.0",
    "status": "published",
    "finance": {
      "tae": 0.065
    },
    "amount": {
      "min": 5000,
      "max": 120000,
      "step": 1000,
      "default": 50000,
      "milestones": [
        5000,
        30000,
        60000,
        90000,
        120000
      ]
    },
    "terms": {
      "options": [
        24,
        36,
        48,
        60
      ],
      "default": 48
    },
    "sector": {
      "enabled": false,
      "label": "Sector",
      "default": "Dental",
      "options": [
        "Farmacia",
        "Dental",
        "Fisioterapia",
        "Veterinaria"
      ]
    },
    "products": {
      "enabled": true,
      "label": "Producto",
      "default": "Equipamiento premium",
      "options": [
        "Equipamiento esencial",
        "Equipamiento premium"
      ]
    },
    "offers": {
      "enabled": true,
      "maxStackedDiscount": 0.02,
      "rules": [
        {
          "id": "dental-volume",
          "label": "Descuento por volumen",
          "priority": 100,
          "stackable": true,
          "conditions": {
            "minAmount": 70000,
            "minTerm": 36
          },
          "discount": {
            "type": "tae_delta",
            "value": 0.006
          }
        }
      ]
    },
    "insurance": {
      "enabled": true,
      "mode": "one_time_fixed",
      "amount": 0,
      "included": true,
      "label": "Seguro a todo riesgo"
    },
    "ui": {
      "title": "Simulador Renting Dental+",
      "ctaLabel": "Solicitar propuesta ->"
    }
  }
};
