require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const produtosRoutes = require("./routes/produtos");
const entradasRoutes = require("./routes/entradas");
const saidasRoutes = require("./routes/saidas");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/produtos", produtosRoutes);
app.use("/api/entradas", entradasRoutes);
app.use("/api/saidas", saidasRoutes);

const frontendPath = process.env.FRONTEND_PATH || path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ mensagem: "Erro interno no servidor." });
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, () => {
  console.log(`Servidor SDCE rodando em http://localhost:${porta}`);
});