CREATE TYPE "public"."announcement_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."announcement_target" AS ENUM('all', 'students', 'admins');--> statement-breakpoint
CREATE TYPE "public"."announcement_type" AS ENUM('general', 'academic', 'financial', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('good', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('graduation', 'postgraduate', 'technical');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'dropped', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."grade_status" AS ENUM('pending', 'approved', 'failed', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('pix', 'credit_card', 'bank_slip', 'cash');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."subject_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" "announcement_type" DEFAULT 'general' NOT NULL,
	"targetrole" "announcement_target" DEFAULT 'all' NOT NULL,
	"priority" "announcement_priority" DEFAULT 'medium' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"publishedat" timestamp,
	"createdby" integer NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"type" "course_type" DEFAULT 'graduation' NOT NULL,
	"duration" integer,
	"totalworkload" integer,
	"status" "course_status" DEFAULT 'active' NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userid" integer NOT NULL,
	"courseid" integer NOT NULL,
	"enrollmentdate" date NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"currentsemester" integer DEFAULT 1 NOT NULL,
	"registrationnumber" varchar(50),
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_registrationnumber_unique" UNIQUE("registrationnumber"),
	CONSTRAINT "user_course_unique" UNIQUE("userid","courseid")
);
--> statement-breakpoint
CREATE TABLE "financialSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"dailyinterestrate" varchar(10) DEFAULT '0.00' NOT NULL,
	"fixedpenaltyrate" varchar(10) DEFAULT '0.00' NOT NULL,
	"graceperioddays" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollmentid" integer NOT NULL,
	"subjectid" integer NOT NULL,
	"semester" integer NOT NULL,
	"firstbimester" numeric(4, 2),
	"secondbimester" numeric(4, 2),
	"thirdbimester" numeric(4, 2),
	"fourthbimester" numeric(4, 2),
	"status" "grade_status" DEFAULT 'pending' NOT NULL,
	"recordedby" integer,
	"recordedat" timestamp DEFAULT now() NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_subject_semester_unique" UNIQUE("enrollmentid","subjectid","semester")
);
--> statement-breakpoint
CREATE TABLE "loginHistory" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"courseid" integer NOT NULL,
	"description" text,
	"credits" integer,
	"workload" integer,
	"semester" integer NOT NULL,
	"status" "subject_status" DEFAULT 'active' NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openid" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordhash" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"passwordchangedat" timestamp,
	"firstlogincompleted" boolean DEFAULT false NOT NULL,
	"loginmethod" varchar(64),
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL,
	"lastsignedin" timestamp DEFAULT now() NOT NULL,
	"cpf" varchar(14),
	"rg" varchar(20),
	"birthdate" date,
	"address" text,
	"phone" varchar(20),
	CONSTRAINT "users_openid_unique" UNIQUE("openid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
