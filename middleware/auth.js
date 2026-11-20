const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token não informado." });
  }

  const token = authorization.slice(7);
  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
}

module.exports = { autenticar };