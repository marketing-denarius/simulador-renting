# Configuracion por Canal

Este directorio contiene las configuraciones gestionables del simulador.

- `channels/*.json`: definicion de cada canal publicado o en borrador.
- El simulador consume configuracion desde `window.SIMULADOR_CONFIGS`.
- El script `scripts/build-channels.mjs` transforma estos JSON en assets para runtime/build-time.

## Minimos obligatorios

1. `amount`: min, max, step, default, milestones
2. `terms`: options, default

## Opcionales

1. `sector`
2. `products`
3. `offers`
4. `insurance`
5. `ui`

## Regla de visibilidad de sector (CMS)

- Para ocultar el selector de sector en un canal (por ejemplo, entorno de odontologos), usar:

```json
"sector": {
	"enabled": false,
	"default": "Dental",
	"options": ["Farmacia", "Dental", "Fisioterapia", "Veterinaria"]
}
```

- `enabled: false` oculta el campo en UI.
- `default` se mantiene como valor informativo para el lead.

## Regla de seguro "incluido" (CMS)

- El nombre comercial del seguro es `Seguro a todo riesgo`.
- Para marcarlo como regalo para el usuario:

```json
"insurance": {
	"enabled": true,
	"mode": "one_time_fixed",
	"amount": 0,
	"included": true,
	"label": "Seguro a todo riesgo"
}
```

- Si `included` es `true`, en UI se muestra `incluido`.
- Si `included` es `false` y `amount > 0`, se muestra el importe de pago unico.

## Publicacion

1. Editar JSON de canal
2. Ejecutar:

```bash
node scripts/build-channels.mjs
```

3. Esto actualiza `js/channel-configs.js` y crea salida build-time en `dist/channels/<channelId>/index.html`.
