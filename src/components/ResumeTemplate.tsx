import React from 'react';
import { TailoredResumeType } from '../ai/schemas';

const formatDate = (date: string | Date | null | undefined, isFr: boolean): string => {
  if (!date || date === 'null') return isFr ? 'Présent' : 'Present';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const formatter = new Intl.DateTimeFormat(isFr ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
  const formatted = formatter.format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export interface ResumeTemplateProps {
  profile: any;
  content: TailoredResumeType;
  cssContent: string;
  imageBase64?: string;
  lang?: 'en' | 'fr' | 'both';
}

export function ResumeTemplate({ profile, content, cssContent, imageBase64, lang = 'both' }: ResumeTemplateProps) {
  const renderSection = (isFr: boolean) => {
    const sortedExperiences = [...profile.experiences].sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
    
    const selectedProjects = profile.projects.filter((p: any) => content.selectedProjects?.includes(p.id));
    const projectsToRender = selectedProjects.length > 0 ? selectedProjects : profile.projects;

    return (
      <main id={`cv-${isFr ? 'fr' : 'en'}`} className="page cv-page" role="main" hidden={lang === 'both' && isFr}>
        {/* Sidebar */}
        <aside className="sidebar" aria-label={isFr ? "Informations de contact et compétences" : "Contact information and skills"}>
          <div className="portrait-wrap">
            {imageBase64 ? (
              <img className="portrait" src={`data:image/png;base64,${imageBase64}`} alt="Photo" />
            ) : (
              <img className="portrait" src="assets/hassen-ben-hadj-hassen.png" alt="Photo" />
            )}
          </div>

          <div className="side-block">
            <h2 className="side-heading">Contact</h2>
            <ul className="contact-list">
              {profile.user.email && <li><a href={`mailto:${profile.user.email}`}>{profile.user.email}</a></li>}
              {profile.user.phone && <li><a href={`tel:${profile.user.phone.replace(/\\s/g, '')}`}>{profile.user.phone}</a></li>}
              {profile.user.website && <li><a href={profile.user.website} target="_blank" rel="noreferrer">{profile.user.website}</a></li>}
              {profile.user.github && <li><a href={profile.user.github} target="_blank" rel="noreferrer">{profile.user.github}</a></li>}
              {profile.user.linkedin && <li><a href={profile.user.linkedin} target="_blank" rel="noreferrer">{profile.user.linkedin}</a></li>}
              {profile.user.location && <li className="contact-availability">{profile.user.location}</li>}
            </ul>
          </div>

          <div className="side-block">
            <h2 className="side-heading">{isFr ? "Compétences" : "Skills"}</h2>
            
            {content.selectedSkills && content.selectedSkills.length > 0 && (
              <div className="skill-group skill-group--primary">
                <h3>{isFr ? "Stack Principale" : "Core Stack"}</h3>
                <div className="skill-badges">
                  {content.selectedSkills.map((s, i) => (
                    <span key={i} className="skill-badge">{s}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="skill-group">
              <h3>Frontend &amp; UI</h3>
              <p>Tailwind CSS · Shadcn/ui · Redux · SEO · Performance</p>
            </div>
            <div className="skill-group">
              <h3>Backend &amp; APIs</h3>
              <p>Express · REST APIs · Laravel · PHP · Validation (Zod)</p>
            </div>
            <div className="skill-group">
              <h3>{isFr ? "Données & Cache" : "Data & Cache"}</h3>
              <p>MongoDB · Redis</p>
            </div>
            <div className="skill-group">
              <h3>Cloud &amp; DevOps</h3>
              <p>Linux · CI/CD · Nginx · Certbot</p>
            </div>
            <div className="skill-group">
              <h3>{isFr ? "Qualité & Sécurité" : "Quality & Security"}</h3>
              <p>{isFr ? "Auth JWT/OAuth · RBAC · Vitest · Observabilité" : "Auth JWT/OAuth · RBAC · Vitest · Observability"}</p>
            </div>
          </div>

          <div className="side-block">
            <h2 className="side-heading">{isFr ? "Langues" : "Languages"}</h2>
            <div className="language-row"><span>{isFr ? "Arabe" : "Arabic"}</span><span className="lang-level">{isFr ? "Natif" : "Native"}</span></div>
            <div className="language-row"><span>{isFr ? "Anglais" : "English"}</span><span className="lang-level">{isFr ? "Professionnel" : "Professional"}</span></div>
            <div className="language-row"><span>{isFr ? "Français" : "French"}</span><span className="lang-level">{isFr ? "Notions (en cours)" : "Basics (learning)"}</span></div>
          </div>

          <div className="side-block">
            <h2 className="side-heading">{isFr ? "Formation" : "Education"}</h2>
            {profile.educations.map((edu: any) => {
              const title = edu.field ? (isFr ? `${edu.degree} en ${edu.field}` : `${edu.degree} in ${edu.field}`) : edu.degree;
              return (
                <div key={edu.id} className="edu-item">
                  <strong>{title}</strong>
                  <span>{edu.institution} · {formatDate(edu.startDate, isFr)} - {formatDate(edu.endDate, isFr)}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <section className="content" aria-label={isFr ? "Expérience, projets et profil" : "Experience, projects and profile"}>
          <header className="hero">
            <p className="eyebrow">Software Engineer · Full-Stack</p>
            <h1>{profile.user.name}</h1>
            <p className="hero-sub">{isFr ? "Concevoir, déployer et fiabiliser des applications web de production : du front TypeScript au cloud AWS." : "Designing, deploying and hardening production web applications: from TypeScript front-end to AWS cloud."}</p>
          </header>

          <section className="section profile-section">
            <div className="section-head">
              <span className="section-label">{isFr ? "Profil" : "Profile"}</span>
              <div className="rule"></div>
            </div>
            <p className="profile-text">{content.summary}</p>
          </section>

          <section className="section experience-section">
            <div className="section-head">
              <span className="section-label">{isFr ? "Expérience" : "Experience"}</span>
              <div className="rule"></div>
            </div>

            {sortedExperiences.map((exp: any) => {
              const tailoredExp = content.experience?.find((e) => e.experienceId === exp.id);
              const bullets = tailoredExp ? tailoredExp.bullets : exp.bullets;

              return (
                <article key={exp.id} className="experience">
                  <div className="exp-header">
                    <div className="exp-title-row">
                      <h3 className="exp-role">{exp.role}</h3>
                      <span className="exp-period">{formatDate(exp.startDate, isFr)} - {formatDate(exp.endDate, isFr)}</span>
                    </div>
                    <span className="exp-company">{exp.company}</span>
                  </div>
                  <ul className="exp-bullets">
                    {bullets.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </section>

          <section className="section projects-section">
            <div className="section-head">
              <span className="section-label">{isFr ? "Projets" : "Projects"}</span>
              <div className="rule"></div>
            </div>
            <div className="project-list">
              {projectsToRender.map((proj: any) => (
                <article key={proj.id} className="project-item">
                  <div className="project-left">
                    <h3 className="project-name">{proj.name}</h3>
                    <span className="project-tag">Project</span>
                  </div>
                  <div className="project-right">
                    <p className="project-desc">{proj.description}</p>
                    <div className="project-stack">{proj.technologies?.join(' · ')}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    );
  };

  return (
    <html lang={lang === 'fr' ? 'fr' : 'en'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{profile.user.name} — CV</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;1,400&family=Syne:wght@600;700;800&display=swap" />
        <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      </head>
      <body>
        {lang === 'both' && (
          <nav className="cv-controls" aria-label="Controls">
            <div className="lang-switch" role="group" aria-label="Language selection">
              <button type="button" className="lang-btn" id="btn-fr">FR</button>
              <button type="button" className="lang-btn active" id="btn-en">EN</button>
            </div>
            <button type="button" className="print-btn" id="btn-print" title="Print or save as PDF">
              <span>PDF</span>
            </button>
          </nav>
        )}
        
        {(lang === 'both' || lang === 'en') && renderSection(false)}
        {(lang === 'both' || lang === 'fr') && renderSection(true)}

        {lang === 'both' && (
          <script dangerouslySetInnerHTML={{ __html: `
            function setLanguage(lang) {
              const isFr = lang === 'fr';
              const cvFr = document.getElementById('cv-fr');
              const cvEn = document.getElementById('cv-en');
              const btnFr = document.getElementById('btn-fr');
              const btnEn = document.getElementById('btn-en');
              if (isFr) {
                cvFr.removeAttribute('hidden');
                cvEn.setAttribute('hidden', '');
                btnFr.classList.add('active');
                btnEn.classList.remove('active');
                document.documentElement.lang = 'fr';
              } else {
                cvEn.removeAttribute('hidden');
                cvFr.setAttribute('hidden', '');
                btnEn.classList.add('active');
                btnFr.classList.remove('active');
                document.documentElement.lang = 'en';
              }
            }
            document.getElementById('btn-fr').addEventListener('click', () => setLanguage('fr'));
            document.getElementById('btn-en').addEventListener('click', () => setLanguage('en'));
            document.getElementById('btn-print').addEventListener('click', () => window.print());
          `}} />
        )}
      </body>
    </html>
  );
}
