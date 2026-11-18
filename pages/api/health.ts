import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: 'UP';
  timestamp: string;
  uptime: number;
  environment: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
  });
}
