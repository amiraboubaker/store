class ContactController {
    constructor(Contact, mailService) {
        this.Contact = Contact;
        this.mailService = mailService;
    }

    async create(req, res, next) {
        try {
            const { name, email, subject, message } = req.body;
            const entry = await this.Contact.create({
                name: name.trim(),
                email: email.trim(),
                subject: subject ? subject.trim() : null,
                message: message.trim()
            });

            try {
                await this.mailService.sendContactNotification(entry);
            } catch (mailError) {
                console.error('Contact notification failed:', mailError.message);
            }

            res.status(201).json({ status: 'success', data: { id: entry.id } });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContactController;
