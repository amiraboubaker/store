const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const TEMPLATE_DIR = path.join(__dirname, '..', 'views', 'emails');
const TEMPLATES = {};

const FALLBACKS = {
    'contact.txt': [
        'NEW CONTACT FORM MESSAGE',
        '',
        'Reference: {{reference}}',
        'Received:  {{date}}',
        '',
        'Name:     {{name}}',
        'Email:    {{email}}',
        'Subject:  {{subject}}',
        '',
        'Message:',
        '--------',
        '{{message}}'
    ].join('\n'),
    'contact.html': '<p><strong>Name:</strong> {{name}}<br>'
        + '<strong>Email:</strong> {{email}}<br>'
        + '<strong>Subject:</strong> {{subject}}</p>'
        + '<p><strong>Message:</strong></p>'
        + '<p>{{message}}</p>'
        + '<hr><p><small>Saved as contact #{{reference}} on {{date}}.</small></p>'
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

    /**
     * A Google App Password is always 16 characters with no spaces, and Gmail
     * only issues one while 2-Step Verification is on. Reporting that shape up
     * front turns "Invalid login: 535-5.7.8" from a dead end into an obvious fix.
     */
    describePassword() {
        const { password } = this.getConfig();
        return {
            length: password.length,
            hasWhitespace: /\s/.test(password),
            isSixteenChars: password.replace(/\s/g, '').length === 16
        };
    }

    getCredentialHints() {
        const { host, password } = this.getConfig();
        const hints = [];
        const shape = this.describePassword();
        if (/gmail\.com|googlemail\.com/i.test(host)) {
            if (shape.hasWhitespace) {
                hints.push('EMAIL_PASSWORD contains spaces: remove them, an App Password is 16 characters with no spaces.');
            } else if (!shape.isSixteenChars) {
                hints.push(`EMAIL_PASSWORD is ${shape.length} characters: a Google App Password is exactly 16, so this is not one.`);
            }
            hints.push('Gmail rejects the account password. Turn on 2-Step Verification, then create an App Password at myaccount.google.com > Security > 2-Step Verification > App passwords, and use EMAIL_USER = the address that owns it.');
        } else if (shape.hasWhitespace) {
            hints.push('EMAIL_PASSWORD contains spaces: remove them.');
        }
        return hints;
    }

    getTransport() {
        const { host, port, user, password } = this.getConfig();
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass: password },
                // Without these a blocked outbound port (most VPS providers
                // drop 25/587) leaves the socket waiting on the OS default,
                // which would hang the POST /contact request for minutes
                // instead of failing fast and letting the row be stored.
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 20000
            });
        }
        return this.transporter;
    }

    /**
     * Reads a file from src/views/emails and substitutes {{placeholders}}.
     * Deliberately not a template engine: the files are plain HTML and text, so
     * a missing dependency would otherwise be a runtime failure. A file that
     * cannot be read falls back to FALLBACKS, so a slimmed image can never stop
     * the notification from carrying the client's details.
     */
    renderTemplate(file, replacements) {
        const source = this.loadTemplate(file) || FALLBACKS[file];
        return Object.entries(replacements).reduce(
            (html, [key, value]) => html.split(`{{${key}}}`).join(value),
            source
        );
    }

    loadTemplate(file) {
        if (!(file in TEMPLATES)) {
            try {
                TEMPLATES[file] = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf8');
            } catch (error) {
                console.warn(`MailService: template ${file} not readable (${error.code || error.message}), using the built-in copy`);
                TEMPLATES[file] = null;
            }
        }
        return TEMPLATES[file];
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
        const received = contact.createdAt
            ? new Date(contact.createdAt).toUTCString()
            : new Date().toUTCString();
        // The templates add the leading '#', so this stays a bare number.
        const reference = contact.id ? String(contact.id) : 'n/a';
        const { from, to } = this.getConfig();

        // The HTML part carries the branding and the reply button; the text
        // part is the fallback that stays readable in a plain text client.
        const replacements = {
            name: escapeHtml(name),
            email: escapeHtml(email),
            subject: escapeHtml(subject),
            subjectUrl: encodeURIComponent(subject),
            message: escapeHtml(message).replace(/\r?\n/g, '<br>'),
            date: escapeHtml(received),
            reference: escapeHtml(reference)
        };
        const textReplacements = {
            name,
            email,
            subject,
            message,
            date: received,
            reference
        };

        return {
            from,
            to,
            replyTo: email,
            subject: `New contact form message from ${name} — ${subject}`,
            text: this.renderTemplate('contact.txt', textReplacements),
            html: this.renderTemplate('contact.html', replacements)
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
        try {
            return await this.getTransport().sendMail(this.buildContactMessage(contact));
        } catch (error) {
            const rejected = String((error && error.message) || '').includes('535')
                || (error && error.code === 'EAUTH');
            if (rejected) {
                for (const hint of this.getCredentialHints()) console.warn(`MailService: ${hint}`);
            }
            throw error;
        }
    }
}

module.exports = MailService;
