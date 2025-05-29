const PortaoEmbarque = require('../models/PortaoEmbarque');

// @desc    Criar um novo port�o de embarque
// @route   POST /api/portoes
// @access  Public
exports.criarPortao = async (req, res) => {
    try {
        const { codigo } = req.body;

        // Valida��o b�sica
        if (!codigo) {
            return res.status(400).json({ msg: 'O codigo do portao � obrigatorio.' });
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

// @desc    Obter todos os port�es de embarque
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

// @desc    Obter um port�o de embarque por ID
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
        // Se o ID n�o for um ObjectId v�lido do Mongoose, ele lan�a um erro de CastError
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do portao invalido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar um port�o de embarque
// @route   PUT /api/portoes/:id
// @access  Public
exports.atualizarPortao = async (req, res) => {
    try {
        const { codigo, disponivel } = req.body;
        const portaoCampos = {};

        if (codigo) {
            portaoCampos.codigo = codigo.toUpperCase();
            // Verificar unicidade do c�digo ao atualizar
            const portaoExiste = await PortaoEmbarque.findOne({ codigo: portaoCampos.codigo, _id: { $ne: req.params.id } });
            if (portaoExiste) {
                return res.status(400).json({ msg: 'Ja existe outro portao com este codigo.' });
            }
        }
        if (typeof disponivel === 'boolean') { // Garante que � um booleano
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
            { new: true, runValidators: true } // new: true retorna o documento atualizado; runValidators: true executa as valida��es do schema
        );

        res.json(portao);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do portao invalido.' });
        }
        // Tratamento para erro de valida��o (ex: minlength)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar um port�o de embarque
// @route   DELETE /api/portoes/:id
// @access  Public
exports.deletarPortao = async (req, res) => {
    try {
        const portao = await PortaoEmbarque.findById(req.params.id);

        if (!portao) {
            return res.status(404).json({ msg: 'Portao de embarque nao encontrado.' });
        }

        // TODO: Antes de deletar um port�o, talvez verificar se ele n�o est� vinculado a um voo ativo
        // Por agora, vamos permitir a exclus�o direta para o CRUD b�sico.

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