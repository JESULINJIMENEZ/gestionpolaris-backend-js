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
  res.send(`
    <html>
      <head>
        <style>
          body {
            margin: 0;
            height: 100vh;
            overflow: hidden;
            background: black;
            color: #00eaff;
            font-family: Arial, sans-serif;
          }

          /* Fondo de estrellas */
          .stars {
            width: 100%;
            height: 100%;
            background: url("https://www.transparenttextures.com/patterns/stardust.png");
            animation: moveStars 20s linear infinite;
            position: absolute;
            top: 0; left: 0;
            z-index: -1;
          }

          @keyframes moveStars {
            from { background-position: 0 0; }
            to { background-position: -1000px 1000px; }
          }

          /* OVNI animado */
          .ovni {
            font-size: 80px;
            position: absolute;
            animation: fly 6s ease-in-out infinite;
          }

          @keyframes fly {
            0%   { top: 10%; left: 10%; transform: rotate(0deg); }
            25%  { top: 40%; left: 70%; transform: rotate(20deg); }
            50%  { top: 80%; left: 50%; transform: rotate(-10deg); }
            75%  { top: 30%; left: 20%; transform: rotate(10deg); }
            100% { top: 10%; left: 10%; transform: rotate(0deg); }
          }

          marquee {
            font-size: 28px;
            position: absolute;
            bottom: 20px;
            width: 100%;
          }
        </style>
      </head>

      <body>
        <div class="stars"></div>

        <div class="ovni">🛸</div>

        <marquee>Bienvenido a la API de Polaris Gestión. Visite nuestro sitio web para más información.</marquee>
      </body>
    </html>
  `);
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
