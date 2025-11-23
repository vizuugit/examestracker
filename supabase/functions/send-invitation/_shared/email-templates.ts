interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const generateInvitationEmail = (params: {
  recipientEmail: string;
  inviteLink: string;
  adminName: string;
  expiresAt: string;
}): EmailTemplate => {
  const { recipientEmail, inviteLink, adminName, expiresAt } = params;
  
  const expiresDate = new Date(expiresAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return {
    subject: "Você foi convidado para o Exames.co",
    
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - Sistema Exames</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 102, 204, 0.2);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #0099FF 100%); padding: 40px; text-align: center;">
              <div style="background-color: white; width: 80px; height: 80px; border-radius: 20px; display: inline-block; line-height: 80px; font-size: 48px; font-weight: bold; color: #0066CC; margin-bottom: 16px;">
                Ex
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Você foi convidado!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px; color: #e0e0e0;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Olá,</p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                <strong style="color: white;">A equipe do Ex (exames.co)</strong> convida você para fazer parte do 
                <strong style="color: #0099FF;">Exames.co</strong> - a plataforma profissional de 
                acompanhamento de exames médicos.
              </p>
              
              <div style="background-color: rgba(0, 102, 204, 0.1); border-left: 4px solid #0066CC; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #b0b0b0;">
                  📧 <strong style="color: white;">Email do convite:</strong> ${recipientEmail}
                </p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" 
                       style="display: inline-block; 
                              padding: 16px 48px; 
                              background: linear-gradient(135deg, #0066CC 0%, #0099FF 100%); 
                              color: white; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: 600; 
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);">
                      Criar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #808080; margin: 24px 0 0; text-align: center;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="font-size: 12px; color: #0099FF; word-break: break-all; text-align: center; margin: 8px 0 24px;">
                ${inviteLink}
              </p>
              
              <div style="background-color: rgba(255, 152, 0, 0.1); border-left: 4px solid #FF9800; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #FFB74D;">
                  ⏰ <strong>Importante:</strong> Este convite expira em <strong>${expiresDate}</strong>
                </p>
              </div>
              
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #0a0a0a; padding: 32px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #666;">
                Se você não solicitou este convite, pode ignorar este email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #444;">
                © ${new Date().getFullYear()} Exames.co - Acompanhamento de Exames Médicos
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `,
    
    text: `
Você foi convidado para o Exames.co!

Olá,

A equipe do Ex (exames.co) convida você para fazer parte do Exames.co - a plataforma profissional de acompanhamento de exames médicos.

Email do convite: ${recipientEmail}

Clique no link abaixo para criar sua conta:
${inviteLink}

IMPORTANTE: Este convite expira em ${expiresDate}

Se você não solicitou este convite, pode ignorar este email.

---
Exames.co - Acompanhamento de Exames Médicos
    `.trim()
  };
};

export const generateAcceptanceNotificationEmail = (params: {
  adminEmail: string;
  adminName: string;
  professionalName: string;
  professionalEmail: string;
}): EmailTemplate => {
  const { adminName, professionalName, professionalEmail } = params;
  
  return {
    subject: `${professionalName} aceitou seu convite no Exames.co`,
    
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(76, 175, 80, 0.2);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Convite Aceito!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px; color: #e0e0e0;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Olá <strong style="color: white;">${adminName}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Boas notícias! O profissional que você convidou aceitou e criou sua conta no Exames.co.
              </p>
              
              <div style="background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 16px; color: white;">
                  <strong>👤 ${professionalName}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #b0b0b0;">
                  📧 ${professionalEmail}
                </p>
              </div>
              
              <p style="font-size: 14px; color: #808080; margin: 24px 0 0;">
                O novo usuário já pode acessar o sistema e começar a utilizar todas as funcionalidades.
              </p>
              
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #0a0a0a; padding: 32px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0; font-size: 12px; color: #444;">
                © ${new Date().getFullYear()} Exames.co
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `,
    
    text: `
Convite Aceito!

Olá ${adminName},

Boas notícias! O profissional que você convidou aceitou e criou sua conta no Exames.co.

Informações:
- Nome: ${professionalName}
- Email: ${professionalEmail}

O novo usuário já pode acessar o sistema e começar a utilizar todas as funcionalidades.

---
Exames.co
    `.trim()
  };
};
