const express = require('express');
const { createTask, getTaskStatus } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/tasks', authenticateToken, createTask);
router.get('/tasks/:id', authenticateToken, getTaskStatus);

module.exports = router;