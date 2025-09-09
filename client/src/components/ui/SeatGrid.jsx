import { useMemo } from 'react';

const SeatGrid = ({ seats, selectedSeat, onSeatSelect, lockedByMe }) => {
  // Group seats by row (e.g. A, B, C)
  const rows = useMemo(() => {
    const grouped = {};
    seats.forEach((seat) => {
      const row = seat.seatNumber.charAt(0);
      if (!grouped[row]) {
        grouped[row] = [];
      }
      grouped[row].push(seat);
    });

    return Object.keys(grouped).sort().map((rowName) => ({
      name: rowName,
      seats: grouped[rowName].sort((a, b) => {
        const numA = parseInt(a.seatNumber.slice(1), 10);
        const numB = parseInt(b.seatNumber.slice(1), 10);
        return numA - numB;
      }),
    }));
  }, [seats]);

  if (!seats || seats.length === 0) {
    return <div className="text-gray-500 text-sm">No seats available.</div>;
  }

  const getSeatStyles = (seat) => {
    if (seat.status === 'BOOKED') {
      return 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800 shadow-inner';
    }
    if (seat.status === 'LOCKED') {
      if (seat.lockedBy === lockedByMe) {
        // My locked seat behaves visually like a SELECTED seat
        return 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900 border-none';
      }
      // Someone else's lock: striped/dashed pattern
      return 'bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.1)_4px,rgba(148,163,184,0.1)_8px)] bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed border-2 border-dashed border-slate-200 dark:border-slate-700';
    }
    if (selectedSeat === seat._id) {
      // Currently selected by me (not locked yet)
      return 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900 border-none';
    }
    // AVAILABLE
    return 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-sm hover:scale-[1.04] cursor-pointer shadow-sm';
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
      <div className="flex justify-center mb-10">
        <div className="w-4/5 max-w-md h-10 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-b-3xl rounded-t-sm flex items-center justify-center text-sm font-black tracking-widest text-slate-400 dark:text-slate-500 shadow-inner border-b-2 border-slate-300 dark:border-slate-700">
          STAGE
        </div>
      </div>
      
      <div className="flex flex-col gap-5 items-center min-w-max">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-6">
            <div className="w-6 text-center font-bold text-slate-400 dark:text-slate-500">
              {row.name}
            </div>
            <div className="flex gap-3">
              {row.seats.map((seat) => (
                <button
                  key={seat._id}
                  disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && seat.lockedBy !== lockedByMe)}
                  onClick={() => onSeatSelect(seat)}
                  className={`w-11 h-11 rounded-t-xl rounded-b-md flex items-center justify-center text-xs font-bold transition-all duration-300 ${getSeatStyles(seat)}`}
                  title={`Seat ${seat.seatNumber} - ${seat.status}`}
                >
                  {seat.seatNumber.slice(1)}
                </button>
              ))}
            </div>
            <div className="w-6 text-center font-bold text-slate-400 dark:text-slate-500">
              {row.name}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm font-semibold">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600" />
          <span className="text-slate-600 dark:text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-primary-600 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900" />
          <span className="text-slate-600 dark:text-slate-300">Selected</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.2)_4px,rgba(148,163,184,0.2)_8px)] bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700" />
          <span className="text-slate-600 dark:text-slate-300">Locked</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
          <span className="text-slate-600 dark:text-slate-300">Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
