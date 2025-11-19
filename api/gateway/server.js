// api/gateway/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Endereços dos serviços
const AUTH_URL   = 'http://localhost:3001';
const AGENDA_URL = 'http://localhost:3002';

// health da gateway
app.get('/api/health', (req,res)=>{
  res.json({ok:true, service:'gateway'});
});

// --------- AUTH ROTAS ---------
app.post('/api/register', async (req,res)=>{
  try {
    const r = await axios.post(`${AUTH_URL}/register`, req.body);
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway /register'});
  }
});

app.post('/api/login', async (req,res)=>{
  try {
    const r = await axios.post(`${AUTH_URL}/login`, req.body);
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway /login'});
  }
});

app.get('/api/me', async (req,res)=>{
  try {
    const r = await axios.get(`${AUTH_URL}/me`, {
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway /me'});
  }
});

// --------- AGENDA ROTAS ---------
app.get('/api/agendamentos', async (req,res)=>{
  try {
    const r = await axios.get(`${AGENDA_URL}/agendamentos`, {
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway GET /agendamentos'});
  }
});

app.post('/api/agendamentos', async (req,res)=>{
  try {
    const r = await axios.post(`${AGENDA_URL}/agendamentos`, req.body, {
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway POST /agendamentos'});
  }
});

app.patch('/api/agendamentos/:id', async (req,res)=>{
  try {
    const r = await axios.patch(`${AGENDA_URL}/agendamentos/${req.params.id}`, req.body, {
      headers: {
        Authorization: req.headers.authorization || ''
      }
    });
    res.status(r.status).json(r.data);
  } catch(err){
    if (err.response) return res.status(err.response.status).json(err.response.data);
    res.status(500).json({erro:'Erro no gateway PATCH /agendamentos/:id'});
  }
});

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

const PORT = 3000;
app.listen(PORT, ()=>{
  console.log('🌐 gateway rodando em http://localhost:'+PORT);
});
