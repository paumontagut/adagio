import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, FileText, Database, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
interface ConsentSectionProps {
  onConsentChange: (consentTrain: boolean, consentStore: boolean) => void;
  isValid: boolean;
}
export const ConsentSection = ({
  onConsentChange,
  isValid
}: ConsentSectionProps) => {
  const [consentTrain, setConsentTrain] = useState(false);
  const [consentStore, setConsentStore] = useState(false);
  const handleTrainConsentChange = (checked: boolean) => {
    setConsentTrain(checked);
    onConsentChange(checked, consentStore);
  };
  const handleStoreConsentChange = (checked: boolean) => {
    setConsentStore(checked);
    onConsentChange(consentTrain, checked);
  };
  return;
};