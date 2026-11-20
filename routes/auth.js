const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

router.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }
  if (senha.length < 6) {
    return res.status(400).json({ mensagem: "A senha deve ter pelo menos 6 caracteres." });
  }

  try {
    const existente = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existente.rowCount > 0) {
      return res.status(409).json({ mensagem: "E-mail já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const resultado = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, tipo",
      [nome, email, senhaHash]
    );

    const usuario = resultado.rows[0];
    return res.status(201).json({
      mensagem: "Conta criada com sucesso!",
      usuario,
      token: gerarToken(usuario),
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return res.status(500).json({ mensagem: "Erro interno ao criar a conta." });
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }

  try {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (resultado.rowCount === 0) {
      return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
    }

    const usuario = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
    }

    const { senha: _senha, ...usuarioSemSenha } = usuario;
    return res.json({
      mensagem: `Bem-vindo, ${usuario.nome}!`,
      usuario: usuarioSemSenha,
      token: gerarToken(usuario),
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ mensagem: "Erro interno ao entrar." });
  }
});

module.exports = router;