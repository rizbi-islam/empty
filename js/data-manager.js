class PortfolioData {
    constructor() {
        this.data = null;
        this.initialized = false;
    }

    async init() {
        try {
            const response = await fetch('data/profile.json');
            if (!response.ok) {
                throw new Error('Failed to load profile data');
            }
            
            this.data = await response.json();
            this.initialized = true;
            
            this.renderPersonalInfo();
            this.renderSkills();
            this.renderExperience();
            this.renderProjects();
            this.renderStats();
        } catch (error) {
            console.error('Error loading portfolio data:', error);
            this.showError('Failed to load portfolio data. Please refresh the page.');
        }
    }

    renderPersonalInfo() {
        if (!this.data?.personal) return;
        
        const personal = this.data.personal;
        
        // Update meta tags
        document.title = `${personal.name} | ${personal.title}`;
        document.querySelector('meta[name="description"]')?.setAttribute('content', personal.summary);
        
        // Update elements (checking if they exist first)
        this.updateElement('hero-name', personal.name);
        this.updateElement('hero-title', personal.title);
        this.updateElement('hero-summary', personal.summary);
        
        // Update phone and location in contact section
        const phoneElement = document.getElementById('hero-phone');
        if (phoneElement) {
            phoneElement.textContent = personal.phone;
            phoneElement.href = `tel:${personal.phone.replace(/\D/g, '')}`;
        }
        
        const locationElement = document.getElementById('hero-location');
        if (locationElement) {
            locationElement.textContent = personal.location;
        }
        
        // Update social links
        this.updateElement('linkedin-link', 'LinkedIn', 'href', personal.social.linkedin);
        this.updateElement('github-link', 'GitHub', 'href', personal.social.github);
        
        // Update resume download link (check if button exists)
        const resumeBtn = document.querySelector('.btn-outline[download]');
        if (resumeBtn && personal.resume) {
            resumeBtn.href = personal.resume;
            resumeBtn.download = 'Rizbi_Islam_Resume.pdf';
        }
        
        // Update email tracking link
        const emailLink = document.getElementById('email-tracked');
        if (emailLink) {
            emailLink.href = `mailto:${personal.email}`;
            emailLink.textContent = personal.email;
        }
    }

    renderSkills() {
        if (!this.data?.skills) return;
        
        const skills = this.data.skills;
        const container = document.getElementById('skills-container');
        if (!container) return;
        
        let html = '';
        
        for (const [category, items] of Object.entries(skills)) {
            if (Array.isArray(items) && items.length > 0) {
                html += `
                    <div class="skill-category">
                        <h3>${this.formatCategoryName(category)}</h3>
                        <div class="skill-items">
                `;
                
                if (typeof items[0] === 'object' && 'name' in items[0]) {
                    items.forEach(skill => {
                        const proficiency = this.getProficiencyLabel(skill.level);
                        html += `
                            <div class="skill-meter">
                                <div class="meter-label">
                                    <span>${skill.name}</span>
                                    <span class="proficiency-badge ${proficiency.class}">${proficiency.label}</span>
                                </div>
                                <div class="meter-bar">
                                    <div class="meter-fill" data-value="${skill.level}" style="width: 0%"></div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html += '<div class="skill-tags">';
                    items.forEach(skill => {
                        html += `<span class="skill-tag">${skill}</span>`;
                    });
                    html += '</div>';
                }
                
                html += `
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
        setTimeout(() => this.animateSkillBars(), 500);
    }

    getProficiencyLabel(level) {
        if (level >= 90) return { label: 'Expert', class: 'badge-expert' };
        if (level >= 75) return { label: 'Advanced', class: 'badge-advanced' };
        if (level >= 60) return { label: 'Proficient', class: 'badge-proficient' };
        return { label: 'Familiar', class: 'badge-familiar' };
    }

    renderExperience() {
        if (!this.data?.experience) return;
        
        const container = document.getElementById('experience-timeline');
        if (!container) return;
        
        let html = '';
        
        this.data.experience.forEach(exp => {
            html += `
                <div class="timeline-item">
                    <div class="timeline-date">${exp.period}</div>
                    <div class="timeline-content">
                        <h3>${exp.position}</h3>
                        <h4>${exp.company} • ${exp.location}</h4>
                        ${exp.project ? `<div class="project-highlight">Project: ${exp.project}</div>` : ''}
                        <ul class="achievements">
                            ${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}
                        </ul>
                        <div class="tech-used">
                            ${(exp.technologies || []).map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderProjects() {
        if (!this.data?.projects) return;
        
        const container = document.getElementById('projects-container');
        if (!container) return;
        
        let html = '<div class="projects-grid">';
        
        this.data.projects.forEach(project => {
            html += `
                <div class="project-card">
                    <div class="project-card-header">
                        <h3>${project.title}</h3>
                        ${project.category ? `<div class="project-meta"><span class="project-category">${project.category}</span></div>` : ''}
                    </div>
                    <div class="project-card-body">
                        <p>${project.description}</p>
                        <div class="project-tech">
                            ${(project.technologies || []).map(tech => `<span>${tech}</span>`).join('')}
                        </div>
                    </div>
                    <div class="project-card-footer">
                        ${project.link && project.link !== '#' ? `<a href="${project.link}" target="_blank" class="btn-qa">View Project</a>` : ''}
                        ${project.github && project.github !== '#' ? `<a href="${project.github}" target="_blank" class="btn-qa btn-outline">GitHub</a>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderStats() {
        if (!this.data?.stats) return;
        
        const stats = this.data.stats;
        const container = document.getElementById('stats-container');
        if (!container) return;
        
        let html = '<div class="stats-grid">';
        
        for (const [stat, value] of Object.entries(stats)) {
            html += `
                <div class="stat-card">
                    <h3>${this.formatCategoryName(stat)}</h3>
                    <div class="stat-number">${value}%</div>
                    <div class="stat-bar">
                        <div class="stat-fill" data-value="${value}"></div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
        setTimeout(() => this.animateStatBars(), 1000);
    }

    animateSkillBars() {
        document.querySelectorAll('.meter-fill').forEach(bar => {
            const value = bar.getAttribute('data-value');
            bar.style.width = `${value}%`;
        });
    }

    animateStatBars() {
        document.querySelectorAll('.stat-fill').forEach(bar => {
            const value = bar.getAttribute('data-value');
            bar.style.width = `${value}%`;
        });
    }

    formatCategoryName(category) {
        return category
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/Ci Cd/gi, 'CI/CD');
    }

    updateElement(id, content, attribute = 'textContent', attrValue = null) {
        const element = document.getElementById(id);
        if (element) {
            if (attribute === 'textContent') {
                element.textContent = content;
            } else if (attribute === 'href' && attrValue) {
                element.href = attrValue;
                element.textContent = content;
            } else if (attrValue) {
                element.setAttribute(attribute, attrValue);
                element.textContent = content;
            }
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <p>⚠️ ${message}</p>
            <button onclick="this.parentElement.remove()">Dismiss</button>
        `;
        document.body.prepend(errorDiv);
    }
}