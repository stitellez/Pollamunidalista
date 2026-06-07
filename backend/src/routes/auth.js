const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/users — Name-Liste für Dropdown (ohne PINs!)
router.get('/users', async (_req, res) => {
  const users = await readJSON('users.json');
  res.json(users.map(u => ({ id: u.id, name: u.name })));
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId || !pin) return res.status(400).json({ error: 'userId und pin erforderlich' });

  const users = await readJSON('users.json');
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' });

  const valid = await bcrypt.compare(String(pin), user.pin);
  if (!valid) return res.status(401).json({ error: 'Falscher PIN' });

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// POST /api/auth/users — Neuen User anlegen (nur Admin)
router.post('/users', requireAdmin, async (req, res) => {
  const { name, pin, role } = req.body;
  if (!name || !pin) return res.status(400).json({ error: 'name und pin erforderlich' });

  const users = await readJSON('users.json');
  if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: 'Name bereits vergeben' });
  }

  const hashedPin = await bcrypt.hash(String(pin), 10);
  const newUser = {
    id: `u${Date.now()}`,
    name,
    pin: hashedPin,
    role: role === 'admin' ? 'admin' : 'user',
  };
  users.push(newUser);
  await writeJSON('users.json', users);
  res.status(201).json({ id: newUser.id, name: newUser.name, role: newUser.role });
});

// PUT /api/auth/users/:id/pin — PIN zurücksetzen (nur Admin)
router.put('/users/:id/pin', requireAdmin, async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'pin erforderlich' });

  const users = await readJSON('users.json');
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  users[idx].pin = await bcrypt.hash(String(pin), 10);
  await writeJSON('users.json', users);
  res.json({ ok: true });
});

// DELETE /api/auth/users/:id — User löschen (nur Admin)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  const users = await readJSON('users.json');
  const filtered = users.filter(u => u.id !== req.params.id);
  if (filtered.length === users.length) return res.status(404).json({ error: 'Nicht gefunden' });
  await writeJSON('users.json', filtered);
  res.json({ ok: true });
});

module.exports = router;
