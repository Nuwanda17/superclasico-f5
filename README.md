# SUPERCLÁSICO F5

La previa digital, social y mobile-first del partido entre amigos: Cerro Porteño vs Olimpia. Cada visitante entra sin login visible, crea su jugador, evalúa a sus compañeros y ve en tiempo real convocados, cartas, formaciones y resultados compartidos.

## Iniciar localmente

Requiere Node.js 22.13 o superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

En Windows PowerShell, el segundo comando es:

```powershell
Copy-Item .env.example .env.local
```

Abrí `http://localhost:3000` o `http://localhost:3000/match/superclasico-f5`.

## Configurar Supabase

1. Creá una cuenta en [Supabase](https://supabase.com/) y luego un proyecto nuevo.
2. En el dashboard del proyecto, abrí **Project Settings → API**.
3. Copiá **Project URL**.
4. Copiá la **Publishable key**. No uses ni copies la `service_role` key en este proyecto.
5. Copiá `.env.example` como `.env.local` y completá:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
   ```

6. Abrí **SQL Editor → New query**, pegá el contenido completo de `supabase/setup.sql` y ejecutalo una sola vez. El script crea el partido `superclasico-f5`, tablas, índices, validaciones, RLS y publicación Realtime.
7. Abrí **Authentication → Providers → Anonymous Sign-Ins** y habilitá los accesos anónimos.
8. Reiniciá `npm run dev` después de modificar `.env.local`.
9. Probá la URL en dos navegadores o en una ventana normal y una incógnita. Cada uno tendrá una identidad anónima distinta, pero ambos verán la misma sala.

Si faltan credenciales, la aplicación muestra una pantalla de configuración y no inventa datos. El botón **Cargar datos demo** solo aparece durante desarrollo y nunca sube los jugadores ficticios a Supabase.

## Logos de equipos

Colocá exactamente estos archivos:

```text
public/logos/cerro-porteno.png
public/logos/olimpia.png
```

Se recomienda PNG transparente, cuadrado, de al menos 512×512, buena calidad y sin márgenes gigantes. La aplicación usa `object-contain`; si un archivo todavía no existe muestra un círculo con `C` u `O` y continúa funcionando.

## Probar desde dos dispositivos

1. Conectá la computadora y los teléfonos a la misma red Wi‑Fi.
2. Iniciá el servidor accesible en la red:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

3. Buscá la IP local de la computadora (`ipconfig` en Windows).
4. Abrí `http://IP-DE-TU-PC:3000/match/superclasico-f5` en cada teléfono.
5. Creá un jugador en el primero y verificá que aparezca sin recargar en el segundo. Luego emití tres evaluaciones desde tres sesiones distintas para revelar la carta.

Para compartir fuera de tu Wi‑Fi necesitás desplegar la aplicación en una URL pública y configurar allí las mismas variables de entorno.

## Validación

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm test
npm run build
```

Las pruebas unitarias cubren validación de nombres y dorsales, ratings, OVR, alineaciones y 1.000 simulaciones con semillas distintas. Las pruebas de integración renderizan la salida compilada y revisan que la persistencia compartida y RLS sigan presentes.

## Arquitectura

- `app/`: App Router, tipografías Inter/Bebas Neue, metadatos y rutas `/` y `/match/[slug]`.
- `components/`: experiencia social, scouting, cartas, cancha existente, relato, estadísticas, premios y compartir.
- `hooks/useMatchRoom.ts`: estado de sala, autenticación anónima, mutaciones seguras, offline/retry y ciclo de Realtime.
- `lib/socialRepository.ts`: única puerta de datos compartidos; concentra consultas y mensajes de error de Supabase.
- `lib/supabase/`: clientes browser/server preparados para la arquitectura actual.
- `lib/ratings.ts`: OVR ponderado y traducción de promedios 1–10 a los atributos del motor.
- `lib/simulationEngine.ts`: motor existente, reproducible y ahora alimentado por scouting comunitario.
- `lib/commentary.ts`: banco amplio de relatos humorísticos personalizados.
- `lib/formations.ts`: coordenadas porcentuales de las formaciones conservadas.
- `lib/preferences.ts`: solamente preferencias locales de tab y velocidad; no contiene datos compartidos.
- `data/demoPlayers.ts` y `data/demoRoom.ts`: datos ficticios aislados para desarrollo.
- `supabase/setup.sql`: instalación completa; `supabase/migrations/` conserva la migración equivalente.
- `types/`: contratos tipados de jugadores, sala, ratings, eventos y resultados.

## Seguridad y privacidad

Los votos individuales no tienen política pública de lectura: cada votante solo puede leer y editar su propia papeleta. La interfaz compartida consulta una tabla de resúmenes que mantiene los promedios en `NULL` hasta llegar a tres scouts. RLS, triggers, `UNIQUE (voter_user_id, target_player_id)` y validaciones del servidor bloquean votos duplicados, autoevaluaciones y alineaciones inconsistentes. No se incluye ninguna clave real ni `service_role` en el repositorio.

## Migración desde la versión local

No existe importación automática de `localStorage`. Los datos viejos o demo no se envían a Supabase sin una acción deliberada. La nueva fuente de verdad para jugadores, ratings, formaciones y resultados es Supabase; `localStorage` queda limitado a preferencias visuales locales.
