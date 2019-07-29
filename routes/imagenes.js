var express = require('express');
var fs = require('fs');
var pathHelper = require('path');

var app = express();

app.get('/:coleccion/:img', (req, res) => {

    var img = req.params.img;

    // comprobamos el tipo de coleccion
    var coleccion = req.params.coleccion;
    var coleccionesPermitidas = ['hospitales', 'medicos', 'usuarios'];

    if(coleccionesPermitidas.indexOf(coleccion) < 0){
        return res.status(400).json({
            ok: false,
            mensaje: 'Colección no válida. Pruebe con ' + coleccionesPermitidas.join(', ')
        });
    }

    // necesitamos la ruta entera del archivo para enviarla por sendFile y esto puede variar según donde estemos corriendo el servidor
    // __dirname retorna la ruta absoluta del directorio en el que estamos, routes
    // resolve() interpreta las cadenas que se le pasan, subiendo un piso si le ponemos ..
    // y poniendo \ (windows) en lugar de / (otros SO) si es necesario, segun el SO del servidor
    var pathImagen = pathHelper.resolve(__dirname, '../uploads/' + coleccion + '/' + img);

    if(!fs.existsSync(pathImagen)){
        pathImagen = pathHelper.resolve(__dirname, '../assets/no-img.jpg');
    }
    res.sendFile(pathImagen, error => error);
});

module.exports = app;