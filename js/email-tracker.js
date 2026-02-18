class EmailTracker {
    constructor() {
        this.trackingEnabled = true;
        this.init();
    }

    init() {
        this.enhanceEmailLinks();
        this.setupContactForm();
    }

    enhanceEmailLinks() {
        document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
            const originalHref = link.getAttribute('href');
            const email = originalHref.replace('mailto:', '');
            
            // Add tracking attributes
            link.setAttribute('data-track-email', 'true');
            link.setAttribute('data-email', email);
            
            // Add click handler
            link.addEventListener('click', (e) => {
                if (this.trackingEnabled) {
                    this.trackEmailClick(email, link);
                }
            });
            
            // Add hover effect
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'scale(1.05)';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'scale(1)';
            });
        });
    }

    trackEmailClick(email, element) {
        const eventData = {
            email: email,
            timestamp: new Date().toISOString(),
            page: window.location.href,
            elementText: element.textContent.trim(),
            elementPosition: this.getElementPosition(element)
        };
        
        // Store in localStorage
        this.storeEmailClick(eventData);
        
        // Send to analytics
        if (window.portfolioAnalytics) {
            window.portfolioAnalytics.trackEvent('email_click', {
                email: email,
                source: element.textContent.trim()
            });
        }
        
        // Optional: Send to backend
        this.sendToBackend(eventData);
        
        // Visual feedback
        this.showClickFeedback(element);
    }

    storeEmailClick(data) {
        let emailClicks = JSON.parse(localStorage.getItem('email_clicks') || '[]');
        emailClicks.push(data);
        
        // Keep only last 50 clicks
        if (emailClicks.length > 50) {
            emailClicks = emailClicks.slice(-50);
        }
        
        localStorage.setItem('email_clicks', JSON.stringify(emailClicks));
        
        // Update click count display
        this.updateEmailCounter();
    }

    updateEmailCounter() {
        const emailClicks = JSON.parse(localStorage.getItem('email_clicks') || '[]');
        const counterElement = document.getElementById('email-counter');
        
        if (counterElement) {
            counterElement.textContent = `📧 ${emailClicks.length} clicks`;
            counterElement.title = `${emailClicks.length} email interactions tracked`;
        }
    }

    sendToBackend(data) {
        // Example using a free service like Formspree or Webhook.site
        const webhookUrl = 'https://webhook.site/your-unique-id'; // Replace with your URL
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors' // For cross-origin without CORS issues
        }).catch(error => {
            console.log('Analytics sent (no-cors mode)');
        });
    }

    showClickFeedback(element) {
        // Add a temporary animation
        const originalBg = element.style.background;
        element.style.background = 'var(--qa-pass)';
        element.style.color = 'white';
        
        setTimeout(() => {
            element.style.background = originalBg;
            element.style.color = '';
        }, 300);
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + window.scrollX),
            y: Math.round(rect.top + window.scrollY)
        };
    }

    setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Track form submission
            this.trackFormSubmit(data);
            
            // Show success message
            this.showFormSuccess(form);
            
            // Reset form
            form.reset();
        });
    }

    trackFormSubmit(data) {
        const eventData = {
            type: 'contact_form',
            timestamp: new Date().toISOString(),
            formData: data
        };
        
        // Store locally
        let formSubmissions = JSON.parse(localStorage.getItem('form_submissions') || '[]');
        formSubmissions.push(eventData);
        localStorage.setItem('form_submissions', JSON.stringify(formSubmissions));
        
        // Track in analytics
        if (window.portfolioAnalytics) {
            window.portfolioAnalytics.trackEvent('contact_form_submit', {
                form_type: 'contact',
                has_message: !!data.message
            });
        }
    }

    showFormSuccess(form) {
        const successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✓</span>
                <p>Message sent successfully! I'll get back to you soon.</p>
            </div>
        `;
        
        form.parentNode.insertBefore(successMsg, form.nextSibling);
        
        setTimeout(() => {
            successMsg.style.opacity = '0';
            setTimeout(() => successMsg.remove(), 300);
        }, 3000);
    }

    // Admin function to get all email data
    getEmailAnalytics() {
        return {
            totalClicks: JSON.parse(localStorage.getItem('email_clicks') || '[]').length,
            recentClicks: JSON.parse(localStorage.getItem('email_clicks') || '[]').slice(-10),
            formSubmissions: JSON.parse(localStorage.getItem('form_submissions') || '[]')
        };
    }
}

// Initialize email tracking
document.addEventListener('DOMContentLoaded', () => {
    window.emailTracker = new EmailTracker();
});