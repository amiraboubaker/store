const MailService = require('../services/MailService');
const ContactController = require('../controllers/ContactController');

const CONTACT = {
    id: 7,
    name: 'Amira Boubaker',
    email: 'amira@example.com',
    subject: 'Bulk order',
    message: 'Do you ship 50 metres of silk to Sousse?'
};

const withEmailEnv = (values, fn) => {
    const previous = {};
    for (const key of ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_TO']) {
        previous[key] = process.env[key];
        if (values[key] === undefined) delete process.env[key];
        else process.env[key] = values[key];
    }
    try {
        return fn();
    } finally {
        for (const key of Object.keys(previous)) {
            if (previous[key] === undefined) delete process.env[key];
            else process.env[key] = previous[key];
        }
    }
};

describe('MailService', () => {
    it('builds a notification carrying name, email and subject', () => {
        const mail = withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com' },
            () => new MailService().buildContactMessage(CONTACT)
        );

        expect(mail.subject).toContain('Amira Boubaker');
        expect(mail.subject).toContain('Bulk order');
        expect(mail.text).toContain('Name: Amira Boubaker');
        expect(mail.text).toContain('Email: amira@example.com');
        expect(mail.text).toContain('Subject: Bulk order');
        expect(mail.text).toContain('Do you ship 50 metres of silk to Sousse?');
        expect(mail.html).toContain('Amira Boubaker');
        expect(mail.html).toContain('amira@example.com');
        expect(mail.html).toContain('Bulk order');
        expect(mail.replyTo).toBe('amira@example.com');
    });

    it('falls back to a placeholder subject and escapes html', () => {
        const mail = withEmailEnv(
            { EMAIL_USER: 'shop@example.com', EMAIL_PASSWORD: 'secret', EMAIL_FROM: 'shop@example.com' },
            () => new MailService().buildContactMessage({ ...CONTACT, subject: null, name: '<b>Bob</b>' })
        );

        expect(mail.subject).toContain('No subject');
        expect(mail.text).toContain('Subject: No subject');
        expect(mail.html).not.toContain('<b>Bob</b>');
        expect(mail.html).toContain('&lt;b&gt;Bob&lt;/b&gt;');
    });

    it('stays disabled when SMTP credentials are missing', async () => {
        const service = new MailService();
        const result = await withEmailEnv({}, () => service.sendContactNotification(CONTACT));
        expect(result).toEqual({ skipped: true });
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
    });
});
