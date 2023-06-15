import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { image as imageQr } from "qr-image";
import LeadExternal from "../../domain/lead-external.repository";
const fs = require('fs');

/**
 * Extendemos los super poderes de whatsapp-web
 */
class WsTransporter extends Client implements LeadExternal {
  private status = false;

  constructor() {
    super({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--disable-setuid-sandbox",
          "--unhandled-rejections=strict",
        ],
      },
    });

    console.log("Iniciando....");

    this.initialize();

    this.on("ready", () => {
      this.status = true;
      console.log("LOGIN_SUCCESS");
    });

    this.on("auth_failure", () => {
      this.status = false;
      console.log("LOGIN_FAIL");
    });

    this.on("qr", (qr) => {
      console.log("Escanea el codigo QR que esta en la carepta tmp");
      this.generateImage(qr);
    });
  }

  /**
   * Enviar mensaje de WS
   * @param lead
   * @returns
   */
  async sendMsg(lead: { message: string; phone: string }): Promise<any> {
    try {
      if (!this.status) return Promise.resolve({ error: "WAIT_LOGIN" });
      const { message, phone } = lead;
      console.log(`${phone}@c.us`);
      const response = await this.sendMessage(`${phone}@c.us`, message);
      // this.sendDocument(lead);
      return { id: response.id.id };
    } catch (e: any) {
      return Promise.resolve({ error: e.message });
    }
  }

  async sendMsgDocumento(lead: { message: string; phone: string }) {
    try {
        const { message, phone } = lead; 
        const chatId = `${phone}@c.us`; // ID del chat al que deseas enviar el documento
        const filePath = `${process.cwd()}/tmp/prueba.pdf`; // Ruta del archivo que deseas adjuntar
        // Leer el archivo
        const fileData = fs.readFileSync(filePath);
        const base64Data = fileData.toString('base64');

        if (!this.status) return Promise.resolve({ error: "WAIT_LOGIN" });
        console.log(chatId);
        const media = new MessageMedia('application/pdf', base64Data, 'prueba.pdf');
        const response = await this.sendMessage(chatId, message, {media});
        console.log('Documento enviado satisfactoriamente...')
        return { id: response.id.id };
      } catch (error: any) {
          console.error('Error al enviar el documento adjunto:', error);
          return Promise.resolve({ error: error.message });
      }
  }

  getStatus(): boolean {
    return this.status;
  }

  private generateImage = (base64: string) => {
    const path = `${process.cwd()}/tmp`;
    let qr_svg = imageQr(base64, { type: "svg", margin: 4 });
    qr_svg.pipe(require("fs").createWriteStream(`${path}/qr.svg`));
    console.log(`⚡ Recuerda que el QR se actualiza cada minuto ⚡'`);
    console.log(`⚡ Actualiza F5 el navegador para mantener el mejor QR⚡`);
  };
}

export default WsTransporter;
