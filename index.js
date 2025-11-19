const express = require("express");
const session = require('express-session');
const passport = require('passport');
const sequelize = require("./database");
const Routes = require("./src/main_routes");
const cors = require("cors");
require("dotenv").config();
const sessionSecret = process.env.SESSION_SECRET || 'dev_default_change_me';
if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET no está configurada. Usando un valor por defecto inseguro. Configure SESSION_SECRET en .env o en la configuración de PM2 para producción.');
}

const app = express();
const PORT = process.env.PORT || 3000;
const morgan = require("morgan");

app.use(morgan("dev"))
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Configurar CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ["http://localhost:3000", "http://localhost:4173", "https://admin.polarisgestion.com"];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usar las rutas principales
app.use(Routes);

app.get("/", (req, res) => {  
  res.redirect("https://polarisgestion.com/");

});

// Sincroniza la base de datos y empieza el servidor
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a la base de datos:", error);
  });
