import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, FileText, Calendar, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { secureStorage } from '@/lib/secureStorage';

interface ConsentEvidence {
  id: string;
  session_pseudonym: string;
  full_name: string;
  email: string | null;
  age_range: string;
  country: string;
  region: string;
  adult_declaration: boolean;
  adult_declaration_timestamp: string;
  consent_train: boolean;
  consent_store: boolean;
  consent_timestamp: string;
  consent_evidence_data: any;
  digital_signature: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  created_at: string;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  migrated_from: string | null;
}

const AdminConsents = () => {
  const [consents, setConsents] = useState<ConsentEvidence[]>([]);
  const [filteredConsents, setFilteredConsents] = useState<ConsentEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsent, setSelectedConsent] = useState<ConsentEvidence | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConsents();
  }, []);

  useEffect(() => {
    filterConsents();
  }, [searchTerm, consents]);

  const loadConsents = async () => {
    try {
      setIsLoading(true);
      
      // Get admin session token from secure storage
      const sessionToken = await secureStorage.getAdminSession();
      if (!sessionToken) {
        toast({
          title: "Error de autenticación",
          description: "No hay sesión de administrador activa",
          variant: "destructive"
        });
        return;
      }

      // Use RPC function with session token validation (untyped)
      const { data, error } = await (supabase as any).rpc('get_participant_consents_with_token', {
        p_session_token: sessionToken
      });

      if (error) throw error;
      console.log('[AdminConsents] Registros cargados desde participant_consents:', Array.isArray(data) ? data.length : 0);
      setConsents((data as ConsentEvidence[]) || []);
    } catch (error) {
      console.error('Error loading consents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los consentimientos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterConsents = () => {
    if (!searchTerm.trim()) {
      setFilteredConsents(consents);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = consents.filter(consent =>
      consent.full_name?.toLowerCase().includes(term) ||
      consent.session_pseudonym?.toLowerCase().includes(term) ||
      consent.email?.toLowerCase().includes(term) ||
      consent.country?.toLowerCase().includes(term) ||
      consent.region?.toLowerCase().includes(term)
    );
    setFilteredConsents(filtered);
  };

  const viewConsentDetails = (consent: ConsentEvidence) => {
    setSelectedConsent(consent);
    setIsDialogOpen(true);

    // Log access to consent evidence (untyped)
    (supabase as any).rpc('log_consent_evidence_access', {
      p_consent_evidence_id: consent.id,
      p_session_pseudonym: consent.session_pseudonym
    }).then(({ error }: { error: any }) => {
      if (error) console.error('Error logging consent access:', error);
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando consentimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Evidencia de Consentimientos</h1>
              <p className="text-sm text-muted-foreground">
                Registros completos de consentimientos GDPR/RGPD
              </p>
            </div>
          </div>
          <Button onClick={loadConsents} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Consentimientos</span>
            </div>
            <p className="text-2xl font-bold">{consents.length}</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Activos</span>
            </div>
            <p className="text-2xl font-bold">
              {consents.filter(c => !c.withdrawn_at).length}
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Revocados</span>
            </div>
            <p className="text-2xl font-bold">
              {consents.filter(c => c.withdrawn_at).length}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Mayores de Edad</span>
            </div>
            <p className="text-2xl font-bold">
              {consents.filter(c => c.adult_declaration).length}
            </p>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, pseudónimo, email, país o región..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto md:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pseudónimo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rango Edad</TableHead>
                  <TableHead>País/Región</TableHead>
                  <TableHead>Mayor de Edad</TableHead>
                  <TableHead>Entrenar</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No se encontraron consentimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConsents.map((consent) => (
                    <TableRow key={consent.id}>
                      <TableCell className="font-mono text-xs max-w-[160px] truncate md:max-w-none">
                        {consent.session_pseudonym.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="font-medium">{consent.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {consent.email || '-'}
                      </TableCell>
                      <TableCell>{consent.age_range}</TableCell>
                      <TableCell className="text-sm">
                        {consent.country} / {consent.region}
                      </TableCell>
                      <TableCell>
                        {consent.adult_declaration ? (
                          <Badge variant="default" className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {consent.consent_train ? (
                          <Badge variant="default">Sí</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(consent.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {consent.withdrawn_at ? (
                          <Badge variant="destructive">Revocado</Badge>
                        ) : (
                          <Badge variant="default" className="bg-success text-success-foreground">Activo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewConsentDetails(consent)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Detalles de Evidencia de Consentimiento
            </DialogTitle>
          </DialogHeader>
          
          {selectedConsent && (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información Personal
                    {selectedConsent.migrated_from && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Migrado de {selectedConsent.migrated_from}
                      </Badge>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="font-medium">{selectedConsent.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedConsent.email || 'No proporcionado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rango de Edad:</span>
                      <p className="font-medium">
                        {selectedConsent.age_range === 'legacy_data' ? (
                          <span className="text-muted-foreground italic">Datos no disponibles (migrado)</span>
                        ) : (
                          selectedConsent.age_range
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pseudónimo de Sesión:</span>
                      <p className="font-mono text-xs break-all">{selectedConsent.session_pseudonym}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">País:</span>
                      <p className="font-medium">
                        {selectedConsent.country === 'Unknown' ? (
                          <span className="text-muted-foreground italic">No disponible (migrado)</span>
                        ) : (
                          selectedConsent.country
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Región:</span>
                      <p className="font-medium">
                        {selectedConsent.region === 'Unknown' ? (
                          <span className="text-muted-foreground italic">No disponible (migrado)</span>
                        ) : (
                          selectedConsent.region
                        )}
                      </p>
                    </div>
                  </div>
                  {(selectedConsent.country === 'Unknown' || selectedConsent.region === 'Unknown') && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ℹ️ Este registro fue migrado de un sistema antiguo que no capturaba información geográfica detallada.
                      </p>
                    </div>
                  )}
                </div>

                {/* Consents */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Consentimientos
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <span>Declaración de Mayoría de Edad:</span>
                      {selectedConsent.adult_declaration ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">No Confirmado</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <span>Consentimiento de Entrenamiento:</span>
                      <Badge variant={selectedConsent.consent_train ? "default" : "secondary"}>
                        {selectedConsent.consent_train ? "Otorgado" : "No Otorgado"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fechas
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Consentimiento Otorgado:</span>
                      <p className="font-medium">{new Date(selectedConsent.consent_timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Declaración de Mayoría:</span>
                      <p className="font-medium">{new Date(selectedConsent.adult_declaration_timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registro Creado:</span>
                      <p className="font-medium">{new Date(selectedConsent.created_at).toLocaleString()}</p>
                    </div>
                    {selectedConsent.withdrawn_at && (
                      <div>
                        <span className="text-muted-foreground">Revocado:</span>
                        <p className="font-medium text-destructive">
                          {new Date(selectedConsent.withdrawn_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Firma Digital (SHA-256)
                  </h3>
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="font-mono text-xs break-all">{selectedConsent.digital_signature}</p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Detalles Técnicos</h3>
                  <div className="space-y-2 text-sm">
                    {selectedConsent.ip_address && (
                      <div className="p-3 bg-muted/30 rounded">
                        <span className="text-muted-foreground">IP Address:</span>
                        <p className="font-mono">{selectedConsent.ip_address}</p>
                      </div>
                    )}
                    {selectedConsent.user_agent && (
                      <div className="p-3 bg-muted/30 rounded">
                        <span className="text-muted-foreground">User Agent:</span>
                        <p className="text-xs break-all">{selectedConsent.user_agent}</p>
                      </div>
                    )}
                    {selectedConsent.device_info && (
                      <div className="p-3 bg-muted/30 rounded">
                        <span className="text-muted-foreground">Device Info:</span>
                        <p className="text-xs">{selectedConsent.device_info}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Data from Consent Evidence - Only show if not migrated data */}
                {selectedConsent.consent_evidence_data && 
                 !selectedConsent.consent_evidence_data.migrated &&
                 (selectedConsent.consent_evidence_data.fullName || 
                  selectedConsent.consent_evidence_data.ageRange ||
                  selectedConsent.consent_evidence_data.country) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Datos del Formulario de Consentimiento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedConsent.consent_evidence_data.fullName && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Nombre Completo:</span>
                          <p className="font-medium">{selectedConsent.consent_evidence_data.fullName}</p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.email && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Email:</span>
                          <p className="font-medium">{selectedConsent.consent_evidence_data.email}</p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.ageRange && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Rango de Edad:</span>
                          <p className="font-medium">{selectedConsent.consent_evidence_data.ageRange}</p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.country && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">País:</span>
                          <p className="font-medium">{selectedConsent.consent_evidence_data.country}</p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.region && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Región:</span>
                          <p className="font-medium">{selectedConsent.consent_evidence_data.region}</p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.adultDeclaration !== undefined && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Declaración de Mayoría de Edad:</span>
                          <p className="font-medium">
                            {selectedConsent.consent_evidence_data.adultDeclaration ? 'Confirmado' : 'No confirmado'}
                          </p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.consentTrain !== undefined && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Consentimiento Entrenamiento:</span>
                          <p className="font-medium">
                            {selectedConsent.consent_evidence_data.consentTrain ? 'Otorgado' : 'No otorgado'}
                          </p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.consentStore !== undefined && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Consentimiento Almacenamiento:</span>
                          <p className="font-medium">
                            {selectedConsent.consent_evidence_data.consentStore ? 'Otorgado' : 'No otorgado'}
                          </p>
                        </div>
                      )}
                      {selectedConsent.consent_evidence_data.timestamp && (
                        <div className="p-3 bg-muted/30 rounded">
                          <span className="text-muted-foreground text-sm">Timestamp del Formulario:</span>
                          <p className="font-medium text-xs">
                            {new Date(selectedConsent.consent_evidence_data.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Evidence Data JSON (collapsed) */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Datos de Evidencia Completos (JSON)</h3>
                  <div className="p-3 bg-muted/30 rounded">
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedConsent.consent_evidence_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConsents;