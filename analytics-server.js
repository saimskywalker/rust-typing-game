/**
 * Simple Analytics Server for Story Typer
 * Privacy-focused analytics collection for Indonesian children's typing practice
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class AnalyticsServer {
    constructor(port = 3001) {
        this.port = port;
        this.dataDir = path.join(__dirname, 'analytics-data');
        this.ensureDataDirectory();
        
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        
        // Set CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        switch (parsedUrl.pathname) {
            case '/api/analytics':
                this.handleAnalytics(req, res);
                break;
            case '/api/dashboard':
                this.handleDashboard(req, res);
                break;
            case '/api/health':
                this.handleHealth(req, res);
                break;
            default:
                this.handle404(req, res);
        }
    }

    handleAnalytics(req, res) {
        if (req.method === 'POST') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    this.storeAnalyticsData(data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'success', 
                        message: 'Analytics data received',
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.error('Analytics parsing error:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        message: 'Invalid JSON data' 
                    }));
                }
            });
        } else if (req.method === 'GET') {
            this.getAnalyticsData(req, res);
        } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    }

    storeAnalyticsData(data) {
        // Privacy-safe storage - remove any potential PII
        const sanitizedData = {
            sessionId: data.sessionId,
            timestamp: data.timestamp,
            version: data.version,
            events: data.events.map(event => ({
                id: event.id,
                type: event.type,
                timestamp: event.timestamp,
                data: this.sanitizeEventData(event.data)
            }))
        };
        
        const filename = `analytics-${new Date().toISOString().split('T')[0]}.jsonl`;
        const filepath = path.join(this.dataDir, filename);
        
        // Append to daily file
        fs.appendFileSync(filepath, JSON.stringify(sanitizedData) + '\n');
        
        console.log(`📊 Analytics stored: ${data.events.length} events from session ${data.sessionId}`);
        
        // Generate daily summary
        this.generateDailySummary();
    }

    sanitizeEventData(data) {
        if (!data) return {};
        
        const sanitized = { ...data };
        
        // Remove any potentially identifying information
        delete sanitized.userName;
        delete sanitized.userInput;
        delete sanitized.personalInfo;
        
        // Truncate user agent for privacy
        if (sanitized.userAgent) {
            sanitized.userAgent = sanitized.userAgent.substring(0, 50);
        }
        
        return sanitized;
    }

    getAnalyticsData(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const { date, type } = parsedUrl.query;
        
        try {
            let data = [];
            
            if (date) {
                // Get specific date
                const filename = `analytics-${date}.jsonl`;
                const filepath = path.join(this.dataDir, filename);
                
                if (fs.existsSync(filepath)) {
                    const content = fs.readFileSync(filepath, 'utf8');
                    data = content.trim().split('\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));
                }
            } else {
                // Get last 7 days
                const files = fs.readdirSync(this.dataDir)
                    .filter(file => file.startsWith('analytics-') && file.endsWith('.jsonl'))
                    .sort()
                    .slice(-7);
                
                files.forEach(file => {
                    const filepath = path.join(this.dataDir, file);
                    const content = fs.readFileSync(filepath, 'utf8');
                    const fileData = content.trim().split('\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));
                    data.push(...fileData);
                });
            }
            
            // Filter by event type if specified
            if (type) {
                data = data.filter(session => 
                    session.events.some(event => event.type === type)
                );
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'success',
                data: data,
                count: data.length
            }));
        } catch (error) {
            console.error('Error retrieving analytics:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'error', 
                message: 'Failed to retrieve analytics data' 
            }));
        }
    }

    generateDailySummary() {
        const today = new Date().toISOString().split('T')[0];
        const filename = `analytics-${today}.jsonl`;
        const filepath = path.join(this.dataDir, filename);
        
        if (!fs.existsSync(filepath)) return;
        
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const sessions = content.trim().split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            
            const summary = this.calculateDailySummary(sessions);
            
            const summaryPath = path.join(this.dataDir, `summary-${today}.json`);
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
            
            console.log(`📈 Daily summary generated for ${today}`);
        } catch (error) {
            console.error('Error generating daily summary:', error);
        }
    }

    calculateDailySummary(sessions) {
        const summary = {
            date: new Date().toISOString().split('T')[0],
            totalSessions: sessions.length,
            totalEvents: 0,
            languages: { id: 0, en: 0, es: 0, fr: 0 },
            avgWPM: 0,
            avgAccuracy: 0,
            totalPlayTime: 0,
            sentencesCompleted: 0,
            errors: 0,
            performanceMetrics: {
                avgLoadTime: 0,
                memoryUsage: 0,
                errorRate: 0
            }
        };
        
        let wpmSum = 0, accuracySum = 0, wpmCount = 0, accuracyCount = 0;
        let loadTimeSum = 0, loadTimeCount = 0;
        
        sessions.forEach(session => {
            summary.totalEvents += session.events.length;
            
            session.events.forEach(event => {
                switch (event.type) {
                    case 'language_change':
                        if (event.data.to) {
                            summary.languages[event.data.to]++;
                        }
                        break;
                    case 'game_end':
                        if (event.data.wpm) {
                            wpmSum += event.data.wpm;
                            wpmCount++;
                        }
                        if (event.data.accuracy) {
                            accuracySum += event.data.accuracy;
                            accuracyCount++;
                        }
                        if (event.data.sessionDuration) {
                            summary.totalPlayTime += event.data.sessionDuration;
                        }
                        if (event.data.sentencesCompleted) {
                            summary.sentencesCompleted += event.data.sentencesCompleted;
                        }
                        break;
                    case 'error':
                        summary.errors++;
                        break;
                    case 'page_load_performance':
                        if (event.data.loadTime) {
                            loadTimeSum += event.data.loadTime;
                            loadTimeCount++;
                        }
                        break;
                }
            });
        });
        
        // Calculate averages
        summary.avgWPM = wpmCount > 0 ? Math.round(wpmSum / wpmCount) : 0;
        summary.avgAccuracy = accuracyCount > 0 ? Math.round(accuracySum / accuracyCount) : 0;
        summary.performanceMetrics.avgLoadTime = loadTimeCount > 0 ? Math.round(loadTimeSum / loadTimeCount) : 0;
        summary.performanceMetrics.errorRate = summary.totalEvents > 0 ? 
            Math.round((summary.errors / summary.totalEvents) * 100) : 0;
        
        return summary;
    }

    handleDashboard(req, res) {
        try {
            const summaryFiles = fs.readdirSync(this.dataDir)
                .filter(file => file.startsWith('summary-') && file.endsWith('.json'))
                .sort()
                .slice(-30); // Last 30 days
            
            const dashboardData = summaryFiles.map(file => {
                const filepath = path.join(this.dataDir, file);
                return JSON.parse(fs.readFileSync(filepath, 'utf8'));
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'success',
                data: dashboardData,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Dashboard error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'error', 
                message: 'Failed to generate dashboard data' 
            }));
        }
    }

    handleHealth(req, res) {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            dataDirectory: this.dataDir,
            filesCount: fs.readdirSync(this.dataDir).length
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
    }

    handle404(req, res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'error', 
            message: 'Endpoint not found' 
        }));
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`📊 Analytics Server running on http://localhost:${this.port}`);
            console.log(`📁 Data directory: ${this.dataDir}`);
            console.log('\nAvailable endpoints:');
            console.log(`  POST /api/analytics - Store analytics data`);
            console.log(`  GET  /api/analytics - Retrieve analytics data`);
            console.log(`  GET  /api/dashboard - Get dashboard data`);
            console.log(`  GET  /api/health    - Server health check`);
        });
    }

    stop() {
        this.server.close();
        console.log('Analytics server stopped');
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new AnalyticsServer(process.env.PORT || 3001);
    server.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down analytics server...');
        server.stop();
        process.exit(0);
    });
}

module.exports = AnalyticsServer;