"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const gestor_routes_1 = __importDefault(require("./routes/gestor.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3333;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
app.use('/auth', auth_routes_1.default);
app.use('/gestores', gestor_routes_1.default);
app.use('/projects', project_routes_1.default);
app.use('/tasks', task_routes_1.default);
app.use('/documents', document_routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'API rodando e protegida' });
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('Servidor rodando na porta ' + PORT);
});
//# sourceMappingURL=server.js.map