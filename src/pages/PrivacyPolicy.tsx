import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo.svg";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white bg-[#F5F8DE] text-[#0D0C1D] flex flex-col">
      {/* --- BOTÓN "VOLVER" FLOTANTE --- */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <Link to="/">
          <Button
            variant="ghost"
            className="rounded-full bg-white/70 backdrop-blur-md border border-white/50 hover:bg-black/5 text-[#0D0C1D] shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-16 sm:pt-20 pb-12 sm:pb-20">
        {/* Cabecera de Página */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-4 sm:space-y-6">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src={logo} alt="Adagio Logo" className="h-16 sm:h-24 md:h-32 lg:h-40 w-auto" />
          </Link>

          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-[#0D0C1D] tracking-tight">Política de Privacidad</h1>
            <p className="text-[#0D0C1D]/60 font-medium text-sm sm:text-base md:text-lg">Última actualización: 10/11/2025</p>
          </div>
        </div>

        {/* --- PANEL DE CRISTAL --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-8 md:p-16 shadow-sm relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-[#90C2E7]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Contenedor de texto limitado para lectura cómoda */}
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 md:space-y-16">
            {/* Introduction */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Introducción y alcance</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-base sm:text-lg md:text-xl">
                Esta Política de Privacidad explica qué información tratamos cuando usted utiliza nuestros sitios y
                aplicaciones (conjuntamente, los "Servicios"), cómo la tratamos y qué opciones tiene para gestionarla.
                Se aplica a su uso de nuestra web y aplicación móvil o de escritorio, a nuestras extensiones e
                integraciones, y a las comunicaciones que mantengamos con usted por cualquier canal. Al acceder o
                utilizar los Servicios, usted reconoce que ha leído y comprende esta Política y, cuando corresponda,
                presta su consentimiento en los términos que se detallan a continuación. Si no acepta esta Política, no
                podremos prestarle determinados Servicios que requieren tratamiento de datos personales sensibles.
              </p>
            </section>

            {/* Biometric Data Summary */}
            <section className="bg-[#005C64]/5 border border-[#005C64]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64] flex items-center gap-2 sm:gap-3">
                Resumen sobre datos biométricos y de salud
              </h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                La voz contiene características físicas y fisiológicas únicas que pueden identificar de forma permanente
                a una persona. Asimismo, los patrones de la voz pueden revelar, de forma indirecta, indicios sobre su
                estado de salud o factores neurológicos o respiratorios. Por esa razón, tratamos sus grabaciones de voz
                como <strong>datos biométricos</strong> y consideramos que pueden incluir{" "}
                <strong>datos de salud</strong> implícitos. Para procesarlos requerimos{" "}
                <strong>consentimiento explícito</strong>.
              </p>
            </section>

            {/* Responsible Party */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Responsable del tratamiento y contacto</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                El responsable del tratamiento es Adagio ("Adagio", "nosotros"). Puede comunicarse con nuestro Delegado
                de Protección de Datos a través del Centro de Privacidad disponible en la aplicación, donde encontrará
                los formularios para ejercer sus derechos y un canal de contacto específico ("Contactar DPO").
                Atenderemos sus solicitudes en los plazos legalmente establecidos y podremos solicitarle información
                adicional para verificar su identidad.
              </p>
            </section>

            {/* Data We Collect */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Qué datos tratamos</h2>
              <div className="space-y-3 sm:space-y-4 text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Naturaleza biométrica de su voz</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Finalidades del tratamiento</h2>
              <div className="space-y-3 sm:space-y-4 text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
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

            {/* Legal Basis */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Bases jurídicas</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Para la prestación de la transcripción sustentamos el tratamiento en la{" "}
                <strong>ejecución del contrato</strong> y, por el carácter biométrico y la posible presencia de datos de
                salud, recabamos además su <strong>consentimiento explícito</strong> conforme a los artículos
                6.1.a/6.1.b y 9.2.a del RGPD. El <strong>entrenamiento de modelos</strong> se basa exclusivamente en su{" "}
                <strong>consentimiento explícito independiente</strong> y revocable sin perjuicio de su cuenta. El uso
                de datos técnicos y de seguridad se basa en intereses legítimos, como mantener la integridad del
                servicio y prevenir fraude, siempre respetando sus derechos y expectativas.
              </p>
            </section>

            {/* AI Processing */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Cómo tratamos sus grabaciones con IA</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Sus grabaciones solo se obtienen por su acción intencional dentro de los Servicios. No realizamos
                grabaciones en segundo plano ni "siempre encendido". Para el procesamiento automático y, cuando usted lo
                ha permitido, para la mejora de modelos, segmentamos el audio en unidades cortas de 1 a 3 segundos,
                asociamos transcripciones y anotaciones, y aplicamos técnicas de anonimización o seudonimización cuando
                es viable. No utilizamos su voz para <strong>identificación</strong> o{" "}
                <strong>autenticación biométrica</strong> ni para elaborar perfiles comerciales. Los modelos, mejoras o
                derivados que generamos a partir de datos <strong>anonimizados</strong> o <strong>agregados</strong> no
                le identificarán y son propiedad de Adagio, sin perjuicio de sus derechos sobre los datos personales
                originales y su capacidad para revocar consentimientos.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Conservación de datos</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Aplicamos plazos diferenciados y limitados. Las <strong>grabaciones biométricas de voz</strong> se
                conservan mientras exista un consentimiento válido y, si usted lo retira, se inicia un proceso de
                eliminación con una ventana técnica de hasta 30 días para garantizar el borrado en sistemas activos y
                copias de seguridad verificadas. La <strong>información sanitaria inferida</strong> que resulte del
                procesamiento no se conserva de forma persistente y se elimina tras completarse la transcripción, salvo
                obligaciones legales. Las <strong>transcripciones</strong> se conservan mientras su cuenta permanezca
                activa o hasta que usted solicite su supresión. Cuando el uso sea para mejora de modelos con
                consentimiento, aplicamos políticas de <strong>minimización</strong>, anonimización progresiva y, en su
                caso, retención por tiempo limitado antes de la anonimización irreversible.
              </p>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Medidas de seguridad</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Protegemos los datos con cifrado de extremo a extremo, incluyendo cifrado fuerte en tránsito y en reposo
                (por ejemplo, AES‑256‑GCM), gestión segura de claves con rotación programada y hardware de seguridad
                cuando procede, controles de acceso de mínimo privilegio, autenticación multifactor para personal
                autorizado, segregación de funciones, monitorización continua y auditorías internas y externas. Nuestras
                copias de seguridad se cifran, se prueban periódicamente y están sujetas a políticas de borrado
                coherentes con este documento. Además, aplicamos técnicas de{" "}
                <strong>anonimización y reducción de riesgo</strong> específicas para datos de voz, como la alteración
                de características acústicas no esenciales, normalización de formantes, supresión de metadatos y
                agregación temporal mínima.
              </p>
            </section>

            {/* Enhanced Rights */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Derechos reforzados y controles</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Usted puede acceder a sus grabaciones originales, a las características derivadas que hayamos generado,
                al historial de uso y a un registro trazable de consentimientos. Puede obtener copia, rectificar datos
                inexactos, <strong>retirar en cualquier momento</strong> los consentimientos (incluido el de
                entrenamiento de modelos, con efecto inmediato), oponerse a que realicemos{" "}
                <strong>inferencias de salud</strong>, solicitar <strong>limitación del tratamiento</strong> y pedir la{" "}
                <strong>portabilidad</strong> de sus datos. Hemos habilitado un procedimiento de{" "}
                <strong>supresión acelerada</strong> para datos biométricos y derivados. La retirada del consentimiento
                de entrenamiento o el ejercicio de oposición <strong>no afectará</strong> a su acceso a la transcripción
                básica.
              </p>
            </section>

            {/* Minors */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Menores de edad</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                No prestamos los Servicios a menores sin el consentimiento verificable del progenitor o representante
                legal. En España, el consentimiento autónomo requiere, como mínimo, 14 años; en otros países del Espacio
                Económico Europeo puede exigirse una edad superior. Si detectamos una cuenta de un menor sin los
                consentimientos apropiados, procederemos a bloquearla y a eliminar los datos, salvo conservación exigida
                por ley.
              </p>
            </section>

            {/* Communications */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Comunicaciones y marketing</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Solo le enviaremos comunicaciones comerciales si usted ha dado su consentimiento o si existe otra base
                legal aplicable. Puede darse de baja en cualquier momento mediante el enlace incluido en los mensajes o
                desde el Centro de Privacidad. Continuaremos enviando comunicaciones estrictamente operativas o de
                seguridad cuando sean imprescindibles.
              </p>
            </section>

            {/* Recipients */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Destinatarios y terceros</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                No vendemos sus datos personales. Compartimos información con{" "}
                <strong>encargados del tratamiento</strong> que nos prestan servicios bajo contrato y siguiendo
                instrucciones documentadas: alojamiento y nube, herramientas de anotación y calidad, ingeniería y
                soporte, ciberseguridad, atención al cliente, análisis operativos y gestión de pagos. Limitamos la
                información a la estrictamente necesaria y exigimos confidencialidad.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Transferencias internacionales</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Podemos tratar y almacenar datos fuera de su país de residencia. Cuando se transfieren datos desde el
                EEE o el Reino Unido a países que no ofrecen un nivel de protección esencialmente equivalente,
                implementamos salvaguardas adecuadas como <strong>Cláusulas Contractuales Tipo</strong> y evaluaciones
                de transferencia, además de medidas técnicas y organizativas complementarias.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Cookies y tecnologías similares</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Utilizamos únicamente tecnologías <strong>estrictamente necesarias</strong> para operar, mantener la
                seguridad de la sesión y recordar preferencias básicas. No empleamos cookies de publicidad
                comportamental ni plug‑ins de terceros con fines de seguimiento entre sitios.
              </p>
            </section>

            {/* Analytics */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Analítica y uso interno</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Analizamos de forma agregada el rendimiento del sistema, la estabilidad y la usabilidad para detectar
                problemas técnicos, comprender tendencias de uso y mejorar la experiencia. Cuando es posible, empleamos{" "}
                <strong>datos agregados o seudonimizados</strong>, y evitamos rastreos innecesarios a nivel individual.
              </p>
            </section>

            {/* California Users */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Usuarios de California y EE. UU.</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Si reside en California u otros estados con legislación específica, puede disponer de derechos
                adicionales. Adagio <strong>no vende</strong> datos personales según la definición aplicable y no
                comparte información con fines de publicidad dirigida. Puede ejercer estos derechos a través del Centro
                de Privacidad.
              </p>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Actualizaciones de esta Política</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Podemos modificar esta Política para reflejar cambios en la ley, en los Servicios o en nuestras
                prácticas. Publicaremos la nueva versión indicando la <strong>fecha de última revisión</strong> y,
                cuando el cambio sea material, le informaremos a través de la aplicación o por medios razonables y
                solicitaremos nuevamente su consentimiento si es necesario.
              </p>
            </section>

            {/* Summary of Key Commitments */}
            <section className="bg-[#005C64]/5 border border-[#005C64]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Resumen de compromisos clave</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Tratamos su voz como dato biométrico y pedimos un <strong>doble consentimiento explícito</strong> cuando
                pueda existir información sanitaria implícita; la <strong>transcripción</strong> se ofrece incluso si no
                consiente el <strong>entrenamiento</strong> de modelos; aplicamos{" "}
                <strong>plazos de conservación limitados</strong> y eliminación tras retiro del consentimiento;
                empleamos <strong>cifrado fuerte</strong> y garantizamos <strong>derechos reforzados</strong>.
              </p>
            </section>

            {/* How to Exercise Rights */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Cómo ejercer sus derechos</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Puede gestionar consentimientos, descargar o borrar datos, y contactar con nuestro DPO desde el{" "}
                <strong>Centro de Privacidad</strong> de la aplicación. Si considera que no hemos atendido adecuadamente
                su solicitud, puede presentar una reclamación ante su autoridad de control de protección de datos.
              </p>
            </section>

            {/* Technical Controls Appendix */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">Anexo: Controles técnicos</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                En la eliminación de datos biométricos y derivados, ejecutamos borrados en sistemas activos y
                programamos la purga en copias de seguridad. Para conjuntos de datos utilizados en entrenamiento con su
                consentimiento, aplicamos procesos de <strong>despersonalización</strong>. En seguridad, empleamos
                rotación de claves, segmentación de redes y registros inmutables.
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
