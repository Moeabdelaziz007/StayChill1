import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, ThumbsUp, Star, Calendar, Gift, Hand } from "lucide-react";
import MicroInteraction, { useTriggerInteraction } from "@/components/animations/MicroInteractions";
import { useMicroInteractions, MicroInteractionType } from '@/components/animations/MicroInteractionContext';

// Ejemplo de implementación de microinteracciones
const AnimationDemo = () => {
  const [activeTab, setActiveTab] = useState<string>('examples');
  
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Micro Interacciones</h1>
          <p className="text-muted-foreground">
            Mejorando la experiencia del usuario con animaciones sutiles y significativas
          </p>
        </div>
        
        <Tabs defaultValue="examples" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="examples">Ejemplos</TabsTrigger>
              <TabsTrigger value="integration">Integración</TabsTrigger>
              <TabsTrigger value="playground">Experimental</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="examples" className="space-y-6">
            <AnimationExamplesSection />
          </TabsContent>
          
          <TabsContent value="integration" className="space-y-6">
            <IntegrationExamplesSection />
          </TabsContent>
          
          <TabsContent value="playground" className="space-y-6">
            <AnimationPlaygroundSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Sección de ejemplos de animaciones
const AnimationExamplesSection = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AnimationExampleCard 
        title="Me gusta" 
        description="Animación de corazón con efecto de latido"
        type="like"
        icon={<Heart className="h-5 w-5 text-rose-500" />}
      />
      
      <AnimationExampleCard 
        title="Favorito" 
        description="Animación de estrella con efecto de brillo"
        type="favorite"
        icon={<Star className="h-5 w-5 text-amber-400" />}
      />
      
      <AnimationExampleCard 
        title="Éxito" 
        description="Animación de confirmación de acción"
        type="success"
        icon={<ThumbsUp className="h-5 w-5 text-green-500" />}
      />
      
      <AnimationExampleCard 
        title="Reserva" 
        description="Animación para confirmación de reserva"
        type="booking"
        icon={<Calendar className="h-5 w-5 text-blue-500" />}
      />
      
      <AnimationExampleCard 
        title="Recompensa" 
        description="Animación para recibir puntos o recompensas"
        type="reward"
        icon={<Gift className="h-5 w-5 text-purple-500" />}
      />
      
      <AnimationExampleCard 
        title="Toque" 
        description="Efecto de ondas para interacciones táctiles"
        type="tap"
        icon={<Hand className="h-5 w-5 text-slate-500" />}
      />
    </div>
  );
};

// Tarjeta para mostrar un ejemplo de animación
const AnimationExampleCard = ({ 
  title, 
  description, 
  type, 
  icon 
}: { 
  title: string; 
  description: string; 
  type: MicroInteractionType;
  icon: React.ReactNode;
}) => {
  const id = `example-${type}`;
  const { triggerInteraction } = useMicroInteractions();
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          {icon}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-40 flex items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <MicroInteraction id={id} type={type} size="lg" />
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 pt-3">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => triggerInteraction(id, type, 1000)}
        >
          Activar animación
        </Button>
      </CardFooter>
    </Card>
  );
};

// Sección de ejemplos de integración
const IntegrationExamplesSection = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integración en componentes UI</CardTitle>
          <CardDescription>
            Ejemplos de cómo las micro interacciones mejoran la experiencia de usuario cuando se integran con componentes existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <LikeButtonExample />
          <Separator />
          <FavoriteToggleExample />
          <Separator />
          <RewardPointsExample />
        </CardContent>
      </Card>
    </div>
  );
};

// Ejemplo de botón de "Me gusta" con animación
const LikeButtonExample = () => {
  const [liked, setLiked] = useState(false);
  const { trigger, setActive } = useTriggerInteraction('like-button', 'like', {
    duration: 800
  });
  
  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      trigger();
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium">Botón de Me gusta</h3>
      <p className="text-muted-foreground">
        El botón muestra una animación cuando el usuario hace clic para indicar "me gusta".
      </p>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button 
            variant={liked ? "secondary" : "outline"}
            size="lg"
            onClick={handleLike}
            className={`relative ${liked ? 'text-rose-500' : ''}`}
          >
            <Heart className="h-5 w-5 mr-2" />
            {liked ? 'Te gusta' : 'Me gusta'}
          </Button>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MicroInteraction id="like-button" type="like" size="lg" />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          543 me gusta
        </div>
      </div>
    </div>
  );
};

// Ejemplo de toggle de favoritos con animación
const FavoriteToggleExample = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { trigger } = useTriggerInteraction('favorite-toggle', 'favorite', {
    duration: 800
  });
  
  const handleToggle = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      trigger();
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium">Favoritos</h3>
      <p className="text-muted-foreground">
        Cuando un usuario marca un elemento como favorito, una animación refuerza la acción.
      </p>
      
      <div className="flex flex-wrap gap-4">
        <Card className="w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Villa de playa</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                alt="Villa de playa"
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm">5.0 ★ · $180/noche</div>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleToggle}
                className="relative"
              >
                <Star 
                  className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                />
              </Button>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <MicroInteraction id="favorite-toggle" type="favorite" />
              </div>
            </div>
          </CardFooter>
        </Card>
        
        <div className="flex-1 min-w-[300px] flex items-center">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Los favoritos permiten a los usuarios guardar propiedades para ver más tarde.
            </p>
            <p>
              La animación proporciona una retroalimentación visual inmediata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ejemplo de animación de recompensa
const RewardPointsExample = () => {
  const [points, setPoints] = useState(125);
  const { trigger } = useTriggerInteraction('reward-points', 'reward', {
    duration: 1200
  });
  
  const handleEarnPoints = () => {
    setPoints(prev => prev + 10);
    trigger();
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium">Sistema de recompensas</h3>
      <p className="text-muted-foreground">
        Cuando un usuario gana puntos, una animación celebra el logro.
      </p>
      
      <div className="flex flex-wrap gap-6 items-center">
        <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-lg text-white min-w-[200px]">
          <div className="relative z-10">
            <div className="text-sm font-medium mb-1">ChillPoints</div>
            <div className="text-3xl font-bold mb-2">{points}</div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white">Nivel Plata</Badge>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MicroInteraction id="reward-points" type="reward" size="xl" color="#ffd54f" />
          </div>
        </div>
        
        <div className="flex-1 min-w-[250px] space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              Los puntos de recompensa animan a los usuarios a interactuar más con la plataforma.
            </p>
            <p>
              La animación hace que ganar puntos sea más satisfactorio.
            </p>
          </div>
          
          <Button onClick={handleEarnPoints}>
            <Gift className="h-4 w-4 mr-2" />
            Ganar 10 ChillPoints
          </Button>
        </div>
      </div>
    </div>
  );
};

// Sección de experimentación con animaciones
const AnimationPlaygroundSection = () => {
  const [selectedType, setSelectedType] = useState<MicroInteractionType>('success');
  const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const { triggerInteraction } = useMicroInteractions();
  
  const handleTrigger = () => {
    triggerInteraction('playground', selectedType, 1000);
  };
  
  const animationTypes: { value: MicroInteractionType; label: string }[] = [
    { value: 'like', label: 'Me gusta' },
    { value: 'favorite', label: 'Favorito' },
    { value: 'success', label: 'Éxito' },
    { value: 'booking', label: 'Reserva' },
    { value: 'reward', label: 'Recompensa' },
    { value: 'tap', label: 'Toque' }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Experimenta con animaciones</CardTitle>
        <CardDescription>
          Prueba diferentes combinaciones de animaciones y configuraciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Tipo de animación</h3>
              <div className="flex flex-wrap gap-2">
                {animationTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Tamaño</h3>
              <div className="flex gap-2">
                <Button
                  variant={selectedSize === 'sm' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSize('sm')}
                >
                  Pequeño
                </Button>
                <Button
                  variant={selectedSize === 'md' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSize('md')}
                >
                  Mediano
                </Button>
                <Button
                  variant={selectedSize === 'lg' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSize('lg')}
                >
                  Grande
                </Button>
                <Button
                  variant={selectedSize === 'xl' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSize('xl')}
                >
                  Extra grande
                </Button>
              </div>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleTrigger} size="lg" className="w-full">
                Probar animación
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[250px] bg-muted/30 rounded-lg relative">
            <div className="text-center text-muted-foreground">
              La animación aparecerá aquí
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MicroInteraction id="playground" type={selectedType} size={selectedSize} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimationDemo;