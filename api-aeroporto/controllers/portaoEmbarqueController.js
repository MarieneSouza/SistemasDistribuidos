const PortaoEmbarque = require('../models/PortaoEmbarque');

// @desc    Criar um novo portão de embarque
// @route   POST /api/portoes
// @access  Public
exports.criarPortao = async (req, res) => {
    try {
        const { codigo } = req.body;

        // Validação básica
        if (!codigo) {
            return res.status(400).json({ msg: 'O codigo do portao é obrigatorio.' });
        }

        const portaoExiste = await PortaoEmbarque.findOne({ codigo: codigo.toUpperCase() });
        if (portaoExiste) {
            return res.status(400).json({ msg: 'Ja existe um portao com este codigo.' });
        }

        const portao = await PortaoEmbarque.create({ codigo });
        res.status(201).json(portao);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter todos os portões de embarque
// @route   GET /api/portoes
// @access  Public
exports.getTodosPortoes = async (req, res) => {
    try {
        const portoes = await PortaoEmbarque.find({});
        res.json(portoes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter um portão de embarque por ID
// @route   GET /api/portoes/:id
// @access  Public
exports.getPortaoPorId = async (req, res) => {
    try {
        const portao = await PortaoEmbarque.findById(req.params.id);

        if (!portao) {
            return res.status(404).json({ msg: 'Portao de embarque nao encontrado.' });
        }

        res.json(portao);
    } catch (err) {
        console.error(err.message);
        // Se o ID não for um ObjectId válido do Mongoose, ele lança um erro de CastError
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do portao invalido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar um portão de embarque
// @route   PUT /api/portoes/:id
// @access  Public
exports.atualizarPortao = async (req, res) => {
    try {
        const { codigo, disponivel } = req.body;
        const portaoCampos = {};

        if (codigo) {
            portaoCampos.codigo = codigo.toUpperCase();
            // Verificar unicidade do código ao atualizar
            const portaoExiste = await PortaoEmbarque.findOne({ codigo: portaoCampos.codigo, _id: { $ne: req.params.id } });
            if (portaoExiste) {
                return res.status(400).json({ msg: 'Ja existe outro portao com este codigo.' });
            }
        }
        if (typeof disponivel === 'boolean') { // Garante que é um booleano
            portaoCampos.disponivel = disponivel;
        }

        let portao = await PortaoEmbarque.findById(req.params.id);

        if (!portao) {
            return res.status(404).json({ msg: 'Portao de embarque nao encontrado.' });
        }

        // Atualiza e retorna o documento atualizado
        portao = await PortaoEmbarque.findByIdAndUpdate(
            req.params.id,
            { $set: portaoCampos },
            { new: true, runValidators: true } // new: true retorna o documento atualizado; runValidators: true executa as validações do schema
        );

        res.json(portao);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do portao invalido.' });
        }
        // Tratamento para erro de validação (ex: minlength)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar um portão de embarque
// @route   DELETE /api/portoes/:id
// @access  Public
exports.deletarPortao = async (req, res) => {
    try {
        const portao = await PortaoEmbarque.findById(req.params.id);

        if (!portao) {
            return res.status(404).json({ msg: 'Portao de embarque nao encontrado.' });
        }

        // TODO: Antes de deletar um portão, talvez verificar se ele não está vinculado a um voo ativo
        // Por agora, vamos permitir a exclusão direta para o CRUD básico.

        await PortaoEmbarque.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Portao de embarque removido.' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do portao invalido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};