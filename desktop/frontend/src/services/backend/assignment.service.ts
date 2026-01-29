import { supabase } from './auth.service';

export interface Assignment {
  id: string;
  room_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  assignment_type: 'homework' | 'quiz' | 'project' | 'exam';
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  file_url?: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: string;
}

export interface CreateAssignmentData {
  room_id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  assignment_type: 'homework' | 'quiz' | 'project' | 'exam';
}

export const assignmentService = {
  async createAssignment(data: CreateAssignmentData) {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return assignment as Assignment;
  },

  async getAssignments(roomId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles (
          full_name
        ),
        submissions (count)
      `)
      .eq('room_id', roomId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAssignment(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles (
          full_name
        ),
        submissions (*)
      `)
      .eq('id', assignmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateAssignment(assignmentId: string, updates: Partial<Assignment>) {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data as Assignment;
  },

  async deleteAssignment(assignmentId: string) {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
  },

  async submitAssignment(assignmentId: string, studentId: string, content?: string, fileUrl?: string) {
    const assignment = await this.getAssignment(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const isLate = new Date() > new Date(assignment.due_date);

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        content,
        file_url: fileUrl,
        status: isLate ? 'late' : 'submitted',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Submission;
  },

  async getSubmission(assignmentId: string, studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data as Submission | null;
  },

  async getSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async gradeSubmission(submissionId: string, teacherId: string, score: number, feedback?: string) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'graded',
        score,
        feedback,
        graded_at: new Date().toISOString(),
        graded_by: teacherId,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    const submission = data as Submission;
    const assignment = await this.getAssignment(submission.assignment_id);

    if (assignment) {
      const xpEarned = Math.floor((score / assignment.total_points) * 100);
      await supabase.rpc('add_xp', {
        user_id_param: submission.student_id,
        xp_amount: xpEarned,
      });
    }

    return data as Submission;
  },

  async getStudentAssignments(studentId: string, roomId?: string) {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        submissions!inner (
          *
        )
      `)
      .eq('submissions.student_id', studentId);

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query.order('due_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getPendingSubmissions(teacherId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        assignments!inner (
          *
        ),
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('assignments.teacher_id', teacherId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return data;
  },
};
