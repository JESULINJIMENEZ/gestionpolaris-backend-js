const express = require("express");
const router = express.Router();
const User = require("../../models/users");
const bcrypt = require("bcrypt");
require("dotenv").config();
const validator = require("validator");
const {Op} = require('sequelize');
const validateRequired = require("../../middleware/validateRequired");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;


const rolPermits = ['admin','logistica'];

//Create User
router.post("/", validateRequired(["name", "document", "email", "password", "rol"]), async (req, res) => {
    try {
        const { name, document, email, password, rol } = req.body;

        if (!name || !document || !email || !password || !rol) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        if (!rolPermits.includes(rol)) {
            return res.status(400).json({ message: "Rol inválido" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Email inválido" });
        }

        const existingUser = await User.findOne({
            where: {
                document: document
            }
        })

        if (existingUser) {
            return res.status(409).json({ message: "El usuario con este documento ya existe" });
        }

        const existingEmail = await User.findOne({
            where: {
                email: email
            }
        })

        if (existingEmail) {
            return res.status(409).json({ message: "El usuario con este email ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            document,
            email,
            password: hashedPassword,
            rol,
            status: true,
        });

        return res.status(201).json({ message: "Usuario creado exitosamente", userId: newUser.id });

    } catch (error) {
        console.log("Error al crear un usuario:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }

});

//Get all users with pagination
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Optional search parameters: name and/or document
        const name = req.query.name ? String(req.query.name).trim() : null;
        const documentParam = req.query.document ? String(req.query.document).trim() : null;

        // Build where clause only if search params provided.
        let where = {};
        if (name && documentParam) {
            where = {
                [Op.or]: [
                    { name: { [Op.like]: `%${name}%` } },
                    { document: { [Op.like]: `%${documentParam}%` } }
                ]
            };
        } else if (name) {
            where = { name: { [Op.like]: `%${name}%` } };
        } else if (documentParam) {
            where = { document: { [Op.like]: `%${documentParam}%` } };
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            limit: limit,
            offset: offset,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            users,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
            },
        });
        
    } catch (error) {
        console.log("Error al obtener los usuarios:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
})

//Get user by id
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;


        if (!validator.isInt(id, { min: 1 })) {
            return res.status(400).json({ message: "ID de usuario inválido" });
        }

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.status(200).json(user);
        
    } catch (error) {
        console.log("Error al obtener el usuario:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
})

//Update user by id
router.put("/:id", async (req, res) => {
    try {
        
        const { id } = req.params;
        const { name, email, status, phone, password } = req.body;
        
        if(req.body.rol){
            return res.status(400).json({ message: "No se puede actualizar el rol del usuario" });
        }

        if(req.body.document){
            return res.status(400).json({ message: "No se puede actualizar el documento del usuario" });
        }

        if (!validator.isInt(id, { min: 1 })) {
            return res.status(400).json({ message: "ID de usuario inválido" });
        }
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Email inválido" });
        }

        const existingEmail = await User.findOne({
            where: {
                email: email,
                id: { [Op.ne]: id }
            }
        })

        if (existingEmail) {
            return res.status(409).json({ message: "El usuario con este email ya existe" });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.email = email || user.email;
        user.status = status || user.status;

        await user.save();

        return res.status(200).json({ message: "Usuario actualizado exitosamente" });

    } catch (error) {
        console.log("Error al actualizar el usuario:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
})

//Delete user by id
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!validator.isInt(id, { min: 1 })) {
            return res.status(400).json({ message: "ID de usuario inválido" });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        await user.destroy();

        return res.status(200).json({ message: "Usuario eliminado exitosamente" });
        
    } catch (error) {
        console.log("Error al eliminar el usuario:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;