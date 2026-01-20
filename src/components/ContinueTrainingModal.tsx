import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Heart } from "lucide-react";

interface ContinueTrainingModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onFinish: () => void;
  completedCount: number;
}

export const ContinueTrainingModal = ({
  isOpen,
  onContinue,
  onFinish,
  completedCount
}: ContinueTrainingModalProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            ¡Has completado el set prioritario!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p>
              Has grabado las <strong>{completedCount} frases</strong> del set prioritario. 
              ¡Muchas gracias por tu contribución!
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-4 w-4" />
              <span className="font-medium">¿Quieres seguir ayudando?</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tenemos más frases disponibles que ayudarán a mejorar aún más el modelo. 
              Puedes continuar o terminar cuando quieras.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onFinish} className="sm:flex-1">
            Terminar por hoy
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue} className="sm:flex-1 bg-primary hover:bg-primary/90">
            Seguir ayudando
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
