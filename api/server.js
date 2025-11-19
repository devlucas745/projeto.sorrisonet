// api/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      users: [
        { id:'u1', nome:'Teste', email:'teste@ex.com', senha:'123', cpf:'000.000.000-00', telefone:'', endereco:'' }
      ],
      agendamentos: [
        { id:'a1', data:'2025-10-25', hora:'09:00', profissional:'Dra. Ana Silva', procedimento:'Consulta', status:'Agendado', userId:'u1' }
      ],
      contatos: [],
      assinaturas: [],
      resetTokens: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const JWT_SECRET = 'devsecret';

function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Sem token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

// Ping
app.get('/api/health', (req,res)=> res.json({ok:true,msg:'API OK'}));

// Auth
app.post('/api/register', (req,res)=>{
  const { nome, email, senha, cpf, telefone, endereco } = req.body;

  // validações básicas
  if(!nome || !email || !senha){
    return res.status(400).json({erro:'Nome, email e senha são obrigatórios'});
  }

  const db = loadDB();

  // vê se já existe gente com esse email
  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({erro:'E-mail já cadastrado'});
  }

  // cria novo usuário
  const novo = {
    id: uuid(),
    nome,
    email,
    senha, // (por enquanto texto puro. Depois podemos fazer "hash" pra ficar seguro)
    cpf: cpf || '',
    telefone: telefone || '',
    endereco: endereco || ''
  };

  db.users.push(novo);
  saveDB(db);

  return res.json({ok:true, msg:'Usuário criado com sucesso'});
});


app.post('/api/login', (req,res)=>{
  const { email, senha } = req.body;

  if(!email || !senha){
    return res.status(400).json({erro:'Email e senha obrigatórios'});
  }

  const db = loadDB();

  // tenta achar um usuário igual ao digitado
  const u = db.users.find(user => user.email === email && user.senha === senha);

  if(!u){
    return res.status(401).json({erro:'Credenciais inválidas'});
  }

  // gera token pra esse usuário
  const token = jwt.sign(
    { id:u.id, email:u.email },
    JWT_SECRET,
    { expiresIn:'2h' }
  );

  return res.json({
    ok:true,
    token,
    nome: u.nome
  });
});


app.get('/api/me', auth, (req,res)=>{
  const db = loadDB();
  const u = db.users.find(x=>x.id===req.user.id);
  if(!u) return res.status(404).json({erro:'Usuário não encontrado'});
  res.json(u);
});

// Agendamentos
app.get('/api/agendamentos', auth, (req,res)=>{
  const db = loadDB();
  res.json(db.agendamentos.filter(a=>a.userId===req.user.id));
});

app.post('/api/agendamentos', auth, (req,res)=>{
  const { data, hora, profissional, procedimento } = req.body;
  if(!data || !hora || !profissional || !procedimento) return res.status(400).json({erro:'Campos obrigatórios faltando'});
  const db = loadDB();
  const novo = { id: uuid(), data, hora, profissional, procedimento, status:'Agendado', userId:req.user.id };
  db.agendamentos.push(novo);
  saveDB(db);
  res.json(novo);
});

app.patch('/api/agendamentos/:id', auth, (req,res)=>{
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDB();
  const ag = db.agendamentos.find(a=>a.id===id && a.userId===req.user.id);
  if(!ag) return res.status(404).json({erro:'Agendamento não encontrado'});
  ag.status = status;
  saveDB(db);
  res.json(ag);
});

// Contato
app.post('/api/contato', (req,res)=>{
  const { nome, email, assunto, tipo, telefone, mensagem } = req.body;
  if(!nome || !email || !assunto || !tipo || !mensagem) return res.status(400).json({erro:'Campos obrigatórios'});
  const db = loadDB();
  const item = { id: uuid(), nome, email, assunto, tipo, telefone:telefone||'', mensagem, criadoEm:new Date().toISOString() };
  db.contatos.push(item);
  saveDB(db);
  const protocolo = 'SN-' + String(Date.now()).slice(-8);
  res.json({ ok:true, protocolo });
});

// Assinaturas
app.post('/api/assinaturas', auth, (req,res)=>{
  const { plano, valor, pagamento, dados } = req.body;
  const db = loadDB();
  const item = { id: uuid(), userId:req.user.id, plano, valor, pagamento, dados, criadoEm:new Date().toISOString(), status:'aprovado' };
  db.assinaturas.push(item);
  saveDB(db);
  res.json({ ok:true, assinaturaId:item.id, status:item.status });
});

// Redefinição de senha
app.post('/api/auth/forgot', (req,res)=>{
  const { email } = req.body;
  if(!email) return res.status(400).json({erro:'Informe o e-mail'});
  const db = loadDB();
  const user = db.users.find(u=>u.email===email);
  if(!user) return res.json({ ok:true });
  const codigo = Math.random().toString(36).slice(-6).toUpperCase();
  const expiraEm = Date.now() + (10*60*1000);
  db.resetTokens = db.resetTokens.filter(t=>t.email!==email);
  db.resetTokens.push({ email, codigo, expiraEm });
  saveDB(db);
  console.log('[SIMULAÇÃO] Código para', email, '=>', codigo);
  res.json({ ok:true });
});

app.post('/api/auth/reset', (req,res)=>{
  const { email, codigo, novaSenha } = req.body;
  const db = loadDB();
  const token = db.resetTokens.find(t=>t.email===email && t.codigo===codigo);
  if(!token) return res.status(400).json({erro:'Código inválido'});
  if(Date.now() > token.expiraEm) return res.status(400).json({erro:'Código expirado'});
  const user = db.users.find(u=>u.email===email);
  if(!user) return res.status(404).json({erro:'Usuário não encontrado'});
  user.senha = novaSenha;
  db.resetTokens = db.resetTokens.filter(t=>!(t.email===email && t.codigo===codigo));
  saveDB(db);
  res.json({ ok:true });
});


// tornar usuário premium (chama o auth-service)
// --------- PREMIUM ROTAS ---------
app.post('/api/make-premium', async (req, res) => {
  try {
    const r = await axios.post(`${AUTH_URL}/make-premium`, req.body, {
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });
    res.status(r.status).json(r.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ erro: 'Erro no gateway /make-premium' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🌐 gateway rodando em http://localhost:' + PORT);
});
