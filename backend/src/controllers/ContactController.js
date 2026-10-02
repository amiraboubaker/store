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

            let emailSent = false;
            try {
                const result = await this.mailService.sendContactNotification(entry);
                emailSent = !(result && result.skipped);
                if (!emailSent) {
                    console.warn(`Contact #${entry.id} stored but NOT notified: EMAIL_* is not configured`);
                } else {
                    console.log(`Contact #${entry.id} stored and notified (${result && result.to ? result.to : 'configured inbox'})`);
                }
            } catch (mailError) {
                console.error(`Contact #${entry.id} stored but notification FAILED: ${mailError.message}`);
            }

            // The browser retries through EmailJS when this is false, so an SMTP
            // outage costs a notification instead of the enquiry itself.
            res.status(201).json({ status: 'success', data: { id: entry.id, emailSent } });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ContactController;
