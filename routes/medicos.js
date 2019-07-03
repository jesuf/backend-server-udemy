var express = require('express');
var verificarToken = require('../middlewares/autenticacion');

var app = express();

// Recuperamos el modelo Medico y Hospital, que necesitaremos para corroborar id
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// ===============================
// Obtener todos los medicos
// ===============================
app.get('/', (req, res) => {

    // convertimos a number la query desde o establecemos a 0 si no viene valor
    var desde = Number(req.query.desde || 0);

    Medico.find({}, 'nombre usuario hospital', (error, medicos) => {
        // error en la funcion find. Internal Server Error
        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error buscando medicos.",
                ...error
            });
        }
        // recogemos el número de documentos de la colección que en realidad seria lo mismo que acceder directamente a medicos.length
        Medico.countDocuments({}, (error, total) => {
            res.status(200).json({
                ok: true,
                medicos,
                total
            });
        });
        // nos saltamos el numero desde y limitamos a 5 los resultados
        // con esto conseguimos realizar una paginación mandando 5 más cada vez en el desde
    }).skip(desde).limit(5)
    // podemos sacar todos los campos (o los que queramos) de los campos definidos como ids de otras colecciones
    .populate('usuario', 'nombre email').populate('hospital');
});

// ===============================
// Crear un medico nuevo
// ===============================
app.post('/', verificarToken, (req, res) => {
    
    // recogemos el cuerpo de la peticion ya parseado
    var body = req.body;

    // tenemos que revisar que la id de hospital recibida corresponde a un hospital existente
    Hospital.findById(body.hospital, (error, hospital) => {
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

        // ahora si podemos continuar creando el medico

        // creamos una instancia de medico
        var medico = new Medico({
            ...body,
            usuario: req.usuario._id
        });

        medico.save((error, medicoCreado) => {
            // error de la funcion save que se debe a que los datos recibidos no sirven para crear un nuevo medico. Bad Request
            if(error) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error creando médico. Algún dato no es válido.",
                    ...error
                });
            }
        
            res.status(201).json({
                ok: true,
                medicoCreado,
                // recibimos esta propiedad del primer callback cuando verificamos el token
                usuarioAccion: req.usuario
            });
        });    
    });
});

// ===============================
// Actualizar un medico
// ===============================
app.put('/:id', verificarToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    // tenemos que revisar que la id de hospital recibida corresponde a un hospital existente
    Hospital.findById(body.hospital, (error, hospital) => {
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

        // ahora si podemos continuar actualizando el medico

        Medico.findById(id, (error, medico) => {
            // este es el error de la funcion findById. Internal Server Error
            // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
            // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
            if(error) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error buscando medico.",
                    ...error
                });
            }
            // este es el caso de que la funcion devuelva un medico vacio porque no coincide ninguna id. Bad Request
            if(!medico) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "No existe un medico con la id especificada.",
                    error: {message: "No existe un medico con la id especificada."}
                });
            }

            // creamos una nueva instancia de Medico pasando los datos del recogido para poderlos mostrar en la respuesta junto con los nuevos
            var medicoViejo = new Medico(medico);
            // establecemos los datos recibidos en el medico existente
            medico.nombre = body.nombre;
            medico.usuario = req.usuario._id;
            medico.hospital = body.hospital;

            medico.save((error, medicoActualizado) => {
                // error de la funcion save que se debe a que los datos recibidos no sirven para actualizar un medico. Bad Request
                if(error) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: "Error actualizando medico. Algún dato no es válido.",
                        ...error
                    });
                }
                
                res.status(200).json({
                    ok: true,
                    medicoViejo: medicoViejo,
                    medicoActualizado: medicoActualizado,
                    // recibimos esta propiedad del primer callback cuando verificamos el token
                    usuarioAccion: req.usuario
                });
            });    
            
        });
    });
});
// ===============================
// Eliminar un medico
// ===============================
app.delete('/:id', verificarToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndDelete(id, (error, medicoBorrado) => {

        // error en la funcion findByIdAndDelete. Internal Server Error
        // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
        // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
        if(error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error eliminando medico.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un medico vacio porque no coincide ninguna id. Bad Request
        if(!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un medico con la id especificada.",
                error: {message: "No existe un medico con la id especificada."}
            });
        }
        
        res.status(200).json({
            ok: true,
            medicoBorrado,
            // recibimos esta propiedad del primer callback cuando verificamos el token
            usuarioAccion: req.usuario
        });
    });

});

module.exports = app;