var express = require('express');
var bcrypt = require('bcryptjs');
var verificarToken = require('../middlewares/autenticacion');

var app = express();

// Recuperamos el modelo Usuario
var Usuario = require('../models/usuario');

// ===============================
// Obtener todos los usuarios
// ===============================
app.get('/', (req, res) => {

    // convertimos a number la query desde o establecemos a 0 si no viene valor
    var desde = Number(req.query.desde || 0);
    

    // usamos el modelo para filtrar la respuesta
    Usuario.find({/* filtramos registros aqui */}, /* filtramos campos aqui */'nombre email img role', (error, usuarios) => {
        // error en la funcion find. Internal Server Error
        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error buscando usuarios.",
                ...error
            });
        }

        // recogemos el número de documentos de la colección
        Usuario.countDocuments({}, (error, total) => {
            res.status(200).json({
                ok: true,
                usuarios,
                total
            });
        });
        
        // nos saltamos el numero desde y limitamos a 5 los resultados
        // con esto conseguimos realizar una paginación mandando 5 más cada vez en el desde
    }).skip(desde).limit(5);
});
// GET no requiere validacion de token, aunque podriamos requerirla pero no es tan necesario ya que no se realizan cambios sobre la BD


// ===============================
// Middleware verificar token
// ===============================

/* Así sería si tuvieramos el código tal cual plastado en cada archivo de rutas que queremos verificar con token,
   pero como vamos a hacer verificacion en varios sitios, es mejor abstraerlo

var jwt = require('jsonwebtoken');
var SECRET = require('../config/config');

// el token vendra en la url pero no podemos recogerlo directamente como haciamos con la id en PUT y DELETE (seria '/:token')
// puesto que queremos que aunque no venga token, siempre se verifique y si lo recogemos por url y no viene, no entraria en el middleware
// En cambio, lo recogeremos como un parametro de query (seria '?token='), y venga token o no, entrara en la verificacion.
app.use('/', (req, res, next) => {
    var token = req.query.token;

    jwt.verify(token, SECRET, (error, decoded) => {
        // error en la verificacion. Unauthorized
        if(error) {
            return res.status(401).json({
                ok: false,
                mensaje: "Error verificando el token.",
                ...error
            });
        }
        // si no hubo error, next hace que el codigo continue ejecutandose, es decir, 
        // que pasaremos a revisar las peticiones PUT, POST y DELETE
        // en un callback de peticion siempre se debe enviar una respuesta o un next para que busque la respuesta mas adelante
        // si no, la peticion se queda colgando
        next();
    });
});
*/

// ===============================
// Crear un usuario nuevo
// ===============================
app.post('/', (req, res) => {
    
    // recogemos el cuerpo de la peticion ya parseado
    var body = req.body;
    
    // encriptamos la contraseña de forma indesencriptable con la libreria bcrypt
    body.password = bcrypt.hashSync(body.password, 10);

    // creamos una instancia de usuario a partir del modelo Usuario pasando un objeto cuyos campos deben
    // coincidir con los establecidos en el esquema usuarioSchema en usuario.js
    // si alguno de los campos no se puede rellenar y es requerido, tampoco será válido y la respuesta soltará un error
    var usuario = new Usuario(
        // 3 formas de hacer lo mismo:
        // pasando un nuevo objeto con las propiedades adecuadas y sus valores sacados de body
        // pasando un nuevo objeto con las propidades de body directamente ya que tienen el mismo nombre, ...body
        // pasando body que ya es un objeto con las propiedades que queremos por lo que es redundante crear otro. Además,
        // aunque el objeto contenga más propiedades, solo se tienen en cuenta las que coinciden con las del modelo,
        // las demás se descartan
        //{
            /* nombre: body.nombre,
            email: body.email,
            password: body.password,
            img: body.img,
            role: body.role */
            //...body
        //}
        body
    );

    usuario.save((error, usuarioCreado) => {
        // error de la funcion save que se debe a que los datos recibidos no sirven para crear un nuevo usuario. Bad Request
        if(error) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error creando usuario. Algún dato no es válido.",
                ...error
            });
        }

        // cambiamos la contraseña para que no se muestre en la respuesta con el resto de datos
        // tambien se podria componer un cuerpo con las propiedades especificas que queremos mostrar y omitir la propiedad password
        // pero asi es mas corto
        usuarioCreado.password = 'contraseña';
        
        res.status(201).json({
            ok: true,
            usuarioCreado: usuarioCreado,

            // recibimos esta propiedad del primer callback cuando verificamos el token
            usuarioAccion: req.usuario
        });
    });    
});

// ===============================
// Actualizar un usuario
// ===============================
app.put('/:id', verificarToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (error, usuario) => {
        // este es el error de la funcion findById. Internal Server Error
        // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
        // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
        if(error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error buscando usuario.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un usuario vacio porque no coincide ninguna id. Bad Request
        if(!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un usuario con la id especificada.",
                error: {message: "No existe un usuario con la id especificada."}
            });
        }

        // creamos una nueva instancia de Usuario pasando los datos del recogido para poderlos mostrar en la respuesta junto con los nuevos
        var usuarioViejo = new Usuario(usuario);
        // establecemos los datos recibidos en el usuario existente
        usuario.nombre = body.nombre;
        usuario.email = body.email;

        usuario.save((error, usuarioActualizado) => {
            // error de la funcion save que se debe a que los datos recibidos no sirven para actualizar un usuario. Bad Request
            if(error) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error actualizando usuario. Algún dato no es válido.",
                    ...error
                });
            }

            // cambiamos las contraseñas para que no se muestren en la respuesta con el resto de datos
            usuarioActualizado.password = usuarioViejo.password = 'contraseña';
            
            res.status(200).json({
                ok: true,
                usuarioViejo: usuarioViejo,
                usuarioActualizado: usuarioActualizado,

                // recibimos esta propiedad del primer callback cuando verificamos el token
                usuarioAccion: req.usuario
            });
        });    
        
    });
});
// ===============================
// Eliminar un usuario
// ===============================
app.delete('/:id', verificarToken, (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndDelete(id, (error, usuarioBorrado) => {

        // error en la funcion findByIdAndDelete. Internal Server Error
        // puede ser porque la id no cumpla las reglas de id de la bd en mongo 
        // (menos o mas caracteres, espacios, simbolos raros, etc) u otras razones
        if(error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error eliminando usuario.",
                ...error
            });
        }
        // este es el caso de que la funcion devuelva un usuario vacio porque no coincide ninguna id. Bad Request
        if(!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un usuario con la id especificada.",
                error: {message: "No existe un usuario con la id especificada."}
            });
        }

        // cambiamos la contraseña para que no se muestre en la respuesta con el resto de datos
        usuarioBorrado.password = 'contraseña';
        
        res.status(200).json({
            ok: true,
            usuarioEliminado: usuarioBorrado,

            // recibimos esta propiedad del primer callback cuando verificamos el token
            usuarioAccion: req.usuario
        });
    });

});

module.exports = app;