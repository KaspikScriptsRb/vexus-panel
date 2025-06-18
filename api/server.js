const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { nanoid } = require('nanoid');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default data if db.json is empty
db.defaults({ keys: [] }).write();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// --- API Endpoints ---

// GET all keys
app.get('/api/keys', (req, res) => {
    const keys = db.get('keys').value();
    res.json(keys);
});

// CREATE a key
app.post('/api/keys', (req, res) => {
    const { name, expiresAt, value } = req.body;
    const newKey = {
        id: nanoid(),
        name,
        value,
        expiresAt,
        hwid: null,
        isBanned: false,
        createdAt: new Date().toISOString()
    };
    db.get('keys').push(newKey).write();
    res.status(201).json(newKey);
});

// UPDATE a key (for ban, reset hwid, edit name)
app.put('/api/keys/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const key = db.get('keys').find({ id });
    if (!key.value()) {
        return res.status(404).json({ error: 'Key not found' });
    }
    
    key.assign(updates).write();
    res.json(key.value());
});

// DELETE a key
app.delete('/api/keys/:id', (req, res) => {
    const { id } = req.params;
    const key = db.get('keys').find({ id });
    if (!key.value()) {
        return res.status(404).json({ error: 'Key not found' });
    }
    db.get('keys').remove({ id }).write();
    res.status(204).send(); // No content
});


// Endpoint for the Lua script
app.post('/api/validate', (req, res) => {
    const { keyValue, hwid } = req.body;

    if (!keyValue || !hwid) {
        return res.status(400).json({ valid: false, message: 'Invalid request' });
    }

    const key = db.get('keys').find({ value: keyValue }).value();

    if (!key) {
        return res.json({ valid: false, message: 'Invalid Key' });
    }
    if (key.isBanned) {
        return res.json({ valid: false, message: 'Your key is banned' });
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        return res.json({ valid: false, message: 'Key has expired' });
    }

    if (key.hwid && key.hwid !== hwid) {
        return res.json({ valid: false, message: 'HWID mismatch' });
    }

    if (!key.hwid) {
        // First time use, lock HWID
        db.get('keys').find({ value: keyValue }).assign({ hwid: hwid }).write();
    }
    
    res.json({ valid: true, message: 'Welcome!' });
});


app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
    console.log('You can now open the "admin-panel/index.html" file in your browser.');
}); 