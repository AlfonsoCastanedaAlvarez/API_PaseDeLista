const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { v4: uuidv4 } = require('uuid');

router.post('/login', async (req, res) => {
  try {
    const { usuario, contrsenia } = req.body;

    if (!usuario || !contrsenia) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const user = await Usuario.findOne({
      usuario,
      contrasenia: contrsenia
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const apikey = uuidv4();
    const fechaDeEpiracion = new Date();
    fechaDeEpiracion.setMonth(fechaDeEpiracion.getMonth() + 1);

    user.apikey = apikey;
    user.fechaDeEpiracion = fechaDeEpiracion;

    await user.save();

    res.json({
      apikey,
      fechaDeEpiracion
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;