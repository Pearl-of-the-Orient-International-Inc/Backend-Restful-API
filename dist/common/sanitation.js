"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const http_codes_1 = require("../common/http-codes");
const zod_1 = require("zod");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
                ? req.body
                : {};
            const payload = req.method === 'GET'
                ? { query: req.query, params: req.params }
                : Object.assign(Object.assign({}, body), { body: req.body, query: req.query, params: req.params });
            schema.parse(payload);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                }));
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'Validation failed',
                    errors: formattedErrors,
                });
            }
        }
    };
};
exports.validate = validate;
