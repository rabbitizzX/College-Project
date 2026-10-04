import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, CircleHelp,
  GraduationCap, HeartHandshake, Lightbulb, LockKeyhole, Menu, MessageCircle, Moon,
  Pause, Play, ShieldCheck, Smartphone, Sun, Users, Video, X, type LucideIcon,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts';
import surveySummary from 'virtual:digital-saathi-survey-summary';
import { photoItems, projectFacts, videoItems, type CountItem, type processSurvey } from './data';

const queryClient = new QueryClient();
type Stats = ReturnType<typeof processSurvey>;
const stats = surveySummary as Stats;
type VideoItem = (typeof videoItems)[number];
const chartColors = ['#286bd2', '#16a2b8', '#8063c8', '#e29b4c', '#4a9c76'];
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function Header() {
  const [path] = useLocation();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('digital-saathi-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('digital-saathi-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const links = [{ href: '/', text: 'Home' }, { href: '/insights', text: 'Survey & Insights' }, { href: '/project', text: 'Project & Team' }];
  return <header className="topbar">
    <div className="nav-inner">
      <Link href="/" className="brand" aria-label="Digital Saathi home" onClick={() => setMenu(false)}>
        <span className="brand-mark"><HeartHandshake size={21} strokeWidth={2.2} /></span>
        <span><b>DIGITAL SAATHI</b><small>Bridging the Digital Gap</small></span>
      </Link>
      <nav className={`nav-links ${menu ? 'is-open' : ''}`} aria-label="Main navigation">
        {links.map(link => <Link key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined} onClick={() => setMenu(false)}>{link.text}</Link>)}
      </nav>
      <div className="nav-actions">
        <button className="icon-button theme-toggle" type="button" onClick={() => setDark(!dark)} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`} data-testid="button-theme-toggle">
          {dark ? <Sun size={19} /> : <Moon size={19} />}<span>{dark ? 'Light' : 'Dark'}</span>
        </button>
        <button className="icon-button menu-toggle" type="button" aria-expanded={menu} aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenu(!menu)} data-testid="button-mobile-menu">{menu ? <X /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="footer"><div className="footer-inner">
    <Link href="/" className="footer-brand"><span className="brand-mark"><HeartHandshake size={19} /></span><b>DIGITAL SAATHI</b></Link>
    <p>Digital Literacy Training for Senior Citizens</p>
    <span className="footer-rule">B.Sc. Information Technology · Faculty of {projectFacts.faculty} · © {projectFacts.year}</span>
  </div></footer>;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const check = () => setVisible(window.scrollY > 420);
    window.addEventListener('scroll', check, { passive: true }); return () => window.removeEventListener('scroll', check);
  }, []);
  return visible ? <button className="back-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={19} /></button> : null;
}

function Shell({ children }: { children: ReactNode }) {
  return <><a className="skip-link" href="#main">Skip to content</a><Header />{children}<Footer /><BackToTop /></>;
}

function PageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | Digital Saathi`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
  }, [title, description]);
  return null;
}

function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow"><span />{children}</div>; }
function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-heading"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p></div>;
}
function SectionHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return <div className="section-heading">{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<h2>{title}</h2>{text && <p>{text}</p>}</div>;
}

function StatCard({ icon: Icon, value, label, detail, color = 'blue' }: { icon: LucideIcon; value: string | number; label: string; detail: string; color?: string }) {
  return <article className={`stat-card tone-${color}`}><span className="stat-icon"><Icon size={20} /></span><div className="stat-value">{value}</div><div className="stat-label">{label}</div><p>{detail}</p></article>;
}
function ChartCard({ title, subtitle, children, className = '' }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return <article className={`chart-card ${className}`}><div className="chart-heading"><h3>{title}</h3><p>{subtitle}</p></div>{children}</article>;
}
function CountTooltip({ active, payload, denominator }: { active?: boolean; payload?: Array<{ payload?: CountItem & { name?: string } }>; denominator: number }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as CountItem;
  return <div className="chart-tooltip"><b>{item.name}</b><span>{item.count} of {denominator} · {fmtPct(item.pct)}</span></div>;
}
function HorizontalChart({ data, denominator, height = 300, color = chartColors[0] }: { data: CountItem[]; denominator: number; height?: number; color?: string }) {
  return data.length ? <div className="chart-frame" style={{ height }}><ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 3, right: 35, left: 8, bottom: 2 }}>
      <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="var(--chart-grid)" />
      <XAxis type="number" domain={[0, 'dataMax']} hide />
      <YAxis type="category" dataKey="name" width={155} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} tickLine={false} axisLine={false} interval={0} />
      <ChartTooltip content={<CountTooltip denominator={denominator} />} cursor={{ fill: 'var(--chart-hover)' }} />
      <Bar dataKey="count" fill={color} radius={[0, 5, 5, 0]} barSize={20} maxBarSize={23} />
    </BarChart>
  </ResponsiveContainer></div> : <div className="chart-empty">No responses were recorded for this question.</div>;
}
function BarCountChart({ data, denominator, color = chartColors[0] }: { data: CountItem[]; denominator: number; color?: string }) {
  return data.length ? <div className="chart-frame bar-frame"><ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 14, right: 10, left: -14, bottom: 4 }}>
      <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--chart-grid)" />
      <XAxis dataKey="name" tick={{ fill: 'var(--chart-label)', fontSize: 12 }} tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} tickLine={false} axisLine={false} />
      <ChartTooltip content={<CountTooltip denominator={denominator} />} cursor={{ fill: 'var(--chart-hover)' }} />
      <Bar dataKey="count" fill={color} radius={[5, 5, 0, 0]} barSize={42} />
    </BarChart>
  </ResponsiveContainer></div> : <div className="chart-empty">No responses were recorded for this question.</div>;
}
function RingChart({ data, denominator }: { data: CountItem[]; denominator: number }) {
  return <div className="ring-layout"><div className="ring-chart"><ResponsiveContainer width="100%" height="100%">
    <PieChart><Pie data={data} dataKey="count" nameKey="name" innerRadius={61} outerRadius={87} paddingAngle={3} stroke="none">
      {data.map((item, i) => <Cell key={item.name} fill={chartColors[i % chartColors.length]} />)}
    </Pie><ChartTooltip content={<CountTooltip denominator={denominator} />} /></PieChart>
  </ResponsiveContainer><div className="ring-center"><b>{denominator}</b><span>responses</span></div></div>
    <ul className="legend-list">{data.map((item, i) => <li key={item.name}><span className="legend-dot" style={{ background: chartColors[i % chartColors.length] }} /><span>{item.name}</span><b>{item.count} <small>({fmtPct(item.pct)})</small></b></li>)}</ul>
  </div>;
}

function HomePage({ stats }: { stats: Stats }) {
  const frequent = stats.dailyPhone;
  const u = stats.help.find(x => /upi/i.test(x.name));
  const leadingActivity = stats.activities[0];
  const yesEncounter = stats.safety.find(x => /^yes$/i.test(x.name));
  const noShare = stats.otp.find(x => /do not/i.test(x.name));
  const highlights = [
    { number: `${stats.smartphone} / ${stats.deviceDenom}`, title: 'Use a smartphone', text: 'Among participants with a recorded device group, this many reported using a smartphone.', icon: Smartphone },
    { number: u ? `${u.count} / ${stats.helpDenom}` : 'Not recorded', title: 'Need help with UPI', text: 'Smartphone users who selected UPI payments in the help-needed question.', icon: HeartHandshake },
    { number: stats.confidence === null ? 'Not recorded' : `${stats.confidence.toFixed(1)} / 5`, title: 'Self-reported confidence', text: `Average confidence among ${stats.confidenceDenom} smartphone users who answered.`, icon: Activity },
    { number: leadingActivity ? `${leadingActivity.count} / ${stats.activityDenom}` : 'Not recorded', title: leadingActivity?.name || 'Most selected activity', text: 'Most commonly selected smartphone activity among respondents to that question.', icon: MessageCircle },
  ];
  return <><PageMeta title="Home" description="Digital Saathi: a B.Sc. IT field project exploring digital access, confidence, online safety, and learning needs among surveyed participants." />
    <main id="main">
      <section className="hero wrap"><div className="hero-copy">
        <Eyebrow>B.Sc. INFORMATION TECHNOLOGY · FIELD PROJECT</Eyebrow>
        <h1>Technology should bring us <em>closer.</em></h1>
        <p className="hero-project-name">Digital Literacy Training for Senior Citizens</p>
        <p className="hero-tagline">Bridging the Digital Gap</p>
        <p className="hero-desc">A field-based study exploring digital access, smartphone use, confidence, online safety awareness, and learning needs among senior citizens.</p>
        <div className="degree-line"><GraduationCap size={19} /><span>B.Sc. Information Technology</span><i /><span>Faculty of {projectFacts.faculty}</span></div>
        <div className="hero-actions"><Link href="/insights" className="button primary">Explore survey insights <ArrowRight size={17} /></Link><Link href="/project" className="button secondary">Project &amp; evidence <ArrowDown size={16} /></Link></div>
      </div><div className="hero-art" aria-label="Illustration of a connected digital community">
        <div className="art-wash" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="art-core"><HeartHandshake size={50} strokeWidth={1.4} /><span>Saathi</span></div>
        <div className="art-node node-phone"><Smartphone size={23} /><span>Access</span></div>
        <div className="art-node node-safe"><ShieldCheck size={23} /><span>Safety</span></div>
        <div className="art-node node-talk"><MessageCircle size={23} /><span>Connection</span></div>
        <div className="art-caption"><span className="live-dot" /> A study shaped by real responses</div>
      </div></section>
      <section className="snapshot-band"><div className="wrap"><div className="snapshot-head"><div><Eyebrow>THE SURVEY AT A GLANCE</Eyebrow><h2>A clearer picture, from the source.</h2></div><span>Every number below is calculated from the supplied survey CSV.</span></div>
        <div className="stat-grid">
          <StatCard icon={Users} value={stats.total} label="Survey participants" detail="Rows with participant responses" />
          <StatCard icon={Smartphone} value={stats.smartphone} label="Smartphone users" detail={`Of ${stats.deviceDenom} with a device response`} color="cyan" />
          <StatCard icon={MessageCircle} value={stats.keypad} label="Keypad users" detail={`Of ${stats.deviceDenom} with a device response`} color="purple" />
          <StatCard icon={CircleHelp} value={stats.none} label="Without a phone" detail={`Of ${stats.deviceDenom} with a device response`} color="gold" />
        </div>
      </div></section>
      <section className="wrap about-section"><div className="about-intro"><Eyebrow>WHY THIS PROJECT</Eyebrow><h2>Digital confidence grows<br />one useful step at a time.</h2></div><div className="about-body"><p>Digital Saathi is a B.Sc. Information Technology field project about making everyday technology more approachable. The survey asks about device access, phone habits, smartphone tasks, self-reported confidence, online safety, and what people would like to learn.</p><p>These results describe <strong>our participants</strong> only. They are a starting point for listening and planning—not a measure of every older adult’s experience.</p><Link href="/project" className="text-link">How the project is organized <ArrowRight size={16} /></Link></div></section>
      <section className="journey-section"><div className="wrap"><SectionHeading eyebrow="FROM LISTENING TO LEARNING" title="A thoughtful project journey" text="Each stage helps connect participant perspectives to a practical learning focus." />
        <div className="journey-track">{[
          { Icon: MessageCircle, name: 'Survey', line: 'Ask what matters in daily digital life.' },
          { Icon: Users, name: 'Data collection', line: 'Gather responses across device groups.' },
          { Icon: Activity, name: 'Data analysis', line: 'Read each answer in its proper context.' },
          { Icon: BookOpen, name: 'Training focus', line: 'Use reported needs to shape useful topics.' },
          { Icon: ShieldCheck, name: 'Awareness', line: 'Keep safety and confidence in view.' },
        ].map(({ Icon, name, line }, i) => <article className="journey-step" key={name}><span className="step-icon"><Icon size={21} /></span><span className="step-no">0{i + 1}</span><h3>{name}</h3><p>{line}</p></article>)}</div>
      </div></section>
      <section className="wrap highlights-section"><div className="highlight-head"><SectionHeading eyebrow="WHAT THE RESPONSES SAY" title="A few signals worth exploring" text="Counts are shown alongside each population; blanks are not treated as negative answers." /><Link href="/insights" className="button secondary">See all insights <ArrowRight size={16} /></Link></div>
        <div className="highlight-grid">{highlights.map(({ number, title, text, icon: Icon }, i) => <article className="highlight-card" key={title}><span className={`highlight-icon hc-${i}`}><Icon size={20} /></span><strong>{number}</strong><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="data-callout">{yesEncounter && <span><b>{yesEncounter.count} / {stats.safetyDenom}</b> reported having received a suspicious contact.</span>}{noShare && <span><b>{noShare.count} / {stats.otpDenom}</b> selected “Do not” when asked what they would do if asked for an OTP or UPI PIN.</span>}<small>Self-reported answers; not an assessment of individual risk.</small></div>
      </section>
      <section className="closing-cta"><div className="wrap cta-inner"><span className="cta-mark"><Lightbulb size={25} /></span><div><Eyebrow>START WITH THE EVIDENCE</Eyebrow><h2>Explore the full survey picture.</h2><p>See how responses vary across access, activities, confidence, and safety.</p></div><Link href="/insights" className="button light-button">Open Survey &amp; Insights <ArrowRight size={17} /></Link></div></section>
    </main>
  </>;
}

function InsightsPage({ stats }: { stats: Stats }) {
  const xItems = useMemo(() => {
    return [
      'Make and receive calls', 'Save / Delete contacts', 'Make UPI payments',
      'Send/read email', 'Install/Delete/Update an app', 'Make WhatsApp voice/video calls',
      'Send photos/videos', 'Change basic phone settings', 'Upload a photo/document', 'Use Google Maps',
    ].filter(name => stats.canDo.some(item => item.name === name) || stats.help.some(item => item.name === name))
      .map(name => ({
        name: name.replace(/^Make /, '').replace(/^Change basic /, ''),
        independent: stats.canDo.find(x => x.name === name)?.count || 0,
        needsHelp: stats.help.find(x => x.name === name)?.count || 0,
      }));
  }, [stats]);
  const firstHelp = stats.help[0];
  const firstLearning = stats.learning[0];
  const yesEncounter = stats.safety.find(x => /^yes$/i.test(x.name));
  const noShare = stats.otp.find(x => /do not/i.test(x.name));
  const freqAtLeast = stats.frequency.filter(x => /several times a day|once or twice a day/i.test(x.name)).reduce((n, x) => n + x.count, 0);
  return <><PageMeta title="Survey & Insights" description="Explore participant responses on device access, phone use, smartphone skills, confidence, online safety, and learning needs." />
    <main className="page-wrap" id="main"><div className="wrap">
      <PageHeading eyebrow="SURVEY & INSIGHTS" title="What participants told us." text="Explore responses about digital access, habits, confidence, skills and online safety. Every chart names its response base." />
      <div className="evidence-note"><ShieldCheck size={19} /><p><b>Read the evidence in context.</b> Results are among our surveyed participants only. A blank branch-specific answer is unanswered—not a “no.” Safety and confidence answers are self-reported.</p></div>
      <section className="insight-overview"><div className="section-inline"><div><Eyebrow>PARTICIPANT OVERVIEW</Eyebrow><h2>Devices in the picture</h2></div><span>Device response base: {stats.deviceDenom} of {stats.total}</span></div>
        <div className="overview-grid"><div className="overview-stats">
          <StatCard icon={Users} value={stats.total} label="Survey participants" detail="Valid response rows" />
          <StatCard icon={Smartphone} value={stats.smartphone} label="Smartphone users" detail={`Among ${stats.deviceDenom} device responses`} color="cyan" />
          <StatCard icon={MessageCircle} value={stats.keypad} label="Keypad users" detail={`Among ${stats.deviceDenom} device responses`} color="purple" />
          <StatCard icon={CircleHelp} value={stats.none} label="No phone" detail={`Among ${stats.deviceDenom} device responses`} color="gold" />
        </div><ChartCard title="Device group" subtitle={`Among ${stats.deviceDenom} participants with a device response.`}><RingChart data={stats.deviceData} denominator={stats.deviceDenom} /></ChartCard></div>
      </section>
      <div className="chart-grid">
        <ChartCard title="How often participants use a phone" subtitle={`All participants who answered · n = ${stats.frequencyDenom}.`}><BarCountChart data={stats.frequency} denominator={stats.frequencyDenom} /></ChartCard>
        <ChartCard title="Smartphone activities" subtitle={`Activities selected by smartphone users · question response base n = ${stats.activityDenom}. Multi-select; percentages use respondent base.`}><HorizontalChart data={stats.activities} denominator={stats.activityDenom} height={Math.max(270, stats.activities.length * 34)} color={chartColors[1]} /></ChartCard>
        <ChartCard title="Smartphone tasks where help is needed" subtitle={`Among ${stats.helpDenom} smartphone users who answered. Each person could select several tasks.`}><HorizontalChart data={stats.help} denominator={stats.helpDenom} height={Math.max(290, stats.help.length * 34)} color={chartColors[2]} /></ChartCard>
        <ChartCard title="Independent tasks and help requested" subtitle={`Counts of selections, not exclusive groups. Can-do n = ${stats.canDenom}; help-needed n = ${stats.helpDenom}.`} className="wide-chart">
          {xItems.length ? <div className="chart-frame comparison-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={xItems} layout="vertical" margin={{ top: 3, right: 20, left: 8, bottom: 3 }}>
            <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="var(--chart-grid)" /><XAxis type="number" allowDecimals={false} hide />
            <YAxis dataKey="name" type="category" width={155} tick={{ fill: 'var(--chart-label)', fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
            <ChartTooltip content={({ active, payload, label }) => active && payload?.length ? <div className="chart-tooltip"><b>{label}</b>{payload.map(p => <span key={p.name}>{p.name}: {p.value}</span>)}</div> : null} />
            <Legend /><Bar dataKey="independent" name="Can do independently" fill={chartColors[0]} radius={[0, 4, 4, 0]} barSize={12} /><Bar dataKey="needsHelp" name="Needs help" fill={chartColors[3]} radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart></ResponsiveContainer></div> : <div className="chart-empty">No comparable task responses are available.</div>}
          <p className="chart-footnote">Unselected options remain unknown; they are not counted as “cannot do.”</p>
        </ChartCard>
        <ChartCard title="Self-reported smartphone confidence" subtitle={`Scale reported in the survey · ${stats.confidenceDenom} smartphone users answered.`} className="confidence-card">
          <div className="confidence-summary"><strong>{stats.confidence === null ? '—' : stats.confidence.toFixed(1)}</strong><span>/ 5 average</span><small>Self-reported confidence; not an objective skills score.</small></div>
          <BarCountChart data={stats.confidenceDist} denominator={stats.confidenceDenom} color={chartColors[2]} />
        </ChartCard>
        <ChartCard title="Fraud and scam knowledge ratings" subtitle="Branch-specific question columns are kept distinct; each distribution uses its own nonblank answer base." className="wide-chart">
          <div className="branch-grid">{stats.fraud.map((branch, i) => <div className="branch-panel" key={branch.label}><h4>{branch.label}</h4><p>Answered n = {branch.denominator}</p><div className="branch-bars">{branch.data.length ? branch.data.map((x, j) => <div className="branch-row" key={x.name}><span>{x.name}</span><div className="mini-track"><i style={{ width: `${x.pct}%`, background: chartColors[(j + i) % chartColors.length] }} /></div><b>{x.count}/{branch.denominator}</b></div>) : <p className="chart-empty">No nonblank answers.</p>}</div></div>)}</div>
          <p className="chart-footnote">Self-assessed knowledge, not a test of fraud awareness.</p>
        </ChartCard>
        <ChartCard title="Suspicious contacts reported" subtitle={`Question base: ${stats.safetyDenom} participants who answered. A blank response is not counted.`}>
          <div className="safety-list">{stats.safety.map((x, i) => <div className="safety-row" key={x.name}><span className={`safety-mark mark-${i}`}><ShieldCheck size={17} /></span><span>{x.name}</span><b>{x.count} / {stats.safetyDenom}</b><small>{fmtPct(x.pct)}</small></div>)}</div>
          <p className="chart-footnote">A self-reported experience; no individual is identified.</p>
        </ChartCard>
        <ChartCard title="Response to an OTP or UPI PIN request" subtitle={`Question base: ${stats.otpDenom} participants who answered.`}>
          <div className="safety-list">{stats.otp.map((x, i) => <div className="safety-row" key={x.name}><span className={`safety-mark mark-${/do not/i.test(x.name) ? 'safe' : i}`}><LockKeyhole size={17} /></span><span>{x.name}</span><b>{x.count} / {stats.otpDenom}</b><small>{fmtPct(x.pct)}</small></div>)}</div>
          <p className="chart-footnote">Responses are self-reported intentions, not observed behavior.</p>
        </ChartCard>
        <ChartCard title="Topics participants want to learn" subtitle={`Multi-select learning responses across applicable survey branches · ${stats.learningDenom} nonblank respondent answers.`} className="wide-chart">
          <HorizontalChart data={stats.learning} denominator={stats.learningDenom} height={Math.max(270, stats.learning.length * 34)} color={chartColors[1]} />
          <p className="chart-footnote">No-response blanks in a branch are not treated as lack of interest. Branch answer bases: no phone n = {stats.learnNoPhoneDenom}; keypad n = {stats.learnKeypadDenom}.</p>
        </ChartCard>
      </div>
      <section className="key-insights"><SectionHeading eyebrow="IN PLAIN LANGUAGE" title="Signals to keep in view" text="A compact reading of the results—always within the population that answered." />
        <div className="plain-insights">
           {firstHelp && <article><span className="insight-index">01</span><div><h3>{firstHelp.name} is the most-selected help area.</h3><p>{firstHelp.count} of {stats.helpDenom} smartphone users who answered selected it ({fmtPct(firstHelp.pct)}). This is a multi-select response.</p></div></article>}
          {stats.confidence !== null && <article><span className="insight-index">02</span><div><h3>Average self-reported confidence: {stats.confidence.toFixed(1)} out of 5.</h3><p>Calculated from {stats.confidenceDenom} smartphone-user confidence ratings. It does not measure objective skill.</p></div></article>}
          <article><span className="insight-index">03</span><div><h3>{freqAtLeast} participants reported using a phone at least once or twice a day.</h3><p>Among {stats.frequency.reduce((a, x) => a + x.count, 0)} nonblank phone-frequency answers across all device groups.</p></div></article>
          {yesEncounter && <article><span className="insight-index">04</span><div><h3>{yesEncounter.count} participants answered “Yes” to receiving a suspicious contact.</h3><p>Among {stats.safetyDenom} nonblank answers. The response describes an experience, not a personal risk classification.</p></div></article>}
          {firstLearning && <article><span className="insight-index">05</span><div><h3>{firstLearning.name} leads the recorded learning requests.</h3><p>Selected {firstLearning.count} times in {stats.learningDenom} nonblank respondent answers across applicable branches.</p></div></article>}
          {noShare && <article><span className="insight-index">06</span><div><h3>{noShare.count} selected “Do not” in the OTP / UPI PIN scenario.</h3><p>Among {stats.otpDenom} answered responses. This is a self-reported intended response.</p></div></article>}
        </div>
      </section>
      <div className="privacy-note"><LockKeyhole size={18} /><p><b>Privacy by design.</b> This dashboard presents aggregate counts only. It does not display response-level answers, timestamps, or identifying details.</p></div>
    </div></main>
  </>;
}

const topics: Array<{ icon: LucideIcon; title: string; intro: string; steps: string[]; accent: string }> = [
  { icon: Smartphone, title: 'Smartphone basics', intro: 'Get comfortable with the parts of a phone you use every day.', steps: ['Adjust text size and screen brightness.', 'Learn the Home, Back, and recent-app controls.', 'Save a trusted contact and practise calling them.', 'Ask before installing an unfamiliar app.'], accent: 'blue' },
  { icon: MessageCircle, title: 'WhatsApp & communication', intro: 'Stay in touch in ways that feel familiar and manageable.', steps: ['Open a chat and read a message slowly.', 'Make a voice call; practise a video call with family.', 'Share a photo only with a person you know.', 'Pause before opening a link in a message.'], accent: 'cyan' },
  { icon: HeartHandshake, title: 'Digital payments / UPI', intro: 'Understand the steps before choosing whether to make a payment.', steps: ['Check the person and amount before continuing.', 'A UPI PIN is used to send money—not receive it.', 'Never tell anyone your PIN or OTP, even on a call.', 'Stop and ask someone you trust if a request feels unusual.'], accent: 'purple' },
  { icon: ShieldCheck, title: 'Online safety', intro: 'A moment to pause can protect private information.', steps: ['Do not share an OTP, PIN, or password.', 'Do not tap urgent links from unknown senders.', 'Hang up if someone pressures you for money.', 'Contact a trusted person through a known number.'], accent: 'gold' },
  { icon: Lightbulb, title: 'Useful digital tools', intro: 'Explore practical tools at a comfortable pace, with support.', steps: ['Use Maps with a trusted person before going somewhere new.', 'Practise taking and finding a photo.', 'Learn to search for information with help checking the source.', 'Keep phone updates and settings simple and familiar.'], accent: 'green' },
];

function Lightbox({ active, onClose, onMove }: { active: number; onClose: () => void; onMove: (by: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onMove(-1);
      if (e.key === 'ArrowRight') onMove(1);
    };
    window.addEventListener('keydown', onKey);
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = old; };
  }, [onClose, onMove]);
  const photo = photoItems[active];
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Fieldwork photo viewer" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className="lightbox-close" aria-label="Close photo viewer" onClick={onClose}><X /></button>
    <button className="lightbox-arrow prev" aria-label="Previous photograph" onClick={() => onMove(-1)}><ArrowLeft /></button>
    <figure><img src={photo.src} alt={photo.caption} /><figcaption>{photo.caption}<small>{active + 1} of {photoItems.length}</small></figcaption></figure>
    <button className="lightbox-arrow next" aria-label="Next photograph" onClick={() => onMove(1)}><ArrowRight /></button>
  </div>;
}

function TeamSection() {
  return <section id="team-placeholders" className="team-section">
    <SectionHeading eyebrow="PROJECT TEAM" title="Four teammate cards, ready to fill in." text="Names, roles, contributions, and photos remain placeholders until confirmed." />
    <p className="team-template-note"></p>
    <div className="team-grid">{projectFacts.team.map((member, i) => <article className="team-card" key={member.name}>
      <div className="team-photo-placeholder"><img src={member.photo} alt={member.name} /></div>
      <div className="team-copy"><h3>{member.name}</h3><span>{member.role}</span><p>{member.contribution}</p></div>
    </article>)}</div>
  </section>;
}

function formatPlaybackTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function FieldworkVideoCard({ video }: { video: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const element = videoRef.current;
    if (element) {
      element.defaultMuted = true;
      element.muted = true;
      element.volume = 0;
    }
  }, []);

  const startPlayback = async () => {
    const element = videoRef.current;
    if (!element) return;
    setPlayError(false);
    element.defaultMuted = true;
    element.muted = true;
    element.volume = 0;
    try {
      await element.play();
    } catch {
      setPlaying(false);
      setPlayError(true);
    }
  };

  const togglePlayback = () => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) void startPlayback();
    else element.pause();
  };

  const syncDuration = () => {
    const element = videoRef.current;
    if (element) setDuration(Number.isFinite(element.duration) ? element.duration : 0);
  };

  const seekTo = (time: number) => {
    const element = videoRef.current;
    if (!element || !Number.isFinite(time)) return;
    element.currentTime = time;
    setCurrentTime(time);
  };

  return <article className="video-card">
    <div className={`video-frame video-frame-${video.orientation}`}>
      <video ref={videoRef} muted preload="metadata" playsInline aria-label={`${video.title}, muted`}
        onPlay={() => { setPlaying(true); setPlayError(false); }}
        onPause={() => { setPlaying(false); setCurrentTime(videoRef.current?.currentTime ?? 0); }}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
        onVolumeChange={event => {
          const element = event.currentTarget;
          if (!element.muted || element.volume !== 0) {
            element.muted = true;
            element.volume = 0;
          }
        }}
        onError={() => { setPlaying(false); setPlayError(true); }}>
        <source src={video.src} type="video/mp4" />
        Your browser does not support video playback.
      </video>
      {!playing && <button type="button" className="video-play-button" onClick={() => void startPlayback()} aria-label={`Play ${video.title}`}>
        <Play size={22} fill="currentColor" /><span>Play video</span>
      </button>}
      <div className="video-controls" role="group" aria-label={`Muted playback controls for ${video.title}`}>
        {playing
          ? <button type="button" className="video-pause-button" onClick={togglePlayback} aria-label={`Pause ${video.title}`}><Pause size={17} fill="currentColor" /></button>
          : <span className="video-control-spacer" aria-hidden="true" />}
        <input className="video-seek" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 0)}
          disabled={!duration} onChange={event => seekTo(Number(event.currentTarget.value))}
          aria-label={`Seek ${video.title}`} aria-valuetext={`${formatPlaybackTime(currentTime)} of ${formatPlaybackTime(duration)}`} />
        <span className="video-time" aria-live="off">{formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}</span>
      </div>
    </div>
    {playError && <p className="video-error" role="alert">Could not play this muted video. Try again or open the page in another browser.</p>}
    <h3>{video.title}</h3>
  </article>;
}

function ProjectPage({ stats }: { stats: Stats }) {
  const [filter, setFilter] = useState('All');
  const [active, setActive] = useState<number | null>(null);
  const close = () => setActive(null);
  const move = (by: number) => setActive(current => current === null ? null : (current + by + photoItems.length) % photoItems.length);
  const matchUpi = stats.help.find(x => /upi/i.test(x.name));
  const matchCalls = stats.help.find(x => /whatsapp voice\/video calls/i.test(x.name));
  const matchMaps = stats.help.find(x => /google maps/i.test(x.name));
  return <><PageMeta title="Project & Team" description="Fieldwork evidence, genuine local media, practical digital-literacy guidance, and editable project and team information." />
    <main className="page-wrap project-page" id="main"><div className="wrap">
      <PageHeading eyebrow="PROJECT & TEAM" title="The work behind the numbers." text="Fieldwork evidence, practical learning guidance, and project information—kept transparent and editable." />
      <TeamSection />
      <section className="evidence-section">
        <div className="evidence-intro"><Eyebrow>FIELDWORK &amp; PROJECT EVIDENCE</Eyebrow><h2>Grounded in real encounters.</h2><p>{projectFacts.description}</p><p className="fieldwork-activity"><b>Activities conducted</b><br />{projectFacts.activities}</p></div>
        <div className="fact-list">
          {[['Fieldwork date', projectFacts.fieldworkDate], ['Location', projectFacts.location], ['Fieldwork participants', projectFacts.participants], ['Programme', 'B.Sc. Information Technology'], ['Faculty', 'Science & Technology']].map(([key, value]) => <div className="fact-row" key={key}><span>{key}</span><b>{value}</b></div>)}
        </div>
      </section>
      <section className="gallery-section">
        <div className="section-inline"><SectionHeading eyebrow="LOCAL FIELDWORK MEDIA" title="Photographs from the project" text="Genuine supplied photographs. Captions are editable in src/data.ts; no activity is inferred from an image." /><div className="filter-tabs" role="group" aria-label="Filter photographs">{[{ key: 'All', label: 'All photos' }, { key: 'Set 1', label: 'Photo set 01–03' }, { key: 'Set 2', label: 'Photo set 04–07' }].map(option => <button key={option.key} className={filter === option.key ? 'selected' : ''} onClick={() => setFilter(option.key)} aria-pressed={filter === option.key}>{option.label}</button>)}</div></div>
        <div className="photo-grid">{photoItems.map((photo, index) => ({ photo, index })).filter(({ index }) => filter === 'All' || (filter === 'Set 1' && index < 3) || (filter === 'Set 2' && index >= 3)).map(({ photo, index }) => <button className={`photo-card photo-${index % 3}`} key={photo.src} onClick={() => setActive(index)} aria-label={`Open ${photo.caption}`} data-testid={`button-photo-${index + 1}`}><img src={photo.src} alt={photo.caption} loading="lazy" /><span className="photo-open"><span>{photo.caption}</span><ArrowRight size={17} /></span></button>)}</div>
        <p className="media-note">Photographs are presented without assigning specific activities or identities.</p>
      </section>
      <section className="video-section"><div className="video-title"><span className="video-symbol"><Video size={21} /></span><div><Eyebrow>PROJECT MEDIA</Eyebrow><h2>Fieldwork video records</h2></div></div><p className="video-intro">Seven supplied local videos. Playback is muted; controls provide play/pause and seeking only.</p>
        <div className="video-grid">{videoItems.map(video => <FieldworkVideoCard key={video.src} video={video} />)}</div>
      </section>
      <section className="training-section"><SectionHeading eyebrow="PRACTICAL, PLAIN-LANGUAGE GUIDE" title="Digital literacy training guide" text="Small steps, repeatable practice, and the choice to pause at any time. This is guidance—not a claim of measured training outcomes." />
        <div className="training-grid">{topics.map(({ icon: Icon, title, intro, steps, accent }, i) => <article className={`training-card training-${accent}`} key={title}><div className="training-top"><span className="topic-number">0{i + 1}</span><span className="topic-icon"><Icon size={23} /></span></div><h3>{title}</h3><p>{intro}</p><ul>{steps.map(step => <li key={step}><Check size={15} />{step}</li>)}</ul></article>)}</div>
      </section>
      <section className="why-section"><div className="why-copy"><Eyebrow>WHY THESE TOPICS</Eyebrow><h2>Listen first.<br />Plan from evidence.</h2><p>Survey responses can guide the topics we prioritize. They do not show whether training has improved skills or confidence.</p><div className="evidence-flow"><span>Survey responses</span><ArrowRight size={17} /><span>Reported needs</span><ArrowRight size={17} /><span>Training focus</span></div></div>
        <div className="why-data">{[
          { label: 'UPI payments', item: matchUpi, denom: stats.helpDenom },
          { label: 'WhatsApp voice / video calls', item: matchCalls, denom: stats.helpDenom },
          { label: 'Google Maps', item: matchMaps, denom: stats.helpDenom },
        ].map(row => <div className="why-row" key={row.label}><span>{row.label}</span>{row.item ? <><strong>{row.item.count} / {row.denom}</strong><small>smartphone users who answered selected this help area.</small></> : <><strong>Not recorded</strong><small>No matching selection was recorded in the help-needed answers.</small></>}</div>)}</div>
      </section>
      <section className="project-details"><div><Eyebrow>PROJECT DETAILS</Eyebrow><h2>Editable project facts</h2></div><div className="details-grid">{[
        ['Project', 'Digital Literacy Training for Senior Citizens'], ['Programme', 'B.Sc. Information Technology'], ['Faculty', 'Science & Technology'], ['Project type', 'Group + Field Project'], ['College', projectFacts.college], ['Faculty mentor', projectFacts.mentor], ['Academic year', projectFacts.year], ['Team members', projectFacts.team.map(member => member.name).join(', ')],
      ].map(([k, v]) => <div className="detail-cell" key={k}><span>{k}</span><b>{v}</b></div>)}</div><p className="edit-hint">Placeholder facts are centralized in <code>src/data.ts</code> for straightforward editing.</p></section>
    </div></main>
    {active !== null && <Lightbox active={active} onClose={close} onMove={move} />}
  </>;
}

function AppContent() {
  const [path] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [path]);
  return <Shell><Switch>
    <Route path="/"><HomePage stats={stats} /></Route>
    <Route path="/insights"><InsightsPage stats={stats} /></Route>
    <Route path="/project"><ProjectPage stats={stats} /></Route>
    <Route component={NotFound} />
  </Switch></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
    <ErrorBoundary><AppContent /></ErrorBoundary>
  </WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;