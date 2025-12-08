// backend/src/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
 * Corpo esperado:
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

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'nome é obrigatório' });
    }

    const cpfDigits = cpf ? String(cpf).replace(/\D/g, '') : null;
    const cnpjDigits = cnpj ? String(cnpj).replace(/\D/g, '') : null;

    if (!cpfDigits && !cnpjDigits) {
      return res.status(400).json({ error: 'cpf ou cnpj é obrigatório' });
    }

    if (cpfDigits && cpfDigits.length !== 11) {
      return res.status(400).json({ error: 'cpf inválido: deve conter 11 dígitos' });
    }
    if (cnpjDigits && cnpjDigits.length !== 14) {
      return res.status(400).json({ error: 'cnpj inválido: deve conter 14 dígitos' });
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

    const [result] = await db.execute(
      `INSERT INTO Usuario (nome, cpf, cnpj, email, data_nascimento)
       VALUES (?, ?, ?, ?, ?)`,
      [nome.trim(), cpfDigits || null, cnpjDigits || null, email || null, dataNascSql]
    );

    return res.status(201).json({
      idUsuario: result.insertId,
      message: 'Usuário salvo com sucesso'
    });
  } catch (err) {
    console.error('Erro em /api/user-data:', err);
    return res.status(500).json({
      error: 'Erro ao salvar usuário',
      details: err.message
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
  const connection = await db.getConnection();
  try {
    const { idUsuario, tema, descricao, documentos } = req.body;

    if (!idUsuario) {
      connection.release();
      return res.status(400).json({ error: 'idUsuario é obrigatório' });
    }

    if (!descricao || !descricao.trim()) {
      connection.release();
      return res.status(400).json({ error: 'descricao é obrigatória' });
    }

    await connection.beginTransaction();

    const protocolo = gerarProtocolo();

    const [ocResult] = await connection.execute(
      `INSERT INTO Ocorrencia (id_usuario, protocolo, tema, descricao, data_criacao)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [idUsuario, protocolo, tema || null, descricao.trim()]
    );

    const idOcorrencia = ocResult.insertId;

    if (Array.isArray(documentos) && documentos.length > 0) {
      for (const doc of documentos) {
        await connection.execute(
          `INSERT INTO Documento (id_ocorrencia, nome_arquivo, tipo_documento, data_upload)
           VALUES (?, ?, ?, CURDATE())`,
          [idOcorrencia, doc.nomeArquivo || '', doc.tipoDocumento || null]
        );
      }
    }

    await connection.commit();
    connection.release();

    return res.status(201).json({
      idOcorrencia,
      protocolo,
      message: 'Ocorrência salva com sucesso'
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Erro em /api/forms-data:', err);
    return res.status(500).json({
      error: 'Erro ao salvar ocorrência',
      details: err.message
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
 *
 * Se pago === true -> grava em Pagamento.
 * Se pago === false -> não grava, só retorna paid: false.
 */
app.post('/api/payment', async (req, res) => {
  try {
    const { idOcorrencia, valor, formaPagamento, pago } = req.body;

    if (!idOcorrencia) {
      return res.status(400).json({ error: 'idOcorrencia é obrigatório' });
    }
    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'valor inválido' });
    }
    if (!formaPagamento) {
      return res.status(400).json({ error: 'formaPagamento é obrigatória' });
    }

    if (!pago) {
      return res.status(200).json({
        paymentSaved: false,
        paid: false,
        message: 'Pagamento ainda não confirmado'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO Pagamento (id_ocorrencia, valor, forma_pagamento)
       VALUES (?, ?, ?)`,
      [idOcorrencia, valor, formaPagamento]
    );

    return res.status(201).json({
      idPagamento: result.insertId,
      paymentSaved: true,
      paid: true,
      message: 'Pagamento registrado com sucesso'
    });
  } catch (err) {
    console.error('Erro em /api/payment:', err);
    return res.status(500).json({
      error: 'Erro ao registrar pagamento',
      details: err.message
    });
  }
});

/**
 * GET simples só pra testar se o backend está no ar
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Ancora backend rodando na porta ${PORT}`);
});
