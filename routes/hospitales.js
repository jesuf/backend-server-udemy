var express = require('express');
var verificarToken = require('../middlewares/autenticacion');

var app = express();

// Recuperamos el modelo Hospital
var Hospital = require('../models/hospital');

// ===============================
// Obtener todos los hospitales
// ===============================
app.get('/', (req, res) => {

    // convertimos a number la query desde o establecemos a 0 si no viene valor
    var desde = Number(req.query.desde || 0);

    Hospital.find({}, (error, hospitales) => {
        // error en la funcion find. Internal Server Error
        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error buscando hospitales.",
                ...error
            });
        }

        // recogemos el número de documentos de la colección que en realidad seria lo mismo que acceder directamente a hospitales.length
        Hospital.countDocuments({}, (error, total) => {
            res.status(200).json({
                ok: true,
                hospitales,
                total
            });
        });
        // nos saltamos el numero desde y limitamos a 5 los resultados
        // con esto conseguimos realizar una paginación mandando 5 más cada vez en el desde
    }).skip(desde).limit(5)
    // podemos sacar todos los campos (o los que queramos) de los campos definidos como ids de otras colecciones
    .populate('usuario', 'nombre email');
});

// ===============================
// Crear un hospital nuevo
// ===============================
app.post('/', verificarToken, (req, res) => {
    
    // recogemos el cuerpo de la peticion ya parseado
    var body = req.body;

    // creamos una instancia de hospital
    var hospital = new Hospital({
        ...body,
        usuario: req.usuario._id
    });

    hospital.save((error, hospitalCreado) => {
        // error de la funcion save que se debe a que los datos recibidos no sirven para crear un nuevo hospital. Bad Request
        if(error) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error creando médico. Algún dato no es válido.",
                ...error
            });
        }
       
        res.status(201).json({
            ok: true,
            hospitalCreado,
            // recibimos esta propiedad del primer callback cuando verificamos el token
            usuarioAccion: req.usuario
        });
    });    
});

// ===============================
// Actualizar un hospital
// ===============================
app.put('/:id', verificarToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (error, hospital) => {
        // este es el error de la funcion findById. Internal Server Error
        // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
        // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
        if(error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error buscando hospital.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un hospital vacio porque no coincide ninguna id. Bad Request
        if(!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un hospital con la id especificada.",
                error: {message: "No existe un hospital con la id especificada."}
            });
        }

        // creamos una nueva instancia de Hospital pasando los datos del recogido para poderlos mostrar en la respuesta junto con los nuevos
        var hospitalViejo = new Hospital(hospital);
        // establecemos los datos recibidos en el hospital existente
        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save((error, hospitalActualizado) => {
            // error de la funcion save que se debe a que los datos recibidos no sirven para actualizar un hospital. Bad Request
            if(error) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error actualizando hospital. Algún dato no es válido.",
                    ...error
                });
            }
            
            res.status(200).json({
                ok: true,
                hospitalViejo: hospitalViejo,
                hospitalActualizado: hospitalActualizado,
                // recibimos esta propiedad del primer callback cuando verificamos el token
                usuarioAccion: req.usuario
            });
        });    
        
    });
});
// ===============================
// Eliminar un hospital
// ===============================
app.delete('/:id', verificarToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndDelete(id, (error, hospitalBorrado) => {

        // error en la funcion findByIdAndDelete. Internal Server Error
        // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
        // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
        if(error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error eliminando hospital.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un hospital vacio porque no coincide ninguna id. Bad Request
        if(!hospitalBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un hospital con la id especificada.",
                error: {message: "No existe un hospital con la id especificada."}
            });
        }
        
        res.status(200).json({
            ok: true,
            hospitalBorrado,
            // recibimos esta propiedad del primer callback cuando verificamos el token
            usuarioAccion: req.usuario
        });
    });

});

module.exports = app;