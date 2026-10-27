import { CommunityService } from './community.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

const communityService = new CommunityService();

export class CommunityController {
  async getPosts(req, res, next) {
    try {
      const posts = await communityService.getPosts(req.user);
      return sendSuccess(res, posts);
    } catch (err) {
      next(err);
    }
  }

  async createPost(req, res, next) {
    try {
      const post = await communityService.createPost(req.user, req.body);
      return sendCreated(res, post, 'Discussion created successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const post = await communityService.toggleLike(req.user, req.params.id);
      return sendSuccess(res, post);
    } catch (err) {
      next(err);
    }
  }

  async addComment(req, res, next) {
    try {
      const post = await communityService.addComment(req.user, req.params.id, req.body);
      return sendCreated(res, post, 'Comment added successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleCommentLike(req, res, next) {
    try {
      const post = await communityService.toggleCommentLike(req.user, req.params.id, req.params.commentId);
      return sendSuccess(res, post);
    } catch (err) {
      next(err);
    }
  }

  async toggleSave(req, res, next) {
    try {
      const post = await communityService.toggleSave(req.user, req.params.id);
      return sendSuccess(res, post);
    } catch (err) {
      next(err);
    }
  }
}
