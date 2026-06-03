import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-sena-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={36} className="text-amber-500" />
        </div>
        <div>
          <p className="font-display font-bold text-sena-900 text-5xl">404</p>
          <h1 className="font-display font-bold text-sena-900 text-2xl mt-2">Página no encontrada</h1>
          <p className="text-forest-500 text-sm mt-2 leading-relaxed">
            La sección que buscas no existe o no tienes permisos para verla.
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2 mx-auto">
          <Home size={16} /> Ir al dashboard
        </button>
      </div>
    </div>
  );
}
