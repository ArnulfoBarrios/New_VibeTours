# VibeTours - Recursos Visuales y Mockups de Interfaz para la Presentación

Este documento compila los recursos visuales y las pantallas (mockups) de la aplicación móvil VibeTours. Úsalos como soporte gráfico e imágenes de demostración para tus diapositivas y el contenido de NotebookLM.

---

## 📸 Mockups de Interfaz Oficiales

### 1. Diapositiva 1 (Recorrido y Navegación en Vivo)
El siguiente mockup representa la pantalla de **Navegación Activa (Live Tour Navigation)** en modo oscuro, mostrando la visualización en tiempo real del GPS y el sistema de guía de voz nativa:

![VibeTours Live Navigation Screen](file:///C:/Users/Emotiva/.gemini/antigravity/brain/ee1ce113-8846-42d1-b0ec-922ccd98e94e/vibetours_live_navigation_1784056469966.png)

*   **Detalles del Mockup**:
    *   **Mapa Vectorial Oscuro**: Estilo cartográfico adaptado a la noche para resaltar los caminos.
    *   **Ruta de Viaje**: Una línea neon cian/azul brillante que une las paradas físicas.
    *   **Tarjeta Glassmorphic**: En la sección inferior, un panel translúcido muestra información de la parada actual (*"Stop 2: Cathedral of Santa Maria"*), distancia restante, tiempo sugerido y controles para el reproductor de audio de la guía de voz (TTS).

---

### 2. Diapositiva 2 (Planificador y Chat de IA)
Este mockup representa la interfaz del **Asistente de Viaje Conversacional (AI Chat Planner)**, que ilustra cómo funciona la máquina de estados y la captura de datos:

![VibeTours AI Planner Chat Screen](file:///C:/Users/Emotiva/.gemini/antigravity/brain/ee1ce113-8846-42d1-b0ec-922ccd98e94e/vibetours_ai_chat_1784056482019.png)

*   **Detalles del Mockup**:
    *   **Feed de Conversación**: Burbujas de diálogo translúcidas de estilo *glassmorphism* que muestran el flujo de preguntas y respuestas entre el viajero y la IA.
    *   **Ingreso de Prompt**: Campo de texto y botón flotante de micrófono para el dictado por voz (Speech-to-Text).
    *   **Tarjeta de Previsualización**: Un pequeño mapa embebido dentro del historial de chat, permitiendo al usuario confirmar el trazado antes de guardarlo en Supabase.

---

## 💡 Cómo integrar estos recursos en tus diapositivas físicas
Para lograr el impacto de alta densidad e infografía que viste en el ejemplo de *Acens*:
1.  **Diapositiva 1**: Coloca la imagen `vibetours_live_navigation` en la parte superior derecha de tu diapositiva, justo después de la Tarjeta 4 ("El Motor de Datos"), de modo que la línea de ruta de la infografía parezca salir del mapa de la aplicación móvil.
2.  **Diapositiva 2**: Sitúa el chat `vibetours_ai_chat` en el centro de la diapositiva, conectando de forma gráfica la Tarjeta 1 ("La Ingeniería") y la Tarjeta 2 ("La Base del Negocio"), demostrando visualmente cómo los inputs capturados por el chat se escriben de manera segura en Supabase con políticas RLS.
