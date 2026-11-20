const express = require("express");
const pool = require("../db");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT s.*, p.nome AS produto_nome, p.unidade
       FROM saidas s
       JOIN produtos p ON p.id = s.produto_id
       ORDER BY s.id`
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao listar saidas:", error);
    return res.status(500).json({ mensagem: "Erro interno ao listar saidas." });
  }
});

router.post("/", async (req, res, next) => {
  const { produto_id, quantidade, motivo, observacao } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ mensagem: "Produto e quantidade (maior que zero) são obrigatórios." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const produto = await client.query(
      "SELECT id, quantidade FROM produtos WHERE id = $1",
      [produto_id]
    );
    if (produto.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }
    if (produto.rows[0].quantidade < Number(quantidade)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        mensagem: `Estoque insuficiente. Disponível: ${produto.rows[0].quantidade}.`,
      });
    }

    await client.query(
      "INSERT INTO saidas (produto_id, quantidade, motivo, observacao) VALUES ($1, $2, $3, $4)",
      [produto_id, quantidade, motivo || null, observacao || null]
    );
    await client.query(
      "UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2",
      [quantidade, produto_id]
    );

    await client.query("COMMIT");
    return res.status(201).json({ mensagem: "Saída registrada com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

module.exports = router;