const fs = require('fs');
const path = require('path');
const MailService = require('../services/MailService');
const ContactController = require('../controllers/ContactController');

const CONTACT = {
    id: 7,
    name: 'Amira Boubaker',
    email: 'amira@example.com',
    subject: 'Bulk order',
    message: 'Do you ship 50 metres of silk to Sousse?'
};

const withEmailEnv = async (values, fn) => {
    const previous = {};
    for (const key of ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_TO']) {
        previous[key] = process.env[key];
        if (values[key] === undefined) delete process.env[key];
        else process.env[key] = values[key];
    }
    try {
        // Awaited, so the variables are still in place while an async callback
        // runs. Restoring them synchronously made every async assertion read
        // an unconfigured service.
        return await fn();
    } finally {
        for (const key of Object.keys(previous)) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    }
};

describe('MailService', () => {
    it('builds a notification carrying name, email and subject', async () => {
        const mail = await withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com' },
            () => new MailService().buildContactMessage(CONTACT)
        );

        expect(mail.subject).toContain('Amira Boubaker');
        expect(mail.subject).toContain('Bulk order');
        expect(mail.text).toContain('Name:     Amira Boubaker');
        expect(mail.text).toContain('Email:    amira@example.com');
        expect(mail.text).toContain('Subject:  Bulk order');
        expect(mail.text).toContain('Do you ship 50 metres of silk to Sousse?');
        expect(mail.html).toContain('Amira Boubaker');
        expect(mail.html).toContain('amira@example.com');
        expect(mail.html).toContain('Bulk order');
        expect(mail.replyTo).toBe('amira@example.com');
    });

    it('falls back to a placeholder subject and escapes html', async () => {
        const mail = await withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com' },
            () => new MailService().buildContactMessage({ ...CONTACT, subject: null, name: '<b>Bob</b>' })
        );

        expect(mail.subject).toContain('No subject');
        expect(mail.text).toContain('Subject:  No subject');
        expect(mail.html).not.toContain('<b>Bob</b>');
        expect(mail.html).toContain('&lt;b&gt;Bob&lt;/b&gt;');
    });

    it('stays disabled when SMTP credentials are missing', async () => {
        const service = new MailService();
        const result = await withEmailEnv({}, () => service.sendContactNotification(CONTACT));
        expect(result).toEqual({ skipped: true });
    });

    it('names the credential problem when the server rejects the login', async () => {
        const service = new MailService();
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const sendMail = jest.fn().mockRejectedValue(
            Object.assign(new Error('Invalid login: 535-5.7.8 Username and Password not accepted.'), { code: 'EAUTH' })
        );
        service.getTransport = () => ({ sendMail });

        await withEmailEnv(
            {
                EMAIL_HOST: 'smtp.gmail.com',
                EMAIL_USER: 'shop@gmail.com',
                EMAIL_PASSWORD: 'secret',
                EMAIL_FROM: 'shop@gmail.com',
                EMAIL_TO: 'inbox@gmail.com'
            },
            async () => {
                await expect(service.sendContactNotification(CONTACT)).rejects.toThrow('535-5.7.8');
            }
        );

        const messages = warn.mock.calls.map((call) => call.join(' ')).join('\n');
        expect(messages).toContain('not one');
        expect(messages).toContain('App Password');
        warn.mockRestore();
    });

    it('flags an App Password that still contains spaces', async () => {
        const hints = await withEmailEnv(
            {
                EMAIL_HOST: 'smtp.gmail.com',
                EMAIL_USER: 'shop@gmail.com',
                EMAIL_PASSWORD: 'abcd efgh ijkl mnop',
                EMAIL_FROM: 'shop@gmail.com',
                EMAIL_TO: 'inbox@gmail.com'
            },
            () => new MailService().getCredentialHints()
        );

        expect(hints.join(' ')).toContain('spaces');
    });
});

describe('contact email templates', () => {
    const TEMPLATE_DIR = path.join(__dirname, '..', 'views', 'emails');

    it('ships an html and a text template covering every field', () => {
        const html = fs.readFileSync(path.join(TEMPLATE_DIR, 'contact.html'), 'utf8');
        const text = fs.readFileSync(path.join(TEMPLATE_DIR, 'contact.txt'), 'utf8');
        const placeholders = (source) => new Set(source.match(/\{\{(\w+)\}\}/g) || []);
        const required = ['{{name}}', '{{email}}', '{{subject}}', '{{message}}'];
        const htmlSet = placeholders(html);
        const textSet = placeholders(text);

        for (const token of required) {
            expect(htmlSet).toContain(token);
            expect(textSet).toContain(token);
        }
        // The html part may add extras (the reply button encodes the subject);
        // the text part must not carry placeholders the html part lacks.
        for (const token of textSet) expect(htmlSet).toContain(token);
    });

    it('renders every submitted field into the branded html part', async () => {
        const mail = await withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com', EMAIL_TO: 'inbox@example.com' },
            () => new MailService().buildContactMessage({ ...CONTACT, createdAt: '2026-10-03T09:00:00Z' })
        );

        expect(mail.html).toContain('Amira Boubaker');
        expect(mail.html).toContain('mailto:amira@example.com');
        expect(mail.html).toContain('Bulk order');
        expect(mail.html).toContain('Do you ship 50 metres of silk to Sousse?');
        expect(mail.html).toContain('#7');
        // Proves the file template was used rather than the built-in copy.
        expect(mail.html).toContain('Reply to');
        expect(mail.html).not.toMatch(/\{\{/);
    });

    it('keeps the text part readable and free of html', async () => {
        const mail = await withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com', EMAIL_TO: 'inbox@example.com' },
            () => new MailService().buildContactMessage({ ...CONTACT, subject: null })
        );

        expect(mail.text).toContain('Name:     Amira Boubaker');
        expect(mail.text).toContain('Subject:  No subject');
        expect(mail.text).not.toMatch(/\{\{/);
        expect(mail.text).not.toMatch(/<[a-z]/i);
    });

    it('still carries the details when the template files cannot be read', () => {
        const readFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        });
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

        jest.isolateModules(() => {
            const Isolated = require('../services/MailService');
            const mail = new Isolated().buildContactMessage(CONTACT);
            expect(mail.html).toContain('Amira Boubaker');
            expect(mail.html).toContain('amira@example.com');
            expect(mail.html).not.toMatch(/\{\{/);
        });

        warn.mockRestore();
        readFileSync.mockRestore();
    });
});

describe('ContactController.create', () => {
    const run = async (mailService, body = CONTACT) => {
        const created = [];
        const Contact = {
            create: jest.fn(async (values) => {
                const entry = { id: 42, ...values };
                created.push(entry);
                return entry;
            })
        };
        const controller = new ContactController(Contact, mailService);
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await controller.create({ body }, res, jest.fn());

        return { created, res };
    };

    it('stores every field in its own column and notifies with the same values', async () => {
        const mailService = { sendContactNotification: jest.fn().mockResolvedValue({}) };
        const { created, res } = await run(mailService);

        expect(created[0]).toEqual(expect.objectContaining({
            name: 'Amira Boubaker',
            email: 'amira@example.com',
            subject: 'Bulk order',
            message: 'Do you ship 50 metres of silk to Sousse?'
        }));
        expect(mailService.sendContactNotification).toHaveBeenCalledWith(expect.objectContaining({
            id: 42,
            name: 'Amira Boubaker',
            email: 'amira@example.com',
            subject: 'Bulk order'
        }));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: { id: 42, emailSent: true }
        });
    });

    it('stores a missing subject as null', async () => {
        const { created } = await run({ sendContactNotification: jest.fn().mockResolvedValue({}) }, {
            name: 'Guest',
            email: 'guest@example.com',
            subject: '',
            message: 'What are your opening hours please?'
        });

        expect(created[0].subject).toBeNull();
    });

    it('still reports success when the notification cannot be delivered', async () => {
        const mailService = { sendContactNotification: jest.fn().mockRejectedValue(new Error('smtp down')) };
        const { created, res } = await run(mailService);

        expect(created).toHaveLength(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: { id: 42, emailSent: false }
        });
    });

    it('tells the browser to retry when email is not configured at all', async () => {
        const mailService = { sendContactNotification: jest.fn().mockResolvedValue({ skipped: true }) };
        const { res } = await run(mailService);

        expect(res.json).toHaveBeenCalledWith({
            status: 'success',
            data: { id: 42, emailSent: false }
        });
    });
});
