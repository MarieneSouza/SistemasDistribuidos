const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');

// @route   POST /api/passageiros
// @desc    Criar um novo passageiro
router.post('/', passageiroController.criarPassageiro);

// @route   GET /api/passageiros
// @desc    Obter todos os passageiros
router.get('/', passageiroController.getTodosPassageiros);

// @route   GET /api/passageiros/:id
// @desc    Obter um passageiro por ID
router.get('/:id', passageiroController.getPassageiroPorId);

// @route   PUT /api/passageiros/:id
// @desc    Atualizar um passageiro
router.put('/:id', passageiroController.atualizarPassageiro);

// @route   DELETE /api/passageiros/:id
// @desc    Deletar um passageiro
router.delete('/:id', passageiroController.deletarPassageiro);

module.exports = router;