const {
  Client,
  LocalAuth,
} = require("whatsapp-web.js");

const qrcode =
  require("qrcode-terminal");

const client =
  new Client({

    authStrategy:
      new LocalAuth(),
puppeteer: {

  executablePath:
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

  headless: false,

  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ],

},

  });

client.on(
  "qr",
  (qr) => {

    qrcode.generate(
      qr,
      {
        small: true,
      }
    );

    console.log(
      "Scan QR Code"
    );

  }
);

client.on(
  "ready",
  () => {

    console.log(
      "WhatsApp Ready"
    );

  }
);

client.on(
  "authenticated",
  () => {

    console.log(
      "WhatsApp Authenticated"
    );

  }
);

client.on(
  "auth_failure",
  (msg) => {

    console.log(
      "Auth Failed:",
      msg
    );

  }
);

client.on(
  "disconnected",
  (reason) => {

    console.log(
      "Disconnected:",
      reason
    );

  }
);

client.initialize();

module.exports =
  client;