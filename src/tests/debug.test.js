const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Debug Associations', () => {
    let Order;
    let OrderItem;

    beforeAll(async () => {
        const bootstrapped = await bootstrap();
        Order = bootstrapped.Order;
        OrderItem = bootstrapped.OrderItem;
    });

    it('prints associations', async () => {
        console.log('Order.associations:', Object.keys(Order.associations || {}));
        console.log('OrderItem.associations:', Object.keys(OrderItem.associations || {}));
        expect(true).toBe(true);
    });
});
