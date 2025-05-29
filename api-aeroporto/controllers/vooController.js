const Voo = require('../models/Voo');
const PortaoEmbarque = require('../models/PortaoEmbarque'); // Precisamos do modelo de Portão

// Função auxiliar para validar e gerenciar a disponibilidade do portão
const gerenciarDisponibilidadePortao = async (vooId, novoPortaoId, statusVoo) => {
    let portaoAntigoId;
    // Se for um voo existente, verifica o portão anterior
    if (vooId) {
        const vooExistente = await Voo.findById(vooId);
        if (vooExistente) {
            portaoAntigoId = vooExistente.portaoId;
        }
    }

    // Se houver um portão antigo e ele for diferente do novo portão, liberá-lo
    if (portaoAntigoId && portaoAntigoId.toString() !== novoPortaoId?.toString()) {
        await PortaoEmbarque.findByIdAndUpdate(portaoAntigoId, { disponivel: true });
    }

    // Se um novo portão foi atribuído e o voo não está concluído/cancelado, ocupá-lo
    if (novoPortaoId && statusVoo !== 'concluido' && statusVoo !== 'cancelado') {
        const portao = await PortaoEmbarque.findById(novoPortaoId);
        if (!portao) {
            throw new Error('Portão de embarque não encontrado para atribuição.');
        }
        if (!portao.disponivel && portaoAntigoId?.toString() !== novoPortaoId.toString()) {
            // Se o portão não estiver disponível E não for o mesmo portão que já estava atribuído ao voo
            throw new Error('Portão de embarque não está disponível.');
        }
        await PortaoEmbarque.findByIdAndUpdate(novoPortaoId, { disponivel: false });
    }
    // Se o voo está sendo marcado como concluído ou cancelado e um portão está atribuído, liberá-lo
    else if (novoPortaoId && (statusVoo === 'concluido' || statusVoo === 'cancelado')) {
        await PortaoEmbarque.findByIdAndUpdate(novoPortaoId, { disponivel: true });
    }
};


// @desc    Criar um novo voo
// @route   POST /api/voos
// @access  Public
exports.criarVoo = async (req, res) => {
    try {
        const { numeroVoo, origem, destino, dataHoraPartida, dataHoraChegada, portaoId, status } = req.body;

        // 1. Validações básicas (campos obrigatórios e formato)
        if (!numeroVoo || !origem || !destino || !dataHoraPartida || !dataHoraChegada || !status) {
            return res.status(400).json({ msg: 'Por favor, preencha todos os campos obrigatórios.' });
        }

        // Validação de datas
        if (new Date(dataHoraPartida) >= new Date(dataHoraChegada)) {
            return res.status(400).json({ msg: 'A data e hora de chegada devem ser posteriores à data e hora de partida.' });
        }

        // 2. Validação de numeroVoo único
        const vooExiste = await Voo.findOne({ numeroVoo: numeroVoo.toUpperCase() });
        if (vooExiste) {
            return res.status(400).json({ msg: 'Já existe um voo com este número.' });
        }

        // 3. Validação e atribuição do portão (regra de negócio)
        if (portaoId) {
            try {
                await gerenciarDisponibilidadePortao(null, portaoId, status); // null para vooId pois é um novo voo
            } catch (error) {
                return res.status(400).json({ msg: error.message });
            }
        }

        const novoVoo = new Voo({
            numeroVoo,
            origem,
            destino,
            dataHoraPartida,
            dataHoraChegada,
            portaoId,
            status
        });

        const voo = await novoVoo.save();
        // Popula o portão para retornar na resposta
        await voo.populate('portao');
        res.status(201).json(voo);

    } catch (err) {
        console.error(err.message);
        // Erro de validação do Mongoose (ex: enum para status, minlength/maxlength)
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter todos os voos
// @route   GET /api/voos
// @access  Public
exports.getTodosVoos = async (req, res) => {
    try {
        // Opcional: Implementar filtros e paginação aqui no futuro
        const voos = await Voo.find({}).populate('portao'); // Popula os dados do portão
        res.json(voos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Obter um voo por ID
// @route   GET /api/voos/:id
// @access  Public
exports.getVooPorId = async (req, res) => {
    try {
        const voo = await Voo.findById(req.params.id).populate('portao'); // Popula os dados do portão

        if (!voo) {
            return res.status(404).json({ msg: 'Voo não encontrado.' });
        }

        res.json(voo);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Atualizar um voo
// @route   PUT /api/voos/:id
// @access  Public
exports.atualizarVoo = async (req, res) => {
    try {
        const { numeroVoo, origem, destino, dataHoraPartida, dataHoraChegada, portaoId, status } = req.body;
        const vooCampos = {};

        // Preenche vooCampos apenas com os campos fornecidos na requisição
        if (numeroVoo) vooCampos.numeroVoo = numeroVoo.toUpperCase();
        if (origem) vooCampos.origem = origem.toUpperCase();
        if (destino) vooCampos.destino = destino.toUpperCase();
        if (dataHoraPartida) vooCampos.dataHoraPartida = dataHoraPartida;
        if (dataHoraChegada) vooCampos.dataHoraChegada = dataHoraChegada;
        if (portaoId !== undefined) vooCampos.portaoId = portaoId; // Pode ser null para desvincular
        if (status) vooCampos.status = status;

        let voo = await Voo.findById(req.params.id);

        if (!voo) {
            return res.status(404).json({ msg: 'Voo não encontrado.' });
        }

        // Validação de numeroVoo único ao atualizar (ignora o próprio voo)
        if (numeroVoo && voo.numeroVoo !== numeroVoo.toUpperCase()) {
            const vooExiste = await Voo.findOne({ numeroVoo: numeroVoo.toUpperCase(), _id: { $ne: req.params.id } });
            if (vooExiste) {
                return res.status(400).json({ msg: 'Já existe outro voo com este número.' });
            }
        }

        // Validação de datas ao atualizar
        const finalDataPartida = vooCampos.dataHoraPartida || voo.dataHoraPartida;
        const finalDataChegada = vooCampos.dataHoraChegada || voo.dataHoraChegada;
        if (new Date(finalDataPartida) >= new Date(finalDataChegada)) {
             return res.status(400).json({ msg: 'A data e hora de chegada devem ser posteriores à data e hora de partida.' });
        }

        // Regra de negócio: Gerenciar disponibilidade do portão
        // A função gerenciarDisponibilidadePortao precisa do ID do voo atual, do novo portaoId e do novo status
        try {
            await gerenciarDisponibilidadePortao(req.params.id, vooCampos.portaoId, vooCampos.status);
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }

        // Atualiza o voo
        voo = await Voo.findByIdAndUpdate(
            req.params.id,
            { $set: vooCampos },
            { new: true, runValidators: true } // new: true retorna o documento atualizado; runValidators: true executa as validações do schema
        );

        await voo.populate('portao'); // Popula o portão para retornar na resposta
        res.json(voo);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inválido.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).send('Erro no servidor');
    }
};

// @desc    Deletar um voo
// @route   DELETE /api/voos/:id
// @access  Public
exports.deletarVoo = async (req, res) => {
    try {
        const voo = await Voo.findById(req.params.id);

        if (!voo) {
            return res.status(404).json({ msg: 'Voo não encontrado.' });
        }

        // Ao deletar um voo, se ele tinha um portão atribuído, liberar o portão
        if (voo.portaoId) {
            await PortaoEmbarque.findByIdAndUpdate(voo.portaoId, { disponivel: true });
        }
        
        // Desvincular passageiros deste voo (opção 1: definir vooId como null)
        await Passageiro.updateMany({ vooId: req.params.id }, { $set: { vooId: null, statusCheckIn: 'pendente' } });
        // Ou, se você quiser deletar passageiros junto com o voo (opção 2, menos recomendada sem um caso de uso claro):
        // await Passageiro.deleteMany({ vooId: req.params.id });

        await Voo.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Voo removido e passageiros desvinculados (se houver).' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inválido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};