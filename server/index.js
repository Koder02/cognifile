"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Serve the data folder statically
app.use('/data', express_1.default.static(path_1.default.join(__dirname, '..', 'data')));
// Get list of PDF files
app.get('/api/documents', async (req, res) => {
    try {
        const dataDir = path_1.default.join(__dirname, '..', 'data');
        const files = await promises_1.default.readdir(dataDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
        const documents = pdfFiles.map((file, index) => ({
            id: (index + 1).toString(),
            name: file,
            path: `/data/${file}`,
            type: 'pdf'
        }));
        res.json(documents);
    }
    catch (error) {
        console.error('Error reading documents:', error);
        res.status(500).json({ error: 'Failed to read documents' });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map