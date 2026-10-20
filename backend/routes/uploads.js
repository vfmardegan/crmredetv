const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const requireAuth = require("./authMiddleware");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "../uploads");
const TEMP_DIR = path.join(UPLOADS_DIR, "temp");

// Garante que os diretórios existam
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// POST /api/v1/upload-chunk — recebe um pedaço menor que 8KB (imune ao limite do AWS WAF)
router.post("/upload-chunk", requireAuth, async (req, res) => {
  const { uploadId, chunkIndex, totalChunks, chunk } = req.body;

  if (!uploadId || chunkIndex === undefined || !chunk) {
    return res.status(400).json({ error: "uploadId, chunkIndex e chunk são obrigatórios." });
  }

  // Sanitiza o uploadId para evitar path traversal
  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
  const chunkFileName = `${safeUploadId}_${String(chunkIndex).padStart(6, "0")}.part`;
  const chunkFilePath = path.join(TEMP_DIR, chunkFileName);

  try {
    await fs.promises.writeFile(chunkFilePath, chunk, "utf8");
    return res.json({ success: true, chunkIndex });
  } catch (err) {
    console.error("Erro ao salvar chunk de upload:", err);
    return res.status(500).json({ error: "Falha ao gravar parte do arquivo." });
  }
});

// POST /api/v1/upload-complete — remonta os pedaços e salva o arquivo final
router.post("/upload-complete", requireAuth, async (req, res) => {
  const { uploadId, totalChunks, fileName, mimeType } = req.body;

  if (!uploadId || !totalChunks || !fileName) {
    return res.status(400).json({ error: "uploadId, totalChunks e fileName são obrigatórios." });
  }

  const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
  const ext = path.extname(fileName) || (mimeType && mimeType.includes("pdf") ? ".pdf" : ".xlsx");
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const finalFileName = `tpl_${Date.now()}_${randomSuffix}${ext}`;
  const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

  try {
    // Abre stream de escrita do arquivo binário final
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkFileName = `${safeUploadId}_${String(i).padStart(6, "0")}.part`;
      const chunkFilePath = path.join(TEMP_DIR, chunkFileName);

      if (!fs.existsSync(chunkFilePath)) {
        writeStream.destroy();
        return res.status(400).json({ error: `Parte ${i} do arquivo não foi encontrada.` });
      }

      const chunkBase64 = await fs.promises.readFile(chunkFilePath, "utf8");
      const chunkBuffer = Buffer.from(chunkBase64, "base64");
      writeStream.write(chunkBuffer);

      // Limpa a parte temporária
      fs.promises.unlink(chunkFilePath).catch(() => {});
    }

    await new Promise((resolve, reject) => {
      writeStream.end(resolve);
      writeStream.on("error", reject);
    });

    const fileUrl = `/api/v1/uploads/${finalFileName}`;
    return res.json({
      success: true,
      fileUrl,
      fileName,
    });
  } catch (err) {
    console.error("Erro ao remontar arquivo completo:", err);
    return res.status(500).json({ error: "Erro ao processar arquivo final." });
  }
});

// GET /api/v1/uploads/:fileName — serve o arquivo diretamente para visualização ou download
router.get("/uploads/:fileName", (req, res) => {
  const safeFileName = path.basename(req.params.fileName);
  const filePath = path.join(UPLOADS_DIR, safeFileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Arquivo não encontrado.");
  }

  const ext = path.extname(safeFileName).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") contentType = "application/pdf";
  else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  else if (ext === ".xls") contentType = "application/vnd.ms-excel";
  else if (ext === ".csv") contentType = "text/csv; charset=utf-8";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
  res.setHeader("Cache-Control", "public, max-age=86400");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

module.exports = router;
