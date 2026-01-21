import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import logo from "@/assets/logo.svg";

export const TermsAndConditions = () => {
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-[#0D0C1D] tracking-tight">Términos y Condiciones</h1>
            <p className="text-[#0D0C1D]/60 font-medium text-sm sm:text-base md:text-lg">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>

        {/* --- PANEL DE CRISTAL --- */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-8 md:p-16 shadow-sm relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-[#90C2E7]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Contenedor de texto interno (max-w-4xl para lectura cómoda) */}
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 md:space-y-16">
            {/* 1. Introducción */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">1. Introducción</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-base sm:text-lg md:text-xl">
                Bienvenido a Adagio. Estos Términos y Condiciones rigen el uso de nuestra plataforma de transcripción y
                servicios relacionados. Al acceder o utilizar Adagio, usted acepta estar legalmente vinculado por estos
                términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
              </p>
            </section>

            {/* 2. Definiciones */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">2. Definiciones</h2>
              <div className="space-y-3 sm:space-y-4 text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                <p>
                  <strong>"Usuario"</strong> se refiere a cualquier persona que accede o utiliza el Servicio.
                </p>
                <p>
                  <strong>"Servicio"</strong> se refiere a la plataforma de transcripción Adagio y todos los servicios
                  asociados.
                </p>
                <p>
                  <strong>"Contenido"</strong> se refiere a texto, audio, gráficos u otro material que se pueda
                  publicar, cargar o poner a disposición a través del Servicio.
                </p>
              </div>
            </section>

            {/* 3. Uso del Servicio */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">3. Uso del Servicio</h2>
              <div className="space-y-3 sm:space-y-4 text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                <p>
                  <strong>Elegibilidad:</strong> Debe tener al menos 14 años para utilizar este Servicio.
                </p>
                <p>
                  <strong>Licencia:</strong> Adagio le otorga una licencia limitada, no exclusiva e intransferible para
                  utilizar el Servicio para sus fines personales o comerciales internos.
                </p>
                <p>
                  <strong>Restricciones:</strong> No puede utilizar el Servicio para fines ilegales o no autorizados. No
                  debe intentar interferir con el funcionamiento adecuado del Servicio.
                </p>
              </div>
            </section>

            {/* 4. Privacidad y Datos */}
            <section className="bg-[#005C64]/5 border border-[#005C64]/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">4. Privacidad y Protección de Datos</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Su privacidad es importante para nosotros. Nuestra Política de Privacidad explica cómo recopilamos,
                utilizamos y protegemos su información personal y datos biométricos de voz. Al utilizar el Servicio,
                acepta que Adagio puede utilizar dichos datos de acuerdo con nuestra{" "}
                <Link to="/privacy-policy" className="text-[#005C64] font-semibold hover:underline">
                  Política de Privacidad
                </Link>
                .
              </p>
            </section>

            {/* 5. Propiedad Intelectual */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">5. Propiedad Intelectual</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                El Servicio y su contenido original (excluyendo el Contenido proporcionado por los usuarios),
                características y funcionalidad son y seguirán siendo propiedad exclusiva de Adagio y sus licenciantes.
                El Servicio está protegido por derechos de autor, marcas registradas y otras leyes.
              </p>
            </section>

            {/* 6. Limitación de Responsabilidad */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">6. Limitación de Responsabilidad</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                En ningún caso Adagio, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán
                responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo sin
                limitación, pérdida de beneficios, datos, uso, buena voluntad u otras pérdidas intangibles.
              </p>
            </section>

            {/* 7. Modificaciones */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">7. Modificaciones</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en
                cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días
                antes de que entren en vigor los nuevos términos.
              </p>
            </section>

            {/* 8. Contacto */}
            <section>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-[#005C64]">8. Contacto</h2>
              <p className="text-[#0D0C1D]/80 leading-relaxed text-sm sm:text-base md:text-lg">
                Para preguntas sobre estos Términos y Condiciones o sobre el Servicio, puede contactarnos a través de
                nuestro{" "}
                <Link to="/privacy-center" className="text-[#005C64] font-semibold hover:underline">
                  Centro de Privacidad
                </Link>
                .
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
