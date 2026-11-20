const express = require("express");
const pool = require("../db");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT v.*, p.nome AS produto_nome, p.unidade
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       ORDER BY v.id`
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao listar vendas:", error);
    return res.status(500).json({ mensagem: "Erro interno ao listar vendas." });
  }
});

router.post("/", async (req, res, next) => {
  const { produto_id, quantidade, valor_total, observacao, vendedor } = req.body;

  if (!produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ mensagem: "Produto e quantidade (maior que zero) são obrigatórios." });
  }
  if (!valor_total || Number(valor_total) <= 0) {
    return res.status(400).json({ mensagem: "Valor total é obrigatório e deve ser maior que zero." });
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
    if (Number(produto.rows[0].quantidade) < Number(quantidade)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        mensagem: `Estoque insuficiente. Disponível: ${Number(produto.rows[0].quantidade)}.`,
      });
    }

    const insertVenda = await client.query(
      `INSERT INTO vendas (produto_id, quantidade, valor_total, observacao, vendedor) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [Number(produto_id), Number(quantidade), Number(valor_total), observacao || null, vendedor || null]
    );

    await client.query(
      "UPDATE produtos SET quantidade = quantidade - $1 WHERE id = $2",
      [Number(quantidade), Number(produto_id)]
    );

    await client.query("COMMIT");
    return res.status(201).json({ mensagem: "Venda registrada com sucesso!", id: insertVenda.rows[0].id });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

router.post("/:id/cancelar", async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      "UPDATE vendas SET cancelado = true WHERE id = $1 AND cancelado = false RETURNING *",
      [id]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Venda não encontrada ou já cancelada." });
    }
    const venda = resultado.rows[0];
    await pool.query(
      "UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2",
      [Number(venda.quantidade), venda.produto_id]
    );
    return res.json({ mensagem: "Venda cancelada e estoque devolvido!" });
  } catch (error) {
    console.error("Erro ao cancelar venda:", error);
    return res.status(500).json({ mensagem: "Erro interno ao cancelar venda." });
  }
});

module.exports = router;