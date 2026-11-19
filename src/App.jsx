import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import {
  obtenerDuenos,
  obtenerMascotasPorDueno,
  obtenerCitasPorMascota,
  crearDueno,
  crearMascota,
  crearCita,
  eliminarMascota,
  eliminarCita,
} from './services/petcareService';

// Extrae un mensaje legible del error devuelto por la API (o usa uno por defecto)
const extraerError = (error, mensajePorDefecto) => {
  const data = error.response?.data;
  const detalle = data?.error ?? data?.message;
  if (typeof detalle === 'string') return detalle;
  if (detalle && typeof detalle === 'object') return Object.values(detalle).join(' · ');
  return mensajePorDefecto;
};

const DUENO_VACIO = { rut: '', nombre: '', telefono: '', email: '' };
const MASCOTA_VACIA = { nombre: '', especie: '', raza: '', fechaNacimiento: '' };
const CITA_VACIA = { fecha: '', motivo: '', diagnostico: '', costo: '' };

function App() {
  // Estados principales
  const [duenos, setDuenos] = useState([]);
  const [duenoSeleccionado, setDuenoSeleccionado] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [citas, setCitas] = useState([]);

  // Formularios (un objeto por formulario)
  const [formDueno, setFormDueno] = useState(DUENO_VACIO);
  const [formMascota, setFormMascota] = useState(MASCOTA_VACIA);
  const [formCita, setFormCita] = useState(CITA_VACIA);

  // Formularios de dueño y mascota se muestran/ocultan con un botón
  const [mostrarFormDueno, setMostrarFormDueno] = useState(false);
  const [mostrarFormMascota, setMostrarFormMascota] = useState(false);

  // Mensajes de estado (éxito o error)
  const [alerta, setAlerta] = useState(null);
  const temporizadorAlerta = useRef(null);

  const mostrarAlerta = useCallback((tipo, texto) => {
    clearTimeout(temporizadorAlerta.current);
    setAlerta({ tipo, texto });
    temporizadorAlerta.current = setTimeout(() => setAlerta(null), 4000);
  }, []);

  // Cargar dueños al iniciar la aplicación
  useEffect(() => {
    const cargarDuenos = async () => {
      try {
        setDuenos(await obtenerDuenos());
      } catch {
        mostrarAlerta('error', 'No se pudo conectar con el backend. Verifica que Spring Boot esté corriendo en el puerto 8080.');
      }
    };
    cargarDuenos();
    return () => clearTimeout(temporizadorAlerta.current);
  }, [mostrarAlerta]);

  // Actualiza un campo de un formulario: onChange={cambiar(setFormDueno, 'rut')}
  const cambiar = (setForm, campo) => (e) =>
      setForm((anterior) => ({ ...anterior, [campo]: e.target.value }));

  // Al hacer clic en un dueño, carga sus mascotas
  const handleSeleccionarDueno = async (dueno) => {
    setDuenoSeleccionado(dueno);
    setMascotaSeleccionada(null);
    setCitas([]);
    setMostrarFormMascota(false);
    try {
      setMascotas(await obtenerMascotasPorDueno(dueno.id));
    } catch {
      mostrarAlerta('error', 'Error al cargar las mascotas del dueño.');
    }
  };

  // Al hacer clic en una mascota, carga su historial de citas
  const handleSeleccionarMascota = async (mascota) => {
    setMascotaSeleccionada(mascota);
    try {
      setCitas(await obtenerCitasPorMascota(mascota.id));
    } catch {
      mostrarAlerta('error', 'Error al cargar las citas de la mascota.');
    }
  };

  // Registrar un nuevo dueño
  const handleRegistrarDueno = async (e) => {
    e.preventDefault();
    const nuevoDueno = {
      rut: formDueno.rut.trim(),
      nombre: formDueno.nombre.trim(),
      telefono: formDueno.telefono.trim() || null,
      email: formDueno.email.trim(),
    };
    try {
      const creado = await crearDueno(nuevoDueno);
      setDuenos((anteriores) => [...anteriores, creado]);
      setFormDueno(DUENO_VACIO);
      setMostrarFormDueno(false);
      mostrarAlerta('exito', `Dueño ${creado.nombre} registrado correctamente.`);
    } catch (error) {
      mostrarAlerta('error', extraerError(error, 'Error al registrar el dueño. Revisa los datos ingresados.'));
    }
  };

  // Registrar una nueva mascota para el dueño seleccionado
  const handleRegistrarMascota = async (e) => {
    e.preventDefault();
    if (!duenoSeleccionado) return;
    const nuevaMascota = {
      nombre: formMascota.nombre.trim(),
      especie: formMascota.especie.trim(),
      raza: formMascota.raza.trim() || null,
      fechaNacimiento: formMascota.fechaNacimiento || null,
    };
    try {
      const creada = await crearMascota(nuevaMascota, duenoSeleccionado.id);
      setMascotas((anteriores) => [...anteriores, creada]);
      setFormMascota(MASCOTA_VACIA);
      setMostrarFormMascota(false);
      mostrarAlerta('exito', `Mascota ${creada.nombre} registrada para ${duenoSeleccionado.nombre}.`);
    } catch (error) {
      mostrarAlerta('error', extraerError(error, 'Error al registrar la mascota. Revisa los datos ingresados.'));
    }
  };

  // Registrar una nueva cita para la mascota seleccionada
  const handleRegistrarCita = async (e) => {
    e.preventDefault();
    if (!mascotaSeleccionada) return;
    const nuevaCita = {
      fecha: formCita.fecha,
      motivo: formCita.motivo.trim(),
      diagnostico: formCita.diagnostico.trim() || null,
      costo: parseFloat(formCita.costo),
    };
    try {
      await crearCita(nuevaCita, mascotaSeleccionada.id);
      mostrarAlerta('exito', `Cita registrada correctamente para ${mascotaSeleccionada.nombre}.`);
      setFormCita(CITA_VACIA);
      setCitas(await obtenerCitasPorMascota(mascotaSeleccionada.id));
    } catch (error) {
      mostrarAlerta('error', extraerError(error, 'Error al registrar la cita. Revisa los datos ingresados.'));
    }
  };

  // Eliminar una mascota (y su historial de citas), pidiendo confirmación
  const handleEliminarMascota = async (mascota) => {
    const confirmado = window.confirm(
        `¿Eliminar a ${mascota.nombre}? También se eliminará todo su historial de citas. Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;
    try {
      await eliminarMascota(mascota.id);
      setMascotas((anteriores) => anteriores.filter((m) => m.id !== mascota.id));
      if (mascotaSeleccionada?.id === mascota.id) {
        setMascotaSeleccionada(null);
        setCitas([]);
      }
      mostrarAlerta('exito', `Mascota ${mascota.nombre} eliminada.`);
    } catch (error) {
      mostrarAlerta('error', extraerError(error, 'No se pudo eliminar la mascota.'));
    }
  };

  // Eliminar una cita, pidiendo confirmación
  const handleEliminarCita = async (cita) => {
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarCita(cita.id);
      setCitas((anteriores) => anteriores.filter((c) => c.id !== cita.id));
      mostrarAlerta('exito', 'Cita eliminada.');
    } catch (error) {
      mostrarAlerta('error', extraerError(error, 'No se pudo eliminar la cita.'));
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);

  return (
      <div className="contenedor">
        <header className="header">
          <h1>🐾 Clínica Veterinaria PetCare</h1>
          <p>Gestión de Dueños, Mascotas y Citas Médicas</p>
        </header>

        {alerta && <div className={`alerta ${alerta.tipo}`}>{alerta.texto}</div>}

        <div className="grid-principal">
          {/* COLUMNA 1: DUEÑOS */}
          <section className="panel">
            <h2>1. Dueños Registrados</h2>
            {duenos.length === 0 ? (
                <p className="vacio">No hay dueños registrados en la base de datos.</p>
            ) : (
                <div className="lista-tarjetas">
                  {duenos.map((dueno) => (
                      <div
                          key={dueno.id}
                          className={`tarjeta ${duenoSeleccionado?.id === dueno.id ? 'activa' : ''}`}
                          onClick={() => handleSeleccionarDueno(dueno)}
                      >
                        <h3>{dueno.nombre}</h3>
                        <p><strong>RUT:</strong> {dueno.rut}</p>
                        <p><strong>Tel:</strong> {dueno.telefono || 'Sin teléfono'}</p>
                        <p><strong>Email:</strong> {dueno.email}</p>
                      </div>
                  ))}
                </div>
            )}

            {!mostrarFormDueno ? (
                <button type="button" className="btn-secundario" onClick={() => setMostrarFormDueno(true)}>
                  + Nuevo dueño
                </button>
            ) : (
                <div className="formulario-nuevo">
                  <h3>Nuevo dueño</h3>
                  <form className="formulario" onSubmit={handleRegistrarDueno}>
                    <div className="campo">
                      <label htmlFor="dueno-rut">RUT *</label>
                      <input
                          id="dueno-rut"
                          type="text"
                          placeholder="Ej: 12.345.678-9"
                          value={formDueno.rut}
                          onChange={cambiar(setFormDueno, 'rut')}
                          required
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="dueno-nombre">Nombre completo *</label>
                      <input
                          id="dueno-nombre"
                          type="text"
                          value={formDueno.nombre}
                          onChange={cambiar(setFormDueno, 'nombre')}
                          required
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="dueno-telefono">Teléfono</label>
                      <input
                          id="dueno-telefono"
                          type="tel"
                          placeholder="Opcional"
                          value={formDueno.telefono}
                          onChange={cambiar(setFormDueno, 'telefono')}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="dueno-email">Email *</label>
                      <input
                          id="dueno-email"
                          type="email"
                          value={formDueno.email}
                          onChange={cambiar(setFormDueno, 'email')}
                          required
                      />
                    </div>
                    <div className="acciones-form">
                      <button type="submit" className="btn-primario">Guardar dueño</button>
                      <button
                          type="button"
                          className="btn-cancelar"
                          onClick={() => { setMostrarFormDueno(false); setFormDueno(DUENO_VACIO); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
            )}
          </section>

          {/* COLUMNA 2: MASCOTAS DEL DUEÑO */}
          <section className="panel">
            <h2>2. Mascotas {duenoSeleccionado ? `de ${duenoSeleccionado.nombre}` : ''}</h2>
            {!duenoSeleccionado ? (
                <p className="vacio">Selecciona un dueño a la izquierda para ver sus mascotas.</p>
            ) : (
                <>
                  {mascotas.length === 0 ? (
                      <p className="vacio">Este dueño aún no tiene mascotas registradas.</p>
                  ) : (
                      <div className="lista-tarjetas">
                        {mascotas.map((mascota) => (
                            <div
                                key={mascota.id}
                                className={`tarjeta ${mascotaSeleccionada?.id === mascota.id ? 'activa' : ''}`}
                                onClick={() => handleSeleccionarMascota(mascota)}
                            >
                              <div className="tarjeta-cabecera">
                                <h3>{mascota.nombre} ({mascota.especie})</h3>
                                <button
                                    type="button"
                                    className="btn-eliminar"
                                    onClick={(e) => { e.stopPropagation(); handleEliminarMascota(mascota); }}
                                >
                                  Eliminar
                                </button>
                              </div>
                              <p><strong>Raza:</strong> {mascota.raza || 'No especificada'}</p>
                              <p><strong>Nacimiento:</strong> {mascota.fechaNacimiento || 'Sin fecha'}</p>
                            </div>
                        ))}
                      </div>
                  )}

                  {!mostrarFormMascota ? (
                      <button type="button" className="btn-secundario" onClick={() => setMostrarFormMascota(true)}>
                        + Nueva mascota
                      </button>
                  ) : (
                      <div className="formulario-nuevo">
                        <h3>Nueva mascota de {duenoSeleccionado.nombre}</h3>
                        <form className="formulario" onSubmit={handleRegistrarMascota}>
                          <div className="campo">
                            <label htmlFor="mascota-nombre">Nombre *</label>
                            <input
                                id="mascota-nombre"
                                type="text"
                                value={formMascota.nombre}
                                onChange={cambiar(setFormMascota, 'nombre')}
                                required
                            />
                          </div>
                          <div className="campo">
                            <label htmlFor="mascota-especie">Especie *</label>
                            <input
                                id="mascota-especie"
                                type="text"
                                list="lista-especies"
                                placeholder="Ej: Perro, Gato..."
                                value={formMascota.especie}
                                onChange={cambiar(setFormMascota, 'especie')}
                                required
                            />
                            <datalist id="lista-especies">
                              <option value="Perro" />
                              <option value="Gato" />
                              <option value="Ave" />
                              <option value="Conejo" />
                              <option value="Hámster" />
                            </datalist>
                          </div>
                          <div className="campo">
                            <label htmlFor="mascota-raza">Raza</label>
                            <input
                                id="mascota-raza"
                                type="text"
                                placeholder="Opcional"
                                value={formMascota.raza}
                                onChange={cambiar(setFormMascota, 'raza')}
                            />
                          </div>
                          <div className="campo">
                            <label htmlFor="mascota-nacimiento">Fecha de nacimiento</label>
                            <input
                                id="mascota-nacimiento"
                                type="date"
                                max={hoy}
                                value={formMascota.fechaNacimiento}
                                onChange={cambiar(setFormMascota, 'fechaNacimiento')}
                            />
                          </div>
                          <div className="acciones-form">
                            <button type="submit" className="btn-primario">Guardar mascota</button>
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={() => { setMostrarFormMascota(false); setFormMascota(MASCOTA_VACIA); }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                  )}
                </>
            )}
          </section>

          {/* COLUMNA 3: REGISTRAR CITA Y VER HISTORIAL */}
          <section className="panel">
            <h2>3. Agendar Cita {mascotaSeleccionada ? `para ${mascotaSeleccionada.nombre}` : ''}</h2>
            {!mascotaSeleccionada ? (
                <p className="vacio">Selecciona una mascota para agendar una cita o ver su historial.</p>
            ) : (
                <>
                  <form className="formulario" onSubmit={handleRegistrarCita}>
                    <div className="campo">
                      <label htmlFor="cita-fecha">Fecha y Hora *</label>
                      <input
                          id="cita-fecha"
                          type="datetime-local"
                          value={formCita.fecha}
                          onChange={cambiar(setFormCita, 'fecha')}
                          required
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="cita-motivo">Motivo de consulta *</label>
                      <input
                          id="cita-motivo"
                          type="text"
                          placeholder="Ej: Vacuna anual, control general..."
                          value={formCita.motivo}
                          onChange={cambiar(setFormCita, 'motivo')}
                          required
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="cita-diagnostico">Diagnóstico preliminar</label>
                      <textarea
                          id="cita-diagnostico"
                          rows="2"
                          placeholder="Opcional..."
                          value={formCita.diagnostico}
                          onChange={cambiar(setFormCita, 'diagnostico')}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="cita-costo">Costo ($ CLP) *</label>
                      <input
                          id="cita-costo"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="Ej: 20000"
                          value={formCita.costo}
                          onChange={cambiar(setFormCita, 'costo')}
                          required
                      />
                    </div>
                    <button type="submit" className="btn-primario">Registrar Cita</button>
                  </form>

                  <div className="historial-citas">
                    <h3>Historial de Citas ({citas.length})</h3>
                    {citas.length === 0 ? (
                        <p className="vacio">Sin citas registradas.</p>
                    ) : (
                        citas.map((cita) => (
                            <div key={cita.id} className="cita-item">
                              <p><strong>Fecha:</strong> {cita.fecha.replace('T', ' ')}</p>
                              <p><strong>Motivo:</strong> {cita.motivo}</p>
                              {cita.diagnostico && <p><strong>Diagnóstico:</strong> {cita.diagnostico}</p>}
                              <p><strong>Costo:</strong> ${cita.costo}</p>
                              <button type="button" className="btn-eliminar" onClick={() => handleEliminarCita(cita)}>
                                Eliminar cita
                              </button>
                            </div>
                        ))
                    )}
                  </div>
                </>
            )}
          </section>
        </div>
      </div>
  );
}

export default App;
