import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    authorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorShop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    initials: { type: String, default: 'TE' },
    avatarColor: { type: String, default: '#2563eb' },
    text: { type: String, required: true, trim: true },
    replyToCommentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    replyToAuthor: { type: String, default: '' },
    replyToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Question', 'Solution', 'Tip'], default: 'Question' },
    author: { type: String, required: true },
    authorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorShop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    initials: { type: String, default: 'AD' },
    avatarColor: { type: String, default: '#2563eb' },
    device: { type: String, default: 'General Device', trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
