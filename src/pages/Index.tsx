import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TranscribeView } from '@/components/TranscribeView';
import { TrainView } from '@/components/TrainView';
import adagioLogo from '@/assets/adagio-logo.png';
const Index = () => {
  const [activeTab, setActiveTab] = useState('transcribe');
  return <div className="min-h-screen bg-[#005c64]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={adagioLogo} alt="Adagio" className="h-16" />
          </div>
          <p className="text-lg text-white">
            Facilitando la comunicación para personas con habla atípica
          </p>
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