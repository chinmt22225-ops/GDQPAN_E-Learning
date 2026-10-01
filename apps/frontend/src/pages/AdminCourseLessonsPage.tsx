import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  FileQuestion,
  Video,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  X,
  Save,
  Check,
  UploadCloud,
  Film,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface LessonAdminItem {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  videoKey?: string;
  videoDurationSeconds: number;
  minCoveragePercent: number;
  passScore: number;
  totalQuestionsPerQuiz: number;
  active: boolean;
  questionCount: number;
  createdAt: string;
}

interface QuestionChoice {
  id: string;
  text: string;
}

interface QuestionAdminItem {
  _id: string;
  lessonId: string;
  courseId: string;
  text: string;
  choices: QuestionChoice[];
  correctIds: string[];
  explanation?: string;
  active: boolean;
  createdAt: string;
}

export const AdminCourseLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<LessonAdminItem[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<LessonAdminItem | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    order: 1,
    videoKey: '',
    videoDurationMinutes: 15,
    minCoveragePercent: 95,
    passScore: 8,
    totalQuestionsPerQuiz: 10,
    active: true,
  });
  const [savingLesson, setSavingLesson] = useState<boolean>(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Delete Lesson State
  const [deletingLesson, setDeletingLesson] = useState<LessonAdminItem | null>(null);
  const [deletingLessonLoading, setDeletingLessonLoading] = useState<boolean>(false);

  // Question Bank Modal / Drawer State
  const [selectedLessonForQuestions, setSelectedLessonForQuestions] = useState<LessonAdminItem | null>(null);
  const [questions, setQuestions] = useState<QuestionAdminItem[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState<boolean>(false);

  // Question Form State (Add / Edit)
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionAdminItem | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    choices: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctId: 'A',
    explanation: '',
    active: true,
  });
  const [savingQuestion, setSavingQuestion] = useState<boolean>(false);
  const [questionFormError, setQuestionFormError] = useState<string | null>(null);

  // Question Import Excel State
  const [isQuestionImportModalOpen, setIsQuestionImportModalOpen] = useState<boolean>(false);
  const [questionImportFile, setQuestionImportFile] = useState<File | null>(null);
  const [questionImporting, setQuestionImporting] = useState<boolean>(false);
  const [questionImportMessage, setQuestionImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Video Upload & Management Modal State
  const [videoModalLesson, setVideoModalLesson] = useState<LessonAdminItem | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number>(0);
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [videoTab, setVideoTab] = useState<'upload' | 'url' | 'server'>('upload');
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [serverVideos, setServerVideos] = useState<
    Array<{
      filename: string;
      sizeMB: number;
      group: string;
      durationSeconds: number;
      durationFormatted: string;
    }>
  >([]);
  const [selectedServerVideo, setSelectedServerVideo] = useState<string>('');
  const [loadingServerVideos, setLoadingServerVideos] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  const fetchLessons = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [resLessons, resCourses] = await Promise.all([
        apiRequest<LessonAdminItem[]>(`/api/admin/courses/${courseId}/lessons`),
        apiRequest<any[]>('/api/admin/courses'),
      ]);

      if (resLessons.success && resLessons.data) {
        setLessons(resLessons.data);
      }
      if (resCourses.success && resCourses.data) {
        const currentCourse = resCourses.data.find((c) => c._id === courseId);
        if (currentCourse) {
          setCourseTitle(`${currentCourse.code} - ${currentCourse.title}`);
        }
      }
    } catch (err: unknown) {
      console.error('Lỗi tải bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLessons();
    }
  }, [courseId, user]);

  // ============================================
  // LESSON HANDLERS
  // ============================================

  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order)) + 1 : 1;
    setLessonFormData({
      title: '',
      order: nextOrder,
      videoKey: '',
      videoDurationMinutes: 15,
      minCoveragePercent: 95,
      passScore: 8,
      totalQuestionsPerQuiz: 10,
      active: true,
    });
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonAdminItem) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      order: lesson.order,
      videoKey: lesson.videoKey || '',
      videoDurationMinutes: Math.round(lesson.videoDurationSeconds / 60) || 15,
      minCoveragePercent: Math.round(lesson.minCoveragePercent * 100),
      passScore: lesson.passScore || 8,
      totalQuestionsPerQuiz: lesson.totalQuestionsPerQuiz || 10,
      active: lesson.active,
    });
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormData.title.trim()) {
      setLessonError('Tên bài học không được để trống.');
      return;
    }

    setSavingLesson(true);
    setLessonError(null);

    const payload = {
      title: lessonFormData.title.trim(),
      order: Number(lessonFormData.order),
      videoKey: lessonFormData.videoKey.trim(),
      videoDurationSeconds:
        editingLesson &&
        lessonFormData.videoKey === editingLesson.videoKey &&
        editingLesson.videoDurationSeconds > 0
          ? editingLesson.videoDurationSeconds
          : Number(lessonFormData.videoDurationMinutes) * 60,
      minCoveragePercent: Number(lessonFormData.minCoveragePercent) / 100,
      passScore: Number(lessonFormData.passScore),
      totalQuestionsPerQuiz: Number(lessonFormData.totalQuestionsPerQuiz),
      active: lessonFormData.active,
    };

    try {
      if (editingLesson) {
        const res = await apiRequest(`/api/admin/lessons/${editingLesson._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setIsLessonModalOpen(false);
          fetchLessons();
        } else {
          setLessonError(res.message || 'Không thể cập nhật bài học.');
        }
      } else {
        const res = await apiRequest(`/api/admin/courses/${courseId}/lessons`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setIsLessonModalOpen(false);
          fetchLessons();
        } else {
          setLessonError(res.message || 'Không thể tạo bài học.');
        }
      }
    } catch (err: unknown) {
      setLessonError((err as Error).message || 'Đã xảy ra lỗi.');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    setDeletingLessonLoading(true);
    try {
      const res = await apiRequest(`/api/admin/lessons/${deletingLesson._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setDeletingLesson(null);
        fetchLessons();
      } else {
        alert(res.message || 'Không thể xóa bài học.');
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi xóa bài học.');
    } finally {
      setDeletingLessonLoading(false);
    }
  };

  // ============================================
  // VIDEO MANAGEMENT HANDLERS (PHASE 2)
  // ============================================

  const fetchServerVideos = async () => {
    setLoadingServerVideos(true);
    try {
      const res = await apiRequest<
        Array<{
          filename: string;
          sizeMB: number;
          group: string;
          durationSeconds: number;
          durationFormatted: string;
        }>
      >('/api/admin/server-videos');
      if (res.success && res.data) {
        setServerVideos(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingServerVideos(false);
    }
  };

  const handleOpenVideoModal = (lesson: LessonAdminItem) => {
    setVideoModalLesson(lesson);
    setVideoFile(null);
    setVideoUrlInput(
      lesson.videoKey && (lesson.videoKey.startsWith('http://') || lesson.videoKey.startsWith('https://'))
        ? lesson.videoKey
        : ''
    );
    setSelectedServerVideo(lesson.videoKey || '');
    setVideoDurationSeconds(lesson.videoDurationSeconds || 0);
    setVideoUploadProgress(0);
    setVideoUploading(false);
    setVideoUploadError(null);
    setVideoTab('upload');
    fetchServerVideos();
  };

  const handleUploadVideoFile = () => {
    if (!videoModalLesson || !videoFile) {
      setVideoUploadError('Vui lòng chọn file video (.mp4, .webm, .mov) cần tải lên.');
      return;
    }

    setVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadError(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('videoDurationSeconds', String(videoDurationSeconds || 0));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/lessons/${videoModalLesson._id}/video`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setVideoUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setVideoUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        alert('Tải lên video bài giảng thành công!');
        setVideoModalLesson(null);
        setVideoFile(null);
        fetchLessons();
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          const msg = err.message || 'Lỗi khi tải video lên máy chủ.';
          setVideoUploadError(msg);
          if (xhr.status === 401) {
            alert('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục tải video.');
            navigate('/admin/login');
          } else {
            alert(`Lỗi tải video (${xhr.status}): ${msg}`);
          }
        } catch {
          const msg = `Lỗi máy chủ (${xhr.status}) trong quá trình tải video. Vui lòng thử lại.`;
          setVideoUploadError(msg);
          alert(msg);
        }
      }
    };

    xhr.onerror = () => {
      setVideoUploading(false);
      const msg = 'Lỗi kết nối mạng trong quá trình upload video. Vui lòng kiểm tra lại kết nối.';
      setVideoUploadError(msg);
      alert(msg);
    };

    xhr.send(formData);
  };

  const handleSelectServerVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoModalLesson || !selectedServerVideo) {
      setVideoUploadError('Vui lòng chọn một video từ danh sách.');
      return;
    }

    setVideoUploading(true);
    setVideoUploadError(null);

    try {
      const res = await apiRequest(`/api/admin/lessons/${videoModalLesson._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          videoKey: selectedServerVideo,
          videoDurationSeconds: videoDurationSeconds || 0,
        }),
      });

      if (res.success) {
        alert(`Đã cập nhật bài học với video: ${selectedServerVideo}`);
        setVideoModalLesson(null);
        fetchLessons();
      } else {
        setVideoUploadError(res.message || 'Không thể liên kết video.');
      }
    } catch (err: unknown) {
      setVideoUploadError((err as Error).message || 'Đã xảy ra lỗi.');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSaveVideoUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoModalLesson) return;

    if (!videoUrlInput.trim()) {
      setVideoUploadError('Vui lòng nhập đường dẫn Cloudflare R2 / CDN hoặc link video.');
      return;
    }

    setVideoUploading(true);
    setVideoUploadError(null);

    try {
      const res = await apiRequest(`/api/admin/lessons/${videoModalLesson._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          videoKey: videoUrlInput.trim(),
          videoDurationSeconds: videoDurationSeconds || 0,
        }),
      });

      if (res.success) {
        alert('Đã cập nhật link video bài giảng thành công!');
        setVideoModalLesson(null);
        fetchLessons();
      } else {
        setVideoUploadError(res.message || 'Không thể lưu đường dẫn video.');
      }
    } catch (err: unknown) {
      setVideoUploadError((err as Error).message || 'Đã xảy ra lỗi.');
    } finally {
      setVideoUploading(false);
    }
  };

  // ============================================
  // QUESTION BANK HANDLERS
  // ============================================

  const fetchQuestions = async (lessonId: string) => {
    setQuestionsLoading(true);
    try {
      const res = await apiRequest<QuestionAdminItem[]>(
        `/api/admin/lessons/${lessonId}/questions`
      );
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải câu hỏi:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleOpenQuestionsModal = (lesson: LessonAdminItem) => {
    setSelectedLessonForQuestions(lesson);
    setIsQuestionFormOpen(false);
    setEditingQuestion(null);
    fetchQuestions(lesson._id);
  };

  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      text: '',
      choices: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctId: 'A',
      explanation: '',
      active: true,
    });
    setQuestionFormError(null);
    setIsQuestionFormOpen(true);
  };

  const handleOpenEditQuestion = (q: QuestionAdminItem) => {
    setEditingQuestion(q);
    const existingChoices =
      q.choices && q.choices.length >= 2
        ? q.choices
        : [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
          ];

    setQuestionFormData({
      text: q.text,
      choices: existingChoices,
      correctId: q.correctIds[0] || 'A',
      explanation: q.explanation || '',
      active: q.active,
    });
    setQuestionFormError(null);
    setIsQuestionFormOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonForQuestions) return;

    if (!questionFormData.text.trim()) {
      setQuestionFormError('Nội dung câu hỏi không được để trống.');
      return;
    }

    const emptyChoice = questionFormData.choices.some((c) => !c.text.trim());
    if (emptyChoice) {
      setQuestionFormError('Vui lòng nhập đầy đủ nội dung cho tất cả 4 đáp án A, B, C, D.');
      return;
    }

    setSavingQuestion(true);
    setQuestionFormError(null);

    const payload = {
      text: questionFormData.text.trim(),
      choices: questionFormData.choices.map((c) => ({ id: c.id, text: c.text.trim() })),
      correctIds: [questionFormData.correctId],
      explanation: questionFormData.explanation.trim(),
      active: questionFormData.active,
    };

    try {
      if (editingQuestion) {
        const res = await apiRequest(`/api/admin/questions/${editingQuestion._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          setIsQuestionFormOpen(false);
          fetchQuestions(selectedLessonForQuestions._id);
          fetchLessons();
        } else {
          setQuestionFormError(res.message || 'Không thể cập nhật câu hỏi.');
        }
      } else {
        const res = await apiRequest(
          `/api/admin/lessons/${selectedLessonForQuestions._id}/questions`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
        if (res.success) {
          setIsQuestionFormOpen(false);
          fetchQuestions(selectedLessonForQuestions._id);
          fetchLessons();
        } else {
          setQuestionFormError(res.message || 'Không thể tạo câu hỏi mới.');
        }
      }
    } catch (err: unknown) {
      setQuestionFormError((err as Error).message || 'Đã xảy ra lỗi.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedLessonForQuestions) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng đề?')) return;

    try {
      const res = await apiRequest(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        fetchQuestions(selectedLessonForQuestions._id);
        fetchLessons();
      } else {
        alert(res.message || 'Không thể xóa câu hỏi.');
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi xóa câu hỏi.');
    }
  };

  // Nạp câu hỏi từ file Excel (.xlsx)
  const handleImportQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonForQuestions || !questionImportFile) return;

    setQuestionImporting(true);
    setQuestionImportMessage(null);

    try {
      const arrayBuffer = await questionImportFile.arrayBuffer();
      const res = await fetch(`/api/admin/lessons/${selectedLessonForQuestions._id}/questions/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: arrayBuffer,
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Lỗi khi nạp file câu hỏi Excel.');
      }

      setQuestionImportMessage({
        type: 'success',
        text: json.message || 'Đã nạp thành công câu hỏi vào ngân hàng đề!',
      });
      setQuestionImportFile(null);
      fetchQuestions(selectedLessonForQuestions._id);
      fetchLessons();
    } catch (err: unknown) {
      setQuestionImportMessage({
        type: 'error',
        text: (err as Error).message || 'Lỗi khi nạp file câu hỏi Excel.',
      });
    } finally {
      setQuestionImporting(false);
    }
  };

  // Nạp 10 câu hỏi GDQP&AN mẫu chuẩn
  const handleSeedSampleQuestions = async () => {
    if (!selectedLessonForQuestions) return;
    if (!window.confirm(`Bạn muốn nạp tự động 10 câu hỏi mẫu chuẩn GDQP&AN vào bài học "${selectedLessonForQuestions.title}"?`)) {
      return;
    }

    const sampleQuestions = [
      {
        text: 'Nền quốc phòng toàn dân của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam mang tính chất gì?',
        choices: [
          { id: 'A', text: 'Mang tính chất hòa bình, tự vệ và mang tính nhân dân sâu sắc.' },
          { id: 'B', text: 'Mang tính chất răn đe quân sự và can thiệp vũ trang khu vực.' },
          { id: 'C', text: 'Mang tính chất liên minh phòng thủ chung với các cường quốc.' },
          { id: 'D', text: 'Mang tính chất thường trực tác chiến và sẵn sàng xuất khẩu quân sự.' },
        ],
        correctIds: ['A'],
        explanation: 'Điều 7 Luật Quốc phòng quy định: Nền quốc phòng toàn dân của Việt Nam là nền quốc phòng toàn dân, toàn diện, độc lập, tự chủ, mang tính chất hòa bình, tự vệ và tính nhân dân sâu sắc.',
      },
      {
        text: 'Quan điểm cơ bản của Đảng ta về xây dựng lực lượng vũ trang nhân dân Việt Nam là gì?',
        choices: [
          { id: 'A', text: 'Ưu tiên phát triển số lượng quân số thường trực càng đông càng tốt.' },
          { id: 'B', text: 'Xây dựng quân đội tinh, gọn, mạnh, tiến lên hiện đại, đặt dưới sự lãnh đạo tuyệt đối, trực tiếp về mọi mặt của Đảng.' },
          { id: 'C', text: 'Nhập khẩu 100% vũ khí trang bị kỹ thuật tối tân từ các khối liên minh.' },
          { id: 'D', text: 'Tách lực lượng vũ trang khỏi sự quản lý của Nhà nước để tăng tính độc lập.' },
        ],
        correctIds: ['B'],
        explanation: 'Đảng Cộng sản Việt Nam giữ vững nguyên tắc lãnh đạo tuyệt đối, trực tiếp về mọi mặt đối với Quân đội nhân dân và Công an nhân dân, xây dựng lực lượng tinh gọn mạnh, tiến lên hiện đại.',
      },
      {
        text: 'Nội dung nào sau đây là một trong các bộ phận hợp thành Lực lượng vũ trang nhân dân Việt Nam?',
        choices: [
          { id: 'A', text: 'Quân đội nhân dân, Công an nhân dân và Dân quân tự vệ.' },
          { id: 'B', text: 'Quân đội nhân dân và Cảnh sát giao thông đô thị.' },
          { id: 'C', text: 'Lực lượng bảo vệ cơ quan tư nhân và Dân phòng tự quản.' },
          { id: 'D', text: 'Lực lượng cựu chiến binh và Thanh niên xung phong các thời kỳ.' },
        ],
        correctIds: ['A'],
        explanation: 'Theo Luật Quốc phòng, Lực lượng vũ trang nhân dân Việt Nam gồm 3 bộ phận: Quân đội nhân dân, Công an nhân dân và Dân quân tự vệ.',
      },
      {
        text: 'Mục tiêu trọng yếu hàng đầu của chiến lược bảo vệ Tổ quốc Việt Nam Xã hội Chủ nghĩa hiện nay là gì?',
        choices: [
          { id: 'A', text: 'Giữ vững độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ và giữ vững môi trường hòa bình để phát triển đất nước.' },
          { id: 'B', text: 'Mở rộng ảnh hưởng địa chính trị và vùng kiểm soát lãnh hải quốc tế.' },
          { id: 'C', text: 'Cạnh tranh ưu thế quân sự vượt trội so với các nước láng giềng.' },
          { id: 'D', text: 'Tăng cường chạy đua vũ trang với ngân sách quốc phòng trên 50% GDP.' },
        ],
        correctIds: ['A'],
        explanation: 'Nghị quyết Trung ương 8 (khóa XI và XIII) xác định: Bảo vệ vững chắc độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ của Tổ quốc; bảo vệ Đảng, Nhà nước, nhân dân và chế độ XHCN; giữ vững hòa bình, ổn định để phát triển đất nước.',
      },
      {
        text: 'Âm mưu chủ yếu của chiến lược "Diễn biến hòa bình" do các thế lực thù địch tiến hành chống phá Việt Nam là gì?',
        choices: [
          { id: 'A', text: 'Sử dụng vũ lực quân sự tấn công bất ngờ từ bên ngoài vào biên giới.' },
          { id: 'B', text: 'Chuyển hóa chế độ chính trị của Việt Nam từ bên trong bằng các biện pháp phi quân sự kết hợp bạo loạn lật đổ.' },
          { id: 'C', text: 'Cấm vận phong tỏa toàn diện đường hàng hải quốc tế.' },
          { id: 'D', text: 'Áp đặt trực tiếp chế độ cai trị thuộc địa kiểu cũ.' },
        ],
        correctIds: ['B'],
        explanation: '"Diễn biến hòa bình" là chiến lược phi vũ trang kết hợp răn đe vũ sự nhằm làm suy yếu, chuyển hóa chính trị từ nội bộ, phá hoại nền tảng tư tưởng xã hội chủ nghĩa.',
      },
      {
        text: 'Nghĩa vụ bảo vệ Tổ quốc của công dân Việt Nam được quy định như thế nào trong Hiến pháp năm 2013?',
        choices: [
          { id: 'A', text: 'Bảo vệ Tổ quốc là nghĩa vụ thiêng liêng và quyền cao quý của mọi công dân.' },
          { id: 'B', text: 'Chỉ công dân nam trong độ tuổi thanh niên mới phải có nghĩa vụ bảo vệ Tổ quốc.' },
          { id: 'C', text: 'Bảo vệ Tổ quốc chỉ là trách nhiệm riêng của sĩ quan quân đội chuyên nghiệp.' },
          { id: 'D', text: 'Bảo vệ Tổ quốc là nghĩa vụ tự nguyện, không có tính bắt buộc pháp lý.' },
        ],
        correctIds: ['A'],
        explanation: 'Điều 45 Hiến pháp năm 2013 khẳng định: "Bảo vệ Tổ quốc là nghĩa vụ thiêng liêng và quyền cao quý của công dân. Công dân phải làm nghĩa vụ quân sự và tham gia xây dựng nền quốc phòng toàn dân".',
      },
      {
        text: 'Vùng biển Việt Nam theo Công ước Liên Hợp Quốc về Luật Biển (UNCLOS 1982) và Luật Biển Việt Nam gồm bao nhiêu vùng?',
        choices: [
          { id: 'A', text: '5 vùng: Nội thủy, Lãnh hải, Vùng tiếp giáp lãnh hải, Vùng đặc quyền kinh tế và Thềm lục địa.' },
          { id: 'B', text: '3 vùng: Nội thủy, Lãnh hải và Vùng biển quốc tế.' },
          { id: 'C', text: '4 vùng: Bờ biển, Đảo ven bờ, Đảo xa bờ và Hải phận quốc gia.' },
          { id: 'D', text: '2 vùng: Vùng nước gần bờ và Vùng nước xa bờ.' },
        ],
        correctIds: ['A'],
        explanation: 'Luật Biển Việt Nam quy định vùng biển Việt Nam bao gồm: Nội thủy, Lãnh hải (12 hải lý), Vùng tiếp giáp lãnh hải (12 hải lý tiếp theo), Vùng đặc quyền kinh tế (200 hải lý) và Thềm lục địa.',
      },
      {
        text: 'Nghệ thuật quân sự Việt Nam trong lịch sử truyền thống nổi bật với nét đặc sắc cốt lõi nào?',
        choices: [
          { id: 'A', text: 'Lấy nhỏ thắng lớn, lấy ít địch nhiều, lấy trí nhân thay cường bạo.' },
          { id: 'B', text: 'Chỉ dựa vào địa hình hiểm trở cố thủ không phản công.' },
          { id: 'C', text: 'Đánh đòn tiêu hao quân sự dài hạn nhờ viện trợ bên ngoài.' },
          { id: 'D', text: 'Ưu tiên tác chiến trận địa cố định dựa vào công sự kiên cố.' },
        ],
        correctIds: ['A'],
        explanation: 'Nghệ thuật quân sự Việt Nam phát huy sức mạnh tổng hợp của cả dân tộc, kết hợp "lấy ít địch nhiều, lấy nhỏ đánh lớn", đánh giặc bằng mưu trí, dũng cảm và lòng yêu nước.',
      },
      {
        text: 'Sinh viên các trường đại học, cao đẳng khi tham gia học tập môn học GDQP&AN có quyền lợi và nghĩa vụ gì?',
        choices: [
          { id: 'A', text: 'Là môn học bắt buộc trong chương trình đào tạo, đạt yêu cầu là điều kiện để xét công nhận tốt nghiệp.' },
          { id: 'B', text: 'Là môn học tự chọn tích lũy chứng chỉ ngoại khóa không bắt buộc.' },
          { id: 'C', text: 'Được miễn học hoàn toàn nếu đã có chứng chỉ ngoại ngữ quốc tế.' },
          { id: 'D', text: 'Chỉ cần đóng học phí mà không bắt buộc phải tham gia học tập và kiểm tra.' },
        ],
        correctIds: ['A'],
        explanation: 'Luật GDQP&AN quy định GDQP&AN là môn học chính khóa trong chương trình đào tạo; sinh viên phải hoàn thành và đạt chứng chỉ GDQP&AN mới đủ điều kiện tốt nghiệp ra trường.',
      },
      {
        text: 'Biện pháp nào sau đây thể hiện tinh thần chủ động phòng ngừa, ngăn chặn từ sớm, từ xa nguy cơ chiến tranh?',
        choices: [
          { id: 'A', text: 'Kiên trì chính sách đối ngoại hòa bình, hữu nghị, thực hiện đường lối quốc phòng "4 không".' },
          { id: 'B', text: 'Gia nhập liên minh quân sự để đối đầu trực diện với các nước đối trọng.' },
          { id: 'C', text: 'Cho phép nước ngoài đặt căn cứ quân sự trên lãnh thổ Việt Nam.' },
          { id: 'D', text: 'Sử dụng vũ lực hoặc đe dọa sử dụng vũ lực trong quan hệ quốc tế.' },
        ],
        correctIds: ['A'],
        explanation: 'Sách trắng Quốc phòng Việt Nam khẳng định chính sách "4 không": không tham gia liên minh quân sự; không liên kết với nước này để chống nước kia; không cho nước ngoài đặt căn cứ quân sự; không sử dụng vũ lực hoặc đe dọa sử dụng vũ lực.',
      },
    ];

    setQuestionsLoading(true);
    try {
      for (const q of sampleQuestions) {
        await apiRequest(`/api/admin/lessons/${selectedLessonForQuestions._id}/questions`, {
          method: 'POST',
          body: JSON.stringify(q),
        });
      }
      await fetchQuestions(selectedLessonForQuestions._id);
      await fetchLessons();
      alert(`Đã nạp thành công 10 câu hỏi trắc nghiệm mẫu cho bài học!`);
    } catch (err: unknown) {
      alert((err as Error).message || 'Có lỗi khi nạp câu hỏi mẫu.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Nút quay lại trang trước */}
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin/courses'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại Quản lý Khóa học</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Học phần GDQP&AN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {courseTitle || 'Quản lý Bài học & Đề thi'}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Thiết lập video bài giảng, thời lượng, điều kiện hoàn thành và ngân hàng đề thi từng bài.
          </p>
        </div>

        <button
          onClick={handleOpenCreateLesson}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Bài Học Mới</span>
        </button>
      </div>

      {/* Danh sách Bài học */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-slate-500 text-sm">Đang tải danh sách bài học...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Chưa có bài học nào trong học phần này</h3>
          <p className="text-slate-500 text-sm mb-4">
            Hãy thêm bài học đầu tiên kèm video bài giảng và câu hỏi trắc nghiệm.
          </p>
          <button
            onClick={handleOpenCreateLesson}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Thêm bài học ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const hasEnoughQuestions = lesson.questionCount >= (lesson.totalQuestionsPerQuiz || 10);

            return (
              <div
                key={lesson._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-base flex items-center justify-center flex-shrink-0">
                    {lesson.order}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {lesson.title}
                      </h3>
                      {!lesson.active && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 font-semibold rounded-full">
                          Tạm khóa
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Thời lượng: <strong>{lesson.videoDurationSeconds > 0 ? `${Math.floor(lesson.videoDurationSeconds / 60)}p ${lesson.videoDurationSeconds % 60}s` : 'Chưa có'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Xem tối thiểu: <strong>{Math.round(lesson.minCoveragePercent * 100)}%</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        Điểm đạt: <strong>≥ {lesson.passScore}/10</strong>
                      </span>
                      {lesson.videoKey && (
                        <span className="text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          Key: {lesson.videoKey}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Badge & Action Buttons */}
                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                  {/* Badge số câu hỏi */}
                  <button
                    onClick={() => handleOpenQuestionsModal(lesson)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      hasEnoughQuestions
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <FileQuestion className="w-4 h-4" />
                    <span>
                      Ngân hàng đề: {lesson.questionCount}/{lesson.totalQuestionsPerQuiz || 10} câu
                    </span>
                    {!hasEnoughQuestions && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenVideoModal(lesson)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      lesson.videoKey
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                    title="Tải lên video hoặc cấu hình link Cloudflare R2 / CDN"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    <span>{lesson.videoKey ? 'Đổi Video' : 'Tải Video'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditLesson(lesson)}
                      title="Chỉnh sửa bài học"
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingLesson(lesson)}
                      title="Xóa bài học"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa Bài Học */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {editingLesson ? 'Chỉnh Sửa Bài Học' : 'Thêm Bài Học Mới'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Cấu hình nội dung, video chống tua lướt và tiêu chuẩn điểm trắc nghiệm.
            </p>

            {lessonError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {lessonError}
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên bài học *
                </label>
                <input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  placeholder="Ví dụ: Bài 1: Đối tượng, phương pháp nghiên cứu môn học GDQP&AN"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thứ tự bài (Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={lessonFormData.order}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Thời lượng video (phút)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonFormData.videoDurationMinutes}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, videoDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Video Key hoặc Đường dẫn video
                </label>
                <input
                  type="text"
                  value={lessonFormData.videoKey}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, videoKey: e.target.value })}
                  placeholder="Ví dụ: video-bai-1.mp4 hoặc link R2/S3..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    % Xem tối thiểu
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={lessonFormData.minCoveragePercent}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, minCoveragePercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Điểm đạt (≥ /10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={lessonFormData.passScore}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, passScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số câu / đề thi
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={lessonFormData.totalQuestionsPerQuiz}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        totalQuestionsPerQuiz: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="lessonActiveCheckbox"
                  checked={lessonFormData.active}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="lessonActiveCheckbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Kích hoạt bài học (hiển thị cho sinh viên)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  disabled={savingLesson}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingLesson ? 'Đang lưu...' : editingLesson ? 'Lưu thay đổi' : 'Tạo bài học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa Bài Học */}
      {deletingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận xóa bài học?
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa bài học <strong className="text-slate-900">{deletingLesson.title}</strong>?
              <br />
              <span className="text-red-600 font-semibold block mt-2">
                ⚠️ Toàn bộ câu hỏi trắc nghiệm, tiến độ học tập và lịch sử làm bài của sinh viên thuộc bài học này sẽ bị xóa.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingLesson(null)}
                disabled={deletingLessonLoading}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteLesson}
                disabled={deletingLessonLoading}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {deletingLessonLoading ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL QUẢN LÝ NGÂN HÀNG CÂU HỎI & LỜI GIẢI THÍCH CHO BÀI HỌC */}
      {/* ========================================================================= */}
      {selectedLessonForQuestions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header Drawer */}
            <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Ngân Hàng Câu Hỏi Trắc Nghiệm
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">
                  {selectedLessonForQuestions.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi lượt thi bốc ngẫu nhiên <strong>{selectedLessonForQuestions.totalQuestionsPerQuiz || 10} câu</strong>. Hiện có:{' '}
                  <strong className={questions.length >= (selectedLessonForQuestions.totalQuestionsPerQuiz || 10) ? 'text-emerald-700' : 'text-amber-700'}>
                    {questions.length} câu hỏi
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedLessonForQuestions(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenCreateQuestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Soạn Câu Hỏi</span>
                </button>

                <button
                  onClick={() => {
                    setQuestionImportFile(null);
                    setQuestionImportMessage(null);
                    setIsQuestionImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  title="Nạp danh sách câu hỏi trắc nghiệm từ file Excel"
                >
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Nhập từ Excel</span>
                </button>

                <a
                  href={`/api/admin/lessons/${selectedLessonForQuestions._id}/questions/export.xlsx`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                  title="Xuất toàn bộ câu hỏi của bài học này ra file Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                  <span>Xuất Excel</span>
                </a>

                <a
                  href="/api/admin/questions/template.xlsx"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-transparent rounded-xl text-xs font-semibold transition-colors"
                  title="Tải file mẫu Excel chuẩn để soạn câu hỏi"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải mẫu Excel</span>
                </a>

                <button
                  onClick={handleSeedSampleQuestions}
                  disabled={questionsLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                  title="Nạp nhanh 10 câu hỏi lý thuyết GDQP&AN mẫu chuẩn có giải thích"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nạp 10 câu mẫu</span>
                </button>
              </div>

              {questions.length < (selectedLessonForQuestions.totalQuestionsPerQuiz || 10) && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Cần tối thiểu {selectedLessonForQuestions.totalQuestionsPerQuiz || 10} câu để sinh viên bắt đầu thi (Hiện có {questions.length} câu)
                </span>
              )}
            </div>

            {/* Content Body: Danh sách câu hỏi hoặc Form Soạn câu hỏi */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Form Soạn / Chỉnh sửa câu hỏi */}
              {isQuestionFormOpen ? (
                <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">
                      {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Soạn Câu Hỏi Mới'}
                    </h3>
                    <button
                      onClick={() => setIsQuestionFormOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Đóng form
                    </button>
                  </div>

                  {questionFormError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                      {questionFormError}
                    </div>
                  )}

                  <form onSubmit={handleSaveQuestion} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nội dung câu hỏi *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={questionFormData.text}
                        onChange={(e) =>
                          setQuestionFormData({ ...questionFormData, text: e.target.value })
                        }
                        placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 4 Đáp án A, B, C, D */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                        Các phương án lựa chọn & Chọn đáp án đúng *
                      </label>
                      <div className="space-y-2.5">
                        {questionFormData.choices.map((choice, idx) => {
                          const isCorrect = questionFormData.correctId === choice.id;

                          return (
                            <div
                              key={choice.id}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/50'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer pl-1">
                                <input
                                  type="radio"
                                  name="correctChoice"
                                  checked={isCorrect}
                                  onChange={() =>
                                    setQuestionFormData({ ...questionFormData, correctId: choice.id })
                                  }
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {choice.id}
                                </span>
                              </label>

                              <input
                                type="text"
                                required
                                value={choice.text}
                                onChange={(e) => {
                                  const newChoices = [...questionFormData.choices];
                                  newChoices[idx].text = e.target.value;
                                  setQuestionFormData({ ...questionFormData, choices: newChoices });
                                }}
                                placeholder={`Nội dung đáp án ${choice.id}...`}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                              />

                              {isCorrect && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 pr-2">
                                  <Check className="w-3.5 h-3.5" /> Đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lời giải thích chi tiết khi học sinh làm sai */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        💡 Lời giải thích đáp án (Hiển thị cho sinh viên khi làm sai)
                      </label>
                      <textarea
                        rows={2}
                        value={questionFormData.explanation}
                        onChange={(e) =>
                          setQuestionFormData({ ...questionFormData, explanation: e.target.value })
                        }
                        placeholder="Giải thích căn cứ, điều luật, giáo trình hoặc lý do tại sao đáp án trên là chính xác..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsQuestionFormOpen(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={savingQuestion}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingQuestion ? 'Đang lưu...' : 'Lưu câu hỏi'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* Danh sách câu hỏi */}
              {questionsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-xs text-slate-500">Đang tải câu hỏi...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                  <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Chưa có câu hỏi nào</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Hãy bấm "Soạn Câu Hỏi Mới" hoặc "Nạp 10 câu hỏi mẫu GDQP&AN" để bắt đầu.
                  </p>
                  <button
                    onClick={handleSeedSampleQuestions}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nạp 10 câu hỏi mẫu GDQP&AN</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q._id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                            {q.text}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenEditQuestion(q)}
                            title="Sửa câu hỏi"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q._id)}
                            title="Xóa câu hỏi"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Choices */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ml-8 mb-2">
                        {q.choices.map((c) => {
                          const isCorrect = q.correctIds.includes(c.id);

                          return (
                            <div
                              key={c.id}
                              className={`p-2 rounded-lg border flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                                  : 'border-slate-100 bg-slate-50/50 text-slate-600'
                              }`}
                            >
                              <span>
                                <strong className="mr-1.5">{c.id}.</strong>
                                {c.text}
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] uppercase font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                                  Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="ml-8 mt-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                          <strong className="block mb-0.5 text-amber-950 font-semibold">
                            💡 Lời giải thích cho sinh viên:
                          </strong>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NẠP CÂU HỎI TRẮC NGHIỆM TỪ FILE EXCEL (PHASE 3) */}
      {/* ========================================================================= */}
      {isQuestionImportModalOpen && selectedLessonForQuestions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Nhập Ngân Hàng Câu Hỏi Từ Excel
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                  {selectedLessonForQuestions.title}
                </h3>
              </div>
              <button
                onClick={() => setIsQuestionImportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hướng dẫn cấu trúc cột */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Cấu trúc các cột trong file Excel (.xlsx):
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-slate-600 text-[11px]">
                <li><strong>Cột A:</strong> Nội dung câu hỏi trắc nghiệm</li>
                <li><strong>Cột B, C, D, E:</strong> Phương án lựa chọn A, B, C, D</li>
                <li><strong>Cột F:</strong> Đáp án đúng (Ghi <strong>A</strong>, <strong>B</strong>, <strong>C</strong> hoặc <strong>D</strong>)</li>
                <li><strong>Cột G:</strong> Lời giải thích chi tiết cho sinh viên khi làm sai (tùy chọn)</li>
              </ul>
              <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/80">
                <span className="text-[11px] text-slate-500">Chưa có file mẫu?</span>
                <a
                  href="/api/admin/questions/template.xlsx"
                  download
                  className="text-[11px] text-blue-700 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file mẫu Excel chuẩn GDQP&AN (.xlsx)
                </a>
              </div>
            </div>

            {questionImportMessage && (
              <div
                className={`p-3.5 mb-4 rounded-xl text-xs font-semibold border ${
                  questionImportMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {questionImportMessage.text}
              </div>
            )}

            <form onSubmit={handleImportQuestionsSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800 mb-1">
                  Chọn file Excel chứa câu hỏi từ máy tính
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Hỗ trợ định dạng .xlsx hoặc .xls (Tối đa 10MB)
                </p>

                <input
                  type="file"
                  id="questionExcelFileInput"
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setQuestionImportFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="questionExcelFileInput"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <span>Duyệt file Excel...</span>
                </label>

                {questionImportFile && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{questionImportFile.name} ({(questionImportFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionImportModalOpen(false)}
                  disabled={questionImporting}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={questionImporting || !questionImportFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{questionImporting ? 'Đang nạp câu hỏi...' : 'Bắt đầu nạp vào ngân hàng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TẢI LÊN & QUẢN LÝ VIDEO BÀI GIẢNG (PHASE 2) */}
      {/* ========================================================================= */}
      {videoModalLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Quản lý Video Bài Giảng
                </span>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {videoModalLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setVideoModalLesson(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {videoUploadError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {videoUploadError}
              </div>
            )}

            {/* Video Hiện Tại & Xem Trước */}
            {videoModalLesson.videoKey && (
              <div className="mb-6 bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                    <Film className="w-4 h-4 text-blue-400" />
                    Video đang sử dụng:
                  </span>
                  <span className="font-mono text-[11px] truncate max-w-xs text-blue-300">
                    {videoModalLesson.videoKey}
                  </span>
                </div>
                <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
                  <video
                    src={
                      videoModalLesson.videoKey.startsWith('http://') ||
                      videoModalLesson.videoKey.startsWith('https://')
                        ? videoModalLesson.videoKey
                        : `/api/student/lessons/${videoModalLesson._id}/stream`
                    }
                    controls
                    onLoadedMetadata={(e) => {
                      const dur = Math.round(e.currentTarget.duration);
                      if (dur > 0) {
                        setVideoDurationSeconds(dur);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Thời lượng video quét được:
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {videoDurationSeconds > 0
                      ? `${Math.floor(videoDurationSeconds / 60)}:${(videoDurationSeconds % 60).toString().padStart(2, '0')} (${videoDurationSeconds} giây)`
                      : 'Đang tải thông tin thời lượng...'}
                  </span>
                </div>
              </div>
            )}

            {/* Chuyển đổi tab: Tải file lên VS Chọn từ 24 video có sẵn VS Dán link Cloudflare R2 */}
            <div className="flex border-b border-slate-200 mb-5 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => {
                  setVideoTab('upload');
                  setVideoUploadError(null);
                }}
                className={`flex-1 py-2.5 font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  videoTab === 'upload'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Tải file từ máy tính
              </button>
              <button
                type="button"
                onClick={() => {
                  setVideoTab('server');
                  setVideoUploadError(null);
                  if (serverVideos.length === 0) {
                    fetchServerVideos();
                  }
                }}
                className={`flex-1 py-2.5 font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  videoTab === 'server'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Chọn video có sẵn ({serverVideos.length > 0 ? serverVideos.length : '24 video'})
              </button>
              <button
                type="button"
                onClick={() => {
                  setVideoTab('url');
                  setVideoUploadError(null);
                }}
                className={`flex-1 py-2.5 font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  videoTab === 'url'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Dùng Link R2 / S3 / HLS
              </button>
            </div>

            {/* Tab 1: Upload File */}
            {videoTab === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                  <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    Chọn video bài giảng từ máy tính của bạn
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Hỗ trợ định dạng MP4, WebM, MOV, MKV (Tối đa 500MB)
                  </p>

                  <input
                    type="file"
                    id="videoFileInput"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setVideoFile(file);
                        setVideoUploadError(null);

                        // Tự động quét thời lượng video ngay trên trình duyệt
                        const tempVideo = document.createElement('video');
                        tempVideo.preload = 'metadata';
                        tempVideo.src = URL.createObjectURL(file);
                        tempVideo.onloadedmetadata = () => {
                          URL.revokeObjectURL(tempVideo.src);
                          const dur = Math.round(tempVideo.duration);
                          if (dur > 0) {
                            setVideoDurationSeconds(dur);
                          }
                        };
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="videoFileInput"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>Duyệt chọn file video</span>
                  </label>

                  {videoFile && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  )}
                </div>

                {/* Hộp hiển thị thời lượng tự động quét */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                          Thời lượng video (Tự động quét):
                        </span>
                        <p className="text-sm font-black text-emerald-900 mt-0.5">
                          {videoDurationSeconds > 0
                            ? `${Math.floor(videoDurationSeconds / 60)} phút ${videoDurationSeconds % 60} giây (${videoDurationSeconds} giây)`
                            : videoFile
                            ? 'Đang quét thời lượng file video...'
                            : 'Chưa chọn file video'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Tự động tính % hoàn thành
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700/80 mt-2 block">
                    Hệ thống tự động quét thời lượng thực tế của file video để tính tỷ lệ xem hoàn thành (≥ 95%) cho sinh viên.
                  </span>
                </div>

                {/* Progress Bar khi đang upload */}
                {videoUploading && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Đang tải video lên máy chủ...</span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-200"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Thông báo lỗi upload hiển thị ngay cạnh nút Tải lên */}
                {videoUploadError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{videoUploadError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVideoModalLesson(null)}
                    disabled={videoUploading}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadVideoFile}
                    disabled={videoUploading || !videoFile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{videoUploading ? `Đang tải (${videoUploadProgress}%)...` : 'Tải lên ngay'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Chọn từ Video đã có sẵn trên máy chủ */}
            {videoTab === 'server' && (
              <form onSubmit={handleSelectServerVideo} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 text-xs">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-blue-700" />
                    Kho 24 video bài giảng GDQP-AN trích xuất sẵn từ VIDEO.rar
                  </p>
                  <p className="text-blue-700 text-[11px]">
                    Chọn nhanh video đã được lưu sẵn trên máy chủ mà không cần tốn thời gian tải lại từ máy tính.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Chọn video bài giảng *
                  </label>
                  {loadingServerVideos ? (
                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang tải danh sách video trên máy chủ...</span>
                    </div>
                  ) : serverVideos.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Không tìm thấy video nào trên máy chủ. Bạn có thể sử dụng tab Tải file từ máy tính.
                    </div>
                  ) : (
                    <select
                      value={selectedServerVideo}
                      onChange={(e) => {
                        const filename = e.target.value;
                        setSelectedServerVideo(filename);
                        const found = serverVideos.find((v) => v.filename === filename);
                        if (found && found.durationSeconds && found.durationSeconds > 0) {
                          setVideoDurationSeconds(found.durationSeconds);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- Chọn video bài giảng ({serverVideos.length} file sẵn có) --</option>
                      {serverVideos.map((v) => (
                        <option key={v.filename} value={v.filename}>
                          {v.filename} ({v.sizeMB} MB{v.durationFormatted ? ` - Thời lượng: ${v.durationFormatted}` : ''})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Hộp hiển thị thời lượng tự động quét */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                          Thời lượng video (Tự động nhận diện):
                        </span>
                        <p className="text-sm font-black text-emerald-900 mt-0.5">
                          {videoDurationSeconds > 0
                            ? `${Math.floor(videoDurationSeconds / 60)} phút ${videoDurationSeconds % 60} giây (${videoDurationSeconds} giây)`
                            : selectedServerVideo
                            ? 'Đang nhận diện thời lượng...'
                            : 'Vui lòng chọn video để hệ thống tự động quét thời lượng'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Tự động tính % hoàn thành
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700/80 mt-2 block">
                    Hệ thống tự động liên kết thời lượng video đã quét trên máy chủ để tính tỷ lệ xem hoàn thành (≥ 95%) cho sinh viên.
                  </span>
                </div>

                {videoUploadError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{videoUploadError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVideoModalLesson(null)}
                    disabled={videoUploading}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={videoUploading || !selectedServerVideo}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{videoUploading ? 'Đang lưu...' : 'Gán video này cho bài học'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: URL R2 / S3 / HLS */}
            {videoTab === 'url' && (
              <form onSubmit={handleSaveVideoUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Đường dẫn Video URL / Cloudflare R2 / S3 *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoUrlInput}
                    onChange={(e) => {
                      const url = e.target.value;
                      setVideoUrlInput(url);
                      if (url.startsWith('http://') || url.startsWith('https://')) {
                        const tempVideo = document.createElement('video');
                        tempVideo.preload = 'metadata';
                        tempVideo.src = url;
                        tempVideo.onloadedmetadata = () => {
                          const dur = Math.round(tempVideo.duration);
                          if (dur > 0) setVideoDurationSeconds(dur);
                        };
                      }
                    }}
                    placeholder="https://pub-xxxx.r2.dev/video-bai-1.m3u8 hoặc .mp4"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Hỗ trợ đường dẫn Cloudflare R2 (0đ egress), AWS S3 CDN, hoặc luồng phát HLS (.m3u8).
                  </span>
                </div>

                {/* Hộp hiển thị thời lượng tự động quét */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                          Thời lượng video (Tự động nhận diện):
                        </span>
                        <p className="text-sm font-black text-emerald-900 mt-0.5">
                          {videoDurationSeconds > 0
                            ? `${Math.floor(videoDurationSeconds / 60)} phút ${videoDurationSeconds % 60} giây (${videoDurationSeconds} giây)`
                            : videoUrlInput
                            ? 'Đang kết nối luồng để nhận diện thời lượng...'
                            : 'Chưa nhập URL video'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Tự động tính % hoàn thành
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700/80 mt-2 block">
                    Khi sinh viên xem video từ link này, hệ thống sẽ tự động đồng bộ thời lượng phát chuẩn để tính tỷ lệ xem hoàn thành (≥ 95%).
                  </span>
                </div>

                {videoUploadError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{videoUploadError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVideoModalLesson(null)}
                    disabled={videoUploading}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={videoUploading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{videoUploading ? 'Đang lưu...' : 'Lưu liên kết video'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
