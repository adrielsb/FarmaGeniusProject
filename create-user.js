
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRole) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Verificar se já existe um usuário admin
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@farma.com')
      .single();
    
    if (existingUser && !checkError) {
      console.log('Usuário admin já existe!');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        name: 'Admin FarmaGenius',
        email: 'admin@farma.com',
        password: hashedPassword
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    console.log('Usuário criado com sucesso:', user.email);
    console.log('Login: admin@farma.com');
    console.log('Senha: 123456');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  }
}

createTestUser();
