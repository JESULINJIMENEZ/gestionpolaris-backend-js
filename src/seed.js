require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../database');
const User = require('./models/users');
const UserInfo = require('./models/user_info');

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
			{
				name: 'Superadmin Test',
				document: '10000000',
				phone: '3000000000',
				email: 'superadmin@test.local',
				password: 'superadmin123',
				rol: 'superadmin',
				status: true,
			},
			{
				name: 'Admin Test',
				document: '10000001',
				phone: '3000000001',
				email: 'admin@test.local',
				password: 'admin1234',
				rol: 'admin',
				status: true,
			},
			{
				name: 'Logistica Test',
				document: '10000002',
				phone: '3000000002',
				email: 'logistica@test.local',
				password: 'logistica123',
				rol: 'logistica',
				status: true,
			},
			{
				name: 'Lider Test',
				document: '10000003',
				phone: '3000000003',
				email: 'lider@test.local',
				password: 'lider1234',
				rol: 'lider',
				status: true,
				userInfo: {
					address: 'Calle Principal 123',
					city: 'Ciudad Ejemplo',
					neighborhood: 'Barrio Central',

				}
			},
			{
				name: 'Votante Uno',
				document: '10000004',
				phone: '3000000004',
				rol: 'votante',
				status: true,
				userInfo: {
					address: 'Carrera 10 #20-30',
					city: 'Ciudad Ejemplo',
					neighborhood: 'Barrio Norte',

				}
			},
			{
				name: 'Invitado',
				document: '10000005',
				phone: '3000000005',
				email: 'guest@test.local',
				password: 'guest1234',
				rol: 'guest',
				status: false,
			},
		];

		for (const u of testUsers) {
			// Hash password only if provided
			let hashed = null;
			if (u.password) {
				hashed = await bcrypt.hash(u.password, 10);
			}

			const [user, created] = await User.findOrCreate({
				where: { document: u.document },
				defaults: {
					name: u.name,
					phone: u.phone || null,
					email: u.email || null,
					password: hashed,
					rol: u.rol,
					status: typeof u.status === 'boolean' ? u.status : true,
				}
			});

			if (created) {
				console.log(`Usuario creado: ${u.email || u.name} (document: ${u.document})`);
			} else {
				// If already exists, update some fields (don't overwrite password unless explicitly provided)
				let needsSave = false;
				if (u.email && user.email !== u.email) { user.email = u.email; needsSave = true; }
				if (u.name && user.name !== u.name) { user.name = u.name; needsSave = true; }
				if (u.phone && user.phone !== u.phone) { user.phone = u.phone; needsSave = true; }
				if (u.rol && user.rol !== u.rol) { user.rol = u.rol; needsSave = true; }
				if (typeof u.status === 'boolean' && user.status !== u.status) { user.status = u.status; needsSave = true; }
				if (u.password) { user.password = hashed; needsSave = true; }
				if (needsSave) {
					await user.save();
					console.log(`Usuario existente actualizado: ${u.email || u.name} (document: ${u.document})`);
				} else {
					console.log(`Usuario ya existe: ${u.email || u.name} (document: ${u.document})`);
				}
			}

			// Create or update related UserInfo when provided
			if (u.userInfo) {
				const infoValues = {
					user_id: user.id,
					address: u.userInfo.address || null,
					city: u.userInfo.city || null,
					neighborhood: u.userInfo.neighborhood || null,
				};

				const [info, infoCreated] = await UserInfo.findOrCreate({
					where: { user_id: user.id },
					defaults: infoValues,
				});

				if (!infoCreated) {
					let infoNeedsSave = false;
					if (info.address !== infoValues.address) { info.address = infoValues.address; infoNeedsSave = true; }
					if (info.city !== infoValues.city) { info.city = infoValues.city; infoNeedsSave = true; }
					if (info.neighborhood !== infoValues.neighborhood && info.neighborhood !== undefined) { info.neighborhood = infoValues.neighborhood; infoNeedsSave = true; }
					if (infoNeedsSave) {
						await info.save();
						console.log(`UserInfo actualizado para documento: ${u.document}`);
					}
				} else {
					console.log(`UserInfo creado para documento: ${u.document}`);
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

