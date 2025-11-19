// api/agenda-service/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

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

// mesmo middleware auth (copiado)
function auth(req, res, next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if(!token) return res.status(401).json({ erro:'Sem token' });

  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ erro:'Token inválido' });
  }
}

// health check
app.get('/health', (req,res)=>{
  res.json({ok:true, service:'agenda-service'});
});

// LISTAR agendamentos do usuário logado
app.get('/agendamentos', auth, (req,res)=>{
  const db = loadDB();
  const meus = db.agendamentos.filter(a => a.userId === req.user.id);
  res.json(meus);
});

// CRIAR agendamento pro usuário logado
app.post('/agendamentos', auth, (req,res)=>{
  const { data, hora, profissional, procedimento, observacoes } = req.body;

  if(!data || !hora || !profissional || !procedimento) {
    return res.status(400).json({erro:'Campos obrigatórios faltando'});
  }

  const db = loadDB();
  const novo = {
    id: uuid(),
    data,
    hora,
    profissional,
    procedimento,
    status:'Agendado',
    observacoes: observacoes || '',
    userId: req.user.id
  };

  db.agendamentos.push(novo);
  saveDB(db);

  res.json(novo);
});

// ATUALIZAR status (Concluído / Cancelado)
app.patch('/agendamentos/:id', auth, (req,res)=>{
  const { id } = req.params;
  const { status } = req.body;

  const db = loadDB();
  const ag = db.agendamentos.find(a => a.id === id && a.userId === req.user.id);
  if(!ag) return res.status(404).json({erro:'Agendamento não encontrado'});

  if(status) {
    ag.status = status;
  }

  saveDB(db);
  res.json(ag);
});

const PORT = 3002;
app.listen(PORT, ()=>{
  console.log('📅 agenda-service rodando em http://localhost:'+PORT);
});
