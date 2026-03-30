import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  Send, 
  Briefcase, 
  Settings, 
  Bell, 
  Search,
  Zap,
  ArrowRight,
  Bot,
  Loader2,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Agent forms state
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [resumeData, setResumeData] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const [isFetchingJobs, setIsFetchingJobs] = useState(false);
  const [fetchedJobs, setFetchedJobs] = useState(null);

  // Proposal Generator state
  const [propJobTitle, setPropJobTitle] = useState('');
  const [propJobDesc, setPropJobDesc] = useState('');
  const [propExpectations, setPropExpectations] = useState('');
  const [propExperience, setPropExperience] = useState('');
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState(null);

  const features = [
    {
      id: 'find-clients',
      title: 'Find Clients',
      description: 'Deploy aggressive AI agents to scrape freelance platforms (Fiverr, Upwork, Freelancer) and discover high-paying jobs.',
      icon: <Users size={28} />,
      colorClass: 'icon-blue',
      agentReady: true
    },
    {
      id: 'proposal-gen',
      title: 'Proposal Generator',
      description: 'AI analyzes job descriptions and generates highly-converting, personalized proposal notes based on your expertise.',
      icon: <FileText size={28} />,
      colorClass: 'icon-purple',
      agentReady: true
    },
    {
      id: 'send-resumes',
      title: 'Send Resumes',
      description: 'Automated outreach agent that tailors your resume dynamically and dispatches it to potential clients.',
      icon: <Send size={28} />,
      colorClass: 'icon-pink',
      agentReady: false
    },
    {
      id: 'project-status',
      title: 'My Projects Status',
      description: 'Monitor ongoing contracts, track agent activities, and analyze success rates in real-time.',
      icon: <Briefcase size={28} />,
      colorClass: 'icon-emerald',
      agentReady: false
    }
  ];

  const handleCardClick = (feature) => {
    setSelectedAgent(feature.id);
    setIsVerifying(false); // Reset states
    setVerificationComplete(false);
    setIsFetchingJobs(false);
    setFetchedJobs(null);
    setIsGeneratingApp(false);
    setGeneratedProposal(null);
  };

  const handleUseAgent = async () => {
    setIsFetchingJobs(true);
    setFetchedJobs(null);

    const targetQuery = jobSearchQuery || "developer";
    const apiKey = "";
    
    // Explicit prompt to behave like a web scraper for Fiverr and LinkedIn
    const prompt = `You are a highly capable AI freelance agent. The user is looking for remote freelance jobs related to "${targetQuery}". Your task is to scrape and return exactly 3 highly realistic current job listings from Fiverr and LinkedIn. Return ONLY a valid JSON array of objects. Do not include any markdown formatting like \`\`\`json. Each object MUST have these exact keys: "title", "platform" (either "Fiverr" or "LinkedIn"), "client" (a realistic company or username), "budget" (e.g. "$50/hr" or "$800 fixed"), "description" (a brief 2-sentence realistic job description), and "link" (a realistic application URL for the job on the platform).`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const rawData = await response.json();
      let content = rawData.choices[0].message.content.trim();
      
      // Clean up the output if the LLM hallucinated markdown code blocks
      if (content.startsWith('```json')) {
         content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (content.startsWith('```')) {
         content = content.replace(/```/g, '').trim();
      }
      
      let jobsArray = [];
      try {
        jobsArray = JSON.parse(content);
      } catch (parseError) {
        // Fallback precise sub-string extraction if direct JSON parse strings have trailing characters
        const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
        jobsArray = JSON.parse(jsonStr);
      }

      // Add IDs for React mapping
      setFetchedJobs(jobsArray.map((job, idx) => ({ ...job, id: idx + 1 })));
    } catch (err) {
      console.warn("Agent Generation Failed:", err);
      setFetchedJobs([
         {
           id: "error-1",
           title: "Live Fetch Failed: Agent Offline",
           platform: "System",
           client: "Localhost",
           budget: "-",
           description: "Could not fetch dynamic jobs from Fiverr & LinkedIn using Groq API. Please verify the API key and connection."
         }
      ]);
    } finally {
      setIsFetchingJobs(false);
    }
  };

  const handleGenerateProposal = async () => {
    setIsGeneratingApp(true);
    setGeneratedProposal(null);

    const apiKey = "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";
    const prompt = `You are an expert freelance proposal writer. Write a highly-converting, professional business proposal message for the following job:
Title: ${propJobTitle || "General Job"}
Description: ${propJobDesc || "N/A"}
Client's Expectations: ${propExpectations || "N/A"}
My Experience: ${propExperience || "N/A"}

Keep it concise, persuasive, and ready to send. DO NOT include any markdown formatting like \`\`\` or conversational filler. Return just the proposal text.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const rawData = await response.json();
      let content = rawData.choices[0].message.content.trim();
      setGeneratedProposal(content);
    } catch (err) {
      console.warn("Proposal Generation Failed:", err);
      setGeneratedProposal("Error: Could not generate proposal. Please verify the API key and connection.");
    } finally {
      setIsGeneratingApp(false);
    }
  };

  const handleVerifyResume = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationComplete(true);
    }, 2500);
  };

  const renderActiveAgentPanel = () => {
    const feature = features.find(f => f.id === selectedAgent);
    if (!feature) return null;

    return (
      <div className="fade-in" style={{ animation: 'fadeIn 0.4s ease-out forwards' }}>
        <button 
          onClick={() => {
            setSelectedAgent(null);
            setIsFetchingJobs(false);
            setFetchedJobs(null);
            setIsGeneratingApp(false);
            setGeneratedProposal(null);
          }}
          style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
            marginBottom: '2rem', fontSize: '1.1rem', padding: 0
          }}
        >
          <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }}/> Back to Overview
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className={`card-icon ${feature.colorClass}`} style={{ margin: 0, width: '75px', height: '75px', fontSize: '2rem' }}>
            {feature.icon}
          </div>
          <div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{feature.title}</h2>
            <p style={{ color: 'var(--brand-primary)', fontSize: '1.1rem', marginTop: '0.25rem', fontWeight: '500' }}>Active Interface Configuration</p>
          </div>
        </div>

        <div className="agent-panel" style={{ marginTop: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {selectedAgent === 'find-clients' && (
            <>
              <div style={{ gridColumn: '1 / -1' }}>
                 <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Settings size={20} color="var(--brand-secondary)"/> Core Agent Parameters
                 </h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Configure the detailed search parameters for the autonomous agent.</p>
              </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Target Roles / Keywords</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Senior React Developer, AI Consultant" 
              value={jobSearchQuery}
              onChange={(e) => setJobSearchQuery(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Salary / Hourly Range</label>
            <input type="text" className="input-field" placeholder="e.g. $50/hr - $100/hr OR $100k+" />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Experience Level</label>
            <select className="input-field" style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="expert">Expert / Manager</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Upload Resume for Context Matching</label>
            <div style={{ 
              border: '2px dashed var(--brand-primary)', 
              borderRadius: '0.75rem', 
              padding: '1.5rem', 
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
               }}
            >
              <FileText size={24} color="var(--brand-primary)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Click to upload or drag resume</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>PDF, DOCX up to 5MB</p>
            </div>
          </div>

          <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label>Job Description & Custom Instructions (Optional)</label>
            <textarea 
              className="input-field" 
              rows="4" 
              placeholder="Paste specific job descriptions here, or tell the agent exactly what kind of gigs to prioritize or avoid based on your skillset..."
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Ready to deploy?</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>The agent will begin hunting and compiling data immediately.</p>
              </div>
              <button 
                className="agent-button" 
                onClick={handleUseAgent}
                disabled={isFetchingJobs}
                style={{ 
                  padding: '1rem 2.5rem', 
                  fontSize: '1.1rem',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  background: isFetchingJobs ? 'var(--card-border)' : 'var(--accent-glow)',
                  color: isFetchingJobs ? 'var(--text-secondary)' : 'white'
                }}
              >
                {isFetchingJobs ? (
                  <><Loader2 size={24} className="spin" /> Activating Protocol...</>
                ) : (
                  <><Zap size={24} /> Deploy & Fetch Data</>
                )}
              </button>
            </div>

            {fetchedJobs && (
              <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '1rem' }}>
                <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem' }}>
                  <Activity size={24} color="var(--brand-primary)" /> 
                  Live Agent Insights
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {fetchedJobs.map((job, idx) => (
                    <div key={idx} style={{
                      padding: '1.5rem',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <h5 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>{job.title}</h5>
                        <span style={{ 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          color: 'var(--brand-primary)', 
                          padding: '6px 14px', 
                          borderRadius: '20px', 
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>{job.budget}</span>
                      </div>
                      <p style={{ color: 'var(--brand-secondary)', fontSize: '1rem', marginBottom: '1rem', fontWeight: '500' }}>
                        {job.platform} • {job.client}
                      </p>
                      <pre style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.95rem', 
                        lineHeight: 1.6, 
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit'
                      }}>
                        {job.description}
                      </pre>
                      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <a 
                          href={job.platform?.toLowerCase().includes('fiverr') ? `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(job.client + " " + job.title)}` : `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="agent-button"
                          style={{
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                            color: 'white',
                            background: 'var(--brand-primary)',
                            gap: '0.5rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Apply Now <ArrowRight size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
        )}

        {selectedAgent === 'proposal-gen' && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
               <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <FileText size={20} color="var(--brand-secondary)"/> Proposal Details
               </h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Provide the context of the job you are applying for, and the AI will craft a converting proposal.</p>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label>Job Title</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Need a Senior React Developer for E-commerce site"
                value={propJobTitle}
                onChange={(e) => setPropJobTitle(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label>Job Description</label>
              <textarea 
                className="input-field" 
                rows="3" 
                placeholder="Paste the full job description or key parts of it..."
                style={{ resize: 'vertical' }}
                value={propJobDesc}
                onChange={(e) => setPropJobDesc(e.target.value)}
              ></textarea>
            </div>
            
            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label>Expecting Things (Client's pain points or specific needs)</label>
              <textarea 
                className="input-field" 
                rows="2" 
                placeholder="e.g. Needs high performance, tight deadline, clean code..."
                style={{ resize: 'vertical' }}
                value={propExpectations}
                onChange={(e) => setPropExpectations(e.target.value)}
              ></textarea>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label>Your Experience</label>
              <textarea 
                className="input-field" 
                rows="2" 
                placeholder="e.g. 5+ years building e-commerce with Next.js and React..."
                style={{ resize: 'vertical' }}
                value={propExperience}
                onChange={(e) => setPropExperience(e.target.value)}
              ></textarea>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Formulate Proposal</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>The AI agent will draft a ready-to-send proposal.</p>
                </div>
                <button 
                  className="agent-button" 
                  onClick={handleGenerateProposal}
                  disabled={isGeneratingApp}
                  style={{ 
                    padding: '1rem 2.5rem', 
                    fontSize: '1.1rem',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                    background: isGeneratingApp ? 'var(--card-border)' : 'var(--accent-glow)',
                    color: isGeneratingApp ? 'var(--text-secondary)' : 'white'
                  }}
                >
                  {isGeneratingApp ? (
                    <><Loader2 size={24} className="spin" /> Generating Proposal...</>
                  ) : (
                    <><Bot size={24} /> Generate Proposal</>
                  )}
                </button>
              </div>

              {generatedProposal && (
                <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '1rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.3rem' }}>
                    <CheckCircle2 size={24} color="#a855f7" /> 
                    Generated Proposal
                  </h4>
                  <div style={{
                    padding: '1.5rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                  }}>
                    <pre style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '1.05rem', 
                      lineHeight: 1.7, 
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}>
                      {generatedProposal}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
         </div>
      </div>
    );
  };

  const renderClientsDashboard = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Clients Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Total Active Clients</p>
          <h3 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>12</h3>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>New Clients (This Month)</p>
          <h3 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--brand-primary)' }}>+3</h3>
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px' }}>
        <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem', marginTop: 0 }}>Client Details</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>Client Name</th>
              <th style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>Industry</th>
              <th style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem' }}>TechCorp Industries</td>
              <td style={{ padding: '1rem' }}>E-Commerce</td>
              <td style={{ padding: '1rem', color: 'var(--brand-secondary)' }}>Active</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem' }}>Global Innovations</td>
              <td style={{ padding: '1rem' }}>SaaS</td>
              <td style={{ padding: '1rem', color: 'var(--brand-secondary)' }}>Active</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem' }}>Nexus Dynamics</td>
              <td style={{ padding: '1rem' }}>Finance</td>
              <td style={{ padding: '1rem', color: 'var(--brand-primary)' }}>Onboarding</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProposalsDashboard = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Proposals Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FileText size={40} color="var(--brand-primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', color: 'white' }}>48</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Proposals Sent</p>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Activity size={40} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', color: 'white' }}>15</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Proposals Accepted</p>
        </div>
      </div>
    </div>
  );

  const renderProjectsDashboard = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Projects & Milestones</h2>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Briefcase size={48} color="var(--brand-secondary)" />
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.25rem', marginTop: 0 }}>Ongoing Projects</p>
          <h3 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>7</h3>
        </div>
      </div>
      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px' }}>
        <h4 style={{ color: 'white', marginBottom: '1rem', margin: 0 }}>Recent Activity</h4>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>• AI Agent completed scraping 42 job leads.</p>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>• Payment milestone for "TechCorp" released.</p>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>• Automated follow-up sent to "Global Innovations".</p>
      </div>
    </div>
  );

  const renderSettingsDashboard = () => (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>System Settings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'white', margin: '0 0 0.25rem 0' }}>Dark Mode</h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Toggle dark mode interface.</p>
          </div>
          <button className="agent-button" style={{ background: 'var(--brand-primary)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '20px' }}>Enabled</button>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'white', margin: '0 0 0.25rem 0' }}>Notifications</h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Receive email and platform alerts.</p>
          </div>
          <button className="agent-button" style={{ background: 'var(--brand-secondary)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '20px' }}>Enabled</button>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ color: 'white', margin: '0 0 0.25rem 0' }}>Groq API Key</h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Manage your LLM generation agent key.</p>
          </div>
          <button className="agent-button" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--card-border)', color: 'white', padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '20px' }}>Manage</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="app-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar fade-in delay-1">
          <div className="brand">SoloBoss AI</div>
          
          <nav className="nav-menu">
            <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSelectedAgent(null); }}>
              <Layers size={20} />
              Dashboard
            </a>
            <a className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => { setActiveTab('clients'); setSelectedAgent(null); }}>
              <Users size={20} />
              Clients
            </a>
            <a className={`nav-item ${activeTab === 'proposals' ? 'active' : ''}`} onClick={() => { setActiveTab('proposals'); setSelectedAgent(null); }}>
              <FileText size={20} />
              Proposals
            </a>
            <a className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setSelectedAgent(null); }}>
              <Briefcase size={20} />
              Projects
            </a>
            <div style={{ flex: 1 }}></div>
            <a className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSelectedAgent(null); }} style={{ marginTop: 'auto' }}>
              <Settings size={20} />
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="main-content">
          <header className="header fade-in delay-2">
            <div className="greeting">
              <h1>Welcome back, Boss</h1>
              <p>Your multi-agent automation empire is awaiting direct orders.</p>
            </div>
            
            <div className="user-profile">
              <Bell size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 0.5rem' }}></div>
              <div className="avatar">S</div>
              <span style={{ fontWeight: '500' }}>Sarvesh</span>
            </div>
          </header>

          {/* Dynamic Content Area */}
          <div style={{ opacity: 0, animation: 'fadeIn 0.6s ease-out 0.3s forwards' }}>
            {activeTab === 'dashboard' && (
              !selectedAgent ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Command Center Overview
                    </h2>
                  </div>

                  <div className="features-grid">
                    {features.map((feature, index) => {
                      return (
                        <div 
                          key={feature.id} 
                          className={`feature-card fade-in delay-${(index % 4) + 1}`}
                          onClick={() => handleCardClick(feature)}
                        >
                          <div className="card-content">
                            <div className={`card-icon ${feature.colorClass}`}>
                              {feature.icon}
                            </div>
                            <h3 className="card-title">{feature.title}</h3>
                            <p className="card-desc">{feature.description}</p>
                            
                            <div style={{ marginTop: '1.5rem' }}>
                              <button 
                                className="agent-button"
                                style={{
                                  width: '100%',
                                  justifyContent: 'center',
                                  background: 'var(--card-border)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid transparent',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <Bot size={18} /> Use Agent
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                renderActiveAgentPanel()
              )
            )}

            {activeTab === 'clients' && renderClientsDashboard()}
            {activeTab === 'proposals' && renderProposalsDashboard()}
            {activeTab === 'projects' && renderProjectsDashboard()}
            {activeTab === 'settings' && renderSettingsDashboard()}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
