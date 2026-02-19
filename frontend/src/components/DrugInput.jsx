import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ALL_DRUGS = [
    { name: 'Codeine', gene: 'CYP2D6', category: 'Analgesic (Opioid)' },
    { name: 'Warfarin', gene: 'CYP2C9', category: 'Anticoagulant' },
    { name: 'Clopidogrel', gene: 'CYP2C19', category: 'Antiplatelet' },
    { name: 'Simvastatin', gene: 'SLCO1B1', category: 'Statin (Lipid-lowering)' },
    { name: 'Azathioprine', gene: 'TPMT', category: 'Immunosuppressant' },
    { name: 'Fluorouracil', gene: 'DPYD', category: 'Antineoplastic' },
];

export default function DrugInput({ selectedDrugs, onDrugsChange }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    // Update dropdown position when opened or window resized
    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (open) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [open]);

    // Click outside handler
    useEffect(() => {
        const handler = (e) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = ALL_DRUGS.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.gene.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase())
    );

    const toggle = (drugName) => {
        const newSelection = selectedDrugs.includes(drugName)
            ? selectedDrugs.filter(d => d !== drugName)
            : [...selectedDrugs, drugName];
        onDrugsChange(newSelection);
    };

    const clearSearch = () => {
        setSearch('');
    };

    const remove = (drugName) => {
        onDrugsChange(selectedDrugs.filter(d => d !== drugName));
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="drug-dropdown portal-dropdown"
            style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
            }}
        >
            <div className="drug-dropdown-header">
                <span>{search ? 'Search Results' : 'Suggested Drugs'}</span>
                <span className="count-badge">{filtered.length} visible</span>
            </div>
            <div className="drug-dropdown-scroll">
                {filtered.length === 0 ? (
                    <div className="drug-option-empty">
                        No matching drugs found matching "{search}"
                    </div>
                ) : (
                    filtered.map(drug => (
                        <div
                            key={drug.name}
                            className={`drug-option ${selectedDrugs.includes(drug.name) ? 'selected' : ''}`}
                            onClick={() => toggle(drug.name)}
                        >
                            <div className="drug-option-info">
                                <div className="drug-option-name">{drug.name}</div>
                                <div className="drug-option-meta">
                                    <span className="gene-tag">{drug.gene}</span>
                                    <span className="sep">•</span>
                                    <span>{drug.category}</span>
                                </div>
                            </div>
                            {selectedDrugs.includes(drug.name) && (
                                <span className="drug-option-check">✓ Selected</span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="drug-input-component">
            <div className="drug-input-wrapper" ref={containerRef}>
                <span className="drug-search-icon">🔍</span>
                <input
                    className="drug-search"
                    type="text"
                    placeholder="Search drugs by name, gene, or category..."
                    value={search}
                    onFocus={() => setOpen(true)}
                    onChange={e => { setSearch(e.target.value); setOpen(true); }}
                />
                {search && (
                    <button className="search-clear-btn" onClick={clearSearch}>✕</button>
                )}

                {open && createPortal(dropdownContent, document.body)}
            </div>

            {selectedDrugs.length > 0 && (
                <div className="drug-chips">
                    {selectedDrugs.map(drug => (
                        <span key={drug} className="drug-chip">
                            <span className="chip-text">{drug}</span>
                            <button className="chip-remove" onClick={() => remove(drug)}>✕</button>
                        </span>
                    ))}
                    <button className="clear-all-btn" onClick={() => onDrugsChange([])}>
                        Clear All ({selectedDrugs.length})
                    </button>
                </div>
            )}
        </div>
    );
}
