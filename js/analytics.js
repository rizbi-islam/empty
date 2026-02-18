class PortfolioAnalytics {
    constructor() {
        // GA4 Configuration
        this.gaEnabled = false;
        this.gaMeasurementId = null;
        
        // Local Storage Keys
        this.viewsKey = 'portfolio_views';
        this.clicksKey = 'portfolio_clicks_count';
        
        // Enhanced Analytics Data
        this.data = {
            pageViews: 0,
            uniqueVisitors: 0,
            resumeDownloads: 0,
            emailClicks: 0,
            sectionViews: {},
            visitorTimestamps: [],
            referrers: {},
            lastUpdated: new Date().toISOString()
        };
        
        // Visitor Tracking
        this.storageKey = 'portfolio_analytics_data';
        this.visitorId = this.getVisitorId();
        
        // Initialize everything
        this.init();
    }
    
    getVisitorId() {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitor_id', visitorId);
        }
        return visitorId;
    }
    
    async init() {
        // Load GA config first
        await this.loadConfigAndInit();
        
        // Load enhanced analytics data
        this.loadEnhancedData();
        
        // Track current page view
        this.incrementViewCount();
        this.trackPageView();
        this.trackReferrer();
        
        // Setup event listeners
        this.setupEventListeners();
        this.startSessionTracking();
        
        // Display counts
        this.displayCounts();
    }
    
    async loadConfigAndInit() {
        try {
            const res = await fetch('data/ga.json', { cache: 'no-store' });
            if (res.ok) {
                const cfg = await res.json();
                if (cfg && cfg.enabled && cfg.measurementId) {
                    this.gaMeasurementId = cfg.measurementId;
                    await this.loadGAScript(this.gaMeasurementId);
                }
            }
        } catch (e) {
            console.warn('GA config load failed', e);
        }
    }
    
    loadGAScript(id) {
        return new Promise((resolve) => {
            if (!id) return resolve();
            if (document.querySelector('script[data-ga="' + id + '"]')) return resolve();
            
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
            s.setAttribute('data-ga', id);
            s.onload = () => {
                try {
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments);}
                    window.gtag = window.gtag || gtag;
                    window.gtag('js', new Date());
                    window.gtag('config', id);
                    this.gaEnabled = true;
                    console.log('GA script loaded for', id);
                } catch (e) {}
                resolve();
            };
            s.onerror = () => resolve();
            document.head.appendChild(s);
        });
    }
    
    loadEnhancedData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading analytics:', e);
            }
        }
        
        // Also load the old format data
        const oldViews = this.getViews();
        const oldClicks = this.getClicksCount();
        
        // Merge old data if exists and new data is empty
        if (oldViews.total && this.data.pageViews === 0) {
            this.data.pageViews = oldViews.total || 0;
        }
        if (oldClicks.total && this.data.emailClicks === 0) {
            this.data.emailClicks = oldClicks.total || 0;
        }
    }
    
    saveEnhancedData() {
        this.data.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
    
    incrementViewCount() {
        // Old format
        let views = this.getViews();
        views.total = (views.total || 0) + 1;
        views.lastVisit = new Date().toISOString();
        this.saveViews(views);
        
        // New format
        this.data.pageViews++;
        
        // Track unique visitors in new format
        const today = new Date().toDateString();
        const visitorKey = today + '_' + this.visitorId;
        if (!this.data.visitorTimestamps.includes(visitorKey)) {
            this.data.visitorTimestamps.push(visitorKey);
            this.data.uniqueVisitors = this.data.visitorTimestamps.length;
        }
        
        this.saveEnhancedData();
    }
    
    trackPageView() {
        // Send to GA4
        if (this.gaEnabled && typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_visitor_id: this.visitorId
            });
        }
        
        // Track section views if on main page with hash
        if (window.location.hash) {
            const section = window.location.hash.substring(1);
            this.data.sectionViews[section] = (this.data.sectionViews[section] || 0) + 1;
            this.saveEnhancedData();
        }
    }
    
    trackReferrer() {
        const referrer = document.referrer || 'direct';
        if (referrer && !referrer.includes(window.location.hostname)) {
            const source = this.getReferrerSource(referrer);
            this.data.referrers[source] = (this.data.referrers[source] || 0) + 1;
            this.saveEnhancedData();
            
            // Also track in GA4
            if (this.gaEnabled && typeof gtag !== 'undefined') {
                gtag('event', 'traffic_source', {
                    source: source,
                    full_referrer: referrer
                });
            }
        }
    }
    
    getReferrerSource(url) {
        if (!url) return 'direct';
        if (url.includes('google')) return 'Google';
        if (url.includes('linkedin')) return 'LinkedIn';
        if (url.includes('github')) return 'GitHub';
        if (url.includes('facebook')) return 'Facebook';
        if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
        return 'other';
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Project/Button clicks (existing)
            if (target.closest('.project-card') || target.closest('.btn-qa')) {
                this.trackEvent('project_click', {
                    element: target.tagName,
                    text: target.textContent?.trim()
                });
            }
            
            // Email clicks
            if (target.matches('a[href^="mailto:"]') || target.closest('a[href^="mailto:"]')) {
                const emailLink = target.href ? target : target.closest('a[href^="mailto:"]');
                const email = (emailLink.href || '').replace('mailto:', '');
                this.trackEvent('email_click', { email });
                
                // Enhanced tracking
                this.data.emailClicks++;
                this.saveEnhancedData();
            }
            
            // Resume downloads
            if (target.matches('a[href$=".pdf"]') || target.textContent?.toLowerCase().includes('resume')) {
                this.trackEvent('resume_download');
                
                // Enhanced tracking
                this.data.resumeDownloads++;
                this.saveEnhancedData();
            }
            
            // Social links
            if (target.closest('.social-link')) {
                const social = target.textContent?.toLowerCase() || 'social';
                this.trackEvent('social_click', { platform: social });
            }
        });
        
        // Track section visibility (Intersection Observer)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (sectionId) {
                        this.data.sectionViews[sectionId] = (this.data.sectionViews[sectionId] || 0) + 1;
                        this.saveEnhancedData();
                        
                        // Track in GA4
                        this.trackEvent('section_view', { section: sectionId });
                    }
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all sections with IDs
        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    }
    
    startSessionTracking() {
        const sessionStart = Date.now();
        
        // Track session duration on page leave
        window.addEventListener('beforeunload', () => {
            const duration = Math.round((Date.now() - sessionStart) / 1000);
            
            // Store in session storage for potential future use
            sessionStorage.setItem('last_session_duration', duration);
            
            // Track in GA4 if enabled
            if (this.gaEnabled && typeof gtag !== 'undefined') {
                gtag('event', 'session_end', {
                    session_duration_seconds: duration
                });
            }
        });
    }
    
    trackEvent(eventName, data = {}) {
        // Increment click counter in old format
        if (eventName && (eventName.includes('click') || eventName === 'resume_download')) {
            let clicks = this.getClicksCount();
            clicks.total = (clicks.total || 0) + 1;
            clicks.last = new Date().toISOString();
            this.saveClicksCount(clicks);
            this.displayCounts();
        }
        
        // Send to GA4
        if (this.gaEnabled && typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...data,
                visitor_id: this.visitorId,
                page_path: window.location.pathname
            });
        }
    }
    
    displayCounts() {
        const views = this.getViews();
        const clicks = this.getClicksCount();
        
        // Update UI with old format counts (for backward compatibility)
        const viewEl = document.getElementById('view-count');
        if (viewEl) {
            viewEl.textContent = (views.total || 0).toString();
        }
        
        const clickEl = document.getElementById('click-count');
        if (clickEl) {
            clickEl.textContent = (clicks.total || 0).toString();
        }
    }
    
    // Old format methods (keeping for compatibility)
    getViews() {
        return JSON.parse(localStorage.getItem(this.viewsKey) || '{}');
    }
    
    saveViews(views) {
        localStorage.setItem(this.viewsKey, JSON.stringify(views));
    }
    
    getClicksCount() {
        return JSON.parse(localStorage.getItem(this.clicksKey) || '{}');
    }
    
    saveClicksCount(countObj) {
        localStorage.setItem(this.clicksKey, JSON.stringify(countObj));
    }
    
    // Admin helper - Enhanced version for stats.html
    getAnalyticsData() {
        const oldViews = this.getViews();
        const oldClicks = this.getClicksCount();
        
        return {
            // Enhanced data
            pageViews: this.data.pageViews || oldViews.total || 0,
            uniqueVisitors: this.data.uniqueVisitors || 0,
            resumeDownloads: this.data.resumeDownloads || 0,
            emailClicks: this.data.emailClicks || 0,
            sectionViews: this.data.sectionViews || {},
            referrers: this.data.referrers || {},
            lastUpdated: this.data.lastUpdated,
            
            // Old format data
            legacy: {
                views: oldViews,
                clicks: oldClicks
            },
            
            // GA info
            googleAnalytics: {
                enabled: this.gaEnabled,
                measurementId: this.gaMeasurementId,
                message: 'Full analytics available in Google Analytics dashboard'
            }
        };
    }
    
    // Reset all analytics data
    resetAnalytics() {
        if (confirm('Are you sure you want to reset all analytics data?')) {
            // Reset new format
            this.data = {
                pageViews: 0,
                uniqueVisitors: 0,
                resumeDownloads: 0,
                emailClicks: 0,
                sectionViews: {},
                visitorTimestamps: [],
                referrers: {},
                lastUpdated: new Date().toISOString()
            };
            this.saveEnhancedData();
            
            // Reset old format
            localStorage.removeItem(this.viewsKey);
            localStorage.removeItem(this.clicksKey);
            
            // Update display
            this.displayCounts();
        }
    }
}

// Initialize analytics when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.portfolioAnalytics = new PortfolioAnalytics();
});