const Passageiro = require('../models/Passageiro');
const Voo = require('../models/Voo'); // Precisamos do modelo de Voo para valida��es

// @desc    Criar um novo passageiro
// @route   POST /api/passageiros
// @access  Public
exports.criarPassageiro = async (req, res) => {
    try {
        const { nome, cpf, vooId, statusCheckIn } = req.body;

        // Valida��o b�sica
        if (!nome || !cpf || !vooId) {
            return res.status(400).json({ msg: 'Nome, CPF e ID do voo s�o obrigat�rios.' });
        }

        // Verifica se o CPF j� existe
        const passageiroExiste = await Passageiro.findOne({ cpf });
        if (passageiroExiste) {
            return res.status(400).json({ msg: 'J� existe um passageiro com este CPF.' });
        }

        // Verifica se o voo existe
        const voo = await Voo.findById(vooId);
        if (!voo) {
            return res.status(404).json({ msg: 'Voo n�o encontrado.' });
        }

        // Cria o passageiro
        const novoPassageiro = new Passageiro({
            nome,
            cpf,
            vooId,
            statusCheckIn: statusCheckIn || 'pendente' // Define 'pendente' se n�o for fornecido
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
            return res.status(404).json({ msg: 'Passageiro n�o encontrado.' });
        }

        res.json(passageiro);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do passageiro inv�lido.' });
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
            return res.status(404).json({ msg: 'Passageiro n�o encontrado.' });
        }

        // Valida��o de CPF �nico ao atualizar (ignora o pr�prio passageiro)
        if (cpf && passageiro.cpf !== cpf) {
            const cpfExiste = await Passageiro.findOne({ cpf, _id: { $ne: req.params.id } });
            if (cpfExiste) {
                return res.status(400).json({ msg: 'J� existe outro passageiro com este CPF.' });
            }
        }
        
        // Valida��o de vooId se for atualizado
        if (vooId && String(vooId) !== String(passageiro.vooId)) {
            const voo = await Voo.findById(vooId);
            if (!voo) {
                return res.status(404).json({ msg: 'Voo n�o encontrado.' });
            }
        }

        // Regra de neg�cio: Passageiros s� podem fazer check-in se o voo estiver com status "embarque".
        if (statusCheckIn === 'realizado') {
            // Obter o voo mais recente (se o vooId foi alterado, usar o novo; sen�o, usar o existente)
            const currentVooId = passageiroCampos.vooId || passageiro.vooId;
            const vooAssociado = await Voo.findById(currentVooId);

            if (!vooAssociado) {
                return res.status(404).json({ msg: 'Voo associado ao passageiro n�o encontrado para valida��o de check-in.' });
            }

            if (vooAssociado.status !== 'embarque') {
                return res.status(400).json({ msg: `Check-in n�o permitido. O voo ${vooAssociado.numeroVoo} n�o est� no status "embarque". Status atual: ${vooAssociado.status}.` });
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
            return res.status(400).json({ msg: 'ID do passageiro inv�lido.' });
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
            return res.status(404).json({ msg: 'Passageiro n�o encontrado.' });
        }

        await Passageiro.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Passageiro removido.' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do passageiro inv�lido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};