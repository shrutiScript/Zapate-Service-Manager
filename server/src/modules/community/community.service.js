import { Post } from './community.model.js';
import { Notification } from '../notifications/notification.model.js';
import { User } from '../users/user.model.js';
import { Shop } from '../shops/shop.model.js';

function formatRelativeTime(date) {
  if (!date) return 'just now';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const DEFAULT_SEEDS = [
  {
    type: 'Question',
    author: 'Apex Devices Hub',
    initials: 'AD',
    avatarColor: '#2563eb',
    device: 'Oppo F15',
    title: 'Fingerprint not working after display replacement.',
    body: "I replaced the display, but fingerprint is no longer detecting. Has anyone faced this issue? The sensor physically looks intact but software doesn't register any touch.",
    likesCount: 12,
    comments: [
      {
        author: 'Mobile Care Workshop',
        initials: 'MC',
        avatarColor: '#10b981',
        text: 'Try checking the fingerprint flex connector — it may have gotten pinched during reassembly.',
        likesCount: 4,
      },
      {
        author: 'Tech Repair Hub',
        initials: 'TR',
        avatarColor: '#f59e0b',
        text: 'Also verify whether the replacement display is compatible with the original fingerprint sensor. Some OEM panels pair the display to the FP sensor digitally.',
        likesCount: 7,
      },
    ],
  },
  {
    type: 'Solution',
    author: 'Galaxy Fix Centre',
    initials: 'GF',
    avatarColor: '#059669',
    device: 'Samsung S22 Ultra',
    title: 'S-Pen not detected — fixed by reseating digitizer cable.',
    body: 'After water damage, the S-Pen stopped responding. Opened it up and found the digitizer ribbon cable had lifted slightly on one corner. Reseated it with gentle pressure + heat and it\'s working perfectly now.',
    likesCount: 34,
    comments: [
      {
        author: 'QuickFix Labs',
        initials: 'QL',
        avatarColor: '#7c3aed',
        text: 'This saved me! Had the exact same issue on an S21 FE. Reseating worked like a charm.',
        likesCount: 11,
      },
    ],
  },
  {
    type: 'Tip',
    author: 'ProTech Service Hub',
    initials: 'PT',
    avatarColor: '#7c3aed',
    device: 'iPhone 13 Pro',
    title: 'Always use Face ID calibration after screen swap on iPhone 13+.',
    body: 'Transfer the original flood illuminator / proximity sensor assembly carefully. If the ambient light sensor is damaged, auto-brightness and True Tone will be permanently lost even if Face ID is reprogrammed.',
    likesCount: 58,
    comments: [],
  },
];

export class CommunityService {
  async ensureSeed() {
    const count = await Post.countDocuments();
    if (count === 0) {
      for (const s of DEFAULT_SEEDS) {
        await Post.create({
          type: s.type,
          author: s.author,
          initials: s.initials,
          avatarColor: s.avatarColor,
          device: s.device,
          title: s.title,
          body: s.body,
          likes: [],
          savedBy: [],
          comments: (s.comments || []).map((c) => ({
            author: c.author,
            initials: c.initials,
            avatarColor: c.avatarColor,
            text: c.text,
            likes: [],
            createdAt: new Date(),
          })),
        });
      }
    }
  }

  async getPosts(currentUser = null) {
    await this.ensureSeed();
    const posts = await Post.find().sort({ createdAt: -1 });
    const currentUserId = currentUser?._id?.toString();

    return posts.map((p) => {
      const likedByMe = currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false;
      const saved = currentUserId ? p.savedBy.some((id) => id.toString() === currentUserId) : false;

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        type: p.type,
        author: p.author,
        authorUser: p.authorUser ? p.authorUser.toString() : null,
        authorShop: p.authorShop ? p.authorShop.toString() : null,
        initials: p.initials,
        avatarColor: p.avatarColor,
        device: p.device,
        title: p.title,
        body: p.body,
        likes: p.likes.length,
        likedByMe,
        saved,
        createdAt: formatRelativeTime(p.createdAt),
        createdAtRaw: p.createdAt,
        comments: p.comments.map((c) => ({
          id: c._id.toString(),
          _id: c._id.toString(),
          author: c.author,
          authorUser: c.authorUser ? c.authorUser.toString() : null,
          authorShop: c.authorShop ? c.authorShop.toString() : null,
          initials: c.initials,
          avatarColor: c.avatarColor,
          text: c.text,
          replyToCommentId: c.replyToCommentId ? c.replyToCommentId.toString() : null,
          replyToAuthor: c.replyToAuthor,
          likes: c.likes.length,
          likedByMe: currentUserId ? c.likes.some((id) => id.toString() === currentUserId) : false,
          time: formatRelativeTime(c.createdAt),
          createdAtRaw: c.createdAt,
        })),
      };
    });
  }

  async createPost(currentUser, data) {
    const COLORS = ['#2563eb', '#10b981', '#7c3aed', '#f59e0b', '#0284c7', '#ea580c'];
    const authorName = currentUser.shop?.name || currentUser.name || 'Technician';
    const initials = (authorName.trim().slice(0, 2)).toUpperCase() || 'TE';
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const post = await Post.create({
      type: data.type || 'Question',
      author: authorName,
      authorUser: currentUser._id,
      authorShop: currentUser.shopId || currentUser.shop?._id || null,
      initials,
      avatarColor: randomColor,
      device: data.device?.trim() || 'General Device',
      title: data.title.trim(),
      body: data.body.trim(),
      likes: [],
      savedBy: [],
      comments: [],
    });

    // Notify other active workshops / users with community access
    try {
      const activeShops = await Shop.find({
        status: 'ACTIVE',
        subscriptionStatus: { $ne: 'EXPIRED' },
        _id: { $ne: currentUser.shopId },
      });

      for (const targetShop of activeShops) {
        // Workshop access rules: ensure community module is not disabled for this shop
        if (Array.isArray(targetShop.enabledModules) && !targetShop.enabledModules.includes('community')) {
          continue;
        }

        // Find users for this shop
        const targetUsers = await User.find({ shopId: targetShop._id, status: 'ACTIVE' });
        const shortTitle = post.title.length > 50 ? `${post.title.slice(0, 47)}...` : post.title;

        if (targetUsers.length > 0) {
          for (const u of targetUsers) {
            await Notification.create({
              recipientName: u.name,
              recipientContact: u.mobile || '',
              channel: 'In-App',
              type: 'Community Post',
              title: 'New Community Discussion',
              message: `${authorName} published a new ${post.type.toLowerCase()}: "${shortTitle}"`,
              status: 'Delivered',
              sentAt: new Date(),
              shopId: targetShop._id,
              userId: u._id,
              postId: post._id.toString(),
              link: `/community?post=${post._id}`,
              actionType: 'COMMUNITY_POST',
              actorName: authorName,
              actorShopId: currentUser.shopId || null,
              actorUserId: currentUser._id,
            });
          }
        } else {
          await Notification.create({
            recipientName: targetShop.ownerName || targetShop.name,
            recipientContact: targetShop.ownerMobile || '',
            channel: 'In-App',
            type: 'Community Post',
            title: 'New Community Discussion',
            message: `${authorName} published a new ${post.type.toLowerCase()}: "${shortTitle}"`,
            status: 'Delivered',
            sentAt: new Date(),
            shopId: targetShop._id,
            postId: post._id.toString(),
            link: `/community?post=${post._id}`,
            actionType: 'COMMUNITY_POST',
            actorName: authorName,
            actorShopId: currentUser.shopId || null,
            actorUserId: currentUser._id,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch new post notifications:', notifErr);
    }

    return this.getPostById(post._id, currentUser);
  }

  async getPostById(postId, currentUser = null) {
    const p = await Post.findById(postId);
    if (!p) return null;
    const currentUserId = currentUser?._id?.toString();
    const likedByMe = currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false;
    const saved = currentUserId ? p.savedBy.some((id) => id.toString() === currentUserId) : false;

    return {
      id: p._id.toString(),
      _id: p._id.toString(),
      type: p.type,
      author: p.author,
      authorUser: p.authorUser ? p.authorUser.toString() : null,
      authorShop: p.authorShop ? p.authorShop.toString() : null,
      initials: p.initials,
      avatarColor: p.avatarColor,
      device: p.device,
      title: p.title,
      body: p.body,
      likes: p.likes.length,
      likedByMe,
      saved,
      createdAt: formatRelativeTime(p.createdAt),
      createdAtRaw: p.createdAt,
      comments: p.comments.map((c) => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        author: c.author,
        authorUser: c.authorUser ? c.authorUser.toString() : null,
        authorShop: c.authorShop ? c.authorShop.toString() : null,
        initials: c.initials,
        avatarColor: c.avatarColor,
        text: c.text,
        replyToCommentId: c.replyToCommentId ? c.replyToCommentId.toString() : null,
        replyToAuthor: c.replyToAuthor,
        likes: c.likes.length,
        likedByMe: currentUserId ? c.likes.some((id) => id.toString() === currentUserId) : false,
        time: formatRelativeTime(c.createdAt),
        createdAtRaw: c.createdAt,
      })),
    };
  }

  async toggleLike(currentUser, postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const currentUserId = currentUser._id.toString();
    const existingIndex = post.likes.findIndex((id) => id.toString() === currentUserId);
    const isLiking = existingIndex === -1;

    if (isLiking) {
      post.likes.push(currentUser._id);
    } else {
      post.likes.splice(existingIndex, 1);
    }

    await post.save();

    // Trigger notification if user liked another user's post
    if (isLiking) {
      const isOwner = post.authorUser && post.authorUser.toString() === currentUserId;
      if (!isOwner && post.authorUser) {
        // Prevent duplicate notifications
        const existing = await Notification.findOne({
          actionType: 'COMMUNITY_LIKE',
          postId: post._id.toString(),
          actorUserId: currentUser._id,
        });

        if (!existing) {
          const likerName = currentUser.shop?.name || currentUser.name || 'A technician';
          const shortTitle = post.title.length > 40 ? `${post.title.slice(0, 37)}...` : post.title;

          await Notification.create({
            recipientName: post.author,
            recipientContact: '',
            channel: 'In-App',
            type: 'Community Like',
            title: 'New Post Like',
            message: `${likerName} liked your discussion "${shortTitle}"`,
            status: 'Delivered',
            sentAt: new Date(),
            shopId: post.authorShop || null,
            userId: post.authorUser,
            postId: post._id.toString(),
            link: `/community?post=${post._id}`,
            actionType: 'COMMUNITY_LIKE',
            actorName: likerName,
            actorShopId: currentUser.shopId || null,
            actorUserId: currentUser._id,
          });
        }
      }
    }

    return this.getPostById(postId, currentUser);
  }

  async addComment(currentUser, postId, { text, replyToCommentId = null }) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const authorName = currentUser.shop?.name || currentUser.name || 'Technician';
    const initials = (authorName.trim().slice(0, 2)).toUpperCase() || 'TE';
    const currentUserId = currentUser._id.toString();

    let replyToAuthor = '';
    let replyToUser = null;
    let replyToShop = null;

    if (replyToCommentId) {
      const origComment = post.comments.id(replyToCommentId);
      if (origComment) {
        replyToAuthor = origComment.author;
        replyToUser = origComment.authorUser;
        replyToShop = origComment.authorShop;
      }
    }

    const newComment = {
      author: authorName,
      authorUser: currentUser._id,
      authorShop: currentUser.shopId || currentUser.shop?._id || null,
      initials,
      avatarColor: '#2563eb',
      text: text.trim(),
      replyToCommentId: replyToCommentId || null,
      replyToAuthor,
      replyToUser,
      likes: [],
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const createdComment = post.comments[post.comments.length - 1];
    const shortTitle = post.title.length > 40 ? `${post.title.slice(0, 37)}...` : post.title;

    try {
      // 1. If this is a reply to another comment, notify the original commenter
      if (replyToCommentId && replyToUser && replyToUser.toString() !== currentUserId) {
        await Notification.create({
          recipientName: replyToAuthor,
          recipientContact: '',
          channel: 'In-App',
          type: 'Community Reply',
          title: 'New Reply to Your Comment',
          message: `${authorName} replied to your comment on "${shortTitle}"`,
          status: 'Delivered',
          sentAt: new Date(),
          shopId: replyToShop || null,
          userId: replyToUser,
          postId: post._id.toString(),
          commentId: createdComment._id.toString(),
          link: `/community?post=${post._id}#comment-${createdComment._id}`,
          actionType: 'COMMUNITY_REPLY',
          actorName: authorName,
          actorShopId: currentUser.shopId || null,
          actorUserId: currentUser._id,
        });
      }

      // 2. Also notify post owner if post owner is neither commenter nor the original commenter
      const isPostOwner = post.authorUser && post.authorUser.toString() === currentUserId;
      const isOriginalCommenter = replyToUser && post.authorUser && replyToUser.toString() === post.authorUser.toString();

      if (!isPostOwner && !isOriginalCommenter && post.authorUser) {
        await Notification.create({
          recipientName: post.author,
          recipientContact: '',
          channel: 'In-App',
          type: 'Community Comment',
          title: 'New Comment on Discussion',
          message: `${authorName} commented on your discussion "${shortTitle}"`,
          status: 'Delivered',
          sentAt: new Date(),
          shopId: post.authorShop || null,
          userId: post.authorUser,
          postId: post._id.toString(),
          commentId: createdComment._id.toString(),
          link: `/community?post=${post._id}#comment-${createdComment._id}`,
          actionType: 'COMMUNITY_COMMENT',
          actorName: authorName,
          actorShopId: currentUser.shopId || null,
          actorUserId: currentUser._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch comment notification:', notifErr);
    }

    return this.getPostById(postId, currentUser);
  }

  async toggleCommentLike(currentUser, postId, commentId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const comment = post.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');

    const currentUserId = currentUser._id.toString();
    const existingIndex = comment.likes.findIndex((id) => id.toString() === currentUserId);

    if (existingIndex === -1) {
      comment.likes.push(currentUser._id);
    } else {
      comment.likes.splice(existingIndex, 1);
    }

    await post.save();
    return this.getPostById(postId, currentUser);
  }

  async toggleSave(currentUser, postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const currentUserId = currentUser._id.toString();
    const existingIndex = post.savedBy.findIndex((id) => id.toString() === currentUserId);

    if (existingIndex === -1) {
      post.savedBy.push(currentUser._id);
    } else {
      post.savedBy.splice(existingIndex, 1);
    }

    await post.save();
    return this.getPostById(postId, currentUser);
  }
}
