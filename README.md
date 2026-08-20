# Superclásico F5

Aplicación mobile-first para organizar y simular un amistoso de fútbol 5 entre Cerro Porteño y Olimpia. Los datos quedan guardados en el navegador mediante una capa de persistencia desacoplada.

## Iniciar localmente

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

## Validación

```bash
npm run lint
npm run build
npm test
```

## Arquitectura

- `app/`: entrada, metadatos y estilos globales.
- `components/`: navegación, formularios, planteles, cancha, simulación, estadísticas y premios.
- `data/`: jugadores ficticios para probar la app.
- `lib/storage.ts`: única puerta de acceso a `localStorage`, reemplazable por Supabase.
- `lib/simulationEngine.ts`: motor tipado y reproducible por seed.
- `lib/commentary.ts`: banco de relatos humorísticos.
- `lib/formations.ts`: coordenadas porcentuales de las formaciones.
- `types/`: contratos de jugadores, eventos y resultados.
