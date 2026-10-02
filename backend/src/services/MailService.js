const nodemailer = require('nodemailer');

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const FIELD_LABELS = {
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message'
};

class MailService {
    constructor() {
        this.transporter = null;
    }

    /**
     * SMTP credentials are read lazily on every send so the service picks up
     * configuration that changes after boot, and so tests that never set
     * EMAIL_* simply stay disabled instead of throwing.
     */
    getConfig() {
        return {
            host: process.env.EMAIL_HOST || '',
            port: Number(process.env.EMAIL_PORT || 587),
            user: process.env.EMAIL_USER || '',
            password: process.env.EMAIL_PASSWORD || '',
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
            to: process.env.EMAIL_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER || ''
        };
    }

    isConfigured() {
        const { host, user, password, from, to } = this.getConfig();
        return Boolean(host && user && password && from && to);
    }

    getTransport() {
        const { host, port, user, password } = this.getConfig();
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass: password }
            });
        }
        return this.transporter;
    }

    /**
     * The notification repeats every submitted field, so the shop can answer
     * the client without opening the database. Reply-To points at the client
     * address, which mail clients turn into a one-click reply.
     */
    buildContactMessage(contact) {
        const name = contact.name || 'Unknown';
        const email = contact.email || '';
        const subject = (contact.subject || '').trim() || 'No subject';
        const message = contact.message || '';
        const reference = contact.id ? `#${contact.id}` : 'n/a';

        return {
            from: this.getConfig().from,
            to: this.getConfig().to,
            replyTo: email,
            subject: `New contact form message from ${name} — ${subject}`,
            text: [
                `Reference: ${reference}`,
                '',
                `${FIELD_LABELS.name}: ${name}`,
                `${FIELD_LABELS.email}: ${email}`,
                `${FIELD_LABELS.subject}: ${subject}`,
                '',
                `${FIELD_LABELS.message}:`,
                message
            ].join('\n'),
            html: `<p><strong>${escapeHtml(FIELD_LABELS.name)}:</strong> ${escapeHtml(name)}<br>`
                + `<strong>${escapeHtml(FIELD_LABELS.email)}:</strong> ${escapeHtml(email)}<br>`
                + `<strong>${escapeHtml(FIELD_LABELS.subject)}:</strong> ${escapeHtml(subject)}</p>`
                + `<p><strong>${escapeHtml(FIELD_LABELS.message)}:</strong></p>`
                + `<p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>`
                + `<hr><p><small>Stored as contact #${escapeHtml(reference)}</small></p>`
        };
    }

    /**
     * Delivery failures are reported to the caller but never block a stored
     * submission: the row is the source of truth, the mail is a notification.
     */
    async sendContactNotification(contact) {
        if (!this.isConfigured()) {
            console.warn('MailService: EMAIL_* is not configured, contact notification skipped');
            return { skipped: true };
        }
        return this.getTransport().sendMail(this.buildContactMessage(contact));
    }
}

module.exports = MailService;
