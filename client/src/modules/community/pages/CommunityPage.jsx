import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { KpiCards } from '../../../components/ui/KpiCard/index.js';
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
  Award,
  Users,
  Flame,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  BarChart2,
  Clock,
  Sparkles,
  CornerDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext.jsx';
import api from '../../../services/api.js';

/* ─── Seed Data ─────────────────────────────────────── */
const SEED_POSTS = [
  {
    id: 1,
    type: 'Question',
    author: 'Apex Devices Hub',
    initials: 'AD',
    avatarColor: '#2563eb',
    device: 'Oppo F15',
    title: 'Fingerprint not working after display replacement.',
    body: "I replaced the display, but fingerprint is no longer detecting. Has anyone faced this issue? The sensor physically looks intact but software doesn't register any touch.",
    likes: 12,
    likedByMe: false,
    saved: false,
    createdAt: '2h ago',
    comments: [
      {
        id: 101,
        author: 'Mobile Care Workshop',
        initials: 'MC',
        avatarColor: '#10b981',
        text: 'Try checking the fingerprint flex connector — it may have gotten pinched during reassembly.',
        likes: 4,
        likedByMe: false,
        time: '1h ago',
      },
      {
        id: 102,
        author: 'Tech Repair Hub',
        initials: 'TR',
        avatarColor: '#f59e0b',
        text: 'Also verify whether the replacement display is compatible with the original fingerprint sensor. Some OEM panels pair the display to the FP sensor digitally.',
        likes: 7,
        likedByMe: false,
        time: '45m ago',
      },
    ],
  },
  {
    id: 2,
    type: 'Solution',
    author: 'Galaxy Fix Centre',
    initials: 'GF',
    avatarColor: '#059669',
    device: 'Samsung S22 Ultra',
    title: 'S-Pen not detected — fixed by reseating digitizer cable.',
    body: 'After water damage, the S-Pen stopped responding. Opened it up and found the digitizer ribbon cable had lifted slightly on one corner. Reseated it with gentle pressure + heat and it\'s working perfectly now.',
    likes: 34,
    likedByMe: false,
    saved: false,
    createdAt: '5h ago',
    comments: [
      {
        id: 201,
        author: 'QuickFix Labs',
        initials: 'QL',
        avatarColor: '#7c3aed',
        text: 'This saved me! Had the exact same issue on an S21 FE. Reseating worked like a charm.',
        likes: 11,
        likedByMe: false,
        time: '4h ago',
      },
    ],
  },
  {
    id: 3,
    type: 'Tip',
    author: 'ProTech Service Hub',
    initials: 'PT',
    avatarColor: '#7c3aed',
    device: 'iPhone 13 Pro',
    title: 'Always use Face ID calibration after screen swap on iPhone 13+.',
    body: 'Reminder to everyone: on iPhones 13 and above, replacing the screen without pairing the True Depth camera again will break Face ID. Always use Apple Configurator or a 3rd-party pairing tool. Don\'t skip this step!',
    likes: 58,
    likedByMe: false,
    saved: false,
    createdAt: '1d ago',
    comments: [
      {
        id: 301,
        author: 'iCare Workshop',
        initials: 'IC',
        avatarColor: '#0284c7',
        text: 'Golden tip. Burned many times before I learned this the hard way. 🙏',
        likes: 9,
        likedByMe: false,
        time: '22h ago',
      },
      {
        id: 302,
        author: 'Apex Devices Hub',
        initials: 'AD',
        avatarColor: '#2563eb',
        text: 'Which 3rd party tool do you recommend for pairing?',
        likes: 3,
        likedByMe: false,
        time: '20h ago',
      },
    ],
  },
  {
    id: 4,
    type: 'Question',
    author: 'BestByte Repairs',
    initials: 'BB',
    avatarColor: '#ea580c',
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
      {
        id: 501,
        author: 'QuickFix Labs',
        initials: 'QL',
        avatarColor: '#7c3aed',
        text: 'What frequency do you run the ultrasonic cleaner at?',
        likes: 2,
        likedByMe: false,
        time: '1d ago',
      },
      {
        id: 502,
        author: 'Mobile Care Workshop',
        initials: 'MC',
        avatarColor: '#10b981',
        text: 'I use 40kHz — gentle enough not to damage small components.',
        likes: 5,
        likedByMe: false,
        time: '1d ago',
      },
    ],
  },
  {
    id: 6,
    type: 'Solution',
    author: 'QuickFix Labs',
    initials: 'QL',
    avatarColor: '#7c3aed',
    device: 'Vivo Y73',
    title: 'Ghost touch fixed by replacing digitizer (not full LCD combo).',
    body: 'Customer had severe ghost touch on Vivo Y73. Instead of replacing the full LCD+touch combo (expensive), I carefully separated and replaced only the digitizer layer. Cost ₹380 instead of ₹1,800. Customer happy, profit margin better.',
    likes: 44,
    likedByMe: false,
    saved: false,
    createdAt: '6h ago',
    comments: [
      {
        id: 601,
        author: 'Tech Repair Hub',
        initials: 'TR',
        avatarColor: '#f59e0b',
        text: 'Great cost-saving move! Which glue did you use for rebonding?',
        likes: 6,
        likedByMe: false,
        time: '5h ago',
      },
    ],
  },
];

/* ─── Post Card Component ───────────────────────────── */
function PostCard({ post, onLike, onCommentLike, onAddComment, onSave, isHighlighted = false }) {
  const [expanded, setExpanded] = useState(isHighlighted);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isHighlighted) {
      setExpanded(true);
    }
  }, [isHighlighted]);

  const handleSend = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim(), replyTo?.id);
    setCommentText('');
    setReplyTo(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id={`post-${post.id}`}
      className="card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        border: isHighlighted ? '2px solid #2563eb' : undefined,
        boxShadow: isHighlighted ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : undefined,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top Header: Author, Type Badge, Device, Time, Save Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: post.avatarColor || '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {post.initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{post.author}</strong>
              {post.type === 'Question' && (
                <span className="status-badge badge-amber">
                  <HelpCircle size={11} /> QUESTION
                </span>
              )}
              {post.type === 'Solution' && (
                <span className="status-badge badge-green">
                  <CheckCircle2 size={11} /> SOLUTION
                </span>
              )}
              {post.type === 'Tip' && (
                <span className="status-badge badge-purple">
                  <Lightbulb size={11} /> TIP
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-badge badge-slate" style={{ fontSize: '11px', padding: '2px 8px' }}>
                <Smartphone size={11} /> {post.device}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {post.createdAt}
          </span>
          <button
            type="button"
            onClick={() => onSave(post.id)}
            title={post.saved ? 'Remove from Saved' : 'Save Discussion'}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 8px',
              color: post.saved ? '#2563eb' : '#94a3b8',
              background: post.saved ? '#eff6ff' : 'transparent',
              borderColor: post.saved ? '#bfdbfe' : 'transparent',
            }}
          >
            <Bookmark size={15} fill={post.saved ? '#2563eb' : 'none'} />
          </button>
        </div>
      </div>

      {/* Title & Body */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
          {post.title}
        </h3>
        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          {post.body}
        </p>
      </div>

      {/* Action Footer Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onLike(post.id)}
            style={{
              color: post.likedByMe ? '#2563eb' : 'inherit',
              background: post.likedByMe ? '#eff6ff' : undefined,
              borderColor: post.likedByMe ? '#bfdbfe' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ThumbsUp size={13} fill={post.likedByMe ? '#2563eb' : 'none'} />
            <span>{post.likes}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setExpanded((v) => !v);
              setTimeout(() => inputRef.current?.focus(), 120);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MessageCircle size={13} />
            <span>{post.comments.length} Comments</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success('Discussion link copied!');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <Share2 size={13} /> Share
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {expanded && (
        <div
          style={{
            background: 'var(--bg-surface-subtle)',
            borderRadius: '10px',
            padding: '14px',
            marginTop: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {post.comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', padding: '8px 0' }}>
              No comments yet. Share your technical recommendation!
            </div>
          ) : (
            post.comments.map((c) => (
              <div
                key={c.id}
                id={`comment-${c.id}`}
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: c.avatarColor || '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}
                >
                  {c.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>{c.author}</strong>
                      {c.replyToAuthor && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          replying to <strong style={{ color: '#2563eb' }}>@{c.replyToAuthor}</strong>
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 6px', lineHeight: 1.45 }}>
                    {c.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={() => onCommentLike(post.id, c.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: c.likedByMe ? '#2563eb' : '#94a3b8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <ThumbsUp size={11} fill={c.likedByMe ? '#2563eb' : 'none'} />
                      {c.likes > 0 && c.likes}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(c);
                        setCommentText(`@${c.author} `);
                        inputRef.current?.focus();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CornerDownRight size={11} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Quick Comment Input */}
          <div style={{ marginTop: '4px' }}>
            {replyTo && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#2563eb',
                  background: '#eff6ff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  marginBottom: '6px',
                }}
              >
                <span>Replying to <strong>{replyTo.author}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setCommentText('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                className="input-control"
                placeholder={replyTo ? `Reply to @${replyTo.author}...` : 'Write a solution or comment...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ height: '36px', fontSize: '12.5px' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={!commentText.trim()}
                style={{ height: '36px', padding: '0 14px' }}
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

/* ─── New Discussion Modal ──────────────────────────── */
function NewPostModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ type: 'Question', device: '', title: '', body: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Create Community Discussion
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Share your question, verified fix, or technical advice
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Discussion Type Selector */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">DISCUSSION TYPE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { type: 'Question', icon: HelpCircle, color: '#f59e0b' },
                { type: 'Solution', icon: CheckCircle2, color: '#10b981' },
                { type: 'Tip', icon: Lightbulb, color: '#7c3aed' },
              ].map(({ type, icon: Icon, color }) => {
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('type', type)}
                    style={{
                      border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
                      background: active ? `${color}10` : '#ffffff',
                      color: active ? color : '#64748b',
                      fontWeight: active ? '700' : '600',
                      borderRadius: '10px',
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} />
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Device / Brand</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. iPhone 14, Samsung S22, Oppo F15..."
              value={form.device}
              onChange={(e) => set('device', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Discussion Title *</label>
            <input
              type="text"
              className="input-control"
              placeholder="Summary of the issue or technique..."
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label">Technical Details *</label>
            <textarea
              className="input-control"
              placeholder="Describe symptoms, diagnostic findings, or step-by-step fix..."
              rows={4}
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={14} /> Publish Discussion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Community Sidebar Component ───────────────────── */
function CommunitySidebar({ posts }) {
  const topContributors = [
    { name: 'Mobile Care Workshop', initials: 'MC', color: '#10b981', posts: 24, rank: 1 },
    { name: 'Tech Repair Hub', initials: 'TR', color: '#f59e0b', posts: 18, rank: 2 },
    { name: 'ProTech Service Hub', initials: 'PT', color: '#ec4899', posts: 15, rank: 3 },
    { name: 'QuickFix Labs', initials: 'QL', color: '#7c3aed', posts: 11, rank: 4 },
    { name: 'Galaxy Fix Centre', initials: 'GF', color: '#2563eb', posts: 9, rank: 5 },
  ];

  const trendingDevices = [
    { device: 'iPhone 13 / 14 Series', count: 36 },
    { device: 'Samsung Galaxy S22 / S23', count: 27 },
    { device: 'Oppo F Series', count: 19 },
    { device: 'Redmi Note 12 / 13', count: 14 },
    { device: 'Vivo Y / V Series', count: 11 },
  ];

  const stats = [
    { label: 'Discussions', value: '12.6K', color: '#2563eb' },
    { label: 'Technicians', value: '1.4K', color: '#10b981' },
    { label: 'Solutions', value: '60', color: '#0284c7' },
    { label: 'Pro Tips', value: '66', color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Community Stats Card */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart2 size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            Network Intelligence
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--bg-surface-subtle)',
                borderRadius: '10px',
                padding: '12px 10px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: '800', color: s.color, lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginTop: '3px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Contributors Card */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            Top Technicians
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {topContributors.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '800',
                  flexShrink: 0,
                  background:
                    c.rank === 1
                      ? '#fef3c7'
                      : c.rank === 2
                      ? '#f1f5f9'
                      : c.rank === 3
                      ? '#ffedd5'
                      : '#f8fafc',
                  color:
                    c.rank === 1
                      ? '#b45309'
                      : c.rank === 2
                      ? '#475569'
                      : c.rank === 3
                      ? '#c2410c'
                      : '#64748b',
                  border:
                    c.rank === 1
                      ? '1px solid #fde68a'
                      : c.rank === 2
                      ? '1px solid #cbd5e1'
                      : c.rank === 3
                      ? '1px solid #fed7aa'
                      : '1px solid var(--border-color)',
                }}
              >
                {c.rank}
              </div>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: c.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '800',
                  flexShrink: 0,
                }}
              >
                {c.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{c.posts} answers</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Devices Card */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={16} />
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
            Trending Hardware
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {trendingDevices.map((d, idx) => (
            <div
              key={d.device}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: idx < trendingDevices.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
                {d.device}
              </span>
              <span className="status-badge badge-blue" style={{ fontSize: '10.5px' }}>
                {d.count} topics
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technician Pro Tip Card */}
      <div
        className="card"
        style={{
          padding: '16px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <Sparkles size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ fontSize: '12px', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Technician Pro Tip
          </strong>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            Include exact model, board version, and multimeter diagnostic measurements in your post for faster peer verification!
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
export const CommunityPage = () => {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/community/posts');
      if (Array.isArray(res) && res.length > 0) {
        setPosts(res);
      } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Check URL query parameters for target post (e.g. from notification click /community?post=ID)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post');
    if (targetPostId) {
      setHighlightedPostId(targetPostId);
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
          const commentEl = document.querySelector(hash);
          if (commentEl) {
            commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
        const postEl = document.getElementById(`post-${targetPostId}`);
        if (postEl) {
          postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400);
    }
  }, [posts]);

  const filteredPosts = posts.filter((p) => {
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

  const handleLike = async (postId) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    try {
      const updatedPost = await api.post(`/community/posts/${postId}/like`);
      if (updatedPost?.id) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleSave = async (postId) => {
    try {
      const updatedPost = await api.post(`/community/posts/${postId}/save`);
      if (updatedPost?.id) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
        toast.success(updatedPost.saved ? 'Discussion saved to your bookmarks! 🔖' : 'Removed from saved');
      }
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const updatedPost = await api.post(`/community/posts/${postId}/comments/${commentId}/like`);
      if (updatedPost?.id) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleAddComment = async (postId, text, replyToCommentId = null) => {
    try {
      const updatedPost = await api.post(`/community/posts/${postId}/comments`, {
        text,
        replyToCommentId,
      });
      if (updatedPost?.id) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
        toast.success('Your reply has been posted!');
      }
    } catch (err) {
      toast.error('Failed to post reply');
    }
  };

  const handleNewPost = async (form) => {
    try {
      const createdPost = await api.post('/community/posts', form);
      if (createdPost?.id) {
        setPosts((prev) => [createdPost, ...prev]);
        toast.success('Your discussion is live in the community! 🎉');
      }
    } catch (err) {
      toast.error('Failed to publish discussion');
    }
  };

  return (
    <MainLayout title="Repair Community" subtitle="Engineer Network & Knowledge Base">
      {/* 1. Page Header matching all modules */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> KNOWLEDGE HUB & TECHNICAL NETWORK
          </div>
          <h1>Repair Community</h1>
          <p>Ask technical questions, share verified hardware solutions, and collaborate with fellow workshop engineers.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsNewPostOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> New Discussion
        </button>
      </div>

      {/* 2. Standard KPI Cards matching all modules */}
      <KpiCards
        columns={4}
        items={[
          {
            icon: <MessageCircle size={22} />,
            label: 'Total Discussions',
            value: posts.length,
            color: 'blue',
            accent: true,
            delta: 'Active',
            deltaColor: '#2563eb',
            sub: 'Community repair threads',
            onClick: () => setActiveFilter('All'),
          },
          {
            icon: <CheckCircle2 size={22} />,
            label: 'Verified Solutions',
            value: posts.filter((p) => p.type === 'Solution').length,
            color: 'emerald',
            accent: true,
            delta: 'Solved',
            deltaColor: '#059669',
            sub: 'Tested hardware fixes',
            onClick: () => setActiveFilter('Solutions'),
          },
          {
            icon: <HelpCircle size={22} />,
            label: 'Open Questions',
            value: posts.filter((p) => p.type === 'Question').length,
            color: 'amber',
            accent: true,
            delta: 'Troubleshooting',
            deltaColor: '#d97706',
            sub: 'Pending technician input',
            onClick: () => setActiveFilter('Questions'),
          },
          {
            icon: <Lightbulb size={22} />,
            label: 'Pro Bench Tips',
            value: posts.filter((p) => p.type === 'Tip').length,
            color: 'purple',
            accent: true,
            delta: 'Pro Guides',
            deltaColor: '#7c3aed',
            sub: 'Technician repair guides',
            onClick: () => setActiveFilter('Tips'),
          },
        ]}
      />

      {/* 3. Toolbar & Filters Card matching RepairBoardPage & CustomerListPage */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div className="status-filters">
            <button
              type="button"
              className={activeFilter === 'All' ? 'selected' : ''}
              onClick={() => setActiveFilter('All')}
            >
              All Topics ({posts.length})
            </button>
            <button
              type="button"
              className={activeFilter === 'Questions' ? 'selected' : ''}
              onClick={() => setActiveFilter('Questions')}
            >
              Questions ({posts.filter((p) => p.type === 'Question').length})
            </button>
            <button
              type="button"
              className={activeFilter === 'Solutions' ? 'selected' : ''}
              onClick={() => setActiveFilter('Solutions')}
            >
              Solutions ({posts.filter((p) => p.type === 'Solution').length})
            </button>
            <button
              type="button"
              className={activeFilter === 'Tips' ? 'selected' : ''}
              onClick={() => setActiveFilter('Tips')}
            >
              Pro Tips ({posts.filter((p) => p.type === 'Tip').length})
            </button>
          </div>

          <div className="input-wrapper" style={{ width: '300px' }}>
            <span className="input-icon">
              <Search size={15} />
            </span>
            <input
              type="text"
              className="input-control input-with-icon"
              placeholder="Search topics, problems, devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Layout (Discussions Feed + Sticky Sidebar) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Discussions Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPosts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <MessageCircle size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                No discussions found
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery
                  ? `No discussions matching "${searchQuery}". Try different keywords or reset search.`
                  : 'Be the first technician to start a community discussion!'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsNewPostOpen(true)}
              >
                <Plus size={16} /> New Discussion
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                onCommentLike={handleCommentLike}
                onAddComment={handleAddComment}
                isHighlighted={String(post.id) === String(highlightedPostId)}
              />
            ))
          )}
        </div>

        {/* Right Column: Sidebar Cards */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <CommunitySidebar posts={posts} />
        </div>
      </div>

      {/* 5. New Discussion Modal */}
      {isNewPostOpen && (
        <NewPostModal onClose={() => setIsNewPostOpen(false)} onSubmit={handleNewPost} />
      )}
    </MainLayout>
  );
};
