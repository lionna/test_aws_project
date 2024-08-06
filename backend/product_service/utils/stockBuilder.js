class StockBuilder {
    constructor() {
        this.stock = {
            product_id: 'ead768ea-8752-4417-a94d-e8eaf256c500',
            count: 50,
        };
    }

    withId(product_id) {
        this.stock.product_id = product_id;
        return this;
    }

    withCount(count) {
        this.stock.count = count;
        return this;
    }

    build() {
        return this.stock;
    }
}

module.exports = StockBuilder;
