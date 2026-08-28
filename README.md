# 📑 Cotizador de Proformas - Grupo Castro

Sistema web de alto rendimiento diseñado para la generación de proformas dinámicas en formato PDF. Desarrollado con **Astro** y **Tailwind CSS**, permite a los técnicos de **Grupo Castro** (Huancayo, Perú) gestionar presupuestos de forma ágil y profesional.

## 🚀 Características Principales

* **Carga de Datos Ligera**: Interfaz optimizada sin carga de imágenes pesadas para un rendimiento inmediato.
* **Crecimiento Dinámico**: La lista de productos y los bloques de firma/QR se ajustan automáticamente según la cantidad de ítems, eliminando espacios en blanco innecesarios.
* **Exportación Profesional**: Generación de documentos PDF institucionales mediante `jsPDF` y `jspdf-autotable`.
* **Identidad Corporativa**: Cabecera en el PDF configurada para el logo oficial, RUC y datos de contacto de la empresa.
* **QR de Verificación**: Inclusión automática de código QR vinculado a la web oficial de Grupo Castro.

## 🛠️ Tecnologías Utilizadas

* **Framework**: [Astro](https://astro.build/)
* **UI Library**: [Preact](https://preactjs.com/) (Reactividad ligera)
* **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
* **Motores de PDF**: 
    * [jsPDF](https://github.com/parallax/jsPDF)
    * [jsPDF-AutoTable](https://github.com/simonbengtsson/jspdf-autotable)

## 📂 Estructura del Proyecto

```text
src/
├── components/
│   ├── Cotizador.jsx    # Formulario y tabla de captura de datos
│   └── pdf.jsx          # Motor de generación y previsualización de PDF
└── pages/
    └── index.astro      # Vista principal de la aplicación
