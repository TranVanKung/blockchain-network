import express from 'express';
import dotenv from 'dotenv';
import router from '@/route/index';

import { checkColumn } from '@/service';
import { parsePdf } from '@/service/pdf';

parsePdf();

// checkColumn();

// dotenv.config();

// const { PORT } = process.env;

// const app = express();

// app.use('/', router);

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
