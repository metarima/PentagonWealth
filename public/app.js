const app = document.getElementById("app");
const header = document.getElementById("site-header");
let servicesNavObserver = null;
const menuToggle = document.getElementById("menu-toggle");
const primaryNav = document.getElementById("primary-nav");
const navScrim = document.getElementById("nav-scrim");

const pageTitle = {
  "/": "Pentagon Wealth | Wealth Planning for Every Stage of Life",
  "/about": "About Us | Pentagon Wealth",
  "/services": "Services | Pentagon Wealth",
  "/insights": "Insights | Pentagon Wealth",
  "/privacy-policy": "Privacy Policy | Pentagon Wealth",
  "/contact": "Contact Us | Pentagon Wealth",
};

const routes = {
  "/": homeView,
  "/about": aboutView,
  "/services": servicesView,
  "/insights": insightsView,
  "/privacy-policy": privacyPolicyView,
  "/contact": contactView,
};

function navigate(path) {
  closeMobileNav();
  window.history.pushState({}, "", path);
  render();
}

function setActiveNav(pathname) {
  const navLinks = document.querySelectorAll(".nav-list a[data-link]");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === pathname || (pathname === "/" && href === "/");
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initMobileNav() {
  if (!menuToggle || !primaryNav) return;

  menuToggle.addEventListener("click", () => {
    const open = !header.classList.contains("nav-open");
    header.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-locked", open);
    if (navScrim) navScrim.hidden = !open;
  });

  if (navScrim) {
    navScrim.addEventListener("click", closeMobileNav);
  }

  primaryNav.querySelectorAll("a[data-link]").forEach((a) => {
    a.addEventListener("click", () => closeMobileNav());
  });
}

function closeMobileNav() {
  if (!header || !menuToggle) return;
  header.classList.remove("nav-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  document.body.classList.remove("nav-locked");
  if (navScrim) navScrim.hidden = true;
}

async function render() {
  const pathname = window.location.pathname;
  const view = routes[pathname] || notFoundView;

  app.classList.add("route-view", "entering");
  app.innerHTML = view();

  requestAnimationFrame(() => {
    app.classList.remove("entering");
  });

  document.title = pageTitle[pathname] || "Pentagon Wealth";
  setActiveNav(pathname);
  bindPageEvents(pathname);

  const hash = window.location.hash;
  if (hash) {
    requestAnimationFrame(() => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function bindPageEvents(pathname) {
  if (pathname !== "/services" && servicesNavObserver) {
    servicesNavObserver.disconnect();
    servicesNavObserver = null;
  }

  initRevealAnimations();

  if (pathname === "/contact") {
    const form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", submitContactForm);
    }
  }

  const closeButtons = app.querySelectorAll("[data-modal-close]");
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeSuccessModal);
  });

  const modalBackdrop = app.querySelector("#success-modal");
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) {
        closeSuccessModal();
      }
    });
  }

  if (pathname === "/services") {
    initServicesSubnav();
  }
}

function initServicesSubnav() {
  const sub = document.getElementById("services-subnav");
  if (!sub) return;

  if (servicesNavObserver) {
    servicesNavObserver.disconnect();
    servicesNavObserver = null;
  }

  const links = sub.querySelectorAll("a[href^='#']");
  const sections = [...document.querySelectorAll("[data-service-section]")];

  const setActive = (id) => {
    links.forEach((a) => {
      const match = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", match);
    });
  };

  servicesNavObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: "-42% 0px -42% 0px", threshold: 0.01 }
  );

  sections.forEach((sec) => servicesNavObserver.observe(sec));

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function initRevealAnimations() {
  const revealItems = app.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * 80, 420)}ms`);
    observer.observe(item);
  });
}

async function submitContactForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const statusElement = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');

  const interestRaw = form.serviceInterest ? form.serviceInterest.value.trim() : "";
  const payload = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    serviceInterest: interestRaw || "General enquiry",
    message: form.message.value.trim(),
    companyWebsite: form.companyWebsite ? form.companyWebsite.value.trim() : "",
  };

  statusElement.textContent = "Sending your enquiry...";
  statusElement.className = "form-status";
  submitButton.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    statusElement.textContent = data.message;
    statusElement.className = "form-status success";
    form.reset();
    openSuccessModal(data.message);
  } catch (error) {
    statusElement.textContent = error.message || "Unable to submit right now. Please try again.";
    statusElement.className = "form-status error";
  } finally {
    submitButton.disabled = false;
  }
}

function openSuccessModal(message) {
  const modal = app.querySelector("#success-modal");
  const modalMessage = app.querySelector("#success-modal-message");
  if (!modal || !modalMessage) return;

  modalMessage.textContent = message;
  modal.classList.add("open");
}

function closeSuccessModal() {
  const modal = app.querySelector("#success-modal");
  if (modal) modal.classList.remove("open");
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return;
  }

  event.preventDefault();
  navigate(href);
});

window.addEventListener("popstate", render);

initMobileNav();
render();

function homeView() {
  return `
    <div class="page page-home">
      <section class="hero hero-home" aria-labelledby="home-hero-heading">
        <div class="hero-bg" aria-hidden="true"></div>
        <div class="container hero-grid">
          <div class="hero-copy reveal">
            <p class="eyebrow">First impressions, lasting clarity</p>
            <h1 id="home-hero-heading">Wealth Planning for Every Stage of Life</h1>
            <p class="lead">
              Clear guidance across inheritance tax, investments, retirement, pensions, and protection — so you can move forward with confidence.
            </p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="/services" data-link>Explore services</a>
              <a class="btn btn-secondary" href="/about" data-link>Learn more <span class="btn-arrow" aria-hidden="true">→</span></a>
            </div>
          </div>
          <aside class="hero-panel reveal" aria-label="Highlights">
            <div class="hero-panel-inner">
              <p class="eyebrow">Why clients choose us</p>
              <ul class="hero-checklist">
                <li>Integrated planning across your full balance sheet</li>
                <li>Plain-language advice with measurable milestones</li>
                <li>Independent perspective aligned to your goals</li>
              </ul>
              <div class="hero-stat-row">
                <div class="hero-stat"><span class="hero-stat-num">5</span><span class="hero-stat-label">Core pillars</span></div>
                <div class="hero-stat"><span class="hero-stat-num">20+</span><span class="hero-stat-label">Years combined experience</span></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="section section-tint" aria-labelledby="services-intro-heading">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Services intro</p>
            <h2 id="services-intro-heading">A concise overview of how we help</h2>
            <p class="lead section-lead">
              Your financial life is connected — tax, investments, retirement income, pensions, and protection should work together. We structure advice around five pillars so nothing important is left in isolation.
            </p>
          </div>
          <div class="sitemap-grid reveal" role="list">
            <article class="pillar-card" role="listitem">
              <span class="pillar-icon" aria-hidden="true">01</span>
              <h3>IHT planning</h3>
              <p>Estate structuring, gifting, and legacy planning to reduce unnecessary tax leakage.</p>
              <a class="text-link" href="/services#iht" data-link>View pillar <span aria-hidden="true">→</span></a>
            </article>
            <article class="pillar-card" role="listitem">
              <span class="pillar-icon" aria-hidden="true">02</span>
              <h3>Investments</h3>
              <p>Portfolio design and reviews aligned to your timeline and attitude to risk.</p>
              <a class="text-link" href="/services#investments" data-link>View pillar <span aria-hidden="true">→</span></a>
            </article>
            <article class="pillar-card" role="listitem">
              <span class="pillar-icon" aria-hidden="true">03</span>
              <h3>Retirement</h3>
              <p>Income modelling and guidance through each stage of life after work.</p>
              <a class="text-link" href="/services#retirement" data-link>View pillar <span aria-hidden="true">→</span></a>
            </article>
            <article class="pillar-card" role="listitem">
              <span class="pillar-icon" aria-hidden="true">04</span>
              <h3>Pension management</h3>
              <p>Consolidation, options analysis, and drawdown strategy you can understand.</p>
              <a class="text-link" href="/services#pensions" data-link>View pillar <span aria-hidden="true">→</span></a>
            </article>
            <article class="pillar-card" role="listitem">
              <span class="pillar-icon" aria-hidden="true">05</span>
              <h3>Insurance</h3>
              <p>Protection solutions for family and business continuity.</p>
              <a class="text-link" href="/services#insurance" data-link>View pillar <span aria-hidden="true">→</span></a>
            </article>
          </div>
        </div>
      </section>

      <section class="section section-white" aria-labelledby="why-heading">
        <div class="container why-grid">
          <div class="why-copy reveal">
            <p class="eyebrow">Why Pentagon</p>
            <h2 id="why-heading">Modern efficiency, timeless judgement</h2>
            <p class="lead">
              We combine rigorous analysis with a human tone of voice — so recommendations feel as considered as they are actionable. You get a single planning narrative instead of disconnected product conversations.
            </p>
            <ul class="why-list">
              <li><strong>Client-centric</strong> — advice framed around outcomes you define</li>
              <li><strong>Transparent</strong> — costs, risks, and trade-offs explained upfront</li>
              <li><strong>Proactive</strong> — regular reviews as markets and rules evolve</li>
            </ul>
            <a class="btn btn-secondary" href="/about#values" data-link>Our values <span class="btn-arrow" aria-hidden="true">→</span></a>
          </div>
          <div class="why-cards reveal">
            <div class="glass-card">
              <h3>Integrated model</h3>
              <p>Tax, investments, pensions, and protection reviewed as one system — not silos.</p>
            </div>
            <div class="glass-card">
              <h3>Plain language</h3>
              <p>Complex topics distilled into decisions you can own with confidence.</p>
            </div>
            <div class="glass-card">
              <h3>Long-term partnership</h3>
              <p>We plan for decades, not quarters — with checkpoints that match your life.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-muted" aria-labelledby="testimonials-heading">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Client voices</p>
            <h2 id="testimonials-heading">What matters to the families we serve</h2>
          </div>
          <div class="testimonial-grid">
            <figure class="quote-card reveal">
              <blockquote>“Finally a plan that connects pensions, investments, and IHT — we always knew the pieces existed, but not how they fit.”</blockquote>
              <figcaption>Private client · London</figcaption>
            </figure>
            <figure class="quote-card reveal">
              <blockquote>“Clear, calm, and thorough. Every meeting ends with actions we understand — not a stack of jargon.”</blockquote>
              <figcaption>Business owner · South East</figcaption>
            </figure>
            <figure class="quote-card reveal">
              <blockquote>“They challenged our assumptions kindly and built a retirement income strategy we can stress-test together.”</blockquote>
              <figcaption>Pre-retiree couple · Surrey</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section class="cta-band" aria-labelledby="home-cta-heading">
        <div class="container cta-band-inner reveal">
          <div>
            <p class="eyebrow">Contact CTA</p>
            <h2 id="home-cta-heading">Ready for a clearer financial picture?</h2>
            <p class="cta-lead">Share your goals — we will outline sensible next steps before you commit to anything.</p>
          </div>
          <div class="cta-band-actions">
            <a class="btn btn-gold" href="/contact" data-link>Get in touch</a>
            <a class="btn btn-ghost-light" href="/contact#book" data-link>Book a call</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

function aboutView() {
  return `
    <div class="page">
      <section class="page-hero page-hero--navy" aria-labelledby="about-heading">
        <div class="container">
          <p class="eyebrow">About us</p>
          <h1 id="about-heading">Authentic advice, built around people</h1>
          <p class="lead lead-on-dark">Our story, team, values, and professional standing — so you know who sits across the table.</p>
        </div>
      </section>

      <section class="section section-white" id="story" aria-labelledby="story-heading">
        <div class="container narrow-block">
          <p class="eyebrow reveal">Our story</p>
          <h2 class="reveal" id="story-heading">Founding &amp; mission</h2>
          <p class="reveal">
            Pentagon Wealth was founded to give busy families and business owners a calmer way to navigate wealth — combining technical depth with approachable communication. We believe great advice should feel like clarity, not complexity.
          </p>
          <p class="reveal">
            Our mission is straightforward: help you protect what you have built, grow it sensibly, and pass it on with intention — always aligned to UK regulation and your personal risk tolerance.
          </p>
        </div>
      </section>

      <section class="section section-tint" aria-labelledby="team-heading">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Our team</p>
            <h2 id="team-heading">Advisers &amp; staff</h2>
            <p class="lead section-lead">Real people, real photos — the humans behind your plan.</p>
          </div>
          <div class="team-grid">
            <article class="team-card reveal">
              <img class="team-photo" src="/media/c__Users_flash_AppData_Roaming_Cursor_User_workspaceStorage_bc69d47d54ecce99fe2ae10883f7e903_images_image-0ab51869-b115-48d0-95c6-864ce4850794.png" alt="Portrait of William Barr, Director">
              <div class="team-body">
                <h3>William Barr</h3>
                <p class="team-role">Director</p>
                <p class="team-bio">Will has advised clients for over 30 years with a focus on accuracy, service, and high standards — spanning investments, pensions, tax planning, and protection for personal and corporate clients.</p>
                <p class="team-contact">Tel: <a href="tel:+447427387100">07427 387 100</a><br>Email: <a href="mailto:hello@pentagonwealth.co.uk">hello@pentagonwealth.co.uk</a></p>
              </div>
            </article>
            <article class="team-card reveal">
              <div class="team-photo-placeholder" aria-hidden="true">JR</div>
              <div class="team-body">
                <h3>Jonathan Rowe</h3>
                <p class="team-role">Director</p>
                <p class="team-bio">Johnny brings a decade in financial advice and prior markets experience from global investment banks — supporting cost-effective, bespoke solutions grounded in how markets actually behave.</p>
                <p class="team-contact">Tel: <a href="tel:+447960617724">07960 617 724</a><br>Email: <a href="mailto:hello@pentagonwealth.co.uk">hello@pentagonwealth.co.uk</a></p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="section section-white" id="values" aria-labelledby="values-heading">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Our values</p>
            <h2 id="values-heading">Client-centric principles</h2>
          </div>
          <div class="values-grid">
            <article class="value-tile reveal"><h3>Integrity</h3><p>We recommend what we would stand behind for our own families — no exceptions.</p></article>
            <article class="value-tile reveal"><h3>Clarity</h3><p>If it cannot be explained plainly, it is not ready to decide on.</p></article>
            <article class="value-tile reveal"><h3>Discipline</h3><p>Process beats noise — especially when headlines try to pull you off course.</p></article>
            <article class="value-tile reveal"><h3>Partnership</h3><p>We work alongside your accountant and solicitor when it improves outcomes.</p></article>
          </div>
        </div>
      </section>

      <section class="section section-muted" aria-labelledby="accreditations-heading">
        <div class="container">
          <div class="section-head reveal">
            <p class="eyebrow">Accreditations</p>
            <h2 id="accreditations-heading">Professional standing</h2>
            <p class="lead section-lead">Independence and conduct standards you should expect from a modern advisory firm.</p>
          </div>
          <div class="accreditation-row reveal">
            <div class="acc-badge"><span class="acc-title">FCA regulation</span><span class="acc-desc">Adherence to UK conduct and consumer duty expectations.</span></div>
            <div class="acc-badge"><span class="acc-title">Qualifications</span><span class="acc-desc">Advisers maintain relevant diplomas &amp; ongoing CPD.</span></div>
            <div class="acc-badge"><span class="acc-title">Data &amp; privacy</span><span class="acc-desc">GDPR-aligned handling — see our <a href="/privacy-policy" data-link>Privacy Policy</a>.</span></div>
          </div>
        </div>
      </section>

      <section class="cta-band cta-band--compact">
        <div class="container cta-band-inner reveal">
          <div>
            <p class="eyebrow">Next step</p>
            <h2>Talk to the team</h2>
            <p class="cta-lead">Use our contact page for office details, enquiry form, and booking a call.</p>
          </div>
          <a class="btn btn-gold" href="/contact" data-link>Contact us</a>
        </div>
      </section>
    </div>
  `;
}

function servicesView() {
  return `
    <div class="page page-services">
      <section class="page-hero page-hero--cream" aria-labelledby="services-heading">
        <div class="container">
          <p class="eyebrow">Services</p>
          <h1 id="services-heading">Core pillars, dedicated depth</h1>
          <p class="lead">Each pillar has its own methods and milestones — together they form a single plan that evolves with you.</p>
        </div>
      </section>

      <div class="services-layout">
        <aside class="services-rail" id="services-subnav" aria-label="On this page">
          <p class="rail-title">On this page</p>
          <a href="#iht">IHT planning</a>
          <a href="#investments">Investments</a>
          <a href="#retirement">Retirement</a>
          <a href="#pensions">Pension management</a>
          <a href="#insurance">Insurance</a>
        </aside>
        <div class="services-content">
          <section class="service-block reveal" id="iht" data-service-section>
            <p class="eyebrow">IHT planning</p>
            <h2>Estate structuring</h2>
            <p>We review wills, trusts, business property relief, gifting patterns, and pension nominations alongside your investment mix — so legacy decisions do not create unintended tax friction.</p>
            <ul class="service-list">
              <li>Nil-rate band and residence nil-rate band planning</li>
              <li>Gifting strategies and liquidity checks</li>
              <li>Coordination with legal advisers where appropriate</li>
            </ul>
          </section>
          <section class="service-block reveal" id="investments" data-service-section>
            <p class="eyebrow">Investments</p>
            <h2>Portfolio management</h2>
            <p>Goal-aligned portfolios with disciplined rebalancing, tax-aware wrappers, and reporting you can actually use in family conversations.</p>
            <ul class="service-list">
              <li>Risk profiling and scenario planning</li>
              <li>Diversification across asset classes and geographies</li>
              <li>Ongoing review cadence tied to life events</li>
            </ul>
          </section>
          <section class="service-block reveal" id="retirement" data-service-section>
            <p class="eyebrow">Retirement</p>
            <h2>Planning &amp; guidance</h2>
            <p>We model retirement income, drawdown timing, and tax bands so you understand sustainable spending — not just a static number on a screen.</p>
            <ul class="service-list">
              <li>Cashflow projections and stress tests</li>
              <li>Transition planning five to ten years pre-retirement</li>
              <li>Later-life care considerations</li>
            </ul>
          </section>
          <section class="service-block reveal" id="pensions" data-service-section>
            <p class="eyebrow">Pension management</p>
            <h2>Consolidation &amp; advice</h2>
            <p>Whether you are tidying historic pots or optimising drawdown, we compare charges, features, and death benefits before any transfer recommendation.</p>
            <ul class="service-list">
              <li>Defined benefit transfer support where permitted</li>
              <li>Annual and lifetime allowance awareness</li>
              <li>Consolidation vs retention analysis</li>
            </ul>
          </section>
          <section class="service-block reveal" id="insurance" data-service-section>
            <p class="eyebrow">Insurance</p>
            <h2>Protection solutions</h2>
            <p>Life, critical illness, and income protection structured around debts, dependents, and business continuity — proportionate, not oversold.</p>
            <ul class="service-list">
              <li>Family protection gap analysis</li>
              <li>Key person and shareholder cover</li>
              <li>Regular affordability reviews</li>
            </ul>
          </section>
        </div>
      </div>

      <section class="section section-white">
        <div class="container cta-inline reveal">
          <div>
            <h2>Discuss which pillars apply to you</h2>
            <p class="lead" style="margin:0">We will map priorities before recommending detailed work.</p>
          </div>
          <a class="btn btn-primary" href="/contact" data-link>Get in touch</a>
        </div>
      </section>
    </div>
  `;
}

function insightsView() {
  return `
    <div class="page">
      <section class="page-hero page-hero--navy" aria-labelledby="insights-heading">
        <div class="container">
          <p class="eyebrow">Insights</p>
          <h1 id="insights-heading">Perspective for thoughtful wealth decisions</h1>
          <p class="lead lead-on-dark">Short notes on planning, markets, and regulation — designed to inform conversations with your adviser.</p>
        </div>
      </section>

      <section class="section section-tint">
        <div class="container">
          <div class="insights-feature reveal">
            <article class="insight-hero-card">
              <p class="eyebrow">Featured</p>
              <h2>Seven questions to stress-test your estate plan</h2>
              <p>From nil-rate band usage to business property relief, a practical checklist before you lock in long-term gifts.</p>
              <span class="meta-pill">IHT · 8 min read</span>
            </article>
            <div class="insight-stack">
              <article class="insight-row reveal">
                <div><p class="eyebrow">Markets</p><h3>Balancing growth and stability after volatility spikes</h3></div>
                <span class="meta-pill">Investments</span>
              </article>
              <article class="insight-row reveal">
                <div><p class="eyebrow">Retirement</p><h3>Three drawdown decisions that change your tax bill</h3></div>
                <span class="meta-pill">Pensions</span>
              </article>
              <article class="insight-row reveal">
                <div><p class="eyebrow">Protection</p><h3>When income protection matters more than life cover</h3></div>
                <span class="meta-pill">Insurance</span>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function privacyPolicyView() {
  return `
    <div class="page">
      <section class="page-hero page-hero--cream" aria-labelledby="privacy-heading">
        <div class="container">
          <p class="eyebrow">Privacy policy</p>
          <h1 id="privacy-heading">Legal compliance &amp; your data</h1>
          <p class="lead">This overview follows the structure of our site map (data protection, cookies, rights). Replace with your final firm-specific wording before launch.</p>
        </div>
      </section>

      <section class="section section-white legal-section" id="data-protection" aria-labelledby="dp-heading">
        <div class="container narrow-block reveal">
          <h2 id="dp-heading">Data protection (GDPR / MiFID)</h2>
          <p>We process personal data to deliver regulated financial advice, maintain records, and meet legal obligations including MiFID-aligned conduct requirements where applicable. Lawful bases typically include contract, legal obligation, and legitimate interests balanced against your rights.</p>
          <p>We retain information only as long as needed for advice, audit trails, and regulatory timelines — then securely delete or anonymise it.</p>
        </div>
      </section>

      <section class="section section-tint legal-section" id="cookies" aria-labelledby="cookie-heading">
        <div class="container narrow-block reveal">
          <h2 id="cookie-heading">Cookie policy &amp; consent</h2>
          <p>Where we use non-essential cookies (for example analytics), we will obtain consent through a clear banner and allow you to adjust preferences at any time.</p>
          <p>Essential cookies required for security and basic site operation may be used without consent, in line with UK GDPR guidance.</p>
        </div>
      </section>

      <section class="section section-white legal-section" id="rights" aria-labelledby="rights-heading">
        <div class="container narrow-block reveal">
          <h2 id="rights-heading">Your rights (access &amp; erasure)</h2>
          <p>You may request access to the personal data we hold, ask us to correct inaccuracies, and in certain circumstances request erasure or restriction of processing.</p>
          <p>You may also lodge a complaint with the Information Commissioner's Office (ICO). We will respond to rights requests within statutory timeframes.</p>
        </div>
      </section>
    </div>
  `;
}

function contactView() {
  return `
    <div class="page page-contact">
      <section class="page-hero page-hero--navy" aria-labelledby="contact-heading">
        <div class="container">
          <p class="eyebrow">Contact us</p>
          <h1 id="contact-heading">Conversion-focused, human conversation</h1>
          <p class="lead lead-on-dark">Enquiry form, office details, and a dedicated space to book time with the team.</p>
        </div>
      </section>

      <section class="section section-tint">
        <div class="container contact-grid">
          <article class="contact-card reveal" id="office">
            <p class="eyebrow">Office details</p>
            <h2>Visit or call</h2>
            <p class="contact-strong">Pentagon Wealth</p>
            <p>London &amp; South East England<br>(Full address to be confirmed for launch)</p>
            <p style="margin-top:1rem;"><a href="tel:+442000000000">+44 (0)20 0000 0000</a></p>
            <p><a href="mailto:hello@pentagonwealth.co.uk">hello@pentagonwealth.co.uk</a></p>
            <p class="contact-hours">Monday – Friday, 9:00 – 17:30</p>
          </article>

          <article class="contact-card contact-card--form reveal">
            <p class="eyebrow">Enquiry form</p>
            <h2>Tell us what you need</h2>
            <form id="contact-form" class="form" novalidate>
              <div class="form-row">
                <label for="fullName">Name</label>
                <input id="fullName" name="fullName" type="text" autocomplete="name" required>
              </div>
              <div class="form-row">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="email" required>
              </div>
              <div class="form-row">
                <label for="serviceInterest">Topic (optional)</label>
                <select id="serviceInterest" name="serviceInterest">
                  <option value="">General enquiry</option>
                  <option value="IHT Planning">IHT planning</option>
                  <option value="Investments">Investments</option>
                  <option value="Retirement Planning">Retirement</option>
                  <option value="Pension Management">Pension management</option>
                  <option value="Insurance and Protection">Insurance</option>
                </select>
              </div>
              <div class="form-row">
                <label for="message">Your query</label>
                <textarea id="message" name="message" required placeholder="How can we help?"></textarea>
              </div>
              <div class="sr-only">
                <label for="companyWebsite">Company website</label>
                <input id="companyWebsite" name="companyWebsite" type="text" tabindex="-1" autocomplete="off">
              </div>
              <button class="btn btn-primary btn-full" type="submit">Submit enquiry</button>
              <p class="form-status" data-form-status></p>
            </form>
          </article>

          <article class="contact-card contact-card--book reveal" id="book">
            <p class="eyebrow">Book a call</p>
            <h2>Calendar scheduler</h2>
            <p>Choose a slot that suits you. Replace the link below with your live Calendly, Microsoft Bookings, or HubSpot meetings URL.</p>
            <a class="btn btn-gold btn-full" href="https://calendly.com" target="_blank" rel="noopener noreferrer">Open scheduler</a>
            <p class="fine-print">You will leave this site to complete booking.</p>
          </article>
        </div>
      </section>

      <div id="success-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
        <div class="modal-card">
          <h3 id="success-modal-title">Enquiry sent</h3>
          <p id="success-modal-message">Thanks, your enquiry has been received.</p>
          <div class="modal-actions">
            <button class="btn btn-primary" type="button" data-modal-close>Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function notFoundView() {
  return `
    <div class="page">
      <section class="section section-white">
        <div class="container narrow-block">
          <p class="eyebrow">404</p>
          <h1>Page not found</h1>
          <p class="lead">The page you requested does not exist.</p>
          <p style="margin-top:1.2rem;"><a class="btn btn-primary" href="/" data-link>Back home</a></p>
        </div>
      </section>
    </div>
  `;
}
