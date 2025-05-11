/// ==============================
// CONFIGURACIÓN Y CONSTANTES
// ==============================
const TOKEN = "7355254411:AAGsMjghcLkoQlsDDhyRiHo2EVIR-Kjtiho";
const SPREADSHEET_ID = "1ZYiOMVLlX7Halb-KPPXbvjW2X5jmyWfTjP7RWggCMQo";
const ADMIN_CHAT_ID = "732874249"; // Aquí pones el chat_id correcto del administrador


// ==============================
// MANEJO DE COMANDOS Y MENÚ PRINCIPAL
// ==============================
function doPost(e) {
try {
const contents = JSON.parse(e.postData.contents);

if (contents.message) {
manejarComandoTexto(contents.message);
}

if (contents.callback_query) {
manejarCallback(contents.callback_query);
}

return HtmlService.createHtmlOutput("OK");
} catch (error) {
Logger.log("Error en doPost: " + error);
return HtmlService.createHtmlOutput("Error");
}
}
// ==============================
// Mapeo de columnas
// ==============================
const COLUMNAS = {
CHAT_ID: 0, // Columna A
USERNAME: 1, // Columna B
NOMBRE: 2, // Columna C
FECHA_REGISTRO: 3, // Columna D
WALLET_ASIGNADA: 4, // Columna E
MONTO_INVERTIDO: 5, // Columna F
MONTO_RETIRO: 6, // Columna G
HISTORIAL_DEPOSITOS: 7, // Columna H
HISTORIAL_RETIROS: 8, // Columna I
VALIDACION: 9, // Columna J
REFERIDO_POR: 10, // Columna K
USUARIOS_REFERIDOS: 11, // Columna L
GANANCIAS_REFERIDOS: 12, // Columna M
BONO_ADMINISTRADOR: 13, // Columna N
GANANCIAS_MENSUALES: 14, // Columna O
HISTORIAL_GANANCIAS_ACUMULADAS: 15, // Columna P
PENDIENTE_RETIRO: 16, // Columna Q
};

const CALLBACKS = {
// Menú principal
START: "/start",
VOLVER_MENU: "volver_menu",
REINICIAR_BOT: "reiniciar_bot",

// Usuario
RECOMPENSAS: "recompensas",
POR_QUE_CORE_DEX: "por_que_core_dex",
REGISTRAR: "/registrar",
DEPOSITAR: "/depositar",
WALLET: "/wallet",
CONFIRMAR_RETIRO: "confirmar_retiro",
SOLICITAR_RETIRO: "solicitar_retiro",
POLITICAS_RETIRO: "politicas_retiro",
WALLET_TELEGRAM: "wallet_telegram",

// Retiro
ESTADO_RETIRO: "estado_retiro",
HISTORIAL_RETIROS: "historial_retiros",

// Información sistema
COMO_FUNCIONA_COREDEX: "como_funciona_coredex",
DISTRIBUCION_GANANCIAS: "distribucion_ganancias",

// Panel Administrador
PANEL_ADMIN: "panel_admin",
CALLBACK_ADMIN_VER_USUARIOS: "admin_ver_usuarios",
CALLBACK_ADMIN_VER_DEPOSITOS: "admin_ver_depositos",
CALLBACK_ADMIN_VER_RETIROS: "admin_ver_retiros",
CALLBACK_ADMIN_OPCIONES_AVANZADAS: "admin_opciones_avanzadas"
};

function esCallbackValido(data) {
const callbacksValidos = [
"/start", "reiniciar_bot",
"/registrar", "registrar",
"/depositar", "nuevo_deposito",
"/wallet", "wallet",
"por_que_core_dex",
"comprobar_validacion",
"retiros", "solicitar_retiro",
"ya_deposite", "confirmar_retiro",
"wallet_telegram",
"soporte", "legalidad",
"recompensas", "info", "bono",
"volver_menu",
"mostrar_link_referido",
"politicas_retiro",
"panel_admin",
"estado_retiro", "historial_retiros",
// 👉 Nuevos agregados:
"como_funciona_coredex",
"distribucion_ganancias",
"admin_ver_usuarios",
"admin_ver_depositos",
"admin_ver_retiros",
"admin_opciones_avanzadas"
];

return callbacksValidos.includes(data);
}


// ==============================
// CALLBACKS DE BOTONES
// ==============================

function manejarCallback(callbackQuery) {
try {
const chatId = callbackQuery.message ? callbackQuery.message.chat.id : (callbackQuery.from ? callbackQuery.from.id : null);
const username = callbackQuery.from.username || "SinUsuario";
const data = callbackQuery.data;

if (!data) {
sendMessage(chatId, "⚠️ No se recibió ninguna acción. Intenta de nuevo.");
return;
}

if (!esCallbackValido(data)) {
const mensaje = "🚫 Detectamos que tu botón es de una versión anterior.\n\n🔄 Por favor, toca el botón de abajo para *reiniciar el bot* y actualizar.";
const keyboardReiniciar = {
inline_keyboard: [
[{ text: "🔄 Reiniciar Bot", callback_data: "reiniciar_bot" }]
]
};
sendMessage(chatId, mensaje, keyboardReiniciar);
return;
}

const acciones = {
"/start": () => sendWelcome(chatId, username),
"reiniciar_bot": () => sendWelcome(chatId, username),
"/registrar": () => registrarUsuario(chatId, username, callbackQuery.from.first_name),
"registrar": () => registrarUsuario(chatId, username, callbackQuery.from.first_name),
"/depositar": () => mostrarInstruccionesDeposito(chatId),
"depositar": () => mostrarInstruccionesDeposito(chatId),
"nuevo_deposito": () => mostrarInstruccionesDeposito(chatId),
"/wallet": () => mostrarWallet(chatId),
"wallet": () => mostrarWallet(chatId),
"por_que_core_dex": () => manejarPorQueCoreDex(chatId),
"comprobar_validacion": () => comprobarValidacion(chatId),
"retiros": () => manejarRetiro(chatId),
"solicitar_retiro": () => sendMessage(chatId, "Contacta a soporte para proceder con el retiro. Requerimos datos de ID y red para validar el retiro."),
"ya_deposite": () => sendMessage(chatId, "🚀 *Tu depósito será validado en red.* Puedes confirmarlo en el botón de *Comprobación* en la *Wallet*."),
"confirmar_retiro": () => manejarRetiro(chatId),
"wallet_telegram": () => mostrarGuiaWalletTelegram(chatId),
"soporte": () => manejarComandoSoporte(chatId),
"legalidad": () => manejarComandoLegalidad(chatId),
"recompensas": () => sendRewardsMessage(chatId, callbackQuery.message.message_id),
"info": () => sendMessage(chatId, "`📚 *Reglas de Referidos* - Recibes el 10% de las ganancias mensuales de tus referidos...`"),
"bono": () => sendMessage(chatId, "💵 *Bono del Administrador*: Otorgado por participación activa en el sistema."),
"volver_menu": () => sendWelcome(chatId, username),
"mostrar_link_referido": () => linkreferido(callbackQuery),
"politicas_retiro": () => mostrarPoliticasDeRetiro(chatId),
"panel_admin": () => mostrarMenuAdministrador(chatId),
"estado_retiro": () => manejarEstadoRetiro(chatId, username),
"historial_retiros": () => manejarHistorialRetiros(chatId, username),

// 👉 Nuevos callbacks:
"como_funciona_coredex": () => handleCallbackComoFunciona(chatId),
"distribucion_ganancias": () => handleCallbackDistribucionGanancias(chatId),

// Admin
"admin_ver_usuarios": () => manejarVerUsuarios(chatId),
"admin_ver_depositos": () => manejarVerDepositos(chatId),
"admin_ver_retiros": () => manejarVerRetiros(chatId),
"admin_opciones_avanzadas": () => sendMessage(chatId, "🛠 *Opciones Avanzadas* (en desarrollo)")
};


if (acciones[data]) {
acciones[data](); // 👈 Ejecuta directamente la función correcta
} else {
sendMessage(chatId, "❓ Acción no reconocida.");
}

} catch (error) {
Logger.log("Error en manejarCallback: " + error);
}
}


// ==============================
// MANEJO DE COMANDOS DE TEXTO
// ==============================
function manejarComandoTexto(message) {
const chatId = message.chat.id;
const text = message.text.toLowerCase(); // Para evitar errores por mayúsculas
const username = message.from.username || "SinUsuario";
const firstName = message.from.first_name || "SinNombre";

switch (text) {
case "/start":
sendWelcome(chatId, username); // Llama a tu función de bienvenida
break;
case "/registro":
registrarUsuario(chatId, username, firstName);
break;
case "/deposito":
mostrarInstruccionesDeposito(chatId);
break;
case "depositar":
mostrarInstruccionesDeposito(chatId); // Llama a la función correspondiente para mostrar las instrucciones de depósito
break;
case "/retiro":
manejarRetiro(chatId);
break;
case "/wallet":
mostrarWallet(chatId);
break;
case "/soporte":
manejarComandoSoporte(chatId);
break;
case "/legalidad":
manejarComandoLegalidad(chatId);
break;
default:
enviarMensaje(chatId, "🤖 Comando no reconocido. Usa el menú o escriba un comando.");
}
}
// ==============================
// MENÚ FILTROS
// ==============================
// ==============================
function handleStart(chatId, username) {
const userData = getUserData(chatId);

if (!userData) {
sendMessage(chatId, `🚀 Bienvenido @${username} a *Core Capital Dex*.\n\n👉 Para comenzar, por favor pulsa /registrar o utiliza el botón de abajo.`);
sendRegistrationButton(chatId);
return;
}

if (!userData.wallet || userData.wallet === "") {
sendMessage(chatId, `⚠️ Detectamos que podrías estar usando una versión antigua del bot.\n\n🧹 *Por favor, borra este chat completamente y vuelve a iniciar con /start* para corregir cualquier conflicto.`);
return;
}

sendWelcome(chatId, username);
}


// ==============================
// MENÚ BIENVENIDA
// ==============================
function sendWelcome(chatId, username) {
try {
if (!chatId) {
Logger.log("Error: El chat_id está vacío.");
return;
}

sendBanner(chatId);

const message = `👋 ¡Hola @${username}!

Bienvenido a *Core Capital DEX* 🚀
Tu puerta de entrada a la inversión descentralizada potenciada por *Inteligencia Artificial*.

🔍 *¿Qué ofrecemos?*
• 📈 Rentabilidades mensuales entre *7% y 25%*
• 🤖 Algoritmo IA de trading en *DEX multichain*
• 🕐 *Retiros automatizados* en menos de *24h*
• 📊 *Dashboard semanal* con métricas personalizadas

⚠️ *Importante*: Asegúrate de tener tu *nombre completo y nombre de usuario* configurados correctamente en Telegram para garantizar una comunicación efectiva.

👇 Da clic en "📋 Registro" para comenzar tu experiencia en Core Capital DEX:
`;

const botones = [
[
{ text: "📋 Registro", callback_data: "/registrar" },
{ text: "🤖 Cómo Funciona CoreDEX", callback_data: "como_funciona_coredex" }

],
[
{ text: "💸 Depósito", callback_data: "/depositar" },
{ text: "🎁 Recompensas", callback_data: "recompensas" }
],
[
{ text: "🔑 Wallet DEX", callback_data: "wallet" },
{ text: "❓ ¿Por qué Core DEX?", callback_data: "por_que_core_dex" }
]
];

if (chatId.toString() === ADMIN_CHAT_ID.toString()) {
botones.push([
{ text: "🛡 Panel de Administración", callback_data: "panel_admin" }
]);
}

const payload = {
chat_id: chatId,
text: message,
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: botones
}
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify(payload)
};

const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);

if (response.getResponseCode() !== 200) {
throw new Error(`Error al enviar el mensaje: ${response.getContentText()}`);
}

Logger.log("Mensaje enviado exitosamente a: " + chatId);
} catch (error) {
Logger.log('Error al enviar el mensaje de bienvenida: ' + error.message);
sendMessage(chatId, `🚨 Hubo un problema al enviar el mensaje de bienvenida. Intenta nuevamente más tarde.`);
}
}

function handleCallbackComoFunciona(chatId) {
const texto = `🤖 *¿Cómo funciona CoreDEX?*\n\n
CoreDEX ejecuta *trading algorítmico automatizado* mediante *Inteligencia Artificial* en entornos descentralizados (*DEX*), priorizando pares estratégicos como *BTC/USDT*, *BTC/SOL* y *SOL/USDT*.\n\n
El motor IA monitorea y analiza en tiempo real variables críticas como *volumen transaccional*, *momentum de mercado*, *sentimiento social* y *profundidad de liquidez*, con el objetivo de identificar oportunidades rentables sin intervención humana.\n\n
Nuestro modelo busca *optimizar el rendimiento* de forma autónoma, capitalizando micro-movimientos del mercado en múltiples cadenas.\n\n
Selecciona una opción para explorar más detalles:`;

const botones = [
[{ text: "💰 Distribución de Ganancias", callback_data: "distribucion_ganancias" }],
[{ text: "🔙 Volver al Menú", callback_data: "volver_menu" }]
];

const payload = {
chat_id: chatId,
text: texto,
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: botones
}
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify(payload)
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}

function handleCallbackDistribucionGanancias(chatId) {
const texto = `💰 *Distribución de Ganancias*\n\n
En *Core Capital DEX*, implementamos un modelo de reparto transparente y orientado al rendimiento real del mercado:\n\n
• Como inversionista, accedes al *65%* neto de todas las ganancias generadas por el sistema 📈\n
• El *35%* restante se destina a Core Capital DEX como *fee operativo*, cubriendo costos de infraestructura, mantenimiento y desarrollo de tecnología algorítmica 🧠⚙️\n\n
Esta estructura asegura una *relación de beneficio mutuo (win-win)*, donde ambas partes se alinean al éxito operativo del ecosistema.`;

const botones = [
[{ text: "🔙 Volver al Menú", callback_data: "volver_menu" }]
];

const payload = {
chat_id: chatId,
text: texto,
parse_mode: "Markdown",
reply_markup: {
inline_keyboard: botones
}
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify(payload)
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}


// ==============================
// ENVIO DE LA FOTO
// ==============================

function sendBanner(chatId) {
const bannerUrl = "https://drive.google.com/uc?id=1LUAW8MVYGgFTBIhsI0O7T_PJP5uzn9eQ"; // Reemplaza con tu ID real

const payload = {
chat_id: chatId,
photo: bannerUrl
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify(payload)
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, options);
}

// ==============================
// MENÚ ADMINISTRADOR
// ==============================
function mostrarMenuAdministrador(chatId) {
const mensaje = `
🛡 *Panel de Administración*

Aquí puedes gestionar los usuarios y operaciones:

━━━━━━━━━━━━━━━━━━━
📋 *Usuarios registrados*
💰 *Depósitos realizados*
💵 *Solicitudes de retiro*
🛠 *Opciones avanzadas (en desarrollo)*
━━━━━━━━━━━━━━━━━━━

Selecciona una opción 👇
`;

const keyboardAdmin = {
inline_keyboard: [
[{ text: "📋 Usuarios Registrados", callback_data: CALLBACKS.CALLBACK_ADMIN_VER_USUARIOS }],
[{ text: "💰 Ver Depósitos", callback_data: CALLBACKS.CALLBACK_ADMIN_VER_DEPOSITOS }],
[{ text: "💵 Ver Retiros", callback_data: CALLBACKS.CALLBACK_ADMIN_VER_RETIROS }],
[{ text: "🛠 Opciones Avanzadas", callback_data: CALLBACKS.CALLBACK_ADMIN_OPCIONES_AVANZADAS }],
[{ text: "🔙 Volver al Menú Principal", callback_data: CALLBACKS.VOLVER_MENU }]
]
};

sendMessage(chatId, mensaje, keyboardAdmin);
}


// ==============================
// FUNCIONES DEL PANEL ADMIN
// ==============================

// 1️⃣ Ver usuarios registrados
function manejarVerUsuarios(chatId) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Usuarios");
const data = sheet.getDataRange().getValues();
const totalUsuarios = data.length - 1; // Restamos el encabezado

const mensaje = `📋 *Usuarios registrados*: ${totalUsuarios}`;
sendMessage(chatId, mensaje);
}

// 2️⃣ Ver depósitos (solo total)
function manejarVerDepositos(chatId) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Usuarios");
const data = sheet.getDataRange().getValues();

let totalGeneral = 0;

data.slice(1).forEach(row => {
const montoInvertido = parseFloat(row[COLUMNAS.MONTO_INVERTIDO]) || 0;
totalGeneral += montoInvertido;
});

const mensaje = `💰 *Total General de Depósitos:* ${totalGeneral.toFixed(2)} USDT`;
sendMessage(chatId, mensaje);
}


// 3️⃣ Ver solicitudes de retiro de hoy
function manejarVerRetiros(chatId) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Solicitudes de Retiros");
const data = sheet.getDataRange().getValues();

const hoy = new Date();
const hoyStr = Utilities.formatDate(hoy, "GMT-6", "yyyy-MM-dd"); // Horario de Costa Rica

let mensaje = "💵 *Solicitudes de Retiro de Hoy:*\n\n";
let encontrados = 0;

data.slice(1).forEach(row => {
const fechaSolicitud = Utilities.formatDate(new Date(row[0]), "GMT-6", "yyyy-MM-dd"); // Fecha en Columna A
const nombreCompleto = row[1] || "SinNombre"; // Nombre en Columna B
const walletUSDT = row[4] || "SinWallet"; // Wallet en Columna E
const montoSolicitado = row[6] || "No especificado"; // Monto en Columna G
const usernameTelegram = row[8] || "SinUsuario"; // Username en Columna I

if (fechaSolicitud === hoyStr) {
mensaje += `👤 *${nombreCompleto}*\n`;
mensaje += `🔹 Usuario: @${usernameTelegram}\n`;
mensaje += `💳 Wallet: \`${walletUSDT}\`\n`;
mensaje += `💰 Monto: *${montoSolicitado} USDT*\n\n`;
encontrados++;
}
});

if (encontrados === 0) {
mensaje = "🚫 No hay solicitudes de retiro registradas para hoy.";
}

sendMessage(chatId, mensaje);
}

// ==============================
// REGISTRO DE USUARIOS
// ==============================

function registrarUsuario(chatId, username, firstName = "SinNombre", referralId = null) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
let hoja = sheet.getSheetByName("usuarios");

// Verificamos si la hoja existe
if (!hoja) {
hoja = sheet.insertSheet("usuarios");
hoja.appendRow([
"chat_id", "username", "nombre", "fecha_registro", "wallet_asignada",
"monto_invertido", "monto_retirado", "historial_depositos",
"historial_retiros", "validacion", "referido_por", "usuarios_referidos", "ganancias_referidos",
"bono_administrador", "ganancias_mensuales", "historial_de_ganancias_acumuladas", "pendiente_de_retiro"
]);
}

const data = hoja.getDataRange().getValues();
const yaExiste = data.some(row => row[0] == chatId);

Logger.log("Buscando usuario con chatId: " + chatId);

if (!yaExiste) {
const wallets = [
"BazZ5tU7HuQs6dsFGqGGAC3DCGw4aFH3P9WKmnEzHMfW",
"2V7851VeUqr6NbRh1zdyufTB9YGT1CRNbWPUfmSSbWG1",
"GLK44T7P8VijYE17gk5xq1DSMF29yeCQJdHNvJQsnaFX",
"5FSEaYF9KaVgu7e9Ayj4Bb6ZD74rFyAgxA25BJzp9Zvp",
"68xZpYEAbkbWcLUgW1uKBxhBGEpzZacBxmLCBnGkN11",
"J6su88MkukxeuYh6GUB3hZtN7Tw3xkytaiEAzXj1sUEp",
"71RXPo66Ydre79q2MSUehHgh56auHWodFpnV692vzFmW"
];
const walletAsignada = wallets[Math.floor(Math.random() * wallets.length)];
const fechaCR = Utilities.formatDate(new Date(), "GMT-6", "dd MMM yyyy, HH:mm");

// Prevenir auto-referencia
if (referralId && referralId == chatId.toString()) {
referralId = null;
}

// Asignar referidor predeterminado si no se proporciona uno
if (!referralId) {
referralId = "732874249"; // Reemplaza con el chat_id del administrador
}

// Añadir al registro del usuario con historial_depositos y historial_retiros en 0 por defecto
hoja.appendRow([
chatId, username, firstName, fechaCR, walletAsignada,
0, 0, "0", "0", "No", referralId, 0, 0, 0, 0, 0, 0
]);

Logger.log("Usuario registrado correctamente con chatId: " + chatId);
const mensaje = `
🎉 *Registro exitoso en Core Capital DEX*

👤 Nombre: *${firstName}*
📅 Fecha de registro: *${fechaCR}*

🔐 *Tu Wallet DEX privada ha sido asignada:*
\`${walletAsignada}\`

💡 *¿Qué sigue?*
Realiza tu primer depósito para activar tu cuenta y comenzar a generar rendimientos.

🚀 *Confianza, tecnología y rentabilidad al alcance de un clic.*
`;

const keyboard = {
inline_keyboard: [
[{ text: "💸 Depositar", callback_data: "depositar" }],
[{ text: "🔙 Volver al menú", callback_data: "volver_menu" }]
]
};

sendMessage(chatId, mensaje, keyboard); // Enviar el mensaje con el teclado inline

// Si tiene un referidor, actualizar su información
if (referralId) {
actualizarReferido(referralId);
}
} else {
sendMessage(chatId, "✅ Ya estás registrado en el sistema, usa los botones para ver las funcionalidades del Bot.");
}
}



// ==============================
// TODO SOBRE GANANCIAS
// ==============================

/// ==============================
// CIERRE DE MES COMPLETO
// ==============================
function cierreDeMesCompleto() {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = sheet.getDataRange().getValues();

let datosParaMensajes = []; // Guardamos info temporalmente

try {
// 1. Guardar datos antes de modificar
for (let i = 1; i < data.length; i++) {
const chatId = data[i][COLUMNAS.CHAT_ID];
const gananciasTrading = data[i][COLUMNAS.GANANCIAS_TRADING] || 0;
const gananciasReferidos = data[i][COLUMNAS.GANANCIAS_REFERIDOS] || 0;
const bonoAdministrador = data[i][COLUMNAS.BONO_ADMINISTRADOR] || 0;
const montoInvertido = data[i][COLUMNAS.MONTO_INVERTIDO] || 0;

datosParaMensajes.push({
chatId,
gananciasTrading,
gananciasReferidos,
bonoAdministrador,
montoInvertido
});
}

// 2. Actualizar ganancias acumuladas y pendiente de retiro, resetear
for (let i = 1; i < data.length; i++) {
const historialGananciasAcumuladas = data[i][COLUMNAS.HISTORIAL_GANANCIAS_ACUMULADAS] || 0;
const pendienteDeRetiro = data[i][COLUMNAS.PENDIENTE_RETIRO] || 0;
const gananciasMensuales = data[i][COLUMNAS.GANANCIAS_MENSUALES] || 0;
const gananciasReferidos = data[i][COLUMNAS.GANANCIAS_REFERIDOS] || 0;
const bonoAdministrador = data[i][COLUMNAS.BONO_ADMINISTRADOR] || 0;

const gananciasTotalesAcumuladas = historialGananciasAcumuladas + gananciasMensuales + gananciasReferidos + bonoAdministrador;
const nuevoPendienteDeRetiro = pendienteDeRetiro + gananciasMensuales + gananciasReferidos + bonoAdministrador;

sheet.getRange(i + 1, COLUMNAS.HISTORIAL_GANANCIAS_ACUMULADAS + 1).setValue(gananciasTotalesAcumuladas);
sheet.getRange(i + 1, COLUMNAS.PENDIENTE_RETIRO + 1).setValue(nuevoPendienteDeRetiro);

// Resetear ganancias
sheet.getRange(i + 1, COLUMNAS.GANANCIAS_MENSUALES + 1).setValue(0);
sheet.getRange(i + 1, COLUMNAS.GANANCIAS_REFERIDOS + 1).setValue(0);
sheet.getRange(i + 1, COLUMNAS.BONO_ADMINISTRADOR + 1).setValue(0);
}

// 3. Enviar mensajes de cierre de mes
for (const usuario of datosParaMensajes) {
const { chatId, gananciasTrading, gananciasReferidos, bonoAdministrador, montoInvertido } = usuario;

let rentabilidadReal = 0;
if (montoInvertido > 0) {
rentabilidadReal = (gananciasTrading / montoInvertido) * 100;
}

const mensajeFinal = "📊 *Cierre de Mes* - Este mes se logró una rentabilidad de *" + rentabilidadReal.toFixed(2) + "%* por trading.\n" +
"*Rentabilidad por Trading:* $" + gananciasTrading.toFixed(2) + "\n" +
"*Ganancias por Referidos:* $" + gananciasReferidos.toFixed(2) + "\n" +
"*Bono del Administrador:* $" + bonoAdministrador.toFixed(2);

sendMessage(chatId, mensajeFinal);
}

Logger.log('✅ Cierre de mes completo realizado correctamente.');

} catch (error) {
Logger.log('❌ Error durante el cierre de mes: ' + error.message);
}
}

/// ==============================
// CREAR TRIGGER
// ==============================
function crearTriggerCierreMes() {
try {
// Verificar si ya existe el trigger
const triggers = ScriptApp.getProjectTriggers();
const existe = triggers.some(trigger => trigger.getHandlerFunction() === 'cierreDeMesCompleto');

if (existe) {
Logger.log('El trigger ya está creado.');
return;
}

// Crear nuevo trigger
ScriptApp.newTrigger('cierreDeMesCompleto')
.timeBased()
.onMonthDay(ultimoDiaHabil()) // Último día hábil
.atHour(11) // A las 11:00 AM
.create();

Logger.log('✅ Trigger de cierre de mes creado.');

} catch (error) {
Logger.log('❌ Error al crear el trigger: ' + error.message);
}
}

/// ==============================
// ULTIMO DIA HABIL
// ==============================
function ultimoDiaHabil() {
const fecha = new Date();
let ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0); // Último día del mes

// Ajustar si el último día es sábado o domingo
if (ultimoDia.getDay() === 0) { // Domingo
ultimoDia.setDate(ultimoDia.getDate() - 2);
} else if (ultimoDia.getDay() === 6) { // Sábado
ultimoDia.setDate(ultimoDia.getDate() - 1);
}

return ultimoDia.getDate(); // Solo el número del día
}


/// ==============================
// INSTRUCCIONES PARA DEPÓSITO
// ==============================
function mostrarInstruccionesDeposito(chatId) {
const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = hoja.getDataRange().getValues();

for (let i = 1; i < data.length; i++) {
if (data[i][COLUMNAS.CHAT_ID] == chatId) { // Usamos COLUMNAS.CHAT_ID para verificar el chatId
const wallet = data[i][COLUMNAS.WALLET_ASIGNADA]; // Usamos COLUMNAS.WALLET_ASIGNADA para obtener la wallet

const mensaje = `
💸 *Paso 1: Depósito inicial en Core Capital DEX*

🔐 *Tu wallet exclusiva asignada es:*
\`${wallet}\`

📥 *Monto mínimo:* *2 SOL*
🔗 Para saber el valor aproximado de 2 SOL en USDT, puedes ver la conversión aquí: [Consulta de Solana en USDT](https://www.coingecko.com/es/converter)

🚨 *Importante:* Solo se aceptan depósitos en la red *Solana (SOL)*. El envío incorrecto de activos puede ocasionar pérdida de fondos.

🧾 Luego de realizar el depósito, presioná el botón *Ya deposité* para confirmar tu transacción.
`;

const keyboard = {
inline_keyboard: [
[{ text: "✅ Ya deposité", callback_data: "ya_deposite" }],
[{ text: "🔙 Volver al menú", callback_data: "volver_menu" }]
]
};

sendMessage(chatId, mensaje, keyboard);
return;
}
}

sendMessage(chatId, "⚠️ Aún no estás registrado. Usá /registrar para comenzar.");
}


// ==============================
// COMPROBACIÓN DE DEPÓSITO Y VALIDACIÓN
// ==============================
function comprobarValidacion(chatId) {
try {
const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = hoja.getDataRange().getValues();

// Buscar al usuario por su chatId
for (let i = 1; i < data.length; i++) {
if (data[i][COLUMNAS.CHAT_ID] == chatId) { // Verificamos el chatId usando la constante global
const validacion = data[i][COLUMNAS.VALIDACION] || "No"; // Usamos COLUMNAS.VALIDACION para obtener el valor de validación

// Mensaje en función de si el depósito está validado o no
if (validacion.toLowerCase() === "si") {
sendMessage(chatId, "✅ *Tu depósito ha sido validado correctamente.* Desde este momento ya estás produciendo rendimientos. Recuerda referir a todos tus amigos por WhatsApp y Telegram.");
} else {
sendMessage(chatId, "⌛ *Tu depósito está pendiente de validación.* Será procesado manualmente pronto. Te notificaremos cuando se valide.");
}
return; // Salir del ciclo una vez encontrado el usuario
}
}

// Si no se encuentra al usuario, informamos de que no está registrado
sendMessage(chatId, "⚠️ *No estás registrado aún.* Usa /registrar para comenzar y obtener tu wallet.");

} catch (error) {
Logger.log('Error al comprobar la validación del depósito: ' + error.message);
sendMessage(chatId, "🚨 Hubo un problema al procesar tu validación de depósito. Intenta nuevamente más tarde.");
}
}


// ==============================
// WALLET
// ==============================
function mostrarWallet(chatId) {
const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = hoja.getDataRange().getValues();

// Recorremos todas las filas para encontrar la correspondiente al chatId
for (let i = 1; i < data.length; i++) {
if (data[i][COLUMNAS.CHAT_ID] == chatId) { // Usamos COLUMNAS.CHAT_ID para verificar el chatId
const nombre = data[i][COLUMNAS.NOMBRE]; // Usamos COLUMNAS.NOMBRE para obtener el nombre
const wallet = data[i][COLUMNAS.WALLET_ASIGNADA]; // Usamos COLUMNAS.WALLET_ASIGNADA para obtener la wallet
const montoInvertido = data[i][COLUMNAS.MONTO_INVERTIDO]; // Usamos COLUMNAS.MONTO_INVERTIDO para obtener el monto invertido
const montoRetirado = data[i][COLUMNAS.MONTO_RETIRO]; // Usamos COLUMNAS.MONTO_RETIRO para obtener el monto retirado
const fechaRegistro = data[i][COLUMNAS.FECHA_REGISTRO]; // Usamos COLUMNAS.FECHA_REGISTRO para obtener la fecha de registro
const historialDepositos = data[i][COLUMNAS.HISTORIAL_DEPOSITOS] || "🔸 Sin registros aún."; // Usamos COLUMNAS.HISTORIAL_DEPOSITOS para obtener el historial de depósitos
const historialRetiros = data[i][COLUMNAS.HISTORIAL_RETIROS] || "🔸 Sin retiros aún."; // Usamos COLUMNAS.HISTORIAL_RETIROS para obtener el historial de retiros
const gananciasMensuales = data[i][COLUMNAS.GANANCIAS_MENSUALES] || 0; // Usamos COLUMNAS.GANANCIAS_MENSUALES para obtener las ganancias mensuales
const gananciasPorReferidos = data[i][COLUMNAS.GANANCIAS_REFERIDOS] || 0; // Usamos COLUMNAS.GANANCIAS_REFERIDOS para obtener las ganancias por referidos
const pendienteDeRetiro = data[i][COLUMNAS.PENDIENTE_RETIRO] || 0; // Usamos COLUMNAS.PENDIENTE_RETIRO para obtener el pendiente de retiro

// Crear el mensaje con los nuevos datos
const mensaje = `
🧾 *WALLET-DEFI - PANEL DE USUARIO*

━━━━━━━━━━━━━━━━━━━
👤 *Usuario:*
${nombre}

🆔 *Fecha de Registro:*
${fechaRegistro}

🔐 *Wallet DEX asignada:*
\`${wallet}\` *(copiar fácilmente)*

━━━━━━━━━━━━━━━━━━━
💰 *Resumen de Ganancias:*

▪️ *Ganancia Mensual:* *${gananciasMensuales} USDT*
▪️ *Ganancia por Referidos:* *${gananciasPorReferidos} USDT*

━━━━━━━━━━━━━━━━━━━
💸 *Pendiente de Retiro:* *${pendienteDeRetiro} USDT*

━━━━━━━━━━━━━━━━━━━
💼 *Resumen de Capital:*

▪️ Invertido: *${montoInvertido} SOL*
▪️ Retirado: *${montoRetirado} USDT*

━━━━━━━━━━━━━━━━━━━
📥 *Historial de Depósitos:*
${historialDepositos}

📤 *Historial de Retiros:*
${historialRetiros}

━━━━━━━━━━━━━━━━━━━
🔎 *Tu inversión está siendo gestionada con estrategias IA bajo control DEFI privado.*

Seleccioná una acción:
`;

const keyboard = {
inline_keyboard: [
[{ text: "💸 Realizar Depósito", callback_data: "depositar" }],
[{ text: "🔄 Comprobar Validación (Depósitos)", callback_data: "comprobar_validacion" }],
[{ text: "📤 Retiros", callback_data: "retiros" }],
[{ text: "🔙 Volver al menú", callback_data: "volver_menu" }]
]
};

sendMessage(chatId, mensaje, keyboard); // Enviar mensaje con teclado
return; // Salir de la función una vez encontrado el chatId
}
}

// Si no se encuentra el chatId, se avisa al usuario
sendMessage(chatId, "⚠️ *No estás registrado aún.* Usa /registrar para obtener tu wallet.");
}

// ==============================
// RECOMPENSAS
// ==============================

function sendRewardsMessage(chat_id, message_id) {
Logger.log("Enviando mensaje de recompensas a: " + chat_id);

const bot_username = 'CoreCapitalDeX_bot'; // Nombre de usuario de tu bot sin '@'
const url = `https://api.telegram.org/bot${TOKEN}/editMessageText`;
const referral_link = `https://t.me/${bot_username}?start=${chat_id}`;

// Acceder a la hoja de cálculo y obtener la wallet asignada
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = sheet.getDataRange().getValues();
let wallet = 'Wallet no registrada';
let gananciasDolares = 0;
let bonoAdministrador = 0;
let usuariosReferidos = 0;

// Buscar la wallet de usuario y el bono del administrador en la hoja de cálculo
for (let i = 1; i < data.length; i++) {
if (data[i][COLUMNAS.CHAT_ID] == chat_id) {
wallet = data[i][COLUMNAS.WALLET_ASIGNADA]; // Columna E (índice 4)
// Calcular el 10% de las ganancias mensuales para ganancias por referidos
const gananciasMensuales = data[i][COLUMNAS.GANANCIAS_MENSUALES]; // Columna O (índice 14)
gananciasDolares = gananciasMensuales * 0.10; // Ganancias por referidos como el 10% de las ganancias mensuales

bonoAdministrador = data[i][COLUMNAS.BONO_ADMINISTRADOR]; // Columna N (índice 13)
usuariosReferidos = data[i][COLUMNAS.USUARIOS_REFERIDOS]; // Columna L (índice 11)
break;
}
}

const text = `🔄 *Usuarios referidos:* ${usuariosReferidos}

💰 *Ganancias por referencia:* $${gananciasDolares.toFixed(2)}

💵 *Bono del Administrador:* $${bonoAdministrador.toFixed(2)}

⚠️ *Importante:* Al final de cada mes, todas las ganancias por referidos y el bono del administrador se reinician y se suman al *Pendiente de Retiro*. Puedes revisar ese monto en tu *WALLET DEX*.

🚀 Comparte tu enlace de referencia y gana el 10% en comisiones de swap de los usuarios que hagan clic en tu enlace. Retira tus ganancias usando tu Wallet de Recompensas.

📍 *Wallet de Recompensas:* \`${wallet}\``;

const keyboard = {
inline_keyboard: [
[
{ text: "👉 Tu Link", callback_data: "mostrar_link_referido" },
{ text: "💡 Más información", callback_data: "info" }
],
[
{ text: "💰 Solicita tu bono administrador", callback_data: "bono" },
{ text: "🔙 Volver al Menú", callback_data: "volver_menu" }
]
]
};

// Enviar el mensaje de recompensas con el teclado de opciones
sendMessage(chat_id, text, keyboard);
}

// ==============================
// LINK DE REFERIDO
// ==============================

function linkreferido(callbackQuery) {
const chatId = callbackQuery.message.chat.id; // Obtienes el chatId del usuario
const callbackData = callbackQuery.data; // Obtienes la data del callback

// Solo se ejecuta si el callbackData es "mostrar_link_referido"
if (callbackData === "mostrar_link_referido") {
const bot_username = "CoreCapitalDeX_bot"; // Aquí debes poner el nombre de tu bot
const referralLink = `https://t.me/${bot_username}?start=${chatId}`; // Link de referido con chatId del usuario

// Mensaje que será enviado al usuario
const message = `🎁 *¡Aquí tienes tu link de referido!*\n\n
👉 *Copia este enlace y compártelo con tus amigos para comenzar a ganar recompensas:*\n\n
\` ${referralLink} \`\n\n
🌟 *¡Invita ahora y comienza a ganar recompensas!*\n`;

// Opciones para el mensaje con teclado (botón para volver al menú)
const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId, // A quién se envía el mensaje
text: message, // El texto del mensaje
parse_mode: "Markdown", // El formato del mensaje (Markdown para que los estilos de texto funcionen)
reply_markup: {
inline_keyboard: [
[{ text: "🔙 Volver al Menú", callback_data: "volver_menu" }] // Botón para volver al menú
]
}
})
};

// Enviar el mensaje usando la API de Telegram
UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}
}

// ==============================
// RECOGE EL ID DE REFERIDOR
// ==============================
function onStartCommand(chatId, message) {
const parts = message.text.split(" ");
const referralId = parts.length > 1 ? parts[1] : null;
registrarUsuario(chatId, message.from.username, message.from.first_name, referralId);
}

// ==============================
// ACTUALIZA REFERIDO (VERSIÓN CORREGIDA)
// ==============================
function actualizarReferido(referralId) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("usuarios");
const data = sheet.getDataRange().getValues();

if (!referralId) {
Logger.log('Error: No se proporcionó un referidor válido.');
return;
}

let totalGananciasReferidos = 0; // Total de 10% de todos los referidos
let cantidadReferidos = 0; // Cantidad total de usuarios referidos

// Primero recorrer todos los usuarios para sumar las ganancias de los que tienen como referido este chatId
for (let i = 1; i < data.length; i++) {
const referidoPor = data[i][COLUMNAS.REFERIDO_POR]; // Supongo tienes una columna donde guardas el ID del referidor

if (referidoPor == referralId) {
const gananciasMensuales = data[i][COLUMNAS.GANANCIAS_MENSUALES]; // Columna de ganancias mensuales

if (!isNaN(gananciasMensuales) && gananciasMensuales !== undefined && gananciasMensuales !== null) {
totalGananciasReferidos += gananciasMensuales * 0.10; // Sumar el 10% de cada uno
}
cantidadReferidos++;
}
}

if (cantidadReferidos === 0) {
Logger.log('⚠️ Este referidor aún no tiene referidos registrados.');
return;
}

// Ahora buscar la fila del referidor original para actualizarle sus datos
for (let i = 1; i < data.length; i++) {
if (data[i][COLUMNAS.CHAT_ID] == referralId) { // Buscar el referidor en la hoja
// Actualizar la cantidad de referidos
sheet.getRange(i + 1, COLUMNAS.USUARIOS_REFERIDOS + 1).setValue(cantidadReferidos);

// Actualizar las ganancias totales por referidos
sheet.getRange(i + 1, COLUMNAS.GANANCIAS_REFERIDOS + 1).setValue(totalGananciasReferidos);

Logger.log(`✅ Referidor ${referralId} actualizado: ${cantidadReferidos} referidos y ${totalGananciasReferidos} ganancias.`);
break;
}
}
}


// ==============================
// MOSTRAR DATOS DE RETIRO
// ==============================

function manejarRetiro(chatId) {
const mensaje = `
💼 *Solicitud de Retiro – Core Capital DEX*

Al operar sobre un entorno *DEFI (Finanzas Descentralizadas)*, tu capital se mantiene de forma activa en *wallets inteligentes* conectadas a protocolos DEX. Esto permite que tus fondos participen continuamente en operaciones de trading algorítmico.

🔒 *¿Por qué existe un bloqueo temporal de 24 horas?*
Con el objetivo de garantizar la integridad de las operaciones en curso y la seguridad de los fondos, toda solicitud de retiro activa un *bloqueo programado de 24 horas*. Este tiempo permite cerrar las posiciones activas de manera ordenada antes de liberar el capital.

⚙️ *Procedimiento de retiro:*
1. Completa el formulario haciendo clic en *"🔗 Solicitar Retiro"*.
2. Proporciona tu nombre, correo, número telefónico, dirección USDT de la red TON y tu usuario de Telegram.
3. Activa tu *wallet de Telegram* (TON Space o compatible) para poder recibir los fondos.
4. Valida si deseas retirar capital, ganancias o fondos pendientes; descríbelo claramente en el formulario.
5. El sistema procesará automáticamente tu solicitud dentro del plazo indicado. Si se detecta alguna inconsistencia, nuestro equipo se comunicará contigo.

📌 *¿Qué puedes retirar?*
Al finalizar cada ciclo mensual, tendrás disponibles:
• *Ganancias por trading automatizado*
• *Bonificaciones por referidos activos*
• *Bono administrativo* (si aplica)

El *capital inicial* puede retirarse en cualquier momento, pero las *ganancias* estarán habilitadas únicamente al cierre del mes correspondiente.

📜 *Recomendación Técnica:*
Antes de solicitar un retiro, te recomendamos revisar las *Políticas de Retiro* para comprender a fondo los términos operativos y evitar contratiempos.

📞 Para más información o asistencia personalizada, contacta con nuestro equipo de soporte.
`;


// Definición de los botones inline, con los nuevos botones añadidos
const keyboard = {
inline_keyboard: [
[{ text: "🔗 Solicitar Retiro", url: "https://forms.gle/vLcJXnHg5eTqLs2q8" }],
[{ text: "📋 Estado de Solicitud", callback_data: "estado_retiro" }],
[{ text: "💰 Historial de Retiros", callback_data: "historial_retiros" }],
[{ text: "📋 Wallet Telegram?", callback_data: "wallet_telegram" }],
[{ text: "📜 Políticas de Retiro", callback_data: "politicas_retiro" }],
[{ text: "🔙 Volver al menú", callback_data: "volver_menu" }]
]
};

// Enviar el mensaje al usuario con los botones
const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId,
text: mensaje,
parse_mode: "Markdown",
reply_markup: keyboard // Aquí se agregan los botones inline
})
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}

// ==============================
// FUNCION PARA VER EL ESTADO DE LA SOLICITUD DE RETIRO
// ==============================

function manejarEstadoRetiro(chatId, username) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Solicitudes de Retiros');
const data = sheet.getDataRange().getValues(); // Obtener todos los datos

// Buscar la solicitud del usuario
for (let i = 0; i < data.length; i++) {
const nombre = data[i][1]; // Columna B (Nombre Completo)
const estado = data[i][9]; // Columna J (Estado de Solicitud)

if (nombre === username) {
// Si el estado es "Sí" o "No" le enviamos el mensaje correspondiente
if (estado === 'Sí') {
sendMessage(chatId, "✅ Tu solicitud de retiro ha sido procesada.");
} else if (estado === 'No') {
sendMessage(chatId, "⌛ Tu solicitud está en proceso. Por favor espera.");
}
return;
}
}
sendMessage(chatId, "❓ No se encontró tu solicitud de retiro.");
}

// ==============================
// FUNCION PARA VER EL HISTORIAL DE Retiros
// ==============================

function manejarHistorialRetiros(chatId, username) {
const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Solicitudes de Retiros');
const data = sheet.getDataRange().getValues(); // Obtener todos los datos

let historial = "📜 *Historial de Retiros:*\n\n";

// Filtrar y mostrar todos los retiros del usuario
for (let i = 0; i < data.length; i++) {
const nombre = data[i][1]; // Columna B (Nombre Completo)
const wallet = data[i][4]; // Columna E (Wallet USDT)
const monto = data[i][6]; // Columna G (Monto solicitado)
const usernameTelegram = data[i][8]; // Columna I (Username de Telegram)

if (nombre === username) {
historial += `🔹 *Monto*: ${monto} USDT\n`;
historial += `🔹 *Wallet*: ${wallet}\n`;
historial += `🔹 *Username Telegram*: ${usernameTelegram}\n\n`;
}
}

if (historial === "📜 *Historial de Retiros:*\n\n") {
historial += "❌ No has realizado retiros aún.";
}

sendMessage(chatId, historial);
}

// ==============================
// FUNCION DE ENVIO DE MENSAJE
// ==============================

function sendMessage(chatId, text, keyboard = null) {
const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId,
text: text,
parse_mode: "Markdown",
reply_markup: keyboard ? keyboard : {}
})
};
UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}


// ==============================
// Función para mostrar Políticas de Retiro con botón de regreso a la wallet
// ==============================

function mostrarPoliticasDeRetiro(chatId) {
const mensajePoliticas = `
📑 *Políticas de Retiro*

1. **Tiempo de Procesamiento**: Los retiros son procesados de manera automática dentro de las 24 horas posteriores a la solicitud, si no hay errores en los datos proporcionados.
2. **Bloqueo de 24 horas**: Los fondos están bloqueados durante 24 horas para garantizar que las operaciones de trading se cierren correctamente antes de que el retiro sea procesado.

3. **Comisiones de Retiro**: El sistema podría cobrar una pequeña comisión dependiendo de la red utilizada para el retiro (USDT TON). Asegúrate de revisar las condiciones antes de hacer el retiro porque las comisiones las paga el usuario.

4. **Validación de Datos**: Antes de realizar cualquier solicitud de retiro, asegúrate de revisar tus datos personales y de wallet. Los errores en los datos pueden retrasar el proceso de retiro.

5. **Capacidad de Retiro**: Los fondos que están operando dentro del sistema DEFI no son retirables de inmediato. Asegúrate de tener fondos disponibles para el retiro en la wallet antes de hacer la solicitud.

6. **Capital Semilla**: El capital semilla puede ser retirado en cualquier momento, siempre y cuando no haya operaciones activas dentro del DEX (Intercambio Descentralizado). Si el capital está siendo utilizado en operaciones activas, necesitarás esperar a que estas finalicen antes de poder retirar ese capital.

7. **Soporte**: Si tienes alguna duda o un problema con tu solicitud, por favor contacta a nuestro equipo de soporte para resolverlo lo más rápido posible.

💬 *Recuerda que todo el proceso está automatizado para tu comodidad y seguridad.*
`;

// Botón de regreso a la wallet
const keyboardPoliticas = {
inline_keyboard: [
[{ text: "🔙 Regresar a la Wallet", callback_data: "wallet" }]
]
};

sendMessage(chatId, mensajePoliticas, keyboardPoliticas);
}

function mostrarGuiaWalletTelegram(chatId) {
const mensajeWalletTelegram = `📚 Guía para activar tu Wallet de Telegram y obtener tu dirección USDT (TON)

━━━━━━━━━━━━━━━━━━━

1️⃣ Busca el bot oficial @wallet en Telegram.
🔎 Escribe wallet en la barra de búsqueda y selecciona el bot con ícono de billetera.

2️⃣ Inicia el bot pulsando "Start" y acepta los términos de uso para activar tu Wallet de Telegram.

3️⃣ Dentro de la Wallet de Telegram:
📥 Pulsa "Receive" ➔ elige "USDT" como la criptomoneda a recibir.

4️⃣ Copia tu dirección USDT.
🔗 Esa es la dirección que deberás colocar en el Formulario de Retiro.

━━━━━━━━━━━━━━━━━━━

⚠️ Importante:
- Asegúrate de elegir USDT en la red TON (no Ethereum o Tron).
- Tu dirección suele empezar con EQ... (esto es normal en la red TON).
- Si tu Wallet no está activada, no podremos procesar tu retiro.

━━━━━━━━━━━━━━━━━━━

✅ Resumen rápido:
🔹 Activa @wallet ➔
🔹 Pulsa Receive ➔
🔹 Elige USDT ➔
🔹 Copia y pega tu dirección en el formulario.

━━━━━━━━━━━━━━━━━━━

🚀 ¡Listo! Ahora podés solicitar tu retiro de forma segura.`;

const keyboard = {
inline_keyboard: [
[{ text: "🔙 Ir a la Wallet", callback_data: "wallet" }]
]
};

sendMessage(chatId, mensajeWalletTelegram, keyboard);
}


// ==============================
// POR QUE CORE DEX
// ==============================

function manejarPorQueCoreDex(chatId) {
const mensaje = `
🔍 *¿Por qué elegir Core Capital DEX?*

🚀 _Core Capital DEX_ no es solo una plataforma de inversión. Es una experiencia diseñada para ofrecerte:

💹 *Rentabilidad realista y sostenible*
Con promedios mensuales entre *7% y 25%*, gracias a estrategias de IA trading y control de riesgo avanzado.

🔐 *Acceso a una wallet DEX privada*
Tu capital opera en un entorno DEFI y transparente. Sin custodia de terceros, con auditoría interna constante.

⏳ *Retiros automatizados con espera de 24h*
Así aseguramos que tu capital no esté comprometido en operaciones activas y protegemos la estabilidad del fondo.

📊 *Seguimiento personalizado semanal*
Recibí informes sobre el rendimiento de tu inversión y el estado del mercado.

🧠 *Soporte humano profesional*
Un equipo real que te acompaña en todo momento vía Telegram o correo.

💼 Core Capital DEX: Donde la inversión en cripto es privada, profesional y personalizada.

Seleccioná *una opción del menú* para seguir 🚀
`;

// Definición de los botones inline: Legalidad, Soporte y Regresar
const inlineKeyboard = {
inline_keyboard: [
[
{
text: "Legalidad",
callback_data: "legalidad" // Acción para mostrar información legal
},
{
text: "Soporte",
callback_data: "soporte" // Acción para mostrar información de contacto de soporte
}
],
[
{
text: "Regresar al menú",
callback_data: "volver_menu" // Acción para regresar al menú principal
}
]
]
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId,
text: mensaje,
parse_mode: "Markdown",
reply_markup: inlineKeyboard // Aquí se agregan los botones inline
})
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}

// ==============================
// SOPORTE
// ==============================


function manejarComandoSoporte(chatId) {
const mensaje = "📞 Contacto: @TuUsuarioSoporte o soporte@corecapital.group";

// Definición del botón inline "Volver al menú"
const inlineKeyboard = {
inline_keyboard: [
[
{
text: "Volver al menú",
callback_data: "volver_menu" // Acción para regresar al menú
}
]
]
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId,
text: mensaje,
parse_mode: "Markdown",
reply_markup: inlineKeyboard // Aquí se agregan los botones inline
})
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}

// ==============================
// LEGALIDAD
// ==============================

function manejarComandoLegalidad(chatId) {
const mensaje = `
⚖️ *Información Legal y Descargo de Responsabilidad*

Core Capital Dex opera como una firma privada de trading en criptomonedas, asociada con entidades de tipo DEFI.

*Este servicio no constituye una recomendación financiera, ni una oferta pública de inversión.* Todos los fondos gestionados son de carácter privado y bajo acuerdo directo con el inversionista.

_La rentabilidad pasada no garantiza resultados futuros._ El uso de este bot implica la aceptación de estos términos.

Para más información, contáctenos vía /soporte.
`;

// Definición de los botones inline: "Volver al menú"
const inlineKeyboard = {
inline_keyboard: [
[
{
text: "Volver al menú",
callback_data: "volver_menu" // Acción para regresar al menú
}
]
]
};

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify({
chat_id: chatId,
text: mensaje,
parse_mode: "Markdown",
reply_markup: inlineKeyboard // Aquí se agregan los botones inline
})
};

UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);
}

// ==============================
// ENVÍO DE MENSAJES
// ==============================
function sendMessage(chatId, text, keyboard = null) {
const payload = {
chat_id: chatId,
text: text,
parse_mode: "Markdown"
};

if (keyboard) {
payload.reply_markup = keyboard;
}

const options = {
method: "post",
contentType: "application/json",
payload: JSON.stringify(payload)
};

const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, options);

if (response.getResponseCode() !== 200) {
throw new Error(`Error al enviar mensaje: ${response.getContentText()}`);
}
}