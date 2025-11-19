import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo.svg";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white bg-[#F5F8DE] text-[#0D0C1D] flex flex-col">
      {/* --- BOTÓN "VOLVER" FLOTANTE --- */}
      <div className="fixed top-6 right-6 z-50">
        <Link to="/">
          <Button
            variant="ghost"
            className="rounded-full bg-white/70 backdrop-blur-md border border-white/50 hover:bg-black/5 text-[#0D0C1D] shadow-sm px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      {/* CAMBIO 1: Ancho aumentado a max-w-7xl y paddings ajustados para coincidir EXACTAMENTE con el Footer */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-20">
        {/* Cabecera de Página (Logo y Título) */}
        <div className="text-center mb-16 space-y-6">
          {/* CAMBIO 2: Logo mucho más grande (h-32 a h-40) */}
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img
              src={logo}
              alt="Adagio Logo"
              className="h-32 md:h-40 w-auto -ml-4" // Aumentado significativamente
            />
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold text-[#0D0C1D] tracking-tight">Política de Privacidad</h1>
            <p className="text-[#0D0C1D]/60 font-medium text-lg">Última actualización: 10/11/2025</p>
          </div>
        </div>

        {/* --- PANEL DE CRISTAL (Contenedor del Texto) --- */}
        {/* Este contenedor ahora ocupa todo el ancho (max-w-7xl heredado del main) */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-16 shadow-sm relative overflow-hidden">
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#90C2E7]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Contenedor interno para limitar el ancho del TEXTO (para que sea legible) */}
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Introduction */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Introducción y alcance</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-xl">
                Esta Política de Privacidad explica qué información tratamos cuando usted utiliza nuestros sitios y
                aplicaciones (conjuntamente, los "Servicios"), cómo la tratamos y qué opciones tiene para gestionarla.
                Se aplica a su uso de nuestra web y aplicación móvil o de escritorio, a nuestras extensiones e
                integraciones, y a las comunicaciones que mantengamos con usted por cualquier canal. Al acceder o
                utilizar los Servicios, usted reconoce que ha leído y comprende esta Política y, cuando corresponda,
                presta su consentimiento en los términos que se detallan a continuación. Si no acepta esta Política, no
                podremos prestarle determinados Servicios que requieren tratamiento de datos personales sensibles.
              </p>
            </section>

            {/* Biometric Data Summary (Tarjeta Destacada) */}
            <section className="bg-[#005C64]/5 border border-[#005C64]/10 rounded-3xl p-10">
              <h2 className="text-2xl font-bold mb-6 text-[#005C64] flex items-center gap-3">
                Resumen sobre datos biométricos y de salud
              </h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                La voz contiene características físicas y fisiológicas únicas que pueden identificar de forma permanente
                a una persona. Asimismo, los patrones de la voz pueden revelar, de forma indirecta, indicios sobre su
                estado de salud o factores neurológicos o respiratorios. Por esa razón, tratamos sus grabaciones de voz
                como <strong>datos biométricos</strong> y consideramos que pueden incluir{" "}
                <strong>datos de salud</strong> implícitos. Para procesarlos requerimos{" "}
                <strong>consentimiento explícito</strong>, y hemos completado una{" "}
                <strong>Evaluación de Impacto en Protección de Datos (EIPD)</strong> de conformidad con el art. 35 del
                RGPD. Más abajo encontrará un resumen de las conclusiones y controles aplicados.
              </p>
            </section>

            {/* Responsible Party */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Responsable del tratamiento y contacto</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                El responsable del tratamiento es Adagio ("Adagio", "nosotros"). Puede comunicarse con nuestro Delegado
                de Protección de Datos a través del Centro de Privacidad disponible en la aplicación, donde encontrará
                los formularios para ejercer sus derechos y un canal de contacto específico ("Contactar DPO").
                Atenderemos sus solicitudes en los plazos legalmente establecidos y podremos solicitarle información
                adicional para verificar su identidad.
              </p>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Qué datos tratamos</h2>
              <div className="space-y-4 text-[#0D0C1D]/80 leading-relaxed text-lg">
                <p>
                  Tratamos tres categorías principales de información. Primero,{" "}
                  <strong>datos que usted nos facilita</strong>: nombre, datos de contacto, credenciales de cuenta, país
                  o región, preferencias, y, cuando usted decide aportarlas, <strong>grabaciones de su voz</strong> y
                  sus <strong>transcripciones</strong> o anotaciones asociadas. Si un menor utiliza los Servicios,
                  recogemos los datos del progenitor o representante legal necesarios para verificar el consentimiento.
                  Cuando usted lo autoriza, también podemos registrar la información de una persona de apoyo (p. ej.,
                  cuidador o asistente) para comunicaciones operativas.
                </p>
                <p>
                  Segundo, <strong>datos que se generan automáticamente</strong> cuando usa los Servicios:
                  identificadores técnicos de dispositivo y navegador, dirección IP, sistema operativo, idioma,
                  configuración del micrófono, métricas de sesión y registros de actividad.
                </p>
                <p>
                  Tercero, <strong>datos procedentes de terceros</strong> cuando usted conecta integraciones voluntarias
                  (por ejemplo, plataformas de videoconferencia o extensiones), en cuyo caso recibimos la información
                  estrictamente necesaria para activar la funcionalidad que usted solicita. No utilizamos rastreadores
                  de publicidad entre sitios ni huellas digitales de dispositivos; nuestro uso de cookies y
                  almacenamiento local se limita a fines operativos esenciales, como mantener su sesión y la seguridad.
                </p>
              </div>
            </section>

            {/* Voice Biometric Nature */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Naturaleza biométrica de su voz</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                Sus grabaciones de voz se tratan como datos biométricos porque incluyen características acústicas y
                temporales que permiten su identificación única, como la frecuencia fundamental, los formantes vocales y
                un espectrograma característico, así como ritmo, pausas y entonación. Estas mismas señales pueden
                revelar de forma no intencionada información de salud, por ejemplo, indicios neurológicos, fatiga vocal
                o condiciones respiratorias. Somos transparentes respecto a este riesgo y por eso exigimos un
                consentimiento reforzado, aplicamos minimización de datos y restringimos cualquier uso no esencial.
              </p>
            </section>

            {/* Processing Purposes */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Finalidades del tratamiento</h2>
              <div className="space-y-4 text-[#0D0C1D]/80 leading-relaxed text-lg">
                <p>
                  Utilizamos sus datos para tres finalidades claramente diferenciadas. En primer lugar,{" "}
                  <strong>prestación del servicio de transcripción</strong>: procesamos sus grabaciones para
                  convertirlas en texto y, cuando usted lo solicita, para sintetizar una voz clara que reproduzca su
                  mensaje. Este tratamiento se ejecuta para cumplir con el servicio que usted pide y, dada la naturaleza
                  sensible de la voz, lo amparamos también en su consentimiento explícito.
                </p>
                <p>
                  En segundo lugar, <strong>entrenamiento y mejora de modelos</strong>: únicamente si usted lo autoriza
                  de forma separada y revocable, utilizamos fragmentos breves de audio, con sus transcripciones y
                  metadatos, para entrenar, validar y mejorar nuestros algoritmos de reconocimiento de voz y
                  accesibilidad. Esta finalidad es <strong>opcional</strong> y no es necesaria para que la transcripción
                  funcione.
                </p>
                <p>
                  En tercer lugar, <strong>almacenamiento personal y experiencia</strong>: cuando usted lo aprueba,
                  conservamos sus grabaciones y transcripciones en su perfil para facilitar consultas posteriores,
                  personalizar su experiencia y acelerar la precisión para su propio caso de uso.
                </p>
              </div>
            </section>

            {/* Resto de secciones (Simplificadas para brevedad en el ejemplo, pero mantenidas en estructura) */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-[#005C64]">Bases jurídicas</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                Para la prestación de la transcripción sustentamos el tratamiento en la{" "}
                <strong>ejecución del contrato</strong> y, por el carácter biométrico y la posible presencia de datos de
                salud, recabamos además su <strong>consentimiento explícito</strong> conforme a los artículos
                6.1.a/6.1.b y 9.2.a del RGPD. El <strong>entrenamiento de modelos</strong> se basa exclusivamente en su{" "}
                <strong>consentimiento explícito independiente</strong> y revocable sin perjuicio de su cuenta.
              </p>
            </section>
          </div>
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};
