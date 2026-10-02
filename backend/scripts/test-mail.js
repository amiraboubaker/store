/**
 * Contact-form SMTP self test.
 *
 * Runs inside the backend container with the same EMAIL_* variables the API
 * uses, and reports which layer breaks, because "no email arrived" has four
 * very different causes that the contact log alone cannot separate:
 *
 *   1. EMAIL_* is blank or never reached the container
 *   2. the host does not resolve
 *   3. the TCP port is blocked by the VPS firewall/provider
 *   4. the SMTP server rejects the credentials or the recipient
 *
 * Usage:  node scripts/test-mail.js [recipient-override]
 */

const dns = require('dns').promises;
const net = require('net');
const nodemailer = require('nodemailer');
const MailService = require('../src/services/MailService');

const CONFIG_KEYS = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_TO'];
const saved = {};
for (const key of CONFIG_KEYS) {
    saved[key] = process.env[key];
}
const override = process.argv[2];
if (override) process.env.EMAIL_TO = override;

const service = new MailService();
const config = service.getConfig();

const hide = (value) => {
    if (!value) return '(empty)';
    return String(value).replace(/^(.).*(?=@)/, '$1***');
};

const fail = (message) => {
    console.error(`\n✗ ${message}`);
    process.exit(1);
};

const step = (message) => console.log(`\n==> ${message}`);

async function main() {
console.log('Contact form SMTP self test');
console.log('----------------------------');
console.log(`EMAIL_HOST      ${config.host || '(empty)'}`);
console.log(`EMAIL_PORT      ${config.port}`);
console.log(`EMAIL_USER      ${hide(config.user)}`);
console.log(`EMAIL_PASSWORD  ${config.password ? `set (${config.password.length} chars${/\s/.test(config.password) ? ', CONTAINS SPACES' : ''})` : '(empty)'}`);
console.log(`EMAIL_FROM      ${hide(config.from)}`);
console.log(`EMAIL_TO        ${hide(config.to)}`);

step('1. configuration');
if (!service.isConfigured()) {
    fail('One or more EMAIL_* values are empty, so no mail is ever attempted. Fill them in devops-scripts/backend/.env and redeploy.');
}
console.log('ok: every variable has a value');

step('2. DNS resolution');
let addresses;
try {
    addresses = await dns.lookup(config.host);
    console.log(`ok: ${config.host} -> ${addresses.address}`);
} catch (error) {
    fail(`DNS lookup failed for ${config.host}: ${error.code || error.message}`);
}

step(`3. TCP connection to ${config.host}:${config.port}`);
await new Promise((resolve) => {
    const socket = net.connect({ host: config.host, port: config.port });
    const timer = setTimeout(() => {
        socket.destroy();
        fail(`Timed out after 10s. Outbound ${config.port} is blocked: check the VPS provider firewall, or use EMAIL_PORT=465.`);
    }, 10000);
    socket.setTimeout(10000);
    socket.once('connect', () => {
        clearTimeout(timer);
        console.log('ok: the port accepts connections');
        socket.end();
        resolve();
    });
    socket.once('timeout', () => { clearTimeout(timer); socket.destroy(); });
    socket.once('error', (error) => {
        clearTimeout(timer);
        fail(`Cannot reach ${config.host}:${config.port} (${error.code || error.message}).`);
    });
});

const message = service.buildContactMessage({
    id: 0,
    name: 'SMTP self test',
    email: config.user,
    subject: 'Contact form self test',
    message: 'If you are reading this, the contact form notifications work.'
});

step('4. SMTP authentication');
const transporter = service.getTransport();
try {
    const verified = await transporter.verify();
    console.log(`ok: server accepted the credentials for ${config.user}`);
    console.log(`ok: server capabilities: ${verified.join(', ')}`);
} catch (error) {
    const hints = {
        535: 'The server rejected the login. EMAIL_PASSWORD must be a Google App Password (16 characters, no spaces), not the account password.',
        550: 'The server refused the account. 2FA must be on and an App Password generated at myaccount.google.com > Security > 2-Step Verification > App passwords.',
        421: 'Too many failed attempts. Wait about 15 minutes before retrying.',
        ETIMEDOUT: 'The connection timed out after authentication started.'
    };
    console.error(`\n✗ Authentication failed: [${error.code || error.responseCode || 'no code'}] ${error.message}`);
    if (hints[error.code] || hints[error.responseCode]) console.error(`  hint: ${hints[error.code] || hints[error.responseCode]}`);
    process.exit(1);
}

step('5. sending a test message');
try {
    const info = await transporter.sendMail(message);
    console.log(`ok: accepted for delivery (messageId ${info.messageId})`);
    console.log(`ok: envelope ${info.envelope.from} -> ${info.envelope.to}`);
    console.log(`\nDelivery is now the mail provider's job. If nothing arrives:`);
    console.log('  - check the spam / quarantine folder of ' + config.to);
    console.log('  - confirm EMAIL_TO is a real address (a typo is rejected with 550)');
    console.log('  - confirm the sender ' + config.from + ' is allowed to send as that account');
} catch (error) {
    console.error(`\n✗ Send failed: [${error.code || error.responseCode || 'no code'}] ${error.message}`);
    if (error.response) console.error(`  server said: ${error.response}`);
    if (/550/.test(String(error.responseCode || error.message))) {
        console.error('  hint: 550 is an address or sender-policy problem. Verify EMAIL_TO exists and that EMAIL_FROM is authorized for this account.');
    }
    process.exit(1);
}

for (const key of CONFIG_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
}
}

main();
