// Requires
var express = require('express');
var mongoose = require('mongoose');


// Inicializar variables
var app = express();

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/hospitalDB', (err) => {
    if(err) throw err;

    console.log('MongoDB corriendo en el puerto 27017 \x1b[36m%s\x1b[0m', 'online');
});


// Rutas
app.get('/', (req, res, next) => {
    res.status(200).json({
        ok: true,
        mensaje: "Petición realizada correctamente"
    });
});


// Escuchar peticiones
app.listen(3000, () => console.log('Express corriendo en el puerto 3000 \x1b[36m%s\x1b[0m', 'online'));