var express = require('express');
var fileUpload = require('express-fileupload');
//var verificarToken = require('../middlewares/autenticacion');

// importamos el file sytem que viene ya incluido en node
var fs = require('fs');

var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');

var app = express();

// default options
app.use(fileUpload());

app.put('/:coleccion/:id'/* , verificarToken */, (req, res) => {

    // vemos si hay algun archivo en la peticion
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No seleccionó ningún fichero.'
        });
    }

    // comprobamos el tipo de coleccion
    var coleccion = req.params.coleccion;
    var coleccionesPermitidas = ['hospitales', 'medicos', 'usuarios'];

    if(coleccionesPermitidas.indexOf(coleccion) < 0){
        return res.status(400).json({
            ok: false,
            mensaje: 'Colección no válida. Pruebe con ' + coleccionesPermitidas.join(', ')
        });
    }

    // recogemos el tipo de la imagen
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var tipoImagen = nombreCortado[nombreCortado.length-1];

    // comprobamos el tipo de archivo
    var tiposPermitidos = ['png', 'jpeg', 'gif', 'jpg'];

    if(tiposPermitidos.indexOf(tipoImagen) < 0){
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida. Pruebe con ' + tiposPermitidos.join(', ')
        });
    }

    // creamos un nombre de imagen basado en la id del documento para el que se sube, una fecha irrepetible y el tipo del archivo
    nombreImagen = `${req.params.id}-${new Date().getMilliseconds()}.${tipoImagen}`;

    // movemos el fichero a una ruta del servidor (como este archivo se acaba ejecutando en el app.js, empezamos la ruta con un punto)
    var path = `./uploads/${coleccion}/${nombreImagen}`;
    archivo.mv(path, error => {
        if (error){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                error
            });
        }

        subirPorColeccion(coleccion, req.params.id, nombreImagen, res);
    });
});

function subirPorColeccion(coleccion, id, nombreImagen, res) {
    var Modelo;
    if(coleccion === 'usuarios'){
        Modelo = Usuario;
    }
    if(coleccion === 'hospitales'){
        Modelo = Hospital;
    }
    if(coleccion === 'medicos'){
        Modelo = Medico;
    }

    // habria que enviar bien todos los errores pero ya lo hemos hecho en otros sitios y no aprendere nada nuevo, es un rollo xD
    Modelo.findById(id, (error, documento) => {
        if(error) {
            return res.status(400).send(error);
        }

        var pathViejo = './uploads/' + coleccion + '/' + documento.img;
        // si existe elimina la imagen anterior
        if(fs.existsSync(pathViejo)){
            fs.unlink(pathViejo, error => error);
        }
        // establecemos el nombre de la nueva imagen en el documento de la coleccion
        documento.img = nombreImagen;

        // guardamos el documento con la nueva imagen
        documento.save((error, documentoActualizado) => {
            if(error){
                return res.status(400).send(error);
            } 

            // si es un usuario, no queremos mostrar su contraseña
            if(documentoActualizado.password){
                documentoActualizado.password = "contraseña";
            }
                
            res.status(200).json({
                ok: true,
                mensaje: "Imagen de " + Modelo.modelName + " actualizada con éxito.",
                [Modelo.modelName]: documentoActualizado
            });
        });
    });
}

module.exports = app;