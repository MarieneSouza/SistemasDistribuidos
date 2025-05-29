const Voo = require('../models/Voo');
const PortaoEmbarque = require('../models/PortaoEmbarque'); // Precisamos do modelo de Port�o

// Fun��o auxiliar para validar e gerenciar a disponibilidade do port�o
const gerenciarDisponibilidadePortao = async (vooId, novoPortaoId, statusVoo) => {
    let portaoAntigoId;
    // Se for um voo existente, verifica o port�o anterior
    if (vooId) {
        const vooExistente = await Voo.findById(vooId);
        if (vooExistente) {
            portaoAntigoId = vooExistente.portaoId;
        }
    }

    // Se houver um port�o antigo e ele for diferente do novo port�o, liber�-lo
    if (portaoAntigoId && portaoAntigoId.toString() !== novoPortaoId?.toString()) {
        await PortaoEmbarque.findByIdAndUpdate(portaoAntigoId, { disponivel: true });
    }

    // Se um novo port�o foi atribu�do e o voo n�o est� conclu�do/cancelado, ocup�-lo
    if (novoPortaoId && statusVoo !== 'concluido' && statusVoo !== 'cancelado') {
        const portao = await PortaoEmbarque.findById(novoPortaoId);
        if (!portao) {
            throw new Error('Port�o de embarque n�o encontrado para atribui��o.');
        }
        if (!portao.disponivel && portaoAntigoId?.toString() !== novoPortaoId.toString()) {
            // Se o port�o n�o estiver dispon�vel E n�o for o mesmo port�o que j� estava atribu�do ao voo
            throw new Error('Port�o de embarque n�o est� dispon�vel.');
        }
        await PortaoEmbarque.findByIdAndUpdate(novoPortaoId, { disponivel: false });
    }
    // Se o voo est� sendo marcado como conclu�do ou cancelado e um port�o est� atribu�do, liber�-lo
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

        // 1. Valida��es b�sicas (campos obrigat�rios e formato)
        if (!numeroVoo || !origem || !destino || !dataHoraPartida || !dataHoraChegada || !status) {
            return res.status(400).json({ msg: 'Por favor, preencha todos os campos obrigat�rios.' });
        }

        // Valida��o de datas
        if (new Date(dataHoraPartida) >= new Date(dataHoraChegada)) {
            return res.status(400).json({ msg: 'A data e hora de chegada devem ser posteriores � data e hora de partida.' });
        }

        // 2. Valida��o de numeroVoo �nico
        const vooExiste = await Voo.findOne({ numeroVoo: numeroVoo.toUpperCase() });
        if (vooExiste) {
            return res.status(400).json({ msg: 'J� existe um voo com este n�mero.' });
        }

        // 3. Valida��o e atribui��o do port�o (regra de neg�cio)
        if (portaoId) {
            try {
                await gerenciarDisponibilidadePortao(null, portaoId, status); // null para vooId pois � um novo voo
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
        // Popula o port�o para retornar na resposta
        await voo.populate('portao');
        res.status(201).json(voo);

    } catch (err) {
        console.error(err.message);
        // Erro de valida��o do Mongoose (ex: enum para status, minlength/maxlength)
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
        // Opcional: Implementar filtros e pagina��o aqui no futuro
        const voos = await Voo.find({}).populate('portao'); // Popula os dados do port�o
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
        const voo = await Voo.findById(req.params.id).populate('portao'); // Popula os dados do port�o

        if (!voo) {
            return res.status(404).json({ msg: 'Voo n�o encontrado.' });
        }

        res.json(voo);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inv�lido.' });
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

        // Preenche vooCampos apenas com os campos fornecidos na requisi��o
        if (numeroVoo) vooCampos.numeroVoo = numeroVoo.toUpperCase();
        if (origem) vooCampos.origem = origem.toUpperCase();
        if (destino) vooCampos.destino = destino.toUpperCase();
        if (dataHoraPartida) vooCampos.dataHoraPartida = dataHoraPartida;
        if (dataHoraChegada) vooCampos.dataHoraChegada = dataHoraChegada;
        if (portaoId !== undefined) vooCampos.portaoId = portaoId; // Pode ser null para desvincular
        if (status) vooCampos.status = status;

        let voo = await Voo.findById(req.params.id);

        if (!voo) {
            return res.status(404).json({ msg: 'Voo n�o encontrado.' });
        }

        // Valida��o de numeroVoo �nico ao atualizar (ignora o pr�prio voo)
        if (numeroVoo && voo.numeroVoo !== numeroVoo.toUpperCase()) {
            const vooExiste = await Voo.findOne({ numeroVoo: numeroVoo.toUpperCase(), _id: { $ne: req.params.id } });
            if (vooExiste) {
                return res.status(400).json({ msg: 'J� existe outro voo com este n�mero.' });
            }
        }

        // Valida��o de datas ao atualizar
        const finalDataPartida = vooCampos.dataHoraPartida || voo.dataHoraPartida;
        const finalDataChegada = vooCampos.dataHoraChegada || voo.dataHoraChegada;
        if (new Date(finalDataPartida) >= new Date(finalDataChegada)) {
             return res.status(400).json({ msg: 'A data e hora de chegada devem ser posteriores � data e hora de partida.' });
        }

        // Regra de neg�cio: Gerenciar disponibilidade do port�o
        // A fun��o gerenciarDisponibilidadePortao precisa do ID do voo atual, do novo portaoId e do novo status
        try {
            await gerenciarDisponibilidadePortao(req.params.id, vooCampos.portaoId, vooCampos.status);
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }

        // Atualiza o voo
        voo = await Voo.findByIdAndUpdate(
            req.params.id,
            { $set: vooCampos },
            { new: true, runValidators: true } // new: true retorna o documento atualizado; runValidators: true executa as valida��es do schema
        );

        await voo.populate('portao'); // Popula o port�o para retornar na resposta
        res.json(voo);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inv�lido.' });
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
            return res.status(404).json({ msg: 'Voo n�o encontrado.' });
        }

        // Ao deletar um voo, se ele tinha um port�o atribu�do, liberar o port�o
        if (voo.portaoId) {
            await PortaoEmbarque.findByIdAndUpdate(voo.portaoId, { disponivel: true });
        }
        
        // Desvincular passageiros deste voo (op��o 1: definir vooId como null)
        await Passageiro.updateMany({ vooId: req.params.id }, { $set: { vooId: null, statusCheckIn: 'pendente' } });
        // Ou, se voc� quiser deletar passageiros junto com o voo (op��o 2, menos recomendada sem um caso de uso claro):
        // await Passageiro.deleteMany({ vooId: req.params.id });

        await Voo.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Voo removido e passageiros desvinculados (se houver).' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do voo inv�lido.' });
        }
        res.status(500).send('Erro no servidor');
    }
};