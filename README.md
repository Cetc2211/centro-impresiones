# 🖨️ Centro de Impresiones y Papelería

Sistema completo de gestión para centros de impresiones con soporte para impresión directa, detección de impresoras en red y contabilidad automática.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Características Principales

### 🖨️ Sistema de Impresión Directa
- **Visor de documentos** integrado (PDF, DOC, imágenes)
- **Detección de impresoras** en red WiFi
- Soporte para **IPP** y **JetDirect/Socket**
- Opciones de **dúplex automático** y **pares/impares**
- **Arrastrar y soltar** archivos para imprimir

### 📊 Dashboard Inteligente
- Métricas en tiempo real
- Gráficos de rendimiento semanal
- Distribución de uso por impresora
- Alertas de inventario bajo
- Seguimiento de impresiones personales

### 💰 Gestión Financiera
- Cálculo automático de costos y ganancias
- **Modo "Uso Personal"** (contabiliza sin costo)
- Reportes detallados por período
- Margen de ganancia en tiempo real

### 📦 Inventario Completo
- Papel, tóner, tinta, insumos y papelería
- Alertas de stock bajo
- Valoración de inventario
- Consumo automático al imprimir

### 🏪 Punto de Venta
- Carrito de compras integrado
- Múltiples métodos de pago
- Actualización automática de inventario

## 🚀 Despliegue en Vercel

### Opción 1: Un Clic
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TU_USUARIO/centro-impresiones)

### Opción 2: Manual

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/centro-impresiones.git
cd centro-impresiones

# 2. Instala dependencias
npm install
# o
bun install

# 3. Despliega en Vercel
npx vercel
```

### Opción 3: Desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js
5. Haz clic en "Deploy"

## 💻 Desarrollo Local

```bash
# Instalar dependencias
bun install

# Iniciar servidor de desarrollo
bun run dev

# Construir para producción
bun run build

# Iniciar servidor de producción
bun start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🖨️ Impresoras Soportadas

| Modelo | Tipo | Dúplex | Color | Protocolo |
|--------|------|--------|-------|-----------|
| HP Color LaserJet Pro M479fdw | Láser | ✅ Auto | ✅ | IPP (631) |
| HP LaserJet Pro M404n | Láser | ❌ Manual* | ❌ | Socket (9100) |
| HP Smart Tank 570 | Inyección | ✅ Auto | ✅ | IPP (631) |

*Para dúplex manual: imprimir pares, voltear papel, imprimir impares.

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── page.tsx          # Aplicación principal
│   │   ├── layout.tsx        # Layout raíz
│   │   └── globals.css       # Estilos globales
│   ├── components/ui/        # Componentes shadcn/ui
│   └── lib/                  # Utilidades
├── mini-services/
│   └── print-service/        # Servicio de impresión (requiere servidor dedicado)
├── public/                   # Archivos estáticos
└── package.json
```

## ⚙️ Configuración de Impresoras

### Detección en Red
1. Ve a la pestaña "Impresoras"
2. Haz clic en "Escanear Red"
3. Las impresoras se detectarán automáticamente

### Conexión WiFi Direct
Para impresoras que soportan WiFi Direct:
1. Conecta tu dispositivo a la red de la impresora
2. Ingresa la IP de la impresora manualmente

### IPP (Internet Printing Protocol)
```typescript
// Configuración de ejemplo
{
  ip: "192.168.1.100",
  port: 631,
  protocol: "ipp"
}
```

## 🔧 API del Servicio de Impresión

El mini-servicio de impresión corre en el puerto 3005:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/printers` | GET | Lista impresoras detectadas |
| `/scan` | POST | Escanea la red |
| `/print` | POST | Envía trabajo de impresión |
| `/jobs` | GET | Estado de trabajos |

> ⚠️ **Nota:** El servicio de impresión directa requiere un servidor dedicado (no funciona en Vercel serverless).

## 📱 Capturas de Pantalla

### Dashboard Principal
- Métricas en tiempo real
- Gráficos de rendimiento
- Alertas de inventario

### Visor de Documentos
- Soporte PDF, DOC, imágenes
- Navegación entre páginas
- Zoom y vista previa

### Opciones de Impresión
- Selección de impresora
- Configuración de dúplex
- Modo uso personal

## 🛠️ Tecnologías Utilizadas

- **Framework:** Next.js 16 con App Router
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4
- **Componentes:** shadcn/ui + Radix UI
- **Estado:** Zustand
- **Iconos:** Lucide React
- **Gráficos:** Recharts

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para tu negocio.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios mayores.

---

Desarrollado con ❤️ para centros de impresiones y papelerías.
