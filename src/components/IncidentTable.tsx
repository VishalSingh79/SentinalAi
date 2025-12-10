import React, { useMemo } from 'react';
import {  Severity } from '../../types';
import { Download, Copy, AlertTriangle, Info, Zap, Filter, ChevronRight } from 'lucide-react';

export interface FilterState {
  [Severity.LOW]: boolean;
  [Severity.MEDIUM]: boolean;
  [Severity.HIGH]: boolean;
}

export interface Incident {
  id: string;
  timestamp: string;
  seconds: number;
  severity: Severity;
  description: string;
}

interface IncidentTableProps {
  incidents: Incident[];
  currentTime: number;
  onIncidentClick: (seconds: number) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  currentTime,
  onIncidentClick,
  filters,
  onFilterChange
}) => {
  
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => filters[inc.severity]).sort((a, b) => a.seconds - b.seconds);
  }, [incidents, filters]);

  const activeIncidentId = useMemo(() => {
    return incidents.find(inc => Math.abs(currentTime - inc.seconds) < 3)?.id;
  }, [currentTime, incidents]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Description'];
    const rows = filteredIncidents.map(inc => [inc.timestamp, inc.severity, `"${inc.description}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'surveillance_report.csv';
    link.click();
  };

  const handleCopy = () => {
    const text = filteredIncidents.map(inc => `[${inc.timestamp}] ${inc.severity}: ${inc.description}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case Severity.HIGH: return {
        icon: <AlertTriangle size={14} />,
        bg: 'bg-red-50 text-red-600 border-red-100',
        dot: 'bg-red-500'
      };
      case Severity.MEDIUM: return {
        icon: <Zap size={14} />,
        bg: 'bg-amber-50 text-amber-600 border-amber-100',
        dot: 'bg-amber-500'
      };
      case Severity.LOW: return {
        icon: <Info size={14} />,
        bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        dot: 'bg-emerald-500'
      };
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 space-y-4 bg-white/40">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Detected Incidents</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Timeline analysis results</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="p-2.5 rounded-xl bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-400 transition-colors border border-slate-200 shadow-sm">
              <Copy size={16} />
            </button>
            <button onClick={handleExportCSV} className="p-2.5 rounded-xl bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-400 transition-colors border border-slate-200 shadow-sm">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
            <Filter size={12} /> Filter by Severity
          </div>
          {(Object.keys(filters) as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => onFilterChange({ ...filters, [sev]: !filters[sev] })}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                ${filters[sev] 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-100' 
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}
              `}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
             <p className="text-sm font-medium">No incidents match your filters.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const style = getSeverityStyles(incident.severity);
            const isActive = activeIncidentId === incident.id;
            
            return (
              <div
                key={incident.id}
                onClick={() => onIncidentClick(incident.seconds)}
                className={`
                  relative group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 border
                  ${isActive 
                    ? 'bg-white border-blue-200 shadow-[0_8px_30px_rgba(59,130,246,0.1)] translate-x-1' 
                    : 'bg-white/40 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-sm'}
                `}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r-full" />
                )}

                {/* Time */}
                <div className="flex flex-col items-center min-w-[3.5rem] pt-0.5">
                  <span className={`font-mono font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {incident.timestamp}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${style.bg}`}>
                      {style.icon} {incident.severity}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isActive ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {incident.description}
                  </p>
                </div>

                {/* Chevron */}
                <div className={`self-center text-slate-300 transition-transform duration-300 ${isActive ? 'text-blue-500 translate-x-1' : 'group-hover:text-slate-400 group-hover:translate-x-1'}`}>
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IncidentTable;