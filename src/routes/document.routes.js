"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, '../../uploads') });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', document_controller_1.listDocuments);
router.post('/upload', upload.single('file'), document_controller_1.uploadDocument);
router.get('/:id/download', document_controller_1.downloadDocument);
exports.default = router;
//# sourceMappingURL=document.routes.js.map