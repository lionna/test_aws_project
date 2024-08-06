// https://jestjs.io/docs/configuration

module.exports = {
    testMatch: ["**/?(*.)+(spec).js?(x)", "**/?(*.)+(spec).ts?(x)"],
    collectCoverageFrom: [
        'lambdas/*.js',
        '!lambdas/constants.js',
        '!lambdas/cors.js',
    ],
};