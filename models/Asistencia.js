const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  alumnoId: String,
  materiaId: String,
  dipositivoId: String,
  fechaHora: Date,
  estado: String
});

module.exports = mongoose.model('Asistencia', schema);