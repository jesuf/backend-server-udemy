var SECRET = '@secretkey@tiene-que-ser-dificil';
module.exports = SECRET;

// esto es lo mismo pero mandandolo como una propiedad
// en el archivo donde lo vamos a usar habria que requerirlo accediendo a ella
// var SECRET = require('../config/config').SECRET;
//module.exports.SECRET = '@secretkey@tiene-que-ser-dificil';