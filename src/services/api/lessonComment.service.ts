import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { LessonComment, LessonCommentReply } from '@/types/api';

export const lessonCommentService = {
  fetchComments: async (courseId: string, lessonId: string) => {
    const res = await apiClient.get<LessonComment[]>(
      API_ENDPOINTS.LESSON_COMMENTS.BY_LESSON(courseId, lessonId)
    );
    return res.data;
  },

  addComment: async (courseId: string, lessonId: string, body: string) => {
    const res = await apiClient.post<LessonComment>(
      API_ENDPOINTS.LESSON_COMMENTS.BY_LESSON(courseId, lessonId),
      { body }
    );
    return res.data;
  },

  addReply: async (
    courseId: string,
    lessonId: string,
    commentId: string,
    body: string
  ) => {
    const res = await apiClient.post<LessonCommentReply>(
      API_ENDPOINTS.LESSON_COMMENTS.REPLY(courseId, lessonId, commentId),
      { body }
    );
    return res.data;
  },
};

