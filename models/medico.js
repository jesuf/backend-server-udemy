var mongoose = require('mongoose');

var medicoSchema = new mongoose.Schema({
    nombre:	{type: String, required: [true, 'El nombre es necesario']},
    img: {type: String},
    usuario: {type:	mongoose.Schema.Types.ObjectId, ref:'usuario', required: true},
    hospital: {type: mongoose.Schema.Types.ObjectId, ref:'hospital', required: [true, 'El id del hospital es necesario']}
});

module.exports = mongoose.model('medico', medicoSchema);