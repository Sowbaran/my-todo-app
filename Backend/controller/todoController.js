const Todo = require('../models/todoModel');

exports.createTodo = async (req, res) => {
	try {
		const todo = new Todo({ ...req.body, user: req.user.id });
		await todo.save();
		res.status(201).json(todo);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

exports.getTodos = async (req, res) => {
	try {
		const todos = await Todo.find({ user: req.user.id });
		res.json(todos);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};





exports.getTodo = async (req, res) => {
	try {
		const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });
		if (!todo) return res.status(404).json({ message: 'Todo not found' });
		res.json(todo);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

exports.updateTodo = async (req, res) => {
	try {
		const todo = await Todo.findOneAndUpdate(
			{ _id: req.params.id, user: req.user.id },
			req.body,
			{ new: true }
		);
		if (!todo) return res.status(404).json({ message: 'Todo not found' });
		res.json(todo);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

exports.deleteTodo = async (req, res) => {
	try {
		const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
		if (!todo) return res.status(404).json({ message: 'Todo not found' });
		res.json({ message: 'Todo deleted' });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
