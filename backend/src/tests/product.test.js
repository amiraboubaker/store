const ProductService = require('../services/ProductService');

describe('ProductService validation', () => {
    it('rejects invalid product price and stock', () => {
        expect(() => {
            ProductService.validateProductPayload({
                name: 'Silk Thread',
                price: 0,
                category: 'Embroidery',
                stock: 5,
                description: 'Premium silk thread',
                images: ['https://cdn.example.com/thread.jpg']
            });
        }).toThrow(/price/);

        expect(() => {
            ProductService.validateProductPayload({
                name: 'Silk Thread',
                price: 12,
                category: 'Embroidery',
                stock: -1,
                description: 'Premium silk thread',
                images: ['https://cdn.example.com/thread.jpg']
            });
        }).toThrow(/stock/);
    });

    it('normalizes valid product payload and image list', () => {
        const normalized = ProductService.validateProductPayload({
            name: ' Silk Thread ',
            price: '12.50',
            category: ' Embroidery ',
            material: ' Silk ',
            stock: '10',
            description: ' Premium silk thread ',
            images: ['https://cdn.example.com/thread.jpg', '/uploads/thread-2.jpg']
        });

        expect(normalized.name).toBe('Silk Thread');
        expect(normalized.price).toBe(12.5);
        expect(normalized.category).toBe('Embroidery');
        expect(normalized.material).toBe('Silk');
        expect(normalized.stock).toBe(10);
        expect(normalized.description).toBe('Premium silk thread');
        expect(normalized.images).toEqual([
            'https://cdn.example.com/thread.jpg',
            '/uploads/thread-2.jpg'
        ]);
    });
});
