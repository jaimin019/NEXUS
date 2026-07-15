import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-nexus-400 to-nexus-600 bg-clip-text text-5xl font-extrabold text-transparent">
          NEXUS
        </h1>
        <p className="mt-3 text-lg text-surface-200">
          AI-powered Industrial Knowledge Intelligence Platform
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
