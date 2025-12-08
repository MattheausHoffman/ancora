const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function gerarProtocolo() {
  const agora = Date.now().toString();
  const sufixo = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return Number(agora.slice(-9) + sufixo);
}

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

    const [result] = await db.execute(
      `INSERT INTO Usuario (nome, cpf, cnpj, email, data_nascimento)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, cpf || null, cnpj || null, email || null, dataNascSql]
    );

    return res.status(201).json({
      idUsuario: result.insertId
    });
  } catch (err) {
    console.error('Erro em /api/user-data', err);
    return res.status(500).json({ error: 'Erro ao salvar usuário' });
  }
});

app.post('/api/forms-data', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { idUsuario, tema, descricao, documentos } = req.body;

    if (!idUsuario) {
      connection.release();
      return res.status(400).json({ error: 'idUsuario é obrigatório' });
    }

    await connection.beginTransaction();

    const protocolo = gerarProtocolo();

    const [ocorrenciaResult] = await connection.execute(
      `INSERT INTO Ocorrencia (id_usuario, protocolo, tema, descricao, data_criacao)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [idUsuario, protocolo, tema || null, descricao || null]
    );

    const idOcorrencia = ocorrenciaResult.insertId;

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
      protocolo
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Erro em /api/forms-data', err);
    return res.status(500).json({ error: 'Erro ao salvar ocorrência' });
  }
});

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

    if (!pago) {
      return res.status(200).json({
        paymentSaved: false,
        paid: false,
        message: 'Pagamento ainda não confirmado'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO Pagamento (id_ocorrencia, valor, data_pagamento, forma_pagamento)
       VALUES (?, ?, NOW(), ?)`,
      [idOcorrencia, valor, formaPagamento]
    );

    return res.status(201).json({
      idPagamento: result.insertId,
      paymentSaved: true,
      paid: true
    });
  } catch (err) {
    console.error('Erro em /api/payment', err);
    return res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

app.get('/api/ocorrencias/:id/resumo', async (req, res) => {
  try {
    const idOcorrencia = req.params.id;

    const [rows] = await db.execute(
      `
      SELECT
        u.id_usuario,
        u.nome,
        u.cpf,
        u.cnpj,
        u.email,
        u.data_nascimento,
        o.id_ocorrencia,
        o.protocolo,
        o.tema,
        o.descricao,
        o.data_criacao,
        p.id_pagamento,
        p.valor AS pagamento_valor,
        p.data_pagamento,
        p.forma_pagamento,
        c.id_certidao,
        c.status AS certidao_status
      FROM Ocorrencia o
      JOIN Usuario u
        ON u.id_usuario = o.id_usuario
      LEFT JOIN Pagamento p
        ON p.id_ocorrencia = o.id_ocorrencia
      LEFT JOIN Certidao c
        ON c.id_ocorrencia = o.id_ocorrencia
      WHERE o.id_ocorrencia = ?
      `,
      [idOcorrencia]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }

    const row = rows[0];

    const response = {
      usuario: {
        idUsuario: row.id_usuario,
        nome: row.nome,
        cpf: row.cpf,
        cnpj: row.cnpj,
        email: row.email,
        dataNascimento: row.data_nascimento
      },
      ocorrencia: {
        idOcorrencia: row.id_ocorrencia,
        protocolo: row.protocolo,
        tema: row.tema,
        descricao: row.descricao,
        dataCriacao: row.data_criacao
      },
      pagamento: row.id_pagamento
        ? {
            idPagamento: row.id_pagamento,
            valor: row.pagamento_valor,
            dataPagamento: row.data_pagamento,
            formaPagamento: row.forma_pagamento,
            paid: true
          }
        : {
            paid: false
          },
      certidao: row.id_certidao
        ? {
            idCertidao: row.id_certidao,
            status: row.certidao_status
          }
        : null
    };

    return res.json(response);
  } catch (err) {
    console.error('Erro em GET /api/ocorrencias/:id/resumo', err);
    return res.status(500).json({ error: 'Erro ao buscar resumo da ocorrência' });
  }
});

app.listen(PORT, () => {
  console.log(`Ancora backend rodando na porta ${PORT}`);
});
