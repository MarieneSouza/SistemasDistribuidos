const mongoose = require('mongoose');

const PortaoEmbarqueSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'O codigo do portao é obrigatorio.'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [2, 'O codigo do portao deve ter no mínimo 2 caracteres.']
    },
    disponivel: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Adiciona automaticamente campos 'createdAt' e 'updatedAt'
});

module.exports = mongoose.model('PortaoEmbarque', PortaoEmbarqueSchema);