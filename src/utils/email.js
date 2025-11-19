const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
    tls: {
        rejectUnauthorized: false
    }
});


const sendEmailRegister = async (username) => {
    
    const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: username, 
        subject: 'Bienvenido a Nuestra Plataforma', 
        text: `Hola ${username},\n\nGracias por registrarte en nuestra plataforma. ¡Estamos encantados de tenerte con nosotros!`, 
        html: `<b>Hola ${username}</b>,<br><br>Gracias por registrarte en nuestra plataforma. ¡Estamos encantados de tenerte con nosotros!` // contenido HTML
    };

    try {
        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error al enviar correo de bienvenida: %s', error.message);
    }
};

module.exports = {
    sendEmailRegister
};
