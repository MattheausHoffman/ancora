CREATE DATABASE IF NOT EXISTS ancora;
USE ancora;

CREATE TABLE Usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  data_nascimento DATE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Ocorrencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  protocolo BIGINT UNIQUE NOT NULL,
  tema VARCHAR(255),
  descricao LONGTEXT,
  data_criacao DATE,
  FOREIGN KEY (id_usuario) REFERENCES Usuario(id) ON DELETE CASCADE
);

CREATE TABLE Documento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_ocorrencia INT NOT NULL,
  nome_arquivo VARCHAR(255),
  tipo_documento VARCHAR(100),
  data_upload DATE,
  FOREIGN KEY (id_ocorrencia) REFERENCES Ocorrencia(id) ON DELETE CASCADE
);

CREATE TABLE Pagamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_ocorrencia INT NOT NULL UNIQUE,
  valor DECIMAL(10, 2),
  forma_pagamento VARCHAR(50),
  data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ocorrencia) REFERENCES Ocorrencia(id) ON DELETE CASCADE
);
