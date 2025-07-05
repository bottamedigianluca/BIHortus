const express = require('express');
const router = express.Router();

// Placeholder per routes banking
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Banking routes working' });
});

module.exports = router;