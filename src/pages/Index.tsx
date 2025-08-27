import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TranscribeView } from '@/components/TranscribeView';
import { TrainView } from '@/components/TrainView';
import { Shield, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
const Index = () => {
  const [activeTab, setActiveTab] = useState('transcribe');
  return <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-white">
                Adagio
              </h1>
              <p className="text-lg text-white">
                Facilitando la comunicación para personas con habla atípica
              </p>
            </div>
            <div className="flex-1 flex justify-end space-x-2">
              <Link to="/my-data">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Mis Datos
                </Button>
              </Link>
              <Link to="/privacy-center">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacidad
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <Card className="p-6 shadow-lg border-border bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1 h-12">
              <TabsTrigger value="transcribe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-hover transition-colors text-base font-medium rounded-md">
                Transcribir
              </TabsTrigger>
              <TabsTrigger value="train" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted-hover transition-colors text-base font-medium rounded-md">
                Entrenar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcribe" className="mt-0">
              <TranscribeView />
            </TabsContent>
            
            <TabsContent value="train" className="mt-0">
              <TrainView />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>;
};
export default Index;