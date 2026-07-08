const WebSocket = require('ws');
const qrcode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// ===== HELPER: Format Phone Numbers =====
function formatPhoneNumber(number) {
    if (!number) return number;
    let cleaned = number.replace(/[\s\-]/g, '').replace(/^\+/, '');
    if (cleaned.length === 10 && /^[0-9]{10}$/.test(cleaned)) {
        cleaned = '91' + cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.substring(1);
    }
    if (cleaned.length >= 11 && cleaned.length <= 15) {
        if (/^[1-9][0-9]{10,14}$/.test(cleaned)) {
            return cleaned;
        }
    }
    return cleaned;
}

const wss = new WebSocket.Server({ port: 6001 });
console.log('✅ WebSocket server running on port 6001');

const sessions = new Map();
let wsClients = [];
const RECONNECT_DELAY = 5000;

const getSessionPath = (memberName) => {
    const cleanName = memberName.toLowerCase().replace(/\s/g, '_');
    return path.join(__dirname, `baileys_auth_${cleanName}`);
};

function broadcastToAll(data) {
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// ===== INITIALIZE MEMBER (FIXED) =====
async function initializeMember(memberName) {
    const sessionPath = getSessionPath(memberName);
    console.log(`📁 ${memberName} auth path: ${sessionPath}`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['GMC CRM', 'Chrome', '1.0.0'],
            version: [2, 3000, 1035194821],
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            retryRequestDelayMs: 5000,
            maxMsgRetryCount: 3,
        });

        const session = {
            sock: sock,
            isConnected: false,
            number: null,
            qr: null,
            memberName: memberName,
        };

        sessions.set(memberName, session);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin } = update;

            if (qr) {
                console.log(`📱 QR Code generated for ${memberName}`);
                try {
                    session.qr = await qrcode.toDataURL(qr);
                    broadcastToAll({ type: 'qr', member: memberName, qr: session.qr });
                } catch (err) {
                    console.error('QR generation error:', err);
                }
                return;
            }

            if (isNewLogin) {
                console.log(`✅ ${memberName} logged in successfully!`);
                session.isConnected = true;
                session.number = sock.user?.id?.split(':')[0] || 'Unknown';
                broadcastToAll({ 
                    type: 'authenticated', 
                    member: memberName, 
                    whatsapp_number: session.number 
                });
                console.log(`📱 ${memberName} WhatsApp Number: ${session.number}`);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log(`❌ ${memberName} disconnected:`, statusCode);
                session.isConnected = false;
                sessions.delete(memberName);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log(`🚪 ${memberName} logged out`);
                    broadcastToAll({ type: 'logged_out', member: memberName });
                    return;
                }

                setTimeout(() => {
                    console.log(`🔄 Reconnecting ${memberName}...`);
                    initializeMember(memberName);
                }, RECONNECT_DELAY);
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            console.log(`📩 New message for ${memberName}`);
        });

        sock.ev.on('message.update', (update) => {
            console.log(`📊 Message update for ${memberName}:`, update);
        });

        console.log(`✅ ${memberName} session initialized!`);

    } catch (error) {
        console.error(`❌ Error initializing ${memberName}:`, error);
        sessions.delete(memberName);
        setTimeout(() => {
            initializeMember(memberName);
        }, RECONNECT_DELAY);
    }
}

// ===== WEBSOCKET CONNECTION HANDLER =====
wss.on('connection', (ws) => {
    console.log('🔗 New WebSocket connection');
    wsClients.push(ws);

    for (const [memberName, session] of sessions) {
        if (session.qr && !session.isConnected) {
            ws.send(JSON.stringify({ type: 'qr', member: memberName, qr: session.qr }));
        }
        if (session.isConnected && session.number) {
            ws.send(JSON.stringify({
                type: 'authenticated',
                member: memberName,
                whatsapp_number: session.number
            }));
        }
    }

    ws.on('message', async (data) => {
        try {
            const parsed = JSON.parse(data);
            console.log(`📩 Received: ${parsed.type} ${parsed.memberName || ''}`);

            if (parsed.type === 'login_member') {
                const { memberName } = parsed;
                console.log(`🔄 Member "${memberName}" logging in...`);
                initializeMember(memberName);
                return;
            }

            if (parsed.type === 'logout_member') {
                const { memberName } = parsed;
                console.log(`🚪 Logging out ${memberName}`);
                const session = sessions.get(memberName);
                if (session && session.sock) {
                    try {
                        await session.sock.logout();
                    } catch (err) {
                        console.error('Logout error:', err);
                    }
                }
                sessions.delete(memberName);
                const sessionPath = getSessionPath(memberName);
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                } catch (err) {
                    console.error('Error clearing session:', err);
                }
                broadcastToAll({ type: 'logged_out', member: memberName });
                return;
            }

            // ===== SEND MESSAGE =====
            if (parsed.type === 'send_message') {
                const { memberName, to, message: msg } = parsed;
                
                const formattedNumber = formatPhoneNumber(to);
                console.log(`📤 Sending from ${memberName} to ${formattedNumber}: ${msg?.substring(0, 50)}...`);
                
                const session = sessions.get(memberName);
                if (!session) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        member: memberName, 
                        message: 'Session not found' 
                    }));
                    return;
                }
                if (!session.sock) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        member: memberName, 
                        message: 'Socket not found' 
                    }));
                    return;
                }
                if (!session.isConnected) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        member: memberName, 
                        message: 'Member not connected to WhatsApp. Please scan QR code.' 
                    }));
                    console.log(`❌ ${memberName} not connected, can't send message`);
                    return;
                }
                
                try {
                    const jid = formattedNumber + '@s.whatsapp.net';
                    console.log(`📤 Sending to JID: ${jid}`);
                    
                    const result = await session.sock.sendMessage(jid, { text: msg });
                    
                    console.log(`✅ Message sent from ${memberName} to ${formattedNumber}`);
                    
                    broadcastToAll({ 
                        type: 'message_sent', 
                        member: memberName, 
                        recipient: formattedNumber,
                        id: result.key?.id 
                    });
                    
                    ws.send(JSON.stringify({ 
                        type: 'status', 
                        member: memberName, 
                        message: 'Message sent successfully',
                        id: result.key?.id
                    }));
                    
                } catch (err) {
                    console.error(`❌ Failed to send from ${memberName}:`, err);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        member: memberName, 
                        message: err.message 
                    }));
                }
            }

        } catch (error) {
            console.error('Message error:', error);
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        wsClients = wsClients.filter(c => c !== ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
    });
});

// ===== STARTUP: Initialize members =====
const defaultMembers = ['Member 1', 'Member 2', 'Member 3', 'Member 4'];
defaultMembers.forEach((member, index) => {
    setTimeout(() => {
        initializeMember(member);
    }, index * 2000);
});

console.log('✅ Multi-member WhatsApp server ready!');
console.log(`📡 WebSocket: ws://localhost:6001`);
