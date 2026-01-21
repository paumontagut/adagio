import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AudioLines, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import logo from '@/assets/logo.svg';

export const MyData = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Adagio" className="h-16 w-auto" />
          </Link>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Decorative Icon */}
          <div className="mb-8 flex justify-center">
            <div className="p-6 rounded-full bg-primary/10 border border-primary/20">
              <AudioLines className="h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Mis Datos
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-primary font-medium mb-6">
            Próximamente disponible
          </p>

          {/* Informative Message */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 mb-8">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Cuando Adagio esté disponible, aquí encontrarás el historial de tus{' '}
              <span className="text-foreground font-medium">transcripciones</span> y{' '}
              <span className="text-foreground font-medium">traducciones</span>{' '}
              realizadas con nuestro modelo de reconocimiento de voz.
            </p>
            <p className="text-muted-foreground mt-4">
              Podrás gestionar, descargar y eliminar tus datos en cualquier momento.
            </p>
          </div>

          {/* Back Button */}
          <Button size="lg" asChild>
            <Link to="/">
              Volver al inicio
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
