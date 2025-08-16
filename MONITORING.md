# 📊 Story Typer - Monitoring & Analytics System

Sistem monitoring yang aman dan ramah anak untuk aplikasi Story Typer, dirancang khusus untuk anak-anak Indonesia.

## 🔒 Fokus Privasi Anak

Sistem monitoring ini dirancang dengan prinsip **privacy-by-design** untuk melindungi anak-anak:

- ❌ **Tidak menyimpan nama atau data pribadi**
- ❌ **Tidak merekam teks yang diketik anak**
- ❌ **Tidak menggunakan cookies tracking**
- ✅ **Hanya data agregat dan anonim**
- ✅ **Mudah di-disable oleh orang tua**
- ✅ **Transparan dan dapat diaudit**

## 🎯 Fitur Monitoring

### 1. **User Analytics (monitor.js)**
- **Session tracking**: Durasi bermain, bahasa yang dipilih
- **Performance metrics**: WPM, akurasi, kalimat selesai
- **User engagement**: Interaksi dengan UI, button clicks
- **Error tracking**: JavaScript dan WASM errors

### 2. **Performance Monitoring**
- **Load time**: Waktu muat aplikasi dan WASM
- **Memory usage**: Penggunaan memori browser
- **Frame rate**: Monitoring FPS untuk animasi smooth
- **Response time**: Kecepatan respons aplikasi

### 3. **Dashboard Analytics (dashboard.html)**
- **Real-time statistics**: Statistik penggunaan live
- **Educational insights**: Tips untuk pembelajaran anak
- **System health**: Status kesehatan aplikasi
- **Privacy indicators**: Indikator keamanan data

### 4. **A/B Testing Framework (ab-testing.js)**
- **Child-safe experiments**: Testing UI yang aman untuk anak
- **Educational focus**: Fokus pada nilai edukasi
- **Easy opt-out**: Mudah dinonaktifkan
- **Parent notification**: Notifikasi untuk orang tua

## 🚀 Cara Menggunakan

### Development Mode

1. **Start Analytics Server**:
```bash
node analytics-server.js
```

2. **Open Dashboard**:
```
http://localhost:3000/dashboard.html
```

3. **Check Health**:
```
http://localhost:3001/api/health
```

### Production Mode

1. **Environment Variables**:
```bash
export ANALYTICS_ENDPOINT="https://your-analytics-api.com"
export PRIVACY_MODE="strict"
```

2. **Deploy Analytics Server**:
```bash
# Deploy analytics-server.js to your cloud provider
# Configure CORS for your domain
```

## 📈 Data Structure

### Event Types

```javascript
// User interaction events
{
  type: "user_interaction",
  data: {
    type: "button_click",
    element: "language-option",
    timestamp: 1703123456789
  }
}

// Game session events
{
  type: "game_start",
  data: {
    language: "id",
    duration: 120,
    timestamp: 1703123456789
  }
}

// Performance events
{
  type: "performance_metric",
  data: {
    metric: "load_time",
    value: 1250,
    timestamp: 1703123456789
  }
}
```

### Privacy-Safe Data

✅ **Disimpan**:
- Agregat WPM dan akurasi
- Bahasa yang dipilih
- Durasi sesi bermain
- Error counts (tanpa detail)
- Performance metrics

❌ **Tidak Disimpan**:
- Nama anak
- Teks yang diketik
- IP address
- Browser fingerprinting
- Personal identifiers

## 🛡️ Keamanan Data

### Local Storage Only
- Data disimpan di browser anak
- Tidak dikirim ke server tanpa consent
- Dapat dihapus kapan saja

### Anonymization
```javascript
// Data yang dikirim (sudah di-anonymize)
{
  sessionId: "session_1703123_abc123",
  events: [...],
  userAgent: "Mozilla/5.0 (truncated)",
  timestamp: 1703123456789
}
```

### Parental Controls
```javascript
// Disable monitoring
localStorage.setItem('typing_game_analytics_consent', 'false');

// Disable A/B testing
localStorage.setItem('ab_testing_enabled', 'false');

// Clear all data
localStorage.clear();
```

## 📊 Dashboard Metrics

### Key Performance Indicators (KPIs)
- **Learning Progress**: Peningkatan WPM dan akurasi
- **Engagement**: Durasi sesi dan frequency bermain
- **Language Preference**: Bahasa yang paling sering digunakan
- **System Performance**: Load time dan error rate

### Educational Insights
- Tips untuk orang tua dan guru
- Benchmark WPM untuk usia anak
- Rekomendasi durasi bermain
- Progress tracking yang positif

## 🔧 Configuration

### Enable/Disable Features

```javascript
// In monitor.js
const config = {
  analytics: true,          // User analytics
  performance: true,        // Performance monitoring
  abTesting: true,         // A/B testing
  errorTracking: true,     // Error tracking
  privacyMode: 'strict'    // Privacy level
};
```

### Privacy Levels

1. **Strict**: Hanya data lokal, tidak ada transmission
2. **Standard**: Data agregat anonim ke server
3. **Minimal**: Hanya error tracking untuk stability

## 🎓 Educational Value

### Learning Analytics
- **Typing Speed Progression**: Tracking peningkatan WPM
- **Accuracy Improvement**: Monitoring perbaikan akurasi
- **Language Learning**: Support multilingual development
- **Motor Skills**: Tracking koordinasi tangan-mata

### Teacher/Parent Insights
- Dashboard untuk guru dan orang tua
- Progress reports yang mudah dibaca
- Rekomendasi pembelajaran individual
- Safety indicators untuk screen time

## 🚨 Troubleshooting

### Common Issues

1. **Analytics not working**:
```javascript
// Check if monitoring is enabled
console.log(window.typingGameMonitor.isEnabled);

// Check console for errors
console.log(window.typingGameMonitor.getSessionStats());
```

2. **Dashboard not loading**:
```bash
# Check analytics server
curl http://localhost:3001/api/health

# Check data directory
ls analytics-data/
```

3. **A/B testing not applying**:
```javascript
// Check experiment assignments
console.log(window.abTesting.getCurrentAssignments());

// Check if enabled
console.log(window.abTesting.isEnabled);
```

## 📝 Development Notes

### Adding New Metrics

1. **Define event type** in monitor.js
2. **Add tracking calls** in app.js
3. **Update dashboard** in dashboard.html
4. **Document privacy impact**

### A/B Testing Best Practices

1. **Child safety first**: No dark patterns
2. **Educational value**: Focus on learning outcomes
3. **Easy reversal**: Quick rollback capability
4. **Parent transparency**: Clear notifications

## 📞 Support

Untuk pertanyaan tentang privasi atau monitoring:
- **Email**: privacy@storytyper.id
- **Documentation**: /docs/privacy
- **Parent Guide**: /docs/parents

---

**Catatan**: Sistem ini dirancang khusus untuk anak-anak Indonesia dengan standar privasi tertinggi. Semua data processing mengikuti prinsip COPPA (Children's Online Privacy Protection Act) dan GDPR-K (GDPR for Kids).