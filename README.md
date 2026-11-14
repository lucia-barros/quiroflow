# QUIROFLOW

Prototipo de coordinación perioperatoria para la rotación de Anestesiología de Prácticas de Tecnología Hospitalaria, cuarto curso de Ingeniería Biomédica en la Universidade de Vigo. El Hospital do Meixoeiro es el caso de estudio. Los seis pacientes, los cuatro quirófanos y el registro horario inicial pertenecen a una simulación académica.

## 1. Ejecutar en el ordenador

Instala Node.js 22.12 o posterior. Descomprime el proyecto, abre una terminal en la carpeta que contiene `package.json` y ejecuta estos comandos.

```bash
npm ci
npm run dev
```

Abre la URL local que aparece en la terminal. La página de inicio lleva a `/demo`. Usa el mismo navegador y perfil para abrir los monitores junto a la demo. El registro requiere un navegador actualizado en HTTPS o localhost y con almacenamiento local habilitado.

```bash
npm test          # Ejecuta las pruebas del recorrido y las métricas
npm run build     # Comprueba TypeScript y genera dist/
npm run preview   # Sirve el resultado de la compilación en local
```

Los recursos visuales y la tipografía se sirven con el proyecto. El escenario se guarda en el navegador. Al cambiar de origen, perfil o dispositivo, se abre una simulación independiente.

## 2. Vistas y código

| Ruta | Vista | Archivo |
| --- | --- | --- |
| `/demo` | Presentación, recorrido de 15 hitos, vista en directo y reinicio | `src/pages/DemoPage.tsx` |
| `/control` | Selección de paciente, confirmación de hitos, historial y limpieza | `src/pages/ControlPage.tsx` |
| `/espera/turnos` | Llamadas y destinos UMCA | `src/pages/PublicMonitors.tsx` |
| `/espera/estado` | Estado general por código y tiempo transcurrido configurable | `src/pages/PublicMonitors.tsx` |
| `/quirofanos` | Estado operativo de salas, avisos y limpieza | `src/pages/RoomsPage.tsx` |
| `/estadisticas` | Recuento, medias y observaciones de los tiempos simulados | `src/pages/StatsPage.tsx` |

| Archivo | Qué contiene |
| --- | --- |
| `src/domain/model.ts` | Tipos de pacientes, salas, eventos, solicitudes y proyección pública |
| `src/domain/config.ts` y `seed.ts` | Parámetros del escenario e historial ficticio inicial |
| `src/domain/workflow.ts` | Validación de transiciones y actualización de entidades |
| `src/domain/guide.ts` | Guion de la demo. Su progreso se reconstruye con los eventos guardados |
| `src/domain/projection.ts` | Selección de los campos y estados de sala de espera |
| `src/domain/metrics.ts` | Emparejamiento de hitos por caso y cálculo de intervalos completos |
| `src/data/` | Contratos, persistencia, sincronización y suscripción de los monitores |
| `src/components/` y `src/styles.css` | Componentes reutilizables, diseño y paleta |
| `tests/workflow.test.ts` | Pruebas de estados, autorización, circuitos alternativos y métricas |
| `scripts/build-routes.mjs` | Entradas HTML para abrir y recargar las rutas directamente en hosting estático |

### Cómo viaja un hito

1. El panel o la demo envía un comando a `MockDataAdapter`. El adaptador toma un bloqueo de escritura del navegador y comprueba que la pantalla trabaja sobre la última revisión.
2. El dominio valida el comando y registra un evento con identificador y hora en milisegundos. Actualiza por separado el estado del paciente, el estado de la sala y las solicitudes.
3. El adaptador guarda el estado interno y una proyección pública en claves separadas de LocalStorage. BroadcastChannel avisa a las pestañas del mismo origen y perfil. El evento `storage` también propaga cambios.
4. Las pantallas públicas leen la clave de proyección. Estadísticas consulta el historial interno. En un despliegue real, la separación de acceso se aplicaría en el servidor con controles de identidad y permisos.

### Cómo interpretar los colores

| Color | Familiares | Quirófanos |
| --- | --- | --- |
| Gris | En preparación | Preparación o confirmación pendiente |
| Rojo | En curso | Ocupado |
| Ámbar | Finalizando o en traslado | Finalizando. El pulso es un aviso anticipado |
| Verde | Llegada a REA o URPA confirmada | Sala vacía y limpieza pendiente |

La confirmación de acceso para traslado es un hito explícito. La salida confirmada genera el aviso que habilita el acceso de limpieza. Terminar la limpieza y confirmar que la sala está preparada son dos registros separados. La hora del monitor usa la zona de Vigo. Los cronómetros indican tiempo transcurrido.

## 3. Personalizar los datos y el aspecto

- **Pacientes y salas.** Edita `PATIENTS` y `ROOMS` en `src/domain/config.ts`. Para cambiar lo que se ve, modifica `code` y `label`. Si cambias un `id`, actualiza sus referencias en `seed.ts` y `DEMO_CASE`. Usa identificadores y códigos únicos.
- **Unidades UMCA.** Edita los nombres en `DESTINATIONS`. `DEMO_CASE.umcaId` indica el destino elegido por el guion.
- **Paleta.** Los colores base están en `:root` y los funcionales en `[data-tone]` dentro de `src/styles.css`. Los textos de estado están en `src/domain/labels.ts`.
- **Tiempos y ejemplos iniciales.** `seed.ts` aplica hitos válidos con desfases en minutos respecto al inicio del escenario. Cambia los desfases o los comandos conservando su orden cronológico. `DEFAULT_DISPLAYS` fija los cronómetros iniciales.
- **Aplicar cambios al escenario.** Después de editar los datos iniciales, usa **Reiniciar → Restablecer datos** en `/demo` para sustituir la sesión guardada por la nueva configuración.

## 4. Probar y presentar el recorrido

1. Abre `/demo`. En **Pantallas de la demostración**, abre Llamadas UMCA, Estado del paciente y Quirófanos en pestañas del mismo navegador. El caso guiado inicial es **C15**.
2. Pulsa **Registrar hito y avanzar**. Al llamar a C15 aparece en UMCA. Al confirmar la preparación aparece en la pantalla de familiares. Tras confirmar sala preparada y entrada, observa el rojo y el cronómetro.
3. Avanza hasta **Fin de intervención**. Comprueba el ámbar y la secuencia de solicitud y autorización de traslado. En **Salida de quirófano**, fíjate en el aviso de limpieza y en que la familia sigue viendo **Finalizando / Saliendo**.
4. Confirma **Llegada a URPA**. El estado familiar pasa a verde. Registra el inicio y fin de limpieza, la sala preparada y el alta de recuperación.
5. Abre **Estadísticas** para ver cómo los hitos completados incorporan observaciones. Los intervalos sin ambos hitos figuran como «Sin observaciones». Los tiempos pertenecen a la simulación.
6. Recarga una pestaña para comprobar la persistencia. En `/demo`, pulsa **Reiniciar → Restablecer datos** para empezar otra vez. Los ajustes y las pestañas abiertas vuelven al escenario inicial.

Para mostrar un circuito alternativo, entra en `/control`. Tras la entrada en quirófano, elige **Registrar circuito sin inducción** cuando corresponda en el supuesto simulado. Después de la salida, puedes confirmar llegada a **REA** o **URPA**, o abrir **Circuito alternativo** y registrar el destino ilustrativo. Si usas el caso C15 fuera del orden guiado, restablécelo antes de volver a la demo.

En la videollamada, puedes compartir la pestaña de `/demo` y usar **Vista en directo** para enseñar las tres respuestas a cada hito. Los monitores públicos tienen botón de pantalla completa para enseñarlos por separado.

## 5. Publicar desde GitHub

1. Descomprime el ZIP y crea un repositorio vacío en GitHub que admita Pages.
2. Desde la carpeta del proyecto, sustituye `TU_USUARIO` y el nombre del repositorio en el ejemplo.

   ```bash
   git init -b main
   git add .
   git commit -m "Versión inicial de QUIROFLOW"
   git remote add origin https://github.com/TU_USUARIO/quiroflow.git
   git push -u origin main
   ```

3. En GitHub, entra en **Settings → Pages → Build and deployment** y elige **GitHub Actions** como origen.
4. En **Actions**, abre **Publicar QUIROFLOW en GitHub Pages** y pulsa **Run workflow** en `main`. El workflow incluido instala dependencias, prueba el dominio, compila con el prefijo correcto del repositorio y publica `dist/`.
5. Abre la URL que indique **Settings → Pages**. Prueba un enlace directo a `espera/estado/` y el reinicio desde la demo. Esta publicación debe contener solo datos ficticios.

[Configuración de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Despliegue estático con Vite](https://vite.dev/guide/static-deploy)

## 6. Pasar de la simulación a un backend

El adaptador implementado es `MockDataAdapter`. `RealtimeDataAdapter` y `HospitalIntegrationAdapter` son contratos TypeScript para estudiar una evolución. Las vistas de espera tienen su propio contrato, `PublicDataAdapter`.

| Pieza | Trabajo para una posible implantación |
| --- | --- |
| Backend de QUIROFLOW | Validación de comandos y roles en servidor, registro transaccional de hitos y solicitudes, identificadores de operación para reintentos, control de revisiones y auditoría |
| Sincronización | Carga inicial por API autenticada y actualizaciones por SSE o WebSocket. Recuperación tras desconexión mediante la última revisión conocida |
| Proyección pública | Endpoint dedicado con campos permitidos, códigos de seguimiento temporales y reglas de visibilidad. La historia asistencial queda en el circuito autorizado |
| IANUS | Consultar con el SERGAS, que identifica IANUS como su historia clínica electrónica, qué hitos se podrían compartir, quién los confirma y qué interfaz de integración se podría autorizar |
| AVÍSAME y otros sistemas | Confirmar con informática del centro a qué herramienta se refiere la denominación, si participa en el circuito, quién la mantiene y si conviene interoperar con llamadas, traslados o gestión de salas |
| HL7 v2 y FHIR | Revisar versiones y perfiles admitidos en el entorno. Estudiar mensajes de movimiento en HL7 v2 y, como candidatos en FHIR, `Encounter` para el episodio, `Procedure` para la intervención y `Task` para las solicitudes. Acordar la correspondencia exacta de cada hito con el SERGAS |
| Validación | Revisar el circuito con anestesiología, enfermería, celadores, recuperación, limpieza e informática. Acordar permisos, seguridad, privacidad, contingencia y criterios de validación clínica antes de un piloto |

El contrato de integración deja la normalización de mensajes en servidor. Cada fuente externa tendría que aportar una identificación deduplicable y una referencia temporal. Las interfaces, permisos y fuentes de autoridad se confirmarían antes de programar un conector. El prototipo actual usa el reloj del navegador y registros ficticios.

[Descripción de IANUS por el SERGAS](https://www.sergas.gal/Asistencia-sanitaria/Consulta-Historia-Cl%C3%ADnica-e-Historial-Farmacoterap%C3%A9utico?idioma=es) · [Flujos de trabajo en FHIR R4](https://hl7.org/fhir/R4/workflow.html) · [Relación entre HL7 v2 y FHIR](https://fhir.hl7.org/fhir/comparison-v2.html)
