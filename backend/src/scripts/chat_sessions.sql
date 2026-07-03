-- Tabla para almacenar el estado de las sesiones de chat de la IA
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    current_state TEXT NOT NULL DEFAULT 'WELCOME',
    collected_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de RLS (opcional si usas service_role, pero buena práctica)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all chat_sessions" ON public.chat_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);
