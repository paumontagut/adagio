import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Eye, Lock, UserCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Política de Privacidad
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Servicio de Transcripción Adagio
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Información del Responsable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                1. Responsable del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Responsable:</strong> Adagio</p>
                <p><strong>Finalidad:</strong> Transcripción de audio y entrenamiento de modelos de IA</p>
                <p><strong>Base legal:</strong> Consentimiento explícito (Art. 6.1.a y 9.2.a RGPD)</p>
              </div>
              <p>
                Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos 
                su información personal cuando utiliza nuestro servicio de transcripción de audio.
              </p>
            </CardContent>
          </Card>

          {/* Datos que Recopilamos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Datos que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Datos Biométricos</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Sus grabaciones de voz pueden contener características biométricas únicas:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Patrones de voz únicos y características vocales</li>
                    <li>Tono, ritmo y entonación específicos</li>
                    <li>Características acústicas identificables</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Datos Técnicos</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Archivos de audio enviados para transcripción</li>
                    <li>Metadatos de audio (duración, formato, calidad)</li>
                    <li>Texto transcrito resultante</li>
                    <li>Información técnica del dispositivo (tipo de navegador, sistema operativo)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Datos de Uso (Opcionales)</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Estadísticas anónimas de uso del servicio</li>
                    <li>Métricas de rendimiento y calidad</li>
                    <li>Datos de mejora del servicio (solo con consentimiento)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalidades del Tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                3. Finalidades del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Utilizamos sus datos para las siguientes finalidades:</p>
              
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Transcripción de Audio</h4>
                  <p className="text-sm text-muted-foreground">
                    Procesamos sus grabaciones para convertirlas en texto utilizando 
                    tecnología de inteligencia artificial.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Entrenamiento de Modelos (Opcional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Con su consentimiento explícito, utilizamos sus grabaciones para 
                    mejorar la precisión de nuestros modelos de reconocimiento de voz.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Almacenamiento Personal (Opcional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Si lo autoriza, guardamos sus grabaciones en su perfil personal 
                    para futuras consultas y mejoras personalizadas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Base Legal del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                El tratamiento de sus datos se basa en su <strong>consentimiento explícito</strong>, 
                especialmente requerido para datos biométricos bajo el RGPD:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Art. 6.1.a RGPD:</strong> Consentimiento para el tratamiento de datos personales</li>
                <li><strong>Art. 9.2.a RGPD:</strong> Consentimiento explícito para datos biométricos</li>
                <li><strong>Art. 22 RGPD:</strong> Decisiones automatizadas y elaboración de perfiles</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Puede retirar su consentimiento en cualquier momento a través de nuestro 
                <Link to="/privacy-center" className="text-primary hover:underline ml-1">
                  Centro de Privacidad
                </Link>.
              </p>
            </CardContent>
          </Card>

          {/* Conservación de Datos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Conservación y Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Períodos de Conservación</h4>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>Grabaciones de entrenamiento:</strong> Hasta la retirada del consentimiento</li>
                    <li><strong>Grabaciones personales:</strong> Hasta que solicite su eliminación</li>
                    <li><strong>Transcripciones:</strong> Mientras mantenga activa su cuenta</li>
                    <li><strong>Datos técnicos:</strong> 30 días después del procesamiento</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medidas de Seguridad</h4>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Cifrado de extremo a extremo para todas las grabaciones</li>
                    <li>Almacenamiento seguro con claves rotativas</li>
                    <li>Acceso restringido solo a personal autorizado</li>
                    <li>Auditorías regulares de seguridad y cumplimiento</li>
                    <li>Protección WORM (Write Once, Read Many) para datos críticos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Derechos del Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                6. Sus Derechos bajo el RGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Como titular de los datos, tiene los siguientes derechos:</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Derechos de Acceso</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Acceder a sus datos personales</li>
                    <li>Obtener copia de sus grabaciones</li>
                    <li>Conocer el uso de sus datos</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Derechos de Control</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Rectificar datos inexactos</li>
                    <li>Eliminar sus datos (derecho al olvido)</li>
                    <li>Limitar el tratamiento</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Derechos de Oposición</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>Oponerse al tratamiento</li>
                    <li>Retirar el consentimiento</li>
                    <li>Portabilidad de datos</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Derechos Especiales</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>No estar sujeto a decisiones automatizadas</li>
                    <li>Reclamación ante autoridad de control</li>
                    <li>Explicación de decisiones de IA</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm">
                  <strong>Para ejercer sus derechos:</strong> Visite nuestro 
                  <Link to="/privacy-center" className="text-primary hover:underline mx-1">
                    Centro de Privacidad
                  </Link>
                  o acceda a 
                  <Link to="/my-data" className="text-primary hover:underline mx-1">
                    Mis Datos
                  </Link>
                  para gestionar su información personal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transferencias Internacionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                7. Transferencias de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>No realizamos transferencias internacionales</strong> de sus datos 
                biométricos fuera del Espacio Económico Europeo (EEE).
              </p>
              <p>
                Todos los datos se procesan y almacenan en servidores ubicados dentro de la UE, 
                garantizando el pleno cumplimiento del RGPD.
              </p>
            </CardContent>
          </Card>

          {/* Modificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                8. Modificaciones de la Política
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos 
                cualquier cambio significativo y, cuando sea legalmente requerido, solicitaremos 
                su consentimiento renovado.
              </p>
              <p>
                La fecha de la última actualización se muestra al inicio de esta política.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
            <div className="flex gap-4">
              <Link to="/terms-and-conditions">
                <Button variant="link">
                  Términos y Condiciones
                </Button>
              </Link>
              <Link to="/privacy-center">
                <Button variant="link">
                  Centro de Privacidad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};