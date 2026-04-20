const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  materia: String,
  fechaInicio: Date,
  fechaFin: Date,
  horarios: [
    {
      dia: String,
      horaInicial: String,
      horaFinal: String,
      tolerancia: Number,
      corte: Number
    }
  ]
});

module.exports = mongoose.model('Grupo', schema, 'grupos');