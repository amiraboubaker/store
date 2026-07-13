class ContactController {
    constructor(Contact) {
        this.Contact = Contact;
    }

    async create(req, res, next) {
        try {
            const { name, email, subject, message } = req.body;
            const entry = await this.Contact.create({ name, email, subject, message });
            res.status(201).json({ status: 'success', data: { id: entry.id } });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContactController;
