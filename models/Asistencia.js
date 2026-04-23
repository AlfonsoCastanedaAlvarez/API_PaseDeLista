const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  apikey: String,       // ← actúa como token de idempotencia
  alumnoId: String,
  materiaId: String,
  dipositivoId: String,
  fechaHora: Date,
  estado: String
});

module.exports = mongoose.model('Asistencia', schema);