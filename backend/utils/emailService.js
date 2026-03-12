const nodemailer = require('nodemailer');

const sendProfessionalWelcomeEmail = async ({ toEmail, userName, resetLink }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Si les credentials email ne sont pas configurés, afficher le lien dans la console
  if (!emailUser || !emailPass) {
    console.log('⚠️  Email credentials not configured. Link for professional:');
    console.log(`📧 To: ${toEmail}`);
    console.log(`👤 Name: ${userName}`);
    console.log(`🔗 Login link: ${resetLink}`);
    console.log('-----------------------------------');
    return;
  }

  // Créer un transporteur Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Configuration de l'email
  const mailOptions = {
    from: `"Rabta Platform" <${emailUser}>`,
    to: toEmail,
    subject: 'Bienvenue sur Rabta - Votre compte professionnel est approuvé! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Bienvenue sur Rabta!</h2>
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p>Félicitations! Votre compte professionnel a été approuvé par l'administrateur.</p>
        <p>Vous pouvez maintenant vous connecter et commencer à gérer vos rendez-vous.</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Se connecter maintenant
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Ou copiez ce lien dans votre navigateur:<br>
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          Cet email a été envoyé automatiquement par la plateforme Rabta.<br>
          Si vous n'avez pas créé de compte, veuillez ignorer cet email.
        </p>
      </div>
    `
  };

  // Envoyer l'email
  await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent successfully to ${toEmail}`);
};

module.exports = {
  sendProfessionalWelcomeEmail
};
