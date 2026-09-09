import React, { useState, useRef } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import {
  Search,
  ThumbsUp,
  MessageCircle,
  Send,
  Plus,
  X,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Smartphone,
  TrendingUp,
  Award,
  Users,
  Flame,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Zap,
  Star,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext.jsx';

/* ─── Seed Data ─────────────────────────────────────── */
const SEED_POSTS = [
  {
    id: 1,
    type: 'Question',
    author: 'Apex Devices Hub',
    initials: 'AD',
    avatarColor: '#6366f1',
    device: 'Oppo F15',
    title: 'Fingerprint not working after display replacement.',
    body: 'I replaced the display, but fingerprint is no longer detecting. Has anyone faced this issue? The sensor physically looks intact but software doesn\'t register any touch.',
    likes: 12,
    likedByMe: false,
    saved: false,
    createdAt: '2h ago',
    comments: [
      { id: 101, author: 'Mobile Care Workshop', initials: 'MC', avatarColor: '#10b981', text: 'Try checking the fingerprint flex connector — it may have gotten pinched during reassembly.', likes: 4, likedByMe: false, time: '1h ago' },
      { id: 102, author: 'Tech Repair Hub', initials: 'TR', avatarColor: '#f59e0b', text: 'Also verify whether the replacement display is compatible with the original fingerprint sensor. Some OEM panels pair the display to the FP sensor digitally.', likes: 7, likedByMe: false, time: '45m ago' },
    ],
  },
  {
    id: 2,
    type: 'Solution',
    author: 'Galaxy Fix Centre',
    initials: 'GF',
    avatarColor: '#3b82f6',
    device: 'Samsung S22 Ultra',
    title: 'S-Pen not detected — fixed by reseating digitizer cable.',
    body: 'After water damage, the S-Pen stopped responding. Opened it up and found the digitizer ribbon cable had lifted slightly on one corner. Reseated it with gentle pressure + heat and it\'s working perfectly now.',
    likes: 34,
    likedByMe: false,
    saved: false,
    createdAt: '5h ago',
    comments: [
      { id: 201, author: 'QuickFix Labs', initials: 'QL', avatarColor: '#8b5cf6', text: 'This saved me! Had the exact same issue on an S21 FE. Reseating worked like a charm.', likes: 11, likedByMe: false, time: '4h ago' },
    ],
  },
  {
    id: 3,
    type: 'Tip',
    author: 'ProTech Service Hub',
    initials: 'PT',
    avatarColor: '#ec4899',
    device: 'iPhone 13 Pro',
    title: 'Always use Face ID calibration after screen swap on iPhone 13+.',
    body: 'Reminder to everyone: on iPhones 13 and above, replacing the screen without pairing the True Depth camera again will break Face ID. Always use Apple Configurator or a 3rd-party pairing tool. Don\'t skip this step!',
    likes: 58,
    likedByMe: false,
    saved: false,
    createdAt: '1d ago',
    comments: [
      { id: 301, author: 'iCare Workshop', initials: 'IC', avatarColor: '#14b8a6', text: 'Golden tip. Burned many times before I learned this the hard way. 🙏', likes: 9, likedByMe: false, time: '22h ago' },
      { id: 302, author: 'Apex Devices Hub', initials: 'AD', avatarColor: '#6366f1', text: 'Which 3rd party tool do you recommend for pairing?', likes: 3, likedByMe: false, time: '20h ago' },
    ],
  },
  {
    id: 4,
    type: 'Question',
    author: 'BestByte Repairs',
    initials: 'BB',
    avatarColor: '#f97316',
    device: 'Redmi Note 12',
    title: 'Charging port replaced but still slow charging — what am I missing?',
    body: 'Replaced the Type-C port on a Redmi Note 12. Charging works but maxes at 5W instead of the expected 67W. Using original charger. Could it be the flex cable or something inside the board?',
    likes: 8,
    likedByMe: false,
    saved: false,
    createdAt: '3h ago',
    comments: [],
  },
  {
    id: 5,
    type: 'Tip',
    author: 'Mobile Care Workshop',
    initials: 'MC',
    avatarColor: '#10b981',
    device: 'All Devices',
    title: 'Use 90% IPA + ultrasonic cleaner for corrosion on charging boards.',
    body: 'For water-damaged charging boards with visible corrosion, soak in 90%+ IPA then run through ultrasonic cleaner at 40°C for 8–10 min. Rinse with clean IPA and dry with hot air. Success rate on light corrosion is 80%+.',
    likes: 72,
    likedByMe: false,
    saved: false,
    createdAt: '2d ago',
    comments: [
      { id: 501, author: 'QuickFix Labs', initials: 'QL', avatarColor: '#8b5cf6', text: 'What frequency do you run the ultrasonic cleaner at?', likes: 2, likedByMe: false, time: '1d ago' },
      { id: 502, author: 'Mobile Care Workshop', initials: 'MC', avatarColor: '#10b981', text: 'I use 40kHz — gentle enough not to damage small components.', likes: 5, likedByMe: false, time: '1d ago' },
    ],
  },
  {
    id: 6,
    type: 'Solution',
    author: 'QuickFix Labs',
    initials: 'QL',
    avatarColor: '#8b5cf6',
    device: 'Vivo Y73',
    title: 'Ghost touch fixed by replacing digitizer (not full LCD combo).',
    body: 'Customer had severe ghost touch on Vivo Y73. Instead of replacing the full LCD+touch combo (expensive), I carefully separated and replaced only the digitizer layer. Cost ₹380 instead of ₹1,800. Customer happy, profit margin better.',
    likes: 44,
    likedByMe: false,
    saved: false,
    createdAt: '6h ago',
    comments: [
      { id: 601, author: 'Tech Repair Hub', initials: 'TR', avatarColor: '#f59e0b', text: 'Great cost-saving move! Which glue did you use for rebonding?', likes: 6, likedByMe: false, time: '5h ago' },
    ],
  },
];

const TYPE_CONFIG = {
  Question: {
    icon: HelpCircle,
    color: '#f59e0b',
    darkColor: '#d97706',
    bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    border: '#fde68a',
    glow: 'rgba(245,158,11,0.15)',
    label: 'QUESTION',
  },
  Solution: {
    icon: CheckCircle2,
    color: '#10b981',
    darkColor: '#059669',
    bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    border: '#6ee7b7',
    glow: 'rgba(16,185,129,0.15)',
    label: 'SOLUTION',
  },
  Tip: {
    icon: Lightbulb,
    color: '#8b5cf6',
    darkColor: '#7c3aed',
    bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    border: '#c4b5fd',
    glow: 'rgba(139,92,246,0.15)',
    label: 'TIP',
  },
};

const FILTERS = ['All', 'Questions', 'Solutions', 'Tips'];

/* ─────────────────────────────────────────────────────── */
/*  Inline styles                                          */
/* ─────────────────────────────────────────────────────── */
const S = {
  /* Page shell */
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
  },

  /* Hero banner */
  hero: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #5b21b6 100%)',
    borderRadius: 20,
    padding: '32px 36px',
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(99,102,241,0.3), 0 8px 24px rgba(0,0,0,0.15)',
  },
  heroBg1: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroBg2: {
    position: 'absolute', bottom: -40, left: 180,
    width: 160, height: 160, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 20, flexWrap: 'wrap',
  },
  heroIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  heroTitle: {
    color: '#fff', margin: 0,
    fontSize: 26, fontWeight: '900',
    letterSpacing: '-0.8px',
    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    color: '#c4b5fd', margin: '6px 0 0',
    fontSize: 13, fontWeight: '500', letterSpacing: '0.1px',
  },
  heroDots: {
    display: 'flex', gap: 6, marginTop: 14,
  },
  heroDot: (color) => ({
    width: 8, height: 8, borderRadius: '50%', background: color,
    boxShadow: `0 0 8px ${color}`,
  }),
  heroBtn: {
    background: 'rgba(255,255,255,0.95)',
    color: '#4f46e5', fontWeight: '800', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
    letterSpacing: '-0.2px',
    flexShrink: 0,
  },

  /* Toolbar: search + filters */
  toolbar: {
    display: 'flex', gap: 12, marginBottom: 22,
    flexWrap: 'wrap', alignItems: 'center',
  },
  searchWrap: {
    flex: 1, minWidth: 220, position: 'relative',
  },
  searchIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', paddingLeft: 42, paddingRight: 16,
    paddingTop: 10, paddingBottom: 10,
    border: '1.5px solid #e2e8f0',
    borderRadius: 12, fontSize: 13, fontWeight: '500',
    background: '#fff', color: '#0f172a', outline: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  filterGroup: {
    display: 'flex', gap: 6, flexWrap: 'wrap',
    background: '#fff', borderRadius: 12, padding: 4,
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  filterBtn: (active) => ({
    padding: '7px 18px', borderRadius: 9, fontSize: 12,
    fontWeight: '700', cursor: 'pointer', border: 'none',
    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
    color: active ? '#fff' : '#64748b',
    transition: 'all 0.2s',
    boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
    letterSpacing: active ? '-0.2px' : '0',
  }),

  /* Two-column grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: 22,
    alignItems: 'start',
  },
  feed: {
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  /* Post card */
  card: (type) => ({
    background: '#fff',
    borderRadius: 16,
    border: `1px solid #e8edf5`,
    overflow: 'hidden',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    borderLeft: `3.5px solid ${TYPE_CONFIG[type]?.color || '#6366f1'}`,
  }),
  cardHeader: {
    padding: '18px 20px 0',
  },
  authorRow: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
    gap: 8,
  },
  authorLeft: {
    display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0,
  },
  authorInfo: {
    flex: 1, minWidth: 0,
  },
  authorName: {
    fontWeight: '800', fontSize: 14, color: '#0f172a',
    letterSpacing: '-0.2px', marginBottom: 4,
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  authorMeta: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  deviceTag: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#f1f5f9', color: '#475569',
    borderRadius: 8, padding: '3px 9px',
    fontSize: 11, fontWeight: '700', letterSpacing: '0.2px',
    border: '1px solid #e2e8f0',
  },
  authorRight: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  timestamp: {
    fontSize: 11, color: '#94a3b8', fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  saveBtn: (saved) => ({
    background: saved ? '#eef2ff' : 'none',
    border: 'none', cursor: 'pointer', padding: '6px 7px',
    borderRadius: 8, color: saved ? '#6366f1' : '#cbd5e1',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center',
  }),

  /* Post content */
  postTitle: {
    fontSize: 15.5, fontWeight: '800', color: '#0f172a',
    margin: '0 0 8px', lineHeight: 1.45, letterSpacing: '-0.3px',
    padding: '0 20px',
  },
  postBody: {
    fontSize: 13, color: '#475569', lineHeight: 1.65,
    margin: '0 0 16px', padding: '0 20px',
  },

  /* Action bar */
  actionBar: {
    display: 'flex', alignItems: 'center',
    padding: '0 8px',
    borderTop: '1px solid #f1f5f9',
    background: '#fafbfe',
  },
  actionBtn: (active, color) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 13px', borderRadius: 10,
    fontSize: 12.5, fontWeight: '700',
    color: active ? (color || '#6366f1') : '#64748b',
    transition: 'all 0.15s',
  }),
  shareBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 13px', borderRadius: 10,
    fontSize: 12.5, fontWeight: '700', color: '#64748b',
    transition: 'all 0.15s', marginLeft: 'auto',
  },

  /* Comments panel */
  commentsPanel: {
    padding: '12px 20px 18px',
    borderTop: '1px solid #f1f5f9',
    background: '#fbfcff',
  },
  commentItem: {
    display: 'flex', gap: 10, paddingBottom: 12, marginBottom: 12,
    borderBottom: '1px solid #f1f5f9',
  },
  commentBody: { flex: 1 },
  commentHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '700', fontSize: 12.5, color: '#0f172a',
  },
  commentTime: { fontSize: 11, color: '#94a3b8' },
  commentText: {
    fontSize: 13, color: '#475569', lineHeight: 1.55, margin: '0 0 6px',
  },
  commentInput: {
    display: 'flex', gap: 10, marginTop: 12, alignItems: 'center',
  },

  /* Badge */
  badge: (type) => {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Question;
    return {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.darkColor,
      borderRadius: 8, padding: '3px 9px',
      fontSize: 10, fontWeight: '800',
      border: `1px solid ${cfg.border}`,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
    };
  },

  /* Avatar */
  avatar: (color, size) => ({
    width: size, height: size, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.max(10, size * 0.38), fontWeight: '800',
    color: '#fff', flexShrink: 0,
    letterSpacing: '-0.3px',
    boxShadow: `0 0 0 2.5px ${color}25, 0 2px 6px ${color}30`,
  }),

  /* Empty state */
  empty: {
    padding: '56px 24px', textAlign: 'center',
    background: '#fff', borderRadius: 16, border: '1px solid #e8edf5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },

  /* Sidebar */
  sidebar: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  sideCard: {
    background: '#fff', borderRadius: 16,
    border: '1px solid #e8edf5',
    padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  sideCardTitle: {
    fontWeight: '800', fontSize: 13, color: '#0f172a',
    letterSpacing: '-0.2px',
  },
  sideCardHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
  },

  /* Stat cells */
  statGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
  },
  statCell: (color) => ({
    background: `linear-gradient(135deg, ${color}08, ${color}14)`,
    borderRadius: 12, padding: '14px 12px', textAlign: 'center',
    border: `1px solid ${color}20`,
  }),
  statValue: (color) => ({
    fontSize: 22, fontWeight: '900', color, lineHeight: 1.1,
    letterSpacing: '-0.5px',
  }),
  statLabel: {
    fontSize: 10.5, color: '#64748b', fontWeight: '700',
    marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px',
  },

  /* Contributors */
  contributorRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
  },
  contributorInfo: { flex: 1, minWidth: 0 },
  contributorName: {
    fontWeight: '700', fontSize: 12, color: '#0f172a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  contributorSub: {
    fontSize: 11, color: '#94a3b8', fontWeight: '500',
  },
  rankBadge: (rank) => ({
    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: '900',
    background: rank === 1 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' :
                rank === 2 ? 'linear-gradient(135deg,#94a3b8,#64748b)' :
                rank === 3 ? 'linear-gradient(135deg,#d97706,#b45309)' :
                '#f1f5f9',
    color: rank <= 3 ? '#fff' : '#64748b',
    boxShadow: rank === 1 ? '0 2px 8px rgba(251,191,36,0.4)' : 'none',
  }),

  /* Trending */
  trendRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 0',
  },
  trendName: {
    fontSize: 12, color: '#334155', fontWeight: '600',
  },
  trendCount: {
    fontSize: 11, color: '#6366f1', background: '#eef2ff',
    borderRadius: 20, padding: '3px 10px', fontWeight: '800',
    border: '1px solid #c7d2fe',
  },

  /* Modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(8px)', zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modalCard: {
    maxWidth: 540, width: '100%', background: '#fff',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.5)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 24px',
    background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  modalTitle: { color: '#fff', margin: 0, fontSize: 17, fontWeight: '900', letterSpacing: '-0.3px' },
  modalSub: { color: '#c4b5fd', margin: '3px 0 0', fontSize: 12 },
  modalCloseBtn: {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, padding: 7, cursor: 'pointer', color: '#fff', display: 'flex',
    transition: 'background 0.2s',
  },
  modalBody: { padding: 24 },
  typeBtn: (active, cfg) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
    fontWeight: '700', fontSize: 12, transition: 'all 0.15s',
    border: `2px solid ${active ? cfg.color : '#e2e8f0'}`,
    background: active ? cfg.bg : '#fff',
    color: active ? cfg.darkColor : '#64748b',
    boxShadow: active ? `0 4px 12px ${cfg.glow}` : 'none',
  }),
};

/* ─── Avatar ─────────────────────────────────────────── */
function Avatar({ initials, color, size = 38 }) {
  return (
    <div style={S.avatar(color, size)}>
      {initials}
    </div>
  );
}

/* ─── Type Badge ─────────────────────────────────────── */
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Question;
  const Icon = cfg.icon;
  return (
    <span style={S.badge(type)}>
      <Icon size={10} strokeWidth={2.5} /> {cfg.label}
    </span>
  );
}

/* ─── Comment Item ───────────────────────────────────── */
function CommentItem({ comment, onLike }) {
  return (
    <div style={S.commentItem}>
      <Avatar initials={comment.initials} color={comment.avatarColor} size={30} />
      <div style={S.commentBody}>
        <div style={S.commentHeader}>
          <span style={S.commentAuthor}>{comment.author}</span>
          <span style={S.commentTime}>{comment.time}</span>
        </div>
        <p style={S.commentText}>{comment.text}</p>
        <button
          type="button"
          onClick={onLike}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: comment.likedByMe ? '#6366f1' : '#94a3b8',
            fontSize: 11.5, fontWeight: '700', transition: 'color 0.2s',
          }}
        >
          <ThumbsUp size={11} strokeWidth={2} fill={comment.likedByMe ? '#6366f1' : 'none'} />
          {comment.likes}
        </button>
      </div>
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────── */
function PostCard({ post, onLike, onCommentLike, onAddComment, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={S.card(post.type)}>
      {/* Author Row */}
      <div style={S.cardHeader}>
        <div style={S.authorRow}>
          <div style={S.authorLeft}>
            <Avatar initials={post.initials} color={post.avatarColor} size={40} />
            <div style={S.authorInfo}>
              <div style={S.authorName}>
                {post.author}
                <TypeBadge type={post.type} />
              </div>
              <div style={S.authorMeta}>
                <span style={S.deviceTag}>
                  <Smartphone size={10} color="#64748b" />
                  {post.device}
                </span>
              </div>
            </div>
          </div>
          <div style={S.authorRight}>
            <span style={S.timestamp}>{post.createdAt}</span>
            <button
              type="button"
              onClick={() => onSave(post.id)}
              title={post.saved ? 'Unsave' : 'Save'}
              style={S.saveBtn(post.saved)}
            >
              <Bookmark size={15} fill={post.saved ? '#6366f1' : 'none'} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Title + Body */}
      <h3 style={S.postTitle}>{post.title}</h3>
      <p style={S.postBody}>{post.body}</p>

      {/* Action Bar */}
      <div style={S.actionBar}>
        <button
          type="button"
          onClick={() => onLike(post.id)}
          style={S.actionBtn(post.likedByMe, '#6366f1')}
        >
          <ThumbsUp
            size={14}
            fill={post.likedByMe ? '#6366f1' : 'none'}
            strokeWidth={post.likedByMe ? 2.5 : 2}
          />
          {post.likes}
        </button>

        <button
          type="button"
          onClick={() => { setExpanded(v => !v); setTimeout(() => inputRef.current?.focus(), 120); }}
          style={S.actionBtn(expanded, '#6366f1')}
        >
          <MessageCircle size={14} strokeWidth={2} />
          {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); }}
          style={S.shareBtn}
        >
          <Share2 size={13} strokeWidth={2} /> Share
        </button>
      </div>

      {/* Comments Panel */}
      {expanded && (
        <div style={S.commentsPanel}>
          {post.comments.length === 0 && (
            <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', padding: '10px 0', margin: 0, fontWeight: '600' }}>
              No comments yet — be the first! 💬
            </p>
          )}
          {post.comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              onLike={() => onCommentLike(post.id, c.id)}
            />
          ))}
          <div style={S.commentInput}>
            <Avatar initials="ME" color="#6366f1" size={28} />
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                className="input-control"
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1, fontSize: 12.5, padding: '8px 12px', borderRadius: 10 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={!commentText.trim()}
                style={{ padding: '8px 13px', borderRadius: 10 }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── New Post Modal ─────────────────────────────────── */
function NewPostModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ type: 'Question', device: '', title: '', body: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and description are required.'); return; }
    onSubmit(form);
    onClose();
  };

  return (
    <div style={S.modalOverlay}>
      <div style={S.modalCard}>
        <div style={S.modalHeader}>
          <div>
            <h3 style={S.modalTitle}>New Community Post</h3>
            <p style={S.modalSub}>Share your question, solution or pro tip</p>
          </div>
          <button type="button" onClick={onClose} style={S.modalCloseBtn}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={S.modalBody}>
          {/* Type selector */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: '700', fontSize: 12, letterSpacing: '0.3px' }}>
              POST TYPE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {['Question', 'Solution', 'Tip'].map(t => {
                const cfg = TYPE_CONFIG[t];
                const Icon = cfg.icon;
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    style={S.typeBtn(active, cfg)}
                  >
                    <Icon size={20} />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Device / Brand</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. iPhone 13, Samsung S22, Oppo F15..."
              value={form.device}
              onChange={e => set('device', e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="input-control"
              placeholder="Describe your question or tip in one line..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              style={{ borderRadius: 10 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 22 }}>
            <label className="form-label">Details *</label>
            <textarea
              className="input-control"
              placeholder="Provide more context, steps you tried, error details, etc..."
              rows={4}
              value={form.body}
              onChange={e => set('body', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit', borderRadius: 10 }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 10 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: 7, borderRadius: 10 }}>
              <Send size={14} /> Post to Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Community Sidebar ──────────────────────────────── */
function CommunitySidebar({ posts }) {
  const topContributors = [
    { name: 'Mobile Care Workshop', initials: 'MC', color: '#10b981', posts: 24, rank: 1 },
    { name: 'Tech Repair Hub',      initials: 'TR', color: '#f59e0b', posts: 18, rank: 2 },
    { name: 'ProTech Service Hub',  initials: 'PT', color: '#ec4899', posts: 15, rank: 3 },
    { name: 'QuickFix Labs',        initials: 'QL', color: '#8b5cf6', posts: 11, rank: 4 },
    { name: 'Galaxy Fix Centre',    initials: 'GF', color: '#3b82f6', posts:  9, rank: 5 },
  ];

  const trendingDevices = [
    { device: 'iPhone 13 / 14', count: 36 },
    { device: 'Samsung S22 Series', count: 27 },
    { device: 'Oppo F Series', count: 19 },
    { device: 'Redmi Note 12', count: 14 },
    { device: 'Vivo Y Series', count: 11 },
  ];

  const stats = [
    { label: 'Posts',    value: '12.6K', color: '#6366f1' },
    { label: 'Members',  value: '1.4K',  color: '#10b981' },
    { label: 'Solutions',value: '60',    color: '#3b82f6' },
    { label: 'Tips',     value: '66',    color: '#f59e0b' },
  ];

  return (
    <div style={S.sidebar}>
      {/* Community Stats */}
      <div style={S.sideCard}>
        <div style={S.sideCardHeader}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={16} color="#fff" />
          </div>
          <span style={S.sideCardTitle}>Community Stats</span>
        </div>
        <div style={S.statGrid}>
          {stats.map(s => (
            <div key={s.label} style={S.statCell(s.color)}>
              <div style={S.statValue(s.color)}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors */}
      <div style={S.sideCard}>
        <div style={S.sideCardHeader}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={16} color="#fff" />
          </div>
          <span style={S.sideCardTitle}>Top Contributors</span>
        </div>
        <div>
          {topContributors.map(c => (
            <div key={c.name} style={S.contributorRow}>
              <div style={S.rankBadge(c.rank)}>{c.rank}</div>
              <Avatar initials={c.initials} color={c.color} size={30} />
              <div style={S.contributorInfo}>
                <div style={S.contributorName}>{c.name}</div>
                <div style={S.contributorSub}>{c.posts} posts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Devices */}
      <div style={S.sideCard}>
        <div style={S.sideCardHeader}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={16} color="#fff" />
          </div>
          <span style={S.sideCardTitle}>Trending Devices</span>
        </div>
        <div>
          {trendingDevices.map((d, i) => (
            <div key={d.device} style={{ ...S.trendRow, borderBottom: i < trendingDevices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={S.trendName}>{d.device}</span>
              <span style={S.trendCount}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export const CommunityPage = () => {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [nextCommentId, setNextCommentId] = useState(700);
  const [nextPostId, setNextPostId] = useState(10);

  const filteredPosts = posts.filter(p => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Questions' && p.type === 'Question') ||
      (activeFilter === 'Solutions' && p.type === 'Solution') ||
      (activeFilter === 'Tips' && p.type === 'Tip');

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.device.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const handleLike = (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const handleSave = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    const post = posts.find(p => p.id === postId);
    if (post) toast.success(post.saved ? 'Removed from saved' : 'Post saved! 🔖');
  };

  const handleCommentLike = (postId, commentId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c =>
          c.id === commentId
            ? { ...c, likedByMe: !c.likedByMe, likes: c.likedByMe ? c.likes - 1 : c.likes + 1 }
            : c
        ),
      };
    }));
  };

  const { user, currentShop } = useAuth();
  const activeAuthor = currentShop?.name || user?.shopName || user?.name || 'Technician';
  const activeInitials = (activeAuthor || 'TE').slice(0, 2).toUpperCase();

  const handleAddComment = (postId, text) => {
    const newComment = {
      id: nextCommentId,
      author: activeAuthor,
      initials: activeInitials,
      avatarColor: '#6366f1',
      text,
      likes: 0,
      likedByMe: false,
      time: 'just now',
    };
    setNextCommentId(n => n + 1);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    toast.success('Comment posted!');
  };

  const handleNewPost = (form) => {
    const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    const newPost = {
      id: nextPostId,
      type: form.type,
      author: activeAuthor,
      initials: activeInitials,
      avatarColor: COLORS[nextPostId % COLORS.length],
      device: form.device.trim() || 'General',
      title: form.title.trim(),
      body: form.body.trim(),
      likes: 0,
      likedByMe: false,
      saved: false,
      createdAt: 'just now',
      comments: [],
    };
    setNextPostId(n => n + 1);
    setPosts(prev => [newPost, ...prev]);
    toast.success('Your post is live in the community! 🎉');
  };

  return (
    <MainLayout title="Repair Community" subtitle="Zapate · Knowledge Hub">
      {/* Hero Banner */}
      <div style={S.hero}>
        <div style={S.heroBg1} />
        <div style={S.heroBg2} />
        <div style={S.heroContent}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={S.heroIconWrap}>
                <Users size={22} color="#fff" />
              </div>
              <h1 style={S.heroTitle}>ZAPATE Repair Community</h1>
            </div>
            <p style={S.heroSubtitle}>
              Ask questions &nbsp;·&nbsp; Share solutions &nbsp;·&nbsp; Learn from fellow technicians
            </p>
            <div style={S.heroDots}>
              {['#f59e0b', '#10b981', '#8b5cf6', '#ef4444'].map(c => (
                <div key={c} style={S.heroDot(c)} />
              ))}
            </div>
          </div>
          <button
            type="button"
            style={S.heroBtn}
            onClick={() => setIsNewPostOpen(true)}
          >
            <Plus size={17} strokeWidth={2.5} />
            New Post
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <Search size={15} style={S.searchIcon} />
          <input
            type="text"
            style={S.searchInput}
            placeholder="Search repair problem or device..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={S.filterGroup}>
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              style={S.filterBtn(activeFilter === f)}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={S.grid}>
        {/* Feed */}
        <div style={S.feed}>
          {filteredPosts.length === 0 ? (
            <div style={S.empty}>
              <MessageCircle size={44} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <h3 style={{ color: '#94a3b8', margin: '0 0 6px', fontWeight: '800', fontSize: 16 }}>
                No posts found
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: 13, margin: '0 0 18px' }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'Be the first to post!'}
              </p>
              <button className="btn btn-primary" type="button" onClick={() => setIsNewPostOpen(true)} style={{ borderRadius: 10 }}>
                <Plus size={14} /> Create Post
              </button>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                onCommentLike={handleCommentLike}
                onAddComment={handleAddComment}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 20 }}>
          <CommunitySidebar posts={posts} />
        </div>
      </div>

      {/* New Post Modal */}
      {isNewPostOpen && (
        <NewPostModal onClose={() => setIsNewPostOpen(false)} onSubmit={handleNewPost} />
      )}
    </MainLayout>
  );
};
