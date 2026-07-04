"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  Award, 
  ChevronRight, 
  ArrowLeft,
  Lock,
  Trophy,
  ShieldCheck
} from "lucide-react";

export default function TrainingPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    try {
      const data = await fetchApi("/training/");
      setCourses(data);
      const certificates = await fetchApi("/assessments/certificates/me");
      setCerts(certificates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    if (course.lessons && course.lessons.length > 0) {
      // Sort lessons by order
      const sorted = [...course.lessons].sort((a, b) => a.order_number - b.order_number);
      setSelectedLesson(sorted[0]);
    } else {
      setSelectedLesson(null);
    }
    
    // Load quiz questions
    fetchApi(`/assessments/course/${course.id}`)
      .then((data) => {
        if (data && data.length > 0) {
          setQuizQuestions(data[0].questions);
          setQuizAnswers(new Array(data[0].questions.length).fill(""));
        } else {
          setQuizQuestions([]);
        }
      })
      .catch((err) => console.error("Error loading assessment", err));
      
    // Reset quiz submission state
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const handleSelectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
  };

  const handleSelectOption = (qIdx: number, val: string) => {
    const nextAnswers = [...quizAnswers];
    nextAnswers[qIdx] = val;
    setQuizAnswers(nextAnswers);
  };

  const handleQuizSubmit = async () => {
    if (quizAnswers.some(a => !a)) {
      alert("Please select answers for all questions before submitting.");
      return;
    }
    
    try {
      // Find assessment ID
      const assessmentData = await fetchApi(`/assessments/course/${selectedCourse.id}`);
      const assessmentId = assessmentData[0].id;
      
      const res = await fetchApi(`/assessments/${assessmentId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: quizAnswers })
      });
      
      setQuizResult(res);
      setQuizSubmitted(true);
      // Reload certs
      const certificates = await fetchApi("/assessments/certificates/me");
      setCerts(certificates);
    } catch (e) {
      alert("Submission failed. Please try again.");
    }
  };

  const isCompleted = (courseId: number) => {
    return certs.some(c => c.course_id === courseId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <GraduationCap className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Title */}
      {!selectedCourse && (
        <div className="p-6 rounded-xl glass-panel relative overflow-hidden border-l-4 border-cyber-primary">
          <h2 className="text-xl font-extrabold text-white">Phishing Education Center</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Complete active learning modules to unlock certifications and boost your Security Awareness Score.
          </p>
        </div>
      )}

      {!selectedCourse ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyber-textMuted">Available Courses</h3>
            <div className="flex flex-col gap-4">
              {courses.map((course) => {
                const completed = isCompleted(course.id);
                return (
                  <div 
                    key={course.id} 
                    className={`p-5 rounded-xl glass-panel flex justify-between items-center border transition-all ${
                      completed ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-cyber-cardBorder hover:border-cyber-primary/30'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${
                          course.difficulty === 'Beginner' ? 'bg-cyber-primary/10 text-cyber-primary' : 'bg-cyber-secondary/10 text-cyber-secondary'
                        }`}>
                          {course.difficulty}
                        </span>
                        {completed && (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white leading-tight mt-1">{course.title}</h4>
                      <p className="text-xs text-cyber-textMuted leading-relaxed line-clamp-2">{course.description}</p>
                    </div>

                    <button
                      onClick={() => handleSelectCourse(course)}
                      className="p-2.5 rounded-lg bg-slate-900 border border-cyber-cardBorder text-slate-400 hover:text-cyber-primary hover:border-cyber-primary/30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificates Board */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyber-textMuted">My Certificates</h3>
            <div className="p-6 rounded-xl glass-panel flex flex-col gap-4">
              {certs.length > 0 ? (
                certs.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg bg-slate-900/60 border border-emerald-500/10 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-white truncate">{c.course_title}</h5>
                      <span className="text-[9px] text-cyber-textMuted block font-mono mt-1">ID: {c.certificate_code}</span>
                      <span className="text-[9px] text-emerald-400 font-bold block mt-1">Issued: {new Date(c.issue_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <Award className="w-8 h-8 text-slate-600 animate-pulse" />
                  <p className="text-[11px] text-cyber-textMuted px-4">Pass your course assessments to secure verification credentials.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Course Workspace */
        <div className="flex flex-col gap-6 h-full">
          {/* Workspace Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
              className="flex items-center gap-1 text-xs text-cyber-primary hover:underline font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </button>
            <span className="text-xs text-slate-500 font-bold">/</span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-sm">{selectedCourse.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
            {/* Left Nav: Lessons index & Quiz triggers */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <h4 className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Course Modules</h4>
              <div className="flex flex-col gap-2">
                {selectedCourse.lessons?.map((lesson: any) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`flex items-center justify-between text-left p-3 rounded-lg text-xs font-bold border transition-all ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary'
                        : 'bg-slate-900 border-cyber-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{lesson.title}</span>
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                  </button>
                ))}
                
                {/* Assessment trigger button */}
                {quizQuestions.length > 0 && (
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className={`flex items-center justify-between text-left p-3 rounded-lg text-xs font-bold border transition-all mt-4 ${
                      !selectedLesson
                        ? 'bg-cyber-secondary/15 border-cyber-secondary/30 text-cyber-secondary'
                        : 'bg-slate-900 border-cyber-cardBorder text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Final Assessment Quiz</span>
                    <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Content viewport (Lesson content or quiz sheet) */}
            <div className="lg:col-span-3 p-6 rounded-xl glass-panel flex flex-col justify-between min-h-[400px]">
              {selectedLesson ? (
                /* Lesson reader */
                <div className="flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyber-primary tracking-widest block mb-1">
                      Lesson {selectedLesson.order_number}
                    </span>
                    <h3 className="text-base font-extrabold text-white">{selectedLesson.title}</h3>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line border-t border-cyber-cardBorder pt-6">
                    {selectedLesson.content}
                  </div>
                </div>
              ) : (
                /* Quiz sheet */
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-cyber-secondary" />
                      Course Assessment Verification Quiz
                    </h3>
                    <p className="text-[10px] text-cyber-textMuted mt-1">
                      Pass with 70% or more to earn credentials and points.
                    </p>
                  </div>

                  {quizSubmitted ? (
                    /* Quiz score response dashboard */
                    <div className="flex flex-col items-center text-center gap-4 py-8">
                      <div className={`p-4 rounded-full border ${
                        quizResult?.passed 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          {quizResult?.passed ? "Assessment Verified Successfully!" : "Verification Failed"}
                        </h4>
                        <span className="text-[10px] text-cyber-textMuted block mt-1">Score Obtained: {quizResult?.score}%</span>
                      </div>

                      {quizResult?.passed ? (
                        <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-cyber-cardBorder text-left max-w-md w-full">
                          <p className="text-[10px] text-cyber-textMuted">Issued Certificate Authority Code:</p>
                          <code className="text-xs font-mono font-bold text-cyber-primary block mt-1 select-all text-center">{quizResult.certificate_code}</code>
                          <div className="flex gap-2 items-center text-[10px] text-emerald-400 font-bold mt-4 justify-center">
                            <Trophy className="w-3.5 h-3.5" /> +250 points awarded to security profile
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setQuizAnswers(new Array(quizQuestions.length).fill(""));
                            setQuizSubmitted(false);
                            setQuizResult(null);
                          }}
                          className="mt-4 px-4 py-2 bg-rose-500 text-white font-bold text-[10px] rounded-lg"
                        >
                          Retry Verification
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Active questions list */
                    <div className="flex flex-col gap-8 border-t border-cyber-cardBorder pt-6">
                      {quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-slate-200">
                            {qIdx + 1}. {q.question}
                          </h4>
                          <div className="flex flex-col gap-2 pl-4">
                            {q.options?.map((option: string) => {
                              const isSelected = quizAnswers[qIdx] === option;
                              return (
                                <button
                                  key={option}
                                  onClick={() => handleSelectOption(qIdx, option)}
                                  className={`text-left px-4 py-2.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                    isSelected 
                                      ? 'bg-cyber-secondary/10 border-cyber-secondary/40 text-cyber-secondary' 
                                      : 'bg-slate-900/50 border-cyber-cardBorder text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleQuizSubmit}
                        className="py-3 bg-cyber-secondary text-white font-bold rounded-lg text-xs hover:bg-cyber-secondary/80 transition-all uppercase tracking-wider"
                      >
                        Submit Verification Answers
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Bottom guide */}
              {selectedLesson && (
                <div className="mt-8 pt-4 border-t border-cyber-cardBorder/30 flex justify-between">
                  <span className="text-[10px] text-cyber-textMuted">Read fully before attempting quiz.</span>
                  <button 
                    onClick={() => {
                      const idx = selectedCourse.lessons.findIndex((l: any) => l.id === selectedLesson.id);
                      if (idx < selectedCourse.lessons.length - 1) {
                        setSelectedLesson(selectedCourse.lessons[idx + 1]);
                      } else {
                        // Go to quiz
                        setSelectedLesson(null);
                      }
                    }}
                    className="text-xs text-cyber-primary font-bold flex items-center hover:underline"
                  >
                    Next Segment <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
