const { MESSAGES } = require('./constants');

const validateInput = ({ title, description, price, count }) => {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return MESSAGES.INVALID_INPUT_TITLE;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return MESSAGES.INVALID_INPUT_DESCRIPTION;
    }

    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        return MESSAGES.INVALID_INPUT_PRICE;
    }

    if (typeof count !== 'number' || isNaN(count) || count < 0) {
        return MESSAGES.INVALID_INPUT_COUNT;
    }

    return null;
};

module.exports = {
    validateInput,
};
