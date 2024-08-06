const { validateInput } = require('../lambdas/validation');
const { MESSAGES } = require('../lambdas/constants');
const ProductBuilder = require('../utils/productBuilder');

describe('validateInput function', () => {
    it('should return null if input is valid', () => {
        const input = new ProductBuilder().build();
        const result = validateInput(input);
        expect(result).toBeNull();
    });
 
    describe.each([{}, null, undefined, NaN, '', '\t', '\n'])(
        'should return INVALID_INPUT_TITLE if description is "%s"',
        (title) => {
            it(`should return ${MESSAGES.INVALID_INPUT_TITLE}`, () => {
                const input = new ProductBuilder().withTitle(title).build();
                const result = validateInput(input);
                expect(result).toEqual(MESSAGES.INVALID_INPUT_TITLE);
            });
        }
    );  

    describe.each([{}, null, undefined, NaN, '', '\t', '\n'])(
        'should return INVALID_INPUT_DESCRIPTION if description is "%s"',
        (description) => {
            it(`should return ${MESSAGES.INVALID_INPUT_DESCRIPTION}`, () => {
                const input = new ProductBuilder().withDescription(description).build();
                const result = validateInput(input);
                expect(result).toEqual(MESSAGES.INVALID_INPUT_DESCRIPTION);
            });
        }
    );    

    describe.each([-2, -1, {}, null, undefined, NaN, '', '\t', '\n'])(
        'should return INVALID_INPUT_PRICE if price is invalid: "%s"',
        (price) => {
            it('should return INVALID_INPUT_PRICE', () => {
                const input = new ProductBuilder().withPrice(price).build();
                const result = validateInput(input);
                expect(result).toEqual(MESSAGES.INVALID_INPUT_PRICE);
            });
        }
    );    

    describe.each([-2, -1, {}, null, undefined, NaN, '', '\t', '\n'])(
        'should return INVALID_INPUT_COUNT if count is less than zero: "%s"',
        (count) => {
            it('should return INVALID_INPUT_COUNT', () => {
                const input = new ProductBuilder().withCount(count).build();
                const result = validateInput(input);
                expect(result).toEqual(MESSAGES.INVALID_INPUT_COUNT);
            });
        }
    );    
});