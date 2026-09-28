import React, { useEffect, useRef } from 'react';
import { Application, Text } from 'pixi.js';

export default function TestPixi() {
  const pixiContainer = useRef(null);
  
  useEffect(() => {
    let app;
    let isDestroyed = false;

    const initPixi = async () => {
      app = new Application();
      await app.init({
        width: 800,
        height: 600,
        background: '#0F212E',
      });
      
      if (isDestroyed) {
        app.destroy(true);
        return;
      }
      
      pixiContainer.current?.appendChild(app.canvas);
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (app) {
        app.destroy(true);
      }
    };
  }, []);

  return <div ref={pixiContainer} />;
}
