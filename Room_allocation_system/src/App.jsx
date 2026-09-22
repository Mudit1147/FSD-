import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

/* =========================================================================
   1. LOCAL JS DATABASE LAYER (localStorage-backed)
   ========================================================================= */

const STORAGE_KEY = 'crms_db_v1';

const CAPACITY_NUMBER = { Single: 1, Double: 2, Triple: 3 };

const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil Engineering',
  'Mathematics',
  'Physics',
];

const BLOCKS_SEED = [
  { id: 'block-a', name: 'Block A (Boys)', gender: 'Male', description: 'Boys hostel — 3 floors' },
  { id: 'block-b', name: 'Block B (Girls)', gender: 'Female', description: 'Girls hostel — 3 floors' },
  { id: 'block-c', name: 'Block C (PG)', gender: 'Any', description: 'Postgraduate co-ed block' },
];

function buildRooms(blocks) {
  const capacityCycle = ['Single', 'Double', 'Triple'];
  const acCycle = ['AC', 'Non-AC'];
  const rooms = [];
  let globalIndex = 0;

  blocks.forEach((block) => {
    for (let floor = 1; floor <= 3; floor += 1) {
      for (let unit = 1; unit <= 5; unit += 1) {
        const roomNumber = `${floor}${String(unit).padStart(2, '0')}`;
        const capacityType = capacityCycle[globalIndex % capacityCycle.length];
        const acType = acCycle[globalIndex % acCycle.length];
        const maintenance = globalIndex % 9 === 4;
        rooms.push({
          id: `room-${block.id}-${roomNumber}`,
          blockId: block.id,
          roomNumber,
          floor,
          capacityType,
          acType,
          maintenance,
          occupantIds: [],
        });
        globalIndex += 1;
      }
    }
  });

  return rooms;
}

function buildStudents() {
  const roster = [
    ['Aarav Sharma', 'Male'],
    ['Vivaan Gupta', 'Male'],
    ['Aditya Verma', 'Male'],
    ['Ishaan Patel', 'Male'],
    ['Kabir Singh', 'Male'],
    ['Reyansh Nair', 'Male'],
    ['Ananya Iyer', 'Female'],
    ['Diya Menon', 'Female'],
    ['Saanvi Rao', 'Female'],
    ['Myra Kapoor', 'Female'],
    ['Aadhya Joshi', 'Female'],
    ['Kiara Desai', 'Female'],
    ['Arjun Malhotra', 'Male'],
    ['Rohan Chatterjee', 'Male'],
    ['Sneha Bansal', 'Female'],
    ['Priya Chawla', 'Female'],
    ['Rahul Mehta', 'Male'],
    ['Neha Kulkarni', 'Female'],
    ['Devansh Agarwal', 'Male'],
    ['Tanvi Bhatt', 'Female'],
    ['Karthik Reddy', 'Male'],
    ['Ritika Sinha', 'Female'],
    ['Manav Trivedi', 'Male'],
    ['Pooja Yadav', 'Female'],
  ];

  return roster.map(([name, gender], index) => ({
    id: `student-${index + 1}`,
    rollNumber: `CU${String(23 - (index % 3)).padStart(2, '0')}${String(index + 1).padStart(3, '0')}`,
    name,
    department: DEPARTMENTS[index % DEPARTMENTS.length],
    year: (index % 4) + 1,
    gender,
    contact: `9${String(700000000 + index * 137).slice(0, 9)}`,
    allocatedRoomId: null,
  }));
}

function genderMatches(blockGender, studentGender) {
  return blockGender === 'Any' || blockGender === studentGender;
}

function buildAllocations(blocks, rooms, students) {
  const blockGenderById = Object.fromEntries(blocks.map((b) => [b.id, b.gender]));
  const roomsCopy = rooms.map((r) => ({ ...r, occupantIds: [...r.occupantIds] }));
  const studentsCopy = students.map((s) => ({ ...s }));
  const allocations = [];
  const today = new Date();
  const queue = [...studentsCopy];

  let seededRooms = 0;

  roomsCopy.forEach((room) => {
    if (room.maintenance || seededRooms >= 14) return;

    const blockGender = blockGenderById[room.blockId];
    const capacity = CAPACITY_NUMBER[room.capacityType];
    const targetOccupancy = room.capacityType === 'Single' ? 1 : capacity - 1;
    let filled = 0;

    for (let i = 0; i < targetOccupancy; i += 1) {
      const candidateIndex = queue.findIndex(
        (s) => !s.allocatedRoomId && genderMatches(blockGender, s.gender)
      );
      if (candidateIndex === -1) break;

      const [candidate] = queue.splice(candidateIndex, 1);
      const studentRecord = studentsCopy.find((s) => s.id === candidate.id);
      const allocationDate = new Date(today);
      allocationDate.setDate(today.getDate() - (seededRooms * 3 + i));

      allocations.push({
        id: `alloc-${allocations.length + 1}`,
        studentId: studentRecord.id,
        roomId: room.id,
        allocationDate: allocationDate.toISOString().slice(0, 10),
        status: 'Active',
      });

      room.occupantIds.push(studentRecord.id);
      studentRecord.allocatedRoomId = room.id;
      filled += 1;
    }

    if (filled > 0) seededRooms += 1;
  });

  return { allocations, rooms: roomsCopy, students: studentsCopy };
}

function seedDatabase() {
  const blocks = BLOCKS_SEED;
  const rooms = buildRooms(blocks);
  const students = buildStudents();
  const { allocations, rooms: seededRooms, students: seededStudents } = buildAllocations(
    blocks,
    rooms,
    students
  );
  return { blocks, rooms: seededRooms, students: seededStudents, allocations };
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.blocks && parsed.rooms && parsed.students && parsed.allocations) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Local database could not be read — reseeding.', err);
  }
  const seeded = seedDatabase();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (err) {
    console.warn('Local database could not be persisted.', err);
  }
  return seeded;
}

function persistDatabase(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('Local database could not be persisted.', err);
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/* =========================================================================
   2. DOMAIN HELPERS
   ========================================================================= */

function computeRoomStatus(room) {
  if (room.maintenance) return 'Maintenance';
  const capacity = CAPACITY_NUMBER[room.capacityType];
  return room.occupantIds.length >= capacity ? 'Occupied' : 'Available';
}

function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(`${isoString}T00:00:00`);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function validateAllocation(db, { studentId, roomId, excludeAllocationId = null }) {
  const student = db.students.find((s) => s.id === studentId);
  const room = db.rooms.find((r) => r.id === roomId);

  if (!student) return { valid: false, message: 'Select a student to continue.' };
  if (!room) return { valid: false, message: 'Select a room to continue.' };

  if (room.maintenance) {
    return { valid: false, message: `Room ${room.roomNumber} is under maintenance and cannot be allocated.` };
  }

  const block = db.blocks.find((b) => b.id === room.blockId);
  if (!genderMatches(block.gender, student.gender)) {
    const restriction = block.gender === 'Any' ? 'any gender' : `${block.gender} students`;
    return { valid: false, message: `${block.name} is reserved for ${restriction} only.` };
  }

  const capacity = CAPACITY_NUMBER[room.capacityType];
  if (room.occupantIds.length >= capacity) {
    return { valid: false, message: `Room ${room.roomNumber} has reached its ${room.capacityType.toLowerCase()}-occupancy limit.` };
  }

  const duplicate = db.allocations.find(
    (a) => a.studentId === studentId && a.status === 'Active' && a.id !== excludeAllocationId
  );
  if (duplicate) {
    return { valid: false, message: `${student.name} already has an active room allocation. Use Reassign instead.` };
  }

  return { valid: true, message: '' };
}

/* =========================================================================
   3. ICONS (inline SVG, no external assets)
   ========================================================================= */

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3.5" cy="6" r="1" />
    <circle cx="3.5" cy="12" r="1" />
    <circle cx="3.5" cy="18" r="1" />
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/* =========================================================================
   4. SMALL PRESENTATIONAL COMPONENTS
   ========================================================================= */

function StatusBadge({ status }) {
  const map = {
    Available: 'badge--success',
    Active: 'badge--success',
    Occupied: 'badge--danger',
    Maintenance: 'badge--neutral',
    Deallocated: 'badge--neutral',
    Pending: 'badge--warning',
  };
  return <span className={`badge ${map[status] || 'badge--neutral'}`}>{status}</span>;
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast toast--${toast.type}`}>
      <div>
        <div className="toast__title">{toast.title}</div>
        <div className="toast__message">{toast.message}</div>
      </div>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, footer, size }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size ? `modal--${size}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
            <IconClose />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, tone, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-secondary">{message}</p>
    </Modal>
  );
}

function StatCard({ icon, iconVariant, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${iconVariant}`}>{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. LAYOUT COMPONENTS
   ========================================================================= */

function Navbar({ title, sidebarCollapsed, onToggleSidebar, searchTerm, onSearchChange }) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button type="button" className="navbar__icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <IconMenu />
        </button>
        <span className="navbar__title">{title}</span>
        <div className="navbar__search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search students, rooms, roll numbers…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Global search"
          />
        </div>
      </div>
      <div className="navbar__right">
        <button type="button" className="navbar__icon-btn" aria-label="Notifications">
          <IconBell />
          <span className="navbar__badge" />
        </button>
        <div className="navbar__avatar" title="Hostel Administrator">HA</div>
      </div>
    </header>
  );
}

function Sidebar({ activeView, onNavigate, collapsed }) {
  const links = [
    { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { key: 'rooms', label: 'Room Matrix', icon: <IconGrid /> },
    { key: 'allocations', label: 'Allocations', icon: <IconList /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">
          <IconDashboard />
        </span>
        {!collapsed && <span>Room Allocation</span>}
      </div>
      <nav className="sidebar__nav">
        {!collapsed && <div className="sidebar__section-label">Main</div>}
        {links.map((link) => (
          <div
            key={link.key}
            className={`sidebar__link ${activeView === link.key ? 'active' : ''}`}
            onClick={() => onNavigate(link.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(link.key); }}
          >
            {link.icon}
            {!collapsed && <span>{link.label}</span>}
          </div>
        ))}
      </nav>
      {!collapsed && <div className="sidebar__footer">College Room Allocation System v1.0</div>}
    </aside>
  );
}

/* =========================================================================
   6. DASHBOARD VIEW
   ========================================================================= */

function DashboardView({ db, onNavigate }) {
  const stats = useMemo(() => {
    const totalRooms = db.rooms.length;
    const occupiedRooms = db.rooms.filter((r) => computeRoomStatus(r) === 'Occupied').length;
    const availableRooms = db.rooms.filter((r) => computeRoomStatus(r) === 'Available').length;
    const vacancyRate = totalRooms === 0 ? 0 : Math.round((availableRooms / totalRooms) * 100);
    const totalStudents = db.students.length;
    return { totalRooms, occupiedRooms, vacancyRate, totalStudents };
  }, [db.rooms, db.students]);

  const blockBreakdown = useMemo(
    () =>
      db.blocks.map((block) => {
        const blockRooms = db.rooms.filter((r) => r.blockId === block.id);
        const occupied = blockRooms.filter((r) => computeRoomStatus(r) === 'Occupied').length;
        return { block, total: blockRooms.length, occupied };
      }),
    [db.blocks, db.rooms]
  );

  const recentAllocations = useMemo(
    () =>
      [...db.allocations]
        .filter((a) => a.status === 'Active')
        .sort((a, b) => new Date(b.allocationDate) - new Date(a.allocationDate))
        .slice(0, 5),
    [db.allocations]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard Overview</h1>
          <p className="page-header__subtitle">A snapshot of hostel occupancy across all blocks.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-secondary" onClick={() => onNavigate('rooms')}>
            View Room Matrix
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('allocations')}>
            <IconPlus /> New Allocation
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="🏠" iconVariant="total" value={stats.totalRooms} label="Total Rooms" />
        <StatCard icon="🔴" iconVariant="occupied" value={stats.occupiedRooms} label="Occupied Rooms" />
        <StatCard icon="🟢" iconVariant="vacant" value={`${stats.vacancyRate}%`} label="Vacancy Rate" />
        <StatCard icon="🎓" iconVariant="pending" value={stats.totalStudents} label="Total Students Managed" />
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2 className="panel__title">Block-wise Occupancy</h2>
        </div>
        <div className="panel__body">
          <div className="room-legend" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            {blockBreakdown.map(({ block, total, occupied }) => (
              <div className="chip" key={block.id}>
                {block.name}: {occupied}/{total} occupied
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2 className="panel__title">Recent Allocations</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('allocations')}>
            View all
          </button>
        </div>
        <div className="panel__body" style={{ paddingTop: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAllocations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-empty-state">No allocations recorded yet.</td>
                  </tr>
                )}
                {recentAllocations.map((allocation) => {
                  const student = db.students.find((s) => s.id === allocation.studentId);
                  const room = db.rooms.find((r) => r.id === allocation.roomId);
                  const block = room && db.blocks.find((b) => b.id === room.blockId);
                  return (
                    <tr key={allocation.id}>
                      <td>
                        <div className="data-table__student">
                          <div className="data-table__avatar">{student ? initials(student.name) : '—'}</div>
                          <div>
                            <div className="data-table__name">{student ? student.name : 'Unknown student'}</div>
                            <div className="data-table__subtext">{student ? student.rollNumber : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {room ? `${block.name.split(' (')[0]} · ${room.roomNumber}` : 'Unknown room'}
                      </td>
                      <td>{formatDate(allocation.allocationDate)}</td>
                      <td><StatusBadge status={allocation.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   7. ROOM MATRIX VIEW
   ========================================================================= */

function RoomMatrixView({ db, searchTerm, onSearchChange, onOpenAllocate, onOpenDetails }) {
  const [blockFilter, setBlockFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const availableFloors = useMemo(() => {
    if (blockFilter === 'All') return [1, 2, 3];
    const floors = db.rooms.filter((r) => r.blockId === blockFilter).map((r) => r.floor);
    return [...new Set(floors)].sort((a, b) => a - b);
  }, [db.rooms, blockFilter]);

  const filteredRooms = useMemo(() => {
    return db.rooms.filter((room) => {
      if (blockFilter !== 'All' && room.blockId !== blockFilter) return false;
      if (floorFilter !== 'All' && room.floor !== Number(floorFilter)) return false;
      const status = computeRoomStatus(room);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      if (searchTerm && !room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [db.rooms, blockFilter, floorFilter, statusFilter, searchTerm]);

  const roomsByBlock = useMemo(() => {
    const groups = {};
    filteredRooms.forEach((room) => {
      groups[room.blockId] = groups[room.blockId] || [];
      groups[room.blockId].push(room);
    });
    return groups;
  }, [filteredRooms]);

  const statusClassMap = {
    Available: 'room-cell--available',
    Occupied: 'room-cell--allocated',
    Maintenance: 'room-cell--maintenance',
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Interactive Room Matrix</h1>
          <p className="page-header__subtitle">Click any available room to start a new allocation.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-primary" onClick={() => onOpenAllocate(null)}>
            <IconPlus /> New Allocation
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__body">
          <div className="table-toolbar">
            <div className="table-toolbar__filters">
              <input
                type="text"
                className="search-input"
                placeholder="Search room number…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <select className="filter-select" value={blockFilter} onChange={(e) => { setBlockFilter(e.target.value); setFloorFilter('All'); }}>
                <option value="All">All Blocks</option>
                {db.blocks.map((block) => (
                  <option key={block.id} value={block.id}>{block.name}</option>
                ))}
              </select>
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="floor-tabs">
            <div className={`floor-tab ${floorFilter === 'All' ? 'active' : ''}`} onClick={() => setFloorFilter('All')}>
              All Floors
            </div>
            {availableFloors.map((floor) => (
              <div
                key={floor}
                className={`floor-tab ${floorFilter === String(floor) ? 'active' : ''}`}
                onClick={() => setFloorFilter(String(floor))}
              >
                Floor {floor}
              </div>
            ))}
          </div>

          {Object.keys(roomsByBlock).length === 0 && (
            <div className="table-empty-state">No rooms match the selected filters.</div>
          )}

          {Object.entries(roomsByBlock).map(([blockId, rooms]) => {
            const block = db.blocks.find((b) => b.id === blockId);
            return (
              <div key={blockId} style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  {block.name}
                </h3>
                <div className="room-grid">
                  {rooms.map((room) => {
                    const status = computeRoomStatus(room);
                    const capacity = CAPACITY_NUMBER[room.capacityType];
                    return (
                      <div
                        key={room.id}
                        className={`room-cell ${statusClassMap[status]}`}
                        onClick={() => (status === 'Available' ? onOpenAllocate(room.id) : onOpenDetails(room.id))}
                        role="button"
                        tabIndex={0}
                        title={`Room ${room.roomNumber} — ${status}`}
                      >
                        <span className="room-cell__dot" />
                        <span className="room-cell__number">{room.roomNumber}</span>
                        <span className="room-cell__meta">{room.occupantIds.length}/{capacity} · {room.acType}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="room-legend">
            <div className="room-legend__item">
              <span className="room-legend__swatch" style={{ background: 'var(--color-success)' }} /> Available
            </div>
            <div className="room-legend__item">
              <span className="room-legend__swatch" style={{ background: 'var(--color-danger)' }} /> Occupied
            </div>
            <div className="room-legend__item">
              <span className="room-legend__swatch" style={{ background: 'var(--color-text-muted)' }} /> Maintenance
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   8. ALLOCATIONS TABLE VIEW
   ========================================================================= */

const PAGE_SIZE = 8;

function AllocationsView({ db, searchTerm, onSearchChange, onOpenAllocate, onOpenReassign, onOpenDetails, onRequestDeallocate }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');
  const [page, setPage] = useState(1);

  const enrichedAllocations = useMemo(() => {
    return db.allocations.map((allocation) => {
      const student = db.students.find((s) => s.id === allocation.studentId);
      const room = db.rooms.find((r) => r.id === allocation.roomId);
      const block = room ? db.blocks.find((b) => b.id === room.blockId) : null;
      return { allocation, student, room, block };
    });
  }, [db.allocations, db.students, db.rooms, db.blocks]);

  const filtered = useMemo(() => {
    return enrichedAllocations.filter(({ allocation, student, room }) => {
      if (statusFilter !== 'All' && allocation.status !== statusFilter) return false;
      if (blockFilter !== 'All' && (!room || room.blockId !== blockFilter)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const haystack = `${student ? student.name : ''} ${student ? student.rollNumber : ''} ${room ? room.roomNumber : ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [enrichedAllocations, statusFilter, blockFilter, searchTerm]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.allocation.allocationDate) - new Date(a.allocation.allocationDate)),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, blockFilter, searchTerm]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Allocation Management</h1>
          <p className="page-header__subtitle">Search, filter, and manage active room allocations.</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn-primary" onClick={() => onOpenAllocate(null)}>
            <IconPlus /> New Allocation
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__body">
          <div className="table-toolbar">
            <div className="table-toolbar__filters">
              <input
                type="text"
                className="search-input"
                placeholder="Search by student, roll no. or room…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Deallocated">Deallocated</option>
              </select>
              <select className="filter-select" value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
                <option value="All">All Blocks</option>
                {db.blocks.map((block) => (
                  <option key={block.id} value={block.id}>{block.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Room</th>
                  <th>Date Allocated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty-state">No allocations match your search or filters.</td>
                  </tr>
                )}
                {paginated.map(({ allocation, student, room, block }) => (
                  <tr key={allocation.id}>
                    <td>
                      <div className="data-table__student">
                        <div className="data-table__avatar">{student ? initials(student.name) : '—'}</div>
                        <div>
                          <div className="data-table__name">{student ? student.name : 'Unknown student'}</div>
                          <div className="data-table__subtext">{student ? `${student.rollNumber} · ${student.department}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {room ? (
                        <>
                          <div>{block.name.split(' (')[0]} · {room.roomNumber}</div>
                          <div className="data-table__subtext">{room.capacityType} · {room.acType}</div>
                        </>
                      ) : 'Unknown room'}
                    </td>
                    <td>{formatDate(allocation.allocationDate)}</td>
                    <td><StatusBadge status={allocation.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenDetails(room ? room.id : null)} disabled={!room}>
                          View
                        </button>
                        {allocation.status === 'Active' && (
                          <>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenReassign(allocation.id)}>
                              Reassign
                            </button>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => onRequestDeallocate(allocation.id)}>
                              Deallocate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              Showing {paginated.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{(currentPage - 1) * PAGE_SIZE + paginated.length} of {sorted.length}
            </span>
            <div className="pagination__controls">
              <button type="button" className="pagination__btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination__btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button type="button" className="pagination__btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   9. ALLOCATION FORM MODAL (New / Reassign)
   ========================================================================= */

function AllocationFormModal({ db, mode, presetRoomId, allocation, onClose, onSubmit }) {
  const currentStudent = allocation ? db.students.find((s) => s.id === allocation.studentId) : null;
  const currentRoomId = allocation ? allocation.roomId : null;

  const [selectedStudentId, setSelectedStudentId] = useState(currentStudent ? currentStudent.id : '');
  const [selectedRoomId, setSelectedRoomId] = useState(presetRoomId || '');

  const unallocatedStudents = useMemo(
    () => db.students.filter((s) => !s.allocatedRoomId || s.id === (currentStudent && currentStudent.id)),
    [db.students, currentStudent]
  );

  const eligibleRooms = useMemo(() => {
    const student = db.students.find((s) => s.id === selectedStudentId);
    return db.rooms.filter((room) => {
      if (room.id === currentRoomId) return false;
      if (room.maintenance) return false;
      const capacity = CAPACITY_NUMBER[room.capacityType];
      if (room.occupantIds.length >= capacity) return false;
      if (student) {
        const block = db.blocks.find((b) => b.id === room.blockId);
        if (!genderMatches(block.gender, student.gender)) return false;
      }
      return true;
    });
  }, [db.rooms, db.blocks, db.students, selectedStudentId, currentRoomId]);

  const validation = useMemo(() => {
    if (!selectedStudentId || !selectedRoomId) return { valid: false, message: '' };
    return validateAllocation(db, {
      studentId: selectedStudentId,
      roomId: selectedRoomId,
      excludeAllocationId: allocation ? allocation.id : null,
    });
  }, [db, selectedStudentId, selectedRoomId, allocation]);

  const handleSubmit = () => {
    if (!validation.valid) return;
    onSubmit({ studentId: selectedStudentId, roomId: selectedRoomId, previousAllocationId: allocation ? allocation.id : null });
  };

  const roomLabel = (room) => {
    const block = db.blocks.find((b) => b.id === room.blockId);
    return `${block.name.split(' (')[0]} · Room ${room.roomNumber} (${room.capacityType}, ${room.acType}) — ${room.occupantIds.length}/${CAPACITY_NUMBER[room.capacityType]} occupied`;
  };

  return (
    <Modal
      title={mode === 'reassign' ? 'Reassign Student to a New Room' : 'New Room Allocation'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={!selectedStudentId || !selectedRoomId || !validation.valid}>
            {mode === 'reassign' ? 'Confirm Reassignment' : 'Allocate Room'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label" htmlFor="student-select">
          Student <span className="required">*</span>
        </label>
        <select
          id="student-select"
          className="form-control"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={mode === 'reassign'}
        >
          <option value="">Select a student…</option>
          {unallocatedStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.rollNumber} ({s.gender}, {s.department})
            </option>
          ))}
        </select>
        {mode === 'reassign' && <p className="form-hint">Student is locked for a reassignment. Cancel and start a new allocation to change students.</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="room-select">
          Room <span className="required">*</span>
        </label>
        <select
          id="room-select"
          className="form-control"
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          disabled={!selectedStudentId}
        >
          <option value="">{selectedStudentId ? 'Select an available room…' : 'Select a student first'}</option>
          {eligibleRooms.map((room) => (
            <option key={room.id} value={room.id}>{roomLabel(room)}</option>
          ))}
        </select>
        {selectedStudentId && eligibleRooms.length === 0 && (
          <p className="form-error">No eligible rooms found for this student's gender and current availability.</p>
        )}
      </div>

      <div className="date-field form-group">
        <label className="form-label">Allocation Date</label>
        <input className="form-control" type="text" value={formatDate(new Date().toISOString().slice(0, 10))} disabled readOnly />
        <IconCalendar />
        <p className="form-hint">Allocations are recorded with today's date automatically.</p>
      </div>

      {selectedStudentId && selectedRoomId && !validation.valid && (
        <div className="alert-banner alert-banner--danger">{validation.message}</div>
      )}
      {selectedStudentId && selectedRoomId && validation.valid && (
        <div className="alert-banner alert-banner--info">All checks passed — ready to allocate.</div>
      )}
    </Modal>
  );
}

/* =========================================================================
   10. ROOM DETAILS MODAL
   ========================================================================= */

function RoomDetailsModal({ db, room, onClose, onRequestDeallocate, onToggleMaintenance, onOpenAllocate }) {
  const block = db.blocks.find((b) => b.id === room.blockId);
  const status = computeRoomStatus(room);
  const capacity = CAPACITY_NUMBER[room.capacityType];
  const occupants = room.occupantIds.map((id) => db.students.find((s) => s.id === id)).filter(Boolean);

  return (
    <Modal
      title={`Room ${room.roomNumber} Details`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          {occupants.length === 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => onToggleMaintenance(room.id)}>
              {room.maintenance ? 'Mark as Available' : 'Mark for Maintenance'}
            </button>
          )}
          {status === 'Available' && (
            <button type="button" className="btn btn-primary" onClick={() => onOpenAllocate(room.id)}>
              <IconPlus /> Allocate a Student
            </button>
          )}
        </>
      }
    >
      <div className="form-row mb-4">
        <div>
          <div className="form-label">Block</div>
          <div>{block.name}</div>
        </div>
        <div>
          <div className="form-label">Floor</div>
          <div>Floor {room.floor}</div>
        </div>
        <div>
          <div className="form-label">Capacity</div>
          <div>{room.capacityType} ({capacity} bed{capacity > 1 ? 's' : ''})</div>
        </div>
        <div>
          <div className="form-label">Amenities</div>
          <div>{room.acType}</div>
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">Status</div>
        <StatusBadge status={status} />
      </div>

      <div className="form-group">
        <div className="form-label">Occupants ({occupants.length}/{capacity})</div>
        {occupants.length === 0 && <p className="text-muted">This room currently has no occupants.</p>}
        {occupants.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {occupants.map((student) => {
                  const activeAllocation = db.allocations.find(
                    (a) => a.studentId === student.id && a.roomId === room.id && a.status === 'Active'
                  );
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="data-table__student">
                          <div className="data-table__avatar">{initials(student.name)}</div>
                          <div>
                            <div className="data-table__name">{student.name}</div>
                            <div className="data-table__subtext">{student.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td>{student.department}</td>
                      <td>{student.contact}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => activeAllocation && onRequestDeallocate(activeAllocation.id)}
                          disabled={!activeAllocation}
                        >
                          Deallocate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* =========================================================================
   11. ROOT APP COMPONENT
   ========================================================================= */

export default function App() {
  const [db, setDb] = useState(() => loadDatabase());
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  // activeModal shapes:
  // { type: 'allocate', roomId }
  // { type: 'reassign', allocationId }
  // { type: 'roomDetails', roomId }
  // { type: 'confirmDeallocate', allocationId }

  useEffect(() => {
    persistDatabase(db);
  }, [db]);

  const addToast = useCallback((type, title, message) => {
    setToasts((prev) => [...prev, { id: makeId('toast'), type, title, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  const handleNavigate = useCallback((view) => {
    setActiveView(view);
    setSearchTerm('');
  }, []);

  const handleAllocate = useCallback(({ studentId, roomId, previousAllocationId }) => {
    setDb((prev) => {
      const next = {
        blocks: prev.blocks,
        rooms: prev.rooms.map((r) => ({ ...r, occupantIds: [...r.occupantIds] })),
        students: prev.students.map((s) => ({ ...s })),
        allocations: prev.allocations.map((a) => ({ ...a })),
      };

      if (previousAllocationId) {
        const prevAllocation = next.allocations.find((a) => a.id === previousAllocationId);
        if (prevAllocation) {
          prevAllocation.status = 'Deallocated';
          const oldRoom = next.rooms.find((r) => r.id === prevAllocation.roomId);
          if (oldRoom) oldRoom.occupantIds = oldRoom.occupantIds.filter((id) => id !== studentId);
        }
      }

      const room = next.rooms.find((r) => r.id === roomId);
      const student = next.students.find((s) => s.id === studentId);
      room.occupantIds.push(studentId);
      student.allocatedRoomId = roomId;
      next.allocations.push({
        id: makeId('alloc'),
        studentId,
        roomId,
        allocationDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
      });

      return next;
    });

    addToast('success', previousAllocationId ? 'Student Reassigned' : 'Room Allocated', 'The allocation has been recorded successfully.');
    closeModal();
  }, [addToast, closeModal]);

  const handleConfirmDeallocate = useCallback(() => {
    if (!activeModal || activeModal.type !== 'confirmDeallocate') return;
    const { allocationId } = activeModal;

    setDb((prev) => {
      const next = {
        blocks: prev.blocks,
        rooms: prev.rooms.map((r) => ({ ...r, occupantIds: [...r.occupantIds] })),
        students: prev.students.map((s) => ({ ...s })),
        allocations: prev.allocations.map((a) => ({ ...a })),
      };
      const allocation = next.allocations.find((a) => a.id === allocationId);
      if (!allocation) return prev;

      allocation.status = 'Deallocated';
      const room = next.rooms.find((r) => r.id === allocation.roomId);
      if (room) room.occupantIds = room.occupantIds.filter((id) => id !== allocation.studentId);
      const student = next.students.find((s) => s.id === allocation.studentId);
      if (student) student.allocatedRoomId = null;

      return next;
    });

    addToast('warning', 'Allocation Removed', 'The student has been deallocated from the room.');
    closeModal();
  }, [activeModal, addToast, closeModal]);

  const handleToggleMaintenance = useCallback((roomId) => {
    setDb((prev) => {
      const next = { ...prev, rooms: prev.rooms.map((r) => ({ ...r })) };
      const room = next.rooms.find((r) => r.id === roomId);
      if (room.occupantIds.length > 0) return prev;
      room.maintenance = !room.maintenance;
      return next;
    });
    addToast('info', 'Room Updated', 'The room status has been updated.');
  }, [addToast]);

  const currentAllocationForReassign =
    activeModal && activeModal.type === 'reassign'
      ? db.allocations.find((a) => a.id === activeModal.allocationId)
      : null;

  const currentRoomForDetails =
    activeModal && activeModal.type === 'roomDetails' && activeModal.roomId
      ? db.rooms.find((r) => r.id === activeModal.roomId)
      : null;

  const allocationForConfirm =
    activeModal && activeModal.type === 'confirmDeallocate'
      ? db.allocations.find((a) => a.id === activeModal.allocationId)
      : null;
  const studentForConfirm = allocationForConfirm
    ? db.students.find((s) => s.id === allocationForConfirm.studentId)
    : null;
  const roomForConfirm = allocationForConfirm
    ? db.rooms.find((r) => r.id === allocationForConfirm.roomId)
    : null;

  const viewTitles = {
    dashboard: 'Dashboard',
    rooms: 'Room Matrix',
    allocations: 'Allocations',
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar activeView={activeView} onNavigate={handleNavigate} collapsed={sidebarCollapsed} />
      <Navbar
        title={viewTitles[activeView]}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="main-content">
        {activeView === 'dashboard' && <DashboardView db={db} onNavigate={handleNavigate} />}

        {activeView === 'rooms' && (
          <RoomMatrixView
            db={db}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenAllocate={(roomId) => setActiveModal({ type: 'allocate', roomId })}
            onOpenDetails={(roomId) => setActiveModal({ type: 'roomDetails', roomId })}
          />
        )}

        {activeView === 'allocations' && (
          <AllocationsView
            db={db}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenAllocate={(roomId) => setActiveModal({ type: 'allocate', roomId })}
            onOpenReassign={(allocationId) => setActiveModal({ type: 'reassign', allocationId })}
            onOpenDetails={(roomId) => setActiveModal({ type: 'roomDetails', roomId })}
            onRequestDeallocate={(allocationId) => setActiveModal({ type: 'confirmDeallocate', allocationId })}
          />
        )}
      </main>

      {activeModal && activeModal.type === 'allocate' && (
        <AllocationFormModal
          db={db}
          mode="new"
          presetRoomId={activeModal.roomId}
          allocation={null}
          onClose={closeModal}
          onSubmit={handleAllocate}
        />
      )}

      {activeModal && activeModal.type === 'reassign' && currentAllocationForReassign && (
        <AllocationFormModal
          db={db}
          mode="reassign"
          presetRoomId={null}
          allocation={currentAllocationForReassign}
          onClose={closeModal}
          onSubmit={handleAllocate}
        />
      )}

      {activeModal && activeModal.type === 'roomDetails' && currentRoomForDetails && (
        <RoomDetailsModal
          db={db}
          room={currentRoomForDetails}
          onClose={closeModal}
          onRequestDeallocate={(allocationId) => setActiveModal({ type: 'confirmDeallocate', allocationId })}
          onToggleMaintenance={handleToggleMaintenance}
          onOpenAllocate={(roomId) => setActiveModal({ type: 'allocate', roomId })}
        />
      )}

      {activeModal && activeModal.type === 'confirmDeallocate' && allocationForConfirm && (
        <ConfirmDialog
          title="Confirm Deallocation"
          message={`Remove ${studentForConfirm ? studentForConfirm.name : 'this student'} from Room ${roomForConfirm ? roomForConfirm.roomNumber : ''}? This will free up the bed immediately.`}
          confirmLabel="Deallocate"
          tone="danger"
          onConfirm={handleConfirmDeallocate}
          onCancel={closeModal}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}