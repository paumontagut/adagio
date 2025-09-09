import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info, ExternalLink, User, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { setParticipantName } from '@/lib/participant';
interface TrainingConsentModalProps {
  isOpen: boolean;
  onConsentGiven: (consentTrain: boolean, fullName: string, ageRange: string, country: string, region: string) => void;
  onCancel?: () => void;
}
export const TrainingConsentModal = ({
  isOpen,
  onConsentGiven,
  onCancel
}: TrainingConsentModalProps) => {
  const navigate = useNavigate();
  const [consentTrain, setConsentTrain] = useState(false);
  const [fullName, setFullName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior: navigate to home page with transcribe tab
      navigate('/?tab=transcribe');
    }
  };
  const handleAccept = () => {
    if (consentTrain && fullName.trim() && ageRange && country && region) {
      // Persistir el nombre del participante
      setParticipantName(fullName.trim());
      onConsentGiven(consentTrain, fullName.trim(), ageRange, country, region);
    }
  };
  const isValid = consentTrain && fullName.trim() && ageRange && country && region;

  // Reset region when country changes
  const handleCountryChange = (value: string) => {
    setCountry(value);
    setRegion(''); // Reset region when country changes
  };

  // Get regions based on selected country
  const getRegionsForCountry = (selectedCountry: string) => {
    switch (selectedCountry) {
      case 'spain':
        return [{
          value: 'andalucia',
          label: 'Andalucía'
        }, {
          value: 'aragon',
          label: 'Aragón'
        }, {
          value: 'asturias',
          label: 'Asturias'
        }, {
          value: 'baleares',
          label: 'Islas Baleares'
        }, {
          value: 'canarias',
          label: 'Islas Canarias'
        }, {
          value: 'cantabria',
          label: 'Cantabria'
        }, {
          value: 'castilla-la-mancha',
          label: 'Castilla-La Mancha'
        }, {
          value: 'castilla-leon',
          label: 'Castilla y León'
        }, {
          value: 'cataluna',
          label: 'Cataluña'
        }, {
          value: 'extremadura',
          label: 'Extremadura'
        }, {
          value: 'galicia',
          label: 'Galicia'
        }, {
          value: 'madrid',
          label: 'Comunidad de Madrid'
        }, {
          value: 'murcia',
          label: 'Región de Murcia'
        }, {
          value: 'navarra',
          label: 'Navarra'
        }, {
          value: 'pais-vasco',
          label: 'País Vasco'
        }, {
          value: 'rioja',
          label: 'La Rioja'
        }, {
          value: 'valencia',
          label: 'Comunidad Valenciana'
        }, {
          value: 'ceuta',
          label: 'Ceuta'
        }, {
          value: 'melilla',
          label: 'Melilla'
        }];
      case 'mexico':
        return [{
          value: 'aguascalientes',
          label: 'Aguascalientes'
        }, {
          value: 'baja-california',
          label: 'Baja California'
        }, {
          value: 'baja-california-sur',
          label: 'Baja California Sur'
        }, {
          value: 'campeche',
          label: 'Campeche'
        }, {
          value: 'chiapas',
          label: 'Chiapas'
        }, {
          value: 'chihuahua',
          label: 'Chihuahua'
        }, {
          value: 'cdmx',
          label: 'Ciudad de México'
        }, {
          value: 'coahuila',
          label: 'Coahuila'
        }, {
          value: 'colima',
          label: 'Colima'
        }, {
          value: 'durango',
          label: 'Durango'
        }, {
          value: 'guanajuato',
          label: 'Guanajuato'
        }, {
          value: 'guerrero',
          label: 'Guerrero'
        }, {
          value: 'hidalgo',
          label: 'Hidalgo'
        }, {
          value: 'jalisco',
          label: 'Jalisco'
        }, {
          value: 'mexico',
          label: 'México'
        }, {
          value: 'michoacan',
          label: 'Michoacán'
        }, {
          value: 'morelos',
          label: 'Morelos'
        }, {
          value: 'nayarit',
          label: 'Nayarit'
        }, {
          value: 'nuevo-leon',
          label: 'Nuevo León'
        }, {
          value: 'oaxaca',
          label: 'Oaxaca'
        }, {
          value: 'puebla',
          label: 'Puebla'
        }, {
          value: 'queretaro',
          label: 'Querétaro'
        }, {
          value: 'quintana-roo',
          label: 'Quintana Roo'
        }, {
          value: 'san-luis-potosi',
          label: 'San Luis Potosí'
        }, {
          value: 'sinaloa',
          label: 'Sinaloa'
        }, {
          value: 'sonora',
          label: 'Sonora'
        }, {
          value: 'tabasco',
          label: 'Tabasco'
        }, {
          value: 'tamaulipas',
          label: 'Tamaulipas'
        }, {
          value: 'tlaxcala',
          label: 'Tlaxcala'
        }, {
          value: 'veracruz',
          label: 'Veracruz'
        }, {
          value: 'yucatan',
          label: 'Yucatán'
        }, {
          value: 'zacatecas',
          label: 'Zacatecas'
        }];
      case 'argentina':
        return [{
          value: 'buenos-aires',
          label: 'Buenos Aires'
        }, {
          value: 'caba',
          label: 'Ciudad Autónoma de Buenos Aires'
        }, {
          value: 'catamarca',
          label: 'Catamarca'
        }, {
          value: 'chaco',
          label: 'Chaco'
        }, {
          value: 'chubut',
          label: 'Chubut'
        }, {
          value: 'cordoba',
          label: 'Córdoba'
        }, {
          value: 'corrientes',
          label: 'Corrientes'
        }, {
          value: 'entre-rios',
          label: 'Entre Ríos'
        }, {
          value: 'formosa',
          label: 'Formosa'
        }, {
          value: 'jujuy',
          label: 'Jujuy'
        }, {
          value: 'la-pampa',
          label: 'La Pampa'
        }, {
          value: 'la-rioja',
          label: 'La Rioja'
        }, {
          value: 'mendoza',
          label: 'Mendoza'
        }, {
          value: 'misiones',
          label: 'Misiones'
        }, {
          value: 'neuquen',
          label: 'Neuquén'
        }, {
          value: 'rio-negro',
          label: 'Río Negro'
        }, {
          value: 'salta',
          label: 'Salta'
        }, {
          value: 'san-juan',
          label: 'San Juan'
        }, {
          value: 'san-luis',
          label: 'San Luis'
        }, {
          value: 'santa-cruz',
          label: 'Santa Cruz'
        }, {
          value: 'santa-fe',
          label: 'Santa Fe'
        }, {
          value: 'santiago-del-estero',
          label: 'Santiago del Estero'
        }, {
          value: 'tierra-del-fuego',
          label: 'Tierra del Fuego'
        }, {
          value: 'tucuman',
          label: 'Tucumán'
        }];
      case 'colombia':
        return [{
          value: 'amazonas',
          label: 'Amazonas'
        }, {
          value: 'antioquia',
          label: 'Antioquia'
        }, {
          value: 'arauca',
          label: 'Arauca'
        }, {
          value: 'atlantico',
          label: 'Atlántico'
        }, {
          value: 'bogota',
          label: 'Bogotá D.C.'
        }, {
          value: 'bolivar',
          label: 'Bolívar'
        }, {
          value: 'boyaca',
          label: 'Boyacá'
        }, {
          value: 'caldas',
          label: 'Caldas'
        }, {
          value: 'caqueta',
          label: 'Caquetá'
        }, {
          value: 'casanare',
          label: 'Casanare'
        }, {
          value: 'cauca',
          label: 'Cauca'
        }, {
          value: 'cesar',
          label: 'Cesar'
        }, {
          value: 'choco',
          label: 'Chocó'
        }, {
          value: 'cordoba',
          label: 'Córdoba'
        }, {
          value: 'cundinamarca',
          label: 'Cundinamarca'
        }, {
          value: 'guainia',
          label: 'Guainía'
        }, {
          value: 'guaviare',
          label: 'Guaviare'
        }, {
          value: 'huila',
          label: 'Huila'
        }, {
          value: 'la-guajira',
          label: 'La Guajira'
        }, {
          value: 'magdalena',
          label: 'Magdalena'
        }, {
          value: 'meta',
          label: 'Meta'
        }, {
          value: 'narino',
          label: 'Nariño'
        }, {
          value: 'norte-de-santander',
          label: 'Norte de Santander'
        }, {
          value: 'putumayo',
          label: 'Putumayo'
        }, {
          value: 'quindio',
          label: 'Quindío'
        }, {
          value: 'risaralda',
          label: 'Risaralda'
        }, {
          value: 'san-andres',
          label: 'San Andrés y Providencia'
        }, {
          value: 'santander',
          label: 'Santander'
        }, {
          value: 'sucre',
          label: 'Sucre'
        }, {
          value: 'tolima',
          label: 'Tolima'
        }, {
          value: 'valle-del-cauca',
          label: 'Valle del Cauca'
        }, {
          value: 'vaupes',
          label: 'Vaupés'
        }, {
          value: 'vichada',
          label: 'Vichada'
        }];
      case 'peru':
        return [{
          value: 'amazonas',
          label: 'Amazonas'
        }, {
          value: 'ancash',
          label: 'Áncash'
        }, {
          value: 'apurimac',
          label: 'Apurímac'
        }, {
          value: 'arequipa',
          label: 'Arequipa'
        }, {
          value: 'ayacucho',
          label: 'Ayacucho'
        }, {
          value: 'cajamarca',
          label: 'Cajamarca'
        }, {
          value: 'callao',
          label: 'Callao'
        }, {
          value: 'cusco',
          label: 'Cusco'
        }, {
          value: 'huancavelica',
          label: 'Huancavelica'
        }, {
          value: 'huanuco',
          label: 'Huánuco'
        }, {
          value: 'ica',
          label: 'Ica'
        }, {
          value: 'junin',
          label: 'Junín'
        }, {
          value: 'la-libertad',
          label: 'La Libertad'
        }, {
          value: 'lambayeque',
          label: 'Lambayeque'
        }, {
          value: 'lima',
          label: 'Lima'
        }, {
          value: 'loreto',
          label: 'Loreto'
        }, {
          value: 'madre-de-dios',
          label: 'Madre de Dios'
        }, {
          value: 'moquegua',
          label: 'Moquegua'
        }, {
          value: 'pasco',
          label: 'Pasco'
        }, {
          value: 'piura',
          label: 'Piura'
        }, {
          value: 'puno',
          label: 'Puno'
        }, {
          value: 'san-martin',
          label: 'San Martín'
        }, {
          value: 'tacna',
          label: 'Tacna'
        }, {
          value: 'tumbes',
          label: 'Tumbes'
        }, {
          value: 'ucayali',
          label: 'Ucayali'
        }];
      case 'chile':
        return [{
          value: 'arica-parinacota',
          label: 'Arica y Parinacota'
        }, {
          value: 'tarapaca',
          label: 'Tarapacá'
        }, {
          value: 'antofagasta',
          label: 'Antofagasta'
        }, {
          value: 'atacama',
          label: 'Atacama'
        }, {
          value: 'coquimbo',
          label: 'Coquimbo'
        }, {
          value: 'valparaiso',
          label: 'Valparaíso'
        }, {
          value: 'santiago',
          label: 'Región Metropolitana'
        }, {
          value: 'ohiggins',
          label: "O'Higgins"
        }, {
          value: 'maule',
          label: 'Maule'
        }, {
          value: 'nuble',
          label: 'Ñuble'
        }, {
          value: 'biobio',
          label: 'Biobío'
        }, {
          value: 'araucania',
          label: 'La Araucanía'
        }, {
          value: 'los-rios',
          label: 'Los Ríos'
        }, {
          value: 'los-lagos',
          label: 'Los Lagos'
        }, {
          value: 'aysen',
          label: 'Aysén'
        }, {
          value: 'magallanes',
          label: 'Magallanes y Antártica'
        }];
      case 'venezuela':
        return [{
          value: 'amazonas',
          label: 'Amazonas'
        }, {
          value: 'anzoategui',
          label: 'Anzoátegui'
        }, {
          value: 'apure',
          label: 'Apure'
        }, {
          value: 'aragua',
          label: 'Aragua'
        }, {
          value: 'barinas',
          label: 'Barinas'
        }, {
          value: 'bolivar',
          label: 'Bolívar'
        }, {
          value: 'carabobo',
          label: 'Carabobo'
        }, {
          value: 'cojedes',
          label: 'Cojedes'
        }, {
          value: 'delta-amacuro',
          label: 'Delta Amacuro'
        }, {
          value: 'falcon',
          label: 'Falcón'
        }, {
          value: 'guarico',
          label: 'Guárico'
        }, {
          value: 'lara',
          label: 'Lara'
        }, {
          value: 'merida',
          label: 'Mérida'
        }, {
          value: 'miranda',
          label: 'Miranda'
        }, {
          value: 'monagas',
          label: 'Monagas'
        }, {
          value: 'nueva-esparta',
          label: 'Nueva Esparta'
        }, {
          value: 'portuguesa',
          label: 'Portuguesa'
        }, {
          value: 'sucre',
          label: 'Sucre'
        }, {
          value: 'tachira',
          label: 'Táchira'
        }, {
          value: 'trujillo',
          label: 'Trujillo'
        }, {
          value: 'vargas',
          label: 'Vargas'
        }, {
          value: 'yaracuy',
          label: 'Yaracuy'
        }, {
          value: 'zulia',
          label: 'Zulia'
        }, {
          value: 'caracas',
          label: 'Distrito Capital'
        }];
      case 'ecuador':
        return [{
          value: 'azuay',
          label: 'Azuay'
        }, {
          value: 'bolivar',
          label: 'Bolívar'
        }, {
          value: 'canar',
          label: 'Cañar'
        }, {
          value: 'carchi',
          label: 'Carchi'
        }, {
          value: 'chimborazo',
          label: 'Chimborazo'
        }, {
          value: 'cotopaxi',
          label: 'Cotopaxi'
        }, {
          value: 'el-oro',
          label: 'El Oro'
        }, {
          value: 'esmeraldas',
          label: 'Esmeraldas'
        }, {
          value: 'galapagos',
          label: 'Galápagos'
        }, {
          value: 'guayas',
          label: 'Guayas'
        }, {
          value: 'imbabura',
          label: 'Imbabura'
        }, {
          value: 'loja',
          label: 'Loja'
        }, {
          value: 'los-rios',
          label: 'Los Ríos'
        }, {
          value: 'manabi',
          label: 'Manabí'
        }, {
          value: 'morona-santiago',
          label: 'Morona Santiago'
        }, {
          value: 'napo',
          label: 'Napo'
        }, {
          value: 'orellana',
          label: 'Orellana'
        }, {
          value: 'pastaza',
          label: 'Pastaza'
        }, {
          value: 'pichincha',
          label: 'Pichincha'
        }, {
          value: 'santa-elena',
          label: 'Santa Elena'
        }, {
          value: 'santo-domingo',
          label: 'Santo Domingo de los Tsáchilas'
        }, {
          value: 'sucumbios',
          label: 'Sucumbíos'
        }, {
          value: 'tungurahua',
          label: 'Tungurahua'
        }, {
          value: 'zamora-chinchipe',
          label: 'Zamora Chinchipe'
        }];
      case 'bolivia':
        return [{
          value: 'chuquisaca',
          label: 'Chuquisaca'
        }, {
          value: 'la-paz',
          label: 'La Paz'
        }, {
          value: 'cochabamba',
          label: 'Cochabamba'
        }, {
          value: 'oruro',
          label: 'Oruro'
        }, {
          value: 'potosi',
          label: 'Potosí'
        }, {
          value: 'tarija',
          label: 'Tarija'
        }, {
          value: 'santa-cruz',
          label: 'Santa Cruz'
        }, {
          value: 'beni',
          label: 'Beni'
        }, {
          value: 'pando',
          label: 'Pando'
        }];
      case 'paraguay':
        return [{
          value: 'asuncion',
          label: 'Asunción'
        }, {
          value: 'concepcion',
          label: 'Concepción'
        }, {
          value: 'san-pedro',
          label: 'San Pedro'
        }, {
          value: 'cordillera',
          label: 'Cordillera'
        }, {
          value: 'guaira',
          label: 'Guairá'
        }, {
          value: 'caaguazu',
          label: 'Caaguazú'
        }, {
          value: 'caazapa',
          label: 'Caazapá'
        }, {
          value: 'itapua',
          label: 'Itapúa'
        }, {
          value: 'misiones',
          label: 'Misiones'
        }, {
          value: 'paraguari',
          label: 'Paraguarí'
        }, {
          value: 'alto-parana',
          label: 'Alto Paraná'
        }, {
          value: 'central',
          label: 'Central'
        }, {
          value: 'neembucu',
          label: 'Ñeembucú'
        }, {
          value: 'amambay',
          label: 'Amambay'
        }, {
          value: 'canindeyu',
          label: 'Canindeyú'
        }, {
          value: 'presidente-hayes',
          label: 'Presidente Hayes'
        }, {
          value: 'alto-paraguay',
          label: 'Alto Paraguay'
        }, {
          value: 'boqueron',
          label: 'Boquerón'
        }];
      case 'uruguay':
        return [{
          value: 'artigas',
          label: 'Artigas'
        }, {
          value: 'canelones',
          label: 'Canelones'
        }, {
          value: 'cerro-largo',
          label: 'Cerro Largo'
        }, {
          value: 'colonia',
          label: 'Colonia'
        }, {
          value: 'durazno',
          label: 'Durazno'
        }, {
          value: 'flores',
          label: 'Flores'
        }, {
          value: 'florida',
          label: 'Florida'
        }, {
          value: 'lavalleja',
          label: 'Lavalleja'
        }, {
          value: 'maldonado',
          label: 'Maldonado'
        }, {
          value: 'montevideo',
          label: 'Montevideo'
        }, {
          value: 'paysandu',
          label: 'Paysandú'
        }, {
          value: 'rio-negro',
          label: 'Río Negro'
        }, {
          value: 'rivera',
          label: 'Rivera'
        }, {
          value: 'rocha',
          label: 'Rocha'
        }, {
          value: 'salto',
          label: 'Salto'
        }, {
          value: 'san-jose',
          label: 'San José'
        }, {
          value: 'soriano',
          label: 'Soriano'
        }, {
          value: 'tacuarembo',
          label: 'Tacuarembó'
        }, {
          value: 'treinta-y-tres',
          label: 'Treinta y Tres'
        }];
      case 'costa-rica':
        return [{
          value: 'san-jose',
          label: 'San José'
        }, {
          value: 'alajuela',
          label: 'Alajuela'
        }, {
          value: 'cartago',
          label: 'Cartago'
        }, {
          value: 'heredia',
          label: 'Heredia'
        }, {
          value: 'guanacaste',
          label: 'Guanacaste'
        }, {
          value: 'puntarenas',
          label: 'Puntarenas'
        }, {
          value: 'limon',
          label: 'Limón'
        }];
      case 'panama':
        return [{
          value: 'bocas-del-toro',
          label: 'Bocas del Toro'
        }, {
          value: 'chiriqui',
          label: 'Chiriquí'
        }, {
          value: 'cocle',
          label: 'Coclé'
        }, {
          value: 'colon',
          label: 'Colón'
        }, {
          value: 'darien',
          label: 'Darién'
        }, {
          value: 'herrera',
          label: 'Herrera'
        }, {
          value: 'los-santos',
          label: 'Los Santos'
        }, {
          value: 'panama',
          label: 'Panamá'
        }, {
          value: 'panama-oeste',
          label: 'Panamá Oeste'
        }, {
          value: 'veraguas',
          label: 'Veraguas'
        }];
      case 'nicaragua':
        return [{
          value: 'boaco',
          label: 'Boaco'
        }, {
          value: 'carazo',
          label: 'Carazo'
        }, {
          value: 'chinandega',
          label: 'Chinandega'
        }, {
          value: 'chontales',
          label: 'Chontales'
        }, {
          value: 'esteli',
          label: 'Estelí'
        }, {
          value: 'granada',
          label: 'Granada'
        }, {
          value: 'jinotega',
          label: 'Jinotega'
        }, {
          value: 'leon',
          label: 'León'
        }, {
          value: 'madriz',
          label: 'Madriz'
        }, {
          value: 'managua',
          label: 'Managua'
        }, {
          value: 'masaya',
          label: 'Masaya'
        }, {
          value: 'matagalpa',
          label: 'Matagalpa'
        }, {
          value: 'nueva-segovia',
          label: 'Nueva Segovia'
        }, {
          value: 'rio-san-juan',
          label: 'Río San Juan'
        }, {
          value: 'rivas',
          label: 'Rivas'
        }, {
          value: 'raan',
          label: 'Región Autónoma Atlántico Norte'
        }, {
          value: 'raas',
          label: 'Región Autónoma Atlántico Sur'
        }];
      case 'honduras':
        return [{
          value: 'atlantida',
          label: 'Atlántida'
        }, {
          value: 'choluteca',
          label: 'Choluteca'
        }, {
          value: 'colon',
          label: 'Colón'
        }, {
          value: 'comayagua',
          label: 'Comayagua'
        }, {
          value: 'copan',
          label: 'Copán'
        }, {
          value: 'cortes',
          label: 'Cortés'
        }, {
          value: 'el-paraiso',
          label: 'El Paraíso'
        }, {
          value: 'francisco-morazan',
          label: 'Francisco Morazán'
        }, {
          value: 'gracias-a-dios',
          label: 'Gracias a Dios'
        }, {
          value: 'intibuca',
          label: 'Intibucá'
        }, {
          value: 'islas-de-la-bahia',
          label: 'Islas de la Bahía'
        }, {
          value: 'la-paz',
          label: 'La Paz'
        }, {
          value: 'lempira',
          label: 'Lempira'
        }, {
          value: 'ocotepeque',
          label: 'Ocotepeque'
        }, {
          value: 'olancho',
          label: 'Olancho'
        }, {
          value: 'santa-barbara',
          label: 'Santa Bárbara'
        }, {
          value: 'valle',
          label: 'Valle'
        }, {
          value: 'yoro',
          label: 'Yoro'
        }];
      case 'el-salvador':
        return [{
          value: 'ahuachapan',
          label: 'Ahuachapán'
        }, {
          value: 'cabanas',
          label: 'Cabañas'
        }, {
          value: 'chalatenango',
          label: 'Chalatenango'
        }, {
          value: 'cuscatlan',
          label: 'Cuscatlán'
        }, {
          value: 'la-libertad',
          label: 'La Libertad'
        }, {
          value: 'la-paz',
          label: 'La Paz'
        }, {
          value: 'la-union',
          label: 'La Unión'
        }, {
          value: 'morazan',
          label: 'Morazán'
        }, {
          value: 'san-miguel',
          label: 'San Miguel'
        }, {
          value: 'san-salvador',
          label: 'San Salvador'
        }, {
          value: 'san-vicente',
          label: 'San Vicente'
        }, {
          value: 'santa-ana',
          label: 'Santa Ana'
        }, {
          value: 'sonsonate',
          label: 'Sonsonate'
        }, {
          value: 'usulutan',
          label: 'Usulután'
        }];
      case 'guatemala':
        return [{
          value: 'alta-verapaz',
          label: 'Alta Verapaz'
        }, {
          value: 'baja-verapaz',
          label: 'Baja Verapaz'
        }, {
          value: 'chimaltenango',
          label: 'Chimaltenango'
        }, {
          value: 'chiquimula',
          label: 'Chiquimula'
        }, {
          value: 'el-progreso',
          label: 'El Progreso'
        }, {
          value: 'escuintla',
          label: 'Escuintla'
        }, {
          value: 'guatemala',
          label: 'Guatemala'
        }, {
          value: 'huehuetenango',
          label: 'Huehuetenango'
        }, {
          value: 'izabal',
          label: 'Izabal'
        }, {
          value: 'jalapa',
          label: 'Jalapa'
        }, {
          value: 'jutiapa',
          label: 'Jutiapa'
        }, {
          value: 'peten',
          label: 'Petén'
        }, {
          value: 'quetzaltenango',
          label: 'Quetzaltenango'
        }, {
          value: 'quiche',
          label: 'Quiché'
        }, {
          value: 'retalhuleu',
          label: 'Retalhuleu'
        }, {
          value: 'sacatepequez',
          label: 'Sacatepéquez'
        }, {
          value: 'san-marcos',
          label: 'San Marcos'
        }, {
          value: 'santa-rosa',
          label: 'Santa Rosa'
        }, {
          value: 'solola',
          label: 'Sololá'
        }, {
          value: 'suchitepequez',
          label: 'Suchitepéquez'
        }, {
          value: 'totonicapan',
          label: 'Totonicapán'
        }, {
          value: 'zacapa',
          label: 'Zacapa'
        }];
      case 'belize':
        return [{
          value: 'belize',
          label: 'Belize'
        }, {
          value: 'cayo',
          label: 'Cayo'
        }, {
          value: 'corozal',
          label: 'Corozal'
        }, {
          value: 'orange-walk',
          label: 'Orange Walk'
        }, {
          value: 'stann-creek',
          label: 'Stann Creek'
        }, {
          value: 'toledo',
          label: 'Toledo'
        }];
      case 'cuba':
        return [{
          value: 'artemisa',
          label: 'Artemisa'
        }, {
          value: 'camaguey',
          label: 'Camagüey'
        }, {
          value: 'ciego-de-avila',
          label: 'Ciego de Ávila'
        }, {
          value: 'cienfuegos',
          label: 'Cienfuegos'
        }, {
          value: 'granma',
          label: 'Granma'
        }, {
          value: 'guantanamo',
          label: 'Guantánamo'
        }, {
          value: 'holguin',
          label: 'Holguín'
        }, {
          value: 'isla-de-la-juventud',
          label: 'Isla de la Juventud'
        }, {
          value: 'la-habana',
          label: 'La Habana'
        }, {
          value: 'las-tunas',
          label: 'Las Tunas'
        }, {
          value: 'matanzas',
          label: 'Matanzas'
        }, {
          value: 'mayabeque',
          label: 'Mayabeque'
        }, {
          value: 'pinar-del-rio',
          label: 'Pinar del Río'
        }, {
          value: 'sancti-spiritus',
          label: 'Sancti Spíritus'
        }, {
          value: 'santiago-de-cuba',
          label: 'Santiago de Cuba'
        }, {
          value: 'villa-clara',
          label: 'Villa Clara'
        }];
      case 'republica-dominicana':
        return [{
          value: 'azua',
          label: 'Azua'
        }, {
          value: 'baoruco',
          label: 'Baoruco'
        }, {
          value: 'barahona',
          label: 'Barahona'
        }, {
          value: 'dajabon',
          label: 'Dajabón'
        }, {
          value: 'distrito-nacional',
          label: 'Distrito Nacional'
        }, {
          value: 'duarte',
          label: 'Duarte'
        }, {
          value: 'el-seibo',
          label: 'El Seibo'
        }, {
          value: 'elias-pina',
          label: 'Elías Piña'
        }, {
          value: 'espaillat',
          label: 'Espaillat'
        }, {
          value: 'hato-mayor',
          label: 'Hato Mayor'
        }, {
          value: 'hermanas-mirabal',
          label: 'Hermanas Mirabal'
        }, {
          value: 'independencia',
          label: 'Independencia'
        }, {
          value: 'la-altagracia',
          label: 'La Altagracia'
        }, {
          value: 'la-romana',
          label: 'La Romana'
        }, {
          value: 'la-vega',
          label: 'La Vega'
        }, {
          value: 'maria-trinidad-sanchez',
          label: 'María Trinidad Sánchez'
        }, {
          value: 'monsenor-nouel',
          label: 'Monseñor Nouel'
        }, {
          value: 'monte-cristi',
          label: 'Monte Cristi'
        }, {
          value: 'monte-plata',
          label: 'Monte Plata'
        }, {
          value: 'pedernales',
          label: 'Pedernales'
        }, {
          value: 'peravia',
          label: 'Peravia'
        }, {
          value: 'puerto-plata',
          label: 'Puerto Plata'
        }, {
          value: 'samana',
          label: 'Samaná'
        }, {
          value: 'san-cristobal',
          label: 'San Cristóbal'
        }, {
          value: 'san-jose-de-ocoa',
          label: 'San José de Ocoa'
        }, {
          value: 'san-juan',
          label: 'San Juan'
        }, {
          value: 'san-pedro-de-macoris',
          label: 'San Pedro de Macorís'
        }, {
          value: 'sanchez-ramirez',
          label: 'Sánchez Ramírez'
        }, {
          value: 'santiago',
          label: 'Santiago'
        }, {
          value: 'santiago-rodriguez',
          label: 'Santiago Rodríguez'
        }, {
          value: 'santo-domingo',
          label: 'Santo Domingo'
        }, {
          value: 'valverde',
          label: 'Valverde'
        }];
      case 'haiti':
        return [{
          value: 'artibonite',
          label: 'Artibonite'
        }, {
          value: 'centre',
          label: 'Centre'
        }, {
          value: 'grand-anse',
          label: 'Grand\'Anse'
        }, {
          value: 'nippes',
          label: 'Nippes'
        }, {
          value: 'nord',
          label: 'Nord'
        }, {
          value: 'nord-est',
          label: 'Nord-Est'
        }, {
          value: 'nord-ouest',
          label: 'Nord-Ouest'
        }, {
          value: 'ouest',
          label: 'Ouest'
        }, {
          value: 'sud',
          label: 'Sud'
        }, {
          value: 'sud-est',
          label: 'Sud-Est'
        }];
      case 'puerto-rico':
        return [{
          value: 'san-juan',
          label: 'San Juan'
        }, {
          value: 'bayamon',
          label: 'Bayamón'
        }, {
          value: 'carolina',
          label: 'Carolina'
        }, {
          value: 'ponce',
          label: 'Ponce'
        }, {
          value: 'caguas',
          label: 'Caguas'
        }, {
          value: 'guaynabo',
          label: 'Guaynabo'
        }, {
          value: 'arecibo',
          label: 'Arecibo'
        }, {
          value: 'toa-baja',
          label: 'Toa Baja'
        }, {
          value: 'mayaguez',
          label: 'Mayagüez'
        }, {
          value: 'trujillo-alto',
          label: 'Trujillo Alto'
        }];
      case 'usa':
        return [{
          value: 'alabama',
          label: 'Alabama'
        }, {
          value: 'alaska',
          label: 'Alaska'
        }, {
          value: 'arizona',
          label: 'Arizona'
        }, {
          value: 'arkansas',
          label: 'Arkansas'
        }, {
          value: 'california',
          label: 'California'
        }, {
          value: 'colorado',
          label: 'Colorado'
        }, {
          value: 'connecticut',
          label: 'Connecticut'
        }, {
          value: 'delaware',
          label: 'Delaware'
        }, {
          value: 'florida',
          label: 'Florida'
        }, {
          value: 'georgia',
          label: 'Georgia'
        }, {
          value: 'hawaii',
          label: 'Hawaii'
        }, {
          value: 'idaho',
          label: 'Idaho'
        }, {
          value: 'illinois',
          label: 'Illinois'
        }, {
          value: 'indiana',
          label: 'Indiana'
        }, {
          value: 'iowa',
          label: 'Iowa'
        }, {
          value: 'kansas',
          label: 'Kansas'
        }, {
          value: 'kentucky',
          label: 'Kentucky'
        }, {
          value: 'louisiana',
          label: 'Louisiana'
        }, {
          value: 'maine',
          label: 'Maine'
        }, {
          value: 'maryland',
          label: 'Maryland'
        }, {
          value: 'massachusetts',
          label: 'Massachusetts'
        }, {
          value: 'michigan',
          label: 'Michigan'
        }, {
          value: 'minnesota',
          label: 'Minnesota'
        }, {
          value: 'mississippi',
          label: 'Mississippi'
        }, {
          value: 'missouri',
          label: 'Missouri'
        }, {
          value: 'montana',
          label: 'Montana'
        }, {
          value: 'nebraska',
          label: 'Nebraska'
        }, {
          value: 'nevada',
          label: 'Nevada'
        }, {
          value: 'new-hampshire',
          label: 'New Hampshire'
        }, {
          value: 'new-jersey',
          label: 'New Jersey'
        }, {
          value: 'new-mexico',
          label: 'New Mexico'
        }, {
          value: 'new-york',
          label: 'New York'
        }, {
          value: 'north-carolina',
          label: 'North Carolina'
        }, {
          value: 'north-dakota',
          label: 'North Dakota'
        }, {
          value: 'ohio',
          label: 'Ohio'
        }, {
          value: 'oklahoma',
          label: 'Oklahoma'
        }, {
          value: 'oregon',
          label: 'Oregon'
        }, {
          value: 'pennsylvania',
          label: 'Pennsylvania'
        }, {
          value: 'rhode-island',
          label: 'Rhode Island'
        }, {
          value: 'south-carolina',
          label: 'South Carolina'
        }, {
          value: 'south-dakota',
          label: 'South Dakota'
        }, {
          value: 'tennessee',
          label: 'Tennessee'
        }, {
          value: 'texas',
          label: 'Texas'
        }, {
          value: 'utah',
          label: 'Utah'
        }, {
          value: 'vermont',
          label: 'Vermont'
        }, {
          value: 'virginia',
          label: 'Virginia'
        }, {
          value: 'washington',
          label: 'Washington'
        }, {
          value: 'west-virginia',
          label: 'West Virginia'
        }, {
          value: 'wisconsin',
          label: 'Wisconsin'
        }, {
          value: 'wyoming',
          label: 'Wyoming'
        }];
      case 'brasil':
        return [{
          value: 'acre',
          label: 'Acre'
        }, {
          value: 'alagoas',
          label: 'Alagoas'
        }, {
          value: 'amapa',
          label: 'Amapá'
        }, {
          value: 'amazonas',
          label: 'Amazonas'
        }, {
          value: 'bahia',
          label: 'Bahia'
        }, {
          value: 'ceara',
          label: 'Ceará'
        }, {
          value: 'distrito-federal',
          label: 'Distrito Federal'
        }, {
          value: 'espirito-santo',
          label: 'Espírito Santo'
        }, {
          value: 'goias',
          label: 'Goiás'
        }, {
          value: 'maranhao',
          label: 'Maranhão'
        }, {
          value: 'mato-grosso',
          label: 'Mato Grosso'
        }, {
          value: 'mato-grosso-do-sul',
          label: 'Mato Grosso do Sul'
        }, {
          value: 'minas-gerais',
          label: 'Minas Gerais'
        }, {
          value: 'para',
          label: 'Pará'
        }, {
          value: 'paraiba',
          label: 'Paraíba'
        }, {
          value: 'parana',
          label: 'Paraná'
        }, {
          value: 'pernambuco',
          label: 'Pernambuco'
        }, {
          value: 'piaui',
          label: 'Piauí'
        }, {
          value: 'rio-de-janeiro',
          label: 'Rio de Janeiro'
        }, {
          value: 'rio-grande-do-norte',
          label: 'Rio Grande do Norte'
        }, {
          value: 'rio-grande-do-sul',
          label: 'Rio Grande do Sul'
        }, {
          value: 'rondonia',
          label: 'Rondônia'
        }, {
          value: 'roraima',
          label: 'Roraima'
        }, {
          value: 'santa-catarina',
          label: 'Santa Catarina'
        }, {
          value: 'sao-paulo',
          label: 'São Paulo'
        }, {
          value: 'sergipe',
          label: 'Sergipe'
        }, {
          value: 'tocantins',
          label: 'Tocantins'
        }];
      case 'otros':
        return [{
          value: 'europa',
          label: 'Europa'
        }, {
          value: 'africa',
          label: 'África'
        }, {
          value: 'asia',
          label: 'Asia'
        }, {
          value: 'oceania',
          label: 'Oceanía'
        }, {
          value: 'otros',
          label: 'Otros'
        }];
      default:
        return [{
          value: 'region-general',
          label: 'Región no especificada'
        }];
    }
  };
  return <Dialog open={isOpen} modal onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-adagio-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-adagio-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Consentimiento y Privacidad - Entrenamiento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Antes de comenzar a grabar, necesitamos tu consentimiento explícito
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Biometric Data Warning */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tu voz es un dato biométrico</strong> que puede contener información sanitaria implícita. 
              Este procesamiento requiere tu consentimiento explícito según el RGPD (Art. 9).
            </AlertDescription>
          </Alert>

          {/* Consent Options */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border-2 border-adagio-primary/30 rounded-lg hover:bg-muted/30 transition-colors bg-adagio-primary/5">
              <Checkbox id="consent-train" checked={consentTrain} onCheckedChange={checked => setConsentTrain(checked as boolean)} className="mt-1" />
              <div className="flex-1">
                <label htmlFor="consent-train" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Usar mi audio para entrenar el modelo de IA
                  <span className="text-xs bg-adagio-primary text-white px-2 py-1 rounded-full">OBLIGATORIO</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">Tu voz será utilizada para mejorar la precisión del reconocimiento de voz mediante técnicas de aprendizaje automático. </p>
              </div>
            </div>
          </div>

          {/* Personal Information Fields */}
          <div className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input id="fullName" type="text" placeholder="Ingresa tu nombre completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Tu nombre será asociado con las grabaciones para fines de entrenamiento
              </p>
            </div>

            {/* Age Range Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="ageRange" className="text-sm font-medium">
                  Rango de edad <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rango de edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14-17">14–17 años (con autorización parental)</SelectItem>
                  <SelectItem value="18-25">18–25 años</SelectItem>
                  <SelectItem value="26-35">26–35 años</SelectItem>
                  <SelectItem value="36-45">36–45 años</SelectItem>
                  <SelectItem value="46-60">46–60 años</SelectItem>
                  <SelectItem value="61+">61+ años</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los rangos de edad ayudan a mejorar la precisión del modelo
              </p>
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="country" className="text-sm font-medium">
                  País <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select value={country} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spain">España</SelectItem>
                  <SelectItem value="mexico">México</SelectItem>
                  <SelectItem value="argentina">Argentina</SelectItem>
                  <SelectItem value="colombia">Colombia</SelectItem>
                  <SelectItem value="peru">Perú</SelectItem>
                  <SelectItem value="chile">Chile</SelectItem>
                  <SelectItem value="venezuela">Venezuela</SelectItem>
                  <SelectItem value="ecuador">Ecuador</SelectItem>
                  <SelectItem value="bolivia">Bolivia</SelectItem>
                  <SelectItem value="paraguay">Paraguay</SelectItem>
                  <SelectItem value="uruguay">Uruguay</SelectItem>
                  <SelectItem value="costa-rica">Costa Rica</SelectItem>
                  <SelectItem value="panama">Panamá</SelectItem>
                  <SelectItem value="nicaragua">Nicaragua</SelectItem>
                  <SelectItem value="honduras">Honduras</SelectItem>
                  <SelectItem value="el-salvador">El Salvador</SelectItem>
                  <SelectItem value="guatemala">Guatemala</SelectItem>
                  <SelectItem value="belize">Belice</SelectItem>
                  <SelectItem value="cuba">Cuba</SelectItem>
                  <SelectItem value="republica-dominicana">República Dominicana</SelectItem>
                  <SelectItem value="haiti">Haití</SelectItem>
                  <SelectItem value="puerto-rico">Puerto Rico</SelectItem>
                  <SelectItem value="usa">Estados Unidos</SelectItem>
                  <SelectItem value="brasil">Brasil</SelectItem>
                  <SelectItem value="otros">Otros países</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-adagio-primary" />
                <Label htmlFor="region" className="text-sm font-medium">
                  {country === 'spain' ? 'Comunidad Autónoma' : country === 'mexico' ? 'Estado' : country === 'argentina' ? 'Provincia' : country === 'colombia' ? 'Departamento' : country === 'peru' ? 'Departamento' : country === 'chile' ? 'Región' : country === 'venezuela' ? 'Estado' : country === 'ecuador' ? 'Provincia' : country === 'bolivia' ? 'Departamento' : country === 'paraguay' ? 'Departamento' : country === 'uruguay' ? 'Departamento' : country === 'costa-rica' ? 'Provincia' : country === 'panama' ? 'Provincia' : country === 'nicaragua' ? 'Departamento' : country === 'honduras' ? 'Departamento' : country === 'el-salvador' ? 'Departamento' : country === 'guatemala' ? 'Departamento' : country === 'belize' ? 'Distrito' : country === 'cuba' ? 'Provincia' : country === 'republica-dominicana' ? 'Provincia' : country === 'haiti' ? 'Departamento' : country === 'puerto-rico' ? 'Municipio' : country === 'usa' ? 'Estado' : country === 'brasil' ? 'Estado' : 'Región'} <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select value={region} onValueChange={setRegion} disabled={!country}>
                <SelectTrigger>
                  <SelectValue placeholder={!country ? "Primero selecciona un país" : country === 'spain' ? "Selecciona tu comunidad autónoma" : country === 'mexico' ? "Selecciona tu estado" : country === 'argentina' ? "Selecciona tu provincia" : country === 'colombia' ? "Selecciona tu departamento" : country === 'peru' ? "Selecciona tu departamento" : country === 'chile' ? "Selecciona tu región" : "Selecciona tu región"} />
                </SelectTrigger>
                <SelectContent>
                  {getRegionsForCountry(country).map(regionOption => <SelectItem key={regionOption.value} value={regionOption.value}>
                      {regionOption.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                La ubicación ayuda a mejorar el reconocimiento de acentos y variaciones dialectales
              </p>
            </div>
          </div>

          {/* Validation Error */}
          {!isValid && <Alert variant="destructive">
              <AlertDescription>
                Debes aceptar el consentimiento y completar todos los campos obligatorios para continuar.
              </AlertDescription>
            </Alert>}

          {/* Legal Information */}
          <div className="text-xs text-muted-foreground space-y-2 p-4 bg-muted/30 rounded-lg">
            <p><strong>Información RGPD:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Responsable:</strong> Adagio (hola@adagioweb.com)</li>
              <li>• <strong>Finalidad:</strong> Entrenamiento de modelos de IA y mejora del servicio</li>
              <li>• <strong>Base legal:</strong> Consentimiento explícito (Art. 6.1.a y 9.2.a RGPD)</li>
              <li>• <strong>Conservación:</strong> Hasta revocación del consentimiento</li>
              <li>• <strong>Destinatarios:</strong> No se ceden a terceros</li>
              <li>• <strong>Derechos:</strong> Acceso, rectificación, supresión, portabilidad y oposición</li>
            </ul>
            
            <div className="flex flex-wrap gap-4 mt-3 pt-2 border-t border-border/50">
              <Link to="/my-data" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Mis Datos <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/privacy-center" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Centro de Privacidad <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/privacy-policy" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Política de Privacidad <ExternalLink className="h-3 w-3" />
              </Link>
              <Link to="/terms" className="text-adagio-primary hover:text-adagio-accent text-xs flex items-center gap-1">
                Términos y Condiciones <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleAccept} disabled={!isValid} className="flex-1 sm:flex-none">
              <Shield className="mr-2 h-4 w-4" />
              Acepto y quiero continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};