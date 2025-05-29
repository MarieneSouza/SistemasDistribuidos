const mongoose = require('mongoose');
require('dotenv').config(); // Carrega as variáveis de ambiente do .env

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // As opções useCreateIndex e useFindAndModify não são mais necessárias em Mongoose 6+
            // e podem causar avisos de deprecation se usadas.
        });
        console.log('MongoDB Conectado...');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        process.exit(1); // Sai do processo com erro
    }
};

module.exports = connectDB;