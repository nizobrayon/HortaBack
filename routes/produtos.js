const express = require("express");
const pool = require("../db");
const { autenticar } = require("../middleware/auth");

const router = express.Router();

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM produtos ORDER BY id");
    return res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ mensagem: "Erro interno ao listar produtos." });
  }
});

router.post("/", async (req, res) => {
  const { nome, categoria, unidade, quantidade, estoque_minimo, preco } = req.body;

  if (!nome || !categoria) {
    return res.status(400).json({ mensagem: "Nome e categoria são obrigatórios." });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO produtos (nome, categoria, unidade, quantidade, estoque_minimo, preco)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        nome,
        categoria,
        unidade || "unidade",
        quantidade ?? 0,
        estoque_minimo ?? 5,
        preco ?? 0,
      ]
    );
    return res.status(201).json({
      mensagem: "Produto cadastrado com sucesso!",
      produto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({ mensagem: "Erro interno ao criar produto." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, unidade, quantidade, estoque_minimo, preco } = req.body;

  if (!nome || !categoria) {
    return res.status(400).json({ mensagem: "Nome e categoria são obrigatórios." });
  }

  try {
    const resultado = await pool.query(
      `UPDATE produtos
       SET nome = $1, categoria = $2, unidade = $3, quantidade = $4,
           estoque_minimo = $5, preco = $6
       WHERE id = $7 RETURNING *`,
      [
        nome,
        categoria,
        unidade || "unidade",
        quantidade ?? 0,
        estoque_minimo ?? 5,
        preco ?? 0,
        id,
      ]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }
    return res.json({
      mensagem: "Produto atualizado com sucesso!",
      produto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ mensagem: "Erro interno ao atualizar produto." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query("DELETE FROM produtos WHERE id = $1 RETURNING id", [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }
    return res.json({ mensagem: "Produto removido com sucesso!" });
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    return res.status(500).json({ mensagem: "Erro interno ao remover produto." });
  }
});

module.exports = router;