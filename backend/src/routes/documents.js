import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import prisma from '../config/prisma.js';
import { uploadToS3, deleteFromS3, getS3SignedUrl, streamFromS3 } from '../config/s3.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { processDocument } from '../controllers/documentController.js';
import { runDocumentIntelligence } from '../services/intelligenceService.js';
import { documentListCache, analyticsCache } from '../config/cache.js';

const router = express.Router();

// Helper to mask sensitive PII for restricted roles (e.g., STUDENT)
const maskDocForRole = (doc, role) => {
  if (role === 'ADMIN' || role === 'FACULTY' || role === 'VERIFIER') {
    return doc;
  }
  // Restricted role: mask phone number
  const maskedPhone = doc.phoneNumber
    ? doc.phoneNumber.replace(/^(\+?\d{2,4})?(\d{2})(\d+)(\d{2})$/, '$1-$2-XXXXX-$4')
    : null;

  return {
    ...doc,
    phoneNumber: maskedPhone,
  };
};

// Invalidate caches for user
const bustUserCaches = (userId) => {
  documentListCache.delete(`docs:${userId}`);
  analyticsCache.delete(`analytics:${userId}`);
  analyticsCache.delete(`analytics:usage:${userId}`);
};

// Ensure profile exists in database to prevent foreign key errors
const ensureUserExists = async (user) => {
  if (!user?.id) throw new Error('Unauthorized');
  let profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) {
    const userEmail = (user.email || 'guest@docmind.ai').toLowerCase().trim();
    profile = await prisma.profile.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        id: user.id,
        email: userEmail,
        fullName: user.fullName || 'DocMind Explorer',
        role: user.role || 'VERIFIER',
      },
    });
  }
  return profile.id;
};

// Public file streaming endpoint (handles local files or S3)
router.get('/file/:key', async (req, res) => {
  try {
    const rawKey = decodeURIComponent(req.params.key);
    const localPath = path.join(process.cwd(), 'uploads', rawKey);

    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    const { body, contentType } = await streamFromS3(rawKey);
    res.setHeader('Content-Type', contentType || 'application/pdf');
    if (body.pipe) {
      body.pipe(res);
    } else {
      res.send(await body.transformToByteArray());
    }
  } catch (err) {
    console.error('File stream error:', err);
    res.status(404).send('File not found');
  }
});

// All following routes require authentication
router.use(authenticate);

// GET /api/documents/facets - Get dynamic root filter facets and statistics
router.get('/facets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { docType } = req.query;

    const where = {
      userId,
      ...(docType && docType !== 'ALL' && { docType }),
    };

    const docs = await prisma.document.findMany({
      where,
      select: {
        docType: true,
        department: true,
        semester: true,
        examType: true,
        courseCode: true,
        academicYear: true,
        hasQrCode: true,
        isVerified: true,
        anomalyScore: true,
        phoneNumber: true,
      },
    });

    const getFrequency = (arr) => {
      const counts = {};
      arr.filter(Boolean).forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    };

    const facets = {
      total: docs.length,
      docTypes: getFrequency(docs.map(d => d.docType)),
      departments: getFrequency(docs.map(d => d.department)),
      semesters: getFrequency(docs.map(d => d.semester)),
      examTypes: getFrequency(docs.map(d => d.examType)),
      courseCodes: getFrequency(docs.map(d => d.courseCode)),
      academicYears: getFrequency(docs.map(d => d.academicYear)),
      withQrCount: docs.filter(d => d.hasQrCode).length,
      verifiedCount: docs.filter(d => d.isVerified).length,
      withPhoneCount: docs.filter(d => d.phoneNumber).length,
      missingAnomaliesCount: docs.filter(d => (d.anomalyScore || 0) > 0).length,
    };

    res.json(facets);
  } catch (error) {
    console.error('Facets error:', error);
    res.status(500).json({ error: 'Failed to compute facets' });
  }
});

// GET /api/documents - List documents with root vast filtering and RBAC masking
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 24,
      search,
      status,
      docType,
      department,
      enrollmentNo,
      academicYear,
      semester,
      courseCode,
      examType,
      durationHours,
      hasQrCode,
      hasPhone,
      isVerified,
      hasMissing,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const userId = req.user.id;
    const role = req.user.role || 'USER';

    const where = {
      userId,
      ...(status && { status }),
      ...(docType && docType !== 'ALL' && { docType }),
      ...(department && { department: { equals: department, mode: 'insensitive' } }),
      ...(enrollmentNo && { enrollmentNo: { contains: enrollmentNo, mode: 'insensitive' } }),
      ...(academicYear && { academicYear: { contains: academicYear, mode: 'insensitive' } }),
      ...(semester && { semester: { equals: semester, mode: 'insensitive' } }),
      ...(courseCode && { courseCode: { equals: courseCode, mode: 'insensitive' } }),
      ...(examType && { examType: { equals: examType, mode: 'insensitive' } }),
      ...(durationHours && { durationHours: { contains: durationHours, mode: 'insensitive' } }),
      ...(hasQrCode !== undefined && hasQrCode !== '' && { hasQrCode: hasQrCode === 'true' }),
      ...(isVerified !== undefined && isVerified !== '' && { isVerified: isVerified === 'true' }),
      ...(hasPhone === 'true' && { phoneNumber: { not: null } }),
      ...(hasPhone === 'false' && { phoneNumber: null }),
      ...(hasMissing === 'true' && { anomalyScore: { gt: 0 } }),
    };

    // Full-text / Multi-field search
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fileName: { contains: q, mode: 'insensitive' } },
        { candidateName: { contains: q, mode: 'insensitive' } },
        { courseCode: { contains: q, mode: 'insensitive' } },
        { courseName: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { enrollmentNo: { contains: q, mode: 'insensitive' } },
        { serialNo: { contains: q, mode: 'insensitive' } },
        { issuingAuthority: { contains: q, mode: 'insensitive' } },
        { qrCodeData: { contains: q, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'candidateName', 'courseCode', 'semester', 'academicYear', 'department', 'title'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [orderField]: orderDirection },
      }),
      prisma.document.count({ where }),
    ]);

    // Apply RBAC field masking
    const maskedDocs = documents.map(d => maskDocForRole(d, role));

    res.json({
      documents: maskedDocs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id - Single document detail
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        chunks: { take: 10, orderBy: { chunkIndex: 'asc' } },
      },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    let viewUrl = null;
    try {
      viewUrl = await getS3SignedUrl(document.filePath);
    } catch (e) {
      viewUrl = `/api/documents/file/${encodeURIComponent(document.filePath)}`;
    }

    const masked = maskDocForRole(document, req.user.role);
    res.json({ document: { ...masked, viewUrl } });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/documents/upload - Single document upload
router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = await ensureUserExists(req.user);
    const { title } = req.body;
    const fileName  = req.file.originalname;
    const fileSize  = req.file.size;
    const mimeType  = req.file.mimetype;
    const buffer    = req.file.buffer;

    const ext   = path.extname(fileName);
    const s3Key = `documents/${userId}/${uuidv4()}${ext}`;

    const storedKey = await uploadToS3(buffer, s3Key, mimeType);

    const document = await prisma.document.create({
      data: {
        userId,
        title:    title || fileName.replace(/\.(pdf|png|jpg|jpeg|tiff?|webp)$/i, ''),
        fileName,
        filePath: storedKey,
        fileSize,
        mimeType,
        status:   'PROCESSING',
      },
    });

    bustUserCaches(userId);

    // Process intelligence asynchronously in background
    processDocument(document.id, buffer, fileName)
      .then(() => bustUserCaches(userId))
      .catch(err => console.error('processDocument error:', err));

    res.status(201).json({
      message: 'Document uploaded. Document Intelligence processing started.',
      document,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// POST /api/documents/batch-upload - Batch / Multi-file Upload (up to 50 files)
router.post('/batch-upload', uploadLimiter, uploadMiddleware.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = await ensureUserExists(req.user);
    const createdDocs = [];

    for (const file of req.files) {
      const fileName = file.originalname;
      const fileSize = file.size;
      const mimeType = file.mimetype;
      const buffer = file.buffer;
      const ext = path.extname(fileName);
      const s3Key = `documents/${userId}/${uuidv4()}${ext}`;

      const storedKey = await uploadToS3(buffer, s3Key, mimeType);

      const doc = await prisma.document.create({
        data: {
          userId,
          title: fileName.replace(/\.(pdf|png|jpg|jpeg|tiff?|webp)$/i, ''),
          fileName,
          filePath: storedKey,
          fileSize,
          mimeType,
          status: 'PROCESSING',
        },
      });

      createdDocs.push(doc);

      // Trigger intelligence pipeline
      processDocument(doc.id, buffer, fileName)
        .then(() => bustUserCaches(userId))
        .catch(err => console.error(`Batch process error for ${doc.id}:`, err));
    }

    bustUserCaches(userId);

    res.status(201).json({
      message: `Batch upload started for ${createdDocs.length} files. Extraction running in background.`,
      count: createdDocs.length,
      documents: createdDocs,
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: 'Batch upload failed: ' + error.message });
  }
});

// POST /api/documents/organize - Group and sequence documents hierarchically
router.post('/organize', async (req, res) => {
  try {
    const { docIds, sequenceBy = ['department', 'semester', 'examType', 'courseCode'] } = req.body;
    const userId = req.user.id;

    const where = {
      userId,
      ...(docIds && docIds.length > 0 && { id: { in: docIds } }),
    };

    const documents = await prisma.document.findMany({ where });

    // Sort documents based on sequence priority
    const sorted = [...documents].sort((a, b) => {
      for (const field of sequenceBy) {
        const valA = (a[field] || '').toLowerCase();
        const valB = (b[field] || '').toLowerCase();
        // Give 'MAIN' priority before 'BACK'
        if (field === 'examType') {
          if (valA === 'main' && valB === 'back') return -1;
          if (valA === 'back' && valB === 'main') return 1;
        }
        if (valA < valB) return -1;
        if (valA > valB) return 1;
      }
      return 0;
    });

    // Compute structured hierarchy tree & standardized filenames
    const organizedTree = {};
    const formattedList = sorted.map((doc, idx) => {
      const dept = doc.department || 'General';
      const sem = doc.semester || 'Unassigned_Sem';
      const exam = doc.examType || 'Exam';
      const code = doc.courseCode || doc.enrollmentNo || `DOC_${idx + 1}`;

      const standardizedName = doc.docType === 'CERTIFICATE'
        ? `${dept}_${doc.enrollmentNo || 'NO_ROLL'}_${(doc.candidateName || 'Candidate').replace(/\s+/g, '_')}_Cert.pdf`
        : `${dept}_${sem}_${exam}_${code}_${(doc.courseName || 'Paper').replace(/\s+/g, '_')}.pdf`;

      const folderPath = `${dept}/${sem}/${exam}`;

      if (!organizedTree[dept]) organizedTree[dept] = {};
      if (!organizedTree[dept][sem]) organizedTree[dept][sem] = {};
      if (!organizedTree[dept][sem][exam]) organizedTree[dept][sem][exam] = [];

      organizedTree[dept][sem][exam].push({
        id: doc.id,
        originalName: doc.fileName,
        standardizedName,
        docType: doc.docType,
        hasQrCode: doc.hasQrCode,
        isVerified: doc.isVerified,
      });

      return {
        ...maskDocForRole(doc, req.user.role),
        sequenceIndex: idx + 1,
        folderPath,
        standardizedName,
      };
    });

    res.json({
      total: formattedList.length,
      hierarchy: organizedTree,
      sequence: formattedList,
    });
  } catch (error) {
    console.error('Organize error:', error);
    res.status(500).json({ error: 'Failed to organize documents' });
  }
});

// POST /api/documents/export-zip - Download organized sequenced ZIP archive
router.post('/export-zip', async (req, res) => {
  try {
    const { docIds, namingTemplate = 'hierarchical' } = req.body;
    const userId = req.user.id;

    const where = {
      userId,
      ...(docIds && docIds.length > 0 && { id: { in: docIds } }),
    };

    const documents = await prisma.document.findMany({ where });
    if (documents.length === 0) {
      return res.status(404).json({ error: 'No documents to export' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="DocMind_Organized_Documents.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) res.status(500).send('Archive error');
    });

    // Add manifest JSON at zip root
    const manifest = documents.map((doc, idx) => ({
      index: idx + 1,
      id: doc.id,
      title: doc.title,
      docType: doc.docType,
      department: doc.department,
      semester: doc.semester,
      examType: doc.examType,
      courseCode: doc.courseCode,
      courseName: doc.courseName,
      enrollmentNo: doc.enrollmentNo,
      candidateName: doc.candidateName,
      hasQrCode: doc.hasQrCode,
      qrCodeData: doc.qrCodeData,
      isVerified: doc.isVerified,
    }));
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // Pack each document into organized directory structure
    for (const doc of documents) {
      const dept = (doc.department || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
      const sem = (doc.semester || 'Semester').replace(/[^a-zA-Z0-9_-]/g, '_');
      const exam = (doc.examType || 'Exam').toUpperCase();

      let targetName = doc.fileName;
      let zipPath = `${dept}/${sem}/${targetName}`;

      if (doc.docType === 'CERTIFICATE') {
        const roll = doc.enrollmentNo || 'NO_ROLL';
        const name = (doc.candidateName || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
        zipPath = `Certificates/${dept}/${roll}_${name}.pdf`;
      } else if (doc.docType === 'QUESTION_PAPER') {
        const code = (doc.courseCode || 'CODE').replace(/[^a-zA-Z0-9_-]/g, '_');
        zipPath = `QuestionPapers/${dept}/${sem}/${exam}_${code}.pdf`;
      }

      // Check local file existence or dummy stream
      const rawKey = doc.filePath.replace('local:', '');
      const localFilePath = path.join(process.cwd(), 'uploads', rawKey);
      if (fs.existsSync(localFilePath)) {
        archive.file(localFilePath, { name: zipPath });
      } else {
        // Create summary sheet if file binary is offsite
        const summaryText = `DocMind AI Document Record:\n\nTitle: ${doc.title}\nType: ${doc.docType}\nDepartment: ${doc.department}\nSemester: ${doc.semester}\nCourse/Roll: ${doc.courseCode || doc.enrollmentNo}\nSummary: ${doc.summary || ''}\nQR Data: ${doc.qrCodeData || 'N/A'}`;
        archive.append(summaryText, { name: zipPath.replace(/\.pdf$/, '.txt') });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Export zip error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate ZIP' });
  }
});

// PATCH /api/documents/:id/verify - Toggle verification badge (Verifier / Admin / Faculty)
router.patch('/:id/verify', async (req, res) => {
  try {
    const { isVerified = true } = req.body;
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        isVerified,
        verifiedBy: isVerified ? (req.user.fullName || req.user.email) : null,
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    bustUserCaches(req.user.id);
    res.json({ message: 'Verification status updated', document: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// PATCH /api/documents/:id/update-fields - Manually edit extracted entities
router.patch('/:id/update-fields', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const {
      candidateName,
      department,
      enrollmentNo,
      academicYear,
      semester,
      phoneNumber,
      email,
      courseCode,
      courseName,
      examType,
      durationHours,
      issuingAuthority,
      serialNo,
      docType,
    } = req.body;

    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        ...(candidateName !== undefined && { candidateName }),
        ...(department !== undefined && { department }),
        ...(enrollmentNo !== undefined && { enrollmentNo }),
        ...(academicYear !== undefined && { academicYear }),
        ...(semester !== undefined && { semester }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(email !== undefined && { email }),
        ...(courseCode !== undefined && { courseCode }),
        ...(courseName !== undefined && { courseName }),
        ...(examType !== undefined && { examType }),
        ...(durationHours !== undefined && { durationHours }),
        ...(issuingAuthority !== undefined && { issuingAuthority }),
        ...(serialNo !== undefined && { serialNo }),
        ...(docType !== undefined && { docType }),
      },
    });

    bustUserCaches(req.user.id);
    res.json({ message: 'Fields updated successfully', document: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fields' });
  }
});

// POST /api/documents/:id/reprocess - Re-run intelligence extraction on existing document
// Responds immediately (202) and runs AI in background to avoid gateway timeout
router.post('/:id/reprocess', async (req, res) => {
  try {
    const userId = await ensureUserExists(req.user);
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Mark as processing immediately
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'PROCESSING' },
    });

    // Respond immediately — don't wait for AI (avoid 25s timeout)
    res.status(202).json({
      message: 'Re-extraction started. Document intelligence is running in background.',
      documentId: document.id,
    });

    // Run intelligence in background (fire-and-forget)
    (async () => {
      try {
        const text = document.chunks.map(c => c.content).join('\n\n') || document.title;
        const intel = await runDocumentIntelligence({
          text,
          fileName: document.fileName,
          ocrConfidence: document.ocrConfidence || 95,
        });

        await prisma.document.update({
          where: { id: document.id },
          data: { ...intel, status: 'READY' },
        });

        bustUserCaches(userId);
        console.log(`✅ Reprocess complete for ${document.id}`);
      } catch (bgErr) {
        console.error(`❌ Reprocess background error for ${document.id}:`, bgErr.message);
        await prisma.document.update({
          where: { id: document.id },
          data: { status: 'READY' },
        }).catch(() => {});
      }
    })();
  } catch (error) {
    console.error('Reprocess error:', error);
    res.status(500).json({ error: 'Failed to reprocess: ' + error.message });
  }
});

// DELETE /api/documents/:id - Delete single document
router.delete('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    await deleteFromS3(document.filePath);
    await prisma.document.delete({ where: { id: req.params.id } });

    bustUserCaches(req.user.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/documents/seed-samples - Seed rich institutional test records
router.post('/seed-samples', async (req, res) => {
  try {
    const userId = await ensureUserExists(req.user);

    const sampleDocs = [
      {
        userId,
        title: 'B.Tech V Sem End Term Exam - Analysis of Algorithms (Main)',
        fileName: '5CS4-02_Analysis_of_Algorithms_Main_2023.pdf',
        filePath: 'local:samples/5CS4-02.pdf',
        fileSize: 1024 * 240,
        pageCount: 3,
        status: 'READY',
        docType: 'QUESTION_PAPER',
        classificationConfidence: 98,
        courseCode: '5CS4-02',
        courseName: 'Analysis of Algorithms',
        department: 'Computer Science & Engineering',
        semester: 'V Semester',
        examType: 'MAIN',
        academicYear: '2023-2024',
        durationHours: '3 Hours',
        maxMarks: '70',
        hasQrCode: true,
        qrCodeData: 'RTU-EXAM-PAPER-5CS402-MAIN-2023-VERIFIED',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: true,
        summary: 'RTU End-Term Question Paper for Analysis of Algorithms (5CS4-02), V Semester Main Exam. 3 Hours duration, 70 Max Marks. Covers Divide & Conquer, Dynamic Programming, Greedy Algorithms.',
        rawExtracted: {
          docType: 'QUESTION_PAPER',
          fields: { courseCode: '5CS4-02', courseName: 'Analysis of Algorithms', examType: 'MAIN', semester: 'V Semester', durationHours: '3 Hours', maxMarks: '70' },
          confidences: { courseCode: 98, examType: 97, durationHours: 95, maxMarks: 96 },
          sourceQuotes: { courseCode: '5CS4-02 Analysis of Algorithms', examType: 'Main Examination Dec 2023', durationHours: 'Time Allowed: 3 Hours' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
        anomalyNotes: 'Clean question paper. All examination header fields valid.'
      },
      {
        userId,
        title: 'B.Tech V Sem End Term Exam - Compiler Design (Back Paper)',
        fileName: '5CS4-03_Compiler_Design_Back_2023.pdf',
        filePath: 'local:samples/5CS4-03.pdf',
        fileSize: 1024 * 180,
        pageCount: 2,
        status: 'READY',
        docType: 'QUESTION_PAPER',
        classificationConfidence: 96,
        courseCode: '5CS4-03',
        courseName: 'Compiler Design',
        department: 'Computer Science & Engineering',
        semester: 'V Semester',
        examType: 'BACK',
        academicYear: '2023-2024',
        durationHours: '3 Hours',
        maxMarks: '70',
        hasQrCode: true,
        qrCodeData: 'RTU-EXAM-PAPER-5CS403-BACK-2023-VERIFIED',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: false,
        summary: 'Back Examination Question Paper for Compiler Design (5CS4-03). V Semester, 3 Hours, 70 Max Marks. Lexical analysis, LL(1) and LR parsers, Code generation.',
        rawExtracted: {
          docType: 'QUESTION_PAPER',
          fields: { courseCode: '5CS4-03', courseName: 'Compiler Design', examType: 'BACK', semester: 'V Semester', durationHours: '3 Hours' },
          confidences: { courseCode: 96, examType: 95, durationHours: 94 },
          sourceQuotes: { courseCode: '5CS4-03 Compiler Design', examType: 'Back Examination 2023' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
      },
      {
        userId,
        title: 'NPTEL Cloud Computing Certificate - Harsh Vardhan',
        fileName: 'NPTEL_Cert_Harsh_Vardhan_21ESKCS084.pdf',
        filePath: 'local:samples/cert1.pdf',
        fileSize: 1024 * 320,
        pageCount: 1,
        status: 'READY',
        docType: 'CERTIFICATE',
        classificationConfidence: 99,
        candidateName: 'Harsh Vardhan',
        department: 'Computer Science & Engineering',
        enrollmentNo: '21ESKCS084',
        academicYear: '2023-2024',
        semester: 'VI Semester',
        phoneNumber: '+91-9829012345',
        email: 'harsh.cs21@skit.ac.in',
        issuingAuthority: 'NPTEL - IIT Kharagpur',
        serialNo: 'NPTEL24CS18S3489021',
        gradeScore: 'Elite + Silver (84%)',
        issueDate: 'April 2024',
        hasQrCode: true,
        qrCodeData: 'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL24CS18S3489021',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: true,
        summary: 'Certificate of Completion awarded to Harsh Vardhan (Roll No: 21ESKCS084) from Computer Science & Engineering for passing 12-week NPTEL Cloud Computing course with Elite + Silver score (84%).',
        rawExtracted: {
          docType: 'CERTIFICATE',
          fields: { candidateName: 'Harsh Vardhan', department: 'Computer Science & Engineering', enrollmentNo: '21ESKCS084', gradeScore: 'Elite + Silver', phoneNumber: '+91-9829012345' },
          confidences: { candidateName: 99, enrollmentNo: 98, gradeScore: 95, phoneNumber: 96 },
          sourceQuotes: { candidateName: 'This is to certify that Harsh Vardhan', enrollmentNo: 'Roll No: 21ESKCS084', gradeScore: 'Elite + Silver' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
      },
      {
        userId,
        title: 'National Workshop on AI & Robotics - Priya Sharma',
        fileName: 'AI_Workshop_Cert_Priya_Sharma.pdf',
        filePath: 'local:samples/cert2.pdf',
        fileSize: 1024 * 280,
        pageCount: 1,
        status: 'READY',
        docType: 'CERTIFICATE',
        classificationConfidence: 95,
        candidateName: 'Priya Sharma',
        department: 'Information Technology',
        enrollmentNo: '21ESKIT042',
        academicYear: '2023-2024',
        semester: 'VI Semester',
        phoneNumber: null, // Intentionally missing phone for anomaly demonstration
        email: 'priya.it21@skit.ac.in',
        issuingAuthority: 'Swami Keshvanand Institute of Technology (SKIT)',
        serialNo: 'SKIT-AI-WKSHP-2024-051',
        gradeScore: 'Distinction',
        issueDate: 'February 2024',
        hasQrCode: false, // Intentionally missing QR for anomaly demonstration
        qrCodeData: null,
        barcodeType: 'NONE',
        qrVerified: false,
        isVerified: false,
        summary: 'Participation certificate for Priya Sharma (21ESKIT042) in National Workshop on AI & Robotics at SKIT Jaipur. Awarded Distinction.',
        rawExtracted: {
          docType: 'CERTIFICATE',
          fields: { candidateName: 'Priya Sharma', department: 'Information Technology', enrollmentNo: '21ESKIT042' },
          confidences: { candidateName: 96, enrollmentNo: 94 },
          sourceQuotes: { candidateName: 'awarded to Priya Sharma', enrollmentNo: 'Enrollment: 21ESKIT042' }
        },
        missingFields: JSON.stringify(['Phone Number', 'Verification QR Code']),
        anomalyScore: 0.45,
        anomalyNotes: 'Attention: Missing candidate contact phone number and certificate verification QR code.',
      },
      {
        userId,
        title: 'B.Tech III Sem End Term Exam - Data Structures (Main)',
        fileName: '3CS4-05_Data_Structures_Main_2023.pdf',
        filePath: 'local:samples/3CS4-05.pdf',
        fileSize: 1024 * 210,
        pageCount: 2,
        status: 'READY',
        docType: 'QUESTION_PAPER',
        classificationConfidence: 97,
        courseCode: '3CS4-05',
        courseName: 'Data Structures & Algorithms',
        department: 'Computer Science & Engineering',
        semester: 'III Semester',
        examType: 'MAIN',
        academicYear: '2023-2024',
        durationHours: '3 Hours',
        maxMarks: '70',
        hasQrCode: true,
        qrCodeData: 'RTU-EXAM-3CS405-MAIN-2023',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: true,
        summary: 'RTU End Term Question Paper for Data Structures & Algorithms (3CS4-05). III Semester Main Exam, 3 Hours, 70 Marks.',
        rawExtracted: {
          docType: 'QUESTION_PAPER',
          fields: { courseCode: '3CS4-05', courseName: 'Data Structures & Algorithms', examType: 'MAIN', semester: 'III Semester' },
          confidences: { courseCode: 97, examType: 95 },
          sourceQuotes: { courseCode: '3CS4-05 Data Structures & Algorithms', examType: 'Main Exam' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
      },
      {
        userId,
        title: 'B.Tech VII Sem End Term Exam - Cloud Computing (Main)',
        fileName: '7IT4-01_Cloud_Computing_Main_2024.pdf',
        filePath: 'local:samples/7IT4-01.pdf',
        fileSize: 1024 * 195,
        pageCount: 2,
        status: 'READY',
        docType: 'QUESTION_PAPER',
        classificationConfidence: 98,
        courseCode: '7IT4-01',
        courseName: 'Cloud Computing Architecture',
        department: 'Information Technology',
        semester: 'VII Semester',
        examType: 'MAIN',
        academicYear: '2024-2025',
        durationHours: '3 Hours',
        maxMarks: '70',
        hasQrCode: true,
        qrCodeData: 'RTU-7IT401-MAIN-2024-VERIFIED',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: true,
        summary: 'End Term Question Paper for Cloud Computing Architecture (7IT4-01), VII Semester Main Examination. 3 Hours duration.',
        rawExtracted: {
          docType: 'QUESTION_PAPER',
          fields: { courseCode: '7IT4-01', courseName: 'Cloud Computing Architecture', examType: 'MAIN', semester: 'VII Semester' },
          confidences: { courseCode: 98, examType: 97 },
          sourceQuotes: { courseCode: '7IT4-01 Cloud Computing Architecture', examType: 'Main Exam' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
      },
      {
        userId,
        title: 'Coursera Full Stack Web Development - Rohan Verma',
        fileName: 'Coursera_Full_Stack_Rohan_Verma.pdf',
        filePath: 'local:samples/cert3.pdf',
        fileSize: 1024 * 290,
        pageCount: 1,
        status: 'READY',
        docType: 'CERTIFICATE',
        classificationConfidence: 97,
        candidateName: 'Rohan Verma',
        department: 'Computer Science & Engineering',
        enrollmentNo: '21ESKCS112',
        academicYear: '2023-2024',
        semester: 'VI Semester',
        phoneNumber: '+91-9414098765',
        email: 'rohan.verma@skit.ac.in',
        issuingAuthority: 'Coursera / Meta',
        serialNo: 'COURSERA-FS-2024-9981',
        gradeScore: '96.5%',
        issueDate: 'May 2024',
        hasQrCode: true,
        qrCodeData: 'https://coursera.org/verify/COURSERA-FS-2024-9981',
        barcodeType: 'QR_CODE',
        qrVerified: true,
        isVerified: true,
        summary: 'Professional Certificate in Full Stack Development issued to Rohan Verma (21ESKCS112) with 96.5% score.',
        rawExtracted: {
          docType: 'CERTIFICATE',
          fields: { candidateName: 'Rohan Verma', department: 'Computer Science & Engineering', enrollmentNo: '21ESKCS112', phoneNumber: '+91-9414098765' },
          confidences: { candidateName: 98, enrollmentNo: 97, phoneNumber: 96 },
          sourceQuotes: { candidateName: 'awarded to Rohan Verma', enrollmentNo: '21ESKCS112' }
        },
        missingFields: '[]',
        anomalyScore: 0.0,
      }
    ];

    const created = [];
    for (const data of sampleDocs) {
      const doc = await prisma.document.create({ data });
      created.push(doc);
    }

    bustUserCaches(userId);

    res.status(201).json({
      message: `Seeded ${created.length} rich sample documents with certificates, question papers, QR codes, and anomalies!`,
      count: created.length,
      documents: created,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed sample documents: ' + error.message });
  }
});

export default router;
