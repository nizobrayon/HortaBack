CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(30) DEFAULT 'Administrador'
);

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    unidade VARCHAR(30) DEFAULT 'unidade',
    quantidade INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    preco NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    observacao TEXT,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saidas (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    motivo VARCHAR(100),
    observacao TEXT,
    data_saida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nome, email, senha)
VALUES ('Administrador', 'admin@sdce.com', crypt('admin123', gen_salt('bf')));