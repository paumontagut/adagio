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
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-3">⚠️ Resumen sobre Datos Biométricos</h2>
            <p className="text-sm mb-3">
              Esta Política describe el tratamiento de <strong>datos biométricos de voz</strong> y <strong>datos de salud implícitos</strong>. 
              Su voz contiene características únicas que pueden identificarle permanentemente y revelar información sobre su estado de salud.
            </p>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <strong>Su voz es un dato biométrico único:</strong>
                <ul className="list-disc pl-4 text-xs text-muted-foreground mt-1">
                  <li>Patrones acústicos únicos e inmutables</li>
                  <li>Frecuencias fundamentales específicas</li>
                  <li>Características de identificación permanente</li>
                </ul>
              </div>
              <div>
                <strong>Posible información sanitaria implícita:</strong>
                <ul className="list-disc pl-4 text-xs text-muted-foreground mt-1">
                  <li>Indicadores neurológicos (Parkinson, Alzheimer)</li>
                  <li>Condiciones respiratorias (asma, EPOC)</li>
                  <li>Estados emocionales y fatiga vocal</li>
                </ul>
              </div>
            </div>
            <p className="text-sm mt-3 font-medium">
              Por esta razón, requerimos <strong>consentimiento explícito específico</strong> y hemos completado una <strong>Evaluación de Impacto (EIPD)</strong>.
            </p>
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

          {/* Naturaleza Biométrica de la Voz */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Naturaleza Biométrica de sus Datos de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-warning-foreground">
                  ⚠️ Su voz contiene datos biométricos únicos
                </h4>
                <p className="text-sm">
                  Las grabaciones de voz son consideradas <strong>datos biométricos</strong> 
                  bajo el Artículo 4(14) del RGPD porque permiten su identificación única 
                  mediante características físicas y fisiológicas específicas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Características Biométricas Presentes</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="font-medium text-sm">Parámetros Acústicos</h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                        <li>Frecuencia fundamental (F0)</li>
                        <li>Formantes vocales (F1-F4)</li>
                        <li>Espectrograma único</li>
                      </ul>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="font-medium text-sm">Patrones Temporales</h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                        <li>Ritmo del habla</li>
                        <li>Pausas características</li>
                        <li>Entonación personal</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-destructive">
                    🚨 Información Sanitaria Implícita Potencial
                  </h4>
                  <p className="text-sm mb-3">
                    Su voz puede revelar involuntariamente información sobre su estado de salud:
                  </p>
                  <div className="grid gap-2 md:grid-cols-2 text-xs">
                    <div>
                      <strong>Trastornos Neurológicos:</strong>
                      <ul className="list-disc pl-4 text-muted-foreground">
                        <li>Parkinson (monotonía, temblor vocal)</li>
                        <li>Alzheimer (pérdida de fluidez)</li>
                        <li>Esclerosis múltiple (disartria)</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Condiciones Físicas:</strong>
                      <ul className="list-disc pl-4 text-muted-foreground">
                        <li>Problemas respiratorios</li>
                        <li>Fatiga vocal</li>
                        <li>Estados emocionales</li>
                      </ul>
                    </div>
                  </div>
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

          {/* Base Legal y Consentimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                3. Base Legal y Consentimiento Explícito Requerido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Doble Consentimiento Explícito Requerido</h4>
                <p className="text-sm mb-3">
                  Debido a la naturaleza biométrica de su voz y la posible información sanitaria 
                  implícita, requerimos su consentimiento explícito bajo dos bases legales:
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    📋 Art. 9.2.a RGPD - Consentimiento para Datos Biométricos
                  </h4>
                  <div className="bg-card border rounded p-3 text-sm italic">
                    "Consiento expresamente el tratamiento de mis datos biométricos de voz, 
                    incluyendo características físicas y fisiológicas únicas contenidas en 
                    mi patrón vocal, para los fines específicos de transcripción automática 
                    y entrenamiento de modelos de IA."
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    🏥 Art. 9.2.a RGPD - Consentimiento para Datos de Salud Implícitos
                  </h4>
                  <div className="bg-card border rounded p-3 text-sm italic">
                    "Comprendo y consiento que mi grabación de voz puede contener información 
                    implícita sobre mi estado de salud. Autorizo el tratamiento de esta 
                    información potencial exclusivamente para los fines declarados del 
                    servicio de transcripción."
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">⚖️ Requisitos Legales del Consentimiento</h4>
                <p className="text-sm mb-2">Según el Artículo 7 RGPD, su consentimiento debe ser:</p>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div>✅ <strong>Libre:</strong> Sin coacción, con alternativas</div>
                  <div>✅ <strong>Específico:</strong> Para fines claramente definidos</div>
                  <div>✅ <strong>Informado:</strong> Con comprensión completa</div>
                  <div>✅ <strong>Inequívoco:</strong> Mediante acto afirmativo claro</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluación de Impacto (EIPD) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                4. Evaluación de Impacto en la Protección de Datos (EIPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📊 EIPD Obligatoria Completada</h4>
                <p className="text-sm">
                  Hemos realizado una Evaluación de Impacto completa según el Art. 35 RGPD 
                  debido al alto riesgo que representa el tratamiento de datos biométricos 
                  y la posible información sanitaria implícita.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Factores de Alto Riesgo Evaluados:</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="bg-destructive/5 border border-destructive/20 rounded p-3">
                    <h5 className="font-medium text-sm text-destructive">🔴 Riesgo Biométrico</h5>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      <li>Identificación permanente</li>
                      <li>Datos inmutables</li>
                      <li>Compromiso irreversible</li>
                    </ul>
                  </div>
                  <div className="bg-warning/5 border border-warning/20 rounded p-3">
                    <h5 className="font-medium text-sm text-warning-foreground">🟡 Riesgo Sanitario</h5>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground">
                      <li>Inferencia de patologías</li>
                      <li>Estigmatización médica</li>
                      <li>Discriminación sanitaria</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-success">✅ Conclusión de la EIPD</h4>
                <p className="text-sm">
                  <strong>Riesgo Residual: MEDIO-BAJO</strong> - El tratamiento puede proceder 
                  con las medidas de protección implementadas y supervisión continua.
                </p>
                <div className="mt-2">
                  <a 
                    href="/docs/DPIA_SUMMARY.md" 
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    📄 Consultar resumen completo de la EIPD
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conservación y Seguridad Reforzada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Conservación y Medidas de Seguridad Reforzadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">🛡️ Seguridad Especializada para Datos Biométricos</h4>
                <p className="text-sm">
                  Implementamos medidas de seguridad especializadas debido a la naturaleza 
                  irreversible e inmutable de los datos biométricos de voz.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Períodos de Conservación Específicos</h4>
                  <div className="space-y-2">
                    <div className="bg-muted/50 p-3 rounded border-l-4 border-primary">
                      <div className="font-medium text-sm">Datos Biométricos de Voz</div>
                      <div className="text-xs text-muted-foreground">
                        Conservación hasta retirada explícita del consentimiento + 30 días para verificación de eliminación
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded border-l-4 border-warning">
                      <div className="font-medium text-sm">Información Sanitaria Inferida</div>
                      <div className="text-xs text-muted-foreground">
                        Eliminación inmediata tras transcripción - No almacenamiento persistente
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded border-l-4 border-success">
                      <div className="font-medium text-sm">Transcripciones Resultantes</div>
                      <div className="text-xs text-muted-foreground">
                        Mientras mantenga activa su cuenta o hasta solicitud de eliminación
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medidas de Seguridad Técnicas</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">🔐 Cifrado y Protección</h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                        <li>AES-256-GCM extremo a extremo</li>
                        <li>Claves rotativas cada 24h</li>
                        <li>HSM para gestión de claves</li>
                        <li>Zero-knowledge architecture</li>
                      </ul>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">🎭 Anonimización</h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                        <li>Perturbación de características F0</li>
                        <li>Normalización de formantes</li>
                        <li>Eliminación de metadatos</li>
                        <li>Agregación temporal mínima</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medidas de Seguridad Organizativas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-primary">🔑</span>
                      <div>
                        <strong>Control de Acceso Estricto:</strong> Autenticación multifactor, 
                        principio de menor privilegio, segregación de funciones
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">👥</span>
                      <div>
                        <strong>Formación Especializada:</strong> 40h anuales en protección 
                        de datos biométricos, certificación obligatoria
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary">📊</span>
                      <div>
                        <strong>Auditoría Continua:</strong> Monitorización 24/7, logs 
                        inmutables, alertas de anomalías
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Derechos Reforzados para Datos Biométricos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                6. Derechos Reforzados para Datos Biométricos y Sanitarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">⚖️ Derechos Especiales para Categorías Especiales</h4>
                <p className="text-sm">
                  Como titular de datos biométricos y potencialmente sanitarios, 
                  disfruta de derechos reforzados bajo el RGPD.
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🔍 Derechos de Información</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li><strong>Transparencia Biométrica:</strong> Qué características se extraen</li>
                    <li><strong>Explicación de IA:</strong> Cómo funcionan los algoritmos</li>
                    <li><strong>Inferencias de Salud:</strong> Qué se puede detectar automáticamente</li>
                    <li><strong>Medidas de Protección:</strong> Salvaguardias implementadas</li>
                  </ul>
                </div>

                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📥 Derechos de Acceso</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li><strong>Grabaciones Originales:</strong> Descarga en formato original</li>
                    <li><strong>Características Extraídas:</strong> Datos biométricos procesados</li>
                    <li><strong>Historial de Uso:</strong> Cuándo y para qué se procesaron</li>
                    <li><strong>Consentimientos:</strong> Registro completo de autorizaciones</li>
                  </ul>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🗑️ Derecho de Supresión Inmediata</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li><strong>Eliminación en 24h:</strong> Datos biométricos y derivados</li>
                    <li><strong>Verificación Técnica:</strong> Confirmación criptográfica</li>
                    <li><strong>Purga de Backups:</strong> Eliminación de copias de seguridad</li>
                    <li><strong>Desvinculación de Modelos:</strong> Retiro del entrenamiento</li>
                  </ul>
                </div>

                <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🚫 Derechos de Oposición</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li><strong>Retirada de Consentimiento:</strong> Efecto inmediato</li>
                    <li><strong>Oposición a Inferencias:</strong> No análisis de salud</li>
                    <li><strong>Limitación de Uso:</strong> Solo transcripción básica</li>
                    <li><strong>Opt-out Granular:</strong> Por tipo de procesamiento</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <h4 className="font-semibold mb-2">🛠️ Herramientas de Ejercicio de Derechos</h4>
                <div className="grid gap-2 md:grid-cols-3 text-sm">
                  <Link to="/privacy-center" className="flex items-center gap-2 p-2 bg-card rounded hover:bg-muted/50 transition-colors">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Centro de Privacidad</span>
                  </Link>
                  <Link to="/my-data" className="flex items-center gap-2 p-2 bg-card rounded hover:bg-muted/50 transition-colors">
                    <Database className="h-4 w-4 text-primary" />
                    <span>Mis Datos</span>
                  </Link>
                  <a href="mailto:dpo@adagio.es" className="flex items-center gap-2 p-2 bg-card rounded hover:bg-muted/50 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Contactar DPO</span>
                  </a>
                </div>
              </div>
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