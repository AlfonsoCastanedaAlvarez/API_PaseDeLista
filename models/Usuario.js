const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  usuario: String,
  contrasenia: String,
  apikey: String,
  fechaDeEpiracion: Date
});

module.exports = mongoose.model('Usuario', schema);