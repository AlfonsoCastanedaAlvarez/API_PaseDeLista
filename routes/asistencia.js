const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Asistencia = require('../models/Asistencia');
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

// GET /api/asistencia?apikey=XXX — obtener todas las asistencias
router.get('/', validarApiKey, async (req, res) => {
  try {
    const asistencias = await Asistencia.find();

    const resultado = [];
    for (let a of asistencias) {
      const grupo = await Grupo.findById(a.materiaId);
      resultado.push({
        _id: a._id,
        alumnoId: a.alumnoId,
        materiaId: a.materiaId,
        materia: grupo ? grupo.materia : "Desconocida",
        dipositivoId: a.dipositivoId,
        fechaHora: a.fechaHora,
        estado: a.estado
      });
    }

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/asistencia/:id?apikey=XXX — obtener una asistencia por ID
router.get('/:id', validarApiKey, async (req, res) => {
  try {
    const asistencia = await Asistencia.findById(req.params.id);
    if (!asistencia) {
      return res.status(404).json({ error: "Asistencia no encontrada" });
    }
    const grupo = await Grupo.findById(asistencia.materiaId);
    res.json({
      _id: asistencia._id,
      alumnoId: asistencia.alumnoId,
      materiaId: asistencia.materiaId,
      materia: grupo ? grupo.materia : "Desconocida",
      dipositivoId: asistencia.dipositivoId,
      fechaHora: asistencia.fechaHora,
      estado: asistencia.estado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/asistencia/alumno/:alumnoId?apikey=XXX — obtener asistencias por alumno
router.get('/alumno/:alumnoId', validarApiKey, async (req, res) => {
  try {
    const asistencias = await Asistencia.find({ alumnoId: req.params.alumnoId });

    const resultado = [];
    for (let a of asistencias) {
      const grupo = await Grupo.findById(a.materiaId);
      resultado.push({
        _id: a._id,
        alumnoId: a.alumnoId,
        materiaId: a.materiaId,
        materia: grupo ? grupo.materia : "Desconocida",
        dipositivoId: a.dipositivoId,
        fechaHora: a.fechaHora,
        estado: a.estado
      });
    }

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/asistencia/materia/:materiaId?apikey=XXX — obtener asistencias por materia
router.get('/materia/:materiaId', validarApiKey, async (req, res) => {
  try {
    const asistencias = await Asistencia.find({ materiaId: req.params.materiaId });

    const grupo = await Grupo.findById(req.params.materiaId);

    const resultado = asistencias.map(a => ({
      _id: a._id,
      alumnoId: a.alumnoId,
      materiaId: a.materiaId,
      materia: grupo ? grupo.materia : "Desconocida",
      dipositivoId: a.dipositivoId,
      fechaHora: a.fechaHora,
      estado: a.estado
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/asistencia — registrar asistencia
router.post('/', async (req, res) => {
  try {
    const { apikey, alumnoId, materiaId, dipositivoId, fechaHora } = req.body;

    // ✅ CHECK IDEMPOTENTE — la apikey es el token único
    const existeAsistencia = await Asistencia.findOne({ apikey, alumnoId, materiaId });

    if (existeAsistencia) {
      return res.status(208).json({
        message: "Asistencia ya registrada",
        fecha: existeAsistencia.fechaHora,
        estado: existeAsistencia.estado
      });
    }

    // Validar apikey
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
      apikey,
      alumnoId,
      materiaId,
      dipositivoId,
      fechaHora: fecha,
      estado
    });

    await nueva.save();

    return res.status(201).json({
      fecha: fecha,
      estado
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/asistencia/consulta — mantiene compatibilidad con versión anterior
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