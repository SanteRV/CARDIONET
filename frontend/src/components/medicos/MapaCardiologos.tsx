import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Medico } from '../../api/medicos';

// Fix icon por defecto de Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CENTRO_LIMA: [number, number] = [-12.0464, -77.0428];

interface Props {
  medicos: Medico[];
  medicoSeleccionadoId?: number;
  onMedicoSeleccionado?: (medico: Medico) => void;
}

export function MapaCardiologos({
  medicos,
  medicoSeleccionadoId,
  onMedicoSeleccionado,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onSelectRef = useRef(onMedicoSeleccionado);
  onSelectRef.current = onMedicoSeleccionado;

  const medicosConCoords = useMemo(
    () => medicos.filter((m) => m.latitud != null && m.longitud != null),
    [medicos]
  );
  const medicoSeleccionado = medicos.find((m) => m.id === medicoSeleccionadoId);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView(CENTRO_LIMA, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    const el = containerRef.current;
    const ro = el ? new ResizeObserver(() => map.invalidateSize()) : null;
    if (ro && el) ro.observe(el);
    return () => {
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const map = mapRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([] as L.LatLngTuple[]);
    medicosConCoords.forEach((m) => {
      const latLng: L.LatLngTuple = [m.latitud!, m.longitud!];
      const marker = L.marker(latLng)
        .addTo(map)
        .bindPopup(
          `<strong>${m.nombre}</strong><br/>${m.direccion_completa || m.ubicacion_consultorio || m.distrito || ''}${m.precio_visita ? `<br/><span class="text-primary">Precio: ${m.precio_visita}</span>` : ''}`
        );
      marker.on('click', () => onSelectRef.current?.(m));
      markersRef.current.push(marker);
      bounds.extend(latLng);
    });
    if (medicosConCoords.length === 1) {
      map.setView([medicosConCoords[0].latitud!, medicosConCoords[0].longitud!], 12);
    } else if (medicosConCoords.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [medicosConCoords]);

  useEffect(() => {
    if (medicoSeleccionado?.latitud != null && medicoSeleccionado?.longitud != null && mapRef.current) {
      mapRef.current.flyTo(
        [medicoSeleccionado.latitud, medicoSeleccionado.longitud],
        15,
        { duration: 2 }
      );
    }
  }, [medicoSeleccionado]);

  return (
    <div
      ref={containerRef}
      className="h-100 w-100 rounded"
      style={{ minHeight: '400px', height: '100%' }}
    />
  );
}
