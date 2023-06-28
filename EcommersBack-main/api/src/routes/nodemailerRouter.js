const express = require("express");
const nodemailerRouter = express.Router();
const nodemailer = require("nodemailer");
const { User, Carrito } = require("../db");
require("dotenv").config();
const crypto = require("crypto");


function generateConfirmationToken() {
  const token = crypto.randomBytes(20).toString("hex");
  return token;
}



nodemailerRouter.post("/envio-confirmacion", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    if (user.confirmed) {
      return res.status(400).json({ message: "El usuario ya está confirmado" });
    }

    const confirmationToken = generateConfirmationToken();

    await user.update({ confirmationToken, confirmed: false });

    // const confirmationLink = `https://ecommers-front-rust.vercel.app/nodemailer/confirm/${confirmationToken}`;
    const confirmationLink = `https://ecommers-front-rust.vercel.app/home`;

    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.OUTLOOK_USERNAME,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });


    const mailOptions = {
      from: process.env.OUTLOOK_USERNAME,
      to: email,
      // subject: "Confirmación de registro",
      subject: "CodeXpress",
      text: `¡Gracias por registrarte exitosamente en nuestra página web de ventas de software! Nos complace darte la bienvenida a nuestra comunidad y queremos asegurarnos de que aproveches al máximo todas las ventajas que ofrecemos.
      En CodeXpress, nos enorgullece proporcionar soluciones de software innovadoras y de alta calidad para satisfacer las necesidades de nuestros clientes. Con nuestra amplia selección de productos y servicios, estamos seguros de que encontrarás las herramientas adecuadas para mejorar tu trabajo y optimizar tus procesos.
      A partir de ahora, tendrás acceso a una variedad de características y beneficios exclusivos, que incluyen:
      
      1. Amplia gama de software: Explora nuestra extensa colección de software para diferentes propósitos y sectores. Desde aplicaciones de productividad hasta herramientas de diseño y desarrollo, ¡tenemos todo cubierto!
      
      2. Actualizaciones regulares: Mantenemos nuestros productos actualizados para garantizar un rendimiento óptimo y una experiencia de usuario satisfactoria. Te notificaremos sobre las actualizaciones más recientes y las nuevas versiones disponibles para que siempre estés al día.
      
      3. Ofertas exclusivas: Como miembro registrado, tendrás acceso a ofertas y descuentos especiales en nuestros productos seleccionados. Estate atento a nuestras promociones y oportunidades únicas para ahorrar dinero en tus compras.
      
      Para comenzar a explorar nuestra página web y aprovechar todas estas ventajas, simplemente haz clic en el siguiente enlace: ${confirmationLink}.
      Si tienes alguna pregunta adicional o necesitas ayuda durante tu experiencia en nuestra página web, no dudes en contactarnos. Estamos aquí para brindarte el mejor servicio posible.
      Una vez más, te damos la bienvenida a CodeXpress. Esperamos que disfrutes de tu tiempo con nosotros y encuentres los productos de software que cumplirán todas tus expectativas.
      
      Atentamente,
      
      Equipo de trabajo de CodeXpress : ${confirmationLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "El correo de confirmación ha sido enviado" });
  } catch (error) {
    console.error("Error al enviar el correo de confirmación:", error);
    return res.status(500).json({ message: "Ocurrió un error al enviar el correo de confirmación" });
  }
});


nodemailerRouter.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ where: { confirmationToken: token } });
    if (!user) {
      return res.status(400).json({ message: "Token de confirmación inválido" });
    }

    await user.update({ confirmed: true });

    return res.redirect("https://ecommers-front-rust.vercel.app/home");
  } catch (error) {
    console.error("Error al confirmar el usuario:", error);
    return res.status(500).json({ message: "Ocurrió un error al confirmar el usuario" });
  }
});

nodemailerRouter.post("/compra-exitosa", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    const cart = await Carrito.findOne({ where: { userId: user.id } });
    if (!cart) {
      return res.status(400).json({ message: "El carrito no existe" });
    }

    const cartContent = "Contenido del carrito:\n" + cart.dataValues; 

    const transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: process.env.OUTLOOK_USERNAME,
        pass: process.env.OUTLOOK_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.OUTLOOK_USERNAME,
      to: email,
      subject: "Compra exitosa",
      text: `¡Gracias por tu compra!\n\nDetalles de la compra:\n${cartContent}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "El correo de compra exitosa ha sido enviado" });
  } catch (error) {
    console.error("Error al enviar el correo de compra exitosa:", error);
    return res.status(500).json({ message: "Ocurrió un error al enviar el correo de compra exitosa" });
  }
});



module.exports = nodemailerRouter;