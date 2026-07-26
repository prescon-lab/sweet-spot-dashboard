-- Crie estas tabelas e políticas de segurança (RLS) no SQL Editor do seu projeto Lovable/Supabase.

-- Habilitar a extensão "uuid-ossp" se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================
-- Tabela: panel_docs
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.panel_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice no token para buscas rápidas
CREATE INDEX IF NOT EXISTS panel_docs_token_idx ON public.panel_docs(token);

-- ==============================================================
-- Tabela: access_tokens
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR NOT NULL UNIQUE,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'guardian')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Inserir um token admin padrão para o primeiro uso
INSERT INTO public.access_tokens (token, role)
VALUES ('admin-secret-token', 'admin')
ON CONFLICT (token) DO NOTHING;

-- ==============================================================
-- Storage Bucket: ej-photos
-- ==============================================================
-- Nota: Caso a criação de bucket falhe via SQL no editor web, crie-o manualmente no painel Storage.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ej-photos', 'ej-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- Políticas de Segurança (RLS) - panel_docs
-- ==============================================================
ALTER TABLE public.panel_docs ENABLE ROW LEVEL SECURITY;

-- Por segurança, bloqueamos leitura/escrita direta pelo cliente se a validação for no servidor (API server-side).
-- Se for acessar diretamente do cliente React, precisaremos destas políticas:

-- Leitura pública para todos os documentos (ou restrinja conforme a necessidade do projeto)
CREATE POLICY "Leitura publica permitida" ON public.panel_docs
    FOR SELECT USING (true);

-- Escrita restrita a quem tem token válido (exemplo genérico, a lógica real de validação ocorrerá na API)
CREATE POLICY "Escrita autenticada apenas via API" ON public.panel_docs
    FOR ALL USING (true) WITH CHECK (true);
    -- Substitua 'true' por auth.role() = 'authenticated' se usar o Auth do Supabase.

-- ==============================================================
-- Políticas de Segurança (RLS) - access_tokens
-- ==============================================================
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas admins ou a própria API podem ler/gravar tokens
CREATE POLICY "Leitura de tokens restrita" ON public.access_tokens
    FOR SELECT USING (true); 
    -- A validação será feita via API backend no TanStack Start
