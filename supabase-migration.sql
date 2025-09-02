-- =====================================================
-- SCRIPT PARA MIGRAÇÃO DO FARMAGENEIUS PARA SUPABASE
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELAS DE AUTENTICAÇÃO
-- =====================================================

-- Tabela de contas (OAuth, providers, etc.)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, provider_account_id)
);

-- Tabela de sessões
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tokens de verificação
CREATE TABLE verificationtokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(identifier, token)
);

-- =====================================================
-- TABELAS PRINCIPAIS DO SISTEMA
-- =====================================================

-- Tabela de relatórios
CREATE TABLE reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    date TEXT NOT NULL, -- Data do relatório (ex: "01/08")
    status TEXT DEFAULT 'processing', -- processing, completed, error
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Arquivos uploadados
    diario_file_name TEXT,
    controle_file_name TEXT,
    
    -- KPIs calculados
    total_quantity INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    solid_count INTEGER DEFAULT 0,
    top_seller TEXT,
    
    -- Dados JSON
    processed_data JSONB,
    kanban_data JSONB,
    sellers_data JSONB
);

-- Tabela de itens dos relatórios
CREATE TABLE report_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    report_id TEXT NOT NULL,
    
    -- Dados do item processado
    form_norm TEXT,
    linha TEXT,
    horario TEXT,
    vendedor TEXT,
    quantidade INTEGER,
    valor DECIMAL(10,2),
    categoria TEXT,
    observacoes TEXT,
    
    -- Metadados
    source_file TEXT, -- diario ou controle
    row_index INTEGER,
    is_mapped BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mapeamentos
CREATE TABLE mappings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL, -- Nome do mapeamento
    description TEXT,
    
    -- JSON do mapeamento
    mapping_data JSONB NOT NULL,
    
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de processamento
CREATE TABLE processing_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    report_id TEXT,
    action TEXT NOT NULL, -- upload, process, export, etc
    details TEXT,
    status TEXT NOT NULL, -- success, error, warning
    duration INTEGER, -- em milliseconds
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de observações diárias
CREATE TABLE daily_observations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    date TEXT NOT NULL UNIQUE, -- Data no formato "DD/MM/YYYY" ou "DD/MM"
    observation TEXT NOT NULL,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de último processamento
CREATE TABLE last_processing (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    report_date TEXT NOT NULL UNIQUE, -- Data do relatório processado
    report_id TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Dados resumidos para exibição rápida
    total_quantity INTEGER NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    solid_count INTEGER NOT NULL,
    top_seller TEXT NOT NULL,
    
    -- Nomes dos arquivos originais
    diario_file_name TEXT NOT NULL,
    controle_file_name TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do usuário
CREATE TABLE user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT UNIQUE NOT NULL,
    settings JSONB NOT NULL, -- JSON com todas as configurações do usuário
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas de produção
CREATE TABLE production_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    time_slot TEXT NOT NULL, -- "7:00 AS 8:00", "10:00 AS 13:00", etc.
    category TEXT NOT NULL, -- "SÓLIDOS", "LÍQUIDOS", "SEMI-SÓLIDOS", etc.
    capacity INTEGER NOT NULL, -- Capacidade de produção
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, time_slot, category)
);

-- Tabela de capacidade diária
CREATE TABLE daily_capacities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT UNIQUE NOT NULL,
    total_capacity INTEGER NOT NULL, -- Capacidade total diária
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de inadimplentes
CREATE TABLE defaulters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL, -- Nome da pessoa inadimplente
    phone TEXT NOT NULL, -- Telefone de contato
    due_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Data de vencimento
    amount DECIMAL(10,2) NOT NULL, -- Valor em aberto
    status TEXT DEFAULT 'pending', -- pending, contacted, paid, cancelled
    description TEXT, -- Observações adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    table_name TEXT NOT NULL, -- Nome da tabela afetada
    record_id TEXT, -- ID do registro afetado
    old_values JSONB, -- Valores anteriores (para UPDATE/DELETE)
    new_values JSONB, -- Novos valores (para CREATE/UPDATE)
    ip_address TEXT, -- IP do usuário
    user_agent TEXT, -- User agent do browser
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE system_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT DEFAULT 'general', -- general, security, notifications, etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT NOT NULL -- ID do usuário que atualizou
);

-- Tabela de alertas de medicamentos
CREATE TABLE medication_alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- EXPIRY, LOW_STOCK, INTERACTION
    threshold INTEGER NOT NULL, -- Valor limite para o alerta
    current_value INTEGER, -- Valor atual (estoque, dias para vencimento, etc.)
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE, -- Última vez que o alerta foi disparado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de controle de estoque
CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    category TEXT, -- Categoria farmacêutica
    current_stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    max_stock INTEGER NOT NULL,
    unit TEXT DEFAULT 'un', -- unidade, ml, g, etc.
    expiry_date TIMESTAMP WITH TIME ZONE,
    batch_number TEXT,
    supplier TEXT, -- Fornecedor
    last_restock_date TIMESTAMP WITH TIME ZONE,
    cost_price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de prescrições digitais
CREATE TABLE digital_prescriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_cpf TEXT,
    patient_phone TEXT,
    doctor_name TEXT NOT NULL,
    doctor_crm TEXT NOT NULL,
    doctor_phone TEXT,
    medications JSONB NOT NULL, -- Array de medicamentos prescritos
    instructions TEXT, -- Instruções gerais
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, filled, expired, cancelled
    filled_at TIMESTAMP WITH TIME ZONE,
    filled_by TEXT, -- ID do usuário que atendeu
    observations TEXT, -- Observações do farmacêutico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FOREIGN KEYS / RELACIONAMENTOS
-- =====================================================

-- Relacionamentos da tabela accounts
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela sessions
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela reports
ALTER TABLE reports ADD CONSTRAINT fk_reports_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela report_items
ALTER TABLE report_items ADD CONSTRAINT fk_report_items_report_id 
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

-- Relacionamentos da tabela mappings
ALTER TABLE mappings ADD CONSTRAINT fk_mappings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela daily_observations
ALTER TABLE daily_observations ADD CONSTRAINT fk_daily_observations_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela user_settings
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela production_metrics
ALTER TABLE production_metrics ADD CONSTRAINT fk_production_metrics_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela daily_capacities
ALTER TABLE daily_capacities ADD CONSTRAINT fk_daily_capacities_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela defaulters
ALTER TABLE defaulters ADD CONSTRAINT fk_defaulters_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela audit_logs
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela medication_alerts
ALTER TABLE medication_alerts ADD CONSTRAINT fk_medication_alerts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela inventory_items
ALTER TABLE inventory_items ADD CONSTRAINT fk_inventory_items_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Relacionamentos da tabela digital_prescriptions
ALTER TABLE digital_prescriptions ADD CONSTRAINT fk_digital_prescriptions_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para reports
CREATE INDEX idx_reports_user_id_created_at ON reports(user_id, created_at);
CREATE INDEX idx_reports_status_created_at ON reports(status, created_at);
CREATE INDEX idx_reports_date ON reports(date);
CREATE INDEX idx_reports_user_id_status ON reports(user_id, status);

-- Índices para report_items
CREATE INDEX idx_report_items_report_id ON report_items(report_id);
CREATE INDEX idx_report_items_vendedor ON report_items(vendedor);
CREATE INDEX idx_report_items_categoria ON report_items(categoria);
CREATE INDEX idx_report_items_horario ON report_items(horario);
CREATE INDEX idx_report_items_report_id_vendedor ON report_items(report_id, vendedor);
CREATE INDEX idx_report_items_report_id_categoria ON report_items(report_id, categoria);

-- Índices para defaulters
CREATE INDEX idx_defaulters_user_id_status ON defaulters(user_id, status);
CREATE INDEX idx_defaulters_due_date ON defaulters(due_date);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name_record_id ON audit_logs(table_name, record_id);

-- Índices para system_config
CREATE INDEX idx_system_config_category ON system_config(category);

-- Índices para medication_alerts
CREATE INDEX idx_medication_alerts_user_id_is_active ON medication_alerts(user_id, is_active);
CREATE INDEX idx_medication_alerts_alert_type ON medication_alerts(alert_type);
CREATE INDEX idx_medication_alerts_last_triggered ON medication_alerts(last_triggered);

-- Índices para inventory_items
CREATE INDEX idx_inventory_items_user_id_is_active ON inventory_items(user_id, is_active);
CREATE INDEX idx_inventory_items_medication_name ON inventory_items(medication_name);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_expiry_date ON inventory_items(expiry_date);
CREATE INDEX idx_inventory_items_current_stock ON inventory_items(current_stock);

-- Índices para digital_prescriptions
CREATE INDEX idx_digital_prescriptions_user_id_status ON digital_prescriptions(user_id, status);
CREATE INDEX idx_digital_prescriptions_patient_cpf ON digital_prescriptions(patient_cpf);
CREATE INDEX idx_digital_prescriptions_valid_until ON digital_prescriptions(valid_until);
CREATE INDEX idx_digital_prescriptions_created_at ON digital_prescriptions(created_at);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Ativar RLS em todas as tabelas principais
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE defaulters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_prescriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários (cada usuário vê apenas seus próprios dados)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Políticas para accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para reports
CREATE POLICY "Users can manage own reports" ON reports FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para report_items (através do report)
CREATE POLICY "Users can manage own report items" ON report_items FOR ALL USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_items.report_id AND reports.user_id = auth.uid()::text)
);

-- Políticas para mappings
CREATE POLICY "Users can manage own mappings" ON mappings FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para daily_observations
CREATE POLICY "Users can manage own observations" ON daily_observations FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para user_settings
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para production_metrics
CREATE POLICY "Users can manage own production metrics" ON production_metrics FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para daily_capacities
CREATE POLICY "Users can manage own daily capacities" ON daily_capacities FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para defaulters
CREATE POLICY "Users can manage own defaulters" ON defaulters FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para audit_logs
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid()::text = user_id);

-- Políticas para medication_alerts
CREATE POLICY "Users can manage own medication alerts" ON medication_alerts FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para inventory_items
CREATE POLICY "Users can manage own inventory" ON inventory_items FOR ALL USING (auth.uid()::text = user_id);

-- Políticas para digital_prescriptions
CREATE POLICY "Users can manage own prescriptions" ON digital_prescriptions FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- FUNCTIONS E TRIGGERS ÚTEIS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_items_updated_at BEFORE UPDATE ON report_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mappings_updated_at BEFORE UPDATE ON mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_observations_updated_at BEFORE UPDATE ON daily_observations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_last_processing_updated_at BEFORE UPDATE ON last_processing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_metrics_updated_at BEFORE UPDATE ON production_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_capacities_updated_at BEFORE UPDATE ON daily_capacities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defaulters_updated_at BEFORE UPDATE ON defaulters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_alerts_updated_at BEFORE UPDATE ON medication_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_prescriptions_updated_at BEFORE UPDATE ON digital_prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE reports IS 'Relatórios processados pelo sistema';
COMMENT ON TABLE report_items IS 'Itens individuais dos relatórios processados';
COMMENT ON TABLE mappings IS 'Configurações de mapeamento de dados dos usuários';
COMMENT ON TABLE production_metrics IS 'Métricas de capacidade de produção por horário e categoria';
COMMENT ON TABLE inventory_items IS 'Controle de estoque de medicamentos';
COMMENT ON TABLE digital_prescriptions IS 'Prescrições médicas digitais';
COMMENT ON TABLE medication_alerts IS 'Alertas configuráveis para medicamentos';
COMMENT ON TABLE defaulters IS 'Controle de clientes inadimplentes';
COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as ações do sistema';

-- =====================================================
-- DADOS INICIAIS / SEEDS
-- =====================================================

-- Inserir configurações padrão do sistema
INSERT INTO system_config (key, value, category, updated_by) VALUES 
('app_name', '"FarmaGenius"', 'general', 'system'),
('app_version', '"1.0.0"', 'general', 'system'),
('max_file_size_mb', '10', 'uploads', 'system'),
('allowed_file_types', '["xlsx", "xls", "csv"]', 'uploads', 'system'),
('session_timeout_hours', '24', 'security', 'system'),
('password_min_length', '8', 'security', 'system'),
('enable_audit_logs', 'true', 'security', 'system');

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Garantir que o usuário auth.users (Supabase) tem as permissões necessárias
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Notificação de finalização
SELECT 'Migração para Supabase concluída com sucesso!' as status;