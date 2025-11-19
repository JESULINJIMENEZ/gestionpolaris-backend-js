const express = require("express");
const router = express.Router();
const User = require("../../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateRequired = require("../../middleware/validateRequired");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;


router.post("/" , validateRequired(["email", "password"]), async (req, res) => {
    try {

        const { email, password } = req.body;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(401).json({ message: "Email incorrecto" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // Crear el token JWT con el id del usuario, username y rol_id
        const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, SECRET_KEY, { expiresIn: "1h" }
        );

        const rol = user.rol;
        return res.status(200).json({ token, user: { id: user.id, email: user.email, rol: rol } });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

router.post("/verify-token", async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });

        const payload = ticket.getPayload();
        const userid = payload["sub"];

        const user = await User.findOne({ where: { username: payload.email } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const newToken = jwt.sign({ id: user.id, username: user.username, rol: user.role }, SECRET_KEY, { expiresIn: "5h" }
        );

        const rol = user.role;

        return res.json.status(200)({
            token: newToken, rol, user: { id: user.id, username: user.username, email: user.email },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
