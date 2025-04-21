import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMicroInteractions, MicroInteractionType } from './MicroInteractionContext';

// Propiedades para el componente MicroInteraction
interface MicroInteractionProps {
  id: string; // ID único para esta interacción
  type: MicroInteractionType; // Tipo de animación
  className?: string; // Clases adicionales
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Tamaño de la animación
  color?: string; // Color personalizado
  onAnimationComplete?: () => void; // Callback al completar
}

// Componente principal de interacción micro
export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  id,
  type,
  className = '',
  size = 'md',
  color,
  onAnimationComplete
}) => {
  // Usar el contexto para verificar si esta interacción está activa
  const { getInteractionState } = useMicroInteractions();
  const isActive = getInteractionState(id);

  // Mapeo de tamaños a clases
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Función para renderizar la animación según el tipo
  const renderAnimation = () => {
    // Propiedades comunes para todas las animaciones
    const commonProps = {
      className: `${sizeClasses[size]} ${className}`,
      style: color ? { color } : {},
      onAnimationComplete,
    };

    switch (type) {
      case 'like':
        return <LikeAnimation {...commonProps} />;
      case 'favorite':
        return <FavoriteAnimation {...commonProps} />;
      case 'success':
        return <SuccessAnimation {...commonProps} />;
      case 'booking':
        return <BookingAnimation {...commonProps} />;
      case 'reward':
        return <RewardAnimation {...commonProps} />;
      case 'tap':
        return <TapAnimation {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isActive && renderAnimation()}
    </AnimatePresence>
  );
};

// Animación de "Me gusta"
const LikeAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.2, 1],
      opacity: 1,
      color: ['#ff5656', '#ff0000']
    }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.39 20.87a.696.696 0 0 1-.78 0C9.764 19.637 2 14.15 2 8.973c0-6.68 7.85-7.75 10-3.25 2.15-4.5 10-3.43 10 3.25 0 5.178-7.764 10.664-9.61 11.895z" />
    </svg>
  </motion.div>
);

// Animación de Favorito
const FavoriteAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0, opacity: 0, rotate: -45 }}
    animate={{ 
      scale: [0, 1.2, 1],
      opacity: 1,
      rotate: 0,
      color: ['#ffd700', '#ffbb00']
    }}
    exit={{ scale: 0, opacity: 0, rotate: 45 }}
    transition={{ duration: 0.5 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
    </svg>
  </motion.div>
);

// Animación de Éxito
const SuccessAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0, opacity: 0, pathLength: 0 }}
    animate={{ 
      scale: 1,
      opacity: 1,
      pathLength: 1,
      color: ['#4caf50', '#45a049']
    }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <motion.path 
        d="M22 4L12 14.01l-3-3" 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </svg>
  </motion.div>
);

// Animación de Reserva
const BookingAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.1, 1],
      opacity: 1,
      color: ['#2196f3', '#0b7dda']
    }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
    </svg>
  </motion.div>
);

// Animación de Recompensa
const RewardAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0, opacity: 0, rotate: -180 }}
    animate={{ 
      scale: [0, 1.2, 1],
      opacity: 1,
      rotate: 0,
      color: ['#ffc107', '#ffa000']
    }}
    exit={{ scale: 0, opacity: 0, rotate: 180 }}
    transition={{ 
      duration: 0.6,
      scale: { type: "spring", stiffness: 300 }
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z" />
    </svg>
  </motion.div>
);

// Animación de Toque
const TapAnimation: React.FC<any> = (props) => (
  <motion.div
    {...props}
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ 
      scale: [0.5, 1, 0.8],
      opacity: [0, 0.8, 0],
      borderRadius: ["20%", "50%", "50%"]
    }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      background: 'rgba(144, 202, 249, 0.6)',
      ...props.style
    }}
  />
);

// Hook para usar interacciones micro en componentes
export const useTriggerInteraction = (id: string, type: MicroInteractionType, options?: { 
  autoTrigger?: boolean; 
  duration?: number;
  triggerEvent?: 'hover' | 'click';
}) => {
  const { triggerInteraction, setInteractionState } = useMicroInteractions();
  
  // Activar automáticamente si se solicita
  React.useEffect(() => {
    if (options?.autoTrigger) {
      triggerInteraction(id, type, options.duration);
    }
  }, [id, type, options?.autoTrigger, triggerInteraction, options?.duration]);
  
  // Devolver métodos para manejar la interacción
  return {
    trigger: () => triggerInteraction(id, type, options?.duration),
    setActive: (active: boolean) => setInteractionState(id, active),
    getProps: () => {
      if (!options?.triggerEvent) return {};
      
      return options.triggerEvent === 'click'
        ? { onClick: () => triggerInteraction(id, type, options.duration) }
        : { 
            onMouseEnter: () => setInteractionState(id, true),
            onMouseLeave: () => setInteractionState(id, false)
          };
    }
  };
};

export default MicroInteraction;