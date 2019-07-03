var mongoose = require('mongoose');

var hospitalSchema = new mongoose.Schema(
    {
        nombre:	{type: String, required: [true, 'El nombre es necesario']},
        img: {type: String},
        usuario: {type:	mongoose.Schema.Types.ObjectId, ref:'usuario', required: true},
    },
    // en este caso es necesario definir que la colección es 'hospitales' en español puesto que si no, interpreta que
    // 'hospital' está en ingles y trata de asignar la colección 'hospitals'.
    {collection: 'hospitales'}
); 

module.exports = mongoose.model('hospital', hospitalSchema);