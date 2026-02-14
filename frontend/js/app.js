// #region agent log
fetch('http://127.0.0.1:7243/ingest/5c42552d-42aa-429f-abf0-fdb6656f3769',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:init',message:'app.js loaded',data:{href:location.href,hostname:location.hostname},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
// #endregion

// Detectar si estamos en producción o desarrollo
// Con Docker: frontend en :8080, nginx hace proxy de /api al backend (puerto 5000 interno)
// Sin Docker: frontend puede estar en :8080 (http.server) o :5000 (Flask). Si es :8080, backend en :5000.
const API_URL = (function() {
    const h = window.location.hostname;
    const p = window.location.port;
    const isLocal = h === 'localhost' || h === '127.0.0.1';
    const isNginxPort = p === '80' || p === '8080' || p === '' || p === '443';
    if (isLocal && isNginxPort) return '/api';  // Docker o nginx local: proxy /api
    if (isLocal && (p === '5000' || p === '5001')) return '/api';  // Flask sirve todo
    if (isLocal) return 'http://localhost:5000/api';  // Frontend separado (Live Server, etc.)
    return '/api';  // Producción: proxy nginx
})();

const TOKEN_KEY = 'cardionet_token';
const USER_KEY = 'cardionet_user';

// Almacenar el resultado de la evaluación para recomendaciones
let resultadoEvaluacion = null;

// --- Auth ---
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function getStoredUser() {
    try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    } catch { return null; }
}
function setStoredUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

function authHeaders() {
    const t = getToken();
    const h = { 'Content-Type': 'application/json' };
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
}

function actualizarNavbar() {
    const user = getStoredUser();
    const btnLogout = document.getElementById('btnLogout');
    const btnShowLogin = document.getElementById('btnShowLogin');
    const btnShowRegistro = document.getElementById('btnShowRegistro');
    const navbarUser = document.getElementById('navbarUser');
    if (!btnLogout || !btnShowLogin || !btnShowRegistro || !navbarUser) return;
    if (user) {
        const nom = user.email || 'Usuario';
        const rol = user.rol === 'medico' ? ' (Médico)' : '';
        navbarUser.textContent = nom + rol;
        navbarUser.style.display = 'inline';
        btnLogout.style.display = 'inline-block';
        btnShowLogin.style.display = 'none';
        btnShowRegistro.style.display = 'none';
    } else {
        navbarUser.style.display = 'none';
        btnLogout.style.display = 'none';
        btnShowLogin.style.display = 'inline-block';
        btnShowRegistro.style.display = 'inline-block';
    }
}

function mostrarSeccion(id) {
    ['landingSection', 'loginSection', 'registroPacienteSection', 'registroMedicoSection', 'mainContent', 'perfilMedicoSection'].forEach(sid => {
        const el = document.getElementById(sid);
        if (el) el.style.display = sid === id ? 'block' : 'none';
    });
}

function verificarSesionInicial() {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) {
        actualizarNavbar();
        mostrarSeccion('landingSection');
        return;
    }
    fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
        .then(r => {
            if (r.ok) {
                r.json().then(data => {
                    const u = { ...user, ...data.usuario };
                    setStoredUser(u);
                    actualizarNavbar();
                    if (u.rol === 'medico') {
                        mostrarSeccion('perfilMedicoSection');
                        cargarPerfilMedico();
                    } else {
                        mostrarSeccion('mainContent');
                    }
                });
            } else {
                clearToken();
                actualizarNavbar();
                mostrarSeccion('landingSection');
            }
        })
        .catch(() => {
            clearToken();
            actualizarNavbar();
            mostrarSeccion('landingSection');
        });
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (text == null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Mostrar notificación tipo toast (reemplazo de alert)
function mostrarNotificacion(mensaje, tipo) {
    tipo = tipo || 'error';
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `notification-toast ${tipo}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="toast-message">${escapeHtml(mensaje)}</span>
        <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
    `;
    const close = () => {
        toast.style.animation = 'slideInRight 0.2s ease-in reverse';
        setTimeout(() => toast.remove(), 200);
    };
    toast.querySelector('.toast-close').addEventListener('click', close);
    container.appendChild(toast);
    setTimeout(close, 5000);
}

// Botón Demo: rellena el formulario con datos de ejemplo
document.getElementById('btnDemo').addEventListener('click', () => {
    if (typeof DEMO_DATA === 'undefined') return;
    Object.keys(DEMO_DATA).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = DEMO_DATA[id];
            el.classList.remove('is-invalid');
        }
    });
    mostrarNotificacion('Datos de demo cargados. Pulse "Evaluar Riesgo" para ver el resultado.', 'info');
});

// Botón footer Ver médicos: muestra listado de cardiólogos
// #region agent log
(function(){
var el=document.getElementById('btnFooterVerMedicos');
var footer=document.querySelector('footer');
var data={btnExists:!!el,footerExists:!!footer,footerHTML:footer?footer.innerHTML.substring(0,200):null};
if(el){var r=el.getBoundingClientRect();var s=window.getComputedStyle(el);data.rect={top:r.top,left:r.left,width:r.width,height:r.height};data.display=s.display;data.visibility=s.visibility;}
fetch('http://127.0.0.1:7243/ingest/5c42552d-42aa-429f-abf0-fdb6656f3769',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:footerBtn',message:'footer button debug',data:data,timestamp:Date.now(),hypothesisId:'H2,H3,H4,H5'})}).catch(()=>{});
})();
// #endregion
var _btnFooter=document.getElementById('btnFooterVerMedicos');
if(_btnFooter)_btnFooter.addEventListener('click', () => {
    mostrarSeccion('mainContent');
    document.getElementById('formularioSection').style.display = 'none';
    document.getElementById('resultadoSection').style.display = 'none';
    document.getElementById('medicosSection').style.display = 'block';
    cargarTodosMedicos(1);
});

// Manejo del formulario de evaluación
document.getElementById('formularioEvaluacion').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mostrar loading
    mostrarLoading();

    // Recopilar datos del formulario
    const datos = {
        apellidos_nombre: document.getElementById('apellidos_nombre').value,
        historia_clinica: document.getElementById('historia_clinica').value,
        dni: document.getElementById('dni').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        edad: document.getElementById('edad').value,
        sexo: document.getElementById('sexo').value,
        dolor_pecho: document.getElementById('dolor_pecho').value,
        presion_arterial: document.getElementById('presion_arterial').value,
        colesterol: document.getElementById('colesterol').value,
        glucosa: document.getElementById('glucosa').value,
        resultado_ecg: document.getElementById('resultado_ecg').value,
        frecuencia_cardiaca_max: document.getElementById('frecuencia_cardiaca_max').value,
        angina: document.getElementById('angina').value,
        depresion_st: document.getElementById('depresion_st').value,
        pendiente_st: document.getElementById('pendiente_st').value,
        numero_vasos: document.getElementById('numero_vasos').value,
        thalassemia: document.getElementById('thalassemia').value
    };

    try {
        const response = await fetch(`${API_URL}/evaluacion`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        ocultarLoading();

        if (response.ok) {
            resultadoEvaluacion = resultado;  // Guardar para recomendaciones
            mostrarResultado(resultado);
        } else {
            mostrarNotificacion('Error: ' + (resultado.error || 'No se pudo realizar la evaluación'), 'error');
        }
    } catch (error) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión con el servidor: ' + error.message, 'error');
    }
});

// Mostrar resultado de la evaluación
function mostrarResultado(resultado) {
    document.getElementById('formularioSection').style.display = 'none';
    document.getElementById('resultadoSection').style.display = 'block';

    const header = document.getElementById('resultadoHeader');
    const mensaje = document.getElementById('mensajeResultado');
    const probabilidadInfo = document.getElementById('probabilidadInfo');
    const btnVerMedicos = document.getElementById('btnVerMedicos');

    const porcentaje = (resultado.probabilidad_riesgo * 100).toFixed(1);
    const porcentajeInt = Math.round(porcentaje);

    if (resultado.tiene_riesgo === 1) {
        header.classList.remove('bg-success');
        header.classList.add('bg-danger');
        mensaje.innerHTML = `
            <div class="alerta-riesgo">
                <i class="bi bi-exclamation-triangle-fill"></i> ${escapeHtml(resultado.mensaje)}
            </div>
        `;

        // Determinar color según porcentaje (gradiente verde -> amarillo -> rojo)
        const color = getColorByPercentage(porcentajeInt);

        // Barra minimalista de probabilidad
        probabilidadInfo.innerHTML = `
            <div class="probability-container">
                <div class="probability-label">
                    <span>Probabilidad según Random Forest</span>
                    <span>0% ━━━━━ 100%</span>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: 0%; background: ${color};" data-target="${porcentajeInt}"></div>
                </div>
                <div class="probability-percentage" style="color: ${color};">
                    ${porcentaje}%
                </div>
                <div class="probability-text text-danger">
                    Alto riesgo cardíaco detectado
                </div>
            </div>
            <p class="text-muted text-center mt-3">Se recomienda consultar con un cardiólogo especialista de inmediato.</p>

            <div class="chart-container mt-4">
                <h6 class="text-center mb-3">Análisis de Factores de Riesgo</h6>
                <canvas id="riskChart" style="max-height: 300px;"></canvas>
            </div>
        `;

        // Animar la barra
        setTimeout(() => {
            const fill = document.querySelector('.probability-fill');
            fill.style.width = `${porcentajeInt}%`;
        }, 100);

        crearGraficaRiesgo(resultado);
        btnVerMedicos.style.display = 'inline-block';
    } else {
        header.classList.remove('bg-danger');
        header.classList.add('bg-success');
        mensaje.innerHTML = `
            <div class="alerta-sin-riesgo">
                <i class="bi bi-check-circle-fill"></i> ${escapeHtml(resultado.mensaje)}
            </div>
        `;

        const color = getColorByPercentage(porcentajeInt);

        probabilidadInfo.innerHTML = `
            <div class="probability-container">
                <div class="probability-label">
                    <span>Probabilidad según Random Forest</span>
                    <span>0% ━━━━━ 100%</span>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill" style="width: 0%; background: ${color};" data-target="${porcentajeInt}"></div>
                </div>
                <div class="probability-percentage" style="color: ${color};">
                    ${porcentaje}%
                </div>
                <div class="probability-text text-success">
                    Bajo riesgo cardíaco
                </div>
            </div>
            <p class="text-muted text-center mt-3">Los parámetros evaluados están dentro de rangos saludables. Continúe con chequeos regulares.</p>

            <div class="chart-container mt-4">
                <h6 class="text-center mb-3">Análisis de Parámetros Evaluados</h6>
                <canvas id="riskChart" style="max-height: 300px;"></canvas>
            </div>
        `;

        // Animar la barra
        setTimeout(() => {
            const fill = document.querySelector('.probability-fill');
            fill.style.width = `${porcentajeInt}%`;
        }, 100);

        crearGraficaRiesgo(resultado);
        btnVerMedicos.style.display = 'none';
    }
}

// Función para obtener color según porcentaje (verde -> amarillo -> rojo)
function getColorByPercentage(percentage) {
    if (percentage < 30) {
        // Verde
        return '#28a745';
    } else if (percentage < 50) {
        // Verde-amarillo
        return '#5cb85c';
    } else if (percentage < 70) {
        // Amarillo-naranja
        return '#ffc107';
    } else if (percentage < 85) {
        // Naranja
        return '#fd7e14';
    } else {
        // Rojo
        return '#dc3545';
    }
}

// Crear gráfica de análisis con Chart.js usando feature_importances del modelo
function crearGraficaRiesgo(resultado) {
    const ctx = document.getElementById('riskChart');
    if (!ctx) return;

    if (window.riskChartInstance) {
        window.riskChartInstance.destroy();
    }

    const fi = resultado && resultado.feature_importances && resultado.feature_importances.length > 0
        ? resultado.feature_importances
        : [
            { nombre: 'Edad', importancia: 0.15 },
            { nombre: 'Colesterol', importancia: 0.13 },
            { nombre: 'Presión arterial', importancia: 0.12 },
            { nombre: 'Frecuencia cardíaca', importancia: 0.11 },
            { nombre: 'Resultado ECG', importancia: 0.10 },
            { nombre: 'Depresión ST', importancia: 0.09 }
        ];

    const labels = fi.map(f => f.nombre);
    const data = fi.map(f => Number((f.importancia * 100).toFixed(1)));
    const maxVal = Math.max(...data.map(Number), 1);
    const colors = fi.map((_, i) => `rgba(119, 27, 30, ${0.9 - i * 0.1})`);

    window.riskChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Importancia (%)',
                data: data,
                backgroundColor: colors,
                borderColor: 'rgba(119, 27, 30, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Factores más relevantes en la predicción',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.min(100, Math.ceil(maxVal * 1.2)),
                    title: { display: true, text: 'Importancia (%)' }
                }
            }
        }
    });
}

// Botón para ver médicos recomendados (basado en perfil del paciente)
document.getElementById('btnVerMedicos').addEventListener('click', async () => {
    mostrarLoading();

    try {
        // Obtener médicos recomendados según el perfil de riesgo
        const response = await fetch(`${API_URL}/medicos/recomendados`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                perfil_riesgo: resultadoEvaluacion.perfil_riesgo
            })
        });

        const resultado = await response.json();

        ocultarLoading();

        if (response.ok) {
            mostrarMedicosRecomendados(resultado);
        } else {
            mostrarNotificacion('Error: ' + (resultado.error || 'No se pudieron obtener los médicos recomendados'), 'error');
        }
    } catch (error) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión con el servidor: ' + error.message, 'error');
    }
});

// Mostrar médicos recomendados según el perfil del paciente
function mostrarMedicosRecomendados(resultado) {
    document.getElementById('resultadoSection').style.display = 'none';
    document.getElementById('medicosSection').style.display = 'block';

    const listaMedicos = document.getElementById('listaMedicos');
    const medicos = resultado.medicos;

    if (medicos.length === 0) {
        listaMedicos.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="bi bi-info-circle"></i> No se encontraron cardiólogos disponibles.
            </div>
        `;
        return;
    }

    // Mostrar información del perfil detectado (escapar para XSS)
    let html = `
        <div class="alert alert-info mb-4">
            <h6>Perfil Detectado: <strong>${escapeHtml(resultado.perfil_detectado)}</strong></h6>
            <p class="mb-0">Los siguientes cardiólogos están especializados en tu condición específica y tienen las mejores calificaciones.</p>
        </div>
    `;

    // Todos los recomendados tienen el badge (datos sanitizados)
    medicos.forEach((medico) => {
        const cal = Number(medico.calificacion) || 0;
        const estrellas = '★'.repeat(Math.floor(cal)) +
                         '☆'.repeat(5 - Math.floor(cal));

        const subespecialidad = medico.subespecialidad ?
            `<span class="badge bg-success me-2"><i class="bi bi-award-fill"></i> ${escapeHtml(medico.subespecialidad)}</span>` : '';

        const numOpiniones = medico.num_opiniones != null ? medico.num_opiniones : '';
        const precioVisita = medico.precio_visita ? escapeHtml(medico.precio_visita) : '';
        const direccionCompleta = medico.direccion_completa || medico.ubicacion_consultorio || '';
        html += `
            <div class="medico-card medico-recomendado" data-medico-id="${escapeHtml(String(medico.id))}">
                <span class="badge-recomendado"><i class="bi bi-star-fill"></i> Altamente Recomendado</span>
                <h5 class="mb-3"><i class="bi bi-person-badge-fill"></i> ${escapeHtml(medico.nombre)}</h5>
                <div class="mb-3">
                    <span class="badge bg-primary me-2">${escapeHtml(medico.especialidad || 'CARDIOLOGÍA')}</span>
                    ${subespecialidad}
                    <span class="badge" style="background-color: var(--primary-color);"><i class="bi bi-geo-fill"></i> ${escapeHtml(medico.region || medico.provincia)}</span>
                </div>
                <div class="calificacion mb-3">
                    ${estrellas} <span class="rating-number">${escapeHtml(cal.toFixed(1))}</span>
                    ${numOpiniones ? `<span class="text-muted ms-2">(${escapeHtml(String(numOpiniones))} opiniones)</span>` : ''}
                </div>
                ${precioVisita ? `<div class="info-medico"><i class="bi bi-cash-coin"></i> <strong>Visita:</strong> ${precioVisita}</div>` : ''}
                ${direccionCompleta ? `<div class="info-medico"><i class="bi bi-geo-alt-fill"></i> <strong>Dirección:</strong> ${escapeHtml(direccionCompleta)}</div>` : ''}
                <div class="info-medico">
                    <i class="bi bi-telephone-fill"></i>
                    <strong>Teléfono:</strong> ${escapeHtml(medico.telefono || 'No especificado')}
                </div>
                ${(medico.distrito || medico.provincia) ? `<div class="info-medico"><i class="bi bi-pin-map-fill"></i> <strong>Ubicación:</strong> ${escapeHtml([medico.distrito, medico.provincia].filter(Boolean).join(', '))}${medico.region ? ' - ' + escapeHtml(medico.region) : ''}</div>` : ''}
                ${(medico.latitud && medico.longitud) ? `<button type="button" class="btn btn-sm btn-outline-primary mt-2 btnVerMapa" data-medico-id="${medico.id}"><i class="bi bi-map"></i> Ver en mapa</button>` : ''}
            </div>
        `;
    });

    // Botón para ver todos los cardiólogos
    html += `
        <div class="text-center mt-4">
            <button id="btnVerTodosMedicos" class="btn btn-outline-primary btn-lg">
                Ver Todos los Cardiólogos Disponibles
            </button>
        </div>
    `;

    listaMedicos.innerHTML = html;

    // Agregar evento al nuevo botón
    document.getElementById('btnVerTodosMedicos').addEventListener('click', cargarTodosMedicos);
}

// Función para cargar todos los médicos (con paginación)
async function cargarTodosMedicos(page = 1) {
    mostrarLoading();

    try {
        const response = await fetch(`${API_URL}/medicos/todos?page=${page}&per_page=10`, { headers: authHeaders() });
        const resultado = await response.json();

        ocultarLoading();

        if (response.ok) {
            mostrarTodosMedicos(resultado);
        } else {
            mostrarNotificacion('Error: ' + (resultado.error || 'No se pudieron obtener los médicos'), 'error');
        }
    } catch (error) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión con el servidor: ' + error.message, 'error');
    }
}

// Mostrar todos los médicos con paginación
function mostrarTodosMedicos(resultado) {
    const listaMedicos = document.getElementById('listaMedicos');
    const medicos = resultado.medicos || [];
    const total = resultado.total || medicos.length;
    const page = resultado.page || 1;
    const perPage = resultado.per_page || 10;
    const totalPages = resultado.total_pages || Math.max(1, Math.ceil(total / perPage));

    let html = `
        <div class="alert alert-secondary mb-4">
            <h6>Todos los Cardiólogos Disponibles (${total})</h6>
            <p class="mb-0">Lista completa de cardiólogos ordenados por calificación. Página ${page} de ${totalPages}.</p>
        </div>
    `;

    medicos.forEach((medico) => {
        const cal = Number(medico.calificacion) || 0;
        const estrellas = '★'.repeat(Math.floor(cal)) +
                         '☆'.repeat(5 - Math.floor(cal));

        const subespecialidad = medico.subespecialidad ?
            `<span class="badge bg-success me-2"><i class="bi bi-award-fill"></i> ${escapeHtml(medico.subespecialidad)}</span>` : '';

        const numOpiniones = medico.num_opiniones != null ? medico.num_opiniones : '';
        const precioVisita = medico.precio_visita ? escapeHtml(medico.precio_visita) : '';
        const direccionCompleta = medico.direccion_completa || medico.ubicacion_consultorio || '';
        html += `
            <div class="medico-card" data-medico-id="${escapeHtml(String(medico.id))}">
                <h5 class="mb-3"><i class="bi bi-person-badge-fill"></i> ${escapeHtml(medico.nombre)}</h5>
                <div class="mb-3">
                    <span class="badge bg-primary me-2">${escapeHtml(medico.especialidad || 'CARDIOLOGÍA')}</span>
                    ${subespecialidad}
                    <span class="badge" style="background-color: var(--primary-color);"><i class="bi bi-geo-fill"></i> ${escapeHtml(medico.region || medico.provincia)}</span>
                </div>
                <div class="calificacion mb-3">
                    ${estrellas} <span class="rating-number">${escapeHtml(cal.toFixed(1))}</span>
                    ${numOpiniones ? `<span class="text-muted ms-2">(${escapeHtml(String(numOpiniones))} opiniones)</span>` : ''}
                </div>
                ${precioVisita ? `<div class="info-medico"><i class="bi bi-cash-coin"></i> <strong>Visita:</strong> ${precioVisita}</div>` : ''}
                ${direccionCompleta ? `<div class="info-medico"><i class="bi bi-geo-alt-fill"></i> <strong>Dirección:</strong> ${escapeHtml(direccionCompleta)}</div>` : ''}
                <div class="info-medico">
                    <i class="bi bi-telephone-fill"></i>
                    <strong>Teléfono:</strong> ${escapeHtml(medico.telefono || 'No especificado')}
                </div>
                ${(medico.distrito || medico.provincia) ? `<div class="info-medico"><i class="bi bi-pin-map-fill"></i> <strong>Ubicación:</strong> ${escapeHtml([medico.distrito, medico.provincia].filter(Boolean).join(', '))}${medico.region ? ' - ' + escapeHtml(medico.region) : ''}</div>` : ''}
                ${(medico.latitud && medico.longitud) ? `<button type="button" class="btn btn-sm btn-outline-primary mt-2 btnVerMapa" data-medico-id="${medico.id}"><i class="bi bi-map"></i> Ver en mapa</button>` : ''}
            </div>
        `;
    });

    if (totalPages > 1) {
        html += `<div class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">`;
        html += `<span class="text-muted">Página ${page} de ${totalPages}</span>`;
        html += `<nav><ul class="pagination mb-0">`;
        html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">Anterior</a></li>`;
        const paginas = new Set([1, page, totalPages]);
        if (page > 1) paginas.add(page - 1);
        if (page < totalPages) paginas.add(page + 1);
        let prevP = 0;
        [...paginas].sort((a, b) => a - b).forEach(p => {
            if (prevP > 0 && p > prevP + 1) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
            html += `<li class="page-item ${p === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
            prevP = p;
        });
        html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">Siguiente</a></li>`;
        html += `</ul></nav></div>`;
    }

    listaMedicos.innerHTML = html;

    listaMedicos.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.closest('.page-item.disabled')) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (p >= 1 && p <= totalPages) cargarTodosMedicos(p);
        });
    });
}

// --- Mapa Leaflet ---
let mapaLeaflet = null;
const LIMA_CENTER = [-12.0464, -77.0428];

function initMapa(medicosConCoords) {
    const cont = document.getElementById('mapaCardiologos');
    if (!cont) return;
    if (mapaLeaflet) {
        mapaLeaflet.remove();
        mapaLeaflet = null;
    }
    mapaLeaflet = L.map('mapaCardiologos').setView(LIMA_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapaLeaflet);
    (medicosConCoords || []).forEach(m => {
        if (m.latitud && m.longitud) {
            const popup = `<strong>${escapeHtml(m.nombre)}</strong><br>${escapeHtml(m.direccion_completa || m.ubicacion_consultorio || '')}<br>${m.precio_visita ? escapeHtml(m.precio_visita) : ''}`;
            L.marker([m.latitud, m.longitud]).addTo(mapaLeaflet).bindPopup(popup);
        }
    });
}

async function abrirMapa(medicoIdFoco = null) {
    mostrarLoading();
    try {
        const r = await fetch(`${API_URL}/medicos/todos?page=1&per_page=200`, { headers: authHeaders() });
        const data = await r.json();
        ocultarLoading();
        if (!r.ok) {
            mostrarNotificacion(data.error || 'Error al cargar médicos', 'error');
            return;
        }
        const medicos = data.medicos || [];
        const conCoords = medicos.filter(m => m.latitud && m.longitud);
        initMapa(conCoords);
        if (medicoIdFoco && conCoords.length) {
            const m = conCoords.find(x => x.id == medicoIdFoco);
            if (m) mapaLeaflet.setView([m.latitud, m.longitud], 15);
        }
        const modal = new bootstrap.Modal(document.getElementById('modalMapa'));
        modal.show();
        setTimeout(() => mapaLeaflet?.invalidateSize(), 300);
    } catch (err) {
        ocultarLoading();
        mostrarNotificacion('Error: ' + err.message, 'error');
    }
}

document.getElementById('btnVerMapaTodos')?.addEventListener('click', () => abrirMapa());
document.getElementById('listaMedicos')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btnVerMapa');
    if (btn) abrirMapa(btn.getAttribute('data-medico-id'));
});

// Volver al resultado
document.getElementById('btnVolverResultado')?.addEventListener('click', () => {
    document.getElementById('medicosSection').style.display = 'none';
    if (resultadoEvaluacion) {
        document.getElementById('formularioSection').style.display = 'none';
        document.getElementById('resultadoSection').style.display = 'block';
    } else {
        document.getElementById('formularioSection').style.display = 'block';
        document.getElementById('resultadoSection').style.display = 'none';
    }
});

// Nueva evaluación
document.getElementById('btnNuevaEvaluacion').addEventListener('click', () => {
    document.getElementById('resultadoSection').style.display = 'none';
    document.getElementById('medicosSection').style.display = 'none';
    document.getElementById('formularioSection').style.display = 'block';
    document.getElementById('formularioEvaluacion').reset();
});

// Funciones de utilidad
function mostrarLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Cargando...</span></div>';
    document.body.appendChild(overlay);
}

function ocultarLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Validar que la fecha de nacimiento no sea futura
document.getElementById('fecha_nacimiento').addEventListener('change', function() {
    const fechaNacimiento = new Date(this.value);
    const hoy = new Date();

    if (fechaNacimiento > hoy) {
        mostrarNotificacion('La fecha de nacimiento no puede ser futura', 'warning');
        this.value = '';
    }
});

// Calcular edad automáticamente
document.getElementById('fecha_nacimiento').addEventListener('change', function() {
    const fechaNacimiento = new Date(this.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
    }

    document.getElementById('edad').value = edad;
});

// --- Auth: Event handlers ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    verificarSesionInicial();
});

document.getElementById('btnIniciarSesion')?.addEventListener('click', () => mostrarSeccion('loginSection'));
document.getElementById('btnRegistrarse')?.addEventListener('click', () => mostrarSeccion('registroPacienteSection'));
document.getElementById('btnRegistrarseMedico')?.addEventListener('click', () => mostrarSeccion('registroMedicoSection'));
document.getElementById('btnShowLogin')?.addEventListener('click', () => mostrarSeccion('loginSection'));
document.getElementById('btnShowRegistro')?.addEventListener('click', () => mostrarSeccion('registroPacienteSection'));
document.getElementById('linkRegistroDesdeLogin')?.addEventListener('click', (e) => { e.preventDefault(); mostrarSeccion('registroPacienteSection'); });
document.getElementById('linkVolverDesdeLogin')?.addEventListener('click', (e) => { e.preventDefault(); mostrarSeccion('landingSection'); });
document.getElementById('linkRegistroMedicoDesdePac')?.addEventListener('click', (e) => { e.preventDefault(); mostrarSeccion('registroMedicoSection'); });
document.getElementById('linkRegistroPacienteDesdeMed')?.addEventListener('click', (e) => { e.preventDefault(); mostrarSeccion('registroPacienteSection'); });
document.getElementById('btnLogout')?.addEventListener('click', () => {
    clearToken();
    actualizarNavbar();
    mostrarSeccion('landingSection');
});

document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarLoading();
    try {
        const r = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            })
        });
        const data = await r.json();
        ocultarLoading();
        if (r.ok) {
            setToken(data.token);
            setStoredUser(data.usuario);
            actualizarNavbar();
            if (data.usuario.rol === 'medico') {
                mostrarSeccion('perfilMedicoSection');
                cargarPerfilMedico();
            } else {
                mostrarSeccion('mainContent');
            }
            mostrarNotificacion('Sesión iniciada correctamente', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (err) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión: ' + err.message, 'error');
    }
});

document.getElementById('formRegistroPaciente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarLoading();
    try {
        const r = await fetch(`${API_URL}/auth/registro/paciente`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                email: document.getElementById('regPacEmail').value,
                password: document.getElementById('regPacPassword').value,
                apellidos_nombre: document.getElementById('regPacNombre').value,
                historia_clinica: document.getElementById('regPacHistoria').value,
                dni: document.getElementById('regPacDni').value,
                fecha_nacimiento: document.getElementById('regPacFechaNac').value,
                telefono: document.getElementById('regPacTelefono').value || undefined,
                direccion: document.getElementById('regPacDireccion').value || undefined,
                provincia: document.getElementById('regPacProvincia').value || 'No especificado',
                ciudad: document.getElementById('regPacCiudad').value || 'No especificado',
                distrito: document.getElementById('regPacDistrito').value || 'No especificado'
            })
        });
        const data = await r.json();
        ocultarLoading();
        if (r.ok) {
            setToken(data.token);
            setStoredUser(data.usuario);
            actualizarNavbar();
            mostrarSeccion('mainContent');
            mostrarNotificacion('Registro exitoso. Bienvenido.', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al registrarse', 'error');
        }
    } catch (err) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión: ' + err.message, 'error');
    }
});

document.getElementById('formRegistroMedico')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarLoading();
    try {
        const r = await fetch(`${API_URL}/auth/registro/medico`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                email: document.getElementById('regMedEmail').value,
                password: document.getElementById('regMedPassword').value,
                medico_id: parseInt(document.getElementById('regMedMedicoId').value, 10)
            })
        });
        const data = await r.json();
        ocultarLoading();
        if (r.ok) {
            setToken(data.token);
            setStoredUser(data.usuario);
            actualizarNavbar();
            mostrarSeccion('perfilMedicoSection');
            cargarPerfilMedico();
            mostrarNotificacion('Registro exitoso. Bienvenido.', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al registrarse', 'error');
        }
    } catch (err) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión: ' + err.message, 'error');
    }
});

document.getElementById('btnVolverDesdeRegPac')?.addEventListener('click', () => mostrarSeccion('landingSection'));
document.getElementById('btnVolverDesdeRegMed')?.addEventListener('click', () => mostrarSeccion('landingSection'));

document.getElementById('linkEvaluacionAnonima')?.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarSeccion('mainContent');
});

function cargarPerfilMedico() {
    fetch(`${API_URL}/medicos/perfil`, { headers: authHeaders() })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('No autorizado')))
        .then(medico => {
            document.getElementById('perfilNombre').value = medico.nombre || '';
            document.getElementById('perfilEspecialidad').value = medico.especialidad || '';
            document.getElementById('perfilTelefono').value = medico.telefono || '';
            document.getElementById('perfilDireccion').value = medico.direccion_completa || medico.ubicacion_consultorio || '';
            document.getElementById('perfilProvincia').value = medico.provincia || '';
            document.getElementById('perfilDistrito').value = medico.distrito || '';
        })
        .catch(() => mostrarNotificacion('No se pudo cargar el perfil', 'error'));
}

document.getElementById('formPerfilMedico')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarLoading();
    try {
        const r = await fetch(`${API_URL}/medicos/perfil`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
                telefono: document.getElementById('perfilTelefono').value,
                ubicacion_consultorio: document.getElementById('perfilDireccion').value,
                direccion_completa: document.getElementById('perfilDireccion').value,
                provincia: document.getElementById('perfilProvincia').value,
                distrito: document.getElementById('perfilDistrito').value
            })
        });
        const data = await r.json();
        ocultarLoading();
        if (r.ok) {
            mostrarNotificacion('Perfil actualizado correctamente', 'success');
        } else {
            mostrarNotificacion(data.error || 'Error al actualizar', 'error');
        }
    } catch (err) {
        ocultarLoading();
        mostrarNotificacion('Error de conexión: ' + err.message, 'error');
    }
});
