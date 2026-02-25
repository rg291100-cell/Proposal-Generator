export class HealthService {
    async getHealthStatus() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Connected via Prisma'
        };
    }
}
