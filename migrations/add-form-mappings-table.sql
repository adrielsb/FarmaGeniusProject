-- Criar tabela para mapeamentos de formas farmacêuticas
CREATE TABLE form_mappings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    original_form TEXT NOT NULL, -- Forma original encontrada no arquivo
    mapped_category TEXT NOT NULL, -- Categoria escolhida pelo usuário
    confidence_score DECIMAL(3,2) DEFAULT 0, -- Score de confiança da sugestão (se aplicável)
    suggestion_reason TEXT, -- Razão da sugestão automática
    mapping_source TEXT DEFAULT 'manual', -- 'manual', 'suggestion', 'auto'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar mapeamentos duplicados por usuário
    UNIQUE(user_id, original_form)
);

-- Índices para performance
CREATE INDEX idx_form_mappings_user_id ON form_mappings(user_id);
CREATE INDEX idx_form_mappings_original_form ON form_mappings(original_form);
CREATE INDEX idx_form_mappings_mapped_category ON form_mappings(mapped_category);

-- RLS policy
ALTER TABLE form_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own form mappings" ON form_mappings FOR ALL USING (auth.uid()::text = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_form_mappings_updated_at 
    BEFORE UPDATE ON form_mappings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE form_mappings IS 'Mapeamentos de formas farmacêuticas definidos pelos usuários';