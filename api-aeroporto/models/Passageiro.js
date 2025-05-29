const mongoose = require('mongoose');

// Função para validar CPF
const validateCPF = (cpf) => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false; // Verifica 11 dígitos e CPFs com todos os dígitos iguais
    cpf = cpf.split('').map(el => +el); // Converte para array de números
    
    // Validação do primeiro dígito verificador
    const rest1 = (cpf.slice(0, 9).reduce((sum, el, idx) => sum + el * (10 - idx), 0) * 10) % 11;
    if (rest1 !== cpf[9]) return false;

    // Validação do segundo dígito verificador
    const rest2 = (cpf.slice(0, 10).reduce((sum, el, idx) => sum + el * (11 - idx), 0) * 10) % 11;
    if (rest2 !== cpf[10]) return false;

    return true;
};

const PassageiroSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do passageiro é obrigatório.'],
        trim: true,
        minlength: [3, 'O nome deve ter no mínimo 3 caracteres.']
    },
    cpf: {
        type: String,
        required: [true, 'O CPF do passageiro é obrigatorio.'],
        unique: true,
        trim: true,
        validate: {
            validator: validateCPF,
            message: props => `${props.value} nao é um CPF valido!`
        }
    },
    vooId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voo', // Referência ao modelo Voo
        default: null, // Passageiro pode ser criado sem um voo atribuído inicialmente
        required: [true, 'O ID do voo é obrigatório para o passageiro.']
    },
    statusCheckIn: {
        type: String,
        enum: ['pendente', 'realizado'],
        default: 'pendente'
    }
}, {
    timestamps: true
});

// Adicionando um virtual para a referência do voo (população)
PassageiroSchema.virtual('voo', {
    ref: 'Voo',
    localField: 'vooId',
    foreignField: '_id',
    justOne: true
});

// Garante que o virtual seja incluído ao converter para JSON
PassageiroSchema.set('toJSON', { virtuals: true });
PassageiroSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Passageiro', PassageiroSchema);