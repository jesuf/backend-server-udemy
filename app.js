// Requires
var express = require('express');
var mongoose = require('mongoose');
var appRoutes = require('./routes/app');
var usuarioRoutes = require('./routes/usuarios');
var medicoRoutes = require('./routes/medicos');
var hospitalRoutes = require('./routes/hospitales');
var loginRoutes = require('./routes/login');
var busquedaRoutes = require('./routes/busqueda');
var uploadRoutes = require('./routes/upload');
var imgRoutes = require('./routes/imagenes');

// si no hacemos esto sale el error:
// DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.
mongoose.set('useCreateIndex', true);

// Inicializar variables
var app = express();


 /*Documentación: https://expressjs.com/es/guide/writing-middleware.html
 
Express es una infraestructura web de direccionamiento y middleware que tiene una funcionalidad mínima propia: 
una aplicación Express es fundamentalmente una serie de llamadas a funciones de middleware.

Las funciones de middleware son funciones que tienen acceso al objeto de solicitud (req), al objeto de respuesta (res) 
y a la siguiente función de middleware en el ciclo de solicitud/respuestas de la aplicación. 
La siguiente función de middleware se denota normalmente con una variable denominada next.

Las funciones de middleware pueden realizar las siguientes tareas:
- Ejecutar cualquier código.
- Realizar cambios en la solicitud y los objetos de respuesta.
- Finalizar el ciclo de solicitud/respuestas.
- Invocar la siguiente función de middleware en la pila.

Si la función de middleware actual no finaliza el ciclo de solicitud/respuestas, debe invocar next()
para pasar el control a la siguiente función de middleware. De lo contrario, la solicitud quedará colgada. */


// ===============================
// Middleware Parse
// ===============================
//
// si hay algo en el body de la peticion, el parse nos creara un objeto javascript (json) a partir del contenido, 
// revisando en este caso tanto el content-type application/x-www-form-urlencoded como el
// content-type application/json del header
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// npm install serve-index
// este modulo permite acceder a un indice de los archivos que tenemos subidos en determinada carpeta e incluso añade un buscador
/* var serveIndex = require('serve-index');
app.use(express.static(__dirname + '/'))
app.use('/uploads', serveIndex(__dirname + '/uploads')); */

// ===============================
// Middleware Rutas
// ===============================
//
// cuando cualquier peticion coincida con la ruta especificada, hacemos que busque en el archivo de ruta correspondiente.
// las mas restrictivas deben ir primero porque si no siempre entrararia primero en la mas general y buscaria alli una ruta que coincida
// Por ejemplo si '/' estuviera delante de '/usuarios' al realizar una peticion sobre con /usuarios en la url, buscaria en el archivo appRoutes
// una ruta que contenga '/usuarios' y si no la encontrase, seguiria buscando fuera hasta llegar '/usuarios' que mandaria a usuarioRoutes
// por lo general no suele importar ya que '/' no va a contener rutas para las otras rutas aqui especificadas pero podria darse el caso
app.use('/medicos', medicoRoutes);
app.use('/hospitales', hospitalRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/login', loginRoutes); 
app.use('/busqueda', busquedaRoutes); 
app.use('/upload', uploadRoutes); 
app.use('/imagenes', imgRoutes); 
app.use('/', appRoutes);

// Conexión al servicio o daemon (mongod.exe) de la base de datos MongoDB (que ya deberia estar corriendo) mediante mongoose,
// que nos permitirá realizar cambios en ella, tal como si corriesemos mongo.exe e introdujesemos instrucciones en la consola
// pero teniendo las ventajas de mongoose: // esquemas, callbacks, etc. 
// En definitiva, mongoose es un ODM (Object Document Mapper) a traves del cual tambien podemos usar funciones middleware
// en sus esquemas para definir comportamientos antes y despues de realizar consultas sobre la BD mediante pre y post. https://mongoosejs.com/docs/middleware.html
mongoose.connect('mongodb://localhost:27017/hospitalDB', {useNewUrlParser: true}, (err) => {
    if(err) throw err;

    console.log('MongoDB corriendo en el puerto 27017: \x1b[36m%s\x1b[0m', 'online');

    // Iniciamos o ponemos a correr el servidor express, a la escucha de peticiones
    // Es mas correcto iniciar el servidor dentro de este callback, solo si la conexion con la base de datos se realizó correctamente.
    app.listen(3000, () => console.log('Express corriendo en el puerto 3000: \x1b[36m%s\x1b[0m', 'online'));
});

