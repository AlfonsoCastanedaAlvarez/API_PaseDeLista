require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongo conectado"))
.catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send("API funcionando");
});

app.use('/api', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/grupos', require('./routes/grupos'));
app.use('/api/asistencia', require('./routes/asistencia'));

app.listen(process.env.PORT, () => {
  console.log("Servidor corriendo");
});