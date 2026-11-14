// Materializa las entradas para que los enlaces directos funcionen en hosting estático.
import { copyFile, mkdir } from 'node:fs/promises'

for (const route of ['demo', 'control', 'quirofanos', 'estadisticas', 'espera/turnos', 'espera/estado']) {
  const directory = new URL(`../dist/${route}/`, import.meta.url)
  await mkdir(directory, { recursive: true })
  await copyFile(new URL('../dist/index.html', import.meta.url), new URL('index.html', directory))
}
