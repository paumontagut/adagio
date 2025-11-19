import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer"; // Importamos tu Footer oficial
import logo from "@/assets/logo.svg";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white bg-[#F5F8DE] text-[#0D0C1D] flex flex-col">
      
      {/* --- NAVBAR FLOTANTE SIMPLIFICADA --- */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center justify-between gap-4 px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 rounded-full shadow-sm w-full max-w-5xl">
          
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Adagio Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-tight">Adagio</span>
          </Link>

          <div className="flex items-center gap-2">
             <Link to="/">
                <Button variant="ghost" className="rounded-full hover:bg-black/5 text-[#0D0C1D]">
                   <ArrowLeft className="w-4 h-4 mr-2" />
                   Volver
                </Button>
             </Link>
          </div>
        </nav>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        
        {/* Cabecera de Página */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-[#005C64]/10 rounded-full mb-4">
             <Lock className="w-8 h-8 text-[#005C64]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D0C1D] tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-[#0D0C1D]/60 font-medium">
            Última actualización: 10/11/2025
          </p>
        </div>

        {/* --- PANEL DE CRISTAL (Contenedor del Texto) --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
            
            {/* Decoración de fondo sutil */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#90C2E7]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="space-y-12">
            
                {/* Introduction */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-[#005C64]">Introducción y alcance</h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                    Esta Política de Privacidad explica qué información tratamos cuando usted utiliza nuestros sitios y aplicaciones (conjuntamente, los "Servicios"), cómo la tratamos y qué opciones tiene para gestionarla. Se aplica a su uso de nuestra web y aplicación móvil o de escritorio, a nuestras extensiones e integraciones, y a las comunicaciones que mantengamos con usted por cualquier canal. Al acceder o utilizar los Servicios, usted reconoce que ha leído y comprende esta Política y, cuando corresponda, presta su consentimiento en los términos que se detallan a continuación. Si no acepta esta Política, no podremos prestarle determinados Servicios que requieren tratamiento de datos personales sensibles.
                    </p>
                </section>

                {/* Biometric Data Summary (Tarjeta Destacada) */}
                <section className="bg-[#005C64]/5 border border-[#005C64]/10 rounded-3xl p-8">
                    <h2 className="text-xl font-bold mb-4 text-[#005C64] flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    Resumen sobre datos biométricos y de salud
                    </h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed">
                    La voz contiene características físicas y fisiológicas únicas que pueden identificar de forma permanente a una persona. Asimismo, los patrones de la voz pueden revelar, de forma indirecta, indicios sobre su estado de salud o factores neurológicos o respiratorios. Por esa razón, tratamos sus grabaciones de voz como <strong>datos biométricos</strong> y consideramos que pueden incluir <strong>datos de salud</strong> implícitos. Para procesarlos requerimos <strong>consentimiento explícito</strong>, y hemos completado una <strong>Evaluación de Impacto en Protección de Datos (EIPD)</strong> de conformidad con el art. 35 del RGPD. Más abajo encontrará un resumen de las conclusiones y controles aplicados.
                    </p>
                </section>

                {/* Responsible Party */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-[#005C64]">Responsable del tratamiento y contacto</h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                    El responsable del tratamiento es Adagio ("Adagio", "nosotros"). Puede comunicarse con nuestro Delegado de Protección de Datos a través del Centro de Privacidad disponible en la aplicación, donde encontrará los formularios para ejercer sus derechos y un canal de contacto específico ("Contactar DPO"). Atenderemos sus solicitudes en los plazos legalmente establecidos y podremos solicitarle información adicional para verificar su identidad.
                    </p>
                </section>

                {/* Data We Collect */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-[#005C64]">Qué datos tratamos</h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg mb-4">
                    Tratamos tres categorías principales de información. Primero, <strong>datos que usted nos facilita</strong>: nombre, datos de contacto, credenciales de cuenta, país o región, preferencias, y, cuando usted decide aportarlas, <strong>grabaciones de su voz</strong> y sus <strong>transcripciones</strong> o anotaciones asociadas. Si un menor utiliza los Servicios, recogemos los datos del progenitor o representante legal necesarios para verificar el consentimiento. Cuando usted lo autoriza, también podemos registrar la información de una persona de apoyo (p. ej., cuidador o asistente) para comunicaciones operativas.
                    </p>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg mb-4">
                    Segundo, <strong>datos que se generan automáticamente</strong> cuando usa los Servicios: identificadores técnicos de dispositivo y navegador, dirección IP, sistema operativo, idioma, configuración del micrófono, métricas de sesión y registros de actividad.
                    </p>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                    Tercero, <strong>datos procedentes de terceros</strong> cuando usted conecta integraciones voluntarias (por ejemplo, plataformas de videoconferencia o extensiones), en cuyo caso recibimos la información estrictamente necesaria para activar la funcionalidad que usted solicita. No utilizamos rastreadores de publicidad entre sitios ni huellas digitales de dispositivos; nuestro uso de cookies y almacenamiento local se limita a fines operativos esenciales, como mantener su sesión y la seguridad.
                    </p>
                </section>

                {/* Voice Biometric Nature */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-[#005C64]">Naturaleza biométrica de su voz y posibles inferencias de salud</h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg">
                    Sus grabaciones de voz se tratan como datos biométricos porque incluyen características acústicas y temporales que permiten su identificación única, como la frecuencia fundamental, los formantes vocales y un espectrograma característico, así como ritmo, pausas y entonación. Estas mismas señales pueden revelar de forma no intencionada información de salud, por ejemplo, indicios neurológicos, fatiga vocal o condiciones respiratorias. Somos transparentes respecto a este riesgo y por eso exigimos un consentimiento reforzado, aplicamos minimización de datos y restringimos cualquier uso no esencial.
                    </p>
                </section>

                {/* Processing Purposes */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-[#005C64]">Finalidades del tratamiento</h2>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg mb-4">
                    Utilizamos sus datos para tres finalidades claramente diferenciadas. En primer lugar, <strong>prestación del servicio de transcripción</strong>: procesamos sus grabaciones para convertirlas en texto y, cuando usted lo solicita, para sintetizar una voz clara que reproduzca su mensaje. Este tratamiento se ejecuta para cumplir con el servicio que usted pide y, dada la naturaleza sensible de la voz, lo amparamos también en su consentimiento explícito.
                    </p>
                    <p className="text-[#0D0C1D]/80 leading-relaxed text-lg mb-4">
                    En segundo lugar, <strong>entrenamiento y mejora de modelos</strong>: únicamente si usted lo autoriza de forma separada y revocable, utilizamos fragmentos breves de audio, con sus transcripciones y metadatos, para entrenar, validar y mejorar nuestros algoritmos de reconocimiento de voz y accesibilidad. Esta finalidad es