class ProductBuilder {
    constructor() {
        this.product = {
            id: 'ead768ea-8752-4417-a94d-e8eaf256c500',
            title: 'some title',
            description: 'some description',
            price: 100,
            count: 50
        };
    }

    withId(id) {
        this.product.id = id;
        return this;
    }

    withTitle(title) {
        this.product.title = title;
        return this;
    }

    withDescription(description) {
        this.product.description = description;
        return this;
    }

    withPrice(price) {
        this.product.price = price;
        return this;
    }

    withCount(count) {
        this.product.count = count;
        return this;
    }

    build() {
        return this.product;
    }
}

module.exports = ProductBuilder;
