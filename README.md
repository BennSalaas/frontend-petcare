# Frontend Clínica Veterinaria "PetCare"

Aplicación web desarrollada con **React + Vite** y **Axios** para consumir la API REST de la clínica veterinaria PetCare.

## Funcionalidades Implementadas
- **Listado de Dueños:** Consulta en tiempo real a `GET /api/duenos` mostrando datos de contacto y RUT.
- **Visualización de Mascotas:** Al seleccionar un dueño, consulta `GET /api/duenos/{id}/mascotas` y despliega sus mascotas asociadas.
- **Historial y Registro de Citas:** Al seleccionar una mascota, lista sus atenciones (`GET /api/mascotas/{id}/citas`) y permite agendar nuevas citas médicas mediante un formulario (`POST /api/citas?mascotaId={id}`).

## Requisitos de Ejecución
1. Tener el backend (`api-petcare`) ejecutándose en `http://localhost:8080`.
2. Instalar dependencias con `npm install`.
3. Iniciar el servidor de desarrollo con `npm run dev`.