var jwt = require('jsonwebtoken');
var SECRET = require('../config/config').SECRET;

// Abstraemos la funcion de callback que de la otra forma se llamaba cuando la peticion coincidia con la ruta
// Asi podemos pasarla como parámetro en cada peticion concreta, PUT, POST y DELETE para que se ejecute antes del otro callback
// es decir, primero pasamos por aqui, y cuando terminamos, se ejecuta el cuerpo de peticion o logica de controlador, que es el segundo callback
var verificarToken = (req, res, next) => {
    var token = req.query.token;

    jwt.verify(token, SECRET, (error, decodedToken) => {
        // error en la verificacion. Unauthorized (o mas bien Unauthenticated)
        // el 401 se usa cuando falla la autenticación o el usuario necesita autenticarse
        // y el 403 para cuando el usuario está autenticado pero aun asi no tiene permiso para ejecutar la solicitud
        if(error) {
            return res.status(401).json({
                ok: false,
                mensaje: "Error verificando el token.",
                ...error
            });
        }
        // recordemos que al token le metimos un objeto con la propiedad usuario que ahora podemos recoger y añadir a nuestro objeto request
        // el cual se vuelve a recoger como parametro en el segundo callback
        req.usuario = decodedToken.usuario;
        // en un callback de peticion siempre se debe enviar una respuesta o ejecutar next para que busque la respuesta mas adelante
        // si no, la peticion se queda colgando
        next();
    });
};
module.exports = verificarToken;