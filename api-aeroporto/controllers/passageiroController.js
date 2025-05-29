const Passageiro = require('../models/Passageiro');
const Voo = require('../models/Voo'); // Precisamos do modelo de Voo para validações

// @desc    Criar um novo passageiro
// @route   POST /api/passageiros
// @access  Public
exports.criarPassageiro = async (req, res) => {
    try {
        const { nome, cpf, vooId, statusCheckIn } = req.body;

        // Validação básica
        if (!nome || !cpf || !vooId) {
            return res.status(400).json({ msg: 'Nome, CPF e ID do voo são obrigatórios.' });
        }

        // Verifica se o CPF já existe
        const passageiroExiste = await Passageiro.findOne({ cpf });
        if (passageiroExiste) {
            return res.status(400).json({ msg: 'Já existe um passageiro com este CPF.' });
        }

        // Verifica se o voo existe
        const voo = await Voo.findById(vooId);
        if (!voo) {
            return res.status(404).json({ msg: 'Voo não encontrado.' });
        }

        // Cria o passageiro
        const novoPassageiro = new Passageiro({
            nome,
            cpf,
            vooId,
            statusCheckIn: statusCheckIn || 'pendente' // Define 'pendente' se não for fornecido
        });

        const passageiro = await novoPassageiro.save();
        await passageiro.populate('voo'); // Popula o voo para retornar na resposta
        res.status(201).json(passageiro);

    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter todos os passageiros
// @route   GET /api/passageiros
// @access  Public
exports.getTodosPassageiros = async (req, res) => {
    try {
        const passageiros = await Passageiro.find({}).populate('voo'); // Popula os dados do voo
        res.json(passageiros);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter um passageiro por ID
// @route   GET /api/passageiros/:id
// @access  Public
exports.getPassageiroPorId = async (req, res) => {
    try {
        const passageiro = await Passageiro.findById(req.params.id).populate('voo'); // Popula os dados do voo

        if (!passageiro) {
            return res.status(404).json({ msg: 'Passageiro não encontrado.' });
        }

        res.json(passageiro);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do passageiro inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar um passageiro
// @route   PUT /api/passageiros/:id
// @access  Public
exports.atualizarPassageiro = async (req, res) => {
    try {
        const { nome, cpf, vooId, statusCheckIn } = req.body;
        const passageiroCampos = {};

        // Preenche passageiroCampos apenas com os campos fornecidos
        if (nome) passageiroCampos.nome = nome;
        if (cpf) passageiroCampos.cpf = cpf;
        if (vooId !== undefined) passageiroCampos.vooId = vooId;
        if (statusCheckIn) passageiroCampos.statusCheckIn = statusCheckIn;

        let passageiro = await Passageiro.findById(req.params.id);

        if (!passageiro) {
            return res.status(404).json({ msg: 'Passageiro não encontrado.' });
        }

        // Validação de CPF único ao atualizar (ignora o próprio passageiro)
        if (cpf && passageiro.cpf !== cpf) {
            const cpfExiste = await Passageiro.findOne({ cpf, _id: { $ne: req.params.id } });
            if (cpfExiste) {
                return res.status(400).json({ msg: 'Já existe outro passageiro com este CPF.' });
            }
        }
        
        // Validação de vooId se for atualizado
        if (vooId && String(vooId) !== String(passageiro.vooId)) {
            const voo = await Voo.findById(vooId);
            if (!voo) {
                return res.status(404).json({ msg: 'Voo não encontrado.' });
            }
        }

        // Regra de negócio: Passageiros só podem fazer check-in se o voo estiver com status "embarque".
        if (statusCheckIn === 'realizado') {
            // Obter o voo mais recente (se o vooId foi alterado, usar o novo; senão, usar o existente)
            const currentVooId = passageiroCampos.vooId || passageiro.vooId;
            const vooAssociado = await Voo.findById(currentVooId);

            if (!vooAssociado) {
                return res.status(404).json({ msg: 'Voo associado ao passageiro não encontrado para validação de check-in.' });
            }

            if (vooAssociado.status !== 'embarque') {
                return res.status(400).json({ msg: `Check-in não permitido. O voo ${vooAssociado.numeroVoo} não está no status "embarque". Status atual: ${vooAssociado.status}.` });
            }
        }

        // Atualiza o passageiro
        passageiro = await Passageiro.findByIdAndUpdate(
            req.params.id,
            { $set: passageiroCampos },
            { new: true, runValidators: true }
        );

        await passageiro.populate('voo'); // Popula o voo para retornar na resposta
        res.json(passageiro);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do passageiro inválido.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar um passageiro
// @route   DELETE /api/passageiros/:id
// @access  Public
exports.deletarPassageiro = async (req, res) => {
    try {
        const passageiro = await Passageiro.findById(req.params.id);

        if (!passageiro) {
            return res.status(404).json({ msg: 'Passageiro não encontrado.' });
        }

        await Passageiro.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Passageiro removido.' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do passageiro inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};