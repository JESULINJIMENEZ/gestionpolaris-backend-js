const User = require("../models/users");
const UserInfo = require("../models/user_info");
const bcrypt = require("bcrypt");
const sequelize = require('../../database');
require("dotenv").config();
const validator = require("validator");
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;


const rolPermits = ['admin', 'logistica', 'lider', 'votante'];

// Get all users with pagination
async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const name = req.query.name ? String(req.query.name).trim() : null;
    const documentParam = req.query.document ? String(req.query.document).trim() : null;

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
}

// Get user by id
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    if (!validator.isInt(id, { min: 1 })) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Convert to plain object so we can conditionally attach UserInfo
    const userObj = user.toJSON();

    // Buscar información adicional asociada (si existe)
    const userInfo = await UserInfo.findOne({
      where: { user_id: id },
      attributes: ['address', 'city', 'neighborhood']
    });

    if (userInfo) {
      const infoObj = userInfo.toJSON();
      // normalize misspelled column `neighborhood` -> `neighborhood` in response
      if (infoObj.neighborhood !== undefined) {
        infoObj.neighborhood = infoObj.neighborhood;
        delete infoObj.neighborhood;
      }
      userObj.userInfo = infoObj;
    }

    return res.status(200).json(userObj);

  } catch (error) {
    console.log("Error al obtener el usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Update user by id
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, status, phone, password } = req.body;

    if (req.body.rol) {
      return res.status(400).json({ message: "No se puede actualizar el rol del usuario" });
    }

    if (req.body.document) {
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
      where: { email: email, id: { [Op.ne]: id } }
    });

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
    user.status = typeof status === 'boolean' ? status : user.status;

    await user.save();

    return res.status(200).json({ message: "Usuario actualizado exitosamente" });

  } catch (error) {
    console.log("Error al actualizar el usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Delete user by id
async function deleteUser(req, res) {
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
}

// Create User
async function createUser(req, res) {
  try {
    const { name, document, email, password, rol, phone } = req.body;

    if (!rolPermits.includes(rol)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    if (rol === 'logistica') {
      const t = await sequelize.transaction();

      if (!name || !document || !email || !password || !rol || !phone) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      if (!validator.isEmail(email)) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Email inválido" });
      }
      const existingUser = await User.findOne({ where: { document: document }, transaction: t });
      if (existingUser) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este documento ya existe" });
      }

      const existingEmail = await User.findOne({ where: { email: email }, transaction: t });
      if (existingEmail) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este email ya existe" });
      }

      try {
        const newUser = await User.create({
          name,
          document,
          email,
          password: await bcrypt.hash(password, 10),
          rol,
          status: true,
          phone: phone || null,
        }, { transaction: t });

        await t.commit();

        const user = await User.findByPk(newUser.id, { attributes: { exclude: ['password'] } });

        return res.status(201).json({ message: "Usuario creado exitosamente", user: user });
      } catch (err) {
        await t.rollback().catch(()=>{});
        throw err;
      }
    }

    if (rol === 'lider') {

      const { address, city, neighborhood } = req.body;

      const t = await sequelize.transaction();

      if (!name || !document || !email || !password || !rol || !phone || !address || !city || !neighborhood) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      const existingUser = await User.findOne({ where: { document: document }, transaction: t });
      if (existingUser) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este documento ya existe" });
      }

      const existingEmail = await User.findOne({ where: { email: email }, transaction: t });
      if (existingEmail) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este email ya existe" });
      }

      if (!validator.isEmail(email)) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Email inválido" });
      }

      try {
        const newUser = await User.create({
          name,
          document,
          email,
          password: await bcrypt.hash(password, 10),
          rol,
          status: true,
          phone: phone || null,
        }, { transaction: t });

        await UserInfo.create({
          user_id: newUser.id,
          address,
          city,
          neighborhood: neighborhood,
        }, { transaction: t });

        await t.commit();

        const user = await User.findByPk(newUser.id,
          {
            include: [{
              model: UserInfo,
              attributes: ['address', 'city', 'neighborhood']
            }],
            attributes: {
              exclude: ['password']
            },
          });

        return res.status(201).json({ message: "Usuario creado exitosamente", user: user });
      } catch (err) {
        await t.rollback().catch(()=>{});
        throw err;
      }

    }

    if (rol === 'votante') {
      const { address, city, neighborhood } = req.body;

      const t = await sequelize.transaction();

      if (!name || !document || !rol || !phone || !address || !city || !neighborhood ) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      try {
        const newUser = await User.create({
          name,
          document,
          rol,
          status: true,
          phone: phone || null,
        }, { transaction: t });

        await UserInfo.create({
          user_id: newUser.id,
          address,
          city,
          neighborhood: neighborhood,
        }, { transaction: t });

        await t.commit();

        const user = await User.findByPk(newUser.id,
          {
            include: [{
              model: UserInfo,
              attributes: ['address', 'city', 'neighborhood']
            }],
            attributes: {
              exclude: ['password']
            },
          });

        return res.status(201).json({ message: "Usuario creado exitosamente", user: user });
      } catch (err) {
        await t.rollback().catch(()=>{});
        throw err;
      }
    }

    if (rol === 'admin') {

      const t = await sequelize.transaction();

      if (!name || !document || !email || !password || !rol) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      if (!validator.isEmail(email)) {
        await t.rollback().catch(()=>{});
        return res.status(400).json({ message: "Email inválido" });
      }
      const existingUser = await User.findOne({ where: { document: document }, transaction: t });
      if (existingUser) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este documento ya existe" });
      }

      const existingEmail = await User.findOne({ where: { email: email }, transaction: t });
      if (existingEmail) {
        await t.rollback().catch(()=>{});
        return res.status(409).json({ message: "El usuario con este email ya existe" });
      }
      try {
        const newUser = await User.create({
          name,
          document,
          email,
          password: await bcrypt.hash(password, 10),
          rol,
          status: true,
        }, { transaction: t });
        await t.commit();
        const user = await User.findByPk(newUser.id, { attributes: { exclude: ['password'] } });

        return res.status(201).json({ message: "Usuario creado exitosamente", user: user });
      } catch (err) {
        await t.rollback().catch(()=>{});
        throw err;
      }
    }

  } catch (error) {
    console.log("Error al crear un usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
