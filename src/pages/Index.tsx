import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranscribeView } from '@/components/TranscribeView';
import { TrainView } from '@/components/TrainView';
import { Footer } from '@/components/Footer';
import { Shield, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
const Index = () => {
  const [activeTab, setActiveTab] = useState('transcribe');
  return (
    <div className="min-h-screen bg-[#005c64] flex flex-col">
      {/* Skip links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#navigation" className="skip-link">
        Saltar a navegación
      </a>

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        {/* Header */}
        <header className="text-center mb-8" role="banner">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-white">
                Adagio
              </h1>
              <p className="text-lg text-white" role="doc-subtitle">
                Facilitando la comunicación para personas con habla atípica
              </p>
            </div>
            <nav 
              id="navigation" 
              className="flex-1 flex justify-end space-x-2" 
              role="navigation" 
              aria-label="Navegación principal"
            >
              <Link to="/my-data">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  aria-describedby="my-data-description"
                >
                  <HardDrive className="h-4 w-4 mr-2" aria-hidden="true" />
                  Mis Datos
                </Button>
              </Link>
              <div id="my-data-description" className="sr-only">
                Acceder a tus datos personales y grabaciones
              </div>
              
              <Link to="/privacy-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  aria-describedby="privacy-description"
                >
                  <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                  Privacidad
                </Button>
              </Link>
              <div id="privacy-description" className="sr-only">
                Gestionar configuración de privacidad y consentimientos
              </div>
            </nav>
          </div>
        </header>

        {/* Main Tabs */}
        <main id="main-content" role="main">
          <Card className="p-6 shadow-lg border-border bg-card">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
              aria-label="Funciones principales de Adagio"
            >
              <TabsList 
                className="grid w-full grid-cols-2 mb-8 bg-muted p-1 h-12"
                role="tablist"
                aria-label="Seleccionar función"
              >
                <TabsTrigger 
                  value="transcribe" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-hover transition-colors text-base font-medium rounded-md"
                  role="tab"
                  aria-selected={activeTab === 'transcribe'}
                  aria-controls="transcribe-panel"
                  id="transcribe-tab"
                >
                  Transcribir
                </TabsTrigger>
                <TabsTrigger 
                  value="train" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-hover transition-colors text-base font-medium rounded-md"
                  role="tab"
                  aria-selected={activeTab === 'train'}
                  aria-controls="train-panel"
                  id="train-tab"
                >
                  Entrenar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent 
                value="transcribe" 
                className="mt-0"
                role="tabpanel"
                aria-labelledby="transcribe-tab"
                id="transcribe-panel"
                tabIndex={0}
              >
                <TranscribeView />
              </TabsContent>
              
              <TabsContent 
                value="train" 
                className="mt-0"
                role="tabpanel"
                aria-labelledby="train-tab"
                id="train-panel"
                tabIndex={0}
              >
                <TrainView />
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
      <Footer />
    </div>
  );
};
export default Index;