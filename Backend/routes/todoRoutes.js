const express = require('express');
const router = express.Router();
const todoController = require('../controller/todoController');
const auth = require('../middlewares/authorization');

router.post('/', auth, todoController.createTodo);
router.get('/', auth, todoController.getTodos);
router.get('/:id', auth, todoController.getTodo);
router.put('/:id', auth, todoController.updateTodo);
router.delete('/:id', auth, todoController.deleteTodo);

module.exports = router;
