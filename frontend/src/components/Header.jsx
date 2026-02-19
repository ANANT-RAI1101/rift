export default function Header() {
    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-brand">
                    <div className="header-logo">🧬</div>
                    <div>
                        <div className="header-title">PharmaGuard</div>
                        <div className="header-subtitle">Pharmacogenomic Risk Prediction</div>
                    </div>
                </div>
                <div className="header-badge">
                    <span className="dot"></span>
                    AI-Powered Analysis
                </div>
            </div>
        </header>
    );
}
