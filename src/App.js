// cloudplus_mock_exam/src/App.jsx
import React, { useState, useEffect } from 'react';
import questions from './questions.json';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const getRandomQuestions = (data, count = 50) => {
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q) => ({
    ...q,
    randomizedOptions: Object.entries(q.options)
      .sort(() => 0.5 - Math.random())
      .reduce((acc, [key, val]) => {
        acc[key] = val;
        return acc;
      }, {})
  }));
};

const App = () => {
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [view, setView] = useState('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(70 * 60);
  const [darkMode, setDarkMode] = useState(false);

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
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (view === 'exam' && timeLeft === 0 && !submitted) {
      if (window.confirm("Time is up! Auto-submitting your answers.")) {
        handleSubmit();
      }
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
    setTimeLeft(70 * 60);
    setView('exam');
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
        return acc + (Array.isArray(user) && correct.sort().join() === user.sort().join() ? 1 : 0);
      } else {
        return acc + (user === correct ? 1 : 0);
      }
    }, 0);
    const updatedHistory = [...scoreHistory, score];
    setScoreHistory(updatedHistory);
    localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));
    setView('results');
  };

const renderHome = () => (
  <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center py-4">
    {/* Logo di atas tajuk */}
    <img
      src="/comptia-logo.svg"
      alt="CompTIA"
      style={{ height: '48px' }}
      className="mb-2"
    />

    {/* Tajuk + toggle dark mode */}
    <div className="mb-4 d-flex flex-wrap justify-content-center align-items-center gap-3">
      <h1 className="fw-bold m-0">Mock Cloud+ Exam</h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: '40px', height: '40px' }}
        title="Toggle Dark Mode"
      >
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
    </div>

    {/* Start button */}
    <div className="text-center mt-2">
      <button onClick={startExam} className="btn btn-primary btn-lg">Ready? Start Test</button>
    </div>

    {/* History (masih centered) */}
    <div className="mt-5" style={{ maxWidth: 720 }}>
      <h2 className="fw-bold">History</h2>
      {scoreHistory.length === 0 ? (
        <p>No attempts yet.</p>
      ) : (
        <>
          <ul className="list-unstyled">
            {scoreHistory.map((s, i) => (
              <li key={i}>Take {i + 1}: {s}/50</li>
            ))}
          </ul>
          <button
            className="btn btn-danger"
            onClick={() => {
              localStorage.removeItem('scoreHistory');
              setScoreHistory([]);
            }}
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
        <h1>Mock Cloud+ Exam</h1>
        <p className="fw-bold">Time Left: {formatTime(timeLeft)}</p>
        {renderProgress()}
        <div key={q.id} className="mb-4">
          <p><strong>
            {currentIndex + 1}.{' '}
            {q.question.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </strong></p>
          {q.image && <img src={`/images/${q.image}`} alt={`Question ${q.id}`} className="img-fluid my-3" />}
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
      const isCorrect = Array.isArray(correct)
        ? Array.isArray(user) && correct.sort().join() === user.sort().join()
        : user === correct;
      return acc + (isCorrect ? 1 : 0);
    }, 0);

    return (
      <div className="container py-4">
        <h2>Results</h2>
        <p className="fs-4 fw-bold">You got {score} out of {sessionQuestions.length} correct.</p>
        {sessionQuestions.map((q, index) => {
          const correct = q.answer;
          const user = answers[q.id];
          const isCorrect = Array.isArray(correct)
            ? Array.isArray(user) && correct.sort().join() === user.sort().join()
            : user === correct;
          const getAnswerText = (letter) => q.options[letter] || '';
          return (
            <div key={q.id} className="mb-4">
              <p><strong>
                {index + 1}.{' '}
                {q.question.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </strong></p>
              {q.image && <img src={`/images/${q.image}`} alt={`Question ${q.id}`} className="img-fluid my-3" />}
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

  return (
    <>
      {view === 'home' && renderHome()}
      {view === 'exam' && renderExam()}
      {view === 'results' && renderResults()}
    </>
  );
};

export default App;
