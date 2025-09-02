
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUser() {
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
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name');
    
    if (error) {
      throw error;
    }
    
    console.log('Usuários no banco:', users);
    
    if (users && users.length > 0) {
      console.log('Exemplo de ID:', users[0].id, 'Tipo:', typeof users[0].id);
    } else {
      console.log('Nenhum usuário encontrado no banco');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkUser();
