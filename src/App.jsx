import { useEffect, useState } from 'react';
import './App.css';
import {
  obtenerDuenos,
  obtenerMascotasPorDueno,
  obtenerCitasPorMascota,
  crearCita,
} from './services/petcareService';

function App() {
  // Estados principales
  const [duenos, setDuenos] = useState([]);
  const [duenoSeleccionado, setDuenoSeleccionado] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [citas, setCitas] = useState([]);

  // Estados del formulario de Cita
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [costo, setCosto] = useState('');

  // Mensajes de estado (éxito o error)
  const [alerta, setAlerta] = useState(null);

  // Cargar dueños al iniciar la aplicación
  useEffect(() => {
    cargarDuenos();
  }, []);

  const cargarDuenos = async () => {
    try {
      const data = await obtenerDuenos();
      setDuenos(data);
    } catch (error) {
      mostrarAlerta('error', 'No se pudo conectar con el backend. Verifica que Spring Boot esté corriendo en el puerto 8080.');
    }
  };

  const mostrarAlerta = (tipo, texto) => {
    setAlerta({ tipo, texto });
    setTimeout(() => setAlerta(null), 4000);
  };

  // Al hacer clic en un dueño, carga sus mascotas
  const handleSeleccionarDueno = async (dueno) => {
    setDuenoSeleccionado(dueno);
    setMascotaSeleccionada(null);
    setCitas([]);
    try {
      const dataMascotas = await obtenerMascotasPorDueno(dueno.id);
      setMascotas(dataMascotas);
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar las mascotas del dueño.');
    }
  };

  // Al hacer clic en una mascota, carga su historial de citas
  const handleSeleccionarMascota = async (mascota) => {
    setMascotaSeleccionada(mascota);
    try {
      const dataCitas = await obtenerCitasPorMascota(mascota.id);
      setCitas(dataCitas);
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar las citas de la mascota.');
    }
  };

  // Enviar formulario para registrar una nueva cita
  const handleRegistrarCita = async (e) => {
    e.preventDefault();
    if (!mascotaSeleccionada) return;

    const nuevaCita = {
      fecha,
      motivo,
      diagnostico,
      costo: parseFloat(costo),
    };

    try {
      await crearCita(nuevaCita, mascotaSeleccionada.id);
      mostrarAlerta('exito', `Cita registrada correctamente para ${mascotaSeleccionada.nombre}.`);

      // Limpiar formulario y recargar citas de la mascota
      setFecha('');
      setMotivo('');
      setDiagnostico('');
      setCosto('');
      const citasActualizadas = await obtenerCitasPorMascota(mascotaSeleccionada.id);
      setCitas(citasActualizadas);
    } catch (error) {
      mostrarAlerta('error', 'Error al registrar la cita. Revisa los datos ingresados.');
    }
  };

  return (
    <div className="contenedor">
      <header className="header">
        <h1>🐾 Clínica Veterinaria PetCare</h1>
        <p>Gestión de Dueños, Mascotas y Citas Médicas</p>
      </header>

      {alerta && (
        <div className={`alerta ${alerta.tipo}`}>
          {alerta.texto}
        </div>
      )}

      <div className="grid-principal">
        {/* COLUMNA 1: LISTA DE DUEÑOS */}
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
        </section>

        {/* COLUMNA 2: MASCOTAS DEL DUEÑO */}
        <section className="panel">
          <h2>2. Mascotas {duenoSeleccionado ? `de ${duenoSeleccionado.nombre}` : ''}</h2>
          {!duenoSeleccionado ? (
            <p className="vacio">Selecciona un dueño a la izquierda para ver sus mascotas.</p>
          ) : mascotas.length === 0 ? (
            <p className="vacio">Este dueño aún no tiene mascotas registradas.</p>
          ) : (
            <div className="lista-tarjetas">
              {mascotas.map((mascota) => (
                <div
                  key={mascota.id}
                  className={`tarjeta ${mascotaSeleccionada?.id === mascota.id ? 'activa' : ''}`}
                  onClick={() => handleSeleccionarMascota(mascota)}
                >
                  <h3>{mascota.nombre} ({mascota.especie})</h3>
                  <p><strong>Raza:</strong> {mascota.raza || 'No especificada'}</p>
                  <p><strong>Nacimiento:</strong> {mascota.fechaNacimiento || 'Sin fecha'}</p>
                </div>
              ))}
            </div>
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
                  <label>Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label>Motivo de consulta *</label>
                  <input
                    type="text"
                    placeholder="Ej: Vacuna anual, control general..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label>Diagnóstico preliminar</label>
                  <textarea
                    rows="2"
                    placeholder="Opcional..."
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                  />
                </div>

                <div className="campo">
                  <label>Costo ($ CLP) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ej: 20000"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primario">
                  Registrar Cita
                </button>
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