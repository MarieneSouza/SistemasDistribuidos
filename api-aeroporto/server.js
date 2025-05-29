const express = require('express');
const connectDB = require('./config/db'); // Importa a fun��o de conex�o com o DB
const cors = require('cors'); // Importa o middleware CORS
require('dotenv').config(); // Carrega as vari�veis de ambiente no in�cio do app

const app = express();

// Conectar ao Banco de Dados
connectDB();

// Middleware para permitir requisi��es JSON no corpo da requisi��o
app.use(express.json({ extended: false }));

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
// Essencial se sua API for ser consumida por um frontend em um dom�nio diferente
app.use(cors());

// Rota de teste inicial
app.get('/', (req, res) => res.send('API de Aeroporto Rodando!'));

// Rotas Criadas
app.use('/api/passageiros', require('./routes/passageiros')); // rota para passageiros
app.use('/api/relatorio', require('./routes/relatorio')); // 
app.use('/api/portoes', require('./routes/portoes'));
app.use('/api/voos', require('./routes/voos'));

// // Exemplo de como voc� adicionaria rotas para suas entidades futuras
// app.use('/api/voos', require('./routes/voos'));
// app.use('/api/aeronaves', require('./routes/aeronaves'));
// app.use('/api/passageiros', require('./routes/passageiros'));

const PORT = process.env.PORT || 5000; // Define a porta, usando 5000 como padr�o se n�o houver no .env

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));