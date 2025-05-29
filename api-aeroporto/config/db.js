const mongoose = require('mongoose');
require('dotenv').config(); // Carrega as vari�veis de ambiente do .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // As op��es useCreateIndex e useFindAndModify n�o s�o mais necess�rias em Mongoose 6+
            // e podem causar avisos de deprecation se usadas.
        });
        console.log('MongoDB Conectado...');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        process.exit(1); // Sai do processo com erro
    }
};

module.exports = connectDB;