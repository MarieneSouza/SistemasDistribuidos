const mongoose = require('mongoose');

// Fun��o para validar CPF
const validateCPF = (cpf) => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres n�o num�ricos
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false; // Verifica 11 d�gitos e CPFs com todos os d�gitos iguais
    cpf = cpf.split('').map(el => +el); // Converte para array de n�meros
    
    // Valida��o do primeiro d�gito verificador
    const rest1 = (cpf.slice(0, 9).reduce((sum, el, idx) => sum + el * (10 - idx), 0) * 10) % 11;
    if (rest1 !== cpf[9]) return false;

    // Valida��o do segundo d�gito verificador
    const rest2 = (cpf.slice(0, 10).reduce((sum, el, idx) => sum + el * (11 - idx), 0) * 10) % 11;
    if (rest2 !== cpf[10]) return false;

    return true;
};

const PassageiroSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome do passageiro � obrigat�rio.'],
        trim: true,
        minlength: [3, 'O nome deve ter no m�nimo 3 caracteres.']
    },
    cpf: {
        type: String,
        required: [true, 'O CPF do passageiro � obrigatorio.'],
        unique: true,
        trim: true,
        validate: {
            validator: validateCPF,
            message: props => `${props.value} nao � um CPF valido!`
        }
    },
    vooId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voo', // Refer�ncia ao modelo Voo
        default: null, // Passageiro pode ser criado sem um voo atribu�do inicialmente
        required: [true, 'O ID do voo � obrigat�rio para o passageiro.']
    },
    statusCheckIn: {
        type: String,
        enum: ['pendente', 'realizado'],
        default: 'pendente'
    }
}, {
    timestamps: true
});

// Adicionando um virtual para a refer�ncia do voo (popula��o)
PassageiroSchema.virtual('voo', {
    ref: 'Voo',
    localField: 'vooId',
    foreignField: '_id',
    justOne: true
});

// Garante que o virtual seja inclu�do ao converter para JSON
PassageiroSchema.set('toJSON', { virtuals: true });
PassageiroSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Passageiro', PassageiroSchema);