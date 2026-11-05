"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentOfficerScope = void 0;
const http_codes_1 = require("../../../common/http-codes");
const officer_scope_1 = require("../../../lib/officer-scope");
const getCurrentOfficerScope = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const scope = req.userId ? yield (0, officer_scope_1.getOfficerScope)(req.userId) : null;
    if (!scope) {
        res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'An active officer assignment is required' });
        return;
    }
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Officer scope retrieved successfully',
        data: { memberId: scope.memberId, assignments: scope.assignments },
    });
});
exports.getCurrentOfficerScope = getCurrentOfficerScope;
