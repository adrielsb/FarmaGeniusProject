-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO COMPLETA DO BANCO SUPABASE
-- FarmaGenius Project - Otimização e Garantia de Estrutura
-- =====================================================

-- 📊 1. VERIFICAÇÃO E OTIMIZAÇÃO DA TABELA REPORTS
-- =====================================================

-- Verificar se existem índices necessários
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Verificar se as colunas existem e adicionar se necessário
DO $$ 
BEGIN
    -- Adicionar coluna total_quantity se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'total_quantity') THEN
        ALTER TABLE reports ADD COLUMN total_quantity INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_quantity adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna total_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'total_value') THEN
        ALTER TABLE reports ADD COLUMN total_value DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna total_value adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna solid_count se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'solid_count') THEN
        ALTER TABLE reports ADD COLUMN solid_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna solid_count adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna top_seller se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'top_seller') THEN
        ALTER TABLE reports ADD COLUMN top_seller TEXT;
        RAISE NOTICE 'Coluna top_seller adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna processed_data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'processed_data') THEN
        ALTER TABLE reports ADD COLUMN processed_data JSONB;
        RAISE NOTICE 'Coluna processed_data adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna kanban_data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'kanban_data') THEN
        ALTER TABLE reports ADD COLUMN kanban_data JSONB;
        RAISE NOTICE 'Coluna kanban_data adicionada à tabela reports';
    END IF;
    
    -- Adicionar coluna sellers_data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'sellers_data') THEN
        ALTER TABLE reports ADD COLUMN sellers_data JSONB;
        RAISE NOTICE 'Coluna sellers_data adicionada à tabela reports';
    END IF;
    
    RAISE NOTICE 'Verificação da tabela reports concluída ✅';
END $$;

-- 📋 2. VERIFICAÇÃO E OTIMIZAÇÃO DA TABELA REPORT_ITEMS
-- =====================================================

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_report_items_report_id ON report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_report_items_vendedor ON report_items(vendedor);
CREATE INDEX IF NOT EXISTS idx_report_items_categoria ON report_items(categoria);
CREATE INDEX IF NOT EXISTS idx_report_items_horario ON report_items(horario);
CREATE INDEX IF NOT EXISTS idx_report_items_row_index ON report_items(row_index);

-- Verificar estrutura da tabela report_items
DO $$ 
BEGIN
    -- Verificar se a tabela existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_items') THEN
        CREATE TABLE report_items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            form_norm TEXT,
            linha TEXT,
            horario TEXT,
            vendedor TEXT,
            quantidade INTEGER DEFAULT 0,
            valor DECIMAL(10,2) DEFAULT 0.00,
            categoria TEXT,
            source_file TEXT,
            row_index INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela report_items criada ✅';
    END IF;
    
    -- Adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_items' AND column_name = 'source_file') THEN
        ALTER TABLE report_items ADD COLUMN source_file TEXT;
        RAISE NOTICE 'Coluna source_file adicionada à tabela report_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_items' AND column_name = 'row_index') THEN
        ALTER TABLE report_items ADD COLUMN row_index INTEGER;
        RAISE NOTICE 'Coluna row_index adicionada à tabela report_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_items' AND column_name = 'categoria') THEN
        ALTER TABLE report_items ADD COLUMN categoria TEXT;
        RAISE NOTICE 'Coluna categoria adicionada à tabela report_items';
    END IF;
    
    RAISE NOTICE 'Verificação da tabela report_items concluída ✅';
END $$;

-- 👥 3. VERIFICAÇÃO DA TABELA USERS
-- =====================================================

-- Criar índices para users se necessário
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Verificar estrutura básica da tabela users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela users criada ✅';
    ELSE
        RAISE NOTICE 'Tabela users já existe ✅';
    END IF;
END $$;

-- 📝 4. TABELA DE OBSERVAÇÕES DIÁRIAS (OPCIONAL)
-- =====================================================

-- Criar tabela daily_observations se não existir (usada no histórico)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_observations') THEN
        CREATE TABLE daily_observations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            date DATE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            observation TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_daily_observations_date ON daily_observations(date);
        CREATE INDEX idx_daily_observations_user_id ON daily_observations(user_id);
        
        RAISE NOTICE 'Tabela daily_observations criada com índices ✅';
    ELSE
        RAISE NOTICE 'Tabela daily_observations já existe ✅';
    END IF;
END $$;

-- 🗂️ 5. TABELA DE MAPEAMENTO DE FÓRMULAS (FORM_MAPPINGS)
-- =====================================================

-- Criar tabela form_mappings se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_mappings') THEN
        CREATE TABLE form_mappings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            original_form VARCHAR NOT NULL,
            mapped_category VARCHAR NOT NULL,
            confidence_score INTEGER DEFAULT 0,
            suggestion_reason TEXT,
            mapping_source VARCHAR DEFAULT 'manual' CHECK (mapping_source IN ('manual', 'suggestion', 'auto')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Constraint para evitar duplicatas
            UNIQUE(user_id, original_form)
        );
        
        -- Criar índices para melhor performance
        CREATE INDEX idx_form_mappings_user_id ON form_mappings(user_id);
        CREATE INDEX idx_form_mappings_original_form ON form_mappings(original_form);
        CREATE INDEX idx_form_mappings_user_form ON form_mappings(user_id, original_form);
        
        RAISE NOTICE 'Tabela form_mappings criada com índices ✅';
    ELSE
        RAISE NOTICE 'Tabela form_mappings já existe ✅';
    END IF;
END $$;

-- 🔧 6. POLÍTICAS DE SEGURANÇA RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_items ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas tabelas opcionais se existirem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_observations') THEN
        ALTER TABLE daily_observations ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para daily_observations ✅';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_mappings') THEN
        ALTER TABLE form_mappings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para form_mappings ✅';
    END IF;
END $$;

-- Política para reports - acesso geral (conforme código atual)
DO $$ 
BEGIN
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "reports_user_policy" ON reports;
    DROP POLICY IF EXISTS "reports_access_policy" ON reports;
    
    -- Criar nova política mais flexível para permitir acesso geral
    CREATE POLICY "reports_access_policy" ON reports
        FOR ALL 
        USING (true)
        WITH CHECK (true);
        
    RAISE NOTICE 'Política de acesso criada para reports ✅';
END $$;

-- Política para report_items
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "report_items_user_policy" ON report_items;
    DROP POLICY IF EXISTS "report_items_access_policy" ON report_items;
    
    CREATE POLICY "report_items_access_policy" ON report_items
        FOR ALL 
        USING (true)
        WITH CHECK (true);
        
    RAISE NOTICE 'Política de acesso criada para report_items ✅';
END $$;

-- Política para daily_observations
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_observations') THEN
        DROP POLICY IF EXISTS "daily_observations_user_policy" ON daily_observations;
        DROP POLICY IF EXISTS "daily_observations_access_policy" ON daily_observations;
        
        CREATE POLICY "daily_observations_access_policy" ON daily_observations
            FOR ALL 
            USING (true)
            WITH CHECK (true);
            
        RAISE NOTICE 'Política de acesso criada para daily_observations ✅';
    END IF;
END $$;

-- Política para form_mappings
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_mappings') THEN
        DROP POLICY IF EXISTS "Users can view their own mappings" ON form_mappings;
        DROP POLICY IF EXISTS "Users can insert their own mappings" ON form_mappings;
        DROP POLICY IF EXISTS "Users can update their own mappings" ON form_mappings;
        DROP POLICY IF EXISTS "Users can delete their own mappings" ON form_mappings;
        DROP POLICY IF EXISTS "form_mappings_access_policy" ON form_mappings;
        
        CREATE POLICY "form_mappings_access_policy" ON form_mappings
            FOR ALL 
            USING (true)
            WITH CHECK (true);
            
        RAISE NOTICE 'Política de acesso criada para form_mappings ✅';
    END IF;
END $$;

-- 📈 7. FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS DOS RELATÓRIOS
-- =====================================================

-- Função para recalcular estatísticas dos relatórios
CREATE OR REPLACE FUNCTION update_report_statistics(report_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE reports 
    SET 
        total_quantity = (
            SELECT COALESCE(SUM(quantidade), 0) 
            FROM report_items 
            WHERE report_id = report_uuid
        ),
        total_value = (
            SELECT COALESCE(SUM(valor), 0.00) 
            FROM report_items 
            WHERE report_id = report_uuid
        ),
        solid_count = (
            SELECT COUNT(*) 
            FROM report_items 
            WHERE report_id = report_uuid 
            AND (categoria ILIKE '%sólido%' OR form_norm ILIKE '%comprimido%' OR form_norm ILIKE '%cápsula%')
        ),
        top_seller = (
            SELECT vendedor 
            FROM report_items 
            WHERE report_id = report_uuid 
            AND vendedor IS NOT NULL
            GROUP BY vendedor 
            ORDER BY SUM(valor) DESC 
            LIMIT 1
        )
    WHERE id = report_uuid;
    
    RAISE NOTICE 'Estatísticas atualizadas para relatório: %', report_uuid;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Função update_report_statistics criada ✅';

-- 🏭 8. FUNÇÃO PARA CLASSIFICAÇÃO AUTOMÁTICA DE CATEGORIAS DE PRODUÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION categorize_formula(formula_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF formula_text IS NULL OR trim(formula_text) = '' THEN
        RETURN 'OUTROS';
    END IF;
    
    -- Converter para maiúsculas para comparação
    formula_text := upper(trim(formula_text));
    
    -- Classificação por tipo de fórmula
    IF formula_text ~ '.*(SOLUÇÃO|LOÇÃO|LÍQUIDO|XAROPE).*' THEN
        RETURN 'LÍQUIDOS';
    ELSIF formula_text ~ '.*(HOMEOPATIA|FLORAL|DILUIÇÃO).*' THEN
        RETURN 'HOMEOPATIA';
    ELSIF formula_text ~ '.*(COMPRIMIDO|CÁPSULA|SACHÊ|PÓ).*' THEN
        RETURN 'SÓLIDOS';
    ELSIF formula_text ~ '.*(CREME|POMADA|GEL|UNGUE).*' THEN
        RETURN 'SEMI-SÓLIDOS';
    ELSIF formula_text ~ '.*(INJETÁVEL|AMPOLA).*' THEN
        RETURN 'INJETÁVEIS';
    ELSE
        RETURN 'OUTROS';
    END IF;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Função categorize_formula criada ✅';

-- 🔄 9. FUNÇÕES PARA FORM_MAPPINGS
-- =====================================================

-- Função para atualizar updated_at automaticamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_mappings') THEN
        CREATE OR REPLACE FUNCTION update_form_mappings_updated_at()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        -- Criar trigger para atualizar updated_at
        DROP TRIGGER IF EXISTS trigger_update_form_mappings_updated_at ON form_mappings;
        CREATE TRIGGER trigger_update_form_mappings_updated_at
            BEFORE UPDATE ON form_mappings
            FOR EACH ROW
            EXECUTE FUNCTION update_form_mappings_updated_at();
            
        RAISE NOTICE 'Trigger para form_mappings criado ✅';
    END IF;
END $$;

-- 🧹 10. LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Remover registros órfãos (se houver)
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Contar registros órfãos antes da limpeza
    SELECT COUNT(*) INTO orphan_count
    FROM report_items 
    WHERE report_id NOT IN (SELECT id FROM reports);
    
    IF orphan_count > 0 THEN
        DELETE FROM report_items 
        WHERE report_id NOT IN (SELECT id FROM reports);
        RAISE NOTICE 'Removidos % registros órfãos de report_items', orphan_count;
    ELSE
        RAISE NOTICE 'Nenhum registro órfão encontrado ✅';
    END IF;
END $$;

-- 📊 11. ATUALIZAR CATEGORIAS AUTOMATICAMENTE
-- =====================================================

-- Atualizar categorias em report_items que estão vazias
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE report_items 
    SET categoria = categorize_formula(form_norm)
    WHERE categoria IS NULL OR categoria = '' OR categoria = 'OUTROS';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Atualizadas % categorias automaticamente', updated_count;
END $$;

-- 🔄 12. ATUALIZAR ESTATÍSTICAS DE TODOS OS RELATÓRIOS
-- =====================================================

-- Atualizar estatísticas de todos os relatórios existentes
DO $$
DECLARE
    report_record RECORD;
    total_reports INTEGER := 0;
BEGIN
    FOR report_record IN SELECT id FROM reports LOOP
        PERFORM update_report_statistics(report_record.id);
        total_reports := total_reports + 1;
    END LOOP;
    
    RAISE NOTICE 'Estatísticas atualizadas para % relatórios', total_reports;
END $$;

-- 📋 13. VERIFICAÇÃO FINAL E RELATÓRIO
-- =====================================================

DO $$
DECLARE
    reports_count INTEGER;
    items_count INTEGER;
    users_count INTEGER;
    mappings_count INTEGER := 0;
    observations_count INTEGER := 0;
BEGIN
    -- Contar registros finais
    SELECT COUNT(*) INTO reports_count FROM reports;
    SELECT COUNT(*) INTO items_count FROM report_items;
    SELECT COUNT(*) INTO users_count FROM users;
    
    -- Contar tabelas opcionais
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_mappings') THEN
        SELECT COUNT(*) INTO mappings_count FROM form_mappings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_observations') THEN
        SELECT COUNT(*) INTO observations_count FROM daily_observations;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ========================================';
    RAISE NOTICE '✅ ATUALIZAÇÃO COMPLETA FINALIZADA';
    RAISE NOTICE '🎯 ========================================';
    RAISE NOTICE '📊 Reports: %', reports_count;
    RAISE NOTICE '📋 Report Items: %', items_count;
    RAISE NOTICE '👥 Users: %', users_count;
    RAISE NOTICE '🗂️ Form Mappings: %', mappings_count;
    RAISE NOTICE '📝 Daily Observations: %', observations_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Banco otimizado para:';
    RAISE NOTICE '   • Dashboard Executivo com dados reais';
    RAISE NOTICE '   • Gestão de Produção inteligente';
    RAISE NOTICE '   • Histórico Avançado com filtros';
    RAISE NOTICE '   • Classificação automática de categorias';
    RAISE NOTICE '   • Performance melhorada com índices';
    RAISE NOTICE '   • Mapeamento de fórmulas';
    RAISE NOTICE '   • Observações diárias';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sistema pronto para uso!';
    RAISE NOTICE '🎯 ========================================';
END $$;

-- =====================================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO COMPLETA
-- FarmaGenius Project - Banco 100% Otimizado
-- =====================================================