var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SECRET = require('../config/config').SECRET;

var app = express();

// Recuperamos el modelo Usuario
var Usuario = require('../models/usuario');


// Creamos una instancia de OAuth2Client mediante la librería instalada como paquete de node y la clave de nuestra app
var CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);


// ====================================
// Autenticación con Google Sign In
// ====================================
// Async hace que esta función devuelva una Promesa cuyo valor devuelto en el resolve sería el return
// Esto es útil porque así podemos usar await para se realice de forma síncrona, es decir, que el programa no avance
// hasta que la promesa se resuelva. Await solo se puede utilizar dentro de funciones con async.
async function verify(token, res){
    var ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID // si múltiples apps acceden el backend se especifiarían sus CLIENT_ID en un array:
                            // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3, etc]
    }).catch(error => 
        // error en la verificacion. Unauthorized (o mas bien Unauthenticated)
        // el 401 se usa cuando falla la autenticación o el usuario necesita autenticarse
        // y el 403 (Forbidden) para cuando el usuario está autenticado pero aun asi no tiene permiso para ejecutar la solicitud
        res.status(401).json({
            ok: false,
            mensaje: "Error verificando el token.",
            error
        })
    );
    var payload = ticket.getPayload();
    //var userId = payload.sub;

    console.log(payload);
    
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    };
}

app.post('/google', async (req, res) => {
    var token = req.body.token;
    // resolvemos la función verify(token) y grabamos el valor (que sería lo obtenido en .then() en googleUser)
    // es necesario recoger el reject en un catch ya que no podemos usar el onReject propiamente
    var googleUser = await verify(token, res);

    Usuario.findOne({email: googleUser.email}, (error, usuario) => {
        // error en la funcion findOne. Internal Server Error
        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario.",
                ...error
            });
        }
        // si el usuario no existe en nuestra BD hay que crearlo
        if (!usuario) {
            var nuevoUsuario = new Usuario({
                ...googleUser,
                // nuestro usuario en la BD necesita una contraseña al ser un usuario de google no necesitamos guardar la real
                password: 'contraseña' 
            });

            nuevoUsuario.save((error, usuarioCreado) => {
                // error de la funcion save que se debe a que los datos recibidos no sirven para crear un nuevo usuario. Bad Request
                // como los datos vienen de un usuario de google, en realidad este error nunca debería suceder pero nunca esta de mas
                if(error) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: "Error creando usuario. Algún dato no es válido.",
                        ...error
                    });
                }

                // Crear un Json Web Token mediante un payload, un secret y unas opciones
                var token = jwt.sign({usuario: usuarioCreado}, SECRET, {expiresIn: 14400 /* 4horas */});
                
                return res.status(200).json({
                    ok: true,
                    usuarioCreado,
                    token
                });
            });
        } else {
            // si el usuario ya estaba registrado en la BD, comprobamos si es un usuario de google o normal
            // y si es normal lo mandamos autenticar por el método normal
            if(usuario.google){
                var expira = 14400;
                // Crear un Json Web Token mediante un payload, un secret y unas opciones
                var token = jwt.sign({usuario: usuario}, SECRET, {expiresIn: expira /* 4horas */});
                    
                res.status(200).json({
                    ok: true,
                    usuario,
                    token,
                    expira
                });
            }else{
                return res.status(400).json({
                    ok: false,
                    mensaje: "Debe autenticarse usando el método normal.",
                    ...error
                });
            }
        }
    });
});

// ====================================
// Autenticación normal
// ====================================
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
        var expira = 14400;
        // Crear un Json Web Token mediante un payload, un secret y unas opciones
        var token = jwt.sign({usuario: usuario}, SECRET, {expiresIn:expira /* 4horas */});
        
        res.status(200).json({
            ok: true,
            usuario,
            token,
            expira
        });
    });
});




module.exports = app;