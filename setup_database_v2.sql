-- ============================================
-- Script de Setup do Banco de Dados PostgreSQL (CORRIGIDO V2)
-- Com suporte completo a camelCase nas colunas
-- ============================================

-- Limpeza prévia (garante que comece do zero)
DROP TABLE IF EXISTS "auditLogs", "loginHistory", "announcements", "attendance", "grades", "enrollments", "subjects", "courses", "users" CASCADE;
DROP TYPE IF EXISTS role, status, course_type, course_status, subject_status, enrollment_status, grade_status, attendance_status, announcement_type, announcement_target, announcement_priority CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE course_type AS ENUM ('graduation', 'postgraduate', 'technical');
CREATE TYPE course_status AS ENUM ('active', 'inactive');
CREATE TYPE subject_status AS ENUM ('active', 'inactive');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped', 'suspended');
CREATE TYPE grade_status AS ENUM ('pending', 'approved', 'failed', 'incomplete');
CREATE TYPE attendance_status AS ENUM ('good', 'warning', 'critical');
CREATE TYPE announcement_type AS ENUM ('general', 'academic', 'financial', 'administrative');
CREATE TYPE announcement_target AS ENUM ('all', 'students', 'admins');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high');

-- TABELA: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320) UNIQUE,
    "passwordHash" TEXT,
    role role NOT NULL DEFAULT 'user',
    status status NOT NULL DEFAULT 'active',
    "passwordChangedAt" TIMESTAMP,
    "firstLoginCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "loginMethod" VARCHAR(64),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    type course_type NOT NULL DEFAULT 'graduation',
    duration INTEGER,
    status course_status NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABELA: subjects
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    "courseId" INTEGER NOT NULL,
    description TEXT,
    credits INTEGER,
    workload INTEGER,
    semester INTEGER,
    status subject_status NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE
);

-- TABELA: enrollments
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "enrollmentDate" DATE NOT NULL,
    status enrollment_status NOT NULL DEFAULT 'active',
    "currentSemester" INTEGER NOT NULL DEFAULT 1,
    "registrationNumber" VARCHAR(50) UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "courseId"),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("courseId") REFERENCES courses(id) ON DELETE CASCADE
);

-- TABELA: grades
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    "enrollmentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    "firstBimester" DECIMAL(4, 2),
    "secondBimester" DECIMAL(4, 2),
    "thirdBimester" DECIMAL(4, 2),
    "fourthBimester" DECIMAL(4, 2),
    "semesterGrade" DECIMAL(4, 2),
    "finalExam" DECIMAL(4, 2),
    "finalGrade" DECIMAL(4, 2),
    status grade_status NOT NULL DEFAULT 'pending',
    "recordedBy" INTEGER,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("enrollmentId", "subjectId", semester),
    FOREIGN KEY ("enrollmentId") REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY ("subjectId") REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- TABELA: attendance
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    "enrollmentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    "totalClasses" INTEGER NOT NULL DEFAULT 0,
    "attendedClasses" INTEGER NOT NULL DEFAULT 0,
    "attendancePercentage" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    status attendance_status NOT NULL DEFAULT 'good',
    "recordedBy" INTEGER,
    "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("enrollmentId", "subjectId", semester),
    FOREIGN KEY ("enrollmentId") REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY ("subjectId") REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY ("recordedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- TABELA: announcements
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type announcement_type NOT NULL DEFAULT 'general',
    "targetRole" announcement_target NOT NULL DEFAULT 'all',
    priority announcement_priority NOT NULL DEFAULT 'medium',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    "publishedAt" TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE CASCADE
);

-- TABELA: loginHistory
CREATE TABLE "loginHistory" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "loginTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutTime" TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- TABELA: auditLogs
CREATE TABLE "auditLogs" (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" INTEGER,
    "performedBy" INTEGER,
    changes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("performedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- ÍNDICES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_openId ON users("openId");
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_enrollments_userId ON enrollments("userId");
CREATE INDEX idx_enrollments_courseId ON enrollments("courseId");
CREATE INDEX idx_grades_enrollmentId ON grades("enrollmentId");
CREATE INDEX idx_attendance_enrollmentId ON attendance("enrollmentId");
CREATE INDEX idx_announcements_createdBy ON announcements("createdBy");

-- INSERIR ADMIN
INSERT INTO users ("openId", email, name, "passwordHash", role, status, "firstLoginCompleted", "loginMethod")
VALUES (
    'admin-default-id',
    'admin@iabfapgema.com.br',
    'Administrador IAB FAPEGMA',
    '$2b$10$QoX67tOIf9ZYmL74pSohDe5FtLFmuEBoPdSaR9fM4swIKMdrANH1a',
    'admin',
    'active',
    FALSE,
    'email'
) ON CONFLICT ("openId") DO NOTHING;

-- INSERIR CURSOS
INSERT INTO courses (name, code, description, type, duration, status)
VALUES 
    ('Administração', 'ADM-001', 'Curso de Administração', 'graduation', 48, 'active'),
    ('Pedagogia', 'PED-001', 'Curso de Pedagogia', 'graduation', 48, 'active'),
    ('História', 'HIS-001', 'Curso de História', 'graduation', 48, 'active'),
    ('Matemática', 'MAT-001', 'Curso de Matemática', 'graduation', 48, 'active'),
    ('Geografia', 'GEO-001', 'Curso de Geografia', 'graduation', 48, 'active'),
    ('Língua Portuguesa', 'LP-001', 'Curso de Língua Portuguesa', 'graduation', 48, 'active'),
    ('Inglês', 'ING-001', 'Curso de Inglês', 'graduation', 48, 'active'),
    ('Espanhol', 'ESP-001', 'Curso de Espanhol', 'graduation', 48, 'active'),
    ('Educação Física', 'EF-001', 'Pós-graduação em Educação Física', 'postgraduate', 36, 'active'),
    ('Psicopedagogia', 'PSI-001', 'Pós-graduação em Psicopedagogia', 'postgraduate', 36, 'active'),
    ('ABA', 'ABA-001', 'Pós-graduação em ABA', 'postgraduate', 36, 'active'),
    ('AEE', 'AEE-001', 'Pós-graduação em AEE', 'postgraduate', 36, 'active'),
    ('Educação Infantil', 'EI-001', 'Pós-graduação em Educação Infantil', 'postgraduate', 36, 'active'),
    ('Gestão Escolar', 'GE-001', 'Pós-graduação em Gestão Escolar', 'postgraduate', 36, 'active'),
    ('Nutrição Esportiva', 'NE-001', 'Pós-graduação em Nutrição Esportiva', 'postgraduate', 36, 'active'),
    ('Enfermagem (Técnico)', 'ENF-TEC-001', 'Curso Técnico em Enfermagem', 'technical', 24, 'active'),
    ('Técnico em Estética', 'EST-TEC-001', 'Curso Técnico em Estética', 'technical', 24, 'active'),
    ('Teologia', 'TEO-001', 'Curso de Teologia', 'technical', 24, 'active')
ON CONFLICT (code) DO NOTHING;
