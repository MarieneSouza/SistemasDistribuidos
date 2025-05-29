const express = require('express');
const connectDB = require('./config/db'); // Importa a função de conexão com o DB
const cors = require('cors'); // Importa o middleware CORS
require('dotenv').config(); // Carrega as variáveis de ambiente no início do app

const app = express();

// Conectar ao Banco de Dados
connectDB();

// Middleware para permitir requisições JSON no corpo da requisição
app.use(express.json({ extended: false }));

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
// Essencial se sua API for ser consumida por um frontend em um domínio diferente
app.use(cors());

// Rota de teste inicial
app.get('/', (req, res) => res.send('API de Aeroporto Rodando!'));

// Rotas Criadas
app.use('/api/passageiros', require('./routes/passageiros')); // rota para passageiros
app.use('/api/relatorio', require('./routes/relatorio')); // 
app.use('/api/portoes', require('./routes/portoes'));
app.use('/api/voos', require('./routes/voos'));

// // Exemplo de como você adicionaria rotas para suas entidades futuras
// app.use('/api/voos', require('./routes/voos'));
// app.use('/api/aeronaves', require('./routes/aeronaves'));
// app.use('/api/passageiros', require('./routes/passageiros'));

const PORT = process.env.PORT || 5000; // Define a porta, usando 5000 como padrão se não houver no .env

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));