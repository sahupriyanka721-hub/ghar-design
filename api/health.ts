export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  return res.status(200).json({
    status: 'healthy',
    platform: 'GharDesign Cloud Serverless API',
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    environment: process.env.NODE_ENV || 'production',
  });
}
