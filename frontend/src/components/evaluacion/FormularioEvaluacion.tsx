import { useState } from 'react';
import { DEMO_DATA } from '../../data/demoData';
import type { EvaluacionInput } from '../../api/evaluacion';

interface Props {
  onSubmit: (data: EvaluacionInput) => void;
  onDemo: () => void;
}

export function FormularioEvaluacion({ onSubmit, onDemo }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));
  };

  const handleDemo = () => {
    setForm(DEMO_DATA);
    onDemo();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      apellidos_nombre: form.apellidos_nombre || '',
      historia_clinica: form.historia_clinica || '',
      dni: form.dni || '',
      fecha_nacimiento: form.fecha_nacimiento || '',
      telefono: form.telefono || '',
      direccion: form.direccion || '',
      edad: form.edad || '',
      sexo: form.sexo || '',
      dolor_pecho: form.dolor_pecho || '',
      presion_arterial: form.presion_arterial || '',
      colesterol: form.colesterol || '',
      glucosa: form.glucosa || '',
      resultado_ecg: form.resultado_ecg || '',
      frecuencia_cardiaca_max: form.frecuencia_cardiaca_max || '',
      angina: form.angina || '',
      depresion_st: form.depresion_st || '',
      pendiente_st: form.pendiente_st || '',
      numero_vasos: form.numero_vasos || '',
      thalassemia: form.thalassemia || '',
    };
    onSubmit(data as EvaluacionInput);
  };

  return (
    <div className="card shadow">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0"><i className="bi bi-clipboard-pulse"></i> Evaluación de Riesgo Cardíaco</h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <h5 className="border-bottom pb-2 mb-3">Datos Generales del Paciente</h5>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Apellidos y Nombre</label>
              <input type="text" className="form-control" id="apellidos_nombre" value={form.apellidos_nombre || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Historia Clínica</label>
              <input type="text" className="form-control" id="historia_clinica" value={form.historia_clinica || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" pattern="[0-9]{8}" maxLength={8} value={form.dni || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-md-4">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" className="form-control" id="fecha_nacimiento" value={form.fecha_nacimiento || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Teléfono</label>
              <input type="text" className="form-control" id="telefono" pattern="[0-9]{9}" maxLength={9} value={form.telefono || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Dirección</label>
              <input type="text" className="form-control" id="direccion" value={form.direccion || ''} onChange={handleChange} required />
            </div>
          </div>

          <h5 className="border-bottom pb-2 mb-3">Parámetros Fisiológicos</h5>
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Edad</label>
              <input type="number" className="form-control" id="edad" min={1} max={120} value={form.edad || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Sexo</label>
              <select className="form-select" id="sexo" value={form.sexo || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="1">Masculino</option>
                <option value="0">Femenino</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Dolor de Pecho (CP)</label>
              <select className="form-select" id="dolor_pecho" value={form.dolor_pecho || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="0">Tipo 0</option>
                <option value="1">Tipo 1</option>
                <option value="2">Tipo 2</option>
                <option value="3">Tipo 3</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Presión Arterial (mmHg)</label>
              <input type="number" className="form-control" id="presion_arterial" value={form.presion_arterial || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Colesterol (mg/dl)</label>
              <input type="number" className="form-control" id="colesterol" step="0.1" value={form.colesterol || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Glucosa (FBS)</label>
              <select className="form-select" id="glucosa" value={form.glucosa || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="1">&gt; 120 mg/dl</option>
                <option value="0">&lt;= 120 mg/dl</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Resultado ECG</label>
              <select className="form-select" id="resultado_ecg" value={form.resultado_ecg || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="0">Normal</option>
                <option value="1">Anormalidad ST-T</option>
                <option value="2">Hipertrofia ventricular</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Frecuencia Cardíaca Máxima</label>
              <input type="number" className="form-control" id="frecuencia_cardiaca_max" value={form.frecuencia_cardiaca_max || ''} onChange={handleChange} required />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Angina Inducida</label>
              <select className="form-select" id="angina" value={form.angina || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Depresión Segmento ST</label>
              <input type="number" className="form-control" id="depresion_st" step="0.1" value={form.depresion_st || ''} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Pendiente Segmento ST</label>
              <select className="form-select" id="pendiente_st" value={form.pendiente_st || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="0">Descendente</option>
                <option value="1">Plana</option>
                <option value="2">Ascendente</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Número de Vasos</label>
              <select className="form-select" id="numero_vasos" value={form.numero_vasos || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-md-3">
              <label className="form-label">Thalassemia</label>
              <select className="form-select" id="thalassemia" value={form.thalassemia || ''} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                <option value="0">Normal</option>
                <option value="1">Defecto fijo</option>
                <option value="2">Defecto reversible</option>
                <option value="3">Otro</option>
              </select>
            </div>
          </div>
          <div className="text-center d-flex justify-content-center gap-2 flex-wrap">
            <button type="button" className="btn btn-outline-secondary btn-lg" onClick={handleDemo}>
              <i className="bi bi-play-circle"></i> Demo
            </button>
            <button type="submit" className="btn btn-primary btn-lg">Evaluar Riesgo</button>
          </div>
        </form>
      </div>
    </div>
  );
}
