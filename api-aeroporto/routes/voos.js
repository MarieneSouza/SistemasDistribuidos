const express = require('express');
const router = express.Router();
const vooController = require('../controllers/vooController');

// @route   POST /api/voos
// @desc    Criar um novo voo
router.post('/', vooController.criarVoo);

// @route   GET /api/voos
// @desc    Obter todos os voos
router.get('/', vooController.getTodosVoos);

// @route   GET /api/voos/:id
// @desc    Obter um voo por ID
router.get('/:id', vooController.getVooPorId);

// @route   PUT /api/voos/:id
// @desc    Atualizar um voo
router.put('/:id', vooController.atualizarVoo);

// @route   DELETE /api/voos/:id
// @desc    Deletar um voo
router.delete('/:id', vooController.deletarVoo);

module.exports = router;