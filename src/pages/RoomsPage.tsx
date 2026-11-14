import { BedDouble, Info } from 'lucide-react'
import { RoomGrid } from '../components/Rooms'
import { Feedback, PageTitle, StatusBadge, useAction } from '../components/ui'
import { useSimulation } from '../data/mockDataAdapter'
import { ROOM_LABELS } from '../domain/labels'

export default function RoomsPage() {
  const { state, record, initializationError } = useSimulation()
  const { busy, feedback, perform } = useAction()
  return <>
    <PageTitle title="Coordinación de quirófanos" eyebrow="PANTALLA INTERNA" icon={BedDouble}
      description="Disponibilidad de salas y confirmaciones para celadores y limpieza."
      action={<span className="summary-chip">{state.rooms.length} quirófanos simulados</span>} />
    <Feedback text={initializationError} />
    <Feedback {...feedback} />
    <RoomGrid state={state} busy={busy || Boolean(initializationError)} onAction={command => {
      void perform(() => record(command), 'Hito de sala registrado.')
    }} />
    <section className="legend-card card" aria-label="Leyenda operativa">
      <h2><Info size={19} aria-hidden="true" /> Cómo leer el monitor</h2>
      <div className="flex flex-wrap gap-2.5">
        {(['pending', 'occupied', 'finishing', 'clean_pending'] as const).map(status =>
          <StatusBadge key={status} status={ROOM_LABELS[status]} />,
        )}
      </div>
      <p>El ámbar anticipa un posible traslado. El acceso de celadores requiere autorización registrada. Al confirmar la salida se habilita el acceso de limpieza. Tras limpiar, el equipo confirma por separado que la sala está preparada.</p>
    </section>
  </>
}
