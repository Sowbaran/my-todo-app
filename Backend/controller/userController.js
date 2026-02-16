const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
	const { username, password } = req.body;
	try {
		let user = await User.findOne({ username });
		if (user) return res.status(400).json({ message: 'User already exists' });
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		user = new User({ username, password: hashedPassword });
		await user.save();
		res.status(201).json({ message: 'User registered successfully' });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

exports.login = async (req, res) => {
	const { username, password } = req.body;
	try {
		const user = await User.findOne({ username });
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
		const payload = { id: user._id, username: user.username };
		const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
		res.json({ token });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
