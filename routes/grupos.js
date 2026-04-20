const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Usuario = require('../models/Usuario');

router.post('/crear', async (req, res) => {
  try {
    const nuevo = new Grupo(req.body);
    await nuevo.save();
    res.json(nuevo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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