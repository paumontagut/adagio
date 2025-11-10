import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Adagio</span>
          </Link>
          <Link to="/privacy-center">
            <Button variant="default" size="lg">
              CENTRO DE PRIVACIDAD
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Política de Privacidad de Adagio
          </h1>
          <p className="text-muted-foreground text-sm">
            Última actualización: 10/11/2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Introducción y alcance</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidad explica qué información tratamos cuando usted utiliza nuestros sitios y aplicaciones (conjuntamente, los "Servicios"), cómo la tratamos y qué opciones tiene para gestionarla. Se aplica a su uso de nuestra web y aplicación móvil o de escritorio, a nuestras extensiones e integraciones, y a las comunicaciones que mantengamos con usted por cualquier canal. Al acceder o utilizar los Servicios, usted reconoce que ha leído y comprende esta Política y, cuando corresponda, presta su consentimiento en los términos que se detallan a continuación. Si no acepta esta Política, no podremos prestarle determinados Servicios que requieren tratamiento de datos personales sensibles.
              </p>
            </CardContent>
          </Card>

          {/* Biometric Data Summary */}
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-warning" />
                Resumen sobre datos biométricos y de salud
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                La voz contiene características físicas y fisiológicas únicas que pueden identificar de forma permanente a una persona. Asimismo, los patrones de la voz pueden revelar, de forma indirecta, indicios sobre su estado de salud o factores neurológicos o respiratorios. Por esa razón, tratamos sus grabaciones de voz como <strong>datos biométricos</strong> y consideramos que pueden incluir <strong>datos de salud</strong> implícitos. Para procesarlos requerimos <strong>consentimiento explícito</strong>, y hemos completado una <strong>Evaluación de Impacto en Protección de Datos (EIPD)</strong> de conformidad con el art. 35 del RGPD. Más abajo encontrará un resumen de las conclusiones y controles aplicados.
              </p>
            </CardContent>
          </Card>

          {/* Responsible Party */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Responsable del tratamiento y contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              El responsable del tratamiento es Adagio ("Adagio", "nosotros"). Puede comunicarse con nuestro Delegado de Protección de Datos a través del Centro de Privacidad disponible en la aplicación, donde encontrará los formularios para ejercer sus derechos y un canal de contacto específico ("Contactar DPO"). Atenderemos sus solicitudes en los plazos legalmente establecidos y podremos solicitarle información adicional para verificar su identidad.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Qué datos tratamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Tratamos tres categorías principales de información. Primero, <strong>datos que usted nos facilita</strong>: nombre, datos de contacto, credenciales de cuenta, país o región, preferencias, y, cuando usted decide aportarlas, <strong>grabaciones de su voz</strong> y sus <strong>transcripciones</strong> o anotaciones asociadas. Si un menor utiliza los Servicios, recogemos los datos del progenitor o representante legal necesarios para verificar el consentimiento. Cuando usted lo autoriza, también podemos registrar la información de una persona de apoyo (p. ej., cuidador o asistente) para comunicaciones operativas.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Segundo, <strong>datos que se generan automáticamente</strong> cuando usa los Servicios: identificadores técnicos de dispositivo y navegador, dirección IP, sistema operativo, idioma, configuración del micrófono, métricas de sesión y registros de actividad.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Tercero, <strong>datos procedentes de terceros</strong> cuando usted conecta integraciones voluntarias (por ejemplo, plataformas de videoconferencia o extensiones), en cuyo caso recibimos la información estrictamente necesaria para activar la funcionalidad que usted solicita. No utilizamos rastreadores de publicidad entre sitios ni huellas digitales de dispositivos; nuestro uso de cookies y almacenamiento local se limita a fines operativos esenciales, como mantener su sesión y la seguridad.
            </p>
          </section>

          {/* Voice Biometric Nature */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Naturaleza biométrica de su voz y posibles inferencias de salud</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus grabaciones de voz se tratan como datos biométricos porque incluyen características acústicas y temporales que permiten su identificación única, como la frecuencia fundamental, los formantes vocales y un espectrograma característico, así como ritmo, pausas y entonación. Estas mismas señales pueden revelar de forma no intencionada información de salud, por ejemplo, indicios neurológicos, fatiga vocal o condiciones respiratorias. Somos transparentes respecto a este riesgo y por eso exigimos un consentimiento reforzado, aplicamos minimización de datos y restringimos cualquier uso no esencial.
            </p>
          </section>

          {/* Processing Purposes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Finalidades del tratamiento</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos sus datos para tres finalidades claramente diferenciadas. En primer lugar, <strong>prestación del servicio de transcripción</strong>: procesamos sus grabaciones para convertirlas en texto y, cuando usted lo solicita, para sintetizar una voz clara que reproduzca su mensaje. Este tratamiento se ejecuta para cumplir con el servicio que usted pide y, dada la naturaleza sensible de la voz, lo amparamos también en su consentimiento explícito.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              En segundo lugar, <strong>entrenamiento y mejora de modelos</strong>: únicamente si usted lo autoriza de forma separada y revocable, utilizamos fragmentos breves de audio, con sus transcripciones y metadatos, para entrenar, validar y mejorar nuestros algoritmos de reconocimiento de voz y accesibilidad. Esta finalidad es <strong>opcional</strong> y no es necesaria para que la transcripción funcione.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              En tercer lugar, <strong>almacenamiento personal y experiencia</strong>: cuando usted lo aprueba, conservamos sus grabaciones y transcripciones en su perfil para facilitar consultas posteriores, personalizar su experiencia y acelerar la precisión para su propio caso de uso.
            </p>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Bases jurídicas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para la prestación de la transcripción sustentamos el tratamiento en la <strong>ejecución del contrato</strong> y, por el carácter biométrico y la posible presencia de datos de salud, recabamos además su <strong>consentimiento explícito</strong> conforme a los artículos 6.1.a/6.1.b y 9.2.a del RGPD. El <strong>entrenamiento de modelos</strong> se basa exclusivamente en su <strong>consentimiento explícito independiente</strong> y revocable sin perjuicio de su cuenta. El uso de datos técnicos y de seguridad se basa en intereses legítimos, como mantener la integridad del servicio y prevenir fraude, siempre respetando sus derechos y expectativas.
            </p>
          </section>

          {/* AI Processing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Cómo tratamos sus grabaciones con IA</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sus grabaciones solo se obtienen por su acción intencional dentro de los Servicios. No realizamos grabaciones en segundo plano ni "siempre encendido". Para el procesamiento automático y, cuando usted lo ha permitido, para la mejora de modelos, segmentamos el audio en unidades cortas de 1 a 3 segundos, asociamos transcripciones y anotaciones, y aplicamos técnicas de anonimización o seudonimización cuando es viable. No utilizamos su voz para <strong>identificación</strong> o <strong>autenticación biométrica</strong> ni para elaborar perfiles comerciales. Los modelos, mejoras o derivados que generamos a partir de datos <strong>anonimizados</strong> o <strong>agregados</strong> no le identificarán y son propiedad de Adagio, sin perjuicio de sus derechos sobre los datos personales originales y su capacidad para revocar consentimientos.
            </p>
          </section>

          {/* DPIA */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Evaluación de Impacto en Protección de Datos (EIPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Hemos realizado una EIPD debido al alto riesgo inherente al tratamiento de datos biométricos y a las posibles inferencias de salud. El análisis consideró riesgos como la identificación permanente, la inmutabilidad de la voz, la posibilidad de inferir patologías y la discriminación sanitaria. Tras implantar medidas técnicas y organizativas reforzadas, la EIPD concluyó que el <strong>riesgo residual es medio‑bajo</strong> y que el tratamiento puede continuar bajo supervisión continua. Puede consultar un resumen de la EIPD desde el Centro de Privacidad.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Conservación de datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aplicamos plazos diferenciados y limitados. Las <strong>grabaciones biométricas de voz</strong> se conservan mientras exista un consentimiento válido y, si usted lo retira, se inicia un proceso de eliminación con una ventana técnica de hasta 30 días para garantizar el borrado en sistemas activos y copias de seguridad verificadas. La <strong>información sanitaria inferida</strong> que resulte del procesamiento no se conserva de forma persistente y se elimina tras completarse la transcripción, salvo obligaciones legales. Las <strong>transcripciones</strong> se conservan mientras su cuenta permanezca activa o hasta que usted solicite su supresión. Cuando el uso sea para mejora de modelos con consentimiento, aplicamos políticas de <strong>minimización</strong>, anonimización progresiva y, en su caso, retención por tiempo limitado antes de la anonimización irreversible.
            </p>
          </section>

          {/* Security Measures */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Medidas de seguridad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Protegemos los datos con cifrado de extremo a extremo, incluyendo cifrado fuerte en tránsito y en reposo (por ejemplo, AES‑256‑GCM), gestión segura de claves con rotación programada y hardware de seguridad cuando procede, controles de acceso de mínimo privilegio, autenticación multifactor para personal autorizado, segregación de funciones, monitorización continua y auditorías internas y externas. Nuestras copias de seguridad se cifran, se prueban periódicamente y están sujetas a políticas de borrado coherentes con este documento. Además, aplicamos técnicas de <strong>anonimización y reducción de riesgo</strong> específicas para datos de voz, como la alteración de características acústicas no esenciales, normalización de formantes, supresión de metadatos y agregación temporal mínima. Aunque trabajamos para mitigar riesgos, ninguna transmisión por Internet es completamente segura; si detectáramos una brecha que le afecte, le notificaremos sin dilación indebida conforme a la normativa aplicable.
            </p>
          </section>

          {/* Enhanced Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Derechos reforzados y controles del usuario</h2>
            <p className="text-muted-foreground leading-relaxed">
              Usted puede acceder a sus grabaciones originales, a las características derivadas que hayamos generado, al historial de uso y a un registro trazable de consentimientos. Puede obtener copia, rectificar datos inexactos, <strong>retirar en cualquier momento</strong> los consentimientos (incluido el de entrenamiento de modelos, con efecto inmediato), oponerse a que realicemos <strong>inferencias de salud</strong>, solicitar <strong>limitación del tratamiento</strong> y pedir la <strong>portabilidad</strong> de sus datos. Hemos habilitado un procedimiento de <strong>supresión acelerada</strong> para datos biométricos y derivados: cuando solicita el borrado, eliminamos los datos activos y programamos la purga de copias de seguridad en el siguiente ciclo de mantenimiento verificable; si sus datos hubieran contribuido a entrenar un modelo con su consentimiento, ejecutamos un proceso de <strong>desvinculación</strong> razonable para que futuras versiones del modelo no continúen personalizadas con su información. La retirada del consentimiento de entrenamiento o el ejercicio de oposición <strong>no afectará</strong> a su acceso a la transcripción básica. Todos estos derechos pueden ejercerse desde el Centro de Privacidad o contactando con el DPO; daremos respuesta dentro de los plazos legales.
            </p>
          </section>

          {/* Minors */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Menores de edad</h2>
            <p className="text-muted-foreground leading-relaxed">
              No prestamos los Servicios a menores sin el consentimiento verificable del progenitor o representante legal. En España, el consentimiento autónomo requiere, como mínimo, 14 años; en otros países del Espacio Económico Europeo puede exigirse una edad superior. Si detectamos una cuenta de un menor sin los consentimientos apropiados, procederemos a bloquearla y a eliminar los datos, salvo conservación exigida por ley.
            </p>
          </section>

          {/* Communications */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Comunicaciones y marketing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Solo le enviaremos comunicaciones comerciales si usted ha dado su consentimiento o si existe otra base legal aplicable. Puede darse de baja en cualquier momento mediante el enlace incluido en los mensajes o desde el Centro de Privacidad. Continuaremos enviando comunicaciones estrictamente operativas o de seguridad cuando sean imprescindibles.
            </p>
          </section>

          {/* Recipients */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Destinatarios y categorías de terceros</h2>
            <p className="text-muted-foreground leading-relaxed">
              No vendemos sus datos personales. Compartimos información con <strong>encargados del tratamiento</strong> que nos prestan servicios bajo contrato y siguiendo instrucciones documentadas: alojamiento y nube, herramientas de anotación y calidad, ingeniería y soporte, ciberseguridad, atención al cliente, análisis operativos y gestión de pagos. Limitamos la información a la estrictamente necesaria, exigimos confidencialidad y medidas de seguridad equivalentes, y auditamos su cumplimiento. Si en el futuro colaborásemos con instituciones académicas o socios de investigación en proyectos para mejorar la accesibilidad del habla, lo haríamos sobre datos <strong>anonimizados</strong> o con <strong>consentimiento específico</strong> adicional. En caso de reestructuración societaria, fusión o adquisición, podríamos transferir los datos a la entidad sucesora, que quedaría obligada a respetar esta Política o a solicitar su consentimiento si pretendiera cambios materiales.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Transferencias internacionales</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos tratar y almacenar datos fuera de su país de residencia. Cuando se transfieren datos desde el EEE o el Reino Unido a países que no ofrecen un nivel de protección esencialmente equivalente, implementamos salvaguardas adecuadas como <strong>Cláusulas Contractuales Tipo</strong> y evaluaciones de transferencia, además de medidas técnicas y organizativas complementarias.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Cookies y tecnologías similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos únicamente tecnologías <strong>estrictamente necesarias</strong> para operar, mantener la seguridad de la sesión y recordar preferencias básicas. No empleamos cookies de publicidad comportamental ni plug‑ins de terceros con fines de seguimiento entre sitios. Puede gestionar estas tecnologías desde la configuración del navegador; desactivarlas puede degradar ciertas funciones esenciales.
            </p>
          </section>

          {/* Analytics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Información adicional sobre analítica y uso interno</h2>
            <p className="text-muted-foreground leading-relaxed">
              Analizamos de forma agregada el rendimiento del sistema, la estabilidad y la usabilidad para detectar problemas técnicos, comprender tendencias de uso y mejorar la experiencia. Cuando es posible, empleamos <strong>datos agregados o seudonimizados</strong>, y evitamos rastreos innecesarios a nivel individual.
            </p>
          </section>

          {/* California Users */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Usuarios de California y otros estados de EE. UU.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si usted reside en California u otros estados con legislación específica, puede disponer de derechos adicionales como conocer, acceder, corregir o eliminar información, así como optar por que no se <strong>vendan ni compartan</strong> sus datos para publicidad entre contextos. Adagio <strong>no vende</strong> datos personales según la definición aplicable y no comparte información con fines de publicidad dirigida. Puede ejercer estos derechos a través del Centro de Privacidad.
            </p>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Actualizaciones de esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos modificar esta Política para reflejar cambios en la ley, en los Servicios o en nuestras prácticas. Publicaremos la nueva versión indicando la <strong>fecha de última revisión</strong> que figura al inicio y, cuando el cambio sea material, le informaremos a través de la aplicación o por medios razonables y, si la ley lo requiere, solicitaremos nuevamente su consentimiento.
            </p>
          </section>

          {/* Summary of Key Commitments */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Resumen operativo de compromisos clave</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tratamos su voz como dato biométrico y pedimos un <strong>doble consentimiento explícito</strong> cuando pueda existir información sanitaria implícita; la <strong>transcripción</strong> se ofrece incluso si no consiente el <strong>entrenamiento</strong> de modelos; aplicamos <strong>plazos de conservación limitados</strong> y eliminación tras retiro del consentimiento; empleamos <strong>cifrado fuerte</strong>, controles de acceso estrictos y <strong>anonimización</strong>; garantizamos <strong>derechos reforzados</strong> (acceso, supresión, oposición a inferencias de salud, retirada de consentimientos inmediata, portabilidad y limitación); y mantenemos una <strong>EIPD</strong> activa y revisada, con supervisión continua del riesgo residual.
              </p>
            </CardContent>
          </Card>

          {/* How to Exercise Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Cómo ejercer sus derechos o plantear dudas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Puede gestionar consentimientos, descargar o borrar datos, y contactar con nuestro DPO desde el <strong>Centro de Privacidad</strong> de la aplicación. Si considera que no hemos atendido adecuadamente su solicitud, puede presentar una reclamación ante su autoridad de control de protección de datos. Nuestro objetivo es responder a todas las solicitudes con claridad y dentro de los plazos legales, manteniendo la trazabilidad de cada actuación.
            </p>
          </section>

          {/* Technical Controls Appendix */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Anexo de aclaraciones sobre controles técnicos y de eliminación</h2>
            <p className="text-muted-foreground leading-relaxed">
              En la eliminación de datos biométricos y derivados, ejecutamos borrados en sistemas activos y programamos la purga en copias de seguridad dentro del ciclo operativo, emitiendo confirmación una vez completada. Para conjuntos de datos utilizados en entrenamiento con su consentimiento, aplicamos procesos de <strong>despersonalización</strong> y evitamos el reaprovechamiento futuro de sus fragmentos; en modelos ya entrenados, adoptamos medidas de <strong>desvinculación razonable</strong> que impiden seguir personalizando salidas con su voz. Estos procesos se documentan y están sujetos a verificación. En seguridad, además del cifrado, empleamos rotación de claves, segmentación de redes, endurecimiento de servidores, registros inmutables y alertado automático de anomalías, junto con formación anual obligatoria de nuestro personal en protección de datos biométricos. Si en algún momento adoptamos nuevas integraciones o subencargados, lo reflejaremos en esta Política y en nuestro registro de actividades, y, de ser necesario, solicitaremos su consentimiento adicional.
            </p>
          </section>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t">
            <Link to="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
            <Link to="/terms-and-conditions">
              <Button variant="outline" size="lg">
                Términos y Condiciones
              </Button>
            </Link>
            <Link to="/privacy-center">
              <Button variant="default" size="lg">
                Centro de Privacidad
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Adagio. Todos los derechos reservados.</p>
          <p className="mt-2">
            Con esta redacción, preservamos sus garantías reforzadas para datos biométricos y de salud, 
            explicamos con detalle el uso de IA, distinguimos finalidades obligatorias y opcionales, 
            y alineamos nuestros compromisos con las mejores prácticas internacionales en privacidad y seguridad.
          </p>
        </div>
      </footer>
    </div>
  );
};