import React, { createContext, useState, useContext, ReactNode } from 'react';

// Tipos de interacciones disponibles
export type MicroInteractionType = 'like' | 'favorite' | 'success' | 'booking' | 'reward' | 'tap';

// Interfaz para el contexto
interface MicroInteractionContextType {
  // Estado para interacciones
  interactions: Record<string, boolean>;
  // Métodos para controlar interacciones
  triggerInteraction: (id: string, type: MicroInteractionType, duration?: number) => void;
  setInteractionState: (id: string, active: boolean) => void;
  getInteractionState: (id: string) => boolean;
  // Métodos de utilidad
  clearAllInteractions: () => void;
}

// Crear el contexto
const MicroInteractionContext = createContext<MicroInteractionContextType | null>(null);

// Hook personalizado para usar el contexto
export const useMicroInteractions = () => {
  const context = useContext(MicroInteractionContext);
  if (!context) {
    throw new Error('useMicroInteractions debe ser usado dentro de un MicroInteractionProvider');
  }
  return context;
};

// Propiedades del proveedor
interface MicroInteractionProviderProps {
  children: ReactNode;
}

// Componente proveedor
export const MicroInteractionProvider: React.FC<MicroInteractionProviderProps> = ({ children }) => {
  // Estado para almacenar todas las interacciones activas
  const [interactions, setInteractions] = useState<Record<string, boolean>>({});

  // Activar una interacción con un ID único
  const triggerInteraction = (id: string, type: MicroInteractionType, duration = 1000) => {
    setInteractions(prev => ({ ...prev, [id]: true }));
    
    // Si se proporciona una duración, desactivar automáticamente después de ese tiempo
    if (duration > 0) {
      setTimeout(() => {
        setInteractions(prev => ({ ...prev, [id]: false }));
      }, duration);
    }
  };

  // Establecer directamente el estado de una interacción
  const setInteractionState = (id: string, active: boolean) => {
    setInteractions(prev => ({ ...prev, [id]: active }));
  };

  // Obtener el estado actual de una interacción
  const getInteractionState = (id: string) => {
    return interactions[id] || false;
  };

  // Limpiar todas las interacciones activas
  const clearAllInteractions = () => {
    setInteractions({});
  };

  return (
    <MicroInteractionContext.Provider
      value={{
        interactions,
        triggerInteraction,
        setInteractionState,
        getInteractionState,
        clearAllInteractions,
      }}
    >
      {children}
    </MicroInteractionContext.Provider>
  );
};

export default MicroInteractionProvider;