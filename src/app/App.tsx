export function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#main" aria-label="Advising Pairing home">
          Advising Pairing
        </a>
      </header>

      <main id="main">
        <section className="page-header" aria-labelledby="page-title">
          <h1 id="page-title">Semesters</h1>
        </section>

        <section className="empty-state" aria-label="Semester list">
          <p>No semesters have been created.</p>
        </section>
      </main>
    </div>
  )
}
