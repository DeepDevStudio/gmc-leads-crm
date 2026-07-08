const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const AUTH_DIR = './baileys_auth';
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR);
}

const connections = new Map();
const qrCodes = new Map();
const memberStatus = new Map();
const memberNumbers = new Map();
const MEMBERS = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];

const PORT = 6001;
const wss = new WebSocket.Server({ port: PORT });
console.log(`🔄 WhatsApp WebSocket server running on port ${PORT}`);

function assignNumberToMember(memberName, phoneNumber) {
    if (!memberName || !phoneNumber) return false;
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const finalNumber = cleaned.length === 10 ? '91' + cleaned : cleaned;
    memberNumbers.set(memberName, finalNumber);
    console.log(`📞 ASSIGNED: ${memberName} -> ${finalNumber}`);
    return true;
}

function getMemberNumber(memberName) {
    return memberNumbers.get(memberName) || null;
}

async function cleanupMember(memberName) {
    console.log(`🧹 Cleaning up ${memberName}...`);
    try {
        const authPath = path.join(AUTH_DIR, `member_${memberName.replace(' ', '_')}`);
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log(`🗑️ Deleted auth folder for ${memberName}`);
        }
    } catch (e) {}
    
    const sock = connections.get(memberName);
    if (sock) {
        try { await sock.logout(); } catch (e) {}
        connections.delete(memberName);
    }
    qrCodes.delete(memberName);
    memberStatus.set(memberName, 'disconnected');
    return { success: true };
}

async function connectMember(memberName) {
    console.log(`📱 Connecting ${memberName}...`);
    const authPath = path.join(AUTH_DIR, `member_${memberName.replace(' ', '_')}`);
    
    try {
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log(`🗑️ Deleted old auth for ${memberName}`);
        }
        
        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        const sock = makeWASocket({
            auth: state,
            browser: ['GMC CRM', 'Chrome', '1.0.0'],
            version: [2, 3000, 1035194821],
            markOnlineOnConnect: true,
            qrTimeout: 120000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            patchMessageBeforeSending: (msg) => {
                const requiresPatch = !!(
                    msg.buttonsMessage || 
                    msg.templateMessage || 
                    msg.listMessage
                );
                if (requiresPatch) {
                    msg = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...msg,
                            },
                        },
                    };
                }
                return msg;
            },
        });

        connections.set(memberName, sock);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`📱 QR code generated for ${memberName}`);
                console.log(`📱 QR Data: ${qr.substring(0, 50)}...`);
                
                qrCodes.set(memberName, qr);
                memberStatus.set(memberName, 'qr');
                
                const qrMessage = JSON.stringify({
                    type: 'qr',
                    member: memberName,
                    qr: qr
                });
                
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(qrMessage);
                    }
                });
                console.log(`✅ QR broadcasted to ${wss.clients.size} clients`);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log(`❌ ${memberName} disconnected (${statusCode})`);
                
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 515 || statusCode === 428) {
                    connections.delete(memberName);
                    qrCodes.delete(memberName);
                    memberStatus.set(memberName, 'disconnected');
                    
                    try {
                        if (fs.existsSync(authPath)) {
                            fs.rmSync(authPath, { recursive: true, force: true });
                        }
                    } catch (e) {}
                    
                    broadcastToClients({
                        type: 'logged_out',
                        member: memberName,
                        reason: `Disconnected (${statusCode})`
                    });
                } else {
                    connections.delete(memberName);
                    qrCodes.delete(memberName);
                    setTimeout(() => connectMember(memberName), 10000);
                }
            }

            if (connection === 'open') {
                const phoneNumber = sock.user?.id?.split(':')[0] || 'Unknown';
                console.log(`✅ ${memberName} connected successfully! Phone: ${phoneNumber}`);
                qrCodes.delete(memberName);
                memberStatus.set(memberName, 'connected');
                broadcastToClients({
                    type: 'authenticated',
                    member: memberName,
                    whatsapp_number: phoneNumber
                });
            }
        });

        sock.ev.on('creds.update', saveCreds);
        return sock;

    } catch (error) {
        console.error(`❌ Error connecting ${memberName}:`, error.message);
        return null;
    }
}

async function sendWhatsAppMessage(memberName, phoneNumber, message, attachment, attachment_name, attachment_type) {
    console.log(`📤 Sending to ${memberName} -> ${phoneNumber}`);
    
    if (attachment) {
        console.log(`📎 Attachment: ${attachment_name} (${attachment_type})`);
    }
    
    const sock = connections.get(memberName);
    if (!sock) {
        return { success: false, error: `${memberName} is not connected` };
    }

    try {
        let formattedNumber = phoneNumber;
        if (!phoneNumber.includes('@s.whatsapp.net')) {
            formattedNumber = `${phoneNumber}@s.whatsapp.net`;
        }
        
        let sendResult;
        
        if (attachment && attachment_type === 'image') {
            const imageBuffer = Buffer.from(attachment, 'base64');
            sendResult = await sock.sendMessage(formattedNumber, {
                image: imageBuffer,
                caption: message || '',
                mimetype: 'image/jpeg'
            });
        } else if (attachment && attachment_type === 'pdf') {
            const pdfBuffer = Buffer.from(attachment, 'base64');
            sendResult = await sock.sendMessage(formattedNumber, {
                document: pdfBuffer,
                caption: message || '',
                mimetype: 'application/pdf',
                fileName: attachment_name || 'document.pdf'
            });
        } else if (attachment) {
            const fileBuffer = Buffer.from(attachment, 'base64');
            sendResult = await sock.sendMessage(formattedNumber, {
                document: fileBuffer,
                caption: message || '',
                fileName: attachment_name || 'file'
            });
        } else {
            sendResult = await sock.sendMessage(formattedNumber, { text: message });
        }

        broadcastToClients({
            type: 'message_sent',
            member: memberName,
            recipient: phoneNumber
        });

        return { success: true, result: sendResult };
        
    } catch (error) {
        console.error(`❌ Failed to send:`, error.message);
        return { success: false, error: error.message };
    }
}

async function logoutMember(memberName) {
    const sock = connections.get(memberName);
    try {
        if (sock) {
            const authPath = path.join(AUTH_DIR, `member_${memberName.replace(' ', '_')}`);
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
            try { await sock.logout(); } catch (e) {}
            connections.delete(memberName);
        }
        qrCodes.delete(memberName);
        memberStatus.set(memberName, 'disconnected');
        broadcastToClients({ type: 'logged_out', member: memberName });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getMemberStatus(memberName) {
    const sock = connections.get(memberName);
    const qr = qrCodes.get(memberName);
    const assignedNumber = memberNumbers.get(memberName) || null;
    
    if (sock && sock.user) {
        return { 
            member: memberName, 
            status: 'connected',
            whatsapp_number: sock.user.id?.split(':')[0] || 'Unknown',
            assigned_number: assignedNumber
        };
    } else if (qr) {
        return { member: memberName, status: 'qr', qr: qr, assigned_number: assignedNumber };
    } else {
        return { member: memberName, status: 'disconnected', assigned_number: assignedNumber };
    }
}

function broadcastToClients(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('🔗 Client connected');

    MEMBERS.forEach(member => {
        ws.send(JSON.stringify({ type: 'status', ...getMemberStatus(member) }));
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`📩 Received: ${data.type}`);

            switch (data.type) {
                case 'login_member':
                    const assigned = memberNumbers.get(data.memberName);
                    if (!assigned) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: `${data.memberName} has no number assigned.`
                        }));
                        return;
                    }
                    
                    const existingConn = connections.get(data.memberName);
                    if (existingConn && existingConn.user) {
                        ws.send(JSON.stringify({
                            type: 'status',
                            member: data.memberName,
                            status: 'connected',
                            whatsapp_number: existingConn.user.id?.split(':')[0] || 'Unknown'
                        }));
                        return;
                    }
                    
                    ws.send(JSON.stringify({
                        type: 'status',
                        member: data.memberName,
                        status: 'connecting',
                        message: 'Generating QR...'
                    }));
                    await connectMember(data.memberName);
                    break;

                case 'logout_member':
                    await logoutMember(data.memberName);
                    break;

                case 'send_message':
                    const result = await sendWhatsAppMessage(
                        data.memberName, data.phone, data.message,
                        data.attachment || null,
                        data.attachment_name || null,
                        data.attachment_type || null
                    );
                    ws.send(JSON.stringify({ type: 'message_result', ...result }));
                    break;

                case 'get_status':
                    ws.send(JSON.stringify({ type: 'status', ...getMemberStatus(data.memberName) }));
                    break;

                case 'get_all_status':
                    ws.send(JSON.stringify({
                        type: 'all_status',
                        members: MEMBERS.map(m => getMemberStatus(m))
                    }));
                    break;

                case 'assign_number':
                    const cleaned = data.phoneNumber.replace(/[^0-9]/g, '');
                    const final = cleaned.length === 10 ? '91' + cleaned : cleaned;
                    assignNumberToMember(data.memberName, final);
                    
                    const authPath = path.join(AUTH_DIR, `member_${data.memberName.replace(' ', '_')}`);
                    if (fs.existsSync(authPath)) {
                        fs.rmSync(authPath, { recursive: true, force: true });
                    }
                    
                    ws.send(JSON.stringify({
                        type: 'number_assigned',
                        member: data.memberName,
                        phoneNumber: final,
                        success: true
                    }));
                    break;

                default:
                    console.log('Unknown type:', data.type);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    ws.on('close', () => console.log('🔗 Client disconnected'));
});

console.log('🔄 Checking for saved sessions...');
MEMBERS.forEach((member, index) => {
    setTimeout(() => {
        if (memberNumbers.get(member)) {
            connectMember(member);
        }
    }, 2000 + (index * 1000));
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down...');
    wss.close();
    process.exit(0);
});

console.log('✅ WhatsApp WebSocket service ready!');
console.log(`🔌 WebSocket server running on port ${PORT}`);

module.exports = {
    connections, qrCodes, memberStatus, memberNumbers,
    sendWhatsAppMessage, getMemberStatus, connectMember,
    logoutMember, broadcastToClients, assignNumberToMember,
    getMemberNumber, wss, MEMBERS, cleanupMember
};
