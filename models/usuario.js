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

module.exports = mongoose.model('Usuario', usuarioSchema);