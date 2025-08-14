// src/App.jsx
import React, { useState, useEffect } from 'react';
import questions from './questions.json';
import notesData from './notes.json';          // NEW
import simulations from './simulation.json';   // NEW
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const getRandomQuestions = (data, count = 50) => {
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q) => ({
    ...q,
    randomizedOptions: Object.entries(q.options)
      .sort(() => 0.5 - Math.random())
      .reduce((acc, [key, val]) => { acc[key] = val; return acc; }, {})
  }));
};

const App = () => {
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [view, setView] = useState('home'); // 'home' | 'exam' | 'results' | 'notes' | 'simulation'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 1h30m
  const [darkMode, setDarkMode] = useState(false);

  // Sidebar + selections
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(notesData?.[0]?.id ?? null);
  const [activeSimId, setActiveSimId] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('scoreHistory') || '[]');
    setScoreHistory(history);
  }, []);

  useEffect(() => {
    if (view === 'exam' && timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => {
        if (timeLeft === 300) new Audio('/alert.mp3').play();
        setTimeLeft((t) => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (view === 'exam' && timeLeft === 0 && !submitted) {
      if (window.confirm('Time is up! Auto-submitting your answers.')) handleSubmit();
    }
  }, [view, timeLeft, submitted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    const randomQuestions = getRandomQuestions(questions);
    setSessionQuestions(randomQuestions);
    setAnswers({});
    setVisited({});
    setSubmitted(false);
    setCurrentIndex(0);
    setTimeLeft(90 * 60);
    setView('exam');
    setSidebarOpen(false);
  };

  const handleOptionChange = (qid, option, isMulti) => {
    if (isMulti) {
      const current = answers[qid] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      setAnswers({ ...answers, [qid]: updated });
    } else {
      setAnswers({ ...answers, [qid]: option });
    }
  };

  const handleNext = () => {
    setVisited({ ...visited, [sessionQuestions[currentIndex].id]: true });
    setCurrentIndex((prev) => Math.min(prev + 1, sessionQuestions.length - 1));
  };

  const handlePrev = () => {
    setVisited({ ...visited, [sessionQuestions[currentIndex].id]: true });
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = sessionQuestions.reduce((acc, q) => {
      const correct = q.answer;
      const user = answers[q.id];
      if (Array.isArray(correct)) {
        return acc + (Array.isArray(user) && correct.slice().sort().join() === user.slice().sort().join() ? 1 : 0);
      } else {
        return acc + (user === correct ? 1 : 0);
      }
    }, 0);
    const updatedHistory = [...scoreHistory, score];
    setScoreHistory(updatedHistory);
    localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));
    setView('results');
    setSidebarOpen(false);
  };

  // Sidebar actions
  const openNotes = () => {
    if (!selectedNoteId && notesData?.length) setSelectedNoteId(notesData[0].id);
    setView('notes');
    setSidebarOpen(false);
  };
  const openSimulation = (simId) => {
    setActiveSimId(simId);
    setView('simulation');
    setSidebarOpen(false);
  };

  // ---- Views ----
  const renderHome = () => (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center py-4">
      <img src="/comptia-logo.svg" alt="CompTIA" style={{ height: '48px' }} className="mb-2" />
      <div className="mb-4 d-flex flex-wrap justify-content-center align-items-center gap-3">
        <h1 className="fw-bold m-0">Mock Cloud+ Exam</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 40, height: 40 }}
          title="Toggle Dark Mode"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <div className="text-center mt-2 d-flex gap-2">
        <button onClick={startExam} className="btn btn-primary btn-lg">Ready? Start Test</button>
        <button className="btn btn-outline-secondary btn-lg" onClick={() => setSidebarOpen(true)}>☰ Resources</button>
      </div>

      <div className="mt-5" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold">History</h2>
        {scoreHistory.length === 0 ? (
          <p>No attempts yet.</p>
        ) : (
          <>
            <ul className="list-unstyled">
              {scoreHistory.map((s, i) => <li key={i}>Take {i + 1}: {s}/50</li>)}
            </ul>
            <button
              className="btn btn-danger"
              onClick={() => { localStorage.removeItem('scoreHistory'); setScoreHistory([]); }}
            >
              Reset History
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {sessionQuestions.map((q, idx) => {
        const answered = answers[q.id];
        const seen = visited[q.id];
        const symbol = answered ? '✔' : seen ? '✖' : '□';
        return (
          <span
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className="btn btn-outline-secondary btn-sm"
            style={{ backgroundColor: idx === currentIndex ? '#dee2e6' : '' }}
          >
            {idx + 1} {symbol}
          </span>
        );
      })}
    </div>
  );

  const renderExam = () => {
    const q = sessionQuestions[currentIndex];
    const isMulti = Array.isArray(q.answer);
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h1 className="m-0">Mock Cloud+ Exam</h1>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary" onClick={() => setSidebarOpen(true)} title="Open resources">
              ☰ Resources
            </button>
            <span className="fw-bold">Time Left: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {renderProgress()}

        <div key={q.id} className="mb-4">
          <p><strong>
            {currentIndex + 1}.{' '}
            {q.question.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
          </strong></p>

          {q.image && (
            <img
              src={`${process.env.PUBLIC_URL}/images/${q.image}`}
              alt={`Question ${q.id}`}
              className="img-fluid my-3"
              onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/images/placeholder.png`; }}
            />
          )}

          {Object.entries(q.randomizedOptions).map(([key, value]) => (
            <div key={key} className="form-check ms-3">
              <input
                className="form-check-input"
                type={isMulti ? 'checkbox' : 'radio'}
                name={`q_${q.id}`}
                value={key}
                checked={isMulti ? (answers[q.id] || []).includes(key) : answers[q.id] === key}
                onChange={() => handleOptionChange(q.id, key, isMulti)}
              />
              <label className="form-check-label">{key}. {value}</label>
            </div>
          ))}
        </div>

        <div>
          <button className="btn btn-secondary me-2" onClick={handlePrev} disabled={currentIndex === 0}>Previous</button>
          <button className="btn btn-secondary" onClick={handleNext} disabled={currentIndex === sessionQuestions.length - 1}>Next</button>
        </div>

        {currentIndex === sessionQuestions.length - 1 && (
          <div className="mt-4">
            <button className="btn btn-success" onClick={handleSubmit} disabled={submitted}>Submit</button>
            {submitted && <p className="text-success mt-3">Exam submitted. Good luck!</p>}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const score = sessionQuestions.reduce((acc, q) => {
      const correct = q.answer;
      const user = answers[q.id];
      const ok = Array.isArray(correct)
        ? Array.isArray(user) && correct.slice().sort().join() === user.slice().sort().join()
        : user === correct;
      return acc + (ok ? 1 : 0);
    }, 0);

    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h2 className="m-0">Results</h2>
          <button className="btn btn-outline-secondary" onClick={() => setSidebarOpen(true)}>☰ Resources</button>
        </div>

        <p className="fs-4 fw-bold">You got {score} out of {sessionQuestions.length} correct.</p>

        {sessionQuestions.map((q, index) => {
          const correct = q.answer;
          const user = answers[q.id];
          const isCorrect = Array.isArray(correct)
            ? Array.isArray(user) && correct.slice().sort().join() === user.slice().sort().join()
            : user === correct;
          const getAnswerText = (letter) => q.options[letter] || '';
          return (
            <div key={q.id} className="mb-4">
              <p><strong>
                {index + 1}.{' '}
                {q.question.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
              </strong></p>

              {q.image && (
                <img
                  src={`${process.env.PUBLIC_URL}/images/${q.image}`}
                  alt={`Question ${q.id}`}
                  className="img-fluid my-3"
                  onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/images/placeholder.png`; }}
                />
              )}

              <p className={isCorrect ? 'text-success' : 'text-danger'}>
                Your Answer: {Array.isArray(user) ? user.map(getAnswerText).join(', ') : getAnswerText(user) || 'None'}<br />
                Correct: {Array.isArray(correct) ? correct.map(getAnswerText).join(', ') : getAnswerText(correct) || 'N/A'}
              </p>
              {q.explanation && <p><em>Explanation: {q.explanation}</em></p>}
            </div>
          );
        })}

        <button className="btn btn-primary mt-4" onClick={() => setView('home')}>Back to Home</button>
      </div>
    );
  };

  const renderNotes = () => {
    const selected = notesData.find((n) => n.id === selectedNoteId) || null;
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h1 className="m-0">Cloud+ Notes</h1>
          <button className="btn btn-outline-secondary" onClick={() => setSidebarOpen(true)}>☰ Resources</button>
        </div>

        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="list-group">
              {notesData.map((n) => (
                <button
                  key={n.id}
                  className={`list-group-item list-group-item-action ${selectedNoteId === n.id ? 'active' : ''}`}
                  onClick={() => setSelectedNoteId(n.id)}
                >
                  {n.title}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-9">
            {!selected ? (
              <p className="text-muted">Select a note from the list.</p>
            ) : (
              <div>
                <h3 className="fw-bold">{selected.title}</h3>
                {Array.isArray(selected.content) ? (
                  <ul>{selected.content.map((item, i) => <li key={i}>{item}</li>)}</ul>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selected.content}</p>
                )}
                {selected.image && (
                  <img
                    className="img-fluid mt-3"
                    src={`${process.env.PUBLIC_URL}/images/${selected.image}`}
                    alt={selected.title}
                  />
                )}
              </div>
            )}
            <div className="mt-4">
              <button className="btn btn-secondary me-2" onClick={() => setView('home')}>Back to Home</button>
              {sessionQuestions.length > 0 && !submitted && (
                <button className="btn btn-outline-primary" onClick={() => setView('exam')}>Back to Exam</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSimulation = () => {
    const sim = simulations.find((s) => s.id === activeSimId) || null;
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h1 className="m-0">{sim?.label || (sim ? `Simulation Q${sim.id}` : 'Simulation')}</h1>
          <button className="btn btn-outline-secondary" onClick={() => setSidebarOpen(true)}>☰ Resources</button>
        </div>

        {!sim ? (
          <p className="text-muted">Choose a simulation from the sidebar.</p>
        ) : (
          <div>
            {sim.instructions && (
              <div className="mb-3">
                {Array.isArray(sim.instructions) ? (
                  <ol>{sim.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{sim.instructions}</p>
                )}
              </div>
            )}

            {sim.question && (
              <>
                <p className="fw-bold">{sim.question}</p>
                {sim.image && (
                  <img
                    src={`${process.env.PUBLIC_URL}/images/${sim.image}`}
                    alt={sim.label || `Q${sim.id}`}
                    className="img-fluid my-3"
                    onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/images/placeholder.png`; }}
                  />
                )}
                {sim.options && (
                  <div className="ms-3">
                    {Object.entries(sim.options).map(([k, v]) => (
                      <div className="form-check" key={k}>
                        <input className="form-check-input" type="radio" name={`sim_${sim.id}`} id={`sim_${sim.id}_${k}`} />
                        <label className="form-check-label" htmlFor={`sim_${sim.id}_${k}`}>{k}. {v}</label>
                      </div>
                    ))}
                  </div>
                )}
                {sim.answer && (
                  <div className="alert alert-info mt-3">
                    <strong>Answer:</strong>{' '}
                    {Array.isArray(sim.answer) ? sim.answer.join(', ') : sim.answer}
                    {sim.explanation && <><br /><em>{sim.explanation}</em></>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-secondary me-2" onClick={() => setView('home')}>Back to Home</button>
          {sessionQuestions.length > 0 && !submitted && (
            <button className="btn btn-outline-primary" onClick={() => setView('exam')}>Back to Exam</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Fixed, slide-in sidebar overlay */}
      <div className={`cp-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="m-0">Resources</h5>
          <button className="btn btn-sm btn-light" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="mb-3">
          <button className="btn btn-outline-primary w-100" onClick={openNotes}>Notes</button>
        </div>

        <div>
          <div className="text-uppercase small text-muted fw-bold mb-2">Simulation</div>
          <ul className="list-unstyled">
            {simulations.map((sim) => (
              <li key={sim.id} className="mb-1">
                <button className="btn btn-link p-0" onClick={() => openSimulation(sim.id)}>
                  {sim.label || `Q${sim.id}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {sidebarOpen && <div className="cp-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Views */}
      {view === 'home' && renderHome()}
      {view === 'exam' && renderExam()}
      {view === 'results' && renderResults()}
      {view === 'notes' && renderNotes()}
      {view === 'simulation' && renderSimulation()}
    </>
  );
};

export default App;
