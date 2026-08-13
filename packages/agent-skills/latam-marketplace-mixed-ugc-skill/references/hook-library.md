<!-- Reconstructed from SKILL.md context; not an original creative platform side file. -->

# LatAm Marketplace Hook Library

Use this bank to adapt the scene-1 hook and overlay for Spanish-language
marketplace ads. Keep the locked structure from `SKILL.md`: address a local
in-group, promise one convenience payoff, and remove one friction.

## Locked Formula

Spoken hook:

`Si vives en [country/region], te muestro como [convenience verb] sin [friction].`

Two-line hook overlay:

`[Verb action]\n[without friction] [country flag emoji]`

Default placement is top of frame at `position_y_ratio: 0.08`, style
`outlined`, duration about 3 seconds. Inspect the first frame: if the
presenter's head intrudes into the top 18 percent, move the overlay to bottom
at `position_y_ratio: 0.92`. Never overlap the face.

## Convenience Attributes

Pick exactly one for the opening.

| Attribute                | Spoken payoff                       | Overlay shape                                   |
| ------------------------ | ----------------------------------- | ----------------------------------------------- |
| Fast nationwide shipping | `recibir de todo rapidito`          | `Compra de todo\ncon envio rapido [flag emoji]` |
| Weekly offers            | `pillar ofertas nuevas cada semana` | `Ofertas nuevas\ncada semana [flag emoji]`      |
| Secure payment           | `comprar tranquilo desde el celu`   | `Compra tranquilo\npago seguro [flag emoji]`    |
| Free shipping threshold  | `armar tu carrito sin pagar envio`  | `Arma tu carrito\nsin pagar envio [flag emoji]` |

Do not stack more than one attribute in the hook. Category breadth belongs in
scene 2.

## Country Swaps

### Chile

- Region: `Chile`, `Santiago`, `Valpo`, `Conce`
- Warm words: `rapidito`, `cositas`, `pa' la casa`
- URL speech: `.cl` becomes `punto cele`
- Flag emoji: `🇨🇱`

Examples:

- `Si vives en Chile, te muestro como comprar de todo sin salir de la casa.`
- `Si estas en Santiago, te muestro como armar tu carrito sin pelear con el mall.`
- `Compra de todo\nsin salir de casa 🇨🇱`

### Mexico

- Region: `Mexico`, `CDMX`, `Guadalajara`, `Monterrey`
- Warm words: `ahorita`, `chido`, `cositas para la casa`
- URL speech: `.mx` becomes `punto eme equis`; `.com.mx` becomes `punto com punto eme equis`
- Flag emoji: `🇲🇽`

Examples:

- `Si vives en Mexico, te muestro como pedir de todo sin salir de casa.`
- `Si estas en CDMX, te cuento donde ver ofertas chidas sin dar vueltas.`
- `Pide de todo\nsin salir de casa 🇲🇽`

### Colombia

- Region: `Colombia`, `Bogota`, `Medellin`, `Cali`
- Warm words: `chevere`, `para la casa`, `sin tanto lio`
- URL speech: `.co` becomes `punto co`
- Flag emoji: `🇨🇴`

Examples:

- `Si estas en Bogota, te muestro como comprar de todo sin tanto lio.`
- `Si vives en Colombia, mira esta forma chevere de pedir para la casa.`
- `Compra facil\nsin tanto lio 🇨🇴`

### Argentina

- Region: `Argentina`, `Buenos Aires`, `Cordoba`, `Rosario`
- Warm words: `rapidito`, `cositas`, `sin moverte`
- URL speech: `.com.ar` becomes `punto com punto ar`
- Flag emoji: `🇦🇷`

Examples:

- `Si vivis en Argentina, te muestro como comprar de todo sin moverte.`
- `Si estas en Buenos Aires, mira como armar tu carrito rapidito.`
- `Compra de todo\nsin moverte 🇦🇷`

### Peru

- Region: `Peru`, `Lima`, `Arequipa`, `Trujillo`
- Warm words: `facilito`, `para la casa`, `sin salir`
- URL speech: `.pe` becomes `punto pe`
- Flag emoji: `🇵🇪`

Examples:

- `Si vives en Peru, te muestro como pedir de todo facilito.`
- `Si estas en Lima, mira como comprar para la casa sin salir.`
- `Pide de todo\nfacilito 🇵🇪`

## Scene 2 Category Breath

Use 4-5 categories in one sentence, with one unexpected category at the end:

- `Tienen ropa, hogar, tecnologia, mascotas y hasta cositas para regalar.`
- `Hay electro, moda, cocina, deco y juguetes para los peques.`
- `Encuentras belleza, hogar, tech, mascotas y ofertas nuevas cada semana.`

Keep the sentence short enough for a 6-second VO scene.

## CTA Imperatives

Use low-friction present-tense actions:

- `armen su carrito`
- `miren las ofertas`
- `pidan el suyo`
- `revisen lo nuevo`
- `guarden la pagina`

Avoid `compren` alone. Pair purchase language with a softer action.
