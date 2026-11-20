const express = require("express");
const pool = require("../db");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT e.*, p.nome AS produto_nome, p.unidade
       FROM entradas e
       JOIN produtos p ON p.id = e.produto_id
       ORDER BY e.id`
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao listar entradas:", error);
    return res.status(500).json({ mensagem: "Erro interno ao listar entradas." });
  }
});

router.post("/", async (req, res, next) => {
  const { produto_id, quantidade, observacao } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ mensagem: "Produto e quantidade (maior que zero) são obrigatórios." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const produto = await client.query("SELECT id FROM produtos WHERE id = $1", [produto_id]);
    if (produto.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }

    await client.query(
      "INSERT INTO entradas (produto_id, quantidade, observacao) VALUES ($1, $2, $3)",
      [produto_id, quantidade, observacao || null]
    );
    await client.query(
      "UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2",
      [quantidade, produto_id]
    );

    await client.query("COMMIT");
    return res.status(201).json({ mensagem: "Entrada registrada com sucesso!" });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

module.exports = router;