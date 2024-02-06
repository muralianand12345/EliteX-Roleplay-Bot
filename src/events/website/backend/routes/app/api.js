const express = require('express');
const router = express.Router();
require("dotenv").config();
const fs = require('fs');
const path = require('path');

router.get('/filecount', (req, res) => {
    const ticketLogDir = path.join(__dirname, '../../../ticket-logs');
    fs.readdir(ticketLogDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            res.status(500).json({ error: 'Failed to read directory.' });
        } else {
            const fileCount = files.length;
            res.json({ fileCount });
        }
    });
});

module.exports = router;