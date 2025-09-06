const fs = require('fs');
const path = require('path');

console.log('🔧 Building Scripture Flow for Netlify deployment...');

// Read package.json for metadata
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Validate required files exist
const requiredFiles = [
    'index.html',
    'quotes.js',
    'static/css/styles.css',
    'static/js/app.js',
    'netlify.toml'
];

console.log('📋 Validating required files...');
let missingFiles = [];

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        missingFiles.push(file);
    } else {
        console.log(`✅ ${file}`);
    }
}

if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
}

// Validate quotes.js structure
console.log('🔍 Validating quotes.js structure...');
try {
    const quotesContent = fs.readFileSync('quotes.js', 'utf8');
    
    // Basic validation - check if it contains BIBLE_QUOTES array
    if (!quotesContent.includes('BIBLE_QUOTES') || !quotesContent.includes('[')) {
        throw new Error('Invalid quotes.js structure');
    }
    
    // Extract the BIBLE_QUOTES array using regex for safer parsing
    const quotesMatch = quotesContent.match(/const\s+BIBLE_QUOTES\s*=\s*(\[[\s\S]*?\]);/);
    if (!quotesMatch) {
        throw new Error('Could not extract BIBLE_QUOTES array');
    }
    
    // Parse the quotes array
    let quotes;
    try {
        quotes = eval(`(${quotesMatch[1]})`);
    } catch (parseError) {
        throw new Error('Invalid JavaScript in quotes array');
    }
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
        throw new Error('BIBLE_QUOTES must be a non-empty array');
    }
    
    // Validate each quote has required properties
    quotes.forEach((quote, index) => {
        if (!quote.text || !quote.reference || typeof quote.text !== 'string' || typeof quote.reference !== 'string') {
            throw new Error(`Invalid quote at index ${index}: missing text or reference`);
        }
        if (quote.text.length > 1000 || quote.reference.length > 100) {
            throw new Error(`Quote at index ${index} is too long`);
        }
    });
    
    console.log(`✅ Found ${quotes.length} valid quotes`);
    
    // Store the count for later use
    global.quotesCount = quotes.length;
} catch (error) {
    console.error('❌ Error validating quotes.js:', error.message);
    process.exit(1);
}

// Security validation
console.log('🔒 Performing security checks...');

// Check for potential security issues in JavaScript files
const jsFiles = ['static/js/app.js'];
for (const jsFile of jsFiles) {
    const content = fs.readFileSync(jsFile, 'utf8');
    
    // Check for dangerous patterns
    const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /document\.write\s*\(/,
        /\.innerHTML\s*=/,
        /window\.open\s*\(/
    ];
    
    let securityIssues = [];
    dangerousPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
            const patternNames = ['eval()', 'Function()', 'document.write()', '.innerHTML =', 'window.open()'];
            securityIssues.push(patternNames[index]);
        }
    });
    
    if (securityIssues.length > 0) {
        console.warn(`⚠️  Potential security issues in ${jsFile}:`);
        securityIssues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
        console.log(`✅ ${jsFile} - No security issues detected`);
    }
}

// Check netlify.toml for security headers
console.log('🛡️  Validating security headers...');
const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
const requiredHeaders = [
    'X-Frame-Options',
    'X-XSS-Protection',
    'X-Content-Type-Options',
    'Content-Security-Policy',
    'Strict-Transport-Security'
];

let missingHeaders = [];
for (const header of requiredHeaders) {
    if (!netlifyConfig.includes(header)) {
        missingHeaders.push(header);
    }
}

if (missingHeaders.length > 0) {
    console.warn('⚠️  Missing security headers:');
    missingHeaders.forEach(header => console.warn(`   - ${header}`));
} else {
    console.log('✅ All required security headers present');
}

// Performance optimization suggestions
console.log('⚡ Performance optimization checks...');

// Check for external dependencies
const indexHtml = fs.readFileSync('index.html', 'utf8');
const externalResources = [
    { pattern: /https:\/\/cdn\.jsdelivr\.net/, name: 'jsDelivr CDN' },
    { pattern: /https:\/\/fonts\.googleapis\.com/, name: 'Google Fonts' },
    { pattern: /https:\/\/fonts\.gstatic\.com/, name: 'Google Fonts Static' }
];

console.log('📦 External dependencies:');
externalResources.forEach(resource => {
    if (resource.pattern.test(indexHtml)) {
        console.log(`   ✅ ${resource.name}`);
    }
});

// Check for integrity attributes
const hasIntegrity = /integrity="[^"]*"/.test(indexHtml);
const hasCrossorigin = /crossorigin="[^"]*"/.test(indexHtml);

if (hasIntegrity && hasCrossorigin) {
    console.log('✅ External resources have integrity and crossorigin attributes');
} else {
    console.warn('⚠️  Some external resources may be missing integrity or crossorigin attributes');
}

console.log('\n🎉 Build validation completed successfully!');
console.log('📊 Build Summary:');
console.log(`   📦 Project: ${packageJson.name} v${packageJson.version}`);
console.log(`   📄 Main file: index.html`);
console.log(`   🗂️  Publish directory: . (root)`);
console.log(`   📚 Bible quotes: ${global.quotesCount || 'unknown'}`);
console.log('\n🚀 Ready for Netlify deployment!');
console.log('\n📋 Deployment Steps:');
console.log('1. 📤 Push to GitHub repository');
console.log('2. 🔗 Connect repository to Netlify');
console.log('3. ⚙️  Set build command: npm run build');
console.log('4. 📁 Set publish directory: . (dot)');
console.log('5. 🌐 Deploy! Your site will be available at your Netlify URL');
console.log('\n💡 Post-deployment tips:');
console.log('   - Test all functionality on the live site');
console.log('   - Verify security headers using securityheaders.com');
console.log('   - Check mobile responsiveness');
console.log('   - Test PWA functionality if applicable');

// Create a deployment info file
const deploymentInfo = {
    buildTime: new Date().toISOString(),
    version: packageJson.version,
    quotesCount: global.quotesCount || 0,
    environment: 'production',
    securityHeaders: missingHeaders.length === 0,
    buildValidation: 'passed'
};

fs.writeFileSync('.deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
console.log('\n📄 Created .deployment-info.json for reference');
