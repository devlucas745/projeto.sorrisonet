// js/auth.js
async function requireLogin(){
  try {
    // tenta pegar dados do usuário atual
    const me = await apiGet('/api/me', true); // true = envia token
    // se existir um <span id="nome-usuario"> na página, preenche
    const span = document.getElementById('nome-usuario');
    if (span) {
      span.textContent = me.nome || me.email;
    }
    return me;
  } catch (err) {
    alert('Faça login para continuar.');
    // limpa token só por segurança
    clearToken();
    // manda pra tela de login
    location.href = 'login.html';
    throw err;
  }
}

function logout(){
  clearToken();
  location.href = 'login.html';
}

// js/auth.js

// essa função checa o usuário atual (se existir token)
// e atualiza automaticamente o topo (ASSINE JÁ e Login/Sair)
async function atualizaHeader() {
  // pega os elementos do header se eles existirem nessa página
  const btnAssine = document.getElementById('btnAssineJa'); // botão "ASSINE JÁ"
  const linkLoginLogout = document.getElementById('btnLoginLogout'); // link "Login" / "Sair"

  // pega token guardado
  const token = localStorage.getItem('token');

  // se não tem token, então usuário não está logado
  if (!token) {
    // mostra ASSINE JÁ (porque não sabemos se é premium)
    if (btnAssine) {
      btnAssine.style.display = 'inline-block';
      btnAssine.onclick = () => {
        // leva pra planos pra ele escolher
        window.location.href = 'planos.html';
      };
    }

    // configura botão Login
    if (linkLoginLogout) {
      linkLoginLogout.textContent = 'Login';
      linkLoginLogout.href = 'login.html';
      linkLoginLogout.onclick = null;
    }

    return; // acabou
  }

  // se tem token, tentamos descobrir se ele é premium
  try {
    const resp = await fetch('http://localhost:3000/api/me', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    if (!resp.ok) {
      // token inválido -> tratar como deslogado
      if (btnAssine) {
        btnAssine.style.display = 'inline-block';
        btnAssine.onclick = () => {
          window.location.href = 'planos.html';
        };
      }

      if (linkLoginLogout) {
        linkLoginLogout.textContent = 'Login';
        linkLoginLogout.href = 'login.html';
        linkLoginLogout.onclick = null;
      }

      return;
    }

    const me = await resp.json(); // { nome, premium, ... }

    // 1. tratar o botão ASSINE JÁ
    if (btnAssine) {
      if (me.premium === true) {
        // já é premium -> esconde o botão ASSINE JÁ
        btnAssine.style.display = 'none';
      } else {
        // não é premium ainda -> mostra o botão
        btnAssine.style.display = 'inline-block';
        btnAssine.onclick = () => {
          window.location.href = 'planos.html';
        };
      }
    }

    // 2. tratar Login/Sair
    if (linkLoginLogout) {
      linkLoginLogout.textContent = 'Sair';
      linkLoginLogout.href = '#';
      linkLoginLogout.onclick = (ev) => {
        ev.preventDefault();
        logout(); // já temos essa função no auth.js
      };
    }

  } catch (err) {
    console.error('Erro ao atualizar header:', err);

    // fallback de segurança: considera deslogado
    if (btnAssine) {
      btnAssine.style.display = 'inline-block';
      btnAssine.onclick = () => {
        window.location.href = 'planos.html';
      };
    }

    if (linkLoginLogout) {
      linkLoginLogout.textContent = 'Login';
      linkLoginLogout.href = 'login.html';
      linkLoginLogout.onclick = null;
    }
  }
}
