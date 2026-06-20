# 📚 MANUAL TÉCNICO - SISTEMA DE ADMISIÓN MÉDICA

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Descripción:** Manual técnico de arquitectura y desarrollo del Sistema de Admisión Médica

---

## 📑 TABLA DE CONTENIDOS

1. [Introducción Técnica](#introducción-técnica)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura General](#arquitectura-general)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Frontend - React](#frontend---react)
6. [Componentes del Sistema](#componentes-del-sistema)
7. [Servicios y APIs](#servicios-y-apis)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Gestión de Estado](#gestión-de-estado)
10. [Rutas y Navegación](#rutas-y-navegación)
11. [Configuración de Desarrollo](#configuración-de-desarrollo)
12. [Deployment](#deployment)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)
15. [Backend (Pendiente)](#backend-pendiente)

---

## 🎯 INTRODUCCIÓN TÉCNICA

El **Sistema de Admisión Médica** es una aplicación web full-stack diseñada para gestionar citas médicas, pacientes, especialidades y reportes.

**Características principales:**
- ✅ Arquitectura modular y escalable
- ✅ Interfaz responsiva
- ✅ Autenticación por JWT
- ✅ Control de acceso basado en roles (RBAC)
- ✅ API RESTful
- ✅ Base de datos relacional

**Estructura:**
```
Frontend (React/Vite) ↔ Backend (Laravel/Node/Python) ↔ Database (MySQL/PostgreSQL)
```

---

## 💻 STACK TECNOLÓGICO

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **React** | 18+ | Framework UI |
| **Vite** | 4+ | Build tool y dev server |
| **React Router** | 6+ | Enrutamiento |
| **Axios** | 1+ | Cliente HTTP |
| **Context API** | Built-in | Gestión de estado global |
| **CSS3/Tailwind** | - | Estilos responsivos |
| **JavaScript (ES6+)** | - | Lenguaje base |

### Backend (A Completar)
```
[Información del Backend será completada por el equipo backend]
```

### DevTools
| Herramienta | Versión | Propósito |
|-----------|---------|----------|
| **ESLint** | Latest | Linter de código |
| **Node.js** | 16+ | Runtime |
| **npm** | 7+ | Package manager |
| **Git** | Latest | Control de versiones |
| **Docker** | Latest | Contenedorización |

---

## 🏗️ ARQUITECTURA GENERAL

### Diagrama de Capas

```
┌─────────────────────────────────────┐
│      PRESENTACIÓN (React UI)         │
│  - Componentes                       │
│  - Vistas                            │
│  - Estilos                           │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      LÓGICA DE APLICACIÓN            │
│  - Context API (AuthContext)         │
│  - Hooks personalizados              │
│  - Rutas protegidas                  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      SERVICIOS Y APIS                │
│  - authService.js                    │
│  - citasService.js                   │
│  - pacientesService.js               │
│  - API Client (axios)                │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   BACKEND API (Laravel/Node/Python)  │
│  - Controladores                     │
│  - Modelos                           │
│  - Rutas                             │
│  - Validaciones                      │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      BASE DE DATOS                   │
│  - MySQL / PostgreSQL                │
│  - Tablas de datos                   │
└─────────────────────────────────────┘
```

---

## 📁 ESTRUCTURA DE CARPETAS

```
admision-medica_frontend/
│
├── public/                          # Archivos estáticos
│   └── favicon.ico
│
├── src/                             # Código fuente principal
│   │
│   ├── main.jsx                     # Punto de entrada React
│   ├── App.jsx                      # Componente raíz
│   ├── App.css                      # Estilos globales
│   ├── index.css                    # Estilos base
│   │
│   ├── api.js                       # Configuración Axios
│   │
│   ├── components/                  # Componentes reutilizables
│   │   ├── HorarioMensualPicker.jsx
│   │   ├── HorarioSemanalDisplay.jsx
│   │   ├── HorarioSemanalPicker.jsx
│   │   ├── LoginView.jsx
│   │   ├── ProtectedRoute.jsx       # Rutas protegidas
│   │   └── Sidebar.jsx              # Menú lateral
│   │
│   ├── contexts/                    # Context API
│   │   └── AuthContext.jsx          # Autenticación global
│   │
│   ├── layouts/                     # Layouts
│   │   └── AdminLayout.jsx          # Layout principal admin
│   │
│   ├── pages/                       # Vistas por módulo
│   │   ├── Forbidden.jsx            # Error 403
│   │   └── Admin/
│   │       ├── Archivados.jsx
│   │       ├── Citas.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Especialidades.jsx
│   │       ├── Operadores.jsx
│   │       ├── Pacientes.jsx
│   │       ├── Perfil.jsx
│   │       ├── Personal.jsx
│   │       ├── Reportes.jsx
│   │       └── Users.jsx
│   │
│   ├── services/                    # Servicios de API
│   │   ├── authService.js           # Auth API calls
│   │   ├── citasService.js          # Citas API calls
│   │   ├── dashboardService.js      # Dashboard API calls
│   │   ├── especialidadesService.js
│   │   ├── operadoresService.js
│   │   ├── pacientesService.js
│   │   ├── personalService.js
│   │   ├── reportesService.js
│   │   └── usersService.js
│   │
│   ├── styles/                      # Estilos adicionales
│   │   └── login.css
│   │
│   ├── views/                       # Vistas adicionales
│   │   ├── LoginView.jsx
│   │   └── Welcome.jsx
│   │
│   └── assets/                      # Imágenes, iconos, etc
│
├── vite.config.js                   # Configuración Vite
├── eslint.config.js                 # Configuración ESLint
├── package.json                     # Dependencias del proyecto
├── Dockerfile                       # Docker
├── index.html                       # HTML principal
└── README.md                        # Documentación general

```

---

## 🎨 FRONTEND - REACT

### Configuración Inicial

#### package.json (Dependencias Principales)
```json
{
  "name": "admision-medica-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0",
    "eslint": "^8.0.0"
  }
}
```

#### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### Punto de Entrada

#### main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 🧩 COMPONENTES DEL SISTEMA

### 1. ProtectedRoute.jsx

**Propósito:** Proteger rutas que requieren autenticación

```javascript
// Ubicación: src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuth()

  // No autenticado → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Sin rol requerido → Acceso permitido
  if (!requiredRole) {
    return children
  }

  // Verificar rol del usuario
  if (user?.role !== requiredRole) {
    return <Navigate to="/forbidden" />
  }

  return children
}
```

**Uso:**
```jsx
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

### 2. Sidebar.jsx

**Propósito:** Menú de navegación lateral

**Características:**
- Navegación dinámica según rol
- Links activos resaltados
- Menú colapsable
- Responsive design

**Estructura:**
```javascript
export default function Sidebar() {
  const { user, logout } = useAuth()
  
  // Menús según rol del usuario
  const operatorMenus = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Pacientes', path: '/pacientes', icon: '👥' },
    { label: 'Citas', path: '/citas', icon: '📅' },
    // ... más menús
  ]
  
  const adminMenus = [
    // ... todos los menús
  ]
  
  return (
    <aside className="sidebar">
      {/* Menú items */}
      {/* Logout button */}
    </aside>
  )
}
```

### 3. LoginView.jsx

**Propósito:** Componente de autenticación

**Flujo:**
1. Usuario ingresa credenciales
2. Validación local
3. Envío a backend via `authService.login()`
4. Almacenamiento de token JWT
5. Redirección a dashboard

**Estados manejados:**
- Loading
- Error
- Success
- Validations

### 4. AdminLayout.jsx

**Propósito:** Layout principal para usuarios autenticados

**Estructura:**
```
┌───────────────────────────────────┐
│          Barra Superior           │
├────────────────┬──────────────────┤
│                │                  │
│  Sidebar       │     Contenido    │
│  Navegación    │     Principal    │
│                │                  │
├────────────────┴──────────────────┤
│          Footer / Info            │
└───────────────────────────────────┘
```

### 5. HorarioSemanalPicker.jsx

**Propósito:** Selector de horarios semanales

**Características:**
- Calendario semanal
- Slots de tiempo disponibles
- Validación de horarios
- Visual interactivo

### 6. HorarioMensualPicker.jsx

**Propósito:** Vista mensual de disponibilidad

**Características:**
- Calendario mensual
- Indicadores de disponibilidad
- Navegación mes/año
- Resaltado de días disponibles

---

## 🔌 SERVICIOS Y APIS

### Estructura de Servicios

Cada módulo tiene su propio servicio que maneja las llamadas API:

```
services/
├── authService.js           # POST /login, POST /logout, POST /register
├── citasService.js          # CRUD de citas
├── pacientesService.js      # CRUD de pacientes
├── personalService.js       # CRUD de personal
├── especialidadesService.js # CRUD de especialidades
├── reportesService.js       # GET reportes
├── dashboardService.js      # GET estadísticas
└── usersService.js          # CRUD de usuarios
```

### Patrón Común de Servicio

```javascript
// Ejemplo: citasService.js
import api from '../api'

export const citasService = {
  // Listar citas
  getAll: async (filters = {}) => {
    try {
      const response = await api.get('/citas', { params: filters })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Obtener una cita
  getById: async (id) => {
    const response = await api.get(`/citas/${id}`)
    return response.data
  },

  // Crear cita
  create: async (data) => {
    const response = await api.post('/citas', data)
    return response.data
  },

  // Actualizar cita
  update: async (id, data) => {
    const response = await api.put(`/citas/${id}`, data)
    return response.data
  },

  // Eliminar cita
  delete: async (id) => {
    const response = await api.delete(`/citas/${id}`)
    return response.data
  }
}

export default citasService
```

### api.js - Configuración Axios

```javascript
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: Agregar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor: Manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado → Logout
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### AuthContext.jsx

**Propósito:** Gestionar estado global de autenticación

```javascript
// Ubicación: src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async (token) => {
    try {
      const userData = await authService.validate(token)
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      localStorage.removeItem('token')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### Flujo de Autenticación

```
1. Usuario intenta acceder
   ↓
2. ProtectedRoute verifica token
   ↓
3. Si no hay token → Redirige a Login
   ↓
4. Usuario ingresa credenciales
   ↓
5. authService.login() envía al backend
   ↓
6. Backend valida y retorna token JWT
   ↓
7. Token se almacena en localStorage
   ↓
8. User se actualiza en AuthContext
   ↓
9. Redirige a Dashboard
```

### Seguridad

**✅ Implementado:**
- ✅ Autenticación por JWT
- ✅ Token almacenado en localStorage (considerar sessionStorage)
- ✅ Interceptores para manejar tokens expirados
- ✅ Rutas protegidas por rol
- ✅ HTTPS recomendado en producción

**⚠️ Consideraciones:**
- Usar HTTPS en producción
- Considerar usar httpOnly cookies para tokens
- Implementar CORS correctamente
- Validar datos en cliente Y servidor
- Implementar rate limiting

---

## 🔄 GESTIÓN DE ESTADO

### Context API (Solución Actual)

El proyecto usa React Context API para gestión de estado global:

```javascript
// AuthContext - Autenticación global
- user: Objeto con datos del usuario actual
- isAuthenticated: Boolean de autenticación
- loading: Estado de carga
- login(): Función para autenticarse
- logout(): Función para cerrar sesión
```

### Flujo de Datos

```
Componente
    ↓
useAuth() hook
    ↓
AuthContext
    ↓
Estado Global
```

### Props Drilling vs Context

**Antes (Props Drilling):**
```jsx
<App user={user} logout={logout}>
  <Sidebar user={user} logout={logout}>
    <NavBar user={user} logout={logout}>
      <Profile user={user} logout={logout} />
    </NavBar>
  </Sidebar>
</App>
```

**Después (Context):**
```jsx
<AuthProvider>
  <App>
    <Sidebar>
      <NavBar>
        <Profile /> {/* Accede via useAuth() */}
      </NavBar>
    </Sidebar>
  </App>
</AuthProvider>
```

### Posibles Mejoras

Si la app crece, considerar:
- **Redux Toolkit:** Más estructurado, DevTools
- **Zustand:** Más ligero y simple
- **Recoil:** Atoms y selectors
- **Jotai:** Similar a Recoil

---

## 📍 RUTAS Y NAVEGACIÓN

### App.jsx - Configuración de Rutas

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import LoginView from './views/LoginView'
import Welcome from './views/Welcome'
import Forbidden from './pages/Forbidden'
import Dashboard from './pages/Admin/Dashboard'
import Citas from './pages/Admin/Citas'
import Pacientes from './pages/Admin/Pacientes'
// ... más imports

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/welcome" element={<Welcome />} />

          {/* Rutas protegidas */}
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/citas" element={
              <ProtectedRoute>
                <Citas />
              </ProtectedRoute>
            } />
            {/* ... más rutas */}
          </Route>

          {/* Errores */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
```

### Tabla de Rutas

| Ruta | Componente | Protegida | Descripción |
|------|-----------|-----------|---|
| `/` | Welcome | No | Bienvenida |
| `/login` | LoginView | No | Login |
| `/dashboard` | Dashboard | Sí | Estadísticas |
| `/citas` | Citas | Sí | Gestión de citas |
| `/pacientes` | Pacientes | Sí | Gestión de pacientes |
| `/personal` | Personal | Sí | Gestión de personal |
| `/especialidades` | Especialidades | Sí | Gestión de especialidades |
| `/operadores` | Operadores | Sí | Gestión de operadores |
| `/usuarios` | Users | Sí | Gestión de usuarios |
| `/reportes` | Reportes | Sí | Reportes |
| `/archivados` | Archivados | Sí | Registros archivados |
| `/perfil` | Perfil | Sí | Mi perfil |
| `/forbidden` | Forbidden | Sí | Error 403 |
| `*` | NotFound | No | Error 404 |

---

## 🛠️ CONFIGURACIÓN DE DESARROLLO

### Instalación Local

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd admision-medica_frontend

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env
cp .env.example .env
# Editar .env con variables necesarias

# 4. Iniciar servidor de desarrollo
npm run dev

# Acceder a http://localhost:3000
```

### Variables de Entorno (.env)

```env
# API
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_API_TIMEOUT=30000

# Aplicación
REACT_APP_APP_NAME=Admisión Médica
REACT_APP_ENVIRONMENT=development

# Logging
REACT_APP_DEBUG=true
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Compila para producción
npm run preview          # Previsualiza build de producción

# Calidad de código
npm run lint             # Ejecuta ESLint
npm run lint --fix       # Corrige problemas automáticamente

# Git
git status              # Estado de cambios
git add .               # Agregar cambios
git commit -m "Mensaje" # Commit
git push                # Enviar cambios
```

---

## 🚀 DEPLOYMENT

### Build para Producción

```bash
# 1. Build de optimización
npm run build

# Genera carpeta 'dist/' con archivos optimizados

# 2. Probar build localmente
npm run preview

# 3. Enviar a hosting
# Subir contenido de 'dist/' al servidor
```

### Opciones de Hosting

#### Option 1: Vercel (Recomendado)
```bash
npm install -g vercel
vercel login
vercel
```

#### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option 3: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build y ejecutar Docker
docker build -t admision-medica-frontend .
docker run -p 3000:80 admision-medica-frontend
```

#### Option 4: Servidor Linux (Apache/Nginx)

**Apache:**
```apache
<VirtualHost *:80>
    ServerName admision-medica.com
    DocumentRoot /var/www/html/admision-medica/dist
    <Directory /var/www/html/admision-medica/dist>
        RewriteEngine On
        RewriteBase /
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [L]
    </Directory>
</VirtualHost>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name admision-medica.com;

    root /var/www/html/admision-medica/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🧪 TESTING

### Testing Frontend

#### Estructura Recomendada

```
src/
├── __tests__/
│   ├── components/
│   │   └── ProtectedRoute.test.jsx
│   ├── pages/
│   │   └── Dashboard.test.jsx
│   └── services/
│       └── authService.test.js
```

#### Ejemplo: Test de Componente

```javascript
// src/__tests__/components/ProtectedRoute.test.jsx
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import { AuthProvider } from '../../contexts/AuthContext'

test('ProtectedRoute redirige a login si no está autenticado', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  )
  
  // Verificar que fue redirigido
  expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
})
```

#### Herramientas Recomendadas

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^0.30.0",
    "jsdom": "^21.0.0"
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

#### 1. Error: "Cannot find module 'react'"

**Causa:** Dependencias no instaladas  
**Solución:**
```bash
npm install
# O limpiar node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 2. Error: "Unexpected token" en JSX

**Causa:** Vite no configurado correctamente  
**Solución:**
```bash
# Verificar vite.config.js
# Asegurar que @vitejs/plugin-react está instalado
npm install @vitejs/plugin-react
```

#### 3. CORS errors: "Access to XMLHttpRequest blocked"

**Causa:** Backend no permite CORS  
**Solución en api.js:**
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Para cookies
})
```

**Backend debe tener CORS habilitado:**
```
[Depende del framework backend - Ver manual backend]
```

#### 4. Token expirado en cada recarga

**Causa:** Token expira rápido o no se guarda bien  
**Solución:**
```javascript
// Usar sessionStorage en lugar de localStorage
const token = sessionStorage.getItem('token')
sessionStorage.setItem('token', data.token)
```

#### 5. Cambios no se reflejan en el navegador

**Causa:** Caché del navegador  
**Solución:**
```bash
# Limpiar caché y recargar
Ctrl+Shift+Delete (Windows)
Cmd+Shift+Delete (Mac)

# O en desarrollo
npm run dev # Reiniciar servidor
```

#### 6. "Cannot read property 'user' of undefined"

**Causa:** AuthContext no envuelve el componente  
**Solución:**
```jsx
// En App.jsx, envolver rutas con AuthProvider
<AuthProvider>
  <Routes>
    {/* ... */}
  </Routes>
</AuthProvider>
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

### Recursos Útiles

**React:**
- [Documentación Oficial](https://react.dev)
- [React Router](https://reactrouter.com)
- [Context API Guide](https://react.dev/learn/passing-data-deeply-with-context)

**Vite:**
- [Vite Documentation](https://vitejs.dev)
- [Vite API Reference](https://vitejs.dev/config/)

**Axios:**
- [Axios Documentation](https://axios-http.com)
- [Interceptors Guide](https://axios-http.com/docs/interceptors)

**Seguridad:**
- [JWT.io](https://jwt.io)
- [OWASP Security](https://owasp.org)

---

## ❌ BACKEND (PENDIENTE)

La siguiente sección será completada por el equipo de backend:

**Por Completar:**

```
## Backend - [Framework: Laravel/Node/Python]

### Estructura del Backend
- [ ] Descripción del framework usado
- [ ] Estructura de carpetas
- [ ] Controladores principales
- [ ] Modelos de datos
- [ ] Validaciones

### API Endpoints
- [ ] Autenticación: POST /api/auth/login
- [ ] Pacientes: GET/POST/PUT/DELETE /api/pacientes
- [ ] Citas: GET/POST/PUT/DELETE /api/citas
- [ ] Personal: GET /api/personal
- [ ] Especialidades: GET /api/especialidades
- [ ] Reportes: GET /api/reportes
- [ ] ... más endpoints

### Base de Datos
- [ ] Schema/Migraciones
- [ ] Modelos de datos
- [ ] Relaciones
- [ ] Índices

### Autenticación Backend
- [ ] Generación de JWT
- [ ] Validación de JWT
- [ ] Refresh tokens
- [ ] Logout

### Validaciones
- [ ] Validaciones de entrada
- [ ] Manejo de errores
- [ ] Códigos de respuesta HTTP
- [ ] Mensajes de error

### Deployment Backend
- [ ] Configuración de servidor
- [ ] Variables de entorno
- [ ] Dockerfile/Docker Compose
- [ ] CI/CD Pipeline

### Testing Backend
- [ ] Unit tests
- [ ] Integration tests
- [ ] API tests

### Troubleshooting Backend
- [ ] Problemas comunes
- [ ] Soluciones

### Performance
- [ ] Caching
- [ ] Query optimization
- [ ] Rate limiting
- [ ] Logging
```

---

## 📝 NOTAS IMPORTANTES

### Para el Equipo Frontend

✅ **Checklist de Calidad:**
- [ ] Todos los componentes tienen propTypes/TypeScript
- [ ] Estilos responsive y cross-browser compatible
- [ ] Error handling en todos los servicios
- [ ] Loading states en todas las acciones async
- [ ] Validación de datos en cliente
- [ ] Código comentado en partes complejas
- [ ] Sin console.log en producción
- [ ] Componentes pequeños y reutilizables

### Para el Equipo Backend

📋 **Requerimientos de API:**
- [ ] Todos los endpoints retornan JSON
- [ ] Códigos HTTP correctos (200, 201, 400, 401, 403, 404, 500)
- [ ] Respuestas con estructura consistente
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Validación y sanitización de datos
- [ ] Logging de errores
- [ ] Documentación de endpoints

### Comunicación Frontend-Backend

**Formato de respuesta esperado:**
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Operación exitosa"
}
```

**En caso de error:**
```json
{
  "success": false,
  "error": "error_code",
  "message": "Descripción del error",
  "details": { /* detalles adicionales */ }
}
```

---

## 📞 CONTACTO Y SOPORTE

**Equipo Frontend:**
- Email: frontend@admision-medica.com
- Slack: #frontend-development

**Equipo Backend:**
- Email: backend@admision-medica.com
- Slack: #backend-development

**DevOps/Deployment:**
- Email: devops@admision-medica.com
- Slack: #infrastructure

---

## 📜 HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Junio 2026 | Versión inicial - Frontend completado |
| 2.0 | Pendiente | Backend será agregado por equipo correspondiente |

---

**© 2026 Sistema de Admisión Médica - Manual Técnico**

**Última actualización:** Junio 2026  
**Estado:** Frontend completado, Backend pendiente  
**Documento:** Técnico - Confidencial

---

## 🎯 PRÓXIMOS PASOS

### Para Completar el Manual

1. **Equipo Backend debe agregar:**
   - Descripción de la arquitectura backend
   - Endpoints de API documentados
   - Schema de base de datos
   - Instrucciones de setup
   - Variables de entorno
   - Deployment backend

2. **Equipo DevOps debe agregar:**
   - CI/CD pipeline
   - Monitoreo y logging
   - Backup y recuperación
   - Escalabilidad

3. **Integración y Testing:**
   - Tests de integración frontend-backend
   - Tests end-to-end
   - Documentación de test cases

---

**Documento para entregar al Backend para que lo completen**
