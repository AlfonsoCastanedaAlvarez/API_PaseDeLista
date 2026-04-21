const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Usuario = require('../models/Usuario');

// Middleware para validar apikey desde query param
async function validarApiKey(req, res, next) {
  const apikey = req.query.apikey || req.body.apikey;
  if (!apikey) {
    return res.status(400).json({ error: "APIKEY requerida" });
  }
  const user = await Usuario.findOne({ apikey });
  if (!user) {
    return res.status(401).json({ error: "APIKEY inválida" });
  }
  if (user.fechaDeEpiracion && user.fechaDeEpiracion < new Date()) {
    return res.status(401).json({ error: "APIKEY expirada" });
  }
  req.usuario = user;
  next();
}

// POST /api/grupos/crear — crear grupo
router.post('/crear', async (req, res) => {
  try {
    const nuevo = new Grupo(req.body);
    await nuevo.save();
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/grupos?apikey=XXX — obtener todos los grupos
router.get('/', validarApiKey, async (req, res) => {
  try {
    const grupos = await Grupo.find();
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/grupos/:id?apikey=XXX — obtener un grupo por ID
router.get('/:id', validarApiKey, async (req, res) => {
  try {
    const grupo = await Grupo.findById(req.params.id);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }
    res.json(grupo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/grupos — obtener grupos (mantiene compatibilidad con versión anterior)
router.post('/', async (req, res) => {
  try {
    const { apikey } = req.body;

    if (!apikey) {
      return res.status(400).json({ error: "APIKEY requerida" });
    }

    const user = await Usuario.findOne({ apikey });
    if (!user) {
      return res.status(401).json({ error: "APIKEY inválida" });
    }

    if (user.fechaDeEpiracion && user.fechaDeEpiracion < new Date()) {
      return res.status(401).json({ error: "APIKEY expirada" });
    }

    const grupos = await Grupo.find();

    const resultado = grupos.map(g => ({
      materia: g.materia,
      horarios: g.horarios.map(h => ({
        dia: h.dia,
        horaInicial: h.horaInicial,
        horaFinal: h.horaFinal
      }))
    }));

    res.json(resultado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;