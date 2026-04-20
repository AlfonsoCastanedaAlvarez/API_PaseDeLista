const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

router.post('/', async (req, res) => {
  try {
    const { usuario, contrasenia } = req.body;

    if (!usuario || !contrasenia) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const existe = await Usuario.findOne({ usuario });

    if (existe) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const nuevo = new Usuario({ usuario, contrasenia });
    await nuevo.save();

    res.json({
      mensaje: "Usuario creado",
      usuario: nuevo
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;