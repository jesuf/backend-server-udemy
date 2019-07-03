var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var rolesValidos = {
    values: ['USER_ROLE', 'ADMIN_ROLE'],
    message: '{VALUE} no es un rol válido'
};

var usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: [true, 'El nombre es necesario.']},
    email: {type: String, unique: true, required: [true, 'El email es necesario.']},
    password: {type: String, required: [true, 'La contraseña es necesaria.']},
    img: {type: String},
    role: {type: String, required: true, default: 'USER_ROLE', enum: rolesValidos},
});

// {PATH} lee el campo del esquema. Esto es util cuando hay varios campos que son unicos
// en este caso con poner email en su lugar, sería suficiente
usuarioSchema.plugin(uniqueValidator, {message: 'El campo {PATH} es único.'});

// el nombre que le damos al modelo, debe coincidir con el nombre que le dimos a la tabla (coleccion)
// en la BD pero en singular y no es case sensitive
// así pues, el modelo definido como 'usuario'(o 'USUARIO' o 'Usuario') para el esquema usuarioSchema correspondería a la colección 'usuarios' en la BD
module.exports = mongoose.model('usuario', usuarioSchema);