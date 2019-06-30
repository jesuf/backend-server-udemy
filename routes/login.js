var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SECRET = require('../config/config');

var app = express();

// Recuperamos el modelo Usuario
var Usuario = require('../models/usuario');

app.post('/', (req, res) => {

    // recogemos el cuerpo de la peticion ya parseado
    var body = req.body;
    
    // enviamos un objeto con las propiedades tal cual queremos que compruebe con el modelo y sus valores
    // y obtenemos una unica posible instancia de usuario puesto que el email es unico
    Usuario.findOne({email: body.email}, (error, usuario) => {
        // error en la funcion findOne. Internal Server Error
        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un usuario vacio porque no coincide ningun email. Bad Request
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: "La cuenta no existe."
            });
        }
        // este es el caso de que la contraseña en la peticion y en el usuario no coinciden. Bad Request
        if (!bcrypt.compareSync(body.password, usuario.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Constraseña incorrecta."
            });
        }

        usuario.password = 'contraseña';
        // Crear un Json Web Token
        var token = jwt.sign({usuario: usuario}, SECRET, {expiresIn: 14400 /* 4horas */});
        
        res.status(200).json({
            ok: true,
            usuario,
            token
        });
    });
});




module.exports = app;