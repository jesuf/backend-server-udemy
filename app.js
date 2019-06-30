// Requires
var express = require('express');
var mongoose = require('mongoose');
var appRoutes = require('./routes/app');
var usuarioRoutes = require('./routes/usuarios');
var loginRoutes = require('./routes/login');

// si no hacemos esto sale el error:
// DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.
mongoose.set('useCreateIndex', true);

// Inicializar variables
var app = express();

// ===============================
// Middleware Parse
// ===============================
//
// si hay algo en el body de la peticion, el parse nos creara un objeto javascript (json) para que lo
// podamos usar en cualquier lugar
// principalmente en el metodo .post de las rutas, donde podemos recogerlo gracias a este parse
// si no, recibiriamos unknokn o algo asi
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({extended: false}));
// parse application/json
app.use(express.json());

// Importar rutas
// cuando cualquier peticion coincida con la ruta especificada, hacemos que busque en el archivo de ruta correspondiente
// las mas restrictivas deben ir primero porque si no siempre entrararia primero en la mas general y buscaria alli una ruta que coincida
// Por ejemplo si '/' estuviera delante de '/usuarios' al realizar una peticion sobre con /usuarios en la url, buscaria en el archivo appRoutes
// una ruta que contenga '/usuarios' y si no la encontrase, seguiria buscando fuera hasta llegar '/usuarios' que mandaria a usuarioRoutes
// por lo general no suele importar ya que '/' no va a contener rutas para las otras rutas aqui especificadas pero podria darse el caso
app.use('/usuarios', usuarioRoutes);
app.use('/login', loginRoutes);
app.use('/', appRoutes);

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/hospitalDB', {useNewUrlParser: true}, (err) => {
    if(err) throw err;

    console.log('MongoDB corriendo en el puerto 27017: \x1b[36m%s\x1b[0m', 'online');
});

// Iniciamos la escucha de peticiones
app.listen(3000, () => console.log('Express corriendo en el puerto 3000: \x1b[36m%s\x1b[0m', 'online'));