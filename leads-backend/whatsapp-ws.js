const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 6001;
const AUTH_DIR = './baileys_auth';

if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR);
}

const connections = new Map();
const qrCodes = new Map();

const wss = new WebSocket.Server({ port: PORT });

console.log(`🔄 WhatsApp WebSocket server running on port ${PORT}`);

const MEMBERS = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];

async function connectMember(memberName) {
    const authPath = path.join(AUTH_DIR, `member_${memberName.replace(' ', '_')}`);
    
    const existing = connections.get(memberName);
    if (existing && existing.sock && existing.sock.user) {
        console.log(`✅ ${memberName} already connected`);
        return existing.sock;
    }
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        const sock = makeWASocket({
            printQRInTerminal: true, // Print in terminal for backup
            auth: state,
            browser: ['GMC CRM', 'Chrome', '1.0.0'],
            version: [2, 3000, 1035194821],
            markOnlineOnConnect: true,
            qrTimeout: 60000,
        });

        connections.set(memberName, { sock, saveCreds, authPath });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`📱 QR code generated for ${memberName}`);
                // Store the raw QR string
                qrCodes.set(memberName, qr);
                
                broadcastToClients({
                    type: 'qr',
                    member: memberName,
                    qr: qr // Send raw QR string
                });
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`❌ ${memberName} disconnected (${statusCode})`);
                
                if (statusCode === DisconnectReason.loggedOut) {
                    connections.delete(memberName);
                    qrCodes.delete(memberName);
                    
                    broadcastToClients({
                        type: 'logged_out',
                        member: memberName
                    });
                } else if (shouldReconnect) {
                    console.log(`🔄 Reconnecting ${memberName}...`);
                    connections.delete(memberName);
                    qrCodes.delete(memberName);
                    
                    setTimeout(() => {
                        connectMember(memberName);
                    }, 5000);
                }
            }

            if (connection === 'open') {
                const phoneNumber = sock.user?.id?.split(':')[0] || 'Unknown';
                console.log(`✅ ${memberName} connected successfully! Phone: ${phoneNumber}`);
                
                qrCodes.delete(memberName);
                
                broadcastToClients({
                    type: 'authenticated',
                    member: memberName,
                    whatsapp_number: phoneNumber
                });
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && msg.message) {
                try {
                    const messageContent = msg.message.conversation || 
                                         msg.message.extendedTextMessage?.text || 
                                         'Media message';
                    console.log(`📩 ${memberName}: Received: ${messageContent}`);
                } catch (err) {
                    console.log(`📩 ${memberName}: Received a message`);
                }
            }
        });

        return sock;

    } catch (error) {
        console.error(`❌ Error connecting ${memberName}:`, error.message);
        return null;
    }
}

async function logoutMember(memberName) {
    const conn = connections.get(memberName);
    
    try {
        if (conn) {
            const authPath = conn.authPath;
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log(`🗑️ Deleted auth folder for ${memberName}`);
            }
            
            try {
                await conn.sock.logout();
            } catch (e) {
                console.log(`⚠️ ${memberName}: Logout error (already disconnected)`);
            }
            connections.delete(memberName);
        }
        
        qrCodes.delete(memberName);
        
        console.log(`🚪 ${memberName} logged out successfully`);
        
        broadcastToClients({
            type: 'logged_out',
            member: memberName
        });
        
        setTimeout(() => {
            console.log(`📱 Generating new QR for ${memberName}...`);
            if (connections.get(memberName)) {
                connections.delete(memberName);
            }
            connectMember(memberName);
        }, 2000);
        
        return { success: true };
    } catch (error) {
        console.error(`❌ Error logging out ${memberName}:`, error.message);
        connections.delete(memberName);
        qrCodes.delete(memberName);
        
        broadcastToClients({
            type: 'logged_out',
            member: memberName
        });
        
        setTimeout(() => {
            connectMember(memberName);
        }, 2000);
        
        return { success: true, error: error.message };
    }
}

async function sendMessage(memberName, phoneNumber, message) {
    const conn = connections.get(memberName);
    if (!conn) {
        return { success: false, error: 'Member not connected' };
    }

    try {
        const { sock } = conn;
        const formattedNumber = phoneNumber.includes('@s.whatsapp.net') 
            ? phoneNumber 
            : `${phoneNumber}@s.whatsapp.net`;

        const result = await sock.sendMessage(formattedNumber, { 
            text: message 
        });

        broadcastToClients({
            type: 'message_sent',
            member: memberName,
            recipient: phoneNumber
        });

        return { success: true, result };
    } catch (error) {
        console.error(`❌ ${memberName}: Failed to send to ${phoneNumber}:`, error.message);
        return { success: false, error: error.message };
    }
}

function getMemberStatus(memberName) {
    const conn = connections.get(memberName);
    const qr = qrCodes.get(memberName);
    
    if (conn && conn.sock && conn.sock.user) {
        return { 
            member: memberName, 
            status: 'connected',
            whatsapp_number: conn.sock.user.id?.split(':')[0] || 'Unknown'
        };
    } else if (qr) {
        return { 
            member: memberName, 
            status: 'qr', 
            qr: qr 
        };
    } else {
        return { 
            member: memberName, 
            status: 'disconnected' 
        };
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
    console.log('🔗 Client connected to WebSocket');

    MEMBERS.forEach(member => {
        const status = getMemberStatus(member);
        ws.send(JSON.stringify({
            type: 'status',
            ...status
        }));
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`📩 Received: ${data.type} for ${data.memberName || 'all'}`);

            switch (data.type) {
                case 'login_member':
                    const existingConn = connections.get(data.memberName);
                    if (existingConn && existingConn.sock && existingConn.sock.user) {
                        ws.send(JSON.stringify({
                            type: 'status',
                            member: data.memberName,
                            status: 'connected',
                            whatsapp_number: existingConn.sock.user.id?.split(':')[0] || 'Unknown'
                        }));
                        return;
                    }
                    
                    qrCodes.delete(data.memberName);
                    await connectMember(data.memberName);
                    break;

                case 'logout_member':
                    await logoutMember(data.memberName);
                    break;

                case 'send_message':
                    const result = await sendMessage(
                        data.memberName, 
                        data.phone, 
                        data.message
                    );
                    ws.send(JSON.stringify({
                        type: 'message_result',
                        ...result
                    }));
                    break;

                case 'get_status':
                    const status = getMemberStatus(data.memberName);
                    ws.send(JSON.stringify({
                        type: 'status',
                        ...status
                    }));
                    break;

                case 'get_all_status':
                    const allStatus = MEMBERS.map(m => getMemberStatus(m));
                    ws.send(JSON.stringify({
                        type: 'all_status',
                        members: allStatus
                    }));
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔗 Client disconnected');
    });
});

console.log('🔄 Checking for saved sessions...');
MEMBERS.forEach(member => {
    setTimeout(() => {
        connectMember(member);
    }, 2000);
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down...');
    wss.close();
    process.exit(0);
});

console.log('✅ WhatsApp WebSocket service ready!');
console.log('📱 Members:', MEMBERS.join(', '));
console.log(`🔌 WebSocket server running on port ${PORT}`);
console.log('📱 QR codes will appear on the Broadcast page!');
