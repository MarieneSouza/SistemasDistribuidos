const mongoose = require('mongoose');

const VooSchema = new mongoose.Schema({
    numeroVoo: {
        type: String,
        required: [true, 'O numero do voo � obrigatorio.'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [2, 'O numero do voo deve ter no m�nimo 2 caracteres.']
    },
    origem: {
        type: String,
        required: [true, 'A origem do voo � obrigatoria.'],
        trim: true,
        uppercase: true,
        minlength: [3, 'A origem deve ser um codigo IATA de 3 letras.'],
        maxlength: [3, 'A origem deve ser um codigo IATA de 3 letras.']
    },
    destino: {
        type: String,
        required: [true, 'O destino do voo � obrigat�rio.'],
        trim: true,
        uppercase: true,
        minlength: [3, 'O destino deve ser um codigo IATA de 3 letras.'],
        maxlength: [3, 'O destino deve ser um codigo IATA de 3 letras.']
    },
    dataHoraPartida: {
        type: Date,
        required: [true, 'A data e hora de partida sao obrigatorias.']
    },
    dataHoraChegada: { // Adicionado para coer�ncia, mesmo n�o expl�cito no escopo inicial do Voo
        type: Date,
        required: [true, 'A data e hora de chegada s�o obrigatorias.']
    },
    portaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PortaoEmbarque', // Referencia o modelo PortaoEmbarque
        default: null // Opcional: pode iniciar sem port�o atribu�do
    },
    status: {
        type: String,
        required: [true, 'O status do voo � obrigatorio.'],
        enum: ['programado', 'embarque', 'concluido', 'cancelado'], // Adicionei 'cancelado' como status v�lido
        default: 'programado'
    }
}, {
    timestamps: true // Adiciona automaticamente campos 'createdAt' e 'updatedAt'
});

// Adicionando um virtual para a refer�ncia do port�o (popula��o)
VooSchema.virtual('portao', {
    ref: 'PortaoEmbarque',
    localField: 'portaoId',
    foreignField: '_id',
    justOne: true
});

// Garante que o virtual seja inclu�do ao converter para JSON
VooSchema.set('toJSON', { virtuals: true });
VooSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Voo', VooSchema);