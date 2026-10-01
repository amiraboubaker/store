const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Contact endpoint', () => {
    let Contact;
    let sequelize;

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        Contact = bootstrapped.Contact;
        sequelize = bootstrapped.sequelize;
    });

    afterAll(async () => {
        await Contact.destroy({ where: {}, truncate: true });
        await sequelize.close();
    });

    it('stores a valid submission and returns its id', async () => {
        const res = await request(app)
            .post('/contact')
            .send({
                name: 'Amira',
                email: 'amira@example.com',
                subject: 'Bulk order',
                message: 'Do you ship 50 metres of silk to Sousse?'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data.id).toBeDefined();

        const stored = await Contact.findByPk(res.body.data.id);
        expect(stored.name).toBe('Amira');
        expect(stored.email).toBe('amira@example.com');
        expect(stored.subject).toBe('Bulk order');
    });

    it('accepts a submission without an optional subject', async () => {
        const res = await request(app)
            .post('/contact')
            .send({
                name: 'Guest',
                email: 'guest@example.com',
                message: 'I would like to know your opening hours please.'
            });

        expect(res.status).toBe(201);
    });

    it('rejects a submission with an invalid email', async () => {
        const res = await request(app)
            .post('/contact')
            .send({
                name: 'Guest',
                email: 'not-an-email',
                message: 'This message should never be stored.'
            });

        expect(res.status).toBe(422);
        expect(res.body.status).toBe('error');
    });

    it('rejects a submission with a missing message', async () => {
        const res = await request(app)
            .post('/contact')
            .send({
                name: 'Guest',
                email: 'guest@example.com'
            });

        expect(res.status).toBe(422);
    });

it('rejects a message shorter than the minimum length', async () => {
        const res = await request(app)
            .post('/contact')
            .send({
       name: 'Guest',
    email: 'guest@example.com',
    message: 'too short'
            });

        expect(res.status).toBe(422);
    });

    it('answers 400, not 500, for a malformed JSON body', async () => {
        const res = await request(app)
       .post('/contact')
     .set('Content-Type', 'application/json')
.send('{not json');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_JSON');
    });
});