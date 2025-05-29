const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// @route   GET /api/relatorio/voos-do-dia
// @desc    Gera um relatório de voos programados para o dia atual com passageiros e status de check-in
router.get('/voos-do-dia', relatorioController.getRelatorioVoosDoDia);

module.exports = router;