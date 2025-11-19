// api/auth-service/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// "banco" local (compartilhado entre serviços)
// DICA: isso aqui poderia ser um banco de verdade, mas usamos um arquivo pra simplificar
const DB_PATH = path.join(__dirname, '..', 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      users: [],
      agendamentos: [],
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

// middleware para validar token JWT
function auth(req, res, next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if(!token) return res.status(401).json({ erro:'Sem token' });

  try{
    const payload = jwt.verify(token, JWT_SECRET); // { id, email }
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ erro:'Token inválido' });
  }
}





// health check (só pra ver se está vivo)
app.get('/health', (req,res)=>{
  res.json({ok:true, service:'auth-service'});
});

// CADASTRO
app.post('/register', (req,res)=>{
  const { nome, email, senha, cpf, telefone, endereco } = req.body;

  if(!nome || !email || !senha){
    return res.status(400).json({erro:'Nome, email e senha são obrigatórios'});
  }

  const db = loadDB();

  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({erro:'E-mail já cadastrado'});
  }

 const novo = {
  id: uuid(),
  nome,
  email,
  senha,
  cpf: cpf || '',
  telefone: telefone || '',
  endereco: endereco || '',
  premium: false // começa como não premium
};


  db.users.push(novo);
  saveDB(db);

  return res.json({ok:true, msg:'Usuário criado com sucesso'});
});

// LOGIN
app.post('/login', (req,res)=>{
  const { email, senha } = req.body;
  if(!email || !senha){
    return res.status(400).json({erro:'Email e senha obrigatórios'});
  }

  const db = loadDB();
  const u = db.users.find(user => user.email === email && user.senha === senha);

  if(!u){
    return res.status(401).json({erro:'Credenciais inválidas'});
  }

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

// /me → retorna dados do usuário logado
app.get('/me', auth, (req,res)=>{
  const db = loadDB();
  const u = db.users.find(x => x.id === req.user.id);
  if(!u) {
    return res.status(404).json({erro:'Usuário não encontrado'});
  }

  res.json({
    id: u.id,
    nome: u.nome,
    email: u.email,
    cpf: u.cpf,
    telefone: u.telefone,
    endereco: u.endereco,
    premium: u.premium === true
  });
});

// Torna o usuário atual premium
app.post('/make-premium', auth, (req, res) => {
  const db = loadDB();

  // encontra o usuário logado
  const uIndex = db.users.findIndex(x => x.id === req.user.id);

  if (uIndex === -1) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  // marca como premium
  db.users[uIndex].premium = true;

  // salva no arquivo db.json
  saveDB(db);

  res.json({
    ok: true,
    msg: 'Agora você é premium!',
    premium: true
  });
});


const PORT = 3001;
app.listen(PORT, ()=>{
  console.log('🔐 auth-service rodando em http://localhost:'+PORT);
});
