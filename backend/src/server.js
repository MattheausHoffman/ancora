// backend/src/server.js
const express = require('express');
const cors = require('cors');
const { run, get, all, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Inicializa o banco (cria tabelas se necessário)
 */
initDb()
  .then(() => {
    console.log('Banco SQLite inicializado (ancora.db)');
  })
  .catch((err) => {
    console.error('Erro ao inicializar o banco SQLite:', err);
    process.exit(1);
  });

/**
 * Gera um número de protocolo simples (12 dígitos).
 */
function gerarProtocolo() {
  const agora = Date.now().toString();
  const sufixo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return Number(agora.slice(-9) + sufixo);
}

/**
 * POST /api/user-data
 * Corpo:
 * {
 *   nome,
 *   cpf,
 *   cnpj,
 *   email,
 *   dataNascimento (dd/mm/aaaa ou yyyy-mm-dd)
 * }
 */
app.post('/api/user-data', async (req, res) => {
  try {
    const { nome, cpf, cnpj, email, dataNascimento } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'nome é obrigatório' });
    }

    let dataNascSql = null;
    if (dataNascimento) {
      if (dataNascimento.includes('/')) {
        const [dia, mes, ano] = dataNascimento.split('/');
        dataNascSql = `${ano}-${mes}-${dia}`;
      } else {
        dataNascSql = dataNascimento;
      }
    }

    const result = await run(
      `INSERT INTO Usuario (nome, cpf, cnpj, email, data_nascimento)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, cpf || null, cnpj || null, email || null, dataNascSql]
    );

    return res.status(201).json({
      idUsuario: result.id
    });
  } catch (err) {
    console.error('Erro em /api/user-data:', err);
    return res.status(500).json({
      error: 'Erro ao salvar usuário',
      details: err && err.message ? err.message : String(err)
    });
  }
});

/**
 * POST /api/forms-data
 * Corpo:
 * {
 *   idUsuario,
 *   tema,
 *   descricao,
 *   documentos: [
 *     { nomeArquivo, tipoDocumento }
 *   ]
 * }
 */
app.post('/api/forms-data', async (req, res) => {
  try {
    const { idUsuario, tema, descricao, documentos } = req.body;

    if (!idUsuario) {
      return res.status(400).json({ error: 'idUsuario é obrigatório' });
    }

    // Início da transação manual em SQLite
    await run('BEGIN TRANSACTION');

    const protocolo = gerarProtocolo();

    const ocResult = await run(
      `INSERT INTO Ocorrencia (id_usuario, protocolo, tema, descricao, data_criacao)
       VALUES (?, ?, ?, ?, DATE('now'))`,
      [idUsuario, protocolo, tema || null, descricao || null]
    );

    const idOcorrencia = ocResult.id;

    if (Array.isArray(documentos) && documentos.length > 0) {
      for (const doc of documentos) {
        await run(
          `INSERT INTO Documento (id_ocorrencia, nome_arquivo, tipo_documento, data_upload)
           VALUES (?, ?, ?, DATE('now'))`,
          [idOcorrencia, doc.nomeArquivo || '', doc.tipoDocumento || null]
        );
      }
    }

    await run('COMMIT');

    return res.status(201).json({
      idOcorrencia,
      protocolo
    });
  } catch (err) {
    // Em caso de erro, tenta fazer rollback
    try {
      await run('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Erro ao fazer ROLLBACK:', rollbackErr);
    }
    console.error('Erro em /api/forms-data:', err);
    return res.status(500).json({
      error: 'Erro ao salvar ocorrência',
      details: err && err.message ? err.message : String(err)
    });
  }
});

/**
 * POST /api/payment
 * Corpo:
 * {
 *   idOcorrencia,
 *   valor,
 *   formaPagamento: 'PIX' | 'CARTAO' | 'BOLETO',
 *   pago: boolean
 * }
 */
app.post('/api/payment', async (req, res) => {
  try {
    const { idOcorrencia, valor, formaPagamento, pago } = req.body;

    if (!idOcorrencia) {
      return res.status(400).json({ error: 'idOcorrencia é obrigatório' });
    }
    if (!valor) {
      return res.status(400).json({ error: 'valor é obrigatório' });
    }
    if (!formaPagamento) {
      return res.status(400).json({ error: 'formaPagamento é obrigatória' });
    }

    // Se pagamento ainda não foi confirmado, não grava nada
    if (!pago) {
      return res.status(200).json({
        paymentSaved: false,
        paid: false,
        message: 'Pagamento ainda não confirmado'
      });
    }

    const result = await run(
      `INSERT INTO Pagamento (id_ocorrencia, valor, data_pagamento, forma_pagamento)
       VALUES (?, ?, DATETIME('now'), ?)`,
      [idOcorrencia, valor, formaPagamento]
    );

    return res.status(201).json({
      idPagamento: result.id,
      paymentSaved: true,
      paid: true
    });
  } catch (err) {
    console.error('Erro em /api/payment:', err);
    return res.status(500).json({
      error: 'Erro ao registrar pagamento',
      details: err && err.message ? err.message : String(err)
    });
  }
});

/**
 * GET /api/health – só para testar se o backend está no ar
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Ancora backend (SQLite) rodando na porta ${PORT}`);
});
