const express = require('express');
const router = express.Router();
const portaoEmbarqueController = require('../controllers/portaoEmbarqueController');

// @route   POST /api/portoes
// @desc    Criar um novo port�o de embarque
router.post('/', portaoEmbarqueController.criarPortao);

// @route   GET /api/portoes
// @desc    Obter todos os port�es de embarque
router.get('/', portaoEmbarqueController.getTodosPortoes);

// @route   GET /api/portoes/:id
// @desc    Obter um port�o de embarque por ID
router.get('/:id', portaoEmbarqueController.getPortaoPorId);

// @route   PUT /api/portoes/:id
// @desc    Atualizar um port�o de embarque
router.put('/:id', portaoEmbarqueController.atualizarPortao);

// @route   DELETE /api/portoes/:id
// @desc    Deletar um port�o de embarque
router.delete('/:id', portaoEmbarqueController.deletarPortao);

module.exports = router;