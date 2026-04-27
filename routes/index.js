const express = require('express');
const router = express.Router();

// Ruta principal
router.get('/', (req, res) => {
  res.render('index', { title: 'Fotaza2' });
});

module.exports = router;
