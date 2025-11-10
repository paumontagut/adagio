import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranscribeView } from '@/components/TranscribeView';
import { TrainView } from '@/components/TrainView';
import { Footer } from '@/components/Footer';
import { AuthButton } from '@/components/AuthButton';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, HardDrive } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '@/assets/logo.svg';
const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('transcribe');
  const {
    user,
    loading
  } = useAuth();

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'train' || tabParam === 'transcribe') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  return <div className="min-h-screen bg-white flex flex-col">
      {/* Skip links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <a href="#navigation" className="skip-link">
        Saltar a navegación
      </a>

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        {/* Header */}
        <header className="mb-8" role="banner">
          {/* Logo and Navigation */}
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="flex-shrink-0">
              <img src={logo} alt="Adagio" className="h-12 w-auto" />
            </Link>
            
            <nav id="navigation" className="flex items-center gap-2 flex-wrap" role="navigation" aria-label="Navegación principal">
              {user && <>
                  <Link to="/my-recordings" className="hidden sm:block">
                    
                  </Link>
                  <Link to="/my-data" className="hidden sm:block">
                    <Button variant="outline" size="sm" className="text-xs">
                      <HardDrive className="h-3 w-3 mr-1" aria-hidden="true" />
                      Datos
                    </Button>
                  </Link>
                </>}
              
              <Link to="/privacy-center">
                
              </Link>

              {user ? <UserMenu /> : !loading && <AuthButton />}
            </nav>
          </div>
        </header>

        {/* Main Tabs */}
        <main id="main-content" role="main">
          <Tabs value={activeTab} onValueChange={value => {
          setActiveTab(value);
          setSearchParams({
            tab: value
          });
        }} className="w-full" aria-label="Funciones principales de Adagio">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1.5 h-14 rounded-3xl" role="tablist" aria-label="Seleccionar función">
              <TabsTrigger value="transcribe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted-hover transition-all duration-200 ease-out text-base font-medium rounded-2xl" role="tab" aria-selected={activeTab === 'transcribe'} aria-controls="transcribe-panel" id="transcribe-tab">
                Transcribir
              </TabsTrigger>
              <TabsTrigger value="train" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted-hover transition-all duration-200 ease-out text-base font-medium rounded-2xl" role="tab" aria-selected={activeTab === 'train'} aria-controls="train-panel" id="train-tab">
                Entrenar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcribe" className="mt-0 transition-opacity duration-300 ease-out data-[state=active]:animate-in data-[state=active]:fade-in-0" role="tabpanel" aria-labelledby="transcribe-tab" id="transcribe-panel" tabIndex={0}>
              <TranscribeView />
            </TabsContent>
            
            <TabsContent value="train" className="mt-0 transition-opacity duration-300 ease-out data-[state=active]:animate-in data-[state=active]:fade-in-0" role="tabpanel" aria-labelledby="train-tab" id="train-panel" tabIndex={0}>
              <TrainView />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Footer />
    </div>;
};
export default Index;