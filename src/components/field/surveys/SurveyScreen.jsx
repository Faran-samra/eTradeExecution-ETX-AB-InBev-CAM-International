import { useRef } from 'react';
import { T } from '../../../lib/constants.jsx'; // T kept for durationColor
import PriceSurvey    from './PriceSurvey.jsx';
import InventorySurvey from './InventorySurvey.jsx';
import CoolerSurvey   from './CoolerSurvey.jsx';
import GenericSurvey  from './GenericSurvey.jsx';

/* Formatea segundos → "2m 15s" o "1h 3m" */
export function fmtSeconds(sec) {
  if (!sec || sec < 0) return '—';
  if (sec < 60)  return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60)   return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

/* Color semáforo según duración */
export function durationColor(sec) {
  if (!sec) return T.textLow;
  if (sec <  600) return T.success;  // < 10 min  → verde
  if (sec < 1500) return T.warn;     // < 25 min  → amarillo
  if (sec < 2700) return '#E07B2A';  // < 45 min  → naranja
  return T.danger;                    // > 45 min  → rojo
}

export default function SurveyScreen({ kind, pdv, user, onBack, onComplete }) {
  const startedAtRef  = useRef(new Date().toISOString());


  // Props comunes para todos los surveys
  const sharedProps = {
    pdv, user, onBack, onComplete,
    startedAt: startedAtRef.current,
  };

  return (
    <div style={{ width: '100%' }}>

      {kind === 'precios'    && <PriceSurvey    {...sharedProps} />}
      {kind === 'inventario' && <InventorySurvey {...sharedProps} />}
      {kind === 'neveras'    && <CoolerSurvey    {...sharedProps} />}
      {!['precios','inventario','neveras'].includes(kind) &&
        <GenericSurvey kind={kind} {...sharedProps} />}
    </div>
  );
}
