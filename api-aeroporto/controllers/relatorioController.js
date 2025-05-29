const Voo = require('../models/Voo');
const Passageiro = require('../models/Passageiro');
const PortaoEmbarque = require('../models/PortaoEmbarque'); // Se precisar de detalhes do port�o

// @desc    Gera um relat�rio de voos programados para o dia atual
// @route   GET /api/relatorio/voos-do-dia
// @access  Public
exports.getRelatorioVoosDoDia = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // In�cio do dia
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // In�cio do pr�ximo dia

        // Encontrar voos programados para o dia atual
        const voosDoDia = await Voo.find({
            dataHoraPartida: {
                $gte: today,
                $lt: tomorrow
            },
            status: { $in: ['programado', 'embarque'] } // Considerar voos programados e em embarque
        }).populate('portao'); // Popula os dados do port�o

        const relatorio = [];

        for (const voo of voosDoDia) {
            // Encontrar passageiros para cada voo
            const passageirosDoVoo = await Passageiro.find({ vooId: voo._id });

            const passageirosFormatados = passageirosDoVoo.map(p => ({
                id: p._id,
                nome: p.nome,
                cpf: p.cpf,
                statusCheckIn: p.statusCheckIn
            }));

            relatorio.push({
                vooId: voo._id,
                numeroVoo: voo.numeroVoo,
                origem: voo.origem,
                destino: voo.destino,
                dataHoraPartida: voo.dataHoraPartida,
                dataHoraChegada: voo.dataHoraChegada,
                statusVoo: voo.status,
                portaoAtribuido: voo.portao ? {
                    id: voo.portao._id,
                    codigo: voo.portao.codigo,
                    disponivel: voo.portao.disponivel // Embora o relat�rio seja para voos ativos, pode ser �til
                } : 'N/A',
                passageiros: passageirosFormatados
            });
        }

        res.json(relatorio);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};