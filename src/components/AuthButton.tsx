import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AuthButton = () => {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="bg-white/10 text-white border-white/20">
        Cargando...
      </Button>
    );
  }

  if (user) {
    const displayName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : user.email?.split('@')[0] || 'Usuario';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <User className="h-4 w-4" />
            {displayName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/privacy-center" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Centro de Privacidad
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
      <Link to="/auth">
        <LogIn className="h-4 w-4" />
        Iniciar sesión
      </Link>
    </Button>
  );
};