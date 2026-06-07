# 📋 MANUAL DE USUARIO - SISTEMA DE ADMISIÓN MÉDICA

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Descripción:** Manual completo del Sistema de Gestión de Admisión Médica

---

## 📑 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación y Acceso](#instalación-y-acceso)
4. [Módulos Principales](#módulos-principales)
5. [Guías de Uso](#guías-de-uso)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Soporte Técnico](#soporte-técnico)

---

## 🎯 INTRODUCCIÓN

El **Sistema de Admisión Médica** es una plataforma integral diseñada para gestionar:
- 👥 Pacientes y sus historiales
- 🏥 Especialidades médicas
- 📅 Citas y horarios
- 👨‍⚕️ Personal médico y operadores
- 📊 Reportes y estadísticas
- 🔐 Control de usuarios y permisos

Este manual le guiará a través de todas las funcionalidades del sistema de forma clara y detallada.

---

## 💻 REQUISITOS DEL SISTEMA

### Hardware Mínimo
- Procesador: Intel Core 2 Duo o equivalente
- RAM: 2 GB mínimo (4 GB recomendado)
- Espacio en disco: 500 MB
- Conexión a Internet: Banda ancha (recomendado)

### Software Requerido
- **Navegador Web:** Chrome, Firefox, Safari o Edge (versión reciente)
- **Sistema Operativo:** Windows 7+, macOS 10.12+, Linux (Ubuntu 16.04+)
- **JavaScript:** Debe estar habilitado en el navegador
- **Conexión:** Acceso a Internet estable

### Navegadores Compatibles
| Navegador | Versión Mínima | Estado |
|-----------|---|---|
| Google Chrome | 90+ | ✅ Compatible |
| Mozilla Firefox | 88+ | ✅ Compatible |
| Microsoft Edge | 90+ | ✅ Compatible |
| Safari | 14+ | ✅ Compatible |

---

## 🚀 INSTALACIÓN Y ACCESO

### Acceso a la Plataforma

1. **Abra su navegador web** (Chrome, Firefox, Edge o Safari)
2. **Ingrese la URL del sistema** proporcionada por su administrador
3. **Ingrese sus credenciales de acceso:**
   - Usuario/Email
   - Contraseña
4. **Haga clic en "Iniciar Sesión"**

### Cambiar Contraseña

Si desea cambiar su contraseña:

1. Inicie sesión en la plataforma
2. Haga clic en su **Perfil** (esquina superior derecha)
3. Seleccione **"Cambiar Contraseña"**
4. Ingrese su contraseña actual
5. Ingrese la nueva contraseña (mínimo 8 caracteres)
6. Confirme la nueva contraseña
7. Haga clic en **"Guardar"**

### Cerrar Sesión

Para cerrar su sesión:
1. Haga clic en su **Perfil** (esquina superior derecha)
2. Seleccione **"Cerrar Sesión"**
3. Será redirigido a la página de login

---

## 🏢 MÓDULOS PRINCIPALES

### 1. 📊 DASHBOARD

El Dashboard es la pantalla principal del sistema que muestra un resumen general.

**Funcionalidades:**
- 📈 Gráficos de estadísticas
- 📅 Citas del día
- 👥 Total de pacientes
- 🏥 Especialidades disponibles
- ⚠️ Alertas importantes

**Cómo usar:**
1. Al iniciar sesión, verá el Dashboard
2. Los gráficos se actualizan en tiempo real
3. Puede filtrar por fechas utilizando los selectores de fecha
4. Haga clic en cualquier sección para ver más detalles

---

### 2. 👥 PACIENTES

En este módulo gestiona toda la información de los pacientes.

#### Agregar un Nuevo Paciente

1. Vaya a **Pacientes** en el menú lateral
2. Haga clic en **"+ Agregar Paciente"**
3. Complete el formulario:
   - **Nombre:** Nombres completos del paciente
   - **Apellido:** Apellidos completos
   - **Cédula/DNI:** Documento de identidad
   - **Email:** Correo electrónico
   - **Teléfono:** Número de contacto
   - **Fecha de Nacimiento:** Seleccione del calendario
   - **Género:** Masculino/Femenino/Otro
   - **Dirección:** Domicilio completo
4. Haga clic en **"Guardar"**

#### Buscar Paciente

1. En la sección **Pacientes**, use la **barra de búsqueda**
2. Ingrese el nombre, cédula o email del paciente
3. Los resultados aparecerán automáticamente
4. Haga clic en un paciente para ver sus detalles

#### Editar Información del Paciente

1. Busque el paciente
2. Haga clic en el ícono de **editar** (lápiz)
3. Modifique los datos necesarios
4. Haga clic en **"Guardar"**

#### Ver Historial de Paciente

1. Haga clic en el nombre del paciente
2. Verá:
   - Datos personales
   - Historial de citas
   - Documentos adjuntos
   - Notas médicas

---

### 3. 📅 CITAS

Gestione las citas y horarios de los pacientes.

#### Agendar una Nueva Cita

1. Vaya a **Citas** en el menú lateral
2. Haga clic en **"+ Nueva Cita"**
3. Complete los datos:
   - **Paciente:** Seleccione de la lista
   - **Especialidad:** Escoja la especialidad requerida
   - **Médico/Profesional:** Seleccione el profesional disponible
   - **Fecha:** Seleccione la fecha deseada
   - **Hora:** Seleccione la hora disponible
   - **Síntomas/Motivo:** Describa brevemente el motivo de la cita
   - **Tickets por día:** Número de turnos disponibles
4. Haga clic en **"Agendar"**

**Nota:** Cada especialidad maneja tickets independientes. Por ejemplo:
- Nutrición: Tickets 1, 2, 3...
- Medicina General: Tickets 1, 2, 3...
- Laboratorio: Tickets 1, 2, 3...

#### Ver Citas Agendadas

1. En **Citas**, verá una lista de todas las citas
2. Use los filtros para:
   - Filtrar por fecha
   - Filtrar por especialidad
   - Filtrar por estado (Pendiente, Completada, Cancelada)
3. Haga clic en una cita para ver detalles

#### Modificar una Cita

1. Busque la cita en la lista
2. Haga clic en el ícono de **editar** (lápiz)
3. Realice los cambios necesarios
4. Haga clic en **"Guardar"**

#### Cancelar una Cita

1. Seleccione la cita
2. Haga clic en el ícono de **eliminar** o **cancelar**
3. Confirme la cancelación
4. La cita será marcada como cancelada

#### Vista de Horarios

**Semanal:** 
1. Vaya a **Citas**
2. Seleccione **"Vista Semanal"**
3. Verá los horarios de toda la semana

**Mensual:**
1. Vaya a **Citas**
2. Seleccione **"Vista Mensual"**
3. Verá los horarios de todo el mes

---

### 4. 🏥 ESPECIALIDADES

Gestión de especialidades médicas disponibles.

#### Agregar Nueva Especialidad

1. Vaya a **Especialidades** en el menú lateral
2. Haga clic en **"+ Nueva Especialidad"**
3. Complete los datos:
   - **Nombre:** Nombre de la especialidad (ej: Cardiología, Pediatría)
   - **Descripción:** Describa brevemente la especialidad
   - **Código:** Código único (ej: CAR, PED)
4. Haga clic en **"Guardar"**

#### Editar Especialidad

1. Busque la especialidad en la lista
2. Haga clic en **editar** (lápiz)
3. Modifique los datos
4. Haga clic en **"Guardar"**

#### Ver Especialidades

1. En la sección **Especialidades** verá todas las especialidades disponibles
2. Cada una muestra:
   - Nombre
   - Descripción
   - Cantidad de profesionales asignados
   - Cantidad de citas agendadas

---

### 5. 👨‍⚕️ PERSONAL

Gestión de personal médico y profesionales de salud.

#### Agregar Nuevo Personal

1. Vaya a **Personal** en el menú lateral
2. Haga clic en **"+ Agregar Personal"**
3. Complete el formulario:
   - **Nombre:** Nombre completo
   - **Profesión/Cargo:** Médico, Enfermero, Técnico, etc.
   - **Especialidad:** Seleccione la especialidad
   - **Cédula Profesional:** Número de cédula
   - **Email:** Correo electrónico
   - **Teléfono:** Número de contacto
   - **Horario de Atención:** Seleccione disponibilidad
4. Haga clic en **"Guardar"**

#### Gestionar Disponibilidad

1. Seleccione el personal
2. Haga clic en **"Horarios"**
3. Configure:
   - Días de atención (Lunes a Viernes, etc.)
   - Hora de entrada y salida
   - Intervalo entre citas
4. Haga clic en **"Guardar"**

---

### 6. 👥 OPERADORES

Gestión de operadores/recepcionistas del sistema.

#### Agregar Nuevo Operador

1. Vaya a **Operadores** en el menú lateral
2. Haga clic en **"+ Nuevo Operador"**
3. Complete los datos:
   - **Nombre:** Nombre completo
   - **Email:** Correo electrónico
   - **Usuario:** Nombre de usuario
   - **Teléfono:** Número de contacto
4. Haga clic en **"Guardar"**

#### Asignar Permisos

1. Seleccione el operador
2. Haga clic en **"Permisos"**
3. Seleccione los módulos a los que tiene acceso:
   - Ver Citas
   - Agendar Citas
   - Gestionar Pacientes
   - Ver Reportes
4. Haga clic en **"Guardar"**

---

### 7. 👤 USUARIOS

Gestión de usuarios del sistema.

#### Crear Nuevo Usuario

1. Vaya a **Usuarios** en el menú lateral
2. Haga clic en **"+ Nuevo Usuario"**
3. Ingrese los datos:
   - **Nombre:** Nombre completo
   - **Email:** Correo electrónico (usuario único)
   - **Rol:** Administrador, Personal, Operador
   - **Teléfono:** Número de contacto
4. Haga clic en **"Crear"**
5. Se generará una contraseña temporal que será enviada al email

#### Cambiar Rol de Usuario

1. Seleccione el usuario
2. Haga clic en **"Editar"**
3. Seleccione el nuevo rol
4. Haga clic en **"Guardar"**

#### Desactivar Usuario

1. Seleccione el usuario
2. Haga clic en **"Desactivar"**
3. El usuario no podrá acceder hasta ser reactivado

---

### 8. 📊 REPORTES

Genere reportes e informes del sistema.

#### Generar Reporte de Citas

1. Vaya a **Reportes** en el menú lateral
2. Seleccione **"Citas"**
3. Elija los filtros:
   - **Período:** Fecha inicio y fin
   - **Especialidad:** Seleccione una o todas
   - **Estado:** Completada, Pendiente, Cancelada
4. Haga clic en **"Generar"**
5. El reporte se mostrará en pantalla
6. Opcionalmente, **Descargar** como PDF o Excel

#### Generar Reporte de Pacientes

1. Vaya a **Reportes**
2. Seleccione **"Pacientes"**
3. Filtros disponibles:
   - Rango de fechas de registro
   - Género
   - Edad
4. Haga clic en **"Generar"**
5. Descargue en PDF o Excel si lo requiere

#### Generar Reporte de Personal

1. Vaya a **Reportes**
2. Seleccione **"Personal"**
3. Filtros:
   - Por especialidad
   - Por estado (Activo/Inactivo)
4. Genere el reporte

#### Exportar Datos

Desde cualquier reporte puede:
- **Descargar PDF:** Reporte formateado para impresión
- **Descargar Excel:** Datos en formato spreadsheet
- **Enviar por Email:** El reporte se enviará al email registrado

---

### 9. 📁 ARCHIVADOS

Gestión de registros archivados.

#### Ver Registros Archivados

1. Vaya a **Archivados** en el menú lateral
2. Verá:
   - Citas archivadas
   - Pacientes no activos
   - Otros registros inactivos
3. Use los filtros para buscar

#### Restaurar Registro

1. Seleccione el registro archivado
2. Haga clic en **"Restaurar"**
3. El registro volverá a estar activo

#### Eliminar Permanentemente

⚠️ **ADVERTENCIA:** Esta acción no se puede deshacer

1. Seleccione el registro
2. Haga clic en **"Eliminar Permanentemente"**
3. Confirme la eliminación
4. El registro será eliminado de forma permanente

---

### 10. 👤 PERFIL

Gestión del perfil personal del usuario.

#### Ver y Editar Perfil

1. Haga clic en su nombre/avatar (esquina superior derecha)
2. Seleccione **"Mi Perfil"**
3. Verá:
   - Información personal
   - Foto de perfil
   - Datos de contacto
   - Cargo/Rol
4. Haga clic en **"Editar"** para modificar datos
5. Haga clic en **"Guardar"**

#### Cambiar Foto de Perfil

1. En **Mi Perfil**, haga clic en la foto actual
2. Seleccione **"Cambiar Foto"**
3. Cargue una imagen desde su computadora
4. Ajuste según sea necesario
5. Haga clic en **"Guardar"**

#### Preferencias de Notificaciones

1. En **Mi Perfil**, vaya a **"Preferencias"**
2. Configure:
   - Notificaciones por email
   - Recordatorios de citas
   - Alertas del sistema
3. Haga clic en **"Guardar"**

---

## 📖 GUÍAS DE USO

### Guía Completa: Agendar una Cita desde Inicio

**Tiempo estimado:** 5 minutos

**Paso 1: Acceder al Módulo de Citas**
```
Inicio → Panel Lateral → Citas
```

**Paso 2: Crear Nueva Cita**
- Haga clic en el botón "+ Nueva Cita"
- Se abrirá el formulario de creación

**Paso 3: Seleccionar Paciente**
- Haga clic en el campo "Paciente"
- Busque por nombre o cédula
- Seleccione el paciente deseado

**Paso 4: Elegir Especialidad**
- Seleccione la especialidad médica requerida
- El sistema mostrará los profesionales disponibles

**Paso 5: Seleccionar Profesional**
- De la lista de profesionales disponibles
- Elija según su disponibilidad

**Paso 6: Elegir Fecha y Hora**
- Haga clic en el calendario
- Seleccione la fecha (días disponibles aparecen en azul)
- Seleccione la hora disponible

**Paso 7: Agregar Notas**
- En el campo "Síntomas/Motivo", describa brevemente
- Agregue cualquier información relevante

**Paso 8: Confirmar**
- Revise todos los datos
- Haga clic en "Agendar Cita"
- ¡Cita agendada exitosamente!

---

### Guía: Generar Reporte de Citas Mensuales

**Tiempo estimado:** 3 minutos

1. Vaya a **Reportes** → **Citas**
2. Seleccione la fecha de inicio (primer día del mes)
3. Seleccione la fecha de fin (último día del mes)
4. Opcionalmente, filtre por especialidad
5. Haga clic en **"Generar"**
6. El reporte aparecerá en la pantalla
7. Para descargar:
   - Haga clic en **"Descargar PDF"** o **"Descargar Excel"**
8. El archivo se descargará a su computadora

---

### Guía: Registrar Nuevo Paciente

**Tiempo estimado:** 7 minutos

1. Vaya a **Pacientes**
2. Haga clic en **"+ Agregar Paciente"**
3. Complete cada campo:
   - **Nombres:** (Ej: Juan Carlos)
   - **Apellidos:** (Ej: García Rodríguez)
   - **Cédula:** (Ej: 1234567890)
   - **Fecha de Nacimiento:** Seleccione del calendario
   - **Género:** Seleccione la opción
   - **Email:** Correo electrónico válido
   - **Teléfono:** Formato: +XX XXXXXXXXX
   - **Dirección:** Domicilio completo
4. Haga clic en **"Guardar"**
5. El paciente aparecerá en la lista

---

## ❓ PREGUNTAS FRECUENTES

### ¿Olvidé mi contraseña, qué hago?

**Respuesta:** 
1. En la página de login, haga clic en **"¿Olvidó su contraseña?"**
2. Ingrese su correo electrónico
3. Recibirá un enlace para recuperar contraseña
4. Haga clic en el enlace y cree una nueva contraseña
5. Intente iniciar sesión nuevamente

---

### ¿Cómo sé si un horario está disponible?

**Respuesta:** 
- Los horarios disponibles aparecen en color **azul**
- Los horarios ocupados aparecen en **gris** o **rojo**
- El sistema no permite agendar en horarios ocupados

---

### ¿Puedo cambiar una cita ya agendada?

**Respuesta:** 
Sí. Vaya a **Citas**, seleccione la cita y haga clic en **"Editar"**. Puede cambiar:
- La fecha
- La hora
- El profesional
- La especialidad (si es necesario)

Guarde los cambios.

---

### ¿Cómo imprimir la información de un paciente?

**Respuesta:** 
1. Vaya a **Pacientes**
2. Seleccione el paciente
3. Use **Ctrl+P** (Windows) o **Cmd+P** (Mac)
4. O haga clic en el ícono de **impresora** si está disponible

---

### ¿Qué significa "Tickets Independientes por Especialidad"?

**Respuesta:** 
Cada especialidad médica maneja sus propios números de turno:
- **Nutrición:** Turno 1, 2, 3, 4...
- **Medicina General:** Turno 1, 2, 3, 4...
- **Laboratorio:** Turno 1, 2, 3, 4...

Esto evita confusiones y facilita la organización por departamento.

---

### ¿Cuál es el máximo de citas por día y especialidad?

**Respuesta:** 
Por defecto, cada especialidad puede tener hasta **16 citas diarias**. Este número puede ser configurado por el administrador del sistema.

---

### ¿Qué hago si el sistema está lento?

**Respuesta:** 
1. Intente **recargar la página** (F5)
2. **Limpie el caché** del navegador
3. Cierre otras pestañas innecesarias
4. Si persiste, contacte al soporte técnico

---

### ¿Cómo exporto todos mis pacientes?

**Respuesta:** 
1. Vaya a **Reportes** → **Pacientes**
2. Dejar todos los filtros vacíos para exportar todos
3. Haga clic en **"Generar"**
4. Haga clic en **"Descargar Excel"**
5. Se descargará el archivo con todos los pacientes

---

### ¿Se pueden agendar citas retroactivas?

**Respuesta:** 
Esto depende de la configuración del administrador. Generalmente:
- **No se permiten citas en el pasado**
- Solo se pueden agendar para fechas futuras
- Contacte al administrador si necesita una excepción

---

### ¿Cómo cambio mi especialidad de médico?

**Respuesta:** 
1. Vaya a **Personal**
2. Seleccione su registro
3. Haga clic en **"Editar"**
4. Seleccione la nueva especialidad
5. Haga clic en **"Guardar"**

---

## 📞 SOPORTE TÉCNICO

### Canales de Contacto

| Canal | Información |
|-------|---|
| **Email** | soporte@admision-medica.com |
| **Teléfono** | +1 (555) 123-4567 |
| **Chat en Vivo** | Disponible de 8am a 6pm |
| **Portal de Ayuda** | help.admision-medica.com |

### Horario de Atención

- **Lunes a Viernes:** 8:00 AM - 6:00 PM
- **Sábados:** 9:00 AM - 1:00 PM
- **Domingos:** Cerrado

### Reportar un Problema

1. **Recopile información:**
   - Descripción del problema
   - Hora en que ocurrió
   - Pasos para reproducir
   - Captura de pantalla (si es posible)

2. **Contacte al soporte:**
   - Por email o teléfono
   - Proporcione toda la información recopilada
   - Mencione su usuario/email

3. **Seguimiento:**
   - Recibirá un número de ticket
   - El equipo se comunicará en 24 horas

### Errores Comunes y Soluciones

#### Error: "No se pudo conectar al servidor"
**Solución:**
- Verifique su conexión a Internet
- Intente recargar la página
- Contacte al soporte si persiste

#### Error: "Sesión expirada"
**Solución:**
- Inicie sesión nuevamente
- Las sesiones vencen después de 2 horas de inactividad

#### Error: "Usuario no tiene permisos"
**Solución:**
- Contacte al administrador del sistema
- Verifique que su rol permite acceder a este módulo

#### Error: "El horario no está disponible"
**Solución:**
- Seleccione otra hora
- Si necesita una excepción, contacte al administrador

---

## 📝 NOTAS IMPORTANTES

✅ **Siempre:**
- Guarde sus cambios antes de cerrar
- Verifique los datos antes de confirmar
- Realice copias de seguridad de información importante

❌ **Nunca:**
- Comparta sus credenciales de acceso
- Deje su sesión abierta en computadora pública
- Confíe en URLs de inicio de sesión sospechosas

⚠️ **Recuerde:**
- Las acciones de eliminación permanente no se pueden deshacer
- Verifique dos veces antes de eliminar registros
- Contacte al soporte para restaurar datos eliminados

---

## 📜 HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Junio 2026 | Versión inicial del manual |
| | | - Documentación de todos los módulos |
| | | - Guías paso a paso |
| | | - Preguntas frecuentes |
| | | - Información de soporte |

---

## 📧 INFORMACIÓN DE CONTACTO

**Sistema de Admisión Médica**  
Email: info@admision-medica.com  
Teléfono: +1 (555) 123-4567  
Sitio Web: www.admision-medica.com  

**Equipo de Soporte**  
Email: soporte@admision-medica.com  
Disponibilidad: Lunes a Viernes, 8am a 6pm

---

**© 2026 Sistema de Admisión Médica - Todos los derechos reservados**

---

## 📚 APÉNDICES

### A. Atajos de Teclado

| Atajo | Función |
|-------|---------|
| `Ctrl + P` | Imprimir página actual |
| `F5` | Recargar página |
| `Ctrl + H` | Ir al historial |
| `Alt + ←` | Página anterior |
| `Alt + →` | Página siguiente |

### B. Glosario de Términos

- **Cita:** Encuentro agendado entre paciente y profesional
- **Especialidad:** Rama médica (Cardiología, Pediatría, etc.)
- **Ticket:** Número de turno asignado a la cita
- **Operador:** Personal de recepción y administración
- **Usuario:** Persona con acceso al sistema
- **Rol:** Tipo de acceso y permisos en el sistema
- **Dashboard:** Pantalla principal con resumen del sistema

### C. Requisitos de Datos

#### Para Agendar Cita (Todos Requeridos):
- Paciente válido en el sistema
- Especialidad disponible
- Profesional disponible
- Fecha futura
- Hora disponible

#### Para Registrar Paciente (Todos Requeridos):
- Nombres completos
- Cédula/DNI válida
- Email válido
- Teléfono de contacto
- Fecha de nacimiento

---

**Documento de Referencia - Guarde para futuras consultas**
