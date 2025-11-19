const PointVote = require('../models/point_vote');
const validator = require("validator");
const validateRequired = require('../middleware/validateRequired');
const { Op } = require('sequelize');



//get all PointVotes without pagination and filters (optional)
async function getPointVote(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const whereClause = {};

        const { name, city } = req.query;

        if (name) {
            whereClause.name = { [Op.like]: `%${name}%` };
        }

        if (city) {
            whereClause.city = { [Op.like]: `%${city}%` };
        }

        const { count, rows } = await PointVote.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: rows,
        });


    } catch (error) {
        console.error("Error al obtener los puntos de votación:", error);
        return res.status(500).json({ message: "Error interno del servidor, Comuniquese con el Administrador" });
    }
}

//Get One PointVote by id
async function getPointVoteById(req, res) {
    try {
        const { id } = req.params;

        if (!validator.isInt(id.toString(), { min: 1 })) {
            return res.status(400).json({ message: "ID de punto de votación inválido" });
        }

        const pointVote = await PointVote.findByPk(id);

        if (!pointVote) {
            return res.status(404).json({ message: "Punto de votación no encontrado" });
        }

        return res.status(200).json(pointVote);

    } catch (error) {
        console.error("Error al obtener el punto de votación por ID:", error);
        return res.status(500).json({ message: "Error interno del servidor, Comuniquese con el Administrador" });
    }
}

//create PointVote 
async function createPointVote(req, res) {
    try {

        const create_by = req.user.id;

        const { name, address, neiborhood, city } = req.body;
        //validar que no exista un punto de votacion con el mismo nombre y direccion
        const existingPointVote = await PointVote.findOne({
            where: {
                [Op.and]: [
                    { name: name },
                    { address: address }
                ]
            }
        });

        if (existingPointVote) {
            return res.status(400).json({ message: "Ya existe un punto de votación con el mismo nombre y dirección" });
        }

        const newPointVote = await PointVote.create({
            name,
            address,
            neiborhood: neiborhood,
            city,
            create_by
        });

        return res.status(201).json(newPointVote);

    } catch (error) {
        console.error("Error al crear el punto de votación:", error);
        return res.status(500).json({ message: "Error interno del servidor, Comuniquese con el Administrador" });
    }
}

module.exports = {
    getPointVote,
    createPointVote,
    getPointVoteById
};