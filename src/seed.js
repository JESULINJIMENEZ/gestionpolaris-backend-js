require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../database');
const User = require('./models/users');

async function createTestUsers() {
	try {
		await sequelize.authenticate();
		console.log('Conexión a la base de datos establecida.');

		try {
			await sequelize.sync({ alter: true });
			console.log('Sincronización de esquemas completada.');
		} catch (syncErr) {
			console.warn('Advertencia al sincronizar esquema (se continúa):', syncErr.message);
		}

		const testUsers = [
			{ name: 'Admin Test', document: '10000001', phone: '3000000001', email: 'admin@test.local', password: 'admin1234', rol: 'admin', status: true },
			{ name: 'Logistica Test', document: '10000002', phone: '3000000002', email: 'logistica@test.local', password: 'logistica123', rol: 'logistica', status: true },
			{ name: 'Usuario Uno', document: '10000003', phone: '3000000003', email: 'user1@test.local', password: 'user1234', rol: 'user', status: true },
			{ name: 'Usuario Dos', document: '10000004', phone: '3000000004', email: 'user2@test.local', password: 'user1234', rol: 'user', status: true },
			{ name: 'Invitado', document: '10000005', phone: '3000000005', email: 'guest@test.local', password: 'guest1234', rol: 'guest', status: false },
		];

		for (const u of testUsers) {
			const hashed = await bcrypt.hash(u.password, 10);

			const [user, created] = await User.findOrCreate({
				where: { document: u.document },
				defaults: {
					name: u.name,
					phone: u.phone,
					email: u.email,
					password: hashed,
					rol: u.rol,
					status: u.status,
				}
			});

			if (created) {
				console.log(`Usuario creado: ${u.email} (document: ${u.document})`);
			} else {
				// Si ya existe, actualizamos algunos campos (excepto password si ya existe)
				let needsSave = false;
				if (user.email !== u.email) { user.email = u.email; needsSave = true; }
				if (user.name !== u.name) { user.name = u.name; needsSave = true; }
				if (user.phone !== u.phone) { user.phone = u.phone; needsSave = true; }
				if (user.rol !== u.rol) { user.rol = u.rol; needsSave = true; }
				if (user.status !== u.status) { user.status = u.status; needsSave = true; }
				if (needsSave) {
					// actualizamos password solo si queremos forzar, por ahora no lo hacemos
					await user.save();
					console.log(`Usuario existente actualizado: ${u.email} (document: ${u.document})`);
				} else {
					console.log(`Usuario ya existe: ${u.email} (document: ${u.document})`);
				}
			}
		}

		console.log('Seed de usuarios completado.');
	} catch (err) {
		console.error('Error ejecutando seed:', err);
	} finally {
		await sequelize.close();
		console.log('Conexión a la base de datos cerrada.');
	}
}

if (require.main === module) {
	createTestUsers().then(() => process.exit(0));
}

