// Базові типи
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type TimeSlot = "8:30-10:00" | "10:15-11:45" | "12:15-13:45" | "14:00-15:30" | "15:45-17:15";
type CourseType = "Lecture" | "Seminar" | "Lab" | "Practice";

// Структури даних
type Professor = {
  id: number;
  name: string;
  department: string;
};

type Classroom = {
  number: string;
  capacity: number;
  hasProjector: boolean;
};

type Course = {
  id: number;
  name: string;
  type: CourseType;
};

type Lesson = {
  courseId: number;
  professorId: number;
  classroomNumber: string;
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
};

type ScheduleConflict = {
  type: "ProfessorConflict" | "ClassroomConflict";
  lessonDetails: Lesson;
};

// Масиви даних
const professors: Professor[] = [];
const classrooms: Classroom[] = [];
const courses: Course[] = [];
const schedule: Lesson[] = [];

// Для функцій з ID
let lessonIdCounter = 0;
type LessonWithId = Lesson & { id: number };
const scheduleWithIds: LessonWithId[] = [];

function addProfessor(professor: Professor): void {
  professors.push(professor);
}

function addLesson(lesson: Lesson): boolean {
  const conflict = validateLesson(lesson);

  if (conflict !== null) {
    console.log(`Не вдалося додати заняття: ${conflict.type}`);
    return false;
  }

  schedule.push(lesson);
  scheduleWithIds.push({ ...lesson, id: lessonIdCounter++ });
  return true;
}

// Пошук та фільтрація
function findAvailableClassrooms(timeSlot: TimeSlot, dayOfWeek: DayOfWeek): string[] {
  const occupiedClassrooms = schedule
    .filter(lesson => lesson.timeSlot === timeSlot && lesson.dayOfWeek === dayOfWeek)
    .map(lesson => lesson.classroomNumber);

  return classrooms
    .filter(classroom => !occupiedClassrooms.includes(classroom.number))
    .map(classroom => classroom.number);
}

function getProfessorSchedule(professorId: number): Lesson[] {
  return schedule.filter(lesson => lesson.professorId === professorId);
}

// Валідація
function validateLesson(lesson: Lesson): ScheduleConflict | null {
  // Перевірка конфлікту професора
  const professorConflict = schedule.find(
    existingLesson =>
      existingLesson.professorId === lesson.professorId &&
      existingLesson.dayOfWeek === lesson.dayOfWeek &&
      existingLesson.timeSlot === lesson.timeSlot
  );

  if (professorConflict) {
    return {
      type: "ProfessorConflict",
      lessonDetails: professorConflict
    };
  }

  // Перевірка конфлікту аудиторії
  const classroomConflict = schedule.find(
    existingLesson =>
      existingLesson.classroomNumber === lesson.classroomNumber &&
      existingLesson.dayOfWeek === lesson.dayOfWeek &&
      existingLesson.timeSlot === lesson.timeSlot
  );

  if (classroomConflict) {
    return {
      type: "ClassroomConflict",
      lessonDetails: classroomConflict
    };
  }

  return null;
}

// Аналіз
function getClassroomUtilization(classroomNumber: string): number {
  const daysOfWeek: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots: TimeSlot[] = ["8:30-10:00", "10:15-11:45", "12:15-13:45", "14:00-15:30", "15:45-17:15"];
  const totalPossibleSlots = daysOfWeek.length * timeSlots.length;

  const occupiedSlots = schedule.filter(
    lesson => lesson.classroomNumber === classroomNumber
  ).length;

  return totalPossibleSlots > 0 ? (occupiedSlots / totalPossibleSlots) * 100 : 0;
}

function getMostPopularCourseType(): CourseType {
  const courseTypeCounts: Record<CourseType, number> = {
    "Lecture": 0,
    "Seminar": 0,
    "Lab": 0,
    "Practice": 0
  };

  schedule.forEach(lesson => {
    const course = courses.find(c => c.id === lesson.courseId);
    if (course) {
      courseTypeCounts[course.type]++;
    }
  });

  let mostPopularType: CourseType = "Lecture";
  let maxCount = 0;

  for (const courseType in courseTypeCounts) {
    const type = courseType as CourseType;
    if (courseTypeCounts[type] > maxCount) {
      maxCount = courseTypeCounts[type];
      mostPopularType = type;
    }
  }

  return mostPopularType;
}

// Модифікація
function reassignClassroom(lessonId: number, newClassroomNumber: string): boolean {
  const lessonIndex = scheduleWithIds.findIndex(lesson => lesson.id === lessonId);

  if (lessonIndex === -1) {
    console.log("Нема заняття з таким ID");
    return false;
  }

  const lesson = scheduleWithIds[lessonIndex];

  const updatedLesson: Lesson = {
    ...lesson,
    classroomNumber: newClassroomNumber
  };

  // Перевірка доступності нової аудиторії
  const otherLessons = schedule.filter(
    l => !(l.courseId === lesson.courseId &&
           l.professorId === lesson.professorId &&
           l.dayOfWeek === lesson.dayOfWeek &&
           l.timeSlot === lesson.timeSlot)
  );

  const classroomConflict = otherLessons.find(
    existingLesson =>
      existingLesson.classroomNumber === newClassroomNumber &&
      existingLesson.dayOfWeek === lesson.dayOfWeek &&
      existingLesson.timeSlot === lesson.timeSlot
  );

  if (classroomConflict) {
    console.log("Нова аудиторія зайнята в цей час");
    return false;
  }

  const scheduleIndex = schedule.findIndex(
    l => l.courseId === lesson.courseId &&
         l.professorId === lesson.professorId &&
         l.dayOfWeek === lesson.dayOfWeek &&
         l.timeSlot === lesson.timeSlot
  );

  if (scheduleIndex !== -1) {
    schedule[scheduleIndex].classroomNumber = newClassroomNumber;
  }

  scheduleWithIds[lessonIndex].classroomNumber = newClassroomNumber;

  return true;
}

function cancelLesson(lessonId: number): void {
  const lessonIndex = scheduleWithIds.findIndex(lesson => lesson.id === lessonId);

  if (lessonIndex === -1) {
    console.log("Нема заняття з таким ID");
    return;
  }

  const lesson = scheduleWithIds[lessonIndex];

  scheduleWithIds.splice(lessonIndex, 1);

  const scheduleIndex = schedule.findIndex(
    l => l.courseId === lesson.courseId &&
         l.professorId === lesson.professorId &&
         l.dayOfWeek === lesson.dayOfWeek &&
         l.timeSlot === lesson.timeSlot &&
         l.classroomNumber === lesson.classroomNumber
  );

  if (scheduleIndex !== -1) {
    schedule.splice(scheduleIndex, 1);
  }
}

// Тестування
function initializeTestData(): void {
  addProfessor({ id: 1, name: "Проф. Іваненко", department: "Кафедра програмування" });
  addProfessor({ id: 2, name: "Проф. Петренко", department: "Кафедра математики" });
  addProfessor({ id: 3, name: "Проф. Сидоренко", department: "Кафедра програмування" });

  classrooms.push(
    { number: "101", capacity: 30, hasProjector: true },
    { number: "102", capacity: 25, hasProjector: false },
    { number: "201", capacity: 40, hasProjector: true },
    { number: "202", capacity: 35, hasProjector: true }
  );

  courses.push(
    { id: 1, name: "Спеціальні мови програмування", type: "Lecture" },
    { id: 2, name: "Спеціальні мови програмування", type: "Lab" },
    { id: 3, name: "Вища математика", type: "Lecture" },
    { id: 4, name: "Вища математика", type: "Practice" },
    { id: 5, name: "Алгоритми та структури даних", type: "Seminar" }
  );

  addLesson({
    courseId: 1,
    professorId: 1,
    classroomNumber: "101",
    dayOfWeek: "Monday",
    timeSlot: "8:30-10:00"
  });

  addLesson({
    courseId: 2,
    professorId: 1,
    classroomNumber: "102",
    dayOfWeek: "Monday",
    timeSlot: "10:15-11:45"
  });

  addLesson({
    courseId: 3,
    professorId: 2,
    classroomNumber: "201",
    dayOfWeek: "Tuesday",
    timeSlot: "8:30-10:00"
  });

  addLesson({
    courseId: 4,
    professorId: 2,
    classroomNumber: "201",
    dayOfWeek: "Wednesday",
    timeSlot: "10:15-11:45"
  });

  addLesson({
    courseId: 5,
    professorId: 3,
    classroomNumber: "202",
    dayOfWeek: "Thursday",
    timeSlot: "12:15-13:45"
  });
}

function runTests(): void {
  console.log("=== ТЕСТУВАННЯ СИСТЕМИ УПРАВЛІННЯ РОЗКЛАДОМ ===\n");

  initializeTestData();

  console.log("1. Список професорів:");
  console.log(professors);

  console.log("\n2. Список аудиторій:");
  console.log(classrooms);

  console.log("\n3. Список курсів:");
  console.log(courses);

  console.log("\n4. Поточний розклад:");
  console.log(schedule);

  console.log("\n5. Пошук вільних аудиторій (Понеділок, 8:30-10:00):");
  const available = findAvailableClassrooms("8:30-10:00", "Monday");
  console.log(available);

  console.log("\n6. Розклад професора Іваненко (ID: 1):");
  const profSchedule = getProfessorSchedule(1);
  console.log(profSchedule);

  console.log("\n7. Спроба додати заняття з конфліктом (професор зайнятий):");
  const conflictResult = addLesson({
    courseId: 5,
    professorId: 1,
    classroomNumber: "201",
    dayOfWeek: "Monday",
    timeSlot: "8:30-10:00"
  });
  console.log(`Результат: ${conflictResult ? "Успішно" : "Відхилено"}`);

  console.log("\n8. Використання аудиторії 101:");
  const utilization = getClassroomUtilization("101");
  console.log(`${utilization.toFixed(2)}%`);

  console.log("\n9. Найпопулярніший тип занять:");
  const popularType = getMostPopularCourseType();
  console.log(popularType);

  console.log("\n10. Зміна аудиторії для заняття з ID 0:");
  const reassignResult = reassignClassroom(0, "202");
  console.log(`Результат: ${reassignResult ? "Успішно" : "Не вдалося"}`);
  console.log("Оновлений розклад:");
  console.log(scheduleWithIds[0]);

  console.log("\n11. Скасування заняття з ID 1:");
  cancelLesson(1);
  console.log("Кількість занять після скасування:", schedule.length);
}

runTests();
