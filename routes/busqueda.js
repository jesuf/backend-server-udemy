var express = require('express');
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');


// ===============================
// Busqueda por coleccion
// ===============================
app.get('/coleccion/:coleccion/:termino', (req, res, next) => {

    // recogemos el termino de la url y creamos una expresion regular para cualquier cosa que contenga eso y sea case insensitive
    var termino = req.params.termino;
    var regex = new RegExp(termino, 'i');

    // recogemos el nombre de la coleccion en la que queremos buscar
    var coleccion = req.params.coleccion;

    // seleccionamos una promesa segun la coleccion
    var promesa;
    switch(coleccion){
        case 'hospitales':
            promesa = buscarHospitales(regex);
            break;
        case 'medicos':
            promesa = buscarMedicos(regex);
            break;
        case 'usuarios':
            promesa = buscarUsuarios(regex);
            break;
        default:
            return res.status(400).json({
                ok: false,
                mensaje: "La colección no existe. Prueba con usuarios, medicos u hospitales."
            });
    }

    promesa.then(
        respuesta => {
            res.status(200).json({
                ok: true,
                [coleccion]: respuesta,
                total: respuesta.length
            });
        },
        error => {
            return res.status(500).json({
                ok: false,
                mensaje: "Error realizando la búsqueda.",
                error
            });
        }
    );        
});

// ===============================
// Busqueda general
// ===============================
app.get('/todo/:termino', (req, res, next) => {

    // recogemos el termino de la url y creamos una expresion regular para cualquier cosa que contenga eso y sea case insensitive
    var termino = req.params.termino;
    var regex = new RegExp(termino, 'i');

    // ejecutamos las busquedas en promesas y cuando ambas se hayan resuelto, recogemos las respuestas en un array
    Promise.all([
        buscarHospitales(regex),
        buscarMedicos(regex),
        buscarUsuarios(regex)
    ]).then(
        respuestas => {
            res.status(200).json({
                ok: true,
                hospitales: respuestas[0],
                medicos: respuestas[1],
                usuarios: respuestas[2],
                total: respuestas[0].length + respuestas[1].length + respuestas[2].length
            });
        },
        errores => {
            return res.status(500).json({
                ok: false,
                mensaje: "Error realizando la búsqueda.",
                errores
            });
        }
    );        
});

function buscarHospitales(regex) {
    
    return new Promise((resolve, reject) => {

        Hospital.find({nombre: regex}, (error, hospitales) => {
            // error en la funcion find. Internal Server Error
            if (error) {
                reject(error);
            } else {
                resolve(hospitales);
            }
        }).populate('usuario', 'nombre email');
    });
}
function buscarMedicos(regex) {
    
    return new Promise((resolve, reject) => {

        Medico.find({nombre: regex}, (error, medicos) => {
            // error en la funcion find. Internal Server Error
            if (error) {
                reject(error);
            } else {
                resolve(medicos);
            }
        }).populate('usuario', 'name email').populate('hospital');
    });
}
function buscarUsuarios(regex) {
    
    return new Promise((resolve, reject) => {

        Usuario.find({}, 'nombre email', (error, usuarios) => {
            // error en la funcion find. Internal Server Error
            if (error) {
                reject(error);
            } else {
                resolve(usuarios);
            }
            // Para hacer un OR en la consulta usamos el metodo .or y pasamos un array de objetos con las propiedades que queramos buscar.
            // Cada objeto puede tener varias propiedades pero en ese caso se buscan como un AND
        }).or([{nombre: regex}, {email: regex}]);
    });
}

module.exports = app;