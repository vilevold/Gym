const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = './.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANNON;

const supabase = createClient(url, key);

async function run() {
  const users = [
    { codigo: 'GYM-123', nombre: 'Juan Pérez' },
    { codigo: 'GYM-123', nombre: 'María Pérez' },
    { codigo: 'GYM-456', nombre: 'Carlos Gómez' }
  ];

  const { data, error } = await supabase.from('usuarios').insert(users).select();
  if (error) {
    console.error("Insert Error:", error.message);
    console.log("Retrying with unique codes...");
    const uniqueUsers = [
      { codigo: 'GYM-111', nombre: 'Juan Pérez' },
      { codigo: 'GYM-222', nombre: 'María Pérez' }
    ];
    const { data: d2, error: e2 } = await supabase.from('usuarios').insert(uniqueUsers).select();
    if (e2) {
      console.error("Retry Error:", e2.message);
    } else {
      console.log("Success with unique codes:", d2);
    }
  } else {
    console.log("Success:", data);
  }
}

run();
