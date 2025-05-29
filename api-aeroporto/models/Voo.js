const mongoose = require('mongoose');

const VooSchema = new mongoose.Schema({
    numeroVoo: {
        type: String,
        required: [true, 'O numero do voo é obrigatorio.'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [2, 'O numero do voo deve ter no mínimo 2 caracteres.']
    },
    origem: {
        type: String,
        required: [true, 'A origem do voo é obrigatoria.'],
        trim: true,
        uppercase: true,
        minlength: [3, 'A origem deve ser um codigo IATA de 3 letras.'],
        maxlength: [3, 'A origem deve ser um codigo IATA de 3 letras.']
    },
    destino: {
        type: String,
        required: [true, 'O destino do voo é obrigatório.'],
        trim: true,
        uppercase: true,
        minlength: [3, 'O destino deve ser um codigo IATA de 3 letras.'],
        maxlength: [3, 'O destino deve ser um codigo IATA de 3 letras.']
    },
    dataHoraPartida: {
        type: Date,
        required: [true, 'A data e hora de partida sao obrigatorias.']
    },
    dataHoraChegada: { // Adicionado para coerência, mesmo não explícito no escopo inicial do Voo
        type: Date,
        required: [true, 'A data e hora de chegada são obrigatorias.']
    },
    portaoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PortaoEmbarque', // Referencia o modelo PortaoEmbarque
        default: null // Opcional: pode iniciar sem portão atribuído
    },
    status: {
        type: String,
        required: [true, 'O status do voo é obrigatorio.'],
        enum: ['programado', 'embarque', 'concluido', 'cancelado'], // Adicionei 'cancelado' como status válido
        default: 'programado'
    }
}, {
    timestamps: true // Adiciona automaticamente campos 'createdAt' e 'updatedAt'
});

// Adicionando um virtual para a referência do portão (população)
VooSchema.virtual('portao', {
    ref: 'PortaoEmbarque',
    localField: 'portaoId',
    foreignField: '_id',
    justOne: true
});

// Garante que o virtual seja incluído ao converter para JSON
VooSchema.set('toJSON', { virtuals: true });
VooSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Voo', VooSchema);