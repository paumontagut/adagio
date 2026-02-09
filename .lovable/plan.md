

# Crear Pagina "Colabora con Adagio"

## Resumen

Crear una nueva pagina `/colabora` con un bloque de contenido en estilo liquid glass y un boton que abre el Google Form en nueva pestana. Anadir el enlace en la barra de navegacion principal.

---

## Cambios necesarios

### 1. Nueva pagina: `src/pages/Colabora.tsx`

Pagina independiente con el siguiente contenido:

- **Header**: Logo de Adagio (h-16) enlazado a `/` y boton de contacto, siguiendo el patron de las paginas legales.
- **Bloque central** con efecto glassmorphism (`bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem]`), coherente con el panel principal de Index.
- **Titulo**: "Ayudanos a dar voz a mas personas"
- **Texto**: Copy exacto proporcionado.
- **Boton CTA**: "Quiero colaborar" con icono de enlace externo (ExternalLink de lucide-react), abriendo `https://forms.gle/NECq49HXrzDV1e7b7` en `target="_blank"` con `rel="noopener noreferrer"`.
- **Microcopy**: "Se abre en Google Forms (enlace externo)" debajo del boton.
- **Texto de privacidad**: Con enlace a `/privacy-policy` (ya existe).
- **Footer**: Reutilizando el componente `<Footer />` existente.
- **Fondo**: `backgroundColor: #F5F8DE` igual que Index.
- **Responsive**: Boton ancho completo en movil (`w-full sm:w-auto`), padding reducido en pantallas pequenas.

### 2. Ruta en `src/App.tsx`

Anadir la ruta:

```
<Route path="/colabora" element={<Colabora />} />
```

### 3. Menu de navegacion en `src/pages/Index.tsx`

Anadir un tercer boton en la barra flotante, entre los botones existentes (Transcribir/Entrenar) y el separador:

```
<button onClick={() => navigate('/colabora')} ...>
  Colaborar
</button>
```

En movil se mostrara "Colaborar" (texto corto). En desktop: "Colabora con Adagio".

### 4. Footer (opcional pero recomendado)

Anadir un enlace a `/colabora` en la columna "Legal" o crear una nueva seccion en el Footer.

---

## Detalle tecnico

### Estructura de `Colabora.tsx`

```text
+----------------------------------------------+
|  Logo (link a /)            Boton Contacto   |
+----------------------------------------------+
|                                              |
|   +--------------------------------------+   |
|   |  Glassmorphism Card                  |   |
|   |                                      |   |
|   |  Titulo (h1)                         |   |
|   |  Texto descriptivo                   |   |
|   |                                      |   |
|   |  [Quiero colaborar ↗]  (boton CTA)   |   |
|   |                                      |   |
|   |  Microcopy (Google Forms)            |   |
|   |  Texto privacidad + link             |   |
|   +--------------------------------------+   |
|                                              |
+----------------------------------------------+
|  Footer                                      |
+----------------------------------------------+
```

### Estilos del boton CTA

- Fondo teal primario (`bg-[#005C64]`) con efecto glass sutil.
- Hover: glow suave con `shadow-lg shadow-[#005C64]/20`.
- Icono `ExternalLink` de lucide-react a la derecha.
- Focus visible: `focus-visible:ring-2 focus-visible:ring-[#005C64]`.
- Responsive: `w-full sm:w-auto` para ancho completo en movil.

### Navegacion actualizada

La barra flotante pasara de 2 a 3 botones. El tercero navegara a `/colabora` usando `useNavigate()` en lugar de cambiar tab, ya que es una pagina separada.

---

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/Colabora.tsx` | Crear nuevo |
| `src/App.tsx` | Anadir ruta `/colabora` |
| `src/pages/Index.tsx` | Anadir boton "Colaborar" en la barra de navegacion |

