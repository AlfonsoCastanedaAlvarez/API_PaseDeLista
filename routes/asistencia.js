const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Asistencia = require('../models/Asistencia');
const Usuario = require('../models/Usuario');

router.post('/', async (req, res) => {
  try {
    const { apikey, dipositivoId, alumnoId, materiaId, fechaHora } = req.body;

    const usuario = await Usuario.findOne({ apikey });
    if (!usuario) {
      return res.status(401).json({ error: "APIKEY inválida" });
    }

    if (usuario.fechaDeEpiracion < new Date()) {
      return res.status(401).json({ error: "APIKEY expirada" });
    }

    const grupo = await Grupo.findById(materiaId);
    if (!grupo) {
      return res.status(404).json({ error: "Grupo no encontrado" });
    }

    const fecha = new Date(fechaHora);
    if (isNaN(fecha)) {
      return res.status(400).json({ error: "Formato de fecha inválido" });
    }

    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const yaRegistrado = await Asistencia.findOne({
      alumnoId,
      materiaId,
      fechaHora: {
        $gte: inicioDia,
        $lte: finDia
      }
    });

    if (yaRegistrado) {
      return res.json({
        mensaje: "Ya registrado",
        fecha: yaRegistrado.fechaHora,
        estado: yaRegistrado.estado
      });
    }

    const dia = fecha.toLocaleString('es-MX', { weekday: 'long' });
    const minutosActual = fecha.getHours() * 60 + fecha.getMinutes();

    let estado = "Falta";

    grupo.horarios.forEach(h => {
      if (h.dia.toLowerCase() === dia.toLowerCase()) {
        const [hi, mi] = h.horaInicial.split(':');
        const [hf, mf] = h.horaFinal.split(':');

        const inicio = parseInt(hi) * 60 + parseInt(mi);
        const fin = parseInt(hf) * 60 + parseInt(mf);

        if (minutosActual >= inicio && minutosActual <= inicio + h.tolerancia) {
          estado = "asistencia";
        } else if (minutosActual > inicio + h.tolerancia && minutosActual <= fin) {
          estado = "retardo";
        }
      }
    });

    const nueva = new Asistencia({
      alumnoId,
      materiaId,
      dipositivoId,
      fechaHora: fecha,
      estado
    });

    await nueva.save();

    res.json({
      fecha: fecha,
      estado
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/consulta', async (req, res) => {
  try {
    const { apikey } = req.body;

    const usuario = await Usuario.findOne({ apikey });
    if (!usuario) {
      return res.status(401).json({ error: "APIKEY inválida" });
    }

    const asistencias = await Asistencia.find();

    const resultado = [];

    for (let a of asistencias) {
      const grupo = await Grupo.findById(a.materiaId);

      resultado.push({
        fecha: a.fechaHora,
        estado: a.estado,
        materia: grupo ? grupo.materia : "Desconocida"
      });
    }

    res.json(resultado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;