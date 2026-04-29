# DDS — Denarius Design System

Sistema de diseño de Denarius Finance. Documentación de referencia para implementar interfaces consistentes.

**Figma sources:**
- Foundations: `l3h1fP5rmp7Gg6QB94nsDG`
- Components Core: `qP0UqWUCXP9O4foXuufXJ7`
- Icons: `4DwVypE58Y234PCgxAH4WA`

---

## Tipografía

### Familia
- **Primary:** Nunito Sans
- Token: `--typo/family/primary`

### Escala tipográfica — Mobile

Token base: `--typo/size-mobile/headings/{style}`

| Estilo       | Tamaño | Peso | Line Height | Letter Spacing | Token                              |
|--------------|--------|------|-------------|----------------|------------------------------------|
| XXL Title    | 44px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/xxl`  |
| XL Title     | 38px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/xl`   |
| L Title      | 32px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/l`    |
| M Title      | 26px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/m`    |
| S Title      | 22px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/s`    |
| XS Title     | 20px   | 700  | 1.2         | 0              | `--typo/size-mobile/headings/xs`   |

> El sistema tiene 3 variantes de escala: **Mobile**, **Desktop** y **Hybrid**.  
> Desktop siempre es mayor que Mobile. Usar el token `--typo/size-desktop/headings/{style}` para la variante desktop.

### Pesos tipográficos

| Token                  | Valor |
|------------------------|-------|
| `--typo/weight/bold`   | 700   |

### Ejemplo de uso

```css
.heading-xxl {
  font-family: var(--typo/family/primary, 'Nunito Sans', sans-serif);
  font-size: var(--typo/size-mobile/headings/xxl, 44px);
  font-weight: var(--typo/weight/bold, 700);
  line-height: 1.2;
}
```

---

## Colores

Token base: `--color/{grupo}/{shade}`

Cada grupo tiene shades del 50 al 950. El shade **500** es el valor de marca principal de cada color.

### Sky — Azul cian (color de apoyo)

| Shade | Hex       |
|-------|-----------|
| 50    | `#F2FFFF` |
| 100   | `#EDFFFF` |
| 200   | `#CEFAFE` |
| 300   | `#A3F4FD` |
| 400   | `#52EAFD` |
| **500** | **`#05D3F2`** |
| 600   | `#0BA8CB` |
| 700   | `#1E7EAD` |
| 800   | `#0B628E` |
| 900   | `#08415E` |
| 950   | `#053345` |

### Green — Éxito / Positivo

| Shade | Hex       |
|-------|-----------|
| 50    | `#ECF9F2` |
| 100   | `#D9F2E5` |
| 200   | `#B3E5CC` |
| 300   | `#9FDFBF` |
| 400   | `#79D2A6` |
| **500** | **`#40BF7F`** |
| 600   | `#39AC73` |
| 700   | `#309161` |
| 800   | `#26734C` |
| 900   | `#194D33` |
| 950   | `#113523` |

### Red — Error / Peligro

| Shade | Hex       |
|-------|-----------|
| 50    | `#FEE7E7` |
| 100   | `#FCCFCF` |
| 200   | `#FA9E9E` |
| 300   | `#F98686` |
| 400   | `#F76E6E` |
| **500** | **`#F64C4C`** |
| 600   | `#F20D0D` |
| 700   | `#C20A0A` |
| 800   | `#910808` |
| 900   | `#610505` |
| 950   | `#380000` |

### Amber — Advertencia

| Shade | Hex       |
|-------|-----------|
| 100   | `#FFEECC` |
| 200   | `#FFDD99` |
| 300   | `#FFD480` |
| 400   | `#FFC34C` |
| **500** | **`#FFB21A`** |
| 600   | `#F5A300` |
| 700   | `#CC8800` |
| 800   | `#996600` |
| 900   | `#664400` |
| 950   | `#432D00` |

### Silver — Neutro / Gris

| Shade | Hex       |
|-------|-----------|
| 50    | `#F8FAFC` |
| 200   | `#E2E8F0` |
| 300   | `#BBC6D5` |
| 400   | `#94A3B8` |
| **500** | **`#64748B`** |
| 600   | `#475569` |
| 700   | `#334155` |
| 800   | `#1E263B` |
| 900   | `#0F172A` |
| 950   | `#020617` |

### Gold — Acento cálido / Premium (color secundario de marca)

| Shade | Hex       |
|-------|-----------|
| 100   | `#F4EFE4` |
| 200   | `#E9DEC9` |
| 300   | `#DDCEAD` |
| 400   | `#D2BD92` |
| **500** | **`#C7AD77`** |
| 600   | `#9F8A5F` |
| 700   | `#776847` |
| 800   | `#50462F` |
| 900   | `#282318` |
| 950   | `#14110C` |

### Tile — Verde azulado (color primario de marca)

| Shade | Hex       |
|-------|-----------|
| 100   | `#D0E4E7` |
| 200   | `#A1C9CF` |
| 300   | `#71AEB7` |
| 400   | `#42939F` |
| **500** | **`#0E7787`** |
| 600   | `#0F606C` |
| 700   | `#0B4851` |
| 800   | `#083036` |
| 900   | `#062428` |
| 950   | `#020C0D` |

### Tokens semánticos confirmados

| Token                     | Valor     | Uso                          |
|---------------------------|-----------|------------------------------|
| `--color/text/default`    | `#1E263B` | Texto principal              |

---

## Espaciado

Token base: `--spacing-{n}`

Valores confirmados en uso en componentes: `8`, `10`, `12`, `16`, `20`, `24`.

```css
/* Ejemplo */
padding: var(--spacing-16, 16px) var(--spacing-24, 24px);
```

---

## Componentes

### Standard Button

El componente de botón principal. Disponible en 4 tipos, 5 tamaños y 6 estados.

**Tipos:**
- `Primary` — Acción principal
- `Secondary` — Acción secundaria
- `Primary-light` — Variante clara del primario
- `Transparent` — Sin fondo, solo texto

**Tamaños:**

| Tamaño        | Dimensiones |
|---------------|-------------|
| Large         | 163 × 48px  |
| Medium        | 139 × 44px  |
| Small         | 133 × 36px  |
| Extra Small   | 118 × 32px  |
| Extra Extra Small | 114 × 28px |

**Estados:** Default, Hover, Pressed, Focused, Disabled, Loading

---

### Icon Button

Botón cuadrado que contiene solo un ícono.

**Tipos:** Primary, Primary-light, Accent, Success, Warning, Error, Info

**Tamaños:**

| Tamaño      | Dimensiones |
|-------------|-------------|
| Large       | 40 × 40px   |
| Medium      | 32 × 32px   |
| Small       | 24 × 24px   |
| Extra Small | 16 × 16px   |

**Estados:** Default, Hover, Pressed, Focus, Disabled

---

### Click-n-go Button

Botón de acción rápida con área táctil grande. Usado para acciones de navegación o acceso rápido.

**Tipos:**

| Tipo    | Dimensiones |
|---------|-------------|
| Basic   | 125 × 80px  |
| User    | 117 × 92px  |
| Dashed  | 117 × 92px  |

**Estados:** Default, Hover, Pressed, Focused, Disabled

---

### Tool Button

Botón cuadrado grande con ícono y etiqueta, orientado a acciones de herramienta.

**Variantes de estilo:** Primary, Primary-light

**Tamaños:**

| Tamaño  | Dimensiones |
|---------|-------------|
| Medium  | 88 × 88px   |
| Small   | 80 × 84px   |

**Estados:** Default, Hover, Pressed, Focused, Disabled

---

## Iconos

El archivo de Icons contiene las siguientes categorías:

### Flags
Íconos de banderas de países, 24 × 24px.

Ejemplos: `AF`, `AX`, `BO`, `BQ`, `CU`, `GM`, `GE`, `HR`, `IL`, `IT`, `ML`, `MT`, `NF`, `SR`, `SV` y más de 200 países.

---

## Convenciones de tokens

| Tipo          | Patrón                                              |
|---------------|-----------------------------------------------------|
| Color         | `--color/{grupo}/{shade}`                           |
| Tipografía    | `--typo/family/primary`                             |
| Tamaño tipo   | `--typo/size-mobile/headings/{xxl\|xl\|l\|m\|s\|xs}` |
| Peso tipo     | `--typo/weight/{bold\|...}`                         |
| Espaciado     | `--spacing-{n}`                                     |

---

## Accesibilidad

Los colores del sistema incluyen indicadores de nivel de contraste WCAG (AAA, AA) integrados en el archivo Foundations. Al elegir combinaciones de color, verificar que el nivel sea al menos **AA** para texto normal y **AAA** para texto pequeño.

---

## Notas de implementación

- Los tokens de CSS usan `/` como separador de namespace (ej. `--color/tile/500`). En entornos donde `/` cause conflictos, escapar o reemplazar por `-`.
- El archivo Components Core contiene más páginas más allá de botones (cards, forms, navigation, etc.) — explorar las páginas del archivo para el catálogo completo.
- El sistema tiene soporte para **modo oscuro** implícito vía tokens semánticos.
