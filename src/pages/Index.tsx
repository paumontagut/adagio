import React from "react";
import { motion } from "framer-motion"; // Asegúrate de tener framer-motion instalado

// Adagio Brand Colors (Hardcoded para precisión)
const colors = {
  bg: "#F5F8DE", // Cream
  dark: "#0D0C1D", // Text/Black
  primary: "#005C64", // Teal
  accent: "#FFBC42", // Yellow
  blue: "#90C2E7", // Light Blue
};

const Index = () => {
  return (
    <div
      className="min-h-screen w-full font-sans selection:bg-[#005C64] selection:text-white"
      style={{ backgroundColor: colors.bg, color: colors.dark }}
    >
      {/* --- NAVBAR FLOTANTE (Estilo Isla Dinámica) --- */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center">
        <div className="flex items-center gap-8 px-6 py-3 bg-white/40 backdrop-blur-xl border border-white/50 rounded-full shadow-sm">
          <span className="font-bold tracking-tight text-lg">Adagio</span>
          <div className="hidden md:flex gap-6 text-sm font-medium opacity-80">
            <a href="#" className="hover:text-[#005C64] transition-colors">
              Producto
            </a>
            <a href="#" className="hover:text-[#005C64] transition-colors">
              Manifiesto
            </a>
            <a href="#" className="hover:text-[#005C64] transition-colors">
              Precios
            </a>
          </div>
          <button
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
            style={{ backgroundColor: colors.primary }}
          >
            Empezar
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        {/* HERO SECTION */}
        <section className="text-center space-y-6 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-[#005C64]/10 text-[#005C64] text-xs font-bold tracking-wide uppercase mb-4"
          >
            Nuevo Lanzamiento 2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            Minimalismo <br />
            <span style={{ color: colors.primary }}>con Propósito.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto leading-relaxed"
          >
            Una interfaz diseñada para la calma. Sin ruido, solo tus ideas fluyendo a través de un diseño digital
            consciente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center gap-4 pt-4"
          >
            <button
              className="px-8 py-4 rounded-full text-white font-medium text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-95"
              style={{ backgroundColor: colors.primary }}
            >
              Prueba Gratis
            </button>
            <button className="px-8 py-4 rounded-full bg-white/50 hover:bg-white font-medium text-lg transition-all border border-black/5 active:scale-95">
              Ver Demo
            </button>
          </motion.div>
        </section>

        {/* BENTO GRID (El sello de identidad "Apple moderno") */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
          {/* Large Card Left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 group"
          >
            <div className="relative z-10 max-w-md">
              <h3 className="text-3xl font-bold mb-4">Diseño Fluido</h3>
              <p className="text-lg opacity-60">
                Cada interacción responde naturalmente a tu tacto. Botones que respiran y transiciones que guían tu
                vista.
              </p>
            </div>
            {/* Abstract Art Circle */}
            <div
              className="absolute -right-20 -bottom-40 w-96 h-96 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"
              style={{ backgroundColor: colors.blue }}
            />
            <div
              className="absolute right-20 -bottom-20 w-72 h-72 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"
              style={{ backgroundColor: colors.primary }}
            />
          </motion.div>

          {/* Tall Card Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D0C1D] rounded-[2.5rem] p-10 text-[#F5F8DE] flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: colors.accent }}
              >
                <span className="text-black text-xl font-bold">⚡</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Ultra Rápido</h3>
              <p className="opacity-60">Optimizado para velocidad instantánea.</p>
            </div>

            <div className="mt-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-mono opacity-70">Performance</span>
                <span className="text-sm font-bold" style={{ color: colors.accent }}>
                  99.9%
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[99%] bg-[#FFBC42] rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* Bottom Wide Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div>
              <h3 className="text-3xl font-bold mb-2">Únete a Adagio</h3>
              <p className="opacity-60 max-w-lg">
                La plataforma preferida por creadores que valoran la estética y la funcionalidad.
              </p>
            </div>
            <button className="px-8 py-4 rounded-full bg-black text-white font-bold hover:scale-105 transition-transform">
              Crear cuenta gratis
            </button>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default Index;
